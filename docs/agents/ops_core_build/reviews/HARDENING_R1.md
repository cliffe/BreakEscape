# Ops hardening: review R1

Reviewer: Opus 5.5, round 1. Branch `ops-hardening` (`/data/be-ops-skin`), head `e1dde1015`, base `0402ed2be` (the brief's
cut; "main" below means that base unless said otherwise; `main` itself has moved on to 1.0.24).

**Verdict: not clean** (0 blockers, 1 major, 9 minors).

## Evidence


- Test run (reviewer, head e1dde1015, under flock): 1163 runs over every test/unit/access_leak*, *scanner*, route_room_key and the ops scenario tests: 4 failures (2 in access_leak_check_cli_tags_test.rb, 2 MAPDRIFT in demo_ops_passwords/ops_crack scenario tests).
- Stage check (reviewer, `access-leak-check.rb` on the dev games, no entries): C1 (242), C2 (243), C3 (241) exit 0 "no leaks
  found"; C5 (227) exit 2 under the default and exit 0 with `--untagged --signin hana@code_pc1#1 --signin cal@plain_pc#1`; C1 with
  `--signin` or `--logout` exit 2 (T8); C2 with an unmatched `--resume` exits 2 on the unused entry, not on the mode; C1 with
  `--untagged` exit 2.
- Untagged parity (reviewer scratch run, base `0402ed2be` scanner against the branch, library, no game): C1/C2/C3 with every tag
  stripped under `:auto`, C5 under `:absent` with and without names, `ops_mfa_real_capture_rows`, both privilege browser runs
  (with and without names), the four run72 files, `ops_crack_game85_net_sweep`, `ops_mfa_verify_lockout_rows`: identical
  findings on both. Tagged under `:required`: C1 0 (base 2, the two closures), C3 0. C2 gives 30 harvest findings in the library
  without a game (base 317); with the game (the CLI) it is clean, so they are the borrow `cachedAt` rule needing the game record,
  not a tag defect.
- "Fails on main" rerun (reviewer, section 7 item 6): `access_leak_scanner_tags_crack_test.rb` with `SCANNER_UNDER_TEST` set to the
  base scanner, and a scratch copy of `access_leak_scanner_tags_mfa_test.rb` pointed at it: T11 (H2), T12 and T12b (H3), T13 (H1),
  the H4 cases, T6, T6g, T6j, T6b (second-step half), T9, P2, P5, P7/P10, P8 (a) and (b) and T7 all fail on the base; the
  honest cases (T6c to T6f, T6h, T6i, T6k, T6m, T6l first half) pass on both. Scratch copy removed.
- `bin/ops-golden-compare` (not under flock): 45 runs, 0 failures. U4's predicate matches `object_in_unpromoted_route_room?`
  (`is_route_room && !is_unlocked`, with `is_unlocked` read before any auto-unlock; the door branch sets the key only inside
  `gated_route_room? && !room_unlocked?`), so the both-lists interim gets no key; `route_room_key_test.rb` covers the four cases.
- Code read in full: the scanner diff (modes, `tag_problem`, `pc_tag_state`, the privilege readers, the 3.3 tag rule and present
  map, the second-step readers, the crack per-record state), the lock rules diff (P11, K1 with `@ls_k1_ids` and
  `@ls_route_shut`), the CLI diff, U7's assertion diff (every `assert*` change matches its commit message; the `mfa_r2`
  `earlier = unplaced(...)` change sets `pc: nil` on rows of a tagged scan, as the rule says), and the regenerated
  `ops_helpdesk_real_capture_rows.jsonl` (13 `login` keys became `pc` with the same ids, the other PC-route rows gained `pc`,
  three non-tag rows carry fresh server bodies).
- Checked and holding: a `null` tag never places, credits or exempts (`row_pc_tag_raw` and `crack_row_tag` give nil); `:auto`
  reads no tag in an untagged file (`@tags_on` false); T1 to T5 and T16 are refusals in the library (mode test) and the CLI;
  the query-beats-body row is unplaced; a rejected tag gives `[admitting, false]` (privilege) and every PC / the admitting PCs
  (second step), so it never narrows an end; a rejected lock or logout tag ends what `pc: null` ends; the window opens only on a
  200 `success: true` sign-in with `npcId` at an accepted tag; a sessions map with no session at the tagged PC is an end
  (R5-1); the present map is never read by an earn rule (the U1b test that stubs the rule out gives the same earn state); the
  route lists match `response-capture.js` (`path` there is the pathname, so the scanner's `split('?')` is equivalent); K1 is
  inert without the key and nested movable ids are cut at any depth.

## Findings

### Major

**R1-M1. Two CLI tests fail at the branch head, so the train is red and the CLI half of section 7 item 4 has no passing test.**
`test/unit/access_leak_check_cli_tags_test.rb` "a tagged capture is judged in the default mode, with a --resume entry allowed"
(`:140`) and "entries that match no row still exit 2 with --untagged" (`:176`) name `omar@front_pc`, but
`test/fixtures/files/access_leak/scenario.json` has no account `omar`, so the scanner stops at "omar is not an account of this
scenario" before the unused-entry message. U1a and U3 both reported it; no later unit owned it and U8 did not fix it. The
behaviour is right (reviewer: C2 with an unmatched `--resume` exits 2 on the unused entry, not on the mode; C5 under `--untagged`
with its names passes), so the fix is in the test only: use an account and a PC that the fixture scenario holds and that admits
it, so the entry parses and then matches no row. Re-run the file and list it in the train counts.

### Minor

**R1-m1. The CLI header and usage still teach names for a new run** (section 7 item 8). `access-leak-check.rb:7-31` describe
`--signin`/`--logout` as the general way to place a sign-in, and `:24-26` still say "the recorder writes no PC for it. An honest
run of test_ops_mfa's playtest needs `--signin hana@code_pc1#1 --signin cal@plain_pc#1`"; `:32` and the usage string still
describe the `login` refusal as the only tag rule. U5 appended a "Capture modes" block (`:34-45`) instead of rewriting the header
as the brief asked. A tester who follows the old lines gets exit 2 (fails closed), so it is not a leak, but the header contradicts
itself. Fix: mark `:7-31` as the `--untagged` (older capture) entries, drop the "honest run needs" sentence, and add `--untagged`
and "tagged: no `--signin`/`--logout`" to the usage text. (The lock rules header `:19`, "the recorder writes no request body for
POST /mfa/*", is still literally true but now reads oddly beside the P11 text; optional.)

**R1-m2. The host-label cross-check runs only when the label maps to one PC.** `pc_tag_state` rejects a remote sign-in whose
`host` label disagrees with the tag only when `@ops_host_by_label[label]` resolves (a unique label). For a label that names no PC
or is shared, the tag is accepted and earns at the tagged PC, where the base (label rule, `priv_signin_candidates`) earned
nothing. The earn matches what the server was asked (`params[:pc_id]`), so this is not a leak path, but 3.3's cross-check
("the PC of a remote sign-in's host label") is weaker than it reads. Suggest comparing the label with the tagged PC's own label
(`pc['host'].presence || pc['name']`, as `ops_host_labels` builds it) and rejecting on a mismatch, which also covers shared labels.

**R1-m3. The desk rules read the raw tag where the second-step rule reads the checked one.** `hd_row_tag`
(`helpdesk_leak_rules.rb:654-656`) calls `mfa_row_pc_tag`, i.e. `row_pc_tag` with no `pc_tag_state` check, while the
second-step close in `scan_mfa` now uses `mfa_tag_for`. On a 200 cancel, expiry or lockout row whose tag is rejected (an answer
`pcId` that disagrees), the second-step rule closes every open step of the kind and the desk record closes only the tagged
PC's own step, which breaks the R1-SCANNER1 invariant written above `hd_note_own_close` ("the two never disagree"). Low impact
(an own-phone pass still needs the step in `@mfa_pending`, which is closed), and the brief told U1a to keep `mfa_row_pc_tag` as a
plain call, so the brief was thin here. Fix outside this stage's file list (`helpdesk_leak_rules.rb` is on the do-not-touch
list), or make `mfa_row_pc_tag` itself take the body; record it as a limit otherwise.

**R1-m4. T6e is one variant of four.** The brief asks for T6e with an admin and a non-admin account, each with and without a
`--resume` entry. `access_leak_scanner_tags_mfa_test.rb:277` loops over `%w[hana]` only (non-admin, no resume) on
`test_ops_mfa`; no case runs the present map with the privilege rules active (where `downgrade_priv_step` and
`@priv_resumable` were the R4-1 failure) or with a `resumes:` entry. The code keeps the map apart from earn state, so I expect them
to pass; add the three cases on `test_ops_privilege` rows.

**R1-m5. `hand_tag_problem` is still in the scanner.** No caller is left outside its own test
(`access_leak_scanner_tags_mode_test.rb:192`); U7 moved `mfa_r2` to `tag_problem`. Remove the alias and that test, as the U1a
handover planned for U8.

**R1-m6. Two Done items are missing from the units' records.** U1b's handover (each 3.3 path with the test that covers it) was
not written; U8's commit has no body, so the stage check it owns (C1 to C4 exit 0, C5 exit 2 then 0 with `--untagged`) is not
recorded. The reviewer ran it (Evidence above); put the result in `HARDEN_limits.md` or the next commit.

**R1-m7. U4 has no recorded owner yes.** Decision 4 builds U4 only after owner question 1 is answered yes; nothing on the branch
records the answer (brief, U4 commit, `HARDEN_limits.md`). Record it (date and wording) in `HARDEN_limits.md`. Section 7 item 7
also names a payload scan and an opened-state scan; U4 reports only the golden compare, so name the two runs and their results.

**R1-m8. The branch is behind `main` (1.0.22 against 1.0.24).** `ops_crack_scenario_test` and `demo_ops_passwords_scenario_test`
"mapping indexes have not drifted" fail because `tools/check_mapping_index_drift.rb` compares against `main`, where
`demo_ops_passwords` has moved on. Not a branch defect; merge `main` (merge, not rebase) before the train, then re-run the leak
check stage on the merged head.

**R1-m9. Capture coverage is narrower than 5.1, and no test reads C2.** C4 was not recorded (P11, T14, T15 use server-answer
rows, as 5.1 allows); C1's and C2's extra beats were not driven (T6c and the P1/P3/P6 two-PC shapes are built rows). C2 is
checked only through the CLI against dev game 243 (its harvest rules need the game's `cachedAt` record; the library without a
game gives 30 harvest findings), so the stage proof depends on a dev database row. The U6 README's "no leaks found on C1 to C3
with the current CLI" cannot have been run on `97414316c` (that CLI calls `tag_problem`, which landed later in U1a); the claim
holds now (reviewer run), so correct the README line or note when it was checked.

## Verdict

**Not clean**: one major (R1-M1, a failing test pair that makes the train red; the behaviour it covers is correct). The
scanner's rule holds on everything I checked: no input that the base reported passes on the branch untagged; every tamper the
brief lists is caught and fails on the base; the honest captures C1 to C3 are clean with no entries; C5 is refused by default and
passes with `--untagged` and its names; K1 is inert without the key. A delta round after R1-M1 (and ideally R1-m1, m4 to m6) can
be Sonnet; nothing here touches what the server serves.
