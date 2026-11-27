# m03 trailer edit v1 handover (2026-11-21)

Status: music analysed, frames studied, plan fixed. No edit JSON, no clip, no render yet (first agent ran out of context). Nothing captured, nothing written to ~/safetynet-footage.

## Done
- Music: librosa is not installable via venv here (no python3-venv). Worked: `pip3 install --break-system-packages --target $S/m03e/pylib librosa==1.0.0` then `PYTHONPATH=$S/m03e/pylib python3 tools/video/edits/music/analyse_music.py --length 60 tools/video/edits/music "public/break_escape/assets/music/CutScene/Shadow Code 1.mp3"` (S = scratchpad). Wrote `tools/video/edits/music/shadow_code_1_60.json` (118.65 BPM, period 0.5057, bar 2.0225 s). The tool's own best window (35.437) has no quiet opening, so it is not used.
- Chosen window: `music.start` 51.619 (a bar line), length 60. Bars from the window start: quiet 0-12.1 (rms 0.05-0.08), LIFT/DROP at 12.136 (frame 364; bar 63.755 of the track), loud (0.2-0.24) 12.14-44.5, then a lull from 44.5 (quiet bars at 46.5, 48.5...) with a small rise at 58.7. Bar lines after the drop: 14.16, 16.18, 18.21, 20.23, 22.25, 24.27, 26.30, 28.32, 30.34, 32.36, 34.39, 36.41, 38.43, 40.45, 42.48, 44.50. Beat is not a clean frame count: use snap:false, frame-aligned.
- Plan for the lull: crescendo ends about 44.0; t17 guard placeholder cuts in at 44.5 so Terry's line plays at the drop to the lull; Victoria 47.4-52.0 in the quiet; bumper from 52.0.
- Alternatives (not tried): other windows keep a loud span of only about 30 s, so none fits better.

## Timeline plan (s; 6 title + 46 + 8 bumper)
hook 6.0-9.9 (t01 hook_1; voice measured 8.12-11.15 by silencedetect: pre-voice blip 7.57-7.78, silence 7.78-8.12; audio start 7.95; picture e.g. in 8.4 out 11.5, pre about 0.45, line "They don't run the attacks. They arm the cells that do."); card "Mission 3 / Ghost in the Machine" 9.9-11.7; t02 lights shot from 11.7 with strike (take 3.92) at 12.136, so in about 3.5, dark navy 3.5-3.9, lit by 4.3; montage A (t03, t04, t05, t06 about 1.2 each); card "Real / Hacking"; t07 walk 0.8; console clip about 2.2-2.6 s; t08 1.0; card "Uncover / the Mystery"; Ffion approach 1.0 + line; Zainab approach 1.0 + line; Yusuf approach 1.0 + line; t12 Terry patrol 1.0-1.2; card "Choices with / Consequences" (pin dissolve join in and out); t13, t14, t15 walks about 0.7 each; threat card "Before the Next Sale" at about 40.45; crescendo 2.5-3 s (t16b RFID reader in 5.0 out 8.0; t16c desktop in 4.2 out 6.5 crop y<=870; t16a flag station in 10.9 out 12.8 only; face flashes 1-3 frames: Ffion/Zainab/Yusuf/Danny portraits from the talk frames); t17_guard PLACEHOLDER 3.0 s (Terry "Picks. Right. We're done talking." 3.29 s, J-cut; stand-in picture from t12, gain -120, placeholder:true); t18_victoria PLACEHOLDER about 4.6 s (wide 1.4 then close; "Competent is cheap. That's not why you're here." 3.98 s; stand-in from t13 conference door, wide then 3x crop; placeholder:true). Cards 1.2 s each; total shots sum to 46.0 between presets (m02 pattern: `{"preset":"safetynet-open","snap":false}` first, `{"preset":"hacktivity-close","snap":false}` last). Budget is tight (about 2.6 s slack); cut walk/montage lengths before cutting any mandated item.

## Measured audio (LUFS, take windows)
HaX hook 8.1-11.2: -13.3. Ffion expecting line (t09 9.17-11.89): -12.4 (jump line 5.05-8.15: -15.2). Zainab (t10 10.8-14.2): -11.5. Yusuf (t11 3.6-7.59): -15.0. So gains vs HaX: Ffion about -1, Zainab about -2, Yusuf about +1.5; confirm in the render. Ambient in approach windows is quiet (-37 to -62 LUFS; footsteps), walk takes -33 to -37, t03 lockpick -28.5, t12 -70. Mute map shots with gain -120 if anything intrudes (none loud).
Voice windows: Ffion expecting 9.17-11.89 (picture in 9.4 out 12.15, menu at 12.3; pre 0.4); Zainab speech 10.83-14.2 (gaps 11.27-11.93, 12.9-13.54; picture 10.6-14.45, menu 14.9; black frame at 10.5); Yusuf 3.6-7.59 (black frame near 3.2-3.3, menu dims 8.0; picture in about 4.1 out 7.7, pre about 0.6). J-cut rule used: audio start = voice onset - 0.1; pre = (picture in - audio start).

## Crops chosen from frames (16:9; all frames are full 1920x1080 with the room small and black margins)
- t02 (day take, room scrolls): zoom 1.5, cx 0.675, cy 0.33.
- t03 lockpick: zoom 1.5, cx 0.5, cy 0.48; window 4.0-5.6 (pins set).
- t04 RFID: zoom 1.8, cx 0.5, cy 0.5; window about 7.9-9.2 (progress then "Saved Staff Access Badge"); UID blurred.
- t05 phone: zoom 1.5, cx 0.5, cy 0.35; window 3.9-5.6.
- t06 keypad: zoom 1.7, cx 0.5, cy 0.42; window 4.4-5.9 (137_ , real code differs; no ENTER).
- t07: zoom 1.6, cx 0.43, cy 0.45; window about 2.1-3.0 (camera settles about 2.3).
- t08 CyberChef: zoom 1.5, cx 0.62, cy 0.35; window 7.6-8.6 (neutral ROT13 input and output, no secret).
- t09 approach: zoom 1.5, cx 0.45, cy 0.42, window 1.6-2.6 (room shifts x 0.26 to 0.15 over 1.4-2.8). t11 approach zoom 1.4, cx 0.55, window 1.9-2.9. t10 approach: 7.0-8.5 (room low in frame, cut at the bottom).
- t13, t14, t15, t12: punch in on the room (see docs/video/takes_m03.md rows); not yet framed.
Portrait conversation shots are full frame (portrait right of centre, subtitle bar at the bottom, a "Continue" button at the bar's right).

## Real Hacking clip (not made)
Source `~/safetynet-footage/m03/solution/vm_console_recon_s949.trimmed.mkv` (read-only), about 35.5-39.5 s. Frame-check, crop to the terminal (m02 recipe x 0-552, y 0-144; adjust), scale to 1876 wide on #21242D, MAC/vendor line OUT, write `~/video-takes-local/m03/clips/m03_console_recon_clip.mp4` (dir does not exist yet). Render needs `BE_CLIPS_DIR=$HOME/video-takes-local/m03/clips`.

## Render recipe (m02 model)
`FOOTAGE_ROOT=$HOME/video-takes-local BE_CONCURRENCY=2 BE_CLIPS_DIR=$HOME/video-takes-local/m03/clips BE_TAKES_DIR=$HOME/video-takes-local/m03/takes BE_RENDER_DIR=$HOME/video-takes-local/m03/renders BE_VIDEO_SCRATCH=$HOME/video-takes-local/m03/render-scratch-v1-16x9 nice -n 19 tools/video/remotion/render.sh tools/video/edits/m03_trailer60.json 16:9` (mkdir renders first; check `pgrep -af 'render.sh|remotion'`, another session had m01 renders queued). Lint first: `node tools/video/remotion/scripts/lint-edit.mjs tools/video/edits/m03_trailer60.json`. Edit mission field "m03", id `m03_trailer60_v1`, beat {bpm 118.65, period 0.5057, offset 0}, music {track "CutScene/Shadow Code 1.mp3", analysis "shadow_code_1_60.json", start 51.619, length 60, fade_out 2.0, alternatives}. Copy shot field shapes (join, framing per aspect, audio pre/post, lines with negative start for J-cut, spoiler block, dialogue/duck_music) from `tools/video/edits/m02_trailer60.json` (v3).

## Helpers (scratchpad, may vanish)
`$S/m03e/strip.sh file out.png t1 t2 ...` (frame strip with timestamps), `$S/m03e/lufs.sh file ss to`. Easy to rewrite.

## Open / for the next agent
Do steps 2-5 of the brief: clip, edit JSON (use a Python builder to sum frames to exactly 1800), lint, render, checks (60.000 s, -14 LUFS, TP < -1, srt cues, frame strip over every shot, voice levels vs HaX), then `docs/video/logs/m03_VIDEO_LOG.md` v1 entry. Q: whether the lull (44.5-58) under Victoria and the bumper is acceptable by ear; placeholders t17/t18 stand-ins.
