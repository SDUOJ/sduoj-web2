import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GradingWorkbench from './GradingWorkbench';
import { aiPlatform, PlatformResource } from '../../../Utils/API/ai-platform';
import i18n from '../../../Config/i18n';

jest.mock('../../../Utils/API/ai-platform', () => ({
  aiPlatform: {
    list: jest.fn(),
    get: jest.fn(),
    gradeNative: jest.fn(),
    editGrade: jest.fn(),
    adoptGrade: jest.fn(),
  },
}));

jest.mock('./AIWorkspaceNav', () => () => <nav>AI nav</nav>);
jest.mock('./AITaskMonitor', () => ({ taskId }: { taskId?: string }) => (
  <div data-testid="task-monitor">{taskId || 'no-task'}</div>
));

const candidateResource = (version = 3, state = 'review'): PlatformResource => ({
  id: 'grade-1',
  kind: 'grading',
  version,
  state,
  psid: 11,
  data: {
    candidate_job_id: 'job-grade-1',
    candidate: {
      judgeLog: [
        { name: '正确性', score: 10, jScore: 8 },
        { name: '表达', score: 5, jScore: 4 },
      ],
      judgeComment: '基本正确',
      evaluation: {
        confidence: 0.84,
        criteria: [
          { name: '正确性', evidence: '答案推导完整' },
          { name: '表达', evidence: '结论清楚' },
        ],
      },
      source: { psid: 11, gid: 2, pid: 3, username: 'alice', asd_id: 99 },
    },
  },
});

let current: PlatformResource;

beforeEach(() => {
  void i18n.changeLanguage('zh');
  jest.clearAllMocks();
  current = candidateResource();
  (aiPlatform.list as jest.Mock).mockImplementation(async () => ({ rows: [current], totalNum: 1 }));
  (aiPlatform.get as jest.Mock).mockImplementation(async () => current);
  (aiPlatform.editGrade as jest.Mock).mockImplementation(async (_resource, criteria, comment) => {
    current = {
      ...candidateResource(4),
      data: {
        ...candidateResource(4).data,
        candidate: {
          ...(candidateResource(4).data.candidate as object),
          judgeLog: criteria.map((item: { name: string; score: number }, index: number) => ({
            name: item.name,
            score: index === 0 ? 10 : 5,
            jScore: item.score,
          })),
          judgeComment: comment,
        },
      },
    };
    return current;
  });
  (aiPlatform.adoptGrade as jest.Mock).mockResolvedValue({ adopted: true });
});

async function selectCandidate() {
  fireEvent.click(await screen.findByRole('button', { name: '查看' }));
  await screen.findByText('alice');
}

test('prefills the native answer context supplied by an existing review page', async () => {
  render(
    <GradingWorkbench location={{ search: '?psid=11&gid=2&pid=3&username=alice%2Bassistant' }} />,
  );

  fireEvent.click(screen.getByRole('button', { name: /新\s*建/ }));
  expect(screen.getByLabelText('题单 ID')).toHaveValue('11');
  expect(screen.getByLabelText('主观题组 ID')).toHaveValue('2');
  expect(screen.getByLabelText('题目 ID')).toHaveValue('3');
  expect(screen.getByLabelText('学生 OJ 用户名')).toHaveValue('alice+assistant');
});

test('creates a grading task from a native answer snapshot', async () => {
  (aiPlatform.list as jest.Mock).mockResolvedValue({ rows: [], totalNum: 0 });
  (aiPlatform.gradeNative as jest.Mock).mockResolvedValue({
    taskId: 'job-new',
    resource_id: 'grade-new',
  });
  (aiPlatform.get as jest.Mock).mockResolvedValue({
    id: 'grade-new',
    kind: 'grading',
    version: 1,
    state: 'pending',
    data: {},
  });
  render(<GradingWorkbench />);
  fireEvent.click(screen.getByRole('button', { name: /新\s*建/ }));
  fireEvent.change(screen.getByLabelText('题单 ID'), { target: { value: '11' } });
  fireEvent.change(screen.getByLabelText('主观题组 ID'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('题目 ID'), { target: { value: '3' } });
  fireEvent.change(screen.getByLabelText('学生 OJ 用户名'), { target: { value: 'alice' } });
  fireEvent.click(screen.getByRole('button', { name: /生成候选评分/ }));

  await waitFor(() =>
    expect(aiPlatform.gradeNative).toHaveBeenCalledWith({
      psid: 11,
      gid: 2,
      pid: 3,
      username: 'alice',
      operation_key: expect.any(String),
    }),
  );
  expect(await screen.findByTestId('task-monitor')).toHaveTextContent('job-new');
  expect(aiPlatform.get).toHaveBeenCalledWith('grade-new');
});

test('edits criterion scores before adopting the exact saved version', async () => {
  render(<GradingWorkbench />);
  await selectCandidate();
  fireEvent.change(screen.getByDisplayValue('8'), { target: { value: '9' } });
  fireEvent.change(screen.getByLabelText('评语'), { target: { value: '推导正确，表达清晰' } });
  fireEvent.change(screen.getByLabelText('复核依据'), { target: { value: '逐项核对答卷' } });
  fireEvent.click(screen.getByRole('button', { name: /采用到原生答题卡/ }));

  await waitFor(() =>
    expect(aiPlatform.editGrade).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'grade-1', version: 3 }),
      [
        { name: '正确性', score: 9 },
        { name: '表达', score: 4 },
      ],
      '推导正确，表达清晰',
      '逐项核对答卷',
    ),
  );
  expect(aiPlatform.adoptGrade).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'grade-1', version: 4 }),
    '逐项核对答卷',
    false,
  );
  expect(await screen.findByText('正式成绩已采用')).toBeInTheDocument();
});

test('surfaces a native adoption conflict without claiming success', async () => {
  (aiPlatform.adoptGrade as jest.Mock).mockRejectedValue(
    'Answer/rubric/grade changed; re-evaluate before adoption',
  );
  render(<GradingWorkbench />);
  await selectCandidate();
  fireEvent.change(screen.getByLabelText('复核依据'), { target: { value: '复核完成' } });
  fireEvent.click(screen.getByRole('button', { name: /采用到原生答题卡/ }));

  expect(await screen.findByText('候选、原答案或人工成绩已发生变化')).toBeInTheDocument();
  expect(screen.getByText(/Answer\/rubric\/grade changed/)).toBeInTheDocument();
  expect(screen.queryByText('正式成绩已采用')).not.toBeInTheDocument();
});

test('renders the grading shell in English without Chinese UI labels', async () => {
  await i18n.changeLanguage('en');
  (aiPlatform.list as jest.Mock).mockResolvedValue({ rows: [], totalNum: 0 });
  render(<GradingWorkbench />);

  expect(await screen.findByText('Subjective grading')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /New/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  expect(screen.queryByText(/[一-龥]/)).not.toBeInTheDocument();

  await i18n.changeLanguage('zh');
});
