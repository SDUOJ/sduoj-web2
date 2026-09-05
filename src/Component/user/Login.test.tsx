import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createAppStore } from '../../Redux/Store';
import CApi from '../../Utils/API/c-api';
import Login from './Login';

jest.mock('../../Utils/API/c-api', () => ({ __esModule: true, default: { login: jest.fn() } }));

it('sends one login while pending, preserves credentials after rejection and allows retry', async () => {
  const store = createAppStore();
  let reject!: (error: Error) => void;
  (CApi.login as jest.Mock).mockReturnValueOnce(
    new Promise((_, fail) => {
      reject = fail;
    }),
  );
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </Provider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('tab', { name: /Account.*Password/ }));
  await user.click(screen.getByRole('button', { name: /^login$/i }));
  await waitFor(() => expect(document.querySelector('.ant-form-item-explain-error')).toBeVisible());
  expect(CApi.login).not.toHaveBeenCalled();
  const username = document.querySelector<HTMLInputElement>('#username')!;
  const password = document.querySelector<HTMLInputElement>('#password')!;
  fireEvent.change(username, { target: { value: 'test_user' } });
  fireEvent.change(password, { target: { value: 'Test123!' } });
  await user.click(screen.getByRole('button', { name: /^login$/i }));
  await waitFor(() => expect(CApi.login).toHaveBeenCalledTimes(1));
  fireEvent.keyDown(password, { key: 'Enter', code: 'Enter', keyCode: 13 });
  expect(CApi.login).toHaveBeenCalledTimes(1);
  await act(async () => reject(new Error('offline')));
  expect(store.getState().UserReducer.isLogin).not.toBe(true);
  expect(username).toHaveValue('test_user');
  expect(password).toHaveValue('Test123!');
  (CApi.login as jest.Mock).mockResolvedValueOnce({
    username: 'test_user',
    roles: ['user'],
    features: {},
  });
  await user.click(screen.getByRole('button', { name: /^login$/i }));
  await waitFor(() => expect(store.getState().UserReducer.isLogin).toBe(true));
  expect(CApi.login).toHaveBeenCalledTimes(2);
});
