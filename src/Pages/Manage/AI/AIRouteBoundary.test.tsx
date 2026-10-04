import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AIRouteBoundary from './AIRouteBoundary';
import { aiPlatform } from '../../../Utils/API/ai-platform';
import i18n from '../../../Config/i18n';
beforeEach(async () => {
  await i18n.changeLanguage('zh');
});
jest.mock('../../../Utils/API/ai-platform', () => ({ aiPlatform: { account: jest.fn() } }));
test('does not mount protected content before authentication finishes', async () => {
  let complete: (value: unknown) => void = () => {};
  (aiPlatform.account as jest.Mock).mockReturnValue(
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  render(
    <MemoryRouter>
      <AIRouteBoundary>
        <p>Protected task</p>
      </AIRouteBoundary>
    </MemoryRouter>,
  );
  expect(screen.queryByText('Protected task')).not.toBeInTheDocument();
  complete({ status: 'active' });
  expect(await screen.findByText('Protected task')).toBeInTheDocument();
});
test('suspended accounts cannot mount task pages', async () => {
  (aiPlatform.account as jest.Mock).mockResolvedValue({
    status: 'suspended',
    reason: 'Pending review',
  });
  render(
    <MemoryRouter>
      <AIRouteBoundary>
        <p>Protected task</p>
      </AIRouteBoundary>
    </MemoryRouter>,
  );
  expect(await screen.findByText('Pending review')).toBeInTheDocument();
  expect(screen.queryByText('Protected task')).not.toBeInTheDocument();
});
