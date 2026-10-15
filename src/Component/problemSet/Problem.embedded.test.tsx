import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { MemoryRouter } from 'react-router-dom';
import { Problem } from './Problem';
import useProblemSetInfo from './API/getProblemSetInfo';
import useProblemInfo from '../problem/API/getProblemInfo';
import cApi from '../../Utils/API/c-api';

jest.mock('./API/getProblemSetInfo', () => jest.fn());
jest.mock('../problem/API/getProblemInfo', () => jest.fn());
jest.mock('../problem/Objective/Objective', () => (props: any) => (
  <button onClick={() => props.onAnswerM('B')}>native choice</button>
));
jest.mock('../problem/Subjective/Subjective', () => (props: any) => (
  <button onClick={() => props.onAnswerM(['native answer'])}>native subjective</button>
));
jest.mock('../problem/Program/ProProgram', () => (props: any) => (
  <button onClick={() => props.SubmitAPI('advanced', 'source', 'zip-file')}>
    native program submit
  </button>
));
jest.mock('../problem/Program/ProProgramDetail', () => () => null);
jest.mock('../submission/SubmissionList/RecentSubmissionList', () => () => null);
jest.mock('./ProblemSetPageCtrl', () => () => <div>old page navigation</div>);
jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { submitProblemSetProblem: jest.fn(), updateProblemSetProblemCollect: jest.fn() },
}));

it.each([
  [0, 'native choice', 'B'],
  [1, 'native subjective', ['native answer']],
  [
    2,
    'native program submit',
    { judgeTemplateId: 'advanced', code: 'source', zipFileId: 'zip-file', problemSetId: '9' },
  ],
])('keeps the original submission flow for embedded group type %s', async (type, button, data) => {
  const ps = {
    type: 0,
    tm_start: Date.now() - 1000,
    tm_end: Date.now() + 100000,
    config: {},
    groupInfo: [{ type, name: 'Group', problemInfo: [{ index: 0, type: 0, collect: 0 }] }],
  };
  jest.mocked(useProblemSetInfo).mockReturnValue(ps);
  jest.mocked(useProblemInfo).mockReturnValue({ description: 'Question', judgeTemplates: [] });
  jest.mocked(cApi.submitProblemSetProblem).mockResolvedValue('submission');
  const actions: any[] = [];
  const store = createStore((state = {}, action: any) => {
    actions.push(action);
    return state;
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Problem
          embedded
          username="alice"
          match={{ params: { problemSetId: '9', problemGroupId: '0', problemId: '0' } }}
          history={{ replace: jest.fn() }}
          t={(key: string) => key}
        />
      </MemoryRouter>
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: button as string }));
  await waitFor(() =>
    expect(cApi.submitProblemSetProblem).toHaveBeenCalledWith({
      router: { psid: '9', gid: '0', pid: '0' },
      data,
    }),
  );
  await waitFor(() =>
    expect(actions.some((action) => action.type === 'setProblemSetInfo')).toBe(true),
  );
  const updated = actions.find((action) => action.type === 'setProblemSetInfo').data;
  expect(Array.isArray(updated.groupInfo[0].problemInfo)).toBe(true);
  expect(updated.groupInfo[0].problemInfo).toHaveLength(1);
  expect(screen.queryByText('old page navigation')).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Online IDE/ })).not.toBeInTheDocument();
});
