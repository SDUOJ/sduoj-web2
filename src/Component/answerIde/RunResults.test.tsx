import { render, screen, within } from '@testing-library/react';
import i18n from '../../Config/i18n';
import RunResults from './RunResults';

beforeEach(async () => {
  await i18n.changeLanguage('zh');
});

it('shows compiler output without unexecuted case details or runtime metrics', () => {
  render(
    <RunResults
      detail={{
        submissionId: 'ce',
        judgeResult: 8,
        judgeLog: 'main.cc:5: error: cout',
        run: { mode: 'cases', cases: [{ index: 0, input: 'secret input' }] },
      }}
    />,
  );
  expect(screen.getByRole('region', { name: '编译日志' })).toHaveTextContent('main.cc:5: error');
  expect(screen.queryByText('secret input')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /用例 1/ })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('统计')).not.toBeInTheDocument();
});

it('shows time, memory, and exit code as persistent tags with placeholders for missing values', () => {
  const page = render(
    <RunResults
      detail={{
        submissionId: 'run',
        judgeResult: -1,
        run: {
          mode: 'cases',
          cases: [
            { index: 0, input: '', judgeResult: -1, usedTime: 0, usedMemory: 1024, exitCode: 0 },
          ],
        },
      }}
    />,
  );
  const metrics = screen.getByLabelText('统计');
  expect(metrics.querySelectorAll('.ant-tag')).toHaveLength(3);
  expect(metrics).toHaveTextContent('0 ms');
  expect(metrics).toHaveTextContent('1024 KB');
  expect(metrics).toHaveTextContent('退出码 0');
  page.rerender(
    <RunResults
      detail={{
        submissionId: 'run',
        judgeResult: -1,
        run: { mode: 'cases', cases: [{ index: 0, input: '', judgeResult: -1 }] },
      }}
    />,
  );
  expect(within(metrics).getByText(/— ms/)).toBeInTheDocument();
  expect(within(metrics).getByText(/— KB/)).toBeInTheDocument();
});
