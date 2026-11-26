# ca15 trailer script r3: silent read and timing review, round R1 (26 Nov)

Reviewer: Sonnet (silent viewing, timing, integer scale). Scope: `ca15_trailer_script_r3.md` at 4cf007870, `takes_ca15.md`, `GUIDELINES.md`, the `video-edit` skill, `CA_THEME_TWO_SEATS.md`, `tools/video/edits/ca15_trailer_r4.json` (for r2 line lengths). Review only; the script is not edited.

Result: **1 B, 7 M, 8 m.** The table sums to 70.8 s and the row times agree. The music window is long enough and clean. The main problems are framing (panels clipped in two aspects), four lines with no margin against a seam or the next cut, and nearly half the runtime resting on takes that do not exist yet.

How it was measured. Cached clip lengths from `~/video-takes-local/ca15/vo/Sulafat_v2/trim/` with `ffprobe`: v1 5.112 s, v1c 2.688, v9 4.824, v10 1.680, v11 5.760. New narrator lines have no clip; estimates use the nearest cached rates (2.1 to 2.4 words per second in the clip, 3.0 words per second is the lint ceiling). Cast-line lengths: Fatima's ask is 3.98 s and "Hang on..." is 3.22 s in r4 (`ca15_trailer_r4.json` lines). Nilesh and Joanne lines are not cached, so they are estimated from characters per second of Nilesh's cached lines (12.7 to 15.8). Fit rule from earlier rounds: 0.2 s lead, audible length, 0.15 s tail, 0.25 s between cues. Music: `ffprobe` on `public/break_escape/assets/music/PeaceFolk/Guitar Motif.mp3` (the path in `ca19_trailer_r1.json`) gives 174.384 s.

## Narrator fit

| line | text | words | audible s | need s | slot s | spare s | note |
|---|---|---|---|---|---|---|---|
| v1 | Hacktivity Cyber Aware: ... you can play. | 9 (script says 8) | 5.112 | 5.31 | 5.5 | 0.19 | ok; 1.64 w/s, not 1.45 |
| v1c | This episode: Shadow IT. | 4 | 2.688 | 3.04 | 3.0 | -0.04 | ends 0.11 s before the red-card seam (m4) |
| v2 | First, take the shortcuts. | 4 | about 2.0 | 2.35 | 3.0 | 0.65 | ok |
| v16 | The pack goes to a personal inbox. | 7 | about 3.0 | 3.35 | 3.8 | 0.45 | ok; 34 characters (m2) |
| v17 | Six months on, that inbox was hacked. | 7 | about 3.0 | 3.35 | 4.2 (3.84 after the bar move) | 0.5 | ok; 37 characters (m2) |
| v18 | Then try the attacker's side. | 5 | about 2.1 | 2.45 | 3.0 | 0.55 | ok |
| v19 | Next door, the office gets on with its day. | 9 | about 3.8 to 3.95 | 4.15 to 4.3 | 4.0 | -0.15 to -0.3 | does not fit (M3) |
| v20 | You leave it by the kettle. | 6 | about 2.4 | 2.75 | 3.0 | 0.25 | ok, but beat 10 is busy |
| v14 | Then swap seats. | 3 | about 1.4 | 1.75 | 2.5 | 0.75 | ok |
| v15 | Sort the shortcuts inbox. | 4 | about 1.8 | 2.15 | 3.0 | 0.85 | ok |
| v9 | Is it an approved tool? Found sticks go to IT, unplugged. | 11 | 4.824 | 5.17 | 5.5 | 0.33 | ok |
| v10 | Then a colleague asks. | 4 | 1.680 | 2.03 | 1.9 (0.2 to 2.1) | -0.13 | fits the stated window by 0.22 s on the audio; the ask then has no margin (M5) |
| v11 | Take the shortcut, see where it leads. Learn on Hacktivity.co.uk. | 10 | 5.760 | 6.11 | 6.3 | 0.19 | ok; script's "6.21 s with tails" is the old figure |

All lines are at or under 3.0 words per second against their windows (highest: v10 at 2.11, v19 at 2.25, v9 at 2.00). Gaps between neighbouring cues are 0.3 s or more except v1c to v2 (0.31 s, fine) and v19 to v20 (0.2 s, see M3).

## Findings

### B1. Panels clipped in 9:16 and 1:1 on six beats (beats 3, 5, 6, 7, 13, 15; 22.0 s, 31% of the runtime)

The zoom column gives `2 / 1.125 / 2` for every kiosk panel shot. The three values are legal whole-number scales (16:9 and 1:1 scale 2, 9:16 scale 2). The problem is what scale 2 shows: 540 source pixels across in 9:16 and in 1:1, 960 by 540 in 16:9. Measured on the t03 and t06 frames, the panels are about 745 px wide (Everyday choices intro, 360 tall), 720 by 630 (choice card), 760 by 1000 (six-months page) and 960 by 900 (inbox). None fits 540 px. In 9:16 and 1:1 every panel shot is cropped through the middle of the text, and in 16:9 the choice card loses about 90 px of height and the inbox shows only the top 60%, so the four verb buttons (about 480 to 700 px down the panel) are probably out of frame. This is the "panels wider than 540 px at 1× with bars in the narrow formats" rule, and the script's own beat 15 fallback (`1 / 0.5625 / 1`) is the correct framing for all of them.

The silent viewer relies on these cards, so this is the one blocker. Fix: panel shots are `1 / 0.5625 / 1` (scale 1; bars top and bottom in 9:16, a 60 px margin in 1:1). For 16:9 use 1 or a whole-number crop only where the crop is a feature (led_email at 2 on card 1, cy about 0.31, 960 px wide covers its 700 px text). Accept that panel body text is texture at scale 1 in 9:16 (about 12 px on a 1080 px frame) and that the burned VO caption carries the meaning. If the owner wants the panel text readable on a phone, use the `insets` lane (`src` 540 wide, scale 2) on the card heading only. Beat 13 (flip) is the same panel: `1 / 0.5625 / 1`.

### M1. Beats 1, 9, 10, 11, 12 and 8 depend on takes and a room that do not exist (24.7 s, 35%), and the hook has no fallback

Existing footage covers beats 3 to 7 (r2 takes; beat 7 needs the new t10 panel take), 15, and the old Fatima take for 16. t11, t12 and t14 do not exist (`~/video-takes-local/ca15/takes` has t03, t05, t06, t07, t08b, t09b, lab_t10). Beat 12 has a stated fallback (drop it, give 1.8 s each to 11 and 9). Beats 1, 9, 10 and 11 have none, and they depend on S1 (the Tarrowby open-plan). The hook is the single most important 3.6 s.

Fix: state a fallback hook now: the r4 hook (t07 window 4.86 to 8.76, Fatima's "Hang on, someone's dropped a memory stick over here.", 3.22 s) fits 3.6 s and already exists, with the lab_drop shots as the stand-in for 9 to 11 only if the owner accepts the lab borrow back. Say which beats the table moves to "needs S1" and give the owner the decision on whether to wait for S1 or ship with the fallback.

### M2. Hook: 3.0 s line in a 3.6 s shot, ending against the seam (beat 1)

Joanne's "Someone's dropped a memory stick. Whose is this?" is 9 words, about 3.0 s (Fatima's equivalent 9-word line is 3.22 s). The bark fires on `npc_picked_up`, so the window opens at the pickup, with about 0.5 s lead-in at best. At about 3.5 s the line ends 0.1 s before the card at 3.6 s, and the seam join (6 to 8 frames, 0.2 to 0.27 s) lands over "this?". The caption has no time to be read after the line ends either.

Fix: hook 4.2 s (or 4.42 s, which is 7 beats on the 95 BPM grid). Pay for it by cutting the red card from 3.0 to 2.6 s (title only, 3 words) and beat 3 to 2.8 s (v1c needs 3.04 s, so only if v1c moves to the open card's last second; otherwise take it from beat 15, which has 0.33 s spare, and beat 6, which has 0.5 s spare). Total stays at about 71 s.

### M3. v19 does not fit beat 9 (4.0 s), and beat 9 holds too much

"Next door, the office gets on with its day." is 9 words, about 3.8 to 3.95 s at the rate of the cached v9 (2.28 words per second). With the 0.2 s lead and 0.15 s tail it needs 4.15 to 4.3 s in a 4.0 s shot, and it runs into v20, which starts at 0.2 s into beat 10 (a 0.2 s gap against the 0.25 s house gap). The 43 characters also break the 32-character caption claim in section 3 (only the two-line break, 21 + 21, saves it). The shot itself must show the learner walking through the side door, Nilesh going to the doorway and Joanne and Niamh on routines, all in 4.0 s.

Fix: shorten the line to "Next door, work carries on." (5 words, 27 characters, one line, about 2.3 s) or "Next door, the office carries on." (33 characters, 6 words). Keep beat 9 at 4.0 s with the shorter line. Hold the kettle chatter bed muted under it as the script already says.

### M4. Beat 11: the real-time walk, sit and line need about 8 s; the window is 5.5 s

Joanne goes from the kettle (14, 6) to her desk (5.75, 3.5): at least 8 tiles and likely 10 to 11 by path. At the scenario's 80 to 90 speed units that is about 3 to 4 s, then she sits and says "I'll just plug it in and see whose it is." (10 words, about 2.8 to 3.2 s) on `npc_use_started`. Walk, sit and line come to 6.5 to 8 s of real time. The script says the learner sees the carry, the sit and the line in 5.5 s, and it also needs the stick to be visible in her hands (a 2 px sprite at scale 3 in 9:16).

Fix: cut in on the last 1.5 s of the walk (in = `use_started` - 2.2 s), so the shot is about 1.5 s walk, 0.7 s sit and the 3.0 s line, ending 0.3 s after the line; say in the take plan that the carry is shown by the hook's pickup plus this arrival, not in full. Log a `walk_start` mark in t11 so the cut can be placed. If the owner wants the full carry, the shot needs about 7.5 s and the budget must come from elsewhere.

### M5. Beat 16: the ask has no margin against the close seam, and the "Hang on" bark may sit under v10

Fatima's ask is 3.98 s. v10 occupies 0.2 to 1.88 s of the shot, so the ask can start at 2.18 s at the earliest (0.3 s gap) and ends at 6.16 s in a 6.3 s shot: 0.14 s clear of a 0.2 to 0.27 s seam into the close card. The last word, "with it?", is under the wipe. In t07 the "Hang on..." bark (3.22 s) plays before the ask. The script's character-lines table lists only the ask for beat 16, but the scenario still plays the bark when Fatima reaches the stick. If the shot opens before that bark ends, v10 sits over it (r4's version of this shot opened 1.0 s before the bark's end, with v10 over the top).

Fix: beat 16 to 6.7 s (0.4 s from beat 6's spare or beat 15's 0.33 s plus 0.07 s from beat 14). Add a take check: the t14 window opens after the "Hang on" bark has ended (`bark_end` mark), or v10 moves to the "!" cue and the bark is not used. Record `ask_start` and `ask_end` and set the shot out at `ask_end` + 0.35 s.

### M6. Beat 8: Nilesh's line is likely longer than the 5.0 s shot

"Leave it next door, somewhere people stop. Then watch who picks it up." is 13 words, 70 characters. His cached lines run 12.7 characters per second (the 7.55 s opener) to 15.8 (the 5.76 s "That's the lot..." line), so the line is about 4.4 to 5.5 s. Add 0.1 s before it and 0.3 s after, as the t08b and t09b cuts do, and the need is 4.8 to 5.9 s against 5.0 s. The portrait-up delay (about 0.3 s) comes on top.

Fix: measure after the TTS top-up. Until then plan beat 8 at 5.8 s and take 0.8 s from beat 11 once M4 is applied (it gains time there) or from beat 9. A 70-character caption in 9:16 and 1:1 needs a line-break override (the script's own r3 note about no-break spaces applies): "Leave it next door, somewhere / people stop. Then watch who / picks it up."

### M7. Seat label is absent for 21 s of the attack half (beats 8 to 12)

Beats 8 to 12 are `full` seat with room chips (THE TRAINING ROOM, THE OPEN-PLAN, ANOTHER RUN). The theme says seat labels stay on screen for the whole time a seat is active "so a silent viewer always knows whose side this is". The only attacker cue between beat 7's RED-TEAM KIT chip (23.1 to 26.1 s) and the flip at 47.2 s is v18 ("Then try the attacker's side."), which is spoken and captioned once, at 23.3 s. After 21 s of cast-only footage with no label, the silent viewer has the red card as the only reminder. The purple stripe is on every label but is a company mark, not a side mark.

Fix: keep the red `THE SHORTCUT` tab (Q1's option) on beats 8 to 12, with the room name as a second chip, and let the seat go to `full` only for the hook and Fatima. This also settles Q1 in favour of the default: the red tab does the work the chip cannot.

### m1. Beat 12 needs 3.6 s of content and has none of its own text

Drop and landing (about 1.0 s), a visible wait with Joanne and Niamh ignoring it, Nilesh's bark ("Nobody bit. Corners don't get found.", 6 words, 2.0 to 2.4 s) and the stick vanishing do not fit comfortably in 3.6 s, and Nilesh stands in the next room, so his bubble is out of frame (the script already flags this). The toast "Nilesh has his stick back." is small, game-UI text, hidden by `--hide-hud` if that hides toasts. With no VO and no card, a silent viewer sees a stick sit in a corner and disappear. Fix: burn Nilesh's line as a caption in all three aspects, confirm the toast survives `--hide-hud`, and give the shot 4.0 s (from beat 14 by cutting the blue card to 2.6 s, or from M2's budget). The pixel dissolve into the shot also costs 0.2 to 0.3 s of it.

### m2. The 32-character caption claim is wrong for v16, v17, v9 line 2 and v11 line 1

Section 3 says every unlisted line is 32 characters or fewer. v16 is 34 and v17 is 37. The listed breaks leave "Found sticks go to IT, unplugged." at 33 and "Take the shortcut, see where it leads." at 38. At 56 px VT323 (about 22 px a character) 38 characters is about 850 px on a 1080 px frame, so it fits, but not with the plate padding on every aspect. Fix: "It goes to a personal inbox." (28) for v16, "Six months on, it was hacked." (29) for v17 (ask the sell reviewer whether "that inbox" must stay), and break v11 after "shortcut," on the close card. The close card never shows the VO caption (ca_close), so v11 only needs the break on the card plate.

### m3. Close tagline is 38 characters

"Take the shortcut · See where it leads" is 38 characters. Against the 28-character card limit it is over on a single line (16:9). The two halves are 17 and 18 characters, so the stacked layout the theme already uses for narrow aspects is within the limit. Fix: stack it in 16:9 too, split at the dot. Every other card string is within 28: "Shadow IT" and "Tarrowby Logistics" (18), "Take the shortcut" (17), "You sort the shortcuts" (22), "Learn on Hacktivity.co.uk" (25), and every chip (longest: THE TRAINING ROOM, 17; THE SHORTCUT · RED TEAM, 23).

### m4. Three line ends sit inside a seam

v1c ends 0.11 s before the red card; the hook line ends 0.1 s before the open card (M2); the ask ends 0.14 s before the close (M5). The skill's joins run 6 to 8 frames into and out of every card. Fix: a rule in the edit notes that no VO or character line ends within 0.3 s of a card boundary; v1c can move to 0.1 s lead and tail (clip 2.688, window 3.0 leaves 0.21 s).

### m5. Beat grid: the plan is on a 0.1 s grid, the music is on 0.632 s beats

At 95 BPM a beat is 0.6316 s. The edit's `snap` will move a cut by up to 0.32 s. The cuts that are already close: 15.1 (beat 24, 15.16), 18.9 (beat 30, 18.95), 43.6 (beat 69, 43.58). The two music events do land on beats: the drop at 17.684 s is beat 28 and the lift at 22.736 s is beat 36. The drop falls 2.6 s into pick_email, not on a cut; the script notes this and moves look_up onto 22.74 s for the lift but not the drop. Fix: say whether the drop is meant to land on the pick click (7.6 s in the take's trim, c1_pick) and place the pick there, or accept it mid-shot. Tell the build to snap each tight shot (1, 11, 16) outward, never inward.

### m6. Beat 3's "Everyday choices" panel is on screen for about 1 s in the r2 take

From frames of t03 (trimmed 1.5, 2.5, 3.5, 4.5, 5.4 s): the Tarrowby brief is up to about 3.0 s, the light "Everyday choices" panel at about 3.2 to 4.2 s, and the dark choice card from about 4.4 s. A 3.0 s topic hold on the Everyday choices panel needs a take with a longer hold on it; r4's window (3.1 to 8.15) was card 1. Fix: either re-record the panel with a 3.5 s hold (t03's setup is cheap) or define beat 3 as the first 0.8 s of the Everyday panel plus card 1 unpicked, as r4 did. The script gives no in or out for any r2 take, so the edit has to guess; list them (t03 pick at 8.19, reveal 22.91, continue 36.43, t06 list 2.77, row 6.77).

### m7. v1 and v11 never show a burned caption

`ca_open` and `ca_close` suppress the VO caption. The open card shows "Shadow IT / Tarrowby Logistics" and the CYBER AWARE tab, not "Security awareness training you can play", so a silent viewer never gets the course description. This is the house pattern for every episode and is not new here. Fix: none needed unless the owner wants the sentence on the open card; note it in the silent-read column of the rubric.

### m8. Fatima's beat at scale 3 in 9:16 (beat 16, and beats 1 and 11)

`2 / 1.6875 / 2` is scale 3 in 9:16: 360 px of source across, about 11 tiles. Fatima, the stick, the "!" cue and her ask bubble (wrapped, about 200 px) must share that window with the learner, who has to be visible for the cue to fire. For beat 11, kettle to desk is 8 tiles, so only the arrival fits (M4). Fix: check on the crop sheet per aspect, and drop beat 16 to `2 / 1.125 / 2` (scale 2, 17 tiles) if the learner is not in frame at 3.

## Integer scale, shot by shot

Scale = max(outW/srcW, outH/srcH) × zoom: 16:9 and 1:1 scale = zoom; 9:16 scale = 1.778 × zoom.

| # | planned zoom (16:9 / 9:16 / 1:1) | scales | allowed? | verdict |
|---|---|---|---|---|
| 1 hook | 2 / 1.6875 / 2 | 2 / 3 / 2 | yes | ok; 360 px window in 9:16 (m8) |
| 3 topic | 2 / 1.125 / 2 | 2 / 2 / 2 | yes | wrong framing: panel 745 px wide (B1) |
| 5 pick_email | 2 / 1.125 / 2 | 2 / 2 / 2 | yes | wrong framing: card 720 px wide (B1) |
| 6 led_email | 2 / 1.125 / 2 | 2 / 2 / 2 | yes | 16:9 ok as a punch-in; 9:16 and 1:1 clip the 700 px text (B1) |
| 7 look_up | 2 / 1.125 / 2 | 2 / 2 / 2 | yes | panel not recorded; assume the same width (B1) |
| 8 nilesh_give | 1 / 1.125 / 1 | 1 / 2 / 1 | yes | chat at the lower usable scale in 16:9 and 1:1; in 9:16 scale 2 (a 540 px window on the bust and bar) is the lowest that fills the frame, so ok if the crop sheet shows the bust whole |
| 9 walk | 2 / 1.125 / 2 | 2 / 2 / 2 | yes | world; 17 tiles across in 9:16 and 1:1: learner, door, Nilesh (8.4, 3.2) and kettle (14, 6) must fit in 540 px: check |
| 10 drop | 2 / 1.125 / 2 | 2 / 2 / 2 | yes | the inventory menu is a panel: use the inset lane if it is under 540 px, else 1× |
| 11 find_use | 2 / 1.6875 / 2 | 2 / 3 / 2 | yes | arrival only (M4) |
| 12 corner | 2 / 1.125 / 2 | 2 / 2 / 2 | yes | ok |
| 13 flip | 2 / 1.125 / 2 | 2 / 2 / 2 | yes | the runner panel again (B1) |
| 15 inbox | 2 / 1.125 / 2 (fallback 1 / 0.5625 / 1) | 2 / 2 / 2 | yes | panel 960 by 900: use the fallback as the plan (B1) |
| 16 fatima | 2 / 1.6875 / 2 | 2 / 3 / 2 | yes | m8 |

No planned zoom is a non-integer scale, so `lint-edit` will not warn on any of them. The r2/r4 values the script calls "reframe" (1.4, 1.8, 1.2, 1.1) are all dropped, correctly.

## Silent viewing

Without sound the trailer reads in order: a woman picks up a stick (burned caption), "Shadow IT" card, a choices panel, a red "Take the shortcut" card, the pick and its consequence (captions: "It goes to a personal inbox" and "Six months on, it was hacked."), "Then try the attacker's side.", Nilesh hands over a stick (caption), the office goes on (caption), the stick by the kettle, Joanne plugs it in (caption), a second run where nobody bites (caption needed), "Then swap seats.", a blue "You sort the shortcuts" card, the inbox, a colleague asks (caption), the close. The cards and captions carry the story. Gaps:

- No attacker label for 21 s (M7).
- Beat 12 has nothing but the toast (m1).
- Every panel is a texture in 9:16 and 1:1 (B1), so the captions are doing all the work on 31% of the runtime. That is acceptable only if each of those beats has a VO caption on screen: beats 3 (v1c), 5 (v16), 6 (v17), 7 (v18) and 15 (v9) do; beat 13 (v14) does.
- Burned dialogue captions: Joanne's lines are 48 and 41 characters, Nilesh's 70, Fatima's 56. With no line-break override in the dialogue caption, give each a manual break with no-break spaces so the last line is not a single word (the r3 pattern in `takes_ca15.md`).
- Readability at 9:16: VO captions are 56 px VT323 on a plate, readable at up to about 40 characters a line. The panel text and the game toast (about 12 px at scale 1) are not; do not rely on either.

## Length, hook and close

- Total 70.8 s; the 17 rows are contiguous and the stated sum is right. About 70 s: met. M2, M5 and M6 add about 1.6 s if taken from nowhere; the budget above takes them from cards and spare VO time, so the total stays under 71.5 s.
- Hook at 0 to 3.6 s (M2). Close at 64.5 to 70.8 s, 6.3 s, 8.9% of the runtime: v11 5.76 s fits with 0.19 s spare. The ca-close spec holds the last frame for 0.5 s; the 6.3 s covers that only if the narrator ends by 6.1 s.
- Beat lengths against shots available: beats 2, 4, 14, 17 are cards (any length). Beats 3, 5, 6 and 15 have r2 footage longer than needed. Beat 16 has the r2 ask at 3.98 s in a 6.3 s slot (M5). Beats 7, 8, 9, 10, 11, 12 and 13 have no take yet (M1).

## Music

PeaceFolk "Guitar Motif" (`public/break_escape/assets/music/PeaceFolk/Guitar Motif.mp3`) is 174.384 s. The window 37.442 s to 108.242 s (70.8 s) leaves 66 s of track after it, enough for the fade-out (ca19 uses 2.5 s). The window ends on a bar line: (108.242 - 37.442) / 2.526 = 28.03 bars. `ffmpeg silencedetect` on the window (-45 dB, 0.3 s) finds no gap; mean level -16.3 dB, peak -4.4 dB. The script's bar grid and the two event times check out (drop at beat 28, lift at beat 36 of the window). There is no `guitar_motif_37.json` analysis in `tools/video/edits/music/` (only `guitar_motif_75.json`); the build needs one for the beat offset. The script's own note about not sharing bars with ca12's pick still stands for AC0.

## Character lines against narrator

No narrator line overlaps a cast line by more than 0.3 s on the plan as written. Beats 1, 8, 11 and 12 carry no VO. The two places to watch are v10 over Fatima's "Hang on..." bark (M5) and v14, which starts at 0.2 s into beat 13, after Nilesh's bark ends (provided the bark finishes inside beat 12; the take must end the shot at `bark_end` + 0.3 s).

## Checked and clear

- Table arithmetic and contiguity (70.8 s).
- Word-per-second ceiling on every narrator line (highest v10, 2.11).
- Cached clip lengths against windows for v1, v1c, v9, v10, v11 (v1c is 0.04 s over by the fit rule; see m4).
- Chip and card text lengths against 28 characters (except the close tagline on one line, m3).
- Music track length, window, bar-line end and silence.
- Every planned zoom is an allowed whole-number scale in its aspect.
- NPC chat (beat 8) at the lower scale in 16:9 and 1:1.
