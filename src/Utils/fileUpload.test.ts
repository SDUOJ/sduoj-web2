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
