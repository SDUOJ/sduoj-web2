import CApi from './API/c-api';
import { fileUpload, fileUploadWithoutMD5 } from './fileUpload';

jest.mock('./API/c-api', () => ({
  __esModule: true,
  default: {
    getFileByMD5: jest.fn(),
    uploadFile: jest.fn(),
    uploadSingleFile: jest.fn(),
  },
}));

const api = CApi as jest.Mocked<typeof CApi>;
const makeFile = (name: string, bytes = name, arrayBuffer?: () => Promise<ArrayBuffer>) => {
  const file = new File([bytes], name);
  const encoded = new Uint8Array(Array.from(bytes).map((character) => character.charCodeAt(0)))
    .buffer;
  Object.defineProperty(file, 'arrayBuffer', {
    configurable: true,
    value: arrayBuffer ?? jest.fn().mockResolvedValue(encoded),
  });
  return file;
};

beforeEach(() => jest.clearAllMocks());

it.each([undefined, {}, { id: 1 }, { id: '' }, { id: '   ' }])(
  'rejects invalid cache references before uploading or invoking callbacks: %j',
  async (value) => {
    api.getFileByMD5.mockResolvedValueOnce(value as never);
    const callback = jest.fn();
    await expect(fileUpload([makeFile('invalid.txt')], callback)).rejects.toThrow(
      'Cached file reference is invalid',
    );
    expect(api.uploadFile).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  },
);

it.each([null, undefined, {}, { id: 1 }, { id: '' }])(
  'rejects invalid single-upload references without publishing a success: %j',
  async (value) => {
    api.uploadSingleFile.mockResolvedValueOnce(value as never);
    const callback = jest.fn();
    await expect(fileUploadWithoutMD5(makeFile('invalid.txt'), callback)).rejects.toThrow(
      'Uploaded file reference is invalid',
    );
    expect(callback).not.toHaveBeenCalled();
  },
);

it.each([
  { uploaded: [{ id: 'valid' }, null] },
  { uploaded: [{ id: 'valid' }, { id: '' }] },
  { uploaded: new Array(2) },
])('does not publish partial success for an invalid batch: %j', async ({ uploaded }) => {
  api.getFileByMD5.mockResolvedValue(null);
  api.uploadFile.mockResolvedValueOnce(uploaded as never);
  const callback = jest.fn();
  await expect(fileUpload([makeFile('one.txt'), makeFile('two.txt')], callback)).rejects.toThrow(
    /Uploaded file reference is (invalid|missing)/,
  );
  expect(callback).not.toHaveBeenCalled();
});

it('rejects a mismatched batch before invoking any callbacks', async () => {
  api.getFileByMD5.mockResolvedValue(null);
  api.uploadFile.mockResolvedValueOnce([]);
  const callback = jest.fn();
  await expect(fileUpload([makeFile('one.txt')], callback)).rejects.toThrow(
    'Uploaded file count does not match the requested file count',
  );
  expect(callback).not.toHaveBeenCalled();
});

it('discards a successful single upload when it completes after cancellation', async () => {
  const controller = new AbortController();
  api.uploadSingleFile.mockImplementationOnce(async () => {
    controller.abort();
    return { id: 'late-file' };
  });
  const callback = jest.fn();
  await expect(
    fileUploadWithoutMD5(makeFile('late.txt'), callback, { signal: controller.signal }),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(callback).not.toHaveBeenCalled();
});

it('returns and reports a cache hit without uploading it again', async () => {
  const cached = { id: 'cached' };
  api.getFileByMD5.mockResolvedValue(cached);
  const callback = jest.fn();

  await expect(fileUpload([makeFile('cached.txt')], callback)).resolves.toEqual([cached]);
  expect(api.uploadFile).not.toHaveBeenCalled();
  expect(callback).toHaveBeenCalledWith(cached);
});

it('uploads cache misses and preserves input order in a mixed batch', async () => {
  const cached = { id: 'cached' };
  const firstUpload = { id: 'first-upload' };
  const secondUpload = { id: 'second-upload' };
  api.getFileByMD5
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(cached)
    .mockResolvedValueOnce(null);
  api.uploadFile.mockResolvedValue([firstUpload, secondUpload]);
  const callback = jest.fn();

  await expect(
    fileUpload([makeFile('one.txt'), makeFile('two.txt'), makeFile('three.txt')], callback),
  ).resolves.toEqual([firstUpload, cached, secondUpload]);
  const body = api.uploadFile.mock.calls[0][0] as FormData;
  expect(body.getAll('files')).toHaveLength(2);
  expect(callback.mock.calls.map(([value]) => value)).toEqual([firstUpload, cached, secondUpload]);
});

it('rejects hash, cache, and network failures instead of detaching them', async () => {
  const hashFailure = makeFile('hash.txt', 'hash', () => Promise.reject(new Error('hash failed')));
  await expect(fileUpload([hashFailure])).rejects.toThrow('hash failed');

  api.getFileByMD5.mockRejectedValueOnce(new Error('cache failed'));
  await expect(fileUpload([makeFile('cache.txt')])).rejects.toThrow('cache failed');

  api.getFileByMD5.mockResolvedValueOnce(null);
  api.uploadFile.mockRejectedValueOnce(new Error('upload failed'));
  await expect(fileUpload([makeFile('network.txt')])).rejects.toThrow('upload failed');
});

it('supports cancellation and passes the signal to every request', async () => {
  const controller = new AbortController();
  api.getFileByMD5.mockImplementation(async (_data, config) => {
    expect(config?.signal).toBe(controller.signal);
    controller.abort();
    return null;
  });

  await expect(
    fileUpload([makeFile('abort.txt')], undefined, { signal: controller.signal }),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(api.uploadFile).not.toHaveBeenCalled();
});

it('makes user uploads awaitable and abortable', async () => {
  const uploaded = { id: 'user-file' };
  const controller = new AbortController();
  api.uploadSingleFile.mockResolvedValue(uploaded);

  await expect(
    fileUploadWithoutMD5(makeFile('user.txt'), undefined, { signal: controller.signal }),
  ).resolves.toEqual(uploaded);
  expect(api.uploadSingleFile.mock.calls[0][1]?.signal).toBe(controller.signal);
});
