# ca15 trailer script r4 (owner round r2, rev R1), review R2: sell and truth

Script reviewed: `ca15_trailer_script_r4.md` at b7bdeed7a. Read fresh, without the R1 review files. Checked against the episode text where a fix line has to be true (`scenarios/ca15_shadow_it/scenario.json.erb`, `ink/nilesh_solanki.ink`).

Counts: 0 Blocker, 3 Major, 8 Minor.

## Verdict

The line of thought now holds together. A first-time viewer gets a name (Shadow IT), a definition (shortcuts round IT), three examples that rise in risk, a found stick, a reveal that the stick was theirs, a reason the drop works, and a turn on the other side. That answers the owner's brief far better than r1. The jargon is gone from VO, cards, chips and tabs.

There are three Major gaps. The trailer never says what a plugged-in stick does, so the danger the owner asked for ("even USB sticks can be a danger") stays implied. The blue card's VO, "You sort what's waiting.", is the one vague half-concept left. The close tells the viewer, as an instruction, to "Take the shortcut" right after 50 seconds arguing that shortcuts are openings.

Hard rules: no em or en dashes in VO; every line is under 3.0 words a second; cards, chips and captions are 28 characters or fewer a line; UK English throughout; no "Break Escape" on screen; the close plate reads "Learn on Hacktivity.co.uk". Verdict buttons: the inbox verbs and counter are hidden, so v28 is clean. The choice cards in beats 5 to 7 need one check (m8).

## Major

### M1. Beats 10 to 12: the stick's danger is never said

**Problem.** The owner asked for the trailer to say that even USB sticks can be a danger. The picture shows Joanne plugging the stick in (beat 9). The VO reveals "You left that stick" (beat 10), and Nilesh says the drop relies on kindness (beat 11). Nobody says what plugging it in does. A viewer who doesn't already know why USB sticks are a risk comes away thinking the problem is nosiness or lost property. That is the "half-concept" pattern the owner rejected in r1. It is also the gap in the attacker angle: the rubric already marks O1 down because the payoff is missing. The episode states the payoff plainly: "She opened a file to find the owner, and our tracker reported home. A real stick would have run its payload right there." (erb :220), and Nilesh calls the stick "a safe tracker... It only tells us who opened it." (ink :85).

**Fix (preferred, no grid change).** Rewrite v18b so the reveal carries the payoff in attacker terms:

> v18b: "Now you're the attacker. Your stick, your code." (8 words, same count and gate as now, 3.92 s)

Caption: "Now you're the attacker. / Your stick, your code." (24 / 21). Voice it with a small pause after "attacker" and another after "stick". It plays over the drop, right after the viewer has seen Joanne plug the stick in, so "your code" lands as "and it ran on her PC". It is true of the episode: the stick carries the test team's tracker, which ran when she opened it, and the `AUTHORISED TEST` chip keeps it honest that this one was safe. "You left that stick" is still read from the picture: "your stick" over your own hand dropping it.

**Fix (alternative, if the owner wants "You left that stick" kept).** Keep v18b and add a line after Nilesh in beat 11, taking 3 beats from beat 12 (v27 still fits 4 beats, 2.53 s, gate 2.03 at the measured mean: tight, so re-voice brisk) and beat 14:

> v29: "A real one would have run its code." (8 words, true to erb :220)

This costs grid work and list hold, so the first fix is better.

### M2. Beat 13: "You sort what's waiting." is vague and doesn't match its card

**Problem.** The card reads "You sort the shortcuts" and the VO says "You sort what's waiting." Waiting where? It is a cached r3 line that worked when the r1 cut had a deadline story; here it has no referent, and the ear and the card say two different things at the hinge of the trailer. Of all the lines in the trailer, this is the one most like the "train of half-concepts" the owner complained about.

**Fix.** New line, same length as v15 (4 words, measured 1.42 s for the old clip, gate 2.03):

> v15b: "Now you sort them."

"Them" picks up "one shortcut" from v27 and the card's "the shortcuts". It names no verbs and gives no answers. Still no burned caption: the card carries the words. Voicing is covered by the 22 Nov standing yes; it needs a new id so the cached v15 clip stays on disk.

### M3. Beat 16: the close tells the viewer to "Take the shortcut"

**Problem.** The last spoken imperative of a Shadow IT trailer is "Take the shortcut", 20 s after "An attacker only needs one shortcut." A viewer who has not played reads it as advice, and a buyer from a security team may read it as a joke at their expense. Section 8 Q4 already raises it with the owner. The fix is one word, so it should go to the owner as a recommendation, not just an open question.

**Fix.** Put the shortcut inside the game:

> v11b: "Take the shortcut here. See where it leads. Learn on Hacktivity.co.uk." (11 words, est. 4.87 s + 0.15, window 6.95 s, about 1.7 s margin)

Close card: "Take the shortcut here ·" (24) over "See where it leads". If the owner wants the series tagline unchanged across episodes, keep v11 and say so in the review-page note. Then the risk is the owner's call, made on purpose.

## Minor

### m1. Beat 4: the definition leaves out why Shadow IT matters

v22 "When staff take shortcuts round IT." is clear and keeps the owner's word. It leaves out the half of the NCSC definition that makes it a risk: the assets are unknown to IT. That half is also the attacker's opening: what IT can't see, IT can't patch, watch or take back. Same length:

> v22: "When staff take shortcuts IT can't see." (7 words, est. 3.15 s, under the 3.29 s gate)

Caption: "When staff take / shortcuts IT can't see." (15 / 22). If v22 stays as it is, rebreak the caption to "When staff take / shortcuts round IT." (15 / 17): the current "round IT." orphan (25 / 9) splits the phrase.

### m2. Beat 12: "only needs one shortcut" against a page that shows two

The consequence on screen needs both the files in a personal inbox and a reused password. So "only needs one shortcut" overstates what the evidence on screen shows, and it leans on the "attackers only need to be lucky once" trope. The `ATTACKER` tab also sits over a break-in that "you" did not do, straight after "Now you're the attacker", so some viewers will read the inbox break-in as theirs. A general line in the third person solves both problems:

> v27: "An attacker goes looking for shortcuts." (6 words, gate 3.92)

Caption: "An attacker goes looking / for shortcuts." (24 / 14). If v27 stays, it is defensible: the reused password belongs to the personal account, which only exists because of the shortcut.

### m3. Beats 7 and 8: the "Even" escalation is undercut

Beat 7 is already a USB stick (the visitor's), so "Even a found USB stick." in beat 8 escalates from a stick to a stick. What actually sharpens is the owner: a known visitor, then nobody. Say that in v25 and let the chip carry the owner's word:

> v25: "A visitor's device, on the work network." (7 words)

Chip: `UNTRUSTED DEVICE` (16) in place of `SOMEONE ELSE'S DEVICE`. v26 then reads as the step from someone you know to nobody at all. If the owner wants the spoken word "untrusted" kept, leave v25 and just change the chip, so that the chip and VO repeat each other's words rather than giving two names.

### m4. Beat 6: comma and a second "personal"

"A free app, on a personal account." The comma makes the voice pause where speech wouldn't, and v23 has already used "personal". The card says the rota lives on "a former temp's personal account", which is the sharper fact, because nobody at the firm controls it:

> v24: "A free app on a leaver's account." (7 words)

Caption: "A free app on a / leaver's account." Keep "former temp" if the owner finds "leaver" too HR. Do drop the comma.

### m5. Beat 14: "Posted sticks" is hard to catch by ear

"Posted sticks" can be heard as "post-it sticks", and nothing in the trailer has shown a stick arriving by post. At the same length:

> v28: "Sticks by post, free tools, ways round IT." (8 words, fits both grids)

Caption: "Sticks by post, free tools, / ways round IT." (27 / 14).

### m6. Beat 14: the opened Benmoor message held readable for 3.8 s

One opened item is allowed, but it is legible at 1.125 for 3.78 s. Before accepting t06b, check the frames for a tell (sender address, the note's wording, any "from the client" claim the debrief later picks apart). If one is readable, hold the list instead and open no row, or box the tell line.

### m7. Beat 10: "Drop here" and the menu

The header box covers RED-TEAM STICK. The menu item "Drop here" stays, which is fine and plain. Check that the menu shows no second item that names the kit ("Give to..." or the item description); if it does, extend the box to the whole menu, not only the header.

### m8. Beats 5 to 7: VO over the choice options

v24 and v25 start 0.2 s into shots that open 0.6 s before the pick, so the narrator speaks while both options are on screen. The options are choices, not verdicts, so this passes the rule as written. Confirm on the t16 frames that picking adds no "Your call" tag, mark or colour that reads as a verdict while v23 to v25 play. If it does, hide it with `hideText` in t16 as you do for the header.

## Checked and fine

- The hook: the whole of "Whose is this?" in the bubble, a mystery that pays off at the reveal. The best first five seconds of any r-version.
- "Nobody was careless there. She was being kind, and that's what a drop relies on." Attacker reasoning in plain words, no blame. Keep.
- Fatima's ask at the end of the defend half. It leaves the viewer holding a question, which sells the course better than an answer would.
- v1 "Security awareness training you can play." This is the only line that sells play directly, and it is enough with the reveal doing the rest.
- Truth of v23 to v26 against cards 1, 3 and 4 and Joanne's PC bark, as listed in section 3.
- The rewind is stated in VO, so the reorder is honest (A1 holds).
