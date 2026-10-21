# m10 Full Disclosure: stages 4+5, design review round 1

## 0. Scope and method

Fresh read-only reviewer, 2026-10-21. Reviewed `../stage_4/objectives_tasks.md` ("OT") and `room_layout.md` ("RL"), with `../stage_1/story_arc.md` §1–2, §5–9 and §20 ("arc") for context. There is no `scenario.json.erb` yet, so the validator step of `scenario-design-review` can't run: the plan was reviewed as if building it, against §2a–2i of that skill and the objective-staging and HaX-hub rows of `mission-alignment-plan`. Compared with shipped `scenarios/m07_architects_gambit` and `scenarios/m08_the_mole` (aims, task counts, room types, the m08 closing wiring). No VM material was opened.

Engine claims spot-checked in `public/break_escape/js/systems/`: `door_unlock_failed:<room>` exists for RFID refusals (`unlock-system.js:125-130`, `:523`); `delayMs` mappings exist (`npc-manager.js:577-624`); an `enter_room` task in a locked aim completes and reveals its aim unless the aim is story-gated (`objectives-manager.js:496-505`, `:704-736`); completing the conclusion aim's last task concludes the mission server-side and opens the visualiser at once (`objectives-manager.js:566-568`, `:1057-1085`); a key/RFID lock with no matching item is a validator warning (`scripts/validate_scenario.rb:1655-1667`). Stand-in map sizes match RL §2 (genhall 20×10, vault and qdc_server_hall 10×6, the rest 10×10).

Finding ids: `R1D-Bn` blocker, `R1D-Mn` major, `R1D-mn` minor.

## 1. Summary and verdict

**Counts:** 1 blocker, 11 majors, 19 minors.

**Verdict: another round needed.** The structure is sound: aims are staged, the story doors persist, the KO cover is thorough and the whodunit's clues are well spread. The blocker is a one-line condition. Most majors are wiring details that would each break a warned choice or a key scene in play: the console that works once, the jam that follows the player downstairs, the closing scene that cuts off the ending's beat, the release nobody sees. M9 (the bunker reads as a corridor of reused squares) is the one taste call, and it goes to the user with options.

**Top five:** B1 (gallery without flag 2, so the conclusion can fail after 06:00), M1 (the closing scene cuts off every ending's beat), M3 (the jam kills the console if the player steps back), M5 (clue 3's second half has no route back), M2 (two different "release consoles").

## 2. Blockers

**R1D-B1. The gallery opens without flag 2, so the console can be skipped unseen and the conclusion can fail after 06:00.**
- *Location:* OT §4.4 (condition `flag3_submitted && gallery_shutter_cut`), OT §3 edge case "Flag 3 before flag 2", RL §3 lock graph.
- *Problem:* the gallery condition leaves out flag 2, and OT says the station takes flag 3 first. On that order the player climbs to the gallery without the schedule. They never see the share lines, never get the console (C9 needs flag 2), and the head start goes at the lock untraced. That breaks arc §6.3's rule that "nobody reaches the lock without the chance at the console". Aim 4 is still open, so aim 5 is shown early by its `enter_room` task. Worse, nothing on the core's route needs flag 2. The player can pick an ending, sit through the 06:00 scene, and then `close_the_night` POSTs, the server's `concludeRequires` check refuses ("Not yet…" alert, `objectives-manager.js:571-575`), and they are left after the closing scene with a trip back to the server hall still to make.
- *Fix:* add `globalVars.flag2_submitted === true` to the gallery condition and to its `game_loaded` catch-up. Drop the "Flag 3 before flag 2" edge case, or rewrite it to say the gallery waits for both. Also gate step 1 of `core_router` (his case) on `flag1_submitted && flag2_submitted && flag3_submitted && flag4_submitted`, which is free insurance that no ending can be chosen while a required flag is missing.

## 3. Majors

**R1D-M1. The closing scene fires inside Tesseract's conversation and cuts off the ending's own beat. Scorched Earth's two scenes aren't chained.**
- *Location:* OT §4.7, §7 "The order at the end"; arc §10 ("the ending's own beat at the core, then the forward post at 06:00").
- *Problem:* HaX's mapping opens the 06:00 scene on `global_variable_changed:ending`. `ending` is set by the pick, and the ending's beat at the core plays after the pick in the same person-chat ("Thank you, Agent.", the narrated shot, HaX's "I was a second behind you", the purge narration on wipe). OT §4 says a conversation mapping closes whatever minigame is open, so on every ending the beat is cut off mid-line. For `scorched`, OT says "the hearing (after the 06:00 scene)" but names no trigger for it, and doesn't say which scene's last line carries `#complete_task:close_the_night`.
- *Fix:* open the closing scene on `conversation_closed:tesseract` with `globalVars.ending !== ''` (plus `delayMs: 1500`), or on a `core_beat_done` global set on the beat's last line. Keep the `game_loaded` backstop. Chain Scorched with `six_oclock`'s last line setting `six_done` and a mapping on `six_done && ending === 'scorched'` that opens the hearing. Only the hearing's last line completes the task on that branch. Write the chain out per ending in a 6-row table.

**R1D-M2. "Release console" names two different things.**
- *Location:* OT §2 aim 5 description ("He is waiting at the release console"), task `decide_the_console` ("Decide what happens at the release console"), and aim 4's `use_the_console` ("Use the release console on the head start"); RL §2.6 `release_console` (the server hall's flag station); arc §9.3 ("seated at the release console").
- *Problem:* one name covers the server hall's flag station (where flags 2 and 3 go in and where C9 lives) and the core's key console. A player who reads aim 5 in the gallery will think he is downstairs, and "Decide what happens at the release console" reads like a return trip.
- *Fix:* keep "release console" for the server hall (it is the one the player submits at). Call the core's "his console" or "the key console" everywhere a player sees it: aim 5's description ("He is waiting at his console in the core."), `decide_the_console` ("Decide what happens at his console"), and stage 7's lines.

**R1D-M3. The jam sticks if the player steps back down from the gallery, which kills the console and the hub in the server hall.**
- *Location:* OT §5 "The jam" (`hax_jammed` set on `room_entered:gallery`, cleared on `outer_lock_open`); RL §2.6 `release_console_controls` (opens HaX's knot `console`).
- *Problem:* nothing stops the player going back down the gallery stair, and they will: to use the console after HaX's "last chance" line, to fetch flag 2 (see B1), or to reread the schedule. Every HaX mapping carries `!hax_jammed`, so back in the hall the console object does nothing (C9 and C10 are her ink), her hub shows static, and Victoria's line can't re-ring. A real, warned choice turns into a broken object.
- *Fix:* set `hax_jammed` true on `room_entered:gallery` and false on `room_entered:server_hall` (and on `outer_lock_open`). Each gallery bark condition stays as written. HaX gets one fixed line on coming out of the jam the first time ("Lost you up there. I'm back.").

**R1D-M4. Object triggers built on `set_global` fire once.**
- *Location:* RL §2.6 `release_console_controls` (`triggerOnInteract` sets `console_opened`, and a HaX mapping opens her knot); RL §2.3 `duty_handset` (re-opens Ghost's call); RL §2.2 `post_ladder`.
- *Problem:* `global_variable_changed` fires on a change. The second click sets `console_opened` to `true` again, nothing changes, and the console stays shut. Players often open the console before flag 2 ("Locked to the staging copy."), and that spends the only trigger. The handset is the written fallback for the forced call, so it must work every time.
- *Fix:* key these mappings on `object_interacted` with `data.objectId === 'release_console_controls'` (and the same for the handset), with the gating conditions on the mapping, not on a latch global. Or have each knot set the latch back to `false` on exit. Say which in RL.

**R1D-M5. Clue 3's second half has no route back once the player has left the forward post.**
- *Location:* arc §8.2 clue 3 ("which HaX reads out if asked"); OT §3 `read_the_bench_log` pointer ("The sign-out sheet's on the table here."); OT §5 topic table (no sign-out topic); RL §2.1 `case_signout_sheet`.
- *Problem:* the bench log is read on the workshop floor, three story doors down from the sheet. HaX's pointer says "here" while the player is in the workshop, and her hub has no topic that reads the two names. A player who didn't read the sheet early (most won't; nothing points at it before the bench log) has to walk back through the tunnel, or can't cross clues 2 and 3 at all. That is the whodunit's central deduction.
- *Fix:* add a hub topic `{clue_bench_log and whodunit_live and not signout_read and not signout_given} [Who signed for the case?]` in which HaX reads "Opened one fifty-two. Kowalczyk and Arakawa." and sets `signout_read`. Reword her pointer: "That's a cloner in our own breaching kit. The case's sign-out sheet is on the table up here. Want the names?"

**R1D-M6. Arakawa's 02:10 alibi beat runs on a timer and will often play while the player is in another conversation.**
- *Location:* OT §6 clock table (split on the first gate-launcher use; 0210 `delayMs: 60000` after; 0220 the same; "or flag 1 if sooner"); arc §5.1–5.2, §8.2 clue 2.
- *Problem:* the alibi rests on the player *having seen* Arakawa beside them at 02:10 and *having heard* Malhotra log it. The natural flow is: the cutscene ends, the player tries the gate console because it is the obvious machine, then HaX sends them to the table for the door scene (3 min, more on the unshown branch). A minute later Arakawa's call and Malhotra's line play while Nightshade's person-chat is open. The engine holds those barks until the chat closes (RL §6 item 44), so they arrive out of context or not at all. Flag 1 first is worse: 0200, 0210 and 0220 can all fall due on one event while the flag-station minigame is open.
- *Fix:* start the split on `door_scene_done && <launcher used>`, whichever comes second, so the door scene is over before the clock moves. Then run each step as `delayMs` after the step before, never on flag 1, and keep `arakawa_call_done` as the guard. Have HaX's alibi topic restate what the player saw ("You had Arakawa at the gate, on the phone to his girl. I had Malhotra."), so a missed bark doesn't sink clue 2.

**R1D-M7. The head start's release at the lock is shown on a panel nobody reads.**
- *Location:* OT §4.5, §6 ("The objects show; people say"); arc §9.2 item 2; RL §2.7 `clock_gallery`.
- *Problem:* the moment the player's console choice pays off (or costs) is a text change on a `readable` object at (8, 3). The player has just opened the door beside it and is walking into the core. HaX is jammed and nobody speaks. Most players never click it, so C9 and the share stops in the gallery have no visible result until the closing card.
- *Fix:* push it. On `global_variable_changed:head_start_out`, show a fixed-string toast or panel bark by value (four strings: "EARLY ACCESS: RELEASED. ZERO DAY, SECOND BUYER." / "...ZERO DAY." / "...SECOND BUYER." / "EARLY ACCESS: NOTHING TO RELEASE."). Give HaX's return at the core one fixed line per value after her word and the designation. That is a voiced line chosen from four fixed strings, not a printed variable.

**R1D-M8. The by-hand shutter cut has no ring, no re-ring and no pointer.**
- *Location:* OT §2 aim 3 ("or by hand"), §3 `cut_the_shutter` row; RL §2.5 (cut and camera switch are ink choices "in the phone voice's thread"), §4 (the phone voices' start knots "reveal nothing until their mapping rings").
- *Problem:* the by-hand cut is the KO cover for Wendell and escaped Voltage, and the route for a player who won't deal. RL never says what rings the phone voice (Vance, Elena or HaX), when, or what re-rings it after a reload. A player who knocks Wendell out first gets no call and no line. "By hand" in the aim description doesn't tell them it is a phone call. Clicking the `shutter_isolator` just reads its state.
- *Fix:* the voice's mapping rings on `room_entered:power_room` after the slot scene's first line or on the slot-holder's `npc_ko`, re-rings on `game_loaded` while `!gallery_shutter_cut` and the player is in the power room, and its thread carries the cut. Where the voice is HaX, add a hub topic `{power_room entered and not gallery_shutter_cut} [Talk me through the shutter.]`. The isolator's text before the cut: "A key switch and a breaker row. Whoever runs this room can cut it, or someone on the line can talk you through it." Aim 3's description: "...by whoever runs the power room, or by hand with someone on the line."

**R1D-M9. The bunker is a straight corridor of square rooms built from maps the player has already seen.**
- *Location:* RL §1 map, §2 map table.
- *Problem:* eight rooms in one line, no side room, no fork. Five of them are 10×10 squares one after another. Four of the eight maps are m07's (`pnw_genhall`, `pnw_vault`, `pnw_servers`, `pnw_ops`) and three are m04's, so a 1960s command bunker is drawn with a modern utility's rooms. Only the forward post, gallery and core get new art, and two of those are rooms the player spends little walking time in. m07 and m08 both branch (m08 has ten rooms off a hub). The finale should feel like the biggest place in the season and it reads as the smallest. A careful villain's bunker is also where a side room earns its place: the sealed section and the battery room both exist in the fiction and are both cut to decor.
- *Fix (pick one or two):* (a) make `server_hall`, the act's centre, 3×2 (its north door then needs an array or a 3-wide gallery, so check with `predict_door_sides.py`). (b) Add one leaf room east of the server hall (x 12–14, y 2–4 is clear): the sealed section, reached through the painted-over hatch, holding flag 3's station (see m5). The beat "get under the release service" then becomes a place the player goes to. (c) Put the dressing pass's prop budget into bunker-specific pieces (blast doors, Bakelite boards, the plotting board, caged lamps, stencilled level markers) on the five reused maps before the three new ones. Record the choice in RL §8 for the user.

**R1D-M10. The forward post's table is packed so tightly that NPCs stand on readable objects.**
- *Location:* RL §2.1 objects and NPC tables.
- *Problem:* Netherton (7, 4) stands on the face of `case_signout_sheet` (7, 5), a whodunit clue. HaX (5, 4) stands on `helena_plans` (5, 5), which the payment check needs. Seven NPCs (Netherton, HaX, Nightshade, minder, Kowalczyk, Arakawa, the van minder) sit in the 5×4 tiles around the kit table, against README:1834 ("NPCs off their faces"). Clicks on the clues will hit people, and the door scene's three-way staging will be hard to read.
- *Fix:* spread the table end. Put the sheet and the plans on the table's south edge with the NPCs north of it, move Arakawa and Kowalczyk to the case end (east), and move the minder to the van side. Re-place all of them with one free tile around each readable.

**R1D-M11. Ghost's forced call rings on entry into a room with patrolling guards.**
- *Location:* OT §4.2; RL §2.3 NPC table (`duty_guard` patrols (3, 5) → (7, 7), faster on `security_alerted`; `duty_guard_b` at the monitors).
- *Problem:* the call is `disableClose` and rings as the player walks in. Whether hostile guards keep moving and striking while a phone-chat minigame is open isn't established anywhere in OT or RL. If they do, the player is beaten while unable to close the call, and on the tripwire route the guard is already up. If they don't, the room's first threat freezes mid-step, which also reads badly.
- *Fix:* check the behaviour in one trial, then ring on `room_entered:security_office` with `delayMs` and the condition that no guard in the room is hostile and unknocked. Or make the ringing handset (a bark plus a ring sound) the trigger the player answers by clicking. The stair holds them until it is answered, so nothing is lost by letting them choose the moment. Keep the `room_exited` and `game_loaded` re-rings.

## 4. Minors

| Id | Location | Problem | Fix |
|---|---|---|---|
| R1D-m1 | OT §5 "The ten-choice cap" | The busiest count (7 topics + 3 sticky = 10) leaves out the field-guide offers. In the server hall the flag 2 and flag 3 guides can both be live, which makes 11–12 and trips dialoguelint's `crowded-hub`. | Count them, and retire "[The door log.]" once `clue_alibi` is set and "[Who was where at ten past?]" once spent. Or fold the two guides into one "[Field guide.]" choice that branches by stage. |
| R1D-m2 | OT §5 "[Where are we?]" | After flag 4 it says "Hear him out. Then it's yours." through the console, WREN, database and end-for-him menus. On a reload between menus that is stale. | Add rungs: `exchange_3 != ""` "Your call on the console." → `console_choice != ""` "The database. Then him." → `database_outcome != ""` "It's him now." |
| R1D-m3 | OT §2 aim 4 description, aim 1 task `submit_flag_1` | "arm the disarm" is jargon a player can't act on. "submit it at the gate terminal" leaves "it" (the foothold) unclear. | "...then get under the release service so the release can be stopped from the core." / "Get a foothold on the security monitoring host and submit the flag at the gate terminal". |
| R1D-m4 | OT §2 `find_the_sleeper` (`globalVariable: whodunit_live`, written at `game_loaded`) | On a whodunit save the optional aim appears at load, during the briefing cutscene, before HaX tells the player at the private aside. A cold-start player meets "placed eleven years ago" with no context. | Use the fallback OT already names: `"status": "locked"` plus an `unlockAim` mapping on HaX when the aside ends (`aside_done && whodunit_live`). |
| R1D-m5 | RL §2.6 (flag 3 at `release_console`), arc §6.3 item 6 | Flag 3's fiction is the sealed section's hatch, but the player submits it at the same console as flag 2 and never moves. The hatch is "decor with HaX's pointer". 17 minutes of VM work happen at one desk. | Make `sealed_hatch` flag 3's station (`flags: [flag 3]`, `hintOnlyFlags` for the rest), or the station inside the leaf room in M9(b). Flag 3's task id then becomes `sealed_hatch:<vm>-flag1`. |
| R1D-m6 | OT §4.3 knot `tripwire`; RL §2.2 `post_ladder` | HaX's tripwire line names the cost but not the way round. The ladder's narration has the player go "through the office's back corridor", while the player is still standing in the tunnel when HaX unlocks the door. | Add to her line: "There's a ladder at the guard post. Up and round." Rewrite the narration so the player climbs, finds the door's release from the corridor above, and comes back down. |
| R1D-m7 | RL §2.7 NPC table | `quintero_lock` is placed at (8, 4), the `lock_guard`'s tile. When the lock was opened from inside or by code, the guard is still standing there. | Put `quintero_lock` at (7, 4) or (8, 5), clear of the door and the panel. |
| R1D-m8 | RL §2.3, §2.6 | `duty_guard`'s patrol starts on the alarm panel's tile (3, 5). `kowalczyk_hall` (8, 8) stands on `hall_guard_b`'s waypoint. In the hall, `schedule_terminal` (3, 5), Asante (4, 5), Mercer (5, 5) and `release_console_controls` (6, 5) fill one row, so NPCs stand on readable faces. | Move the patrol endpoints off objects. Put Asante or Mercer north of the console row, and leave a tile between the controls and the schedule. |
| R1D-m9 | RL §2.7 `reinforcement_a/_b` ("they stay south of a line") | The engine has no zone boundary for a chasing hostile. Nightshade only appears on `outer_lock_open`, after the reinforcements could already be running. | Stop them in ink or by placement. Hide them on `outer_lock_open` when `nightshade_lock` is shown, with one narrator line, or keep them on short patrols south of x 4. |
| R1D-m10 | RL §2.7, §3 ("lifted from him"), arc §9.2 | "Lifted" implies pickpocketing a standing NPC. The code supports a KO drop (`npc-hostile.js:461`) and an ink `#give_item`, nothing else. | Say "dropped on a knock-out, or handed over by Vos". If escaped Victoria names the guard, give her a "[Tell him Sterling sent you.]" ink route that ends in `#give_item`. |
| R1D-m11 | OT §4.2, §4.5; RL §2.3 | Ghost's code is said aloud on a call about 40 minutes before the lock and is never written down. The phone thread keeps it, but the player has to know to scroll back. | Give a `notes` item or `#add_note` on the line ("Maintenance code, gallery lock: …"). Same for Vector's cupboard code. |
| R1D-m12 | OT §4 story-door pattern; validator `validate_scenario.rb:1655-1667` | Four story doors with `requires: tg_story_lock_<room>` and no matching card give four validator warnings ("nothing in the scenario can open it"). Stage 9 will be tempted to "fix" them. | Note them in the scenario as intended (an ERB comment beside each door), or add a validator allow-list key for doors in an `unlockable` list. Each `door_sign` must say who opens it, which OT already plans. |
| R1D-m13 | OT §3 `submit_flag_1` pointer ("Field-guide offer live from the start") | `scenario-design-review` §2c′ wants guides offered on exposure, not at load. | Offer the flag 1 guide on `object_interacted` with `data.objectType === 'vm-launcher' && data.roomId === 'forward_post'`, as m01/m02 do. Do the same per station for flags 2–4. |
| R1D-m14 | OT §7 order at the end | `close_the_night` is the conclusion aim's last task, so its POST concludes the mission and opens the visualiser straight away (`objectives-manager.js:566-568`, `:1076-1081`). The music event with `closingCard` and `credits` fires on `closing_done` from the same line. OT §7 describes them as sequential ("then the client POSTs `/conclude`"). | Copy m08's verified order (credits on `conversation_closed:closing_debrief`, `scenarios/m08_the_mole/scenario.json.erb:258-272`). Name the trigger that opens the visualiser once, and check that a reload after the scene lands on the card, not on a second credits roll. |
| R1D-m15 | OT §7 music table | The gallery is silent and the outer lock starts the core's cue. A player who steps back down to the hall (M3) stays in silence. | Add `room_entered:server_hall` with `!outer_lock_open` → `spy-action`. |
| R1D-m16 | OT §8 time budget | The player spends about 17 minutes in the start room (briefing 5, door 3, flag 1 9) before the first door opens. That is slow for a finale's opening, and the VM's boot time is not counted. | HaX's first line after the cutscene asks the player to start the gate console so it boots during the door scene. The table's 9 minutes then include the boot. Keep the briefing at 5 minutes as planned. |
| R1D-m17 | RL §2.4 `casualty_margin_note` | The optional CyberChef decode has no pointer and no task, so almost nobody finds it. It is the one hands-on decoding moment outside the VM. | Imran or HaX names it once ("There's something written in the margin. Not English."). Add an optional task `decode_the_margin` to aim 3. |
| R1D-m18 | OT §3 `settle_the_table` vs RL §2.1 | OT names the silent branch's holder `netherton_table`; RL gives the tether question to `director_netherton`. | Pick one id. If Netherton holds both the briefing and the tether question, the breach mapping on `conversation_closed:director_netherton` must also check `door_scene_done`, so closing the briefing doesn't count as settling the table. |
| R1D-m19 | OT §8 ceiling check | A rich save runs 109–112 minutes against a 110 ceiling, with the 32 VM minutes still estimated. | Already flagged in OT §11. Ask for the timed VM run before stage 7 writes lines, and apply cut-order item 1 early if flags exceed 34 minutes. |

## 5. Objectives scaffolding table (scenario-design-review §2g)

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Said aloud at the transition |
|---|---|---|---|---|
| 1 Breach the perimeter | 4 | 4 (cutscene, HaX by branch, HaX at flag 1, the breach call) | Low. Both halves are named on the closed door. | Yes: "Breach. Go." |
| 2 Get below ground | 3 | 3 (only door; the ring; HaX's "Stair's open") | Low. On the tripwire route the ladder has no spoken pointer (m6). | Yes |
| 3 Cut the gallery's power | 2 | 1 of 2. `cut_the_shutter` has no pointer when the slot-holder is down or the player refuses (M8). | **Medium.** The hall door is open, so the player can walk on with the shutter live. HaX's "[Where are we?]" only catches it after flag 3. | Partly: no line marks the cut done. Add HaX "Shutter's down. The hall's next." |
| 4 Find the release | 3 | 3 | **High until B1 is fixed** (gallery reachable without flag 2) | Yes: the sweep line and the console warning on leaving |
| 5 Reach the core | 4 | 4, but the description misnames the console (M2). Inside the gallery the only pointers are the door sign and the barks, by design. | Low | Partly: the jam is announced, but the head-start release is silent (M7) |
| 6 End it | 4 | 4 (each menu opens itself) | Low. The risk is order at the end (M1, m14), not discovery. | Yes |
| Find the sleeper (opt.) | 0 required | 4 of 4 optional; clue 3's second half has no route back (M5) | n/a | HaX's nudges after each clue |

Aims follow `aimCompleted` in order, with tasks shipped `active` so early progress reveals its aim (`objectives-manager.js:718-736`). That is the right shape and matches m08. Titles name actions throughout, and none names WREN or a choice's answer (§2i spoilers: OK).

## 6. Other checks (clues, KO, rooms, pacing, teaching, text)

**2a Solvability.** OK on the main path once B1 is fixed. The story-door pattern (RFID with no card, opened by HaX's `#unlock_door` with `unlockable`) is sound and persisted, and every story door has a `game_loaded` catch-up. The tripwire, the KO'd technician and the KO'd lock guard each have a non-talk way through. The open risks are B1, M3, M4 and M8.

**2b Clue distribution (whodunit).** OK, with M5 to fix. The clues are spread through the first half of the map: the sign-out sheet and the witnessed alibi at the forward post, the door log in the security office, the bench log on the workshop floor, and the last face-to-face chance at the server hall's peel-off. Each sits before the accusation point that uses it, and helpers (Nightshade, Phantom, the shortlist) replace a clue rather than give the answer. Brute force: the accusation opens after clue 1 alone, so a player can guess Kowalczyk cold. The cost of a wrong guess (an officer's job until recalled, the credits line) is proportionate and nothing blocks, so that is acceptable. Navigation-only items: none. Every readable feeds a clue, a rebuttal, a variant or the payment check.

**2c Teaching and VM weaving.** OK. Lock spread: RFID (the power-room card: clone, talk or hatch), PIN (the outer lock, the cupboard), key and pick (the hatch box), four VM flags each tied to a place and a story step, and coordinated disclosure named at the database menu (the finale's CyBOK point). There is no password lock, which suits a finale that adds no new kit. Weak spots: flag 3 has no place of its own (m5), and the CyberChef margin note is hidden (m17).

**2d Bookends.** The opening `timedConversation` has `skipIfGlobal`, and the closing has a `game_loaded` backstop. Order at the end: M1 and m14.

**2d″ Guards.** The tunnel post is a patrolling LOS guard in a 1-GU corridor, and arc §5.3 offers "stealth" there. In a corridor that only works as a timing pass, which is fine if stage 7's HaX line doesn't promise sneaking round him. The gallery's four guards in a 2×1 room are a fight or a talk, never stealth. That is acceptable because the scene is the point, but say so in RL §2.7.

**2f Rooms.** No overlaps by RL §1's own reckoning (stage 9 runs the scripts). No dead rooms: every room carries a scene, a clue or a flag. Variety and feel: M9. Crowding: M10, m7, m8.

**2h KO resilience.** OK. Every forced-scene holder is `koImmune`, and each knockable slot-holder has a non-talk route. One narrative gap for stage 7: knocking out Arakawa before 02:10 leaves Malhotra's "Arakawa, you're off the net" and the call playing over a body. Gate the call on `!arakawa_ko`, and have HaX's alibi topic carry a KO variant ("Arakawa was on the gravel at ten past. You saw to that.").

**2i Text.**
- *No printed variables in voiced lines:* OK. Every state-dependent line (the share read-outs, the backdoor count, the recall by officer, the KO-pattern sting) is chosen from fixed strings. The countdown objects print times and states, but they are on-screen text, never voiced. M7's toast keeps to fixed strings too.
- *Spoilers in names:* OK.
- *Late first contact:* the phone voices (Vance, Elena) first ring in the power room. Their opening needs to read the player's progress, which M8 covers.

**Pacing against 105 minutes.** The act split (25 / 40 / 32 / 8) is coherent and the cut order is sensible. Act 2 puts 21 minutes in one room (the server hall). m5 and M9(b) would break that up. The 17-minute opening room is m16.

## 7. What works and should stay

- The story-door pattern and the engine verdicts (RL §6) are checked against code and are honest about what the engine can't do.
- The countdown is one string global moved only by beats, and it can't wind back. Every display writer is a fixed `setGlobal` on the decision global, so the screens can't disagree with the state.
- HaX's hub is progress-gated in m02's shape, newest topics first, with a status answer that walks down the progress ladder.
- The gallery jam is announced before it happens, by HaX's last line, the aim description and the visible next task.
- `concludeRequires` holds the four flags only, and every ending completes every `end_it` task, so the score never punishes an ending.
- The F15 test states in OT §9 are concrete enough to run.
