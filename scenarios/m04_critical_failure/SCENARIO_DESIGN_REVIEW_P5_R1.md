# m04 Critical Failure: scenario design review, pass 5, round 1

Reviewer: fresh Opus agent, read-only (2026-10-13). Skill: `scenario-design-review`, run in full. Static review: no browser session was started.

Kind of game: a SAFETYNET campaign mission, judged as a TV spy thriller whose VM flags are required and woven into the story. The teaching comes through the VM work and the field guides.

Sources: `scenario.json.erb` and the ten `.ink` files at HEAD 0035bb4d (puzzle chains round 4 included), `mission.json`, the brief's "VM side, at a high level". `DESIGN_REVIEW.md` and `SOLUTION_GUIDE.md` were not relied on. The SecGen XML and the four listed field guides were not opened. For the lab sheets, only the filenames and the `title:` lines were read.

## Verdict

The mission is solvable on every branch traced. I found no blockers and no soft-locks. Every person NPC can be knocked out at any point without stranding the mission, and the debrief and credits agree on every casualty and KO combination I checked. Objective scaffolding is good, with one stuck point (the Hall 2 reader with no card) that has no prompt on screen.

The one major finding is an educational gap. The debrief's "what failed" beat reflects only on the physical and sensor weaknesses. None of the OT-network lessons that the four required flags teach are reflected on, even though m02 and m03 both do this.

**Counts: 0 blockers, 1 major, 17 minors.** There are also 7 items that need checking against SecGen by the user (carried forward from R2-6 and m17, with three more added).

## Step 1: the tools

### Validator (`ruby scripts/validate_scenario.rb … --skip-ink --no-graph`)

The schema passed, there are no unknown fields, the room geometry is OK (no world-space overlaps) and door alignment is OK.

**Warnings (16), all known and none new:**
- 12 "multiple onceOnly handlers on one pattern" notes on `agent_0x99`. They are independent side effects, ruled as known noise in puzzle chains F5. I re-checked the two that matter: the three `map_the_attack` handlers are disjoint on `voltage_neutralised` (erb 1141-1182), and the four hydrogen-alarm texts are disjoint (erb 839-862).
- 2 "cutscene without onceOnly": the guard's and Cipher's sight challenges. They are deliberate (they repeat until a `skipIfGlobal` ends them), as with m03's Terry.
- 2 "no behaviour" notes: Netherton and Nightshade, the hidden co-speakers in the briefing. Deliberate.

**Good practice:** event-driven cutscenes, `globalVarOnKO`, `timedConversation.skipIfGlobal`, phased music, hostile NPCs and graph metadata.

**Suggestions:** the three operatives share the legacy `hacker-red` sheet. This is deferred to the character stage (R-M1). The PIN, password and PC-file suggestions are generic and don't fit this mission.

### dialoguelint

0 errors and 5 `blank-reentry` checks: `cipher_gone` (Cipher L130), `vance_commits_choices` (L611), `guard_idle` (L98), `voltage_captured_end` (L388) and `voltage_escape_success` (L422). These are the same five as at the end of the previous phase, already deferred to the dialogue phase. Two of them (`cipher_gone`, `voltage_escape_success`) belong to hidden NPCs and can't be re-talked to, so only three matter.

### Route driver (`scripts/ink_runtime_check/m04_routes/route.js`, all 16 routes)

All 16 report `[result] all expectations met`, with exit code 0. A grep for `FAIL` matches only the credits subtitle "CRITICAL FAILURE". The compiled ink JSON is newer than every `.ink` file, so the routes ran the current ink.

### Dungeon graph

`dungeon_graph.md` (written 1 minute after the erb's last edit) shows 43 puzzle nodes and 52 edges, plus 6 story nodes and 5 edges. The critical path is Get Inside → Confirm the Lie → Reach the Workshop → Map the Attack → Stop the Runaway. The VM chain is connected (`bms_jump_server_terminal → vmch_submit_network_scan_flag → …`), all four flags plus the dial and the Voltage action feed `lock_esd_pushbutton`, and there are no backwards edges. Two gaps are listed under m15.

## Severity table

| # | Sev. | Finding | Evidence | Fix |
|---|---|---|---|---|
| M1 | **major** | **The debrief reflects on none of the OT-network weaknesses that the four required flags expose.** `debrief_what_failed` lists prox cards, a one-factor print reader and trusted sensors, all physical. Nothing says what the player proved on the jump server: a legacy distcc daemon left listening on an OT box, a weakly protected FTP service that leaked, and a sudo rule that broke least privilege. These are the mission's MAT, SS and NS keywords. m03's what-failed beat has its distcc line (`m03_closing_debrief.ink:464`), and m02's debrief names its ProFTPD backdoor (`m02_closing_debrief.ink:254`). The debrief also never credits flag 2's cross-cell intelligence. When the player hasn't picked up a plant-room document, HaX says "The paper's still in the plant room… I'd rather you'd read it", even though the required FTP flag already showed Critical Mass working with other cells (brief, flag 2). | `m04_closing_debrief.ink:181-185`, `:202-217`; brief §"The VM side" | Add two short lines to `debrief_what_failed`, after the sensor line and before the fixes, at the brief's level of detail. For example: "On the network, a compile daemon nobody had switched off, listening on an OT box and running whatever it was sent." / "And a sudo rule that let an ordinary account edit its way to root." Add one matching fix to the fix lines ("Legacy services off the OT network, and sudo rules somebody actually reads."). In `debrief_intelligence_gathered`, change the `else` branch to credit the flag: "Their FTP drop already put Critical Mass and Social Fabric on the same job. The paper in the plant room would have signed it." Keep the wording at the brief's level and leave it for the user's SecGen check (decision 1). There is no m04 audio yet, so new lines cost nothing to re-voice. |
| m1 | minor | **No prompt on screen when Hall 2's reader refuses a player with no Level 1 card.** On the cover route the clone is a parenthetical choice the player can miss. They can still read the dial (Hall 1 has no lock), and the anomaly call sends them to the workshop. HaX's Hall 1 text then sends them to Relay "in the inverter room", where the Hall 2 reader refuses. No text fires: the only `door_unlock_failed` mapping is the plant room's. The task reads "Take a workshop card off the cell", and the fix lives only in the hub (`hint_clone`, "Where do I stand?"). RFID refusals do emit `door_unlock_failed:<room>` (`unlock-system.js:128-130`). | erb 753, 795-804; `m04_phone_agent0x99.ink:159` | Add a HaX mapping on `door_unlock_failed:battery_hall_2` with the condition `vance_provided_keycard !== true && level1_card_held !== true`, onceOnly, sending: "That reader wants a Level 1 card. Vance's is old prox. Stand close while he talks and the cloner reads it. Or the spare in the security office locker." |
| m2 | minor | **HaX's 61°C call opens itself the instant the dial is touched, in the hall where Cipher patrols.** This is the m03 P3-3 / m02 A7 class of bug: an automatic phone-chat can close the examine view the player just opened. If Cipher is hostile, a hit can close the call, and its onceOnly is then recorded with no replay in the hub. The facts survive (the call repeats the 61 and the aim names the workshop), so this is minor. | erb 760-766, 1832-1835, 1736-1750 | Browser check first: touch the dial with Cipher hostile nearby, and touch it with Cipher walked. If either loses the call, switch to m03's "text that opens the call" pattern (a `sendTimedMessage` whose click opens `on_anomaly_confirmed`). |
| m3 | minor | **Static stands idle beside a knocked-out Voltage.** Here is the route. Static is talked past (`static_stood_aside`). The player then punches Voltage without opening the stance chat, so no `#hostile:operative_static` fires (accepted in alignment m9). Voltage goes down, Static keeps standing aside, and a re-talk offers "Leave him be." / "Out of my way." The sweep is then spent next to an idle enemy whose boss is on the floor. Static only leaves on `voltage_escaped`. | erb 2141-2178; `m04_npc_operative_static.ink:73-84` | Add a Static mapping on `npc_ko:voltage` with the condition `static_stood_aside === true && static_engaged !== true && operative_static_defeated !== true` that sets `static_left: true`. The existing `setVisible` mapping and the room-entry re-hide then apply. Static's credit, "stood aside, and left with Voltage", would then be wrong, so add a twin credit ("STATIC: stood aside, and slipped out when Voltage fell") keyed on a new `static_left_alone` global set by the same mapping. Alternatively, turn him hostile if an engine action for that is ever added. |
| m4 | minor | **Vance speaks in the debrief and is thanked as a colleague when the player never met him.** On route r15 (slipped past the guard, used the locker spare, Vance never met), the disclosure beat still says "Vance needs to hear it too" and gives him lines. His last words are "I don't follow all of it…", and the player's farewell choices are "It was an honour working with you, Mr Vance." / "Just doing my job." The credits say "ROBERT VANCE: never told — the cover held all night", but there was no cover to hold. | `m04_closing_debrief.ink:344`, `:362-370`, `:442-468`, `:472-476`; erb 194 | Declare `vance_met` in the debrief ink. Gate Vance's reactions and the two farewell choices on `vance_met or vance_is_ally`. Add a fallback farewell ("Make sure the site manager gets the report.") for the not-met case. Credit: "ROBERT VANCE: never met — you went round him" when `!vance_met && !robert_vance_ko && !vance_is_ally`, and keep "never told" for `vance_met && !vance_is_ally`. |
| m5 | minor | **The credit "ROBERT VANCE: vindicated — his warning broke the case open" claims something the story doesn't show.** SAFETYNET's lead came from "their traffic" (briefing), and Vance's email warned his own OT team. The credit shows for any ally, including one who never had the email read or mentioned. | erb 193; `m04_opening_briefing.ink` (timeline) | Reword so it holds for every ally: "ROBERT VANCE: brought in — ran the desk while you ran the halls". Alternatively, keep "his warning" only when `evidence_maintenance_logs_found`. |
| m6 | minor | **The debrief names Blackout to a player who may never have heard the name, while the credits hide him.** The `voltage_captured` branch says "Nobody else in that building knows the chain above Blackout" unconditionally. The credits line "BLACKOUT: signed the casualty model" is gated on `blackout_named`. A player who skipped the briefing's Critical Mass topic, punched Voltage without talking and never read the blueprints hears the name with no introduction, then sees no Blackout credit. | `m04_closing_debrief.ink:137-139`; erb 208 | Either add `#set_global:blackout_named:true` on that debrief line (HaX names him, so the player has now heard it), or use "…the chain above him" when `not blackout_named` (declare the VAR). |
| m7 | minor | **The debrief contradicts itself on what Voltage has said in custody.** It says "So far he's given us one thing: his casualty figure." Then, on the "How far does this reach?" branch, it says "Voltage put it at six cities." | `m04_closing_debrief.ink:166`, `:253-256` | Change the second line to "Voltage told you six cities, in the plant room." when he said it (track it with a synced global set in `voltage_negotiation_attempt`). Otherwise use "The documents name several cities." |
| m8 | minor | **HaX's first call lets the player claim a reveal that didn't happen.** `vance_cover_status` is reached only when `vance_is_ally` is false. Its third choice, "I told him the truth about ENTROPY. He's in.", is therefore always untrue when shown, and HaX answers "Bold. If he's in, use him." | `m04_phone_agent0x99.ink:503-531` | Delete that choice. The two remaining choices are once-only, but the knot is reached once per first call, so it can't run dry. |
| m9 | minor | **Canon: "You're under arrest."** SAFETYNET has no jurisdiction or arrest powers (`story_design/universe_bible/02_organisations/safetynet/overview.md`, "The Cost of Independence"; PASS2 lesson 39). Voltage's two arrest choices say "under arrest", and HaX's hint says "You can arrest him" / "the arrest is yours". m01, m02 and m06 have the same wording, so the precedent is cross-mission. | `m04_npc_voltage.ink:305`, `:449`; `m04_phone_agent0x99.ink:333-335` | For the dialogue phase: "Step away from the bench. You're coming with me." / "Hands on the bench. The police can have you." HaX: "You can take him." The globals and the credit ("in custody") are unchanged. The other missions go to the backlog (decision 2). |
| m10 | minor | **The evacuation texts land while Vance's chat is still open.** `vance_crew_sound` returns to his hub, so the conversation stays open, and HaX's `crew_warned` text arrives 3 s later on top of it. Lesson 20 is why the Vance-ally text waits for `conversation_closed:robert_vance`. | erb 872-894; `m04_npc_robert_vance.ink:471-477` | Raise the three `crew_warned` texts' delay to about 8 s. Alternatively, key them on `conversation_closed:robert_vance` / `robert_vance_phone` with `crew_warned === true` plus the same disjoint conditions. In that case, keep the `setGlobal` (clock start) on the `global_variable_changed` mapping. |
| m11 | minor | **Optional tasks look required.** The log notes that the objectives panel draws an optional task like a required one. "Deal with the intruder in Battery Hall 1" then reads as an order to fight Cipher, which works against Cipher's walk-away route. The same goes for "Search for evidence of unauthorised access" (optional since R2-1). | erb 394-399, 266-271; log, puzzle chains R2-1 | Mission-local: retitle as optional, e.g. "(Optional) Deal with the intruder in Battery Hall 1" and "(Optional) Find evidence of the break-in". An engine fix that styles optional tasks is decision 4. |
| m12 | minor | **"Where do I stand?" still says "Hall 2 opens on Vance's card"** to a player holding the locker spare. | `m04_phone_agent0x99.ink:849` | "…and Hall 2 opens on any Level 1 card." |
| m13 | minor | **Stale comments in the erb that mislead the next editor.** (a) The comments on the operative counter and on Voltage's KO say `globalVarOnKO` doesn't emit `global_variable_changed`. That has been false since pass 3 (the correction to PASS2 lesson 18). The `npc_ko` mappings still work, so this is comment only. (b) The trigger-race comment says a reload "restarts" the race, which contradicts the dispatcher-resume comment 30 lines above it. | erb 1005-1014, 1105-1112, 2366-2371 vs 2336-2338 | Correct the three comments. No logic change. |
| m14 | minor | **Dead config:** `agent_0x99_debrief` (a person NPC) is in the phone's `npcIds`. It's harmless: `getNPCsByPhone` lists `npcType === 'phone'` only (`npc-manager.js:474-477`), so it is never preloaded and its `#set_global:debrief_started` can't run early. m03 lists only `agent_0x99`. | erb 475 | Remove it from `npcIds`. |
| m15 | minor | **Graph metadata gaps.** The security-locker spare (a real Level 1 route since R3-1) has no `puzzle_graph_role` or `puzzle_graph_unlocks`, so the graph shows Hall 2 opening only via Vance. The cloner's `puzzle_graph_unlocks` lists only `battery_hall_2`, so the Relay clone route into the workshop isn't drawn. | erb 1676-1683, 484 | Spare: `"puzzle_graph_role": "key", "puzzle_graph_unlocks": "battery_hall_2", "puzzle_graph_optional": true`. Cloner: `["battery_hall_2", "engineering_workshop"]`. |
| m16 | minor | **A field guide's item name doesn't match its sheet.** The item is "SAFETYNET Field Guide: ProFTPD Backdoor", but the published sheet's title is "SAFETYNET Field Guide - ProFTPD Exploitation Workflow" (and the brief calls it that). | erb 714 | Rename the item to "SAFETYNET Field Guide: ProFTPD Exploitation Workflow". |
| m17 | minor | **A reload mid-debrief ends the mission with no credits and no disclosure choice.** The hear-the-debrief backstop completes `report_to_0x99` on the next room entry. The credits fire only on `conversation_closed:agent_0x99_debrief`, which never comes, and the disclosure credit is lost. This is m03's pattern, accepted there. | erb 1290-1296, 165-171 | Browser check that m03 behaves the same. If it does, accept and log. A fix would be an engine item (credits on mission conclusion). |

### Needs checking against SecGen by the user

Carried forward from R2-6 and m17, plus new ones. Everything here is finer than the brief's high-level summary, so I can't confirm it.

| # | In-game claim | Where |
|---|---|---|
| S1 | Flag 1 is on a "fake rack status page" (an HTTP page; mission.json lists "HTTP analysis") | erb 320 (task title); erb 948 ("status page") |
| S2 | Flag 2's FTP service is "the same backdoored build you met at St Catherine's" (ProFTPD), and its file is an "intelligence file" | erb 337, 711-717, 996; phone `request_proftpd_guide` |
| S3 | Root shows "the charge-ceiling override on every bank", "pushed from that box" | erb 988, 1172, 1181, 1565 |
| S4 | The jump server is at 192.168.100.10, and the parameter log's source is 192.168.100.X | erb 1523, 1588, 1486 |
| S5 | The flag order is free (any flag can land first). Verified on the game side (R4-5); the VM side needs checking too | erb 958-997 |
| S6 | "Privilege Escalation via Sudo" (the sheet title) teaches the sudoedit route that mission.json names (CVE-2023-22809) | erb 702-708; mission.json |
| S7 | The new M1 debrief lines, once written | `m04_closing_debrief.ink` |

## Step 2: design review

### 2a. Solvability trace: OK

This is the critical path with every alternative I traced, checked against the erb.

1. **Gate.** The guard is talked to (every ink route ends in `guard_entry_granted`, guard L266-276), slipped past (close the chat, then a 20 s cooldown), or knocked out. Nothing downstream needs `guard_admitted`, because the hub reads `checkpoint_passed` (erb 925-928).
2. **Level 1 card**, from any of three sources: clone Vance (cover, ally or hub safety net; `card_cloned` mapping erb 1063-1067), Vance's knockout drop (itemsHeld erb 1407-1419, latched by erb 1055-1059), or the locker spare (lockpick, erb 1661-1683).
3. **The dial**, in Hall 1, which has no lock. `triggerOnInteract` sets `anomaly_detected` and completes the task (erb 1832-1835). The task auto-reveals and completes `confirm_the_lie` even if `get_inside` is still open (Vance never met), as the erb comment at 377 describes.
4. **Level 2 card**, from Relay: a clone mid-standoff (her ink's sticky clone choices, L95 and L165; mapping erb 828-834), or a knockout (drop, plus HaX's relayed copy via phone, erb 1043-1047 and ink `on_relay_ko_card`).
5. **The workshop**: the VM, four flags in any order, `map_the_attack` complete, then `attack_mechanism_known` (erb 1141-1145). The tool case (lockpick, medium) holds the fingerprint kit and the job card.
6. **Vance's print**, lifted from the Hall 1 duty panel (erb 1882-1896); it works even with Vance knocked out. Plant-room biometric.
7. **Static**: talked past (`static_stood_aside`), fought, or knocked out. **Voltage**: fight (taskOnKO plus `npc_ko` mapping), arrest (Static down), button stance (only with the attack mapped and the dial read), or back off and come back later.
8. **The ESD** arms on whichever of the three conditions lands last (erb 1193-1213). It sets `attack_prevented` and unlocks the call-in; "Bring me in" sets `mission_complete`, which opens the debrief.

No circular dependencies. The kit is behind Level 2, Level 2 is behind Level 1, and none of those three is behind the plant room. Against `SOFTLOCK_PATTERNS.md`:
- S1 (burnt first-call gate): no. HaX's first call is only flavour, and every gate is in the sticky hub.
- S2 (order dependence): checked. Flags first with the dial last (r14); Vance never met with the spare (r15); Voltage before the flags (r11); the alarm before the mapping (r12).
- S3 (said but not set): none found. "Sounding it now" sets `crew_warned` in the same knot, and "Bring me in" sets `mission_complete`.
- S4 (premature `#complete_task`): `meet_robert_vance` completes at the top of the meeting, which is intended, since the meeting is the outcome. `report_to_0x99` sits at the end of the debrief.
- S5 (sticky option over exhausted content): no runaways in the routes. The Vance hub's sticky choices lead only to sticky or resting knots.
- S6 (unreachable setter): every ESD condition has a setter on every Voltage outcome and every vent path.
- S7 (lock waits on a past event): the ESD mappings fire on each prerequisite and check the other two, so none waits on an event that has already gone.

**VM wiring:** all four `submit_flags` tasks have `targetFlags` and `targetCount` (erb 319-371). The flag globals are set by `objective_task_completed` mappings (erb 1159-1162) and by `set_global` flag rewards (erb 1548-1573). Nothing relies on `emit_event`.

**Promises the scenario can't keep:** none that affect solvability. Every prop the ink names exists: the duty panel, the tool case, the go-bag, the laptop, the coordination log and the operation log.

### 2b. Clue distribution: OK

| Secret | Sources (room) | Earliest point |
|---|---|---|
| The screens lie, so find an off-bus instrument | SCADA HMI observation (control room); Nightshade in the briefing; HaX's first call, `hint_dial` and "Where do I stand?"; Vance's 20 s text and hub (ally); the H₂ panel, which is off SCADA (Hall 1) | Briefing |
| Relay holds Level 2 | HaX text on entering Hall 1; Vance's hub ("Their contractors had Level 2"); Cipher's note ("Nobody reaches the workshop"); the briefing ("Relay walks the inverter room") | Hall 1 |
| The plant reader takes Vance's print, and where to lift it | HaX texts (reader seen, kit picked up); the job card in the tool case; the facility layout map (ops office: "log at the Hall 1 panel… R. Vance"); the reader export (security office); Vance's hub and phone (ally) | Ops office (map) |
| Voltage's print on the bypass module (optional) | The module in Hall 2; the compare in the kit | Hall 2 |

The clues are spread across five rooms and each comes before the lock it opens. Several readables are pure flavour: the visitor log, desk procedures, budget memo, process diagram, dock schedule and the two emergency notices. They carry the setting, and the budget memo pays off in the debrief's "budget" choice, so none needs cutting. There are no navigation-only notes. The layout map carries the duty-round clue.

### 2c. Educational coverage (CyBOK, from `mission.json`)

| KA / topic | Keyword | Taught through | Verdict |
|---|---|---|---|
| Most keywords | — | Play, the VM work and the field guides | Covered |
| Insider threats | — | Only the contractor angle | Thin |
| Audit approach | — | — | Thin |
| Network topology | — | — | Thin |
| HTTP analysis | — | Depends on the VM (S1) | Needs checking against SecGen |

*(From here on the orchestrator completed this report from the reviewer's hand-back, because a safety check stopped the reviewer while it was writing. The findings are the reviewer's.)*

### 2d. Field guides
All eight lab-sheet URLs exist in HacktivityLabSheets. Each guide is offered when the player first meets its obstacle, and handed over when asked for. There is no fingerprinting guide (already deferred as m20).

### 2e. Objective scaffolding: the next step on screen
A task or text follows every major beat except one (m1): a player refused at Hall 2's reader without a Level 1 card is told nothing.

### 2f. KO resilience
Any NPC can be knocked out at any point without stranding the mission:
- every critical task has `taskOnKO` or a mapping;
- the card drops and HaX's relayed copy of Relay's card are backups;
- the win condition doesn't depend on any NPC.

### 2g. Reload resilience
Every global that gates progress is synced. A reload loses only ink-local state, and harmlessly:
- HaX's used hints come back;
- Vance's alarm-cost line repeats;
- Voltage's opener replays.

### 2h. Debrief and credits
They agree on every combination of vent, warning and KO checked. The only gaps are m4–m7 in the severity table:
- Vance speaking and thanked when never met;
- "vindicated";
- Blackout named while his credit stays gated;
- "one thing" against "six cities".

The browser findings M-1 to M-3 (PASS5_PUZZLE_R3_BROWSER) fall into the same classes:
- M-1 is the pair of back-to-back HaX texts;
- M-2 is Vance's task left open;
- M-3 is the same as m4.

## Decisions for the user (reviewer's recommendations)

1. **M1, new debrief lines on the network weaknesses** (the legacy distcc daemon, the leaky FTP service, least privilege): add two or three, kept to the level of detail in the brief. The user checks them against SecGen.
2. **"Under arrest" canon:** change m04's wording now. Put m01, m02 and m06 in the backlog; m01 has cached audio.
3. **SecGen claims S1–S7:** the user checks them outside the session.
4. **Engine:** show optional tasks differently in the objectives panel. Retitling them is the mission-local stopgap.
