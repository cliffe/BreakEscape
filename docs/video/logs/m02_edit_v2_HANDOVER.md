# m02 trailer edit v2 handover (2026-11-20)

Edit and log are committed (see `docs/video/logs/m02_VIDEO_LOG.md`, v2 entry). The 16:9 render was started in the background and takes about 30 minutes (machine load is high, a capture runs on another display).

Render command (run from the worktree root):
`FOOTAGE_ROOT=$HOME/video-takes-local BE_CLIPS_DIR=$HOME/video-takes-local/m02/clips BE_TAKES_DIR=$HOME/video-takes-local/m02/takes BE_RENDER_DIR=$HOME/video-takes-local/m02/renders BE_VIDEO_SCRATCH=$HOME/video-takes-local/m02/render-scratch-v2-16x9 nice -n 19 tools/video/remotion/render.sh tools/video/edits/m02_trailer60.json 16:9`
Log: `$HOME/video-takes-local/m02/render_v2_16x9.log`. Output: `$HOME/video-takes-local/m02/renders/m02_trailer60_v2_16x9.{mp4,srt,contact.png}`. The scratch folder is deleted on success; if it failed, delete `render-scratch-v2-16x9` by name. Check `pgrep -af 'render.sh|remotion'` first: do not start a second one.

To check when it finishes:
1. `ffprobe` duration 60.000 s (59.97 to 60.03); `ffmpeg -i <mp4> -af ebur128=peak=true -f null -` gives -14.0 LUFS (13.9 to 14.1) and true peak under -1 dBTP (edit target -1.5).
2. One frame per shot (shot starts from the edit's durations; frame 3 s into each is fine) to confirm take, crop, avatar and no readable secret. Particular points: cr_password (3 dots, no post-it strip), cr_cabinet (contents row visible), cr_flag ('No flags submitted yet' visible), cr_reeves (portrait only), m_ghost_terminal (no reply choices), the console clip (no credential).
3. Audio: HaX's line starts about 4.9 s on the timeline under the title and the picture joins at 6.0 s; confirm no click of the earlier line at the J-cut start and that the voice is at least 3 dB over the ducked music.
4. Then fill LUFS, true peak and the frame-check result into the v2 entry of the video log and commit by explicit path. 9:16 and 1:1 are not rendered (they follow the ship verdict).
