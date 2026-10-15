import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MetaTaskProgress from './MetaTaskProgress';
import mApi from '../../../../Utils/API/m-api';
import i18n from '../../../../Config/i18n';

jest.mock('../../../../Utils/API/m-api', () => ({
  __esModule: true,
  default: {
    publicAutoTasks: jest.fn(),
    retryPublicAutoTask: jest.fn(),
    cancelPublicAutoTask: jest.fn(),
  },
}));
jest.mock('../../../answerIde/RunResults', () => ({ detail }: any) => (
  <div data-testid="task-result">{detail?.submissionId}</div>
));
jest.mock('../../../submission/SyncJudging', () => ({
  SyncJudging: ({ queryList, dataHandle }: any) => (
    <button data-testid="stream" onClick={() => dataHandle(['1', 1, 4])}>
      {queryList.length}
    </button>
  ),
}));
beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('zh');
});
const detail = (submissionId: string, judgeResult = 1) => ({
  submissionId,
  taskType: 101,
  judgeResult,
  run: { mode: 'management', cases: [] },
});
it('queries full formal batches in bounded requests and keeps streams within the 100-id limit', async () => {
  jest.mocked(mApi.publicAutoTasks).mockImplementation(async (ids) => ids.map((id) => detail(id)));
  const changed = jest.fn();
  render(
    <MetaTaskProgress
      ids={Array.from({ length: 205 }, (_, i) => i.toString(16))}
      onChange={changed}
    />,
  );
  await waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
  expect(jest.mocked(mApi.publicAutoTasks).mock.calls.map(([ids]) => ids.length)).toEqual([
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 5,
  ]);
  expect(screen.getAllByTestId('stream').map((node) => node.textContent)).toEqual([
    '100',
    '100',
    '5',
  ]);
});
it('follows the returned retry id even when its parent batch does not change props', async () => {
  jest.mocked(mApi.publicAutoTasks).mockImplementation(async (ids) => ids.map((id) => detail(id)));
  jest.mocked(mApi.retryPublicAutoTask).mockResolvedValue('b');
  render(<MetaTaskProgress ids={['a']} onChange={jest.fn()} />);
  await waitFor(() => expect(screen.getByText('a · 通过')).toBeInTheDocument());
  fireEvent.click(screen.getByText('a · 通过'));
  fireEvent.click(await screen.findByRole('button', { name: '重试（创建新任务）' }));
  await waitFor(() => expect(mApi.publicAutoTasks).toHaveBeenCalledWith(['b']));
  expect(await screen.findByText('b · 通过')).toBeInTheDocument();
});
it('does not overlap a pending REST query when a type=4 hint arrives', async () => {
  let finish!: (value: any) => void;
  jest.mocked(mApi.publicAutoTasks).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const changed = jest.fn();
  render(<MetaTaskProgress ids={['a']} onChange={changed} />);
  fireEvent.click(screen.getByTestId('stream'));
  fireEvent.click(screen.getByTestId('stream'));
  expect(mApi.publicAutoTasks).toHaveBeenCalledTimes(1);
  finish([detail('a')]);
  await waitFor(() => expect(changed).toHaveBeenCalledTimes(1));
});
