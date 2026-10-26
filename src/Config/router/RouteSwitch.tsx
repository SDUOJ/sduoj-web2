import { Route, Switch } from 'react-router-dom';
import NotFound from '../../Pages/Error/NotFound';
import { flattenRoutesWithComponents } from './routeIntegrity';
import type { IBaseRouter } from './types';
import { availableRoutes } from './developmentRoutes';

export default function RouteSwitch({ routes }: { routes: readonly IBaseRouter[] }) {
  return (
    <Switch>
      {flattenRoutesWithComponents(availableRoutes(routes)).map((route) => (
        <Route key={route.id} path={route.path} exact={route.exact} component={route.component} />
      ))}
      <Route component={NotFound} />
    </Switch>
  );
}
