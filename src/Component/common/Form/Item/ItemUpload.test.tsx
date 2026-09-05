import { uploadItemFile } from './ItemUpload';
import { fileUpload, fileUploadWithoutMD5 } from '../../../../Utils/fileUpload';

jest.mock('../../../../Utils/fileUpload', () => ({
  fileUpload: jest.fn(),
  fileUploadWithoutMD5: jest.fn(),
}));

const adminUpload = fileUpload as jest.MockedFunction<typeof fileUpload>;
const userUpload = fileUploadWithoutMD5 as jest.MockedFunction<typeof fileUploadWithoutMD5>;
const file = new File(['content'], 'answer.txt');

beforeEach(() => jest.clearAllMocks());

it('routes admin mode through the hash-aware uploader', async () => {
  adminUpload.mockResolvedValue([{ id: 'admin' }]);
  await expect(uploadItemFile('admin', file, jest.fn())).resolves.toEqual({ id: 'admin' });
  expect(adminUpload).toHaveBeenCalledTimes(1);
  expect(userUpload).not.toHaveBeenCalled();
});

it('routes user mode through the user upload endpoint', async () => {
  userUpload.mockResolvedValue({ id: 'user' });
  await expect(uploadItemFile('user', file, jest.fn())).resolves.toEqual({ id: 'user' });
  expect(userUpload).toHaveBeenCalledTimes(1);
  expect(adminUpload).not.toHaveBeenCalled();
});
