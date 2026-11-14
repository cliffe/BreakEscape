# Step 8c re-anchor (2026-11-13)

Step 8c of `SCENARIO_FORMAT_HARDENING_PLAN.md` (section 4, "Habits in one block, format 3") and the
shared step 8 text it depends on were written and reviewed against main `406fa7791`. Since then steps
2, 2b, 7, 8a (one outage field, format 1, `offWhen`) and 8b (one owner field, format 2, `owner`) landed.
8c reads workstation ownership from `owner` (8b). This note records a re-anchor of step 8c against
**a693650b9** (the finished 8b branch tip; formats 0 to 2 live, `FormatUpgrade.current` 2).

## Verdict

**Mechanical.** No design change: no new reader kind, no field-meaning change, precedence unchanged,
and every authored per-scenario count matches the plan. What was wrong is the same two classes 8b hit:
stale line numbers, and an under-listed set of test files that carry inline habit fixtures. Top reasons:

- Every reader of `screenHabit`/`printHabit`/`usbHabit`/the `habits` block sits inside a file the plan
  already named; the only indirection worth stating is that `AccessWork.usb_habit` (access_work.rb:1211)
  is the single `usbHabit` reader, which both the `work.usb` build and `NpcFrustration` call.
- The five precedence fixtures still differ on purpose and precedence is untouched.
- The four deployed scenarios author none of the three keys and carry no `awareness`/`habits.locksScreen`,
  so 8c changes no deployed data at all, not even a loader-filled `screenHabit` (stronger than 8a/8b).

## What was checked

- Grepped `app`, `lib`, `scripts`, `tools/playtest`, `public/break_escape/js`, `docs/test-bridge.md`
  and the schema for `screenHabit`, `printHabit`, `usbHabit`, `habits.locksScreen`, `awareness`,
  `WITHHELD_NPC_KEYS`, `WITHHELD_WORK_NPC_KEYS`, `work.usb`, `NpcHabits.fill_screen_habit!`, and the
  new feed/reaction/reply/lockout and USB-stick code since the original anchor.
- Checked each file:line the 8c spec and the shared step 8 paragraph cite against the code.
- Recounted the authored habit keys per scenario with the `"<key>":` pattern (raw `grep -c` overcounts
  because `_comment` strings and `<%# %>` ERB comments name the keys).
- Confirmed the five precedence fixtures exist and still differ: priya_pc (test_access_habits, filled
  from awareness), omar_pc (test_access_social, authored), rosa_pc/ian_pc/jake_pc (test_access_work,
  each PC `lockChance: 1` against its owner's `screenHabit lockChance: 0`).
- Listed every test file (Ruby and node) with an inline habit fixture or assertion, and the frozen
  JSON corpus fixtures that must stay untouched.

## What was wrong or missing (file:line)

Stale line numbers (all corrected in the Step 8c section and, for `known_npc_fields`, the shared
step 8 paragraph):

- `NpcHabits.fill_screen_habit!`: plan said npc_habits.rb:180; the def is at **:179**.
- `WITHHELD_NPC_KEYS`: plan said game.rb:5323; it is at **:5620** (applied :5656).
  `WITHHELD_WORK_NPC_KEYS` is at **:5624** (applied :5657).
- `AccessWork` usbHabit reader: plan said access_work.rb:1062; the reader `usb_habit` is at **:1211**
  and the `work.usb` build at **:1165-:1170**.
- `Game` written-down rule: plan said "beside game.rb:2029"; the `habits`-block reads
  `npc_habit`/`written_down?` are at **:2101-:2113** and the `screenHabit` precedence note beside
  `pc_always_locks?` is at **:2094-:2096**.
- Shared step 8 field list: `known_npc_fields` was cited at lines 691-704 (screenHabit printHabit 698,
  usbHabit 702); it is now at **807-822** (screenHabit printHabit **814**, usbHabit **818**).

Readers inside already-named files the plan's detail did not spell out (same known kinds, now in the
readers-moved list so a builder does not miss them):

- `AccessIdentities` screen read at access_identities.rb:186/:196; `OwnerClaim` print at
  owner_claim.rb:157/:254/:260 and screen at :226/:235.
- `validate_npc_needs.rb` screen at :497/:526-:529/:566 and print at :335/:394-:418;
  `validate_npc_habits.rb` at :158/:333/:354/:521/:527; `validate_access_work.rb` careful-guest screen
  warning at :1164-:1169 and usb at :357/:508/:577-:615/:680-:699/:750; `validate_scenario.rb`
  `screen_habits` map at :1297-:1302 and the ship note at :7092.
- `workstation-state.js` screen at :124; `npc-needs.js` print at :973/:3351 and `work.usb` at
  :508/:3413/:3439; `tools/playtest/verify-run.rb` at :165-:166; `access_leak_scanner.rb` at :147/:320.
- `NpcFrustration` reads `usbHabit` only through `AccessWork.usb_habit` (npc_frustration.rb:439); its
  only literal mention of the keys is a comment at :276.
- The schema move: the closed `habits` block (scenario-schema.json:4275-4290) gains `screen`, `print`,
  `usb`; the top-level `screenHabit`/`printHabit`/`usbHabit` keys (:4781-:4783) go.

Out of 8c scope but noted for the next re-anchor: the same shared step 8 sentence still describes
`known_item_fields` at lines 780-814 as holding `screenOwner`, `phoneOwner`, `phoneOf`, `leftBehindBy`;
8b removed those and the list is now at 896+. That clause is 8b's content, not edited here.

## The 8a leftover (task 3)

`README_scenario_design.md` still teaches `downIf` in author-facing text at lines 931, 945, 964, 966,
990, 992, 1090, 1100, 1104, 1191, 1193, 1195. Step 8a renamed `networks.*.downIf` and `resources.*.downIf`
to `offWhen` in the templates (no template still carries `downIf`) and in the readers, but left this
README wording. The archived plan/review docs under `docs/achitechture/` also name `downIf`; those are
history, not author teaching, and stay. `README_ink_best_practices.md` names neither field. Because 8c
edits the habit sections of the same README, it clears the `downIf` wording in the same commit.

## Test files that name the keys (the 8b lesson)

The plan's 8c "Tests" names only npc_habits_test, npc_habits_loader_test, access_identities_screen_test,
lab_physical_pentest_secrets_test, npc_lockout_l_test, npc_frustration_test, owner_claim_test,
validator-npc-habits.test.mjs and "the USB habit tests". The full set with an inline habit fixture or
assertion is **26 files** (16 Ruby, 10 node); the build plan assigns every one to a chunk.

Ruby (count of lines naming a key):
- npc_habits_test.rb (19), owner_claim_test.rb (13), npc_habits_loader_test.rb (13),
  access_work_usb_habit_test.rb (12), owner_claim_enforce_test.rb (11), access_identities_screen_test.rb (5),
  access_leak_scanner_test.rb (5), usb_habit_test.rb (4), lab_physical_pentest_secrets_test.rb (4),
  npc_workaround_h_test.rb (3), pc_screen_lock_precedence_test.rb (3), access_model_withholding_test.rb (2),
  npc_frustration_test.rb (1), npc_lockout_l_test.rb (1).
- Comment-only, wording touch not a fixture: test/support/access_model_scenario.rb (:68),
  test/unit/format_8b_corpus_test.rb (:158 — a frozen-fixture test; do not re-migrate it).

Node:
- validator-usb-habit.test.mjs (17), npc-office-visuals.test.mjs (13), npc-print-forget.test.mjs (13),
  validator-npc-habits.test.mjs (10), validator-strict-keys.test.mjs (10), workstation-state.test.mjs (7),
  validator-access-work.test.mjs (6), playtest-verify-run-access.test.mjs (5),
  validator-access-model.test.mjs (5), npc-printer-power.test.mjs (4).

Under-listed by the plan (the 8b-style gap, to be owned explicitly): owner_claim_enforce_test.rb,
npc_workaround_h_test.rb, access_model_withholding_test.rb, access_leak_scanner_test.rb,
pc_screen_lock_precedence_test.rb (Ruby); npc-office-visuals, npc-print-forget, validator-strict-keys,
workstation-state, validator-access-work, playtest-verify-run-access, validator-access-model,
npc-printer-power (node).

**Frozen fixtures that must stay untouched:** `test/fixtures/format_8a/*` and `test/fixtures/format_8b/*`
(`.old.json`/`.new.json`) contain habit keys as historical renders of formats 0 to 2; 8c's transform
never runs on them and editing them would break the 8a and 8b corpus tests. 8c creates its own
`test/fixtures/format_8c/*` where `.old.json` is the format-2 render (still `screenHabit`) and
`.new.json` is the folded `habits.screen`/`print`/`usb`.

## What held

- The schema move (three closed sub-blocks `screen`/`print`/`usb` keeping their keys and `^_`), the
  `habits.locksScreen`/`awareness` fill rule, the precedence order, the ship rule (allow-list of two
  keys `screen` and `print`, `work.usb` built from `habits.usb`, the rest of `habits` withheld), and
  the client reading `npc.habits.screen` and `npc.habits.print` all still match the code.
- Authored per-scenario counts match the plan exactly: test_access_social 5 `screenHabit` + 1 `usbHabit`,
  test_access_work 3 `screenHabit`, test_needs_sims 2 `screenHabit` + 1 `printHabit`; test_access_habits
  and lab_physical_pentest author none (test_access_habits carries 10 `awareness`, lab_physical_pentest 2),
  so their stored games hold a loader-filled `screenHabit`.
- No corpus scenario uses `habits.locksScreen`; the fill source in the corpus is `awareness` only.
