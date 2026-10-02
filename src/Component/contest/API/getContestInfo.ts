import { useDispatch, useSelector, useStore } from 'react-redux';
import cApi from 'Utils/API/c-api';
import { useEffect, useRef } from 'react';

const useContestInfo = (contestId: string, update?: boolean) => {
  const sessionKey = useSelector((state: any) =>
    JSON.stringify([state.UserReducer.isLogin, state.UserReducer.userInfo?.username]),
  );
  const contestInfo = useSelector((state: any) => state.ContestReducer.contestInfo[contestId]);
  const cachedSession = useSelector(
    (state: any) => state.ContestReducer.contestInfo[contestId + '-session'],
  );
  const currentContestInfo = cachedSession === sessionKey ? contestInfo : undefined;
  const dispatch = useDispatch();
  const store = useStore<any>();
  const requestKey = sessionKey + ':' + contestId;
  const failedKeyRef = useRef<string>();
  const loadedKeyRef = useRef<string>();
  const loadingRef = useRef(false);

  useEffect(() => {
    if (update === false || loadingRef.current) return;
    if (update !== true && currentContestInfo !== undefined) return;
    if (update !== true && failedKeyRef.current === requestKey) return;
    if (update === true && loadedKeyRef.current === requestKey) return;

    loadingRef.current = true;
    let active = true;
    cApi
      .getContestInfo({ contestId })
      .then((res: any) => {
        const currentSession = JSON.stringify([
          store.getState().UserReducer.isLogin,
          store.getState().UserReducer.userInfo?.username,
        ]);
        if (!active || currentSession !== sessionKey) return;
        dispatch({ type: 'setContestInfo', key: contestId, data: res });
        dispatch({ type: 'setContestInfo', key: contestId + '-session', data: sessionKey });
        loadedKeyRef.current = requestKey;
      })
      .catch(() => {
        if (active) failedKeyRef.current = requestKey;
      })
      .finally(() => {
        if (active) loadingRef.current = false;
      });

    return () => {
      active = false;
      loadingRef.current = false;
    };
  }, [contestId, currentContestInfo, dispatch, requestKey, sessionKey, store, update]);

  return update === false ? undefined : currentContestInfo;
};

export default useContestInfo;
