import React from 'react';
import { render, screen } from '@testing-library/react';
import AIWorkspaceNav from './AIWorkspaceNav';
it('does not add a second navigation inside a business page', () => {
  render(<AIWorkspaceNav />);
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});
