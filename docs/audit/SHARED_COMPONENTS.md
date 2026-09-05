# Shared Form, Table, and Markdown Audit

Audit date: 2026-09-05. Scope: `src/Component/common/Form/**` and
`src/Component/common/Table/**`, `src/Component/common/Editor.tsx`,
`src/Component/common/Md2export.tsx`, and shared Markdown preview helpers on the current
`feature/upgrade-antd-v5` working tree.
The checks below use isolated promises and rendered Ant Design components; no backend
or browser fixture is involved.

## Fixed Findings

| Severity | Location                             | Trigger and impact                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Regression evidence                                                                                                                                                                                                 | Status |
| -------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| P1       | `Table/TableWithPagination.tsx:55`   | Start an initial/page request, then search or change page before it resolves. The older response previously wrote rows, totals and Redux table metadata after the newer response, displaying the wrong query. A monotonically increasing request id now permits only the latest request to publish.                                                                                                                                                                                                                    | `TableWithPagination.test.tsx`: “keeps the newest search result when an older request resolves later” resolves the second request first and proves the stale row never renders.                                     | Fixed  |
| P1       | `Table/TableWithPagination.tsx:75`   | A rejected or synchronously throwing API request previously had no rejection/finalization path. Loading stayed active and a later refresh started from an unhandled rejection. The request is now normalized through a promise chain; failure preserves existing rows and the latest request clears loading.                                                                                                                                                                                                           | `TableWithPagination.test.tsx`: “stops loading after rejection and supports a version-triggered retry”.                                                                                                             | Fixed  |
| P1       | `Form/ModalFormUseForm.tsx:54`       | Rapidly invoke an update action twice while both loaders are pending, then resolve the newer request before the older one. The older record previously replaced the newer form data. Loader generations now discard stale results and unmount/cancel invalidates pending work.                                                                                                                                                                                                                                         | `ModalFormUseForm.test.tsx`: “ignores an older loader result when the edit action is started twice”.                                                                                                                | Fixed  |
| P2       | `Table/CellEditTable.tsx:26`         | Replace editable rows with different keys but the same row count. The old length-only effect retained obsolete editable keys, so ProTable treated the replacement rows as non-editable. Keys are now rebuilt whenever the value or key field changes.                                                                                                                                                                                                                                                                  | `CellEditTable.test.tsx`: replaces `[1,2]` with `[3,4]` and observes the editable-key contract update.                                                                                                              | Fixed  |
| P1       | `Editor.tsx:238`, `Md2export.tsx:55` | Changing language constructed another Vditor without destroying the old instance; closing the export modal and unmounting either component also left editor DOM listeners and resources alive. Each effect now owns and destroys exactly the instance it created. The editor callback reads the latest `onChange` through a ref rather than retaining the callback from construction.                                                                                                                                  | `EditorLifecycle.test.tsx`: replaces the editor language, unmounts it, and closes an export modal while asserting each instance is destroyed once.                                                                  | Fixed  |
| P2       | `Editor.tsx:24`                      | Every notification copy button previously constructed ClipboardJS during render with a new random selector. Rerenders accumulated listeners and unmount never released them. The button now binds one instance to its element in an effect, reads current text through a ref, and destroys the listener on cleanup.                                                                                                                                                                                                    | `EditorLifecycle.test.tsx`: “destroys the clipboard listener when a copy button unmounts”.                                                                                                                          | Fixed  |
| P1       | `Form/FormExtraInfo.tsx:10`          | The first warning-removal draft made both directions react to both values. When form and local values differed, one effect wrote local state to the form while the other wrote the old form value back to local state, allowing a swap or repeated oscillation. A single effect now identifies the changed side, records its expected echo, and lets only that side publish. Form initialization takes precedence. Undefined synchronization is explicit opt-in because legacy string/time adapters cannot consume it. | `FormExtraInfo.test.tsx`: a real controlled `Form.Item` covers initial form data, external/form updates, conflict ownership, opt-in clear, reset, and default compatibility with an adapter that rejects undefined. | Fixed  |

The modal's delayed field injection now clears its timer on every dependency change and
unmount (`ModalFormUseForm.tsx:102`), preventing a closed or discarded form from receiving
the delayed write. Pagination no longer mutates the API response object when `rows` is
null (`TableWithPagination.tsx:87`). The Card migration also removes deprecated
`bordered`, `headStyle`, and `bodyStyle` props, and search-only tables no longer operate on
an unmounted filter form.

## Historical Pending Findings

The upload-routing entry and editor cache/external-icon entries below were closed in
the 2026-09 follow-up. Upload controls now use the documented `use` prop, expose an
abort handle, and return awaitable results. Editors disable unscoped persistent cache,
use user/document/field identities when available, and serve the save icon locally.
The current pending rows are retained as historical audit context; their closure evidence
is listed in `FRONTEND_AUDIT.md` A-01, A-12, A-13, and A-17.

Only A-11 and A-12 remain active component follow-ups. The upload and editor rows below
are closed by the current implementation and tests; their original descriptions remain
for traceability.

The active rows are retained as migration targets; they are not release blockers for the
closed upload/editor fixes listed in `FRONTEND_AUDIT.md`.

| Severity | Location                                       | Trigger and impact                                                                                                                                                                                                                                                              | Missing test                                                                                                                                                                                       | Status  |
| -------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| P2       | `Form/Item/ItemUpload.tsx:45`                  | The public prop was named `use`, but routing read `props.ues`; user mode could take the wrong path.                                                                                                                                                                             | `ItemUpload.test.tsx` covers both adapters and abort.                                                                                                                                              | Fixed   |
| P2       | `Form/ModalFormUseForm.tsx:102`                | Initial values still depend on a fixed 100 ms delay so that ProComponents step refs can mount. Under a delayed step mount, fields can briefly be empty or miss initialization; removing the delay without coordinating child readiness would regress existing multi-step forms. | A real multi-step ProComponents test covering async load, next/back navigation, reset, close/reopen and nested field values.                                                                       | Pending |
| P2       | `Table/TableWithPagination.tsx:121`            | The initial-load and version effects intentionally omit callback/state dependencies. This avoids refetching for the many inline API props, but it leaves five `react-hooks/exhaustive-deps` warnings and makes prop-change refresh semantics implicit.                          | Characterization tests for same-name API replacement, changed `initRequestProps`, filter restoration, negative Redux versions and positive refresh versions before extracting a stable query hook. | Pending |
| P1       | `Editor.tsx:58`, `Form/Item/ItemEditor.tsx:16` | Cache keys now include user, document, and field identity; unscoped editors disable persistent cache and use unique DOM containers.                                                                                                                                             | `EditorLifecycle.test.tsx` covers two users, two documents, fields, duplicate mounts, and remounts.                                                                                                | Fixed   |
| P2       | `Editor.tsx:124`                               | The save toolbar icon previously loaded from an external 58cdn host.                                                                                                                                                                                                            | Bundled `Assert/img/save.svg`; lifecycle test verifies no external URL.                                                                                                                            | Fixed   |

`Utils/MarkdownPreview.ts:41` delegates HTML generation to Vditor 3.11.2. The installed
Vditor defaults `preview.markdown.sanitize` to `true`, and no audited wrapper overrides it.
Preview inputs include backend descriptions and student answer content, so sanitization is
a real trust boundary. This audit found no concrete bypass and does not classify the path
as an XSS finding; a focused malicious-markup fixture remains appropriate when that boundary
is migrated or the Vditor version changes.

## Verification

- Focused shared suite: 11 suites, 45 tests passed (`ModalFormUseForm`, `FormExtraInfo`,
  `TableWithPagination`, `CellEditTable`, `TableWithAllData`, `SortableTable`, and editor
  lifecycle).
- TypeScript: `tsc --noEmit && tsc -p tsconfig.tools.json` passed.
- Scoped ESLint: 0 errors. Remaining warnings are legacy hook/nested-component patterns;
  no new warning baseline was added.
- Changed source and test files pass Prettier. Commands used `yarn --ignore-engines`
  because this shell provides Node 22.22 while the repository declares Node 24; the
  TypeScript and Jest processes themselves completed successfully.
- Runtime diagnostics were also reduced: verification-email input uses
  `Space.Compact` instead of deprecated `addonAfter`, i18next's support notice is
  explicitly disabled, list steps have stable keys, and compatible Lezer packages
  are deduplicated. The real CodeMirror mount test now fails on any console error;
  the final 48-suite Jest run emitted no console error, warning, or info messages.

Full browser behavior, real upload endpoints and multi-step forms backed by production
data remain outside this component-level evidence. Those scenarios should be added before
closing the pending findings.
