# State, Transport, and Submission Audit

Audit date: 2026-09-05. Scope: `src/Redux`, `src/Utils` (excluding the separate
AI workbench), and `src/Component/submission`.

## Fixed findings

| Severity | Location                                                                                                    | Trigger and impact                                                                                                                                                                                                                                                              | Evidence and tests                                                                                                                                                                                                                                                               | Status |
| -------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P1       | `Component/submission/SubmissionList/SubmissionList.tsx:47`, `Component/submission/submissionUpdates.ts:20` | Live frames mutated Redux rows; cumulative frames lost earlier synchronous updates; replay added score repeatedly. Private and public cases shared an index-only key, so `type 0/index 0` and `type 1/index 0` collapsed into one step. Rejudge versions retained old progress. | Pure tests freeze snapshots, distinguish typed checkpoint keys, reset on a newer version, and ignore older frames. The consumer test delivers private/public index 0 synchronously, verifies score 30 and two steps, then verifies a new version resets to one step and score 5. | Fixed  |
| P1       | `Utils/API/request.ts:84`                                                                                   | Axios cancellation has no `response`; it was converted to “server unreachable” and displayed as an error. Route changes using cancellation therefore looked like outages and callers could not distinguish cancellation from failure.                                           | `request.test.ts` rejects with an actual `CanceledError` and verifies that the original cancellation survives without a notification.                                                                                                                                            | Fixed  |
| P1       | `Utils/API/request.ts:98`                                                                                   | An HTTP error with an empty body dereferenced `response.data.code`, throwing a secondary `TypeError` and hiding the actionable transport failure. An empty HTTP 401 also skipped session redirect because authentication was inferred only from the body code.                  | `request.test.ts` covers empty 503 fallback and empty 401 redirect. Error parsing uses optional access and authentication also uses HTTP status.                                                                                                                                 | Fixed  |
| P2       | `Utils/API/request.ts:102`                                                                                  | The expired-session return path was concatenated directly into a query string. Reserved characters could change query parsing, and a URL outside the configured prefix produced an invalid substring.                                                                           | The redirect test requires percent encoding; construction now parses the current URL and has a prefix fallback.                                                                                                                                                                  | Fixed  |
| P2       | `Component/submission/SubmissionList/SubmissionList.tsx:366`                                                | Refreshing a list with no running rows left the previous WebSocket open and retained its subscription list. This kept an unnecessary connection alive and could deliver stale frames.                                                                                           | The row transform now sets both open state and the query list for empty and non-empty results. Covered structurally by the pure update and existing `SyncJudging` subscription tests; a full table integration test remains useful.                                              | Fixed  |
| P1       | `Component/submission/Processing/Processing.tsx:93`                                                         | Rapidly opening submission B before submission A resolved let A overwrite B's detail state. Normalization also mutated the response object and checkpoint arrays, corrupting frozen or shared cached DTOs.                                                                      | `Processing.test.tsx` resolves B before A, then resolves the stale frozen A response. B remains rendered and neither DTO is mutated. Request generations invalidate results after navigation and unmount.                                                                        | Fixed  |
| P1       | `Redux/Action/user.ts:13`                                                                                   | The logout thunk returned `void` while starting a detached request, so callers could navigate and announce success before the server accepted logout. Rejections were not observable through dispatch.                                                                          | `user.test.ts` verifies the returned promise remains pending with state intact, clears all Redux state after success, and rejects with state intact after failure.                                                                                                               | Fixed  |

## Historical Pending Findings

The former pending entries for `fileUpload`, the unused `getSubmissionList` hook,
checkpoint mutation, invalid response timestamps, and canceled submission results
were closed in the 2026-09 follow-up. See `fileUpload.test.ts`, `Processing.test.tsx`,
`request.test.ts`, and `Submit.test.tsx`. The unused hook was removed after confirming
that no in-tree consumer imported it.

The table below is retained as the original trigger record. Current closure status is
tracked in `FRONTEND_AUDIT.md`; only dependency and backend acceptance work remains open.

The upload, obsolete hook, checkpoint mutation, timestamp, and canceled-submission rows
are closed by the current follow-up implementation and tests. They remain below as
historical trigger descriptions for traceability.

| Severity | Location                                             | Trigger and impact                                                                                                                                          | Missing test                                                                                                           | Status |
| -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------ |
| P1       | `Utils/fileUpload.ts:4`                              | Both upload helpers returned `void` and detached every promise.                                                                                             | `fileUpload.test.ts` covers hash/cache/upload failures, mixed batches, ordering, and cancellation.                     | Fixed  |
| P2       | `Component/submission/API/getSubmissionList.ts:4`    | Concurrent mounts with the same missing key issue duplicate requests. A late request can dispatch after key changes or unmount, and rejection is unhandled. | No in-tree consumers remained; the obsolete hook was removed.                                                          | Fixed  |
| P2       | `Component/submission/Processing/Processing.tsx:149` | Checkpoint handlers wrote into captured state arrays before copying them.                                                                                   | `Processing.test.tsx` covers frozen snapshots and synchronous private/public frames with functional updates.           | Fixed  |
| P2       | `Utils/API/request.ts:70`                            | Successful envelopes assumed a finite timestamp and storage was treated as part of transport success.                                                       | `request.test.ts` covers missing/invalid timestamps and unavailable storage.                                           | Fixed  |
| P2       | `Component/submission/Submit.tsx:50`                 | The nested promise chain collapsed validation/API failures and accepted late success after cancel.                                                          | `Submit.test.tsx` covers cancel-while-pending, late success suppression, retry after API failure, and oversized files. | Fixed  |

## Existing coverage reviewed

Reducer tests freeze every prior root snapshot, verify unknown-action identity, preserve
unchanged table entries, check signed table-version behavior, and confirm isolated
stores plus cache clearing. Exam action tests cover failed writes and bounded choice
updates. WebSocket parser/subscriber tests cover malformed, wrapped, cumulative,
obsolete, reconnect, and nullable completion frames. Shared request tests cover
credentials, DTO unwrapping, validation/business/network errors, silent background
authentication checks, downloads, session redirects, and clock skew.

## Verification

- Node 24 TypeScript checks passed.
- Final shared-worktree Jest: 64 suites, 321 tests passed. The cumulative-frame and
  rejudge consumer regressions pass with the pure update suite (2 suites, 6 tests).
- Lint: 0 errors, 149 tracked legacy warnings in the shared worktree. Excluding the
  parallel AI files, comparable warnings fell from 168 to 149; no baseline was changed.
- Touched source and tests pass Prettier; `git diff --check` passed.

The focused suite uses Axios Mock Adapter and pure frozen state fixtures. It does not
prove backend WebSocket ordering, cookie invalidation, upload behavior, or the real
submission lifecycle; those require the pending component and local-service scenarios
listed above.
Current remaining entries are historical follow-up targets; closure status is recorded in
`FRONTEND_AUDIT.md`. The upload contract now returns awaitable results and abort handles,
and all in-tree upload consumers either await the result or attach an explicit rejection
handler.
