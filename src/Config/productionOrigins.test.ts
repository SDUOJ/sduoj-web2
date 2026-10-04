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

it('allows only the exact isolated test service origins in test builds', () => {
  const environment = {
    REACT_APP_DEPLOYMENT_ENV: 'test',
    REACT_APP_API_ORIGIN: 'http://127.0.0.1:4173',
    REACT_APP_FRONT_ORIGIN: 'http://127.0.0.1:4173',
    REACT_APP_SOCKET_ORIGIN: 'ws://127.0.0.1:4173',
  };
  expect(() => validateProductionOrigins(environment)).not.toThrow();
  expect(() =>
    validateProductionOrigins({
      ...environment,
      REACT_APP_API_ORIGIN: production.REACT_APP_API_ORIGIN,
    }),
  ).toThrow('isolated loopback');
  expect(() =>
    validateProductionOrigins({ ...production, REACT_APP_DEPLOYMENT_ENV: 'staging' }),
  ).toThrow('Unsupported deployment');
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
