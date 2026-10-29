import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createAppStore } from '../../Redux/Store';
import cApi from '../../Utils/API/c-api';
import { Review } from './Review';

jest.mock('./API/getProblemSetInfo', () => ({
  __esModule: true,
  default: () => ({ groupInfo: [] }),
}));
jest.mock('../subjectiveProblem/ScoreMode', () => ({
  __esModule: true,
  default: () => <div>Rubric</div>,
}));
jest.mock('./SubjectivePreview', () => ({ __esModule: true, default: () => null }));
jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { getJudgeList: jest.fn(), getJudgeInfo: jest.fn(), updateJudgeInfo: jest.fn() },
}));

const row = {
  username: 'student',
  nickname: 'Student',
  pid: 4,
  gid: 3,
  type: 1,
  hasJudge: true,
  score: 80,
  max_score: 100,
  gradeReview: { status: 'pending', reason: '请核对第二项' },
};

function setup(info: Record<string, unknown> = {}, rowOverrides: Record<string, unknown> = {}) {
  (cApi.getJudgeList as jest.Mock).mockResolvedValue({
    rows: [{ ...row, ...rowOverrides }],
    totalNum: 1,
  });
  (cApi.getJudgeInfo as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      username: 'student',
      judgeLock_username: '<AUTO>',
      judgeConfig: [{ name: '评分项', score: 100 }],
      judgeLog: [{ name: '评分项', score: 100, jScore: 80 }],
      gradeReview: {
        status: 'pending',
        reason: '请核对第二项',
        ai_needs_review: true,
        ai_reason: '第二项需要人工检查',
      },
      ...info,
    }),
  );
  (cApi.updateJudgeInfo as jest.Mock).mockResolvedValue(undefined);
  const addTableVersion = jest.fn();
  render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <Review
          match={{ params: { problemSetId: '12' } }}
          username="teacher"
          t={(key: string) => key}
          addTableVersion={addTableVersion}
        />
      </MemoryRouter>
    </Provider>,
  );
  return { user: userEvent.setup(), addTableVersion };
}

it('displays graded scores and review state, and forwards the review filter', async () => {
  const { user } = setup();
  expect(await screen.findByText('80 / 100')).toBeVisible();
  expect(screen.getByText('学生申请待复核')).toBeVisible();
  await user.click(screen.getByRole('combobox', { name: '复查' }));
  await user.click(
    screen.getByText('AI 建议人工复查', { selector: '.ant-select-item-option-content' }),
  );
  await waitFor(() =>
    expect(cApi.getJudgeList).toHaveBeenLastCalledWith(
      expect.objectContaining({ psid: 12, review_filter: 'ai', pageNow: 1 }),
    ),
  );
});

it.each([
  [true, '<AUTO>', 1, true],
  [false, 'teacher', 1, false],
  [undefined, 'teacher', 1, true],
  [undefined, 'other-teacher', 1, false],
  [true, '<AUTO>', 2, true],
  [false, 'teacher', 2, false],
])(
  'honors server edit authority with legacy fallback (%s, %s, type%s)',
  async (canEdit, judgeLock_username, type, editable) => {
    const { user } = setup({ canEdit, judgeLock_username, type });
    await user.click(await screen.findByRole('button', { name: 'StartGrading' }));
    const dialog = within(await screen.findByRole('dialog'));
    await waitFor(() =>
      expect(dialog.getByRole('button', { name: /^SubmitScores$/ })).toHaveProperty(
        'disabled',
        !editable,
      ),
    );
    await waitFor(() => expect(dialog.getByText('第二项需要人工检查')).toBeVisible());
    expect(dialog.getByText('请核对第二项')).toBeVisible();
  },
);

it('lets an authorized teacher replace the auto grade through the existing grading API', async () => {
  const { user, addTableVersion } = setup({ canEdit: true });
  await user.click(await screen.findByRole('button', { name: 'StartGrading' }));
  const dialog = within(await screen.findByRole('dialog'));
  await user.click(dialog.getByRole('button', { name: /^SubmitScores$/ }));
  await waitFor(() =>
    expect(cApi.updateJudgeInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        psid: 12,
        gid: 3,
        pid: 4,
        username: 'student',
        judgeLog: [{ name: '评分项', score: 100, jScore: 80 }],
      }),
    ),
  );
  expect(addTableVersion).toHaveBeenCalledWith('problemSetSubjectiveJudgeList');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

it('shows an already resolved review after a manual override without a pending warning', async () => {
  const resolved = { status: 'resolved', ai_needs_review: false };
  const { user } = setup(
    { canEdit: true, judgeLock_username: 'teacher', gradeReview: resolved },
    { gradeReview: resolved, score: 90 },
  );
  expect(await screen.findByText('90 / 100')).toBeVisible();
  expect(screen.getByText('复核已处理')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'StartGrading' }));
  const dialog = within(await screen.findByRole('dialog'));
  await waitFor(() => expect(dialog.getByText('复核已处理')).toBeVisible());
  expect(dialog.queryByText('学生申请人工复核')).not.toBeInTheDocument();
  expect(dialog.queryByText('AI 建议人工复查')).not.toBeInTheDocument();
});
