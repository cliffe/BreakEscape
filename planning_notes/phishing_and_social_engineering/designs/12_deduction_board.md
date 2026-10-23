# 12 — Deduction board: who is the cultist?

> The implementation plan lives in `../deduction/DEDUCTION_IMPLEMENTATION_PLAN.md` and wins where they differ.

Status: proposal, 2026-10-22. Not scheduled. Narrative examples are provisional (see
`../../eldritch_hacker/DIRECTION.md`: the cult, cast and setting await the universe-bible pass).
Builds on `00` (facts, `grantFact`, globals), `03` (intel board) and `06` (influence). Reads nothing from
SecGen and needs no VM.

## What this adds

A suspect-deduction layer: a small cast of suspects, a public rule that says what makes someone a
cultist (or an ENTROPY agent), and evidence about each suspect that the player uncovers through the
systems the game already has. At the end the player marks every suspect as cultist or not, and cites
the evidence.

It fits Eldritch Hacker first, because "identifying cult members" is one of that game's stated mission
objectives. A corporate re-skin (which of these staff is the insider, which caller is the impostor) could
serve Incident Simulations later; see "Other uses".

## Decisions (user, 2026-10-22)

- **The mission brief states the rules.** Each mission defines its own profile(s) for an ENTROPY agent
  or cultist, given in the brief. Build this version first. Rules found as evidence mid-mission are a
  later option on the same data.
- **Consequences are mission-defined.** The config must be able to express: mission lost on any wrong
  call, a harder fight, the loss of a resource, and a story and debrief cost, alone or combined.
- **Tell the player how rigid the stakes are**, in the brief, unless hiding them is the intended twist
  (and then the scenario says so explicitly).
- **Evidence comes from everything:** items NPCs hold, what NPCs say about each other, every physical
  puzzle (lockpicking, PIN, dusting, RFID and the rest), and favours.
- **Acting on a suspect is a verdict.** Knocking an NPC out has much the same effect as accusing them.
  A mission chooses how a verdict is delivered: accusing them directly, reporting to SAFETYNET, or using
  the knowledge (locking them in, feeding them a fake, taking them down).
- **Not player-facing:** the design borrows from the board game, but the game never uses its terms.
  No "tokens", "Mystic", "Fez Council" or "Quest cards" in anything the player sees. The player sees
  clues, profiles, marks and favours.
- **No Licence to Hack missions.** Use cases are new-game missions in the same universe (Eldritch Hacker,
  or Incident Simulations for the corporate skin).

## The source: Horror on the Orient Express, the board game

Chaosium, 2026, designed by Adam Kwapiński and Michał Gołąb Gołębiowski. Co-operative, 1–4 players.
Read from the official rulebook (pp. 13, 22–24, 29, 42–43):
<https://downloads.chaosium.com/boardgame/cha9000_horror_on_the_orient_express/cha9000_rulebook_en.pdf>

### How its deduction works

- **Six suspects**, three in 1st class and three in 2nd. Each has a board with face-down clue tokens in
  three slot types:
  - **Ticket:** exactly one per suspect (where they are travelling, e.g. Constantinople).
  - **Desire:** one or more (what they want, e.g. an Artifact). Revealing a suspect's first Desire puts
    a **Quest** card under them.
  - **Feature:** one or more (what they carry, e.g. a talking parrot, an Elder Sign, the Blood-Red Fez).
- Any token can be **Regular** (grey) or **Mystic** (green).
- **The cultist rule is public**, printed on a help card from the start. A suspect is a cultist if
  *any* of these is true once all their clues are known:
  - **Chosen:** carries the Blood-Red Fez (there is only one).
  - **Herald:** ticket to Constantinople (3 such tokens exist) AND wants an Artifact (2 exist) AND does
    *not* carry an Elder Sign (3 exist).
  - **Zealot:** has 4 or more Mystic tokens.
- Setup is random, so there can be **anywhere from 1 to 6 cultists**. You cannot stop at the first one.
- **Revealing clues.** The main route is talking to *passengers* (bystanders), not the suspects
  themselves. A talk is push-your-luck: draw tokens from a bag; each pair of the same type reveals one
  clue of that type on any suspect in a class. A third of one type fails the talk, which still reveals
  one clue but deals penalties (sanity, health, essence).
- **Interacting with a suspect** (same carriage only):
  - *Ask about a Feature:* a non-Mystic, question-marked Feature can be asked about once, which gives a
    small benefit. Never harmful.
  - *Use their Favour:* each suspect has one ability they can lend.
  - *Fulfil their Quest:* reveals **all** that suspect's clues at once, but if they turn out to be a
    cultist, the story on the back of the card punishes you for helping them.
- **The Blood-Red Fez** event: when the fez turns up, the players jointly choose what to do about it
  and its owner from a hand of "Fez Council" cards.
- **Witness tampering** (the "Fade to Black" ritual variant): as the cult's ritual advances, Fade tokens
  land on one suspect's clues, and revealing a faded clue just removes the Fade token instead.
- **Endgame:** when the train arrives, the players unanimously place a Cultist / Not Cultist token on
  every suspect, then reveal everything. **One wrong mark, either way, loses the game.**

### What is worth taking

1. **Guilt is a published rule, not a hidden script.** The player is not guessing the author's
   intention; they are checking evidence against stated criteria. That turns a whodunit into logic.
2. **Three kinds of criterion, each needing different reasoning.** A unique marker (find the one
   thing), a conjunction with a negative (you need evidence of absence, so you must investigate people
   who look innocent), and a threshold (no single clue convicts; weight of evidence does).
3. **Known counts allow elimination.** "There is only one fez" means that once it turns up, nobody else
   can be Chosen. "Three Constantinople tickets" tells you how many Heralds are even possible.
4. **An unknown number of guilty parties.** Clearing the innocent is half the job.
5. **Witnesses, not confessions.** You learn about suspects from the people around them.
6. **Shortcuts with a moral cost.** Doing a suspect a favour exposes them completely, and helping a
   cultist hurts.
7. **The opposition destroys evidence**, so there is time pressure and a reason to have more than one
   route to a fact.

What not to take: the all-or-nothing loss is too punishing for a game that should be "fun and
educational, not hard", and the bag draw is a dice mechanic this engine has no use for. Both are
replaced below.

## The cyber security fit

This is attribution and insider-risk reasoning with the serial numbers filed off:

| Board-game idea | What it teaches |
|---|---|
| Public cultist rule | Working from a threat-actor profile or a set of indicators, not a hunch |
| Herald's "does not carry an Elder Sign" | Negative evidence: a profile can depend on something being absent, so you must look |
| Zealot's threshold | One indicator is not enough; weight of corroborating indicators is |
| 1 to 6 cultists | Do not stop at the first match (confirmation bias); clear everyone |
| Only one fez | Uniqueness constraints and elimination |
| Talking to bystanders | OSINT and pretexting: people around a target leak more than the target |
| Quest favour backfires | Helping an unverified person (tailgating, a "quick favour" on the phone) can hand an attacker what they want |
| Witness tampering | Adversaries clean up logs and evidence; corroborate early and from more than one source |
| Accusations with consequences | Proportionality: wrongly accusing a colleague does real harm |

## Proposal for Break Escape

### Data: suspects, clue slots and the rule

A new `social.deduction` block in the scenario (`00` §11 is where scenario social data lives). Clues
are ordinary intel facts (`00` §1), so they persist, reach ink and appear on the board through the
existing `grantFact` path. A clue fact carries a `deduction` field naming its suspect and clue.
Internal names use "clue" and "profile" too, so board-game terms cannot leak into the UI.

```jsonc
"social": {
  "deduction": {
    "title": "The open day",
    "verdictNoun": { "guilty": "Cultist", "clear": "Not a cultist" },
    "suspects": ["okafor", "venn", "marsh", "ishikawa", "delacroix"],
    "slots": [
      { "id": "pass",  "label": "Where they were", "perSuspect": "exactlyOne" },
      { "id": "want",  "label": "What they want",  "perSuspect": "oneOrMore" },
      { "id": "carry", "label": "What they carry", "perSuspect": "oneOrMore" }
    ],
    "clues": {
      "brass_key":   { "slot": "carry", "label": "the brass Tesseract key", "marked": true,  "count": 1 },
      "ward_charm":  { "slot": "carry", "label": "a ward charm",            "marked": false, "count": 2 },
      "archive_pass":{ "slot": "pass",  "label": "badged into the Archive", "marked": false, "count": 2 },
      "wants_codex": { "slot": "want",  "label": "wants the Codex",         "marked": true,  "count": 2 }
      // ...
    },
    "profiles": [
      { "id": "keyholder", "label": "Keyholder",
        "text": "Carries the brass Tesseract key. There is only one.",
        "rule": { "has": "brass_key" } },
      { "id": "courier", "label": "Courier",
        "text": "Badged into the Archive, wants the Codex, and carries no ward charm.",
        "rule": { "all": [ { "has": "archive_pass" }, { "has": "wants_codex" }, { "not": { "has": "ward_charm" } } ] } },
      { "id": "devotee", "label": "Devotee",
        "text": "Has three or more marked clues.",
        "rule": { "markedAtLeast": 3 } }
    ],
    "solution": { "okafor": "keyholder", "venn": null, "marsh": "devotee", "ishikawa": null, "delacroix": null },
    "verdicts": { /* how the player commits: see "Verdicts and stakes" */ },
    "stakes":   { /* what a right or wrong call costs: see "Verdicts and stakes" */ }
  },
  "intelFacts": {
    "marsh_carries_sigil_ring": {
      "text": "Marsh wears a ring with the spiral sigil.",
      "subject": "marsh", "source": "dust_marsh_glass",
      "deduction": { "suspect": "marsh", "clue": "sigil_ring" }
    }
  }
}
```

- The brief's text for each profile is the profile's `text`, so the brief, the board's profile card and
  the debrief all show the same sentence.
- `rule` is a small declarative language: `has`, `not`, `all`, `any`, `markedAtLeast`. It is data,
  which keeps to the no-generated-text and no-runtime-LLM rules (`00` "No generated text").
- `count` on each clue is shown to the player on the criteria card, as in the board game ("there is
  only one key"), because that is what makes elimination possible.
- `solution` is authored and checked by the validator against the clues; it is never the source of
  truth at runtime (the evaluator is).
- `marked` is the Mystic equivalent: a clue with the cult's mark on it (a sigil, a handle seen on the
  cult forum, a ritual date in a calendar). The board shows it with a symbol and the word "marked",
  never colour alone.

### Where clues come from

Each source already exists in the engine. A clue should have at least two routes when tampering can
fade it.

| Source | Board-game analogue | Engine | Typical clue |
|---|---|---|---|
| Items an NPC holds | Feature clues | `itemsHeld`, KO drop, a trade, pickpocket | The item itself is the clue (the brass key); taking it also takes it from them |
| Talking to a witness | Talk to a passenger | `person-chat` / `phone-chat` ink, `grant_fact` action | "I saw Venn come out of the Archive at two." |
| Pressing a witness for more | Push-your-luck bag draw | `06` influence global and thresholds | Each extra question costs influence (below) |
| OSINT on a suspect | (new) | `osint-browser` | A forum handle that matches a cult post: a marked clue |
| Searching a suspect's bag or desk | Quest shortcut, reveals a lot | `container`, `lockpicking` | Every Carry clue for one suspect at once |
| Fingerprints on an object | (new) | `dusting`, `biometrics` | Who handled the brass key |
| Badge or door logs | Class-wide reveal | `log-filter`, `rfid` | The Pass clue for everyone in one wing |
| Intercepted message | (new) | `mail-client`, `phone-chat` | What someone wants |
| Doing a suspect a favour | Fulfil a Quest | ink + globals | Reveals all their clues; backfires if they are a cultist |
| Asking about an item | Ask about a Feature | ink option gated on the fact | A small reward (a hint, an item, a door code) |

**Pushing a witness (replaces the bag).** In a witness conversation the player chooses a topic (where
people were, what they want, what they carry) and, as in the board game, which group to ask about
("the guests from the Institute", "the visitors"). Each answer grants one clue of that slot on a suspect
the witness knows about. Each question past the first costs influence. Crossing the character's
`wary` threshold makes answers vaguer; `refuses` ends the talk; `reports` tells the cult someone is
asking questions, which triggers one tampering event. No new meter: this is `06` as written, with
the thresholds doing the work of "draw a third token".

**Favours (Quests).** When a suspect's first Want clue is revealed, they ask the player for something
(a door opened, a phone lent, a parcel collected). Doing it reveals all their clues. If they are a
cultist, what you did helps the cult: the door you opened is the one they needed, and the ink plays
that out. This is the tailgating lesson told as a story, and it gives the player a real choice about
whether to verify first.

**Tampering (Fade).** At authored story beats (the ritual advancing, a timer, a `reports` threshold)
the cult destroys one piece of evidence: a log is wiped, a note is shredded, a witness is "persuaded".
The route that would have revealed a particular clue closes, shown on the board as "Evidence destroyed".
Every faded clue needs an alternative route, and the counters are minigames we already have:
`shredded-document`, `backup-recovery`, a second witness. This rewards collecting early and
corroborating.

**The unique marker (Fez Council).** When the one-of-a-kind item is found, the player gets a moral
choice in the house style: confront the owner now, plant a tracker and follow them, or quietly take
the item. Each changes later rooms and the ending, as moral choices do elsewhere in the series
(`README_scenario_design.md`).

### The board

A new intel-board mode, `deduction` (`03` already picks its mode from `minigameData.mode`, one
case-file object per mode). Reusing the board keeps the house style and the people cards.

```
 THE OPEN DAY                                         Criteria   ▸ Keyholder: carries the brass key (only 1)
                                                                 ▸ Courier: Archive + wants Codex + no ward
                                                                 ▸ Devotee: 3+ marked clues
 ┌───────────┬────────────────┬──────────────────┬───────────────────────────┬────────────┐
 │ Suspect   │ Where they were│ What they want   │ What they carry           │ Your mark  │
 ├───────────┼────────────────┼──────────────────┼───────────────────────────┼────────────┤
 │ Okafor    │ ? hidden       │ ✦ the Codex      │ ✦ brass key   ? hidden    │ Cultist ▾  │
 │ Venn      │ Archive        │ ? hidden         │ ward charm                │ Undecided ▾│
 │ Marsh     │ Lecture hall   │ ✦ a promotion    │ ✦ sigil ring  ✦ burner SIM│ Undecided ▾│
 │ Ishikawa  │ ⨯ destroyed    │ funding          │ ? hidden                  │ Undecided ▾│
 │ Delacroix │ Archive        │ ? hidden         │ ? hidden                  │ Undecided ▾│
 └───────────┴────────────────┴──────────────────┴───────────────────────────┴────────────┘
   ✦ = marked clue.  Each cell also reads its state as text for screen readers.
```

- **The criteria card is visible from the start**, with token counts. (Variant: in a later mission the
  criteria themselves are evidence, an intercepted page of the cult's induction rules, so the first half
  of the mission is finding the rule and the second half applying it.)
- **Player marks:** Undecided, Cultist, Not a cultist. When marking someone a cultist the player picks
  the criterion; when clearing someone the player may note why. Marks persist as globals
  (`deduction_mark_<suspect>`).
- **A nudge, never the answer.** As with readiness in `03`, the board can say "You have enough to decide
  about Venn" once the held clues decide that suspect either way. It never says which way. A scenario
  can turn this off for a harder case.

### The evaluator

`systems/social-deduction.js`, pure functions with unit tests (as `triage-scoring.js` has):

- `evaluateSuspect(suspectId, heldClues, deduction)` returns `guilty`, `clear` or `undetermined`, plus
  which criteria are met, impossible or still open. Three-valued logic: `has` on a hidden token is
  unknown, not false. Counts feed elimination: if the only brass key is held by Okafor, `has
  brass_key` is false for everyone else even with their Carry slots hidden.
- `isDecidable(suspectId, ...)` drives the nudge.
- `grade(marks, deduction)` scores the accusation.
- The validator reuses the same evaluator to check that (1) the authored `solution` matches the tokens,
  (2) every suspect is decidable from clues reachable in the scenario before any verdict is forced, (3) every clue that a tampering
  event can fade has a second route, and (4) no suspect is decided by the first room's evidence alone,
  so the case does not collapse early.

### Verdicts and stakes

The board game has one moment of judgement at the end, and one mistake loses. Missions here vary on
two separate axes: **how** a verdict is given (`verdicts`) and **what** each outcome costs (`stakes`).

**Verdicts: how the player commits.** A verdict is a recorded act against one suspect, with a kind.
Marks on the board are notes, not verdicts, until something commits them.

| Verdict kind | What the player does | Engine |
|---|---|---|
| `accuse` | Confronts the suspect in conversation | ink choice, `#verdict:accuse` tag |
| `report` | Tells SAFETYNET (rings HaX, files the report object) and names names | phone-chat or a report object; can commit several at once |
| `ko` | Knocks the suspect out | existing KO; the KO event records a verdict |
| `act` | Uses the knowledge: locks them in, feeds them the fake codex, gives the real key to the ally | any `apply_actions` that the scenario tags as a verdict |
| `final` | Marks every suspect at a set point, board-game style | the board's submit, gated by an object or ink beat |

```jsonc
"verdicts": {
  "allowed": ["accuse", "ko", "report"],
  "when": "anytime",            // or "final": commits only at the end
  "finalCall": { "object": "lodge_phone", "requiresAll": true },   // optional end-of-mission call
  "ko": { "counts": true }      // a KO of a suspect is a verdict against them
}
```

Each verdict sets `deduction_verdict_<suspect>` (`guilty`) and is judged against the evaluator's truth
at once, so consequences can land mid-mission (an innocent you KO'd was your route to a door code)
or be held until the end (`"reveal": "end"`, so the player does not learn whether they were right).

**Stakes: what each outcome costs.** Four outcome cases, each with a list of effects. Effects are
`apply_actions` (`systems/apply-actions.js`) plus a few named effects the runner adds.

```jsonc
"stakes": {
  "disclosure": "brief",            // "brief": the brief states the stakes; "hidden": a deliberate twist
  "briefText": "One wrong name and the lodge closes its doors to us for good.",
  "onWrongGuilty":  [ { "do": "fail_mission", "reason": "innocent_accused" } ],
  "onMissedGuilty": [ { "do": "spawn_hostiles", "group": "lodge_guards", "room": "sanctum" } ],
  "onRightGuilty":  [ { "do": "set_global", "name": "ritual_weakened", "value": true } ],
  "onRightClear":   [],
  "debrief": true
}
```

| Effect | Covers |
|---|---|
| `fail_mission` | Strict mode: any wrong call loses, as in the board game |
| `spawn_hostiles`, `buff_encounter` | A harder fight: the real cultist gets a head start, guards turn hostile, the monster fight gains a phase |
| `remove_item`, `lock_route`, `lose_ally` | Losing a resource: an item, a door code route, an NPC's help, a hint |
| `set_global`, `ending_flag` | A story and debrief cost: a different ending, HaX's reaction, a cultist who returns later |

**Telling the player.** With `disclosure: "brief"` the brief shows `briefText`, and the board repeats
it under the profiles. The validator requires a `briefText` whenever any stake is `fail_mission`,
unless the scenario sets `disclosure: "hidden"` with a `twistNote` explaining the intent for reviewers.

**The debrief** walks each suspect: the profile, the evidence held, and which clue would have settled
any suspect the player got wrong. That is where the learning lands, whatever the stakes were.

### Randomisation (later, optional)

The board game's replay value comes from random setup. Break Escape scenarios are authored ERB, so a
seeded shuffle at render time is possible: deal tokens to suspects, run the evaluator as a solver, and
re-deal until the case is decidable and has the target number of cultists. The cost is in the text:
witness lines become authored templates ("I saw {suspect} with {token.label}") and physical props need
per-token art. Recommend shipping authored, fixed cases first and adding the shuffle only if replay
matters (Steam release of Eldritch Hacker).

## Use cases

Four missions planned against the design to check it is practical and flexible enough. Names, cells
and settings are placeholders until the universe-bible pass. All four are new-game missions in the
SAFETYNET universe; none is a Licence to Hack mission.

### A. Lodge open evening (Eldritch Hacker)

Five guests at a Tesseract Institute open evening; the player is undercover as a guest.

- **Brief:** three profiles. *Keyholder:* carries the brass key (one exists). *Courier:* badged into the
  Archive, wants the Codex, carries no ward charm. *Devotee:* three or more marked clues. "There may be
  more than one."
- **Evidence:** the bar staff and a nervous intern gossip (influence costs); a cloakroom locker
  (lockpicking) holds two guests' coats; a dusted wine glass ties a ring to a guest; the visitor badge
  log (`log-filter`) gives everyone's "where they were"; the cult forum (`osint-browser`) matches a handle
  to a guest. One guest asks the player to fetch their phone from the cloakroom: a favour.
- **Verdicts:** `when: "anytime"`, kinds `accuse` and `ko`. Confronting a cultist ends their part in
  the ritual.
- **Stakes, disclosed:** a missed cultist joins the final ritual and the monster encounter gains a phase
  (`buff_encounter`); an accused innocent storms out and takes the lodge's floor plan with them
  (`lose_ally`, so the player must lockpick the route instead).
- **Tests:** all three profile types, multiple guilty, a favour that may backfire, mid-mission verdicts
  with mechanical cost but no fail state.

### B. Night shift insider (Incident Simulations, corporate skin)

One of four staff on a night shift let an intruder in. Corporate wording throughout: "insider", not
"cultist".

- **Brief:** one profile, all-of: accessed the server room outside their role, had a personal device on
  the staff network, and raised a grievance in the last month. Exactly one person fits.
- **Evidence:** RFID door logs and the SIEM (class-wide "where they were"); fingerprints on the server
  cage; the DHCP lease list (personal devices); kitchenette gossip about who complained to HR; an HR
  folder behind a PIN lock.
- **Verdicts:** `report` only, through a call to the security manager; `when: "final"`, one name.
- **Stakes, disclosed:** a wrong name means the real insider wipes the logs (`lock_route` on the SIEM
  evidence, so the debrief evidence is lost) and the score drops; no fail.
- **Tests:** a single profile with a negative-free all-of rule, a corporate skin with no "marked" clues
  (`markedAtLeast` unused), a single final verdict, a stakes list with no combat.

### C. The sleeper (new-game mission, same universe)

Three SAFETYNET field contacts meet the player at a safe house; one is a sleeper for the cult. HaX's
brief gives the tradecraft tells.

- **Brief:** *Sleeper:* has a cult-issued burner (one exists), **or** has been to the Arkham site and has
  no verified alibi for the night of the leak.
- **Evidence:** lockpicked drawers, a PIN safe, a dusted glass, a cloned badge read at the safe-house
  door, and what each contact says about the other two.
- **Verdicts:** `ko` and `act` (lock the suspect in the comms room). KO counts as a verdict. No board
  submit.
- **Stakes, hidden as a twist:** `disclosure: "hidden"`. The brief says only "trust no one". Taking out
  an innocent contact costs their help: they were carrying the player's toolkit (`remove_item`), and
  HaX's trust drops (`set_global`). Missing the sleeper means they walk out with the files and recur
  later (`ending_flag`).
- **Tests:** an `any` rule containing an `all` with a `not`; verdicts delivered by KO and by action, never
  by accusation; hidden stakes and the validator's `twistNote` path; outcomes revealed only at the end.

### D. The night train (Eldritch Hacker set piece)

A homage to the board game: five suspects on a train of five carriages (rooms in a line). At each stop
the cult destroys evidence, and one carriage is sealed.

- **Brief:** the three profiles from A, re-dealt, plus "Stakes: any wrong name and the ritual completes.
  You will not get a second chance." Strict mode, stated up front.
- **Evidence:** as A, with pressure: tampering at each stop fades one clue, which must then be recovered
  through `shredded-document`, `backup-recovery` or a second witness.
- **Verdicts:** `final`, every suspect marked at the last stop.
- **Stakes, disclosed:** `onWrongGuilty` and `onMissedGuilty` both `fail_mission`.
- **Tests:** strict board-game mode, tampering with second routes, timed stops, the validator rule that
  every faded clue has another route.

### What the four cases ask of the design

| Feature | A | B | C | D |
|---|---|---|---|---|
| Profiles stated in the brief | ✓ | ✓ | ✓ | ✓ |
| Unique-item profile | ✓ | | ✓ | ✓ |
| All-of with a "has not" | ✓ | | ✓ | ✓ |
| Marked-clue threshold | ✓ | | | ✓ |
| More than one guilty possible | ✓ | | | ✓ |
| Items held as evidence | ✓ | | ✓ | ✓ |
| NPC gossip with influence cost | ✓ | ✓ | ✓ | ✓ |
| Physical puzzles as sources | ✓ | ✓ | ✓ | ✓ |
| Favours that expose | ✓ | | | ✓ |
| Tampering | | ✓ (on a wrong call) | | ✓ |
| Verdict by accusation | ✓ | | | |
| Verdict by report | | ✓ | | |
| Verdict by KO or action | ✓ | | ✓ | |
| Final board submit | | ✓ | | ✓ |
| Fail mission | | | | ✓ |
| Harder fight | ✓ | | | |
| Lose a resource | ✓ | ✓ | ✓ | |
| Story and debrief cost | ✓ | ✓ | ✓ | ✓ |
| Stakes hidden as a twist | | | ✓ | |

Every row is covered by at least one case, and the data shape (`profiles`, `verdicts`, `stakes`)
expresses all four without a mission-specific code path. Build order: B first (smallest: one profile,
one verdict, no combat), then A, then C, then D.

## Build plan

| Step | Work | Size |
|---|---|---|
| 1 | Paper case: one authored case (5 suspects, 3 criteria, ~18 tokens) in a spreadsheet; play it by hand | S |
| 2 | `social.deduction` schema in `00`; `social-deduction.js` evaluator and grader; unit tests in `test/js/` | M |
| 3 | Validator rules (solution matches, decidable, second routes, no early collapse) | S |
| 4 | Intel-board `deduction` mode: grid, criteria card, marks, nudge | M |
| 5 | Wire sources: witness topics in ink, container and dusting grants, log-filter class reveals | M |
| 6 | Favours and their backfire ink; the unique-marker choice | M |
| 7 | Tampering events and the faded-cell state | S |
| 8 | Verdict kinds (accuse, report, KO, act, final), stakes effects, disclosure check, debrief | M |
| 9 | Playtest loop on a test scenario, then the first Eldritch Hacker mission that uses it | M |
| 10 | Optional: seeded shuffle | L |

Steps 1 to 4 can be done before the universe-bible pass, using placeholder names. Step 9 waits for it.

## Other uses

- **Incident Simulations / insider-risk:** "One of these four staff accounts was used to exfiltrate the
  file." Criteria from insider-risk indicators (access outside role, a personal device, a recent
  grievance), evidence from logs, interviews and the help desk. Corporate skin, same engine.
- **Awareness episode:** a small three-suspect version for E7 (voice): which of three callers is the
  impostor, by a published verification rule. Probably too heavy for a short episode; listed so it is
  not forgotten.
- **Licence to Hack:** no (decided 2026-10-22). New missions set in the same universe instead.

## Open questions

1. Number of suspects per mission. Three to five is proposed, given sprite, portrait, voice and
   cast-diversity cost per character.
2. Is the nudge ("you have enough to decide about X") on by default?
3. Seeded randomisation: wanted at all, and if so, for which missions?
4. Should a KO'd innocent be recoverable (wake them, apologise, regain the ally at an influence cost),
   or is a KO always final?

Settled 2026-10-22: stakes are per mission (strict is one option); profiles come from the brief first,
from evidence later.
