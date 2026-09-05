import { message } from 'antd';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createAppStore } from '../../Redux/Store';
import CApi from '../../Utils/API/c-api';
import CHeader from './CHeader';
import MHeader from './MHeader';
import EHeader from './EHeader';

jest.mock('../../Utils/API/c-api', () => ({ __esModule: true, default: { logout: jest.fn() } }));
jest.mock('../common/ChangeLang', () => () => null);
jest.mock('../exam/ExamOver', () => () => null);
jest.mock('./UserAccountDropdown', () => ({
  __esModule: true,
  default: ({ onLogout }: { onLogout: () => void }) => <button onClick={onLogout}>Sign out</button>,
}));

it.each([
  ['client', CHeader],
  ['manage', MHeader],
  ['exam', EHeader],
] as const)('%s header only announces logout after server success', async (_, Header) => {
  const store = createAppStore();
  store.dispatch({
    type: 'setUserInfo',
    data: { userId: '1', username: 'tester', nickname: 'Tester', studentId: '1', roles: ['user'] },
  });
  store.dispatch({ type: 'userLogin' });
  const info = jest.spyOn(message, 'info');
  let reject!: (error: Error) => void;
  (CApi.logout as jest.Mock).mockReturnValueOnce(
    new Promise((_, fail) => {
      reject = fail;
    }),
  );
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </Provider>,
  );
  await userEvent.setup().click(screen.getByRole('button', { name: 'Sign out' }));
  expect(info).not.toHaveBeenCalled();
  await act(async () => reject(new Error('offline')));
  expect(info).not.toHaveBeenCalled();
  expect(store.getState().UserReducer.isLogin).toBe(true);
  (CApi.logout as jest.Mock).mockResolvedValueOnce(null);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Sign out' }));
  await waitFor(() => expect(info).toHaveBeenCalledTimes(1));
  expect(store.getState().UserReducer.isLogin).toBe(false);
});
