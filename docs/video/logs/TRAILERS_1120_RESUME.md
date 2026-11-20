# Trailer update (m01 + m02, spy avatars), resume note for the orchestrator

Request: AC0 (LIVE AC0, uds:/run/user/1000/cc-socks/3710521.sock) relayed the user's ask on 2026-11-20: update the m01 and m02 trailers to main 1f651abce, new spy starter avatars, switch avatar between cuts. Tell AC0 when renders are ready for review (AC0 relays). TTS/PixelLab spend needs a yes through AC0. No db: tasks, no game-row edits.

## Setup (all working)
- Worktree `.claude/worktrees/v-trailers-1120`, branch `video/trailers-m01-m02-spies`. Never commit on main.
- Keyless server :3017 (`tools/playtest/start-keyless-server.sh 3017`), display :113 with PipeWire sink be_rec_113 (`VIDEO_STATE_DIR=$HOME/.cache/be-video-state-113 tools/video/capture/env-up.sh 113`).
- Takes: `export VIDEO_STATE_DIR=$HOME/.cache/be-video-state-113 BE_DISPLAY=113 FOOTAGE_ROOT=$HOME/video-takes-local BE_PORT=3017; BE_SPRITE=<avatar> tools/video/takes/run-take.sh <m01|m02> <id> "<ng flags>" "<rec flags>"`. One at a time (BE_SPRITE flips the shared demo user's avatar; restored after).
- NEVER put takes in `~/safetynet-footage` (Drive pull mirror; unknown files get moved out). Footage: `~/video-takes-local/<m>/takes`, renders `~/video-takes-local/<m>/renders`.
- Never run a render and a capture together (drops, OOM). Node processes run in a 6 GB memory cgroup; render.mjs now caps the frame cache at 1 GB (e137bf78b).
- Render: see `docs/video/logs/m02_edit_v2_HANDOVER.md` for the env vars (BE_CLIPS_DIR etc.), BE_CONCURRENCY=2.

## State
- m02: v2 edit `m02_trailer60_v2` committed (42b621c05). Render done once (60.000 s, -13.8 LUFS, TP -1.49), but the Real Hacking console clip was tiny and showed the MAC/vendor line: rebuilt `~/video-takes-local/m02/clips/m02_console_recon_clip.mp4` as a cropped, scaled terminal (old one kept as `.v2a-uncropped.mp4`). Needs a RE-RENDER, then frame check, then review copy.
- m01: 14 takes passed and frame-checked (notes: v3 section of `docs/video/takes_v2.md`, e4ea3064f; handovers `m01_takes_v3_HANDOVER.md`, `m01_framecheck_HANDOVER.md`). Re-record: t03, t09_derek_v5, t16, t23, t04 and t06 (phone banner; ringer fix in lib.mjs clearScreen unproven), t14 optional. Check t06/t22 avatars (both looked like brown trench). Then edit re-time (windows table in takes_v2.md v3) + render.
- Review page: the old m02 page (D4BSTqrn6qH51pWsUumk1X) is not in this account; make ONE new page with an m02 tab and an m01 tab (video-review skill: assets + db feedback, docs `feedback/m02_trailer_v2`, `feedback/m01_trailer_v9`). Then tell AC0 and send the branch hash.
- Open questions for the user (page): music by ear, show Reeves, ransom wallet line visible, console clip enough, avatar mix; t10/t11/t15 m02 talk takes fail (office life), not in edit.
