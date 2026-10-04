const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function assetRevision(directory) {
  const files = [];
  function walk(relative) {
    for (const entry of fs.readdirSync(path.join(directory, relative), { withFileTypes: true })) {
      const filename = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Vditor symlink rejected: ${filename}`);
      if (entry.isDirectory()) walk(filename);
      else if (entry.isFile()) files.push(filename);
      else throw new Error(`Vditor non-regular file rejected: ${filename}`);
    }
  }
  walk('');
  if (!files.length) throw new Error('Vditor distribution is empty');
  const digest = crypto.createHash('sha256');
  for (const filename of files.sort()) {
    const hash = crypto
      .createHash('sha256')
      .update(fs.readFileSync(path.join(directory, filename)))
      .digest('hex');
    digest.update(`${filename}\0${hash}\n`);
  }
  return digest.digest('hex');
}

const directory = path.resolve(__dirname, '../public/vditor/dist');
const revision = assetRevision(directory);
module.exports = { assetRevision, directory, revision };
