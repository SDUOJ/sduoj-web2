import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  buildCaseFileNames,
  buildCheckpointRows,
  buildZipFileRequests,
  DownloadTestCaseInner,
} from './DownloadTestCase';
import mApi from 'Utils/API/m-api';
import cApi from 'Utils/API/c-api';
import i18n from '../../../Config/i18n';

jest.mock('Utils/API/m-api', () => ({
  __esModule: true,
  default: { getCheckpointList: jest.fn(), zipDownload: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('Utils/API/c-api', () => ({
  __esModule: true,
  default: { getPublicCheckpoints: jest.fn() },
}));

const formal = [
  { checkpointId: 'cp-1', inputFileId: 'in-1', outputFileId: 'out-1' },
  { checkpointId: 'cp-2', inputFileId: 'in-2', outputFileId: 'out-2' },
];
const publicCases = [
  {
    checkpointId: 'pub-1',
    status: 1,
    checkpoint: {
      checkpointId: 'pub-1',
      inputFileId: 'public-in',
      outputFileId: 'public-out',
    },
  },
];
const t = (key: string) => i18n.t(key);
const props = { t, problemCode: 'SDUOJ-1', problemId: 1 };

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('zh');
  jest.mocked(mApi.getCheckpointList).mockResolvedValue(formal);
  jest.mocked(cApi.getPublicCheckpoints).mockResolvedValue(publicCases);
});

async function openPicker() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: '下载数据' }));
  return { user, dialog: await screen.findByRole('dialog', { name: '下载数据' }) };
}

it('keeps numbered filenames and disambiguates formal/public collisions', () => {
  expect(buildCaseFileNames([{ scope: 'private', caseIndex: 2 }])).toEqual(['2']);
  expect(
    buildCaseFileNames([
      { scope: 'private', caseIndex: 1 },
      { scope: 'public', caseIndex: 1 },
    ]),
  ).toEqual(['private-1', 'public-1']);
  const rows = buildCheckpointRows(formal, publicCases);
  expect(buildZipFileRequests(rows.slice(2))).toEqual([
    { id: 'public-in', downloadFilename: '1.in' },
    { id: 'public-out', downloadFilename: '1.out' },
  ]);
});

it('lists dataset numbers without judge results, metrics, or internal checkpoint IDs', async () => {
  render(<DownloadTestCaseInner {...props} />);
  const { dialog } = await openPicker();
  expect(within(dialog).getAllByRole('row')).toHaveLength(4);
  await waitFor(() =>
    expect(within(dialog).getByRole('columnheader', { name: '数据范围' })).toBeVisible(),
  );
  expect(within(dialog).getByText('公共数据')).toBeVisible();
  expect(dialog).not.toHaveTextContent(/cp-1|pub-1|Pending|Scope|评测结果|分数|内存/);
  expect(within(dialog).queryByRole('button', { name: /第一个错误/ })).not.toBeInTheDocument();
});

it('uses identical ZIP requests for a row download and selecting that single row', async () => {
  render(<DownloadTestCaseInner {...props} />);
  const { user, dialog } = await openPicker();
  await user.click(within(dialog).getByRole('button', { name: '下载 正式数据 2' }));
  await waitFor(() => expect(mApi.zipDownload).toHaveBeenCalledTimes(1));
  const single = jest.mocked(mApi.zipDownload).mock.calls[0];
  expect(single).toEqual([
    [
      { id: 'in-2', downloadFilename: '2.in' },
      { id: 'out-2', downloadFilename: '2.out' },
    ],
    'SDUOJ-1-testcases.zip',
  ]);
  const secondRow = within(dialog).getByRole('button', { name: '下载 正式数据 2' }).closest('tr')!;
  await user.click(within(secondRow).getByRole('checkbox'));
  await user.click(within(dialog).getByRole('button', { name: '打包下载' }));
  await waitFor(() => expect(mApi.zipDownload).toHaveBeenCalledTimes(2));
  expect(jest.mocked(mApi.zipDownload).mock.calls[1]).toEqual(single);
});

it('downloads public files by their own IDs rather than the same-numbered formal files', async () => {
  render(<DownloadTestCaseInner {...props} />);
  const { user, dialog } = await openPicker();
  await user.click(within(dialog).getByRole('button', { name: '下载 公共数据 1' }));
  await waitFor(() =>
    expect(mApi.zipDownload).toHaveBeenCalledWith(
      [
        { id: 'public-in', downloadFilename: '1.in' },
        { id: 'public-out', downloadFilename: '1.out' },
      ],
      'SDUOJ-1-testcases.zip',
    ),
  );
});

it.each(['missing', 'denied', 'empty'])('hides unavailable data (%s)', async (mode) => {
  if (mode === 'denied') jest.mocked(mApi.getCheckpointList).mockRejectedValue(new Error('403'));
  if (mode === 'empty') {
    jest.mocked(mApi.getCheckpointList).mockResolvedValue([]);
    jest.mocked(cApi.getPublicCheckpoints).mockResolvedValue([]);
  }
  render(
    <DownloadTestCaseInner
      {...props}
      problemCode={mode === 'missing' ? undefined : props.problemCode}
    />,
  );
  if (mode !== 'missing') await waitFor(() => expect(mApi.getCheckpointList).toHaveBeenCalled());
  expect(screen.queryByRole('button', { name: '下载数据' })).not.toBeInTheDocument();
  if (mode === 'denied') expect(cApi.getPublicCheckpoints).not.toHaveBeenCalled();
});

it('does not include pending or rejected public data in the downloadable judge dataset', () => {
  const rows = buildCheckpointRows(formal, [
    ...publicCases,
    { ...publicCases[0], status: 0 },
    { ...publicCases[0], status: 2 },
  ]);
  expect(rows).toHaveLength(3);
});

it('translates the dataset scope in English', async () => {
  await i18n.changeLanguage('en');
  render(<DownloadTestCaseInner {...props} />);
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: /Download Data/i }));
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(within(dialog).getByText('Public data')).toBeVisible());
  expect(dialog.textContent).not.toMatch(/[\u3400-\u9fff]/);
});
