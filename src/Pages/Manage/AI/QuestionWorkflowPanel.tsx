import React, { useState } from 'react';
import {
  Alert,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  UploadFile,
} from 'antd';
import {
  BranchesOutlined,
  CameraOutlined,
  CloudUploadOutlined,
  EditOutlined,
  HistoryOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  AiResource,
  aiWorkbench,
  CollectionCollaboration,
  CollaborationSummary,
  CollectionItem,
  ResourceHistory,
} from '../../../Utils/API/ai-workbench';

type Props = { questions: AiResource[]; onChanged: () => Promise<void> };

export default function QuestionWorkflowPanel({ questions, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [collections, setCollections] = useState<AiResource[]>([]);
  const [collaborations, setCollaborations] = useState<CollaborationSummary[]>([]);
  const [collaboration, setCollaboration] = useState<CollectionCollaboration | null>(null);
  const [collaborationOwner, setCollaborationOwner] = useState<AiResource | null>(null);
  const [selected, setSelected] = useState<AiResource | null>(null);
  const [sharedQuestions, setSharedQuestions] = useState<AiResource[]>([]);
  const [manifestOwner, setManifestOwner] = useState<AiResource | null>(null);
  const [manifest, setManifest] = useState<CollectionItem[]>([]);
  const [history, setHistory] = useState<ResourceHistory | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [error, setError] = useState('');
  const [followup, setFollowup] = useState('');
  const [retryTask, setRetryTask] = useState<{
    type: 'question.solve' | 'question.verify' | 'question.chat';
    message?: string;
  } | null>(null);
  const [intakeForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  const [assignmentForm] = Form.useForm();

  async function loadCollections(courseId?: number) {
    setCollectionsLoading(true);
    setError('');
    try {
      const [owned, shared] = await Promise.all([
        aiWorkbench.listCollections(1, '', courseId),
        aiWorkbench.listCollaborations(),
      ]);
      const visibleShared = shared.filter((item) => !courseId || item.course_id === courseId);
      setCollaborations(visibleShared);
      const merged = [...owned.rows];
      for (const item of visibleShared) {
        if (!merged.some((row) => row.id === item.id)) {
          merged.push({
            id: item.id,
            kind: 'collection',
            version: item.version,
            state: item.role === 'pending' ? 'pending' : 'ready',
            data: { title: item.title },
          });
        }
      }
      setCollections(merged);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setCollectionsLoading(false);
    }
  }

  async function openPanel() {
    setOpen(true);
    await loadCollections();
  }

  async function submitIntake() {
    const values = await intakeForm.validateFields().catch(() => null);
    const selectedFiles = files.filter((item) => item.originFileObj);
    if (!values || (!values.text?.trim() && selectedFiles.length === 0)) return;
    setBusy(true);
    setError('');
    try {
      const uploads = [];
      for (let index = 0; index < selectedFiles.length; index += 1) {
        const selectedFile = selectedFiles[index];
        const file = selectedFile.originFileObj as File;
        uploads.push(await aiWorkbench.upload(file, `question-intake-${selectedFile.uid}`));
      }
      const intake = await aiWorkbench.intake({
        collection_id: Array.isArray(values.collectionId)
          ? values.collectionId[0]
          : values.collectionId || undefined,
        course_id: values.courseId ? Number(values.courseId) : undefined,
        title: values.title,
        text: values.text || '',
        file_ids: uploads.map((item) => item.id),
        batch_id: values.batchId || undefined,
        assignment_id: values.assignmentId || undefined,
        auto_solve: Boolean(values.autoSolve),
        auto_verify: Boolean(values.autoVerify),
      });
      await aiWorkbench.waitForJob(intake.taskId);
      setIntakeOpen(false);
      setFiles([]);
      intakeForm.resetFields();
      await Promise.all([loadCollections(), onChanged()]);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function runTask(
    taskType: 'question.solve' | 'question.verify' | 'question.chat',
    retryMessage?: string,
  ) {
    if (!selected) return;
    const message = retryMessage ?? followup.trim();
    if (taskType === 'question.chat' && !message) return;
    setBusy(true);
    setError('');
    try {
      setSelected(await aiWorkbench.runQuestionTask(selected.id, taskType, message || undefined));
      if (taskType === 'question.chat') setFollowup('');
      setRetryTask(null);
      await onChanged();
    } catch (reason) {
      setError(String(reason));
      setRetryTask({ type: taskType, message: message || undefined });
    } finally {
      setBusy(false);
    }
  }

  async function openHistory() {
    if (!selected) return;
    setHistoryLoading(true);
    setError('');
    try {
      setHistory(await aiWorkbench.history(selected.id));
    } catch (reason) {
      setError(String(reason));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function restoreVersion(version: number, revisionId: string) {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const restored = await aiWorkbench.restoreVersion(selected.id, version, revisionId);
      setSelected(restored);
      setHistory(null);
      await onChanged();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!selected) return;
    const values = await editForm.validateFields().catch(() => null);
    if (!values) return;
    setBusy(true);
    setError('');
    try {
      const updated = await aiWorkbench.update(selected, {
        zh: values.zh,
        original: values.original,
        answer: values.answer || '',
        explanation: values.explanation || '',
        tags: String(values.tags || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setSelected(updated);
      setEditing(false);
      await onChanged();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function openManifest(collection: AiResource) {
    setManifestOwner(collection);
    setManifest([]);
    setManifestLoading(true);
    setError('');
    try {
      const [manifestResult, firstPage] = await Promise.all([
        aiWorkbench.manifest(collection.id),
        aiWorkbench.collectionQuestions(collection.id),
      ]);
      setManifest(manifestResult.items);
      const pageCount = Math.ceil(firstPage.totalNum / 100);
      const remainingPages =
        pageCount > 1
          ? await Promise.all(
              Array.from({ length: pageCount - 1 }, (_, index) =>
                aiWorkbench.collectionQuestions(collection.id, index + 2),
              ),
            )
          : [];
      const questionRows = [firstPage, ...remainingPages].reduce(
        (rows, page) => rows.concat(page.rows),
        [] as Array<{ number: number; resource: AiResource }>,
      );
      setSharedQuestions((previous) => {
        const merged = [...previous];
        for (const item of questionRows) {
          if (!merged.some((row) => row.id === item.resource.id)) merged.push(item.resource);
        }
        return merged;
      });
    } catch (reason) {
      setError(String(reason));
    } finally {
      setManifestLoading(false);
    }
  }

  async function openCollaboration(collection: AiResource) {
    setCollaborationOwner(collection);
    setError('');
    try {
      setCollaboration(await aiWorkbench.collaboration(collection.id));
    } catch (reason) {
      setError(String(reason));
    }
  }

  async function acceptCollaboration(collectionId: string) {
    setBusy(true);
    try {
      await aiWorkbench.acceptCollaboration(collectionId);
      await loadCollections();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function inviteCollaborator() {
    if (!collaborationOwner) return;
    const values = await memberForm.validateFields().catch(() => null);
    if (!values) return;
    setBusy(true);
    try {
      await aiWorkbench.inviteCollaborator(collaborationOwner.id, {
        subject_id: String(values.subjectId),
        username: values.username,
        role: values.role,
        course_id: collaborationOwner.course_id || undefined,
      });
      memberForm.resetFields();
      setCollaboration(await aiWorkbench.collaboration(collaborationOwner.id));
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function assignWork() {
    if (!collaborationOwner) return;
    const values = await assignmentForm.validateFields().catch(() => null);
    if (!values) return;
    setBusy(true);
    try {
      await aiWorkbench.createAssignment(collaborationOwner.id, {
        assignee_id: values.assigneeId,
        title: values.title,
        description: values.description || '',
      });
      assignmentForm.resetFields();
      setCollaboration(await aiWorkbench.collaboration(collaborationOwner.id));
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function revokeCollaborator(subjectId: string) {
    if (!collaborationOwner) return;
    setBusy(true);
    try {
      await aiWorkbench.revokeCollaborator(collaborationOwner.id, subjectId);
      setCollaboration(await aiWorkbench.collaboration(collaborationOwner.id));
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function changeManifest(item: CollectionItem, action: string) {
    if (!manifestOwner) return;
    setBusy(true);
    setError('');
    try {
      if (action === 'detach') await aiWorkbench.detachItem(manifestOwner.id, item.number);
      if (action === 'restore') await aiWorkbench.restoreItem(manifestOwner.id, item.number);
      if (action === 'split') await aiWorkbench.detachDuplicate(manifestOwner.id, item.number);
      if (action === 'relink') await aiWorkbench.restoreDuplicate(manifestOwner.id, item.number);
      setManifest((await aiWorkbench.manifest(manifestOwner.id)).items);
      await onChanged();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function refreshPanel() {
    setError('');
    try {
      await Promise.all([loadCollections(), onChanged()]);
      if (selected) setSelected(await aiWorkbench.detail(selected.id));
      if (manifestOwner) {
        setManifest((await aiWorkbench.manifest(manifestOwner.id)).items);
      }
    } catch (reason) {
      setError(String(reason));
    }
  }

  const conflict =
    /conflict|version|changed|mismatch|differs|restore it explicitly|unavailable|冲突|版本|不一致|已变更/i.test(
      error,
    );

  return (
    <>
      <Button icon={<BranchesOutlined />} onClick={() => void openPanel()}>
        录题与修订
      </Button>
      <Drawer title="录题与修订" open={open} onClose={() => setOpen(false)} width={760}>
        {error && (
          <Alert
            type={conflict ? 'warning' : 'error'}
            showIcon
            message={error}
            action={
              conflict ? (
                <Button size="small" onClick={() => void refreshPanel()}>
                  刷新当前数据
                </Button>
              ) : undefined
            }
            closable
            onClose={() => setError('')}
          />
        )}
        <Space wrap>
          <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => setIntakeOpen(true)}>
            自动录题
          </Button>
          <Select
            aria-label="选择题目"
            showSearch
            placeholder="选择题目"
            style={{ width: 320 }}
            value={selected?.id}
            onChange={(id) =>
              setSelected([...questions, ...sharedQuestions].find((item) => item.id === id) || null)
            }
            options={[...questions, ...sharedQuestions].map((item) => ({
              value: item.id,
              label: item.data.zh || item.data.original || item.id,
            }))}
          />
        </Space>

        {selected && (
          <section>
            <Divider />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="题面">{selected.data.zh}</Descriptions.Item>
              <Descriptions.Item label="答案">{selected.data.answer || '未生成'}</Descriptions.Item>
              <Descriptions.Item label="解释">
                {selected.data.explanation || '未生成'}
              </Descriptions.Item>
              <Descriptions.Item label="校验">
                {selected.data.verification ? (
                  <Tag color={selected.data.verification.passed ? 'success' : 'warning'}>
                    {selected.data.verification.execution_blocked
                      ? '等待人工批准执行'
                      : selected.data.verification.passed
                        ? '通过'
                        : '未通过'}
                  </Tag>
                ) : (
                  '未校验'
                )}
              </Descriptions.Item>
            </Descriptions>
            <Space wrap>
              <Button loading={busy} onClick={() => void runTask('question.solve')}>
                解答
              </Button>
              <Button loading={busy} onClick={() => void runTask('question.verify')}>
                验证
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  editForm.setFieldsValue({
                    ...selected.data,
                    tags: selected.data.tags?.join(', '),
                  });
                  setEditing(true);
                }}
              >
                编辑
              </Button>
              <Button icon={<HistoryOutlined />} onClick={() => void openHistory()}>
                历史
              </Button>
            </Space>
            <Space.Compact block style={{ marginTop: 12 }}>
              <Input
                aria-label="题目追问"
                value={followup}
                onChange={(event) => setFollowup(event.target.value)}
                placeholder="输入针对当前题目的追问"
              />
              <Button
                loading={busy}
                disabled={!followup.trim()}
                onClick={() => void runTask('question.chat')}
              >
                发送追问
              </Button>
            </Space.Compact>
            {retryTask && (
              <Button
                danger
                icon={<ReloadOutlined />}
                loading={busy}
                onClick={() => void runTask(retryTask.type, retryTask.message)}
              >
                重试上一步
              </Button>
            )}
            {Boolean(selected.data.messages?.length) && (
              <List
                size="small"
                dataSource={selected.data.messages}
                renderItem={(message) => (
                  <List.Item>
                    <Typography.Text type={message.role === 'user' ? 'secondary' : undefined}>
                      {message.role === 'user' ? '提问：' : '回答：'}
                      {message.text}
                    </Typography.Text>
                  </List.Item>
                )}
              />
            )}
          </section>
        )}

        <Divider>题集批次</Divider>
        <List
          loading={collectionsLoading}
          dataSource={collections}
          locale={{ emptyText: '暂无题集' }}
          renderItem={(item) => (
            <List.Item
              actions={[
                collaborations.find((entry) => entry.id === item.id)?.role === 'pending' ? (
                  <Button
                    key="accept"
                    type="primary"
                    loading={busy}
                    onClick={() => void acceptCollaboration(item.id)}
                  >
                    接受邀请
                  </Button>
                ) : (
                  <Button key="manifest" onClick={() => void openManifest(item)}>
                    查看编号
                  </Button>
                ),
                collaborations.find((entry) => entry.id === item.id)?.role !== 'pending' ? (
                  <Button key="collaboration" onClick={() => void openCollaboration(item)}>
                    协作
                  </Button>
                ) : null,
              ]}
            >
              <List.Item.Meta
                title={item.data.title || item.id}
                description={`版本 ${item.version}`}
              />
            </List.Item>
          )}
        />
      </Drawer>

      <Modal
        title="自动录题"
        open={intakeOpen}
        onCancel={() => !busy && setIntakeOpen(false)}
        onOk={() => void submitIntake()}
        confirmLoading={busy}
        destroyOnHidden
      >
        <Form
          form={intakeForm}
          layout="vertical"
          initialValues={{ title: '题目录入批次', autoSolve: true, autoVerify: true }}
        >
          <Form.Item name="collectionId" label="追加到题集">
            <Select
              mode="tags"
              maxCount={1}
              allowClear
              tokenSeparators={[',']}
              placeholder="可选择或输入题集 ID"
              onChange={(values) => {
                const resource = collections.find((item) => item.id === values?.[0]);
                if (resource) void openCollaboration(resource);
              }}
              options={collections.map((item) => ({
                value: item.id,
                label: item.data.title || item.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="courseId" label="课程 ID">
            <Input
              type="number"
              min={1}
              placeholder="课程协作题集填写"
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (value > 0) void loadCollections(value);
              }}
            />
          </Form.Item>
          <Form.Item name="title" label="新题集名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="batchId" label="批次号">
            <Input placeholder="留空时按内容生成" />
          </Form.Item>
          <Form.Item name="assignmentId" label="分工">
            <Select
              allowClear
              placeholder="选择分配给你的任务"
              options={collaboration?.assignments
                .filter((item) => item.status === 'open')
                .map((item) => ({ value: item.id, label: item.title }))}
            />
          </Form.Item>
          <Form.Item name="text" label="题目文本">
            <Input.TextArea rows={8} />
          </Form.Item>
          <Upload
            accept="image/*"
            capture="environment"
            multiple={false}
            fileList={files}
            showUploadList={false}
            beforeUpload={() => false}
            onChange={({ fileList }) => setFiles(fileList.slice(-20))}
          >
            <Button icon={<CameraOutlined />}>拍照录题</Button>
          </Upload>
          <Upload.Dragger
            multiple
            fileList={files}
            accept="image/*,.pdf,.docx,.pptx,.md,.txt,.csv"
            beforeUpload={() => false}
            onChange={({ fileList }) => setFiles(fileList.slice(-20))}
          >
            <CloudUploadOutlined />
            <Typography.Text>选择照片或文档</Typography.Text>
          </Upload.Dragger>
          <Space>
            <Form.Item name="autoSolve" label="自动解答" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="autoVerify" label="自动验证" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal
        title="编辑题目"
        open={editing}
        onCancel={() => setEditing(false)}
        onOk={() => void saveEdit()}
        confirmLoading={busy}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="original" label="原题" rules={[{ required: true }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="zh" label="中文题面" rules={[{ required: true }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item name="answer" label="答案">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="explanation" label="解释">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="使用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修订历史"
        open={Boolean(history)}
        onCancel={() => setHistory(null)}
        footer={null}
        width={720}
        destroyOnHidden
      >
        <List
          loading={historyLoading}
          dataSource={history?.rows || []}
          locale={{ emptyText: '暂无修订历史' }}
          renderItem={(revision) => (
            <List.Item
              actions={[
                <Button
                  key="restore"
                  icon={<ReloadOutlined />}
                  loading={busy}
                  onClick={() => void restoreVersion(revision.version, revision.id)}
                >
                  恢复此版本
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={`版本 ${revision.version}`}
                description={revision.data.zh || revision.data.original}
              />
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title={
          collaborationOwner ? `${collaborationOwner.data.title || '题集'} · 协作` : '题集协作'
        }
        open={Boolean(collaborationOwner)}
        onCancel={() => {
          setCollaborationOwner(null);
          setCollaboration(null);
        }}
        footer={null}
        width={760}
        destroyOnHidden
      >
        {collaboration && (
          <>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="你的角色">{collaboration.role}</Descriptions.Item>
              <Descriptions.Item label="课程">
                {collaboration.course_id || '个人题集'}
              </Descriptions.Item>
            </Descriptions>
            <Divider>分工</Divider>
            <List
              size="small"
              locale={{ emptyText: '暂无分工' }}
              dataSource={collaboration.assignments}
              renderItem={(assignment) => (
                <List.Item>
                  <List.Item.Meta
                    title={assignment.title}
                    description={`${assignment.description || ''} · OJ ID ${assignment.assignee_id} · ${assignment.status}`}
                  />
                </List.Item>
              )}
            />
            {collaboration.role === 'owner' && (
              <>
                <Form form={assignmentForm} layout="vertical">
                  <Space wrap align="end">
                    <Form.Item name="assigneeId" label="协作者" rules={[{ required: true }]}>
                      <Select
                        style={{ width: 180 }}
                        options={collaboration.members
                          .filter(
                            (member) => member.status === 'active' && member.role !== 'viewer',
                          )
                          .map((member) => ({
                            value: member.subject_id,
                            label: `${member.username} (${member.subject_id})`,
                          }))}
                      />
                    </Form.Item>
                    <Form.Item name="title" label="任务" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item name="description" label="说明">
                      <Input />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" loading={busy} onClick={() => void assignWork()}>
                        分配
                      </Button>
                    </Form.Item>
                  </Space>
                </Form>
                <Divider>成员</Divider>
                <List
                  size="small"
                  dataSource={collaboration.members}
                  renderItem={(member) => (
                    <List.Item
                      actions={
                        member.status !== 'revoked'
                          ? [
                              <Button
                                key="revoke"
                                danger
                                size="small"
                                loading={busy}
                                onClick={() => void revokeCollaborator(member.subject_id)}
                              >
                                撤权
                              </Button>,
                            ]
                          : []
                      }
                    >
                      <List.Item.Meta
                        title={`${member.username} · ${member.subject_id}`}
                        description={`${member.role} · ${member.status}`}
                      />
                    </List.Item>
                  )}
                />
                <Form form={memberForm} layout="vertical">
                  <Space wrap align="end">
                    <Form.Item name="subjectId" label="OJ ID" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item name="username" label="OJ 用户名" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item name="role" label="角色" initialValue="contributor">
                      <Select
                        style={{ width: 140 }}
                        options={[
                          { value: 'viewer', label: '查看' },
                          { value: 'contributor', label: '录题' },
                          { value: 'editor', label: '编辑' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button loading={busy} onClick={() => void inviteCollaborator()}>
                        邀请
                      </Button>
                    </Form.Item>
                  </Space>
                </Form>
              </>
            )}
          </>
        )}
      </Modal>

      <Modal
        title={manifestOwner?.data.title || '题集编号'}
        open={Boolean(manifestOwner)}
        onCancel={() => setManifestOwner(null)}
        footer={null}
        width={760}
        destroyOnHidden
      >
        <Table<CollectionItem>
          loading={manifestLoading}
          rowKey="number"
          dataSource={manifest}
          locale={{ emptyText: '当前题集没有题目' }}
          pagination={false}
          columns={[
            { title: '编号', dataIndex: 'number', width: 72 },
            { title: '题目 ID', dataIndex: 'question_id' },
            { title: '批次', dataIndex: 'batch_id', width: 120 },
            { title: '状态', dataIndex: 'status', width: 90 },
            {
              title: '操作',
              key: 'action',
              width: 230,
              render: (_, item) => (
                <Space wrap>
                  {sharedQuestions.some((question) => question.id === item.question_id) && (
                    <Button
                      size="small"
                      onClick={() => {
                        setSelected(
                          sharedQuestions.find((question) => question.id === item.question_id) ||
                            null,
                        );
                        setManifestOwner(null);
                      }}
                    >
                      打开题目
                    </Button>
                  )}
                  {item.status === 'active' ? (
                    <Button
                      size="small"
                      disabled={busy}
                      onClick={() => void changeManifest(item, 'detach')}
                    >
                      移出
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      disabled={busy}
                      onClick={() => void changeManifest(item, 'restore')}
                    >
                      恢复
                    </Button>
                  )}
                  {item.duplicate_of && !item.duplicate_detached && (
                    <Button
                      size="small"
                      disabled={busy}
                      onClick={() => void changeManifest(item, 'split')}
                    >
                      拆分重复
                    </Button>
                  )}
                  {item.duplicate_of && item.duplicate_detached && (
                    <Button
                      size="small"
                      disabled={busy}
                      onClick={() => void changeManifest(item, 'relink')}
                    >
                      恢复重复关联
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
}
