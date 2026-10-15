import type { ReactNode } from 'react';
import type { RouteComponentProps, RouteProps } from 'react-router-dom';

export type RouteLocationProps = RouteComponentProps<Record<string, string | undefined>>;
export type RouteComponent = NonNullable<RouteProps['component']>;

export interface IBaseRouter {
  readonly id: number;
  readonly path: string;
  readonly exact?: boolean;
  readonly devOnly?: boolean;
  readonly component?: RouteComponent;
  readonly children?: readonly IBaseRouter[];
}

export interface IRouter extends IBaseRouter {
  readonly title_i18n: string;
  readonly navigationKey?: string;
  readonly icon?: ReactNode;
  readonly children?: readonly IRouter[];
}
