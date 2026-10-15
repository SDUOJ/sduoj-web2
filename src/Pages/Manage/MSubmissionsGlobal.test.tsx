import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MSubmissionsGlobal from './MSubmissionsGlobal';
import mApi from '../../Utils/API/m-api';
import i18n from '../../Config/i18n';
import type { GlobalSubmissionRow } from '../../Type/globalSubmissions';
jest.mock('../../Utils/API/m-api', () => ({
  __esModule: true,
  default: {
    globalSubmissionPage: jest.fn(),
    globalSubmissionDetail: jest.fn(),
    globalRejudge: jest.fn(),
    globalExport: jest.fn(),
    opsMetrics: jest.fn().mockResolvedValue({
      timestamp: Date.now(),
      metricsAvailable: false,
      series: [],
      waitSampleCount: 0,
    }),
  },
}));
const rows: GlobalSubmissionRow[] = [
  {
    submissionId: 'formal1',
    bizType: 0,
    bizId: '0',
    gmtCreate: '2026-10-14T00:00:00Z',
    username: 'alice',
    userId: '1',
    problemId: '9',
    problemCode: 'P',
    judgeResult: 1,
  },
  {
    submissionId: 'task1',
    bizType: 103,
    bizId: '0',
    gmtCreate: '2026-10-14T00:00:00Z',
    username: 'alice',
    userId: '1',
    problemId: '9',
    problemCode: 'P',
    judgeResult: 1,
  },
];
const page = { rows, totalNum: '2', totalPage: '1', pageIndex: '1', pageSize: '50' };
beforeEach(async () => {
  await i18n.changeLanguage('en');
  jest.mocked(mApi.globalSubmissionPage).mockResolvedValue(page);
  jest.mocked(mApi.globalRejudge).mockResolvedValue(null);
  jest.mocked(mApi.globalExport).mockResolvedValue(undefined);
});
afterEach(() => {
  jest.useRealTimers();
});
it('uses the seven-day bounded query, excludes tasks from rejudge and exports formal by default', async () => {
  render(<MSubmissionsGlobal />);
  await screen.findByText('formal1');
  const query = jest.mocked(mApi.globalSubmissionPage).mock.calls[0][0];
  expect(query.pageSize).toBe(50);
  expect(query.toTs! - query.fromTs!).toBeGreaterThanOrEqual(7 * 86400000);
  const formal = screen.getByText('formal1').closest('tr')!;
  const task = screen.getByText('task1').closest('tr')!;
  expect(within(task).getByRole('checkbox')).toBeDisabled();
  fireEvent.click(within(formal).getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Rejudge selected formal submissions' }));
  await waitFor(() => expect(mApi.globalRejudge).toHaveBeenCalledWith(['formal1']));
  await waitFor(() => expect(screen.getByRole('button', { name: /Export CSV/ })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }));
  await waitFor(() =>
    expect(mApi.globalExport).toHaveBeenCalledWith(
      expect.objectContaining({ includeTasks: false }),
    ),
  );
  fireEvent.click(screen.getByRole('checkbox', { name: 'Include tasks in export' }));
  await waitFor(() => expect(screen.getByRole('button', { name: /Export CSV/ })).toBeEnabled());
  await waitFor(() => expect(screen.getByRole('button', { name: /Export CSV/ })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }));
  await waitFor(() =>
    expect(mApi.globalExport).toHaveBeenCalledWith(expect.objectContaining({ includeTasks: true })),
  );
});
it('applies user and problem filters only when requested and renders formal results as columns', async () => {
  jest.mocked(mApi.globalSubmissionDetail).mockResolvedValue({
    submissionId: 'formal1',
    judgeResult: 1,
    code: 'source text',
    checkpointResults: [['123', 1, 100, 2, 1024]],
  });
  render(<MSubmissionsGlobal />);
  await screen.findByText('formal1');
  fireEvent.change(screen.getByRole('textbox', { name: 'Username' }), {
    target: { value: 'alice' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: 'Problem code' }), {
    target: { value: 'P' },
  });
  expect(mApi.globalSubmissionPage).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
  await waitFor(() =>
    expect(mApi.globalSubmissionPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ username: 'alice', problemCode: 'P', pageNow: 1 }),
      expect.any(AbortSignal),
    ),
  );
  fireEvent.click(
    within(screen.getByText('formal1').closest('tr')!).getByRole('button', { name: 'Details' }),
  );
  await screen.findByText('Source code');
  fireEvent.click(screen.getByText('Source code'));
  expect(screen.getByText('source text')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Formal checkpoint results'));
  await screen.findByText('123');
  expect(screen.getAllByText('Time (ms)')[0]).toBeInTheDocument();
});
it('keeps polling serialized and backs off after a failure', async () => {
  jest.useFakeTimers();
  let resolve!: (value: typeof page) => void;
  jest.mocked(mApi.globalSubmissionPage).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const view = render(<MSubmissionsGlobal />);
  await act(async () => {
    jest.advanceTimersByTime(30000);
  });
  expect(mApi.globalSubmissionPage).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolve(page);
  });
  jest.mocked(mApi.globalSubmissionPage).mockRejectedValueOnce(new Error('offline'));
  await act(async () => {
    jest.advanceTimersByTime(10000);
  });
  expect(mApi.globalSubmissionPage).toHaveBeenCalledTimes(2);
  expect(screen.getByText('formal1')).toBeInTheDocument();
  expect(screen.getByText(/Could not refresh/)).toBeInTheDocument();
  await act(async () => {
    jest.advanceTimersByTime(19999);
  });
  expect(mApi.globalSubmissionPage).toHaveBeenCalledTimes(2);
  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(mApi.globalSubmissionPage).toHaveBeenCalledTimes(3);
  view.unmount();
  await act(async () => {
    jest.advanceTimersByTime(60000);
  });
  expect(mApi.globalSubmissionPage).toHaveBeenCalledTimes(3);
});
