# test_access_habits: scripted playtest (H1 to H9)

The scripted runs for access model slice 9.1 (`docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md`,
section 11). Three runs, each with its own new game: **Run 1** is H1 to H5, with a reload after
H3; **Run 2** is H6 to H8, with the reload inside H8; **Run 3** is H9 (holds doors, slice 9.1
step 5). After every beat, check what is on screen, what the server recorded and what reached the
browser.

This file names who never locks and whose password is on a note. It is for regression testers,
never for a tester playing blind. No password is written here or on a sign: the three a run types
(Omar's, Mei's, Tom's) are earned in the game (see "Earned secrets").

## Setup (each run)

Keyless server on :3001 (never touch :3000). In a container, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` and pass `--headless`. The mission row
must exist (`db:seed` in standalone Break Escape, or publish this one mission).

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_habits
S=<scratchpad>/test_access_habits-regress
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/test_access_habits-<run>-responses.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

The two checks after every beat:

```bash
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/test_access_habits-<run>-responses.jsonl [more.jsonl ...]
```

The leak check must say `VERDICT: no leaks found` after every beat. If a run continues in a second
capture file after a reload, give both files, in order. The `habits` block of `verify-run.rb`
lists each NPC's habits and `screenHabit` as saved, and each owned PC's own lock field, whether
the server's claim check calls it "always locks" (`alwaysLocks`) and whether it shows a note
(`hasPostit`).

A lock is checked in two places. `window.__test.access.screenTransitions()` records the picture
change (`sound` is null: office life's lock cues own the sound). `window.npcOfficeVisuals.cueLog`
(read from `window`; the bridge has no wrapper) records the cue: `how: "leave"`, `locked: true`, a
`flash` or a `glyph`, and a `chime` whose `volume` is above 0 when the player stood in the room.
An open leave records neither. Do not name sound files or chime keys.

## How the owners behave

- Every desk owner has an account, starts at the desk and has one need, caffeine (decayPerMin
  30, urgentAt 40, initial 65): urgent about 50 seconds after their room first loads. Their coffee
  station is in their own room and takes 600 seconds, so once gone they stay gone ten minutes.
  Lena's station takes 20 seconds and restores 30, so she leaves about once a minute.
- `npc_left_post:<owner>` fires as the owner gets up. Wait until
  `window.__test.access.workstation(pcId).present` is false and a few seconds more before
  clicking the PC, or the click can land on the owner.
- A reload puts every owner back at the desk and restarts each owner's leave count, so a
  `sometimes` screen plays the same sequence again from its first leave.

## Expected validator output

```bash
LANG=C.UTF-8 ruby scripts/validate_scenario.rb scenarios/test_access_habits/scenario.json.erb
```

No errors and one expected warning: rfid `store_b_badge` is opened only through a careful guard's
gate into `store_b` (Sara, `holdsDoors` false), with no cloner and no keycard item, so the player
cannot get in. That is what H9 tests (the player never enters `store_b`); in a mission it would be
a soft-lock. Of this slice's lines, one suggestion: Lena locks `lena_pc`
"sometimes" from the medium preset (a seeded roll). The first slice's roll warning does not fire
(no PC authors a chance between 0 and 1), and no screen state mapping warning fires (H2's and H4's
PCs resolve to 1, H5's to 1 through `instant_lock`, and H1, H3 and H6 to H8 are on
`pc_signed_in`). The usual feature-scenario suggestions (VM launchers, music, a briefing and so
on) and the "Missing recommended" lines also print. The habits report shows:

- dana: level low (level from role front_desk); locksScreen never (preset), screenHabit lockChance
  0, read at dana_pc;
- ian, omar, mei, tom: level high, locksScreen always (preset), screenHabit lockChance 1;
- omar: writesDown true (by name), sticky note at omar_pc;
- priya: locksScreen never (preset), "priya_pc: the PC sets lockChance, habit not applied there"
  (no screenHabit is filled);
- kai: locksScreen never (preset), screenHabit lockChance 0, read at kai_pc;
- mei: password guessable (by name), backed; piece 1 of 3, word: mei_photo; piece 2 of 3,
  number: mei_calendar; piece 3 of 3, symbol: in the pattern clue; pattern clue at
  password_memo; the pattern clue must cover: 1 capital, 1 symbol, 3 pieces in order;
- lena: level medium, locksScreen sometimes (preset), screenHabit lockChance 0.5;
- tom: password reused (by name), same password as tom_locker, written in full at locker_note;
- gary: level low, holdsDoors true (preset), "holds the gate at rooms/gate_hall/doors/0 (into
  store_a)";
- sara: level high, holdsDoors false (preset), "gate.noHold at rooms/gate_hall/doors/1 (into
  store_b)".

The dungeon graph has an "unlocked screen" edge into `dana_pc`, "unlocked screen (roll)" into
`lena_pc`, "sticky note at omar_pc" into Omar's sign-in, three "clue" edges into Mei's sign-in and
"same password" from the locker into Tom's. None for Ian, Priya or Kai. Store B's door label
ends "gate: not held by sara"; Store A's has no gate line (Gary holds it, and nobody is listed as
not holding it).

## Run 1: H1 to H5, reload after H3

### H1 Never locks, level from a role

Room `dana_room`, PC `dana_pc` (Dana Reyes, `role: front_desk`, no awareness of her own;
`roles.front_desk.awareness` is `low`).

1. Go to `dana_room`, read `sign_h1`. No note picture on her monitor
   (`window.postitMarks.marks.has('dana_pc')` false).
2. Wait for her to leave. `workstation('dana_pc')`: `screenLocked` false, `lockedLook` false. No
   `dana_pc` transition and no `dana_pc` cue.
3. `interact` `dana_pc`: her desktop opens (a claim). Task `h1_never_locks` complete.

Server record: `sessions` has `dana_pc = dana (claim)`. Habits block: `npc dana locksScreen=never
screenHabit {"lockChance":0}`; `pc dana_pc owner dana no lock field alwaysLocks false hasPostit
false`.

### H2 Always locks

Room `ian_room`, PC `ian_pc` (Ian Shaw, `awareness: high`).

1. Go to `ian_room`, read `sign_h2`. Wait for him to leave.
2. `workstation('ian_pc')`: `screenLocked` true, `lockedLook` true, `texture`
   `pc_desktop_locked`. The newest `ian_pc` transition is `locked: true, sound: null`; the newest
   `ian_pc` cue is `how: "leave"`, `locked: true` with a flash or a glyph and a chime above 0.
3. `interact` `ian_pc`: the sign-in screen with no note. Task `h2_always_locks` complete. There is
   no way in.

Server record: no `ian_pc` session. Habits block: Ian `screenHabit {"lockChance":1}`; `pc ian_pc
... alwaysLocks true`.

### H3 Careful, with a sticky note

Room `omar_room`, PC `omar_pc` (Omar Haddad, `awareness: high`, `habits.writesDown: true`).

1. Go to `omar_room`, read `sign_h3`. The note picture is on his monitor from the start
   (`postitMarks.marks.has('omar_pc')` true); keep a screenshot. `interact` `omar_pc` while he
   sits there: "Omar Haddad is using this PC".
2. Wait for him to leave: the padlock shows (`lockedLook` true).
3. `interact` `omar_pc`: the sign-in screen shows the note ("<username> / <password>").
   `pc_signin_shown` (and `pc_signin_shown:omar_pc`) carried `hasPostit: true`, which sets the
   global `h3_note_seen`.
4. Press **Add to Notepad**: the notes minigame opens and the sign-in screen closes (existing
   behaviour for every note). Close it, `interact` `omar_pc` again (a second `pc_signin_shown` and
   `/login_accounts`), choose **Other user** and type the username and password from the note.
   Task `h3_sticky_note` complete (it needs `h3_note_seen`).

Server record: `sessions` has `omar_pc = omar (password)`. Habits block: `pc omar_pc owner omar
no lock field alwaysLocks true hasPostit true`. The leak check finds Omar's password only at
`postitNote` in the `/login_accounts` answers for `omar_pc`.

### Reload after H3

1. Reload. Every owner is back at the desk. `interact` `omar_pc`: "Omar Haddad is using this PC".
2. `window.__test.access.sessions()`: no `dana_pc` (the claim ended), `omar_pc` kept (a password
   session). The saved note is in the notebook.
3. Wait for Omar's next leave (about 50 seconds). `interact` `omar_pc`: his desktop opens with no
   password. **Switch user** shows the sign-in screen with the note again.

The leak check now also allows Omar's password in `savedNotes` of the `/scenario` answer after
the reload, because a `/login_accounts` answer carried it first. Nowhere else.

### H4 The PC's own field wins

Room `priya_room`, PC `priya_pc` (Priya Nair, `awareness: low`; the PC has `lockChance: 1`).

1. Wait for her to leave: locked, padlock. `interact` `priya_pc`: the sign-in screen, no note.
   Task `h4_pc_field_wins` complete.

Server record: no session. Habits block: `npc priya locksScreen=never screenHabit -` (nothing is
filled: the only PC she owns sets its own field, which wins, plan 5.2); `pc priya_pc owner priya
lockChance 1 alwaysLocks true`.

### H5 Policy beats habit

Room `kai_room`, PC `kai_pc` (Kai Brennan, `awareness: low`; the PC is under `instant_lock`,
`autoLockMin: 0`, and has no lock field).

1. Wait for him to leave: locked in the leave roll itself. `interact` `kai_pc`: the sign-in
   screen, and no claim. Task `h5_policy_wins` complete.

Server record: no session. Habits block: Kai `screenHabit {"lockChance":0}`; `pc kai_pc ...
no lock field alwaysLocks false` (the claim check's own test; the policy refuses the claim).

## Run 2: H6 to H8, reload inside H8

### H6 Guessable password

Room `mei_room`, PC `mei_pc` (Mei Lin, `awareness: high`, `password: guessable`,
`passwordPattern: password_memo`).

1. Read the framed photo (`mei_photo`), the wall calendar (`mei_calendar`) and the IT notice
   (`password_memo`). The photo's caption gives the pet's name, the calendar the year and the
   notice the rule: the name with a capital first letter, then the year, then the symbol it
   names. Every character of the password comes from one of the three.
2. Wait for her to leave, choose **Other user** at `mei_pc` and type her username (`mlin`; a
   username is not a secret) and the password worked out. It signs in at the first try. Task
   `h6_guessable` complete.

Server record: `sessions` has `mei_pc = mei (password)`; `loginFailures 0`.

### H7 Reused password

Room `tom_room`, PC `tom_pc` (Tom Fletcher, `awareness: high`, `password: reused`).

1. Read the note on the locker (`locker_note`). Open the gym locker (`tom_locker`, a password
   lock) with it.
2. Wait for Tom to leave, choose **Other user** at `tom_pc`, type `tfletcher` and the same code.
   Task `h7_reused` complete.

Server record: `tom_locker` in `unlockedObjects`; `sessions` has `tom_pc = tom (password)`.

### H8 Sometimes locks

Room `lena_room`, PC `lena_pc` (Lena Fox, `awareness: medium`, so `screenHabit` lockChance 0.5).
The PC's id is the roll's salt (`habit:lena_pc:<leaves>`, seed `test_access_habits`), chosen so
her first leaves are:

| Leave | Screen |
|---|---|
| 1 | open |
| 2 | open |
| 3 | locked |
| 4 | locked |

Read the leave number from `workstation('lena_pc').away.leaves`, not by counting what you see:
her clock starts when `lena_room` first loads, so on the way to Tom (H7) she may have left once
already. In the run of 2026-11-10 the tester arrived at leave 2 and saw open (2), locked (3),
locked (4), as the table says.

1. On her first leave the screen is open: `interact` `lena_pc` gives a claim. Task
   `h8_sometimes` complete. When she returns the claim ends.
2. Watch leaves 2 and 3: open, then locked (padlock, sign-in screen).
3. Reload. On her first leave after the reload the screen is open again (`away.leaves` 1): the
   sequence starts from its first entry.

Server record: a claim at `lena_pc` while she was away on leave 1, gone when she returned; none
after the reload until the next open leave.

## Run 3: H9 Holds doors

Room `gate_hall`, east of `kai_room`. Two gates, each `openRadius` 80 and `holdMs` 6000: north
into `store_a` for Gary Whitlock (`awareness: low`, so `holdsDoors` true) and south into `store_b`
for Sara Quinn (`awareness: high`, so `holdsDoors` false and the gate gets `noHold: ["sara"]`).
Each walks a loop: a 6 s dwell at the desk, the waypoint beside the door (its `unlockRoom`
action), then the store room and back. About 25 seconds a lap.

Set-up: a new game started in the hall, with Rowan (who holds the task mappings) carried in:

```bash
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb \
  test_access_habits --start-room gate_hall --carry-npc rowan
```

Record the gates' events by wrapping `window.eventDispatcher.emit` with `eval` (`door_gate_*`,
`room_entered*`), and sample each gate every 50 to 100 ms: whether it is open, the player's
distance from it (from `window.player.body.center`, the feet) and whether the player could pass
(`doorGates.openToPlayer(g) && !doorGates.blocksPlayer(g)`). The gates are
`[...window.doorGates.groups.values()]`, Gary's first. Spots below are feet positions for
`moveTo`. Sara and Gary walk about the hall, so an `interact` on the sign can land on one of them;
leave that chat with its last option and try again.

1. Read `sign_h9`.
2. **Gary holds the door.** Stand beside his door, feet (98,72), about 66 px from it. When it opens
   for him (`h9_a_opened`), `enter` `store_a`: `room_entered:store_a`. Go back with `enter`
   `gate_hall`.
3. **Sara does not, with the player near.** Stand within her radius, feet (40,232), about 52 px
   from her door. Her gate never opens while the player is there (every sample shut), and after
   5 s waiting she turns back (`door_gate_guard_turned_back` with `npcId: "sara"`, global
   `h9_sara_turned_back`) and tries again next lap.
4. **She goes through with the player clear.** Park outside her radius, feet (160,285), about
   108 px out. The gate opens for her (`h9_b_opened`). Walk in after her: the gate is never
   passable, it shuts as the player comes inside the radius, and `enter` `store_b` comes back
   `did-not-cross`.
5. **The refusal.** `interact` `door:gate_hall->store_b`: the toast "Access denied: this door only
   opens for authorised staff.", `door_gate_denied`, Sara's bark (in her conversation history as
   a bark for `door_gate_denied`) and task `h9_holds_doors` complete (it needs all three
   globals).
6. **No way past.** Walk into her shut door for 20 seconds: never open, no
   `room_entered:store_b`, and no further denial (a bump on a shut gate is silent).

Server record: `verify-run.rb --access` has `npc gary holdsDoors=true`, `npc sara
holdsDoors=false` and one gate line, `gate rooms/gate_hall/doors/1 (into store_b) openFor sara
noHold sara` (none for Gary's). Globals `h9_a_opened`, `h9_b_opened`, `h9_sara_turned_back`; task
`h9_holds_doors` completed. `store_b` may be in `unlockedRooms`: Sara's route unlocks it on the
server. The player never enters it. The leak check says `VERDICT: no leaks found`.

## Earned secrets

| Password | Earned from |
|---|---|
| Omar's | the sticky note on his sign-in screen (H3) |
| Mei's | the photo, the calendar and the IT notice (H6) |
| Tom's | the note on his gym locker (H7) |

Dana's, Ian's, Priya's, Kai's and Lena's are never typed.
