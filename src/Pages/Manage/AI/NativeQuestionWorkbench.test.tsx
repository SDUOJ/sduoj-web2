import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NativeQuestionWorkbench from './NativeQuestionWorkbench';
import request from '../../../Utils/API/request';
import i18n from '../../../Config/i18n';
jest.mock('../../../Utils/API/request', () => ({ __esModule: true, default: { post: jest.fn() } }));
jest.mock('./AITaskMonitor', () => () => null);
jest.mock('./operation-key', () => ({ operationKey: () => 'batch-test' }));

beforeEach(async () => {
  await i18n.changeLanguage('zh');
  jest.clearAllMocks();
});

test('saves directly to native groups and retries with the same operation key', async () => {
  (request.post as jest.Mock)
    .mockRejectedValueOnce('网络断开')
    .mockResolvedValue({ groups: [{ gid: 9, name: '录入批次 · 主观题', type: 1 }] });
  const saved = jest.fn();
  render(<NativeQuestionWorkbench onSaved={saved} />);
  fireEvent.change(screen.getByLabelText('题目内容'), { target: { value: '什么是队列？' } });
  fireEvent.change(screen.getByLabelText('参考答案'), { target: { value: '先进先出' } });
  fireEvent.click(screen.getByRole('button', { name: '保存到题组' }));
  expect(await screen.findByText('网络断开')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '保存到题组' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect((request.post as jest.Mock).mock.calls[0]).toEqual(
    (request.post as jest.Mock).mock.calls[1],
  );
  expect(request.post).toHaveBeenCalledWith(
    '/ps/question-bank/batches',
    expect.objectContaining({
      operation_key: 'batch-test',
      questions: [expect.objectContaining({ zh: '什么是队列？', answer: '先进先出' })],
    }),
  );
  expect(screen.queryByRole('button', { name: '录入 OJ' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '导入 OJ' })).not.toBeInTheDocument();
});

test('does not submit empty native questions', async () => {
  render(<NativeQuestionWorkbench />);
  fireEvent.click(screen.getByRole('button', { name: '保存到题组' }));
  await waitFor(() => expect(document.querySelector('.ant-form-item-has-error')).not.toBeNull());
  expect(request.post).not.toHaveBeenCalled();
});
