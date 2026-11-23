# test_ops_logs: scripted playtest (L1b, the write side)

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
