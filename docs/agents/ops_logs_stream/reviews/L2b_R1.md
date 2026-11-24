# Ops log L2b: review R1 (server and client, code against plan)

Reviewer: read-only. Branch `ops-logs`, commits `1bed4cf2e`, `e894aeef2`, `93cff8c26`, `ba8adf534`, `5927c8f22`, `e1829f45a`, note `eb83cc71b`.
Plan as planned: `main:docs/achitechture/OPS_LOG_ROWS_PLAN.md`. Plan as the builder left it: the same file at the branch head.

Status: complete (all ten checks done; see "Not checked" for what was not run).

## The departure: where the flag is judged

### (a) What the plan said before this stage

`main:docs/achitechture/OPS_LOG_ROWS_PLAN.md` (the plan as L2a landed), section 7, lines 388-391, quoted whole:

> **The reader's own fields reach the browser with its room or container**, as log-filter's do:
> `minigameData.logSource` (a raw source id), `anomaly.rowId`, `flagActionLabel`,
> `flagActions` and `completionActions`. The flag is checked on the client, best effort, the same
> standing as log-filter's anomaly today; a server check belongs to the investigator work (4.2).

Section 5.2, lines 283-286 (the viewer):

> The flag button appears only when the source has an `anomaly`.
> Flagging the anomaly row opens a confirm and then runs `flagActions` and `completionActions`
> through the same global-setting path log-filter uses (`_executeActions`, `:1369`); any other row
> gets "not this one" feedback. No row is ever tinted.

Section 3, line 95 (the stage): "L2b | Seed rows, `anomaly.rowId`, the flag flow and its actions; validator checks on seed rows; the dungeon graph note node. | S". Section 12, lines 748-749: "`anomaly.rowId` and the flag flow in the viewer". Section 6 lists one route, `GET /log_rows`; section 8's state table has five keys and no flag key; section 12's shared-file table has no second route.

So the plan was explicit, in three places: the anomaly's row id and both action lists ARE in the browser, the client checks the flag, the standing is "best effort", the stage is size S and is "in the viewer". A server check was named and deliberately deferred ("belongs to the investigator work").

What the branch changed in the plan (`git diff main ops-logs -- docs/achitechture/OPS_LOG_ROWS_PLAN.md`, 2 added lines, nothing removed): one paragraph after line 391, "**L2b ruling (2026-11-23, orchestrator): the flag is judged on the server.** ... This replaces the sentence above." The old sentence is still there above it; section 5.2 lines 283-286, section 6, the section 8 state table, section 11's test list and the section 12 shared-file table were NOT updated, so the plan now contradicts itself in five places (finding D-1). The stream brief's "Decisions" has no entry for this ruling either: the only record is the builder's paragraph, which attributes it to the orchestrator.

### (b) What section 7 and "a play row cannot be a puzzle's anomaly" imply

Neither implies the row id must be kept from the browser.

- Section 7's concern is what a ROW tells the player (stored fields, secrets, card holders, raw ids). Its last paragraph then says in plain words that the reader's own fields, `anomaly.rowId` among them, ship. A seed row's id is authored text (`s1`), already sent in every `GET /log_rows` answer (line 360: "seed rows: their authored id (`s1`)"). The id is not a secret, a key or a credential by the plan's own list (13.3 registers passwords, credential values, PINs, lock codes, key material).
- "Nothing may gate on a play row" (section 8, lines 413-414; 4.2 lines 175-176) is about STABILITY, not secrecy: a play row's id "is not stable across games" and the row "can be dropped by its own source's cap". It rules out a play row as the target; it says nothing on where the comparison runs. The server-judged build keeps this rule (`ops_log.rb:431-441` accepts only a seed row id), and a client check would keep it just as well (the validator already errors on a `rowId` that is not a seed row).

### (c) What log-filter does, and the cheat policy

- `public/break_escape/js/minigames/log-filter/log-filter-minigame.js` is client-checked throughout: the whole `anomaly` object, `flagActions` and `completionActions` are read from the object's scenario data in the browser (`:194`, `:206-207`), the anomaly row is decided by `_isAnomalyEntry` in the browser (`:676-679`) and even gets a CSS class before any flag (`lf-anomaly-row`, `:687`). Two campaign missions use it that way.
- The policy (`docs/agents/OPS_LAYER_BRIEF.md:49-50`): "the server hard-enforces secrets, keys, credentials and forged items. Steps gated only by dialogue, and tailgating, may stay best-effort with a sanity check." Which row of a displayed log "looks wrong" is none of secrets, keys, credentials or forged items; it is a reading-comprehension step, the same class as a dialogue-gated step. The policy does not ask for it to be server-judged. (Where the project DOES want a server-enforced outcome it has a mechanism: `creditOnPass`, `server_credit_global_names` and `server_completed_only_task_ids`, `game.rb:348`, `:947`, `:5426-5428`: the server writes the global and completes the task itself, and refuses the client's own write.)

### (d) What the server-judged design costs, and whether it is built soundly

Cost: a new route (`config/routes.rb:62`), a new action (`games_controller.rb:1934-1960`), one entry in each of the two shared controller lists (`:30`, `:107`), a policy method and a role-test entry, a new `player_state` key `opsLogFlagged` (`ops_log.rb:458-459`) that the plan's section 8 does not list, a strip call at three filter sites in two shared files (`games_controller.rb:2985`, `game.rb:1933`, `:7379`), `ApiClient.logFlag`, about 100 lines of viewer state for an async answer, a 304-line controller test, new leak-check rules. Roughly half of this stage's server diff exists only for the departure.

Soundness. The route itself is carefully built: reach is the same helper as `GET /log_rows` (`reached_log_reader`, `:3240-3249`), one 404, one wrong body, nothing written for a wrong flag, the lock is held, the state is bounded and not a sync section. But the DESIGN stops half way, and that leaves it worse than either clean choice:

1. **It enforces nothing.** The server judges the row and then hands `flagActions` and `completionActions` back for the BROWSER to run (`games_controller.rb:1953-1957`; `ops-log-minigame.js:483`, `:495-505`). The global is set by an ordinary client write and the task by an ordinary `POST /complete_task`. Neither is server-owned: the flag's globals are not in `server_credit_global_names`, its tasks are not in `server_completed_only_task_ids`. A forged client that never touches `/log_rows/flag` can `PUT /sync_state { globalVariables: { found_night_swipe: true } }` or `POST /complete_task { taskId }` and get the same outcome; the server never consults `opsLogFlagged` for anything but the `already` answer and `flaggedRow`. So the outcome is best-effort exactly as in the plan; only the row id is hidden.
2. **What it hides is found in at most N free requests.** There is no attempt cap (rightly: the plan's "not this one" feedback is free guessing), every wrong flag answers at once, and a source has at most 100 seed rows (four in `test_ops_logs`). A script, or a patient player clicking FLAG and CONFIRM down the list, finds the row. Hiding the id from the page source stops only the player who would open devtools but not click each row. That is a small gain, and it is not what "hard-enforce" means in the policy.
3. **It adds a way to lose progress that the plan's design does not have (finding F-1, major).** The actions are delivered exactly once, in the answer to the first right flag. If that answer is lost (the tab closes, the network drops, the page reloads between the server's `save!` and the client's `_runActions`), the server has recorded the flag, every later flag answers `already` with no actions, and after a reload the viewer shows `FLAGGED` and offers no control (`ops-log-minigame.js:439-442`). The global is never set and the task never completes; only a mission reset recovers. With the client check the actions sit in the browser and can always be run again.

### Recommendation

**Go back to the plan's client check for L2b**, and leave the server check to the investigator work where the plan put it. Reasons: the plan chose this on purpose and names where the server check belongs; the policy does not require it for this kind of step; the build as it stands gives obfuscation, not enforcement (points 1 and 2), at the price of a route, a state key, strip calls in two shared files and a soft-lock (point 3); and the stage was sized S.

If the user prefers to KEEP a server-judged flag, it should be finished, not left half way: the server applies the actions itself in the same save as the flag (set the globals in `player_state`, complete the tasks with `trusted: true`, answer them as `serverGlobals` / `serverCompletedTasks` the way `creditOnPass` does), the flag's globals and tasks become server-owned so a forged sync or `/complete_task` is refused, and the answer to a repeat flag and to `GET /log_rows` after a flag carries enough for the client to catch up. That is a bigger piece than L2b, it needs a plan section, and it is the investigator work in all but name. The decision also needs a line in the stream brief's Decisions, and the plan's sections 5.2, 6, 8, 11 and 12 brought into line (D-1).

What going back to the client check takes (a deletion, mostly):

- Remove: the route (`config/routes.rb:62`), `log_flag` and its two list entries (`games_controller.rb:30`, `:107`, `:1927-1960`), `log_flag?` (`game_policy.rb:65-67`) and the `policy_test.rb` entry, `OpsLog.strip_reader_judgement!` and its three call sites, `ops_log_anomaly_id`, `ops_log_flagged?`, `ops_log_flag!`, `MAX_FLAGGED`, the `flaggedRow` merge in `log_rows` (`:1923-1925`; `reached_log_reader` may stay as a tidy extraction or be inlined back), `ApiClient.logFlag`, the plan's added paragraph, the flag half of `log_seed_flag_test.rb` (keep the five seed-row tests), the leak check's flag and strip rules (keep the seed-row shape rules and R4-1, R4-2).
- Change in the viewer: `_flaggable` becomes "`anomaly.rowId` is a string"; CONFIRM compares `row.id === anomaly.rowId` locally; a right flag runs `flagActions` then `completionActions` from `minigameData`; the `sending` and `error` states go. "Flagged before" on reopen has no server answer to read: follow log-filter (`:221`, `:281`), which treats the first `set_global ... true` in `completionActions` (else `flagActions`) as the done-marker and reads it from `gameState.globalVariables`. A reader with no such action simply offers the flag again, and its actions are idempotent.
- Keep as built: seed rows in the reader, the validator checks, the schema, the graph node, the scenario's `night_log`, the "no row marked before a flag" DOM tests (still worth having: the viewer must not tint the anomaly as log-filter does).
- Docs: A24 "Server enforces / client only" and "Known limits" reworded to "client-checked, best effort, as the log filter"; PLAYTEST beats 16 to 18 no longer wait on a request.

Line-number note for the section above: the action runner call is `ops-log-minigame.js:481` (not `:483`), `_runActions` is `:494-505`, the "nothing more to offer" branch is `:439-442`.

## Findings

How each was checked: by reading the code at the branch head (`eb83cc71b`) and the tests; the three node files were run (`ops-log-viewer`, `validator-log-sources`, `dungeon-graph-ops-logs`: all pass). No Ruby test was run by this review and no request was sent to the playtester's live server; requests below are read from the code and the tests, and are marked "from code".

### F-1 (major) A right flag whose answer is lost can never run its actions: the puzzle soft-locks

- Where: `app/controllers/break_escape/games_controller.rb:1950-1958` (`:correct` saves, then answers the actions; `:already` answers none); `app/models/break_escape/ops_log.rb:452-461`; `public/break_escape/js/minigames/ops-log/ops-log-minigame.js:476-481` (actions run only when `already !== true`), `:439-442` (once `_flaggedId` is set no control is offered), `:139` (`flaggedRow` from `GET /log_rows` sets `_flaggedId` after a reload). Pinned as intended by `test/js/ops-log-viewer.test.mjs` "flag: an already-flagged answer marks the row and runs no action" and `log_seed_flag_test.rb` "a right flag answers the actions once, a repeat answers already and no actions".
- Plan line: 5.2 lines 284-286 ("Flagging the anomaly row ... runs `flagActions` and `completionActions`"); in the plan's design the actions are in the browser and can always run.
- What is wrong: the server records the flag and delivers the actions exactly once, in one HTTP answer, and the BROWSER must then apply them. Sequence (from code): `POST /log_rows/flag { object_id: "night_log_pc", row_id: "s3" }` reaches the server, `opsLogFlagged` is saved; the tab is closed, reloaded or loses its connection before the answer is handled (the viewer's own `catch` at `:466-472` shows `NO SIGNAL - TRY AGAIN`). The retry answers `{ correct: true, already: true, rowId: "s3" }`: the row is marked, no action runs. After a reload `GET /log_rows` carries `flaggedRow: "s3"`, the viewer shows `FLAGGED` and no button. `found_night_swipe` is never set and `l3_flagged_night_swipe` never completes. Only a mission reset recovers. A second smaller window: the actions run but the global's sync or the `/complete_task` post has not reached the server when the page reloads; same end state.
- Fix: depends on the departure's ruling. Client check (recommended): the problem goes away. Server-judged kept: the server applies the actions in the same `save!` as the flag (the `creditOnPass` pattern, `serverGlobals` / `serverCompletedTasks` in the answer), or, as the least change, a correct flag ALWAYS answers the actions (they are idempotent: `set_global` to the same value, `completeTask` on a completed task) and `GET /log_rows` with `flaggedRow` lets the viewer run them again on open. Add a test for the lost-answer path either way.

### D-2 (major) The server-judged flag does not protect the outcome it was added to protect

- Where: `games_controller.rb:1953-1957` (the actions are answered to the client); `ops-log-minigame.js:494-505` (`set_global` through `npcManager.setGlobalVariable`, `complete_task` through `objectivesManager.completeTask`); `app/models/break_escape/game.rb:938-960` (a client sync may write any global that is not imported, worn or a credit global) and `:5426-5428` (only `server_completed_only_task_ids` tasks refuse a client completion; `custom` has no check in the `case` at `:5434` on).
- Plan line: the builder's own ruling paragraph (head, after line 391) and the stage aim "cannot be completed by a forged request".
- What is wrong, with the requests (from code, on `test_ops_logs`, office open, no flag ever sent): `POST /break_escape/games/:id/complete_task { "taskId": "l3_flagged_night_swipe" }` completes the task (the task id is in the objectives the browser already holds); `PUT /break_escape/games/:id/sync_state { "globalVariables": { "found_night_swipe": true } }` sets the global (its name is hidden from the reader object now, but a mission that reads the global in ink, an objective or a lock ships the name there). `opsLogFlagged` is consulted by nothing but the `already` answer and `flaggedRow`. And the hidden row itself falls to at most N wrong flags, N <= 100 (four here), each free and immediate: `POST /log_rows/flag { row_id: "s1" }`, `"s2"`, ... So the route buys only "the row id is not readable in devtools".
- Fix: the departure's ruling. Either go back to the client check and call the step best-effort as the plan does, or finish the server design (server applies the actions; the flag's globals join the credit-global list and its tasks the server-completed-only list, derived at game creation as `completed_only_task_ids_in` does for `creditOnPass`). Do not land the half-way form.

### D-1 (minor) The plan contradicts itself and the ruling has no entry in the stream brief

- Where: `docs/achitechture/OPS_LOG_ROWS_PLAN.md` at head: lines 388-391 still say the fields ship and the client checks; the added paragraph at 393 says the opposite and "replaces the sentence above"; 5.2 lines 283-286 still describe the client flow; section 6 lists no `POST /log_rows/flag`; the section 8 table has no `opsLogFlagged`; section 11 names no flag-route test; the section 12 shared-file table (757-767) has no second route, `game_policy.rb` or `policy_test.rb` line for it. `docs/agents/OPS_LOGS_STREAM_BRIEF.md` "Decisions" has no L2b entry.
- Fix: after the user rules, either delete the paragraph (client check) or rewrite all six places and add the decision to the brief with its date and who made it.

### F-3 (minor) `opsLogFlagged` is undocumented where the other keys are listed

- Where: `ops_log.rb:15-21` (the header lists five `player_state` keys, not this one); plan section 8 table. `MAX_FLAGGED = 100` with `.last(100)` (`:459`) silently drops the oldest reader past 100, after which that reader's flag answers the actions again; harmless (idempotent) but unsaid.
- Fix (if the key stays): add it to the header and the plan table with shape, bound, writer, "never sent"; say what the cap does.

### F-4 (minor) Focus is lost after a right flag

- Where: `ops-log-minigame.js:482-485`: `_renderTable()` and `_renderDetail()` rebuild both panes; the focused CONFIRM button is removed and nothing is focused (the wrong path refocuses the flag button at `:490`; the right path does not).
- Rule: S1 client R1 ruling m4 (core brief, decisions): "focus stays on the control's row (or the next control)". Keyboard players land on the document body.
- Fix: focus the flagged row (`this._rowEls.get(this._flaggedId)`) after the re-render.

### F-5 (minor) "NOT THIS ONE" can appear on a row that was not flagged

- Where: `ops-log-minigame.js:390` (`_select` leaves `_flagState` alone while `sending`), `:487-490` (the answer sets `wrong` and re-renders the detail of whatever row is selected NOW).
- What is wrong: select `s1`, CONFIRM, click `s3` before the answer returns; the wrong answer for `s1` draws `NOT THIS ONE` under `s3`, the real anomaly. The player is told the right row is wrong.
- Fix: remember the row id the flag was sent for; on the answer, show the note only if that row is still selected, else return to `idle`. Add a viewer test.

### F-6 (minor) The `unchanged` answer and `rev` ignore the flag state

- Where: `games_controller.rb:1919-1925`: `flaggedRow` is merged only into a full answer; `rev` is over title and rows (`ops_log.rb:297-299`). A viewer holding a current `rev` from before a flag made elsewhere (a second tab) gets `{ rev, unchanged: true }` and still offers the flag; a flag then answers `already`. Cosmetic, self-healing. Fix (if the route stays): add `flaggedRow` to the unchanged answer when set, or leave and note it in A24 "Known limits".

### S-1 (minor) A seed row is shown from the snapshot with no bound of its own

- Where: `ops_log.rb:415-426`, `:492-513`. `at` and `result` are shown as authored (any string, any length), `id` is not held to `^s[0-9]{1,3}$`, a non-NPC `as` on a non-`signin_*` row is shown as text, a detail value is `value.to_s`. The validator refuses each of these (`validate_log_rows.rb`, `log_check_seed_rows`), and the comment at `:413-414` says a snapshot is not re-validated. Authored text only, so no secret or player text is at stake; the risk is a hand-edited or older snapshot drawing an odd row.
- Plan line: 4.2 lines 154-157. Fix (optional): in `ops_log_seed_rows` also require the id and `at` patterns and a result the event allows, skipping the row otherwise, as it already skips an unknown event.

### V-1 (minor) The schema caps a seed row's `as` at 32, an NPC id may be 40

- Where: `scripts/scenario-schema.json` `seedRows.items.properties.as` (`"maxLength": 32`); the validator allows stored ids up to 40 (plan section 9, line 436) and `log_check_seed_as` accepts any known NPC id. A seed row naming an NPC whose id is 33 to 40 characters fails the schema and passes the validator.
- Fix: `maxLength: 40` with the description saying a username is at most 32 (the validator checks that).

### T-1 (minor) The rev test does not show that a seed row changes the rev

- Where: `log_seed_flag_test.rb` "the rev changes with a seed row and not with the unchanged answer": it compares the revs of two readers of two sources with different titles; it would pass if seed rows were left out of the digest. Plan line 337-340 ("a change to a seed row ... also changes it").
- Fix: build the same game twice with one seed row's `at` changed and assert the revs differ.

### T-2 (minor) The strip is tested for the bootstrap and a room only

- Where: `OpsLog.strip_reader_judgement!` is called at three sites (`games_controller.rb:2985` in `filter_requires_recursive`, `game.rb:1933` in `filter_inventory_for_client!`, `game.rb:7379` in `filter_requires_and_contents_recursive`). `log_seed_flag_test.rb` "the browser copy of a reader holds no anomaly row and no flag actions" reads `/scenario` and `/room/lobby`. No test reads a reader inside a sign-in desktop (`/login` or `/container` answer; the fixture `r_desktop` exists in another test) or one held in the inventory, so removing the inventory-site call fails nothing.
- Fix (if the strip stays): assert on the `/login` answer for `r_desktop`, and on a reader placed in `startItemsInInventory`.

### L-1 (minor) The leak check's "right flag seen" is run-wide, not per reader

- Where: `tools/playtest/lib/access_leak_scanner.rb`, `@log_flag_right` (set in `scan_log_flag`, read in the `flaggedRow` rule). After a right flag on one reader, an early `flaggedRow` on ANOTHER reader is not reported; `log_anomalies` is keyed by source, so two readers of one source with different anomalies overwrite each other.
- Fix: key both by the reader's `object_id` (the flag request's body is not in `ctx` today: carry it, or key on the `rowId` the right answer names and compare with `flaggedRow`).

### P-1 (minor) PLAYTEST beat 17 claims more than can hold

- Where: `scenarios/test_ops_logs/PLAYTEST.md`, beat 17: "Until this flag, no captured response holds `found_night_swipe` or `l3_flagged_night_swipe`". The task is an authored objective (`scenario.json.erb`, `"taskId": "l3_flagged_night_swipe"`), so the bootstrap's objectives and any `/objectives` answer hold that id from the start (from code; `ops_logs_scenario_test` asserts its absence from the OFFICE ROOM answer only). A tester following the beat to the letter reports a failure.
- Fix: say "no reader object holds", or drop the task id from the sentence.

## Checks with no finding

1. **Seed rows in the reader.** Seed rows first, then play rows (`ops_log.rb:406-409`); `at` in place of `elapsedMs`, same seven keys in the same order (`:492-503` against `:476-486`); built by their own path, never through `hide_holder` or `flagged` (tested with a seed row authored with `detail.flagged`); detail goes through the same `ops_log_client_detail`, so a `show: false` key is never shown; `where` and an NPC `as` go through `ops_log_client_thing` (kind word, never the raw id); a username through `normalise_username`. Seed rows are not stored, so no cap, merge or eviction touches them and they evict nothing (plan 13.2 step 6, line 960); the first 100 are read. Secrets: the plan's rule for authored text is the validator's (line 443-444), built and tested. A seed row's id IS told apart from a play row's (`s3` against ten hex characters): that is the plan's line 360, not a leak, and it means the anomaly is known to be one of the seed rows. Among seed rows nothing differs.
2. **Nothing identifies the anomaly before a right flag.** `GET /log_rows` rows: same keys, same order, authored order, no index, `rev` the same before and after a flag (tested). The reader object: `anomaly: {}` tells that the reader HAS an anomaly, which the plan intends ("The flag button appears only when the source has an `anomaly`", line 284). Viewer DOM: no class or attribute on any row until `_flaggedId` is set from a server answer. The comparison is constant-time on equal lengths (`ops_log.rb:454-455`); a right flag does a `save!` and a wrong one does not, so the two differ in time, which matters to nobody since the answer itself says so.
3. **`POST /log_rows/flag`.** Order: authorize, 400 on `object_id`, 400 on `row_id`, the one 404 from the same `reached_log_reader` as the GET (unreached room, lock on the path, session gone, invented id, non-reader, undeclared source), then the judgement. One wrong body for an invented id, a play row, another source's row, a non-anomaly seed row, a reader with no anomaly (tested, with unchanged `player_state` and `updated_at`). No attempt cap: the plan's free guessing. No log row is written for a flag: the plan registers no event for it. In `set_game` and `with_game_lock`; route, `log_flag?` and the role test present. State: `opsLogFlagged`, server-only, at most 100 strings, not accepted from a sync body (tested), dropped by a reset (not on the preserved-keys list).
4. **The viewer.** One control, on the selected row's detail; states idle, confirm, sending, wrong, error, done; all text through `textContent`, the author's `flagActionLabel` included (40-character cap); real `<button>` elements, CONFIRM focused on open; CSS has 2px borders and no rounded corners. The rewritten L2a test keeps its no-tint half (it still asserts no marked row with and without an anomaly; only the "no flag button" line went).
5. **Validator.** Every section 9 seed-row and anomaly error has a node test (unknown event, result, detail, `as`, `where`, bad `at`, not ascending, after the start, repeated id, over 100, a declared secret, an anomaly that is not a seed row); two extra warnings (single seed row, an event the source does not record) are tested. `validator-log-sources` passes.
6. **Scenario and tests.** `night_log` and `night_log_pc` are a fair addition; the one edited assertion (`logSources.keys`) had to change; the anomaly is a real reading puzzle (one swipe at 23:58 among office-hours swipes). Beats 14 to 19 use the viewer's real controls and send no forged request. The hostile cases in `log_seed_flag_test.rb` assert status, body and unchanged state and can fail.
7. **Leak check.** R4-1 (detail keys found by a word before `:` or `=`) and R4-2 (hidden keys read from the registry) are done; the new rules are exercised through the real routes in `ops_logs_scenario_test` ("the leak scanner judges a whole night-log run clean, and finds the row named before the flag").
8. **Unchanged scenarios.** A source with no `seedRows` adds no row and no key, so its rows and `rev` are as before; `flaggedRow` is absent without a flag; the strip touches only `ops_log_terminal` objects. `git diff --stat main ops-logs -- public/break_escape/js/minigames/log-filter/` is empty, as are `scenarios/sis01*`, `scenarios/sis02*`, `js/systems` and `js/core`. The graph draws no note node without `logSources` (tested). The graph adds no edge for the flag's actions; the generator draws none for any object's `completionActions` (no such code in `generate_dungeon_graph.rb`), so plan line 466-467 ("the same edges any other object with those actions gets") is met with none.

## Merge readiness: hunks that rewrite or reorder existing lines in shared files

Pure additions (keep-both merges): `games_controller.rb:30` and `:107` (one new line in each list), `:2985`; `game.rb:1933`, `:7379`; `config/routes.rb:62`; `game_policy.rb:65-68`; the `when 'note'` and `classDef note` lines and the new block in `generate_dungeon_graph.rb`.

Rewrites of existing lines:

- `app/controllers/break_escape/games_controller.rb` `log_rows`: old lines 1913-1920 (the eight-line reach check) replaced by three lines calling `reached_log_reader`, and `render json: answer` (old 1925) replaced by the `flaggedRow` form. This stream's own action; a conflict only if the core stream edits `log_rows`.
- `test/unit/break_escape/policy_test.rb:125`: `... inventory? log_rows?].freeze` became `... log_rows?` plus a new line `log_flag?].freeze`. The core stream appends to the same `DEVICE_ACTIONS` list: expect a conflict here.
- `scripts/scenario-schema.json:344`: the `maxRows` line gained a trailing comma (JSON leaves no choice). A conflict if the core stream adds a property after `maxRows`.
- `scripts/generate_dungeon_graph.rb` old line 2041: the `net_notes << ... link ...` line gained `&& !e[:log]`.
- `tools/playtest/lib/access_leak_scanner.rb`: old 410 (the `'log_row'` description), 805 (`log_rows:` gained a comma and a `log_flag:` line), 1959 (`LOG_ANSWER_KEYS`), 1961 (`LOG_STORED_ONLY_KEYS`), 1998 and 2000 (the detail-key comment and split), 2012 and 2022 (`LOG_STORED_ONLY_KEYS` became `log_stored_only_keys`).
- `docs/ACCESS_AND_NETWORKS.md`: line 55 (the A24 read-side index row), 705, 712, 717, 725 (Key fields and Known limits of the two A24 entries) rewritten in place; the new A24 entry is an addition. `README_scenario_design.md:1030` (the A24 index row) rewritten.

Going back to the client check removes the `policy_test.rb`, `game_policy.rb`, `routes.rb`, both controller-list and both `game.rb` hunks, and most of the scanner's.

## Not checked

- No Ruby test was run by this review (the handover reports 373 runs, 0 failures, and 12 golden runs; not repeated). No live request, no browser run.
- `test/unit/access_leak_scanner_log_rows_test.rb` was not read line by line; the scanner was judged from its code and the scenario test that drives it.
- The regenerated `dungeon_graph.*` files were not compared with a fresh generation.

## Severity count

- Blocker: 0
- Major: 2 (F-1, D-2), both arising from the departure
- Minor: 11 (D-1, F-3, F-4, F-5, F-6, S-1, V-1, T-1, T-2, L-1, P-1)

## Verdict

Not ready to land as built. Everything outside the flag's judging (seed rows in the reader, the validator, the schema, the graph node, the scenario, the viewer's look and "no row marked early" rule) follows the plan and is sound. The flag's judging departs from the plan in a half-way form that enforces nothing and can soft-lock a puzzle (F-1, D-2). The user should rule on the departure first. Recommended: return to the plan's client check, which removes both majors and most of the shared-file hunks, then a short delta review. If the server-judged flag is kept, it must be completed (the server applies the actions and owns their outcome) and planned as its own piece.

## R1 outcomes (fix pass, 2026-11-23)

Decision: the flag returns to the plan's client check. Commits: removal and server side `62105c898`; viewer `6c868d7f9`; leak check `06aee2c62`; PLAYTEST, docs, handover `0bf994549`.

| Finding | Outcome |
|---|---|
| F-1 (major) lost right-flag answer soft-locks | Moot by design. No answer carries the actions: they sit in the browser and run on a right pick; "done" is the action's global, saved by the normal sync. A right flag after a reload or a lost request still completes (nothing is sent). `62105c898`, `6c868d7f9` |
| D-2 (major) server judging protected nothing | Moot by design: no server judging; the plan's best-effort client check. `62105c898` |
| D-1 plan contradicts itself | Moot: the plan file is exactly its text on main (`git diff main` empty); the stream brief already holds the ruling. |
| F-3 `opsLogFlagged` undocumented | Moot: the key is gone. |
| F-4 focus lost after right flag | Fixed: focus goes to the flagged row; CANCEL refocuses FLAG (node test). `6c868d7f9` |
| F-5 wrong note on another row | Moot: the check is synchronous, so no answer can arrive late; a selection change also clears the note (node test). `6c868d7f9` |
| F-6 `unchanged`/`rev` ignore flag state | Moot: `flaggedRow` is gone. |
| S-1 seed rows unbounded in a snapshot | Fixed: `ops_log_seed_rows` needs `^s[0-9]{1,3}$`, the `at` form and a result the event allows (controller test). `62105c898` |
| V-1 schema `as` maxLength 32 | Fixed: 40, description says a username is at most 32. `62105c898` |
| T-1 weak rev test | Fixed: same reader, one seed row's `at` changed, revs differ. `62105c898` |
| T-2 strip tested in two places | Moot: no strip. A test asserts the reader reaches the browser with `anomaly.rowId` and both action lists. `62105c898` |
| L-1 leak rule run-wide | Moot: the rule is removed (the browser holds `anomaly.rowId` by the plan). `06aee2c62` |
| P-1 beat 17 overclaims | Fixed: beats 14 to 19 rewritten; no assertion that the task id or row id is absent. `0bf994549` |
| Merge-readiness list | `routes.rb`, controller lists, `game.rb`, `game_policy.rb`, `policy_test.rb` and the plan are identical to main. Schema (`maxRows` comma), the graph line and the scanner's small edits remain as the stage's own. |
| Playtest oddities | Flagged row now hatched green with a left bar (not like a selected row); the "Task Complete" toast is held by `notifications.js` while any minigame is open and shows on close, the same path as log-filter (`completeTask`). |
