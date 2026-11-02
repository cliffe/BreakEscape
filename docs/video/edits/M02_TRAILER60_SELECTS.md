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

---

## v2 revision (2026-11-02): Ghost is the mystery and the close; Reeves demoted to a flash

User decisions this round:
- Include **both** Ghost beats: the terminal contact (seed) and the hooded video call (payoff/closer).
- **Ghost closes.** The hooded video call replaces Reeves as the final spoken/visual beat.
- **Reeves** stays only as a sub-second, **face-obscured, non-speaking flash** inside the crescendo. No clear face, no badge, no line.

Engine facts that shape this (checked in the scenario and `public/break_escape/js`):
- Ghost's video call uses `conversationMode: "video-call"` but the mapping has **no `voiced: true`**, and there is no `voiced` flag anywhere in m02. Per the tts-audio skill and `npc-manager.js` (`voiced` is separate from `videoCall`), the call and the terminal contact both render as **on-screen text, silent**. The `fx: voice-distortion` on Ghost's voice is configured but never wired to play. So both Ghost beats are **silent text beats scored to the music**; no TTS is generated (no Gemini key in this container, and voicing it would be a mission change, not a trailer edit).
- Ghost is the only m02 speaker with **zero cached audio** (confirmed across all 1044 cache sidecars), consistent with the above.

### Beat changes against the v1 timeline

1. **Drop `real_hacking` placeholder (20.38).** Retired. This removes the v1 review question 4 entirely (no placeholder, no "footage in capture" slate). Its slot is taken by the Ghost terminal contact (real in-game footage).

2. **Drop `m_phone` (14.61, HaX phone).** Removes the second phone/terminal screen so the only comms screen in the trailer is Ghost's. Redistribute its ~1.15 s within Montage A (lockpick, ransom, keypad hold slightly longer, snap:false, stay frame-aligned).

3. **New `m_ghost_terminal` (Real Hacking section, ~1.9 s, the old placeholder slot ~20.38).** Take `t16_ghost_terminal`. Terminal-themed phone-chat, planted attacker device found on the network. Show the terminal panel: header lines `> DEVICE ACTIVE` / `> CONTACT: GHOST`, then `You found it.` and `It's been listening ever since.` typing out. **Silent.** Keep the bed music at -6. **Spoiler stop:** end before "Through a man in IT sending his seventh email" and before "a drill is a thing somebody has to authorise" (oblique insider hints). Crop to the device panel. ~1.9 s is enough to read two short lines; if the edit needs it readable, borrow a few frames from walk_vm/cyberchef neighbours (keep the Real Hacking block on its lift boundaries). Reads as both "real intrusion" and the mystery seed.

4. **Replace the antagonist close (v1 reeves_wide 45.38 + reeves_close 47.90, 45.38-52.00, 6.62 s) with the Ghost video call,** take `t17_ghost_call`, cut as **two beats from the one take**:
   - `ghost_reveal` (~2.6 s): the terminal goes dark and the video window opens, hooded figure backlit, face in deliberate shadow, the `SECURE VIDEO LINK` frame and the self-view PiP. No text yet or just the opening words.
   - `ghost_close` (~4.0 s): push/hold on the hood with the line **"No name tonight, no face. You get a person."** on screen. **Silent**, scored to the music sting; let the 2.0 s fade begin into the CTA. This is the final image before `hacktivity-close`.
   - **Spoiler stop:** never reach the offer terms (`ghost_states_terms`: "Upload them. Unredacted. To the press terminal." is the moral-choice spoiler) or the "decryption keys... free" offer. Only the top-of-call anonymity lines are allowed: "I have been a cursor to you all night...", "You can look at me while I make it.", "No name tonight, no face. You get a person."

5. **Reeves flash inside the crescendo (43.08-45.38).** Add one **2-3 frame** face-obscured Reeves flash (from `t15_reeves` if a wide/backlit/partial frame hides the face and the SC-4471 badge; otherwise record `t18_reeves_obscured` as a back/shadow take). Non-speaking. Either replace the weakest existing crescendo cut (`cr_walkvm`, the RFID stand-in) or add as an 11th cut and rebalance to ~71 frames. Must not read as a clear identification.

### Takes to record (video-takes, Sonnet)
- `t16_ghost_terminal`: `--start-room it_department`, then pick up `ghost_terminal_device` (item in it_department) -> phone-chat `start`. Capture the terminal text typing out. Keyless :3001 (unvoiced, no TTS). Advance only far enough to show the two safe lines; do not click into the spoiler choices.
- `t17_ghost_call`: `--start-room server_room --set restore_manifest_obtained=true`, then interact `hospital_recovery_console` (type `backup_recovery`) -> video-call `on_recovery_console`. Capture the window opening, the hooded figure, the `SECURE VIDEO LINK` frame and the anonymity lines. Stop before the offer. Keyless :3001.
- Reeves obscured frame: first check `t15_reeves` for a face-hidden frame; only record `t18_reeves_obscured` if none exists.

### Review questions updated for v2
- Q2 (antagonist): Reeves is now only a face-obscured flash; Ghost (faceless by design) is the reveal. Confirm the flash hides him enough.
- Q4 (placeholder): **resolved/removed** (no placeholder in v2).
- New: the two Ghost beats are **silent on-screen text** (the game does not voice them). OK as scored text beats, or do you want Ghost actually voiced in a later pass (a mission change: add `voiced: true` + paid Iapetus/distortion TTS)?

---

## v3 revision (2026-11-02): card retitles, Kali placeholder back, talk-view flashes, location variety

User notes this round:
1. **Remove `m_keypad`** (the PIN keypad beat at ~0:15 in Montage A). The keypad still appears in the crescendo (cr_keypad), so the minigame type is still represented.
2. **Add a Kali-commands placeholder** in the "Hack them back" section: `tools/video/assets/placeholders/hack_them_back_kali_slate.mp4` (1.9 s, marked `placeholder: true`). Stands in for the player's VM/Kali hacking until real capture exists. (A placeholder returns, so `--final` is refused until it is swapped; the review render stays a rough/marked cut.)
3. **Lengthen `m_ghost_terminal`** so the reveal line is seen TYPING, specifically "...I've been watching since you arrived." Use t16 window **~17.8-20.85 s** (~3.0 s) instead of the tight 1.83 s hold. Crop unchanged (x 760-1160, y 60-540).
4. **Remove `npc_pryce`** ("Forty years I fixed buses."). Val and Doyle remain the two NPC voice lines (recipe minimum met). Pryce still appears non-speaking in the ward-crowd crescendo flash.
5. **Card retitles (user confirmed: three cards, drop Choices):**
   - `card_real`: "Real Hacking" -> **"Hack them back"**
   - `card_uncover`: "Uncover the Mystery" -> **"to Hold back the ENTROPY"** (reads with the previous card as the tagline "Hack them back / to Hold back the ENTROPY")
   - `card_choices`: **DROPPED** entirely (the walk montage stays, without its own card header).
   - `card_threat`: stays **"Before the Ward Goes Dark"**.
6. **Location variety in the walk montage:** the two ward walks in a row are broken up. Replace `mb_doyle` (the ward walk past Sister Doyle) with **`t26_walk_room`** (a staff-room walk, in 1.35 out 3.4, crop x 380-1540 y 0-1080). Montage is then corridor (mb_val_walk) / ward chair-knock (mb_chair) / staff room (t26), three distinct rooms.
7. **Crescendo NPC flashes use the talk/portrait view**, not the top-down sprite:
   - `cr_bernie` -> **t23_bernie_talk** (in 3.5 out 6.3, crop x 1100-1650 y 0-940, drops the subtitle bar)
   - `cr_kim` -> **t24_kim_talk** (in 3.6 out 6.5, crop x 1150-1650 y 0-940)
   - `cr_gary` -> **t25_gary_talk** (in 3.5 out 6.3, crop x 1100-1700 y 0-940, keeps his post-its out of frame)
   - **Reeves gets a talk-view portrait too** (`t27_reeves_talk`), like the others. Update (user, 2026-11-02): seeing the NPC is not a spoiler, so his face goes in. Only his badge number (SC-4471) and any culprit-naming narration stay off the captured frame (a code is still a spoiler); crop drops the subtitle bar (y 0-940). The earlier obscured sprite (t15) is superseded.
   - **Ward crowd stays the room shot** (t22): it is a crowd, no single talk view. Covers Pryce/Raval/Hargreaves/Chen.

### Proposed v3 section structure (edit agent to frame-align on the 156 BPM grid, total 60.000 s, CTA at 52.0 s)
- title preset 0-6 / hax hook / card_mission / m_lights / m_lockpick / m_ransom
- card "Hack them back" -> walk_vm -> **kali_placeholder** -> m_cyberchef
- card "to Hold back the ENTROPY" -> **m_ghost_terminal (lengthened)** -> npc_val -> npc_doyle
- (no Choices card) walk montage: mb_val_walk -> mb_chair -> **t26_walk_room**
- card "Before the Ward Goes Dark" -> crescendo (minigames + talk-view Bernie/Kim/Gary + obscured Reeves + ward crowd) -> ghost_reveal -> ghost_close -> CTA preset 52-60

The ~6 s freed by removing m_keypad, npc_pryce and card_choices, minus the Kali placeholder and the longer terminal, leaves slack to rebalance; keep cards on lifts. `cr_phone` stays pending the user's keep/drop call.

---

## v4 revision (2026-11-02): reorder to tell a story

User lesson: the trailer should tell a story, not list features. User notes this round:
1. **After the title card, the ransomware screen comes first, THEN the hospital walking.** So the opening montage order becomes `m_ransom` (the attack) then `m_lights` (walking into the dark ward), not lights-first.
2. **Reposition the nurse and guard lines so each advances the arc** (they were grouped together): the NURSE line (`npc_doyle`, "The machines still run. Nobody's watching them.") moves EARLY, into the premise, to set up the hospital crisis; the GUARD line (`npc_val`, "So. Who are you and who says you're allowed?") sits in the INVESTIGATION section ("to Hold back the ENTROPY"), where she challenges the player. (These are the existing takes t09/t10, repositioned; swap the words only if the user asks.)

Edit-only pass, no new footage. Full v4 order (edit agent to frame-align on the 156 BPM grid, cards on their lifts, total 60.000 s, CTA at 52.0 s):

- safetynet-open (title) 0-6
- hax_hook ("...people die on the ward.") — the call and the stakes
- card_mission "Mission 2 / Ransomed Trust"
- PREMISE: `m_ransom` (the ransomware screen, the attack) -> `m_lights` (walking into the dark ward) -> `npc_doyle` (nurse, the human stakes)
- card "Hack them back"
- `m_lockpick` (break in) -> `walk_vm` -> `kali_placeholder` -> `m_cyberchef`
- card "to Hold back the ENTROPY"
- `m_ghost_terminal` (Ghost's implant, the SAFETYNET reveal) -> `npc_val` (guard, challenged mid-investigation)
- walk montage (no card): `mb_val_walk` -> `mb_chair` -> `t26_walk_room`
- card "Before the Ward Goes Dark"
- crescendo (minigames + talk-view flashes) -> `ghost_reveal` -> `ghost_close`
- hacktivity-close (CTA) 52-60

Key moves vs v3: `m_ransom` before `m_lights`; `m_lockpick` moves from the opening into "Hack them back"; `npc_doyle` moves up into the premise; `npc_val` stays in the investigation section. The NPC lines are long (3.6-4.1 s), so sections shift; rebalance on the grid. `cr_phone` still pending the user's call; the t26 staff-room walk letterboxing still pending the user's look.
