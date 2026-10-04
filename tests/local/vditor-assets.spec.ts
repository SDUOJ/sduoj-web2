import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const { revision, directory } = require('../../config/vditor-assets.cjs') as {
  revision: string;
  directory: string;
};

test('development serves the content-addressed Vditor runtime without an HTML fallback', async ({
  request,
}) => {
  for (const filename of ['index.min.js', 'js/lute/lute.min.js', 'css/content-theme/light.css']) {
    const response = await request.get(`/vditor/${revision}/dist/${filename}`);
    expect(response.ok()).toBe(true);
    const bytes = await response.body();
    const expected = fs.readFileSync(path.join(directory, filename));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      createHash('sha256').update(expected).digest('hex'),
    );
    expect(response.headers()['content-type']).not.toContain('text/html');
  }
});
