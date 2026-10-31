# m04 Critical Failure — Design review (pass 4)

Reviewer: pass-4 design reviewer, 2026-10-02. Read-only review; the only file written is this one (the validator regenerated `dungeon_graph.*`).

**What was run.** `ruby scripts/validate_scenario.rb scenarios/m04_critical_failure/scenario.json.erb` (static). No browser test was run for this review. Claims about the engine are cited to `public/break_escape/js/`; scenario lines are cited as `erb:NN` (`scenario.json.erb`) and ink as `<file>.ink:NN`.

**Read for this review.** `AGENTS.md`, `docs/agents/PASS4_BRIEF.md`, the skill, `PUZZLE_CHAINS_PLAN.md` (§0, §1, §3, §6–§10), all ten m04 `.ink` files, the full erb, the regenerated `dungeon_graph.md`, the dusting and reader minigames (`minigames/dusting/*`, `minigames/biometrics/*`, `systems/biometrics.js`, `systems/biometric-samples.js`, `systems/biometric-lock.js`), and the m01 debrief, m03 briefing and m05 briefing for comparison and continuity.

**Verdict in one paragraph.** Pass 3 left m04 structurally sound: no validator errors, no soft-locks found, every person NPC KO-safe on the critical path, and a real boss-key chain (clone → Relay's card → kit → print → reader). The telemetry-versus-thermometer turn and the hardwired ESD are the best Cyber Security teaching in the mission. The weaknesses are at the joins: the mission's turning point (61°C) gets no voice; the OptiGrid tool case, which holds the new kit, has no pointer, so a player who does the VM first can end up hunting for it under the countdown; the operatives stand idle until spoken to, and every conversation with them ends in a fight whatever the player says; the ESD's "NOT ARMED" gate contradicts the mission's own "nothing can stop the hardwired button" fiction; and the fingerprint mechanic, which the minigame teaches well, never gets its security takeaway said out loud by anyone in the story. The debrief reflects the endings, Voltage, Vance and the lore, but not what the player learnt.

## 1. Validator (Phase 1)

Schema, ERB, ink files, unknown fields, room geometry and door alignment all pass.

**Dungeon graph.** Puzzle 43 nodes / 46 edges · Story 6 / 5 · Integrated 49 / 62 · Rooms 9 / 8 · Contents 72 / 71.
Critical path (4 hops): Get Inside → Confirm the Telemetry Is Lying → Reach the Engineering Workshop → Map the Attack on the OT Network → Stop the Thermal Runaway.

### ❌ INVALID

None.

### ⚠️ WARNING

Six onceOnly-pair warnings, all on `agent_0x99`. Each pair was checked against `erb:618-905`; all are intended (two different jobs on one event), as `PUZZLE_CHAINS_PLAN.md` §0 item 2 records:

1. `room_entered:battery_hall_2` (idx 2, 3): RFID-guide offer for players who never cloned, plus the reader bark. Intended.
2. `objective_task_completed:submit_ftp_intel_flag` (8, 9): methodology tick + distcc offer, plus the conditional sudo offer. Intended.
3. `submit_distcc_exploit_flag` (10, 24): sudo offer + methodology tick. Intended.
4. `submit_network_scan_flag` (11, 23): Zero Day bark + methodology tick. Intended.
5. `npc_ko:operative_relay` (15, 16, 17): two disjoint counter mappings (conditions on `operative_cipher_defeated`) + the card relay. Intended.
6. `npc_hostile_state_changed` (21, 22): race start + telegraph. Intended.

None needs a fix. If the warnings are to go quiet, the counter pair (5) can be declared in `mutuallyExclusiveGlobals`; the rest are "firing together is intended".

**Missing recommended fields:** `main_entrance/npcs[1]` and `[2]` (Netherton and Nightshade) have no behaviour. They are hidden co-speakers in the briefing (`erb:477-512`); benign.

### ✅ GOOD PRACTICE

Event-driven briefing with `skipIfGlobal`, `globalVarOnKO` on every person NPC, music system with state-driven playlists and conditional credits, hostile NPCs with tuned combat, and full `puzzle_graph_*` metadata.

### 💡 SUGGESTION

- **PIN and password locks:** not adopted, rightly. No in-world author has a reason for a code (`PUZZLE_CHAINS_PLAN.md` D6), and the cumulative-kit ruling rations the PIN cracker.
- **PC with readable files:** partly relevant. Three `pc` objects carry nothing but an observation line: Vance's BMS terminal (`erb:1050-1055`), the Network Monitoring Station (`erb:1202-1206`) and the Security Camera Monitors (`erb:1253-1257`). They read as props the player is invited to try and then gets nothing from. See fix 17.

## 2. Design review (Phase 2)

### 2a. Solvability trace — OK, with promise CONCERNS

**Critical path walked:** entrance (guard optional) → ops office: Vance; clone his EM4100 card with the m03 cloner (`m04_npc_robert_vance.ink:210`, `:251-265`, `erb:1026-1030`) or take the spare from the lockpicked locker (`erb:1279-1295`) or his KO drop (`erb:1033-1046`) → Hall 1 (unlocked): analogue thermometer sets `anomaly_detected` (`erb:1375-1378`) → Hall 2 on the Level 1 card (`erb:1446-1448`): Relay drops the Level 2 card on KO (`erb:1489-1498`), with HaX's relayed copy as a fallback (`erb:600-608`, `m04_phone_agent0x99.ink:188-197`) → workshop (`erb:1130-1132`): four flags at the drop-site, lockpick the OptiGrid case for the kit and job card (`erb:1207-1239`) → Hall 1 round panel: dust Vance's print (`erb:1425-1439`) → plant room reader (`erb:1541-1543`) → Voltage: fight, arrest (Static down) or button → ESD (`erb:1633-1662`), armed by three globals (`erb:862-880`) → `mission_complete` → debrief (`erb:966-976`).

- Every key is reachable before its lock. No circular dependency.
- **No soft-locks found.** The print surface is retryable until an excellent lift (`systems/biometrics.js:14`, `:24-28`), the reader explains a weak lift and points back at the surface (`fingerprint-reader-helpers.js:56-60`), and prints are now saved with the game (`systems/biometric-samples.js:118-125`), so the E1 "lost on reload" gap no longer applies.
- **Win condition** is `mission_complete` from the ESD's `completionActions` (`erb:1655-1660`). No NPC can block it: Voltage's KO, arrest and escape all set `voltage_neutralised` (`erb:825-842`).
- **VM flag wiring.** All four `submit_flags` tasks have `targetFlags`/`targetCount` (`erb:264-316`). `flagRewards` only emit events (`erb:1169-1190`), but nothing gates on `flag_*_submitted` globals, and `attack_mechanism_known` comes from `objective_aim_completed:map_the_attack` (`erb:847-852`). Clean.

**CONCERN: dialogue promises the scenario can't keep.**
- HaX's final-phase orders include "secure or destroy the remote trigger laptop" (`m04_phone_agent0x99.ink:514`). The laptop is a readable `pc` with no action (`erb:1663-1670`).
- "You can go stealth" (`m04_opening_briefing.ink:177`), the briefing choice "I'll avoid combat where possible. Smarter to stay undetected." (`:187`) and HaX's "Stealth takedowns when possible" (`m04_phone_agent0x99.ink:695`). There is no stealth or takedown system in the engine (no matches for stealth or takedown under `public/break_escape/js/`), the operatives never detect anyone, and Relay must be KO'd for the workshop card.
- "Physical devices on the rack banks, malicious SCADA script, and their command laptop" (`m04_phone_agent0x99.ink:427`) and "Disable all attack vectors" (`:602`) are left over from the multi-vector design. Since pass 2 the single ESD is the answer.
- Nightshade's only line promises a follow-up that never comes: "Get me eyes on the PLCs and I'll tell you how much time we actually have" (`m04_opening_briefing.ink:30`). There are no PLCs in the mission and Nightshade never speaks again.

### 2b. Clue distribution — OK, minor CONCERNS

- Clues are spread across six rooms. Infiltration evidence has four sources in three rooms (`erb:881-904`, `:780-786`). Whose print and where come from the job card in the workshop (`erb:1233`), the security-office export (`erb:1268-1277`) and Vance's ally hub (`m04_npc_robert_vance.ink:382-389`).
- **Navigation-only item:** the Facility Layout Map (`erb:1068-1074`) lists the room names and nothing else. The skill says remove such items. It would be better put to work (fix 15).
- **Redundant readables:** the ESD instruction appears five times: the SCADA ESD procedure (`erb:1117-1123`), the locker's Incident Response Guide (`erb:1301`), the Hall 2 BMS cabinet (`erb:1524`), the Hall 2 Emergency Procedures (`erb:1532`) and the laptop (`erb:1668`). Two would do.
- Flavour-only readables (fine as set dressing): the visitor log, security desk procedures, budget memo (it does back up Vance's "replace those readers" line), parameter-change log, process diagram, rack manifest (carries the night-crew stake), dock schedule.

### 2c. Educational coverage — OK, one CONCERN

| Mechanism | Where | Teaches | Clarity |
|---|---|---|---|
| RFID clone (EM4100) | Vance's lanyard → Hall 2 | Legacy prox cards broadcast a fixed ID that copies in a second | Good. Narrator line "Old prox. It didn't even have to work for it." (`m04_npc_robert_vance.ink:261`); Vance's "replace those readers" on the ally path (`:279`). The RFID guide handover line is wrong for this card (see below) |
| Telemetry vs analogue instrument | SCADA HMI 28°C vs dial 61°C | OT telemetry can be spoofed upstream; verify out of band | **Strongest beat in the mission.** The HMI observation tells the player what to look for (`erb:1103`); the rack panel says the dial "is not on the bus" (`erb:1388`) |
| Hydrogen panel | Hall 1 | Independent safety sensors that aren't on SCADA | Good (`erb:1404`) |
| VM: scan, FTP backdoor, distcc, sudo | Workshop | Recon, attack surface, legacy services, privilege escalation | Good; a guide for each step |
| Lockpicking | locker, tool case, go-bag | Physical security | By design (m01 tool) |
| **Biometric (new)** | Hall 1 panel → plant reader | Latent prints can be lifted and replayed; a print is not a secret | **CONCERN:** the minigame teaches the forensic method well, and the reader overlay carries the CCC Touch ID line (`fingerprint-reader-minigame.js:108`, `fingerprint-reader-helpers.js:9-11`). But no character ever says the security takeaway: a fingerprint is an identifier you leave on every surface, and a reader that accepts it alone is single-factor with no liveness check. Fixes 4 and 5 |
| Hardwired ESD | Plant room | Safety-instrumented systems independent of the control network | Good, though the "NOT ARMED" gate undercuts it (§3.6, fix 3) |
| Base64 card | Go-bag | Encoding is not encryption | Optional; CyberChef guide offered |

The lock mix suits the brief (an OT attack carried out by physical access). **Inaccuracy:** HaX's RFID guide handover says "Read the card, crack the keys, emulate it at the reader" (`m04_phone_agent0x99.ink:126`). Vance's card is EM4100 (`erb:1028`), which has no keys to crack. The offer line correctly calls it "the old prox kind" (`erb:629`).

### 2c′. Field guides — OK

- Seven guides in `itemsHeld` (`erb:543-599`). Each is exposure-gated by a mapping:
  - RFID: clone close (`erb:624-630`), or first Hall 2 entry (`:639-645`);
  - lockpicking: security office entry (`:668-673`);
  - recon and vulnerability analysis: workshop entry (`:674-679`);
  - distcc and sudo: flags (`:680-703`);
  - CyberChef: safehouse card (`:710-716`).
- Each is handed over on request from `support_hub` (`m04_phone_agent0x99.ink:87-106`), and every `_offered`/`_hint_given` global is declared (`erb:1908-1921`).
- All seven `labUrl`s exist in `HacktivityLabSheets/_labs/safetynet/` (checked by filename).
- **Gaps:**
  - No fingerprint/biometrics guide. This is A4 in the plan, needs HacktivityLabSheets, and goes to the backlog.
  - Flag 2 is the ProFTPD backdoor, and HaX names it as the St Catherine's build (`erb:708`), but `proftpd-exploitation-workflow.md` exists and isn't offered. A player who skipped m02 has no guide for it (fix 20).

### 2d. Narrative structure — OK, one CONCERN

- **Opening:** `timedConversation` with `skipIfGlobal`/`setGlobalOnStart: briefing_played` (`erb:469-475`). The briefing covers role, cover, target, stakes, the ESD and the kit (`m04_opening_briefing.ink:264-279`). Its hub makes the stakes beat unskippable (`:83-104`). Good.
- **Closing:** hidden `agent_0x99_debrief` opens on `mission_complete` with `disableClose` (`erb:966-976`), then the credits branch on outcome (`erb:133-165`). Clear win condition.
- **Spot-checked mappings:** the work-order bark that points at the thermometer (`erb:886-892`), the Relay KO card relay (`:754-759`), and the map-the-attack bark (`:847-852`) all fire on the right events.
- **CONCERN: the mission's turn is silent.** Reading 61°C sets `anomaly_detected` (`erb:1376`). That switches the music to `threat` (`erb:103-107`) and unlocks two aims at once (`erb:208`, `:335`). No NPC says a word. The only HaX mappings on `anomaly_detected` are the silent ESD-authorisation check (`erb:869-874`). The music comment still says "the clock starts" (`erb:103`), but since M2 the timers start on `attack_mechanism_known` (`erb:1802`, `:1830`). Fix 1.

### 2d′. Ink conventions — OK

- Narration uses `Narrator:` with the top-level narrator voice (`erb:169-177`).
- No ink combat: every fight is `#hostile` + `#exit_conversation` (Cipher, Relay, Static, Voltage).
- Choices are first-person speech, with non-verbal ones bracketed ("(Lean in over the site map…)", "[Say nothing.]"). No `You:` echoes found.
- Leave to the dialogue stage: the narrator calls the handler "Agent 0x99" (`m04_opening_briefing.ink:26`) where m03 says "Agent HaX" (`m03_opening_briefing.ink:24`), and several menu-flavoured HaX hub choices ("Intel update?", "Thanks").

### 2d″. Patrol guards — N/A as a stealth obstacle, CONCERN on detection

Relay patrols Hall 2 on in-bounds waypoints (`erb:1476-1485`; x 5–15, y 7 on the 20×10 battery-hall map). She has no `los`, so she is not a stealth obstacle, and the brief doesn't say she should be. The CONCERN is that **no operative ever notices the player.** `behavior.hostile` without `startHostile` leaves an NPC friendly (`npc-behavior.js:341`). None of Cipher, Relay, Static or Voltage has `los` or an `eventMapping`. The engine's only LOS event is `lockpick_used_in_view` (`unlock-system.js:205`). So Cipher, who "holds Battery Hall 1. Nobody reaches the workshop" (`erb:1347`), watches the player walk past him into the workshop. See §3.5 and fix 6.

### 2e. Dungeon graph metadata — CONCERN

- The core chain is well represented: cloner → Hall 2; Relay → Level 2 → workshop; tool case → kit → plant door; round panel → plant door.
- **The climax is unwired.** `lock_esd_pushbutton` has no inbound edges. The thermometer (the `confirm_the_lie` key), the four flag nodes and Voltage (no node at all) don't connect to the ESD or to `stop_the_runaway`. So the graph doesn't show the three-way convergence that actually gates the ending (`erb:862-880`).
- **Duplicate nodes:** the tool case and the go-bag each appear twice (`lock_optigrid_tool_case` + `optigrid_tool_case`, `lock_extraction_gobag` + `abandoned_extraction_go_bag`), because they carry `puzzle_graph_role: "lock"` as containers that are also locked (`erb:1218`, `:1726`).
- Locked rooms have no edge from the room the player stands in (e.g. Hall 1 → workshop door). That is generator behaviour (it skips locked sources), not a scenario fault.

### 2f. Room layout and dead ends — OK

- No overlaps; door alignment 8/8. Every room has a job. The loading dock is an optional leaf (go-bag, escape plan, Voltage's exit). That fits.
- **Backtracking:** Hall 1 is crossed four times on the critical path (to Hall 2, back to the workshop, out for the print, back to Hall 2). Each crossing has a reason (plan §2). Acceptable.
- **Room types:** the plant room and the workshop both use `room_it` (`erb:1128`, `:1539`). A server-room look for an HV inverter/plant room is a mild mismatch; see the backlog.

### 2g. Objectives scaffolding — CONCERNS

| Aim | Required tasks | With in-world pointer | Dead-zone risk | Bark at transition |
|---|---|---|---|---|
| get_inside | 2 | 2 (guard, briefing) | none | n/a (start) |
| confirm_the_lie | 2 | 2 (Vance; work-order bark; HMI observation) | low | **none** when it completes (the 61°C turn) |
| reach_the_workshop | 2 | 1 (Hall 1 bark says Vance has no Level 2 card, not who has one) | low | Relay KO phone chat |
| map_the_attack | 4 flags | 4 (workshop bark) | none | map-the-attack bark (`erb:851`) |
| take_back_the_plant | 2 (+1 optional) | 1. The reader is barked, but **the tool case holding the kit has no pointer** | **medium–high** if the VM is done first (the clock is running) | kit and print barks |
| stop_the_runaway | 2 | 2 | none | ESD-armed bark (`erb:867`), debrief |

1. **`enter_facility` ticks itself.** It's `enter_room` on the start room (`erb:188-192`). The player spawns there, so it completes at once: through the spawn's `room_entered` (`core/rooms.js:2965-2970`) or the reconcile path (`objectives-manager.js:248-252`). "Get past the entrance checkpoint" is done before the guard says a word. Fix 10.
2. **Silent transition** out of `confirm_the_lie` (§2d). Fix 1.
3. **The aim spoils the encounter.** `take_back_the_plant` unlocks with `confirm_the_lie` (`erb:335`), so its description, "behind a reader that only takes the duty engineer's print", and the task "Get past the plant-room fingerprint reader" (`erb:333`, `:347`) appear in Hall 1, before the player has seen the reader. That undoes pass 3's "meet the reader cold" rule (plan §9, m03 rule). Fix 11.
4. **The tool case has no pointer.**
   - The workshop bark covers only the VM (`erb:678`). The case's own text is "Padlocked." (`erb:1217`).
   - The reader gives "You haven't lifted any prints yet" when the player has no lift (`fingerprint-reader-helpers.js:19-20`, `fingerprint-reader-minigame.js:327-333`). It no longer prints the `requires` string that plan §3 relied on.
   - HaX's navigation help says "You need a kit… The crew got through it somehow" (`m04_phone_agent0x99.ink:680`), and only if asked.
   - A player who does the four flags first starts the 6-minute advisory clock (`erb:1802-1803`), walks to the plant door, and is refused with no direction. Fix 2.
5. **Stale forward pointers.** The map-the-attack bark says "get to an ESD button" (`erb:851`; the mission has one) and "The trigger is in the plant room. Get there", even when Voltage is already dealt with. The H₂ advisory hint says "the man holding the trigger is standing next to it" (`erb:1820`), which is also stale in that case. Fix 13.

### 2h. NPC knockout resilience — OK; two narrative gaps

| Person NPC | Gates a required task or item? | `taskOnKO` (or N/A) | KO in debrief/credits? | Verdict |
|---|---|---|---|---|
| security_guard | No | N/A | **No.** `security_guard_ko` (`erb:528`) is read nowhere | Should fix (minor): one debrief line |
| robert_vance | `meet_robert_vance`; his Level 1 card | Yes (`erb:1025`); card drops (`erb:1033-1046`) and the `item_picked_up` mapping sets `vance_provided_keycard` (`erb:766-771`) | Yes, in the debrief (`m04_closing_debrief.ink:85-87`, `:400-407`). No credit line | OK |
| operative_cipher | No (optional) | Yes (`erb:1340`) | Indirectly (counter) | OK |
| operative_relay | `neutralize_operative_relay`; the only Level 2 card | Yes (`erb:1488`) + HaX relayed copy (`erb:754-759`) | Indirectly | OK |
| operative_static | No; gates the arrest choice | N/A | No (the counter ignores Static) | Minor (fix 14) |
| voltage | `confront_voltage`; ESD condition | Yes (`erb:1576`) + `npc_ko:voltage` sets captured and neutralised (`erb:825-830`) | Yes ("VOLTAGE: CAPTURED") | OK |

Hidden NPCs (briefing HaX, Netherton, Nightshade, debrief HaX) are N/A.

**No must-fix.** Narrative gaps:
- The guard's KO is never acknowledged.
- `operatives_defeated` is written only by the Cipher/Relay mappings (`erb:727-750`), so it never exceeds 2. The debrief's "You neutralised all their operatives" (`m04_closing_debrief.ink:424-426`) can never play, and Static's KO is invisible to it. Fix 14.

## 3. Beyond the checklist

### 3.1 Pacing and dead time

| Act | Beats | Read |
|---|---|---|
| 1, no clock | Briefing (long, but the hub lets the player choose depth); guard; Vance and the clone; evidence in ops and security; the 61°C reveal in Hall 1 | Good build. The reveal is the best moment and gets music but no words (fix 1) |
| 2, no clock | Hall 2: Relay (forced fight) and the reader wall; workshop: VM (four flags) and the tool case; Hall 1 panel: dusting | The VM is long real-world time outside the game. That's inherent, and the case in the same room gives the player a second job, but only if they notice it (fix 2) |
| 3, clock from the last flag | 6-minute visible advisory, 12-minute vent (`erb:1799-1844`); Hall 2 → reader → Static → Voltage's choice → ESD | Tight and readable when the print is already lifted. **Risk:** a VM-first player starts the clock and only then learns they need a kit they haven't found. That puts the hunt, the lockpick and the first-ever dusting under a countdown |

Smaller sources of dead time:
- The idle operatives (3.5).
- The pc props that answer with one line (fix 17).
- Voltage's confrontation, which is long and runs under the clock. It does tick on in the fiction (he's at the laptop), so that's acceptable.

### 3.2 Does the player always know what to do next?

| Junction | Pointer today | Gap |
|---|---|---|
| Start → Vance | Guard (`m04_npc_security_guard.ink:65`), briefing | none |
| Vance → evidence and thermometer | Work-order bark names the physical instrument (`erb:891`); HMI observation (`erb:1103`) | Only the work order triggers the bark. A player who reads the camera log or export first gets no instrument hint beyond the HMI text. Acceptable |
| Clone needed for Hall 2 | Clone choice in Vance's first menu and hub (`m04_npc_robert_vance.ink:210`, `:349-353`); the briefing names the cloner (`m04_opening_briefing.ink:279`) | fine |
| Thermometer → workshop card | Hall 1 bark: "Vance doesn't carry one" (`erb:634`) | Says who doesn't have it, not who does. Name Relay (fix 12) |
| Relay down → workshop | Phone chat with the relayed card (`m04_phone_agent0x99.ink:188-197`) | none |
| Workshop → VM | Full bark (`erb:678`) | none |
| Workshop → **kit** | nothing | **Gap** (fix 2) |
| Kit → print | Kit bark (`erb:657`), job card (`erb:1233`) | none |
| Print → reader → Voltage → ESD | Print bark (`erb:666`); ESD variants name the missing condition (`erb:1647-1651`) | Good. The variants are a model for other missions |

### 3.3 The fingerprint minigame: how m04 introduces and uses it

**The introduction follows the m03 rule (meet the wall, then find the tool) and mostly lands.**
1. **Seed (optional).** Before the kit, the round panel says once: "There are prints on this. A fingerprint kit could lift them." (`interactions.js:1244-1247`).
2. **Wall.** Entering Hall 2 gives HaX's "That plant-room door is biometric. Picks and cloner won't touch it" (`erb:651`). The reader alert says "You haven't lifted any prints yet" (`fingerprint-reader-minigame.js:335-341`).
3. **Tool.** The crew's own kit, in their padlocked case, next to their job card naming Vance and the panel (`erb:1219-1237`). "Somebody got through it on the ninth" pays off here, and the case explains how ENTROPY got in. That is good fiction.
4. **Use.** The panel is a `pc`, so the surface is `glossy_dark` and the right powder is silver (`dusting-model.js:107-127`, `:78-81`). Choosing powder by contrast is a real teaching beat. `fingerprintDifficulty: "easy"` (`erb:1434`) gives:
   - the find-smudge always visible;
   - no partial prints;
   - 40% coverage to lift;
   - two reference cards (`dusting-model.js:102`).

   The minigame cannot fail (`dusting-game.js:4-7`), offers a hint after 15 s (`:36`, `:1272-1279`), and teaches one forensic fact per step (`:45-53`).
5. **Payoff.** The reader has no threshold set, so the default 40% applies (`biometric-lock.js:10`). The overlay states the percentage read against the percentage needed and carries the CCC Touch ID fact (`fingerprint-reader-helpers.js:9-11`, `:54-55`).

This meets the user rule: fun, educational, not hard. The user rates this minigame above the old one (`docs/IDEAS_BACKLOG.md:9`).

**Where the mission under-uses or undercuts it:**
- **The security lesson is never said** (2c). The minigame teaches forensics. The mission should teach the security point: a print is an identifier, left on every surface the person touches, so a reader that takes a print alone is one factor with no liveness check. One line on the print bark and one in the debrief would do it (fixes 4, 5).
- **Identification has no consequence.**
  - The reader matches on the sample's owner whether or not it was identified (`biometric-lock.js:46-64`). "Log as unidentified" opens the door just as well.
  - The reference cards are labelled with names (`dusting-game.js:507-512`, `:703`), so a player told "it's Vance's print" can pick the card by its label.
  - For a first use that is fine, and it keeps the minigame easy. But the compare step, the most educational step, never matters. An optional second print with a story payoff would give it a job (fix 21). Hidden labels are a backlog item.
- **Reference-card fiction.**
  - `fingerprintCandidates` includes Static (`erb:1433`), whom the player first meets behind the very reader they are trying to open. With easy difficulty only one decoy is drawn (`dusting-game.js:665-707`), so Static's card can turn up.
  - Nothing explains why the player holds reference prints of the site's staff and the cell.
  - One clause on the kit ("…and their reference cards for the site") and dropping Static fix both (fix 18).
- **The clock can land on the first dusting.** If the kit is found after the last flag, the first-ever dusting runs under the visible 6-minute advisory. The kit bark should nudge the player to lift the print now (fix 19).
- **One use only.** That is right for an introduction, and m05 carries the kit on (`m05_insider_trading_opening.ink:206`). m05's planner should make the second use a step up: medium difficulty, an identification that matters.

### 3.4 How clearly each puzzle teaches its idea

- **Clone:** clear and quick. The ally path adds Vance's "We were meant to replace those readers this year" (`m04_npc_robert_vance.ink:279`), which links the hack to the budget memo (`erb:1080`). The cover path gets only the narrator. The RFID guide's "crack the keys" line mis-teaches EM4100 (fix 13).
- **Telemetry lie:** excellent. Three readouts in one hall disagree with the HMI, and the hydrogen panel says outright it isn't on SCADA. This is the lesson the mission is built on, and it deserves a spoken beat (fix 1).
- **VM chain:** well guided, and the flag task titles describe what each flag proves.
- **Hardwired ESD:** the lesson (keep a safety path off the network) is stated three times. Then the button's own gate contradicts it (3.6).

### 3.5 Fun

- **Strong:**
  - the clone at Vance's desk;
  - the 61°C reveal;
  - the job card ("His thumb's on the Hall 1 round panel every 2 hrs");
  - Voltage's three-way choice. Arrest is earned by taking Static down first, a fight starts a 25-second race, and the button lets him walk. Every branch costs something, and the ESD tells you which condition is missing.
- **Weak: the operatives don't act.**
  - No operative is hostile at start, none has line of sight, and none has a mapping (`npc-behavior.js:341`; `erb:1322-1351`, `:1458-1508`, `:1599-1629`). They stand or patrol until the player speaks to them or hits them.
  - Cipher's note says "Nobody reaches the workshop" (`erb:1347`), yet he never stops the player.
  - Relay patrols past the player without reacting.
  - A Relay ambush on entering Hall 2 is mission-local (fix 6). A generic "player spotted" LOS event is engine work (backlog).
- **Weak: words never change an operative encounter.** Every Cipher, Relay and Static branch ends in `#hostile`, including Cipher's doubt branch about the night crew. The briefing's "night crew" line sets that branch up (`m04_opening_briefing.ink:140`). The pass-4 dialogue goal is choices that matter. Cipher is optional, so letting him walk if the player names the night crew costs nothing structurally (fix 7).
- **Mandatory combat on the critical path.** The workshop card exists only on Relay (`erb:1489-1498`) and her HaX copy is KO-gated (`erb:754-759`), so every player must win a fight (chase 120, damage 15). Plan §0 notes the fights were only ever playtested with `debugKO`. A human-difficulty check of the Relay fight belongs in the next playtest. If it's hard, lower her damage before anything else.

### 3.6 Stakes and the story's payoff

- **The stakes are concrete and owned by the villain.**
  - Voltage states the count himself (`m04_npc_voltage.ink:184-188`).
  - The Hall 2 manifest puts nine people behind the inverter wall (`erb:1516`).
  - The blueprints carry Blackout's sign-off (`erb:1676`).
  - The COSTLY SUCCESS credits name what was lost (`erb:142`, `:148-150`).

  The night crew is never seen or heard, so the cost of a vent is abstract. A text from the crew foreman when the advisory fires would make it land (mission-local, optional; part of fix 1's beat list).
- **CONCERN: the ESD contradicts the mission's thesis.**
  - The briefing, Vance and three notes insist the hardwired button is "the one control they couldn't take… Press it and the banks isolate" (`m04_opening_briefing.ink:273`; `erb:1121`; `m04_phone_robert_vance.ink:156`).
  - Pressed early, it answers "NOT ARMED. The interlock holds the button until three conditions are met…" (`erb:1646-1651`). One of the three is finishing the VM work.
  - A player who reaches the button after the vent, with Bank B burning, is refused by a physical safety device because they haven't submitted a flag. The logic is right, since the flags are the ending gate (`erb:372-379`). The fiction is wrong.
  - Recast it as a **grid-control permissive**. Dropping 200 MWh of export without the system operator warned trips the region; grid control will only stand by on proof of the hazard (the dial) and of the attack (the flags); and the trigger holder still fires first. The ESD procedure already has "Switch export to standby / Notify grid control" (`erb:1121`). This is a text-only change (fix 3).

### 3.7 Does the debrief reflect what the player did?

| Reflected | Not reflected |
|---|---|
| Outcome: clean, 12-minute vent, or race lost (`m04_closing_debrief.ink:57-76`, `:222-233`) | **What the player learnt.** m01's debrief reviews the evidence found and the security failures the player identified (`m01_closing_debrief.ink:149-175`, `:520-545`). m04 has no equivalent: prox cards, single-factor biometrics, a SCADA that trusts its own sensors (fix 5) |
| Voltage captured or escaped | Whether Cipher was fought, spared or ignored; Static |
| Vance's trust and KO (`:78-87`, `:264-368`) | The guard's KO (`security_guard_ko`, never read) |
| Lore: directive, coordination, safehouse (`:115-137`) | A cover-path Vance appears in the disclosure scene with no beat for learning who the player really is |
| Disclosure choice → credits (`erb:157-159`) | "Voltage escaped?" (`:92`) is asked as a question just after the player has told HaX |
| Kit kept for m05 (`:139`) | "neutralised all their operatives" (`:424`) can never play (2h) |

**Vance's arc is locked by the first minute.** A cover-path Vance can never become an ally. The reveal is reachable only from the first meeting (`m04_npc_robert_vance.ink:396-407`), and `vance_hub` has no reveal choice (`:342-380`). A player who keeps cover, as HaX advises ("Maintain the cover until you have hard evidence. Then bring him in fully if needed.", `m04_phone_agent0x99.ink:262`), then finds that evidence in Vance's own email and the 61°C dial, has no way to act on HaX's advice. That shuts them out of:
- the ally hub (`m04_npc_robert_vance.ink:356-358`, the print-location line);
- the phone support;
- the "ROBERT VANCE: vindicated" credit (`erb:155`).

Fix 9.

### 3.8 Continuity

- **Kit:**
  - The start kit is phone, picks, cloner and cover badge (`erb:401-432`). That matches the cumulative rule.
  - The briefing's "No PIN cracker this time. We've got one, it's ENTROPY's" (`m04_opening_briefing.ink:279`) agrees with m03 ("Nightshade's still got the one from St. Catherine's", `m03_opening_briefing.ink:177`).
  - "The cloner from the WhiteHat job" matches m03's front company (`m03_opening_briefing.ink:51`).
  - The debrief hands over the kit (`m04_closing_debrief.ink:139`) and m05 picks it up ("the print kit you brought back from Albion", `m05_insider_trading_opening.ink:206`). Clean.
- **Story threads in:**
  - The m03 directive "Zero Day supplies, Critical Mass executes… grid storage, this winter" (`m04_opening_briefing.ink:245`; `m04_closing_debrief.ink:121`) matches m03's debrief (`m03_closing_debrief.ink:182`).
  - The St Catherine's ProFTPD callback (`erb:708`) matches m02.
- **Recurring characters:**
  - Netherton and Nightshade are seeded as trusted colleagues with no hint of m08 (`erb:477-512`).
  - Nightshade's single line sets up a payoff that never comes (2a). Giving him the 61°C read in fix 1 pays it off and keeps him present before m08.
- **Threads out, CONCERN (needs approval: other missions).** m04 makes four forward promises:
  - "Task Force Null… You're being assigned… briefing is tomorrow at 0600" (`m04_closing_debrief.ink:186-218`);
  - "Voltage's interrogation has already begun" (`:124`);
  - the Calder Wharf safehouse ("A team's on it", `:136`);
  - "Loom" (`erb:1622`, `:1733`).

  None appears in m05–m08 ink (grep for `task force null`, `voltage`, `calder`, `loom` in `scenarios/m0[5-8]*/ink/`: no hits). Social Fabric does recur (m06, m07). The season plan intends Task Force Null from m04 (`planning_notes/overall_story_plan/season_1_arc.md:438`). Either m05 picks up Task Force Null and Voltage in a line or two (its audio isn't generated yet), or m04's debrief should promise less. Fix 22.

## 4. Proposed fixes

No blockers. Tags: **[local]** = m04's own erb, ink and docs (approved if it keeps the mission solvable and validator-clean); **[approval]** = outside m04. Quoted lines are drafts for the dialogue stage to polish. After any ink change: recompile, run inkcheck/loopcheck, `reopencheck.mjs`, the validator and the door check (`PASS4_BRIEF.md:34`).

**Major**

1. **major · [local] Give the 61°C turn a voice, and pay off Nightshade.**
   - Add a HaX mapping: `global_variable_changed:anomaly_detected`, `value === true`, `onceOnly`, delay ~2000. Draft: "Nightshade's had your 61. He says those cells are past safe and won't stay put, trigger or no trigger. Their screens are lying because they have to. Find out how they're driving it: the workshop, off Hall 1."
   - Rewrite Nightshade's briefing line (`m04_opening_briefing.ink:30`) so it sets this up: "Get me a real reading off that floor and I'll tell you how much time we actually have." This also drops "PLCs", which the mission doesn't have.
   - Fix the stale music comment ("the clock starts", `erb:103`).
   - Optional: when the advisory fires, a text from the Hall 2 night-crew foreman, so the people at risk are heard once.

2. **major · [local] Point at the OptiGrid tool case.**
   - (a) Append to the workshop bark (`erb:678`): "And that OptiGrid case under the bench is theirs. Open it."
   - (b) New HaX mapping on `door_unlock_failed:plant_room`, `onceOnly`, condition `globalVars.fingerprint_kit_found !== true`. Draft: "Their crew got through that door on the ninth, and whatever they used came in with them. Check what they left in the workshop."
   - The event is emitted with the connected room (`unlock-system.js:124-131`). Confirm in the playtest that a refusal from the Hall 2 side carries `connectedRoom: plant_room`.
   - (c) `navigation_help` (`m04_phone_agent0x99.ink:680`): "Their tool case in the workshop. That's where I'd start."

3. **major · [local] Make the ESD gate agree with "the one control they couldn't take".** Text only; the authorisation logic (`erb:862-880`) is unchanged.
   - Recast the three conditions as a grid-control permissive. Draft `unauthorizedText` (`erb:1646`): "NOT ARMED. GRID PERMISSIVE NOT RECEIVED. Shedding 200 MWh with nobody at grid control ready trips the region. They need the hazard confirmed off the BMS bus and the attack proven, and nobody in reach of a trigger that fires first."
   - Variants (`erb:1647-1651`):
     - "…Grid control won't drop supply on a screen that says everything is fine. Check the racks on an instrument that isn't on the bus.";
     - "…Grid control has the hazard, not the cause. The proof is on the workshop jump server.";
     - keep the trigger-holder line.
   - Add "ESD shed needs the grid-control permissive" to the ESD procedure note (`erb:1121`). Change the ESD-armed bark (`erb:867`) to "…Grid control's standing by. The ESD is live. Press it."
   - The briefing's "Press it and the banks isolate" stays true.

4. **major · [local] Say the biometric lesson at the moment it lands.**
   - Extend the print bark (`erb:666`): "That's Vance's print. The reader's in Hall 2. He leaves that on every panel he touches. A print tells a reader who you are. It can't tell it you're standing there."
   - Optionally, an ally-Vance line in the hub after the plant room opens: "One finger. No second check. We'll be fixing that."

5. **major · [local] Add a "what failed" beat to the debrief (m01 pattern).**
   - Add a short knot after `debrief_intelligence_gathered` (`m04_closing_debrief.ink:112`). HaX names the three weaknesses the player used: a prox card that copies from across a desk; a single-factor print reader on an HV door, fed by a panel he touched every two hours; a control room that trusted its own sensors.
   - Give the fixes in one line each: encrypted cards, a second factor and liveness on the HV door, an independent instrument per hall.
   - Branch the clone line on how the player got Hall 2 (clone vs locker vs KO drop). That needs one new global set by the `card_cloned` mapping (`erb:775-779`).
   - End on one player choice. About 5–7 spoken lines.

6. **major · [local, probe first] Make Relay notice the player.**
   - Add an `eventMapping` to `operative_relay`: `room_entered:battery_hall_2`, condition `globalVars.operative_relay_defeated !== true`, `onceOnly`, `conversationMode: "person-chat"`, `targetKnot: "start"`. A person-chat mapping fired by an event is proven for m03's guard (`m03_ghost_in_the_machine/scenario.json.erb:1172-1178`), but not on room entry into a lazily loaded room. Probe it first (AGENTS.md mission loop step 3).
   - Re-key HaX's two Hall 2 barks (`erb:639-652`) to `conversation_closed:operative_relay`, so they don't land mid-chat (lesson 20). Keep `room_entered` as a fallback gated on `operative_relay_defeated`.
   - Leave Cipher optional (fix 7).

7. **major · [local; dialogue stage] Let the player's words matter with Cipher.**
   - In `cipher_doubt` (`m04_npc_operative_cipher.ink:93-106`), "[There's a night crew in Hall 2. Go and look.]" makes him go and look:
     - `#set_global:cipher_walked:true`;
     - `#complete_task:neutralize_operative_cipher`;
     - `#exit_conversation`, no `#hostile`.
   - A Cipher mapping on `global_variable_changed:cipher_walked` sets `setVisible: false`, plus a `room_entered:battery_hall_1` re-hide for reloads (same pattern as Voltage, `erb:1586-1597`).
   - Add a credit line and one debrief line: "Cipher walked when you told him about the night crew. He's talking."
   - Declare the global. His intel note is lost on this branch, which is a fair trade.

8. **major · [local] Remove promises the game can't keep.**
   - `m04_opening_briefing.ink:177` → "You won't get past all of them quietly. Expect to fight at least one."
   - Choice `:187` → "[I'll pick my fights. No more than I have to.]"
   - `m04_phone_agent0x99.ink:695`: cut "Stealth takedowns when possible."
   - `:514` → "Two—keep him off that laptop."
   - `:427`: replace the three-vector line with the single mechanism (spoofed thermals, disabled interlocks, an armed overcharge).
   - `:602` "Disable all attack vectors." → "Get to the ESD."

9. **major · [local] Let a cover-path player bring Vance in later.**
   - Add to `vance_hub` (`m04_npc_robert_vance.ink:342-380`): `+ {not vance_is_ally and (anomaly_detected or evidence_maintenance_logs_found)} [I'm not an auditor. Your Hall 1 dial reads 61. Your screen says 28.]` → `vance_early_reveal`.
   - Declare the two globals as VARs.
   - The existing ally path then offers the clone if needed, sets `vance_met`, and the `conversation_closed:robert_vance` mapping opens his phone (`erb:934-940`). This makes HaX's advice ("bring him in fully once you have hard evidence", `m04_phone_agent0x99.ink:262`) playable, and makes the "vindicated" credit reachable on every path.

**Minor**

10. **minor · [local]** `enter_facility` (`erb:188-192`): set `targetRoom` to `operations_office` and the title to "Get past the checkpoint into the operations office", so the task ticks on an action the player takes.
11. **minor · [local]** `take_back_the_plant` (`erb:333`, `:347`): description → "The man holding the trigger is in the plant room, off Battery Hall 2."; task → "Get into the plant room". The reader then stays a surprise until Hall 2.
12. **minor · [local]** Hall 1 bark (`erb:634`): "The workshop wants a Level 2 card, and Vance doesn't carry one. Relay does. She's walking the inverter room."
13. **minor · [local]** Stale or inaccurate lines:
    - map-the-attack bark (`erb:851`): "an ESD button" → "the ESD". Add a variant mapping (condition `voltage_neutralised`) that drops "The trigger is in the plant room".
    - H₂ advisory hint (`erb:1820`): drop "and the man holding the trigger is standing next to it", or split the hint by condition.
    - RFID guide handover (`m04_phone_agent0x99.ink:126`) → "Old prox cards just shout their number. Read it, write it to a blank, show it to the reader." (EM4100 has no keys.)
    - Vance phone `urgency_assessment` (`m04_phone_robert_vance.ink:183-197`): stage 2 is never set (only 1, 3, 4: `erb:1781`, `:1806`, `:1834`, `:1928`); the stage-1 line "Stable, for now" contradicts the 61°C he has just been shown; stage 4 says "climbing toward runaway" after Bank B has gone. Branch on `anomaly_detected` and `racks_vented` instead.
    - Narrator "Agent 0x99" (`m04_opening_briefing.ink:26`) → "Agent HaX".
    - Vance's "I signed off on their access" (`m04_npc_robert_vance.ink:455`) contradicts his email and note ("I have no work order on file", `erb:75`; "No one told me about this work order", `erb:1197`) → "I let them in. Their cards worked and I didn't chase the order."
    - Cover badge "spot audit" (`erb:430`) vs "the regulator Albion is expecting today" (`m04_opening_briefing.ink:211`) → "an early audit".
    - Voltage's "in the corridor" (`m04_npc_voltage.ink:203`): there is no corridor.
14. **minor · [local]** Debrief counts and KOs:
    - Replace the `operatives_defeated` checks in `mission_complete` (`m04_closing_debrief.ink:424-429`) with the three `operative_*_defeated` globals (declare VARs), so Static counts.
    - Add a one-line branch for `security_guard_ko`.
    - "Voltage escaped?" (`:92`) → "And Voltage is out through the dock."
    - Optionally, a credit line for a Vance KO.
15. **minor · [local]** The Facility Layout Map is navigation-only (`erb:1068-1074`). Give it a job: add "Duty engineer's round: log at the Hall 1 panel every two hours (R. Vance)". This seeds the print surface on every path without naming fingerprints. Cut two of the five ESD instructions (the locker guide's step 1, `erb:1301`, and the BMS cabinet's last line, `erb:1524`).
16. **minor · [local]** Graph metadata (`dungeon_graph.md`):
    - wire the thermometer, the four flag tasks and Voltage (a `puzzle_graph_actions` entry) into the ESD, so the graph shows the three-way gate (`erb:862-880`);
    - drop the second node for the tool case and the go-bag (`erb:1218`, `:1726`);
    - regenerate and check that `lock_esd_pushbutton` has inputs.
17. **minor · [local]** Give the three empty `pc` props something to say in `observations`:
    - Vance's terminal echoes the HMI's 28°C;
    - the Network Monitoring Station shows traffic to 192.168.100.10 from a host that isn't Albion's (it ties to the VM);
    - the camera monitors show the 23:45–03:00 gap.

    Alternatively, retype them as non-interactive dressing.
18. **minor · [local]** Reference cards:
    - `fingerprintCandidates` (`erb:1433`) → `["Security Guard", "Cipher", "Relay"]` (drop Static; the player meets him only past the reader).
    - Append to the kit's observation (`erb:1224`): "Their reference cards for the site staff are still in the lid."
19. **minor · [local]** Kit bark (`erb:657`): add "Lift his print now, while nothing's counting down." This keeps the first dusting off the clock.
20. **minor · [local]** Offer the existing ProFTPD guide (`HacktivityLabSheets/_labs/safetynet/proftpd-exploitation-workflow.md`, permalink `/labs/safetynet/proftpd-exploitation-workflow/`) for flag 2.
    - Add an `itemsHeld` entry, a `proftpd_guide_offered`/`_hint_given` pair, and a hub choice.
    - Make the offer by extending the St Catherine's bark (`erb:708`).
21. **minor · [local, optional] Give identification a job.**
    - Make the BMS Interlock-Bypass Module in Hall 2 (`erb:1519-1526`) a second, optional print surface: `hasFingerprint`, `fingerprintOwner: "Voltage"`, candidates `["Relay", "Cipher", "Static"]`, `fingerprintDifficulty: "medium"`. Its text stays reachable through "Use normally" (`erb:1418-1421`). It is a `notes` object today, so first check that the print branch (`interactions.js:1231`) runs before the notes handler, or retype it as a panel.
    - A mapping on `fingerprint_identified:voltage` (emitted only on a new identification, `systems/biometrics.js:96-98`) sets `voltage_print_on_bypass`.
    - That global feeds a debrief and credit line ("EVIDENCE: Voltage's own print on the bypass module") and one beat in the arrest ("Tell that to a court" gains the print).
    - This rewards the compare step without gating anything.
22. **major · [approval: m05, other missions] Pick up m04's forward threads, or promise less.**
    - Task Force Null, Voltage's interrogation, the Calder Wharf safehouse and Loom are never mentioned again (§3.8).
    - Recommended: one or two lines in m05's opening briefing (its audio isn't generated yet) that pick up Task Force Null and Voltage.
    - If that's declined, soften m04's debrief (`m04_closing_debrief.ink:124`, `:136`, `:186-218`) so it doesn't promise a briefing "tomorrow at 0600" that never happens.
23. **minor · [local, verification]** In the next playtest, a human-difficulty check of the mandatory Relay fight and of the Voltage fight with Static up (plan §0 design note; walkthrough g5). If either is hard, lower `attackDamage` (`erb:1474`, `:1566`) before changing anything else.
24. **minor · [approval: SecGen]** Carried forward from plan §10 A5: the unanchored `proftpd_133c_backdoor` module path (`secgen/m04_critical_failure.xml:114`) and root via flag 2.

**Spoken-line estimate if 1–21 are taken:** about 25–35 new or changed ink lines, plus about 10 phone texts. Fixes 1–5 and 7–9 carry most of them. m04 audio is generated after this pass (`PASS4_BRIEF.md:38`).

## 5. Ideas for the backlog

For the orchestrator to file in `docs/IDEAS_BACKLOG.md`. None blocks m04.

- **Hide reference-card names until a match (dusting, shared minigame; S).** The compare step labels each card with a name (`dusting-game.js:507-512`, `:703`), so a player who knows whose print it should be can pick by label. Show "Card A / B / C" and reveal the name on a match, perhaps from medium difficulty up. Then the ridge comparison is the only way to the answer.
- **Fingerprint field guide (HacktivityLabSheets; M).** Plan A4. It would cover latent prints, powders, lifting, pattern classes, and why a print is an identifier rather than a secret (liveness detection, second factors). Offer it on `item_picked_up:fingerprint_kit`, the same way as the other guides.
- **A "player spotted" event from LOS (engine; M).** Today the only LOS event is `lockpick_used_in_view` (`unlock-system.js:205`). A generic `player_spotted:<npcId>`, fired when the player enters a visible cone, would let a mission open a challenge conversation or turn a guard hostile on sight. Then the operatives in m04, and guards in later missions, could act on their own.
- **Plant/inverter room art (art; M).** The plant room and the workshop use `room_it` (`erb:1128`, `:1539`). An HV plant room needs switchgear, inverter cabinets and cable trays, with the ESD mushroom head on a yellow housing as the focal point. Use PixelLab, one asset at a time.
- **Night crew presence (art/scenario; S–M).** Two or three non-interactive crew sprites behind the inverter wall in Hall 2, or a looping radio chatter ambient, would make the nine people at risk visible. Their absence after a vent could carry the cost.
- **Biometric reader parity across missions (engine; S).** The reader no longer says whose print it wants (`fingerprint-reader-helpers.js:19-20`). That's right for realism, but missions now have to name the owner in the world. Record this in `README_scenario_design.md` next to the other biometric constraints, so m05+ planners don't rely on plan §3's old behaviour.
- **ESD permissive as a reusable pattern (docs; S).** m04's `unauthorizedTextVariants`, which name the missing condition, are the clearest "why can't I?" feedback in the game. Write the pattern up (with fix 3's in-fiction permissive) in `README_scenario_design.md` for other `authVar` objects.
- **Scenario-timer HUD label (engine; S).** Carried from plan §0.1: `scenario-timer.js` `_tick` hides the box but never clears the label/clock text after a timer fires. Check whether it's ever visible; clear it on fire either way.
- **Debrief "what failed" template (docs; S).** m01's evidence and security-audit review (`m01_closing_debrief.ink:149-175`, `:520-545`) and m04's proposed fix 5 suggest a standard closing beat: name each weakness the player exploited and its fix. Add it to the debrief section of `README_scenario_design.md`.

## Changes made (pass 4 design)

Implemented 2026-10-02 by the pass-4 design implementer. Mission-local files only: `scenario.json.erb`, the m04 ink (+ compiled JSON), `TESTING_WALKTHROUGH.md`, this file, `PASS4_PLAYTEST.md`, the regenerated `dungeon_graph.*`, and the m04 entry of `scripts/ink_runtime_check/missions.json` (re-rendered from the erb so the checkers see the new globals). Nothing committed.

**Checks run (static; no browser playtest yet apart from the fix-6 probe):** all ten inks recompiled with `bin/inklecate`; validator clean (0 errors; eight benign onceOnly-pair warnings, listed in the walkthrough); door alignment 8/8; rendered JSON asserted for every new mapping, object and global; inkcheck + loopcheck clean on 48 state rows (incl. Vance KO, guard KO, Relay/Cipher/Static defeated, Cipher walked, cell alerted, Relay cloned, fight started, vented, vented by trigger, Voltage escaped/captured); `reopencheck.mjs … m04` 0 problems; `tagdiff.mjs` 146 structural differences, all intended (summarised at the end).

| Fix | Status | What was done |
|---|---|---|
| 1 | Done | HaX text on `anomaly_detected` relays Nightshade's read of the 61°C (2 s). Nightshade's briefing line now asks for "a real reading off that floor" (the PLCs are gone; "The physics doesn't lie and neither do I" kept as the m08 seed). Music comment fixed. Optional foreman beat done as a HaX text on `hydrogen_alarm` (skipped if the ESD is already pressed). |
| 2 | Done | (a) workshop bark ends "And that OptiGrid case under the bench is theirs. Open it."; (b) `door_unlock_failed:plant_room` text, once, only without the kit; (c) `navigation_help` names the tool case. |
| 3 | Done | ESD refusal and its three variants recast as grid control's permissive; the ESD procedure note explains the permissive; the armed bark says "Grid control's standing by". Gate logic unchanged. |
| 4 | Done | The print bark carries the lesson ("A print tells a reader who you are. It can't tell it you're standing there."). Ally Vance adds "One finger, no second check. We'll be fixing that." Minigame untouched. |
| 5 | Done | New `debrief_what_failed` knot: three weaknesses, the fix for each, one choice. The card line branches on new `vance_card_cloned` (set by the clone mapping) and `relay_card_cloned`. |
| 6 | Done, after a probe | **Probe (game 1363, `tools/playtest/m04-pass4-probe-relay-session2.jsonl`):** clone at Vance, emulate at the Hall 2 reader, enter Hall 2 → Relay's person-chat opened by itself with her opening line. (The walk between rooms was by test teleport; the harness could not move the player on the loaded machine. The room load, door, mapping and chat were the real ones.) Built on it: Relay's `room_entered:battery_hall_2` person-chat; HaX's two Hall 2 texts re-keyed to `conversation_closed:operative_relay`, with a `room_entered` fallback gated on Relay being down. **Changed approach for "dangerous but fair":** the engine has no "player spotted" event (the only LOS event is `lockpick_used_in_view`, and mapping conditions can't read LOS), so the stealth promise is kept through the cloner instead: Relay's card is old prox, and "(Keep her talking…)" clones it mid-standoff (clone rule followed: task and `relay_card_cloned` come from `card_cloned`). She then turns hostile, but `aggroDistance` 128 means she gives up beyond four tiles and goes back to her walk, so the player can leave and later slip past to the plant door (129 px from her nearest waypoint) while she is at the far end. No fight is now mandatory anywhere in m04. Cipher's radio call (`cell_alerted`) makes Relay wait for you, and the blunt opening choice still goes straight to a fight. |
| 7 | Done | "There's a night crew in Hall 2. Go and look." → he walks (`cipher_walked`, his optional task completes, hidden by setVisible + reload re-hide). Credit and debrief lines. |
| 8 | Changed approach | Promises made true rather than removed (orchestrator: give a real stealth option). Briefing: "You don't have to fight all of them. Your cover and that cloner will get you past more than your fists will. If they make you, you're cleared to." Choice: "[I'll keep it quiet where I can. No more fights than I have to.]" HaX combat help: no "stealth takedowns"; points at Relay's card. Laptop, three-vector and "all attack vectors" lines replaced as proposed. |
| 9 | Done | `vance_hub` offers the reveal once `anomaly_detected` or the work-order evidence is in; it runs the existing ally path (clone offer, phone, credit). |
| 10 | Done | `enter_facility` targets `operations_office`, retitled. |
| 11 | Done | Aim description and task no longer mention the reader. |
| 12 | Done | Hall 1 bark names Relay. |
| 13 | Done | Map-the-attack bark split on `voltage_neutralised` ("the ESD"); H₂ hint drops the stale trigger-holder clause; RFID guide line fixed for EM4100; Vance phone urgency now branches on `racks_vented` / `hydrogen_alarm` / `anomaly_detected`; narrator says "Agent HaX"; Vance's "signed off" line; badge "early audit"; Voltage "on the way in". |
| 14 | Done | Debrief counts use the three `operative_*_defeated` globals (Static counts; a no-KO line rewards the quiet route); guard KO line; "And Voltage is out through the dock."; credit line for a Vance KO. |
| 15 | Done | Layout map gains the duty engineer's round; the locker guide's ESD step and the BMS cabinet's "Use the hardwired ESD" cut. |
| 16 | Done | Duplicate tool-case/go-bag nodes gone (dropped `puzzle_graph_role` on the two locked containers); `puzzle_graph_links` wire the thermometer, the four flags and a new Voltage action node into `lock_esd_pushbutton` (7 inputs, checked in `dungeon_graph.json`). |
| 17 | Done | Vance's terminal, the Network Monitoring Station and the camera monitors each say something useful. |
| 18 | Done | Candidates `["Security Guard", "Cipher", "Relay"]`; the kit's text mentions the reference cards; HaX's kit text says SAFETYNET added the cell's file prints (which explains the bypass-module cards). |
| 19 | Done | Kit text: "Lift his print now, while nothing's counting down." |
| 20 | Done | ProFTPD guide in HaX's `itemsHeld`, offered on the St Catherine's text, handed over from the hub; two globals declared. |
| 21 | Done, at easy | The bypass module is a print surface (owner Voltage). Kept at **easy**, not medium, per the "fun, not hard" rule; with names on the cards it rewards doing the compare step rather than testing it. A new identification sets `voltage_print_on_bypass` (HaX text, credit, debrief line, arrest choice wording). Nothing gates on it. |
| 22 | Done (m04 side) | Debrief softened: Task Force Null is "Netherton wants a standing team… Your name's on his list", with no 0600 briefing; Voltage "is in a room now", with no confession claimed; Calder Wharf "goes on the board". m05 not edited. |
| 23 | Not done (verification) | Needs a human-feel playtest of the Relay and Voltage fights; it's in `PASS4_PLAYTEST.md`. Relay's fight is no longer mandatory, which lowers the stakes of this check. |
| 24 | Not done (SecGen) | Out of scope; still open for the user. |

**Intended tagdiff differences** (146 in all): new VARs for the synced globals in seven inks; new knots `debrief_what_failed`, `debrief_big_picture` (the old choices moved into it unchanged), `cipher_walks`, `cipher_gone`, `relay_waiting`, `relay_standoff_choices` (her old choices moved here, plus the sticky clone choice), `relay_clone`, `relay_clone_debrief`, `relay_clone_caught`, `arrest_taken` (the old arrest body, moved so two choice wordings can share it), `request_proftpd_guide`; Cipher's night-crew choice now diverts to `cipher_walks` instead of `cipher_refuses`; two new conditional choices in `vance_hub` and one in HaX's `support_hub`; Vance phone urgency conditions now read state, not `urgency_stage`; the debrief's counter conditions replaced. No tag, knot or VAR was removed except the old `operatives_defeated` conditions in the debrief's final knot.

**For the user / engine (not done here):**
- Fix 24 (SecGen ProFTPD module path), carried forward.
- A generic "player spotted" LOS event would let operatives notice the player on sight; m04 works around it.
- Hiding reference-card names until a match is a dusting-minigame change; not done.
- `scripts/ink_runtime_check/missions.json` is shared tooling; only its m04 entry was refreshed.

### Round 2 (re-review round 1 and the pass-4 playtest)

Sources: `DESIGN_REREVIEW_1.md` (M1, M2, m1–m8) and `tools/playtest/m04-pass4-report.md` (issues 1–7). Checks rerun after the edits: all ten inks recompiled; validator clean (0 errors; 11 onceOnly-pair warnings on `agent_0x99`, all intended, listed in the walkthrough); door alignment 8/8; render asserts for every round-2 change; inkcheck + loopcheck clean on 59 state rows (the 48 above plus `relay_last_chance`, the rushed clone hit and miss, `on_anomaly_confirmed` before and after the workshop, and Voltage's count with one and three down); `reopencheck … m04` 0 problems (1800 reopens per phone ink, including the new call); dialoguelint has no errors left on lines this pass touched (the remaining length errors are pre-pass lines, handed to the dialogue stage). No browser run yet.

| Item | Status | What was done |
|---|---|---|
| M1 quiet route closed by the first reply | Done | Every route to the fight (`relay_alerts_team`, `relay_refuses`) now ends at `relay_last_chance`: a sticky "(Close the gap before she moves. The cloner's already reading.)" (a rushed clone, `relay_clone_close`; a missed read comes back here) or "Then we do this the hard way." The quiet route survives every first reply, including the radio call. The Hall 1 text seeds it: "Relay has, and it's old prox, like his." |
| M2 the 61°C turn is a toast | Done | The mapping now opens a phone conversation (`on_anomaly_confirmed`, then a choices-only knot, like `on_relay_ko_card`). HaX quotes Nightshade's read and the player gives one reply. The reply branches on `server_room_reached`, so a late reading in the aim cascade gets "Then the dial was the last piece." instead of a stale workshop pointer (this also covers playtest issue 3c). |
| m1 slip-past margin | Done, differently | Kept the waypoint, and set `aggroDistance` to 96 (see playtest 2). The reader is about 123–133 px from her west stop, well outside 96. The comment was corrected. |
| m2 she never comes after the clone | Done | When she turns hostile, a mapping on Relay sets her patrol speed to 70 (loop about 11 s), so she visibly sweeps the hall. HaX's text now says what happens: "Card's yours. She knows, and she'll walk that hall faster now. She won't chase far. Cross when she's at the far end." |
| m3 kit text with the clock running | Done | Split into two texts on `attack_mechanism_known`; the global stays on one unconditional mapping. |
| m4 "a hardwired ESD" | Done | Vance's timed text names the ESD in the plant room (and is trimmed to 27 words). |
| m5 debrief overclaims; no Relay credit | Done | "Three things let them in. Two of them let you in too." Cipher "went to look at the night crew and kept walking." New credit "RELAY: card copied mid-standoff". |
| m6 lesson said twice | Done | The print text now reads "…the reader in Hall 2 can't tell a lift from a living thumb." The debrief keeps "A print says who you are." |
| m7 length errors this pass added | Done | The texts and debrief line this pass added or lengthened are under the caps. The 87-word workshop text is split into two short texts (VM, then guides and the tool case). Voltage's arrest choice is 14 words. Pre-pass long lines are left for the dialogue stage: briefing L28, L30, L245, L273; Voltage L184; Vance phone L106, L107, L135, L158, L160; texts distcc, work order, Vance's first text. |
| m8 tagdiff count | Done | Recounted below. |
| P1 fights too costly | Done (damage only) | `attackDamage`: Cipher 12→4, Relay 15→5, Static 18→4, Voltage 22→12. The engine reads only `attackDamage` from the scenario: `parseConfig` drops `maxHP` and `attackCooldown` (`npc-behavior.js:340-348`, `npc-hostile.js:7-17`), and there is no heal item or regen (`playerHealth.heal` exists, but nothing in a scenario can call it). The bot's run (about 14 hits across the three) now costs about 60 HP; a slower player taking twice as many hits ends near zero, so a heal item is the right engine follow-up. Voltage stays harder because his fight is the climax race. |
| P2 Relay not leashed | Partly mission-local; engine item | The engine has no chase leash: `updateCurrentRoom` deliberately lets a chaser follow into the next room (`npc-behavior.js:625-658`), and the chase ends only past `aggroDistance`. Set `aggroDistance` 96 and `chaseSpeed` 100 (player 150), so backing off opens the gap in about 2 s (one hit at most). A real leash (stay in your own room) needs the engine. |
| P3 stale toasts | Done | Kit text split (m3); the work-order "go and check the racks" text only while `anomaly_detected` is false; the 61°C beat is now a state-aware call (M2). |
| P4 Voltage's count | Done | His opening line counts the three `operative_*_defeated` globals in ink ("You put three of my people down"). HaX's own counter lines only ever talk about the two halls, so they were left alone. |
| P5 advisory slack | Done | The advisory is now 8 min and the vent 14 (was 6 and 12); the 6-minute gap between them is kept. Run B ran out while fetching the kit, doing a first dusting and making a phone detour. Eight minutes still runs out if you dawdle. A player who lifts the print first, as the kit text says, keeps most of it. |
| P6 armed text only one way | Done | All three `esd_authorized` mappings carry the same text. The map-the-attack "Get back to the ESD" variant was removed, because the armed text now covers that case. |
| P7 Vance hub "None: " | Done | The cause was `#speaker:robert_vance` on choices-only knots. A choices-only knot always yields an empty line in inkjs, and here it carried the speaker tag. The tag was removed from `vance_hub`, `vance_provides_access_choices`, `vance_plant_reader_ally` and `vance_commits_choices`; their choice bodies already carry "Robert Vance:" prefixes. A browser look is needed to confirm. |

**Tagdiff after round 2: 204 differences**, all intended. Round 1's 146, plus the one the round-1 log missed: a condition (`not operative_relay_defeated and not relay_card_cloned`) added to HaX's `combat_help` after the count was taken. Round 2 adds:
- **Relay:** `relay_last_chance`, `relay_clone_close`, `relay_clone_missed`, the `clone_rushed` VAR. The `#hostile`/`#exit_conversation` tags moved from `relay_alerts_team` and `relay_refuses` into `relay_last_chance`.
- **HaX:** the `on_anomaly_confirmed` text and choices knots.
- **Voltage:** two VARs and a temp count that replace the `operatives_defeated` conditions.
- **Vance:** four `#speaker` tags removed.
- **Docs:** comment-only changes.

**Backlog (shared minigame, not changed):** on easy, the two reference cards can look near-identical; the kit text covers the reader overlay's hint and its high-contrast checkbox.

**For the engine log:** a heal item or regen (P1); a room leash for chasing NPCs (P2); `maxHP` and `attackCooldown` passed through from the scenario's `behavior.hostile` (they're read in `createHostileState` but dropped by `parseConfig`).
