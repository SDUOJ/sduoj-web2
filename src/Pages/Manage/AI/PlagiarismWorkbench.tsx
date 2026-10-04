import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  CLEAR: 'aiPlagiarismClear',
  SUSPICIOUS: 'aiPlagiarismSuspicious',
  CONFIRMED: 'aiPlagiarismConfirmed',
};

const jobLabels: Record<PlagiarismJob['status'], string> = {
  pending: 'aiPlagiarismPending',
  blocked: 'aiPlagiarismBlocked',
  running: 'aiPlagiarismRunning',
  success: 'aiPlagiarismSuccess',
  failed: 'aiPlagiarismFailed',
  cancelled: 'aiPlagiarismCancelled',
};

const resourceStateLabels: Record<string, string> = {
  draft: 'aiPlagiarismDraft',
  pending: 'aiPlagiarismRunning',
  review: 'aiPlagiarismReview',
  adopted: 'aiPlagiarismAdopted',
  failed: 'aiPlagiarismFailure',
};

const operationKey = () =>
  'plagiarism-' +
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now() + '-' + Math.random().toString(16).slice(2));

export default function PlagiarismWorkbench() {
  const { t } = useTranslation();
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
          setNotice(t('aiPlagiarismGeneratedNotice'));
        }
        if (value.status === 'failed') setError(value.error || t('aiPlagiarismFailureNotice'));
      } catch (reason) {
        if (!cancelled) setError(String(reason));
      }
    }, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeJob, loadResource, selectedId, t]);

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
      setNotice(t('aiPlagiarismWrittenNotice', { count: result.updated }));
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
              <Typography.Title level={3}>{t('aiPlagiarismTitle')}</Typography.Title>
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
                  {t(jobLabels[activeJob.status])}
                </Tag>
              )}
            </div>
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                aria-label={t('aiPlagiarismRefresh')}
                loading={loading}
                onClick={() => void load()}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setScanOpen(true)}>
                {t('aiPlagiarismNew')}
              </Button>
            </Space>
          </header>

          <Table<PlagiarismResource>
            size="small"
            rowKey="id"
            dataSource={resources}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: t('aiPlagiarismRecord'), render: (_, row) => row.data.title || row.id },
              {
                title: t('aiPlagiarismStatus'),
                render: (_, row) => (
                  <Tag>
                    {resourceStateLabels[row.state] ? t(resourceStateLabels[row.state]) : row.state}
                  </Tag>
                ),
              },
              {
                title: t('aiPlagiarismActions'),
                render: (_, row) => (
                  <Button
                    type="link"
                    onClick={() => {
                      setSelectedId(row.id);
                      void loadResource(row.id).catch((reason) => setError(String(reason)));
                    }}
                  >
                    {t('aiPlagiarismView')}
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
              message={t('aiPlagiarismBlockedTitle')}
              description={t('aiPlagiarismBlockedDescription')}
            />
          )}
          {['failed', 'cancelled'].includes(activeJob?.status || '') && (
            <Alert
              type="error"
              showIcon
              message={t(jobLabels[activeJob!.status])}
              description={activeJob?.error || t('aiPlagiarismNoCandidates')}
            />
          )}

          {resource ? (
            <>
              <section className="ai-plagiarism-summary">
                <Space size="large" wrap>
                  <Typography.Text strong>{resource.data.title || resource.id}</Typography.Text>
                  <Typography.Text>
                    {t('aiPlagiarismSnapshot')} {resource.data.native_snapshot?.count || 0}{' '}
                    {t('aiPlagiarismSubmissions')}
                  </Typography.Text>
                  <Typography.Text>
                    {t('aiPlagiarismCandidate')} {candidate?.candidate_count ?? pairs.length}{' '}
                    {t('aiPlagiarismPairs')}
                  </Typography.Text>
                  <Typography.Text>
                    {t('aiPlagiarismReviewed')} {reviewedCount} {t('aiPlagiarismPairs')}
                  </Typography.Text>
                  <Tag>
                    {resourceStateLabels[resource.state]
                      ? t(resourceStateLabels[resource.state])
                      : resource.state}
                  </Tag>
                </Space>
                <Space wrap>
                  {candidate?.report && (
                    <Button
                      icon={<DownloadOutlined />}
                      aria-label={t('aiPlagiarismDownload')}
                      onClick={() => void plagiarismApi.downloadReport(resource.id)}
                    >
                      {t('aiPlagiarismDownload')}
                    </Button>
                  )}
                  <Button
                    type="primary"
                    icon={<DatabaseOutlined />}
                    aria-label={t('aiPlagiarismWriteback')}
                    disabled={!allReviewed || resource.state === 'adopted'}
                    onClick={() => setWritebackOpen(true)}
                  >
                    {t('aiPlagiarismWriteback')}
                  </Button>
                </Space>
              </section>

              {resource.data.native_snapshot && (
                <Descriptions size="small" bordered column={{ xs: 1, sm: 2, lg: 4 }}>
                  <Descriptions.Item label={t('aiPlagiarismProblemSet')}>
                    {resource.data.native_snapshot.psid}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('aiPlagiarismGroupProblem')}>
                    {resource.data.native_snapshot.group_id} / {resource.data.native_snapshot.pid}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('aiPlagiarismSelection')}>
                    {resource.data.native_snapshot.selection_policy === 'best'
                      ? t('aiPlagiarismBest')
                      : t('aiPlagiarismLatest')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('aiPlagiarismDigest')}>
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
                        title: t('aiPlagiarismParticipants'),
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
                        title: t('aiPlagiarismSimilarity'),
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
                        title: t('aiPlagiarismAnalysis'),
                        key: 'review',
                        render: (_, pair) =>
                          pair.review?.answer ||
                          (pair.review_status === 'manual'
                            ? t('aiPlagiarismHumanReview')
                            : t('aiPlagiarismAwaitingAnalysis')),
                      },
                      {
                        title: t('aiPlagiarismDecision'),
                        key: 'decision',
                        width: 100,
                        render: (_, pair) => {
                          const latest = pair.decisions?.[pair.decisions.length - 1];
                          return latest ? (
                            <Tag>{t(decisionLabels[latest.decision])}</Tag>
                          ) : (
                            <Tag>{t('aiPlagiarismReview')}</Tag>
                          );
                        },
                      },
                      {
                        title: t('aiPlagiarismActions'),
                        key: 'action',
                        width: 100,
                        render: (_, pair) => (
                          <Button
                            icon={<AuditOutlined />}
                            aria-label={t('aiPlagiarismReviewPair', {
                              left: pair.left,
                              right: pair.right,
                            })}
                            disabled={resource.state === 'adopted'}
                            onClick={() => {
                              setReviewing(pair);
                              const latest = pair.decisions?.[pair.decisions.length - 1];
                              reviewForm.setFieldsValue(
                                latest || { decision: 'SUSPICIOUS', reason: '' },
                              );
                            }}
                          >
                            {t('aiPlagiarismReviewAction')}
                          </Button>
                        ),
                      },
                    ]}
                  />
                ) : (
                  <Empty description={t('aiPlagiarismNoMatches')} />
                )
              ) : (
                <Empty
                  description={
                    activeJob ? t('aiPlagiarismInProgress') : t('aiPlagiarismNotStarted')
                  }
                />
              )}
            </>
          ) : (
            <Empty description={t('aiPlagiarismEmpty')} />
          )}

          <Modal
            title={t('aiPlagiarismCreate')}
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
              <Form.Item name="title" label={t('aiPlagiarismName')} rules={[{ required: true }]}>
                <Input maxLength={128} />
              </Form.Item>
              <div className="ai-plagiarism-form-grid">
                <Form.Item
                  name="psid"
                  label={t('aiPlagiarismProblemSetId')}
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item
                  name="groupId"
                  label={t('aiPlagiarismGroupId')}
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item
                  name="pid"
                  label={t('aiPlagiarismProblemId')}
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} />
                </Form.Item>
              </div>
              <div className="ai-plagiarism-form-grid ai-plagiarism-form-grid-two">
                <Form.Item
                  name="language"
                  label={t('aiPlagiarismLanguage')}
                  rules={[{ required: true }]}
                >
                  <Select
                    options={[
                      { value: 'c', label: 'C' },
                      { value: 'cpp', label: 'C++' },
                      { value: 'python', label: 'Python' },
                      { value: 'java', label: 'Java' },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  name="selectionPolicy"
                  label={t('aiPlagiarismSelection')}
                  rules={[{ required: true }]}
                >
                  <Select
                    options={[
                      { value: 'latest', label: t('aiPlagiarismLatest') },
                      { value: 'best', label: t('aiPlagiarismBest') },
                    ]}
                  />
                </Form.Item>
              </div>
              <Form.Item
                name="threshold"
                label={t('aiPlagiarismThreshold')}
                rules={[{ required: true }]}
              >
                <InputNumber min={0} max={1} step={0.05} />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title={t('aiPlagiarismReviewModal')}
            open={Boolean(reviewing)}
            onCancel={() => !busy && setReviewing(null)}
            onOk={() => void saveReview()}
            confirmLoading={busy}
            destroyOnHidden
          >
            {reviewing && (
              <Descriptions size="small" bordered column={1}>
                <Descriptions.Item label={t('aiPlagiarismParticipants')}>
                  {reviewing.left_username || reviewing.left} /{' '}
                  {reviewing.right_username || reviewing.right}
                </Descriptions.Item>
                <Descriptions.Item label={t('aiPlagiarismNativeSubmission')}>
                  {reviewing.left_submission_id || '-'} / {reviewing.right_submission_id || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('aiPlagiarismSimilarity')}>
                  {Math.round(reviewing.similarity * 100)}%
                </Descriptions.Item>
                <Descriptions.Item label={t('aiPlagiarismAiAnalysis')}>
                  {reviewing.review?.answer || t('aiPlagiarismNoAiAnalysis')}
                </Descriptions.Item>
              </Descriptions>
            )}
            {!!reviewing?.matches.length && (
              <div className="ai-plagiarism-evidence">
                <Typography.Text strong>{t('aiPlagiarismMatchingRanges')}</Typography.Text>
                <pre>{JSON.stringify(reviewing.matches, null, 2)}</pre>
              </div>
            )}
            <Form form={reviewForm} layout="vertical">
              <Form.Item
                name="decision"
                label={t('aiPlagiarismDecision')}
                rules={[{ required: true }]}
              >
                <Select
                  options={Object.entries(decisionLabels).map(([value, label]) => ({
                    value,
                    label: t(label),
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="reason"
                label={t('aiPlagiarismReviewReason')}
                rules={[{ required: true, min: 1 }]}
              >
                <Input.TextArea rows={4} maxLength={2000} />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title={t('aiPlagiarismWriteModal')}
            open={writebackOpen}
            onCancel={() => !busy && setWritebackOpen(false)}
            onOk={() => void writeback()}
            confirmLoading={busy}
            okText={t('aiPlagiarismConfirmWrite')}
            destroyOnHidden
          >
            <Form form={writebackForm} layout="vertical">
              <Form.Item
                name="reason"
                label={t('aiPlagiarismWriteReason')}
                rules={[{ required: true, min: 1 }]}
              >
                <Input.TextArea rows={4} maxLength={2000} />
              </Form.Item>
              <Form.Item name="overwriteExisting" valuePropName="checked">
                <Checkbox>{t('aiPlagiarismOverwrite')}</Checkbox>
              </Form.Item>
            </Form>
          </Modal>
        </Layout>
      </div>
    </div>
  );
}
