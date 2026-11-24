# test_ops_logs: scripted playtest (L1b the write side, L2a the reader, L2b seed rows, L3 network rows)

Beats 1 to 7 are the write side (L1b). Beats 8 to 13 (below, "L2a: the readers") add the reading side: the security office and its two log terminals. Run them in the same game, straight after beat 7.

The scripted run for ops log stage L1b (`docs/achitechture/OPS_LOG_ROWS_PLAN.md`, section 11
"Scripted playtests" and 13.8). One run, one new game, about 10 minutes. The scenario declares two
log sources (`door_controller`, `signin_audit`) and, for beats 1 to 7, has **no reader** (the security
room of beats 8 to 13 adds two): nothing in the game shows a row in those beats, so every check of a
row is the server script `verify-run.rb --ops-log`. The one thing read in
the browser is the game clock, to compare with a row's time.

The scenario is for testing, not play. The password the run types is read from the PC's sticky
note in the game first; none is written here or on a sign.

## Setup

Keyless server on a free port (never :3000, :3085 or :3086). Make the game with `swap-scenario-game.rb` (host `test_access_signin`), not `new-game.sh`: the scenario has no Mission row until it is seeded after landing, so `new-game.sh` cannot find it.
In a container, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` and pass
`--headless`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_logs   # prints GAME_ID=
S=<scratchpad>/test_ops_logs
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/test_ops_logs-responses.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

The check after every beat (it prints each source's rows and exits 1 on a failure):

```bash
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --ops-log
```

`verify-run.rb --ops-log` exits 1 if a stored row holds a registered secret (the account password), is over the byte, row or save-counter ceilings, or a source is not declared. Expect
`ops log OK` at the end of its output after every beat. Rows are written only after the server has
seen the action, so a row appears as soon as the beat's answer comes back; if a row is missing,
send `{"cmd":"sync"}` and run the check again before calling it a failure.

## Harness notes

- **Wait for one real sync first.** The server's clock stamp is set at game start and moves with
  the first sync. After bootstrap, wait about 15 s (or send `{"cmd":"sync"}`), then run the check
  once: the first line is `ops log  clockAt <number>` and no source has rows yet.
- **Taking the copier.** In `lobby`: `{"cmd":"moveToNear","id":"card_copier"}` then
  `{"cmd":"interact","id":"card_copier"}`.
- **Copying Dana's badge in conversation.** `{"cmd":"moveToNear","id":"dana"}`, then
  `{"cmd":"converse","id":"dana","choices":["scan your badge"]}`. The clone tag opens the card
  copier once its line has been shown, and `converse` leaves it open (`ok:false`,
  `openedMinigame: "rfid"`, on purpose). Wait about 5 s for the read, then click Save:
  `{"cmd":"eval","fn":"() => { const b = Array.from(document.querySelectorAll('.rfid-minigame-container button')).find(x => x.innerText.trim().startsWith('Save')); if (!b) return null; b.click(); return b.innerText; }"}`.
  The chat comes back after the copier closes; leave it with
  `{"cmd":"converse","choices":["let you get on"]}`. `window.__test.access.savedCards()` then lists
  `FIN-DANA-01`.
- **The door.** The office door is `door:lobby->office` (east wall of the lobby). `interact` on it
  reports `door_unlocked` or `door_unlock_failed`; the toast text is on screen.
- **The sign-in screen.** `interact` `office_pc` opens it. The PC has no tiles, so with
  `{"cmd":"mg","action":"getState"}` field 0 is the username and field 1 the password:
  `{"cmd":"mg","action":"type","args":[0,"<username>"]}` then
  `{"cmd":"mg","action":"type","args":[1,"<password>",{"submit":true}]}`. The sticky note's text
  (username / password) is in the `getState` text. Close with `{"cmd":"mg","action":"close"}`.
- **The desktop** loads from the server: wait about 2 s after `interact` before reading it. Its
  taskbar has a Start button; the panel it opens holds Lock, Switch user and Sign out:
  `{"cmd":"mg","action":"clickSelector","args":[".pc-start-btn"]}`, then
  `{"cmd":"mg","action":"clickSelector","args":["#pc-start-lock"]}` (or `#pc-start-signout`).
  If `mg clickSelector` cannot reach the taskbar (it looks inside a minigame only), use
  `{"cmd":"eval","fn":"() => { document.querySelector('.pc-start-btn').click(); document.querySelector('#pc-start-lock').click(); return true; }"}`
  and say so in the report.
- **The game clock.** `{"cmd":"eval","fn":"() => window.gameClock.elapsedMs()"}` is the in-game
  elapsed time in ms. A row's `at <n>ms` in `verify-run.rb --ops-log` is the server's estimate of
  the same quantity when the row was stored.

## Beats

Room layout: `lobby` (start) with `office` east, behind an `rfid` door that admits finance staff.
Read the sign in the lobby first.

### 1. A fresh game, no rows

Wait for the sync (harness notes). Check: `clockAt` is set, `seq` is empty or 0, and both sources
(`door_controller`, `signin_audit`) show nothing.

### 2. Copying the badge writes nothing

Take `card_copier` and copy Dana's badge (harness notes). Check: still no rows in either source (a
card copy is never logged; the gap is the lesson).

### 3. Swiping the copy at the door

`moveToNear` then `interact` `door:lobby->office`; the door opens by playing the saved card in the RFID reader (the "Emulate ... badge" option). Expect `door_unlocked`, the toast titled "Access Granted" with the text "Opened with your copy of Dana Reyes's badge." (the name is the card's; the toast is not reliably in the DOM, so you need not capture it: the `door_unlocked` result and the row are the check), task `l1_into_office`
complete. The reader holds the emulate screen, then the result: the door opens and the toast shows about 4 seconds after the click. Wait 5 seconds (or `waitFor` the `door_unlocked` event) before reading the door, the toast or the row. One click only: a second attempt is not needed. Check: `door_controller` has exactly one row `badge_swipe`, result `ok`, `as {"npc":"dana"}`,
`where {"kind":"door","id":"office"}`. The other source has none.

### 4. Failing the sign-in twice

`enter` `office`, then `moveToNear` and `interact` `office_pc`. Type the username from the sticky note
and a wrong password of your own invention, submit, and again. Expect "Incorrect username or
password" each time with the screen still open. Check: `signin_audit` has **one** `signin_fail`
row, `as {"typed":"<the username>"}`, shown `x2` (the merged failure count). `verify-run.rb` prints the typed username as a length only, `[N chars]` (for `dreyes`, `[6 chars]`); the row holds the name, the printout redacts it.

### 5. Signing in

Type the username and the password from the sticky note and submit. Expect the desktop; task
`l2_signed_in` complete (read it from `completedTasks` in the state; its toast is not reliably in the DOM). Check: a `signin_ok` row after the failure row, `as {"account":"<the
username>"}`, `where {"kind":"pc","id":"office_pc"}`, detail `{"method":"password","route":"keyboard"}`.

Read `window.gameClock.elapsedMs()` in the SAME harness call as the sign-in submit, or one `eval` sent with it (a read in a later call is seconds late and proves nothing) and note it. Compare it with
this row's `at <n>ms`: they must be within a few seconds of each other (allow 5 s). This is the
"row time matches the on-screen clock" check.

### 6. Locking the screen

With the desktop open, press Start and Lock (harness notes). Expect the desktop to close. Check:
a `session_lock` row, `as {"account":"<the username>"}`, same `where`. Reopen `office_pc`, type
the password again at the sign-in screen: it unlocks the held session and is logged as a second
`signin_ok`, which merges into the first row (count x2, so it sorts before `session_lock`). Close
the desktop.

### 7. Signing out

Open the desktop, press Start and Sign out. Expect an info toast titled with the PC's name ("Office PC") and the text "Signed out" (`SIGNED_OUT_MESSAGE`); it lasts 3 seconds and is not reliably captured, so read it at once if you can, but it need not be captured: the `session_end` row is the check. Check: a `session_end` row.

## End of run

`{"cmd":"sync"}`, the full `verify-run.rb <game_id> --ops-log` (it must exit 0 and end with `ops
log OK`), then `{"cmd":"quit"}`. In the report: each beat's rows as the check printed them, the
clock comparison in beat 5, and the exit status. Expected final rows, in order:

| Source | Rows |
|---|---|
| `door_controller` | `badge_swipe` ok (dana) |
| `signin_audit` | `signin_fail` x2, `signin_ok` x2, `session_lock`, `session_end` |

In beats 1 to 7 nothing in the browser shows these rows. Do not add anything from the console that writes them.

## Earned secrets

| Secret | In-game source | Used in |
|---|---|---|
| Dana's username and password | The sticky note on `office_pc`'s sign-in screen | 4, 5, 6 |
| Dana's badge | Copied from her in conversation with the card copier | 3 |

Wrong passwords are made up by the tester. The leak check (`access-leak-check.rb`) is not part of
beats 1 to 7: it judges the `/log_rows` answers of beats 9 and 10 (beat 13).

## Expected validator output

`ruby scripts/validate_scenario.rb scenarios/test_ops_logs/scenario.json.erb` (with
`LANG=C.UTF-8`) reports 0 errors and one expected warning: the `maxAttempts` lockout warning on
`office_pc` (under `corp_default`). It also prints the identity reach lines and the generic
suggestions every small test scenario gets.


---

# L2a: the readers (beats 8 to 13)

Stage L2a (`OPS_LOG_ROWS_PLAN.md` section 11, "Scripted playtests", the L2a bullet). The `security`
room is east of `office` behind a second rfid door (finance staff, so Dana's copied badge opens it).
It holds two `ops_log_terminal` objects, one per source: `door_log_pc` (reads `door_controller`)
and `signin_log_pc` (reads `signin_audit`, source title "Sign-in audit"). Every bridge call below is in
`docs/test-bridge.md` (`moveToNear`, `interact`, `enter`, `waitFor` with `kind: "minigame"`,
`mg clickSelector`, `eval`). The viewer has no `getTestState`, so it is read from its DOM, with `eval`
returning one value per call.

Ports 3014 to 3016 only. Make the game for the whole run (beats 1 to 13) with
`env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_logs`.
The viewer's hooks (from `HANDOVER_L2a_client.md`): the root `.ol-wrapper[data-ops-log="viewer"]`;
rows `table[data-ops-log="table"] tr.ol-row[data-row-id]` (a row of data; `tr.ol-row.ol-message` is the loading, no-access, no-signal or empty row) with `data-row-id` and `aria-selected`, cells
`td[data-col]`; messages `.ol-message[data-state="loading|denied|empty|nosignal"]`; filters `[data-filter="time|event|where|result|as"]`;
the detail pane `[data-ops-log="detail-grid"] [data-field="TIME|EVENT|IDENTITY|LOCATION|RESULT|DETAIL"]`;
the count `[data-ops-log="count"]`; the refresh button `button[data-action="refresh"]`.

Handy reads (each an `eval`, shown here as the function body):

- rows as text: `() => Array.from(document.querySelectorAll('tr.ol-row[data-row-id]')).map(r => Array.from(r.querySelectorAll('td[data-col]')).map(c => c.innerText.trim()).join(' | '))`
- count text: `() => document.querySelector('[data-ops-log="count"]')?.innerText`
- message state: `() => document.querySelector('.ol-message')?.dataset.state || null`

Capture the page's `/log_rows` answers with the session's `--capture-responses` file (the setup
above). Close the viewer with `{"cmd":"mg","action":"close"}` or Escape.

### 8. Entering the security office

After beat 7 (signed out). `moveToNear` then `interact` `door:office->security`, using the saved card
(the "Emulate ... badge" option, as in beat 3). Expect `door_unlocked`, the toast titled "Access Granted" (text "Opened with your copy of Dana Reyes's badge."; as in beat 3 it need not be captured). The RFID reader can linger for a moment after the emulate (give it the same 5 second wait as in beat 3 before reading the door or the row): close it with `{"cmd":"mg","action":"close"}` before `enter`, or `enter` answers `minigame-active`. Check with
`verify-run.rb --ops-log`: `door_controller` now has **two** `badge_swipe` rows (office, then
security), both `ok`. Then `enter` `security`.

### 9. Opening the door log by a real interaction

`moveToNear` then `interact` `door_log_pc`; `waitFor` `{"kind":"minigame"}`. The first frame may be
`.ol-message[data-state="loading"]`; wait until `tr.ol-row[data-row-id]` exists. Expect the frame title "Door log PC"
(the object's name), the caption (the source title "Door controller"), exactly **2** rows, both
`BADGE`, both `OK`, IDENTITY `Dana Reyes` (no source sets `showCardHolder`, so the holder shows),
LOCATION `Finance office` and then `Security office` (the rooms' door signs), TIME ascending, no `SIGN_IN` row. The
count text reads `2 rows`. No flag button
exists (`button[data-action=flag]` is absent: L2b adds it).

Select the first row by click (`mg clickSelector 'tr.ol-row[data-row-id]'`): `aria-selected="true"`, and the detail
grid shows `EVENT` BADGE, `IDENTITY` Dana Reyes, `RESULT` OK. Close the viewer.

### 10. Opening the sign-in log, and a filter

`moveToNear` then `interact` `signin_log_pc`; `waitFor` `{"kind":"minigame"}`. Expect the caption
"Sign-in audit" and exactly **four** rows in order (the table above, merged): `SIGN_IN` `FAIL x2`
(IDENTITY the typed username `dreyes`, LOCATION "Office PC"), `SIGN_IN` `OK x2` (detail
`route: keyboard, method: password`), `SESSION` `OK` (the lock), `SESSION` `OK` (the sign-out).
No `BADGE` row. No row contains the password or `FIN-DANA-01`: `eval`
`() => document.querySelector('.ol-wrapper').innerText.includes('Ledger-Dana-7') || document.querySelector('.ol-wrapper').innerText.includes('FIN-DANA')`
must return `false`.

Filter: set the EVENT select to `SESSION` (`eval`:
`() => { const s = document.querySelector('[data-filter="event"]'); s.value = Array.from(s.options).find(o => o.value.includes('SESSION') || o.textContent.includes('SESSION')).value; s.dispatchEvent(new Event('change', { bubbles: true })); return s.value; }`).
Expect the two `SESSION` rows and the count text `2 of 4 rows`.
Expect two rows, both `SESSION` (the count text shows the filtered and total numbers; note the wording). Type `dre` into the IDENTITY
box (`mg type` on `[data-filter=as]`, or an `eval` setting `.value` and dispatching `input`): the
`SESSION` rows have an `as` of `dreyes` so they stay; type `zzz` and the table shows
`.ol-message[data-state="empty"]`. Clear the box and reset EVENT to the empty option: four rows again.
Set TIME to `morning` (the game clock starts at 08:30): four rows; set it to `evening`: none. Reset.

Close the viewer.

### 11. A new row appears after another action (the refresh)

With the viewer closed, `enter` `office`, `moveToNear` and `interact` `office_pc`, and fail the sign-in
once with a made-up username `intruder` and any password (a different typed name does not merge into
the earlier failure row, so it is a new `signin_fail` row, count 1).
Close the screen. Back in the security office, open `signin_log_pc` again: the
reopen sends its `rev`, the answer is new rows, and the table now has **five** rows: a new `SIGN_IN` `FAIL` row last, IDENTITY `intruder`, no count suffix. Click `button[data-action="refresh"]`: the rows stay the same (the answer is
`unchanged`, check in the captured `/log_rows` responses that the refresh request carried `rev=` and the answer was
`{rev, unchanged:true}`). Close the viewer, open it a second time with no action between: the answer is `unchanged`
again and the same rows show at once with no loading flicker beyond a frame.

### 12. The other reader and the second source

Open `door_log_pc` once more: still two `BADGE` rows only, none of the sign-in rows. The two
readers never show each other's rows.

### 13. The leak check and the server check

`{"cmd":"sync"}`; `verify-run.rb <game_id> --ops-log` must still exit 0 with `ops log OK`. Then run
`tools/playtest/access-leak-check.rb` over the capture file (it judges the `/log_rows` answers: no
secret, exactly the seven row keys, no raw id, no stored-only key): it must report no finding.
In the report: each beat's rows as the page showed them, the exact count wording, the filter results,
and the captured `/log_rows` answers (a first answer, a second `unchanged`).

Every `/log_rows` answer must hold exactly the seven row keys `id`, `elapsedMs`, `event`, `as`,
`where`, `result`, `detail` and no `seq`, `serverMs`, `opsLog` or `logSources` key.

## L2a gotchas

- The security door is a second rfid door: the card copy must be saved before beat 3 (it serves both).
- The viewer is a modal overlay: nothing in the game can be done while it is open, which is why the
  refresh beat acts in the office first and the Refresh button check is a re-read of the same state.
- Not built in L2a: seed rows, an anomaly and the flag button (L2b), a jack, access point or share (L3), and a reader reached
  through a PC desktop or a foothold (no scenario in this stage uses one; the controller tests cover those routes).

---

# L2b: seed rows and the anomaly (beats 14 to 19)

Stage L2b (`OPS_LOG_ROWS_PLAN.md` 4.2, 5.2, 7, 11). The `office` room now also holds a wall terminal, `night_log_pc` ("Night log PC", east end of the room), that reads a third source, `night_log` ("Night door log"). The source has four authored **seed rows** and no stored rows (its `where` is the lobby, which no swipe ever names): Dana's badge at the Finance office door `Mon 08:12`, at the Security office door `Mon 08:14` and `Mon 23:58`, and at the Finance office door `Tue 07:55`. The row `s3` (`Mon 23:58`) is the **anomaly**: the reader object the browser holds names it (`minigameData.anomaly.rowId`, with `flagActions` and `completionActions`), as the plan says. The flag is checked in the browser, best effort, as the log-filter minigame checks its own; no request is sent for it and no server state holds it. No beat sends a request of its own making.

Run these in the same game, after beat 13 (the office is open, the card copy saved). Same ports (3014 to 3016) and capture file.

The viewer's flag hooks (from `HANDOVER_L2b.md`): `button[data-action="flag"]` (label `Flag the odd swipe`), then `button[data-action="flag-confirm"]` and `button[data-action="flag-cancel"]`; the note `[data-ops-log="flag-note"]` with `data-state` `confirm`, `wrong` or `done` (text `FLAG THIS ROW AS THE ANOMALY?`, `NOT THIS ONE`, `FLAGGED`); a row marked as the flagged one carries `data-flagged="true"` and the class `ol-row-flagged`, and no row carries either before a right flag. Handy reads:

- marked rows: `() => Array.from(document.querySelectorAll('tr[data-flagged="true"]')).map(r => r.dataset.rowId)`
- row classes, all alike: `() => Array.from(document.querySelectorAll('tr.ol-row[data-row-id]')).map(r => r.className.replace('ol-row-selected', '').trim())`
- the global: `() => window.gameState?.globalVariables?.found_night_swipe ?? null`

### 14. Opening the night log

`moveToNear` then `interact` `night_log_pc` (in `office`); `waitFor` `{"kind":"minigame"}`. Expect the frame title "Night log PC", the caption "Night door log" and exactly **four** rows with `data-row-id` `s1`, `s2`, `s3`, `s4` in that order (seed ids are the authored ones; the play rows of beats 9 to 12 have ten hex characters). TIME `Mon 08:12`, `Mon 08:14`, `Mon 23:58`, `Tue 07:55` (the authored stamps as the viewer shows them), EVENT `BADGE`, IDENTITY `Dana Reyes`, RESULT `OK`, LOCATION `Finance office`, `Security office`, `Security office`, `Finance office`. The count text reads `4 rows`. No row is marked or tinted: the marked-rows read is `[]` and the class read gives four identical strings. The earlier swipes of beats 3 and 8 added no row here (they are in the door log only).

### 15. The flag control and its confirm

Before any row is selected there is no `button[data-action=flag]`. Click `tr[data-row-id="s1"]`: the detail grid shows the row and the flag button appears with the label "Flag the odd swipe". Click it: the note reads `FLAG THIS ROW AS THE ANOMALY?` (`data-state="confirm"`), with CONFIRM and CANCEL, CONFIRM focused; the flag button is gone. Click CANCEL: the flag button is back (and focused), the global read is `null`, and the capture file holds no new request.

### 16. A wrong flag

Select `s1`, click the flag button, click CONFIRM. At once the note reads `NOT THIS ONE` (`data-state="wrong"`) and the flag button returns. The marked-rows read is still `[]`, the global read is `null`, and the task "Flag the night-time swipe in the night door log" is still open. Do the same for `s2` and `s4`. Selecting another row clears the note (it never sits under a different row). The capture file holds no request for any of these picks.

### 17. The right flag

Select `s3` (`Mon 23:58`, the night swipe), click the flag button, CONFIRM. Expect the note `FLAGGED` (`data-state="done"`), the marked-rows read `["s3"]`, the row `s3` with class `ol-row-flagged` (a green hatched row with a bar on its left edge: it must not look like a selected row; select `s1` and compare), focus on the `s3` row, the global read `true`, and the task "Flag the night-time swipe in the night door log" ticked in the objectives panel. Select `s1`: no flag button now. The reader object in the office room answer (and any other copy of the reader the browser is given) holds `anomaly.rowId` `s3` and both action lists from the start (that is the plan: the check is local), so no beat asserts their absence; the capture file holds no request that this flag caused. The "Task Complete" toast is held while a minigame is open (`notifications.js`): close the viewer, and the toast "Task Complete: Flag the night-time swipe in the night door log" appears, as log-filter's does after it closes.

### 18. Reopen and reload

Open `night_log_pc` again (same page): `s3` is marked at once and there is no flag button. Then `{"cmd":"sync"}` so the global is saved (the normal sync), reload the page the way the harness resumes a game (`docs/test-bridge.md`, `bootstrap` with `resume`), `enter` `office` and open it again: `s3` is marked, because the global `found_night_swipe` is already `true` (the viewer reads the action's global; nothing else holds the flag), there is no flag button, and the task is not completed twice. Close the viewer.

### 19. The leak check

`verify-run.rb <game_id> --ops-log` still exits 0 with `ops log OK` (it prints only the sources that have stored rows: `door_controller` and `signin_audit`, and `network_log` once a network row exists; `night_log` has no stored row and is not printed, and the play rows of the other two are as in beats 1 to 13). Run `tools/playtest/access-leak-check.rb` over the capture file. It must report no finding: it judges the `/log_rows` answers (no secret, seed rows and play rows with exactly their own seven keys, no raw id, no stored-only key); it holds no rule about the anomaly.
In the report: the four rows as the page showed them, the three wrong-flag notes, the right flag's marked row, global and toast, what the reload showed, and the exit status of both checks.

## L2b gotchas

- The anomaly row id and both action lists reach the browser with the reader (plan section 7); the viewer compares the picked row's id with `anomaly.rowId`, runs the actions once, and reads "already flagged" from the action's global (`found_night_swipe`), which the normal sync saves.
- A server check of the flag is a later piece (the investigator work); this flag is best effort, like log-filter's.
- The night log's `where` is the lobby so that play never adds a row to it: the scenario tests for beats 9 to 12 are unchanged.


---

# L3: network and share rows (beats 20 to 27)

Stage L3 (`OPS_LOG_ROWS_PLAN.md` 5.1, 11 and 13.8). The lobby has a door north to a new `comms_room` (never locked). It holds a wall jack `comms_port` ("Spare wall port") and a reader `net_log_pc` ("Network log PC") over a fourth source, `network_log` ("Network log": `net_*` and `share_*` rows at the jack, the access point and the share). In the lobby: the drop box `kit_dropbox` ("Network drop box", the device to plug in), the access point `guest_ap` ("Guest access point") and the card `wifi_note` ("Reception Wi-Fi card", where the key is read). The share on the jack's network is shown in the box's network view by its name; it holds a note and a folder ("Letters") with one file. Nothing here names a hidden host or the share: they come from the server only.

Run these in the same game, after beat 19 (and the same capture file or files, ports 3014 to 3016). If the page was reloaded after beat 18 and the capture file changed, keep every capture file: the leak check in beat 27 names all of them, oldest first. The game for the whole run (beats 1 to 27) is made with `env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_logs`.

The calls are in `docs/test-bridge.md` (`moveToNear`, `interact`, `enterRoom`, `waitFor`, `dismiss` with a label, `mg clickSelector`, `mg type`, `eval`, `access.footholds()`, `access.networkView()`) or are session commands of the playtest skill: `enter` is the session command that calls `enterRoom`, and `{"cmd":"sync"}` is listed in the skill (not in `test-bridge.md`; if the session refuses it, `eval` `() => window.stateSync.sync()`). No beat sends a request of the script's own making: every row comes from the real controls.

Notes from the code. L3 was run in a browser on 2026-11-23 (run 3, game 64): beats 20 to 27 passed.

- The plant prompt is a `gameConfirm` dialog, not a minigame: answer it with `{"cmd":"dismiss","label":"Plug it in"}` (or `"Leave it"`, the cancel button: there is no button labelled "Cancel"). Always give `dismiss` a label: with no label and a minigame open it clicks that minigame's first control.
- In a container window (the share and its folder) the copy or open menu is on a file's ICON (`.desktop-icon`), not on the window; in a share window an item is a `.container-content-slot` (not `.desktop-icon`), and a folder opens by clicking it: `click` `.container-content-slot[aria-label="Letters"]` (the slot carries its name in `aria-label`; a share row in the network view also has `data-resource-id`). Feedback there is an in-window line, not a toast.
- A planted jack has no prompt: clicking it opens the box's network view with Unplug in its header (`[data-unplug]`). The network view's share row is `[data-resource-id="scanned_inbox"] [data-action="open"]`.
- Joining: `interact` `guest_ap` opens the join minigame (`#password-field`, "Network key"; the `interact` itself first sends a keyless probe join, answered 422 `wrong_key`, before the key screen opens); type with `{"cmd":"mg","action":"type","args":[0,"<key>",{"submit":true}]}`. A wrong key shows "That key was not accepted" and clears the field. The key is read from `wifi_note` (interact, read the text), as with every earned secret.
- The viewer's hooks and handy reads are those of beats 8 to 13 (`tr.ol-row[data-row-id]`, `td[data-col]`, `[data-ops-log="count"]`, `button[data-action="refresh"]`).
- Every plant and every unplug is its own row (13.8: one per plant or unplug), so plant, unplug, plant reads up, down, up and never `OK x2`. A share or folder open is one row per folder: a repeat open adds none.
- Beat 3 walks east from the lobby past the two new lobby objects (`kit_dropbox` at tile 8,4 and `guest_ap` at 8,6, both solid, the room is 10 tiles wide). Confirm that `enter` `office` works on the first attempt in the full run (beats 1 to 27); if it is blocked, move the two objects to the west half of the lobby and report it.

### 20. The network log before anything happens

`enter` `comms_room` (it walks through the lobby's north door; the room is not locked). `enter` reaches adjacent rooms only: from the security office the route is `enter` `office`, `enter` `lobby`, `enter` `comms_room`. `moveToNear` then `interact` `net_log_pc`; `waitFor` `{"kind":"minigame"}`. Expect the frame title "Network log PC", the caption "Network log" and an empty table: `.ol-message[data-state="empty"]`, no `tr.ol-row[data-row-id]`. Close the viewer. Check with `verify-run.rb --ops-log`: `verify-run` prints no `network_log` line, because a source with no rows is not printed.

### 21. Planting the drop box writes one row

`interact` `comms_port` with nothing in hand: the port's hint toast ("Something small could be plugged in here"), no row. `enter` `lobby`, then `moveToNear` and `interact` `kit_dropbox` (it goes into the inventory). `enter` `comms_room` again and `interact` `comms_port`: the confirm "Plug the drop box into this port?". Answer `{"cmd":"dismiss","label":"Leave it"}`: the box stays in the inventory, no row. `interact` again and answer `{"cmd":"dismiss","label":"Plug it in"}`. (`dismiss` may report `stillBlocked`: the network view it opens is itself a blocker, so that is harmless.) Expect the link item in the inventory, `window.__test.access.footholds()` listing `jack_comms_port`, and the network view opening by itself. Check: `network_log` has exactly **one** row, `net_link_up`, result `ok`, `where {"kind":"jack","id":"comms_port"}`, no `as`, no detail. The door and sign-in sources have no new row. Do not close the view yet.

### 22. Opening the share and its folder writes a row each, and a repeat none

In the open view, click `[data-resource-id="scanned_inbox"] [data-action="open"]`. The share opens as a file window. Check `network_log`: a `share_folder_opened` row, `where {"kind":"share","id":"scanned_inbox"}`, no `as`, no detail. Click the "Letters" folder (`.container-content-slot[aria-label="Letters"]`). The click sends `POST /unlock` (answered with the folder's contents), then one `GET /container/scanned_inbox`, then `GET /container/inbox_letters`; the folder window replaces the share window and closing it returns to the share. If timed screenshots are wanted, take them with one command that waits on the page clock. Check: a second `share_folder_opened` row with detail `{"folder":"inbox_letters"}`. Close the folder, open it again, close the share and open the share again: no new row after either repeat (the row count stays at three: link up, share, folder). Open nothing else: a file is never logged. Close the windows back to the world.

### 23. Unplugging writes one row

`interact` `comms_port`: the box's network view opens with Unplug in its header. Close it with the X: nothing changes, no new row. `interact` again and click `[data-unplug]`. Expect the view to close, the box back in the inventory, no link item. Check: `network_log` has a `net_link_down` row (`where` the jack, no `as`), four rows in all.

### 24. A wrong key then the right key at the access point

`enter` `lobby`, then `moveToNear` and `interact` `wifi_note` and read the key from its text. `moveToNear` then `interact` `guest_ap`: the join minigame opens. Type a wrong key of your own invention and submit: "That key was not accepted", nothing joined, no row. The capture shows a 422 `wrong_key` for the `interact` itself (the keyless probe) and a second for your wrong key: two refusals, no row for either. Type the right key from the note and submit. Expect the join to succeed (`access.footholds()` lists a `wifi_` foothold) and a network view (it may list nothing: the guest network holds no share); close it. Check: `network_log` has a `net_wifi_join` row, `where {"kind":"ap","id":"guest_ap"}`, no `as`; five rows in all. Click `guest_ap` again: the join is answered `already: true`, no view opens, no second row.

### 25. Reading the network log

`enter` `comms_room`, `moveToNear` and `interact` `net_log_pc`; `waitFor` `{"kind":"minigame"}`. Expect exactly **five** rows, in this order (EVENT / IDENTITY / LOCATION / RESULT / detail; the order is the order the actions were done in): `NET_LINK_UP` / `-` / `Spare wall port` / `OK`; `SHARE_OPEN` / `-` / `Scanned-Inbox` / `OK` (empty detail); `SHARE_OPEN` / `-` / `Scanned-Inbox` / `OK` (detail `folder: Letters`); `NET_LINK_DOWN` / `-` / `Spare wall port` / `OK`; `NET_WIFI_JOIN` / `-` / `Guest access point` / `OK`. The count text should read `5 rows`. No cell holds a raw id (`comms_port`, `guest_ap`, `scanned_inbox`, `inbox_letters`), the key, `jack_`, `wifi_` or a file name: `eval` `() => /comms_port|guest_ap|scanned_inbox|inbox_letters|seabreeze|jack_|wifi_|letter\.txt|reminder/.test(document.querySelector('.ol-wrapper').innerText)` must return `false`. Click the third row: the detail grid shows EVENT `SHARE_OPEN`, LOCATION `Scanned-Inbox`, DETAIL `folder: Letters`. Close the viewer.

### 26. Refresh after another plant

With the viewer closed, in the comms room `interact` `comms_port` and answer `Plug it in` (the box is back in your inventory since beat 23); no view opens this time (the view opens by itself only on the first plant); nothing to close. Open `net_log_pc` again: now **six** rows: the five of beat 25 unchanged and a sixth, `NET_LINK_UP` / `-` / `Spare wall port` / `OK` (a plant after an unplug is its own row: the log reads up, down, up, and no row reads `x2`; the count text should read `6 rows`). Click `button[data-action="refresh"]`: the six rows stay as they are (check in the capture file that the refresh request carried `rev=` and was answered `{rev, unchanged:true}`). Close the viewer.

### 27. The other readers, then the checks

From the comms room `enter` `lobby`, `office` and `security` in turn, one room at a time (their doors are open since beats 3 and 8) and open `night_log_pc` (office), `door_log_pc` and `signin_log_pc` (security; the sign-in log's five rows exist only if beats 4 to 7 were played in this game, otherwise it shows the empty state): none shows a `NET_` or `SHARE_` row, and their rows are those of beats 9 to 14 (door log two `BADGE`, sign-in log five rows from beat 11, night log four seed rows). Open `net_log_pc` once more: no `BADGE`, `SIGN_IN`, `SESSION` row.

`{"cmd":"sync"}`, then `verify-run.rb <game_id> --ops-log` must exit 0 and end with `ops log OK` (it prints the sources with stored rows: `door_controller`, `signin_audit`, `network_log`). Then the leak check, naming ALL capture files of the game one by one, oldest first (it refuses files out of time order; do not glob):

```bash
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/<oldest>.jsonl $S/<next>.jsonl ... $S/<newest>.jsonl
```

It must say `VERDICT: no leaks found`. It judges the `/log_rows` answers as before and, in a `SHARE_OPEN` row, allows the name of a share this run opened earlier (a successful `GET /container/<the share or an item in it>`) in the LOCATION cell, and nothing else. The capture files must therefore include the `/container` answers of beat 22 (they do when every file is named). In the report: each beat's rows as the page showed them, the exact count wording, the capture-file list in the order given, and both exit statuses.

## L3 gotchas

- Beats 1 to 19 are unchanged: the new objects are in the lobby (the box at the east table, the access point, the card) and in a new room north of it; no beat of the earlier stages uses them, and the `network_log` source only takes `jack:`, `ap:` and `share:` places, so no earlier action writes to it.
- `net_wifi_join` shows no identity and the guest network has no share, so the view after a join is empty by design (the run saw "Joined. Reaches 0 hosts." and "Nothing answers on this network.").
- The jack, the access point and the share are not told apart by any sign: only the lobby sign names the comms room.
