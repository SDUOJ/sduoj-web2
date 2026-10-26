import { routerLayout } from './router';
import { routerC, routerC_M, routerC_Contest_M, router_ProblemSet } from './routerC';
import { routerE } from './routerE';
import { routerM } from './routerM';
import type { IBaseRouter } from './types';
import { availableRoutes } from './developmentRoutes';

export const routeTrees = {
  layout: availableRoutes(routerLayout),
  client: availableRoutes(routerC),
  manage: availableRoutes(routerM),
  exam: availableRoutes(routerE),
  problemSet: availableRoutes(router_ProblemSet),
  contest: availableRoutes(routerC_Contest_M),
} satisfies Record<string, readonly IBaseRouter[]>;

export const navigationTrees = {
  client: availableRoutes(routerC_M),
  manage: routeTrees.manage,
  contest: routeTrees.contest,
  problemSet: routeTrees.problemSet,
};
