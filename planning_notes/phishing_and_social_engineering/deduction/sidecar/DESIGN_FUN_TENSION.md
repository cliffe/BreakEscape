# Sidecar: fun, tension and pacing in the deduction loop

Track: FUN. A designer's read of `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md` for moment-to-moment play.
Proposals only; nothing here edits the plan.

**Version read:** the plan at 3,327 lines, §14's latest round is Round 4 (its outcomes table runs R4E-1 to
R4I-17). The status line at the top still says "rounds 1 to 3 folded in", which is out of date. Design 12
read at 475 lines.

Standing aims kept throughout: fun and educational, not hard; no runtime LLMs (every line below is
authored); no board-game terms in anything the player sees; Incident Simulations and Eldritch Hacker
only.

## 0. The short version

The plan is sound as a rules engine. Its weak spot is feedback: most of the interesting moments happen
silently, inside the evaluator or the board, and the player only finds out if they open the case file at
the right time. The fixes below make those moments visible and give each risky choice a felt upside as
well as a downside. Ranked by payoff for cost:

| # | Proposal | Cost | Where |
|---|---|---|---|
| 1 | "New since you last looked": a case-file badge and highlighted cells | small engine | §2 |
| 2 | The nudge says *how* it became decidable (counts, or what they lack), never which way | small engine | §3 |
| 3 | Tampering shows what is at risk, and recovery is a visible win ("Recovered") | small engine + data | §5 |
| 4 | Push-your-luck: tells before `wary`, and a "press anyway" choice with a known price | ink only | §4 |
| 5 | Favours pay off for innocents too (`onThanks`), and a guilty favour has a fair tell | small data key + ink | §6 |
| 6 | The unique item: each option trades something in play (contain or observe) | ink and existing keys | §7 |
| 7 | The final call: "You are guessing on: …" in the confirm, then a card-by-card reveal | board work | §8 |
| 8 | A locked final call shows when it opens, instead of being hidden | one string | §8.3 |
| 9 | Incident Simulations: naming someone always costs a witness, right or wrong | existing keys | §9 |
| 10 | The validator prints a decision curve per state, so authors can see the pacing | validator info | §10 |

Items 4, 6 and 9 need no engine work and could go straight into the fixture ink.

## 1. The loop as it stands, beat by beat

| Beat | What the player sees now | The gap |
|---|---|---|
| A clue arrives | The "Noted" toast (`systems/apply-actions.js:49-68`) | Same toast as any intel; nothing says a cell on the board flipped |
| A count or pigeonhole decides someone | The nudge toast "You have enough to decide about Okafor." | The best "aha" in fixture A (Okafor after Marsh's favour, §9.2 H+C+F) arrives as the same flat line as a direct sighting. The player is not told *that a count did it*, so the lesson about elimination is learned only in the debrief, if at all |
| Pushing a witness | A fixed cost of 15 per question; `wary` gives a vague line | It is a budget, not a gamble. The player gets no warning before `wary`, and nothing to win by pushing past it |
| A favour | Clues all at once; a backfire if guilty | Doing a favour for an innocent gives only clues, so the choice is "clues versus risk". It does not feel like helping someone |
| Tampering | A toast, "Someone has been at the evidence.", and a cell reading "Evidence destroyed" | The player never knew what was at risk, so the loss feels arbitrary. Recovery reads like any other note |
| The unique item | Confront, watch, or seize | "Watch" changes only the credits; it has no payoff in play, so it is the wrong choice dressed as a fair one |
| The final call | A confirm listing the marks; then the debrief all at once | The board game's best moment, everything turned over, is a single page load. The confirm does not tell the player which marks are guesses |
| Fixture B | No timer, no tamper, `light` stakes, report at the end | Fine as a data-path test, but as the Incident Simulations template it has no tension at all |

## 2. Make the reveal rhythm visible

### 2.1 "New since you last looked"

**Data.** `deduction_state` gains `seen: [factIds]` (ids only, as the rest of §4.5): the clue facts held
the last time the board was closed. Under 2 KB still holds for six suspects (at most 24 short ids).

**Runtime.** On `intel_collected` for a clue fact, if the board is not open, raise a badge on the
case-file object: the existing interaction indicator pattern, or a small count on its label ("Case file:
3 new"). On board close, `seen` = held.

**Board.** Cells in held but not in `seen` render with a "New" tag (word plus a symbol, never colour
alone, §6.4 accessibility). Suspects that became decidable since the last look get "New: you have enough
to decide" in their nudge line. The live region reads one summary on open: "3 new clues. You have enough
to decide about Okafor."

**Why.** Opening the board becomes a payoff moment (several cells turning over at once) instead of a
chore. It also stops the player missing a nudge toast that fired during a conversation.

Test state: `board.deduction.suspects[].cells[].isNew`, `board.deduction.newCount`.

### 2.2 A case-file toast for deduction facts

The runtime's `grantFact` already shows "Noted". For a fact with a `deduction` field, title the toast
"Case file" and use the cell's slot and the suspect's name as the body: "Case file: Okoro, server room
access". For a marked clue add the plain word: "Case file: de Vries, what he carries (marked)". The fact's
own `text` stays in the notes. Engine strings for §6.3:

| Key | Text |
|---|---|
| Clue toast | "Case file: <name>, <slot label>" |
| Clue toast, marked | "Case file: <name>, <slot label> (✦ marked)" |

Eldritch writers get the dread from the marked word; corporate writers get a clean audit-log feel.

## 3. The nudge says how, never which way

The nudge is the main teaching tool, and at present it teaches only "you're done". The evaluator can say
why a suspect became decidable without saying which way.

**Evaluator.** `evaluateSuspect` already feeds `byCount`. Add a `how` field to the decidable result,
from the rule tree that settled the status:

- `seen`: settled by revealed cells alone;
- `count`: some `has` in the settling path was decided by an exhausted count or the pigeonhole step;
- `absence`: settled by a `not` clause or a fully revealed slot (evidence of absence).

Precedence when several apply: `count`, then `absence`, then `seen` (the rarer reasoning is the one worth
pointing at).

**Strings** (§6.3, engine-owned):

| `how` | Nudge |
|---|---|
| `seen` | "You have enough to decide about <name>." (unchanged) |
| `count` | "You have enough to decide about <name>. Check the counts." |
| `absence` | "You have enough to decide about <name>. Check what they don't have." |

**Leak check.** A count can force a clue in (guilty, the pigeonhole step) or rule one out (clear, an
exhausted count). An absence can clear (Ishikawa's charm, `not`) or convict (a Courier missing a charm).
Both pointers go either way in the fixtures, so neither gives the direction. P10-A's conformance file
should hold one case of each direction for each `how`, so the property is tested, not assumed.

**Fixture beats this produces.**

- A, after Marsh's favour: "You have enough to decide about Marsh." then "You have enough to decide about
  Okafor. Check the counts." The player opens the board, sees two carry cells left on Okafor and one brass
  key unaccounted for, and works out the pigeonhole step themselves. That is the lesson of the whole board.
- B, after Lindqvist's complaint: "Haddad … Check the counts." and "Morgan … Check the counts." (both
  grievance clues seen elsewhere).
- C (nudge off): nothing, as planned.

## 4. Push-your-luck questioning

### 4.1 The problem

Q1 free, then 15 each, `wary` at −20: a careful player counts to two and stops. There is no risk to judge,
and nothing to win by risking. In the board game the bag draw is the gamble; the plan rightly drops dice,
so the gamble has to come from a known price the player chooses to pay.

### 4.2 Tells before the edge (ink only)

After the second paid question (the one that will take the witness past `wary` next time), the witness
gives a tell line *after* the answer. The counter is already in the §7.2 pattern:

```ink
=== charge ===
~ ded_b_tomas_questions += 1
{ ded_b_tomas_questions > 1:
    ~ se_influence(-15, "pressed")
}
{ ded_b_tomas_questions == 2:
    Tomás glances at the clock and stops stirring his coffee.
}
-> topics
```

Eldritch version (the bar staff in A): "She starts polishing a glass that is already clean, and doesn't
look at you." The player now knows the next question is a push. Convention for §7.2: **every witness has a
tell line on the question before `wary`.** A lint is not needed; dialoguelint or a review checklist item is
enough.

### 4.3 "Press anyway": a real gamble with a known price (ink only)

Today a `wary` witness gives the vague line and the topic stays open. Add a second choice beside each
topic while wary:

```ink
=== ask_pay ===
{ ded_b_tomas_wary:
    Tomás: I'd rather not talk about people behind their backs.
    + [Press him. He won't like it.] -> press_pay
    + [Let it go] -> topics
}
...
=== press_pay ===
Tomás: Fine. Lindqvist. He's been on about overtime for weeks. #grant_fact:b_lindqvist_grievance
~ se_influence(-30, "pressed_hard")
-> topics
```

From −30, a −30 press reaches −60: past `refuses` (the talk ends after the answer, since the answer comes
first) and onto `reports`, which runs the witness's tamper (§7.6). So the player knowingly swaps one clue
now for one clue destroyed somewhere else, and losing this witness. That is push-your-luck with no
randomness: the price is stated in the choice text and the tell came first.

Conditions so it stays fair and not hard:

- Offer it only on witnesses that have a `reports` threshold and a tamper with a recovery route (DL7
  already guarantees the recovery).
- The tamper's `text` names the cause, so the player links the two (§5.3): "Tomás has been talking.
  Someone has been at the badge printouts."
- DL6's witness-budget check should count a press as one extra answer, so a case never needs a press to
  be solvable. The press is a shortcut, not a gate.

Educational fit: pressure gets you an answer and tips off the people you are investigating, which is the
real cost of a clumsy enquiry in an insider case.

### 4.4 Make the kind word matter more

The kind word is `*` once, +20. Give each witness a second, *earned* recovery tied to play: bring Tomás a
coffee from the kitchen machine (an item, `#give_item` back), or in A, return the intern's dropped lanyard
found in the cloakroom. Recovery through an errand turns a meter into a small story. Ink only, existing
item routes.

## 5. Tampering pressure that the player can read

### 5.1 Show what is at risk

**Data.** An optional `deduction.threats` list, one per tampering beat:

```jsonc
"threats": [
  { "id": "stop_1", "label": "the next stop", "facts": ["d_sato_pass"] },
  { "id": "stop_2", "label": "the next stop", "facts": ["d_chen_charm"] },
  { "id": "stop_3", "label": "the next stop", "facts": ["d_devries_sim"] }
]
```

`deduction_tamper` gains an optional `threat: "<id>"` in place of `facts` (the runtime reads the list from
the threat). The runtime keeps `state.threatsDone`.

**Board.** For the first threat not yet done, the cell that tamper would take now (the first fact in its
list that is not held and not faded, the same rule as `tamper()`) shows "At risk: <label>". The cell stays
"Hidden"; only the warning is added. When the player grants that fact first, the warning moves to nothing
(that threat will fade nothing, which is the reward for hurrying).

**Strings:** "At risk: <threat label>" on the cell; the live region on open: "Evidence at risk at <label>:
<name>, <slot label>."

**Why.** Fixture D's stops become a race the player can see: "Sato's ticket is at risk at the next stop,
and the rack is right there." Without it, D's stop 1 fades a fact the player could not have known to
hurry for, which reads as bad luck.

DL7 gains one check: every fact in a threat has a second route (it already checks every fadable fact, so
this is the same set).

### 5.2 Recovery as a win

§6.2 already tracks `recovered`. Give it a cell state and a toast:

| Key | Text |
|---|---|
| Cell, recovered | "<label> (recovered)" |
| Toast on recovering a faded fact | "Recovered: <name>, <slot label>" (title "Case file") |

The debrief line already lists destroyed and recovered evidence; the summary can add "1 of 2 destroyed
clues recovered".

### 5.3 Skin-specific tamper text

The `text` parameter already exists per tamper action; the fixtures leave it at the default. Write one per
beat:

- D, stop 1: "The train lurches. When the lamps steady, the luggage labels on the rack are gone."
- D, stop 2: "A porter passes through car 2 with a laundry bag. Chen's coat is no longer on its hook."
- A, a witness report: "The bar staff whisper to someone by the door. The coats in the cloakroom have been
  moved."
- Corporate (B or a real Incident Simulations case): "Log rotation ran at 03:00. The DHCP printout on the
  desk was from the old log, and the old log is gone." With a recovery route through the backup server,
  this teaches log retention and that volatile evidence goes first.

### 5.4 Give fixture B one tamper

B is the Incident Simulations template, so it should show the corporate form of pressure: the insider
covering their tracks. A `timers[]` entry starting when Tomás reports (or after 4 minutes of game time)
runs `deduction_tamper` on the DHCP printout facts, with `backup_recovery` in the server room as the second
route. It adds no combat and keeps `light` stakes. If B must stay minimal as the first fixture, put this
in the real mission built on B instead, and say so in §9.1.

## 6. Favours as risky shortcuts

### 6.1 An upside for innocents: `onThanks`

**Data.** `favours.<s>.onThanks`: actions run when the suspect is *not* guilty, mirroring `onBackfire`.
Optional `thanksLine` for the debrief ("You fetched Venn's notes. She gave you the archive code.").

**Runtime.** `doFavour` runs `onThanks` when `truth()[s]` is clear, as it runs `onBackfire` when guilty.
Same "state the truth once" rule.

**Examples.**

- Eldritch: Venn asks for her reading glasses from the cloakroom; done, she gives the archive code and
  speaks for the player if challenged (`set_global a_venn_vouches`, which a later ink line reads).
- Corporate: Morgan asks the player to cover her printer jam; done, she gives the HR cabinet code, saving
  the call to Nair.

The favour then becomes a true gamble: help an innocent and gain an ally and a shortcut; help a guilty
suspect and pay. The brief's "Don't do favours for anyone you haven't checked" stays, but now there is a
reason to be tempted.

**Lint note.** DL8 already places favour routes in the errand room. `onThanks` that opens a door or gives a
code should be counted as a route for DL8 the same way, or it could open a room early. Simplest rule:
`onThanks` may grant only things that already have another route (a code someone else also gives).

### 6.2 A fair tell on a guilty favour (ink only)

The player should be able to spot a risky favour if they look. The errand item carries a hint in its
`text`:

- Marsh's phone in A: "A cheap phone. The lock screen shows a missed call from a number saved as ✦." The
  marked symbol is the board's own word for the opposition's mark, so a careful player connects them.
- Corporate: Okoro asks the player to plug her "charger" into the server room patch panel. The item text:
  "It's a USB charger with a network port on the side."

Neither grants a clue (the cells stay the favour's reward), so it is a warning, not a shortcut. This
rewards reading over guessing, which is the habit the board teaches.

### 6.3 The favour on the board

Once the favour is unlocked, the suspect's card shows a line: "<Name> asked you a favour: <short ask>."
with the authored ask as `favours.<s>.askLine`. A favour that is not visible on the board is easy to
forget, and then it is neither a risk nor a shortcut.

## 7. The unique item: a choice with something on each side

### 7.1 The problem

§7.8 offers confront (`accuse`), seize (`act`) and watch (no verdict). Confront and seize are both right
calls with no further difference in play; watch costs a later verdict and gains nothing but a credits
line. A player who reads that once always seizes.

### 7.2 Give each option its own trade

The real dilemma, in both skins, is **contain now or observe to learn more**. That is also the central
incident response trade-off, so it teaches something true.

| Option | Verdict | Gain | Cost |
|---|---|---|---|
| Confront now | `accuse` | Certain, immediate | She warns the others: one `deduction_tamper` on a list of her associates' facts, with recovery |
| Seize it quietly | `act` | Certain, no warning | Takes time or trust: in A, HaX spends his one favour on it (`set_global a_hax_favour_used`, which closes a later HaX shortcut such as the sanctum hint); in D, it uses up the conductor's help |
| Watch where she goes | none yet | She leads you to something: a sighting grants a fact on another suspect (in A, Okafor meets Marsh by the garden door: grant `a_marsh_pass`) | She still needs naming, and a timer starts: if she is not named within the timer, she passes the key on (`set_global a_key_passed`, the credits line and a harder sanctum) |

All of this uses existing keys: `set_global`, `deduction_tamper` from ink through a trigger on the choice
global, `grant_fact` through a trigger on `a_key_choice == "follow"` plus a `room_entered` or timer, and a
`timers[]` entry with `startOnGlobal`. DL6 must still see a second route for the fact "watch" grants, so
watching stays optional.

### 7.3 Corporate version for Incident Simulations

The one-of-a-kind clue is the only unmanaged laptop on the server VLAN, seen on a switch port report.
Choices from the security manager's call:

- "Pull her access now" (`act`): containment; the exfiltration stops; nothing more is learned.
- "Let the SOC watch her account for an hour": a trigger grants a fact on a second suspect (the person she
  messages); the cost is a story global, `b_data_left`, in the debrief and the closing line ("About 2 GB
  left the building while you watched.").
- "Ask her about it at her desk" (`accuse` where the case allows it): she deletes what she can; a tamper.

The debrief's closing line should say which choice was made and what it cost or gained, so the trade-off
is named, not just felt.

## 8. The final call

### 8.1 The confirm says which marks are guesses

When the nudge is on, the confirm panel adds one line before "Confirm the call":

- "You are guessing on: Chen, Mensah." (suspects marked guilty or clear who are not decidable)
- or "Every mark rests on the evidence." when all are decidable.

This tells the player nothing they could not read from the board's nudge lines, so it leaks nothing. It
turns the confirm from a formality into the tensest moment in the case: the player sees exactly which
calls are gambles and can choose "Go back". With `nudge: false` (fixture C) the line is left out.

Also repeat the stakes line in the confirm ("Stakes: one wrong or missed call loses the mission."), so the
player confirms with the price in front of them.

Test state: `board.deduction.confirm.guessing: [ids]`.

### 8.2 Turn the cards over one at a time

The debrief currently renders all cards at once. Add a short reveal sequence before the full debrief:

- Each suspect card starts showing name, mark and verdict only, with the truth covered.
- "Reveal next" turns over one card: the truth line ("Cultist: matched Keyholder") and the outcome words.
  "Reveal all" turns over the rest. After the last, the full debrief (why, settling clue, summary) shows
  as planned.
- Order: suspects in `suspects` order, so the author can put the strongest reveal last.
- Optional authored line per suspect and truth, `debrief.revealLines: { "<s>": "..." }`, shown on that
  card's turn: "Okafor's hand goes to her pocket. The key is still there." / corporate: "Okoro's badge was
  deactivated at 06:12." Truth-based, so it is the same line whatever the player called.
- Buttons only, no timers: works with reduced motion, keyboard and screen readers (each turn writes the
  card to the live region).

This is the board game's "turn everything over" moment, kept as a single overlay. Under `reveal: "now"`
some outcomes are already known; those cards start turned over.

Test state: `debrief.revealed: n`, and the existing `cards` once all are turned. Bridges can press
"Reveal all".

### 8.3 Say when the call opens

Fixture D hides "Make the call" until `d_last_stop`. Hidden controls build no anticipation. Add
`finalCall.lockedText` (authored, optional): while `requireGlobal` is false, the footer shows a disabled
button with this text instead of nothing: "You can make the call after the last stop." The same for the
notes-only board in car 1 ("The call is made in car 5."). One string, one branch in the view.

### 8.4 Music for the call (optional)

The runtime writes one more global, `deduction_stage`: `"open"`, `"calling"` (confirm panel shown),
`"closed"`. A mission can key a music event on `global_variable_changed:deduction_stage` with
`where: { value: "calling" }` for a held, tense cue under the confirm. No new music code; a declared global
only.

## 9. Incident Simulations: make a report weigh something mid-play

Fixture B reports at the end only, so nothing a report does is felt. For real Incident Simulations cases,
suggest this pattern with existing keys:

- `when: "anytime"`, `allowed: ["report"]`, `reveal: "end"`.
- For each suspect, **both** `onRightGuilty` and `onWrongGuilty` carry the same action with `"at":
  "verdict"`: `lose_ally { npc: <s>, text: "Security has walked <name> off site pending review." }`.

Naming someone always removes them from the building, right or wrong. That costs their testimony about
others, so the player must decide whether to name early (stop the damage) or late (hear what they know
first). Because the cost is the same either way, it reveals nothing about the outcome, which fixes the
leak that `at: "verdict"` costs have in fixture C. It is also what really happens in an insider case: a
suspension ends any chance of an informal word.

DL9 will see `lose_ally` in an innocent's wrong-guilty list and derive `costly`, which is right; the stakes
line "a wrong call will change what you can do next" undersells it, so the `briefText` should say:
"Anyone you name is sent home while HR looks into it, so you won't be able to talk to them again."

## 10. Pacing as something the author can see

The validator already works out what is decided in each reachable state for DL8. Print it as an info
block (not a lint) with `--verbose`:

```
Decision curve (test_social_deduction_a):
  H          0 decided, 5 open
  H+C        2 decided (Venn, Ishikawa), 3 open
  H+C+F      4 decided (+Marsh, +Okafor by count), 1 open
  H+C+A      5 decided (+Delacroix, +Okafor, +Marsh by count)
```

Authoring targets for the README (guidance, not lints):

- The opening rooms decide nobody (DL8 already) but the first room past them decides at least one, so the
  first "aha" comes early.
- No single room decides three or more at once, except the last.
- Every case has at least one suspect who can only be decided by a count or an absence in some reachable
  order, marked "by count" or "by absence" in the curve. That is the reasoning the board exists to teach.
  All four fixtures already meet this; the curve makes it visible to authors of real missions.

## 11. Things checked and left alone

- **Reveal of the outcome on a wrong call under `reveal: "now"`** ("Wrong call: Venn matched no
  profile."). Blunt, but it teaches immediately and the costs stop it being abused. Keep it.
- **Retry off by default.** Right for tension. The guessing line (§8.1) does more for fairness than a
  retry would.
- **No mark feedback before a verdict.** Correct; feedback on marks would turn the board into a solver.
- **Count lines on the profile card.** Already the best elimination aid; §3's "Check the counts" points at
  them.
- **A timer countdown in D.** The "train is slowing" warning plus §5.1's "At risk" line gives enough
  pressure without a visible clock. Leave the countdown off, as the plan says.

## 12. Fit with the plan's packets (for whoever folds this in)

| Proposal | Packet it would touch | New keys or strings |
|---|---|---|
| §2 New since last look | runtime (P10-E), board model and view (P10-H) | `deduction_state.seen`; "New" tag; badge |
| §2.2 Case-file toast | runtime | two §6.3 strings |
| §3 Nudge "how" | evaluator (P10-A) + conformance cases, runtime | `how` on the decidable result; two §6.3 strings |
| §4 Tells, press anyway, errand recovery | fixture ink | none; §7.2 convention text |
| §5.1 Threats | runtime, model, view, schema, DL7 | `deduction.threats`, `deduction_tamper.threat`, `state.threatsDone`; "At risk" |
| §5.2 Recovered | model, view | two §6.3 strings |
| §6.1 `onThanks` | runtime, schema, DL8 note | `favours.<s>.onThanks`, `thanksLine` |
| §6.3 Favour on the board | model, view | `favours.<s>.askLine` |
| §7 Unique-item trades | fixture A ink and data | none new |
| §8.1 Guessing line | view | one §6.3 string; test state field |
| §8.2 Card-by-card reveal | view | `debrief.revealLines`; "Reveal next", "Reveal all" |
| §8.3 Locked call text | view, schema | `finalCall.lockedText` |
| §8.4 Stage global | runtime | `deduction_stage` global (DL13 declare) |
| §9 Symmetric report cost | real Incident Simulations missions | none new |
| §10 Decision curve | validator (P10-C2b) | info output only |

New player-facing strings to add to §11.8's term grep: "New", "At risk", "recovered", "Recovered", "Check
the counts", "Check what they don't have", "You are guessing on", "Every mark rests on the evidence",
"Reveal next", "Reveal all". None uses a banned word.
