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
