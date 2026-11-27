# Review R3 (silent viewing and timing, delta): ca15 trailer script r4, rev R2 (commit 76473abcd)

Script: `docs/video/scripts/ca15_trailer_script_r4.md` (header "owner round r2, rev R2"). Lens: did each R2 timing finding land correctly, what the rev R2 diff (`git diff f3e8d5e70 76473abcd`) added, and which existing takes carry text that the episode rewrite in `cf31e6c5d` has made out of date. Frames pulled with `nice -n 19 ffmpeg -threads 1` (frame grabs only) from `~/video-takes-local/ca15/takes/*.trimmed.mkv` into the session scratchpad. t16 and t06b do not exist (no `.mjs`, no take), so they are checked as specs. No renders.

Counts: 0 Blocker, 3 Major, 8 Minor.

## What passes

- **Grid.** 7+10+5+6+6+6+6+5+7+7+10+7+4+9+10+11 = 116 beats = 73.263 s. Fallback 8+4+7+10+12 = 41 = 7+4+9+10+11. Every cumulative time in section 2 equals `n * 60/95` to 0.01 s (b17 10.74, b28 17.68, b46 29.05, b58 36.63, b86 54.32, b95 60.00, b105 66.32; fallback b83 52.42, b87 54.95, b94 59.37, b104 65.68). Every shot window in section 5 equals its beat length (4.42, 3.16, 3.16, 4.42, 4.42, 6.32, 6.32; beat 3 5.61 to 8.77; beat 14 5.68). Balance figures (37.9 / 14.5, fallback 38.5 / 13.3) recompute.
- **R2 timing findings applied correctly:** M1 (beat 10 at 2 / 1.6875 / 2, cx 960, cy 616; checked below), M2 (hook caption, 26 and 21 characters), M4 (beats 3 and 12 at 16:9 zoom 2; panel 753 x 360 measured on t03b frame 5.61 sits whole inside the 960 x 540 crop at cy 540), m1 (v26 voicing note, v18b lead 0.1), m2 (t06b opens the row at list + 1.2, so it opens 1.10 s into a shot that starts at list + 0.10, and the 5.0 s hold covers out = list + 5.78), m3 (appendix window 7.70 to 11.49), m4 to m8 (values present and, below, whole-pixel), m9 and m10 (note and clip at 0.0; her PC bubble is up at 45.50, the shot starts 45.55).
- **VO gates.** All 10 new lines: word counts, est. clip (`words / 2.33 + 0.15`), gate (`window - lead - 0.3`) and slow read (`0.495 s/word`) recompute to the table. Every est. end is at least 0.37 s before its cut; every w/s (words over window) is at most 1.85, so the 3.0 cap is not at risk. v23 to v25 exceed their gate on the slow read (3.47 against 3.29); the stated fallbacks cover it and the nearest measured clip, v16 (7 words), is 2.47 s. v1 starts 0.82 s into the card and ends 5.93 (0.39 clear); the hook clip's silent tail overlaps v1 by 0.11 s, harmless.
- **Captions.** All 22 caption lines are at most 27 characters (longest v28 line 1, 27); chips at most 21; close card line 24. Reading speeds: 10 to 16.8 cps, hook 9:16 caption 19.2 cps (47 characters in 2.45 s, stated and accepted).
- **Whole-pixel crops.** Every cx and cy in section 5 is a whole source pixel (0.5698 = 1094.0, 0.6396 = 1228.0, 0.6448 = 1238.0, 0.5604 = 1076.0, 0.5204 = 562.0, 0.3704 = 400.0, 0.5704 = 616.0, 0.2448 = 470.0, 0.35 = 672, 0.45 = 864, 0.21875 = 420), and every half-crop origin is an integer. Zooms are all in the allowed sets (16:9 and 1:1: 1, 2, 3; 9:16: 0.5625, 1.125, 1.6875).
- **Beat 9 (45.55 to 49.97).** Bubble whole, no toast or HUD at 45.55, 47.5, 49.9. Bubble 214 to 610 px, Joanne and monitor inside the 16:9 (0 to 960), 1:1 (150 to 690) and 9:16 (0 to 640) crops.
- **Beat 10 menu check.** Frames 32.4, 32.8, 33.0: the menu has two entries, "Drop here" and "Examine"; no description and no second mention of the kit. The header (x 925 to 1026, y 770 to 790) is the only text to mask. No toast, no objectives panel, no item name in the bar in 30.0 to 34.4. In 16:9 and 1:1 the crop (y 346 to 886) excludes the inventory bar (y 960 and below) and the top void.

## Major

### M1. Beat 8 at zoom 3 cuts the chatter bubble in half, and the script says it holds "most of the bubble"

R2 timing M3 moved beat 8 to zoom 3 with cx 0.55, and rev R2 wrote it into section 5 (16:9 cx 1056, crop x 736 to 1376; 9:16 cx 1094, crop 774 to 1414). Measured on t11 frames 35.5, 37.0 and 38.6: the bubble "Who's nicked the big mug?" spans x 1152 to 1552 (400 px wide); "Printer's jammed again." (from 37.9) spans about 1061 to 1434. Both run past the crop edge, so the 16:9 crop shows "Who's nicked th" and "Printer's jammed ag" (frames 35.5, 37.0, 38.6 in the crop). A bubble cut mid-word reads as a glitch on a silent view. The stick sits at x 928 to 969, y 642 to 655; Joanne at 1136 to 1196, Niamh at 1213 to 1289, people's heads from y 502, bubble y 425 to 482 (tail to 490).

Fix:
- 16:9 and 9:16: cx 0.6458 (1240 px). Crop 920 to 1560 holds the stick (9 px clear on the left), Joanne, Niamh and the whole bubble in both frames (8 px clear on the right at 35.5). Same cx for 9:16 at 1.6875 (640 wide). cy 0.5204 (562) unchanged. Check the margins on frames; if the left margin looks tight, do not move left (the bubble then clips).
- 1:1 (360 square at zoom 3) cannot hold the stick (928) and the bubble (to 1552), 624 px apart. Take the bubble out on purpose: cx 1102 (0.5740), cy 670 (0.6204), crop 922 to 1282 by 490 to 850. That holds the stick, Joanne and Niamh (right sleeve clipped by about 7 px) and clears the bubble body (y 425 to 482) and its tail (to 490). v26's caption carries the beat. Say so in the row.
- Correct the sentence "the stick, Joanne, Niamh and most of the bubble".

### M2. The truth checks quote episode text that `cf31e6c5d` has replaced

The v18b truth check, the Sources line and the O1 rubric row quote the old tracker wording. After the fix:

- Session note (`scenario.json.erb` :220, same line number) now reads "She plugged the stick into her work PC to find its owner, and our tracker reported home. A real attacker's stick can run code the moment it's plugged in, before anyone opens a file." The script quotes "She opened a file to find the owner... A real stick would have run its payload right there" and "when Joanne opened a file".
- Nilesh's tracker line moved from `nilesh_solanki.ink` :85 to :87 and changed: "To a work PC it's an unknown device. Ours is harmless, it only tells us when it's plugged in." The script quotes "safe tracker... It only tells us who opened it" at :85. The drop intro is now "Before we go on, try the attacker's side. One USB stick, no label, no note." (:86).
- The kind-line hub (t15's line) is unchanged, but the next line is new: "A real attacker's stick can run code the moment it's plugged in. That's why unknown devices come to us first." (:48).
- Other stale statements: beat 10 row "Proposed for the episode fix: rename the item 'Unlabelled USB stick'" (done); section 3 note "use 'work network' or 'work laptop' in the drop framing" (done, see m5); appendix "the unfixed session note says the same tracker reported home" (still true in effect, wrong wording); Sources "erb :220 and ink :85"; section 5 retake marks "(card 1 says 'the pack' today)" and beat 14 "(the brief and a list row say 'pack' today)".

Fix: replace the v18b truth-check quotes and the Sources line with the new text and line numbers (erb :220, ink :87 and :48). The new wording supports v18b more directly ("plugged the stick into her work PC", "can run code the moment it's plugged in"), so say so. Reword the "today" notes to "fixed in `cf31e6c5d`; old takes still show the old text". No change to VO or timing.

### M3. The retake instruction points at a tree without the fix, and the retake specs still carry two traps

Section 5 says new takes run "from a worktree of local main after the episode fix lands". `git merge-base --is-ancestor cf31e6c5d main` is false: the fix is on `video/ca-trailers-15-01` only, and this branch goes to main through AC0's train. A t16 or t06b recorded from main today would show "pack" and fail its own assert (correctly, but the owner would see a blocked list with no reason).

Fix: write "from this branch (or from main once the train carrying `cf31e6c5d` lands)". Two spec details:
- t06b assert "no row subject contains 'pack'" is safe on subjects (they are now "Client files for Monday, final", "Great to meet you at the Expo, here's our catalogue on a USB"). The sender column reads "Benmoor Packaging", so a loose `/pack/i` over the whole row would fail. Say `/\bpack\b/i` on subject and preview text only.
- t16 and t06b must press options with the widened regexes now in `tools/video/takes/ca15/_ca15.mjs` (`Send the (pack|client files) ...`, `Plug the visitor's (USB )?stick into your (work )?laptop`); new options read "Send the client files to your personal email to finish at home" and "Plug the visitor's USB stick into your work laptop". Name the new labels in the t16 spec, and assert `client files` for card 1 and `USB stick` for card 3.

## Minor

### m1. Beat 14: the VO order does not match the picture

v28 "Sticks by post, free tools, more shortcuts." runs over a list that opens a Benmoor message at 1.10 s. "Sticks by post" (0.2 to about 1.0 s) is over the list; "free tools" (about 1.0 to 1.8 s) lands on the open message, which is a stick offer ("we've posted you a branded USB stick... Plug it in to browse the range", t06 frame 8.5). A silent or sound-on viewer sees a stick while hearing "free tools". Rows in the list: the padded envelope (Reception), Chuckbox (free transfer), Benmoor (stick), PDFmangle Free, file share, Nilesh.

Fix: reorder the same 7 words to "Free tools, sticks by post, more shortcuts." The list (Chuckbox and PDFmangle rows) is up for "free tools" (0.2 to 0.9 s) and the Benmoor message opens for "sticks by post" (from about 0.9 s). Gates and counts are unchanged (7 words); update the caption break ("Free tools, sticks by post," 27 / "more shortcuts." 15) and the truth check (order only).

### m2. Beat 10: no rectangle for the menu mask, and the crop claim is wrong for 9:16

The row says "flat box in the masks lane from take 32.35 to 33.20" with no coordinates. Measured on frame 32.8: header text x 925 to 1026, y 770 to 790; menu frame x 905 to 1120, y 750 to 982. Give `{x:920,y:765,w:115,h:30}` (header only; "Drop here" and "Examine" stay). The header lies inside all three crops.

The sentence "it also crops out the top void of the pan, the inventory bar and the HUD pop at 34.13" holds for 16:9 and 1:1 (y 346 to 886) but not for 9:16 at 1.6875, which shows the full source height (640 wide by 1080 tall, 97 px of the 1920 frame left as bands). There, frame 30.0 shows 300 px of black above the room, 31.5 about 200 px, and the inventory bar with Notes and the stick slot is in view from 30.0 to about 33.1 (the stick icon leaving the slot is a useful cue; no item name is shown). The HUD pop at 34.13 is also in 9:16. Fix: say "16:9 and 1:1" in the row and accept the 9:16 void (it reads as a letterbox over the pan).

### m3. Hook at 1:1: the chatter bubble is clipped for the first 0.3 s

The 1:1 crop (cx 864, 324 to 1404) holds Joanne's bubble but not "Printer's jammed again." at 40.93: it spans x 1067 to 1440, so the final "n." clips by about 36 px. The bubble is gone by 41.3. The script's "bubble travels 0.21 to 0.72 of the width" is off: the right edge is 0.75 (1440). Joanne's bubble is 395 to 850 at 45.34 (left edge 395, 400 at 45.3).

Fix: 1:1 hook cx 0.4792 (920 px), crop 380 to 1460: 20 px clear of the chatter bubble at 40.93 and 15 px clear of Joanne's bubble at 45.34. Replace "0.21 to 0.72" with "0.206 to 0.75".

### m4. Beat 7 fallback on t03 is now stale and fails its own gate

Three problems with "fallback, existing: t03 in 15.75, out 18.91 at 5 beats, with beat 8 taking the spare beat":
- The option label on screen is the old "Plug the visitor's stick into your laptop" (frames 15.75 to 18.9, picked from 16.67); the game now says "Plug the visitor's USB stick into your work laptop".
- v25 (est. 3.15 s, slow 3.47) must fit beat 7's window; on 5 beats that is 3.16, gate 2.66. It cannot. Beat 8's window then becomes 6 beats (35.50 to 39.29), which the script does not state.
- Beat 7's fallback is only reachable if t16 exists (beat 6 has no other take), so it saves nothing: t16 covers beats 5, 6 and 7 in one take.

Fix: delete the t03 fallback for beat 7 and say "if card 3 fails in t16, re-run t16". Keep t03 only in the option (c) appendix, with its stale text boxed as listed there.

### m5. v25 "on the work network" has no home in the fixed episode

The section 3 note asked the fix for "work network" or "work laptop". The fix used "work laptop" (card 3) and "unknown device" (Nilesh, erb :1667); "work network" and "untrusted" appear nowhere in either episode's text. The chip `A VISITOR'S STICK` also drops the "USB" the card now carries.

Fix (owner's call; Q6-style): keep v25 (the owner's words) or move to "An unknown device in a work laptop." (7 words, same gate, repeats the episode's own words). Optionally chip `A VISITOR'S USB STICK` (21 characters). Update the v25 truth check either way.

### m6. Beat 9 at 16:9: a sliver of the learner at the right edge

The 16:9 crop (x 0 to 960, y 130 to 670) catches the learner's left 25 to 30 px at the right edge in all frames (45.55, 47.5, 49.9; about 60 px on the output). The crop already starts at x 0, so it cannot move out. 1:1 and 9:16 are clean. Accept and note it, or crop 16:9 at zoom 3 (640 x 360, cx 0.1667 = 320, cy 0.3704) if the bubble (214 to 610) still fits: it does, with 30 px to spare, but Joanne's monitor and desk shrink to the edge, so check frames before choosing.

### m7. Beat 14 text is small at 16:9 zoom 1

The inbox panel is 956 x about 900 px; the message body is about 16 px tall at 16:9, 18 px at 9:16 1.125. The lure is the point of the shot ("Plug it in to browse the range") and R2 M4 gave the other text pages zoom 2 for this reason. With verbs and counter hidden, the list and the open message fill y 170 to 480. A 16:9 zoom 2 crop at cx 0.50 (960), cy 0.3611 (390) covers x 480 to 1440 and y 120 to 660, holding the list, the header and the whole message. Check on t06b frames that the hidden verb row leaves nothing below y 480. 9:16 and 1:1 stay as written (a 540 crop cannot hold the panel).

### m8. t06 fallback: text is stale by two letters

The t06 fallback list shows "Shauna Lofthouse shared 'Mo..." where the game now shows "'Cl...". No "pack" is visible (the row and the other previews are cut before it), so the fallback is usable as written, with the counter box `{x:430,y:100,w:440,h:62}` (measured counter and bar: x 512 to 865, y 100 to 160). Note the stale prefix in the fallback row.

## Takes needing retakes after cf31e6c5d

"Visible text" means text inside the window and the crop in section 5. A take marked "no" can be used as is; "masked" means the old text is on screen but covered.

| Take | Shot in r4 | Old text visible in the used window | Needs retake? |
|---|---|---|---|
| `t11_red_drop_run` 40.93 to 45.35 | 1 hook | Chatter bubble "Printer's jammed again." and Joanne's bark "Someone's dropped a memory stick. Whose is this?" (bark unchanged in erb :1595); floor item now named "USB stick" but no label shows | No |
| `t11_red_drop_run` 35.50 to 38.66 | 8 usb | Chatter bubbles only (kit ambient lines unchanged; the one changed ambient line, Chidi's "client pack", is not in this window) | No (fix the crop, M1) |
| `t11_red_drop_run` 45.55 to 49.97 | 9 plug_in | Joanne's PC bark (unchanged) | No |
| `t11_red_drop_run` 30.00 to 34.42 | 10 drop | Menu header "RED-TEAM STICK" (item is now "Unlabelled USB stick"), 32.42 to 33.12 | No, masked (mask is mandatory and needs its rectangle, m2). No toast, no item name, no objectives panel elsewhere in the window |
| `t15_nilesh_kind` 9.82 to 16.14 | 11 nilesh_kind | Subtitle bar and portrait: "Nobody was careless there. She was being kind, and that's what a drop relies on." (unchanged; the new second line, "A real attacker's stick can run code...", follows it in the game and is not in the window) | No |
| `t14_fatima_stepaway` 8.91 to 15.23 | 15 fatima | Fatima's two bubbles ("memory stick", "No name on it, nothing...", both unchanged); kiosk and room carry no text | No |
| `t03b_choices_hold` 5.61 to 8.77 | 3 topic | Everyday choices panel and tabs; the panel text is outside the diff | No |
| `t03_choices_reveal` 15.75 to 18.91 | 7 device (fallback) | Card 3 option "Plug the visitor's stick into your laptop" (now "...USB stick into your work laptop"), and "Choice 3 of 4" | Yes, stale; drop the fallback (m4). t16 replaces it |
| `t03_choices_reveal` 7.70 to 11.49 | 5 email (option (c) appendix only) | Card 1 "Send the pack to your personal email" and "the pack is due Monday" | Yes if used; t16 replaces it (the appendix boxes it) |
| `t03c_flip_one` 14.37 to 18.79 | 12 opening (option (c) appendix only) | Page text "the pack sat in its sent items" | Yes if used; t16 tail replaces it |
| `t06_inbox_list` 2.20 to 6.62 | 14 inbox (fallback) | File-share row "Shauna Lofthouse shared 'Mo..." (now "'Cl...") and nothing else changed in the visible previews | Usable as a fallback; t06b still preferred (m8) |
| t16_shortcuts (new) | 5, 6, 7, 12 | Not recorded yet; must be recorded on a tree that has `cf31e6c5d` (M3) | New take, unblocked once M3 is fixed |
| t06b_inbox_list (new) | 14 | Not recorded yet; same | New take, unblocked once M3 is fixed |
| `t10_worldbeat_panel` | none (cut from r4) | Heading "One from the red-team kit" (now "Try the attacker's side") | Not used; do not reuse |

Summary: no existing take used by the main plan needs a retake because of the text change (t11, t15, t14, t03b are clean or masked). The takes that carried old text (t03 card 1 and card 3, t03c, t06) are replaced by t16 and t06b, which are already planned.

## Fix list

| Item | Change |
|---|---|
| M1 beat 8 | 16:9 and 9:16 cx 0.6458 (1240); 1:1 zoom 3 cx 1102, cy 670, bubble out; fix the "most of the bubble" sentence |
| M2 truth checks | Quote the new session note (erb :220) and Nilesh lines (ink :87, :48); drop the "today" and "proposed for the fix" wording |
| M3 retakes | Record from this branch (or main after the train); asserts for the new card labels; `\bpack\b` on subjects |
| m1 | v28 order "Free tools, sticks by post, more shortcuts." |
| m2 | Mask rectangle `{x:920,y:765,w:115,h:30}`; the "crops out the bar" claim is 16:9 and 1:1 only |
| m3 | 1:1 hook cx 0.4792 (920) |
| m4 | Delete the t03 beat 7 fallback; re-run t16 instead |
| m5 | v25 wording: keep or "unknown device in a work laptop"; chip optional "A VISITOR'S USB STICK" |
| m6 | Accept the learner sliver at 16:9, or zoom 3 (check frames) |
| m7 | Optional: beat 14 16:9 zoom 2, cx 0.50, cy 0.3611 |
| m8 | Note the "'Mo..." prefix on the t06 fallback |
