# Office life missions plan: review round 10

Reviewer: fresh, read-only, adversarial. Plan read: `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` at 90e135d49 (the header says draft 9; the commit says draft 10). Kind of game: SAFETYNET campaign mission, a TV-style spy thriller with required VM flags; office life adds atmosphere and optional content only. Pilot: m02 ransomed_trust.

## Verdict

Most of the pilot's wiring matches the engine. These claims check out against the code: the at-post use (no wind-up, no `npc_left_post`, no move: `npc-needs.js:2893`, `:2963`, `:3110`), the `needs: { print: { producer, forget } }` command and its need for a registered NPC (`npc-needs.js:968-981`), `conversation_closed:<npcId>` from person-chat (`person-chat-minigame.js:1993`), `delayMs` waiting for an open minigame and re-checking the condition (`npc-manager.js:915-934`), exchange order and `requireGlobal` in object form (`npc-needs.js:2683-2699`, `:266-273`), the `npc_left_post` payload's `targetId` (`:2968`), presets and `officeType` merging (`office-presets.js:73-88`), and the claim pool skipping the `tables` layer (`core/rooms.js:218-223`). No office-life element touches a lock, key, critical-path task or story global, and the sync sum of 9 is right. Three things stop the pilot doing its job, which is convincing someone that office life is worth rolling out:

- The break rhythm puts the pair at a chatter object about a tenth of the time. A player crossing the hub room in two seconds usually sees two people sitting still, and the story-gated exchanges will mostly go unheard.
- The pair are written as being on a short break, but they never leave and can stay seated for an hour while a patient alarms on the ward.
- Section 9's showcase dependencies name the wrong slices and the wrong probe scenario.

None of these breaks a rule, so the plan has no blocker, but all three need fixing before stage 4.

## Blockers

None.

## Majors

**M1. The pair are rarely seen or heard on the walkthrough route, and the rhythm's exit test cannot pass (sections 6.0, 6.4).**
Evidence: plan 6.4 (lines 460 to 463) sets one shared break about every four minutes. The overlap at the object is about 25 s: the boiler's `useSeconds` is 30, less the follower's 0.7 s wind-up (`npc-needs.js` `windupMs`, default 700) and walk. That puts the pair at a chatter object roughly 10% of the time. An exchange starts only while the player is in earshot, in the same lit room, within 160 px and with a clear line (`npc-needs.js:3908`, `:2707`, `:4940-4951`). Pool lines are spent whether or not the player is present, and `chatterCooldownMin: 2` then holds each speaker to one voiced line per break (`npc-needs.js:2641-2647`). The player walks at 150 px/s (`utils/constants.js:39`), so a door-to-door crossing of the 10 by 10 staff room takes about 2 s. Some arithmetic follows:
- A 60 s visit overlaps a break with probability of about (60 + 25) / 240, roughly 35%.
- A crossing overlaps one about 11% of the time.
- The pair also register only when the staff room loads, so the porter's first break comes about two minutes after the player first walks in, usually while the player is with Kim.

The plan claims "voiced lines on most crossings of the room" (line 367), and the arithmetic does not support it. The exit test (line 461) asks for "a shared break in at least one of any three 30-second windows". With breaks about 215 s apart, around half of all 90 s spans contain no break, so the test fails by construction. The story-gated exchange `night_watch_burned` needs the player present during a break between the burn and `cover_restored`. On the walkthrough that window is one or two quick crossings (IT, then the staff room, then the corridor to Val), so most players never hear it.
What goes wrong: the pilot's main proof (talk) is missed by most players, and stage 4 stalls on an exit test that the designed rhythm cannot meet.
Fix:
- Add a mapping on the porter: `{ "eventPattern": "room_entered:staff_room", "cooldown": 120000, "needs": { "set": { "caffeine": 20 } } }`. It is not `onceOnly`, so it writes nothing, and `room_entered` is not an office-life event. The coupled mapping then brings the domestic. The 120 s cooldown matches `chatterCooldownMin: 2`, so each triggered break has fresh voiced lines.
- Lower the porter's caffeine `initial` so that his first break falls within about 20 s of the room loading.
- Rewrite the exit test: "on entry, when more than 2 minutes have passed since the last break, a shared break starts within 10 s and at least one voiced line or exchange line is overheard".
- Restate the 6.0 row to match.

**M2. The pair's "short break" never ends, which contradicts the plan's own premise and the crisis tone (sections 6.3, 6.8).**
Evidence:
- Plan 6.3 (line 441): "the porter is the hospital's network, walking bloods and results ... because nothing else moves them".
- Plan 6.3 (line 443): "they have just sat down ... One pool line each says the break is short and the next run is coming."
- Both carry `needsRooms: ["staff_room"]` with tile posts at the east table (lines 435 to 436), and nothing ever takes them out of the room.
- m02 runs long (four VM flags), and the player crosses the staff room again for the Boardroom finale (`TESTING_WALKTHROUGH.md` steps 39 and 40).
- Meanwhile HaX texts "Bed 4 is alarming and nobody's coming for him" (`ink/m02_phone_agent0x99.ink:902`), and Doyle is one of two nurses on three wards (`ink/m02_npc_ward_nurse.ink:143-147`).

What goes wrong: an hour into the mission, the player walks past two people who are "only just sat down", saying the next run is coming, while a patient is dying for lack of hands. That reads as a bug or as callousness, and in a pilot meant to sell office life it undercuts the premise that a staffed hospital at night suits it.
Fix (pick one in stage 2; the first needs no engine or approval change):
- (a) Reframe them as waiting rather than resting. With the systems down, runs reach the porter only when someone walks up or calls on his radio (see m1), so he waits where he can be found. Cut the "break is short" and "next run is coming" lines, and write lines about waiting.
- (b) Give the porter a visible run. A timer or story-event mapping walks him out of the south door with `patrolOverride` and `setVisible: false`, and a later mapping brings him back. Visibility is saved by `npc-manager.js` `recordNpcVisibility` (around line 2129). Option (b) needs its own V2, E1 and reload checks and the user's approval as part of the new-NPC item.

**M3. Section 9 maps the showcase slices wrongly, and the alignment message would misdirect its owner (sections 9 and 13).**
Evidence (`git show build/ol-sims:docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md`):

| Slice | The showcase plan says | The missions plan says |
|---|---|---|
| SIMS-1 | the E1 probe, in a new scenario `test_needs_attack` (its line 268), with Cal hostile from the start | the arrival check (plan lines 664, 669, 774) |
| SIMS-2 | the arrival check, about 50 lines (its line 287) | the E1 probe, run in `test_needs_sims` with `test_npc_needs` (plan lines 659, 668, 774) |
| SIMS-4 | E3, vending and Keith | summon to post (plan line 671) |
| SIMS-5 | the pizza magnet | arrive and leave on the clock (plan line 671) |
| SIMS-6 | arrive and leave (backlog) | vending (plan line 671) |
| SIMS-7 | summon to post (backlog) | listed, with no description (plan line 671) |

The plan also gives E6 as "about 35 lines" where the showcase says about 50. Line 673 says "The showcase plan was written when m06 was the pilot", but the showcase plan already names m02 as the pilot (its line 7). Its m02 rows (lines 107 to 109) describe the earlier design: Gary walking to his kettle and copier, `officeType: "fridge"` on `undercounter_fridge1`, `hush` pools, and a second NPC reaching IT through a door (N1). Draft 10 drops all of these, and the alignment points (plan line 670) do not retire them.
What goes wrong: the gate "E1 before the pilot's design closes" waits on the arrival fix, and the attack probe can slip. The showcase also spends SIMS-3 proving a walking Gary and a fridge preset that the pilot no longer uses.
Fix:
- Renumber section 9 and section 13 step 3 to the showcase's numbering: SIMS-1 is E1 in `test_needs_attack`, SIMS-2 is the arrival check of about 50 lines, then SIMS-4 to SIMS-7 as listed there.
- Delete the "written when m06 was the pilot" sentence.
- Add a fourth alignment point asking the showcase owner to retire the stale m02 rows. Under option (a) Gary does not walk, the fridge is not declared and no pool uses `hush`. Keep SIMS-1(f), Dee's sight catch while walking, only as evidence for option (b).

## Minors

**m1. Exchange 1 has no way for the pair to have heard the news (section 6.8, line 520).**
Evidence: the burn is a call to security control "from an internal extension" (`scenario.json.erb:936`). Control rings Bernie at reception (`ink/m02_npc_receptionist.ink:272`) and Val in the corridor (`scenario.json.erb:3288-3294`). The pair never leave the staff room (6.3), and nobody but the player enters it. The only nearby phone is the Boardroom's, behind the staff room's west door, and it is the call's source (`ink/m02_npc_receptionist.ink:282-284`).
What goes wrong: a writer has to invent a source. The easiest one, "heard it through the boardroom door", turns the pair into witnesses to Reeves's call, which leaks a clue and breaks 6.3's "give no clue".
Fix: state the source in the knot brief. The porter carries a two-way radio, which hospital porters plausibly do and which is not a phone, so Bernie's count still holds. Security put out "visitor not on the list" on the radio. The brief should also say: "no line implies anything was heard from the Boardroom".

**m2. The backstory timeline is invented and clashes with the night's canon (section 6.3, line 443; section 6.3, line 449).**
Evidence:
- "The game opens at ten past four": no m02 text gives a start time. HaX's briefing says "You won't know which is which until about four in the morning" (`ink/m02_opening_briefing.ink:261`), which places the player's arrival before four.
- The handover board in this very room records tonight's "02:30-03:00 FIRE DRILL, Ward 3 + Exec corridor ... NOBODY told the ward" (`scenario.json.erb:3384`).
- A domestic "on the wards since two" would have been there for it, yet 6.3 says they "know nothing of ... the drill".

Fix: drop clock times from their lines ("four o'clock run", "since two"). Let them know only what the board already says (there was a drill, the doors were open, nobody told the ward), with nothing new. Add a check to the dialogue review that no line pins the hour.

**m3. The printout slot lands at a random spot if it is declared last (section 6.5, line 474).**
Evidence: IT's three Tiled `notes` sprites (`room_hospital_office_it.json`, table_items) are claimed by `gary_desk_printouts`, `password_sticky_note` and the photo frame. A fourth `notes` object finds no match and goes to `createSpriteAtRandomPosition` unless it has an explicit `position` (`core/rooms.js:2468-2471`). The reveal code records the slot's declared spot as its tray (`npc-needs.js` `slotHome`, around line 4706).
Fix: give `it_copier_page` an explicit `position` on the copier's tray. The copier is drawn at (6.31, 7.88) bottom-left, 35 by 46 px. Keep it declared last, and add "the page appears on the tray" to the stage 4 live proof.

**m4. Option (a) relies on a 6 px margin to keep Gary out of a chair, and the spawn fallback is not tied to the approach cell (section 6.2 (a), lines 408 and 414).**
Evidence: at his post, a needs NPC with seated frames (Gary's atlas has them, `gary_whitlock.json`) sits on any static chair whose foot is within 36 px of the home cell (`seating.js:1732`, `:1979-1990`). A post stop prefers `fetch` unless the object says otherwise (`seating.js:1794-1804`). `hospital_chair_north2`'s foot is at about (160, 176) px in the room, and Gary's spawn (6.3, 5.8) is at about (202, 186): roughly 42 px away. A home cell snapped 8 px west brings it within range, and he would take a seat move, which is a step.

The fallback "spawn moves to the cell centre (6.5, 5.5)" uses a 32 px tile centre, but the home is the mug's approach cell on the 8 px walk grid (`npc-pathfinding.js:625-655`, `PATHFINDING_STEP` 8).
Fix:
- Add `"seat": "stand"` to `gary_mug`'s affordance, which forces `stand` (`seating.js:1796`).
- Rewrite the fallback: read the mug's approach cell through `window.__test.needs`, then set Gary's spawn to that cell's centre.

**m5. The cooldown and repetition figures disagree with section 10 and with their own arithmetic (sections 6.4, 6.8, 10).**
Evidence:
- 6.4 (line 460) sets `chatterCooldownMin: 2`. Section 10's design rule (line 701) says the cooldown sits "at its default of 5 minutes or more".
- 6.8 (line 526) has a broken sentence ("at most breaks").
- It says each 4-line bag "lasts about a quarter of an hour". Breaks alternate boiler and cooler, so each topic comes round every 8 minutes, one line per speaker, and a 4-line bag lasts about 32 minutes.

Fix: in section 10, allow a shorter cooldown where breaks are coupled and rare, and give the reason. Repair the sentence and correct the figure to about half an hour.

**m6. Stale phone references remain after the phone was cut (sections 5 and 6.12).**
Evidence:
- Section 5's m02 row (line 335) still lists "a phone call", against 6.4's "No phone" (line 464).
- 6.12 (line 568) says the staff-room lighting loop runs "even though only the phone is new".

Fix: remove both. In 6.12, give the real reason for the lighting check: the room is now lit from load because NPCs are in it (`lighting.js:655`).

**m7. The print's timing is described wrongly, and the print can play unseen (section 6.2 (a), line 411).**
Evidence: `cover_burned` is not set "during his first conversation". It is set only when the keycard changes hands, and "walking away ... completes nothing and burns nothing" (`ink/m02_npc_gary_whitlock.ink:22-27`; set at `:206`, `:266`, `:289`, `:312`, `:378`). HaX's 4 s text is timed from the task's completion (`scenario.json.erb:930-936`), which happens mid-conversation, not from the close. The copier's run sound plays only in the player's room (`npc-office-visuals.js:366-372`, `ownRoomOnly`), so a player who leaves IT within 6 s of closing gets a silent print.
The mapping itself is sound: it fires after whichever conversation sets the burn, and never after a knock-out.
Fix: reword to "after the conversation in which the card changes hands". Add `"condition": "... && currentPlayerRoom === 'it_department'"` if the condition grammar allows it. Otherwise accept the silent case and record it in the stage 5 test plan.

## Nits

**n1. The header and handover say draft 9 (lines 3 and 799), but the commit is draft 10.** The handover does not list the draft 10 changes (phone cut, breaks retuned, print after the burn). Update both.

**n2. Option (b) contradicts itself on the chair.** Option (b) says "Gary keeps a tile post at his chair" (line 418), while 6.2 says he stands and the chairs are too far (line 398), and the people table gives "(b) his tile (6.3, 5.8)" (line 434). Say "a tile post where he stands".

**n3. Section 6.12 (line 567) says "m02's IT room type" without the key.** Write `room_hospital_office_it` (from the rendered scenario) beside `room_hospital_staff`.

**n4. Sections 6.9 and 6.10 do not say to declare the new globals.** `heard_night_watch_burned`, `heard_night_watch_cleared`, `heard_night_watch_paper`, `night_porter_ko`, `night_domestic_ko` and `it_copier_page_shown` should be declared `false` in `globalVariables`. Without that, the validator warns for each exchange (`scripts/validate_npc_needs.rb:859`) and the "0 new warnings" check fails. Add one line.

**n5. "Up the back stairs" (line 443) gives the staff room an exit it does not have.** Its doors are south (corridor), north (CTO), west (Boardroom) and east (IT), from the rendered `connections`. Say "in from the corridor".

Counts: B=0 M=3 m=7 n=5
