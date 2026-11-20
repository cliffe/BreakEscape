# m02 "Ransomed Trust" trailer: video log

Mission 2 of SAFETYNET: Licence to Hack. Recipe: `docs/video/recipes/mission-trailer.md`. Newest at the bottom.

## v1 (2026-11-02)

- Review page: https://claude.ai/artifact/D4BSTqrn6qH51pWsUumk1X (feedback doc `feedback/m02_trailer_v1`).
- Scout `docs/video/scout/m02_scout.md`; picks `docs/video/edits/M02_TRAILER60_PICKS.md`; selects `docs/video/edits/M02_TRAILER60_SELECTS.md`; takes `docs/video/takes_m02.md`; edit `tools/video/edits/m02_trailer60.json` (id m02_trailer60_v1, 34 shots, 60.000 s, -13.8 LUFS, true peak -1.5).
- Music: Noir "Steel Shadows in E Minor (Remastered)", 60 s from 50.248 s, 156 BPM. Chosen from the beat analysis, not by ear (open question on the page). m02 plays it in its own Noir playlist; m10 uses it in game. Fallbacks: Shadowline Protocol @82.317, Encrypted Shadows @105.537.
- Real Hacking: a marked placeholder (`real_hacking_m02_slate.mp4`), a titled "footage in capture" slate over the server room. m02 has no old-trailer footage and no attack-terminal output was fabricated. Pending in-game VM capture.
- Antagonist: Graham Reeves shown (the mission's answer). On the page for the user's say-so, with a fallback.
- RFID minigame left out: m02 never gives the player the cloner item, so there is no tap screen to film. Crescendo runs ten cuts.
- Only 16:9 rendered; 9:16 and 1:1 follow the ship verdict.
- Open questions to the user: music by ear; show the antagonist; placeholder acceptable or hold; ransom-note wallet/URL crop; the usual line/pace/spoiler checks.

## v2 (2026-11-20)

- Edit `tools/video/edits/m02_trailer60.json`, id `m02_trailer60_v2`, 35 shots, 60.000 s (lint: 0 errors, 1 warning: the console clip is not marked placeholder). Every gameplay shot points at the v2 take in `$FOOTAGE_ROOT/m02/takes` (FOOTAGE_ROOT=$HOME/video-takes-local); windows and crops from the "v2 edit windows" table in `docs/video/takes_m02.md`.
- Render (16:9, glitch): `$HOME/video-takes-local/m02/renders/m02_trailer60_v2_16x9.mp4` (+ `.srt`, `.contact.png`), started in the background; LUFS, true peak and the per-shot frame check are in `docs/video/logs/m02_edit_v2_HANDOVER.md` (filled in when it finishes). Command and env there. Nothing was written to `~/safetynet-footage`.
- HaX hook: hax_1 is now 4.13 s. Measured on t01: speech 11.97-15.75, silence 11.75-11.9, the previous line's tail audible to about 11.72. J-cut audio starts at 11.80 (`pre` 1.25 s under the title), picture 13.05-15.88, subtitle lines -1.08 to 2.70.
- Slots that no longer matched their window, rebalanced inside the 16.9 s between the "Uncover the Mystery" card and the threat card (both stay on their lifts): m_ghost_terminal in 6.8 out 12.2 (5.4 s, was 4.33; starts after `> CONTACT: GHOST`, ends before the next line types), mb_chair 0.9-3.9 (3.0 s; the player leaves by the door at about 3.4, 0.5 s of empty ward after), t26_walk_room 2.03-3.9 (1.87 s, was 2.67). No frames held, no speed change. Cuts in this stretch no longer sit on the 29.23 and 35.38 s lifts (they were not on them in v1 either; the beat block says shots here are frame-aligned, snap off).
- Table windows applied as given: t28 13.6, t04 2.3, t02 2.91, t03 6.3 and 7.0, t07 1.75 and 2.7, t08 7.633 (input set 7.58), t09 6.3 and 0.85, t26 crop, t24 12.6 (cx .73 cy .204 zoom 3), t14c 3.3 (zoom 2.4), t14d 4.8 (cx .43 cy .54 zoom 3, post-it strip out), t14b (zoom 2.2), t14a (zoom 1.25), t27 13.0, t17 2.35 and 20.05. cr_reeves keeps the v1 crop (cx .69 cy .204 zoom 3): the table's pixel crop is not 16:9, and the frame shows only the portrait.
- Real Hacking slot: the placeholder slate is replaced by the m02 console recon take (`~/safetynet-footage/m02/solution/m02_console_trailer.trimmed.mkv`, read-only), window 27.6-29.5 s (57 frames): the `nmap -Pn -sV -p 21-22 172.16.0.3` command finishes typing and the results return (ftp and ssh banners). No credential, account name or flag is readable (checked on frames 0, 20, 40, 56). Made into a 1920x1080 clip (1024x768 scaled 1.40625x nearest, pillarboxed, `$FOOTAGE_ROOT/m02/clips/m02_console_recon_clip.mp4`; render needs `BE_CLIPS_DIR=$FOOTAGE_ROOT/m02/clips`). Marked as real footage, so `--final` no longer refuses it. Do not ship before you confirm a recon-only console is enough for the "Real Hacking" card.
- Open questions for the user (v1's carried over, none answered yet): music by ear (Steel Shadows in E Minor from 50.248 s, 156 BPM; fallbacks in the edit); show Graham Reeves (cr_reeves is a 3-frame portrait flash); ransom-note crop (the m_ransom and cr_ransom frames show the wallet line and support address). New: is the console recon clip enough for Real Hacking, and the avatar mix (eight spies, none repeated on adjacent visible shots).
