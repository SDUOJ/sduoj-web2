import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { rootReducers } from '../../Redux/Store/rootReducer';
import { ExamPageCtrl } from './ExamPageCtrl';

function setup(problemCount?: number) {
  const store = createStore(rootReducers);
  if (problemCount !== undefined) {
    store.dispatch({
      type: 'setProLists',
      data: { '9_2': { proList: Array.from({ length: problemCount }, (_, index) => ({ index })) } },
    } as never);
  }
  const history = { push: jest.fn() };
  return { store, history };
}

function renderControl(
  store: ReturnType<typeof createStore>,
  history: { push: jest.Mock },
  pid: number,
) {
  return render(
    <Provider store={store}>
      <ExamPageCtrl
        match={{ params: { eid: '9', gid: '2', pid: String(pid) } }}
        history={history}
        t={(key: string) => key}
      />
    </Provider>,
  );
}

it('disables the first/last controls and navigates within an exam group', () => {
  const { store, history } = setup(2);
  const view = renderControl(store, history, 0);
  const previous = screen.getByRole('button', { name: /PreviousProblem/ });
  const next = screen.getByRole('button', { name: /NextProblem/ });

  expect(previous).toBeDisabled();
  expect(next).not.toBeDisabled();
  next.click();
  expect(history.push).toHaveBeenCalledWith('/v2/exam/running/9/2/1');

  view.rerender(
    <Provider store={store}>
      <ExamPageCtrl
        match={{ params: { eid: '9', gid: '2', pid: '1' } }}
        history={history}
        t={(key: string) => key}
      />
    </Provider>,
  );
  expect(screen.getByRole('button', { name: /NextProblem/ })).toBeDisabled();
  screen.getByRole('button', { name: /PreviousProblem/ }).click();
  expect(history.push).toHaveBeenLastCalledWith('/v2/exam/running/9/2/0');
});

it('disables both controls while the problem list is loading', () => {
  const { store, history } = setup();
  renderControl(store, history, 0);

  expect(screen.getByRole('button', { name: /PreviousProblem/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /NextProblem/ })).toBeDisabled();
  expect(
    screen.getByText((_, element) => element?.className === 'ExamPageCtrl-Number'),
  ).toBeInTheDocument();
});
