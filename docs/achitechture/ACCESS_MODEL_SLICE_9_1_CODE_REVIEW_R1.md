# Access model slice 9.1: code review, round 1

Scope: slice 9.1 steps 0 to 4, 6 and 7 on branch `claude/break-escape-access-design-090sjx`
(`f35b33692` "Slice 9.1 step 0" to `842cc9155` "step 7"), against
`ACCESS_MODEL_SLICE_9_1_PLAN.md` and `ACCESS_MODEL_SLICE_9_1_BUILD_LOG.md`. Step 5 is not built
and is out of scope. Reviewed 2026-11-10.

## Counts

| Severity | Count |
|---|---|
| Critical | 0 |
| Major | 1 |
| Minor | 8 |
| Nit | 4 |

Suites, run once on the branch head: `bin/rails test` 1280 runs, 0 failures, 0 errors, 1 skip
(38 s); `bin/test-js -j 3` 470 of 470 files passed. No browser was used.

## Verdict

The slice is sound on the four priorities. No password, habit or note text reaches the browser
outside the designed route; the `screenHabit` fill never overrides an authored one; the claim
check fix is correct and covered; existing scenarios behave as before. The one major finding is
in the validator's fairness rule: compiled ink identifiers count as text the player can read, so a
`guessable` password can be reported as backed by a word the player never sees. It is authoring
time only and does not affect play of any shipped scenario (only `test_access_habits` uses the
habit, and its sources are objects). Fix it before a mission relies on `guessable`.

## What was checked and holds

**Secrecy.**

- `awareness`, `habits` and `workarounds` are in `Game::WITHHELD_NPC_KEYS`
  (`app/models/break_escape/game.rb:4103`), applied to every room NPC in
  `filter_requires_and_contents_recursive`; `roles` is deleted in the bootstrap. The withholding
  test covers room data, a moved NPC and the bootstrap.
- The note's text is produced only by `Game#login_postit_for` (`game.rb:1478`) and sent only by
  `GET /login_accounts` (`games_controller.rb:1145-1161`), which sets `Cache-Control: no-store`
  before every branch (the 404 and 403 included), keeps the room reach check and keeps 9.3a's
  headless refusal. Room data gets `hasPostit` only (`game.rb:2024`, inside the non-headless
  guard). `npc_habits_postit_test.rb` sweeps `/scenario`, a door unlock, `/room`, `/container`,
  `/capture_secrets`, every other PC's `/login_accounts` and the sync answer, before and after
  the note is saved.
- The client never writes the served note onto the object's data (`unlock-system.js:283-312`),
  so each open asks again; a failed request falls back to the authored note.
  `pc_signin_shown` carries a boolean only.
- No 9.3a remote sign-in screen exists on this branch yet, so nothing opens a sign-in screen for a
  PC the player is not at today (see m5 for the risk when it lands).
- No password appears in `PLAYTEST.md`, the run report, the ink or the dungeon graph files of
  `test_access_habits`, and no validator or `verify-run.rb` line prints one.

**The fill never overrides an authored `screenHabit`.** `fill_screen_habit!`
(`lib/break_escape/npc_habits.rb:167-189`) tests `npc.key?('screenHabit')` first, so any authored
value (an object, `null`, anything) stops the fill; no object is ever written; a PC's own
`lockChance` or `locksScreenOnLeave` is reported as not applied. The plans are computed before any
write, and a second run sees the filled field as authored, so `expand!` is idempotent.

**The claim check fix.** `AccessIdentities.screen_always_locks?`
(`lib/break_escape/access_identities.rb:145-157`) follows `decideLocked`
(`public/break_escape/js/systems/workstation-state.js:119-140`) in order: PC `lockChance`, then a
`locksScreenOnLeave` key (a `null` value locks in both), then the owner's `screenHabit`.
`claim_login_session!` passes the owner it has already found (`game.rb:1564`); the policy check
after it is unchanged. `npc_habits_loader_test.rb:101-131` covers a never owner, an always owner,
an authored `screenHabit`, the PC field winning and `autoLockMin: 0`. The only difference from the
client is that Ruby needs a numeric `lockIfAwayOverSeconds` where the client also accepts a
numeric string; the schema types it as a number, so this is not a finding.

**No behaviour change in existing scenarios.**

- No scenario other than `test_access_habits` has a room NPC with `awareness` or `habits`, and
  none has a top-level `roles` (the `"awareness"` hits in the `ca*` scenarios are the social
  block). The builder's 170-scenario equality run stands.
- No scenario has a sign-in PC whose owner has a `screenHabit` (grep), so no claim changes.
- Postit marks draw only on `lockType: "login"` PCs with `hasPostit` or an authored, shown
  `postitNote`. The lab has none. `test_access_networks`' `sam_pc` and `test_access_signin`'s hot
  desk gain the picture, as plan 5.3 intends.
- The validator's one new line on an existing scenario is the `test_needs_sims` warning on
  `workstation_accessed:tom_pc` (confirmed). It is accurate (Tom's PC authors `lockChance` 0.5);
  it belongs to that fixture's owner. Lab, `test_access_sessions` and `test_access_signin` draw no
  habits line.

**The hand-resolved conflicts.**

- `scenario-schema.json`: the top-level `roles`, the NPC `awareness` and `habits`, and the
  `screenHabit` and `postitNote` descriptions sit beside 9.3a's `networks`, `networkLinks` and
  `resources`; both sets validate.
- `validate_scenario.rb`: the three `require_relative` lines follow `access_identities`; the
  known-field lists hold both slices' keys (`networks networkLinks resources roles`;
  `awareness habits`); `ValidateNpcHabits.check` runs after `check_access_model` and beside
  `check_network_model` and `check_capture_log`.
- `generate_dungeon_graph.rb`: the habits block (`:345-458`) sits between the identity edges and
  9.3a's network block, both intact; it draws nothing unless the expansion report is non-empty.
- `core/game.js` and `core/rooms.js`: both the `networkLinks` and the `postitMarks` imports and
  `syncRoom` calls are kept (`rooms.js:1005-1009`).
- `access-leak-check.rb` builds `served_npcs` from `account_capture_passwords` (the capture holder
  side) and passes `game:` (this slice); `AccessLeakScanner#initialize` takes both. The note
  exception (`access_leak_scanner.rb:430-462`) checks the answer's own `pc_id` against
  `written_down?`, the `savedNotes` exception needs an earlier `/login_accounts` line, `dom` rows
  never get the note exception, and the `withheld_key` walk skips only the top-level `social`.

## The builder's flagged choices

- **H4 (Priya's fill).** The builder is right. Plan 5.2 says nothing is filled when every PC the
  NPC owns sets its own field, and that rule is what keeps "one behaviour, one field" and the
  validator's "the PC sets lockChance, habit not applied there" true. The plan's section 11 H4 row
  ("Priya screenHabit lockChance 0") is the error; see m7.
- **Jake's fixture to `awareness: "high"`.** Accept. The value was a withholding probe; `high`
  fills `lockChance` 1, which is what Jake's PC did with no habit, so every existing claim test
  keeps its meaning, and the new withholding test sets `low` on its own copy so the `lockChance` 0
  path is still exercised.
- **`hasPostit` only on a fourth argument.** Accept. `screenShown` has one caller
  (`unlock-system.js:312`) and it always passes the boolean; a three-argument call sends exactly
  the first slice's payload, which keeps `pc-sessions.test.mjs` honest.
- **Coffee `useSeconds` 600.** Accept. The schema caps it at 600
  (`scenario-schema.json:5231`); ten minutes away still outlasts each beat, and the runs show it.

## Findings

### M1 (Major). Compiled ink identifiers count as readable clue text

`lib/break_escape/npc_habits/clues.rb:184-203`. `ink_texts` gathers every string value in the
compiled ink JSON: divert targets (`{"->": "hub"}`), variable reads and writes
(`{"VAR?": "hub_quiet"}`), tags (`"^speaker:npc"`), control words (`"ev"`, `"done"`, `"visit"`)
and the global declarations of `VAR`s that may never be printed. `word_in?` treats `_` as a word
boundary, so `hub_quiet` sources both "Hub" and "Quiet". Checked on `test_access_habits/ink`:
`word_in?` is true for Quiet, Speaker, Hub, Done and Visit.

Failure scenario: an author writes Mei's ink with `VAR asked_about_pepper = false` and a knot
`=== pepper_story ===` that never prints the dog's name, and removes the photo. The validator
still reports piece 1 as sourced (from `ink/mei.json`) and `guessable` as backed; the player has
nowhere to read "Pepper" and burns a counted sign-in. The same holes make "written in full at
ink/..." fire on a password used only as a variable value.

Fix: gather only player-visible text: strings that start with `^` outside a tag (skip the run
between `"#"` and `"/#"`), and the `^` strings between `"str"` and `"/str"` (choice text); skip
values under `->`, `VAR?`, `VAR=`, `temp=`, `^->`, `#f` and the whole `global decl` container.
Add a unit test with a knot name and an unprinted `VAR` that must not source a piece.

### m1 (Minor). Social arrays contribute strings under any key

`clues.rb:168-181`. `collect_strings` keeps a string in a hash only under the readable keys
(`SOCIAL_TEXT_KEYS`), but its `Array` branch keeps every string element whatever the key: id
lists, `requiredFactors`, `unlocks`, tag lists. Failure: an intel fact with
`"unlocks": ["pepper_photo"]` sources "Pepper" with no readable text. Fix: in the `Array` branch,
keep a string only when the array sits under a readable key (pass the parent key down), and add a
test.

### m2 (Minor). A two-digit number is sourced by any four-digit run, not only a year

`clues.rb:46-52`. Plan 7.2 allows a two-digit number part from "the last two digits of a
four-digit year"; `number_in?` accepts any four digits ending in it. Failure: a password ending
`19` is reported as sourced by a keypad code `4419` or an extension `x2219` that the player has no
reason to read as a year. Fix: restrict the second match to a plausible year (`(?:19|20)\d{2}`),
or report the piece as "two digits from a four-digit run: check it reads as a year".

### m3 (Minor). A piece whose case differs from every source is not flagged

`clues.rb:339-350`, `scripts/validate_npc_habits.rb:479-480`. Word parts match without case (as
planned), and the report only counts the password's capitals. For `pepper1998!` with the caption
"Pepper", the report says "0 capitals", and nothing tells the author the clue must say "all lower
case"; the player types "Pepper" and fails. The validator knows each matched source's own case,
so it can say this. Fix: when a word part matches a source only in another case, add
"(case differs from its source: the pattern clue must state it)" to that piece's report line, and
count it into "the pattern clue must cover". Related, and as planned: a symbol counts when it
appears anywhere in the clue's text (`clues.rb:354`), so "Remember!" sources `!`; the report's
"common punctuation" note could cover `!` and `?` too.

### m4 (Minor). Ink is silently dropped under a non-UTF-8 locale

`clues.rb:197-199`. `File.read` uses the default external encoding and the `rescue StandardError`
then `next` hides the failure. In this container with no `LANG`, `readable_texts` returns 0 of 7
ink files for `m01_first_contact` and 1 of 2 for `ca03_helpdesk_reset`; with `LANG=C.UTF-8` it
returns all of them. A `guessable` verdict, a `strong` warning and the "written in full" lines
then depend on the shell's locale, with no message. Fix: `File.read(file, encoding: 'bom|utf-8')`,
and print a one-line note naming any ink file that still fails to parse instead of skipping it.

### m5 (Minor). Forward risk: a remote desktop's Switch user would fetch the note

`public/break_escape/js/minigames/container/container-minigame.js:568`,
`unlock-system.js:287`, `games_controller.rb:1145-1161`. Plan 5.3 makes "never over a network" a
rule held only by the client not calling `/login_accounts`. Today the only Switch user is the desk
desktop's, which is right. When 9.3a step 8 builds `openRemoteDesktop`, if it reuses the container
desktop (as the local one does), its Switch user calls `openLoginSignIn`, which asks for the note
and shows it on a remote sign-in screen. Fix (cheap now): give `openLoginSignIn` a `remote` option
that skips the note request, and have the server answer `/login_accounts` without `postitNote` when the request
names a foothold. Note it in the 9.3a step 8 brief either way.

### m6 (Minor). A clue in an undrawn container lock becomes an orphan node

`scripts/generate_dungeon_graph.rb:376-387`. `clue_node_for` hangs a clue behind a locked container
from `lock_<id>` only when that node already exists, and otherwise draws no edge at all (not even
from the room). A container drawn by the legacy puzzle metadata exists, but a locked drawer with no
`puzzle_graph_*` fields does not, so the "loop through the account" the plan wants to show is
lost and the clue floats. The lock id is also used raw where a pathless object's label is a path,
not passed through `nid`. Fix: when the lock node is missing, add it (as the graph does at
`:165`) or fall back to the room edge with a "(behind lock <id>)" label; use `nid` on the label.

### m7 (Minor, document). The plan's H4 row contradicts 5.2

`ACCESS_MODEL_SLICE_9_1_PLAN.md` section 11, H4 row, "Server record afterwards": "Priya
screenHabit lockChance 0". Under 5.2 nothing is filled (her only PC sets `lockChance` 1), which
the build, `PLAYTEST.md` and the validator report follow. Fix: the orchestrator corrects the row to
"Priya screenHabit not filled (the PC sets lockChance, habit not applied)".

### m8 (Minor, process). Two of the plan's after-run checks were not done

Plan section 11, "After the runs": "The first-slice suite runs again". The run report says
`test_access_signin` and `test_access_sessions` scripted runs were not rerun (step 2 changed
`openLoginSignIn`, which both drive). Also the locker note's `addToNotes` was changed after run 2,
and only H7 was rerun (run 2b); H6 and H8 were not run on the final scenario file (low risk: the
change touches only the locker note). Fix: a tester reruns the two first-slice scripted suites and
one full run 2 on the final scenario before the slice is called done.

### n1 (Nit). A doc comment now sits on the wrong method

`scripts/validate_scenario.rb:894-899`. `npc_screen_habits` was inserted between
`scenario_npc_records`' comment ("Every NPC record: ...") and its `def`, so that comment now heads
`npc_screen_habits` and `scenario_npc_records` has none. Move the new method above the old comment.

### n2 (Nit). `expanded_copy` is rebuilt per NPC

`scripts/validate_npc_habits.rb:119-120`. `check_values` calls `NH.expanded_copy(json_data)` (a
Marshal deep copy and a full expansion) for each NPC whose `passwordPattern` is not found in the
authored data. `check` already has `expanded`; pass it to `check_values`.

### n3 (Nit). `expand!` can leave a half-expanded scenario

`lib/break_escape/npc_habits.rb:135-146`. The `rescue StandardError` returns the report so far,
after some NPCs have been written. The plan only asks that it never raises; a partial expansion is
still a game. A comment saying so (or computing every write before the first, which the plans
already almost do) would make the intent clear.

### n4 (Nit). Signs name parts of the never-typed passwords

`scenarios/test_access_habits/scenario.json.erb:131` and the other signs name Dana, Ian, Priya,
Kai and Lena, whose passwords (`:289`, `:385`, `:580`, `:676`, `:916`) contain their names. Plan
section 11 says a sign never holds a part of a password. Harmless (those passwords are never
typed), but a stricter reading of the rule, or a future `strong` check on them, would trip. Fix:
drop the names from those five passwords.

## Not reviewed

Step 5 (`holdsDoors`) and step 8 (the lab) are not built. Visual placement of the note picture
was not looked at in a browser; the builder's screenshots were not kept.
