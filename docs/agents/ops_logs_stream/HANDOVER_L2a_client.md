# L2a client: the log viewer minigame (handover)

Done: stage L2a items 1 (`logRows`), 3 (minigame, registration, `interactions.js` branch,
`sourceRoute`, type, texture, lighting) and 4 (schema entry). Item 5 (a reader in `test_ops_logs`,
playtest, docs) is not done. No browser was run.

## Answer shape assumed (plan 6, 7)
`GET /log_rows` answers `{ rev, title, rows: [{ id, elapsedMs | at, event, as, where, result,
detail }] }` or `{ rev, unchanged: true }`. All row values are strings (`elapsedMs` a number);
`result` already carries `xN` and `+`; `as` and `where` are `-` when empty; `detail` is a joined
string (`-` or empty when none). Any non-2xx (the plan's 400/404) is a refusal: `NO ACCESS`.
The viewer drops any other key (`cleanRows`).

## Object and opening
- Type `ops_log_terminal`, `minigameData.logSource` (required), optional `title`, `anomaly`,
  `flagActionLabel`, `flagActions`, `completionActions` (schema entry). Frame title = object `name`.
- Opened by the `ops_log_terminal` branch in `systems/interactions.js` (before the drug-library
  branch): `startMinigame('ops-log', null, { title: name, sprite })`, no `showCancel`.
- Reader id is `sprite.scenarioData.id`. The route is `sprite.sourceRoute` (`{ foothold }` or
  `{ from }`), added by `ContainerMinigame.sourceExtras()` through a new `routeExtra()` (from
  `this.remote.footholdId` / `this.fromRoute.fromPcId`). The container list treats the type as
  interactive. Texture `ops_log_terminal` loads `objects/log_filter_terminal.png`.
- The stylesheet `css/ops-log-minigame.css` is linked by the module itself (like dusting), because
  `show.html.erb` was not in this step's file list. A later step may add the link there.

## DOM and hooks
`.ol-wrapper[data-ops-log=viewer]` holds `caption`, `filters` (selects `[data-filter]` time, event,
where, result; text input `[data-filter=as]`), `table-wrap` > `table[data-ops-log=table]` (`th[data-col]`,
`tr.ol-row[data-row-id][aria-selected]`, `td[data-col]`; message rows `.ol-message[data-state=loading|denied|empty]`),
`detail` (`[data-ops-log=detail-grid]`, values `[data-field=TIME|EVENT|IDENTITY|LOCATION|RESULT|DETAIL]`),
`status` (`[data-ops-log=count]`, `button[data-action=refresh]`).

## State
Module cache of the last answer per reader and route (`clearOpsLogCache()` for tests); reopen sends
its `rev`. An epoch counter drops a stale answer. Selection by row id, cleared if the row is gone.

## Not built (L2b)
The anomaly flag button, confirm, `flagActions` and `completionActions`. `anomaly` is accepted in the
schema but ignored; the L2a test asserts no flag button and no tint exist. L2b adds both.
`showCardHolder` is the server's job (the viewer shows the `as` it is given).

## Tests
`test/js/ops-log-viewer.test.mjs`: 15 tests, run with `bin/test-js`. The two copy lists named in the
prompt (`patch-panel`, `social-authenticator-wiring`) read `minigames/index.js` as text and have no
copy list, so they needed no change. A live proof should: open a `test_ops_logs` reader, see
LOADING then rows, filter, select with the keyboard, refresh, open one from a PC desktop and over a
foothold (check the request carries `from=` / `foothold=`), and confirm a locked reader shows NO ACCESS.

## R1 changes (contracts that moved; see HANDOVER_L2a_client_fix.md and reviews/L2a_client_R1.md)
- Route: `sprite.sourceRoute` is now `{ foothold }`, `{ from }` or `{ relay: true }`; `ApiClient.logRows`
  sends `relay=1` (only when true, never with another route). `routeExtra()` also derives the route for a
  folder under a sign-in PC from that PC's session (`folderRouteQuery`). The answer cache key includes it.
- RESULT filter works on the result's word (`resultWord`: `FAIL x3` and `FAIL` are `FAIL`); a select filter
  whose value left the list is cleared on a new answer (`pruneFilters`).
- The stylesheet is linked from `show.html.erb` (`id="ops-log-css"`, `be_asset_path`); the module's injection
  is a fallback only. The table no longer carries the `lf-log-*` classes.
- `minigameData.title` is not in the schema: the frame title is the object's `name`, the caption the server's title.
- A non-refusal failure (not 400/403/404) keeps held rows and shows `NO SIGNAL - REFRESH` in the status line.
- Rendering: the filters, the table frame and the status bar are built once; an `unchanged` answer renders
  nothing; a click moves `ol-row-selected` between existing rows; one row is a tab stop (arrows move it).
