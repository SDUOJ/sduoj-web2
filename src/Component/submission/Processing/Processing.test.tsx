import { act, render, screen } from '@testing-library/react';
import { Processing } from './Processing';

jest.mock('antd', () => ({
  Skeleton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Steps: Object.assign(({ children }: { children: React.ReactNode }) => <>{children}</>, {
    Step: () => null,
  }),
}));
jest.mock('@ant-design/icons', () => ({ LoadingOutlined: () => null }));
jest.mock('../../common/CodeHighlight', () => () => null);
jest.mock('../SyncJudging', () => ({ SyncJudging: () => null }));
jest.mock('./Running', () => () => null);
jest.mock('./Summary', () => ({ submissionInfo }: any) => (
  <div>{submissionInfo?.problemTitle}</div>
));

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
