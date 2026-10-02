import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  CheckOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';
import AIWorkspaceNav from './AIWorkspaceNav';
import AITaskMonitor from './AITaskMonitor';
import { aiPlatform, PlatformResource } from '../../../Utils/API/ai-platform';
import { positiveIntParam, textParam } from './route-context';

type Candidate = {
  judgeLog: Array<{ name: string; score: number; jScore: number }>;
  judgeComment: string;
  evaluation?: { confidence: number; criteria: Array<{ name: string; evidence: string }> };
  source?: {
    psid: number;
    gid: number;
    pid: number;
    username: string;
    asd_id: number;
  };
};

const stateLabels: Record<string, string> = {
  pending: '生成中',
  review: '待复核',
  approved: '已批准',
  adopted: '已采用',
  failed: '生成失败',
};

function operationKey(prefix: string) {
  const value =
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${value}`.slice(0, 96);
}

export default function GradingWorkbench({ location }: { location?: { search?: string } }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [resources, setResources] = useState<PlatformResource[]>([]);
  const [current, setCurrent] = useState<PlatformResource>();
  const [task, setTask] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [requestForm] = Form.useForm();
  const [gradeForm] = Form.useForm();
  const candidate = current?.data.candidate as Candidate | undefined;
  const conflict = /conflict|changed|变化|冲突|重新评估|re-evaluate/i.test(error);
  const refresh = async () => setResources((await aiPlatform.list('grading')).rows);
  useEffect(() => {
    void refresh().catch((reason) => setError(String(reason)));
  }, []);
  async function select(id: string) {
    const row = await aiPlatform.get(id);
    setCurrent(row);
    const value = row.data.candidate as Candidate | undefined;
    gradeForm.setFieldsValue({
      criteria: value?.judgeLog?.map((item) => ({ name: item.name, score: item.jScore })),
      comment: value?.judgeComment,
      reason: '',
      overwrite: false,
    });
    if (typeof row.data.candidate_job_id === 'string') setTask(row.data.candidate_job_id);
  }
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await refresh();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="ai-workspace">
      <div className="ai-workspace-body">
        <AIWorkspaceNav />
        <div className="ai-workspace-heading">
          <Typography.Title level={3}>主观题批阅</Typography.Title>
          <Space>
            <Button aria-label="刷新" icon={<ReloadOutlined />} onClick={() => void act(refresh)} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              新建
            </Button>
          </Space>
        </div>
        {error && <Alert type="error" showIcon message={error} />}
        {conflict && (
          <Alert
            type="warning"
            showIcon
            message="候选、原答案或人工成绩已发生变化"
            description="刷新后重新生成或复核；系统没有覆盖原生答题卡。"
          />
        )}
        {notice && <Alert type="success" showIcon message={notice} />}
        <div className="ai-workspace-columns">
          <section>
            <Modal
              title="新建批阅"
              open={createOpen}
              onCancel={() => setCreateOpen(false)}
              footer={null}
              forceRender
            >
              <Form
                form={requestForm}
                layout="vertical"
                initialValues={{
                  psid: positiveIntParam(location?.search, 'psid'),
                  gid: positiveIntParam(location?.search, 'gid'),
                  pid: positiveIntParam(location?.search, 'pid'),
                  username: textParam(location?.search, 'username'),
                }}
                onFinish={(values) =>
                  void act(async () => {
                    const operation_key =
                      requestForm.getFieldValue('operation_key') || operationKey('grade');
                    requestForm.setFieldValue('operation_key', operation_key);
                    const result = await aiPlatform.gradeNative({ ...values, operation_key });
                    setCreateOpen(false);
                    setTask(result.taskId);
                    setCurrent(await aiPlatform.get(result.resource_id));
                    requestForm.setFieldValue('operation_key', undefined);
                  })
                }
              >
                <Form.Item name="psid" label="题单 ID" rules={[{ required: true }]}>
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item name="gid" label="主观题组 ID" rules={[{ required: true }]}>
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item name="pid" label="题目 ID" rules={[{ required: true }]}>
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item name="username" label="学生 OJ 用户名" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="operation_key" hidden>
                  <Input />
                </Form.Item>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={busy}>
                  生成候选评分
                </Button>
              </Form>
            </Modal>
            <Table<PlatformResource>
              size="small"
              rowKey="id"
              dataSource={resources}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: '评分候选', render: (_, row) => row.id.slice(0, 8) },
                { title: '状态', render: (_, row) => stateLabels[row.state] || row.state },
                {
                  title: '操作',
                  render: (_, row) => (
                    <Button type="link" onClick={() => void act(() => select(row.id))}>
                      查看
                    </Button>
                  ),
                },
              ]}
            />
          </section>
          <section>
            {current && (
              <Space wrap>
                <Typography.Title level={4}>评分候选</Typography.Title>
                <Tag>{stateLabels[current.state] || current.state}</Tag>
                <Tag>v{current.version}</Tag>
              </Space>
            )}
            {candidate?.source && (
              <Descriptions size="small" bordered column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="学生">{candidate.source.username}</Descriptions.Item>
                <Descriptions.Item label="答题明细">{candidate.source.asd_id}</Descriptions.Item>
                <Descriptions.Item label="题单 / 题组">
                  {candidate.source.psid} / {candidate.source.gid}
                </Descriptions.Item>
                <Descriptions.Item label="题目">{candidate.source.pid}</Descriptions.Item>
              </Descriptions>
            )}
            {candidate?.evaluation && (
              <Alert
                type={candidate.evaluation.confidence < 0.7 ? 'warning' : 'info'}
                showIcon
                message={`AI 候选置信度 ${Math.round(candidate.evaluation.confidence * 100)}%`}
                description="候选分不会自动写入；教师逐项复核并采用后才会修改原生成绩。"
              />
            )}
            {candidate?.judgeLog && (
              <Form
                form={gradeForm}
                layout="vertical"
                onFinish={(values) =>
                  void act(async () => {
                    if (!current) return;
                    await aiPlatform.editGrade(
                      current,
                      values.criteria,
                      values.comment,
                      values.reason,
                    );
                    await select(current.id);
                    setNotice('候选评分已修订，正式成绩尚未采用');
                  })
                }
              >
                <Table
                  rowKey="name"
                  pagination={false}
                  dataSource={candidate.judgeLog}
                  columns={[
                    { title: '评分项', dataIndex: 'name' },
                    { title: '满分', dataIndex: 'score' },
                    {
                      title: '候选分',
                      render: (_, row, index) => (
                        <>
                          <Form.Item name={['criteria', index, 'name']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item
                            name={['criteria', index, 'score']}
                            rules={[{ required: true }]}
                            style={{ margin: 0 }}
                          >
                            <InputNumber
                              min={0}
                              max={row.score}
                              disabled={current?.state === 'adopted'}
                            />
                          </Form.Item>
                        </>
                      ),
                    },
                    {
                      title: '证据',
                      render: (_, row) =>
                        candidate.evaluation?.criteria?.find((item) => item.name === row.name)
                          ?.evidence || '',
                    },
                  ]}
                />
                <Form.Item name="comment" label="评语" rules={[{ required: true }]}>
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item name="reason" label="复核依据" rules={[{ required: true }]}>
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item name="overwrite" valuePropName="checked">
                  <Checkbox>确认替换已有人工成绩</Checkbox>
                </Form.Item>
                <Space wrap>
                  <Button
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={busy}
                    disabled={current?.state === 'adopted'}
                  >
                    保存候选修订
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={busy}
                    disabled={current?.state === 'adopted'}
                    onClick={() =>
                      void act(async () => {
                        if (!current) return;
                        const values = await gradeForm.validateFields();
                        const saved = await aiPlatform.editGrade(
                          current,
                          values.criteria,
                          values.comment,
                          values.reason,
                        );
                        await aiPlatform.adoptGrade(
                          saved,
                          values.reason,
                          Boolean(values.overwrite),
                        );
                        await select(current.id);
                        setNotice('正式成绩已采用');
                      })
                    }
                  >
                    采用到原生答题卡
                  </Button>
                </Space>
              </Form>
            )}
            {current && !candidate?.judgeLog && !task && (
              <Empty description="当前资源还没有可复核的评分候选" />
            )}
            <AITaskMonitor
              taskId={task}
              onComplete={(job) => {
                if (job.status === 'pending') setTask(job.id);
                if (job.status === 'success' && current)
                  void select(current.id).catch((reason) => setError(String(reason)));
              }}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
