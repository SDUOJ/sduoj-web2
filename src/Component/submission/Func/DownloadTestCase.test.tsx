import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  buildCaseFileNames,
  buildZipFileRequests,
  DownloadTestCaseInner,
  resolveManagedTargets,
} from './DownloadTestCase';
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
      inputFilename: 'a.in',
      outputFilename: 'a.out',
      caseIndex: null,
    },
    {
      checkpointId: 'cp-2',
      inputFileId: 'in-2',
      outputFileId: 'out-2',
      inputFilename: 'b.in',
      outputFilename: 'b.out',
      caseIndex: null,
    },
  ]);
});

it('names zip entries by test case number', () => {
  expect(
    buildCaseFileNames([
      { scope: 'private', caseIndex: 1, caseID: 'cp-1' },
      { scope: 'private', caseIndex: 2, caseID: 'cp-2' },
    ]),
  ).toEqual(['1', '2']);
});

it('disambiguates colliding private/public case numbers', () => {
  expect(
    buildCaseFileNames([
      { scope: 'private', caseIndex: 1 },
      { scope: 'public', caseIndex: 1 },
    ]),
  ).toEqual(['private-1', 'public-1']);
});

it('resolves managed file ids without per-case preview calls', () => {
  const resolved = resolveManagedTargets(
    [
      {
        key: 'private-cp-1',
        scope: 'private',
        caseIndex: 1,
        caseID: 'cp-1',
        result: 'WrongAnswer',
      },
    ],
    [
      {
        checkpointId: 'cp-1',
        inputFileId: 'in-1',
        outputFileId: 'out-1',
        caseIndex: null,
      },
    ],
  );
  expect(resolved).toHaveLength(1);
  expect(buildZipFileRequests(resolved)).toEqual([
    { id: 'in-1', downloadFilename: '1.in' },
    { id: 'out-1', downloadFilename: '1.out' },
  ]);
});

it('falls back to caseIndex for public samples when checkpointId mismatches', () => {
  const resolved = resolveManagedTargets(
    [
      {
        key: 'public-x',
        scope: 'public',
        caseIndex: 1,
        caseID: 'missing',
        result: 'Accepted',
      },
    ],
    [
      {
        checkpointId: 'sample-1',
        inputFileId: 's-in',
        outputFileId: 's-out',
        caseIndex: 0,
      },
    ],
  );
  expect(resolved).toHaveLength(1);
  expect(resolved[0].inputFileId).toBe('s-in');
});

it('hides the download button without a problem code', async () => {
  render(<DownloadTestCaseInner t={t} TestCaseStateList={privateCases as any} />);
  expect(screen.queryByRole('button', { name: /downloadData|下载数据/ })).toBeNull();
});

it('hides the download button when manage checkpoint list is denied', async () => {
  (mApi.getCheckpointList as jest.Mock).mockRejectedValue(new Error('403'));
  render(
    <DownloadTestCaseInner t={t} problemCode="SDUOJ-1" TestCaseStateList={privateCases as any} />,
  );
  await waitFor(() => expect(mApi.getCheckpointList).toHaveBeenCalledWith('SDUOJ-1'));
  expect(screen.queryByRole('button', { name: /downloadData|下载数据/ })).toBeNull();
});

it('hides the download button when the problem has no downloadable checkpoints', async () => {
  (mApi.getCheckpointList as jest.Mock).mockResolvedValue([]);
  render(
    <DownloadTestCaseInner t={t} problemCode="SDUOJ-1" TestCaseStateList={privateCases as any} />,
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

it('downloads the first failing checkpoint as a numbered zip without preview', async () => {
  const user = userEvent.setup();
  render(
    <DownloadTestCaseInner t={t} problemCode="SDUOJ-1" TestCaseStateList={privateCases as any} />,
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /downloadData|下载数据/ })).toBeVisible(),
  );

  await user.click(screen.getByRole('button', { name: /downloadData|下载数据/ }));
  await user.click(await screen.findByRole('button', { name: /DownloadFirstRejectCase/ }));
  await waitFor(() =>
    expect(mApi.zipDownload).toHaveBeenCalledWith(
      [
        { id: 'in-1', downloadFilename: '1.in' },
        { id: 'out-1', downloadFilename: '1.out' },
      ],
      'SDUOJ-1-testcases.zip',
    ),
  );
  expect(mApi.getCheckpointPreview).not.toHaveBeenCalled();
});

it('allows single-case download of a private checkpoint via the row button', async () => {
  const user = userEvent.setup();
  render(
    <DownloadTestCaseInner t={t} problemCode="SDUOJ-1" TestCaseStateList={privateCases as any} />,
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /downloadData|下载数据/ })).toBeVisible(),
  );
  await user.click(screen.getByRole('button', { name: /downloadData|下载数据/ }));
  const dialog = await screen.findByRole('dialog');
  const rowButtons = dialog.querySelectorAll('button.ant-btn-link');
  expect(rowButtons.length).toBeGreaterThanOrEqual(2);
  await user.click(rowButtons[1] as HTMLElement);
  await waitFor(() =>
    expect(mApi.zipDownload).toHaveBeenCalledWith(
      [
        { id: 'in-2', downloadFilename: '2.in' },
        { id: 'out-2', downloadFilename: '2.out' },
      ],
      'SDUOJ-1-testcases.zip',
    ),
  );
});

it('batch-downloads selected rows through a single zip call', async () => {
  const user = userEvent.setup();
  render(
    <DownloadTestCaseInner t={t} problemCode="SDUOJ-1" TestCaseStateList={privateCases as any} />,
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /downloadData|下载数据/ })).toBeVisible(),
  );
  await user.click(screen.getByRole('button', { name: /downloadData|下载数据/ }));
  const dialog = await screen.findByRole('dialog');
  const checkboxes = dialog.querySelectorAll('input[type="checkbox"]');
  await user.click(checkboxes[1] as HTMLElement);
  await user.click(checkboxes[2] as HTMLElement);
  await user.click(screen.getByRole('button', { name: /BatchDownload/ }));
  await waitFor(() =>
    expect(mApi.zipDownload).toHaveBeenCalledWith(
      [
        { id: 'in-1', downloadFilename: '1.in' },
        { id: 'out-1', downloadFilename: '1.out' },
        { id: 'in-2', downloadFilename: '2.in' },
        { id: 'out-2', downloadFilename: '2.out' },
      ],
      'SDUOJ-1-testcases.zip',
    ),
  );
  expect(mApi.zipDownload).toHaveBeenCalledTimes(1);
  expect(mApi.getCheckpointPreview).not.toHaveBeenCalled();
});
