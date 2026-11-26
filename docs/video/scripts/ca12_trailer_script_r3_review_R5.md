# ca12 and ca12b trailer script r3: final delta review R5 (26 Nov)

Script: `docs/video/scripts/ca12_trailer_script_r3.md` at df7bf036a, delta 7920f6bd4..df7bf036a. Reviewer: Sonnet 5.5. Checked against the R4 review, the beat tables, the VO table, the take specs and `scenario.json.erb` (Jo's bark at :1818).

**Totals: 0 B, 0 M, 0 m. Verdict: READY.**

## R4 findings

| R4 | Status | Evidence |
|---|---|---|
| 1 M, v6 margin | fixed | Learner enters at +6.40 or earlier, Yusuf +6.42 to +7.71, v6 +8.02 to +8.76. Beat starts 37.354, so v6 is 45.37 to 46.12 (clip 0.744 s, ends 46.114). Flip cut 46.454, margin 0.34 s. v6 is 0.31 s after Yusuf's bark. Beat stays 9.10 s, so the flip stays on the half-bar. Section 3, 4.2 and the t18 spec agree |
| 2 m, length arithmetic | fixed | 77.03 - 2.73 + 1.36 = 75.66. ca12 = ca12b + 2.25 (swap 4.90 + 9.15 for 3.70 + 9.10, add 3.50) = 77.91 |
| 3 m, Gently Decaying Again | fixed | 21.1 s and 16.9 s, start list quoted |
| 4 m, t19 reply | fixed | In point after `conversation-closed`, or hard cut; no speech under v5b |
| 5 m, kit shot a | fixed | 0.4 + 1.3 + 0.9 = 2.6 s against 2.62 s, with a hard-cut fallback |
| 6 m, inset and music wording | fixed | Inset in the last 1.2 s of the talk beat; drop is 1.36 s before the flip (47.70 - 46.34) |
| 7 m, Jo's toast | fixed | t20 hides it with `/held door beat both/`, which matches the bark text at scenario.json.erb:1818. Caption carries the line |
| 8 m, lands slack | fixed | Fallback is 1.05 s throughout; door takes 2.65 s; D1 overrun rule stated |

## Re-checks

- **Beat sums.** ca12b starts and lengths sum to 75.656 s. ca12 starts 31.054, 33.654, 37.354, 46.454, 51.906, 54.406, 57.906, 68.506, 72.406 sum to 77.906 s.
- **VO overlaps and gaps.** No narrator window overlaps a character line. v6 ends 0.34 s before the cut, v6b ends 41.77 and keeps 0.36 s from Delphine's bark. Smallest cue gap 0.25 s (v7 to v8a, others as R4). v3 to v4 and v10 to Lorna stay at 0.30 s.
- **Pace.** Every cue is at or under 3.0 w/s. Highest is v4 at 2.96. v6 is 2 words in 0.75 s (2.67).
- **Dashes.** None in the VO lines or cue table.
- **Cards.** Longest line "Scope: the desk and the door" is 28 characters. No card text changed.
- **Music.** GD at 88.123 unchanged. Other starts on the track are 28.151, 39.055, 66.314 and 104.478, so at least 16.36 s away. Music table cut times unchanged (46.34 sits 0.11 s before the ca12 flip and 1.36 s before the ca12b flip).
- **Framing.** No zoom change in the delta. 9:16 zooms remain 0.5625, 1.125 and 1.6875, panels over 540 px at 1x.

## Notes (no action needed before the shoot)

- If the `lands` fallback is used, the door beat grows to 11.75 s and its internal cues are retimed from the marks. The script says so. Re-check the v6 margin of 0.3 s then.
- t20 depends on the grace and `barkDelay` edits (section 8.2) being on the branch, as already stated.
