import { requestConstraintError } from './requests';

/**
 * 端点级正/反例矩阵：每组覆盖「合法载荷」与「非法载荷」，
 * 保证错误配置在发送 HTTP 前被拒绝，合法配置不被误伤。
 */
describe('request contract accept/reject matrix', () => {
  it.each([
    [
      'user register — valid complex password',
      '/user/register',
      { username: 'user', password: 'Aa1!' + 'x'.repeat(8), email: 'a@b.com' },
      true,
    ],
    [
      'user register — short password rejected',
      '/user/register',
      { username: 'user', password: 'weak', email: 'a@b.com' },
      false,
    ],
    [
      'user register — missing email rejected',
      '/user/register',
      { username: 'user', password: 'Aa1!' + 'x'.repeat(8) },
      false,
    ],
    [
      'user register — blank username rejected',
      '/user/register',
      { username: '   ', password: 'Aa1!' + 'x'.repeat(8), email: 'a@b.com' },
      false,
    ],
    ['login — valid credentials', '/user/login', { username: 'user', password: 'whatever' }, true],
    ['login — empty password rejected', '/user/login', { username: 'user', password: '' }, false],
    [
      'updateProfile — optional phone empty allowed',
      '/user/updateProfile',
      { nickname: 'User', phone: '' },
      true,
    ],
    [
      'updateProfile — nickname over UTF-16 limit rejected',
      '/user/updateProfile',
      { nickname: '中'.repeat(31) },
      false,
    ],
    [
      'updateProfile — gender out of range rejected',
      '/user/updateProfile',
      { nickname: 'User', gender: 3 },
      false,
    ],
    [
      'updateProfile — gender boundary 2 accepted',
      '/user/updateProfile',
      { nickname: 'User', gender: 2 },
      true,
    ],
    [
      'updatePassword — strong new password',
      '/user/updatePassword',
      { newPassword: 'Aa1!' + 'y'.repeat(10) },
      true,
    ],
    [
      'updatePassword — only letters rejected',
      '/user/updatePassword',
      { newPassword: 'abcdefgh' },
      false,
    ],
    [
      'group create — valid title',
      '/manage/group/create',
      { title: 'G'.repeat(45), description: 'ok' },
      true,
    ],
    [
      'group create — title over 45 rejected',
      '/manage/group/create',
      { title: 'G'.repeat(46) },
      false,
    ],
    ['notice create — valid short text', '/manage/notice/create', { text: 'hello' }, true],
    [
      'notice create — text over 20000 rejected',
      '/manage/notice/create',
      { text: 'a'.repeat(20001) },
      false,
    ],
    ['problem update — valid timeLimit', '/manage/problem/update', { timeLimit: 2147483647 }, true],
    [
      'problem update — timeLimit over Java int rejected',
      '/manage/problem/update',
      { timeLimit: 2147483648 },
      false,
    ],
    [
      'problem update — negative timeLimit rejected',
      '/manage/problem/update',
      { timeLimit: -1 },
      false,
    ],
    [
      'description create — title boundary 16 accepted',
      '/manage/problem/createDescription',
      { title: 'a'.repeat(16) },
      true,
    ],
    [
      'description create — title 17 rejected',
      '/manage/problem/createDescription',
      { title: 'a'.repeat(17) },
      false,
    ],
    [
      'checkpoints legacy score — 65536 accepted (BLOB path)',
      '/manage/problem/update',
      { checkpoints: [{ checkpointId: 1, checkpointScore: 65536 }] },
      true,
    ],
    [
      'checkpoints relation score — 65536 rejected',
      '/manage/problem/updateCheckpoints',
      { checkpoints: [{ checkpointId: 1, score: 65536 }] },
      false,
    ],
    [
      'checkpoints relation score — 65535 accepted',
      '/manage/problem/updateCheckpoints',
      { checkpoints: [{ checkpointId: 1, score: 65535 }] },
      true,
    ],
    [
      'exam features — scoreMod show accepted',
      '/manage/exam/create',
      { features: { scoreMod: 'show', caseMod: 'partial', openReport: 1 } },
      true,
    ],
    [
      'exam features — scoreMod invalid rejected',
      '/manage/exam/create',
      { features: { scoreMod: 'invalid' } },
      false,
    ],
    [
      'exam features — openReport 2 rejected',
      '/manage/exam/update',
      { features: { openReport: 2 } },
      false,
    ],
    [
      'exam features — openReport 0 accepted',
      '/manage/exam/update',
      { features: { openReport: 0 } },
      true,
    ],
    [
      'contest participants — 1024 accepted',
      '/manage/contest/create',
      { participants: Array(1024).fill('user') },
      true,
    ],
    [
      'contest participants — 1025 rejected',
      '/manage/contest/create',
      { participants: Array(1025).fill('user') },
      false,
    ],
    [
      'contest features — frozenTime valid',
      '/manage/contest/create',
      { features: { frozenTime: 0 } },
      true,
    ],
    [
      'contest features — frozenTime overflow rejected',
      '/manage/contest/create',
      { features: { frozenTime: 2147483648 } },
      false,
    ],
    [
      'contest visibility — allowToSubmit integer accepted',
      '/manage/contest/update',
      { features: { contestEnd: { allowToSubmit: 1 } } },
      true,
    ],
    [
      'contest visibility — allowToSubmit float rejected',
      '/manage/contest/update',
      { features: { contestEnd: { allowToSubmit: 1.5 } } },
      false,
    ],
    [
      'classroom — seat_num 1 accepted',
      '/ps/class/create',
      { c_name: 'Lab', c_seat_num: 1, address: 'A-101' },
      true,
    ],
    [
      'classroom — seat_num 2 accepted',
      '/ps/class/create',
      { c_name: 'Lab', c_seat_num: 2, address: 'A-101' },
      true,
    ],
    [
      'classroom — seat_num 0 rejected',
      '/ps/class/create',
      { c_name: 'Lab', c_seat_num: 0, address: 'A-101' },
      false,
    ],
    [
      'classroom — name over 50 rejected',
      '/ps/class/create',
      { c_name: 'a'.repeat(51), c_seat_num: 10, address: 'A-101' },
      false,
    ],
    [
      'problem set — name boundary 63 accepted',
      '/ps/problem_set/add',
      {
        name: 'n'.repeat(63),
        type: 0,
        groupId: 1,
        tag: '实验',
        config: {
          useSameSE: 0,
          showReport: 1,
          showScoreInRunning: 1,
          showProgramScoreInRunning: 1,
          mergerSubjectiveGroup: 0,
        },
        groupInfo: [{ gid: 1, name: 'G', score: 100, timeSetting: [] }],
      },
      true,
    ],
    ['problem set — name 64 rejected', '/ps/problem_set/add', { name: 'n'.repeat(64) }, false],
    [
      'late permission — future expire + discount accepted',
      '/ps/problem_set/late/add',
      { psid: 1, username: 'user', expire_time: Date.now() + 60_000, discount: 0.5 },
      true,
    ],
    [
      'late permission — expired rejected',
      '/ps/problem_set/late/add',
      { psid: 1, username: 'user', expire_time: Date.now() - 1, discount: 1 },
      false,
    ],
    [
      'late permission — discount 0 rejected',
      '/ps/problem_set/late/add',
      { psid: 1, username: 'user', expire_time: Date.now() + 60_000, discount: 0 },
      false,
    ],
    [
      'late permission — discount 1 accepted',
      '/ps/problem_set/late/add',
      { psid: 1, username: 'user', expire_time: Date.now() + 60_000, discount: 1 },
      true,
    ],
    [
      'attendance seat — 127 accepted',
      '/ps/attendance/1/record',
      { records: [{ seat_number: 127, username: 'user', status: 1 }] },
      true,
    ],
    [
      'attendance seat — 128 rejected',
      '/ps/attendance/1/record',
      { records: [{ seat_number: 128, username: 'user', status: 1 }] },
      false,
    ],
    [
      'attendance record — missing status rejected',
      '/ps/attendance/1/record',
      { records: [{ seat_number: 1, username: 'user' }] },
      false,
    ],
    [
      'course name — boundary 100 accepted',
      '/ps/course/1/update',
      { course_name: 'c'.repeat(100) },
      true,
    ],
    ['course name — 101 rejected', '/ps/course/1/update', { course_name: 'c'.repeat(101) }, false],
  ])('%s', (_label, url, payload, shouldPass) => {
    const error = requestConstraintError(url, payload);
    if (shouldPass) expect(error).toBeUndefined();
    else expect(error).toBeDefined();
  });

  it.each([
    ['/manage/contest/publicIt', { clarificationId: 1, opt: 0 }, true],
    ['/manage/contest/publicIt', { clarificationId: 1, opt: 1 }, true],
    ['/manage/contest/publicIt', { clarificationId: 1, opt: 2 }, false],
    ['/manage/contest/publicIt', { clarificationId: 0, opt: 0 }, false],
    ['/manage/contest/publicIt', { clarificationId: 1 }, false],
    ['/manage/group/addUser', { usernames: ['alice'] }, true],
    ['/manage/group/addUser', { usernames: [] }, false],
    ['/manage/group/updateUserStatus', { status: 1, userIds: [1] }, true],
    ['/manage/group/updateUserStatus', { status: 4, userIds: [1] }, false],
    ['/manage/group/updateUserStatus', { status: 1, userIds: [] }, false],
  ])('required-field policy for %s %o', (url, payload, shouldPass) => {
    const error = requestConstraintError(url, payload);
    if (shouldPass) expect(error).toBeUndefined();
    else expect(error).toBeDefined();
  });

  it('does not invent policies for unknown routes or pure search payloads', () => {
    expect(requestConstraintError('/group/page', { title: 'a'.repeat(500) })).toBeUndefined();
    expect(requestConstraintError('/api/unknown', { anything: 1 })).toBeUndefined();
    expect(requestConstraintError('/submit/list', { pageNow: 1 })).toBeUndefined();
  });
});
