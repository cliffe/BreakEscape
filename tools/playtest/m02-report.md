# m02_ransomed_trust — playtest report

**Walkthrough source:** `scenarios/m02_ransomed_trust/TESTING_WALKTHROUGH.md` (parsed once at the start of the run; a `SOLUTION_GUIDE.md` also exists but was not used).

**Which question this run answers:** primarily (1) does the plumbing work on the intended route — the run followed the walkthrough's numbered steps end to end. It also incidentally surfaces (2) off-script behaviour (a hard dead-end in Dr Kim's dialogue tree, several harness-vs-engine range/traversal quirks) and delivers a definitive answer to (3): **no route exists to finish this mission**, in standalone or with real VMs, because of a server-side bug independent of flag values (see Finding 1). This is a scenario-code defect, not a standalone-flags limitation.

**Game id:** 990 (mission 46)
**Session log:** `tools/playtest/m02-session.jsonl` (1646 lines / 1645 commands)
**Flags XML:** `tools/playtest/m02_ransomed_trust-flags-game990.xml` (synthesized by `new-game.rb`, `PREFLIGHT OK`, `VALID_FLAGS=4`)
**Flag policy:** `session` — flags submitted as `<flag:1..4>`, substituted from the XML above.

## verify-run.rb output (verbatim)

```
game            990  (mission 46)
created         2026-09-07 22:43:38 UTC
last write      2026-09-07 23:17:59 UTC
played for      2061s of wall clock
current room    "reception_lobby"
unlocked rooms  12: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, office_hall_mid, dr_kim_office, office_hall_east, it_department, security_office, server_room
unlocked objs   0: 
inventory       8: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Gary's Password Sticky Note, Server Room Keycard, Val's Pocket Notebook
NPCs met        15: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, dr_sarah_kim, gary_whitlock, security_guard_patrol
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_5fb7d3}, flag{m02_ransomed_trust_hospital_backup_server_2_2330c0}, flag{m02_ransomed_trust_hospital_backup_server_3_d6c4b0}, flag{m02_ransomed_trust_hospital_backup_server_4_346199}
globals set     18: backup_recovery_source, bernie_gave_key, briefing_played, cover_restored, decoded_ransomware_note, dr_kim_met, found_boardroom_code, gary_trusts_player, gave_keycard, insider_evidence_partial, kim_guilt_revealed, lockpicking_guide_offered, noticed_struck_booking, patient_bed2_state, patient_bed4_state, player_name, ransomware_deployed, scanning_exploitation_guide_offered

VERDICT: progress recorded — 11 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
EXIT: 0
```

`sync` was sent at seq 1642, before `quit` at seq ~1644.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at (seq) | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu, reception — `converse` reward for the honest opening line | seq ~35 (converse turn 47) | yes |
| Boardroom PIN | `0417` | Dr. Sarah Kim, CTO office — asked directly ("What's the code for the boardroom?") | seq ~700 | yes |
| Founding-plaque date (safe PIN source) | `1987` | Hospital Founding Plaque, reception | seq ~30 | yes |
| Server Room Keycard | (item) | Gary Whitlock, IT department — rapport route (`keycard_trusted`) | seq ~1090 | yes |
| SSH credential | `Hospital1987` | Gary Whitlock — spoken directly, AND independently on Gary's Password Sticky Note (redundant source, both read) | seq ~1100 (note read earlier, seq ~1030) | yes |
| `hospital_backup_server:flag_1..4` | `<flag:1>`…`<flag:4>` | SAFETYNET Drop-Site Terminal, server room, after SSH-credential prerequisite obtained | prerequisite at seq ~1030; flags submitted seq 1608–1639 | **no — flags submitted and accepted server-side, but the tasks they were meant to complete never fire (Finding 1)** |
| Val's Pocket Notebook (insider evidence) | (item) | Val Okonkwo, Security Office — asked "You've got all this written down?" | seq ~1420 | yes |

The flag row is the boundary of what this run proves past the server room: the in-game prerequisite (SSH credential) was earned, and the flags were accepted by the server (`verify-run.rb` shows `flags submitted 4`), but — as Finding 1 shows — that acceptance never reaches the objectives system. Everything downstream (the ProFTPD/database/Ghost-log flags, the Ghost phone calls, the ENTROPY Staging Cache, the recovery console, the press terminal, and the ending) is unproven and, per Finding 1, currently *unreachable* by any means, not merely untested.

## Finding 1 (scenario/engine defect, high confidence, mission-blocking)

**All four flag submissions were accepted by the server and recorded (`player_state['submitted_flags']`, `flag_rewards_claimed`), but none of the four `submit_flags` objective tasks (`submit_ssh_flag`, `submit_proftpd_flag`, `submit_database_flag`, `submit_ghost_log_flag`) ever completed, and none of the four `flag_*_submitted` globals were ever set.**

Root cause, confirmed by reading the source and reproducing server-side directly (not inferred):

- `scenarios/m02_ransomed_trust/scenario.json.erb` writes `targetFlags` in the form `"hospital_backup_server:flag_1"` (colon + underscore) for all four tasks (lines 324, 335, 346, 357).
- `GamesController#generate_flag_identifier` (app/controllers/break_escape/games_controller.rb:2092-2105) always builds the identifier as `"#{vm_id}-flag#{flag_index + 1}"` — hyphen, no underscore, e.g. `"hospital_backup_server-flag1"`.
- `Game#process_flag_task_completions!` (app/models/break_escape/game.rb:1040-1090) matches with `Array(task['targetFlags']).include?(flag_id)`, comparing the scenario's colon-form string against the controller's hyphen-form string. These can never be equal, so the match always fails and the method silently returns without completing anything.

Verified directly against game 990 with `bin/rails runner`:
```
find_flag_station_for_flag(flag_key)  → station found correctly
generate_flag_identifier(flag_key, station) → "hospital_backup_server-flag1"
task['targetFlags']                   → "hospital_backup_server:flag_1"
```
These never match. `resolve_flag_ref` (game.rb:582-586) exists and correctly understands the colon form, but `process_flag_task_completions!` never calls it — it only compares raw identifier strings.

**This is not limited to m02 or to standalone flags.** Grepping `targetFlags` across all scenarios shows m02, m03, m04, m05, m06, m07 and m08 all use the colon+underscore form exclusively for every VM-backed flag task. m01_first_contact is inconsistent: its first flag task (`shatter_server:flag_1`, line 350) uses the colon form, but its second and third (`shatter_server-flag1`, `shatter_server-flag2`, lines 362/372) use the hyphen form that actually matches the engine. That means m01's *first* SSH flag task likely has the same silent-completion bug, masked in the m01 baseline report because the mission's other three flag tasks used the (correct, but differently-formatted) convention and did complete, so the run read as a full pass.

**Impact:** because `requiresCompleted` on the mission-conclusion aim includes `submit_proftpd_flag` and `submit_ghost_log_flag` (per `TESTING_WALKTHROUGH.md`'s stated server-side guard), and neither can ever complete under the current code, **m02 cannot be finished by any player, with real VM flags or without.** This is a genuine engine/data-format defect, not a standalone-testing artefact — real Hacktivity flags would hit exactly the same string-comparison mismatch. I am flagging this as "suspect defect" per the skill's evidentiary bar, having ruled out (a) target-range/harness misuse — the station was interacted with correctly and confirmed the right minigame opened; (b) false success without confirmation — I read the server's own `player_state` directly via `rails runner`, not just the client UI; (c) wrong UI driving — the flag station showed correct `submittedFlags` and `flag_rewards_claimed` on all four submissions, so the failure is downstream of successful submission, in task-completion matching.

## Finding 2 (scenario defect, high confidence): a dead-end choice permanently skips `meet_dr_kim`

At Dr. Sarah Kim's `explain_attack` knot (`scenarios/m02_ransomed_trust/ink/m02_npc_sarah_kim.ink:83-102`), all three of her first-meeting choices route into `explain_attack`, which then offers three further choices. Two of them (`And you deferred it.` / `What did you spend it on instead?`) route to `the_deferral` → `access_problem`, which completes `meet_dr_kim`, unlocks the `access_it_systems` aim, and hands over the countersigned badge. The **third** option, `Understood. Where's Gary now?`, routes to `discuss_gary` (line 226), which only ever returns to `hub` (line 185) — a hub with no path back to `the_deferral` or `access_problem`. A player who picks that third option at that specific branch point permanently soft-locks `meet_dr_kim`, and therefore the entire "Get Into IT" aim, IT department access, and everything downstream. `access_explained` never becomes true, so `start`'s branch (`{access_explained: -> returning}`) keeps re-entering `first_meeting`/`explain_attack` on every subsequent visit — the conversation loops forever with no way out.

Reproduced live in this run: I deliberately took that branch first (seq 464-583), confirmed `meet_dr_kim` stayed incomplete and `dr_kim_met` stayed unset across a full `converse` pass to exhaustion, then used the console command documented in the walkthrough itself (`window.npcConversationStateManager.clearNPCState('dr_sarah_kim')`, seq 802) to restart her conversation from `first_meeting` and take a completing branch instead (seq 802-1069), after which `meet_dr_kim` and `dr_kim_met` set correctly. This reset is not something a real player has access to — there is no in-game route back to `access_problem` once `discuss_gary` is taken at that specific point.

## Findings believed to be harness gaps, not scenario bugs

- **Unlocked-but-already-open doors between rooms frequently vanish from `room` scans and block `moveToNear`/`enter`**, matching the documented "unlocked door vanishes" behaviour, but in several cases (`dr_kim_office`→`office_hall_mid`, `it_department`→`office_hall_east`, `office_corridor`→`security_office`) the *tile* itself also refused `moveTo`/`enter` at the door's own coordinates (`shortfall` 30-40px), and only a raw `walk` in the correct screen direction got the player through. This matches the open item in `m01-confirm-verification.md` about a collider "up to 59.7px" short-stopping `moveToNear` on some objects — I'm treating this as the same class of harness/collision-approach gap (m01-confirm item under "Baseline achieved," server-room collider), not a scenario bug, since `walk` always worked once the correct direction was identified.
- **`interact` on the Infected Terminal (`it_department`) reported `mismatch:true, reason:"wrong-target-opened"`** with `opened.title` = "Ransomware Impact Display" against `entity.name` = "Infected Terminal" — but the object's own `lockType` was already `ransomware_display`, and the content that opened was exactly the walkthrough's step-9 ransomware note (seq ~1030 area, confirmed `decoded_ransomware_note` set immediately after). This looks like a harness false-positive comparing display title against sprite label rather than object id — the same object opened its own designed content, not a different interactable, so I did not record it as a step failure.
- **`mg action:"continue"` (spacebar) frequently failed to advance dialogue that `mg action:"clickText",["Skip"]` (DOM click on the same button) then advanced immediately after**, across three different NPCs (Sister Doyle, Dr. Kim, Gary). This cost a large amount of the run's step budget (see raw command count vs. useful steps). Given `docs/test-bridge.md`'s note that Phaser 3.60 binds `mousedown` not `pointerdown` and needs `pageX/pageY`, and that the dialogue continue button is a DOM element layered over the canvas, I suspect the keyboard-dispatch path for continue is less reliable than the click path for this minigame specifically, but I have not diagnosed the exact cause and am flagging it as "suspect harness," not confirmed.

## Step results (grouped by aim, walkthrough numbering)

### Aim: Talk Your Way In

| # | Step | Result | Evidence (seq) |
| - | --- | --- | --- |
| 1 | Opening briefing / `briefing_played` | PASS — bootstrap cleared cutscene/tutorial cleanly, fresh game confirmed (no "OTHER SESSIONS", tasks open) | 2-3 |
| 2 | Reception Visitor Log → `noticed_struck_booking` | PASS | 11-14 |
| 3 | Crisis Protocol Notice (optional) | PASS | 17-19 |
| 4 | Bernie Nwosu, honest opening → `sign_in_at_reception` complete, `bernie_gave_key`, `bernie_trusts_player` | PASS — chose the honest line ("I'm the security consultant..."), `converse` ran to exhaustion (47 turns), Bernie's "you told me the truth ... I've clocked that" line confirms `bernie_trusts_player` | 27-35 |
| 5 | CTO Office, Dr. Sarah Kim → `meet_dr_kim` complete, badge, boardroom code | PASS on the second attempt after the Finding-2 dead end; boardroom PIN `0417` earned directly (seq ~700); badge confirmed in inventory | 464-1069 (see Finding 2) |
| 6 | Enter Patient Ward (bottom-right) → `assess_the_ward` complete | PASS — task auto-completed on room entry | ~200-210 |
| 7 (opt) | Sister Doyle conversation → `talk_to_ward_nurse`, `gather_pin_clues` | PASS — `gather_pin_clues` completed (confirmed via `task_completed_by_npc` event); did not confirm `showed_empathy`'s explicit-PIN branch, but the plaque already gave `1987` independently | ~240-380 |

**Aim completion:** all of 1, 4, 5, 6 done — PASS.

### Aim: Get Into IT

| # | Step | Result | Evidence (seq) |
| 8 | IT door, override key → `open_it_department` complete | PASS — `lock` command with `key:"IT Department"` unlocked it in one call | 1005-1010 |
| 9 | Ransomware terminal → `decode_ransomware_note` | PASS (see harness note on mismatch above — content was correct) | 1020-1030 |
| 10 | Gary Whitlock, rapport route → `talk_to_gary` complete, keycard given | PASS — followed the rapport branch (`gary_influence` building choices), `keycard_trusted` reward: card, credentials (`Hospital1987`), `obtain_password_hints` complete | 1071-1130 |
| 11 | Password Sticky Note → `obtain_password_hints` (redundant path) | PASS — read independently before talking to Gary | ~1035 |
| 12 (opt) | IT Filing Cabinet | not attempted (time budget) | — |
| 13 (opt) | Scapegoating thread | PASS incidentally — chose "Then go and tell him it wasn't" with Kim (`gary_protected`-leaning line) | 700-780 |

**Aim completion:** 8, 9, 10, 11 done — PASS.

### Aim: Somebody Pulled Your Booking

| # | Step | Result | Evidence (seq) |
| 14 | Cover-burn auto-notify | PASS — `cover_burned` set immediately after `talk_to_gary` completed | 1130 |
| 15 | Val Okonkwo, cover challenge | PASS — engaged her `cover_challenge` knot, chose the incident-response line | 1387-1420 |
| 16 | `regain_freedom_of_movement` via a lanyard route or the server-room backstop | PASS via the **backstop**: entering the server room set `cover_restored` and completed the task directly, without a lanyard | ~1550 |
| 17 | Security Office → Server Room, RFID keycard → `access_server_room` complete | PASS — door auto-unlocked on `interact` (RFID + held keycard), confirmed via `door_unlocked`/`door_opened` events | 1543-1547 |

**Aim completion:** 14, 16, 17 done — PASS.

### Aim: Turn Their Backdoor Around

| # | Step | Result | Evidence (seq) |
| 18 | VM Access Terminal → field-guide offer | PASS — `scanning_exploitation_guide_offered` set; terminal correctly reports "launch the VM in VirtualBox" (standalone has no VM) | 1600 |
| 19-22 | Submit flags 1-4 at the drop-site → `submit_*_flag` tasks, `flag_*_submitted` globals, Ghost's calls | **FAIL — see Finding 1.** All four flags accepted and recorded server-side (`submitted_flags`, `flag_rewards_claimed`); none of the four tasks completed; none of the four globals were set; no Ghost calls fired | 1608-1639 (submissions); confirmed absent via direct `rails runner` query of `player_state['objectivesState']` and `globalVariables` |
| 23 | ENTROPY Staging Cache (flag-4 lock) | BLOCKED — gated on `flag_ghost_log_submitted`, which per Finding 1 can never be set | not reached |

**Aim completion:** not reached — blocked by Finding 1.

### Aims not reached

"Somebody Held The Door" (partial credit: step 24's `unmask_gather_evidence` completed via Val's Pocket Notebook, seq 1420-1460), "Put A Name To The Badge," and "Bring The Wards Back" (mission conclusion) were not reached, because Finding 1 makes the gating flag tasks permanently uncompletable.

## Answers to the three questions

1. **Does the plumbing work on the intended route?** Mostly yes, through three of five aims — dialogue, doors, locks, containers, the RFID backstop and the flag-station UI itself all worked as designed. It breaks decisively at the flag-to-task wiring (Finding 1): the plumbing between "flag accepted" and "task completed" is disconnected for every VM-flag task in this scenario.
2. **What breaks when the player goes off-script?** The dead-end at Dr. Kim's `discuss_gary` branch (Finding 2) is a genuine off-script trap: a plausible, narratively reasonable dialogue choice permanently blocks required-task completion with no in-game recovery.
3. **Can the mission be finished without doing the VM work?** No — and, per Finding 1, it cannot currently be finished even *with* the VM work either, because the defect is in server-side string matching, not in the absence of real flags.

## Files referenced

- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/scenarios/m02_ransomed_trust/scenario.json.erb` (lines 324-357: `targetFlags`; lines 1785-1800: flag-station `flags`/`flagRewards`; lines 862-895: `flag_*_submitted` global wiring)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/scenarios/m02_ransomed_trust/ink/m02_npc_sarah_kim.ink` (lines 44-138: the dead-end branch)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/app/controllers/break_escape/games_controller.rb` (lines 956-1050: `submit_flag` action; lines 2092-2105: `generate_flag_identifier`)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/app/models/break_escape/game.rb` (lines 582-586: `resolve_flag_ref`; lines 1040-1090: `process_flag_task_completions!`)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tools/playtest/m02-session.jsonl` (session log, 1646 lines)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tools/playtest/m02_ransomed_trust-flags-game990.xml` (flag hints used)
