import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadTestCaseInner } from './DownloadTestCase';
import mApi from 'Utils/API/m-api';

jest.mock('Utils/API/m-api', () => ({
  __esModule: true,
  default: {
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
});

it('opens a checkpoint data picker dialog from the download button', async () => {
  const user = userEvent.setup();
  render(
    <DownloadTestCaseInner
      t={t}
      TestCaseStateList={privateCases as any}
      PublicTestCaseStateList={[]}
    />,
  );

  await user.click(screen.getByRole('button', { name: /downloadData|下载数据/ }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('cp-1')).toBeInTheDocument();
  expect(screen.getByText('cp-2')).toBeInTheDocument();
});

it('downloads the first failing checkpoint through the data picker', async () => {
  const user = userEvent.setup();
  (mApi.getCheckpointPreview as jest.Mock).mockResolvedValue({
    inputFileId: 'in-1',
    outputFileId: 'out-1',
    inputFilename: '1.in',
    outputFilename: '1.out',
  });
  render(<DownloadTestCaseInner t={t} TestCaseStateList={privateCases as any} />);

  await user.click(screen.getByRole('button', { name: /downloadData|下载数据/ }));
  await user.click(await screen.findByRole('button', { name: /DownloadFirstRejectCase/ }));
  await waitFor(() => expect(mApi.getCheckpointPreview).toHaveBeenCalledWith('cp-1'));
  await waitFor(() =>
    expect(mApi.zipDownload).toHaveBeenCalledWith([
      { id: 'in-1', downloadFilename: '1.in' },
      { id: 'out-1', downloadFilename: '1.out' },
    ]),
  );
});
