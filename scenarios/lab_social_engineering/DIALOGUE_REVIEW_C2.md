# Dialogue review, design cycle 2 (`lab_social_engineering`)

Read-only review of `ink/*.ink` and the player-facing text in `scenario.json.erb`, written 2026-10-22
against the tree after commit 823ea031 (cycle 1 applied, fix round 5). Kind of game: a lab game,
education first, browser-only, fictional firms. Line limits kept: person lines under 30 words, phone
lines under 25, choice labels under 15. No audio exists yet, so spoken rewrites cost nothing in TTS.

## Verdict in brief

Cycle 1 mostly landed well. LedgerPay is consistent everywhere it should be (Dev's line, the intel
facts, the sender's display name, the landing wording, the hints). The Tomasz reveal is gated
properly, Dev now reacts in his own voice by technique, and the ink is down to three "X, not Y"
slogans, the three cycle 1 meant to keep. The debrief has its choice.

What it left behind, or caused:

- **The signing still contradicts itself, now on the phone.** Ruth in person says "Take it to Gareth,
  he'll want to sign it himself", while her phone says "Gareth's signed" and "He signed in person" at the
  same moment. The scope sheet's intro says Ledgerwell "have signed off" (item 1).
- **The throwaway-address advice contradicts itself.** Cycle 1 rewrote the in-person reason but not the
  phone rung, which still says "so nothing comes back to Tarnside". That rung also answers "Do I write
  from the guest account?" with "not yet", two rungs before telling the student to switch to the guest
  account for Melanie (item 2).
- **Ruth's new Sofia line has a factual slip.** The desk didn't give out Sofia's name (item 3).
- **Lines repeat back to back.** The key hand-overs and the brief's close are each followed straight away
  by a hub line that says the same thing (item 7).
- **The build log says Pierce gained an `ownFrom` hint rung.** It isn't in the scenario (item 12).

**As a story,** the route builds well from the brief to Melanie: each stage hands the next one a reason.
Tension rests almost entirely on Dev's influence bar, and getting reported has no consequence in the
story (item 8). Sofia's landing is the one moment with weight, and the text barely marks it (items 3,
24). Each named character gets a beat, but the close is weak. Fairbairn's payoff is optional and can be
missed entirely, because Tomasz's debrief ends the game (item 4). The debrief reads out the whole fix list
and then asks you to pick from it (item 5). Its last line and the end screen then make the same "no
names, people keep reporting" point one after the other. That point comes up about seven times across
the lab.

**AI-sounding prose** is mostly gone from the ink. What remains: a cluster of "X, not Y" reasons in
the plan and defender cards (item 22), a three-beat list in the definition of "lands" (item 26),
and design-doc words in two phone rungs ("the gate", "call facts") and one Ruth line ("held facts")
(items 9, 25).

**Skipped items from cycle 1.** Item 11's Tomasz line: the skip was right, because the
`supplier_bank_change` triage message pays off the hook. The emotional half of that hook (the woman who
nearly paid) is better given to Fairbairn (item 6). The skipped "on Fridays" wording is wrong, not a
style point, and deserves fixing (item 19). The typo-squat terminology is still open, but the page
builder's owner should decide it (item 29).

## Ranked proposals

---

### 1. The phone says Gareth has signed before he signs
**Files:** `ink/ruth_phone.ink` knot `stage1` (lines 76-79); `ink/ruth.ink` knot `hub` (line 165);
`scenario.json.erb` `social.engagement.scope.intro`.

`stage1` shows as soon as `roe_signed` is set, which is when the cards are sorted. Fairbairn's `sign`
scene plays only when the student next talks to him.

Current:
```
Ruth Adeyemi: Gareth's signed. The whiteboard next.
+ [Did Gareth say anything?]
    Ruth Adeyemi: He signed in person, by the window. Go and hear his one condition before you plan.
```
In person, at the same moment (ruth.ink 165): "That's it done. Take it to Gareth by the window. He'll
want to sign it himself."
Scope intro: "...Ledgerwell have only signed off what is on this sheet."

Proposed (declare `VAR fairbairn_condition_heard = false` in ruth_phone.ink):
```
{ fairbairn_condition_heard:
    Ruth Adeyemi: Gareth's signed. The whiteboard next.
- else:
    Ruth Adeyemi: Sheet's done. Gareth wants to sign it himself, by the window. Then the whiteboard.
}
+ {not fairbairn_condition_heard} [Does Gareth need me?]
    Ruth Adeyemi: He signs in person, and he's got one condition. Hear it before you plan.
```
ruth.ink 165: `Ruth Adeyemi: Sheet's done. Take it to Gareth by the window. He wants to sign it himself.`
Scope intro: "...Ledgerwell will sign off only what is on this sheet."

**Why:** the signing is the ethics gate, and cycle 1 item 2 set out to make it happen once, in front of
the student. Two of Ruth's channels now disagree about whether it has happened. "That's it done" is also
a Scots/Northern turn, which belongs to Fairbairn, not to Ruth's Lagos-London voice.

---

### 2. The throwaway-address advice contradicts the next rung
**Files:** `ink/ruth_phone.ink` knot `stage3` (lines 114-115); `ink/ruth.ink` knot `topic_account`
(line 223).

Current (phone):
```
+ {not acct_freemail} [Do I write from the guest account?]
    Ruth Adeyemi: Set up a throwaway address first, so nothing comes back to Tarnside.
```
Two rungs later: "Freemail can only send as itself. Switch to the guest account, then set Jed in the From
line." In person: "Testers send from separate kit, so Tarnside's real domain never lands on a blocklist."

Proposed (phone, gate on `not phish_pierce_landed` so it stays useful after the address exists):
```
+ {not phish_pierce_landed} [Which account do I send from?]
    Ruth Adeyemi: For Chris, a throwaway webmail address: real applicants use one. For Melanie, the guest account, because it lets you set the From line.
```
In person, `topic_account` first line:
```
Ruth Adeyemi: Real applicants write from webmail, so a throwaway address looks like one and passes every check. It's still logged against the job.
```
**Why:** "so nothing comes back to Tarnside" is the attacker's motive that cycle 1 item 9 removed from
the in-person line. The phone kept it. The blocklist reason doesn't explain why the guest account is
fine a moment later, since that is separate kit too. The applicant reason does, and it is what Chris's
checklist actually scores ("Sent as your own address, so there is nothing to spoof and nothing to
fail"). A student who asks "which account?" gets one answer that covers both rounds.

---

### 3. Ruth's Sofia line credits the desk with her name
**File:** `ink/ruth.ink`, knot `hub`, branch `phish_lord_landed and not report_filed` (line 179).

Current:
```
Ruth Adeyemi: Sofia checked the sender, her name and the date. All three were right, because Ledgerwell's own desk gave them to us. That's your finding.
```
Proposed:
```
Ruth Adeyemi: Sofia checked the sender, the portal's name and the date. All three were right. Her own service desk gave us them. That's your finding.
```
**Why:** her name came from the team page. Dev gave the sender, LedgerPay and the date
(`dev_service_desk.ink` `ask_reaction`). Report finding 2 reads "gave out the portal name and payslip
date", so Ruth's line has to match the finding she is pointing at.

---

### 4. The through-line's payoff can be skipped, because the debrief ends the game
**Files:** `ink/fairbairn.ink` knot `payoff`; `ink/tomasz.ink` knots `start` and `hub`;
`scenario.json.erb` `globalVariables`.

Current: Fairbairn's "Not one name in it, just like I asked" plays only if the student walks back to
him after filing. Tomasz's `debrief_close` fires `#complete_task:closing_debrief`, which opens the end
screen. A student who goes straight from the report to the Blue Team room finishes without the payoff
PLAN §5 promises for through-line 1.

Proposed: in `payoff`, add `#set_global:fairbairn_payoff_heard:true` and declare the global. In
tomasz.ink, add the VAR and put this branch ahead of the both-done line in `hub` (and the same text in
`start`'s both-done branch):
```
- triage_pass and profile_done and not fairbairn_payoff_heard:
    Tomasz: Both done. Gareth's been asking after you, mind. See him first if you like, then we'll close this out.
```
**Why:** this is a nudge, not a gate, so nobody gets stuck. It makes the emotional close the default
route, not a side trip.

---

### 5. The debrief lists every fix, then asks you to choose one, then repeats the end screen
**File:** `ink/tomasz.ink`, knot `debrief` (lines 94-96) and `debrief_close` (line 108).

Current:
```
Tomasz: So: DMARC to enforcement, a banner on outside mail, metadata stripped, a call-back script for the desk.
Tomasz: And a bookmarked portal with a report button, so anyone can check before they type a password.
Tomasz: If you could fix one thing here tomorrow, what would it be?
...
Tomasz: Whichever it is, the report names nobody. Blame them once and they stop telling us. Thanks for playing it straight.
```
The end screen then says: "The report names no one... his staff keep reporting."

Proposed: replace the three lines with one:
```
Tomasz: That report's got five fixes in it. I'll get budget for one this year, if I'm lucky. Which would you pick?
```
and `debrief_close`:
```
Tomasz: Gareth's pinning your report up in the kitchen. No names on it, so nobody's hiding from it. Thanks for playing it straight.
```
**Why:** the student wrote those fixes a few minutes ago, so reading them back is a tidy summary. The
budget line gives Tomasz's "half a person's budget" a payoff and makes the choice a real trade-off.
The new close shows the no-blame lesson as a picture instead of saying it a seventh time, and it leaves
the moral to the end screen.

---

### 6. Bring back the woman from the opening
**File:** `ink/fairbairn.ink`, knot `payoff`, line 60.

Current:
```
Gareth Fairbairn: I can hand that to the whole firm and nobody feels hunted. Thank you.
```
Proposed:
```
Gareth Fairbairn: She'll read it too, the one who nearly paid that invoice. Nothing in it points at her. Thank you.
```
**Why:** Ruth's opening hook is a person ("He isn't angry at her"). The triage message pays off the
invoice, but nobody pays off the person. One line from the man who protected her gives the close its
weight. It also takes up the half of cycle 1 item 11 that the skip left out.

---

### 7. Lines repeat back to back on key hand-overs and after the brief
**File:** `ink/ruth.ink`, knots `brief_close` (line 71), `keys` (lines 142, 152), `hub` (lines 163,
169, 181).

`keys` runs as a tunnel at the top of `hub`, and the stage cascade then speaks too. So:
- After the brief: "Read the rules of engagement on the board. Properly..." then straight away "The rules
  of engagement are on the board. Start there."
- Recon key: "...nothing behind a login." then "Public pages only. If you'd need a password to see it,
  it's off the sheet."
- Blue Team key: "...Tomasz has the other half." then "Tomasz has the other half of this for you, in the
  Blue Team room."

Proposed: add `~ quiet = true` at the end of `brief_close` and after the Recon and Blue Team key lines.
Leave the Operations key without it, because its hub follow-up ("Make your throwaway address") adds
something. Reword the Blue Team key line while there:
```
Ruth Adeyemi: Report's filed. Gareth's reading it now, so go and see him. Then the Blue Team room: Tomasz has the other half.
```
**Why:** saying something twice in a row sounds like a bug. "Go and see his face" (current) also reads
oddly aloud.

---

### 8. Getting reported has no consequence in the story
**File:** `ink/ruth.ink`, knot `hub` (insert before the `phish_pierce_landed and not (...)` branch,
line 174); declare `VAR pretext_call_reported = false`.

Current: only the phone mentions it ("Dev flagged that last call to his manager"). In person, Ruth
repeats "Sofia's the careful one..." as if nothing happened.

Proposed:
```
- pretext_call_reported and not pretext_call_done:
    Ruth Adeyemi: Dev's manager rang Gareth about a dodgy call. He knows it was us. The desk's on guard now, so give it a while.
```
**Why:** the call is the lab's one moment of real risk, and the risk lands better when someone in the
world reacts. It also shows the escalation route working inside the engagement, which sets up
Tomasz's "credit to him" line.

---

### 9. "Held facts" survives in person, and the call has no stakes
**File:** `ink/ruth.ink`, knot `topic_hard`, line 230.

Current:
```
Ruth Adeyemi: A pretext call: a believable reason to ask, and enough held facts to pass his checks. The desk phone's in Operations.
```
Proposed:
```
Ruth Adeyemi: Ring the desk as her buddy. Know her name and team before you dial. Push too hard and Dev flags you to his manager.
```
**Why:** cycle 1 item 28 cut "held facts" from the phone as design-doc language, but this copy survived.
The first line of `topic_hard` already names the "pretext call". Telling the student what pushing costs
gives the influence bar a stake before the call starts.

---

### 10. The legal line trails off
**File:** `ink/fairbairn.ink`, knot `sign`, line 51.

Current:
```
Ruth Adeyemi: That signature is the difference between a test and a crime. Without it, this is the Computer Misuse Act. Same goes elsewhere.
```
Proposed:
```
Ruth Adeyemi: That signature is the difference between a test and a crime. Without it, this is an offence under the Computer Misuse Act. Most countries have one like it.
```
**Why:** "this is the Computer Misuse Act" says the act is the law, not that the act breaks it. "Same goes
elsewhere" is vague. This is the only place the law is stated (PLAN §6), so it should be exact.

---

### 11. The bank-change phish arrives before the invoice it hijacks
**File:** `scenario.json.erb`, `triageSets[0].messages[supplier_bank_change]` and `[vendor_invoice]`.

Current: `supplier_bank_change` at 09:25 refers to "invoice 4471". The real invoice 4471 arrives at
10:00. The body says "Pay ... to the new account below", but nothing is below.

Proposed: set `vendor_invoice.time` to `"09:25"` and `supplier_bank_change.time` to `"10:05"`, with
body:
```
"Following our invoice 4471 this morning, please note our bank details have changed. Pay to the account below from today.\n\nSort code 00-11-22\nAccount 12345678\n\nOffice Supplies Co"
```
**Why:** this kind of fraud rides on a real invoice that has just arrived. That's the lesson, and it is
how the Ledgerwell near-miss would have worked. A sharp student will notice a phish quoting an invoice
that hasn't been sent yet, and the empty "below" reads as a bug. The sort code and account number are
obviously fictional.

---

### 12. Pierce's `ownFrom` hint, claimed in the build log, isn't there
**File:** `scenario.json.erb`, `phishTargets[pierce].hintsByFactor.senderTrust`.

Current: `{ "spoof": ..., "forced": ... }`. SE_BUILD_LOG Fix round 5 Part A says "Pierce's
`senderTrust` hint gained the `ownFrom` rung". `phish-rules.js:375` falls back to `spoof` when
`ownFrom` is missing, so nothing breaks.

Proposed: add
```
"ownFrom": "You're still sending as yourself. Change the From line to someone she trusts in Finance."
```
**Why:** the spoof text ("The From line is a label you can set") is close, but a student on the guest
account who left From as "Consultant" needs to hear what they did wrong. The orchestrator should also
correct the log, or find the change if it went somewhere else.

---

### 13. Dev says "slow down", then chats as if nothing's wrong
**File:** `ink/dev_service_desk.ink`, knot `reaction` (lines 76-86).

Current at band 1 with urgency: "Okay. Slow down a sec for me." then "Aw, first payslip's always a faff.
She'll be fine, they're never late."

Proposed:
```
{ band == 1:
    { said == "urgent_payslip" or said == "name_drop_manager":
        Dev: Okay, slow down a sec. I still need to check who she is.
        -> desk
    }
    Dev: Okay. Slow down a sec for me.
}
```
**Why:** the bar says wary while the voice says relaxed, so the student gets two signals at once. Cycle
1 item 7 wanted Dev's mood to be heard as well as seen. This finishes the job for the two pressure
techniques.

---

### 14. Both of Dev's answers use the same frame
**File:** `ink/dev_service_desk.ink`, knot `ask_reaction`, line 105.

Current:
```
Dev: Course. Payslips go out Monday the 6th this month. There you go.
```
(and the portal answer: "Course. It's LedgerPay... There you go.")

Proposed:
```
Dev: Monday the 6th. Tell her not to spend it all at once.
```
**Why:** most students ask both questions in one call, so "Course... There you go." plays twice in a
row. A joke shows how relaxed he is at the moment he gives away the date, which is the finding.

---

### 15. Fairbairn's "every one of them" points at the years
**File:** `ink/fairbairn.ink`, knot `start`, line 22.

Current:
```
Gareth Fairbairn: We weren't introduced properly. Gareth. Forty years I've had this firm, and every one of them is out there.
```
Proposed:
```
Gareth Fairbairn: We weren't introduced properly. Gareth. Forty years I've had this firm, and I hired most of that floor myself.
```
**Why:** the nearest plural is "forty years", so the line says the years are out there. The new one
keeps the warmth cycle 1 item 32 wanted, and it reads clearly aloud.

---

### 16. Ruth's opening: "Grab the sheet", "for real", "first"
**File:** `ink/ruth.ink`, knot `start`, lines 58 and 60.

Current:
```
Ruth Adeyemi: Morning. Ruth Adeyemi, I'm leading the Ledgerwell job and you're with me today. Grab the sheet.
Ruth Adeyemi: He isn't angry at her. He's scared it happens for real. We find out how bad it would get, first.
```
Proposed:
```
Ruth Adeyemi: Morning. Ruth Adeyemi, I'm leading the Ledgerwell job and you're with me today.
Ruth Adeyemi: He isn't angry at her. He's scared the next one gets through. We find out how far it would get before a real one does.
```
**Why:** the sheet can't be taken (`roe_sheet` is not takeable), and `brief_close` sends the student to
the board anyway. "It happens for real" is odd when it nearly did. "First" after a comma trails off at
the end of the hook.

---

### 17. "The line's private" reads as the From line
**File:** `ink/tomasz.ink`, knot `debrief`, line 80.

Current:
```
Tomasz: Here's what it showed. An open inbox trusts anyone. A From line is just a label. And a padlock only means the line's private.
```
Proposed:
```
Tomasz: Here's what it showed. An open inbox trusts anyone, a From line is just a label, and a padlock only tells you nobody's listening in.
```
**Why:** "line" comes straight after "From line", so a listener hears that the From line is private. One
sentence instead of four short ones also breaks the clipped rhythm.

---

### 18. Tomasz doesn't say which half is left
**File:** `ink/tomasz.ink`, knot `hub`, line 47.

Current: `Tomasz: Come back when you've finished the exercise. Both halves.`
Proposed:
```
- triage_pass:
    Tomasz: Inbox done. The board's the other half.
- profile_done:
    Tomasz: Fixes picked. Now the inbox.
- else:
    Tomasz: Come back when you've finished the exercise. Both halves.
```
**Why:** a student who has done one half hears a line that suggests they've done neither.

---

### 19. "On Fridays" is wrong, not just a wording choice (cycle 1 skipped this)
**File:** `scenario.json.erb`, `intelFacts.pierce_expects_balance_sheet.text`;
`intelBoard.readinessSlots.pierce[2].doneString`.

Current: "Melanie expects a Q3 balance sheet from Jed on Fridays." / "She expects a Q3 balance sheet from
Jed on Fridays."
Proposed: "...from Jed on Friday." in both.
**Why:** a Q3 balance sheet comes once a quarter. The source note says one Friday ("I'll send Mel the Q3
balance sheet on Friday"), and `primedFor.story` says "on a Friday". The board shows the plural to every
student.

---

### 20. Jed's genuine mail says it went via the list, but the header doesn't show one
**File:** `scenario.json.erb`, `triageSets[0].messages[fwd_balance_sheet].to`.

Current: `"to": "m.pierce@ledgerwell.example"` with body "Sent via the finance list" and an auth summary
explaining the SPF fail by list re-sending.
Proposed: `"to": "finance@ledgerwell.example"`.
**Why:** this message exists to teach reading headers. If the header shows a direct send, the "mailing
list" explanation for the SPF fail has nothing to back it up.

---

### 21. Ruth's last phone rung still says Gareth's line before he does
**File:** `ink/ruth_phone.ink`, knot `stage_done`, line 208.

Current:
```
Ruth Adeyemi: He's read your report — no names, just like he asked. A word by the window wouldn't go amiss.
```
Proposed:
```
Ruth Adeyemi: He's read your report. Go and hear what he thinks, by the window.
```
**Why:** cycle 1 item 31 stopped the key line from taking Fairbairn's payoff. This rung still does,
almost word for word ("Not one name in it, just like I asked").

---

### 22. The "X, not Y" reasons cluster in the plan and defender cards
**Files:** `scenario.json.erb` `engagement.plan.objectives[*].why`,
`engagement.defender.factMitigations[*].options[*].why`, `phishTargets[lord].hintsByFactor.senderTrust`;
`ink/ruth.ink` `topic_report` line 236.

| Path | Current | Proposed |
|------|---------|----------|
| `objectives[disrupt_payroll].why` | The rules of engagement bar disruption; this is a test, not an attack. | The rules of engagement bar disruption. Ledgerwell asked how far an attack gets, and payroll still has to run. |
| `objectives[collect_passwords].why` | The engagement keeps nobody's password; a captured sign-in is simulated and reported, not stored. | The engagement keeps nobody's password. A captured sign-in is simulated, reported and dropped. |
| `options[stop_publishing].why` | Ledgerwell needs to publish; the fix is to clean metadata, not to go silent. | Ledgerwell needs to publish. Clean the metadata and the documents stay up without the username. |
| `options[close_inbox].why` | Careers needs to receive CVs; the fix is filtering, not closing. | Careers still needs CVs. A filter keeps the inbox open and drops the bad ones. |
| `lord.hintsByFactor.senderTrust` | ...Send as that, not as a person. | She only trusts the portal's own notification address. Put that in the From line. |
| `ruth.ink topic_report` 236 | Blaming staff just teaches them to stop reporting. Name the gap and how to close it. | Write each one so the person it happened to could read it. Name the gap and how to close it. |

**Why:** the ink is down to three slogans, but these cards are read one after another, so the pattern
shows in clusters. The `topic_report` change takes one of the seven "blame stops reporting" lines and
replaces it with something a consultant would say to a junior.

---

### 23. Mission card: "a week" against one morning, and the agreement doesn't say "no names"
**File:** `scenarios/lab_social_engineering/mission.json`, `description` (outside the ink and
`scenario.json.erb`, but players see it).

Current: "A week on the job at Tarnside Assurance... inside a written agreement that says nobody gets
named and shamed."
Proposed: "A day on the job at Tarnside Assurance... for a client whose one condition is that nobody gets
named and shamed."
**Why:** the game clock starts on Monday at 08:00 and Ruth says "you're with me today". The rules of
engagement don't contain a no-names rule (none of the scope cards does). It is Fairbairn's spoken
condition, and that is better, because he says it in person.

---

### 24. Give Sofia's landing a moment of weight
**File:** `ink/lord_mail.ink`, knot `on_email`, line 34.

Current:
```
Sofia Lord: Oh, the payslip — I've been waiting for this. Logging in now.
```
Proposed:
```
Sofia Lord: Oh, my first payslip! I've been waiting for this. Logging in now.
```
**Why:** her post said "Sorting my first payslip on the staff portal. Grown up now." The callback makes
the student feel who they just caught. The lab's no-blame argument works better when the person on the
other end feels real.

---

### 25. Two phone rungs still use design-doc words
**File:** `ink/ruth_phone.ink`, `stage2` line 104 and `stage5` line 154.

| Knot | Current | Proposed |
|------|---------|----------|
| stage2 "I can't work out the username pattern." | Open the published PDF and read its properties — who made it, and how. That's the gate. | Open the published PDF and read its properties. The author field gives the username pattern away. |
| stage5 opener | Now Sofia. She needs all three call facts to bite. | Now Sofia. She'll want the right sender, the portal's name and the date. |

**Why:** "the gate" and "call facts" are the plan's words, not Ruth's. Students need to know what the
three things are.

---

### 26. "Lands" is defined with "replied", which every target does
**File:** `ink/ruth.ink`, knot `hub`, line 173.

Current:
```
Ruth Adeyemi: A message lands when they'd act on it. Opened, clicked, replied. Not just delivered.
```
Proposed:
```
Ruth Adeyemi: Delivered isn't landed. It lands when they'd open the file or click the link, the way they would a real one.
```
**Why:** Melanie and Sofia reply to every send, including the misses, so "replied" points the student
the wrong way. The three-word list followed by "Not just" is also an AI rhythm tell.

---

### 27. The repair tell repeats the candour tell
**File:** `scenario.json.erb`, `pretextNpcs[0].tells.repair`.

Current: "Corrected. Owning the slip early costs less than defending it." Next to the technique tell
`candour`: "Candour. Owning a correction early costs less than defending it."
Proposed: `"repair": "Corrected. Dev now has Finance, the team on his record."`
**Why:** if both show on a repair turn, the panel says the same sentence twice. If only one shows, the
new line still tells the student what changed. (Check in a playtest whether both render.)

---

### 28. Fairbairn's goodbye goes stale
**File:** `ink/fairbairn.ink`, knot `hub`, line 44.

Current: `Gareth Fairbairn: Aye. Mind the sheet.` (every visit, including after the report)
Proposed:
```
{ roe_signed:
    Gareth Fairbairn: Aye. Go gently with them.
- else:
    Gareth Fairbairn: Aye. Mind the sheet.
}
```
**Why:** "Mind the sheet" after the work is done reads as a leftover. "Go gently with them" keeps him
protective of his staff, which is his whole character.

---

### 29. Typo-squat terminology (cycle 1 left this to the builder's owner)
**File:** `scenario.json.erb`, `conceptCards[typo-squat]` and `landingPages[0].brands[0].domains`.

Current: the card calls `ledgervvell.example` (vv for w) a typo-squat, and the menu labels
`ledgerwall.example` "wrong-letter".
Proposed: put it to the page builder's owner (Phase 5, Haiku agents). Common usage calls a misspelling
like `ledgerwall` a typo-squat, and `vv` for `w` a look-alike or visual spoof. Swapping the card's
example to `ledgerwall.example` and retitling the `vv` tier "Look-alike letters" would match how
students will meet the terms elsewhere.
**Why:** a Cyber Security student will repeat these terms in a report, so they should be the standard
ones.

---

### 30. "Summer rota" in a March newsletter
**File:** `scenario.json.erb`, `triageSets[0].messages[newsletter].body`.

Current: "This month: the summer rota, a new starter in Finance, and the charity bake sale."
Proposed: "This month: the Easter rota, a new starter in Finance, and the charity bake sale."
**Why:** a small slip, but the triage is about reading carefully, and the date is in the subject line.

---

## Checked and fine

- LedgerPay is consistent across Dev's line, `lord_portal_name`, `lord_trusts_portal_sender`,
  `people[portal].forms.full`, `w_formal` and the Lord hints. "Staff portal" remains only where it should
  (Sofia's post, which doesn't name it, and generic `ifTrusted` text).
- The Tomasz `own_mail` reveal is gated on `triage_done` and reads as a reveal.
- Dev's repair choice appears only after an Accounts slip, and the `reported` goodbye is no longer doubled.
- `fwd_balance_sheet` now teaches the right lesson, apart from the To line (item 20).
- Ink "X, not Y" count: three, the three cycle 1 chose to keep.
- Fairbairn's opening exchange and his "Then promise me that one" make the first minute a conversation.
- The end screen line ("Gareth keeps his staff, and his staff keep reporting.") still works as the final
  word, especially if item 5 stops Tomasz saying it first.
