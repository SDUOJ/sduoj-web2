export interface CachedRequest<Key, Value> {
  get: (key: Key, loader: () => Promise<Value>) => Promise<Value>;
  has: (key: Key) => boolean;
}

export const createCachedRequest = <Key, Value>(): CachedRequest<Key, Value> => {
  const completed = new Map<Key, Value>();
  const pending = new Map<Key, Promise<Value>>();

  return {
    has: (key) => completed.has(key),
    get: (key, loader) => {
      if (completed.has(key)) return Promise.resolve(completed.get(key) as Value);
      const existing = pending.get(key);
      if (existing) return existing;

      const request = loader()
        .then((value) => {
          completed.set(key, value);
          return value;
        })
        .finally(() => pending.delete(key));
      pending.set(key, request);
      return request;
    },
  };
};

export const updateMatchingProblemRow = <Row extends { id: React.Key; ProblemCode?: string }>(
  rows: Row[],
  rowId: React.Key | undefined,
  expectedProblemCode: string,
  changes: Partial<Row>,
): Row[] =>
  rows.map((row) =>
    row.id === rowId && row.ProblemCode === expectedProblemCode ? { ...row, ...changes } : row,
  );
