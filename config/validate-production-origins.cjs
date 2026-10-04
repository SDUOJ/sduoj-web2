const approvedHosts = require('./production-service-hosts.json');

function validateProductionOrigins(environment) {
  if (environment.REACT_APP_DEPLOYMENT_ENV === 'test') {
    const origin = 'http://127.0.0.1:4173';
    if (
      environment.REACT_APP_API_ORIGIN !== origin ||
      environment.REACT_APP_FRONT_ORIGIN !== origin ||
      environment.REACT_APP_SOCKET_ORIGIN !== 'ws://127.0.0.1:4173'
    ) {
      throw new Error('Test builds must use the isolated loopback API/front/WebSocket origins');
    }
    return;
  }
  if (
    environment.REACT_APP_DEPLOYMENT_ENV &&
    environment.REACT_APP_DEPLOYMENT_ENV !== 'production'
  ) {
    throw new Error('Unsupported deployment environment');
  }
  const fields = {
    REACT_APP_API_ORIGIN: 'https:',
    REACT_APP_FRONT_ORIGIN: 'https:',
    REACT_APP_SOCKET_ORIGIN: 'wss:',
  };
  for (const [field, protocol] of Object.entries(fields)) {
    const value = environment[field];
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error(`${field} must be an absolute URL`);
    }
    if (parsed.protocol !== protocol) throw new Error(`${field} must use ${protocol}`);
    if (
      !approvedHosts.includes(parsed.hostname) ||
      parsed.port ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error(`${field} must be an approved origin without credentials, port or URL path`);
    }
  }
}

module.exports = { validateProductionOrigins };
