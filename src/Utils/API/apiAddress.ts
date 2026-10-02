export default function apiAddress() {
  const origin = window.location.origin;
  const configuredClient = process.env.REACT_APP_API_ORIGIN?.replace(/\/$/, '');
  const configuredFront = process.env.REACT_APP_FRONT_ORIGIN?.replace(/\/$/, '');
  const configuredSocket = process.env.REACT_APP_SOCKET_ORIGIN?.replace(/\/$/, '');
  const clientServer = configuredClient ?? (process.env.NODE_ENV === 'development' ? '' : origin);
  const frontServer = configuredFront ?? origin;
  const socketServer = configuredSocket ?? frontServer.replace(/^http/, 'ws');
  return {
    CLIENT_SERVER: clientServer,
    MANAGE_SERVER: clientServer,
    FRONT_SERVER: frontServer,
    SOCKET_SERVER: socketServer,
  };
}
