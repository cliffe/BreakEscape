# m01 office-life plan review, round 4 (delta)

Counts: B 0, M 2, m 5

Verdict: tiers 1 and 2 can still be built as written. Step 5 (Maya, 4.9) needs two more fixes before it is built. The `maya_away` guard does not cover a conversation closed part-way through a topic (M1), and the three new mappings inherit the engine's default 5 s cooldown, which can leave the flag wrong in either direction, including during her first talk (M2). Both fixes are small and need no engine change and no new voiced line.

Reviewed: `git diff d70234f8e..e680085e7` (PLAN.md, DIALOGUE_SAMPLE.md, SPOKEN_LINES.md, PLAN_REVIEW_R3.md Outcomes), `ink/m01_npc_maya.ink`, scenario.json.erb (rooms, agent_0x99, globals), and the engine under `public/break_escape/js/` in worktree p-ol-m01 at e680085e7.

## R3 fixes verified

- m1 (`needsCompany.avoids`): the field is real. `_avoidsOneWay` reads `needsCompany.avoids` (npc-needs.js:4344-4360), `_avoids` acts both ways (:4363-4365), and `_free` treats a capacity-2 object claimed by an avoided NPC as full (:1594-1605), so Maya never shares the cooler with an extra and no pool line is aimed at her. Side effect as stated: the 2-tile `avoidRadius` default applies only to the NPC that declares `avoids` (npc-needs.js:96, :1897-1902), so only Maya waits; the extras' own radius stays 0. Acceptable.
- m2: the reveal wording at PLAN.md:248 is now right (Esc in `reveal_check` resumes with `discussed_operation` still false, ink :53-71).
- m3: Fatima's break (PLAN.md:236-238) and Graham's cooler follow (:241) now carry `!globalVars.<npc>_ko`, and the 4.5 sentence (:149) lists them. Consistent with the bark conditions at :128-133.
- m4: heading fixed.
- Mapping shape: `condition` plus `setGlobal` is valid. `_mappingWouldFire` checks the condition (npc-manager.js:1286-1302), then `_handleEventMapping` writes `setGlobal`, broadcasts it to open stories and emits `global_variable_changed` (:1500-1512). Precedent exists in the same scenario's mapping style.
- agent_0x99 is in reception_area's `npcs` (scenario.json.erb:551, :628), the start room and the reload spawn, so the three mappings are always registered. Appending keeps the existing onceOnly indexes.
- Event: rooms.js:3231-3241 emits `room_entered:<roomId>` with `previousRoom` whenever the detected room changes; a gap or doorway keeps the previous room (:3221-3223).
- Initial value and reload: declared false; a fresh game reaches her office only through main_office_area and hallway_east (scenario.json.erb:1699-1710), so the flag is true on the way and cleared on entry. After a reload the player spawns in reception and Maya is at post, so a stale value is harmless and the walk to her office corrects it.
- Ink sync: `syncGlobalVariablesToStory` writes a declared global into any story with a VAR of that name (npc-conversation-state.js:498-516), and runs before and after the choice-point re-navigation (person-chat-minigame.js:560-591). `syncGlobalVariablesFromStory` pushes back only values the story changed, and the ink never writes `maya_away`. Declaring it in `globalVariables` (PLAN.md:292) is required and planned.
- Sync: a keyed `globalVariables` section sent as deltas (state-sync.js:43). One boolean, written only on a change. Fine.
- `not_here` cannot trap: it always offers its one choice; `#exit_conversation` with no text closes after saving at that choice point (person-chat-minigame.js:1297-1309). With the flag false it diverts straight to `hub`, and `hub` always offers "I need to keep investigating" (ink :152). No loop: `hub` only diverts to `not_here` when the flag is true, and `not_here` only back when it is false.
- Objectives: none needs a Maya topic away from her post. `talk_to_maya` completes in `start` (ink :19-20), before any guard. `inform_safetynet_operation_shatter` is unlocked at ink :97, before the `operation_details` guard, and completed from HaX's phone (m01_phone_agent0x99.ink:149, :448), which reads globals only. `warned_about_derek` and `asked_about_patricia` gate nothing outside her ink (Kevin keeps his own VAR).
- First talk unaffected when the flag is right: `start`, `first_meeting`, `reveal_check` and `informant_reveal` are unguarded, and the guarded knots fall through when `maya_away` is false. See M2 for when it is not.
- Player choice text is not voiced: TTS plays only for a block whose speaker is not `player` or `system` (person-chat-minigame.js:1688), and the next-line preload works on the NPC's own lines (:1726-1736). P1 needs no clip.
- Other leaks: none beyond the five knots. `reveal_check` names the operation (:55) but is reachable only before `discussed_operation` turns. `start`'s "Is it safe to talk?" (:26) carries nothing.

## M1. A conversation closed part-way through a topic resumes past the guard (PLAN.md:304, :309, :373; ink-engine.js:34-62; person-chat-minigame.js:526-583)

`InkEngine.continue()` returns one visible line at a time (ink-engine.js:30-62), so pressing Esc while a Maya line is on screen saves the story mid-knot, with lines still to come and no choices yet. On a reopen, the re-navigation that re-enters the owning knot runs only when the restored story is resting at choices (person-chat-minigame.js:569-583). A mid-knot restore just continues (:544-547); the opt-in `reopenRefreshesHub` path does not help, because it only acts when the first continue prints nothing (person-chat-reopen.js:101-104), and Maya has not opted in.

The plan's guards sit at the top of each knot, so a mid-knot resume never passes them. Concrete case, the one test 14 names: first talk, "Tell me everything", `operation_details` sets the flag (:96) and shows :99; the player presses Esc. `conversation_closed` fires with `discussed_operation` true, so her trip starts 2 s later. The player follows her to the cooler and talks: the story resumes at :101, plays :101-105 (the casualty figures) and offers "And they're okay with that?", whose answer is :108 "Derek, he's the one running it". The same holds for Esc mid-way through `derek_intel` (:123-127), `patricia_story` (:164-179) or `tactical_advice` (:188-190) in the conversation that first closes with the flag set. PLAN.md:304 says the guard "also covers a resumed chat", citing person-chat-reopen.js:79-110; that is the opt-in mid-knot helper, and the choice-point re-navigation it means is person-chat-minigame.js:562-583.

Smallest fix, ink only, no voiced line: hold the trip until the conversation closes at rest.

1. Add a global `maya_settled`, declared false, boolean, not monotonic. In her ink, `VAR maya_settled = false`; `~ maya_settled = true` as the first line of `hub` (before the guard); `~ maya_settled = false` as the first line of `operation_details`, `derek_intel`, `patricia_story` and `tactical_advice`; and `~ maya_settled = true` in `tactical_advice`'s "I'll get started" choice before its `#exit_conversation` (:195-196), since that exit does not pass the hub first.
2. Add `&& globalVars.maya_settled === true` to her break condition (PLAN.md:265). A false condition does not use up `onceOnly`, so she leaves after the next talk that ends at the hub.

Ink global writes reach `gameState` before `conversation_closed` (npc-conversation-state.js:596-625; R3 checked this order). With this in place she can never be away while her story sits mid-topic or at a topic's choices, so the five guards become a second line of defence, and m1 below goes away. Test 14 should press Esc on a mid-topic line, not only at choices, and expect her to stay at post.

## M2. The three `maya_away` mappings get the default 5 s cooldown (PLAN.md:287-289; npc-manager.js:1279-1284, :1467-1470)

A mapping with no `cooldown` gets 5000 ms, checked before the condition, with `lastTime` set only when it fires. So a mapping that fired less than 5 s ago is skipped even though its condition now holds:

- Player enters her office (clear fires), steps into the hall (set fires), and comes back within 5 s of the first entry: the clear is on cooldown, so `maya_away` stays true inside her office. If this is the first talk, `start`, `first_meeting`, `reveal_check` and `informant_reveal` play, then "Tell me everything" or "Tell me more about this operation" enters `operation_details`, sets `discussed_operation` and the unlock (:96-97), and the guard sends the player to "Not here. I'll come to your office." in her own office. On close her trip fires. The hub entry for the operation is `{not discussed_operation}` (:144), so :99-113 (including the launch time) can never be heard again. The "Who's behind it?" route hits the `derek_intel` guard the same way.
- Player goes hall (set), office (clear), hall again within 5 s of the first set: the set is on cooldown, so the flag is false in hallway_east and her Derek topics play there if she walks by.

Doorway dithering and a quick look in and out are ordinary play, so this will happen. Fix: add `"cooldown": 0` to all three mappings (the engine reads 0 with `??`-style handling, :1281). The conditions already limit writes to real changes; a dithering player can flip the flag several times a second, but the delta sync only sends the value held at flush time, so player_state does not grow. Add the quick in-and-out case to test 14.

## m1. The `operation_details` guard sits after the set lines, so a guard hit loses the topic for good (PLAN.md:309; ink :96-97, :144)

If the guard ever fires in `operation_details`, `discussed_operation` is already true and the hub hides the topic (:144), so :99-113 are gone for that run. With M1's fix this path needs M2 to fail first; once both are fixed it is only belt and braces. If M1's fix is not taken, move the guard above :96 so the topic stays in the hub (the unlock then waits for the real visit, which is still before any objective needs it).

## m2. "A talk needs both of them in one room" is not true (PLAN.md:284; interaction-walls.js:254-268)

NPC conversation is allowed across an open doorway with a clear line (`wallClearFrom`, combat and NPC talk exception). A player standing just inside maya_office (flag false) can talk to Maya in hallway_east outside her door and get the full hub. The audience there is nobody (Derek is in the break room, his office is empty), so the risk is small. The reverse case (player in the hall, Maya at her desk) only gives a harmless "Not here". Correct the sentence, and either accept the doorway case in section 11 or rely on M1's fix, which keeps her at post while any topic is open, though not for a fresh hub talk at her door.

## m3. The reopen context line can show a Derek line above "Not here" (person-chat-reopen.js:58-63; person-chat-minigame.js:629-660)

On an in-session reopen at a choice point, the hub diverts to `not_here`, which prints no text, so the engine re-displays her last remembered line, for example "Anyone who gets too close gets removed." (:180), with the "Not here" choice under it. It is shown, not voiced, and no tag runs, so nobody in the room "hears" it, but it reads as if she just said it at the cooler. Options: accept it and say so in 4.9; or have `not_here` reuse the existing line "Is it safe to talk? #delivery: low and wary" word for word (same text and delivery, so the cached clip is reused), guarded so it does not double after `start` has just said it. Ask the user before choosing the second.

## m4. Test 12 is not a runnable check for the ink change (PLAN.md:318, :370)

There is no m01 critical-path script in tools/playtest: past m01 regressions were agent-driven runs through the playtest-scenario skill, using SOLUTION_GUIDE.md and tools/playtest/m01-baseline-report.md, then `tools/playtest/verify-run.rb <game_id>` (see tools/playtest/m01-regress-report.md). Test 12 also runs in her office only, so it would not catch M1 or M2. The build step should name:

- `bin/inklecate` on `ink/m01_npc_maya.ink`, writing `ink/m01_npc_maya.json` (the scenario loads the JSON, scenario.json.erb:1904); commit both.
- `node scripts/ink_runtime_check/inkcheck.js scenarios/m01_first_contact/ink/m01_npc_maya.json start` three times: default VARs; `met_maya=true maya_away=true discussed_operation=true` (expect only the `not_here` choice and no Maya line beyond :26); `met_maya=true maya_away=false` (expect the full hub). Add `maya_settled` cases if M1's fix is taken. Then `node scripts/ink_runtime_check/loopcheck.js ... hub` to confirm no hub empties.
- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m01_first_contact` (an aid, exit code always 0, so read the findings).
- The validator and lock and key diff as in section 7.
- A focused live probe script for the reopen cases (mid-line Esc, choice-point Esc, quick in-and-out of her office, reload), in the style of tools/playtest/needs-*-proof.mjs, on a keyless server, checked with verify-run.rb. Then test 12's agent-driven m01 run.

## m5. Small wording points

- PLAN.md:304 cites person-chat-reopen.js:79-110 for the choice-point re-entry; that is the opt-in mid-knot helper. Cite person-chat-minigame.js:562-583.
- `maya_away` tracks one player's room but lives in `globalVariables`, which state-sync.js:266-270 marks as "shared by the team" for a future multiplayer game. Fine today; note in section 6 that it is per-player state in a team section, so a multiplayer port must move it.

## Sync, locks, secrets

- Sync: `maya_away` (and `maya_settled` if taken) are bounded booleans in a keyed delta section; no onceOnly key added. Section 6's count of globals rises by one if M1's fix is taken.
- Locks: none. No door, key or item changes.
- Secrets: none. P1 and the guards carry no PIN, code or plot name.

## Not checked

- Whether hallway_east's motion lighting reacts to Maya (carried in PLAN.md:396).
- The validator info line for `avoids` (validate_npc_needs.rb:1010-1033); taken from R3.
- Whether doorway room detection actually flickers between hallway_east and maya_office (M2 stands on the quick in-and-out case alone).

## Outcomes

- M1: Fixed in PLAN.md 4.9 step 3 and the break condition. A `maya_settled` global (hub sets true, the four topics set false, the "I'll get started" exit sets true) is added to her break condition. Reopen behaviour verified at person-chat-minigame.js:544-547 and :562-583 and ink-engine.js:30-62. The tip-off route through `reveal_check` is covered, and never leaving is noted as the safe failure. Declared in the globals table and section 6 (seven at most), with a test step added to test 14.
- M2: Fixed. `"cooldown": 0` on all three `maya_away` mappings, reason noted in 4.9 (default 5000 ms at npc-manager.js:1281, reads 0 as 0), and the quick in-and-out case added to test 14.
- m1: Fixed. The `operation_details` guard now sits above the set lines so a guard hit leaves the topic in the hub; the settled flag also makes it a second line of defence.
- m2: Fixed. The "both in one room" sentence now states the open-doorway case; accepted in section 11.
- m3: Accepted and recorded in section 11. The `not_here` reuse of the existing opener is left as an open choice for the user, not taken.
- m4: Fixed. The ink build step now names the compile, the `inkcheck.js` runs, `loopcheck.js`, `dialoguelint.mjs`, the validator and lock diff, the live probe and `verify-run.rb`. All paths checked to exist.
- m5: Fixed. The citation is now person-chat-minigame.js:562-583, and section 6 notes `maya_away` is per-player state in a team-shared section.
- SPOKEN_LINES.md: no change, no spoken line added or altered.
