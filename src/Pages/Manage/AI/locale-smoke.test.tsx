import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../Config/i18n';
import request from '../../../Utils/API/request';
import { aiPlatform } from '../../../Utils/API/ai-platform';
import { aiWorkbench } from '../../../Utils/API/ai-workbench';
import { plagiarismApi } from '../../../Utils/API/ai-plagiarism';
import AIOperations from './AIOperations';
import AIRouteBoundary from './AIRouteBoundary';
import ExaminationWorkbench from './ExaminationWorkbench';
import NativeGroupQuestions from './NativeGroupQuestions';
import NativeQuestionWorkbench from './NativeQuestionWorkbench';
import PlagiarismWorkbench from './PlagiarismWorkbench';
import QuestionWorkflowPanel from './QuestionWorkflowPanel';

jest.setTimeout(60000);

jest.mock('../../../Utils/API/request', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  service: { defaults: { baseURL: '/api' } },
}));
jest.mock('../../../Utils/API/ai-platform', () => ({
  aiPlatform: { account: jest.fn(), jobs: jest.fn(), list: jest.fn(), get: jest.fn() },
}));
jest.mock('../../../Utils/API/ai-workbench', () => ({
  aiWorkbench: { listCollections: jest.fn(), listCollaborations: jest.fn(), history: jest.fn() },
}));
jest.mock('../../../Utils/API/ai-plagiarism', () => ({
  plagiarismApi: { list: jest.fn() },
}));
jest.mock('./AITaskMonitor', () => () => null);

beforeEach(async () => {
  await i18n.changeLanguage('en');
  jest.clearAllMocks();
  jest.mocked(request.get).mockResolvedValue({ rows: [] });
  jest.mocked(aiPlatform.jobs).mockResolvedValue({ rows: [], totalNum: 0 });
  jest.mocked(aiPlatform.list).mockResolvedValue({ rows: [], totalNum: 0 });
  jest.mocked(plagiarismApi.list).mockResolvedValue({ rows: [], totalNum: 0 });
  jest.mocked(aiWorkbench.listCollections).mockResolvedValue({ rows: [], totalNum: 0 });
  jest.mocked(aiWorkbench.listCollaborations).mockResolvedValue([]);
});

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage('zh');
  });
});

function expectEnglishMarkup() {
  expect(document.body.textContent).not.toMatch(/[\u3400-\u9fff]/);
  const labels = Array.from(document.querySelectorAll('[aria-label], [placeholder]')).flatMap(
    (element) => [element.getAttribute('aria-label'), element.getAttribute('placeholder')],
  );
  expect(labels.join(' ')).not.toMatch(/[\u3400-\u9fff]/);
  expect(document.body.textContent).not.toMatch(
    /ai(?:Native|Workflow|Plagiarism|Exam|Operations|Boundary)[A-Z]\w+/,
  );
}

it('translates manual question intake, file recognition, and validation errors', async () => {
  render(<NativeQuestionWorkbench />);
  expect(screen.getByRole('tab', { name: 'Manual entry' })).toBeVisible();
  expect(screen.getByLabelText('Question content')).toBeVisible();
  expectEnglishMarkup();
  fireEvent.click(screen.getByRole('tab', { name: 'Text / file recognition' }));
  fireEvent.click(screen.getByRole('button', { name: 'Recognize and save to question groups' }));
  expect(await screen.findByText('Error: Enter source text or select a file')).toBeVisible();
  expectEnglishMarkup();
});

it('translates the plagiarism list and scan dialog', async () => {
  render(
    <MemoryRouter>
      <PlagiarismWorkbench />
    </MemoryRouter>,
  );
  expect(await screen.findByText('No plagiarism records')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /New/ }));
  await waitFor(() => expect(screen.getByLabelText('Similarity threshold')).toBeVisible());
  expect(screen.getByLabelText('Problem set ID')).toBeVisible();
  expectEnglishMarkup();
});

it('translates the question workflow, intake form, and selected-question fallback states', async () => {
  render(
    <QuestionWorkflowPanel
      questions={[
        { id: 'q-1', kind: 'question', version: 1, state: 'ready', data: { original: 'FIFO?' } },
      ]}
      onChanged={jest.fn().mockResolvedValue(undefined)}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Question intake and revisions/ }));
  expect(await screen.findByText('No collections')).toBeVisible();
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Select question' }));
  fireEvent.click(await screen.findByText('FIFO?'));
  expect(screen.getAllByText('Not generated')).toHaveLength(2);
  expect(screen.getByText('Not verified')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /Automatic intake/ }));
  await waitFor(() => expect(screen.getByLabelText('Question text')).toBeVisible());
  expect(screen.getByRole('button', { name: /Capture question photo/ })).toBeVisible();
  expectEnglishMarkup();
});

it('translates native group search and question actions', async () => {
  jest.mocked(request.get).mockResolvedValue({
    rows: [{ pid: 3, score: 10, question: { zh: 'FIFO?', answer: '', options: [] } }],
  });
  render(<NativeGroupQuestions gid={2} name="Queue questions" />);
  fireEvent.click(screen.getByRole('button', { name: 'Questions and answers' }));
  fireEvent.click(await screen.findByRole('button', { name: 'FIFO?' }));
  expect(screen.getByPlaceholderText('Search this group')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Generate answer' })).toBeVisible();
  expect(screen.getByText(/Not provided/)).toBeVisible();
  expectEnglishMarkup();
});

it('translates the task history', async () => {
  jest.mocked(aiPlatform.jobs).mockResolvedValue({
    rows: [{ id: 'job-1', task_type: 'question.solve', status: 'success', attempt: 1 }],
    totalNum: 1,
  });
  render(
    <MemoryRouter>
      <AIOperations />
    </MemoryRouter>,
  );
  expect(await screen.findByText('job-1')).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Tasks and authoring' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'View' })).toBeVisible();
  expectEnglishMarkup();
});

it('translates suspended-account fallback and return links', async () => {
  jest.mocked(aiPlatform.account).mockResolvedValue({ status: 'suspended' } as never);
  render(
    <MemoryRouter>
      <AIRouteBoundary>Protected task</AIRouteBoundary>
    </MemoryRouter>,
  );
  expect(await screen.findByText('AI access is suspended')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Return to OJ' })).toBeVisible();
  expect(screen.queryByText('Protected task')).not.toBeInTheDocument();
  expectEnglishMarkup();
});

it('translates exam creation fields and selected-exam publishing controls', async () => {
  const resource = {
    id: 'exam-1',
    kind: 'exam' as const,
    version: 2,
    state: 'review',
    data: { title: 'Queue exam', mode: 'TEST', candidate: { rooms: [], unassigned: [] } },
  };
  jest.mocked(aiPlatform.list).mockResolvedValue({ rows: [resource], totalNum: 1 });
  jest.mocked(aiPlatform.get).mockResolvedValue(resource);
  render(
    <MemoryRouter>
      <ExaminationWorkbench />
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'View' }));
  expect(await screen.findByLabelText('Operation reason')).toBeVisible();
  expect(screen.getByRole('button', { name: /Prepare publication content/ })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /New exam/ }));
  await waitFor(() => expect(screen.getByLabelText('Exam name')).toBeVisible(), {
    timeout: 10000,
  });
  expect(screen.getByPlaceholderText('Student ID,Name,OJ username')).toBeVisible();
  expectEnglishMarkup();
}, 15000);
