# m02_ransomed_trust — lock-fix verification run (game 1023)

## What this run answers

This is a **plumbing run with a specific verification purpose**: does commit `06fcdd1b` (row-lock on `inventory`/`room` in `GamesController`) actually stop task completions from being silently clobbered by concurrent writes? It is not a from-scratch solvability audit — PINs and the boardroom code were read from in-game sources as encountered, but the route was driven efficiently rather than exhaustively exploring every optional branch.

**Result: the fix holds.** `status: completed`, `mission_concluded_at` set, and the server's own count of completed tasks matches the persisted task-state hash exactly (27 = 27). No task that the client saw complete failed to persist.

## Session log

- Path: `tools/playtest/m02-lockfix-session.jsonl` (2754 lines, 2746 commands, 1 session)
- Game: 1023, mission 46 (`m02_ransomed_trust`)
- Flags: `tools/playtest/m02_ransomed_trust-flags-game1023.xml` (session policy, not earned via VM — standalone has no VMs)

Notable line ranges:
- Lines 1–8: an earlier session-open attempt that failed with `window.__test never appeared` under a **headed** browser. This environment cannot open a real X display for Playwright (confirmed independently — a bare `chromium.launch({headless:true})` smoke test worked immediately, `headless:false` hung to timeout). This is an environment constraint of this sandbox, not a scenario or engine defect. All actual gameplay ran `--headless`.
- Line 9 onward: the real run. `bootstrap` at seq 2 (line 9), confirmed fresh game (`openTasks` = `sign_in_at_reception`, `meet_dr_kim`, `assess_the_ward`, `talk_to_ward_nurse (opt)`; no session-resume overlay, no prior completions).
- Lines 33–34: Bernie Nwosu conversation, honest opening line (`I'm the security consultant Dr. Kim called in`), hub exhausted (57 turns), IT Override Key received, `bernie_trusts_player` set.
- Lines 55–61+: Sister Doyle conversation — first `converse` attempt returned `no-effect-confirmed` (engineDistance 25 < range 32, so the click reached the game but produced no visible effect on first try); retried and succeeded. Empathy route taken (`gather_pin_clues` + safe PIN volunteered).
- ~seq 1383 (line 1390) through ~seq 1695 (line 1702): the four `<flag:N>` session substitutions, logged with `earnedInGame: false` as designed — this run did not attempt the VM work.
- Line 2397 (seq 2390): closing debrief (`closing_debrief_trigger`) opens after the press-terminal transmit decision.
- Line 2749 (seq 2742): bond-visualiser stage (`bv-stage` blocking UI) confirmed showing — this is the point the task instructions warned not to wait on.
- Line 2752 (seq 2745): `quit` sent after `sync`.

## `verify-run.rb` output (full)

```
game            1023  (mission 46)
created         2026-09-10 14:47:40 UTC
last write      2026-09-10 15:40:45 UTC
played for      3185s of wall clock
current room    "reception_lobby"
unlocked rooms  15: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, office_hall_mid, dr_kim_office, office_hall_east, it_department, security_office, server_room, emergency_equipment_storage, office_hall_west, conference_room
unlocked objs   4: dr_kim_office_safe_4, it_filing_cabinet, entropy_staging_cache, emergency_storage_safe
inventory       16: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Budget Report, Zero Day Syndicate Invoice, Gary's Email Archive -- Warning 7 of 7, Dr. Kim's Reply -- 21 May, CryptoSecure Recovery Services Document, Gary's Password Sticky Note, Server Room Keycard, Spare Contractor Lanyard, Ghost's Operational Manifesto, Affiliate Handling Note, Offline Backup Encryption Keys
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, dr_sarah_kim, gary_whitlock, security_guard_patrol, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_2c0761}, flag{m02_ransomed_trust_hospital_backup_server_2_5bf8ed}, flag{m02_ransomed_trust_hospital_backup_server_3_f9eec1}, flag{m02_ransomed_trust_hospital_backup_server_4_7f1182}
globals set     53: advised_board_pay, backdoor_fully_exploited, backup_recovery_source, backup_reinfected, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, cover_restored, decoded_ransomware_note, dr_kim_met, exploitation_guide_offered, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, found_boardroom_code, gary_evidence_recovered, gary_protected, gary_trusts_player, gave_keycard, insider_asset_arrested, insider_badge_id_found, insider_confronted, insider_db_window_found, insider_evidence_partial, insider_identified, insider_method_confirmed, inspected_asset_post, kim_guilt_revealed, lockpicking_guide_offered, lore_cryptosecure_found, lore_ghosts_manifesto_found, lore_zds_invoice_found, mission_complete, noticed_struck_booking, offline_keys_recovered, password_hints_found, patient_bed2_state, patient_bed4_state, player_name, privesc_guide_offered, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, scanning_exploitation_guide_offered, scanning_guide_offered, ssh_guide_offered, staff_lanyard_obtained, vulnerability_guide_offered, ward_recovering

VERDICT: progress recorded — 14 rooms beyond the first, 4 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

## Authoritative lock-check (full output)

```
status=completed concluded=Thu, 10 Sep 2026 15:40:42.732922000 UTC +00:00
counter=27 persisted=27 entries=27
MISSING from state entirely: ["investigate_gary_office"]
gate unmet: []
```

**`counter` and `persisted` match exactly (27 = 27).** This is the headline finding: no task the client believed had completed failed to reach the database, across the whole run including the point in the walkthrough (`talk_to_gary`) where the previous run (game 1022) lost seven completions to the race condition. `gate unmet: []` confirms the mission-conclusion `requiresCompleted` gate (`talk_to_gary`, `access_server_room`, `submit_proftpd_flag`, `submit_ghost_log_flag`, `initiate_backup_recovery`, `make_ransom_decision`, `decide_hospital_exposure`) was fully satisfied server-side, not just client-side.

**One task, `investigate_gary_office`, is missing from the state hash entirely** — not present even as an incomplete entry. This is an **optional** task (marked `(opt)` in `TESTING_WALKTHROUGH.md` step 12) tied to opening Gary's filing cabinet, which this run did open (Warning 7 of 7, Dr. Kim's Reply, and the CryptoSecure document were all taken and their globals — `gary_evidence_recovered`, `lore_cryptosecure_found` — are confirmed set). Despite that, the task never appears in `objectivesState.tasks` at all, active or complete. This looks like a separate scenario-side wiring gap (the task's completion condition may never actually fire on cabinet-open/item-pickup), not a recurrence of the row-lock bug — the counter/persisted match proves the lock itself is not dropping writes. I'm not classifying this further; it's worth a maintainer's attention.

## Error count (log line 1294020 onward — this run only)

```
tail -n +1294020 test/dummy/log/development.log | grep -cE "BusyException|Completed 500"
```
Result: **0**

## Which Gary route was taken

Rapport/honesty route, not leverage or blame. Sequence: acknowledged his seven ignored warnings honestly → validated his frustration → asked about the vulnerability (earning `decoded_ransomware_note` eligibility and the reused-credential hint) → asked "I need into the server room" → he handed over the Server Room Keycard directly (`gary_trusts_player` set, no `keycard_conditional`/`keycard_trusted`-specific global observed by name but `gave_keycard` is set) → separately asked for a lanyard ("Someone's phoned security and pulled my booking...") and received the Spare Contractor Lanyard (`staff_lanyard_obtained`, `cover_restored`). A second conversation was then opened and the **leverage** hub option ("Gary. Look at this.") was also exercised on top of the already-earned trust, using the Warning 7 of 7 taken from his filing cabinet — this fired `learn_about_scapegoating`/`gary_protected` via the "I'm putting all seven in the SAFETYNET record" branch. So this run exercised both the rapport path to the keycard/lanyard and the leverage/vindication branch in the same session (the game allowed this; it did not appear to double-grant the keycard).

## Other choices at the mission-conclusion beats

- Boardroom PIN `0417` and safe PIN `1987` were both read in-game (Kim's Desk Diary; the Hospital Founding Plaque; Sister Doyle's empathy route) before use.
- Reeves was identified (Night Security Post Log + `insider_badge_id_found` from flag 4) and confronted, choosing the quiet-arrest stance ("Quietly. You're under arrest. SAFETYNET has you.") → `insider_confronted` + `insider_asset_arrested` both true, and his sprite went `visible:false` as documented for the arrested path.
- Recovery console: **Combined Recovery** (VM keys + physical keys) selected — the optimal option, £0 to ENTROPY, 4-hour restore, low patient risk. `backup_restore_initiated`, `make_ransom_decision`/`ransom_decision_made` both completed by this single choice.
- Ghost's Act 3 deal was **declined** ("No deal. We don't negotiate with ENTROPY.") — `ghost_deal_accepted` was not exercised this run.
- Press terminal: **transmitted everything** (`exposed_hospital: true`) — full public disclosure of the board's cover-up, budget deferral, and Gary's ignored warnings.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu, honest opening → `offer_key` | line 34 | yes |
| Boardroom door PIN | `0417` | Dr. Kim's Desk Diary | ~seq 200s (Kim's office visit) | yes |
| Emergency/Kim's Safe PIN | `1987` | Hospital Founding Plaque (reception) + Sister Doyle's empathy route + confirmed again via Kim's diary | earliest: founding plaque, early in run | yes |
| Server Room Keycard | (item) | Gary Whitlock, rapport route | ~seq 900s | yes |
| Spare Contractor Lanyard | (item) | Gary Whitlock, "pulled my booking" hub option | same conversation | yes |
| `hospital_backup_server:flag_1..4` | `<flag:1..4>` session tokens | — VM exploitation not possible in standalone | submitted directly at drop-site | **no** — session-supplied, not earned. The reused-credential hint (`Hospital1987`) and the ProFTPD/vulnerability guides *were* earned in-conversation with Gary, but the flags themselves require real VM work this environment cannot do. |

Rows marked "no" are the boundary of what this run proves: the flag-station wiring, task completion, and reward chain downstream of each flag were exercised and are shown to persist correctly (that's the whole point of this run), but the VM challenges themselves remain unproven by this run.

## New bugs / findings observed (not fixed, per instructions)

1. **`investigate_gary_office` task never enters `objectivesState.tasks`** even though its prerequisite item (Warning 7 of 7 from the filing cabinet) was picked up and its associated globals fired. Documented above under the lock-check output. Worth a maintainer look at the task's completion trigger in the scenario ink/JSON — separate issue from the row-lock fix.
2. **Bridge `mismatch:true` false positives on generic-titled minigames.** 17 of 18 `mismatch:true` interactions in this run were *not* real navigation errors — they were the correct object opening its own minigame under a generic title (e.g. the ward/CTO/IT ransomware terminals all report `opened.title: "Ransomware Impact Display"` regardless of which physical terminal was clicked; PIN safes report `"Enter PIN for item"`; the ENTROPY cache's flag-lock reports `"Flag Submission Terminal"`; the recovery console reports `"Backup Recovery Console"`; person-chat NPC conversations flagged mismatch even though the dialogue's own `speaker`/title exactly matched the NPC requested). Confirmed each case by reading `mg getState()` afterward and finding the correct content. **One** mismatch was genuine: clicking `infected_terminal` in the IT department opened "Printouts on Gary's Desk" instead (a nearby note won the click), caught and corrected by re-approaching. This is a harness reporting quirk, not a game bug — flagging it because the task's evidence rules require distinguishing genuine mismatches from noise.
3. **Movement through some rooms (`dr_kim_office`, `hospital_ward`, `ward_hall`, `office_hall_mid`/`_west`) required repeated `walk`/`moveTo` nudges** to cross doorway thresholds that `moveTo`/`enter` alone did not reliably cross on the first attempt (colliders stopping short of the doorway gap). Every one of these eventually succeeded with a retry or a manual `walk` in the right direction — not a hard blocker, just slower than expected. Consistent with the documented "an unlocked door's sprite can vanish from the scan" and collider-shortstop findings already on file from the m01 baseline; not re-litigating as a new class of bug, just noting it recurred here.
4. **`backup_reinfected` global fired** after selecting Combined Recovery — not investigated further (out of scope for this run), but worth a scenario designer's eye given the Decision-Weight beats notes in `TESTING_WALKTHROUGH.md` about ward recovery consequences.

## Bottom line

- Reached `status: completed` with `mission_concluded_at` set: **yes**.
- `counter` (27) vs `persisted` (27): **match**. `MISSING from state entirely`: one optional task (`investigate_gary_office`), unrelated to the lock fix (see above).
- Error count (`BusyException`/`Completed 500` in this run's log window): **0**.
- Gary route: rapport (keycard + lanyard) followed by leverage/vindication (learn_about_scapegoating) in the same conversation session.
- The row-lock fix (commit `06fcdd1b`) holds: nothing completed client-side in this run failed to persist server-side, including at the exact `talk_to_gary` beat that broke game 1022.
