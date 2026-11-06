# m02_ransomed_trust — playtest report (run 2)

**Walkthrough source:** `scenarios/m02_ransomed_trust/TESTING_WALKTHROUGH.md`, parsed once at the start of the run.

**Which question this run answers:** primarily (1) does the plumbing work on the intended route, with a specific mandate to re-verify the two run-1 fixes. It also answers (3) definitively: the mission **still cannot be finished**, standalone or with real VMs, because of a *different* engine defect than the one fixed since run 1.

**Game id:** 991 (mission 46)
**Session log:** `tools/playtest/m02-run2-session.jsonl` (921 lines: 1 session-open event + 919 commands + 1 session-closed event)
**Flags XML:** `tools/playtest/m02_ransomed_trust-flags-game991.xml` (`PREFLIGHT OK`, `VALID_FLAGS=4`)
**Flag policy:** `session` — flags submitted as `<flag:1..4>`, substituted from the XML above.

**Environment deviation (report this loudly):** the task specified headed Chromium unless `$DISPLAY` is empty. `$DISPLAY=:0` was set, but a headed Playwright launch hung indefinitely (45s+ with no `session-open` event, confirmed via an isolated manual test — the page itself loaded fine, console output flowed, but `page.waitForTimeout`/`page.evaluate` never returned). An isolated headless launch against the same URL returned `hasTest: true` immediately. I switched to `--headless` to make progress. This is a harness/sandbox environment issue, not a scenario finding.

## verify-run.rb output (verbatim)

```
game            991  (mission 46)
created         2026-09-08 00:08:03 UTC
last write      2026-09-08 01:01:40 UTC
played for      3216s of wall clock
current room    "reception_lobby"
unlocked rooms  14: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, office_hall_mid, dr_kim_office, office_hall_east, it_department, security_office, server_room, office_hall_west, conference_room
unlocked objs   2: it_filing_cabinet, entropy_staging_cache
inventory       12: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Gary's Password Sticky Note, Gary's Email Archive -- Warning 7 of 7, Dr. Kim's Reply -- 21 May, CryptoSecure Recovery Services Document, Server Room Keycard, Ghost's Operational Manifesto, Affiliate Handling Note
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, dr_sarah_kim, gary_whitlock, security_guard_patrol, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_fb1fac}, flag{m02_ransomed_trust_hospital_backup_server_2_9e0381}, flag{m02_ransomed_trust_hospital_backup_server_3_4f0b29}, flag{m02_ransomed_trust_hospital_backup_server_4_fad7ab}
globals set     30: backup_recovery_source, backup_reinfected, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, briefing_played, cover_restored, decoded_ransomware_note, dr_kim_met, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, gary_evidence_recovered, gary_trusts_player, gave_keycard, insider_method_confirmed, lockpicking_guide_offered, lore_cryptosecure_found, lore_ghosts_manifesto_found, noticed_struck_booking, paid_ransom, patient_bed2_state, patient_bed4_state, player_name, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, scanning_exploitation_guide_offered, ward_recovering

VERDICT: progress recorded — 13 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

**Objects unlocked this run: 2** (`it_filing_cabinet`, `entropy_staging_cache`) — both real containers, both opened for the first time in any m02 playtest. Run 1 recorded 0 objects unlocked across 1645 commands. This run found and opened two containers on/near the critical path, so the "no container ever tested" gap from run 1 is closed. A third container (`dr_kim_office_safe_4`, Dr. Kim's Safe) exists but could not be reached — see harness gaps below.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at (seq) | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu, reception — `converse` reward for the honest opening line | seq 2-46 (bootstrap seq 2-3, Bernie `converse` result seq ~44-46) | yes |
| Boardroom PIN | `0417` | Dr. Sarah Kim, CTO office — asked "What's the code for the boardroom?" at her hub | seq ~330-345 (during the fix-2 recovery conversation) | yes |
| Safe PIN `1987` | `1987` | Hospital Founding Plaque, reception | seq ~14-16 | yes |
| Server Room Keycard | (item) | Gary Whitlock, IT department — rapport route (`gary_influence` 27 ≥ 25 → `keycard_trusted`), confirmed at seq 862 (`"gary_influence":27`) | seq ~430-460 | yes |
| SSH credential | `Hospital1987` | Gary's Password Sticky Note, IT department (read directly; Gary also states it verbally on the rapport route) | seq ~400-410 (note read before talking to Gary) | yes |
| `hospital_backup_server:flag_1..4` | `<flag:1>`…`<flag:4>` | SAFETYNET Drop-Site Terminal, server room, after the SSH-credential prerequisite (sticky note) was obtained | prerequisite at seq ~400-410; flags submitted/confirmed at seq 675-676 (flag 1, `submit_ssh_flag_done:true`) and seq 862 (all four `flag_*_submitted:true` in one globals dump) | **no — flags submitted and accepted, tasks completed, but the mission cannot be finished regardless (Finding 2 below)** |

Seq numbers are the literal `"seq"` field in `tools/playtest/m02-run2-session.jsonl` (921 lines, 1 seq per line, `dir:"in"`/`dir:"out"` pairs share adjacent seqs). Precisely verified seqs are given as single values or tight ranges; wider ranges reflect steps spanning several `mg`/`waitFor` round-trips through the same dialogue and are approximate line positions, not read off the log field-by-field for every one.

The flag row is again the boundary of what standalone proves: the SSH-credential prerequisite was earned in-game (the sticky note, read before talking to Gary), and all four flags were accepted server-side and completed their `submit_*_flag` tasks — this is new evidence, not present in run 1, and it directly answers the task's first verification item. But the mission's ending is unreachable regardless of flag correctness, for a reason unrelated to flag identifiers (Finding 2).

## Fix verification (the two items this run was specifically sent to check)

### Fix 1 — flag-identifier normalisation: **CONFIRMED WORKING**

For all four flags, after submission I queried live game state directly (not just the station UI) via `window.__test.getState().globals` and `.objectives.completedTasks`:

- Flag 1: `flag_ssh_submitted: true`, `submit_ssh_flag` in `completedTasks: true`
- Flag 2: `flag_proftpd_submitted: true`, `submit_proftpd_flag` in `completedTasks: true`
- Flag 3: `flag_database_submitted: true`, `submit_database_flag` in `completedTasks: true`
- Flag 4: `flag_ghost_log_submitted: true`, `submit_ghost_log_flag` in `completedTasks: true`

All four `flag_*_submitted` globals (set by the client-side `objective_task_completed:submit_*_flag` listeners — the part run 1 could not prove) and all four tasks completed correctly. This is the part of Fix 1 that run 1 never verified, and it works. **No console workaround was used or needed for this.**

### Fix 2 — Dr. Kim `discuss_gary` dead-end: **CONFIRMED WORKING, no console workaround needed**

Deliberately reproduced the dead end first: at `explain_attack`, chose "Understood. Where's Gary now?" → `discuss_gary` → `hub`. Confirmed the soft-lock state before recovering:

```json
{"ok":true,"cmd":"eval","result":{"dr_kim_met":false}}
```

and `meet_dr_kim` was still present in `openTasks`.

Then, at the hub, the new recovery option was present exactly as the fix describes: `"1. Before anything else -- I need to get into your IT department. What can you actually authorise?"` (gated `{not access_explained}`). Choosing it routed to `access_problem`, which fired immediately:

```json
{"...":"...","openTasks":["open_it_department","talk_to_gary",...],"inventory":[...,"Visitor Badge (Countersigned)"],"recentGlobals":[...,"dr_kim_met",...]}
```

`meet_dr_kim` completed, `dr_kim_met` set true, the countersigned badge received, and the `access_it_systems` aim unlocked. **I did not use `clearNPCState` or any other console command at any point in this run** — the run 1 workaround was not needed.

## Finding 1 (minor, confirmed): a delayed-globals read is not a bug

Early in the run, `bernie_trusts_player` read `false` immediately after Bernie's conversation closed, which looked like a repeat of the run-1-reported dialogue-continue issue. A later `brief` (a few commands on) showed it in `recentGlobals`, and a direct `eval` confirmed `true`. This is a client-side flush/read timing gap, not a broken conditional — flagged and retracted in the same run rather than reported as a false positive.

## Finding 2 (scenario/engine defect, high confidence, mission-blocking): `onceOnly` event-mapping collision drops every non-first handler on a shared `(npcId, eventPattern)` pair

**All four flags submit correctly and complete their primary tasks (Fix 1, above), but the mission still cannot be finished, for a different reason: `backdoor_fully_exploited` never gets set, and the press terminal — the mission's final action — checks exactly that global and refuses to unlock.**

Root cause, read directly from source and confirmed against live game state (not inferred):

- `app/../public/break_escape/js/systems/npc-manager.js:407-465` (`_setupEventMappings`) registers one `eventDispatcher.on(eventPattern, listener)` call **per mapping entry**, so multiple entries that share the same `eventPattern` for the same NPC each get their own listener — this part is fine.
- But `_handleEventMapping` (line 468, specifically line 478) computes its once-only dedup key as `` `${npcId}:${eventPattern}` `` — a key that does **not** include anything identifying *which* mapping entry fired. `this.triggeredEvents` is keyed on that string alone.
- `scenarios/m02_ransomed_trust/scenario.json.erb` (Agent 0x99's `eventMapping` array, lines ~880-943) lists **multiple separate `onceOnly: true` handlers sharing the identical `eventPattern`**, e.g. four handlers on `"objective_task_completed:submit_ssh_flag"` (lines 862-891) and two on `"objective_task_completed:submit_ghost_log_flag"` (lines 892-901 and 929-935).
- Because the dedup key can't distinguish these, the **first-registered** handler on a given `(npcId, eventPattern)` pair sets `triggeredEvents` to count 1, and every other handler sharing that same pattern is silently skipped forever (`⏭️ Skipping once-only event ... (already triggered)` — never reaches the branch that would set its own `setGlobal`/`completeTask`).

**Directly observed consequence, confirmed via `window.__test.getState().globals` after all four flags were submitted and the recovery console step completed (session log seq 862, `dir:"out"`):**

```json
{"flag_ssh_submitted":true,"flag_proftpd_submitted":true,"flag_database_submitted":true,"flag_ghost_log_submitted":true,
 "backdoor_fully_exploited":false,
 "insider_db_window_found":false,
 "insider_badge_id_found":false,
 "vulnerability_guide_offered":false,"exploitation_guide_offered":false,"privesc_guide_offered":false,
 "ransom_decision_made":true}
```

Every `flag_*_submitted` global (the *first*-listed handler on its eventPattern) is `true`. Every *second-or-later*-listed handler sharing that same eventPattern (`backdoor_fully_exploited`, `insider_db_window_found`, `insider_badge_id_found`, the three unread field-guide offers) is `false`, even though the walkthrough documents all of them as firing on those exact same flag-submission events (`TESTING_WALKTHROUGH.md` steps 19-22).

**This is what blocks the ending.** `scenarios/m02_ransomed_trust/ink/m02_object_press_terminal.ink:34-42`:

```ink
=== start ===
{not backdoor_fully_exploited:
    -> relay_locked_investigation
}
{not ransom_decision_made:
    -> relay_locked_incident
}
```

`ransom_decision_made` was true (the recovery console step completed correctly). `backdoor_fully_exploited` was false, so the terminal routed straight to `relay_locked_investigation` and refused to transmit. Confirmed live in this run: opening the Hospital Communications Terminal after all four flags and the recovery decision showed exactly this locked message (`"Finish working the backup server. Recove..."`, the truncated preview of `relay_locked_investigation`'s text), not the transmission menu. `decide_hospital_exposure` and `mission_complete` are therefore unreachable — **the mission cannot be completed**, independent of and in addition to whatever the run-1 flag-identifier bug used to cause.

I am confident classifying this as a defect rather than harness misuse, having ruled out the three alternatives the skill requires: (a) target/range — the flag station and press terminal were both interacted with correctly and reported `confirmed:true`; (b) false success without confirmation — I read `window.__test.getState().globals` directly via `eval`, not just UI text; (c) wrong UI driving — the flag-station `SUBMIT` button was clicked for real (`submittedVia:"button:..."`) for all four flags, and the terminal's own displayed message names the exact locked state the ink defines.

**Scope beyond m02:** any scenario (or m02 itself, elsewhere) with two or more `onceOnly` event mappings sharing one `eventPattern` for the same NPC will silently drop every handler after the first. This is a general engine defect in `npc-manager.js`, not scenario-specific, though the specific manifestation that blocks m02's ending is scenario data (the ink's dependency on a global that a shared-pattern handler never reaches).

## Findings believed to be harness gaps, not scenario bugs

- **Unlocked doors vanish from `room` scans on both approach and return crossings**, matching the documented behaviour, but this run needed 2-4 retries per crossing (12+ door crossings total) and, on return trips through the *same* door a second time, the reverse doorway was never in the `known` doorway list at all (`enter` returned `no-known-doorway`) because the door object never reappeared in that room's `room` scan in either direction. Walking with raw `walk` commands toward the remembered world coordinate of the original doorway always worked eventually. This matches the `m01-confirm-verification.md` "unlocked door vanishes" class of finding but is a heavier version of it — full round-trip navigation through vanished doors, not just one-way.
- **`moveToNear` on `dr_kim_office_safe_4` (Dr. Kim's Safe) consistently stopped 111px away** (`arrived-but-outside-plain-range`), reproducing twice with identical coordinates. A raw `moveTo` toward the safe's own coordinates also stopped short by a similar margin. This matches the open m01 finding of a collider short-stopping `moveToNear` on certain objects (up to 59.7px there; 111px here is larger but the same failure shape). I did not reach this safe and could not test its container in this run — a real finding either way, but I'm not confident classifying which.
- **`interact()` reports `mismatch:true, reason:"wrong-target-opened"` on at least three objects whose own designed content has a different display title than the object's `name`** — `infected_terminal` → "Ransomware Impact Display", `hospital_recovery_console` → "Backup Recovery Console", `entropy_staging_cache` → "Flag Submission Terminal". In each case the object's own `lockType`/`type` matched what opened (`ransomware_display`, `backup_recovery`, `safe`+`flag` respectively), and the content was exactly what the walkthrough describes for that object. This is the same false-positive class run 1 flagged for the infected terminal; it now reproduces on two more object types, suggesting the mismatch check compares a rendered display title against the entity's label rather than against the entity id/lockType, and is a harness-side over-report, not evidence of a wrong click.
- **A `password_sticky_note` (readable, takeable) never fires `item_picked_up:password_sticky_note`** when opened via `interact()` — confirmed by inspecting `window.__test.peekLog(500)` for that event name and finding zero matches, and by the item never appearing in `inventory`. `scenario.json.erb:825-827` gates the walkthrough's documented "redundant path" completion of `obtain_password_hints` on exactly that event. Whether this is an engine gap (readable+takeable notes objects don't fire pickup events on read) or a scenario data issue (the object should use a different event pattern for a note that's meant to be read, not carried) I can't determine from this run — flagged as observed, not classified.

## Step results (grouped by aim, walkthrough numbering)

### Aim: Talk Your Way In

| # | Step | Result | Evidence |
| - | --- | --- | --- |
| 1 | Opening briefing / `briefing_played` | PASS — bootstrap cleared cutscene/tutorial, fresh game confirmed (no "OTHER SESSIONS" overlay, tasks open) | bootstrap result, first command |
| 2 | Reception Visitor Log → `noticed_struck_booking` | PASS — no mismatch, `noticed_struck_booking` confirmed in `recentGlobals` | early commands |
| 3 (opt) | Crisis Protocol Notice | PASS — no mismatch | early commands |
| 4 | Bernie Nwosu, honest opening → `sign_in_at_reception` complete, `bernie_gave_key`, `bernie_trusts_player` | PASS — `converse` chose the honest line each turn (auto-selected first branch); `sign_in_at_reception` left `openTasks`; `bernie_trusts_player` confirmed true (after a brief globals-flush delay, see Finding 1) | converse result + later `eval` |
| 5 | CTO Office, Dr. Sarah Kim → `meet_dr_kim` complete, badge, boardroom code | PASS — via the fix-2 recovery route (see Fix 2 above); boardroom PIN `0417` obtained directly from her hub | dialogue transcript |
| 6 | Patient Ward, enter → `assess_the_ward` complete | PASS — task auto-completed on room entry, confirmed via `brief` before/after | brief diff |
| 7 (opt) | Sister Doyle conversation → `talk_to_ward_nurse` | PASS — `converse` ran 35 turns, `talk_to_ward_nurse` left `openTasks`; did not explicitly confirm `gather_pin_clues` completion text (plaque already gave 1987) | converse transcript |

**Aim completion:** 1, 4, 5, 6 done — PASS.

### Aim: Get Into IT

| # | Step | Result |
| - | --- | --- |
| 8 | IT door, override key → `open_it_department` complete | PASS — `lock` with `key:"IT Department"` unlocked in one call |
| 9 | Ransomware terminal → `decode_ransomware_note` | PASS (with the benign mismatch noted above) — `decoded_ransomware_note` confirmed in `recentGlobals` after close |
| 10 | Gary Whitlock, rapport route → `talk_to_gary` complete, keycard given | PASS — drove the highest-influence choices deliberately (`gary_influence` reached 27, ≥25 threshold), got `keycard_trusted`: Server Room Keycard + credentials |
| 11 | Password Sticky Note → `obtain_password_hints` (redundant path) | **Did not complete via reading the note alone** — see Finding above. Completed instead via Gary's rapport route, which the walkthrough documents as a separate, non-redundant path — so `obtain_password_hints` did eventually complete, just not by the route step 11 names |
| 12 (opt) | IT Filing Cabinet | PASS (assisted) — no correct key held (`Wrong key!` with the only key offered), used `completeLockpick()` in pick mode; container opened, all 3 items taken (Gary's Email Archive Warning 7/7, Dr. Kim's Reply, CryptoSecure Recovery doc) |
| 13 (opt) | Scapegoating thread | Not directly attempted this run (time budget after the container detour) |

**Aim completion:** 8, 9, 10 done, 11 completed via an alternate route — PASS overall, with the sticky-note redundant path itself unproven (see finding).

### Aim: Somebody Pulled Your Booking

| # | Step | Result |
| - | --- | --- |
| 14 | Automatic cover-burn on `talk_to_gary` | PASS — `cover_burned` appeared in `recentGlobals` at that point (later state showed it false again, consistent with `regain_freedom_of_movement`'s handler resetting it once resolved — not investigated further) |
| 15 | Val Okonkwo, cover challenge | PASS — engaged `cover_challenge`, chose the incident-response line, reached her hub |
| 16 | `regain_freedom_of_movement` via a lanyard or backstop | PASS via the **backstop** — entering the server room set `cover_restored` and completed the task without ever obtaining a lanyard |
| 17 | Security Office → Server Room, RFID keycard | PASS — door auto-unlocked on `interact` (`events: ["door_unlock_attempt","door_unlock_attempt","door_unlocked","door_opened","door_opened","door_unlocked"]`), confirmed via room entry |

**Aim completion:** 14, 16, 17 done — PASS.

### Aim: Turn Their Backdoor Around

| # | Step | Result |
| - | --- | --- |
| 18 | VM Access Terminal → field-guide offer | PASS — `scanning_exploitation_guide_offered` confirmed; terminal correctly showed VirtualBox/SSH instructions (no VM in standalone, expected) |
| 19-22 | Submit flags 1-4 → `submit_*_flag` tasks, `flag_*_submitted` globals | **PASS — Fix 1 confirmed for all four flags** (see Fix verification section). Ghost's ProFTPD call fired correctly mid-sequence and was handled without derailing the flag-station flow. |
| 23 | ENTROPY Staging Cache | PASS — unlocked with `<flag:4>` re-submitted at its own flag-lock; container opened, both items taken (Ghost's Operational Manifesto, Affiliate Handling Note) |

**Aim completion (per walkthrough, requires 19-22):** tasks 19-22 all completed correctly — **but see Finding 2**: the aim's task-level completion does not mean the mission can proceed, because `backdoor_fully_exploited` (a *separate* global gating the ending, not the aim) never gets set due to the onceOnly collision.

### Aim: Bring The Wards Back (mission conclusion) — reached but blocked

| # | Step | Result |
| - | --- | --- |
| 29 | Boardroom PIN `0417` | PASS — door unlocked, entered conference room |
| 32 | Hospital Recovery Console → recovery source | PASS — chose Ransom Payment source, confirmed restore; Ghost's Act-3 video call fired correctly; declined Ghost's free-keys deal (`ransom_decision_made` confirmed true afterward) |
| 33 | Hospital Communications Terminal → transmit | **BLOCKED — Finding 2.** Terminal showed the `relay_locked_investigation` locked message despite all four flags submitted and the recovery decision made, because `backdoor_fully_exploited` was never set |
| 34 | Closing debrief | Not reached — gated behind step 33 |

### Aims not reached / not completed

"Somebody Held The Door" and "Put A Name To The Badge" were not reached to completion: `insider_db_window_found` and `insider_badge_id_found` — both required for those aims' tasks (`unmask_db_window`, `unmask_ghost_badge`) — never get set, for the identical onceOnly-collision reason as `backdoor_fully_exploited` (they are second-listed handlers on the `submit_database_flag` and `submit_ghost_log_flag` event patterns respectively).

## Answers to the three questions

1. **Does the plumbing work on the intended route?** Mostly yes — dialogue, doors, locks, both containers found this run, the flag station UI, and (critically) the flag-to-task completion wiring that run 1 found broken (Fix 1) all work correctly now. It breaks at a different point: task-level flag completion succeeds, but a second layer of global-only side effects on the same events (`backdoor_fully_exploited` and friends) silently never fires, and one of those globals gates the literal last action of the mission.
2. **What breaks when the player goes off-script?** The Dr. Kim dead-end (Fix 2) is confirmed fixed — deliberately taking the "bad" branch first and recovering via the hub worked exactly as designed, no console needed. No new off-script dead ends were found this run, though the side-quest coverage (steps 12-13, 24-28) was lighter than run 1's due to time spent on navigation/collider issues.
3. **Can the mission be finished without doing the VM work?** No — and, as in run 1, it also cannot currently be finished *with* real VM work, because Finding 2 is a defect in event-mapping deduplication that is completely independent of where the flag values come from.

## Files referenced

- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/public/break_escape/js/systems/npc-manager.js` (lines 407-465 `_setupEventMappings`; line 478 the `` `${npcId}:${eventPattern}` `` dedup key; lines 481-485 the once-only skip)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/scenarios/m02_ransomed_trust/scenario.json.erb` (Agent 0x99's `eventMapping` array, ~lines 862-943: repeated `eventPattern` values across multiple `onceOnly` handlers)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/scenarios/m02_ransomed_trust/ink/m02_object_press_terminal.ink` (lines 22-42: the `backdoor_fully_exploited` / `ransom_decision_made` double gate)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/scenarios/m02_ransomed_trust/ink/m02_npc_sarah_kim.ink` (lines 83-233: the fixed `discuss_gary` dead-end and its hub recovery option, both re-verified live)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/app/models/break_escape/game.rb` (`same_flag_identifier?`/`process_flag_task_completions!` — the run-1 fix, re-verified indirectly via the four flags all completing their tasks)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tools/playtest/m02-run2-session.jsonl` (session log, 921 lines)
- `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tools/playtest/m02_ransomed_trust-flags-game991.xml` (flag hints used)
