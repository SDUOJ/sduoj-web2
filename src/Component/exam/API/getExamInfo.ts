import React, { useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import eApi from 'Utils/API/e-api';

const useExamInfo = (examId: React.Key) => {
  const sessionKey = useSelector((state: any) =>
    JSON.stringify([state.UserReducer.isLogin, state.UserReducer.userInfo?.username]),
  );
  const examInfo = useSelector((state: any) => state.ExamReducer.examInfo[String(examId)]);
  const cachedSession = useSelector(
    (state: any) => state.ExamReducer.examInfo[String(examId) + '-session'],
  );
  const currentExamInfo = cachedSession === sessionKey ? examInfo : undefined;
  const dispatch = useDispatch();
  const store = useStore<any>();
  useEffect(() => {
    let active = true;
    if (currentExamInfo === undefined) {
      eApi
        .getExamInfo(String(examId))
        .then((x: any) => {
          const currentSession = JSON.stringify([
            store.getState().UserReducer.isLogin,
            store.getState().UserReducer.userInfo?.username,
          ]);
          if (!active || currentSession !== sessionKey) return;
          dispatch({
            type: 'setExamInfo',
            key: examId,
            data: {
              id: x.examId,
              startTime: parseInt(x.gmtStart),
              endTime: parseInt(x.gmtEnd),
              title: x.examTitle,
              participantNum: x.participantNum,
              description: x.description.toString(),
              userIsSubmit: x.userIsSubmit,
              scoreMod: x.features === null ? 'show' : (x.features.scoreMod ?? 'show'),
              testcaseMod: x.features === null ? 'show' : (x.features.caseMod ?? 'show'),
              openReport: x.features === null ? 0 : (x.features.openReport ?? 0),
            },
          });
          dispatch({ type: 'setExamInfo', key: String(examId) + '-session', data: sessionKey });
        })
        .catch(() => undefined);
    }
    return () => {
      active = false;
    };
  }, [currentExamInfo, dispatch, examId, sessionKey, store]);
  return currentExamInfo;
};

export default useExamInfo;
