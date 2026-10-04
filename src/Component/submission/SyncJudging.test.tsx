import { render } from '@testing-library/react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { SyncJudging } from './SyncJudging';
import { judgeMessages, JudgeMessage } from './judgeMessages';
import { message as notification } from 'antd';

jest.mock('react-use-websocket', () => ({
  __esModule: true,
  default: jest.fn(),
  ReadyState: { OPEN: 1, CLOSED: 3 },
}));
const message: JudgeMessage = ['abc', 3, 0, 1, 0, 1, 10, 2, 1024];

it('reports rejected frames once per subscriber and never forwards invalid data', () => {
  const error = jest.spyOn(notification, 'error').mockImplementation(() => (() => {}) as never);
  const handler = jest.fn();
  const sendMessage = jest.fn();
  let lastMessage = { data: '{broken' };
  jest
    .mocked(useWebSocket)
    .mockImplementation(() => ({ sendMessage, lastMessage, readyState: ReadyState.OPEN }) as never);
  const view = render(<SyncJudging open queryList={['abc']} dataHandle={handler} />);
  lastMessage = { data: '{}' };
  view.rerender(<SyncJudging open queryList={['abc']} dataHandle={handler} />);
  expect(handler).not.toHaveBeenCalled();
  expect(error).toHaveBeenCalledTimes(1);
});

it('handles live, wrapped and cumulative frames while ignoring malformed and obsolete records', () => {
  expect(judgeMessages(JSON.stringify(message))).toEqual([message]);
  expect(judgeMessages(JSON.stringify(JSON.stringify(message)))).toEqual([message]);
  expect(
    judgeMessages(
      JSON.stringify([[...message.slice(0, 1), 2, ...message.slice(2)], message, null]),
    ),
  ).toEqual([message]);
  expect(judgeMessages('{broken')).toEqual([]);
  expect(judgeMessages('{}')).toEqual([]);
});

it('resubscribes on reconnect without replaying a frame when the callback changes', () => {
  const sendMessage = jest.fn();
  const handler = jest.fn();
  let readyState = ReadyState.OPEN;
  const lastMessage = { data: JSON.stringify(message) };
  (useWebSocket as jest.Mock).mockImplementation(() => ({ sendMessage, lastMessage, readyState }));
  const queryList = ['abc'];
  const view = render(<SyncJudging open queryList={queryList} dataHandle={handler} />);
  expect(handler).toHaveBeenCalledWith(message);
  const replacement = jest.fn();
  view.rerender(<SyncJudging open queryList={queryList} dataHandle={replacement} />);
  expect(replacement).not.toHaveBeenCalled();
  readyState = ReadyState.CLOSED;
  view.rerender(<SyncJudging open queryList={queryList} dataHandle={replacement} />);
  readyState = ReadyState.OPEN;
  view.rerender(<SyncJudging open queryList={queryList} dataHandle={replacement} />);
  expect(sendMessage).toHaveBeenCalledTimes(2);
  expect(sendMessage).toHaveBeenLastCalledWith('["abc"]');
});

it('filters older versions in live frames too', () => {
  localStorage.setItem('submissionVersion:abc', '4');
  const handler = jest.fn();
  (useWebSocket as jest.Mock).mockReturnValue({
    sendMessage: jest.fn(),
    lastMessage: { data: JSON.stringify(message) },
    readyState: ReadyState.OPEN,
  });
  render(<SyncJudging open queryList={['abc']} dataHandle={handler} />);
  expect(handler).not.toHaveBeenCalled();
  localStorage.removeItem('submissionVersion:abc');
});

it('delivers nullable completion frames to every subscriber and ignores completed replay', () => {
  const end: JudgeMessage = ['abc', 3, null, -1, 0, 1, 100, 0, 1056];
  let lastMessage = { data: JSON.stringify(end) };
  (useWebSocket as jest.Mock).mockImplementation(() => ({
    sendMessage: jest.fn(),
    lastMessage,
    readyState: ReadyState.OPEN,
  }));
  const first = jest.fn(() => localStorage.setItem('submissionVersion:abc', '3'));
  const second = jest.fn();
  const ui = () => (
    <>
      <SyncJudging open queryList={['abc']} dataHandle={first} />
      <SyncJudging open queryList={['abc']} dataHandle={second} />
    </>
  );
  try {
    const view = render(ui());
    expect(first).toHaveBeenCalledWith(end);
    expect(second).toHaveBeenCalledWith(end);
    lastMessage = { data: JSON.stringify([message, end]) };
    view.rerender(ui());
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  } finally {
    localStorage.removeItem('submissionVersion:abc');
  }
});
