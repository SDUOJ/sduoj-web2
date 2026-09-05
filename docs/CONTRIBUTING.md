# Frontend Contribution Guide

## Change Boundaries

Use one commit per independently reviewable topic. Add a behavior test before
changing shared logic. Keep dependency lockfile changes with their manifest.
Keep mechanical formatting separate from behavior changes. Do not rename whole
directory trees while migrating a feature.

Prefer function components with explicit props and hooks from `Redux/Store/hooks`.
Keep route parsing in pages, transport in `Utils/API`, and presentation in domain
components. Import ProForm and ProTable through `@ant-design/pro-components`.
New API calls should specify their actual result DTO via `request.get<Result>`
or `request.post<Result>`; the response envelope is unwrapped by the transport.
Existing untyped endpoints remain a documented migration backlog.

Reducers must not mutate old objects or action payloads. Unknown actions must
return the old reference. Reuse unchanged children when updating nested state.
Keep request failure distinct from successful submission. Copy drafts before
modifying data obtained from Redux or a shared cache.

Do not define stateful component types inside render, including sortable rows.
Keep dialog state outside responsive table cells. Every subscription, timer,
editor or camera instance needs a matching cleanup. Test stale requests and
rapid navigation before enabling StrictMode for a migrated feature.

## Formatting And Static Analysis

Prettier defines two spaces, single quotes, semicolons and a 100-column print
width. `.editorconfig` supplies editor defaults. Format the files being changed:

```sh
yarn prettier --write src/path/to/ChangedComponent.tsx
yarn format:check
yarn lint
```

`format:check` permits only byte-identical legacy formatting recorded in
`config/format-baseline.json`. A new file or a changed legacy file must conform.
This avoids a repository-wide whitespace rewrite. A deliberately reviewed
formatting batch can remove its now-formatted entries from the baseline.

`lint` fails on all errors and on increased warning counts for each file/rule.
`yarn lint:report` prints the individual legacy warnings. Counts are recorded in
`config/lint-baseline.json`; reductions are allowed. The count mechanism cannot
detect exchanging an old warning for a new one in the same file, so code review
still matters. Do not expand either baseline to bypass a failing change.

## Test Layers

- Pure/state tests: frozen snapshots, boundaries, transformations and cache keys.
- Transport tests: real Axios configuration with a mock adapter; HTTP, business
  errors, cookies, redirects and downloads.
- Component tests: Testing Library and user-event; observable behavior, validation,
  retry and modal lifecycle. Avoid snapshots of generated Ant Design markup.
- Browser tests: Playwright against the production build. API fixtures are explicit
  and unexpected endpoint calls fail. Never use real student data or credentials.
- Visual tests: compare reviewed images on the baseline platform. Generate assets
  only during explicit baseline updates, not automatically in CI.

Add coverage thresholds when a module is migrated. Do not hide untested source
from the whole-project coverage report. Each closed issue needs its own scenario
test, including the failure condition that originally triggered it.

## Release Checks

Run `yarn format:check`, `yarn verify`, and platform-appropriate visual checks.
Read the report, including expected failures and coverage gaps. Production
deployment is gated by functional CI, but configuring branch protection and
mandatory visual checks requires repository administrator settings.

A mocked frontend suite cannot validate real service contracts. Before releasing
exam or grading changes, exercise a disposable backend with separate student,
administrator and unauthorized accounts, plus reconnect and upload failures.
