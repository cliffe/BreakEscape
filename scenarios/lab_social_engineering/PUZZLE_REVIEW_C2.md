# Lab puzzle chains, cycle 2 review

Reviewer: fresh Opus, 2026-10-22. Skill: `mission-puzzle-chains`, run as POLISH_PLAN sets it for the lab — gating, key order and the stage chain. VM and cumulative-kit parts skipped (browser-only lab). This cycle verifies that the eight cycle-1 fixes landed in `c8906b03` hold on every route, and sweeps for anything the new gates broke. The lab's files are at the committed state (`git status` clean for `scenarios/lab_social_engineering/**` and `person-chat-pretext.js`).

Everything below is traced from `scenario.json.erb` (`erb:N`), the lab ink, and the engine under `public/break_escape/js/`. No design document was trusted for a fact.

## Summary

| Severity | Count | Ids |
|---|---:|---|
| Blocker | 0 | |
| Major | 0 | |
| Minor | 1 | C2-1 |

All eight cycle-1 fixes (P1–P6, F1, F2, F5) hold on every route I walked, including the out-of-order and failure routes. The new gates introduced no soft lock, no key-before-lock, and no hint that points at a locked step. The one new finding is a stale engine comment, not player-visible. The residual called out in the log (Ruth's "write it up" line on `phish_lord_landed` alone) is **resolved in practice** by the hub's own ordering plus the recheck tunnel — rated below with evidence; no change needed.

Suggested action: C2-1 is a one-line comment edit in a shared engine file, so it belongs to the orchestrator's approval path, not this lab stage. The stage is clean at minor.

## How the engine carries the new gates (verified)

- **Compound mapping conditions work against live globals.** `safeEvaluateCondition` splits on `&&` and resolves `globalVars.X` from `window.gameState.globalVariables`, not from the event payload (`npc-manager.js:52-53, 105-113`). So `value === true && globalVars.phish_pierce_landed === true` and the P1 bark conditions evaluate against current state. ✓
- **`setGlobal` on an eventMapping sets the global and emits `global_variable_changed:<name>`** (`npc-manager.js:808-819`), so the P2 `sends_done` mappings both set the gate and let anything downstream react. ✓
- **Landings emit a change event.** `phish_<id>_landed` is written by the mail scheduler through the shared `writeGlobal` (`mail-scheduler.js:537`, `global-writer.js:191-196`), which emits `global_variable_changed:phish_<id>_landed` on change — the trigger the P2 and P3 mappings need. ✓
- **`requiresGlobal` genuinely blocks the report workstation** and shows `lockedMessage` (`interactions.js:1119-1132`), returning before `startEngagementReport`. ✓
- **aimCompleted ordering is cosmetic, not a gate.** A task in a locked aim completes and reveals the aim early; only a `globalVariable` unlockCondition hides an aim (`objectives-manager.js:698, 718-722, 756-777`). So the real critical-path gates are the three door keys plus the report workstation's `sends_done`, exactly as C1 found. No aim-ordering soft lock is possible. ✓

## Boss-key audit (unchanged structure, re-confirmed)

Room depth: engagement_office 0; recon_room, operations_room, blue_team_room each 1, locked off the hub. No empty rooms.

| Lock | Key / condition | Verdict after C1 |
|---|---|---|
| Recon door (`recon_door`, erb:1378-1379, 1522) | Ruth, `plan_done and fairbairn_condition_heard` (ruth.ink:151) | ✅ now gates on the signature as well as the plan (P1) |
| Operations door (erb:1380-1381) | Ruth, `osint_done and se_intel_username_convention` (ruth.ink:157) | ✅ boss-key, unchanged |
| Blue Team door (erb:1382-1383) | Ruth, `report_filed` (ruth.ink:162) | ✅ boss-key, unchanged |
| Report workstation (erb:1495-1508) | `requiresGlobal: sends_done` (erb:1506) | ✅ now waits for all three landings (P2) |
| call_dev task (erb:90) | both `se_intel_lord_portal_name` and `se_intel_lord_payslip_date` (erb:1402-1403) | ✅ completes on the whole call (P3) |

## Per-fix verification

### P1 — Recon key waits for Gareth's signature. HOLDS.
- Key hand-over gated `plan_done and fairbairn_condition_heard and not recon_key_given` (ruth.ink:151). Bark fires only when both are true, one mapping per global for whichever is set last (erb:1441-1444). Phone stage 1 routes on `not (plan_done and fairbairn_condition_heard)` and branches correctly for either order (ruth_phone.ink:49, 85-93). `recon_door.lockedHint` reworded to name the signature (erb:1524). ✓
- **No soft lock.** Both prerequisites are earnable from the start room: `roe_signed` comes from the scope board (steps `roe_scope_done` + `roe_stoprule_done`, block `onCompleteGlobal: roe_signed`, erb:1121-1126), which gates Gareth's `sign` scene (`fairbairn.ink:36`), and `plan_done` from the whiteboard (erb:1151). Neither depends on the Recon key. ✓
- **Pointers are consistent in both orders.** Whiteboard-first: Ruth falls to "rules of engagement… start there" (ruth.ink:180-181, which precedes the plan branches), phone → stage0. Sheet-and-sign-first-then-plan: Ruth "Now tell me what you'll actually do. The whiteboard." (ruth.ink:184-185), phone stage1 "Gareth's signed. The whiteboard next." (ruth_phone.ink:89-90). Sheet-then-plan-but-unsigned: Ruth "Gareth still hasn't signed… then the key's yours." (ruth.ink:186-187), phone stage1 "Gareth still needs to sign… before the key." (ruth_phone.ink:87-88). ✓
- `scenecheck` plays `sign` before `payoff` (fairbairn.ink:36-37); belt-and-braces, since the report (hence payoff) can only follow the Recon key, which now needs the signature. Compiled `fairbairn.json` carries both knots. ✓

### P2 — the two easy sends can't be skipped. HOLDS.
- `sends_done` is set only when all three landings are true: one onceOnly mapping per landing, each requiring the other two (erb:1408-1410). I walked every landing order — the last landing's mapping always fires, because by the time it flips, the other two globals are already true. The report workstation is gated on `sends_done` (erb:1506). ✓
- **Reload-safe.** `sends_done` persists as a global; each mapping is `onceOnly` and persists once it fires (not a conversation opener, so `triggered.persist` is set, `npc-manager.js:801-802`). Backed up by the ink recheck tunnel, which sets `sends_done` via `#set_global` the next time Ruth's hub runs if all three landed and `not sends_done_marked` (ruth.ink:132-135); `sends_done_marked` is ink-local and persists. ✓
- The skip-to-Sofia route no longer reaches the report: the workstation shows "Nothing to write up yet. All three targets have to act on a message first…" (erb:1507), which is self-correcting. ✓

### P3 — call_dev completes on the whole call. HOLDS.
- Two mappings, each firing when its fact is the last of the pair to arrive (erb:1402-1403); the ink recheck mirrors them (ruth.ink:124-126). Both the `portal_name` and `payslip_date` asks set `pretext_call_done` via their own grants (erb:841, 843), so `pretext_call_done` still flips on the first granting ask and drives stage routing, while the `call_dev` task waits for both facts. No other completion route for `call_dev` exists. ✓
- Phone stage 5 handles the "one fact, not the other" states and points back to Dev (ruth_phone.ink:177-199), matching the two Ruth hub lines for the same states (ruth.ink:204-207). ✓

### P4 — link feedback blames the score, not the address. HOLDS.
- `linkCredible.fail` is "The page didn't pass the builder's score for her." (erb:801); the `wrong` hint is "There is a page, but it didn't pass the builder's score for her…" (erb:815); the in-chat below-threshold reply is "That link's page doesn't look like our portal." (lord_mail.ink:43). None blames the From address. ✓

### P5 — throwaway address line stops once Chris is landed. HOLDS.
- The "Make your throwaway address before you write to anyone" line is gated `operations_key_given and not acct_freemail and not phish_hampshire_landed` (ruth.ink:192-193), so it stops once Chris is landed by any route, including from the guest account. ✓

### P6 — a later call can't downgrade a success. HOLDS.
- `finalisePretext` keeps `pretext_<callId>_outcome` at `got_it` once reached, and does not advance the `_reports` ladder once already `got_it` (`person-chat-pretext.js:360-385`). I traced the consumers: the report row reads `pretext_service_desk_call_outcome` and `_reports` (`report-model.js:193-207`) and renders "an earlier call was reported… a later call got what it asked for" only when a genuine earlier failure/report also happened (`engagement-report-minigame.js:197-210`); Tomasz reads the same outcome plus `dev_reported` (tomasz.ink:116-122); the credits read both (erb:167-169). `dev_reported` is set by the dev "reports" threshold effect (erb:325) and the 2-minute channel lockout alongside it (erb:327), both persisting across reload. A pointless check-in after a clean `got_it` now leaves the row, Tomasz and the credits all consistent. ✓

### F1 — first failed Sofia send carries guidance. HOLDS.
- Sofia's `senderTrust` fail and mismatch strings both name the service desk ("the service desk knows which" / "Dev at the service desk knows it", erb:797-798), so the first miss already points somewhere even though the engine only shows a between-miss hint after a prior miss. ✓

### F2 — builder headline no longer contradicts "no service chosen". HOLDS.
- `gateBrand` is overridden in `landingPages[0].strings` to "{firstName} only logs in to the service she actually uses. Choose it in the builder." (erb:1101) — true whether the service is unset or wrong, and "she". ✓

### F5 — the "which system" blank can't dead-end. HOLDS.
- P3 (call_dev now needs the portal name) plus the new phone stage-5 rung that names Xero as the finance tool, not the payslip portal, and points to Dev for the real name (ruth_phone.ink:197-199). ✓

## Rating the logged residual: Ruth's "write it up" line on `phish_lord_landed` alone

**Verdict: resolved in practice. No change needed.** The log flagged that ruth.ink's "Sofia checked… write it up at the report workstation" line (ruth.ink:210-212) is gated only on `phish_lord_landed and not report_filed`, so on the skip-to-Sofia route it could point at a workstation that `sends_done` still locks.

In the running game it cannot misfire, for two independent reasons:

1. **Hub ordering catches the skip route first.** The hub is a first-match cascade. The branch `operations_key_given and not (phish_hampshire_landed and phish_pierce_landed)` (ruth.ink:194) sits *above* the "write it up" branch (ruth.ink:210). The only way to reach line 210 is for Chris and Melanie to both be landed (passing 194, and the Sofia-prep branches 198-209). Once all three are landed, `sends_done` is already true, so the workstation is open when the line shows. The phone mirrors this: its hub routes to stage3 on `not (phish_hampshire_landed and phish_pierce_landed)` (ruth_phone.ink:50), so it too points at the easy sends, never the locked report, on the skip route.
2. **The recheck tunnel pre-empts any gap.** `hub` runs `-> recheck ->` before printing its body (ruth.ink:175), and recheck sets `sends_done` if all three landed and it is not yet marked (ruth.ink:132-135). So even in the degenerate case where the live mappings somehow missed, `sends_done` is set in the same interaction, before the "write it up" line is read — and in fact before it is ever reachable.

A clean `sends_done` gate in ruth.ink would still be marginally tidier (a VAR mirroring the global), but it buys nothing the player can observe. Leave it; it is below minor.

## New finding

### C2-1 (minor, engine comment only, not player-visible): stale gate name in the report-workstation handler comment

- `interactions.js:1120-1121` still reads "the lab keys this on the phishing stage (phish_lord_landed) so the report cannot be written…". The data now keys on `sends_done` (erb:1506), and the code reads the gate generically from `minigameData.requiresGlobal` (erb:1125), so the behaviour is correct — only the comment names the old global.
- **Impact:** none in play; a maintenance trap only. The lockedMessage the player sees (erb:1507) is accurate.
- **Proposed fix:** change the comment to name `sends_done` (and its reason: "so the report cannot be written before all three targets have acted"). This is a shared engine file, so route the one-line edit through the orchestrator's approval path rather than the lab stage; or defer, since it is a comment.

## Paths walked (no new dead end or soft lock)

- **Whiteboard before the sheet:** Ruth → "rules of engagement… start there"; Recon key withheld until `fairbairn_condition_heard`, which needs `roe_signed`. No lock.
- **Sheet signed, plan not done / plan done, not signed:** both orders give consistent Ruth + phone pointers to the missing step; key withheld correctly.
- **Land Sofia first (every easy-send order):** report workstation locked with the correct message; Ruth (line 194) and phone (stage3) both point at the easy sends; `sends_done` sets when the last of the three lands.
- **Call Dev for one fact only:** `call_dev` task stays open; `pretext_call_done` flips for stage routing; phone stage5 and Ruth both point back to Dev for the missing fact.
- **Date → reported → portal (got_it):** outcome sticky at `got_it`; report row reads "an earlier call was reported… a later call got what it asked for"; Tomasz and credits consistent; 2-minute lockout persists.
- **Guest account only for the easy sends:** `test_account`/`acct_freemail` stays unset and that aim task stays open, but nothing on the critical path (keys, `sends_done`) needs it, so no soft lock. Pre-existing; C1's P5 already stops the stale Ruth line. Not re-opened here.
- **Reloads:** `sends_done`, the three P2 mappings, the P1 bark mappings, the call outcome globals and `dev_reported`/lockout all persist; the ink recheck/keys tunnels are idempotent on an engine-resumed `hub`.

---
Measured against m01_first_contact and m02_ransomed_trust. Reviewed: cycle 2 (verification cycle), 0 blocker, 0 major, 1 minor.
