import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PublicAutoFillPanel from './PublicAutoFillPanel';
import mApi from '../../Utils/API/m-api';
import { fileUpload } from '../../Utils/fileUpload';
import i18n from '../../Config/i18n';

jest.mock('../../Utils/fileUpload', () => ({ fileUpload: jest.fn() }));
jest.mock('../../Utils/API/m-api', () => ({
  __esModule: true,
  default: {
    previewPublicInputs: jest.fn(),
    uploadPublicInputs: jest.fn(),
    publicAutoTask: jest.fn(),
    finishPublicAutoTask: jest.fn(),
    zipDownload: jest.fn(),
  },
}));
jest.mock('./From/Item/MetaTaskProgress', () => (props: any) => (
  <div>
    <span data-testid="task-id">{props.ids[0]}</span>
    <button onClick={props.onChange}>Complete task</button>
    <button onClick={() => props.onRetry('def')}>Retry task</button>
  </div>
));
const preview = {
  eligible: true,
  autoAddEnabled: true,
  usedCount: 0,
  maxCount: 20,
  added: 0,
  skipped: 0,
  items: [{ index: 0, inputFileId: '12', inputPreview: '4 5\n', status: 'NEW' as const }],
};
beforeEach(async () => {
  localStorage.clear();
  jest.clearAllMocks();
  await i18n.changeLanguage('en');
  jest.mocked(fileUpload).mockResolvedValue([{ id: '12' } as any]);
  jest.mocked(mApi.previewPublicInputs).mockResolvedValue(preview);
  jest.mocked(mApi.uploadPublicInputs).mockResolvedValue('abc');
  jest
    .mocked(mApi.publicAutoTask)
    .mockImplementation(async ({ submissionId }) => ({ submissionId, judgeResult: 1 }));
  jest.mocked(mApi.finishPublicAutoTask).mockResolvedValue({
    ...preview,
    usedCount: 1,
    added: 1,
    items: [{ ...preview.items[0], status: 'ADDED', outputFileId: '13', checkpointId: '14' }],
  });
});
async function upload() {
  fireEvent.click(screen.getByRole('button', { name: 'Auto-fill public cases' }));
  fireEvent.change(screen.getByLabelText('Choose input files'), {
    target: { files: [new File(['4 5\n'], 'one.in')] },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Upload and preview duplicates' }));
  await screen.findByText('Will add');
}
it('uses authoritative preview, follows generated tasks, imports, and downloads their actual file references', async () => {
  const changed = jest.fn();
  render(<PublicAutoFillPanel problemCode="P" onAdded={changed} />);
  await upload();
  expect(mApi.previewPublicInputs).toHaveBeenCalledWith({ problemCode: 'P', inputFileIds: ['12'] });
  fireEvent.click(screen.getByRole('button', { name: 'Generate outputs and add' }));
  await waitFor(() => expect(screen.getByTestId('task-id')).toHaveTextContent('abc'));
  expect(mApi.uploadPublicInputs).toHaveBeenCalledWith({
    problemCode: 'P',
    action: 'generate',
    inputFileIds: ['12'],
  });
  fireEvent.click(screen.getByRole('button', { name: 'Complete task' }));
  await screen.findByText('Imported');
  expect(changed).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Download in/out' }));
  expect(mApi.zipDownload).toHaveBeenCalledWith(
    [
      { id: '12', downloadFilename: '0.in' },
      { id: '13', downloadFilename: '0.out' },
    ],
    'P-0.zip',
  );
});
it('keeps generation disabled until both gate and saved policy allow it', async () => {
  jest.mocked(mApi.previewPublicInputs).mockResolvedValue({ ...preview, autoAddEnabled: false });
  render(<PublicAutoFillPanel problemCode="P" />);
  await upload();
  expect(screen.getByRole('button', { name: 'Generate outputs and add' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Validate inputs' })).toBeEnabled();
});
it('rejects more than 20 selected files before uploading', async () => {
  render(<PublicAutoFillPanel problemCode="P" />);
  fireEvent.click(screen.getByRole('button', { name: 'Auto-fill public cases' }));
  fireEvent.change(screen.getByLabelText('Choose input files'), {
    target: { files: Array.from({ length: 21 }, (_, index) => new File(['x'], `${index}.in`)) },
  });
  expect(screen.getByRole('button', { name: 'Upload and preview duplicates' })).toBeDisabled();
  expect(fileUpload).not.toHaveBeenCalled();
});
it('resumes a saved task and never imports a canceled result', async () => {
  localStorage.setItem('publicAuto:task:P', JSON.stringify({ id: 'abc', action: 'generate' }));
  jest.mocked(mApi.publicAutoTask).mockResolvedValue({ submissionId: 'abc', judgeResult: 99 });
  render(<PublicAutoFillPanel problemCode="P" />);
  fireEvent.click(screen.getByRole('button', { name: 'Auto-fill public cases' }));
  fireEvent.click(screen.getByRole('button', { name: 'Complete task' }));
  await waitFor(() => expect(screen.queryByTestId('task-id')).not.toBeInTheDocument());
  expect(localStorage.getItem('publicAuto:task:P')).toBeNull();
  expect(mApi.finishPublicAutoTask).not.toHaveBeenCalled();
});
it('replaces the saved batch id when retry creates a new task', async () => {
  localStorage.setItem('publicAuto:task:P', JSON.stringify({ id: 'abc', action: 'generate' }));
  render(<PublicAutoFillPanel problemCode="P" />);
  fireEvent.click(screen.getByRole('button', { name: 'Auto-fill public cases' }));
  fireEvent.click(screen.getByRole('button', { name: 'Retry task' }));
  await waitFor(() => expect(screen.getByTestId('task-id')).toHaveTextContent('def'));
  fireEvent.click(screen.getByRole('button', { name: 'Complete task' }));
  await waitFor(() => expect(mApi.finishPublicAutoTask).toHaveBeenCalledWith('def'));
});
