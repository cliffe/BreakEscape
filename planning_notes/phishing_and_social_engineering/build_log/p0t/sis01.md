# P0-T comparison run: sis01_healthcare (Phase 0 engine, commit 91c1ee03)

Baseline: `build_log/baselines/browser/sis01.md` (run 2807). Same route, choices and reload point.

## Run facts

| Item | Value |
|---|---|
| Game id | **2845** (mission 59, `sis01_healthcare`), `new-game.rb`, PREFLIGHT OK, no VM flags |
| Server | keyless :3001 |
| Browser | headless Chromium, session 2845, quit with `session-stop.sh 2845`; no process left (checked with `ps`) |
| Session log | `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-T-lab/sis01-session.jsonl` |
| Hook | `popup-console-hook.js`, installed straight after the browser opened and again after the reload |
| Route | Sarah's briefing (Space through it, card given) -> close Mission Brief -> dismiss tutorial prompt ("NO, I'LL FIGURE IT OUT") -> `moveToNear` + `interact` the IT Security door (card opened it) -> `enter it_security_office` -> `enter major_incident_room` -> Hartley (hub 3, then "We should assume the worst.") -> sync -> reload -> Resume -> re-enter by the same route -> Hartley again -> David "Can we skip this?" |

## Comparison

| # | Observation | Baseline | This run | Result |
|---|---|---|---|---|
| 1 | Access card from Sarah, kept | yes | inventory: Notepad + Visitor Access Card after briefing | SAME |
| 2 | Card opens IT Security door; MIR reachable with no other lock | yes | `enter it_security_office` refused with `door-locked` (rfid) before the card step, then moveToNear + interact opened it; both `enter` calls ok afterwards | SAME |
| 3 | Hartley first meeting: hartley_met true, trust 0, topic_patient_data false, 0 popups | yes | yes (0 / true / false / 0 popups) | SAME |
| 4 | Player line "We should assume the worst." showing | trust 5, 0 popups | trust 5, topic_patient_data true, 0 popups | SAME |
| 5 | Hartley's reply "That's the safe position..." showing | 1 popup `+ Influence: Dr Fiona Hartley`, `influence-increased` | 1 popup, same text and class (hook `infl` log: 1 entry) | SAME |
| 6 | Back at hub | trust 5, popup gone | trust 5, hub "What can I help with?" | SAME |
| 7 | Reload: Resume overlay; Resume clicked via DOM; title screen cleared by Space | yes | yes | SAME |
| 8 | After Resume: back in `ward_7` at (544, 192); inventory kept; IT office and MIR still unlocked | yes | ward_7 (544, 192); Notepad + card; both `enter` calls crossed with no lock step | SAME |
| 9 | Hartley reopened: trust 5, met true, topic_patient_data true, opens at hub, no popup | yes | trust 5 / true / true, "What can I help with?", 0 popups | SAME |
| 10 | David first meeting: trust 0, 0 popups at choices | yes | trust 0, 0 popups at "Before anyone isolates anything..." and after "You can. But if this goes wrong..." | SAME |
| 11 | David after "Can we skip this?" | on line "Ten minutes now is cheaper than a review later.": -5 and 1 popup `- Influence: David Osei`, `influence-decreased` | same line: -5, 1 popup, same text and class | SAME |
| 12 | David hub "Yes?": popup gone | yes | trust -5, hub reached, popup node gone | SAME |
| 13 | Popup colour of the decreased form | not read (code sets `#e74c3c`) | not read (node gone before I looked) | NOT REACHED |
| 14 | Client globals count after reload | 77 keys | not read | NOT REACHED |
| 15 | Console: uncaught exceptions | none | none; hook `errs` held only warns (notes "Cannot disable main game input", door pathfinding for `it_security_office`, missing ambient sound `hospital_ambient`); no error-level entries | SAME |
| 16 | Console: 404 counts | 2 before reload, 1 after | harness `pageErrors`: 3 x 404 before the reload, 3 x 404 after; no 400s | SAME in kind (known 404s; counts differ a little because the route took longer, and the log is shared so I did not match URLs) |
| 17 | `verify-run.rb` | progress recorded, 3 rooms, 11 NPCs met, 14 globals (list below), tasks 1 completed, score 4 | progress recorded, 3 rooms, 11 NPCs, same 14 globals, `talk_to_sarah` completed, score 4 | SAME |

Counts: SAME 15, DIFFERENT 0, NOT REACHED 2 (rows 13 and 14: both were incidental reads in the baseline, not behaviour).

Notes on rows 4 and 5: the ink value changes as the player line shows and the popup fires one displayed line later, on Hartley's reply, as in the baseline. Hartley's + and David's - popups both landed on the line after the tag, as the brief expected. No regression.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| `ravi_rfid_card` (Visitor Access Card) | item | Sarah Mitchell's arrival briefing (`#give_item:keycard`) | start, before the IT door | yes |

No PIN, code or flag used. Influence changes came from dialogue choices, not the console.

## verify-run.rb

Saved to `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-T-lab/sis01_verify.txt`.

```
game            2845  (mission 59)
created         2026-10-21 11:33:23 UTC
last write      2026-10-21 11:36:37 UTC
played for      194s of wall clock
current room    "ward_7"
unlocked rooms  3: ward_7, it_security_office, major_incident_room
unlocked objs   0: 
inventory       2: Notepad, Northgate IT Security — Visitor Access Card
NPCs met        11: sarah_mitchell, patrol_nurse, bed4_patient, bed2_patient, bed5_patient, pharmacist_npc, ravi_anand, david_osei, helen_carver, dr_hartley, dr_sharma
flags submitted 0: 
globals set     14: backup_recovery_source, bed4_alarm_active, briefing_played, ehr_status, engine_tutorial_declined, hc001_verdict, patient_bed2_state, patient_bed4_state, patient_disclosure, pump_console_advice, pump_programmed_at, ransom_advice, ransomware_deployed, ward_monitor_status
tasks           1 in objectivesState, 1 completed
  talk_to_sarah                      "completed"  at 2026-10-21T11:33:43Z
tasks_completed 1
score           4
social scenario false (completed tasks do not count; pass --tasks to count them)

VERDICT: progress recorded — 2 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```
