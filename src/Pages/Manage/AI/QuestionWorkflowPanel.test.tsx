import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionWorkflowPanel from './QuestionWorkflowPanel';
import { AiResource, aiWorkbench } from '../../../Utils/API/ai-workbench';
import i18n from '../../../Config/i18n';

// The panel intentionally exercises several Ant Design transitions and async reloads.
// Keep enough headroom for instrumented coverage runs while retaining a finite bound.
jest.setTimeout(60000);

jest.mock('../../../Utils/API/ai-workbench', () => ({
  aiWorkbench: {
    listCollections: jest.fn(),
    listCollaborations: jest.fn(),
    collaboration: jest.fn(),
    inviteCollaborator: jest.fn(),
    acceptCollaboration: jest.fn(),
    revokeCollaborator: jest.fn(),
    createAssignment: jest.fn(),
    upload: jest.fn(),
    intake: jest.fn(),
    waitForJob: jest.fn(),
    runQuestionTask: jest.fn(),
    history: jest.fn(),
    restoreVersion: jest.fn(),
    update: jest.fn(),
    manifest: jest.fn(),
    collectionQuestions: jest.fn(),
    detachItem: jest.fn(),
    restoreItem: jest.fn(),
    detachDuplicate: jest.fn(),
    restoreDuplicate: jest.fn(),
  },
}));

const question: AiResource = {
  id: 'q-1',
  kind: 'question',
  version: 2,
  state: 'ready',
  data: {
    question_type: 'short_answer',
    original: 'FIFO?',
    zh: '什么是 FIFO？',
    tags: ['队列'],
    verification: { passed: true, evidence: ['定义一致'], explanation: '通过' },
  },
};
const collection: AiResource = {
  id: 'c-1',
  kind: 'collection',
  version: 3,
  state: 'ready',
  data: { title: '数据结构题集' },
};

beforeEach(async () => {
  await i18n.changeLanguage('zh');
  (aiWorkbench.listCollections as jest.Mock).mockResolvedValue({ rows: [collection], totalNum: 1 });
  (aiWorkbench.listCollaborations as jest.Mock).mockResolvedValue([
    { id: 'c-1', title: '数据结构题集', role: 'owner', version: 3 },
  ]);
  (aiWorkbench.waitForJob as jest.Mock).mockResolvedValue({ status: 'success' });
  (aiWorkbench.collectionQuestions as jest.Mock).mockResolvedValue({
    rows: [],
    totalNum: 0,
    unavailable_numbers: [],
  });
});

test('submits text intake with the automatic solve and verify pipeline', async () => {
  const user = userEvent.setup();
  const changed = jest.fn().mockResolvedValue(undefined);
  (aiWorkbench.intake as jest.Mock).mockResolvedValue({
    taskId: 'job-1',
    collection,
    batch_id: 'b1',
  });
  render(<QuestionWorkflowPanel questions={[question]} onChanged={changed} />);
  await user.click(screen.getByRole('button', { name: /录题与修订/ }));
  await user.click(await screen.findByRole('button', { name: /自动录题/ }));
  fireEvent.change(screen.getByLabelText('题目文本'), { target: { value: '1. 什么是 FIFO？' } });
  await user.click(screen.getByRole('button', { name: /确 定|OK/ }));
  await waitFor(() =>
    expect(aiWorkbench.intake).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '题目录入批次',
        text: '1. 什么是 FIFO？',
        file_ids: [],
        auto_solve: true,
        auto_verify: true,
      }),
    ),
  );
  expect(aiWorkbench.waitForJob).toHaveBeenCalledWith('job-1');
  expect(changed).toHaveBeenCalled();
});

test('offers a rear-camera capture input for mobile photo intake', async () => {
  const user = userEvent.setup();
  render(
    <QuestionWorkflowPanel
      questions={[question]}
      onChanged={jest.fn().mockResolvedValue(undefined)}
    />,
  );
  await user.click(screen.getByRole('button', { name: /录题与修订/ }));
  await user.click(await screen.findByRole('button', { name: /自动录题/ }));
  expect(screen.getByRole('button', { name: /拍照录题/ })).toBeInTheDocument();
  expect(document.querySelector('input[type="file"][capture="environment"]')).not.toBeNull();
});

test('runs a per-question solve and exposes persisted revision restore', async () => {
  const user = userEvent.setup();
  const solved = { ...question, version: 3, data: { ...question.data, answer: '先进先出' } };
  const chatted = {
    ...solved,
    version: 4,
    data: {
      ...solved.data,
      messages: [
        { role: 'user', text: '给出一个例子' },
        { role: 'assistant', text: '排队购票。' },
      ],
    },
  };
  (aiWorkbench.runQuestionTask as jest.Mock)
    .mockResolvedValueOnce(solved)
    .mockResolvedValueOnce(chatted);
  (aiWorkbench.history as jest.Mock).mockResolvedValue({
    totalNum: 1,
    rows: [
      {
        id: 'rev-1',
        version: 1,
        state: 'draft',
        deleted: false,
        data: question.data,
        sha256: 'abc',
        created_at: '2026-09-05T00:00:00Z',
      },
    ],
  });
  (aiWorkbench.restoreVersion as jest.Mock).mockResolvedValue(question);
  render(
    <QuestionWorkflowPanel
      questions={[question]}
      onChanged={jest.fn().mockResolvedValue(undefined)}
    />,
  );
  await user.click(screen.getByRole('button', { name: /录题与修订/ }));
  await user.click(screen.getByRole('combobox', { name: '选择题目' }));
  await user.click(await screen.findByText('什么是 FIFO？'));
  await user.click(screen.getByRole('button', { name: /解/ }));
  expect(await screen.findByText('先进先出')).toBeInTheDocument();
  await user.type(screen.getByLabelText('题目追问'), '给出一个例子');
  await user.click(screen.getByRole('button', { name: '发送追问' }));
  expect(await screen.findByText(/排队购票/)).toBeInTheDocument();
  expect(aiWorkbench.runQuestionTask).toHaveBeenLastCalledWith(
    'q-1',
    'question.chat',
    '给出一个例子',
  );
  await user.click(screen.getByRole('button', { name: /历史/ }));
  await user.click(await screen.findByRole('button', { name: /恢复此版本/ }));
  expect(aiWorkbench.restoreVersion).toHaveBeenCalledWith('q-1', 1, 'rev-1');
});

test('shows stable collection numbers and can detach a duplicate without deleting it', async () => {
  const user = userEvent.setup();
  (aiWorkbench.manifest as jest.Mock)
    .mockResolvedValueOnce({
      items: [
        {
          number: 4,
          question_id: 'q-old',
          batch_id: 'batch-2',
          status: 'active',
          duplicate_of: 'q-old',
        },
      ],
    })
    .mockResolvedValueOnce({
      items: [
        {
          number: 4,
          question_id: 'q-new',
          batch_id: 'batch-2',
          status: 'active',
          duplicate_of: 'q-old',
          duplicate_detached: true,
        },
      ],
    });
  (aiWorkbench.detachDuplicate as jest.Mock).mockResolvedValue({});
  render(
    <QuestionWorkflowPanel
      questions={[question]}
      onChanged={jest.fn().mockResolvedValue(undefined)}
    />,
  );
  await user.click(screen.getByRole('button', { name: /录题与修订/ }));
  await user.click(await screen.findByRole('button', { name: '查看编号' }));
  expect(await screen.findByText('batch-2')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '拆分重复' }));
  await waitFor(() => expect(aiWorkbench.detachDuplicate).toHaveBeenCalledWith('c-1', 4));
  expect(await screen.findByText('q-new')).toBeInTheDocument();
});

test('loads every question page before opening a large collection item', async () => {
  const user = userEvent.setup();
  const lastQuestion = { ...question, id: 'q-101', data: { ...question.data, zh: '第 101 题' } };
  (aiWorkbench.manifest as jest.Mock).mockResolvedValue({
    items: [{ number: 101, question_id: 'q-101', batch_id: 'large', status: 'active' }],
  });
  (aiWorkbench.collectionQuestions as jest.Mock)
    .mockResolvedValueOnce({ rows: [], totalNum: 101, unavailable_numbers: [] })
    .mockResolvedValueOnce({
      rows: [{ number: 101, resource: lastQuestion }],
      totalNum: 101,
      unavailable_numbers: [],
    });
  render(
    <QuestionWorkflowPanel
      questions={[question]}
      onChanged={jest.fn().mockResolvedValue(undefined)}
    />,
  );
  await user.click(screen.getByRole('button', { name: /录题与修订/ }));
  await user.click(await screen.findByRole('button', { name: '查看编号' }));
  await waitFor(() => expect(aiWorkbench.collectionQuestions).toHaveBeenCalledWith('c-1', 2));
  await user.click(await screen.findByRole('button', { name: '打开题目' }));
  expect((await screen.findAllByText('第 101 题')).length).toBeGreaterThan(0);
});

test('offers an explicit retry with a new backend operation after a question task fails', async () => {
  const user = userEvent.setup();
  (aiWorkbench.runQuestionTask as jest.Mock)
    .mockRejectedValueOnce('temporary failure')
    .mockResolvedValueOnce({ ...question, data: { ...question.data, answer: '先进先出' } });
  render(
    <QuestionWorkflowPanel
      questions={[question]}
      onChanged={jest.fn().mockResolvedValue(undefined)}
    />,
  );
  await user.click(screen.getByRole('button', { name: /录题与修订/ }));
  await user.click(screen.getByRole('combobox', { name: '选择题目' }));
  await user.click(await screen.findByText('什么是 FIFO？'));
  await user.click(screen.getByRole('button', { name: /解/ }));
  await user.click(await screen.findByRole('button', { name: /重试上一步/ }));
  expect(await screen.findByText('先进先出')).toBeInTheDocument();
  expect(aiWorkbench.runQuestionTask).toHaveBeenCalledTimes(2);
});

test('owner invites stable OJ identities and assigns collection work', async () => {
  const user = userEvent.setup();
  const collaboration = {
    collection_id: 'c-1',
    role: 'owner',
    members: [{ subject_id: '8', username: 'collaborator', role: 'contributor', status: 'active' }],
    assignments: [],
  };
  (aiWorkbench.collaboration as jest.Mock).mockResolvedValue(collaboration);
  (aiWorkbench.inviteCollaborator as jest.Mock).mockResolvedValue({});
  (aiWorkbench.createAssignment as jest.Mock).mockResolvedValue({});
  render(
    <QuestionWorkflowPanel
      questions={[question]}
      onChanged={jest.fn().mockResolvedValue(undefined)}
    />,
  );
  await user.click(screen.getByRole('button', { name: /录题与修订/ }));
  await user.click(await screen.findByRole('button', { name: /协/ }));
  expect(await screen.findByText('collaborator · 8')).toBeInTheDocument();

  await user.type(screen.getByLabelText('OJ ID'), '9');
  await user.type(screen.getByLabelText('OJ 用户名'), 'second');
  await user.click(screen.getByRole('button', { name: /邀/ }));
  await waitFor(() =>
    expect(aiWorkbench.inviteCollaborator).toHaveBeenCalledWith('c-1', {
      subject_id: '9',
      username: 'second',
      role: 'contributor',
      course_id: undefined,
    }),
  );

  await user.click(screen.getByLabelText('协作者'));
  await user.click(await screen.findByText('collaborator (8)'));
  await user.type(screen.getByLabelText('任务'), '第一章');
  await user.click(screen.getByRole('button', { name: /分/ }));
  await waitFor(() =>
    expect(aiWorkbench.createAssignment).toHaveBeenCalledWith('c-1', {
      assignee_id: '8',
      title: '第一章',
      description: '',
    }),
  );
});

test('pending collaborator can accept an invitation before viewing manifests', async () => {
  const user = userEvent.setup();
  (aiWorkbench.listCollections as jest.Mock).mockResolvedValue({ rows: [], totalNum: 0 });
  (aiWorkbench.listCollaborations as jest.Mock).mockResolvedValue([
    { id: 'shared', title: '共享题集', role: 'pending', version: 1 },
  ]);
  (aiWorkbench.acceptCollaboration as jest.Mock).mockResolvedValue({});
  render(
    <QuestionWorkflowPanel questions={[]} onChanged={jest.fn().mockResolvedValue(undefined)} />,
  );
  await user.click(screen.getByRole('button', { name: /录题与修订/ }));
  await user.click(await screen.findByRole('button', { name: '接受邀请' }));
  expect(aiWorkbench.acceptCollaboration).toHaveBeenCalledWith('shared');
});

test('preserves workflow metadata when a teacher edits question text', async () => {
  const user = userEvent.setup();
  const updated = {
    ...question,
    version: 3,
    data: { ...question.data, zh: 'FIFO 的定义是什么？' },
  };
  (aiWorkbench.update as jest.Mock).mockResolvedValue(updated);
  render(
    <QuestionWorkflowPanel
      questions={[question]}
      onChanged={jest.fn().mockResolvedValue(undefined)}
    />,
  );
  await user.click(screen.getByRole('button', { name: /录题与修订/ }));
  await user.click(screen.getByRole('combobox', { name: '选择题目' }));
  await user.click(await screen.findByText('什么是 FIFO？'));
  await user.click(screen.getByRole('button', { name: /编辑/ }));
  fireEvent.change(screen.getByLabelText('中文题面'), {
    target: { value: 'FIFO 的定义是什么？' },
  });
  await user.click(screen.getByRole('button', { name: /确 定|OK/ }));

  await waitFor(() => expect(aiWorkbench.update).toHaveBeenCalled());
  expect(aiWorkbench.update).toHaveBeenCalledWith(
    question,
    expect.objectContaining({ zh: 'FIFO 的定义是什么？' }),
  );
});
