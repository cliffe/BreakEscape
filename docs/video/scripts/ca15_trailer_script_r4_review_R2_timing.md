# Review R2 (silent viewing and timing): ca15 trailer script r4, rev R1 (commit b7bdeed7a)

Script: `docs/video/scripts/ca15_trailer_script_r4.md`. Lens: delta check of the R1 timing findings, then the beat grid, windows against the real takes, VO gates, captions, integer zoom and crops, silent viewing. Frames pulled with `nice -n 19 ffmpeg -threads 1` from `~/video-takes-local/ca15/takes/*.trimmed.mkv` into the session scratchpad (`.../scratchpad/r2/`). t06b and t16 do not exist yet; they are checked for internal consistency only. Review only, no renders.

Counts: 0 Blocker, 4 Major, 10 Minor.

## What passes

- **Grid, main.** 7+10+5+6+6+6+6+5+7+7+10+7+4+9+10+11 = 116 beats = 73.263 s. Every cumulative time in the section 2 table equals `n * 60/95` to 0.01 s (b28 17.684, b46 29.053, b58 36.632, b75 47.368, b95 60.000, b105 66.316). Every in/out pair in section 5 is the stated beat length to 0.01 s (4.42, 3.16, 3.79, 6.32, 5.68).
- **Grid, t06 fallback.** Beats 12/13/14/15/16 = 8/4/7/10/12 = 41 beats, same as 7+4+9+10+11 = 41. Times 52.42, 54.95, 59.37, 65.68 match. Total still 116 and 73.263 s.
- **Windows inside takes.** All outs are before `take-end` and the file duration (t11 out 49.97 of 58.2; t03b 8.77 of 10.07; t15 16.14 of 18.97; t14 15.23 of 19.14; t03c fallback 19.42 of 20.04).
- **Hook (frames 40.93, 43.5, 45.33, 45.50).** Whole bubble on screen 42.82 to 45.35 (2.53 s, readable). No stray stick after the pickup. Swap to the PC line is complete by 45.50. Cached hook clip (ffprobe 3.144 s, silence at 1.64 to 2.15 and from 2.78) matches the take speech (43.14 to 44.78, 45.28 to 45.92). L-cut: "Whose" starts 0.07 s before the cut, ends 0.57 s into the card; the clip's silent tail ends 0.93 s into the card, 0.11 s past v1's start, harmless.
- **Beat 9 (45.55 to 49.97).** Frames at 45.53, 45.55, 45.8, 46.3, 46.9, 47.4, 47.7, 48.3, 48.9, 49.4, 49.8, 49.94: PC bubble only, no toast, no HUD, no tray. The tray and toasts ("Task Complete", "Objective Complete") are not on screen in this window although `hud_toast_on` is at 45.677. Cached PC clip 2.280 s, speech ends 1.93.
- **Beat 8 (35.50 to 38.66).** Frames at 35.5, 36.8, 37.9, 38.63: chatter bubbles only, no HUD, item name or toast.
- **Beat 10 (30.00 to 34.42).** Frames at 30.0, 31.5, 32.3, 32.4, 33.0, 33.2, 33.3, 34.0, 34.15, 34.2, 34.4, 34.42 (gaps 1.5 s or less): no objectives panel, no toast (the "Dropped Red-team stick" toast does not show), no item name in the bar (only "Notes" and an unlabelled slot). RED-TEAM STICK appears only in the menu header from 32.42 to 33.12 (frame 33.0); the menu is gone by 33.2 and absent at 32.40, so the mask 32.35 to 33.20 is right.
- **Beat 3 (t03b 5.61 to 8.77).** Everyday choices panel, no pick, no tally. Beat 7 fallback (t03 15.75 to 18.91): card 3 holds until about 19.10 (card 4 appears at 19.15), 0.19 s margin. Card 3 is settled by 15.72.
- **Delta R1 (applied correctly):** B1 (t06b spec is consistent: row opens at list + 2.0, in = list + 0.10, out = in + 5.68, hold 7.0 s covers the assert window to list + 5.78; fallback in 2.20 / out 6.62 stays 0.15 s clear of `row_usb` 6.77, 3 frames after the 0.04 s slop), M1 (window and mask), M2, M3 (framing values hold), M4 (cx 0.35 holds the whole ask bubble, Fatima, the seated man, kiosk and player; room spans 0.15 to 0.65), M5 (panel 1.125 keeps the 754 px panels whole; the inbox panel is 480 to 1436 px of a 480 to 1440 crop), M6 (gates), m2 (swap margins), m3, m4, m10 (stick 0.49, staff 0.60 to 0.67, bubble to 0.80 fit cx 0.57 at 2, 1.6875, 2).
- **VO.** All new lines are at most 2.2 words/s on the script's own clip estimates (the 3.0 cap is not at risk). Every gate equals window - lead - 0.3 (v22/v23/v24/v25 3.29, v26 2.66, v18b and v27 3.92, v28 3.92 on the shorter fallback window). Cached clips end at least 0.37 s before their cuts. v28 leaves 1.9 s before v10 on the main grid and 0.64 s to the fallback cut. v10 (1.128 s) ends 0.55 s before Fatima's ask (take 10.59).
- **Captions.** All lines are 28 characters or fewer (longest v28 line 1, 26). Reading speeds 10 to 14 characters a second for every caption; Nilesh caption A is 26 characters in 1.55 s (16.8 cps, at the limit). Chips are 8 to 21 characters.
- **No narration over verdict buttons:** beat 14 hides them; fallback ends before they show.

## Major

### M1. Beat 10: the payoff is unreadable at 9:16 and small at 16:9, and the stated reason for 1 / 0.5625 / 1 is wrong

Beat 10 is framed at zoom 1 (0.5625 in 9:16) on the claim "the player crosses the room, no static zoom 2 crop holds it". The camera follows the learner: she stands at x 0.50 and y 0.50 to 0.52 of the source in frames 30.0, 31.5, 32.3 and 33.0 (room scrolls, she does not). At zoom 1 the dropped stick is about 8 x 4 px (4 px at 9:16 0.5625) and "Drop here" is about 7 px tall at 9:16. The payoff of the shot (1.14 s hold on the landed stick) is invisible in 9:16 and tiny in 16:9. The first 1.9 s also show a camera pan with a void at the top (28 percent black at 30.0, 19 percent at 31.5) and the next room's kiosk.

Test: crop 960 x 540 at x 480, y 378 (zoom 2, cx 0.50, cy 0.60) on frames 30.0, 31.0, 31.9, 33.0, 33.35, 34.3 keeps the learner, the staff, the menu ("Drop here") and the landed stick; the void is cropped out. At cy 0.60 she sits near the top edge at 31.0, so use cy 0.57.

Fix: beat 10 at 2 / 1.6875 / 2, cx 0.50, cy 0.57 (16:9 and 1:1). In 9:16, 1.6875 shows nearly the full height, cx 0.50. The 1:1 crop (0.36 to 0.64 wide) holds the learner, stick and menu and clips the staff, fine. Keep the mask 32.35 to 33.20 (source coordinates). The inventory bar and the HUD pop at 34.13 fall outside the crop, which also removes the pop. Voice sync is unchanged: "left that stick" lands on the 3.28 s landing.

### M2. Hook: the line is carried only by the bubble, which is about 8 px tall at 9:16

The hook has no burned caption in any aspect and is framed at 0.5625 in 9:16 (R1 M3), so the bubble text (14 px at source) is about 8 px on a 1080 wide frame. Sound-off 9:16 viewers cannot read "Someone's dropped a memory stick. Whose is this?", the one line the owner wanted whole. Zoom 1.125 cannot hold the bubble's 0.51 travel width.

Fix: burn a 9:16-only caption "Someone's dropped a memory / stick. Whose is this?" (26 and 21 characters), shot time 1.95 to 4.40, placed below the letterboxed picture. That is 19 cps, above the 17 cps norm, accepted because the viewer also hears the line; if a lower rate is wanted, caption "Whose is this?" only from 3.9 to 4.40 plus the first sentence from 1.95 to 3.7. Add a `caption` entry for 9:16 only to the hook row; update the section 3 note "none burned".

### M3. Beat 8: the stick, the subject of v26, is 8 x 4 px at zoom 2 (16 x 8 px on the output)

The beat exists to show the found stick ("Even a found USB stick"). In frames 35.5 to 38.63 the stick is a dark speck at the learner's feet (x 0.49, y 0.60). At zoom 2 it is about 16 px wide on a 1080 high output. With captions off a viewer sees a kettle scene.

Fix: 16:9 and 1:1 at zoom 3 (integer), cx 0.55, cy 0.52 (crop 0.33 wide, 0.33 high: holds the stick, Joanne, Niamh and most of the bubble in 16:9; 1:1 crop 0.19 wide at cx 0.56 holds the stick and Joanne, clips Niamh). Keep 9:16 at 1.6875, cx 0.57. If the owner wants the bubble whole, stay at zoom 2 and add a small label chip instead (the chip already reads `THE OFFICE`; a second chip "FOUND STICK" is not needed if zoom 3 is used).

### M4. Text pages are unreadable in the shots that carry the consequence: beats 12, 3 (and 5 to 7, 14 less so)

The Six months page (t03c 14.37 to 19.5, same layout as the future t16 reveal) has body text about 10 px tall at source. At 16:9 zoom 1 and 1:1 zoom 1 it is small; at 9:16 1.125 it is 11 px, about 4 pt on a phone. Beat 12 is a 4.42 to 5.05 s static page. The picture shows no consequence, only an unreadable paragraph; v27 and its caption carry the whole beat. Card text in beats 5 to 7 is 12 px (13 px at 9:16 1.125) with the same problem, but there the highlighted option and chip show the pick.

Fix: in 16:9, beats 3 and 12 can go to zoom 2 with the panel whole: beat 3 panel is 754 x 364 px (cx 0.50, cy 0.50) and beat 12 panel is 754 x 508 px (y 286 to 794; cx 0.50, cy 0.495, 16 px to spare). That doubles the text in 16:9. Keep 1:1 and 9:16 as they are (a 540 px crop cannot hold a 754 px panel) and accept that the burned caption carries those aspects; say so in the script. Beats 5 to 7 (panel 716 x 632 px) stay at zoom 1, since a zoom 2 crop (540 px) would cut the panel frame.

## Minor

### m1. Gates are tight for v26 (slower read), v18b and v28

All 12 clips in `ca15_trailer_r5.json` measure 1.49 to 3.66 w/s (median 2.27); the same-batch r3 lines run 2.0 to 3.66. v16 ("The pack goes to a personal inbox.", 7 words) is 2.47 s, so v23 to v25 (gate 3.29) should pass. Risks: v26 is voiced "a touch slower and lower" with only 0.36 s of slack over a normal read of about 2.3 s; v17 (8 words, one comma) ran 3.96 s, 0.04 s over the 3.92 gate for v18b and v28 (v28 only matters on the fallback grid). Fix: voice v26 at normal pace and slow only the last word; if v18b or v28 land over 3.92, cut the lead to 0.1 s (gate 4.02) before re-voicing; v28 on the main grid has 5.18 s anyway.

### m2. v28 runs ahead of the picture (t06b)

"Posted sticks" is spoken about 0.2 to 0.9 s into the shot, over the list. The Benmoor row opens at 1.90 s. Fix: hold the list 1.2 s in t06b (open the row at list + 1.2), so the open message lands at 1.1 s of the shot and "free tools, quicker ways round IT" runs over it. Update the assert window (hold 2.0 s is fine; just move `row_usb`).

### m3. Appendix beat 5 window still ends in the card change (R1 m7 was wrong)

R1 said card 2 arrives at about 11.9. In t03 the card 1 panel starts changing at 11.53 (frame hashes differ from 11.53) and card 2 is on screen at 11.75; frame 11.78 shows card 2 (checked). Window 7.99 to 11.78 ends on about 8 frames of transition. Fix: in 7.70, out 11.49 (3.79 s; card 1 shown from 5.18, pick 8.19 is 0.49 s in).

### m4. Framing rows lack cx and cy where the script now relies on them

Beat 9 ("framed on her stand point") gives no values; r5's 16:9 cx 0.25 / cy 0.37, 9:16 cx 0.1667, 1:1 cx 0.21875 / cy 0.37 hold bubble (0.11 to 0.32), Joanne (0.22) and monitor in all three. Beat 11 gives none (r5: 9:16 cx 0.64, 1:1 cx 0.645; Nilesh spans 0.59 to 0.84). Beat 8 gives cx only; add cy 0.52. Beat 15 gives cx only; add cy 0.45 for the zoom 2 crops (bubble y 0.33 to 0.41, table cut is fine). Add these to section 5.

### m5. Fractional crop origins

cx 0.57 is 1094.4 px; with the half-crop widths 480, 320 and 270 the crop origins are x.4 px, so zoom 2 pixel art resamples. Use cx 0.5698 (1094 px). The other cx values (0.35, 0.45, 0.2448, 0.50) are whole pixels; r5's 0.64 (1228.8) and 0.645 (1238.4) have the same issue, use 0.6396 and 0.6448.

### m6. Beat 11 second mask

The "Skip" button sits at about x 1384 to 1556, y 976 to 1036, inside the r5 bar mask (y 850 to 1080). The small square top right (x about 1876 to 1904, y 16 to 44) is outside it and shows in all frames. In 9:16 and 1:1 it is cropped out; in 16:9 it shows. Fix: add a second mask `{x:1860,y:0,w:60,h:60}` for 16:9. The script says "the subtitle-bar mask must cover" both; one rectangle cannot.

### m7. Fallback box for the t06 counter has no rectangle

The "0 of 6 sorted" line and bar sit at source x about 432 to 864, y 100 to 160 (list view). Give `{x:430,y:100,w:440,h:62}` in the section 5 fallback.

### m8. Beat 8 repeats the hook's footage

Beat 8 (35.50 to 38.66) and the hook's first 1.9 s show the same scene, stick on the floor and two staff at the kettle; the chatter bubble alternates ("Who's nicked the big mug?" to 37.0, "Printer's jammed again." from 37.9). Fine for the rewind structure, but 36.9 to 40.06 would show the hook's bubble ("Printer's jammed again.") for the whole beat; keep 35.50 to 38.66 and note that the repeat is intentional.

### m9. Void and letterbox in the t11 shots

Hook, beats 8 and 9 at 16:9 zoom 1 show about 11 percent black on the right and a thin black strip top and bottom; beat 10 at 30.0 a 28 percent void. The 1:1 hook (cx 0.45) and zoom 2 crops avoid it; the 16:9 hook does not. Accept (same as r5) or crop 16:9 to cx 0.44 at zoom 1.125 is not legal; note it for the owner.

### m10. Silent viewing, summary (captions are burned into the render, so I treat them as part of the picture; what survives if they are dropped)

- Carried by the picture: hook bubble (16:9 only, see M2), open and chapter cards, chips and seat tabs, beat 9 bubble, beat 15 bubbles, the story order stick, rewind, test chip, inbox.
- Lost without captions: beat 11 (portrait only, 6.32 s, because the game's subtitle bar is masked; keep it masked, the burned caption is the replacement), v22 to v27 (the panel text in beats 5 to 7 is small; a viewer sees an option highlighted and a chip), beat 12 (text page), beat 14.
- Does the picture carry the story with captions on and sound off? Yes, with M1 to M4 applied. Without them the drop and the consequence are the weakest beats. The reveal (beat 9 to 10) rests on the `ATTACKER` tab, the `AUTHORISED TEST` chip and the glitch join; adequate.
- Hook: first speech starts 2.2 s in; the first 2.2 s are the stick on the floor, a chatter bubble and Joanne walking over. Inside the 5.0 s cold-open limit; no change.
- Minor continuity: the beat 9 PC clip starts 0.40 s after the bubble appears; start it at 0.0 if there is no sync reason.

## Fix list

| Item | Change |
|---|---|
| M1 beat 10 | 2 / 1.6875 / 2, cx 0.50, cy 0.57; mask unchanged; correct the "no static crop" claim |
| M2 hook | 9:16-only burned caption, 1.95 to 4.40 s |
| M3 beat 8 | 16:9 and 1:1 zoom 3, cx 0.55 (1:1 0.56), cy 0.52; 9:16 unchanged |
| M4 beats 3, 12 | 16:9 zoom 2 (cx 0.50, cy 0.50 and 0.495); state the caption carries 1:1 and 9:16 |
| m1 | voice v26 at normal pace; lead 0.1 s fallback for v18b and v28 |
| m2 | t06b: open the row at list + 1.2 |
| m3 | appendix beat 5: in 7.70, out 11.49 |
| m4, m5 | add missing cx and cy; snap cx to whole pixels |
| m6, m7 | second mask 1860,0,60,60 for 16:9 beat 11; fallback counter box 430,100,440,62 |
