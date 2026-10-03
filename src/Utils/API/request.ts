import apiAddress from './apiAddress';
import axios, { AxiosError, AxiosRequestConfig, CanceledError } from 'axios';
import { Get, Post } from '../../Type/types';
import { message } from 'antd';
import { UrlPrefix } from '../../Config/constValue';
import { requestConstraintError } from '../../Config/validation/requests';
import { loginRedirect } from '../authReturn';
import { reportApiFailure } from '../errorReporter';

const baseUrl = apiAddress().CLIENT_SERVER + '/api';

export const service = axios.create({
  baseURL: baseUrl,
  timeout: 30_000,
});
service.defaults.withCredentials = true;

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
      typeof (value as any).text === 'function'
        ? await (value as any).text()
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

const binaryError = async (error: any) => {
  if (error?.response?.data instanceof Blob) {
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
) => {
  try {
    const response = await service.post(url, data, {
      ...config,
      responseType: 'blob',
    });
    const contentType = String(response.headers?.['content-type'] ?? '').toLowerCase();
    if (contentType.includes('json') || contentType.startsWith('text/')) {
      const payload = await readBlobPayload(response.data);
      throw { response: { ...response, data: payload } };
    }
    if (expectedContentType && contentType && !expectedContentType.test(contentType)) {
      throw new Error('服务器返回了无法识别的文件类型');
    }
    let blob = new Blob([response.data], { type: 'application/zip' });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename ?? `${Date.now()}-TestCase.zip`;
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  } catch (e) {
    if (axios.isAxiosError(e) || (e as any)?.response !== undefined) {
      return dealResponse(Promise.reject(await binaryError(e)), url);
    }
    throw e;
  }
  return Promise.resolve();
};

const getZipFile = (url: string, data: object, config?: AxiosRequestConfig, filename?: string) =>
  downloadPost(url, data, config, filename, /zip|octet-stream/);

const downloadFile = (url: string, data: object, config?: AxiosRequestConfig, filename?: string) =>
  downloadPost(url, data, config, filename);

const messageDisabledList = [
  '/user/getProfile',
  '/submit/queryACProblem',
  '/group/my',
  '/problem_set/upcoming',
];

const parseErrorMessage = (payload: any, fallback = '请求失败') => {
  if (payload === undefined || payload === null) return fallback;
  if (typeof payload === 'string' && payload.trim() !== '') return payload.trim();
  if (typeof payload?.message === 'string' && payload.message.trim() !== '')
    return payload.message.trim();
  if (typeof payload?.msg === 'string' && payload.msg.trim() !== '') return payload.msg.trim();

  const detail = payload?.detail;
  if (typeof detail === 'string' && detail.trim() !== '') return detail.trim();
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === 'string' && first.trim() !== '') return first.trim();
    if (typeof first?.msg === 'string' && first.msg.trim() !== '') return first.msg.trim();
  }
  if (typeof detail?.msg === 'string' && detail.msg.trim() !== '') return detail.msg.trim();

  return fallback;
};

const rejection = (message: string) => Promise.reject(message);

const dealResponse = async (resp: any, url: string) => {
  try {
    const response = await resp;
    const rawTimestamp = response.data?.timestamp;
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
        return rejection('本地时间异常');
      }
    }
    switch (response.data.code) {
      case 0:
        return response.data.data;
      default:
        message.error(parseErrorMessage(response.data));
        return rejection(parseErrorMessage(response.data));
    }
  } catch (error: unknown) {
    if (axios.isCancel(error) || error instanceof CanceledError) throw error;

    const response = (error as AxiosError)?.response;
    if (response === undefined || Number(response.status) >= 500) {
      reportApiFailure(error, url);
    }
    if (response === undefined) {
      // respect silence list for network unreachable as well
      if (messageDisabledList.indexOf(url) === -1) message.error('服务器不可达');
      return rejection('服务器不可达');
    }
    if (response.status === 400) {
      const errorMsg = parseErrorMessage(response.data, '请求参数错误');
      message.error(errorMsg);
      return rejection(errorMsg);
    }
    const payload: any = response.data;
    switch (response.status === 401 ? 401 : payload?.code) {
      case 401:
        if (messageDisabledList.indexOf(url) === -1) {
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
        return rejection(parseErrorMessage(payload, '未登录或登录已过期'));
      default: {
        const errorMsg = parseErrorMessage(payload);
        if (messageDisabledList.indexOf(url) === -1) message.error(errorMsg);
        return rejection(errorMsg);
      }
    }
  }
};

const get: Get = async (url: string, params?: object, config?: AxiosRequestConfig) => {
  const error = requestConstraintError(url, config?.params ?? params, 'GET');
  if (error) {
    message.error(error);
    return rejection(error);
  }
  return await dealResponse(
    service.get(url, {
      ...{ headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } },
      params,
      ...config,
    }),
    url,
  );
};

const post: Post = async (url: string, data: object, config?: AxiosRequestConfig) => {
  const error = requestConstraintError(url, data);
  if (error) {
    message.error(error);
    return rejection(error);
  }
  return await dealResponse(
    service.post(url, data, {
      ...{ headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } },
      ...config,
    }),
    url,
  );
};

const request = {
  get,
  post,
  getZipFile,
  downloadFile,
};
export default request;
