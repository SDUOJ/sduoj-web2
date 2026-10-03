let clearAllCalls = 0;
let clearedOwner = '';

function mockClearAllPendingMedia() {
  clearAllCalls += 1;
  return Promise.resolve();
}

function mockClearPendingMediaForOwner(ownerId: string) {
  clearedOwner = ownerId;
  return Promise.resolve();
}

jest.mock('../../Pages/Manage/AI/interview-media', () => ({
  clearAllPendingMedia: mockClearAllPendingMedia,
  clearPendingMediaForOwner: mockClearPendingMediaForOwner,
}));

import { createAppStore } from './index';

const user = (userId: string) => ({
  userId,
  username: userId,
  nickname: userId,
  studentId: userId,
  roles: ['user' as const],
});

it('clears the previous owner cache on account switch and all cache on logout', async () => {
  const store = createAppStore();
  store.dispatch({ type: 'setUserInfo', data: user('alice') });
  store.dispatch({ type: 'userLogin' });

  store.dispatch({ type: 'setUserInfo', data: user('bob') });
  expect(clearedOwner).toBe('alice');

  store.dispatch({ type: 'userLogout' });
  expect(clearAllCalls).toBe(1);
  await Promise.resolve();
});
