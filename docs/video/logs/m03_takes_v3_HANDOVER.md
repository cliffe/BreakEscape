# m03 takes v3 handover (Phase 1, dry runs; no BE_SPRITE ever set; rig stopped)

Run everything from the worktree .claude/worktrees/v-trailers-1120. Rig: keyless :3017, display 113, FOOTAGE_ROOT=$HOME/video-takes-local (see the brief). Dry takes are in ~/video-takes-local/m03/takes/ (not yet renamed dry_; move to old/ or rename when done). run-take.sh checked: it changes no sprite when BE_SPRITE is unset (new-game.rb only switches it for BE_SPRITE or an avatar invalid for validSprites; the avatar read was female_hacker_hood_v2, valid).

## Done, passing check-take
- t01b_hax_stakes (flags "" ; ""): trimmed 37.17 s, drop 0.08%, A/V -35/-52. Target line-start 31.31, line-end 36.02 (4.71 s), stakes-done 36.1. Path: Skip the background > That's everything > I'll be thorough. Own driver: no continue clicks after the last choice (a click leaves the voice queue playing the skipped line; run 1 failed that way). Frames 31.1-36.4: HaX portrait, subtitle bar, no menu at 36.4, no toast.
- t19_victoria_pitch (day; "--start-room conference_room_01 --unlock conference_room_01 --set briefing_played=true" ; "--hide-hud --zoom-step 1"): 70.97 s long (every line heard in full, 3 scripted choices, all with Influence toasts but before the target), drop 0.14%. Walk 1.45-2.05 s (0.6 s, straight up, 56 px; room is small). Target line-start 63.68, line-end 68.86 (5.19 s), pitch-done 68.96, menu appears about 70.0 (frame 70.1 shows it): out by 69.6. Needs _beat.mjs `steps` option (added, backward compatible; loop timeout raised to 150 s).
- t20_rfid_emulate (day; same flags as t19; record flags same): 14.07 s, drop 0.20%. REAL card: setup opens Victoria's chat (the wait for person-chat timed out, but the clone was accepted), then the game's own clone minigame with cloneSource npc_id victoria_sterling: Read, Darkside, Save (about 30 s) off camera; then goRoom main_hallway, moveToNear door. Marks: door-interact 1.66, reader-open 3.73 (Emulate click), door-open 8.09, walk-start 8.09 to walk-end 12.1 (straight up into the dark server room). Frames: reader panel small and centred (crop in), "Access granted"-style screen 4-5.5, green tick 5.5-7, hallway then walk through the open door. Readability of any hex/UID NOT yet checked at full resolution (blur hook is in the script); check frames 3.7-8 at 1x before use. The take is day; mission_phase flips after the clone (hallway looks lit, server room dark).

## Not started
- t09b_ffion (night, "--set briefing_played=true --set clone_call_done=true --set mission_phase=act2_infiltration"; straight key-driven approach: line up off camera, then one axis; use makeBeat from _beat.mjs with order and start/stop on one axis, check t09_ffion.mjs for its constants; target "Is Ms. Sterling expecting you this late?" and it plays before the fourth flag only).
- t21_victoria_reckoning (all four flags via --submit-flag, see docs/video/scout/m03_scout.md section 3, plus --set transaction_log_read=true, night; route in the brief; use makeBeat steps with start/stop near Victoria; stop before confrontation_decision).
- t16d_desktop (Danny's workstation in danny_office at night, or Executive Computer after login; report what is on screen and anything readable).
- Then the takes table update (docs/video/takes_m03.md) and the final report.

## Gotchas
- pgrep for remotion matches the own shell; use ps -eo pid,args | grep with brackets.
- /tmp/claude-1000/marks.py prints trimmed marks from a .trimmed.markers.json (scratch; recreate if gone).

## Update (phase 1 finished, 2026-11-22)
All six dry takes pass (t01b, t19, t20, t09b, t21, t16d); table in docs/video/takes_m03.md "v3 takes". t20 frames 3.7-8.1 s checked: the UID block is blurred, nothing readable. Dry files moved to ~/video-takes-local/m03/takes/old/. _beat.mjs has `align: true` (off-camera pulse alignment) for straight walks. Rig (:3017, display 113) stopped. Next: re-record finals with the plan's avatars (BE_SPRITE per M03_TRAILER60_V3_PLAN.md), then window 2 (t10b_zainab, t17b_guard).
