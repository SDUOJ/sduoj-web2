import MockAdapter from 'axios-mock-adapter';
import { aiWorkbench, AiResource } from './ai-workbench';
import { service } from './request';

const adapter = new MockAdapter(service);
const success = (data: unknown) => ({ code: 0, data, timestamp: Date.now() });

afterEach(() => adapter.reset());
afterAll(() => adapter.restore());

test('refreshNative sends a versioned explicit source refresh request', async () => {
  const resource: AiResource = {
    id: 'q-native',
    kind: 'question',
    version: 4,
    state: 'ready',
    data: {
      question_type: 'single_choice',
      native: { type: 'objective', pid: '17', group_id: 3, description_id: '9' },
    },
  };
  adapter.onPost('/ps/auto-task/ai/native/import').reply(200, success(resource));
  await aiWorkbench.refreshNative(resource);
  expect(JSON.parse(adapter.history.post[0].data)).toEqual({
    group_id: 3,
    pid: '17',
    refresh_resource_id: 'q-native',
    version: 4,
  });
});

test('refreshNative fails locally for a non-native question', async () => {
  const resource: AiResource = {
    id: 'q-local',
    kind: 'question',
    version: 1,
    state: 'ready',
    data: { question_type: 'short_answer' },
  };
  expect(() => aiWorkbench.refreshNative(resource)).toThrow('OJ 导入题');
  expect(adapter.history.post).toHaveLength(0);
});
