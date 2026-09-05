import MockAdapter from 'axios-mock-adapter';
import request, { service } from '../../Utils/API/request';
import { requestConstraintError } from './requests';
import transport from './transport.json';

jest.mock('antd', () => ({ message: { error: jest.fn() } }));

it.each([
  ['/manage/problem/createDescription', { title: 'a'.repeat(17) }],
  ['/manage/problem/update', { timeLimit: 2147483648 }],
  ['/manage/problem/update', { checkpoints: [{ checkpointScore: 2147483648 }] }],
  ['/manage/problem/updateCheckpoints', { checkpoints: [{ score: 65536 }] }],
  ['/manage/group/update', { title: 'a'.repeat(46) }],
  ['/manage/notice/create', { text: 'a'.repeat(20001) }],
  ['/manage/contest/create', { participants: Array(1025).fill('user') }],
  ['/manage/contest/create', { features: { frozenTime: 2147483648 } }],
  ['/ps/class/create', { c_name: 'a'.repeat(51) }],
  ['/ps/course/1/update', { course_name: 'a'.repeat(101) }],
  ['/ps/problem_set/add', { name: 'a'.repeat(64) }],
  ['/ps/problem_set/late/add', { note: 'a'.repeat(201) }],
  ['/ps/attendance/1/record', { records: [{ seat_number: 128 }] }],
  [
    '/manage/user/addUsers',
    [{ username: 'user', password: 'weak', email: 'a@b.com', phone: 'a'.repeat(17) }],
  ],
])('blocks over-limit values for %s before HTTP is sent', async (url, payload) => {
  const adapter = new MockAdapter(service);
  try {
    await expect(request.post(url, payload)).rejects.toEqual(expect.any(String));
    expect(adapter.history.post).toHaveLength(0);
  } finally {
    adapter.restore();
  }
});

it('accepts valid endpoint-specific password policies and optional profile fields', () => {
  expect(
    requestConstraintError('/user/register', {
      username: 'user',
      password: 'Aa1!'.repeat(30),
      email: 'a@b.com',
    }),
  ).toBeUndefined();
  expect(
    requestConstraintError('/manage/user/update', { username: 'user', password: 'weak' }),
  ).toBeUndefined();
  expect(
    requestConstraintError('/user/updateProfile', { nickname: 'User', phone: '' }),
  ).toBeUndefined();
  expect(requestConstraintError('/user/thirdPartyBinding', { password: 'x' })).toBeUndefined();
});

it('checks file metadata without imposing the old 64-character editor limit', () => {
  const valid = new FormData();
  valid.append('file', new File(['data'], `${'a'.repeat(100)}.txt`));
  expect(requestConstraintError('/filesys/upload', valid)).toBeUndefined();
  const invalid = new FormData();
  invalid.append('file', new File(['data'], `${'a'.repeat(257)}.txt`));
  expect(requestConstraintError('/filesys/upload', invalid)).toBeDefined();
});

it('does not apply unrelated endpoint policies to search and local-only data', () => {
  expect(requestConstraintError('/group/page', { title: 'a'.repeat(100) })).toBeUndefined();
  expect(requestConstraintError('/example', { title: 'a'.repeat(1000) })).toBeUndefined();
});

it('distinguishes legacy BLOB scores from the newer relation-table scores', () => {
  expect(
    requestConstraintError('/manage/problem/update', {
      checkpoints: [{ checkpointId: 1, checkpointScore: 65536 }],
    }),
  ).toBeUndefined();
  expect(
    requestConstraintError('/manage/problem/updateCheckpoints', {
      checkpoints: [{ checkpointId: 1, score: 65536 }],
    }),
  ).toBeDefined();
});

it('checks upload limits from the local problem-service configuration', () => {
  const file = new File(['data'], 'case.in');
  Object.defineProperty(file, 'size', { value: transport.checkpointUpload.maxFileBytes + 1 });
  const data = new FormData();
  data.append('files', file);
  expect(requestConstraintError('/checkpoint/uploadFiles', data)).toBeDefined();
  expect(requestConstraintError('/filesys/uploadFiles', data)).toBeUndefined();
});

it('rejects expired late permissions even though custom Pydantic validators are absent from OpenAPI', () => {
  expect(
    requestConstraintError('/ps/problem_set/late/add', {
      psid: 1,
      username: 'user',
      expire_time: Date.now() - 1,
      discount: 1,
    }),
  ).toBeDefined();
});
