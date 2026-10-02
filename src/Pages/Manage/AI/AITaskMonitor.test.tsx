import React from 'react';
import { render, screen } from '@testing-library/react';
import AITaskMonitor from './AITaskMonitor';
import { aiPlatform, PlatformJob } from '../../../Utils/API/ai-platform';

jest.mock('../../../Utils/API/ai-platform', () => ({
  aiPlatform: {
    job: jest.fn(),
    cancel: jest.fn(),
    retry: jest.fn(),
  },
}));

const job: PlatformJob = {
  id: 'job-1',
  task_type: 'subjective.grade',
  status: 'success',
  attempt: 1,
  max_attempts: 3,
  review_required: true,
  ai_runs: [
    {
      id: 'run-1',
      model: 'test-model',
      usage: {},
      cost_usd: '0',
      status: 'unsettled',
    },
  ],
  events: [{ id: 1, tag: 'result', content: { ok: true } }],
};

test('shows terminal review warning and unknown usage without opening an event stream', async () => {
  const jobMock = aiPlatform.job as jest.MockedFunction<typeof aiPlatform.job>;
  jobMock.mockResolvedValue(job);
  const originalEventSource = global.EventSource;
  // jsdom may expose EventSource through a polyfill; disabling it verifies polling-safe rendering.
  Object.defineProperty(global, 'EventSource', { configurable: true, value: undefined });
  const { unmount } = render(<AITaskMonitor taskId="job-1" />);
  expect(await screen.findByText('结果待人工复核')).toBeInTheDocument();
  expect(screen.getByText('未知，待对账')).toBeInTheDocument();
  expect(screen.queryByText('事件内容无法显示')).not.toBeInTheDocument();
  expect(screen.getByText('{"ok":true}')).toBeInTheDocument();
  expect(jobMock).toHaveBeenCalledWith('job-1', 0);
  unmount();
  Object.defineProperty(global, 'EventSource', { configurable: true, value: originalEventSource });
});
