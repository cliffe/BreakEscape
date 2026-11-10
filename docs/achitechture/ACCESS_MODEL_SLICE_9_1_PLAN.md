# Access model slice 9.1: awareness and habits

Status: **design, 2026-11-10. Nothing here is built.** This plan replaces the sketch in section 9.1
of `docs/achitechture/ACCESS_MODEL_PLAN.md` and is complete without it. It builds on the first
slice (built, `ACCESS_MODEL_BUILD_LOG.md`) and on the lab follow-up (built,
`PHYSICAL_PENTEST_ACCESS_FOLLOWUP_PLAN.md`). Three other plans touch the same ground:
`ACCESS_MODEL_SLICE_9_3_PLAN.md` (networks, split into 9.3a and 9.3b),
`ACCESS_MODEL_SLICE_9_2_PLAN.md` (work, frustration, social media) and
`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` (engine changes from the user's hands-on test of the
lab, "the engine plan" below). **The build order is the engine plan's feedback streams first, then
9.3a, then this slice, then 9.2** wherever they share a file. Section 14 is the interface with all
of them, and section 15 the files they share.

How to read this plan: section 2 is what the code has today, sections 4 to 9 are the design,
section 10 is the build order with each step's tests, section 11 is the feature scenario and its
scripted playtest, section 12 is the lab, section 15 the build streams and section 16 what is
still open for the user.

Kind of game: this is engine work for every kind of game, proved on a test scenario and adopted
first by a lab scenario (`lab_physical_pentest`, not shipped). AGENTS.md, "Kinds of game".

## 1. Why

The first slice gave NPCs a role and sign-in details, and gave PCs a sign-in screen, sessions and
profiles. What decides whether a player can get at an account is still written by hand, one field
at a time, on the things around the NPC: `lockChance` or `locksScreenOnLeave` on a PC, a
`postitNote` typed onto an object, a gate's `playerMayPassIf`. Office life gave the NPC one field
of its own, `screenHabit`, which covers the screen and nothing else. The lab sets Chris's and
Melanie's screen habits on their PCs.

This slice moves those choices onto the person. An NPC gets an **awareness** level (`low`,
`medium`, `high`) and a set of **habits**, some filled in by the level and all open to the author
to set by name. The engine turns each habit into the fields the existing systems already read. The
result an author wants is one line per character ("Jake is careless") and a validator that says
what that line did.

Design principles this plan keeps to (the user's):

- **Chaining is the point.** A habit is a way to get an identity, and an identity opens the next
  thing. Each habit below names what it gives the player and what that then opens. The validator
  and the dungeon graph show the chain.
- **Fun and educational, and fair.** Each habit is a real behaviour with a real control, and the
  player finds it by watching and trying, not by reading a stat. So each one has to show in the
  world (4.3), and a puzzle built on one has to be solvable from what the world shows.
- **Server-side secrecy.** `awareness` and `habits` never reach the browser. A password a habit
  gives away is not in the data a room loads with. The server hands it over when the sign-in
  screen of that PC asks, and only for a PC in a room the player has opened.
- **Simple and clean.** No habit is a new system. Each one expands into fields that exist, the
  explicit field always wins, and nothing is accepted in a scenario that the engine does not yet
  act on.

## 2. What the code has today

Every line here was checked against the code. **Line numbers are as of commit `da60a5937`**, on a
branch that holds the merge of `main` (`d9b910ac0`, which brought office life's lock habits and
lock cues, the owner's gate rule and the rebuilt lab). Other builds are expected to land before
this one and will move them, so a builder finds each place again by its method name.

**Withholding is already in place.** `withhold_npc_secrets!` (`app/models/break_escape/game.rb:3973`)
deletes `creds`, `awareness`, `habits`, `role` and `workarounds` from every room NPC in room data
(`WITHHELD_NPC_KEYS`, `:3971`). The bootstrap ships no room NPCs
(`filtered_scenario_for_bootstrap`, `:825`), but it ships every other top-level key as authored
unless that method deletes it. Nothing reads `awareness` or `habits` yet: the validator's known NPC
fields (`scripts/validate_scenario.rb:415-424`) and the schema's NPC definition
(`scripts/scenario-schema.json`, beside `creds`) do not list them. An NPC's `screenHabit` is not
withheld: it reaches the browser in room data, because the client decides the lock from it.

**The loader.** `prepare_scenario_data!` (`game.rb:800`) runs `normalise_access_model!` (`:4032`)
and then `stamp_scenario_object_ids!` (`:4058`), once, in `before_create`
(`generate_scenario_data`, `:3993`), and the result is saved with the game. Tests reach it through
`create_access_game` (`test/test_helper.rb`). Both steps are idempotent. A reset keeps
`scenario_data`.

**How `lib/` is loaded.** `lib/` is an autoload path and not an eager load path
(`lib/break_escape/engine.rb:14`), so a constant is found by its file name:
`BreakEscape::DeclaredGrants` in `lib/break_escape/declared_grants.rb`, with no `require` anywhere
in the engine. On this Rails version (7.0.4) `bin/rails zeitwerk:check` does not check
autoload-only paths. The scripts load the same files with `require_relative`, in order
(`validate_scenario.rb:20-21`, `generate_dungeon_graph.rb:15-16`).
`lib/break_escape/access_identities.rb` is plain Ruby with no Rails and mirrors the server's
identity rules for the scripts; `game.rb` does not call it today. Its `workstation?` is false for
an object with no string `id` (`:102-106`); its `owner_id` compares `needsHome` to the object's
`id` with no such guard (`:144-149`), so on data with no ids nil matches nil; its `identity_roles`
gives an NPC's authored roles followed by the implicit `staff` (`:60-66`).

**Screens.** A workstation is an object with an id and `workstation: true`, `locksScreenOnLeave`,
`lockChance` or `lockType: "login"` (`isWorkstation`,
`public/break_escape/js/systems/workstation-state.js:89-93`); `autoLockSeconds` does not make one.
Its owner is `screenOwner`, else the NPC whose `needsHome` is its id (`ownerOf`, `:96-102`; on the
server `login_pc_owner`, `game.rb:1400`, which reads stamped ids).

On each leave `decideLocked` (`:119-140`) settles the screen in this order:

1. the policy's `autoLockMin: 0` locks it (the policy is `policies[obj.policy || defaultPolicy]`);
2. else the object's `lockChance` (0, 1, or a seeded roll with salt `screen:<pcId>:<leaves>`);
3. else the object's `locksScreenOnLeave`, if it is set at all;
4. else the owner's **`screenHabit`** (`{ lockChance, lockIfAwayOverSeconds }` on the NPC, read by
   `habitOf`, `:105-109`): a trip the needs system expects to last at most
   `lockIfAwayOverSeconds` stays open, and a longer one (or one with no estimate) rolls the habit's
   `lockChance` with salt `habit:<pcId>:<leaves>`, so the object's `screen:` sequence never shifts;
   a habit with no `lockChance` locks;
5. else it locks.

Two late locks can then close a screen the leave left open: a policy with `autoLockMin` above 0
(`lockAt`, `_rollScreen`, `:220-235`) and the object's own `autoLockSeconds`, an idle lock run on
the needs clock (`tick`, `:410-425`). Both emit `workstation_auto_locked:<id>` (`:294`). Every change
of the locked state emits `workstation_screen_changed:<id>` `{ objectId, ownerId, locked, how }`
(`_changed`, `:176-178`), with `how` one of `leave`, `auto`, `return`, `ko` (a knock-out at the
desk) or `late` (a station first settled when the player clicks it). `workstation_owner_left`
carries `reason` (`:367`), and `workstation_owner_returned` carries `wasLocked`, the state just
before the return (`:400`). A click on a locked screen emits `workstation_locked_attempt:<id>` and
on an open one `workstation_accessed:<id>` (`onInteract`, `:428-447`). The schema and the office
life validator already know `screenHabit` and `autoLockSeconds`
(`scripts/validate_npc_needs.rb:496-570`, whose `habit_leaves_open?` at `:511-517` is the Ruby form
of step 4 above).

**The server's claim check has a gap.** `claim_login_session!` (`game.rb:1449`) refuses a claim at
a PC that "always locks" (`pc_always_locks?`, `:1409-1414`) and, separately, under a policy with
`autoLockMin: 0` (`:1470-1471`). `pc_always_locks?` reads only the object's `lockChance` and
`locksScreenOnLeave`; nothing on the server reads `screenHabit`. A sign-in PC with neither field
whose owner has a `screenHabit` that leaves it open is "always locks" to the server, so the client
shows an open screen and offers the claim, and the server refuses it. This slice fixes that in
step 1 (5.2), because the habit it builds fills `screenHabit`.

Ids are stamped onto room objects that lack one as `"#{room_id}_#{obj['type']}_#{i}"`, and onto
their contents as `<parent id>_content_<i>` (`stamp_scenario_object_ids!`, `game.rb:4058`, and
`stamp_contents_ids!`), mirrored in the client (`core/rooms.js`).

**The locked look, and the lock cues.** `systems/screen-states.js` draws a `<key>_locked` texture
where one is loaded for the sprite's key (today `pc_desktop` only) and records every picture change
for the test bridge (`window.__test.access.screenTransitions()`). Where office life's lock cues are
installed (`window.npcOfficeVisuals`, installed with the needs system, `core/game.js:1987`, and on
unless the scenario sets `"lockCues": false`), `screen-states.js` plays no sound and records
`sound: null` (`:99-107`): the cue is office life's, on `workstation_screen_changed`
(`onScreenChanged`, `systems/npc-office-visuals.js:375-397`). In a lit room it is
`lightingSystem.flash`, otherwise a padlock glyph over the screen for a second; a lock or an
unlock by a key press (`how` `leave` or `return`) also plays a chime in the player's own room.
`auto` and `ko` play no chime and `late` no cue at all (`lockCuePlan`, `:90-99`). Each cue is
recorded in `window.npcOfficeVisuals.cueLog` (`:256`, entries
`{ t, objectId, how, locked, flash, glyph, chime }`, `chime` holding `key` and `volume`), and a chime
that is heard emits `workstation_lock_heard:<id>`. The test bridge has no wrapper for `cueLog`; a
script reads it from `window`. The room lighting system draws an indicator dot on every owned
workstation, steady blue while locked and a warm breathing dot while left open
(`systems/lighting.js:40-47`). All of these follow the workstation state, so a habit that feeds it
needs no client change.

**What the user saw.** The user's hands-on test of the lab reported no lock screens and no
sounds. The build they played (`8261e7422`) had no `screen-states.js` at all. This branch
swaps in `pc_desktop_locked` on Chris's PC and plays office life's cues on her leave and return.
What is still thin is not a fault in `screen-states.js`: the chime is quiet and heard only in the
player's own room, Melanie's PC never locks, and Sofia's PC is not a workstation, so only one of
the three desks ever shows the look. The engine plan owns the cues (its item 1).

**Sticky notes.** A sign-in screen shows the PC object's own `postitNote` unless the object sets
`showPostit: false` (`openLoginSignIn`, `systems/unlock-system.js:274-327`, at `:317-318`). The
screen refreshes its account tiles from `GET /login_accounts` every time it opens (`:279-290`;
`games_controller.rb:1108-1116`, which checks the PC is reachable and answers with `pc_id`).
Whenever a note shows, the screen has an "add to notebook" button
(`minigames/password/password-minigame.js:187-192`, `:424-428`, `addPostitToNotebook` at `:728`).
Pressing it starts the notes minigame, which ends the sign-in screen
(`minigames/framework/minigame-manager.js:61-69`); nothing reopens it. A saved note is synced into
`player_state['notes']` (`games_controller.rb:1703-1705`; only the client ever writes notes) and
sent back as `savedNotes` on every later `GET /scenario` (`:307-309`). The sync's own answer holds
no notes. Authored `postitNote`s also sit on password locks in shipped missions (m01 to m04,
sis01). The `notes_postit1` picture (9 by 9 px) is preloaded (`core/game.js:1334`).

**Sign-in is exact.** The server compares a typed password with `creds.password` exactly, case
included (`attempt_login!`, `game.rb:1419-1443`), and under a policy with `maxAttempts` a username
is locked out at that PC for the rest of the game. So a password the player is meant to work out
has to be wholly derivable from what they can read: one character they have to guess turns the
puzzle into guessing, and can cost them the account.

**Gates.** A gate door is `rooms.<id>.doors[].gate` with `openFor` (a list, or one string),
`openRadius`, `holdMs` and `playerMayPassIf` (`normaliseGate`, `systems/door-gates.js:68-80`, which
keeps those four keys). It reaches the client in room data (`doors.js:567`; the bootstrap drops
`doors`). The gate opens when an `openFor` NPC is within the radius (`_npcNear`, `:454-462`, a
boolean) and stays open for `holdMs` after the last one leaves it (`update`, `:503-528`): that hold
is the tailgate window. `open(g)` (`:240-262`) starts an open period and `close(g)` (`:354-367`)
ends it; `playerOpen()` starts its period through `open()`, or re-announces one already open
(`:307-327`). `door_gate_opened` and `door_gate_closed` carry the group's `roomId` and
`connectedRoom` (`_afterToggle`, `:232-238`), which are those of whichever door sprite registered
first; `door_gate_denied` carries those of the sprite clicked (`doors.js:733`). Either way a
mapping that means "this gate" needs one entry per field, because an `eventMappings` condition
has no `||` (the lab learned this, `scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md:304`).
`openToPlayer(g)` (`:332-337`) is the one question "may the player walk through this open gate
now": a clone hold first, then `playerMayPassIf`. A click asks it through `clickOutcome`
(`:349-352`) only for `pass` or `denied` (`doors.js:719-735`); a click with a clone goes to the
server first (`notifyServerUnlock`, `doors.js:661-714`) and then to `playerOpen()`.

**The owner's gate rule.** A player within the radius of a gate whose `playerMayPassIf` global is
false is **barred** (`_playerBarred`, `:465-474`). A shut gate stays shut while a barred player is
there, even beside its guard; a guard held at it for `GUARD_TURN_BACK_MS` (5 s) turns back, resumes
his route on his own side and tries again next cycle (`_holdGuards`, `:437-452`, which calls his
behaviour's `turnBackFromGate` and emits `door_gate_guard_turned_back` with his `npcId`). An open
gate shuts at once when a barred player comes within the radius, skipping `holdMs`, but only after
two checks that keep it open: the player overlapping the door's body, or a guard in the doorway
(`update`, `:520-523`). Those two checks are the remaining way past a careful gate: a player who
dashes into the doorway while it is open keeps it open and walks through. A forced shut
(`closeNow`, `:482-500`, the scenario action `closeDoor`) keeps a gate shut for at least `holdMs` or
3 s (`forcedUntil`). The engine plan's door work (its item 3) adds the body rule that closes the
dash: a north or south gate whose open doorway is not open to the player is solid for them, and a
walk into it is refused with `door_gate_denied`. That plan is being rewritten around this rule;
it keeps the turn-back.

A gated room is unlocked on the server by its guard's first pass, through his route's `unlockRoom`
action (`_runRouteAction`, `systems/npc-behavior.js:1913-1921`), so its room data can be fetched from
then on. Every gate in a scenario today has `playerMayPassIf` (`lab_physical_pentest`,
`test_gate_tailgate`). A gate guard needs a multi-room route with an `unlockRoom` action at the
door (`scenarios/test_gate_tailgate/scenario.json.erb`).

**Social engineering blocks** (`social.characters`, `social.pretextNpcs`, `social.phishTargets`)
ship in the bootstrap as authored, apart from capture secrets (`game.rb:895-901`). In every scenario
that has them the targets are phone or email characters with no room NPC. Awareness lives on room
NPCs so that it can be withheld, so no scenario today could use an awareness default for a social
engineering block. `social.characters` entries carry a `role` key of their own, and `social`
has an `awareness` block for the awareness course; neither is an NPC record.

**The validator.** `check_access_model(json_data, repo_root = nil, scenario_dir = nil)`
(`validate_scenario.rb:5927`, called at `:6599`) builds its NPC index and PC list from the authored
scenario at the top and reads them throughout. Its warning about a session that rests on a roll
runs only inside the sign-in PC loop, for an authored `lockChance` above 0 and below 1
(`:6187-6191`), beside the "owner never leaves" warning (`:6192-6195`).
`validator-access-model.test.mjs` calls it with three positional arguments
(`test/js/validator-access-model.test.mjs:22`), after a `require` of `validate_scenario.rb`, whose
`main` runs only when the file is the program (`:6710`). The nearest precedent for checks kept in
their own file is a module called from the same list: `ValidateNpcNeeds.check(json_data)`
(`scripts/validate_npc_needs.rb:16`, called at `validate_scenario.rb:6598`, loaded by
`require_relative` at `:19`). Its lock habit rules (`check_lock_habits`, `:519`, called at `:52`)
read the authored `screenHabit` and `autoLockSeconds`; one of them warns that an object's
`autoLockSeconds` "never applies" when the screen always locks, which it judges from the owner's
authored habit (`:562-567`). Every NPC record, room and headless, is listed by
`scenario_npc_records` (`:884`). The dungeon graph draws each account as a
sign-in key node, hung from the room its NPC stands in, with an edge to every PC it opens
(`generate_dungeon_graph.rb:291-340`).

**The lab's hand-set habits.** In `scenarios/lab_physical_pentest/scenario.json.erb` at this commit:
Chris's `staff_pc` (a plain workstation, erb:1366-1378) sets `"locksScreenOnLeave": true`, and her
keylogger capture depends on a lock at every leave (`workstation_owner_returned:staff_pc` with
`data.wasLocked === true`, erb:1070-1071), guarded by
`test/models/break_escape/lab_physical_pentest_secrets_test.rb`. Melanie's `staff_pc_2` (a sign-in
PC admitting `pierce` only, erb:1500-1519) sets `"locksScreenOnLeave": false`. Sofia's
`usb_target_pc` is not a workstation. No NPC in the lab has a `screenHabit` and no object has an
`autoLockSeconds`; Chris's and Melanie's office life fields are needs, `needsCompany` (both avoid
Sofia), `maxQueue`, `chatterCooldownMin` and `exchanges` (erb:1044-1062). Len's gate has
`playerMayPassIf` and he has `los.challengeOnSight`, both explicit. All three desk staff hold
accounts. Two other plans edit the lab before this one does, so section 12 is written as a recipe
by object id, not as line edits.

**A naming hazard.** "Awareness" is already the name of the security awareness course in this
codebase (`social.awareness`, `awarenessEpisode`, `scripts/validate_social/awareness.rb`,
`window.breakEscapeConfig.awareness`). The NPC field keeps the name the user chose. All new code is
named for **habits** (`NpcHabits`, `validate_npc_habits.rb`, `npc_habits_*` tests), so a search for
the course never lands in this slice and the reverse.

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
| Build order | 9.3a, then this slice, then 9.2. | The lab's drop box needs 9.3a first, and 9.2's workarounds stand on this slice's helpers. |
| Social engineering habits | `phishable`, `pretextable` and `challengesStrangers` are **not built and not accepted** in this slice. The design note in 5.6 is kept for the slice that builds them. | No scenario can use them: every social engineering target today is a phone or email character with no room NPC. |
| The sticky note | A `writesDown` note is read on the sign-in screen of the owner's own PC, at the desk, with a note picture on the monitor in the room. Its text is served only by `GET /login_accounts` and is never shown on a remote sign-in screen. A generated note in a drawer is a later idea (section 17). | A note on a monitor cannot be read over a network. One place, one rule. |
| A `guessable` password | The player types what they worked out at the sign-in screen. No guessing helper. The validator accepts the habit only when every character of the password is accounted for: each word and number in it has a source the player can read, and each short piece and symbol is stated in a named pattern clue (7.2). | Sign-in is exact and can lock an account out, so the player must be able to work out the whole password, not most of it. It is a puzzle, not a guess. |
| `writesDown`, `password` and the presets | Both are explicit only. No preset sets either. | `writesDown` hands over a permanent password, and one word on an NPC should not open a free route past a capture the author built. `password` changes nothing at run time, so a preset value would be a claim about a password the author already wrote, and a standing suggestion on every desk. |
| The lab | The lab swaps its hand-set screen fields for habits in this slice, with no change to play. The step comes after the lab's feedback pass and after 9.3's lab step, and is written as a recipe (section 12). | The user's copy of the lab is ahead of this branch, and both of those edit the same file first. |
| `locksScreen` and office life's `screenHabit` | The expansion fills the field the client's `decideLocked` reads for an owner: the NPC's `screenHabit`, as `{ "lockChance": 0 \| 0.5 \| 1 }`. An authored `screenHabit` is explicit and is never overridden; the habit is then not applied. The PC's own `lockChance` and `locksScreenOnLeave` still win over both, as `decideLocked` already rules. Settled by the orchestrator, 2026-11-10. | One behaviour of one person has one field. No object is filled, so a habit can never turn an ordinary object into a workstation, and the server, the validator and the graph read one rule for the owner. |
| `holdsDoors` | Built as the last part of this slice (step 5), whole, after the engine plan's door work: the body rule on top of the owner's turn-back rule (its item 3, decision X1: a north or south gate is solid for a player it is not open to; east and west doors cannot be gates). Until step 5 nothing about `holdsDoors` is in the library, the schema or the presets. | Today a player who dashes into an open gate's doorway keeps it open and walks through (section 2). With the body rule a careful guard's door cannot be walked through by waiting or by dashing, so the habit is something a puzzle can stand on. Without it the habit would be accepted and only half work. |
| The browser never reads a habit | Where slice 9.2 needs to know whether a guest locks a borrowed PC, the server decides and sends `leavesOpen` in the hand-over. | Section 14.2. |

Planner decisions (the user can overrule any):

| Area | Decision | Why |
|---|---|---|
| Where the expansion runs | On the server, once, in the loader, written into the saved scenario data. | The client never sees a habit, the server's own checks read the same filled fields, and a game keeps the habits it started with. |
| One library | `lib/break_escape/npc_habits.rb` and `lib/break_escape/npc_habits/clues.rb`, plain Ruby, used by the server, the validator and the dungeon graph. | One set of presets and one expansion. No mirror to drift. |
| Explicit wins | A field the author wrote on the PC, on the gate or as the NPC's `screenHabit` is never changed by a habit. | The rule every habit shares, so authors learn it once. |
| The note's text is served on demand | Room data says only that a note is there (`hasPostit`). | The password leaves the server when the sign-in screen opens, not when the room loads, and a note that appears mid-game (slice 9.2) needs no room reload. |
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
  "habits": {                                      // any subset
    "writesDown": true,
    "password": "guessable",
    "passwordPattern": "it_password_memo"          // with "guessable": the object that gives the pattern
  }
}

// top level, optional: a default level by role
"roles": { "reception": { "awareness": "low" }, "staff": { "awareness": "medium" } }
```

- **Where.** `awareness` and `habits` are allowed only on room NPCs (`rooms.<id>.npcs[]`), like
  `role` and `creds`. The validator errors on them on any other NPC record.
- **Awareness** is optional. An NPC's level is its own `awareness`, else the `awareness` of the
  first role in `AccessIdentities.identity_roles(npc)` (its authored roles in the order written,
  then the implicit `staff`) that has one under the top-level `roles`, else none. The implicit
  `staff` is added only for an NPC with a `creds` object or a card, and not with `"staff": false`
  (`access_identities.rb:60-66`), so `roles.staff.awareness` is a default for every NPC with an
  account or a card. A gate guard or a cleaner with neither gets no level from it: give them a
  role with a level, or their own `awareness`. An NPC with no level gets no preset: only the habits
  written in `habits` exist for it, and every other habit is absent and does nothing. A scenario
  that uses none of these fields is untouched.
- **Habits** set by name override the preset. An unknown habit name or a value outside the table is
  a validator error; the loader ignores it.
- **`roles`** is shared with slice 9.2, which puts its own keys in the same objects. This slice
  reads `awareness` there and nothing else (section 14).

### 4.1 The habits

| Habit | Values | Set by | What it gives the player | Expands into |
|---|---|---|---|---|
| `locksScreen` | `never`, `sometimes`, `always` | Preset or by name | An unlocked session at the owner's desk while they are away | The NPC's `screenHabit` `{ "lockChance": 0 }`, `0.5` or `1`, read for every workstation the NPC owns that sets no lock field of its own (5.2) |
| `writesDown` | `true`, `false` | By name only | The account's username and password, read off a sticky note on the owner's sign-in screen | `hasPostit` on each sign-in PC the NPC owns, and the note in that PC's `GET /login_accounts` answer (5.3) |
| `password` | `strong`, `guessable`, `reused` | By name only | The password, worked out from clues or carried over from another system | Nothing at run time. The validator checks the scenario backs it (7.2). With `guessable`, the parameter `passwordPattern` (in `habits`, not a habit of its own, 5.1) names the pattern clue |
| `holdsDoors` (step 5) | `true`, `false` | Preset or by name | A walk through a gate door behind the NPC, or a guard who will not open the door with the player at her shoulder | `gate.noHold` on gate doors that open for the NPC (5.4) |

The chain each one feeds:

- `locksScreen: never` gives a claimed session, so the owner's desktop and profiles, so whatever
  card, code or password those hold.
- `writesDown` gives a password, which signs in at every PC whose access list admits that account,
  at the desk or (with slice 9.3) from a device on the network, for the whole game.
- `password: guessable` gives the same from clues in the world (a photo, a post, a calendar, a
  password policy memo), and `reused` from another lock or a captured sign-in that holds the same
  password.
- `holdsDoors: true` gives a room, and whatever identity or object is in it. `holdsDoors: false`
  sends the player to find another way through that door: a copied badge, or the colleague who
  does hold it.

### 4.2 Presets

| Habit | `low` | `medium` | `high` |
|---|---|---|---|
| `locksScreen` | `never` | `sometimes` | `always` |
| `holdsDoors` (step 5) | `true` | `true` | `false` |

`writesDown` and `password` are in no preset. The values are constants in one place
(`NpcHabits::PRESETS`) and are tuned once a scenario has used them.

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
| Owner away, screen locked (`always`, or a locked roll) | The padlock look on the monitor where the PC's sprite has locked art (`"sprite": "pc_desktop"`); office life's lock cue (a flash at the monitor in a lit room, else a padlock glyph for a second) and, if the player is in the room, its chime; a steady blue indicator dot. A click opens the sign-in screen |
| Owner away, screen left open (`never`, or an open roll) | The desktop look stays, with the warm breathing indicator dot. A click opens the owner's desktop |
| A written-down password | A sticky note picture at the top-left corner of the monitor, whether or not the owner is there. The note's text is on the sign-in screen |
| A careful guard's gate (step 5) | With the player close by, the guard will not open the door: she waits at it and turns back after five seconds (`door_gate_guard_turned_back`). Once it is open, it shuts as soon as the player comes within its radius, instead of lingering for `holdMs`, and with the engine plan's body rule a player who walks into it gets the door's refusal toast at once. A scenario adds the guard's bark on `door_gate_denied` or on the turn-back |
| A careless guard's gate | The door opens with the player beside the guard and lingers open after them, as every gate without a bar does today |
| A guessable or reused password | Nothing of its own: the clues are objects and posts the author placed |

The lock cues belong to office life (`systems/npc-office-visuals.js`) and the engine plan's item 1
owns any change to how loud or how visible they are; it holds its asset version stamp until the
user answers a question about their server. The indicator dot is the cue for a screen left open,
and exists only where the room lighting system runs. This slice changes nothing in
`screen-states.js` or `npc-office-visuals.js` and depends on no change to either; the tells in this
table get stronger if item 1 lands. A workstation that should show a padlock must set
`"sprite": "pc_desktop"`; the validator suggests it for any workstation whose owner has a
`locksScreen` habit (7.2).

### 4.4 Fields the loader writes

Authors do not write these; the loader does, into the saved scenario data. An author who does write
one has made it explicit, and it wins.

| Field | On | Written when |
|---|---|---|
| `habits`, with every preset habit the build has | The NPC | The NPC has a level. With `habits` alone, the object is left as written, minus invalid entries |
| `screenHabit` (`{ "lockChance": n }`) | The NPC | 5.2 |
| `noHold` (step 5) | A door's `gate` | 5.4 |

## 5. Engine and server changes

### 5.1 The library

Two new files, named for their constants so the engine's autoloader finds them:

- `lib/break_escape/npc_habits.rb` defines `BreakEscape::NpcHabits`;
- `lib/break_escape/npc_habits/clues.rb` defines `BreakEscape::NpcHabits::Clues` (7.2).

Both are plain Ruby with no Rails and no ActiveSupport methods (`deep_dup`, `present?`, `blank?`),
and neither holds a `require` or `require_relative` of the other or of `access_identities.rb`. The
engine finds all three by autoload. The scripts add `require_relative` lines after the ones they
have (`access_identities`, then `npc_habits`, then `npc_habits/clues`). `NpcHabits` uses
`BreakEscape::AccessIdentities` for the rules that already exist there (`room_npcs`,
`room_objects`, `owner_id`, `login_pc?`, `workstation?`, `account?`, `identity_roles`), and for one
it gains in step 1, `screen_always_locks?(pc, owner)` (5.2).

| Function | Returns |
|---|---|
| `LEVELS`, `HABITS`, `PRESETS` | The three levels; each habit's allowed values; the table in 4.2. Step 1 builds them with `locksScreen`, `writesDown` and `password`; step 5 adds `holdsDoors` |
| `PARAMETERS` | Keys allowed in `habits` that are not habits: `passwordPattern` only (below) |
| `level_of(npc, scenario)` | The NPC's level by the rule in section 4, or nil |
| `expanded(npc, scenario)` | The NPC's habits after the preset and the overrides: every preset habit with a level, plus the valid authored keys; only the valid authored keys without a level; nil when the NPC has neither. Invalid names and values are dropped. A valid `passwordPattern` is kept as written |
| `sources(npc, scenario)` | For each expanded habit, `:explicit` or `:preset`. Meaningful on authored data only. Parameters are not listed |
| `lock_chance(value)` | `never` 0, `sometimes` 0.5, `always` 1 |
| `expand!(scenario)` | Runs the whole expansion on the scenario hash in place (5.2, and 5.4 from step 5) and returns a report: one entry per thing it filled or left alone, with the reason. Idempotent. Never raises on malformed input |
| `expanded_copy(scenario)` | For the scripts: a deep copy of the authored scenario (`Marshal.load(Marshal.dump(...))`, so no `require`), with ids stamped onto room objects and their contents that lack one by the server's rule (section 2), then `expand!` on the copy. Returns the copy and the report. The authored hash is not changed. The validator and the dungeon graph both build their copy with it, so they see the same owners and fills the server does |

**`passwordPattern` is a parameter of `password`, not a habit.** It is valid when it is a
non-empty string; a value of any other type is the schema's error, and `expanded` drops it. It is
never in `PRESETS`, has no `sources` entry, and the habits report does not list it as a habit: it
appears under the `password` line as "pattern clue at <path>". Whether it names a real object, and
whether it goes with `guessable`, are the validator's checks (7.2).

`expand!` is idempotent because every fill is "only when the author left it out": on a second run
the NPC's `habits` already holds the preset keys, the NPC already has its `screenHabit`, and each
gate its `noHold`. For the same reason the report and `sources` say something useful only on the
first run, on authored data. On saved game data a filled field cannot be told from an authored one,
and the report is not saved. Tools that read a saved game print values only (step 6); "why" is the
validator's job.

**Malformed input.** A scenario that the validator would reject must still create a game. `habits`
that is not an object, an `awareness` that is not a string, `roles` that is not an object, `doors`
that is not a list, a `gate` that is not an object: each is skipped with no exception and no
change.

### 5.2 The loader, and `locksScreen`

`prepare_scenario_data!` becomes: `normalise_access_model!`, then `stamp_scenario_object_ids!`,
then `BreakEscape::NpcHabits.expand!(scenario_data)`. The expansion runs last so that it sees the
ids the server's own owner lookup sees: a PC with a `screenOwner` and no authored id, or a
`needsHome` that names a stamped id, is owned at run time and counts.

**What `locksScreen` fills.** The habit fills the field the client's `decideLocked` reads for an
owner (section 2, step 4 of the order): the NPC's own `screenHabit`. For each room NPC with an
expanded `locksScreen`:

- if the NPC has an authored `screenHabit` (whatever its value), nothing is filled: that is the
  author's statement of the same habit, and it is explicit. The report says "habit not applied:
  the NPC sets screenHabit";
- the NPC's owned workstations are found. `expand!` never matches an object with no id to an
  owner: it does not ask `owner_id` about one, because that function would match a missing id to
  the first NPC with no `needsHome`. (On the server every object has an id by now, and the
  scripts' copy from `expanded_copy` is stamped by the same rule; an object can lack one only when
  `expand!` is called on raw data, as in a unit test.) A workstation is
  `AccessIdentities.workstation?`;
- if every owned workstation sets its own `lockChance` or `locksScreenOnLeave`, or the NPC owns
  none, nothing is filled, and the report says why: the PC's field wins in `decideLocked`, so a
  filled habit would do nothing;
- otherwise `screenHabit` is set to `{ "lockChance": 0 }`, `0.5` or `1` (`lock_chance(value)`), with
  no `lockIfAwayOverSeconds`. Each owned workstation that sets its own field keeps it, and the
  report says the habit is not applied there.

No object is written. A filled `screenHabit` reaches the browser in room data on the NPC, as an
authored one does, and the client's leave roll uses it unchanged: the roll's salt is
`habit:<pcId>:<leaves>`, seeded per NPC.

**The server reads the habit too (the claim check).** Today `pc_always_locks?` (`game.rb:1409-1414`)
reads only the PC's two fields, so a sign-in PC whose owner's `screenHabit` leaves it open is
refused a claim while the client shows it open (section 2). Step 1 fixes it before anything fills
a habit:

- `AccessIdentities.screen_always_locks?(pc, owner)` (new, plain Ruby) answers "does every leave
  lock this screen", in `decideLocked`'s order without the policy: a numeric `lockChance` on the
  PC, `>= 1`; else a `locksScreenOnLeave` key on the PC, `!= false`; else the owner's
  `screenHabit`: not an object, true; a numeric `lockIfAwayOverSeconds`, false (a short trip stays
  open); a numeric `lockChance`, `>= 1`; otherwise true. It is the rule
  `ValidateNpcNeeds.habit_leaves_open?` already applies (`scripts/validate_npc_needs.rb:511-517`,
  used at `:562-567`).
- `Game#pc_always_locks?(pc, owner = login_pc_owner(pc))` returns
  `BreakEscape::AccessIdentities.screen_always_locks?(pc, owner)`. `claim_login_session!` passes
  the owner it has already found. The policy check after it (`autoLockMin: 0`) is unchanged.
- The dungeon graph's "unlocked screen" edge (7.3) asks the same function.

This fixes the gap for an authored `screenHabit` as well as a filled one. No scenario today has a
sign-in PC whose owner has a `screenHabit`, so no existing claim changes.

Everything else downstream is unchanged and already built: the leave roll and its seeded sequence,
the PC's own fields beating the habit, the policy's `autoLockMin` beating both, the late locks
(`autoLockMin` above 0, `autoLockSeconds`), the padlock look and the lock cues, and the claim.

**Server helpers.** `Game#npc_habit(npc, name)` returns `npc['habits'][name]` from the saved,
expanded scenario data, or nil; every server read of a habit goes through it.
`Game#written_down?(npc)` answers whether that person's password is on a note: in this slice,
`npc_habit(npc, 'writesDown') == true`. It is the one helper slice 9.2 extends for its
`writes_down` workaround (section 14). Both are public, as is `login_postit_for` (5.3), so the
playtest tools can call them.

**The bootstrap.** `filtered_scenario_for_bootstrap` deletes the whole top-level `roles` key.
Nothing in the browser reads it, and slice 9.2 deletes it too: one line, one rule for both.

### 5.3 `writesDown`: the sticky note

**Server.** `Game#login_postit_for(pc)` returns the note for a sign-in PC, or nil. It returns
`"<username> / <password>"` from the owner's `creds` when all of these hold: the PC has an owner
(`login_pc_owner`); the owner has an account; `written_down?(owner)`; the PC object authors no
`postitNote` of its own; and it does not set `showPostit: false`. An authored note is a deliberate
clue, ships in room data as today and wins. An authored `showPostit: false` is the author saying
this PC shows no note, and it wins too.

- `GET /login_accounts` adds `postitNote` to its answer when `login_postit_for` returns one, and
  sets `Cache-Control: no-store` on every answer, because a GET can now carry a password. Its
  existing checks stand: the PC exists and is reachable (its room is unlocked or was never locked),
  else 404 or 403.
- `filtered_room_data` sets `hasPostit: true` on a sign-in PC for which `login_postit_for` returns
  a note, in the pass that attaches the account tiles (`attach_login_accounts!`). It never sets the
  text.

No other response is given the note by the server. Room data, the bootstrap, `container` and a door
unlock's answer never hold it.

**Never over a network.** Slice 9.3's remote sign-in screen does not call `/login_accounts`, so it
shows no note. This is a rule, not a side effect: a note stuck to a monitor is read at the desk.
The player reads it there and may then type the password remotely. Any later code that opens a
sign-in screen for a PC the player is not standing at must not ask for the note.

**Client.**

- `openLoginSignIn` takes the note from the answer: `answer.postitNote` when it is a non-empty
  string, else the object's own `postitNote`, else none. It does not write the answer's note onto
  the object's data, so each open asks again. If the request fails, the screen opens with the
  authored note or none, as today. `showPostit` follows the note as now.
- `pcSessions.screenShown` gains a fourth argument, and `pc_signin_shown` gains `hasPostit` (true
  when the screen shows any note), so a scenario can credit "found the note" from an event mapping
  (`data.hasPostit === true`).
- A new small module, `systems/postit-marks.js` (`window.postitMarks`), draws the `notes_postit1`
  picture on a **sign-in PC** (`lockType: "login"`, nothing else, so password locks with authored
  notes in shipped missions are untouched) whose data has `hasPostit`, or an authored `postitNote`
  with `showPostit` not false. The picture sits at the monitor's **top-left** corner, clear of the
  indicator dot at the top-right, at a depth just above the monitor and below the dot and the
  engine plan's rising padlock icon. It follows the sprite's visibility and takes no clicks.
  `syncRoom(roomId)` is called from `core/rooms.js` once a room's sprites are made, beside the
  `screenStates` call, and `mark(pcId, on)` lets slice 9.2 add one mid-game.

**The player's own copy.** The sign-in screen's "add to notebook" button works for a habit note as
for any note. A saved note is the player's earned copy and is how they carry the password to the
next PC, so that stays. It means the password is afterwards in the player's saved notes, which the
server stores and returns in `savedNotes` on later loads (section 6). Pressing the button closes
the sign-in screen today (section 2), so the player clicks the PC again to type the password. That
is existing behaviour for every note and is not changed here; the orchestrator files it in
`docs/IDEAS_BACKLOG.md`.

**Where the note shows.** Wherever the sign-in screen does at the desk: on a locked screen while
the owner is away, and behind **Switch user** on a desktop. A click while the owner sits at the PC
stops at "<name> is using this PC", so the picture on the monitor is the hint to come back. A PC
whose owner never locks goes straight to the claimed desktop, so its note is read only through
**Switch user**; the feature scenario pairs `writesDown` with a screen that locks.

**What it proves.** The server cannot see where the player stands, so the reach check is the room,
the same strength as room data. A modified client can ask for the note of any sign-in PC in a room
the server has unlocked, whether or not the owner is at the desk. A gate door does not count as a
lock for this: a gated room is unlocked on the server by its guard's first pass. A gate keeps a
player out of a room; it does not keep a secret. A puzzle whose note must not be readable early
keeps the PC behind a lock the server checks (a key, a PIN, a badge reader).

### 5.4 `holdsDoors`: gates (step 5)

Everything in this section is built in step 5 and nowhere earlier. Until then the engine knows no
`holdsDoors` habit and writes no `noHold`.

**The idea.** A careful guard treats the player as the owner's gate rule treats an undisguised
player at a `playerMayPassIf` gate (section 2): she will not open her door with the player close
by, and turns back instead; once it is open, it shuts as soon as the player comes near. A careless
guard lets the door open beside the player and linger after her. So `noHold` reuses the barred
player rule rather than adding a second one, and adds only what that rule cannot know: which
guards the open period belongs to.

**Who owns what.** The engine plan's item 3 (its decision X1, for gates on north and south doors
only) owns how a gate bars the player's body: the body rule, `blocksPlayer`, the bump and its
refusal, the exit opening, and the whole of `systems/door-gates.js` until that work is committed.
That plan is being rewritten around the owner's turn-back rule (`GUARD_TURN_BACK_MS`,
`turnBackFromGate`, `door_gate_guard_turned_back`), which it keeps. This slice owns one decision in
that file, which guards make the player barred, and makes it in seven places, all after the engine
plan's door work commits:

- `normaliseGate`: keeps `noHold`;
- `nearGuardIds(g)`: a new helper;
- `open(g)`: sets `lastGuards`;
- `close(g)`: clears it;
- `update()`: one line, the per-tick add to `lastGuards` while the gate is open;
- `_playerBarred(g)`: one clause;
- `openToPlayer(g, now)`: one clause.

So the builder of the door work knows `update()` will gain one line. Step 5 starts when that work
is committed **and** the merged code meets this contract:

1. `openToPlayer(g, now)` is the only question the gate asks to decide whether the player may walk
   through it while it is open. (On `main` a click asks it, `doors.js:719-735`; the body rule will
   ask it for a walk.)
2. While it answers no, a player outside the secured room cannot cross, by waiting or by dashing
   (in the engine plan's terms the exported predicate `blocksPlayer(g, { playerRoom, now })` is
   true and the door's own body stays solid for the player), so `room_entered` for the secured
   room means a permitted entry. **Unmet on `main`:** an open gate stays open while the player
   overlaps its body or a guard is in the doorway (`update`, `door-gates.js:520-522`), and the
   barred test comes after both, so a dash keeps it open. The body rule closes this.
3. A refused walk into the door emits `door_gate_denied` (in the engine plan, at most once every
   4 s per gate), as a refused click does (`doors.js:733`).
4. A clone hold answers yes first. True on `main` (`openToPlayer`, `:334`).
5. `close(g)` is the one place a gate's open period ends, and `open(g)` the one place it starts.
   True on `main`: `playerOpen()` starts its period through `open()` (`:323-324`), and a forced shut
   goes through `close()` (`closeNow`, `:482-500`). The step 5 builder confirms the same of the
   engine plan's exit opening before writing anything.
6. A barred player keeps a shut gate shut, the guard turning back after `GUARD_TURN_BACK_MS`
   (`update`, `:512-518`; `_holdGuards`, `:437-452`), and a barred player within the radius shuts
   an open gate on the first tick nobody is in the doorway, skipping the `holdMs` wait (`:523`).
   True on `main` for `playerMayPassIf`; step 5 reaches it for `noHold` through its clause in
   `_playerBarred`, so the door work must keep both branches reading `_playerBarred`.

Item 6 is what makes a careful guard's door visibly different from a careless one's: she turns
back rather than open it beside the player, and it shuts on her heels instead of lingering (4.3).
It is the habit's tell besides the bark, so it is part of the contract, and step 5 and beat H9
test it.

A guard who turns back never opened the gate (it stays shut while the player is barred), so she
never enters `lastGuards`. That is correct: the open period, if one comes, belongs to whoever
opens it.

One consequence of the clauses below, to keep as it is: with `lastGuards` empty (a gate opened by
an exit click, or by a clone with no guard near), the `noHold` clauses answer as if no guard were
careful. Both cases already let the player through by other rules (the exit opening is for a
player inside; the clone hold answers yes first), so this is harmless and is not a gap to close.

If the door work is not built or does not meet the contract, step 5 is not built and nothing else
in this slice changes: the other three habits are complete without it. A partial `noHold` on
`main` without the body rule (the two clauses alone) would keep the dash open, so a careful guard's
door could still be walked through by a player who times it; it is not built that way.

**Library and loader (step 5).** `HABITS` and `PRESETS` gain `holdsDoors`. `expand!` gains the gate
fill: for each `rooms.<id>.doors[]` entry with a `gate` that has no `playerMayPassIf` and no
authored `noHold`, `noHold` is the list of its `openFor` NPC ids whose expanded `holdsDoors` is
`false`, written only when the list is not empty. An `openFor` written as one string is read as a
one-item list, as the client does. The schema gains `gate.noHold`. A guard with no level and no
`holdsDoors` by name (for example one with no account or card and no role with a level, section 4)
is not in `noHold`, so their gate behaves as a careless guard's.

**Client** (`systems/door-gates.js`, after the door work).

- `normaliseGate` keeps `noHold` (a list of strings, default empty).
- A new helper, `nearGuardIds(g)`, returns the ids of the `openFor` NPCs within the radius
  (`_npcNear` returns only whether there is one).
- Each gate group keeps `lastGuards`: the guards this open period belongs to. `open(g)` sets it to
  `nearGuardIds(g)` on that tick; while the gate is open, each tick adds the ids then near;
  `close(g)` clears it. It is never added to while the gate is shut, so a guard who stood by a
  gate that was being held shut does not carry over into the next opening. The bar has to follow
  who the gate opened for, not who is near now, because a gate can stay open after its guard has
  walked out of the radius, and that is when a tailgater steps in.
- **The careful set.** For a gate with no `playerMayPassIf` and a non-empty `noHold`, the guards
  that count are `lastGuards` while the gate is open and `nearGuardIds(g)` while it is shut. The
  gate is careful when that set is not empty and every id in it is in `noHold`. One guard who holds
  doors among them is enough for not careful.
- `_playerBarred(g)` gains one clause: on a careful gate, the player within the radius is barred,
  exactly as for a false `playerMayPassIf`. That gives the keep-shut, the turn-back and the
  skipped hold with no new branch in `update()`.
- `openToPlayer(g, now)` gains one clause. A clone hold still answers yes first. A gate with
  `playerMayPassIf` answers as today and ignores `noHold`. Otherwise a careful gate answers no.
  A gate with no `noHold` answers yes.

`holdsDoors: true` needs no code: a gate with no bar is what the engine does today.

**What it is for.** With the body rule, `holdsDoors: false` is something a puzzle can stand on: the
player cannot get through that door behind that guard, so entering the room behind it means a
copied badge, another guard or another door. It is a bar on the player's body, not on data: the
room's data is in the browser from the guard's first pass (5.3), so nothing secret is protected by
a gate alone.

### 5.5 `password`

No engine change. The puzzle is played with what exists: clues in objects and posts, the sign-in
screen's **Other user** and tiles, and the server's exact comparison and count of failed sign-ins.
Because the comparison is exact and a counted policy locks the username out for the game, a
`guessable` password has to be fully worked out before the first try, from things the player can
read. So the habit asks two things of the scenario, both checked by the validator (7.2): every
word and number in the password has a source in the world (a pet's name on a photo caption, a
year on a calendar), and a **pattern clue**: `habits.passwordPattern` names a readable object (a
password policy memo, a help desk note, a sign by the printer) that tells the player how the
pieces go together, which letters are capitals, which symbols are used, and any short piece that
no other text could fairly supply ("start with IT", "end in 7!"). Every character of the password
is then accounted for by one of the two. The pattern is itself the lesson: a password built from a
rule and a few facts about a person is predictable.

### 5.6 Design note: the social engineering habits (not built)

Kept short for the slice that builds them. The link would be: a room NPC belongs to the social
character whose key is its id or whose `channels.person` names it. `phishable` would default that
character's phish target (`requiredFactors`, `advisoryFactors`, `runsExecutable`,
`primedFor.trusts`); `pretextable` its pretext entry (`tuning.maxRefusals`, `unverifiableCost`,
`susceptibility`); `challengesStrangers` the `at` of its `wary`, `refuses` and `reports`
thresholds. Each fill only where the author left the field out. Building it needs the schema to
allow a threshold with no `at`, and every social validator check that reads thresholds to run on
the expanded copy. None of that is done here. Until then the three names are unknown habits, and
the validator says so.

## 6. What reaches the browser, and what never does

| Thing | Reaches the browser? | How it is kept |
|---|---|---|
| `awareness`, `habits` on an NPC | Never | `withhold_npc_secrets!` already deletes both from every room NPC, and the validator allows them on room NPCs only. Step 1 adds the tests that hold this |
| The top-level `roles` | Never | Deleted in `filtered_scenario_for_bootstrap` (5.2) |
| The preset tables | Never | They are in the Ruby library. No JavaScript holds them |
| A filled `screenHabit` | Yes, in room data, on the NPC | The seeded roll runs in the browser, so it has to. It is the same exposure as an authored `screenHabit` or `lockChance` today. It tells a player who reads network traffic that an owner is careless, not what their password is. Accepted |
| `hasPostit` on a PC | Yes, in room data | It says a note is on the monitor, which the picture shows |
| The text of a `writesDown` note (username and password) | From the server, only in a `GET /login_accounts` answer for that owner's own reachable sign-in PC, sent `no-store`. Never on a remote sign-in screen | 5.3 |
| The same text in the player's saved notes | Yes, once the player has pressed "add to notebook" on that note: in `savedNotes` of later `GET /scenario` answers | It is the player's own copy of something they have read. Only the client writes notes, so it cannot be there before the note was served |
| `gate.noHold` (step 5) | Yes, in room data, on the door | It names NPC ids. Not secret |
| `passwordPattern`, the `password` habit and the validator's clue report | Never | `habits` is withheld; the report is authoring time only and names where a clue is and which part it backs by position, never the password or any text from it |
| `pc_signin_shown.hasPostit` | Yes, a boolean | It says a note is on screen, which the player can see |

The first slice's no-password test keeps its fixture free of `writesDown`. This slice adds a
second test for a fixture with it (step 2): before any note is saved, the password appears in the
`/login_accounts` answer for the owner's PC and in no other response; after the note is saved
through the notes sync, it also appears in `savedNotes`, and still nowhere else.

The playtest leak scanner learns two exceptions and one new finding (step 6):

- **The note.** A `/login_accounts` answer may hold a password at `$.postitNote` and nowhere else
  in its body, when the PC named by the answer's own `pc_id` (the scanner strips query strings) has
  an owner for whom the game says `written_down?`. The scanner is handed the game, not only its
  scenario data, because from slice 9.2 the answer depends on `player_state`. The exception covers
  that password value in that answer, whoever else shares the password.
- **The saved copy.** The same value inside `savedNotes` is allowed only when an earlier response
  line, in any of the files given and in the order given, was a `/login_accounts` answer that
  carried it.
- **Withheld keys.** Any NPC record with a `creds`, `role`, `awareness`, `habits` or `workarounds`
  key is reported, by key and NPC id. An NPC record is a hash with an `npcType` key, or an element
  of an array under a key named `npcs`. `social.characters` entries with a `role` and the
  `social.awareness` block are not NPC records and are not reported.

## 7. Validator, schema and dungeon graph

### 7.1 Schema (`scripts/scenario-schema.json`)

The schema edits for the three habits of steps 1 to 4 are made in step 1; the gate property is
made in step 5.

- NPC definition, beside `creds`: `awareness` (enum of the three levels) and `habits` (an object
  with the habits `locksScreen`, `writesDown` and `password`, each an enum of its values, and the
  parameter `passwordPattern`, a string of at least one character described as "the object that
  gives the pattern for a `guessable` password"; `additionalProperties: false`, `_comment`
  allowed). Step 5 adds `holdsDoors`.
- NPC `screenHabit` (already in the schema from office life): its description gains one sentence,
  that a `locksScreen` habit fills it when it is not authored, and that an authored one wins.
- Sign-in object: `hasPostit` is not authored and is not added; the description of `postitNote`
  says a habit can supply one.
- Top level: `roles`, an object of objects, each with an optional `awareness` enum and
  `additionalProperties: true`, so slice 9.2's keys are accepted. In the expected order this slice
  adds the key and 9.2 extends it.
- Step 5: door `gate.noHold`, an array of NPC ids, described as written by the loader.

### 7.2 Validator

The checks live in a new file, `scripts/validate_npc_habits.rb` (as the sibling slices keep theirs
in `validate_network.rb` and `validate_access_work.rb`), as a module in the shape of
`ValidateNpcNeeds`:

```ruby
module ValidateNpcHabits
  # Issue strings, prefixed as elsewhere ("❌ ERROR: habits: ...", "⚠️ WARNING: habits: ...",
  # "💡 SUGGESTION: habits: ..."). Never quotes a password.
  def self.check(json_data, expanded:, report:, scenario_dir: nil) ... end
  # The habits report (below) as lines; [] when no NPC has a level or `habits`.
  def self.report_lines(json_data, expanded:, report:, scenario_dir: nil) ... end
end
```

`json_data` is the authored scenario, `expanded` and `report` are what
`NpcHabits.expanded_copy(json_data)` returns (5.1), and `scenario_dir` enables the compiled ink
texts, as it does for `check_access_model`.

**Wiring.** `scripts/validate_scenario.rb` is touched only for the `require_relative` lines (after
`access_identities`: `../lib/break_escape/npc_habits`, `../lib/break_escape/npc_habits/clues`,
then `validate_npc_habits`), the known-field lists (`awareness` and `habits` on NPCs, `roles` at
the top level), and three lines in `main`: the `expanded_copy` line just before the
`ValidateNpcNeeds.check` call (`:6598`), that call's new keyword (below), and
`common_issues += ValidateNpcHabits.check(...)` right after the `check_access_model` call, with
`report_lines` printed as its own block after the issue list.

**The office life lock check sees filled habits.** `ValidateNpcNeeds.check_lock_habits` warns that
an object's `autoLockSeconds` "never applies" when its owner's authored habit always locks
(`scripts/validate_npc_needs.rb:562-567`). On a scenario where a `locksScreen` habit fills a
`screenHabit` that leaves the screen open, that warning would be false. So `ValidateNpcNeeds.check`
gains one optional keyword, `screen_habits:` (default `{}`, an NPC id to `screenHabit` map), and the
one line at `:563` reads `screen_habits[owner_id]` before the authored field. `main` passes the
filled habits from the expanded copy. Called without the keyword, as its own tests do, it behaves
exactly as today. Its other `screenHabit` warnings stay on authored habits only, which is right:
a filled habit is checked by `ValidateNpcHabits`. **`check_access_model` is not changed**: it keeps its
signature, reads the authored data throughout, and raises exactly what it raises today, so
`validator-access-model.test.mjs` passes unchanged. In particular the first slice's roll warning
fires only for an authored `lockChance` above 0 and below 1. A PC whose roll comes from a habit has
no authored `lockChance`, so that warning stays silent there, and `ValidateNpcHabits.check` raises the one
line about it, naming the habit (below). Nothing is reported twice.

`validator-npc-habits.test.mjs` loads the module the way the access model test loads
`check_access_model`: a `ruby -e` that requires `validate_scenario.rb` (which pulls in
`validate_npc_habits.rb` and the library through its `require_relative` lines), calls
`BreakEscape::NpcHabits.expanded_copy` on the fixture from standard input, then
`ValidateNpcHabits.check` and `report_lines`, and prints both as JSON.

**Ids.** The copy is stamped by the server's rule before it is expanded (5.1), so a workstation
with no authored id is owned and filled in the report exactly as the server will. A stamped id
moves when objects are added or reordered, so the validator also warns about any workstation with
no authored `id` that something owns: a `screenOwner` on it, or an NPC whose `needsHome` names its
stamped id. The message says to give the object the id the owner relies on.

Errors:

- `awareness` or `habits` on an NPC record that is not a room NPC;
- an `awareness` (on an NPC or under `roles`) that is not one of the three levels; an unknown
  habit; a habit value outside its list;
- `passwordPattern` naming no object in the scenario.

Warnings:

- `locksScreen` by name on an NPC who owns no workstation, or whose every workstation sets its own
  lock field, or who has an authored `screenHabit` (the habit does nothing; the last names the
  two fields and says the authored `screenHabit` wins);
- `locksScreen: "sometimes"` by name on the owner of a sign-in PC where the habit was applied (the
  session rests on a roll). One line, naming the habit and the PC;
- a mapping that waits for a screen state the PC cannot give, or gives only on some leaves (the
  rule is under "Screen state mappings" below);
- a workstation with no authored `id` that something owns (above);
- `writesDown: true` on an NPC with no account, or who owns no sign-in PC, or whose every owned
  sign-in PC authors its own `postitNote` or sets `showPostit: false`;
- `password` on an NPC with no account; `passwordPattern` without `password: "guessable"`;
- `password: "guessable"` that is not backed (below);
- `password: "reused"` when no other secret in the scenario equals the password;
- `password: "strong"` when the password is reused, or every word part and number part of it has a
  source (test 1 below, without the pattern clue);
- an account whose password is `guessable` and which can sign in only at PCs under a policy with
  `maxAttempts`;
- step 5: `holdsDoors: false` by name on an NPC that no gate opens for, or whose every gate has
  `playerMayPassIf` or an authored `noHold`; an authored `gate.noHold` naming an id that is not in
  that gate's `openFor`.

Suggestions (the validator's lowest level):

- `sometimes` from the `medium` preset on the owner of a sign-in PC where the habit was applied.
  One line, naming the preset, in place of the warning above: one word of `awareness` should not
  put a warning on every desk;
- a workstation whose owner has a `locksScreen` habit and whose sprite has no locked art (no
  `"sprite": "pc_desktop"`): the lock will sound but not show.

Not a warning, but a line in the report: a `writesDown` account that opens nothing but its own PC
and profile ("opens only its own PC"), so the author sees a chain that stops.

**Screen state mappings.** The check runs over every workstation (`AccessIdentities.workstation?`)
in the expanded copy, so habit fills count.

- *The mappings read.* The `eventMappings` of every NPC record (`scenario_npc_records`, room and
  phone NPCs alike) whose `eventPattern` is exactly `<event>:<pcId>`. A bare event name with
  `data.objectId` in the condition, or a wildcard pattern, is not followed. The lab's capture is
  the followed shape (`scenarios/lab_physical_pentest/scenario.json.erb:1070-1071`).
- *A mapping that needs a locked screen:* `workstation_locked_attempt:<id>`; or
  `workstation_owner_returned:<id>` whose condition tests `data.wasLocked === true` (or `== true`)
  or a bare `data.wasLocked` (not preceded by `!` and not followed by a comparison).
- *A mapping that needs an open screen:* `workstation_accessed:<id>`; or
  `workstation_owner_returned:<id>` whose condition tests `data.wasLocked === false` (or
  `== false`, `!== true`) or `!data.wasLocked`.
- *A mapping on `workstation_screen_changed:<id>`* needs a locked screen, whatever it tests:
  only a lock, or the unlock that follows one, changes the state. One whose condition tests
  `data.how === 'auto'` needs a late lock as well, and draws "never fires" on a PC with none.
- A `workstation_owner_returned` mapping whose condition does not test `wasLocked`, or tests it in
  any other way, needs neither and is not checked.
- *The effective lock on a leave,* read in `decideLocked`'s order (section 2) on the expanded
  copy, so a filled `screenHabit` counts:
  1. the PC's policy (`policy`, else `defaultPolicy`) with `autoLockMin: 0` makes it **1**;
  2. else the PC's numeric `lockChance`, clamped to 0..1;
  3. else the PC's `locksScreenOnLeave`: 0 when `false`, 1 otherwise;
  4. else the owner's `screenHabit`: with a numeric `lockIfAwayOverSeconds`, 0 when its
     `lockChance` is 0 and **between 0 and 1** otherwise (a short trip stays open, a long one
     locks or rolls); without one, its numeric `lockChance` clamped to 0..1, or 1 when it has none;
  5. else 1.

  A **late lock** is a policy with `autoLockMin` above 0 or an `autoLockSeconds` above 0 on the
  PC: the screen can lock during an absence the leave left open.

| Mapping needs | Effective lock 0 | Above 0, below 1 | 1 |
|---|---|---|---|
| A locked screen | Warning ("never fires"), unless a late lock | Warning ("fires on some leaves only"), unless a late lock | Nothing |
| An open screen | Nothing | Warning ("fires on some leaves only") | Warning ("never fires") |

With a late lock the author has chosen the timing, so a mapping that needs a lock is not second
guessed. The warning is raised whether the lock came from a habit, a preset or an authored field,
because the mapping itself is always authored; it names where the effective lock came from. A
`workstation_auto_locked:<id>` mapping is not checked. Examples: `test_access_sessions`'
`priya_pc` (`lockChance` 0 under `instant_lock`, a mapping on
`workstation_locked_attempt:priya_pc`, `scenario.json.erb:233`, `:541-551`) has an effective lock
of 1 and draws nothing; the lab's keylogger capture on Chris's PC needs a locked screen and draws
nothing while her PC resolves to 1.

**Backing a `guessable` password.** Three tests, all needed. Together they mean every character of
the password is accounted for: none is left for the player to guess.

1. *Every piece is accounted for.* The password is split into **pieces**:
   - first into runs of letters, runs of digits, and single characters that are neither (each one
     a **symbol**);
   - then each run of letters is split again where a lower-case letter is followed by an upper-case
     one, and before the last capital of a run of capitals that is followed by a lower-case letter
     (so `BiscuitRover` is `Biscuit` and `Rover`, and `ITSupport` is `IT` and `Support`).

   Each piece is then one of four kinds, and each kind has its own rule:

   | Piece | Accounted for when |
   |---|---|
   | A **word part**: three or more letters | It appears as a whole word, letters compared without case, in text the player can read (tests 2 and 3 say which text). "offspring" does not source "Spring" |
   | A **number part**: two or more digits | It appears as a whole run of digits, or (for two digits) as the last two digits of a four-digit year. "126" does not source "26"; "2026" does |
   | A **fixed piece**: one or two letters, or one digit | It appears, with its case, as a whole word or a whole run of digits in the pattern clue's own text ("start with IT", "end in 7"). Text elsewhere does not count: a two-letter word or a single digit somewhere in the scenario would source it by chance |
   | A **symbol** | The character appears in the pattern clue's own text |

   The password must have at least one word part or number part with a source outside the pattern
   clue; a password made only of what the clue states is not a `guessable` password but a written
   one. So `Rex2019!` needs a source for `Rex` (a photo caption "Rex"), one for `2019`, and the `!`
   in the clue; `Jo1987!` needs `Jo` written, as `Jo`, in the clue; `Biscuit7!` needs the `7` in
   the clue.
2. *The source can be read without the account.* Text counts only outside the password's own home,
   outside the account's own profiles, and outside the contents of a sign-in PC that only that
   account can open. A source in a room or container that is itself locked still counts, but the
   report marks it ("piece 1 of 3: rooms/mei_room/objects/drawer (behind lock mei_drawer)"),
   because the way in may need the very account the password opens. The author checks the dungeon
   graph for a loop through the account's node (7.3 draws the "clue" edges that show it).
3. *A pattern clue is named.* `passwordPattern` names an object that is readable, passes test 2,
   and does not hold the whole password. It must hold every fixed piece and every symbol (test 1).
   The validator cannot read a sentence about capitals and order, so the report counts what the
   pattern clue has to cover ("1 capital, 1 symbol, 3 pieces in order"; fixed pieces and symbols
   are counted as pieces) and `README_scenario_design.md` tells authors to state them there.

The report names each piece by position, kind and where it was found ("piece 1 of 3, word:
rooms/mei_room/objects/photo"; "piece 2 of 3, number: rooms/mei_room/objects/calendar"; "piece 3
of 3, symbol: in the pattern clue"; "piece 1 of 3, word: no source"), never the text. A symbol
that is common punctuation (`.`, `,`, `-`, `'`, `:`, `;`, `/`) is marked "common punctuation:
check the clue states it", because a date or the end of a sentence holds it anyway. The whole
password written out in an authored note sources every word and number part, and is also
reported as "written in full at <path>", so the author sees every place a password is spelled
out. (The first slice's error for a whole password in compiled ink stands.)

Readable text is one function, `NpcHabits::Clues.readable_texts(scenario, scenario_dir)`, which
returns each text with its path, its scope (none, a profile, or a sign-in PC) and the ids of the
locks in front of it (its room's, if the room is `locked`, and each enclosing container's that is
`locked`): an object's `name`, `text`, `observations`, `postitNote` and their variants,
`social.intelFacts` values and labels, `social.osint.sites[].profiles[].posts`, seeded mail, and
the strings of the scenario's compiled ink. Slice 9.2 adds an NPC's `feed.posts[].text` and feed
fact texts to it.

**Backing a `reused` password.** The password equals another secret in the scenario, found by
`NpcHabits::Clues.secret_homes(scenario)`: the `requires` of a `lockType: "password"` door or
object, a `social.landingPages[].capture.secret`, a capture secret on an NPC with no account, or
another account's `creds.password`. The first three are reported as "same password as <path>". The
last is a different lesson (a shared or default password, and the player still needs the second
username), so it is reported and drawn as "shared with <npc id>". A Wi-Fi key
(`networks.<id>.wifi.psk`, slice 9.3b) joins the list when both exist: step 3 adds it if the schema
has `networks.<id>.wifi` when step 3 is built, and 9.3b adds it otherwise.

**The habits report.** When any NPC has a level or `habits`, the validator prints one block from
the expansion report: each such NPC with its level and where it came from (its own field or a named
role), its habits marked preset or by name, and under each habit what it did ("screenHabit lockChance 1,
read at `staff_pc`", "`priya_pc`: the PC sets lockChance, habit not applied there", "habit not
applied: the NPC sets screenHabit", "sticky note at `omar_pc`", the pieces of a `guessable` password with their sources and what the pattern clue must
cover, "no effect: owns no workstation"). Under a `password` line the report gives "pattern clue at
<path>" when a `passwordPattern` is set; the parameter is not listed as a habit of its own. No line
holds a password or any text from one. This block
is the only place that says why a field has the value it has. It names who never locks and whose
password is on a note, so it is for authors and regression testers, never for a tester playing
blind.

### 7.3 Dungeon graph (`scripts/generate_dungeon_graph.rb`)

Today nothing shows how the player comes by an account's password, or that an open screen needs
none. This slice adds labelled edges, so chains show. The graph builds its copy with
`NpcHabits.expanded_copy` (5.1), as the validator does, and reads habits and fills from it; every
other node and edge keeps reading the authored data.

- `writesDown`: an edge from the room of the owner's sign-in PC to the account's node, labelled
  "sticky note at <pc>". It starts at the room, not the PC, because the account's node already has
  an edge to that PC and an edge back would draw a loop the graph is meant to expose, not make;
- `locksScreen` `never` or `sometimes`: an edge from the PC's room straight to the owner's PC,
  labelled "unlocked screen", with "(roll)" for `sometimes`. It is drawn only for a sign-in PC
  where the server would allow a claim: the owner is tracked, has an account and is admitted by
  the PC, `AccessIdentities.screen_always_locks?(pc, owner)` is false on the expanded copy (5.2),
  and no policy sets `autoLockMin: 0`;
- `password: reused`: an edge from each lock or capture that holds the password to the account's
  node, labelled "same password", or "shared with <npc id>" from another account's node;
- `password: guessable`, when backed: an edge from each object that sources a word or number
  part, and from the pattern clue, to the account's node, labelled "clue". A clue behind a lock
  that needs this account then shows as a loop through the account's node, which is what the
  report's "behind lock" mark (7.2) asks the author to look for.

Step 5: a gate with `noHold` gets no new node; its label lists who holds it and who does not.

## 8. Saved games

- **A game keeps the habits it started with.** The expansion is written into `scenario_data` when
  the game is created and is never run again for that game. Editing a scenario's habits changes new
  games only.
- **Games created before this slice** hold no `awareness` (no scenario has one), so nothing in them
  changes. `npc_habit` returns nil for them and `login_postit_for` returns nil.
- **`lab_physical_pentest` games created before the lab step** keep their saved hand-set fields
  and play as they did. The lab is not shipped.
- **No new `player_state` key.** A sticky note is not recorded as seen; the screen asks each time.
  A note the player saved is in `player_state['notes']`, as any saved note is, and a reset clears
  it.
- **A reload** changes nothing about habits. The workstation state resets with every owner at the
  desk, as today, so a kept password session at an owned PC cannot be opened until the owner next
  leaves, and the seeded lock sequence starts again from the first leave: a `sometimes` screen
  plays the same after a reload as from a fresh start.
- **Once-only mappings** are unaffected: no event name changes. `pc_signin_shown` gains a field.

## 9. Determinism

`sometimes` is the only chance in this slice, and it is office life's seeded habit roll
(`roll(ownerId, "habit:<pcId>:<leaveCount>")`, `decideLocked`, a pure function of the seed, the
NPC and the salt). Three reports cover a session that rests on it, and none repeats another (7.2):

- an owned sign-in PC with an **authored** `lockChance` above 0 and below 1: the first slice's
  warning in `check_access_model`, unchanged, which reads only authored data;
- an owned sign-in PC whose chance comes from a **`sometimes` habit**: one line from
  `ValidateNpcHabits.check`, naming the habit; a warning when the author wrote `sometimes` by name,
  a suggestion when it came from the `medium` preset, so `medium` can be used without a warning on
  every desk;
- a mapping that needs a locked or an open screen on a PC whose effective lock is between 0 and 1:
  a warning, whatever set the chance, because the mapping is authored.

Either way the author gives the player another route (a note, clues, a captured sign-in) or sets
`locksScreen` by name to `never` or `always`.

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
   access model's regression suite.
4. **The existing suite runs again** wherever a step changes code they cover: the
   `test_access_signin` run after step 2 (the sign-in screen), and `test_gate_tailgate` after
   step 5 (gates).
5. **`lab_physical_pentest` last** (section 12).

Never touch the server on :3000. A "stuck" from the scripted tester counts as a bug only once a
persona-tier run of the same beat confirms it.

### Step 0. Confirm the locked look

The habits are read off the padlock and the lock cue, so before anything is built on them: on the
keyless server on :3001, at the commit the build starts from, open `test_access_sessions`, wait for
an owner whose PC always locks to leave, and record in the build log
`window.__test.access.workstation(pcId)` (`lockedLook`, `texture`), the last entries of
`window.__test.access.screenTransitions()` (the picture change; its `sound` is null wherever the
lock cues are installed), the last entries of `window.npcOfficeVisuals.cueLog` (a `how: "leave"`,
`locked: true` entry with a flash or a glyph, and a `chime` whose `volume` is above 0 when the
player stood in the room), and a screenshot. If the padlock does not show because that fixture's
PCs lack `"sprite": "pc_desktop"`, that is a set-up fact to record, and the check is repeated in
`lab_physical_pentest` on Chris's PC. A real fault in the picture stops the build and goes to the
owner of `screen-states.js`; a missing cue goes to office life's owner of `npc-office-visuals.js`
(the engine plan's item 1 records both).

### Step 1. Foundation: schema, library, loader, withholding

One builder. Everything else waits for it. **Nothing about `holdsDoors` or gates is built here.**

Files:
- `lib/break_escape/npc_habits.rb` (new): 5.1 with the `locksScreen` fill (5.2).
- `lib/break_escape/access_identities.rb`: `screen_always_locks?(pc, owner)` (5.2).
- `app/models/break_escape/game.rb`: **the claim check fix first**, `pc_always_locks?(pc, owner)`
  through `AccessIdentities.screen_always_locks?`, and the one call in `claim_login_session!` that
  passes the owner (5.2); then the new order in `prepare_scenario_data!`; `npc_habit`;
  `written_down?`; the `roles` deletion in `filtered_scenario_for_bootstrap`.
- `scripts/scenario-schema.json`: the step 1 edits in 7.1.
- `scripts/validate_scenario.rb`: `awareness` and `habits` in `known_npc_fields` and `roles` in the
  known top-level keys only (the checks are step 3).

Tests:
- `test/unit/npc_habits_test.rb` (new): each preset gives the table in 4.2 for the habits built;
  a habit by name replaces the preset's and leaves the rest; `habits` with no level gives only
  those keys; `writesDown` and `password` are never set by a level. Levels: the NPC's own field
  beats a role's; the first authored role with a level wins; the implicit `staff` role is tried
  last, so `roles.staff.awareness` reaches an NPC with `creds` and no other level, reaches one with
  a card and no `creds`, and reaches neither one with `"staff": false` nor one with no `creds` and
  no card (no level, no habits). An unknown level, habit or value is dropped; `holdsDoors` is an
  unknown habit at this step; `sources` marks each habit by name or preset. `passwordPattern`: a
  non-empty string is kept by `expanded` as written and has no `sources` entry; a number or an
  empty string is dropped; no level ever sets it. The `locksScreen` fill: `screenHabit` is
  `{ "lockChance": 0 }`, `0.5` and `1` for an owner of a `workstation: true` object and of a
  `lockType: "login"` object, and no object gains any field; ownership through `screenOwner` and
  through `needsHome`, including a `needsHome` that names a stamped id; an NPC who owns two PCs gets
  one `screenHabit` and both PCs are listed; an owned PC with an authored `lockChance` or
  `locksScreenOnLeave` keeps it and is reported "not applied there"; an NPC every one of whose PCs
  sets a lock field, and one who owns no workstation, gets no `screenHabit`; **an NPC with an
  authored `screenHabit` (one with only `lockIfAwayOverSeconds`, and one that is not an object)
  keeps it exactly and is reported "habit not applied"**; **a `workstation: true` object with no
  id, beside an NPC with no `needsHome`, gives that NPC no `screenHabit` and no owner in the
  report**. A second `expand!` changes nothing (compare the whole
  hash). Malformed input, one case each: `habits` a string, `awareness` a number, `roles` a list,
  `npcs` holding a non-object: no exception and no change. `expanded_copy`: the authored hash is
  unchanged afterwards (compare it with a copy taken before); an id-less object is stamped
  `<room>_<type>_<index>` and an id-less item in its `contents` `<parent id>_content_<index>`; an
  id-less workstation owned through a `screenOwner`, and one owned through a `needsHome` naming its
  stamped id, both give their owners a `screenHabit` in the copy and are listed in the report.
- `test/unit/access_identities_screen_test.rb` (new):
  `screen_always_locks?` for a PC `lockChance` of 1, 0.5 and 0; a PC `locksScreenOnLeave` false and
  true; no PC field and no owner; an owner with no `screenHabit`, with `{ lockChance: 1 }`,
  `{ lockChance: 0.5 }`, `{ lockChance: 0 }`, `{ lockIfAwayOverSeconds: 20 }` and a habit that is
  not an object; a PC field beside a habit that leaves it open (the PC wins). The answers equal
  `!ValidateNpcNeeds.habit_leaves_open?` wherever the PC has no field.
- One test in the same file runs a plain `ruby` subprocess that requires only
  `access_identities.rb` and `npc_habits.rb` and calls `expand!` and `expanded_copy` on a fixture,
  so a Rails-only method in the library fails here and not later in the validator.
- `test/models/break_escape/npc_habits_loader_test.rb` (new): it reaches
  `BreakEscape::NpcHabits` by name with no `require` of the file, which is the proof that the
  autoloader finds it (`bin/rails zeitwerk:check` is run too, but on this Rails version it does not
  check `lib/`). A game from `create_access_game` holds the expanded habits and the filled
  `screenHabit`; the owner of a PC with `screenOwner` and no authored id is filled; a second
  `prepare_scenario_data!` changes nothing; a game made with `Game.create!` and hand-set
  `scenario_data` is untouched; a game is created without error from each malformed fixture above;
  a claim at the PC of a `never` owner is granted and at the PC of an `always` owner refused
  (`claim_login_session!`), with no lock field authored on either PC. **The claim check fix,
  without any habit:** an owner with an authored `screenHabit` of `{ lockChance: 0 }` at a sign-in
  PC with no lock field can claim it (today it is refused); one with `{ lockIfAwayOverSeconds: 20 }`
  can claim it; one with `{ lockChance: 1 }`, and one with no `screenHabit`, cannot; a PC that sets
  `locksScreenOnLeave: true` beside an owner habit of `{ lockChance: 0 }` cannot; the policy
  `autoLockMin: 0` still refuses. The existing claim tests pass unchanged. **The scripts' copy agrees
  with the server:** for one fixture with id-less objects (some owned, some with contents), every
  object id and every filled `screenHabit` in `NpcHabits.expanded_copy(raw)` equals the same field
  in the scenario data of a game created from `raw`, so a change to the server's stamping rule
  fails here.
- `test/models/break_escape/access_model_withholding_test.rb` (extended): for a fixture whose NPCs
  have `awareness` and `habits` and which has a top-level `roles`, neither NPC key is in
  `filtered_room_data`, in a door unlock's room data or in `update_room`'s added NPCs; the
  bootstrap has no `roles` key; the room data's NPC carries the filled `screenHabit`, and no PC
  gains a lock field.
- A one-off check, recorded in the build log and not kept as a test (AGENTS.md: no test compares
  live content): render every scenario under `scenarios/`, run `NpcHabits.expand!` on each and
  confirm the output equals the input for all of them, because none has `awareness`, `habits` or
  `roles`.

### Step 2. The sticky note

Files:
- `app/models/break_escape/game.rb`: `login_postit_for(pc)` (public); `hasPostit` in
  `attach_login_accounts!`. Slice 9.3a edits the same short method first (it skips hosts with no
  screen); re-read it before editing.
- `app/controllers/break_escape/games_controller.rb`: `login_accounts` adds `postitNote` and the
  `no-store` header.
- `public/break_escape/js/systems/unlock-system.js`: `openLoginSignIn` (5.3), the desk branch only.
  Slice 9.3a adds a remote sign-in branch to the same function first; that branch is not given the
  note.
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
    Omar's password nowhere. Then the note is saved through the notes sync: the sync's own answer
    does not hold it, the next `/scenario` holds it in `savedNotes`, and room data, `container`
    and the other PCs' answers still do not.
  - A game whose scenario data has no expanded habits (made with `Game.create!`) serves no note.
- `test/js/access-signin-postit.test.mjs` (new, running the real modules as
  `access-signin-requests.test.mjs` does): the screen is started with the answer's note and
  `showPostit` true; the note is not written onto the object's data, and a second open with an
  answer that has none shows none; with no answer note the authored one shows; a failed request
  opens with the authored note or none; `pc_signin_shown` carries `hasPostit` true and false; if
  9.3a's remote branch is present, it makes no `/login_accounts` request and shows no note.
- `test/js/postit-marks.test.mjs` (new, on a stub scene): a sign-in PC with `hasPostit` gets one
  picture, at the top-left offset and the stated depth, and a second `syncRoom` adds no second one;
  a sign-in PC with an authored, shown `postitNote` gets one; a sign-in PC with neither, or with
  `showPostit: false`, gets none; **an object with a password lock and an authored `postitNote`
  gets none**; `mark(pcId, true)` adds one to a loaded PC and `mark(pcId, false)` removes it.
- `pc-sessions.test.mjs`, `password-signin-mode.test.mjs` and `access-signin-routing.test.mjs`
  pass unchanged.
- The `test_access_signin` scripted runs again (its sign-in screens have authored notes and none,
  so they prove the fallbacks in a browser), with a look at a screenshot of the note picture
  beside the indicator dot.

### Step 3. Validator

Files: `scripts/validate_npc_habits.rb` (new: the `ValidateNpcHabits` module of 7.2, `check` and
`report_lines`); `scripts/validate_scenario.rb` (the `require_relative` lines and the three lines in
`main`, 7.2 "Wiring"; `check_access_model` itself is not edited); `scripts/validate_npc_needs.rb`
(the `screen_habits:` keyword on `check` and the one line in `check_lock_habits`, 7.2);
`lib/break_escape/npc_habits/clues.rb` (new): `pieces`, `readable_texts`, `secret_homes`,
`backing`.

Tests:
- `test/unit/npc_habits_clues_test.rb` (new). `pieces`: `Biscuit2019!` is a word, a number and a
  symbol; `BiscuitRover2019!` splits the letters into `Biscuit` and `Rover`; `ITSupport` into `IT`
  and `Support`; `Rex` is a word part; `Jo`, `Ab` and `cd` are fixed pieces; the `7` of `Biscuit7!`
  is a fixed piece. Sources: a word part is found as a whole word without case, and not inside a
  longer word; a number part is found as a whole run and (two digits) as the last two digits of a
  four-digit year, and not inside a three-digit run; a fixed piece is found only in the pattern
  clue's text, with its case, as a whole word or run, and not when the same letters appear
  elsewhere in the scenario or in the clue in another case; a symbol is found only in the pattern
  clue. A piece is found in an object's text, in a variant, in an intel fact, in an osint post and
  in compiled ink; the password's own home, the account's own profile and the contents of a PC
  only that account opens are not sources; a source in a locked room and one in a locked container
  carry that lock's id. Each kind of secret home is found, and another account's password is marked
  as shared. A Rails test reaches `BreakEscape::NpcHabits::Clues` by name with no `require`.
- `test/js/validator-npc-habits.test.mjs` (new): one fixture for each error, warning and
  suggestion in 7.2, and a clean fixture that raises none. For `guessable`, each with a pattern
  clue unless it says otherwise:
  - one word part of three sourced (not backed, the others named by position and kind);
  - **`Rex2019!` with nothing that holds the word `Rex`** (not backed: "piece 1 of 3, word: no
    source");
  - **`Rex2019!` with a readable photo whose caption is "Rex"** and a calendar showing 2019 (backed);
  - **`BiscuitRover2019!` with `Biscuit` and `Rover` each a whole word in a readable text**
    (backed; the report counts "2 capitals, 1 symbol, 4 pieces in order");
  - `Jo1987!` with `1987` sourced and `Jo` only in an NPC's name elsewhere (not backed), and the
    same with the clue saying "starts with Jo" (backed);
  - every word and number part sourced and no `passwordPattern` (not backed); a pattern clue that
    lacks the password's symbol (not backed); a pattern clue with it (backed, and the report counts
    the capitals, symbols and pieces); a password ending in `.` with a clue that holds `.` only at
    the end of a sentence (backed, and marked "common punctuation");
  - a common word only, with the digits unsourced (not backed); a word part sourced only from the
    account's own profile (not backed); a source behind a locked container (backed, and marked
    "behind lock <id>"); a password made only of fixed pieces and symbols (not backed).

  For `strong`: one word part sourced draws nothing, every word and number part sourced draws the
  warning. For the screen, with no authored lock field unless it says so:
  - `sometimes` by name on a sign-in PC draws exactly one warning, naming the habit, and nothing
    from the first slice's roll warning;
  - a preset `sometimes` (`medium`) on a sign-in PC draws one suggestion and no warning;
  - an authored `lockChance` 0.5 on a sign-in PC draws the first slice's warning only, as today;
  - a workstation under a policy with `autoLockMin: 0`, its owner `never` (filled `screenHabit`
    `lockChance` 0), with a `workstation_locked_attempt` mapping, draws nothing;
  - the same under a policy with `autoLockMin: 5` draws nothing;
  - a plain workstation with a `data.wasLocked === true` mapping draws the warning at `sometimes`
    and at `never` with no policy, and nothing at `always`; the same with a bare `data.wasLocked`
    behaves the same;
  - a `data.wasLocked === false` mapping, and a `workstation_accessed` mapping, draw the warning at
    `always` and at `sometimes`, and nothing at `never`; under an `autoLockMin: 0` policy they draw
    the warning at `never` too;
  - a `workstation_owner_returned` mapping with no `wasLocked` in its condition, a bare
    `workstation_owner_returned` with `data.objectId` in its condition, and a workstation with no
    such mapping draw nothing;
  - with no habit at all: an owner's authored `screenHabit` of `{ lockIfAwayOverSeconds: 20 }`
    makes a `wasLocked === true` mapping draw "fires on some leaves only", and `{ lockChance: 0 }`
    draws "never fires"; an `autoLockSeconds: 30` on the PC silences both (a late lock);
  - a `workstation_screen_changed:<pcId>` mapping draws "never fires" at `never` with no late lock
    and nothing at `always`; one testing `data.how === 'auto'` draws "never fires" on a PC with no
    late lock and nothing on one with `autoLockSeconds`;
  - `locksScreen: "never"` by name on an NPC with an authored `screenHabit` draws the warning that
    the authored field wins, and the report says "habit not applied";
  - **the office life check sees the fill:** a PC with `autoLockSeconds: 30` and no lock field,
    whose owner is `low` (filled `{ lockChance: 0 }`), draws no "autoLockSeconds never applies"
    warning from the full validator run; the same owner with no level draws it, as today.
    `ValidateNpcNeeds.check` called without the keyword gives exactly today's output on that
    fixture, and the slice 16 test in `test/js/npc-office-visuals.test.mjs` passes unchanged.

  A workstation with a `screenOwner` and no authored id, and one with no id owned through a
  `needsHome` naming its stamped id, each draw the id warning and are listed with their fill in the
  report. The habits report lists each NPC's habits with preset or by name and its effect lines,
  shows "pattern clue at <path>" under `password` and no `passwordPattern` habit line, and a level
  that came from a role names the role. No output line of any fixture holds a password or a word
  or number part of one (the test greps for them).
- `validator-access-model.test.mjs` passes unchanged.
- A one-off run, recorded in the build log: the validator over every scenario with a workstation,
  listing what the new screen state warnings raise (section 13).

### Step 4. Dungeon graph

Files: `scripts/generate_dungeon_graph.rb` (and its `require_relative` lines).

Tests: `test/js/dungeon-graph-habits.test.mjs` (new, beside `dungeon-graph-identities.test.mjs`):
a `writesDown` owner's account node has a "sticky note" edge from the PC's room and none from the
PC itself; a `never` owner's PC has an "unlocked screen" edge from its room, a `sometimes` one says
"(roll)", and an `always` one, a PC under an `autoLockMin: 0` policy, a `never` owner's PC that
sets `locksScreenOnLeave: true` itself, and an untracked owner's PC have none; a lock with the same password draws a "same password" edge and another account a
"shared with" edge; a backed `guessable` draws a "clue" edge from each source and from the pattern
clue, and an unbacked one draws none. `dungeon-graph-identities.test.mjs` passes unchanged.

### Step 5. `holdsDoors`, whole

Starts when steps 1 to 4, 6 and 7 are committed (step 5 adds lines to stream E's `verify-run.rb`
block and beat H9 to stream S's scenario, so both come first) **and** the engine plan's door work
(its item 3: the body rule and `blocksPlayer` on top of the owner's turn-back rule) is committed
and meets the contract in 5.4. **Contract item 2 is unmet on `main` today**, so this step waits
for that work whatever else is ready. The builder reads the door work's code and tests first and
confirms contract items 1, 2, 5 and 6 on them. If that work is not built, or does not meet the
contract, this step is not built, beat H9 is left out of the feature scenario, and the other three
habits stand as they are.

Files:
- `lib/break_escape/npc_habits.rb`: `holdsDoors` in `HABITS` and `PRESETS`; the gate fill in
  `expand!`.
- `scripts/scenario-schema.json`: `habits.holdsDoors`, `gate.noHold`.
- `scripts/validate_npc_habits.rb`: the two gate warnings; `scripts/generate_dungeon_graph.rb`:
  the gate label.
- `public/break_escape/js/systems/door-gates.js`: the seven places in 5.4 ("Who owns what").
- `tools/playtest/verify-run.rb`: one line per gate with a `noHold` in the `habits` block (gate,
  `openFor`, `noHold`), values only; and its case in `test/js/playtest-verify-run-access.test.mjs`.
- One paragraph in the "Gate doors" section of `README_scenario_design.md`, after the door work's
  rewrite of it.

Tests:
- `test/unit/npc_habits_test.rb` (extended): the preset row; `noHold` lists the `openFor` NPCs
  with `holdsDoors: false`; a string `openFor` is read as one id; a gate with `playerMayPassIf` or
  an authored `noHold` is left alone; a gate whose guards all hold gets no `noHold`; `doors` an
  object and `gate` a string are skipped with no exception; a second `expand!` changes nothing.
- `test/js/validator-npc-habits.test.mjs` and `dungeon-graph-habits.test.mjs` (extended): the two
  gate warnings; the gate label.
- `test/js/door-gates-no-hold.test.mjs` (new; the engine plan's door work owns the other
  `door-gates*.test.mjs` files, today `door-gates.test.mjs` and `door-gates-player-open.test.mjs`,
  and this one is added to that set by this step). On that work's stub world, calling its pure
  functions:
  - `normaliseGate` keeps `noHold`; `open` sets `lastGuards` to the guards near on that tick, ticks
    while open add to it, `close` clears it, and **a holding guard who stood near while the gate
    was held shut is not in it at the next opening**;
  - **the keep-shut and the turn-back:** a shut `noHold` gate with only its careful guard near and
    the player within the radius does not open; after `GUARD_TURN_BACK_MS` her behaviour's
    `turnBackFromGate` is called and `door_gate_guard_turned_back` names her; she is not in
    `lastGuards`; with the player outside the radius the gate opens for her;
  - with a `noHold` guard as the only one in `lastGuards`, `openToPlayer` is false and
    `blocksPlayer` is true for a player outside the secured room and false for one inside it;
  - **after that guard has left the radius, at every tick until `close` the gate is either shut or
    `blocksPlayer` is true for the outside player: it is never open and passable**;
  - **the skipped hold:** with the outside player within the radius and nobody in the doorway, the
    gate is shut on that tick, and with the player outside the radius it stays open for `holdMs`;
  - with `lastGuards` empty (an exit opening) the gate answers as the door work leaves it; after
    the gate has closed and opened for a guard who holds, `openToPlayer` is true; with a holding
    guard and a careful one both near or both in `lastGuards`, the gate opens beside the player and
    `openToPlayer` is true; a gate with no `noHold` answers as the door work leaves it; a gate with
    `playerMayPassIf` ignores `noHold`; a clone hold answers true on a `noHold` gate.

  The door work's own gate tests, including its turn-back tests, pass unchanged.

Browser check: a short scripted run of `test_gate_tailgate` as the door work leaves it, to show its
gates are unchanged by this step (they have `playerMayPassIf`), then beat H9.

### Step 6. Playtest tooling

Slice 9.3a's tooling stream edits the scanner library and `verify-run.rb` before this step, and
the engine plan's capture stream (E4) adds its own block to `access-leak-check.rb` (it does not
edit the library or `verify-run.rb`). Re-read each file and add this slice's checks as their own
block.

Files:
- `tools/playtest/lib/access_leak_scanner.rb` and `tools/playtest/access-leak-check.rb`: the two
  exceptions and the withheld-key finding exactly as section 6 states them. The scanner takes the
  game (for `written_down?` and `login_pc_owner`) as well as the scenario data, and keeps the
  response lines it has seen across every file it is given, in order.
- `tools/playtest/verify-run.rb`: the `--access` section gains a `habits` block of **values
  only**, read from the saved scenario and the game: one line per NPC that has a `habits` object
  (id, its values and its `screenHabit` as saved), one per owned workstation (id, owner,
  `lockChance` or `locksScreenOnLeave` as saved, whether the server's claim check calls it "always
  locks", and `hasPostit` from `login_postit_for`). Step 5 later adds its gate lines to this
  block; this step writes nothing about gates. It does not say which values a habit filled; the
  validator's report does (5.1). No passwords.
- `.claude/skills/playtest-scenario/SKILL.md`: one sentence in "Access model checks" on the two
  note exceptions, and that the `habits` block and the validator's habits report are not shown to
  a tester playing blind. (Skills are edited only with the orchestrator's say-so; the builder
  hands the sentences over if not.)

Tests: `test/unit/access_leak_scanner_test.rb` (extended, on fixture response files so it does not
wait for step 2): a password at `$.postitNote` of a `/login_accounts` answer whose `pc_id` is a
`writesDown` owner's PC is allowed; the same password elsewhere in that body, in the answer for
another PC, and in room data is reported; **two NPCs share a password and the allowed answer for
one raises no finding for the other**; the password in `savedNotes` after a `/login_accounts` line
that carried it is allowed, also when that line is in an earlier file of two, and in `savedNotes`
with no such earlier line is reported; an NPC record (a hash with `npcType`, or under an `npcs`
array) with a `habits` or `role` key is reported by key and NPC id, and **a `social.characters`
entry with `role` and a `social.awareness` block are not**; no output line holds a value.
`test/js/playtest-verify-run-access.test.mjs` (extended): the `habits` block prints for a game with
expanded habits and is absent for one without. The scanner is run once more against real captured
responses when step 2 is in.

### Step 7. The feature scenario and its scripted runs

Section 11. Needs steps 1 to 3 and 6. Beat H9 is added when step 5 is in.

### Step 8. `lab_physical_pentest`

Section 12. Needs step 7's runs passing, the lab's feedback pass finished and slice 9.3's lab step
finished.

### Step 9. Documents

- `README_scenario_design.md`: a section "NPC awareness and habits" after "Workstation screens":
  the fields, the tables, "explicit wins", what the player sees (4.3), the pairing advice in 4.2,
  how a `guessable` password is backed and what a pattern clue must say (the order of the
  pieces, which letters are capitals, every short piece written exactly as it appears in the
  password, and every symbol written as the character itself in a sentence that says where it
  goes, "end with !", not "end with an exclamation mark", because the validator matches
  characters), that every character must come from something the player can read because sign-in
  is exact and can lock the account, that a clue must not sit behind the account it opens (the
  report's "behind lock" mark and the graph's "clue" edges show it), what a mapping on a screen
  state needs from the PC's lock (7.2, "Screen state mappings"), that a gate keeps a player out and
  not a secret, and how to read the validator's habits report.
- `docs/achitechture/ACCESS_MODEL_PLAN.md` section 9.1: replaced by a pointer to this plan, by the
  orchestrator.
- `docs/achitechture/ACCESS_MODEL_SLICE_9_1_BUILD_LOG.md` (new): what was built when, deviations,
  review rounds, test totals, step 0's record and the one-off checks.
- `docs/test-bridge.md`: nothing new in the bridge; a note in this slice's own paragraph that
  habits are not readable from the browser by design and that `verify-run.rb --access` prints
  their values.

## 11. The feature scenario: `test_access_habits`

It follows the first slice's rules for feature scenarios: `scenarios/test_access_habits/` holds
`scenario.json.erb`, `mission.json` (`"collection": "test_scenarios"`, `"test_type":
"access_model"`, with a `test_objective`), ink under `ink/` and `PLAYTEST.md`. A `lobby` start room
with each beat in its own room, open from the start apart from the thing under test. At each beat a
sign (`notes1`, `readable`, not takeable, named "Sign: <beat>") says what to do and what should
happen; a sign never holds a password or a part of one. `npcNeedsSeed: "test_access_habits"`,
`npcWindupMs: 0`, `needsDebugOverlay: true`, and `lockCues` left on (the default), so office life's
cues play. One task per beat, completed by an event mapping on
the beat's own event. The events are chosen so that no mapping waits for a screen state its PC
cannot give (7.2, "Screen state mappings"), which keeps the validator free of warnings:

| Beat | Task completed by |
|---|---|
| H1 | `pc_signed_in:dana_pc` with `data.via === 'claim'` |
| H2 | `workstation_locked_attempt:ian_pc` (effective lock 1) |
| H3 | `pc_signed_in:omar_pc` with `data.via === 'password'` |
| H4 | `workstation_locked_attempt:priya_pc` (authored `lockChance` 1) |
| H5 | `workstation_locked_attempt:kai_pc` (filled `screenHabit` `lockChance` 0, but `instant_lock` makes the effective lock 1) |
| H6 | `pc_signed_in:mei_pc` with `data.via === 'password'` |
| H7 | `pc_signed_in:tom_pc` with `data.via === 'password'` |
| H8 | `pc_signed_in:lena_pc` with `data.via === 'claim'` (needs no lock or open state from the validator's point of view; the recorded sequence guarantees an open leave) |
| H9 | Two mappings on `door_gate_denied`, one with `data.roomId === 'store_b'` and one with `data.connectedRoom === 'store_b'`, each completing the task and making Sara bark |

Every PC is a sign-in PC with `"sprite": "pc_desktop"` (so the padlock shows) and **no lock field
of its own** unless the beat says so. Every desk owner has an account, starts at the desk, and has
one fast need (`decayPerMin: 30`, `urgentAt: 40`, `initial: 65`: urgent after about 50 seconds) with
a station in the beat's own room whose `useSeconds` is 900, so once gone they stay gone, except
Lena (H8), whose station takes 20 seconds so she leaves several times. One profile, `staff_desktop`
(`for: { roles: ["staff"] }`), with one file. One policy, `instant_lock` (`autoLockMin: 0`); no
`defaultPolicy`. `roles` gives the role `front_desk` the level `low`. Attacks are off.

| Beat | Room and set-up | What should happen | Server record afterwards |
|---|---|---|---|
| H1 Never locks, level from a role | `dana_room`: Dana Reyes, `"role": "front_desk"`, no `awareness` of her own, `dana_pc` | When she walks off, the screen keeps its desktop look and a click opens her desktop (a claim). No note picture on her monitor | `sessions.dana_pc = { id: "dana", via: "claim" }`; habits block: Dana `locksScreen never`, screenHabit lockChance 0; `dana_pc` no lock field, not "always locks" |
| H2 Always locks | `ian_room`: Ian Shaw, `"awareness": "high"`, `ian_pc` | When he walks off, the padlock shows (`lockedLook` true), a lock transition is recorded and `cueLog` holds a `leave` lock cue with a chime; a click opens the sign-in screen with no note; `workstation_locked_attempt:ian_pc` fires. There is no way in | No session; Ian screenHabit lockChance 1; `ian_pc` "always locks" |
| H3 Careful, with a sticky note | `omar_room`: Omar Haddad, `"awareness": "high", "habits": { "writesDown": true }`, `omar_pc` | The note picture is on his monitor from the start (a screenshot is kept). While he sits there a click says he is using the PC. When he leaves, the padlock shows and the sign-in screen shows the note; `pc_signin_shown` carried `hasPostit: true`. The tester saves the note to the notebook, **which closes the sign-in screen**, clicks `omar_pc` again (a second `pc_signin_shown` and `/login_accounts`), and signs in with the username and password on the note | `sessions.omar_pc = { id: "omar", via: "password" }`; `omar_pc` hasPostit true |
| H4 The PC's own field wins | `priya_room`: Priya Nair, `"awareness": "low"`, `priya_pc` with `"lockChance": 1` | Locked on every leave, no claim, no note | No session; Priya screenHabit lockChance 0; `priya_pc` lockChance 1, "always locks" |
| H5 Policy beats habit | `kai_room`: Kai Brennan, `"awareness": "low"`, `kai_pc` under `instant_lock` with no lock field | Locked in the leave roll itself; a click opens the sign-in screen and offers no claim | No session; Kai screenHabit lockChance 0; `kai_pc` no lock field, not "always locks" (the policy refuses the claim) |
| H6 Guessable password | `mei_room`: Mei Lin, `"awareness": "high", "habits": { "password": "guessable", "passwordPattern": "password_memo" }`, `mei_pc`. Her password is three pieces: a pet's name of three or more letters with a capital first letter (a word part), a four-digit year (a number part) and one symbol. A framed photo on her desk (readable) has the name as a whole word in its caption, a calendar on the wall (readable) shows the year, and `password_memo`, a readable IT notice in the room, gives the rule: the order, that the first letter is a capital, and the symbol itself ("end with !"). No other character is in the password, so every one is accounted for | The password built from the photo, the calendar and the memo signs in at the first try | `sessions.mei_pc` Mei by password; no `loginFailures` entry for her |
| H7 Reused password | `tom_room`: Tom Fletcher, `"awareness": "high", "habits": { "password": "reused" }`, `tom_pc`; his gym locker (`lockType: "password"`, the same password) and a note in the room with the locker's combination | The note opens the locker, and the same password signs in at `tom_pc` | Locker in `unlockedObjects`; `sessions.tom_pc` Tom by password |
| H8 Sometimes locks | `lena_room`: Lena Fox, `"awareness": "medium"`, `lena_pc`; her station takes 20 s. The builder picks the PC's id (the roll's salt, `habit:<pcId>:<leaves>`) so that her first three leaves hold at least one locked and one open, and records the sequence in `PLAYTEST.md` | On each of her first three leaves the screen is locked or open as recorded. An open leave gives a claim, a locked one the sign-in screen. After a reload the sequence starts again from the first entry | A claim at `lena_pc` on an open leave, gone when she returns; none after the reload until the next open leave |
| H9 Holds doors, and does not (with step 5) | `gate_hall`, with `store_a` to its north and `store_b` to its south, each a locked room behind a gate door with no `playerMayPassIf` and `"holdMs": 6000`. **Both gates sit on north and south doors** (the north door of `gate_hall` into `store_a`, the south door into `store_b`): the engine plan's body rule is built for north and south gates only, and an east or west gate is declined with a validator warning. Each `gate` config goes on the door entry whose `connectedRoom` is the locked store room, which is how the door work finds the secured room. Gary Whitlock (`"awareness": "low"`) walks a two-room route through the gate to `store_a`; Sara Quinn (`"awareness": "high"`) through the gate to `store_b`. Each route and its `unlockRoom` action are copied from `test_gate_tailgate`. Neither has needs (a route and needs do not combine). Every mapping on a gate event has two entries, one on `data.roomId` and one on `data.connectedRoom` (section 2): the two `door_gate_denied` mappings for `store_b` complete the task and make Sara bark, a `door_gate_guard_turned_back` mapping with `data.npcId === 'sara'` sets a global for the run, and the scripted run's globals from `door_gate_opened` are set the same way for each store | Gary's door opens with the player standing beside it and lingers open after him: the player walks in behind him and `room_entered:store_a` fires. Sara's door: with the player waiting within its radius, it does not open for her; after five seconds she turns back (`door_gate_guard_turned_back` names her) and walks her route again. With the player parked outside the radius it opens for her; the player then walks into it, is stopped, the refusal toast shows, `door_gate_denied` fires and she barks. **Starting towards the door one second after she has gone through, the player finds it shut or solid: at no sampled moment is it open and passable. Once the player is within the radius and nobody is in the doorway, the gate is shut within one tick** (it does not linger open but solid for `holdMs`). Twenty seconds of pushing never fires `room_entered:store_b`, and `door_gate_denied` fires no more than once every four seconds | `store_a` entered, `store_b` not; habits block: Sara's gate `noHold: ["sara"]`, Gary's gate none |

Passwords have in-game sources of their own: Omar's is read from the sticky note, Mei's is built
from the photo, the calendar and the memo, Tom's is read from the locker note. Dana's, Ian's,
Priya's, Kai's and Lena's are never typed.

**Expected validator output**, listed in `PLAYTEST.md`: no errors and no warnings. One suggestion:
the roll on `lena_pc` (a preset `sometimes`, one line from `ValidateNpcHabits.check`; the first
slice's roll warning does not fire, because no PC authors a chance between 0 and 1). No screen
state mapping warning: H2's and H4's PCs resolve to 1, H5's resolves to 1 through `instant_lock`,
and H1's, H3's, H6's to H8's tasks are on `pc_signed_in`. The habits report for the eight desk
NPCs (ten with step 5), which is where H4's "the PC sets lockChance, habit not applied", H1's
"level from role front_desk", Mei's word and number parts with their sources, her symbol "in the
pattern clue" and "1 capital, 1 symbol, 3 pieces in order", "pattern clue at" the memo, and Tom's
"same password as" the locker and "written in full at" the locker note are checked.

**Static checks.** Validator as expected, ink compiles, `python3 scripts/check_door_alignment.py`,
dungeon graph regenerated (and its new edges looked at once), node and Rails suites, both
no-password tests.

**Scripted runs** (two, each with a new game, 10 to 15 minutes each, `--capture-responses` on,
a private scratch folder `test_access_habits-regress/`):

- Run 1: H1 to H5, with a reload after H3. A reload puts every owner back at the desk, so straight
  after it a click on `omar_pc` says Omar is using it. The script waits for his next leave (about
  50 seconds, `window.__test.access.workstation('omar_pc').present` false), then checks that his
  password session is kept (the desktop opens with no password), that the note shows again behind
  **Switch user**, that Dana's claim has ended, and that the saved note is in the notebook. If the
  run continues in a second capture file after the reload, both files are given to the leak check,
  in order.
- Run 2: H6 to H8, with the reload inside H8, and H9 once step 5 is in.

After every beat: the screen; `verify-run.rb <game_id> --access` against the record above; and
`access-leak-check.rb` over the responses so far, which must report nothing. In particular it must
find Omar's password only at `postitNote` in `/login_accounts` answers for `omar_pc` and, after
the tester saved the note, in `savedNotes`; and no NPC record with a `habits` or `awareness` key
in any response. `window.__test.access.workstation(pcId)` gives `screenLocked` and `lockedLook`
for H1, H2, H4, H5 and H8. A lock is checked in two places: `window.__test.access.screenTransitions()`
records the picture change (its `sound` is null, because the lock cues own the sound), and
`window.npcOfficeVisuals.cueLog` records the cue (`how: "leave"`, `locked: true`, a flash or a
glyph, and a `chime` whose `volume` is above 0 when the player stood in the room). An open leave
records neither. The script reads `cueLog` from `window` (the bridge has no wrapper for it) and does
not name sound files or chime keys, which the engine plan's item 1 may change.

**Earned secrets.** The report carries the table. Omar's, Mei's and Tom's passwords are earned
from their in-game sources. H9 uses the lab's pattern for gates: park on a named tile off the
guard's line and wait on a global the scenario sets from `door_gate_opened` (or, for the
keep-shut, from Sara's turn-back), because scripted
movement collides with NPCs in ways a person does not. Nothing in the runs needs the manual clock
or a knock-out.

**After the runs.** The first-slice suite runs again, then the report is saved to
`tools/playtest/test_access_habits-report.md`.

## 12. `lab_physical_pentest`

The lab is the first scenario with hand-set habits. In this slice it swaps them for habits with no
change to play.

**When.** Last of three edits to the lab file, one builder at a time and never alongside another:
first the lab's feedback pass (the engine plan's lab wiring and `PHYSICAL_PENTEST_FEEDBACK_PLAN_CONTENT.md`),
then slice 9.3's lab step (the drop box), then this step. The two earlier edits may change which
PCs are workstations or sign-in PCs and how often their owners leave. So this step is a recipe to
apply to the file as it then stands, by object id, and the builder reads the file first.

### The recipe

1. **Find every hand-set screen habit.** List each object in the scenario with
   `locksScreenOnLeave`, `lockChance` or `autoLockSeconds`, each NPC with a `screenHabit`, and each
   PC's `policy` (and the scenario's `defaultPolicy`), with the owners (`screenOwner`, else the NPC
   whose `needsHome` is its id). At this commit that is `staff_pc` (Chris, `locksScreenOnLeave:
   true`) and `staff_pc_2` (Melanie, `false`), and nothing else: no `screenHabit`, no
   `autoLockSeconds`, no policy. The earlier edits may have added Sofia's PC or a habit.
2. **Give each owner the level that says the same thing, and remove the field from the PC.** An
   owner whose PC always locks gets `"awareness": "high"`; one whose PC never locks gets
   `"awareness": "low"`. The PC keeps `"workstation": true` or `"lockType": "login"` and its
   `"sprite": "pc_desktop"`. Where an earlier edit has given a PC a chance between 0 and 1 on
   purpose, an `autoLockSeconds`, or a policy that locks it late, leave those as they are: an
   explicit field wins, and `medium` is not the same number unless it is 0.5. Where an earlier edit
   has given an owner a `screenHabit`, leave it: it is explicit and the level's `locksScreen` is not
   applied (the report says so); give that owner a level only if another habit needs one.
3. **Write no habit that does nothing.** No `habits` object is needed for the swap. Do not mark any
   of the staff passwords `guessable`: they follow a pattern, but nothing in the lab gives the
   player every part of one or the rule, so the validator would rightly say the habit is not
   backed. Give Len nothing: his gate has `playerMayPassIf` and he has `challengeOnSight`, both
   explicit, so a habit would have no effect.
4. **Do not disturb the office life fields.** Chris's and Melanie's needs, their `needsCompany`
   (both avoid Sofia, with `avoidRadius` 2), `maxQueue` 1, `chatterCooldownMin` and the
   `coffee_exchange` stay exactly as they are: they set how often and how long each owner is away,
   which is what the swap must not change.
5. **Move the comments.** Any comment that explains a removed field ("She locks on every leave
   (staff_pc locksScreenOnLeave ...)", erb:1063-1067; "She never locks her screen
   (locksScreenOnLeave: false)", erb:1520-1523) is reworded to name the habit on the NPC.
6. **Run the validator and read the habits report.** It must show `screenHabit` lockChance 1
   filled on the always-locking owner and lockChance 0 on the never-locking owner, each read at the
   one PC that owner has, and no other fill. It must raise no screen state mapping warning: Chris's
   capture needs a locked screen (`data.wasLocked === true`, erb:1070-1071) on a PC whose effective
   lock is 1. A mapping that needs an open screen on Melanie's PC is clean at 0. If the earlier
   edits gave a PC a late lock or a chance between 0 and 1, read the warning table in 7.2 before
   changing anything: a warning there is a real finding for the feedback pass, not for this step.
   If any other owner shows a fill or a PC shows "not applied", an owner has a second workstation
   or field the swap did not intend: stop and look.
7. **Update the lab's guard test.** `test/models/break_escape/lab_physical_pentest_secrets_test.rb`
   asserts today that `staff_pc` has `locksScreenOnLeave` exactly `true`, because Chris's keylogger
   capture fires only on a return to a locked screen. Change it to assert, on the game's prepared
   scenario data, that the owner's expanded `locksScreen` is `always`, that her `screenHabit` is
   exactly `{ "lockChance": 1 }`, that `staff_pc` has no `lockChance` and no `locksScreenOnLeave`,
   and that the server's claim check calls `staff_pc` "always locks", keeping the comment that
   names the capture. Change the matching assertion for the never-locking PC to `screenHabit`
   `{ "lockChance": 0 }` and `locksScreen` `never`, and add that a claim at `staff_pc_2` is still
   granted while Melanie is away (the claim check fix in 5.2 is what keeps it so).
8. **Update the lab's documents.** `scenarios/lab_physical_pentest/PLAYTEST.md`: the expected
   validator output gains the habits report; the beats do not change. The orchestrator adds a dated
   note to `PHYSICAL_PENTEST_ACCESS_FOLLOWUP_PLAN.md` that the lock fields are now habits.

**Static checks.** Validator clean apart from the listed output, ink compiles, dungeon graph
regenerated, the lab's Rails tests, both no-password tests, `reopencheck`.

**Scripted run** (the regression tier, the lab's existing script as the earlier edits leave it):
the keylogger beat and the unlocked-screen beat play as before, with a reload during the claim,
and the two checks after each beat. The run must show the padlock on the always-locking PC when
its owner leaves and none on the never-locking one.

**Persona run** (a tester who does not know the answers). The tester is given only what a player
gets. It is **not** shown the validator's habits report, the `verify-run.rb` habits block or this
plan, all of which name who never locks. Questions are put only after play: did you notice which
of the two locked their screen, how, and what would you tell each of them? If the lab by then has
a desk with a sticky note: did you notice the note on the monitor before you clicked the PC? It
reports every "didn't know what to do" moment. What a model tester cannot judge (the sounds,
whether a 9 px note reads as a note) goes to the user's own look.

### What habits offer the lab's feedback pass

Not built by this slice; offered to the feedback pass, which owns the lab's content now that
signing in with captured credentials is in scope.

- **Three desks, three habits, three controls.** Chris locks every time (a planted device and a
  wait; the control is checking the cable run and a second factor). Melanie never locks (sit down
  while she is away; the control is Win+L with an auto lock policy behind it). A third desk whose
  owner locks but keeps the password on a note (`"habits": { "locksScreen": "always",
  "writesDown": true }`, written by name; read it off the locked screen; the control is no written
  passwords and a password manager). The engine plan's own suggestion for a third habit is a
  screen that locks late under a policy; the two can be weighed there.
- **A found note is an event.** `pc_signin_shown:<pcId>` with `data.hasPostit === true` can set a
  finding global and complete a bonus task.
- **A note read at the desk works from the drop box.** With slice 9.3a, a password read off a
  monitor signs in remotely too, which is a three-step chain across two slices.
- **A guessable password needs its clues and its rule placed.** If the pass wants a captured
  password to lead to a guessed one, it has to put every part and a pattern clue in the world, and
  the validator will then say the habit is backed.

## 13. Effects on other scenarios

- **No scenario has `awareness`, `habits` or `roles` today**, so the loader fills nothing anywhere
  until a scenario adds one. Step 1's one-off check proves it for every scenario.
- **Authored fields mean what they meant.** `lockChance`, `locksScreenOnLeave`, `screenHabit`,
  `autoLockSeconds`, `postitNote`, `showPostit` and `gate.playerMayPassIf` are read exactly as
  before. A habit only fills a field the author left out.
- **A workstation with neither lock field still locks on every leave** when its owner has no
  `locksScreen` habit and no `screenHabit` (today's default). Give the owner a level and that PC
  follows the habit. This is the one place a single word on an NPC changes a PC the author did not
  touch, and the habits report lists every PC it happened to.
- **The claim check reads the owner's `screenHabit`** (5.2). That changes the answer only at a
  sign-in PC with no lock field whose owner has a `screenHabit` that can leave it open, and no
  scenario has one today (`test_needs_sims` has the only habits, on plain workstations). Its claims
  were refused before while the screen showed open; now they are granted.
- **Gates** are untouched by steps 1 to 4. Gates with `playerMayPassIf` are untouched by step 5
  too; what changes them is the engine plan's item 3 (the body rule on north and south gates, its
  decision X1), which that plan covers.
- **The sign-in screen** asks `/login_accounts` as it does now and reads one more key from the
  answer. A PC whose owner has no `writesDown` behaves as before.
- **The note picture** is new on every sign-in PC with an authored, shown `postitNote`:
  `test_access_signin`'s hot desk gains one. It is drawn on sign-in PCs only, so the password locks
  with authored notes in m01 to m04 and sis01 are unchanged. No campaign mission has a sign-in PC.
- **`test_access_doors`, `test_access_signin`, `test_access_sessions`** have no habits and keep
  their explicit lock fields. Their scripted runs are rerun as the regression suite.
- **The loader's order changes** (ids are stamped before the access fields are expanded). Stamping
  reads nothing the normaliser writes, and the normaliser reads no object id, so the saved data is
  the same; step 1's loader tests and the first slice's loader tests hold it.
- **A new validator warning can fire on existing scenarios**: a workstation whose effective lock
  on a leave (7.2, "Screen state mappings": the policy's `autoLockMin: 0` first, then
  `lockChance`, then `locksScreenOnLeave`, then the owner's `screenHabit`) cannot give, or gives only on some leaves, the screen
  state one of its mappings waits for. A policy with `autoLockMin: 0` resolves to 1, and one with
  `autoLockMin` above 0, or an `autoLockSeconds`, is a late lock that silences the warning for a
  mapping that needs a lock,
  so `test_access_sessions`' `priya_pc` (`lockChance` 0 under `instant_lock`, a mapping on
  `workstation_locked_attempt:priya_pc`) draws nothing. Any warning that does fire is a real
  finding. Step 3 runs the validator over every scenario with a workstation and records what it
  raises.
- **Missions m01 to m10, the SIS games and the awareness course scenarios**: no change.

## 14. Interfaces with other plans

The build order is **9.3a, then this slice, then 9.2**, with 9.3b after 9.3a at a time the user
chooses and the engine plan's streams as a separate build. Each sibling's interfaces section was
re-read on 2026-11-10. There is no open disagreement.

### 14.1 What this plan changes in the first slice plan's sketch of 9.1

1. `writesDown` puts `hasPostit` in room data and the note's text in the `GET /login_accounts`
   answer. It does not write `postitNote` into room data.
2. `writesDown` and `password` are in no preset.
3. `locksScreen` fills the owner's `screenHabit` (office life's field), which every workstation the
   NPC owns reads, plain ones too. The PC's own `lockChance` or `locksScreenOnLeave` wins, and an
   authored `screenHabit` is never overridden.
4. `password` is checked by the validator, part by part, with a named pattern clue for
   `guessable`.
5. `holdsDoors` becomes `gate.noHold`, read by `_playerBarred` and `openToPlayer`, on gates with no
   `playerMayPassIf`, and is built only on the engine plan's body rule, on top of the owner's
   turn-back rule.
6. `phishable`, `pretextable` and `challengesStrangers` are not in this slice.

### 14.2 Slice 9.2 (work, frustration, social media), built after this slice

| Point | Settled as |
|---|---|
| The sticky note | This slice's channel and helpers: `written_down?(npc)` decides; `login_postit_for(pc)` is the only source of the text, "<username> / <password>"; `GET /login_accounts` carries it, `no-store`; room data carries `hasPostit` only; an authored `postitNote` or `showPostit: false` wins; the picture is `postit-marks.js` with `mark(pcId, on)`. 9.2 adds one clause to `written_down?` for a done `writes_down` workaround and answers `{ pcId, hasPostit: true }` from its workaround route. It writes nothing into room data |
| A guest and `locksScreen` | The browser never reads a habit. The server decides: 9.2 sends `leavesOpen: false` in the `borrow_session` hand-over when the guest's saved `screenHabit` always locks, by `AccessIdentities.screen_always_locks?` with no PC field (so a filled habit and an authored one count alike), and its guest claim refuses on the same test. `sometimes`, and a habit with a `lockIfAwayOverSeconds`, count as leaving open, with no roll at a borrowed PC. The boolean is in the hand-over, not in the NPC's standing plan, so it reaches the browser only when the borrow happens. This slice provides `screen_always_locks?` and `npc_habit` and nothing else for it |
| What `borrow_session` is | A guest session at an unowned sign-in PC. It never changes how an owner leaves their own PC, so this slice's filled `screenHabit` and the claim check are not touched by it |
| The claim check | This slice fixes `pc_always_locks?` to read the owner's `screenHabit` (5.2) before 9.2 starts, so 9.2's `borrow_session` and `share_login`, which rest on the claim, inherit the fix |
| `roles` | Shared. This slice adds the key to the schema (`additionalProperties` open) and the validator's top-level list, reads `roles.<role>.awareness`, and deletes the whole key from the bootstrap. 9.2 owns `workNeeds`, `frustration` and `workarounds` under it. `roles.<role>.habits` does not exist |
| How a role default is resolved | Both slices walk `identity_roles(npc)`: authored roles in order, implicit `staff` last |
| 9.2's warning for a `high` NPC whose post carries a fact | It reads `NpcHabits.level_of(npc, scenario)`, so a level from a role counts |
| Feed posts as password clues | The shape is `feed.posts[].text`. 9.2 adds feed post texts and feed fact texts to `NpcHabits::Clues.readable_texts` in its step C-2 |
| The need's name | `social_media`. This slice names no need |
| Withheld keys | `WITHHELD_NPC_KEYS` already holds `awareness` and `habits`; 9.2 adds its own |
| `holdsDoors` and `prop_door` | Independent: one is a gate door behaviour, the other unlocks a room |
| A habit that changes mid-game | Not provided by this slice and not needed by 9.2, which changes no habit: its workaround makes `written_down?` true by its own record |

### 14.3 Slice 9.3 (networks)

9.3a is built before this slice; 9.3b later.

| Point | Settled as |
|---|---|
| A written-down password and remote sign-in | The note's text is served only from `GET /login_accounts` for a physically reachable PC. 9.3a's remote sign-in screen never calls that route, so **a sticky note is never shown on a remote sign-in screen** (5.3). The password itself signs in remotely as it does locally |
| `attach_login_accounts!` | 9.3a makes it skip a host with no screen; this slice adds `hasPostit` in the same short method afterwards and re-reads it first. A headless host has no owner at a desk, so it never gets a note |
| `openLoginSignIn` | 9.3a adds the remote branch; this slice edits the desk branch only |
| The Wi-Fi key as a reused secret | `networks.<id>.wifi.psk` (9.3b). Whichever of this slice and 9.3b lands second adds it to `NpcHabits::Clues.secret_homes` (7.2) |
| 9.3b's "the key appears nowhere" warning | It uses `Clues.readable_texts` where this slice is built |
| An NPC who notices a planted device | Not built by either. `network_device_planted` is the hook for the slice that builds `challengesStrangers` |
| The lab file | One editor at a time: the feedback pass, then 9.3's lab step, then this slice's (section 12) |
| Sign-in PCs with `affordance.accepts` | 9.3a converts no workstation to a sign-in PC, so the question is still unproven. If the feedback pass makes Sofia's PC a sign-in PC, it probes that such a PC still takes an NPC's deliveries |

### 14.4 The engine plan (`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`)

| Item | Owner | Contact |
|---|---|---|
| 1. Lock screens and lock sounds: any change to the lock cues (stream E2, only on the user's word), and the version stamp (stream E2b, held for the user's question about how their server serves the JavaScript) | The picture is `screen-states.js`, done on `main`. The cues are office life's `npc-office-visuals.js`, which E2 may change by one constant or function | This slice edits neither file and depends on no change to either. Its runs check that a transition was recorded (`screenTransitions()`) and a cue was recorded (`npcOfficeVisuals.cueLog`), not which sound played. The indicator dot stays the cue for a screen left open. Overlap: E2b's `generate_scenario_data` in `game.rb` (beside F's `prepare_scenario_data!`, section 15, engine work first). If E2b is built, its `_digest` of the rendered scenario must be taken from the render, before `prepare_scenario_data!` writes this slice's fills, or every game would differ from a fresh render |
| 2. One sound for the RFID door (stream E1, in build) | The engine plan: `door-gates.js` (`open()` and `playerOpen()` play the sound; `register()` copies `lockType`), `doors.js` (the clone path's inline sound goes) | Touches `register()`, `open()` and `playerOpen()` in `door-gates.js`, which step 5 also edits (`open()`). Step 5 comes after it and re-reads |
| 3. A north or south gate is solid for a player it is not open to (stream E1, decision X1, being rewritten around the owner's turn-back rule) | The engine plan: the body rule and `blocksPlayer`, `securedRoom`, the bump and its refusal, the exit opening, which door directions may be gates (north and south only; an east or west gate is declined and warned on), and all `door-gates*.test.mjs`. The owner's turn-back (`GUARD_TURN_BACK_MS`, `_holdGuards`, `turnBackFromGate`) and the barred-player branches of `update()` stay | Step 5 of this slice starts after item 3 is committed and meets the contract in 5.4 (item 2 of which is unmet on `main`). It makes the seven edits listed there, including one clause in `_playerBarred`, so the door work keeps both branches of `update()` reading `_playerBarred`. It adds one test file to that set. A forced `closeDoor` goes through `close(g)`, so contract item 5 holds whatever the door work does with `forcedUntil`. The door work's fixture changes to `test_gate_tailgate` come first; this slice's H9 uses two new gates of its own, on north and south doors |
| 6. The capture log | The engine plan | A saved sticky note goes through the existing "add to notebook" path. If the log changes where saved notes live or are returned, the leak scanner's saved-copy exception (section 6) follows the new home |
| Lab content: which PCs are workstations, and their owners' leave rates | The feedback pass | Section 12 runs after it |

### 14.5 Order

1. The engine plan's streams that hold a file this slice also edits commit first (section 15).
   Of these, E1's item 7 and E5 are built; E1's item 2 and E3 are in build; E2 runs only on the
   user's word and E2b is held.
2. 9.3a's streams commit their edits to the files in section 15.
3. This slice's steps 0 to 4, 6 and 7 then start. Step 1 begins with the claim check fix (5.2).
4. Step 5 starts when steps 1 to 4, 6 and 7 and the engine plan's E1 item 3 (the body rule) are
   committed, and the contract in 5.4 holds.
5. Step 8 (the lab) comes after the feedback pass and 9.3's lab step.
6. 9.2 is built after this slice.

## 15. Build streams and shared files

Inside this slice:

| Stream | Steps | Files it owns in this slice | Starts |
|---|---|---|---|
| F Foundation | 0, 1 | `lib/break_escape/npc_habits.rb`, `screen_always_locks?` in `lib/break_escape/access_identities.rb`, `game.rb` (`pc_always_locks?` and its call in `claim_login_session!`, the loader order, `npc_habit`, `written_down?`, the bootstrap deletion), `scripts/scenario-schema.json` (the step 1 block), the known-field lists in `validate_scenario.rb`, `test/unit/npc_habits_test.rb`, `test/unit/access_identities_screen_test.rb`, `test/models/break_escape/npc_habits_loader_test.rb`, `access_model_withholding_test.rb` | First, alone |
| A Sticky note | 2 | `game.rb` (`login_postit_for` and `attach_login_accounts!` only), `games_controller.rb` (`login_accounts`), `unlock-system.js` (the desk branch of `openLoginSignIn`), `pc-sessions.js` (`screenShown`), `postit-marks.js`, one line each in `core/game.js` and `core/rooms.js`, `api-client.js`, its three test files | When F is committed |
| B Authoring tools | 3, 4 | `scripts/validate_npc_habits.rb`, the wiring in `scripts/validate_scenario.rb`, the `screen_habits:` keyword and its one line in `scripts/validate_npc_needs.rb`, `scripts/generate_dungeon_graph.rb`, `lib/break_escape/npc_habits/clues.rb`, `test/unit/npc_habits_clues_test.rb`, `test/js/validator-npc-habits.test.mjs`, `test/js/dungeon-graph-habits.test.mjs` | When F is committed |
| E Playtest tooling | 6 | This slice's block in `tools/playtest/lib/access_leak_scanner.rb`, `access-leak-check.rb` and `verify-run.rb`, and their two test files | When F is committed. Its tests use fixture response files; its last check waits for A |
| S Scenario | 7 | `scenarios/test_access_habits/`, `tools/playtest/test_access_habits-report.md` | After A, B and E |
| D `holdsDoors` | 5 | The `holdsDoors` and gate lines of `npc_habits.rb`, `scenario-schema.json`, `validate_npc_habits.rb`, `generate_dungeon_graph.rb` and their tests; the gate line of the `habits` block in `verify-run.rb` and its case in `playtest-verify-run-access.test.mjs`; its seven places in `door-gates.js` (5.4); `test/js/door-gates-no-hold.test.mjs`; one paragraph of `README_scenario_design.md`; beat H9 in `scenarios/test_access_habits/` | After F, A, B, E and S are committed **and** the engine plan's E1 item 3 (the body rule) is committed and meets 5.4's contract |
| L Lab | 8 | `scenarios/lab_physical_pentest/`, `lab_physical_pentest_secrets_test.rb` | After S, the feedback pass and 9.3's lab step |
| Docs | 9 | `README_scenario_design.md` (the new section), the build log | Last |

Inside this slice, `game.rb` is touched by F and then A in different methods, and stream D comes
after every stream whose files it adds lines to. No other file is in two streams at once.

**Files other plans also edit.** One plan at a time holds each of these. A builder re-reads the
file just before editing, edits only its own block, never reformats, and commits with explicit
paths. The order is fixed: **the engine plan's feedback streams first, then 9.3a, then this slice,
then 9.2.** The sequence follows the engine plan's "Files shared with the sibling plans" table and
9.3's section 14 (streams S server, T tooling, C1 and C2 client).

| File | This slice's stream | Also edited by | Sequence |
|---|---|---|---|
| `app/models/break_escape/game.rb` | F (`pc_always_locks?`, `claim_login_session!`'s one call, `prepare_scenario_data!`, `npc_habit`, `written_down?`, `filtered_scenario_for_bootstrap`), A (`login_postit_for`, `attach_login_accounts!`) | Engine E3 (`add_item_to_room!`) and E4 (`capture_secrets_for_client` and nearby), **engine E2b** (`generate_scenario_data`, the caller of `prepare_scenario_data!`; held), 9.3 S (including `attach_login_accounts!`), 9.2 | Different methods. Engine streams first; E2b first if it is released before F starts, and F re-reads `generate_scenario_data` and `prepare_scenario_data!`, otherwise F first and E2b re-reads. Then 9.3 S, this slice, 9.2 |
| `lib/break_escape/access_identities.rb` | F (`screen_always_locks?`) | 9.3 T (if it adds to the identity rules), 9.2 | 9.3 first, then this slice, then 9.2. A new function each; never reformat |
| `app/controllers/break_escape/games_controller.rb` | A (`login_accounts`) | Engine E3 (`CLIENT_ITEM_FORBIDDEN_FIELDS`) and E4 (the `remove` branch of `inventory`), 9.3 S, 9.2 | Different methods. Engine streams first, then 9.3 S, then this slice, then 9.2 |
| `systems/unlock-system.js` | A (the desk branch of `openLoginSignIn`) | **Engine E1** (the RFID helper, item 2, in build), 9.3 C2 (the remote sign-in branch of `openLoginSignIn`), 9.2 | E1 first, then 9.3 C2, then this slice, then 9.2. Separate blocks |
| `core/game.js` | A (the `postit-marks.js` import and install) | 9.3 C1, 9.2 | 9.3 first, then this slice. One or two lines each. No engine stream edits it |
| `systems/pc-sessions.js`, `api-client.js` | A | 9.3 C1 and C2, 9.2 | 9.3 first; one or two lines each |
| `core/rooms.js` | A (one `syncRoom` call beside `screenStates.syncRoom`, `:1005`) | None named today | Re-read before editing |
| `systems/door-gates.js`, `test/js/door-gates*.test.mjs` | D | Engine E1 owns both: item 2 (`register()` copies `lockType`; `open()` and `playerOpen()` play the door sound) and item 3 (the body rule) | E1's items 2 and 3 first, whole file. D after both commit. H9's gates on north and south doors |
| `systems/npc-office-visuals.js` | None: steps 0 and 7 read `cueLog` only | Office life; engine E2, one constant or function, only on the user's word | If E2 changes the cue, this slice's runs still read `cueLog` and name no sound |
| `systems/doors.js`, `systems/interactions.js`, `systems/action-menu.js`, `ui/interaction-menu.js`, `systems/item-drop.js`, `systems/table-drop.js`, `systems/inventory.js` | None | Engine E1 and E3, 9.3 C1, 9.2 | This slice edits none of them. Listed so a builder knows the click order in `interactions.js` and the RFID clone path in `doors.js` may have moved when steps 2 and 5 are built |
| `scripts/validate_scenario.rb`, `scripts/scenario-schema.json` | F, B, D | Engine E1, E3 and E4, 9.3 T, 9.2 | Each stream appends its own block, never reformatting; whoever is second re-reads. Engine first, then 9.3 T, then this slice, then 9.2. B's three lines in `main` sit around the `ValidateNpcNeeds.check` and `check_access_model` calls |
| `scripts/validate_npc_needs.rb` | B (the `screen_habits:` keyword and one line in `check_lock_habits`) | Office life, 9.2 (its needs and frustration checks) | This slice, then 9.2. One keyword and one line |
| `scripts/generate_dungeon_graph.rb` | B, D | 9.3 T, 9.2 | 9.3 first, then this slice, then 9.2 |
| `README_scenario_design.md` | D, Docs | Engine E1, E3 and E4, 9.3 T, 9.2 | Each owns its own section. E1's rewrite of "Gate doors" comes before D's paragraph |
| `tools/playtest/lib/access_leak_scanner.rb`, `verify-run.rb` | E, D (one gate line in `verify-run.rb`) | 9.3 T, 9.2 | 9.3 T first, then this slice, then 9.2. Engine E4 does not edit these two |
| `tools/playtest/access-leak-check.rb` | E | Engine E4 (the device's DOM walk), 9.2 | E4's block, after 9.3 T; then this slice; then 9.2 |
| `docs/test-bridge.md` | Docs (one paragraph) | Engine E3 (the inventory commands), 9.3 T | Own paragraph only |
| The no-password test, `access_model_withholding_test.rb` | F, A | 9.2 | 9.3a adds its own files and does not edit these. This slice, then 9.2 |
| `scenarios/lab_physical_pentest/`, `lab_physical_pentest_secrets_test.rb` | L | The feedback pass (the content plan's scenario stream, then the engine plan's lab wiring L); 9.3's lab step | The content plan, then the engine plan's L, then 9.3's, then this slice's. One builder at a time |

Each stream is one builder with review rounds after it (AGENTS.md, "How a round works": at least
two rounds, at most five). Builders commit with explicit paths, use a scratch folder of their own,
write a handover note at about 150k tokens of context, and never stop or start the server on
:3000. Scripted runs are split from building: the builder of stream S writes the scenario and
`PLAYTEST.md`, and a separate tester runs it.

## 16. Open for the user

The decisions in section 3 were taken on the user's behalf and can be overruled. What is still the
user's:

| | Question | Where it is recorded | Effect here |
|---|---|---|---|
| 1 | The bar at gate doors | Settled in the engine plan as its decision X1 (north and south gates only), restated there as the body rule on top of the owner's turn-back rule. Not asked again here; listed so a reader of this plan knows where it lives | The door work built to 5.4's contract means step 5 is built. If the user ever reverses X1, `holdsDoors` waits for another way to close the dash |
| 2 | The preset values in 4.2 | Here | Two habits, three levels. Recommended: accept, and tune after the lab and the first mission have used them |

Recorded, not asked: the field name `awareness` is kept although the word also names the awareness
course; the code is named for habits (section 2). How `locksScreen` relates to office life's
`screenHabit` is settled (section 3): the habit fills `screenHabit`, and an authored one wins.

Recorded, not asked: the field name `awareness` is kept although the word also names the awareness
course; the code is named for habits (section 2).

## 17. Left out, later ideas, and declined

**Later ideas.**

- **A generated note in a drawer.** `writesDown` naming a container, so the loader puts a note
  item in it: pick the lock, read the note, sign in somewhere else. It chains better than a note on
  the screen it opens, and it removes the one weakness of a hand-written drawer note, which repeats
  the password in a second place with nothing but the validator's "written in full at" line to
  show the two are still equal. To be scheduled with the first mission that uses `writesDown`.
- **The social engineering habits** (5.6), when a scenario has a room NPC who is also a phish or
  pretext target.
- **Crediting "worked the password out"** as its own event, apart from "signed in by password".
- **The sign-in screen staying open after "add to notebook".** Existing behaviour for every note;
  filed in `docs/IDEAS_BACKLOG.md` by the orchestrator.
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
- **A habit that changes mid-game.**

**Declined, with the reason.**

- **Saving the expansion report in the game** (a top-level key holding which fields a habit
  filled, deleted from the bootstrap). The run-time tools print values and the validator's report
  says why. A saved report would be one more withheld key to guard for the sake of two lines in a
  playtest table.
- **A bare-password note where the PC shows account tiles**, with the username added only when
  the picker is off. One wording everywhere, "<username> / <password>", is simpler, matches slice
  9.2's workaround note, and never leaves the player wondering whose note it is.
- **Keeping unbuilt habit names in the schema and the presets with a "no effect" line** (the three
  social engineering habits, and `holdsDoors` before step 5). Accepting a field that does nothing
  is configuration nobody uses; a name is unknown until the step that builds it.
- **A preset value for `password` that only prints in the report.** Taking the habit out of the
  presets is simpler than a value that claims something and checks nothing.
- **An event for "the player crossed a gate while barred"** as the way to make a careful guard's
  door mean something. It would leave every scenario to police entry by itself. The body rule does
  it once, in the engine.
- **A machine-checked pattern template for `guessable`** (a string with named slots that the
  validator rebuilds the password from). It would be exact, but it is a small language to teach
  authors and to maintain for one habit. A named pattern clue that must hold the password's
  symbols, plus the counts in the report, catches the unfair cases at far less cost. If a mission
  shows authors getting patterns wrong, the template is the next step.
- **Keeping only `roles.<role>.awareness` out of the bootstrap** and shipping the rest of `roles`.
  Nothing in the browser reads the key, and one rule for both slices is deleting all of it.
- **`roles.<role>.habits`.** A role sets a level; an exception is written on the person.
