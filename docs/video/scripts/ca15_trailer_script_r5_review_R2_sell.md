# ca15 trailer script r5 rev R1: review R2, sell and truth

Reviewed: `docs/video/scripts/ca15_trailer_script_r5.md` at 88bf08fd0, against `scenarios/ca15_shadow_it/` and `scenarios/ca15_shadow_it_defend/` as they stand on `video/ca-trailers-15-01` (cf31e6c5d, 8dabd5955, 36378d2a7, a5ff69226). The R1 review files were not read. 27 Nov.

**Counts: 0 Blocker, 3 Major, 8 Minor.**

Verdict: the order now works. A first viewer gets the cause, the term with a definition, two shortcuts each followed by its cost, the attacker's side, a turn of their own and one lesson. Every VO line, chip and card checks out against the episode (table at the end). Three things still need fixing before voicing: the attacker beat never says the learner is the attacker or why the trick works, the close line will not fit its window, and the defend half opens on a trick the first half did not show.

## Major

### M1. Beats 9a and 9b: Variant C shows the drop and the find, and leaves out both "you" and "why"

Variant C is the right default (see owner question 1), but as written the course's selling point rests on one possessive in a chip. The VO is a fact about attackers ("Attackers leave sticks to be found."). The only sign that the learner is the one doing it is "YOUR" in `YOUR AUTHORISED TEST`, read alongside a tab, a two-line caption and a walking figure in 3.79 s. A first viewer can take the shot as an illustration of what attackers do, which is the reading the recipe exists to prevent ("the learner builds the attack first").

The second gap is the reasoning. Rubric O2 is scored 3 on "the kindness the concept panel names", but kindness is not on screen or in VO anywhere in the cut. Joanne's "Whose is this?" implies it only to someone who already knows how a USB drop works. Rubric O1's evidence ("it lands") means the stick landing on the floor; the attack itself does not land in this cut, because the plug-in bark (erb :1614) is out.

The cliffhanger is fine. Beats 7 and 8 have just told the viewer what a stick can do, so cutting on "Whose is this?" works as "see where it leads". It needs the two missing ideas put on screen, and both fit in the chips at no cost in beats:

- 9a chip: `YOU TRY IT: AUTHORISED TEST` (27) in place of `YOUR AUTHORISED TEST`. A verb where there was a possessive; "authorised" stays for A2.
- 9b chip: `KINDNESS DOES THE WORK` (22) in place of the repeated `YOUR AUTHORISED TEST`. Nilesh's own words, ink :92 "Kindness does the attacker's work." It is attacker reasoning at pattern level, not a tell of any inbox item and not advice.
- v36c stays as it is: "Attackers leave sticks to be found."
- Rubric: O1 evidence to "The learner leaves the stick and a colleague picks it up; the plug-in is left as the cliffhanger". Keep O1 at 2. O2 holds at 3 only with the 9b chip; without it, 2.

Not recommended: swapping 9b's line for "I'll just plug it in and see whose it is." (cached, 2.280 s, fits 5 beats). It lands the attack, but the owner asked for the found-stick line whole, and a third shot brings back the long stick thread of r4.

### M2. Beat 13: v11b will not fit a 10-beat close

The table estimates v11b at 4.87 s (11 words, "Hacktivity.co.uk" as one word). The cached v11, "Take the shortcut, see where it leads. Learn on Hacktivity.co.uk.", is one word shorter and measures 5.760 s. Silence detection on `Sulafat_v2/trim/v11.mp3` puts "Learn on Hacktivity.co.uk." at 2.80 to 5.76, so the call to action alone is 2.96 s. v11b adds "here" and turns the comma into a full stop: expect 6.1 to 6.3 s. The gate is 5.82 s and the shot (and the video) ends at 6.32 s. The line would end on or after the last frame. Section 10 question 4 already quotes the 5.760 s figure, so the two parts of the script disagree.

This comes from the adapted disposition of Sell M3, which took the eleventh beat off the close.

Fix, all three parts:

1. Close back to 11 beats (b105 to b116, 66.32 to 73.26, 6.95 s; gate 6.45 at lead 0.2, 6.55 at lead 0.1).
2. v11b text with a comma, as v11 has it: "Take the shortcut here, see where it leads. Learn on Hacktivity.co.uk." The card is unchanged.
3. The beat comes from beat 11, which goes to 9 beats (M3 below). Beat 12 becomes b93 to b105 (58.74 to 66.32), still 12 beats.

Reserve if v11b still measures over 6.45 s: VO "Take the shortcut here. Learn on Hacktivity.co.uk." (about 4.8 s), with "See where it leads" carried by the card alone.

Also correct the estimate rule in section 3: any line containing the URL adds about 2.4 s over the one-word count.

### M3. Beat 11: the defend half opens on a trick the first half did not show

Proposed rule 4 says the defend half opens the trick shown in the attack half. v38 opens with "A free upload site." The free-app card was cut from this version, so the first thing the viewer hears under `YOUR TURN` is new, and the stick they have just watched for 18 seconds comes second. The inbox itself opens with a posted stick (erb :317, first row, "A padded envelope came in for you, marked from the client"), so stick-first is also the truer order.

A smaller point on the same line: "Your call" is the game's own verdict tag (`flip-view.js` :61, `flipMontageTagUnsafe`), which section 5 keeps off screen. The VO and caption C then say the same two words.

Fix: v38 becomes "A stick in the post. A free upload site." (9 words). In a 9-beat window (5.68 s): 1.58 w/s, lead 0.2, est. clip 4.01, ends 4.21, gate 5.18, slow read 4.46 (slack 0.72). Captions A "A stick in the post." (20), B "A free upload site." (19). The hand-over is already made by the blue card and the `YOUR TURN` tab. Beat 11 is the list only for 9 beats (t06b in = `list_shown` + 0.10, out + 5.68); see owner question 8. The v38f reserve becomes "Sticks by post, free uploads." (5 words).

## Minor

### m1. Beat 4, v31: "So" has lost its premise

"So staff take a shortcut." follows v30's definition, 13 seconds and a title card after the hook. In VO it reads "Shadow IT: the shortcuts staff take... So staff take a shortcut." The cause was one bubble at the top of the trailer. Restate it in the same five words: v31 "Slow share? Take the shortcut." Caption "Slow share? / Take the shortcut." (11 / 18). Same window, same gate; it also says the red card's words. Voicing note: question lift on "share", then flat.

### m2. Beat 8, v35: tense

v32 and v33 are in the present ("go", "gets broken into"); v35 drops to the past. v35 "Its program copies the folders it can reach." (8 words, unchanged timing). Caption "Its program copies the / folders it can reach." (22 / 21).

### m3. Beats 6 and 8: a warn-colour edge is still on the consequence

`awareness-skin.css` :224 gives a taken, unsafe montage item a left border in `--aw-warn`. The script hides the labels and tags but not this. Add to t16: set the item's `border-left-color` to the neutral panel border before each reveal, and assert no `.aw-montage-tag` is visible.

### m4. Beat 11, "not to be reopened"

The v38 truth check says the exception (both named items are the risky kind) is closed. After beats 7 to 9 the viewer knows which way a stick in the post goes, so the line does lean on a scored item. I agree with keeping it: the episode brief says the same at pattern level. The script should record that as an owner-visible judgement and drop "not to be reopened".

### m5. Section 2, balance paragraph: the sum hides that the shortcuts are equal

The two shortcuts are the same length: email pick and cost 18 beats (11.4 s), device pick and cost 18 beats (11.4 s). The 14.5 against 18.3 figure comes from charging the red card to the email and the attacker's side to the stick. Rewrite the paragraph as: red card 3.2 s, email 11.4 s, device 11.4 s, attacker's side 6.9 s. That reads right. The attacker's side is under a tenth of the trailer and should not give up another beat.

### m6. Section 8, Variant A

With M2 applied the default close is 11 beats, as in Variant A. Update Variant A's beat sum and note that its chip would also need the M1 verb (`YOU TRY IT: AUTHORISED TEST`), since "Here, you do." is then said twice.

### m7. Episode: `mission.json` still says "Only the sort is scored"

`scenarios/ca15_shadow_it/mission.json` :3 ends "Only the sort is scored, and reporting when you're unsure is always fine". Both briefs were changed to "Only the inbox is scored" at 36378d2a7. The description sits on the course page beside the trailer. Change to "Only the inbox is scored, and reporting when you're unsure is always fine and never marked down."

### m8. Section 1, step 6 and house rules

After M1, step 6 should read: "The attacker's side, two short shots. 'Attackers leave sticks to be found.' The chip says the learner is trying it; a colleague finds the stick, and the chip gives the reason it works." Add "Your call" to the banned list in the house rules (m3 of this review and M3).

## Choice cards in beats 5 and 7: not verdict buttons

The claim holds for these two cards. `mistake.scored` is false (erb, `awarenessEpisode.mistake`). The card renderer never marks an option: `consequence-sandbox.js` :15, "Nothing is scored and nothing says which option is the safe one", and the picked style (`.epr-sbx-picked`, `episode-runner.css` :224) is the neutral accent on either option. The legend is "What do you do?" and the only button is Next. Narration over them is within the rule.

Two conditions, both already in the take spec and worth keeping as asserts: the "Choice N of 4" header hidden, and no montage tag ("Your call", "Your call: the safe route") in beats 6 and 8, where the judgement does appear in the game. Add m3's border.

The unpicked safe option is legible in 16:9 on both cards ("Ask Nilesh about remote access...", "Ask them to send the drawings through the firm's file-sharing link instead"). That is fine: the items are unscored, and it shows the approved way exists.

## Adapted dispositions

| id | Judgement |
|---|---|
| Sell M2 (chip carries "you") | Not enough as adapted. See M1: a verb on the 9a chip. |
| Sell M3 (Variant C, beats from 5, 11 and 13) | C is right. The beat from 13 breaks the close (M2). The beat from 5 is fine: 2.6 s to read the card, 2.45 s after the pick. |
| Sell M5 (opened message at 1.82 s) | At 1.82 s the message is neither read nor understood; drop the open (M3, question 8). |

## The proposed rules, as this script meets them

| Rule | State |
|---|---|
| Term defined in 12 words or fewer | Met: v30, 9 words after the term |
| One stated lesson | Met: Nilesh, beat 12, and nothing else gives advice |
| No in-game terms | Met on the banned list; "Your call" slips through (M3) |
| Defend half opens the trick shown in the attack half | Not met until M3 |

## Owner questions: recommendations

1. **C or A.** C, with the M1 chips. A scores lower and drops the one shot where the office reacts. B no.
2. **Keep the attacker's side.** Keep. It is 6.9 s and the only part no other awareness trailer has.
3. **Nilesh's line as the stated lesson.** Confirm, with the suggested rule wording plus "spoken and captioned". It is the habit line in a cast voice, true to ink :65.
4. **Close tagline.** v11b, with the comma and 11 beats (M2). Cached v11 straight after "tell us" reads as the opposite advice; "here" fixes that.
5. **v1c retired.** Yes.
6. **"Unknown device in a work laptop".** Keep the episode's words in VO and keep `A VISITOR'S USB STICK`: it tells the viewer whose stick it is, which the "untrusted" chip does not. "Even a USB stick" already answers the owner's note.
7. **Black edge in 16:9.** Do not ship the fallback. If t11b cannot be recorded, use the t11 window at zoom 1 only for a review render.
8. **Opened lure in beat 11.** Do not open it. The list alone for 9 beats lets both named subjects be read, and a paused frame of the message would be a readable worked lure, which the recipe rules out.

## Truth check, line by line

| Item | Episode source | Result |
|---|---|---|
| Hook, Joanne "The file share's crawling again." | erb :1583, `ca15_kettle` pool, third line | true |
| v30 | erb :5 and :657 (brief), scope note "the shortcuts staff take round IT", ink :68 | true |
| v31 / red card | card 1 situation, "The share has crawled to a halt" | true |
| v32, chip `PERSONAL EMAIL` | `send_personal`, "Send the client files to your personal email to finish at home" | true |
| v33, chip `SIX MONTHS LATER` | `flipHeading`; erb :691 "IT had never known the copy was there" | true |
| v34, chip `A VISITOR'S USB STICK` | `plug_visitor`; "unknown device" in the aim text, ink :87 and the PC's observation | true |
| v35 | erb :699 "carried a program that ran on yours and copied the folders it could reach" | true |
| v36c | concept panel, "Whoever leaves a stick to be found gets a way onto a work machine" | true |
| Chip `YOUR AUTHORISED TEST` | brief "authorised exercise"; aim text "Nilesh's test"; ink :86 to :89 | true |
| 9b, Joanne "Someone's dropped a memory stick. Whose is this?" | erb :1596 | true |
| v38 | rows erb :317, :354, :402 | true; order and "Your call" in M3 |
| Beat 12, Nilesh | ink :65, shown once the sort is complete | true |
| v11b | series tagline plus "here" | true; timing in M2 |
| Defend-only twin | no kettle pool, no drop, no ink :65 line | as the script's integrator note says; beats 1, 9 and 12 are not in that variant |

House rules checked: no em or en dashes in VO; every card and caption line 28 characters or fewer (the two new chips are 27 and 22); UK spelling; no "Break Escape"; plate "Learn on Hacktivity.co.uk"; no narrator over beats 1, 9b or 12; all VO at or under 1.74 words a second.
