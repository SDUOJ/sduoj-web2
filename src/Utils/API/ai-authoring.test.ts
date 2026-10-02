import MockAdapter from 'axios-mock-adapter';
import { authoringApi, AuthoringNativePlan } from './ai-authoring';
import { service } from './request';

const adapter = new MockAdapter(service);
const success = (data: unknown) => ({ code: 0, data, timestamp: Date.now() });

afterEach(() => adapter.reset());
afterAll(() => adapter.restore());

test('submits a versioned v2 authoring revision', async () => {
  adapter
    .onPost('/ps/auto-task/ai/authoring/a1/generate')
    .reply(200, success({ taskId: 'job-1', status: 'pending', replay: false }));
  await authoringApi.generate('a1', 3, 'op-1', 'add boundaries');
  expect(JSON.parse(adapter.history.post[0].data)).toEqual({
    version: 3,
    operation_key: 'op-1',
    instruction: 'add boundaries',
  });
});

test('configures native checkpoints using the approved score and public-case plan', async () => {
  const plan = {
    checkpoints: [
      { index: 1, score: 34, public: true },
      { index: 2, score: 33, public: false },
      { index: 3, score: 33, public: false },
    ],
  } as AuthoringNativePlan;
  adapter.onPost('/manage/problem/update').reply(200, success(null));
  await authoringApi.configureProblem('SDUOJ-9', plan, [101, 102, 103], 6);
  expect(JSON.parse(adapter.history.post[0].data)).toEqual({
    problemCode: 'SDUOJ-9',
    checkpoints: [
      { checkpointId: 101, checkpointScore: 34 },
      { checkpointId: 102, checkpointScore: 33 },
      { checkpointId: 103, checkpointScore: 33 },
    ],
    checkpointCases: [101],
    judgeTemplates: [6],
  });
});
