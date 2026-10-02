import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import IntelligentManagement from './IntelligentManagement';
import { managementAgent } from '../../../Utils/API/management-agent';
jest.mock('../../../Utils/API/management-agent', () => ({
  managementAgent: {
    list: jest.fn(),
    presets: jest.fn(),
    detail: jest.fn(),
    create: jest.fn(),
    message: jest.fn(),
    decide: jest.fn(),
    stop: jest.fn(),
  },
}));
const action = {
  id: 'a1',
  hash: 'h'.repeat(64),
  status: 'pending',
  action: {
    method: 'POST',
    path: '/manage/contest/update',
    arguments: { contestId: 432 },
    reason: '修正比赛配置',
  },
};
const session = {
  id: 's1',
  title: '比赛维护',
  state: 'approval',
  updated_at: '2026-09-13T12:00:00',
  instructions: '先检查，再逐项确认',
  events: [],
  actions: [action],
  plan: [],
};
beforeEach(() => {
  jest.clearAllMocks();
  (managementAgent.list as jest.Mock).mockResolvedValue([session]);
  (managementAgent.presets as jest.Mock).mockResolvedValue([
    { id: 'programming', title: '程序题命题', instructions: '先明确题意' },
  ]);
  (managementAgent.detail as jest.Mock).mockResolvedValue(session);
  (managementAgent.decide as jest.Mock).mockResolvedValue({ success: true });
});
it('never executes a pending operation until the separate confirmation is accepted', async () => {
  render(<IntelligentManagement />);
  fireEvent.click(await screen.findByRole('button', { name: '继续会话' }));
  fireEvent.click(await screen.findByRole('button', { name: '审阅并确认' }));
  expect(managementAgent.decide).not.toHaveBeenCalled();
  const dialog = screen.getByRole('dialog', { name: '确认执行本次操作' });
  await waitFor(() => expect(within(dialog).getByText(/432/)).toBeVisible());
  fireEvent.click(within(dialog).getByRole('button', { name: '确认执行' }));
  await waitFor(() => expect(managementAgent.decide).toHaveBeenCalledWith('s1', action, true));
});
it('allows refusal without executing or approving the operation', async () => {
  render(<IntelligentManagement />);
  fireEvent.click(await screen.findByRole('button', { name: '继续会话' }));
  fireEvent.click(await screen.findByRole('button', { name: /拒\s*绝/ }));
  await waitFor(() => expect(managementAgent.decide).toHaveBeenCalledWith('s1', action, false));
});
