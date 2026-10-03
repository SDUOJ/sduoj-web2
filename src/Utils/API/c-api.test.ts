import MockAdapter from 'axios-mock-adapter';
import cApi from './c-api';
import { service } from './request';

const adapter = new MockAdapter(service);
const success = (data: unknown) => ({ code: 0, data, timestamp: Date.now() });

afterEach(() => adapter.reset());
afterAll(() => adapter.restore());

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
