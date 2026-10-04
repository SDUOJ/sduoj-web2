import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { rootReducers } from '../../../Redux/Store/rootReducer';
import cApi from '../../../Utils/API/c-api';
import useProblemSetInfo from './getProblemSetInfo';
import { ProblemSetInfo } from '../../../Type/api';

jest.mock('../../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { getProblemSetInfo: jest.fn() },
}));

function Probe({ psid, onError }: { psid: string; onError?: (error: unknown) => void }) {
  return <div>{useProblemSetInfo(psid, onError)?.name ?? 'loading'}</div>;
}

function problemSet(name: string): ProblemSetInfo {
  return {
    psid: 1,
    name,
    description: null,
    type: 0,
    global_score: 100,
    tm_start: null,
    tm_end: null,
    groupId: 1,
    manageGroupId: null,
    tag: 'test',
    username: 'alice',
    isAdmin: false,
    groupInfo: [],
    latePermission: null,
    config: {
      useSameSE: 1,
      showReport: 0,
      showScoreInRunning: 1,
      showProgramScoreInRunning: 1,
      mergerSubjectiveGroup: 0,
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it('publishes a fresh response for multiple consumers when the session hydrates', async () => {
  const guest = deferred<ProblemSetInfo>();
  const authenticated = deferred<ProblemSetInfo>();
  jest
    .mocked(cApi.getProblemSetInfo)
    .mockReturnValueOnce(guest.promise)
    .mockReturnValueOnce(authenticated.promise);
  const store = createStore(rootReducers);
  render(
    <Provider store={store}>
      <Probe psid="17" />
      <Probe psid="17" />
    </Provider>,
  );
  act(() => {
    store.dispatch({
      type: 'setUserInfo',
      data: { userId: '1', username: 'alice', nickname: 'Alice', studentId: '1', roles: ['user'] },
    });
    store.dispatch({ type: 'userLogin' });
  });
  await act(async () => authenticated.resolve(problemSet('Authenticated set')));
  expect(screen.getAllByText('Authenticated set')).toHaveLength(2);
  await act(async () => guest.resolve(problemSet('Old guest set')));
  expect(screen.queryByText('Old guest set')).not.toBeInTheDocument();
});

it('does not reuse an already cached problem set after the user session changes', async () => {
  jest
    .mocked(cApi.getProblemSetInfo)
    .mockResolvedValueOnce(problemSet('Guest set'))
    .mockResolvedValueOnce(problemSet('Authenticated set'));
  const store = createStore(rootReducers);
  render(
    <Provider store={store}>
      <Probe psid="18" />
      <Probe psid="18" />
    </Provider>,
  );
  expect(await screen.findAllByText('Guest set')).toHaveLength(2);

  act(() => {
    store.dispatch({
      type: 'setUserInfo',
      data: { userId: '1', username: 'alice', nickname: 'Alice', studentId: '1', roles: ['user'] },
    });
    store.dispatch({ type: 'userLogin' });
  });

  expect(await screen.findAllByText('Authenticated set')).toHaveLength(2);
  expect(screen.queryByText('Guest set')).not.toBeInTheDocument();
  expect(cApi.getProblemSetInfo).toHaveBeenCalledTimes(2);
});

it('shares a request between consumers and never displays an old problem set after navigation', async () => {
  const oldRequest = deferred<ProblemSetInfo>();
  const newRequest = deferred<ProblemSetInfo>();
  jest
    .mocked(cApi.getProblemSetInfo)
    .mockReturnValueOnce(oldRequest.promise)
    .mockReturnValueOnce(newRequest.promise);
  const store = createStore(rootReducers);
  const view = render(
    <Provider store={store}>
      <Probe psid="1" />
      <Probe psid="1" />
    </Provider>,
  );
  expect(cApi.getProblemSetInfo).toHaveBeenCalledTimes(1);

  view.rerender(
    <Provider store={store}>
      <Probe psid="2" />
      <Probe psid="2" />
    </Provider>,
  );
  expect(cApi.getProblemSetInfo).toHaveBeenCalledTimes(2);
  oldRequest.resolve(problemSet('Old set'));
  await Promise.resolve();
  expect(screen.queryByText('Old set')).not.toBeInTheDocument();
  newRequest.resolve(problemSet('New set'));
  expect(await screen.findAllByText('New set')).toHaveLength(2);
});

it('allows a fresh mount to retry after a failed request', async () => {
  jest
    .mocked(cApi.getProblemSetInfo)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(problemSet('Recovered'));
  const store = createStore(rootReducers);
  const first = render(
    <Provider store={store}>
      <Probe psid="3" />
    </Provider>,
  );
  await Promise.resolve();
  first.unmount();
  render(
    <Provider store={store}>
      <Probe psid="3" />
    </Provider>,
  );
  expect(await screen.findByText('Recovered')).toBeInTheDocument();
  expect(cApi.getProblemSetInfo).toHaveBeenCalledTimes(2);
});

it('retries a failed id after navigating away and back in the same component', async () => {
  jest
    .mocked(cApi.getProblemSetInfo)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(problemSet('Other set'))
    .mockResolvedValueOnce(problemSet('Recovered set'));
  const store = createStore(rootReducers);
  const view = render(
    <Provider store={store}>
      <Probe psid="19" />
    </Provider>,
  );
  await waitFor(() => expect(cApi.getProblemSetInfo).toHaveBeenCalledTimes(1));

  view.rerender(
    <Provider store={store}>
      <Probe psid="20" />
    </Provider>,
  );
  expect(await screen.findByText('Other set')).toBeInTheDocument();

  view.rerender(
    <Provider store={store}>
      <Probe psid="19" />
    </Provider>,
  );
  expect(await screen.findByText('Recovered set')).toBeInTheDocument();
  expect(cApi.getProblemSetInfo).toHaveBeenCalledTimes(3);
});

it('does not report an old route failure through its former consumer', async () => {
  let rejectOld!: (error: Error) => void;
  const oldRequest = new Promise<never>((_, reject) => {
    rejectOld = reject;
  });
  jest
    .mocked(cApi.getProblemSetInfo)
    .mockReturnValueOnce(oldRequest)
    .mockResolvedValueOnce(problemSet('Current set'));
  const onError = jest.fn();
  const store = createStore(rootReducers);
  const view = render(
    <Provider store={store}>
      <Probe psid="4" onError={onError} />
    </Provider>,
  );
  view.rerender(
    <Provider store={store}>
      <Probe psid="5" onError={onError} />
    </Provider>,
  );
  rejectOld(new Error('old failure'));
  expect(await screen.findByText('Current set')).toBeInTheDocument();
  expect(onError).not.toHaveBeenCalled();
});

it('does not repopulate cleared state when a logged-out route unmounts', async () => {
  const request = deferred<ProblemSetInfo>();
  jest.mocked(cApi.getProblemSetInfo).mockReturnValueOnce(request.promise);
  const store = createStore(rootReducers);
  store.dispatch({
    type: 'setUserInfo',
    data: { userId: '1', username: 'alice', nickname: 'Alice', studentId: '1', roles: ['user'] },
  });
  store.dispatch({ type: 'userLogin' });
  const view = render(
    <Provider store={store}>
      <Probe psid="6" />
    </Provider>,
  );
  act(() => {
    store.dispatch({ type: 'userLogout' });
    store.dispatch({ type: 'clearRedux' });
    view.unmount();
  });
  request.resolve(problemSet('Alice data'));
  await Promise.resolve();
  expect(store.getState().ProblemSetReducer.problemSetInfo['6']).toBeUndefined();
});
