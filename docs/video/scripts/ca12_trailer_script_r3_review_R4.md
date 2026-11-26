# ca12 and ca12b trailer script r3: delta review R4, sell and truth plus silent viewing and timing (26 Nov)

Script: `docs/video/scripts/ca12_trailer_script_r3.md` at 4f0090977 (ca12b 75.66 s lead, ca12 77.91 s fallback), delta 8af8f3b73..4f0090977. Reviewer: Sonnet 5.5, one pass covering both lenses. Checked against the two R2 reviews, `scenarios/ca12_visitor_tailgater/` (scenario.json.erb, `delphine_reception.ink`), `flip-view.js`, `bark-lifetime.js`, `tools/video/takes/ca12/t06_the_call.mjs`, the cached clips in `tts_cache/ca12_visitor_tailgater/` (silencedetect at -40 dB), the Remotion caption component, `gently_decaying_75.json` and the edit lists' music starts.

**Totals: 0 B, 1 M, 7 m.** Every R2 blocker and major is resolved in the script. The one major is a standing-rule breach (speech to cut margin) in the ca12 door beat. Scenario edits (grace, `barkDelay`, L1 to L9) are still unapplied in the file, which is expected at script stage and is tracked by the script's own dependency codes.

## R2 status

| R2 item | Status | Evidence |
|---|---|---|
| Timing B1, grace and Jo | resolved | Grace 7500 (scenario.json.erb:206 is `"delayMs": 5000` today) and `barkDelay` 2600 (:1817 is 1800 today). Relative to the beat: Yusuf's pass bark starts +2.00 and the clip's speech ends 2.272 s in, so +4.27. Jo's clip speech runs 0.289 to 4.226 s, so at +4.60 she ends +8.83. Beat 9.15 s, 0.32 s margin. Hand-back at +9.50 is after the cut. Both mappings fire on the same `room_entered:training_room`, so the arithmetic holds |
| Sell M1, v6b | resolved | "Name a partner, and she holds the door." Delphine's `got_it` mapping (:2046) has no hi-vis condition; Yusuf's "Morning. Mind the step." needs it (:2184); the not-`got_it` bark (:2194) is "Delivery? Studio's straight through." The `tells.ask.accepted` text (:1083) gives "the partner's name and the hurry". Catherine Merrin is the partner the research drops (:883, :1096) |
| Sell M2, `resume_patrol` | resolved | The engine action exists (`apply-actions.js:517`); the shell mapping is a listed dependency for hook and topic, with a tight-framing fallback |
| Sell M3, L2 | resolved | Dropped. The lesson text (:739) still quotes "straight up", and the cached Camila clip (4.584 s, text matches) is kept |
| Sell M4 / timing M1, trim and balance | resolved | v1c cut, topic one bar (see m1 for the arithmetic wording), AC0 balance question in section 9 item 2 (26.65 s attack against 14.5 s defend, both correct) |
| Timing M1, flip text | resolved | Heading plus line is 15 words in both cuts (ca12b 6 + 9, ca12 7 + 8, counted), 4.5 s at 300 ms a word, hold 5.45 s (four half-bars of 1.363). On the call flip `flip-view.js` writes `flipCallIntro` as `.aw-lead` and the replay and notes as `.aw-flip-call`, `.aw-call-notes`, `.aw-tells`: the t21 CSS hides all four. On `walked_away` the panel is heading plus defender line only. The 300 ms rule is the reading part of the game's lifetime (3 s notice plus 0.3 s a word), so it is the lenient end; 0.95 s of slack is enough |
| Timing M2, menu hold | resolved | 2.2 s dwell, talk 2.6 s, inset on the route option (ca12b option 5, ca12 option 4), both quoted exactly from the ink (:62 to :66) |
| Timing M3, t06r and t06w | resolved | Specified end to end. STEPS regexes match the ink options; the `/side door on your left/` third line exists after L1; points are measured from marks, not `line-end` |
| Timing M4, door text | resolved | Jo's toast hidden in t18 to t20; captions for every speaker. Narrator and character captions stack in separate lanes (`CaVo.tsx` places the narrator caption above the dialogue caption box), so Delphine's caption and v6b's can coexist |
| Timing M5, v10b | resolved | "Check the list. Don't let anyone follow you in." is about 12 syllables; at the measured Sulafat rate (v4 about 4.1 syllables a second) that is 3.3 to 4.2 s in a 4.78 s window |
| Timing M6, kit | resolved | Split into panel at 1x and world at 2x, with a `kit-panel-rect` mark and a measure-first rule |
| Timing M7, hook and topic | resolved | t16 and t16b, two runs |
| Minors | resolved | v3 to v4 0.30 s, v6b 0.36 s after Delphine, out 13.23, fallback in 14.95, music table redone (re-derived below), t20 waits for 8.2 |

## Checks passed

- **Narrator pace and gaps.** Every window is at or under 3.0 w/s (highest v4 2.96, v6b 2.76, v4b and v5b 2.67). New lines estimate to 2.2 to 2.6 s against 2.9 to 3.0 s windows. Gaps between cues are 0.25 s or more everywhere (v5 to v5b, v7 to v8a, v8b to v9, v9 to v10b are the 0.25 s ones). No narrator line sits over a character line: v5b and v4b run over silent beats, v10b ends at or before 66.22 against Lorna's speech at 66.52, v10 ends 68.47 against 68.77.
- **No dashes in VO.** The only non-ASCII dash-like character in the script is the minus sign in prose.
- **Cards.** Longest line "Scope: the desk and the door" is exactly 28. "A booked test, signed off" 25, "Merrin & Sallow Architects" 26, "OPEN-SOURCE RESEARCH" 20.
- **Integer scale.** Every zoom is 1, 2 or 3 (16:9, 1:1) and 0.5625, 1.125 or 1.6875 (9:16). Panels over 540 px (research 1090, build about 630, talk menu 571, flip 745, queue 960, kit panel unmeasured with the rule stated) are at 1x in the narrow cuts. No pushins. Insets are 2x crops.
- **Beat sums.** ca12b sums to 75.656 s and ca12 to 77.906 s; the exact-starts lists match the tables. The flip, blue card and queue starts are whole half-bars (35, 39 half-bars of 1.363 s in ca12b).
- **Music window.** Gently Decaying at 88.123 is bar 32 (88.122 in the analysis), 187.2 s track. Distances to the other Gently Decaying starts in the edit lists: 28.151 (ca06) 60.0 s, 39.055 (ca15) 49.1 s, 66.314 (ca17) 21.81 s, 104.478 (ca03) 16.36 s. All at least 15 s. Window ends 163.78 s (ca12b) and 166.03 s (ca12) of 187.2 s, and the next section change after it is the drop at 169.9. I re-derived the music table: "music time" is time relative to the old 85.397 start, so cut = music - 2.726. The hits and sections it names exist in the analysis (drop 101.752 = 16.35, hit 104.478 = 19.08, lift 109.93 = 24.53, hits 115.38/116.738/118.108 = 29.98/31.34/32.71, drop 131.737 = 46.34, lift 139.915 = 54.52). Every "into" figure in the table checks, bar one wording slip (m6).
- **Truth of the changed lines.** v4b matches the brief and the letter (:5, :1870). v5b is true: `ca12_runner_go` only on `walked_away` (:1331), `ca12_tailgated` needs hi-vis and a non-`got_it` outcome (:1347). v7, v10b and the red-card bullets are true and pattern level. D1 after L1 ("Go on then. Studio's through the side door on your left.") is consistent with the side-door gate and keeps `# unlock_door:training_room`. The L5 to L7 strings and L9 exist where the script says (:365, :375, :376, :379, :994).
- **Awareness accuracy.** Tailgating, the uniform pretext, the check-the-list and escort habit, and the no-blame line hold at awareness level. "Don't let anyone follow you in" is the standard anti-tailgating rule and matches the episode's tailgating factor text (:383). Nothing goes past pattern level.
- **Cached clips named as cached.** Camila (4.584 s), Lorna (3.288 s), Delphine "I'll get the door" (1.344 s, speech ends 1.06), Yusuf "Morning. Mind the step." (1.68 s, speech ends 1.29), Yusuf "Delivery?" (2.568 s, speech ends 2.27), Jo (4.56 s, speech ends 4.23). "Morning, Yusuf." has no cache entry, as the script says.

## Findings

| # | Sev | Where | Issue | Fix |
|---|---|---|---|---|
| 1 | M | ca12 door beat, v6 "You're in." (section 3 table, section 4.2) | **Speech-to-cut margin is 0.24 s, under the 0.3 s rule.** v6 starts 45.47 (0.31 s after Yusuf's bark, which is why it cannot move earlier) and its clip is 0.744 s, so it ends 46.214. The flip cut is 46.454. This beat was carried over from r2 and R2 did not measure it. The ca12b hero beat (Jo, 0.32 s) passes. | Trim 0.10 s from the first part of t18 so the learner enters at +6.40, not +6.5. Everything after moves 0.10 s earlier: Yusuf's bark ends +7.71, v6 runs +8.02 to +8.76 and the margin is 0.34 s. Keep the beat at 9.10 s so the flip stays on the half-bar. Add "learner enters at +6.40 or earlier" to the t18 spec and to section 4.2. |
| 2 | m | Section 2 "Lengths" paragraph | The arithmetic does not close. It says "v1c is cut and topic is one bar shorter (-3.2 s)" and "add back 1.36 s", which gives 77.02 - 3.2 + 1.36 = 75.18, not 75.66. The topic beat shrank 5.70 to 2.97 (-2.73 s) and 3.24 s is v1c's clip length, which was inside that window. The real net is -2.73 + 0.90 + 0.40 + 0.06 = -1.37 s. The beat tables are right; only the sentence is wrong. | "topic is one bar shorter (-2.73 s; v1c's 3.24 s clip went with it). The talk menu (+0.90 s), Jo's clearance (+0.06 s) and the watch beat (+0.40 s) add back 1.36 s." |
| 3 | m | Section 6, the "Gently Decaying Again" alternative | "about 19.1 s from the nearest used starts either side" is the r2 figure. From 85.419 the Gently Decaying Again starts in the edit lists are 64.356 (ca18) and 102.341 (ca14): 21.06 s and 16.92 s. Still clear of 15 s, but the sentence is stale, and the start list for that track (6.069, 35.541, 64.356, 102.341) should be what is quoted. | Replace with "21.1 s from 64.356 and 16.9 s from 102.341". |
| 4 | m | Watch beat, t19 entry state (section 5) | **Delphine's reply is not accounted for.** After "leave it at the desk" she answers "Right you are, leave it with me and I'll let them know." (ink :63 to :64, a voiced line) before the conversation ends. t06w stops 800 ms after the pick, but t19 starts "after a walked_away call", and v5b runs 33.80 to 36.80 over the first 3 s of the beat. If t19's in point is inside the reply, her speech lands under the narrator. | State that t19's in point is after the conversation closes and her reply has ended (mark `conversation-closed`), or that the reply's tail is trimmed with a hard cut; no character speech under v5b. |
| 5 | m | Kit shot a (beat 7), section 5 | **Shot a has no sub-timings.** It holds four actions (open the hook, letter inset with the AUTHORISATION tab, take the hi-vis, confirm Wear) in 2.62 s. R2's version allotted 0.42 s and 1.30 s to the first two. For the silent viewer the tab and the signature line need about 1.3 s. | Budget shot a as open 0.4, inset 1.3 (tab plus "Signed, Julian Sallow, Partner" crop), take and confirm 0.9. If the take cannot do it, hard-cut inside shot a (gameplay to gameplay is allowed) rather than shortening the inset. |
| 6 | m | ca12b talk beat (31.05 to 33.65) under v5, and the music table row at 46.34/49.07 | Two small wording points. (a) In ca12b the shot shows the "leave it at the desk" inset while v5 says "Then talk your way in." and v5b ("Or skip the desk...") only arrives after the cut. It reads as a sequence ("talk", "or skip"), so it is acceptable, but show the inset in the last 1.2 s of the beat and the menu without it before, so the picture does not lead the narration. (b) The music table says the second drop (cut 46.34) is "in the tailgate's last second"; the tailgate ends 47.70, so it is 1.36 s before the cut. | (a) Optional retime of the inset. (b) Change to "1.36 s before the flip". |
| 7 | m | Jo's line on screen (section 4, t20) | In the game Jo's earpiece line shows as a bark toast (she has no bubble) and the edit adds a burned "Jo (earpiece)" caption. In 16:9 and 1:1 both would show the same 10 words. The script hides Lorna 9 only. | In t20 hide Jo's own toast with the same MutationObserver (match `/held door beat both/`) and let the caption carry it; or state which one stays per aspect. |
| 8 | m | ca12 `lands` (section 5.2 and the fallback) | Two arithmetic points. The budget 3.7 s has no slack: new D1 is 11 words, about 3.2 s of speech, plus 0.22 s from the in point to the audio and 0.25 s tail gives 3.67 s. If the Despina re-voice runs slow, `lands` and the door beat both need re-timing (acceptable, ca12 is the fallback, but say so). The fallback says "14.95 to 16.00 (1.05 s)" and then "`lands` becomes 1.20 s". | Add "if D1 voices over 3.3 s of speech, lands takes the extra and the flip loses a half-bar of door lead-in, not the hold". Make the fallback 1.05 s throughout (door beat takes the other 2.65 s). |

## Silent viewing and timing notes (no action needed)

- **Hook.** First 3 s are movement, her line is captioned (13 words, 3.9 s of reading in a 4.58 s clip), and her speech ends 7.73, 0.45 s before the open card. The tight fallback (no Yusuf or reader in frame) keeps movement but drops "past a guard", so F1 falls from 3 to 2 if the fallback is used. The script's rubric note already says so.
- **Flip.** At 9:16 and 1:1 the panel is 745 px, so 1x with an inset of the heading and line, or the E5 line as a burned caption. Either reads in the 5.45 s hold.
- **ca12b door text.** Jun 2, Yusuf 4, Jo 10 words, never overlapping, each within its audible time: reading time 0.6, 1.2 and 3.0 s against 0.85, 2.27 and 4.23 s.
- **Jo's "both".** "A uniform and a held door beat both" follows a route that skipped the desk. It reads as guard plus reader, and the flip line ("The door held, so nobody had to say yes.") closes it, so no change. Worth one look when the render exists.
- **t16 and t16b determinism.** Two runs need the same Yusuf loop offset; it holds with fixed steps on (the headless physics rule), so record both from the same entry state in one session.

## Rubric (as scripted at 4f0090977)

| Item | ca12b | ca12 | Note |
|---|---|---|---|
| F1 hook | 3 | 3 | 2 if the tight fallback is used |
| F3 agency | 2 | 1 | unchanged |
| F4 living world | 3 | 3 | |
| O1 attacker's steps | 3 | 3 | |
| O2 attacker reasoning | 3 | 3 | v6b is now true |
| O3 transfer | 3 | 2 | |
| O4 tone | 3 | 3 | needs `resume_patrol` |
| A1 accuracy | 3 | 3 | once L1, L3, L3b and L5 to L7 land |
| A2 safe takeaway | 3 | 3 | |
| P1 practice or outcome | 2 | 2 | |

**ca12b 28/30, ca12 26/30**, matching the script. The cuts are ready for AC0 sign-off once finding 1 is applied; findings 2 to 8 can be taken with the take specs.
