export default function apiAddress() {
  const origin = window.location.origin;
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedHosts = new Set(
    (process.env.REACT_APP_ALLOWED_HOSTS ?? 'oj.qd.sdu.edu.cn')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );
  const validateOrigin = (
    value: string,
    field: string,
    protocol: 'https:' | 'wss:' | 'http:' | 'ws:',
  ) => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error(`${field} must be an absolute URL`);
    }
    if (isProduction && parsed.protocol !== protocol.replace('ws:', 'wss:')) {
      throw new Error(`${field} must use ${protocol.replace('ws:', 'wss:')}`);
    }
    if (isProduction && !allowedHosts.has(parsed.hostname.toLowerCase())) {
      throw new Error(`${field} host is not in REACT_APP_ALLOWED_HOSTS`);
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
