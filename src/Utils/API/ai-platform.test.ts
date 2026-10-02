import MockAdapter from 'axios-mock-adapter';
import { aiPlatform, ProviderSettings } from './ai-platform';
import { service } from './request';

const adapter = new MockAdapter(service);
const success = (data: unknown) => ({ code: 0, data, timestamp: Date.now() });

afterEach(() => adapter.reset());
afterAll(() => adapter.restore());

test('saves provider settings with the version used for optimistic locking', async () => {
  const settings: ProviderSettings = {
    provider: 'chat_completions',
    base_url: 'https://provider.example.invalid/v1',
    model: 'model-1',
    reasoning_effort: 'medium',
    input_usd_per_million: 1,
    cached_usd_per_million: 0.5,
    output_usd_per_million: 2,
    max_task_cost_usd: 2,
    max_concurrency: 4,
    per_user_concurrency: 1,
    max_queued_per_user: 1000,
    agent_concurrency: 4,
    sandbox_concurrency: 2,
    document_concurrency: 2,
    max_output_tokens: 8192,
    max_prompt_bytes: 200000,
    monthly_user_budget_usd: 0,
    monthly_course_budget_usd: 0,
    timeout_seconds: 480,
    max_storage_mb: 512,
    model_overrides: {},
    version: 7,
    has_api_key: true,
  };
  adapter.onPost('/ps/auto-task/ai/settings/update').reply(200, success(settings));
  await aiPlatform.saveSettings(settings);
  expect(JSON.parse(adapter.history.post[0].data)).toMatchObject({
    version: 7,
    expected_version: 7,
  });
});
