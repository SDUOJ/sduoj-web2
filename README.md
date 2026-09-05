# SDUOJ Frontend

The existing SDUOJ React application, incrementally modernized on the
`feature/upgrade-antd-v5` branch. Routes, API payloads and the `/v2` deployment
prefix are retained. See [the architecture review](docs/FRONTEND_REVIEW.md) for
findings, constraints and the migration sequence.

## Development

Use Node 24 LTS and Yarn Classic 1.22.22. With nvm installed:

```sh
nvm install
nvm use
npm install --global yarn@1.22.22
yarn install --frozen-lockfile
yarn start
```

Open `http://localhost:3000/v2/`. A working backend is required for actual
business operations. Development hosts remain in `src/Utils/API/apiAddress.ts`;
match your DNS/hosts and gateway setup to those values. Production defaults
continue to point at the existing SDUOJ domain. Do not use production services
for automated write tests.

`yarn build` produces `build/` with the existing `/v2/` asset prefix. Configure
your reverse proxy to serve the application and return `index.html` for browser
routes. Vditor assets are also served at `/vditor/`. The old CRA `scripts/start.js`
and `scripts/build.js` entry points have been retired in favor of Webpack CLI.
For HTTPS development, terminate TLS at your local reverse proxy and configure
matching HTTP/WebSocket upstream addresses.

## Verification

```sh
yarn typecheck
yarn lint
yarn format:check
yarn test:unit
yarn test:coverage
yarn build
yarn playwright install chromium firefox webkit
yarn test:e2e
```

`yarn quality` runs formatting, type checking, lint and coverage. `yarn verify` adds a production
build and browser regression. Browser tests start their own preview server on
127.0.0.1:4173 and intercept API requests with local fixtures. Unknown API
requests fail the test. They must not reach live services.

Visual comparisons use reviewed macOS Chromium baselines:

```sh
yarn test:visual
yarn test:visual --update-snapshots
```

Inspect every changed image before committing a new baseline. Linux CI runs
functional tests and captures screenshots; a separate macOS job compares the
committed visual baselines. Screenshots, traces and videos are attached on
failure. Initial baselines characterize this migration; they do not prove exact
pixel equivalence to the previously unbuildable baseline.

## Current Limits

- The suite establishes unit, transport, component, browser and visual layers;
  it does not yet cover every business workflow. Whole-source coverage remains
  visible in `coverage/`, with stronger gates for migrated shared modules.
- Two mobile interaction tests are recorded as expected failures for the fixed
  minimum-width layout. They are not successful mobile acceptance tests. A fix
  must turn them into normal passing tests; an unexpected pass fails the suite.
- Redux, request handling and form submission have focused regression tests.
  Real judging, uploads, exams, permissions and camera flows still require a
  disposable backend and seeded test identities.
- React 18.3 is a compatibility step. Legacy sortable tables still require
  replacement and dedicated regression before React 19.

## Contribution Rules

Keep commits scoped to one change: dependency integration, state logic, a feature
migration, tests, or mechanical formatting. Do not combine an issue batch with
an architectural rewrite. Preserve the existing UI until tests establish the
intended behavior. See [contributor guidance](docs/CONTRIBUTING.md).
