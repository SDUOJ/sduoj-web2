import type Vditor from 'vditor';

type Options = NonNullable<ConstructorParameters<typeof Vditor>[1]>;
type I18n = NonNullable<Options['i18n']>;
const resources = new Map<string, Promise<unknown>>();
const globals = window as unknown as { Lute?: unknown; VditorI18n?: I18n };

function loadResource<T>(url: string, id: string, read: () => T | undefined): Promise<T> {
  const existing = resources.get(url);
  if (existing) return existing as Promise<T>;
  const promise = new Promise<T>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = document.getElementById(id) ? `${id}-preload` : id;
    script.async = true;
    script.onload = () => {
      const value = read();
      if (value !== undefined) resolve(value);
      else fail();
    };
    const fail = () => {
      script.remove();
      resources.delete(url);
      reject(new Error('Unable to load the editor runtime'));
    };
    script.onerror = fail;
    script.src = url;
    document.head.appendChild(script);
  });
  resources.set(url, promise);
  return promise;
}

/** Load fallible resources before constructing a Vditor that cannot cancel initialization. */
export async function loadVditorRuntime(cdn: string, lang: string): Promise<I18n> {
  const [i18n] = await Promise.all([
    loadResource(
      `${cdn}/dist/js/i18n/${lang}.js`,
      `sduojVditorI18n-${lang}`,
      () => globals.VditorI18n,
    ),
    globals.Lute
      ? Promise.resolve(globals.Lute)
      : loadResource(`${cdn}/dist/js/lute/lute.min.js`, 'vditorLuteScript', () => globals.Lute),
  ]);
  // Vditor checks this marker even when Lute was already loaded by another view.
  if (!document.getElementById('vditorLuteScript')) {
    const marker = document.createElement('script');
    marker.id = 'vditorLuteScript';
    marker.type = 'application/json';
    document.head.appendChild(marker);
  }
  return i18n;
}
