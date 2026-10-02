import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AIWorkspaceNav from './AIWorkspaceNav';
it('provides one shared navigation for AI business pages', () => {
  render(<MemoryRouter><AIWorkspaceNav /></MemoryRouter>);
  expect(screen.getByRole('navigation', {name: 'AI 工作区'})).toBeInTheDocument();
  expect(screen.getByRole('link', {name: '实验验收'})).toHaveAttribute('href', '/v2/practice/interviews');
});
