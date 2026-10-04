const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { permitted, verify } = require('./release-artifact.cjs');

const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const parseJson = (bytes, label) => {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Error(`Invalid JSON: ${label}`);
  }
};

function validateTarget(value, loopbackAudit) {
  const target = new URL(value);
  assert(
    value === target.origin + target.pathname &&
      !target.username &&
      !target.password &&
      !target.search &&
      !target.hash &&
      /^\/v2(?:-pre)?\/$/.test(target.pathname),
    'Target must be a canonical deployment URL without credentials, query or hash',
  );
  if (loopbackAudit)
    assert(
      target.origin === 'http://127.0.0.1:4173' && target.pathname === '/v2/',
      'Loopback audit is limited to the isolated test artifact origin',
    );
  else assert(target.protocol === 'https:', 'Deployment smoke requires HTTPS');
  return target;
}

async function smoke(value, options = {}) {
  const target = validateTarget(value, options.loopbackAudit === true);
  const deadline = AbortSignal.timeout(options.overallTimeoutMs ?? 180000);
  const cancellation = new AbortController();
  const requests = [];
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sduoj-deployment-smoke-'));
  const onInterrupt = () => cancellation.abort(new Error('Deployment smoke interrupted'));
  process.once('SIGINT', onInterrupt);
  process.once('SIGTERM', onInterrupt);
  const resourceUrl = (relative) =>
    new URL(relative.split('/').map(encodeURIComponent).join('/'), target).href;
  const read = async (url, maximum, status = 200) => {
    const response = await fetch(url, {
      redirect: 'error',
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.any([
        deadline,
        cancellation.signal,
        AbortSignal.timeout(options.requestTimeoutMs ?? 10000),
      ]),
    });
    const route = new URL(url).pathname;
    assert(response.status === status, `${route}: expected HTTP ${status}, got ${response.status}`);
    for (const header of [
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'referrer-policy',
      'permissions-policy',
    ])
      assert(response.headers.get(header), `${route}: missing ${header}`);
    assert(
      response.headers.get('x-content-type-options') === 'nosniff',
      `${route}: missing nosniff`,
    );
    assert(response.headers.get('x-frame-options') === 'DENY', `${route}: embedding not denied`);
    if (target.protocol === 'https:')
      assert(
        /max-age=[1-9][0-9]*/.test(response.headers.get('strict-transport-security') ?? ''),
        `${route}: missing HSTS`,
      );
    const chunks = [];
    let length = 0;
    for await (const chunk of response.body) {
      length += chunk.length;
      assert(length <= maximum, `${route}: response exceeds size bound`);
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);
    const record = {
      path: route,
      status: response.status,
      contentType: response.headers.get('content-type') ?? '',
      cacheControl: response.headers.get('cache-control') ?? '',
      bytes: length,
      sha256: digest(bytes),
    };
    requests.push(record);
    return { bytes, record };
  };
  const noCache = (record) =>
    assert(
      /(?:no-cache|no-store|max-age=0)(?:\b|,)/.test(record.cacheControl),
      `${record.path}: mutable metadata must not be cached`,
    );
  try {
    const manifestResponse = await read(resourceUrl('release-manifest.json'), 8 * 1024 * 1024);
    noCache(manifestResponse.record);
    assert(/application\/json/.test(manifestResponse.record.contentType), 'Manifest must be JSON');
    if (options.expectedManifest)
      assert(
        manifestResponse.record.sha256 === digest(fs.readFileSync(options.expectedManifest)),
        'Deployed manifest differs from the staged artifact',
      );
    if (options.expectedSha256)
      assert(
        /^[a-f0-9]{64}$/.test(options.expectedSha256) &&
          manifestResponse.record.sha256 === options.expectedSha256,
        'Deployed manifest differs from the known-good release',
      );
    const manifest = parseJson(manifestResponse.bytes, 'release manifest');
    assert(manifest.schemaVersion === 1, 'Unsupported release manifest');
    assert(/^[a-f0-9]{40}$/.test(manifest.sourceRef), 'Invalid release source ref');
    assert(manifest.publicPath === target.pathname, 'Manifest prefix mismatch');
    assert(manifest.deployment?.frontOrigin === target.origin, 'Manifest target origin mismatch');
    assert(
      manifest.deployment.environment === (options.loopbackAudit ? 'test' : 'production'),
      'Manifest deployment environment mismatch',
    );
    assert(
      Array.isArray(manifest.files) && manifest.files.length <= 20000,
      'Invalid release file list',
    );
    const names = new Set();
    let totalBytes = 0;
    for (const file of manifest.files) {
      assert(permitted(file?.path) && !names.has(file.path), 'Unsafe or duplicate artifact path');
      assert(
        Number.isSafeInteger(file.size) && file.size >= 0 && file.size <= 40 * 1024 * 1024,
        'Invalid artifact size',
      );
      assert(/^[a-f0-9]{64}$/.test(file.sha256), 'Invalid artifact hash');
      names.add(file.path);
      totalBytes += file.size;
      assert(totalBytes <= 150 * 1024 * 1024, 'Artifact exceeds total size bound');
    }
    fs.writeFileSync(path.join(directory, 'release-manifest.json'), manifestResponse.bytes);
    let cursor = 0;
    let downloadFailure;
    const workers = Array.from({ length: Math.min(8, manifest.files.length) }, async () => {
      try {
        while (cursor < manifest.files.length) {
          const file = manifest.files[cursor++];
          const { bytes, record } = await read(resourceUrl(file.path), file.size);
          assert(record.sha256 === file.sha256, `${file.path}: deployed content hash mismatch`);
          if (/^(?:static|vditor)\/.*\.(js|css)$/.test(file.path)) {
            assert(
              /immutable/.test(record.cacheControl) && /max-age=31536000/.test(record.cacheControl),
              `${file.path}: missing immutable cache policy`,
            );
            assert(
              file.path.endsWith('.js')
                ? /(?:javascript|ecmascript)/.test(record.contentType)
                : /text\/css/.test(record.contentType),
              `${file.path}: incorrect executable asset MIME type`,
            );
          }
          if (['index.html', 'asset-manifest.json', 'manifest.json'].includes(file.path))
            noCache(record);
          const destination = path.join(directory, file.path);
          fs.mkdirSync(path.dirname(destination), { recursive: true });
          fs.writeFileSync(destination, bytes);
        }
      } catch (error) {
        downloadFailure ??= error;
        cancellation.abort(error);
        throw error;
      }
    });
    const results = await Promise.allSettled(workers);
    const failure = results.find((result) => result.status === 'rejected');
    if (failure) throw downloadFailure;
    const artifact = verify(
      directory,
      manifest.sourceRef,
      target.pathname,
      options.loopbackAudit ? undefined : value,
    );
    const indexHash = manifest.files.find((file) => file.path === 'index.html').sha256;
    for (const relative of ['', 'login', '__deployment-smoke-missing-route__']) {
      const { record } = await read(new URL(relative, target).href, 40 * 1024 * 1024);
      assert(
        record.sha256 === indexHash,
        `${record.path}: SPA fallback differs from deployed HTML`,
      );
      noCache(record);
    }
    const missing = await read(
      resourceUrl('static/js/__deployment-smoke-missing__.js'),
      65536,
      404,
    );
    assert(missing.record.sha256 !== indexHash, 'Missing static asset returned the SPA entrypoint');
    const api = await read(new URL('/api/user/getProfile', target).href, 65536, 401);
    assert(/application\/json/.test(api.record.contentType), 'API returned non-JSON content');
    assert(parseJson(api.bytes, 'anonymous API').code === 401, 'Anonymous API envelope mismatch');
    return {
      ...artifact,
      target: value,
      mode: options.loopbackAudit ? 'loopback-audit' : 'deployment',
      requests,
    };
  } finally {
    process.removeListener('SIGINT', onInterrupt);
    process.removeListener('SIGTERM', onInterrupt);
    cancellation.abort();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

async function main(args) {
  const [target, ...flags] = args;
  const options = {};
  for (let index = 0; index < flags.length; index++) {
    const flag = flags[index];
    if (flag === '--loopback-audit') options.loopbackAudit = true;
    else if (flag === '--expected-manifest' || flag === '--expected-sha256') {
      assert(flags[index + 1], `Missing value for ${flag}`);
      options[flag === '--expected-manifest' ? 'expectedManifest' : 'expectedSha256'] =
        flags[++index];
    } else throw new Error('Unknown deployment smoke option');
  }
  const report = await smoke(target, options);
  console.log(JSON.stringify(report, null, 2));
}

if (require.main === module)
  main(process.argv.slice(2)).catch((error) => {
    console.log(
      JSON.stringify({
        status: 'failed',
        message: error instanceof SyntaxError ? 'Invalid artifact JSON' : error.message,
      }),
    );
    process.exitCode = 1;
  });

module.exports = { smoke, validateTarget };
