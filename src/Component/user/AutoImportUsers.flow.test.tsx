import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import writeWorkbook from 'write-excel-file/node';
import readBrowser from 'read-excel-file/browser';
import AutoImportUsers, { PASSWORD_DISPLAY_MASK } from './AutoImportUsers';
import mApi from '../../Utils/API/m-api';
import i18n from '../../Config/i18n';

jest.mock('../../Utils/API/m-api', () => ({ __esModule: true, default: { addUsers: jest.fn() } }));
jest.mock('read-excel-file/browser', () => ({
  __esModule: true,
  default: jest.fn((input: ArrayBuffer) => {
    const reader = jest.requireActual('read-excel-file/node');
    return (reader.default ?? reader)(Buffer.from(input));
  }),
}));

beforeEach(async () => {
  jest.mocked(mApi.addUsers).mockReset().mockResolvedValue(undefined);
  await i18n.changeLanguage('en');
});
afterEach(async () => {
  await i18n.changeLanguage('zh');
});

async function importRows(data: unknown[][]) {
  render(<AutoImportUsers />);
  fireEvent.click(screen.getByRole('button', { name: i18n.t('BatchImport') }));
  const workbook = writeWorkbook(
    [['username', 'password', 'email'], ...data].map((row) =>
      row.map((value) => ({ value: value as string })),
    ),
    { sheet: 'users' },
  );
  const buffer = await workbook.toBuffer();
  const bytes = Uint8Array.from(buffer);
  const file = new File([bytes.buffer], 'users.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => bytes.buffer,
  });
  const input = document.querySelector<HTMLInputElement>('.ant-upload input[type="file"]')!;
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(readBrowser).toHaveBeenCalled());
  const sheets = await jest.mocked(readBrowser).mock.results[0].value;
  expect(sheets[0]).toHaveProperty('sheet', 'users');
  expect(sheets[0].data[1][0]).toBe(data[0][0]);
  await waitFor(() => expect(document.body.textContent).toContain(String(data[0][0])));
  await screen.findByRole('row', { name: new RegExp(String(data[0][0])) });
}
const submit = (count: number) =>
  screen.getByRole('button', { name: i18n.t('userImport.submit', { count }) });

it('shows row errors and counts, removes only created users, then submits a corrected invalid row', async () => {
  await importRows([
    ['student_a', 'fixture-password-a', 'a@example.com'],
    ['student_b', 'fixture-password-b', 'invalid-email'],
  ]);
  expect(
    screen.getByText(
      i18n.t('userImport.summary', { total: 2, ready: 1, invalid: 1, failed: 0, submitting: 0 }),
    ),
  ).toBeInTheDocument();
  const invalid = screen.getByRole('row', { name: /student_b/ });
  expect(within(invalid).getByText(i18n.t('Invalid'))).toBeInTheDocument();
  expect(within(invalid).getByText(new RegExp(i18n.t('emailError')))).toBeInTheDocument();
  expect(screen.getAllByText(PASSWORD_DISPLAY_MASK)).toHaveLength(2);
  expect(screen.queryByText('fixture-password-a')).not.toBeInTheDocument();
  await act(async () => fireEvent.click(submit(1)));
  await waitFor(() =>
    expect(screen.queryByRole('row', { name: /student_a/ })).not.toBeInTheDocument(),
  );
  expect(mApi.addUsers).toHaveBeenCalledWith([
    expect.objectContaining({ username: 'student_a', password: 'fixture-password-a' }),
  ]);
  expect(screen.getByRole('row', { name: /student_b/ })).toBeInTheDocument();
  expect(submit(0)).toBeDisabled();
  fireEvent.click(
    within(screen.getByRole('row', { name: /student_b/ })).getByRole('button', {
      name: i18n.t('Edit'),
    }),
  );
  const edit = screen
    .getAllByRole('dialog')
    .find((dialog) => within(dialog).queryByRole('button', { name: i18n.t('Save') }))!;
  const email = within(edit).getByLabelText(i18n.t('email'));
  fireEvent.change(email, { target: { value: 'b@example.com' } });
  await act(async () =>
    fireEvent.click(within(edit).getByRole('button', { name: i18n.t('Save') })),
  );
  await waitFor(() => expect(submit(1)).toBeEnabled());
  expect(document.querySelector<HTMLInputElement>('input[type="password"]')?.value ?? '').toBe('');
  await act(async () => fireEvent.click(submit(1)));
  await waitFor(() =>
    expect(screen.queryByRole('row', { name: /student_b/ })).not.toBeInTheDocument(),
  );
  expect(mApi.addUsers).toHaveBeenLastCalledWith([
    expect.objectContaining({
      username: 'student_b',
      email: 'b@example.com',
      password: 'fixture-password-b',
    }),
  ]);
  expect(mApi.addUsers).toHaveBeenCalledTimes(2);
}, 30000);

it('retains failed and invalid drafts and retries only the failed valid rows', async () => {
  jest.mocked(mApi.addUsers).mockRejectedValueOnce(new Error('fixture failure'));
  await importRows([
    ['student_a', 'fixture-password-a', 'a@example.com'],
    ['student_b', 'fixture-password-b', 'invalid-email'],
  ]);
  await act(async () => fireEvent.click(submit(1)));
  await waitFor(() =>
    expect(
      within(screen.getByRole('row', { name: /student_a/ })).getByText(i18n.t('SubmitFailed')),
    ).toBeInTheDocument(),
  );
  expect(screen.getByRole('row', { name: /student_b/ })).toBeInTheDocument();
  expect(
    screen.getByText(
      i18n.t('userImport.summary', { total: 2, ready: 0, invalid: 1, failed: 1, submitting: 0 }),
    ),
  ).toBeInTheDocument();
  await act(async () => fireEvent.click(submit(1)));
  await waitFor(() =>
    expect(screen.queryByRole('row', { name: /student_a/ })).not.toBeInTheDocument(),
  );
  expect(mApi.addUsers).toHaveBeenCalledTimes(2);
  expect(jest.mocked(mApi.addUsers).mock.calls[1][0]).toEqual(
    jest.mocked(mApi.addUsers).mock.calls[0][0],
  );
  expect(screen.getByRole('row', { name: /student_b/ })).toBeInTheDocument();
});

it('prevents import, edit, close and duplicate submission while a batch is pending', async () => {
  let finish!: () => void;
  jest.mocked(mApi.addUsers).mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
  await importRows([['student_a', 'fixture-password-a', 'a@example.com']]);
  await act(async () => fireEvent.click(submit(1)));
  const dialog = screen
    .getAllByRole('dialog')
    .find((candidate) => within(candidate).queryByRole('table'))!;
  expect(within(dialog).getByRole('button', { name: i18n.t('Cancel') })).toBeDisabled();
  expect(within(dialog).getByRole('button', { name: i18n.t('Edit') })).toBeDisabled();
  expect(document.querySelector<HTMLInputElement>('.ant-upload input[type="file"]')).toBeDisabled();
  const action = within(dialog).getByRole('button', { name: /Submit valid rows/ });
  expect(action).toBeDisabled();
  fireEvent.click(action);
  expect(mApi.addUsers).toHaveBeenCalledTimes(1);
  await act(async () => finish());
});
