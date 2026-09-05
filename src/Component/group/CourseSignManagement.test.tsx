import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import autolabApi from '../../Utils/API/autolab-api';
import CourseSignManagement from './CourseSignManagement';

jest.mock('../../Utils/API/autolab-api', () => ({
  __esModule: true,
  default: {
    listCourses: jest.fn(),
    listCourseTimes: jest.fn(),
    initAttendance: jest.fn(),
    getAttendance: jest.fn(),
  },
}));
jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { getFileDownloadUrl: jest.fn() },
}));
jest.mock('antd', () => {
  const React = require('react');
  const passthrough = ({ children }: any) => <div>{children}</div>;
  const Form = Object.assign(passthrough, { Item: passthrough });
  return {
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    Card: passthrough,
    Empty: ({ description }: any) => <div>{description}</div>,
    Form,
    Input: ({ allowClear: _allowClear, ...props }: any) => <input {...props} />,
    Modal: ({ children, open, title }: any) =>
      open ? (
        <section>
          <h2>{title}</h2>
          {children}
        </section>
      ) : null,
    Select: () => null,
    Space: passthrough,
    Spin: ({ children }: any) => <div>{children}</div>,
    Table: ({ dataSource = [], columns = [] }: any) => (
      <div>
        <span data-testid="table-data">{JSON.stringify(dataSource)}</span>
        {dataSource.map((row: any, index: number) => (
          <div key={row.course_id ?? row.schedule_id ?? row.username ?? index}>
            {columns.map((column: any, columnIndex: number) =>
              column.render ? (
                <React.Fragment key={columnIndex}>
                  {column.render(row[column.dataIndex], row)}
                </React.Fragment>
              ) : null,
            )}
          </div>
        ))}
      </div>
    ),
    Tabs: ({ items }: any) => (
      <div>
        {items.map((item: any) => (
          <div key={item.key}>{item.children}</div>
        ))}
      </div>
    ),
    Tag: passthrough,
    Transfer: () => null,
    message: { error: jest.fn(), warning: jest.fn() },
  };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it('keeps detail students bound to the most recently selected sign-in', async () => {
  const oldAttendance = deferred<any>();
  (autolabApi.listCourses as jest.Mock).mockResolvedValue({
    courses: [
      { course_id: 1, course_name: 'course-a', group_id: 9 },
      { course_id: 2, course_name: 'course-b', group_id: 9 },
    ],
  });
  (autolabApi.listCourseTimes as jest.Mock).mockImplementation((courseId) =>
    Promise.resolve({
      time_list: [{ time_id: courseId, schedule_id: courseId }],
      sign_list: [courseId === 1 ? 101 : 202],
    }),
  );
  (autolabApi.initAttendance as jest.Mock).mockImplementation((courseId) =>
    Promise.resolve({ sg_id: courseId === 1 ? 101 : 202 }),
  );
  (autolabApi.getAttendance as jest.Mock).mockImplementation((sgId) =>
    sgId === 101
      ? oldAttendance.promise
      : Promise.resolve({ students: [{ username: 'new-student' }] }),
  );

  render(<CourseSignManagement groupId={9} />);
  const detailButtons = await screen.findAllByRole('button', { name: '详情' });
  fireEvent.click(detailButtons[0]);
  await waitFor(() => expect(autolabApi.getAttendance).toHaveBeenCalledWith(101));
  fireEvent.click(detailButtons[1]);
  await waitFor(() => expect(document.body).toHaveTextContent('new-student'));
  await act(async () => oldAttendance.resolve({ students: [{ username: 'old-student' }] }));
  expect(document.body).toHaveTextContent('new-student');
  expect(document.body).not.toHaveTextContent('old-student');
});
