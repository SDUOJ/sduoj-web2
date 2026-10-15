import { render, screen, fireEvent } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import IdeProblemInfo, { IdeDescriptionTabs } from './IdeProblemInfo';
import i18n from '../../Config/i18n';

const info = {
  timeLimit: 1000,
  memoryLimit: 262144,
  source: '测试题',
  judgeTemplates: [{ id: '6', title: 'C++14', type: 0, comment: '', acceptFileExtensions: [] }],
  problemDescriptionDTO: { id: '2' },
  problemDescriptionListDTOList: [
    { id: '1', title: '中文题面' },
    { id: '2', title: 'English statement' },
  ] as any,
};

beforeEach(async () => {
  await i18n.changeLanguage('zh');
});

it('renders metadata tags and description tabs, preserving other URL parameters when switching', () => {
  const history = createMemoryHistory({
    initialEntries: ['/v2/problem/P/ide?descriptionId=2&keep=yes#anchor'],
  });
  render(
    <Router history={history}>
      <IdeDescriptionTabs problemInfo={info} />
      <IdeProblemInfo problemInfo={info} />
    </Router>,
  );
  expect(screen.getByLabelText('题目信息').querySelectorAll('.ant-tag')).toHaveLength(4);
  expect(screen.getByText(/1000 ms/)).toBeVisible();
  expect(screen.getByText(/256 MB/)).toBeVisible();
  expect(screen.getByRole('tab', { name: 'English statement' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  fireEvent.click(screen.getByRole('tab', { name: '中文题面' }));
  expect(history.location.pathname).toBe('/v2/problem/P/ide');
  expect(new URLSearchParams(history.location.search).get('descriptionId')).toBe('1');
  expect(new URLSearchParams(history.location.search).get('keep')).toBe('yes');
  expect(history.location.hash).toBe('#anchor');
});

it('omits description switching for a single available statement', () => {
  render(
    <Router history={createMemoryHistory()}>
      <IdeDescriptionTabs
        problemInfo={{
          ...info,
          problemDescriptionListDTOList: info.problemDescriptionListDTOList.slice(0, 1),
        }}
      />
    </Router>,
  );
  expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
});

it('collapses long language lists and lets the user expand and collapse them', () => {
  const templates = Array.from({ length: 8 }, (_, index) => ({
    id: String(index),
    title: `Language ${index + 1}`,
    type: 0,
    comment: '',
    acceptFileExtensions: [],
  }));
  render(<IdeProblemInfo problemInfo={{ ...info, judgeTemplates: templates }} />);
  const languages = screen.getByLabelText('支持语言');
  expect(languages.querySelectorAll('.ant-tag')).toHaveLength(3);
  expect(screen.queryByText('Language 8')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '展开其余 5 种' }));
  expect(screen.getByRole('button', { name: '收起' })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('Language 8')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '收起' }));
  expect(languages.querySelectorAll('.ant-tag')).toHaveLength(3);
});
