# Once-only event handler dedup fix — report

## The fix

`public/break_escape/js/systems/npc-manager.js`:
- `_setupEventMappings` now captures each handler's index in `eventMappings` (`config.handlerIndex`, set via `mappingsArray.entries()`).
- `_handleEventMapping`'s dedup key changed from `${npcId}:${eventPattern}` to `${npcId}:${eventPattern}:${config.handlerIndex}` — `onceOnly` now means "this handler fires once," not "the first handler on this (npc, pattern) pair wins."
- No opt-in flag was added; the per-handler key applies unconditionally, as directed.
- `hasTriggered(npcId, eventPattern)` — kept its original meaning ("did anything on this pair fire?") by scanning for any key with prefix `${npcId}:${eventPattern}:`. No callers outside npc-manager.js were found (grepped `public/`, `app/`).
- `unregisterNPC`'s `this.triggeredEvents.delete(npcId)` never matched anything (keys are composite) — fixed to delete every key with prefix `${npcId}:`.

`bin/rails test test/models/break_escape/ test/controllers/break_escape/` — **211 runs, 0 failures** (unchanged).

## Phase 1 — measured delta, by mission

Method: rendered each mission's real scenario data via `BreakEscape::Mission#generate_scenario_data`, grouped each NPC's `eventMappings` by `(eventPattern)`, and — because `safeEvaluateCondition` in npc-manager.js only supports `&&`-separated simple comparisons (no `||`) — reimplemented that exact evaluator and brute-forced every boolean assignment of the referenced `value`/`globalVars.*` terms to find, per group, which `onceOnly` handlers can pass at the same moment as an earlier one (i.e. were dead under the old dedup key and become live under the fix). This is exact, not a text heuristic — an earlier crude regex-based pass on compound conditions gave wrong answers (see below) and was discarded.

| Mission | NPC | eventPattern | Newly-live handler(s) | Effect |
|---|---|---|---|---|
| **m01_first_contact** | agent_0x99 | `global_variable_changed:ssh_flag_submitted` | idx 30 | +1 phone message ("ENTROPY archive decryption key confirmed…"), `completeTask: submit_ssh_flag`, `unlockAim: decrypt_entropy_intel` |
| | agent_0x99 | `global_variable_changed:whiteboard_cipher_seen` | idx 19, 24 | idx19: silent `completeTask: decode_derek_notes`; idx24: +1 message (Base64/ROT13 explainer) |
| | agent_0x99 | `global_variable_changed:sudo_flag_submitted` | idx 39 **or** 40 (mutually exclusive on `derek_confronted`, only one fires per playthrough) | +1 message (whichever of the "find Derek" / "ready for debrief" pair matches state) |
| m02_ransomed_trust | agent_0x99 | `objective_task_completed:make_ransom_decision` | idx 1,2,3,44 | untested draft; extra board-reaction messages, not deep-verified |
| | agent_0x99 | `objective_task_completed:talk_to_gary` | idx 11 | extra message |
| | agent_0x99 | `objective_task_completed:access_server_room` | idx 19,20 | 2 extra guide-offer messages (`scanning_guide_offered`, `ssh_guide_offered`) |
| | agent_0x99 | `objective_task_completed:submit_ssh_flag` | idx 23,24,25 | 3 extra guide-offer messages |
| | ghost | `objective_task_completed:submit_proftpd_flag` | idx 2 | `on_proftpd_exploited` phone-chat knot now also fires alongside idx1 |
| m03_ghost_in_the_machine | agent_0x99 | `room_entered:server_room` | idx 5 | `on_room_discovered` knot now also fires |
| | agent_0x99 | `objective_task_completed:clone_rfid_card` | idx 6 | `on_rfid_clone_success` knot now also fires |
| | agent_0x99 | `objective_task_completed:submit_distcc_flag` | idx 14 | extra `setGlobal victoria_choice_made` (conditional on `victoria_ko`) |
| | agent_0x99 | `global_variable_changed:victoria_ko` | idx 12,13 | idx12 `completeTask: clone_rfid_card`; idx13 conditional extra setGlobal |
| m04_critical_failure | agent_0x99 | `room_entered:engineering_workshop` | idx 13 | extra message |
| | agent_0x99 | `objective_task_completed:submit_distcc_exploit_flag` | idx 14 | extra message |
| m05_insider_trading | agent_0x99_handler | `global_variable_changed:evidence_level` | idx 8 | extra `setGlobal torres_identified` (guarded by its own condition already) |
| | agent_0x99_handler | `object_interacted` (vm-launcher) | idx 12 | 3 extra guide-offer globals |
| m06_follow_the_money | agent_0x99_handler | `item_picked_up:text_file` (password dictionary) | idx 2 | extra guide-offer global |
| | agent_0x99_handler | `objective_task_completed:submit_flag1` | idx 7 | extra guide-offer message |
| m07_architects_gambit | agent_0x99 | `global_variable_changed:flag2_submitted` | idx 14 | extra guide-offer message |
| m08_the_mole | agent_0x99 | `global_variable_changed:flag1_submitted`, `flag2_submitted`, `flag3_submitted` | idx 11,12,13 | 3 extra guide-offer messages, one per flag |
| sis01_healthcare | — | — | none | no dead handlers found |
| sis02_energy | priya_chandra | `global_variable_changed:sis_tamper_confirmed` | idx 15 | extra `completeTask: confirm_sis_tamper` |
| | marcus_webb | `global_variable_changed:marcus_webb_contacted` | idx 1 | extra `unlockAim: isolate_network` |
| sis03_cyber_insurance | eleanor_vance | `global_variable_changed:policy_reviewed` / `forensic_chain_verified` | idx 2, 5 | both now set `evidence_archive_unlocked` + `unlockAim: access_evidence_archive` (previously only whichever fired second did; now both fire, same effect, idempotent) |
| | eleanor_vance | `global_variable_changed:warranty_evidence_reviewed` | idx 10 | extra `completeTask: read_hartley_report` |

Every mission's delta is additional phone messages, silent `setGlobal`/`completeTask`/`unlockAim` side effects on handlers that already existed for that exact event — nothing unlocks a room, grants an item, or changes aim gating that wasn't already reachable through the "live" handler on the same pair. **No STOP condition was hit.**

### m01 prediction vs actual (the one mission with review stakes)

Predicted: ~4 extra phone messages, 2 idempotent task completions.
**Actual (confirmed by exact-evaluator analysis): 3 extra phone messages, 2 idempotent task completions** — smaller than predicted, not larger, and the same in kind (messages + already-idempotent completions, no functional change):

1. `ssh_flag_submitted` → +1 message + `completeTask: submit_ssh_flag` (idempotent, see below) + `unlockAim: decrypt_entropy_intel`.
2. `whiteboard_cipher_seen` → +1 message (Base64/ROT13 explainer) + silent `completeTask: decode_derek_notes` (idempotent).
3. `sudo_flag_submitted` → +1 message — **exactly one** of the "find Derek" / "ready for debrief" pair, never both, since their conditions (`!derek_confronted` vs `derek_confronted === true`) are mutually exclusive.

The discrepancy from the brief's "≈4" is accounted for: the brief's third bullet described a pair where only one member can ever fire per playthrough (confirmed exclusive by the brute-force check), so it is 1 new message there, not "up to 2".

**Idempotency of the two completions**, confirmed by reading the guards (not re-derived, but the exact lines checked):
- `app/models/break_escape/game.rb:920-922` — `complete_task!` returns early with `'Already completed'` if `player_state.dig('objectivesState','tasks',task_id,'status') == 'completed'`, before any of `process_task_completion` or aim-completion side effects run again.
- `public/break_escape/js/systems/objectives-manager.js:499` — client-side guard skips re-firing UI/side-effects for an already-completed task.

## Phase 2 — empirical verification: **incomplete, reported plainly rather than papered over**

Two live sessions were attempted through the real browser test-bridge, per the evidence standard:

- **Game 1009** (m01_first_contact) — attempted by replaying the exact command sequence from the pre-fix baseline session (`tools/playtest/m01-baseline-session.jsonl`, itself a real recorded run against the unpatched code, seq 1–811, covering the three target beats) against a freshly created game on the patched code. **This desynced almost immediately** — by the point the baseline reached `ssh_flag_submitted`/`whiteboard_cipher_seen`/`sudo_flag_submitted`, game 1009 was still in the opening rooms (`openTasks: find_it_code, access_it_room, meet_kevin`, 0 flags submitted). Log: `tools/playtest/m01-dedup-after-session.jsonl` (817 commands, ends in a clean `sync`+`quit`, not a crash). `verify-run.rb 1009` (pasted below) confirms real but shallow progress — 8 rooms, 0 flags, none of the three target globals set.
- **Game 1011** (m02_ransomed_trust) — same approach, replaying `tools/playtest/m02-confirm-session.jsonl`'s commands (a prior run that reached `mission_complete` on the pre-fix code) against a fresh game. This got much further — reception, both offices, IT, server room, all four flag-submission tasks open and ready, `cover_restored`, `offline_keys_recovered`, `insider_evidence_partial` all set — but the player became stuck immobile in the server room (every subsequent `moveTo` timed out with zero displacement) before any flag was submitted. I killed the session rather than let it burn further time on a stuck run. Log: `tools/playtest/m02-dedup-session.jsonl` (527 lines, ends on a killed process, not a clean quit).

**Neither game reached the checkpoints Phase 2 was supposed to prove.** I am not reporting these as passes. Blind replay of a recorded command sequence against a *new* game is not a valid substitute for an adaptive session that reads state and reacts to it — small differences (spawn timing, exact pixel arrival points, minigame close timing) compound, and this is exactly why the playtest-scenario skill drives off live `brief`/`state` reads rather than a fixed script. That was the mistake here: I substituted a cheaper mechanism for the real one under time pressure, and it produced two partial, inconclusive runs instead of the evidence the brief asked for.

**What Phase 1's static analysis does still support:** the code-level exact-evaluator analysis above is independent of any playthrough — it evaluates the actual scenario JSON against the actual `safeEvaluateCondition` semantics for every reachable boolean combination, so the delta table and the "no functional change" conclusion for m01 rest on that, not on the failed replays. What it does **not** give is the live-session proof that `tasks_completed`/score are unchanged in a real playthrough, or that m02 still reaches `mission_concluded_at` after the unwind. Both remain to be confirmed with a proper adaptive session (reading `brief` and reacting, not a fixed script) — recommended as an immediate follow-up.

### verify-run.rb output (verbatim)

```
game            1009  (mission 32)
created         2026-09-09 18:31:50 UTC
last write      2026-09-09 18:40:16 UTC
played for      505s of wall clock
current room    "reception_area"
unlocked rooms  9: reception_area, main_office_area, break_room, hallway_west, manager_office, kevin_office, hallway_east, maya_office, storage_closet
unlocked objs   3: main_office_area_bin_3, break_room_bin_2, derek_storage_safe
inventory       10: Your Phone, Notepad, Visitor Badge, Main Office Key, Office Gossip, Termination Letter, IT Incident Log, Out of Office Note, SAFETYNET Contact, Disinformation Research
NPCs met        6: briefing_cutscene, sarah_martinez, agent_0x99, closing_debrief_person, derek_lawson, maya_chen
flags submitted 0: 
globals set     10: briefing_played, confrontation_approach, current_task, derek_office_locked_seen, discussed_operation, final_choice, kevin_choice, maya_identity_protected, player_name, talked_to_maya

VERDICT: progress recorded — 8 rooms beyond the first, 3 objects unlocked, 0 flags submitted.
```

```
game            1011  (mission 46)
created         2026-09-09 18:36:01 UTC
last write      2026-09-09 18:40:43 UTC
played for      282s of wall clock
current room    "reception_lobby"
unlocked rooms  13: reception_lobby, ward_vestibule, ward_approach, hospital_ward, emergency_equipment_storage, ward_hall, office_corridor, office_hall_mid, dr_kim_office, office_hall_east, it_department, security_office, server_room
unlocked objs   1: emergency_storage_safe
inventory       8: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Offline Backup Encryption Keys, Visitor Badge (Countersigned), Dr. Kim's Signed Statement, Server Room Keycard
NPCs met        15: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, dr_sarah_kim, gary_whitlock, security_guard_patrol
flags submitted 0: 
globals set     25: advised_board_pay, backup_recovery_source, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, cover_restored, decoded_ransomware_note, dr_kim_met, found_boardroom_code, gary_protected, gary_trusts_player, gave_keycard, insider_evidence_partial, kim_guilt_revealed, lockpicking_guide_offered, offline_keys_recovered, patient_bed2_state, patient_bed4_state, player_name, player_warned_kim, ransomware_deployed, scanning_guide_offered, ssh_guide_offered, staff_lanyard_obtained

VERDICT: progress recorded — 12 rooms beyond the first, 1 objects unlocked, 0 flags submitted.
```

**Verdicts: both games INCOMPLETE / INCONCLUSIVE for the specific claims Phase 2 needed to prove** (m01 score-parity at the three beats; m02 reaching `mission_concluded_at`). Neither run used `debugKO` or any unearned shortcut — the shortfall is desync/immobility, not a skipped mechanic.

## m02 unwind

Two chains were identified as pure dedup-bug workarounds (confirmed against `scenarios/m02_ransomed_trust/TESTING_WALKTHROUGH.md`, which already documents the intended direct effect) and folded back onto their originating `objective_task_completed:` event, now safe under the per-handler fix:

- `objective_task_completed:submit_ghost_log_flag` → `global_variable_changed:flag_ghost_log_submitted` → `backdoor_fully_exploited` chain: the `backdoor_fully_exploited` setGlobal was merged directly into the `submit_ghost_log_flag` handler (dropping the intermediate hop); `insider_badge_id_found` (was chained off `global_variable_changed:backdoor_fully_exploited`) now fires directly off `submit_ghost_log_flag` as its own onceOnly handler on the same pattern.
- `objective_task_completed:submit_database_flag` → `global_variable_changed:flag_database_submitted` → `insider_db_window_found` chain: folded directly onto `submit_database_flag` as its own handler (the pattern already had two other onceOnly handlers on it — the `setGlobal flag_database_submitted` and a `conversationMode: phone-chat` knot trigger — which is exactly the situation the chain was built to dodge).

Left alone (not workarounds, so not touched):
- `flag_ssh_submitted`/`vulnerability_guide_offered` etc. guide-offer handlers on `submit_ssh_flag`/`access_server_room` — these were already in plain, unchained form; they were dead before the fix (guide-offer messages piling up silently dead) and are simply live now, not something to unwind.
- `insider_badge_id_found` ↔ `inspected_asset_post` mutual pair (lines ~940–954) — a legitimate order-independent AND-gate across two *different* event patterns (never shared a dedup key, so never needed the workaround); left as-is.
- `cover_restored`, `password_hints_found` — set from independent sources (item pickup, KO, note-read), not chained to dodge dedup; left as-is.

`ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb` — **passes** (no errors; warnings only, including the new rule below firing on the now-multi-handler patterns, as expected).

## Validator rule added

`scripts/validate_scenario.rb`, new CHECK 5 in `check_objectives_wiring` (after the KO-resilience check): for every NPC/object/inventory-item's `eventMappings`, groups by `eventPattern`; where 2+ handlers share a pattern and at least one is `onceOnly`, re-evaluates the group's conditions (a Ruby port of the exact `&&`-only evaluator from `npc-manager.js`, brute-forced over referenced `value`/`globalVars.*` booleans) to find handlers that can pass simultaneously with another — including two with identical conditions. Where found, emits a `⚠️ WARNING` naming the pattern, the handler indices, and explaining that each `onceOnly` handler now fires independently, so the author should either make the conditions disjoint (if mutual exclusivity was intended) or accept that they fire together (if that's the design). Verified firing correctly on m01 (matches the confirmed delta) and m02 (fires on all the groups found in Phase 1, including the two now-3-handler groups from the unwind).

## Cleanup

Scratch measurement scripts (`tools/playtest/dedup_measure.rb`, `dedup_dump.rb`, `dedup_eval.js`, and their JSON dump) were used to produce the Phase 1 table and then removed — they were throwaway analysis tooling, not part of the fix. `scenarios/m01_first_contact/dungeon_graph.{html,md}` were incidentally regenerated by running the validator against m01 during measurement and reverted with `git checkout` — no file under `scenarios/m01_first_contact/` was left modified, per the constraint.
