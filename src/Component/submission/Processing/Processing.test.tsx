import { act, render, screen } from '@testing-library/react';
import { applyCheckpointUpdate, Processing } from './Processing';

let handleJudgeMessage: ((message: any[]) => void) | undefined;

jest.mock('antd', () => ({
  Skeleton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Steps: Object.assign(
    ({
      children,
      current,
      onChange,
    }: {
      children: React.ReactNode;
      current: number;
      onChange: (index: number) => void;
    }) => (
      <div data-testid="steps" data-current={current}>
        <button type="button" onClick={() => onChange(2)}>
          go-summary
        </button>
        {children}
      </div>
    ),
    {
      Step: ({ title, disabled, status }: any) => (
        <div
          data-testid={`step-${title}`}
          data-disabled={disabled ? '1' : '0'}
          data-status={status}
        >
          {title}
        </div>
      ),
    },
  ),
}));
jest.mock('@ant-design/icons', () => ({ LoadingOutlined: () => null }));
jest.mock('../../common/CodeHighlight', () => () => null);
jest.mock('../SyncJudging', () => ({
  SyncJudging: ({ dataHandle }: { dataHandle: (message: any[]) => void }) => {
    handleJudgeMessage = dataHandle;
    return null;
  },
}));
jest.mock(
  './Running',
  () =>
    ({ TestCaseStateList, PublicTestCaseStateList, submissionInfo }: any) => (
      <div>
        <span>{submissionInfo?.problemTitle}</span>
        <output aria-label="private-cases">
          {TestCaseStateList.map((item: any) => item.caseScore ?? '-').join(',')}
        </output>
        <output aria-label="public-cases">
          {PublicTestCaseStateList.map((item: any) => item.caseScore ?? '-').join(',')}
        </output>
      </div>
    ),
);
jest.mock(
  './Summary',
  () =>
    ({ submissionInfo, TestCaseStateList, PublicTestCaseStateList }: any) => (
      <div data-testid="summary-panel">
        {submissionInfo?.problemTitle}
        <span data-testid="summary-log">{submissionInfo?.judgeLog ?? ''}</span>
        <output aria-label="summary-case-count">
          {TestCaseStateList.length + PublicTestCaseStateList.length}
        </output>
      </div>
    ),
);

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
};

const response = (submissionId: string, problemTitle: string) =>
  Object.freeze({
    submissionId,
    problemTitle,
    judgeResult: 1,
    judgeLog: '',
    checkpointNum: 1,
    publicCheckpointNum: 0,
    checkpointResults: Object.freeze([Object.freeze([1, 1, 100, 5, 256])]),
    publicCheckpointResults: null,
  });

it('ignores stale detail results and does not mutate cached response objects', async () => {
  const first = deferred<ReturnType<typeof response>>();
  const second = deferred<ReturnType<typeof response>>();
  const query = jest.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const props = {
    TimeLimit: 1000,
    MemoryLimit: 256,
    submissionId: 'a',
    QuerySubmissionAPI: query,
    t: (key: string) => key,
  };
  const view = render(<Processing {...props} />);
  view.rerender(<Processing {...props} submissionId="b" />);

  await act(async () => second.resolve(response('b', 'New submission')));
  expect(screen.getByText('New submission')).toBeInTheDocument();

  await act(async () => first.resolve(response('a', 'Stale submission')));
  expect(screen.getByText('New submission')).toBeInTheDocument();
  expect(screen.queryByText('Stale submission')).not.toBeInTheDocument();
});

it('updates frozen checkpoint snapshots without mutation', () => {
  const current = Object.freeze([Object.freeze({ caseIndex: 1, caseType: 0 })]) as unknown as any[];
  const next = applyCheckpointUpdate(current, 0, 1, 25, 10, 256);

  expect(next).not.toBe(current);
  expect(next[0]).toMatchObject({ caseIndex: 1, caseScore: 25, caseTime: 10, caseMemory: 256 });
  expect(current[0]).toEqual({ caseIndex: 1, caseType: 0 });
});

it('preserves synchronous private and public checkpoint frames', async () => {
  const query = jest.fn().mockResolvedValue({
    submissionId: 'live',
    problemTitle: 'Live submission',
    judgeResult: -2,
    checkpointNum: 2,
    publicCheckpointNum: 1,
    checkpointResults: [],
    publicCheckpointResults: [],
  });
  render(
    <Processing
      TimeLimit={1000}
      MemoryLimit={256}
      submissionId="live"
      QuerySubmissionAPI={query}
      t={(key: string) => key}
    />,
  );
  expect(await screen.findByText('Live submission')).toBeInTheDocument();

  act(() => {
    handleJudgeMessage?.(['live', 1, 0, 0, 10, 1, 10, 1, 128]);
    handleJudgeMessage?.(['live', 1, 0, 1, 11, 1, 20, 2, 256]);
    handleJudgeMessage?.(['live', 1, 1, 0, 12, 1, 30, 3, 512]);
  });

  expect(screen.getByLabelText('private-cases')).toHaveTextContent('10,20');
  expect(screen.getByLabelText('public-cases')).toHaveTextContent('30');
});

it.each([
  [8, 'CE'],
  [5, 'System Error'],
])('allows the summary step for finished judge result %s (%s)', async (judgeResult) => {
  const query = jest.fn().mockResolvedValue({
    submissionId: 'ce',
    problemTitle: 'CE submission',
    judgeResult,
    judgeLog: 'compile failed: unexpected token',
    checkpointNum: 0,
    publicCheckpointNum: 0,
    checkpointResults: [],
    publicCheckpointResults: [],
  });
  render(
    <Processing
      TimeLimit={1000}
      MemoryLimit={256}
      submissionId="ce"
      QuerySubmissionAPI={query}
      t={(key: string) => key}
    />,
  );

  await screen.findByTestId('summary-panel');
  const summaryStep = screen.getByTestId('step-Summary');
  expect(summaryStep).toHaveAttribute('data-disabled', '0');
  expect(summaryStep).toHaveAttribute('data-status', 'process');
  // running 仍标记为错误步骤
  expect(screen.getByTestId('step-run')).toHaveAttribute('data-status', 'error');
  expect(screen.getByTestId('summary-log')).toHaveTextContent('compile failed');
});

it('keeps summary disabled while a submission is still running', async () => {
  const query = jest.fn().mockResolvedValue({
    submissionId: 'running',
    problemTitle: 'Running submission',
    judgeResult: -1,
    checkpointNum: 1,
    publicCheckpointNum: 0,
    checkpointResults: [],
    publicCheckpointResults: [],
  });
  render(
    <Processing
      TimeLimit={1000}
      MemoryLimit={256}
      submissionId="running"
      QuerySubmissionAPI={query}
      t={(key: string) => key}
    />,
  );
  await screen.findByText('Running submission');
  expect(screen.getByTestId('step-Summary')).toHaveAttribute('data-disabled', '1');
});

it('clears pending cases when a live submission ends with a compilation error', async () => {
  const query = jest
    .fn()
    .mockResolvedValueOnce({
      submissionId: 'live-ce',
      problemTitle: 'Live compile',
      judgeResult: 0,
      checkpointNum: 10,
      publicCheckpointNum: 2,
      checkpointResults: [],
      publicCheckpointResults: [],
    })
    .mockResolvedValueOnce({
      submissionId: 'live-ce',
      problemTitle: 'Live compile',
      judgeResult: 8,
      judgeLog: 'compile failed',
      checkpointNum: 10,
      publicCheckpointNum: 2,
      checkpointResults: [],
      publicCheckpointResults: [],
    });
  render(
    <Processing
      TimeLimit={1000}
      MemoryLimit={256}
      submissionId="live-ce"
      QuerySubmissionAPI={query}
      t={(key: string) => key}
    />,
  );
  await screen.findByText('Live compile');
  act(() => {
    handleJudgeMessage?.(['live-ce', 1, 0, -1]);
  });
  await screen.findByTestId('summary-panel');
  expect(screen.getByLabelText('summary-case-count')).toHaveTextContent('0');
  expect(screen.getByTestId('summary-log')).toHaveTextContent('compile failed');
});
