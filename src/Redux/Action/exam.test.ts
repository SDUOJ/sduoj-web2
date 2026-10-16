import { applyMiddleware, legacy_createStore as createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { rootReducers } from '../Store/rootReducer';
import {
  activateExamAnswers,
  flushExamAnswers,
  retryExamAnswers,
  selectExamAnswerSheets,
  updateChoiceTodo,
  updateFlagTodo,
} from './exam';
import eApi from '../../Utils/API/e-api';

jest.mock('../../Utils/API/e-api', () => ({
  __esModule: true,
  default: { setAnswerSheet: jest.fn() },
}));

const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const tick = () => Promise.resolve();

function setup(type = 'SingleChoice') {
  const store = createStore(rootReducers, undefined, applyMiddleware(thunk));
  store.dispatch(activateExamAnswers('1') as never);
  load(store, '1_2', type);
  return store;
}
function load(store: ReturnType<typeof setup>, key: string, type = 'SingleChoice') {
  store.dispatch({
    type: 'setProLists',
    data: { [key]: { type, proList: [{ index: 0 }, { index: 1 }] } },
  } as never);
  store.dispatch({ type: 'setAnswerSheet', key, data: [] } as never);
}
const answer = (store: ReturnType<typeof setup>, index = 0, key = '1_2') =>
  selectExamAnswerSheets(store.getState(), key)?.[index];

beforeEach(() => jest.mocked(eApi.setAnswerSheet).mockReset());

it('shows a draft immediately and commits only after the server accepts it', async () => {
  const store = setup();
  const request = deferred();
  jest.mocked(eApi.setAnswerSheet).mockReturnValueOnce(request.promise);
  const pending = store.dispatch(updateChoiceTodo('1_2', 0, 'A', 'yes') as never);
  expect(answer(store)?.answer).toEqual(['A']);
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2']).toEqual([]);
  await tick();
  request.resolve();
  await pending;
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2'][0].answer).toEqual(['A']);
  expect(store.getState().ExamReducer.examAnswerDraftInfo).toEqual({});
});

it('serializes two rapid question updates using the newest whole-group draft', async () => {
  const store = setup();
  const first = deferred(),
    second = deferred();
  jest
    .mocked(eApi.setAnswerSheet)
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const a = store.dispatch(updateChoiceTodo('1_2', 0, 'A', 'yes') as never);
  await tick();
  const b = store.dispatch(updateChoiceTodo('1_2', 1, 'B', 'yes') as never);
  expect(eApi.setAnswerSheet).toHaveBeenCalledTimes(1);
  expect(answer(store, 0)?.answer).toEqual(['A']);
  expect(answer(store, 1)?.answer).toEqual(['B']);
  first.resolve();
  await tick();
  expect(eApi.setAnswerSheet).toHaveBeenCalledTimes(2);
  const payload = jest.mocked(eApi.setAnswerSheet).mock.calls[1][0];
  expect(payload.problemAnswer.map((sheet: any) => sheet.answer)).toEqual([['A'], ['B']]);
  second.resolve();
  await Promise.all([a, b]);
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2'].map((s) => s.answer)).toEqual([
    ['A'],
    ['B'],
  ]);
});

it('merges rapid multi-choice, exclusions and marking without mutating old snapshots', async () => {
  const store = setup('MultipleChoice');
  const first = deferred();
  jest.mocked(eApi.setAnswerSheet).mockReturnValueOnce(first.promise).mockResolvedValue(undefined);
  const pending = [store.dispatch(updateChoiceTodo('1_2', 0, 'A', 'yes') as never)];
  await tick();
  const snapshot = answer(store);
  pending.push(store.dispatch(updateChoiceTodo('1_2', 0, 'B', 'yes') as never));
  pending.push(store.dispatch(updateChoiceTodo('1_2', 0, 'A', 'no') as never));
  pending.push(store.dispatch(updateFlagTodo('1_2', 0) as never));
  expect(snapshot?.answer).toEqual(['A']);
  expect(answer(store)).toMatchObject({ answer: ['B'], pass: ['A'], marked: true });
  first.resolve();
  await Promise.all(pending);
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2'][0]).toMatchObject({
    answer: ['B'],
    pass: ['A'],
    marked: true,
  });
});

it('keeps all unsaved edits after failure and retries without toggling them again', async () => {
  const store = setup();
  const first = deferred();
  jest.mocked(eApi.setAnswerSheet).mockReturnValueOnce(first.promise).mockResolvedValue(undefined);
  const a = store.dispatch(
    updateChoiceTodo('1_2', 0, 'A', 'yes') as never,
  ) as unknown as Promise<void>;
  await tick();
  const b = store.dispatch(
    updateChoiceTodo('1_2', 1, 'B', 'yes') as never,
  ) as unknown as Promise<void>;
  const rejected = Promise.all([
    expect(a).rejects.toThrow('Offline'),
    expect(b).rejects.toThrow('Offline'),
  ]);
  first.reject(new Error('Offline'));
  await rejected;
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2']).toEqual([]);
  expect(store.getState().ExamReducer.examAnswerDraftInfo?.['1_2'].status).toBe('failed');
  expect(answer(store, 1)?.answer).toEqual(['B']);
  await store.dispatch(retryExamAnswers('1_2') as never);
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2'].map((s) => s.answer)).toEqual([
    ['A'],
    ['B'],
  ]);
});

it('a new edit after failure includes the failed draft', async () => {
  const store = setup();
  jest
    .mocked(eApi.setAnswerSheet)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue(undefined);
  await expect(store.dispatch(updateChoiceTodo('1_2', 0, 'A', 'yes') as never)).rejects.toThrow(
    'Offline',
  );
  await store.dispatch(updateChoiceTodo('1_2', 1, 'B', 'yes') as never);
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2'].map((s) => s.answer)).toEqual([
    ['A'],
    ['B'],
  ]);
});

it('does not overwrite a new exam when an old request returns out of order', async () => {
  const store = setup();
  const old = deferred();
  jest.mocked(eApi.setAnswerSheet).mockReturnValueOnce(old.promise).mockResolvedValue(undefined);
  const pending = store.dispatch(
    updateChoiceTodo('1_2', 0, 'A', 'yes') as never,
  ) as unknown as Promise<void>;
  const rejected = expect(pending).rejects.toThrow('session changed');
  await tick();
  store.dispatch(updateChoiceTodo('1_2', 1, 'B', 'yes') as never);
  store.dispatch(activateExamAnswers('2') as never);
  load(store, '2_2');
  await store.dispatch(updateChoiceTodo('2_2', 0, 'C', 'yes') as never);
  old.resolve();
  await rejected;
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2']).toBeUndefined();
  expect(answer(store, 0, '2_2')?.answer).toEqual(['C']);
  expect(eApi.setAnswerSheet).toHaveBeenCalledTimes(2);
});

it('ignores old-account acknowledgements and drops queued writes on logout', async () => {
  const store = setup();
  const request = deferred();
  jest.mocked(eApi.setAnswerSheet).mockReturnValueOnce(request.promise);
  const pending = store.dispatch(
    updateChoiceTodo('1_2', 0, 'A', 'yes') as never,
  ) as unknown as Promise<void>;
  const rejected = expect(pending).rejects.toThrow('session changed');
  await tick();
  store.dispatch(updateChoiceTodo('1_2', 1, 'B', 'yes') as never);
  store.dispatch({ type: 'userLogout' } as never);
  request.resolve();
  await rejected;
  expect(store.getState().ExamReducer.examAnswerSheetInfo).toEqual({});
  expect(eApi.setAnswerSheet).toHaveBeenCalledTimes(1);
});

it('flushes failed saves before final submission and blocks new edits while submitting', async () => {
  const store = setup();
  jest
    .mocked(eApi.setAnswerSheet)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue(undefined);
  await expect(store.dispatch(updateChoiceTodo('1_2', 0, 'A', 'yes') as never)).rejects.toThrow();
  store.dispatch({ type: 'setExamAnswerSubmitting', submitting: true } as never);
  await store.dispatch(updateChoiceTodo('1_2', 1, 'B', 'yes') as never);
  await store.dispatch(flushExamAnswers('1') as never);
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2'].map((s) => s.answer)).toEqual([
    ['A'],
    [],
  ]);
});

it('does not replace existing server answers with blanks before initial loading completes', async () => {
  const store = setup();
  store.dispatch(activateExamAnswers('1') as never);
  await store.dispatch(updateChoiceTodo('1_2', 0, 'A', 'yes') as never);
  expect(eApi.setAnswerSheet).not.toHaveBeenCalled();
});

it('waits for a prior visit request before saving a new visit to the same exam group', async () => {
  const store = setup();
  const old = deferred();
  jest.mocked(eApi.setAnswerSheet).mockReturnValueOnce(old.promise).mockResolvedValue(undefined);
  const first = store.dispatch(
    updateChoiceTodo('1_2', 0, 'A', 'yes') as never,
  ) as unknown as Promise<void>;
  const rejected = expect(first).rejects.toThrow('session changed');
  await tick();
  store.dispatch(activateExamAnswers('1') as never);
  load(store, '1_2');
  const current = store.dispatch(updateChoiceTodo('1_2', 0, 'B', 'yes') as never);
  await tick();
  expect(eApi.setAnswerSheet).toHaveBeenCalledTimes(1);
  old.resolve();
  await rejected;
  await current;
  expect(eApi.setAnswerSheet).toHaveBeenCalledTimes(2);
  expect(answer(store)?.answer).toEqual(['B']);
});
