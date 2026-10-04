import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProblemSetPageCtrl } from './ProblemSetPageCtrl';
import useProblemSetInfo from './API/getProblemSetInfo';

jest.mock('./API/getProblemSetInfo', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const getInfo = jest.mocked(useProblemSetInfo);

function renderControl(history: { push: jest.Mock }, gid: number, pid: number) {
  return render(
    <ProblemSetPageCtrl
      match={{ params: { problemSetId: '7', problemGroupId: String(gid), problemId: String(pid) } }}
      history={history}
      t={(key: string) => key}
    />,
  );
}

beforeEach(() => {
  getInfo.mockReturnValue({
    groupInfo: [{ problemInfo: [{}, {}] }, { problemInfo: [{}] }],
  } as never);
});

it('navigates within a group and across group boundaries', () => {
  const history = { push: jest.fn() };
  const view = renderControl(history, 0, 0);

  expect(screen.getByRole('button', { name: /PreviousProblem/ })).toBeDisabled();
  screen.getByRole('button', { name: /NextProblem/ }).click();
  expect(history.push).toHaveBeenCalledWith('/v2/problemSet/7/problem/0/1');

  view.rerender(
    <ProblemSetPageCtrl
      match={{ params: { problemSetId: '7', problemGroupId: '0', problemId: '1' } }}
      history={history}
      t={(key: string) => key}
    />,
  );
  screen.getByRole('button', { name: /NextProblem/ }).click();
  expect(history.push).toHaveBeenLastCalledWith('/v2/problemSet/7/problem/1/0');
  screen.getByRole('button', { name: /PreviousProblem/ }).click();
  expect(history.push).toHaveBeenLastCalledWith('/v2/problemSet/7/problem/0/0');
});

it('disables navigation at the last problem in the last group', () => {
  const history = { push: jest.fn() };
  renderControl(history, 1, 0);

  expect(screen.getByRole('button', { name: /NextProblem/ })).toBeDisabled();
  expect(document.querySelector('.ExamPageCtrl-Number')).toHaveTextContent('1');
});
