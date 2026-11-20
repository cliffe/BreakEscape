# Player test, fixture B ("Night shift"): judge's report

Version read: `DEDUCTION_IMPLEMENTATION_PLAN.md`, 3327 lines, latest §14 round "Round 4 outcomes". The packet and
answer file were extracted from the same version. Inputs: `player_packets/fixture_B.md`,
`player_packets/fixture_B_answer.md`, `player_runs/fixture_B_{careful,hasty,newcomer}.md`. I checked plan §3.10,
§6.3 and §9.1 for what the debrief would actually show each player.

## 1. Results against the truth

| Player | Okoro (insider) | Lindqvist (clear: no device) | Haddad (clear) | Morgan (clear) | Debrief they would get |
|---|---|---|---|---|---|
| Careful | Named: right | Cleared: right | Cleared: right | Cleared: right | All right. "Every call matched the evidence." |
| Hasty | Named: right | **Named: wrong** (DHCP printout never read) | Cleared: right | Cleared: right | Lindqvist "Wrong call"; undecided at the verdict, so "The clue that would have settled it: Lindqvist: no personal device, from <place>"; no-blame line "A missed clue is not a mistake in judgement." |
| Newcomer | Named: right | **Named: wrong** (all twelve clues held) | Cleared: right | Cleared: right | Lindqvist "Wrong call", "You already held what settled it: no personal device"; no-blame line "rule misread". |

Two of three players named an innocent. Neither error came from bad reasoning about the profile alone. Both
came from three things outside the profile: the count lines, Tomás's alarm story and Lindqvist handing over the
door code. All three players found Okoro easily, and no one was confused by Haddad or Morgan.

## 2. Where reasonable players were misled

### 2.1 "2 in this case" read as "two insiders" (all three players, major)

Every count line on the board reads "<label>: 2 in this case, 0 found", and all six say 2. All three
players first read the counts as a headcount of culprits. The hasty and newcomer players carried that reading to
the call and named two people. The careful player resisted, but said the counts "pushed the same way".

Three things make it worse:
- The counts sit directly under the profile, so they look like part of "What to look for".
- All six are 2, a symmetric case with four suspects, so "2" is the only number on the board.
- The brief says "with help from inside" and "miss someone", and Nair says "Name as many as the evidence
  supports". All of this is correct under DL10, but together it makes a plural answer feel expected.

DL10 bans stating how many are guilty because it misleads. Here the count line implies a number by accident,
which has the same effect. This is a copy and layout problem. The mechanic is fine.

Fixes, cheapest first:
1. Change the default count line (§6.3) so it describes clues. For example: "Clues like this across all four
   staff: 2 (0 found)", with the staff count filled in. Or group the counts under their own sub-heading,
   "Clues in this case (guilty or not)", set apart from the profile.
2. Pair the yes and no lines per row so they read as a split of the staff: "Server room access: outside their
   role 2, own work 2 (0 of 4 found)". When the two halves sit side by side, the number can't pass for a
   headcount of culprits.
3. Lint (a DL10 companion): warn when every positive count in a case equals the same number, and that number
   is more than one. B would trip it. One way out is to change a count. Another is to accept the warning with
   `_why`, once the copy above is in.

### 2.2 Tomás's alarm story points at the wrong man and is never settled (hasty, newcomer: major; careful: minor)

Tomás: "the server room alarm at about two, and Lindqvist went in". The badge log: Lindqvist 23:40, Okoro 02:10.
This is the only story beat in the case, and it gives no board clue. The two players who named Lindqvist both
said it was their main reason. The careful player spotted the timing gap and enjoyed it ("the best moment of the
run"). Then they worried, because if Lindqvist went in at two without badging, that looks worse for him. Nothing
in the case settles it, and the debrief never mentions it.

Keep the mismatch: catching a witness out against a record is the best detective moment in B, and it teaches
something. Close it off, though:
- Soften Tomás to report what he can actually know: "Alarm went off about two. I think it was Lindqvist went
  in, he's the one who sees to alarms." He is guessing, and the line says so.
- Lindqvist's alarm topic answers it: "I was in at twenty to twelve for the cooling, and gone by one. Whoever
  set it off at two, it wasn't me. Check the log." He gives the code (see 2.3). His word doesn't clear him on
  the board, and it shouldn't. It just tells the player where to look.
- Add an authored debrief note per case or per suspect (it doesn't exist yet; §6.3 has no field for it):
  "Tomás heard the alarm at about two. The badge log puts Okoro in at 02:10, not Lindqvist. Witnesses mix up
  who and when. Logs don't." Show it to everyone. Careful players get credit for spotting it, and the others
  learn it.

### 2.3 Lindqvist hands a stranger the server room code (hasty, newcomer, careful: major for education)

All three players read the hand-over as suspicious. The newcomer and hasty players counted it against him. In
an awareness game there is a worse problem: a facilities engineer reading a door code out to whoever asks is the
very behaviour the game should be teaching people not to do. Left as it is, it models bad practice without
comment.

Fix: show him checking. "Nair said you'd be coming. Hang on." (He phones her.) "Right. It's 4417. I'm changing it
in the morning." This shows the habit (verify the request on a known channel), makes him look careful rather than
guilty, and costs one line. If the team wants the suspicion, put it in the debrief instead: "Lindqvist gave you
the code after checking with Nair. That's the right way to hand out access."

### 2.4 "Not an insider" for Haddad passed over the policy breach (newcomer, minor)

The newcomer cleared Haddad while noting that bringing her own laptop is "a bit naughty". The game never says
whether it is. Add one line to the debrief for Haddad, or give her a short talk topic (2.6): "Haddad's laptop on
the staff network breaks policy and is worth a word. It isn't the profile." This teaches the difference between
a policy breach and a threat, which is the case's main lesson.

## 3. Fairness and difficulty

- **Fair.** Every suspect can be decided from things the player can see, and the red herring is honest: the
  profile clears Lindqvist on a clue in the same room as the one that convicts Okoro. No player called anything
  unfair once they reread the packet.
- **Too easy in the wrong way.** The careful player solved Haddad and Morgan within two minutes from one document,
  and said the rest was "ticking boxes". The HR summary settles the grievance row for all four, the DHCP printout
  settles the device row for all four, and the nudge confirms each one. There is nothing to infer. Easy is the
  aim, but the case should still need at least one small inference.
- Proposed change that keeps it easy and makes the counts matter: make the HR summary hold only the two complaints
  on file (Okoro's appeal and Lindqvist's overtime complaint). Drop "HR has nothing on file for Haddad/Morgan"
  as clues. Then the board shows "Grievance this month: 2 in this case, 2 found", and the player works out the
  other two by count elimination, with the nudge firing at that moment, and the debrief's fixed line explains it
  ("Both grievance clues were found elsewhere, so Haddad could not have one"). This is the one rule in the case
  that a newcomer can learn and then use, and the nudge makes sure nobody gets stuck on it. Check DL8 still passes:
  with the HR summary and Tomás, Haddad and Morgan are still decided in the opening rooms, so the result is the
  same as now (2 of 4 decided).
- **Okoro is too easy.** She has two routes for her device and two for her grievance, and Tomás volunteers both.
  That is fine for the guilty suspect in a teaching case, but cut one: drop Tomás's "gadgets" topic, or move it to
  Haddad's laptop. Then Tomás points at a foil as well as at the culprit, and the device row needs the
  printout for everyone.

## 4. Persona failure modes and what caught them

### Hasty accusation
- **The nudge did its job and was ignored.** The hasty player noticed there was no nudge on Lindqvist's card and
  explained it away. The nudge only appears; it never asks for anything.
- **The call has no check at all.** The hasty player named Lindqvist with his device cell still Hidden. Suggest
  one line from Nair when the player names someone who still has Hidden clues, before "This can't be taken back":
  "You've still got blanks on Lindqvist. Name him anyway?" It gives nothing away about which way he goes, and
  it fits the warned step §7.5 already has for "That's everyone".
- **The debrief lets them off.** Lindqvist was undecided when named, so the line is "A missed clue is not a mistake
  in judgement." That is true for a newcomer who never found the printout. It is the wrong lesson for someone
  who left the room without reading it. Add a fifth no-blame case, chosen when a wrong name was undecided at
  the verdict: "You named Lindqvist before his last clue was in. Waiting for it costs nothing. A wrong name
  costs someone else."
- "from <place>" should name the object as well as the room ("the DHCP printout, server room"). The hasty player
  was standing in the right room.

### Newcomer confusion
- **Jargon.** "DHCP printout", "took a lease", "log-filter puzzle", "grievance", "rota". Rename the object for
  players: "Network device list" (keep "DHCP" in a subtitle and in the debrief, where it can be explained).
  Rewrite Haddad's clue: "Haddad's own laptop joined the staff network." The badge log terminal's first screen
  needs one sentence on what filtering means ("Pick a name and a time to see who badged in").
- **"Which profile?" with only one choice.** It made the newcomer wonder what the other profiles were. Skip the
  picker when the case has one profile (engine copy rule).
- **Topics vanishing.** The newcomer thought something had broken when Tomás's held topics were gone. Either keep
  them visible but greyed with "(you already know this)", or have Tomás say it once: "You've seen the HR file,
  then. I won't repeat it." Also make Lindqvist's pay topic follow the same rule. At present it stays on offer
  once the clue is held, and the careful player found that inconsistent.
- **Marking Insider against the evidence.** The newcomer marked Lindqvist "Insider" with "no personal device" on his
  card. The "Not an insider" mark already lists the clues held. Do the same for "Insider": show the three
  profile lines with the held clue next to each ("Personal device: no personal device"). The contradiction is
  then in front of the player while they mark, before the call. That is the habit the "rule misread" line
  asks for, and it gives nothing away the card doesn't already show.
- **No idea where to start.** Nair's opening call should say what to do first: "Start with HR's file, then talk to
  whoever was on last night. The board in the office keeps track."
- The newcomer's debrief corrects the profile reading but not the count reading that caused it. Fixing 2.1 at
  the board is better than adding a debrief line.

### Careful
- Handled well. Their complaints were "too easy" (section 3), "dead conversations" (2.6) and the alarm gap (2.2).
- Tomás's goodwill isn't shown, so they spent the coffee line as a precaution. Show his mood in words without
  numbers: after the second question, "He glances at the clock"; when wary, "He's stopped meeting your eye."

## 2.6 (cross-cutting) Three dead conversations

Okoro, Haddad and Morgan have no topics. All three players walked up to them and got nothing. The newcomer went
back twice. Give each one authored topic with no clue, each doing a job:
- **Okoro**, a self-claim the badge log contradicts: "I was on the console all night. Didn't leave the office." This
  teaches the lesson the careful player stated ("what someone says about themselves isn't evidence") through play
  instead of a note, and makes the 02:10 entry hit harder.
- **Haddad**, her ticket and her laptop: "I logged a ticket for the rack switch and went in once. And yes, my laptop's on
  the staff Wi-Fi. I know." This covers 2.4. It also answers the careful player's doubt about whether a ticket
  logged by herself is circular, if Morgan adds "Tickets go through me, I signed hers off."
- **Morgan**, what "role" means: "Supervisors do checks. Service desk goes in on a ticket. Nobody else on nights
  has a reason." This gives newcomers the rule behind "outside their role" before they reach the badge log.

None of these grants a clue, so DL rules and the evaluator are unaffected.

## 5. Stakes felt weak

`light` gives "Stakes: a wrong call changes how the story ends." All three players said they felt nothing
concrete until Nair's "Anyone you haven't named is cleared". Nair's `b_wrong_name` reply is still a placeholder.
Suggested copy:
- Brief: "Anyone you name is suspended while we look into it. Anyone you don't is cleared."
- Nair, right: "Okoro's badge is cancelled. We'll find out who she let in."
- Nair, wrong (Lindqvist): "Lindqvist's suspended. If you're wrong, a man who complained about his overtime has
  just been walked out by security."
- Nair, missed Okoro: "Okoro's back on shift tomorrow night."

These lines make "light" stakes felt without changing the scoring (B stays `completion`, §13.1 Q3).

## 6. Small wording points

- Four "Noted" pop-ups in a row from the HR summary (careful, newcomer). Collapse to one toast when one source
  grants several clues: "Noted: 4 clues from the HR summary".
- "Went in outside their role" vs Tomás's "Lindqvist went in" (hasty): same verb, one evidence, one gossip. The
  softened Tomás line in 2.2 deals with it.
- "Names you give me stand" was understood late by two players. Try "Once you name someone, that name stays in the
  report."
- "You have enough to decide about <name>" (newcomer wondered if "enough" meant guilty). Fine as is. The nudge is
  meant not to say which way. Leave it.

## 7. Spoilers in the packet extraction

The packet was meant to hold only what a player could see. It leaks more than that, which flatters the
results (the runs had more help than a real player would):
1. **Every clue's full text is listed up front** (§4.1–4.3), so the whole solution can be read from the packet
   before "playing". Runs followed play order, but the hasty player's reflection shows they could reread it.
   Future packets should give each source's clue text only as "read when you reach it", or split the packet per
   room.
2. **Designer notes a player never sees:** "Nothing she says about herself counts as evidence" (Okoro), "He talks
   about himself only. Nothing he says clears him." (Lindqvist). These state rules of the evaluator and hint that
   Lindqvist can't be cleared by talk.
3. **Hidden mechanics stated as numbers:** "After three questions he turns guarded", "the first question is free",
   "Thanking him... wins some goodwill back, once." The careful player planned their questions around this.
   A real player would not know the budget.
4. **§5 "Clues by person" index** shows Okoro has the most routes (two each for device and grievance). It isn't a
   game spoiler (players never see routes), but in a packet it marks the guilty one.
5. **§6 end note** tells the reader the success screen says "Case closed" whatever they decided, which lowers the
   felt stakes in the run. A real player learns that only after the call.
6. The placeholder brief and board copy were written by the extractor. Run reactions to them ("help from
   inside") are reactions to placeholder text and should not be held against the plan.

## 8. Top recommendations (ranked)

1. Rewrite the count line and layout so counts read as clues across all staff, not culprits (2.1). All three players
   misread it; two named an innocent partly because of it.
2. Keep Tomás's alarm/time mismatch but soften his line to a guess, give Lindqvist a timed denial that points to
   the log, and add a debrief note that names the gap (2.2). It turns B's strongest red herring into its best
   lesson: check the witness against the record.
3. Show Lindqvist verifying with Nair before giving the server code (2.3). As written, the case models handing a
   door code to a stranger.
4. Give Okoro, Haddad and Morgan one clueless topic each (2.6): Okoro's false alibi, Haddad's laptop and ticket,
   Morgan's explanation of roles.
5. Make the HR summary hold only the two complaints, so Haddad and Morgan are cleared by count elimination with the
   nudge as the safety net (section 3). It's still easy, and the counts get a job.
6. For hasty players: Nair checks with "You've still got blanks on <name>" when someone with Hidden clues is named,
   and add a fifth no-blame line for a name given while undecided (section 4).
7. For newcomers: rename the DHCP printout for players, explain the log filter in one line, skip "Which profile?"
   with a single profile, show the held clue against each profile line when marking "Insider", and have Nair say
   where to start (section 4).
8. Write concrete stakes copy for the brief and Nair's three outcome replies (section 5).
9. Tidy packet extraction for C and D runs: per-room clue reveal, no designer notes, no mechanic numbers (section 7).
