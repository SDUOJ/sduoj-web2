import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ClockCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import AIWorkspaceNav from './AIWorkspaceNav';
import { UrlPrefix } from '../../../Config/constValue';
import { interviewApi, InterviewResource, MediaTrack, operationKey } from './interview-api';
import './interview-workbench.css';

const statusText: Record<string, string> = {
  pending: '待开始',
  running: '生成问题',
  awaiting_answer: '待回答',
  completed: '待复核',
  expired: '已过期',
  cancelled: '已取消',
  adopted: '已采用',
  rejected: '已退回',
  approved: '已批准',
  failed: '失败',
};

const statusColor: Record<string, string> = {
  pending: 'blue',
  running: 'processing',
  awaiting_answer: 'gold',
  completed: 'green',
  expired: 'default',
  cancelled: 'default',
  adopted: 'green',
  rejected: 'red',
  approved: 'cyan',
  failed: 'red',
};

function visibleStatus(row: InterviewResource) {
  if (['adopted', 'rejected', 'approved', 'failed'].includes(row.state)) return row.state;
  return row.effective_status;
}

function canRenew(row: InterviewResource) {
  return (
    row.role === 'teacher' &&
    (['expired', 'cancelled'].includes(row.effective_status) || row.state === 'rejected')
  );
}

type Scope = 'all' | 'assigned' | 'managed';

export default function InterviewWorkbench({ location }: { location?: { search?: string } }) {
  const history = useHistory();
  const [form] = Form.useForm();
  const nativeSource = Form.useWatch('bindNative', form);
  const [rows, setRows] = useState<InterviewResource[]>([]);
  const [scope, setScope] = useState<Scope>('all');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [error, setError] = useState('');
  const loadSequence = useRef(0);

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError('');
    try {
      const result = await interviewApi.list(page, scope, status || undefined);
      if (sequence === loadSequence.current) {
        setRows(result.rows);
        setTotal(result.totalNum);
      }
    } catch (reason) {
      if (sequence === loadSequence.current) setError(String(reason));
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [page, scope, status]);

  useEffect(() => {
    void load();
    return () => {
      loadSequence.current += 1;
    };
  }, [load]);

  async function invite() {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    setBusy(true);
    setError('');
    try {
      const result = await interviewApi.invite({
        operation_key: operationKey('invite'),
        student_id: String(values.studentId),
        student_username: values.studentUsername,
        title: values.title,
        question: values.question || '',
        code: values.code || '',
        language: values.language || '',
        report: values.report || '',
        rubric: values.rubric,
        max_questions: values.maxQuestions,
        duration_minutes: values.durationMinutes,
        expires_in_hours: values.expiresInHours,
        required_tracks: values.requiredTracks as MediaTrack[],
        psid: values.psid || undefined,
        course_id: values.courseId || undefined,
        native_source: values.bindNative
          ? {
              gid: values.gid,
              pid: values.pid,
              student_username: values.studentUsername,
            }
          : undefined,
      });
      setInviteOpen(false);
      form.resetFields();
      history.push(`${UrlPrefix}/practice/interviews/${result.id}`);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function renew(row: InterviewResource) {
    setBusy(true);
    try {
      const result = await interviewApi.renew(row.id, row.version, 72);
      history.push(`${UrlPrefix}/practice/interviews/${result.id}`);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout className="ai-interview-shell">
      <AIWorkspaceNav />
      <main className="ai-interview-main">
        <header className="ai-interview-header">
          <div>
            <Typography.Title level={2}>实验验收</Typography.Title>
            <Typography.Text type="secondary">{total} 场验收</Typography.Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              aria-label="刷新"
              loading={loading}
              onClick={() => void load()}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setInviteOpen(true)}>
              发起验收
            </Button>
          </Space>
        </header>

        {error && (
          <Alert showIcon closable type="error" message={error} onClose={() => setError('')} />
        )}

        <div className="ai-interview-toolbar">
          <Segmented<Scope>
            value={scope}
            options={[
              { label: '全部', value: 'all' },
              { label: '分配给我', value: 'assigned' },
              { label: '我发起的', value: 'managed' },
            ]}
            onChange={(value: Scope) => {
              setScope(value);
              setPage(1);
            }}
          />
          <Select
            aria-label="验收状态"
            value={status || undefined}
            allowClear
            placeholder="全部状态"
            style={{ width: 160 }}
            options={[
              { value: 'pending', label: '待开始' },
              { value: 'running', label: '生成问题' },
              { value: 'awaiting_answer', label: '待回答' },
              { value: 'completed', label: '已完成回答' },
              { value: 'expired', label: '已过期' },
              { value: 'cancelled', label: '已取消' },
              { value: 'approved', label: '已复核通过' },
              { value: 'rejected', label: '已驳回' },
              { value: 'adopted', label: '成绩已采用' },
              { value: 'failed', label: '任务失败' },
            ]}
            onChange={(value) => {
              setStatus(value || '');
              setPage(1);
            }}
          />
        </div>

        <Table<InterviewResource>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          className="ai-interview-table"
          onRow={(row) => ({
            onClick: () => history.push(`${UrlPrefix}/practice/interviews/${row.id}`),
          })}
          pagination={{
            current: page,
            pageSize: 20,
            total,
            showSizeChanger: false,
            onChange: setPage,
          }}
          columns={[
            {
              title: '验收',
              key: 'title',
              render: (_, row) => (
                <div className="ai-interview-title-cell">
                  <Typography.Text strong>{row.data.title}</Typography.Text>
                  <Typography.Text type="secondary">
                    {row.data.student_username} · {row.data.student_id}
                  </Typography.Text>
                </div>
              ),
            },
            {
              title: '身份',
              dataIndex: 'role',
              width: 100,
              render: (role: InterviewResource['role']) => (role === 'student' ? '学生' : '教师'),
            },
            {
              title: '截止时间',
              key: 'expires',
              width: 190,
              render: (_, row) => (
                <Space size={6}>
                  <ClockCircleOutlined />
                  {new Date(row.data.expires_at).toLocaleString()}
                </Space>
              ),
            },
            {
              title: '状态',
              key: 'status',
              width: 120,
              render: (_, row) => (
                <Tag color={statusColor[visibleStatus(row)]}>
                  {statusText[visibleStatus(row)] || visibleStatus(row)}
                </Tag>
              ),
            },
            {
              title: '',
              key: 'action',
              width: 116,
              render: (_, row) =>
                canRenew(row) ? (
                  <Button
                    size="small"
                    disabled={busy}
                    onClick={(event) => {
                      event.stopPropagation();
                      void renew(row);
                    }}
                  >
                    重新邀请
                  </Button>
                ) : (
                  <RightOutlined aria-label="打开验收" />
                ),
            },
          ]}
        />
      </main>

      <Modal
        title="发起实验验收"
        open={inviteOpen}
        width={760}
        onCancel={() => !busy && setInviteOpen(false)}
        onOk={() => void invite()}
        confirmLoading={busy}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            psid: Number(new URLSearchParams(location?.search).get('psid')) || undefined,
            courseId: Number(new URLSearchParams(location?.search).get('course_id')) || undefined,
            maxQuestions: 6,
            durationMinutes: 20,
            expiresInHours: 72,
            requiredTracks: ['video'],
            rubric: [
              { name: '实现正确性', max_score: 60 },
              { name: '理解与表达', max_score: 40 },
            ],
            bindNative: false,
          }}
        >
          <Alert
            type="info"
            showIcon
            message="验收证据可见范围"
            description="回答与媒体仅供受邀学生本人及具有当前课程或题单权限的教师验收复核；保留期限遵循平台配置。"
          />
          <div className="ai-interview-form-grid">
            <Form.Item name="title" label="验收名称" rules={[{ required: true }]}>
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item name="studentUsername" label="学生用户名" rules={[{ required: true }]}>
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item
              name="studentId"
              label="学生 ID"
              rules={[{ required: true, pattern: /^\d+$/ }]}
            >
              <Input maxLength={64} />
            </Form.Item>
            <Form.Item name="language" label="编程语言">
              <Input maxLength={40} />
            </Form.Item>
            <Form.Item name="psid" label="题单 ID">
              <InputNumber min={1} precision={0} />
            </Form.Item>
            <Form.Item name="courseId" label="课程 ID">
              <InputNumber min={1} precision={0} />
            </Form.Item>
            <Form.Item name="maxQuestions" label="最多问题" rules={[{ required: true }]}>
              <InputNumber min={1} max={20} precision={0} />
            </Form.Item>
            <Form.Item name="durationMinutes" label="限时（分钟）" rules={[{ required: true }]}>
              <InputNumber min={1} max={120} precision={0} />
            </Form.Item>
            <Form.Item
              name="expiresInHours"
              label="邀请有效期（小时）"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={720} precision={0} />
            </Form.Item>
            <Form.Item name="requiredTracks" label="必需媒体" rules={[{ required: true }]}>
              <Checkbox.Group
                options={[
                  { label: '摄像头', value: 'video' },
                  { label: '麦克风', value: 'audio' },
                  { label: '屏幕', value: 'screen' },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item name="question" label="实验题目">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
          </Form.Item>
          <Form.Item name="code" label="代码">
            <Input.TextArea
              className="ai-interview-code-input"
              autoSize={{ minRows: 3, maxRows: 10 }}
            />
          </Form.Item>
          <Form.Item name="report" label="实验报告">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 10 }} />
          </Form.Item>
          <div className="ai-interview-native-toggle">
            <Typography.Text strong>绑定原生主观题答题卡</Typography.Text>
            <Form.Item name="bindNative" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
          {nativeSource && (
            <div className="ai-interview-form-grid">
              <Form.Item name="gid" label="题组 ID" rules={[{ required: true }]}>
                <InputNumber min={1} precision={0} />
              </Form.Item>
              <Form.Item name="pid" label="主观题 ID" rules={[{ required: true }]}>
                <InputNumber min={1} precision={0} />
              </Form.Item>
            </div>
          )}
          {!nativeSource && (
            <Form.List name="rubric">
              {(fields, { add, remove }) => (
                <div className="ai-interview-rubric-editor">
                  <div className="ai-interview-row-heading">
                    <Typography.Text strong>评分项</Typography.Text>
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => add({ name: '', max_score: 10 })}
                    >
                      添加
                    </Button>
                  </div>
                  {fields.map((field) => (
                    <Space key={field.key} align="baseline">
                      <Form.Item
                        {...field}
                        key={`${field.key}-name`}
                        name={[field.name, 'name']}
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="评分项" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        key={`${field.key}-score`}
                        name={[field.name, 'max_score']}
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={0.1} max={10000} placeholder="满分" />
                      </Form.Item>
                      <Button danger type="text" onClick={() => remove(field.name)}>
                        删除
                      </Button>
                    </Space>
                  ))}
                </div>
              )}
            </Form.List>
          )}
        </Form>
      </Modal>
    </Layout>
  );
}
