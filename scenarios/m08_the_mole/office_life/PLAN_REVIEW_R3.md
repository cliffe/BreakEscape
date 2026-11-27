# m08 office-life plan review R3

Scope: the R2 fix diff b27d0c8c1..9f2581156 (PLAN.md and SPOKEN_LINES.md in scenarios/m08_the_mole/office_life/), checked against PLAN_REVIEW_R2.md n1 to n9, the scenario and the engine. Read only. No server started, no SecGen XML or field guides opened. Engine paths are relative to public/break_escape/js/ unless they start with scripts/, scenarios/, lib/, app/ or .claude/.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 4 |

## R2 closure

- **n1, closed.** PLAN.md:49 now says the safe (2407) holds the Interrogation Suite Code Card and the door is a PIN door on 5386, that the crypto lab is not locked, and that the trace is stale. Verified: suite_code = "5386" (scenario.json.erb:117); the card is `interrogation_suite_code` (:1572-1578); the door is `locked`, `lockType: pin`, `requires: suite_code` (:2185-2187). Crypto connections (:2049-2053) carry no lock note, and the lock sits on the interrogation room.
- **n2, closed.** The pairs and directions match the room connections: operations_floor has north intel_analysis, east server_room, south security_archives (:1636-1641); intel's south is ops (:1767); server's west is ops (:1902); archives' north is ops (:1990); crypto's west is break_room (:2049-2053) and break's east is crypto (:2333). The beds match data/room-tones.json: room_hq_ops and crypto map to `it` (office_ambient 0.8), intel to quiet_office (0.35), server to `server`, break to `kitchen` (kitchen_tone), archives unmapped. Pass criteria are stated. They rest on `ambientChoice.keep` for a null room (ambient-choice.js:30, core/rooms.js:3304-3305), which R2 verified.
- **n3, closed.** Test 5 now asserts key and level from the `started` entries (fields `key` and `level`, office-room-tone.js:147) or `window.ambientChoice` (core/rooms.js:3304), with 0.35 for lobby, director and intel and 0.8 for ops and crypto. office_ambient on both quiet_office and `it` is at room-tones.json:15-16.
- **n4, closed.** Test 8 now names FLAGS_XML (tools/playtest/new-game.rb:551, passed to `session-start.sh --flags`), the verify-run.rb progress rule, and a reasoned drop of the persona run and frame-time reading. POLL_MS = 250 is at office-room-tone.js:23.
- **n5, closed.** The m03 :3091 note, `ss -ltn` check, absolute pid file and `keyless` grep are in measurement-recipes.md section 1 (:7, :10, :17, :20). The excluded ports 3000, 3001, 3002, 3085 and 3086 match :10 of the recipe and AGENTS.md:200 (3000, 3085, 3086) plus the recorded 3001 and 3002.
- **n6, closed.** Section 4 is now conditional on Q5. The b branch gives `Total: 1 office-life clip(s), 1 uncached` (the rake prints that string then a characters clause, lib/tasks/break_escape_tasks.rake:131). The sync key format `${npcId}:${eventPattern}:${handlerIndex}` is at npc-manager.js:2174-2182, so `background_analyst:room_entered:operations_floor:0` is correct. A non-conversation, non-minigame mapping with `onceOnly` sets `persist` (:1213, :1489), so it is exported. SPOKEN_LINES.md:11 no longer says "once build/tts-barks is on main".
- **n7, closed with one residual (m1).** The line is replaced and `delayMs` 3500 added. `delayMs` is a valid eventMapping field: scripts/scenario-schema.json:4984 sits in the eventMapping definition and its description (:28) reads "Run the whole mapping this many ms after the event. Checks run at the event and again when the delay is up". The m10 precedent exists: scenarios/m10_full_disclosure/scenario.json.erb:3979 is `room_entered:gallery`, `onceOnly`, `delayMs` 4000, `bark`. The "3000 to 4000 range" wording holds (3500 is inside it). The bubble route needs her in view (npc-barks.js:443-450 region, R2-verified).
- **n8, closed with a cite nit (m2).** typing_loop is added to the reasoning.
- **n9, closed with two nits (m2, m3).** Field name `what` and the positive control are in test 6.

## Q5 line check

"Nobody's said a word on this floor for an hour. I counted." against scenarios/m08_the_mole/ink/m08_background_analyst.ink:
- Register: short, nervy, self-mocking. It matches :13 ("Don't tell me anything. Knowing things is how you end up in an interview room") and :14 ("Everyone's watching the door").
- Clue: none. It names no one and says nothing about the mole, the badge, the post-it or any suspect. "Nobody's said a word" reads as atmosphere about the whole floor, and Vector sharing the room does not make it a tell.
- Repetition: none. It no longer echoes :13 ("six times tonight", "same threat feed") or the hub line :22 ("Still reading the same paragraph"). It is close in theme to "Everyone's watching the door" (silence, fear of notice) but shares no wording, which is what you want from a bark that sets up the opener.
- A grep for "Same threat feed" and "Same paragraph" in scenarios/m08_the_mole/ (outside the review files) finds no stale copy of the old line.

## Findings

**m1 (minor). The delay does not guarantee she is heard with the player in the room.** SPOKEN_LINES.md:11; npc-manager.js:1364-1394, :905-937.
The mapping delay re-checks only the condition (`!globalVars.analyst_ko`), not where the player is. A player who walks straight through the ops floor to the intel, server or archives door within 3.5 s still triggers the bark, which then plays as a toast rather than a bubble over her head, and the onceOnly key is spent. This is the common route (ops is the hub, scenario.json.erb:1636-1641). The R2 reason for the delay ("rather than on the threshold") holds for a player who stays, but the sentence "so she says it with the player in the room" is stronger than the code. Either soften the wording to "usually", or add a player-room term to the condition if the mapping condition scope exposes `currentPlayerRoom` (I did not confirm that it does). Not a blocker: the toast path still voices the line.

**m2 (minor). Two line cites are off by a line or two.** PLAN.md:43 and :51.
- typing_loop is checked at scripts/validate_npc_needs.rb:118 (`keys = ([p['bed']] + Array(p['spots']) + (p['typing'] ? ['typing_loop'] : [])).compact`), not :116-117, which are `used.each` and `p = table.dig`. Cite :116-118.
- The `what` cite list ":99, :140, :147, :171" includes :99, which is the `_note` method; the `what` literals are :130 (duck), :140, :147 and :171. Say ":140, :147, :171, with the writer at :99".

**m3 (minor). The lastSlot positive control is tight at exactly 60 s.** PLAN.md:51.
`lastSlot` advances once per 20 s of needs clock whatever the room (office-room-tone.js:151-157), so a 60 s dwell sees 3 boundaries on average, but the 250 ms poll and the first-roll seeding (:153, `lastSlot` starts null) can make a measured delta of 2. Say "advanced by at least 2 in a 60 s dwell" or lengthen the dwell to 70 s. Note also that no m08 profile has spots (room-tones.json:15-20 for office, quiet_office, `it`), so the zero-`spot` assertion is true by construction; the positive control is the only thing that gives that test meaning, which is another reason to keep it loose enough not to false-fail.

**m4 (minor). SPOKEN_LINES.md:3 "None planned" and the Pending Q5 heading read as slightly contradictory.** SPOKEN_LINES.md:3, :5, :7.
It is fine as written (the heading says "Only if the user answers b"), but V6 and any lines extractor that greps this file for quoted text would see the draft line. Not an issue for the build. Mention only so the post-answer edit also updates line 3 when the answer is b.

## Verdict

Accept. 0 blockers, 0 majors, 4 minors. All nine R2 minors are fixed correctly and every new factual claim I checked holds (suite code route, door pairs and beds, `what` fields, triggeredEvents key and persist, `delayMs` as a valid eventMapping field, rake output string, FLAGS_XML). The new Q5 line is in her register, carries no clue and repeats none of her ink. The diff introduced nothing wrong; m1 to m4 are polish and can be fixed in the build or left. Round 3 is clean enough to go to the user for D83.

## Assumptions

- I took R2's verification of ambient-choice.js:30 and the N/S "previous bed carries on, E/W crossfades" behaviour as holding; I did not re-trace the door-threshold code.
- I took R2's reading of state-sync.js:43 and :570-571 as correct; I confirmed only the export side (npc-manager.js:2174-2182).
- I did not confirm whether mapping conditions can see `currentPlayerRoom` (m1).

## Outcomes (orchestrator)

- 0 blockers, 0 majors, 4 minors; all four to fix (by the build agent). Round 4 is a delta review.
