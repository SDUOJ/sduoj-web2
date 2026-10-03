import approvedHosts from '../../../config/production-service-hosts.json';

export default function apiAddress() {
  const origin = window.location.origin;
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedHosts = new Set(approvedHosts);
  const validateOrigin = (value: string, field: string, protocol: 'https:' | 'wss:') => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error(`${field} must be an absolute URL`);
    }
    if (isProduction && parsed.protocol !== protocol) {
      throw new Error(`${field} must use ${protocol}`);
    }
    if (isProduction && !allowedHosts.has(parsed.hostname.toLowerCase())) {
      throw new Error(`${field} host is not in the approved host list`);
    }
    if (
      isProduction &&
      (parsed.username ||
        parsed.password ||
        parsed.port ||
        parsed.pathname !== '/' ||
        parsed.search ||
        parsed.hash)
    ) {
      throw new Error(`${field} must be an origin without credentials, port or URL path`);
    }
    return value.replace(/\/$/, '');
  };
  const configuredClient = process.env.REACT_APP_API_ORIGIN?.replace(/\/$/, '');
  const configuredFront = process.env.REACT_APP_FRONT_ORIGIN?.replace(/\/$/, '');
  const configuredSocket = process.env.REACT_APP_SOCKET_ORIGIN?.replace(/\/$/, '');
  const clientServer = configuredClient
    ? validateOrigin(configuredClient, 'REACT_APP_API_ORIGIN', 'https:')
    : process.env.NODE_ENV === 'development'
      ? ''
      : validateOrigin(origin, 'window.location.origin', 'https:');
  const frontServer = validateOrigin(configuredFront ?? origin, 'REACT_APP_FRONT_ORIGIN', 'https:');
  const socketServer = validateOrigin(
    configuredSocket ?? frontServer.replace(/^http/, 'ws'),
    'REACT_APP_SOCKET_ORIGIN',
    'wss:',
  );
  return {
    CLIENT_SERVER: clientServer,
    MANAGE_SERVER: clientServer,
    FRONT_SERVER: frontServer,
    SOCKET_SERVER: socketServer,
  };
}
