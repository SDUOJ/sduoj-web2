import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlagiarismWorkbench from './PlagiarismWorkbench';
import { plagiarismApi, PlagiarismResource } from '../../../Utils/API/ai-plagiarism';
import i18n from '../../../Config/i18n';

jest.mock('../../../Utils/API/ai-plagiarism', () => ({
  plagiarismApi: {
    list: jest.fn(),
    get: jest.fn(),
    createNative: jest.fn(),
    getJob: jest.fn(),
    reviewPair: jest.fn(),
    writeback: jest.fn(),
    downloadReport: jest.fn(),
  },
}));

const resource = (reviewed = false): PlagiarismResource => ({
  id: 'plag-1',
  kind: 'plagiarism',
  version: reviewed ? 2 : 1,
  state: 'review',
  psid: 9,
  data: {
    title: '期末程序题查重',
    native_snapshot: {
      id: 'snapshot-1',
      count: 2,
      psid: 9,
      group_id: 9,
      pid: 99,
      selection_policy: 'latest',
      sha256: 'hash',
    },
    candidate: {
      comparison_count: 1,
      candidate_count: 1,
      ai_reviewed_count: 1,
      report: 'report.jplag',
      pairs: [
        {
          left: '101',
          right: '102',
          left_username: 'alice',
          right_username: 'bob',
          similarity: 0.91,
          matches: [],
          review: { answer: '循环结构相似', citations: [] },
          review_status: 'ready',
          decisions: reviewed
            ? [
                {
                  decision: 'SUSPICIOUS',
                  reason: '教师复核',
                  actor_id: '7',
                  created_at: '2026-09-05T10:00:00Z',
                },
              ]
            : [],
        },
      ],
    },
  },
});

let current: PlagiarismResource;

beforeEach(async () => {
  await i18n.changeLanguage('zh');
  jest.clearAllMocks();
  current = resource(false);
  (plagiarismApi.list as jest.Mock).mockImplementation(async () => ({
    rows: [current],
    totalNum: 1,
  }));
  (plagiarismApi.get as jest.Mock).mockImplementation(async () => current);
  (plagiarismApi.reviewPair as jest.Mock).mockImplementation(async () => {
    current = resource(true);
    return { version: 2, decision: 'SUSPICIOUS' };
  });
  (plagiarismApi.writeback as jest.Mock).mockResolvedValue({
    version: 3,
    updated: 2,
    replay: false,
  });
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/v2/ai-plagiarism']}>
      <PlagiarismWorkbench />
    </MemoryRouter>,
  );
}

test('shows every candidate and saves a versioned teacher decision', async () => {
  renderPage();
  expect(await screen.findByText('alice')).toBeInTheDocument();
  expect(screen.getByText('bob')).toBeInTheDocument();
  expect(screen.getByText('91%')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '写入 OJ' })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: '复核 101 102' }));
  fireEvent.change(await screen.findByLabelText('复核依据'), {
    target: { value: '教师核对匹配区间' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));

  await waitFor(() =>
    expect(plagiarismApi.reviewPair).toHaveBeenCalledWith(
      'plag-1',
      1,
      expect.objectContaining({ left: '101', right: '102' }),
      'SUSPICIOUS',
      '教师核对匹配区间',
    ),
  );
  expect(await screen.findByText('存疑')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '写入 OJ' })).toBeEnabled();
});

test('requires an explicit reason before writing reviewed evidence to OJ', async () => {
  current = resource(true);
  renderPage();
  const write = await screen.findByRole('button', { name: '写入 OJ' });
  expect(write).toBeEnabled();
  fireEvent.click(write);
  fireEvent.change(await screen.findByLabelText('写入依据'), {
    target: { value: '全部候选均已人工复核' },
  });
  fireEvent.click(screen.getByRole('button', { name: '确认写入' }));
  await waitFor(() =>
    expect(plagiarismApi.writeback).toHaveBeenCalledWith(
      'plag-1',
      2,
      '全部候选均已人工复核',
      false,
    ),
  );
  expect(await screen.findByText('已写入 2 份 OJ 答题记录')).toBeInTheDocument();
});
