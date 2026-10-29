import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import cApi from '../../Utils/API/c-api';
import GradeReviewRequest from './GradeReviewRequest';
import { GradeReviewInfo } from './GradeReviewTags';

jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { requestGradeReview: jest.fn() },
}));

const router = { psid: 12, gid: 3, pid: 4 };
const eligible: GradeReviewInfo = { can_request: true, grade_version: 'grade-v7', status: 'none' };

it('sends the trimmed reason, answer-sheet router and current grade version once while pending', async () => {
  let resolve!: () => void;
  (cApi.requestGradeReview as jest.Mock).mockReturnValue(
    new Promise<void>((done) => (resolve = done)),
  );
  const onSubmitted = jest.fn().mockResolvedValue(undefined);
  render(<GradeReviewRequest review={eligible} router={router} onSubmitted={onSubmitted} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '申请人工复核' }));
  fireEvent.change(screen.getByLabelText('复核理由'), {
    target: { value: '  请核对第二项评分  ' },
  });
  const submit = screen.getByRole('button', { name: '提交申请' });
  await user.click(submit);
  await waitFor(() =>
    expect(cApi.requestGradeReview).toHaveBeenCalledWith({
      router,
      reason: '请核对第二项评分',
      grade_version: 'grade-v7',
    }),
  );
  fireEvent.click(submit);
  expect(cApi.requestGradeReview).toHaveBeenCalledTimes(1);
  expect(onSubmitted).not.toHaveBeenCalled();
  await act(async () => resolve());
  await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('refreshes server state after a stale-grade rejection and keeps the reason for correction', async () => {
  (cApi.requestGradeReview as jest.Mock).mockRejectedValue(new Error('grade version changed'));
  const onSubmitted = jest.fn().mockResolvedValue(undefined);
  render(<GradeReviewRequest review={eligible} router={router} onSubmitted={onSubmitted} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '申请人工复核' }));
  fireEvent.change(screen.getByLabelText('复核理由'), { target: { value: '请复核评分' } });
  await user.click(screen.getByRole('button', { name: '提交申请' }));
  await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
  expect(screen.getByLabelText('复核理由')).toHaveValue('请复核评分');
});

it.each(['   ', '字'.repeat(2001)])(
  'rejects an invalid reason before making a request',
  async (reason) => {
    render(<GradeReviewRequest review={eligible} router={router} onSubmitted={jest.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '申请人工复核' }));
    fireEvent.change(screen.getByLabelText('复核理由'), { target: { value: reason } });
    await user.click(screen.getByRole('button', { name: '提交申请' }));
    await waitFor(() =>
      expect(document.querySelector('.ant-form-item-explain-error')).toBeVisible(),
    );
    expect(cApi.requestGradeReview).not.toHaveBeenCalled();
  },
);

it('shows pending/resolved states and respects server eligibility', () => {
  const view = render(
    <GradeReviewRequest
      review={{ ...eligible, status: 'pending', reason: '第二项评分有疑问' }}
      router={router}
      onSubmitted={jest.fn()}
    />,
  );
  expect(screen.getByText('学生申请待复核')).toBeVisible();
  expect(screen.getByText('第二项评分有疑问')).toBeVisible();
  expect(screen.queryByRole('button', { name: '申请人工复核' })).not.toBeInTheDocument();
  view.rerender(
    <GradeReviewRequest
      review={{ can_request: false, status: 'resolved' }}
      router={router}
      onSubmitted={jest.fn()}
    />,
  );
  expect(screen.getByText('复核已处理')).toBeVisible();
  expect(screen.queryByRole('button', { name: '申请人工复核' })).not.toBeInTheDocument();
});

it('never submits without the current server grade version', async () => {
  render(
    <GradeReviewRequest
      review={{ can_request: true, status: 'none' }}
      router={router}
      onSubmitted={jest.fn()}
    />,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '申请人工复核' }));
  fireEvent.change(screen.getByLabelText('复核理由'), { target: { value: '请复核评分' } });
  await user.click(screen.getByRole('button', { name: '提交申请' }));
  await waitFor(() => expect(document.querySelector('.ant-form-item-has-success')).toBeTruthy());
  expect(cApi.requestGradeReview).not.toHaveBeenCalled();
});
