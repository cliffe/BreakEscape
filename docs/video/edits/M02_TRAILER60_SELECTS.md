# m02 60 s trailer: selects (orchestrator)

From `docs/video/takes_m02.md` (frames checked there) and `docs/video/edits/M02_TRAILER60_PICKS.md`. Music: Noir "Steel Shadows in E Minor (Remastered)", 60 s window from 50.248 s, 156.01 BPM (beat 0.3846 s, bar 1.538 s), analysis `steel_shadows_in_e_minor_remastered_60.json`. Drop at 10.77 s; 4-bar lifts at 16.92, 23.08, 29.23, 35.38, 41.54, 47.69, 53.85 s. Chosen by beat analysis, not by ear (review question 8). Fade out 2.0 s.

Presets fixed: `safetynet-open` 6.0 s (title, HaX line J-cuts under it), `hacktivity-close` 8.0 s (CTA choreography, do not change). Content between = 46.0 s. Cards 1.538 s on the lifts; the drop card ends exactly on the 10.77 s drop. Frame-align every boundary to 1/30 s and keep the content to 1380 frames (total 1800).

## Timeline (copy m01_trailer60.json structure; all gameplay joins hard cut unless noted)

| Start s | Dur s | id | take / source | in | out | join | notes |
|---|---|---|---|---|---|---|---|
| 0.00 | 6.00 | — | preset `safetynet-open` | | | | title; HaX J-cut under it |
| 6.00 | 2.85 | hax_hook | t01_hax_hook | 15.29 | 18.14 | glitch | line "If they refuse and you're too slow, people die on the ward." voice 14.26-18.14 (3.88 s); J-cut: `audio.pre` 1.04, line.start -1.04, end 2.84. dialogue, duck. framing cx 0.5 (portrait centred; set 9:16/1:1 by frame, caption 9:16) |
| 8.85 | 1.92 | card_mission | card | | | glitch | text ["Mission 2","Ransomed Trust"]; ends on the drop |
| 10.77 | 1.54 | m_lights | t02_lights | 3.30 | 4.84 | glitch | lights strike at 4.51; ~1.2 s dark lead-in then the vestibule lights. Room small: crop in (cx ~0.62). audio -6 |
| 12.31 | 1.15 | m_lockpick | t03_lockpick | 9.20 | 10.35 | cut | real picking mid-pick; panel top at frame edge, crop/accept. **out well before 14.5** (cabinet contents flash). audio -6 |
| 13.46 | 1.15 | m_ransom | t04_ransom | 2.60 | 3.75 | cut | reception ransom screen; crop in (panel ~40% width). no codes. audio -6 |
| 14.61 | 1.15 | m_phone | t05_phone | 4.30 | 5.45 | cut | HaX phone with reply choices showing; crop in (narrow panel). names Gary/IT, no codes. audio -6 |
| 15.76 | 1.16 | m_keypad | t06_keypad | 4.60 | 5.76 | cut | 3 digits 2,5,6 on screen (not the code); crop in. check the hint line is unreadable at full size or crop it off. audio -6 |
| 16.92 | 1.54 | card_real | card | | | glitch | ["Real","Hacking"] |
| 18.46 | 1.92 | walk_vm | t07_walk_vm | 1.40 | 3.32 | glitch | walk up to the SAFETYNET Field Console; console never opens. room small, crop in. audio -6 |
| 20.38 | 1.93 | real_hacking | **placeholder clip** | 0 | 1.93 | cut | `placeholder: true`. m02's own tools; NO old-trailer footage (that is m01/other missions). Needs a built placeholder clip (see below). audio -8 |
| 22.31 | 0.77 | m_cyberchef | t08_cyberchef | 7.70 | 8.47 | cut | **crop to the input pane only: x 962-1864, y 117-577 (exclude output pane y>=581).** Per aspect, check the output stays off. audio -6 |
| 23.08 | 1.54 | card_uncover | card | | | glitch | ["Uncover","the Mystery"] |
| 24.62 | 4.10 | npc_val | t09_val | 7.80 | 11.90 | glitch | val_1 "So. Who are you and who says you're allowed?" 7.80-11.93 (4.13 s). portrait/subtitle bar. **out before 12.7** (choice menu). Val's green LOS cone shows in the walk frames but not here (portrait). dialogue, duck, caption 9:16 |
| 28.72 | 3.70 | npc_doyle | t10_doyle | 10.08 | 13.78 | cut | doyle_1 "The machines still run. Nobody's watching them." 10.08-13.75. dialogue, duck, caption 9:16 |
| 32.42 | 2.96 | npc_pryce | t11_pryce | 10.00 | 12.96 | cut | pryce_1 "Forty years I fixed buses." 9.51-12.98 (3.47 s; shot shows the tail 2.96 s, or widen in to 9.90). **out before 13.5** (next line auto-advances 13.93). dialogue, duck, caption 9:16 |
| 35.38 | 1.54 | card_choices | card | | | dissolve (pin) | ["Choices with","Consequences"]; pinned dissolve both sides |
| 36.92 | 1.54 | mb_val_walk | t09_val | 1.30 | 2.84 | dissolve | the walk-up (1.3 s motion to Val); `--hide-hud`. no line. audio -6. keep out before the conversation opens (3.07) |
| 38.46 | 1.54 | mb_chair | t12_walk_chair | 1.00 | 2.54 | cut | heads for the east door, knocks the swivel chair (contact 2.12). ward lit. audio -6 |
| 40.00 | 1.54 | mb_doyle | t13_walk_doyle | 1.30 | 2.84 | cut | 2 s walk past Sister Doyle, never touches. audio -6 |
| 41.54 | 1.54 | card_threat | card | | | glitch | ["Before the","Ward Goes Dark"] (m02's threat, in the mission's words; not a generic card) |
| 43.08 | 2.30 | crescendo (10) | see below | | | glitch in, then cuts | 69 frames total; Reeves voice J-cuts in under it |
| 45.38 | 2.52 | reeves_wide | t15_reeves | 5.38 | 7.90 | cut (hit 3) | reeves_1 "So you did the work." voice 4.91-7.19 (2.28 s); start it under the crescendo via `audio.pre` ~2.3 and move source.in so the picture joins mid-line, m01 derek_wide pattern. **in after 3.6** (badge id in narration). dialogue, duck, caption 9:16 |
| 47.90 | 4.10 | reeves_close | t15_reeves | 28.40 | 32.50 | cut (hit 3) | reeves_2 "Money. That's the first guess, always." 28.53-32.02 (pause after "Money."); UI-free, 2.5x-3x close crop. dialogue, caption 9:16 |
| 52.00 | 8.00 | — | preset `hacktivity-close` | | | glitch | CTA "Play now", Hacktivity logo Labs->Games on the red curtain |

### Crescendo (43.08 s, 10 cuts, snap:false, frame counts 15,15,7,7,7,7,3,3,3,2 = 69 frames = 2.30 s)

Every cut answer-free; mirror m01's accelerating pattern. Order and source windows:
1. cr_lockpick 15f — t03_lockpick in 9.30 (tension, lock not yet open)
2. cr_keypad 15f — t06_keypad in 4.70 (digits 2,5,6)
3. cr_ransom 7f — t04_ransom in 3.00 (ransom title + timer)
4. cr_recovery 7f — t14a_server_minigames in 3.40 (backup-recovery source cards; top is cropped off; no codes)
5. cr_cyberchef 7f — t08_cyberchef in 8.00 **crop to input pane as above**
6. cr_phone 7f — t05_phone in 5.60 (reply choices)
7. cr_cabinet 3f — t14c_supply_cabinet in 3.20 (first-aid/gloves; nothing secret)
8. cr_password 3f — t14d_gary_password in 4.80 **crop off the post-it (px 920-1152, y 502-578); 2.5x crop away from the bezel**
9. cr_flag 3f — t14b_flag_station in 3.00 ("No flags submitted yet"; empty)
10. cr_walkvm 2f — t07_walk_vm in 2.60 (the console desk) — stands in for the skipped RFID tap

If any crop cannot hide the text in every aspect, drop that cut and rebalance the frames onto its neighbours (keep 69 total). RFID is not in the mission (no tap screen); the inventory is 10 cuts without it.

## Spoiler crops (verify on frames in every aspect, 16:9 / 9:16 / 1:1)

- t08_cyberchef and cr_cyberchef: input pane only, output pane (decoded note) must be off.
- t14d / cr_password: the monitor post-it off.
- t06 / cr_keypad: digits are 2,5,6 (not the code); the keypad hint line unreadable or cropped.
- t03 / cr_lockpick: out before the cabinet-contents flash (14.5+).
- npc_pryce: out before 13.5; npc_val out before 12.7.
- reeves_wide: in after 3.6 (badge id SC-4471 in the narration subtitle).
- t14a / cr_recovery: top of the panel is cut off anyway; shows source names and hours (story, no codes) — keep the cut short.

## Real-hacking placeholder (needs building, Sonnet)

m02 has no footage in the old Hacktivity trailer (that is m01's Hydra/SSH and other missions' sqlmap/dirb). The slot stays a marked placeholder until in-game VM capture exists (recipe + user, 2026-10-30). Build a 1.93 s stand-in clip at 1920x1080 30fps that shows m02's own tools in a neutral way, mark it `placeholder: true` in the edit, and document it in `tools/video/assets/placeholders/README.md`. No answer, login, flag or password value on screen. If no safe m02 clip can be made, use a title-only "Real Hacking (footage coming)" style slate rather than any other mission's footage, and flag it for the review. The review page asks the user (question 4) whether a placeholder is acceptable or the release waits for real capture.
