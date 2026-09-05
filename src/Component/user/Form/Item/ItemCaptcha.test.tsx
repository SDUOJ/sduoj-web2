import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import CApi from '../../../../Utils/API/c-api';
import ItemCaptcha from './ItemCaptcha';

jest.mock('../../../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { getCaptcha: jest.fn() },
}));
jest.mock('react-i18next', () => ({ withTranslation: () => (Component: any) => Component }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

it('commits only the newest captcha when refresh responses arrive out of order', async () => {
  const initial = deferred<any>();
  const firstRefresh = deferred<any>();
  const secondRefresh = deferred<any>();
  (CApi.getCaptcha as jest.Mock)
    .mockReturnValueOnce(initial.promise)
    .mockReturnValueOnce(firstRefresh.promise)
    .mockReturnValueOnce(secondRefresh.promise);
  const setImgId = jest.fn();
  render(<ItemCaptcha setImgId={setImgId} setCaptcha={jest.fn()} />);
  const refresh = screen.getByRole('button');
  fireEvent.click(refresh);
  fireEvent.click(refresh);

  await act(async () => secondRefresh.resolve({ captcha: 'new-image', captchaId: 'new-id' }));
  expect(document.querySelector('img')).toHaveAttribute('src', 'new-image');
  expect(setImgId).toHaveBeenLastCalledWith('new-id');
  await act(async () => firstRefresh.resolve({ captcha: 'old-image', captchaId: 'old-id' }));
  await act(async () => initial.reject(new Error('stale failure')));
  expect(document.querySelector('img')).toHaveAttribute('src', 'new-image');
  expect(setImgId).toHaveBeenCalledTimes(1);
});

it('does not publish a captcha after unmount', async () => {
  const request = deferred<any>();
  (CApi.getCaptcha as jest.Mock).mockReturnValueOnce(request.promise);
  const setImgId = jest.fn();
  const view = render(<ItemCaptcha setImgId={setImgId} setCaptcha={jest.fn()} />);
  view.unmount();
  await act(async () => request.resolve({ captcha: 'late-image', captchaId: 'late-id' }));
  expect(setImgId).not.toHaveBeenCalled();
});
