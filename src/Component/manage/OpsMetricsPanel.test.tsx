import { act, render, screen, waitFor } from '@testing-library/react';
import OpsMetricsPanel from './OpsMetricsPanel';
import mApi from '../../Utils/API/m-api';
import i18n from '../../Config/i18n';
import type { OpsMetrics } from '../../Type/globalSubmissions';
jest.mock('../../Utils/API/m-api', () => ({
  __esModule: true,
  default: { opsMetrics: jest.fn() },
}));
const sample: OpsMetrics = {
  timestamp: 1791973800000,
  judgerOnline: 2,
  queueDepth: '7',
  throughputPerMin: 4.2,
  avgWaitMs: 950,
  p95WaitMs: '1800',
  waitSampleCount: 20,
  metricsAvailable: true,
  queueSource: 'rabbit-ready-unacked',
  windowMinutes: 5,
  series: [
    { timestamp: 1791973680000, completed: '1', queueDepth: '3' },
    { timestamp: 1791973740000, completed: '20', queueDepth: null },
    { timestamp: 1791973800000, completed: '0', queueDepth: '7' },
  ],
};
beforeEach(async () => {
  await i18n.changeLanguage('en');
  jest.mocked(mApi.opsMetrics).mockReset();
});
afterEach(() => jest.useRealTimers());
it('shows real readings, accessible trends and leaves missing queue samples as gaps', async () => {
  jest.mocked(mApi.opsMetrics).mockResolvedValue(sample);
  render(<OpsMetricsPanel auto={false} revision={0} />);
  await waitFor(() =>
    expect(screen.getByText('Average wait (ms)').closest('.ant-statistic')).toHaveTextContent(
      '950.0',
    ),
  );
  expect(screen.getByText('1800')).toBeVisible();
  expect(screen.getByText('Completions / min').closest('.ant-statistic')).toHaveTextContent('4.2');
  const chart = screen.getByRole('img', { name: 'Queued + in progress per minute' });
  expect(chart.querySelectorAll('circle')).toHaveLength(2);
  expect(chart.querySelectorAll('path')[1].getAttribute('d')?.match(/M/g)).toHaveLength(2);
  expect(
    screen.getByRole('img', { name: 'Completions per minute' }).querySelectorAll('circle'),
  ).toHaveLength(3);
});
it('does not invent readings when metric sources are unavailable', async () => {
  jest.mocked(mApi.opsMetrics).mockResolvedValue({
    ...sample,
    judgerOnline: null,
    queueDepth: null,
    metricsAvailable: false,
  });
  render(<OpsMetricsPanel auto={false} revision={0} />);
  await screen.findByText('Waiting for available metric readings.');
  expect(screen.getAllByText('Unavailable')).toHaveLength(5);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
it('serializes polling, backs off failures, keeps previous readings and cancels on unmount', async () => {
  jest.useFakeTimers();
  let finish!: (value: OpsMetrics) => void;
  jest
    .mocked(mApi.opsMetrics)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue(sample);
  const view = render(<OpsMetricsPanel auto revision={0} />);
  await act(async () => {
    jest.advanceTimersByTime(30000);
  });
  expect(mApi.opsMetrics).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish(sample);
  });
  await act(async () => {
    jest.advanceTimersByTime(10000);
  });
  expect(
    screen.getByText('Metrics refresh failed. Previous readings remain visible.'),
  ).toBeVisible();
  expect(screen.getByText('Average wait (ms)').closest('.ant-statistic')).toHaveTextContent(
    '950.0',
  );
  await act(async () => {
    jest.advanceTimersByTime(19999);
  });
  expect(mApi.opsMetrics).toHaveBeenCalledTimes(2);
  await act(async () => {
    jest.advanceTimersByTime(1);
  });
  expect(mApi.opsMetrics).toHaveBeenCalledTimes(3);
  const signal = jest.mocked(mApi.opsMetrics).mock.calls[2][0]!;
  view.unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => {
    jest.advanceTimersByTime(60000);
  });
  expect(mApi.opsMetrics).toHaveBeenCalledTimes(3);
});
