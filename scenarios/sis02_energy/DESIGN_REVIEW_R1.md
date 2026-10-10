# sis02_energy: design review, round 1 (2026-10-09)

Reviewer: design reviewer R1 (read-only). Scope: `scenario.json.erb`, the four ink files, `information_pack.md`, `labsheet.md`, `mission.json`, against the working tree after merge 1cece907 (including the uncommitted Helen narrator intro). Kind of game: Security-Informed Safety serious game, education first.

## Verdict

**Revise.** There is one Must fix (MF1: the NIS notification can't be sent if the player skipped the historian, while Helen and Marcus tell them to send it), three majors (MJ1 Marcus signs off isolation on no evidence; MJ2 Tom knows the c.ellison login before anyone finds it; MJ3 the narrator intro contradicts the pack), and 17 minors. There are no blockers. The validator reports no INVALID items. Every CONSISTENCY_PLAN row is resolved, and the SIS audit-log story is consistent everywhere.

Mission-local: MF1, MJ1, MJ2, MJ3 (text), mn1–mn4, mn10, mn11, mn13 (ink route), mn15–mn17. Lab-sheet stage: mn5 and mn6. Need the user: the MJ3 art question, mn7–mn9 (published pack), mn12 (engine commit order), mn13 if it needs an engine change, and any republish to HacktivityLabSheets. Voiced lines touched by the fixes: the narrator intro (MJ3, not yet cached), Priya `npc_priya_s.ink:133` (mn2) and `:254` (mn16). Marcus and Tom are unvoiced.

## 1. Validator

Run as `ruby scripts/validate_scenario.rb scenarios/sis02_energy/scenario.json.erb --skip-ink --no-graph` (others are editing in parallel). Schema passed, no unknown fields, ERB renders. Room layout geometry OK and door alignment OK. `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/sis02_energy/` reported no findings.

**INVALID:** none.

**WARNING (6):**
- Four "onceOnly handlers can fire together" warnings on Helen (`historian_flatline_found` idx 3–5, `esd_activated` idx 7–11 and 14, `hydrogen_alarm` idx 12 and 26, `facility_safe_state` idx 16–20). I checked each one. In every case an `unlockAim` / `setGlobal` mapping is meant to fire alongside one radio line, and the radio lines are disjoint on `esd_activated`, `esd_pressed_inside_in_alarm`, `network_isolated`, `jump_server_confirmed` or the NIS state. These are intended, so no change is needed (finding mn11).
- `post_incident_debrief` has `missionConclusion` but no `conclusionScreen`. sis01 and sis03 are the same: the credits roll is the ending. No change.
- The evacuation cutscene (Helen eventMappings[13], `scenario.json.erb:734-742`) has no `background` (finding mn10).

**GOOD PRACTICE:** event-driven cutscene, `skipIfGlobal` on the opening, collection groups, music system, puzzle-graph metadata.

**SUGGESTION:** the VM, flag station, PIN, password, security tool and hostile NPC suggestions don't apply to an SIS game, so I've left them out. The six "credits section is all conditional" suggestions are false positives. The credits only roll after Priya's debrief, and Priya only appears after an ESD plus isolation or after the evacuation. On every route that reaches her, each section prints at least one line: the ESD line, the cable line, the jump-server line, the NIS line, both safety-case choices (forced in the debrief), and the "Nothing beyond the main path" fallback.

**Graph:** not regenerated (`--no-graph`). The committed `dungeon_graph.md` (1cece907) has 37/39 puzzle nodes/edges, 11/11 story, 1 AND gate. Its critical path is Understand → Walkdown → Historian → Call Marcus → Isolate → AND → Debrief.

## 2. Findings

"Local" means a mission-local change the orchestrator can make. "Approval" means the change touches the engine, a published sheet or pack, image generation, or anything that costs money. Every ink line marked "voiced" belongs to Helen, Priya or the narrator, and is not yet in the TTS cache on main.

### Must fix

**MF1. Helen and Marcus point to the NIS notification, but Marcus has no NIS option until the historian is found (S3/S6).** Local.
- Marcus's hub offers the notification only on `historian_flatline_found and not nis_notified` (`ink/npc_marcus_webb.ink:121`), and the NIS clock starts only on the same global (`scenario.json.erb:413`).
- The historian can be skipped, and Marcus's own lines encourage it. "No solid evidence yet" sends the player to the workshop key (`npc_marcus_webb.ink:87`), and the dial branch says "Get into the workshop and open the jump server log" (`:95`) before the historian. His session knot already allows for a player who skipped it (`:199-201`, "I've had a look at the historian from here").
- So a player can go dial → ESD → workshop → flag c.ellison → Tom isolates, and reach the safe state without the historian. Helen's radio then says "Now the NIS notification. The form's on the clipboard" (`scenario.json.erb:767`) or "Message Marcus and he'll sign it" (`:773`). Marcus says "Now the notification. Read the form and message me" (`:968`, and `npc_marcus_webb.ink:372-375`). Marcus's hub offers no way to do it, and nothing tells the player the historian is the missing key. The same happens after an evacuation with no historian: Marcus says "Now the notification" (`npc_marcus_webb.ink:352-353`).
- **Fix:**
  - Gate the hub option on any awareness of the incident, not just the historian: `{ (historian_flatline_found or jump_server_confirmed or sis_tamper_confirmed or facility_evacuated or network_isolated) and not nis_notified }`. Declare any newly read globals as VARs.
  - In `nis_send`, give the last branch a no-historian wording (e.g. "someone on our network, safety systems not yet checked, cause unknown") so it doesn't claim "since 23:12" when nobody has read the historian.
  - Optionally, start the clock on the first of those too: a new `incident_aware` global, set by Helen mappings on `historian_flatline_found` or `jump_server_confirmed`, as the timer's `startOnGlobal`.
  - Add a multi-call ink test: no historian, then each kind of evidence, then the NIS scene.
- Marcus is unvoiced, so this costs no TTS.

### Major

**MJ1. Marcus signs off the enterprise-to-SCADA isolation with no evidence at all.** Local, unvoiced.
- The hub choice "[Tom at CastleTech needs your sign-off to isolate.]" sets `network_isolation_authorised` unconditionally ("Signed off. Tell Tom to ring me", `npc_marcus_webb.ink:114-118`). Its only gate is `network_isolation_requested`, which Tom sets as soon as he's asked (`npc_tom_hadley.ink:118-120`).
- With an ESD press (never gated) that gives the safe state, then Priya and the credits, a few minutes in, with no dial, historian, jump server or SIS.
- An OT Security Manager at a designated OES wouldn't cut the enterprise side on "nothing solid yet" (his own first-call line, `:85-86`). Tom's call-back (TOM-2, lab sheet Q11) teaches that an authorisation means something, and a rubber stamp undercuts that.
- **Fix:** keep the option sticky (S1) and branch inside it:
  - with no evidence (`not anomaly_detected and not historian_flatline_found and not jump_server_confirmed and not facility_evacuated`), Marcus says "Isolate on what? Get me the dial or the historian first, then I'll sign it." and the global is not set;
  - otherwise he signs off as now.
- Priya's and the credits' "rang Marcus back" lines stay true.

**MJ2. Tom knows the c.ellison login before anyone has found it.** Local, unvoiced.
- `ot_scope` → "[What would OT monitoring have caught?]" is offered from the first message. It answers "A contractor who left over a year ago, logged in at quarter to two from a print server" (`npc_tom_hadley.ink:106-108`).
- Two lines earlier Tom says "I've never seen your jump server sessions" (`:101`). The pack agrees: no OT visibility (`information_pack.md:701`), and the jump server logs never reach the SOC (`:761`). The line also gives away the answer to the `identify_rdp_session` log puzzle.
- **Fix:** wrap the line in `{ jump_server_confirmed: … - else: Somebody on your jump server at an hour nobody works. We'd have rung you within the hour. }`.

**MJ3. The new narrator intro contradicts the pack, and the room the player walks into.** Text is local but voiced. The art needs approval.
- `npc_helen_marsh.ink:65`: "Rows of white containers holding two hundred megawatt-hours…". The pack has two battery halls inside a three-building site (`information_pack.md:681`), and the game's room is "Battery Hall 1", an indoor hall (`scenario.json.erb:1470-1475`).
- `:66`: "One car in the car park." The pack has the response team already on site before the 06:30 briefing (`:781`).
- `:66` also says "Your team is booked for the seven o'clock maintenance window on the grid PLC". Helen repeats it word for word two lines later (`:68`).
- The background `public/break_escape/assets/backgrounds/albion_energy.png` (untracked) does show rows of white containers and one car. The narration matches the picture, but neither matches the pack.
- The times fit: the narrator's "Saturday, half past six" and "already at her desk" agree with `scenario_brief` (`scenario.json.erb:44`: 06:30, Helen in at 06:15) and the pack (`:781-783`).
- **Fix (recommended, text only, before any TTS):**
  - `:65` → "Two battery halls holding two hundred megawatt-hours of lithium-ion cells, charging off the grid overnight while the county sleeps."
  - `:66` → "Helen Marsh's car has been here since quarter past six. The site's SCADA engineer is already at her desk." Cutting the maintenance-window clause leaves the booking to Helen.
- Then ask the user whether the exterior art should show hall buildings rather than containers (image work, approval). The alternative, rewriting the pack to containerised halls, touches every "Battery Hall" string and the published pack. I don't recommend it.

### Minor

- **mn1. Two credits lines can never print.** Local.
  - "CELLS SAFE, ATTACKER STILL CONNECTED" (`scenario.json.erb:500`) can't print. The credits need `debrief_complete`, and Priya (the only source) appears only when ESD and isolation are both done or after the evacuation (`:744-760`, `:912-916`).
  - "The dial at Rack A2 was never read" (`:509`) can't print either: on any route to Priya without the dial, `esd_before_dial` or `hydrogen_alarm` is true.
  - Delete both, or leave them as harmless.
- **mn2. "Rightly left alone" can print next to "went into Hall 1 during the gas alarm".** Local, voiced (Priya).
  - The credits line "Gas alarm before the dial was read: the hall was rightly left alone" (`:508`) can print with "Went into Hall 1 during the gas alarm" (`:517`).
  - Priya does the same: she says "Leaving it was right by then" (`npc_priya_s.ink:132-133`) after "Someone walked into Hall 1 in a gas alarm" (`:120-121`).
  - Add `&& !globalVars.entered_hall_in_gas_alarm` to the credits line, and `and not entered_hall_in_gas_alarm` to Priya's branch.
- **mn3. The alarm panel says "SCADA MANUAL MODE" whatever was isolated.** Local.
  - The NETWORK STATUS lamp shows "SCADA MANUAL MODE" whenever `network_isolated` is true (`scenario.json.erb:1243-1247`).
  - CastleTech's action only blocks enterprise traffic at the firewall (`npc_tom_hadley.ink:155`, pack `:789`). Only the 'scada' scope shuts SCADA down (`npc_marcus_webb.ink:227`).
  - Change `onStatus` to "ENTERPRISE CUT OFF".
- **mn4. The SIS panel shows a change record that the SIS doesn't keep.** Local.
  - The CHARGE_INHIBIT_TEMP row says "lastModified: At commissioning", "modifiedBy: Fosse Controls (commissioning)" (`scenario.json.erb:1947-1948`).
  - That implies the controller keeps a change record, which it doesn't (pack `:769`, `:846`). It also makes Fosse Controls (the 2024 smart-grid integrator, pack `:833`) the SIS's commissioner, when the SIS was certified at the facility's original commissioning (`:709`).
  - Use "No change seen (matches the SRS)" and "—".
- **mn5. The lab sheet says Priya arrives once Hall 1 is safe.** Lab-sheet stage (in the approved scope); republishing to HacktivityLabSheets needs approval.
  - `labsheet.md:106` says Priya arrives "once Hall 1 is safe, or once everyone is out of it". The game also needs CastleTech's isolation (`scenario.json.erb:744-760`).
  - Reword to "once Hall 1 is shut down and CastleTech have cut the attacker off, or once everyone is out of the hall". The pack's "once the hall is safe" (`:791`) could follow.
- **mn6. Lab sheet Q8 says any message to Marcus brings up the registers.** Lab-sheet stage.
  - `labsheet.md:164`: "If you messaged Marcus before pressing it, he asked for ten seconds…". He only raises the registers when you talk to him about shutting down (`npc_marcus_webb.ink:108-111`, `:167-173`).
  - Reword to "If you told Marcus you were shutting down…".
- **mn7. The pack puts HMI-ENG-02 in two different rooms.** Pack; republishing needs approval.
  - `information_pack.md:757` puts HMI-ENG-02 "in the control room", and `:685` says both HMI workstations are in the control room.
  - The game (`scenario.json.erb:1686-1705`) and pack `:787` put it in the engineering workshop. Fix `:757` (and `:685`).
- **mn8. The pack has two versions of the patch-period cover.** Pack.
  - `information_pack.md:804` (Decision 1) says the patch period needs "continuous human presence in the battery halls".
  - `:847`, CLAIM-EN-005 `:340` and Helen (`npc_helen_marsh.ink:276`) all say rounds every four hours. Align `:804`.
- **mn9. The pack's insider-scenario table uses different numbers.** Pack.
  - The Scenario 02 table uses 80°C and an HMI showing 26°C (`information_pack.md:1010-1011`), against 85°C and 28°C everywhere else.
  - It is the hypothetical insider variant, but a student cross-checking will trip on it. Label it as the hypothetical variant, or align the numbers.
- **mn10. The evacuation cutscene has no background (validator warning).** Local.
  - Add `"background": "assets/backgrounds/albion_energy.png"` to Helen eventMappings[13] (`scenario.json.erb:736-742`). The exterior suits an evacuation.
- **mn11. The four onceOnly-overlap warnings are intended.** Local, optional.
  - No behaviour change. A short ERB comment by each group, saying the co-firing is deliberate, would stop the next reviewer re-checking them.
- **mn12. The intro depends on an uncommitted engine change.** Approval (engine).
  - `Background[none]:` (`npc_helen_marsh.ink:67`) relies on the uncommitted engine change in `public/break_escape/js/minigames/person-chat/person-chat-portraits.js:618-625`.
  - Commit the engine change with or before sis02. Otherwise the line asks the portrait renderer to load an image called "none".
- **mn13. A "Not yet" alert may appear during Priya's closing.** Verify in the playtest; the engine route needs approval.
  - Priya completes `talk_to_priya_s` in `closing_summary` (`npc_priya_s.ink:372`), before `debrief_complete` is set (`:398`).
  - The server returns "Complete required objectives first" when `concludeRequires` isn't met (`app/models/break_escape/game.rb:1223`), and the client turns that into a "Not Yet…" alert (`public/break_escape/js/systems/objectives-manager.js:570-576`). sis01 has the same pattern (`sis01_healthcare/ink/npc_sharma.ink:75`) and no report of it, so check in the next playtest.
  - If it shows, the mission-local fix is to move the tag to `closing_end`, after the `#set_global`.
- **mn14. Tom's nudge doesn't come back after a reload (S7).** Note only.
  - His `timedMessages` nudge waits for `global_variable_changed:jump_server_confirmed` (`scenario.json.erb:1016`). After a reload once the session is flagged, it never re-arms. It is only a nudge (Helen and Marcus also point to Tom), so no fix is needed.
- **mn15. The isolation-scope choice can come after Tom has already acted.** Local, unvoiced.
  - If the player picks a scope after Tom has isolated, Marcus says "I'll tell Tom it's in scope" (`npc_marcus_webb.ink:231`), but Tom's scope lines only run inside `isolation_confirm` (`npc_tom_hadley.ink:156-163`).
  - Add a variant: `{ network_isolated: I'll ring Tom and add it. }`.
- **mn16. Priya's cable line can be wrong.** Local; voiced, so it costs TTS.
  - Priya says "You pulled the jump server cable before talking to Marcus" (`npc_priya_s.ink:254`). It fires whenever the cable came out before Marcus heard about the session (`cable_pull_agreed` is only set in `rdp_session_confirmed`, `npc_marcus_webb.ink:206-212`), including after earlier calls.
  - "before Marcus knew about the session" is accurate on every route.
- **mn17. Two stale status files.** Local, housekeeping.
  - `CONSISTENCY_PLAN.md` still says "on hold, needs a decision", and `DECISIONS_PENDING.md` D4 is still open. `IMPROVEMENT_LOG.md` phase 10 records both as resolved by merge 1cece907.
  - Mark the plan superseded and move D4 to the log.

## 3. Design review (skill step 2)

### 2a. Solvability and softlocks

**OK, apart from MF1.**
- The start room holds Helen's badge (handed over in the briefing, `npc_helen_marsh.ink:72-75`, with a fallback at `:93-96`), the workshop key in the duty desk (`scenario.json.erb:1157-1178`), and two ESD stations that are never gated (`authVar: esd_stations_live`, always true).
- The workshop holds the filing-cabinet key on its desk (`:2001-2014`). There are no circular dependencies.
- The ending needs `priya_s_visible`. That comes from the safe state (ESD plus `network_isolated`, `:744-760`) or from Helen's evacuation scene (`npc_helen_marsh.ink:369-370`). `network_isolated` needs Tom's call-back, and Marcus's sign-off option is always reachable once Tom has been asked (`npc_marcus_webb.ink:114`). So the mission can always be finished.

SOFTLOCK_PATTERNS, at design level:
- **S1:** clean. Marcus's and Tom's first-call menus are sticky, and everything that makes progress also lives in their hubs. Helen's gauge, shutdown and scope "think about it" exits return to sticky options.
- **S2:** order dependence is MF1. The historian can be skipped, and the NIS gate assumes it wasn't. Everything else accepts any order: early completion of tasks in locked aims is revealed by the engine (`objectives-manager.js:603-605`). Marcus's session knot handles a player who skipped the historian.
- **S3:** MF1 again: Helen's and Marcus's NIS pointers with no route. No other promise goes unset. Marcus's "I'll tell him it's coming from me" sets the authorisation (`:213-215`). Helen's "Press it, and I'll tell Marcus" is reflected in Marcus's "Helen says you want Hall 1 off…" (`:147-149`).
- **S4:** `call_marcus_initial` completes on the first message by design (M2; the task is only "message him"). See mn13 for Priya's task.
- **S5:** clean. Every sticky sub-menu (`esd_more`, `sis_more`, `boundary_more`, `trent_water_action`, `closing_questions`) has an always-on exit.
- **S6:** NIS is MF1. Every other required global has a setter on every branch.
- **S7:** Tom's nudge only (mn14). D3 (`tint_objects` after a reload) is already logged.
- **S8:** clean. The lab sheet carries no "don't call Marcus early" style warnings.

**Promises the scenario can't keep:** none found. Every prop the ink names exists: the clipboard by the workshop door, the register export on OPS-01, JS-SCADA-LAN, the printout on the workshop desk, the key on the safety controller (spoken of, never handled).

### 2b. Clue distribution

**OK.**
- The control room holds the HMI, historian, folder, NIS form and network diagram. The hall holds the dial, the H₂ panel and the rack panels. The workshop holds ENG-02, the SIS panel, the cabinet with the SRS and the deferral, the boundary rules and the Trent extract.
- Each readable feeds a task, a debrief branch, a credits line or a lab-sheet question.
- There are no navigation-only notes.

### 2c. Educational coverage

**OK for an SIS game.**
- The locks are light (two RFID doors and one key), which is right. The teaching is carried by the historian, the log filter, the SIS comparison, the network diagram, the ESD and the decision scenes.
- These match the lab sheet's three reflection sections and the pack's decisions 1–5 and 7.
- Pack decision 6 (NESO) is not a choice in play. Marcus tells NESO himself (`npc_marcus_webb.ink:297`), and lab sheet Q12 covers it. That is acceptable.
- 2c′ (field guides): N/A, there is no handler.

### 2d. Narrative structure

**OK; see MJ3 for the intro facts.**
- The opening is a timedConversation on `game_loaded` with `skipIfGlobal`/`setGlobalOnStart: briefing_played` (`scenario.json.erb:636-642`).
- The ending is Priya's linear debrief, revealed by event, with credits on `debrief_complete` and a once-only guard (`:490-491`, `npc_priya_s.ink:64-69`).
- Event mappings I spot-checked are correct: the dial radio (`:657-665`), the flat-line radios (disjoint on ESD, `:673-684`), and the evacuation cutscene (`:733-742`).
- 2d′: narration uses `Narrator:` (scenario-level `narrator` voice, `:130-138`). Choices are spoken first-person lines with no `You:` echoes. There is no combat or terminal logic in the ink.
- 2d″ (patrols): N/A.

### 2e. Graph metadata

**OK.** Every lock-key pair is annotated. NPC action nodes exist for Helen, Marcus, Tom and Priya. The single AND gate is the debrief. The graph doesn't model the "Priya on safe state" shortcut, which is acceptable.

### 2f. Rooms

**OK.** The three rooms suit the setting, none is a dead end, and the validator reports layout and doors clean. Helen's `room_entered` mapping deals with the hall/workshop overlap (`:804-807`).

### 2g. Objectives scaffolding

| Aim | Required tasks | With in-world pointer | Dead-zone risk | Beat at the transition |
|---|---|---|---|---|
| Understand the Facility State | 3 (1 npc, 2 manual) | 3: Helen points at the screen; the description names HMI and folder; lab sheet step 3 | Low: `helen_briefed` opens the walkdown at once | Helen's briefing |
| Battery Hall 1 Walkdown | 2 | 2: Helen hands over the badge, "read the dial" | Low | Helen radio, "Fifty-one on that dial?" |
| Check the Historian | 1 (manual) | 1: Helen next_steps; viewer hint | Low | Helen radio, "Dead flat since…" |
| Call Marcus and Investigate | 4 | 4: Marcus first call; duty desk note; Marcus "ENG-02" | Low | Helen radio on `jump_server_confirmed` |
| Investigate the SIS | 3 (manual) | 3: Helen radio, the panel, "the paperwork's in the cabinet" | Low; no beat after `sis_tamper_confirmed`, but the alarm-panel lamp flashes and Helen's hub opens SIS topics | none (minor, not raised) |
| Shut Down Hall 1 | 1 | folder, Helen, the aim text | none | Helen ESD radios |
| Isolate the Attacker | 2 | Marcus "pull the cable", Tom nudge | Low | Marcus radio on cable, Tom |
| Send the NIS Notification | 1 | Helen and Marcus radios | **Yes: MF1** if the historian was skipped | Helen safe-state radio |
| (Optional) Warn Trent Water | 1 optional | Tom message | Visible from the historian on, with nothing to do until the session is found; harmless | Tom message |
| Post-Incident Debrief | 1 | Priya bark | Low | Priya bark |

### 2h. Knockout

N/A: `disableAttacks: true` (`scenario.json.erb:46`). Priya's `taskOnKO` is harmless.

### 2i. Recurring classes

- **Spoilers in names:** MJ2 (Tom). Task and item names are clean. "Find the session on the jump server that shouldn't be there" doesn't name the account.
- **Stale status answers:** I walked Helen's `next_steps` and Marcus's `current_status` through dial → historian → ESD → workshop → SIS → isolation → NIS → Priya, plus the evacuation. Both are correct at each stage except the NIS stage of MF1. Helen doesn't name Priya until the NIS is sent (`npc_helen_marsh.ink:334-341`); that is acceptable.
- **Late first contact:** Marcus's first call branches on the dial, the historian, the session, an ESD already pressed, or the evacuation (`:69-88`). Tom's greeting branches on the session (`npc_tom_hadley.ink:44-48`). OK.
- **Credits and debrief against every route:** mn1 and mn2. I checked every other line against its reaching routes and found them true.
- **Deduction fairness:** the only "answer" is c.ellison. Apart from MJ2, nothing names it before the log does. The jump-server rack names it, but it sits next to ENG-02 in the workshop, so that is fine.
- **Hub order:** Helen's hub is ordered dial → shutdown → historian → ESD → SIS → patch → hydrogen. That is mission order rather than newest-first, but it never shows more than about seven choices at once, so it is acceptable.
- **Interaction reach and look-alikes:** covered by earlier room passes and playtests (Run H clean). Not re-tested here.

## 4. Extra checks

### 4.1 CONSISTENCY_PLAN.md, row by row against the merged game

| Row | Now | Evidence |
|---|---|---|
| Q8 register export | resolved | Marcus `npc_marcus_webb.ink:172-173`; export object `scenario.json.erb:1071-1091`; sheet Q8 (wording, mn6) |
| Q10 three isolation options, Hall 2 gas monitor | resolved | Marcus `:225-241`; Priya `npc_priya_s.ink:223-228` |
| Q11 Tom rings Marcus back | resolved | Tom `npc_tom_hadley.ink:121-150` |
| Q14/Q15 Priya on CLAIM-EN-002/007/008 | resolved | Priya `:186-213` |
| Q20 Helen "them out of our network" | resolved | `scenario.json.erb:767`, `:773`, `:779`, `:785` |
| Q13/E4 05:52 file at Trent Water | resolved | Tom `:184-185`; extract `scenario.json.erb:2053`; pack `:777`; no "TW-SCADA-ENG-02", "23:47" or "GridIntegration" left |
| Q7 anyone may press the ESD | resolved | `authVar: esd_stations_live` (`:1290`, `:1319`, `:1562`); folder `:1152` |
| E5 NIS form by the workshop door | resolved | `as-type:clipboard_chart` (`:1191`) |
| Hydrogen 3.8% by volume | resolved | panel `:1835-1836`, monitor `:1644-1657`, SRS `:1984`; no "2.0% LEL" or "four percent LEL" left |
| Dates 2026 | resolved | 2026-03-12…21 throughout; 2025-01-17 is the deprovision date (pack `:833`) |
| 200 MWh, racks A1–A4 | resolved | no "220", "B1" or "C4" left; Helen "Fifty megawatts" `:232` = pack `:839` |
| Dial, not mercury | resolved | no "mercury" left; "dial gauge" throughout |
| last week / three weeks ago | resolved | neither phrase present |
| NIS to Ofgem, NCSC copied | resolved | Marcus `:254`, `:291`; folder; form `:1197` |
| Priya "Incident Response folder" | resolved | Priya never mentions it; only the folder object and the aim text do |
| SIS audit log | resolved differently from the plan | see 4.3 |

**No row is still a disagreement between game, pack and sheet.** The plan's "jump server session recording" wording must not be applied now, because it would contradict all three (see 4.3). The plan file itself is stale (mn17).

### 4.2 Facts: game against information_pack.md

The game agrees with the pack on all of these:
- the place: Trent near Newark; 100 MW / 200 MWh; Hall 1 = A1–A4 = 50 MW; 48 MW import;
- the night's times: 23:12, 01:47, 02:04/02:17, 02:31, 03:22, 05:52, 06:00 backup fail, 06:15, 06:30;
- the setpoints 55→85°C and 1.0→3.8% vol, the evacuation level 2.0%, the LEL 4.0%, the charge inhibit 45°C;
- 51°C on the dial against 28°C on SCADA, SoC 72% (actual 94%), charge command 95%, cutoff 90%;
- the hydrogen timers at T+25 and T+43 min (`scenario.json.erb:429-453` against pack `:795`, `:856`);
- c.ellison and Fosse Controls, left January 2025 (14 months), deprovisioned 17 January, last session 10 January;
- ALB-SRV-02 10.2.4.12, 10.4.22.x, Tor 198.51.100.45 every 15 min since 3 March;
- SA-2024-09, firmware 2.4.1, eight weeks, £180,000, rounds every four hours, review March 2025;
- Whitworth on leave until 30 March, OES-EN-0471 designated in 2023, Ofgem with DESNZ jointly, NCSC as CSIRT;
- the October 2025 proof test, the key switch in PROGRAM, TRITON 2017, self-heating from about 80°C, Trent Water not an OES.

The mismatches (each with a finding):

| # | Game | Pack | Finding |
|---|---|---|---|
| 1 | Narrator: "Rows of white containers" (`npc_helen_marsh.ink:65`) | two battery halls in a three-building site (`information_pack.md:681`) | MJ3 |
| 2 | Narrator: "One car in the car park" (`npc_helen_marsh.ink:66`) | team already on site (`:781`) | MJ3 |
| 3 | Tom knows the 01:47 login from a print server before discovery (`npc_tom_hadley.ink:107`) | the SOC never sees jump-server sessions (`:701`, `:761`) | MJ2 |
| 4 | Alarm lamp "SCADA MANUAL MODE" on any isolation (`scenario.json.erb:1246`) | CastleTech blocks at the firewall only (`:789`) | mn3 |
| 5 | SIS row "At commissioning / Fosse Controls" (`scenario.json.erb:1947-1948`) | no SIS change log (`:769`); Fosse = smart-grid integrator (`:833`); SIS certified at commissioning (`:709`) | mn4 |
| 6 | Lab sheet: Priya arrives "once Hall 1 is safe" (`labsheet.md:106`) | game needs ESD plus isolation (`scenario.json.erb:744-760`) | mn5 |
| 7 | (pack-internal) HMI-ENG-02 "in the control room" (`:757`, `:685`) | workshop (`:787`; game `scenario.json.erb:1686-1705`) | mn7 |
| 8 | (pack-internal) "continuous human presence" (`:804`) | four-hourly rounds (`:847`, `:340`; Helen `:276`) | mn8 |
| 9 | (pack-internal) Scenario 02 table 80°C / HMI 26°C (`:1010-1011`) | 85°C / 28°C elsewhere | mn9 |

There is one difference that players never see. An ERB comment says "the dial at the hottest point reading 51" (`scenario.json.erb:1116`), while the pack has the hottest cells at about 58°C at 06:34 (`:785`). The dial is a single gauge, not the hottest cell, so no change is needed.

### 4.3 SIS audit log

**Confirmed: nothing contradicts it.** The tab is "HMI-ENG-02 ENGINEERING TOOL HISTORY: SIS CONFIGURATOR", subtitled "The safety controller keeps no change log; this is the workstation's own record" (`scenario.json.erb:1797-1803`). The pack says the same (`:769`, `:787`), and so does Helen (`npc_helen_marsh.ink:262`). Every other mention agrees:
- the network-diagram SIS node "keeps no log" (`scenario.json.erb:1398`);
- the SRS extract "keeps no change log" (`:1984`);
- the deferral "keeps no record of them … without trace" (`:1996`);
- the SIS panel rows "03:22 (today, per HMI-ENG-02)" and "no login recorded" (`:1929-1939`);
- the credits "HMI-ENG-02 engineering tool history" (`:562`);
- lab sheet Q16 "The SIS kept no record of the change" (`labsheet.md:194`);
- pack `:846`, `:1365`.

The only loose end is the CHARGE_INHIBIT row's "modified at commissioning by Fosse" (mn4).

### 4.4 Helen's narrator intro

- **Times fit.** "Saturday, half past six" and "the site's SCADA engineer is already at her desk" match `scenario_brief` (06:30; Helen in at 06:15) and the pack (`:781-783`).
- **Facts don't fit.** "White containers" and "one car" are MJ3. The narrator's maintenance-window clause repeats Helen's next line.
- **Mechanics work.** The compiled `npc_helen_marsh.json` contains the new lines. `Background[...]` → `Narrator[none]` → `Background[none]` follows the m01 pattern (`m01_opening_briefing.ink:230`). It depends on the uncommitted engine change (mn12). The intro lines are voiced by the scenario narrator (Charon) and are not cached yet, so fixing them now costs nothing.

### 4.5 Decisions: are they arguable, and does the player see the effect?

| Decision | Arguable? | Seen later |
|---|---|---|
| Dial or screen (Helen) | Yes. "Dials stick" is a fair doubt, as pack decision 3 intends; "historian first" is a real middle option | Helen's historian line (`npc_helen_marsh.ink:210-212`), Priya (`npc_priya_s.ink:123-134`), credits |
| Shut down now or logs first (Helen, Marcus) | Yes. Penalties and half the site against the hall; Marcus argues the other side | Marcus status lines, Priya (`:135-146`), credits |
| Save the registers first (Marcus) | Yes. Ten seconds against a forensic gap that SIS03 inherits | Export text variants, Marcus radio, Priya (`:147-158`), credits; the game checks the export was actually done |
| How far to isolate (Marcus) | Yes. Each option has a stated cost | Tom (`npc_tom_hadley.ink:156-163`), Marcus "I'd call it watched" (`:379-381`), Priya (`:222-234`), credits. The world doesn't change (mn3) |
| Who authorises CastleTech (Tom) | A test of process rather than a choice; it teaches well | Priya (`:236-243`), credits |
| Send the NIS notification now or wait (Marcus) | Yes. "Wrong reports are hard to undo" against the clock | Helen and Marcus radios, Priya (`:306-319`), credits |
| Warn Trent Water now or verify first (Tom) | Yes, as pack decision 5 | Priya (`:327-338`), credits |
| CLAIM-EN-002 held or broke (Priya) | No. It is a knowledge check with a right answer, though the "held" answer earns a useful logic-against-claim distinction | Credits only (it comes at the end) |
| Patch or defer as risk owner (Priya) | Yes, and neither answer is called wrong | Priya's follow-up question and IEC 62443 line (`:278-296`), credits |
| Did Trent need telling under NIS (Priya) | Knowledge check | Not recorded; fine |

Every real decision changes something the player later sees in NPC lines, the debrief or the credits. The two knowledge checks come in the debrief, where a right answer is reasonable. The weak spot is the isolation scope: it changes words, not the world. mn3 is the cheap part of that; making 'scada' visibly cut HMI-OPS-01 would be a larger idea for the backlog, not this pass.
