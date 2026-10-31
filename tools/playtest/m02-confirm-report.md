# m02_ransomed_trust — confirmation playtest report

**Which question this run answers:** (1) does the plumbing work on the intended route, with a specific mandate to confirm three fixes made since run 3 and to reach the ending. It also answers (3) in part: the mission was completed via the **combined recovery** route, which requires the offline keys, so the offline-keys branch that run 3 could not confirm is now proven end to end.

**Walkthrough source:** `scenarios/m02_ransomed_trust/TESTING_WALKTHROUGH.md`
**Game id:** 995 (mission 46)
**Session log:** `tools/playtest/m02-confirm-session.jsonl` (939 lines; `quit` reported 936 commands)
**Flags XML:** `tools/playtest/m02_ransomed_trust-flags-game995.xml` (`PREFLIGHT OK`, `VALID_FLAGS=4`)
**Flag policy:** `session` — submitted as `<flag:1..4>`, substituted by the harness.
Line numbers below are line ranges in the session log.

## Verdict on the mission ending

**The mission reached its ending.** Persisted server state:

```
status=completed concluded=Tue, 08 Sep 2026 07:10:00.207713000 UTC +00:00
```

`mission_complete: true` and `exposed_hospital: true` are both in the server-persisted globals.

## verify-run.rb output (verbatim)

```
game            995  (mission 46)
created         2026-09-08 06:49:23 UTC
last write      2026-09-08 07:10:03 UTC
played for      1240s of wall clock
current room    "reception_lobby"
unlocked rooms  15: reception_lobby, ward_vestibule, ward_approach, hospital_ward, emergency_equipment_storage, ward_hall, office_corridor, office_hall_mid, dr_kim_office, office_hall_east, it_department, security_office, server_room, office_hall_west, conference_room
unlocked objs   2: emergency_storage_safe, entropy_staging_cache
inventory       10: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Offline Backup Encryption Keys, Visitor Badge (Countersigned), Dr. Kim's Signed Statement, Gary's Password Sticky Note, Server Room Keycard, Ghost's Operational Manifesto
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, dr_sarah_kim, gary_whitlock, security_guard_patrol, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_45e557}, flag{m02_ransomed_trust_hospital_backup_server_2_07eb6f}, flag{m02_ransomed_trust_hospital_backup_server_3_5dfc0e}, flag{m02_ransomed_trust_hospital_backup_server_4_4ada4e}
globals set     37: advised_board_pay, backdoor_fully_exploited, backup_recovery_source, backup_reinfected, backup_restore_initiated, bernie_gave_key, briefing_played, cover_restored, decoded_ransomware_note, dr_kim_met, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, found_boardroom_code, gary_protected, gary_trusts_player, gave_keycard, insider_badge_id_found, insider_db_window_found, insider_identified, inspected_asset_post, kim_guilt_revealed, lockpicking_guide_offered, lore_ghosts_manifesto_found, mission_complete, offline_keys_recovered, password_hints_found, patient_bed2_state, patient_bed4_state, player_name, player_warned_kim, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, ward_recovering

VERDICT: progress recorded — 14 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu, reception — honest opening line ("I'm the security consultant Dr. Kim called in") | log 21–40 | yes |
| Emergency safe PIN `1987` | `1987` | Hospital Founding Plaque, reception ("Founded 1987"), read in the notes minigame before use | plaque log 9–18; used log 55–62 | yes |
| Boardroom PIN `0417` | `0417` | Dr. Kim's Desk Diary, CTO office ("Boardroom keypad 0417 (CHANGE THIS)") | diary log 131–140; used log 545–556 | yes |
| Server Room Keycard | (item) | Gary Whitlock, IT department — leverage/rapport route, `gave_keycard` + `gary_trusts_player` | log 193–200 | yes |
| SSH credential `Hospital1987` | (not typed — no VM) | Gary's Password Sticky Note, IT department (read in-game) and Gary's dialogue | sticky note log 187–219 | yes (prerequisite earned) |
| `hospital_backup_server-flag1..4` | `<flag:1>`…`<flag:4>` | SAFETYNET Drop-Site Terminal, server room | log 317–512 | **no — flag values cannot be earned in standalone (no VM). Expected boundary, not a defect.** |
| `inspected_asset_post` (→ `insider_identified`) | (read) | Night Security Post Log, boardroom | log 558–562 | yes |

The flag row is the boundary of what this run proves: the in-game prerequisite (Gary's password list) was genuinely obtained before submission, but the VM work itself was not performed.

## The three fixes this run was sent to confirm

### Fix 1 — display-form `targetFlags`: **CONFIRMED WORKING**

All four flags submitted at the drop-site and all four tasks and globals fired (log 317–512, and the persisted state above):

| Flag | Task | Global |
| --- | --- | --- |
| 1 | `submit_ssh_flag` ✓ | `flag_ssh_submitted` ✓ |
| 2 | `submit_proftpd_flag` ✓ | `flag_proftpd_submitted` ✓ |
| 3 | `submit_database_flag` ✓ | `flag_database_submitted` ✓ |
| 4 | `submit_ghost_log_flag` ✓ | `flag_ghost_log_submitted` ✓ |

Chained globals also fired: flag 3 → `insider_db_window_found` (task `unmask_db_window` complete); flag 4 → `backdoor_fully_exploited` + `insider_badge_id_found` (task `unmask_ghost_badge` complete). The ENTROPY Staging Cache's flag lock accepted flag 4 and opened (log ~500–512).

### Fix 2a — Offline Backup Encryption Keys: **CONFIRMED WORKING, BY REAL IN-GAME PICKUP**

Route played as a player would: reception → ward vestibule → ward approach → patient ward → emergency storage (log 41–54); `emergency_storage_safe` interacted, PIN `1987` entered on the real keypad, safe opened (log 55–70); `mg take "Offline Backup Encryption Keys"` clicked the real container element, which pocketed the item and opened its notes viewer (log 71–86).

Immediately afterwards `brief` reported `offline_keys_recovered` in `recentGlobals` (log 87–92). The item also appears in the **server-persisted inventory** in the verify output above. No `eval`, no hand-built object.

Downstream consequences confirmed live:
- **Sister Doyle's gated dialogue branch appeared** — the conversation offered and took "I've got the offline keys. Your monitors are coming back." and "The offline keys. Your monitoring's coming back tonight." (log 108–130).
- **The Hospital Recovery Console offered the offline path** and the run completed the mission via **Combined Recovery (VM Keys + Physical Keys)**, which requires both key types — `backup_restore_initiated`, `backup_recovery_source`, `ransom_decision_made`, tasks `initiate_backup_recovery` and `make_ransom_decision` complete (log 513–545).

### Fix 2b — Gary's Password Sticky Note: **CONFIRMED WORKING, BY REAL IN-GAME READ**

The note was picked up the way a player would, in the IT department (log 187–219). It required a real approach problem to be solved first: `moveToNear` reported `arrived-but-outside-plain-range` and two interacts returned `no-effect-confirmed` at plain distances of 36.1 and 34.9 px, i.e. outside the 32 px gather radius (log 187–205). Approaching from the west instead (a `moveTo` to (355,-640) then a short right-walk to 18.2 px) made the click land, the interaction menu resolved to the note, and the notes minigame opened showing `Emma2018 / Hospital1987 / StCatherines` (log 206–219).

`brief` then showed `password_hints_found` in `recentGlobals`, and task `obtain_password_hints` had left `openTasks` (log 216–219). The note is in the persisted inventory in the verify output.

### Fix 3 — chained `global_variable_changed:` handlers and the hub escape hatch: **still working**

Dr. Kim's conversation completed `meet_dr_kim` and set `dr_kim_met`, `found_boardroom_code`, `kim_guilt_revealed`, `advised_board_pay`, `gary_protected`, `player_warned_kim` (log 141–186). The hub exited cleanly both times it was entered (`hitTurnLimit: true` on the first pass, a clean exit on the second).

## Step results

| # | Step | Result | Log lines |
| --- | --- | --- | --- |
| 1 | Opening briefing → `briefing_played` | PASS | 1–8 |
| 2 | Reception plaque read (PIN 1987 source) | PASS | 9–18 |
| 4 | Bernie → `sign_in_at_reception`, IT Override Key | PASS | 21–40 |
| 9 | Reception encrypted terminal → `decoded_ransomware_note` | PASS | 19–20, 33–38 |
| 6 | Enter patient ward → `assess_the_ward` | PASS | 41–52 |
| 30 | Enter emergency storage → `locate_safe` | PASS | 53–54 |
| 31 | Safe PIN 1987 → `crack_safe_pin`, take keys → `offline_keys_recovered` | PASS | 55–92 |
| 7 | Sister Doyle → `talk_to_ward_nurse`, `gather_pin_clues`; offline-keys branch present | PASS | 108–130 |
| 5 | Dr. Kim → `meet_dr_kim`, badge, boardroom code | PASS | 131–186 |
| 8 | IT door unlocked with the override key → `open_it_department` | PASS | 176–186 |
| 11 | Password sticky note → `password_hints_found`, `obtain_password_hints` | PASS | 187–219 |
| 10 | Gary → `talk_to_gary`, Server Room Keycard, `gave_keycard` | PASS | 193–240 |
| 14/16 | Cover burn; `cover_restored` via the server-room-entry backstop | PASS | 241–316 |
| 15 | Val's `cover_challenge` — "Gary's card and Gary's blessing" route | PASS | 290–316 |
| 17 | RFID door → `access_server_room` | PASS | 300–316 |
| 19–22 | Four flags submitted, four tasks, four globals | PASS (values session-supplied) | 317–500 |
| 23 | ENTROPY Staging Cache unlocked by flag 4; manifesto taken → `lore_ghosts_manifesto_found` | PASS | 500–512 |
| 32 | Recovery console, Combined Recovery → `backup_restore_initiated`, `ransom_decision_made` | PASS | 513–545 |
| — | Ghost's Act 3 offer, refused ("No deal") | PASS | 528–544 |
| 29 | Boardroom door PIN 0417 | PASS | 545–557 |
| 27 | Night Security Post Log → `inspected_asset_post` + `insider_identified` | PASS | 558–562 |
| 33 | Press terminal → transmit → `exposed_hospital`, `mission_complete` | PASS | 563–600 |
| 34 | Closing debrief, `#complete_mission`, bond visualiser + credits | PASS | 600–934 |

## Observations (not classified as defects)

1. **`interact()` reports `mismatch: true` / `ok: false` for lock minigames that are the object's own lock.** The reception encrypted terminal (log 19–20), the emergency safe (log 55–60) and the ENTROPY cache (log ~500) each returned `ok:false` with `wrong-target-opened` while in fact opening exactly the right thing (`ransomware-display`, `pin`, `flag-station`). This is harness reporting, not game behaviour, but it makes a run look like it is failing when it is not.

2. **The password sticky note is hard to reach from the south.** A collider on Gary's desk stops the player at ~36 px plain distance, outside the 32 px gather radius, and `moveToNear` gives up there rather than trying the western approach. A player pressing E from the obvious side gets nothing. Worth a look at the object's placement or its collider; the note *is* reachable from the west (log 187–219).

3. **Affiliate Handling Note could not be taken from the ENTROPY cache.** After taking Ghost's Operational Manifesto and closing its viewer, `mg take "Affiliate Handling Note"` returned `no-takeable-items` (log ~508–512). `insider_method_confirmed` was consequently never set. This may be the container re-render timing rather than the scenario; not on the critical path, and I did not retry far enough to rule the harness out.

4. **Graham Reeves could not be engaged in the boardroom.** `converse` on `night_security_supervisor` returned `ok:false` with no dialogue after `insider_identified` was set (log ~563). The mission completed regardless; `insider_asset_exposed` remained false. Not investigated further within budget.

5. **Dr. Kim's `offline_keys_recovered`-gated branch did not surface** in either pass of her hub after the keys were recovered, though Sister Doyle's did. It may be gated on something additional (e.g. the ransom decision, which had not been made at that point). Not re-checked after the recovery console.

Known-and-deliberately-unfixed items (dead hint-message handlers, phone-chat close-mid-typeout tag loss) were not exercised and are not reported here.
