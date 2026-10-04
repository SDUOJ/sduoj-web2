const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const releases = {
  'linux-x64': [
    {
      name: 'actionlint',
      version: '1.7.7',
      url: 'https://github.com/rhysd/actionlint/releases/download/v1.7.7/actionlint_1.7.7_linux_amd64.tar.gz',
      sha256: '023070a287cd8cccd71515fedc843f1985bf96c436b7effaecce67290e7e0757',
      executable: 'actionlint',
    },
    {
      name: 'shellcheck',
      version: '0.11.0',
      url: 'https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.xz',
      sha256: '8c3be12b05d5c177a04c29e3c78ce89ac86f1595681cab149b65b97c4e227198',
      executable: 'shellcheck-v0.11.0/shellcheck',
    },
  ],
  'darwin-arm64': [
    {
      name: 'actionlint',
      version: '1.7.7',
      url: 'https://github.com/rhysd/actionlint/releases/download/v1.7.7/actionlint_1.7.7_darwin_arm64.tar.gz',
      sha256: '2693315b9093aeacb4ebd91a993fea54fc215057bf0da2659056b4bc033873db',
      executable: 'actionlint',
    },
    {
      name: 'shellcheck',
      version: '0.11.0',
      url: 'https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.darwin.aarch64.tar.xz',
      sha256: '56affdd8de5527894dca6dc3d7e0a99a873b0f004d7aabc30ae407d3f48b0a79',
      executable: 'shellcheck-v0.11.0/shellcheck',
    },
  ],
};

function install(platform = `${process.platform}-${process.arch}`) {
  const tools = releases[platform];
  if (!tools) throw new Error(`Unsupported static-checker platform: ${platform}`);
  const root = path.resolve(__dirname, '../output/static-checkers');
  fs.mkdirSync(path.join(root, 'bin'), { recursive: true });
  for (const tool of tools) {
    const temporary = fs.mkdtempSync(path.join(root, `${tool.name}-`));
    try {
      const archive = path.join(temporary, 'release.tar');
      execFileSync(
        'curl',
        [
          '--fail',
          '--silent',
          '--show-error',
          '--location',
          '--connect-timeout',
          '10',
          '--max-time',
          '120',
          tool.url,
          '-o',
          archive,
        ],
        { stdio: 'inherit', timeout: 125000 },
      );
      const digest = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
      if (digest !== tool.sha256) throw new Error(`Static-checker checksum mismatch: ${tool.name}`);
      execFileSync('tar', ['-xf', archive, '-C', temporary], { stdio: 'inherit', timeout: 30000 });
      const destination = path.join(root, 'bin', tool.name);
      fs.copyFileSync(path.join(temporary, tool.executable), destination);
      fs.chmodSync(destination, 0o755);
      console.log(`Installed ${tool.name} ${tool.version}: verified SHA256 ${tool.sha256}`);
    } finally {
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  }
}

module.exports = { releases, install };
if (require.main === module) {
  try {
    if (process.argv.includes('--plan'))
      console.log(JSON.stringify(releases[`${process.platform}-${process.arch}`], null, 2));
    else install();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
