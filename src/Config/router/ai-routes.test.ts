import { routerLayout } from './router';
import { routerC } from './routerC';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Switch, useLocation } from 'react-router-dom';

it('retains old links only as compatibility routes and registers C-domain tools', () => {
  const oldRoutes = routerLayout.filter((route) => route.path.startsWith('/v2/ai-'));
  expect(oldRoutes).toHaveLength(10);
  expect(oldRoutes.every((route) => route.component && route.exact)).toBe(true);
  expect(routerC.map((route) => route.path)).toEqual(
    expect.arrayContaining([
      '/v2/workspace',
      '/v2/courses/knowledge',
      '/v2/practice/interviews',
      '/v2/account/assistant',
    ]),
  );
});

it.each([
  ['/v2/ai-workbench', '/v2/workspace'],
  ['/v2/ai-bank', '/v2/manage/problemSet/problem_group'],
  ['/v2/ai-authoring', '/v2/manage/intelligent'],
  ['/v2/ai-grading', '/v2/manage/problemSet/grading'],
  ['/v2/ai-exams', '/v2/manage/problemSet/exams'],
  ['/v2/ai-course', '/v2/courses/knowledge'],
  ['/v2/ai-plagiarism', '/v2/manage/problemSet/plagiarism'],
  ['/v2/ai-interviews', '/v2/practice/interviews'],
  ['/v2/ai-admin', '/v2/account/assistant'],
  ['/v2/ai-interviews/session', '/v2/practice/interviews/session'],
])('compatibility link %s preserves query and hash', (oldPath, canonicalPath) => {
  const Destination = () => {
    const location = useLocation();
    return React.createElement('div', {}, location.pathname + location.search + location.hash);
  };
  render(
    React.createElement(
      MemoryRouter,
      { initialEntries: [oldPath + '?filter=a%26b#result'] },
      React.createElement(
        Switch,
        {},
        ...routerLayout
          .filter((route) => route.path.startsWith('/v2/ai-'))
          .map((route) =>
            React.createElement(Route, {
              key: route.id,
              path: route.path,
              exact: route.exact,
              component: route.component,
            }),
          ),
        React.createElement(Route, { component: Destination }),
      ),
    ),
  );
  expect(screen.getByText(canonicalPath + '?filter=a%26b#result')).toBeVisible();
});
