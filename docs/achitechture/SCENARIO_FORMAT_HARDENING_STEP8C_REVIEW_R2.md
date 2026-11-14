# Step 8c review, round 2, whole-branch (2026-11-13)

Fresh whole-branch read of Step 8c (format 3: habits in one block), hunting the seams a split
review misses: Ruby/JS, loader/ship-filter, stored-game upgrade/live client. Round 1 passed as two
halves (server 0/0/3 minor, client 0/0/2 minor, both doc-only client minors fixed in 4e6d5161d).

Tested worktree branch build/hard-8c at tip 4e6d5161d. 8c-only change read as
`git diff build/hard-8b 4e6d5161d`. Read-only except this file.

## Verdict

**Ship.** No blocker, no major. One fresh minor (a stale schema description), doc-only, no runtime
or test effect. The three R1 server minors are acceptable as left. Every test I judged at risk is
green.

Blockers: 0. Majors: 0. Minors: 1 (new) + 3 (R1 server, acceptable as left).

## Seams checked and what held

- **Ship filter (server) vs client readers (client) agree on the allow list.** `habits` left
  `WITHHELD_NPC_KEYS`; `withhold_npc_secrets!` (game.rb:5668-5675) now `habits.slice('screen',
  'print')` and drops the rest (and a non-Hash `habits`). The client reads only `habits.screen`
  (workstation-state.js:124) and `habits.print` (npc-needs.js:973, :3351); it never reads
  `habits.usb` or any awareness habit. So every server-only key (`usb`, `locksScreen`, `writesDown`,
  `password`, `passwordPattern`, `holdsDoors`, and anything added later) is dropped by an allow list,
  not a deny list. `grep "\.habits" public/break_escape/js` returns exactly those three reads.
- **`usb` still ships only inside the resolved plan, order-independent.** `compile_npc_plan!` runs
  before `withhold_npc_secrets!` (game.rb:5599-5600), but it does not depend on order: the plan is
  built from `scenario_room_npc(id)` (the untouched master record), so `AccessWork.usb_habit`
  (access_work.rb:1213) reads `habits.usb` from a copy the filter never mutated. `work.usb` is the
  only path `usb` reaches the browser; the room copy's `habits.usb` is stripped.
- **No NPC-serving path bypasses the filter.** `withhold_npc_secrets!`/`compile_npc_plan!` have one
  call site (the recursive room payload filter, game.rb:5598-5601). Carry-over
  (carry_over.rb) moves globals only, never NPC records, so no habit leaks there. `verify-run.rb`
  reads the saved (unfiltered) scenario, but it is an author diagnostic that prints to the console,
  not a browser-served path, and it already filters `screen`/`print`/`usb` out of its values line
  and reads `habits.screen` for its own column (verify-run.rb:157-166). The leak scanner
  (access_leak_scanner.rb:1225-1234) scans the actually-served body and flags any shipped `habits`
  key other than `screen`/`print` (including `usb`) as a `withheld_key` leak, matching the filter.
- **Every server habit read funnels through the new location.** `Game#npc_habit`
  (game.rb:2102-2105) is the single generic reader `habits[name]`; `screen`/`print`/`usb` now live
  beside the awareness habits, so the one reader serves all. access_identities.rb:196,
  owner_claim.rb:157/235/260, access_work.rb:1213 all read `habits.*` with a nil-safe `is_a?(Hash)`
  guard. `grep screenHabit|printHabit|usbHabit` over app/lib/public/scripts/tools (excluding the
  fold tables and doc prose) returns no stale read.
- **Loader round-trip keeps folded keys.** `NpcHabits.expanded` (npc_habits.rb:96-104) treats a
  block whose keys are all folded (screen/print/usb) with no level as "nothing to expand" (returns
  nil), exactly as a bare top-level `screenHabit` had no awareness block before; any non-folded key
  (e.g. `password`) marks it an awareness block and it still expands. The `expand!` write-back
  (npc_habits.rb:154-158) re-merges the folded keys onto `plan[:habits]`, so an authored
  `habits.screen`/`.print`/`.usb` survives the awareness write-back. `fill_screen_habit!`
  (npc_habits.rb:205-215) reads and writes `habits.screen`.
- **`habits.password` co-exists with the office-life sub-blocks (test_access_social).** NPCs there
  carry `habits: { password, passwordPattern }` (scenario line 697) and others carry
  `habits.screen`/`.usb`; the fold, the loader expansion, the ship filter (keeps screen, drops
  password) and the schema all handle the mixed block. Validator clean.
- **Stored format-2 game mid-play behaves the same after upgrade.** The `player_state` transform is
  a genuine no-op (STEP_8C[:player_state] = identity): NPC records are not stored in player_state,
  and no habit-derived state is keyed on a habit key name (the usb workaround global is the authored
  `setGlobal` name, stable across the fold). The scenario transform folds `screenHabit ->
  habits.screen` on load, and every reader then reads the new location, so the effective lock/print/
  usb rule is unchanged. The deployed no-op test and build-log chunk 6 live proofs (games
  3334/3322/3345, and the 409 old-tab proofs 3318/3334) cover the stored path.
- **Validator/schema vs loader agree.** Schema moved `screen`/`print`/`usb` into the `habits`
  properties (additionalProperties:false) and dropped the three top-level keys; `validate_scenario`
  dropped them from `known_npc_fields` and routes them through `check_retired_keys` (suppressing the
  redundant unknown-field warning). The loader's `authored`/`expanded` ignore the folded keys as
  non-awareness, so schema and loader treat the same block the same way. All five deployed/test
  scenarios validate with 0 ❌.
- **No sync-size growth.** NPC `habits` reach the client only in transient room payloads, never
  written back into player_state; the player_state transform returns the state unchanged. SYNC SIZE
  rule holds.

## Tests run (at-risk only, no full suites)

- Ruby (RBENV 2.7.8): `format_upgrade_test`, `npc_habits_test`, `format_8c_corpus_test`,
  `format_8c_deployed_noop_test`, `usb_habit_test`, `npc_habits_loader_test`,
  `access_model_withholding_test`, `access_leak_scanner_test`: 169 runs, 1635 assertions, 0F 0E.
- Node: `format-8c-reader-parity`, `workstation-state`, `validator-usb-habit`,
  `validator-retired-keys`, `validator-npc-habits`, `npc-print-forget`: 6 passed, 0 failed.
- Validator (`/usr/bin/ruby3.2 validate_scenario.rb --no-graph`): test_access_social,
  test_access_work, test_access_habits, test_needs_sims, lab_physical_pentest: 0 ❌ each.

## Findings

### Minor 1 (new) - schema `habits` description still says "Never sent to the browser"

`scripts/scenario-schema.json:4277` (the `habits` object description) reads "...Room NPCs only.
Never sent to the browser." After 8c, two of its sub-keys (`screen`, `print`) are allow-listed and
do ship to the client (game.rb SHIPPED_HABIT_KEYS; the client reads `npc.habits.screen`/`.print`).
The sibling `awareness` (4274) and `role`/`creds` (4259/4263) descriptions are still true, but this
one is now inaccurate for the two shipped sub-keys. This slipped the R1 split: the client reviewer
left the schema to the server reviewer, and the server findings did not cover the description text.

- Failure scenario: an author reads the schema and believes `habits.screen` is server-only, so they
  tuck something sensitive beside `lockChance` expecting it withheld. The sub-block schema
  (additionalProperties:false with only lockChance/lockIfAwayOverSeconds/_comment) actually blocks
  that, so the risk is contained to misunderstanding, not a leak. Doc-only.
- Fix: amend 4277 to note that `screen` and `print` ship to the browser while the rest of the block
  (awareness habits, `usb`) does not, for example "...Room NPCs only. Only `screen` and `print` are
  sent to the browser; the rest of the block is server-only." Confidence worth changing: low;
  acceptable to leave, since the per-key behaviour is enforced by the ship filter and tested.

### R1 server minors M1-M3 - acceptable as left

All three (format_upgrade.rb:490-502 conflicting-value drop; :483-487 non-Hash `habits` overwrite;
npc_habits.rb:96-104 empty `habits: {}` now returns nil) are reachable only from hand-corrupted or
schema-invalid data and carry no runtime or shipped-payload effect; the "folded value wins" rule in
M1 is what makes the transform idempotent. None should block the ship. If a cheap pin is wanted, M1
(folded value wins, top-level dropped) is the one worth a one-line unit assertion, since it is the
load-bearing idempotency guarantee rather than pure corrupt-data defence; still optional.

### R1 client minors - confirmed closed in 4e6d5161d

README_scenario_design.md:1100 restores "a station's `affordance.offWhen`"; test/fixtures/format_8c/
README.md has 0 em dashes. Both verified in the tree.
