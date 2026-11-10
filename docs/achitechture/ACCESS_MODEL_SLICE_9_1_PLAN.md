# Access model slice 9.1: awareness and habits

Status: **design, version 1, 2026-11-10. Nothing here is built.** This plan replaces the sketch in
section 9.1 of `docs/achitechture/ACCESS_MODEL_PLAN.md` and is complete without it. It builds on the
first slice (built, `ACCESS_MODEL_BUILD_LOG.md`) and on the lab follow-up (built,
`PHYSICAL_PENTEST_ACCESS_FOLLOWUP_PLAN.md`). Two sibling plans are being written at the same time:
`ACCESS_MODEL_SLICE_9_2_PLAN.md` (work, frustration, social media) and
`ACCESS_MODEL_SLICE_9_3_PLAN.md` (networks). Section 14 is the interface with them.

How to read this plan: section 2 is what the code has today (checked on 2026-11-10 at commit
`08e5d02b`), sections 4 to 9 are the design, section 10 is the build order with each step's tests,
section 11 is the feature scenario and its scripted playtest, section 12 is the lab, section 15 the
parallel streams and section 16 the decisions that need the user.

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
  finds it by watching and trying, not by reading a stat. Habits are never shown as numbers.
- **Server-side secrecy.** `awareness` and `habits` never reach the browser. A password a habit
  gives away is served only at the moment the player is at the place it would be read.
- **Simple and clean.** No habit is a new system. Each one expands into fields that exist, the
  explicit field always wins, and nothing is configurable that no scenario uses.

## 2. What the code has today

Every line here was checked against the code. Where the parent plan's sketch differs, this section
is right.

**Withholding is already in place.** `withhold_npc_secrets!` (`app/models/break_escape/game.rb:3970`)
deletes `creds`, `awareness`, `habits`, `role` and `workarounds` from every room NPC in room data
(`WITHHELD_NPC_KEYS`, `:3968`). The bootstrap ships no room NPCs at all
(`filtered_scenario_for_bootstrap`, `:824`). Nothing reads `awareness` or `habits` yet: the
validator's known NPC fields (`scripts/validate_scenario.rb:414-422`) and the schema's NPC
definition (`scripts/scenario-schema.json`, beside `creds` at `:4130`) do not list them.

**The loader.** `prepare_scenario_data!` (`game.rb:799`) runs `normalise_access_model!` (`:4029`)
and then `stamp_scenario_object_ids!` (`:4055`), once, when a game is created
(`generate_scenario_data`, `:3990`), and the result is saved with the game. Tests reach it through
`create_access_game` (`test/test_helper.rb`). Both steps are idempotent.

**Shared rules live in `lib/break_escape/`.** `access_identities.rb` is plain Ruby with no Rails,
required by the validator (`validate_scenario.rb:21`) and the dungeon graph
(`generate_dungeon_graph.rb:16`); it mirrors the server's identity rules. `declared_grants.rb` is
used by the server and the scripts alike (`game.rb:2277`), so one library can serve both.

**Screens.** A workstation is an object with `workstation: true`, `locksScreenOnLeave`,
`lockChance` or `lockType: "login"` (`isWorkstation`,
`public/break_escape/js/systems/workstation-state.js:72`). Its owner is `screenOwner`, else the NPC
whose `needsHome` is its id (`ownerOf`, `:79`). On each leave `decideLocked` (`:92`) reads the policy's `autoLockMin: 0` first, then `lockChance` (0, 1 or
a seeded roll), then `locksScreenOnLeave` (default true). The server's claim check reads the same
two fields from the saved scenario (`pc_always_locks?`, `game.rb:1406`). The lab follow-up added
the locked look (`systems/screen-states.js`: a `<key>_locked` texture, a lock and an unlock sound)
and `wasLocked` on `workstation_owner_returned`. All of these follow the fields on the PC, so a
habit that fills those fields needs no client change.

**Sticky notes.** A sign-in screen shows the PC object's own `postitNote`
(`openLoginSignIn`, `systems/unlock-system.js:268-321`, at `:311-312`). The screen refreshes its
account tiles from `GET /login_accounts` every time it opens (`:275-281`;
`games_controller.rb:1106-1114`, which checks the PC is reachable). The bootstrap allow list ships a
room's `postitNote` (`game.rb:852-854`), and room data ships an object's.

**Gates.** A gate door is `rooms.<id>.doors[].gate` with `openFor`, `openRadius`, `holdMs` and
`playerMayPassIf` (`normaliseGate`, `systems/door-gates.js:75`). It reaches the client in room data
(`doors.js:561-567`; the bootstrap drops `doors`). With no `playerMayPassIf` the player may walk
through whenever the gate is open for an NPC. With one, a player within the radius while that
global is false shuts the gate (`_playerBarred`, `:410-418`), and after 5 s the guard is let
through anyway (`GUARD_PRIORITY_MS`), so the bar is soft. The lab's records door uses
`playerMayPassIf: "courier_ready"` (`scenarios/lab_physical_pentest/scenario.json.erb:799`).

**Social engineering blocks.** They live under the top-level `social` key and ship in the
bootstrap as authored, apart from capture secrets (`game.rb:895`):

- `social.characters.<id>`: `influence` and `thresholds`, each threshold `{ id, at, effects }`
  with ids `wary`, `refuses`, `reports`. A threshold with no numeric `at` is dropped by the client
  (`systems/social-influence.js:190-191`) and the schema requires `at`
  (`scenario-schema.json:753`). A character names its NPCs in `channels` (`person`, `phone`,
  `email`).
- `social.pretextNpcs[]`: `character`, `tuning.maxRefusals` (default 2), `unverifiableCost`
  (default -10), `susceptibility` (a delta per technique), and asks with `verification`
  (`systems/pretext-judge.js:53-60, 205, 354-421`).
- `social.phishTargets[]`: `character`, `requiredFactors`, `advisoryFactors`, `primedFor.trusts`
  (`["*"]` trusts any sender) and `runsExecutable` (absent means never)
  (`systems/phish-rules.js:36-39, 190-196, 247-248, 366-376`).

In every scenario that has these blocks today the targets are phone or email characters with no
room NPC (`lab_social_engineering`: `pierce` and `lord` by email, `dev` by phone). `role` and
`creds` are allowed on room NPCs only, because other NPC records reach the browser unfiltered, and
the same holds for `awareness` and `habits`. So no scenario today could use an awareness default
for a social engineering block. Section 5.6 specifies it; decision D1 asks whether to build it now.

**The lab's hand-set habits.** In `scenarios/lab_physical_pentest/scenario.json.erb`:

| Who | Where | Hand-set today |
|---|---|---|
| Chris Hampshire (`hampshire`, `:817`) | `staff_pc` (`:1068`), a plain workstation | `"locksScreenOnLeave": true` (`:1077`). His keylogger capture needs a lock on every leave (`workstation_owner_returned:staff_pc` with `data.wasLocked`, `:842-843`), guarded by `test/models/break_escape/lab_physical_pentest_secrets_test.rb:52-58` |
| Melanie Pierce (`pierce`, `:1025`) | `staff_pc_2` (`:1155`), a sign-in PC | `"locksScreenOnLeave": false` (`:1165`); `"access": { "people": ["pierce"] }` (`:1172`), with a comment that this is the lab's choice so no captured password opens it |
| Sofia Lord (`lord`, `:865`) | `usb_target_pc` (`:1128`), not a workstation | None for screens. She plugs in found devices through `interests` (`:878-883`), which is not a habit in this slice |
| Len (`len`, `:939`) | the records gate (`:799`) | `playerMayPassIf` on the gate and `los.challengeOnSight` (`:972-978`): both explicit, both tuned over five review rounds |

All three staff hold accounts (`creds`, `:827, :875, :1035`).

**The user's newest decision (2026-11-10).** In the lab, signing in to desktops with captured
credentials is in scope
(`docs/achitechture/physical_pentest_followup/USER_FEEDBACK_2026-11-10.md`, "Scope"). The lab's
texts still say "sign in nowhere with it", and a feedback pass on the lab will rewrite them. Section
12 says what this slice does in the lab and how it fits with that pass.

**A naming hazard.** "Awareness" is already the name of the security awareness course in this
codebase (`social.awareness`, `awarenessEpisode`, `scripts/validate_social/awareness.rb`,
`window.breakEscapeConfig.awareness`). The NPC field keeps the name the user chose, `awareness`,
because it sits on an NPC record and nothing else does. All new code is named for **habits**
(`NpcHabits`, `check_npc_habits`, `npc_habits_*` tests), so a search for the course never lands in
this slice and the reverse.

## 3. Decisions carried in

From the parent plan (user, 2026-11-09 and 2026-11-10), unchanged:

| Area | Decision |
|---|---|
| Awareness | A preset (`low`, `medium`, `high`) plus per-habit overrides. It expands into the existing blocks and fields rather than running alongside them. |
| Habits | Locks screen, password strength (guessable from public posts), sticky note, password reuse, holds doors, falls for phishing or pretext calls, challenges strangers. |
| Determinism | Seeded rolls (`NPCNeedsSystem.roll`). No puzzle-critical opening may rest on a roll alone. |
| Secrecy | Anything the player should have to discover must not reach the browser early. |
| Chaining | Nothing in the engine limits what a captured credential may be used for. |
| The lab | Signing in to desktops with captured credentials is in scope (2026-11-10). |
| Simplicity | A simple, clean design: no configuration nobody uses. |

Planner decisions in this plan (the user can overrule any; the ones that change play are repeated
in section 16):

| Area | Decision | Why |
|---|---|---|
| Where the expansion runs | On the server, once, in the loader, written into the saved scenario data. | The client never sees a habit, the server's own checks (the claim check) read the same filled fields, and a game keeps the habits it started with. |
| One library | `lib/break_escape/npc_habits.rb`, plain Ruby, used by the server, the validator and the dungeon graph. | One set of presets and one expansion. No mirror to drift. |
| Explicit wins | A field the author wrote on the PC, the gate or the social block is never changed by a habit. | The rule every habit shares, so authors learn it once. |
| The sticky note is served on demand | A `writesDown` note is in the `GET /login_accounts` answer, not in room data. | The password leaves the server when the sign-in screen opens, not when the room loads, and a habit that changes mid-game (slice 9.2) shows at the next open with no reload. |
| The password habit is checked, not run | `password` has no runtime effect. The validator checks that the scenario backs the claim. | The puzzle is the player typing a password they worked out. That needs clues in the world, not an engine feature. |
| No stats on screen | The player never sees an awareness level or a habit name. | They learn the habit by watching the padlock, the door and the desk. |

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
  "habits": { "writesDown": false, "password": "guessable" }   // overrides, any subset
}
```

- **Where.** `awareness` and `habits` are allowed only on room NPCs (`rooms.<id>.npcs[]`), like
  `role` and `creds`. The validator errors on them on any other NPC record.
- **Awareness** is optional. An NPC with no `awareness` gets no preset: only the habits written in
  `habits` exist for it, and every other habit is absent and does nothing. So a scenario that uses
  neither field is untouched.
- **Habits** override the preset one by one. An unknown habit name or a value outside the table is
  a validator error; the loader ignores it.

### 4.1 The habits

| Habit | Values | What it gives the player | Expands into |
|---|---|---|---|
| `locksScreen` | `never`, `sometimes`, `always` | An unlocked session at the owner's desk while they are away | `lockChance` 0, 0.5 or 1 on each workstation the NPC owns (5.2) |
| `writesDown` | `true`, `false` | The account's password, read off a sticky note on the sign-in screen | The note in the `GET /login_accounts` answer for each sign-in PC the NPC owns (5.3) |
| `password` | `strong`, `guessable`, `reused` | The password, worked out from clues or carried over from another system | Nothing at run time. The validator checks the scenario backs it (7.2) |
| `holdsDoors` | `true`, `false` | A walk through a gate door behind the NPC | `gate.noHold` on gate doors that open for the NPC (5.4) |
| `phishable` | `low`, `medium`, `high` | An easier or harder phish | Defaults in the NPC's `social.phishTargets` entry (5.6) |
| `pretextable` | `low`, `medium`, `high` | An easier or harder pretext call or conversation | Defaults in the NPC's `social.pretextNpcs` entry (5.6) |
| `challengesStrangers` | `true`, `false` | How soon the NPC turns wary, refuses and reports | Default `at` values for the NPC's `social.characters` thresholds (5.6) |

The chain each one feeds:

- `locksScreen: never` gives a claimed session, so the owner's desktop and profiles, so whatever
  card, code or password those hold.
- `writesDown` gives a password, which signs in at every PC whose access list admits that account,
  for the whole game, not only while the owner is away.
- `password: guessable` gives the same from a clue in the world (a photo, a post, a calendar), and
  `reused` from another lock or a captured sign-in that holds the same password.
- `holdsDoors` gives a room, and whatever identity or object is in it.

### 4.2 Presets

| Habit | `low` | `medium` | `high` |
|---|---|---|---|
| `locksScreen` | `never` | `sometimes` | `always` |
| `writesDown` | `true` | `false` | `false` |
| `password` | `guessable` | `reused` | `strong` |
| `holdsDoors` | `true` | `true` | `false` |
| `phishable` | `high` | `medium` | `low` |
| `pretextable` | `high` | `medium` | `low` |
| `challengesStrangers` | `false` | `false` | `true` |

These are the parent plan's proposed values, kept. They are constants in one place
(`NpcHabits::PRESETS`) and are tuned once a scenario has used them (decision D5).

A character is more interesting when one habit breaks the pattern: the careful manager who locks
every time and keeps the password on a note under the monitor
(`"awareness": "high", "habits": { "writesDown": true }`), or the careless intern whose PC is under
a policy that locks it for them. The feature scenario (section 11) is built from such pairs, and
`README_scenario_design.md` will say so.

### 4.3 Fields the loader writes

Authors do not write these; the loader does, into the saved scenario data. An author who does write
one has made it explicit, and it wins.

| Field | On | Written when |
|---|---|---|
| `habits` (all seven keys) | The NPC | The NPC has `awareness`. With `habits` alone, the object is left as written |
| `lockChance` | An owned workstation | 5.2 |
| `noHold` | A door's `gate` | 5.4 |
| Social block defaults | `social.*` | 5.6 |

## 5. Engine and server changes

### 5.1 The library: `lib/break_escape/npc_habits.rb`

A new module, `BreakEscape::NpcHabits`, plain Ruby with no Rails, required by the engine (the way
`declared_grants.rb` is), by `scripts/validate_scenario.rb` and by
`scripts/generate_dungeon_graph.rb`. It uses `BreakEscape::AccessIdentities` for the rules that
already exist there (`room_npcs`, `room_objects`, `owner_id`, `login_pc?`, `workstation?`,
`account?`).

| Function | Returns |
|---|---|
| `LEVELS`, `HABITS`, `PRESETS` | The three levels; each habit's allowed values; the table in 4.2 |
| `level_of(npc, scenario)` | The NPC's `awareness` if it is one of the levels, else nil. This is the one place a default level would come from (section 14) |
| `expanded(npc, scenario)` | The NPC's habits after the preset and the overrides: all seven keys with a level, only the valid authored keys without one, nil when the NPC has neither field. Invalid names and values are dropped |
| `sources(npc, scenario)` | For each expanded habit, `:explicit` or `:preset`. Read from authored data, so the validator can tell them apart |
| `lock_chance(value)` | `never` 0, `sometimes` 0.5, `always` 1 |
| `expand!(scenario)` | Runs the whole expansion on the scenario hash in place (5.2, 5.4, then `NpcHabits::Social.expand!`, 5.6) and returns a report: one entry per thing it filled or left alone, with the reason. Idempotent |

`expand!` is idempotent because every fill is "only when the author left it out": on a second run
the NPC's `habits` already holds all seven keys (so they read as explicit and give the same
values), each PC already has its `lockChance`, and each gate its `noHold`.

### 5.2 The loader, and `locksScreen`

`prepare_scenario_data!` (`game.rb:799`) becomes: `normalise_access_model!`, then
`BreakEscape::NpcHabits.expand!(scenario_data)`, then `stamp_scenario_object_ids!`. The expansion
comes after the access model normaliser (it needs `creds`) and needs only authored ids (an owner is
found through `screenOwner` or `needsHome`, both of which name an authored id).

For each room NPC with an expanded `locksScreen`, and each object it owns
(`AccessIdentities.owner_id`):

- the object must be a workstation by its own fields: `workstation: true` or `lockType: "login"`;
- it must set neither `lockChance` nor `locksScreenOnLeave`;
- then `lockChance` is set to 0, 0.5 or 1.

An object that fails the first test is left alone and stays not a workstation. This matters:
`isWorkstation` treats any object with a `lockChance` as a workstation, so filling one onto, say,
Sofia's `usb_target_pc` in the lab would change what a click on it does. An object that fails the
second test keeps the author's field, and the report says the habit was not applied there.

Everything downstream is unchanged and already built: the leave roll and its seeded sequence, the
policy's `autoLockMin` beating the habit, the padlock art and sounds, the claim, the server's claim
check 6 (`pc_always_locks?` reads the filled `lockChance`), and the validator's warning about a
session that rests on a roll, which now also fires for `sometimes`.

**New server helper.** `Game#npc_habit(npc, name)` returns `npc['habits'][name]` from the saved,
expanded scenario data, or nil. Every server read of a habit goes through it, so slice 9.2 has one
place to lay a mid-game change over (section 14).

### 5.3 `writesDown`: the sticky note

**Server.** `Game#login_postit_for(pc)` returns the note for a sign-in PC, or nil. It returns the
owner's `creds.password` when all of these hold: the PC has an owner (`login_pc_owner`,
`game.rb:1397`); the owner has an account; `npc_habit(owner, 'writesDown')` is true; and the PC
object authors no `postitNote` of its own (an authored note is a deliberate clue, ships in room data
as today and wins). The note is the bare password, as a sticky note on a monitor is.

`GET /login_accounts` (`games_controller.rb:1106`) adds `postitNote` to its answer when
`login_postit_for` returns one. Its existing checks stand: the PC exists and is reachable (its room
is unlocked or was never locked), else 404 or 403. Nothing else serves the note. Room data, the
bootstrap, `container` and a door unlock's answer never hold it.

**Client.** `openLoginSignIn` (`unlock-system.js:268`) takes the note from the answer:
`answer.postitNote` when it is a non-empty string, else the object's own `postitNote`, else none.
It does not write the answer's note onto the object's data, so each open asks again. If the request
fails, the screen opens with the authored note or none, as today. `showPostit` follows the note as
it does now. `pcSessions.screenShown` gains a fourth argument, and `pc_signin_shown` gains
`hasPostit` (true when the screen shows any note), so a scenario can credit "found the note" from
an event mapping (`data.hasPostit === true`).

The note shows wherever the sign-in screen does: on a locked screen while the owner is away, and
behind **Switch user** on a desktop. It does not show while the owner sits at the PC (the click
stops at "<name> is using this PC"), and a PC whose owner never locks goes straight to the claimed
desktop, so its note is found only through **Switch user**. That is true to life and is why the
feature scenario pairs `writesDown` with a screen that locks.

**What it proves.** The server cannot see where the player stands, so the reach check is the room,
the same strength as room data. A modified client can ask for the note of any sign-in PC in a room
it has opened. A puzzle that must not be passable early keeps the PC behind a door the server
checks.

### 5.4 `holdsDoors`: gates

**Loader.** For each `rooms.<id>.doors[]` entry with a `gate` that has no `playerMayPassIf` and no
authored `noHold`: `noHold` is the list of its `openFor` NPC ids whose expanded `holdsDoors` is
`false`. It is written only when the list is not empty.

**Client** (`systems/door-gates.js`). `normaliseGate` keeps `noHold` (a list of strings, default
empty). One new helper, `_nearGuards(g)`, returns the ids of the `openFor` NPCs within the radius
(`_npcNear` is then "any"). `_playerBarred(g)` becomes:

- the gate has `playerMayPassIf`: today's rule, unchanged (so the lab's records door and
  `test_gate_tailgate` are untouched);
- else the gate has a non-empty `noHold`: the player is barred when they are within the radius and
  every near guard is in `noHold` (with no guard near, not barred: the gate is shut anyway);
- else not barred, as today.

`openToPlayer(g)` (`door-gates.js:335-340`), which `clickOutcome` asks before it answers `pass`,
uses the same test, so a click and a walk agree. Everything else stands: the gate never shuts on a player in the doorway,
and after `GUARD_PRIORITY_MS` a barred player's guard is let through. So `holdsDoors: false` is a
soft bar, as `playerMayPassIf` is, and a scenario that credits an entry credits it on its own
condition (`README_scenario_design.md`, "Gate doors"). With two guards at one gate, one who holds
is enough.

`holdsDoors: true` needs no code: a gate with no bar is what the engine does today.

### 5.5 `password`

No engine change. The puzzle is played with what exists: clues in objects and posts, the sign-in
screen's **Other user** and tiles, and the server's count of failed sign-ins. The validator checks
(7.2) are the whole of this habit. One rule follows from the first slice: a PC under a policy with
`maxAttempts` locks a username out for the rest of the game, so the validator warns when an account
whose password is `guessable` can sign in only at such PCs.

### 5.6 `phishable`, `pretextable`, `challengesStrangers`: social engineering defaults

Build of this section is decision D1 (the recommendation is to specify it here and build it when
the first scenario has a room NPC who is also a social engineering target). The schema and the
validator accept the three habits from step 1 either way, and the habits report says "no effect:
no social block for this NPC" until then.

**The link.** A room NPC `n` belongs to social character `c` when `social.characters` has a key
`c` equal to `n.id`, or an entry whose `channels.person` is `n.id`. A phish target belongs to `c`
when its `character` is `c` (or, with no `character`, its `id` is). A pretext entry belongs to `c`
when its `character` is `c`. A character with no room NPC gets nothing, and stays as authored.

**The fills**, each only where the author left the field out, in a new file
`lib/break_escape/npc_habits_social.rb` (`NpcHabits::Social.expand!`):

| Habit | Field | `low` | `medium` | `high` |
|---|---|---|---|---|
| `phishable` | `requiredFactors` and `advisoryFactors`, only when the target has neither of them nor `factors` | required `senderTrust`, `senderAuth`, `addressedTo`, `pretextRelevant`; advisory `urgencyCalibrated` | required `senderTrust`, `addressedTo`, `pretextRelevant`; advisory `senderAuth`, `urgencyCalibrated` | required `senderTrust`, `pretextRelevant`; advisory `addressedTo`, `senderAuth`, `urgencyCalibrated` |
| `phishable` | `runsExecutable`, only when the key is absent (`false` is an authored "never") | not written | `{ "minUrgency": "high" }` | `{ "minUrgency": "medium" }` |
| `phishable` | `primedFor.trusts`, only when absent | not written | not written | `["*"]` |
| `pretextable` | `tuning.maxRefusals` | 1 | 2 | 3 |
| `pretextable` | `unverifiableCost` | -20 | -10 | -5 |
| `pretextable` | `susceptibility.<technique>` for each technique named in the entry's `lines` and not already keyed, `candour` left out | -15 | 0 | 10 |

| Habit | Field | `true` | `false` |
|---|---|---|---|
| `challengesStrangers` | `at` on a `wary`, `refuses` or `reports` threshold that has none | -20, -35, -50 | -40, -60, -80 |

For the threshold fill the schema's threshold stops requiring `at`, and the social validator
(`scripts/validate_social/`) errors on a threshold with no `at` unless its character has a room NPC
with an expanded `challengesStrangers`. Attachment and link factors are never defaulted, because
they depend on what the scenario's mail kit offers.

A careful NPC should also check what callers tell them. The loader cannot invent verification
facts, so the validator warns when a `pretextable: low` NPC's pretext entry has an ask with no
`verification`.

The physical side of `challengesStrangers` (an NPC stopping an unbadged player) exists as
`los.challengeOnSight`, which needs a scenario-written event mapping and conversation. No default
is generated for it. The validator suggests it when an NPC with `challengesStrangers: true` has
neither a social character nor a `challengeOnSight`.

## 6. What reaches the browser, and what never does

| Thing | Reaches the browser? | How it is kept |
|---|---|---|
| `awareness`, `habits` on an NPC | Never | `withhold_npc_secrets!` already deletes both from every room NPC, and the validator allows them on room NPCs only. Step 1 adds the tests that hold this |
| The preset tables | Never | They are in the Ruby library. No JavaScript holds them |
| A filled `lockChance` | Yes, in room data, on the PC | The seeded roll runs in the browser, so it has to. It is the same exposure as an authored `lockChance` today. It tells a player who reads network traffic that an owner is careless, not what their password is. Accepted |
| A `writesDown` note (the password) | Only in a `GET /login_accounts` answer for that owner's own reachable sign-in PC | 5.3. Never in room data, the bootstrap, `container` or an unlock answer |
| `gate.noHold` | Yes, in room data, on the door | It names NPC ids. Not secret |
| Social block defaults | Yes, in the bootstrap, as the authored values beside them do today | No new exposure |
| The `password` habit and the validator's clue report | Never | Authoring time only. The report names where a clue is, never the password or a word from it |
| `pc_signin_shown.hasPostit` | Yes, a boolean | It says a note is on screen, which the player can see |

The first slice's no-password test keeps its fixture free of `writesDown`. This slice adds a
second test for a fixture with it (step 2): the password appears in the `/login_accounts` answer
for the owner's PC and in no other response.

The playtest leak scanner (`tools/playtest/lib/access_leak_scanner.rb`) learns one exception and
one new finding (step 6): a password in a `/login_accounts` answer is allowed for a PC whose owner
has `writesDown` in the game's saved scenario, and any response that holds an NPC record with a
`creds`, `role`, `awareness`, `habits` or `workarounds` key is reported.

## 7. Validator, schema and dungeon graph

### 7.1 Schema (`scripts/scenario-schema.json`)

All of the slice's schema edits are made in step 1, so no later stream touches the file.

- NPC definition, beside `creds`: `awareness` (enum of the three levels) and `habits` (an object
  with the seven keys and their enums, `additionalProperties: false`, `_comment` allowed).
- Door `gate`: `noHold`, an array of NPC ids, described as written by the loader.
- `social.characters.*.thresholds[]`: `at` is no longer required (5.6). The social validator keeps
  the check.

### 7.2 Validator (`scripts/validate_scenario.rb`)

A new function, `check_npc_habits(json_data, repo_root, scenario_dir)`, called beside
`check_access_model`, and two small changes to existing code: `awareness` and `habits` join
`known_npc_fields` (`:414-422`), and `check_access_model` runs its workstation checks
(`:6080-6095`) on a copy of the scenario that `NpcHabits.expand!` has filled, so the roll warning
and the "owner never leaves" warning read the effective `lockChance`.

Errors:

- `awareness` or `habits` on an NPC record that is not a room NPC;
- an `awareness` that is not one of the three levels; an unknown habit; a habit value outside its
  list.

Warnings:

- an explicit `locksScreen` on an NPC who owns no workstation, or whose every workstation sets its
  own lock field (the habit does nothing);
- an explicit `writesDown: true` on an NPC with no account, or who owns no sign-in PC, or whose
  every owned sign-in PC authors its own `postitNote`;
- an explicit `password` on an NPC with no account;
- an explicit `password: "guessable"` with no clue (below);
- an explicit `password: "reused"` when no other secret in the scenario equals the password;
- an explicit `password: "strong"` when the password is reused, or a word from it is in readable
  text;
- an account whose password is `guessable` (explicit or preset) and which can sign in only at PCs
  under a policy with `maxAttempts`;
- an explicit `holdsDoors: false` on an NPC that no gate opens for, or whose every gate has
  `playerMayPassIf` or an authored `noHold`;
- an authored `gate.noHold` naming an id that is not in that gate's `openFor`;
- (with 5.6) a `pretextable: low` NPC whose pretext entry has an ask with no `verification`.

Suggestions (the validator's lowest level), for a habit that came from the preset and is not
backed, so a one-word `awareness` does not bury the author in warnings:

- a preset `guessable` with no clue; a preset `reused` with nothing sharing the password; a preset
  `strong` with a clue;
- `challengesStrangers: true` with no social character and no `los.challengeOnSight`;
- `phishable` or `pretextable` on an NPC with no social block (only while 5.6 is unbuilt or the
  NPC has none).

**The clue check for `guessable`.** The password is split into word tokens (runs of four or more
letters, compared without case). A clue exists when a token appears in text the player can read
somewhere other than the password's own home: an object's `name`, `text`, `observations`,
`postitNote` and their variants, `social.intelFacts` values and labels, landing page profile
posts, seeded mail, and the strings of the scenario's compiled ink. The list of sources is one
function (`NpcHabits::Clues.readable_texts(scenario, scenario_dir)`), so slice 9.2 adds NPC `feed`
posts to it. The message names where the clue was found (a path), never the token. The password
written out in full in an authored note also counts, and is reported as "written in full at
<path>" so the author sees every place a password is spelled out. (The first slice's error for a
whole password in compiled ink stands.)

**The reuse check for `reused`.** The password equals another secret in the scenario: the
`requires` of a `lockType: "password"` door or object, a `social.landingPages[].capture.secret`,
another account's `creds.password`, or a capture secret on an NPC with no account. One function
(`NpcHabits::Clues.secret_homes`), so slice 9.3 can add a Wi-Fi key.

**The habits report.** When any NPC has `awareness` or `habits`, the validator prints one block,
from `NpcHabits.expand!`'s report: each such NPC with its level, its seven habits marked preset or
explicit, and under each habit what it did ("`staff_pc`: lockChance 1", "`staff_pc_2`: the PC sets
locksScreenOnLeave, habit not applied", "sticky note at `omar_pc`", "clue at
rooms/mei_room/objects/photo_frame", "no effect: owns no workstation"). No line holds a password.

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
- `password: reused`: an edge from each lock or capture that shares the password to the account's
  node, labelled "same password";
- `password: guessable`: an edge from each object that holds a clue to the account's node,
  labelled "clue".

A gate with `noHold` gets no new node; its label lists who holds it and who does not.

## 8. Saved games

- **A game keeps the habits it started with.** The expansion is written into `scenario_data` when
  the game is created and is never run again for that game. Editing a scenario's habits changes new
  games only.
- **Games created before this slice** hold no `awareness` (no scenario has one), so nothing in them
  changes. `npc_habit` returns nil for them and `login_postit_for` returns nil.
- **`lab_physical_pentest` games created before the lab step** keep their saved hand-set fields
  (`locksScreenOnLeave` on both PCs) and play as they did. The lab is not shipped.
- **No new `player_state` key.** A sticky note is not recorded as seen; the screen asks each time.
  A reset needs nothing new.
- **A reload** changes nothing about habits: the workstation state resets with every owner at the
  desk, as today, and the seeded lock sequence starts again from the first leave, so a `sometimes`
  screen plays the same after a reload as from a fresh start.
- **Once-only mappings** are unaffected: no event name changes. `pc_signin_shown` gains a field.

## 9. Determinism

`sometimes` is the only chance in this slice, and it is the first slice's seeded roll
(`roll(ownerId, "screen:<pcId>:<leaveCount>")`). The validator already warns about an owned sign-in
PC whose session rests on a roll, and from this slice that includes a `sometimes` habit, with the
habit named in the message. The preset `medium` gives `sometimes`, so a `medium` NPC with a sign-in
PC always draws the warning: the author then gives the player another route (a note, a clue, a
captured sign-in) or sets `locksScreen` explicitly.

## 10. Build steps

Each step is testable before the next, and its tests are part of the step. Step 1 is done first by
one builder; after it the streams in section 15 run side by side. A step is done when its own
tests, the node suite (`bin/test-js`), the Rails suite (`bin/rails test`), the first slice's
no-password test and every scripted run built so far pass.

### How the slice is tested

The first slice's five layers, cut to what this slice needs:

1. **Unit tests in every step**: Ruby tests of the library with no Rails (`test/unit`), server
   tests through `create_access_game` (`test/models`, `test/controllers`), client tests on the node
   runner (`test/js`), validator and dungeon graph tests in the pattern of
   `validator-access-model.test.mjs` and `dungeon-graph-identities.test.mjs`.
2. **One feature scenario**, `test_access_habits` (section 11), designed for testing, not play.
3. **A scripted run of it** through the `window.__test` bridge on the keyless server on :3001, by
   the scripted regression tester tier in AGENTS.md ("Choosing a model"), one numbered step per
   beat, with the two checks after every beat that the first slice built: what the server recorded
   (`verify-run.rb --access`) and what reached the browser (`access-leak-check.rb`). It joins the
   access model's regression suite beside the runs of `test_access_doors`, `test_access_signin`
   and `test_access_sessions`.
4. **The existing suite runs again** wherever a step changes code they cover: the
   `test_access_signin` run after step 2 (the sign-in screen), and a gate check in
   `test_gate_tailgate` and the lab after step 5 (gates).
5. **`lab_physical_pentest` last** (section 12), with a scripted run and a persona run by a
   tester who does not know the answers.

Never touch the server on :3000. A "stuck" from the scripted tester counts as a bug only once a
persona-tier run of the same beat confirms it.

### Step 1. Foundation: schema, library, loader, withholding

One builder. Everything else waits for it.

Files:
- `lib/break_escape/npc_habits.rb` (new): 5.1, with the `locksScreen` fill (5.2) and the gate fill
  (5.4). `lib/break_escape/npc_habits_social.rb` (new): `NpcHabits::Social.expand!` as a function
  that does nothing yet, so step 7 fills in one file nobody else edits.
- The engine's requires, wherever `declared_grants.rb` is loaded, so `BreakEscape::NpcHabits` is
  available to `Game`.
- `app/models/break_escape/game.rb`: the call in `prepare_scenario_data!`; `npc_habit(npc, name)`.
- `scripts/scenario-schema.json`: every edit in 7.1.
- `scripts/validate_scenario.rb`: `awareness` and `habits` in `known_npc_fields` only (the checks
  are step 3).

Tests:
- `test/unit/npc_habits_test.rb` (new, no Rails): each preset gives the table in 4.2; an override
  replaces one habit and leaves the rest; `habits` with no `awareness` gives only those keys; an
  unknown level, habit or value is dropped; `sources` marks each habit explicit or preset.
  The `locksScreen` fill: 0, 0.5 and 1 on a `workstation: true` object and on a
  `lockType: "login"` object; ownership through `screenOwner` and through `needsHome`; an NPC who
  owns two PCs fills both; an authored `lockChance` and an authored `locksScreenOnLeave` are each
  left alone and reported; an owned object that is not a workstation gets no field. The gate fill:
  `noHold` lists the `openFor` NPCs with `holdsDoors: false`; a gate with `playerMayPassIf` or an
  authored `noHold` is left alone; a gate whose guards all hold gets no `noHold`. A second
  `expand!` changes nothing (compare the whole hash).
- `test/models/break_escape/npc_habits_loader_test.rb` (new): a game from `create_access_game`
  holds the expanded habits and the filled `lockChance`; a second `prepare_scenario_data!` changes
  nothing; a game made with `Game.create!` and hand-set `scenario_data` is untouched; a claim at
  the PC of a `never` owner is granted and at the PC of an `always` owner refused
  (`claim_login_session!`, check 6), with no lock field authored on either PC.
- `test/models/break_escape/access_model_withholding_test.rb` (extended): for a fixture whose NPCs
  have `awareness` and `habits`, neither key is in `filtered_room_data`, in a door unlock's room
  data, in `update_room`'s added NPCs or in the bootstrap; the PC carries the filled `lockChance`.
- A one-off check, recorded in the build log and not kept as a test (AGENTS.md: no test compares
  live content): render every scenario under `scenarios/`, run `NpcHabits.expand!` on each and
  confirm the output equals the input for all of them, because none has `awareness` or `habits`.

### Step 2. The sticky note

Files:
- `app/models/break_escape/game.rb`: `login_postit_for(pc)`.
- `app/controllers/break_escape/games_controller.rb`: `login_accounts` adds `postitNote`.
- `public/break_escape/js/systems/unlock-system.js`: `openLoginSignIn` (5.3).
- `public/break_escape/js/systems/pc-sessions.js`: `screenShown` takes `hasPostit` and puts it on
  `pc_signin_shown`.
- `public/break_escape/js/api-client.js`: the comment on `loginAccounts` names the new key.

Tests:
- `test/controllers/break_escape/npc_habits_postit_test.rb` (new). Fixture: Omar (`writesDown`,
  owns `omar_pc`, may also sign in at `hot_desk`), Ian (no `writesDown`), a PC with an authored
  `postitNote`, an owner with no account, and `omar_pc` behind a locked door in a second variant.
  - `/login_accounts` for `omar_pc` carries Omar's password as `postitNote`; for `hot_desk` and for
    Ian's PC it carries no `postitNote`; for the PC with an authored note it carries none (the room
    data still holds the authored one); for the owner with no account, none.
  - With `omar_pc`'s room locked, the route answers 403 and no password.
  - The no-password test, `writesDown` variant: `/scenario`, `/room/:id`, a door `/unlock`,
    `/container/:id` signed out, `/capture_secrets` and `/login_accounts` for every other PC hold
    Omar's password nowhere.
  - A game whose scenario data has no expanded habits (made with `Game.create!`) serves no note.
- `test/js/access-signin-postit.test.mjs` (new, running the real modules as
  `access-signin-requests.test.mjs` does): the screen is started with the answer's note and
  `showPostit` true; the note is not written onto the object's data, and a second open with an
  answer that has none shows none; with no answer note the authored one shows; a failed request
  opens with the authored note or none; `pc_signin_shown` carries `hasPostit` true and false.
- `pc-sessions.test.mjs`, `password-signin-mode.test.mjs` and `access-signin-routing.test.mjs`
  pass unchanged.
- The `test_access_signin` scripted runs again (its sign-in screens have authored notes and none,
  so they prove the fallbacks in a browser).

### Step 3. Validator

Files: `scripts/validate_scenario.rb` (`check_npc_habits`, its call, the expanded copy for the
workstation checks, the habits report); `lib/break_escape/npc_habits.rb` gains
`NpcHabits::Clues` (`readable_texts`, `secret_homes`, `tokens`).

Tests: `test/js/validator-npc-habits.test.mjs` (new): one fixture for each error and warning in
7.2 and each suggestion that does not need 5.6, and a clean fixture that raises none. Also: a
`sometimes` owner of a sign-in PC with no lock field draws the roll warning, with the habit named;
a `never` owner with no valid `needs` or `interests` draws the "owner never leaves" warning; the
habits report lists each NPC's seven habits with preset or explicit and its effect lines; no output
line of any fixture holds a password or a word token from one (the test greps for them).
`test/unit/npc_habits_test.rb` gains the `Clues` cases: tokens of four letters or more, without
case; a clue in an object's text, in a variant, in an intel fact and in compiled ink is found; the
password's own home is not a clue; each kind of secret home is found.

### Step 4. Dungeon graph

Files: `scripts/generate_dungeon_graph.rb`.

Tests: `test/js/dungeon-graph-habits.test.mjs` (new, beside `dungeon-graph-identities.test.mjs`):
a `writesDown` owner's PC has a "sticky note" edge to the account's node; a `never` owner's PC has
an "unlocked screen" edge from its room, a `sometimes` one says "(roll)", and an `always` one, a
PC under an `autoLockMin: 0` policy and an untracked owner's PC have none; a shared password draws
a "same password" edge from the other lock; a clue object draws a "clue" edge; a gate with
`noHold` names who holds it. `dungeon-graph-identities.test.mjs` passes unchanged.

### Step 5. Gates

Files: `public/break_escape/js/systems/door-gates.js` (5.4).

Tests: `test/js/door-gates-no-hold.test.mjs` (new, on the stub world `door-gates.test.mjs` uses):
`normaliseGate` keeps `noHold`; with one guard in `noHold` near and the player in the radius, the
gate shuts and stays shut, and `openToPlayer` is false; after `GUARD_PRIORITY_MS` it opens for the
guard and holds `GUARD_PASS_MS`; with a holding guard near as well, the player is not barred; with
no `noHold` the gate behaves as before; a gate with `playerMayPassIf` ignores `noHold`; the gate
never shuts on a player in the doorway. `door-gates.test.mjs` and
`door-gates-player-open.test.mjs` pass unchanged.

Browser check: one short scripted run of `test_gate_tailgate` as it stands, to show its gate is
unchanged (it has `playerMayPassIf`).

### Step 6. Playtest tooling

Files:
- `tools/playtest/lib/access_leak_scanner.rb`: the `/login_accounts` exception and the withheld-key
  finding (section 6). The exception reads the game's saved scenario: the PC in the request, its
  owner, the owner's expanded `writesDown`.
- `tools/playtest/verify-run.rb`: the `--access` section gains a `habits` block, one line per NPC
  with expanded habits (id and the seven values) and one per filled PC (`lockChance`) and gate
  (`noHold`). No passwords.
- `.claude/skills/playtest-scenario/SKILL.md`: one sentence in "Access model checks" on the sticky
  note exception. (Skills are edited only with the orchestrator's say-so; the builder hands the
  sentence over if not.)

Tests: `test/unit/access_leak_scanner_test.rb` (extended): a password in `/login_accounts` for a
`writesDown` owner's PC is allowed, for another PC is reported, and in room data is reported even
for a `writesDown` owner; an NPC record with a `habits` key in any response is reported by key and
NPC id; no output line holds a value. `test/js/playtest-verify-run-access.test.mjs` (extended): the
`habits` block prints for a game with expanded habits and is absent for one without.

### Step 7. Social engineering defaults (only if decision D1 says build)

Files: `lib/break_escape/npc_habits_social.rb` (5.6); `scripts/validate_social/habits.rb` (new)
and its one require line in `scripts/validate_social.rb` (the threshold `at` rule, the
`verification` warning, and lifting the "no social block" suggestion for linked NPCs).

Tests: `test/unit/npc_habits_social_test.rb` (new): the link through the character key and
through `channels.person`; each fill for each level; each fill skipped when the author wrote the
field (`runsExecutable: false` included); a character with no room NPC is untouched; idempotent.
`test/js/validator-npc-habits-social.test.mjs` (new): a threshold with no `at` errors without a
linked `challengesStrangers` NPC and passes with one; the `verification` warning. A node test that
feeds a filled pretext entry to `pretext-judge.js` and a filled target to `phish-rules.js` and
shows the defaults are read (three refusals before a report for `pretextable: high`; a `phishable:
high` target with no authored `trusts` passes `senderTrust` for any sender). The one-off "every
existing scenario expands to itself" check from step 1 is run again and recorded.

### Step 8. The feature scenario and its scripted runs

Section 11. Needs steps 1 to 3 and 6; beat H9 needs step 5.

### Step 9. `lab_physical_pentest`

Section 12. Needs step 8's runs passing.

### Step 10. Documents

- `README_scenario_design.md`: a section "NPC awareness and habits" after "Workstation screens":
  the two fields, the two tables, "explicit wins", the pairing advice in 4.2, where a sticky note
  is seen, the soft bar at a gate, and how to read the validator's habits report.
- `docs/achitechture/ACCESS_MODEL_PLAN.md` section 9.1: replaced by a pointer to this plan, by the
  orchestrator.
- `docs/achitechture/ACCESS_MODEL_SLICE_9_1_BUILD_LOG.md` (new): what was built when, deviations,
  review rounds, test totals and the one-off checks.
- `docs/test-bridge.md`: nothing new in the bridge; note that habits are not readable from the
  browser by design and that `verify-run.rb --access` prints them.

## 11. The feature scenario: `test_access_habits`

It follows the first slice's rules for feature scenarios: `scenarios/test_access_habits/` holds
`scenario.json.erb`, `mission.json` (`"collection": "test_scenarios"`, `"test_type":
"access_model"`, with a `test_objective`), ink under `ink/` and `PLAYTEST.md`. A `lobby` start room
with each beat in its own room, open from the start apart from the thing under test. At each beat a
sign (`notes1`, `readable`, not takeable, named "Sign: <beat>") says what to do and what should
happen; a sign never holds a password. `npcNeedsSeed: "test_access_habits"`, `npcWindupMs: 0`,
`needsDebugOverlay: true`. One task per beat, completed by an event mapping on the beat's own event.

Every PC is a sign-in PC with `"sprite": "pc_desktop"` (so the padlock shows) and **no lock field
of its own** unless the beat says so. Every desk owner has an account, starts at the desk, and has
one fast need (`decayPerMin: 30`, `urgentAt: 40`, `initial: 65`: urgent after about 50 seconds) with
a station in the beat's own room whose `useSeconds` is 900, so once gone they stay gone, except
Lena (H8), whose station takes 20 seconds so she leaves several times. One profile, `staff_desktop`
(`for: { roles: ["staff"] }`), with one file. One policy, `instant_lock` (`autoLockMin: 0`); no
`defaultPolicy`. Attacks are off.

| Beat | Room and set-up | What should happen | Server record afterwards |
|---|---|---|---|
| H1 Never locks | `dana_room`: Dana Reyes, `"awareness": "low"`, `dana_pc` | When she walks off, the screen keeps its desktop look and a click opens her desktop (a claim) | `sessions.dana_pc = { id: "dana", via: "claim" }`; habits block: Dana `locksScreen never`, `dana_pc` lockChance 0 |
| H2 Always locks | `ian_room`: Ian Shaw, `"awareness": "high"`, `ian_pc` | When he walks off, the padlock shows (`lockedLook` true) and the lock sound plays; a click opens the sign-in screen with no note; `workstation_locked_attempt:ian_pc` fires. There is no way in | No session; `ian_pc` lockChance 1 |
| H3 Careful, with a sticky note | `omar_room`: Omar Haddad, `"awareness": "high", "habits": { "writesDown": true }`, `omar_pc` | The padlock shows; the sign-in screen shows a sticky note; the password on it signs in; `pc_signin_shown` carried `hasPostit: true` | `sessions.omar_pc = { id: "omar", via: "password" }` |
| H4 The PC's own field wins | `priya_room`: Priya Nair, `"awareness": "low", "habits": { "writesDown": false }`, `priya_pc` with `"lockChance": 1` | Locked on every leave, no claim, no note | No session; `priya_pc` lockChance 1, and the habits block says the habit was not applied |
| H5 Policy beats habit | `kai_room`: Kai Brennan, as Priya, `kai_pc` under `instant_lock` with no lock field | Locked in the leave roll itself; a click opens the sign-in screen and offers no claim | No session; `kai_pc` lockChance 0 |
| H6 Guessable password | `mei_room`: Mei Lin, `"awareness": "high", "habits": { "password": "guessable" }`, `mei_pc`; a framed photo on her desk (readable: a pet's name and a year) and the sign gives the pattern, not the answer ("her password is the pet's name, then the year") | The password built from the photo signs in | `sessions.mei_pc` Mei by password; no `loginFailures` entry for her if the first try is right |
| H7 Reused password | `tom_room`: Tom Fletcher, `"awareness": "high", "habits": { "password": "reused" }`, `tom_pc`; his gym locker (`lockType: "password"`, the same password) and a note in the room with the locker's combination | The note opens the locker, and the same password signs in at `tom_pc` | Locker in `unlockedObjects`; `sessions.tom_pc` Tom by password |
| H8 Sometimes locks | `lena_room`: Lena Fox, `"awareness": "medium", "habits": { "writesDown": false }`, `lena_pc`; her station takes 20 s | On each of her first three leaves the screen is locked or open as `PLAYTEST.md` lists for this seed (the builder records the sequence once). An open leave gives a claim, a locked one the sign-in screen. After a reload the sequence starts again from the first entry | A claim at `lena_pc` on an open leave, gone when she returns; none after the reload until the next open leave |
| H9 Holds doors, and does not | `gate_hall`: two gate doors with no `playerMayPassIf`. Gary Whitlock (`"awareness": "low"`) walks a route through the one to `store_a`; Sara Quinn (`"awareness": "high"`) through the one to `store_b`. Neither has needs (a route and needs do not combine) | Parked a few steps to one side of Gary's door, the player walks in behind him and `room_entered:store_a` fires. At Sara's door the gate shuts as the player comes within its radius, and a click on it shows the refusal and fires `door_gate_denied` | `store_a` entered; habits block: Sara's gate `noHold: ["sara"]`, Gary's gate none |

Passwords have in-game sources of their own: Omar's is read from the sticky note, Mei's is built
from the photo, Tom's is read from the locker note. Dana's, Ian's, Priya's, Kai's and Lena's are
never typed.

**Expected validator output**, listed in `PLAYTEST.md`: no errors; the roll warning on `lena_pc`;
suggestions for the preset `guessable` with no clue (Dana, Priya, Kai) and the preset `reused` with
nothing sharing the password (Lena); the habits report for all ten NPCs. Mei's and Tom's explicit
habits are backed, so they draw no warning; the report shows Mei's clue at the photo and Tom's
password as shared with the locker and written in full at the locker note.

**Static checks.** Validator as expected, ink compiles, `python3 scripts/check_door_alignment.py`,
dungeon graph regenerated (and its new edges looked at once), node and Rails suites, both
no-password tests.

**Scripted runs** (two, each with a new game, 10 to 15 minutes each, `--capture-responses` on,
a private scratch folder `test_access_habits-regress/`):

- Run 1: H1 to H5, with a reload after H3. After the reload Omar's password session is kept,
  Dana's claim has ended, and the sticky note shows again when `omar_pc`'s sign-in screen is
  opened through **Switch user**.
- Run 2: H6 to H9, with the reload inside H8.

After every beat: the screen; `verify-run.rb <game_id> --access` against the record above; and
`access-leak-check.rb` over the responses so far, which must report nothing. In particular it must
find Omar's password only in `/login_accounts` answers for `omar_pc`, and no `habits` or
`awareness` key in any response. `window.__test.access.workstation(pcId)` gives `screenLocked` and
`lockedLook` for H1, H2, H4, H5 and H8, and `screenTransitions()` the sounds.

**Earned secrets.** The report carries the table. Omar's, Mei's and Tom's passwords are earned
from their in-game sources. H9 uses the lab's pattern for gates: park on a named tile off the
guard's line and wait on a global the scenario sets from `door_gate_opened`, because scripted
movement collides with NPCs in ways a person does not. Nothing in the runs needs the manual clock
or a knock-out.

**After the runs.** The three first-slice suite runs again, then the report is saved to
`tools/playtest/test_access_habits-report.md`.

## 12. `lab_physical_pentest`

The lab is the first scenario with hand-set habits (section 2). It adopts this slice in two parts.
Part A is a like-for-like swap that changes no play. Part B uses habits for what the user has just
put in scope, signing in with captured credentials, and waits on decision D4 and on the lab's
feedback pass.

**One editor at a time.** The feedback pass
(`docs/achitechture/physical_pentest_followup/USER_FEEDBACK_2026-11-10.md`) rewrites the same
scenario file: the scope texts, item placement, the disguise, and how often Chris leaves his desk.
This step runs after that pass or is done by the same builder. It never runs alongside it.

### Part A: the swap

In `scenarios/lab_physical_pentest/scenario.json.erb`:

| Who | Change | Result after the loader |
|---|---|---|
| Chris (`hampshire`) | Add `"awareness": "high"` and `"habits": { "password": "guessable" }`. Remove `"locksScreenOnLeave": true` from `staff_pc`; it keeps `"workstation": true` | `staff_pc` gets `lockChance: 1`: he locks on every leave, as now, so the keylogger capture on `workstation_owner_returned:staff_pc` with `wasLocked` fires as now |
| Melanie (`pierce`) | Add `"awareness": "low"` and `"habits": { "writesDown": false }`. Remove `"locksScreenOnLeave": false` from `staff_pc_2` | `staff_pc_2` gets `lockChance: 0`: she never locks, the claim is allowed, as now |
| Sofia (`lord`) | Nothing in part A | Her PC is not a workstation, so a screen habit would do nothing, and this plan sets no field that does nothing |
| Len (`len`) | Nothing | His gate has `playerMayPassIf` and he has `challengeOnSight`, both explicit, so a habit would do nothing |

Why Chris's `password: "guessable"` is explicit: the three staff passwords follow one pattern (the
company name, a symbol, a season or a default word, and a number). A password built that way is
guessable whatever its length, and the validator's clue check agrees, because the company name is
all over the scenario's text. Left to the `high` preset, Chris's would be called `strong` and draw
a suggestion; Melanie's is `guessable` from her preset already. Melanie's `writesDown` is switched off so her desk
stays one lesson (the unlocked screen): a note there could only be found behind **Switch user**.

The comments beside the removed fields move to the NPCs: the one that says Chris "locks on every
leave (staff_pc locksScreenOnLeave ...)" (`:836-840`) and the one on `staff_pc_2` that says she
"never locks her screen (locksScreenOnLeave: false)" (`:1174-1177`) are reworded to name the habit.

Tests and documents that name the old fields:

- `test/models/break_escape/lab_physical_pentest_secrets_test.rb:52-58`: the guard on Chris's
  capture now asserts, on the game's prepared scenario data, that Chris's expanded `locksScreen` is
  `always`, that `staff_pc` has `lockChance` exactly 1 and no `locksScreenOnLeave`, and keeps its
  comment naming the capture that depends on it. `:352-353` asserts `staff_pc_2` has `lockChance`
  0 and Melanie's `locksScreen` is `never`.
- `scenarios/lab_physical_pentest/PLAYTEST.md`: the expected validator output gains the habits
  report and whatever the clue check prints for the two NPCs; the beats do not change.
- `PHYSICAL_PENTEST_ACCESS_FOLLOWUP_PLAN.md` gets a dated note by the orchestrator that the two
  lock fields are now habits.

**Static checks.** Validator clean apart from the listed output, ink compiles, dungeon graph
regenerated, the lab's Rails tests, both no-password tests, `reopencheck`.

**Scripted run** (the regression tier, the lab's existing script): the keylogger beat and the
unlocked-screen beat play as before, with a reload during the claim. After each beat the two
checks. The run must show the padlock on `staff_pc` when Chris leaves and none on `staff_pc_2`
when Melanie does; the user's feedback says the lock screens and sounds were not showing in their
hands-on test, so if they do not show here that is a finding for the feedback pass, not a reason
to change this slice.

**Persona run** (a tester who does not know the answers, questions put only after play): did you
notice which of the two locked their screen, how, and what would you tell each of them? It reports
every "didn't know what to do" moment. What a model tester cannot judge (the sounds) goes to the
user.

### Part B: what habits add once signing in is in scope (decision D4)

The user's decision makes a captured password something to use, and habits give the lab a cheap
way to show three desks, three habits and three controls side by side:

| Desk | Habit | How the player gets in | The control |
|---|---|---|---|
| Chris | Locks every time, weak pattern password | A planted keylogger and a wait; then the captured password signs in | Check the cable run; a second factor |
| Melanie | Never locks | Sit down while she is away | Win+L, with an auto lock policy as the backstop |
| Sofia | Locks, but the password is on a sticky note | Read the note off her locked screen | No written passwords; a password manager |

What that takes in the scenario, for the feedback pass or this step to build once D4 is answered:

1. **Captured accounts sign in.** Remove `"access": { "people": ["pierce"] }` from `staff_pc_2`
   and its comment, so every staff account signs in there, and add an account profile for Chris
   (`accountProfiles.hampshire_desktop`, `for: { people: ["hampshire"] }`) beside Melanie's. Then
   the keylogger capture chains: Chris's password, read on the capture terminal, signs in as Chris
   at Melanie's PC while she is away (through **Switch user** on her open session), and his
   desktop holds the next thing. What each desktop holds is the feedback pass's content decision;
   chaining says it should be something that opens another part of the lab (the door PIN, the
   store room, the visitor book's expected names).
2. **Sofia's sticky note.** `usb_target_pc` becomes a sign-in PC (`"locked": true, "lockType":
   "login", "sprite": "pc_desktop"`, its `affordance.accepts` kept), Sofia gets `"awareness":
   "low"` and `"habits": { "locksScreen": "always" }` (so `writesDown` comes from the preset), an
   account profile, and a reason to leave her desk for long enough to be useful. Today she leaves
   only to fetch a dropped device. A mapping on `pc_signin_shown:usb_target_pc` with
   `data.hasPostit === true` sets a finding global and completes a new bonus task.
   **Probe first:** that a sign-in PC with `affordance.accepts` still takes Sofia's deliveries
   (`staff_pc_2` proves `satisfies` only), and that a leave to fetch an item emits
   `npc_left_post`. If the second fails, she needs a need of her own, tuned with the leave rates
   the feedback pass is already changing.
3. **Chris's own PC as a sign-in PC** is the larger change, because the keylogger plant sits on
   the PC object (`requiresItem`), and a sign-in PC answers a click before `requiresItem` is read.
   The plant moves to an object beside it (`README_scenario_design.md`, "Item plants"). Item 1
   gives the chain without it, so this is left to the feedback pass.

The texts that say "sign in nowhere with it" are the feedback pass's to rewrite. Part B adds no
text that says it.

## 13. Effects on other scenarios

- **No scenario has `awareness` or `habits` today**, so the loader fills nothing anywhere until a
  scenario adds one. Step 1's one-off check proves it for every scenario.
- **Authored fields mean what they meant.** `lockChance`, `locksScreenOnLeave`, `postitNote`,
  `gate.playerMayPassIf` and every social block field are read exactly as before. A habit only
  fills a field the author left out.
- **A workstation with neither lock field still locks on every leave** when its owner has no
  `locksScreen` habit (today's default). Give the owner an `awareness` and that PC follows the
  habit. This is the one place adding a single word to an NPC changes a PC the author did not
  touch, and the habits report lists every PC it happened to.
- **Gates** with `playerMayPassIf` (`lab_physical_pentest`, `test_gate_tailgate`) are untouched. A
  gate with none changes only when one of its guards has `holdsDoors: false`.
- **The sign-in screen** asks `/login_accounts` as it does now and reads one more key from the
  answer. A PC whose owner has no `writesDown` behaves as before.
- **`test_access_doors`, `test_access_signin`, `test_access_sessions`** have no habits and keep
  their explicit lock fields. Their scripted runs are rerun as the regression suite.
- **The schema change to thresholds** (`at` no longer required) is covered by the social
  validator, which keeps the error for every character without a linked NPC, that is, for every
  scenario that exists.
- **Missions m01 to m10, the SIS games and the awareness course scenarios**: no change. Nothing in
  them uses the needs system's workstations with an `awareness`.

## 14. Interfaces with other slices

The sketches in the parent plan's sections 9.2 and 9.3 are the interface. This section says what
this slice gives the other two, and where it needs the sketch changed.

**Changes to the 9.1 sketch itself** (so the other planners read the right version):

1. `writesDown` is served in the `GET /login_accounts` answer, not written into room data.
2. `locksScreen` fills every workstation the NPC owns, plain ones too, and an authored
   `locksScreenOnLeave` wins as well as an authored `lockChance`.
3. `password` is checked mechanically by the validator from the scenario's own texts and secrets.
4. `holdsDoors` becomes `gate.noHold`, a soft bar, and applies only to gates with no
   `playerMayPassIf`.
5. The social engineering defaults apply only to a room NPC linked to a social character.
6. No physical "asks for ID" beat is generated for `challengesStrangers`.

**What 9.2 can rely on, and what this slice asks of it:**

| 9.2 feature | Interface |
|---|---|
| `roles.<role>.awareness` (a default level by role) | `NpcHabits.level_of(npc, scenario)` is the one place a level comes from. 9.2 adds the lookup there: the NPC's own `awareness` first, then the first of its roles (in the order written) that has one in `roles`. 9.2 owns the `roles` key in the schema and the validator. The expansion still runs once, at game creation |
| Workaround `writes_down` ("turns on `writesDown` from now on") | Every server read goes through `Game#npc_habit(npc, name)`. 9.2 adds a `player_state` overlay there (for example `habitChanges[npcId]`) and a writer. Because the note is served by `/login_accounts`, it appears the next time the sign-in screen opens, with no room reload. Request: 9.2 does not write `postitNote` into room data |
| Workaround `borrow_session` ("leaves it unlocked when they go") | A filled `lockChance` is saved scenario data and is not changed mid-game. A one-off unlocked leave has to be a per-leave override inside `workstation-state.js`, and the server's claim check 6 (`pc_always_locks?`) will refuse a claim at a PC whose `lockChance` is 1, so 9.2 needs a server record of the workaround that the claim check also reads. This slice provides neither |
| Mid-game change of `locksScreen` | Not supported by this slice, for the same reason. If 9.2 wants it, it adds the override above |
| Workaround `prop_door` | Independent. `noHold` only reads gates with no `playerMayPassIf` |
| NPC `feed` posts and "a post's `intel` links public posts to password guessing" | `NpcHabits::Clues.readable_texts` is the list of places the `guessable` check looks. 9.2 adds `feed[].text` to it, and a feed post then backs a `guessable` password |
| "With `awareness: high` the validator warns if a post grants intel" | Reads `NpcHabits.level_of`. Suggested change to the sketch: key the warning on the level only when the author has not marked the post `deliberate`, as written, and print it in the habits report so all per-NPC output is in one block |
| Policy `usb` and "plugs in found devices" | Not a habit in this slice (section 17). Sofia's behaviour stays in `interests` |
| `workarounds` on an NPC | Already withheld from the browser (`WITHHELD_NPC_KEYS`) |

**What 9.3 can rely on:**

| 9.3 feature | Interface |
|---|---|
| A Wi-Fi key learnt from "a sticky note, a post, a pretext call" | The key is a property of the access point, not of a person, so no habit covers it. If a person's password is also the Wi-Fi key, `NpcHabits::Clues.secret_homes` is the list the `reused` check reads, and 9.3 adds `wifi_ap.psk` to it |
| `requiresReach` and network jacks | No interaction with habits |

**Shared files.** All three slices add to `app/models/break_escape/game.rb`,
`scripts/validate_scenario.rb` and `scripts/scenario-schema.json`. This slice keeps its footprint
in them to one call in `prepare_scenario_data!`, two small methods, one validator function with its
call, and one block of schema properties, with everything else in its own new files. The parent
plan's order stands (9.1, then 9.2, then 9.3); if they are built at once, each builder re-reads a
shared file just before editing it and edits only its own block.

## 15. Build streams

Step 1 first, alone. Then five streams that share no file, then the scenario, then the lab.

| Stream | Steps | Files it owns |
|---|---|---|
| F Foundation (first) | 1 | `lib/break_escape/npc_habits.rb`, `lib/break_escape/npc_habits_social.rb` (stub), the engine's require, `game.rb` (the loader call and `npc_habit`), `scripts/scenario-schema.json`, `known_npc_fields` in `validate_scenario.rb`, `test/unit/npc_habits_test.rb`, `test/models/break_escape/npc_habits_loader_test.rb`, `access_model_withholding_test.rb` |
| A Sticky note | 2 | `game.rb` (`login_postit_for` only), `games_controller.rb` (`login_accounts`), `unlock-system.js`, `pc-sessions.js`, `api-client.js`, `test/controllers/break_escape/npc_habits_postit_test.rb`, `test/js/access-signin-postit.test.mjs` |
| B Authoring tools | 3, 4 | `scripts/validate_scenario.rb`, `scripts/generate_dungeon_graph.rb`, the `Clues` part of `npc_habits.rb`, `test/unit/npc_habits_test.rb` (the `Clues` cases), `test/js/validator-npc-habits.test.mjs`, `test/js/dungeon-graph-habits.test.mjs` |
| C Social defaults (if D1 says build) | 7 | `lib/break_escape/npc_habits_social.rb`, `scripts/validate_social/habits.rb`, one line in `scripts/validate_social.rb`, its three test files |
| D Gates | 5 | `public/break_escape/js/systems/door-gates.js`, `test/js/door-gates-no-hold.test.mjs` |
| E Playtest tooling | 6 | `tools/playtest/lib/access_leak_scanner.rb`, `tools/playtest/verify-run.rb`, their two test files |
| S Scenario (after A, B, D, E) | 8 | `scenarios/test_access_habits/`, `tools/playtest/test_access_habits-report.md` |
| L Lab (after S; after or with the feedback pass) | 9 | `scenarios/lab_physical_pentest/`, `lab_physical_pentest_secrets_test.rb` |
| Docs (last) | 10 | `README_scenario_design.md`, the build log |

Two files are touched by more than one stream, each in separate places and in a fixed order:
`npc_habits.rb` (F writes it, B adds the `Clues` module at the end) and `test/unit/npc_habits_test.rb`
(F, then B appends). `game.rb` is touched by F and then A, in different methods. Stream B starts
when F is committed; A, C, D and E can start at the same moment as B.

Each stream is one builder with a review round after it (AGENTS.md, "How a round works": at least
two rounds, at most five). Builders commit with explicit paths, use a scratch folder of their own,
write a handover note at about 150k tokens of context, and never stop or start the server on
:3000. Scripted runs are split from building: the builder of stream S writes the scenario and
`PLAYTEST.md`, and a separate tester runs it.

## 16. Decisions for the user

Each has a recommendation. The build can start on step 1 and streams A, B, D and E before any of
them is answered.

| | Decision | Options | Recommendation |
|---|---|---|---|
| D1 | Social engineering defaults (`phishable`, `pretextable`, `challengesStrangers`, section 5.6) | (a) Build now, as stream C. (b) Keep the design here, accept the three habits in the schema, and build when a scenario first has a room NPC who is also a phish or pretext target | **(b).** No scenario today can use them: every social engineering target is a phone or email character with no room NPC, and awareness lives on room NPCs so it can be withheld. Building it now would be configuration nobody uses |
| D2 | Where a `writesDown` note is seen | (a) On the sign-in screen only. (b) Also as a note object placed in a container the author names (a drawer), which makes a pick-the-lock, read-the-note, sign-in chain | **(a) now.** A hand-written note in a drawer already works and the validator will report every place a password is written in full. Add (b) when a mission wants the note generated |
| D3 | How a `guessable` password is played | (a) The player types a guess at the sign-in screen, from clues in the world. (b) A guessing helper on the sign-in screen, built from the awareness course's password guesser | **(a).** It is a real deduction with no new screen. The cost of a wrong guess is the PC's `maxAttempts`, which the validator warns about |
| D4 | The lab | (a) Part A only: the swap, no change to play. (b) Part A, plus part B items 1 and 2 (captured accounts sign in at Melanie's PC; Sofia's sticky note desk), built with the feedback pass | **(b)**, with part A in this slice and part B done by whoever does the feedback pass, since both rewrite the same texts. Three desks with three habits is the clearest thing this slice can teach |
| D5 | The preset values (4.2) | (a) As proposed in the parent plan. (b) Change any now | **(a)**, and tune after the lab and the first mission have used them. Worth a look: `medium` gives `sometimes`, so every `medium` owner of a sign-in PC draws the roll warning until the author adds another route |
| D6 | `holdsDoors` in this slice | (a) Build the gate change (stream D, one client file). (b) Leave it until a mission has an open gate and a careful guard | **(a).** It is small, it is the only physical habit, and the lab's tuned records door is untouched because its bar is explicit |

Recorded, not asked: the field name `awareness` is kept although the word also names the awareness
course; the code is named for habits (section 2).

## 17. Left out, and why

- **Habits shown to the player** (a dossier, a meter). The player reads habits off the world.
  HaX or a handler can describe a person in dialogue; that is authored text.
- **A habit that changes mid-game.** Slice 9.2's workarounds do this for `writesDown` through the
  one server helper. Nothing in this slice changes a habit after the game is created.
- **`plugsInDevices` and other habits not on the user's list** (clicking found USB sticks, holding
  the lift, reading badges aloud). Sofia's device habit stays in `interests`. A new habit is cheap
  to add later: a row in the tables and an expansion.
- **A generated "asks for ID" beat** for `challengesStrangers`. `los.challengeOnSight` exists and
  needs scenario-written dialogue.
- **Awareness on phone and email characters.** Their records reach the browser unfiltered, and
  their social blocks are already hand-tuned.
- **A password strength meter or real cracking.** `password` is authoring intent that the
  validator holds the scenario to.
- **Per-habit rolls** (a note that is there some days). `sometimes` for the screen is the only
  chance, so every other habit is certain and safe to build a puzzle on.
