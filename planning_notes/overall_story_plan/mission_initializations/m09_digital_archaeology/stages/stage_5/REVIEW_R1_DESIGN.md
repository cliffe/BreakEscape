# m09 Digital Archaeology: stages 4–5, review round 1 (design)

## 0. Scope and method

Fresh read-only reviewer, 2026-10-21. Reviewed `../stage_4/objectives_tasks.md` ("S4") and `room_layout.md` ("S5"), including proposed changes P1–P16 (taken as accepted). Context came from `../stage_1/story_arc.md` ("SA") and `../stage_3/moral_choices.md`. Comparison points were the shipped `m01_first_contact`, `m02_ransomed_trust` and `m08_the_mole` objectives and HaX hubs.

I applied the `scenario-design-review` skill and the objective-staging and HaX-hub rows of `mission-alignment-plan`. There is no `scenario.json.erb` yet, so Step 1 (validator, dialoguelint) and the geometry checks are **N/A**. Everything below judges the design. No VM material was opened.

The focus questions were: does the player always know what to do next; is the archive plausible and varied; can the player feel the purge; clue distribution; whether each beat sits in the right room; pacing against about 85 minutes; whether optional content is signposted; fun, not hard.

Severity: **blocker** stops play or the story; **major** means a player gets lost, a beat misfires or a stated aim isn't met; **minor** is polish.

## 1. Summary and counts

**0 blockers, 8 major, 10 minor.**

The order of the night is well locked. Each step has an engine-enforced condition and a backstop. Running two aims side by side copies m08's `work_the_suspects` + `get_into_the_repo` pair and works. The forced scenes' re-ring rules are disjoint and complete. None of the findings below can soft-lock the mission.

The weak spots are where the player has to *find* the next step rather than be walked to it:

- route A at the dock is a dead end for most imports;
- the hand comparison is a required task with no clear way to do it;
- the salvage cage code needs a walk back that S4 §11 says doesn't exist;
- the hub has no story-level help for the 28 minutes of VM work.

The purge's pressure is narrated but never seen. The four forced phone scenes are read, and Act 3 carries a heavy reading load.

## 2. Findings

### 2.1 Major

**D-01 (major). Route A through the front desk is a dead end for most players, and HaX recommends it.**
*Location:* S5 §3.1 (spawn line "The office door's quieter."), §3.2, §4.1 route A, §5 RFID row; S4 §3.1 `get_inside`.
*Problem:* The front desk's only way forward is the staff door (`rfid`, `reading_staff_door`), and the only card for it is `noor_staff_card` in Noor's `itemsHeld`. She hands it over only on warned-in-time (`m05_found_pipeline_list && !m05_recruiter_deal_accepted`); otherwise it drops only if she is knocked out. Cold starts, warned-late and not-warned players (the majority) pick the dock door on HaX's advice and reach a front desk with a locked door, a wary clerk and nothing to do except knock out an innocent woman. Then they walk back and take the shutter anyway. The dock's "choice of route" is real only for one m05 branch, and the KO becomes the obvious "solution". S5 §3.6 also calls the hatch clone "the cloner's second use of the night", but nothing in the kit table (§5) gives the cloner a first use. That looks like a lost design intent.
*Fix:* Give Noor an `rfidCard` (`card_id: "reading_staff_door"`, an easy protocol) so every player can clone it while talking to her, whatever her branch. Warned-in-time Noor still hands it over and adds the held box. This gives the cloner an easy first use in Act 1 before the harder MIFARE clone at the hatch, which is a better teaching ramp, and route A works on every branch without a KO. If that isn't wanted, make HaX's dock line conditional so she doesn't recommend the office door on branches where it dead-ends.

**D-02 (major). The hand comparison is a required task with no clear way to do it.**
*Location:* S4 §3.2 `match_the_hand`, §5 `notebook_read`, §7.1 topic 12; S5 §3.5 `case_file` / `notebook_scan`.
*Problem:* Four things stack up:
1. The task says "Compare the hand on the recruitment file with HaX's case file", but `notebook_read` is set only by reading the separate `notebook_scan` object. A player who reads `case_file` (the object the title names) never opens the hub topic.
2. The task completes only by picking "[The hand on his file.]" in HaX's hub. Nothing in the world tells the player that this comparison is done by ringing HaX: no text on `nightshade_file_held`, no object line. The dead-zone table's pointer ("the case file names the notebook") doesn't exist in S5 §3.5's object list.
3. The comparison itself is a single correct-only menu line, so it is a gate with no puzzle in it. SA Beat 2.2 calls it "document work the player does".
4. It gates nothing (the identity scene keys on `nightshade_file_held`), so a player who misses it carries an unfinished required task in aim 2 through all of Act 3. The objectives panel then reads as "you've missed something" for the second half of the night.

*Fix:* (a) Retitle it: "Compare the hand on Nightshade's file with the notebook scan in HaX's case file". (b) Add a HaX text on `nightshade_file_held` that says what to do: "Hold his file next to the notebook in my case file. Then tell me." (c) Show the hub topic on `nightshade_file_held` alone; if `notebook_read` is false, HaX answers "Read the notebook scan first. Then look again." (d) Make the comparison a small honest choice, e.g. "[Same hand.]" / "[Different hands.]" / "[I can't tell.]", with the wrong answers costing a line and no progress. Or show the two samples side by side in the file's text so the match is visible. (e) Consider making the task optional, or completing it inside the identity scene for a player who never did it. Either way it stops hanging open through Act 3.

**D-03 (major). The salvage cage code needs a walk back to the reading room, and the tape room is empty on most routes.**
*Location:* S5 §3.5 (`catalogue_view`, `catalogue_legend`), §3.9, §4.2 salvage keypad row, §6 "Act 3 has no long walk-backs"; S4 §7.1 topic 4, §11 "Walking".
*Problem:* The encoded entry is on `catalogue_view`, a readable object fixed to the reading room desk, seen in Act 1 about 40 minutes before it is needed. The legend (the no-Gary route) is on the reading room's back wall. HaX's hub answer sends the player there ("The legend's on the reading room wall."). So every player without Gary walks tape room → hub → reading room → back. That is a two-door round trip at the start of Act 3, which S4 §11 and S5 §6 both say doesn't happen. It also costs more than the 4 minutes budgeted. Two more problems:
- On the `taken`, `double_crossed` and `named` routes (3 of the 4 deck outcomes) the tape room holds only empty spools: a room with two locks and nothing in it (scenario-design-review §2f).
- S5 calls the code an "old archive encoding" decoded at the CyberChef workstation, with a legend for "the archive's old shelf-code scheme". If the scheme is bespoke, CyberChef can't decode it; if it is a standard encoding, the legend teaches nothing.

*Fix:*
- Move `catalogue_legend` into the tape room. Tape stores keep the shelf-code chart by the racks, and this gives the room something on every route.
- Make sure the catalogue entry reaches the player's notes when read in Act 1, or have HaX quote it at the keypad ("That's the line from the catalogue. Same scheme.").
- Tell stage 6 to pick an encoding CyberChef handles in one or two operations, with a key or offset that the legend supplies (for example a ROT or substitution whose key is the legend). Gary's hint then names the operation.
- Update S4 §11's walking note.

**D-04 (major). The purge's pressure is narrated but never seen, and the design invites the player to do flag 2 first.**
*Location:* S4 §2 aim 2 title, §4 purge table, §7.2 (`m09_ledger_field_guide` offered on `flag1_submitted`); S5 §3.2 `trolley_list`, §10 item 14.
*Problem:* Every purge loss is set off by the player's own action (opening the gate, the chest, the first exit, reading the binder), never by time. That is the right call for "fun, not hard". But nothing in the world changes while the player stalls:
- the shredder's ambient sound is fixed;
- the trolleys and the trolley list never empty;
- both bins stay full until the gate opens.

At flag 1 the player sits at the drop terminal with the VM warm, and the ledger guide is offered at once. A student who spends 15 minutes on flag 2 first and then walks into the stacks finds everything waiting. The aim title "Before It Burns" turns out to be untrue, and the tension the act depends on drains away. SA §2's curve ("a steady build under the shredder") has no visible beats in the build.
*Fix (cosmetic, no new cost):*
- `spriteVariants`/`textVariants` on the front desk trolleys and `trolley_list` that empty as the night moves on (`flag1_submitted`, `flag2_submitted`, `cage_opened`).
- An `observationVariants` line on the hatch bins ("She's three boxes from the bins.") keyed on `flag2_submitted && !cage_opened`.
- One HaX line in `flag1_read` that sets the order without forcing it: "The ledger keeps. Her shredder doesn't. Stacks first."
- One bark if `flag2_submitted && !hatch_talked` when the player next enters a room: "She's still feeding it."

None of these changes an outcome; they make the clock visible.

**D-05 (major). Aim 3's description gives away flag 2's reveal.**
*Location:* S4 §3.3 description, §13 JSON.
*Problem:* Aim 3 unlocks on flag 1 and says: "find out what it says about the people you met this morning". Flag 2's spike is HaX's "That's one of the four you met at the briefing" (SA Beat 2.3, the second peak on the tension curve). The description tells the player the ledger concerns the raid team one act early. This is the m04/m05 "spoilers in names" class (scenario-design-review §2i).
*Fix:* "The catalogue server keeps the Insider Threat Initiative's ledger live: placements, candidates, and an older legacy section. Pull it, and see who's still on their books." Keep the team out of every pre-flag-2 string, including the ledger field guide's offer text.

**D-06 (major). HaX's hub has no story-level help on the VM, and the guide offers aren't grouped.**
*Location:* S4 §7.1 (17 topics), §7.2.
*Problem:* The VM is 28 of the 85 minutes and is where players stall. m08's hub has a topic for each VM stage, gated on progress and written in story terms ("What am I looking at on this box?", "I'm on the box. Where do I look?", "I've got credentials. Now what?"). m09's 17 topics have none: a player stuck on any of the four flags gets only the field guides and "Where do I stand?". Separately, the four guide offers appear as their own hub choices. m08 folds them under one "[I need a field guide.]" sub-menu. Done m08's way, the hub shows one line instead of up to three. Without it, my count after the deck choice can reach ten or eleven (topics 5, 6, 7, 10, 11, 12, 16, 17 plus two or three undelivered guides), which is at or past the lint's `crowded-hub` limit.
*Fix:* Add one story-level nudge per flag, gated `{<flag n-1 done> and not flag<n>_submitted}` and retired by the flag, in HaX's voice and at game-design level only. Example: "The catalogue's the index. Find the part that isn't public." The opus48 VM plan gives stage 7 the exact steer. Put the guides behind one "[I need a field guide.]" choice, as m08 does. Retire "[Tran.]" (topic 16) at `cage_opened` as well as when it is given, so an Act 1 topic doesn't sit there all night.

**D-07 (major). The four forced phone scenes are read, not heard, and Act 3 is mostly reading.**
*Location:* S4 §6, §15 item 1; P12; SA Beats 3.3–3.6.
*Problem:* On the assumption that they are read:
- **Tesseract's call suffers most.** The whole scene is performance: one side of a call, "(beat)", "(long beat)", "her voice goes on the last", and a narrator line that may not draw. As text bubbles it turns into four short lines and stage directions. It is the season's first contact with the villain.
- **The identity scene is second.** It is the longest (about 3 minutes), with two speakers, a confession, and Netherton's silence as the season's rhyme. Silence can't be shown in a chat log.
- **The Recruiter's call reads acceptably.** It is transactional, and m05 set the precedent.
- **Flag 4's read** is information; it reads fine but is long.

Act 3 also asks the player to read the Reading (four entries and a last page), the master schedule, the lease file, the rent book, Danny's sheet, the refit ledger and the three Albion sheets. On top of that come three forced phone scenes, plus the Afterwards call, Torres, the invoice text and the double-cross text at the Act 2→3 seam. With no voice, Act 3's 17 in-game minutes are mostly reading.
*Fix:* For the user: if only part of the voicing is done, voice Tesseract's call first, then the identity scene. Tesseract's call has no choice and restarts when closed, so it can run as a voiced `video-call` (or a hidden person-chat with HaX and the narrator) **today**, with no `resume` needed. That leaves only the identity scene needing phone-chat TTS (S4 §15 option a). For the reading load, keep the office files as true optional finds (they already are) and make sure no required task needs a long read. `take_the_reading` is a pickup, which is fine. Consider trimming the Albion papers to one sheet plus HaX's summary.

**D-08 (major). Ten nearly identical 2×2 rooms read as an office block, not a converted grain warehouse.**
*Location:* S5 §2 (all rooms 2×2 except the closet), §3.3, §1.
*Problem:* SE §6.1 and S5 §1 describe a converted grain warehouse with shelving bays, a guard's round and a steel mesh cage "floor to roof". On the map every room is the same 10×10 box, including the two "cages", the yard and the warehouse floor. Two practical results:
- The open stacks (the one room meant to feel like a warehouse, with a patrolling guard to slip past) is a 10×10 room with shelving bays and a 150 px cone. That is the minimum for a walk-around evasion (§2d″), and it leaves the guard's round no room to have a rhythm.
- The rooms vary by dressing only. The player's sense of moving from public front to secure back is carried by doors and lighting alone.

Ten new bespoke room maps is also the largest asset bill in the season.
*Fix:*
- Make the open stacks 4×2 GU (20×10 tiles). This gives the patrol long aisles and makes the building read as a warehouse. I haven't checked how `rooms.js` aligns a 4-wide room north of a 2-wide one. If it centres rather than left-aligns, the reading room and the cage shift, so the author should confirm the ring still closes, for example by giving the dock a second north neighbour or by hanging the open stacks off the reading room instead.
- Consider the salvage cage at 2×1 (10×6). A mesh pen, smaller than the tape room in front of it, makes "through a second mesh door" visible.
- Consider the front desk as a 2×1 counter room.
- Start the stacks rooms from `room_archive_1x2gu`, `room_library_1x2gu` or m08's `room_hq_archives` art rather than from scratch.

Re-run the overlap reasoning (or a stub validator run) after any size change.

### 2.2 Minor

**D-09 (minor). The office keypad and the tape room reader have no refusal line.** *Location:* S5 §3.6, §4.2; S4 §4 rows 5–6. *Problem:* All of Act 2 is spent in a hub with three shut doors. The stacks door gets a boss-key refusal line from HaX (S5 §3.5); the office keypad (a code that "appears nowhere") and the tape room reader get nothing. A curious player who tries the keypad gets a password box they can never solve. *Fix:* Two `door_unlock_failed` mappings on HaX, `onceOnly`. Office: "Her keypad's off the card system. Leave it for now." Tape room: "That reader wants a real card. Hers will be somewhere she trusts." Each points forward without naming the safe.

**D-10 (minor). Victoria's route doesn't point at the print.** *Location:* S4 §4 row 2b, §7.1 topic 14; S5 §3.6. *Problem:* HaX's maintenance code skips the hatch. That player never hears "Take the print if you like" and can walk into the cage, meet the biometric cabinet and have to go back to the stamp on the hatch shelf. *Fix:* Add one line to topic 14 after the unlock: "The cabinet in there takes her print. It's on the stamp on her shelf."

**D-11 (minor). The kit-technique lines have no trigger.** *Location:* S4 §7.2 last paragraph. *Problem:* "Her card's on a reel at her hip. You've done this before." and "That reader takes a print. She stamps everything." are said "where the player first needs it", but no mapping is named. *Fix:* Put the first in `flag1_read` (or on `room_entered:restricted_stacks`, `onceOnly`) and the second on `room_entered:restricted_cage`, or on the cabinet's first `door_unlock_attempt`-style interaction.

**D-12 (minor). The Afterwards call's last line is stale on arrival.** *Location:* S4 §6.6 Beat 2.7 row; SA Beat 2.7. *Problem:* It fires on the first `room_exited` after the deck choice. The office opens off the hub the player is standing in, so that exit is usually the step *into* the office, and "Her office is past the binders." arrives with the player already inside. *Fix:* Fire it on `global_variable_changed:deck_choice_made` with `delayMs` (it waits for the Recruiter's call to close, S5 §10 item 5), or make the line branch on `office_entered`.

**D-13 (minor). The reading room holds too many of the mission's keys, and too close together.** *Location:* S5 §3.5. *Problem:* The launcher, the station, `case_file`, `notebook_scan`, `catalogue_view`, `ledger_view`, the legend, the microfiche and the public terminal are all in one room. Four readables sit on one desk at one-tile spacing. Three of the night's keys (the stacks flag, the hand exemplar, the salvage code) are clustered there (§2b). *Fix:* Merge `catalogue_view` and `ledger_view` into one `drop_terminal_screen` readable with stacked `textVariants`. Move the legend to the tape room (D-03). Consider making the notebook a page inside `case_file` if stage 7 can set `notebook_read` from a page.

**D-14 (minor). Fix the hub's door corners now; the hatch strip depends on them.** *Location:* S5 §2 "Door alignment", §3.6, §11 third check. *Problem:* The hub's east gate sits at the top of the east wall, with the counter and strip below it. If parity puts the north and south doors on the east side, the north-east corner holds the tape room door, the cage gate and the end of the counter. S5 leaves this to stage 9 and offers a fix that moves a whole branch. *Fix:* Run `scripts/predict_door_sides.py` on a stub scenario (rooms and connections only) during round 2 and fix the side before the room map is drawn.

**D-15 (minor). A few task titles could be sharper.** *Location:* S4 §13. *Problem and fix:*
- "Open the salvage cage's keypad" → "Get through the salvage cage keypad".
- "Get into the catalogue server and submit what it hides" → "Get into the catalogue server and submit the flag". "What it hides" is vaguer than the other three flag titles.
- "Take the call with HaX and Netherton" is fine.
- `stop_the_tape_wipe` shows from flag 1. On most routes the only way to complete it is a fight, because the talk option needs the letters. Say so in HaX's "[Tran.]" topic so the task doesn't read as a combat order.

**D-16 (minor). Nothing points the player back to the Alpha clip after the identity scene.** *Location:* S5 §3.9; SA Beat 3.2. *Problem:* On `alpha_tapes` the clip plays only after `identity_scene_done`. The player is in the salvage cage by then and has no reason to go back a room. *Fix:* On `alpha_tapes`, one HaX line at the end of the identity scene: "His tapes are on the bench next door. When you want them."

**D-17 (minor). Publish the critical-path time alongside the 85.** *Location:* S4 §11. *Problem:* The 85 includes Noor (3), the boxes (4), Tran (1–3) and the notice (about 2). The critical path alone is about 75 at the assumed VM rate. The Act 3 decode line (4 minutes) is low once the walk-back in D-03 is counted. *Fix:* Add a critical-path-only column and re-cost the decode after D-03.

**D-18 (minor). Too many phone events land at the Act 2→3 seam.** *Location:* S4 §6.1, §6.6. *Problem:* Inside about three minutes, on the Torres-turned and buying routes, the player gets: the Recruiter's forced call, the Afterwards call, Torres' fallback call, the invoice text at 60 s, and the double-cross text when entering the tape room. The breath SA §2 asks for after "Afterwards. Not during." gets crowded out. *Fix:* Hold the invoice text until `office_entered` plus a delay, and Torres' fallback until `safe` opened (or `reading_found`), so the Afterwards call is followed by a quiet room.

## 3. What works

- **Two aims side by side, twice.** This is m08's pattern: `work_the_suspects` and `get_into_the_repo` both unlock on `take_the_brief`. Here it keeps one in-game task and one VM task on screen from flag 1 to flag 4. Pairing aims 4 and 5 is the best use: seeing "Get into the tape room" next to "Open Sorensen's safe" tells the player where the card is without a line of dialogue.
- **Tasks that unlock on the scene's own first line.** `answer_the_offer`, `hear_the_name`, `hear_the_mirror_job` and `send_the_notice` stay hidden until the moment that names them, and complete on done-flags rather than on opening or closing. Spoiler-safe and immune to S1/S2.
- **The night's order** (S4 §4). Every step is a real lock or a delayed condition. Keying the call on `ledger_read_heard` rather than the flag is a neat fix for the race between two delayed mappings. Each critical-path timed rule has a backstop.
- **The hub** is newest-first, retires its topics, and has a progress-aware "Where do I stand?". Moving the two "send" actions into it (P8) means they work from any room.
- **Boss keys.** The three hub doors are visible from flag 1 onwards and open in story order. The cracker is a grant you can feel. The `password` and `pin` lock choices stop the cracker skipping anything.
- **KO resilience.** No critical-path task depends on a KO-able NPC: `sorensen_hatch` is `koImmune`, Noor's task is optional with `taskOnKO`, and every KO has a credit line.
- **Optional content** sits in its act's aim, never holds an aim open, and the cross-reference is unlocked by the flag that makes it findable. Signposting is good apart from D-15's Tran note.
- **Story beats in rooms.** P1 (the server in the salvage cage) and P4 (the cage as its own room) both improve on stage 1: the decode becomes required, and "walk out of this cage" becomes an event the engine can see.

## 4. Checklist results (scenario-design-review, alignment staging)

| Check | Result | Note |
|---|---|---|
| Step 1 validator, dialoguelint, geometry | N/A | no scenario file yet; S5 §11 lists them for stage 9 |
| 2a Solvability, soft-locks, SOFTLOCK_PATTERNS | OK | no circular keys; S1/S2 handled (S5 §4.3); VM flags set plain globals, no `emit_event` |
| 2b Clue distribution | CONCERN | D-03, D-13 (reading room cluster; Act 3 code walk-back) |
| 2c Educational coverage | OK | key, RFID ×2 grades, biometric, PIN, password, four flags; the decode is now required |
| 2c′ Field guides | CONCERN | exposure-gated and on request (OK); group them as m08 does (D-06); lab-sheet URLs open, as S4 notes |
| 2d Narrative bookends | OK | briefing `skipIfGlobal`; hub-started debrief with backstop; music cues on beats |
| 2d″ Patrol space | CONCERN | open stacks is the minimum size for walk-around evasion (D-08) |
| 2f Rooms and dead ends | CONCERN | tape room empty on three of four deck routes (D-03); uniform sizes (D-08) |
| 2g Objectives scaffolding | CONCERN | table below |
| 2h KO resilience | OK | §3 |
| 2i Spoilers in names | CONCERN | D-05 |
| 2i Hub ordered and not crowded | CONCERN | can pass ten after the deck choice (D-06) |
| Alignment row 2 (aims and staging) | OK with D-02, D-05 | sequenced unlocks, action titles, `missionConclusion` + flags-only `concludeRequires` |
| Alignment row 3 (HaX hub) | major gap | no VM-stage help topics (D-06) |
| Alignment row 7 (rooms and layout) | CONCERN | D-08, D-14 |

**2g table (this review's view, against S4 §2's):**

| Aim | Required | In-world pointer | Dead-zone risk | Transition narrated |
|---|---|---|---|---|
| 1 `get_in` | 3 | 3, but route A misleads (D-01) | low | HaX `flag1_read` |
| 2 `restricted_series` | 5 | 4: `match_the_hand` has none (D-02) | **medium**: an unfinished task carried through Act 3 | hatch scene, HaX clock line |
| 3 `read_the_ledger` | 2 | 2 | low (the call is the transition) | the Recruiter's call |
| 4 `search_the_office` | 5 | 5 | none | the deck line |
| 5 `take_tomb_beta` | 5 incl. revealed | 4: the keypad code sends the player back two rooms (D-03) | low–medium | the three scenes |
| 6 `report_in` | 1 | 1 | none | HaX's last line |

**Pacing.** About 85 with optional content; about 75 on the critical path at 7 minutes per flag (D-17). Act 2's 24 in-game minutes are sound. Act 3's walk-back (D-03) and reading load (D-07) are the two risks to the estimate.

## 5. Verdict

**Another round needed.** There are no blockers: the night can be finished on every route, and the lock order is sound. The eight majors are about the player finding their way, the pressure they feel and the reading load.

Fold in D-01 to D-06 and D-08 before round 2. They are cheap and mostly change data:
- a cloneable card for Noor;
- a retitled task, a HaX text and an honest comparison choice for the hand;
- moving the legend into the tape room;
- cosmetic purge variants;
- one description reworded;
- VM nudges and a grouped guide menu;
- a larger open stacks.

D-07 goes to the user with the recommendation in S4 §15 item 1, sharpened: voice Tesseract's call first, which works today as a `video-call`, then the identity scene.
