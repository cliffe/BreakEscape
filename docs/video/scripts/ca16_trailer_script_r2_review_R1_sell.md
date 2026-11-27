# ca16 trailer script r2 (Insider risk): review R1, sell and truth

Script: `docs/video/scripts/ca16_trailer_script_r2.md` at 802641aee (27 Nov, 72.4 s). Checked against `scenarios/ca16_insider_risk/scenario.json.erb`, `ink/anjali_rao.ink`, `mission.json`, the defend twin (`scenarios/ca16_insider_risk_defend/`, erb and ink), the recipe `docs/video/recipes/course-trailer.md` and the round 1 review. Reviewer: sell and truth. No frames viewed, no takes run; picture claims are the script's own unless stated. New line timings use the script's formula (words / 2.33 + 0.15 s; slow read 0.495 s a word plus 0.3 s a stop).

Counts: **0 Blocker, 5 Major, 7 Minor.**

## Verdict

Revise, lightly. The structure answers the owner's note: the term is on a card and spoken by 17 s, three numbered cases follow, each with its consequence one cut later, and the lesson is said once. A first-time viewer can now say what insider risk is after one viewing, with or without sound. The Niamh bookend is a good idea and costs nothing.

What still muddles it is the third case. The chip says `ON PURPOSE` over a card where the learner picks "Reply to find out who's really behind it" and the harm that follows is done by an outsider. Nobody in the episode acts on purpose. The same case is also the only place the attacker appears, and the trailer gives their side no words. Fixing both in beats 8 and 9 does most of the work. The rest is one overstated consequence line ("on your record"), a fallback take that brings back the "report a colleague" reading, and a source claim that is out of date.

## Findings

| # | Rank | Where | Problem | Fix (exact wording) |
|---|---|---|---|---|
| 1 | Major | Beats 8 and 9, chip `3 · ON PURPOSE` | Truth and fairness. The card on screen is an outsider's offer and the highlighted pick is "Reply to find out who's really behind it", which is curiosity, not intent. The consequence is "more pressure, then a flood of sign-in prompts", done to the learner by the outsider. No insider in the episode takes money or acts deliberately; the episode's own wording is "nobody is in trouble for being approached" (`reportReply`, `noBlameLine`). With the chip as written, a silent viewer reads the learner's reply as the on-purpose act. The chip names a kind the footage does not show. | Chip on shots 8 and 9: **`3 · ON PURPOSE: THE OFFER`** (25 characters). It keeps the echo of the card's "Sometimes on purpose" and says that what is on screen is the approach, not the act. If the chip style cannot take 25 characters: **`3 · FOR MONEY`**. In "Why this order works", change "(accident, carelessness, on purpose)" to "(accident, carelessness, and the offer that starts the on-purpose kind)". |
| 2 | Major | v25, beat 9 | The attacker's side is missing. The course's selling point is the offensive angle, and this cut has one attacker in it (the buyer) who gets no reasoning at all: v3 states the offer and v25 "One reply, and the pressure starts." repeats the on-screen sentence from the victim's seat. The episode has the buyer's reasoning ready: replying "marks you as someone who might say yes" (`e16_offer.ifTrusted`), and "the same message often goes to several people" (`perFlagNote`). | Replace v25 with **"Reply, and they know you might say yes."** (8 words, one stop; est. 3.58 s; slow read 4.26 s; start 39.0, slow end 43.26, cut 43.6, gate 0.34 s; 2.2 words/s). Caption "Reply, and they know / you might say yes." (20 / 18). The picture keeps the consequence sentence, so VO and picture now say two different true things: what happened, and why the buyer did it. If the gate fails on the voiced clip, extend `led_offer` by 0.3 s from the 2 s of quiet in `concern`. |
| 3 | Major | v23, beat 5 | Truth and tone. "His wrong click goes on your record." reads as a mark on your personnel record. The episode says the HR drive was opened "under your name, on the record until it was explained", meaning the access log, and it was cleared up. The line as written tips a no-blame episode towards fear (rubric O4). | Replace v23 with **"His wrong click is logged under your name."** (8 words; est. 3.58 s; slow read 3.96 s; start 21.5, slow end 25.46, cut 26.5, gate 1.04 s; 2.2 words/s). Caption "His wrong click is logged / under your name." (25 / 16). |
| 4 | Major | Beat 12, `concern` fallback | Reporting-on-colleagues reading. The fallback `t04_concern_form` 10.65–15.85 shows the chips "A colleague has seemed to be having a hard week" and "A colleague on my team; I'd rather not say more than that" inside a report form, under the chip `WHAT YOU SAW`, one shot after "Facts, not a verdict". That is the exact reading the integrator asked to avoid, and the script says so itself. A fallback that undoes the round's main aim is not a fallback. | Make `t04c_concern_facts` and `t04d` **required**, and move them from "Retakes (preferred)" to "New take (required)". Replace the fallback cell with: "none. If the retake fails, crop the existing take to the What, When and Where groups so that neither colleague chip is in frame, and frame-check it." |
| 5 | Major | Sources paragraph (line 67), "Episode text changes requested" rows 1 to 3 | Truth dependency, and the script is out of date. At 802641aee the committed episode does not define insider risk anywhere, so v20 and v21 were unsupported. During this review the worktree held uncommitted edits (not mine, not staged by me) that add it: `strings.brief` and `scenario_brief` ("Insider risk is harm that comes from people who already have access: mostly by accident, sometimes on purpose."), Anjali's ink ("Insider risk is harm from people who already have access. Mostly it's an accident, now and then it's on purpose."), a "What insider risk means" debrief entry, and the "Harmless this time" rewrite, in both the episode and its defend twin. Once those are committed v20 and v21 are true of the episode. | Do not send v20 or v21 to voicing until those episode edits are committed. Then rewrite the sources sentence to: "v20 and v21 are the brief's definition (`strings.brief`, `scenario_brief`) and Anjali's second line (`ink/anjali_rao.ink`)." Mark rows 1 to 3 of the episode-changes table as made, with the commit hash. |
| 6 | Minor | v24, beat 6 | The card says Ross asks for "his accounts ... 'for the handover'". The VO says "A leaver wants the client list emailed home." "Client list" is the rumour's phrase ("taking the client list") and the wrong-answer chip "Ross is stealing the client list". Putting it in the ask tilts the viewer towards a verdict on Ross, under a chip that says carelessness. | Replace v24 with **"A leaver wants his accounts emailed home."** (7 words; est. 3.15 s; slow read 3.47 s; start 26.7, slow end 30.17, cut 31.0, gate 0.83 s). Caption "A leaver wants his / accounts emailed home." (18 / 22). v12 "The client list sat in a personal inbox." then lands as the reveal of what "his accounts" were. |
| 7 | Minor | v26, beat 10 | "Now report that offer yourself." can be heard as "report yourself", and the caption leaves "yourself." alone on its second line. | **"Now you report that offer."** (5 words, same timing). Caption "Now you report / that offer." |
| 8 | Minor | Chip `WHAT YOU SAW`, beat 12 | Next to a "Raise a concern" form, "what you saw" leans towards watching people. The four chips are all about a message sent to the learner. | Chip **`THE OFFER, AS FACTS`** (19 characters). It names the object of the report for a silent viewer and ties the form to the lesson card. |
| 9 | Minor | Chip `2 · BY CARELESSNESS`, and the two-kinds card against three chips | The card names two kinds ("Mostly accidents", "Sometimes on purpose") and the chips count three. "Carelessness" is a new abstract word mid-trailer. The episode's new debrief wording puts both first cases under "an accident or a careless favour". | Chip **`2 · A CARELESS FAVOUR`** (21 characters). Concrete, kinder, and the episode's own phrase. Leave the card and v21 alone: adding a third kind to the definition breaks the twelve-word rule, and "accidents" covers both in plain speech. |
| 10 | Minor | Beat 11, lesson card | "Facts, not a verdict" is three words held for 5.8 s, and it does not say where the facts go. With sound off only the caption carries "to the right person". | Build a second card line with the voice: line 1 "Facts, not a verdict" (20), line 2 at about 2.0 s into the shot **"To the right person"** (19). Suppress the burned caption on this shot as on `define`; keep the `.srt` cue. |
| 11 | Minor | Beat 13 row and sources paragraph | "the top rows are the offer, Reuben's login request and Ross's export". The set's order is Opportunities, Reuben, Quayholt Sign-in, Ross, IT Service Desk, Hana (`messages` order in the erb; the round 1 dry run agrees). Ross is fourth. v29 is still true. | Rewrite the row: "six unread rows in the set's order: the offer, Reuben's login request, a sign-in prompt, Ross's export, IT Service Desk, Hana. Nothing opened, no verdict buttons." Same correction in the sources paragraph. |
| 12 | Minor | Beats 4 to 9 against the "no answers on screen" rule | Each pick shot shows both options with the unsafe one highlighted, and its consequence follows at once. For a two-option card that gives the answer to three of the five opening choices. They are unscored (`mistake.scored: false`), the scored set is untouched, and the integrator asked for case then consequence, so I would not change it. The owner should know the rule is being read as "no answers to scored items". | No change to the cut. Add to "Rules followed": "The three opening choices shown are unscored; their outcomes are on screen by design. No scored item is opened or answered." |

## The judging questions

**Does a first-time viewer understand insider risk from VO and picture?** Yes, with finding 1 fixed. The definition is plain, it is on screen long enough to read, and the cases arrive numbered. The remaining risk is the third chip.

**Is "a colleague asks to borrow your login" an accident?** The ask is not, and lending is a favour. The accident is Reuben's wrong shortcut, which arrives one cut later in beat 5, in the picture and in v23. As a case of accidental harm it is fair: nobody chose the harmful act. It differs from case 2, where the act itself (the export) was chosen and the harm was not thought through. Keep `1 · BY ACCIDENT`, and keep "wrong click" in v23 and "clicked the wrong shortcut" in frame, because those words are what make the chip true.

**Is `ON PURPOSE` fair when nobody takes the money?** Not on its own. See finding 1.

**Does any line encourage staff to report colleagues?** Not in the primary cut. v26 gives the report an object (the offer), v28 says "not a verdict on anyone", v27 takes the detective role away, and Reuben and Ross are shown as requests, not suspects. Two places could still tip it: the `concern` fallback (finding 4) and the chip `WHAT YOU SAW` (finding 8). The inbox shot is safe because no verdict buttons show.

**Does the attacker's or insider's side come across?** Weakly. The offer card is the attacker's own voice ("We pay people at firms like yours ... 25% of what we make"), which is good footage, but no VO line gives their reasoning. Finding 2 adds it in eight words. The consequence-first recipe says these trailers never claim an attacker to play, and this script does not.

**Does it sell the course and end on the CTA?** Yes. v1 names the product, the cases show play with consequences, and the close plate reads "Learn on Hacktivity.co.uk" with v13 speaking the address. Niamh's unanswered ask before the close is the strongest sell in the cut: the viewer wants to answer it.

## Hard rules

| Rule | Result |
|---|---|
| No narration over verdict buttons | Pass. No verdict buttons in any shot, provided the inbox retake or its crop holds. |
| No answers, tells, advisory lines or tallies | Pass with a note (finding 12). "0 of 6 sorted" must be out of frame in beat 13; the script handles it. The trimmed consequence lines drop the advisory second sentences. |
| VO at most 3.0 words/s | Pass. Highest is v12 at 2.7; my replacement lines are 2.2. |
| No em dashes in VO | Pass, including the replacements. |
| At most 28 characters a card or caption line | Pass. Longest is "Facts to the right person," at 26. Replacement captions and chips are 25 or fewer. |
| UK English | Pass. |
| No "Break Escape" on screen | Pass. |
| CTA "Learn on Hacktivity.co.uk" | Pass (close plate). |

Proposed rules: the term is defined in twelve words (counted); one stated lesson (v28, with v27 as reassurance); no in-game terms in VO, cards or chips; the defend half opens on the offer, the last case shown. All four hold.

## Facts checked (true as written)

- Hook and end line: barks at `scenario.json.erb:967` and `:1010`, word for word.
- v22 and beat 4: the Reuben card and its unsafe option label (`:458`).
- Beat 5 on-screen sentence: first sentence of `flipMontageByChoice.shared_login.log_in_for_him`, unchanged by the in-flight "Harmless" rewrite.
- Beat 6 card and pick label; v12 and beat 7: first sentence of `leaver_favour.personal_email`.
- v3 and beat 8: the offer card and the "Reply to find out who's really behind it" label; beat 9: first sentence of `outside_offer.engage`.
- v26: the form's required fact is the offer (`fc_offer_what`, `required: true`); the brief also says "report what's offered to you", so naming the report gives away nothing the episode does not.
- v28: "Concerns go to the right person as facts, not a verdict on anyone." (debrief, "Three things to keep").
- v27: "Your job is not to solve anything" (brief).
- v29: the inbox holds the offer, Reuben's login request and Ross's export again.
- The four fact chips in beat 12 are the four offer chips; the conclusion chips never show.
- Total 72.4 s re-added from the shot lengths.

## Owner questions: recommendations

1. **Definition wording.** Keep it word for word. It is twelve words, it matches the brief text now being added to the episode, and "Mostly accidents" takes the sting out of "harm from people" in the next breath.
2. **Hook.** Keep the swap to Niamh. The Anjali line set up a hunt for the leaver, which is the muddle the owner named. Niamh's line is quieter as a hook, but it buys the ending.
3. **Chips that name the kind.** Keep the three chips; they carry the idea with the sound off. Change the third to `3 · ON PURPOSE: THE OFFER` (finding 1) and the second to `2 · A CARELESS FAVOUR` (finding 9). `ON PURPOSE` alone is not fair on a case where nobody takes the money.
4. **Definition on a card.** Card. The owner's complaint was clarity, and a definition spoken over a choice card asks a silent viewer to read two things at once. 8.3 s is the price and it is worth paying.
5. **Hiding the two "colleague" chips.** Hide them, and make the retake required (finding 4). Showing the form as the learner meets it would be more literal, but those two chips are there in the game to be left out, and a trailer cannot explain that.
6. **The inbox shot.** Keep. It shows there is more to play, it is the only look at the scored half, and it sets up Niamh's ask as "the same request, in person".
7. **Close.** Keep v13 and the tagline. The lesson is stated once at beat 11; the close should sell the play and give the address. It also saves a voicing.
8. **Rules.** Confirm all three, plus the twelve-word definition. Add the reading in finding 12 to the "no answers" rule. Voicing waits on two things: the episode definition edits being committed (finding 5), and the line changes here, since v23, v24, v25 and v26 are all still to voice.

## Rubric (trailer subset, 0 to 3)

| Item | Score | Evidence |
|---|---|---|
| F1 hook | 2 | "Hang on, my screen's thrown me out." is ordinary, but it opens a story the last shot finishes. |
| F4 living world | 2 | Niamh gets up, walks over and asks, at both ends. Between them it is all panels; round 1's Darren and Anjali shots are gone. |
| O1 attacker's goal and method shown | 2 | The offer card in the buyer's own words, and the sign-in prompt flood as their next move. |
| O2 attacker reasoning visible | 1, 2 with finding 2 | No line explains why the buyer wants a reply until v25 is replaced. |
| O4 tone | 2, 3 with findings 1 and 3 | "On your record" and an `ON PURPOSE` chip over the learner's pick both lean towards blame. |
| A1 accuracy | 2, 3 with findings 1, 3, 5 and 11 | Every quoted card and line checks out; the chip, one VO line, the definition's source and the row order do not yet. |
| A2 safe takeaway | 3 | No tells, no scored answers, no tally. |
| P1 see it play out | 3 | Three choices each followed by where they led, then the same request walking up to the desk. |
