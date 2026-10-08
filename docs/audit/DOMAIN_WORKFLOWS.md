# Domain Workflow Audit

Scope update, 2026-10-05: the project owner retired the Java standalone exam backend and its frontend pages. Historical exam findings below are retained as history, not active service blockers. AutoLab exams, timed problem sets, attendance and Rank/IP checks remain supported. See `GITHUB_ISSUES_AND_REMAINING.md` for the current issue inventory and real development regressions.

Audit date: 2026-09-05. Scope: Autolab, groups, problem sets, contests, exams,
problems, and management pages other than the in-progress AI workbench. Findings
were checked against the current `feature/upgrade-antd-v5` working tree.

## Fixed Findings

### P1: Rapid problem navigation could display the previous problem

- Evidence: `src/Component/problem/API/getProblemInfo.ts:4` kept a separate
  `nowValue`; an earlier request could resolve after `key` changed and publish its
  result into the newly rendered route. Its loading sentinel also remained set
  after rejection, blocking later mounts from retrying.
- Trigger and impact: navigate between two problems while the first response is
  delayed, or revisit a problem after a network failure. Students could see stale
  content or a permanently empty problem.
- Status: fixed. The hook now returns the Redux value selected by the current key,
  tracks in-flight work per store, user session, and cache key, avoids an automatic
  retry loop in the same mount, and discards completions after the last consumer or
  user session leaves. Published entries carry their session identity, so a completed
  guest value is hidden and reloaded after login. Changing A -> B -> A also releases
  A's former failure lock.
- Coverage: `src/Component/problem/API/getProblemInfo.test.tsx` covers an
  out-of-order response, concurrent consumers, pending and completed cache session
  changes, logout, retry after remount, and retry after A -> B -> A navigation.

### P1: Problem-set loads were permanently suppressed after failure

- Evidence: `src/Component/problemSet/API/getProblemSetInfo.ts:17` set a shared
  `<psid>-cache` loading sentinel but only cleared it on success. A first attempt
  retained that sentinel alongside session-keyed request entries. During session
  hydration, cleanup from the second old consumer could clear the first new
  consumer's sentinel and make a valid response disappear.
- Trigger and impact: a transient failure on the first overview/header load made
  every later consumer treat that problem set as already loading until Redux was
  cleared.
- Status: fixed. The unused Redux sentinel was removed. Entry identity, session
  identity, and active-consumer counts now own publication without sharing a
  cross-session flag. Published values carry a session marker, and consumers hide
  stale values while the current session reloads. A mounted instance records a
  failed ID to avoid a request loop, while navigation away and back or a later
  mount can retry. Old-route errors and completions after logout are discarded.
- Coverage: `src/Component/problemSet/API/getProblemSetInfo.test.tsx` covers shared
  in-flight work, pending and completed multi-consumer session changes,
  out-of-order navigation, A -> B -> A retry, and retry after a fresh mount. The
  real local workflow also reloads the page with an authenticated cookie and
  renders both practice and exam-mode sets. A page-level error/retry interaction
  remains pending.

### P1: Camera access could survive closing the scanner

- Evidence: `src/Component/autolab/QRScanner.tsx:21` started `getUserMedia`, while
  cleanup at line 45 could run before the promise supplied a stream.
- Trigger and impact: close the scanner while the permission prompt is pending.
  A subsequently granted camera stream remained active without visible UI.
- Status: fixed. ZXing exclusively owns one constrained stream. Its returned
  controls are stopped whether they become ready before or after close, and a
  callback delivered after close cannot publish a scan result.
- Coverage: `src/Component/autolab/QRScanner.test.tsx` controls the permission
  lifecycle and verifies both normal close and late controls cleanup.

### P1: Problem-page browser restrictions leaked into other routes

- Evidence: `src/Component/problemSet/Problem.tsx:27` previously registered
  context-menu and F12 handlers on every render without removing them.
- Trigger and impact: visit any production problem-set problem, then navigate to
  another page. Context menus remained disabled and each render accumulated more
  global listeners.
- Status: fixed. One mount-scoped guard returns an exact cleanup function.
- Coverage: `src/Component/problemSet/Problem.test.ts` verifies prevention while
  installed and normal browser behavior after cleanup.

### P1: Answer-sheet fetching used answer rows as React dependencies

- Evidence: `src/Component/exam/API/getAnswerSheet.ts:22` passed `answerSheets`
  directly as the second `useEffect` argument rather than a dependency array.
- Trigger and impact: loading or changing an answer sheet made React interpret
  answer rows as dependencies, producing dependency-size warnings and unstable
  request execution.
- Status: fixed with explicit exam/group/cache dependencies.
- Coverage: `src/Component/exam/API/getAnswerSheet.test.tsx` verifies exactly one
  request per group across navigation.

### P2: Problem-set adapters modified cached reads and reusable form drafts

- Evidence: `src/Component/problemSet/dataConvert/problemSetGet.ts:1`,
  `groupGet.ts:1`, `groupSubmit.ts:1`, `objectiveGet.ts:1`,
  `objectiveSubmit.ts:3`, `problemSetSubmit.ts:1`, and `subjectiveGet.ts:3`
  assigned IDs or transformed fields directly on their arguments.
- Trigger and impact: opening an edit form, canceling, or retrying submission could
  leave the API response/cache in form shape or the draft in transport shape.
- Status: fixed. Each adapter now copies the paths it transforms.
- Coverage: `src/Component/problemSet/dataConvert/dataConvert.test.ts` freezes the
  observable contract by checking both transformed output and unchanged input.

## Historical Pending Findings

The Autolab course, attendance, QR polling, problem lookup, contest-rank, and client
problem-detail entries described below were addressed in the 2026-09 follow-up. The
remaining section is retained as historical audit context; current closure status and
test evidence are summarized in `FRONTEND_AUDIT.md`.

The management role boundary and workbook parser hardening are also covered by
`MLayout.test.ts` and `AutoImportUsers.test.ts`; the unresolved dependency replacement
for `xlsx` remains tracked separately as A-07/A-18.

The historical rows below for Autolab races, QR polling, problem lookup, contest rank,
and client problem detail are closed by the follow-up tests. Remaining active domain work
is the standalone exam backend acceptance and broader real upload/attendance workflows.

### P1: Autolab course and attendance requests can overwrite a newer selection

- Evidence: `src/Component/autolab/CourseTab.tsx:23-45` and
  `CourseDetail.tsx:22-45` publish every response without matching it to the current
  group, user, or course. `src/Component/group/CourseSignManagement.tsx:67-100`
  has the same pattern for manager course cards.
- Trigger and impact: switch students/groups/courses before an earlier request
  finishes. The older response can replace the selected student's attendance or
  manager course list; an old request can also clear the newer loading indicator.
- Test gap: no controlled out-of-order response tests exist for these workflows.
- Action: add request-generation guards or cancellation to all three loaders and
  test A-to-B switching with B resolving first.

### P1: QR attendance polling can overlap, reject without handling, and restart

- Evidence: `src/Component/autolab/QRFloat.tsx:88-111` starts an async interval,
  does not catch polling failures, and reruns initialization whenever `sgId`
  changes. The token interval closes over the render's `sgId`.
- Trigger and impact: slow attendance responses overlap every eight seconds;
  transient failures create unhandled rejections; initialization can run twice
  after discovering a sign group.
- Test gap: there are no fake-timer tests for slow polling, teardown, token refresh,
  or a problem-set/user change.
- Action: use a serialized timeout loop, store the active sign group in a ref, and
  guard all async completions by workflow generation.

### P1: Management pages render privileged controls based only on login state

- Evidence: `src/Pages/Manage/MExam.tsx:13-36` and
  `src/Pages/Manage/Problem/MObjective.tsx:14-40` redirect only when logged out,
  then render create/edit controls without checking an administrator role.
- Trigger and impact: a logged-in non-admin can reach a manage URL and see
  privileged operations. Backend authorization may reject writes, but the UI leaks
  capabilities and repeatedly issues unauthorized list requests.
- Test gap: no component tests cover student, admin, and expired-session states for
  management routes.
- Action: enforce role-aware route/page guards using the established authorization
  helper, while retaining backend authorization as the source of truth.

### P1: Problem form lookup mutates state and hides request failures

- Evidence: `src/Component/problem/From/Item/ProblemAddBody.tsx:173-191` pushes
  into state arrays before setting them; lines 216-231 catch a failed program
  lookup but do not rethrow it. Similar direct pushes occur in
  `src/Component/problem/ProblemAddForm.tsx:84-100`.
- Trigger and impact: repeated edits can share mutated snapshots, and a failed
  lookup may appear valid to the editable table while required metadata is absent.
- Test gap: no interaction test covers concurrent code lookups, failed lookup,
  correction, and submit.
- Action: replace mutable loading/cache arrays with functional updates and preserve
  rejection through the field validator.

### P2: Contest rank preferences and results are stale across contest changes

- Evidence: `src/Component/contest/Rank.tsx:32-37` reads the liked-problem key only
  on mount, despite including `contestId` in that key. Lines 49-59 sort arrays on
  the API response in place and accept all late responses.
- Trigger and impact: reuse the mounted rank component for another contest or move
  rapidly between contests. Likes can belong to the previous contest and a late
  rank response can replace current data.
- Test gap: no navigation or out-of-order response test covers contest rank state.
- Action: reset contest-scoped state on ID change, copy response arrays before
  sorting, and ignore stale completions.

### P2: Async modal loaders can open with the wrong course

- Evidence: `src/Pages/Manage/MAutolab.tsx:198-221` sets `currentCourse`, awaits a
  loader, then opens the modal without verifying that the selected course still
  matches. Lines 240-250 do the same for auto-assignment options.
- Trigger and impact: click two course actions quickly while responses arrive out
  of order. Rows/options from the first course can be displayed under the second
  course and then submitted using the second course ID.
- Test gap: no modal test controls two deferred course responses and submission.
- Action: bind loaded data and submission identity to one immutable modal session,
  or discard responses whose course ID is no longer current.

## Verification

- Focused domain Jest: 10 suites, 24 tests passed.
- TypeScript: `tsc --noEmit` and tools typecheck passed.
- Changed-file ESLint: zero errors; remaining warnings are legacy hook/list cleanup in
  unrelated consumers. No new warning baseline was added.
- Prettier: every changed source, test, and this document was formatted.
- Environment note: the repository declares Node 24, while the available shell is
  Node 22.22.0; checks were run with Yarn's engine check bypassed. No baseline file
  was changed.
