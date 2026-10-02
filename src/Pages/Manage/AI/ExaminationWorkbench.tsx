import React, { useEffect, useState } from 'react';
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

const stateLabels: Record<string, string> = {
  draft: '草稿',
  pending: '编排中',
  review: '待复核',
  approved: '已批准',
  published: '已发布',
};

const submissionLabels: Record<string, string> = {
  NOT_STARTED: '未开始',
  WORKING: '进行中',
  SUBMITTED: '已交卷',
};

function operationKey(prefix: string) {
  const value =
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${value}`.slice(0, 96);
}

export default function ExaminationWorkbench({ location }: { location?: { search?: string } }) {
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
    if (!reason.trim()) throw new Error('请填写操作依据');
  };
  return (
    <main className="ai-workspace">
      <div className="ai-workspace-body">
        <AIWorkspaceNav />
        <div className="ai-workspace-heading">
          <Typography.Title level={3}>考试与考务</Typography.Title>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              新建
            </Button>
            <Button
              aria-label="刷新"
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
                { title: '考试名称', render: (_, row) => String(row.data.title || row.id) },
                { title: '状态', dataIndex: 'state' },
                {
                  title: '操作',
                  render: (_, row) => (
                    <Button type="link" onClick={() => void action(() => selectExam(row.id))}>
                      查看
                    </Button>
                  ),
                },
              ]}
            />
            <Modal
              title="新建考试"
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
                <Form.Item name="title" label="考试名称" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="course_id" label="专用考试课程 ID" rules={[{ required: true }]}>
                  <InputNumber min={1} />
                </Form.Item>
                <Form.Item name="mode" label="模式">
                  <Select
                    options={[
                      { value: 'TEST', label: 'TEST 演练' },
                      { value: 'FORMAL', label: 'FORMAL 正式' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="roster" label="考生名单 CSV" rules={[{ required: true }]}>
                  <Input.TextArea rows={7} placeholder="学号,姓名,OJ用户名" />
                </Form.Item>
                <Button type="primary" icon={<PlusOutlined />} htmlType="submit" loading={busy}>
                  创建并编排
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
                      ? `已发布到 OJ 题单 ${data.native_psid}`
                      : current.state === 'approved'
                        ? '当前冻结版本已批准，发布前仍会校验内容哈希'
                        : data?.publication_plan
                          ? '发布内容已冻结，等待教师复核'
                          : data?.candidate
                            ? '座位编排已生成，正式成绩和原生座位尚未变更'
                            : '等待座位编排任务完成'
                  }
                />
                <Input.TextArea
                  aria-label="操作依据"
                  placeholder="操作依据"
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
                        setNotice('发布内容已准备，等待复核');
                      })
                    }
                  >
                    <Form.Item
                      name="groupId"
                      label="考生 OJ 用户组 ID"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} />
                    </Form.Item>
                    <Form.Item name="time" label="考试起止时间" rules={[{ required: true }]}>
                      <DatePicker.RangePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.List name="groupInfo">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map((field) => (
                            <Space key={field.key} align="start" wrap>
                              <Form.Item
                                name={[field.name, 'gid']}
                                label="题组 ID"
                                rules={[{ required: true }]}
                              >
                                <InputNumber min={1} />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, 'name']}
                                label="题组名称"
                                rules={[{ required: true }]}
                              >
                                <Input />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, 'score']}
                                label="分值"
                                rules={[{ required: true }]}
                              >
                                <InputNumber min={0} />
                              </Form.Item>
                              <Button danger onClick={() => remove(field.name)}>
                                移除
                              </Button>
                            </Space>
                          ))}
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() => add({ name: '', score: 100 })}
                          >
                            添加题组
                          </Button>
                        </>
                      )}
                    </Form.List>
                    {data?.mode === 'FORMAL' && (
                      <Form.Item
                        name="validated_test_id"
                        label="已验证 TEST 资源 ID"
                        rules={[{ required: true }]}
                      >
                        <Input />
                      </Form.Item>
                    )}
                    <Button htmlType="submit" icon={<SaveOutlined />} loading={busy}>
                      准备发布内容
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
                      批准当前版本
                    </Button>
                  )}
                  {data?.mode === 'FORMAL' && !data?.native_psid && (
                    <Checkbox
                      checked={formalAck}
                      onChange={(event) => setFormalAck(event.target.checked)}
                    >
                      确认发布正式考试
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
                          setNotice('考试已录入原生 OJ');
                        })
                      }
                    >
                      发布到 OJ
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
                          setNotice('TEST 验证已记录');
                        })
                      }
                    >
                      验证 TEST 交卷
                    </Button>
                  )}
                </Space>
                {!!data?.validation_certificate && (
                  <Descriptions
                    size="small"
                    bordered
                    column={{ xs: 1, sm: 2 }}
                    title="TEST 验证证书"
                  >
                    <Descriptions.Item label="完成答题卡">
                      {data.validation_certificate.completed_sheets}
                    </Descriptions.Item>
                    <Descriptions.Item label="验证人">
                      {data.validation_certificate.actor_id}
                    </Descriptions.Item>
                    <Descriptions.Item label="验证时间">
                      {new Date(data.validation_certificate.at).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="验证依据">
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
                      { title: '用户名', dataIndex: 'username' },
                      { title: '姓名', dataIndex: 'name' },
                      { title: '考场', dataIndex: 'room' },
                      { title: '座位', dataIndex: 'seat' },
                    ]}
                  />
                )}
                {!data?.native_psid && data?.candidate && !plannedRows.length && (
                  <Empty description="编排未生成可用座位，请检查考场容量与名单" />
                )}
                {!!data?.native_psid && (
                  <>
                    <Space wrap style={{ marginTop: 24 }}>
                      <InputNumber
                        aria-label="座位课程 ID"
                        min={1}
                        value={bindingCourse}
                        onChange={setBindingCourse}
                      />
                      <Checkbox
                        checked={replaceSeats}
                        onChange={(event) => setReplaceSeats(event.target.checked)}
                      >
                        替换现有考试座位
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
                            setNotice('座位已写入原生课程');
                          })
                        }
                      >
                        绑定原生座位
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
                            setNotice('座位已恢复');
                          })
                        }
                      >
                        恢复绑定前座位
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        href={`${service.defaults.baseURL}${base}/exams/${current.id}/roster.csv`}
                      >
                        导出名单
                      </Button>
                    </Space>
                    <Space wrap style={{ marginTop: 16 }}>
                      <Tag color="green">已交卷 {submitted}</Tag>
                      <Tag color="gold">进行中 {working}</Tag>
                      <Tag>未开始 {Math.max(0, rows.length - submitted - working)}</Tag>
                    </Space>
                    <Table
                      rowKey="username"
                      scroll={{ x: 600 }}
                      dataSource={rows}
                      columns={[
                        { title: '用户名', dataIndex: 'username' },
                        { title: '姓名', dataIndex: 'name' },
                        { title: '考场', dataIndex: 'room' },
                        { title: '座位', dataIndex: 'seat' },
                        {
                          title: '交卷',
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
