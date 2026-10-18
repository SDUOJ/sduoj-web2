import { loadVditorRuntime } from './vditorRuntime';

const globals = window as unknown as { Lute?: unknown; VditorI18n?: unknown };
const scriptFor = (suffix: string) =>
  Array.from(document.head.querySelectorAll('script')).find((script) =>
    script.src.endsWith(suffix),
  )!;

afterEach(() => {
  document.head.querySelectorAll('script').forEach((script) => script.remove());
  delete globals.Lute;
  delete globals.VditorI18n;
});

it('preloads both resources and retains the dictionary for each language', async () => {
  const first = loadVditorRuntime('/runtime-one', 'en_US');
  const english = { name: 'english' };
  globals.VditorI18n = english;
  scriptFor('/runtime-one/dist/js/i18n/en_US.js').dispatchEvent(new Event('load'));
  globals.Lute = {};
  scriptFor('/runtime-one/dist/js/lute/lute.min.js').dispatchEvent(new Event('load'));
  expect(await first).toBe(english);
  expect(document.getElementById('vditorLuteScript')).not.toBeNull();
  const second = loadVditorRuntime('/runtime-one', 'zh_CN');
  globals.VditorI18n = { name: 'chinese' };
  scriptFor('/runtime-one/dist/js/i18n/zh_CN.js').dispatchEvent(new Event('load'));
  await second;
  expect(await loadVditorRuntime('/runtime-one', 'en_US')).toBe(english);
});

it('rejects a missing resource and retries without constructing a partial editor', async () => {
  globals.Lute = {};
  const failed = loadVditorRuntime('/runtime-retry', 'en_US');
  scriptFor('/runtime-retry/dist/js/i18n/en_US.js').dispatchEvent(new Event('error'));
  await expect(failed).rejects.toThrow('Unable to load');
  expect(scriptFor('/runtime-retry/dist/js/i18n/en_US.js')).toBeUndefined();
  const retry = loadVditorRuntime('/runtime-retry', 'en_US');
  globals.VditorI18n = { name: 'english' };
  scriptFor('/runtime-retry/dist/js/i18n/en_US.js').dispatchEvent(new Event('load'));
  await expect(retry).resolves.toEqual({ name: 'english' });
});

it('keeps the library marker when Lute already exists without a script node', async () => {
  globals.Lute = {};
  const pending = loadVditorRuntime('/runtime-existing', 'en_US');
  globals.VditorI18n = {};
  scriptFor('/runtime-existing/dist/js/i18n/en_US.js').dispatchEvent(new Event('load'));
  await pending;
  expect(document.getElementById('vditorLuteScript')).not.toBeNull();
  expect(scriptFor('/runtime-existing/dist/js/lute/lute.min.js')).toBeUndefined();
});
