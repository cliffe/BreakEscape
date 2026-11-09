# test_access_signin: scripted playtest (S1 to S8)

The scripted runs for access model step 8 (`docs/achitechture/ACCESS_MODEL_PLAN.md`, "How the
slice is tested" and step 8's beat table). Two runs, each with its own new game, to stay within 10
to 15 minutes: **Run A** is S1 to S4 and then a reload; **Run B** is S5 to S8 (S8 is that run's
reload). After every beat, check what is on screen, what the server recorded and what reached the
browser.

The scenario is for testing, not play. Every password the runs type is read from its in-game
source first (see "Earned secrets" at the end); none is written here or on a sign.

## Setup (each run)

Keyless server on :3001 (never touch :3000). In a container, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` and pass `--headless`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_signin
S=<scratchpad>/test_access_signin-haiku
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/test_access_signin-<run>-responses.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

The two checks after every beat:

```bash
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/test_access_signin-<run>-responses.jsonl
```

The leak check must say `VERDICT: no leaks found` after every beat. Compare the `sessions`,
`signedInPcs`, `copiedItems`, `loginFailures` and `loginLockouts` lines with the record each beat
expects below. `signedInPcs` lists every PC the player has ever signed in at in this game, not the
PCs signed in now: a PC stays in it after Sign out. The sessions open now are the `sessions` line. `{"cmd":"eval","fn":"() => window.__test.access.sessions()"}` shows the sessions the
browser holds; they should match the server's `sessions` line.

## Harness notes for this scenario

- **The sign-in screen.** `interact` on a PC opens it (or the desktop, when the browser holds a
  session there). `{"cmd":"mg","action":"getState"}` has a `signIn` block: `tiles` (username and
  display name), `selected`, `otherUser`, `current` (the account signed in now, on Switch user) and
  `message` (the server's answer). Choose a tile with `{"cmd":"mg","action":"clickText","args":["Sam Okafor"]}`
  or `["Other user"]`. With a tile chosen the only field is the password:
  `{"cmd":"mg","action":"type","args":[0,"<password>",{"submit":true}]}`. With Other user, or on
  Ian's PC (no tiles), field 0 is the username and field 1 the password:
  `{"cmd":"mg","action":"type","args":[0,"<username>"]}` then
  `{"cmd":"mg","action":"type","args":[1,"<password>",{"submit":true}]}`.
- **The sticky note** on the hot desk is shown on its sign-in screen (it is in the `getState`
  text); it is Sam's password's in-game source.
- **The desktop** loads from the server, so wait about 2 s after `interact` before reading it.
  `getState` then has `signedInAs`, the desktop `items`, and `transferDialog` while the Copy / Move
  dialog is open. Its header buttons: `{"cmd":"mg","action":"clickText","args":["Switch user"]}` and
  `["Sign out"]`.
- **Copy and Move.** `{"cmd":"mg","action":"take","args":["Server rota.txt"]}` on a takeable file
  opens the dialog (the reply says "took", but nothing is taken until you choose). Then
  `clickText` `["Copy to inventory"]`, `["Move to inventory"]`, `["Open"]` or
  `["Cancel",{"exact":true}]`.
- **Reading a desktop file** that is not takeable (the staff handbook): `take` opens the viewer.
  Closing the viewer goes back to the world, not the desktop; `interact` the PC again.
- **The archive.** `take` "Old configs.zip" opens a password box; `{"cmd":"lock","code":"<archive password>"}`.
  The reply can say `ok:false` because the archive's own window opens straight away; check that
  `getState` shows `containerName` "Old configs.zip" and `router_backup.txt` in `items`.
- **Ian's drawer.** `interact` `ian_drawer`, wait about 2 s, then
  `{"cmd":"mg","action":"take","args":["Note: my sign-in"]}`; the note opens in the notepad (its text
  is in `getState`); close it once to return to the drawer, and again to leave.
- **Toasts.** `{"cmd":"toasts"}` shows "Signed out" and "Locked out: This account is locked on this
  PC." when they fire.

## Run A: S1 to S4, then a reload

Room layout: `lobby` (start) with the hot desk room north, the IT office east, the known-people
room south and the lockout room west. Finance is east of the IT office. Every beat room has a sign;
read it first.

### 1. S1 Account tiles

Room: `hot_desk_room`, PC `hot_desk` (unowned, `loginPicker: "accounts"`, policy `corp_default`).

1. Read `sign_s1`. `interact` `hot_desk`. Expect tiles for Sam Okafor, Ian Shaw and Lena Fox, plus
   Other user; each tile shows a portrait (closed-mouth frame), the display name and the username.
2. Choose Sam's tile and submit a wrong password. Expect the message "Incorrect username or
   password. 4 attempts left." and the screen still open.
3. Read Sam's password from the sticky note on the screen, and submit it. Expect the desktop:
   header "Signed in as Sam Okafor (sokafor)" with Switch user and Sign out; items "Staff
   handbook.txt" and "Mail" only (none of Ian's files). Task `s1_account_tiles` complete. It
   completes only on the first sign-in at `hot_desk` in the game (Sam's, `firstAtPc`), so a later
   sign-in as Sam there (S7 step 5) does not complete it.

Server record afterwards: `sessions 1: hot_desk = sam (password)`; `signedInPcs` has `hot_desk`;
`loginFailures 0` (the sign-in cleared Sam's failure there).

### 2. S2 Known people only

Room: `known_room`, PC `known_pc` (`loginPicker: "known"`). Do this before going anywhere near
finance (east of the IT office).

1. Read `sign_s2`. `interact` `known_pc`. Expect a tile for Sam only (plus Other user): no Lena,
   and no Ian yet either. Close the screen (`{"cmd":"mg","action":"close"}`).
2. Walk `lobby`, `it_room`, `finance_room` (Lena Fox is there), then back to `known_room`.
3. `interact` `known_pc` again: Lena's tile is there now (and Ian's). Task `s2_known_people`
   complete. Close the screen.

Server record afterwards: no change.

### 3. S3 Typed username and the access list

Room: `it_room`, PC `ian_pc` (`loginPicker: false`, `access: { roles: ["it"] }`).

1. Read `sign_s3`. Open `ian_drawer` and read "Note: my sign-in": Ian's username and password.
2. `interact` `ian_pc`. Expect no tiles, only the username and password fields.
3. Type Sam's username and his correct password (from the hot desk's sticky note). Expect "This
   account can't sign in on this PC." and the screen still open.
4. Type Ian's username and password. Expect his desktop: the staff handbook and mail, then "Server
   rota.txt", "VPN notes.txt", "Licence keys.csv" and "Old configs.zip". Task `s3_ian_pc` complete.

Server record afterwards: `sessions` adds `ian_pc = ian (password)`; `signedInPcs` gains `ian_pc`;
`loginFailures 0` (the refusal for Sam was not counted).

### 4. S4 One profile, two PCs, and switching

Room: `hot_desk_room`, Sam still signed in at `hot_desk`.

1. Read `sign_s4`. `interact` `hot_desk`: Sam's desktop opens with no password.
2. Switch user. The sign-in screen shows `current` Sam. Choose Ian's tile, submit a wrong
   password: "Incorrect username or password. 4 attempts left."
3. Close the screen: Sam's desktop comes back (he is still signed in). Switch user again.
4. Choose Ian's tile and submit his password. Expect Ian's desktop with the same files as on
   `ian_pc`. Task `s4_switch_user` complete. It completes only on a switch from Sam to Ian at
   `hot_desk` (`previousNpcId` Sam); Ian signing in there with no one signed in does not.

Server record afterwards: `sessions: hot_desk = ian (password); ian_pc = ian (password)`;
`loginFailures 0` (Ian's success cleared his failure there).

### Reload (end of Run A)

`{"cmd":"sync"}`, then `{"cmd":"eval","fn":"() => { location.reload(); return true; }"}`, wait about
15 s, then `{"cmd":"bootstrap","tutorial":"decline"}`. After a reload the player starts in the
lobby, wherever they were before, so walk back to a PC before opening it. Check:

- `window.__test.access.sessions()` still lists `hot_desk` and `ian_pc`, both Ian, by password;
- `hot_desk` opens Ian's desktop without a password;
- tasks `s1` to `s4` are still complete;
- `verify-run.rb --access` shows the same `sessions` and `signedInPcs` as before the reload.

Then `{"cmd":"sync"}`, the full `verify-run.rb <game_id>`, the leak check over the whole file, and
`{"cmd":"quit"}`.

## Run B: S5 to S8 (new game)

Set-up for this run (exercised, not a beat): read Ian's note in `ian_drawer`, sign Ian in at
`ian_pc` (S3 step 4), then go to the hot desk and sign Ian in there through his tile. The set-up
completes `s3_ian_pc`. Signing Ian in at the hot desk with no one signed in there is not a switch,
so `s4_switch_user` stays open, and it is the first sign-in at the hot desk, so Sam's sign-in there
in S7 does not complete `s1_account_tiles`.

### 5. S5 Copy and Move

Room: `hot_desk_room`, Ian signed in at `hot_desk`.

1. Read `sign_s5`. On Ian's desktop, `take` "Licence keys.csv": the dialog offers Open, Copy to
   inventory and Cancel only (no Move). Cancel.
2. `take` "Server rota.txt": Open, Copy to inventory, Move to inventory, Cancel. Copy it. The file
   stays on the desktop; it is now in the inventory. `take` it again: the dialog offers Open and
   Cancel only. Cancel.
3. `take` "VPN notes.txt" and Move it: it leaves the desktop and joins the inventory. Task
   `s5_copy_and_move` complete.
4. Close the desktop and open it again: the rota is listed, the VPN notes are not. Then open
   `ian_pc` (IT office): the same, the rota listed and the VPN notes gone.

Server record afterwards: `copiedItems 1: ian_rota`; both files in the inventory (full
`verify-run.rb`).

### 6. S6 Locked folder and sign out

Room: `hot_desk_room`, Ian signed in at `hot_desk`.

1. Read `sign_s6`. On Ian's desktop, `take` "Staff handbook.txt" and read the archive password in
   it. `interact` `hot_desk` again.
2. `take` "Old configs.zip" and enter the handbook's password: the archive opens and lists
   `router_backup.txt`. Close it.
3. `interact` `hot_desk`, then Sign out. The desktop closes and the toast says "Signed out". Task
   `s6_archive_and_sign_out` complete (only on the Sign out button with Ian signed in, not on a
   Switch user).
4. `interact` `hot_desk` again: the sign-in screen, not the desktop. Close it.

Server record afterwards: `hot_desk` gone from `sessions` (`ian_pc` stays); `ian_archive` in
`unlockedObjects` (full `verify-run.rb`).

### 7. S7 Lockout

Room: `lockout_room`, PC `lockout_pc` under `corp_default` (`maxAttempts: 5`).

1. Read `sign_s7`. `interact` `lockout_pc`, choose Sam's tile, and submit five wrong passwords.
   Expect "4 attempts left", "3 attempts left", "2 attempts left", "1 attempt left", then "This
   account is locked on this PC." and the screen closes (toast "Locked out").
2. Open it again, choose Sam, submit his correct password: the same "This account is locked on this
   PC."
3. Open it again, choose Other user, and type an invented username (for example `nobody`) with five
   wrong passwords: exactly the same sequence, ending locked.
4. Open it again, choose Ian's tile and submit his password: his desktop opens. Task `s7_lockout`
   complete. Close it.
5. Go to the hot desk and sign in as Sam with his password: it works there (the lockout is only on
   `lockout_pc`). Sign out again.

Server record afterwards: `loginLockouts 2: lockout_pc|sokafor; lockout_pc|nobody`;
`sessions` has `lockout_pc = ian (password)`.

### 8. S8 Reload

Ian signed in at `ian_pc` (since the run's set-up).

1. Read `sign_s8`. `{"cmd":"sync"}`, then reload as in Run A and `bootstrap`. The player starts in
   the lobby.
2. Go to the IT office and `interact` `ian_pc`: Ian's desktop opens without a password. Task
   `s8_reload` complete; task `s3_ian_pc` still complete.
3. Go to `lockout_pc` and `interact` it: Ian's session there (from S7 step 4) is kept over the
   reload, so his desktop opens first. Switch user, choose Sam and submit his correct password:
   still "This account is locked on this PC." Ian stays signed in there.

Server record afterwards: `sessions`, `signedInPcs` and `loginLockouts` unchanged from before the
reload.

At the end: `{"cmd":"sync"}`, the full `verify-run.rb <game_id>`, the leak check over the whole
file, and the report (each step's result with its session log lines, the earned-secrets table and
both checks per beat). In Run B, tasks `s5` to `s8` complete; `s3` completes in the set-up;
`s1`, `s2` and `s4` stay open (their beats are in Run A).

## Earned secrets

| Secret | In-game source | Used in |
|---|---|---|
| Sam's password | The sticky note on the hot desk's sign-in screen | S1, S3 (refused there), S7, S8 |
| Ian's username and password | "Note: my sign-in" in `ian_drawer`, IT office | S3, S4, Run B set-up, S7 |
| The archive password | "Staff handbook.txt" on any staff desktop | S6 |

Wrong passwords and the invented username are made up by the tester. Nothing is set from the
console; the reload is a page reload.

## Expected validator output

`ruby scripts/validate_scenario.rb scenarios/test_access_signin/scenario.json.erb` (with
`LANG=C.UTF-8`) is clean apart from two expected warnings: the `maxAttempts` lockout warning on
`hot_desk` and on `lockout_pc` (both under `corp_default`). It also prints the identity reach lines
and the generic suggestions every small test scenario gets.
