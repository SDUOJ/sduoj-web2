import { canAccessManage } from './MLayout';

it('requires an administrator role for the management layout', () => {
  expect(canAccessManage(undefined)).toBe(false);
  expect(canAccessManage(['user'] as any)).toBe(false);
  expect(canAccessManage(['admin'] as any)).toBe(true);
  expect(canAccessManage(['superadmin'] as any)).toBe(true);
});
