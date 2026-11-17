B 1 / M 8 / m 10

# Office life sims build plan: review round 2 (design, UX and engine)

Plan reviewed: `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` at fe6c204bb (the diff from 69a77f696 touches only the plan, so its engine line numbers still hold). Missions plan: `plan/office-life-missions` at 90e135d49 (abbreviated OLMP). The review is static: code, maps, tests and a scratch run of `scripts/check_door_alignment.py` on the five-room layout. No live game was run.

Verdict: the slices are well sized and the audit is accurate, but SIMS-3 does not prove the m02 patterns OLMP asks the showcase to prove first, and two of the brief's narrowings rest on a casting rule the project does not have.

## What was checked and holds

- Audit spot checks: `tick` npc-needs.js:1006, `update` 606, `_tickNpc` 1257, `_roomForbidden` 1197, `_avoidRooms` 1209, `_permitted` 1229, `_useCandidate` 1567, `_findExchange` 2685, `_finishExchange` 2751, `_advanceJob` 3119, `_revealOutput` 3512, `_tickPrints` 3672, `_abortJob` 3700, `_goHome` 3771, `_maybePair` 3863, `getState` 4542, `onArrived` 630, `isAvailable` 1086; validator `check_magnets` 260 (warning text at 272-274), `check_print_habits` 346, `expand_presets` 627, `check_pool_lines` 676, `check_exchanges` 826, `check_social` 895, `leash_rule` 1086, `leash_reach` 1116; `core/game.js` 120 (`room_it`) and 138 (`room_security`); `player-combat.js:456`; `game.rb` 486-523, 541-554, 1323, 1603. All match.
- Doors: the scratch layout gives office north (48,32) = IT south (48,32) and IT east (304,-176) = facilities west (336,-176); kitchen and lounge pairs unchanged. The facilities office spans x 320 to 640, y -256 to 64, over the lounge's top two rows, as the plan says.
- Room tone: `room_it` maps to `it` and `room_security` is absent from `js/data/room-tones.json`, so `roomToneTypes` is needed.
- Every file in the standard node set exists. The README timings in 3.5 match the decay arithmetic (for example Nisha's work (85-50)/10 = 3:30, Keith's thirst (72-40)/4 = 8:00), and the pizza's tempt band is 40 < level <= 70 (`_tempting` npc-needs.js:802-809).
- Sprites: the four keys in 3.4 have sit frames, a headshot, a talk sheet and visemes, and their concept prompts match the stated heritage and age.

## Blocker

### B1. SIMS-3 does not show the three patterns OLMP asks the showcase to prove for the m02 pilot

Evidence. OLMP section 9, "Alignment with the showcase" (OLMP lines 666-673), names the patterns "the pilot uses that the showcase should show first" and says they are to be added to SIMS-3:

1. Gary option (a), which OLMP 6.2 recommends: an NPC whose only need is met by its own post object (`needsHome: "gary_mug"`, a hand-written private owned cup affordance), so it never moves, that prints through a mapping's `needs: { print: { producer, forget: true } }` on `conversation_closed:<id>` with a `delayMs`, and whose room kettle has `affordance: false`.
2. The coupled break: a mapping on `npc_left_post:<a>` with condition `data.targetId === '<object>'` that sets the partner's need low with `needs: { set: {...} }`, so two NPCs meet at one capacity-2 chatter object (OLMP 6.4).
3. One pool line per speaker per break with `chatterCooldownMin: 2`, with hand-written `restores: 40` and `useSeconds: 30` (boiler) and `25` (cooler), to check the rhythm reads as conversation (OLMP 6.4, "Long enough to talk" and the 20-minute exit test).

The plan's section 2 m02 rows (plan lines 107-109) instead say "Gary walks to his kettle and copier inside IT", which is OLMP's option (b), the one OLMP does not recommend. Neil (plan line 202) walks to a boiler and a fridge, prints through `printHabit` and a lever with `forget: false` (line 304), and Neil and Nisha meet through a note that sets both needs (line 304), not through `npc_left_post`. No slice sets `chatterCooldownMin` or the hand-written restores. OLMP's two staff-room NPCs also sit at table chairs from tile homes (OLMP 6.4, "seating finds each chair from the home cell"), which no showcase NPC does at a table.

Fix. Rewrite SIMS-3's m02 rows and cast so the showcase proves all three, for example:
- Neil becomes the Gary (a) pattern: `needsHome: "neil_mug"` (a declared cup on his desk with `affordance: { satisfies: "caffeine", restores: 30, useSeconds: 4, capacity: 1, useSound: "drink_gulp", private: true, owners: ["neil"] }`), one need, `swivel: false`, `it_boiler` given `affordance: false` for him by being out of reach (or a second boiler-free variant), and a mapping `conversation_closed:neil` with `delayMs: 6000`, `onceOnly: true` and `needs: { print: { producer: "it_copier", forget: true } }`. Live proof as OLMP 6.2 asks: his position within 2 px of his home for 10 needs-clock minutes, and his conversation opening at any moment.
- The walking pair moves to two NPCs posted at tile homes on table chairs in one room (the IT room's waiting chairs or the facilities office's side chairs), with the two coupled-break mappings, `chatterCooldownMin: 2`, the boiler at `useSeconds: 30, restores: 40`, a second capacity-2 chatter object at `useSeconds: 25`, and OLMP's exit test (a shared break in at least one of any three 30-second windows over 20 minutes with the player in the room).
- Keep the allow and deny leashes, the exchanges gated both ways, `officeType` and `affordance: false`, `hush`, `roomToneTypes` and the paper leak on whichever NPCs fit.
- Section 2's m02 row then reads "Gary (a), the staff-room pair and the coupled break", and the plan says which of OLMP's three points each new NPC proves.

## Majors

### M1. The plan misreports OLMP's gaps and slice numbers

Evidence. Plan line 7 lists OLMP's gaps as E1 to E5 and says E1 is "a live attack probe in its own `test_needs_attack` scenario". OLMP section 9 (OLMP lines 655-664) has E1 to E6; E1 is "A live probe run in the showcase as slice SIMS-2 (`test_needs_sims`, with the hostile-from-start case in `test_npc_needs`)" and E6 is the arrival fault, "slice SIMS-1 ... an arrival check about 35 lines". OLMP's alignment list (668-669, 774) uses SIMS-1 for the arrival check and SIMS-2 for E1, the reverse of this plan, and cites SIMS-4 to SIMS-7 with meanings this plan does not give them (671). Plan line 7 cites the rollout as OLMP 6.11; it is 6.14 (OLMP 6.11 is the m02 attack probe). OLMP 6.11 step 2 also asks for a case the plan's SIMS-1 lacks: a knocked-out partner whose partner's next coupled break goes ahead alone, and step 3's "a knock-out prints nothing" for the Gary (a) print.

Fix. Correct line 7 (E1 to E6, E6 = SIMS-2 here, rollout 6.14). Add a short "Differences from OLMP" paragraph to section 2: E1 runs in its own `test_needs_attack` rather than the showcase (a neutral showcase with no combat beats, which is a sound reason), the slice numbers differ, and a request to the OLMP owner to update section 9's numbers. Add to SIMS-1 a coupled pair (the B1 mappings) where one partner is knocked out and the other's next break goes ahead alone, and a Gary (a) NPC knocked out before its `conversation_closed` print, asserting no slot is revealed.

### M2. The casting rule that cuts the reception and private office is not a project rule

Evidence. Plan 3.4 (line 189) says "A new NPC may not wear a player avatar". The six existing sims NPCs all wear starter avatars (`female_office_worker_v2`, `male_office_worker_v2`, `female_blowse_v2`, `male_nerd_v2`, `male_telecom_v2`, `female_scientist_v2`; plan Q4). The project's rules are narrower: AGENTS.md "Characters" (line 61) and the cast-diversity note give *named recurring* characters art of their own, and `README_scenario_design.md:2788` forbids two characters in one scenario sharing a sheet. Three starter sprites are unused in test_needs_sims and are cast as generic staff in many test scenarios: `female_security_guard_v2`, `female_telecom_v2` and `male_security_guard_v2` each have sit frames (their atlas JSON), a headshot, a talk sheet and visemes (`assets/characters/female_security_guard_talk.png`, `female_telecom_visemes.png`, `male_security_guard_visemes.png`), the same kit the existing six use (sims.erb:486-487). So seven sprites are free, not four. Section 5 "Cut, and why" (line 390) and Q3 drop the brief's reception and private office for want of sprites, though the maps exist: `room_ceo` (game.js:108, one executive desk and chair, a sofa, no logo, and already a `room_ceo` entry in room-tones.json) and `small_office_room1_1x1gu` (game.js:129, one desk with a conditional `pc5`). The reception argument (counter against the back wall, `room_reception.json` `reception_table1` at tile row 3) holds for a seated receptionist but not for a tile-home receptionist standing in front of the counter, and `room_reception` is also in the tone table.

Fix. Replace the rule in 3.4 with the project's (no shared sheet in one scenario, no named character's own art, no hood-down hacker or Netherton look), list the seven free sprites, and either add a slice for a private office (`room_ceo`, a manager with a screen habit and a desk phone, private to the manager, reached from the office or the IT room) and a reception (`room_reception` with a tile-home front-desk officer on `female_security_guard_v2` and a visitor book note), or put the cut to the user as an open question with the true reason (scope, not sprites). Keep the cast diverse across the new hires (two of the three new NPCs are white men in their 40s and 50s).

### M3. Traits, routines and schedules are cut against the brief without an open question

Evidence. The brief asks for "a varied cast with traits and schedules" and "routines". The plan cuts traits and routines (line 386-387, "no mission in OLMP needs them") and parks schedules in the backlog (SIMS-6, Q7). The reason the plan gives is not the brief's test. A better reason exists and is not cited: the user's own picks of 2026-11-06 left traits and routines unmarked and called timetabled schedules "maybe later" (memory note office-life-next-and-mission-skill). The plan has open questions for schedules, the summon and refills, but none for traits or routines.

Fix. Cite the user's 2026-11-06 picks as the reason, and add an open question that sets the orchestrator's brief against those picks: build traits (a thin bundle over `screenHabit`, `printHabit`, `needsCompany`, `leftBehindChance`, `chattiness`) and one routine (a tea round: fetch mugs, boil, deliver) now, or keep them cut. Recommend one; the user decides.

### M4. Two built, non-security behaviours are left out on a reason that does not fit the brief

Evidence. Plan 1.2 (lines 82-83) keeps out row 36 (work judged against resources, frustration, the outage kick, check visits) and row 38 (the `social_media` need and the phone `self` job) because "no campaign mission uses them". The brief asks for every built office-life behaviour to be visible. A dead machine that a frustrated colleague kicks and a colleague checking a phone on a break are ordinary office life, not security beats (unlike workarounds, awareness, USB and sign-in, which 1.2 rightly keeps out). Both can be built from data only: `_countFailure` npc-needs.js:2226 and `_tickKick` 2333 for the kick, `_socialCandidate` 2148 and `_startSelfJob` 2905 for the phone.

Fix. Add a small data-only slice (or fold into SIMS-4): the vending machines get a wall socket with `offWhen`, Keith gets the work-frustration fields so a switched-off machine draws a kick and a grumble, and one NPC gets a `social_media` need with `policy: { social: "blocked" }` on its PC (the plan's own note at line 83) so the phone break shows. Tour rows and tasks for each. Keep Friendface out.

### M5. `nisha_pc` and `keith_pc` are `pc5`, which has no preset

Evidence. `js/data/office-presets.json` `desk_pc.types` is `["pc", "pc3", "pc10", "laptop", "workstation"]`; `presetIdFor` (office-presets.js:49-58) matches by exact type unless `officeType` is set. Plan 3.3 (line 181) makes both PCs `pc5` to claim the facilities map's conditional PCs (`room_security.json` `conditional_table_items` pc5 at (2.8,3.8) and (6.1,3.8)) and says they get the desk_pc preset; SIMS-3's expected validator output (line 306) and both test lists (lines 307, 322) count them. As written, Nisha's and Keith's `work` need has no source.

Fix. Add `officeType: "desk_pc"` to `nisha_pc` and `keith_pc` (it also shows `officeType` on a PC), and say so in 3.3 and the expected validator lines.

### M6. Neil does not walk to the copier when his page has gone

Evidence. Tour row 2:20 (line 472) says "take the page from the copier tray before Neil gets up (he waits 20 to 30 s)" and "Neil walks to the copier, finds nothing, says so". `_tickPrints` (npc-needs.js:3676-3684) handles a page taken before its fetch: "Taken first: the owner finds it gone at the due time and does not walk". `npc_print_gone:neil` fires at the due time with Neil at his desk.

Fix. Rewrite the row: take the page within 20 to 30 s of the lever; at the due time Neil, still at his desk, says his line (`take_neils_page`). Word the bark for someone sitting down ("Who's had my printout?"), and take the screenshot of Neil at his desk beside the empty tray.

### M7. The `hush` beat proves nothing as written

Evidence. A pool's `hush` acts only on a chat: it ends a pair or queue chat once the player is within range (npc-needs.js:3898-3901, 3957-3967), and `_startExchange` clears it so an exchange is never hushed (2718-2721). Tour row 3:30 (line 474) and SIMS-3's pass line (line 309) test "Nisha says nothing while the player stands beside her" as she walks in alone to fetch a print. A lone NPC on an errand says nothing whether or not her pools hush.

Fix. Put `hush: true` on the pool the pair actually speaks (`tea` on both speakers) and make the proof: after both exchanges are heard, read the Tea Round note a third time, wait for a pool line at the boiler, walk the player up to them, and assert the chat ends with the `hushed` reason (`_endChat`, npc-needs.js:2784) and no further line. Drop the "stand beside Nisha" row.

### M8. SIMS-2's cause analysis leans on seating, which the code largely rules out, and its reproduction is synthetic

Evidence.
- Seating fetches a chair only while `needsStop` returns a stop: an own-desk job, `returning` at the post, `using`, or `idle` at the post (seating.js:1745-1760, and 1970-1972 refuses while a move is under way). A walk home away from the post has no stop, so the 70 ticks of `return_resumed` at (116,156) (plan line 96) are `_watchReturn` (npc-needs.js:3790-3800) re-issuing a stalled walk home, not a fetch taking turns with it.
- When an idle NPC at its post starts a job, the fetch's move is still owned by `needs` (seating.js:2029-2033, and advanceFetch does not cancel it when the stop is gone, 2057). But an arrival during the windup is taken off `_arrivals` at npc-needs.js:1318 and dropped when the windup branch returns (1342-1349), and `_leavePost`'s move then replaces the fetch's path (npc-behavior.js:2980-3020). So cause 1 needs a path the plan does not name.
- Cause 2 (an early end of the job's own move: npc-behavior.js:1241-1245, with async paths at 1724-1752) carries the matching move id, so only the 48 px guard catches it.
- The live proof's reproduction (plan line 295) injects an owner-`needs` arrival through the test bridge. That proves the new guard rejects it; it does not reproduce the fault on the build as it stands, which the slice rules require.
- The "replaced move" re-issue rule (line 290) has no known trigger: besides the needs system, only seating's fetch issues a `needs`-owned move, and only in stop states where the needs system has no move pending; `job.deadline` (npc-needs.js:3110) already fails a lost walk.

Fix. Before coding, add a log line on every owner-`needs` arrival (`fromSeating`, path length, distance to `_goToStayDest`) and run the baseline capture until the fault repeats, so the fix targets the real path. Make the distance check the primary guard, keep move ids as the second, drop the replaced-move re-issue and `move_lost` rule (or name its trigger), and add a reproduction of an early path end (for example a two-room move whose planned path ends at the door, or a stubbed `_planMovePath` returning a short path) that shows `using` entered far from the cell on the current build and `arrival_far` after the fix. Correct line 96 to describe `_watchReturn`.

## Minors

### m1. Neil's PC and chair do not pair in room_IT

Evidence. `room_IT.json` `conditional_table_items` has `pc3` at (5.6,3.3), the right end of the upper desk; `conditional_items` has `chair-white-1-rotate3` at (3.8,4.9), under its left end. The matching pair is on the lower desk: `pc12` at (5.5,5.3) with `chair-white-1-rotate6` at (5.5,6.8). Plan 3.3 (lines 171-172) pairs pc3 with rotate3.

Fix. Claim `pc12` (with `officeType: "desk_pc"`, since pc12 has no preset) and `chair-white-1-rotate6`, or move one of them; keep the step 1 check.

### m2. Several starting positions sit on drawn furniture or by a door

Evidence (room_IT.json and room_security.json object layers; doors from check_door_alignment.py:63-65, east and west doors at room top + 80 px, tile row 2.5): `it_fridge` (7.5,7) is on `plant-large12-top-ani5` (7.7,6.8); `it_copier` (1.5,6.5) is on `chair-waiting-right-1` (1.0,6.2); `it_boiler` (7.5,1.6) sits next to the IT east door, and the kettle preset's queue cells (dx -1 and -2, dy 1) run towards the `servers3` table at (6.2,2.2); the facilities west door is at row 2.5, where a back-left-corner vending machine (42x60 px, about 1.3 by 2 tiles) would crowd it.

Fix. Give starting points clear of these (for example the fridge at (8.4,7.5), the copier at (1.5,8.2), the boiler at (8.4,6.0) on the east wall below the door, both vending machines along the facilities office's east wall), and keep the render step.

### m3. Some new pools have nothing that speaks them

Evidence. `greet` is never spoken by any engine path: it appears only in `PICTURE_CHATTER` (npc-needs.js:81) and the validator's `BUILTIN_CHATTER` (validate_npc_needs.rb:664), and OLMP 2 says it plays only at an affordance with `chatter: "greet"`. `grumble` plays only on a turn-back (`_grumbleTopic`, npc-needs.js:2089-2095); Neil and Keith avoid nobody and use no `offWhen` source, so their `grumble` pools never play. Keith's `vending` pool needs a machine with `chatter: "vending"`; SIMS-4's presets (line 318) set none, and queue chats read `aff.chatter` (`_tickQueueChats`, 4476). Voiced lines that never play still cost money.

Fix. Drop Nisha's `greet` pool or give one object `chatter: "greet"`; drop the two `grumble` pools unless M4's outage gives Keith a turn-back; set `chatter: "vending"` on the snack machine with `capacity: 2` or drop the `vending` pool. List only lines that play.

### m4. The `it_tea` group is invisible

Evidence. `_compatible` (npc-needs.js:3844-3848) lets any pair chat when either has no groups, and Neil and Nisha share `it_tea`; no NPC with another group ever meets them at the boiler. Plan line 109 counts "a group" as proved.

Fix. Either say the group is set for the pilot's form only and proves nothing here, or give a third NPC who can reach the boiler a different group so one pairing is refused (the two share the object in silence, npc-needs.js:3870).

### m5. `see_nisha_screen_open` ticks on the first tea, not the pizza

Evidence. Plan line 337 admits it ticks on her first leave; the Tea Round at 1:40 is that leave. A task in the pizza's slice that ticks three minutes before the pizza misleads a facilitator.

Fix. Key it on the pizza trip: a mapping on `npc_left_post:nisha` with `data.targetId === 'leftover_pizza'` that sets a global, and the task on `workstation_owner_left:nisha_pc` with `data.screenLocked === false` and that global; or rename it "see an open screen".

### m6. The tour sends the player away from the beat it asks them to watch

Evidence. Row 3:30 (line 474) asks the player to watch Nisha fetch her print in IT at 5:20 to 6:00; rows 4:00 and 5:00 send the player to the lounge and then the facilities office, and the 5:00 Vending Restocked note sets Nisha's hunger to 30 just as her fetch falls due, so she may go to the machine first.

Fix. Move the print-errand row after the vending row with a lever (a mapping on the IT Print Queue note for Nisha too), or reorder so the errand is watched before the pizza and the note's hunger set leaves Nisha out.

### m7. Forgotten IT prints never clear

Evidence. Neil forgets half his prints (`forgetChance: 0.5`) and nothing sets `shareAfterSeconds`, so forgotten pages stay on the four-slot tray (`_tickPrints` 3691-3696 is the only path that frees them); later prints fall back to cosmetic copies (test/js/npc-needs-slots.test.mjs, the "pool exhausted" case). Row 55 (`shareAfterSeconds`) is "not shown" anywhere.

Fix. Give Neil `printHabit.shareAfterSeconds: 240` and a tour line for it, which shows row 55 and keeps the tray working over a long session.

### m8. The new rooms' drawn cups are player drinkables

Evidence. `DRINKABLE_CUPS` (consumables.js:80-88) makes map cups (`office-misc-cup`) drinkable; room_IT draws three (one at (6.0,3.5), by Neil's desk) and room_security two on the desks. The `drink_a_coffee` task (line 308) counts only `kitchen_cup`.

Fix. Say in the README that the desk cups are drinkable (and that drinking "Neil's" cup has no reaction), or widen the task's condition to any drink.

### m9. Neil's print-gone line is an eventMapping bark

Evidence. Plan line 304. OLMP 6.3 notes an eventMapping bark "is voiced live, outside the batch". It is voiceable under the spoken-lines rule, but it will be missed by a pool-based voicing batch.

Fix. List it in SIMS-3's spoken-lines count as a bark, so the voicing step picks it up.

### m10. SIMS-2's plumbing is under-specified

Evidence. The world's `moveTo` (npc-needs.js:5088-5090) builds a fresh options object, so `moveId` has to be added there; `cancelMove` (npc-behavior.js:3038-3055) must clear `_moveId` as `_triggerGoToStayArrival` does; `onArrived` (630) takes only `owner` today. With the arrival checks in `_advanceJob`, `_advanceQueued` and the walk home, "about 40 lines" in npc-needs.js is low.

Fix. Name `cancelMove` and the world `moveTo` in the engine list and size the slice at about 70 to 80 lines (smaller if M8 drops the re-issue rule).
