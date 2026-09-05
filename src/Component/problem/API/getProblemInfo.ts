import { useDispatch, useSelector, useStore } from 'react-redux';
import { useEffect, useRef } from 'react';

interface InFlightLoad {
  consumers: number;
}

const loadsByStore = new WeakMap<object, Map<string, InFlightLoad>>();

const useProblemInfo = (fun: any, key: string) => {
  const sessionKey = useSelector((state: any) =>
    JSON.stringify([state.UserReducer.isLogin, state.UserReducer.userInfo?.username]),
  );
  const problemInfo = useSelector((state: any) => {
    return state.ProblemReducer.ProblemInfo[key];
  });
  const cachedSession = useSelector(
    (state: any) => state.ProblemReducer.ProblemInfo[key + '-session'],
  );
  const currentProblemInfo = cachedSession === sessionKey ? problemInfo : undefined;
  const dispatch = useDispatch();
  const store = useStore<any>();
  let storeLoads = loadsByStore.get(store);
  if (storeLoads === undefined) {
    storeLoads = new Map<string, InFlightLoad>();
    loadsByStore.set(store, storeLoads);
  }
  const loadRef = useRef(fun);
  const failedKeyRef = useRef<string>();
  loadRef.current = fun;
  useEffect(() => {
    const loadKey = sessionKey + ':' + key;
    if (failedKeyRef.current !== undefined && failedKeyRef.current !== loadKey) {
      failedKeyRef.current = undefined;
    }
    if (failedKeyRef.current === loadKey || currentProblemInfo !== undefined) return;
    const existing = storeLoads.get(loadKey);
    let active = true;
    if (existing !== undefined) {
      existing.consumers += 1;
      return () => {
        active = false;
        existing.consumers -= 1;
        if (existing.consumers === 0 && storeLoads.get(loadKey) === existing) {
          storeLoads.delete(loadKey);
        }
      };
    }

    const entry: InFlightLoad = { consumers: 1 };
    storeLoads.set(loadKey, entry);
    loadRef
      .current()
      .then((res: any) => {
        if (
          storeLoads.get(loadKey) === entry &&
          entry.consumers > 0 &&
          JSON.stringify([
            store.getState().UserReducer.isLogin,
            store.getState().UserReducer.userInfo?.username,
          ]) === sessionKey
        ) {
          dispatch({ type: 'setProblemInfo', key, data: res });
          dispatch({ type: 'setProblemInfo', key: key + '-session', data: sessionKey });
        }
      })
      .catch(() => {
        if (active) failedKeyRef.current = loadKey;
      })
      .finally(() => {
        if (storeLoads.get(loadKey) === entry) storeLoads.delete(loadKey);
      });
    return () => {
      active = false;
      entry.consumers -= 1;
      if (entry.consumers === 0 && storeLoads.get(loadKey) === entry) {
        storeLoads.delete(loadKey);
      }
    };
  }, [currentProblemInfo, dispatch, key, sessionKey, store, storeLoads]);
  return currentProblemInfo;
};

export default useProblemInfo;
