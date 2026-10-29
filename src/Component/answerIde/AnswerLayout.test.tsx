import { fireEvent, render, screen } from '@testing-library/react';
import { Grid } from 'antd';
import i18n from '../../Config/i18n';
import AnswerLayout from './AnswerLayout';
beforeEach(async () => {
  await i18n.changeLanguage('zh');
});
afterEach(() => jest.restoreAllMocks());
const props = {
  identity: 'alice:P',
  statement: <p>Statement content</p>,
  workspace: <textarea aria-label="code" defaultValue="draft" />,
};
it('switches narrow-screen tabs without losing editor state and restores the selected tab', () => {
  jest.spyOn(Grid, 'useBreakpoint').mockReturnValue({ lg: false });
  const page = render(<AnswerLayout {...props} />);
  expect(screen.getByText('Statement content')).toBeVisible();
  expect(screen.getByLabelText('code')).not.toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '代码与运行' }));
  fireEvent.change(screen.getByLabelText('code'), { target: { value: 'edited' } });
  fireEvent.click(screen.getByRole('button', { name: '题目' }));
  fireEvent.click(screen.getByRole('button', { name: '代码与运行' }));
  expect(screen.getByLabelText('code')).toHaveValue('edited');
  page.unmount();
  render(<AnswerLayout {...props} />);
  expect(screen.getByLabelText('code')).toBeVisible();
});
it('restores a valid desktop width and isolates preferences by user/problem', () => {
  jest.spyOn(Grid, 'useBreakpoint').mockReturnValue({ lg: true });
  localStorage.setItem('answerIde:layout:alice:P', JSON.stringify({ width: 16 }));
  const page = render(<AnswerLayout {...props} />);
  expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '67');
  fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowLeft' });
  expect(JSON.parse(localStorage.getItem('answerIde:layout:alice:P')!).ratio).toBeCloseTo(64.6667);
  page.unmount();
  render(<AnswerLayout {...props} identity="bob:P" />);
  expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '50');
});

it('keeps the editor mounted across desktop/mobile breakpoint changes', () => {
  const breakpoint = jest.spyOn(Grid, 'useBreakpoint').mockReturnValue({ lg: true });
  const page = render(<AnswerLayout {...props} />);
  const editor = screen.getByLabelText('code');
  fireEvent.change(editor, { target: { value: 'unsaved edit' } });
  breakpoint.mockReturnValue({ lg: false });
  page.rerender(<AnswerLayout {...props} />);
  fireEvent.click(screen.getByRole('button', { name: '代码与运行' }));
  expect(screen.getByLabelText('code')).toBe(editor);
  expect(editor).toHaveValue('unsaved edit');
  breakpoint.mockReturnValue({ lg: true });
  page.rerender(<AnswerLayout {...props} />);
  expect(screen.getByLabelText('code')).toBe(editor);
});
