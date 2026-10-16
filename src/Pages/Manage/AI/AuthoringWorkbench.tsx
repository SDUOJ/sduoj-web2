import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  CheckOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  authoringApi,
  AuthoringCheckpoint,
  AuthoringJob,
  AuthoringResource,
} from '../../../Utils/API/ai-authoring';
import AIWorkspaceNav from './AIWorkspaceNav';
import './authoring-workbench.css';

const operationKey = () =>
  'authoring-' +
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now() + '-' + Math.random().toString(16).slice(2));

type Recovery = {
  marker: string;
  packageHash: string;
  code?: string;
  checkpointIds: number[];
  stage: 'creating' | 'uploading' | 'configured';
};

export default function AuthoringWorkbench() {
  const { t } = useTranslation();
  const [resources, setResources] = useState<AuthoringResource[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const selectedRef = useRef('');
  const [resource, setResource] = useState<AuthoringResource | null>(null);
  const [activeJob, setActiveJob] = useState<AuthoringJob | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [createForm] = Form.useForm();
  const [revisionForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [publishForm] = Form.useForm();
  const loadSequence = useRef(0);
  const selectionSequence = useRef(0);

  const selectResource = useCallback(async (id: string) => {
    const sequence = ++selectionSequence.current;
    if (selectedRef.current !== id) {
      setActiveJob(null);
      setResource(null);
    }
    selectedRef.current = id;
    setSelectedId(id);
    setError('');
    if (!id) return;
    try {
      const selected = await authoringApi.get(id);
      if (sequence === selectionSequence.current) setResource(selected);
    } catch (reason) {
      if (sequence === selectionSequence.current) throw reason;
    }
  }, []);

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError('');
    try {
      const value = await authoringApi.list();
      if (sequence !== loadSequence.current) return;
      setResources(value.rows);
      const retained = value.rows.some((item) => item.id === selectedRef.current)
        ? selectedRef.current
        : value.rows[0]?.id || '';
      await selectResource(retained);
    } catch (reason) {
      if (sequence === loadSequence.current) setError(String(reason));
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [selectResource]);

  useEffect(() => {
    void load();
    return () => {
      loadSequence.current += 1;
      selectionSequence.current += 1;
    };
  }, [load]);

  useEffect(() => {
    if (!activeJob || ['success', 'failed', 'cancelled'].includes(activeJob.status)) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const value = await authoringApi.getJob(activeJob.id);
        if (cancelled) return;
        setActiveJob(value);
        if (value.status === 'success' && selectedRef.current) {
          await selectResource(selectedRef.current);
          setNotice(t('aiAuthoringRevisionGenerated'));
        } else if (value.status === 'failed') {
          setError(value.error || t('aiAuthoringTaskFailed'));
        }
      } catch (reason) {
        if (!cancelled) setError(String(reason));
      }
    }, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeJob, selectResource, t]);

  async function createAuthoring() {
    const values = await createForm.validateFields().catch(() => null);
    if (!values) return;
    setBusy(true);
    setError('');
    try {
      const created = await authoringApi.create({
        ...values,
        topics: String(values.topics || '')
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setCreateOpen(false);
      createForm.resetFields();
      await selectResource(created.id);
      const value = await authoringApi.list();
      setResources(value.rows);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function generateRevision() {
    const values = await revisionForm.validateFields().catch(() => null);
    if (!values || !resource) return;
    setBusy(true);
    setError('');
    try {
      const created = await authoringApi.generate(
        resource.id,
        resource.version,
        operationKey(),
        values.instruction,
      );
      setActiveJob({ id: created.taskId, status: created.status });
      revisionForm.resetFields();
      if (created.status === 'success') {
        if (selectedRef.current === resource.id) await selectResource(resource.id);
        setNotice(t('aiAuthoringRevisionGenerated'));
      } else if (created.status === 'failed' || created.status === 'cancelled') {
        const terminal = await authoringApi.getJob(created.taskId);
        setActiveJob(terminal);
        setError(
          terminal.error ||
            t('aiAuthoringTaskTerminal', {
              status:
                created.status === 'failed'
                  ? t('aiAuthoringTaskFailed')
                  : t('aiAuthoringTaskCancelled'),
            }),
        );
      } else {
        setNotice(
          created.status === 'blocked'
            ? t('aiAuthoringTaskBlocked')
            : t('aiAuthoringTaskSubmitted'),
        );
      }
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function review() {
    const values = await reviewForm.validateFields().catch(() => null);
    if (!values || !resource || !reviewAction) return;
    setBusy(true);
    setError('');
    try {
      await authoringApi.review(
        resource.id,
        resource.version,
        reviewAction === 'approve',
        values.reason,
      );
      if (selectedRef.current === resource.id) await selectResource(resource.id);
      setReviewAction(null);
      reviewForm.resetFields();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  function parseCheckpointIds(value: string | undefined) {
    if (!value?.trim()) return [];
    const result = value
      .split(/[\s,，]+/)
      .filter(Boolean)
      .map(Number);
    if (result.some((item) => !Number.isSafeInteger(item) || item <= 0)) {
      throw new Error(t('aiAuthoringInvalidCheckpointIds'));
    }
    return result;
  }

  async function publish() {
    const values = await publishForm.validateFields().catch(() => null);
    if (!values || !resource) return;
    setBusy(true);
    setError('');
    try {
      const plan = await authoringApi.nativePlan(resource.id, {
        version: resource.version,
        judge_template_id: values.judgeTemplateId,
        title: values.title || '',
        time_limit: values.timeLimit,
        memory_limit: values.memoryLimit,
        output_limit: values.outputLimit,
      });
      const recoveryKey = 'autolab-authoring-publication:' + plan.marker;
      let recovery: Recovery = {
        marker: plan.marker,
        packageHash: plan.package_hash,
        checkpointIds: [],
        stage: 'creating',
      };
      const saved = sessionStorage.getItem(recoveryKey);
      if (saved) recovery = JSON.parse(saved) as Recovery;
      if (recovery.marker !== plan.marker || recovery.packageHash !== plan.package_hash) {
        throw new Error(t('aiAuthoringRecoveryMismatch'));
      }
      const suppliedIds = parseCheckpointIds(values.checkpointIds);
      if (suppliedIds.length) recovery.checkpointIds = suppliedIds;
      let code = String(values.problemCode || recovery.code || '').trim();
      if (!code) {
        sessionStorage.setItem(recoveryKey, JSON.stringify(recovery));
        code = await authoringApi.createProgram(plan.problem);
        recovery.code = code;
        recovery.stage = 'uploading';
        sessionStorage.setItem(recoveryKey, JSON.stringify(recovery));
      }
      const native = await authoringApi.getProgram(code);
      if (native.source !== plan.marker) throw new Error(t('aiAuthoringProgramMismatch'));
      await authoringApi.updateDescription(native.defaultDescriptionId, code, plan.description);
      if (
        recovery.checkpointIds.length &&
        recovery.checkpointIds.length !== plan.checkpoints.length
      ) {
        throw new Error(t('aiAuthoringCheckpointMismatch'));
      }
      for (let index = recovery.checkpointIds.length; index < plan.checkpoints.length; index += 1) {
        const uploaded = await authoringApi.uploadCheckpoint(plan.checkpoints[index]);
        recovery.checkpointIds.push(uploaded.checkpointId);
        recovery.stage = 'uploading';
        sessionStorage.setItem(recoveryKey, JSON.stringify(recovery));
      }
      await authoringApi.configureProblem(
        code,
        plan,
        recovery.checkpointIds,
        values.judgeTemplateId,
      );
      recovery.stage = 'configured';
      sessionStorage.setItem(recoveryKey, JSON.stringify(recovery));
      const finalized = await authoringApi.finalize(resource.id, {
        version: resource.version,
        group_id: values.groupId,
        problem_code: code,
        judge_template_id: values.judgeTemplateId,
        score: values.score,
        checkpoints: recovery.checkpointIds.map((checkpointId, index) => ({
          index: index + 1,
          checkpoint_id: checkpointId,
        })),
      });
      sessionStorage.removeItem(recoveryKey);
      if (selectedRef.current === resource.id) await selectResource(resource.id);
      setPublishOpen(false);
      setNotice(t('aiAuthoringSavedProgram', { code: finalized.problem_code }));
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  const candidate = resource?.data.candidate;
  const conflict =
    /conflict|version|changed|mismatch|differs|does not match|冲突|版本|不一致|已变更/i.test(error);

  return (
    <div className="ai-workspace">
      <div className="ai-workspace-body">
        <AIWorkspaceNav />
        <Layout className="ai-authoring-workbench">
          <header className="ai-authoring-header">
            <div>
              <Typography.Title level={3}>{t('aiAuthoringTitle')}</Typography.Title>
              {activeJob && <Tag color="processing">{activeJob.status}</Tag>}
            </div>
            <Space wrap>
              <Select
                aria-label={t('aiAuthoringProject')}
                className="ai-authoring-picker"
                value={selectedId || undefined}
                placeholder={t('aiAuthoringSelectProject')}
                options={resources.map((item) => ({
                  value: item.id,
                  label: item.data.title || item.id,
                }))}
                onChange={(value) =>
                  void selectResource(value).catch((reason) => setError(String(reason)))
                }
              />
              <Button
                icon={<ReloadOutlined />}
                aria-label={t('aiAuthoringRefresh')}
                loading={loading}
                onClick={() => void load()}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                {t('aiAuthoringCreate')}
              </Button>
            </Space>
          </header>
          {error && (
            <Alert
              type={conflict ? 'warning' : 'error'}
              message={error}
              action={
                conflict ? (
                  <Button size="small" onClick={() => void load()}>
                    {t('aiAuthoringRefreshCurrent')}
                  </Button>
                ) : undefined
              }
              showIcon
              closable
              onClose={() => setError('')}
            />
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

          {resource ? (
            <>
              <section className="ai-authoring-toolbar">
                <Space wrap>
                  <Typography.Text strong>
                    {resource.data.title || candidate?.title || resource.id}
                  </Typography.Text>
                  <Tag>{resource.state}</Tag>
                  {candidate && (
                    <Tag color="blue">
                      {t('aiAuthoringRevision', { revision: candidate.revision })}
                    </Tag>
                  )}
                </Space>
                <Space wrap>
                  {candidate && (
                    <Button
                      icon={<DownloadOutlined />}
                      aria-label={t('aiAuthoringDownloadBundle')}
                      onClick={() =>
                        void authoringApi
                          .downloadBundle(resource.id)
                          .catch((reason) => setError(String(reason)))
                      }
                    >
                      {t('aiAuthoringDownloadBundle')}
                    </Button>
                  )}
                  {resource.state === 'review' && (
                    <>
                      <Button icon={<StopOutlined />} onClick={() => setReviewAction('reject')}>
                        {t('aiAuthoringReject')}
                      </Button>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => setReviewAction('approve')}
                      >
                        {t('aiAuthoringApprove')}
                      </Button>
                    </>
                  )}
                  {resource.state === 'approved' && (
                    <Button
                      type="primary"
                      icon={<CloudUploadOutlined />}
                      onClick={() => setPublishOpen(true)}
                    >
                      {t('aiAuthoringPublish')}
                    </Button>
                  )}
                </Space>
              </section>

              <Form form={revisionForm} layout="vertical" className="ai-authoring-revision">
                <Form.Item
                  name="instruction"
                  label={
                    candidate
                      ? t('aiAuthoringRevisionInstruction')
                      : t('aiAuthoringGenerateInstruction')
                  }
                  rules={[{ required: true }]}
                >
                  <Input.TextArea rows={3} maxLength={20000} />
                </Form.Item>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  loading={busy}
                  onClick={() => void generateRevision()}
                >
                  {candidate ? t('aiAuthoringGenerateRevision') : t('aiAuthoringGenerateDraft')}
                </Button>
              </Form>

              {candidate ? (
                <>
                  <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 4 }}>
                    <Descriptions.Item label={t('aiAuthoringProblemTitle')}>
                      {candidate.title}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('aiAuthoringLanguage')}>
                      {candidate.language}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('aiAuthoringCheckpointCount')}>
                      {candidate.test_plan.length}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('aiAuthoringPackageHash')}>
                      {candidate.package_hash.slice(0, 12)}
                    </Descriptions.Item>
                  </Descriptions>
                  <Tabs
                    items={[
                      {
                        key: 'statement',
                        label: t('aiAuthoringStatement'),
                        children: (
                          <Typography.Paragraph className="ai-authoring-prose">
                            {candidate.description}
                          </Typography.Paragraph>
                        ),
                      },
                      {
                        key: 'solution',
                        label: t('aiAuthoringReferenceSolution'),
                        children: <pre>{candidate.reference_code}</pre>,
                      },
                      {
                        key: 'generator',
                        label: t('aiAuthoringGenerator'),
                        children: <pre>{candidate.generator_code}</pre>,
                      },
                      {
                        key: 'validator',
                        label: t('aiAuthoringValidator'),
                        children: <pre>{candidate.validator_code}</pre>,
                      },
                    ]}
                  />
                  <Table<AuthoringCheckpoint>
                    rowKey="index"
                    dataSource={candidate.test_plan}
                    pagination={false}
                    scroll={{ x: 720 }}
                    columns={[
                      { title: '#', dataIndex: 'index', width: 56 },
                      { title: t('aiAuthoringPurpose'), dataIndex: 'purpose' },
                      {
                        title: t('aiAuthoringSource'),
                        key: 'source',
                        width: 90,
                        render: (_, item) =>
                          item.generated ? t('aiAuthoringGenerated') : t('aiAuthoringExplicit'),
                      },
                      {
                        title: t('aiAuthoringVisibility'),
                        key: 'public',
                        width: 80,
                        render: (_, item) =>
                          item.public ? t('aiAuthoringYes') : t('aiAuthoringNo'),
                      },
                      { title: t('aiAuthoringScore'), dataIndex: 'score', width: 80 },
                      { title: t('aiAuthoringInput'), dataIndex: 'input', ellipsis: true },
                      { title: t('aiAuthoringOutput'), dataIndex: 'output', ellipsis: true },
                    ]}
                  />
                </>
              ) : (
                <Empty description={t('aiAuthoringNoDraft')} />
              )}
            </>
          ) : (
            <Empty description={t('aiAuthoringNoProjects')} />
          )}
        </Layout>
      </div>

      <Modal
        title={t('aiAuthoringCreateTitle')}
        open={createOpen}
        onCancel={() => !busy && setCreateOpen(false)}
        onOk={() => void createAuthoring()}
        confirmLoading={busy}
        destroyOnHidden
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ language: 'cpp', difficulty: 'medium' }}
        >
          <Form.Item name="title" label={t('aiAuthoringName')} rules={[{ required: true }]}>
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item
            name="requirements"
            label={t('aiAuthoringRequirements')}
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="language" label={t('aiAuthoringLanguage')} rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'c', label: 'C' },
                { value: 'cpp', label: 'C++' },
                { value: 'python', label: 'Python' },
                { value: 'java', label: 'Java' },
              ]}
            />
          </Form.Item>
          <Form.Item name="difficulty" label={t('aiAuthoringDifficulty')}>
            <Select
              options={[
                { value: 'easy', label: t('aiAuthoringDifficultyEasy') },
                { value: 'medium', label: t('aiAuthoringDifficultyMedium') },
                { value: 'hard', label: t('aiAuthoringDifficultyHard') },
              ]}
            />
          </Form.Item>
          <Form.Item name="topics" label={t('aiAuthoringTopics')}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          reviewAction === 'approve' ? t('aiAuthoringApproveTitle') : t('aiAuthoringRejectTitle')
        }
        open={Boolean(reviewAction)}
        onCancel={() => !busy && setReviewAction(null)}
        onOk={() => void review()}
        confirmLoading={busy}
        destroyOnHidden
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            name="reason"
            label={t('aiAuthoringReviewReason')}
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} maxLength={2000} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('aiAuthoringPublishTitle')}
        open={publishOpen}
        onCancel={() => !busy && setPublishOpen(false)}
        onOk={() => void publish()}
        confirmLoading={busy}
        okText={t('aiAuthoringUploadAndVerify')}
        width={700}
        destroyOnHidden
      >
        <Form
          form={publishForm}
          layout="vertical"
          initialValues={{
            judgeTemplateId: 6,
            score: 100,
            timeLimit: 1000,
            memoryLimit: 262144,
            outputLimit: 65536,
          }}
        >
          <div className="ai-authoring-form-grid">
            <Form.Item name="groupId" label={t('aiAuthoringGroupId')} rules={[{ required: true }]}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item
              name="judgeTemplateId"
              label={t('aiAuthoringJudgeTemplateId')}
              rules={[{ required: true }]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="score" label={t('aiAuthoringGroupScore')} rules={[{ required: true }]}>
              <InputNumber min={0} max={10000} />
            </Form.Item>
          </div>
          <Form.Item name="title" label={t('aiAuthoringOJTitle')}>
            <Input maxLength={128} />
          </Form.Item>
          <div className="ai-authoring-form-grid">
            <Form.Item
              name="timeLimit"
              label={t('aiAuthoringTimeLimit')}
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={30000} />
            </Form.Item>
            <Form.Item
              name="memoryLimit"
              label={t('aiAuthoringMemoryLimit')}
              rules={[{ required: true }]}
            >
              <InputNumber min={1024} max={1048576} />
            </Form.Item>
            <Form.Item
              name="outputLimit"
              label={t('aiAuthoringOutputLimit')}
              rules={[{ required: true }]}
            >
              <InputNumber min={1024} max={1048576} />
            </Form.Item>
          </div>
          <Form.Item name="problemCode" label={t('aiAuthoringExistingProblemCode')}>
            <Input />
          </Form.Item>
          <Form.Item name="checkpointIds" label={t('aiAuthoringUploadedCheckpointIds')}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
