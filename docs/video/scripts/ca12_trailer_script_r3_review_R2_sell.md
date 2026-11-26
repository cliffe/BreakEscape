# ca12 and ca12b trailer script r3: sell and truth review, round 2

Script: `docs/video/scripts/ca12_trailer_script_r3.md` at 8af8f3b73 (ca12b 77.0 s lead, ca12 79.0 s fallback). Checked against `scenarios/ca12_visitor_tailgater/scenario.json.erb`, its ink (`delphine_reception.ink`, `lorna_easton.ink`), `_office_kit/ink/camila_ospina_ca12.ink`, the two sibling shells (`ca12_visitor_tailgater_defend`, `test_ca12_fallback`), `docs/video/GUIDELINES.md`, `docs/video/recipes/course-trailer.md` and the CA fun/USP rubric. Reviewer: Opus (sell and truth). 26 Nov 2026.

**Totals: 0 B, 4 M, 1 m.**

## R1 majors

All seven are resolved in the script. The fixes that need scenario edits (L1, L3, L4) are listed in section 8 as follow-ups and are not applied yet, which is expected at script stage.

| R1 | Resolved by |
|---|---|
| M1 "on the phone" | L3: "The desk said yes and held the door. One conversation got you past both layers." |
| M2 "buzz you through" | L1 drops it from D1 |
| M3 hook order and 3 s test | the walk-in opens the cut; topic is the lobby after she is through (part (c) is now M3 below) |
| M4 Yusuf's double bark | reader bark cut; the watch beat keeps the learner out of his sight |
| M5 authorisation on screen | three red-card bullets and the AUTHORISATION inset, all true to the brief (line 5) |
| M6 silent turn | v7 "Now swap seats." over the blue card; the flip stays silent for reading |
| M7 replay list | ca12 flip frames the heading and the E5 line only |

## What holds

- **USP.** The attacker's side runs from 19 s to 49 s in attacker terms: "Dig into", "Build a cover story", "dress the part", "talk your way in", "skip the desk, and watch the door", and Jo, the attacker's own voice, naming why it worked: "Nobody checked. A uniform and a held door beat both." No other CA trailer has the attack's reasoning spoken by the attacker.
- **CTA.** The plate reads "Learn on Hacktivity.co.uk" and v11 says it. "Break Escape" appears on no card, chip or caption. The t06 out point keeps the "playtest" name bar off screen.
- **ca12b's route is true.** Jun only starts his run on `walked_away` (`ca12_runner_go`, line 1331); `ca12_tailgated` needs the hi-vis and a non-`got_it` outcome (line 1347); Yusuf's pass bark is gated the same way (line 2191); the E5 tailgate line (line 700) and Jo's bark (line 1818) match the script word for word.
- **A2.** The authorisation is now visible with the sound off, and nothing goes past pattern level.

## Findings

| # | Sev | Where | Issue | Fix |
|---|---|---|---|---|
| 1 | M | ca12 v6b "Look the part, and she holds the door." and its truth note | **Truth and O2.** The line says the costume made Delphine hold the door. The data says otherwise. Her `got_it` mapping (line 2046) has no hi-vis condition, and the ink never checks the costume: she says yes because of the name and the hurry (`tells.ask.accepted`, line 1083: "She buzzed the door on the partner's name and the hurry"). The hi-vis is what the **guard** checks: "Morning. Mind the step." needs it (line 2184), and without it Yusuf challenges at the reader (line 2143). The truth note's "without it she turns the learner back" is wrong for the same reason. The cost is O2: ca12 never says why the desk said yes, though research and the cover story set it up. | v6b: **"Name a partner, and she holds the door."** (7 words, 2.41 w/s in the 2.9 s window). It closes the research → name → door loop, and the hi-vis sprite and Yusuf's wave already show the costume. Rewrite the truth note: "On `got_it` Delphine holds the door whatever the learner wears (line 2046); the hi-vis is what gets Yusuf's 'Morning. Mind the step.' (line 2184); without it he challenges at the reader (line 2143)." |
| 2 | M | Hook (0.00 to 3.00), t16 dependencies | **O4 risk in the first 3 s.** The hook take starts after `kit_defend_done`, so the attack world has already closed. On `ca12_world_done`, Yusuf's patrol override sends him to his post at (1.5, 3.5) (line 2197), which is next to the studio door (Delphine holds it from (2.5, 3.5)). The shot list asks for Camila's crossing to be timed "for Yusuf at the street-window end of his loop", but it lists E4 `resume_patrol` only under topic, not under hook. Without it, the cold open shows a stranger walking past a guard who is standing at the door. That makes Yusuf the punchline, the problem R1 m12 and M4 fixed elsewhere. | Add E4 `resume_patrol` to the hook's dependencies in section 5. Fallback if it has not landed when t16 is shot: frame the hook tight on Camila (2 / 1.125 / 2, follow-cam) with Yusuf and the reader out of frame, and show the lobby in topic only after she is through. v1b stays true either way. |
| 3 | M | L2, Camila "straight up" to "straight through" | **The change list is incomplete.** The episode's own lesson quotes her: line 739, "a friendly \"she said to come straight up\" is often all it takes", and the same text at `test_ca12_fallback` line 588. The defend cards also use "send me straight up" (lines 503 and 535 and the twins). Changing only the ink and the bark would leave the debrief misquoting the hook line. Since the walk-in fixed R1 M3 (a) and (b), the only reason left for L2 is (c), which R1 called an idiom and graded weak. | **Drop L2.** Keep the cached clip (4.584 s): "straight up" means "straight to her", and that matches the rest of the episode. This saves one re-voice and one take dependency. If AC0 still wants it, add line 739 and fallback line 588 to L2, then re-run the ca12 routes. |
| 4 | M | Length (section 2 and section 9 item 1) | **Most of the length is earned; one of the two offered trims is wrong.** The kit beat (A2), the watch beat (Jun has to be on his way by the hero beat) and the 5 s silent flip (23 words to read) each carry a rubric point. The fat is **v1c and the end of topic**: "This episode: visitors and tailgating." repeats the open card that has just been on screen for 5.4 s. Cut it in both, and shorten topic to 2.5 s with v1b kept (13.68 to 15.70): that saves 3.2 s. The other proposed trim, ca12's tailgater card, should **not** go. In the desk-pass cut it is the only tailgating on screen, it anchors v8a, and the episode is called "Visitors and tailgating". **Balance:** in ca12b, attack footage (research to tailgate) runs about 25 s, against about 14.5 s of defend gameplay (queue and Lorna). The chapter-card rule asks for "mostly defend gameplay". The owner asked for the disguise and door mechanic, so this is a question for the owner, not a defect (the same call as ca15 R2 M3). | Take the v1c/topic trim: **ca12b 73.8 s, ca12 75.8 s**; snap each to the bar grid in the retime. Keep ca12's tailgater card. Change section 2's "cheapest cuts" and section 9 item 1 to match. Add to section 9: "The attack half runs about 25 s and the defend half about 15 s. Keep that, or give the queue more time?" Default: keep. |
| 5 | m | L5 to L7, and `outcomeLabels` | Two shown strings are left out of the same clean-up. (a) `perFlagNote.no_escort` "Heading up alone, with nobody signing for them." (line 376 and both other shells): once L5 sends the 09:12 visitor "into the studio", "up" contradicts it on the same card. (b) `outcomeLabels.got_it` "You got buzzed through the door." (line 994) contradicts the held door that L1 and L3 set up. | (a) Add to L5: "Into the studio alone, with nobody signing for them." (b) Before t21 for ca12, check whether the flip panel shows the outcome label. If it does, change it to "The desk let you through." Both are shown text with no TTS. |

## Physical-security accuracy

No change from R1. Tailgating, the uniform pretext, check-the-list-and-escort, and the no-blame line all hold at awareness level (ISO/IEC 27002:2022 7.2, NPSA access-control guidance, NCSC culture principles). v10b "Don't let anyone follow you in." states the standard anti-tailgating rule and matches the episode's tailgating factor text. The red-card bullets match PTES pre-engagement practice (written permission, scope, rules of engagement) and the brief (line 5).

## Rubric (CA fun/USP, trailer-observable items, as scripted at 8af8f3b73)

| Item | ca12b | ca12 | Evidence |
|---|---|---|---|
| F1 hook | 3 | 3 | movement past a guard and through a door in the first 3 s; Camila's line from 3.15 s. Holds only with finding 2 |
| F3 agency | 2 | 1 | ca12b: the menu's "leave it at the desk", the walk-away, and a flip heading that names the route ("In behind a member of staff"); ca12 shows one route |
| F4 living world | 3 | 3 | Camila's walk-in, Yusuf's loop, Delphine leaving her desk, Jun's "Morning, Yusuf.", Jo in the earpiece |
| O1 attacker's steps | 3 | 3 | research, cover story, kit, talk, door, each in attacker terms |
| O2 attacker reasoning | 3 | 2 | ca12b: Jo, "A uniform and a held door beat both."; ca12: v6b names the wrong lever (finding 1). 3 with the fix |
| O3 transfer | 3 | 2 | ca12b: v10b answers the held door; ca12: v10's four actions, none about following someone in |
| O4 tone | 3 | 3 | Yusuf polite, never sent back and forth; Lorna's no-blame line. Holds only with finding 2 |
| A1 accuracy | 3 | 2 | ca12b: every claim checks once L1, L3 and L5 land; ca12: v6b (finding 1) |
| A2 safe takeaway | 3 | 3 | bullets and the AUTHORISATION inset; pattern level only |
| P1 practice or outcome | 2 | 2 | the defend queue (hover, no verdicts) and the flip naming the learner's own outcome |

**ca12b 28/30, ca12 25/30** (the script's 26 counted ca12's O2 and A1 at 3). With finding 1 fixed, ca12 reaches 27/30. ca12b should stay the lead: it is the only cut with a choice on screen and the only one where the attacker explains the result.
