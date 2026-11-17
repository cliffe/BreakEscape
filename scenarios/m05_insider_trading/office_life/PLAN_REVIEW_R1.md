# m05 office-life plan review R1

Read-only review of `scenarios/m05_insider_trading/office_life/` at 93cbec1de. Review complete; context guard hit at the end, so the full text lives here.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 4 |
| Minor | 9 |

## Majors

**M1. The night hide can happen in front of the player.** PLAN.md:104 reuses the evening shape on `torres_identified`. But `torres_identified` is set by phone as well as in person: `ink/m05_phone_agent_0x99.ink:561` and `ink/m05_phone_patricia.ink:370` (as well as `m05_npc_patricia_morgan.ink:600`). A player who makes that call in the break room watches Niamh vanish from her chair. Mapping conditions cannot read the player's room (`safeEvaluateCondition`, `npc-manager.js:25` onwards, which reads only `value`, `data.*` and `globalVars.*`). Fix options: (a) keep Niamh at night as the late worker in the lit break room (it has no night variant, `scenario.json.erb:1725`); `qdc_cooler_off` already keeps her out of the dark corridor, and this fits her line "I'll be here till late, sadly"; or (b) hide her only on `room_entered` of rooms other than the break room and corridor, plus the re-hides, and accept a pop on a direct break-room entry. (a) is simpler and has no pop. Add an E-check either way.

**M2. Credits contradict an extra's KO.** "Nobody on staff hurt" and "Nobody else on staff hurt" (`scenario.json.erb:285` to `:286`) test only patricia, owen, lisa, halloran and torres. A KO of Thandiwe or Niamh would print both "Nobody on staff hurt" and the new "A MEMBER OF STAFF STRUCK BY DAY". The plan must add `!globalVars.thandiwe_ko && !globalVars.niamh_ko` (and `bernadette_ko`) to both conditions and list that as a changed existing condition, with no wording change. "BY DAY" is also wrong for Niamh struck in the evening, or Bernadette at any time (GO 69), so drop "BY DAY". PLAN.md:116, PLAN.md:203.

**M3. The cooler sits in the break-room door's lane, and the plan gives it no fallback.** A single west door is placed 2.5 tiles from the top (`systems/doors.js:290` to `:291`), which is the row-2 centre at y 80. The cooler's collision is x 78 to 98, y 78 to 86 (`room_qdc_hall.json`), so it stands on that same row 2.5 tiles in. The cooler preset's `useFrom {dx:0, dy:1}` (`js/data/office-presets.json`, cooler) puts users right on the turn a player makes out of the break room, and the extras walk out through the same door. PLAN.md:154 names GO 10 and 11 but proposes no cells. F1 (PLAN.md:153) moves the exchanges onto the cooler if the espresso fails, so a failure at the cooler leaves nothing. Name candidate cells now: east of the cooler at row 2/3, x tiles 3 to 4, with `queue: false`. Measure the south door's side, which is chosen by parity (`doors.js:193` to `:200`). Add a fallback for the cooler (capacity 1 with no chatter, exchanges at the espresso only) and a decision order if both chat points fail.

**M4. "Their walk does not pass Lisa's tile" is asserted, not measured.** Lisa's (4,4) is x 128 to 160, y 128 to 160. The two `desk3` tables are at x 83 to 134 and 159 to 210, y 157 to 196, with `hospital_chair_south` chairs on their north side (`room_qdc_break.json`). Lisa sits at the north mouth of the 25 px aisle between the tables. From either south chair to the espresso front (about (5,3)), the short route goes up that aisle and through or beside her tile. The west route squeezes past `qdc_fridge1` (x 34 to 70, y 99 to 160). PLAN.md:62 and L1 (PLAN.md:237) check only the use cells. Make L1 a path check too: the pathfinder's route for each extra and her distance from Lisa's body. If the route runs through the aisle, choose seats or `useFrom` so it goes round the east side.

## Minors

**m1. The evening hide, answered.** `room_entered:server_room` fires (`core/rooms.js:3236`). The HaX mapping at `:1184` to `:1186` sets the global, and the room is reached only through `server_hallway` (`:1859` to `:1861`), so the hide is never seen. PLAN.md:103 should spell out the action shape (the m03 shape, MP 3, mappings on each extra): a plain `{ "eventPattern": "room_entered:server_room", "setVisible": false }` plus two `onceOnly` re-hides on `room_entered:break_room` and `room_entered:main_corridor` with `globalVars.server_room_entered === true`. That makes two `onceOnly` keys per extra, not three. Lazy-load gap: the extras' mappings register only when the break room loads (`npc-lazy-loader.js:97` to `:104`, `rooms.js:1027`, the door at `doors.js:883`). On the "skip the break room" route, Extra A is created visible when the door opens and is hidden only once `room_entered:break_room` fires. `setNPCVisible` cannot help earlier, because a mapping hides only its owner (`npc-manager.js:1656` to `:1658`). Add a render check from that route, and accept the result if the unrevealed room hides her until entry.

**m2. Sync section.** The "6 (9)" `onceOnly` count (PLAN.md:185) does not match 2.10 and leaves out the trouble mappings (`onceOnly` in MP 5) and the two `qdc_cooler_off` mappings. Re-sum. T133 has no effect here: `serverGlobals` carries only globals the server wrote (`state-sync.js:341` to `:356`, `game.rb:226`). This plan's globals are client-written per-key deltas. Remove "section 7 relies on it" (PLAN.md:13, :188).

**m3. `offWhen`.** The premise holds: `_isOff` (`npc-needs.js:830`) uses the requireGlobal form, where every key must match, so OR is impossible (schema `scenario-schema.json:5480`). The workaround is right. The plan should list both mappings (`global_variable_changed:qdc_staff_upset` and `global_variable_changed:torres_identified`, each `value === true`, setting `qdc_cooler_off`), put them on `agent_0x99_handler`, appended last, and declare `qdc_cooler_off`, `thandiwe_ko` and `niamh_ko` as `false`.

**m4. Trouble owners and coverage.** PLAN.md:113 to :114 do not say which NPC owns the trouble mappings; MP 5 says the HaX phone, appended last. The skill is followed: no `patrolOverride`, `offWhen` plus needs (PLAN.md:116, :227). Attacking an extra sets `qdc_staff_upset`, but attacking Lisa without a KO does not. Add `npc_attacked:lisa_park` or state why not.

**m5. Espresso declaration.** Write `"type": "qdc_espresso"` literally. It is the base of `qdc_espresso1`, and the break room has exactly one (`rooms.js:186` to `:193`, `room_qdc_break.json`), so MR 2 should pass. `officeType: "coffee"` brings the preset's queue cells `{dx:-1,dy:1}` and `{dx:-2,dy:1}`, which fall around (4,3) and (3,3), next to Lisa. Set `queue: false` or hand-write them (PLAN.md:146).

**m6. Map facts in the plan.** The table-1 chairs centre at x 100 and 120, which is tile 3, not 2 (PLAN.md:62). The "counter at x 5 to 6" (PLAN.md:153) is the free-standing espresso (x 158 to 202). The kitchenette is at x 32 to 86. The pamphlet (x 202 to 216, y 93 to 104) lies at the espresso's east foot, not "on the counter" (PLAN.md:51), so a beside cell at (6,3) would stand on its approach.

**m7. Exchanges and clues.** No new clue. The briefing already places the insider among "eight people in the cryptography division" (`m05_insider_trading_opening.ink:168`). But "Lisa reckons it's about the crypto lot" can be read as Lisa tying the tin to the crypto team. That is gated behind her tin question (`m05_npc_lisa_park.ink:70`, `:87`; the round 2 "Lisa vaguer" note at `:18`), and an exchange can play at the cooler before the player has talked to her. "Lisa reckons a lot of things" also undercuts a witness. Suggested rewording: "Lisa says Security don't send just anyone." `ex_collection` and `ex_heading_home` add nothing. Pools are clean.

**m8. `ex_heading_home` will rarely be heard.** Its window, from `server_badge_obtained` to the server room, is short, and nothing sends the pair to the cooler during it. Add `global_variable_changed:server_badge_obtained` on Extra A, setting thirst to 20 with the usual gates, so the pair is at the cooler as the player crosses to `server_hallway`.

**m9. Stale or loose cites and the cast.** `_findExchange` is now at `npc-needs.js:2975`, not :2702, and it tries both owners in id order, so "lives on the lower id" is a preference, not a requirement (PLAN.md:138). ANALYSIS.md:32's voice list leaves out Algenib (the narrator, `:119`), with no clash. Names and voices pass: Leda and Pulcherrima are not used in m05, and Niamh, Thandiwe, Doherty and Moyo appear nowhere in the m05 scenario or ink. Atlases, talk sheets and visemes exist. The `voice.style` from `VOICE_CAST.md:100` names "Quayholt" and "IT trainer". Rewrite it for QDC comms, keeping the Belfast accent (PLAN.md:122).

## Other checks
- Leaving the lobby and open office alone loses little. The open office is Owen's proximity clone and KO route, and the lobby holds the briefing and debrief records plus Patricia's badge story. The reasons in ANALYSIS.md section 4 hold.
- The user questions are fair. In Q-B, "the evening is the part the player sees most" overstates it: in the evening the player is mostly in the server and VM rooms. The recommendation is still reasonable as the last slice. Make clear that option (b) is new art spend under D53's "needs a written reason".
- D78 (information): Lisa could take a single kettle trip (kettle at about (3,2), one tile from her post, `needsRooms: [break_room]`). No beat reads her position except reachability for conversation, and her text says "by the kettle". Owen should stay put, because the RFID clone works by proximity in a critical-path room.

## Verdict
Not ready. Fix M1 to M4 before round 2. None blocks the plan's approach.

## Outcomes (orchestrator)

- D78 (2026-11-17, user): story-safe movement for existing NPCs is approved; the skill gains a cast-audit step (branch plan/ol-skill-movement). The reviewer's D78 note (Lisa could take one kettle trip, Owen stays) goes to the fixer as a proposal to apply under the new rules.
- M1 to M4 and m1 to m9: to fix. Round 2 on opus55 (majors).
- User questions D82a to c (extras, cleaner, levers) are on the decisions page, unanswered.
