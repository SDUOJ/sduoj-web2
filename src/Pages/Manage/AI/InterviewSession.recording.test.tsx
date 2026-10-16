import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import { createAppStore } from '../../../Redux/Store';
import i18n from '../../../Config/i18n';
import InterviewSession from './InterviewSession';
import { interviewApi, InterviewResource, MediaTrack } from './interview-api';
import { pendingFor, savePending, uploadPending } from './interview-media';

jest.mock('./interview-api', () => ({ interviewApi: { session: jest.fn() } }));
jest.mock('./interview-media', () => ({
  pendingFor: jest.fn(),
  savePending: jest.fn(),
  uploadPending: jest.fn(),
}));
jest.mock('./AIWorkspaceNav', () => () => null);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

function streamFixture() {
  const stop = jest.fn();
  return { stream: { getTracks: () => [{ stop }] } as unknown as MediaStream, stop };
}

class Recorder {
  static instances: Recorder[] = [];
  static isTypeSupported = () => true;
  state = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  start = jest.fn(() => (this.state = 'recording'));
  stop = jest.fn(() => {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['recorded']) });
    this.onstop?.();
  });
  constructor() {
    Recorder.instances.push(this);
  }
}

async function openSession(tracks: MediaTrack[] = ['video']) {
  const session: InterviewResource = {
    id: 'i1',
    kind: 'interview',
    version: 1,
    state: 'ready',
    role: 'student',
    effective_status: 'awaiting_answer',
    data: {
      title: 'Recording fixture',
      student_id: '42',
      student_username: 'student',
      question: '',
      code: '',
      language: 'python',
      report: '',
      rubric: [],
      max_questions: 3,
      duration_minutes: 20,
      status: 'awaiting_answer',
      expires_at: '2030-01-01T00:00:00',
      turns: [{ question: 'Explain this code', answer: null }],
      media_policy: { required_tracks: tracks, max_segment_seconds: 60 },
    },
  };
  (interviewApi.session as jest.Mock).mockResolvedValue(session);
  const store = createAppStore();
  store.dispatch({
    type: 'setUserInfo',
    data: { userId: '42', username: 'student', roles: ['user'] },
  });
  store.dispatch({ type: 'userLogin' });
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/v2/ai-interviews/i1']}>
        <Route path="/v2/ai-interviews/:id">
          <InterviewSession />
        </Route>
      </MemoryRouter>
    </Provider>,
  );
  await screen.findByRole('button', { name: /Record / });
  return view;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  Recorder.instances = [];
  Object.defineProperty(window, 'MediaRecorder', { configurable: true, value: Recorder });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: jest.fn(), getDisplayMedia: jest.fn() },
  });
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  (savePending as jest.Mock).mockResolvedValue(undefined);
  (pendingFor as jest.Mock).mockResolvedValue([]);
  (uploadPending as jest.Mock).mockResolvedValue(undefined);
});

test.each<MediaTrack>(['video', 'audio', 'screen'])(
  'stops a late %s permission stream after leaving without recording or uploading',
  async (track) => {
    const permission = deferred<MediaStream>();
    const device =
      track === 'screen'
        ? navigator.mediaDevices.getDisplayMedia
        : navigator.mediaDevices.getUserMedia;
    (device as jest.Mock).mockReturnValue(permission.promise);
    const view = await openSession([track]);
    fireEvent.click(screen.getByRole('button', { name: /Record / }));
    view.unmount();
    const late = streamFixture();
    await act(async () => permission.resolve(late.stream));
    expect(late.stop).toHaveBeenCalledTimes(1);
    expect(Recorder.instances).toHaveLength(0);
    expect(savePending).not.toHaveBeenCalled();
    expect(uploadPending).not.toHaveBeenCalled();
  },
);

test('one permission request is allowed while repeated clicks are pending', async () => {
  const permission = deferred<MediaStream>();
  (navigator.mediaDevices.getUserMedia as jest.Mock).mockReturnValue(permission.promise);
  const view = await openSession();
  const button = screen.getByRole('button', { name: /Record / });
  act(() => {
    fireEvent.click(button);
    fireEvent.click(button);
  });
  expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
  const granted = streamFixture();
  await act(async () => permission.resolve(granted.stream));
  expect(Recorder.instances).toHaveLength(1);
  view.unmount();
  expect(granted.stop).toHaveBeenCalledTimes(1);
});

test('leaving an active recording stops the recorder without running its upload handler', async () => {
  const granted = streamFixture();
  (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(granted.stream);
  const view = await openSession();
  fireEvent.click(screen.getByRole('button', { name: /Record / }));
  await screen.findByRole('button', { name: /Stop recording/ });
  const recorder = Recorder.instances[0];
  const queuedStop = recorder.onstop;
  view.unmount();
  await act(async () => {
    queuedStop?.();
  });
  expect(granted.stop).toHaveBeenCalledTimes(1);
  expect(recorder.stop).toHaveBeenCalledTimes(1);
  expect(savePending).not.toHaveBeenCalled();
  expect(pendingFor).not.toHaveBeenCalled();
});

test('an explicit stop still saves captured media and retries the current upload', async () => {
  const granted = streamFixture();
  (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(granted.stream);
  (pendingFor as jest.Mock).mockResolvedValue([{ key: 'pending' }]);
  const view = await openSession();
  fireEvent.click(screen.getByRole('button', { name: /Record / }));
  fireEvent.click(await screen.findByRole('button', { name: /Stop recording/ }));
  await waitFor(() => expect(uploadPending).toHaveBeenCalledTimes(1));
  expect(savePending).toHaveBeenCalledWith(
    expect.objectContaining({ ownerId: '42', resourceId: 'i1', track: 'video', segmentCount: 1 }),
  );
  expect(granted.stop).toHaveBeenCalledTimes(1);
  view.unmount();
});

test('leaving while a stopped recording is being saved prevents subsequent uploads', async () => {
  const saving = deferred<void>();
  const granted = streamFixture();
  (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(granted.stream);
  (savePending as jest.Mock).mockReturnValue(saving.promise);
  const view = await openSession();
  fireEvent.click(screen.getByRole('button', { name: /Record / }));
  fireEvent.click(await screen.findByRole('button', { name: /Stop recording/ }));
  await waitFor(() => expect(savePending).toHaveBeenCalledTimes(1));
  view.unmount();
  await act(async () => saving.resolve());
  expect(pendingFor).not.toHaveBeenCalled();
  expect(uploadPending).not.toHaveBeenCalled();
});

test('a rejected permission request releases the guard for a successful retry', async () => {
  const granted = streamFixture();
  (navigator.mediaDevices.getUserMedia as jest.Mock)
    .mockRejectedValueOnce(new Error('Permission denied'))
    .mockResolvedValueOnce(granted.stream);
  const view = await openSession();
  fireEvent.click(screen.getByRole('button', { name: /Record / }));
  await screen.findByText('Error: Permission denied');
  fireEvent.click(screen.getByRole('button', { name: /Record / }));
  await screen.findByRole('button', { name: /Stop recording/ });
  expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
  view.unmount();
  expect(granted.stop).toHaveBeenCalledTimes(1);
});

const unavailableSessions: [string, (value: InterviewResource) => InterviewResource][] = [
  ['cancelled', (value) => ({ ...value, effective_status: 'cancelled' })],
  ['expired', (value) => ({ ...value, effective_status: 'expired' })],
  ['cancelled state', (value) => ({ ...value, state: 'cancelled' })],
  ['failed state', (value) => ({ ...value, state: 'failed' })],
  ['cancelled data', (value) => ({ ...value, data: { ...value.data, status: 'cancelled' } })],
  ['running data', (value) => ({ ...value, data: { ...value.data, status: 'running' } })],
  [
    'answered turn',
    (value) => ({ ...value, data: { ...value.data, turns: [{ question: 'Q', answer: 'Done' }] } }),
  ],
  ['teacher role', (value) => ({ ...value, role: 'teacher' })],
];

async function refreshFromPoll(
  timer: jest.SpyInstance,
  update: (value: InterviewResource) => InterviewResource,
) {
  const previous = await (interviewApi.session as jest.Mock).mock.results[0].value;
  (interviewApi.session as jest.Mock).mockResolvedValue(update(previous));
  const poll = timer.mock.calls.find(([, interval]) => interval === 2500)?.[0];
  expect(poll).toBeInstanceOf(Function);
  act(() => poll());
  await waitFor(() => expect(screen.queryByRole('button', { name: /Record / })).toBeNull());
}

test.each(unavailableSessions)('a same-turn %s refresh stops active capture', async (_, update) => {
  const timer = jest.spyOn(window, 'setInterval');
  const granted = streamFixture();
  (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(granted.stream);
  const view = await openSession();
  fireEvent.click(screen.getByRole('button', { name: /Record / }));
  await screen.findByRole('button', { name: /Stop recording/ });
  await refreshFromPoll(timer, update);
  await waitFor(() => expect(granted.stop).toHaveBeenCalledTimes(1));
  expect(Recorder.instances[0].stop).toHaveBeenCalledTimes(1);
  expect(savePending).not.toHaveBeenCalled();
  expect(uploadPending).not.toHaveBeenCalled();
  view.unmount();
});

test.each(unavailableSessions)(
  'a same-turn %s refresh rejects late device permission',
  async (_, update) => {
    const timer = jest.spyOn(window, 'setInterval');
    const permission = deferred<MediaStream>();
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockReturnValue(permission.promise);
    const view = await openSession();
    fireEvent.click(screen.getByRole('button', { name: /Record / }));
    await refreshFromPoll(timer, update);
    const late = streamFixture();
    await act(async () => permission.resolve(late.stream));
    expect(Recorder.instances).toHaveLength(0);
    expect(late.stop).toHaveBeenCalledTimes(1);
    expect(savePending).not.toHaveBeenCalled();
    view.unmount();
  },
);
