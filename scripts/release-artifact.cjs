const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const manifestName = 'release-manifest.json';
const maxFileBytes = 40 * 1024 * 1024;
const maxTotalBytes = 150 * 1024 * 1024;
const maxFiles = 20000;
const rootFiles = new Set([
  'index.html',
  'asset-manifest.json',
  'manifest.json',
  'robots.txt',
  'logo.png',
  'logo192.png',
  'logo512.png',
  'sduoj.ico',
]);
const assetExtension = /\.(?:js|css|json|png|jpe?g|gif|svg|ico|woff2?|ttf|eot|bin)$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function permitted(filename) {
  if (
    typeof filename !== 'string' ||
    filename.includes('\\') ||
    /[\x00-\x1f\x7f]/.test(filename) ||
    filename
      .split('/')
      .some((part) => !part || part === '.' || part === '..' || part.startsWith('.'))
  ) {
    return false;
  }
  return (
    rootFiles.has(filename) ||
    (/^static\/(?:js|css|media)\//.test(filename) && assetExtension.test(filename)) ||
    (filename.startsWith('vditor/dist/') &&
      (assetExtension.test(filename) ||
        filename.endsWith('.d.ts') ||
        filename.endsWith('/LICENSE')))
  );
}

function inventory(directory) {
  assert(fs.lstatSync(directory).isDirectory(), 'Artifact root must be a real directory');
  const files = [];
  let totalBytes = 0;
  function walk(relative) {
    for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
      const filename = relative ? `${relative}/${entry.name}` : entry.name;
      const absolute = path.join(directory, filename);
      assert(!entry.isSymbolicLink(), `Symlink rejected: ${filename}`);
      if (entry.isDirectory()) {
        assert(/^(?:static|vditor)(?:\/|$)/.test(filename), `Directory rejected: ${filename}`);
        walk(filename);
      } else {
        assert(entry.isFile(), `Non-regular file rejected: ${filename}`);
        if (filename === manifestName) continue;
        assert(permitted(filename), `Path rejected: ${filename}`);
        const size = fs.statSync(absolute).size;
        assert(size <= maxFileBytes, `File size limit exceeded: ${filename}`);
        totalBytes += size;
        assert(totalBytes <= maxTotalBytes, 'Artifact size limit exceeded');
        files.push({
          path: filename,
          size,
          sha256: crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex'),
        });
        assert(files.length <= maxFiles, 'Artifact file count limit exceeded');
      }
    }
  }
  walk('');
  return files.sort((first, second) => first.path.localeCompare(second.path, 'en'));
}

function validateMetadata(manifest, expectedRef, expectedPrefix) {
  assert(manifest?.schemaVersion === 1, 'Unsupported artifact schema');
  assert(/^[a-f0-9]{40}$/.test(manifest.sourceRef), 'Invalid artifact source ref');
  assert(manifest.sourceRef === expectedRef, 'Artifact source ref mismatch');
  assert(/^\/v2(?:-pre)?\/$/.test(manifest.publicPath), 'Invalid artifact public path');
  assert(manifest.publicPath === expectedPrefix, 'Artifact public path mismatch');
  assert(typeof manifest.version === 'string' && manifest.version.length > 0, 'Missing version');
  assert(
    /^\d{4}-\d{2}-\d{2}T/.test(manifest.createdAt) &&
      Number.isFinite(Date.parse(manifest.createdAt)),
    'Invalid creation time',
  );
  assert(/^[A-Za-z0-9._-]{1,128}$/.test(manifest.releaseId), 'Invalid release id');
  assert(Array.isArray(manifest.files) && manifest.files.length <= maxFiles, 'Invalid file list');
}

function validateEntrypoints(directory, manifest) {
  const paths = new Set(manifest.files.map((file) => file.path));
  for (const required of ['index.html', 'asset-manifest.json', 'manifest.json']) {
    assert(paths.has(required), `Required resource missing: ${required}`);
  }
  const resolveResource = (resource) => {
    assert(typeof resource === 'string', 'Invalid resource reference');
    const relative = resource.startsWith(manifest.publicPath)
      ? resource.slice(manifest.publicPath.length)
      : resource;
    assert(!relative.startsWith('/') && permitted(relative), `Invalid resource URL: ${resource}`);
    assert(paths.has(relative), `Referenced resource missing: ${relative}`);
    return relative;
  };
  const assets = JSON.parse(fs.readFileSync(path.join(directory, 'asset-manifest.json'), 'utf8'));
  assert(assets.files && typeof assets.files === 'object', 'Missing webpack resource map');
  assert(Array.isArray(assets.entrypoints) && assets.entrypoints.length > 0, 'Missing entrypoints');
  Object.values(assets.files).forEach(resolveResource);
  assets.entrypoints.forEach(resolveResource);
  assert(
    assets.entrypoints.some((entry) => /runtime[^/]*\.[a-f0-9]+\.js$/.test(entry)),
    'Missing runtime entrypoint',
  );
  assert(
    assets.entrypoints.some((entry) => /main\.[a-f0-9]+\.js$/.test(entry)),
    'Missing main entrypoint',
  );
  const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
  assert(/<div\s+id=["']root["']\s*>/.test(html), 'Missing React root');
  const scripts = Array.from(html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g), (match) =>
    resolveResource(match[1]),
  );
  assert(scripts.length > 0, 'Missing HTML scripts');
  for (const entry of assets.entrypoints.filter((entry) => entry.endsWith('.js'))) {
    assert(scripts.includes(resolveResource(entry)), `Entrypoint not linked by HTML: ${entry}`);
  }
  const pwa = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
  assert(pwa.start_url === `${manifest.publicPath}home`, 'PWA public path mismatch');
}

function verify(directory, expectedRef, expectedPrefix) {
  assert(/^[a-f0-9]{40}$/.test(expectedRef), 'Expected source ref must be a full Git SHA');
  const manifestPath = path.join(directory, manifestName);
  assert(fs.lstatSync(manifestPath).isFile(), 'Manifest must be a regular file');
  assert(fs.statSync(manifestPath).size <= 8 * 1024 * 1024, 'Manifest size limit exceeded');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  validateMetadata(manifest, expectedRef, expectedPrefix);
  const actual = inventory(directory);
  assert(manifest.files.length === actual.length, 'Artifact file count mismatch');
  for (let index = 0; index < actual.length; index++) {
    const claimed = manifest.files[index];
    const file = actual[index];
    assert(
      claimed?.path === file.path && permitted(claimed.path),
      `Artifact path mismatch: ${file.path}`,
    );
    assert(claimed.size === file.size, `Artifact size mismatch: ${file.path}`);
    assert(claimed.sha256 === file.sha256, `Artifact hash mismatch: ${file.path}`);
  }
  validateEntrypoints(directory, manifest);
  return {
    status: 'verified',
    releaseId: manifest.releaseId,
    sourceRef: manifest.sourceRef,
    publicPath: manifest.publicPath,
    manifestSha256: crypto.createHash('sha256').update(fs.readFileSync(manifestPath)).digest('hex'),
    fileCount: actual.length,
    totalBytes: actual.reduce((sum, file) => sum + file.size, 0),
  };
}

function create(directory, metadata) {
  const manifest = { schemaVersion: 1, ...metadata, files: inventory(directory) };
  validateMetadata(manifest, metadata.sourceRef, metadata.publicPath);
  validateEntrypoints(directory, manifest);
  const destination = path.join(directory, manifestName);
  if (fs.existsSync(destination))
    assert(fs.lstatSync(destination).isFile(), 'Manifest must be a regular file');
  fs.writeFileSync(destination, JSON.stringify(manifest, null, 2) + '\n');
  return verify(directory, metadata.sourceRef, metadata.publicPath);
}

function main() {
  const [command, directory = 'build', sourceRef, publicPath] = process.argv.slice(2);
  let report;
  if (command === 'create') {
    const project = path.resolve(__dirname, '..');
    const ref = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: project,
      encoding: 'utf8',
    }).trim();
    assert(
      !process.env.GITHUB_SHA || process.env.GITHUB_SHA === ref,
      'Checkout does not match CI source ref',
    );
    report = create(path.resolve(directory), {
      sourceRef: ref,
      publicPath: sourceRef || '/v2/',
      version: JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8')).version,
      createdAt: new Date().toISOString(),
      releaseId: process.env.SDUOJ_RELEASE_ID || `${Date.now()}-${ref.slice(0, 12)}`,
    });
  } else {
    assert(
      command === 'verify',
      'Usage: release-artifact.cjs create|verify [directory] [expected-ref] [public-path]',
    );
    report = verify(path.resolve(directory), sourceRef, publicPath);
  }
  console.log(JSON.stringify(report, null, 2));
}

module.exports = { create, verify, permitted };
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Artifact rejected: ${error.message}`);
    process.exitCode = 1;
  }
}
