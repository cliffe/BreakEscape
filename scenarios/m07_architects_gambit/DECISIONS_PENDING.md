# m07 decisions pending (pass 5, started 2026-10-13)

The pass runs without the user's input (user, 2026-10-13). Each item has a recommendation; where the orchestrator went ahead with a reversible mission-local choice it says so.

## U1. m07/m08 timeline (M6)
m07's briefing has the intercept for six hours; m08 has Nightshade reading the Portland plan two days earlier.
**Orchestrator went ahead with** the m07-side fix: one "contingency board since Thursday" line in the briefing, no m08 edit.

## U2. Cross-mission state (engine; backlog "Carry choices between missions")
m08's "nine days ago" matches the day m07's Trojan Horse backdoor wakes. Recommendation: defer the engine work; use fate-neutral lines meanwhile, including one acknowledging m06's freeze-or-watch choice.

## U3. SecGen checks (needs the user, outside the session)
From alignment review cycle 1 (`ALIGNMENT_REVIEW_P5_C1.md`): where each flag sits (as HaX's texts describe them), one target host or two, the Kali IP, whether flag 4 can be reached without flags 1–3, the CyBOK NS and OSV keywords. Needs checking against SecGen by the user.

## U4. NFS field guide URL
A permission check refused the reviewer's look at the guide's front matter; not pursued. Please confirm `.../labs/safetynet/nfs-and-netcat-leaks/` is live before the blind playtest.

## U5. Engine: an all-optional aim completes on its first task (from alignment round 1, regression M-3)
To stop the required `*` showing inside "Trace How They Got In (Optional)", every task in that aim is now `optional: true` (`scenario.json.erb`, aim `trace_the_intrusion`). The panel then marks none of them, as intended. Side effect: `objectives-manager.js:847` (and `game.rb` `check_aim_completion`) treat optional tasks as settled, so an aim whose tasks are all optional completes the first time any task settles: entering the generator hall now shows "Aim complete" and folds the aim, with the vault tasks still to do (the same family as regression m-13). **Recommendation:** engine change so an aim with no required tasks completes only when every task is settled (or the conclusion fires). Alternative without engine work: drop "(Optional)" from the aim title and put the two tasks back to required, so `*` means "required for this aim". The mission-local choice stands until the user picks.

## U6. Shared room maps: wall pictures outside the walls (regression m-10)
The wall painting that floats outside the right wall of `scada_control` also floats outside the east wall of the checkpoint (browser check, game 2391). The scenario places no pictures; they come from the shared room maps (`public/break_escape/assets/rooms/room_control_1x2gu.*`, used by m04, m07, m08 and sis02, and the checkpoint's `room_security` map), so it is not a mission-side fix. Left for the room-dressing stage to confirm and, if it is the map or engine, for the user.

## U7. HaX on the phone has no `spriteSheet` (regression M-2)
The orchestrator asked for HaX's sheet, phone avatar and bust as m04/m06 wire them. m04/m06 wire them on person NPCs; m07's HaX is a phone NPC, and the validator rejects `spriteSheet` on one (it never spawns a sprite). She now has `spriteTalk`, `spriteVisemes` and the `agent_hax_headshot.png` avatar, which is all the debrief bust reads (`person-chat-portraits.js` setupSpriteInfo). Nothing for the user unless HaX should appear in person somewhere.

**Orchestrator on U5 (2026-10-14):** take the no-engine route for now: drop "(Optional)" from the aim title and make its two tasks required again (the aim gates nothing, so it simply stays open). Engine fix stays in the backlog; overrule if you want the engine change instead.
