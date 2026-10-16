import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux';
import { MemoryRouter } from 'react-router-dom';
import { rootReducers } from '../../Redux/Store/rootReducer';
import cApi from '../../Utils/API/c-api';
import ProblemSetSummary from './ProblemSetSummary';

jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { getPersonalTagSummary: jest.fn() },
}));
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({ t: (key: string) => key }),
}));

it('links all three problem types through their set/group/position context', async () => {
  const problem = (pid: number, name: string) => ({
    pid,
    name,
    hasAnswer: false,
    score: 0,
    point: 5,
    weighted_point: 5,
  });
  jest.mocked(cApi.getPersonalTagSummary).mockResolvedValue({
    Tag: [
      {
        psid: 77,
        name: 'Mixed set',
        global_score: 20,
        groups: [
          {
            gid: 0,
            name: 'Objective',
            type: 1,
            problems: [problem(900, 'Choice first'), problem(901, 'Choice second')],
          },
          { gid: 1, name: 'Subjective', type: 2, problems: [problem(900, 'Written answer')] },
          { gid: 2, name: 'Programming', type: 0, problems: [problem(900, 'Program answer')] },
        ],
      },
    ],
  } as any);
  render(
    <Provider store={createStore(rootReducers)}>
      <MemoryRouter>
        <ProblemSetSummary groupId={3} />
      </MemoryRouter>
    </Provider>,
  );
  fireEvent.click(await screen.findByRole('tab', { name: 'Problem Details' }));
  expect(await screen.findByRole('link', { name: 'Choice first' })).toHaveAttribute(
    'href',
    '/v2/problemSet/77/problem/0/0',
  );
  expect(screen.getByRole('link', { name: 'Choice second' })).toHaveAttribute(
    'href',
    '/v2/problemSet/77/problem/0/1',
  );
  expect(screen.getByRole('link', { name: 'Written answer' })).toHaveAttribute(
    'href',
    '/v2/problemSet/77/problem/1/0',
  );
  expect(screen.getByRole('link', { name: 'Program answer' })).toHaveAttribute(
    'href',
    '/v2/problemSet/77/problem/2/0',
  );
  expect(document.querySelector('a[href*="undefined"]')).not.toBeInTheDocument();
  expect(document.querySelector('a[href="/v2/problem/900"]')).not.toBeInTheDocument();
});
