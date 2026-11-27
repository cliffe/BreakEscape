# m01 takes v3 handover (2026-11-20, agent stopped at ~150k tokens)

Env: `export VIDEO_STATE_DIR=$HOME/.cache/be-video-state-113 BE_DISPLAY=113 FOOTAGE_ROOT=$HOME/video-takes-local BE_PORT=3017`. Avatars: docs/video/edits/M01_TRAILER60_AVATARS.md. Footage: ~/video-takes-local/m01/takes.
Batch driver (scratchpad, id|avatar|newgame flags|record flags): /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/aa7bde54-8454-4f29-a091-6d65a3d0b927/scratchpad/{batch.sh,list2.txt,out2.log,marks.py,grid.sh}. batch.sh list2.txt was STILL RUNNING at handover (t19 then t07, t08, t22, t09_derek_v5): read out2.log, do not start a capture until it ends (`ps -eo args | grep batch.sh`).

## Results so far (trimmed s, check pass)
- t10_hax_hook pass, len 21.43, drop 0.14, off -35/-37. Hook line 15.60-19.32 (3.72 s; edit assumed 3.83). Edit window now: in 16.80 out 19.80 (line ends 2.52 into shot, was 2.626). Frames fine (portrait, subtitle).
- t04_lockpick pass, len 13.13, drop 0.22. Pin-set marks 1:4.73 3:5.96 4:6.83 2:8.05, "Lock picked successfully" toast ~9.0, lock-open 10.87. PROBLEM: HaX "Incoming call" banner covers the bottom of the panel (see fix below) -> re-record. Pin order differs per game, so cr_lockpick "Pin 2 set" window needs re-pick from frames (here pin 2 at 8.05).
- t05_phone pass (BE_KEEP_RING not needed, no banner), len 12.07, drop 0.7, off -60/-60. choices 3.70-5.10; pick at 5.10; reply choices 7.46; m_phone window 7.4-8.9 ok (use 7.2-8.7); cr_phone 5.4 no longer shows a reply choice (shows typing dots): use 4.2-4.33.
- t06_keypad_v3 pass, len 13.9, drop 0.21. digits 4.35/4.98/5.62 (1,19,193 shown), entered 6.22, back-off 7.22, minigame stays open to 12.2. Edit m_keypad 5.3-6.8 shows 19 then 193: ok; cr_keypad 4.62-4.89: first digit lands 4.35-4.6, shift to 4.3-4.57. PROBLEM: HaX banner over overworld+panel -> re-record.
- t23_walk_kali FAILED check (drop 1.33%): re-run. t14_cyberchef pass len 11.53 (not yet frame-checked; may carry banner). t11 pass len 14, drop 0.21: target 8.30-11.78 (3.476 s, edit 3.51), window in 8.26 out 12.26 (a 73 ms sliver of the previous line ends 8.25). t12 pass len 33.1: target 27.49-30.89 (3.40 s, edit 3.527, -0.13); window in 27.46 out 31.46 (prior line "...Derek arranged it" ends 27.46, do not start earlier). t13 pass len 21.77: target 15.41-19.54 (4.134, edit 4.23); window in 15.38 out 19.88; "Influence: Sarah O'Brien" toast visible at 15.6 (as before). Frames for t11-t13 viewed: ok, "Skip" button bottom-right on all portrait takes.
- t16_walk_sarah FAILED (drop 1.13%): re-run. t21_walk_chair pass len 5.6, t18_walk_maya pass len 9.57 (frames not viewed).
- t03_lights_on FAILED twice: attempt 1 "1 slate", attempt 2 record timeout waiting for window.__test (page never ready, game 11004, avatar ngozi). t13 recorded fine as ngozi, so likely not the sprite. Investigate: run solo, watch tmp/keyless-3017.log and .record.err; try another avatar.
- Not yet run: t07, t08, t22, t09 (queued in batch), t19 (running).

## Script fix (uncommitted work already in the commit below)
tools/video/takes/lib/lib.mjs clearScreen(): closes window.phoneRinger so HaX's first call (rings 6 s after first main_office_area entry, mapping m01 first_ring) no longer puts an "Incoming call" banner over minigames and walks. BE_KEEP_RING=1 keeps it. Not yet proven live: re-record t04, t06, t14, t23 (and t19/t07/t08 if banners show) and check the closed ringer does not break the take (offers to a closed ringer).

## To do
1. Wait for batch; view frames (2-4 per take, grid.sh) of t14, t16, t18, t19, t21, t22, t07, t08, t09, t23; marks via marks.py.
2. Re-record t04, t06, t14, t23, t16, t03 (and any banner takes) with the lib fix; same avatars.
3. Voice: t10/t11/t12/t13 target lines all produced line-start/line-end pairs (real playback from cache); t09 pending. No wording changes seen in the edit's picked lines.
4. Write the dated v3 section at the top of docs/video/takes_v2.md (row per take: avatar, flags, length, drop, A/V, marks, problems, suggested window); flag windows: hax_hook, m_phone/cr_phone, cr_keypad, npc_1/2/3, cr_lockpick (above).
5. Commit doc, avatars file, lib fix by explicit path.
