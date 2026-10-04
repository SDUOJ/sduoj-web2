import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Select,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  CheckOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import request, { service } from '../../../Utils/API/request';
import { aiPlatform, PlatformResource } from '../../../Utils/API/ai-platform';
import AIWorkspaceNav from './AIWorkspaceNav';
import AITaskMonitor from './AITaskMonitor';
import { positiveIntParam } from './route-context';

const base = '/ps/auto-task/ai';
type SeatRow = { username: string; name: string; room: string; seat: number; submission: string };
type PlannedRoom = {
  name?: string;
  c_id?: number;
  assigned?: Array<{ username: string; name?: string; seat: number; user_id?: string }>;
};
type ExamData = {
  title?: string;
  mode?: 'TEST' | 'FORMAL';
  native_psid?: number;
  publication_plan?: Record<string, unknown>;
  candidate?: { rooms?: PlannedRoom[]; unassigned?: Array<Record<string, unknown>> };
  validation_certificate?: {
    completed_sheets: number;
    actor_id: string;
    reason: string;
    at: string;
  };
  course_binding?: { course_id: number };
};

function operationKey(prefix: string) {
  const value =
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${value}`.slice(0, 96);
}

export default function ExaminationWorkbench({ location }: { location?: { search?: string } }) {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);
  const [resources, setResources] = useState<PlatformResource[]>([]);
  const [current, setCurrent] = useState<PlatformResource>();
  const [task, setTask] = useState<string>();
  const [rows, setRows] = useState<SeatRow[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [formalAck, setFormalAck] = useState(false);
  const [replaceSeats, setReplaceSeats] = useState(false);
  const [planForm] = Form.useForm();
  const [publishForm] = Form.useForm();
  const [reason, setReason] = useState('');
  const [bindingCourse, setBindingCourse] = useState<number | null>(null);
  const data = current?.data as ExamData | undefined;
  const plannedRows: SeatRow[] =
    data?.candidate?.rooms?.flatMap((room) =>
      (room.assigned || []).map((person) => ({
        username: person.username,
        name: person.name || '',
        room: room.name || String(room.c_id || ''),
        seat: person.seat,
        submission: 'PLANNED',
      })),
    ) || [];
  const submitted = rows.filter((row) => row.submission === 'SUBMITTED').length;
  const working = rows.filter((row) => row.submission === 'WORKING').length;
  const currentId = current?.id;
  const nativePsid = data?.native_psid;
  const stateLabels: Record<string, string> = {
    draft: t('aiExamStateDraft'),
    pending: t('aiExamStatePending'),
    review: t('aiExamStateReview'),
    approved: t('aiExamStateApproved'),
    published: t('aiExamStatePublished'),
  };
  const submissionLabels: Record<string, string> = {
    NOT_STARTED: t('aiExamSubmissionNotStarted'),
    WORKING: t('aiExamSubmissionWorking'),
    SUBMITTED: t('aiExamSubmissionSubmitted'),
  };
  async function load() {
    setResources((await aiPlatform.list('exam')).rows);
  }
  useEffect(() => {
    void load().catch((value) => setError(String(value)));
  }, []);
  useEffect(() => {
    if (!nativePsid || !currentId) return;
    let active = true;
    const refresh = () =>
      request
        .get<{ rows: SeatRow[] }>(`${base}/exams/${currentId}/monitor`)
        .then((value) => {
          if (active) setRows(value.rows);
        })
        .catch((value) => {
          if (active) setError(String(value));
        });
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [currentId, nativePsid]);
  async function action(operation: () => Promise<void>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await operation();
      await load();
    } catch (value) {
      setError(String(value));
    } finally {
      setBusy(false);
    }
  }
  async function refreshCurrent() {
    if (current) setCurrent(await aiPlatform.get(current.id));
  }
  async function selectExam(id: string) {
    const row = await aiPlatform.get(id);
    const selected = row.data as ExamData;
    setCurrent(row);
    setRows([]);
    setFormalAck(false);
    setReplaceSeats(false);
    setBindingCourse(selected.course_binding?.course_id || row.course_id || null);
  }
  const requireReason = () => {
    if (!reason.trim()) throw new Error(t('aiExamReasonRequired'));
  };
  return (
    <main className="ai-workspace">
      <div className="ai-workspace-body">
        <AIWorkspaceNav />
        <div className="ai-workspace-heading">
          <Typography.Title level={3}>{t('aiExamTitle')}</Typography.Title>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              {t('aiExamNew')}
            </Button>
            <Button
              aria-label={t('aiExamRefresh')}
              icon={<ReloadOutlined />}
              loading={busy}
              onClick={() =>
                void action(async () => {
                  await refreshCurrent();
                })
              }
            />
          </Space>
        </div>
        {error && <Alert type="error" message={error} showIcon />}
        {notice && <Alert type="success" message={notice} showIcon />}
        <div className="ai-workspace-columns">
          <section>
            <Table<PlatformResource>
              size="small"
              rowKey="id"
              dataSource={resources}
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: t('aiExamListName'),
                  render: (_, row) => String(row.data.title || row.id),
                },
                { title: t('aiExamListStatus'), dataIndex: 'state' },
                {
                  title: t('aiExamListActions'),
                  render: (_, row) => (
                    <Button type="link" onClick={() => void action(() => selectExam(row.id))}>
                      {t('aiExamView')}
                    </Button>
                  ),
                },
              ]}
            />
            <Modal
              title={t('aiExamNew')}
              open={createOpen}
              onCancel={() => setCreateOpen(false)}
              footer={null}
              forceRender
            >
              <Form
                form={planForm}
                layout="vertical"
                initialValues={{
                  mode: 'TEST',
                  course_id: positiveIntParam(location?.search, 'course_id'),
                }}
                onFinish={(values) =>
                  void action(async () => {
                    const [roster, rooms] = await Promise.all([
                      request.post<{ rows: Array<Record<string, unknown>> }>(
                        base + '/exams/roster/parse',
                        { text: values.roster, course_id: values.course_id, resolve_users: true },
                      ),
                      request.get<{ rows: Array<Record<string, unknown>> }>(base + '/exams/rooms', {
                        course_id: values.course_id,
                      }),
                    ]);
                    const resource = await aiPlatform.create(
                      'exam',
                      {
                        title: values.title,
                        mode: values.mode,
                        candidates: roster.rows,
                        rooms: rooms.rows,
                        randomize: true,
                      },
                      { course_id: values.course_id },
                    );
                    setCreateOpen(false);
                    setCurrent(resource);
                    setBindingCourse(values.course_id);
                    setTask(
                      (await aiPlatform.submit(resource, 'exam.plan', operationKey('exam-plan')))
                        .taskId,
                    );
                  })
                }
              >
                <Form.Item name="title" label={t('aiExamName')} rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item
                  name="course_id"
                  label={t('aiExamDedicatedCourse')}
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item name="mode" label={t('aiExamMode')}>
                  <Select
                    options={[
                      { value: 'TEST', label: t('aiExamTestMode') },
                      { value: 'FORMAL', label: t('aiExamFormalMode') },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="roster" label={t('aiExamRoster')} rules={[{ required: true }]}>
                  <Input.TextArea rows={7} placeholder={t('aiExamRosterHint')} />
                </Form.Item>
                <Button type="primary" icon={<PlusOutlined />} htmlType="submit" loading={busy}>
                  {t('aiExamCreatePlan')}
                </Button>
              </Form>
            </Modal>
          </section>
          <section>
            {current && (
              <>
                <Space wrap>
                  <Typography.Title level={4}>
                    {String(current.data.title || current.id)}
                  </Typography.Title>
                  <Tag>{String(data?.mode)}</Tag>
                  <Tag>{stateLabels[current.state] || current.state}</Tag>
                  <Tag>v{current.version}</Tag>
                </Space>
                <Alert
                  showIcon
                  type={
                    data?.native_psid
                      ? 'success'
                      : current.state === 'approved'
                        ? 'warning'
                        : 'info'
                  }
                  message={
                    data?.native_psid
                      ? t('aiExamPublishedTo', { psid: data.native_psid })
                      : current.state === 'approved'
                        ? t('aiExamApprovedDescription')
                        : data?.publication_plan
                          ? t('aiExamFrozenDescription')
                          : data?.candidate
                            ? t('aiExamPlannedDescription')
                            : t('aiExamPlanningDescription')
                  }
                />
                <Input.TextArea
                  aria-label={t('aiExamOperationReason')}
                  placeholder={t('aiExamOperationReason')}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={2}
                />
                {!data?.native_psid && (
                  <Form
                    form={publishForm}
                    layout="vertical"
                    initialValues={{ groupInfo: [{ gid: undefined, name: '', score: 100 }] }}
                    onFinish={(values) =>
                      void action(async () => {
                        const [start, end] = values.time;
                        const problem_set = {
                          name: String(data?.title),
                          type: 1,
                          tag: 'AI examination',
                          groupId: values.groupId,
                          groupInfo: values.groupInfo,
                          tm_start: start.valueOf(),
                          tm_end: end.valueOf(),
                          config: {
                            useSameSE: 1,
                            showReport: 0,
                            showScoreInRunning: 0,
                            showProgramScoreInRunning: 0,
                            mergerSubjectiveGroup: 0,
                          },
                        };
                        await request.post(`${base}/exams/${current.id}/prepare`, {
                          version: current.version,
                          problem_set,
                          validated_test_id: values.validated_test_id,
                        });
                        await refreshCurrent();
                        setNotice(t('aiExamPreparedNotice'));
                      })
                    }
                  >
                    <Form.Item
                      name="groupId"
                      label={t('aiExamCandidateGroup')}
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} />
                    </Form.Item>
                    <Form.Item
                      name="time"
                      label={t('aiExamTimeRange')}
                      rules={[{ required: true }]}
                    >
                      <DatePicker.RangePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.List name="groupInfo">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map((field) => (
                            <Space key={field.key} align="start" wrap>
                              <Form.Item
                                name={[field.name, 'gid']}
                                label={t('aiExamQuestionGroupId')}
                                rules={[{ required: true }]}
                              >
                                <InputNumber min={1} />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, 'name']}
                                label={t('aiExamQuestionGroupName')}
                                rules={[{ required: true }]}
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, 'score']}
                                label={t('aiExamScore')}
                                rules={[{ required: true }]}
                              >
                                <InputNumber min={0} />
                              </Form.Item>
                              <Button danger onClick={() => remove(field.name)}>
                                {t('aiExamRemoveGroup')}
                              </Button>
                            </Space>
                          ))}
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() => add({ name: '', score: 100 })}
                          >
                            {t('aiExamAddGroup')}
                          </Button>
                        </>
                      )}
                    </Form.List>
                    {data?.mode === 'FORMAL' && (
                      <Form.Item
                        name="validated_test_id"
                        label={t('aiExamVerifiedTestResource')}
                        rules={[{ required: true }]}
                      >
                        <Input />
                      </Form.Item>
                    )}
                    <Button htmlType="submit" icon={<SaveOutlined />} loading={busy}>
                      {t('aiExamPrepare')}
                    </Button>
                  </Form>
                )}
                <Space wrap style={{ marginTop: 16 }}>
                  {!data?.native_psid && !!data?.publication_plan && (
                    <Button
                      icon={<CheckOutlined />}
                      loading={busy}
                      onClick={() =>
                        void action(async () => {
                          requireReason();
                          await request.post(`${base}/resources/${current.id}/review`, {
                            version: current.version,
                            reason,
                          });
                          await refreshCurrent();
                        })
                      }
                    >
                      {t('aiExamApprove')}
                    </Button>
                  )}
                  {data?.mode === 'FORMAL' && !data?.native_psid && (
                    <Checkbox
                      checked={formalAck}
                      onChange={(event) => setFormalAck(event.target.checked)}
                    >
                      {t('aiExamConfirmPublication')}
                    </Checkbox>
                  )}
                  {!data?.native_psid && (
                    <Button
                      type="primary"
                      disabled={
                        current.state !== 'approved' || (data?.mode === 'FORMAL' && !formalAck)
                      }
                      loading={busy}
                      onClick={() =>
                        void action(async () => {
                          requireReason();
                          await request.post(`${base}/exams/${current.id}/publish`, {
                            version: current.version,
                            problem_set: data?.publication_plan,
                            dry_run: false,
                            formal_ack: formalAck,
                          });
                          await refreshCurrent();
                          setNotice(t('aiExamPublishedNotice'));
                        })
                      }
                    >
                      {t('aiExamPublish')}
                    </Button>
                  )}
                  {!!data?.native_psid && data.mode === 'TEST' && (
                    <Button
                      icon={<CheckOutlined />}
                      onClick={() =>
                        void action(async () => {
                          requireReason();
                          await request.post(`${base}/exams/${current.id}/validate-test`, {
                            version: current.version,
                            reason,
                          });
                          await refreshCurrent();
                          setNotice(t('aiExamTestValidatedNotice'));
                        })
                      }
                    >
                      {t('aiExamValidateTest')}
                    </Button>
                  )}
                </Space>
                {!!data?.validation_certificate && (
                  <Descriptions
                    size="small"
                    bordered
                    column={{ xs: 1, sm: 2 }}
                    title={t('aiExamTestCertificate')}
                  >
                    <Descriptions.Item label={t('aiExamCompletedAnswerSheets')}>
                      {data.validation_certificate.completed_sheets}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('aiExamValidator')}>
                      {data.validation_certificate.actor_id}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('aiExamValidationTime')}>
                      {new Date(data.validation_certificate.at).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('aiExamValidationReason')}>
                      {data.validation_certificate.reason}
                    </Descriptions.Item>
                  </Descriptions>
                )}
                {!data?.native_psid && plannedRows.length > 0 && (
                  <Table
                    rowKey={(row) => `${row.room}:${row.seat}`}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    dataSource={plannedRows}
                    columns={[
                      { title: t('aiExamUsername'), dataIndex: 'username' },
                      { title: t('aiExamCandidateName'), dataIndex: 'name' },
                      { title: t('aiExamRoom'), dataIndex: 'room' },
                      { title: t('aiExamSeat'), dataIndex: 'seat' },
                    ]}
                  />
                )}
                {!data?.native_psid && data?.candidate && !plannedRows.length && (
                  <Empty description={t('aiExamNoSeats')} />
                )}
                {!!data?.native_psid && (
                  <>
                    <Space wrap style={{ marginTop: 24 }}>
                      <InputNumber
                        aria-label={t('aiExamSeatCourse')}
                        min={1}
                        value={bindingCourse}
                        onChange={setBindingCourse}
                      />
                      <Checkbox
                        checked={replaceSeats}
                        onChange={(event) => setReplaceSeats(event.target.checked)}
                      >
                        {t('aiExamReplaceSeats')}
                      </Checkbox>
                      <Button
                        icon={<SaveOutlined />}
                        loading={busy}
                        disabled={!bindingCourse}
                        onClick={() =>
                          void action(async () => {
                            requireReason();
                            await request.post(`${base}/exams/${current.id}/bind-course`, {
                              version: current.version,
                              course_id: bindingCourse,
                              reason,
                              replace_existing: replaceSeats,
                            });
                            await refreshCurrent();
                            setNotice(t('aiExamSeatsBoundNotice'));
                          })
                        }
                      >
                        {t('aiExamBindSeats')}
                      </Button>
                      <Button
                        icon={<UndoOutlined />}
                        loading={busy}
                        disabled={!data.course_binding}
                        onClick={() =>
                          void action(async () => {
                            requireReason();
                            await request.post(`${base}/exams/${current.id}/unbind-course`, {
                              version: current.version,
                              reason,
                            });
                            await refreshCurrent();
                            setNotice(t('aiExamSeatsRestoredNotice'));
                          })
                        }
                      >
                        {t('aiExamRestoreSeats')}
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        href={`${service.defaults.baseURL}${base}/exams/${current.id}/roster.csv`}
                      >
                        {t('aiExamExportRoster')}
                      </Button>
                    </Space>
                    <Space wrap style={{ marginTop: 16 }}>
                      <Tag color="green">
                        {t('aiExamSubmitted')} {submitted}
                      </Tag>
                      <Tag color="gold">
                        {t('aiExamWorking')} {working}
                      </Tag>
                      <Tag>
                        {t('aiExamNotStarted')} {Math.max(0, rows.length - submitted - working)}
                      </Tag>
                    </Space>
                    <Table
                      rowKey="username"
                      scroll={{ x: 600 }}
                      dataSource={rows}
                      columns={[
                        { title: t('aiExamUsername'), dataIndex: 'username' },
                        { title: t('aiExamCandidateName'), dataIndex: 'name' },
                        { title: t('aiExamRoom'), dataIndex: 'room' },
                        { title: t('aiExamSeat'), dataIndex: 'seat' },
                        {
                          title: t('aiExamSubmission'),
                          dataIndex: 'submission',
                          render: (value: string) => submissionLabels[value] || value,
                        },
                      ]}
                    />
                  </>
                )}
              </>
            )}
            <AITaskMonitor
              taskId={task}
              onComplete={(job) => {
                if (job.status === 'pending') setTask(job.id);
                else void action(refreshCurrent);
              }}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
