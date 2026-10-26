import { fireEvent, render, screen } from '@testing-library/react';
import i18n from '../../Config/i18n';
import CaseDiffView, { outputDiff } from './CaseDiffView';
beforeEach(async () => {
  await i18n.changeLanguage('zh');
});
it('aligns inserted lines instead of shifting all subsequent lines', () => {
  expect(outputDiff('a\nb', 'a\nx\nb')).toEqual([
    { kind: 'same', text: 'a' },
    { kind: 'actual', text: 'x' },
    { kind: 'same', text: 'b' },
  ]);
  expect(outputDiff('', '\n')).toContainEqual({ kind: 'actual', text: '' });
});
it('exposes whitespace and truncation while rendering program output as text', () => {
  render(<CaseDiffView expected={'x \r\n'} actual={'<script>\t\n'} truncated />);
  fireEvent.click(screen.getByRole('button', { name: /输出差异/ }));
  expect(screen.getByLabelText('输出差异')).toHaveTextContent('x·␍');
  expect(screen.getByLabelText('输出差异')).toHaveTextContent('<script>⇥');
  expect(document.querySelector('script')).toBeNull();
  expect(screen.getByText(/实际输出已截断/)).toBeVisible();
});
it('bounds the diff work and reports omitted lines', () => {
  const long = 'x\n'.repeat(5000);
  expect(outputDiff(long, 'y\n'.repeat(5000))).toHaveLength(400);
  render(<CaseDiffView expected={long} actual="" />);
  fireEvent.click(screen.getByRole('button', { name: /输出差异/ }));
  expect(screen.getByText(/仅展示前 200 行/)).toBeVisible();
});
