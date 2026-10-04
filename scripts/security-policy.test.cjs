const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');

test('the single inline script exception matches the installed and copied Vditor icon file', () => {
  const policy = fs.readFileSync('config/nginx/security-headers.conf', 'utf8');
  const hashes = [...policy.matchAll(/'sha256-([^']+)'/g)].map((match) => match[1]);
  assert.equal(hashes.length, 1);
  for (const filename of [
    'node_modules/vditor/dist/js/icons/ant.js',
    'public/vditor/dist/js/icons/ant.js',
  ])
    assert.equal(
      hashes[0],
      crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('base64'),
    );
  assert.doesNotMatch(
    policy,
    /unsafe-eval|script-src[^;]*unsafe-inline|script-src-elem[^;]*unsafe-inline/,
  );
  assert.match(policy, /script-src-attr 'none'/);
  assert.match(policy, /frame-ancestors 'none'/);
  for (const header of [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Strict-Transport-Security',
  ])
    assert.match(policy, new RegExp(`add_header ${header} [^\\n]+ always;`));
});
