# Review R1 (silent viewing and timing): ca15 trailer script r5 (commit ce2e57207)

Script: `docs/video/scripts/ca15_trailer_script_r5.md`. Settled facts reused from `ca15_trailer_script_r4_review_R3_timing.md` and `_R2_timing.md` (menu header rectangle, 9:16 void behind the drop, bubble extents on t11, subtitle-bar masks, text-page panel sizes). New measurements: frames pulled with `nice -n 19 ffmpeg -threads 1`, one at a time, from `~/video-takes-local/ca15/takes/*.trimmed.mkv`; marker files read for line timing. No renders, no encodes. t16, t17, t06b, t09c, t19 and t11b do not exist (no `.mjs`, no take), so they are checked as specs.

Counts: 0 Blocker, 3 Major, 9 Minor.

## What passes

- **Grid.** b = 60/95 = 0.63158 s. 7+10+11+5+9+10+10+8+8+4+11+12+11 = 116 beats = 73.263 s. Every cumulative start in section 2 equals `n * b` to 0.01 s (b17 10.74, b28 17.68, b33 20.84, b42 26.53, b52 32.84, b62 39.16, b70 44.21, b78 49.26, b82 51.79, b93 58.74, b105 66.32). Every row duration equals beats x b. The end is on bar 29. Fallback grids: beat 11 on the t06 list (7 beats, close takes 4) is 4.42 s, which equals the 4.42 s of t06 2.20 to 6.62. Beat 11 plus beat 12 stay 23 beats either way.
- **Existing-take windows lie inside their takes.** t11 is 58.24 s (hook 37.90 to 42.32, drop 30.00 to 35.05), t03b 10.07 s (5.61 to 9.55), t06 12.34 s (2.20 to 6.62), t09b 20.44 s (9.03 to 15.35). No window runs past a take end.
- **t11 drop 30.00 to 35.05, frames 34.42 to 35.05** (the stretch r4 did not use). Frames 34.42, 34.60, 34.80, 35.00, 35.04: no toast, no objectives panel, no menu, no item name. The HUD change at 34.13 is the "Notes" slot staying and the stick slot leaving the bar; nothing is named. Only the bubble problem in M1 remains.
- **Mask.** Menu header "RED-TEAM STICK" is on screen between `menu_open` 32.42 and `drop_click` 33.12 (markers), so the box `{920,765,115,30}` over 32.35 to 33.20 covers it with 0.07 s either side. The "Drop here" and "Examine" entries show no kit name (frame 32.80). The "RED-TEAM STICK" text is inside the mask in all three crops.
- **t03b frozen frame.** Frames 5.61 and 9.55 differ by at most 12 grey levels over the whole frame: it is a static panel, so freezing the last frame for the missing 3.0 s is invisible. No verdict, tally, score or toast on it (see m4 for what it does show).
- **t06 list fallback 2.20 to 6.62.** The verbs arrive with the opened message at 6.77 (row_usb marker 6.773), so the window is clear of them. The "0 of 6 sorted" counter and its bar are at x 512 to 865, y 100 to 160 in the frame, inside the box `{430,100,440,62}`, which needs to stay for the whole shot.
- **VO arithmetic, estimated clip.** Every est. clip, end, margin and gate in the section 3 table recomputes (`words / 2.33 + 0.15`, lead 0.2 or 0.1, gate = window - lead - 0.3) except where v33's word count is wrong (M3). Every words-per-second is at most 1.74 against the 3.0 cap. v1 (cached, 5.112 s) ends 5.31 in a 6.32 s window. Cached clip lengths for comparison: v18 1.73 s (4 words), v21 1.73 s (4), v15 1.42 s (4), v16 2.47 s (7), v10 1.13 s (3), v9 4.82 s (10), v11 5.76 s (10).
- **No narrator over a character line.** Beats 1 and 12 carry none; v38 ends at est. 5.07 s into beat 11, before beat 12. No narrator over verdict buttons: t06b hides the verb row, the t06 fallback window ends before they appear.
- **Captions.** Every line is at most 28 characters (longest: v33 A 28, Nilesh line B 28, v30 24, v35 24, close card 24). Chips: `WHAT IS SHADOW IT?` 18, `A VISITOR'S USB STICK` 21. Reading rate at the worst: Nilesh A to D, 94 characters over a 6.4 s spoken line, 14.7 characters a second, with the audio running; v33 A plus B, 49 characters over 5.5 s of speech.
- **Zooms and centres.** Every zoom in section 5 is in the allowed set (16:9 and 1:1: 1, 2, 3; 9:16: 0.5625, 1.125, 1.6875). Whole-pixel centres: 0.6396 = 1228.0, 0.6448 = 1238.0, 0.5704 = 616.0 (to 0.03 px), 0.50 = 960 / 540, 9:16 1.125 and 1.6875 crops are 960 and 640 wide with whole origins. Crop sizes: 16:9 zoom 2 is 960 x 540, 1:1 zoom 2 is 540 x 540.
- **Take specs, completeness.** t16 names marks (`c1_pick`, `c3_pick`, `reveal_email`, `reveal_stick`), holds (2.2 / 4.0 / 3.4 / 3.5 / 7.0 / 6.0 s: every window fits inside its hold: beat 5 out is `c1_pick` + 3.68 against 4.0, beat 7 out is `c3_pick` + 3.12 against 3.5, beat 6 6.32 against 7.0, beat 8 5.05 against 6.0), hides and asserts (`client files`, `USB stick`, `\bpack\b`, "Benmoor Packaging" explicitly safe), and records from this branch (section 5, "from this branch"). t17 carries a mark and a 8.0 s hold for a 6.95 s window (in = mark + 0.1, out +7.05: 0.95 s spare). The click under "go to a personal inbox" in v32 (word 5 of 9 begins about 0.2 + 4/9 x 4.0 = 2.0 s) lands on `c1_pick` at 2.0 s; the click in v34 falls at 3.2 s, where "Even a USB stick" begins after the pause (7 words end near 3.3 s). Both line up.
- **Silent beat order.** In order a viewer with captions off sees: a grumble in a bubble; a card (series title); a panel whose text defines shadow IT; a red card; a choice card with an option picked; a page "Six months later"; the same for a USB stick; one walking shot ending with an item dropped, chip `AUTHORISED TEST`; a blue card; an inbox with two lure messages; a chat with Nilesh; the close. The sequence is readable as a story, but every step from beat 3 to 8 and 11 to 12 is text on panels; see Minors m7 and m8.

## Major

### M1. Beat 9 fallback: the chatter bubble is cut in half in all three formats from 33.50 to 35.05

The script row calls frames 34.42 to 35.05 and the 9:16 crop "unchecked". Checked. A white bubble "Who's nicked the big mug?" (the kit's ambient chatter, so it is in every take of this room) appears at 33.50 (frame 33.40 has none, 33.50 has it) and stays to 35.05. On frames 33.60, 34.00 and 35.04 it spans x 1152 to 1547 (R3 gave 1152 to 1552), y 440 to 497. The beat 9 crops are all centred on cx 960:

| Format | Crop x range | What shows of the bubble |
|---|---|---|
| 16:9, zoom 2 (960 wide) | 480 to 1440 | "Who's nicked the b" and a cut edge: 112 px lost |
| 1:1, zoom 2 (540 wide) | 690 to 1230 | only the left 78 px, "Who's" |
| 9:16, zoom 1.6875 (640 wide) | 640 to 1280 | up to 128 px lost, mid-word |

That is 1.55 s of the 5.05 s shot (the last three beats of the stick, from just after it lands) with a cropped speech bubble, which a silent viewer reads as a glitch (the same error R3 M1 fixed for the r4 hook). Joanne (1136 to 1196) and Niamh (1213 to 1289) are also cut at the 9:16 edge.

Fix, in this order:
1. Preferred route, t11b: record with the kit's ambient chatter off (or the kettle pair's chatter suppressed until `drop_land` + 2.0) so no bubble shows in the window. Add to the t11b spec: "assert no bubble element between `menu_open` and `drop_land` + 2.0". List its marks: `menu_open`, `drop_click`, `drop_land`.
2. Fallback on t11 (frames, measured): 16:9 zoom 2 at cx 1240 (crop 760 to 1720): holds the menu (905 to 1120), the learner (about 930), the stick (928 to 969), Joanne, Niamh and the bubble to 1552, 168 px clear on the right. 9:16 at 1.6875: cx 1240 (crop 920 to 1560) holds all of it with 8 px clear of the bubble's right edge, loses 15 px of the menu frame's left edge (905 to 920; the header text is at 925 or more, so the mask stays valid) and leaves the stick 8 px from the left edge: check frames, and if the stick touches the edge, use cx 1230 (910 to 1550) and accept the bubble 3 px short of clear. 1:1 cannot hold the stick (928) and the bubble (1552) in 540 px: crop away from the bubble instead, cx 870 (600 to 1140, cy 616): 12 px clear of the bubble's left edge (1152), holds menu, learner and stick; Joanne's 4 px of sleeve at 1136 to 1140 may show, so check, and take cx 860 if so. In all three the mask box stays `{920,765,115,30}` and does not move.
3. Alternatively shorten: out at 33.45, a 4.17 s shot (6.6 beats) is not on the grid. Not recommended.

### M2. Beat 12: the reserve plan fixes the wrong end, and the base window runs into Nilesh's next line

The script says (sections 4 and 5): the line is est. 6.4 s, the gate is 7.08 s, "if it runs longer, beat 12 takes a beat from beat 11", and "the window ends before 'And nobody gets told off for asking.'". Measured on t09b: the old line starts 9.228 and ends 14.976 (5.748 s for 17 words, 0.338 s a word); the next line "And nobody gets told off for asking." starts 15.699, a gap of 0.723 s. Scaling to 19 words gives L = 6.42 s (the cached voice has 4 and 5-word clips 0.08 to 0.35 s slower per word when a stressed "IT" is spelled, so 6.4 to 6.7 s is the realistic spread).

With the plan as written (in = start - 0.2, window 7.58, so out = start + 7.38) the window contains start + L + 0.72 = start + 7.14, i.e. 0.24 s of Nilesh's next line (its audio, subtitle and portrait mouth) whenever L < 6.66. At L = 6.42 the cut lands mid "And". The subtitle bar is masked in 16:9 (script), but the 1:1 and 9:16 crops show the bar region (the script's mask is stated for 16:9 only), and the audio is in the take either way. A longer line is the safe direction here; a shorter one is not.

The constraints for a window of W seconds, with lead 0.2 and the next line 0.723 s after the end: the line must end at least 0.3 s before the cut (L <= W - 0.5) and the next line must not start before the cut (L >= W - 0.92). That is a band 0.42 s wide:

| Beats | W | L must be in |
|---|---|---|
| 10 | 6.32 | 5.40 to 5.82 |
| 11 | 6.95 | 6.03 to 6.45 |
| 12 (as scripted) | 7.58 | 6.66 to 7.08 |
| 13 | 8.21 | 7.29 to 7.71 |

An estimate of 6.42 sits at the top of the 11-beat band and below the 12-beat one; a measured 6.45 to 6.66 falls in no band. The "takes a beat from beat 11" reserve only handles L above 7.08, which is the less likely case.

Fix:
- Record t09c, take the measured `line_start` and `line_end`, then set `out = min(start + W - 0.2, line_end + 0.65)` and hold the last frame (a frame with the mouth closed, portrait up, no subtitle) for the rest. A 0.3 to 0.6 s freeze on a still portrait is invisible, and it removes the band problem. Say so in section 5 row 12.
- Mask the subtitle bar in 1:1 and 9:16 as well, or state that those formats crop it out (check on t09c frames), and add "next line's subtitle must not show" to the specs.
- Replace the reserve sentence with the table above and the freeze rule. The 13-beat reserve (L over 7.08) still takes a beat from beat 11, where v38 keeps gate 5.82 and slow-read slack 0.37.
- Add to the t09c spec: hold at least 8.0 s after `line_start` and assert the line text equals ink :65 (new wording), since the `lot_start` mark in t09b was tied to the old line.

### M3. v33 has 12 words, not 11: its slow read breaks its gate, and the script's "every line clears its gate" is false

"That inbox gets broken into." is 5 words; "IT never knew the copy was there." is 7. Total 12. At 12 words: est. clip 5.30 s, ends 5.50, margin 0.82 (still fine), gate 5.82, w/s 1.90, but the slow read is 12 x 0.495 = 5.94 s, which is 0.12 s over the gate, not 0.37 s under it. The narrator word total is 99, not 98. v33 is the cost of the first shortcut and the line that carries the lost-visibility idea, so a clipped ending (cut at the seam into the next shot) matters most here.

Fix: cut one word to bring it back to 11. "That inbox gets broken into. IT never knew the copy existed." (5 + 6 = 11 words, slow read 5.45, slack 0.37, caption B "IT never knew the copy / existed." 22 / 8). Voicing note stays. The truth check against erb :691 still holds: the page now reads "IT had never known the copy was there" (see m2). Alternatively keep the wording and give beat 6 one more beat (taken from beat 7, where v34 would drop to slack -0.25 on the slow read), which is worse.

## Minor

### m1. Beat 1 t11 fallback: in point 37.90 is 0.3 s after the bubble starts, and the window ends on Joanne walking to the stick

Frames: 37.20 and 37.50 no bubble; 37.70 bubble up. The bubble "Printer's jammed again." runs about 37.60 to 41.40 (frame 41.20 has it, 41.60 does not). At 41.80 the grey-haired colleague (Joanne) has turned and is walking toward the learner's stick; by 42.0 she is beside the learner and her stick line starts at 42.82. The window 37.90 to 42.32 therefore starts after the bubble's first frame (the cached clip "lay in at the bubble's first frame" would start 0.3 s late) and its last 0.5 s shows the found-stick setup r5 removed. Set in = 37.20, out = 41.62: 0.4 s of a still room, bubble 0.4 to 3.8 s, last frame clean (frame 41.60). Then the clip lays in at 0.4 s. For t19 add "no other bubble in the 1.0 s before the mark" (the pool has a second line, "Is the Shipley run late again?", and the ambient kit line "Who's nicked the big mug?" also fires in this room), and force the pool line to the Printer's line rather than waiting.

Also the 1:1 hook fallback has no centre in the script ("1 / 0.5625 / 1", cx missing). Zoom 1 is a 1080 square: cx 1100 (560 to 1640) holds the learner, the stick, the pair and the bubble (1061 to 1434), with the printer at the right edge. In every fallback frame the stick lies by the learner's feet and reads as a dropped item (8 px at zoom 1); say so in the on-screen text column (it does, in half a sentence) and note that the fallback shows the learner, so "two staff at the kettle" is three people.

### m2. Section 9 has already landed; the script says it has not

The script says "Not made here" and carries the three requested episode edits. `36378d2a7` ("send_personal/ask_nilesh consequences say IT never knew of the copy; brief says only the inbox is scored") is on this branch; erb :691 now reads "Months on, the personal inbox was broken into. The client files were still in its sent items, and IT had never known the copy was there, so nobody could protect it or take it back. The client got a convincing fake invoice built from them." So beat 6's picture and v33 now agree. Update section 9 and the v33 truth check ("the page does not yet say..."), and add to t16 the assert that card 1's consequence contains "never known" (it guards against recording from a tree that lacks the commit). The "reused password" line in section 1 ("the consequence page still names the password") is also out of date.

### m3. v31 and v37: thin slow-read slack; both are sound on measured analogues

v31 (5 words, gate 2.66, slow read 2.48, slack 0.185 not 0.18) and v37 (4 words, gate 2.13, slow read 1.98, slack 0.15). The cached clips of the same voice and shape are 4 words in 1.42 to 1.73 s (v15, v18, v21) and 7 words in 2.47 s (v16); a 5-word flat line at about 2.2 s fits v31. The one counter-example is v1c "This episode: Shadow IT." (4 words, 2.69 s, with a colon pause), which would break v37's gate; v37 has no punctuation in the middle, so the risk is the voicing note.
Fix: give v31 lead 0.1 (gate 2.76, slack 0.28), voice both at normal pace, no pause, and measure before the edit list. If v37 measures over 2.13 s, drop it: the blue card already says "Now it's your turn", and beat 10 reads fine silent.

### m4. The t03b fallback shows the Everyday choices intro, not the Brief

Frame 5.61 (checked, panel 755 x 365 at x 583 to 1337, y 358 to 723): tabs Brief (ticked), Choices, Where it led, Defend, Debrief; heading "Everyday choices"; "Work through a few ordinary choices from a normal day. They are not scored, but the debrief comes back to any worth a second look, so choose what you would really do."; a "Make the choices" button. v30 would run for 6.95 s over a panel that has no definition, with 3.0 s of freeze, and a button that invites a click. It is a fallback for t17 and the script says so; to keep it honest, re-run t17 rather than fall back, and drop the fallback unless the chip changes to `ONE EPISODE`.

### m5. t06b and the t06 fallback show a tab strip; t06b spec lacks the `\bpack\b` assert

Frame 6.62 of t06: the header strip reads "Shadow IT: the shortcuts" and tabs "1 Brief, 2 Sort, 3 Review, 4 Result". Not forbidden (no scores) and acceptable; mention it in the on-screen text column so the frame check is not a surprise. The list rows are "Tarrowby Reception", "Chuckbox", "Benmoor Packaging", "PDFmangle Free", "Tarrowby File Share", "Nilesh Solanki"; "Benmoor Packaging" is a sender and the `\bpack\b` assert must be on subject and preview text only. The t06b spec asserts only that hidden parts stay hidden: add that assert and the asserts "row subject contains 'Client files for Monday'" (fallback list shows "Mo..." in the stale take only).
The fallback t06 pane to the right of the list is empty with "Select a message to read it." for the whole 4.4 s; v38f would run over a list alone. Acceptable for a fallback.

### m6. Beat 9: the row says the take ends 2.0 s after the stick lands, the rubric says the landing is not shown

`drop_land` is at 3.28 s into the shot and the shot is 5.05 s, so the stick lands and 1.77 s follow (not 2.0). Rubric O1 says "The landing is not shown". Both statements cannot hold. Fix the row to 1.77 s and the rubric O1 evidence to "the learner drops it and it lands".

### m7. Silent viewing: the whole middle is text on panels, and beats 5 and 7 give the card 2.0 and 3.2 s

With captions off a viewer sees a quiet card for 2.0 s (beat 5: the situation line "The share has crawled to a halt" and four options; about 45 words), then the click. On a 1920 x 1080 source, card text at zoom 1 is about 16 px, at 9:16 1.125 about 18 px on a 1080 wide screen. The picked option is on screen for 3.68 s afterwards, which is enough to read the option, but the cause (the slow share) is read by almost nobody in 2.0 s. The cause is in v31's caption and on the red card's seam only. Fix: hold card 1 for 2.6 s before the pick (in = `c1_pick` - 2.6, the pick then lands about 2.6 s in, 0.6 s after "go to a personal inbox" starts at about 2.0 s; acceptable) and say in section 5 that 9:16 and 1:1 rely on the burned caption for beats 3, 5, 6, 7 and 8, as the script already does for beat 3 and 11. In 16:9 consider a zoom 2 crop of the option block (cx 960, cy about 700) for beats 5 and 7 if frames on t16 show the options inside 540 px: the full card (716 x 632) cannot be shown at zoom 2.

### m8. t19, t17, t11b: spec gaps

- **t19:** the two things above in m1 (force the Printer's line; no other bubble in the 1.0 s pre-roll). The hold "4.0 s after it starts" matches the bubble's 3.8 s life measured on t11 (37.60 to 41.40), so out = mark + 3.42 is inside it.
- **t17:** the Brief panel on the real take may be taller than the 365 px of the Everyday panel measured; the zoom 2 16:9 crop (960 x 540 at cy 540) only holds it if the panel (frame included) is 540 px or less. The script says "otherwise 1 / 1.125 / 1": decide on t17 frames and write which in the table.
- **t11b:** marks not listed, and the bubble issue (M1) not mentioned. Add `menu_open`, `drop_click`, `drop_land` and the no-bubble assert.

### m9. The edit list `tools/video/edits/ca15_trailer_r5.json` is the old r5 edit, not this script's

Its `id` is `ca15_trailer_r5`, its `script.heading` is "ca15 trailer script r3 (Shadow IT)", its `vo` list starts v1, v1c, ... and it has the r3 shot list (hook on t11 40.5988 to 45.02). The script header says "No edit list". If the new edit list is written under the same id and path it overwrites the old one without a note; name it `ca15_trailer_r6.json` or rebuild under the same id with a clean `script.heading`, and do not render from the old one meanwhile.

## Beat 12 reserve plan: is it sound?

No. It is sound only for a line that runs over 7.08 s, which is not the expected case. The expected case (L about 6.4 s) has the first 0.24 s of Nilesh's next line inside the 12-beat window (M2). Use the measured `line_end` after t09c, the freeze-the-last-frame rule and the band table: 11 beats for L 6.03 to 6.45, 12 for 6.66 to 7.08, and freeze for anything between.

## Silent viewing with captions off: does the picture carry the story?

Mostly yes, with three weak points.
- **Cause, then shortcut.** Bubble "Printer's jammed again." (beat 1), brief panel defining the term (beat 3, if t17 is legible), then the picked option "Send the client files to your personal email to finish at home" (beat 5). The slow file share is not on screen in beats 1 to 4 (the bubble is a printer, the share only appears in the card situation line, 2.0 s). A viewer connects "jammed" and "send them home" without being told the share was slow. Fine.
- **Cost.** Both "Six months later" pages are text only (beats 6 and 8): a viewer who reads them gets "IT never knew" and "it copied the folders it could reach". At 9:16 and 1:1 the text is 18 px or less, so those formats rely on captions (see m7).
- **Attacker's side.** A walking learner and a tiny stick (8 px at zoom 1, 16 at zoom 2, 27 at 9:16 1.6875) falling with a menu header "Unlabelled USB stick" (t11b) or masked (t11). Nothing but the chip `AUTHORISED TEST` and the caption says it is a plant. The shot is short and legible only as "someone leaves a stick on the floor", which is what it is.

## Fix list

| Item | Change |
|---|---|
| M1 beat 9 | t11b with no bubble in window (spec the assert and marks); fallback cx 1240 for 16:9 and 9:16, 1:1 cx 870, all three checked on frames; mask box unchanged |
| M2 beat 12 | `out = min(start + W - 0.2, line_end + 0.65)` plus freeze; band table replaces the reserve sentence; mask or crop the subtitle bar in 1:1 and 9:16; t09c asserts new line text |
| M3 v33 | 11 words: "IT never knew the copy existed."; recount narrator total (98 holds) |
| m1 | hook fallback in 37.20, out 41.62; t19 forces the pool line, no earlier bubble; 1:1 fallback cx 1100 |
| m2 | section 9 landed (`36378d2a7`): update the script, add the "never known" assert to t16 |
| m3 | v31 lead 0.1; v37 dropped if over 2.13 s |
| m4 | drop the t03b fallback or relabel the chip; re-run t17 |
| m5 | note the tab strip; `\bpack\b` assert on subject and preview in t06b |
| m6 | beat 9 row 1.77 s after the landing; rubric O1 wording |
| m7 | card 1 held 2.6 s before the pick; captions carry 9:16 and 1:1 text beats; optional zoom 2 on the option block |
| m8 | t17 panel-height decision, t11b marks |
| m9 | new edit list id; old file not rendered |
