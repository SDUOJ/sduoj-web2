import { Dispatch } from 'react';
import eApi from 'Utils/API/e-api';
import {
  ExamAnswerContext,
  ExamAnswerDraft,
  ExamState,
  SExamAnswerSheet,
  SExamInfo,
  SExamProListInfo,
} from '../../Type/IExam';
import { clearRedux } from './common';

export type ExamAction =
  | setProLists
  | setExamInfo
  | setAnswerSheet
  | clearRedux
  | { type: 'setExamAnswerContext'; context?: ExamAnswerContext }
  | { type: 'setExamAnswerDraft'; key: string; draft?: ExamAnswerDraft }
  | { type: 'setExamAnswerSubmitting'; submitting: boolean }
  | { type: 'userLogout' | 'authCheckFailed' };

export interface setProLists {
  type: 'setProLists';
  data: { [key: string]: SExamProListInfo };
}
export interface setExamInfo {
  type: 'setExamInfo';
  data: SExamInfo;
  key: string;
}
export interface setAnswerSheet {
  type: 'setAnswerSheet';
  data: SExamAnswerSheet[];
  key: string;
}

type GetState = () => any;
type SaveQueue = {
  context: ExamAnswerContext;
  latest: SExamAnswerSheet[];
  revision: number;
  saved: number;
  running?: Promise<void>;
  after?: Promise<void>;
};
// Transport queues are scoped to one Redux store; visible drafts and status belong to Redux.
const queues = new WeakMap<GetState, Map<string, SaveQueue>>();
const cloneSheets = (sheets: SExamAnswerSheet[]) =>
  sheets.map((sheet) => ({
    ...sheet,
    answer: [...sheet.answer],
    pass: [...sheet.pass],
    choice: undefined,
  }));

export const examAnswerSessionKey = (state: any): string =>
  JSON.stringify([
    state.UserReducer?.isLogin,
    state.UserReducer?.userInfo?.username,
    state.UserReducer?.userInfo?.userId,
  ]);

export const selectExamAnswerDraft = (state: any, groupKey: string) => {
  const exam: ExamState = state.ExamReducer;
  return exam.answerContext?.session === examAnswerSessionKey(state)
    ? exam.examAnswerDraftInfo?.[groupKey]
    : undefined;
};
export const selectExamAnswerSheets = (state: any, groupKey: string) =>
  selectExamAnswerDraft(state, groupKey)?.sheets ?? state.ExamReducer.examAnswerSheetInfo[groupKey];

export function activateExamAnswers(examId: string) {
  return (dispatch: Dispatch<any>, getState: GetState) => {
    const context = { examId, session: examAnswerSessionKey(getState()) };
    dispatch({ type: 'setExamAnswerContext', context });
    return () => {
      if (getState().ExamReducer.answerContext === context)
        dispatch({ type: 'setExamAnswerContext' });
    };
  };
}

const isCurrent = (getState: GetState, queue: SaveQueue) =>
  getState().ExamReducer.answerContext === queue.context &&
  examAnswerSessionKey(getState()) === queue.context.session;

function saveQueue(dispatch: Dispatch<any>, getState: GetState, key: string, queue: SaveQueue) {
  if (queue.running) return queue.running;
  // Defer the drain one microtask so synchronous actions can share their latest draft.
  queue.running = Promise.resolve().then(async () => {
    try {
      if (queue.after) await queue.after.catch(() => {});
      queue.after = undefined;
      while (queue.saved < queue.revision) {
        if (!isCurrent(getState, queue)) throw new Error('Exam answer session changed');
        const revision = queue.revision;
        const submitted = cloneSheets(queue.latest);
        const [examId, groupId] = key.split('_');
        await eApi.setAnswerSheet({ problemAnswer: submitted }, examId, groupId);
        if (!isCurrent(getState, queue)) throw new Error('Exam answer session changed');
        queue.saved = revision;
        dispatch({ type: 'setAnswerSheet', key, data: submitted });
        if (revision === queue.revision)
          dispatch({ type: 'setExamAnswerDraft', key, draft: undefined });
      }
    } catch (error) {
      if (isCurrent(getState, queue))
        dispatch({
          type: 'setExamAnswerDraft',
          key,
          draft: { sheets: cloneSheets(queue.latest), status: 'failed' },
        });
      throw error;
    } finally {
      queue.running = undefined;
    }
  });
  return queue.running;
}

const copyAnswerSheets = (state: any, groupKey: string): SExamAnswerSheet[] => {
  const exam: ExamState = state.ExamReducer;
  const sheets = selectExamAnswerSheets(state, groupKey);
  return Array.from({ length: exam.examProListInfo[groupKey].proList.length }, (_, index) => {
    const sheet = sheets?.[index];
    return sheet
      ? { ...sheet, index, answer: [...sheet.answer], pass: [...sheet.pass] }
      : { index, answer: [], pass: [], marked: false };
  });
};

function canEdit(state: any, groupKey: string, proIndex: number) {
  const exam: ExamState = state.ExamReducer;
  const group = exam.examProListInfo[groupKey];
  return (
    group &&
    Number.isInteger(Number(proIndex)) &&
    proIndex >= 0 &&
    proIndex < group.proList.length &&
    exam.examAnswerSheetInfo[groupKey] !== undefined &&
    !exam.answerSubmitting &&
    exam.answerContext?.examId === groupKey.split('_')[0] &&
    exam.answerContext.session === examAnswerSessionKey(state)
  );
}

export function updateChoiceTodo(
  groupKey: string,
  proIndex: number,
  choice: string,
  action: 'yes' | 'no',
) {
  return (dispatch: Dispatch<any>, getState: GetState) => {
    const state = getState();
    if (!canEdit(state, groupKey, proIndex)) return Promise.resolve();
    const sheets = copyAnswerSheets(state, groupKey);
    const sheet = sheets[proIndex];
    if (action === 'yes') {
      if (sheet.answer.includes(choice)) sheet.answer = sheet.answer.filter((v) => v !== choice);
      else {
        if (state.ExamReducer.examProListInfo[groupKey].type === 'SingleChoice') sheet.answer = [];
        sheet.answer.push(choice);
      }
      sheet.pass = sheet.pass.filter((v) => v !== choice);
    } else {
      if (sheet.pass.includes(choice)) sheet.pass = sheet.pass.filter((v) => v !== choice);
      else sheet.pass.push(choice);
      sheet.answer = sheet.answer.filter((v) => v !== choice);
    }
    return dispatch(setAnswerSheetTodo(sheets, groupKey));
  };
}

export function updateFlagTodo(groupKey: string, proIndex: number) {
  return (dispatch: Dispatch<any>, getState: GetState) => {
    if (!canEdit(getState(), groupKey, proIndex)) return Promise.resolve();
    const sheets = copyAnswerSheets(getState(), groupKey);
    sheets[proIndex].marked = !sheets[proIndex].marked;
    return dispatch(setAnswerSheetTodo(sheets, groupKey));
  };
}

export function setAnswerSheetTodo(sheets: SExamAnswerSheet[], key: string) {
  return (dispatch: Dispatch<any>, getState: GetState) => {
    const context = getState().ExamReducer.answerContext;
    if (
      !context ||
      context.examId !== key.split('_')[0] ||
      context.session !== examAnswerSessionKey(getState())
    )
      return Promise.reject(new Error('Exam answer session changed'));
    let storeQueues = queues.get(getState);
    if (!storeQueues) queues.set(getState, (storeQueues = new Map()));
    let queue = storeQueues.get(key);
    if (!queue || queue.context !== context) {
      queue = { context, latest: [], revision: 0, saved: 0, after: queue?.running };
      storeQueues.set(key, queue);
    }
    queue.latest = cloneSheets(sheets);
    queue.revision += 1;
    dispatch({
      type: 'setExamAnswerDraft',
      key,
      draft: { sheets: queue.latest, status: 'saving' },
    });
    return saveQueue(dispatch, getState, key, queue);
  };
}

export function retryExamAnswers(key: string) {
  return (dispatch: Dispatch<any>, getState: GetState) => {
    const queue = queues.get(getState)?.get(key);
    if (!queue || !isCurrent(getState, queue)) return Promise.resolve();
    dispatch({
      type: 'setExamAnswerDraft',
      key,
      draft: { sheets: queue.latest, status: 'saving' },
    });
    return saveQueue(dispatch, getState, key, queue);
  };
}

export function flushExamAnswers(examId: string) {
  return async (dispatch: Dispatch<any>, getState: GetState) => {
    const context = getState().ExamReducer.answerContext;
    if (!context || context.examId !== examId) throw new Error('Exam answer session changed');
    for (const [key, queue] of Array.from(queues.get(getState)?.entries() ?? [])) {
      if (queue.context === context && queue.saved < queue.revision)
        await dispatch(retryExamAnswers(key));
    }
    if (
      getState().ExamReducer.answerContext !== context ||
      examAnswerSessionKey(getState()) !== context.session
    )
      throw new Error('Exam answer session changed');
  };
}
