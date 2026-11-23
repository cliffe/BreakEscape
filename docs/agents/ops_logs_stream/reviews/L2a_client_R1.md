# L2a client half, review R1

Reviewed: commit c6f27c685 (client) against b0d5e98a8 (server) and OPS_LOG_ROWS_PLAN.md. Reviewer read-only. Findings appended per check below.

Paths are relative to the worktree root; line numbers are at `c6f27c685`. JS = `public/break_escape/js`,
CSS = `public/break_escape/css`, PLAN = `docs/achitechture/OPS_LOG_ROWS_PLAN.md`.

What was run (read-only): `bin/test-js` on `ops-log-viewer`, `log-filter-selected-row`, `log-filter-wording`,
`patch-panel`, `social-authenticator-wiring`: each file passed. One headless-browser style probe, built in the
reviewer's scratchpad from `git show` copies of the CSS (nothing written in the worktree). No game was played.
The reviewed files are unchanged between `c6f27c685` and the worktree at review time.

## Severity count

| Severity | Count |
|---|---|
| blocker | 0 |
| major | 5 (F1 to F5) |
| minor | 12 (m1 to m12) |

## Verdict

NOT PASSED. No blocker, five majors. The two halves agree on the answer shape and every row key; the one
request mismatch is `relay` (F2). Fix F1 to F5, then a delta review (R2).

---

## Check 1: the two halves agree

Agreed, verified at the lines:
- Request. Client `ApiClient.logRows` (`JS/api-client.js:282-288`) sends `object_id`, `rev` (only when truthy),
  then `foothold`, else `from`; never both. Server `log_rows` reads `params[:object_id]`, `params[:rev].present?`,
  and the route through `folder_route_allowed?` -> `desktop_route_params` (`foothold`, `from`, `relay`; two named
  = conflict). The client never names two.
- Answer. `{ rev, title, rows }` or `{ rev, unchanged: true }`: the client handles both
  (`JS/minigames/ops-log/ops-log-minigame.js:107-119`). `unchanged` is only acted on when rows are held, and a
  `rev` is only sent when rows are held, so the pair cannot disagree.
- Row keys. Server builds exactly `id, elapsedMs, event, as, where, result, detail`; the client keeps exactly
  those plus `at` (`ops-log-rows.js:126-135`).
- Who formats what. The SERVER formats `event` (label), `as` (username form, `~`, display name or `-`),
  `where` (display name or `-`), `result` (upper case, ` xN`, `+`) and `detail` (`key: value, ...`). The CLIENT
  formats only time: `elapsedMs` (Integer) through `window.gameClock.formatStamp` (`ops-log-rows.js:52-60`,
  plan 5.2 and 13.4). The client note's "display strings" is right for all but `elapsedMs`, and the code
  checks `typeof elapsedMs === 'number'`, which the server's Integer satisfies.
- `x3` and `+`: passed through untouched (`cellText`), as PLAN:662 asks.
- Empty `detail`: the server sends `""`, the client shows `-` (`ops-log-rows.js:77-78`). Consistent with both notes.
- 400 and 404: both throw in `ApiClient.get`, both show `NO ACCESS` (PLAN 5.2 "Any refusal shows NO ACCESS and
  nothing else"). An empty id never leaves the client (`ops-log-minigame.js:89`). Matches the plan. See m2 for
  failures that are not refusals.

Mismatches: one (F2).

### F2 (major): the client can never send `relay`, so a reader on a relay desktop always reads NO ACCESS
- Where: `JS/api-client.js:282-288` (`logRows` takes `foothold`, `from`, `rev`, `signal`; no `relay`);
  `JS/minigames/container/container-minigame.js:2227-2232` (`routeExtra()` reads `this.remote` and
  `this.fromRoute` only, never `this.relay`, set at `:760`).
- Plan: PLAN:331-332 ("The request carries the screen's route ... as `/container` and `/keyring` do") and
  PLAN:299-303 (`sourceRoute` carries what the container passed to `ApiClient.container`). `/container` on a
  relay desktop sends `?relay=1` (`container-minigame.js:1009-1010`, `folderRouteQuery` `:23-32`). PLAN:308
  names only `foothold` and `from`, so the plan text has the same gap; the server handover documents `relay=1`.
- What is wrong: for a reader under a sign-in PC held by a relay session, the server's
  `folder_route_allowed?` with no route answers `!relay_session?(session)` = false, so `/log_rows` is 404 and
  the viewer shows NO ACCESS, though the same desktop's folders open. Affects a reader on the relay desktop
  and one in a folder under it.
- Related, not a fault: `routeExtra()` only knows the route on the desktop screen itself (`this.remote`,
  `this.fromRoute` need `loginPcId`). A reader in a FOLDER under a foothold or `from` desktop sends no route;
  the server allows a no-route read under a non-relay session, so that works, by the server's rule and not
  by the client's.
- Fix: `routeExtra()` returns `{ sourceRoute: { relay: true } }` for `this.relay`, and for a folder derives the
  route from the source PC's session the way `folderRouteQuery(this.sourcePcId)` does; `logRows` accepts
  `relay` and sends `relay=1` (never `relay=false`); add `relay` to the viewer's cache key
  (`ops-log-minigame.js:49`); a test for the URL and for `sourceExtras()` on a relay desktop; add `relay` to
  PLAN:308. If the user rules that a relay desktop must not read logs, say so in the plan and test the refusal.

## Check 2: the viewer against 5.2

Meets the plan: `consoleWindow = true`, no Cancel, frame title = object `name` (`:38-46`); one `LOADING` row
first; caption = the answer's `title` once rows arrive; columns in order; TIME by `formatStamp(elapsedMs)`,
seed rows by `at`; TIME filter as four six-hour ranges from the row's hour (`timeParts`, never string
positions; `parseAt` for `at`); EVENT, RESULT, LOCATION options from the rows present, IDENTITY as text;
selection keyed on `id`, kept across a refresh, cleared when the row is gone; REFRESH button; no polling (the
plan asks for none); reopen sends the last `rev` (module cache keyed by reader and route); rows stay in the
server's `seq` order with no client sort (PLAN:1036, "all ordering" is `seq`).

### F3 (major): an `unchanged` answer, and every row click, rebuild the whole view; the list jumps to the top and focus is lost
- Where: `ops-log-minigame.js:107-108` then `:120` (`_render()` runs for `unchanged` too); `:157-165`
  (`_render` rebuilds filters, table, detail, status); `:213-214` (`host.textContent = ''` on the scroller
  `.ol-table-wrap`); `:268-271` (`_select` rebuilds the table); `:298-307` (the REFRESH button is destroyed and
  remade on every render).
- Plan: PLAN 5.2 ("an unchanged answer keeps the rows"; "Selection keys on the row's `id`, so a refresh keeps
  it") and this review's check 2 (no re-render or scroll jump when unchanged).
- What is wrong: emptying the scroll container resets its `scrollTop` to 0. So (a) pressing REFRESH with
  nothing new scrolls a long log back to the top; (b) clicking any row far down rebuilds the table, scrolls to
  the top, then `focus()` drags the row back into view at a different place (a visible jump on every click);
  (c) after REFRESH the button the keyboard user was on no longer exists, so focus falls to the document and
  Tab starts again; a focused filter loses focus the same way. Reasoned from the code; not run in a browser.
- Fix: on `unchanged`, update `_rev` and return without rendering. In `_select`, do not rebuild: move
  `ol-row-selected` and `aria-selected` between the two existing rows and re-render only the detail panel.
  On a changed answer, save and restore `tableWrap.scrollTop`, and keep the REFRESH button (build the status
  bar once in `_renderLayout`, update only the count text). Test: element identity of a row and of the button
  is the same before and after an `unchanged` refresh and after a click; `scrollTop` is restored.

### F4 (major): a filter whose value disappears on refresh stays active but invisible
- Where: `ops-log-minigame.js:187` (`sel.value = this._filters[key]` when no such option exists any more) and
  `:171` (options rebuilt on every render); `ops-log-rows.js:92-98`, RESULT options are the whole result text.
- Plan: PLAN 5.2, filters ("EVENT, RESULT and LOCATION as the values present").
- What is wrong: this happens in the plain course of play. The player filters RESULT = `FAIL x2`, fails a
  sign-in once more, presses REFRESH: the merged row now reads `FAIL x3`, the option `FAIL x2` is gone, the
  select shows nothing (or ALL), but `_filters.result` is still `FAIL x2`, so the table reads
  `NO MATCHING ROWS` with no filter visibly set. Same for a LOCATION or EVENT value that leaves the list.
- Fix: after a new answer, reset any select filter whose value is not among the new options (in `_load`, next
  to the selection check at `:115`). Better, together with m9: filter RESULT on the result word, so the count
  growing does not change the value. Test: filter on a merged result, refresh with a higher count, assert the
  filter state and the visible rows.

## Check 3: no row is marked as special

Clean. Every data row gets the same classes (`ol-row lf-log-row`), the same attributes (`data-row-id`,
`tabindex`, `aria-selected`) and the server's order; the only variant is `ol-row-selected` on the row the
player picked (`:245-251`). `minigameData.anomaly` is never read by the viewer; no flag button, confirm or
action code exists; the CSS has no anomaly, flag or tint rule. Nothing of the L2b flow is half-present.
(In L2b a seed row's id `s1` and a play row's ten-hex id will differ in `data-row-id`; that is the plan's own
id rule, PLAN:365, and marks seed against play, not the anomaly.)

Schema keys `anomaly`, `flagActionLabel`, `flagActions`, `completionActions` in L2a: RIGHT to have them now.
PLAN:739-742 (L2a item 4) and PLAN:170-172 put the whole entry in L2a, and PLAN:387-390 already accepts that
these reader fields reach the browser with the room. One consequence to write down in the L2a docs step: until
L2b an author's `anomaly` validates clean and does nothing.

No finding.

## Check 4: existing behaviour untouched

- `git diff --stat main c6f27c685 -- JS/minigames/log-filter/` is empty; the two log-filter tests pass unchanged.
- `interactions.js:1636-1648`: a new branch between the log-filter and drug-library branches; pure addition,
  no existing line altered. Copied from the log-filter branch without `showCancel` / `cancelText`, as planned.
- `game.js:913`: one added line. `lighting.js:441`: one type added inside the existing regex (the plan directs
  this; it is a one-line change, not an addition, see m10). `minigames/index.js`: three added lines.
  `api-client.js:279-288`: one added method. `minigame-data-schemas.json`: one added entry.
- `container-minigame.js`: the interactive type list gains one line (`:2433`). `sourceExtras()` (`:2220-2225`)
  returns the same objects as before for every existing source when no route is held; with a route it now
  also carries `sourceRoute`. I traced the four users (`childExtras` `:2204`, the notes `containerState`
  `:2504`, `takeItem` `:2705`, the notes stand-in `:2988`): `sourceRoute` rides on those stand-ins but
  `inventory.js:864-868` and `:1092-1094` pick `sourcePcId` / `sourceResourceId` / `transfer` by name, so
  nothing sends or stores it. The last `return { ...this.routeExtra() }` can only be `{}` (a route needs
  `loginPcId`, which sets `sourcePcId`).
- Merge with the core stream: at review time branch `ops-build` differs from `main` in only one of these
  files, `api-client.js` (a hunk at `:227`, 50 lines from ours): keep-both. See m10 for the two places that
  are rewrites of existing lines and would conflict if the core stream edits the same lines later.

## Check 5: UI rules

Good: no `innerHTML` with content anywhere in the module (only `c.innerHTML = ''`, `:145`); every server and
scenario string goes in by `textContent` (cells, caption, detail, filter options); the frame title goes
through the base class's `escapeHtml`. 2px borders, `border-radius: 0`, no blur or shadow. Computed in the
probe: font `GNF, monospace` at 16px on cells, selects, the input and the button (inherited from the page; the
CSS sets no family of its own, which is fine). The shared console frame gives the device frame and the X; Esc
closes through the base class. Filters, rows and REFRESH are keyboard reachable.

### F1 (major): long text does not wrap in its cell; it runs over the next columns
- Where: `CSS/ops-log-minigame.css:73-81` (`.ol-cell { white-space: normal; overflow-wrap: anywhere }`) against
  `CSS/log-filter-minigame.css:312-318` (`.lf-log-table td { white-space: nowrap; cursor: pointer; padding: 3px 6px }`);
  the table is given both class sets at `ops-log-minigame.js:215` (`ol-table lf-log-table`) and `:247`.
- Plan / rule: PLAN 5.2 (reuse log-filter's look) and the UI rule that long text wraps in its cell (check 5).
- What is wrong: `.lf-log-table td` (a class and a type) outranks `.ol-cell` (a class), whatever the load
  order, and `log-filter-minigame.css` is on the game page (`app/views/break_escape/games/show.html.erb:67`).
  Measured in headless Chromium with the page's CSS and this markup: every cell computes
  `white-space: nowrap`; with `table-layout: fixed` a 158px IDENTITY cell holds 534px of text, a 172px DETAIL
  cell 813px, and the row stays one line (26px) high, so the text is drawn across the neighbouring cells. A
  32-character typed username, a long place name or a four-key `detail` all do this. The same rule also
  flattens the `LOADING` / `NO ACCESS` cell's 14px padding and gives it a pointer cursor (`css:85-86` lose).
- Fix: drop `lf-log-table` and `lf-log-row` from the markup (the `ol-` rules already repeat every value those
  two rules give, so the look is unchanged and the viewer stops depending on a stylesheet another minigame
  owns), or scope the rules as `.ol-table .ol-cell` / `.ol-table .ol-message-cell`. Then prove it in a browser:
  a row with a 32-character identity and a long detail, asserting the cell's `scrollWidth <= clientWidth`.

### m1 (minor): the stylesheet link has no version stamp, and the "dusting does the same" precedent is not what it seems
- Where: `ops-log-minigame.js:21-28`.
- What: the page links every minigame sheet through `be_asset_path` (`?v=ASSETS_VERSION`); dusting's sheet is
  ALSO linked that way at `show.html.erb:33`, so its module link is a duplicate fallback, not the only load.
  The ops-log sheet is loaded only by the bare URL `/break_escape/css/ops-log-minigame.css`, so a browser that
  cached it keeps the old one after L2b changes it (L2b adds the flag button and confirm). It also arrives
  after the first render (a brief unstyled table on first open). Injection itself is safe: guarded by id, the
  module body runs once, so no double inject and nothing leaks on reopen.
- Fix: add the `<link>` to `show.html.erb` with `be_asset_path` in the L2a item 5 step and keep the module
  guard as a fallback (give the page's link `id="ops-log-css"` so the guard sees it), or remove the injection.

### m2 (minor): a failure that is not a refusal also reads NO ACCESS and throws the rows away
- Where: `ops-log-minigame.js:100-103`, `:123-131`.
- Plan: PLAN 5.2 "Any refusal shows NO ACCESS".
- What: a dropped connection, a 500 or an expired session (no `err.status`, or 5xx / 401) shows `NO ACCESS` and
  deletes the cached rows, telling the player a reached reader is refused. Fix: treat only 400 / 403 / 404 as a
  refusal; on anything else keep the rows held and show a plain status line (for example `NO SIGNAL - REFRESH`).

### m3 (minor): a reopen draws the cached rows before the server has said yes
- Where: `ops-log-minigame.js:67-75`.
- What: after the player loses the reader (signed out, session ended) a reopen shows the old rows for one
  round trip, then NO ACCESS. Nothing unearned is shown (the rows were read before), but it is not the plan's
  "opens with one LOADING row" and a refused reader briefly reads as open. Fix: keep the cache for the `rev`
  only and show LOADING until the answer, or accept and note it in the handover.

### m4 (minor): the hostile-string test covers `as`, the caption and one filter option only
- Where: `test/js/ops-log-viewer.test.mjs:226-246`.
- What: check 5 asks for each row field and the title. Asserted: the `as` cell and detail value, the caption,
  one LOCATION option. Not asserted: the `where`, `detail`, `event`, `result` cells, a hostile `at`, a hostile
  `id`, the other detail values. The source-text check (`:242-244`) does cover the module as a whole, so the
  risk is low. Fix: one loop over all six cells and all six detail values with a hostile value in every field.

### m5 (minor): a row id with a quote breaks the selector used to refocus
- Where: `ops-log-minigame.js:273` (`querySelector('[data-row-id="' + id + '"]')`).
- What: ids are server-made (hex, or `s1`), so this cannot happen today, but `cleanRows` accepts any string and
  a `"` would throw inside the click handler. Fix: keep a `Map` of id to row element, or `CSS.escape(id)`.

### m6 (minor): keyboard path through a long log
- Where: `ops-log-minigame.js:247-251`.
- What: every row is a tab stop (`tabindex="0"`), and REFRESH comes after the table, so with 200 rows it is 200
  Tabs away; `aria-selected` sits on a plain `tr` with no grid role. Fix: a roving tabindex (one row in the tab
  order, Up / Down move it), and put REFRESH before the table in tab order or give the table `role="grid"`.

### m7 (minor): dead and redundant CSS
- Where: `CSS/ops-log-minigame.css:3` (`.ops-log-fill`, set nowhere), `:126` (16px restated in the media rule).

## Check 6: lifecycle

Sound by reading. `cleanup()` bumps the epoch and aborts the request (`:78-82`); both the error path (`:101`)
and the answer path (`:105`) drop anything from an older epoch, so an answer after close changes nothing and
does not write the cache. A second REFRESH aborts the first. `ApiClient.get` passes the signal to `fetch`
(`api-client.js:10-13`). No timer exists. A reopen builds a new instance and reads the module cache. No
finding in the code; the tests do not cover any of it (m8).

## Check 7: registration and harness copy lists

Confirmed. The only file that gained an import is `minigames/index.js` (the new module). Three tests name it:
`patch-panel.test.mjs:531` and `social-authenticator-wiring.test.mjs:20` read it as text with `readFileSync`
and import nothing from it; `ops-log-viewer.test.mjs` is the new test with its own copy list (the two
`ops-log` files, stubs for the base class and `ApiClient`). `interactions.js`, `container-minigame.js`,
`api-client.js`, `game.js` and `lighting.js` gained no import. The builder's claim is right; plan L2a item 3's
"add the new module to the copy lists" of those two tests needs no edit.

One list the plan did not name:

### m11 (minor): `ops_log_terminal` is not a desk computer for seated reach
- Where: `JS/systems/interaction-reach.js:144` (`DESK_COMPUTER_TYPES` holds `log_filter_terminal`, not the new type).
- What: the new type uses the same desk-terminal art; a seated player reaches a `log_filter_terminal` in front
  of them at its footprint and will not reach an `ops_log_terminal` the same way. Not in the plan's file list,
  so the builder was right not to touch it; raise it with the orchestrator. Fix: add the type to the set.

## Check 8: tests

Section 11's list (PLAN:656-662) against the file:

| Named test | Covered | Would fail if broken |
|---|---|---|
| columns | `:93-102` | yes |
| filters from rows present, TIME on `HH:MM` and `Tue 07:42` | `:141-170`, `:172-180` | yes |
| selection kept across a refresh | `:182-200` | yes (not the scroll or focus, F3) |
| flag button only with an anomaly | L2b; `:213-224` asserts none exists | n/a in L2a |
| no row tinted | `:213-224` | yes (class and CSS-text checks) |
| LOADING, NO ACCESS, unchanged | `:104-121`, `:123-139` | yes for the rows; cannot see a re-render (m8) |
| textContent with a hostile typed username | `:226-246` | yes for `as` (m4 for the rest) |
| merged count and `+` as the answer carries it | `:248-255` | yes |
| reader opened from a desktop through `handleInteractiveItem` asks for its own id with the route | `:263-277`, `:314-331` | NO, see F5 |

### F5 (major): the container path is not exercised for either type; two links of the chain can break with every test green
- Where: `test/js/ops-log-viewer.test.mjs:263-277`, `:290-312`, `:314-331`.
- Plan: PLAN:660-662 ("a reader opened from a desktop through `handleInteractiveItem` requests its own
  `scenarioData.id` with the screen's route") and PLAN:496-499 (check 5: "a `log_filter_terminal` in a room and
  in a container still opens `log-filter` with the same arguments").
- What is wrong: the test at `:263` hands the viewer a made-up sprite that already has `sourceRoute`; the
  test at `:314` runs `sourceExtras()` alone; the container side is otherwise one regex on the type list
  (`:316`). Nothing runs `handleInteractiveItem`, so nothing proves its stand-in carries `childExtras()` (and
  so `sourceRoute`) or a `temp_` id, for the reader or for log-filter. And the `interactions.js` test never
  asserts that the branch passes `sprite` on: `:300` builds a `sprite` that is never given to `run`, and
  `assert.ok(sprite)` at `:306` cannot fail. Delete `sprite` from the `startMinigame` call at
  `interactions.js:1644` and every test passes while every reader in play reads NO ACCESS (no id).
- Fix: (1) in the `interactions.js` test pass a sprite with a `temp_` `objectId` and a `sourceRoute`, and
  assert `started[0][2].sprite` is that object for both types; drop the dead `sprite` and `assert.ok`. (2) Run
  the real `handleInteractiveItem` body (sliced as the other source tests do, with a fake
  `window.handleObjectInteraction`) for an `ops_log_terminal` and a `log_filter_terminal` item on a desktop
  with `remote: { footholdId }`: assert the stand-in's `scenarioData` is the item, its `objectId` starts
  `temp_`, and `sourceRoute` is `{ foothold }`; then feed that stand-in to the viewer and assert the request's
  id and route. (3) For log-filter, assert the arguments equal those from a room.

### m8 (minor): tests that cannot fail, and gaps
- `:306` `assert.ok(sprite)`: always true (see F5).
- `:123-139` "unchanged keeps the rows": passes whether or not the view is rebuilt; add an element-identity
  assertion (F3).
- No lifecycle test (check 6): add one where the answer resolves after `cleanup()` and assert no render and
  no cache write, one where a second REFRESH's answer arrives before the first's, and one that the signal
  given to `logRows` is aborted on close.
- No test that a non-refusal failure is handled (m2), none for a stale filter (F4), none for `relay` (F2).
- `:344` `assert.ok(schemas.log_filter_terminal)` does not show the entry is unchanged; compare its key lists.
- The FakeEl `matches` only understands `[a="b"]`, `.class` and a tag, so a selector fault (m5) is invisible.

## Other observations

### m9 (minor): the RESULT filter matches the whole text, so `FAIL` does not find `FAIL x3`
- Where: `ops-log-rows.js:92-98`, `:108`; pinned by the test at `:253-254`.
- Plan: PLAN 5.2 says "RESULT ... as the values present" and does not say whether the count is part of the
  value; PLAN:13-14 ("Failed attempts are visible") is the aim. A player who picks `FAIL` loses the merged
  failures, the rows the lesson is about. Suggest: options are the result word (text before ` x` / `+`), the
  cell still shows the full text. This is a design call: ask the orchestrator. It also removes most of F4.

### m10 (minor): two edits are rewrites of existing lines, not additions
- Where: `container-minigame.js:2222-2224` (two existing `return` lines changed, one replaced);
  `lighting.js:441` (the one long emitter regex).
- What: fine against today's `ops-build`, but either conflicts if the core stream edits the same lines (a new
  screen type in the regex is likely). An additive form for the first: leave `sourceExtras()` as it was and add
  one line in `childExtras()` (`Object.assign(extras, this.routeExtra())`), which is the only caller a reader
  needs; that needs a plan note, since PLAN:299-301 and :498-499 name `sourceExtras()`. The lighting line has no
  additive form; tell the integrator to expect it.

### m12 (minor, question): `minigameData.title` is in the schema and unused
- Where: `scripts/minigame-data-schemas.json` (the new entry), `ops-log-minigame.js:46`.
- What: the plan lists `title` as optional (PLAN:171) and as a reader field (PLAN:388) but 5.2 gives the frame
  the object's `name` and the caption the source's `title`; the viewer never reads `minigameData.title`. Either
  use it (frame title before `name`) or say in the docs that it is not shown. Ask the plan owner.

## Checks completed

All eight. Not done: nothing was played in a browser beyond the one CSS probe; F3 is reasoned from the code.

---

## R1 outcomes (fixer, 2026-11-23)

Commits: W = `e262b6848` (wiring), V = `5f07c654b` (validator), M = `140aef76e` (viewer, CSS, tests). The plan's
route line (308) gained `&relay=1` and the viewer handover gained an "R1 changes" section in the commit that
holds this table.

| Finding | Outcome |
|---|---|
| F1 | Fixed, M. `lf-log-table` / `lf-log-row` dropped from the markup. Headless probe (long 32-char identity, long detail, 900px table): before, every cell `white-space: nowrap`, IDENTITY 165px holds 313px, LOCATION 294, DETAIL 726 over 183 (5 cells overflow, rows 26px high); after, `normal`, `scrollWidth == clientWidth` in all 6 cells, rows wrap to 98px; LOADING cell padding 3px/cursor pointer before, 14px/default after. |
| F2 | Fixed, W (plus M tests). `logRows` sends `relay=1`; `routeExtra()` returns `{ relay: true }` for a relay desktop and derives the route for a folder from its source PC's session; cache key has relay; plan line 308 gained the param. |
| F3 | Fixed, M. Unchanged answer renders nothing; click moves the mark between existing rows; filters, table frame and status bar built once; scrollTop and the focused row restored on a changed answer. Mutation-proved. |
| F4 | Fixed, M. `pruneFilters` clears a select filter whose value left the options; the select reads ALL. Test. |
| F5 | Fixed, M. Tests run the real `handleInteractiveItem` (sliced) for both types on foothold, from, relay and walk-up desktops, feed the stand-in to the real interactions branch and the viewer; log-filter arguments compared with a room's. Mutation-proved. |
| m1 | Fixed, W. Link in `show.html.erb` with `be_asset_path`, `id="ops-log-css"`; module guard kept as fallback. |
| m2 | Fixed, M. Only 400/403/404 read NO ACCESS; anything else keeps held rows and shows `NO SIGNAL - REFRESH` (or the same message row if nothing is held). Test. |
| m3 | Accepted as the review's option, no code change: a reopen draws the cached rows for one round trip, then NO ACCESS if refused. Rows were earned earlier. Noted in HANDOVER_L2a_client_fix.md. |
| m4 | Fixed, M. One test with a hostile value in all seven fields, the title and a second event. |
| m5 | Fixed, M. A Map of id to row element replaces the selector; test with `a"]b`. |
| m6 | Fixed, M. Roving tabindex (one row in the tab order, Up/Down move it), `role="grid"` and row/cell roles. Test. |
| m7 | Fixed, M. `.ops-log-fill` and the restated 16px rule removed. |
| m8 | Fixed, M. Lifecycle tests (answer after close, stale answer, abort on close), non-refusal, stale filter, relay, unchanged-identity, log_filter_terminal schema key lists compared, dead `assert.ok(sprite)` gone. The FakeEl selector limit no longer matters (no selector from ids). |
| m9 | Fixed, M. RESULT options and filter use the result's word; the cell still shows `FAIL x3`. Test. |
| m10 | Not changed, needs the integrator: the additive form (a line in `childExtras()`) is outside the fixer's file list (`sourceExtras()` / `routeExtra()` only) and the plan names `sourceExtras()`. The two rewritten `sourceExtras()` returns and the `lighting.js` regex are the lines to expect in a merge with the core stream. |
| m11 | Fixed, W. `ops_log_terminal` in `DESK_COMPUTER_TYPES`. |
| m12 | Fixed, W. `title` removed from the schema entry (test updated). The validator then rejects the undeclared key in `scenarios/test_ops_logs/scenario.json.erb`, so the one `"title": "Sign-in audit"` in that reader's `minigameData` was removed there too (the server's logSource title is unaffected). |
| validator sprite exemption | Fixed, V. `ops_log_terminal` exempt like `capture_log`; new node test (3 cases; 2 fail on the old validator); `test_ops_logs` validates with 0 errors. |
