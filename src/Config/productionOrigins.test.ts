const { validateProductionOrigins } = require('../../config/validate-production-origins.cjs') as {
  validateProductionOrigins: (environment: Record<string, string>) => void;
};

const production = {
  REACT_APP_API_ORIGIN: 'https://oj.qd.sdu.edu.cn',
  REACT_APP_FRONT_ORIGIN: 'https://oj.qd.sdu.edu.cn',
  REACT_APP_SOCKET_ORIGIN: 'wss://oj.qd.sdu.edu.cn',
};

it('accepts the reviewed production deployment origins', () => {
  expect(() => validateProductionOrigins(production)).not.toThrow();
});

it.each([
  ['REACT_APP_API_ORIGIN', 'http://oj.qd.sdu.edu.cn'],
  ['REACT_APP_SOCKET_ORIGIN', 'ws://oj.qd.sdu.edu.cn'],
  ['REACT_APP_FRONT_ORIGIN', 'https://unreviewed.example'],
  ['REACT_APP_API_ORIGIN', 'https://user:password@oj.qd.sdu.edu.cn'],
  ['REACT_APP_API_ORIGIN', 'https://oj.qd.sdu.edu.cn/path?query=1#fragment'],
  ['REACT_APP_API_ORIGIN', 'https://oj.qd.sdu.edu.cn:8443'],
])('blocks invalid build configuration %s=%s', (field, value) => {
  expect(() => validateProductionOrigins({ ...production, [field]: value })).toThrow();
});
