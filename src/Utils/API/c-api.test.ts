import MockAdapter from 'axios-mock-adapter';
import cApi from './c-api';
import { service } from './request';
import { ContestRankRow, JavaPage, ContestListRow, FileReference } from '../../Type/api';
import { UserInfo } from '../../Type/Iuser';

const adapter = new MockAdapter(service);
const success = (data: unknown) => ({ code: 0, data, timestamp: Date.now() });

beforeEach(() => cApi.clearAcceptanceQueueCache());
afterEach(() => adapter.reset());
afterAll(() => adapter.restore());

test('deletes an automatic task through the same AutoLab gateway prefix as task queries', async () => {
  adapter.onPost('/ps/auto-task/delete/task-42', {}).reply(200, success(null));
  await expect(cApi.deleteAutoTask('task-42')).resolves.toBeNull();
  expect(adapter.history.post).toHaveLength(1);
  expect(adapter.history.post[0].url).toBe('/ps/auto-task/delete/task-42');
});

test('returns profile flags and oversized Java IDs without coercing them to numbers', async () => {
  const profile: UserInfo = {
    userId: '9007199254740993',
    username: 'contract-user',
    nickname: 'Contract user',
    studentId: '',
    roles: ['user'],
    email: null,
    phone: null,
    gender: null,
    features: { requirePasswordChange: 0, banEmailUpdate: false },
  };
  adapter.onGet('/user/getProfile').reply(200, success(profile));
  await expect(cApi.getProfile()).resolves.toEqual(profile);
});

test('keeps Java page counters as strings and absent rank results as empty tuples', async () => {
  const contests: JavaPage<ContestListRow> = {
    rows: [],
    totalNum: '9007199254740993',
    totalPage: '1',
    pageSize: '20',
    pageIndex: '1',
  };
  const rank: ContestRankRow[] = [
    {
      userId: '9007199254740993',
      username: 'contract-user',
      nickname: 'Contract user',
      official: true,
      problemNum: 2,
      submissions: [['A', '2026-10-04T00:00:00Z', 100, 0]],
      problemResults: [[], ['2026-10-04T00:00:00Z', 100, 0, 1, 0]],
    },
  ];
  adapter.onGet('/contest/list').reply(200, success(contests));
  adapter.onGet('/contest/rank').reply(200, success(rank));
  await expect(cApi.getContestList({ pageNow: 1, pageSize: 20 })).resolves.toEqual(contests);
  await expect(cApi.getRank({ contestId: '379' })).resolves.toEqual(rank);
});

test('returns nullable MD5 lookups and string file metadata', async () => {
  const reference: FileReference = {
    id: '9007199254740993',
    size: '126607',
    name: 'fixture.zip',
    extensionName: 'zip',
    md5: '0123456789abcdef0123456789abcdef',
    gmtCreate: '2026-10-04T00:00:00Z',
    gmtModified: '2026-10-04T00:00:00Z',
  };
  adapter
    .onGet('/filesys/queryByMd5', { params: { md5: reference.md5 } })
    .reply(200, success(reference));
  adapter.onGet('/filesys/queryByMd5', { params: { md5: 'missing' } }).reply(200, success(null));
  await expect(cApi.getFileByMD5({ md5: reference.md5! })).resolves.toEqual(reference);
  await expect(cApi.getFileByMD5({ md5: 'missing' })).resolves.toBeNull();
});

test('uses typed account lifecycle payloads for email and password changes', async () => {
  adapter.onPost('/user/updateEmail').reply(200, success(true));
  adapter.onPost('/user/resetPassword').reply(200, success(true));

  await cApi.updateEmail({ password: 'Oldpass1', email: 'new@example.com', emailCode: '123456' });
  await cApi.resetPassword({ password: 'Newpass1', token: 'reset-token' });

  expect(JSON.parse(adapter.history.post[0].data)).toEqual({
    password: 'Oldpass1',
    email: 'new@example.com',
    emailCode: '123456',
  });
  expect(JSON.parse(adapter.history.post[1].data)).toEqual({
    password: 'Newpass1',
    token: 'reset-token',
  });
});

test('checks either a username or an email through the typed query contract', async () => {
  adapter.onGet('/user/isExist', { params: { username: 'alice' } }).reply(200, success(false));
  adapter
    .onGet('/user/isExist', { params: { email: 'alice@example.com' } })
    .reply(200, success(true));

  await expect(cApi.isExist({ username: 'alice' })).resolves.toBe(false);
  await expect(cApi.isExist({ email: 'alice@example.com' })).resolves.toBe(true);
});

test('preserves third-party registration and binding payloads', async () => {
  adapter.onPost('/user/thirdPartyRegister').reply(200, success({ id: 1 }));
  adapter.onPost('/user/thirdPartyBinding').reply(200, success({ id: 1 }));

  await cApi.thirdPartyRegister({
    username: 'alice',
    password: 'Passw0rd',
    email: 'alice@example.com',
    emailCode: '123456',
    token: 'cas-token',
  });
  await cApi.thirdPartyBinding({ username: 'alice', password: 'Passw0rd', token: 'cas-token' });

  expect(JSON.parse(adapter.history.post[0].data)).toMatchObject({
    username: 'alice',
    emailCode: '123456',
    token: 'cas-token',
  });
  expect(JSON.parse(adapter.history.post[1].data)).toEqual({
    username: 'alice',
    password: 'Passw0rd',
    token: 'cas-token',
  });
});

test('accepts FormData for both file upload endpoints', async () => {
  adapter.onPost('/filesys/uploadFiles').reply(200, success([]));
  adapter.onPost('/filesys/upload').reply(200, success({ id: 'file-1' }));

  const files = new FormData();
  files.append('file', new Blob(['hello']), 'hello.txt');
  await cApi.uploadFile(files);
  await cApi.uploadSingleFile(files);

  expect(adapter.history.post).toHaveLength(2);
  expect(adapter.history.post[0].url).toBe('/filesys/uploadFiles');
  expect(adapter.history.post[1].url).toBe('/filesys/upload');
});

test('preserves typed contest query and submission payloads', async () => {
  adapter.onGet('/contest/list').reply(200, success({ rows: [] }));
  adapter.onGet('/contest/listSubmission').reply(200, success({ rows: [] }));
  adapter.onPost('/contest/createSubmission').reply(200, success({ id: 'submission-1' }));

  await cApi.getContestList({ pageNow: 1, pageSize: 20, mode: 'acm', groupId: 7 });
  await cApi.getContestSubmissionList({
    pageNow: 1,
    pageSize: 10,
    contestId: 'contest-1',
    problemCode: 'A',
  });
  await cApi.submitContestProblem({
    contestId: 'contest-1',
    problemCode: 'A',
    judgeTemplateId: 'template-1',
    code: 'print(1)',
  });

  expect(adapter.history.get[0].params).toEqual({
    pageNow: 1,
    pageSize: 20,
    mode: 'acm',
    groupId: 7,
  });
  expect(adapter.history.get[1].params).toEqual({
    pageNow: 1,
    pageSize: 10,
    contestId: 'contest-1',
    problemCode: 'A',
  });
  expect(JSON.parse(adapter.history.post[0].data)).toEqual({
    contestId: 'contest-1',
    problemCode: 'A',
    judgeTemplateId: 'template-1',
    code: 'print(1)',
  });
});

test('preserves typed contest report configuration', async () => {
  adapter.onPost('/contest/comprehensiveReport').reply(200, success({ rows: [] }));
  await cApi.getContestReport({
    contestList: [
      {
        contestId: '144',
        title: 'week1',
        weight: 1.25,
        timeoutScoreRatio: [
          ['0', 1],
          ['604800001', 0.9],
        ],
      },
    ],
  });

  expect(JSON.parse(adapter.history.post[0].data)).toEqual({
    contestList: [
      {
        contestId: '144',
        title: 'week1',
        weight: 1.25,
        timeoutScoreRatio: [
          ['0', 1],
          ['604800001', 0.9],
        ],
      },
    ],
  });
});

test('preserves typed list and detail query parameters', async () => {
  adapter.onGet('/notice/list').reply(200, success({ rows: [] }));
  adapter.onGet('/notice/query').reply(200, success({ id: 4 }));
  adapter.onGet('/submit/list').reply(200, success({ rows: [] }));
  adapter.onGet('/group/page').reply(200, success({ rows: [] }));

  await cApi.getAnnouncementList({ pageNow: 1, pageSize: 10, title: 'notice' });
  await cApi.getAnnouncement({ id: 4 });
  await cApi.getSubmissionList({ pageNow: 1, pageSize: 20, problemCode: 'A' });
  await cApi.getGroupList({ pageNow: 1, pageSize: 12, isParticipating: '1' });

  expect(adapter.history.get.map(({ url, params }) => ({ url, params }))).toEqual([
    {
      url: '/notice/list',
      params: { pageNow: 1, pageSize: 10, title: 'notice', filter: 'default' },
    },
    { url: 'notice/query', params: { id: 4 } },
    { url: '/submit/list', params: { pageNow: 1, pageSize: 20, problemCode: 'A' } },
    { url: '/group/page', params: { pageNow: 1, pageSize: 12, isParticipating: '1' } },
  ]);
});

test('preserves typed problem-set router and answer payloads', async () => {
  adapter.onPost('/ps/problem_set/pro_info').reply(200, success({ id: 1 }));
  adapter.onPost('/ps/answer_sheet/answer').reply(200, success({ hasAnswer: true }));
  adapter.onPost('/ps/answer_sheet/mark').reply(200, success({ hasAnswer: true }));
  adapter.onPost('/ps/answer_sheet/finish').reply(200, success(true));

  const router = { psid: 10, gid: 2, pid: 3 };
  await cApi.getProblemSetProblem({ router });
  await cApi.submitProblemSetProblem({ router, data: 'answer-A' });
  await cApi.markObjectiveProblem({ router, data: 'choice-1' });
  await cApi.finishProblemSet({ router: { psid: 10, gid: 0, pid: 0 } });

  expect(adapter.history.post.map(({ url, data }) => ({ url, data: JSON.parse(data) }))).toEqual([
    { url: '/ps/problem_set/pro_info', data: { router } },
    { url: '/ps/answer_sheet/answer', data: { router, data: 'answer-A' } },
    { url: '/ps/answer_sheet/mark', data: { router, data: 'choice-1' } },
    { url: '/ps/answer_sheet/finish', data: { router: { psid: 10, gid: 0, pid: 0 } } },
  ]);
});

test('caches acceptance queues per problem set for 30 seconds', async () => {
  adapter.onPost('/ps/answer_sheet/acceptanceQueueList').reply(200, success(['queue-a']));

  await expect(cApi.getAcceptanceQueueList({ psid: 10 })).resolves.toEqual(['queue-a']);
  await expect(cApi.getAcceptanceQueueList({ psid: 10 })).resolves.toEqual(['queue-a']);

  expect(adapter.history.post).toHaveLength(1);
});

test('clears acceptance queue cache and isolates different problem sets', async () => {
  adapter
    .onPost('/ps/answer_sheet/acceptanceQueueList')
    .replyOnce(200, success(['queue-a']))
    .onPost('/ps/answer_sheet/acceptanceQueueList')
    .replyOnce(200, success(['queue-b']))
    .onPost('/ps/answer_sheet/acceptanceQueueList')
    .replyOnce(200, success(['queue-a']));

  await expect(cApi.getAcceptanceQueueList({ psid: 10 })).resolves.toEqual(['queue-a']);
  await expect(cApi.getAcceptanceQueueList({ psid: 11 })).resolves.toEqual(['queue-b']);
  cApi.clearAcceptanceQueueCache();
  await expect(cApi.getAcceptanceQueueList({ psid: 10 })).resolves.toEqual(['queue-a']);

  expect(adapter.history.post).toHaveLength(3);
});

test('preserves typed problem-set review payloads', async () => {
  adapter.onPost('/ps/judge/list').reply(200, success({ rows: [], totalNum: 0 }));
  adapter.onPost('/ps/judge/info').reply(200, success({ judgeLog: [] }));
  adapter.onPost('/ps/judge/add').reply(200, success(true));

  await cApi.getJudgeList({
    pageNow: 1,
    pageSize: 20,
    psid: 10,
    proStr: null,
    gid: 2,
    pid: 3,
    username: 'alice',
    judgeLock: null,
    hasJudge: 0,
    review_queue: 'queue-a',
  });
  await cApi.getJudgeInfo({ psid: 10, gid: 2, pid: 3, username: 'alice' });
  await cApi.updateJudgeInfo({
    psid: 10,
    gid: 2,
    pid: 3,
    username: 'alice',
    judgeLog: [{ name: 'correctness', score: 10, jScore: 9 }],
    judgeComment: 'reviewed',
    cancel: null,
  });

  expect(adapter.history.post.map(({ url, data }) => ({ url, data: JSON.parse(data) }))).toEqual([
    {
      url: '/ps/judge/list',
      data: {
        pageNow: 1,
        pageSize: 20,
        psid: 10,
        proStr: null,
        gid: 2,
        pid: 3,
        username: 'alice',
        judgeLock: null,
        hasJudge: 0,
        review_queue: 'queue-a',
      },
    },
    { url: '/ps/judge/info', data: { psid: 10, gid: 2, pid: 3, username: 'alice' } },
    {
      url: '/ps/judge/add',
      data: {
        psid: 10,
        gid: 2,
        pid: 3,
        username: 'alice',
        judgeLog: [{ name: 'correctness', score: 10, jScore: 9 }],
        judgeComment: 'reviewed',
        cancel: null,
      },
    },
  ]);
});

test('preserves typed problem-set summary and search payloads', async () => {
  adapter.onPost('/ps/summary/summary').reply(200, success({}));
  adapter.onPost('/ps/summary/preview').reply(200, success({}));
  adapter.onPost('/ps/problem_set/key').reply(200, success({ label: [] }));
  adapter.onPost('/ps/problem_set/search').reply(200, success({ rows: [], totalNum: 0 }));

  await cApi.getProblemSummary({ psid: 10, code: 0 });
  await cApi.getProblemSetProPreview({ psid: 10, gid: 2, pid: 3, username: 'alice' });
  await cApi.getProblemSetLabelList({ groupId: 7 });
  await cApi.getProblemSetList({ pageNow: 1, pageSize: 20, groupId: 7, tag: 'algorithm' });

  expect(adapter.history.post.map(({ url, data }) => ({ url, data: JSON.parse(data) }))).toEqual([
    { url: '/ps/summary/summary', data: { psid: 10, code: 0 } },
    {
      url: '/ps/summary/preview',
      data: { psid: 10, gid: 2, pid: 3, username: 'alice' },
    },
    { url: '/ps/problem_set/key', data: { groupId: 7 } },
    {
      url: '/ps/problem_set/search',
      data: { pageNow: 1, pageSize: 20, groupId: 7, tag: 'algorithm' },
    },
  ]);
});

test('sends a grade-review request to the native answer-sheet endpoint without changing its version', async () => {
  const payload = {
    router: { psid: 12, gid: 3, pid: 4 },
    reason: '请核对第二项评分',
    grade_version: 'grade-v7',
  };
  adapter
    .onPost('/ps/answer_sheet/gradeReview', payload)
    .reply(200, success({ status: 'pending' }));
  await expect(cApi.requestGradeReview(payload)).resolves.toEqual({ status: 'pending' });
  expect(JSON.parse(adapter.history.post[0].data)).toEqual(payload);
});
