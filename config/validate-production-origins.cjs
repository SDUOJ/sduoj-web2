const approvedHosts = require('./production-service-hosts.json');

function validateProductionOrigins(environment) {
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
