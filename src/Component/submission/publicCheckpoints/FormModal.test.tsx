import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import PublicCheckpointsFormModal from './FormModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('antd', () => {
  const React = require('react');
  const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) => (
      <button onClick={onClick}>{children}</button>
    ),
    Card: passthrough,
    Modal: passthrough,
    Popconfirm: passthrough,
    Space: passthrough,
    Table: passthrough,
    Tag: passthrough,
    message: { error: jest.fn(), success: jest.fn() },
  };
});

jest.mock('../../common/Form/ModalFormUseForm', () => () => null);
jest.mock('./UploadForm', () => () => null);
jest.mock('../../problem/PublicCaseDetail', () => () => null);
jest.mock('../../problem/PublicAutoFillPanel', () => () => null);
jest.mock('../../../Utils/API/m-api', () => ({
  __esModule: true,
  default: { uploadSingleCheckpoint: jest.fn() },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it('does not refetch when the initial request settles', async () => {
  const request = deferred<unknown[]>();
  const getPublicCheckpoints = jest.fn(() => request.promise);
  const { rerender, unmount } = render(
    <PublicCheckpointsFormModal
      getPublicCheckpoints={getPublicCheckpoints}
      title="Problem"
      btnProps={{}}
    />,
  );

  expect(getPublicCheckpoints).toHaveBeenCalledTimes(1);
  rerender(
    <PublicCheckpointsFormModal
      getPublicCheckpoints={() => request.promise}
      title="Problem"
      btnProps={{}}
    />,
  );
  await act(async () => request.resolve([]));
  await waitFor(() => expect(getPublicCheckpoints).toHaveBeenCalledTimes(1));
  unmount();
});

it('does not publish a late response after unmount', async () => {
  const request = deferred<unknown[]>();
  const getPublicCheckpoints = jest.fn(() => request.promise);
  const { unmount } = render(
    <PublicCheckpointsFormModal
      getPublicCheckpoints={getPublicCheckpoints}
      title="Problem"
      btnProps={{}}
    />,
  );
  unmount();
  await act(async () => request.resolve([{ checkpointId: 'late' }]));
  expect(getPublicCheckpoints).toHaveBeenCalledTimes(1);
});
