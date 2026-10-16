# m07 decisions pending (pass 5, started 2026-10-13)

The pass runs without the user's input (user, 2026-10-13). Each item has a recommendation; where the orchestrator went ahead with a reversible mission-local choice it says so.

## U1. m07/m08 timeline (M6)
m07's briefing has the intercept for six hours; m08 has Nightshade reading the Portland plan two days earlier.
**Orchestrator went ahead with** the m07-side fix: one "contingency board since Thursday" line in the briefing, no m08 edit.

## U2. Cross-mission state (engine; backlog "Carry choices between missions")
m08's "nine days ago" matches the day m07's Trojan Horse backdoor wakes. Recommendation: defer the engine work; use fate-neutral lines meanwhile, including one acknowledging m06's freeze-or-watch choice.

## U3. SecGen checks (needs the user, outside the session)
**Mostly settled 2026-10-16** (`docs/agents/SECGEN_CLAIMS_CHECK.md`; game text aligned, see IMPROVEMENT_LOOP_LOG "SecGen alignment"): flag 1 NFS, flag 2 netcat listener, flag 3 the user account, flag 4 root via a sudo rule; one target host; the flag labels at 3 and 4 fixed. Still open: SSH and the home path aren't configured in the XML (HaX no longer claims either; the SSH guide is still offered), the Kali IP is set at build time (no game text states one), and whether flag 4 can come before flag 3 needs a build.
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

**U5 applied (alignment round 2 fixer, 2026-10-14):** "Trace How They Got In" no longer says "(Optional)", and `secure_generator_room` and `recover_vault_pin` are required again (`scenario.json.erb`, aim `trace_the_intrusion`). The other three tasks in the aim stay optional. Browser look at the aim not folding on the generator hall still owed. The engine fix stays in the backlog.

## U8. The Fingerprint Kit is carried and unused (puzzle chains cycle 1)
m04's print kit is in the cumulative start kit and nothing in m07 uses it. Nothing in the building has a reason to sit behind a print (the handover sheet already proves Hollis's login), and inventing one would fail the "would this object exist anyway?" test. **Recommendation (reviewer and fixer):** leave it unused; cumulative kit doesn't mean every tool gets a lock. The cloner now has a use (F3, the clone at Hollis). Overrule if you want a print use found.

## U9. Engine: the RFID reader opens the cloner screen when there is nothing to emulate (puzzle chains F3)
`unlock-system.js` (rfid case, "PRIORITY 2") opens the cloner minigame whenever a cloner is carried, even with no keycard and no saved clone; it shows "No keycards in inventory" / "No saved cards". F3 gave the cloner a use in m07 (clone Hollis's badge), so the screen is no longer pointless, but a player who hasn't cloned yet still gets it at the first real lock. **Recommendation:** an engine change to show the plain "access denied" toast instead when the cloner holds no saved cards and the player has no keycards. Not urgent; mission-side nothing to do.

## U10. Engine: `combat-config.js` `chaseRange` is read nowhere (puzzle chains F2)
A hostile NPC chases across rooms with no leash (browser N2: Park followed the player from the vault to the control room door). m07 now tunes `behavior.hostile` so every hostile is slower than the player's walk (Hollis 100, Park 80, Mercer 70 against 150), and HaX says walking away works. **Recommendation:** wire `chaseRange` (or a per-NPC leash) in the engine so a hostile gives up past a distance; keep the mission tuning either way.

## U11. Engine: a Restart after a KO respawns the player beside a still-hostile NPC (puzzle chains N3)
After a KNOCKED OUT, Restart puts the player back at the start-room checkpoint at full HP, about 31 px from Hollis, who is restored as hostile at 100 HP, so the first seconds are spent being hit (browser game 2423). Walking east escapes him and nothing soft-locks. No mission-side fix is clean: event mappings can't reposition an NPC or clear hostility, and moving his patrol or start point does nothing once he is chasing from where he stands. **Recommendation:** an engine change so a respawn after a KO resets hostile NPCs to their start state (not hostile, back on their patrol, or at their start position) or moves the respawn out of their reach. It belongs with "Resume in the room you left" and the KO-respawn note in `docs/IDEAS_BACKLOG.md` (line 46-47). Same trap exists in m05/m06 for their hostile NPCs.

## U12. Engine: a hit closes the phone (design round 1 browser check, N1)
A hostile Hollis follows through the ops-floor door and hits about every 1.9 s; `player-damage-interrupt.js` closes the phone on each hit, so HaX's two fight-controls texts (4 s and 8 s after he turns) can only be read after stepping away or after a KO (`PASS5_DESIGN_R1_BROWSER.md`, N1, game 2431). The texts are right and arrive. Logged in `docs/IDEAS_BACKLOG.md` as "A hit closes the phone" (m05/m07; pause NPC attacks while the phone is open, or don't close it on damage). Nothing to do mission-side. Same family as U11.

## E1 (engine, from design review C1). Flag locks with no `requires`
`crisis_control_system` opens a "SUBMIT DECRYPTION KEY" prompt that can never accept a flag, so a correct root flag typed there is called wrong. Engine fix: a flag lock with no `requires` should say where it unlocks instead of prompting. m02's flag-locked cache has the same issue. m07 works round it with a HaX text and task wording. **Applied (design r1 fixer, 2026-10-14):** the HaX text fires on the first console click before flag 4, and all four flag tasks now say "at the relay". The engine fix is still recommended.

## E2. Field-guide titles (check refused)
**Settled 2026-10-16:** the claims check read the five `title:` lines; every item name matches its sheet title apart from the separator (": " in game, " - " on some sheets).
The design reviewer tried to read the `title:` lines of the five unrestricted field-guide sheets to compare them with item names; a permission check refused it and it was not retried. Please compare the item names with the guide titles yourself.

## U13. First room of the new setting: the operations floor (room dressing, cycle 1)
m07 now has its own building, Pacific Northwest Regional Grid Control (six `room_pnw_*` maps; the shared maps are untouched, which also clears U6 for m07). The first room of a new setting needs your sign-off: the **operations floor** (`room_pnw_ops`), the signature space. Dark slate walls with an evergreen line, dark blue carpet with a lighter aisle door to door, the 147-substation wall map with red marker rings, an amber situation video wall, two rows of three front-on operator consoles (position 3 tagged, its chair pushed back), the supervisor's desk on a dais with the plant key and handover sheet. Render: `build_evidence/dressing_c4/first_room_operations_floor.png` (latest; cycle 1 version in `dressing_c1/`); the whole tour in `build_evidence/dressing_c<N>/`. The other five rooms are built in the same style and the dressing cycles carry on meanwhile. **Recommendation:** approve the look, or say what to change (palette, console style, density); later cycles will follow it. Details in `ROOM_DRESSING.md`.

## L1. Situation board after step one runs (lighting cycle 2, m2)
When the clock expires (`countdown_expired`) HaX says "Seattle's dark. Step one ran.", the countdown face changes to SEQUENCE RUNNING / STEP 01, but the ops-floor video wall (`situation_board`, `scenario.json.erb`, ops floor objects) still reads "SCHEDULED SEQUENCE -- PENDING" and its observation says "Every panel on it is amber." So the wall's light stays amber in that state (deepest orange, strongest breathe) and only the control room goes red. **Option A (recommended):** add a `textVariants`/`observationVariants` entry on `situation_board` for `countdown_expired && !grid_saved` (e.g. "SCHEDULED SEQUENCE -- RUNNING / 01 SEATTLE METRO -- EXECUTED / 02-04 PENDING"; "One panel on the left has gone red."), plus a sprite variant with one red panel drawn like the countdown faces in `make_pnw_props.py`; the lighting then turns the wall red (one config line). Object text, not spoken, so no audio cost; it is outside the lighting stage's remit, so it waits for the orchestrator. **Option B:** leave as is.

**Orchestrator on L1 (2026-10-14):** mission-local and reversible, so going ahead in the next fix round: a video-wall text variant and a one-red-panel sprite for `countdown_expired`, then turn the wall's light red. Overrule if you'd rather keep it amber.

**L1 applied (blind run A fix round, 2026-10-14):** new sprite `pnw_video_wall_running1` (`make_pnw_props.py --only video_running`, same 159x42 frame, drawn at native size: the top-left Seattle map panel dark red with red lines), wired as the `situation_board`'s `spriteVariants`; `textVariants` (SCHEDULED SEQUENCE -- RUNNING, 01 EXECUTED, 02-04 PENDING, 124 / 147 substations) and `observationVariants` ("One panel, top left, has gone red. The rest are still amber.") on `countdown_expired && !grid_saved`. The wall's emitter in that state is now red `#ff2a20`, and a new first room-light variant turns the two wall-end lights red. Lighting tour game 2483 (`--check`: ops floor variant 0) shows the red panel and the red light. After the abort everything returns to amber as before.

## D-POV. Conversation (POV) backgrounds: DONE (2026-10-16)
Approved by the user on 2026-10-16 (whole mission, cap 20 Gemini calls). All six rooms done with 12 Gemini calls; Hollis and Elena get a left view each. Wired as `chatBackground` in `scenario.json.erb`. Rooms, calls and accepted faults in `POV_BACKGROUNDS.md`; evidence in `build_evidence/pov/`. Characters are parked for your picks as usual.

## E3. Engine: no way to heal (blind run A, M2)
HP never recovers in play: after a fight the player keeps what is left until a KO resets it to 100. The engine has `window.playerHealth.heal(amount)` (`player-health.js:24`, `healPlayer` at :158), but only `utils/combat-debug.js` calls it; no ink tag, event mapping or item action reaches it. A struggling player in m07 met Park at 24 HP and was effectively told to die to heal. **Mission-side (done):** every fight choice is marked "(Fight him.)" with a warning line, Park's way out is marked (and says on the second visit that there won't be another), and HaX gives the controls before the first fight. **Recommendation (engine):** either slow regeneration out of combat (backlog "HP regen") or a `#heal:<n>` ink tag / `heal` event-mapping action, so a mission can give a first-aid kit or a breather. Not invented here.

## E4. Engine: the password keypad doesn't say passwords are case-sensitive (blind run A, m7)
"Incorrect password. 2 attempts remaining" for `cascadewindow19` against `CascadeWindow19`. The password minigame emits no event on a wrong try, so a mission can't react to it. **Mission-side stopgap (done):** HaX texts "That keypad is case-sensitive. Capital C, capital W." on the first `door_unlock_attempt` at the control-room door once the password is known (fires as the keypad opens). **Recommendation:** the minigame's wrong-password message says "Passwords are case-sensitive" when the entry matches ignoring case, or emits `door_unlock_failed` so missions can respond.

## E5. Restart and reload land at the checkpoint and reopen the Mission Brief (blind run A, m1/m2)
Same family as U11 and the backlog's "Resume in the room you left": after a KO or a reload the player is back at the start room, four rooms from where they were, with the Mission Brief popup (`show_scenario_brief: on_resume`) over it. **Mission-side (done):** the brief no longer goes stale ("You decide which" → "where it goes is your call"). The respawn position is engine work.

## E6. "I'll call you back" didn't seem to close the phone (blind run A, m4)
The hub choice does `#exit_conversation`; the blind run reported the phone stayed open. Not reproduced here (no browser session). For the Sonnet check: pick "I'll call you back" and see whether the phone closes or only returns to the contact list. If it only returns to the list, that is the phone UI's design, not a mission bug.
