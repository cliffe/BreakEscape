# ca17 trailer script: silent read and timing review, round 2 (25 Nov)

Reviewer: Sonnet (silent read and timing). Scope: `ca17_trailer_script.md` as of commit 86377d08e, `takes_ca17.md`, `CA_MOVEMENT_B4.md`, `recipes/course-trailer.md`. Review only; the script is not edited.

Result: **0 B, 2 M, 6 m.** Total 71.7 s holds (the table sums and the row times agree). Nothing has to go; one optional trim is named at the end.

How the fit was measured: `ffprobe` on the trimmed levelled clips in `~/video-takes-local/ca17/vo/Sulafat_v2/trim/` (audible lengths, the edit's own files), `silencedetect -45 dB` on the cached Fatima barks in `tts_cache/ca17_acceptable_use_defend/`. Four of the five changed lines have no clip yet, so their lengths are estimates from the nearest voiced lines (stated per line). Fit rule: 0.2 s lead + audible + 0.15 s tail, 0.25 s between cues.

## Narrator fit, measured and estimated

| line | text | audible s | need s | slot s | spare s |
|---|---|---|---|---|---|
| v1 | Hacktivity Cyber Aware: Security awareness training you can play. | 5.02 (new text, ca12's clip; 5.11 levelled) | 5.02 placed at card start (the clip carries its own 0.08 s preroll) | 5.1 | 0.08 |
| v1b | A working day at a haulage firm. | 2.14 measured | 2.49 | 8.0 | 5.5 |
| v1c | This episode: acceptable use. | 2.81 measured | 3.16 | 3.4 | 0.24 |
| v2 (new) | Then you make the calls. | about 1.9 est (old v2, 5 words with a stop, 2.42; v10 "Make the calls," runs short) | 2.25 | 3.0 | 0.75 |
| v3, v4, v5 | borrowed badge / football / login | 1.46, 1.58, 1.13 measured | at most 1.93 | 3.0 | at least 1.07 |
| v6 | A complaint into a free chatbot. | 2.59 measured | 2.94 | 3.6 | 0.66 |
| v6b | A laptop on holiday abroad. | 2.33 measured | 2.68 | 3.0 | 0.32 |
| v7 + v7b (new) | Then six emails to handle. / Some want a rule bent. | about 2.0 est (old v7 6 words, 2.50) + about 1.6 est (old v7b 5 words, 1.61) | 0.2 + 2.0 + 0.25 + 1.6 + 0.15 = 4.2 | 5.5 | 1.3 |
| v8 | What would you do with this one? | 1.66 measured | 2.01 | 5.5 | 3.5 |
| v9 (new) | Out in the depot, the day goes on. | about 2.4 est (old v9 "...Chidi's back." 2.11, one syllable more) | 2.75 | see M1 | see M1 |
| v10 | Make the calls, learn where the line sits. | 2.88 measured | 3.23 | 5.5 | 2.27 (see M2) |

The script's own estimates run well over the real reads: its v7+v7b spare is 0.56 s (real about 1.3 s), its v9 is "about 3.2 real" (est 2.4), its v10 is "about 4.3 real" (measured 2.88). The M findings come from that.

## Findings

### M1. room_end: the in-point formula and the 5.8 s slot disagree once v9 is measured (shot `room_end`, v9 note)

The script sets in = F minus (0.2 + v9 length + 0.2), "about minus 3.6 s on a real read", and the slot at 5.8 s. That minus 3.6 s assumes v9 is 3.2 s. A trimmed v9 of "Out in the depot, the day goes on." is about 2.4 s (the old, shorter v9 trimmed to 2.11 s; the 2.69 s figure is the raw clip with silence). With the formula as written the in-point is F minus 2.8 s, and the shot is 2.8 + her speech end + 0.2:

| Fatima's first draw (cached clip, speech end) | out = F + | shot at in = F - 2.8 | shot at in = F - 3.6 |
|---|---|---|---|
| "Need some water." (1.58 s, speech ends 1.23) | 1.43 | 4.2 s | 5.0 s |
| "Depot's heaving today." (1.90 s, ends 1.48) | 1.68 | 4.5 s | 5.3 s |
| "Who's on the Shipley run?" (1.94 s, ends 1.58) | 1.78 | 4.6 s | 5.4 s |
| "CVs stacking up again." (2.33 s, ends 2.05) | 2.25 | 5.1 s | 5.9 s |
| "Another pallet backlog." (2.45 s, ends 2.11) | 2.31 | 5.1 s | 5.9 s |

At the formula's in-point the shot is 0.7 to 1.6 s short of the 5.8 s slot, and the only filler is a frozen last frame of a living scene. The "6.0 s / 71.9 s" branch is also moot: v9 cannot run to 3.8 s. No cut lands inside a bark in any row (each out is inside the cached clip's tail).

Fix: fix the in-point at F minus 3.6 s (not the formula), place v9 at in + 0.2 s so it ends about F minus 1.0 s (0.8 s clear of Fatima, rule 0.2 s), and say the shot is 5.0 to 5.9 s depending on the draw. Any draw but "Need some water." fits the 5.8 s slot to within 0.5 s. If "Need some water." is kept for the machine fit, the shot is 5.0 s and needs 0.8 s of hold or the in-point at F minus 4.4 s. Reword the v9 fit bullet (real read about 2.4 s, shot 5.0 to 5.9 s), and the status-line "71.9 s if the voiced v9 runs to its estimate" goes. The 1.84 s clip for "Depot's heaving today." in two places is 1.90 s in the cache (the dry run's clip was a different file, `debd4196`); immaterial to the cut.

### M2. close: the full call fits; the "does not fit" reasoning rests on an estimate that measurement overturns (shot `close`, v10, owner question 2)

The script shortens the close to the tagline words only because the full form needs "about 5.75 s in 5.5". That figure came from the ca01 close of a different shape. Measured: v10 as written is 2.88 s, not "about 4.3 real". The nearest voiced full close is ca11 v11, "Make the calls, see where they lead, on Hacktivity.co.uk.", which trims to 4.49 s. ca17's full form adds about 0.45 s ("learn where the line sits" against "see where they lead"), so about 4.9 to 5.0 s audible, need about 5.3 to 5.35 s in 5.5 s (0.15 to 0.2 s spare, the same margin as ca18's v11 at 0.18 s). It fits.

Owner rule from ca12 (in the script's own header): "end ... ca-close with the tagline and the Hacktivity.co.uk call (the card text and the spoken close use the same words)". ca17 is the one close that drops the call, and its question 2 records that as a feature. The caption claim is also wrong: the full line is 63 characters (not 66) and breaks in two lines of 31 and 31 ("Make the calls, learn where the" / "line sits, on Hacktivity.co.uk.").

Fix: voice the full line "Make the calls, learn where the line sits, on Hacktivity.co.uk." with the plate "Learn on Hacktivity.co.uk" as the other close cards do, check the real length after voicing, and if it comes out over 5.35 s take 0.3 s from `room` or `bins` and widen the card to 5.8 s. Delete the "only close that does not speak the call" line from owner question 2. If the owner prefers the short tagline-only form, the measured spare (2.3 s) is the number to quote, not 0.85 s.

### m1. v1 fit note is stale (shot `open`, fit list)

The note says v1 is "4.70 s real, 0.2 + 4.70 + 0.15 = 5.05 in 5.1 (place at card start plus 0.2 s)". That was the old line ("Cyber Security training you play."). The new text, re-voiced on 24 Nov, trims to 5.02 s with the 0.08 s preroll inside the file. Placed at +0.2 s it ends at 5.22 s, 0.12 s over the 5.1 s card and 0.08 s from the next cue; placed at the card start it ends 0.08 s inside. Fix: "place at card start, no offset (5.02 s, 0.08 s spare)". Housekeeping, not in the repo: `~/video-takes-local/ca17/vo/Sulafat/v1.mp3` and its trims are still the old-text clip (md5 differs from ca12's); copy ca12's new v1 across before the render or the edit will speak the old words. The caption must break "Hacktivity Cyber Aware: Security" / "awareness training you can play." (32 / 32; any other split exceeds 32).

### m2. Hook and format cut points have no slack (shots `hook`, `format`)

Hook out lands 0.06 s after "because" ends (3.87) and 0.09 s before "Sort" (4.02); format in lands 0.03 s after "because" ends. The gap is only 0.15 s and the cut is a sentence break inside one bark, hidden by the title and blue cards. A mark error of 0.05 s clips a syllable. The takes doc says the `interact` mark logs after the audio starts, so the true start is earlier than the mark, which makes the out safe and the in slightly late-biased, but this is not measured. Fix: set both cuts from `silencedetect` on the recorded take's own audio (gap 3.87 to 4.02 in the clip; use 3.945 for the hook out and 3.93 for the format in), not from the mark plus a constant. The hook also carries 1.08 s of silence between sentence 1 and 2 (1.47 to 2.55) in a 4.1 s cold open; that is Nilesh's pace and the burned captions cover it, so leave it.

### m3. Long stretches with no narrator and no cast voice (shots `room`, `bins`)

Narrator audio ends at about 11.5 s and does not return until v1c at about 17.4 s (5.9 s), and the `room` shot after v1b (2.3 s long) holds the wide with a walk for 5.6 s with `kit_quiet` on. From v2 (ends about 22.7 s) to v3 (about 34.0 s) the narrator is gone for 11.3 s: 6.2 s is Nilesh's line, 4.0 s is the silent `bins` sweep. The brief says narrator VO about the course throughout. Not a break (a silent bin sweep reads), but the room's last 2 s and one second of `bins` carry nothing. Fix, optional: `room` 8.0 s to 6.5 s (the walk reaches the kiosk well before 8.5 s in t02, whose hold fills the rest) and `bins` 4.0 s to 3.0 s (Nilesh has just named the three bins). That saves 2.5 s (69.2 s); or take 1.5 s from `room` only (70.2 s). No fix needed for the length itself (see Total).

### m4. inbox_list holds the key-fake row longer than the takes doc allows (shot `inbox_list`)

The takes doc: the key-fake row ("Join Tuesday's review, install R...", Harlow Freight, row 1) should be "brief on screen". The script holds the whole list 5.5 s with the cursor off it. v7 + v7b need only 4.2 s. Fix: hold the list 4.3 s and give the 1.2 s to `inbox_card` (6.7 s), where the monitoring body needs reading time and the VO has 3.5 s of spare. Total unchanged. Also v7b "Some want a rule bent." lands over that row's visible text: say in the take notes that v7b starts when the cursor has moved off row 1, or accept the pairing as the intended pattern-level hint.

### m5. Other cast audio inside the voiced end window (shot `room_end`)

The take has `kit_quiet` false and `T06_VOICE=1`, so every NPC's chatter can sound. The dry run recorded only Fatima's line in 28 to 34 s, but that was one game. Add to the take notes: discard any room_end take where a second voice (another NPC's world chatter) sounds between in and out, and run `silencedetect` on the take audio for the 0.2 s clear rule. The same check finds whether v9 (placed at in + 0.2 s) sits clear of any bark.

### m6. Words per second (all VO)

Audible rate measured on Sulafat is 2.1 to 3.3 words/s on these lines (v1b 7 words in 2.14 s is 3.3; est v9 3.3; est v7b 3.1). Over the slots every line is well under 3.0. No change; recorded because the recipe asks for 3.0 at most and a reader of the measured audible rate would flag v1b, v7b and v9.

## Checked and clear

- **Windows and hazards.** Hook: in N1 start minus 0.15 s, out plus 3.93 s, inside the 3.87 to 4.02 s gap (see m2). Format: in plus 3.90 s, out plus 10.08 s; sentence 3 runs 4.02 to 9.93, so 0.12 s lead and 0.15 s tail, sentence 4 starts 10.42 (0.34 s after the cut); the game bar is cropped, sentence 4 and the menu never show. `room`: t02 0 to 8.0 s is inside the take (hold 1.5 s, walk, hold to 8.5 s), `kit_quiet` true, no bark. `topic`, `bins`, `card_1` to `card_5`: seed 7673 draws all seven wanted cards; feedback, answers and the counter hidden by CSS; the drill's X never pressed. `inbox_card`: genuine "What we monitor and why" row, verbs hidden. `room_end`: Chidi at the machine from 18.6 s, leaves 38.5 s, Fatima joins 31.4 s, her line 32.1 s in game 12715; window about 28.5 to 34 s is inside that and ends 4.5 s before Chidi leaves.
- **No cut inside an NPC's own bark.** The five Fatima draws each end 0.15 to 0.2 s after speech inside the cached clip (table in M1). Hook and format sentence cuts are the only mid-clip cuts (m2).
- **No narrator over a cast line.** v2 ends about 22.7 s, Nilesh's speech starts 23.7 s (about 1.0 s clear). v9 at in + 0.2 s ends about 1.0 s before Fatima (M1).
- **Caption lengths** (two lines of at most 32, no one-word last line): v2 24, v7 26, v7b 22 on one line each; v9 "Out in the depot, / the day goes on." 18 / 16.
- **Sound off.** The hook is captioned; the title card names the episode; `room` and `topic` show the depot and a card; the blue card says what is being done ("You sort the everyday moments"); Nilesh's caption names the bins and the inbox; the five cards carry their own text; the list counter reads "0 of 6", which supports v7; the end is Fatima's captioned line at the machine. It reads. The VO and the picture agree on every shot.
- **Total.** 4.1 + 5.1 + 8.0 + 3.4 + 3.0 + 6.2 + 4.0 + 3.0 + 3.0 + 3.0 + 3.6 + 3.0 + 5.5 + 5.5 + 5.8 + 5.5 = 71.7 s and the row start and end times agree. After M1 the `room_end` shot is 5.0 to 5.9 s (so 70.9 to 71.8 s); after m3 and m4 the total is 69.2 to 70.2 s.

## What should go

Nothing must. If 70 s is the target, the first 1.5 to 2.5 s to take is the tail of `room` and one second of `bins` (m3). The cards, the inbox and the end carry the sell.

## Voicing list: estimated lengths

| new line | est audible | slot | note |
|---|---|---|---|
| v2 "Then you make the calls." | 1.9 s | 3.0 s | 0.75 s spare |
| v7 "Then six emails to handle." | 2.0 s | 5.5 s (with v7b) | |
| v7b "Some want a rule bent." | 1.6 s | 5.5 s (with v7) | 4.2 s together, 1.3 s spare |
| v9 "Out in the depot, the day goes on." | 2.4 s | 5.0 to 5.9 s shot | place at in + 0.2 s, ends about F minus 1.0 s (M1) |
| v10 (if the full close is adopted, M2) | about 5.0 s | 5.5 s | measure after voicing |

After voicing, re-measure each and drop the estimates from the fit list; v1, v1b, v1c, v3 to v6b and v8 are voiced and measured.
