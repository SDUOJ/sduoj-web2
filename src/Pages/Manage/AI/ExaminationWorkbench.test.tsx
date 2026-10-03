import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ExaminationWorkbench from './ExaminationWorkbench';
import request from '../../../Utils/API/request';
import { aiPlatform, PlatformResource } from '../../../Utils/API/ai-platform';

jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  const react = jest.requireActual('react');
  return {
    ...actual,
    DatePicker: {
      ...actual.DatePicker,
      RangePicker: ({
        onChange,
      }: {
        onChange?: (value: Array<{ valueOf: () => number }>) => void;
      }) =>
        react.createElement(
          'button',
          {
            type: 'button',
            onClick: () =>
              onChange?.([
                { valueOf: () => 1_788_570_000_000 },
                { valueOf: () => 1_788_577_200_000 },
              ]),
          },
          '设定考试时间',
        ),
    },
  };
});

jest.mock('../../../Utils/API/request', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  service: { defaults: { baseURL: '/api' } },
}));

jest.mock('../../../Utils/API/ai-platform', () => ({
  aiPlatform: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    submit: jest.fn(),
  },
}));

jest.mock('./AIWorkspaceNav', () => () => <nav>AI nav</nav>);
jest.mock('./AITaskMonitor', () => ({ taskId }: { taskId?: string }) => (
  <div data-testid="task-monitor">{taskId || 'no-task'}</div>
));

const plannedExam = (overrides: Partial<PlatformResource> = {}): PlatformResource => ({
  id: 'exam-1',
  kind: 'exam',
  version: 3,
  state: 'review',
  course_id: 7,
  data: {
    title: '期末实验考试',
    mode: 'TEST',
    candidate: {
      rooms: [
        {
          name: '实验室 A',
          assigned: [{ username: 'alice', name: 'Alice', seat: 12, user_id: '42' }],
        },
      ],
      unassigned: [],
    },
  },
  ...overrides,
});

let current: PlatformResource;

beforeEach(() => {
  jest.clearAllMocks();
  current = plannedExam();
  (aiPlatform.list as jest.Mock).mockImplementation(async () => ({ rows: [current], totalNum: 1 }));
  (aiPlatform.get as jest.Mock).mockImplementation(async () => current);
  (request.get as jest.Mock).mockResolvedValue({ rows: [] });
  (request.post as jest.Mock).mockResolvedValue({});
});

async function selectExam(label: string) {
  fireEvent.click((await screen.findAllByRole('button', { name: '查看' }))[0]);
  await waitFor(
    () => expect(screen.getByRole('heading', { name: /期末实验考试|正式考试|已发布考试/ })).toBeVisible(),
    { timeout: 10000 },
  );
}

test('prefills the course supplied by course management', async () => {
  render(<ExaminationWorkbench location={{ search: '?course_id=7' }} />);
  expect(screen.getByLabelText('专用考试课程 ID')).toHaveValue('7');
});

test('parses a roster, creates an exam, and submits seat planning', async () => {
  (aiPlatform.list as jest.Mock).mockResolvedValue({ rows: [], totalNum: 0 });
  (request.post as jest.Mock).mockResolvedValueOnce({
    rows: [{ student_id: '2026001', name: 'Alice', username: 'alice', user_id: '42' }],
  });
  (request.get as jest.Mock).mockResolvedValueOnce({
    rows: [{ name: '实验室 A', capacity: 30 }],
  });
  (aiPlatform.create as jest.Mock).mockResolvedValue(plannedExam({ state: 'draft', version: 1 }));
  (aiPlatform.submit as jest.Mock).mockResolvedValue({ taskId: 'job-exam-plan' });
  render(<ExaminationWorkbench />);
  fireEvent.click(screen.getByRole('button', { name: /新\s*建/ }));
  fireEvent.change(screen.getByLabelText('考试名称'), { target: { value: '期末实验考试' } });
  fireEvent.change(screen.getByLabelText('专用考试课程 ID'), { target: { value: '7' } });
  fireEvent.change(screen.getByLabelText('考生名单 CSV'), {
    target: { value: '2026001,Alice,alice' },
  });
  fireEvent.click(screen.getByRole('button', { name: /创建并编排/ }));

  await waitFor(() => expect(aiPlatform.submit).toHaveBeenCalled());
  expect(request.post).toHaveBeenCalledWith('/ps/auto-task/ai/exams/roster/parse', {
    text: '2026001,Alice,alice',
    course_id: 7,
    resolve_users: true,
  });
  expect(request.get).toHaveBeenCalledWith('/ps/auto-task/ai/exams/rooms', { course_id: 7 });
  expect(aiPlatform.create).toHaveBeenCalledWith(
    'exam',
    expect.objectContaining({ title: '期末实验考试', mode: 'TEST', randomize: true }),
    { course_id: 7 },
  );
  expect(aiPlatform.submit).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'exam-1' }),
    'exam.plan',
    expect.any(String),
  );
  expect(await screen.findByTestId('task-monitor')).toHaveTextContent('job-exam-plan');
});

test('freezes the publication payload from the reviewed seat plan', async () => {
  render(<ExaminationWorkbench />);
  await selectExam('期末实验考试 · review');
  expect(screen.getByText('alice')).toBeInTheDocument();
  expect(screen.getByText('实验室 A')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('考生 OJ 用户组 ID'), { target: { value: '88' } });
  fireEvent.click(screen.getByRole('button', { name: '设定考试时间' }));
  fireEvent.change(screen.getByLabelText('题组 ID'), { target: { value: '9' } });
  fireEvent.change(screen.getByLabelText('题组名称'), { target: { value: '程序设计' } });
  fireEvent.change(screen.getByLabelText('分值'), { target: { value: '100' } });
  fireEvent.click(screen.getByRole('button', { name: /准备发布内容/ }));

  await waitFor(() =>
    expect(request.post).toHaveBeenCalledWith('/ps/auto-task/ai/exams/exam-1/prepare', {
      version: 3,
      validated_test_id: undefined,
      problem_set: expect.objectContaining({
        name: '期末实验考试',
        type: 1,
        groupId: 88,
        groupInfo: [{ gid: 9, name: '程序设计', score: 100 }],
        tm_start: 1_788_570_000_000,
        tm_end: 1_788_577_200_000,
      }),
    }),
  );
});

test('requires explicit formal acknowledgement after teacher review', async () => {
  current = plannedExam({
    state: 'review',
    data: {
      title: '正式考试',
      mode: 'FORMAL',
      publication_plan: { name: '正式考试', content_hash: 'frozen-hash' },
      candidate: { rooms: [], unassigned: [] },
    },
  });
  (request.post as jest.Mock).mockImplementation(async (url: string) => {
    if (url.endsWith('/review')) current = { ...current, state: 'approved', version: 4 };
    if (url.endsWith('/publish'))
      current = {
        ...current,
        version: 5,
        state: 'published',
        data: { ...current.data, native_psid: 501 },
      };
    return {};
  });
  render(<ExaminationWorkbench />);
  await selectExam('正式考试 · review');
  fireEvent.change(screen.getByLabelText('操作依据'), {
    target: { value: '题单内容和座位已复核' },
  });
  fireEvent.click(screen.getByRole('button', { name: /批准当前版本/ }));
  await waitFor(() =>
    expect(request.post).toHaveBeenCalledWith('/ps/auto-task/ai/resources/exam-1/review', {
      version: 3,
      reason: '题单内容和座位已复核',
    }),
  );
  const publish = await screen.findByRole('button', { name: /发布到 OJ/ }, { timeout: 10000 });
  expect(publish).toBeDisabled();
  fireEvent.click(screen.getByText('确认发布正式考试'));
  await waitFor(() => expect(publish).toBeEnabled(), { timeout: 10000 });
  fireEvent.click(publish);
  await waitFor(() =>
    expect(request.post).toHaveBeenCalledWith('/ps/auto-task/ai/exams/exam-1/publish', {
      version: 4,
      problem_set: { name: '正式考试', content_hash: 'frozen-hash' },
      dry_run: false,
      formal_ack: true,
    }),
  );
}, 15000);

test('monitors submissions and resets replace-seat confirmation between exams', async () => {
  const first = plannedExam({
    id: 'exam-1',
    state: 'published',
    version: 5,
    data: {
      title: '已发布考试',
      mode: 'TEST',
      native_psid: 501,
      course_binding: { course_id: 7 },
    },
  });
  const second = plannedExam({
    id: 'exam-2',
    state: 'published',
    version: 2,
    course_id: undefined,
    data: { title: '已发布考试二', mode: 'TEST', native_psid: 502 },
  });
  current = first;
  (aiPlatform.list as jest.Mock).mockResolvedValue({ rows: [first, second], totalNum: 2 });
  (aiPlatform.get as jest.Mock).mockImplementation(async (id: string) =>
    id === 'exam-1' ? first : second,
  );
  (request.get as jest.Mock).mockResolvedValue({
    rows: [
      { username: 'alice', name: 'Alice', room: 'A', seat: 12, submission: 'SUBMITTED' },
      { username: 'bob', name: 'Bob', room: 'A', seat: 13, submission: 'WORKING' },
    ],
  });
  render(<ExaminationWorkbench />);
  await selectExam('已发布考试 · published');
  expect(await screen.findByText('已交卷 1')).toBeInTheDocument();
  expect(screen.getByText('进行中 1')).toBeInTheDocument();
  fireEvent.click(screen.getByText('替换现有考试座位'));
  expect(screen.getByLabelText('替换现有考试座位')).toBeChecked();

  fireEvent.click(screen.getAllByRole('button', { name: '查看' })[1]);
  await screen.findByRole('heading', { name: '已发布考试二' });
  expect(screen.getByLabelText('替换现有考试座位')).not.toBeChecked();
  expect(screen.getByRole('button', { name: /绑定原生座位/ })).toBeDisabled();
});
