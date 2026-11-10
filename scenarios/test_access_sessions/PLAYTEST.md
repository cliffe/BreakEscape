# test_access_sessions: scripted playtest (T1 to T11)

The scripted runs for access model step 9 (`docs/achitechture/ACCESS_MODEL_PLAN.md`, "How the
slice is tested" and step 9's beat table). Two runs, each with its own new game, to stay within 10
to 15 minutes: **Run 1** is T1 to T5 and T11 (T11 is that run's reload); **Run 2** is T6 to T10,
with a reload after T7. After every beat, check what is on screen, what the server recorded and
what reached the browser.

The scenario is for testing, not play. The one password the runs type (Ian's) is read from its
in-game note first (see "Earned secrets" at the end); it is not written here or on a sign.

## Setup (each run)

Keyless server on :3001 (never touch :3000). In a container, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` and pass `--headless`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_sessions
S=<scratchpad>/test_access_sessions-haiku
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/test_access_sessions-<run>-responses.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

The two checks after every beat:

```bash
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/test_access_sessions-<run>-responses.jsonl
```

The leak check must say `VERDICT: no leaks found` after every beat. Compare the `sessions`,
`signedInPcs` and `copiedItems` lines with the record each beat expects below. `signedInPcs` lists
every PC the player has ever signed in at in this game (by password or by a claim), not the PCs
signed in now; the sessions open now are the `sessions` line.
`{"cmd":"eval","fn":"() => window.__test.access.sessions()"}` shows the sessions the browser holds
(they should match the server's `sessions` line), and
`{"cmd":"eval","fn":"() => window.__test.access.workstation('dana_pc')"}` shows a PC as the
workstation rule sees it: `owner`, `present`, `away` (`{ away, leaves }` or null), `screenLocked`
and `lockAt`, and how its screen looks: `texture` (the sprite's texture key), `displayWidth`,
`displayHeight` and `lockedLook` (the first three are null until the PC's room has loaded).
`{"cmd":"eval","fn":"() => window.__test.access.screenTransitions()"}` lists every change of a
screen's look, `[{ objectId, locked, sound, at }]`: the lock sound is `lockpick_set`, the unlock
sound is `ui_confirm`, and every sound the screen module plays is in the list. A lock or unlock
that happens while you are in another room is recorded with `sound: null`: the look changes and
nothing is played (seen in the H3 run of 2026-11-10), so expect a sound only for a screen in the
room you are standing in.

**Screen state checks (H3).** The lines marked **H3** in the beats below are the screen state
checks of the lab follow-up. A full Run 1 or Run 2 makes them as it goes. A tester sent to do H3
alone follows the section "H3: screen states in the other scenarios" near the end, which is a
shorter route through the same checks. In this scenario no PC has locked screen art (the sprites
are ordinary office PCs), so a PC's `texture` and display size never change: only `lockedLook`,
the transitions and the sounds follow the state.

## How the owners behave

- **Owners start at their desks.** Each owner's needs clock starts when their room first loads
  (rooms and their NPCs load lazily), not when the game starts.
- **Dana, Ian and Priya** fetch coffee about 50 seconds after their room loads, stay at the
  machine 45 seconds, walk back, and go again about two minutes after they came back. **Omar** goes
  after about 50 seconds too, but stays away ten minutes. **Kai, Mei and Tom** do not get up for
  twelve minutes, so they are at their desks for the whole of their beats.
- Wait for a leave or a return with
  `{"cmd":"waitFor","kind":"event","name":"npc_left_post:dana","timeoutMs":90000}` (or
  `npc_returned_post:dana`); give `cmd.sh` a third argument of 100 (seconds) for these.

## Harness notes for this scenario

- **Events.** `{"cmd":"drain"}` lists the `pc_*` and `workstation_*` events with the rest. The ones
  the beats check: `workstation_owner_left:<pc>` (`reason` is `needs` or `ko`),
  `workstation_owner_returned:<pc>`, `workstation_accessed:<pc>`, `workstation_locked_attempt:<pc>`,
  `workstation_auto_locked:<pc>`, `pc_in_use` (the owner was at the desk), `pc_signin_shown` (with
  `reason`: `signin`, `locked`, `claim_refused` and so on), `pc_signed_in` (`via` is `password` or
  `claim`), `pc_signed_out` (`reason`: `owner_returned`, `auto_locked`, `claim_ended`,
  `sign_out` ...) and `pc_desktop_opened` (`restored` is true for a session kept over a reload).
  Drain before the click you want to check, then again after it.
- **"<owner> is using this PC"** is a toast, not a minigame, so `interact` may answer
  `ok:false, reason:"no-effect-confirmed"`. That is expected: read it with `{"cmd":"toasts"}`
  (call it once before the click to clear old toasts). If no toast came, `interact` again.
- **The desktop** loads from the server, so wait about 2 s after `interact` before reading it.
  `{"cmd":"mg","action":"getState"}` then shows "Signed in as <name> (<username>)" and the files.
  A claimed desktop is the owner's: no password was typed.
- **Copy a file.** `{"cmd":"mg","action":"take","args":["Q3 forecast.txt"]}` opens the dialog, then
  `{"cmd":"mg","action":"clickText","args":["Copy to inventory"]}`.
- **The sign-in screen** is the password minigame in sign-in mode. On Ian's PC choose his tile with
  `{"cmd":"mg","action":"clickText","args":["Ian Shaw"]}` and submit the password with
  `{"cmd":"mg","action":"type","args":[0,"<password>",{"submit":true}]}`. Close it with
  `{"cmd":"mg","action":"close"}`.
- **Ian's drawer.** `interact` `ian_drawer`, wait about 2 s, then
  `{"cmd":"mg","action":"take","args":["Note: my sign-in"]}`; the note's text is in `getState`;
  `close` twice to leave.
- **Reload.** `{"cmd":"sync"}`, then `{"cmd":"eval","fn":"() => { location.reload(); return true; }"}`,
  wait about 15 s, then `{"cmd":"bootstrap","tutorial":"decline"}`. The player starts in the lobby.
  The needs system restarts: every owner is back at the desk and their clocks start again when
  their rooms load.

## Run 1: T1 to T5, then T11 (new game)

Room layout: `lobby` (start) with Dana north, Ian east, Priya south and the hot desk west. Omar is
north of Dana, Kai east of Ian, Mei south of Priya, Tom west of the hot desk. Every beat room has a
sign; read it first.

### 1. T1 Owner present

Room: `dana_room`, PC `dana_pc` (owner Dana Reyes, `lockChance: 0`, no policy).

1. Go straight to `dana_room` (Dana gets up about 50 s after you enter). Read `sign_t1`.
2. `toasts`, `drain`, `moveToNear` `dana_pc`, `interact` `dana_pc`, `toasts`. Expect the toast
   "Dana Reyes is using this PC." followed by the PC's observation, no minigame, and in `drain` a
   `pc_in_use` event and no `workstation_*` event. Task `t1_owner_present` complete (only while the
   player has never signed in at `dana_pc`: `signedInBefore` false).

Server record afterwards: no session.

### 2. T2 Owner away, `lockChance: 0`

1. Read `sign_t2`. Wait for `npc_left_post:dana`. `drain`, then `interact` `dana_pc` while she is at
   the coffee machine. Expect her desktop: "Signed in as Dana Reyes (dreyes)", "Staff notice.txt"
   and "Q3 forecast.txt". In `drain`: `workstation_owner_left:dana_pc` (`screenLocked` false),
   `workstation_accessed:dana_pc`, and `pc_signed_in` with `via: "claim"`.
   **H3:** `screenTransitions()` has no `dana_pc` entry (her screen stayed open, so nothing
   changed and nothing sounded), and `workstation('dana_pc')` has `lockedLook` false.
2. `take` "Q3 forecast.txt" and Copy it: it stays listed and joins the inventory. Task
   `t2_claim_and_copy` complete (a copy of the forecast from `dana_pc` during the first claim
   there). Leave the desktop open.

Server record afterwards: `sessions 1: dana_pc = dana (claim)`; `signedInPcs` has `dana_pc`;
`copiedItems 1: dana_forecast`.

### 3. T3 Owner returns

1. Wait for `npc_returned_post:dana` (about 45 s at the machine, then the walk). The open desktop
   closes with the toast "Dana Reyes is back at the desk". `drain`: `workstation_owner_returned:dana_pc`
   and `pc_signed_out` with `reason: "owner_returned"`. Task `t3_owner_returns` complete (only for
   the end of the first claim at `dana_pc`). **H3:** still no `dana_pc` entry in
   `screenTransitions()`.
2. `interact` `dana_pc`: "Dana Reyes is using this PC." again (`t1` does not complete again: the
   PC has been signed in at).

Server record afterwards: `sessions` without `dana_pc`; `signedInPcs` still has `dana_pc`.

### 4. T4 `lockChance: 1`

Room: `ian_room`, PC `ian_pc` (owner Ian Shaw, `lockChance: 1`).

1. Go to `ian_room` (back through the lobby). Read `sign_t4`. Read "Note: my sign-in" in
   `ian_drawer` (Ian's username and password) while Ian is still at his desk. **H3:** note
   `workstation('ian_pc')`: its `texture`, `displayWidth` and `displayHeight`, and `lockedLook`
   false.
2. `moveToNear` `ian_pc`. Wait for `npc_left_post:ian`. **H3:** before any click,
   `screenTransitions()` has one `ian_pc` entry, `locked: true` with `sound: "lockpick_set"`, and
   `workstation('ian_pc')` has `lockedLook` true with the same `texture` and display size as in
   step 1. `drain`, `interact` `ian_pc`: the sign-in
   screen. `drain`: `workstation_locked_attempt:ian_pc` and `pc_signin_shown` with
   `reason: "locked"`; no `pc_signed_in`.
3. Choose Ian's tile and submit the password from the note: his desktop. Task `t4_lock_chance_1`
   complete. **H3 (UNCONFIRMED in the running game, expected from the rule):** a password session
   hides the locked look, silently: `lockedLook` is now false and the newest `ian_pc` transition
   is `locked: false` with `sound: null`. From here on `ian_pc` shows no locked look in this game,
   so Ian's leave and return with sounds are checked in Run 2 (step "H3 Ian"), not here.
4. Leave the desktop open and wait for `npc_returned_post:ian`: the desktop stays open and
   `window.__test.access.sessions()` still has `ian_pc` (a password session is not ended by the
   owner's return). Close it, `toasts`, `interact` `ian_pc`: "Ian Shaw is using this PC."

Server record afterwards: `sessions` has `ian_pc = ian (password)`, kept after his return.

### 5. T5 `autoLockMin: 0`

Room: `priya_room`, PC `priya_pc` (owner Priya Nair, `lockChance: 0`, policy `instant_lock`).

1. Go to `priya_room`. Read `sign_t5`. `moveToNear` `priya_pc`. Wait for `npc_left_post:priya`.
2. `drain`, `interact` `priya_pc`: the sign-in screen, no desktop. `drain`:
   `workstation_owner_left:priya_pc` with `screenLocked` true (the policy locked it in the leave
   roll, although her `lockChance` is 0), `workstation_locked_attempt:priya_pc`, and no
   `pc_signed_in`. Task `t5_auto_lock_0` complete. Close the screen.

Server record afterwards: no `priya_pc` session.

### 6. T11 Reload

Ian is signed in at `ian_pc` (T4).

1. Go back to `dana_room`. Read `sign_t11`. Wait for Dana's next `npc_left_post:dana` (about two
   minutes after she came back in T3), then `interact` `dana_pc`: her desktop by a claim. Close it.
   `window.__test.access.sessions()` lists `dana_pc` (claim) and `ian_pc` (password).
2. Before she comes back (she is away about 50 s): `sync`, reload, `bootstrap`.
3. `window.__test.access.sessions()` lists only `ian_pc`: the claim at `dana_pc` ended on load
   (`pc_signed_out` with `reason: "claim_ended"`; it fires while the page loads, so `drain` shows it
   only when the bridge's event log was installed in time) and the server record has no `dana_pc`.
4. Go to `dana_room` and `interact` `dana_pc`: "Dana Reyes is using this PC." (every owner is back
   at the desk after a reload).
5. Go to `ian_room`. Wait for `npc_left_post:ian` (about 50 s after the room loads), then
   `interact` `ian_pc`: Ian's desktop opens with no password. `drain`: `pc_desktop_opened` with
   `restored: true`. Task `t11_reload` complete; `t2` stays complete.

Server record afterwards: `sessions 1: ian_pc = ian (password)` (no `dana_pc`); `signedInPcs`
unchanged (`dana_pc`, `ian_pc`).

At the end of Run 1: `sync`, the full `verify-run.rb <game_id>`, the leak check over the whole
file, `quit`. Tasks `t1` to `t5` and `t11` complete; `t6` to `t10` stay open (Run 2).

## Run 2: T6 to T10, reload after T7 (new game)

### 7. T6 `autoLockMin: 5`

Room: `omar_room` (north of `dana_room`), PC `omar_pc` (owner Omar Haddad, `lockChance: 0`, policy
`corp_default`). His coffee takes ten minutes, so he stays away.

1. Go to `omar_room` through `dana_room`. Read `sign_t6`. `moveToNear` `omar_pc`. Wait for
   `npc_left_post:omar`, then `interact` `omar_pc`: his desktop by a claim. Leave it open.
   **H3:** `screenTransitions()` has no `omar_pc` entry yet (he left his screen open), and note
   `workstation('omar_pc')`: `texture`, display size, `lockedLook` false.
   `window.__test.access.workstation('omar_pc')` shows `lockAt` (the needs clock at his leave plus
   300000 ms).
2. Manual clock (exercised, not earned): `{"cmd":"eval","fn":"() => window.__test.needs.setManualClock(true)"}`,
   then `{"cmd":"eval","fn":"() => window.__test.needs.step(240000)"}`. Four game minutes later the
   desktop is still open and the session is still listed.
3. `toasts`, `drain`, then `{"cmd":"eval","fn":"() => window.__test.needs.step(60000)"}`: the desktop
   closes with the toast "The screen locked". `drain`: `workstation_auto_locked:omar_pc` and
   `pc_signed_out` with `reason: "auto_locked"`. Task `t6_auto_lock_5` complete.
   **H3:** `screenTransitions()` now has exactly one `omar_pc` entry, `locked: true` with
   `sound: "lockpick_set"` (you are in his room); `lockedLook` is true; `texture` and the display
   size are unchanged.
4. `interact` `omar_pc`: the sign-in screen (`pc_signin_shown` with `reason: "locked"`). Close it.
5. Hand the clock back: `{"cmd":"eval","fn":"() => window.__test.needs.setManualClock(false)"}`.

Server record afterwards: `sessions` had `omar_pc = omar (claim)` after step 1 and has no
`omar_pc` after step 3; `signedInPcs` has `omar_pc`.

### H3 Ian: leave and return before any sign-in

Room: `ian_room`, on the way to `kai_room`. Run 2 never signs in at `ian_pc`, so its screen
follows Ian. This takes about two minutes. Do not click `ian_pc` and do not sign in.

1. Enter `ian_room` from the lobby. At once note `workstation('ian_pc')`: `texture`, `displayWidth`,
   `displayHeight`, `lockedLook` false. Note how many entries `screenTransitions()` has for
   `ian_pc` (none).
2. Wait for `workstation_owner_left:ian_pc`
   (`{"cmd":"waitFor","kind":"event","name":"workstation_owner_left:ian_pc","timeoutMs":90000}`,
   `cmd.sh` timeout 100): `data.screenLocked` is true. Then: one new `ian_pc` transition,
   `locked: true`, `sound: "lockpick_set"`; `lockedLook` true; `texture` and display size as in
   step 1.
3. Wait for `workstation_owner_returned:ian_pc` (same form, about 50 s): `data.wasLocked` is true.
   Then: one more `ian_pc` transition, `locked: false`, `sound: "ui_confirm"`; `lockedLook` false;
   `texture` and display size as in step 1. Two `ian_pc` transitions in all.

Stepping the manual clock in T6 moves every owner's clock; if Ian's room was loaded then (it is
not on this route), count his transitions from the number noted in step 1. One large
`needs.step` runs all its ticks in the same instant with no frames between, so an owner whose
arrival was queued can return and leave again milliseconds apart (the H3 run saw Ian unlock and
relock 28 ms apart during a 60 s step). That is a stepping artefact, not a fault. Where a step
needs the owners to behave as in play, step in chunks of 5 s or less with a short real wait
between them.

### 8. T7 Knocked out

Room: `kai_room` (east of `ian_room`), PC `kai_pc` (owner Kai Brennan, `lockChance: 0`).

1. Go on to `kai_room`. Read `sign_t7`. `drain`, then
   `{"cmd":"debugKO","id":"kai"}` while Kai is at his desk (exercised, not earned).
2. `drain`: `workstation_owner_left:kai_pc` with `reason: "ko"` and `screenLocked` false.
3. `moveToNear` `kai_pc`, `interact`: Kai's desktop by a claim. Task `t7_knocked_out` complete.
   Close it. He stays down, so the claim lasts.

Server record afterwards: `sessions 1: kai_pc = kai (claim)`.

### Reload (after T7)

1. `sync`, reload, `bootstrap`. `window.__test.access.sessions()` is empty: the claim at `kai_pc`
   ended on load (`pc_signed_out` with `reason: "claim_ended"`, as in T11).
2. Go back to `kai_room`: Kai is still down (`window.npcHostileSystem.isNPCKO('kai')` true).
   `interact` `kai_pc`: the sign-in screen (Kai is not present and has no away record, so no
   claim). `window.__test.access.workstation('kai_pc')` shows `present: false`, `away: null`.
   Close it.

Server record afterwards: no sessions; `signedInPcs` has `omar_pc` and `kai_pc`.

### 9. T8 Hidden

Room: `mei_room` (south of `priya_room`), PC `mei_pc` (owner Mei Lin, `lockChance: 0`).

1. Go to `mei_room` through the lobby and `priya_room`. Read `sign_t8`.
2. `converse` with `mei`, choosing "duck out": she disappears from view at her desk
   (`mei_hidden` true).
3. `drain`, `moveToNear` `mei_pc`, `interact`: the sign-in screen and no claim. `drain`:
   `pc_signin_shown` with `reason: "signin"`, and no `workstation_*` event. Task `t8_hidden`
   complete. Close it.

Server record afterwards: no `mei_pc` session.

### 10. T9 Removed

Room: `tom_room` (west of `hot_desk_room`), PC `tom_pc` (owner Tom Fletcher, `lockChance: 0`).

1. Go to `tom_room` through the lobby and `hot_desk_room`. Read `sign_t9`.
2. `converse` with `tom`, choosing "wanted somewhere": he leaves the scene (`tom_removed` true).
3. `drain`, `moveToNear` `tom_pc`, `interact`: as T8, the sign-in screen, no claim, no
   `workstation_*` event, `pc_signin_shown` with `reason: "signin"`. Task `t9_removed` complete.
   Close it.

Server record afterwards: no `tom_pc` session.

### 11. T10 Unowned PC

Room: `hot_desk_room`, PC `hot_desk` (no owner, no policy).

1. Read `sign_t10`. `drain`, `moveToNear` `hot_desk`, `interact`: the sign-in screen, no claim, no
   `workstation_*` event. `window.__test.access.workstation('hot_desk')` shows `owner: null`, so
   no desk light shows on it (`lighting.js` lights only an owned workstation's desk). Task `t10_unowned` complete. Close it.
   **H3:** `hot_desk` is unchanged: `lockedLook` false, and `screenTransitions()` has no
   `hot_desk` entry at any point in the run.

Server record afterwards: no session.

At the end of Run 2: `sync`, the full `verify-run.rb <game_id>`, the leak check over the whole
file, `quit`. Tasks `t6` to `t10` complete; `t1` to `t5` and `t11` stay open (Run 1).

## H3: screen states in the other scenarios

The H3 run of the lab follow-up: two short games, one here and one on `test_needs_sims`. It checks
that the lock and unlock sounds and the `lockedLook` flag follow every owned workstation, that no
other scenario's art changed, and that the drop label shows. Use the setup at the top of this file
(a new game each, its own scratch folder), mark each numbered check PASS or FAIL, and end each game
with `sync`, the full `verify-run.rb <game_id>`, the leak check and `session-stop.sh`. Send one
command at a time; `waitFor` on a global takes `"expected"`.

Helper, used throughout (replace the id):
`{"cmd":"eval","fn":"() => ({ pc: window.__test.access.workstation('ian_pc'), transitions: window.__test.access.screenTransitions() })"}`

### H3a. `test_access_sessions` (new game, about 8 minutes)

Do not sign in with a password anywhere in this game: a password session hides the locked look at
that PC from then on.

1. **Ian (`ian_room`, east of the lobby).** Go there first and do "H3 Ian" above, steps 1 to 3.
2. **Dana (`dana_room`, north of the lobby).** Do beat 1 (T1) step 2, beat 2 (T2) step 1 and beat
   3 (T3) step 1 with their **H3** lines: the claim works, and there is never a `dana_pc`
   transition. The file copy in T2 step 2 is not needed.
3. **Omar (`omar_room`, north of `dana_room`).** Do beat 7 (T6) steps 1 to 5 with their **H3**
   lines: no transition on his leave, exactly one (`locked: true`, `lockpick_set`) when the auto
   lock fires.
4. **Hot desk (`hot_desk_room`, west of the lobby).** Do beat 11 (T10) with its **H3** line.
5. Last, read `screenTransitions()` once more. It holds only `ian_pc` and `omar_pc` entries
   (Priya's room was never loaded; if you passed through it, a `priya_pc` locked entry on her
   leave is correct and is not a failure). No entry has a sound other than `lockpick_set`,
   `ui_confirm` or null.

Tasks `t1`, `t3`, `t6` and `t10` complete; that is expected and is not what this run checks.

### H3b. `test_needs_sims` (new game, about 4 minutes)

```bash
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_needs_sims
```

Start the session as in the setup, then
`{"cmd":"bootstrap","tutorial":"decline","resume":"new","autoBrief":true}`. You start in `office`,
where Amara Okoye's PC `amara_pc` is. She locks her screen every time she leaves.

1. At once: `workstation('amara_pc')`: note `texture`, `displayWidth`, `displayHeight`;
   `lockedLook` false. `screenTransitions()` is empty.
2. The drop label. Two start items are droppable ("Parcel for Amara", "Dirty Mugs"). Read the
   hover labels:
   `{"cmd":"eval","fn":"() => [...document.querySelectorAll('.inventory-item')].map(img => { img.dispatchEvent(new MouseEvent('mouseenter')); const t = document.getElementById('hud-info-label')?.textContent; img.dispatchEvent(new MouseEvent('mouseleave')); return t; })"}`
   They read "Parcel for Amara (click to drop)" and "Dirty Mugs (click to drop)". Items that are
   not droppable keep their plain names. Do not drop anything yet: a dropped parcel changes what
   Amara does.
3. Stay in `office`. Wait for
   `{"cmd":"waitFor","kind":"event","name":"workstation_owner_left:amara_pc","timeoutMs":240000}`
   (`cmd.sh` timeout 250; how long she takes to leave is UNCONFIRMED): `data.screenLocked` is true.
   Then one `amara_pc` transition, `locked: true`, `sound: "lockpick_set"`; `lockedLook` true;
   `texture` and display size exactly as in step 1.
4. If she returns within two minutes (`workstation_owner_returned:amara_pc`, `wasLocked` true): a
   second `amara_pc` transition, `locked: false`, `sound: "ui_confirm"`, and the same `texture`
   and size. If she does not, say so and stop there; step 3 is the required check.

If the other owners in the room (`sanjay_pc`, `tom_pc`) leave during the run, their transitions
follow the same rule (a locked entry with the lock sound when the screen locks, none when it stays
open). Record them; they are not failures.

## Why each task completes only from its own beat

Every task is completed by one of Rob's event mappings (the front desk, `lobby`):

| Task | Event and condition | Why no other beat fires it |
|---|---|---|
| `t1_owner_present` | `pc_in_use` at `dana_pc`, `signedInBefore` false | T3 and T11 click `dana_pc` with Dana present only after a sign-in there (T2), so `signedInBefore` is true |
| `t2_claim_and_copy` | the forecast copied from `dana_pc` while `t2_first_claim_open` (set by the first claim there, cleared when it ends) | T11's claim is not the first at `dana_pc`, so a copy then does not count |
| `t3_owner_returns` | `pc_signed_out` at `dana_pc`, `reason: "owner_returned"`, `firstAtPc` true | the only owner-returned end of the first session at `dana_pc`; T11 ends its claim by a reload |
| `t4_lock_chance_1` | `pc_signed_in` at `ian_pc` by Ian's password | no other beat signs in at `ian_pc` (T11 reopens his kept session, which is not a sign-in) |
| `t5_auto_lock_0` | `workstation_locked_attempt:priya_pc` | `priya_pc` has `lockChance: 0`; only its policy locks it |
| `t6_auto_lock_5` | `pc_signed_out` at `omar_pc`, `reason: "auto_locked"` | the only PC under a policy with `autoLockMin` above 0 |
| `t7_knocked_out` | `pc_signed_in` at `kai_pc` by a claim after `workstation_owner_left:kai_pc` with `reason: "ko"` | Kai does not get up on his own during the runs, and a knock-out is the only `ko` leave |
| `t8_hidden` | `pc_signin_shown` at `mei_pc`, `reason: "signin"`, `mei_hidden` | only Mei's ink sets `mei_hidden` |
| `t9_removed` | `pc_signin_shown` at `tom_pc`, `reason: "signin"`, `tom_removed` | only Tom's ink sets `tom_removed` |
| `t10_unowned` | `pc_signin_shown` at `hot_desk`, `reason: "signin"` | the only unowned PC |
| `t11_reload` | `pc_desktop_opened` at `ian_pc`, `restored` true | only a session kept over a reload is `restored` |

## Earned secrets

| Secret | In-game source | Used in |
|---|---|---|
| Ian's username and password | "Note: my sign-in" in `ian_drawer`, `ian_room` | T4 |

No other password is typed: T2, T6, T7 and T11 open the owner's session by a claim. T6's clock
moves (`setManualClock`, `step`) and T7's knock-out (`debugKO`) are exercised, not earned.

## Expected validator output

`LANG=C.UTF-8 ruby scripts/validate_scenario.rb scenarios/test_access_sessions/scenario.json.erb`
is clean: no errors and no warnings (every `lockChance` is 0 or 1 and no policy sets
`maxAttempts`). It prints the needs timing lines, the identity reach lines and the generic
suggestions every small test scenario gets.

## Timing and harness notes (from the 2026-11-09 Haiku runs)

- `npc_left_post:<owner>` fires when the owner decides to leave, while they are still walking away. Wait a few seconds, or until they are out of range, before clicking their PC: otherwise the click can land on the owner and open a conversation instead.
- A sign opens a game-display dialog: close it with its close button (`dismiss` with label `×`); Escape and an unlabelled dismiss are ambiguous.
- Stepping the needs manual clock moves every owner's clock, so other owners may leave and return during T6. No assertion depends on them.
- Do not run `drain` with its output discarded: it empties the bridge event buffer (events are still in the session log).
