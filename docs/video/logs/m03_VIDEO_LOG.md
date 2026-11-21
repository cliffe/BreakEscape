# m03 Ghost in the Machine, 60 s trailer log

## v1 (2026-11-21), `m03_trailer60_v1`, 16:9 only
- Edit: `tools/video/edits/m03_trailer60.json` (37 shots, lint 0 errors; warnings: take files not found from the lint's default path, one "dialogue should sit at full level" on Zainab, clip not marked placeholder). Commit 0c2bd03de.
- Render: `~/video-takes-local/m03/renders/m03_trailer60_v1_16x9.mp4` (+ `.srt`, `.contact.png`), log `~/video-takes-local/m03/render_v1_16x9.log`. Env as in the m02 recipe, BE_CONCURRENCY=2.
- Numbers: 60.000 s, 1800 frames; loudnorm result -14.07 LUFS, TP -1.49 dB (render log); whole-file ebur128 -14.0 LUFS. srt has 4 cues (HaX, Ffion, Zainab, Yusuf); placeholder lines (Terry, Victoria) are in the edit but not in the srt.
- Music: Shadow Code 1 from 51.619 s; drop 12.136 s = the hall lights strike (t02 in 2.55). Loud to 44.5 s, then the lull under t17/t18 placeholders and the bumper.
- Real Hacking clip: `~/video-takes-local/m03/clips/m03_console_recon_clip.mp4` from `vm_console_recon_s949.trimmed.mkv` 38.4-41.0 s (not 35.5-39.5: the scan results only print at about 38.9 s), crop x0-560 y0-178, 3.35x nearest on #21242D. Shows nmap command, four banners (ftp, ssh, http, distccd); MAC/vendor line is below the crop. Frames checked, nothing else readable.
- Timeline: title 0-6, hook 6.0-9.4, card Mission 3, t02, montage (t03 t04 t05 t06), card Real Hacking, t07, console 2.2 s, t08, card Uncover the Mystery, Ffion/Zainab/Yusuf (approach 0.8 s muted + line, J-cut 0.33/0.3/0.6 s), t12 Terry, card Choices with Consequences (pinned dissolve in and out), t13 t14 t15, card Before the Next Sale (41.4 s), crescendo 3.4 s (RFID reader, Ffion flash, desktop, Zainab flash, flag station, Yusuf flash, lockpick, keypad 137_), t17 guard 44.5-47.5, t18 Victoria 47.5-52.0, bumper 52-60.
- Frame strips (4 fps, every shot) viewed: no code, password, post-it, flag value, UID, Danny, toasts or wall bumps. Desktop shot shows the "Victoria Sterling EXEC-WS-VS" taskbar label (crop y<=864 keeps the post-it out). Keypad shows 137_ (real code differs, no ENTER).
- Not used: t16a key-selection screen (staged key); Danny flash (skipped, optional).

## Placeholders
- `t17_guard` (3.0 s): stand-in t12 Terry patrol, no audio; real line "Picks. Right. We're done talking." needs the t17 take.
- `t18_victoria_wide` + `_close` (4.5 s): stand-in t13 conference-door walk and 3x crop, no audio; real line "Competent is cheap. That's not why you're here." needs the t18 take.
- `--final` lint will refuse these.

## Open
- Voice levels in the mix (ebur128 over each cue, music included): HaX -11.5, Ffion -14.3, Zainab -15.9, Yusuf -14.7 LUFS. By take arithmetic they should match within 0.2 dB, so the gap is probably music/ducking inside the windows, but Zainab sounds low by number: re-measure on a stems-only mix, then nudge (Zainab about +1.5 dB, Ffion +0.5) and re-render.
- Music fit by ear: is the lull (44.5-58) under the placeholders and bumper acceptable? Alternatives Midnight Trigger, Cold Bond Circuit.
- Hook line and card wording (Q3/Q4) still for the user; hook picture cuts at 9.4 s before the menu (menu shows from about 12.0).
- 9:16 and 1:1 not built (only 16:9 framing in the edit).

## v1c (2026-11-21, orchestrator)
- Frame check of v1 by the orchestrator: contact sheet and a 6 fps strip over the crescendo (40.3-44.2 s): face flashes are zoomed portraits, flag panel empty, keypad "137_" differs from the safe code 5829 position by position. Lines all finish inside their audio windows (silencedetect on each take).
- Voices: raised Ffion +3, Zainab +5, Yusuf +4 dB (Yusuf post 0.2) over v1. Short-term max in the mix: HaX -11.4, Ffion -12.6, Zainab -13.1, Yusuf -13.4 LUFS. The extra +2 dB from v1b moved them only ~0.6 dB, so the dialogue bus is compressing; the rest of the gap is the louder music after the drop. Asked on the page (duck the music more vs fine).
- Render `~/video-takes-local/m03/renders/m03_trailer60_v1c_16x9.mp4`, 60.000 s, -14.07 LUFS, TP -1.49. Review copy asset e7db2ee71dd0679f8d3b36eb3eb071dc, poster 20818451951427c8dba44855d6f407d3.
- Page tab "m03 · v1" on https://claude.ai/artifact/6JAeGCZXd1neKNc5ccyRea, doc `feedback/m03_trailer_v1`. Questions: hook, threat card, music, Victoria, voices, console, pace, seen.

## v2 (2026-11-21)
- Takes on main 1794ca15b (Ghost deep voice + lip-sync lead), AC0's window: t17_guard (vivian_ashby; catch at 2.46, narrator 2.60-8.70, Terry 9.44-12.73, hostile after) and t18_victoria (frank_callahan; "Competent is cheap" 23.73-27.67). Both pass; check-take now aligns video to 0 (both streams start at 0).
- Lip sync re-measured (lip.py, mouth crop): Victoria onset -20 ms, xcorr -45 ms (mouth slightly early, safe side); Terry onset +20 ms (xcorr too weak). Old build was +45 to +65 ms late.
- Edit m03_trailer60_v2: placeholders replaced by t17_guard_map (0.9 s, cone), t17_guard_line (3.0 s, J-cut 0.36), t18_victoria_close (3.6 s, zoom 1.5, J 0.22, L 0.15 into the bumper); the wide Victoria shot dropped to fit her full line. Shots needed shot-level `dialogue: true` for the .srt (audio.dialogue alone is not enough).
- Render `~/video-takes-local/m03/renders/m03_trailer60_v2_16x9.mp4`: 60.000 s, -14.01 LUFS, TP -1.49, 6 cues. Momentary peaks per cue: HaX -8.5, Ffion -10.4, Zainab -9.2, Yusuf -10.3, Terry -9.8, Victoria -10.4. Ending frames checked at 4 fps (43.5-52.5 s).
- Page tab m03 · v2, doc feedback/m03_trailer_v2 (v1 had no answers), asset 0316a336526d96b9bc87ab47e412c8f7.
