import { useDispatch, useSelector, useStore } from 'react-redux';
import cApi from 'Utils/API/c-api';
import { useEffect, useRef } from 'react';

interface InFlightLoad {
  consumers: number;
  errorHandlers: Set<(error: unknown) => void>;
}

const loadsByStore = new WeakMap<object, Map<string, InFlightLoad>>();

const useProblemSetInfo = (psid: string, onError?: (error: unknown) => void) => {
  const sessionKey = useSelector((state: any) =>
    JSON.stringify([state.UserReducer.isLogin, state.UserReducer.userInfo?.username]),
  );
  const problemSetInfo = useSelector((state: any) => {
    return state.ProblemSetReducer.problemSetInfo[psid];
  });
  const cachedSession = useSelector(
    (state: any) => state.ProblemSetReducer.problemSetInfo[psid + '-session'],
  );
  const currentProblemSetInfo = cachedSession === sessionKey ? problemSetInfo : undefined;
  const dispatch = useDispatch();
  const store = useStore<any>();
  let storeLoads = loadsByStore.get(store);
  if (storeLoads === undefined) {
    storeLoads = new Map<string, InFlightLoad>();
    loadsByStore.set(store, storeLoads);
  }
  const failedPsidRef = useRef<string>();
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const loadKey = sessionKey + ':' + psid;
    if (failedPsidRef.current !== undefined && failedPsidRef.current !== loadKey) {
      failedPsidRef.current = undefined;
    }
    if (failedPsidRef.current === loadKey || currentProblemSetInfo !== undefined) return;
    const existing = storeLoads.get(loadKey);
    let active = true;
    const errorHandler = (error: unknown) => onErrorRef.current?.(error);
    if (existing !== undefined) {
      existing.consumers += 1;
      existing.errorHandlers.add(errorHandler);
      return () => {
        active = false;
        existing.consumers -= 1;
        existing.errorHandlers.delete(errorHandler);
        if (existing.consumers === 0 && storeLoads.get(loadKey) === existing) {
          storeLoads.delete(loadKey);
        }
      };
    }

    const entry: InFlightLoad = { consumers: 1, errorHandlers: new Set([errorHandler]) };
    storeLoads.set(loadKey, entry);
    cApi
      .getProblemSetInfo({ psid: parseInt(psid) })
      .then((res: any) => {
        if (
          storeLoads.get(loadKey) === entry &&
          entry.consumers > 0 &&
          JSON.stringify([
            store.getState().UserReducer.isLogin,
            store.getState().UserReducer.userInfo?.username,
          ]) === sessionKey
        ) {
          dispatch({ type: 'setProblemSetInfo', key: psid, data: res });
          dispatch({ type: 'setProblemSetInfo', key: psid + '-session', data: sessionKey });
        }
      })
      .catch((error) => {
        if (active) {
          failedPsidRef.current = loadKey;
        }
        entry.errorHandlers.forEach((handler) => handler(error));
      })
      .finally(() => {
        if (storeLoads.get(loadKey) === entry) storeLoads.delete(loadKey);
      });
    return () => {
      active = false;
      entry.consumers -= 1;
      entry.errorHandlers.delete(errorHandler);
      if (entry.consumers === 0 && storeLoads.get(loadKey) === entry) {
        storeLoads.delete(loadKey);
      }
    };
  }, [currentProblemSetInfo, dispatch, psid, sessionKey, store, storeLoads]);
  return currentProblemSetInfo;
};

export default useProblemSetInfo;
