# Station-qualified flag identifiers — implementation and proof

Run question: **plumbing** (does the new identifier path work end to end?) plus a
targeted **regression** check that m01's cached games are untouched.

- Session log: `tools/playtest/m02-stationqual-session.jsonl` (1984 lines, 1979 commands)
- Game id: **997** (`m02_ransomed_trust`, mission 46)
- Flags XML: `tools/playtest/m02_ransomed_trust-flags-game997.xml`
- m01 replay dumps: written by `tools/playtest/m01-noop-replay.rb`

## What changed

| File | Change |
| --- | --- |
| `app/controllers/break_escape/games_controller.rb` | Added `generate_flag_identifiers(flag_key, flag_station)` returning `["<stationKey>:<vm>-flagN", "<vm>-flagN"]`. `station_key` is the station `id`, falling back to `name`. `generate_flag_identifier` is unchanged and still supplies the `flagId` in the JSON response. `submit_flag` now passes the pair to the model. |
| `app/models/break_escape/game.rb` | `process_flag_task_completions!` takes a String or an Array. A task matches if `targetFlags & candidates` is non-empty, and the **matched `targetFlags` entries** — not the generated id — go into `submittedFlags`. Comment block above `validate_flag_submission` documents the two accepted authored forms. |
| `scenarios/m02_ransomed_trust/scenario.json.erb` | Four `targetFlags` moved to `flag_station_dropsite:hospital_backup_server-flag1..4`. **They were in the scenario *reference* form (`hospital_backup_server:flag_1`), not the display form the brief described** — see the discrepancy note at the end. |
| `test/models/break_escape/game_test.rb` | 4 new tests. |
| `test/controllers/break_escape/station_qualified_flag_test.rb` | New: 4 integration tests over the real HTTP path with two stations sharing one VM. |

`validate_flag_submission` needed no change: the client round-trips whatever the
server stored, and the server now stores strings drawn from `targetFlags`, so the
subset check still compares like with like. `objectives-manager.js` was not
touched — it only restores and replays `submittedFlags`, never synthesises one.

Nothing under `scenarios/m01_first_contact/` was modified.

## 1. Rails tests

```
$ bin/rails test test/models/break_escape/ test/controllers/break_escape/
211 runs, 497 assertions, 0 failures, 0 errors, 0 skips
```

Baseline before the change was 203 runs / 0 failures; the 8 added tests are the
difference. Run against the new integration test alone *before* the engine change,
the collision and legacy tests passed and `qualified targetFlags completes when
submitted at its own station` failed with `Expected [] to include
"submit_drop_flag"` — i.e. the tests do fail without the fix.

Coverage added:

- legacy unqualified target still completes when the candidate list also carries a qualified id
- qualified target completes when submitted at its own station
- qualified target does **not** complete when the same flag id arrives from a different station
- a multi-flag task whose `submittedFlags` were persisted in the old unqualified form completes when the remaining flag arrives
- integration: both stations still generate the identical unqualified id (the collision is real, and still there for legacy targets)
- integration: legacy target completes from either station — today's behaviour, unchanged
- integration: qualified target refused from the wrong station, accepted from its own

## 2. m01 no-op — empirical, not argued

`tools/playtest/m01-noop-replay.rb` loads **every real m01 game in the DB**, and
for each one, inside a rolled-back transaction, replays every flag in that game's
own cached `scenario_data` through the real controller helpers
(`resolve_flag_value` → `find_flag_station_for_flag` → identifier generation) into
the real `Game#process_flag_task_completions!`. It dumps per-flag outcomes plus
the resulting task and aim state. It adapts to whichever code is loaded: on the
old code it passes the single legacy id, on the new code the candidate pair.

Run once before the change and once after, over 65 games:

```
$ BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/m01-noop-replay.rb <out>.json
games replayed: 923, 924, ... 985, 988, 989
wrote .../m01-before.json (79750 bytes)
...
wrote .../m01-after.json  (79750 bytes)

games before/after: 65 65
IDENTICAL
sha before ff9e9acdb1c5c26619d68dc72546ac22b2dadb9703007dff505d166ee8bec839
sha after  ff9e9acdb1c5c26619d68dc72546ac22b2dadb9703007dff505d166ee8bec839
```

The dumps are byte-identical: same `flagId`, same completed/updated task lists,
same final `submittedFlags`, same aim statuses, same `mission_concluded` for every
one of the 65 games.

The baseline also reproduces the reported collision exactly (game 989):

```json
{"ref":"shatter_server:flag_3","station":"ENTROPY Launch Device","flagId":"shatter_server-flag1",
 "completed":["submit_linux_flag"]}
{"ref":"shatter_server:flag_2","station":"flag_station_dropsite","flagId":"shatter_server-flag1",
 "completed":[]}
{"ref":"shatter_server:flag_4","station":"flag_station_dropsite","flagId":"shatter_server-flag2",
 "completed":["submit_sudo_flag"]}
```

The launch device still completes `submit_linux_flag`, as it does live today. That
is the point: m01 is not opted in, so the engine change is invisible to it.

## 3. m02 playtest — game 997

Flag policy: `session` (VM flags supplied by `--flags`; no VMs in standalone).
Every step below cites lines in `tools/playtest/m02-stationqual-session.jsonl`.

### Earned secrets

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu, reception — `offer_key` | step 4, L14–17 | yes |
| Visitor Badge (Countersigned) | (item) | Dr. Sarah Kim, CTO office | step 5, L112–121 | yes |
| Boardroom PIN | `0417` | Dr. Kim's Desk Diary, CTO office desk | step 5a, L103–110 | yes |
| Emergency safe PIN | `1987` | Founding year — Kim's diary names the source; Gary's sticky note carries `Hospital1987` | L103–110, L171–174 | yes |
| SSH credential | `Hospital1987` | Gary's Password Sticky Note, IT dept | step 11, L171–174 | yes |
| Server Room Keycard | (item) | Gary Whitlock, leverage route after Warning 7 of 7 | step 10, L194–197, L220–241 | yes |
| Warning 7 of 7 | (item) | IT Filing Cabinet, picked | step 12, L180–197 | yes (assisted pick) |
| `hospital_backup_server` flag 1–4 | `<flag:1>`–`<flag:4>` | VM work — impossible in standalone; the in-game prerequisite (password sticky note → SSH cred) *was* obtained | L440, L445, L448, L544 | **no — prerequisite earned, flags handed over** |

The four flag rows are the boundary of what this run proves about solvability:
those steps were exercised, not tested, and everything downstream of them is
plumbing-verified rather than solvability-verified. Every other secret in the run
was obtained in-game before it was used.

### Steps

**Aim: Talk Your Way In**

| # | Step | Result | Log |
| --- | --- | --- | --- |
| 1 | Opening cutscene | PASS — `briefing_played`, `lockpicking_guide_offered` | L6–7 |
| 2 | Reception visitor log | PASS — `noticed_struck_booking` | L9–13 |
| 4 | Bernie Nwosu | PASS — `sign_in_at_reception` complete, `bernie_gave_key`, key given | L14–17 |
| 9 | Reception encrypted terminal | PASS — `decoded_ransomware_note` (taken early; step 9's aim) | L33–37 |
| 6 | Enter Patient Ward | PASS — `assess_the_ward` complete | L54–59 |
| 7 | Sister Doyle | PASS — `talk_to_ward_nurse`, `gather_pin_clues`; `locate_safe`/`crack_safe_pin` revealed | L60–73 |
| 5 | Dr. Sarah Kim (+ desk diary) | PASS — `meet_dr_kim`, badge given, `found_boardroom_code`, `kim_guilt_revealed`; `fire_drill` branch → `insider_evidence_partial` | L103–121 |

**Aim: Get Into IT**

| # | Step | Result | Log |
| --- | --- | --- | --- |
| 8 | IT door, override key | PASS — key lock driven properly, `open_it_department` | L162–171 |
| 12 | IT Filing Cabinet | PASS (assisted) — lockpick, all 3 documents taken, `gary_evidence_recovered` | L176–207 |
| 11 | Password Sticky Note | PASS — `password_hints_found` | L171–174 |
| 10 | Gary Whitlock, leverage route | PASS — `talk_to_gary`, `gary_trusts_player`, `gave_keycard`, Server Room Keycard given | L220–241 |
| 13 | Scapegoating | PASS — `gary_protected` | L112–121 |

**Aim: Somebody Pulled Your Booking**

| # | Step | Result | Log |
| --- | --- | --- | --- |
| 15 | Val Okonkwo | PASS — conversation completed, `insider_evidence_partial` confirmed via `discuss_reeves` | L404–415 |
| 17 | Security Office → Server Room | PASS — RFID keycard, `access_server_room` complete | L398–423 |
| 16 | `regain_freedom_of_movement` | PASS via backstop — `cover_restored` appears after server-room entry (see note below) | L423–444 |

**Aim: Turn Their Backdoor Around** — the point of this run

| # | Step | Result | Log |
| --- | --- | --- | --- |
| 18 | VM Access Terminal | PASS — `scanning_exploitation_guide_offered` | L430–435 |
| 19 | Flag 1 at drop-site | **PASS — `submit_ssh_flag` completed 80 ms after submit; `flag_ssh_submitted`** | L440–444 |
| 20 | Flag 2 | PASS — `submit_proftpd_flag`, `flag_proftpd_submitted`; Ghost calls | L445–447 |
| 21 | Flag 3 | PASS — `submit_database_flag`, `flag_database_submitted`, `insider_db_window_found` → `unmask_db_window` | L448–450 |
| 22 | Flag 4 | first attempt refused — the Ghost phone call had taken input (L451–454). Re-submitted after the call finished: PASS — `submit_ghost_log_flag`, `flag_ghost_log_submitted`, `insider_badge_id_found`, `backdoor_fully_exploited` | L544–549 |
| 23 | ENTROPY Staging Cache | PASS — flag-4 lock opened at a **second** flag station, both documents taken, `lore_ghosts_manifesto_found`, `insider_method_confirmed` | L555–573 |

Step 23 is worth noting on its own: the staging cache is a separate flag-locked
station accepting the same VM flag value, and it opened normally while the four
drop-site-qualified tasks stayed correctly bound to the drop site.

**Aim: Put A Name To The Badge**

| # | Step | Result | Log |
| --- | --- | --- | --- |
| 27 | Night Security Post Log | PASS — `inspected_asset_post` → `insider_identified`, `unmask_identify` complete | L860–865 |
| 28 | Graham Reeves | PASS — `insider_confronted`, `insider_asset_arrested` | L866–877 |

**Aim: Bring The Wards Back**

| # | Step | Result | Log |
| --- | --- | --- | --- |
| 30 | Emergency Storage | PASS — `locate_safe` | L604–611 |
| 31 | PIN safe `1987` | PASS — `crack_safe_pin`, `offline_keys_recovered` | L614–623 |
| 32 | Recovery Console, Combined Recovery | PASS — `initiate_backup_recovery`, `make_ransom_decision`, `backup_restore_initiated`, `ward_recovering`; Ghost's Act 3 video call, `ghost_deal_accepted` | L650–795 |
| 29 | Boardroom door `0417` | PASS | L850–857 |
| 33 | Communications Terminal, transmit | PASS — `decide_hospital_exposure`, `exposed_hospital`, **`mission_complete`** | L1006–1130 |
| 34 | Closing debrief + bond visualiser | PASS — Agent HaX debrief played through The Architect thread; `#complete_mission`, visualiser shown | L1340–1979 |

### Pass condition

```
status="completed"
mission_concluded_at=Tue, 08 Sep 2026 07:49:00.969474000 UTC +00:00
completed_at=Tue, 08 Sep 2026 07:49:00.969474000 UTC +00:00

submit_ssh_flag:       {"submittedFlags"=>["flag_station_dropsite:hospital_backup_server-flag1"], "status"=>"completed", ...}
submit_proftpd_flag:   {"submittedFlags"=>["flag_station_dropsite:hospital_backup_server-flag2"], "status"=>"completed", ...}
submit_database_flag:  {"submittedFlags"=>["flag_station_dropsite:hospital_backup_server-flag3"], "status"=>"completed", ...}
submit_ghost_log_flag: {"submittedFlags"=>["flag_station_dropsite:hospital_backup_server-flag4"], "status"=>"completed", ...}
```

All four `submit_*_flag` tasks complete, all four `flag_*_submitted` globals set,
`status` is `completed` with `mission_concluded_at` set. `submittedFlags` holds the
matched `targetFlags` entry in qualified form, which is the design's requirement.

## 4. verify-run.rb

```
$ BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb 997
game            997  (mission 46)
created         2026-09-08 07:20:23 UTC
last write      2026-09-08 07:49:03 UTC
played for      1720s of wall clock
current room    "reception_lobby"
unlocked rooms  15: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, office_hall_mid, dr_kim_office, office_hall_east, it_department, security_office, server_room, emergency_equipment_storage, office_hall_west, conference_room
unlocked objs   3: it_filing_cabinet, entropy_staging_cache, emergency_storage_safe
inventory       13: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Gary's Email Archive -- Warning 7 of 7, Dr. Kim's Reply -- 21 May, CryptoSecure Recovery Services Document, Gary's Password Sticky Note, Server Room Keycard, Ghost's Operational Manifesto, Affiliate Handling Note, Offline Backup Encryption Keys
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, dr_sarah_kim, gary_whitlock, security_guard_patrol, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_cbbe98}, flag{m02_ransomed_trust_hospital_backup_server_2_639a40}, flag{m02_ransomed_trust_hospital_backup_server_3_cf28dd}, flag{m02_ransomed_trust_hospital_backup_server_4_1afb81}
globals set     45: advised_board_pay, backdoor_fully_exploited, backup_recovery_source, backup_reinfected, backup_restore_initiated, bernie_gave_key, briefing_played, cover_restored, decoded_ransomware_note, dr_kim_met, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, found_boardroom_code, gary_evidence_recovered, gary_protected, gary_trusts_player, gave_keycard, ghost_deal_accepted, insider_asset_arrested, insider_badge_id_found, insider_confronted, insider_db_window_found, insider_evidence_partial, insider_identified, insider_method_confirmed, inspected_asset_post, kim_guilt_revealed, lockpicking_guide_offered, lore_cryptosecure_found, lore_ghosts_manifesto_found, mission_complete, noticed_struck_booking, offline_keys_recovered, password_hints_found, patient_bed2_state, patient_bed4_state, player_name, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, scanning_exploitation_guide_offered, ward_recovering

VERDICT: progress recorded — 14 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

## Observations, none of them classified as bugs

1. **`cover_burned` never appears in the final global set**, and a `waitFor` on it
   timed out at L262–265 — yet the Agent HaX "your booking is gone from the log"
   messages did arrive (visible in the L370 screenshot) and
   `cover_burned_notified` was never left open. Something sets the notification
   without leaving the global. Unrelated to this change; worth a look separately.
2. **`regain_freedom_of_movement` stayed open across Val's conversation** and only
   cleared once the server room was entered (the documented backstop). Gary's
   "something that holds up in a corridor" hub option was never offered in this
   run — his hub had collapsed to a single "I should get on." after the leverage
   route (L246–259). Also unrelated to this change.
3. **Harness, not game**: `enter` only knows doorways in the direction it first
   saw them, so leaving a leaf room (CTO office, IT department) needs `walk` or
   raw `moveTo`. And in IT the crash cart at (397,-513) traps the player against
   the south doorway — backing north first and then walking down clears it. Both
   cost roughly 30 commands here.

Known and deliberately unfixed, as briefed: the dead Agent HaX/Ghost hint
handlers, and phone-chat conversations skipping end-of-conversation tags if closed
mid-typeout (this run let every phone conversation finish typing).

## Anything contradicting the design

**One discrepancy in the brief, not in the design.** The brief said m02's four
`targetFlags` were "the current display form (`hospital_backup_server-flag1`…)".
They were not — at HEAD and in the working tree they were the scenario *reference*
form:

```
$ git show HEAD:scenarios/m02_ransomed_trust/scenario.json.erb | grep -n targetFlags
324:          "targetFlags": ["hospital_backup_server:flag_1"],
335:          "targetFlags": ["hospital_backup_server:flag_2"],
346:          "targetFlags": ["hospital_backup_server:flag_3"],
357:          "targetFlags": ["hospital_backup_server:flag_4"],
```

Per the engine's own comment (and the pinned test
`submit_flags task does NOT complete when targetFlags use the vm:flag_N reference
form`), that form never matches anything, so m02's four flag tasks could not
complete server-side at all before this change. The edit therefore fixes m02 as
well as opting it in. Nothing about the design changes: the target form I wrote is
exactly the one the design specifies, and it works, as game 997 shows.

Also worth stating plainly: because m02's old targets never matched, this playtest
proves the **qualified** path works end to end, but it is not a differential test
against a previously-working m02. The differential evidence for "legacy behaviour
is unchanged" is the m01 replay in section 2 and the integration tests in
section 1.

One detail the design did not spell out, resolved the obvious way: a task can in
principle list *both* forms of the same flag in `targetFlags`, so the match
records every matched entry rather than just the first.
