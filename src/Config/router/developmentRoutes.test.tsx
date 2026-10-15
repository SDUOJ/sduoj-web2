import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { developmentFeaturesEnabled } from '../developmentFeatures';
import { availableRoutes } from './developmentRoutes';
import { flattenRouteTree } from './routeIntegrity';
import { routerM } from './routerM';
import { routerC } from './routerC';
import { routerLayout } from './router';
import RouteSwitch from './RouteSwitch';
import DevOnly, { DevBadge } from '../../Component/common/DevOnly';
import MMenu from '../../Component/layout/MMenu';
import { FeatureAction, FeatureKind } from '../../Pages/Manage/AI/BusinessFeature';
import '../i18n';

const releaseEnv = () =>
  jest.replaceProperty(process, 'env', {
    ...process.env,
    NODE_ENV: 'production',
    REACT_APP_DEPLOYMENT_ENV: 'production',
  });
const devPaths = [
  '/v2/manage/intelligent',
  '/v2/manage/settings/assistant',
  '/v2/manage/course/course',
  '/v2/manage/course/classroom',
  '/v2/manage/problemSet/tasks',
  '/v2/manage/problemSet/grading',
  '/v2/manage/problemSet/exams',
  '/v2/manage/problemSet/plagiarism',
  '/v2/workspace',
  '/v2/account/assistant',
  '/v2/courses/knowledge',
  '/v2/practice/interviews',
  '/v2/practice/interviews/:id',
  '/v2/ai-authoring',
  '/v2/ai-admin',
  '/v2/manage/problem/program/authoring',
];

it.each([
  ['development', undefined, true],
  ['test', undefined, true],
  ['production', 'test', true],
  ['production', 'production', false],
  ['production', undefined, false],
  ['production', 'development', false],
  ['production', 'release', false],
  ['production', 'staging', false],
])(
  'limits dev features to explicit development/test builds (%s, %s)',
  (nodeEnv, deployment, expected) => {
    jest.replaceProperty(process, 'env', {
      ...process.env,
      NODE_ENV: nodeEnv,
      REACT_APP_DEPLOYMENT_ENV: deployment,
    });
    expect(developmentFeaturesEnabled()).toBe(expected);
  },
);

it('removes dev routes, descendants and empty menu groups while retaining stable business routes', () => {
  releaseEnv();
  const all = [...routerM, ...routerC, ...routerLayout];
  const paths = flattenRouteTree(availableRoutes(all)).map((route) => route.path);
  for (const path of devPaths) expect(paths).not.toContain(path);
  expect(paths).not.toContain('/v2/manage/course');
  expect(paths).toEqual(
    expect.arrayContaining([
      '/v2/manage/problem/program',
      '/v2/manage/contest',
      '/v2/manage/problemSet/problem_group',
      '/v2/manage/problemSet/problem_set',
      '/v2/manage/submissions',
      '/v2/problem/:ProblemCode/ide',
    ]),
  );
  const development = flattenRouteTree(availableRoutes(all, true)).map((route) => route.path);
  for (const path of devPaths) expect(development).toContain(path);
});

it('inherits a dev parent boundary even when a descendant has no flag', () => {
  const routes = [
    {
      id: 1,
      path: '/dev',
      devOnly: true,
      children: [{ id: 2, path: '/dev/detail', component: () => null }],
    },
  ];
  expect(availableRoutes(routes, false)).toEqual([]);
  expect(availableRoutes(routes, true)[0].children).toHaveLength(1);
  expect(routes[0].children).toHaveLength(1);
});

it.each(devPaths)('renders 404 for a release deep link %s without loading its page', (path) => {
  releaseEnv();
  const loader = jest.fn(() => <div>Unfinished page</div>);
  const raw = flattenRouteTree([...routerM, ...routerC, ...routerLayout]).find(
    (route) => route.path === path,
  )!;
  render(
    <MemoryRouter initialEntries={[path.replace(':id', 'session')]}>
      <RouteSwitch routes={[{ ...raw, component: loader }]} />
    </MemoryRouter>,
  );
  expect(screen.getByText('404')).toBeVisible();
  expect(loader).not.toHaveBeenCalled();
});

it('hides release entry buttons and DEV labels and ignores URL/storage overrides', () => {
  releaseEnv();
  localStorage.setItem('dev', 'true');
  render(
    <MemoryRouter initialEntries={['/v2/manage?dev=true']}>
      <DevOnly>
        <button>Unfinished shortcut</button>
        <DevBadge />
      </DevOnly>
    </MemoryRouter>,
  );
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(screen.queryByText('DEV')).not.toBeInTheDocument();
  localStorage.removeItem('dev');
});

it('shows the DEV label in development', () => {
  jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'development' });
  render(
    <DevOnly>
      <button>Unfinished shortcut</button>
      <DevBadge />
    </DevOnly>,
  );
  expect(screen.getByRole('button')).toBeVisible();
  expect(screen.getByText('DEV')).toBeVisible();
});

it.each<FeatureKind>(['tasks', 'grading', 'exams', 'course', 'plagiarism', 'interviews', 'admin'])(
  'hides embedded %s drawers and their launch buttons in release',
  (feature) => {
    releaseEnv();
    render(<FeatureAction feature={feature}>Unfinished drawer</FeatureAction>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Unfinished drawer')).not.toBeInTheDocument();
  },
);

it('hides unfinished management menu entries in release and keeps ordinary management visible', () => {
  releaseEnv();
  render(
    <MemoryRouter initialEntries={['/v2/manage/problem/program']}>
      <MMenu id={1} roles={['superadmin']} />
    </MemoryRouter>,
  );
  expect(
    screen.queryByRole('link', { name: /aiMenuIntelligent|智能管理|Intelligent/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: /aiMenuAccount|模型与额度|Models/ }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('DEV')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: /题目|Problem/ })).toBeVisible();
});
