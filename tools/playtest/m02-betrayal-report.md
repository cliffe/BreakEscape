# m02_ransomed_trust — the BETRAYAL branch (advised refuse, then paid anyway)

**Question this run answers:** plumbing — does the specific, never-played consequence branch
(advise Dr Kim to refuse the ransom, then pay it anyway at the recovery console) actually fire,
and does Kim's scripted reaction to that betrayal arrive.

## Two runs, one honest account

This task took two games. The first (**game 1024**, the one specified in the brief) was lost to
a tester error, not a game bug: an unconstrained `converse` call on Dr Kim exhausted her dialogue
hub automatically and picked "Pay" before "Don't pay" could be selected. Kim's `ransom_decision_input`
knot is a one-shot — it sets `advised_on_vote=true` on entry, which permanently hides the only two
paths back into it (the hub's "ask me again" option requires `!advised_on_vote`). That locked
game 1024 into `advised_board_pay=true, advised_board_refuse=false`, which is the opposite of the
branch under test and cannot be undone in-session.

Confirmed before abandoning it:
```
advised_board_refuse = false
advised_board_pay = true
paid_ransom = false
```
Log: `tools/playtest/m02-betrayal-session.jsonl` (lines 1–149, session closed cleanly at line 149).

Rather than report a dead end, I created a fresh game via the checked-in helper
(`BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m02_ransomed_trust` →
**game 1026**, preflight OK, 4 valid flags) and replayed the mission driving Kim's conversation
manually, choice by choice, so "Don't pay" could be selected deliberately. Everything below is
game 1026 unless stated otherwise.

## Session log and game id

- Log: `tools/playtest/m02-betrayal-session-1026.jsonl` (566 lines, session-open line 1, session-closed line 566)
- Game: **1026**, `http://127.0.0.1:3000/break_escape/games/1026`
- Flags: `tools/playtest/m02_ransomed_trust-flags-game1026.xml`

## verify-run.rb output (full)

```
game            1026  (mission 46)
created         2026-09-10 18:17:45 UTC
last write      2026-09-10 18:43:40 UTC
played for      1555s of wall clock
current room    "reception_lobby"
unlocked rooms  14: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, office_hall_mid, dr_kim_office, office_hall_east, it_department, security_office, server_room, office_hall_west, conference_room
unlocked objs   1: entropy_staging_cache
inventory       7: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Server Room Keycard, Spare Contractor Lanyard
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, dr_sarah_kim, gary_whitlock, security_guard_patrol, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_d6e49b}, flag{m02_ransomed_trust_hospital_backup_server_2_c7ca53}, flag{m02_ransomed_trust_hospital_backup_server_3_76a7c0}, flag{m02_ransomed_trust_hospital_backup_server_4_bc8f62}
globals set     38: advised_board_refuse, backdoor_fully_exploited, backup_recovery_source, backup_reinfected, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, cover_restored, decoded_ransomware_note, dr_kim_met, exploitation_guide_offered, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, gary_trusts_player, gave_keycard, insider_badge_id_found, insider_confronted, insider_db_window_found, kim_guilt_revealed, mission_complete, paid_ransom, patient_bed2_state, patient_bed4_state, player_name, privesc_guide_offered, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, scanning_guide_offered, ssh_guide_offered, staff_lanyard_obtained, vulnerability_guide_offered, ward_recovering

VERDICT: progress recorded — 13 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

## Server-record state dump (full)

```
status=completed concluded=Thu, 10 Sep 2026 18:43:30.107393000 UTC +00:00
counter=20 persisted=20 entries=20
MISSING entirely: ["talk_to_ward_nurse", "learn_about_scapegoating", "investigate_gary_office", "unmask_gather_evidence", "unmask_identify", "locate_safe", "gather_pin_clues", "crack_safe_pin"]
  advised_board_refuse = true
  advised_board_pay = false
  paid_ransom = true
  ransom_decision_made = true
  backup_recovery_source = "ransom_payment"
  ward_recovering = true
  mission_complete = true
inventory: ["Your Phone", "Lock Pick Kit", "Notepad", "IT Department Override Key", "Visitor Badge (Countersigned)", "Server Room Keycard", "Spare Contractor Lanyard"]
```

**`advised_board_refuse` AND `paid_ransom` are both `true`.** The branch was played, not just
reached — and `counter=20` matches `persisted=20` exactly, so no task write was lost. The 8
"missing entirely" tasks are all optional side content this run skipped on purpose (ward nurse
chat, Gary's filing cabinet, the insider-identification side aim, the physical-safe recovery
route) — none of them are on `requiresCompleted`, and the mission still reached `status=completed`
with `mission_concluded_at` set.

## Error count

```
tail -n +1323271 test/dummy/log/development.log | grep -E "BusyException|Completed 500" | wc -l
→ 0
```

## Did the branch fire, and did Kim's consequence message arrive

Both, confirmed against the running game, not inferred:

1. **Kim's refuse choice** — session log line 156–157: chose `"Don't pay. Give me the time and
   I'll bring you the keys myself."`, response `{"matchedPattern":"/^Don't pay/i", "number":2}`.
   `recentGlobals` on the following `brief` (line ~158) includes `advised_board_refuse`.
2. **Paid anyway** — session log line 395: `{"clicked":"CONFIRM RESTORE FROM RANSOM PAYMENT
   (GHOST'S DECRYPTION)"}` at the Hospital Recovery Console, after all four VM flags were
   submitted at the SAFETYNET Drop-Site Terminal.
3. **Kim's consequence message** — this is a client-side `bark`/timed-message (delivered via
   `NPCManager._deliverTimedMessage`, not a persisted global), so it doesn't show up in the
   server record. I confirmed it fired live by reading `window.npcManager`'s in-memory
   conversation history through the test bridge's `waitUntil` + `note()` mechanism (session log
   line 495, `"kind":"note"`). The last three entries in Agent HaX's channel at that point:
   ```
   "Decision logged. Whatever the board chooses, you've done your part."
   "Word from Dr Kim. She held the board off because you told her you'd have the keys in
    time -- and in the end someone wrote the cheque anyway. She spent trust she didn't have
    to spare, on your word. That's a debt, not a betrayal. Just know it's there."
   "Recovery decision logged. One more thing before this is over -- the conference room has
    a hospital communications terminal. The evidence you found tonight. What you do with it
    is your call."
   ```
   This is the exact `advised_board_refuse && paid_ransom && !dr_kim_ko` text from
   `scenario.json.erb` line 745 (delay 9000ms after `objective_task_completed:make_ransom_decision`).
   **Confirmed: it arrived, word for word, and it is the betrayal-specific line — not the
   pay/pay or refuse/refuse variant.**

## Ending reached

Drove on to the boardroom (PIN `0417`, given by Kim in the same conversation), the press
terminal, and chose "I'm transmitting everything" → "Confirmed. Send it all." `brief()` then
reported `missionEnd.creditsShowing: true` (session log line 561) and the server record confirms
`status=completed`, `mission_concluded_at` set, `mission_complete=true`, `exposed_hospital=true`.
Graham Reeves was never identified in this run (the insider side-aim was skipped to keep the run
focused on the target branch), so his ambush at the press terminal fired as designed
(`insider_confronted` is set from that encounter, not from a prior accusation) — this is the
`press_terminal_ambush` path, a legitimate alternate ending, not a bug.

## Item handoffs — did everything an NPC gave land in inventory

Checked against the final inventory and the moment-by-moment `brief()` calls after each handoff:

| Item | Given by | Landed in inventory? |
| --- | --- | --- |
| IT Department Override Key | Bernie Nwosu | Yes |
| Visitor Badge (Countersigned) | Dr Sarah Kim | Yes |
| Server Room Keycard | Gary Whitlock | Yes |
| Spare Contractor Lanyard | Gary Whitlock | Yes |

No item was lost. The `giveItem` fix mentioned in the brief was not observed to regress — every
handover this run exercised landed correctly, including the two-item Gary handoff.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu — dialogue reward for the truthful opening line | before use | yes |
| Boardroom PIN | `0417` | Dr Sarah Kim, boardroom-code hub option, during the same conversation as the refuse choice | before use (asked her directly, in-game) | yes |
| Server Room Keycard | (item) | Gary Whitlock — rapport route reward | before use | yes |
| `hospital_backup_server` flags 1–4 | `<flag:1..4>` | SAFETYNET Drop-Site Terminal, server room — VM work not possible in standalone | — | **no — flags supplied via session `--flags`, not earned through VM exploitation** |
| Safe PIN / offline keys | not obtained | never opened Dr Kim's safe or the emergency-storage safe this run | — | **no — route not exercised** |

This run deliberately used the `session` flag policy (per the skill's guidance — standalone has
no VMs, so flags cannot be earned any other way). Everything downstream of the flag submissions —
Ghost's calls, `backdoor_fully_exploited`, the recovery console, the boardroom, the press terminal
— is exercised and its wiring confirmed working, but the VM exploitation itself is unproven by
this run. The safe/offline-keys route (steps 30–31 of the walkthrough) was not touched at all;
solvability of that branch is untested here.

## Bugs / findings

- **None found in the game.** The one anomaly (`interact()` reporting `mismatch:true,
  reason:"wrong-target-opened"` when clicking the Infected Terminal and the Hospital Recovery
  Console) was a false positive of the bridge's title-matching, not a wrong click: in both cases
  the `entity.id` returned matched exactly what was targeted, and the correct minigame opened
  (`ransomware-display` for `infected_terminal`, `backup-recovery` for `hospital_recovery_console`)
  — the mismatch check compares against the display *title*, which differs from the object's
  in-scene *name* for these two object types. Not reported as a game defect; noted here so a
  future run doesn't waste time on it.
- **Tester-caused finding, not a game defect:** an automatic, unconstrained `converse` call is
  unsafe against any one-shot Ink knot (here, Kim's `ransom_decision_input`, guarded by
  `advised_on_vote`). It silently commits the run to whichever branch the auto-exhaustion reaches
  first. Worth flagging for future playtests of this and any similarly-gated conversation: drive
  one-shot decision points choice-by-choice, never via unconstrained `converse`.

## Summary

The refuse-then-pay betrayal branch fires correctly: `advised_board_refuse=true` and
`paid_ransom=true` both persisted, task counter matches persisted count (20/20), zero server
errors, mission reached `status=completed`. Kim's specific betrayal-consequence line arrived
verbatim, on schedule, distinct from the other three advise/outcome combinations. All NPC item
handoffs landed. The VM flag chain and the safe/offline-keys alternate route were not earned or
exercised in this run — flagged above as unproven, not claimed as tested.
