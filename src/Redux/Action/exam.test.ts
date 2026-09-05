import {applyMiddleware, legacy_createStore as createStore} from 'redux';
import {thunk} from 'redux-thunk';
import {rootReducers} from '../Store/rootReducer';
import {updateChoiceTodo, updateFlagTodo} from './exam';
import eApi from '../../Utils/API/e-api';

jest.mock('../../Utils/API/e-api', () => ({__esModule: true, default: {setAnswerSheet: jest.fn()}}));

function setup(type = 'SingleChoice') {
  const store = createStore(rootReducers, undefined, applyMiddleware(thunk));
  store.dispatch({type: 'setProLists', data: {'1_2': {type, proList: [{index: 0}]}}} as never);
  return store;
}

it('only commits an answer after the server accepts it', async () => {
  const store = setup();
  let complete!: () => void;
  jest.mocked(eApi.setAnswerSheet).mockReturnValueOnce(new Promise<void>((resolve) => {complete = resolve;}));
  const pending = store.dispatch(updateChoiceTodo('1_2', 0, 'A', 'yes') as never);
  expect(store.getState().ExamReducer.examAnswerSheetInfo).toEqual({});
  complete();
  await pending;
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2'][0].answer).toEqual(['A']);
});

it('keeps the stored answer unchanged on request failure', async () => {
  const store = setup();
  const before = store.getState();
  jest.mocked(eApi.setAnswerSheet).mockRejectedValueOnce(new Error('Offline'));
  await expect(store.dispatch(updateChoiceTodo('1_2', 0, 'A', 'yes') as never)).rejects.toThrow('Offline');
  expect(store.getState()).toBe(before);
});

it('preserves single-choice, exclusion and flag behavior without changing prior snapshots', async () => {
  const store = setup();
  jest.mocked(eApi.setAnswerSheet).mockResolvedValue(undefined);
  await store.dispatch(updateChoiceTodo('1_2', 0, 'A', 'yes') as never);
  const first = store.getState().ExamReducer.examAnswerSheetInfo['1_2'];
  await store.dispatch(updateChoiceTodo('1_2', 0, 'B', 'yes') as never);
  expect(first[0].answer).toEqual(['A']);
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2'][0].answer).toEqual(['B']);
  await store.dispatch(updateChoiceTodo('1_2', 0, 'B', 'no') as never);
  await store.dispatch(updateFlagTodo('1_2', 0) as never);
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2'][0]).toMatchObject({answer: [], pass: ['B'], marked: true});
});

it('toggles multiple answers and excluded choices independently', async () => {
  const store = setup('MultipleChoice');
  jest.mocked(eApi.setAnswerSheet).mockResolvedValue(undefined);
  for (const choice of ['A', 'B', 'A']) await store.dispatch(updateChoiceTodo('1_2', 0, choice, 'yes') as never);
  for (const choice of ['C', 'C']) await store.dispatch(updateChoiceTodo('1_2', 0, choice, 'no') as never);
  expect(store.getState().ExamReducer.examAnswerSheetInfo['1_2'][0]).toMatchObject({answer: ['B'], pass: []});
});
