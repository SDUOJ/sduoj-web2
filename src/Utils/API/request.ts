import apiAddress from './apiAddress';
import axios, { AxiosRequestConfig, AxiosResponse, CanceledError } from 'axios';
import { Get, Post } from '../../Type/types';
import { message } from 'antd';
import { UrlPrefix } from '../../Config/constValue';
import { requestConstraintError } from '../../Config/validation/requests';
import { loginRedirect } from '../authReturn';
import { reportApiFailure } from '../errorReporter';
import { notifyAuthBoundary } from '../authBoundary';
import i18n from '../../Config/i18n';
import { isApiEnvelope, isApiRecord } from '../../Type/api';

export const MAX_DOWNLOAD_BYTES = 256 * 1024 * 1024;

const baseUrl = apiAddress().CLIENT_SERVER + '/api';

export const service = axios.create({
  baseURL: baseUrl,
  timeout: 30_000,
});
service.defaults.withCredentials = true;

const pendingManagementRequests = new Set<AbortController>();

const invalidateAuthBoundary = () => {
  pendingManagementRequests.forEach((controller) => controller.abort());
  notifyAuthBoundary();
};

const guardedRequest = async <Result>(
  url: string,
  config: AxiosRequestConfig | undefined,
  execute: (config: AxiosRequestConfig) => Promise<Result>,
): Promise<Result> => {
  if (!url.startsWith('/manage/')) return execute(config ?? {});
  const controller = new AbortController();
  const abort = () => controller.abort();
  const inheritedSignal = config?.signal;
  if (inheritedSignal?.aborted) abort();
  inheritedSignal?.addEventListener?.('abort', abort, { once: true });
  pendingManagementRequests.add(controller);
  try {
    return await execute({ ...config, signal: controller.signal });
  } finally {
    pendingManagementRequests.delete(controller);
    inheritedSignal?.removeEventListener?.('abort', abort);
  }
};

const readBlobPayload = async (value: unknown): Promise<unknown> => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  if (!(value instanceof Blob)) return value;
  try {
    const text =
      typeof value.text === 'function'
        ? await value.text()
        : await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(reader.error);
            reader.readAsText(value);
          });
    if (!text.trim()) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
};

const hasErrorResponse = (
  error: unknown,
): error is { response: { status: number; data: unknown } } =>
  isApiRecord(error) && isApiRecord(error.response) && typeof error.response.status === 'number';

const binaryError = async (error: unknown) => {
  if (hasErrorResponse(error) && error.response.data instanceof Blob) {
    const payload = await readBlobPayload(error.response.data);
    error.response = { ...error.response, data: payload };
  }
  return error;
};

const downloadPost = async (
  url: string,
  data: object,
  config?: AxiosRequestConfig,
  filename?: string,
  expectedContentType?: RegExp,
  method: 'GET' | 'POST' = 'POST',
) => {
  try {
    const response = await guardedRequest(url, config, (guardedConfig) =>
      method === 'GET'
        ? service.get<Blob | ArrayBuffer | string>(url, {
            ...guardedConfig,
            params: data,
            responseType: 'blob',
          })
        : service.post<Blob | ArrayBuffer | string>(url, data, {
            ...guardedConfig,
            responseType: 'blob',
          }),
    );
    const contentType = String(response.headers?.['content-type'] ?? '').toLowerCase();
    const advertisedSize = Number(response.headers?.['content-length']);
    if (
      advertisedSize > MAX_DOWNLOAD_BYTES ||
      (response.data instanceof Blob && response.data.size > MAX_DOWNLOAD_BYTES)
    ) {
      throw new Error(i18n.t('DownloadTooLarge'));
    }
    if (
      contentType.includes('json') ||
      (contentType.startsWith('text/') && !expectedContentType?.test(contentType))
    ) {
      const payload = await readBlobPayload(response.data);
      throw { response: { ...response, data: payload } };
    }
    if (expectedContentType && !expectedContentType.test(contentType)) {
      throw new Error(i18n.t('DownloadInvalidContentType'));
    }
    const blob = new Blob([response.data], { type: contentType || 'application/octet-stream' });
    if (blob.size > MAX_DOWNLOAD_BYTES) throw new Error(i18n.t('DownloadTooLarge'));
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    try {
      link.href = objectUrl;
      link.download = filename ?? `${Date.now()}-TestCase.zip`;
      link.click();
    } finally {
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    }
  } catch (e) {
    if (axios.isAxiosError(e) || hasErrorResponse(e)) {
      return dealResponse(Promise.reject(await binaryError(e)), url);
    }
    message.error(e instanceof Error ? e.message : i18n.t('DownloadFailed'));
    throw e;
  }
  return Promise.resolve();
};

const getZipFile = (url: string, data: object, config?: AxiosRequestConfig, filename?: string) =>
  downloadPost(
    url,
    data,
    config,
    filename,
    /^application\/(?:zip|x-zip-compressed|octet-stream)(?:;|$)/,
  );

const downloadFile = (url: string, data: object, config?: AxiosRequestConfig, filename?: string) =>
  downloadPost(url, data, config, filename);

const messageDisabledList = [
  '/user/getProfile',
  '/submit/queryACProblem',
  '/group/my',
  '/problem_set/upcoming',
  '/ps/ide/',
];

const messageDisabled = (url: string) =>
  messageDisabledList.some((item) => (item.endsWith('/') ? url.startsWith(item) : item === url));

const parseErrorMessage = (payload: unknown, fallback = '请求失败') => {
  if (payload === undefined || payload === null) return fallback;
  if (typeof payload === 'string' && payload.trim() !== '') return payload.trim();
  if (!isApiRecord(payload)) return fallback;
  if (typeof payload.message === 'string' && payload.message.trim() !== '')
    return payload.message.trim();
  if (typeof payload.msg === 'string' && payload.msg.trim() !== '') return payload.msg.trim();

  const detail = payload.detail;
  if (typeof detail === 'string' && detail.trim() !== '') return detail.trim();
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === 'string' && first.trim() !== '') return first.trim();
    if (isApiRecord(first) && typeof first.msg === 'string' && first.msg.trim() !== '')
      return first.msg.trim();
  }
  if (isApiRecord(detail) && typeof detail.msg === 'string' && detail.msg.trim() !== '')
    return detail.msg.trim();

  return fallback;
};

const rejection = (message: string) => Promise.reject(message);

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

const dealResponse = async <Payload>(
  resp: Promise<AxiosResponse<unknown>>,
  url: string,
  errorDetails = false,
): Promise<Payload> => {
  const reject = (message: string, response?: { status: number; data: unknown }) => {
    const code = isApiRecord(response?.data) ? response.data.code : undefined;
    return errorDetails
      ? Promise.reject(
          new ApiRequestError(
            message,
            response?.status,
            typeof code === 'number' ? code : undefined,
          ),
        )
      : rejection(message);
  };
  try {
    const response = await resp;
    if (!isApiEnvelope(response.data)) {
      const invalidResponse = i18n.t('InvalidApiResponse');
      message.error(invalidResponse);
      reportApiFailure(new Error(invalidResponse), url);
      return reject(invalidResponse, response);
    }
    const rawTimestamp = response.data.timestamp;
    const timestamp = rawTimestamp === null || rawTimestamp === '' ? NaN : Number(rawTimestamp);
    if (Number.isFinite(timestamp)) {
      try {
        localStorage.setItem('server-time', String(timestamp));
      } catch {
        // Storage can be unavailable in privacy-restricted contexts; it is not part of the API result.
      }
      if (Math.abs(timestamp - Date.now()) > 60000) {
        window.location.replace(UrlPrefix + '/error/time');
        message.error('本地时间异常');
        return reject('本地时间异常', response);
      }
    }
    switch (response.data.code) {
      case 0:
        return response.data.data as Payload;
      default:
        message.error(parseErrorMessage(response.data));
        return reject(parseErrorMessage(response.data), response);
    }
  } catch (error: unknown) {
    if (axios.isCancel(error) || error instanceof CanceledError) throw error;

    const response = hasErrorResponse(error) ? error.response : undefined;
    if (response === undefined || Number(response.status) >= 500) {
      reportApiFailure(error, url);
    }
    if (response === undefined) {
      // respect silence list for network unreachable as well
      if (!messageDisabled(url)) message.error('服务器不可达');
      return reject('服务器不可达');
    }
    if (response.status === 400) {
      const errorMsg = parseErrorMessage(response.data, '请求参数错误');
      message.error(errorMsg);
      return reject(errorMsg, response);
    }
    const payload = response.data;
    switch (response.status === 401 ? 401 : isApiRecord(payload) ? payload.code : undefined) {
      case 401:
        invalidateAuthBoundary();
        if (!messageDisabled(url)) {
          const current = new URL(window.location.href);
          const inApp =
            current.pathname === UrlPrefix || current.pathname.startsWith(UrlPrefix + '/');
          if (current.pathname !== UrlPrefix + '/login') {
            window.location.replace(
              inApp
                ? loginRedirect({
                    pathname: current.pathname,
                    search: current.search,
                    hash: current.hash,
                  })
                : loginRedirect({ pathname: UrlPrefix }),
            );
          }
          message.error(parseErrorMessage(payload, '未登录或登录已过期'));
        }
        return reject(parseErrorMessage(payload, '未登录或登录已过期'), response);
      default: {
        const errorMsg = parseErrorMessage(payload);
        if (!messageDisabled(url)) message.error(errorMsg);
        return reject(errorMsg, response);
      }
    }
  }
};

const getResult = async <Payload>(
  url: string,
  params?: object,
  config?: AxiosRequestConfig,
  errorDetails = false,
) => {
  const error = requestConstraintError(url, config?.params ?? params, 'GET');
  if (error) {
    message.error(error);
    return errorDetails ? Promise.reject(new ApiRequestError(error, 400)) : rejection(error);
  }
  return await dealResponse<Payload>(
    guardedRequest(url, config, (guardedConfig) =>
      service.get<unknown>(url, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        params,
        ...guardedConfig,
      }),
    ),
    url,
    errorDetails,
  );
};
const get: Get = getResult;

const post: Post = async <Payload>(url: string, data: unknown, config?: AxiosRequestConfig) => {
  const error = requestConstraintError(url, data);
  if (error) {
    message.error(error);
    return rejection(error);
  }
  return await dealResponse<Payload>(
    guardedRequest(url, config, (guardedConfig) =>
      service.post<unknown>(url, data, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        ...guardedConfig,
      }),
    ),
    url,
  );
};

const request = {
  get,
  getWithErrorDetails: <Payload>(url: string, params?: object, config?: AxiosRequestConfig) =>
    getResult<Payload>(url, params, config, true),
  post,
  getZipFile,
  downloadFile,
  getCsvFile: (url: string, params: object, filename: string) =>
    downloadPost(url, params, undefined, filename, /^text\/csv(?:;|$)/, 'GET'),
};
export default request;
