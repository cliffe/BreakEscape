# m02 Ransomed Trust — post-puzzle-pass critical-path playtest

**Question answered: (1) Does the plumbing work on the intended route?** This run played the critical path end to end in a real browser via the test bridge, earning each secret in-game before using it, specifically exercising the items called out as new in this pass: `staff_room`, the takeable Ward Clerk's Laptop, the operator's ROT13 note, Dr Kim's safe PIN sourced elsewhere, Gary's lanyard re-gate, the PIN-cracker-vs-honest-PIN ordering, and the backup-recovery ending fix.

- Session log: `tools/playtest/m02-critical-session.jsonl` (824 lines, game id 1031)
- Flags XML: `tools/playtest/m02_ransomed_trust-flags-game1031.xml`
- Scenario source consulted directly: `scenarios/m02_ransomed_trust/scenario.json.erb`, `ink/m02_npc_gary_whitlock.ink`, `ink/m02_object_press_terminal.ink`

## Verdict

**The critical path is fully playable and every objective/task completes, including all four VM flags, the safe, and the recovery console — but the mission never concludes server-side.** The client shows the end-of-mission credits (`missionEnd` non-null, `mission_complete` global true), and every task in the server's own `requiresCompleted` gate is recorded as `completed` with timestamps, yet `Game#status` stayed `"in_progress"` and `mission_concluded_at`/`completed_at` stayed `nil` after `sync`. This is the single most severe finding and blocks calling the run a clean pass — see Defect 1.

## verify-run.rb output (full)

```
game            1031  (mission 46)
created         2026-09-12 01:36:47 UTC
last write      2026-09-12 02:15:28 UTC
played for      2321s of wall clock
current room    "reception_lobby"
unlocked rooms  13: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, staff_room, dr_kim_office, it_department, security_office, server_room, emergency_equipment_storage, conference_room
unlocked objs   2: entropy_staging_cache, emergency_storage_safe
inventory       13: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Ward Clerk's Laptop, Visitor Badge (Countersigned), Server Room Keycard, Spare Contractor Lanyard, Gary's Password Sticky Note, Handwritten Note, Taped Inside the Rack, Ghost's Operational Manifesto, Affiliate Handling Note, Offline Backup Encryption Keys
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, dr_sarah_kim, gary_whitlock, security_guard_patrol, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_ad3da4}, flag{m02_ransomed_trust_hospital_backup_server_2_2e59d8}, flag{m02_ransomed_trust_hospital_backup_server_3_c62737}, flag{m02_ransomed_trust_hospital_backup_server_4_13f66b}
globals set     45: advised_board_pay, backdoor_fully_exploited, backup_recovery_source, backup_reinfected, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, cover_restored, decoded_ransomware_note, dr_kim_met, exploitation_guide_offered, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, found_boardroom_code, gave_keycard, insider_badge_id_found, insider_confronted, insider_db_window_found, insider_evidence_partial, insider_method_confirmed, kim_guilt_revealed, lockpicking_guide_offered, lore_ghosts_manifesto_found, mission_complete, noticed_struck_booking, offline_keys_recovered, password_hints_found, patient_bed2_state, patient_bed4_state, player_name, privesc_guide_offered, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, read_operator_note, scanning_guide_offered, ssh_guide_offered, staff_lanyard_obtained, vulnerability_guide_offered, ward_recovering

VERDICT: progress recorded — 12 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

verify-run.rb doesn't print conclusion status directly; the direct DB check that surfaced Defect 1 (below) supplements it.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu, reception — dialogue reward (honest opener) | seq 8 (converse) | yes |
| Emergency/Kim safe PIN | `1987` | Hospital Founding Plaque, reception (also redundantly on the Estates Audit Snag List in `staff_room`) | seq ~4 (read before Bernie) | yes |
| Boardroom PIN | `0417` | Dr Kim's Desk Diary, CTO office | seq 737 (read before boardroom door) | yes |
| Server Room Keycard | (item) | Gary Whitlock — `keycard_conditional` route (influence 8) | seq 199 | yes |
| Spare Contractor Lanyard | (item) | Gary Whitlock — `the_lanyard` hub option | seq 253 | yes (see note) |
| VM flags 1–4 | `<flag:1..4>` | `--flags` XML seeded at game creation (no VM in standalone) | seq 378/385/… /454 | **no — standalone has no VM, so the exploit work itself is unproven** |
| Offline Backup Encryption Keys | (item) | PIN-Locked Safe, Emergency Equipment Storage, PIN `1987` | seq 535 | yes |

Notes on the two "yes (see note)" / "no" rows:
- **Lanyard row**: the ink (`ink/m02_npc_gary_whitlock.ink:585-589`) does gate a first-ask refusal on `gary_influence >= 15`, confirmed by direct source reading. In this run my influence had already reached 19 by the time I first asked (from earlier dialogue choices I picked for plumbing coverage, not deliberately to avoid the refusal), so **the refusal branch itself was not exercised in this run** — this is a boundary of what this run proves, not a defect. The branch exists and is reachable; a future run should ask for the lanyard immediately after the opening choice (before any topics) to force influence under 15 and confirm the refusal text fires.
- **Flags row**: standalone has no VM, so per the skill's own rule this cannot be earned in this environment; the row is correctly marked "no". The flag-station wiring, task completion, progress counters, and Ghost's phone calls on flags 2 and 3 all fired correctly — that is everything a standalone run *can* prove.

## New-feature checks (the brief's priority list)

| Item | Result |
| --- | --- |
| `staff_room` replaces the three office-hall rooms, 4 connections work | **Pass.** Verified `room` scans from inside `staff_room` show all four doors (`south→office_corridor`, `north→dr_kim_office`, `west→conference_room`, `east→it_department`), and traversed all four in both directions during the run. |
| Ward Clerk's Laptop (`cyberchef_workstation`) takeable, lives in `staff_room` | **Pass.** `interact` picked it up into inventory (`item_picked_up:workstation`), confirmed present in `verify-run.rb`'s inventory list. |
| Operator's note (`operator_site_note`), `onRead: read_operator_note` | **Pass.** Read in the server room; `read_operator_note` global set. Content is ROT13-encoded lore that decodes to a 12h/4h ETA calculation matching the recovery console's `etaHours`, tying the two puzzle pieces together correctly. |
| Dr Kim's safe no longer states its own PIN; PIN earned elsewhere | **Pass on design.** Read the safe's observation text in-game — it says only "Four-digit keypad, hospital estates issue -- the same model as the one in the emergency store," no PIN. The PIN (`1987`) is earned from the Hospital Founding Plaque at reception (read before Bernie) and redundantly from the Estates Audit Snag List in `staff_room`, both reachable well before either safe. **However, the safe itself could not be opened in this run — see Defect 2.** |
| Gary refuses the lanyard on first ask; re-gated dialogue path | **Confirmed via source, not fully exercised in play** — see earned-secrets note above. The refusal knot (`lanyard_grudging`) and its distinct redirect-to-Doyle text exist and are reachable; this run's influence was already past the gate by first ask. |
| PIN cracker (Ghost's phone) obtained after an honest PIN | **Design confirmed, not driven this run.** `pin_cracker` lives behind `pin_cracker_found`/`item_picked_up:pin-cracker` in the scenario, gated in `emergency_equipment_storage` as a fallback tool; this run never needed it because the founding-plaque PIN was read first (matching the intended "earn a PIN honestly before the cracker" design). Getting to Ghost's phone to pull the cracker itself was not attempted in this run — time did not permit a second full loop with a "cracker first" ordering to confirm the *reverse* (crack before finding a written clue) is properly blocked or discouraged. |
| Backup recovery minigame: sources have `compromised`/`etaHours`/`requiresGlobal` | **Pass, confirmed by direct play.** All three m02 sources (`ransom_payment`, `offline_keys_only`, `combined_recovery`) have `"compromised": false` in `scenario.json.erb`. Selected `combined_recovery` after earning `offline_keys_recovered` — the outcome screen correctly printed "RESTORE INITIATED — OFFLINE ESCROW PLUS RECOVERED KEY MATERIAL", **not** the old universal "RESTORE FAILED — SOURCE COMPROMISED". |
| `requiresGlobal`-gated sources genuinely unavailable until true | **Pass, confirmed by direct play.** Before reading the safe, the console UI marked `offline_keys_only` and `combined_recovery` tiles `is-unavailable` with the banner "Offline backup keys not recovered — the escrow safe is still shut," and the confirm button stayed disabled (`disabled:true`) when either was selected pre-condition. After `offline_keys_recovered` became true, the same tile became selectable and confirmable. This is enforced in `backup-recovery-minigame.js`'s `isSourceAvailable()`/`handleConfirm()`, not just cosmetic. |

## Defects found, most severe first

### 1. Mission does not conclude server-side despite every `requiresCompleted` gate task being completed (severity: critical)

**Repro:** Game id 1031. Completed the full critical path: `talk_to_gary`, `access_server_room`, `submit_proftpd_flag`, `submit_ghost_log_flag`, `initiate_backup_recovery`, `make_ransom_decision`, `decide_hospital_exposure` — all seven tasks named in the scenario's `restore_hospital_systems` aim (`scenario.json.erb:441-448`, `requiresCompleted`) are present with `status: "completed"` in `player_state['objectivesState']['tasks']`, and the aim itself shows `status: "completed"` at `2026-09-12T02:15:17Z`. The client correctly received the `mission_complete` global and showed the end-of-mission credits overlay (`missionEnd.creditsShowing: true`).

Yet after `sync` and `quit`, direct inspection of the AR row shows:
```
g = BreakEscape::Game.find(1031)
g.status                 # => "in_progress"
g.mission_concluded_at   # => nil
g.completed_at           # => nil
```
`tasks_completed` (25) matches the number of entries in `objectivesState.tasks` (25) — so this is *not* the previously-documented lost-task-write signature (`games_controller.rb:66` comment describes that exact failure mode from game 1022, with a fix already shipped via `with_game_lock`). All tasks and the aim are present; only the top-level `status`/`mission_concluded_at`/`completed_at` columns on the `Game` row failed to persist.

**Suspected mechanism (needs a human's call, not asserted as fact):** `app/models/break_escape/game.rb:1128-1145` (`check_mission_conclusion`) sets `mission_concluded_at`/`status`/`completed_at` in-memory and relies on the caller's `save!` (in `complete_task!`, line 981) to persist them. The ink line that fires on transmitting at the press terminal (`ink/m02_object_press_terminal.ink:155-157`) issues three tags in one line — `#complete_task:decide_hospital_exposure`, `#set_global:exposed_hospital:true`, `#set_global:mission_complete:true` — which the client dispatches as parallel POSTs, the exact pattern the controller's own comment block (`games_controller.rb:38-66`) documents as having caused a prior data-loss bug (game 1022) via unlocked concurrent read-modify-write. `complete_task` is in the `with_game_lock` list; it isn't clear from this session alone whether the endpoint(s) handling the two parallel `#set_global` tags are also covered by that lock, or whether one of them loads a pre-conclusion copy of the `Game` row and its own `save!` clobbers the just-set `mission_concluded_at`/`status`/`completed_at` columns afterward (this would explain the JSON blob being intact — if that request only touches `globalVariables` — while the top-level columns silently revert). This needs someone to trace the exact controller action(s) invoked for `#set_global` and check whether they're inside `with_game_lock`'s `only:` list at `games_controller.rb:79`.

**Impact:** Every M02 player who reaches this exact ending (transmit evidence with the recovery already initiated) will see the credits play, but the game record will never show as concluded — GameCompletionScoringJob, Hacktivity's completion tracking, and anything gating on `mission_concluded_at` will not fire.

### 2. Dr Kim's Safe cannot be opened — approach consistently short-stops around 60px away (severity: moderate, optional content)

**Repro:** In `dr_kim_office`, `moveToNear("dr_kim_safe")` repeatedly arrives at `plainDistance: ~60px` regardless of approach direction (tried from three different starting points). `interact("dr_kim_safe")` reports `mode: "approached-then-interacted"` with `engineDistance: 23-25` (within the stated `range: 32`), yet returns `ok: false, reason: "no-effect-confirmed"` every time — the click reaches engine range but the safe never opens. Manual `moveTo` toward the safe's approach side also failed, once returning `steps: [{"dir":"right","moved":0},{"dir":"right","moved":0}]` (shortfall 56) — the player could not move right at all near `crash_cart` at `(77, -778)`, which sits almost on top of the player's position (`distance: 7.2`).

Per the skill's three-check rule before suspecting the engine: (1) target range — ruled out, `engineDistance` (23-25) is well inside `range` (32); (2) harness false-positive — ruled out, the tool correctly reports failure, not success; (3) wrong UI driving — ruled out, used the documented `moveToNear` → `interact` → `lock` sequence. This matches the class of defect already flagged as an open finding in the m01 baseline report ("a collider short-stops moveToNear on three server-room objects, up to 59.7px") recurring here in a different room on a different object — **suspect the same underlying collision/approach-point calculation, for a human to confirm.**

**Impact:** This safe holds only the optional Zero Day Syndicate Invoice lore item (`lore_zds_invoice_found`), so it does not block the critical path, but it is genuinely unreachable as tested.

### 3. `dismissBlockingUi` cannot close a real, listed blocking overlay for `.laptop-screen`-class widgets (severity: minor, already patched during this run)

**Repro:** Picking up the Ward Clerk's Laptop opened a `.laptop-screen` DOM overlay (`Crypto Workstation`, buttons `↑`/`×`) reported correctly by `state()`/`brief()`'s `blockingUi.buttons`. But `dismissBlockingUi()` (`public/break_escape/js/systems/test-bridge/index.js:574-585`, pre-fix) derived its own button list from a *shallower* search (`panel.closest('[class*="modal"],[class*="overlay"],[class*="popup"],[class*="dialog"]')`) that doesn't match `.laptop-screen`, and unlike `detectBlockingUi()` in `state.js:122-134`, had no ancestor-climb fallback — so it always returned `blocking-ui-has-no-buttons` even though the buttons genuinely existed and were reported one call earlier. Verified by reading both implementations side by side; `state.js`'s version already has the exact ancestor-climb fix, `index.js`'s did not.

**Fix applied during this run** (matching the project's established pattern of hardening the harness as blockers are found): mirrored the same bounded ancestor-climb in `dismissBlockingUi` (`public/break_escape/js/systems/test-bridge/index.js`, ~line 578). This is a test-bridge (dev-only tooling) fix, not a scenario or game-logic change. In practice this did not block the run, since reloading the session for an unrelated reason cleared the stuck overlay — but a run without that incidental reload would have been stuck.

### 4. `backup_reinfected` fires even on the "clean" `combined_recovery` outcome (severity: worth checking, not confirmed as wrong)

After confirming `combined_recovery` (the scenario's own "RECOMMENDED... ENTROPY is paid nothing" outcome, `compromised: false`), the global `backup_reinfected` appeared in the next `brief()` read. Tracing `backup-recovery-minigame.js:247-265` (`commitSelection`): a non-compromised source only avoids `backup_reinfected` if `network_isolated` is already `true` at the moment of restore; otherwise it schedules a *delayed* reinfection regardless of the scenario's own narrative claim of a clean recovery. m02 never appears to set `network_isolated` anywhere I found in `scenario.json.erb`. This may be intentional (a generic engine-level "you didn't isolate the network first" penalty layered under the scenario's authored text) or may be an inconsistency between the authored outcome copy and the underlying mechanic — **flagging for a human's call**, not asserting it's wrong, since I did not find where/whether `network_isolated` is meant to be set in this scenario.

## Steps not completed / boundaries of this run

- The Reeves/insider identification side-thread (`unmask_identify`) was deliberately left undone to test the "never identify Reeves" ambush path — confirmed working: at the press terminal, Graham Reeves's ambush line ("I'm sorry. I can't let you leave here believing that was only careless budgeting") fired correctly, matching the walkthrough's documented `press_terminal_ambush` → `insider_asset_escaped` fix.
- Gary's lanyard-refusal branch was not hit in play (influence already ≥15 by first ask) — confirmed via source only, see earned-secrets table.
- The PIN-cracker's "must earn a PIN honestly first" ordering was not stress-tested in the reverse direction (grabbing the cracker before finding any written clue) due to time.
- Dr Kim's Safe was never opened (Defect 2).
- This was a `session`-policy run (flags substituted from a seeded XML) since standalone has no VM; the VM exploitation work itself is unproven here per the skill's own rule.

## Environment note

This run shared its scratchpad/session directory with what appears to be a second, concurrently-running playtest session against a different game id (1030) for this same mission, evidenced by overlapping script filenames and one confirmed instance of a shell script being silently overwritten mid-run by the other process. This cost time recovering (the send-and-poll helper script had to be recreated under a unique name) but did not corrupt game 1031's own session log or server state, both of which were cross-checked directly against the database and found consistent throughout.
