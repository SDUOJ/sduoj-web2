import React from 'react';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { applyMiddleware, legacy_createStore as createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { MemoryRouter, Route } from 'react-router-dom';
import { rootReducers } from '../../Redux/Store/rootReducer';
import {
  activateExamAnswers,
  selectExamAnswerSheets,
  updateChoiceTodo,
} from '../../Redux/Action/exam';
import ExamOptions from '../problem/Exam/ExamOptions';
import ProTag from './ProTag';
import ExamOver from './ExamOver';
import eApi from '../../Utils/API/e-api';

jest.mock('../../Utils/API/e-api', () => ({
  __esModule: true,
  default: { setAnswerSheet: jest.fn(), ExamOver: jest.fn() },
}));
jest.mock('../../Utils/MarkdownText', () => ({ __esModule: true, default: () => null }));
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  withTranslation: () => (Component: any) => (props: any) => (
    <Component {...props} t={(key: string) => key} />
  ),
}));

function setup() {
  const store = createStore(rootReducers, undefined, applyMiddleware(thunk));
  store.dispatch(activateExamAnswers('1') as never);
  store.dispatch({
    type: 'setProLists',
    data: { '1_2': { type: 'SingleChoice', proList: [{ index: 0 }, { index: 1 }] } },
  } as never);
  store.dispatch({ type: 'setAnswerSheet', key: '1_2', data: [] } as never);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/v2/exam/running/1/2/0']}>
        <Route path="/v2/exam/running/:eid/:gid/:pid">
          <ExamOptions ChoiceID="A" ChoiceContent="Alpha" />
          <ProTag pid={1} gid={2} />
          <ExamOver />
        </Route>
      </MemoryRouter>
    </Provider>,
  );
  return store;
}
beforeEach(() => {
  jest.mocked(eApi.setAnswerSheet).mockReset();
  jest.mocked(eApi.ExamOver).mockReset();
});

it('allows another question while saving and prevents a full document navigation', async () => {
  let complete!: () => void;
  jest
    .mocked(eApi.setAnswerSheet)
    .mockReturnValueOnce(
      new Promise<void>((resolve) => {
        complete = resolve;
      }),
    )
    .mockResolvedValue(undefined);
  const store = setup();
  const option = document.querySelector('.Options-init')!;
  fireEvent.click(option);
  expect(option).toHaveClass('Options-used');
  await waitFor(() => expect(eApi.setAnswerSheet).toHaveBeenCalledTimes(1));
  const tag = screen.getByRole('link');
  expect(fireEvent.click(tag)).toBe(false);
  fireEvent.click(document.querySelector('.Options-init')!);
  expect(selectExamAnswerSheets(store.getState(), '1_2').map((s: any) => s.answer)).toEqual([
    ['A'],
    ['A'],
  ]);
  await act(async () => complete());
  await waitFor(() => expect(store.getState().ExamReducer.examAnswerDraftInfo).toEqual({}));
});

it('does not finalize the exam before queued answers finish saving', async () => {
  let complete!: () => void;
  jest.mocked(eApi.setAnswerSheet).mockReturnValueOnce(
    new Promise<void>((resolve) => {
      complete = resolve;
    }),
  );
  jest.mocked(eApi.ExamOver).mockResolvedValue(undefined);
  const store = setup();
  act(() => {
    store.dispatch(updateChoiceTodo('1_2', 0, 'A', 'yes') as never);
  });
  fireEvent.click(screen.getByRole('button', { name: 'SubmitPaper' }));
  fireEvent.click(await screen.findByRole('button', { name: 'ConfirmSubmitPaper' }));
  expect(eApi.ExamOver).not.toHaveBeenCalled();
  expect(document.querySelector('[aria-disabled="true"]')).toBeInTheDocument();
  await act(async () => complete());
  await waitFor(() => expect(eApi.ExamOver).toHaveBeenCalledWith({ examId: '1' }));
});

it('keeps the exam open when saving fails during final submission', async () => {
  jest.mocked(eApi.setAnswerSheet).mockRejectedValue(new Error('Offline'));
  const store = setup();
  await act(async () => {
    await expect(store.dispatch(updateChoiceTodo('1_2', 0, 'A', 'yes') as never)).rejects.toThrow(
      'Offline',
    );
  });
  fireEvent.click(screen.getByRole('button', { name: 'SubmitPaper' }));
  fireEvent.click(await screen.findByRole('button', { name: 'ConfirmSubmitPaper' }));
  await waitFor(() => expect(store.getState().ExamReducer.answerSubmitting).toBe(false));
  expect(eApi.ExamOver).not.toHaveBeenCalled();
  expect(selectExamAnswerSheets(store.getState(), '1_2')[0].answer).toEqual(['A']);
});
