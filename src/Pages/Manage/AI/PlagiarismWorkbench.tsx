import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  AuditOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  plagiarismApi,
  PlagiarismDecision,
  PlagiarismJob,
  PlagiarismPair,
  PlagiarismResource,
} from '../../../Utils/API/ai-plagiarism';
import AIWorkspaceNav from './AIWorkspaceNav';
import './plagiarism-workbench.css';

const decisionLabels: Record<PlagiarismDecision, string> = {
  CLEAR: '排除',
  SUSPICIOUS: '存疑',
  CONFIRMED: '确认',
};

const jobLabels: Record<PlagiarismJob['status'], string> = {
  pending: '排队中',
  blocked: '等待账户或额度恢复',
  running: '分析中',
  success: '候选已生成',
  failed: '任务失败',
  cancelled: '任务已取消',
};

const resourceStateLabels: Record<string, string> = {
  draft: '草稿',
  pending: '分析中',
  review: '待复核',
  adopted: '已写入 OJ',
  failed: '失败',
};

const operationKey = () =>
  'plagiarism-' +
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now() + '-' + Math.random().toString(16).slice(2));

export default function PlagiarismWorkbench() {
  const [resources, setResources] = useState<PlagiarismResource[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [resource, setResource] = useState<PlagiarismResource | null>(null);
  const [activeJob, setActiveJob] = useState<PlagiarismJob | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [reviewing, setReviewing] = useState<PlagiarismPair | null>(null);
  const [writebackOpen, setWritebackOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [scanForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [writebackForm] = Form.useForm();
  const loadSequence = useRef(0);

  const loadResource = useCallback(async (resourceId: string) => {
    if (!resourceId) {
      setResource(null);
      return;
    }
    const value = await plagiarismApi.get(resourceId);
    setResource(value);
  }, []);

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError('');
    try {
      const value = await plagiarismApi.list();
      if (sequence !== loadSequence.current) return;
      setResources(value.rows);
      const next = selectedId || value.rows[0]?.id || '';
      setSelectedId(next);
      if (next) await loadResource(next);
      else setResource(null);
    } catch (reason) {
      if (sequence === loadSequence.current) setError(String(reason));
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [loadResource, selectedId]);

  useEffect(() => {
    void load();
    return () => {
      loadSequence.current += 1;
    };
  }, [load]);

  useEffect(() => {
    if (!activeJob || ['success', 'failed', 'cancelled'].includes(activeJob.status)) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const value = await plagiarismApi.getJob(activeJob.id);
        if (cancelled) return;
        setActiveJob(value);
        if (value.status === 'success' && selectedId) {
          await loadResource(selectedId);
          setNotice('查重候选已生成');
        }
        if (value.status === 'failed') setError(value.error || '查重任务失败');
      } catch (reason) {
        if (!cancelled) setError(String(reason));
      }
    }, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeJob, loadResource, selectedId]);

  const pairs = resource?.data.candidate?.pairs || [];
  const reviewedCount = pairs.filter((pair) => Boolean(pair.decisions?.length)).length;

  async function createScan() {
    const values = await scanForm.validateFields().catch(() => null);
    if (!values) return;
    setBusy(true);
    setError('');
    try {
      const result = await plagiarismApi.createNative({
        psid: values.psid,
        group_id: values.groupId,
        pid: values.pid,
        operation_key: operationKey(),
        title: values.title,
        language: values.language,
        threshold: values.threshold,
        selection_policy: values.selectionPolicy,
      });
      setScanOpen(false);
      scanForm.resetFields();
      setSelectedId(result.resource_id);
      setActiveJob({ id: result.taskId, status: result.status });
      await loadResource(result.resource_id);
      const list = await plagiarismApi.list();
      setResources(list.rows);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function saveReview() {
    const values = await reviewForm.validateFields().catch(() => null);
    if (!values || !resource || !reviewing) return;
    setBusy(true);
    setError('');
    try {
      await plagiarismApi.reviewPair(
        resource.id,
        resource.version,
        reviewing,
        values.decision,
        values.reason,
      );
      await loadResource(resource.id);
      setReviewing(null);
      reviewForm.resetFields();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function writeback() {
    const values = await writebackForm.validateFields().catch(() => null);
    if (!values || !resource) return;
    setBusy(true);
    setError('');
    try {
      const result = await plagiarismApi.writeback(
        resource.id,
        resource.version,
        values.reason,
        Boolean(values.overwriteExisting),
      );
      await loadResource(resource.id);
      setWritebackOpen(false);
      writebackForm.resetFields();
      setNotice('已写入 ' + result.updated + ' 份 OJ 答题记录');
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  const candidate = resource?.data.candidate;
  const allReviewed = Boolean(candidate) && reviewedCount === pairs.length;

  return (
    <div className="ai-workspace">
      <div className="ai-workspace-body">
        <AIWorkspaceNav />
        <Layout className="ai-plagiarism-workbench">
          <header className="ai-plagiarism-header">
            <div>
              <Typography.Title level={3}>代码查重</Typography.Title>
              {activeJob && (
                <Tag
                  color={
                    activeJob.status === 'success'
                      ? 'success'
                      : ['failed', 'cancelled'].includes(activeJob.status)
                        ? 'error'
                        : 'processing'
                  }
                >
                  {jobLabels[activeJob.status]}
                </Tag>
              )}
            </div>
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                aria-label="刷新"
                loading={loading}
                onClick={() => void load()}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setScanOpen(true)}>
                新建
              </Button>
            </Space>
          </header>

          <Table<PlagiarismResource>
            size="small"
            rowKey="id"
            dataSource={resources}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: '查重记录', render: (_, row) => row.data.title || row.id },
              {
                title: '状态',
                render: (_, row) => <Tag>{resourceStateLabels[row.state] || row.state}</Tag>,
              },
              {
                title: '操作',
                render: (_, row) => (
                  <Button
                    type="link"
                    onClick={() => {
                      setSelectedId(row.id);
                      void loadResource(row.id).catch((reason) => setError(String(reason)));
                    }}
                  >
                    查看
                  </Button>
                ),
              },
            ]}
          />
          {error && (
            <Alert type="error" message={error} showIcon closable onClose={() => setError('')} />
          )}
          {notice && (
            <Alert
              type="success"
              message={notice}
              showIcon
              closable
              onClose={() => setNotice('')}
            />
          )}
          {activeJob?.status === 'blocked' && (
            <Alert
              type="warning"
              showIcon
              message="查重任务暂时阻塞"
              description="账户、并发或额度恢复后任务会继续排队，当前快照不会改变。"
            />
          )}
          {['failed', 'cancelled'].includes(activeJob?.status || '') && (
            <Alert
              type="error"
              showIcon
              message={jobLabels[activeJob!.status]}
              description={activeJob?.error || '当前任务没有生成可复核候选，请重新发起查重。'}
            />
          )}

          {resource ? (
            <>
              <section className="ai-plagiarism-summary">
                <Space size="large" wrap>
                  <Typography.Text strong>{resource.data.title || resource.id}</Typography.Text>
                  <Typography.Text>
                    快照 {resource.data.native_snapshot?.count || 0} 份
                  </Typography.Text>
                  <Typography.Text>
                    候选 {candidate?.candidate_count ?? pairs.length} 对
                  </Typography.Text>
                  <Typography.Text>已复核 {reviewedCount} 对</Typography.Text>
                  <Tag>{resourceStateLabels[resource.state] || resource.state}</Tag>
                </Space>
                <Space wrap>
                  {candidate?.report && (
                    <Button
                      icon={<DownloadOutlined />}
                      aria-label="下载报告"
                      onClick={() => void plagiarismApi.downloadReport(resource.id)}
                    >
                      下载报告
                    </Button>
                  )}
                  <Button
                    type="primary"
                    icon={<DatabaseOutlined />}
                    aria-label="写入 OJ"
                    disabled={!allReviewed || resource.state === 'adopted'}
                    onClick={() => setWritebackOpen(true)}
                  >
                    写入 OJ
                  </Button>
                </Space>
              </section>

              {resource.data.native_snapshot && (
                <Descriptions size="small" bordered column={{ xs: 1, sm: 2, lg: 4 }}>
                  <Descriptions.Item label="题单">
                    {resource.data.native_snapshot.psid}
                  </Descriptions.Item>
                  <Descriptions.Item label="题组 / 题目">
                    {resource.data.native_snapshot.group_id} / {resource.data.native_snapshot.pid}
                  </Descriptions.Item>
                  <Descriptions.Item label="提交选择">
                    {resource.data.native_snapshot.selection_policy === 'best'
                      ? '最高分提交'
                      : '最后提交'}
                  </Descriptions.Item>
                  <Descriptions.Item label="快照摘要">
                    {resource.data.native_snapshot.sha256.slice(0, 12)}
                  </Descriptions.Item>
                </Descriptions>
              )}

              {candidate ? (
                pairs.length ? (
                  <Table<PlagiarismPair>
                    rowKey={(pair) => pair.left + ':' + pair.right}
                    dataSource={pairs}
                    pagination={{ pageSize: 20, showSizeChanger: false }}
                    scroll={{ x: 880 }}
                    columns={[
                      {
                        title: '提交双方',
                        key: 'users',
                        width: 220,
                        render: (_, pair) => (
                          <Space direction="vertical" size={0}>
                            <Typography.Text>{pair.left_username || pair.left}</Typography.Text>
                            <Typography.Text>{pair.right_username || pair.right}</Typography.Text>
                          </Space>
                        ),
                      },
                      {
                        title: '相似度',
                        dataIndex: 'similarity',
                        width: 180,
                        render: (value: number) => (
                          <Progress
                            percent={Math.round(value * 100)}
                            size="small"
                            status="normal"
                          />
                        ),
                      },
                      {
                        title: '分析',
                        key: 'review',
                        render: (_, pair) =>
                          pair.review?.answer ||
                          (pair.review_status === 'manual' ? '人工复核' : '待分析'),
                      },
                      {
                        title: '结论',
                        key: 'decision',
                        width: 100,
                        render: (_, pair) => {
                          const latest = pair.decisions?.[pair.decisions.length - 1];
                          return latest ? (
                            <Tag>{decisionLabels[latest.decision]}</Tag>
                          ) : (
                            <Tag>待复核</Tag>
                          );
                        },
                      },
                      {
                        title: '操作',
                        key: 'action',
                        width: 100,
                        render: (_, pair) => (
                          <Button
                            icon={<AuditOutlined />}
                            aria-label={'复核 ' + pair.left + ' ' + pair.right}
                            disabled={resource.state === 'adopted'}
                            onClick={() => {
                              setReviewing(pair);
                              const latest = pair.decisions?.[pair.decisions.length - 1];
                              reviewForm.setFieldsValue(
                                latest || { decision: 'SUSPICIOUS', reason: '' },
                              );
                            }}
                          >
                            复核
                          </Button>
                        ),
                      },
                    ]}
                  />
                ) : (
                  <Empty description="未发现超过阈值的候选" />
                )
              ) : (
                <Empty description={activeJob ? '查重任务执行中' : '尚未执行查重'} />
              )}
            </>
          ) : (
            <Empty description="暂无查重记录" />
          )}

          <Modal
            title="新建原生 OJ 查重"
            open={scanOpen}
            onCancel={() => !busy && setScanOpen(false)}
            onOk={() => void createScan()}
            confirmLoading={busy}
            destroyOnHidden
          >
            <Form
              form={scanForm}
              layout="vertical"
              initialValues={{ language: 'cpp', threshold: 0.7, selectionPolicy: 'latest' }}
            >
              <Form.Item name="title" label="名称" rules={[{ required: true }]}>
                <Input maxLength={128} />
              </Form.Item>
              <div className="ai-plagiarism-form-grid">
                <Form.Item name="psid" label="题单 ID" rules={[{ required: true }]}>
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item name="groupId" label="题组 ID" rules={[{ required: true }]}>
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item name="pid" label="题目 ID" rules={[{ required: true }]}>
                  <InputNumber min={1} />
                </Form.Item>
              </div>
              <div className="ai-plagiarism-form-grid ai-plagiarism-form-grid-two">
                <Form.Item name="language" label="语言" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: 'c', label: 'C' },
                      { value: 'cpp', label: 'C++' },
                      { value: 'python', label: 'Python' },
                      { value: 'java', label: 'Java' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="selectionPolicy" label="提交选择" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: 'latest', label: '最后提交' },
                      { value: 'best', label: '最高分提交' },
                    ]}
                  />
                </Form.Item>
              </div>
              <Form.Item name="threshold" label="相似度阈值" rules={[{ required: true }]}>
                <InputNumber min={0} max={1} step={0.05} />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="复核候选"
            open={Boolean(reviewing)}
            onCancel={() => !busy && setReviewing(null)}
            onOk={() => void saveReview()}
            confirmLoading={busy}
            destroyOnHidden
          >
            {reviewing && (
              <Descriptions size="small" bordered column={1}>
                <Descriptions.Item label="提交双方">
                  {reviewing.left_username || reviewing.left} /{' '}
                  {reviewing.right_username || reviewing.right}
                </Descriptions.Item>
                <Descriptions.Item label="原生提交">
                  {reviewing.left_submission_id || '-'} / {reviewing.right_submission_id || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="相似度">
                  {Math.round(reviewing.similarity * 100)}%
                </Descriptions.Item>
                <Descriptions.Item label="AI 分析">
                  {reviewing.review?.answer || '无 AI 分析，需人工核对报告与匹配区间'}
                </Descriptions.Item>
              </Descriptions>
            )}
            {!!reviewing?.matches.length && (
              <div className="ai-plagiarism-evidence">
                <Typography.Text strong>JPlag 匹配区间</Typography.Text>
                <pre>{JSON.stringify(reviewing.matches, null, 2)}</pre>
              </div>
            )}
            <Form form={reviewForm} layout="vertical">
              <Form.Item name="decision" label="结论" rules={[{ required: true }]}>
                <Select
                  options={Object.entries(decisionLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Form.Item>
              <Form.Item name="reason" label="复核依据" rules={[{ required: true, min: 1 }]}>
                <Input.TextArea rows={4} maxLength={2000} />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="写入 OJ 查重结果"
            open={writebackOpen}
            onCancel={() => !busy && setWritebackOpen(false)}
            onOk={() => void writeback()}
            confirmLoading={busy}
            okText="确认写入"
            destroyOnHidden
          >
            <Form form={writebackForm} layout="vertical">
              <Form.Item name="reason" label="写入依据" rules={[{ required: true, min: 1 }]}>
                <Input.TextArea rows={4} maxLength={2000} />
              </Form.Item>
              <Form.Item name="overwriteExisting" valuePropName="checked">
                <Checkbox>覆盖已有 OJ 查重结果</Checkbox>
              </Form.Item>
            </Form>
          </Modal>
        </Layout>
      </div>
    </div>
  );
}
