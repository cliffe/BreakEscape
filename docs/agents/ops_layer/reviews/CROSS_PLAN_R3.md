# Ops layer plans: cross-plan review, round 3 (delta)

Status: PARTIAL. Stopped at the context limit. Plans read at HEAD `e6d4e89ff` (LOCK) and
`8f88a8588` (the rest); delta from `6c57f5c00` (CROSS_PLAN_R2 part 2). CRACK ignored (held).

Short names: CORE, PRIV, SKIN, MFA, LOG, LOCK. `LOG:497` means `OPS_LOG_ROWS_PLAN.md` line 497.
Line numbers for the non-LOCK plans were taken from the diff hunks and short reads; they may be
off by one or two.

Counts: 0 blockers, 1 major, 4 minors, 3 nits.

## 1. Findings

### Major

**Y1. The log stages L1a and L1b now land before S1, but their unchanged-scenario proof uses the
helper and folder the core plan builds in S1.** LOG (or CORE) should change.
- LOG:98-102 and LOG:1186-1188: L1a and L1b land before S1. Outline section 5 agrees.
- LOG:497-500: L1b's checks 3 (the `/unlock` answers) are proved by fixtures
  `log_unlock_refusals.json` in `test/fixtures/files/ops_unchanged/`, compared by
  `bin/ops-golden-compare`. L1b is the stage that edits `#unlock` (LOG:692-694).
- CORE:1222-1235: the folder, the capture rake task and the compare are committed in CORE's
  build step 1, i.e. in S1. PRIV:737-739 also says "the core plan builds it in its first stage".
So the first plan to need the shared mechanism lands before the plan that builds it.
Fix: the helper, the folder and the capture rake task move to LOG L1a (the first ops stage),
and CORE, PRIV, MFA, LOCK refer to "the helper L1a ships"; or LOG proves L1b with the existing
suites only and adds its `/unlock` fixture in L2a (after the helper exists). The first is
cleaner, since every plan already treats L1a as "the shared thing that lands first".

### Minors

**Y2. No plan owns the spec of `bin/ops-golden-compare`.** CORE (or LOG, per Y1) should change.
CORE names the helper once (CORE:1234) and leaves it out of its new-file list (CORE:1553-1556)
and its build steps. PRIV:737-746 and PRIV:972-974 say the helper strips every ops plan's new
empty `ACCESS_STATE_DEFAULTS` keys and freezes the clock; CORE's text says neither, and CORE's
own four keys (CORE:1536) would appear in later captures. LOCK:553 allows "the core plan's capture
rake task (or a named one beside it)". Fix: the owning plan lists the file, says what it compares
(answer bodies and statuses, server state with each plan's empty keys stripped), how plans
register their keys to strip, the clock freeze, and the rake task's name.

**Y3. MFA's knock-out test lacks two of the server's exclusions; LOCK has the full test.** MFA
should change, to LOCK's wording.
LOCK:505-508: a room NPC's `itemsHeld` counts when its story offers the type or it can be knocked
out: not `koImmune`, not `npcType: "phone"`, no scenario `disableAttacks`. MFA:773 ("a met,
non-`koImmune` room NPC (`npc_ko_claimable?`)"), MFA:776 (the author sets `koImmune`) and the
validator warning MFA:841 ("an NPC whose story offers no give of it and who is `koImmune`") name
only `koImmune`. Code: `ko_claimable_room_npc_ids` (`game.rb:2045-2059`) excludes `koImmune` and
`npcType == 'phone'`; `owner_claim.rb:73-74` adds `disableAttacks`, which the comment there says
is the client's refusal to punch (`player-combat.js`), not a server check. So MFA's warning
misses a device held by a phone NPC or in a scenario with attacks disabled. Fix: MFA:773, :776 and
:841 use LOCK's three-part test. Small LOCK wording point: LOCK:507 calls all three "the server's
own test"; the server KO gate reads only the first two, `disableAttacks` comes from the client
mirror. LOCK may say so; the rule itself is right for reachability.

**Y4. A `code_device` in a declared grant: MFA warns it is too easy, while its own holding test
and LOCK treat it as never holdable.** MFA should change.
MFA:842 warns a `code_device` "that is not gated: it is a declared grant, which can be claimed
at any time". But `held_code_device` (MFA:413-416) matches an inventory entry against "an authored
device", and `device_for` (MFA:225-227) walks room objects, `contents`, NPC `itemsHeld` and start
items only, as `declared_friendface_phones` does (`social_feed.rb:202-221`), so a granted device
would never count as held. LOCK:508 ("declared grants are not counted") follows the code. Fix:
MFA decides one way: either `device_for` (and so `held_code_device`) includes declared grants and
LOCK's `held_item_sources` counts them too, or MFA:842 becomes an error ("a `code_device` in a
declared grant can never be used"). The second matches the phone code and LOCK as written.

**Y5. `held_item_sources` and `lock_step_never_passes?` are named in LOCK only; MFA's matching
checks name no helper.** MFA should change (or LOCK, in its shared-file table).
LOCK:205-206 and LOCK:502-508 add both to `MfaModel` and call the item walk "the MFA plan's
'nobody can get' test, one shared helper". MFA's validator warnings "A `code_device` nobody can
get" (MFA:841) and "A push step nobody passes" (MFA:847, "holds no declared phone", a weaker test
than LOCK's takeability) build their own reachability, and MFA lands in S8a, long before S8c.
Two walks over the same question will drift (Y3, Y4 are already examples). Fix: MFA M1a adds
`MfaModel.held_item_sources(scenario)` and uses it for MFA:841 and MFA:847; LOCK then only adds
`lock_step_never_passes?`. Or LOCK states that G1 moves MFA's two warnings onto its helper and
lists `scripts/validate_mfa.rb` in its shared-file table (LOCK:656-663).

### Nits

**Y6.** LOG:735 (shared-file table) still lists S5b among the plans that register secret sources;
LOG:845 and :1193-1197 and PRIV:906 now say S5b registers none (X6). LOG drops S5b from the row.

**Y7.** LOCK request 3 (LOCK:705-708) asks LOG to say in 5.1's granted `badge_swipe` bullet that
the row is written after the gate. LOG answered in the 13.8 table (LOG:1150) and request 6, but
the 5.1 bullet (LOG:225-229) still reads "before `unlock_room!` or `unlock_object!`" with no gate.
LOG adds "and after the lock plan's second-step gate, once S8c lands" there.

**Y8.** SKIN's unchanged proof (SKIN:635-642, :975) commits DOM snapshots of the core's
`ops_unchanged` view answers but names neither their files nor their folder. The brief asks each
plan to name what it adds. SKIN names the snapshot path (for example
`test/js/fixtures/network-view/unchanged/`) and says it is a JS-side snapshot, not a second
server golden mechanism.

## 2. Round 2 items (X1 to X26): status

| Item | Status | Evidence |
|---|---|---|
| X1 | Fixed | LOCK:691-693: default `save_limit: false`, `mfa_*` register no limit |
| X2 | Fixed | LOG:1150 (13.8 `badge_swipe` ok), LOG request 6; LOCK:693-695. See Y7 for 5.1 |
| X3 | Dropped, no dangling reference | LOCK:288-292 owns the repeat answer (pure `numbers` with the record's nonce); LOCK request 1 (LOCK:699) says met; MFA request 11 (MFA:1140-1148) and MFA DECISIONS record the drop |
| X4 | Fixed | CORE:1618-1621; PRIV:550-553 |
| X5 | Fixed or declined on record | PRIV:529-547 `reason` codes, 404 kept as `/container`'s; MFA:705-706 keeps `/login` booleans, MFA DECISIONS; LOG:306-310 `invalid_object`, `not_found`; LOCK:400-404 keeps extended bodies. Brief allows extending routes. |
| X6 | Fixed, one stale line | LOG:845, :1193-1197; PRIV:906. Y6 |
| X7 | Fixed | MFA:1022 names five sites; PRIV:1021-1022 refers to MFA's list |
| X8 | Fixed | LOCK:668 "eight" |
| X9 | Fixed | no "step 6" in PRIV; PRIV:895-896, :962-963 use "Admission" |
| X10 | Fixed | MFA:317-318 |
| X11 | Fixed | MFA:1145 |
| X13 | Fixed (see Y1) | LOG:98-102, :1186-1188; outline section 5 |
| X14 | Fixed | LOCK stages G1, G2 (LOCK:3, :141-142) |
| X15 | Fixed | MFA:1027 |
| X16 | Fixed | MFA:512-516, :1125-1126 |
| X17 | Fixed | LOG:619-621, :722-724, :1160-1163 |
| X18 | Fixed | LOG:733 |
| X19 | Fixed | CORE:1182; PRIV:710-712 |
| X20 | Fixed | PRIV:663 `validate_privilege.rb`; LOG:422 `validate_log_rows.rb`; MFA:826 `validate_mfa.rb`; LOCK:459-461 `validate_lock_step.rb` |
| X21 | Fixed | MFA `minCorrect` throughout; no residual `needs` on a desk |
| X22 | Fixed | MFA:1023, test row MFA:935 |
| X23 | Fixed | PRIV:556-558, :880-883 |
| X24 | Fixed in CORE, PRIV, MFA, LOG, LOCK | CORE:1232-1235; PRIV:733-739; MFA:882-886; LOG:497-500; LOCK:541-555. SKIN: Y8. Ownership of the helper: Y1, Y2 |
| X25 | Fixed | PRIV:176, :895 |
| X26 | Fixed | MFA:934; CORE:1624-1627 |

## 3. Lock and MFA shared rules: checked and agreed

- Subject rules: LOCK:312-326 matches MFA's table (MFA:290-298): record in the caller's map plus
  `passed`; tidy keeps a passed record; on a pass the function returns `:passed` and drops
  nothing; no route re-judge; a wrong code moves `tries` and `mfaAccounts[npcId].wrong` only;
  re-enrolment ignored (owner's `code_device`, never `own:<npcId>`).
- `numbers(key, game_id, subject_key, npc_id, nonce)`: MFA:234-240 and LOCK:291-292 agree; the
  record stores `nonce` (MFA:379-382), so LOCK's recompute from `record['nonce']` works.
- `device_in_use?(npc_id)`: MFA:455-458 and LOCK:423-425 agree.
- `takeCompleted(subject)`: MFA:571, :672 and LOCK:388-389 agree.
- `mfaPrompts` and `mfaAccounts` per owner across subjects: MFA:793-800 and LOCK:322-324, :447-448.
- Log rows: LOCK:667-695 against LOG 13.7 (LOG:1110-1127): eight events, no new name, `places`
  `pc door object`, `method` detail on `mfa_challenge`, `as: { npc: }` or nil, `approver` a
  subset of LOG's list (`owner`, `held_phone`), no `by`. Secret calls: MFA:1073-1075 use
  `note_issued_secret` and `register_secret_source` as LOG:834-849 defines; LOCK's lock
  `requires` is covered by L1a's lock-answer source (LOG:838-841).
- Build order: LOCK needs M1a to M3 (S8a, MFA:133) and L1a, L1b; all land earlier.

## 4. Not yet checked

- Every new route in all plans against the Refusals rule beyond the routes named in X5 (CORE's
  four network routes were checked in R2; MFA's `/helpdesk/request` body at MFA:719 not read).
- Point 5 beyond Y1: SKIN K1/K2 and PRIV S5a-S5c stage dependencies against the new order
  (L1b before S1) in detail.
- Point 6 shared-file conflicts in the LOCK delta: LOCK's `games_controller.rb#unlock` gate
  against LOG L1b's badge rows in the same transaction (only the row order was checked);
  LOCK's `validate_scenario.rb` hook placement (`:8948`) against CORE's (`:8968`) and MFA's
  ("beside the habits check"); LOCK's `find_scenario_object` change against PRIV's and CORE's
  `game.rb` edits.
- LOCK's commit `e6d4e89ff` beyond the knock-out wording (the "defined walk order" change).

## 5. Remaining checks

Second reviewer, same round, covering the list in section 4. Plans read at the working tree on
`docs/ops-layer-plan` (HEAD `27424d8de`), with a concurrent edit for Y1 to Y5 in progress; text on
those topics was ignored. Code read: `games_controller.rb:1211-1335` (`#unlock`),
`validate_scenario.rb:8930-8982` (the run list).

Counts for this section: 0 blockers, 0 majors, 4 minors, 3 nits.

Checked and clean:
- Refusal bodies: LOG's `GET /log_rows` (LOG:307-309, closed list `invalid_object`, `not_found`);
  PRIV's `POST /harvest_credentials` (PRIV:530-548); LOCK's lock form of the `/mfa/*` routes and
  `/unlock` (LOCK:400-404, keeps extended bodies and says so); SKIN adds no route (SKIN:185,
  :544, :557); the keyring sign-in's new 422 `typeToSignIn` (MFA:704-706).
- Stage order: PRIV S5a to S5c need S3 (`access` on technique records, CORE:64-77, :606-610, which
  reads the stored key until `session_access` exists) and L1b (`signin_refused`, whose `kind`
  detail S5c registers, PRIV:926-928); both land earlier. PRIV S5b's hash branch is S7's to build
  (PRIV:396, :784, :981-983), so S5b works without S7. SKIN K1 to K3 need S1 to S3, S5a's admin
  tag (SKIN:710, :985) and `log_rows_for(..., compare: true)` (SKIN:852), which is L1a
  (LOG:676); all earlier. No SKIN or PRIV stage depends on a later one.
- `#unlock`: only LOG (L1b) and LOCK (G1, G2) edit it; no other plan names it. LOCK's gate sits
  before the transaction (`games_controller.rb:1280`) and LOG's granted row inside it, so the
  first post of a gated rfid lock writes no `badge_swipe` and the final one writes one, as
  LOCK:695-697 says. Both plans rewrite `already_open` (`:1223-1224`): LOG for every rfid request,
  LOCK by Rule B for a `secondStep` target. The two compose; LOCK lands second and merges.
- `find_scenario_object`: only LOCK changes it (LOCK:218-221, :660); no other plan edits it,
  `validate_unlock` or the inventory copy.
- `e6d4e89ff`: the walk-order change (LOCK:544-555) is LOCK's own fixture and no other plan's
  capture script replays the same `/unlock` answers in another order (LOG:497-500 uses the access
  model suite's cases). One point on the capture spec: Y15.

### Minors

**Y9. `POST /helpdesk/request` is a new route but answers with sign-in style booleans, not a
`reason` code.** MFA should change.
- MFA:719: desk unknown 404 (body unstated); not met, knocked out or `what` not offered: the
  "generic 422", which MFA:699 defines as the existing `Sign in required` body; stopped serving
  422 `blocked: true`; rule not met 422 `refused: true, triesLeft`; an over-4 KB body is
  "refused" with no status or body.
- MFA:706-707 keeps the boolean style for the `/mfa/*` routes "because they extend `/login`", and
  MFA DECISIONS records X5 for `/mfa/*` only. The helpdesk route extends no sign-in route: it is
  a request to an NPC, and "Sign in required" is the wrong words for "this person will not help".
- Brief section 5, Refusals: a new ops route answers `{ success: false, reason: "<code>" }` with a
  closed list.
Fix: MFA gives `/helpdesk/request` a closed list, for example 400 `bad_request` (missing or
over-long params, body over 4 KB), 404 `not_found` (desk), 422 `unavailable` (not met, knocked
out, `what` not offered), 422 `blocked`, 422 `refused` with `triesLeft`; the helpdesk form maps
them as the network view's `REFUSAL_TEXT` does. Or MFA records a reasoned exception in its
DECISIONS file and says so beside the table.

**Y10. S5a writes `admin_profile_read` inside `GET /container`, whose scoped branches L2a then
extracts into a shared reach check; neither plan places the row.** PRIV and LOG should change.
- PRIV:914 and LOG:1117: the row is written in `GET /container`, `once: true`, saved only when
  stored. PRIV's file list for `games_controller.rb` (PRIV:880-882) names only the collect route
  and the NPC count, not `#container`, so the call site is unstated.
- LOG:314-318 and :712-713 (L2a, after S5a): the three scoped branches of `#container`, the
  profile branch among them, move into `container_reach_refusal(located)`, called by both
  `/container` and `/log_rows`. LOG's check 6 (LOG:493-494) compares `/container` bodies only,
  over the access model suite, which has no admin session; its shared-file table (LOG:743) lists
  `games_controller.rb` for the `set_game` lists only.
If the row goes where the profile admission is judged, the extraction carries it into the shared
method and a `/log_rows` read of a reader in an admin-opened profile writes `admin_profile_read`;
if it stays in `#container`, nothing says so.
Fix: PRIV names the site (`GamesController#container`, profile branch, after `session_admits?`
and `path_unlocked?` pass, `as` from the admin PC that `session_admits?` names) and adds
`#container` to its file list. LOG L2a step 2 says rows stay in `#container` after
`container_reach_refusal` returns nil, adds `#container` (S5a, L3, LOCK) to its shared-file
table, and adds one test: `/log_rows` on a reader inside an admin-opened profile writes no row.

**Y11. LOG's refused `badge_swipe` row would be written for an rfid object below a closed second
step, which LOCK says must answer exactly as an invented id.** LOCK and LOG should change.
- LOCK:243-251: an object below a closed step is refused by `validate_unlock` "exactly as an
  invented id is", and `unlock_session_refusal`, `pin_cracker_feedback` and
  `password_case_mismatch?` answer nil for it, "so the body is an invented id's".
- LOG:230-234 (L1b): at the refusal (`games_controller.rb:1252`) a `badge_swipe` `denied` row is
  written for an rfid lock in force, in reach (an object in an unlocked room outside an
  unpromoted route room) with a card held. An object inside a closed gated PC meets all three, so
  a forged post with its id writes a row (and up to ten saves per door), while an invented id
  writes nothing. Once L2a ships, a reader shows the difference.
Fix: LOCK adds the refused badge row to its exits table (LOCK:249-257) with "no row below a
closed step" and a case in its "Nothing leaves or opens early" row (LOCK:592); LOG's 5.1 refused
bullet adds "and not `behind_closed_step?`, once S8c lands".

**Y12. L1b splits the lockout key by hand at two sites that MFA's "one place" rule does not
list.** MFA should change.
- LOG:207-210 (L1b, lands before S8a): `record_login_failure!` takes `as: { typed: }` from the
  key's username part and `add_login_lockout!` parses the PC from the key.
- MFA:332-341 and :1033: M1a adds `AccessIdentities.lockout_key` and `lockout_key_parts`, and
  "every site changes to call them, and none builds or splits the string itself"; the list is
  `attempt_login!`, `account_locked_out_at?`, `AccessWork.locked_out_at?`,
  `lockout_pcs_for_client`, `account_login_key?`. MFA:1129 makes `lockout_key` "the one place a
  later slice changes" (the per-lockout `scope` backlog item, PRIV S5c).
A later change to the key's shape would leave L1b's two rows naming the wrong account or PC.
Fix: MFA's site list (MFA:337-339 and the `game.rb` row at :1033) adds `record_login_failure!`
and `add_login_lockout!` (the L1b row sites), each moved to `lockout_key_parts`.

### Nits

**Y13.** MFA:714 and :717 give `GET /mfa/device` and `GET /mfa/phone` a 403 "`no such device`" /
"`no such phone`" and a 404 for "no policy declares a kind", with the bodies unstated; LOCK:414
adds a 404 for an unresolved lock, body unstated. These GETs carry no sign-in, so MFA:707's
reason does not cover them. MFA states the exact bodies (the `render_error` strings, as
`/container` does, or codes `no_device`, `no_phone`, `not_found`); LOCK points to them.

**Y14.** CORE:1548 says every plan adds its validator line "in the same place" (`:8968`, beside
`check_credentials`), but LOCK:461-462 puts its call beside `check_npc_held_containers`
(`:8948`), MFA:835 beside the habits check (`:8981`), PRIV:662 beside CORE's call, and LOG:685
names no place. Each `run.call` is independent (`validate_scenario.rb:8939-8981`; MFA resolves
habits at read time, MFA:256, so it does not need `habits_copy`), so the order does not matter
and nothing conflicts. CORE's table says "near the other `check_*` calls; order does not matter".

**Y15.** LOCK's golden script (LOCK:551-555) sets each lock's `requires` item in the inventory
by the test before the right post. LOG L1a's capture spec (LOG:691-692) reads "a fixed script
played through the real routes". When L1a's spec is written (Y1, Y2), it allows a named setup
step per fixture (an inventory or state write, the same on main and branch), or LOCK says how
the item is gained through a route.

Still not checked: nothing from the section 4 list remains.
