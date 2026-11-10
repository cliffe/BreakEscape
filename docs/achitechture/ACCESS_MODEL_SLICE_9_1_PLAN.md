# Access model slice 9.1: awareness and habits

Status: **design, 2026-11-10. Nothing here is built.** This plan replaces the sketch in section 9.1
of `docs/achitechture/ACCESS_MODEL_PLAN.md` and is complete without it. It builds on the first
slice (built, `ACCESS_MODEL_BUILD_LOG.md`) and on the lab follow-up (built,
`PHYSICAL_PENTEST_ACCESS_FOLLOWUP_PLAN.md`). Three other plans touch the same ground and are read
alongside it: `ACCESS_MODEL_SLICE_9_2_PLAN.md` (work, frustration, social media),
`ACCESS_MODEL_SLICE_9_3_PLAN.md` (networks) and `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` (engine
changes from the user's hands-on test of the lab). Section 14 is the interface with all three.

How to read this plan: section 2 is what the code has today (checked on 2026-11-10 at commit
`210e48eec`), sections 4 to 9 are the design, section 10 is the build order with each step's
tests, section 11 is the feature scenario and its scripted playtest, section 12 is the lab,
section 15 the parallel streams and section 16 what is still open for the user.

Kind of game: this is engine work for every kind of game, proved on a test scenario and adopted
first by a lab scenario (`lab_physical_pentest`, not shipped). AGENTS.md, "Kinds of game".

## 1. Why

The first slice gave NPCs a role and sign-in details, and gave PCs a sign-in screen, sessions and
profiles. What decides whether a player can get at an account is still written by hand, one field
at a time, on the things around the NPC: `lockChance` or `locksScreenOnLeave` on a PC, a
`postitNote` typed onto an object, a gate's `playerMayPassIf`. The lab sets Chris's and Melanie's
screen habits this way.

This slice moves those choices onto the person. An NPC gets an **awareness** level (`low`,
`medium`, `high`) and a set of **habits** the level fills in, each of which the author can
override. The engine turns each habit into the fields the existing systems already read. The
result an author wants is one line per character ("Jake is careless") and a validator that says
what that line did.

Design principles this plan keeps to (the user's):

- **Chaining is the point.** A habit is a way to get an identity, and an identity opens the next
  thing. Each habit below names what it gives the player and what that then opens. The validator
  and the dungeon graph show the chain.
- **Fun and educational.** Each habit is a real behaviour with a real control, and the player
  finds it by watching and trying, not by reading a stat. Section 4.3 says what the player sees
  for each.
- **Server-side secrecy.** `awareness` and `habits` never reach the browser. A password a habit
  gives away is not in the data a room loads with. The server hands it over when the sign-in
  screen of that PC asks, and only for a PC in a room the player has opened.
- **Simple and clean.** No habit is a new system. Each one expands into fields that exist, the
  explicit field always wins, and nothing is accepted in a scenario that the engine does not yet
  act on.

## 2. What the code has today

Every line here was checked against the code.

**Withholding is already in place.** `withhold_npc_secrets!` (`app/models/break_escape/game.rb:3970`)
deletes `creds`, `awareness`, `habits`, `role` and `workarounds` from every room NPC in room data
(`WITHHELD_NPC_KEYS`, `:3968`). The bootstrap ships no room NPCs
(`filtered_scenario_for_bootstrap`, `:824`), but it ships every other top-level key as authored
unless that method deletes it. Nothing reads `awareness` or `habits` yet: the validator's known NPC
fields (`scripts/validate_scenario.rb:414-422`) and the schema's NPC definition
(`scripts/scenario-schema.json`, beside `creds` at `:4130`) do not list them.

**The loader.** `prepare_scenario_data!` (`game.rb:799`) runs `normalise_access_model!` (`:4029`)
and then `stamp_scenario_object_ids!` (`:4055`), once, in `before_create`
(`generate_scenario_data`, `:3990`), and the result is saved with the game. Tests reach it through
`create_access_game` (`test/test_helper.rb`). Both steps are idempotent. A reset keeps
`scenario_data`.

**How `lib/` is loaded.** `lib/` is an autoload path (`lib/break_escape/engine.rb:14`), so a
constant is found by its file name: `BreakEscape::DeclaredGrants` in
`lib/break_escape/declared_grants.rb`, with no `require` anywhere in the engine. The scripts load
the same files with `require_relative`, in order (`validate_scenario.rb:20-21`,
`generate_dungeon_graph.rb:15-16`). `lib/break_escape/access_identities.rb` is plain Ruby with no
Rails and mirrors the server's identity rules for the scripts; its `workstation?` is false for an
object with no string `id` (`:102-106`).

**Screens.** A workstation is an object with `workstation: true`, `locksScreenOnLeave`,
`lockChance` or `lockType: "login"` (`isWorkstation`,
`public/break_escape/js/systems/workstation-state.js:72`). Its owner is `screenOwner`, else the NPC
whose `needsHome` is its id (`ownerOf`, `:79`; on the server `login_pc_owner`, `game.rb:1397`,
which reads stamped ids). On each leave `decideLocked` (`:92`) reads the policy's `autoLockMin: 0`
first, then `lockChance` (0, 1 or a seeded roll), then `locksScreenOnLeave` (default true). The
server's claim check reads the same two fields from the saved scenario (`pc_always_locks?`,
`game.rb:1406`). The lab follow-up added the locked look (`systems/screen-states.js`: a
`<key>_locked` texture where one is loaded for the sprite's key, today `pc_desktop` only, plus a
lock and an unlock sound) and `wasLocked` on `workstation_owner_returned`. All of these follow the
fields on the PC, so a habit that fills those fields needs no client change.

**The locked look works on this branch.** The user's hands-on test reported no lock screens and no
sounds. `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` item 1 reproduced a real browser session on this
branch (its game 78): Chris's PC took the `pc_desktop_locked` texture and played the lock sound on
his leave, and Melanie's, which never locks, showed and played nothing. Its ranked causes are that
two of the lab's three desk PCs can never lock and the third locks rarely, that the sounds are
short and shared with other cues, and that the played copy may have differed from this branch. It
is not a fault in `screen-states.js`.

**Sticky notes.** A sign-in screen shows the PC object's own `postitNote` unless the object sets
`showPostit: false` (`openLoginSignIn`, `systems/unlock-system.js:268-321`, at `:311-312`). The
screen refreshes its account tiles from `GET /login_accounts` every time it opens (`:275-281`;
`games_controller.rb:1106-1114`, which checks the PC is reachable). Whenever a note shows, the
screen has an "add to notebook" button (`password-minigame.js:728-794, 860-889`); a saved note is
synced into `player_state['notes']` (`games_controller.rb:1637-1639`) and sent back as `savedNotes`
on every later `GET /scenario` (`:306-308`).

**Gates.** A gate door is `rooms.<id>.doors[].gate` with `openFor` (a list, or one string),
`openRadius`, `holdMs` and `playerMayPassIf` (`normaliseGate`, `systems/door-gates.js:75`). It
reaches the client in room data (`doors.js:561-567`; the bootstrap drops `doors`). The gate opens
when an `openFor` NPC is within the radius and stays open for `holdMs` after the last one leaves it
(`update`, `:446-487`, the hold at `:484-485`): that hold is the tailgate window. With no
`playerMayPassIf` the player may walk through whenever the gate is open. With one, a player within
the radius while that global is false shuts the gate (`_playerBarred`, `:410-418`), and after 5 s
the guard is let through anyway (`GUARD_PRIORITY_MS`), so today the bar is soft: a barred player
who waits walks in beside the guard. `openToPlayer(g)` (`:335-340`) is the one question "may the
player walk through this open gate now", asked by a click. Every gate in a scenario today has
`playerMayPassIf` (`lab_physical_pentest`, `test_gate_tailgate`). Gates are proven for north and
south doors only, and a gate guard needs a multi-room route with an `unlockRoom` action at the
door (`scenarios/test_gate_tailgate/scenario.json.erb:66-78`).

**Social engineering blocks** (`social.characters`, `social.pretextNpcs`, `social.phishTargets`)
ship in the bootstrap as authored, apart from capture secrets (`game.rb:895`). In every scenario
that has them the targets are phone or email characters with no room NPC
(`lab_social_engineering`: `pierce` and `lord` by email, `dev` by phone). Awareness lives on room
NPCs so that it can be withheld, so no scenario today could use an awareness default for a social
engineering block.

**The validator.** `check_access_model(json_data, repo_root, scenario_dir)`
(`validate_scenario.rb:5827`, called at `:6498`) builds its NPC index and PC list from the authored
scenario at the top and reads them throughout. Its warning about a session that rests on a roll
runs only inside the sign-in PC loop (`:6064-6095`).

**The lab's hand-set habits.** At this commit, in `scenarios/lab_physical_pentest/scenario.json.erb`:
Chris's `staff_pc` (a plain workstation) sets `"locksScreenOnLeave": true`, and his keylogger
capture depends on a lock at every leave (`workstation_owner_returned:staff_pc` with
`data.wasLocked`), guarded by `test/models/break_escape/lab_physical_pentest_secrets_test.rb`.
Melanie's `staff_pc_2` (a sign-in PC) sets `"locksScreenOnLeave": false`. Sofia's `usb_target_pc`
is not a workstation. Len's gate has `playerMayPassIf` and he has `los.challengeOnSight`, both
explicit. All three desk staff hold accounts. **The user's own copy of the lab has changes that are
not on this branch** (`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`, section 0), so section 12 is
written as a recipe by object id, not as line edits.

**A naming hazard.** "Awareness" is already the name of the security awareness course in this
codebase (`social.awareness`, `awarenessEpisode`, `scripts/validate_social/awareness.rb`,
`window.breakEscapeConfig.awareness`). The NPC field keeps the name the user chose. All new code is
named for **habits** (`NpcHabits`, `check_npc_habits`, `npc_habits_*` tests), so a search for the
course never lands in this slice and the reverse.

## 3. Decisions

User decisions carried in from the first slice plan (2026-11-09 and 2026-11-10):

| Area | Decision |
|---|---|
| Awareness | A preset (`low`, `medium`, `high`) plus per-habit overrides. It expands into the existing blocks and fields rather than running alongside them. |
| Habits | Locks screen, password strength (guessable from public posts), sticky note, password reuse, holds doors, falls for phishing or pretext calls, challenges strangers. |
| Determinism | Seeded rolls (`NPCNeedsSystem.roll`). No puzzle-critical opening may rest on a roll alone. |
| Secrecy | Anything the player should have to discover must not reach the browser early. |
| Chaining | Nothing in the engine limits what a captured credential may be used for. |
| The lab | Signing in to desktops with captured credentials is in scope (2026-11-10). |
| Simplicity | A simple, clean design: no configuration nobody uses. |

Decisions for this slice (orchestrator, under the user's latitude, 2026-11-10; the user can
overrule any):

| Area | Decision | Why |
|---|---|---|
| Social engineering habits | `phishable`, `pretextable` and `challengesStrangers` are **not built and not accepted** in this slice. The design note in 5.6 is kept for the slice that builds them. | No scenario can use them: every social engineering target today is a phone or email character with no room NPC. The schema is not loosened for fields nothing reads. |
| The sticky note | A `writesDown` note is read on the sign-in screen of the owner's own PC, with a small note picture on the monitor in the room. A generated note in a drawer is a later idea (section 17). | One place, one rule. A hand-written note in a drawer still works. |
| A `guessable` password | The player types a guess at the sign-in screen. No guessing helper. The validator accepts the habit only when every letter part and digit part of the password has a source in the world (7.2). | A real deduction with no new screen, and a check that holds the scenario to it. |
| `writesDown` and the presets | `writesDown` is `false` in all three presets. An author turns it on by name. | It is the only habit that hands over a permanent password, and one word on an NPC should not open a second, free route past a capture the author built. |
| The lab | The lab swaps its two hand-set screen fields for habits in this slice, with no change to play. The step waits for the lab's feedback pass and is written as a recipe (section 12). | The user's copy of the lab is ahead of this branch, and the feedback pass rewrites the same file. |
| `holdsDoors` | Built in this slice, on the hard player bar that `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` item 3 proposes (5.4). | With a hard bar a careful guard's door cannot be walked through by waiting, so the habit is something a puzzle can stand on. |

Planner decisions (the user can overrule any):

| Area | Decision | Why |
|---|---|---|
| Where the expansion runs | On the server, once, in the loader, written into the saved scenario data. | The client never sees a habit, the server's own checks read the same filled fields, and a game keeps the habits it started with. |
| One library | `lib/break_escape/npc_habits.rb` and `lib/break_escape/npc_habits/clues.rb`, plain Ruby, used by the server, the validator and the dungeon graph. | One set of presets and one expansion. No mirror to drift. |
| Explicit wins | A field the author wrote on the PC or the gate is never changed by a habit. | The rule every habit shares, so authors learn it once. |
| The note's text is served on demand | Room data says only that a note is there (`hasPostit`). Its text is in the `GET /login_accounts` answer. | The password leaves the server when the sign-in screen opens, not when the room loads, and a note that appears mid-game (slice 9.2) needs no room reload. |
| The password habit is checked, not run | `password` has no runtime effect. The validator checks that the scenario backs the claim. | The puzzle is the player typing a password they worked out. That needs clues in the world, not an engine feature. |
| No stats on screen | The player never sees an awareness level or a habit name. | They learn the habit from what the world shows (4.3). |
| Severity follows who wrote it | A habit the author wrote by name and the scenario does not back is a warning. The same gap from a preset is a suggestion. | One word of `awareness` should not bury the author in warnings. |

## 4. Scenario fields

```jsonc
// rooms.<id>.npcs[]
{
  "id": "jake",
  "displayName": "Jake Brooks",
  "role": "finance",
  "creds": { "username": "jbrooks", "password": "Biscuit2019" },
  "needsHome": "jake_pc",
  "awareness": "low",                              // "low" | "medium" | "high"
  "habits": { "writesDown": true, "password": "guessable" }   // overrides, any subset
}

// top level, optional: a default level by role
"roles": { "reception": { "awareness": "low" } }
```

- **Where.** `awareness` and `habits` are allowed only on room NPCs (`rooms.<id>.npcs[]`), like
  `role` and `creds`. The validator errors on them on any other NPC record.
- **Awareness** is optional. An NPC's level is its own `awareness`, else the `awareness` of the
  first of its roles (in the order written) that has one under the top-level `roles`, else none.
  An NPC with no level gets no preset: only the habits written in `habits` exist for it, and every
  other habit is absent and does nothing. So a scenario that uses none of these fields is
  untouched.
- **Habits** override the preset one by one. An unknown habit name or a value outside the table is
  a validator error; the loader ignores it.
- **`roles`** is shared with slice 9.2, which puts its own keys in the same objects. This slice
  reads `awareness` there and nothing else (section 14).

### 4.1 The habits

| Habit | Values | What it gives the player | Expands into |
|---|---|---|---|
| `locksScreen` | `never`, `sometimes`, `always` | An unlocked session at the owner's desk while they are away | `lockChance` 0, 0.5 or 1 on each workstation the NPC owns (5.2) |
| `writesDown` | `true`, `false` | The account's username and password, read off a sticky note on the owner's sign-in screen | `hasPostit` on each sign-in PC the NPC owns, and the note in that PC's `GET /login_accounts` answer (5.3) |
| `password` | `strong`, `guessable`, `reused` | The password, worked out from clues or carried over from another system | Nothing at run time. The validator checks the scenario backs it (7.2) |
| `holdsDoors` | `true`, `false` | A walk through a gate door behind the NPC, or a door that will not let the player follow | `gate.noHold` on gate doors that open for the NPC (5.4) |

The chain each one feeds:

- `locksScreen: never` gives a claimed session, so the owner's desktop and profiles, so whatever
  card, code or password those hold.
- `writesDown` gives a password, which signs in at every PC whose access list admits that account,
  for the whole game, not only while the owner is away.
- `password: guessable` gives the same from clues in the world (a photo, a post, a calendar), and
  `reused` from another lock or a captured sign-in that holds the same password.
- `holdsDoors: true` gives a room, and whatever identity or object is in it. `holdsDoors: false`
  sends the player to find another way through that door: a copied badge, or a different guard.

### 4.2 Presets

| Habit | `low` | `medium` | `high` |
|---|---|---|---|
| `locksScreen` | `never` | `sometimes` | `always` |
| `writesDown` | `false` | `false` | `false` |
| `password` | `guessable` | `reused` | `strong` |
| `holdsDoors` | `true` | `true` | `false` |

The values are constants in one place (`NpcHabits::PRESETS`) and are tuned once a scenario has
used them.

A character is more interesting when one habit breaks the pattern: the careful manager who locks
every time and keeps the password on a note on the monitor
(`"awareness": "high", "habits": { "writesDown": true }`), or the careless intern whose PC is under
a policy that locks it for them. The feature scenario (section 11) is built from such pairs, and
`README_scenario_design.md` will say so.

### 4.3 What the player sees

No habit is named on screen, so each has to show in the world. This table is the contract the
feature scenario tests.

| State | What shows |
|---|---|
| Owner at the desk | The owner sits at the PC. A click says "<name> is using this PC" |
| Owner away, screen locked (`always`, or a locked roll) | The padlock look on the monitor where the PC's sprite has locked art (`"sprite": "pc_desktop"`), the lock sound if the player is in the room, a steady blue indicator dot. A click opens the sign-in screen |
| Owner away, screen left open (`never`, or an open roll) | The desktop look stays, with the warm breathing indicator dot. A click opens the owner's desktop |
| A written-down password | A small sticky note picture on the monitor, whether or not the owner is there. The note's text is on the sign-in screen |
| A careful guard's gate | The player cannot walk through behind them, and the refusal toast shows |
| A guessable or reused password | Nothing of its own: the clues are objects and posts the author placed |

`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` item 1 owns making the first three easier to notice:
louder, distinct lock and unlock sounds that carry to the next room, a padlock icon that rises from
the monitor on a lock, and one bright pulse of the indicator dot when an owner leaves the screen
open. This slice changes nothing in `screen-states.js` and depends on none of those; they make the
tells in this table stronger when they land. A workstation that should show a padlock must set
`"sprite": "pc_desktop"`; the validator suggests it for any workstation whose owner has a
`locksScreen` habit (7.2).

### 4.4 Fields the loader writes

Authors do not write these; the loader does, into the saved scenario data. An author who does write
one has made it explicit, and it wins.

| Field | On | Written when |
|---|---|---|
| `habits` (all four keys) | The NPC | The NPC has a level. With `habits` alone, the object is left as written, minus invalid entries |
| `lockChance` | An owned workstation | 5.2 |
| `noHold` | A door's `gate` | 5.4 |

## 5. Engine and server changes

### 5.1 The library

Two new files, named for their constants so the engine's autoloader finds them:

- `lib/break_escape/npc_habits.rb` defines `BreakEscape::NpcHabits`;
- `lib/break_escape/npc_habits/clues.rb` defines `BreakEscape::NpcHabits::Clues` (7.2).

Both are plain Ruby with no Rails and no ActiveSupport methods (`deep_dup`, `present?`, `blank?`),
and neither holds a `require` or `require_relative` of the other or of `access_identities.rb`. The
engine finds all three by autoload. The scripts add two `require_relative` lines after the two they
have (`access_identities`, then `npc_habits`, then `npc_habits/clues`). `NpcHabits` uses
`BreakEscape::AccessIdentities` for the rules that already exist there (`room_npcs`,
`room_objects`, `owner_id`, `login_pc?`, `workstation?`, `account?`).

| Function | Returns |
|---|---|
| `LEVELS`, `HABITS`, `PRESETS` | The three levels; each habit's allowed values; the table in 4.2 |
| `level_of(npc, scenario)` | The NPC's level by the rule in section 4, or nil |
| `expanded(npc, scenario)` | The NPC's habits after the preset and the overrides: all four keys with a level, only the valid authored keys without one, nil when the NPC has neither. Invalid names and values are dropped |
| `sources(npc, scenario)` | For each expanded habit, `:explicit` or `:preset`. Meaningful on authored data only |
| `lock_chance(value)` | `never` 0, `sometimes` 0.5, `always` 1 |
| `expand!(scenario)` | Runs the whole expansion on the scenario hash in place (5.2, 5.4) and returns a report: one entry per thing it filled or left alone, with the reason. Idempotent. Never raises on malformed input |

`expand!` is idempotent because every fill is "only when the author left it out": on a second run
the NPC's `habits` already holds all four keys, each PC already has its `lockChance`, and each gate
its `noHold`. For the same reason the report and `sources` say something useful only on the first
run, on authored data. On saved game data a filled field cannot be told from an authored one, and
the report is not saved. Tools that read a saved game print values only (step 6); "why" is the
validator's job.

**Malformed input.** A scenario that the validator would reject must still create a game. `habits`
that is not an object, an `awareness` that is not a string, `roles` that is not an object, `doors`
that is not a list, a `gate` that is not an object: each is skipped with no exception and no
change. A gate's `openFor` written as one string is read as a one-item list, as the client does.

### 5.2 The loader, and `locksScreen`

`prepare_scenario_data!` (`game.rb:799`) becomes: `normalise_access_model!`, then
`stamp_scenario_object_ids!`, then `BreakEscape::NpcHabits.expand!(scenario_data)`. The expansion
runs last so that it sees the ids the server's own owner lookup sees: a PC with a `screenOwner` and
no authored id, or a `needsHome` that names a stamped id, is owned at run time and must be filled.

For each room NPC with an expanded `locksScreen`, and each object it owns
(`AccessIdentities.owner_id`):

- the object must be a workstation by its own fields: `workstation: true` or `lockType: "login"`;
- it must set neither `lockChance` nor `locksScreenOnLeave`;
- then `lockChance` is set to 0, 0.5 or 1.

An object that fails the first test is left alone and stays not a workstation. This matters:
`isWorkstation` treats any object with a `lockChance` as a workstation, so filling one onto an
ordinary owned object (Sofia's `usb_target_pc` in the lab, at this commit) would change what a
click on it does. An object that fails the second test keeps the author's field, and the report
says the habit was not applied there.

Everything downstream is unchanged and already built: the leave roll and its seeded sequence, the
policy's `autoLockMin` beating the habit, the padlock look and sounds, the claim, and the server's
claim check (`pc_always_locks?` reads the filled `lockChance`).

**Server helpers.** `Game#npc_habit(npc, name)` returns `npc['habits'][name]` from the saved,
expanded scenario data, or nil; every server read of a habit goes through it.
`Game#written_down?(npc)` answers whether that person's password is on a note: in this slice,
`npc_habit(npc, 'writesDown') == true`. It is the one helper slice 9.2 extends for its
`writes_down` workaround (section 14).

**The bootstrap.** `filtered_scenario_for_bootstrap` deletes `awareness` from every entry under the
top-level `roles`, so a role's default level never reaches the browser.

### 5.3 `writesDown`: the sticky note

**Server.** `Game#login_postit_for(pc)` returns the note for a sign-in PC, or nil. It returns
`"<username> / <password>"` from the owner's `creds` when all of these hold: the PC has an owner
(`login_pc_owner`); the owner has an account; `written_down?(owner)`; the PC object authors no
`postitNote` of its own; and it does not set `showPostit: false`. An authored note is a deliberate
clue, ships in room data as today and wins. An authored `showPostit: false` is the author saying
this PC shows no note, and it wins too.

- `GET /login_accounts` (`games_controller.rb:1106`) adds `postitNote` to its answer when
  `login_postit_for` returns one, and sets `Cache-Control: no-store` on every answer, because a GET
  can now carry a password. Its existing checks stand: the PC exists and is reachable (its room is
  unlocked or was never locked), else 404 or 403.
- `filtered_room_data` sets `hasPostit: true` on a sign-in PC for which `login_postit_for` returns
  a note, in the pass that attaches the account tiles (`attach_login_accounts!`, `game.rb:1900`).
  It never sets the text.

No other response is given the note by the server. Room data, the bootstrap, `container` and a door
unlock's answer never hold it.

**Client.**

- `openLoginSignIn` (`unlock-system.js:268`) takes the note from the answer: `answer.postitNote`
  when it is a non-empty string, else the object's own `postitNote`, else none. It does not write
  the answer's note onto the object's data, so each open asks again. If the request fails, the
  screen opens with the authored note or none, as today. `showPostit` follows the note as now.
- `pcSessions.screenShown` gains a fourth argument, and `pc_signin_shown` gains `hasPostit` (true
  when the screen shows any note), so a scenario can credit "found the note" from an event mapping
  (`data.hasPostit === true`).
- A new small module, `systems/postit-marks.js` (`window.postitMarks`), draws the existing
  `notes_postit1` picture at the top corner of a PC's sprite when its data has `hasPostit` or an
  authored `postitNote` that is shown. `syncRoom(roomId)` is called from `core/rooms.js` once a
  room's sprites are made, beside the `screenStates` call, and `mark(pcId, on)` lets a later slice
  add one mid-game. The picture follows the sprite's depth and visibility and takes no clicks.

**The player's own copy.** The sign-in screen's "add to notebook" button works for a habit note as
for any note. A saved note is the player's earned copy and is how they carry the password to the
next PC, so that stays. It means the password is afterwards in the player's saved notes, which the
server stores and returns in `savedNotes` on later loads (section 6).

**Where the note shows.** Wherever the sign-in screen does: on a locked screen while the owner is
away, and behind **Switch user** on a desktop. A click while the owner sits at the PC stops at
"<name> is using this PC", so the picture on the monitor is the hint to come back. A PC whose owner
never locks goes straight to the claimed desktop, so its note is read only through **Switch user**;
the feature scenario pairs `writesDown` with a screen that locks.

**What it proves.** The server cannot see where the player stands, so the reach check is the room,
the same strength as room data. A modified client can ask for the note of any sign-in PC in a room
it has opened, whether or not the owner is at the desk. A puzzle that must not be passable early
keeps the PC behind a door the server checks.

### 5.4 `holdsDoors`: gates

**Who owns what.** `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` item 3 owns how a gate bars the
player: a player-only body in the doorway while the gate is open and `openToPlayer(g)` is false,
the gate opening for its guard at once whoever stands there, the end of the soft bar
(`GUARD_PRIORITY_MS`, `GUARD_PASS_MS` and the "shut on a barred player" lines), leaving always
allowed, and a bump on the bar showing the refusal toast and emitting `door_gate_denied`. This
slice owns one thing in the same file: who `openToPlayer(g)` says yes to. The two meet at that one
function. Stream D (step 5) is built after item 3, by a builder who reads item 3's tests first.

**Loader.** For each `rooms.<id>.doors[]` entry with a `gate` that has no `playerMayPassIf` and no
authored `noHold`: `noHold` is the list of its `openFor` NPC ids whose expanded `holdsDoors` is
`false`. It is written only when the list is not empty.

**Client** (`systems/door-gates.js`).

- `normaliseGate` keeps `noHold` (a list of strings, default empty).
- Each gate group keeps `lastGuards`: the set of `openFor` ids seen within the radius since the
  gate last opened. It is added to where `lastNpcNear` is set in `update`, and cleared in `close`.
  The bar has to follow who the gate opened for, not who is near now, because the gate stays open
  for `holdMs` after the guard has walked out of the radius, and that hold is exactly when a
  tailgater steps in.
- `openToPlayer(g)` gains one clause. A clone hold (`playerHoldUntil`) still answers yes first. A
  gate with `playerMayPassIf` answers as today and ignores `noHold`. Otherwise, a gate with a
  non-empty `noHold` answers no when `lastGuards` is not empty and every id in it is in `noHold`.
  One guard who holds doors among them is enough for yes. A gate with no `noHold` answers yes, as
  today.

With item 3's hard bar this makes `holdsDoors: false` something a puzzle can stand on: the player
cannot get through that door behind that guard, by waiting or by dashing, so `room_entered` for the
room behind it means a permitted entry (a copied badge, another guard, another door). A walk into
the bar emits `door_gate_denied`, which a scenario can map to a bark.

`holdsDoors: true` needs no code: a gate with no bar is what the engine does today.

**If item 3 is not built** (it waits on the user's approval, its question 3), the soft bar stays,
a barred player who waits five seconds still gets in, and a `noHold` gate would give a puzzle
nothing to rely on. Stream D then is not built, `holdsDoors` leaves the tables in 4.1 and 4.2, and
`noHold` leaves the schema, until the bar is hard.

### 5.5 `password`

No engine change. The puzzle is played with what exists: clues in objects and posts, the sign-in
screen's **Other user** and tiles, and the server's count of failed sign-ins. The validator checks
(7.2) are the whole of this habit. One rule follows from the first slice: a PC under a policy with
`maxAttempts` locks a username out for the rest of the game, so the validator warns when an account
whose password is `guessable` can sign in only at such PCs.

### 5.6 Design note: the social engineering habits (not built)

Kept short for the slice that builds them. The link would be: a room NPC belongs to the social
character whose key is its id or whose `channels.person` names it. `phishable` would default that
character's phish target (`requiredFactors`, `advisoryFactors`, `runsExecutable`,
`primedFor.trusts`); `pretextable` its pretext entry (`tuning.maxRefusals`, `unverifiableCost`,
`susceptibility`); `challengesStrangers` the `at` of its `wary`, `refuses` and `reports`
thresholds. Each fill only where the author left the field out. Building it needs the schema to
allow a threshold with no `at`, and every social validator check that reads thresholds
(`validate_social.rb:460-472, 517`, `validate_social/pretext.rb:492`) to run on the expanded copy.
None of that is done here. Until then the three names are unknown habits, and the validator says
so.

## 6. What reaches the browser, and what never does

| Thing | Reaches the browser? | How it is kept |
|---|---|---|
| `awareness`, `habits` on an NPC | Never | `withhold_npc_secrets!` already deletes both from every room NPC, and the validator allows them on room NPCs only. Step 1 adds the tests that hold this |
| `roles.<role>.awareness` | Never | Deleted in `filtered_scenario_for_bootstrap` (5.2) |
| The preset tables | Never | They are in the Ruby library. No JavaScript holds them |
| A filled `lockChance` | Yes, in room data, on the PC | The seeded roll runs in the browser, so it has to. It is the same exposure as an authored `lockChance` today. It tells a player who reads network traffic that an owner is careless, not what their password is. Accepted |
| `hasPostit` on a PC | Yes, in room data | It says a note is on the monitor, which the picture shows |
| The text of a `writesDown` note (username and password) | From the server, only in a `GET /login_accounts` answer for that owner's own reachable sign-in PC, sent `no-store` | 5.3 |
| The same text in the player's saved notes | Yes, once the player has pressed "add to notebook" on that note: in the notes sync and in `savedNotes` of later `GET /scenario` answers | It is the player's own copy of something they have read. Never before the note was served |
| `gate.noHold` | Yes, in room data, on the door | It names NPC ids. Not secret |
| The `password` habit and the validator's clue report | Never | Authoring time only. The report names where a clue is and which part it backs by position, never the password or any text from it |
| `pc_signin_shown.hasPostit` | Yes, a boolean | It says a note is on screen, which the player can see |

The first slice's no-password test keeps its fixture free of `writesDown`. This slice adds a
second test for a fixture with it (step 2): before any note is saved, the password appears in the
`/login_accounts` answer for the owner's PC and in no other response; after the note is saved
through the notes sync, it also appears in `savedNotes`, and still nowhere else.

The playtest leak scanner (`tools/playtest/lib/access_leak_scanner.rb`) learns two exceptions and
one new finding (step 6):

- a password in a `/login_accounts` answer is allowed for a PC whose owner has `writesDown` in the
  game's saved scenario;
- the same password inside `savedNotes` or a notes sync is allowed only when an earlier captured
  `/login_accounts` answer for that owner's PC carried it;
- any response that holds an NPC record with a `creds`, `role`, `awareness`, `habits` or
  `workarounds` key is reported, by key and NPC id.

## 7. Validator, schema and dungeon graph

### 7.1 Schema (`scripts/scenario-schema.json`)

All of the slice's schema edits are made in step 1, so no later stream touches the file.

- NPC definition, beside `creds`: `awareness` (enum of the three levels) and `habits` (an object
  with the four keys and their enums, `additionalProperties: false`, `_comment` allowed).
- Door `gate`: `noHold`, an array of NPC ids, described as written by the loader.
- Sign-in object: `hasPostit` is not authored and is not added; the description of `postitNote`
  says a habit can supply one.
- Top level: `roles`, an object of objects, each with an optional `awareness` enum and
  `additionalProperties: true`, so slice 9.2's keys are accepted whichever is built first. If 9.2
  has added `roles` already, this slice adds the one property.

### 7.2 Validator (`scripts/validate_scenario.rb`)

**Wiring.** The caller (`:6498`) builds one expanded copy of the scenario and its report
(`JSON.parse(JSON.generate(json_data))`, then `NpcHabits.expand!`) and passes both to
`check_access_model` and to a new function, `check_npc_habits`. Inside `check_access_model` only
the workstation checks (`:6080-6095`) read the expanded copy, so the roll warning and the "owner
never leaves" warning see the effective `lockChance`; every other check keeps reading the authored
data. `awareness` and `habits` join `known_npc_fields` (`:414-422`) and `roles` the known top-level
keys.

The validator works on authored data, where ids are not stamped, so its copy can differ from the
server's for an object with no authored id. It warns about an owned workstation with no authored
`id`.

Errors:

- `awareness` or `habits` on an NPC record that is not a room NPC;
- an `awareness` (on an NPC or under `roles`) that is not one of the three levels; an unknown
  habit; a habit value outside its list.

Warnings, for a habit the author wrote by name:

- `locksScreen` on an NPC who owns no workstation, or whose every workstation sets its own lock
  field (the habit does nothing);
- `locksScreen: "sometimes"` on the owner of a sign-in PC (the session rests on a roll), and on
  the owner of a plain workstation that any event mapping reads through
  `workstation_owner_returned:<id>` or `workstation_locked_attempt:<id>` (a capture that needs
  `wasLocked` would fire on some leaves only);
- `writesDown: true` on an NPC with no account, or who owns no sign-in PC, or whose every owned
  sign-in PC authors its own `postitNote` or sets `showPostit: false`;
- `writesDown: true` on an account that opens nothing but its own PC and profile is not a warning
  but a line in the report ("opens only its own PC"), so the author sees a chain that stops;
- `password` on an NPC with no account;
- `password: "guessable"` that is not backed (below);
- `password: "reused"` when no other secret in the scenario equals the password;
- `password: "strong"` when the password is reused, or every part of it has a source;
- an account whose password is `guessable` and which can sign in only at PCs under a policy with
  `maxAttempts`;
- `holdsDoors: false` on an NPC that no gate opens for, or whose every gate has `playerMayPassIf`
  or an authored `noHold`;
- an authored `gate.noHold` naming an id that is not in that gate's `openFor`.

Suggestions (the validator's lowest level):

- each of the gaps above when the habit came from the preset: `sometimes` on a sign-in PC or a
  mapped plain workstation, `guessable` not backed, `reused` with nothing sharing the password,
  `strong` with every part sourced;
- a workstation whose owner has a `locksScreen` habit and whose sprite has no locked art (no
  `"sprite": "pc_desktop"`): the lock will sound but not show.

**Backing a `guessable` password.** The password is split into **parts**: each run of four or more
letters and each run of two or more digits. Shorter runs and symbols are glue and need no source.
A part is sourced when it appears (letters without case) in text the player can read somewhere
other than the password's own home. The password is backed only when it has at least one part and
**every** part is sourced. So a password made of a company name, a season and a year is backed
only if the season and the year can be found too, and a common word in the scenario's text backs
nothing alone. The report names each part by position and where it was found ("part 2 of 3:
rooms/mei_room/objects/photo_frame"; "part 3 of 3 has no source"), never the text. The whole
password written out in an authored note sources every part, and is also reported as "written in
full at <path>", so the author sees every place a password is spelled out. (The first slice's error
for a whole password in compiled ink stands.)

Readable text is one function, `NpcHabits::Clues.readable_texts(scenario, scenario_dir)`: an
object's `name`, `text`, `observations`, `postitNote` and their variants, `social.intelFacts`
values and labels, `social.osint.sites[].profiles[].posts`, seeded mail, and the strings of the
scenario's compiled ink. Slice 9.2 adds an NPC's `feed.posts` to it.

**Backing a `reused` password.** The password equals another secret in the scenario, found by
`NpcHabits::Clues.secret_homes(scenario)`: the `requires` of a `lockType: "password"` door or
object, a `social.landingPages[].capture.secret`, a capture secret on an NPC with no account, or
another account's `creds.password`. The first three are reported as "same password as <path>". The
last is a different lesson (a shared or default password, and the player still needs the second
username), so it is reported and drawn as "shared with <npc id>". Slice 9.3 adds a Wi-Fi key to
the list.

**The habits report.** When any NPC has a level or `habits`, the validator prints one block from
the expansion report: each such NPC with its level and where it came from (its own field or a
role), its four habits marked preset or explicit, and under each habit what it did (
"`staff_pc`: lockChance 1", "`priya_pc`: the PC sets lockChance, habit not applied", "sticky note
at `omar_pc`", the parts of a `guessable` password and their sources, "no effect: owns no
workstation"). No line holds a password or any text from one. This block is the only place that
says why a field has the value it has.

### 7.3 Dungeon graph (`scripts/generate_dungeon_graph.rb`)

The first slice draws each account as a sign-in key node, hung from the room its NPC stands in,
with an edge to every PC it opens (`generate_dungeon_graph.rb:293-338`). Nothing shows how the
player comes by the password, or that an open screen needs none. This slice adds labelled edges, so
chains show:

- `writesDown`: an edge from the owner's sign-in PC (the note is read on its sign-in screen) to
  the account's node, labelled "sticky note";
- `locksScreen` `never` or `sometimes`: an edge from the PC's room straight to the owner's PC,
  labelled "unlocked screen", with "(roll)" for `sometimes`. It is drawn only where the server
  would allow a claim (the owner is tracked, has an account, the PC admits them, and no policy
  sets `autoLockMin: 0`);
- `password: reused`: an edge from each lock or capture that holds the password to the account's
  node, labelled "same password", or "shared with <npc id>" from another account's node;
- `password: guessable`, when backed: an edge from each object that sources a part to the
  account's node, labelled "clue".

A gate with `noHold` gets no new node; its label lists who holds it and who does not.

## 8. Saved games

- **A game keeps the habits it started with.** The expansion is written into `scenario_data` when
  the game is created and is never run again for that game. Editing a scenario's habits changes new
  games only.
- **Games created before this slice** hold no `awareness` (no scenario has one), so nothing in them
  changes. `npc_habit` returns nil for them and `login_postit_for` returns nil.
- **`lab_physical_pentest` games created before the lab step** keep their saved hand-set fields
  and play as they did. The lab is not shipped.
- **No new `player_state` key.** A sticky note is not recorded as seen; the screen asks each time.
  A note the player saved is in `player_state['notes']`, as any saved note is. A reset needs
  nothing new.
- **A reload** changes nothing about habits. The workstation state resets with every owner at the
  desk, as today, so a kept password session at an owned PC cannot be opened until the owner next
  leaves, and the seeded lock sequence starts again from the first leave: a `sometimes` screen
  plays the same after a reload as from a fresh start.
- **Once-only mappings** are unaffected: no event name changes. `pc_signin_shown` gains a field.

## 9. Determinism

`sometimes` is the only chance in this slice, and it is the first slice's seeded roll
(`roll(ownerId, "screen:<pcId>:<leaveCount>")`, a pure function of the seed, the NPC and the
salt). The first slice's warning about an owned sign-in PC with an authored `lockChance` between 0
and 1 stands. For a `sometimes` habit the message names the habit, and it is a warning when the
author wrote the habit and a suggestion when it came from the `medium` preset (7.2), so `medium`
can be used without a warning on every desk. Either way the author gives the player another route
(a note, clues, a captured sign-in) or sets `locksScreen` by name.

## 10. Build steps

Each step is testable before the next, and its tests are part of the step. Steps 0 and 1 come
first; after them the streams in section 15 run side by side. A step is done when its own tests,
the node suite (`bin/test-js`), the Rails suite (`bin/rails test`), the first slice's no-password
test and every scripted run built so far pass.

### How the slice is tested

1. **Unit tests in every step**: Ruby tests of the library (`test/unit`), server tests through
   `create_access_game` (`test/models`, `test/controllers`), client tests on the node runner
   (`test/js`), validator and dungeon graph tests in the pattern of
   `validator-access-model.test.mjs` and `dungeon-graph-identities.test.mjs`.
2. **One feature scenario**, `test_access_habits` (section 11), designed for testing, not play.
3. **A scripted run of it** through the `window.__test` bridge on the keyless server on :3001, by
   the scripted regression tester tier in AGENTS.md ("Choosing a model"), one numbered step per
   beat, with the two checks after every beat that the first slice built: what the server recorded
   (`verify-run.rb --access`) and what reached the browser (`access-leak-check.rb`). It joins the
   access model's regression suite beside the runs of `test_access_doors`, `test_access_signin`
   and `test_access_sessions`.
4. **The existing suite runs again** wherever a step changes code they cover: the
   `test_access_signin` run after step 2 (the sign-in screen), and `test_gate_tailgate` after
   step 5 (gates).
5. **`lab_physical_pentest` last** (section 12).

Never touch the server on :3000. A "stuck" from the scripted tester counts as a bug only once a
persona-tier run of the same beat confirms it.

### Step 0. Confirm the locked look

The habits are read off the padlock, so before anything is built on it: on the keyless server on
:3001, at the commit the build starts from, open `test_access_sessions`, wait for an owner whose
PC always locks to leave, and record `window.__test.access.workstation(pcId)` (`lockedLook`,
`texture`), `screenTransitions()` and a screenshot in the build log. If the padlock does not show
because that fixture's PCs lack `"sprite": "pc_desktop"`, that is a set-up fact to record, and the
check is repeated in `lab_physical_pentest` on Chris's PC, where the feedback plan saw it work. A
real fault here stops the build and goes to the owner of `screen-states.js` changes (the feedback
plan, item 1).

### Step 1. Foundation: schema, library, loader, withholding

One builder. Everything else waits for it.

Files:
- `lib/break_escape/npc_habits.rb` (new): 5.1, with the `locksScreen` fill (5.2) and the gate fill
  (5.4).
- `app/models/break_escape/game.rb`: the new order in `prepare_scenario_data!`; `npc_habit`;
  `written_down?`; the `roles` deletion in `filtered_scenario_for_bootstrap`.
- `scripts/scenario-schema.json`: every edit in 7.1.
- `scripts/validate_scenario.rb`: `awareness` and `habits` in `known_npc_fields` and `roles` in the
  known top-level keys only (the checks are step 3).

Tests:
- `test/unit/npc_habits_test.rb` (new): each preset gives the table in 4.2; an override replaces
  one habit and leaves the rest; `habits` with no level gives only those keys; a level from the
  NPC's own field beats one from a role, and the first role with a level wins; an unknown level,
  habit or value is dropped; `sources` marks each habit explicit or preset. The `locksScreen` fill:
  0, 0.5 and 1 on a `workstation: true` object and on a `lockType: "login"` object; ownership
  through `screenOwner` and through `needsHome`, including a `needsHome` that names a stamped id;
  an NPC who owns two PCs fills both; an authored `lockChance` and an authored
  `locksScreenOnLeave` are each left alone and reported; an owned object that is not a workstation
  gets no field. The gate fill: `noHold` lists the `openFor` NPCs with `holdsDoors: false`; a
  string `openFor` is read as one id; a gate with `playerMayPassIf` or an authored `noHold` is left
  alone; a gate whose guards all hold gets no `noHold`. A second `expand!` changes nothing (compare
  the whole hash). Malformed input, one case each: `habits` a string, `awareness` a number, `roles`
  a list, `doors` an object, `gate` a string, `npcs` holding a non-object: no exception and no
  change.
- One test in the same file runs a plain `ruby` subprocess that requires only
  `access_identities.rb` and `npc_habits.rb` and calls `expand!` on a fixture, so a Rails-only
  method in the library fails here and not later in the validator.
- `bin/rails zeitwerk:check` passes (the new constants are found by file name).
- `test/models/break_escape/npc_habits_loader_test.rb` (new): a game from `create_access_game`
  holds the expanded habits and the filled `lockChance`; a PC with `screenOwner` and no authored id
  is filled; a second `prepare_scenario_data!` changes nothing; a game made with `Game.create!` and
  hand-set `scenario_data` is untouched; a game is created without error from each malformed
  fixture above; a claim at the PC of a `never` owner is granted and at the PC of an `always`
  owner refused (`claim_login_session!`), with no lock field authored on either PC.
- `test/models/break_escape/access_model_withholding_test.rb` (extended): for a fixture whose NPCs
  have `awareness` and `habits` and whose `roles` has a level, neither NPC key is in
  `filtered_room_data`, in a door unlock's room data or in `update_room`'s added NPCs; the
  bootstrap has no `awareness` under `roles`; the PC carries the filled `lockChance`.
- A one-off check, recorded in the build log and not kept as a test (AGENTS.md: no test compares
  live content): render every scenario under `scenarios/`, run `NpcHabits.expand!` on each and
  confirm the output equals the input for all of them, because none has `awareness`, `habits` or
  `roles`.

### Step 2. The sticky note

Files:
- `app/models/break_escape/game.rb`: `login_postit_for(pc)`; `hasPostit` in
  `attach_login_accounts!`.
- `app/controllers/break_escape/games_controller.rb`: `login_accounts` adds `postitNote` and the
  `no-store` header.
- `public/break_escape/js/systems/unlock-system.js`: `openLoginSignIn` (5.3).
- `public/break_escape/js/systems/pc-sessions.js`: `screenShown` takes `hasPostit` and puts it on
  `pc_signin_shown`.
- `public/break_escape/js/systems/postit-marks.js` (new), its import and install in
  `core/game.js`, and the one `syncRoom` call in `core/rooms.js`.
- `public/break_escape/js/api-client.js`: the comment on `loginAccounts` names the new key.

Tests:
- `test/controllers/break_escape/npc_habits_postit_test.rb` (new). Fixture: Omar (`writesDown`,
  owns `omar_pc`, may also sign in at `hot_desk`), Ian (no `writesDown`), a PC with an authored
  `postitNote`, a PC with `showPostit: false`, an owner with no account, and `omar_pc` behind a
  locked door in a second variant.
  - `/login_accounts` for `omar_pc` carries "<username> / <password>" as `postitNote` and the
    `no-store` header; for `hot_desk`, Ian's PC, the PC with an authored note (the room data still
    holds the authored one), the `showPostit: false` PC and the owner with no account, it carries
    none. Every `/login_accounts` answer has the header.
  - Room data marks `omar_pc` with `hasPostit: true` and none of the others, and holds no note
    text for it.
  - With `omar_pc`'s room locked, the route answers 403 and no password.
  - The no-password test, `writesDown` variant: `/scenario`, `/room/:id`, a door `/unlock`,
    `/container/:id` signed out, `/capture_secrets` and `/login_accounts` for every other PC hold
    Omar's password nowhere. Then the note is saved through the notes sync: the next `/scenario`
    holds it in `savedNotes`, and room data, `container` and the other PCs' answers still do not.
  - A game whose scenario data has no expanded habits (made with `Game.create!`) serves no note.
- `test/js/access-signin-postit.test.mjs` (new, running the real modules as
  `access-signin-requests.test.mjs` does): the screen is started with the answer's note and
  `showPostit` true; the note is not written onto the object's data, and a second open with an
  answer that has none shows none; with no answer note the authored one shows; a failed request
  opens with the authored note or none; `pc_signin_shown` carries `hasPostit` true and false.
- `test/js/postit-marks.test.mjs` (new, on a stub scene): a PC with `hasPostit` gets one picture
  and a second `syncRoom` adds no second one; a PC with an authored, shown `postitNote` gets one;
  a PC with neither, or with `showPostit: false`, gets none; `mark(pcId, true)` adds one to a
  loaded PC and `mark(pcId, false)` removes it.
- `pc-sessions.test.mjs`, `password-signin-mode.test.mjs` and `access-signin-routing.test.mjs`
  pass unchanged.
- The `test_access_signin` scripted runs again (its sign-in screens have authored notes and none,
  so they prove the fallbacks in a browser), with a look at a screenshot of the note picture.

### Step 3. Validator

Files: `scripts/validate_scenario.rb` (`check_npc_habits`, the caller's expanded copy and report,
the two extra arguments to `check_access_model`, the habits report, the two `require_relative`
lines); `lib/break_escape/npc_habits/clues.rb` (new): `parts`, `readable_texts`, `secret_homes`,
`backing`.

Tests:
- `test/unit/npc_habits_clues_test.rb` (new): parts are letter runs of four or more and digit runs
  of two or more; a part is found in an object's text, in a variant, in an intel fact, in an osint
  post and in compiled ink, without case; the password's own home is not a source; each kind of
  secret home is found, and another account's password is marked as shared.
- `test/js/validator-npc-habits.test.mjs` (new): one fixture for each error, warning and
  suggestion in 7.2, and a clean fixture that raises none. For `guessable`: one part of three
  sourced (not backed, the missing parts named by position); every part sourced (backed); a common
  word only, with the digits unsourced (not backed); a password with no part (not backed). For
  `strong`: one part sourced draws nothing, every part sourced draws the warning. For `sometimes`:
  explicit on a sign-in PC is a warning, from the preset a suggestion, on a plain workstation with
  a `workstation_owner_returned` mapping a warning, on a plain workstation with none nothing. A
  `never` owner with no valid `needs` or `interests` draws the "owner never leaves" warning. An
  owned workstation with no authored id draws its warning. The habits report lists each NPC's four
  habits with preset or explicit and its effect lines, and a level that came from a role says so.
  No output line of any fixture holds a password or a part of one (the test greps for them).
- `validator-access-model.test.mjs` passes unchanged.

### Step 4. Dungeon graph

Files: `scripts/generate_dungeon_graph.rb` (and its two `require_relative` lines).

Tests: `test/js/dungeon-graph-habits.test.mjs` (new, beside `dungeon-graph-identities.test.mjs`):
a `writesDown` owner's PC has a "sticky note" edge to the account's node; a `never` owner's PC has
an "unlocked screen" edge from its room, a `sometimes` one says "(roll)", and an `always` one, a
PC under an `autoLockMin: 0` policy and an untracked owner's PC have none; a lock with the same
password draws a "same password" edge and another account a "shared with" edge; a backed
`guessable` draws a "clue" edge from each source and an unbacked one draws none; a gate with
`noHold` names who holds it. `dungeon-graph-identities.test.mjs` passes unchanged.

### Step 5. Gates

After `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` item 3 is built and committed (5.4).

Files: `public/break_escape/js/systems/door-gates.js`; one paragraph in the "Gate doors" section
of `README_scenario_design.md`, after item 3's rewrite of it.

Tests: `test/js/door-gates-no-hold.test.mjs` (new, on the stub world `door-gates.test.mjs` uses):
`normaliseGate` keeps `noHold`; `lastGuards` gains each `openFor` id seen in the radius while the
gate is open and is empty after a close; with a guard in `noHold` near, `openToPlayer` is false
and the player's bar is on; **the guard walks through and out of the radius, the player comes
within it inside `holdMs`, and `openToPlayer` is still false and the bar still on**; after the
gate closes and opens for a guard who holds, it is true; with a holding guard and a non-holding
one both seen, it is true; with no `noHold` the gate behaves as before; a gate with
`playerMayPassIf` ignores `noHold`; a clone hold answers true on a `noHold` gate; a bump on the
bar emits `door_gate_denied`. The gate tests item 3 leaves in place pass unchanged.

Browser check: a short scripted run of `test_gate_tailgate` as item 3 leaves it, to show its gate
is unchanged by this step (it has `playerMayPassIf`).

### Step 6. Playtest tooling

Files:
- `tools/playtest/lib/access_leak_scanner.rb`: the two exceptions and the withheld-key finding
  (section 6). The `/login_accounts` exception reads the game's saved scenario: the PC in the
  request, its owner, the owner's `writesDown`. The saved-notes exception reads the earlier lines
  of the same responses file.
- `tools/playtest/verify-run.rb`: the `--access` section gains a `habits` block of **values
  only**, read from the saved scenario: one line per NPC that has a `habits` object (id and its
  values), one per owned workstation (id, owner, `lockChance` or `locksScreenOnLeave` as saved,
  `hasPostit` as the server would answer), one per gate with a `noHold`. It does not say which
  values a habit filled; the validator's report does (5.1). No passwords.
- `.claude/skills/playtest-scenario/SKILL.md`: one sentence in "Access model checks" on the two
  note exceptions. (Skills are edited only with the orchestrator's say-so; the builder hands the
  sentence over if not.)

Tests: `test/unit/access_leak_scanner_test.rb` (extended, on fixture response files so it does not
wait for step 2): a password in `/login_accounts` for a `writesDown` owner's PC is allowed, for
another PC is reported, and in room data is reported even for a `writesDown` owner; the password in
`savedNotes` after a `/login_accounts` line that carried it is allowed, and in `savedNotes` with
no such earlier line is reported; an NPC record with a `habits` key in any response is reported by
key and NPC id; no output line holds a value. `test/js/playtest-verify-run-access.test.mjs`
(extended): the `habits` block prints for a game with expanded habits and is absent for one
without. The scanner is run once more against real captured responses when step 2 is in.

### Step 7. The feature scenario and its scripted runs

Section 11. Needs steps 1 to 3 and 6; beat H9 needs step 5.

### Step 8. `lab_physical_pentest`

Section 12. Needs step 7's runs passing, and the lab's feedback pass finished.

### Step 9. Documents

- `README_scenario_design.md`: a section "NPC awareness and habits" after "Workstation screens":
  the fields, the two tables, "explicit wins", what the player sees (4.3), the pairing advice in
  4.2, how a `guessable` password is backed, and how to read the validator's habits report.
- `docs/achitechture/ACCESS_MODEL_PLAN.md` section 9.1: replaced by a pointer to this plan, by the
  orchestrator.
- `docs/achitechture/ACCESS_MODEL_SLICE_9_1_BUILD_LOG.md` (new): what was built when, deviations,
  review rounds, test totals, step 0's record and the one-off checks.
- `docs/test-bridge.md`: nothing new in the bridge; a note that habits are not readable from the
  browser by design and that `verify-run.rb --access` prints their values.

## 11. The feature scenario: `test_access_habits`

It follows the first slice's rules for feature scenarios: `scenarios/test_access_habits/` holds
`scenario.json.erb`, `mission.json` (`"collection": "test_scenarios"`, `"test_type":
"access_model"`, with a `test_objective`), ink under `ink/` and `PLAYTEST.md`. A `lobby` start room
with each beat in its own room, open from the start apart from the thing under test. At each beat a
sign (`notes1`, `readable`, not takeable, named "Sign: <beat>") says what to do and what should
happen; a sign never holds a password or a part of one. `npcNeedsSeed: "test_access_habits"`,
`npcWindupMs: 0`, `needsDebugOverlay: true`. One task per beat, completed by an event mapping on
the beat's own event.

Every PC is a sign-in PC with `"sprite": "pc_desktop"` (so the padlock shows) and **no lock field
of its own** unless the beat says so. Every desk owner has an account, starts at the desk, and has
one fast need (`decayPerMin: 30`, `urgentAt: 40`, `initial: 65`: urgent after about 50 seconds) with
a station in the beat's own room whose `useSeconds` is 900, so once gone they stay gone, except
Lena (H8), whose station takes 20 seconds so she leaves several times. One profile, `staff_desktop`
(`for: { roles: ["staff"] }`), with one file. One policy, `instant_lock` (`autoLockMin: 0`); no
`defaultPolicy`. `roles` gives the role `front_desk` the level `low`. Attacks are off.

| Beat | Room and set-up | What should happen | Server record afterwards |
|---|---|---|---|
| H1 Never locks, level from a role | `dana_room`: Dana Reyes, `"role": "front_desk"`, no `awareness` of her own, `dana_pc` | When she walks off, the screen keeps its desktop look and a click opens her desktop (a claim). No note picture on her monitor | `sessions.dana_pc = { id: "dana", via: "claim" }`; habits block: Dana `locksScreen never`, `dana_pc` lockChance 0 |
| H2 Always locks | `ian_room`: Ian Shaw, `"awareness": "high"`, `ian_pc` | When he walks off, the padlock shows (`lockedLook` true) and a lock transition with a sound is recorded; a click opens the sign-in screen with no note; `workstation_locked_attempt:ian_pc` fires. There is no way in | No session; `ian_pc` lockChance 1 |
| H3 Careful, with a sticky note | `omar_room`: Omar Haddad, `"awareness": "high", "habits": { "writesDown": true }`, `omar_pc` | The note picture is on his monitor from the start. While he sits there a click says he is using the PC. When he leaves, the padlock shows, the sign-in screen shows the note, the tester saves it to the notebook, and the username and password on it sign in; `pc_signin_shown` carried `hasPostit: true` | `sessions.omar_pc = { id: "omar", via: "password" }`; `omar_pc` hasPostit true |
| H4 The PC's own field wins | `priya_room`: Priya Nair, `"awareness": "low"`, `priya_pc` with `"lockChance": 1` | Locked on every leave, no claim, no note | No session; `priya_pc` lockChance 1 |
| H5 Policy beats habit | `kai_room`: Kai Brennan, `"awareness": "low"`, `kai_pc` under `instant_lock` with no lock field | Locked in the leave roll itself; a click opens the sign-in screen and offers no claim | No session; `kai_pc` lockChance 0 |
| H6 Guessable password | `mei_room`: Mei Lin, `"awareness": "high", "habits": { "password": "guessable" }`, `mei_pc`. Her password is a pet's name followed by a year. A framed photo on her desk (readable) gives the name, a calendar on the wall (readable) gives the year, and the sign gives the order, not the answer | The password built from the photo and the calendar signs in | `sessions.mei_pc` Mei by password; no `loginFailures` entry for her if the first try is right |
| H7 Reused password | `tom_room`: Tom Fletcher, `"awareness": "high", "habits": { "password": "reused" }`, `tom_pc`; his gym locker (`lockType: "password"`, the same password) and a note in the room with the locker's combination | The note opens the locker, and the same password signs in at `tom_pc` | Locker in `unlockedObjects`; `sessions.tom_pc` Tom by password |
| H8 Sometimes locks | `lena_room`: Lena Fox, `"awareness": "medium"`, `lena_pc`; her station takes 20 s | On each of her first three leaves the screen is locked or open as `PLAYTEST.md` lists for this seed (the builder records the sequence once). An open leave gives a claim, a locked one the sign-in screen. After a reload the sequence starts again from the first entry | A claim at `lena_pc` on an open leave, gone when she returns; none after the reload until the next open leave |
| H9 Holds doors, and does not | `gate_hall`, with `store_a` to its north and `store_b` to its south, each behind a gate door with no `playerMayPassIf`. Gary Whitlock (`"awareness": "low"`) walks a two-room route through the gate to `store_a`; Sara Quinn (`"awareness": "high"`) through the gate to `store_b`. Each route and its `unlockRoom` action are copied from `test_gate_tailgate`. Neither has needs (a route and needs do not combine) | Parked a few steps to one side of Gary's door, the player walks in behind him and `room_entered:store_a` fires. At Sara's door: with her near, the player is stopped and the refusal shows; **approaching one second after she has gone through, while the gate is still open, the player is still stopped**; 20 seconds of pushing at the door never fires `room_entered:store_b`; each bump or click fires `door_gate_denied` | `store_a` entered, `store_b` not; habits block: Sara's gate `noHold: ["sara"]`, Gary's gate none |

Passwords have in-game sources of their own: Omar's is read from the sticky note, Mei's is built
from the photo and the calendar, Tom's is read from the locker note. Dana's, Ian's, Priya's, Kai's
and Lena's are never typed.

**Expected validator output**, listed in `PLAYTEST.md`: no errors and no warnings. Suggestions:
the roll on `lena_pc` (a preset `sometimes`); the preset `guessable` not backed for Dana, Priya and
Kai; the preset `reused` with nothing sharing the password for Lena. The habits report for all ten
NPCs, which is where H4's "the PC sets lockChance, habit not applied", H1's "level from role
front_desk", Mei's two sourced parts and Tom's "same password as" the locker and "written in full
at" the locker note are checked.

**Static checks.** Validator as expected, ink compiles, `python3 scripts/check_door_alignment.py`,
dungeon graph regenerated (and its new edges looked at once), node and Rails suites, both
no-password tests.

**Scripted runs** (two, each with a new game, 10 to 15 minutes each, `--capture-responses` on,
a private scratch folder `test_access_habits-regress/`):

- Run 1: H1 to H5, with a reload after H3. A reload puts every owner back at the desk, so straight
  after it a click on `omar_pc` says Omar is using it. The script waits for his next leave (about
  50 seconds, `window.__test.access.workstation('omar_pc').present` false), then checks that his
  password session is kept (the desktop opens with no password), that the note shows again behind
  **Switch user**, that Dana's claim has ended, and that the saved note is in the notebook.
- Run 2: H6 to H9, with the reload inside H8.

After every beat: the screen; `verify-run.rb <game_id> --access` against the record above; and
`access-leak-check.rb` over the responses so far, which must report nothing. In particular it must
find Omar's password only in `/login_accounts` answers for `omar_pc` and, after the tester saved
the note, in the notes sync and `savedNotes`; and no `habits` or `awareness` key in any response.
`window.__test.access.workstation(pcId)` gives `screenLocked` and `lockedLook` for H1, H2, H4, H5
and H8, and `screenTransitions()` shows that a lock recorded a sound and an open leave did not. The
script does not name the sound files, which the feedback plan may change.

**Earned secrets.** The report carries the table. Omar's, Mei's and Tom's passwords are earned
from their in-game sources. H9 uses the lab's pattern for gates: park on a named tile off the
guard's line and wait on a global the scenario sets from `door_gate_opened`, because scripted
movement collides with NPCs in ways a person does not. Nothing in the runs needs the manual clock
or a knock-out.

**After the runs.** The three first-slice suite runs again, then the report is saved to
`tools/playtest/test_access_habits-report.md`.

## 12. `lab_physical_pentest`

The lab is the first scenario with hand-set habits. In this slice it swaps them for habits with no
change to play.

**When.** After the lab's feedback pass (`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` and
`PHYSICAL_PENTEST_FEEDBACK_PLAN_CONTENT.md`) has finished with the scenario file, or by the same
builder as its last change. The user's copy of the lab holds rooms and texts that are not on this
branch, and the feedback pass changes which PCs are workstations and how often their owners leave.
So this step is a recipe to apply to the file as it then stands, by object id, and the builder
reads the file first. It never runs alongside another edit of that file.

### The recipe

1. **Find every hand-set screen habit.** List each object in the scenario with
   `locksScreenOnLeave` or `lockChance`, and its owner (`screenOwner`, else the NPC whose
   `needsHome` is its id). At this commit that is `staff_pc` (Chris, `true`) and `staff_pc_2`
   (Melanie, `false`). The feedback pass may have added Sofia's PC.
2. **Give each owner the level that says the same thing, and remove the field from the PC.** An
   owner whose PC always locks gets `"awareness": "high"`; one whose PC never locks gets
   `"awareness": "low"`. The PC keeps `"workstation": true` or `"lockType": "login"` and its
   `"sprite": "pc_desktop"`. Where the feedback pass has given a PC a chance between 0 and 1 on
   purpose, leave that field on the PC: an explicit field wins, and `medium` is not the same number
   unless it is 0.5.
3. **Write no habit that does nothing.** No `habits` object is needed for the swap. Do not mark any
   of the staff passwords `guessable`: they follow a pattern (the company name, a symbol, a season
   or a default word, a number), but nothing in the lab gives the player the season or the number,
   so the validator would rightly say the habit is not backed. Leave `password` to the preset and
   accept the suggestion for the `low` owner. Give Len nothing: his gate has `playerMayPassIf` and
   he has `challengeOnSight`, both explicit, so a habit would have no effect.
4. **Move the comments.** Any comment that explains a removed field ("locks on every leave",
   "never locks her screen") is reworded to name the habit on the NPC.
5. **Run the validator and read the habits report.** It must show `lockChance 1` filled on the
   always-locking owner's PC and `lockChance 0` on the never-locking owner's, and no other fill.
   If any other object shows a fill, an owner has a second workstation the swap did not intend:
   stop and look.
6. **Update the lab's guard test.** `test/models/break_escape/lab_physical_pentest_secrets_test.rb`
   asserts today that `staff_pc` has `locksScreenOnLeave` exactly `true`, because Chris's keylogger
   capture fires only on a return to a locked screen. Change it to assert, on the game's prepared
   scenario data, that the owner's expanded `locksScreen` is `always`, that the PC has `lockChance`
   exactly 1 and no `locksScreenOnLeave`, keeping the comment that names the capture. Change the
   matching assertion for the never-locking PC to `lockChance` 0 and `locksScreen` `never`.
7. **Update the lab's documents.** `scenarios/lab_physical_pentest/PLAYTEST.md`: the expected
   validator output gains the habits report and its suggestions; the beats do not change. The
   orchestrator adds a dated note to `PHYSICAL_PENTEST_ACCESS_FOLLOWUP_PLAN.md` that the two lock
   fields are now habits.

**Static checks.** Validator clean apart from the listed output, ink compiles, dungeon graph
regenerated, the lab's Rails tests, both no-password tests, `reopencheck`.

**Scripted run** (the regression tier, the lab's existing script as the feedback pass leaves it):
the keylogger beat and the unlocked-screen beat play as before, with a reload during the claim,
and the two checks after each beat. The run must show the padlock on the always-locking PC when
its owner leaves and none on the never-locking one.

**Persona run** (a tester who does not know the answers, questions put only after play): did you
notice which of the two locked their screen, how, and what would you tell each of them? It reports
every "didn't know what to do" moment. What a model tester cannot judge (the sounds) goes to the
user.

### What habits offer the lab's feedback pass

Not built by this slice; offered to the feedback pass, which owns the lab's content now that
signing in with captured credentials is in scope.

- **Three desks, three habits, three controls.** Chris locks every time (a planted device and a
  wait; the control is checking the cable run and a second factor). Melanie never locks (sit down
  while she is away; the control is Win+L with an auto lock policy behind it). A third desk whose
  owner locks but keeps the password on a note (`"habits": { "locksScreen": "always",
  "writesDown": true }`, written by name; read it off the locked screen; the control is no written
  passwords and a password manager). The feedback plan's own suggestion for Sofia's desk is a late
  auto lock; the two can be weighed there.
- **A found note is an event.** `pc_signin_shown:<pcId>` with `data.hasPostit === true` can set a
  finding global and complete a bonus task.
- **A guessable password needs its clues placed.** If the pass wants a captured password to lead
  to a guessed one (one season's password found, the next one guessed), it has to put the pattern's
  other parts in the world, and the validator will then say the habit is backed.
- **Probe before relying on it:** that a sign-in PC with `affordance.accepts` still takes an NPC's
  deliveries (the lab proves `satisfies` only), and that a leave to fetch a dropped item emits
  `npc_left_post`.

## 13. Effects on other scenarios

- **No scenario has `awareness`, `habits` or `roles` today**, so the loader fills nothing anywhere
  until a scenario adds one. Step 1's one-off check proves it for every scenario.
- **Authored fields mean what they meant.** `lockChance`, `locksScreenOnLeave`, `postitNote`,
  `showPostit` and `gate.playerMayPassIf` are read exactly as before. A habit only fills a field
  the author left out.
- **A workstation with neither lock field still locks on every leave** when its owner has no
  `locksScreen` habit (today's default). Give the owner a level and that PC follows the habit.
  This is the one place a single word on an NPC changes a PC the author did not touch, and the
  habits report lists every PC it happened to.
- **Gates** with `playerMayPassIf` (`lab_physical_pentest`, `test_gate_tailgate`) are untouched by
  this slice. They are changed by the feedback plan's item 3, which that plan covers.
- **The sign-in screen** asks `/login_accounts` as it does now and reads one more key from the
  answer. A PC whose owner has no `writesDown` behaves as before.
- **The note picture** is new on every sign-in PC with an authored, shown `postitNote`:
  `test_access_signin`'s hot desk gains one. No campaign mission has a sign-in PC.
- **`test_access_doors`, `test_access_signin`, `test_access_sessions`** have no habits and keep
  their explicit lock fields. Their scripted runs are rerun as the regression suite.
- **The loader's order changes** (ids are stamped before the access fields are expanded). Stamping
  reads nothing the normaliser writes, and the normaliser reads no object id, so the saved data is
  the same; step 1's loader tests and the first slice's loader tests hold it.
- **Missions m01 to m10, the SIS games and the awareness course scenarios**: no change.

## 14. Interfaces with other slices

### 14.1 What this plan changes in the first slice plan's sketch of 9.1

1. `writesDown` puts `hasPostit` in room data and the note's text in the `GET /login_accounts`
   answer. It does not write `postitNote` into room data.
2. `writesDown` is in no preset.
3. `locksScreen` fills every workstation the NPC owns, plain ones too, and an authored
   `locksScreenOnLeave` wins as well as an authored `lockChance`.
4. `password` is checked by the validator, part by part, from the scenario's own texts and secrets.
5. `holdsDoors` becomes `gate.noHold`, read by `openToPlayer`, on gates with no `playerMayPassIf`,
   and depends on the hard bar.
6. `phishable`, `pretextable` and `challengesStrangers` are not in this slice.

### 14.2 Slice 9.2 (work, frustration, social media)

Read from its draft's section 15 on 2026-11-10. Agreed points first, then two disagreements with a
proposed resolution each.

| Point | This plan |
|---|---|
| The need is `social_media` | This slice names no need. Nothing to change |
| A feed is `feed: { site, person, posts }` and a post's fact key is `fact` | `NpcHabits::Clues.readable_texts` is the list the `guessable` check reads. 9.2 adds each post's text there. A post then sources a part of a password like any other text; the `fact` key itself is not read by this slice |
| One server helper decides whether a password is written down | `Game#written_down?(npc)`, built in this slice's step 1 as "the habit is on". 9.2 adds "or a done `writes_down` workaround". If 9.2 is built first it writes the helper with its half and this slice adds the habit |
| Top-level `roles` is shared | This slice reads `roles.<role>.awareness` only and deletes it from the bootstrap. 9.2 owns `workNeeds`, `frustration` and `workarounds` there. Whoever builds first adds the key to the schema (`additionalProperties: true`) and the validator's top-level list |
| `roles.<role>.habits` (9.2 offers the key to this slice) | Not taken. A role sets a level; an exception is written on the person. One more layer of overrides is configuration nobody has asked for |
| 9.2's warning for a `high` NPC whose post carries a fact | It reads the authored `awareness` string. Proposed: read `NpcHabits.level_of(npc, scenario)` instead, so a level that came from a role counts |
| Withheld keys | `WITHHELD_NPC_KEYS` already holds `awareness` and `habits`; 9.2 adds its own |
| `holdsDoors` and `prop_door` | Independent, as 9.2 says |
| The note's wording | "<username> / <password>", the same in both |
| The note picture | 9.2 planned the `notes_postit1` picture at the PC's corner for its workaround. This slice builds it as `systems/postit-marks.js` (step 2), with `mark(pcId, on)` for 9.2's mid-game note. If 9.2 is built first it builds the module and this slice uses it |

**Disagreement 1: where the note's text is served.** The 9.2 draft fills `postitNote` and
`showPostit` into room data for a PC whose owner's workaround is done, and returns both from its
workaround route. This plan serves the text only from `GET /login_accounts` and puts `hasPostit`
in room data. Reason: the user's secrecy rule. Room data is sent when the room loads, so the
password would be in the browser of a player who has only walked in, and for a habit (true from
the first second of the game) that is every player. Proposed resolution: one fill, as 9.2 wants,
but of `hasPostit`; `login_postit_for` (which calls `written_down?`) is the only source of the
text; 9.2's workaround answer carries `{ pcId, hasPostit: true }` and the client calls
`postitMarks.mark(pcId, true)`. The sign-in screen needs no change for it, because it asks
`/login_accounts` at every open. 9.2's leak rule for a written-down password then becomes this
plan's (section 6).

**Disagreement 2: reading `locksScreen` in the browser.** The 9.2 draft has a guest leave a
borrowed session open "unless the habit resolves to `always`", read "through whatever 9.1 exposes
on the workstation env". This slice exposes no habit to the browser, by design. Proposed
resolution: the server decides. When 9.2 composes the plan it already ships for a borrowing NPC, it
adds one boolean (for example `locksBorrowed`), computed with `npc_habit(npc, 'locksScreen') ==
'always'`. That reveals no more than the filled `lockChance` on the person's own PC already does.
The server's claim check for the borrowed PC should read the same value, so a claim there is not
refused by `pc_always_locks?` on a hot desk that has no lock field. This slice provides `npc_habit`
and nothing else for it.

Not supported by this slice: changing `locksScreen` mid-game. A filled `lockChance` is saved
scenario data. If 9.2 wants frustration to change it, it needs a per-leave override in
`workstation-state.js` and a server record the claim check reads.

### 14.3 Slice 9.3 (networks)

Read from its draft's section 12. No disagreement.

| Point | This plan |
|---|---|
| The Wi-Fi key lives at `networks.<id>.wifi.psk` | `NpcHabits::Clues.secret_homes` is the list the `reused` check reads. Whichever slice lands second adds that home, reported as "same password as networks/<id>/wifi" |
| A sticky note password signs in remotely too | Nothing to do. The chain gets longer, which is the point |
| `network_device_planted` as the hook for an NPC who notices | Noted for the slice that builds `challengesStrangers` |
| 9.3's "the key appears nowhere" warning | It could use `Clues.readable_texts` and `Clues.parts`, so both slices agree on what the player can read. Offered, not required |

### 14.4 The engine feedback plan (`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`)

| Item | Owner | Contact |
|---|---|---|
| 1. Lock sounds, the rising padlock icon, the open-screen pulse, the asset version stamp | The feedback plan. All of `screen-states.js` | This slice edits no file of item 1 and depends on none of it. Its scripted run checks that a transition and a sound were recorded, not which file played (section 11) |
| 3. The hard player bar at a gate | The feedback plan. `update()`, the bar body, the removal of the guard priority, leaving, the bump toast | This slice adds `noHold`, `lastGuards` and one clause in `openToPlayer` in the same file, after item 3 (5.4, step 5). If item 3 is not built, neither is step 5 |
| 6. The capture log container for credentials and notes | The feedback plan | A saved sticky note goes through the existing "add to notebook" path. If the container changes where saved notes live, the leak scanner's saved-notes exception (step 6) follows the new home |
| Content: which lab PCs are workstations, and their owners' leave rates | The feedback plan's content half | Section 12 runs after it |

### 14.5 Shared files

All the plans add to `app/models/break_escape/game.rb`, `scripts/validate_scenario.rb` and
`scripts/scenario-schema.json`. This slice keeps its footprint in them small: in `game.rb` the
loader's order, four short methods and one deletion in the bootstrap filter; in the validator one
function, its call and the expanded copy; in the schema one block of NPC properties, one gate
property and `roles`. Everything else is in its own new files. The first slice plan's order stands
(9.1, then 9.2, then 9.3); if they are built at once, each builder re-reads a shared file just
before editing it and edits only its own block.

## 15. Build streams

Steps 0 and 1 first. Then four streams that share no file, then the scenario, then the lab.

| Stream | Steps | Files it owns | Starts |
|---|---|---|---|
| F Foundation | 0, 1 | `lib/break_escape/npc_habits.rb`, `game.rb` (the loader order, `npc_habit`, `written_down?`, the bootstrap deletion), `scripts/scenario-schema.json`, the known-field lists in `validate_scenario.rb`, `test/unit/npc_habits_test.rb`, `test/models/break_escape/npc_habits_loader_test.rb`, `access_model_withholding_test.rb` | First, alone |
| A Sticky note | 2 | `game.rb` (`login_postit_for` and `attach_login_accounts!` only), `games_controller.rb` (`login_accounts`), `unlock-system.js`, `pc-sessions.js`, `postit-marks.js`, one line each in `core/game.js` and `core/rooms.js`, `api-client.js`, its three test files | When F is committed |
| B Authoring tools | 3, 4 | `scripts/validate_scenario.rb`, `scripts/generate_dungeon_graph.rb`, `lib/break_escape/npc_habits/clues.rb`, `test/unit/npc_habits_clues_test.rb`, `test/js/validator-npc-habits.test.mjs`, `test/js/dungeon-graph-habits.test.mjs` | When F is committed |
| D Gates | 5 | `public/break_escape/js/systems/door-gates.js`, `test/js/door-gates-no-hold.test.mjs`, one paragraph of `README_scenario_design.md` | When F is committed **and** the feedback plan's item 3 is committed. Its builder reads F's gate fill tests and item 3's tests first |
| E Playtest tooling | 6 | `tools/playtest/lib/access_leak_scanner.rb`, `tools/playtest/verify-run.rb`, their two test files | When F is committed. Its tests use fixture response files; its last check waits for A |
| S Scenario | 7 | `scenarios/test_access_habits/`, `tools/playtest/test_access_habits-report.md` | After A, B and E. Beat H9 after D |
| L Lab | 8 | `scenarios/lab_physical_pentest/`, `lab_physical_pentest_secrets_test.rb` | After S, and after the lab's feedback pass |
| Docs | 9 | `README_scenario_design.md` (the new section), the build log | Last |

`game.rb` is touched by F and then A, in different methods, in that order. No other file is shared
between streams. `core/game.js` and `core/rooms.js` are also edited by the feedback plan's work;
stream A adds one line to each and re-reads them just before editing.

Each stream is one builder with review rounds after it (AGENTS.md, "How a round works": at least
two rounds, at most five). Builders commit with explicit paths, use a scratch folder of their own,
write a handover note at about 150k tokens of context, and never stop or start the server on
:3000. Scripted runs are split from building: the builder of stream S writes the scenario and
`PLAYTEST.md`, and a separate tester runs it.

If stream D cannot start (item 3 is not approved or not built), the rest of the slice ships
without it: H9 is left out of the scenario and `holdsDoors` and `noHold` out of the tables, the
schema and the library, as 5.4 says.

## 16. Open for the user

The decisions in section 3 were taken on the user's behalf and can be overruled. Two things are
still the user's:

| | Question | Where it is asked | Effect here |
|---|---|---|---|
| 1 | Is the hard player bar at gate doors approved? | `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`, question 3 | Yes: stream D is built after it. No: `holdsDoors` waits (5.4) |
| 2 | The preset values in 4.2 | Here | They are the first slice plan's proposal with `writesDown` taken out. Recommended: accept, and tune after the lab and the first mission have used them |

Recorded, not asked: the field name `awareness` is kept although the word also names the awareness
course; the code is named for habits (section 2).

## 17. Left out, later ideas, and declined

**Later ideas.**

- **A generated note in a drawer.** `writesDown` naming a container, so the loader puts a note
  item in it: pick the lock, read the note, sign in somewhere else. It chains better than a note on
  the screen it opens, and it removes the one weakness of a hand-written drawer note, which repeats
  the password in a second place with nothing but the validator's "written in full at" line to
  show the two are still equal. To be scheduled with the first mission that wants it.
- **The social engineering habits** (5.6), when a scenario has a room NPC who is also a phish or
  pretext target.
- **A habit that changes mid-game.** Slice 9.2's workaround does this for `writesDown` through the
  one server helper.
- **`plugsInDevices` and other habits not on the user's list** (plugging in found USB sticks,
  holding the lift, reading badges aloud). A new habit is a row in the tables and an expansion.
- **A generated "asks for ID" beat.** `los.challengeOnSight` exists and needs scenario-written
  dialogue.

**Left out.**

- **Habits shown to the player** (a dossier, a meter). The player reads habits off the world. A
  handler can describe a person in dialogue; that is authored text.
- **Awareness on phone and email characters.** Their records reach the browser unfiltered.
- **A password strength meter, a guessing helper or real cracking.**
- **Per-habit rolls** (a note that is there some days). `sometimes` for the screen is the only
  chance, so every other habit is certain and safe to build a puzzle on.

**Declined, with the reason.**

- **Saving the expansion report in the game** (a top-level key holding which fields a habit
  filled, deleted from the bootstrap). The run-time tools print values and the validator's report
  says why. A saved report would be one more withheld key to guard for the sake of two lines in a
  playtest table.
- **A bare-password note where the PC shows account tiles**, with the username added only when
  the picker is off. One wording everywhere, "<username> / <password>", is simpler, matches slice
  9.2's workaround note, and never leaves the player wondering whose note it is.
- **Keeping the three social engineering habit names in the schema and the presets with a "no
  effect" line.** Accepting a field that does nothing is configuration nobody uses; they are
  unknown habits until they are built.
- **An event for "the player crossed a gate while barred"** as the way to make a careful guard's
  door mean something. It would leave every scenario to police entry by itself. The hard bar does
  it once, in the engine.
- **`roles.<role>.habits`** (14.2).
