# Ops hardening: review R2

Reviewer: Opus 5.5, round 2. Branch `ops-hardening` (`/data/be-ops-skin`), head `8188e8fbd`. Fix commits `3fb0cd9dc` (R1-M1),
`41c063295` (R1-m1 to m7, m9), `8188e8fbd` (rubocop layout); merge of `main` (1.0.24) `e2fb2c9fe`.

**Verdict: clean** (0 blockers, 0 majors, 4 minors). The minors are a test gap, docs and one record; R2-m1 needs the owner's
word before this branch merges to `main`.

## Evidence

- **Test run** (reviewer, head `8188e8fbd`, under `flock /home/deploy/BreakEscape/tmp/tests.lock`): every `test/unit/access_leak*`
  file plus every `*_test.rb` named `*scanner*` or `*leak*` elsewhere, `route_room_key_test.rb`, `ops_crack_scenario_test.rb` and
  `demo_ops_passwords_scenario_test.rb` (57 files): **1147 runs, 72987 assertions, 0 failures, 0 errors, 0 skips**. The two R1-M1
  CLI tests and the two R1-m8 mapping-drift tests now pass.
- **`bin/ops-golden-compare`** (not under flock; it takes the lock itself): 45 runs, 0 failures.
- **`bin/rubocop`** on the CLI, the scanner, the desk rules, the two changed tests and `games_controller.rb`: no offenses.
- **Stage check** (`access-leak-check.rb` on the dev games, the files in `test/fixtures/files/access_leak/tagged/`, no entries):
  C1 (242), C2 (243), C3 (241) exit 0 "VERDICT: no leaks found."; C5 (227) exit 2 by default ("the capture holds no recorder
  tags ... pass --untagged"), exit 0 "no leaks found" with `--untagged --signin hana@code_pc1#1 --signin cal@plain_pc#1`
  (exit 1, 2 findings, with `--untagged` and no names, as before); C1 with `--signin` exit 2 (tagged takes no entries).
- **R1-m2 on real rows.** C1 to C3 hold 8 tagged remote sign-ins with a host label (`code_pc1`/ACC01, `bay_pc`/BAY01,
  `hot_desk`/HOT01, `store_pc`/RECS01, `eli_pc`/STO01); all pass the own-label check, so the stricter rule rejects no honest row.
  The server writes `host` as `host_label(find_login_pc(pc_id))` (`game.rb:4879-4890`), the same `pc['host'].presence ||
  pc['name']` the scanner compares, for the PC the request named.
- **Scratch probes** (reviewer, a file in the scratchpad reopening `AccessLeakScannerTagsModeTest`, run under flock, nothing
  left in the worktree): real row 59 tagged `bay_pc` with host `NOSUCH01` gives `ops_tag tag:login`, nothing earned or held;
  with host `nil` the tag stands (adel held at `bay_pc`). The four T6e variants: admin with `--resume` uses its entry and is
  clean; admin without it gives only `ops_string ops:key:access` at row 5 (the 403 `off` ended B, which is what a resume entry is
  for; no tag finding); non-admin without is clean; **non-admin with `--resume` leaves its entry unused** (R2-m3).

## R1 findings

| R1 | Status | Evidence |
|---|---|---|
| M1 | closed | `3fb0cd9dc`: `omar@front_pc` -> `jake@jake_pc` (both in `test/fixtures/files/access_leak/scenario.json`); the file passes in the run above. |
| m1 | closed | CLI header opens with "a tagged capture needs NO `--signin`, `--logout`", marks the old block "(Untagged captures.)", drops the "honest run needs" sentence (now "with `--untagged`, a run ... needs"); the usage string nests `--signin`/`--logout` under `--untagged` and says a tagged capture takes neither. |
| m2 | closed (no test, R2-m4) | `pc_tag_state`: a string label must equal the tagged PC's own label, else `[:rejected, nil]`; unknown and shared labels now fail closed. Honest real rows pass (above). |
| m3 | closed (no test, R2-m4) | `hd_row_tag(body)` now calls `mfa_tag_for(body, @hd_row)`, the reader the second-step close at `access_leak_scanner.rb:5454` uses, with the same root body; the R1-SCANNER1 invariant holds again. |
| m4 | mostly closed | four variants on the privilege rules in `access_leak_scanner_tags_mode_test.rb`; three exercise what they name, the non-admin `--resume` one does not (R2-m3). |
| m5 | closed | `hand_tag_problem` and its test removed; handover updated; no caller left (grep). |
| m6 | closed | `HARDEN_limits.md` holds the U1b path-to-test list and the R1 stage check. |
| m7 | not closed as asked | recorded as an orchestrator decision, not the owner's (R2-m1). |
| m8 | closed | merge `e2fb2c9fe`; the mapping-drift tests pass. |
| m9 | closed | C2 now read by a library test (tag rules empty, no unused entry, the harvest set pinned); README line dated. |

## The merge with main

Four files changed on both sides (`docs/ACCESS_AND_NETWORKS.md` and the PLAYTEST.md of `demo_ops_passwords`,
`demo_ops_second_step`, `test_ops_privilege`); every added line of either side is present in the merged file. The code files
from `main` (`helpdesk_leak_rules.rb`'s device-in-use excuse, `lock_second_step.rb`, `mfa_sign_in.rb`, `verify-run.rb`) were
changed on one side only. The device-in-use excuse (`hd_live_code_gate?`) reads the lock rules' gates (`@ls_games`), which come
from lock answers, not from any tag; it reads no `pc` tag, and the R1-m3 change touches only the cancel/expiry/lockout close,
so the excuse works the same with tags. Its real-run test and `..._lock_step_both_test.rb` pass in the run above. The merge did
leave two pieces of `main` text that teach names for a tagged run (R2-m2).

## `routeRoom` (U4)

- Set in two places only: `GET room` when `is_route_room && !is_unlocked` (`games_controller.rb:622`, `is_unlocked` read
  before any auto-unlock, and a route room is never auto-unlocked), and the door open when `gated_route_room? &&
  !room_unlocked?` recorded the room in `npcRouteRooms` (`:1336`). Both are the predicate of `object_in_unpromoted_route_room?`;
  a room in both lists (the interim) is unlocked, so it gets no key. `route_room_key_test.rb` covers present, promoted and
  ordinary rooms; it passes.
- What it reveals: only that the room the player is standing in is served but not yet earned, which the player already meets
  as `room_not_reachable` on its objects. No id, no list, nothing from `npcRouteRooms` beyond the room in the answer itself; no
  client code reads the key. It is added to answers that are sent anyway, never opens or serves anything.
- Shipped scenarios: golden compare clean (45 runs); only `lab_physical_pentest` and `test_gate_tailgate` have route rooms, and
  neither has a lock step, so the K1 reader changes no shipped result.

## Findings

### Minor

**R2-m1. The `routeRoom` yes is the orchestrator's, not the owner's.** Decision 4 of the brief builds U4 "only after the owner
says yes". `41c063295` records "Decision (orchestrator, 2026-11-25): YES" in the brief and `HARDEN_limits.md`, and rewrites
decision 4 to "answered YES on 2026-11-25". The code is sound (above), so this is not a defect in it, but the gate R1-m7 asked to
record is still open: the owner should confirm (or the record should say the owner did, with the wording) before this branch
merges to `main`. If the owner says no, revert U4; K1 is inert without the key.

**R2-m2. Two merged PLAYTEST lines from `main` still teach names for a tagged run.** `scenarios/demo_ops_passwords/PLAYTEST.md:121`
(Run D, from `main`) says "the leak check names every keyboard sign-in" and "every sign-out ... needs a `--logout` entry", against
line 23 of the same file (a new run takes no `--signin`/`--logout`, exit 2 if given). `scenarios/test_ops_privilege/PLAYTEST.md:81`
(from `main`) says to "take the PC for each from that capture row's `pc` field", inside the "older capture, no tags" section,
where there is no `pc` field. Both fail closed (exit 2), so not a leak. Fix: say Run D's check takes no entries on a new run
(the names apply only with `--untagged`), and drop the `pc` field sentence from the untagged section.

**R2-m3. The non-admin T6e variant with `--resume` never uses its entry.** `access_leak_scanner_tags_mode_test.rb`, "T6e (privilege
rules): non-admin account, with a --resume entry": `scanner.unused_entries` is `["priya@sam_pc@2026-11-24T00:10:05.000Z
(--resume)"]` (reviewer probe), so the CLI would exit 2 on it, and the case is the plain one again. The test asserts only
`tag_rules`. Add `assert_empty scanner.unused_entries` for the resume variants and give the non-admin case a session the
resume rule restores, or name it as the no-op case it is.

**R2-m4. R1-m2 and R1-m3 changed behaviour with no test of their own.** T9 still covers only "another PC's label". Add the
unknown-label case (the reviewer probe above: `ops_tag tag:login`, nothing earned) and a shared-label case, and one desk-rule
case where a 200 cancel with a refuting `pcId` closes the same steps in `@mfa_pending` and the desk record.

(Not a finding: `8188e8fbd` puts `else`/`end` of `row['body'] = if` at column 4 with the branches at column 20. Rubocop's
`EndAlignment` accepts it; it reads oddly and could be a plain `if` on separate lines.)

## Verdict

**Clean**: no blocker, no major. Every R1 finding is closed in code except R1-m7's record (R2-m1), the merge kept both sides,
`routeRoom` appears only on unpromoted route-room answers, reveals nothing the player does not meet, and changes no shipped
scenario (golden clean). Every scanner test passes once (1147 runs), C1 to C3 scan clean with no entries, and C5 is refused by
default and clean with `--untagged` and its names. Fix R2-m2 to m4 when convenient; get the owner's word on R2-m1 before merging
to `main`.
