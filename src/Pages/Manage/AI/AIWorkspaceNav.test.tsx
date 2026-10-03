import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../Config/i18n';
import AIWorkspaceNav from './AIWorkspaceNav';

afterEach(async () => {
  await i18n.changeLanguage('zh');
});

it('provides one shared navigation for AI business pages', async () => {
  await i18n.changeLanguage('zh');
  render(
    <MemoryRouter>
      <AIWorkspaceNav />
    </MemoryRouter>,
  );
  expect(screen.getByRole('navigation', { name: 'AI 工作区' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '实验验收' })).toHaveAttribute(
    'href',
    '/v2/practice/interviews',
  );
});

it('translates shared navigation labels', async () => {
  await i18n.changeLanguage('en');
  render(
    <MemoryRouter>
      <AIWorkspaceNav />
    </MemoryRouter>,
  );
  expect(screen.getByRole('navigation', { name: 'AI workspace' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Lab acceptance' })).toHaveAttribute(
    'href',
    '/v2/practice/interviews',
  );
});
