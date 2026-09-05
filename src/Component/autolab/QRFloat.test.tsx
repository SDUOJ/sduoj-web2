import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import autolabApi from '../../Utils/API/autolab-api';
import QRFloat from './QRFloat';

jest.mock('../../Utils/API/autolab-api', () => ({
  __esModule: true,
  default: {
    listCourses: jest.fn(),
    listSchedule: jest.fn(),
    initAttendance: jest.fn(),
    getAttendance: jest.fn(),
    generateToken: jest.fn(),
  },
}));
jest.mock('../problemSet/API/getProblemSetInfo', () => ({
  __esModule: true,
  default: (problemSetId: string) => ({ groupId: Number(problemSetId) * 10 }),
}));
jest.mock('qrcode.react', () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const activeSchedule = { schedule_id: 5, start_time: '2000-01-01', end_time: '2999-01-01' };

beforeEach(() => {
  (autolabApi.listCourses as jest.Mock).mockImplementation(({ group_id }) =>
    Promise.resolve({ courses: [{ course_id: group_id }] }),
  );
  (autolabApi.listSchedule as jest.Mock).mockResolvedValue({ schedules: [activeSchedule] });
  (autolabApi.getAttendance as jest.Mock).mockResolvedValue({ sign_mode: 1, students: [] });
  (autolabApi.generateToken as jest.Mock).mockImplementation((sgId) =>
    Promise.resolve({ token: `token-${sgId}` }),
  );
});

it('isolates initialization and tokens when the problem set changes', async () => {
  const oldInit = deferred<any>();
  (autolabApi.initAttendance as jest.Mock).mockImplementation((courseId) =>
    courseId === 10 ? oldInit.promise : Promise.resolve({ sg_id: 20 }),
  );

  const view = render(<QRFloat problemSetId="1" username="student" />);
  await waitFor(() =>
    expect(autolabApi.initAttendance).toHaveBeenCalledWith(10, 5, { group_id: 10 }),
  );
  view.rerender(<QRFloat problemSetId="2" username="student" />);
  expect(await screen.findByTestId('qr-code')).toHaveTextContent('token-20');

  await act(async () => oldInit.resolve({ sg_id: 10 }));
  expect(autolabApi.getAttendance).not.toHaveBeenCalledWith(10);
  expect(screen.getByTestId('qr-code')).toHaveTextContent('token-20');
});

it('does not overlap slow attendance polls', async () => {
  jest.useFakeTimers();
  try {
    const slowPoll = deferred<any>();
    (autolabApi.initAttendance as jest.Mock).mockResolvedValue({ sg_id: 30 });
    (autolabApi.getAttendance as jest.Mock)
      .mockResolvedValueOnce({ sign_mode: 1, students: [] })
      .mockReturnValueOnce(slowPoll.promise)
      .mockResolvedValue({ sign_mode: 1, students: [] });
    const view = render(<QRFloat problemSetId="3" username="student" />);
    await act(async () => Promise.resolve());
    await act(async () => Promise.resolve());
    await act(async () => Promise.resolve());

    await act(async () => jest.advanceTimersByTime(8000));
    expect(autolabApi.getAttendance).toHaveBeenCalledTimes(2);
    await act(async () => jest.advanceTimersByTime(24000));
    expect(autolabApi.getAttendance).toHaveBeenCalledTimes(2);
    await act(async () => slowPoll.resolve({ sign_mode: 1, students: [] }));
    await act(async () => jest.advanceTimersByTime(8000));
    expect(autolabApi.getAttendance).toHaveBeenCalledTimes(3);
    view.unmount();
  } finally {
    jest.useRealTimers();
  }
});
