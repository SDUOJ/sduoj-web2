import CApi from 'Utils/API/c-api';
import md5 from 'js-md5';
import { FileReference, isFileReference } from '../Type/api';

export interface FileUploadOptions {
  signal?: AbortSignal;
}

export type FileUploadCallback = (value: FileReference) => void;

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw new DOMException('The upload was aborted', 'AbortError');
  }
};

export const fileUpload = async (
  files: File[],
  callback?: FileUploadCallback,
  options: FileUploadOptions = {},
): Promise<FileReference[]> => {
  throwIfAborted(options.signal);

  const cacheResults: (FileReference | null)[] = await Promise.all(
    files.map(async (file) => {
      throwIfAborted(options.signal);
      const buffer = await file.arrayBuffer();
      throwIfAborted(options.signal);
      const value = await CApi.getFileByMD5({ md5: md5(buffer) }, { signal: options.signal });
      throwIfAborted(options.signal);
      if (value !== null && !isFileReference(value)) {
        throw new Error('Cached file reference is invalid');
      }
      return value ?? null;
    }),
  );

  const missingIndexes: number[] = [];
  const formData = new FormData();
  cacheResults.forEach((value, index) => {
    if (value === null) {
      missingIndexes.push(index);
      formData.append('files', files[index]);
    }
  });

  if (missingIndexes.length > 0) {
    throwIfAborted(options.signal);
    const uploaded = await CApi.uploadFile(formData, { signal: options.signal });
    throwIfAborted(options.signal);
    if (!Array.isArray(uploaded) || uploaded.length !== missingIndexes.length) {
      throw new Error('Uploaded file count does not match the requested file count');
    }
    if (!uploaded.every(isFileReference)) throw new Error('Uploaded file reference is invalid');
    missingIndexes.forEach((inputIndex, uploadIndex) => {
      cacheResults[inputIndex] = uploaded[uploadIndex];
    });
  }

  const results = cacheResults.map((value) => {
    if (!isFileReference(value)) throw new Error('Uploaded file reference is missing');
    return value;
  });
  results.forEach((value) => callback?.(value));
  return results;
};

export const fileUploadWithoutMD5 = async (
  file: File,
  callback?: FileUploadCallback,
  options: FileUploadOptions = {},
): Promise<FileReference> => {
  throwIfAborted(options.signal);
  const formData = new FormData();
  formData.append('file', file);
  const data = await CApi.uploadSingleFile(formData, { signal: options.signal });
  throwIfAborted(options.signal);
  if (!isFileReference(data)) throw new Error('Uploaded file reference is invalid');
  callback?.(data);
  return data;
};
