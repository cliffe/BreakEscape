# Sidecar design: characters and social drama in a deduction case

Track: FUN, characters. Read against `DEDUCTION_IMPLEMENTATION_PLAN.md` at **3327 lines, latest review
round 4** (§14 "Round 4 outcomes"). Another workflow is editing the plan, so section numbers here are those
of that version. Nothing here edits the plan; it is a proposal for the fixture packets (P10 fixture B and A
ink) and for `README_scenario_design.md`'s "Deduction cases" section.

## 1. What is missing now

The plan gets the logic right. The people are thin. Tomás is a clue dispenser with a meter, the suspects
exist to hold an accusation knot, and nobody notices they are being investigated. Horror on the Orient
Express is fun because the passengers are characters: they gossip, they bristle, and the innocent ones
have something to hide too. That is also the lesson. Real insider work is mostly about people who look
bad for ordinary reasons.

Five things would add the most for the least engine work:

1. **Witnesses with a voice and a visible limit.** Each one has a want, a dislike and a tell one question
   before they turn wary.
2. **Suspects who notice.** Their opening line changes with what the player holds about them, and the
   same ladder applies to the innocent and the guilty.
3. **Lies about one slot, exposed by a record.** A lie is an untagged line. The record's fact, granted by
   its usual route, exposes it, and the exposure grants nothing new.
4. **Innocents with secrets.** At least one innocent lies, has a reason, and is not guilty of what the
   case is about.
5. **A human cost to naming someone.** The accused reacts, the people around them react, and the handler
   says what happens to them next.

Every pattern below needs no engine change: ink conditionals on globals already declared, `eventMappings`
barks that already exist (`systems/npc-manager.js:1198-1240`) and `_` note keys that `social` already
allows. One optional addition (§8) is a debrief aside, and nothing here depends on it.

## 2. The ground rule: the truthful-clue model stays whole

The evaluator reads `H`, the facts granted through `grantFact`. Every granted fact is true. Characters
can lie, gossip and contradict each other as long as **none of that is a `#grant_fact`**.

| Line kind | Tag | Enters `H`? |
|---|---|---|
| A witness's true report about someone else | `#grant_fact:<fact>` | yes |
| A suspect's claim about themselves (true or false) | none | no |
| A suspect caught out by a record the player holds | none (the record already granted the fact) | no new fact |
| Gossip, opinion, a witness's wrong assumption | none | no |
| A suspect showing what the player can see ("show me your kit") | `#grant_fact`, allowed by §7.1 | yes |

Three rules follow:

- **Lie only about a slot that has a route outside the liar.** The record or another witness must be able
  to expose the lie. A lie the player can never check is unfair.
- **Gossip that grants is written from the record's angle.** A fact's `text` must read true whatever
  grants it (§4.2), so a witness's line can be colourful while the fact text stays plain.
- **Flavour first.** Every pattern below is marked **flavour** (no route changes, so the plan's DL6 and DL8
  hand checks still hold) or **route** (adds or moves a grant; the fixture's hand check must be run
  again). This document recommends flavour-only changes for fixtures A and B. Route ideas are listed for
  real missions.

## 3. Fairness: reactions must not leak the answer

A nervous guilty suspect next to three relaxed innocents is a tell that skips the deduction. So:

- **Reactions follow the evidence held, never the truth.** A suspect's mood reads the `se_intel_*` facts
  about them, not `solution`, and not their guilt.
- **One ladder for everyone.** Every suspect in a case gets the same heat steps. Their personalities
  change the wording, not the steps.
- **Count the suspicious-looking clues, not the guilty ones.** In fixture B, "heat" counts held
  out-of-role access, personal device and grievance facts. Lindqvist (innocent) can reach heat 2 and
  Haddad (innocent) heat 1. Okoro reaches heat 3, but only when the board already shows she fits the
  profile, so her reaction says nothing the board does not.
- **Lie parity.** If a guilty suspect lies, at least one innocent lies too, about a different slot. Fixture
  B: Okoro (guilty) lies about access, Haddad (innocent) lies about her device. Fixture A: Okafor (guilty)
  lies about what she wants, Venn and Ishikawa (innocent) lie about where they were and what they carry.
  Marsh, the other cultist, does not lie: she charms instead.
- **Under `reveal: "end"`, nobody reacts to being named until close.** The outcome globals are empty
  until then (§4.4). Fixture B's reactions to a report live only in Nair's last line.
- **Under `reveal: "now"`, the accused's reaction may show right or wrong**, as §7.4 already does, because
  the toast has said it anyway.

Review check (a possible DL warning later, ⚠️ only): a suspect's ink that branches on
`deduction_outcome_*` before close in a `reveal: "end"` case, or on another suspect's guilt by name, is
suspect. There is no lint for "a suspect's own ink grants their own cell" either. §7.1 allows it only for
something the player can see, so a ⚠️ with a `_why` exemption would catch slips.

## 4. Patterns

### 4.1 Voice card for every witness and suspect (flavour, data notes)

`social` treats `_` keys as notes, so a voice card costs nothing in the schema. Put it on the
`social.characters` entry (witnesses) or a `social.people` entry (suspects), for reviewers and the
dialogue review:

```jsonc
"ded_b_tomas": {
  "_voice": "Dry, observant, proud of knowing the building. Talks while he works. Never says 'mate'.",
  "_wants": "To be noticed. Thanking him works once (the coffee).",
  "_dislikes": "Being treated as furniture. Rapid questions.",
  "_tell": "After the second question he looks at the clock and mentions his rounds.",
  "_secret": null,
  "influence": { ... }, "thresholds": [ ... ]
}
```

```jsonc
{ "id": "ded_b_haddad", "name": "Samira Haddad", "role": "Service desk analyst",
  "_voice": "Quick, polite, a bit too ready with policy.",
  "_lie": { "slot": "device", "claim": "I never bring my own kit in.", "exposedBy": "b_haddad_device" },
  "_secret": "Studying for a certification on her own laptop during quiet hours." }
```

The `_lie.exposedBy` note lets a reviewer check the rule in §2 by hand: the fact exists, has a route that
is not the liar, and the exposure topic is gated on it.

### 4.2 The tell before wary (flavour)

The `wary` band should never surprise the player. One question before it, the witness shows strain. With
the default costs (§7.2), Q2's cost takes the witness to −15 and Q3's to −30, past `wary` (−20). So the
tell goes after Q2's charge, in the shared `charge` knot:

```ink
=== charge ===
~ ded_b_tomas_questions += 1
{ ded_b_tomas_questions > 1:
    ~ se_influence(-15, "pressed")
}
{ ded_b_tomas_questions == 2:
    Narrator: Tomás looks at the clock above the sink.
    Tomás: I've got the second floor to do before three.
}
-> topics
```

It costs nothing and changes no grant. It turns the meter from a hidden number into a person running out
of patience, which is the social engineering lesson: people close up when pushed.

### 4.3 Suspects who notice (flavour)

Each suspect's entry knot reads the held facts about them and picks an opener. Ink cannot add booleans
safely, so count in a function:

```ink
VAR se_intel_b_okoro_access = false
VAR se_intel_b_okoro_device = false
VAR se_intel_b_okoro_grievance = false

=== function okoro_heat() ===
~ temp h = 0
{ se_intel_b_okoro_access:
    ~ h = h + 1
}
{ se_intel_b_okoro_device:
    ~ h = h + 1
}
{ se_intel_b_okoro_grievance:
    ~ h = h + 1
}
~ return h

=== start ===
{ okoro_heat():
- 0: Okoro: Kettle's just boiled if you want one.
- 1: Okoro: You're the one from security. Tomás said.
- 2: Okoro: You've been asking about me. Ask me, then.
- else: Okoro: Go on. You've clearly made your mind up.
}
-> hub
```

The same three-step ladder, worded for each person, goes into Lindqvist, Haddad and Morgan. Each counts
only the suspicious-looking clue types (§3). For a clue that clears (`no_grievance`), the suspect can relax
instead, which also teaches that clearing someone is worth saying out loud:

```ink
{ se_intel_b_morgan_grievance:
    Morgan: HR tell me you've seen my file. Nothing in it, I hope.
}
```

### 4.4 A bark when the player takes something (flavour)

When the player picks up evidence near a suspect, a once-only bark shows they noticed. `eventMappings`
with `bark` already does this (`systems/npc-manager.js:1198-1240`). Keep it to one or two per case, guard
it on the suspect having no verdict, and fire it for the innocent as readily as for the guilty:

```jsonc
"eventMappings": [
  { "eventPattern": "global_variable_changed:se_intel_b_haddad_grievance",
    "condition": "value === true && window.gameState.globalVariables.deduction_verdict_ded_b_haddad === ''",
    "onceOnly": true,
    "bark": "Was that the HR cabinet? I hope that's not about me." }
]
```

The HR summary grants all four grievance facts at once, so Haddad's bark fires whether the player suspects
her or not. That is the point: a reaction to an action, not to guilt. (Check the condition form against
`_mappingWouldFire` before using it; m02 uses `data.itemId === ...` and `value === true`.)

### 4.5 The lie and its exposure (flavour)

A lie has two knots, a claim and an exposure. Neither carries a grant.

```ink
VAR se_intel_b_haddad_device = false
VAR ded_b_haddad_claimed_device = false

=== ask_kit ===
~ ded_b_haddad_claimed_device = true
Haddad: My own laptop? No. Policy says company kit only, and I'm the one who has to enforce it.
-> hub

=== hub ===
+ {not ded_b_haddad_claimed_device} [Ask whether she brings her own kit in] -> ask_kit
+ {ded_b_haddad_claimed_device and se_intel_b_haddad_device} [Tell her the DHCP list shows her laptop] -> caught_device
...
```

- The claim sets a story-local VAR. Make it a declared global only if another NPC or Nair reacts to it
  (then declare it in `globalVariables` and as an ink VAR, §4.4 of the plan).
- The exposure choice needs both the claim and the record. If the player found the record first, offer a
  version without "You told me…": "Ask her about the laptop on the DHCP list".
- The exposure gives a **reason**, never a confession, and never a clearing. The board decides.
- A caught lie should open something: a moral choice (§5.1), a secret, or a better attitude. It should
  not close a topic the player still needs, because DL6 does not read story-local VARs.

### 4.6 Witnesses who get it wrong (flavour)

A witness can be honest and mistaken. The record settles it. This is the cheapest contradiction there is,
and it teaches that logs beat memory:

- the witness states what they think they saw (no grant);
- the record grants the fact as usual;
- a topic gated on both lets the player put it to the witness, who shrugs or digs in.

Fixture B example in §6.2: Tomás says he saw someone in a facilities jacket go into the server room at two
and assumed it was Erik. The badge log puts Lindqvist there at 23:40 and Okoro at 02:10.

### 4.7 Gossip that travels (flavour)

When one person talks, others hear. Cheap ways to show it, all reading globals already declared:

- A witness's `reports` band flag (`ded_b_tomas_reported`) changes a suspect's opener: Morgan, the
  supervisor, says "Tomás tells me you've been grilling him. He's my cleaner, not your informant." The
  reports threshold stops being a silent number and becomes a scene.
- A witness's topic held (`se_intel_*`) changes another witness's opener: the bar staff in A says "The
  intern's been telling you about Marsh, then."
- A wrong accusation (`a_lodge_suspicious`) changes the openers of everyone else at the party. Only the
  openers: if a witness gated topics on it, DL6's "after a wrong call" check would have to be redone.

### 4.8 The loud accuser (flavour; route if it grants)

One character who points fingers is good theatre and a good lesson: confidence is not evidence. Make the
accuser innocent, and make their accusation partly true, so the player cannot dismiss it either. In A,
Delacroix fills this role (§7.3). If the accuser's claim is to grant a fact, it is a route change.

### 4.9 Suspect deflection (flavour)

A guilty suspect points at someone else, with a true fact the player could check. Okoro: "Ask Erik why he
was in the server room before midnight." It is true (the log shows it), it grants nothing, and it sends
the player towards an innocent red herring. Innocents deflect too, so deflection is not a tell. Haddad
might say "Gwen's the one with keys to everything."

## 5. Cost of accusing a colleague

### 5.1 The small moral choice that is not a verdict

Catching an innocent in a lie should leave the player with a decision about proportion. It must never look
like a verdict, so it lives in the suspect's own conversation, never in Nair's report hub, and it sets an
ordinary global:

```ink
=== caught_device ===
Haddad: I'm doing my CCNA. Quiet hours on nights are the only time I get.
Haddad: It's on the guest Wi-Fi most nights. Last night it wasn't, I was in a hurry.
Haddad: Please don't put it in your report. Gwen will have me on a warning.
+ [Tell her you'll have to mention it to Nair]
    ~ b_haddad_policy = "mention"
    Haddad: Right. Fair enough. I'd say the same to anyone else.
    -> hub
+ [Tell her to take it home tonight and leave it there]
    ~ b_haddad_policy = "let_go"
    Haddad: Thank you. It won't be back.
    -> hub
```

Neither choice changes the case. Nair's last line reads `b_haddad_policy` (§6.6). A real lesson sits
under it: a personal device on the network is a real risk and a policy matter, and it is still not the
same as being the insider. Fixture B stays `light` because nothing gated reads the global.

### 5.2 The handler says what naming someone means

Before the report, Nair should say once what a name costs, in her voice, not as a rules line. This is the
proportionality lesson, and it must not imply a count:

> Nair: Whoever you name gets walked out tonight and their badge stops working. Some of these people have
> been here fifteen years. Name the ones the evidence supports, and nobody else.

Check against DL10: no "the insider", no number. "Name the ones the evidence supports" is plural and
open.

### 5.3 The accused speaks

Under `reveal: "now"` (fixture A) the accusation knot already reads the outcome (§7.4). The plan's two
lines ("How did you…" / "You're making a mistake.") are placeholders. Each suspect deserves their own,
and the wrong-call version should hurt a little. §7.3 has A's set.

## 6. Fixture B: Night shift, sample dialogue

Cast as in §4.9. Suggested characters (placeholders until the fixture packet confirms names and art):

| Who | Truth | Personality | Secret | Lie |
|---|---|---|---|---|
| Ngozi Okoro, night operator | insider | Tired, sharp, funny when she forgets herself; still angry about the appeal | Someone outside the firm got in touch after the appeal | Says she hasn't been in the server room for weeks (access) |
| Erik Lindqvist, facilities engineer | clear | Blunt, aggrieved, honest to a fault; old Nokia, no smartphone | Does unpaid checks on the UPS he thinks will fail, because overtime was refused | None. He tells you more than you want |
| Samira Haddad, service desk | clear | Quick, polite, quotes policy | Studies on her own laptop | Says she never brings her own kit (device) |
| Gwen Morgan, shift supervisor | clear | Protective of her team, a bit territorial | Signed off the rota that cost Okoro her appeal and feels bad about it | None |
| Tomás Rivera, cleaner | witness | Dry, notices everything, wants to be noticed | None | None, but gets one thing wrong (§4.6) |
| Priya Nair, security manager | handler | Calm, fair, a little weary | None | None |

All dialogue below is **flavour** unless marked. Grants are the plan's own (§9.1), in the plan's order.

### 6.1 Tomás

Opener, first time:

```ink
=== start ===
{ start > 1: -> topics }
Narrator: A man in a tabard is wiping down the kitchen counter. He doesn't stop.
Tomás: You're the one Priya brought in. I'm Tomás. I clean. I also notice who leaves their mugs in the sink.
-> topics
```

Q1, Okoro's grievance (plan's line kept, with a beat after it):

```ink
=== ask_unhappy ===
{ ded_b_tomas_wary:
    Tomás: I'd rather not talk about people behind their backs.
    -> topics
}
Tomás: Okoro lost her appeal on the shift pattern. She took it badly. #grant_fact:b_okoro_grievance
Tomás: Can't blame her. Four nights on, two off, and her kids are at her mum's.
-> charge
```

Q2, Okoro's device:

```ink
Tomás: Okoro's always got a second phone on charge behind the microwave. Not the work one. #grant_fact:b_okoro_device
Tomás: Haddad's got some laptop too, but she keeps it in her bag. I just see the charger.
-> charge
```

The Haddad half is gossip with no grant. It points the player at the DHCP printout without convicting
anyone, and it sets up Haddad's lie.

Q3, anything odd (the plan's `b_heard_alarm` topic; **text change proposed**, see §6.2):

```ink
=== ask_odd ===
~ b_heard_alarm = true
Tomás: The server room alarm went at two. That beeping. Someone in a facilities jacket went in and it stopped.
Tomás: Must've been Erik. Who else wears that thing?
-> charge
```

The tell before wary sits after Q2 (§4.2). The vague answer when wary is the plan's.

A free, uncharged line once the player holds the badge log, putting the log to him (flavour, gated on both
`b_heard_alarm` and `se_intel_b_okoro_access`):

```ink
+ {b_heard_alarm and se_intel_b_okoro_access and not tomas_jacket_done} [Tell him the log has Erik in before midnight, not at two]
    ~ tomas_jacket_done = true
    Tomás: Huh. Well, it was a facilities jacket. There's one on the hook by the lifts. Anyone can grab it.
    -> topics
```

It costs nothing, so the B1 bridge's influence numbers do not move.

### 6.2 Proposed plan amendment: Tomás's alarm line

§9.1 says Tomás "heard the server room alarm at two, and Lindqvist went in". The badge log in §4.9 puts
Lindqvist in at 23:40 and Okoro at 02:10. As written, either Tomás is wrong with no story reason, or the
log is. Proposal: he saw "someone in a facilities jacket" and assumed Erik. No grant changes, B1 still sets
`b_heard_alarm`, and the contradiction becomes a small lesson in eyewitness error. Raise it with the plan's
owner; this sidecar does not edit the plan.

### 6.3 Lindqvist, the red herring

He has a grievance and was in the server room outside his role: two of three. He is the obvious suspect
and he is innocent, and the device slot clears him. He has no lie. His drama is that he hands over his own
complaint because he wants it read.

```ink
=== start ===
{ lindqvist_heat():
- 0: Lindqvist: If this is about the coffee machine, I've reported it twice.
- 1: Lindqvist: Security. Lovely. What have I done now?
- else: Lindqvist: I know how it looks. Ask me anyway.
}
-> hub

=== ask_pay ===
Lindqvist: Overtime. I put in for forty hours last quarter and got paid for twelve.
Lindqvist: Here. That's my copy of the complaint. Read it, then tell me I'm the problem. #give_item:b_overtime_complaint
-> hub

=== ask_alarm ===
Lindqvist: That was the UPS again. I went in before midnight to check the batteries, because nobody pays me to and somebody should.
Lindqvist: I wasn't in at two. I was in here eating a sandwich Gwen will tell you was disgusting.
Lindqvist: Priya said you'd want the door. It's 4417. And I'm changing it tomorrow.
-> hub
```

The `#give_item` and the code line are the plan's routes; only the words are new. "And I'm changing it
tomorrow" is a deliberate touch: handing a server code to a stranger is a lapse, and he knows it.

A deflection-proofing line, free, once the device fact is held:

```ink
+ {se_intel_b_lindqvist_device and not lindqvist_phone_done} [Ask whether he has a phone at all]
    ~ lindqvist_phone_done = true
    Narrator: He holds up a phone that predates the building's last refit.
    Lindqvist: It does calls. It does texts. It does not do your Wi-Fi.
    -> hub
```

This is the "show me your kit" case (§7.1). It grants nothing, because the record already did.

### 6.4 Haddad, the innocent who lies

Claim and exposure as §4.5, moral choice as §5.1. Her opener ladder:

```ink
{ haddad_heat():
- 0: Haddad: Hi. Is this the audit? I've got tickets open, so I'll be quick.
- else: Haddad: Is this about the network list? I can explain that.
}
```

At heat 1 (her device seen) she offers to explain before the player asks. An innocent getting ahead of the
question is a good red herring: it looks like guilt and is embarrassment.

### 6.5 Okoro, the insider

She lies about access and deflects towards Lindqvist. She is sympathetic. The player should not enjoy
naming her too much.

```ink
=== ask_access ===
~ ded_b_okoro_claimed_access = true
Okoro: Server room? Not my job. I haven't been in there in weeks.
Okoro: If you want someone who wanders in there at all hours, ask Erik.
-> hub

=== caught_access ===
Okoro: Fine. I went in. The alarm panel was beeping and nobody else was going to deal with it.
Okoro: Is that what we're doing now? Counting doors?
-> hub
```

Her excuse is plausible and fits Tomás's alarm, so the exposure does not decide her. The board does,
once the device and grievance are held as well.

### 6.6 Morgan and Nair

Morgan's opener reads Tomás's `reports` flag (§4.7):

```ink
{ ded_b_tomas_reported:
    Morgan: Tomás says you've been grilling him. He's my cleaner, not your informant.
- else:
    Morgan: My team's had a long week. Go easy on them.
}
```

A free topic with Morgan gives Okoro's grievance from the other side, with no grant (Tomás and the HR
summary already cover it):

```ink
Morgan: I signed off the rota that lost Ngozi her appeal. Head office wanted four on, two off, and I didn't fight it.
Morgan: If she's angry with anyone, it should be me.
```

Nair's last line, after `#verdict_close`, reading the outcome globals (written at close before the next
`Continue()`, §9.1). One example per case, and the policy aside last:

```ink
=== send ===
Nair: Done. I'll take it from here. #verdict_close
{ deduction_outcome_ded_b_okoro == "right_guilty":
    Nair: Ngozi Okoro. I'm sorry it's her. We'll find out who reached out to her after that appeal.
}
{ deduction_outcome_ded_b_lindqvist == "wrong_guilty":
    Nair: Erik's been sent home pending a review. He's got twenty years here, and he'll remember tonight.
}
{ deduction_outcome_ded_b_haddad == "wrong_guilty":
    Nair: Samira's suspended while we look. Over a laptop, if the rest of the file's right.
}
{ deduction_outcome_ded_b_morgan == "wrong_guilty":
    Nair: Gwen's off the rota until this is cleared up. Her team are not happy with us.
}
{ deduction_outcome_ded_b_okoro == "missed_guilty":
    Nair: The report's gone up. Whoever let them in is still on tomorrow's rota.
}
{ b_haddad_policy == "mention":
    Nair: And I'll have a quiet word with Samira about her laptop. A word, nothing more.
}
-> END
```

Check: the line `Done. I'll take it from here.` carries the tag and comes first, so the outcome lines are
read on the next `Continue()`. Each `wrong_guilty` line names a human cost and no count. "Whoever let them
in" does not say how many. The "Not named" innocents get no line, which is right: nothing happened to them.

## 7. Fixture A: Open evening, sample dialogue

Cast as §9.2. The witnesses are not named in the plan; the names here are placeholders for the fixture
packet (vary age and background, AGENTS.md).

| Who | Truth | Personality | Secret | Lie |
|---|---|---|---|---|
| Dr Okafor (first name left to the packet; `adaeze_okafor` is already a sprite key) | Keyholder | Warm, precise, never flustered | — | Says she has no interest in the Codex (want) |
| Professor Helen Venn | clear | Brisk, competitive, short of money | Photographing archive pages for her own grant bid | Says she never left the hall (pass) |
| Celia Marsh | Devotee | Charming, asks favours easily | — | None. She charms instead |
| Dr Ishikawa | clear | Shy, careful, superstitious and embarrassed by it | The ward charm is her grandmother's | Says she carries nothing but a notebook (carry) |
| Delacroix | clear | Loud, pompous, accuses everyone | Bores people for a living | None. She is right about Ishikawa and wrong about what it means |
| Bar staff (placeholder "Rhiannon") | witness | Sardonic, sees everything from behind the bar, likes a tip | — | — |
| Intern (placeholder "Theo") | witness | Nervous, eager, wants to impress the Institute | — | — |

Lie parity holds: one guilty liar (Okafor, about a want shared by two innocents), two innocent liars, and
one guilty suspect who does not lie.

### 7.1 Witness tells

Rhiannon, after Q2:

```ink
Narrator: Rhiannon starts polishing a glass that is already clean.
Rhiannon: I'm meant to be serving, not briefing.
```

Theo, after Q2:

```ink
Theo: Sorry, I shouldn't be gossiping about the guests. Dr Venn's on my interview panel.
```

### 7.2 Venn, the ally with a secret

She is a pass-slot red herring (archive_pass) and the player's way into the archive. The plan's coat
reaction ("You've been through my coat? Fine. The archive code is 2291.") stays. The lie and its
exposure are new:

```ink
=== ask_evening ===
~ ded_a_venn_claimed_pass = true
Venn: I've been in this hall all evening, listening to Delacroix explain my own field to me.
-> hub

=== caught_pass ===
Venn: The badge log. Of course they log it.
Venn: Yes, I went to the archive. I photographed four pages of the Codex for a funding bid. It's not theft if it's for scholarship. Mostly.
Venn: If that's what you're here about, I'll delete them. If it's something worse, I'd like to know.
-> hub
```

It explains her `wants_funding` and her archive visit with a motive that is not the cult's. The board
clears her through the charm, the funding and, later, the key seen elsewhere.

Her wrong-accusation reaction (she is the `lose_ally` suspect, §9.2):

```ink
{ deduction_outcome_ded_a_venn == "wrong_guilty":
    Venn: A cultist. Me. I came here to read a book.
    Venn: Find your own way into the archive.
}
```

### 7.3 Delacroix, the loud accuser

```ink
=== start ===
Delacroix: Ah, a new face. You'll want to keep an eye on Ishikawa. Skulking about the archive all evening, I saw her.
Delacroix: And Venn, of course. That woman would sell her own footnotes.
-> hub
```

Both claims are true (Ishikawa and Venn hold `archive_pass`). Both are innocent. She grants nothing. If she
granted Ishikawa's pass it would be a **route** change: the five pass facts now come only from the archive
badge log, which is what keeps Delacroix open until the archive (§9.2 hand check).

Her wrong-accusation reaction, played for comedy:

```ink
{ deduction_outcome_ded_a_delacroix == "wrong_guilty":
    Delacroix: Me? I have been accused of many things. Pedantry. Arrogance. A regrettable paper in 1998. Never this.
}
```

### 7.4 Ishikawa, the charm

```ink
=== ask_carry ===
~ ded_a_ishikawa_claimed_carry = true
Ishikawa: Just my notebook. I'm a historian, not a magician.
-> hub

=== caught_carry ===
Narrator: Ishikawa's hand goes to her jacket pocket, then away from it.
Ishikawa: It was my grandmother's. She said never to go anywhere old without it.
Ishikawa: I know how that sounds in a room full of people who study the occult.
-> hub
```

The lie hides the very clue that clears him (Courier fails on the charm). That is the best kind of red
herring: she hides her innocence because she is embarrassed by it.

### 7.5 Okafor, the Keyholder

```ink
=== ask_codex ===
~ ded_a_okafor_claimed_want = true
Okafor: The Codex? I'm here for the canapés and to be seen. Old books are Ishikawa's department.
-> hub

=== caught_want ===
Okafor: Rhiannon told you I asked about it. Everyone here wants to see it. That's rather the point of an open evening.
-> hub
```

Her excuse is true: three guests want the Codex. The lie exposes a clue an innocent pair shares, so it
does not convict her. The key does that.

Accusation reactions, replacing §7.4's placeholders:

```ink
{ deduction_outcome_ded_a_okafor == "right_guilty":
    Okafor: You found the key. Clever. It won't matter. The door was always going to open.
- else:
    Okafor: You're making a mistake.
}
```

(The `else` cannot happen with the fixture's truth; it is there for an author who copies the knot.)

### 7.6 Marsh and the favour

She does not lie, which makes her pleasant and easy to help, which is the trap:

```ink
Marsh: You look like someone who doesn't mind a small errand. My phone is on a hook in the cloakroom and the attendant has gone home. Would you?
```

After the backfire (the lookout revealed, §9.2), a line from her that lands only if the player did the
favour:

```ink
{ deduction_favour_ded_a_marsh:
    Marsh: Thank you for the phone. You've been so helpful tonight.
}
```

### 7.7 The room after a wrong accusation

Openers for Rhiannon, Theo and the unaccused guests read `a_lodge_suspicious`. Openers only, never topic
gates (DL6, §4.7):

```ink
{ a_lodge_suspicious:
    Rhiannon: Word's going round you've been calling people cultists. Bold, for a first visit.
}
```

## 8. Optional engine addition: a debrief aside (not needed for A or B)

The debrief explains the logic but not the people. A small optional key would let the author add one line
per suspect, conditioned on a global:

```jsonc
"debrief": {
  "asides": {
    "ded_b_haddad": [ { "condition": "globalVars.ded_b_haddad_caught_device", "_note": "a global the exposure knot would set", "text": "Haddad lied about her laptop. She was studying, not spying." } ]
  }
}
```

It would be scanned by DL10 and DL15 like every other `debrief.*` string. It costs a schema key, a render
line in `debrief-view` and a lint. Nair's closing line covers B and the credits cover A, so leave this
until a real mission asks for it.

## 9. Educational payoff

| Pattern | What the player learns |
|---|---|
| Witness tell before wary | People close up when pushed; rapport is a resource |
| Lie exposed by a record | Check claims against records; don't verify by asking the suspect |
| An innocent who lies | A lie is not guilt. People hide small policy breaches |
| Haddad's laptop choice | Proportion: a policy breach is a conversation, not a sacking |
| Tomás's jacket | Eyewitness memory is weaker than a log |
| Delacroix | A confident accuser is not evidence |
| Okoro's appeal and Morgan | Insider risk grows from grievance plus an outsider's approach |
| Nair's last line | Naming a colleague wrongly does real harm |
| Marsh's favour | A friendly request from someone unverified is how attackers get in |

## 10. Checklist for the fixture packets

- [ ] Every claim knot and exposure knot has no `#grant_fact`.
- [ ] Each lie names a slot whose true fact has a route outside the liar (`_lie.exposedBy`).
- [ ] Lie parity: if a guilty suspect lies, an innocent does too.
- [ ] Every suspect has the same heat ladder, counting only suspicious-looking clue types.
- [ ] No suspect line branches on `solution` or, under `reveal: "end"`, on an outcome before close.
- [ ] Witness tells sit after Q2's charge; free topics do not go through `charge`.
- [ ] Openers may read `a_lodge_suspicious` and `reports` flags; topic gates may not unless the hand check
      is re-run.
- [ ] Each accused suspect has their own wrong-call line (reveal now) or a Nair line (reveal end).
- [ ] No line implies how many are guilty (DL10's patterns), including Nair's warning and the closing lines.
- [ ] Speaker prefixes match each NPC's `id` or `displayName` exactly (`README_ink_best_practices.md`).
- [ ] Run `npc-dialog-review` on each fixture's ink once written.

## 11. Points for the plan's owner (not edits)

1. **Tomás's alarm line contradicts the badge log** (§6.2). Proposed fix: "someone in a facilities
   jacket", with no grant change.
2. **Fixture A's camera.** `t_a_camera` is the archive's monitor showing Okafor pocketing the key, but
   Okafor's pass is `lecture_hall`. Say in the fact text and the object's description that the monitor
   shows the lecture hall feed, or a player will read it as Okafor having been in the archive.
3. **§7.4's accusation reactions** are two generic lines. The fixtures should carry one wrong-call line
   per suspect; §7.3 and §7.5 here give A's.
4. **A possible ⚠️ lint**: a suspect's own story carrying `#grant_fact` for one of their own cells, unless
   exempted with `_why` (the "show me your kit" case). §7.1 states the rule but nothing checks it.
