# m07 "The Architect's Gambit" — QA Walkthrough

> Rewritten in pass 2 (2026-10-01) to match the shipped `scenario.json.erb`.
> Validator: 0 errors, 6 warnings and 6 "❌ INVALID" lines, all judged intended or false positives (see `PASS2_IMPROVEMENTS.md`).

**Map** — a spine with two spurs off the server room:

```
security_checkpoint ─E─ operations_floor ─E─ server_room ─N─ scada_control
     (start)                                      │
                                                  S
                                            generator_room
                                                  │
                                                  S
                                             cable_vault
```

**Lock chain** (each gate has two sources, so no knockout can strand the mission):

| # | Gate | Lock | Primary | Redundant |
|---|---|---|---|---|
| 1 | → `server_room` | `rfid` `server_zone_badge` | Jake Morrison's badge (talk him round, or KO drop) | Contractor Badge Station at the checkpoint, PIN **0616** from the Shift Handover Sheet on the ops floor |
| 2 | → `generator_room` | `key` `generator_maintenance_key` | plant key, operations floor | lockpick in starting inventory |
| 3 | → `cable_vault` | `pin` **4703** | maintenance log, generator room | Elena Rodriguez |
| 4 | → `scada_control` | `password` **CascadeWindow19** | Elena Rodriguez | Listener Capture note, handed over by the relay for flag 2 |
| 5 | `crisis_control_system` | `flag`, no `requires` | flag 4 reward `unlock_object` | — (win condition) |

---

## Critical path

| # | Action | Expected |
|---|---|---|
| 1 | Load the scenario | Briefing cutscene (Netherton on a secure link, agent in a car on the I-5); `briefing_played` set; does not replay on resume |
| 2 | Read the three briefs, commit the team | `team_assignment`, `team_assigned`; task `assign_tactical_team` completes on the commit line; music to noir |
| 2a | *Variant:* close the briefing (Esc) before committing | Open HaX: he offers the commit menu (`commit_team`), and a sticky hub option stays until the team is sent |
| 3 | Morrison | Talk (visitor log unlocks the leverage line), evade, or fight. Talked round, he hands over `morrison_server_badge` and disappears |
| 4 | *Or:* ops floor → Shift Handover Sheet → back to the Contractor Badge Station, PIN 0616 → take the Printed Contractor Badge | Badge in inventory; `badge_obtained` |
| 5 | East into `operations_floor` | RFID guide offered unless a badge is held; `architect_contact` set; Architect bark "Agent 0x00. Don't look for the trace." Click it: his first call (`taunt_t30`). Before this his thread is silent (`dormant`) |
| 6 | East into `server_room` (RFID) | Recon guide offered; lockpicking guide offered unless the plant key is held |
| 7 | Elena Rodriguez | `question_elena` completes on meeting her. Turned: gives CascadeWindow19 + 4703. Pressured: may flee (she disappears, does not attack) |
| 8 | VM flag 1 (NFS export on the attack host) | `flag1_submitted` → `found_coordination_traffic`, `projection_revised`; HaX message differs if the team is already on Trojan Horse |
| 9 | VM flag 2 (listener on a high port) | Relay hands over **Listener Capture — Operator Credentials** (a `text_file`, shown in the inventory; has the door password); `flag2_submitted` via task mapping; `scada_password_found` |
| 10 | Get the **control room door** open before logging in to the host | HaX says so ("What's the clock?", vm hint 3). It is the only door the finale needs |
| 11 | VM flag 3 (SSH as the operator, flag in home dir) | `flag3_submitted` → `redirect_window_closed`, `cascade_armed`; the visible 15-minute "Cascade sequence" clock starts; privesc guide offered |
| 12 | VM flag 4 (root via sudo) | Reward `unlock_object crisis_control_system`; `flag4_submitted` via task mapping; HaX: "go and give it one" |
| 13 | North into `scada_control` (password) | Music to spy-action |
| 14 | Mercer | `confront_mercer` completes on first contact; stance, then an ending. Detained or walked out: he disappears |
| 15 | Use the Cascade Control System (after flag 4) | Opens as a container, with no flag prompt: unlocked client-side by the reward if the room is loaded, or server-side on room load otherwise. `item_unlocked` → `shut_down_the_cascade` → `grid_saved`, `mission_complete`. The HUD clock disappears because every timer's `condition` now fails. `cancelOnGlobal` alone does not clear the HUD (engine gap). Before flag 4 the console shows a flag prompt that accepts nothing |
| 16 | Close the printout | The Architect's sign-off opens as a phone call (`sign_off`), sets `architect_signoff_done`. Reopening his thread afterwards gives only "Hang up" (`after_win`), never an old taunt |
| 17 | Close the phone | Debrief opens (needs grid saved **and** all four flags). `debrief_played` set at the top |
| 18 | Finish the debrief | `take_the_debrief` completes on the last line → victory music → credits → `bond_visualiser` |

**Optional (aim 2):** south to `generator_room` (key/lockpick), maintenance log (4703, completes `recover_vault_pin`), south to `cable_vault`, Thomas Park, collect `mole_intercept_evidence` and `tomb_gamma_dossier`.

---

## Branch variants to test

| Variant | Setup | Expected |
|---|---|---|
| Each delegation target | fracture / trojan_horse / meltdown | Debrief reads the two not covered |
| Team never committed | Close briefing, never use HaX's commit | Debrief `covered_none`; credits "never committed" |
| Team already on Trojan Horse | Commit Trojan Horse, find the revision | No redirect option on the HaX hub; debrief says "you found out what you had chosen" |
| Redirect taken | Revision found, redirect before flag 3 / 40 min | `team_redirected`; Architect sign-off registers surprise |
| Redirect declined | Revision found, HaX redirect → "Leave them" | `redirect_declined`; debrief + credits record it |
| Redirect window shut | Flag 3 or 40 min first | HaX refuses out loud |
| Flag 3 after the win | Submit flag 4, save the grid, then flag 3 | No arming, no clock, no HaX "they saw you" message |
| Reload after the win | Reload with `cascade_armed` and `grid_saved` true | No clock, no `countdown_expired` |
| Clock expires | Wait 15 real minutes after flag 3 | `countdown_expired`; Architect bark "Seattle first"; printout variant shows step 01 executed; debrief line + credits warning |
| Flags missing | Save the grid having submitted only flag 4 | HaX nag; debrief waits; submit the rest at the relay → debrief opens on the station closing |
| Mercer endings | record / hollowed / hostile / walks | Distinct credits; he is hidden after record, hollowed, walks |
| Reload mid-debrief | Reload after the debrief starts | Debrief does not replay; next room entry completes `take_the_debrief` |

---

## Knockout matrix

| NPC | `taskOnKO` | `globalVarOnKO` | Reaction mapping | Redundant route |
|---|---|---|---|---|
| `jake_morrison` | `clear_the_checkpoint` | `morrison_ko` | `npc_ko:jake_morrison` HaX message | badge drops (start room); badge station |
| `elena_rodriguez` | `question_elena` | `elena_ko` | `npc_ko:elena_rodriguez` | Listener Capture (password), maintenance log (PIN), flag 1 (revision) |
| `james_mercer` | `confront_mercer` | `mercer_ko` | `npc_ko:james_mercer` | gates nothing |
| `thomas_park` | `neutralise_park` | `park_ko` | `npc_ko:thomas_park` | side content |

---

## Automated checks

```bash
ruby    scripts/validate_scenario.rb scenarios/m07_architects_gambit/scenario.json.erb
bash    scripts/compile-ink.sh m07_architects_gambit
node    scripts/ink_runtime_check/inkcheck.js  <ink>.json <knot>
node    scripts/ink_runtime_check/loopcheck.js <ink>.json <knot> [VAR=value ...]
ruby    tools/pass2/render.rb scenarios/m07_architects_gambit/scenario.json.erb /tmp/m07.json
python3 tools/pass2/door_align.py /tmp/m07.json
```

The re-entry states run in pass 2 are listed in `PASS2_IMPROVEMENTS.md`.
