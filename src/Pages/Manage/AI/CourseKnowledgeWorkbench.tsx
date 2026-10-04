import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  List,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  UploadFile,
} from 'antd';
import {
  CloudUploadOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  CitationDetail,
  courseKnowledgeApi,
  KnowledgeMessage,
  KnowledgeResource,
} from '../../../Utils/API/course-knowledge';
import AIWorkspaceNav from './AIWorkspaceNav';
import { positiveIntParam } from './route-context';
import './course-knowledge-workbench.css';

type Props = { initialCourseId?: number; location?: { search?: string } };

export default function CourseKnowledgeWorkbench({ initialCourseId, location }: Props) {
  const { t } = useTranslation();
  const routeCourseId = positiveIntParam(location?.search, 'course_id');
  const selectedCourseId = initialCourseId || routeCourseId || null;
  const [courseIdInput, setCourseIdInput] = useState<number | null>(selectedCourseId);
  const [courseId, setCourseId] = useState<number | null>(selectedCourseId);
  const [documents, setDocuments] = useState<KnowledgeResource[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [conversation, setConversation] = useState<KnowledgeResource | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [jobStates, setJobStates] = useState<Record<string, string>>({});
  const [source, setSource] = useState<CitationDetail | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [externalResearch, setExternalResearch] = useState(false);
  const [uploadForm] = Form.useForm();
  const loadSequence = useRef(0);

  const load = useCallback(
    async (selectedCourse = courseId, selectedPage = page) => {
      if (!selectedCourse) return;
      const sequence = ++loadSequence.current;
      setLoading(true);
      setError('');
      try {
        const [documentPage, conversations] = await Promise.all([
          courseKnowledgeApi.listDocuments(selectedCourse, selectedPage),
          courseKnowledgeApi.listConversations(selectedCourse),
        ]);
        if (sequence !== loadSequence.current) return;
        setDocuments(documentPage.rows);
        setTotal(documentPage.totalNum);
        if (conversations.rows[0]) {
          const currentConversation = await courseKnowledgeApi.getResource(
            conversations.rows[0].id,
          );
          if (sequence === loadSequence.current) setConversation(currentConversation);
        } else {
          setConversation(null);
        }
      } catch (reason) {
        if (sequence === loadSequence.current) setError(String(reason));
      } finally {
        if (sequence === loadSequence.current) setLoading(false);
      }
    },
    [courseId, page],
  );

  useEffect(() => {
    if (courseId) void load();
    return () => {
      loadSequence.current += 1;
    };
  }, [courseId, page, load]);

  async function uploadAndIndex() {
    const values = await uploadForm.validateFields().catch(() => null);
    const selected = files.map((item) => item.originFileObj).filter(Boolean) as File[];
    if (!values || !courseId || selected.length === 0) return;
    setBusy(true);
    setError('');
    let resource: KnowledgeResource | null = null;
    try {
      resource = await courseKnowledgeApi.createDocument(courseId, values.title);
      setJobStates((states) => ({ ...states, [resource!.id]: 'uploading' }));
      const uploaded = [];
      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index];
        uploaded.push(
          await courseKnowledgeApi.uploadFile(
            resource.id,
            file,
            `${resource.id}-${index}-${file.name}-${file.size}`,
          ),
        );
      }
      resource = await courseKnowledgeApi.updateDocumentFiles(
        resource,
        uploaded.map((item) => item.id),
      );
      setJobStates((states) => ({ ...states, [resource!.id]: 'indexing' }));
      await courseKnowledgeApi.indexDocument(resource);
      setJobStates((states) => ({ ...states, [resource!.id]: 'success' }));
      setUploadOpen(false);
      setFiles([]);
      uploadForm.resetFields();
      await load(courseId, 1);
      setPage(1);
    } catch (reason) {
      if (resource) setJobStates((states) => ({ ...states, [resource!.id]: 'failed' }));
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }

  async function reindex(resource: KnowledgeResource) {
    setJobStates((states) => ({ ...states, [resource.id]: 'indexing' }));
    setError('');
    try {
      await courseKnowledgeApi.indexDocument(resource);
      setJobStates((states) => ({ ...states, [resource.id]: 'success' }));
      await load();
    } catch (reason) {
      setJobStates((states) => ({ ...states, [resource.id]: 'failed' }));
      setError(String(reason));
    }
  }

  async function ask() {
    const message = question.trim();
    if (!courseId || !message) return;
    setAsking(true);
    setError('');
    try {
      const active = conversation || (await courseKnowledgeApi.createConversation(courseId));
      setConversation(active);
      const answered = await courseKnowledgeApi.ask(active, message, externalResearch);
      setConversation(answered);
      setQuestion('');
    } catch (reason) {
      setError(String(reason));
    } finally {
      setAsking(false);
    }
  }

  async function openCitation(citation: string) {
    if (citation.startsWith('doi:')) {
      window.open(`https://doi.org/${citation.slice(4)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    setSourceLoading(true);
    setError('');
    try {
      setSource(await courseKnowledgeApi.resolveCitation(citation));
    } catch (reason) {
      setError(String(reason));
    } finally {
      setSourceLoading(false);
    }
  }

  const messages = conversation?.data.messages || [];
  const conflict =
    /conflict|version|changed|mismatch|differs|no longer current|冲突|版本|不一致|已变更/i.test(
      error,
    );
  return (
    <Layout className="ai-workspace ai-course-knowledge">
      <AIWorkspaceNav />
      <div className="ai-workspace-body">
        <header className="ai-course-header">
          <Typography.Title level={3}>{t('aiKnowledgeTitle')}</Typography.Title>
          <Space.Compact>
            <InputNumber
              min={1}
              value={courseIdInput}
              onChange={(value) => setCourseIdInput(value)}
              placeholder={t('aiKnowledgeCourseId')}
              aria-label={t('aiKnowledgeCourseId')}
            />
            <Button
              type="primary"
              onClick={() => {
                if (!courseIdInput) return;
                setPage(1);
                setCourseId(courseIdInput);
              }}
            >
              {t('aiKnowledgeOpenCourse')}
            </Button>
          </Space.Compact>
        </header>

        {error && (
          <Alert
            type={conflict ? 'warning' : 'error'}
            showIcon
            closable
            message={error}
            action={
              conflict && courseId ? (
                <Button size="small" onClick={() => void load()}>
                  {t('aiKnowledgeRefreshCourse')}
                </Button>
              ) : undefined
            }
            onClose={() => setError('')}
          />
        )}
        {!courseId ? (
          <Empty description={t('aiKnowledgeSelectCourse')} />
        ) : (
          <main className="ai-course-content">
            <section aria-labelledby="knowledge-documents-title">
              <div className="ai-course-section-header">
                <Typography.Title level={4} id="knowledge-documents-title">
                  {t('aiKnowledgeDocuments')}
                </Typography.Title>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    aria-label={t('aiKnowledgeRefreshDocuments')}
                    loading={loading}
                    onClick={() => void load()}
                  />
                  <Button
                    type="primary"
                    icon={<CloudUploadOutlined />}
                    onClick={() => setUploadOpen(true)}
                  >
                    {t('aiKnowledgeUploadDocuments')}
                  </Button>
                </Space>
              </div>
              <Table<KnowledgeResource>
                rowKey="id"
                loading={loading}
                dataSource={documents}
                scroll={{ x: 620 }}
                pagination={{
                  current: page,
                  total,
                  pageSize: 20,
                  showSizeChanger: false,
                  onChange: setPage,
                }}
                columns={[
                  {
                    title: t('aiKnowledgeDocumentColumn'),
                    key: 'title',
                    render: (_, row) => row.data.title || row.id,
                  },
                  {
                    title: t('aiKnowledgeIndexColumn'),
                    key: 'index',
                    width: 130,
                    render: (_, row) => {
                      const state = jobStates[row.id];
                      if (state === 'uploading')
                        return <Tag color="processing">{t('aiKnowledgeUploading')}</Tag>;
                      if (state === 'indexing')
                        return <Tag color="processing">{t('aiKnowledgeIndexing')}</Tag>;
                      if (state === 'failed')
                        return <Tag color="error">{t('aiKnowledgeFailed')}</Tag>;
                      if (row.data.indexed_version === row.version)
                        return <Tag color="success">{t('aiKnowledgeSearchable')}</Tag>;
                      return <Tag>{t('aiKnowledgePendingIndex')}</Tag>;
                    },
                  },
                  { title: t('aiKnowledgeVersionColumn'), dataIndex: 'version', width: 80 },
                  {
                    title: t('aiKnowledgeActionsColumn'),
                    key: 'actions',
                    width: 120,
                    render: (_, row) => (
                      <Button
                        icon={<FileSearchOutlined />}
                        loading={jobStates[row.id] === 'indexing'}
                        onClick={() => void reindex(row)}
                      >
                        {t('aiKnowledgeReindex')}
                      </Button>
                    ),
                  },
                ]}
              />
            </section>

            <section aria-labelledby="knowledge-chat-title" className="ai-course-chat">
              <Typography.Title level={4} id="knowledge-chat-title">
                {t('aiKnowledgeQATitle')}
              </Typography.Title>
              <div className="ai-course-chat-options">
                <Typography.Text>{t('aiKnowledgeExternalResearch')}</Typography.Text>
                <Switch
                  aria-label={t('aiKnowledgeExternalResearch')}
                  checked={externalResearch}
                  disabled={asking}
                  onChange={setExternalResearch}
                />
              </div>
              <div className="ai-course-messages" aria-live="polite">
                {messages.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('aiKnowledgeNoMessages')}
                  />
                ) : (
                  <List<KnowledgeMessage>
                    dataSource={messages}
                    renderItem={(item) => (
                      <List.Item className={`ai-course-message ai-course-message-${item.role}`}>
                        <div>
                          <Typography.Text type="secondary">
                            {item.role === 'user'
                              ? t('aiKnowledgeQuestionRole')
                              : t('aiKnowledgeAnswerRole')}
                          </Typography.Text>
                          <Typography.Paragraph>{item.text}</Typography.Paragraph>
                          {item.role === 'assistant' &&
                            (
                              (item.citation_details?.length
                                ? item.citation_details
                                : (item.citations || []).map((citation) => ({
                                    citation,
                                  }))) as CitationDetail[]
                            )?.map((detail) => (
                              <Button
                                type="link"
                                size="small"
                                key={detail.citation}
                                loading={sourceLoading}
                                onClick={() => void openCitation(detail.citation)}
                              >
                                {detail.file_name || detail.citation}
                                {detail.page
                                  ? ` · ${t('aiKnowledgePage', { page: detail.page })}`
                                  : ''}
                              </Button>
                            ))}
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
              <Space.Compact block>
                <Input.TextArea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onPressEnter={(event) => {
                    if (!event.shiftKey) {
                      event.preventDefault();
                      void ask();
                    }
                  }}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  aria-label={t('aiKnowledgeQuestionLabel')}
                  placeholder={t('aiKnowledgeQuestionPlaceholder')}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={asking}
                  disabled={!question.trim()}
                  onClick={() => void ask()}
                  aria-label={t('aiKnowledgeSendQuestion')}
                />
              </Space.Compact>
            </section>
          </main>
        )}
      </div>

      <Modal
        title={t('aiKnowledgeUploadTitle')}
        open={uploadOpen}
        onCancel={() => !busy && setUploadOpen(false)}
        onOk={() => void uploadAndIndex()}
        confirmLoading={busy}
        okButtonProps={{ disabled: files.length === 0 }}
        destroyOnHidden
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item name="title" label={t('aiKnowledgeDocumentName')} rules={[{ required: true }]}>
            <Input maxLength={120} />
          </Form.Item>
          <Upload.Dragger
            multiple
            fileList={files}
            accept=".pdf,.docx,.pptx,.md,.txt,.csv"
            beforeUpload={() => false}
            onChange={({ fileList }) => setFiles(fileList.slice(-20))}
          >
            <CloudUploadOutlined />
            <Typography.Text>{t('aiKnowledgeChooseFiles')}</Typography.Text>
          </Upload.Dragger>
        </Form>
      </Modal>

      <Drawer
        title={t('aiKnowledgeCitationTitle')}
        open={Boolean(source)}
        onClose={() => setSource(null)}
        width={520}
        destroyOnHidden
      >
        {source && (
          <>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('aiKnowledgeFile')}>
                {source.file_name || t('aiKnowledgeResourceText')}
              </Descriptions.Item>
              <Descriptions.Item label={t('aiKnowledgePageLabel')}>
                {source.page || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('aiKnowledgeOffset')}>
                {source.offset ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('aiKnowledgeVersionLabel')}>
                {source.resource_version || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('aiKnowledgeCitation')}>
                {source.citation}
              </Descriptions.Item>
            </Descriptions>
            <Typography.Paragraph className="ai-course-source-text">
              {source.text || source.source || t('aiKnowledgeNoCitationText')}
            </Typography.Paragraph>
            {source.evidence_confidence === 'requires_review' && (
              <Alert type="warning" showIcon message={t('aiKnowledgeCitationNeedsReview')} />
            )}
            {source.file_id && source.file_id !== 'text' && (
              <Button
                icon={<DownloadOutlined />}
                href={courseKnowledgeApi.fileUrl(source.file_id, source.page)}
                target="_blank"
                rel="noreferrer"
              >
                {t('aiKnowledgeOpenSource')}
              </Button>
            )}
          </>
        )}
      </Drawer>
    </Layout>
  );
}
