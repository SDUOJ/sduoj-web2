import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CourseKnowledgeWorkbench from './CourseKnowledgeWorkbench';
import { courseKnowledgeApi, KnowledgeResource } from '../../../Utils/API/course-knowledge';

jest.mock('../../../Utils/API/course-knowledge', () => ({
  courseKnowledgeApi: {
    listDocuments: jest.fn(),
    listConversations: jest.fn(),
    getResource: jest.fn(),
    createDocument: jest.fn(),
    uploadFile: jest.fn(),
    updateDocumentFiles: jest.fn(),
    indexDocument: jest.fn(),
    createConversation: jest.fn(),
    ask: jest.fn(),
    resolveCitation: jest.fn(),
    fileUrl: jest.fn((id) => `/files/${id}`),
  },
}));

const documentResource: KnowledgeResource = {
  id: 'doc-1',
  kind: 'document',
  version: 2,
  state: 'ready',
  course_id: 12,
  data: { title: 'Queue lecture', file_ids: ['file-1'], indexed_version: 2 },
};

beforeEach(() => {
  (courseKnowledgeApi.listDocuments as jest.Mock).mockResolvedValue({
    rows: [documentResource],
    totalNum: 1,
  });
  (courseKnowledgeApi.listConversations as jest.Mock).mockResolvedValue({ rows: [], totalNum: 0 });
  (courseKnowledgeApi.indexDocument as jest.Mock).mockResolvedValue({ status: 'success' });
});

test('loads a course index and opens the exact cited source from persisted history', async () => {
  const conversation: KnowledgeResource = {
    id: 'chat-1',
    kind: 'conversation',
    version: 2,
    state: 'ready',
    course_id: 12,
    data: {
      title: '课程问答',
      messages: [
        { role: 'user', text: '队列是什么？' },
        {
          role: 'assistant',
          text: '队列遵循先进先出。',
          citations: ['doc-1:v1:file-1:3:1200'],
          citation_details: [
            {
              citation: 'doc-1:v1:file-1:3:1200',
              file_id: 'file-1',
              file_name: 'queue.pdf',
              page: 3,
              offset: 1200,
            },
          ],
        },
      ],
    },
  };
  (courseKnowledgeApi.listConversations as jest.Mock).mockResolvedValue({
    rows: [conversation],
    totalNum: 1,
  });
  (courseKnowledgeApi.getResource as jest.Mock).mockResolvedValue(conversation);
  (courseKnowledgeApi.resolveCitation as jest.Mock).mockResolvedValue({
    citation: 'doc-1:v1:file-1:3:1200',
    resource_version: 1,
    file_id: 'file-1',
    file_name: 'queue.pdf',
    page: 3,
    offset: 1200,
    text: 'A queue follows first-in, first-out order.',
  });

  render(
    <MemoryRouter>
      <CourseKnowledgeWorkbench initialCourseId={12} />
    </MemoryRouter>,
  );

  expect(await screen.findByText('Queue lecture')).toBeInTheDocument();
  expect(await screen.findByText('队列遵循先进先出。')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /queue.pdf/ }));
  expect(await screen.findByText('A queue follows first-in, first-out order.')).toBeInTheDocument();
  expect(courseKnowledgeApi.resolveCitation).toHaveBeenCalledWith('doc-1:v1:file-1:3:1200');
  expect(screen.getByRole('link', { name: /打开源文件/ })).toHaveAttribute('href', '/files/file-1');
});

test('uploads, binds and indexes a document as one visible workflow', async () => {
  const user = userEvent.setup();
  const draft: KnowledgeResource = {
    id: 'doc-new',
    kind: 'document',
    version: 1,
    state: 'draft',
    course_id: 12,
    data: { title: 'Graph notes', file_ids: [] },
  };
  const attached = { ...draft, version: 2, data: { ...draft.data, file_ids: ['file-new'] } };
  (courseKnowledgeApi.createDocument as jest.Mock).mockResolvedValue(draft);
  (courseKnowledgeApi.uploadFile as jest.Mock).mockResolvedValue({
    id: 'file-new',
    sha256: 'abc',
    size: 4,
  });
  (courseKnowledgeApi.updateDocumentFiles as jest.Mock).mockResolvedValue(attached);

  render(
    <MemoryRouter>
      <CourseKnowledgeWorkbench initialCourseId={12} />
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('button', { name: /上传资料/ }));
  fireEvent.change(screen.getByLabelText('资料名称'), { target: { value: 'Graph notes' } });
  const input = document.body.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  const file = new File(['graph'], 'graph.pdf', { type: 'application/pdf' });
  await user.upload(input!, file);
  const submit = screen.getByRole('button', { name: /确 定|OK/ });
  await waitFor(() => expect(submit).toBeEnabled());
  await user.click(submit);

  await waitFor(() =>
    expect(courseKnowledgeApi.createDocument).toHaveBeenCalledWith(12, 'Graph notes'),
  );
  await waitFor(() =>
    expect(courseKnowledgeApi.uploadFile).toHaveBeenCalledWith(
      'doc-new',
      file,
      expect.stringContaining('doc-new-0-graph.pdf'),
    ),
  );
  expect(courseKnowledgeApi.updateDocumentFiles).toHaveBeenCalledWith(draft, ['file-new']);
  expect(courseKnowledgeApi.indexDocument).toHaveBeenCalledWith(attached);
});

test('creates a private course conversation and renders its answer history', async () => {
  const conversation: KnowledgeResource = {
    id: 'chat-new',
    kind: 'conversation',
    version: 1,
    state: 'draft',
    course_id: 12,
    data: { title: '课程问答' },
  };
  const answered: KnowledgeResource = {
    ...conversation,
    version: 2,
    data: {
      ...conversation.data,
      messages: [
        { role: 'user', text: '什么是栈？' },
        { role: 'assistant', text: '栈遵循后进先出。', citations: [] },
      ],
    },
  };
  (courseKnowledgeApi.createConversation as jest.Mock).mockResolvedValue(conversation);
  (courseKnowledgeApi.ask as jest.Mock).mockResolvedValue(answered);

  render(
    <MemoryRouter>
      <CourseKnowledgeWorkbench initialCourseId={12} />
    </MemoryRouter>,
  );
  const input = await screen.findByLabelText('课程资料问题');
  fireEvent.change(input, { target: { value: '什么是栈？' } });
  fireEvent.click(screen.getByRole('button', { name: '发送问题' }));
  await waitFor(() => expect(courseKnowledgeApi.createConversation).toHaveBeenCalledWith(12));
  expect(courseKnowledgeApi.ask).toHaveBeenCalledWith(conversation, '什么是栈？', false);
  expect(await screen.findByText('栈遵循后进先出。')).toBeInTheDocument();
});

test('only enables external research when the teacher turns it on', async () => {
  const conversation: KnowledgeResource = {
    id: 'chat-external',
    kind: 'conversation',
    version: 1,
    state: 'draft',
    course_id: 12,
    data: { title: '课程问答' },
  };
  (courseKnowledgeApi.createConversation as jest.Mock).mockResolvedValue(conversation);
  (courseKnowledgeApi.ask as jest.Mock).mockResolvedValue({
    ...conversation,
    version: 2,
    data: { messages: [{ role: 'assistant', text: '已检索。', citations: ['doi:10.1/test'] }] },
  });

  render(
    <MemoryRouter>
      <CourseKnowledgeWorkbench initialCourseId={12} />
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('switch', { name: '允许课外检索' }));
  fireEvent.change(screen.getByLabelText('课程资料问题'), {
    target: { value: '查找课外论文' },
  });
  fireEvent.click(screen.getByRole('button', { name: '发送问题' }));

  await waitFor(() =>
    expect(courseKnowledgeApi.ask).toHaveBeenCalledWith(conversation, '查找课外论文', true),
  );
});

test('keeps a failed question available for an explicit retry', async () => {
  const conversation: KnowledgeResource = {
    id: 'chat-retry',
    kind: 'conversation',
    version: 1,
    state: 'draft',
    course_id: 12,
    data: { title: '课程问答' },
  };
  (courseKnowledgeApi.createConversation as jest.Mock).mockResolvedValue(conversation);
  (courseKnowledgeApi.ask as jest.Mock).mockRejectedValue('任务冲突，请刷新');

  render(
    <MemoryRouter>
      <CourseKnowledgeWorkbench initialCourseId={12} />
    </MemoryRouter>,
  );
  const input = await screen.findByLabelText('课程资料问题');
  fireEvent.change(input, { target: { value: '不要丢失这个问题' } });
  fireEvent.click(screen.getByRole('button', { name: '发送问题' }));

  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('任务冲突，请刷新'));
  expect(screen.getByRole('alert')).toHaveClass('ant-alert-warning');
  expect(input).toHaveValue('不要丢失这个问题');
});
