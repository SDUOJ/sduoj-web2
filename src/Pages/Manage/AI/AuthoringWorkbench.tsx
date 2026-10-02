import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  const selectResource = useCallback(async (id: string) => {
    selectedRef.current = id;
    setSelectedId(id);
    if (!id) {
      setResource(null);
      return;
    }
    setResource(await authoringApi.get(id));
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
          setNotice('命题修订已生成并通过测试包验证');
        } else if (value.status === 'failed') {
          setError(value.error || '命题任务失败');
        }
      } catch (reason) {
        if (!cancelled) setError(String(reason));
      }
    }, 2000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeJob, selectResource]);

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
        await selectResource(resource.id);
        setNotice('命题修订已生成并通过测试包验证');
      } else if (created.status === 'failed' || created.status === 'cancelled') {
        const terminal = await authoringApi.getJob(created.taskId);
        setActiveJob(terminal);
        setError(terminal.error || `命题任务${created.status === 'failed' ? '失败' : '已取消'}`);
      } else {
        setNotice(created.status === 'blocked' ? '命题任务等待额度或运行条件' : '命题任务已提交');
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
      await selectResource(resource.id);
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
      throw new Error('测试点 ID 格式错误');
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
        throw new Error('发布恢复记录与当前命题版本不一致');
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
      if (native.source !== plan.marker) throw new Error('该 OJ 题号不属于当前命题版本');
      await authoringApi.updateDescription(native.defaultDescriptionId, code, plan.description);
      if (
        recovery.checkpointIds.length &&
        recovery.checkpointIds.length !== plan.checkpoints.length
      ) {
        throw new Error('恢复的测试点数量与当前测试包不一致');
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
      await selectResource(resource.id);
      setPublishOpen(false);
      setNotice('已保存编程题：' + finalized.problem_code);
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
              <Typography.Title level={3}>程序题创作</Typography.Title>
              {activeJob && <Tag color="processing">{activeJob.status}</Tag>}
            </div>
            <Space wrap>
              <Select
                aria-label="命题项目"
                className="ai-authoring-picker"
                value={selectedId || undefined}
                placeholder="选择命题项目"
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
                aria-label="刷新"
                loading={loading}
                onClick={() => void load()}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                新建命题
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
                    刷新当前版本
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
                  {candidate && <Tag color="blue">修订 {candidate.revision}</Tag>}
                </Space>
                <Space wrap>
                  {candidate && (
                    <Button
                      icon={<DownloadOutlined />}
                      aria-label="下载命题包"
                      onClick={() =>
                        void authoringApi
                          .downloadBundle(resource.id)
                          .catch((reason) => setError(String(reason)))
                      }
                    >
                      下载命题包
                    </Button>
                  )}
                  {resource.state === 'review' && (
                    <>
                      <Button icon={<StopOutlined />} onClick={() => setReviewAction('reject')}>
                        退回
                      </Button>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => setReviewAction('approve')}
                      >
                        批准
                      </Button>
                    </>
                  )}
                  {resource.state === 'approved' && (
                    <Button
                      type="primary"
                      icon={<CloudUploadOutlined />}
                      onClick={() => setPublishOpen(true)}
                    >
                      保存编程题
                    </Button>
                  )}
                </Space>
              </section>

              <Form form={revisionForm} layout="vertical" className="ai-authoring-revision">
                <Form.Item
                  name="instruction"
                  label={candidate ? '修订要求' : '生成要求'}
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
                  {candidate ? '生成新修订' : '生成初稿'}
                </Button>
              </Form>

              {candidate ? (
                <>
                  <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 4 }}>
                    <Descriptions.Item label="题目">{candidate.title}</Descriptions.Item>
                    <Descriptions.Item label="语言">{candidate.language}</Descriptions.Item>
                    <Descriptions.Item label="测试点">
                      {candidate.test_plan.length}
                    </Descriptions.Item>
                    <Descriptions.Item label="包哈希">
                      {candidate.package_hash.slice(0, 12)}
                    </Descriptions.Item>
                  </Descriptions>
                  <Tabs
                    items={[
                      {
                        key: 'statement',
                        label: '题面',
                        children: (
                          <Typography.Paragraph className="ai-authoring-prose">
                            {candidate.description}
                          </Typography.Paragraph>
                        ),
                      },
                      {
                        key: 'solution',
                        label: '标程',
                        children: <pre>{candidate.reference_code}</pre>,
                      },
                      {
                        key: 'generator',
                        label: '生成器',
                        children: <pre>{candidate.generator_code}</pre>,
                      },
                      {
                        key: 'validator',
                        label: '校验器',
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
                      { title: '目的', dataIndex: 'purpose' },
                      {
                        title: '来源',
                        key: 'source',
                        width: 90,
                        render: (_, item) => (item.generated ? '生成' : '显式'),
                      },
                      {
                        title: '可见',
                        key: 'public',
                        width: 80,
                        render: (_, item) => (item.public ? '是' : '否'),
                      },
                      { title: '分值', dataIndex: 'score', width: 80 },
                      { title: '输入', dataIndex: 'input', ellipsis: true },
                      { title: '输出', dataIndex: 'output', ellipsis: true },
                    ]}
                  />
                </>
              ) : (
                <Empty description="尚无命题草案" />
              )}
            </>
          ) : (
            <Empty description="暂无命题项目" />
          )}
        </Layout>
      </div>

      <Modal
        title="新建命题项目"
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
          <Form.Item name="title" label="名称" rules={[{ required: true }]}>
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item name="requirements" label="命题要求" rules={[{ required: true }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
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
          <Form.Item name="difficulty" label="难度">
            <Select
              options={[
                { value: 'easy', label: '简单' },
                { value: 'medium', label: '中等' },
                { value: 'hard', label: '困难' },
              ]}
            />
          </Form.Item>
          <Form.Item name="topics" label="知识点">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={reviewAction === 'approve' ? '批准命题修订' : '退回命题修订'}
        open={Boolean(reviewAction)}
        onCancel={() => !busy && setReviewAction(null)}
        onOk={() => void review()}
        confirmLoading={busy}
        destroyOnHidden
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item name="reason" label="审查意见" rules={[{ required: true }]}>
            <Input.TextArea rows={4} maxLength={2000} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="录入原生 OJ"
        open={publishOpen}
        onCancel={() => !busy && setPublishOpen(false)}
        onOk={() => void publish()}
        confirmLoading={busy}
        okText="上传并验证"
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
            <Form.Item name="groupId" label="编程题组 ID" rules={[{ required: true }]}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="judgeTemplateId" label="评测模板 ID" rules={[{ required: true }]}>
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="score" label="题组分值" rules={[{ required: true }]}>
              <InputNumber min={0} max={10000} />
            </Form.Item>
          </div>
          <Form.Item name="title" label="OJ 标题">
            <Input maxLength={128} />
          </Form.Item>
          <div className="ai-authoring-form-grid">
            <Form.Item name="timeLimit" label="时间限制 ms" rules={[{ required: true }]}>
              <InputNumber min={1} max={30000} />
            </Form.Item>
            <Form.Item name="memoryLimit" label="内存限制 KiB" rules={[{ required: true }]}>
              <InputNumber min={1024} max={1048576} />
            </Form.Item>
            <Form.Item name="outputLimit" label="输出限制 B" rules={[{ required: true }]}>
              <InputNumber min={1024} max={1048576} />
            </Form.Item>
          </div>
          <Form.Item name="problemCode" label="已创建的 OJ 题号">
            <Input />
          </Form.Item>
          <Form.Item name="checkpointIds" label="已上传的完整测试点 ID">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
