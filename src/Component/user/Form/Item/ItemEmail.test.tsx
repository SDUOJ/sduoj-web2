import { Form } from 'antd';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CApi from '../../../../Utils/API/c-api';
import ItemEmail from './ItemEmail';

jest.mock('../../../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { sendVerificationEmail: jest.fn() },
}));
jest.mock('./ItemCaptcha', () => () => <div>Captcha</div>);

const email = () => Promise.resolve('test@example.invalid');
const ui = () => (
  <Form>
    <ItemEmail needVerify editable emailVerifyType="login" getEmail={email} checkExist={false} />
  </Form>
);

async function openVerification(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^verify$/i }));
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(dialog).toBeVisible());
  return within(dialog).getByRole('button', { name: 'OK' });
}

it('handles failed verification sends and prevents duplicate requests while pending', async () => {
  let reject!: (error: Error) => void;
  (CApi.sendVerificationEmail as jest.Mock).mockReturnValueOnce(
    new Promise((_, fail) => {
      reject = fail;
    }),
  );
  render(ui());
  const user = userEvent.setup();
  const confirm = await openVerification(user);
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  expect(CApi.sendVerificationEmail).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error('offline')));
  expect(screen.getByRole('dialog')).toBeVisible();
  (CApi.sendVerificationEmail as jest.Mock).mockResolvedValueOnce(null);
  await user.click(confirm);
  await waitFor(() => expect(screen.getByRole('button', { name: '60s' })).toBeDisabled());
  expect(CApi.sendVerificationEmail).toHaveBeenCalledTimes(2);
});

it('does not restart the cooldown clock on parent rerenders', async () => {
  jest.useFakeTimers();
  try {
    (CApi.sendVerificationEmail as jest.Mock).mockResolvedValue(null);
    const view = render(ui());
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.click(await openVerification(user));
    expect(await screen.findByRole('button', { name: '60s' })).toBeDisabled();
    for (let i = 0; i < 4; i++) {
      act(() => jest.advanceTimersByTime(250));
      view.rerender(ui());
    }
    expect(screen.getByRole('button', { name: '59s' })).toBeDisabled();
    view.unmount();
    act(() => jest.advanceTimersByTime(60000));
  } finally {
    jest.useRealTimers();
  }
});
