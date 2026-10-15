import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { MemoryRouter, Route } from 'react-router-dom';
import CContextProblemIde from './CContextProblemIde';
import cApi from '../../Utils/API/c-api';
import i18n from '../../Config/i18n';
const info = {
  problemTitle: 'Scoped problem',
  problemCode: 'LIBRARY-42',
  judgeTemplates: [{ id: '6', type: 0 }],
};
jest.mock('../../Component/problem/API/getProblemInfo', () => () => info);
jest.mock('../../Component/problem/Program/ProProgram', () => (props: any) => (
  <div>
    {props.headerBefore(null)}
    {!props.hideSubmit && (
      <button onClick={() => props.SubmitAPI('advanced', 'legacy source', 'zip-file')}>
        original submit
      </button>
    )}
  </div>
));
jest.mock('../../Component/submission/SubmissionList/RecentSubmissionList', () => () => (
  <div>records</div>
));
jest.mock('../../Component/problemSet/Problem', () => (props: any) => (
  <div data-testid="original-problem" data-embedded={props.embedded}>
    Original answer form
  </div>
));
jest.mock('../../Component/answerIde/AnswerLayout', () => (props: any) => (
  <>
    {props.statement}
    {props.workspace}
  </>
));
jest.mock('../../Component/answerIde/AnswerWorkspace', () => (props: any) => (
  <>
    <div data-testid="context">{JSON.stringify(props.context)}</div>
    <button onClick={() => void props.submitCode('6', 'scoped source').catch(() => undefined)}>
      submit scoped
    </button>
  </>
));
jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: {
    submitContestProblem: jest.fn(),
    getContestInfo: jest.fn(),
    submitProblemSetProblem: jest.fn(),
    getProblemSetSubmissionList: jest.fn(async () => ({ totalNum: '0' })),
    getProblemSetInfo: jest.fn(async () => ({ type: 0, config: { useSameSE: 1 } })),
  },
}));
beforeEach(async () => {
  jest.clearAllMocks();
  delete (info as any).submitNum;
  info.judgeTemplates = [{ id: '6', type: 0 }];
  jest.mocked(cApi.getContestInfo).mockResolvedValue({
    contestTitle: 'Contest 77',
    problems: [
      { problemCode: '1', problemTitle: 'First contest problem' },
      { problemCode: '2', problemTitle: 'Second contest problem' },
    ],
  } as any);
  jest.mocked(cApi.getProblemSetInfo).mockResolvedValue({
    type: 0,
    config: { useSameSE: 1 },
    groupInfo: [
      {
        name: 'Choice',
        type: 0,
        problemInfo: [
          { index: 9, name: 'Shuffled choice' },
          { index: 4, name: 'Other choice' },
        ],
      },
      {
        name: 'Program',
        type: 2,
        problemInfo: Array.from({ length: 4 }, (_, index) => ({ name: `Program ${index + 1}` })),
      },
      { name: 'Subjective', type: 1, problemInfo: [{ name: 'Written answer' }] },
    ],
  } as any);
  await i18n.changeLanguage('zh');
});
function mount(path: string, pattern: string) {
  const store = createStore(() => ({ UserReducer: { userInfo: { username: 'alice' } } }));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Route path={pattern}>
          <CContextProblemIde />
        </Route>
      </MemoryRouter>
    </Provider>,
  );
}
it('keeps contest slot identifiers in its IDE and formal submission', async () => {
  mount('/v2/contest/77/problem/2/ide', '/v2/contest/:contestId/problem/:problemCode/ide');
  expect(JSON.parse((await screen.findByTestId('context')).textContent!)).toEqual({
    type: 1,
    bizId: '77',
    problemCode: '2',
  });
  fireEvent.click(screen.getByRole('button', { name: 'submit scoped' }));
  await waitFor(() =>
    expect(cApi.submitContestProblem).toHaveBeenCalledWith({
      contestId: '77',
      problemCode: '2',
      judgeTemplateId: '6',
      code: 'scoped source',
      zipFileId: undefined,
    }),
  );
  expect(cApi.submitProblemSetProblem).not.toHaveBeenCalled();
  expect(screen.getByRole('link', { name: '返回普通模式' })).toHaveAttribute(
    'href',
    '/v2/contest/77/problem/2',
  );
});
it('keeps the complete problem-set route and uses its answer-sheet submission API', async () => {
  mount(
    '/v2/problemSet/99/problem/1/3/ide',
    '/v2/problemSet/:problemSetId/problem/:problemGroupId/:problemId/ide',
  );
  expect(JSON.parse((await screen.findByTestId('context')).textContent!)).toEqual({
    type: 2,
    bizId: '99',
    groupIndex: 1,
    problemIndex: 3,
  });
  fireEvent.click(screen.getByRole('button', { name: 'submit scoped' }));
  await waitFor(() =>
    expect(cApi.submitProblemSetProblem).toHaveBeenCalledWith({
      router: { psid: '99', gid: '1', pid: '3' },
      data: {
        judgeTemplateId: '6',
        code: 'scoped source',
        zipFileId: undefined,
        problemSetId: '99',
      },
    }),
  );
  expect(cApi.submitContestProblem).not.toHaveBeenCalled();
});

it('rechecks the native formal-submission limit before submitting from the IDE', async () => {
  (info as any).submitNum = 1;
  jest
    .mocked(cApi.getProblemSetSubmissionList)
    .mockResolvedValueOnce({ totalNum: '0' } as any)
    .mockResolvedValueOnce({ totalNum: '1' } as any);
  mount(
    '/v2/problemSet/99/problem/1/3/ide',
    '/v2/problemSet/:problemSetId/problem/:problemGroupId/:problemId/ide',
  );
  await waitFor(() => expect(cApi.getProblemSetSubmissionList).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button', { name: 'submit scoped' }));
  await waitFor(() => expect(cApi.getProblemSetSubmissionList).toHaveBeenCalledTimes(2));
  expect(cApi.submitProblemSetProblem).not.toHaveBeenCalled();
});

it('applies problem-set browser guards in the IDE and removes them when leaving', async () => {
  const page = mount(
    '/v2/problemSet/99/problem/1/3/ide',
    '/v2/problemSet/:problemSetId/problem/:problemGroupId/:problemId/ide',
  );
  expect(document.querySelector('.problem-set-ide')).toHaveStyle({ userSelect: 'none' });
  expect(fireEvent.contextMenu(document.body)).toBe(false);
  expect(fireEvent.keyDown(window, { key: 'F12' })).toBe(false);
  page.unmount();
  expect(fireEvent.contextMenu(document.body)).toBe(true);
  expect(fireEvent.keyDown(window, { key: 'F12' })).toBe(true);
});

it('keeps problem-set guards scoped away from contest pages', async () => {
  mount('/v2/contest/77/problem/2/ide', '/v2/contest/:contestId/problem/:problemCode/ide');
  expect(document.querySelector('.problem-set-ide')).not.toBeInTheDocument();
  expect(fireEvent.contextMenu(document.body)).toBe(true);
  expect(fireEvent.keyDown(window, { key: 'F12' })).toBe(true);
});

it('switches contest problems through the vertical menu while retaining contest submission identifiers', async () => {
  mount('/v2/contest/77/problem/2/ide', '/v2/contest/:contestId/problem/:problemCode/ide');
  const second = await screen.findByRole('link', { name: 'B. Second contest problem' });
  expect(second).toHaveAttribute('aria-current', 'page');
  const first = screen.getByRole('link', { name: 'A. First contest problem' });
  expect(first).toHaveAttribute('href', '/v2/contest/77/problem/1/ide');
  fireEvent.click(first);
  await waitFor(() =>
    expect(JSON.parse(screen.getByTestId('context').textContent!).problemCode).toBe('1'),
  );
  expect(first).toHaveAttribute('aria-current', 'page');
  expect(cApi.getContestInfo).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'submit scoped' }));
  await waitFor(() =>
    expect(cApi.submitContestProblem).toHaveBeenCalledWith(
      expect.objectContaining({ contestId: '77', problemCode: '1' }),
    ),
  );
});

it('keeps all problem-set questions in the menu and switches objective/subjective questions to their original forms', async () => {
  mount(
    '/v2/problemSet/99/problem/1/3/ide',
    '/v2/problemSet/:problemSetId/problem/:problemGroupId/:problemId/ide',
  );
  await screen.findByTestId('context');
  const choice = screen.getByRole('link', { name: '1. Shuffled choice' });
  expect(choice).toHaveAttribute('href', '/v2/problemSet/99/problem/0/0/ide');
  const otherChoice = screen.getByRole('link', { name: '2. Other choice' });
  expect(otherChoice).toHaveAttribute('href', '/v2/problemSet/99/problem/0/1/ide');
  fireEvent.click(choice);
  expect(await screen.findByTestId('original-problem')).toHaveAttribute('data-embedded', 'true');
  expect(screen.queryByTestId('context')).not.toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: '题目导航' })).toBeVisible();
  fireEvent.click(screen.getByRole('link', { name: '1. Written answer' }));
  expect(await screen.findByTestId('original-problem')).toBeVisible();
  expect(screen.queryByTestId('context')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: '1. Program 1' }));
  await waitFor(() =>
    expect(JSON.parse(screen.getByTestId('context').textContent!)).toEqual({
      type: 2,
      bizId: '99',
      groupIndex: 1,
      problemIndex: 0,
    }),
  );
});

it.each([[{ id: 'advanced', type: 2 }], [{ id: 'zip', type: 0, acceptFileExtensions: ['.zip'] }]])(
  'uses the existing contest submit form for unsupported templates %j',
  async (templates) => {
    info.judgeTemplates = [templates] as any;
    mount('/v2/contest/77/problem/2/ide', '/v2/contest/:contestId/problem/:problemCode/ide');
    expect(screen.queryByTestId('context')).not.toBeInTheDocument();
    expect(await screen.findByRole('navigation', { name: '题目导航' })).toBeVisible();
    expect(document.querySelector('.context-ide-original')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'original submit' }));
    await waitFor(() =>
      expect(cApi.submitContestProblem).toHaveBeenCalledWith({
        contestId: '77',
        problemCode: '2',
        judgeTemplateId: 'advanced',
        code: 'legacy source',
        zipFileId: 'zip-file',
      }),
    );
  },
);

it('keeps special problem-set programs on their original submit form', async () => {
  info.judgeTemplates = [{ id: 'advanced', type: 2 }];
  mount(
    '/v2/problemSet/99/problem/1/3/ide',
    '/v2/problemSet/:problemSetId/problem/:problemGroupId/:problemId/ide',
  );
  expect(await screen.findByTestId('original-problem')).toBeVisible();
  expect(screen.queryByTestId('context')).not.toBeInTheDocument();
});
