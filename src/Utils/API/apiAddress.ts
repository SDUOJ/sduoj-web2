export default function apiAddress() {
  if (process.env.NODE_ENV === 'development') {
    const origin = window.location.origin;
    return {
      CLIENT_SERVER: '',
      MANAGE_SERVER: '',
      FRONT_SERVER: origin,
      SOCKET_SERVER: origin.replace(/^http/, 'ws'),
    };
  }
  return {
    CLIENT_SERVER: 'https://oj.qd.sdu.edu.cn',
    MANAGE_SERVER: 'https://oj.qd.sdu.edu.cn',
    FRONT_SERVER: 'https://oj.qd.sdu.edu.cn',
    SOCKET_SERVER: 'wss://oj.qd.sdu.edu.cn',
  };
}
