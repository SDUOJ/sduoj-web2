import { ExamAction } from '../Action/exam';
import { ExamState } from '../../Type/IExam';

const initState: ExamState = {
  examInfo: {},
  examProListInfo: {},
  examAnswerSheetInfo: {},
};

export const ExamReducer = (state: ExamState = initState, action: ExamAction) => {
  let State: ExamState = { ...state };
  switch (action.type) {
    case 'setExamAnswerContext':
      State.answerContext = action.context;
      State.examAnswerDraftInfo = {};
      State.answerSubmitting = false;
      if (action.context) State.examAnswerSheetInfo = {};
      break;
    case 'setExamAnswerDraft':
      State.examAnswerDraftInfo = { ...state.examAnswerDraftInfo };
      if (action.draft) State.examAnswerDraftInfo[action.key] = action.draft;
      else delete State.examAnswerDraftInfo[action.key];
      break;
    case 'setExamAnswerSubmitting':
      State.answerSubmitting = action.submitting;
      break;
    case 'setAnswerSheet':
      State.examAnswerSheetInfo = { ...state.examAnswerSheetInfo, [action.key]: action.data };
      break;
    case 'setProLists':
      State.examProListInfo = {
        ...State.examProListInfo,
        ...action.data,
      };
      break;
    case 'setExamInfo':
      State.examInfo = { ...state.examInfo, [action.key]: action.data };
      break;
    case 'userLogout':
    case 'authCheckFailed':
    case 'clearRedux':
      return {
        examInfo: {},
        examProListInfo: {},
        examAnswerSheetInfo: {},
      };
    default:
      return state;
  }
  return State;
};
