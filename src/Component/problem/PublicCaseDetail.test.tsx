import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PublicCaseDetail from './PublicCaseDetail';
import cApi from '../../Utils/API/c-api';
import mApi from '../../Utils/API/m-api';
import i18n from '../../Config/i18n';
jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { publicCaseDetail: jest.fn() },
}));
jest.mock('../../Utils/API/m-api', () => ({
  __esModule: true,
  default: { zipDownload: jest.fn() },
}));
const detail = {
  checkpointId: '14',
  inputFileId: '12',
  outputFileId: '13',
  input: '4 5\n',
  output: '9\n',
  inputSize: 4,
  outputSize: 2,
  canRun: true,
};
beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage('en');
  window.history.replaceState({}, '', '/v2/problem/P/ide');
  jest.mocked(cApi.publicCaseDetail).mockResolvedValue(detail);
});
it('loads a case through the permission-checked endpoint and sends the actual content to the IDE', async () => {
  const selected = jest.fn();
  window.addEventListener('answerIde:publicCase', selected);
  render(<PublicCaseDetail problemId="1" problemCode="P" checkpointId="14" />);
  fireEvent.click(screen.getByRole('button', { name: 'Case details' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Run this case with current code' }));
  expect(cApi.publicCaseDetail).toHaveBeenCalledWith({ problemId: '1', checkpointId: '14' });
  expect(selected).toHaveBeenCalledWith(
    expect.objectContaining({
      detail: { problemCode: 'P', input: '4 5\n', expectedOutput: '9\n' },
    }),
  );
  window.removeEventListener('answerIde:publicCase', selected);
});
it('disables running a truncated preview while allowing full file downloads', async () => {
  jest
    .mocked(cApi.publicCaseDetail)
    .mockResolvedValue({ ...detail, canRun: false, inputSize: 20000 });
  render(<PublicCaseDetail problemId="1" problemCode="P" checkpointId="14" />);
  fireEvent.click(screen.getByRole('button', { name: 'Case details' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Run this case with current code' })).toBeDisabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Download in/out' }));
  expect(mApi.zipDownload).toHaveBeenCalledWith(
    [
      { id: '12', downloadFilename: '14.in' },
      { id: '13', downloadFilename: '14.out' },
    ],
    '14.zip',
  );
});
