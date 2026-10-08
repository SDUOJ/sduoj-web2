import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadTestCaseInner } from './DownloadTestCase';
import mApi from 'Utils/API/m-api';

jest.mock('Utils/API/m-api', () => ({
  __esModule: true,
  default: {
    getCheckpointList: jest.fn(),
    getCheckpointPreview: jest.fn(),
    zipDownload: jest.fn().mockResolvedValue(undefined),
  },
}));

const privateCases = [
  {
    caseIndex: 1,
    caseType: 0,
    caseScore: 0,
    caseTime: 12,
    caseMemory: 256,
    caseID: 'cp-1',
  },
  {
    caseIndex: 2,
    caseType: 1,
    caseScore: 100,
    caseTime: 8,
    caseMemory: 128,
    caseID: 'cp-2',
  },
];

const t = (key: string) => key;

beforeEach(() => {
  jest.clearAllMocks();
  (mApi.getCheckpointList as jest.Mock).mockResolvedValue([
    {
      checkpointId: 'cp-1',
      inputFileId: 'in-1',
      outputFileId: 'out-1',
      inputFilename: '1.in',
      outputFilename: '1.out',
    },
    {
      checkpointId: 'cp-2',
      inputFileId: 'in-2',
      outputFileId: 'out-2',
      inputFilename: '2.in',
      outputFilename: '2.out',
    },
  ]);
});

it('hides the download button without a problem code', async () => {
  render(<DownloadTestCaseInner t={t} TestCaseStateList={privateCases as any} />);
  expect(screen.queryByRole('button', { name: /downloadData|下载数据/ })).toBeNull();
});

it('hides the download button when manage checkpoint list is denied', async () => {
  (mApi.getCheckpointList as jest.Mock).mockRejectedValue(new Error('403'));
  render(
    <DownloadTestCaseInner
      t={t}
      problemCode="SDUOJ-1"
      TestCaseStateList={privateCases as any}
    />,
  );
  await waitFor(() =>
    expect(mApi.getCheckpointList).toHaveBeenCalledWith('SDUOJ-1'),
  );
  expect(screen.queryByRole('button', { name: /downloadData|下载数据/ })).toBeNull();
});

it('hides the download button when the problem has no downloadable checkpoints', async () => {
  (mApi.getCheckpointList as jest.Mock).mockResolvedValue([]);
  render(
    <DownloadTestCaseInner
      t={t}
      problemCode="SDUOJ-1"
      TestCaseStateList={privateCases as any}
    />,
  );
  await waitFor(() => expect(mApi.getCheckpointList).toHaveBeenCalled());
  expect(screen.queryByRole('button', { name: /downloadData|下载数据/ })).toBeNull();
});

it('opens a checkpoint data picker dialog from the download button', async () => {
  const user = userEvent.setup();
  render(
    <DownloadTestCaseInner
      t={t}
      problemCode="SDUOJ-1"
      TestCaseStateList={privateCases as any}
      PublicTestCaseStateList={[]}
    />,
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /downloadData|下载数据/ })).toBeVisible(),
  );

  await user.click(screen.getByRole('button', { name: /downloadData|下载数据/ }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('cp-1')).toBeInTheDocument();
  expect(screen.getByText('cp-2')).toBeInTheDocument();
});

it('downloads the first failing checkpoint through manage file ids', async () => {
  const user = userEvent.setup();
  render(
    <DownloadTestCaseInner t={t} problemCode="SDUOJ-1" TestCaseStateList={privateCases as any} />,
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /downloadData|下载数据/ })).toBeVisible(),
  );

  await user.click(screen.getByRole('button', { name: /downloadData|下载数据/ }));
  await user.click(await screen.findByRole('button', { name: /DownloadFirstRejectCase/ }));
  // Managed checkpoints already carry file ids — no per-case preview call needed.
  await waitFor(() =>
    expect(mApi.zipDownload).toHaveBeenCalledWith([
      { id: 'in-1', downloadFilename: '1.in' },
      { id: 'out-1', downloadFilename: '1.out' },
    ]),
  );
  expect(mApi.getCheckpointPreview).not.toHaveBeenCalled();
});
