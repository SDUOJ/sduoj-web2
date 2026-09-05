import { createCachedRequest, updateMatchingProblemRow } from './problemLookup';

it('shares a concurrent lookup and caches only successful results', async () => {
  let resolve!: (value: string) => void;
  const loader = jest.fn(
    () =>
      new Promise<string>((done) => {
        resolve = done;
      }),
  );
  const cache = createCachedRequest<string, string>();

  const first = cache.get('SDUOJ-0001', loader);
  const second = cache.get('SDUOJ-0001', loader);
  expect(loader).toHaveBeenCalledTimes(1);
  resolve('problem');
  await expect(Promise.all([first, second])).resolves.toEqual(['problem', 'problem']);
  await expect(cache.get('SDUOJ-0001', loader)).resolves.toBe('problem');
  expect(loader).toHaveBeenCalledTimes(1);
});

it('preserves lookup rejection and retries after the problem code is corrected', async () => {
  const loader = jest
    .fn<Promise<string>, []>()
    .mockRejectedValueOnce(new Error('ProblemNotExist'))
    .mockResolvedValueOnce('corrected');
  const cache = createCachedRequest<string, string>();

  await expect(cache.get('SDUOJ-9999', loader)).rejects.toThrow('ProblemNotExist');
  await expect(cache.get('SDUOJ-9999', loader)).resolves.toBe('corrected');
  expect(loader).toHaveBeenCalledTimes(2);
});

it('updates rows immutably and ignores a stale response after the code changes', () => {
  const original = [{ id: 1, ProblemCode: 'SDUOJ-0001', ProblemAlias: '' }];
  const corrected = [{ ...original[0], ProblemCode: 'SDUOJ-0002' }];

  const submitted = updateMatchingProblemRow(original, 1, 'SDUOJ-0001', {
    ProblemAlias: 'Accepted title',
  });
  const stale = updateMatchingProblemRow(corrected, 1, 'SDUOJ-0001', {
    ProblemAlias: 'Stale title',
  });

  expect(submitted).toEqual([{ id: 1, ProblemCode: 'SDUOJ-0001', ProblemAlias: 'Accepted title' }]);
  expect(stale).toEqual(corrected);
  expect(original[0].ProblemAlias).toBe('');
});
