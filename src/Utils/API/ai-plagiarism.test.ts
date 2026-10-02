import MockAdapter from 'axios-mock-adapter';
import { plagiarismApi } from './ai-plagiarism';
import { service } from './request';

const adapter = new MockAdapter(service);
const success = (data: unknown) => ({ code: 0, data, timestamp: Date.now() });

afterEach(() => adapter.reset());
afterAll(() => adapter.restore());

test('creates an immutable native scan using the gateway contract', async () => {
  const body = {
    psid: 9,
    group_id: 10,
    pid: 99,
    operation_key: 'scan-1',
    title: '期末查重',
    language: 'cpp' as const,
    threshold: 0.7,
    selection_policy: 'latest' as const,
  };
  adapter
    .onPost('/ps/auto-task/ai/native/plagiarism/create', body)
    .reply(200, success({ taskId: 'job-1', resource_id: 'resource-1', status: 'pending' }));
  await expect(plagiarismApi.createNative(body)).resolves.toEqual(
    expect.objectContaining({ taskId: 'job-1', resource_id: 'resource-1' }),
  );
});

test('sends versioned pair review and explicit writeback requests', async () => {
  adapter
    .onPost('/ps/auto-task/ai/plagiarism/resource-1/pairs/review')
    .reply(200, success({ version: 2 }));
  adapter
    .onPost('/ps/auto-task/ai/plagiarism/resource-1/writeback')
    .reply(200, success({ version: 3, updated: 2 }));
  await plagiarismApi.reviewPair(
    'resource-1',
    1,
    { left: '101', right: '102' },
    'SUSPICIOUS',
    'matching region',
  );
  await plagiarismApi.writeback('resource-1', 2, 'teacher reviewed', true);
  expect(JSON.parse(adapter.history.post[0].data)).toEqual({
    version: 1,
    left: '101',
    right: '102',
    decision: 'SUSPICIOUS',
    reason: 'matching region',
  });
  expect(JSON.parse(adapter.history.post[1].data)).toEqual({
    version: 2,
    reason: 'teacher reviewed',
    require_all_reviewed: true,
    overwrite_existing: true,
  });
});
