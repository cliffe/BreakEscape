# Review R3 (silent viewing and timing, delta): ca15 trailer script r5 rev R2 (commit 521f256ad)

Script: `docs/video/scripts/ca15_trailer_script_r5.md`, section 13 dispositions. Delta read: `git diff 88bf08fd0 521f256ad`. Reference: `ca15_trailer_script_r5_review_R2_timing.md`.

Method: grid and gates recomputed in Python. Every cached narrator clip in `~/video-takes-local/ca15/vo/Sulafat_v2/trim/` and `~/video-takes-local/ca16/vo/Sulafat_v2/trim/` measured with ffprobe and silencedetect (-40 dB, 0.1 s), texts read from the `Sulafat/*.json` sidecars. Nilesh's voiced clip and the two Joanne clips measured the same way. Engine behaviour read from `npc-needs.js`, `npc-world-bubbles.js`, `npc-needs-chatter.js`, `flip-view.js`, `awareness-skin.css`. Frames: two `nice -n 19 ffmpeg -threads 1` grabs from `t11_red_drop_run.trimmed.mkv` (37.30, 39.00). No encodes or renders. t19, t17, t16, t11b, t06b and t09c do not exist yet, so they are checked as specs against the engine.

Counts: 0 Blocker, 1 Major, 5 Minor.

## R2 timing findings: applied?

| R2 | Applied | Check |
|---|---|---|
| M1 slow read with stops | Yes, with the orchestrator's calls | Section 3 defines both reads and shows the stops column; v33 10 words, v34 9, v38 9 words; v11b stays 11 with reserve v11c; v31, v32, v35, v37 rewritten after the same check. All gates recompute (below) |
| M2 t11b assert window | Yes | No bubble from `drop_land` - 2.5 to + 2.0; chatter suppressed to `find_bubble` - 0.5; camera settled; path line and ring hidden. See m3 for the mechanism |
| M3 beat 11 | Yes | List only, 9 beats, `row_usb` removed, v38 wording agreed with the sell review |
| m1 | Yes | Stand-in 37.20 to 41.62, 1:1 cx 1100, t19 forces the line (frames: 37.30 clean, bubble up by 39.00, as stated) |
| m2, m3 | Yes | 9b fallback 1:1 cx 940; 9a fallback 16:9 cx 1220 |
| m4 | Yes | Beat 7 in = `c3_pick` - 3.7, card 3 held 4.0 s pre-pick, 3.5 s post |
| m5 | Yes | t19 asserts bubble life at least 3.5 s (code agrees, below) |
| m6 | Yes | Freeze at `line_end` + 0.55 (see m2 here: it does not fire on the real clip) |
| m7 | Yes | Section 3 claims rewritten, t17 hide list present |

## What passes

- **Grid.** b = 60/95. 7+10+11+5+8+10+10+8+6+5+4+9+12+11 = 116 beats = 73.263 s. Recomputed starts: 0, 4.421, 10.737, 17.684, 20.842, 25.895, 32.211, 38.526, 43.579, 47.368, 50.526, 53.053, 58.737, 66.316, end 73.263. Every table time and duration matches to 0.01 s. The drop is b28 = 17.684 s, the cut into the red card. b28 is a cut point, so beats 1 to 3 are untouched. Balance paragraph (3.2, 11.4, 11.4, 6.9, 15.8, 6.9 s) recomputes.
- **Gates.** window - lead - 0.3 recomputed for all ten new lines and v1: 5.82, 6.55, 2.76, 4.55, 5.92, 5.82, 4.55, 3.49, 2.13, 5.28, 6.55. All match the table. Stops reads (words x 0.495 + 0.3 per internal stop) and rate reads (words x 0.57) match, as do "Ends (worst)" and the margins. All ten clear both reads, and still clear at v11's 0.576 s a word (tightest: v36c 3.456 against 3.49).
- **Words.** Narrator total 86 recounts. Every line is well under 3.0 words a second (highest 1.58).
- **Reserves, on the script's own reads.** v36d 5 words 2.85 against 3.49; v38f 2.85 against 5.28; v33s 5.13 against 5.92; v11c about 4.8 against 6.55. All clear. The section 4 variant fallbacks (beat 11 at 8 beats, gate 4.65, v38f 2.85) recompute.
- **Cards and chips.** All card, chip and burned-caption lines counted by script: none over 28 (longest: `YOU TRY IT: AUTHORISED TEST` 27, `tell us rather than building` 28).
- **Zooms and centres.** Every zoom is in its allowed set. Every fraction in section 5 times 1920 or 1080 is a whole pixel (0.5729 = 1100, 0.6354 = 1220, 0.4531 = 870, 0.4896 = 940, 0.6396 = 1228, 0.6448 = 1238, 0.5704 = 616). Crop bounds (740 to 1700, 920 to 1560, 600 to 1140, 400 to 1480) are whole and stay inside the room frame (ends x 1703).
- **Take holds.** t16: beat 5 needs 2.6 s pre and 2.45 post (holds 2.8 / 4.0); beat 6 6.32 inside 7.0; beat 7 3.7 pre and 2.62 post (4.0 / 3.5); beat 8 5.05 inside 6.0. t17: 0.1 + 6.95 inside 8.0. t06b: 0.1 + 5.68 inside 6.2. t09c: window ends `line_start` + 7.38, hold 8.0. t11b: 9a 2.40 s before and 1.39 s after the landing; 9b window 3.16 s against a held bubble.
- **t16 selectors exist.** `.aw-montage-tag` is created in `flip-view.js` :184 (only for a taken beat) and styled at `awareness-skin.css` :227. The rule that colours a taken, unsafe item's left border is :224, `.aw-montage-taken.aw-montage-unsafe, .aw-montage-taken:not(.aw-montage-safe)`, which beats the headline rule at :223, so an inline neutral `border-left-color` is the right override (the headline item keeps its 6 px width, neutral colour).
- **9b bubble life.** Bark path: `npc-world-bubbles.js` `lineTotalMs` = audio length + `AUDIO_TAIL_MS` 800 ms, so 3.144 + 0.8 = 3.94 s when voiced; unvoiced it is `readingMs` = 3 s + 0.3 s a word, at least 5 s (5.4 s here). Both clear the t11b assert (3.4 s). t11's 2.70 s was a replacement by Joanne's PC bark, as the script says; delaying it to `find_bubble` + 3.6 is enough for a 3.11 s window.
- **Hook bubble life (settled).** The kettle line is a chat line, not a bark: `bubbleMs` = min(4000, 2500 + 50 per character) (`npc-needs.js` :110). 32 characters gives 4100, capped to 4.0 s. The life does not depend on the 1.872 s clip at all (the clip is laid in over a muted take). So the bubble lives 4.0 s on the needs clock, 0.5 s over the 3.5 s assert and 0.58 s over the 3.42 s window. t11's measured 3.8 s for 23 characters (code: 3.65) agrees to 0.15 s.
- **Frames.** t11 at 37.30: no bubble, learner, stick at her feet and the pair at the kettle, so the 0.4 s lay-in and "last frame clean" claims hold. At 39.00: "Printer's jammed again." up, as stated.

## The settled question: does the measured rate include pauses?

**Yes.** v1 and v11 contain their pauses. Silencedetect gives v1 0.61 s of silence of at least 0.1 s inside its 5.112 s (colon pause 0.53) and v11 0.73 s inside 5.760 s (comma 0.45, full stop 0.29, 0.10 before ".co.uk"). Their 0.568 and 0.576 s a word are all-in rates. Adding 0.3 s a stop on top of the rate read would count each pause twice, so the script's choice (no stop allowance on the rate read) is right for lines with the same stop density as v1 and v11: one stop in 9 to 11 words (v30, v33, v34, v38) or two in 11 (v11b). That covers every line that carries a stop.

Two findings from the same data:

1. **The stops read is not a safe bound on colon and URL lines.** It under-predicts every cached clip that has a colon or the URL: v1 predicts 4.76 against 5.112 measured (-0.36), v11 5.55 against 5.760 (-0.21), v1c "This episode: Shadow IT." 2.28 against 2.688 (-0.41), v8 "Sort the inbox: ..." 4.26 against 4.512 (-0.25). It over-predicts the plain multi-sentence clips (v5b 5.75 against 4.272, v9 6.05 against 4.824). Only the rate read protects v30 (it has the colon), which is why the table takes the larger of the two. Keep that rule, and say in section 3 that the stops read alone must not be used for a line with a colon or the URL.
2. **The rate read is a heavy overestimate for short plain lines.** Per word, the cached plain clips run 0.33 to 0.43 s (ca15 v3 0.381, v4 0.360, v12 0.328; ca16 v3 0.428, v4 0.363, v12 0.375). The 0.57 comes from the two slowest, longest-word clips (Hacktivity, a colon, the URL). Per syllable (my count, rough) the all-in rate across all 30 clips is 0.24 to 0.39 s, with the plain multi-sentence ones at 0.25 to 0.35.

### Recompute on that basis

"Analogue" is the closest cached clip by shape; "worst case" is 0.347 s a syllable, the slowest all-in multi-word clip (ca15 v8), with no extra pause. Syllables by hand-corrected count.

| id | Syl | Gate | Script worst (slack) | Closest cached analogue | Worst case | Verdict |
|---|---|---|---|---|---|---|
| v30 | 17 | 6.55 | 6.27 (0.28) | v1c, same "Shadow IT:" shape, 0.336 s a syllable: 5.7 s | 5.90 | pass, 0.65 to 0.85 slack |
| v33 | 16 | 5.92 | 5.70 (0.22) | ca15 v5b, "The personal inbox was hacked. The client got a fake invoice.", 16 syl, one full stop: 4.272 s | 5.55 | pass, 0.37 to 1.6 slack |
| v38 | 10 | 5.28 | 5.13 (0.15) | ca16 v4 and ca15 v4, 0.25 s a syllable: about 2.6 s; with a stop 3.0 | 3.47 | pass, 1.8 slack |
| v11b | 20 | 6.55 | 6.33 (0.22) | v11 itself, 5.760 s, plus "here" (one syllable, about 0.3 s): 6.06 s. Its call to action alone is 2.96 s | 6.94 if 0.347 is applied to the URL tail, which v11 contradicts | pass on the v11 anchor, 0.49 slack; the least independent evidence of the five, keep v11c ready |
| v36c | 8 | 3.49 | 3.42 (0.07) | ca15 v4 (7 syl) 1.80 s, ca16 v4 (10 syl) 2.54 s, ca15 v10 "Then a colleague asks." 1.68 s: 2.0 to 2.7 s | 2.78 | pass, 0.7 to 1.4 slack |
| v34 | 16 | 5.82 | 5.13 (0.69) | v5b again, 4.3 to 4.9 s | 5.55 | pass, 0.27 |
| v32 | 12 | 4.55 | 3.99 | ca16 v12, "The client list sat in a personal inbox.", 12 syl: 3.000 s | 4.16 | pass |
| v35 | 11 | 4.55 | 3.99 | about 3.0 s | 3.8 | pass |
| v31, v37 | 5, 4 | 2.76, 2.13 | 2.28, 1.71 | ca15 v4 1.80 s; ca16 v6 "Now it's your turn." 1.152 s | 1.74, 1.39 | pass |
| reserves v36d, v33s, v38f, v11c | | 3.49, 5.92, 5.28, 6.55 | 2.85, 5.13, 2.85, about 4.8 | 2.2 to 2.7, about 4.5, 2.0 to 2.5, 4.4 to 4.8 | | all pass |

So none of v30, v33, v38, v11b or v36c fails on the measured basis, and no wording or reserve swap is needed. The thin slacks in the script (0.07 for v36c, 0.15 for v38) come from applying a long-line rate to short plain lines, not from a real risk. The voicing step still measures every clip against its gate, and the reserves stay.

## Major

### M1. t19 cannot both keep the learner out of the crop and produce Joanne's text bubble

Section 6 requires the learner "out of the crop" and asserts the bubble text equals erb :1583. In the engine a chat turn draws a text line only when the player is heard or faint (`npc-needs.js` :4663 to :4690):

- Within `OVERHEAR_RADIUS` (160 px) of the speaker: a heard line, full-alpha bubble.
- Beyond 160 px but within 3 x 160 = 480 px (`faintVolume`, `npc-needs-chatter.js` :235 and `_curve`): a faint line, bubble at `FAINT_ALPHA` 0.6, and only if the NPC has a voice, sound is on and "Background voices" is on.
- Beyond 480 px, or with sound off: a picture chat (an icon in a bubble), no text.

At 2 / 1.6875 / 2 the crop is 960 px wide (640 in 9:16), centred on the pair, so "out of the crop" means about 480 px or more from them: exactly at the point where the line turns into a picture. The t11 stand-in is a faint line (learner about 230 px from the pair), which is why it looked acceptable. The assert would fail the take; the first 4.4 s of the trailer then depend on a lucky position and a dimmed bubble.

Fix: hide the player sprite for t19 (`setVisible(false)` or alpha 0 on the player sprite) and stand the learner within 160 px of Joanne, so the line is heard and the bubble is full-alpha. Assert `talking.faint` is false and, as now, that the bubble text matches. The alternative (accept a faint 0.6 alpha bubble with the learner 160 to 480 px away, off crop) works but dims the hook line, which is the one thing a silent viewer must read; take a frame at `share_bubble` + 0.5 and check legibility if so.

## Minor

### m1. Section 3 should state which read governs

Add three sentences. The measured rate includes its pauses (v1 0.61 s, v11 0.73 s of silence inside), so no stop allowance goes on the rate read. The stops read under-predicts any line with a colon or the URL (v1, v1c, v8, v11 by 0.2 to 0.4 s), so for v30 and v11b the rate read governs. The rate read overstates plain lines of 3 to 8 words by 30 to 45 percent (cached plain clips run 0.33 to 0.43 s a word), so for v31, v32, v35, v36c, v37 and v38 judge against the analogues in the table above, and treat the script's slack figures as a floor.

### m2. Beat 9a and v36c: set the lead from the landing, not at 0.0

With a likely length of 2.0 to 2.7 s, "found" ends at 2.0 to 2.7 s into the shot at lead 0.0, against a landing 2.40 s in; the script's "found falls 2.0 to 2.9 s in" and its 3.42 s worst case cannot both be right. Lead is free up to about 0.7 s (gate 3.49 at 0.0, so a 2.7 s clip has 0.79 spare). After voicing, place v36c so "found" starts 0.1 s before `drop_land` (2.30 s in); the lead is then 2.30 minus the measured onset of "found", in the range 0.1 to 0.5 s. Record it in the edit list. This also removes the "thin at lead 0.0" entry from the section 3 table.

### m3. Beat 12: the measured Nilesh clip is longer than the script expects, and the freeze does not fire

The voiced line (`tts_cache/ca15_shadow_it/f64426aacb79ea3a3f5a4e43833cd38c.mp3`) is 7.368 s, speech from 0.176 s to 6.943 s (silences 0.18, 0.39, 0.18, 0.11 inside), so 6.77 s of speech, or about 0.356 s a word for 19 words. Section 4 expects 6.4 to 6.7 s for L. If `line_start` is the voice start, L is 6.77 to 6.94 s, which clears the 7.08 s limit by 0.14 to 0.31 s and not by the 0.4 to 0.7 the text implies. Consequences: `line_end` + 0.55 is past the window (7.38), so out is `line_start` + 7.38, 0.44 s after the last word, 0.28 s before Nilesh's next line; no freeze frame is needed and the "line_end + 0.55 mid-blink" check is moot. In = `line_start` - 0.2 keeps 0.44 s to the cut; keep it, and do not move it later. Update the expected L to the measured 6.8 to 6.9 s and say so; the "over 7.08" reserve path (beat 11 to 8 beats, v38f) is still not triggered.

### m4. t19 bag priming and t11b chatter suppression need their mechanisms

(a) `_bagNext` resets any bag whose `sig` differs from `lines.join('\n')` (`npc-needs.js` :2933 to :2937, and `_bagOrderLeft` :2970). Priming `_bags` with `order: [2]` and no `sig` is ignored silently and the line then comes from the seeded shuffle. Say: set `{ sig: <the resolved pool's lines joined with "\n">, order: [2], round: 1, last: -1 }` for key `ca15_joanne_pell|ca15_kettle`, taking the pool lines from the live `chatterPool`; and note `_bagPeek` passes over an echo of a line said lately within 320 px. (b) For t11b "kettle-pair chatter suppressed", set `chattiness` 0 on both NPCs (`npc-needs.js` :4660, `tries` false, so no bark and no picture bubble) until `find_bubble` - 0.5; `chatter: false` still allows picture bubbles, which the "no bubble element" assert would catch. Joanne's 9b line is an event bark (`npc_picked_up`), not chatter, so it is unaffected.

### m5. Narrator voicing: fix the order of checks in section 11

Section 11 and the "After voicing" paragraph say to measure each clip against its gate. Add the order: measure the clip, compare with the gate, and only then pick between a line and its reserve. If v11b measures over 6.35 s, take v11c rather than trimming, as written; if v30 measures over 6.55 s, lead 0.0 lifts the gate to 6.65 (already noted). No other change.

## Open points for the integrator

- Owner questions need no timing change. Q7 (9b fallback) and Q9 (chip) are untouched by this round.
- The stand-in renders use faint-line bubbles (learner about 230 px away). If M1 is fixed on t19, the review render of beat 1 will show a brighter bubble than the stand-in, which is expected.

## Fix list

| Item | Change |
|---|---|
| M1 | t19: hide the player sprite, learner within 160 px of Joanne, assert the line is heard (not faint) |
| m1 | Section 3: pauses are inside the rate; stops read not a bound for colon and URL lines; rate read overstates short plain lines; keep the table slacks as a floor |
| m2 | v36c: lead from the landing (found 0.1 s before `drop_land`), 0.1 to 0.5 s |
| m3 | Beat 12: measured clip 7.368 s, speech 0.176 to 6.943; expected L 6.8 to 6.9; freeze does not fire; in stays `line_start` - 0.2 |
| m4 | t19 bag prime with `sig`; t11b chatter off by `chattiness` 0 |
| m5 | Voicing step order of checks |
