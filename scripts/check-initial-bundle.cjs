const fs = require('node:fs');
const path = require('node:path');

const buildDirectory = path.resolve(__dirname, '..', 'build');
const indexPath = path.join(buildDirectory, 'index.html');
const maxInitialJavaScriptBytes = 5 * 1024 * 1024;

if (!fs.existsSync(indexPath)) {
  throw new Error('build/index.html is missing; run yarn build first.');
}

const html = fs.readFileSync(indexPath, 'utf8');
const scripts = Array.from(html.matchAll(/<script[^>]+src="([^"]+\.js)"/g), (match) => match[1]);
const initialJavaScript = scripts.map((asset) => asset.replace(/^\/v2\//, ''));
const missing = initialJavaScript.filter(
  (asset) => !fs.existsSync(path.join(buildDirectory, asset)),
);
if (missing.length) {
  throw new Error(`Initial JavaScript assets are missing: ${missing.join(', ')}`);
}

const vditorInitialAssets = initialJavaScript.filter((asset) => /vditor/i.test(asset));
if (vditorInitialAssets.length) {
  throw new Error(
    `Vditor must stay out of the initial entrypoint: ${vditorInitialAssets.join(', ')}`,
  );
}

const totalBytes = initialJavaScript.reduce(
  (sum, asset) => sum + fs.statSync(path.join(buildDirectory, asset)).size,
  0,
);
if (totalBytes > maxInitialJavaScriptBytes) {
  throw new Error(
    `Initial JavaScript budget exceeded: ${totalBytes} bytes > ${maxInitialJavaScriptBytes} bytes`,
  );
}

console.log(
  `Initial JavaScript: ${initialJavaScript.length} assets, ${totalBytes} bytes; Vditor is deferred.`,
);
