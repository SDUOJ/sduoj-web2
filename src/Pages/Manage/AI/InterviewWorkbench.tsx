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
import { useTranslation } from 'react-i18next';
import AIWorkspaceNav from './AIWorkspaceNav';
import { UrlPrefix } from '../../../Config/constValue';
import { interviewApi, InterviewResource, MediaTrack, operationKey } from './interview-api';
import './interview-workbench.css';

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
  const { t } = useTranslation();
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
  const statusText: Record<string, string> = {
    pending: t('aiInterviewListStatusPending'),
    running: t('aiInterviewListStatusRunning'),
    awaiting_answer: t('aiInterviewListStatusAwaitingAnswer'),
    completed: t('aiInterviewListStatusCompleted'),
    expired: t('aiInterviewListStatusExpired'),
    cancelled: t('aiInterviewListStatusCancelled'),
    adopted: t('aiInterviewListStatusAdopted'),
    rejected: t('aiInterviewListStatusRejected'),
    approved: t('aiInterviewListStatusApproved'),
    failed: t('aiInterviewListStatusFailed'),
  };

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
            <Typography.Title level={2}>{t('aiInterviewListTitle')}</Typography.Title>
            <Typography.Text type="secondary">
              {t('aiInterviewListTotal', { count: total })}
            </Typography.Text>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              aria-label={t('aiInterviewListRefresh')}
              loading={loading}
              onClick={() => void load()}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setInviteOpen(true)}>
              {t('aiInterviewListInvite')}
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
              { label: t('aiInterviewListScopeAll'), value: 'all' },
              { label: t('aiInterviewListScopeAssigned'), value: 'assigned' },
              { label: t('aiInterviewListScopeManaged'), value: 'managed' },
            ]}
            onChange={(value: Scope) => {
              setScope(value);
              setPage(1);
            }}
          />
          <Select
            aria-label={t('aiInterviewListStatusAria')}
            value={status || undefined}
            allowClear
            placeholder={t('aiInterviewListStatusPlaceholder')}
            style={{ width: 160 }}
            options={[
              { value: 'pending', label: t('aiInterviewListStatusPending') },
              { value: 'running', label: t('aiInterviewListStatusRunning') },
              { value: 'awaiting_answer', label: t('aiInterviewListStatusAwaitingAnswer') },
              { value: 'completed', label: t('aiInterviewListStatusCompleted') },
              { value: 'expired', label: t('aiInterviewListStatusExpired') },
              { value: 'cancelled', label: t('aiInterviewListStatusCancelled') },
              { value: 'approved', label: t('aiInterviewListStatusApproved') },
              { value: 'rejected', label: t('aiInterviewListStatusRejected') },
              { value: 'adopted', label: t('aiInterviewListStatusAdopted') },
              { value: 'failed', label: t('aiInterviewListStatusFailed') },
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
              title: t('aiInterviewListColumnInterview'),
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
              title: t('aiInterviewListColumnRole'),
              dataIndex: 'role',
              width: 100,
              render: (role: InterviewResource['role']) =>
                role === 'student'
                  ? t('aiInterviewListRoleStudent')
                  : t('aiInterviewListRoleTeacher'),
            },
            {
              title: t('aiInterviewListColumnDeadline'),
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
              title: t('aiInterviewListColumnStatus'),
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
                    {t('aiInterviewListReinvite')}
                  </Button>
                ) : (
                  <RightOutlined aria-label={t('aiInterviewListOpen')} />
                ),
            },
          ]}
        />
      </main>

      <Modal
        title={t('aiInterviewListInviteTitle')}
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
              { name: t('aiInterviewRubricCorrectness'), max_score: 60 },
              { name: t('aiInterviewRubricExpression'), max_score: 40 },
            ],
            bindNative: false,
          }}
        >
          <Alert
            type="info"
            showIcon
            message={t('aiInterviewEvidenceScope')}
            description={t('aiInterviewEvidenceScopeDescription')}
          />
          <div className="ai-interview-form-grid">
            <Form.Item name="title" label={t('aiInterviewFieldTitle')} rules={[{ required: true }]}>
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item
              name="studentUsername"
              label={t('aiInterviewFieldStudentUsername')}
              rules={[{ required: true }]}
            >
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item
              name="studentId"
              label={t('aiInterviewFieldStudentId')}
              rules={[{ required: true, pattern: /^\d+$/ }]}
            >
              <Input maxLength={64} />
            </Form.Item>
            <Form.Item name="language" label={t('aiInterviewFieldLanguage')}>
              <Input maxLength={40} />
            </Form.Item>
            <Form.Item name="psid" label={t('aiInterviewFieldProblemSetId')}>
              <InputNumber min={1} precision={0} />
            </Form.Item>
            <Form.Item name="courseId" label={t('aiInterviewFieldCourseId')}>
              <InputNumber min={1} precision={0} />
            </Form.Item>
            <Form.Item
              name="maxQuestions"
              label={t('aiInterviewFieldMaxQuestions')}
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={20} precision={0} />
            </Form.Item>
            <Form.Item
              name="durationMinutes"
              label={t('aiInterviewFieldDurationMinutes')}
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={120} precision={0} />
            </Form.Item>
            <Form.Item
              name="expiresInHours"
              label={t('aiInterviewFieldExpiresInHours')}
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={720} precision={0} />
            </Form.Item>
            <Form.Item
              name="requiredTracks"
              label={t('aiInterviewFieldRequiredMedia')}
              rules={[{ required: true }]}
            >
              <Checkbox.Group
                options={[
                  { label: t('aiInterviewTrackVideo'), value: 'video' },
                  { label: t('aiInterviewTrackAudio'), value: 'audio' },
                  { label: t('aiInterviewTrackScreen'), value: 'screen' },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item name="question" label={t('aiInterviewFieldQuestion')}>
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
          </Form.Item>
          <Form.Item name="code" label={t('aiInterviewFieldCode')}>
            <Input.TextArea
              className="ai-interview-code-input"
              autoSize={{ minRows: 3, maxRows: 10 }}
            />
          </Form.Item>
          <Form.Item name="report" label={t('aiInterviewFieldReport')}>
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 10 }} />
          </Form.Item>
          <div className="ai-interview-native-toggle">
            <Typography.Text strong>{t('aiInterviewFieldBindNative')}</Typography.Text>
            <Form.Item name="bindNative" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
          {nativeSource && (
            <div className="ai-interview-form-grid">
              <Form.Item
                name="gid"
                label={t('aiInterviewFieldGroupId')}
                rules={[{ required: true }]}
              >
                <InputNumber min={1} precision={0} />
              </Form.Item>
              <Form.Item
                name="pid"
                label={t('aiInterviewFieldSubjectiveProblemId')}
                rules={[{ required: true }]}
              >
                <InputNumber min={1} precision={0} />
              </Form.Item>
            </div>
          )}
          {!nativeSource && (
            <Form.List name="rubric">
              {(fields, { add, remove }) => (
                <div className="ai-interview-rubric-editor">
                  <div className="ai-interview-row-heading">
                    <Typography.Text strong>{t('aiInterviewRubric')}</Typography.Text>
                    <Button
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => add({ name: '', max_score: 10 })}
                    >
                      {t('aiInterviewAddRubric')}
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
                        <Input placeholder={t('aiInterviewRubricPlaceholder')} />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        key={`${field.key}-score`}
                        name={[field.name, 'max_score']}
                        rules={[{ required: true }]}
                      >
                        <InputNumber
                          min={0.1}
                          max={10000}
                          placeholder={t('aiInterviewFullScore')}
                        />
                      </Form.Item>
                      <Button danger type="text" onClick={() => remove(field.name)}>
                        {t('aiInterviewDelete')}
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
