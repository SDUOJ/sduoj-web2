import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import SubmitInfo from './SubmitInfo';
import cApi from '../../Utils/API/c-api';
import extApi from '../../Utils/API/ext-api';

jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { getGroupInfo: jest.fn() },
}));
jest.mock('../../Utils/API/ext-api', () => ({
  __esModule: true,
  default: { downloadHomework: jest.fn() },
}));
jest.mock('../common/GroupUserListCard', () => ({
  __esModule: true,
  default: (props: { members: unknown[] }) =>
    require('react').createElement(
      'output',
      { 'data-testid': 'members' },
      JSON.stringify(props.members),
    ),
}));
jest.mock('./PackageDownload', () => ({
  __esModule: true,
  default: (props: { submitInfo: unknown }) =>
    require('react').createElement(
      'output',
      { 'data-testid': 'download' },
      JSON.stringify(props.submitInfo),
    ),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const props = { groupId: 1, hid: 2, deadline: '20', title: 'Homework', filename: 'files' };
const group = { members: [{ username: 'on-time' }, { username: 'late' }, { username: 'missing' }] };
const submissions = [
  { username: 'on-time', create_time: '10' },
  { username: 'late', create_time: '30' },
];

test.each(['group-first', 'homework-first'])(
  'loads details when requests finish %s',
  async (order) => {
    const groupRequest = deferred<typeof group>();
    const homeworkRequest = deferred<typeof submissions>();
    (cApi.getGroupInfo as jest.Mock).mockReturnValue(groupRequest.promise);
    (extApi.downloadHomework as jest.Mock).mockReturnValue(homeworkRequest.promise);
    render(<SubmitInfo {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /提交详情/ }));
    await act(async () => {
      if (order === 'group-first') groupRequest.resolve(group);
      else homeworkRequest.resolve(submissions);
    });
    await act(async () => {
      if (order === 'group-first') homeworkRequest.resolve(submissions);
      else groupRequest.resolve(group);
    });
    expect(await screen.findByTestId('members')).toHaveTextContent('on-time');
    expect(screen.getByTestId('download')).toHaveTextContent(JSON.stringify(submissions));
    fireEvent.click(screen.getByRole('tab', { name: '未提交' }));
    expect(screen.getAllByTestId('members').at(-1)).toHaveTextContent('missing');
    expect(cApi.getGroupInfo).toHaveBeenCalledTimes(1);
    expect(extApi.downloadHomework).toHaveBeenCalledTimes(1);
  },
);

test('changing homework discards the old request and recomputes the current members', async () => {
  const oldHomework = deferred<typeof submissions>();
  (cApi.getGroupInfo as jest.Mock).mockResolvedValue(group);
  (extApi.downloadHomework as jest.Mock)
    .mockReturnValueOnce(oldHomework.promise)
    .mockResolvedValueOnce([{ username: 'missing', create_time: '5' }]);
  const view = render(<SubmitInfo {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /提交详情/ }));
  view.rerender(<SubmitInfo {...props} groupId={3} hid={4} />);
  await waitFor(() => expect(screen.getByTestId('members')).toHaveTextContent('missing'));
  await act(async () => oldHomework.resolve(submissions));
  expect(screen.getByTestId('members')).not.toHaveTextContent('on-time');
  expect(screen.getByTestId('download')).toHaveTextContent('missing');
  expect(extApi.downloadHomework).toHaveBeenLastCalledWith({ hid: 4 });
});

test('closing and reopening retries a failed load instead of keeping half-loaded data', async () => {
  (cApi.getGroupInfo as jest.Mock).mockResolvedValue(group);
  (extApi.downloadHomework as jest.Mock)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(submissions);
  render(<SubmitInfo {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /提交详情/ }));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  fireEvent.click(screen.getByRole('button', { name: /提交详情/ }));
  expect(await screen.findByTestId('members')).toHaveTextContent('on-time');
});

test('already loaded details are replaced when the homework changes', async () => {
  (cApi.getGroupInfo as jest.Mock).mockResolvedValue(group);
  (extApi.downloadHomework as jest.Mock)
    .mockResolvedValueOnce(submissions)
    .mockResolvedValueOnce([{ username: 'missing', create_time: '5' }]);
  const view = render(<SubmitInfo {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /提交详情/ }));
  expect(await screen.findByTestId('members')).toHaveTextContent('on-time');
  view.rerender(<SubmitInfo {...props} hid={4} />);
  await waitFor(() =>
    expect(
      within(screen.getByRole('tabpanel', { name: '已提交-全部' })).getByTestId('members'),
    ).toHaveTextContent('missing'),
  );
  expect(screen.getByTestId('download')).not.toHaveTextContent('on-time');
});
