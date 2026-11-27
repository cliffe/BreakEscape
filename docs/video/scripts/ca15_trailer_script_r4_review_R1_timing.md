# Review R1 (silent viewing and timing): ca15 trailer script r4 (Shadow IT, owner round r2)

Script: `docs/video/scripts/ca15_trailer_script_r4.md`. Lens: sound off with captions on, then the beat grid, VO fit, cut clearance, in/out against the real marks, jargon, pace, integer zoom. Review only; no renders. Frames pulled with `nice -n 19 ffmpeg` into `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/ad8eaaeb-1d0e-460b-9802-75c392a3c39c/scratchpad/ca15_r2rev/`. Marks are from the current `*.trimmed.markers.json` (t11 as re-recorded). The video runs about 0.04 s ahead of the t11 bubble marks (the hook bubble swap is on screen between 45.46 and 45.50, marker 45.52).

Counts: 1 Blocker, 6 Major, 10 Minor.

## What passes

- Beat grid: 7+10+5+6+6+6+6+5+7+7+10+7+4+9+10+11 = 116 beats = 73.263 s. Every cumulative time in the section 2 table matches `n * 60/95` to 0.01 s, and every in/out pair in section 5 is exactly the stated shot length (4.42, 3.16, 3.79, 6.32, 5.68).
- Cached clip lengths match the script (ffprobe): v1 5.112, v1c 2.688, v18 1.728, v15 1.416, v10 1.128, v11 5.760, hook 3.144, PC line 2.280.
- Every cached VO ends at least 0.37 s before its cut (v1c is the tightest at 0.37, v1 0.39). All new-line estimates leave 0.59 s or more. Nothing ends within 0.3 s of a cut apart from the stated hook L-cut.
- Cast lines clear their cuts: Joanne's PC line ends 2.3 s into beat 9 of 4.42; Nilesh speech 10.00 to 14.34 (silencedetect) leaves 1.8 s before the cut at 16.14; Fatima's ask 10.59 to 13.81 leaves 1.4 s.
- v10 ("A colleague asks.") does not sit on a character line: Fatima's bark audio runs 5.96 to 8.51, v10 sits at 8.91 to 10.04, her ask starts 10.59.
- All captions are 28 characters or fewer a line (longest is 27, v28 line 2).
- The hook marks hold on the re-recorded t11: speech 43.14 to 44.78 and 45.28 to about 45.9, the PC bubble 45.52 to 51.61. The beat 9 window does not meet the session-note tray (52.07), "Session note" or any toast. The blue stick sprite no longer shows after the pickup (checked 43.5, 45.38, 47.0, 49.9).
- Beat 8 (35.50 to 38.66) shows no HUD, no item name, no toast; chatter bubbles only.
- Beat 3 (t03b 5.61 to 8.77) shows the Everyday choices panel before any pick and no tally.
- t03 beat 7 fallback (15.75 to 18.91) stays on card 3 throughout. t03c beat 12 stand-in (14.37 to 18.79) shows the Six months page, no tags or tally, and ends 0.77 s before the take ends.

## Blocker

### B1. Beat 14 shows verdict buttons, and the Benmoor row cannot be shown without them

The script says the window (t06 in 1.75, out 7.43) is "out before they show". It is not. In t06 the row is opened at `row_usb` 6.77 and the four buttons (Trust, Report, Delete, Verify, with the advice text "This one's safe. I'd act on it.") are on screen from 6.78. The window runs to 7.43, so 0.65 s (about 20 frames) shows verdict buttons. Frames at 6.78, 7.0 and 7.4 confirm.

It also cannot show "the Benmoor USB catalogue row". Before 6.77 the list row reads only "Great to meet you at the Expo, ..." (the word USB is not visible). The USB text appears only in the opened message, which arrives together with the buttons. What is left before 6.77 is a list that does not move for 5 s.

The first frames are also at risk: before about 1.70 the panel shows the "Inbox check: 6 messages" intro page, which spells out Trust, Report, Delete, Verify. Starting at 1.75 leaves 0.05 s of margin against the 0.04 s mark slop.

Fix (primary): do it in t06b, which is already a retake. In the script, hide the verb row by CSS before opening the row (the t03c `hideText` pattern), open the Benmoor row 2.0 s after the list appears, and assert the verb row is not visible in any frame of the window. Window: in = list + 0.10, out = in + 5.68. The list shows for 2.0 s, the opened message with "catalogue on a USB" for 3.6 s, v28 (ends 4.50 s in) sits over it.

Fix (stand-in on the existing t06, if t06b is late): the longest clean window is 1.80 to 6.74 (4.94 s). Use 7 beats: in 2.20, out 6.62 (4.42 s), no row opening. Beat 14 drops from 9 to 7 beats. Hand the 2 beats to beat 12 (7 to 8 beats: t03c 14.37 to 19.42, take ends 19.56) and the close (11 to 12 beats, 7.58 s; v11 then ends 1.6 s before the end of the card, which is fine for a CTA). Drop the stand-in's "Monday pack, final" box: that row is truncated to "Shauna Lofthouse shared 'Mo..." in the list, so "pack" is not visible in this window.

## Major

### M1. Beat 10 (drop): the item name shows, and the landing gets 0.6 s

- The stick's context menu header reads RED-TEAM STICK from `menu_open` 32.42 to `drop_click` 33.12 (frames 32.5 and 33.0). The script's mask check is right and needed.
- With in 29.45 / out 33.87, the stick lands at `drop_land` 33.275, so the payoff of the shot gets 0.6 s, and the landed stick is about 8 px. The "as r1" window was set from older marks (landing 33.08 and HUD off 33.99; now 33.275 and 34.13).

Fix: in 30.00, out 34.42 (still 4.42 s, on the grid). The landing is 3.28 s into the shot with 1.14 s of hold. The HUD is off from 34.13, so the last 0.29 s has no bar, which is fine. Flat box over the menu header from 32.35 to 33.20 (shot time 2.35 to 3.20). Keep the chip SAFE TEST STICK. Re-check 34.0 to 34.42 for toasts.

### M2. Beat 14 shows a progress tally, "0 of 6 sorted"

The line sits above the list in every frame of the window, with a progress bar. The house rule bans tallies. A flat box works but is ugly mid-panel. Fix: in t06b hide the counter and bar by CSS (same pass as B1). On the stand-in, box it from the shot's first frame to its last.

### M3. Hook framing "2 / 1.6875 / 2 ... Joanne and the bubble in all three crops" cannot hold

Joanne walks while her bubble is up. Her bubble spans about 0.48 to 0.72 of the source width at 43.5 and 0.21 to 0.44 at 45.38, so the bubble travels across 0.21 to 0.72 (0.51 of the width). Crop widths: 16:9 zoom 2 is 0.50, 1:1 zoom 2 is 0.28, 9:16 zoom 1.6875 is 0.33. Even the 16:9 crop is too narrow, and the 1:1 and 9:16 crops lose the bubble's start or end. A static crop is required (no pushins).

Fix: hook framing 1 / 0.5625 / 1, with the 1:1 centre at cx 0.45 (spans 0.17 to 0.73). The r5 edit used these values. If the owner wants a tighter 16:9, zoom 2 at cx 0.46 holds the pickup and loses the end of the walk; not recommended.

### M4. Beat 15 (Fatima): the bubble is clipped on the left in 16:9 and 9:16

The edit uses cx 0.406 (the script gives no cx for beat 15; r5 uses 0.406). A 16:9 zoom 2 crop is 0.50 wide, so it starts at 0.156 (x = 300). Her bubble starts at about x = 246 to 261. In a crop at 10.8 the ask bubble reads "name on it, nothing. What / you reckon I do with it?" with "No" and "do" cut off. The 9:16 crop at 1.125 is the same 960 px and clips the same way. The 1:1 crop (cx 0.2448) is fine.

Fix: cx 0.35 for 16:9 and 9:16 (crop 0.10 to 0.60 keeps the bubble, Fatima, the seated man, the kiosk and the player). Add the cx to the script, which gives none.

### M5. 9:16 panel shots at zoom 0.5625 are unreadable, and 16:9 and 1:1 text is small

Panel text in the takes is about 14 px tall at source (the list rows, the choice cards, the Six months page). At 9:16 zoom 0.5625 it is 8 px on a 1080-wide frame, so on a phone the card text, option text and consequence text cannot be read; only the captions carry the point. Affects beats 3, 5, 6, 7, 12, 14.

Fix: 9:16 zoom 1.125 (legal) centred on the panel, cx 0.5 for every panel shot (checked: the choice panel, the Everyday choices window and the Six months window are all centred at about 0.5). Text becomes 16 px. The inbox panel is 960 px wide, exactly the crop width, so check that its border is not shaved. 16:9 and 1:1 stay at zoom 1 (a zoom 2 crop of 540 px would cut the choice panel, which is about 570 px tall). The script's "panels `1 / 0.5625 / 1`" line should be rewritten as `1 / 1.125 / 1`.

### M6. v23, v24, v25 have little margin if the voice runs at the cached cadence

The estimate uses 2.33 words a second. The six cached Sulafat clips measured here run 1.5 to 2.8 words a second (mean 2.13), or 3.0 to 4.4 syllables a second (mean 3.7). v23, v24 and v25 are 10 to 11 syllables each in a 3.79 s window with a 0.2 s lead.

- At 3.7 syllables a second: about 3.0 s, margin 0.59 s (the script's figure).
- At the cached word mean: 3.3 s, margin 0.30 s.
- At the slowest cached syllable rate (3.0 per second, the colon line v1c): 3.7 s, margin 0 and the line crosses the seam.

The script says "level, slightly brisk", which is right, but nothing gates it. Fix: gate each of v23 to v25 at a measured clip of 3.29 s or less (3.79 - 0.2 lead - 0.3 clearance). If one is longer, drop "sent" from v23 ("Client files to a personal inbox.") or cut the lead to 0.1 s. The other new lines are fine at the slow rate: v22 (9 syllables), v26 (7), v27 (10, window 4.42), v28 (11 syllables plus three pauses; fine up to 5.18 s).

## Minor

### m1. The hook L-cut is acceptable

Measured: first sentence 43.14 to 44.78, second 45.28 to about 45.92. The bubble is whole from 42.82 to about 45.48 (2.6 s on screen, long enough to read 10 words). With out at 45.40 the line ends 0.52 s after the cut, which is clear of 0.3 s, and v1 starts 0.30 s after it with no overlap. The only soft spot is that "Whose" starts 0.12 s before the cut, so the word straddles the seam, and the second sentence is heard over the card. Sound-off viewers lose nothing. Keep the default in Q1; no retake. Optional polish: lay the clip 0.12 s later so "Whose is this?" begins on the cut (a clean L-cut), if the lip sync on the first sentence still reads (the speech lead then becomes about 0.44 s from the bubble start).

### m2. Margins at the swaps

Hook out 45.40 is 0.08 s before the bubble swap (45.46 to 45.50): safe, but 0.13 s is better (in 40.93, out 45.35). Beat 9 in 45.50 is on or inside the swap, so one frame of slop risks a frame of the hook bubble: use in 45.55, out 49.97.

### m3. The Nilesh caption is four lines for 4.35 s

"Nobody was careless there. / She was being kind, and / that's what a drop / relies on." is 1.09 s a line if held with the speech (10.00 to 14.34). Fix: split by sentence. Caption A "Nobody was careless there." from 9.95 to 11.50 (1.55 s, one line). Caption B "She was being kind, and / that's what a drop / relies on." from 11.50 to 15.20 (3.7 s, 1.23 s a line). Both clear the cut at 16.14.

### m4. The v10 caption is on screen for 1.13 s

One line, clip 1.128 s. Hold it from 0.05 to 1.40 s into the shot (1.35 s). It stays clear of her ask bubble (10.21 take time, 1.30 s into the shot) only if the caption sits at the bottom; keep it low.

### m5. "Even a USB stick" is pre-empted by beat 7

The card 3 text on screen (16:9) is literally "A visiting surveyor holds out their own USB stick ..." and "Plug the visitor's stick into your laptop", so v26's "Even" lands after the viewer has already seen a USB stick. At 9:16 zoom 0.5625 the text is not readable (see M5), but at 1.125 it will be. Fix: either reword v26 as "And the same goes for a found stick." (8 syllables, still under 2.66 s), or accept it, since the chip is SOMEONE ELSE'S DEVICE and beat 8 is the found stick. Lowest cost: accept, and decide after the M5 change.

### m6. Card counters show out of order

The edit plays cards 1, 4, 3 but the panel header reads "Choice 4 of 4" in beat 6 then "Choice 3 of 4" in beat 7. Visible once M5 is fixed. Fix: record t16 with card 3 and card 4 in the order the edit plays them if the episode allows, or accept (the viewer is not counting).

### m7. Appendix beat 5 (t03 stand-in) ends on card 2

In t03 the card 1 pick holds to about 11.5 and card 2 is already up at 11.9. The stand-in window (8.14 to 11.93) ends on 1 to 3 frames of card 2. Fix: in 8.14, out 11.93 becomes in 7.99, out 11.78 (still 3.79 s; the pick is then 0.20 s in, fine).

### m8. The "Skip" button in the t15 subtitle bar

Frames at 9.82 and 14.0 show a "Skip" button in the game's subtitle bar, which is masked and replaced by the burned caption. Check that the mask covers the button and the tiny corner square at the top right.

### m9. Pace

Hook 4.4 s, open card 6.3 s, topic 3.2 s, red card 3.8 s: the first action shot (the first pick) arrives at 17.7 s, so 24 percent of the trailer is spent before the viewer sees the first shortcut. It is carried by VO that names and defines the idea, and it is pinned by the b28 drop, and the open card cannot shrink (v1 ends 0.39 s before its seam). Keep. The densest spot is beats 5 to 7 (3.79 s each with a card to read); M5 makes them parseable. The close ("Take the shortcut, see where it leads") is voiced as an instruction. The house rule says the narrator never voices an unsafe pick as an instruction; this is the series tagline, so leave it for the owner to rule on.

### m10. Beat 8 crop

The brief says "framed on the stick and the kettle" at 2 / 1.6875 / 2. The stick is at about 0.49 of the width, the kettle and the two staff at 0.60 to 0.66, and the chatter bubble runs to 0.82. 1:1 (0.28 wide) and 9:16 (0.33 wide) cannot hold bubble plus stick. Fix: cx 0.57 for all three; the bubble is clipped in 1:1 and 9:16, which is fine (chatter only).

## Zoom checks

- Cards: none. Beats 11 (Nilesh chat) at 1 / 1.125 / 1: legal, and the chat is not zoomed in. Beat 9 at 2 / 1.6875 / 2: legal, and the bubble, Joanne and the monitor sit inside all three crops (checked on the 49.9 frame: bubble 0.10 to 0.30, Joanne 0.20).
- Legal but failing in practice: hook (M3), beat 15 (M4), panel shots at 0.5625 (M5).
- Beat 10 stays at 1 / 0.5625 / 1 (the player crosses the room, no static crop holds it); the menu and the stick are small at 9:16. The M1 timing change is the main help.

## Fix list in numbers

| Item | Change |
|---|---|
| Beat 14 (B1, M2) | t06b: hide the verb row and "0 of 6 sorted"; row opens at list + 2.0 s; in = list + 0.10, out = in + 5.68. Stand-in: 7 beats, in 2.20, out 6.62; +1 beat to beat 12, +1 to the close |
| Beat 10 (M1) | in 30.00, out 34.42; mask 32.35 to 33.20 over the menu header |
| Hook framing (M3) | 1 / 0.5625 / 1; 1:1 cx 0.45 |
| Beat 15 (M4) | 16:9 and 9:16 cx 0.35 (1:1 stays 0.2448) |
| Panels (M5) | 9:16 zoom 1.125, cx 0.5 on beats 3, 5, 6, 7, 12, 14 |
| v23 to v25 (M6) | gate: measured clip 3.29 s or less; if over, v23 "Client files to a personal inbox." |
| Swaps (m2) | hook in 40.93, out 45.35; beat 9 in 45.55, out 49.97 |
| Captions (m3, m4) | Nilesh split into two captions (9.95 to 11.50, 11.50 to 15.20); v10 caption 0.05 to 1.40 s |
