# Access model slice 9.1 plan: adversarial review, round 1

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md` (version 1, 2026-11-10) against the
code on branch `claude/break-escape-access-design-090sjx` at commit `17eb4a5ba`. Nothing was run
against a server; every finding is from reading the code.

**Counts: 1 blocker, 7 major, 12 minor.**

Verdict: the foundation (library, loader, `locksScreen`, the on-demand sticky note) is sound and
most of section 2 matches the code. Streams F, A, B and E can start once the majors that touch
them are written into the plan. Stream D (gates) should not start until B1 and M1 are settled.

What was checked and found correct (no finding): `WITHHELD_NPC_KEYS` and `withhold_npc_secrets!`
(`game.rb:3968-3975`); the bootstrap dropping room NPCs (`game.rb:824-878`); `prepare_scenario_data!`
running once at creation and through `create_access_game` (`game.rb:799-804, 4020`,
`test/test_helper.rb:38-49`); a reset keeping `scenario_data` (`game.rb:89-106`); `isWorkstation`,
`ownerOf`, `decideLocked` (`workstation-state.js:72-103`); `pc_always_locks?` and claim check 6
(`game.rb:1406-1411, 1466`); `openLoginSignIn` and its note lines (`unlock-system.js:268-321`);
`login_accounts` and its reach check (`games_controller.rb:1106-1114`, `game.rb:1268-1273`); the
seeded roll being a pure function of seed, NPC and salt (`npc-needs.js:222-224`); the lab line
references in section 2; the social validator already erroring on a threshold with no `at`
(`validate_social.rb:472`); needs and patrol not combining (`validate_npc_needs.rb:408`).

## Blocker

### B1. `holdsDoors: false` stops barring the moment the guard steps out of the radius, so the tailgate window stays open

Plan 5.4: the player is barred "when they are within the radius and every near guard is in
`noHold` (with no guard near, not barred: the gate is shut anyway)". The bracketed claim is false.
A gate stays open for `holdMs` (default 2500 ms) after the last guard leaves the radius:
`door-gates.js:509-511` (`if (npcNear) continue; if (now - g.lastNpcNear < g.cfg.holdMs) continue;`).
That window is the tailgate window (`README_scenario_design.md:141`). With the rule as written, the
player waits just outside the 56 px radius, the careful guard walks through and passes 56 px on the
far side, the "near guards" list is empty, the player is not barred, and the gate holds open for
2.5 s more. The careful guard holds the door exactly as a careless one does. `playerMayPassIf` does
not have this hole because `_playerBarred` (`:411-418`) does not look at guards at all.

Beat H9 would still pass as written ("the gate shuts as the player comes within its radius") if
the script walks up while Sara is near, so the test would not catch it.

Fix: bar on who opened the gate, not on who is near now. Keep `g.lastGuards` (the set of `openFor`
ids seen within the radius since the gate last opened, updated where `lastNpcNear` is set,
`:468-469`, cleared in `close`). `_playerBarred` for a `noHold` gate: the player is within the
radius and `lastGuards` is non-empty and every id in it is in `noHold`. `openToPlayer` uses the
same test. Add to step 5's tests: guard in `noHold` passes and leaves the radius, the player then
enters the radius inside `holdMs`, the gate shuts and `openToPlayer` is false. Add to H9: the
player approaches Sara's door one second after she has gone through.

## Major

### M1. A `noHold` gate is a soft bar with nothing for a scenario to credit on, so the habit changes nothing a puzzle can rely on

Plan 5.4 accepts the soft bar: after `GUARD_PRIORITY_MS` (5 s, `door-gates.js:60`) the gate opens
for the guard whatever the player does (`:479-486`), holds `GUARD_PASS_MS`, then stays open while
his path crosses the doorway (`:502-504`), and the player walks in beside him. For
`playerMayPassIf` that is acceptable because the scenario credits entry on the same global
(`README_scenario_design.md:144`). A habit gate has no global. The plan says "a scenario that
credits an entry credits it on its own condition", but there is no condition to name: standing
still for five seconds at a careful guard's door gets the player in, and `room_entered` cannot tell
that entry from a clean one. As a chain step ("careful guard, so copy the badge instead") the habit
gives the author nothing to build on.

Fix (one of):
- Emit an event the scenario can map: when a gate opens by guard priority over a barred player,
  `door_gate_opened` carries `forced: true` and `guardId`, and a new `door_gate_tailgated`
  `{ roomId, connectedRoom, guardId, barred }` fires when the player crosses while the gate is open
  for an NPC. A scenario credits a clean tailgate on `barred === false` and reacts to
  `barred === true` (a bark, `closeDoor`, influence loss). Test both in step 5 and use them in H9.
- Or take decision D6 option (b) and leave `holdsDoors` out until a mission needs it. No scenario
  today has a gate without `playerMayPassIf` (`lab_physical_pentest/scenario.json.erb:799`,
  `test_gate_tailgate/scenario.json.erb:52`), so nothing but the test scenario would use it.

### M2. The `low` preset turns on `writesDown`, which hands over a permanent password and can bypass an authored capture chain with one word

Plan 4.2: `low` gives `writesDown: true`. Plan 5.3: `login_postit_for` then serves `creds.password`
for every sign-in PC that NPC owns. An author who writes `"awareness": "low"` on a character whose
password is meant to be earned (a keylogger mapping with `addCapture`, a `usePayload`, a phishing
landing page) has added a second, free route: click the PC while the owner is away, or use Switch
user, and read the password. Every other preset value gives a temporary or checked opening
(`never` gives a claim that ends when the owner returns, `game.rb:1446-1473`); this is the only
one that publishes a secret the server otherwise withholds, and it does so by default. The habits
report lists it ("sticky note at `omar_pc`") but as a report line among ten NPCs, not a warning.
The plan's own lab part A has to switch it off for Melanie for this reason (section 12).

Fix: make `writesDown` explicit only (`false` in all three presets), which also answers part of D5.
If the user keeps it in `low`, the validator must warn (not report) when a preset-derived
`writesDown` creates a note for an account that has any other earn route in the scenario: an
`addCapture` naming the NPC, a `usePayload`, a `social.landingPages[].capture` for it, or a
`password: guessable` or `reused` clue. Add a fixture for it to `validator-npc-habits.test.mjs`.

### M3. A saved sticky note puts the password in later `/scenario` responses, which section 6 and the leak scanner say never happens

The sign-in screen has an "add to notebook" button whenever a note shows
(`password-minigame.js:860-889`, `addPostitToNotebook` `:728-794`). The note text goes to the notes
minigame, is synced into `player_state['notes']` (`games_controller.rb:1637-1639`) and is sent back
as `savedNotes` on every later load (`games_controller.rb:306-308`). So after a player (or the
scripted tester) saves Omar's note, his password is in `PUT /sync_state` echoes and in every
`GET /scenario`. Section 6 says the note is "never in room data, the bootstrap, `container` or an
unlock answer", step 2's test asserts "in no other response", and step 6 gives the scanner one
exception (`/login_accounts`). The scanner's existing exception covers only text the scenario
authored (`access_leak_scanner.rb:240-241, 316-318`), which a habit note is not. Run 1 reloads
straight after H3, so a tester who saves the note fails the leak check on a correct build.

This is the player's own earned copy and is the right way to carry the password to the next PC, so
the behaviour should stay. Fix the plan: section 6 gains a row ("the player's saved notes: yes,
after the player saves the note"); the scanner allows a `writesDown` owner's password inside
`savedNotes` and a notes sync only when an earlier captured `/login_accounts` answer for that
owner's PC carried it; step 6 tests both orders; `PLAYTEST.md` has the tester save Omar's note
before the reload so the exception is exercised.

### M4. The `guessable` clue check passes on one word of the password, so it approves passwords nobody could guess

Plan 7.2: "A clue exists when a token appears in text the player can read", a token being any run
of four or more letters. One token is enough. For `Ledgerwell#Spring26`
(`lab_physical_pentest/scenario.json.erb:827`) the company name alone satisfies it, and the plan
relies on exactly that in section 12 ("the validator's clue check agrees, because the company name
is all over the scenario's text"). A player cannot build that password from the company name: the
season, the symbol and the number have no source. The same check would call `Password1` or
`Welcome2024` backed in any scenario whose text contains "password" or "welcome". The check exists
to hold the scenario to the puzzle ("the player typing a password they worked out", section 3), and
as specified it does not. It also makes the `strong` warning ("a word from it is in readable text")
fire on any strong passphrase containing a common word.

Fix: a `guessable` password is backed only when every part is sourced: each letter run of four or
more and each digit run of two or more appears in readable text outside the password's own home.
The report names the parts by position ("part 2 of 3 has no source"), never the text. For `strong`,
warn only when all parts are sourced. In the lab, do not mark Chris `guessable` unless the pass
adds the missing clues; leave his `password` to the preset and accept the suggestion, or mark it
`reused` when part B makes it so. Add step 3 fixtures: one part sourced (not backed), all parts
sourced (backed), a common word only (not backed).

### M5. The new library files do not fit how the engine loads `lib/`, and the plan's "engine's requires" do not exist

Step 1 says to add the engine's requires "wherever `declared_grants.rb` is loaded". It is not
required anywhere: `lib/` is an autoload path (`lib/break_escape/engine.rb:14`) and
`BreakEscape::DeclaredGrants` is found by file name. Under that rule
`lib/break_escape/npc_habits_social.rb` must define `BreakEscape::NpcHabitsSocial`; the plan has it
define `NpcHabits::Social`. A reference to `NpcHabits::Social` then looks for
`lib/break_escape/npc_habits/social.rb` and raises `NameError`. If the builder works round it with
`require_relative 'npc_habits_social'` inside `npc_habits.rb`, it works on first boot and breaks
after the first code reload in development (the constant is removed, the file stays in
`$LOADED_FEATURES`), which is the server the user plays on. The same applies to a
`require_relative 'access_identities'` inside the library.

Fix: name files for their constants. Either keep `Social` and `Clues` inside `npc_habits.rb`, or use
`lib/break_escape/npc_habits/social.rb` and `lib/break_escape/npc_habits/clues.rb`. The library
files contain no `require_relative` of each other; the scripts require each file in order, as they
already do for `declared_grants` and `access_identities` (`validate_scenario.rb:20-21`,
`generate_dungeon_graph.rb:15-16`). Step 1 adds `bin/rails zeitwerk:check` to its checks, and
section 15's file lists are updated.

### M6. `verify-run.rb` cannot produce the habits block the feature scenario expects

Step 6 has `verify-run.rb --access` print a habits block from the game's saved scenario, and
section 11 expects it to say "the habit was not applied" (H4) and to tell Sara's filled `noHold`
from none (H9). The saved scenario cannot say that. After the loader has run, a filled `lockChance`
is indistinguishable from an authored one and `habits` holds all seven keys for every NPC with a
level (plan 5.1: "they read as explicit"); the report `expand!` returned at creation is not saved.
Running `expand!` again on saved data reports every PC as "sets its own field, habit not applied".
A builder has to guess between saving the report, re-rendering the scenario, or dropping the line.

Fix: pick one in the plan. Simplest: `verify-run.rb` prints values only (each NPC's seven habits,
each workstation's effective `lockChance`, each gate's `noHold`), and the "not applied" lines are
checked where the authored data is, in the validator's habits report listed in `PLAYTEST.md`.
Change the H4 and H9 "server record" cells to match. If the origin must be visible at run time,
have the loader save the report under one top-level key (for example `habitsReport`) and delete it
in `filtered_scenario_for_bootstrap`, with a withholding test.

### M7. The whole "learn the habit by watching the padlock" premise rests on a look the user reports is not showing

Section 3: "They learn the habit by watching the padlock, the door and the desk." The user's
hands-on feedback says: "The PCs in the scenario aren't showing the lock screens or making a sound
when npcs leave" (`physical_pentest_followup/USER_FEEDBACK_2026-11-10.md:52`). Section 12 defers
this ("a finding for the feedback pass, not a reason to change this slice"). If the locked look
does not show in real play, `always`, `sometimes` and `never` look identical until the player
clicks, the player cannot read a habit off the world, and H2, H3 and H8 test a signal the user
cannot see. With no stats on screen by design, that leaves trial and error.

Fix: add a step 0 probe before step 8: reproduce the user's report on the keyless server on :3001
in the lab as it stands (`window.__test.access.workstation`, `screenTransitions()`, and a
screenshot), find out whether it is a fault or a set-up difference (for example a PC without
`"sprite": "pc_desktop"`), and fix it or record why before the feature scenario is written. Also
say in section 4 what the player sees for an away, unlocked screen as against an attended one,
since `never` depends on the player noticing there is no padlock.

## Minor

### m1. The expansion runs before object ids are stamped

Plan 5.2 puts `NpcHabits.expand!` before `stamp_scenario_object_ids!`. The server's own owner
lookup runs on stamped data (`login_pc_owner`, `game.rb:1397-1402`), and
`AccessIdentities.workstation?` returns false for an object with no string `id`
(`access_identities.rb:102-106`). A PC that sets `screenOwner` and has no authored id, or a
`needsHome` that names a stamped id (`<room>_<type>_<n>`), is then owned at run time but skipped by
the fill. Fix: run the expansion after stamping (nothing in it needs to come first), and have the
validator warn when an owned workstation has no authored id.

### m2. With D1 answered (b), step 1 still loosens the schema for the unbuilt social fills

Section 7.1 removes `required: at` from `socialThreshold` (`scenario-schema.json:751-753`) in step
1, while the rule that replaces it is step 7. The social validator's own check
(`validate_social.rb:472`) covers the gap, but other checks read authored thresholds and silently
skip one with no `at` (`validate_social.rb:460-463, 517`, `validate_social/pretext.rb:492`), so
step 7 must run them on the expanded copy. Stream C's "one line in `validate_social.rb`" is also
not enough: the rule at `:472` has to change. Fix: move the schema edit and these notes into step
7, and list `validate_social.rb:472` in stream C's files.

### m3. Three habits are accepted and preset but do nothing, and the expected validator output forgets them

With D1 (b), `phishable`, `pretextable` and `challengesStrangers` are in the schema and every
preset, and 7.2 gives a suggestion for each on an NPC with no social block. Every NPC with an
`awareness` then draws them, yet section 11's expected output lists only the `guessable` and
`reused` suggestions. Fix: for a preset-derived social habit with no social block, print "no
effect" in the habits report and no suggestion; keep the suggestion for an explicit one. Update
section 11.

### m4. The roll warning: too loud for the preset, absent for plain workstations

A `medium` owner of a sign-in PC always draws a warning (section 9), against the plan's own rule
that a preset-derived gap is a suggestion (7.2). And the existing roll check runs only inside the
sign-in PC loop (`validate_scenario.rb:6064-6095`), so a `sometimes` owner of a plain
`workstation: true` PC gets nothing, although a mapping there can depend on the lock
(`data.wasLocked`, as the lab's capture does, `lab_physical_pentest/scenario.json.erb:842-843`).
Fix: suggestion when `sometimes` came from the preset, warning when explicit; add a warning for a
`sometimes` plain workstation that any `workstation_owner_returned:<id>` or
`workstation_locked_attempt:<id>` mapping reads.

### m5. Step 3's "expanded copy" needs more than swapping the argument

`check_access_model` builds its PC list and NPC index from `json_data` at the top
(`validate_scenario.rb:5827` onwards) and the workstation checks at `:6080-6095` read those. Naming
the habit in the message also needs the expansion report. Fix: say in step 3 that the function
takes the expanded copy and the report as arguments, built once by the caller at `:6498`, and that
every other check keeps reading the authored data.

### m6. "No Rails" unit tests live where Rails is loaded

Step 1 puts `test/unit/npc_habits_test.rb` under `test/unit`, whose tests start with
`require 'test_helper'` (`test/unit/access_leak_scanner_test.rb:1`). Under Rails, `deep_dup`,
`present?` or `blank?` in the library pass the test and then break the validator script, which is
only caught in step 3. Fix: step 1 adds one test that loads the library in a plain `ruby`
subprocess and runs `expand!` on a fixture.

### m7. Section 1 overstates when the note is served, and the answer should not be cached

Section 1 says a password is served "only at the moment the player is at the place it would be
read". Section 5.3 is the accurate one: any client may ask for it once the PC's room is open,
whether or not the owner is at the desk. Fix the wording in section 1. Also add
`Cache-Control: no-store` to the `login_accounts` answer now that a GET can carry a password, with
a controller test.

### m8. After a reload the owner is back at the desk, which the run script does not allow for

Run 1 expects, after the reload, Omar's kept session and the note behind Switch user. A click on an
owned sign-in PC answers "is using this PC" before it looks for a session
(`unlock-system.js:205-222`), and a reload puts every owner at the desk (section 8). The tester
must wait about 50 s for Omar to leave again. Fix: say so in the run 1 text and in `PLAYTEST.md`,
or the regression tester will report a stuck beat.

### m9. The note's content and `showPostit: false` are left to the builder

The note is "the bare password". On a PC with `loginPicker: false`, or a hot desk with many tiles,
the player cannot tell whose it is. And the client shows a note only when `showPostit !== false`
(`unlock-system.js:312`); the plan does not say whether an authored `showPostit: false` hides a
habit note. Fix: the note reads `<username> / <password>` when the PC's picker is off, the bare
password otherwise; an authored `showPostit: false` means no habit note is served (explicit wins),
with a case in step 2's tests and a validator warning.

### m10. A malformed scenario must not stop a game being created

The expansion runs in `before_create` (`game.rb:28, 4020`). Section 4 says the loader ignores
invalid values, but no test covers wrong types (`habits` a string, `awareness` a number, `doors` not
a list, `gate.openFor` a string, which `normaliseGate` accepts, `door-gates.js:79-80`). Fix: step 1
adds these cases and asserts no exception and no change; the gate fill treats a string `openFor` as
a one-item list.

### m11. H9 needs more set-up than "walks a route"

A gate guard needs a multi-room patrol with an `unlockRoom` action at the door, and gates are
proven north and south only (`test_gate_tailgate/scenario.json.erb:66-76`, `door-gates.js:45`,
`README_scenario_design.md:146`: one gate per pair of rooms). Fix: section 11 points the builder at
`test_gate_tailgate` as the pattern and puts `store_a` and `store_b` north or south of `gate_hall`.

### m12. The `reused` check treats two people with the same password as reuse

7.2 counts "another account's `creds.password`" as backing. That is a shared or default password,
a different lesson, and the player still needs the second username. Fix: keep it, but label the
dungeon graph edge and the report line "shared with <npc id>" and keep "same password" for a lock
or capture belonging to the same person.

## Fun, education and chaining

- `locksScreen` is the strongest habit: a real behaviour, a visible tell (subject to M7), a clear
  control, and a session that chains into profiles. Good.
- `writesDown` as built is a zero-step puzzle: the password is on the screen it opens. It is true
  to life and worth one beat, but the chain only starts if the account opens something else, so the
  habits report should say "opens only its own PC" when it does not. The drawer note (D2 b) is the
  version that chains (pick the lock, read the note, sign in elsewhere).
- `password` is fun only if M4 is fixed; otherwise it is a label. With every part sourced it is a
  good deduction puzzle and matches what the awareness course already teaches.
- `holdsDoors` gives nothing a puzzle can use until B1 and M1 are fixed.
- The validator report and the labelled graph edges are the right way to show chains to authors.

## The six decisions

| | Plan recommends | Review |
|---|---|---|
| D1 | (b) defer the social fills | Agree. Also defer the schema change (m2) and silence the preset suggestions (m3). |
| D2 | (a) note on the sign-in screen only | Agree for this slice, with m9. Schedule (b) with the first mission that uses the habit: a hand-written drawer note repeats the password in a second place and nothing checks the two stay equal. |
| D3 | (a) typed guess, no helper | Agree, only with M4 fixed. Without it the validator approves guesses nobody can make. |
| D4 | (b) part A now, part B with the feedback pass | Agree, after the M7 probe. In part A do not mark Chris `guessable` (M4). In part B write Sofia's `writesDown` explicitly (M2). |
| D5 | (a) keep the presets | Disagree in two places. Take `writesDown` out of `low` (M2), and make a preset-derived `sometimes` a suggestion (m4), or `medium` becomes the level nobody can use without a warning. |
| D6 | (a) build the gate change | Only with B1 and M1 fixed in the plan first. As written it does not work and nothing can use it; if that is not worth doing now, take (b). No existing gate is affected either way. |

## Build streams

No two streams edit the same lines once M5 renames the library files. Three notes: stream C edits
more of `validate_social.rb` than one line (m2) and needs a suggestion in stream B's
`validate_scenario.rb` lifted, so it should follow B; stream E's scanner exception depends on the
answer shape from stream A and on M3, so its tests use a fixture and its final check waits for A;
stream D owns only `door-gates.js`, but the B1 fix also changes the gate fill's meaning, so D's
builder should read stream F's gate tests first.
