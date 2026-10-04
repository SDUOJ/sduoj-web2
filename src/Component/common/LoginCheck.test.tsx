import { act, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { createAppStore } from '../../Redux/Store';
import CApi from '../../Utils/API/c-api';
import LoginCheck from './LoginCheck';
import '../../Config/i18n';
import { AUTH_BOUNDARY_EVENT } from '../../Utils/authBoundary';

jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { getProfile: jest.fn() },
}));

function Location() {
  const location = useLocation();
  return <output>{location.pathname + location.search + location.hash}</output>;
}

it('redirects an already-known anonymous session when a protected lazy layout mounts', async () => {
  const store = createAppStore();
  store.dispatch({ type: 'authCheckFailed' });
  const target = '/v2/problemSet/42/overview?filter=a%26b#result';
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[target]}>
        <LoginCheck jump />
        <Location />
      </MemoryRouter>
    </Provider>,
  );
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      '/v2/login?to=' + encodeURIComponent(target),
    ),
  );
  expect(CApi.getProfile).not.toHaveBeenCalled();
});

it('does not redirect or repeat profile requests on a public anonymous page', () => {
  const store = createAppStore();
  store.dispatch({ type: 'authCheckFailed' });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/v2/problem']}>
        <LoginCheck />
        <Location />
      </MemoryRouter>
    </Provider>,
  );
  expect(screen.getByRole('status')).toHaveTextContent('/v2/problem');
  expect(CApi.getProfile).not.toHaveBeenCalled();
});

it('leaves an authenticated protected route in place', () => {
  const store = createAppStore();
  store.dispatch({ type: 'userLogin' });
  store.dispatch({ type: 'setKeyValue', key: 'private', value: 'cached' });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/v2/exam/list']}>
        <LoginCheck jump />
        <Location />
      </MemoryRouter>
    </Provider>,
  );
  expect(screen.getByRole('status')).toHaveTextContent('/v2/exam/list');
  expect(CApi.getProfile).not.toHaveBeenCalled();
});

it('never replaces the login route repeatedly for an anonymous session', () => {
  const store = createAppStore();
  store.dispatch({ type: 'authCheckFailed' });
  const target = '/v2/login?to=%2Fv2%2Fexam%2Flist';
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[target]}>
        <LoginCheck jump />
        <Location />
      </MemoryRouter>
    </Provider>,
  );
  expect(screen.getByRole('status')).toHaveTextContent(target);
  expect(CApi.getProfile).not.toHaveBeenCalled();
});

it('clears stale roles when an API reports a forbidden session', async () => {
  const store = createAppStore();
  store.dispatch({
    type: 'setUserInfo',
    data: { username: 'admin', roles: ['admin'], features: {} } as never,
  });
  store.dispatch({ type: 'userLogin' });
  const target = '/v2/manage/course/classroom';
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[target]}>
        <LoginCheck jump />
        <Location />
      </MemoryRouter>
    </Provider>,
  );

  act(() => window.dispatchEvent(new Event(AUTH_BOUNDARY_EVENT)));
  await waitFor(() => expect(store.getState().UserReducer.authStatus).toBe('anonymous'));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent(
      '/v2/login?to=' + encodeURIComponent(target),
    ),
  );
  expect(store.getState().UserReducer.userInfo).toBeUndefined();
  expect(store.getState().CommonReducer.keyValueData).toEqual({});
});
