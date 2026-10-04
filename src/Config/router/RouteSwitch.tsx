import { Route, Switch } from 'react-router-dom';
import NotFound from '../../Pages/Error/NotFound';
import { flattenRoutesWithComponents } from './routeIntegrity';
import type { IBaseRouter } from './types';

export default function RouteSwitch({ routes }: { routes: readonly IBaseRouter[] }) {
  return (
    <Switch>
      {flattenRoutesWithComponents(routes).map((route) => (
        <Route key={route.id} path={route.path} exact={route.exact} component={route.component} />
      ))}
      <Route component={NotFound} />
    </Switch>
  );
}
