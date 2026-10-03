# Frontend Follow-up, 2026-09-06 (historical)

This is a historical verification snapshot. For the current status and latest
quality numbers, use [FRONTEND_CURRENT_AUDIT_2026-10-02.md](FRONTEND_CURRENT_AUDIT_2026-10-02.md).

For the subsequent multi-agent scan and current issue status, see
[FRONTEND_AUDIT.md](FRONTEND_AUDIT.md).

This continues the form-contract and React 18 migration on
`feature/upgrade-antd-v5`. The separate AI workbench changes are outside this batch.

## Implemented

- Connected generated Autolab field rules for courses, course times, classroom
  selection, classrooms, attendance leave, objective/subjective configuration,
  and problem-set configuration. Editable rubric, file and problem-group rows
  validate their actual nested model fields.
- Matched contest visibility values to Java Integer bounds and corrected legacy
  exam request validation to use `features.scoreMod`, `features.caseMod`,
  `features.openReport`, and `description`.
- Replaced stale local date state with the form's timestamps. Clearing a range
  clears both values; required errors remain visible; reset and nested lists
  retain their own dates. Time-window dialogs validate before returning data.
- Fixed subjective mode selection storing a radio event instead of an integer,
  and group time configuration being saved under `answer` instead of `timeSetting`.
- Verified the existing dnd-kit migration with keyboard movement, cancellation,
  disabled handles, stable keys, focus retention and unsaved drafts. Fixed its
  remaining lint error.
- Deduplicated compatible CodeMirror core dependencies in `yarn.lock`. Real
  editor mounts now work for C, C++, Java, SQL, Python and plain text; the earlier
  mixed state instances crashed when opening a code submission.
- Handle live, wrapped and cumulative WebSocket records, including nullable
  completion fields. Completion tracking is per subscriber, so the submission
  list and result dialog both finish. Reconnect subscribes again and completed
  replay is ignored within that subscriber.
- Development avatars use the local icon instead of contacting Cravatar.
  Production avatar behavior is preserved.
- Table queries now have an explicit request/response contract, stable refresh
  semantics, filter reset behavior and stale-response protection. Multi-step
  modal forms inject initial values when form instances are ready rather than
  relying on a timer.
- Management layout uses a drawer navigation on mobile, and classroom tables
  remain locally scrollable. Copyright HTML is sanitized with an allowlist and
  Vditor markdown rendering explicitly enables sanitization.
- Added Playwright flows for mobile management, session login/logout, regular
  user management denial, and inert copyright markup.
- Removed the remaining production dependency advisory by resolving
  `@ant-design/pro-layout`'s `path-to-regexp` to `8.4.0`; compatibility copies
  used by React Router and the development server remain on their required majors.
- Added browser-level ZIP upload failure/retry and cancellation flows across
  Chromium, Firefox, WebKit, and mobile Chromium; failed or stale uploads can
  no longer enable submission.
- Made JPEG optimization optional when `jpegtran-bin` has no platform binary,
  so clean ARM installs still produce a verified production build.

## Verification

| Check                                              | Result                                                                            |
| -------------------------------------------------- | --------------------------------------------------------------------------------- |
| TypeScript                                         | Passed (`YARN_IGNORE_ENGINES=1`, local Node 22; package requires Node 24)         |
| Jest with coverage                                 | 77 suites, 367 tests passed; Lines 28.66%, Statements 27.87%                      |
| Lint / format                                      | 0 errors; 143 tracked legacy warnings; format 0 failures                          |
| Explicit production `any` types in changed modules | Reduced by 12 relative to the starting HEAD                                       |
| Dependency audit                                   | 0 critical / 0 high / 0 moderate / 0 low; ProLayout path-to-regexp resolved 8.4.0 |
| Production build                                   | Passed; Vditor asset-size warnings remain; entrypoint 4.04 MiB, JS gzip ~1.23 MiB |
| Desktop Chromium, Firefox, WebKit                  | 33 scenarios passed                                                               |
| Mobile Chromium                                    | 12 scenarios passed; 3 non-mobile-only checks skipped                             |
| Visual regression                                  | Chromium desktop + mobile baselines passed (2 tests)                              |
| Local services and authenticated workflows         | All 3 scenarios passed                                                            |

The local workflow uses an isolated generated administrator and creates test
students and data with `fe_` / `FE-DEV-` identifiers. It checks real browser login,
administrator classroom validation and creation, student permission denial,
practice and exam-mode problem sets, C++ submission, WebSocket replay after a new
connection, and the final **Accepted** UI state. No API responses are mocked and
non-loopback requests are rejected. The final run had no external requests or
page errors. Submission `c4543a3688db007` scored 100 with 10 private and 2 public
test cases. Its decimal database ID is `884187270961016839`.

## Reproduction

Use the local stack described in `../sduoj-deploy/DEV.md` (relative to the repository
root). Start Autolab and a fresh frontend dev server after installing the lockfile.
The authenticated fixture currently reads the generated local administrator and
native objective group from:

```text
../sduoj-deploy/data/dev/ai-integration/test-user.json
../sduoj-deploy/data/dev/ai-integration/report.json
```

These ignored local fixtures are generated by the adjacent Autolab repository's
`scripts/verify_ai_native_dev.py`. Credentials must remain outside Git. The browser
test refuses non-loopback base URLs and does not alter existing account passwords.
Test records remain locally for inspection; there is no problem-set deletion API.

```sh
LOCAL_BASE_URL=http://127.0.0.1:3002 yarn test:local services.spec.ts workflows.spec.ts
yarn typecheck
yarn lint
yarn test:coverage --silent
yarn build
yarn test:e2e
yarn test:visual
```

The checked dev server is `http://127.0.0.1:3002/v2`. Runtime evidence is ignored:
`test-results/local/`, `playwright-report/local/`, and `output/web2-followup-*.log`.
On this ARM Mac, a clean dependency install has no bundled jpegtran executable;
the production config now skips only that optional JPEG optimization and builds
successfully without a manual binary relink.

## Remaining Work

- The obsolete standalone exam backend is absent from the Java checkout. Its
  end-to-end lifecycle is unverified; Autolab problem sets in exam mode were tested.
- This batch is not a complete audit of every Autolab workflow. Continue with
  automatic-task forms, attendance/seat actions, upload failures, and actual
  answering/hand-in flows beyond problem-set browsing.
- The subsequent audit repaired the recorded client login and pagination mobile
  failures. The classroom management flow now runs on mobile; broader automatic
  task, attendance and seat workflows still need real-service coverage.
- Continue reducing historical lint and `any` usage. Whole-repository line coverage
  is only 8.7%; passing migrated-module gates does not imply broad coverage.
- The full format check also sees concurrent AI workbench/router edits. At this
  checkpoint it reports `src/Config/router/router.tsx` and
  `src/Pages/Manage/AI/NativeQuestionWorkbench.test.tsx`; neither belongs to this
  batch. All files in this batch pass Prettier without changing the baselines.
