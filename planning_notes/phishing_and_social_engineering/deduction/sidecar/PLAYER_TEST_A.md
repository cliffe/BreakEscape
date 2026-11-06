# Player test, step 3: fixture A, "Open evening"

Plan read: `DEDUCTION_IMPLEMENTATION_PLAN.md`, 3327 lines, latest review round §14 Round 4 (the same
version the packet and the answer sheet were built from). Read only, not edited.

Inputs: `player_packets/fixture_A.md`, `player_packets/fixture_A_answer.md`,
`player_runs/fixture_A_{careful,hasty,newcomer}.md`; plan §3.4, §3.7, §3.8, §3.10, §9.2 to check
details.

**No judge answered in any of the three runs.** None of them saw a nudge, a toast, a backfire, HaX's key
choice, the debrief or the credits. §2 below replays each run against the answer sheet to show what the
game would have done. Those replays are inferences from the plan, not observed play. A judged rerun is
the first follow-up (R12).

---

## 1. Verdicts against the truth

Truth: Okafor (Keyholder) and Marsh (Devotee) are cultists; Venn, Ishikawa and Delacroix are not.

| Suspect | Truth | Careful | Hasty | Newcomer |
|---|---|---|---|---|
| Okafor | Keyholder | Accused, right | Accused, right | Accused, right |
| Marsh | Devotee | Accused, right (SIM by counting) | Accused, right (SIM guessed in the run; the favour would have shown it) | **Left undecided: missed** (in the run; see §2.3) |
| Venn | clear | Marked clear, reasoned | Marked clear, no reason, never checked | Marked clear, reasoned |
| Ishikawa | clear | Marked clear, reasoned (coat) | **Accused as Courier: wrong** | Marked clear, nearly accused |
| Delacroix | clear | Marked clear, reasoned | Marked clear | Marked clear, reasoned |
| Favour | backfires | Refused | Done, before checking | Done, before checking |

Every persona got Okafor, and each one called the camera footage the best moment of the game. Marsh and
Ishikawa are where the case is won or lost, which is what the fixture intends.

---

## 2. Replays with a judge

### 2.1 Careful (H+C+A, no favour)

Held clues matched the hand check row H+C+A exactly. Nudges: Venn and Ishikawa after the coats;
Delacroix, Okafor and Marsh after the archive. HaX's key choice opens at the monitor. The player said
they would answer "not yet" ("Leave her be"), so HaX says she still needs naming, which is fine.
Okafor and Marsh get "Right call" toasts and the ritual is weakened. **The `closeHint` never shows**,
because Venn, Ishikawa and Delacroix have no verdict (the plan's own bridge, A5, asserts this). The
debrief gives two right calls and three "Not named (innocent)" with their Why lines. No acolyte appears.

This is the ideal path, and the counting step at the end was the run's best moment. Only two things went
wrong: the player was confused about the "dealt with" line (§3.1) and about whether a coat in the
cloakroom counts as "carries" (§3.4).

### 2.2 Hasty (part of H, F, A; no coats)

- **Favour (step 9).** Done holding part of H. Every Marsh cell shows, the SIM included, so the run's
  "guessed the SIM" would in fact have been "shown the SIM". Nudge for Marsh. The lookout appears in the
  cloakroom, which this player had already left and never went back to. **The backfire cost them
  nothing.**
- **Ishikawa accusation (step 10).** At that point Ishikawa is still *undecided* (two charms and two
  notebooks against Okafor 1, Venn 1 and Ishikawa 2 hidden carry cells, so Ishikawa could hold both
  notebooks). No nudge had shown for her. Nothing on the accusation screen pointed this out. Result:
  "Wrong call: Ishikawa matched no profile". The lodge turns suspicious and the coats go dead. The toast
  shows at once (`reveal: "now"`), so the player learns straight away.
- **Monitor.** HaX's key choice opens. A hasty player picks "Confront her now", a right call.
- **Marsh.** A right call, from clues the favour showed.
- **Close.** Three verdicts, so no `closeHint`. The player has to work out for themselves that HaX
  opens the sanctum (§3.1).
- **Debrief.** Ishikawa: "The clue that would have settled it: a ward charm, from the cloakroom". This
  is the right lesson and it lands. Venn: undecided at close, so "You had not ruled them out: wants
  funding, from the bar staff, did". Favour line: "You fetched Marsh's phone before checking her". A
  hasty player reads that and thinks "but the favour is how I solved her".

Net: the stakes caught the hasty accusation well (immediate toast, the coats lost, a precise debrief).
They did not catch the hasty favour. The favour helped this player and cost them nothing they noticed.

### 2.3 Newcomer (H+C, then F, then A)

The phone was handed over holding H+C. Marsh was undecided, so the backfire fires and the lookout
appears in a room the player has finished with. **The favour shows the SIM**, so with a judge this
player sees Marsh at three ✦ and almost certainly accuses her. The run's "missed Marsh" comes from the
missing judge, not from the design.

The design risk the run exposes is a different newcomer: one who obeys HaX, refuses the favour and
cannot count. That player misses Marsh, meets the acolyte, and reads in the debrief "You already held
what settled it: …". For a clue they never *saw* (the SIM was placed by elimination), that line reads as
a riddle. The newcomer's own words: "a real 'oh!' moment, but a slightly bitter one."

### 2.4 What the replays show

- **The favour pays.** For the two players who broke HaX's rule it was the cleanest route to Marsh. The
  player who kept the rule had the hardest step in the case (counting). That reverses the lesson the
  favour is meant to teach (R1, R2).
- **Wrong accusations are well handled:** an immediate toast, a real cost, a precise debrief line.
  One thing is missing: a warning before accusing someone the board does not yet decide (R4).
- **The close is unsignposted** on the right path (R3).

---

## 3. Where a reasonable player was misled

### 3.1 "Everyone here has been dealt with" can only show after naming innocents (major)

Fixture A allows `accuse`, `ko` and `act`. None of these clears a guest, and marks are notes. So the
`closeHint` shows only when all five guests hold a verdict, which means accusing or knocking out
innocents. The careful player was stuck on what "dealt with" means for an innocent. The packet (and the
plan's HaX description) puts the line forward as the normal route to the sanctum. Worse, "Everyone ...
dealt with" invites the player to deal with everyone, which in this case means naming innocents.

### 3.2 HaX's warning: "checked" read as "looked into"

The newcomer had dusted Marsh's glass and counted that as checking her. The debrief line uses the same
word ("before checking her"). The hasty player had "checked" her by suspecting her. The plan means
"cleared".

### 3.3 Two meanings of "mark"

"✦ marked" on clues, and "Marks you can set on each suspect" for the player's notes. Careful and
newcomer both flagged it. The newcomer first read "Has three or more marked clues" as clues *they* had
marked. The brief never says what ✦ means; only the board does.

### 3.4 "Carries" against a coat in the cloakroom

The Courier rule says "carries no ward charm". The charms are in coats hanging in the cloakroom. The
careful player spent a minute deciding that a coat counts, and noted that "a less careful player could
easily read it the other way". That reading decides Ishikawa, the case's one designed decoy.

### 3.5 The ward charm as a negative clue

The newcomer first read the charm as a cult item, so "has a charm" read as suspicious, and only later
noticed the word "no". The hasty player turned "no charm seen" into "no charm". Both mistakes are the
skill the decoy teaches, which is good, but the fiction gives no reason *why* a charm clears someone, so
the rule feels arbitrary.

### 3.6 "Must every profile be used?"

The newcomer went looking for a Courier and nearly accused Ishikawa "to fill the slot". The careful
player also half expected each profile to be used once. Nothing says a profile may match no one.

### 3.7 Witness pacing is a threat with no teeth

The packet warns that pushing makes witnesses vague. The plan (§9.2) says each answers all three topics
before turning wary. The careful player planned round a risk that does not exist. The hasty player
skipped "Say something kind" because it does nothing visible. The newcomer enjoyed it as social
engineering, but in A it changes nothing.

### 3.8 Smaller wording points

- "Anyone still standing here stays standing" (altar): the careful player read "standing" as possibly
  meaning not knocked out. Combat is on in this case, so the ambiguity is real.
- "Stakes: a wrong call will change what you can do next": the hasty and newcomer players both found it
  vague and worrying.
- "Badged into the Archive" (the clue) against "Was in the Archive" (the profile): the hasty player
  assumed they were the same, but nothing says so.
- "Dripping umbrella": the newcomer built a garden theory on it. A red herring that suggests a place the
  badge log then contradicts is noise, not a lesson.
- Courier and Devotee read like job titles; the newcomer kept mixing them up. Keyholder explains
  itself.
- Okafor's pronoun: the plan and the answer sheet use "her"; the packet gives none, and two players
  wrote "he". The packet and the board need names and pronouns.

---

## 4. Fairness and difficulty

| Suspect | Verdict on design |
|---|---|
| Okafor | Fair, and easy by design: the camera hands it over. All three loved it. Keep it as the confidence builder. |
| Ishikawa | A good decoy that does what it should. The clearing clue is one room away and the debrief names it. Fragile only through the wording in §3.4. |
| Delacroix | Fair. The badge log is the reason to visit the archive. The umbrella's flavour misleads (§3.8). |
| Venn | Trivially clear. Her one job, the archive code, duplicates the note in the room where you see her coat (§5.2). |
| Marsh | The hard step. Without the favour she is decided only by counting (H+C+A). Careful: "fair, and the best moment". Newcomer: "unfair unless it's taught first". Hasty: "never". The counts are on the board, but nothing teaches the player to use them. |

Not unfair or impossible anywhere: every suspect can be decided from visible information on every
route, as the hand check says. The unfairness is in **teaching**: counting is the only non-favour route
to Marsh and nothing shows how to do it. And in **incentive**: the forbidden favour is the easy way
round the count.

Nothing is too hard once counting is taught. Nothing is boring beyond the umbrella question, the dead
kind word and Venn's duplicate code.

---

## 5. Stakes, nudge and debrief by persona

### 5.1 Hasty accusation: handled well

The toast at once, the coats lost, a precise "clue that would have settled it" line. Missing: a speed
bump at the moment of accusing someone undecided. The nudge works only by its absence, and a hasty
player does not notice an absence. The hasty player asked for exactly this: "If the board had stopped
me when I tried to mark her Courier with a carry slot still Hidden, I'd have gone back."

### 5.2 Hasty favour: not handled

The lookout appears in the cloakroom after the player has finished there. Venn's `lose_ally` cost has
the same problem: losing Venn removes only the archive code, and the note in the same cloakroom always
has it, so that cost never bites. The only felt result of the favour is a debrief sentence. In a game
meant to teach "verify before you do what a stranger asks", the favour is the scene that teaches it,
and at present it rewards the player.

### 5.3 Newcomer confusion: partly handled

- The nudge helps if noticed. The newcomer did not know when it would show and feared it would show
  for Marsh at two stars ("I'd have been very confused"). It would, after the favour or the count, but
  never with a reason. That is correct (it never says which way), and the newcomer needs to be told up
  front that "enough to decide" can mean either way.
- The debrief "You already held what settled it" with no visible SIM: see §2.3.
- Jargon (Codex, ward charm, sigil, Courier, Devotee, "filter the log") added load but did not block.
  One sentence on each, in the fiction, would fix it.

### 5.4 Careful player: well served

The counts gave them the best moment. Their friction points were §3.1, §3.4 and witness pacing.

---

## 6. Spoilers and leaks in the packet itself

1. **§5 lists every source's result up front**, including Ishikawa's coat (which defuses the decoy), the
   badge log for all five, and the monitor footage. A player reading the packet in order has the answers
   before choosing where to go. The hasty run admits to "hindsight after re-reading the packet". Next
   time, put source results in a judge-only envelope, or one sealed section per source that the player
   opens only on visiting.
2. **§6 lists "Revisiting the coats after any accusation"** as a hidden-result action. This gives away
   the wrong-call cost (the hasty player inferred it). Drop the line, or merge it into "anything
   after an accusation".
3. **§6 "Watching the security monitor (whether HaX calls with a choice)"** gives away that a moral
   choice is coming. Minor. Say "Watching the security monitor" only.
4. **The phone row** ("No clue by itself"), plus no SIM source anywhere, plus the favour in §6, points
   straight at the favour as the SIM's source. The careful player guessed it. Moderate. This also
   reflects the plan's design (the favour is the only route), so it may be accepted as a fair hint.
5. **The parenthetical clue tags** ("(Okafor: wants the Codex)") are fine: the game names the cell it
   fills.
6. The packet presents the `closeHint` as reachable on a normal run (§4, HaX). It is faithful to the
   plan's wording, and that wording is the problem (§3.1).

---

## 7. Recommendations

Ranked by value for fun and learning against cost. Owners: **fixture** = §9.2 data; **copy** = player
text; **board/runtime** = engine.

**R1. Give the player a way to check before the favour (fixture).** Let the player look inside Marsh's
phone case before handing it back: "Look inside the case" grants `burner_sim` ("A burner SIM is tucked
inside the case."), with no backfire. HaX's warning then maps onto an action the player can take: the
checker sees the SIM and can refuse, while the hasty player who hands it over unchecked meets the
backfire. Counting stays as the second route. This changes the hand check (the SIM gains a cloakroom
route that is not the favour; H+C plus inspecting gives the same decided set as H+C+F, without the
backfire) and changes the plan's line "the favour is the only way to her SIM", so it needs the plan
owner's decision and a re-check.

**R2. Make the backfire felt in play (fixture).** Put the lookout where the player still has to go (the
Hall, or the archive corridor), or add a cost on the remaining path. One option: after Marsh signals, the
intern stops answering. Also add an immediate HaX line at the hand-over ("That phone just lit up. Who did
she message?"), so the cause and the effect sit together. Awareness training needs that link at the
moment it happens, not only in the debrief.

**R3. Fix the close signpost (copy, fixture).** In A the `closeHint` is reachable only by naming
innocents. Either (a) make HaX's opening call end with "When you've named who you need to, call me and
I'll open the sanctum.", and add a permanent board line "HaX can open the sanctum when you're ready";
or (b) reword the `closeHint` so it doesn't suggest that everyone must be named. Engine-wide: a
`closeHint` that only a wrong call can reach is worth a lint warning, since this mission shape (no clear
verdict, `when: "anytime"`) will come up again.

**R4. Warn before accusing someone the board can't decide yet (board/runtime, copy).** On the accuse
confirm (and the first punch): if the suspect is undecided, add "You don't have enough to decide about
Ishikawa yet." The player can still go ahead. It never says which way, so it keeps the nudge's rule,
and it targets the hasty failure at the moment it happens.

**R5. Teach counting once (copy, board).** (a) A HaX line or a board tip when the player first holds
both coats: "Count what's left. If an item hasn't turned up, someone still has room for it." (b) On
the profile card, a line per slot: "Not yet placed: brass key, burner SIM, notebook. Hidden spaces:
Okafor 2, Marsh 1." This shows the arithmetic without doing it. (c) A positive pigeonhole debrief
line to sit beside the plan's negative one: "The burner SIM was the only carried item left, and Marsh
had the only space left for it."

**R6. One word, one meaning (copy).** Rename the ✦ concept for players (for example "telltale clue";
Devotee: "Has three or more telltale clues (✦)"), and explain ✦ in the brief as well as on the board.
Keep "mark" for the player's notes.

**R7. Fix the charm wording and give it a reason (copy).** Courier: "Was in the Archive, wants the
Codex, and has no ward charm." Rename the slot "What they have" (or have the coat text say "her ward
charm"). Add one sentence of fiction: "Cultists can't bear to touch a ward charm." For the Incident
Simulations skin, the same pattern is a protective control (MFA, a badge rule), which is the point the
learner should take away.

**R8. Say that a profile may fit nobody (copy).** Under the profiles: "A profile may fit nobody, or
more than one guest." It gives no count of the guilty, so it stays within §3.1. Check it against DL10's
pattern before adoption.

**R9. Give Venn a payoff of her own (fixture).** At present her code duplicates the note, so her
`lose_ally` cost doesn't bite. Give her something only she offers. Options: a counting hint, a shortcut,
or a flavour line about who was in the archive that does not add a clue fact (and so does not change
the hand check).

**R10. Make the kind word matter, or say it doesn't (copy, fixture).** Either let it unlock a flavour
line that hints where to look (for example, the bar staff: "Marsh never let go of that phone till she
hung her coat up."), which rewards rapport without adding a clue fact, or drop the "push too far" threat
from A's witness description so careful players don't plan round nothing. Show the witness's mood if
it is kept.

**R11. Small copy fixes.**
- HaX: "Don't do favours for anyone you haven't cleared." The debrief to match: "You fetched Marsh's
  phone before you'd cleared her. It was how she signalled the others."
- Altar: "End the evening? Anyone you haven't named goes free."
- Stakes line: name the concrete costs ("A wrong call closes doors and brings trouble").
- Umbrella: "a folded umbrella", so it doesn't hint at outdoors.
- The clue label "In the Archive", to match the profile; or the profile "badged into the Archive".
- One-line descriptions of Courier and Devotee on the board, beside the labels.
- Full names, roles and pronouns for the five guests (Okafor is "her" in the plan).
- Tell the player up front that "You have enough to decide" can mean either way.

**R12. Rerun the three personas with a judge (process).** Use the answer sheet as the judge. Seal the
source results (§6.1) and remove the two §6 leaks. Without that, the stakes, nudge and debrief remain
untested by any player.

---

## 8. What players learned (keep these)

- Access plus motive is not enough; check what rules someone out (all three).
- Hard evidence beats gossip (all three).
- A friendly request from someone you haven't cleared is the hook (all three, though two learned it
  only in hindsight; R1 and R2 move it into play).
- Count what is missing as well as what you have found (careful in play, newcomer afterwards; R5 moves
  it into play for everyone).
- A suspect's own word clears nobody (newcomer, careful).
