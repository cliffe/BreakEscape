# Ops layer plans: cross-plan review, round 5 (delta)

Scope: `git diff ac2da7ee6 HEAD -- docs/achitechture/` (21 commits, ending `6d9fd6f6b`), joins
between plans only. Core internals are left to the parallel core delta review. CRACK checked only
against `docs/agents/ops_layer/BRIEF_cracking_reviser.md`. Short names: CORE, PRIV, SKIN, MFA,
LOG, LOCK, CRACK, OUTLINE. `LOG:1125` means `docs/achitechture/OPS_LOG_ROWS_PLAN.md` line 1125.

Counts: 0 blockers, 2 majors, 3 minors, 3 nits.

## Checked and clean

- **R4 findings.** Z1 (core step order), Z2 (golden mechanism is L1a build step 1, captured before
  the `game.rb` edits, unit cases at LOG:510-512, size L, OUTLINE:143), Z3 (MFA:887 "seven
  sites"), Z4 (LOG:233-238, LOCK:943 shared-file row, LOCK:1004, LOG:714-718 test), Z6 (LOG:759,
  LOG:644-646), Z7 (MFA:78, MFA:866), Z8 (LOG:1245-1246, MFA:899-900) and Z9 (MFA:228-230 return
  shape) are applied. Z5 is half applied: see F1.
- **Network rows (SHARED-4).** CORE:1772-1777 and the LOG S1 to S3 rows (LOG:1125-1131, request 3
  at LOG:1213-1218) agree on the six event names, details, the `refused` list (`not_responding`
  plus the eight 422 codes, CORE:604-606) and the `save_limit` registrations (`ok` 10 on
  `network_swept` and `technique_used`, `refused` 10 on `technique_refused`). `network_alerted`
  and the `how` detail are gone from LOG and SKIN. Every sweep and every technique use writes; scan,
  check and confirm write the first time.
- **Twelve refusal codes.** CORE:1096-1102 and SKIN:439, :752, :840, :1095 agree; SKIN has no
  `network_only`, evidence, probe, noise or alerted left.
- **Planting and implants (PRIV-7).** PRIV:397-445 (any unlocked admin session on a powered PC
  overrides a plant; a `needsSession` device takes only a keyboard session; `needs_console` from
  the implant path), CORE:885 and CORE:1821-1824, LOG:1132 (`usb_install_overridden` from any admin
  session) agree. Helper names `session_grant_pc`/`sessionGrantPc`, `keyboard_admin?`/`keyboardAdmin`,
  `plantAdmin` are defined once (PRIV) and named by no other plan differently.
- **Harvest is always a hash (SHARED-3).** PRIV:1243-1247 and LOG:1133 drop `hashes`; LOG:1059
  `EVENTS` line matches. PRIV:1271-1310 gives CRACK `harvested` as a string keyed by the sign-in PC,
  the `crack` recipe on a record with no habit, and S5b after S7, as the cracking brief rules.
- **Lock joins.** `held_item_sources` and `lock_step_never_passes?` are named the same in MFA and
  LOCK. Both `badge_swipe` rows need `method: "rfid"` in LOG:222-238, LOG:1168-1169 and LOCK:983-987.
  `mfa_challenge` gains `method` at doors and objects (LOG:1145-1149, LOCK:970). `npcStepGrants` and
  `npcStepOpener` appear only in LOCK and are never sent as state (LOCK:663).
- **Helpdesk stop lifts (MFA-8).** MFA:206, :256, :501-505, :733, :812, :951, :1004; LOG's
  `helpdesk_request` row (LOG:1142) needs no change.
- **Skin failure path.** `recordSent`, `recordResult` and `REQUEST_FAILED_TEXT` live in SKIN only and
  hook into CORE's `perform` path, which CORE:1712 says S6 routes through.
- **Build order.** No build row reads code from a later stage. CORE's `needs.session` falls back
  until `session_access` lands (CORE:589-593); PRIV's collect relies on CORE's
  `desktop_request_allowed?` terms (CORE:1814-1816 confirms); S5b adds `harvested` after S7; G1 edits
  L1b's refused branch.
- **player_state.** New keys (`helpdeskTries.stoppedAt`, `cachedAt`, `harvestedAccounts`,
  `lockSteps`, `npcStepGrants`) are server-only, bounded and never sent.
- **Unchanged scenarios.** Every changed plan captures through L1a's mechanism before its first
  engine edit (LOG:1245-1246; LOCK:934-935; MFA:899-900; PRIV:1228-1229). CORE:1352 says no scenario
  that has a foothold also has a borrow, so the borrow change is not a visible change.

## Findings

### Major

**F1. The helpdesk "signed in where the desk needs it" check has no input and no session rule.**
MFA changes.
- MFA:500-502 adds to `request_helpdesk!`: "a request made over a PC needs an open session at that
  PC; one made to the NPC in person needs none". MFA:733 lists it under `unavailable`.
- Nothing tells the server a request is "over a PC" or which PC. The route's params are `desk_id`,
  `username`, `what`, `answers` (MFA:733); a desk has `npc`, `verify`, `questions`, `maxTries`,
  `resets`, `questionLabels` and no PC field (MFA:202-211); the scene opens from an ink tag or a
  pretext ask (MFA:666-668). So the check cannot be built, and it cannot be tested (MFA:951's
  "a request with no session where the desk needs one is `unavailable`").
- It also says nothing about which session counts. CORE:871-890 and PRIV:403-445 now separate
  keyboard, remote and technique sessions (a technique session is served the desktop but is not at
  the keyboard; it cannot lock). "An open session at that PC" reads `access_sessions[pc]` and so
  accepts a technique or relay session; that may be right, but the plan has to say it.
- Fix (MFA): either drop the clause and its test (as R4 Z5 suggested), or add a desk field
  (`pc`: the sign-in PC the desk is reached through) and a validator rule, state which sessions
  meet it (recommended: any live, unlocked session at that PC, keyboard, remote or technique, as
  for a desktop served through `desktop_request_allowed?`), and add a test per kind.

**F2. Does a crack write a log row? Three documents disagree.** Orchestrator settles; then LOG or
PRIV and the cracking brief change.
- LOG:1158-1160 and request 7 at LOG:1238: "S7 (offline cracking) write[s] no rows ... cracking
  happens on the attacker's own machine".
- PRIV:1247 (new in this delta): "a crack is the cracking plan's row."
- The cracking brief tells the reviser to "delete the plan's own log row list; give a section 13
  table in the log rows plan's format ... using `write_log_row!`", which reads as rows to write;
  CRACK:313-317 today lists `hash_obtained`, `crack_run`, `crack_yield`.
- The cracking reviser is running against that brief now, so it will add rows LOG says do not exist
  (and no `EVENTS` lines). LOG's reading is the more accurate lesson (an offline crack leaves no
  trace on the target), and SHARED-4 covers sweeps and technique uses, not cracks.
- Fix: keep LOG's rule. PRIV:1247 becomes "a crack writes no row (it is offline; the log plan's
  rule)"; tell the cracking reviser that its section 13 states "no rows" with LOG:1158 as the
  reason, and that `hash_obtained` is covered by `credentials_harvested` or `share_folder_opened`.

### Minor

**F3. CORE's sweep test passes `save_limit: true` on the first sweep; LOG and CORE section 13 say
the first sweep passes none.** CORE changes (a join with LOG's contract, so listed here).
- CORE:1435 (`network_scan_test.rb`): "the first sweep's `network_swept` row and the `host_scanned`
  row, the first passed with `save_limit: true` and the second once only".
- CORE:1789 and LOG:1125, LOG:1216-1217: the first sweep passes no limit and keeps the route's save;
  only a repeat passes `save_limit: true`.
- Fix: CORE:1435 "the first sweep's `network_swept` row passed with no limit, a repeat's with
  `save_limit: true`, and the `host_scanned` row once only".

**F4. LOG's request to PRIV still names the `hashes` detail.** LOG changes.
- LOG:1219-1220 (request 4): "the harvest detail is `count` and `hashes`, each `{ count: 9 }`".
- LOG:1059, LOG:1133 and PRIV:1243 have `count` only.
- Fix: LOG:1219 "the harvest detail is `count` (`{ count: 9 }`, hashes added), a collect adding at
  most 8 pairs".

**F5. PRIV still says a borrow drops the player's level, and does not list CORE's
`record_borrow_done!` edit.** PRIV changes.
- CORE:777-794, CORE:677 and CORE:1717: a borrow no longer ends a remote session (one with
  `foothold` or `from`); `record_borrow_done!` deletes only a keyboard record (`:391-396`).
- PRIV:348 "a borrow's displacement drops to whatever the new holder has" and PRIV:998 (test) "a
  borrow displacement drops it" read as any session. A remote admin session now keeps its level
  through a borrow, and so keeps its plant override (PRIV-7).
- PRIV edits the same function (`:402`, PRIV:545-549, PRIV:1190) but its "Shared with other ops
  plans" list (PRIV:1218-1231) does not name it.
- Fix: PRIV:348 and :998 "a borrow's displacement of a keyboard session"; add to PRIV:998 that a
  remote admin session keeps `access` after a borrow; add `record_borrow_done!` (CORE deletes only
  keyboard records; PRIV writes `cachedAt` after the lock-out branch) to PRIV:1218-1231.

### Nits

**F6. LOG's L2a, L2b and L3 order is "after S7" where the outline now says after S5c.** LOG:100 and
LOG:1210 versus OUTLINE:143-150 (S7, S5b, S5c, then the rest of S9). Not wrong, but L3 edits
`#container` after PRIV's S5a and S5b edits; say "after S5c" so the shared-file order is plain.

**F7. CORE's `needsSession` test row does not say what it asserts after S5a.** PRIV:1272-1276 asks
CORE's `network_technique_session_test` row to assert "refused, device still held" (or
`needs_console` from S5a). CORE:1443 says only "refused for a technique session". Add "with the
device still held; the reason is the privilege plan's test" so S5a's new reason cannot break it.

**F8. PRIV's collect 404 is outside its closed list.** PRIV:732-740 lists `not_admin`, `locked`,
`not_reachable`, `bad_request`, then answers check 2 with `Container not found: <pc_id>`. That is
deliberate (an invented id and a real one look alike), but the closed-list sentence should say "and
the 404 of check 2, `GET /container`'s own body", so the controller test that walks closed lists
(brief section 5) does not fail it.
