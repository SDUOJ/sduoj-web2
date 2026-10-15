import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../Config/i18n';
import ContextProblemMenu from './ContextProblemMenu';

it('keeps question links and the selected question when folding the vertical menu', async () => {
  await i18n.changeLanguage('zh');
  render(
    <MemoryRouter>
      <ContextProblemMenu
        loading={false}
        title="Contest"
        activeKey="2"
        groups={[
          {
            key: 'contest',
            items: [
              { key: '1', number: 'A', title: 'First', href: '/contest/1/problem/1/ide' },
              { key: '2', number: 'B', title: 'Second', href: '/contest/1/problem/2/ide' },
            ],
          },
        ]}
      />
    </MemoryRouter>,
  );
  const selected = screen.getByRole('link', { name: 'B. Second' });
  expect(selected).toHaveAttribute('aria-current', 'page');
  const toggle = screen.getByRole('button', { name: /题目菜单/ });
  const expanded = toggle.getAttribute('aria-expanded');
  fireEvent.click(toggle);
  expect(toggle.getAttribute('aria-expanded')).not.toBe(expanded);
  expect(selected).toHaveAttribute('href', '/contest/1/problem/2/ide');
  expect(selected).toHaveAttribute('aria-current', 'page');
  expect(screen.getAllByRole('link')).toHaveLength(2);
});
