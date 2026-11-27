# m01 office life: R2 fixes and D88 rewrite, handover

Status: research done and verified against engine and map; NO edits yet to PLAN.md, ANALYSIS.md, SPOKEN_LINES.md, DIALOGUE_SAMPLE.md or PLAN_REVIEW_R2.md. Next agent: apply everything below, then append "## Outcomes" to PLAN_REVIEW_R2.md (one line per finding M1, M2, m1 to m5), commit with explicit paths.

Worktree `.claude/worktrees/p-ol-m01`, branch plan/ol-m01, base 3294b2cb0. Engine paths below are under `public/break_escape/js/`.

## Verified facts (use these numbers)

### Map (assets/rooms/room_office.json, 10x10, 32 px; Tiled gid objects anchor bottom-left; item sprites drawn at (x, y - height), core/rooms.js:540)
- Chairs 32x32: id 158 chair-white-2-rotate6 at (0.87, 5.41) -> centre (1.37, 4.91), foot point (1.37, 5.41). id 157 chair-white-2-rotate3 at (6.81, 5.39) -> centre (7.31, 4.89), foot (7.31, 5.39). Others: 152 (3.1,7.14), 153 (3.16,3.57), 154 (5.67,2.87), 155 (6.6,7.0), all bottom-left; none has a foot point within 40 px of either spawn below.
- PCs: 141 pc8 (6.62,4.08) 34x22 centre (7.15,3.74) on NE desk; 142 pc6 (2.25,5.62) 32x30 centre (2.75,5.15) on SW desk; 143 pc11 (2.41,4.14) 31x21 centre (2.89,3.81) on NW desk.
- Desks (desk1 78x39, tile spans): SW x 0.94-3.38 y 5.19-6.41; NW x 0.97-3.41 y 3.69-4.91; NE x 6.56-9.0 y 3.66-4.88; SE x 6.58-9.02 y 5.19-6.41.
- Seated spawn: `seated` picks nearest free chair whose foot point (placeFoot = chair bottom-centre, seating.js:263-266) is within 40 px of the NPC's body-centre (chairsNear seating.js:1055-1069, NPC_DEFAULT_REACH :1038, spawn :1972-1987). NPC tile position = body centre (npc-sprites.js:118-125). white32 seat point is chair top-left + (14..18, 10..11) px (seating.js:122-124, seatPoint :254-257).
- Once an NPC is registered with needs, `seated` is ignored: updateSeatedNPC returns updateNeedsSeat when a needs state exists (seating.js:1970-1972). So step 0 uses `"seated": true`; step 2 removes it when `work` is added.

### M1 fix values
- Spawn at chair sprite centre: Fatima (1.37, 4.91), Graham (7.31, 4.89). Each is 16 px from its own chair's foot point, well inside 40 px; no other chair foot near. Render confirms.
- useFrom measured sprite centre to chair centre (approach = nearest walkable cell to object centre + useFrom*32, npc-needs.js:5224-5228, :5420-5430): graham_pc dx 0.16 dy 1.15; fatima_pc dx -1.38 dy -0.24. Facing is back along useFrom (seating.js facePointFor ~:2117-2124): Graham faces north, Fatima east. work uses default to fetch seat (seatPreference seating.js:2103-2115).
- ANALYSIS.md:57 chair/desk coordinates: label them Tiled bottom-left anchors and add centres.

### M2
- Rename knots to `ex_interns`, `ex_biscuits`; declare `heard_ex_interns`, `heard_ex_biscuits` false; drop `"requireGlobal": null` (npc-needs.js:2983 tests `!== undefined`). Gate both with `"requireGlobal": { "fatima_ko": false, "graham_ko": false }` (both declared false). Engine sets heard_<knot> (npc-needs.js:2954, :3062, :5559; NNS doc 688-700, heard survives reload).

### m1 cooler (position (5.4, 8.2) stays, D88a settled)
- water_cooler1.png is 24x47 (assets/objects/water_cooler1.png, NOT hospital_extras). Scenario positions are top-left (rooms.js:598-599). Body x 5.4-6.15, y 8.2-9.67, centre (5.78, 8.93). With useFrom dy -1 the stand point is (5.78, 7.93), facing south (towards camera, cooler between NPC and camera): name this as the accepted facing compromise.
- No `queue` key: with none, a user who finds capacity full waits at its post (docs/achitechture/NPC_NEEDS_SYSTEM.md 5.7, :723-726). Drop all "queue cells" wording. Second user takes a beside cell (npc-needs.js:3395-3415).
- South door: one connection, placeSouthDoorSingle default puts it at x 1.5 or 8.5 by parity (doors.js:165-213). Central aisle x ~3.4-6.56, narrowed to ~4.1-6.6 at y 6-7 by chairs 152 and 155. Dressing render must check, with two users at the cooler, a clear one-tile path from the south door (whichever x it lands at) to both north doors. Fallback if it fails: change useFrom only (position stays, as settled).

### m2 DIALOGUE_SAMPLE section 3: thirst set to 20 by mapping 2 s after a non-reception entry, so Fatima gets up about two seconds after the player comes back, not thirty.

### m3 ANALYSIS fixes: :70 `room_IT` -> `room_it`; :74 limit "none declared" to the main office (story PCs and desk phones are declared elsewhere: derek_computer, Kevin's Workstation, IT Monitoring Station, patricia_desk_phone, reception_desk_phone); :76 art path `assets/objects/water_cooler1.png`. Q1 b no longer matters (settled a).

### m4 Q3 b needed a machine: now settled with the cooler (tier 2). m5 fallback pc: `"name": "Desk PC", "observations": "A spare desk PC, switched off."`

## D88 settled (move from open questions to "Settled (D88, 2026-11-17)")
a. cooler, tier 2 is now the build (no tier choice left; tier 1 is just build order). b. extras leave after entropy_reveal_read out of sight. c. Maya routine (below). d. Fatima Begum Vindemiatrix, Graham Whitfield Umbriel. e. break room quiet_office.

### b. hide design (verified)
- Plain `global_variable_changed:entropy_reveal_read` `value === true` setVisible false fires while the player is in the server room (onPickup at scenario.json.erb:2205), two rooms away. The extras' mappings are always live by then: the only route to the server room passes through the main office (rooms load on door open, npc-lazy-loader.js:96-105).
- Reload: npcVisibility restored before register (mapping-patterns.md section 3; state-sync.js:548-550), and reload spawns in reception (intentional), so they never appear.
- Replace the old reception/main-office room re-hides (they would fire in view). Use onceOnly re-hides on `room_entered:server_room` and `room_entered:it_room`, condition `globalVars.entropy_reveal_read === true`; build renders the IT room south-door camera view to confirm no main-office desk is in frame, else drop the it_room one.
- KO: the hide applies whether or not KO'd (body leaves out of sight). Every other mapping on the extras carries `!globalVars.<npc>_ko`. No show mapping, so no needs set before show. Render the seated hide (sofa fix, GO 52-53).
- No m03-style second turn event exists in m01 (only the global).

### c. Maya routine (verified)
- Classes: no itemsHeld, no challengeOnSight anywhere, no conversation-mode mapping, not key source. talk_to_maya is `optional: true` (scenario.json.erb:228-233) so validate_office_life.rb required_tasks (:156-166) excludes it; her ink's only complete_task is talk_to_maya; `#unlock_task:inform_safetynet_operation_shatter` is an unlock (HaX task), not counted. V2 (check_story_npcs_leave :433-453) is clear for a leash into the main office.
- Open-conversation rule: NPC record has no chatBackground (room-level only, maya_office :1882-1885); ink has no Background line; no conversation_closed:maya_chen mapping exists; globals her ink sets (talked_to_maya, discussed_operation) drive no mapping (discussed_operation only gates a HaX phone choice, m01_phone_agent0x99.ink:149). Other ink mentions of Maya (Sarah :129, :154; briefing :147, :209, :220; HaX :370, :809-850; debrief) place her office, not her. Staff directory text (:1214) lists offices. Her notes (:1929) and voicemail (:1791) do not need her there. HaX attack/KO texts (:702-715) place nothing. No cutscene moves or hides her.
- Privacy choice: she leaves ONLY AFTER the tip-off (option 1). Marker: global `discussed_operation` (declared :2278), set in Maya's ink knot `operation_details` and on the "Tell me everything" choice in `informant_reveal`. Ink global writes sync at once (npc-conversation-state.js:596-620) before person-chat emits `conversation_closed:maya_chen` (person-chat-minigame.js:1987-1997). The informant reveal itself (`informant_reveal`, "I'm the one who contacted you") is reachable only in the first conversation (met_maya set at first choice), which is always at post. Why not option 2: the engine opens a chat wherever the NPC stands (npc-needs.js:1434-1444) and has no room gate for talk; it would need edits to voiced informant ink in the deploy-gate mission. Residual to state: later hub topics (derek_intel, patricia_story, tactical_advice) can still play away from post; her re-talk opener "Is it safe to talk?" (low and wary) fits. `warned_about_derek` is an ink-only VAR (used in maya and kevin ink), not a global; rejected adding it as a global.
- Shape (all on Maya; append at end of her own eventMappings, she has none today):
  - `"needsHome": { "room": "maya_office", "x": 2, "y": 4 }`, `"needsRooms": ["maya_office", "hallway_east", "main_office_area"]`, `"needsSpeed": 70`.
  - `"needs": { "thirst": { "decayPerMin": 0.1, "urgentAt": 30, "initial": 100 } }` (decayPerMin must be > 0, schema :4848, validate_npc_needs.rb:1287). T1 about 700 needs-minutes, so she never leaves on her own; after the trip restores 70 the next one is about 600 needs-minutes away. Planner must measure needs-minute to real-second mapping (measurement-recipes.md section 10) and state it.
  - Break: `{ "eventPattern": "conversation_closed:maya_chen", "onceOnly": true, "delayMs": 2000, "condition": "globalVars.discussed_operation === true && !globalVars.entropy_reveal_read && !globalVars.m01_staff_alarmed && !globalVars.maya_ko", "needs": { "set": { "thirst": 20 } } }`. A false condition does not use up onceOnly (mapping-patterns.md section 3). Reload: levels reset to 100, the once key is saved, so she stays at post.
  - No chatter, no exchanges, no interests/workarounds/magnet. Cooler offWhen m01_staff_alarmed also sends her home. Capacity 2 full: she waits at post (no queue).
  - Attacked mid-walk: no carried item, stays where she fell while KO/hostile, walks home once available (npc-needs.js:1235-1239, :1418-1431). Existing hostile block unchanged. D84 count: one moved existing NPC.
  - People table row: class "optional flavour, free (D84 b)"; gate column "found at post first: first-talk break gated on discussed_operation; no beat needs her at post".
- Tests: scripted runs poll `window.__test.needs.state('maya_chen')` before each interact until atPost true and job null or home (null state counts as at post), timeout fails the step and records last state; never setManualClock. Live: found at post first (fresh and after reload), away-talk three ways (mid-walk, waiting, at the cooler: background is the main office, she resumes trip), attack at the cooler.
- Maya routine line: none new. Her trip is silent; any line is existing ink. SPOKEN_LINES: add a "Maya: no new lines" note; clip counts unchanged.

### e. break room quiet_office already in 4.1.

### Clip counts after M2 rename: unchanged, 22 (2 barks, 4 talk, 8 pool, 8 exchange). Tier 1 subset 6 if the build stops early.

## Writing rules
PLAN.md standalone: no "round", "R1", "review", "M1"/"m3" or "GO 66" style references (remove existing "review m3", "PLAN_REVIEW_R1.md, Outcomes", "Checked in round 1", "moved in round 1", "GO 66"). UK English, no em/en dashes, no model names. Don't quote PINs/passwords.

## Assumptions to carry into the report
- Assumption: "KO guards" means every non-hide mapping on the extras carries `!globalVars.<npc>_ko`; the hide itself is unguarded.
- Assumption: the tip-off is the Operation Shatter detail plus the informant reveal; later hub topics away from post are accepted.
- Assumption: decayPerMin 0.1 gives effectively one trip per session; needs-clock to real-time ratio not yet measured.
