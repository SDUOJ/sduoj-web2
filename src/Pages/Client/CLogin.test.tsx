import { loginDestination } from './CLogin';

it('decodes and preserves the complete local return route', () => {
  const target = '/v2/problem?tag=a%26b&page=2#results';
  expect(loginDestination('?to=' + encodeURIComponent(target), 'http://localhost')).toBe(target);
});

it.each([
  'https://example.com/v2/user',
  '//example.com/v2/user',
  '/v2/../outside',
  '/v2/login',
  'javascript:alert(1)',
  '/v20/problem',
])('falls back for invalid return target %s', (target) => {
  expect(loginDestination('?to=' + encodeURIComponent(target), 'http://localhost')).toBe(
    '/v2/home',
  );
});
