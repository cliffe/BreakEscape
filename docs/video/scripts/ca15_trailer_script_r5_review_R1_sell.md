# ca15 trailer script r5, review R1 (sell and truth)

Reviewed: `docs/video/scripts/ca15_trailer_script_r5.md` at ce2e57207, against `scenarios/ca15_shadow_it/scenario.json.erb` and `ink/nilesh_solanki.ink` as they stand on this branch (8dabd5955). The consequence-text change the script asks for in its section 9 is not in the tree yet, so beat 6 is judged against the wording the script proposes. No takes were viewed. Timings below use the script's own formula (clip = words / 2.33 + 0.15; slow read = words x 0.495) and need the timing reviewer's check. The r4 reviews were not read.

Counts: **0 Blocker, 5 Major, 9 Minor.**

## Verdict

r5 does what the owner asked. The term is on the open card at 4.4 s and defined by 16 s, there are two shortcuts and each cost follows its pick in the next shot, "pack" and the other in-game words are gone, and it ends on the tell-IT line. A first viewer can now say what the episode is about after one watch, which r1 could not offer.

Two things still get in a first viewer's way: the hook is about a printer and the story is about a file share (M1), and the attacker line points at the wrong sentence (M2). The offensive angle has been cut to one 5 s shot in which a stick is put on a floor and nothing happens (M3). The trade against r4 is right in direction and slightly overdone; M3 offers a way to buy some back that also answers the owner's hook note.

## Major

### M1. Beat 1 hook: the printer is not the cause the trailer goes on to use

"Printer's jammed again." (erb :1649) is true and plain, but nobody in this episode works round a printer. The cause in the episode and in v31 is the slow file share. A first viewer gets a printer at 0 s, a title, a definition, and only at 17.7 s hears "The file share is slow." The hook carries tone and no story, so the script's own account of it ("it is the cause of the whole story", rubric F1 = 2) overstates it. I would score F1 at 1.

Fix, preferred (episode change, needs the dialogue review and a TTS top-up): add a third line to the `ca15_kettle` chatter pool, erb :1648-1651:

> "The share's crawling again."

(27 characters, fits a 9:16 burned caption on one line.) Record t19 on that line. Then the red card's VO no longer needs to state the cause and can state the response:

- v31 becomes: **"So staff take a shortcut."** (5 words, same window and figures as the current v31.) Caption: "So staff take a shortcut." (25)
- v32 drops its "So": **"The client files go to a personal inbox."** (8 words.) Caption: "The client files go / to a personal inbox." (19 / 20)

Fix, if no episode change is wanted: keep the printer line and v31 as written, and correct the rubric to F1 = 1 with the evidence "office grumble, sets tone; the cause arrives at beat 4".

### M2. v36 "Attackers count on that. Here, you plant one."

Three problems in eight words.

1. "That" follows v35, "Its program copied every folder it could reach." The nearest thing for "that" to mean is the copying. The script intends "someone plugging in a stick they do not know", which was two shots back.
2. Placed straight after the visitor's stick, it says an attacker was behind it. In the episode the surveyor's stick "had been in three other firms' laptops first" (erb :699): it picked something up on its travels. Nobody planted it and nobody was counting on anything.
3. "Plant" is not in the episode anywhere. The episode says "leave" every time (erb :5, :55, :889; ink red_stick). The chip `AUTHORISED TEST` covers the truth of it, but the verb is the trailer's own.

Fix:

> v36: **"Attackers leave sticks to be found. Here, you do."**

9 words, 1.78 w/s in the 5.05 s window; est. clip 4.01, ends 4.11 (lead 0.1), margin 0.94; gate 4.65; slow read 4.46, slack 0.19. Source: concept panel "A stick left to be found is often set to run the second it's plugged in" and "Whoever leaves a stick to be found..." (erb :671, :675). Captions: A "Attackers leave sticks / to be found." (22 / 12); B "Here, you do." (13). The line now describes the picture (a stick being left) and needs no antecedent.

Slack is thin. If the voiced clip misses the gate, take one beat from beat 5 (see M3 for why beat 5 can spare it once v32 loses "So").

### M3. Beat 9 and the offensive angle: the attack has no landing (with Q1 and Q2)

The course sells "play the attack, then defend". In r5 that is 5.05 s of 73 s: a menu opens, a stick lands by the kettle, cut. Nobody finds it. O1 at 2 is generous for a method shown without its result; I would give O1 = 1 and the total 13 or 14, not 15. Cutting five planted-stick shots to one was the right response to "a confusing train of half-concepts". Cutting the moment someone picks it up took out the one shot that shows why the trick works.

The owner's hook note ("extend the opening bubble to the whole line") shows the owner wanted Joanne's found-stick line heard whole. It does not have to be the hook to be honoured. Proposed **Variant C** (the default structure, with the line as the payoff of beat 9):

- Beat 9 becomes 10 beats (6.32 s) in two shots of 5 beats each, cut on the beat.
  - 9a, 3.16 s: the drop, as r5 (t11b, in = `drop_land` - 2.0). VO v36c **"Attackers leave sticks to be found."** (6 words, est. clip 2.73, lead 0.1, ends 2.83, margin 0.33; slow read 2.97 misses the 2.76 gate by 0.21, so this needs either a measured clip or a sixth beat for 9a taken from 9b).
  - 9b, 3.16 s: Joanne finds it, her bark whole: **"Someone's dropped a memory stick. Whose is this?"** (erb :1595, cached; r4's window was t11 40.93 to 45.35 with the line starting at 42.82). No narrator. 9:16 caption "Someone's dropped a memory / stick. Whose is this?" (26 / 21). Chip stays `AUTHORISED TEST`.
- The two beats come from after the music drop so b28 stays the cut into the red card: beat 5 from 9 to 8 (v32 without "So", 8 words: gate 4.55, slow read 3.96, slack 0.59) and beat 11 from 11 to 10 (v38 gate 5.82, slack 0.37; this uses up the beat the script holds in reserve for Nilesh in beat 12, so t09c's line must come in under 7.08 s).
- "Here, you do" is lost in C. The `ATTACKER` tab and the learner's own hand on the menu carry "you".

What C costs: the stick thread grows to four shots and about 17.7 s against 15.2 s for the email, so the stick is last but no longer smallest, against the integrator's direction. What it buys: the whole line the owner asked for, a living-office moment (F4), and the attack seen to work (O1 back to 2, O2 to 3, since the bark is the kindness the concept panel names).

Recommendation: put A (r5 default with the M2 line) and C to the owner side by side. My pick is C if 9a's VO measures inside its gate, otherwise A. Not B: B opens on a stick before the term is named, which is the confusion the owner described.

### M4. Beat 6: the picture must not be recorded before the consequence text lands, and nothing in the take checks it

v33 "That inbox gets broken into. IT never knew the copy was there." is true of the proposed text ("...IT had never known the copy was there...") and not of the current page, which still reads "broken into with a reused password" (erb :691). The script says so, but t16's asserts (section 6) do not guard it, so a t16 recorded early would put a password story under a visibility line, readable at zoom 2 for 6.3 s.

Fix, add to t16's row in section 6:

> Assert card 1's consequence contains "never known the copy was there" and does not contain "reused password". Fail the take otherwise.

Also add to section 9, change 1: the new text is about 35 words longer than the old on a page the script measured as fitting a 960 x 540 crop "with 16 px spare". Re-measure the page height on t16 before fixing the zoom; fall back to 1 / 1.125 / 1 if it no longer fits.

The proposed wording itself is good. One trim that keeps it inside the old height: "Months on, the personal inbox was broken into. The client files were still in its sent items, and IT had never known the copy was there. The client got a convincing fake invoice built from them." (drops "so nobody could protect it or take it back", which v33 does not need).

### M5. Beat 11: the Benmoor message is held open and readable for 5 s

The recipe's spoiler rule puts on screen "the lure (pattern level, never a readable worked lure that could be lifted)" and "the triage list before any verdict". The script holds the list for 1.9 s and the opened message for 5.05 s at zoom 1 and states "the body is the lure and fine to show". The body ("we've posted you a branded USB stick with our full catalogue... Plug it in to browse the range", erb :410) is a complete worked lure. The risk of anyone lifting a trade-show giveaway email is small, but the script contradicts the recipe without arguing the case, and the list is the better sell anyway: six subjects, mixed kinds, which is what "Your call" promises.

Fix, reverse the proportions (same take, same beats):

> t06b: list held 4.6 s, then the Benmoor row opened and held 2.5 s. Beat 11: in = `list_shown` + 0.10; the message opens at about 4.4 s into the shot. v38's "A free upload site." and "A stick in the post." both fall over the list, where both subjects are readable ("Too big for email? Upload it here, free"; "...here's our catalogue on a USB"); "Your call." falls as the message opens.

If the owner is content with the body readable, record that as a decision against the recipe line.

## Minor

**m1. v35 "every folder it could reach".** The page under it reads "copied the folders it could reach" (erb :699). "Every" is the trailer's emphasis and the caption will sit over the game's plainer wording. Fix: **"Its program copied the folders it could reach."** (8 words, figures unchanged.) Caption: "Its program copied the / folders it could reach." (22 / 24)

**m2. v34 "An unknown device in a work laptop."** True (erb :55, :616). "In a work laptop" reads oddly for anything that is not a stick, and the next sentence is what makes it a stick. Better if a beat is free: "An unknown device, plugged into a work laptop. Even a USB stick." (12 words; slow read 5.94 misses the 5.82 gate, so it needs an 11th beat.) Otherwise leave as written.

**m3. Rubric A1 evidence misstates the game's order.** The script says "Game order kept (choices, where they led, the attacker's side, the inbox...)". The stages are brief, mistake, flip, defend (erb :561-566) and the drop is the step-away after `mistake` (erb :779), so the game runs choices, attacker's side, where they led, inbox. The script's own t16 dismisses the step-away panel before the reveal. The trailer's order is a fair reordering. Fix the evidence: "Reordered for clarity: each cost follows its pick, and the attacker's side moves from before the reveal to after it. In the game all four costs share one page."

**m4. "The same two tricks" (section 1, item 6).** The posted stick is the visitor's stick again. The free upload site is a cousin of the personal inbox (work files somewhere IT has not approved), not the same trick. The proposed rule "the defend half opens the trick shown in the attack half" is met by the stick only. Fix the prose to "two more of the same kind"; v38 itself can stay.

**m5. v38 names two risky items and no safe one.** Both named items are `isPhish: true`; the two safe rows are not mentioned. This stays at pattern level and gives no tell, and after beats 5 to 8 the viewer already knows which way these go. Accept, and note it as a judged exception so a later round does not reopen it.

**m6. Beat 3 shows two definitions at once.** The panel reads "staff using devices, apps, accounts or services that IT doesn't know about or hasn't approved"; the caption reads "the shortcuts staff take that IT doesn't know about". Both are true. At 16:9 zoom 2 the panel is readable and a silent viewer reads two sentences in 7 s. Accept; if the timing reviewer finds it crowded, hold the caption on screen for the whole shot and leave the panel as texture at zoom 1.

**m7. Beat 3 on-screen text "Only the inbox is scored."** Not a score, as the script says, and fine. The brief also promises "the attacker's side, leaving an unlabelled USB stick" before the term is defined in VO; harmless, no action.

**m8. Beat 1 fallback puts a stick in the hook.** The t11 fallback has the dropped stick at the learner's feet and a black edge (Q7). That reintroduces what the restructure removed. Fix: no fallback for beat 1; if t19 cannot be recorded, hold the open card for the hook's beats.

**m9. Nilesh's line and the defend-only variant (not checked further).** "That's shadow IT for you..." is at ink :65 of the full episode. A grep of `scenarios/ca15_shadow_it_defend/ink/nilesh_solanki.ink` finds no "tell us" line. If the trailer also fronts the defend-only variant on a course page, its closing line is not in that variant. One for the integrator to confirm.

## Truth table

| id | Verdict | Note |
|---|---|---|
| v1 | true | series line |
| v30 | true | erb :5, :657, scope note :560; 9-word definition |
| v31 | true | erb :578 "crawled to a halt" |
| v32 | true | erb :588 |
| v33 | true of the proposed text only | M4 |
| v34 | true | erb :616, :55; wording m2 |
| v35 | true, inflated by "every" | m1 |
| v36 | misleading as placed | M2 |
| v37, v11b | true | "here" keeps the shortcut inside the game |
| v38 | true | erb :360, :410; m5 |
| Nilesh, beat 12 | true, as written | ink :65, plays after the sort is complete |
| Niamh, beat 1 | true | erb :1649; relevance M1 |

## Hard rules

- VO rate: every line at or under 1.78 w/s. Pass.
- No em or en dashes in VO. Pass.
- Card and caption lines at most 28: checked each; "That inbox gets broken into." and "tell us rather than building" are exactly 28. Pass.
- UK English; CTA "Learn on Hacktivity.co.uk"; no "Break Escape". Pass.
- No narrator over a character line: beats 1 and 12 are narrator-free. Pass. (Variant C keeps 9b narrator-free.)
- No narration over verdict buttons: beat 11 hides the verb row before v38. Pass. Beats 5 and 7 narrate over the two-option choice cards; those are choices in an unscored stage, not verdict buttons, and the recipe's consequence-first sheet shows them. I read that as allowed; the integrator may want it written into the rule.
- No answers, tells, tallies: the trailer does show that `send_personal` and `plug_visitor` end badly. That is the premise of a consequence-first episode ("Where it led") and no inbox answer is given. Pass, with m5 noted.
- Advisory lines: one, Nilesh's (Q3 below).
- Proposed rules: term defined in 9 words; one stated lesson; two picks, both shadow IT; no in-game terms found in VO, cards, chips or tabs ("Six months later" is the game's heading and plain English). The "defend half opens the trick shown" rule is met by the stick (m4).

## Owner questions: recommendations

1. **The hook.** Keep the kettle hook and the stick after the definition; do not use Variant B. Offer the owner Variant C (M3), which plays Joanne's found-stick line whole at beat 9. This still sets aside the letter of an explicit owner note, so it must go to the owner as a choice between A and C with B shown as the literal reading of the note. Fix the hook line itself per M1.
2. **The attacker's side.** Keep it. It is the course's selling point and the only place the learner acts as the attacker. Make it land (M3) or at least fix its line (M2).
3. **Nilesh's "tell us" line.** Confirm. It is advice, and it is the allowed one stated lesson: it is the episode's habit line in a cast member's mouth, it answers no inbox item, and the recipe's consequence-first sheet already frames beat 9 "as a habit". Suggested rule wording: "One stated lesson, spoken by a cast member in the episode's own words, never by the narrator and never as kiosk text."
4. **Close tagline.** v11b. "Take the shortcut, see where it leads" straight after "tell us" would read as the opposite advice.
5. **v1c retired.** Agree. v30 names and defines in one sentence, and the open card has already shown the title.
6. **"Unknown device".** Keep the episode's words in VO. "Untrusted" and "network" are the owner's phrasing for the idea, and the trailer shows a laptop, not a network; saying "network" would describe something the picture does not show. If the owner wants "untrusted" seen, the cheapest true place is the chip: `AN UNTRUSTED USB STICK` (22) in place of `A VISITOR'S USB STICK`, with no episode change needed since a chip is the trailer's label.
7. **Black edge.** Moot if m8 is taken: no t11 fallback for the hook.

## Rubric, my scores

| Item | Script | Mine (r5 as written) | With M1, M2, C |
|---|---|---|---|
| F1 hook | 2 | 1 | 2 |
| F3 agency | 2 | 2 | 2 |
| F4 living world | 2 | 2 | 3 |
| O1 attacker method | 2 | 1 | 2 |
| O2 attacker reasoning | 2 | 1 (line points at the wrong thing) | 3 |
| O4 tone | 3 | 3 | 3 |
| P1 practice | 2 | 2 | 2 |
| Total of 21 | 15 | 12 | 17 |

A1 and A2 pass once M2 and M4 are in.
