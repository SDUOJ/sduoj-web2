import { rootReducers } from '../Store/rootReducer';
import { legacy_createStore as createStore } from 'redux';

const createAppStore = () => createStore(rootReducers);

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

const actions = [
  { type: 'setUserInfo', data: { username: 'alice' } },
  { type: 'userLogin' },
  { type: 'userLogout' },
  { type: 'setCopyRight', data: 'SDUOJ' },
  { type: 'updateTimestamp', timestamp: 123 },
  { type: 'updateLanguage', lang: {}, langCode: 'en_US' },
  { type: 'setKeyValue', key: 'a', value: { nested: true } },
  { type: 'addManageInitData', key: 'a', data: {} },
  { type: 'setProblemInfo', key: 'a', data: {} },
  { type: 'setProblemSetInfo', key: 'a', data: {} },
  { type: 'setContestInfo', key: 'a', data: {} },
  { type: 'setExportData', data: [] },
  { type: 'setMinWidth', data: 400 },
  { type: 'setAfterContestSubmission', data: true },
  { type: 'setAllowSliderMove', data: true },
  { type: 'setSliderTime', data: 123 },
  { type: 'setOpenSliderMove', data: true },
  { type: 'setExamInfo', key: 'a', data: {} },
  { type: 'setProLists', data: { a: { proList: [] } } },
  { type: 'setAnswerSheet', key: 'a', data: [] },
  { type: 'setTopSubmission', submissionID: 'abc', submissionInfo: {} },
  { type: 'setSubmissionModalVis', data: true },
  { type: 'setSubmissionListInfo', key: 'a', data: {} },
  { type: 'setSelectedRowKeys', name: 'a', data: [1] },
  { type: 'addTableVersion', name: 'a' },
  { type: 'setDataSource', name: 'a', data: [{ id: 1 }], add: true },
  { type: 'setDataSource', name: 'a', data: [{ id: 2 }], add: false },
  { type: 'setTableInfo', name: 'a', data: { pageNow: 2 } },
];

describe('Redux compatibility contracts', () => {
  it.each(actions)(
    '$type does not mutate the previous state, including repeated updates',
    (action) => {
      const initial = rootReducers(undefined, { type: '@@test/init' } as never);
      const first = rootReducers(deepFreeze(initial), action as never);
      expect(first).not.toBe(initial);
      const snapshot = JSON.stringify(first);
      rootReducers(deepFreeze(first), action as never);
      expect(JSON.stringify(first)).toBe(snapshot);
    },
  );

  it('keeps the root reference for unrelated actions', () => {
    const state = rootReducers(undefined, { type: '@@test/init' } as never);
    expect(rootReducers(state, { type: 'unrelated' } as never)).toBe(state);
  });

  it('keeps unchanged table entries and the signed table version protocol', () => {
    const store = createAppStore();
    store.dispatch({ type: 'setTableInfo', name: 'other', data: { pageNow: 3 } });
    const other = store.getState().TableReduce.tableData.other;
    store.dispatch({ type: 'setDataSource', name: 'a', data: [], add: true });
    expect(store.getState().TableReduce.tableData.a.tableVersion).toBe(-1);
    store.dispatch({ type: 'addTableVersion', name: 'a' });
    expect(store.getState().TableReduce.tableData.a.tableVersion).toBe(2);
    expect(store.getState().TableReduce.tableData.other).toBe(other);
  });

  it('clears cached business data on logout without contaminating another store', () => {
    const store = createAppStore();
    const untouched = createAppStore();
    actions.forEach((action) => store.dispatch(action as never));
    store.dispatch({ type: 'userLogout' });
    store.dispatch({ type: 'clearRedux' });
    expect(store.getState().UserReducer).toMatchObject({
      isLogin: false,
      authStatus: 'anonymous',
    });
    expect({ ...store.getState(), UserReducer: undefined }).toEqual({
      ...untouched.getState(),
      UserReducer: undefined,
    });
  });
});
