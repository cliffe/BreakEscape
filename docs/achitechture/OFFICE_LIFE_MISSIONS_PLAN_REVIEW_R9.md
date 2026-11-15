# Office life missions plan: review round 9

## Verdict

Not ready for stage 4. Most of the m02 pilot is wired as the engine behaves, and its section 6.1 inventory matches the Tiled maps: positions, layers and chair facings all check out. The presets, the claim rules, the coupled-break mapping, the exchange gates, Gary's print command and the KO ordering behave as the plan says. The V5 event lists also match the literals under `public/break_escape/js/`.

Two things break it. First, the staff-room phone contradicts the mission's central intrigue: Bernie's clue that only four internal phones are reachable tonight, and the question of who rang security. Second, the phone as specified fails the needs validator with an error.

Past the blockers, the pilot will rarely be heard on the normal route. The breaks cluster about every 13 minutes, not every six to eight, and the one-shot phone call is likely to be walked past. Gary's printout contradicts his own line and the drill clue, and it lands silently in the middle of his conversation. The pair also sit through Reeves's 03:20 arrival, yet the plan has them know nothing of him. Gary options (a) and (b) are accurate on lines and clip counts: line 80 and line 764 are both cached narrator clips, and the observation at `scenario.json.erb:2035` is text only. Two corrections apply: Gary stands in mid-floor and is not seated, and option (a) gives the mug no sound.

## Blockers

**B1. The staff-room phone breaks the "who made the call" intrigue and contradicts Bernie's phone clue.** Section 6.4 (plan line 462), 6.5, 6.13 item 4.

- Evidence:
  - `scenarios/m02_ransomed_trust/scenario.json.erb:27-29`: "Someone phones security and pulls the player's booking ... WHO made that call is the intrigue."
  - `scenario.json.erb:936`, HaX: "Two minutes ago someone rang the security desk from an internal extension".
  - `ink/m02_npc_receptionist.ink:282-284`, Bernie: "there's four internal phones on this side of the building that aren't behind a locked door tonight. Three of them are on my desk. The fourth one's in the boardroom."
  - `ink/m02_npc_security_guard.ink:277`: the player asks Val which extension.
  - The staff room has no lock (rendered scenario: `staff_room` has no `locked` or `lockType`).
- What goes wrong:
  - The plan adds a working internal phone in the unlocked room next to the boardroom. That makes a fifth phone, and Bernie's deduction becomes false.
  - The plan rings that phone on the walk back from Kim, just before `talk_to_gary`. A few minutes later HaX says someone rang security from an internal extension.
  - A player who heard the porter on the phone now has a new suspect, and he is innocent. The burn is the mission's turn, and this undermines it.
- Fix:
  - Drop the staff-room phone and the call from the pilot. Use the porter's voiced phone beat in m06, which has no phone clue.
  - If a phone call must stay in m02, it needs a canon edit to Bernie's line, which is voiced, plus a user approval item. That falls outside rule 3 and the "no lines changed" claim.
  - Either way, remove the phone from 6.0, 6.5, 6.8 (call knots, 6 clips), 6.9 (2 `heard_` keys and the ring mapping), 6.10 and 6.13.

**B2. The phone as specified fails the validator with errors.** Section 6.3 (porter's post is a tile), 6.4 (phone "on the staff room's north wall or counter").

- Evidence:
  - `scripts/validate_npc_needs.rb:173-177` errors when the phone owner's `needsHome` is not an object in the phone's room: "needs a needsHome object in room ... (the owner answers from its post)".
  - `validate_npc_needs.rb:186-190` errors when the phone is more than 1.5 tiles from the owner's post.
  - The engine reflects the same rule. `npc-needs.js` `_ownerCanAnswer` and `_beginCall` let the owner answer from his post without moving.
- What goes wrong:
  - The porter's post is a tile home at the east table (6.72, 5.78), and the phone is on the north wall, about four tiles away.
  - Stage 4 cannot reach 0 errors.
  - Even with the error ignored, the porter would hold a call seated at the table while the phone sits across the room.
- Fix: if a phone survives B1, make the porter's post an object (a declared spot on the east table, or the phone itself placed on the table), and put the phone within 1.5 tiles of that post. Give the phone a `useFrom` to the side of his chair. Add the expected validator results to 6.10.

## Majors

**M1. The break rhythm is about 13 minutes, not "every six to eight", and the second break of each pair is mostly silent.** Section 6.4 (plan line 459), 6.8, 10.

- Evidence: the plan's own numbers. The `restores` values come from `office-presets.json` (kettle 70, cooler 70), and the cooldown is `npc-needs.js:73` (`CHATTER_COOLDOWN_MIN = 5`) with `_pickBark` at 2638-2650.
- The first-hour sequence:
  - At about 1 minute the domestic's thirst (40, decay 5, urgent at 35) sends her to the cooler, and the coupling sends the porter too.
  - At about 2 minutes the porter's caffeine (45, decay 5, urgent at 35) takes both to the boiler.
  - Each use tops the main need back to 90 to 100. At decay 5 per minute that need next turns urgent after about 13 minutes, so the next pair of breaks comes at about 14 and 15 minutes, then about 27 and 28.
  - Each NPC's pool line starts a 5-minute cooldown. At the boiler break a minute after the cooler, both are still quiet, so they show picture chat (`_pickBark` returns a picture) unless an exchange is due.
- What goes wrong:
  - For about 25 of every 26 minutes the pair sit still and say nothing.
  - A player who crosses the room in a few seconds on the walkthrough route mostly sees two people seated.
  - The 24 pool clips, 6 per pool, cannot be heard in one playthrough: each NPC speaks about one pool line per 13-minute cycle.
  - This works against the question 6.0 has to answer, which is whether a player sees and hears enough to judge office life worth rolling out.
- Fix:
  - Retune for a 5 to 7 minute rhythm. Options: lower the restores (kettle and cooler `restores` about 35, or `useSeconds` and decay chosen so each main need returns to urgent in about 6 minutes); put the two main needs out of phase by about 3 minutes rather than 1; set `chatterCooldownMin` to 2 on both NPCs.
  - Cut each pool to 3 or 4 lines.
  - Give stage 4 an exit test: the T1/P report and a 20-minute live sample showing a paired break in at least one of any three 30-second windows taken on the walkthrough route.
  - Correct the totals in 6.8 and the stated rhythm in 6.4.

**M2. The phone call is a one-shot that the normal route usually misses.** Section 6.4. This stands if the call survives B1, or for any phone beat moved to m06.

- Evidence:
  - The ring mapping is `onceOnly` on `room_entered:staff_room`, which fires as the player crosses from Kim's office towards the IT door.
  - The owner picks up 2.25 s after the first ring (`npc-needs.js:172`). The lines play one by one and are voiced only while `playerHears` holds: same room, lit, within 160 px, clear line (`npc-needs.js:4245-4290`, `OVERHEAR_RADIUS` at :47).
  - If any line is missed, `heardAll` is false and the knot is not marked heard (`_finishCall` at 4296-4315).
  - If the porter is at the boiler with the domestic, which the coupled breaks make likely, nobody idle at a post can answer and the phone rings out (`_claimAnswerer` at 4100-4125, `_ringOut`).
- What goes wrong:
  - A player holding Bernie's key walks through in a few seconds and into IT, so the 4-line call mostly plays out of earshot.
  - The ring has already fired, so the call never plays again. Its 6 clips are paid for and rarely heard.
  - The domestic's 2-line message knot plays only when the porter is away and she is not, and the coupling works against that.
- Fix:
  - Ring on a moment when the player stays in the room: for example `global_variable_changed:read_handover_board`, or the first staff-room entry after the IT door opens.
  - Replace `onceOnly` with `maxTriggers: 3` and the condition `!globalVars.heard_<knot>`, so the call comes again until it is heard.
  - Drop the domestic's message knot, or accept it as a rare variant and leave it out of the clip budget.

**M3. Gary's printout contradicts his own line and the drill clue, and it lands unseen in the middle of his conversation.** Section 6.2 (a) (plan line 412), 6.6 (plan line 489).

- Evidence:
  - `ink/m02_npc_gary_whitlock.ink:351`: "Printing those. All seven." The page Gary has been printing is the seven warning emails.
  - The plan's page is a downtime-procedure cover sheet "with Gary's handwritten note that the drill was never run".
  - The handover board (`scenario.json.erb`, the `handover_whiteboard` text) and snag list item 21 say Friday's fire drill did run, with doors on free egress under a security override. That drill is the insider's cover and a core clue.
  - A handwritten note cannot be on a page that has just come out of the copier.
  - `#complete_task:talk_to_gary` fires inside the conversation (`m02_npc_gary_whitlock.ink:198, 267, 290, 313, 379`), so the mapping prints at once.
  - While a conversation is open, room tone is ducked, and `onRevealed` plays no copier sound when ducked (`npc-office-visuals.js` `onRevealed`; `office-room-tone.js:120-133`).
- What goes wrong:
  - The page breaks the plan's own rule ("contradicts none"), and it reuses the word "drill" in a way that muddies the clue players need.
  - The page appears silently while the conversation hides the room. A player closing the chat, then reading HaX's burn warning 4 s later, has no reason to look at the copier, so the beat is missed.
- Fix:
  - Make the page the eighth copy of one of his warning emails, or a reply he has printed: no new facts, no "drill", nothing written by hand.
  - Move the trigger to `conversation_closed:gary_whitlock` with `condition: "globalVars.cover_burned === true && globalVars.gary_ko !== true"`, `onceOnly: true` and `delayMs` of about 6000, so the copier runs, audibly, after HaX's 4 s text.
  - Correct "a moment after the conversation" in 6.2 to match.

**M4. Two staff on break at the boardroom door all night cannot "know nothing of Reeves", and an hour-long break works against the paper-night premise.** Section 6.3 (plan line 448), 6.0, 6.1.

- Evidence:
  - The visitor log (`scenario.json.erb:1481`) and Val's night log (`scenario.json.erb:3332`) put Reeves's arrival at 03:20.
  - The boardroom's only door is the staff room's west door (rendered `conference_room` connections: east only).
  - The game opens at "Ten past four in the morning" (`ink/m02_npc_receptionist.ink:66`), and the plan says the pair took their break at 03:00 (section 6, first bullet).
  - Sister Doyle: "The machines still run. Nobody's watching them." (`ink/m02_npc_ward_nurse.ink:145`).
- What goes wrong:
  - The pair would have watched Reeves walk past their table to the boardroom.
  - A player who asks them anything about the night meets a plausibility hole, or a dialogue writer fills it with a clue, which rule 2 and 6.3 forbid.
  - A porter described as "the hospital's network" spends the whole crisis seated with a mug, which undercuts the stakes Doyle has just set.
- Fix:
  - Set their break as starting just before the player arrives: "came off the four o'clock run", which is after 03:20.
  - Give the porter one conversation line that saw nothing ("came up the back stairs, been on the wards since two"), and the domestic one ("only just sat down").
  - Have the phone call, if kept in m06 form, or one pool line say the break is short and the next run is coming.
  - Record in 6.3 that neither saw the boardroom door before about 04:00.

## Minors

**m1. Section 6 never sets `officePresets: true` for m02, and Gary's mug has no sound.** Sections 6.2 (a), 6.5, 6.12.

- Evidence:
  - `office-presets.js` `presetsOn` and `resolveAffordance` return only the hand-written affordance unless the scenario sets `officePresets: true`. The plan's boiler `officeType`, the cooler preset, the copier's `outputSound` and the conference cooler's `affordance: false` all depend on that setting.
  - `npc-office-visuals.js:330-345` plays a use sound only from `affordance.useSound`, and the plan's `gary_mug` affordance has none.
- What goes wrong: an implementer working from section 6 alone gets no presets. Gary's sip is silent, against "a cup icon and a quiet sound".
- Fix: list `"officePresets": true` in 6.12 beside `roomTone`, and add `useSound: "drink_gulp"` to the `gary_mug` affordance.

**m2. Gary is standing in mid-floor, not in a chair.** Sections 5 (m02 row), 6.0, 6.2 (a).

- Evidence:
  - Gary's spawn is (6.3, 5.8) (rendered scenario).
  - The IT map's chairs are at (4.75, 5.5) and (7.69, 5.56) (`room_hospital_office_it.json`). Seating sits a needs NPC only within 36 px of a chair (`seating.js:1732`), and those chairs are about 45 to 50 px away.
  - Screenshot `02_it_department.png` shows him standing between desk and workbench.
  - His spawn is about 11.5 px from the nearest cell centre, against `HOME_EPS` of 12 (`npc-needs.js:30`).
- What goes wrong:
  - "Without leaving his chair", "a seated NPC stays seated" and "he never stands" describe something that does not exist.
  - The stage 4 proof ("within 2 px for 10 minutes") depends on the snapped approach cell landing within that margin.
- Fix:
  - Say "standing at his post".
  - Move Gary's spawn to a cell centre, (6.5, 5.5), or seat him on the (7.69, 5.56) chair. Seating him would also make the cabinet catch's "a chair creaks round" true.
  - Prove the 2 px rule against the snapped cell.

**m3. The printout slot can take a desk note's sprite.** Section 6.5 (`it_copier_page`).

- Evidence:
  - `core/rooms.js:258-285`: `findMatchFor` gives a declared object the first unreserved Tiled sprite of its type, even when a position is given (2416-2425).
  - IT has three `notes` sprites (`room_hospital_office_it.json`: notes1, and notes2 twice), and three declared `notes` objects already claim them: `gary_desk_printouts`, `password_sticky_note` and the photo frame.
- What goes wrong: if `it_copier_page` is listed before them, it takes a desk note's place and position, and an existing note falls back to its own position.
- Fix: declare the slot last in the IT object list, or give it a `sprite` with no Tiled twin in IT. Check with `room-snapshot.mjs`, as 6.5 already plans for the other declarations.

**m4. The porter's "owned" mug is a free consumable for the player.** Section 6.4 (plan line 458).

- Evidence: `core/rooms.js:2891-2909` makes every unreserved Tiled cup a takeable drink ("still warm. Take it with you"). `office-misc-cup` sits at (6.56, 5.79), at the porter's place.
- What goes wrong: "it now has an owner" is not wired. The player can lift the seated porter's drink from in front of him, and nothing reacts.
- Fix: either accept this and say so (a free drink is in keeping with "people on a break do not challenge you"), or add an optional one-line bark on its pickup, in the same form as the lanyard bark, and count it in 6.8 and 6.9.

**m5. The E1 probe's location is inconsistent.** Section 9.

- Evidence:
  - Section 9's E1 row (plan line 659) proposes "a small `test_needs_attack` scenario".
  - Section 6.11, section 9's alignment bullets and SIMS-2 (`build/ol-sims:docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md`, the SIMS-2 section) run it in `test_needs_sims`. SIMS-2 puts the hostile-from-start case in `test_npc_needs`.
- Fix: rewrite the E1 row to name SIMS-2 in the showcase and the hostile-from-start case in `test_npc_needs`.

**m6. m01's later merge with format-1 keys collides with the hardening plan's alias rule.** Sections 6.14 and 8.

- Evidence: `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md:27` keeps the alias list empty because none of the four deployed scenarios (m01 among them) uses `phoneOwner`, `screenOwner`, `affordance.owners`, `affordance.private`, `screenHabit` or `printHabit`. It promises a test that fails if one starts to.
- What goes wrong: if m01's office-life work merges before 8b with format-1 names, that test fails, and 8b needs aliases for a deployed game.
- Fix: in section 8, require m01's pass to write post-8b names, or to wait for 8b, and send the hardening session a note now.

**m7. The IT-door pick happens in plain view of two staff who do not react.** Section 6.12 (walkthrough step 12).

- Evidence: walkthrough step 12 (`TESTING_WALKTHROUGH.md:124-125`). The pair sit three to four tiles from the IT door, and during breaks they stand at the counter or cooler facing each other (6.4, 6.5).
- What goes wrong: a lockpick minigame beside two seated staff with no response reads as the NPCs not working, more than as people choosing not to challenge. Val's catch has already taught the player that staff notice picking.
- Fix: say in 6.12 that this is intended, and give the walkthrough line a reason ("they have their backs to the door"). Keep the posts facing away, as planned, and check in stage 5 that neither break cell faces the east door.

## Nits

**n1.** Sections 2 and 6.0 call "has not moved from the side of bed two since three o'clock" a narrator line. It is Doyle's `observations` text (`scenario.json.erb:1623`).

**n2.** Section 6.3 quotes HaX's "no matter how you came by it" for the staff-room lanyard. That text belongs to Gary's spare (`scenario.json.erb:958`). The staff-room lanyard's text is "Nobody questions one, which is exactly what Gary's been writing emails about."

**n3.** Section 6.2 (b) item 4 quotes the credits line as "Assaulted at his desk". The line goes on to add "keycard taken" after a dash (`scenario.json.erb:201`). The replacement should keep "keycard taken".

**n4.** The exchange `night_watch_paper` ("a ward with two nurses doing obs with a biro") restates Doyle's "Two of us, manual obs every fifteen minutes, and a biro" (`ink/m02_npc_ward_nurse.ink:147`). V7 checks pool lines only, so it will not catch this. Give the pair their own detail, such as the bloods run.

**n5.** Section 6.1 places "a tray of mugs" with the east-table mug. The tray is on the west table (`mugs_tray1` at 3.19, 6.85), and a second drinkable cup sits on the centre table (`office-misc-cup3` at 3.99, 4.66).

Counts: B=2 M=4 m=7 n=5
