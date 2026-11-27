# ca18 trailer script: sell and truth review, round 2

Script: `docs/video/scripts/ca18_trailer_script.md` (71.7 s, attack first), with its "Changes from review (round 1)". Checked against `scenarios/ca18_credential_attacks_at_scale/` (scenario.json.erb, ink/ama_owusu.ink), the dry-run takes doc `docs/video/takes_ca18.md` (23 and 25 Nov), the recipe `docs/video/recipes/course-trailer.md` and the finished ca07 script. Reviewer: Opus (sell and truth). 25 Nov 2026.

**Totals: 0 B, 2 M, 4 m.**

Round 1 fixes hold. The opened card is the genuine `e18_lockout_genuine` (Fenlow Managed IT, 08:54, `isPhish: false`), so "Fenlow" and "this morning" are on screen before Lorna says them. The takes doc proves the crop: the body is clipped to "Hello,", and Range rects put the advisory below it in both the wide and the narrow frame. v1b now says "This practice". `research` opens on the team note.

Verified true: A2 and A6 are Ama's ink lines 61 and 58 word for word; L1 is the scenario bark at line 1058 (1.5 s delay, needs `kit_quiet`); the title is the `titleScreenName`, and the blue card is the objective "Handle the security alerts"; "Our people" lists the staff and "Contact us" gives the address pattern (the scenario's own notes: "The staff list and address pattern came off the practice's public pages"); v5 is the console's "tried once against every account in a pass, so no single account ever locks"; the result row reads "3 of 5 accounts opened" (v6 "Some of them open."); the inbox holds six alerts. Totals add up to 71.7 s. No dashes in any VO line.

## Findings

| # | Sev | Line | Issue | Proposed rewrite |
|---|---|---|---|---|
| 1 | M | `blue_card` (48.8 to 51.2 s), no VO | The script's own owner rule (line 5) says "blue chapter card (title only) and VO naming what is being done", and the brief says narrator VO throughout. ca07 (v7) and ca17 (v2) both voice their blue cards. Here the flip (2.4 s, silent), A6 and the blue card (2.4 s, silent) leave the narrator gone for 11 s just as the trailer turns to the defend half, the half the buyer is paying for. Round 1 offered "Now defend." as optional. A6 has just said "Now it's your seat", so a third "now" would repeat. | **v7 "Defend the practice."** (3 words, 1.30 + 0.35 = 1.65 s in 2.4). If the owner wants the longer **"Then you defend the practice."** (5 words, 2.52 s), the blue card goes to 3.0 s and the total to 72.3 s. |
| 2 | M | `lorna_end`, v10 "Then, at Lorna's desk." and "the game's own bar" | The dry run measured what the script left open. Press to L1 audio start is 1.56 to 1.68 s, so v10 (it ends at press plus 1.44 s) clears L1 by only 0.12 to 0.24 s, against the 0.2 s rule. The takes doc already says to use the fallback. Two more mismatches with the take: Lorna's bubble is hidden for the whole take, so there is no game bar and the edit burns the caption. And the shot is 0.8 + about 1.62 + 3.40 = about 5.8 s, not the nominal 6.0 s. | v10 **"At Lorna's desk."** (3 words, ends about press plus 0.9 s, about 0.7 s clear of L1). On-screen text: "Lorna's world bubble hidden in the take; L1 as a burned caption". Shot: out = `l1_audio_start` plus 3.40 s as now; hold the last frame to fill the 6.0 s slot, or trim the slot to 5.8 s (total 71.5 s). Update owner question 2 to quote the new v10. |
| 3 | m | Take notes "Hook" and "Flip" (lines 34, 36) | Both say the earlier lines "are Continued". In the dry run, line 2 follows line 1 by itself 0.6 s later, and A4 and A5 also advance on their own (the only button is "Skip [SPACE]"). The welcome line is 5.33 s, not 5.38 s. Pressing Continue as written would put a click on camera. | Hook: "Line 1 (the welcome, 5.33 s) plays and line 2 follows by itself 0.6 s later; no click." Flip: "A4 and A5 play and advance by themselves; A6 starts 0.5 s after A5 ends." |
| 4 | m | `alerts` on-screen text and take note | The script says "framed on the From line, the subject and 'Hello,' only". The measured crop (wide x 480, y 114, 960 by 131) also holds To (you@merrinsallow.example) and Time (08:54). The verdict buttons sit just below the crop, so a loose 9:16 reframe would catch them. | "framed on subject, From, To, Time and 'Hello,' (crop as measured in the takes doc); the verdict buttons sit just below: keep them out of every reframe". Time 08:54 on screen is good: it ties to Lorna's "this morning". |
| 5 | m | Tab names (OPEN-SOURCE RESEARCH, PASSWORD GUESSER, YOUR INBOX, SECURITY ALERTS, THE TRAINING ROOM) | The takes doc says none of these is game text (the game shows "Security Awareness" and "Browser" windows) and asks for the script to change. The recipe makes tabs the edit's own tool labels, so the names can stay, but the script never says so, unlike ca17. | Add to the take notes: "Tab names are the edit's own labels (recipe: tool names on cards), not game text; the takes do not need to find them." |
| 6 | m | Owner question 3 (A6 cache) | Resolved. A real POST /tts in the t03 dry run returned 200 audio/mpeg (45,789 bytes, 5.91 s) on a keyless server, so the sidecar's colon still hits the cache. | Close the question: "A6 is cached (dry run, 23 Nov); fallback A4 no longer needed." |

Checked, no change:
- v5 "so nothing locks", then the genuine alert "Some accounts were briefly locked this morning" about 25 s later. A sharp viewer might hear a contradiction. In the episode the card says the practice locked accounts "as a precaution" after a run of unusual sign-ins, and the stuffing run (left out here) also ran. On screen it reads as the defenders' controls noticing the campaign, which helps the defend half. v5 carries the attacker's reasoning (O2), so keep it.
- The six-row list shows the fake subjects ("Your account is locked - act now", "Free breach checker"). That is the triage list before any verdict, which the recipe allows. The cursor stays off the 09:06 row.
- A spray pass label with a season and year may show. That is pattern level and matches the episode's debrief.

## Rubric (CA fun and USP; trailer-observable items)

| Item | Score | Evidence |
|---|---|---|
| F1 Early hook | 3 | Ama, 0.0 to 3.6 s: "Attackers rarely pick one person and crack them." It sets up a question (then who?) in the first line, and the trailer answers it by 40 s. |
| F4 Living world | 2 | Lorna at her desk, 60.2 to 66.2 s: "Fenlow have made me reset my password after this morning." It is a real consequence in the office, paid off by the 08:54 card. One ambient voice only, and the bubble is hidden, so it rests on the caption. |
| O1 Attacker's method shown | 3 | Each step is spoken over its own footage: the staff list (v1b, v3), the address pattern (v3), the practice's own words (v3b), the lists built (v4), the spray (v5) and the result "3 of 5 accounts opened" (v6). |
| O2 Attacker reasoning visible | 3 | "Try one password on every account, so nothing locks." names the reason. "Their website gives the staff and the address pattern" names the weakness, which is public information, not a foolish person. |
| O4 Tone | 3 | No fear framing. Ama's A6 ("some real, some fakes meant to finish the job") sets stakes calmly, and Lorna's line is everyday. |
| A1 Accuracy | 3 | Every VO line and cast line checked against the scenario (list above). Password spraying to avoid lockout is described correctly. |
| A2 Safe takeaway | 3 | Passphrases, live log and the stuffing rows hidden and asserted; the result shows a count only; the fake cards are never opened; no advisory on screen. |
| P1 Practice or outcome | 2 | The attack's outcome is shown (accounts open), and Lorna's reset is an in-world consequence. The defend practice is shown with no verdict. |
| F2, F3, F5, F6, O3 | not observable | A trailer cannot show these. |

Trailer subtotal 22 of 24. Findings 1 and 2 are about the rules and timing, not the score.