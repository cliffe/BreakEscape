# ca11 trailer script: silent read and timing review, round 2

Script: `docs/video/scripts/ca11_trailer_script.md` at 52caf98eb (71.7 s, consequence-first). Checked against `docs/video/takes_ca11.md`, `docs/video/CA_MOVEMENT_B4.md`, `docs/video/recipes/course-trailer.md`, and the Sulafat clips in `~/video-takes-local/ca11/vo/Sulafat_v2/trim/` (ffprobe, trimmed lengths). Reviewer: Sonnet (timing). 25 Nov 2026. Review only, the script is not edited.

**Totals: 0 B, 2 M, 5 m.**

Measured pace of the narrator on this episode: 7 to 9 word plain lines run 2.9 to 3.3 s trimmed (2.2 to 2.4 words/s), lines with a stop run about 2.1 words/s. Nothing is near the 3.0 words/s ceiling.

## Findings

| # | Sev | Line or shot | Issue | Fix |
|---|---|---|---|---|
| 1 | M | `open` (2.9 to 8.0, 5.1 s), **v1** | The v1 text in the script is the new tagline ("Security awareness training you can play."), but the local ca11 clips are still the old tagline: `Sulafat_v2/trim/v1.mp3` is 4.704 s and says "Cyber Security training you play". The re-voiced v1 (commit 02f8704ad) is `ca12/vo/Sulafat_v2/trim/v1.mp3`, 5.112 s (0.08 s preroll in it). The script's "v1 real 4.70 s, 5.05 in 5.1" is the old figure. New need: 5.112 + 0.15 = 5.26 s placed at card start (or 5.37 s at +0.2), against 5.1. v1 would end at about 8.03 s, spill into `topic`, and sit 0.17 s from v1b. Every other episode got its open card lengthened 5.1 to 5.4 in that commit; ca11 did not. | Open card 5.1 s to 5.4 s, v1 at card start plus 0.02 s (as ca07). Take the 0.3 s from `led_caller` (5.0 to 4.7 s, v5b needs 2.65 s, 2.0 s of spare). Total stays 71.7 s, later cue times shift by 0.3 s. Copy the ca12 v2 trim of v1 into `ca11/vo/Sulafat_v2/trim/`. Rewrite the narrator-fit line for v1. |
| 2 | M | `topic`, `pick_caller`, `pick_export`, `led_*`, `panel` against the take holds | The take script's holds are shorter than the shots built from them. `topic` needs card 1 unpicked for 6.9 s, `t03` holds 3 s. `pick_caller` needs the pick showing for 3.8 s, `t03` holds 3.2 s after the pick. `pick_export` needs 4.1 s on card 3 with its pick, `t03` holds 1 s then picks then 2.5 s. `led_page` + `led_caller` + `led_export` are 13.75 s from one page, `t03` holds the montage 13.5 s. `panel` needs 3.9 s, `t07b` holds about 3.3 s. `flip` needs 3.0 s and the take gives exactly 3.0 s with the strip tick at the click. None of these takes is recorded yet (the marks table is empty), so the numbers are script parameters, not measurements. A freeze would hide the pick highlight (the unpicked frames pre-date it). | Change the take holds before recording: card 1 unpicked 7.2 s; after pick 4.0 s; card 3 unpicked 0.5 s, pick, 4.3 s; montage 14.2 s; Continue then 3.4 s; t07b 4.2 s. Also add to takes_ca11 that the windows are marks-based, so the recorded marks, not these numbers, decide the cut. |
| 3 | m | `pick_caller`, new **v3** "A 'sister' asks where Bernadette cleans today." | Same seven words and the same syllable count as the voiced "A caller asks where Bernadette cleans today." (3.216 s trimmed, 3.768 s raw). Estimated 3.2 to 3.4 s trimmed (a quoted word can be read with a small lift, up to +0.2 s). Need 0.2 + 3.4 + 0.15 = 3.75 in 3.8: fits, spare 0.05 to 0.25. Caption "A 'sister' asks where / Bernadette cleans today." (22 / 26 characters) reads in under 3 s. | Fits, but it is the tightest new line. If the voiced clip is over 3.45 s trimmed, move 0.2 s from `led_caller` to `pick_caller` (4.0 s). Re-voice needed. |
| 4 | m | `led_export`, **v5c** | Voiced 4.176 s, slot 4.55 s: 4.176 + 0.35 = 4.53, spare 0.02 s. Fine as built (the shot was retimed after voicing), but there is no margin for a drift in the edit. | None needed. If the edit re-times by a frame, give this shot the 0.1 s from `led_caller`. |
| 5 | m | Rhythm, 8.0 to 58.3 s | From `topic` to `panel` (50 s) every shot is a console panel, with no room, no walking and no staff on screen. The only moving office footage is the `office` shot at 58.3 s, so a silent viewer meets the "office that notices" 58 s in. `CA_MOVEMENT_B4.md` offers `t08_yusuf_cooler` (about 166 px, not yet dry-run); default 10 says no insert. ca16 uses the same insert as a 1.6 s cutaway under `topic`. | Optional. Use `t08_yusuf_cooler` as a 1.5 s cutaway at the head of `topic` (card 1 unpicked then has 5.4 s, v1b/v1c need 6.36 s from the start of the shot, so push v1b 0.2 s after the join). Only after the take passes the 120 px check. |
| 6 | m | `office` cut | The out point (bark start + 5.86 + 0.2 = 6.06 s) sits inside bark 1's file, 0.64 s before sentence 3 (6.70 s), in the gap. That is clear of every word, but the audio ends 0.2 s after "...on it" with the file still running, so the join needs a 0.1 s fade or the bubble-hidden room tone will click. The hook cut (audio start + 2.61 s, 0.37 s before sentence 2 at 2.98 s) is the same shape. | Add a 0.1 s audio fade on both cast clips at the out point. No change to the times. |
| 7 | m | Header status | The script says "not voiced", but 14 of the 15 ca11 clips exist (voiced 23 Nov) and `v3` and `v1` are the two that no longer match. | Status line: "voiced 23 Nov except v1 (new tagline, copy from ca12) and v3 (re-voice)". |

## Per-line fit (trimmed clip lengths from ffprobe; need = clip + 0.2 lead + 0.15 tail, plus 0.25 between cues in a shared shot)

| Line | Words | Trimmed s | Shot s | Need s | Spare s |
|---|---|---|---|---|---|
| v1 (new, ca12 trim) | 9 | 5.112 | 5.1 | 5.26 | -0.16 (M1) |
| v1b + v1c | 8 + 4 | 3.264 + 2.496 | 6.9 | 6.36 | +0.54 |
| v2 | 4 | 2.520 | 3.0 | 2.87 | +0.13 |
| v3 (new, estimate) | 7 | 3.2 to 3.4 | 3.8 | 3.55 to 3.75 | +0.05 to +0.25 |
| v4 | 8 | 2.952 | 4.1 | 3.30 | +0.80 |
| v5 | 6 | 1.824 | 4.2 | 2.17 | +2.03 |
| v5b | 7 | 2.304 | 5.0 | 2.65 | +2.35 |
| v5c | 9 | 4.176 | 4.55 | 4.53 | +0.02 |
| v6 | 5 | 1.584 | 3.0 | 1.93 | +1.07 |
| v7 | 4 | 1.752 | 2.4 | 2.10 | +0.30 |
| v8 | 6 | 2.352 | 4.4 (list hold) | 2.55 | +1.85 |
| v10 | 5 | 1.728 | 9.45 (card from 4.4 s) | ends 6.53 | clear |
| v9 | 7 | 2.544 | 3.9 | 2.89 | +1.01 |
| v11 | 9 | 4.488 | 5.5 | 4.84 | +0.66 |

Words per second: 1.8 to 2.4 on every line, none near 3.0. No VO over a cast line: v9 ends at 57.1 s, the bark is in the next shot (the bark starts about 1.8 s into `office`). The hook and `office` carry none.

## Take windows and hazards

- Hook (`t01`): in = audio start minus 0.3 s, out = audio start plus 2.61 s. The take closes the chat 2.73 s after audio start, so the cut is 0.12 s before the close; sentence 2 starts 2.98 s. Clear. Thirst trip at about 30 s: the take walks at once. Bar cropped, caption burned.
- `office` (`t07`): marks press 3.33 s, printout 3.39 s, bark 5.78 s; in = 3.98 s (press + 0.65), out = 11.84 s, take holds to bark + 7 s = 12.78 s. Inside the window. Bark 2 blocked (`bark2-blocked`); the fallback (end at 4.9 s, sentence 1 only) is written down. The printout is already on the tray at in: correct, nothing claims it appears.
- `inbox` (`t06`): list 4.4 s and card 5.2 s against 4.4 s and 5.05 s. Fits. The 08:52 row preview is blanked and the cursor stays off it.
- Hazards from the takes doc all honoured in the script: no verb button shown, the Defend intro body out of frame, the overtime card never shown, Tomasz and the debrief absent.
- Not yet verified by any run: real-fps capture of `t01`, `t03` and the walking shots, and `check-take.mjs`.

## Silent read

- Captions carry the whole story: hook caption, the v1b to v11 captions (all burned, line breaks given), the red and blue cards, and the two timed cast captions in `office`. The chain "four calls, where they led, take the other seat, sort the inbox, then the office" reads with the sound off.
- Caption lengths are within 30 characters a line; the fastest is v5c (29 characters on its longer line, 4.2 s).
- The two ambiguous frames are `panel` (the Look up panel, headed "Before the debrief" by the game, relabelled by the edit's tab chip "THE TRAINING ROOM") and the opened 11:15 card with "Whose job is this one?": the caption poses the question and the card is ordinary, which suits a silent viewer.
- `led_caller` is a 5.0 s punch-in with a 2.3 s caption, so the second half is a held frame: fine for reading the sentence on screen, but see finding 1 (shorten to 4.7 s).

## Length

71.7 s as written; 71.7 s after the fixes above (the 0.3 s moved from `led_caller` to the open card). Hook 2.9 s (limit 5.0), close 5.5 s. About 70 s: met.

## Re-voice

- v3 "A 'sister' asks where Bernadette cleans today.": about 3.3 s trimmed (range 3.2 to 3.4), fits the 3.8 s shot.
- v1: no re-voice, copy the existing re-voiced clip from ca12.
