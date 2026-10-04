import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { getVditorResourceUrls } from '../../src/Utils/vditorResources';

test('long-lived browser caches separate a new Vditor release and reuse the matching rollback version', async ({
  page,
}) => {
  const resources = ['old', 'new'].map((version) => {
    const script = `window.cachedVditorVersion = '${version}';`;
    const checksum = createHash('sha256').update(script).digest('hex');
    const revision = createHash('sha256').update(`index.min.js\0${checksum}\n`).digest('hex');
    return {
      version,
      script,
      url: `${getVditorResourceUrls('/v2/', revision).cdn}/dist/index.min.js`,
    };
  });
  let active = resources[0];
  const requests: string[] = [];
  const server = createServer((request, response) => {
    if (request.url === '/v2/') {
      response.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
      response.end(
        `<html><head><script src="${active.url}"></script></head><body>Cache fixture</body></html>`,
      );
      return;
    }
    const resource = resources.find((entry) => entry.url === request.url);
    if (!resource) {
      response.writeHead(404).end();
      return;
    }
    requests.push(resource.version);
    response.writeHead(200, {
      'Content-Type': 'text/javascript',
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    response.end(resource.script);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing cache fixture address');
    const url = `http://127.0.0.1:${address.port}/v2/`;
    for (const resource of [resources[0], resources[1], resources[0]]) {
      active = resource;
      await page.goto(url);
      expect(
        await page.evaluate(
          () => (window as unknown as { cachedVditorVersion: string }).cachedVditorVersion,
        ),
      ).toBe(resource.version);
    }
    expect(requests).toEqual(['old', 'new']);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
