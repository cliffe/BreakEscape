# m05 office-life plan review, round 2

B 0 / M 4 / m 7

Read-only review of `scenarios/m05_insider_trading/office_life/` at `c17145cb5` (worktree `p-ol-m05`). Line numbers are in `scenarios/m05_insider_trading/scenario.json.erb` unless another file is named; engine paths are under `public/break_escape/js/`.

Mid-review the coordinator relayed the user's answers: D82a Thandiwe Moyo and Niamh Doherty; D82b Bernadette Lyons as a new character with full art (the cleaner slice is in); D82c no levers; D84 (question D) b, so Lisa's kettle trip (section 2A) is built and talking to a story NPC away from her post is allowed. The build reviewed here is therefore the extras, the cleaner slice and 2A. Findings that only held under the old defaults are marked as such.

## R1 findings: status

| R1 | Status | Evidence |
|---|---|---|
| M1 night hide in view | Fixed | Phone setters confirmed at `ink/m05_phone_agent_0x99.ink:561`, `ink/m05_phone_patricia.ink:370`, `ink/m05_npc_patricia_morgan.ink:600`; break room has no night variant (`:1725`); `safeEvaluateCondition` reads only `value`, `name`, `data.*`, `globalVars.*` (`systems/npc-manager.js:25` to `:63`). Niamh staying is sound; see M2 below for the one way she still leaves. |
| M2 credits | Fixed in the credits | `:285` and `:286` conditions confirmed; `:286` already uses `||`. The same contradiction remains in the debrief (new M3). |
| M3 cooler lane | Fixed, one gap | Cells, `queue: false`, F1 to F3 and the order are in PLAN.md section 3. L4 still omits the east door (new m4). |
| M4 Lisa on the path | Partly fixed | The seats moved to table 2's east end, but the use cells themselves fail the new pass mark (new M1). |
| m1 evening hide shape | Fixed | `room_entered:server_room` emitted at `core/rooms.js:3236`; HaX setter at `:1184` to `:1186` is `onceOnly`; lazy load at `systems/npc-lazy-loader.js:97` to `:104`; owner-only hide at `npc-manager.js:1655` to `:1658`. |
| m2 sync | Fixed | Re-sum checks: 2 + 4 + 2 = 8; 11 with the cleaner if her show uses the same shape (see M4). |
| m3 `offWhen` | Fixed | `_isOff` at `systems/npc-needs.js:830`. |
| m4 trouble owners | Fixed | `npc_attacked:<id>` is emitted at `systems/player-combat.js:461`. |
| m5 espresso | Fixed | `officeType` wins over `type` and own affordance fields win field by field (`systems/office-presets.js:4` to `:6`, `:69` to `:70`). |
| m6 map facts | Fixed | `room_qdc_break.json`: espresso gid 1178 at x 158 to 202, y 42 to 96, collision (160,86) 40x10; pamphlet x 202 to 216, y 93 to 104. |
| m7 clue | Fixed | `ex_whispering` lines 3 and 4 carry no team or name. |
| m8 goodbye seed | Fixed | B to cooler, then the `npc_use_started:corridor_cooler` coupling pulls A (PLAN.md 2.7); payload has `npcId` (`npc-needs.js:3557`). |
| m9 cites, cast | Fixed | `_findExchange` at `npc-needs.js:2975`. |

## Majors

**M1. L1's 48 px pass mark cannot be met by either espresso cell.** PLAN.md:68 and :301 set the pass at 48 px between the route and Lisa's body centre, and the route ends on the use cell. With `useFrom { dx: -1, dy: 1 }` from the espresso's centre (about (180,69); `room_qdc_break.json`, gid 1178) the first cell is (4,3), centre (144,112), which is 32 px straight north of Lisa's (144,144). The second user goes right first (`npc-needs.js:5631` to `:5636`) to (5,3), centre (176,112), 45 px from her. Both fail, so the build would be pushed to F1 by a check that tests the wrong thing. The 2.3 text is also off: Extra B's post (6,4) is two tiles from (4,4) in the same row, not three (PLAN.md:64). With 2A built, Lisa's kettle cell (about (3,3), kettle1 at x 98 to 113, y 61 to 79) is also the espresso's left beside cell, so all three can stand in a row above her.
Suggested fix: split L1 into (a) the walk, excluding the last tile before the use cell, at 48 px or more from her body; (b) the use cells, passing if Lisa is still talkable from at least two sides with a pair standing there and with her at the kettle; (c) the kettle cell is not taken by an espresso user (set the espresso to stop at its right beside cell, or accept and test). Correct "three tiles" to "two tiles, same row".

**M2. Struck extras chase the player anywhere.** Striking a non-hostile NPC makes it hostile (`systems/player-combat.js:453` to `:462`), and without `behavior.hostile.leash: true` it "follows the player anywhere" (`systems/npc-behavior.js:664` to `:669`, `:1050` to `:1056`). PLAN.md:60 says the extras "carry no `behavior.hostile`", and the people table promises "walks home" (PLAN.md:43). Unleashed, Niamh can follow the player into the motion-dark corridor at night or on to the server hallway and data centre with Torres, which breaks E3 ("never leaves the break room") and SK 97 (digest line 55). m02 gives its extras `"behavior": { "hostile": { "leash": true } }` (`scenarios/m02_ransomed_trust/scenario.json.erb:3509`, `:3551`); that does not make them hostile from the start. Bernadette needs the same.
Suggested fix: add `"behavior": { "hostile": { "leash": true } }` (optionally a `chaseRange`) to all three new NPCs; correct PLAN.md:60; add to 10.4 that each struck extra gives up at the leash and goes back to her post, and does not leave her `needsRooms`.

**M3. The debrief still says the player read the room after an extra is knocked out.** `friendly_kos()` counts only patricia, owen, lisa and halloran (`ink/m05_closing_debrief.ink:83` to `:97`), and the diplomatic branch prints "You said you'd read the room. You did." when it is 0 (`:237` to `:244`). The trust penalties at `:155` to `:168` ignore the extras too. This is the same contradiction R1 M2 fixed in the credits. PLAN.md section 9 says no existing line changes; a fix here changes an existing ink function, not a line.
Suggested fix: add `VAR thandiwe_ko = false`, `VAR niamh_ko = false`, `VAR bernadette_ko = false` to the debrief ink and count them in `friendly_kos()` (no new lines voiced); optionally a small `handler_trust` penalty. List it in section 9 as a changed existing function. Do not add them to `exportGlobals` (`:660` to `:663`); nothing downstream needs them.

**M4. The cleaner slice is now in the build but is not specified.** Under the old default (B answer a) it was optional; now it is built and the plan gives only a table row (PLAN.md:45) and the line block. Missing: (a) a skeleton (post cell by the recycling bins, gid 1180 at x 190 to 248, y 226 to 258, with collision at (192,248), so the cell must be measured clear of it and of Extra A's chair at (6,6)); (b) the show shape: `behavior.initiallyHidden`, a plain `setVisible: true` on `room_entered:server_room`, and two `onceOnly` re-shows on break room and corridor entry. Only that shape gives the "+2 shows" in section 7 (PLAN.md:243). Her mappings register only when the break room loads, so on the skip-the-break-room route she appears as the room is entered: add an E-check mirroring E4; (c) no mapped break pairs her with Niamh, so `ex_late_again` relies on natural rhythm, which 2.5 itself calls rarely together (PLAN.md:82); (d) "empties the bins" (PLAN.md:274) has no habit or affordance ("habits: none", PLAN.md:45); (e) her voice entry and V6 count are in the plan, but no `globalVarOnKO` or trouble mapping skeleton appears in 2.11 or 2.12; (f) she joins `qdc_day_staff` though she is evening staff, which is harmless but the group name misleads.
Suggested fix: add a 2.13 "Cleaner" with the skeleton, the show mappings and their count, one mapped break (for example `room_entered:break_room` with `globalVars.server_room_entered === true && !globalVars.qdc_staff_upset`, cooldown 150000, `needs.set caffeine 20` on Bernadette, so the pair forms at the espresso as the player returns), either a bins routine or drop the claim, leash (M2), and checks E5 (show on both routes) and E6 (`ex_late_again` heard within two returns).

## Minors

**m1. 2A: Lisa's `tea` need has no `urgentAt`, so the engine drops it.** `normaliseNeed` returns null unless both `decayPerMin` and `urgentAt` are above zero (`systems/npc-needs.js:358` to `:363`). PLAN.md:176 gives only `decayPerMin` and `initial`. As written Lisa never takes the trip. Suggested fix: `"tea": { "initial": 100, "decayPerMin": 0.01, "urgentAt": 30 }`, so `needs.set tea 20` sends her. Old default hid this; now 2A is built.

**m2. 2A: kettle declaration and the tin.** The kettle is a Tiled item (`kettle1.png`, gid 834, x 98 to 113, y 61 to 79). Write `"type": "kettle"` literally with no `position` (SK 109, 110); PLAN.md:199 gives only `id` and `officeType`. Its preset satisfies `caffeine` (`js/data/office-presets.json`, kettle); the own `satisfies: "tea"` does override it field by field (`office-presets.js:69` to `:70`), so the plan's logic holds. Set `queue: false` as well: the preset's queue cells fall at (2,3) and (1,3), the second against `qdc_fridge1`. Also, the collection tin is a world object: `qdc_collection_tin1.png` (gid 1183) sits on the kitchenette at x 90 to 100, y 67 to 79, beside the kettle. PLAN.md:172 and ANALYSIS.md section 1 say it is "not a world object". It is decor with no scenario id, so no lock or position rule moves, but correct the text and keep it in the 10.7 item-position compare. The default-build wording "the kettle keeps the preset it has today" (PLAN.md:170, :199) was wrong anyway (undeclared Tiled items get no preset, `office-presets.js:8`) and is now moot.

**m3. Night before the evening turn.** If `torres_identified` can be set before `server_room_entered`, the clock jumps to 19:50 (`:638`) while Thandiwe is still at her table ("Half five can't come soon enough") and the day exchanges and mapped breaks (gated only on `server_room_entered`) still run; "Right, that's me after this one" at ten to eight reads wrong. The plan says the server room precedes the flags (PLAN.md:289), not the naming. Suggested fix: state whether naming before the server room is reachable; if it is, add `"torres_identified": false` to the three exchanges' `requireGlobal` (declared at `:724`) and `&& globalVars.torres_identified !== true` to the mapped breaks, and give Thandiwe two `onceOnly` room-entry re-hides on `torres_identified` (re-count section 7).

**m4. Corridor lanes and the first cooler cell.** The corridor's east door to `server_hallway` is also a single door at 2.5 tiles (y 80, `systems/doors.js:286` to `:292` for west; east mirrors it), so the pair at (3,2) and (4,2) stands in row 2 between the west and east doors. That is the crossing L5 relies on. L4 (PLAN.md:304) checks only the west and south lanes; add the east and north doors. Separately, the cooler's collision is x 78 to 98 (`room_qdc_hall.json`), 2 px into tile 3, so (3,2) may not be walkable on the grid; the build should log the resolved cell, and F2 covers a failure.

**m5. Stale conditional text now that D82 and D84 are answered.** PLAN.md:15 to :17, :21, :23, :38, :45, :170, :199, :241 and section 9's open questions still read as conditional; SPOKEN_LINES.md:59 and DIALOGUE_SAMPLE.md:27 and :31 likewise. DIALOGUE_SAMPLE.md:27 says Lisa is "back at her seat", but she has no `seated` and her post is standing. DIALOGUE_SAMPLE.md:29 says the reworded whispering lines need no new yes, yet they were never in a sample the user saw; either add them or have the coordinator confirm. Add one cleaner pool line to the sample. With talk away from post allowed (D84), the "two rooms away" gate in 2A can stay as is; it is stricter than needed, not wrong.

**m6. Cites and wording.** The conversation freeze is at `systems/npc-needs.js:1435` to `:1449`, not `:3071` and `:3451` (PLAN.md:179); `besideCell` is at `:5631` (PLAN.md:204 cites `:5625` to `:5631`, which is the end of the visitor side-cell helper above it; same order, so the claim holds). PLAN.md:250 "No `||` in conditions" should say mapping conditions and `requireGlobal`: the new credits condition uses `||`, as `:286` does, and the parser rejects it only in mappings (`npc-manager.js:126` to `:130`). Section 7's cooldown-mapping row (PLAN.md:241) should now read 8 (2A built), plus any cleaner break from M4.

**m7. Thandiwe's "Kitchen rota's on the fridge if you're staying."** (SPOKEN_LINES.md:51) points the player at a fridge notice that does not exist; in a mission built on reading notes, a player may go looking. It is an ink line, so the 40-character limit does not apply (47). Suggested fix: "Help yourself to tea if you're staying." or similar.

## Other checks

- **Spoken lines.** All 20 pool lines are 40 characters or fewer and the counts in SPOKEN_LINES.md match. No line names anyone from the whodunnit list (ANALYSIS.md section 1) or touches badges, door logs, recruiting or Torres' family. `ex_collection` repeats only the flyer (`:1708`). Pools live in NPC `chatter`, exchanges and conversations in ink; nothing is engine text. `ex_late_again`'s owner `bernadette_lyons` is the lower id, as stated.
- **Credits.** The two changed conditions and the new `||` line are consistent with `:285` to `:289`; "HURT, ON YOUR ACCOUNT" names no place.
- **Niamh at night.** No night beat uses the break room: the night lighting turns the corridor to motion (`:1695`) and puts Torres' rooms on, nothing in the break room. With the cooler off her thirst has no source and parks, so she stays (apart from M2). If the cooler goes off while she is at it, she walks back once through the corridor; a short, acceptable crossing.
- **Seats at table 2.** North chairs (gid 317) at x 168 and 188, y 132 to 167; south chairs (gid 316) at x 168 and 188, y 192 to 222. From the posts (6,4) and (6,6), the x 188 chair is about 12 px away and the x 168 chair about 32 px, both inside `seated`'s 40 px, so the nearer one wins; the build must confirm the x 188 chair is taken, as the plan intends.
- **Sync.** Every new global is a declared boolean, set once, sent as a per-key delta; `heard_` keys are four; needs state is not saved (reload resets to posts). Nothing grows or is re-sent whole. The cleaner's show count depends on M4's shape. Lisa becoming a needs NPC adds no synced state.
- **Default build without 2A or the cleaner** stood on its own; it no longer applies.

## Outcomes

All findings are fixed in the plan files as of this round.

- M1: fixed. PLAN.md section 2.3 and L1 split into L1a (walk, last tile excluded, 48 px), L1b (Lisa talkable from two sides with a pair there and with her at the kettle) and L1c (second espresso user at (5,3), never the kettle cell); Niamh is "two tiles east, same row".
- M2: fixed. `behavior.hostile.leash: true` on all three newcomers (2.2, people table, skeletons, 10.4).
- M3: fixed. Section 2.11 adds three KO VARs, counts them in `friendly_kos()`, and takes -10 trust each; not exported; listed in section 9 as changed ink logic.
- M4: fixed. New section 2.13 gives the cleaner's post, show mappings, skip-route check, `tidy` bins need, evening break coupling with Niamh, `ex_late_again`, leash, KO handling and skeleton; E5 to E7 added and section 7 recounted.
- m1: fixed. Lisa's `tea` need has `urgentAt: 30`.
- m2: fixed. Kettle declared with `"type": "kettle"` and `queue: false`; the tin is decor `qdc_collection_tin1` (gid 1183), now stated in PLAN.md and ANALYSIS.md.
- m3: fixed by reasoning: naming before the server room is not reachable (section 2.10); no gate added.
- m4: fixed. The cooler cells paragraph and L4 cover the east and north doors and the (3,2) collision note.
- m5: fixed. Conditional wording removed from PLAN.md, ANALYSIS.md, SPOKEN_LINES.md and DIALOGUE_SAMPLE.md; Lisa returns to her post standing; the whispering exchange and a cleaner pool line are in the sample.
- m6: fixed. Cites corrected (`npc-needs.js:1449`, `:5631`), `||` wording corrected, section 7 counts updated.
- m7: fixed. Thandiwe's line is now "Help yourself to tea if you're staying." in SPOKEN_LINES.md.
