# test_ops_logs: scripted playtest (L1b the write side, L2a the reader)

Beats 1 to 7 are the write side (L1b). Beats 8 to 13 (below, "L2a: the readers") add the reading side: the security office and its two log terminals. Run them in the same game, straight after beat 7.

The scripted run for ops log stage L1b (`docs/achitechture/OPS_LOG_ROWS_PLAN.md`, section 11
"Scripted playtests" and 13.8). One run, one new game, about 10 minutes. The scenario declares two
log sources (`door_controller`, `signin_audit`) and has **no reader**: nothing in the game shows a
row, so every check of a row is the server script `verify-run.rb --ops-log`. The one thing read in
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

`moveToNear` then `interact` `door:lobby->office`; the door opens by playing the saved card in the RFID reader (the "Emulate ... badge" option). Expect `door_unlocked`, the toast "Access Granted", task `l1_into_office`
complete. Check: `door_controller` has exactly one row `badge_swipe`, result `ok`, `as {"npc":"dana"}`,
`where {"kind":"door","id":"office"}`. The other source has none.

### 4. Failing the sign-in twice

`enter` `office`, then `moveToNear` and `interact` `office_pc`. Type the username from the sticky note
and a wrong password of your own invention, submit, and again. Expect "Incorrect username or
password" each time with the screen still open. Check: `signin_audit` has **one** `signin_fail`
row, `as {"typed":"<the username>"}`, shown `x2` (the merged failure count).

### 5. Signing in

Type the username and the password from the sticky note and submit. Expect the desktop; task
`l2_signed_in` complete. Check: a `signin_ok` row after the failure row, `as {"account":"<the
username>"}`, `where {"kind":"pc","id":"office_pc"}`, detail `{"method":"password","route":"keyboard"}`.

Read `window.gameClock.elapsedMs()` straight after the desktop opens and note it. Compare it with
this row's `at <n>ms`: they must be within a few seconds of each other (allow 5 s). This is the
"row time matches the on-screen clock" check.

### 6. Locking the screen

With the desktop open, press Start and Lock (harness notes). Expect the desktop to close. Check:
a `session_lock` row, `as {"account":"<the username>"}`, same `where`. Reopen `office_pc`, type
the password again at the sign-in screen: it unlocks the held session and is logged as a second
`signin_ok`, which merges into the first row (count x2, so it sorts before `session_lock`). Close
the desktop.

### 7. Signing out

Open the desktop, press Start and Sign out. Expect "Signed out". Check: a `session_end` row.

## End of run

`{"cmd":"sync"}`, the full `verify-run.rb <game_id> --ops-log` (it must exit 0 and end with `ops
log OK`), then `{"cmd":"quit"}`. In the report: each beat's rows as the check printed them, the
clock comparison in beat 5, and the exit status. Expected final rows, in order:

| Source | Rows |
|---|---|
| `door_controller` | `badge_swipe` ok (dana) |
| `signin_audit` | `signin_fail` x2, `signin_ok` x2, `session_lock`, `session_end` |

Nothing in the browser shows these rows. Do not add anything from the console that writes them.

## Earned secrets

| Secret | In-game source | Used in |
|---|---|---|
| Dana's username and password | The sticky note on `office_pc`'s sign-in screen | 4, 5, 6 |
| Dana's badge | Copied from her in conversation with the card copier | 3 |

Wrong passwords are made up by the tester. The leak check (`access-leak-check.rb`) is not part of
this run: its `/log_rows` coverage lands with the reader in L2a.

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
and `signin_log_pc` (reads `signin_audit`, title "Sign-in audit"). Every bridge call below is in
`docs/test-bridge.md` (`moveToNear`, `interact`, `enter`, `waitForMinigame`, `waitForMinigameClosed`,
`mg clickSelector`, `eval`). The viewer has no `getTestState`, so it is read from its DOM, with `eval`
returning one value per call.

Ports 3014 to 3016 only. Make the game for the whole run (beats 1 to 13) with
`env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_logs`.
The viewer's hooks (from `HANDOVER_L2a_client.md`): the root `.ol-wrapper[data-ops-log="viewer"]`;
rows `table[data-ops-log="table"] tr.ol-row` with `data-row-id` and `aria-selected`, cells
`td[data-col]`; messages `.ol-message[data-state="loading|denied|empty"]`; filters `[data-filter="time|event|where|result|as"]`;
the detail pane `[data-ops-log="detail-grid"] [data-field="TIME|EVENT|IDENTITY|LOCATION|RESULT|DETAIL"]`;
the count `[data-ops-log="count"]`; the refresh button `button[data-action="refresh"]`.

Handy reads (each an `eval`, shown here as the function body):

- rows as text: `() => Array.from(document.querySelectorAll('tr.ol-row')).map(r => Array.from(r.querySelectorAll('td[data-col]')).map(c => c.innerText.trim()).join(' | '))`
- count text: `() => document.querySelector('[data-ops-log="count"]')?.innerText`
- message state: `() => document.querySelector('.ol-message')?.dataset.state || null`

Capture the page's `/log_rows` answers with the session's `--capture-responses` file (the setup
above). Close the viewer with `{"cmd":"mg","action":"close"}` or Escape.

### 8. Entering the security office

After beat 7 (signed out). `moveToNear` then `interact` `door:office->security`, using the saved card
(the "Emulate ... badge" option, as in beat 3). Expect `door_unlocked`, "Access Granted". Check with
`verify-run.rb --ops-log`: `door_controller` now has **two** `badge_swipe` rows (office, then
security), both `ok`. Then `enter` `security`.

### 9. Opening the door log by a real interaction

`moveToNear` then `interact` `door_log_pc`; `waitForMinigame` `ops-log`. The first frame may be
`.ol-message[data-state="loading"]`; wait until `tr.ol-row` exists. Expect the frame title "Door log PC"
(the object's name), the caption (the source title "Door controller"), exactly **2** rows, both
`BADGE`, both `OK`, IDENTITY `Dana Reyes` (no source sets `showCardHolder`, so the holder shows),
LOCATION naming the office door and then the security door, TIME ascending, no `SIGN_IN` row. The
count text reads 2 of 2 (or the viewer's equivalent wording; note the exact text). No flag button
exists (`button[data-action=flag]` is absent: L2b adds it).

Select the first row by click (`mg clickSelector 'tr.ol-row'`): `aria-selected="true"`, and the detail
grid shows `EVENT` BADGE, `IDENTITY` Dana Reyes, `RESULT` OK. Close the viewer.

### 10. Opening the sign-in log, and a filter

`moveToNear` then `interact` `signin_log_pc`; `waitForMinigame` `ops-log`. Expect the caption
"Sign-in audit" and exactly **four** rows in order (the table above, merged): `SIGN_IN` `FAIL x2`
(IDENTITY the typed username `dreyes`, LOCATION "Office PC"), `SIGN_IN` `OK x2` (detail
`route: keyboard, method: password`), `SESSION` `OK` (the lock), `SESSION` `OK` (the sign-out).
No `BADGE` row. No row contains the password or `FIN-DANA-01`: `eval`
`() => document.querySelector('.ol-wrapper').innerText.includes('Ledger-Dana-7') || document.querySelector('.ol-wrapper').innerText.includes('FIN-DANA')`
must return `false`.

Filter: set the EVENT select to `SESSION` (`eval`:
`() => { const s = document.querySelector('[data-filter="event"]'); s.value = Array.from(s.options).find(o => o.value.includes('SESSION') || o.textContent.includes('SESSION')).value; s.dispatchEvent(new Event('change', { bubbles: true })); return s.value; }`).
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
`tools/playtest/access-leak-check.rb` over the capture file if its `/log_rows` coverage has been
extended (the plan lists it for L2a; it is not part of this build item): it must report no secret.
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
