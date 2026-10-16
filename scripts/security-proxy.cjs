const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawnSync } = require('node:child_process');
const { WebSocketServer } = require('ws');
const { MAX_CSP_REPORT_BYTES, normalizeCspReports } = require('./security-report.cjs');

const project = path.resolve(__dirname, '..');
const output = path.join(project, 'output', 'audit', 'R-24', 'proxy');
const name = `sduoj-header-audit-${process.pid}`;
const image = process.env.SDUOJ_SECURITY_NGINX_IMAGE || 'nginx:1.28-alpine';
const realServices = process.env.SDUOJ_SECURITY_REAL_SERVICES === '1';
const gatewayPortText = process.env.SDUOJ_SECURITY_GATEWAY_PORT || '8080';
if (!/^[1-9]\d{0,4}$/.test(gatewayPortText) || Number(gatewayPortText) > 65535)
  throw new Error('SDUOJ_SECURITY_GATEWAY_PORT must be an integer from 1 to 65535');
const gatewayPort = Number(gatewayPortText);
const reports = [];
let started = false;
const command = (executable, args) => {
  const result = spawnSync(executable, args, { encoding: 'utf8', timeout: 30000 });
  if (result.error || result.status !== 0)
    throw new Error(result.error?.message || result.stderr || `${executable} failed`);
  return result.stdout;
};

const server = http.createServer((request, response) => {
  const route = new URL(request.url, 'http://localhost').pathname;
  if (!realServices && route === '/api/user/getProfile')
    return response
      .writeHead(401, { 'Content-Type': 'application/json' })
      .end(JSON.stringify({ code: 401, data: null, message: 'isolated header fixture' }));
  if (route === '/__fixture/ready') return response.writeHead(200).end('ready');
  if (route === '/__fixture/embed')
    return response
      .writeHead(200, { 'Content-Type': 'text/html' })
      .end(
        '<!doctype html><iframe src="http://127.0.0.1:4173/v2/login" title="forbidden-embedding"></iframe>',
      );
  if (route === '/__fixture/reports' && request.method === 'GET')
    return response
      .writeHead(200, { 'Content-Type': 'application/json' })
      .end(JSON.stringify(reports));
  if (route === '/__fixture/reports' && request.method === 'DELETE') {
    reports.length = 0;
    return response.writeHead(204).end();
  }
  if (route !== '/_security/csp' || request.method !== 'POST') return response.writeHead(404).end();
  const chunks = [];
  let size = 0;
  request.on('data', (chunk) => {
    size += chunk.length;
    if (size <= MAX_CSP_REPORT_BYTES) chunks.push(chunk);
  });
  request.on('end', () => {
    if (size > MAX_CSP_REPORT_BYTES) return response.writeHead(413).end();
    try {
      const sanitized = normalizeCspReports(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      reports.push(...sanitized);
      if (reports.length > 2000) reports.splice(0, reports.length - 2000);
      return response.writeHead(204).end();
    } catch {
      return response.writeHead(400).end();
    }
  });
});
const sockets = new WebSocketServer({ server, path: '/__fixture/ws' });
sockets.on('connection', (socket) => socket.on('message', (data) => socket.send(data.toString())));

function cleanup() {
  if (started) {
    spawnSync('docker', ['rm', '-f', name], { encoding: 'utf8', timeout: 10000 });
    started = false;
  }
  sockets.clients.forEach((socket) => socket.terminate());
  sockets.close();
  server.close();
}
process.once('SIGINT', () => {
  cleanup();
  process.exit(130);
});
process.once('SIGTERM', () => {
  cleanup();
  process.exit(143);
});
process.once('exit', cleanup);

async function main() {
  if (!fs.existsSync(path.join(project, 'build-test', 'index.html')))
    throw new Error('Run yarn build:test before the security proxy');
  fs.mkdirSync(output, { recursive: true });
  command('openssl', [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-days',
    '2',
    '-subj',
    '/CN=localhost',
    '-keyout',
    path.join(output, 'key.pem'),
    '-out',
    path.join(output, 'certificate.pem'),
  ]);
  const locations = `
    include /etc/nginx/security/web2-locations.conf;
    location /__fixture/ {
      proxy_pass http://host.docker.internal:4174;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
    }
  `;
  const configuration = `events {}\nhttp {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    include /etc/nginx/security/security-maps.conf;
    map $http_upgrade $connection_upgrade { default upgrade; '' close; }
    upstream sduoj_gateway { server host.docker.internal:${realServices ? gatewayPort : 4174}; }
    upstream sduoj_security_reports { server host.docker.internal:4174; }
    server { listen 8080; server_name localhost; ${locations} }
    server {
      listen 8443 ssl; server_name localhost;
      ssl_certificate /etc/nginx/audit/certificate.pem;
      ssl_certificate_key /etc/nginx/audit/key.pem;
      ssl_protocols TLSv1.2 TLSv1.3;
      ${locations}
    }
  }\n`;
  fs.writeFileSync(path.join(output, 'nginx.conf'), configuration);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(4174, '0.0.0.0', resolve);
  });
  const imageInfo = JSON.parse(command('docker', ['image', 'inspect', image]))[0];
  const dockerArgs = [
    'run',
    '--rm',
    '-d',
    '--name',
    name,
    '--add-host=host.docker.internal:host-gateway',
    '-p',
    '127.0.0.1:4173:8080',
    '-p',
    '127.0.0.1:9443:8443',
    '-v',
    `${path.join(project, 'build-test')}:/usr/share/nginx/html/v2:ro`,
    '-v',
    `${path.join(project, 'config', 'nginx')}:/etc/nginx/security:ro`,
    '-v',
    `${output}:/etc/nginx/audit:ro`,
    '-v',
    `${path.join(output, 'nginx.conf')}:/etc/nginx/nginx.conf:ro`,
    imageInfo.Id,
  ];
  started = true;
  command('docker', dockerArgs);
  command('docker', ['exec', name, 'nginx', '-t']);
  const nginxVersion = command('docker', ['exec', name, 'sh', '-c', 'nginx -v 2>&1']).trim();
  fs.writeFileSync(
    path.join(output, 'manifest.json'),
    JSON.stringify(
      {
        timestampUtc: new Date().toISOString(),
        imageId: imageInfo.Id,
        image: imageInfo.RepoDigests,
        container: name,
        nginxCheck: 'nginx -t exit 0',
        nginxVersion,
        ports: [4173, 9443],
        serviceMode: realServices ? 'real-local-gateway' : 'isolated-auth-error-fixture',
        realGateway: realServices ? `http://host.docker.internal:${gatewayPort}` : null,
        fixtureEndpoints: ['/__fixture/reports', '/__fixture/ws'],
      },
      null,
      2,
    ),
  );
  console.log(`Security nginx ready: http://127.0.0.1:4173 (TLS headers: https://127.0.0.1:9443)`);
}

main().catch((error) => {
  console.error(error.message);
  cleanup();
  process.exitCode = 1;
});
