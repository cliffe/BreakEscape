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
