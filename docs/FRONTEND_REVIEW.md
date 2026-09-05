# Frontend Architecture Review

This is the historical baseline review. Current findings and closure status are
tracked in [FRONTEND_AUDIT.md](FRONTEND_AUDIT.md).

Review date: 2026-09-05. Baseline: `6184af3`, branch `feature/upgrade-antd-v5`.
This review concerns the existing application, not a replacement implementation.
The baseline differs substantially from `master` (`635ea48`).

## Findings

### P1: State updates do not consistently preserve old snapshots

`Redux/Reducer/problem.ts`, `problemSet.ts`, `submission.ts`, `exam.ts`, and
`contest.ts` copy only the root object before modifying nested maps. The table
reducer copies its map but mutates existing entries. This breaks Redux's
immutable-state contract, can invalidate memoization, and makes tests dependent
on execution order. Several other reducers deep-clone the entire state for every
action, including unrelated actions.

`Redux/Action/exam.ts` also modifies values obtained from `getState()` before the
answer request succeeds. Fixing reducers alone does not fix that path. A failed
request can leave the in-memory answer changed without an accepted server write.

Migration: preserve action names, state keys and table version semantics; copy
only the changed path; return the original state for unrelated actions; create
stores through a factory. Test frozen old snapshots, independent stores, logout,
and failed answer writes before changing consumers.

### P1: Verification cannot establish a working baseline

The original test script points to nonexistent `scripts/src.js/Test`. Jest
contains absolute Windows paths, and the only test checks the removed CRA
"learn react" page. TypeScript 4.9 cannot parse installed ProForm declarations.
There is no pull-request verification workflow; deployment uses Node 16.

Migration: make type checking, unit/component tests, production compilation and
browser tests independently runnable. A successful build is not evidence that
login, grading or administration still work. Keep whole-source coverage visible;
apply stronger coverage thresholds to modules actually brought under test.

### P1: Rendering lifetimes are coupled to table rendering

`Component/common/Table/TableWithAllData.tsx` creates sortable component types
inside render and installs them even when dragging is not enabled. Similar
implementations exist in problem and exam forms. Local modal and input state can
be lost when these subtrees remount. `ProDescriptions` is owned by a responsive
table cell; hiding the operation column can remove the active dialog.

Migration: consolidate sortable rows into a shared implementation with stable
component identities. Move active dialog ownership to the page. Test editing,
dragging, resizing, selection, pagination and refresh before replacing a table.
Do not use unconditional `shouldCellUpdate: false` as a general fix: it can hide
legitimate updates.

### P1: Form appearance is not the validation contract

`ModalFormUseForm` already calls `validateFields()` for single-page forms.
However, `ItemTitle` and `ItemText` use `required` without a corresponding
`rules` validator. The earlier issue triage therefore overstated the likelihood
that issue #31 was resolved. The asterisk alone does not reject empty values.

The modal wrapper also injects values with a 100 ms timer and coordinates several
form instances. The editor publishes changes mainly on blur or explicit save.
These timing assumptions need targeted tests before lifecycle changes.

Migration: define field rules explicitly, initialize forms from data readiness,
preserve drafts on failed writes, and make cancellation and successful submission
separate transitions. Keep Markdown draft recovery scoped by user and document.

### P1: API contracts and presentation concerns are mixed

`Utils/API/request.ts` unwraps `response.data.data`, but its original type claims
to return an Axios envelope. Its exported function types also include `void`,
although callers use promises. It combines transport, time validation, storage,
notification, authentication redirects and downloads.

`c-api.ts`, `m-api.ts`, `e-api.ts`, `ext-api.ts`, and `autolab-api.ts` have uneven
types and overlapping responsibilities. UI components commonly own request
coordination and mutate cached response objects. A migrated request must preserve
cookies, endpoint paths, payload shapes, timeout behavior and existing rejection
semantics until its callers migrate together.

Migration: first characterize existing request behavior. Then add endpoint DTOs
and explicit adapters per business domain. Introduce cancellation and stale-result
protection in shared query hooks. Keep legacy `any` visible during this process;
do not substitute inaccurate types merely to obtain a green compiler.

### P2: Package and build ownership is ambiguous

Build tools, type definitions and test packages are listed as runtime dependencies.
ProForm and ProTable are imported through transitive package paths. React 17,
Redux 5, old React Redux types, old Jest helpers and newer Ant Design packages
form a partially upgraded stack. CRA scripts coexist with direct Webpack CLI
scripts, creating multiple apparent entry points.

Migration: retain Webpack and existing asset URLs for the first upgrade. Use
Node 24 LTS, React 18.3, React Redux 9, TypeScript 5.9 and compatible Ant Design 5 /
ProComponents 2 versions. Keep the Yarn lockfile and enforce frozen installs.
Import ProForm/ProTable through their declared public package. Remove unused CRA
command paths. Do not combine a bundler, router and React major migration.

React 18 is an intermediate compatibility target, not the latest React major.
`react-sortable-hoc` declares React 16/17 peers and uses legacy DOM lookup. It is a
known migration dependency, not a verified React 18 compatibility guarantee.
Replace it and test all drag/edit flows before React 19. Audit other legacy
packages, including `@ant-design/compatible`, before that transition.

### P2: Organization does not express business ownership

Pages, components, component-local API loaders, Redux caches and utilities split
one business workflow across many folders. `AutoTask.tsx` and
`AutoTaskFramework.tsx` each approach 900 lines. There are extensive `any` types,
HOC stacks and repeated stateful tables. Some layouts are incorrectly named
internally, and `Assert`, `From`, `uesAlldata` and other legacy names are exposed
through existing imports or props.

Migration: establish ownership rules first; move one tested feature at a time.
Mass renaming or converting every class component would create large diffs with
little immediate reliability benefit. Keep adapters when public props change.

### P2: Browser and security boundaries need dedicated acceptance tests

Layouts include fixed minimum widths (the client layout uses 1300 px). The
Markdown editor relies on externally addressed assets, DOM IDs and imperative
instances. WebSocket parsing/version handling lacks protocol fixtures.
There are HTML/Markdown rendering and file-download paths whose authorization,
sanitization and payload limits require a separate focused security review.
This review does not establish that those paths are exploitable or secure.

Do not enable global StrictMode until network effects, timers, camera capture,
editor instances and WebSocket subscriptions tolerate cleanup and remounting.
Do not treat a new screenshot baseline as proof of pixel parity with an earlier
version that could not be built successfully.

## Target Ownership

Keep existing paths while incrementally applying these boundaries:

| Existing area        | Responsibility                                                       |
| -------------------- | -------------------------------------------------------------------- |
| `Pages`              | Route parameters, access requirements, page composition              |
| `Component/<domain>` | Domain UI and its local state                                        |
| `Component/common`   | Reusable UI with explicit props, no hidden domain requests           |
| `Utils/API`          | Transport plus domain endpoint adapters; no page component imports   |
| `Redux`              | Cross-page client state and deliberately retained caches             |
| `Config`             | Deployment, routes, locale and theme configuration                   |
| `Type`               | Shared contracts; move feature-only types beside their feature later |

New components should prefer functions, typed props and typed Redux hooks.
Remote data belongs behind a domain API/hook; derived display data should not
create another mutable global cache. Pure data conversions should remain usable
without React or network access. Avoid introducing Redux Toolkit or a query
framework until the current cache and invalidation contracts are documented.

## Commit Plan

Each commit has one reviewable purpose. Validate each stage before continuing.

1. Record architecture findings and migration decisions (documentation only).
2. Repair portable test/tooling configuration and runtime version declarations.
3. Upgrade compatible dependencies and adapt application integration points.
4. Normalize immutable reducers and add state contract tests.
5. Isolate exam answer writes and test success/failure transitions.
6. Correct API return types and add transport contract tests.
7. Add component interaction and browser regression infrastructure.
8. Add CI/deployment gates and contributor instructions.
9. Apply formatting in an isolated mechanical commit, without behavior changes.

Some dependency/integration changes must travel together to compile. Keep that
commit limited to the required integration surfaces, rather than mixing in the
issue backlog. Update this plan if verification reveals a dependency between
steps. Do not claim completion of later business migrations from these commits.

## Acceptance Matrix

| Layer       | Initial gate                                                              | Remaining expansion                                              |
| ----------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Static      | All-source typecheck; lint errors fail; legacy warning counts cannot grow | Remove warning baseline per migrated feature; reduce `any`       |
| Unit        | Immutable reducers; time and locale boundaries                            | Data conversion, ranks, export calculations, WebSocket versions  |
| Contract    | HTTP envelope, errors, credentials, redirects, downloads                  | Endpoint DTOs, cancellation, real server contract checks         |
| Component   | Modal validation, submit success and retry                                | Table editing/dragging, Markdown lifecycle, permission states    |
| Browser     | Login, return route, problem pagination, empty submissions                | Administration, exams, contest, problem sets, uploads and logout |
| Visual      | Reviewed desktop/mobile baselines and actual asset checks                 | Domain pages, dialogs, long text, multiple locales               |
| Integration | Isolated API fixtures                                                     | Disposable backend plus seeded student/admin accounts            |

Full acceptance requires real backend scenarios for submission judging, exam
timing, administrator permissions, uploads and camera/WebSocket workflows.
Browser mocks verify frontend behavior but do not prove deployed backend
compatibility. Real services and test identities must be isolated from production.

## Suggested Next Business Migration

Start with the shared table/form/editor path because it contributes to #29, #31,
#32 and #51. Give each migration its own characterization tests and commit. Next
cover submission processing and WebSocket behavior (#33 and #42). Recheck #48
against the actual deployed autolab service. Keep issue closure separate from
this foundation work and require scenario-specific evidence.
