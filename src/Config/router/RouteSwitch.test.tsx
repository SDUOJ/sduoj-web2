import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useParams } from 'react-router-dom';
import RouteSwitch from './RouteSwitch';
import type { IBaseRouter } from './types';
import '../i18n';

const Marker = () => <div>Selected route</div>;
const Detail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  return <div>{`Detail ${id}${location.search}${location.hash}`}</div>;
};

const routes: readonly IBaseRouter[] = [
  {
    id: 1,
    path: '/domain',
    component: Marker,
    children: [{ id: 2, path: '/domain/:id', exact: true, component: Detail }],
  },
];

it('renders a single matching child and preserves params, query and hash', () => {
  render(
    <MemoryRouter initialEntries={['/domain/42?filter=a%26b#result']}>
      <RouteSwitch routes={routes} />
    </MemoryRouter>,
  );
  expect(screen.getByText('Detail 42?filter=a%26b#result')).toBeVisible();
  expect(screen.queryByText('Selected route')).not.toBeInTheDocument();
});

it('renders a parent only at its exact boundary', () => {
  render(
    <MemoryRouter initialEntries={['/domain']}>
      <RouteSwitch routes={routes} />
    </MemoryRouter>,
  );
  expect(screen.getByText('Selected route')).toBeVisible();
});

it('renders a localized 404 for an unknown nested path', () => {
  render(
    <MemoryRouter initialEntries={['/domain/42/unknown']}>
      <RouteSwitch routes={routes} />
    </MemoryRouter>,
  );
  expect(screen.getByText('404')).toBeVisible();
  expect(screen.queryByText('Selected route')).not.toBeInTheDocument();
});
