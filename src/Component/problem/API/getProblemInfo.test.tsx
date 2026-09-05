import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { rootReducers } from '../../../Redux/Store/rootReducer';
import useProblemInfo from './getProblemInfo';

function Probe({ load, cacheKey }: { load: () => Promise<string>; cacheKey: string }) {
  return <div>{useProblemInfo(load, cacheKey) ?? 'loading'}</div>;
}

it('publishes the new session response to multiple consumers after session hydration', async () => {
  let resolveGuest!: (value: string) => void;
  let resolveAuthenticated!: (value: string) => void;
  const load = jest
    .fn()
    .mockReturnValueOnce(
      new Promise<string>((resolve) => {
        resolveGuest = resolve;
      }),
    )
    .mockReturnValueOnce(
      new Promise<string>((resolve) => {
        resolveAuthenticated = resolve;
      }),
    );
  const store = createStore(rootReducers);
  render(
    <Provider store={store}>
      <Probe load={load} cacheKey="session" />
      <Probe load={load} cacheKey="session" />
    </Provider>,
  );
  act(() => {
    store.dispatch({
      type: 'setUserInfo',
      data: { userId: '1', username: 'alice', nickname: 'Alice', studentId: '1', roles: ['user'] },
    });
    store.dispatch({ type: 'userLogin' });
  });
  await act(async () => resolveAuthenticated('Authenticated problem'));
  expect(screen.getAllByText('Authenticated problem')).toHaveLength(2);
  await act(async () => resolveGuest('Old guest problem'));
  expect(screen.queryByText('Old guest problem')).not.toBeInTheDocument();
});

it('does not reuse an already cached problem after the user session changes', async () => {
  const load = jest
    .fn()
    .mockResolvedValueOnce('Guest problem')
    .mockResolvedValueOnce('Authenticated problem');
  const store = createStore(rootReducers);
  render(
    <Provider store={store}>
      <Probe load={load} cacheKey="session-cache" />
      <Probe load={load} cacheKey="session-cache" />
    </Provider>,
  );
  expect(await screen.findAllByText('Guest problem')).toHaveLength(2);

  act(() => {
    store.dispatch({
      type: 'setUserInfo',
      data: { userId: '1', username: 'alice', nickname: 'Alice', studentId: '1', roles: ['user'] },
    });
    store.dispatch({ type: 'userLogin' });
  });

  expect(await screen.findAllByText('Authenticated problem')).toHaveLength(2);
  expect(screen.queryByText('Guest problem')).not.toBeInTheDocument();
  expect(load).toHaveBeenCalledTimes(2);
});

it('does not show an old request result after navigating to another problem', async () => {
  let resolveOld!: (value: string) => void;
  let resolveNew!: (value: string) => void;
  const oldLoad = jest.fn(
    () =>
      new Promise<string>((resolve) => {
        resolveOld = resolve;
      }),
  );
  const newLoad = jest.fn(
    () =>
      new Promise<string>((resolve) => {
        resolveNew = resolve;
      }),
  );
  const store = createStore(rootReducers);
  const view = render(
    <Provider store={store}>
      <Probe load={oldLoad} cacheKey="old" />
    </Provider>,
  );
  view.rerender(
    <Provider store={store}>
      <Probe load={newLoad} cacheKey="new" />
    </Provider>,
  );
  resolveOld('old result');
  await Promise.resolve();
  expect(screen.queryByText('old result')).not.toBeInTheDocument();
  resolveNew('new result');
  expect(await screen.findByText('new result')).toBeInTheDocument();
});

it('clears the loading guard after failure so a remount can retry', async () => {
  const load = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('ready');
  const store = createStore(rootReducers);
  const first = render(
    <Provider store={store}>
      <Probe load={load} cacheKey="retry" />
    </Provider>,
  );
  await Promise.resolve();
  first.unmount();
  render(
    <Provider store={store}>
      <Probe load={load} cacheKey="retry" />
    </Provider>,
  );
  expect(await screen.findByText('ready')).toBeInTheDocument();
  expect(load).toHaveBeenCalledTimes(2);
});

it('retries a failed key after navigating away and back in the same component', async () => {
  const failed = jest.fn().mockRejectedValue(new Error('offline'));
  const other = jest.fn().mockResolvedValue('Other problem');
  const retry = jest.fn().mockResolvedValue('Recovered problem');
  const store = createStore(rootReducers);
  const view = render(
    <Provider store={store}>
      <Probe load={failed} cacheKey="failed-route" />
    </Provider>,
  );
  await waitFor(() => expect(failed).toHaveBeenCalledTimes(1));

  view.rerender(
    <Provider store={store}>
      <Probe load={other} cacheKey="other-route" />
    </Provider>,
  );
  expect(await screen.findByText('Other problem')).toBeInTheDocument();

  view.rerender(
    <Provider store={store}>
      <Probe load={retry} cacheKey="failed-route" />
    </Provider>,
  );
  expect(await screen.findByText('Recovered problem')).toBeInTheDocument();
  expect(retry).toHaveBeenCalledTimes(1);
});

it('shares one in-flight load between consumers of the same problem', async () => {
  let resolve!: (value: string) => void;
  const load = jest.fn(
    () =>
      new Promise<string>((done) => {
        resolve = done;
      }),
  );
  const store = createStore(rootReducers);
  render(
    <Provider store={store}>
      <Probe load={load} cacheKey="shared" />
      <Probe load={load} cacheKey="shared" />
    </Provider>,
  );
  expect(load).toHaveBeenCalledTimes(1);
  resolve('shared result');
  expect(await screen.findAllByText('shared result')).toHaveLength(2);
});

it('does not repopulate cleared state after logout and route unmount', async () => {
  let resolve!: (value: string) => void;
  const load = jest.fn(
    () =>
      new Promise<string>((done) => {
        resolve = done;
      }),
  );
  const store = createStore(rootReducers);
  store.dispatch({
    type: 'setUserInfo',
    data: { userId: '1', username: 'alice', nickname: 'Alice', studentId: '1', roles: ['user'] },
  });
  store.dispatch({ type: 'userLogin' });
  const view = render(
    <Provider store={store}>
      <Probe load={load} cacheKey="logout" />
    </Provider>,
  );
  act(() => {
    store.dispatch({ type: 'userLogout' });
    store.dispatch({ type: 'clearRedux' });
    view.unmount();
  });
  resolve('Alice problem');
  await Promise.resolve();
  expect(store.getState().ProblemReducer.ProblemInfo.logout).toBeUndefined();
});

it('does not let an abandoned completion clear or replace a newer same-key request', async () => {
  let resolveOld!: (value: string) => void;
  let resolveNew!: (value: string) => void;
  const oldLoad = jest.fn(
    () =>
      new Promise<string>((done) => {
        resolveOld = done;
      }),
  );
  const newLoad = jest.fn(
    () =>
      new Promise<string>((done) => {
        resolveNew = done;
      }),
  );
  const store = createStore(rootReducers);
  const old = render(
    <Provider store={store}>
      <Probe load={oldLoad} cacheKey="replacement" />
    </Provider>,
  );
  old.unmount();
  render(
    <Provider store={store}>
      <Probe load={newLoad} cacheKey="replacement" />
    </Provider>,
  );
  resolveOld('abandoned');
  await Promise.resolve();
  expect(screen.queryByText('abandoned')).not.toBeInTheDocument();
  expect(newLoad).toHaveBeenCalledTimes(1);
  resolveNew('current');
  expect(await screen.findByText('current')).toBeInTheDocument();
});
