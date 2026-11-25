# ca16 trailer script: silent read and timing review, round 2

Script: `docs/video/scripts/ca16_trailer_script.md` at 52caf98eb (72.1 s, consequence-first). Checked against `docs/video/takes_ca16.md`, `docs/video/CA_MOVEMENT_B4.md`, `docs/video/recipes/course-trailer.md`, and the Sulafat clips in `~/video-takes-local/ca16/vo/Sulafat_v2/trim/` (ffprobe, trimmed lengths). Reviewer: Sonnet (timing). 25 Nov 2026. Review only, the script is not edited.

**Totals: 0 B, 3 M, 5 m.**

Measured pace on this episode: 7 to 9 word plain lines run 2.5 to 3.0 s trimmed (2.3 to 2.7 words/s); lines with a sentence stop run about 2.1 words/s. Nothing is near 3.0.

## Findings

| # | Sev | Line or shot | Issue | Fix |
|---|---|---|---|---|
| 1 | M | `open` (4.2 to 9.3, 5.1 s), **v1** | The script's v1 text is the new tagline, but `ca16/vo/Sulafat_v2/trim/v1.mp3` is the old tagline clip (4.704 s, "Cyber Security training you play"). The re-voiced v1 is `ca12/vo/Sulafat_v2/trim/v1.mp3`, 5.112 s. New need 5.112 + 0.15 = 5.26 s at card start against 5.1 s; v1 would end at about 9.33 s and touch `topic`. The "4.70 s real, 5.05 in 5.1" line is the old figure. Every other episode's open card went 5.1 to 5.4 in commit 02f8704ad. | Open card 5.4 s, v1 at card start plus 0.02 s. Take the 0.3 s from `concern` (5.5 to 5.2 s), which finding 2 shortens anyway; total stays 72.1 s. Copy the ca12 v2 trim of v1 into `ca16/vo/Sulafat_v2/trim/`. Rewrite the narrator-fit line for v1. |
| 2 | M | `concern` (43.8 to 49.3 s), "t04_concern_form 4 to 9.5 s" | The takes doc measures `kiosk-open` +0, `launch-end` +3.2, `form-open` +5.9, `end` +11.4 s, and says the Build step is on screen from `form-open`, so "plan the shot as form-open + 0.3 to +5.8 s". The script's 4 to 9.5 s window therefore opens on the launch panel and its transition (4.0 to 5.9 s, 1.9 s of it) and shows the Build for only 3.6 s, with the launch paragraph (which names Samira) visible in those frames. Even the doc's own plan, +6.2 to +11.7 s, runs 0.3 s past the take's `end` at 11.4 s. | Window = `form-open` + 0.3 to `end` (about 6.2 to 11.4 s, 5.2 s). Set the shot to 5.2 s (this is the 0.3 s that funds finding 1) and write the window into the script row. Or hold the take to +12.0 s and keep 5.5 s. |
| 3 | M | `list` and `hana` against `t05` | `t05_inbox_list` has no measured times in the takes doc (marks named, no values). The script cuts `list` from 2 to 5.4 s and `hana` from the same run for 5.2 s with the card opened, so the take must hold the list for at least 5.4 s of the take and the opened card for at least 5.4 s. The only hold the doc states is "hold the list ... hold the card". `t03` (picks) and `t06` have the same gap for `pick_offer` (3.4 s with the pick) and `pick_export` (3.7 s with the pick). Nothing is recorded, so these are parameters. | Put the holds in the takes doc before recording: list 3.6 s, card 5.6 s, each pick held 3.8 s after the click, montage held at least 10.5 s (`led_page` 4.6 + `led_offer` 5.0 + `led_export` 4.4 = 14.0 s from one page, so hold 14.4 s). Cut from marks, not from these figures. |
| 4 | m | `hana`, new **v10** "A colleague's locked out. What would you do?" | 8 words, one stop, 9 syllables. Estimate at this episode's pace: 3.3 to 3.6 s trimmed (the voiced old v10, 7 words and two stops, was 3.096 s). Need 0.2 + 3.6 + 0.15 = 3.95 in 5.2, spare 1.25 s. Fits. | Re-voice needed. Fits with room even at 3.8 s. |
| 5 | m | `hana` silent read | The crop holds Hana's whole first line, "It's Hana from claims. I'm locked out and I've a client on at half two, I'm really stuck. Can you not just sort me out?" (26 words, about 6.5 s at a silent reading speed) beside the burned v10 caption, in 5.2 s. A silent viewer cannot read both. | Caption carries the point, so accept, or crop the line at "I'm really stuck." (the crop line is a plain crop, y 342 in the wide frame, so a tighter crop needs a measured y), or give `hana` 5.5 s from `list` (3.4 to 3.1 s, v9a needs 2.51 s). |
| 6 | m | `led_page` then `led_offer`, 28.2 to 33.2 s and before | `led_page` is the heading plus the headline (offer) card, and `led_offer` is a punch-in on the same card: 9.6 s on one card, with 2.8 s of speech in it. Pacing drags, and 72.1 s is the longer side of "about 70 s". The script's own fallback drops the overview. | Optional: drop `led_page` and start v5 ("A week on, see where each one led.") 0.2 s into `led_offer`, which then needs about 5.4 s (v5 2.76 s, then v5b 4.27 s does not fit, so keep v5b in its own 5.0 s shot). Net saving about 3.5 s, total about 68.6 s. Only worth it if the owner wants nearer 70 s. |
| 7 | m | `topic`, v1c "This episode: insider risk." | Clip is 2.256 s. "This episode:" runs about 0.2 to 1.2 s, "insider risk" about 1.4 to 2.45 s. The Darren cutaway is 1.6 s, so "insider" starts about 0.2 s before the join to the Quayholt heading and only "risk" lands on it. The script says "insider risk lands on the Quayholt heading". | Cutaway 1.3 s, Brief 2.8 s (`t02` hold is 5.5 s, so the window is there). Check on the voiced clip. |
| 8 | m | Hook caption and `niamh_end` timing | Hook caption: 67 characters in 3.76 s of speech, 17.8 characters/s over three lines (27 / 25 / 15). At the edge of comfortable. `niamh_end`: Niamh's ask lands +6.0 to +6.4 s after the press and bark 1 ends about +4.64 s, so in = ask minus 1.3 s is +4.7 s at the early end, which is before bark 1 end plus 0.2 s (+4.84 s). The fallback (in = bark 1 end plus 0.2 s) gives a 5.31 s shot against the 5.5 s slot. | Hook: acceptable; if the edit shortens it, split the middle line. `niamh_end`: say in the script that a 5.3 to 5.5 s shot is expected and the shot holds its last frame (the tail is silence, 0.17 s after speech). |

## Per-line fit (trimmed clip lengths from ffprobe; need = clip + 0.2 lead + 0.15 tail)

| Line | Words | Trimmed s | Shot s | Need s | Spare s |
|---|---|---|---|---|---|
| v1 (new, ca12 trim) | 9 | 5.112 | 5.1 | 5.26 | -0.16 (M1) |
| v1c | 4 | 2.256 | 4.1 | 2.61 | +1.49 |
| v2 | 5 | 2.376 | 3.1 | 2.73 | +0.37 |
| v3 | 6 | 2.568 | 3.4 | 2.92 | +0.48 |
| v4 | 7 | 2.544 | 3.7 | 2.89 | +0.81 |
| v5 | 8 | 2.760 | 4.6 | 3.11 | +1.49 |
| v5b | 9 | 4.272 | 5.0 | 4.62 | +0.38 |
| v12 | 8 | 3.000 | 4.4 | 3.35 | +1.05 |
| v6 | 4 | 1.152 | 2.6 | 1.50 | +1.10 |
| v7 | 7 | 3.000 | 3.6 | 3.35 | +0.25 |
| v8 | 4 | 1.392 | 5.5 | 1.74 | +3.76 |
| v9a | 4 | 2.160 | 3.4 | 2.51 | +0.89 |
| v10 (new, estimate) | 8 | 3.3 to 3.6 | 5.2 | 3.65 to 3.95 | +1.25 to +1.55 |
| v11 | 5 | 1.968 | 3.2 | 2.32 | +0.88 |
| v13 | 9 | 4.488 | 5.5 | 4.84 | +0.66 |

No VO over a cast line: v11 ends at about 60.1 s, `niamh_end` opens at 61.1 s; the hook and `niamh_end` carry none; `topic` has no cast audio (the Darren cutaway is silent under `kit_quiet`).

## Take windows and hazards

- Hook (`t01`): in = 3.38 s, out = 7.54 s on the Anjali clip. Sentence 1 ends 2.54 s (0.84 s before the in), sentence 2 runs 3.58 to 7.34 s, sentence 3 starts 8.37 s (0.83 s after the out). Both cuts are in silence. The take's chat closes at about +7.7 s, 0.16 s after the out: clear. Bar cropped below y 890 in every format.
- `niamh_end` (`t07`): ask clip speech 0.33 to 3.98 s of 4.42 s; out = ask start + 4.15 s, 0.17 s after the last word, and the line is never cut at the sentence. Bark 1 hazard: see finding 8.
- `look_up` (`t06`): hold 3.9 s against 3.2 s. Fits. A faint head of Niamh behind the dimmed room: harmless.
- `flip` (`t04`, 0 to 2.6 s): the launch panel holds about 3.2 s. Fits; the paragraph (names Samira) is hidden.
- `led_page` crop at y 596 or less; the export card's top border is at 602, so the crop has only 6 px of margin. Reuben's preview is blanked; Reuben stays the second row, so the six-row list keeps the name.
- `topic` Darren cutaway (`t08_darren_cooler`, not dry-run): 1.6 s covers about 144 px of a 182 px trip at 90 px/s, so the walk reads as a walk. If the take fails the 120 px check the fallback (Brief alone, 4.1 s) is in the script. No hazard from the cooler (his natural trip fires about 30 s in; the take forces it).
- Not yet verified by any run: real-fps capture of any take, the sprite (BE_SPRITE not set in dry runs) and the 9:16 crops of the narrowed form.

## Silent read

- Captions carry the story end to end: hook caption, every VO line burned, red card "Make the week's calls", blue card "Raise a concern . Sort the messages", the two timed cast captions on `niamh_end`. The offer, the leaver's favour, "where each one led", the flip, the report, the inbox, the stranger asking for a login all read without sound.
- `pick_offer` shows the offer card (about 14 words plus two options) in 3.4 s with a caption over it. Readable only because the caption says the same thing; fine.
- `concern` (5.2 s) and `list` (3.4 s) are mostly captionless panels with one short VO line each, so the visual does the work: chips and rows, legible at 1080p.
- The close ties back: the tagline "Make the calls . See where they lead" and the spoken v13 use the same words.

## Length

72.1 s as written and after the fixes (0.3 s moved from `concern` to the open card). Hook 4.2 s (limit 5.0), close 5.5 s. About 70 s: met, with finding 6 as the way to land nearer 69 s if wanted.

## Re-voice

- v10 "A colleague's locked out. What would you do?": about 3.5 s trimmed (range 3.3 to 3.6), fits the 5.2 s shot with 1.25 s or more spare.
- v1: no re-voice, copy the existing re-voiced clip from ca12.
