import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route } from 'react-router-dom';
import { createAppStore } from '../../../Redux/Store';
import InterviewSession from './InterviewSession';
import { interviewApi, InterviewResource } from './interview-api';
import i18n from '../../../Config/i18n';

jest.mock('./interview-api', () => ({
  interviewApi: {
    session: jest.fn(),
    answer: jest.fn(),
    preflight: jest.fn(),
    retryJob: jest.fn(),
    review: jest.fn(),
    adopt: jest.fn(),
    cancel: jest.fn(),
  },
}));

jest.mock('./AIWorkspaceNav', () => () => <nav>AI nav</nav>);

const studentSession: InterviewResource = {
  id: 'i1',
  kind: 'interview',
  version: 3,
  state: 'ready',
  role: 'student',
  effective_status: 'awaiting_answer',
  data: {
    title: 'Acceptance',
    student_id: '42',
    student_username: 'student',
    question: 'Explain',
    code: '',
    language: 'python',
    report: '',
    rubric: [{ name: 'correctness', max_score: 10 }],
    max_questions: 3,
    duration_minutes: 20,
    status: 'awaiting_answer',
    expires_at: '2026-09-08T10:00:00',
    turns: [{ question: 'Why is it O(n)?', answer: null }],
    media_policy: { required_tracks: ['video'], max_segment_seconds: 60 },
  },
  media_manifest: {
    complete: false,
    groups: [
      {
        turn_sequence: 0,
        track: 'video',
        required: true,
        expected_segments: 2,
        present_segments: [0],
        missing_segments: [1],
        complete: false,
        segments: [
          {
            file_id: 'f1',
            turn_sequence: 0,
            track: 'video',
            segment_index: 0,
            segment_count: 2,
            started_ms: 0,
            duration_ms: 10000,
            sha256: 'a'.repeat(64),
            url: '/f1',
          },
        ],
      },
    ],
  },
};

function renderSession() {
  const store = createAppStore();
  store.dispatch({
    type: 'setUserInfo',
    data: {
      userId: 'student-42',
      username: 'student',
      nickname: 'Student',
      studentId: '42',
      roles: ['user'],
    },
  });
  store.dispatch({ type: 'userLogin' });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/v2/ai-interviews/i1']}>
        <Route path="/v2/ai-interviews/:id">
          <InterviewSession />
        </Route>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('zh');
  jest.clearAllMocks();
});

test('shows missing media and blocks answer submission', async () => {
  (interviewApi.session as jest.Mock).mockResolvedValue(studentSession);
  renderSession();
  expect((await screen.findAllByText('Why is it O(n)?')).length).toBeGreaterThan(0);
  expect(screen.getAllByText('缺片 1').length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: '提交本题' })).toBeDisabled();
});

test('shows teacher candidate criteria and native adoption state', async () => {
  (interviewApi.session as jest.Mock).mockResolvedValue({
    ...studentSession,
    role: 'teacher',
    state: 'review',
    effective_status: 'completed',
    data: {
      ...studentSession.data,
      status: 'completed',
      native_source: { asd_id: 9, psid: 1, gid: 2, pid: 3, username: 'student' },
      candidate: {
        summary: 'Evidence checked',
        score: 80,
        confidence: 0.9,
        integrity_conclusion: 'review',
        criteria: [{ name: 'correctness', max_score: 10, score: 8, evidence: 'turn 1' }],
      },
    },
  });
  renderSession();
  await waitFor(() => expect(screen.getByText(/AI 候选 80.0/)).toBeInTheDocument());
  expect(screen.getByText('已绑定答题卡')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /批准候选/ })).toBeEnabled();
});

test('renders interview status and media labels in English', async () => {
  await i18n.changeLanguage('en');
  (interviewApi.session as jest.Mock).mockResolvedValue(studentSession);
  renderSession();
  expect(await screen.findByText('Awaiting answer')).toBeInTheDocument();
  expect(screen.getAllByText('Webcam').length).toBeGreaterThan(0);
});
