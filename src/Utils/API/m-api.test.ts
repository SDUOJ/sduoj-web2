import MockAdapter from 'axios-mock-adapter';
import mApi from './m-api';
import { service } from './request';
import fixture from '../../../docs/audit/fixtures/contest-question-visibility.json';

const adapter = new MockAdapter(service);
afterEach(() => adapter.reset());
afterAll(() => adapter.restore());

test('publishes and unpublishes through the management contract and returns null', async () => {
  adapter.onPost(fixture.path).reply(200, fixture.response);
  await expect(mApi.publicQuestion({ clarificationId: '144', opt: 1 })).resolves.toBeNull();
  await expect(mApi.publicQuestion({ clarificationId: '144', opt: 0 })).resolves.toBeNull();
  expect(adapter.history.post.map((request) => JSON.parse(request.data))).toEqual([
    { clarificationId: '144', opt: 1 },
    { clarificationId: '144', opt: 0 },
  ]);
});

test.each([
  { clarificationId: '', opt: 1 },
  { clarificationId: '0', opt: 1 },
  { clarificationId: '-1', opt: 0 },
  { clarificationId: '9223372036854775808', opt: 1 },
  { clarificationId: '144', opt: 2 },
  { clarificationId: '144' },
])('rejects invalid visibility payloads before transport: %j', async (payload) => {
  await expect(
    mApi.publicQuestion(payload as Parameters<typeof mApi.publicQuestion>[0]),
  ).rejects.toBeDefined();
  expect(adapter.history.post).toHaveLength(0);
});
