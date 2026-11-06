# Player test, step 3: fixture D "Night train"

Plan read: `DEDUCTION_IMPLEMENTATION_PLAN.md` at 3327 lines, latest §14 entry "Round 4 outcomes" (the same
version the packet and answer file cite). Read only, not edited.

Inputs: `player_packets/fixture_D.md`, `player_packets/fixture_D_answer.md`,
`player_runs/fixture_D_careful.md`, `fixture_D_hasty.md`, `fixture_D_newcomer.md`.

## 1. Verdicts against the truth

| Passenger | Truth | Careful | Hasty | Newcomer |
|---|---|---|---|---|
| Sato | Cultist (Courier) | Cultist, Courier | Cultist, Courier (marked from car 1 on two of three lines) | Cultist, Courier |
| Chen | Not a cultist | Not a cultist | **Cultist, Courier (wrong)** | Not a cultist |
| de Vries | Cultist (Devotee) | Cultist, Devotee | Cultist, Devotee | Cultist, Devotee |
| Volkov | Cultist (Keyholder) | Cultist, Keyholder | Cultist, Keyholder | Cultist, Keyholder (marked **Not a cultist** first, fixed at the key) |
| Mensah | Not a cultist | Not a cultist (decided in car 4 by elimination) | Not a cultist | Not a cultist |
| **Result** | | Right call | **Mission lost** (`wrong_call`, 65 %) | Right call, by luck of order |

Careful and newcomer reasoned correctly from the evidence. Hasty's loss is the trap the answer file
predicts (Chen called a Courier without her charm), but by a different route: the coat was never searched,
stop 2 took the charm, and the shredded document (the recovery) was skipped.

## 2. Did the runs play the real game? (run fidelity)

Some run details don't match the plan, so a few findings need adjusting:

- **Hasty never saw the tamper.** In the plan, stop 2 fades Chen's charm, turns her cell to "Evidence
  destroyed" and shows a toast ("Someone has been at the evidence.", `tamperText`, plan line 458). The
  packet never mentions that toast, so the hasty player wrote "as far as I noticed, it was just another
  Hidden". The packet gap muted the strongest warning the game gives a hasty player.
- **The Chen nudge should have fired for hasty, in car 5.** By the time hasty got the umbrella, the
  open carry cells were Chen's second (destroyed) and Volkov's second, and the unplaced items were exactly
  two ward charms, so the counts decide Chen. The toast "You have enough to decide about Chen." fires at
  the umbrella pickup, right before the call. Hasty's notes say it never fired. A real hasty player would
  probably miss it too: Chen was already marked, and the line doesn't say the mark might be wrong. See R1.
- **Hasty's Mensah nudge comes too late in the run.** The counts decide Mensah when the key turns up in
  car 4, not in car 5.
- **Newcomer's witnesses turned vague too early.** The steward was "short" at Q2 and the conductor vague
  after two questions. With the §7.2 defaults the third question is still answered, and the fourth is the
  vague one. The newcomer also says the conductor's Sato topic stayed after the rack label was held, but
  §7.2 hides a topic once its clue is held. Read the newcomer's "I couldn't tell how many questions I had"
  as a fair complaint. The specific timings are not evidence.
- **Hasty's debrief line.** With Chen decided by count at the call (`decidedAtVerdict` true), the debrief
  picks "rule misread": "The evidence was there. Checking each profile line against it is the habit that
  catches this." That is fair, but it doesn't mention the door, the coat or the skipped receipt, which
  caused the loss (see R4).

## 3. Spoilers in the packet extraction

These leaks inflate the "I worked it out" feeling in all three runs. Fix them before the next round.

1. **§4 is a full walkthrough.** It gives every clue's text and where it lands on the board, including
   car 5 and both puzzle results, before play starts. Hasty admits learning the shredded-document result
   "from the packet afterwards". Any player can solve the whole case from §4 at the start. Fix: put each
   carriage in its own section and have the game master reveal it on entry. A source's result should only
   be shown when the player uses that source.
2. **"Fighting Volkov. If you knock Volkov out, he drops the brass key."** This tells the player who holds
   the key before the briefcase is opened. Both hasty and newcomer thought about punching Volkov "to get
   the key". Fix: put the KO-drop result in the game master's notes. The player sees only the first-punch
   warning.
3. **Mechanics the game never states.** "The first question is free" and the "get guarded … end the
   conversation" ladder are in the packet as player knowledge. In play the player only hears the ink.
   Fix: give the actual vague-answer and refusal lines, not the rule.
4. **An omission: the tamper toast.** See §2. Add "Someone has been at the evidence." (or the per-stop
   authored text) to the stops section.
5. **The carriage-4 warning leaves out the evidence clause.** That tells a careful reader nothing in car 4
   is at risk. It is in-game copy, so it's allowed, but it removes the tension at stop 4. Keep it on
   purpose or drop it on purpose. Careful used it reasonably.

The card shapes (one carry cell for Sato and Mensah, two for the others) are real board information, not a
packet leak. Careful used them well ("Sato and Mensah can never be Devotees"). The plan says "the layout
gives nothing away". It gives away some structure, but that is fair counting, not a spoiler.

## 4. Where players were misled by wording or layout

| Issue | Who | Why it misleads | Change |
|---|---|---|---|
| Sato's notebook in **lost property** fills "What they carry" | all three | "Carries" reads as "has on them now". A lost item reads as not carried, which leaves Sato's slot open in the player's head | Reword the clue: "Lost property from seat 1A: a notebook, 'Sato' inside the cover. It's the only bag Sato brought aboard." Or relabel the slot "What they brought" for D |
| "Any of these" profiles, with "and" inside Courier | newcomer | Two kinds of logic in three lines. Newcomer nearly read all-must-match, then any-part-matches | Show Courier as a three-line checklist on the profile card (Archive / wants the Codex / no ward charm) with "all three" beside it, and "any one profile is enough" above the list |
| "Marked clues" vs marking a passenger | newcomer | One word, two meanings | Mission label "✦ cult sign" (or "bears the cult's sign"), keeping the ✦. Check the plan allows an override of the "✦ marked" engine string |
| Ward charm clears Chen, so "charm = innocent" | newcomer (made it), careful (spotted it) | A safeguard that rules out one profile looks like a general alibi. Volkov's "my mother gave it to me" adds to that | Keep the trap, it is the lesson. Make it explicit after the fact (R3, R5) |
| "Wants a promotion ✦" | hasty | Ambition carrying the cult's sign feels arbitrary | One line in the brief: "The cult recruits the ambitious: it promises advancement." Gives the motive indicator a reason in the story |
| "Was in the Archive" vs "stamped at the Archive reading room" vs "got on at the Archive stop" | hasty | Boarding at a stop isn't the same as being there | Conductor: "Sato came from the Archive reading room. The stamp was still wet." |
| "Wait by the door … whatever the cult is after in this carriage may go with it" | all three | Vague. Hasty ignored it, newcomer was scared off it and stood around bored | "The cult uses every stop to clear away evidence. Anything here you haven't picked up or asked about may be gone. Wait for the stop?" |
| "Verdict given" on a knocked-out card | hasty, newcomer | Not clear who decided | "Locked: you knocked them out" (or "Locked: your accusation") |
| Jargon: Tesseract, Codex, sigil, burner/unregistered SIM, "backup recovery terminal" | newcomer | Not needed to solve, but it pushes a non-gamer away | Gloss each one inside the clue text the first time ("a sigil, the cult's sign"; "a burner phone: cheap, unregistered, easy to throw away"). Rename the terminal "Phone records: rebuild deleted data" |
| Witness patience is invisible | careful, newcomer | Both spent the kind word early "just in case". In car 1 it is never needed (three topics fit before `wary`) | No meter (the plan rules it out). Write a tell line into the ink after the question that tips them past `wary`, e.g. the steward "glances at the clock", so the vague answer doesn't come out of nowhere |

## 5. Fairness, difficulty, fun

- **Fair:** all three runs agree, and the answer file confirms it. Every verdict could be decided from what
  was visible, and each at-risk clue has a recovery route one carriage later.
- **Too easy in places, which is acceptable given the aim:**
  - de Vries has three shady items on one seat.
  - Mensah is decided by car 4, so car 5 is just paperwork.
  - The conductor's four topics never change a decision.
  - None of this needs making harder. The flat parts need a reason to be there (R6, R7).
- **Puzzles felt wasted for thorough players.** The shredded receipt and the phone backup only gave back
  what careful and newcomer already held. Both said it felt deflating. Since the puzzles are recovery
  routes, the reward should be corroboration, which is also the lesson (R6).
- **Strongest moments, keep them:**
  - Chen cleared by the charm just after looking guilty (careful, newcomer).
  - The Mensah nudge firing in car 4, about someone not yet met (careful).
  - de Vries's ✦ count climbing to three (hasty).
  - The newcomer catching their own Volkov mistake when the key appeared.
  - The first-punch warning stopping both hasty and newcomer.
- **One skill gate for a non-gamer:** Volkov's key comes only from the lockpick briefcase or a KO. The
  newcomer: "If the briefcase lock had beaten me, I'd have gone into the call with Volkov cleared and
  lost." For an awareness audience a third route without a skill check would help (R8).

## 6. How each persona's failure mode was handled

**Hasty (accuses on two of three lines, skips searches, uses the doors).**
- *Stakes:* clear, and understood. The ending works: the loss goes through the debrief, then the failure
  credits.
- *Nudge:* fires for Chen only at the last moment and doesn't stand out against a mark already made. In
  the run it made no difference.
- *Confirm panel:* lists the marks but nothing that slows a hasty confirm. The hasty player suggested a
  fix: flag passengers marked without enough to decide.
- *Debrief:* "rule misread" is correct but incomplete. The real lesson for this persona is "you left before
  searching, and you skipped the recovery". The debrief has the parts ("evidence destroyed, recovered or
  not") but doesn't tie them to the wrong call.
- *Verdict:* **partly handled.** The game stops the hasty KO well. It doesn't stop the hasty call.

**Newcomer (careful but literal, nervous).**
- *Stakes:* made them cautious, which turned into boredom at the timed stops.
- *Nudge:* "enough to decide about Volkov" fired whichever way the mark stood, so it couldn't catch the
  wrong early clear. The key turning up did that.
- *Debrief:* shows only the final mark, so the "charm = innocent" slip leaves no trace and isn't taught.
- *Confusion:* "any/and", "marked", jargon, invisible witness patience, unclear stop losses.
- *Verdict:* **handled by luck of order.** They got the briefcase open. Had they reached the conductor
  last and failed the lock, they would have lost with no warning.

**Careful.** Well served. Their complaints were no feedback on whether caution paid off (they never saw a
tamper, because they never risked one) and confirm-only puzzles. A line on the debrief such as "Nothing was
lost to the cult: you searched every carriage before its stop" would reward their care.

## 7. Recommendations, in priority order

**R1. Make the nudge and the confirm panel catch a mark made too early, without saying which way.**
- When a suspect becomes decidable and the player has already marked them, the toast reads: "You have
  enough to decide about Chen. Check your mark against the profiles." It shows for every marked suspect,
  right or wrong, so it leaks nothing.
- On the confirm panel, under each guilty mark, show the chosen profile's lines next to the held cells,
  e.g. "Courier: Archive ✓ · wants the Codex ✓ · no ward charm: carry cells notebook, Evidence destroyed".
  This only restates the rules against held cells and doesn't judge the mark.
- For any suspect not yet decidable, add "not enough to decide yet".
- This catches hasty's Chen and newcomer's Volkov, and it trains the habit the "rule misread" line names.

**R2. Make tampering visible and specific.**
- Use per-stop authored `text`: "Someone has been at the evidence: Chen's coat has been emptied."
- Rewrite the door warning as in §4.
- Fix the packet so testers see the toast.
- Without this, hasty players learn the warning is empty (the hasty run says exactly that) and careful
  players get no feedback.

**R3. Fix the Sato lost-property clue.** All three players stumbled on "carries" for a lost notebook. Use
the rewording in §4, which also states that the slot is full, for the newcomer.

**R4. Tie destroyed evidence to the wrong call in the debrief.** When a wrong call's settling clue was
faded and not recovered, Chen's card should say:

> "Chen's ward charm was taken at stop 2, when you waited by the door before searching her coat. The
> shredded receipt in carriage 3 had the same fact."

Keep "rule misread" if the count decided her, but add this line. That is the lesson a hasty player most
needs.

**R5. Author "why" clauses that teach the safeguard lesson.**
- Volkov: "Keyholder: yes, carries the brass key. The ward charm only answers the Courier line."
- Chen: "Courier: no, she carries a ward charm."
- Debrief closing line: "A safeguard rules out one route, not every route."
- If the marks history is kept, show "You first marked Volkov 'Not a cultist'" on his card. Then the
  newcomer's self-corrected slip is taught, not forgotten.

**R6. Reward corroboration instead of "already known".**
- When a recovery source repeats a held clue, the cell shows "Confirmed by two sources (coat, receipt)".
- The puzzle closes on "This matches what you already had."
- This turns the puzzles from wasted effort into the habit of checking a claim with a second source.

**R7. Make car 5 and the conductor count without making them harder.**
- The conductor's topics could point at physical searches ("Volkov never lets that briefcase out of his
  sight") so he works as a guide, not a repeat.
- Car 5 could hold the last-chance recovery for any clue still destroyed (e.g. Mensah, who "keeps to
  himself", noticed Chen's red cord). It costs nothing for a thorough player and gives the hasty one a final
  catch.

**R8. Give Volkov's key a route with no skill check.** For example, after the kind word the conductor says
"I've a master key for the luggage if you need it." That route opens the briefcase. The lockpick stays as
the quicker option.

**R9. Plain-language pass on the brief and clues.**
- Lay Courier out as a checklist.
- "Any one profile is enough."
- Rename "marked" to "cult sign" in D.
- Gloss the jargon on first sight.
- Explain "wants a promotion" with one line of story.
- Change "Verdict given" to "Locked: you knocked them out".

**R10. Add a witness tell line before `wary`**, so a careful or nervous player can judge when to use the kind
word without a meter.

**R11. Packet fixes for the next round:**
- Reveal one carriage at a time.
- Remove the Volkov KO-drop sentence.
- Replace the stated witness rules with the in-game lines.
- Add the tamper toast.
- Tell testers that the nudge also fires on suspects they have already marked.

## 8. What players learnt (keep the debrief aligned with this)

- **Don't go on gut feel.** Chen sounded guilty and Volkov sounded nice. Both reads were wrong.
- **One protective sign doesn't clear someone.** It only answers the rule it belongs to.
- **Several small signs together outweigh one coincidence** (de Vries).
- **Check what's missing as well as what's there.** Sato is condemned by the charm Sato doesn't have.
- **Count the evidence.** If two charms exist and you've found neither, someone you've "solved" may hold
  one.
- **Helpful staff overshare.** The newcomer noticed: "that's also the lesson about how *I* could be the
  chatty steward". This is the social engineering lesson for both target games. Put it in the debrief
  closing line for D, e.g. "The steward and the conductor told you about five strangers because you asked
  nicely. Someone else could ask them the same about you."
