# m07 "The Architect's Gambit" — QA Walkthrough

> Rewritten in pass 3 (2026-10-01) to match `scenario.json.erb` after `PUZZLE_CHAINS_PLAN.md`.
> Validator: 0 errors, 8 warnings. The six baseline ones are unchanged. The two new ones are co-firing `onceOnly` latches on `room_entered:generator_room` and `room_entered:cable_vault`, beside the debrief backstops; firing together is intended.
> Renamed 2026-10-01: Jake Morrison → Ray Hollis (id `ray_hollis`; globals `hollis_*`).
> Pass 4 round 2 (2026-10-02): plant-key latch from the pickup event, post-abort Mercer and KO text, Park pointer on HaX's hub, 9-minute fallback from `grid_saved`, Threat Desk Summary reordered (Blackout, Trojan Horse first), credits per stance. Validator: 7 wiring warnings (adds the four `debrief_timer_fired` rows; the first to fire closes the rest).
> Updated in pass 4 design (2026-10-02): the debrief waits for the player ("Bring me in" on HaX's hub, or an 8-minute fallback after the Architect's sign-off), a Threat Desk Summary in the start kit, one VM guide offer instead of two, the Tesseract plant. Validator (as updated in the tree on 2026-10-02): 0 errors, 6 wiring warnings, all co-firing `onceOnly` handlers on `agent_0x99` that are meant to fire together (flag 3, server hall, generator hall, cable vault, ops floor, the three flag nags). The server-hall recon offer is gone; `room_entered:cable_vault` now also carries HaX's pointer to the projection.

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
| 1 | Load the scenario | Briefing cutscene. Before the first question menu, Netherton names the kit: picks, the cloner, the print kit, no PIN cracker. Inventory: phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, **Threat Desk Summary -- Tasking 02:41 PT** (readable from the inventory: Blackout then Trojan Horse first, "Dormancy: 90 days … Deaths: NONE PROJECTED", issued 10:41 UTC). On the commit, HaX texts "Team's turned. Two of the three go unanswered tonight. Let it hurt afterwards, not during." (`hurt_line_said`; an uncommitted player gets "You're inside. Whatever you decide tonight, let it hurt afterwards, not during." 1 s after first entering the ops floor, before the Architect's 3 s bark). `briefing_played` set; no replay on resume |
| 2 | Read the three briefs, commit the team | `team_assignment`, `team_assigned`; `assign_tactical_team` completes; music to noir |
| 2a | *Variant:* close the briefing before committing | HaX hub offers the commit (`commit_team`) at any time. First ops-floor entry sets `inside_reached` and turns the music to noir once |
| 3 | Hollis, at the checkpoint | No evidence: bluff / stakes / walk at him / back off. Visitor log only: partial option, he stonewalls. Handover read: "You renewed Mercer's credentials on the sixteenth of June. Your login." → deal → badge, then two lines: the vault keypad was read off the transfer-switch plate, and their plant tech went down the riser when the alarms went. He leaves; `hollis_resolved = talked` |
| 4 | *Or:* Shift Handover Sheet → Contractor Badge Station, PIN 0616 | Printed Contractor Badge; `badge_obtained`; HaX: "PIN set to the audit date …" |
| 5 | East into `operations_floor` | RFID guide offered unless a badge is held; `architect_contact`; Architect bark. `inside_reached` set. Opening his thread: T-30 ends "Let it hurt afterwards, not during. I expect you've been told that." → `architect_echo_heard`; HaX's hub then offers `topic_teacher`, "He used your line. 'Let it hurt afterwards.'" (she recognises it, names no one) |
| 6 | East into `server_room` (RFID) | Lockpicking guide offered unless the plant key is held (`maintenance_key_found`, now set by an `item_picked_up:key` mapping); no recon offer here any more |
| 7 | Use the VM terminal | `vm_terminal_used`, `recon_guide_offered`, `nfs_guide_offered`; HaX: "Map the host first. NFS is the door they left open… Want the recon guide, or the NFS and netcat one?" The hub offers both; it gives "SAFETYNET Field Guide: NFS Shares and Open Ports" (URL 404s until the sheet is published) |
| 8 | Elena | `question_elena` and `elena_met` on meeting. Revision beat sets `projection_revised`; **no HaX text while she is talking**. Turned: CascadeWindow19 + 4703 |
| 9 | VM flag 1 | Relay gives **Coordination Schedule -- Relay Decode**. `flag1_submitted` (from the task). Nudge after 1.5 s unless the decode was already read ("Read the Austin row against the threat desk summary in your kit"). The decode ends with the Architect's "I merely publish the schedule. -- A." `projection_revised` stays false until the decode is read (or Elena) |
| 10 | Read the decode (inventory) | `projection_revised`, `found_coordination_traffic`; ~3 s later one HaX verdict (see variants) |
| 11 | VM flag 2 | Listener Capture in inventory; `scada_password_found`; HaX offers the SSH field guide (`ssh-access-and-bruteforce`) |
| 12 | Open the control room door **before** flag 3 | HaX says so |
| 13 | VM flag 3 | `cascade_armed`, `redirect_window_closed`; 15-minute clock. HaX text differs if the team was never committed; both end "Privesc guide's yours if you want it." |
| 14 | VM flag 4 | Console unlock reward; HaX "go and give it one" |
| 15 | Mercer, console, printout | As pass 2 |
| 16 | Close the printout | Architect sign-off (`architect_signoff_done`); reopening his thread shows only "Hang up". ~2.5 s later HaX: "Grid's held. Netherton wants you. The plant's south of the server hall if you want anything bagged. Call me when ready. Nine minutes from the abort, he's on anyway." (shorter variant without the plant line if the intercept is already held) |
| 17 | Close the phone | **No debrief yet.** The building stays open: the plant, the vault and Mercer's post-abort lines are all reachable. The `debrief_fallback` timer (9 min from `grid_saved`) is running |
| 17a | Call HaX → "Bring me in." | `debrief_requested`; "Putting you through." The phone closes and the debrief opens (any UI close or room entry with grid saved, all four flags and `debrief_requested`) |
| 17b | *Or:* wait (9 min from the abort) | `debrief_timer_fired` → HaX sets `debrief_requested`: "Netherton's done waiting. Next door you go through, he's on the link." (flag missing: "…The moment the last of it is through the relay, he's on.") Next room entry or closed screen opens the debrief |
| 18 | Finish the debrief | Credits, then `bond_visualiser`. Every player now hears Netherton's "Every figure you were briefed with tonight came from material we captured…" (`revision_lesson`) |

**Optional (aim 2, "Trace How They Got In (Optional)", before or after the abort):** generator hall (key or picks): `generator_hall_reached`; the log says the vault code was reset and 2291 is void; the transfer switch plate reads S/N 0098-4703. Without the rule, HaX's hub offers "The vault keypad. Where do I get the code?" and names the source, not the digits. Keypad 4703: `recover_vault_pin` ticks **when the door opens**, and HaX says "'Don't write it down,' so they riveted it to the door…". Entering the vault without having read the casualty projection (Park alive, not talked round): ~9 s later HaX (4 s, skipped if Park has been dealt with) points at the projection on Mercer's console; HaX's hub keeps "The man in the vault won't stop. What would reach him?" (`topic_park`) while it applies. In the vault (`vault_entered`): read the trunk runs → `splice_found` → `search_cable_vault`; Park (projection option if `casualty_projection_found`); take the mole intercept and the Tomb Gamma dossier → `recover_mole_evidence` 2/2.

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
| Plant after the abort | Save the grid with the vault untouched; don't call HaX; go down | No debrief on any room entry; vault, Park, intercept, Tomb Gamma all reachable; then "Bring me in" |
| Reload after the abort | Save the grid, close the sign-off, reload before asking | No debrief on load or room entry; "Bring me in" still on HaX's hub; the fallback timer restarts (engine restarts started timers on reload) |
| Flags missing at the abort | Save the grid with flag 1, 2 or 3 unsubmitted | Flags nag ("…Submit the rest, then call me and I'll put you through."); no sign-off text from HaX; "Bring me in" answers "Not until everything off that host has gone through the relay…"; the debrief opens on the relay closing after the last flag |
| Elena met, left | Talk to Elena, leave without turning or pressuring her | Debrief: "Elena Rodriguez talked to you and you left her at the rack…"; credits "Spoken to, left at the rack" (not "Never spoken to") |
| Mercer stance vs fate | Pick a stance, then KO him or let him escape | Fate-neutral stance line ("He took that with him." / "He will remember being argued with." / "He will have found that harder…"); statement/transcript wording only when arrested |
| Mercer after the abort | Abort first, then talk to him; KO him | Opening reads the abort ("You took it off me at that console…"), stance gate and choice labels in the past tense; KO text "The grid held without him…", not "Finish the host" |
| Redirect asked after the abort | Learn the revision, abort, then "Can I still move the team…" | Refused; last line "…the part that was yours is finished." |
| Mercer never confronted | Skip or leave his conversation | Credits "Left at the console — gone before the police reached the room" |
| Tomb Gamma not found | Skip the dossier | Debrief hub doesn't offer the Tomb Gamma question |
| Team on Trojan Horse, revision unread | Commit Trojan Horse, never read the decode or hear Elena | No "PROJECTION UNCHALLENGED" credit |

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
