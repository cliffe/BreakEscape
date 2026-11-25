# ca11 trailer script review, round 1 (sell and truth)

Script: `docs/video/scripts/ca11_trailer_script.md` at 851756c99 (defaults taken for the open owner questions). Checked against `scenarios/ca11_misdirected_data/scenario.json.erb`, `scenarios/_office_kit/ink/yusuf_demir_ambient.ink`, `docs/video/takes_ca11.md` (dry runs, 23 Nov), the recipe `docs/video/recipes/course-trailer.md` and the finished ca07 script. Findings are not applied.

Verdict: revise. Totals: **0 B, 2 M, 5 m.**

## Findings

### M1. v3 drops the pretext, so the one attacker in the episode goes unseen (O2)
The card behind v3 is Carol: "I'm Bernadette's sister, it's her fiftieth and I'm planning a surprise." The montage pays it off: "The birthday-surprise call was how he learned where a lone worker would be." v3 "A caller asks where Bernadette cleans today." says nothing about the story she gives, so v5b "A stranger learned where she would be." reads as bad luck, not as someone lying to the desk. For a consequence-first episode this is the only place the attacker's method shows, and the trailer throws it away.
Rewrite: v3 **"A 'sister' asks where Bernadette cleans today."** (7 words, 3.04 + 0.35 = 3.39 s in 3.8 s; caption "A 'sister' asks where / Bernadette cleans today."). Then v5b lands as the reveal.

### M2. The office-shot note on bark 2 is wrong
Notes, "The panel and the office are two runs": "bark 2 ... starts about 8.6 s after bark 1, well past the cut at 6.1 s." The dry run measured bark 2 at 4.93 s after bark 1 (5000 ms after `kit_ca11_at_tray`), and because both barks share one `TTSManager` element, bark 2 stops bark 1 at 4.93 s, inside sentence 2 (ends 5.86 s). `t07_printout_beat` now blocks bark 2's `play` call, which works in the dry run. An editor reading the script as written would not know the end line depends on that block.
Rewrite the sentence: "Bark 2 is set 5.0 s after Yusuf reaches the tray and would cut bark 1 off at about 4.9 s, inside sentence 2; the take blocks bark 2's audio (`bark2-blocked` mark). If a recorded run still shows bark 1 cut, end the shot at 4.9 s and caption sentence 1 only."
Same paragraph: "the bark audio starts about 2.5 to 3.1 s after the press (unmeasured)" is now measured at 2.45 s (press 3.33 s, bark 5.78 s), so in = bark start minus 1.8 s = press plus 0.65 s. Replace "(unmeasured)" with "(dry run: 2.45 s)".

### m1. `led_page` says "all four cards"; three are on screen
The take hides the overtime card (`data-beat=overtime_sheet`, display none), so the page shows caller, export and redaction (`takes_ca11.md`, t03). The note "if card 2's line is legible there, accept it" is stale for the same reason.
Rewrite the row: "the 'Six months later' page, three cards (caller, export, redaction; the overtime card hidden in the take)". Drop the card 2 clause from the notes.

### m2. The 11:15 card framing contradicts itself
The `inbox` row frames "From, subject and body"; default 5 says the frame "keeps to the subject and body" because Sam Whitlow also sent the 08:52 key item. The t06 card frame holds From, To, Time and body.
Rewrite: crop the card below the From line (subject and body only), or accept the sender and delete the "keeps to the subject and body" clause. Recommend the crop: the 08:52 row with the same sender is on screen 4 s earlier.

### m3. The brief's "Play now" is not in the close, and should not be
The orchestrator's rules list "Play now"; `CA_THEME_TWO_SEATS.md` and the recipe's End card section rule it out for Cyber Aware ("that is SAFETYNET's call to action"). The close "Make the calls, see where they lead, on Hacktivity.co.uk." follows the CA rule. No change; flag for the owner if "Play now" is a new rule.

### m4. The hook is advice-shaped
"Handovers go out fast when it's busy." is the first half of a warning (sentence 2 is the moral). It is the right topic and has no tell, but as a cold open it states a lesson rather than raising a question. No cached Yusuf line is stronger; the end bark is the strong one and is 6 s long. Keep, and note F1 is carried by the topic card (Carol's call is on screen from 8.0 s).

### m5. The montage punch-in on card 1 is the darkest image in the trailer (O4)
"Two weeks on, a stranger was waiting for Bernadette outside her school." is on screen for 5.0 s. v5b says it gently and the line is true to the episode, but a silent viewer gets the threat without the voice. Keep (default 4), and in the punch-in favour the second sentence ("The birthday-surprise call was how he learned...") so the frame reads as how it happened, not as menace. With M1 applied the two sentences read as one idea.

## Facts checked (true as written)

- v4: Martin is "the Sales Director" and asks for the family contacts (card 3, option "Export the family contacts and pass the file to Martin").
- v5c: "three families complained and one wrote to the ICO, the UK's data protection regulator" (export card).
- Heading "Six months later" (`flipHeading`); the punch-ins read "Two weeks on" and "A month on", so v5 "Then see where each one led." avoids a wrong time.
- v8: six rows in the inbox (t06 row list). The 11:15 card is `isPhish` false with a new 07700 900 number.
- v9 and the end bark: the printout sits on the photocopier tray; bark 1 text matches the scenario word for word.
- Hook line: `yusuf_demir_ambient.ink` `ca11` knot, not-caught branch, gated by `kit_defend_done` as the take seeds it.
- Titles: mission.json "Misdirected data", brand "Carrholme Services".
- No em or en dashes in the VO; "Cyber Security" does not occur; UK spelling throughout. Total 71.7 s re-added from the shot lengths; hook 2.9 s, close 5.5 s.

## Rubric (trailer subset, 0 to 3)

| Item | Score | Evidence |
|---|---|---|
| F1 hook | 2 | Hook is a mild advice line (m4); the first question comes at 8.0 s with Carol's call on the card and v1b. |
| F4 living world | 3 | Yusuf opens and closes: he talks, then walks to the copier tray and finds the care home list (`office`, 7.9 s, cached bark). Named in v9. |
| O1 attacker's goal and method shown | 1 | Consequence-first: no attack is played. The caller is the only attacker, and v3 hides the pretext (M1). With M1: 2. |
| O2 attacker reasoning visible | 1 | "A stranger learned where she would be" shows the outcome, not why the desk told him. With M1 the "sister" pretext names the weakness (a friendly story at a busy desk): 2. |
| O4 tone | 2 | Curious framing in VO ("Whose job is this one?"); the card 1 punch-in is a stranger outside a school (m5). No blame, no fear language in VO. |
| A1 accuracy | 3 | Every VO claim matches the scenario (list above). |
| A2 safe takeaway | 3 | Pattern level only: no tells, no verdicts; the 08:52 key item is never opened; v10 is a question with no answer. |
| P1 see it play out | 2 | The montage shows consequences in the world (stranger, complaints, regulator) and the end bark shows misdirected data arriving; the trailer does not show the learner applying the habit. |

Trailer subset: 17 of 24. With M1 applied: 19.

## Sell

The trailer sells "your everyday calls have consequences" clearly with the sound off: picks, then where they led, then the inbox, then the office finding a printout it should not have. What it does not sell is the course's USP, seeing the other side: one word in v3 fixes most of that. The end bark is the best moment and stays.
