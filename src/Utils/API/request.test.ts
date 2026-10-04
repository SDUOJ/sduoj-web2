import MockAdapter from 'axios-mock-adapter';
import { message } from 'antd';
import request, { MAX_DOWNLOAD_BYTES, service } from './request';
import axios from 'axios';
import { AUTH_BOUNDARY_EVENT } from '../authBoundary';
import i18n from '../../Config/i18n';

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
  null,
  [],
  'html response',
  {},
  { code: '0', data: {} },
  { code: 0.5, data: {} },
  { code: 0 },
  { code: 0, data: {}, message: [] },
  { code: 0, data: {}, timestamp: {} },
  { code: 0, data: {}, timestamp: true },
])(
  'rejects malformed success envelopes without a secondary transport failure: %j',
  async (payload) => {
    adapter.onGet('/example').reply(200, payload);
    await expect(request.get('/example')).rejects.toBe(i18n.t('InvalidApiResponse'));
    expect(message.error).toHaveBeenCalledTimes(1);
  },
);

it('preserves explicit null success data and Java string pagination counters', async () => {
  const page = {
    rows: [],
    totalNum: '9007199254740993',
    totalPage: '1',
    pageIndex: '1',
    pageSize: '20',
  };
  adapter.onGet('/java-page').reply(200, success(page));
  adapter.onPost('/empty').reply(200, success(null));
  await expect(request.get('/java-page')).resolves.toEqual(page);
  await expect(request.post('/empty', {})).resolves.toBeNull();
});

it.each([undefined, null, '', 'not-a-number'])(
  'accepts a successful envelope with an unusable timestamp: %p',
  async (timestamp) => {
    localStorage.removeItem('server-time');
    adapter.onGet('/example').reply(200, { code: 0, data: { id: 1 }, timestamp });

    await expect(request.get('/example')).resolves.toEqual({ id: 1 });
    expect(localStorage.getItem('server-time')).toBeNull();
    expect(message.error).not.toHaveBeenCalled();
  },
);

it('does not turn an unavailable storage write into a network failure', async () => {
  const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError');
  });
  try {
    adapter.onGet('/example').reply(200, success({ id: 2 }));
    await expect(request.get('/example')).resolves.toEqual({ id: 2 });
    expect(message.error).not.toHaveBeenCalled();
  } finally {
    setItem.mockRestore();
  }
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

it('announces a forbidden response so protected layouts clear stale roles', async () => {
  const boundary = jest.fn();
  window.addEventListener(AUTH_BOUNDARY_EVENT, boundary);
  try {
    adapter.onGet('/manage/user/list').reply(403, { code: 403, message: 'Forbidden' });
    await expect(request.get('/manage/user/list')).rejects.toBe('Forbidden');
    expect(boundary).toHaveBeenCalledTimes(1);
  } finally {
    window.removeEventListener(AUTH_BOUNDARY_EVENT, boundary);
  }
});

it('cancels older management requests when another request loses permission', async () => {
  let finish!: (response: [number, unknown]) => void;
  adapter
    .onGet('/manage/slow')
    .reply(() => new Promise<[number, unknown]>((resolve) => (finish = resolve)));
  adapter.onGet('/manage/revoked').reply(403, { code: 403, message: 'Forbidden' });
  const pending = request.get('/manage/slow').catch((error: unknown) => error);
  await expect(request.get('/manage/revoked')).rejects.toBe('Forbidden');
  expect(adapter.history.get[0].signal?.aborted).toBe(true);
  finish([200, success({ private: 'stale response' })]);
  expect(axios.isCancel(await pending)).toBe(true);
});

it('preserves caller cancellation for management requests', async () => {
  const controller = new AbortController();
  controller.abort();
  const result = await request
    .get('/manage/user/list', {}, { signal: controller.signal })
    .catch((error: unknown) => error);
  expect(axios.isCancel(result)).toBe(true);
  expect(adapter.history.get).toHaveLength(0);
});

it('does not invalidate the whole session for a resource-specific forbidden response', async () => {
  const boundary = jest.fn();
  window.addEventListener(AUTH_BOUNDARY_EVENT, boundary);
  try {
    adapter.onGet('/problem/query').reply(403, { code: 403, message: 'Private problem' });
    await expect(request.get('/problem/query')).rejects.toBe('Private problem');
    expect(boundary).not.toHaveBeenCalled();
  } finally {
    window.removeEventListener(AUTH_BOUNDARY_EVENT, boundary);
  }
});

it('normalizes an empty HTTP error without throwing a secondary TypeError', async () => {
  adapter.onGet('/example').reply(503);
  await expect(request.get('/example')).rejects.toBe('请求失败');
  expect(message.error).toHaveBeenCalledWith('请求失败');
});

it('preserves request cancellation without showing an unreachable-server error', async () => {
  const cancellation = new axios.CanceledError('navigation changed');
  adapter.onGet('/example').reply(() => Promise.reject(cancellation));
  await expect(request.get('/example')).rejects.toBe(cancellation);
  expect(message.error).not.toHaveBeenCalled();
});

it('downloads a ZIP with the requested filename and releases its object URL', async () => {
  adapter.onPost('/zip').reply(200, new Blob(['zip']), { 'content-type': 'application/zip' });
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

it.each(['image/png', 'application/xhtml+xml', 'application/evilzip', ''])(
  'rejects unsupported ZIP content type %p before creating a URL',
  async (contentType) => {
    adapter.onPost('/zip').reply(200, new Blob(['wrong']), { 'content-type': contentType });
    URL.createObjectURL = jest.fn();
    await expect(request.getZipFile('/zip', {})).rejects.toBeInstanceOf(Error);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(message.error).toHaveBeenCalledTimes(1);
  },
);

it('rejects oversized binary payloads before creating an object URL', async () => {
  const size = jest.spyOn(Blob.prototype, 'size', 'get').mockReturnValue(MAX_DOWNLOAD_BYTES + 1);
  URL.createObjectURL = jest.fn();
  adapter.onPost('/zip').reply(200, new Blob(['large']), { 'content-type': 'application/zip' });
  try {
    await expect(request.getZipFile('/zip', {})).rejects.toBeInstanceOf(Error);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(message.error).toHaveBeenCalledTimes(1);
  } finally {
    size.mockRestore();
  }
});

it('releases the object URL even when the browser rejects a download click', async () => {
  adapter.onPost('/zip').reply(200, new Blob(['zip']), { 'content-type': 'application/zip' });
  URL.createObjectURL = jest.fn(() => 'blob:failed-click');
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
    throw new Error('Blocked download');
  });
  await expect(request.getZipFile('/zip', {})).rejects.toThrow('Blocked download');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:failed-click');
  expect(message.error).toHaveBeenCalledWith('Blocked download');
});

it('preserves a supported non-ZIP binary content type', async () => {
  adapter.onPost('/report').reply(200, new Blob(['pdf']), { 'content-type': 'application/pdf' });
  let downloaded: Blob | undefined;
  URL.createObjectURL = jest.fn((value: Blob) => {
    downloaded = value;
    return 'blob:pdf';
  });
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  await request.downloadFile('/report', {}, {}, 'report.pdf');
  expect(downloaded?.type).toBe('application/pdf');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:pdf');
});

it('preserves a cancelled binary request without allocating a download URL', async () => {
  const cancellation = new axios.CanceledError('download cancelled');
  adapter.onPost('/zip').reply(() => Promise.reject(cancellation));
  URL.createObjectURL = jest.fn();
  await expect(request.getZipFile('/zip', {})).rejects.toBe(cancellation);
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(message.error).not.toHaveBeenCalled();
});

it('rejects an advertised oversized response before parsing text error bodies', async () => {
  adapter.onPost('/zip').reply(200, new Blob(['small']), {
    'content-type': 'text/html',
    'content-length': String(MAX_DOWNLOAD_BYTES + 1),
  });
  URL.createObjectURL = jest.fn();
  await expect(request.getZipFile('/zip', {})).rejects.toBeInstanceOf(Error);
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  expect(message.error).toHaveBeenCalledTimes(1);
});

it('routes a JSON response from a binary endpoint through the normal error contract', async () => {
  adapter
    .onPost('/binary')
    .reply(200, new Blob([JSON.stringify({ code: 1, message: '导出失败' })]), {
      'content-type': 'application/json',
    });
  await expect(request.downloadFile('/binary', {})).rejects.toBe('导出失败');
  expect(message.error).toHaveBeenCalledWith('导出失败');
});

it('redirects for expired sessions and excessive clock skew', async () => {
  const original = window.location;
  const replace = jest.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: 'http://localhost/v2/problem?tag=a%26b&page=2#results', replace },
  });
  try {
    adapter.onGet('/example').reply(401);
    await expect(request.get('/example')).rejects.toBe('未登录或登录已过期');
    expect(replace).toHaveBeenCalledWith(
      '/v2/login?to=' + encodeURIComponent('/v2/problem?tag=a%26b&page=2#results'),
    );
    adapter.onGet('/example').reply(200, { code: 0, data: null, timestamp: Date.now() - 120000 });
    await expect(request.get('/example')).rejects.toBe('本地时间异常');
    expect(replace).toHaveBeenCalledWith('/v2/error/time');
  } finally {
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  }
});

it.each([
  ['http://localhost/unrelated/v2/problem', '/v2/login?to=%2Fv2'],
  ['http://localhost/v2/login?to=%2Fv2%2Fproblem', undefined],
])('handles the expired-session return boundary at %s', async (href, destination) => {
  const original = window.location;
  const replace = jest.fn();
  Object.defineProperty(window, 'location', { configurable: true, value: { href, replace } });
  try {
    adapter.onGet('/example').reply(401);
    await expect(request.get('/example')).rejects.toBe('未登录或登录已过期');
    if (destination) expect(replace).toHaveBeenCalledWith(destination);
    else expect(replace).not.toHaveBeenCalled();
  } finally {
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  }
});
