# m08 office-life plan review, round 4

Counts: B 0 / M 0 / m 2

Scope: commit 3852ed5f0 (PLAN.md, SPOKEN_LINES.md in scenarios/m08_the_mole/office_life/) against R3 m1 to m4, checked against the engine in the worktree p-ol-m08 (engine paths under public/break_escape/js/). Read only. No server started, no SecGen XML or field guides opened.

## R3 closure

- **m1, closed.** SPOKEN_LINES.md:11 now says "usually", and explains the limit. True: safeEvaluateCondition (npc-manager.js:25) resolves `value`, `name`, `data.*` and `globalVars.*` only (:100-118), supports `!` negation (:80-81 region), and nothing reads `currentPlayerRoom`. The delayed fire (`_scheduleDelayedMapping`, :915-938) calls `_handleEventMapping` (:1398), which re-runs `_mappingWouldFire` (:1260-1307): no player-position term. The onceOnly key is spent and the bark falls back to a toast; npc-barks.js:443-450 is the bubble route. Ops lighting is on (scenario.json.erb:1627, default mode on), so the "lit" test in the bubble route does not defeat it.
- **m2, closed.** PLAN.md:43 now cites validate_npc_needs.rb:116-118 (`used.each` at :116, `keys =` with typing_loop at :118; the info line at :122). PLAN.md:51 cites `what` at :130, :140, :147, :171 with the writer at :99. Verified in office-room-tone.js: duck :130, typing :140, started :147, spot :171, `_note` :99. Sounds: sound-manager.js:122 (server_room_ventilation), :127 (office_ambient), :129 (kitchen_tone), :131 (typing_loop).
- **m3, closed.** "At least 2 during each 60 s dwell" is right: any 60 s window holds three 20 s boundaries (SPOT_SLOT_MS, office-room-tone.js:19), and `lastSlot` is seeded at the first poll (:153) and moves on every poll (:151-157), so 250 ms poll lag can cost one. The by-construction remark is true: room-tones.json profiles office/it/quiet_office/server/kitchen: `it`, `quiet_office`, `kitchen` and `server` all have `spots: []`. The needs system is installed for every scenario (core/game.js:2088), so `clockMs` exists in m08 and advances (npc-needs.js:659-671, 250 ms ticks).
- **m4, closed.** SPOKEN_LINES.md:15 tells the builder to edit the "None planned" line on a b answer.

## Other checks (no problems)

- Room type keys: room_hq_lobby :611, room_hq_director :1447, room_hq_ops :1625, room_hq_intel :1758, room_hq_servers :1885, room_hq_archives :1978, room_hq_crypto :2040, room_hq_interview :2160, room_hq_break :2324 (scenario.json.erb). All nine match the table in PLAN.md section 2, and all five mapped types exist, so the validator's "no room has that type" warning (validate_npc_needs.rb:100-103 region) will not fire.
- No room authors an `ambientSound` (grep of scenario.json.erb finds none), so archives and interview are silent as the plan says; `profileIdFor` (office-room-tone.js:42-47) returns null for unmapped room_hq_* types as room-tones.json has no such `types` entries.
- Profile levels: quiet_office 0.35, `it` 0.8, server 0.6, kitchen 1.0 (room-tones.json), matching the plan and test 5.
- Test 5 `started` rule (office-room-tone.js:145: step 1 or 2, `sm.currentAmbient === c.key`) is consistent with the plan's key-and-level assertion. Null room keeps the bed: ambient-choice.js:30, core/rooms.js:3305. chatter-falloff-proof.mjs:20 has the autoplay flag.

## Findings

**m1 (minor). The re-check wording in SPOKEN_LINES.md:11 is a little narrow.**
SPOKEN_LINES.md:11 says safeEvaluateCondition spans npm-manager.js:25-122 and the delay "re-checks only that condition (:925-938)". The function runs to :132 (compound `&&` handling at :123-131), and the re-run goes through `_mappingWouldFire` (npc-manager.js:1260-1307), which also re-tests `once`, `maxTriggers` and the 5000 ms default cooldown, not only the condition. The conclusion (no player-room term) is unaffected.
Fix: cite `:25-132` and say "re-runs the mapping's checks (once, cooldown, condition; `_mappingWouldFire`, :1260-1307), none of which reads the player's room".

**m2 (minor). The typing assertion in test 6 is also true by construction and has no control of its own.**
PLAN.md:51 asserts no `typing` entry has `count > 0`. A `typing` entry is written only when the typist count changes (office-room-tone.js:137-141), and `officeTypists` counts seated NPCs working a PC. m08 has no needs NPCs and no presets, so the count stays 0 whatever the engine does, and the assertion cannot fail. The lastSlot control covers the clock, not this. Also, a stalled clock has two ordinary causes outside tone code: `ambienceSuppressed` returns early (office-room-tone.js:123) and an active VM pauses the needs clock (npc-needs.js:667), so a failed control should be read as "test setup", not "tone broken".
Fix: add a sentence to test 6 that the typing assertion is true by construction (the point is only to catch a profile leak into a room with `typing: true`), and name `sm.ambienceSuppressed` and VM-active as the two things to rule out first if the lastSlot control fails.

## Verdict

Accept. 0 blockers, 0 majors, 2 minors, both wording only. All four R3 minors are fixed and every cited line I opened holds. The commit introduced no wrong citation, room type key or test step that passes for the wrong reason beyond the by-construction notes above.

## Assumptions

- Assumption: I took R3's checks of core/rooms.js:2909-2916, state-sync.js:43/:570-571 and the m10 delayMs precedent as holding; I did not reopen them.
- Assumption: negation support for `!globalVars.analyst_ko` is at about npc-manager.js:80-81 (read from a relative sed offset), not an exact line I cited.

## Outcomes

- m1: fixed. SPOKEN_LINES.md now cites npc-manager.js:25-132 and says the delayed re-check also tests `once`, `maxTriggers` and the cooldown, none of which reads the player's room.
- m2: fixed. PLAN.md test 6 notes the typing assertion is true by construction and names `ambienceSuppressed` and an active VM as the first suspects if the `lastSlot` control fails.
