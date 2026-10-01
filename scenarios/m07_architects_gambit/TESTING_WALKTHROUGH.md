# m07 "The Architect's Gambit" — QA Walkthrough

> Rewritten in pass 3 (2026-10-01) to match `scenario.json.erb` after `PUZZLE_CHAINS_PLAN.md`.
> Validator: 0 errors, 8 warnings. The six baseline ones are unchanged. The two new ones are co-firing `onceOnly` latches on `room_entered:generator_room` and `room_entered:cable_vault`, beside the debrief backstops; firing together is intended.
> Renamed 2026-10-01: Jake Morrison → Ray Hollis (id `ray_hollis`; globals `hollis_*`).

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

**Lock chain**

| # | Gate | Lock | Routes |
|---|---|---|---|
| 1 | → `server_room` | `rfid` `server_zone_badge` | Hollis talked round (needs the Shift Handover Sheet's print-history line) · Contractor Badge Station, PIN **0616** from the same sheet · Hollis KO'd, badge drops |
| 2 | → `generator_room` | `key` | plant key, ops floor · lockpick (start kit) |
| 3 | → `cable_vault` | `pin` **4703** | rule (relay decode T.P. block, or Hollis's tip) + ATS-1 plate on the transfer switch in `generator_room` · Elena gives the number · the log's 2291 is VOID |
| 4 | → `scada_control` | `password` **CascadeWindow19** | Elena · Listener Capture (flag 2 reward) |
| 5 | `crisis_control_system` | `flag`, no `requires` | flag 4 reward `unlock_object` |

---

## Critical path

| # | Action | Expected |
|---|---|---|
| 1 | Load the scenario | Briefing cutscene. Before the first question menu, Netherton names the kit: picks, the cloner, the print kit, no PIN cracker. Inventory: phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit. `briefing_played` set; no replay on resume |
| 2 | Read the three briefs, commit the team | `team_assignment`, `team_assigned`; `assign_tactical_team` completes; music to noir |
| 2a | *Variant:* close the briefing before committing | HaX hub offers the commit (`commit_team`) at any time. First ops-floor entry sets `inside_reached` and turns the music to noir once |
| 3 | Hollis, at the checkpoint | No evidence: bluff / stakes / walk at him / back off. Visitor log only: partial option, he stonewalls. Handover read: "You renewed Mercer's credentials on the sixteenth of June. Your login." → deal → badge, then two lines: the vault keypad was read off the transfer-switch plate, and their plant tech went down the riser when the alarms went. He leaves; `hollis_resolved = talked` |
| 4 | *Or:* Shift Handover Sheet → Contractor Badge Station, PIN 0616 | Printed Contractor Badge; `badge_obtained` |
| 5 | East into `operations_floor` | RFID guide offered unless a badge is held; `architect_contact`; Architect bark. `inside_reached` set |
| 6 | East into `server_room` (RFID) | Recon guide offered; lockpicking guide offered unless the plant key is held |
| 7 | Use the VM terminal | `vm_terminal_used`, `nfs_guide_offered`; HaX: "Map the host first. NFS is the door they left open… Want the NFS and netcat field guide?" The hub offers it; it gives "SAFETYNET Field Guide: NFS Shares and Open Ports" (URL 404s until the sheet is published) |
| 8 | Elena | `question_elena` on meeting. Revision beat sets `projection_revised`; **no HaX text while she is talking**. Turned: CascadeWindow19 + 4703 |
| 9 | VM flag 1 | Relay gives **Coordination Schedule -- Relay Decode**. `flag1_submitted` (from the task). Nudge after 1.5 s unless the decode was already read. `projection_revised` stays false until the decode is read (or Elena) |
| 10 | Read the decode (inventory) | `projection_revised`, `found_coordination_traffic`; ~3 s later one HaX verdict (see variants) |
| 11 | VM flag 2 | Listener Capture in inventory; `scada_password_found`; HaX offers the SSH field guide (`ssh-access-and-bruteforce`) |
| 12 | Open the control room door **before** flag 3 | HaX says so |
| 13 | VM flag 3 | `cascade_armed`, `redirect_window_closed`; 15-minute clock. HaX text differs if the team was never committed |
| 14 | VM flag 4 | Console unlock reward; HaX "go and give it one" |
| 15 | Mercer, console, printout | As pass 2 |
| 16 | Close the printout | Architect sign-off; reopening his thread shows only "Hang up" |
| 17 | Close the phone | Debrief (grid saved and all four flags) |
| 18 | Finish the debrief | Credits, then `bond_visualiser` |

**Optional (aim 2):** generator hall (key or picks): `generator_hall_reached`; the log says the vault code was reset and 2291 is void; the transfer switch plate reads S/N 0098-4703. Without the rule, HaX's hub offers "The vault keypad. Where do I get the code?" and names the source, not the digits. Keypad 4703: `recover_vault_pin` ticks **when the door opens**. In the vault (`vault_entered`): read the trunk runs → `splice_found` → `search_cable_vault`; Park (projection option if `casualty_projection_found`); take the mole intercept and the Tomb Gamma dossier → `recover_mole_evidence` 2/2.

**Expected, not bugs:** clicking a badge in the inventory opens the RFID clone minigame (the player holds a cloner), so cancel it. With the team never committed there are no T-20/T-10 barks. A player chased onto the ops floor by a hostile Hollis on the first entry hears `threat` give way to `noir`.

---

## Branch variants

| Variant | Setup | Expected |
|---|---|---|
| Verdict, decode first, window open | Commit Fracture; flag 1; read decode | "That's their own table … call me while there's still time." Closing Elena later sends nothing |
| Verdict, Elena first | Commit Meltdown; Elena revision beat; close her | Nothing while talking; after close "One frightened engineer … call me while there's still time." Reading the decode later sends no second verdict |
| Verdict, window shut | Commit Fracture; flag 3 before reading the decode; then read it | "… The window's shut. It goes in the report." No call to action |
| Verdict, already on Trojan Horse | Commit Trojan Horse; read decode | "The team's already in Austin …" |
| Uncommitted, late reader | Never commit; flag 3; read decode | No verdict text; HaX `topic_traffic` says the team is still waiting on the call |
| Redirect confirmation | Elena first, redirect, then read decode | "The share says what Elena told you …" once; re-reading sends nothing. Decode first, redirect, re-read: nothing |
| Redirect window shut | Flag 3 or 40 min first | "Move them" not offered; HaX refuses out loud |
| Hollis endings | talk / KO / evade / ignore him | Credits: Talked / Neutralised / Evaded / Left at his post |
| Park endings | talk (projection) / KO / evade / provoke and flee / walk past / never go down | Credits: Talked / Neutralised / Evaded / Fought off / Seen, left to work / Never found; exactly one Park line |
| Transfer switch | Enter the vault, leave Park alive and not talked round, read the switch | "CONTROL RUN FAULT" variant; base text if Park is talked round or KO'd |
| Clock expires | Wait 15 minutes after flag 3 | `countdown_expired`; printout variant; debrief line |
| Reload mid-mission | After reading the decode and the projection | Globals hold; no intro, verdict or nudge replays |

---

## Knockout matrix

| NPC | `taskOnKO` | `globalVarOnKO` | Reaction | Route that survives |
|---|---|---|---|---|
| `ray_hollis` | `clear_the_checkpoint` | `hollis_ko` | `npc_ko:ray_hollis` HaX message | badge drops (only `badge_obtained`); badge station. Loses his statement and tip |
| `elena_rodriguez` | `question_elena` | `elena_ko` | `npc_ko:elena_rodriguez` | Listener Capture (password), relay decode (revision, vault rule) |
| `james_mercer` | `confront_mercer` | `mercer_ko` | `npc_ko:james_mercer` | gates nothing |
| `thomas_park` | `neutralise_park` | `park_ko` | `npc_ko:thomas_park` | side content |

---

## Automated checks

```bash
ruby    scripts/validate_scenario.rb scenarios/m07_architects_gambit/scenario.json.erb
bash    scripts/compile-ink.sh m07_architects_gambit
python3 scripts/check_door_alignment.py scenarios/m07_architects_gambit/scenario.json.erb
ruby    tools/pass2/render.rb scenarios/m07_architects_gambit/scenario.json.erb /tmp/m07.json
python3 .claude/skills/mission-puzzle-chains/scripts/room_depth.py /tmp/m07.json
node    scripts/ink_runtime_check/inkcheck.js  <ink>.json <knot>
node    scripts/ink_runtime_check/loopcheck.js <ink>.json <knot> [VAR=value ...]
```
