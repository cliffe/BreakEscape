# Deduction board: player-facing copy drafts

Sidecar draft, 2026-10-22. Track: player-facing copy. Read-only against
`deduction/DEDUCTION_IMPLEMENTATION_PLAN.md` at **3,327 lines, latest review round 4** (§14 "Round 4
outcomes"). Nothing here changes the plan. Where a draft needs a plan change, it says so under
"Needs a plan change".

Two voices:

- **IS**: Incident Simulations. Neutral, corporate, plain. The reader is at work and wants to know
  what happened.
- **EH**: SAFETYNET: Eldritch Hacker. Pulp cosmic horror, readable first. The pulp goes into the
  framing words, never into the clue, the count, the name or the rule. If a pulp word could make a
  player unsure what the board is telling them, the IS wording wins.

**Voiced?** column: **V** = spoken in a person chat or a voiced call, so it is cached TTS and must be
fixed text (no `{var}`, no player name, no counts that change). **—** = on screen only (board, toast,
debrief, confirm panel). By the tts-audio rules, no board or toast string is ever voiced, and phone
chats are voiced only inside a voiced call.

Placeholders in angle brackets (`<name>`) are filled by the engine on screen. None appears in a V line.

---

## 0. Ground rules these drafts follow

1. **No implied count of guilty.** Never "the insider", "the cultist", "one of them is", "find the
   sleeper", "the last one". Plural-neutral forms: "anyone guilty", "whoever fits", "every suspect".
2. **No board-game terms**: no token, Mystic, Fez, Quest card, Elder Sign, fade to black. I also
   avoided "Arkham" and "quest" (DL15 warnings).
3. **Labels are not grammar.** Clue type labels in the plan are clause-like ("went in outside their
   role", fixture B) or noun-like ("brass key", fixture A). Any template that wraps a label in a
   sentence ("Both went in outside their role clues…") reads badly for one style or the other. So
   templates put labels after a colon or in a list, where either style reads cleanly (§9 below).
4. **Counts use "Label: value" form** ("Calls right: 3 of 4"), which avoids "1 marked clues" and
   needs no plural logic. Where a sentence must carry a number, the draft gives singular and plural
   forms.
5. **Never blame.** No "You failed to", "You missed", "You should have". Say what was there, where it
   was, and what habit catches it.
6. **Never say which way** in a nudge, a mark confirmation or a retry panel.

---

## 1. Board: profile card

| Key | IS | EH | Voiced? |
|---|---|---|---|
| Heading | What to look for | What to look for | — |
| Count line (default) | `<Label>: <n> in this case, <found> found` | same | — |
| Count line when all found | `<Label>: <n> in this case, all found` | same | — |
| Count line, count 1, found | `<Label>: 1 in this case, found` | same | — |
| Profiles intro (new, optional, one line under the heading) | Anyone who matches a profile is guilty. Someone who matches none is clear. | Match any profile below and they are one of them. Match none and they are clear. | — |

Notes:

- I kept the heading the same in both voices. It is a label the player looks for every time the board
  opens. EH flavour belongs in the board `title` ("Open evening", "Night train"), which is authored.
- "All found" and "found" (count 1) tell the player a count is used up without arithmetic. That is the
  hint count elimination needs, and it gives away nothing the board does not already show.
- The profiles intro teaches the "any profile" rule (§3.1, "A suspect is guilty when any profile
  matches"), which the plan never states to the player. EH "one of them" refers to the group, not to a
  number of suspects, so DL10's pattern (`one of them is`) does not fire.
  **Needs a plan change**: one new fixed string in §6.3.

## 2. Stakes lines (one per rigidity, plus suffix and hidden)

The plan's IS lines are already good. The EH lines keep the same promise word for word in the first
clause, so the stakes are never vaguer in the pulp game.

| Key | IS | EH | Voiced? |
|---|---|---|---|
| `strict` | Stakes: one wrong or missed call loses the mission. | Stakes: one wrong or missed call loses the mission. There is no second chance tonight. | — |
| `costly` | Stakes: a wrong call will change what you can do next. | Stakes: a wrong call will change what you can do next. They notice who is asking. | — |
| `light` | Stakes: a wrong call changes how this ends, not what you can do. | Stakes: a wrong call changes how this story ends, not what you can do. | — |
| Score suffix (`scoreLine: true`) | A wrong or missed call also costs part of your score. | same | — |
| `hidden` | The stakes are not known. | The stakes are not known. Choose as if they matter. | — |

Notes:

- `light` gains "not what you can do". It tells the player they can act freely, which is the point of a
  light case, and it separates `light` from `costly` at a glance.
- EH `strict` "tonight" assumes a night-time set piece. If a strict EH case is set by day, drop the
  second sentence; the first already carries the rule. "No second chance" stays true only while
  `retry` is 0; with `retry: 1` the EH line must be the plain one (the engine knows `retry`, so it can
  pick). **Needs a plan change** if the EH set is adopted.
- EH `costly` "They notice who is asking." is honest for every costly effect in fixture A (suspicion,
  a lost ally, the doorman). It promises nothing specific.

### `briefText` drafts (authored, per mission; shown on the board and in the brief)

These are examples for each rigidity. The brief must carry them verbatim (DL9(d)), so if the brief is a
voiced HaX or Nair line, the `briefText` is voiced too and must stay fixed text.

| Rigidity | IS | EH | Voiced? |
|---|---|---|---|
| strict | Name an innocent colleague, or leave someone guilty unnamed, and the investigation fails. | Name an innocent, or leave a cultist unnamed, and the ritual completes. You will not get a second chance. (plan's D text, kept) | V if in a voiced brief |
| costly | Name the wrong person and staff will stop talking to you. Name them twice and security escorts you out. | Name an innocent guest and the lodge will close ranks against you. Miss a cultist and they will be waiting at the ritual. (plan's A text, kept) | V if in a voiced brief |
| light | Name the wrong people, or miss someone, and the report will say so. (plan's B text, kept) | Name the wrong people and the town will remember it. Miss one of them and the story ends darker. | V if in a voiced brief |

EH light "Miss one of them" does not imply how many are guilty (it is a conditional about one person,
and DL10 matches only `one of (them|you|these) (is|was)`). If a reviewer reads it as a count, use "Miss
a cultist" instead.

## 3. Suspect cards

| Key | IS | EH | Voiced? |
|---|---|---|---|
| Cell, hidden | Hidden | Hidden | — |
| Cell, destroyed | Evidence destroyed | Evidence destroyed | — |
| Cell, recovered (new) | `<label>` (recovered) | same | — |
| Marked | ✦ marked | ✦ marked | — |
| Cell, screen-reader text | `<slot label>: <label>, marked` / `<slot label>: hidden` / `<slot label>: evidence destroyed` | same | — |
| Mark buttons | Undecided · `<guilty noun>` · `<clear noun>` | same | — |
| Profile picker | Which profile fits? | Which profile fits? | — |
| Clear reasons picker | What rules them out? (optional) | same | — |
| Locked mark | Verdict given | Verdict given | — |
| Verdict line | `Verdict: <noun> (<kind word>)` | same | — |
| Kind words | accused · reported · knocked out · acted on · at the final call | same | — |
| Kind `none` | Not named | Not named | — |

I kept every cell string identical across the voices. They are what the player scans to deduce, and
pulp wording there obscures clues, which the brief rules out. "Which profile fits?" replaces "Which
profile?" because the bare form reads as a menu heading, not a question.

"Recovered" is new: the plan lists `recovered` facts in the model (§6.2) but shows them only in the
debrief. A small tag on the cell tells the player the tamper was undone. **Needs a plan change**
(one fixed string, render only).

## 4. Mark confirmations and first-use help (live region)

The plan's live region carries "mark confirmations" (§6.4) but gives no text.

| Key | IS | EH | Voiced? |
|---|---|---|---|
| Marked guilty | `<name>` marked `<guilty noun>` (`<profile label>`). | same | — |
| Marked clear | `<name>` marked `<clear noun>`. | same | — |
| Marked clear with reasons | `<name>` marked `<clear noun>`, because of: `<labels>`. | same | — |
| Marked undecided | `<name>` marked Undecided. | same | — |
| First mark only (once per case) | Marks are your notes. Nothing is final until you give a verdict. | Marks are your notes. Nothing is final until you give a verdict. | — |
| Mark refused after a verdict | `<name>` already has a verdict. | same | — |

The first-mark line matters: without it a cautious player may not mark anyone, for fear a mark is a
verdict. **Needs a plan change** (`state` already has room for a "seen" flag; one fixed string).

## 5. Nudge

| Key | IS | EH | Voiced? |
|---|---|---|---|
| Nudge (card line and toast) | You have enough to decide about `<name>`. | You have enough to decide about `<name>`. | — |
| Toast title | Case file | Case file | — |

Kept as the plan has it in both voices. It must never lean either way, and any pulp phrasing I tried
("Something about `<name>` is now clear") read as a hint towards guilt.

## 6. KO warning (first punch on a calm suspect)

| Key | IS | EH | Voiced? |
|---|---|---|---|
| Warning | — (Incident Simulations has `disableAttacks: true`; never shown) | Knocking out a suspect counts as accusing them. It can't be undone. | — |
| Strict suffix | — | A wrong one loses the mission. | — |

"It can't be undone" states the user's Q2 rule (a KO is final). The plan's line says the KO counts but
not that it stands. **Needs a plan change** (wording only).

## 7. Verdict feedback

### Reveal `now` (toasts, §5.5)

| Outcome | IS | EH | Voiced? |
|---|---|---|---|
| Right guilty | Right call: `<name>` matched the `<profile>` profile. | same | — |
| Wrong guilty | Wrong call: `<name>` matched no profile. The debrief will show why. | same | — |

### Reveal `end`, or `when: "final"` (new: a verdict is recorded but not graded)

| Key | IS | EH | Voiced? |
|---|---|---|---|
| Verdict recorded | Verdict recorded: `<name>`, `<kind word>`. You'll see how it stood when the case closes. | Verdict recorded: `<name>`, `<kind word>`. You'll learn whether you were right when the case closes. | — |
| KO under `final` | Verdict recorded: `<name>`, knocked out. Their mark is locked as `<guilty noun>`. | same | — |

Without this, a report or a KO under `final` changes nothing the player can see except a greyed mark
button. **Needs a plan change** (two fixed strings; the runtime already knows the moment).

### Close hint (default, when every suspect has a verdict)

| IS | EH | Voiced? |
|---|---|---|
| Everyone has a verdict. Close the case when you're ready. | Every suspect has a verdict. Close the case when you're ready. | — |

The authored `closeHint` should say **where** to close ("Call Nair", "Use the exit phone"). The default
cannot, so missions with `anytime` must author one (the plan already requires it).

### Tamper toast (default `tamperText`)

| IS | EH | Voiced? |
|---|---|---|
| Someone has destroyed evidence. Check the case file: what was lost can still be found another way. | Someone has been at the evidence, and a clue is gone. The case file shows what was lost. It can still be found another way. | — |

The plan's default ("Someone has been at the evidence.") leaves a player worried the case is now
unwinnable. DL7 guarantees a second route, so the toast can say so, and that keeps a light case light.
Missions that want dread can author their own `tamperText`.

### Close failure (system, §5.5)

| IS and EH (same) | Voiced? |
|---|---|
| The case couldn't be closed. Open the case file to try again. | — |

Always plain in both voices: it is an error, not story.

## 8. Final call

| Key | IS | EH | Voiced? |
|---|---|---|---|
| Button | Make the call | Make the call | — |
| Blocked (`requiresAll`) | Mark every suspect first. Still undecided: `<names>`. | same | — |
| Confirm panel heading | Your call | Your call | — |
| Confirm panel row | `<name>`: `<mark>` (`<profile label>`) | same | — |
| Confirm panel row, KO | `<name>`: `<guilty noun>` (knocked out, locked) | same | — |
| Confirm warning | This closes the case. You can't change a call afterwards. | This closes the case. Once it's done, it stays done. | — |
| Undecided warning (new, when any mark is Undecided and `requiresAll` is false) | Anyone still Undecided will be cleared. | Anyone still Undecided will be cleared. | — |
| Confirm button | Confirm the call | Confirm the call | — |
| Back button | Go back | Go back | — |

"Still undecided: Okoro, Haddad" avoids the is/are agreement of the plan's "<names> still undecided".

The undecided warning is the most important addition in this track. §6.6 says "undecided counts as
clear", and the plan's confirm panel does not say so. A player who leaves someone Undecided because
they were unsure is clearing them without knowing it, and the debrief would then grade that as a
deliberate clear. **Needs a plan change** (one fixed string, shown only when it applies).

## 9. Retry panel (opt-in, before the debrief)

| Key | IS | EH | Voiced? |
|---|---|---|---|
| Body | Not every call was right. You can try once more, or see the debrief. | Something in your reckoning is wrong. You can try once more, or see the debrief. | — |
| Small print (new) | Seeing the debrief ends your chance to try again. | Seeing the debrief ends your chance to try again. | — |
| Buttons | Try again · See the debrief | same | — |

The small print states §6.7's rule (declining is recorded and synced before anything shows). Without
it, a player clicks "See the debrief" expecting to come back. Names no suspect and no outcome.
**Needs a plan change** (one fixed string).

## 10. Debrief

### Section labels

| Key | IS | EH | Voiced? |
|---|---|---|---|
| Heading (default; authored `debrief.heading` overrides) | How the case stood | How the case stood (author e.g. "What the night revealed") | — |
| Section labels | The truth · Your verdict · Your note · Outcome · What you held · Why | same | — |
| Finish | Finish | Finish | — |
| Reopen from board | View the debrief | View the debrief | — |

### Truth line

The plan has two forms (§3.10 "Guilty: matches Keyholder"; §6.7 "Insider: matched the Insider
profile"). The second repeats itself whenever the noun and the profile label are the same word, which
fixture B does. Proposal:

| Case | Text |
|---|---|
| Guilty, several profiles | `<guilty noun>`. Matched `<profile label>`. |
| Guilty, the case has one profile | `<guilty noun>`. Matched the profile. |
| Clear | `<clear noun>`. Matched no profile. |

Examples: "Cultist. Matched Keyholder." "Insider. Matched the profile." "Not a sleeper. Matched no
profile."

### Outcome words (with ✓ or ✗ icon)

| Outcome | IS and EH (same) |
|---|---|
| right_guilty | ✓ Right call |
| right_clear (given a verdict or cleared at the final call) | ✓ Rightly cleared |
| right_clear, kind `none` | ✓ Not named: innocent |
| wrong_guilty | ✗ Wrong call |
| missed_guilty | ✗ Missed |

"Not named: innocent" instead of "Not named (innocent)": the colon reads as a result, the brackets
as an aside.

### Your note

| Case | Text |
|---|---|
| Guilty mark | Your note: `<guilty noun>`, `<profile label>`. |
| Clear mark with reasons | Your note: `<clear noun>`, because of: `<labels>`. |
| Clear mark, no reasons | Your note: `<clear noun>`. |
| No mark | Your note: none. |

### Why lines (on every card)

The plan's templates ("Courier: no, carries a ward charm") need a verb phrase built from a clue label,
which only works if every label is written to complete "they …". Fixture B's labels do; fixture A's
noun labels do not. Label-agnostic forms:

| Rule clause | Met (yes) | Failed (no) |
|---|---|---|
| `has c`, the clue held | `<Profile>`: yes. Found: `<label>`. | — |
| `has c`, the slot full without it (absence) | — | `<Profile>`: no. Not found: `<label>`. All of their "`<slot label>`" clues are known. |
| `has c`, count used up | — | `<Profile>`: no. Not found: `<label>`. Every one in the case is accounted for elsewhere. |
| `not has c`, the clue held | — | `<Profile>`: no. Found: `<label>`, which the profile rules out. |
| `not has c`, absent | `<Profile>`: yes. Not found: `<label>`, as the profile requires. | — |
| `markedAtLeast n` | `<Profile>`: yes. Marked clues: `<k>` (needs `<n>`): `<labels>`. | `<Profile>`: no. Marked clues: `<k>` (needs `<n>`). |
| `all`, failed | the first failing child's line | |
| `any`, met | the first met child's line | |

Examples (fixture A): "Courier: no. Found: ward charm, which the profile rules out." "Devotee: yes.
Marked clues: 3 (needs 3): sigil ring, burner SIM, wants a promotion." Fixture B: "Insider: no. Not
found: grievance. All of their "Grievance" clues are known."

The absence line ("All of their … clues are known") carries the lesson that matters most in this
mechanic: a complete record that lacks something is evidence.

### Wrong or missed: what settled it

| Key | Text |
|---|---|
| Already held, one clue | You already held what settled it: `<label>`. `<why line>` |
| Already held, several | You already held what settled it: `<labels>`. `<why line>` |
| Settling clue, one | The clue that would have settled it: `<label>`, from `<place>`. |
| Settling clues, several | The clues that would have settled it: `<label>` (from `<place>`), `<label>` (from `<place>`). |
| Not ruled out (innocent, not named, undetermined) | You left them unnamed without ruling them out. `<label>`, from `<place>`, would have cleared them. |

`<place>` is an object or NPC display name. Object names need to read after "from": "from the badge
log", not "from badge_log_terminal" or "from Badge Log Terminal". Worth a lint (DL15 already reads the
names): warn when a route's display name starts with a capital common noun or contains an underscore.

### Count elimination and pigeonhole

| Case | Text |
|---|---|
| count 1 (missing from the plan) | `<label>`: the only one was found on someone else, so `<name>` can't have it. |
| count 2 | `<label>`: both were found on others, so `<name>` can't have one. |
| count 3 or more | `<label>`: all `<n>` were found on others, so `<name>` can't have one. |
| Pigeonhole | `<label>`: no one else had a hidden clue left that could be it, so it had to be `<name>`'s. |

The plan has "Both" and "All <n>" but no line for count 1, which is the commonest case (fixture A's
brass key, sigil ring and burner SIM are all count 1). The plan's pigeonhole line ("Only <name> had room
left for the <label>") uses "room", which a player reads as a place.

### Favours, destroyed evidence, summary

| Key | IS | EH | Voiced? |
|---|---|---|---|
| Favour backfired (default `debriefLine`) | You helped `<name>` before checking them. | You did `<name>` a favour before you knew what they were. | — |
| Evidence destroyed, recovered | Destroyed, then recovered: `<label>`. | same | — |
| Evidence destroyed, not recovered | Destroyed and not recovered: `<label>`, also found at `<place>`. | same | — |
| Destroyed after the call | Destroyed after the case closed: `<label>`. It made no difference to your calls. | same | — |
| Summary | Calls right: `<r>` of `<t>`. Cleared with a reason: `<c>`. | same | — |

"Not recovered … also found at <place>" tells the player the second route existed (DL7) without blame.

### No-blame lines (chosen by case, §6.3 order)

| Case | IS | EH | Voiced? |
|---|---|---|---|
| misread (a wrong call when the clues already decided it) | You had the evidence. Check each line of a profile against it, one at a time: that habit catches this. | The signs were in your hands. Hold each line of the profile against them, one at a time. That habit is what keeps them out. | — |
| notActed (worked out, never named) | You had worked it out. Naming them is the step that turns evidence into a result. | You saw them for what they were. Naming them is what stops them. | — |
| missed (a clue not found) | A missed clue is not a mistake in judgement. The debrief shows where the evidence was. | A clue you never found is not a failure of judgement. The debrief shows where it was hidden. | — |
| allRight | Every call matched the evidence. | Every call matched the evidence. Nothing slipped past you. | — |

EH "keeps them out" and "stops them" use "them" for the group and say nothing about how many there
were. EH allRight avoids "you found them all", which would mislead in a case with no one guilty.

### Teaching lines (new, optional): "What this shows"

One short line under the summary, picked by what the cards contain, first match wins. The plan's why
lines show the reasoning; these name the habit, which is the educational payload of the mechanic. Same
text in both voices, because it is the lesson.

| Trigger | Line |
|---|---|
| Any card's why line is an absence ("Not found … all known") | A complete record that lacks something is evidence too. When every entry is in, a missing one clears someone as surely as a sighting would. |
| Any count elimination or pigeonhole line | Counting matters. When every copy of a clue is accounted for, everyone else is ruled out without another search. |
| Any `alreadyHeld` line | Before naming anyone, check your evidence against every line of the profile. Most wrong calls come from a step skipped, not a clue missing. |
| Any `markedAtLeast` why line | Some profiles are about how much adds up, not one damning item. Count the marked clues. |
| A favour backfired | Check who is asking before you help. A favour for someone you haven't checked can do their work for them. |

**Needs a plan change**: one model field (`lesson`) and five fixed strings. Cheap, because the cards
already carry every input.

---

## 11. Authored ink templates (voiced)

Fixed text, with no `{var}` or player name, and no line that implies how many are guilty. Each suspect
gets their own literal line. The speaker prefix is set on every line.

### 11.1 Narration lines are voiced as the NPC

§7.5's example has `You give Nair a name: Ngozi Okoro. #verdict:report:ded_b_okoro` with no prefix. By
the TTS extractor's rule (no prefix → the conversation's NPC), Nair's voice would read "You give Nair a
name". Two fixes: prefix it `Narrator:`, or drop the narration and put the tag on the NPC's
acknowledgement, as below. I recommend the second: it is shorter and the player's choice already says
what they did.

### 11.2 Report hub (IS, Nair, person chat or voiced call)

```ink
=== report_hub ===
Nair: Who do you want me to look at? Name anyone the evidence supports. Names you give me stand.
+ {deduction_verdict_ded_b_okoro == ""} [Name Okoro. This can't be taken back.] -> name_okoro
+ {deduction_verdict_ded_b_lindqvist == ""} [Name Lindqvist. This can't be taken back.] -> name_lindqvist
+ [That's everyone I'm naming] -> close_check
+ [Not yet, I want to check something] -> hub
=== name_okoro ===
Nair: Okoro. Noted. #verdict:report:ded_b_okoro
-> report_hub
=== close_check ===
Nair: Anyone you haven't named is cleared, and the shift report goes up tonight. Sure?
+ [Yes, send it] -> send
+ [Not yet, I want to check something] -> hub
=== send ===
Nair: Done. I'll take it from here. #verdict_close
-> END
```

"Name anyone the evidence supports" replaces "Name as many as the evidence supports", which can read
as "there are several". "That's everyone I'm naming" replaces "That's everyone", which can read as
"I've named every guilty person" and so implies a count.

### 11.3 Report hub (EH, HaX, voiced call)

```ink
=== report_hub ===
HaX: Give me names, Agent. Only the ones the evidence holds up. Once I pass a name on, it stays passed on.
+ {deduction_verdict_ded_a_okafor == ""} [Name Okafor. This can't be taken back.] -> name_okafor
+ [That's everyone I'm naming] -> close_check
+ [Not yet, I want to check something] -> hub
=== name_okafor ===
HaX: Okafor. Passed on. #verdict:report:ded_a_okafor
-> report_hub
=== close_check ===
HaX: Anyone you haven't named walks out of here cleared. Whatever happens after that, happens. Ready?
+ [Yes, close it] -> send
+ [Not yet, I want to check something] -> hub
=== send ===
HaX: Done. Get clear of that house. #verdict_close
-> END
```

HaX's lines stay clipped and calm (the TTS style rule: urgency in the pace, never in the voice).

### 11.4 Favour warning (said once, in the brief or the first handler call)

| IS (Nair) | EH (HaX) | Voiced? |
|---|---|---|
| Nair: One thing. Don't do favours for anyone on that list until you've checked them. | HaX: And Agent: don't run errands for anyone until you've checked them. A favour for a cultist is a favour for the cult. | V |

### 11.5 Unique-item choice (EH, §7.8)

The plan's text is good. One change: the "follow" branch's "She still needs naming" is accurate but
reads as a rebuke. Alternative: `HaX: Fine. Watching won't stop her tonight. You'll still need to name her.`

### 11.6 Escalation warning (EH, fixture A's third wrong call)

The plan's "You've burned the evening. Get out now?" is good. Paired choices for DL12:

```ink
HaX: You've burned the evening, Agent. They all know what you're doing. Get out now?
+ [Get out. This closes the case.] -> leave
+ [Not yet, one more thing] -> END
```

### 11.7 Closing-call lines (voiced, per outcome, condition on `deduction_outcome_<s>`)

Write one closing line per suspect and outcome, not one per total score: per-suspect lines stay fixed
text and cache once. Examples:

| Outcome | IS (Nair) | EH (HaX) |
|---|---|---|
| right_guilty | Nair: Okoro's account is suspended. Her badge stopped working an hour ago. | HaX: Okafor's in a van. The key's in an evidence bag. |
| wrong_guilty | Nair: Haddad's been stood down while we check. She's not happy, and I don't blame her. | HaX: Venn's furious. She was never one of them. |
| missed_guilty | Nair: Lindqvist was in again last night. We'll be dealing with that for a while. | HaX: Marsh left before the doors were locked. We'll see her again. |
| right_clear | Nair: Morgan's back on shift. Nobody needs to know she was on the list. | HaX: Delacroix went home none the wiser. Good. |

"Nobody needs to know she was on the list" models the right practice in an insider case: an
investigation that clears someone should not mark them.

---

## 12. Mission-authored fields (examples for each voice)

| Field | IS | EH |
|---|---|---|
| `title` | Night shift | Open evening |
| `verdictNoun` | Insider / Not an insider | Cultist / Not a cultist |
| `closeHint` | Everyone has been dealt with. Use the exit phone when you're ready to leave. | Every guest has a verdict. Call HaX when you're ready to leave. |
| `debrief.heading` | How the case stood | What the evening revealed |
| `debrief.closingLine` | The access log, the network and the HR file each cleared someone. Okoro fitted all three. | The lodge keeps its secrets badly. Every name tonight was settled by something in plain sight. |
| `tamperText` | Someone has wiped part of the badge log. | The archive ledger has been torn. One page is gone. |
| `lose_ally` text | Haddad won't speak to you now. | Venn won't help you now. |

---

## 13. Problems found in the plan's existing strings

1. **"Undecided counts as clear" is never shown** (§6.6). The confirm panel must say it (§8 above).
2. **No count-1 elimination line** (§6.3 "Count elimination"). The commonest case has no text (§10).
3. **Label-in-sentence templates break with fixture B's labels** ("Both went in outside their role
   clues were found elsewhere"). Use the colon forms (§10).
4. **§3.10 and §6.7 give different truth lines**, and §6.7's repeats itself when noun and profile label
   are the same word.
5. **"<names> still undecided"** has no verb agreement with one name or several.
6. **Threshold line "<n> marked clues"** reads "1 marked clues" when k is 1.
7. **Summary "2 suspects cleared with a reason"** has the same plural problem; "Label: value" fixes it.
8. **§7.5's narration line has no `Narrator:` prefix** and would be voiced as Nair (§11.1).
9. **Retry panel does not warn that declining is final** (§6.7 says it is recorded).
10. **No feedback when a verdict is recorded but not graded** (`when: "final"`, `reveal: "end"`).
11. **KO warning does not say a KO cannot be undone** (user Q2).
12. **"Name as many as the evidence supports" and "That's everyone"** (§7.5) lean towards a count.
13. **One string table, two games.** The plan's §6.3 is one table. If EH variants are wanted for
    engine strings, the cleanest form is a `deduction.voice: "plain" | "pulp"` key that switches only
    the strings marked differently in this file: three stakes lines, the KO suffix, the "verdict
    recorded" line, the confirm warning, the retry body, the default favour line, three no-blame lines
    and the defaults for `tamperText` and `closeHint`. Every cell, count, why, outcome and teaching
    string stays shared. If the user prefers no new key, use the IS set for both games: it reads
    fine in a pulp setting, and the authored fields carry the tone.

## 14. Term check

Grepped this file's player-facing strings by hand for: token, mystic, fez, quest, elder sign, fade to
black, arkham, herald, zealot, chosen. None appears. No string says "the <guilty noun>", "one of them
is", "exactly", or "only one of".
