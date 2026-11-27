# m02 takes v2 handover (2026-11-20)

Done: all 22 takes the edit list uses recorded as spies/hoods and passed check-take (see docs/video/takes_m02.md "v2 takes"); avatars file docs/video/edits/M02_TRAILER60_AVATARS.md; picked lines checked via real /tts (all 200); frames viewed for t01-t08.
Open: view frames (grid helper: ffmpeg -ss T -i $FOOTAGE_ROOT/m02/takes/<id>.trimmed.mkv -frames:v 1 -vf scale=800:450) for t09, t12, t14a-d, t16, t17, t22, t24, t25, t26, t27, t28; check t14d post-it crop, t16 window (take is shorter), t17 offer panel, t27/t28 windows; then fill windows in the table. t10/t11/t15 failed (not in edit; see doc). Finish sidecars (<id>.take.json) is not done.
Files: docs/video/takes_m02.md, docs/video/edits/M02_TRAILER60_AVATARS.md, this note. No script changes. Footage in ~/video-takes-local/m02/takes.
Gotchas: env exports VIDEO_STATE_DIR=$HOME/.cache/be-video-state-113 BE_DISPLAY=113 FOOTAGE_ROOT=$HOME/video-takes-local BE_PORT=3017; game ids from newgame.log work for tts-test (--game 10988); Reeves npc id night_security_supervisor, HaX briefing id opening_briefing_cutscene. Batch driver lines in the scratchpad (batch.sh with id|avatar|newgame|record).
