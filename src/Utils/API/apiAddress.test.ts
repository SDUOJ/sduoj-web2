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
  expect(apiAddress('https://oj.qd.sdu.edu.cn').CLIENT_SERVER).toBe('https://oj.qd.sdu.edu.cn');
  expect(apiAddress('https://oj.qd.sdu.edu.cn').SOCKET_SERVER).toBe('wss://oj.qd.sdu.edu.cn');
});

it('rejects a production artifact on staging or loopback before any service is selected', () => {
  jest.replaceProperty(process, 'env', {
    ...process.env,
    NODE_ENV: 'production',
    REACT_APP_API_ORIGIN: 'https://oj.qd.sdu.edu.cn',
    REACT_APP_FRONT_ORIGIN: 'https://oj.qd.sdu.edu.cn',
    REACT_APP_SOCKET_ORIGIN: 'wss://oj.qd.sdu.edu.cn',
  });
  expect(() => apiAddress('https://staging.example')).toThrow('Deployment environment mismatch');
  expect(() => apiAddress('http://127.0.0.1:4173')).toThrow('Deployment environment mismatch');
});

it('keeps isolated test artifacts on loopback and rejects a production API override', () => {
  const configuration = {
    ...process.env,
    NODE_ENV: 'production',
    REACT_APP_DEPLOYMENT_ENV: 'test',
    REACT_APP_API_ORIGIN: 'http://127.0.0.1:4173',
    REACT_APP_FRONT_ORIGIN: 'http://127.0.0.1:4173',
    REACT_APP_SOCKET_ORIGIN: 'ws://127.0.0.1:4173',
  };
  jest.replaceProperty(process, 'env', configuration);
  expect(apiAddress('http://127.0.0.1:4173').CLIENT_SERVER).toBe('http://127.0.0.1:4173');
  expect(() => apiAddress('https://oj.qd.sdu.edu.cn')).toThrow('Deployment environment mismatch');
  jest.replaceProperty(process, 'env', {
    ...configuration,
    REACT_APP_API_ORIGIN: 'https://oj.qd.sdu.edu.cn',
  });
  expect(() => apiAddress('http://127.0.0.1:4173')).toThrow('isolated loopback');
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
  expect(() => apiAddress()).toThrow('REACT_APP_API_ORIGIN host is not in the approved host list');
});
