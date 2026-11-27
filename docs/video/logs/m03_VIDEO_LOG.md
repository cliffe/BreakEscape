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

## v2 feedback (2026-11-22, user, pasted from the page)
Verdict: **revise, and a new cut**. Notes, with the task each one became:
- 0:15 the RFID beat must stay on screen longer (new mechanic); drop the phone and PIN flashes from that section. → v3 gives RFID its own card and a read-save-emulate-door sequence of about 3.5 s.
- Replace "Uncover the Mystery": cards advertise this mission's story, as m02's did; "Real Hacking" stays (USP). → house rule now (recipe card pattern).
- 0:24 the walk zig-zags. → straight key-driven walks (video-takes rule).
- 0:27 Ffion says "this late", then the next shot is bright day and Zainab glitches against her desk. → day shots grouped before the night turn; re-take Zainab away from the desk.
- Zainab blinks one eye only. → game fix on branch fix/m03-zainab-blink-terry-revoice (viseme blink frame).
- 0:36 Terry's torch brighter. → engine option on branch feat/npc-torch-strength, set on Terry.
- 0:46 empty desktop: not a good example. → a desktop with content, or drop it.
- 0:45 show the player at the door, then the lockpicking, then the guard's line; re-voice Terry's line angrier/frustrated (the user's yes for that one line). → sequence in v3; re-voice on the fix branch.
- Ending "Competent is cheap" is not exciting. Less spoiler caution: trailers sell ENTROPY's threat, the puzzles, real hacking, action and new mechanics. → new cut v3, ending on Victoria's confrontation line. Rules written into GUIDELINES.md, recipes/README.md, mission-trailer.md, video-scout and video-takes skills.

## v3 edit (2026-11-22, edit list only, not rendered)
- Files: `tools/video/edits/m03_trailer60.json` (id `m03_trailer60_v3`, ends on "I sleep perfectly") and `tools/video/edits/m03_trailer60_alt_ghost.json` (id `m03_trailer60_v3_alt_ghost`, ends on the Ghost line). Both 60.000 s, lint 0 errors (take-not-found warnings only come from the lint path; the Real Hacking clip is final footage). Built from a script (scratchpad), same music window as v2 (Shadow Code 1 from 51.619).
- Timeline (s): title 0-6; hook t01b 32.24-35.84 (J-cut 1.4 under the title) 6.0; card Mission 3 / Ghost in the / Machine 9.6; Zainab walk t10b 1.4-2.43 at 11.1 (ends on the 12.136 drop); Zainab chat t10b 9.85-13.75 at 12.13 (3.9 s, blink at 13.5 kept); Victoria pitch t19 63.3-68.87 at 16.03; card Clone / Their Cards 21.6; RFID 22.8-26.9 (t04 2.6-3.3, 8.5-9.1; t20 3.8-4.4, 4.5-5.4, 5.4-6.0, 7.8-8.5) = 4.1 s; card Real / Hacking 26.9; walk_vm t07 2.1-2.7 at 28.1; console clip 0.4-2.2 at 28.7; lights strike t02 3.3-4.5 at 30.5 (night turn); Ffion t09b 7.4-10.43 at 31.7 (L-cut post 0.35 because the menu fades in at 10.5, 0.27 s before the line ends); card Don't Get / Caught 34.73; t17b map 86.5-87.23 at 35.93, t03 lockpick 4.0-4.73 at 36.67, Terry chat t17b 95.2-98.4 at 37.4, chase t17b 101.9-103.4 at 40.6; card Before the / Next Sale 42.1; crescendo 43.3-46.5 (keypad, phone, flag station, Yusuf flash, CyberChef, lockpick, RFID reader, Danny's Workstation desktop 0.8 s); villain 46.5-52 (main: wide t21 72.49 + close 74.62-77.99, cut in the line's gap at 74.63, close zoom 1.5 cx .66 cy .34; alt: wide 64.88 with a 1.0 s J-cut + close 66.70-70.37, gap at 66.7); bumper 52-60.
- Gains: HaX +1.9, Ffion +2.3, Zainab +3.0, Victoria pitch +7.6, sleep +7.2, ghost +6.1, Terry +1.5 (v2 value, new voice unmeasured). From integrated LUFS per line in the takes, matched to v2 (HaX -13.3, Ffion -10.4, Zainab -8.6, Victoria -9.0). Momentary peaks in the mix are not measured yet (no render).
- Provisional (note "PROVISIONAL: re-take pending"): t20 shots (4), t17b map, Terry chat and chase (3). Frames were checked on the earlier t20 and t17b files (in `takes/old/`); marks are those of takes_m03.md. t20 shows the door open but no walk through it yet.
- Compromises: (1) the music has no lift between 14.2 and 44.5 s, so the night turn (30.5 s) is not on a lift; the 12.136 drop lands on the Zainab cut instead. (2) No Danny portrait take exists: Danny appears only through his workstation desktop (t16d). (3) Lights strike take is a day take (reception stays lit), as in v2. (4) Mission card is three lines to keep about 12 characters per line; check it renders. (5) No Zainab walk-to-chat bridge beyond a 1.03 s walk. (6) Zainab walk framing cx .5 cy .42 zoom 1.7 is chosen from contact sheets, camera scrolls during the walk: verify in the render.
- Not checked: the 1.5x crops and the t17b/t20 framings were set from frames by eye, no render.

## v3 render (2026-11-22)
- The render agent re-timed the t17b and t20 shots to the re-takes and rendered both cuts (03:03, 03:08), then stopped while waiting on its own render loop; the orchestrator finished the round.
- Frame check found 0.3 s of the player's own portrait (save name "playtest" in the subtitle bar) before "I sleep perfectly" in the main cut: villain_wide in moved 72.49 to 72.80 (Victoria's portrait is up by 72.80), cr_desktop lengthened 0.8 to 1.1167 s (t16d out 5.5167) to keep 60.000 s. The alt cut was clean (its wide shot starts on Victoria).
- User note the same day: a new mechanic's card names it. "Clone / Their Cards" became "RFID / Cloning" in both cuts.
- Levels (ebur128 momentary max per cue): HaX -8.8, Zainab -8.3 (gain 2.4 to 1.9), Victoria pitch -8.3, Ffion -10.0, Terry -10.4 (re-voiced clip, gain 1.5 unchanged), main ending -9.0 / -11.5, alt ending -8.8 / -10.7. villain_close gain +1.2 (8.4 main, 7.3 alt) moved the close only 0.2 dB: the dialogue bus compresses it. Left for the user's ear.
- Renders `~/video-takes-local/m03/renders/m03_trailer60_v3_16x9.mp4` (60.000 s, -14.0 LUFS, TP -1.4) and `m03_trailer60_v3_alt_ghost_16x9.mp4` (60.000 s, -14.0, TP -1.1). Keypad flash shows 137 (code 5829). Danny's desktop now has a "GHOST - Hospital..." folder.
- Page tab "m03 · v3" (both cuts), doc `feedback/m03_trailer_v3`, assets ef1c12a85fb189fde489590213edc754 (main), feade6d3530fe7008c475f59f3d484a4 (alt), poster 2fff5f87c8caf5a47cef39e26074e5c9. Same page: tab "Lines m04–m10", doc `feedback/trailer_lines_m04_m10`.
