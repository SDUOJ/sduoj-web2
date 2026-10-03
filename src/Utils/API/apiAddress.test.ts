import apiAddress from './apiAddress';

it('uses same-origin development API and asset addresses', () => {
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'development' });
  expect(apiAddress()).toEqual({
    CLIENT_SERVER: '',
    MANAGE_SERVER: '',
    FRONT_SERVER: window.location.origin,
    SOCKET_SERVER: window.location.origin.replace(/^http/, 'ws'),
  });
});

it('retains the existing production deployment addresses', () => {
  jest.replaceProperty(process, 'env', {
    ...process.env,
    NODE_ENV: 'production',
    REACT_APP_API_ORIGIN: 'https://oj.qd.sdu.edu.cn',
    REACT_APP_FRONT_ORIGIN: 'https://oj.qd.sdu.edu.cn',
    REACT_APP_SOCKET_ORIGIN: 'wss://oj.qd.sdu.edu.cn',
  });
  expect(apiAddress().CLIENT_SERVER).toBe('https://oj.qd.sdu.edu.cn');
  expect(apiAddress().SOCKET_SERVER).toBe('wss://oj.qd.sdu.edu.cn');
});

it('rejects insecure or unapproved production origins', () => {
  jest.replaceProperty(process, 'env', {
    ...process.env,
    NODE_ENV: 'production',
    REACT_APP_API_ORIGIN: 'http://oj.qd.sdu.edu.cn',
    REACT_APP_FRONT_ORIGIN: 'https://oj.qd.sdu.edu.cn',
    REACT_APP_SOCKET_ORIGIN: 'wss://oj.qd.sdu.edu.cn',
    REACT_APP_ALLOWED_HOSTS: 'oj.qd.sdu.edu.cn',
  });
  expect(() => apiAddress()).toThrow('REACT_APP_API_ORIGIN must use https:');

  jest.replaceProperty(process, 'env', {
    ...process.env,
    NODE_ENV: 'production',
    REACT_APP_API_ORIGIN: 'https://evil.example.test',
    REACT_APP_FRONT_ORIGIN: 'https://oj.qd.sdu.edu.cn',
    REACT_APP_SOCKET_ORIGIN: 'wss://oj.qd.sdu.edu.cn',
    REACT_APP_ALLOWED_HOSTS: 'oj.qd.sdu.edu.cn',
  });
  expect(() => apiAddress()).toThrow('REACT_APP_API_ORIGIN host is not in REACT_APP_ALLOWED_HOSTS');
});
