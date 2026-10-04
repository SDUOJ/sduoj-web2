import { routerLayout } from './router';
import { routerC, routerC_M, routerC_Contest_M, router_ProblemSet } from './routerC';
import { routerE } from './routerE';
import { routerM } from './routerM';
import type { IBaseRouter } from './types';

export const routeTrees = {
  layout: routerLayout,
  client: routerC,
  manage: routerM,
  exam: routerE,
  problemSet: router_ProblemSet,
  contest: routerC_Contest_M,
} satisfies Record<string, readonly IBaseRouter[]>;

export const navigationTrees = {
  client: routerC_M,
  manage: routerM,
  contest: routerC_Contest_M,
  problemSet: router_ProblemSet,
};
