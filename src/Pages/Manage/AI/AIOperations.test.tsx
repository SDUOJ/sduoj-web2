import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AIOperations from './AIOperations';
import { aiPlatform } from '../../../Utils/API/ai-platform';
import i18n from '../../../Config/i18n';
jest.mock('../../../Utils/API/ai-platform', () => ({ aiPlatform: { jobs: jest.fn() } }));
jest.mock('./AITaskMonitor', () => ({
  __esModule: true,
  default: ({ taskId }: { taskId: string }) => <div>Task {taskId}</div>,
}));
it('shows task history without any IDE or code editor entry', async () => {
  await i18n.changeLanguage('zh');
  (aiPlatform.jobs as jest.Mock).mockResolvedValue({
    rows: [{ id: 'job1', task_type: 'question.solve', status: 'success', attempt: 1 }],
    totalNum: 1,
  });
  render(<AIOperations location={{ search: '?psid=12&tab=ide' }} />);
  expect(await screen.findByText('job1')).toBeVisible();
  expect(screen.queryByText(/IDE|代码练习|运行代码/)).not.toBeInTheDocument();
  await waitFor(() => expect(aiPlatform.jobs).toHaveBeenCalledWith(1, undefined, 12));
  fireEvent.click(screen.getByRole('button', { name: '查看' }));
  expect(screen.getByText('Task job1')).toBeVisible();
});
