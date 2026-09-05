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
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' });
  expect(apiAddress().CLIENT_SERVER).toBe('https://oj.qd.sdu.edu.cn');
  expect(apiAddress().SOCKET_SERVER).toBe('wss://oj.qd.sdu.edu.cn');
});
