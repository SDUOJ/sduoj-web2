import React, { useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import eApi from 'Utils/API/e-api';

const useAnswerSheet = (examId: React.Key, groupId: React.Key) => {
  const groupKey = examId + '_' + groupId;
  const answerSheets = useSelector((state: any) => {
    return state.ExamReducer.examAnswerSheetInfo[groupKey];
  });
  const sessionKey = useSelector((state: any) => JSON.stringify([
    state.UserReducer.isLogin,
    state.UserReducer.userInfo?.username,
  ]));
  const cachedSession = useSelector((state: any) =>
    state.ExamReducer.examAnswerSheetInfo[groupKey + '-session'],
  );
  const currentAnswerSheets = cachedSession === sessionKey ? answerSheets : undefined;
  const dispatch = useDispatch();
  const store = useStore<any>();
  useEffect(() => {
    let active = true;
    if (currentAnswerSheets === undefined) {
      eApi.getAnswerSheet(String(examId), String(groupId)).then((res: any) => {
        const currentSession = JSON.stringify([
          store.getState().UserReducer.isLogin,
          store.getState().UserReducer.userInfo?.username,
        ]);
        if (!active || currentSession !== sessionKey) return;
        dispatch({
          type: 'setAnswerSheet',
          data: res,
          key: groupKey,
        });
        dispatch({ type: 'setAnswerSheet', data: sessionKey, key: groupKey + '-session' });
      }).catch(() => undefined);
    }
    return () => { active = false };
  }, [currentAnswerSheets, dispatch, examId, groupId, groupKey, sessionKey, store]);
  return currentAnswerSheets;
};

export default useAnswerSheet;
