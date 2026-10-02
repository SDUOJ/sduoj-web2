import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AIAdminAccess, { AITagManagement } from './AIAdminAccess';
import request from '../../../Utils/API/request';
jest.mock('../../../Utils/API/request', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
beforeEach(() => jest.clearAllMocks());
test('explicit account hold preserves reason and stable operation key', async () => {
  (request.get as jest.Mock).mockResolvedValue({
    rows: [{ subject_id: '42', username: 'student', status: 'active', balance: '0' }],
    totalNum: 1,
  });
  (request.post as jest.Mock).mockResolvedValue({ status: 'suspended' });
  render(<AIAdminAccess />);
  fireEvent.click(await screen.findByRole('button', { name: '管理资格' }));
  const dialog = await screen.findByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('操作依据'), {
    target: { value: 'Teacher requested review' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: /OK|确s*定/ }));
  await waitFor(() =>
    expect(request.post).toHaveBeenCalledWith(
      '/ps/auto-task/ai/admin/accounts/access',
      expect.objectContaining({
        subject_id: '42',
        suspended: true,
        reason: 'Teacher requested review',
        operation_key: expect.any(String),
      }),
    ),
  );
});
test('edits canonical tag aliases through the native tag endpoint', async () => {
  (request.get as jest.Mock).mockResolvedValue([{ id: 'tag', name: '动态规划', aliases: ['DP'] }]);
  (request.post as jest.Mock).mockResolvedValue({});
  render(<AITagManagement />);
  fireEvent.click(await screen.findByRole('button', { name: '编辑别名' }));
  expect(screen.getByLabelText('规范标签名称')).toHaveValue('动态规划');
  fireEvent.click(screen.getByRole('button', { name: '保存标签' }));
  await waitFor(() =>
    expect(request.post).toHaveBeenCalledWith(
      '/ps/auto-task/ai/tags/upsert',
      expect.objectContaining({ name: '动态规划', aliases: ['DP'] }),
    ),
  );
});
