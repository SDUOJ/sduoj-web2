import { act, renderHook, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import { service } from '../../Utils/API/request';
import { useRunTask } from './useRunTask';

jest.mock('antd', () => ({ message: { error: jest.fn() } }));
const adapter = new MockAdapter(service);
const success = (data: unknown) => ({ code: 0, data, timestamp: Date.now() });
afterEach(() => adapter.reset());
afterAll(() => adapter.restore());

it.each([404, 410])('recovers through the actual API adapter after HTTP %s', async (status) => {
  localStorage.setItem('answerIde:active:alice:P', 'abc');
  adapter.onGet('/run/query', { params: { submissionId: 'abc' } }).reply(status, {
    code: status,
    message: 'Task unavailable',
  });
  const view = renderHook(() => useRunTask('alice:P'));
  await waitFor(() => expect(view.result.current.busy).toBe(false));
  expect(view.result.current.id).toBeUndefined();
  expect(localStorage.getItem('answerIde:active:alice:P')).toBeNull();
  adapter.onPost('/run/cases').reply(200, success('def'));
  adapter.onGet('/run/query', { params: { submissionId: 'def' } }).reply(
    200,
    success({
      submissionId: 'def',
      judgeResult: -1,
    }),
  );
  await act(async () => {
    await view.result.current.start({
      problemCode: 'P',
      judgeTemplateId: '6',
      code: 'code',
      cases: [{ input: '' }],
    });
  });
  await waitFor(() => expect(view.result.current.detail?.submissionId).toBe('def'));
  expect(adapter.history.post.filter((request) => request.url === '/run/cases')).toHaveLength(1);
  expect(view.result.current.busy).toBe(false);
  view.unmount();
});
