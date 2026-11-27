# Ops layer plans: cross-plan review, round 4 (delta)

Scope: commits `c6d80bf4c` (Y1 to Y8) and `8286ad26c` (Y9 to Y15) against the working tree on
`docs/ops-layer-plan`. CRACK ignored. Short names: CORE, PRIV, SKIN, MFA, LOG, LOCK. `LOG:690` means
`docs/achitechture/OPS_LOG_ROWS_PLAN.md` line 690.

Counts: 0 blockers, 0 majors, 6 minors, 3 nits. Nothing is above minor; the Y1 to Y15 fixes are
applied and agree on names, owner stages and functions.

## Checked and clean

- **Y1.** No plan or the brief says the core plan builds `bin/ops-golden-compare`, `ops_unchanged/` or
  the capture task. CORE:1223-1235, :1497, :1557; PRIV:735-737, :867, :900, :974; LOCK:545, :556;
  LOG:499, :689-696; brief:109 all point to LOG L1a (build step 8, `ops:unchanged:capture`,
  `lib/tasks/ops_unchanged.rake`). Outline section 5 puts L1a and L1b before S1, so CORE step 1 has
  the mechanism before it needs it. MFA:893-895 and SKIN:636-640 build none.
- **Y2.** The spec (strip empty `ACCESS_STATE_DEFAULTS` keys absent from the fixture, freeze the clock)
  sits once, LOG:693-698. CORE:1235 and PRIV:269-275, :974-976 point to it. No plan asks for key
  registration any more.
- **Y3.** Knock-out test is the same three-part test in MFA:231-234, :781-783, :851 and LOCK:505-509,
  with the server-gate versus client-refusal split. Checked against `game.rb:2037-2059` (excludes
  `koImmune` and `npcType: 'phone'` only).
- **Y4.** MFA:851 folds declared grants into "nobody can get"; MFA:852 no longer calls them too easy;
  LOCK:509 agrees.
- **Y5.** `MfaModel.held_item_sources` is defined once, MFA:228-235 (M1a, MFA:126). LOCK:205-206, :502,
  :662 only reuse it and add `lock_step_never_passes?`. Its unit cases are in one list, MFA:923; LOCK:566
  defers to it. MFA:851 and :857 call it.
- **Y6, Y7, Y8, Y12, Y13, Y15.** Applied where named (LOG:182, LOG:227; SKIN:639; MFA:339, :1033;
  MFA:722, :725 and LOCK:408; LOG:690-691 and LOCK:552-553). See Z3, Z9 for loose ends.
- No plan file mentions a review, a round or a finding id (grep for round, reviewer, `Y<n>`, `X<n>`).

## Findings

### Minor

**Z1. CORE's build-order paragraph still puts L1a before step 2, but step 1 now needs it.** CORE changes.
- CORE:1497 (step 1, "before S1") records fixtures "with the shared helper, folder and rake task the log
  plan's L1a built".
- CORE:1484-1485 says the log feature's first stage "lands on main before step 2". With step 1 using the
  mechanism, L1a must land before step 1. CORE:1560 "the helper is the one thing this plan needs from
  another plan" is also ambiguous (event helper or golden helper; it is both).
Fix: CORE:1484 "before step 1"; CORE:1560 "the log plan's L1a (the event helper and the golden mechanism)".

**Z2. LOG L1a gains the golden mechanism with no ordering, test or size note.** LOG changes.
- LOG:689-698 (step 8) is last, but it says the rake task writes fixtures "from main before any engine
  change"; L1a steps 2 to 4 edit `game.rb` (LOG:679-683, the concern and the clock stamp), and LOG:499
  captures `log_unlock_refusals.json` and `log_container_cases.json` with it. If step 8 runs last, the
  LOG fixtures are not main's own output (the clock stamp changes the bootstrap state).
- LOG step 7 and section 11 list no test of the mechanism (the strip rule, the clock freeze, a run that
  fails on a changed answer). `grep golden` over LOG finds only :499-500 and :690.
- The L1a row (LOG:92) stays size M; the outline (OUTLINE:143) still describes L1a as "the helper and the
  event list, no rows of its own".
Fix: make the mechanism step 1 of L1a (or say "capture before steps 2 to 4"); add its unit cases to
step 7; note the larger size; add "and the shared golden mechanism" to OUTLINE:143.

**Z3. MFA:882 still says "five sites"; Y12 made seven.** MFA changes.
- MFA:339 now lists `attempt_login!`, `account_locked_out_at?`, `AccessWork.locked_out_at?`,
  `lockout_pcs_for_client`, `account_login_key?`, `record_login_failure!`, `add_login_lockout!`.
- MFA:882 (unchanged-behaviour table) reads "built and split by the two `AccessIdentities` functions at
  five sites".
Fix: "seven sites" or "every site of section 5.2".

**Z4. The refused-`badge_swipe` guard (Y11) names no mechanism and has no test.** LOCK and LOG change.
- LOCK:251 says `validate_unlock` refuses the object "before the log plan's refused `badge_swipe` row
  (L1b) is written". But L1b writes that row in the same refusal branch (`games_controller.rb:1236-1252`,
  LOG:231 "Refused (`:1252`)"), which `validate_unlock` returning false enters. Rule C does not run
  "before" it; the row condition has to read it.
- LOG:234 says "its guard runs first and writes no row" with no condition. L1b lands before
  `behind_closed_step?` exists, so someone has to edit L1b's call site in G1. LOCK:661 (shared-file row for
  `games_controller.rb`) does not list it, and the "Nothing leaves or opens early" test row (LOCK:588)
  has no rfid-below-a-closed-step case.
Fix: LOG:231 adds "and not `behind_closed_step?(path)`, once S8c lands"; LOCK:251 says G1 adds that test to
L1b's refused-row condition, lists it at LOCK:661 and adds the case at LOCK:588.

**Z5. `POST /helpdesk/request` closed list (Y9) has a condition 5.2 does not have and no client mapping.**
MFA changes.
- MFA:727: `unavailable` includes "not signed in where the desk needs it". `request_helpdesk!`
  (MFA:498-505) checks desk, NPC met and not knocked out, `what`, tries, username, rule; nothing about
  being signed in. Either the condition is invented or 5.2 is missing it.
- MFA:666: the `helpdesk-request` scene sets `helpdesk_<deskId>_result` to `granted`, `refused` or
  `blocked`, and `helpdesk_answered` carries `result`. The new `bad_request`, `not_found` and
  `unavailable` have no value there.
Fix: drop the sign-in clause (or add it to MFA:498-505 with its validator rule); say the scene maps
`bad_request`, `not_found` and `unavailable` to `refused`'s line or to a fourth value, and list it at MFA:666.

**Z6. Y10 is half applied.** LOG changes.
- Done: PRIV:880-883 names the `#container` site; LOG:318 says the shared check writes no rows.
- Not done: LOG's shared-file table (LOG:743 area) still lists `games_controller.rb` for the `set_game` lists
  only, so `#container` (S5a, L3, LOCK) is unlisted. There is no test that `/log_rows` on a reader inside an
  admin-opened profile writes no `admin_profile_read` (`grep admin_profile_read` over LOG: :318, :1118, :1203
  only). The statement has no check behind it.
Fix: add `#container` to LOG's shared-file table and one test line in LOG section 11.

### Nits

**Z7. Knock-out wording left in three places (Y3).** MFA:78 (section 2.1 table) still says "accepted only for
a met room NPC that is not `koImmune`"; MFA:863 (information lines) says "`koImmune` closes it". Both name
one of the three exclusions. Fix: "cannot be knocked out (section 5.2)".

**Z8. Y15 and Y1 edits leave rough prose.** LOG:690-692 puts a long parenthesis between "played through the
real routes" and its own list "(bootstrap, room answers, ...)"; read as two clauses. LOG's cross-plan
requests (LOG:1187 onwards) carry no item telling CORE, PRIV, MFA and LOCK to use the L1a mechanism, and
MFA:893-895 says "builds no golden mechanism" without naming L1a. Fix: reorder the sentence; add one
request line; name L1a in MFA.

**Z9. `held_item_sources` return shape is unstated, and SKIN:976 omits the new folder.** MFA:228-235 gives
the signature `held_item_sources(scenario)` and no return value, though MFA:857 asks "lists no phone" and
LOCK:502 asks for a device type; say it returns items with their `type` and `id` (or takes a type). SKIN:976
(K1 build row) says "save the scene's DOM" without the `test/js/fixtures/network-view/unchanged/` path now
named at SKIN:639.
