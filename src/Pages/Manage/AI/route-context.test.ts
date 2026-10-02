import { positiveIntParam, textParam } from './route-context';

it('accepts only safe route context values', () => {
  expect(positiveIntParam('?psid=12', 'psid')).toBe(12);
  expect(positiveIntParam('?psid=-1', 'psid')).toBeUndefined();
  expect(positiveIntParam('?psid=1.5', 'psid')).toBeUndefined();
  expect(textParam('?username=alice%2Bta', 'username')).toBe('alice+ta');
  expect(textParam('?username=%20', 'username')).toBeUndefined();
});
