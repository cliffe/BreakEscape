# m01 trailer v9 handover (2026-11-20)

Done: t03b_lights_on recorded and frame-checked (storage_closet, ngozi_adeyemi, strike at 3.41 s, no text); edit m01_trailer60.json is v9 (all windows per takes_v2.md v3 table; NPC shots 4.0/4.0/4.5 s with real line ends; derek_wide cropped cx .5 cy .4 zoom 1.3, no name bar); lint 0 errors 0 warnings; first 16:9 render done: `~/video-takes-local/m01/renders/m01_trailer60_v9_16x9.mp4` (+ .srt, .contact.png): 60.000 s, -13.9 LUFS, true peak -1.5 dBFS (target -1.5, under -1), .srt 6 cues match the voiced lines. Every shot frame checked on that render: right takes, avatars, no banner, no Anniversary post-it, no Derek name bar.

Found on the first render and fixed in the edit AFTER it (so a RE-RENDER is needed):
1. m_lights: the strike showed lit only at 11.95 s (last frame). Window moved 0.25 s later (in 2.5, out 4.0). Check frames at 11.2, 11.5, 11.8, 11.95: want lit by about 11.7.
2. real_hydra clip frame shows the Kali "user: kali password: kali" post-it bottom left. 16:9 framing now zoom 1.25 cy .48 to crop it out. Check the frame at 20.5 s (post-it gone, terminal still readable, the Hydra password still mosaicked). 9:16 and 1:1 not touched.

Re-render (nothing else may be running; pgrep -af 'render.sh|remotion|record-take'):
`cd <worktree> && FOOTAGE_ROOT=$HOME/video-takes-local BE_TAKES_DIR=$HOME/video-takes-local/m01/takes BE_RENDER_DIR=$HOME/video-takes-local/m01/renders BE_VIDEO_SCRATCH=$HOME/video-takes-local/m01/render-scratch-v9-16x9 BE_CONCURRENCY=2 nice -n 19 tools/video/remotion/render.sh tools/video/edits/m01_trailer60.json 16:9 > $HOME/video-takes-local/m01/render_v9_16x9.log 2>&1` (took under 4 minutes). Then re-check duration, `ffmpeg -i f -af ebur128=peak=true -f null -`, the .srt, and the two frames above.

Still to do: append "v9 (2026-11-20)" to docs/video/logs/m01_VIDEO_LOG.md (none existed: create it; render path, numbers, open questions: NPC 3 keeps the green "Influence: Sarah O'Brien" toast for about 0.5 s at its start; Derek wide shows no subtitle name because of the crop but the .srt has it; 9:16/1:1 crops for the new cr_* centres are unverified; the cr_cyberchef shot shows the worked example text; avatar mix as in M01_TRAILER60_AVATARS.md), commit by explicit path, report.
