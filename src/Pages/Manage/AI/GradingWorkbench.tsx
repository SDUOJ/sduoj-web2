import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

function operationKey(prefix: string) {
  const value =
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${value}`.slice(0, 96);
}

export default function GradingWorkbench({ location }: { location?: { search?: string } }) {
  const { t } = useTranslation();
  const stateLabels: Record<string, string> = {
    pending: t('aiGradingStatePending'),
    review: t('aiGradingStateReview'),
    approved: t('aiGradingStateApproved'),
    adopted: t('aiGradingStateAdopted'),
    failed: t('aiGradingStateFailed'),
  };
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
          <Typography.Title level={3}>{t('aiGradingTitle')}</Typography.Title>
          <Space>
            <Button
              aria-label={t('aiGradingRefresh')}
              icon={<ReloadOutlined />}
              onClick={() => void act(refresh)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              {t('aiGradingCreate')}
            </Button>
          </Space>
        </div>
        {error && <Alert type="error" showIcon message={error} />}
        {conflict && (
          <Alert
            type="warning"
            showIcon
            message={t('aiGradingConflictMessage')}
            description={t('aiGradingConflictDescription')}
          />
        )}
        {notice && <Alert type="success" showIcon message={notice} />}
        <div className="ai-workspace-columns">
          <section>
            <Modal
              title={t('aiGradingCreateTitle')}
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
                <Form.Item
                  name="psid"
                  label={t('aiGradingProblemSetId')}
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item name="gid" label={t('aiGradingGroupId')} rules={[{ required: true }]}>
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item name="pid" label={t('aiGradingProblemId')} rules={[{ required: true }]}>
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item
                  name="username"
                  label={t('aiGradingUsername')}
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item name="operation_key" hidden>
                  <Input />
                </Form.Item>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={busy}>
                  {t('aiGradingGenerate')}
                </Button>
              </Form>
            </Modal>
            <Table<PlatformResource>
              size="small"
              rowKey="id"
              dataSource={resources}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: t('aiGradingCandidate'), render: (_, row) => row.id.slice(0, 8) },
                {
                  title: t('aiGradingStatus'),
                  render: (_, row) => stateLabels[row.state] || row.state,
                },
                {
                  title: t('aiGradingActions'),
                  render: (_, row) => (
                    <Button type="link" onClick={() => void act(() => select(row.id))}>
                      {t('aiGradingView')}
                    </Button>
                  ),
                },
              ]}
            />
          </section>
          <section>
            {current && (
              <Space wrap>
                <Typography.Title level={4}>{t('aiGradingCandidate')}</Typography.Title>
                <Tag>{stateLabels[current.state] || current.state}</Tag>
                <Tag>v{current.version}</Tag>
              </Space>
            )}
            {candidate?.source && (
              <Descriptions size="small" bordered column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label={t('aiGradingStudent')}>
                  {candidate.source.username}
                </Descriptions.Item>
                <Descriptions.Item label={t('aiGradingAnswerDetail')}>
                  {candidate.source.asd_id}
                </Descriptions.Item>
                <Descriptions.Item label={t('aiGradingProblemSetGroup')}>
                  {candidate.source.psid} / {candidate.source.gid}
                </Descriptions.Item>
                <Descriptions.Item label={t('aiGradingProblem')}>
                  {candidate.source.pid}
                </Descriptions.Item>
              </Descriptions>
            )}
            {candidate?.evaluation && (
              <Alert
                type={candidate.evaluation.confidence < 0.7 ? 'warning' : 'info'}
                showIcon
                message={t('aiGradingConfidence', {
                  percent: Math.round(candidate.evaluation.confidence * 100),
                })}
                description={t('aiGradingCandidateDescription')}
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
                    setNotice(t('aiGradingSavedNotice'));
                  })
                }
              >
                <Table
                  rowKey="name"
                  pagination={false}
                  dataSource={candidate.judgeLog}
                  columns={[
                    { title: t('aiGradingCriterion'), dataIndex: 'name' },
                    { title: t('aiGradingMaxScore'), dataIndex: 'score' },
                    {
                      title: t('aiGradingCandidateScore'),
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
                      title: t('aiGradingEvidence'),
                      render: (_, row) =>
                        candidate.evaluation?.criteria?.find((item) => item.name === row.name)
                          ?.evidence || '',
                    },
                  ]}
                />
                <Form.Item
                  name="comment"
                  label={t('aiGradingComment')}
                  rules={[{ required: true }]}
                >
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item
                  name="reason"
                  label={t('aiGradingReviewReason')}
                  rules={[{ required: true }]}
                >
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item name="overwrite" valuePropName="checked">
                  <Checkbox>{t('aiGradingOverwrite')}</Checkbox>
                </Form.Item>
                <Space wrap>
                  <Button
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={busy}
                    disabled={current?.state === 'adopted'}
                  >
                    {t('aiGradingSave')}
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
                        setNotice(t('aiGradingAdoptedNotice'));
                      })
                    }
                  >
                    {t('aiGradingAdopt')}
                  </Button>
                </Space>
              </Form>
            )}
            {current && !candidate?.judgeLog && !task && (
              <Empty description={t('aiGradingEmpty')} />
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
