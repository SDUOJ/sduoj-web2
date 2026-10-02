import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  AgentAction,
  AgentPreset,
  AgentSession,
  managementAgent,
} from '../../../Utils/API/management-agent';
import './intelligent-management.css';

const labels: Record<string, string> = {
  ready: '就绪',
  running: '执行中',
  approval: '等待确认',
  disconnected: '已断开',
  pending: '等待确认',
  executing: '正在执行',
  completed: '已完成',
  rejected: '已拒绝',
  failed: '失败 / 待核对',
  expired: '已失效',
  unknown: '结果待核对',
};
export default function IntelligentManagement() {
  const [rows, setRows] = useState<
    Array<Pick<AgentSession, 'id' | 'title' | 'state' | 'updated_at'>>
  >([]);
  const [presets, setPresets] = useState<AgentPreset[]>([]);
  const [session, setSession] = useState<AgentSession>();
  const [selected, setSelected] = useState('');
  const [creating, setCreating] = useState(false);
  const [approval, setApproval] = useState<AgentAction>();
  const [message, setMessage] = useState('');
  const [keyword, setKeyword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form] = Form.useForm();
  const preset = Form.useWatch('preset', form);
  const generation = useRef(0);
  async function refresh() {
    setRows(await managementAgent.list());
  }
  useEffect(() => {
    let active = true;
    Promise.all([managementAgent.list(), managementAgent.presets()])
      .then(([list, choices]) => {
        if (active) {
          setRows(list);
          setPresets(choices);
        }
      })
      .catch((reason) => {
        if (active) setError(String(reason));
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const version = ++generation.current;
    if (!selected) {
      setSession(undefined);
      return;
    }
    let active = true;
    let loading = false;
    const load = async () => {
      if (loading) return;
      loading = true;
      try {
        const value = await managementAgent.detail(selected);
        if (active && version === generation.current) setSession(value);
      } catch (reason) {
        if (active) setError(String(reason));
      } finally {
        loading = false;
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 1500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selected]);
  async function perform(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await action();
      await refresh();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }
  const running = session && ['running', 'approval'].includes(session.state);
  return (
    <Card
      size="small"
      title="智能管理"
      extra={
        <Space>
          {selected && (
            <Button
              icon={<ArrowLeftOutlined />}
              disabled={busy}
              onClick={() => {
                setSelected('');
                setApproval(undefined);
                void refresh();
              }}
            >
              会话列表
            </Button>
          )}
          <Button
            aria-label="刷新"
            icon={<ReloadOutlined />}
            onClick={() => void perform(refresh)}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={busy}
            onClick={() => setCreating(true)}
          >
            新建
          </Button>
        </Space>
      }
    >
      {error && (
        <Alert type="error" message={error} showIcon closable onClose={() => setError('')} />
      )}
      {!selected ? (
        <>
          <div className="management-search">
            <Input.Search placeholder="搜索我的会话" allowClear onSearch={setKeyword} />
          </div>
          <Table
            size="small"
            rowKey="id"
            dataSource={rows.filter((row) => row.title.includes(keyword))}
            pagination={{ pageSize: 20 }}
            columns={[
              { title: '会话名称', dataIndex: 'title' },
              { title: '状态', render: (_, row) => <Tag>{labels[row.state] || row.state}</Tag> },
              {
                title: '更新时间',
                render: (_, row) => new Date(row.updated_at + 'Z').toLocaleString(),
              },
              {
                title: '操作',
                render: (_, row) => (
                  <Button
                    type="link"
                    onClick={() => {
                      setSelected(row.id);
                      setSession(undefined);
                      setMessage('');
                    }}
                  >
                    继续会话
                  </Button>
                ),
              },
            ]}
          />
        </>
      ) : session ? (
        <div className="management-conversation">
          <aside>
            <List
              size="small"
              header="我的会话"
              dataSource={rows}
              renderItem={(row) => (
                <List.Item>
                  <Button
                    type={selected === row.id ? 'primary' : 'text'}
                    block
                    disabled={busy}
                    onClick={() => {
                      if (selected === row.id) return;
                      setSelected(row.id);
                      setSession(undefined);
                      setApproval(undefined);
                      setMessage('');
                    }}
                  >
                    {row.title}
                  </Button>
                </List.Item>
              )}
            />
          </aside>
          <section className="management-thread">
            <Space>
              <Typography.Title level={5}>{session.title}</Typography.Title>
              <Tag>{labels[session.state]}</Tag>
            </Space>
            <Collapse
              size="small"
              items={[
                {
                  key: 'instructions',
                  label: '预设说明与步骤',
                  children: (
                    <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                      {session.instructions}
                    </Typography.Paragraph>
                  ),
                },
              ]}
            />
            {session.plan.length > 0 && (
              <Steps
                direction="vertical"
                size="small"
                items={session.plan.map((step) => ({
                  title: step.step,
                  status:
                    step.status === 'completed'
                      ? 'finish'
                      : step.status === 'inProgress'
                        ? 'process'
                        : 'wait',
                }))}
              />
            )}
            <div className="management-messages" aria-live="polite">
              {!session.events.length && (
                <Empty description="描述管理目标，Agent 将按预设步骤提出计划和操作。" />
              )}
              {session.events.map((entry) => (
                <Card
                  size="small"
                  key={entry.id}
                  className={`management-message management-message-${entry.kind}`}
                  title={
                    { user: '我', assistant: 'Agent', error: '执行异常', system: '系统' }[
                      entry.kind
                    ] || entry.kind
                  }
                >
                  <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                    {entry.text}
                  </Typography.Paragraph>
                </Card>
              ))}
              {session.stream && (
                <Card size="small" title="Agent">
                  <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                    {session.stream}
                  </Typography.Paragraph>
                </Card>
              )}
              {session.actions.map((action) => (
                <Card
                  size="small"
                  key={action.id}
                  title={
                    <Space>
                      <Tag color={action.status === 'pending' ? 'warning' : undefined}>
                        {labels[action.status]}
                      </Tag>
                      {action.action.method === 'GET' ? '读取数据' : '提交操作'}
                    </Space>
                  }
                >
                  <Typography.Paragraph>{action.action.reason}</Typography.Paragraph>
                  <Typography.Text code>
                    {action.action.method} {action.action.path}
                  </Typography.Text>
                  <pre className="management-parameters">
                    {JSON.stringify(action.action.arguments, null, 2)}
                  </pre>
                  {action.status === 'pending' && (
                    <Space>
                      <Button type="primary" disabled={busy} onClick={() => setApproval(action)}>
                        审阅并确认
                      </Button>
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void perform(async () => {
                            await managementAgent.decide(session.id, action, false);
                            setSession(await managementAgent.detail(session.id));
                          })
                        }
                      >
                        拒绝
                      </Button>
                    </Space>
                  )}
                  {action.result !== undefined && (
                    <Collapse
                      size="small"
                      items={[
                        {
                          key: 'result',
                          label: '执行结果',
                          children: (
                            <pre className="management-parameters">
                              {JSON.stringify(action.result, null, 2)}
                            </pre>
                          ),
                        },
                      ]}
                    />
                  )}
                </Card>
              ))}
            </div>
            <Input.TextArea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="描述管理目标或继续补充要求；聊天中的同意不会代替操作确认"
              disabled={busy}
            />
            <Space>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={busy}
                disabled={!message.trim() || Boolean(running)}
                onClick={() =>
                  void perform(async () => {
                    await managementAgent.message(session.id, message);
                    setMessage('');
                    setSession(await managementAgent.detail(session.id));
                  })
                }
              >
                发送
              </Button>
              {running && (
                <Button
                  icon={<StopOutlined />}
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      await managementAgent.stop(session.id);
                      setSession(await managementAgent.detail(session.id));
                    })
                  }
                >
                  停止
                </Button>
              )}
            </Space>
          </section>
        </div>
      ) : (
        <Card loading />
      )}
      <Modal
        title="新建会话"
        open={creating}
        confirmLoading={busy}
        okText="新建"
        cancelText="取消"
        onCancel={() => setCreating(false)}
        onOk={() =>
          void form
            .validateFields()
            .then((values) =>
              perform(async () => {
                const value = await managementAgent.create(values);
                setSelected(value.id);
                setSession(value);
                setCreating(false);
                form.resetFields();
              }),
            )
            .catch(() => undefined)
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ preset: 'programming', instructions: '' }}
        >
          <Form.Item
            name="title"
            label="会话名称"
            rules={[{ required: true, whitespace: true, max: 100 }]}
          >
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="preset" label="预设流程" rules={[{ required: true }]}>
            <Select options={presets.map((item) => ({ value: item.id, label: item.title }))} />
          </Form.Item>
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            {presets.find((item) => item.id === preset)?.instructions}
          </Typography.Paragraph>
          <Form.Item name="instructions" label="补充说明" rules={[{ max: 12000 }]}>
            <Input.TextArea rows={4} maxLength={12000} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="确认执行本次操作"
        open={Boolean(approval)}
        okText="确认执行"
        cancelText="返回检查"
        confirmLoading={busy}
        onCancel={() => setApproval(undefined)}
        onOk={() => {
          if (!approval || !session) return;
          void perform(async () => {
            await managementAgent.decide(session.id, approval, true);
            setApproval(undefined);
            setSession(await managementAgent.detail(session.id));
          });
        }}
      >
        <Alert
          showIcon
          type="warning"
          message="将使用你当前的管理员登录身份执行以下操作"
          description="本次确认仅对下方操作和参数有效，后续操作仍需逐项确认。"
        />
        <Typography.Paragraph>{approval?.action.reason}</Typography.Paragraph>
        <Typography.Text code>
          {approval?.action.method} {approval?.action.path}
        </Typography.Text>
        <pre className="management-parameters">
          {JSON.stringify(approval?.action.arguments, null, 2)}
        </pre>
      </Modal>
    </Card>
  );
}
