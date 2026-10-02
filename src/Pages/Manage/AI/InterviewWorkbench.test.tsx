import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InterviewWorkbench from './InterviewWorkbench';
import { interviewApi } from './interview-api';

jest.mock('./interview-api', () => ({
  interviewApi: { list: jest.fn(), invite: jest.fn(), renew: jest.fn() },
  operationKey: () => 'stable-operation',
}));

jest.mock('./AIWorkspaceNav', () => () => <nav>AI nav</nav>);

test('lists assigned interviews with their effective state', async () => {
  (interviewApi.list as jest.Mock).mockResolvedValue({
    pageIndex: 1,
    pageSize: 20,
    totalNum: 1,
    rows: [
      {
        id: 'interview-1',
        kind: 'interview',
        version: 1,
        state: 'invited',
        role: 'student',
        effective_status: 'pending',
        data: {
          title: 'Queue lab',
          student_id: '42',
          student_username: 'student',
          expires_at: '2026-09-08T10:00:00',
        },
      },
    ],
  });
  render(
    <MemoryRouter>
      <InterviewWorkbench />
    </MemoryRouter>,
  );
  expect(await screen.findByText('Queue lab')).toBeInTheDocument();
  expect(screen.getByText('待开始')).toBeInTheDocument();
  expect(screen.getByText('student · 42')).toBeInTheDocument();
});

test('creates a rubric-bound invitation from the workbench', async () => {
  (interviewApi.list as jest.Mock).mockResolvedValue({ rows: [], totalNum: 0 });
  (interviewApi.invite as jest.Mock).mockResolvedValue({ id: 'new-interview' });
  render(
    <MemoryRouter>
      <InterviewWorkbench />
    </MemoryRouter>,
  );
  const inviteLabel = await screen.findByText('发起验收');
  fireEvent.click(inviteLabel.closest('button')!);
  fireEvent.change(screen.getByLabelText('验收名称'), { target: { value: 'Lab 2' } });
  fireEvent.change(screen.getByLabelText('学生用户名'), { target: { value: 'alice' } });
  fireEvent.change(screen.getByLabelText('学生 ID'), { target: { value: '1024' } });
  const submitButton = document.querySelector(
    '.ant-modal-footer .ant-btn-primary',
  ) as HTMLButtonElement | null;
  expect(submitButton).toBeDefined();
  fireEvent.click(submitButton!);
  await waitFor(() =>
    expect(interviewApi.invite).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: '1024',
        student_username: 'alice',
        required_tracks: ['video'],
        rubric: [
          { name: '实现正确性', max_score: 60 },
          { name: '理解与表达', max_score: 40 },
        ],
      }),
    ),
  );
});
