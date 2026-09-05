import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import autolabApi from '../../Utils/API/autolab-api';
import CourseTab from './CourseTab';
import CourseDetail from './CourseDetail';

jest.mock('../../Utils/API/autolab-api', () => ({
  __esModule: true,
  default: {
    listMyCourses: jest.fn(),
    getStudentAttendanceRecords: jest.fn(),
  },
}));
jest.mock('../common/Form/Item/ItemUploadUser', () => () => null);
jest.mock('antd', () => {
  const React = require('react');
  const passthrough = ({ children }: any) => <div>{children}</div>;
  const Descriptions = Object.assign(passthrough, { Item: passthrough });
  const Form = Object.assign(passthrough, {
    Item: passthrough,
    useForm: () => [
      { setFieldsValue: jest.fn(), validateFields: jest.fn(), resetFields: jest.fn() },
    ],
  });
  return {
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    Card: passthrough,
    Descriptions,
    Divider: passthrough,
    Empty: ({ description }: any) => <div>{description}</div>,
    Form,
    Input: Object.assign((props: any) => <input {...props} />, {
      TextArea: (props: any) => <textarea {...props} />,
    }),
    Modal: ({ children, open }: any) => (open ? <div>{children}</div> : null),
    Select: () => null,
    Space: passthrough,
    Spin: () => <div>loading</div>,
    Table: ({ dataSource }: any) => <div data-testid="rows">{JSON.stringify(dataSource)}</div>,
    Tabs: ({ items }: any) => (
      <div>
        {items.map((item: any) => (
          <div key={item.key}>{item.label}</div>
        ))}
      </div>
    ),
    Tag: passthrough,
  };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

it('keeps the newest group course list when an older request settles last', async () => {
  const oldRequest = deferred<any>();
  const newRequest = deferred<any>();
  (autolabApi.listMyCourses as jest.Mock)
    .mockReturnValueOnce(oldRequest.promise)
    .mockReturnValueOnce(newRequest.promise);

  const view = render(<CourseTab groupId={1} username="student" />);
  view.rerender(<CourseTab groupId={2} username="student" />);
  await act(async () =>
    newRequest.resolve({ courses: [{ course_id: 2, course_name: 'new-course' }] }),
  );
  expect(await screen.findByText('new-course')).toBeVisible();
  await act(async () => oldRequest.reject(new Error('stale failure')));
  expect(screen.getByText('new-course')).toBeVisible();
});

it('keeps attendance records bound to the newest student', async () => {
  const oldRequest = deferred<any>();
  const newRequest = deferred<any>();
  (autolabApi.getStudentAttendanceRecords as jest.Mock)
    .mockReturnValueOnce(oldRequest.promise)
    .mockReturnValueOnce(newRequest.promise);
  const course = {
    course_id: 7,
    course_times: [{ time_id: 1, schedule_id: 1 }],
    sign_list: [11],
  };

  const view = render(<CourseDetail course={course} targetUsername="old" currentUsername="old" />);
  view.rerender(<CourseDetail course={course} targetUsername="new" currentUsername="new" />);
  await act(async () => newRequest.resolve({ records: [{ sg_id: 11, marker: 'new-record' }] }));
  await waitFor(() => expect(screen.getByTestId('rows')).toHaveTextContent('new-record'));
  await act(async () => oldRequest.resolve({ records: [{ sg_id: 11, marker: 'old-record' }] }));
  expect(screen.getByTestId('rows')).toHaveTextContent('new-record');
  expect(screen.getByTestId('rows')).not.toHaveTextContent('old-record');
});
