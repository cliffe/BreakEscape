# Review R2 (silent viewing and timing, delta): ca15 trailer script r5 rev R1 (commit 88bf08fd0)

Script: `docs/video/scripts/ca15_trailer_script_r5.md`. Delta read: `git diff ce2e57207 88bf08fd0`. R1 reference: `ca15_trailer_script_r5_review_R1_timing.md`. Method: grid and VO arithmetic recomputed in Python; the two cached Joanne clips measured with ffprobe and silencedetect (-40 dB); frames pulled one at a time with `nice -n 19 ffmpeg -threads 1` from `~/video-takes-local/ca15/takes/t11_red_drop_run.trimmed.mkv` (30.88, 31.60, 32.80, 33.60, 34.60, 42.19, 42.90, 43.00, 44.00, 45.30) and cropped with PIL. No encodes, no renders. t19, t17, t16, t11b, t06b and t09c do not exist yet, so they are checked as specs.

Counts: 0 Blocker, 3 Major, 7 Minor.

## R1 timing findings: applied correctly?

| R1 | Applied | Check |
|---|---|---|
| M1 beat 9 bubble | Yes, with one spec gap (M2 below) | t11b with no-bubble assert and marks; fallback window re-cut to 30.88-34.67; bubble on screen from 33.50, so 1.17 s, correct. Frame 34.60 at 16:9 zoom 2 cx 1240 holds bubble (x 1152-1552), menu-less learner, stick, Joanne, Niamh. See m3 for the right-edge sliver |
| M2 beat 12 | Yes | Freeze rule, band table, subtitle bar masked in all three formats, t09c asserts the line text and marks `next_line_start`. See m6 (0.07 s margin) |
| M3 v33 | Yes | 11 words, narrator total 95 recounts (9+11+5+8+11+11+8+6+4+11+11). But see M1: 11 words with a stop is not safe on the slow read |
| m1 | Yes | Stand-in 37.20 to 41.62; 1:1 cx 1100; t19 forces the line |
| m2 | Yes | Section 9 and the truth check updated; "never known" assert is in t16 |
| m3 | Yes | v31 lead 0.1, gate 2.76, slack 0.283; v37 drop rule present |
| m4 | Yes | t03b fallback removed |
| m5 | Yes | Tab strip noted, `\bpack\b` on subject and preview, subject assert |
| m6 | Yes | 1.39 s after the landing; O1 reworded |
| m7 | Partly, as stated | Card 1 held 2.6 s before the pick |
| m8 | Yes | t17 height decision, t11b marks |
| m9 | Yes | `ca15_trailer_r6` |

## What passes

- **Grid.** b = 60/95 = 0.63158 s. 7+10+11+5+8+10+10+8+6+5+4+10+12+10 = 116 beats = 73.263 s (recomputed: 116 x 0.631579 = 73.2632). Every cumulative start in section 2 equals n x b to 0.01 s (b17 10.74, b28 17.68, b33 20.84, b41 25.90, b51 32.21, b61 38.53, b69 43.58, b75 47.37, b80 50.53, b84 53.05, b94 59.37, b106 66.95). Every row duration equals beats x b. Variant A also sums to 116. The drop sits on b28 = 17.684 s and beats 1 to 3 are untouched (the three beats lent to 9b all come from beats 5, 11 and 13, after the drop). Balance figures (32.8 s / 16.4 s; email 23 beats 14.5 s; stick 29 beats 18.3 s) recompute.
- **Kettle hook clip `feba2d60...`:** ffprobe 1.872 s; one silence from 1.628 (tail), so speech 0 to 1.63. Laid in at the bubble's first frame (1.0 s into the shot) it ends 2.63 speech / 2.87 file, 1.55 s before the 4.42 s cut. Fits beat 1. Bubble on screen 3.42 s for a 32-character line, readable captions-off. The 9:16 split "The file share's / crawling again." is 16 / 15.
- **Bark clip `570745991c46...`:** ffprobe 3.144 s; silencedetect gives speech 0 to 1.642 and 2.153 to 2.785 (silences 1.642-2.153 and 2.785-3.090). The script's "0.00 to 1.64 and 2.15 to 2.78" is exact.
- **9b in/out math.** in = `find_bubble` - 0.05; clip at 0.05 in the shot: speech ends 0.05 + 2.78 = 2.83; cut 3.16; margin 0.33 s. Correct. Bubble on screen 3.11 s from its first frame, 47 characters, readable with audio.
- **9b fallback t11 42.19-45.35.** Marks: bubble-start 42.824, bubble-end 45.525 (replaced by the next bark), `picked_up` 42.926, `walk_start` 43.173. Clip at 0.08: speech ends 45.35 - 0.30 = 45.05. Correct. The voice leads the bubble by 0.55 s (42.27 vs 42.82). That lead cannot be reduced: the line must end 0.3 s before the cut and the bubble is replaced at 45.525, so a later start would push speech past 45.05 or the bubble past its life. A voice that starts 0.55 s before the text, over a visible Joanne already at the stick, reads as speech first, bubble second; acceptable for a fallback.
- **Card and chip lengths.** All 28 or fewer: chips `YOUR AUTHORISED TEST` 20 (counted), `A VISITOR'S USB STICK` 21, `WHAT IS SHADOW IT?` 18, v33 A 28, Nilesh B "tell us rather than building" 28, close card 24, blue 18, red 17.
- **Fallback mask on t11 (frame 32.80).** Menu header "RED-TEAM STICK" is at x 925-1027, y 775-787, inside `{920,765,115,30}`; markers `menu_open` 32.419, `drop_click` 33.12, so 32.35-33.20 covers it with 0.07 s each side.
- **9a take timing.** `walk_end` 32.373, `menu_open` 32.419, `drop_land` 33.275: in = `drop_land` - 2.40 = 30.875 is 1.50 s of walking; the stick lands 2.40 s in and 1.39 s remain. v36c ("found" at about 2.3 to 2.8) lands on the drop. Correct.
- **Take specs, marks and holds.** t16: beat 5 in = `c1_pick` - 2.6 needs 2.6 s pre-pick (hold 2.8 given) and 2.45 s post (hold 4.0); beat 6 6.32 inside 7.0; beat 7 3.2 pre (hold 3.4) and 3.12 post (hold 3.5); beat 8 5.05 inside 6.0. t17: 0.1 + 6.95 = 7.05 inside the 8.0 s hold. t06b: list 4.5 s after `list_shown` + 0.1 inside 4.6, message 1.82 s inside 2.5. t09c: window ends at `line_start` + 7.38, hold 8.0.
- **Zooms and centres.** Every zoom in the allowed sets (16:9 and 1:1 at 1/2; 9:16 at 0.5625/1.125/1.6875). Whole-pixel centres throughout (1240, 870, 1100, 1228, 1238, 960, 616, 920 etc.). NPC chat (beat 12) at zoom 1 / 1.125 / 1, the lowest.

## Major

### M1. Slow-read check with stops: v33, v34, v38 and v11b are at or over their gates; Variant A's v36 fails; "every line clears its gate" is false

The brief's rule is slow read = 0.495 s a word plus 0.3 s per stop (a sentence break or voiced pause). The script's table counts words only. With stops (v30 colon, v33/v34 one full stop, v38/v11b two, Variant A v36 one):

| id | Words | Stops | Gate | Slow read | Slack | Script says |
|---|---|---|---|---|---|---|
| v30 | 11 | 1 | 6.45 | 5.75 | 0.70 | 1.00 |
| v31 | 5 | 0 | 2.76 | 2.48 | 0.28 | 0.28 |
| v33 | 11 | 1 | 5.82 | 5.75 | **0.07** | 0.37 |
| v34 | 11 | 1 | 5.82 | 5.75 | **0.07** | 0.37 |
| v38 | 11 | 2 | 5.82 | 6.05 | **-0.23** | 0.37 |
| v11b | 11 | 2 | 5.82 | 6.05 | **-0.23** | 0.37 |
| v37 | 4 | 0 | 2.13 | 1.98 | 0.15 | 0.15 |
| Variant A v36 | 9 | 1 | 4.65 | 4.76 | **-0.10** | 0.19 |

The word-only table hides this. The cached clips that sit closest to v11b show the risk is real, not just a formula artefact: v1 (9 words, one colon, "Hacktivity") is 5.112 s, 0.568 s a word; v11 (10 words, ends "Learn on Hacktivity.co.uk") is 5.760 s, 0.576 s a word. At v11's rate v11b (11 words, same ending) is about 6.3 s, which with lead 0.2 runs to about 6.5 s against a 6.32 s window: the line would be cut by the end of the trailer. At 0.568 s a word v33, v34 and v38 are 6.25 s (gate 5.82), v35 4.54 (gate 4.55, slack 0.01) and v32 4.54 (slack 0.01). The estimator (`words / 2.33 + 0.15`) gives 4.0 s for v1 against 5.1 measured, so it is optimistic for Sulafat in this style.

Fix, in priority order:
1. **v11b to 8 words.** "Take the shortcut here. See where it leads." (4+4, one stop: slow read 4.26, slack 1.56; at 0.576/word 4.6). The plate "Learn on Hacktivity.co.uk" carries the URL; the narrator says it already at 11 words in v11 only because that was the series tagline. If the owner wants the URL spoken, measure the 11-word line first and cut it back to the 8-word form on any overrun.
2. **v38 to 9 words.** "Free upload site. Stick in the post. Your call." (3+4+2, two stops: 5.05, slack 0.77). Matches the three burned captions, which are already telegraphic ("A free upload site." can keep its article on screen).
3. **v33 and v34 to 10 words.** v33: "Someone broke into it. IT never knew the copy existed." (4 + 6 = 10; slow read 5.25, slack 0.57). v34: "An unknown device in your laptop. Even a USB stick." (6+4 = 10, slack 0.57); the episode's "work laptop" moves to the caption only. Caption A/B texts change with them.
4. **Variant A v36** needs 8 words or one stop fewer: "Attackers leave sticks to be found. You do." (8 words, one stop, slow read 4.26, slack 0.39) or drop "Here,". Update the section 8 figure.
5. In section 3 change the definition of slow read to include stops, add the stops column, and measure every new line before the edit list (as the script already says for v31 and v37); the voicing step should be told that a line over its gate is rewritten, not trimmed.

### M2. t11b assert does not cover the first 1.5 s of the 9a window, so the bubble fix can still fail

Section 6 asserts "no bubble element between `menu_open` and `drop_land` + 2.0". The 9a shot starts at `drop_land` - 2.40, which is 1.54 s before `menu_open` (walk starts 30.875, `menu_open` 32.419 on t11). A kettle-pair bubble during the walk would be in the cut and the assert would pass. The ambient pool fires "Who's nicked the big mug?" on t11 at 33.50, nothing prevents the same at 31.0 on a different seed.
Fix: assert no bubble from `drop_land` - 2.5 to `drop_land` + 2.0, and suppress chatter from take start until `find_bubble` - 0.5 (the 9b window is the only place a bubble is wanted). Also add to t11b: the camera is settled by `walk_end`; see m3 for what the first 1.4 s shows.

### M3. Beat 11 (owner Q8): the opened Benmoor message is on screen 1.82 s and cannot be read; it also reverses the R1 sell fix for no gain

Arithmetic: list held 4.5 s of the 6.32 s shot, message 1.82 s. At zoom 1 (16:9) the message body is about 14 px text, at 9:16 1.125 about 18 px; 1.82 s allows reading the sender and subject at best, and the narrator is speaking "Your call." over it, so a silent viewer sees a pane change and a wall of text. It registers as "a message opened", not as the lure. That matches the script's own words ("too short to read through"). The cost: the full 10 beats on the list would let a captions-off viewer read both subjects ("Too big for email? Upload it here, free" and the Benmoor row) for the whole shot, which is what the narrator is naming.
Verdict for Q8: default to the list held for all 10 beats on t06b (it is the stated alternative in Q8). If the owner wants the message open, it needs at least 2.5 s, which costs a beat from beat 12 (not recommended: v38/Nilesh bands) or from beat 13.
Fix: change the section 5 row 11 default to list-only, keep `row_usb` as an optional alternative, and drop the "Frame check at `row_usb` + 0.5" task from the default path.

## Minor

### m1. Variant A is a live option and currently fails its slow read

See M1 row. Keep Variant A in section 8 only with the 8-word v36.

### m2. Beat 9b fallback: the black edge is acceptable in 16:9; the 1:1 crop at cx 920 cuts the bubble

The black edge: frames 42.90 to 45.30 show the room's outer frame ending at x 1703, void beyond (217 px = 11 percent of the width, plus 38 px at the top and 85 px at the bottom). No different crop does better with an integer scale: Joanne walks about 700 px (x 1075 to 400 between 42.90 and 45.30) and her bubble travels with her (x 1040-1490 at 42.90, 400-850 at 45.30, a union of 1090 px), so only the full frame (16:9 zoom 1) or 9:16 0.5625 holds it. A 16:9 zoom 2 crop (960 px) cannot. The void reads as the room's edge (the same void frames the top and bottom of the room in every shot of this room). Accept for a fallback, and say so in owner Q7 as "11 percent void, the room's own edge, also present in the 9:16 frame".
The 1:1 crop: cx 920 gives x 380 to 1460; the bubble's right edge is at 1490 and "memory" ends at about 1477, so the final "y" is clipped for the first 0.3 s of the bubble (42.82 to about 43.17, before she walks). The union of 1090 px does not fit 1080 px. Use cx 940 (400-1480): the text is whole at both ends (left border at 400 at 45.30), 10 px of border at the right and about 10 px of Joanne's hand at the left are clipped; or move out to 45.30 to keep the left edge in. Not a defect for the retake, which holds her in place.

### m3. Beat 9a fallback: 16:9 cx 1240 shows a 17 px black sliver at the right, and the first 1.4 s has a different camera, a path marker and a stick slot

Crop 760-1720 at 16:9 zoom 2 extends 17 px past the room frame (1703): a dark strip about 34 output px wide at the right of the 16:9 frame. Use cx 1220 (740-1700): bubble right edge 1552 stays 148 px inside, left side 905 menu and 928 stick stay inside. The 1:1 (cx 870) and 9:16 (cx 1240) crops are clean at 33.60 and 34.60 (checked).
Frames at 30.88 and 31.60: the camera is still panning (kettle pair at x 1650-1770 at 30.88 and at 1130-1290 at 33.6, a 500 px shift), so the first 0.7 s is a different camera view from the settled one. At 30.88 the frame shows a click-path line and a ring marker (a UI overlay) in the 16:9 and 1:1 crops, the kettle pair half cut at the right edge of the 16:9 crop, and in 9:16 about 215 px of void at the top (shrinking to about 185 px at 31.60) with the "Notes" slot and a slot with a stick glyph at the foot (an icon, no name). None is a spoiler or a text problem, but a silent viewer sees a pan plus a marker in the first 0.7 s of a 3.79 s shot. If the window must stay on the grid, move in to 31.51 and out to 35.30 only if the bubble is accepted for 1.8 s (not recommended); better: the retake t11b should walk the learner from a spot where the camera has already settled, and the spec should say "no path marker, no ring" (click-to-move overlay hidden).

### m4. Beat 7: the click under "Even a USB stick" falls before the words

v34 first sentence (7 words) ends near 0.2 + 7 x 0.44 = 3.3 s, then the pause, so "Even" starts at about 3.6 to 3.8 s. In = `c3_pick` - 3.2 puts the click at 3.2 s, under "laptop". Fix: in = `c3_pick` - 3.7 and hold card 3 for 4.0 s before the pick (t16 currently 3.4 s, so pre-pick is short by 0.3 s). Post-pick is then 2.62 s, inside the 3.5 s hold. If v34 is shortened (M1 item 3) recompute: 10 words, "Even" at about 3.3 s.

### m5. t19 does not assert the bubble's life

The window runs to `share_bubble` + 3.42; the 3.8 s life was measured for a 23-character line. Joanne's line has 32 characters. Add to t19: assert the bubble stays up at least 3.5 s from its first frame, like t11b's 3.4 s assert, and stop and report if it does not.

### m6. Beat 12 freeze rule: 0.07 s between the cut and the next line

out = `line_end` + 0.65, and the next line starts at `line_end` + 0.723 (t09b). A 0.07 s margin at a hard cut is under three frames at 30 fps and the mouth can open a frame early. Use `line_end` + 0.55 (0.17 s clear) and still 0.25 s of tail after the last word. The freeze then runs at most 0.4 s at L = 6.42 s. Say "a frame with the mouth closed" and check on t09c that the portrait does not blink-animate in the freeze (use the `line_end` + 0.4 frame).

### m7. Section 3 claims and wording to correct once M1 is applied

"Every line clears its gate on the slow read" (section 3), "Thin slack: v37 and v31" and the rubric note should name the stops rule and the measured analogues (v1 0.568, v11 0.576 s a word). Add v1's own figure to the table so the estimator's bias is visible (estimate 4.0 s, measured 5.1 s). The t17 spec also lacks any list of what to hide (tab strip names "Defend" and "Debrief"; cursor, any "Make the choices" or start button): add "tab strip and buttons as seen on the take; frame check at `brief_shown` + 0.5 for anything but the brief text".

## Other checks asked for

- **Take specs complete?** t19: marks yes, asserts yes (add m5). t17: mark and hold yes, hides not listed (m7). t16: marks, holds, asserts, hides yes (m4 for the pre-pick hold on card 3). t11b: marks yes, assert window wrong (M2). t06b: marks, holds, asserts, hides yes. t09c: marks, assert, hold yes.
- **Integer zooms, whole-pixel centres.** All pass. The fallback crops move to cx 1220 (16:9, whole pixel) and cx 940 (1:1 9b) if the fixes above are taken.
- **Silent viewing with captions off.** The hook, the pick (beat 5), the stick landing and Joanne's bubble carry. The two "Six months later" pages and the Brief are text only; the script correctly leans on captions for 9:16 and 1:1. The only silent-viewing gap this round is beat 11 (M3).

## Fix list

| Item | Change |
|---|---|
| M1 | Slow read with stops in the table; v11b 8 words; v38 9 words; v33 and v34 10 words; Variant A v36 8 words; measure before the edit list |
| M2 | t11b: no bubble from `drop_land` - 2.5 to + 2.0; chatter suppressed from take start; hide the click-path ring |
| M3 | Beat 11 default list for all 10 beats; message open only as an alternative |
| m1 | Variant A fixed with M1 |
| m2 | Accept the 16:9 void; 1:1 cx 940 for the 9b fallback; say the void is also in 9:16 |
| m3 | 16:9 9a fallback cx 1220; note the camera pan and marker in the first 0.7 s |
| m4 | Beat 7 in = `c3_pick` - 3.7, card 3 hold 4.0 s |
| m5 | t19 asserts bubble life at least 3.5 s |
| m6 | Freeze at `line_end` + 0.55 |
| m7 | Wording fixes in section 3; t17 hide list |
