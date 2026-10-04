import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { message, Upload } from 'antd';
import { UploadFile as AdminUploadFile } from './ItemUpload';
import { UploadPro as MultiUpload } from './ItemUploadMulti';
import { UploadFile as UserUploadFile } from './ItemUploadUser';
import { fileUpload, fileUploadWithoutMD5 } from '../../../../Utils/fileUpload';
import cApi from '../../../../Utils/API/c-api';

let mockDraggerProps: any;

jest.mock('antd/lib/upload/Dragger', () => ({
  __esModule: true,
  default: (props: any) => {
    mockDraggerProps = props;
    return (
      <div data-testid="dragger" data-accept={props.accept}>
        {props.children}
      </div>
    );
  },
}));
jest.mock('../../../../Utils/fileUpload', () => ({
  fileUpload: jest.fn(),
  fileUploadWithoutMD5: jest.fn(),
}));
jest.mock('../../../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { getFileDownloadUrl: jest.fn(() => '/download/safe') },
}));

const upload = jest.mocked(fileUploadWithoutMD5);
const translate = (key: string, values?: Record<string, unknown>) =>
  `${key}${values ? `:${JSON.stringify(values)}` : ''}`;

beforeEach(() => jest.clearAllMocks());

it('validates file size, stores the filename and completes a user upload', async () => {
  const onChange = jest.fn();
  const setFilename = jest.fn();
  const view = render(
    <AdminUploadFile
      value={null}
      onChange={onChange}
      setFilename={setFilename}
      accept=".zip,.txt"
      max_size={1}
      t={translate}
    />,
  );
  expect(screen.getByText(/UploadAcceptHint/)).toBeInTheDocument();
  const dragger = view.getByTestId('dragger');
  expect(dragger).toHaveAttribute('data-accept', '.zip,.txt');

  view.unmount();
  render(
    <UserUploadFile
      value={null}
      onChange={onChange}
      setFilename={setFilename}
      accept=".zip,.txt"
      max_size={1}
      t={translate}
    />,
  );
  const large = new File([new Uint8Array(1024 * 1024 + 1)], 'large.zip');
  act(() => {
    expect(mockDraggerProps.beforeUpload(large)).toBe(Upload.LIST_IGNORE);
  });
  upload.mockImplementation(async (_file, callback) => {
    callback?.({ id: 'uploaded-id' });
    return { id: 'uploaded-id' };
  });
  const file = new File(['small'], 'answer.txt');
  act(() => {
    expect(mockDraggerProps.beforeUpload(file)).toBe(true);
  });
  expect(setFilename).toHaveBeenCalledWith('answer.txt');
  const request = {
    file,
    onSuccess: jest.fn(),
    onError: jest.fn(),
  };
  mockDraggerProps.customRequest(request);
  await Promise.resolve();
  expect(onChange).toHaveBeenCalledWith('uploaded-id');
  expect(request.onSuccess).toHaveBeenCalled();
  act(() => message.destroy());

  const deleteView = render(
    <UserUploadFile
      value="old-id"
      onChange={onChange}
      setFilename={setFilename}
      accept=".zip"
      max_size={1}
      t={translate}
    />,
  );
  fireEvent.click(deleteView.getByRole('button', { name: 'delete' }));
  expect(onChange).toHaveBeenCalledWith(null);
  expect(Upload.LIST_IGNORE).toBeDefined();
});

it('downloads and deletes an existing management attachment and forwards upload completion', async () => {
  const onChange = jest.fn();
  const open = jest.spyOn(window, 'open').mockImplementation(() => null);
  const adminUpload = jest.mocked(fileUpload);
  adminUpload.mockImplementation(async (_files, callback) => {
    callback?.({ id: 'admin-id' });
    return [{ id: 'admin-id' }];
  });
  render(
    <AdminUploadFile
      value="existing-id"
      onChange={onChange}
      accept=".zip"
      use="admin"
      downloadFilename="archive"
      downloadFileSuffix=".zip"
      t={translate}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Download' }));
  expect(cApi.getFileDownloadUrl).toHaveBeenCalledWith('existing-id', 'archive.zip');
  expect(open).toHaveBeenCalledWith('/download/safe', '_blank', 'noopener,noreferrer');
  fireEvent.click(screen.getByRole('button', { name: 'delete' }));
  expect(onChange).toHaveBeenCalledWith(null);

  const request = { file: new File(['a'], 'a.zip'), onSuccess: jest.fn(), onError: jest.fn() };
  const operation = mockDraggerProps.customRequest(request);
  await Promise.resolve();
  await Promise.resolve();
  expect(onChange).toHaveBeenCalledWith('admin-id');
  expect(request.onSuccess).toHaveBeenCalledWith({ id: 'admin-id' });
  const signal = adminUpload.mock.calls[0][2]?.signal;
  operation.abort();
  expect(signal?.aborted).toBe(true);
  open.mockRestore();
});

it('maps multi-file selections to origin files and renders accepted extensions', () => {
  const onChange = jest.fn();
  const view = render(<MultiUpload accept=".pdf,.docx" onChange={onChange} t={translate} />);
  expect(view.getByText(/UploadAcceptHintMulti/)).toHaveTextContent('*.pdf/*.docx');
  const selected = [
    { originFileObj: new File(['a'], 'a.pdf') },
    { originFileObj: new File(['b'], 'b.docx') },
  ];
  expect(screen.getByTestId('dragger')).toBeInTheDocument();
  expect(mockDraggerProps.beforeUpload()).toBe(false);
  mockDraggerProps.onChange({ fileList: selected });
  expect(onChange).toHaveBeenCalledWith(selected.map((item) => item.originFileObj));
});
