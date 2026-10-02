import MockAdapter from 'axios-mock-adapter';
import { courseKnowledgeApi, KnowledgeResource } from './course-knowledge';
import { service } from './request';

const adapter = new MockAdapter(service);
const success = (data: unknown) => ({ code: 0, data, timestamp: Date.now() });

afterEach(() => adapter.reset());
afterAll(() => adapter.restore());

const documentResource: KnowledgeResource = {
  id: 'doc-1',
  kind: 'document',
  version: 4,
  state: 'ready',
  course_id: 12,
  data: { title: 'Queue lecture', text: 'FIFO', file_ids: ['old'], indexed_version: 3 },
};

test('attaching files uses a versioned partial resource update', async () => {
  adapter.onPost('/ps/auto-task/ai/resources/doc-1/update').reply(200, success(documentResource));
  await courseKnowledgeApi.updateDocumentFiles(documentResource, ['new']);

  expect(JSON.parse(adapter.history.post[0].data)).toEqual({
    version: 4,
    data: { file_ids: ['new'] },
  });
});

test('course questions send the external-research decision explicitly', async () => {
  const conversation: KnowledgeResource = {
    id: 'chat-1',
    kind: 'conversation',
    version: 2,
    state: 'ready',
    course_id: 12,
    data: { title: '课程问答' },
  };
  adapter.onPost('/ps/auto-task/ai/jobs/create').reply(200, success({ taskId: 'job-1' }));
  adapter
    .onGet('/ps/auto-task/ai/jobs/job-1')
    .reply(200, success({ id: 'job-1', status: 'success' }));
  adapter.onGet('/ps/auto-task/ai/resources/chat-1').reply(200, success(conversation));

  await courseKnowledgeApi.ask(conversation, '查找相关论文', true);

  expect(JSON.parse(adapter.history.post[0].data)).toEqual(
    expect.objectContaining({
      task_type: 'course.ask',
      resource_id: 'chat-1',
      payload: { message: '查找相关论文', external_research: true },
    }),
  );
});

test('source file links retain the cited PDF page', () => {
  expect(courseKnowledgeApi.fileUrl('file 1', 7)).toContain(
    '/ps/auto-task/ai/files/file%201#page=7',
  );
});
