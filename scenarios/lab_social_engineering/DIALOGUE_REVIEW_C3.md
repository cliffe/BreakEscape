# Dialogue review, design cycle 3 (`lab_social_engineering`)

Read-only review of `ink/*.ink`, `mission.json` and the player-facing text in `scenario.json.erb`,
written 2026-10-22 against the tree after commit 91d5bb6f (cycle 2 applied, fix round 6). Kind of game:
a lab game, education first, browser-only, fictional firms. Read as a student who plays once, in
60–90 minutes. Line limits kept: person lines under 30 words, phone lines under 25, choice labels
under 15. No audio exists yet, so spoken rewrites cost nothing in TTS.

This cycle is stricter than the last two. Each item below fixes a contradiction, a line that misleads,
or a scene that ends flat. Wording I merely prefer is left out.

## Verdict in brief

All 29 applied cycle-2 items are in the files as described (checked line by line). The ink now reads
as one consistent story, and most of what is left is small.

- **Continuity.** Cycle 2 caused four slips. "Your call-back" and "a call-back rule" mean two
  different things in one debrief line (item 2). Ruth's new reported-call line has an unclear "He"
  (item 3). Gareth's new goodbye is stale after the payoff scene, and it is the last thing he says
  (item 4). Ruth's phone keeps sending the student to Gareth after he has spoken (item 5). Tomasz's
  "five fixes" matches nothing the student can count (item 6).
- **The close** mostly lands now. Gareth's "the one who nearly paid that invoice" is the emotional
  peak, and Tomasz's budget question turns the recap into a decision. The weak point is the very last
  line: it says "no names" again right after Gareth did and right before the end screen does. It also
  pins a security test report up in the staff kitchen, which a Cyber Security student may well notice
  is a bad idea. One line fixes both (item 1).
- **Repetition.** The no-blame point is now made about five times on the required path (the opening
  exchange, the signing, the payoff, Tomasz's close, the end screen), plus whatever hints the student
  opens. That is about right for the lab's main theme. Two spots still say it twice in a row
  (items 1, 7), and one card relies on a "rule" the student may not have heard yet (item 8).
- **Characters.** Each has a voice and a moment: Ruth's "Careful" correction and her Sofia finding,
  Gareth's payoff, Tomasz's budget question, Dev's "spend it all at once", Melanie's twenty years in
  retail, Sofia's first payslip. One crossover: Tomasz has picked up Dev's Midlands "mind" (item 11).
- **AI-sounding prose.** Almost none left. One "not X, you're Y" in Ruth (item 9) and a design-doc word
  in the mission card (item 16).
- **Fun.** Three places where one line adds humour without slowing anything down: the reported call
  (item 3), Gareth's exit (item 4) and the close (item 1).

## Ranked proposals

---

### 1. The last line says "no names" a third time and puts the report in the kitchen
**File:** `ink/tomasz.ink`, knot `debrief_close` (line 118).

Current:
```
Tomasz: Gareth's pinning your report up in the kitchen. No names on it, so nobody's hiding from it. Thanks for playing it straight.
```
Proposed:
```
Tomasz: Gareth wanted your whole report pinned up in the kitchen. I've talked him down to the executive summary. Thanks for playing it straight.
```
**Why:** on the default route, Gareth has just said "Not one name in it... Nothing in it points at her",
and the end screen then says "The report names no one". This line makes it three in a minute. The new
line still shows the lesson, since Gareth wants everyone to read it, so it has nobody to hide. It gives Tomasz a
dry joke in his own voice. It also fixes a real slip: a report listing DMARC at p=none and an
unverified service desk is not something a security lead puts on a kitchen wall. The student also
learns the term "executive summary" in passing. A student who skipped Gareth still gets the explicit
"names no one" from the end screen.

---

### 2. "Call-back" means two things in the same debrief line
**File:** `ink/tomasz.ink`, knot `debrief`, branch `dev_reported and pretext_service_desk_call_outcome == "got_it"` (line 96).

Current:
```
Tomasz: Dev reported the first call — credit to him — but your call-back still got the date. A call-back rule to a number on file stops both.
```
Proposed:
```
Tomasz: Dev reported the first call — credit to him — but your second call still got the date. A call-back rule to a number on file stops both.
```
**Why:** cycle 2's D7 reorder added this branch. "Your call-back" (the student ringing again) and "a
call-back rule" (Dev ringing a known number) sit side by side, and the second is the lab's main
control for the desk. A listener can take it to mean that ringing back was the student's mistake.

---

### 3. "He knows it was us": which he?
**File:** `ink/ruth.ink`, knot `hub`, branch `pretext_call_reported and not pretext_call_done` (line 179).

Current:
```
Ruth Adeyemi: Dev's manager rang Gareth about a dodgy call. He knows it was us. The desk's on guard now, so give it a while.
```
Proposed:
```
Ruth Adeyemi: Dev's manager rang Gareth about a dodgy call. Gareth promised to look into it, with a straight face. Give the desk a while to calm down.
```
**Why:** the nearest "he" is Dev's manager. If he knows it was Tarnside, the test is blown and the
second call makes no sense. The new line shows the client contact keeping the test covered, which is
how a real engagement handles an escalation. It also gives the one moment of real risk in the lab a
laugh rather than a status report.

---

### 4. Gareth's goodbye after the payoff tells you to go gently with his staff
**File:** `ink/fairbairn.ink`, knot `hub`, choice `[I'll leave you to it.]` (lines 171-175).

Current:
```
{ roe_signed:
    Gareth Fairbairn: Aye. Go gently with them.
- else:
    Gareth Fairbairn: Aye. Mind the sheet.
}
```
Proposed:
```
{
- report_filed:
    Gareth Fairbairn: Aye. Tomasz is through there. I think he's enjoying this more than he lets on.
- roe_signed:
    Gareth Fairbairn: Aye. Go gently with them.
- else:
    Gareth Fairbairn: Aye. Mind the sheet.
}
```
**Why:** after the payoff scene, the only choice is "I'll leave you to it", so this goodbye is the last
line Gareth says in the game. "Go gently with them" comes after the attack is over and the report is
filed, which makes the emotional beat sound like a leftover. The new line points to the next room,
and Gareth's dry dig at Tomasz is in keeping with "giving me a headache... I asked for it".

---

### 5. Ruth's phone keeps sending the student to Gareth after he has spoken
**File:** `ink/ruth_phone.ink`, knots `stage7` (line 444) and `stage_done` (line 462).

Current:
```
+ [Has Gareth seen the report?]
    Ruth Adeyemi: He's reading it. Go by the window, he wants a word.
...
+ [Anything for Gareth?]
    Ruth Adeyemi: He's read your report. Go and hear what he thinks, by the window.
```
Proposed: declare `VAR fairbairn_payoff_heard = false` and gate both choices on it:
```
+ {not fairbairn_payoff_heard} [Has Gareth seen the report?]
...
+ {not fairbairn_payoff_heard} [Anything for Gareth?]
```
**Why:** cycle 2 added `fairbairn_payoff_heard` so that Tomasz stops nudging once the scene has
played. The phone was not updated. A student who has already heard the payoff and asks the phone gets
sent back to the window, and finds Gareth with nothing new to say.

---

### 6. "Five fixes" matches nothing the student can count
**File:** `ink/tomasz.ink`, knot `debrief` (line 106).

Current:
```
Tomasz: That report's got five fixes in it. I'll get budget for one this year, if I'm lucky. Which would you pick?
```
Proposed:
```
Tomasz: That report's got three fixes in it. I'll get budget for one this year, if I'm lucky. Which would you pick?
```
**Why:** the report has three findings with one control each. The SOC board the student has just
finished has four mitigations. Tomasz then offers three options, one for each report control. "Five"
works only if you split "banner and DMARC" and "bookmark and report button", which no student will do.

---

### 7. Ruth's plan topic says the no-names point twice in a row
**File:** `ink/ruth.ink`, knot `topic_plan` (lines 217-218).

Current:
```
Ruth Adeyemi: Decide that before you send a thing. Count how far each attempt got. Who fell for it is the one thing we never count.
Ruth Adeyemi: Name a staff member in a success measure and you've already broken Gareth's one rule.
```
Proposed: delete the second line and keep `~ quiet = true`.
**Why:** the second line repeats the end of the first. This is the cheapest cut among the no-blame
mentions, because the plan card's own feedback makes the same point when the student picks "Which
named staff fell for it".

---

### 8. The plan card cites "Gareth's one rule" before the student may have heard it
**File:** `scenario.json.erb`, `social.engagement.plan.measures[names].why`.

Current: `"Gareth's one rule. Name people and they stop reporting."`
Proposed: `"Gareth's one condition is no names in anything he reads. Name people and they stop reporting."`
**Why:** the planning whiteboard has no `requiresGlobal`, so a student who skips Ruth's "Take it to
Gareth" goes straight from the sheet to the plan and has not heard the condition yet. This card is
where that student first hears it, so it has to say what the rule is. The wording matches Gareth's own
line in `sign`.

---

### 9. Ruth states the law before the signing does, using an "X, you're Y" line
**File:** `ink/ruth.ink`, knot `topic_scope` (line 211).

Current:
```
Ruth Adeyemi: Only what that sheet signs off. Step outside it and you're not testing any more, you're breaking the law.
```
Proposed:
```
Ruth Adeyemi: Only what that sheet signs off. If something isn't on it, ask me before you try it.
```
**Why:** PLAN §6 says the law is stated once, and the signing scene states it ("the difference between
a test and a crime... Computer Misuse Act"). A student who asks this first hears the same point twice
within a minute, and the second time it has lost its force. "Ask me first" is what an engagement lead
actually tells a junior, and it matches the stop-rule answer ("stop and tell me").

---

### 10. Gareth introduces himself, then says "Yes?" straight away
**File:** `ink/fairbairn.ink`, knot `start` (line 144).

Current: `start` prints the introduction and diverts to `hub`, which prints the idle line `{&Yes?|...}`.
So the student hears "...I hired most of that floor myself." and then "Yes?".
Proposed: add `~ quiet = true` after the introduction line, as Ruth's `brief_close` and Tomasz's
`start` already do.
**Why:** this is the same back-to-back problem cycle 2 item 7 fixed for Ruth. "Yes?" right after a warm
introduction sounds curt, as though he wants the student to go away. (When the sheet is already signed
on first contact, `sign` sets `quiet` itself, so this only affects the unsigned case.)

---

### 11. Tomasz has picked up Dev's "mind"
**File:** `ink/tomasz.ink`, knot `start` (line 35) and knot `hub` (line 49).

Current: `...Gareth's been asking after you, mind. See him first if you like, then we'll close this out.` (both)
Proposed: `...Gareth's been asking after you. See him first if you like, then we'll close this out.` (both)
**Why:** a tag "mind" belongs to Dev's Midlands voice ("I still go by the list, mind") and Gareth's Scots
("Mind the sheet"). Tomasz is quick, dry and Polish British. These two lines are the only place the
voices overlap.

---

### 12. "Gave us them"
**File:** `ink/ruth.ink`, knot `hub`, branch `phish_lord_landed and not report_filed` (line 185).

Current:
```
Ruth Adeyemi: Sofia checked the sender, the portal's name and the date. All three were right. Her own service desk gave us them. That's your finding.
```
Proposed:
```
Ruth Adeyemi: Sofia checked the sender, the portal's name and the date. All three were right. Her own service desk gave us all three. That's your finding.
```
**Why:** "gave us them" trips when read aloud. "All three" ties the desk to the list before it, and that
link is the finding.

---

### 13. Ruth's PDF hint says the properties *are* the username pattern
**File:** `ink/ruth.ink`, knot `topic_recon` (line 224).

Current:
```
Ruth Adeyemi: And read the published PDF's properties — who made it, and how. That's the username pattern.
```
Proposed:
```
Ruth Adeyemi: And open the published PDF's properties. The author field shows how usernames are built.
```
**Why:** "who made it, and how" points at both the author and the software fields, and only the author
field matters. Cycle 2 item 25 fixed the same hint on the phone. The in-person version should say the
same thing.

---

### 14. The triage note quotes words that aren't in the student's email
**File:** `scenario.json.erb`, `triageSets[0].messages[own_lord].notes.perFlagNote.urgencyCalibrated`.

Current: `"A payslip 'ready now' is the pressure to click without checking."`
Proposed: `"A payslip waiting to be read is the pull to click before checking the address."`
**Why:** the student's email used the template "Your payslip is ready on {portal}, released {when}."
"Ready now" isn't in it. This note shows on the student's own send, the one message where they know
exactly what they wrote, so a misquote there is easy to spot.

---

### 15. Jed's real balance sheet arrives "as promised" on Monday, after a promise for Friday
**File:** `scenario.json.erb`, `triageSets[0].messages[fwd_balance_sheet].body`.

Current: `"Mel, Q3 balance sheet as promised. Sent via the finance list so the team gets a copy too.\n\nJed"`
Proposed: `"Mel, Q3 balance sheet, a few days early for once. Sent via the finance list so the team gets a copy too.\n\nJed"`
**Why:** cycle 2 item 19 made the promise a single Friday, and the game clock says Monday. The student
spoofed "the Q3 balance sheet you wanted Friday" and now reads the real one arriving on Monday "as
promised". The new wording fixes the dates and makes Jed sound like a person.

---

### 16. Mission card: a third-party "client", and "Deterministic"
**File:** `mission.json`, `description`.

Current: `"...Ledgerwell Ltd has hired you to show how far a phishing and social-engineering campaign could get against their staff, for a client whose one condition is that nobody gets named and shamed. ... Deterministic, fully explained, no virtual machines."`
Proposed: `"...Ledgerwell Ltd has hired you to show how far a phishing and social-engineering campaign could get against their staff. They have one condition: nobody gets named and shamed. ... Every outcome is explained, and there are no virtual machines."`
**Why:** "for a client whose..." after Ledgerwell has just been named reads as if there were a second
company. "Deterministic" is the design brief's word, not a student's.

---

## Considered and left alone

- **End screen** ("The report names no one... Gareth keeps his staff, and his staff keep reporting.").
  With item 1, this is the only explicit no-names line after Gareth's, so it should stay. "Keep
  reporting" sits a little oddly beside the plan card's "Ledgerwell has no report button yet", but
  people can report without a button (Dev did), and the line works as the last word.
- **Tomasz's opening recap** ("An open inbox trusts anyone, a From line is just a label, and a padlock...").
  It is a list of three, but each item maps to one of the student's three sends. A debrief is the right
  place for it.
- **"If that door's locked, I've got the key — come and see me"**, used in three phone stages. Only one
  shows at a time, and it is a hint; using the same words each time helps.
- **Ruth's `topic_defend`** still says "once both are done" after both are done. It is reachable only
  in the few seconds before the debrief and does no harm.
- **The three kept slogans** ("not catching anyone out", "my training's fault, not theirs", "a script,
  not a warning"). Each is said once, in character, at a point that matters.
- **No reaction from Ruth when Melanie or Chris lands.** The replies themselves are the reward, and
  Tomasz's "Melanie first try" pays it off later.

## Checked and fine

- Cycle 2 items 1–28 and 30 are all present in the files as the log describes (signing order on both of
  Ruth's channels, the applicant reason for webmail, LedgerPay, the payoff nudge, the budget question,
  the invoice times and sort code, Jed's list address, Easter rota, Fairbairn's "hired most of that
  floor", Dev's band-1 lines and the "spend it all" date line, the repair tell).
- `fairbairn_payoff_heard` is declared in `globalVariables`, set in `payoff` and read by Tomasz.
- Line limits hold in every proposal above.
- No proposal prints a variable in a voiced line or changes a knot, divert or tag, except items 4
  (a `report_filed` branch in an existing conditional; `report_filed` is already declared), 5 (two
  choice conditions and a new `VAR` on the phone) and 10 (`~ quiet = true`).
