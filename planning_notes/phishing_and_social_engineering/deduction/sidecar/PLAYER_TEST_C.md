# Player test, step 3: fixture C "Safe house"

Plan read: `DEDUCTION_IMPLEMENTATION_PLAN.md` at 3,327 lines, latest §14 round "Round 4 outcomes" (R4E-9 and
R4D-11 the last rows I checked). The packet and the answer file name the same version. Inputs:
`player_packets/fixture_C.md`, `player_packets/fixture_C_answer.md`, `player_runs/fixture_C_{careful,hasty,newcomer}.md`,
and §9.3 of the plan, checked only for the questions the runs left to the judge.

## 1. Results against the truth

| Run | Novak (sleeper) | Ahmed (clear) | Baptiste (clear) | Outcome by the plan's rules |
|---|---|---|---|---|
| Careful | act (waited, HaX lock): **right** | not named: **right** | not named: **right** | Perfect run. Solved task completes. No toast, no pull-out. |
| Hasty | knocked out in the office: **right** | sent to wait at step 3, locked in by the exit phone: **wrong** | not named: **right** | One wrong call. The keycard toast fires during the close, so it teaches nothing in play. `c_hax_trust_down` set; solved task fails. |
| Newcomer | act (HaX lock): **right** | sent to wait before the garage, locked in with Novak: **wrong** | not named: **right** | One wrong call. The keycard is lost after the garage was already done, so it has no effect on play. Same credits as the hasty run. |

Two of three players named Ahmed. Both read only half the second branch: they took "went to the quarry
site" as enough and missed "and has no verified alibi". The Ahmed trap works and it teaches the right
lesson (being somewhere suspicious does not make you guilty). In both failing runs the in-play
consequence came too late to register, so the debrief has to do all the teaching (see §4).

Judge errors in the runs, which the next round should correct:

- **Newcomer:** "Everyone has been dealt with" appeared even though Baptiste had no verdict. Under §4.3
  and §9.3 it cannot appear there. The judge also ruled that Novak's badge could be cloned after she had
  been sent to wait. §9.3 removes her with `#remove_npc`, so the plan does not support that ruling (see
  F2).
- **Hasty:** assumed a knocked-out Novak cannot be cloned. The plan is silent on this (F2).

## 2. Findings

Severity is for the player experience: **major** means a reasonable player loses or gets stuck through no
fault in their own reasoning, **minor** means friction or a missed teaching moment.

### F1 (major). The profile line invites the misread that caught two of three players

"Carries a cult-issued burner (there is one), or went to the quarry site and has no verified alibi for the
night of the leak." The second branch is a conjunction buried at the end of one long sentence. The hasty
player stopped reading at "quarry site". The newcomer read it correctly at first, then forgot the second
half under pressure. Both suggested the same fix without being asked.

Fix (copy and board layout, no rule change): show an `any` profile as stacked branches, with the
conjunction spelled out.

> **Sleeper** if either is true:
> - carries the cult-issued burner (there is only one), **or**
> - went to the quarry site **and** has no verified alibi for the night of the leak.

This is a board renderer rule for every `any`/`all` profile (§3/§7), not something specific to fixture C.
The trap stays fair: a player who skips the alibi still falls into it, but now they had a fair chance to
see it.

### F2 (major). Acting on Novak before cloning her badge closes off the garage, and nothing covers it

The only way into the garage is a clone of Novak's badge (her `itemsHeld`, cloned in the office). §9.3's
hand check covers "after a wrong call" but not "after a right call made early":

- **Wait first:** `#remove_npc` takes her off the map, so there is nobody left to clone.
- **Knockout first:** the plan does not say whether the RFID minigame accepts a knocked-out holder.

Either way, the correct call on Novak, made early (which is when a hasty player makes it), leaves Ahmed's
alibi out of reach for good. The case can still be won by not naming Ahmed, but a player who wants proof
is stuck, and the hasty player saw this as an "unfair dead end". DL6 checks that every cell has a route
needing no KO. It does not check that a route survives a verdict on the person who holds the key.

Fix options (pick one, all cheap):

1. When sent to wait, Novak leaves her badge behind: "Badges stay outside the comms room." She puts it
   on the desk (an item in the office). On a knockout her badge drops where she falls. This fits the
   story and keeps the RFID puzzle for players who clone first.
2. Give the garage a second way in, such as a spare key in Ahmed's locker or a door code in the travel log.
3. Add a lint: for every route whose key is held by a suspect, check that it survives `act`/`ko` on that
   suspect (an extension of DL6).

I recommend 1, with 3 as the general guard, since fixtures A, B and D may hit the same issue.

### F3 (major). The close hint and the exit phone copy push careful players towards naming innocents

`closeHint` appears only once **all three** contacts have verdicts. In this fixture, giving all three a
verdict means at least two wrong calls, so the hint only ever confirms a bad run. A perfect player never
sees it. The careful player went looking for a "Not a sleeper" verdict, could not find one, and left
feeling they had skipped a step. The exit phone's "anyone else you haven't dealt with stays in the field"
made that worse: leaving cleared contacts alone is exactly the right move, and the copy makes it sound
like something unfinished.

The board line "Verdict: <Sleeper / Not a sleeper> (knocked out / acted on)" adds to the confusion. In C,
both verdict kinds accuse, so "Not a sleeper" can never be reached by an action. The packet copied the
generic template, and the board should not show it either.

Fixes:

- Exit phone confirm: "Call extraction and leave? Anyone in the comms room is locked in. Everyone else
  stays on as a trusted contact." (the cancel stays "Not yet").
- A board note on any case where every verdict kind accuses: "Leaving someone unnamed clears them." Put it
  next to the mark buttons. It is a rule of the interface, not a hint about this case.
- Either drop `closeHint` when the only verdict kinds accuse (it can only fire on an all-guilty sweep), or
  word it neutrally: "Nobody is left to deal with. Use the exit phone when you're ready." Engine (§4.3):
  allow `closeHint: null`.

### F4 (major for the newcomer, minor otherwise). "You can't call this back" next to an all-or-nothing lock

The newcomer sent Ahmed to wait, then found the proof that cleared him, and could not separate him from
Novak. HaX's lock and the exit phone both lock everyone inside. The packet also says "While they wait,
nothing is final until the comms room is locked". That line is a packet gloss that is not in the plan, and
it led the hasty player to treat sending someone to wait as a free hedge. Players read the two lines as a
contradiction.

The irreversibility was settled in R4D-11. What can still be fixed is how clearly it is shown:

- HaX's lock choice names who is inside: "Lock the comms room with Novak and Ahmed inside" (built from the
  `c_waiting_<id>` globals). The player sees who they are about to condemn before they confirm.
- The exit phone confirm does the same: "Novak and Ahmed are locked in."
- The packet line goes (see §5).
- For the user (I have not changed it): a one-way "Let them go" option. If Ahmed is waiting, Ahmed's
  absence is the price, and he leaves the safe house "not named", but the player can still save an innocent
  they suspected too early. This matches the plan's "not hard" aim better than a permanent mistake, and the
  debrief can still note the hasty send. It would reopen R4D-11, so I mark it as a question only.

### F5 (minor). The hidden cost never lands in play

The `twistNote` relies on "losing the keycard straight after a wrong takedown". Both wrong calls in this
test went through waiting, so the verdict came at the lock, and the toast came either during the exit
(hasty) or after everything useful was done (newcomer). With `disclosure: hidden` and `nudge: false`, the
player got no signal at all until the debrief. That is acceptable for a fixture that tests the off switch.
It does mean the debrief must carry the lesson (F6), and the fixture never exercises the keycard fallback
or HaX's office-code choice with a real player. To exercise them, run a fourth persona who knocks out Ahmed
in the lounge at the start.

### F6 (minor, the biggest educational gain). The debrief needs to say where the missing evidence was

The expected debrief line for Ahmed is "Sleeper: no, verified alibi". For both failing players the useful
lesson is longer: you acted on half the profile, and the other half was in a room you hadn't opened (hasty)
or hadn't opened yet (newcomer). Both players said they would accept the loss if the debrief explained it
kindly.

Proposed authored debrief lines (per suspect and outcome, no runtime text generation):

- Ahmed, wrong_guilty: "Ahmed did go to the quarry site, but the garage door log shows where he was on the
  night of the leak. The profile needs both: the trip **and** no alibi. Being somewhere suspicious isn't
  enough."
- Add an "evidence you didn't see" line when the deciding clue was never found: "You never opened the
  garage. Novak's badge, copied with the RFID cloner, opens it." The engine already knows which cells were
  never revealed, so this can be an authored line per route.
- Novak, right_guilty: "Novak showed you a SAFETYNET phone and kept the burner in a locked drawer. People
  show you what you expect to see." The newcomer called this the best moment, so the debrief should name the
  lesson.
- No-blame line for one wrong call: name the habit, not the player: "One call came before the evidence did."

### F7 (minor). Newcomer terms are never explained

Never defined: "Sleeper", "cult", "SAFETYNET", "field contact", "the quarry site", "RFID cloner",
"goodwill", "filter", and the ✦ mark (the newcomer thought ✦ meant her own flag). "Last used 03:40" was
only understood as "no alibi" once the door log said so.

Fixes (copy only):

- Brief, one line: "A sleeper is one of our own contacts secretly working for the cult."
- One-line item descriptions: RFID cloner "Copies a door badge when you stand next to the person carrying
  it." Keycard "Opens the bedroom and comms room."
- A legend for ✦ on the profile card, using the plan's meaning (e.g. "✦ a clue that settles the profile on
  its own"). It must not imply who holds it.
- Garage reader: "Novak's badge. Last used 03:40, the night of the leak." The board cell then reads as a
  conclusion the player can follow.
- Novak's office line could mention the badge ("I hold the garage pass"), so the cloner has an obvious
  target without spelling out the puzzle.
- Baptiste's goodwill: one line of warning in his voice ("Ask me much more and I'll start to wonder why").

### F8 (minor). The keycard and the "contacts can open doors" choice confuse everyone

All three players lost time deciding whether to use their own keycard or ask a contact. The contact option
only matters after the keycard is revoked. Gate Ahmed's and Baptiste's door choices on `c_keycard_revoked`
so they appear only once they are needed. Today they also hint, for anyone who wonders why they exist, that
the keycard can be taken away.

### F9 (minor). Pacing: three identical kit checks, three lockpicks, an unused tool

- Three "Show me your kit" exchanges in a row all return the same SAFETYNET phone. Give each contact their
  own line. Novak's should be a confident "This is all I carry", which pays off when the burner turns up
  (authored flavour, no extra fact).
- Three lockpicks in a row with no variation. The fingerprint kit is in the start inventory but nothing
  uses it (the newcomer noticed). Either drop it or use it once, for example dusting the office safe's
  keypad for worn keys in place of the note under the desk. That gives the office a second puzzle type.

### F10 (minor). Difficulty balance

The burner decides Novak at once (✦, "1 in this case"). The careful player found everything after that
was confirmation, and the reader made the door log redundant, since counting cleared Ahmed as soon as
Novak's no-alibi showed 1 of 1. For a game that should be fun and not hard, this is about right. The
count-clear was the careful player's favourite moment and should stay.

One optional change, which adds tension without adding difficulty: move Novak's bag from the office to the
garage. Then the office leaves Novak and Ahmed as two quarry visitors with unknown alibis, the clearest
version of the case's question, and the garage settles both at once. The cost is that the garage holds the
deciding clue, which makes F2 a must-fix rather than a should-fix. I would test it with players rather than
adopt it straight away.

## 3. Persona failure modes and what caught them

| Failure mode | Seen in | Did stakes, nudge or debrief handle it? | Change |
|---|---|---|---|
| Hasty accusation on half the profile | hasty, newcomer | Stakes: no (toast too late). Nudge: off by design. Debrief: only "verified alibi". | F1 layout; F4 names who's inside; F6 debrief says where the alibi was |
| Correct call made before gathering, which locks out evidence | hasty (KO), newcomer (wait) | Not handled; the plan's hand check misses it | F2 |
| Careful player can't find a "clear" action | careful | No: close hint never shows; exit copy sounds unfinished | F3 |
| Newcomer vocabulary | newcomer | No | F7 |
| Gossip treated as proof | hasty | Partly: the travel log confirms the trip, the door log adds the alibi | F6 debrief line: "a lead, not proof" |

## 4. Spoilers and errors in the packet extraction

For the packet writer. These affect how valid the test is, not the game itself.

1. **Every clue's content is printed inline in §6**, including Novak's burner and all three door-log
   results. A player who reads ahead knows the answer. The careful run's "too easy" verdict is probably
   inflated by this. Next round, put each source's result in a sealed section ("ask the judge when you open
   this") and list only what a player can see before acting.
2. "Garage: card reader, takes only Novak's badge" (§5, §6 heading). In the game, the player learns which
   badge the reader takes by trying it, or from an authored line. As printed, it points at Novak before any
   evidence does.
3. "Baptiste's other gossip topics ... grant nothing listed in the plan." This is meta. Replace it with
   [placeholder topics] and let the judge answer.
4. "While they wait, nothing is final until the comms room is locked." This is not plan copy, and it misled
   the hasty player. Remove it (F4).
5. "Ahmed and Baptiste can both open the bedroom and comms doors for you if you ask" gives away the
   keycard fallback (F8). Leave it out until the keycard is revoked.
6. "Comms room: an empty holding room. Nothing here is needed." and "This board gives no hints about when
   you have enough to decide." are both meta. The first may become room flavour. The second is a design note.
7. "Verdict: <Sleeper / Not a sleeper> (knocked out / acted on)" is the generic template. In C only "Sleeper"
   can occur (F3).
8. "Ahmed ... him or her": the pronoun is a placeholder. The fixture should fix genders for all three (the
   cast diversity rule applies to fixtures that become missions).

## 5. Top recommendations

1. **Show `any`/`all` profiles as stacked branches with a bold "and"** (F1). This is one renderer rule, and
   it fixes the misread that caught two of three players.
2. **Keep Novak's badge reachable after any verdict on her**: she leaves it on the desk when sent to wait
   and drops it on a knockout. Add a lint that a key held by a suspect survives a verdict on that suspect
   (F2).
3. **Make "leave them unnamed" read as the right way to clear someone**: new exit-phone copy, a board note
   when every verdict kind accuses, and no `closeHint` that can only fire on an all-guilty sweep (F3).
4. **Name who's inside on HaX's lock and on the exit confirm**, and remove the packet's "nothing is final"
   gloss. The user could also decide on a one-way "let them go" (F4).
5. **Debrief lines that say where the missing half was** ("the garage door log shows where he was"), plus an
   "evidence you didn't see" line, and a line naming Novak's lie by omission (F6).
6. **Newcomer copy**: define "sleeper", give one-line item descriptions (RFID cloner), add a legend for ✦,
   and tie "03:40" to "the night of the leak" (F7).
7. **Gate the contacts' door choices on the keycard being revoked; give each kit check its own line; use
   or drop the fingerprint kit** (F8, F9).
8. **Packet hygiene for the next round**: seal clue results per source, and remove the Novak-only reader
   line and the meta notes (§4).
