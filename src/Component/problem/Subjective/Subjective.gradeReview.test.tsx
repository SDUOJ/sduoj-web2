import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Subjective from './Subjective';

jest.mock('../../../Utils/MarkdownText', () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));
jest.mock('../../common/Editor', () => ({ __esModule: true, default: () => null }));

it.each([
  ['<AUTO>', true, true, true],
  ['teacher', true, true, false],
  ['<AUTO>', false, true, false],
  ['<AUTO>', true, false, false],
])(
  'shows student review entry only for finished auto grades (%s, %s, %s)',
  async (judgeLock, hasJudge, finish, visible) => {
    const getAS = jest.fn().mockResolvedValue({
      answer_m: ['answer'],
      judgeLock,
      hasJudge,
      judgeLog: [{ name: '评分项', score: 100, jScore: 80 }],
      judgeConfig: [{ name: '评分项', score: 100 }],
      gradeReview: { can_request: true, grade_version: 'grade-v7', status: 'none' },
    });
    render(
      <MemoryRouter>
        <Subjective
          problemInfo={{ type: 1 }}
          getAS={getAS}
          router={{ psid: 12, gid: 3, pid: 4 }}
          finish={finish}
        />
      </MemoryRouter>,
    );
    await screen.findByText('answer');
    if (visible) expect(await screen.findByRole('button', { name: '申请人工复核' })).toBeVisible();
    else expect(screen.queryByRole('button', { name: '申请人工复核' })).not.toBeInTheDocument();
  },
);
