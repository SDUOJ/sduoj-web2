import MockAdapter from 'axios-mock-adapter';
import { message } from 'antd';
import request, { service } from './request';

jest.mock('antd', () => ({ message: { error: jest.fn() } }));
const adapter = new MockAdapter(service);
const success = (data: unknown) => ({ code: 0, data, timestamp: Date.now() });

afterEach(() => adapter.reset());
afterAll(() => adapter.restore());

it('unwraps GET results and preserves query parameters and credentials', async () => {
  adapter.onGet('/example', { params: { pageNow: 2 } }).reply(200, success({ rows: [1] }));
  await expect(request.get<{ rows: number[] }>('/example', { pageNow: 2 })).resolves.toEqual({
    rows: [1],
  });
  expect(adapter.history.get[0].withCredentials).toBe(true);
  expect(localStorage.getItem('server-time')).not.toBeNull();
});

it('preserves POST bodies and unwraps results', async () => {
  adapter.onPost('/example', { title: 'Draft' }).reply(200, success({ id: 1 }));
  await expect(request.post('/example', { title: 'Draft' })).resolves.toEqual({ id: 1 });
});

it.each([
  [{ message: 'Bad input' }, 'Bad input'],
  [{ msg: 'Bad input' }, 'Bad input'],
  [{ detail: 'Bad input' }, 'Bad input'],
  [{ detail: [{ msg: 'Bad input' }] }, 'Bad input'],
  [{ detail: ['Bad input'] }, 'Bad input'],
  [{ detail: { msg: 'Bad input' } }, 'Bad input'],
  ['Bad input', 'Bad input'],
  [{}, '请求参数错误'],
])('normalizes server validation errors: %j', async (payload, expected) => {
  adapter.onPost('/example').reply(400, payload);
  await expect(request.post('/example', {})).rejects.toBe(expected);
  expect(message.error).toHaveBeenCalledTimes(1);
  expect(message.error).toHaveBeenCalledWith(expected);
});

it('rejects business errors even on HTTP 200', async () => {
  adapter.onGet('/example').reply(200, { code: 1, message: 'Rejected', timestamp: Date.now() });
  await expect(request.get('/example')).rejects.toBe('Rejected');
  expect(message.error).toHaveBeenCalledTimes(1);
});

it.each(['/user/getProfile', '/submit/queryACProblem', '/group/my'])(
  'keeps background authentication errors silent for %s',
  async (url) => {
    adapter.onGet(url).reply(401, { code: 401, message: 'Unauthenticated' });
    await expect(request.get(url)).rejects.toBe('Unauthenticated');
    expect(message.error).not.toHaveBeenCalled();
  },
);

it('reports network errors while keeping profile checks silent', async () => {
  adapter.onGet('/example').networkError();
  await expect(request.get('/example')).rejects.toBe('服务器不可达');
  expect(message.error).toHaveBeenCalledTimes(1);
  adapter.onGet('/user/getProfile').networkError();
  await expect(request.get('/user/getProfile')).rejects.toBe('服务器不可达');
  expect(message.error).toHaveBeenCalledTimes(1);
});

it('rejects server errors', async () => {
  adapter.onGet('/example').reply(500, { message: 'Server error' });
  await expect(request.get('/example')).rejects.toBe('Server error');
});

it('downloads a ZIP with the requested filename and releases its object URL', async () => {
  adapter.onPost('/zip').reply(200, new Blob(['zip']));
  URL.createObjectURL = jest.fn(() => 'blob:test');
  URL.revokeObjectURL = jest.fn();
  let filename: string | undefined;
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    filename = this.download;
  });
  await request.getZipFile('/zip', { id: 1 }, {}, 'cases.zip');
  expect(click).toHaveBeenCalledTimes(1);
  expect(filename).toBe('cases.zip');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
});

it('redirects for expired sessions and excessive clock skew', async () => {
  const original = window.location;
  const replace = jest.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: 'http://localhost/v2/problem', replace },
  });
  try {
    adapter.onGet('/example').reply(401, { code: 401 });
    await expect(request.get('/example')).rejects.toBe('未登录或登录已过期');
    expect(replace).toHaveBeenCalledWith('/v2/login?to=/v2/problem');
    adapter.onGet('/example').reply(200, { code: 0, timestamp: Date.now() - 120000 });
    await expect(request.get('/example')).rejects.toBe('本地时间异常');
    expect(replace).toHaveBeenCalledWith('/v2/error/time');
  } finally {
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  }
});
