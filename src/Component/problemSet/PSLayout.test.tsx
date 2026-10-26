import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { matchPath, MemoryRouter, Route } from 'react-router-dom';
import PSLayout from './PSLayout';
import { routerC, router_ProblemSet } from '../../Config/router/routerC';

jest.mock('./PSHeader', () => () => <div>题单导航</div>);
jest.mock('../common/LoginCheck', () => () => null);
jest.mock('../autolab/QRFloat', () => () => null);
jest.mock('../../Config/router/RouteSwitch', () => () => <div>题单内容</div>);
jest.mock('@ant-design/pro-layout', () => ({
  WaterMark: ({ children, content, style }: any) => (
    <div data-testid="watermark" data-content={content} style={style}>
      {children}
    </div>
  ),
}));
const ide = '/v2/problemSet/99/problem/1/3/ide';
function mount(path: string) {
  return render(
    <Provider
      store={createStore(() => ({
        UserReducer: {
          authStatus: 'authenticated',
          userInfo: { nickname: 'Alice', username: 'alice' },
        },
        ContestReducer: {},
      }))}
    >
      <MemoryRouter initialEntries={[path]}>
        <Route path="/v2/problemSet/:problemSetId">
          <PSLayout />
        </Route>
      </MemoryRouter>
    </Provider>,
  );
}

it('routes the problem-set IDE through the same parent layout as normal problems', () => {
  const resolve = (routes: typeof routerC) =>
    routes.find((route) => matchPath(ide, { path: route.path, exact: route.exact }));
  expect(resolve(routerC)?.id).toBe(12);
  expect(resolve(router_ProblemSet)?.id).toBe(54);
});

it('preserves the parent identity watermark while giving the IDE its full available height', () => {
  mount(ide);
  expect(screen.getByTestId('watermark')).toHaveAttribute('data-content', 'Alice alice');
  expect(screen.getByTestId('watermark')).toHaveStyle({ height: '100%' });
  expect(screen.getByTestId('watermark')).toContainElement(screen.getByText('题单内容'));
  expect(screen.getByText('题单导航')).not.toBeVisible();
});

it('keeps the regular problem-set header visible outside the IDE', () => {
  mount('/v2/problemSet/99/overview');
  expect(screen.getByText('题单导航')).toBeVisible();
  expect(screen.getByTestId('watermark')).toHaveAttribute('data-content', 'Alice alice');
});
