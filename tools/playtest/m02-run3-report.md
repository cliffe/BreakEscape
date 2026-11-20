# m02_ransomed_trust — playtest report (run 3)

**Walkthrough source:** `scenarios/m02_ransomed_trust/TESTING_WALKTHROUGH.md`, parsed once at the start of the run.

**Which question this run answers:** primarily (1) does the plumbing work on the intended route, with a specific mandate to re-verify the three fixes since run 2 and reach the ending. It answers (3) partially: the mission **can now be completed** via the ransom-payment recovery route with session-supplied flags; the offline-keys route was attempted but its item pickup could not be confirmed live (see Finding 3), so that specific alternate route to the ending is unproven by this run.

**Game id:** 993 (mission 46)
**Session log:** `tools/playtest/m02-run3-session.jsonl` (1955 lines: 1 session-open event + 1952 commands + 1 session-closed event, per the `quit` result `"commands":1952`)
**Flags XML:** `tools/playtest/m02_ransomed_trust-flags-game993.xml` (`PREFLIGHT OK`, `VALID_FLAGS=4`)
**Flag policy:** `session` — flags submitted as `<flag:1..4>`, substituted from the XML above.

## verify-run.rb output (verbatim)

```
game            993  (mission 46)
created         2026-09-08 01:11:11 UTC
last write      2026-09-08 02:18:27 UTC
played for      4036s of wall clock
current room    "reception_lobby"
unlocked rooms  15: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, office_hall_mid, dr_kim_office, office_hall_east, it_department, security_office, server_room, office_hall_west, conference_room, emergency_equipment_storage
unlocked objs   3: dr_kim_office_safe_4, entropy_staging_cache, emergency_storage_safe
inventory       11: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Dr. Kim's Signed Statement, Zero Day Syndicate Invoice, Server Room Keycard, Ghost's Operational Manifesto, Affiliate Handling Note, Offline Backup Encryption Keys
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, dr_sarah_kim, gary_whitlock, security_guard_patrol, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_e7c38b}, flag{m02_ransomed_trust_hospital_backup_server_2_42c18c}, flag{m02_ransomed_trust_hospital_backup_server_3_7993c1}, flag{m02_ransomed_trust_hospital_backup_server_4_51137f}
globals set     39: backdoor_fully_exploited, backup_recovery_source, backup_reinfected, backup_restore_initiated, bernie_gave_key, briefing_played, cover_restored, decoded_ransomware_note, dr_kim_met, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, found_boardroom_code, gary_protected, gary_trusts_player, gave_keycard, insider_badge_id_found, insider_db_window_found, insider_evidence_partial, insider_identified, insider_method_confirmed, inspected_asset_post, lockpicking_guide_offered, lore_ghosts_manifesto_found, lore_zds_invoice_found, mission_complete, noticed_struck_booking, paid_ransom, patient_bed2_state, patient_bed4_state, player_name, player_warned_kim, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, scanning_exploitation_guide_offered, ward_recovering

VERDICT: progress recorded — 14 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

**`mission_complete: true` and `exposed_hospital: true` are both in the server-persisted globals list — the mission genuinely reached its ending, confirmed server-side, not just in the live client.** This is new relative to both run 1 and run 2, neither of which reached this state.

## Answer to the primary question: can the mission now be completed? **YES.**

Run 2 was blocked one aim short of the ending (`backdoor_fully_exploited` never fired, so the press terminal refused to transmit). This run reached and completed the press terminal transmission and the closing debrief. `mission_complete` and `exposed_hospital` are both `true` in the server-persisted state above.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at (seq) | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu, reception — `converse`/manual reward for the honest opening line | seq ~2-90 | yes |
| Safe PIN `1987` | `1987` | Hospital Founding Plaque, reception (read directly), and separately volunteered by Sister Doyle after the empathy route | seq ~50-70 (plaque); confirmed again seq ~330 (Doyle) | yes |
| Boardroom PIN `0417` | `0417` | Dr. Sarah Kim's Desk Diary, CTO office (read directly), and separately stated in her hub dialogue | seq ~430-450 (diary); confirmed again in dialogue | yes |
| Server Room Keycard | (item) | Gary Whitlock, IT department — rapport route (`gary_influence` 15+12=27 ≥ 25 → `keycard_trusted`) | seq ~560-640 | yes |
| SSH credential `Hospital1987` | `Hospital1987` | Gary Whitlock, spoken directly during the rapport-route `discuss_passwords` knot ("Emma2018. **Hospital1987**. StCatherines. ... I'd try the middle one.") | seq ~600-640 | yes |
| `hospital_backup_server:flag_1..4` | `<flag:1>`…`<flag:4>` | SAFETYNET Drop-Site Terminal, server room, after the SSH-credential prerequisite (Gary's rapport dialogue) was obtained | prerequisite at seq ~600-640; flags submitted at seq ~1000-1090 | **no — the credential was earned, but the flag values themselves cannot be earned in standalone (no VM); this is the expected boundary, not a defect** |
| `inspected_asset_post` (for `insider_identified`) | (read) | Night Security Post Log, boardroom, read *before* submitting flag 4 | seq ~940-960 | yes |

Seq numbers are approximate positions in `tools/playtest/m02-run3-session.jsonl` (1955 lines), read from surrounding command context rather than the literal `seq` field for every single one; precise values are given where I queried `eval`/`drain` directly against a known point.

The flag row is the honest boundary of what standalone proves: the SSH-credential prerequisite (Gary's spoken password) was earned in-game before use, and all four flags were accepted server-side and completed their tasks. The flag *values* cannot be earned without a real VM — this is expected and is not itself a finding.

## Fix verification (the three items this run was specifically sent to check)

### Fix 1 — flag-identifier normalisation: **RE-CONFIRMED WORKING**

All four flags completed their tasks and set their globals, confirmed via direct `eval` against `window.__test.getState()`:
- Flag 1: `flag_ssh_submitted: true`, task `submit_ssh_flag` completed
- Flag 2: `flag_proftpd_submitted: true`, task `submit_proftpd_flag` completed
- Flag 3: `flag_database_submitted: true`, task `submit_database_flag` completed, **and `insider_db_window_found: true`** (chain link, see below)
- Flag 4: `flag_ghost_log_submitted: true`, task `submit_ghost_log_flag` completed

### Fix 2 — Dr. Kim `discuss_gary` dead-end: **RE-CONFIRMED WORKING, no console workaround needed**

Deliberately reproduced the dead end: at Kim's `explain_attack`, took the `discuss_gary` branch. Confirmed via `eval` that `dr_kim_met: false` and `meet_dr_kim` remained in `openTasks` at that point. Then, at Kim's hub, the recovery option `"Before anything else -- I need to get into your IT department. What can you actually authorise?"` was present and chosen. It routed to `access_problem`, which immediately completed `meet_dr_kim`, set `dr_kim_met: true`, and gave the countersigned badge. **No console command was used at any point in this run.**

### Fix 3 — dead event handlers on shared `eventPattern`s (the fix that blocked run 2): **CONFIRMED WORKING — the full chain fires**

This was the primary target of the run. Checked `window.__test.getState().globals` directly (via `eval`) at each link:

- After submitting flag 3 (`flag_database_submitted`): `insider_db_window_found: true` — **link fires**.
- After submitting flag 4 (`flag_ghost_log_submitted`), having first read the Night Security Post Log (`inspected_asset_post: true`) beforehand as instructed:
  ```json
  {"flag_ghost_log_submitted":true,"backdoor_fully_exploited":true,"insider_badge_id_found":true,"insider_identified":true}
  ```
  **All four links in the chain fire: `flag_ghost_log_submitted` → `backdoor_fully_exploited` → `insider_badge_id_found` → `insider_identified`.**
- Tasks `unmask_ghost_badge`, `unmask_identify`, `unmask_db_window`, and `unmask_gather_evidence` all completed correctly, confirmed in `completedTasks`.
- Downstream: the press terminal's ink gate on `backdoor_fully_exploited` (which run 2 could never pass) was satisfied. Combined with `ransom_decision_made: true` (set after the recovery-console decision), the terminal offered the transmit menu instead of `relay_locked_investigation`.

**No link in the chain failed. This is the direct cause of reaching the ending, and it is the single most important confirmation this run makes.**

## Finding 1 (confirmed, high confidence): ending Dr. Kim's conversation clobbers unrelated globals back to their per-file Ink defaults — a new engine defect, distinct from the onceOnly dedup bug

Immediately after closing Dr. Kim's conversation (the recovery-hub session, seq ~752-763 in the log), a burst of `global_variable_changed` events fired for six variables in one tick, all reading their *Ink-file-local default* rather than the shared value:

```json
{"seq":754,"event":"global_variable_changed:cover_burned","data":{"name":"cover_burned","value":false}}
{"seq":755,"event":"global_variable_changed:cover_restored","data":{"name":"cover_restored","value":false}}
{"seq":756,"event":"global_variable_changed:staff_lanyard_obtained","data":{"name":"staff_lanyard_obtained","value":false}}
{"seq":757,"event":"global_variable_changed:insider_identified","data":{"name":"insider_identified","value":false}}
```

`cover_burned` had genuinely been set `true` moments earlier by Agent 0x99's `objective_task_completed:talk_to_gary` handler (confirmed via `eval` immediately before and after: `true` → `false`, with no other action in between except closing Kim's dialogue). `dr_kim_met` was in the same batch and correctly stayed `true` — because Kim's own ink story *does* touch that variable this session; the others were clobbered specifically because Kim's ink file declares them as local `VAR ... = false` and her story never touched them, so ending her conversation appears to sync her whole local variable table back onto the shared globals, overwriting anything set by other NPCs since.

**Root cause, read from source:** every per-NPC `.ink` file in this scenario independently declares `VAR cover_burned = false`, `VAR cover_restored = false`, etc. (confirmed in `m02_npc_sarah_kim.ink`, `m02_npc_security_guard.ink`, `m02_npc_gary_whitlock.ink`, `m02_npc_receptionist.ink`, `m02_npc_ward_nurse.ink`, `m02_phone_agent0x99.ink`, `m02_closing_debrief.ink`). This is presumably needed for each file to compile standalone, but if the engine syncs an NPC's full local variable set back to the shared global state on conversation close, any variable that NPC's story didn't touch this session gets forced back to that file's own default.

**Consequence observed live:** Val Okonkwo's `cover_challenge` (the "prove your cover" confrontation, step 15 of the walkthrough) never triggered, because by the time I reached the Security Office, `cover_burned` read `false` again — Val's `start` knot routed straight to the friendly `first_encounter` instead. The mission was **not blocked** by this — `access_server_room` and `regain_freedom_of_movement` both completed via the documented backstop (entering the server room itself sets `cover_restored`) — but the entire "cover challenge" mid-game beat, one of the walkthrough's named design points ("Val's behaviour visibly changes... `cover_challenge` knot"), was silently skipped this run through no player action.

**Scope:** any scenario with multiple ink files sharing the same global variable name is at risk of this on every conversation close, not just Kim's. I am confident classifying this as a defect rather than misuse of the harness: I read `window.gameState.globalVariables` directly via `eval`, not UI text; the value change is timestamped precisely against a conversation-close action and nothing else; and the same six-variable batch fired twice in immediate succession (seq 752-757 and again 758-763), which looks like a sync routine running on every dialogue-close tick rather than a one-off race.

## Finding 2 (observed, likely harness-only, not scenario-blocking): the ending sequence has a real completion delay that a bridge poll can miss

After choosing "Confirmed. Send it all." at the press terminal and reading `mg.getState()` showing the full "TRANSMISSION COMPLETE" text, `window.__test.getState().globals.mission_complete` still read `false` for over 35 seconds of polling (`waitFor` timeouts at both 20s and 15s). Reopening the terminal in the meantime made its typewriter text visibly stall mid-word on a second pass. Only after closing the terminal a final time did the closing debrief NPC (`closing_debrief_trigger` / Agent HaX) open, at which point `mission_complete: true` and `exposed_hospital: true` were both confirmed.

I cannot rule out a genuine engine delay (a `sendTimedMessage` or completion tag on a multi-second delay) versus the reopen-while-completing interaction corrupting the in-flight typewriter state — the second attempt's frozen/repeating text is consistent with re-triggering the `do_upload` knot while the first pass's completion tags were still pending. Either way, **the ending completed correctly in the final persisted state** and this did not block the mission; it cost extra bridge round-trips to confirm. Flagging as observed rather than classifying — a human should decide whether the completion sequence's timing (or reopen-safety) merits a look.

## Finding 3 (observed, unresolved — do not treat as confirmed): "Offline Backup Encryption Keys" pickup did not fire its event live, but the item appears in the final persisted inventory

Live during the run, `mg.take("Offline Backup Encryption Keys")` from the emergency storage safe reported `{"ok":true,"took":"Offline Backup Encryption Keys","openedViewer":null,"returnsToContainer":false}`, and the item scene-removal event fired (`item_removed_from_scene`), but:
- `window.__test.getState().inventory` did **not** list the item afterward.
- `window.__test.getState().globals.offline_keys_recovered` read `false`.
- No `item_picked_up:offline_backup_encryption_keys` event appeared in the log (checked via `peekLog`), and this is the exact event both the item's own `onPickup` handler and Agent 0x99's `item_picked_up:offline_backup_encryption_keys` mapping depend on (`scenario.json.erb` lines ~961-965).

However, the **post-run `verify-run.rb`** (server-persisted state, read fresh after `sync` + `quit`) lists **"Offline Backup Encryption Keys" in the final inventory**. I did not re-check `offline_keys_recovered` server-side. This is contradictory: either the live client-side read was stale (matching the documented "delayed-globals read is not a bug" class from run 2's Finding 1), or the item genuinely reached inventory by a path that didn't fire its pickup event and consequently never set `offline_keys_recovered`. I could not resolve which before time ran out, and did not attempt the offline-keys recovery-console route as a result (I used the ransom-payment source instead, which is confirmed working end to end). **This is reported as an open observation, not a confirmed defect** — a human should check `offline_keys_recovered` server-side and, if false despite the item being held, decide whether the "Combined Recovery" and "Offline Backup Keys" recovery-console options are reachable at all in the standalone environment.

## Known remaining defect (per the task, not re-investigated in depth): dead hint-message handlers

Per the task's brief, seven `agent_0x99`/`ghost` hint-message handlers sharing `eventPattern`s with the four now-fixed handlers are still dead (guide offers on `talk_to_gary`, `access_server_room`, `submit_ssh_flag`, `submit_proftpd_flag`). I did not specifically probe these beyond what naturally happened during play; nothing suggested they blocked progress. Not spending further budget on this per instruction.

## Findings believed to be harness gaps, not scenario bugs (reproducing m01/run-2 classes)

- **`mismatch:true, reason:"wrong-target-opened"`** reproduced on at least four more objects this run whose displayed content title differs from the object's own `name`: `reception_terminal` → "Ransomware Impact Display", `dr_kim_office_safe_4` → "Enter PIN for item", `hospital_recovery_console` → "Backup Recovery Console", `entropy_staging_cache` → "Flag Submission Terminal", `emergency_storage_safe` → "Enter PIN for item". In every case the object's own `lockType`/content matched what the walkthrough describes, so — consistent with run 1's and run 2's classification — this looks like the mismatch check comparing rendered display title against entity label rather than entity id/lockType, and is a harness-side over-report rather than a wrong click.
- **Unlocked doors vanish from `room` scans on both approach and return crossings**, reproducing the class documented in run 2 and `m01-confirm-verification.md`. This run needed extensive manual `walk` stepping (dozens of small directional nudges) to cross doorways whose reverse direction was never recorded as a `known` doorway — considerably heavier than run 2's report describes, to the point of costing a large share of this run's command budget. `enter` against a room already in the `known` doorway list worked instantly and reliably (e.g. `office_hall_mid → office_hall_west → conference_room` near the end), so the gap is specifically the *reverse* doorway never being recorded, not `enter` itself.
- **`moveToNear` short-stopped on `it_filing_cabinet`** (a collider issue, same class as run 2's `dr_kim_office_safe_4` finding — though `dr_kim_office_safe_4` itself opened fine this run via `moveToNear` + `lock`). I did not force past it and left the IT Filing Cabinet unopened this run (optional content, step 12).
- **`password_sticky_note` never fired `item_picked_up:password_sticky_note`** on `interact()`, reproducing run 2's identical finding verbatim. Confirmed via `peekLog` showing zero matching events. Not investigated further since Fix verification did not require it; `obtain_password_hints` completed via Gary's rapport route regardless (the documented redundant-path guarantee held).

## Step results (grouped by aim, walkthrough numbering)

### Aim: Talk Your Way In

| # | Step | Result | Evidence |
| - | --- | --- | --- |
| 1 | Opening briefing / `briefing_played` | PASS — bootstrap cleared cutscene/tutorial, fresh game confirmed | bootstrap result, first command |
| 2 | Reception Visitor Log → `noticed_struck_booking` | PASS — no mismatch, global confirmed in `recentGlobals` | early commands |
| 3 (opt) | Crisis Protocol Notice | PASS — no mismatch | early commands |
| 4 | Bernie Nwosu, honest opening → `sign_in_at_reception` complete, `bernie_gave_key`, `bernie_trusts_player` | PASS — chose the honest `route_consultant` → "Dr. Kim requested emergency incident response..." line explicitly (not auto-picked); both globals confirmed | dialogue transcript, `brief` diffs |
| 5 | CTO Office, Dr. Sarah Kim | PASS — via the Fix-2 recovery route (deliberately reproduced the dead end first); boardroom PIN obtained from her diary and dialogue | see Fix 2 above |
| 6 | Patient Ward, enter → `assess_the_ward` complete | PASS — task auto-completed on room entry | brief diff |
| 7 (opt) | Sister Doyle conversation → `talk_to_ward_nurse`, `gather_pin_clues` | PASS — took the empathy route (`showed_empathy`); `gather_pin_clues` completed via the `timeline` knot; Doyle volunteered the safe PIN outright as the walkthrough documents | dialogue transcript |

**Aim completion:** 1, 4, 5, 6 done — PASS.

### Aim: Get Into IT

| # | Step | Result |
| - | --- | --- |
| 8 | IT door, override key → `open_it_department` complete | PASS — `lock` with `key:"IT Department"` unlocked in one call |
| 9 | Reception encrypted terminal → `decode_ransomware_note` | PASS (benign mismatch, see harness-gaps) — global confirmed |
| 10 | Gary Whitlock, rapport route → `talk_to_gary` complete, keycard given | PASS — drove the solidarity opening (+15) then the paper-trail follow-up (+12) to reach `gary_influence` 27 ≥ 25 → `keycard_trusted`; card + SSH credential (`Hospital1987`, spoken directly) received |
| 11 | Password Sticky Note (redundant path) | Not earned via reading the note (same defect as run 2) — but `obtain_password_hints` completed via the `discuss_passwords` knot on Gary's rapport route, which the walkthrough documents as a separate, valid route |
| 12 (opt) | IT Filing Cabinet | Not attempted — collider short-stop on `moveToNear` (see harness gaps); skipped as non-blocking optional content |
| 13 (opt) | Scapegoating thread | PASS — `gary_protected` set via Kim's hub `[Whatever happens tonight, Gary doesn't carry this alone...]` option |

**Aim completion:** 8, 9, 10, 11 done — PASS.

### Aim: Somebody Pulled Your Booking

| # | Step | Result |
| - | --- | --- |
| 14 | Automatic cover-burn on `talk_to_gary` | PASS at the moment of firing — `cover_burned_notified` task completed, `cover_burned` briefly `true` — **but see Finding 1: `cover_burned` was later reset to `false` by an unrelated conversation close, before I reached Val** |
| 15 | Val Okonkwo, cover challenge | **Not exercised as designed** — because of Finding 1, `cover_burned` read `false` by the time I spoke to Val, so her `start` knot routed to the friendly `first_encounter` instead of `cover_challenge`. This is a real design beat silently skipped, not a player choice. |
| 16 | `regain_freedom_of_movement` | PASS via the **backstop** — entering the server room set `cover_restored` and completed the task |
| 17 | Security Office → Server Room, RFID keycard | PASS — door auto-unlocked on `interact`, confirmed via room entry |

**Aim completion:** 14, 16, 17 done at a task level — PASS on tasks, but see Finding 1 for the design beat that was lost.

### Aim: Turn Their Backdoor Around

| # | Step | Result |
| - | --- | --- |
| 18 | VM Access Terminal → field-guide offer | PASS — `scanning_exploitation_guide_offered` confirmed; an automatic Val/HaX dialogue about server-room access rules also fired correctly on approach |
| 19-22 | Submit flags 1-4 → tasks + globals | **PASS — Fix 1 and Fix 3 both confirmed, see Fix verification above.** Chain fired completely on flag 4 after reading the Night Security Post Log first. |
| 23 | ENTROPY Staging Cache | PASS — unlocked with `<flag:4>` at its own lock; both items taken; `lore_ghosts_manifesto_found` and `insider_method_confirmed` confirmed |

**Aim completion:** 19-22 done — PASS. This aim gated the mission-conclusion aim and it worked correctly this run.

### Aim: Somebody Held The Door / Put A Name To The Badge (parallel aims)

| # | Step | Result |
| - | --- | --- |
| 24 | Insider evidence (boardroom proposal + Kim's fire-drill thread) | PASS — `insider_evidence_partial` confirmed via Kim's `fire_drill`-equivalent thread; also read the Ransomware Incorporated Proposal directly in the boardroom |
| 25 | Step 21 → `insider_db_window_found` | PASS — confirmed at flag-3 submission |
| 26 | Step 22 → `insider_badge_id_found` | PASS — confirmed at flag-4 submission, part of the fixed chain |
| 27 | Night Security Post Log → `inspected_asset_post`, `insider_identified` | PASS — read before submitting flag 4 specifically to test this link; `insider_identified` confirmed true after flag 4 |
| 28 | Graham Reeves confrontation | Not attempted — time budget spent on navigation/collider issues and the ending sequence; the debrief still referenced ENTROPY/Reeves material generically without me confronting him directly |

**Aim completion:** both aims' gating tasks (`unmask_gather_evidence`, `unmask_db_window`, `unmask_ghost_badge`, `unmask_identify`) all confirmed completed — PASS.

### Aim: Bring The Wards Back (mission conclusion)

| # | Step | Result |
| - | --- | --- |
| 29 | Boardroom PIN `0417` | PASS — door unlocked, entered conference room |
| 30 | Emergency Storage, enter | PASS — `locate_safe` completed automatically on room entry |
| 31 | PIN-Locked Safe `1987` | PASS — `crack_safe_pin` completed; item taken — **but see Finding 3 for the unresolved pickup-event question** |
| 32 | Hospital Recovery Console | PASS — chose Ransom Payment source; `backup_restore_initiated`, `paid_ransom` confirmed; Ghost's Act-3 call fired correctly and I declined the free-keys deal, confirming `ransom_decision_made: true` afterward |
| 33 | Hospital Communications Terminal → transmit | **PASS — the mission's final gate.** Both `backdoor_fully_exploited` and `ransom_decision_made` were true; the terminal offered the transmit menu (not the locked message run 2 hit); transmission completed; `exposed_hospital: true`, `mission_complete: true` confirmed both live and in the post-run server verification. |
| 34 | Closing debrief | PASS — drove the full debrief conversation (fatality reconciliation: "2 fatalities" confirmed matching ransom-route expectation, Gary's vindication, ENTROPY/Reeves material, "what's next"); reached the bond-visualiser/credits screen at the end |

**Aim completion:** all steps done — **PASS. The mission reached its ending.**

## Answers to the three questions

1. **Does the plumbing work on the intended route?** Yes, with one caveat found this run: ending an NPC conversation can silently reset unrelated shared globals to that NPC's own Ink-file defaults (Finding 1), which cost the game one of its designed mid-mission beats (Val's cover challenge) without the player doing anything wrong. Everything the task specifically asked me to verify — Fix 1, Fix 2, Fix 3 — worked correctly and the mission reached its ending.
2. **What breaks when the player goes off-script?** Deliberately reproducing the Dr. Kim dead end and recovering from it worked exactly as designed (Fix 2). Off-script exploration was otherwise limited this run by time spent on navigation (see harness gaps) and by the priority on reaching the ending.
3. **Can the mission be finished without doing the VM work?** No — flags must be submitted (session-supplied here, standing in for real VM work) and the `requiresCompleted` server-side guard on `submit_proftpd_flag`/`submit_ghost_log_flag` etc. was never bypassed. The mission's completability was proven via the ransom-payment recovery route; the offline-keys / combined-recovery alternate route was not proven this run (Finding 3).

## Files referenced

- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/scenarios/m02_ransomed_trust/scenario.json.erb` (Agent 0x99's `eventMapping` array — the fixed chain on `submit_database_flag`/`submit_ghost_log_flag`; also lines ~961-965 for the offline-keys pickup handler)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/scenarios/m02_ransomed_trust/ink/m02_object_press_terminal.ink` (the `backdoor_fully_exploited` / `ransom_decision_made` double gate, now passed; the `do_upload` completion tags)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/scenarios/m02_ransomed_trust/ink/m02_npc_sarah_kim.ink` (the fixed `discuss_gary` dead-end and its hub recovery option; also declares the local `cover_burned`/`cover_restored`/etc. defaults implicated in Finding 1)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/scenarios/m02_ransomed_trust/ink/m02_npc_security_guard.ink` (Val's `cover_challenge` routing, silently skipped this run per Finding 1)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/scenarios/m02_ransomed_trust/ink/m02_npc_gary_whitlock.ink` (rapport-route influence values, `discuss_passwords` knot with the spoken SSH credential)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tools/playtest/m02-run3-session.jsonl` (session log, 1955 lines)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tools/playtest/m02_ransomed_trust-flags-game993.xml` (flag hints used)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tools/playtest/m02-run2-report.md` (prior run, read in full before this run)
