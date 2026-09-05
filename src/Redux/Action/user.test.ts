import CApi from '../../Utils/API/c-api';
import { createAppStore } from '../Store';
import { userLogoutTodo } from './user';

jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { logout: jest.fn() },
}));

const logout = CApi.logout as jest.Mock;

beforeEach(() => {
  logout.mockReset();
});

it('returns a promise and clears the session only after logout succeeds', async () => {
  let resolveLogout!: () => void;
  logout.mockReturnValue(new Promise<void>((resolve) => (resolveLogout = resolve)));
  const store = createAppStore();
  store.dispatch({ type: 'userLogin' });
  store.dispatch({ type: 'setKeyValue', key: 'private', value: 'cached' });

  const pending = store.dispatch(userLogoutTodo() as never) as unknown as Promise<void>;
  expect(pending).toBeInstanceOf(Promise);
  expect(store.getState().UserReducer.isLogin).toBe(true);
  expect(store.getState().CommonReducer.keyValueData).toEqual({ private: 'cached' });

  resolveLogout();
  await pending;
  expect(store.getState().UserReducer.isLogin).toBe(false);
  expect(store.getState().CommonReducer.keyValueData).toEqual({});
});

it('rejects and preserves the local session when server logout fails', async () => {
  const failure = new Error('logout failed');
  logout.mockRejectedValue(failure);
  const store = createAppStore();
  store.dispatch({ type: 'userLogin' });
  const before = store.getState();

  await expect(store.dispatch(userLogoutTodo() as never)).rejects.toBe(failure);
  expect(store.getState()).toBe(before);
});
