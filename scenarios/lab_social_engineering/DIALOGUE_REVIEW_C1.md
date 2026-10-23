# Dialogue and teaching review, design cycle 1 (`lab_social_engineering`)

Read-only review of `ink/*.ink` and the player-facing text in `scenario.json.erb` (objectives, target
replies and checklist strings, hints, board, report, triage, scope and plan cards). Written 2026-10-22
against the tree as it stands after commit 7f1c0f78. Kind of game: a lab game (education first,
browser-only, no combat, fictional firms). The bar is a high-quality, fun and educational game.

No audio exists for this lab yet (PLAN §3: audio waits for Phase 8), so the spoken-line rewrites below
cost nothing in TTS today. Line limits from the ink headers are kept: person lines under 30 words,
phone lines under 25, choice labels under 15.

## Verdict in brief

The bones are good. Ruth, Fairbairn and Tomasz each have a recognisable register, the target replies
give sensible in-character reasons, and the no-blame thread runs from the opening to the end screen.
The biggest problems are continuity and payoff, not voice:

- Tomasz's hub gives away the "your own mail comes back" reveal before the student has opened the
  triage (item 1).
- Fairbairn says he has signed before he signs, and his "no names" scene can be skipped entirely,
  which takes the through-line's set-up with it (items 2 and 3).
- The law is never named. The Computer Misuse Act is planned for stage 0 but appears in no line (item 4).
- One genuine triage message teaches the wrong lesson (item 5). Dev never says the portal's name, though
  Ruth tells the student to get it from him (item 6), and he sounds the same whether he is calm or
  about to report you (item 7).
- The opening hook (a spoofed supplier invoice) is never paid off (item 11).

Pacing is mostly fine. The heaviest reading falls in the closing debrief, a seven-line monologue with no
choice in it (item 13). Voice drifts towards AI-sounding prose in one place: the "X, not Y" slogan
comes back about a dozen times (item 30).

## Ranked changes

Ranked by impact on the student's experience. Each gives file and location, current text, proposed
text, and why.

---

### 1. Tomasz gives away the second through-line before the triage
**File:** `ink/tomasz.ink`, knot `hub`, choice at line 50; knot `own_mail`.

Current:
```
+ {not explained_own} [Some of these messages look familiar.]
```
The choice shows from the first meeting, before the student has opened the triage workstation. PLAN §5
through-line 2 says "Tomasz says nothing about it in his briefing; the student finds them."

Proposed: gate on the triage having been run, and make his answer land as a reveal, not an instruction.
```
VAR triage_done = false
...
+ {triage_done and not explained_own} [Two of those emails were mine.]
    -> own_mail

=== own_mail ===
~ explained_own = true
Tomasz: I wondered when you'd notice. Melanie's and Sofia's, straight out of your outbox.
Tomasz: Bit different reading them from this side, isn't it? The headers had you the whole time.
```
**Why:** this is the moment the attacker reads their own work as a defender, the game's best twist.
Offering it as a menu option beforehand spoils it. `triage_done` is already a declared global.

---

### 2. Fairbairn says he has signed before he signs
**File:** `ink/ruth.ink`, knot `start`, line 62.

Current:
```
Gareth Fairbairn: Good answer. That's the only reason I signed.
```
Later (`fairbairn.ink` `sign`) he says "Right. I'll sign it." and the narrator has him sign. The kickoff
mail ("Ledgerwell have signed") and the RoE object's observations ("The signed rules of engagement")
add to the muddle.

Proposed:
```
Gareth Fairbairn: Good answer. Show me you've read that sheet properly and I'll put my name to it.
```
Also: kickoff mail body becomes "Ledgerwell want to go ahead. Read the sheet with Gareth before you do
anything, and keep me posted." The `roe_sheet` observations become "The rules of engagement for the
Ledgerwell job, waiting for Gareth's signature."
**Why:** the signing is the ethics gate of stage 0. If it has already happened, the scope task feels
like paperwork, not permission.

---

### 3. Fairbairn's "no names" scene can be missed
**Files:** `ink/ruth.ink` knot `hub` (line 162-163); `ink/fairbairn.ink` knot `sign`.

Current: the scene plays only if the student walks over and talks to Fairbairn after `roe_signed`.
Ruth's in-person line at that point is:
```
Ruth Adeyemi: Now tell me what you'll actually do. The whiteboard.
```
Only the phone (stage 1, second-level rung) points at him.

Proposed: set a global in the scene and have Ruth send the student there until it is heard.
```
// fairbairn.ink, sign
#set_global:fairbairn_condition_heard:true

// ruth.ink hub, replace the `not plan_done` branch with two
- not plan_done and not fairbairn_condition_heard:
    Ruth Adeyemi: That's it done. Take it to Gareth by the window. He'll want to sign it himself.
- not plan_done:
    Ruth Adeyemi: Now tell me what you'll actually do. The whiteboard.
```
Declare `fairbairn_condition_heard` in `globalVariables` and in both ink files.
**Why:** through-line 1 is set up here. The blame options in the plan, the report and the debrief all
quote "Gareth's one rule". A student who never heard it gets the payoffs without the set-up.

---

### 4. The law is never named
**File:** `ink/fairbairn.ink`, knot `sign` (after line 50); `ink/ruth.ink` knot `topic_scope`.

Current: the only legal line is optional (`topic_scope`): "The same acts without it are offences, not
tests." PLAN §5 stage 0 says "Ruth adds the legal line once, plainly". Nothing names the Act.

Proposed (in the sign scene, so every student hears it once):
```
Ruth Adeyemi: That signature is the difference between a test and a crime. Without it, this is the Computer Misuse Act. Same goes elsewhere.
```
`topic_scope` first line:
```
Ruth Adeyemi: Only what that sheet signs off. Step outside it and you're not testing any more, you're breaking the law.
```
**Why:** outcome 1 is that authorisation is what makes this legal. A Cyber Security student should
leave able to name the Act. Saying it once, at the moment of signing, keeps it from turning into a
lecture.

---

### 5. The genuine forwarded email teaches the wrong lesson
**File:** `scenario.json.erb`, `social.triageSets[0].messages[id=fwd_balance_sheet]`.

Current:
```
"subject": "Fwd: Q3 balance sheet",
"body": "Mel, here's the Q3 balance sheet, forwarded from my home account as the office one was down.\n\nJed",
```
with `from: j.baker@ledgerwell.example`, DKIM pass and aligned, no attachment.

Problems: "sent from my home account because the office one is down" is a textbook phishing excuse,
so a well-taught student marks it as a phish and is told they were wrong. A home account also could
not carry Ledgerwell's aligned DKIM signature. The body offers a balance sheet but nothing is attached.

Proposed:
```
"subject": "Q3 balance sheet",
"body": "Mel, Q3 balance sheet as promised. I've sent it via the finance list so Priya gets a copy too.\n\nJed",
"attachments": [ { "id": "q3", "label": "Q3-balance-sheet.xlsx", "kind": "spreadsheet" } ],
"auth": { ..., "summary": "SPF failed because the finance list re-sent it from its own server, but Jed's DKIM signature survived and aligns, so DMARC passed. This is normal for mailing lists." }
"whyFine.default": "Same story as the one you spoofed, but this one carries Jed's real signature. The headers are the difference."
```
**Why:** it puts the student's fake next to the real one, and the difference is the lesson of stage 7.
It also stops penalising a student for spotting a real red flag.

---

### 6. Dev never names the portal, though Ruth says he will
**Files:** `ink/dev_service_desk.ink` `ask_reaction` (line 82); `scenario.json.erb`
`intelFacts.lord_portal_name`, `social.people[id=portal].forms.full`,
`landingPages[0].wordings[w_formal].text`; `ink/ruth_phone.ink` stage4 (line 139).

Current:
```
Dev: Course. It's the staff portal, notices come from the payroll address. There you go.
```
Ruth's rung: "Get the portal's name off him." The fact's label is "the staff portal", and the lead-in
fact says "the post doesn't name it".

Proposed (a fictional name; "LedgerPay" used here as a placeholder):
```
Dev: Course. It's LedgerPay. Notices come from payroll-notices at our domain, same as every month. There you go.
```
- `lord_portal_name.text`: "The payroll portal is called LedgerPay." `provides[0].label`: "LedgerPay".
- `people[portal].forms.full`: "LedgerPay".
- `w_formal`: "Your payslip is ready. Sign in to LedgerPay to view it."

**Why:** the call is worth making because it gets something the public sources could not. If the
reward is "the staff portal", which the student already knew, elicitation feels like nothing happened.
A real name also makes Sofia's landing believable. This reopens the "no change" decision logged in
`playtests/FIX_ROUND_R1.md` line 37 (R2 F4), so the orchestrator should log the reversal.

---

### 7. Dev sounds the same whether he is calm or about to report you
**File:** `ink/dev_service_desk.ink`, knot `reaction(band)`.

Current: the only band check is `band >= 3` (reported). Under that, the reaction branches on
`pretext_team_value`, which `fillPretextVars` writes once from the prepared card
(`person-chat-pretext.js:409-418`). So after the opener, every later line (urgency, the manager
name-drop, the repair) gets the same answer again: "Finance, lovely. New intern — that'll be Sofia.
What's she after?"

Proposed: react to the band first, give each technique its own line, and make the team reaction once
only.
```
VAR team_checked = false

=== reaction(band, said) ===
{ band >= 3:
    Dev: Sorry, I'm going to stop you there. I'll run this past my manager first.
    -> END
}
{ band == 2:
    Dev: Look, I'm not doing anything else on this call without checking who you are.
    -> desk
}
{ band == 1:
    Dev: Okay. Slow down a sec for me.
}
{ said == "urgent_payslip":
    Dev: Aw, first payslip's always a faff. She'll be fine, they're never late.
    -> desk
}
{ said == "name_drop_manager":
    Dev: Did they? Nobody's told me. I still go by the list, mind.
    -> desk
}
{ not team_checked:
    ~ team_checked = true
    { pretext_team_value:
    - "finance": Dev: Finance, lovely. New intern, that'll be Sofia. What's she after?
    - "accounts": Dev: Accounts? We folded Accounts into Finance a couple of years back. Who is she?
    - else: Dev: Right, bear with me a sec.
    }
}
-> desk
```
Call sites pass the id: `-> reaction(pretext_say("urgent_payslip"), "urgent_payslip")`. If the repair
line succeeds, reset `team_checked` so the corrected team gets its "Finance, lovely" reply.
**Why:** the influence meter is meant to be felt as well as read. When a student pushes urgency, Dev
cooling off in words teaches the technique better than a number on the bar. The Accounts line also
tells the student, in Dev's voice, why their 2019 org-chart fact was stale. That turns the trap into
teaching. Fixed strings only, so the TTS rule holds.

---

### 8. The repair line is offered before there is anything to repair
**File:** `ink/dev_service_desk.ink`, knot `desk`, line 47.

Current:
```
+ [Sorry, she's in {pretext_team_name} — I should have said.]
```
It shows on the first menu. It also fills from the same prepared blank as the opener, so after an
"Accounts" opener it reads "Sorry, she's in Accounts".

Proposed: show it only after a wrong team, and confirm with the pretext-prep owner which value the
repair blank carries.
```
+ { pretext_team_value == "accounts" and team_checked } [Sorry, my mistake. She's in Finance.]
```
**Why:** an apology shown before any slip makes no sense on screen and gives away that a slip is
possible. The tells panel already teaches candour ("Owning the slip early costs less"), so the choice
needs to appear at the moment it applies.

---

### 9. The reason for the throwaway address sounds like dodging accountability
**Files:** `ink/ruth.ink` `topic_account` (line 215); `ink/ruth_phone.ink` stage3 (line 115);
`scenario.json.erb` objective `test_account` title.

Current:
```
Ruth Adeyemi: So nothing you send comes back to Tarnside. Create the address in the mail client first.
```
Task title: "Set up an address to send from".

Proposed:
```
Ruth Adeyemi: Testers send from separate kit, so Tarnside's real domain never lands on a blocklist. It's all still logged against the job.
```
Phone: "Make a throwaway address first. Test mail never goes out from Tarnside's real domain."
Task title: "Create a throwaway test address in the mail client".
**Why:** in an authorised test nothing is hidden from the client. Everything is logged (the seeded
"welcome" mail says so). "So nothing comes back to us" teaches the attacker's motive, not the tester's,
in a lab that is otherwise careful about ethics. The task title also fixes the gap noted in F11-F17
line 116: the current one doesn't say "throwaway".

---

### 10. Melanie's hint jumps straight to the answer and misses the likeliest mistake
**File:** `ink/ruth_phone.ink`, knot `stage3`, line 120-122.

Current:
```
+ [Melanie keeps refusing.]
    Ruth Adeyemi: Borrow Jed's name — she trusts him. The From line is only a label you can set.
```
PLAN §4 says the last rung must name the freemail-can't-spoof turn. No rung does.

Proposed: two rungs.
```
+ {not phish_pierce_landed} [Melanie keeps refusing.]
    Ruth Adeyemi: Who would she open a file from without thinking? Your recon says.
    -> stage3
+ {not phish_pierce_landed} [I'm sending as Jed and she still says no.]
    Ruth Adeyemi: Freemail can only send as itself. Switch to the guest account, then set Jed in the From line.
    -> stage3
```
**Why:** spoofing a trusted sender is the main idea of round 2. A nudge lets the student work it out.
Sending from freemail is the most common wrong turn (PLAN §4), and with no rung for it a student can
loop.

---

### 11. The opening's spoofed invoice is never paid off
**Files:** `scenario.json.erb` `triageSets[0].messages` (replace `parcel_zip`); `ink/tomasz.ink`
`debrief`.

Current: Ruth opens with "nearly wired a five-figure invoice to a spoofed supplier". Nothing in the
eight triage messages or the debrief comes back to it. `parcel_zip` is a generic delivery scam.

Proposed: replace `parcel_zip` with a supplier bank-change message.
```
{ "id": "supplier_bank_change",
  "from": { "name": "Office Supplies Co", "address": "accounts@office-suppiies.example" },
  "to": "accounts@ledgerwell.example",
  "subject": "Updated bank details for invoice 4471",
  "body": "Please note our bank details have changed. Pay invoice 4471 to the new account below from today.\n\nOffice Supplies Co",
  "auth": { "spf": "pass", "dkim": "pass", "dmarc": "pass" },
  "truth": { "isPhish": true, "flags": ["senderTrust", "urgencyCalibrated"],
    "perFlagNote": { "senderTrust": "office-suppiies.example: an i where the l should be. It passes every check because the look-alike domain really sent it.",
                     "urgencyCalibrated": "'From today' is there to get it paid before anyone rings the supplier." },
    "ifTrusted": "The next payment would go to the attacker. This is how Ledgerwell nearly lost a month's billing.",
    "reportReply": "Thanks. Reported, and Finance have rung the supplier on the number we hold." } }
```
Tomasz line in the debrief, after the opening recap:
```
Tomasz: And that bank-change email? That's the one that nearly got Gareth last quarter. Ring the supplier on a number you already hold.
```
**Why:** it pays off the hook that opened the game. It sits next to the genuine `vendor_invoice` from
the same supplier, a good contrast, and it teaches business email compromise, the most expensive kind
of phishing for a small finance firm. The message count stays at eight. The `senderTrust` flag id and
the look-alike note need checking against the triage chip set.

---

### 12. "A padlock proves nothing" is wrong
**File:** `ink/tomasz.ink`, knot `debrief`, line 74.

Current:
```
Tomasz: Here's what it showed. An open inbox trusts anyone, a From line is just a label, and a padlock proves nothing.
```
Proposed:
```
Tomasz: Here's what it showed. An open inbox trusts anyone. A From line is just a label. And a padlock only means the line's private.
```
**Why:** the padlock concept card gets it right ("the connection is private, not that the site is who
it claims to be"). Telling students that HTTPS proves nothing is a misconception they would then take
to their own users.

---

### 13. The debrief is a monologue with no choice in it
**File:** `ink/tomasz.ink`, knot `debrief`.

Current: up to seven Tomasz lines in a row, then the end screen. The student only reads.

Proposed: after the recap, one reflective choice with no gate, then the close.
```
Tomasz: If you could fix one thing here tomorrow, what would it be?
+ [A call-back rule on the service desk.]
    Tomasz: Cheapest fix on the list, and it would have stopped Sofia's whole chain. Good pick.
+ [DMARC off p=none, and an external-sender banner.]
    Tomasz: That kills the Jed spoof outright. It takes a month of testing first, but yes.
+ [A report button, so people tell us.]
    Tomasz: That's the one I'd pick. Everything else only works if people tell us when they've slipped.
- Tomasz: Right. Whichever it is, the report names nobody.
```
**Why:** it turns the end into a decision the student makes and defends, which is the reflection the
lab sheet will want later. All three answers are good ones, so nobody is marked wrong at the finish
line. Each reply teaches a trade-off.

---

### 14. The debrief recap misses findings, has a gap and overclaims
**File:** `ink/tomasz.ink`, knot `debrief`, lines 75-86.

Current problems:
- "So we route the open inbox through a gateway, strip document metadata, and give the desk that
  call-back script." This leaves out the DMARC/banner control and the bookmarked portal and report
  button, two of the three report findings.
- No Dev line plays when the latest call's outcome is `walked_away` (for example a second call that
  got the date and then hung up).
- "it beats careful people every time" overclaims.

Proposed:
```
{ phish_pierce_attempts == 1:
    Tomasz: Melanie first try. A borrowed name gets past a lot of careful people.
}
{
- dev_reported: (keep)
- pretext_service_desk_call_outcome == "got_it" and pretext_service_desk_call_lowest >= 0: (keep)
- pretext_service_desk_call_outcome == "got_it": (keep)
- else:
    Tomasz: And Dev gave you enough to write Sofia's email. A call-back to a number on file stops every line of that.
}
Tomasz: So: DMARC to enforcement, a banner on outside mail, metadata stripped, a call-back script for the desk.
Tomasz: And a bookmarked portal with a report button, so anyone can check before they type a password.
```
**Why:** the debrief should repeat back the controls the student just chose in the report. When it
drops two of them, the report looks like it didn't count. The fallback line means no student who
finished the call hears nothing about it.

---

### 15. Sofia's landing, the hardest win, gets no reaction
**File:** `ink/ruth.ink`, knot `hub`, branch `phish_lord_landed and not report_filed` (line 170-171).

Current:
```
Ruth Adeyemi: That's the sending done. Write it up at the report desk. Processes, not people.
```
Proposed:
```
Ruth Adeyemi: Sofia checked the sender, her name and the date. All three were right, because Ledgerwell's own desk gave them to us. That's your finding.
```
(`topic_report` keeps the "Processes" advice.)
**Why:** this is the reveal of through-line 3. The careful person was beaten by information her own
service desk handed out. Saying it here, before the report, points the student at finding 2's root
cause without giving them the answer card.

---

### 16. The correction to the wrong opening answer doesn't say what is wrong
**File:** `ink/ruth.ink`, knot `start`, lines 64-66.

Current:
```
+ [Don't worry, nobody will ever know it was them.]
    Ruth Adeyemi: Careful. That's the promise a bad report breaks. We name no one, ever.
```
Fairbairn says nothing back.

Proposed:
```
+ [Don't worry, nobody will ever know it was them.]
    Ruth Adeyemi: Careful. We can't promise nobody finds out. Logs exist. We can promise the report blames no one.
    Gareth Fairbairn: Then promise me that one.
```
**Why:** the real lesson is the difference between secrecy (which a tester can't promise) and no
blame (which they can). The current line points at the gap without naming it. Fairbairn's half-line
makes it a conversation, and it sets up his condition.

---

### 17. "On loan to me from Tarnside": Ruth is Tarnside
**File:** `ink/ruth.ink`, knot `start`, line 57.

Current:
```
Ruth Adeyemi: Morning. Ruth Adeyemi, I run engagements here. You're on loan to me from Tarnside for this one. Grab the sheet.
```
PLAN §3: Ruth is the Tarnside engagement lead, and the player is a junior Tarnside consultant. "Here"
reads as Ledgerwell's office.

Proposed:
```
Ruth Adeyemi: Morning. Ruth Adeyemi, I'm leading the Ledgerwell job and you're with me today. Grab the sheet.
```
**Why:** the first line of the game shouldn't confuse who works for whom. The test only makes sense if
the student knows Tarnside is the outside firm.

---

### 18. A wrong plan answer misses the best measure there is
**File:** `scenario.json.erb`, `engagement.plan.measures[id=did_staff_report].why`.

Current:
```
"A live test would measure this; this lab cannot observe it, so do not plan around it."
```
Proposed:
```
"Reporting rate is the best measure there is, but Ledgerwell has no report button yet, so there is nothing to count. That gap goes in the report as a finding."
```
**Why:** it keeps the fiction (no "this lab"), it teaches that reporting rate is the measure that
matters most in phishing programmes, and it sets up finding 3's report-button control.

---

### 19. Other plan and objective reasons break the fiction
**File:** `scenario.json.erb`, `engagement.plan`.

| Path | Current | Proposed |
|------|---------|----------|
| `measures[passwords_collected].why` | The lab records that a sign-in was submitted, never what was submitted. | We record that a sign-in happened, never what was typed. No password leaves the test. |
| `measures[how_far].why` | These are measures the lab can record and that point at process gaps. | Each one points at a step in a process that could have stopped it. |
| `measures[names].why` | Naming people suppresses reporting; the report is about process, not blame. | Gareth's one rule. Name people and they stop reporting. |

**Why:** the rest of the game stays in the world of a consultancy job. "The lab" breaks that at the
moment the student is meant to be planning like a professional. The `names` reason also pays off item 3.

---

### 20. Ruth's objective hint doesn't match the right answer and leans towards blame
**File:** `ink/ruth_phone.ink`, knot `stage1`, line 81.

Current:
```
Ruth Adeyemi: The one that matches the brief: test whether staff can be led into a mistake.
```
The correct card reads "Find how far email and a phone pretext get against Ledgerwell's staff, and
report the gaps."

Proposed:
```
Ruth Adeyemi: The one that ends in a report of the gaps. Nothing broken, nobody's password kept.
```
**Why:** "whether staff can be led into a mistake" is the people-blaming framing the next pick warns
against. The hint should rule the two wrong cards out by what they do.

---

### 21. The techniques are seldom named
**Files:** `ink/ruth.ink` knot `keys` (lines 140, 145) and `topic_hard`.

Current: Ruth never says "OSINT", "spear-phishing" or "pretext" aloud. They show only in object names
and the scenario brief.

Proposed:
- Recon key: "Plan holds up. Here's the Recon key. Open-source intelligence only: what anyone could find, nothing behind a login."
- Operations key: "Good. Everything you've got there was public. That's a finding before we've sent a thing. Operations is yours."
- `topic_hard` first line: "That's a pretext call. Have a believable reason to ask, and know enough to pass his checks."

**Why:** each stage should name its concept plainly once, so a student can write it up afterwards.
The Operations line also turns "OSINT done" into a small reveal: the attack surface was already public.

---

### 22. "Land" is never explained
**Files:** `scenario.json.erb` aim `phish_easy` description; `ink/ruth.ink` hub branch for stage 3
(line 164-165).

Current aim description: "Land a message on Careers and on Melanie Pierce in Finance."

Proposed aim description: "Get Careers and then Melanie Pierce to act on a message: open the file, as
they would a real one." Ruth's stage 3 line, for a student who already has the address (see item 39):
"A message lands when they'd act on it. Opened, clicked, replied. Not just delivered."
**Why:** "landed" is used in seven task titles and descriptions and never defined. The difference
between delivered and acted on is the thing the checklist scores.

---

### 23. The right root-cause reasons just repeat the card
**File:** `scenario.json.erb`, `engagement.report.findings[*].rootCauses[correct=true].why` and
`controls[correct=true].why`.

Current (example):
```
text: "No external-sender banner, and DMARC left at p=none"
why:  "No external-sender banner and DMARC at p=none let a spoof of a colleague through."
```
Proposed:
| Path | Proposed `why` |
|------|----------------|
| `spoofed_colleague.rootCauses[no_banner_dmarc_none]` | p=none tells receivers to deliver mail that fails DMARC, so your j.baker@ spoof arrived looking internal. A banner would at least have marked it as outside mail. |
| `spoofed_colleague.controls[banner_dmarc_enforce]` | Quarantine or reject stops the spoof at the gateway. The banner covers look-alike domains that DMARC can't catch. |
| `service_desk_disclosed.rootCauses[no_verification_script]` | Dev checked what his policy told him to check: a name and a team. Both were on public pages. |
| `service_desk_disclosed.controls[callback_on_file]` | An attacker can fake a name and a team, but not answer a call on the number HR already holds. |
| `lookalike_page.rootCauses[no_way_to_check]` | Sofia had no bookmark to compare against and no button to press if she was unsure. |
| `lookalike_page.controls[bookmark_and_report]` | A bookmark means never following an emailed link to the portal. A report button turns a doubt into a warning for everyone. |

**Why:** a right answer is where teaching sticks. Repeating the card wastes it. The new reasons
explain how each control works.

---

### 24. Finding 3 is written as a guess, though the student did it
**File:** `scenario.json.erb`, `engagement.report.findings[id=lookalike_page].text`.

Current: "A look-alike portal page would convince staff"
Proposed: "Finance signed in on a look-alike portal page"
**Why:** the student landed Sofia through that page. A report states what happened. "Finance", not
"Sofia", keeps it name-free.

---

### 25. The report rung says a cause names Melanie; none does
**File:** `ink/ruth_phone.ink`, knot `stage6`, line 175-176.

Current:
```
+ [One cause names Melanie.]
    Ruth Adeyemi: Don't pick it. Blaming staff just stops them reporting next time. The fix, not the person.
```
The blame options read "Finance staff were careless…", "Dev should not have given anything away" and
"The new intern was too green…".

Proposed:
```
+ [Some of these causes blame someone.]
    Ruth Adeyemi: Those are the wrong ones. Blame someone in writing and the whole floor stops owning up.
```
**Why:** the label should match what is on screen. The rewrite also drops one more "X, not Y" (item 30).

---

### 26. Your own Pierce email: "all fail" is wrong
**File:** `scenario.json.erb`, `triageSets[0].messages[id=own_pierce].notes.perFlagNote.senderAuth`.

Current: "SPF, DKIM and DMARC all fail: the domain did not really send this."
The `guest` account's results are `spf: fail, dkim: none, dmarc: fail`.

Proposed: "SPF fails and there is no DKIM signature at all, so DMARC fails. Ledgerwell's domain never
sent this."
**Why:** "none" and "fail" are different results and the header panel shows the difference. In a
lesson on reading headers, the note has to match the headers.

---

### 27. Tomasz, the defender, never explains the three checks
**File:** `ink/tomasz.ink`, knot `hub`.

Current: only Ruth's phone says "Read the SPF, DKIM and DMARC results", and never says what they are.

Proposed: one optional sticky choice.
```
+ [Remind me what SPF, DKIM and DMARC check.]
    Tomasz: SPF: was this server allowed to send for that domain. DKIM: did that domain sign it, unchanged.
    Tomasz: DMARC: does the From line match a domain that passed, and what to do if not. Ours says "deliver anyway".
    ~ quiet = true
    -> hub
```
**Why:** the triage is pass/fail on these results. A short, plain explanation from the in-house expert,
there when wanted, beats sending the student off to the glossary. The last clause sets up p=none.

---

### 28. Two phone rungs use jargon instead of plain words
**File:** `ink/ruth_phone.ink`, stage7 (line 193) and stage4 (line 142).

| Knot | Current | Proposed |
|------|---------|----------|
| stage7 "One passes every check." | A look-alike can. Consistency isn't trust. Judge whether it should be there at all. | Passing only proves that domain sent it. Read the domain itself, letter by letter. |
| stage4 "Anything else?" | Prepare the call from held facts. Say you're the new intern's buddy. | Know who you're asking about before you ring: her name and her team. Then you're her buddy, helping out. |

**Why:** "consistency isn't trust" and "held facts" are design-doc words. Students need to be told
what to do.

---

### 29. Dev's portal question is oddly worded
**File:** `ink/dev_service_desk.ink`, knot `desk`, line 53.

Current: `[What's the staff portal called, and how do its emails read?]`
Proposed: `[What's the payslip portal called, and who do its emails come from?]`
**Why:** the fact it grants is a sender address (`lord_trusts_portal_sender`). The question should
lead the student to the thing they will type in Sofia's From line.

---

### 30. The "X, not Y" slogan comes back too often
**Files:** across `ruth.ink`, `ruth_phone.ink`, `tomasz.ink`, `fairbairn.ink`, `engagement.*.why`.

Count: "not catching anyone out", "offences, not tests", "the process, not which person", "Processes,
not people", "the fix, not the person" (twice), "a script, not a warning", "Send as that, not as a
person", "a test, not an attack", "filtering, not closing", "clean metadata, not to go silent", "the
gaps in your process, not…". That is about a dozen.

Proposed: keep three. The opening choice, Fairbairn's "my training's fault, not theirs" and Tomasz's
"a script, not a warning" are the through-line beats. Rewrite the rest as plain statements: items 4,
9, 19, 25 and 28 already do some of this. Also `topic_plan` line 203 becomes "Decide that before you
send a thing. Count how far each attempt got. Who fell for it is the one thing we never count."
**Why:** said once, the slogan is the theme. Said a dozen times, it starts to sound written by a
machine and preachy, and students tune out the point.

---

### 31. Ruth's Blue Team key line takes Fairbairn's payoff
**File:** `ink/ruth.ink`, knot `keys`, line 150.

Current:
```
Ruth Adeyemi: Report's filed, and no names in it. Gareth will be glad. Blue Team key — go see Tomasz.
```
Then Fairbairn: "Not one name in it, just like I asked", and Ruth's phone stage7: "not one name in it".
That is the same beat three times inside a minute.

Proposed:
```
Ruth Adeyemi: Report's filed. Gareth's reading it now, go and see his face. Then the Blue Team key: Tomasz has the other half.
```
(phone stage7 "Has Gareth seen the report?" becomes "He's reading it. Go by the window, he wants a word.")
**Why:** let Fairbairn say it. His line is the payoff of the condition he set, and it lands harder if
nobody says it first.

---

### 32. Fairbairn introduces himself twice
**File:** `ink/fairbairn.ink`, knot `start`, line 21.

Current: `Gareth Fairbairn: You'll be Tarnside's. Gareth Fairbairn. This is my firm, forty years of it.`
He has already spoken to the player in Ruth's opening.

Proposed: `Gareth Fairbairn: We weren't introduced properly. Gareth. Forty years I've had this firm, and every one of them is out there.`
**Why:** fixes the continuity and gives him something warm to say about his staff. That makes his
"no names" condition read as protectiveness, not image management.

---

### 33. Pierce and Lord checklist strings mix voices and duplicate the replies
**File:** `scenario.json.erb`, `phishTargets[pierce|lord].factorStrings.*.fail`.

Current: the replies come from ink, in the target's voice ("Sorry, who is this? I don't have you in my
contacts."). The checklist row for the same factor is a second first-person line with different
wording ("Sorry, who is this? I don't recognise the address."). The `open` row, meanwhile, is third
person.

Proposed: for character targets (Pierce, Lord) make the checklist `fail` strings third-person
analyst notes, and leave the first-person voice to the ink reply. Examples:
- pierce `senderTrust.fail`: "She doesn't know this sender. She acts on mail from someone she trusts in Finance."
- pierce `addressedTo.fail`: "No name, or not the one her colleagues use."
- lord `linkCredible.fail`: "The link's address isn't her portal's."
Keep Hampshire's first-person strings: she has no ink, so they are her reply.
**Why:** the student should hear the person once, then see the analysis. Two nearly identical quotes
for one failure read like a bug.

---

### 34. Chris Hampshire's off-topic refusal could teach more
**File:** `scenario.json.erb`, `phishTargets[hampshire].factorStrings.pretextRelevant.fail`.

Current: "This isn't about the role. I only handle applications."
Proposed: "Thanks for getting in touch, but this inbox is for job applications only. Try our main number for anything else."
**Why:** it is polite, the way a careers lead in her fifties would write, and it shows that a role
inbox's narrow purpose is a filter in itself. That is why the applicant pretext works and the
enquiry doesn't.

---

### 35. Dev has two report lines, and one isn't his voice
**File:** `scenario.json.erb`, `pretextNpcs[0].outcomes.reported.line`; `ink/dev_service_desk.ink`
`reaction` (line 63).

Current: JSON: "I'll need to check this with my manager before I share anything. Goodbye." Ink: "Tell
you what, I'll check this with my manager and call you back. Cheers."
Proposed: one line, used in both places: "Sorry, I'm going to stop you there. I'll run this past my
manager first." (see item 7).
**Why:** "Goodbye." is stiff for the friendliest voice in the building. "Call you back" is also wrong:
he has no number for you, which is the whole point of the call-back finding.

---

### 36. Ruth has no in-person line during recon
**File:** `ink/ruth.ink`, knot `hub`, the stage cascade (lines 157-176).

Current: between `plan_done` and `osint_done` no branch matches, so she says "Need me?" / "Something
else?".
Proposed: add
```
- plan_done and not (osint_done and se_intel_username_convention):
    Ruth Adeyemi: Recon's through the west door. Public pages only. If you'd need a password to see it, it's off the sheet.
```
**Why:** recon is the longest stage (10 minutes) and the one where students most often come back to
ask. The line also teaches where OSINT stops, which matches the RoE.

---

### 37. Pierce: give the career-changer a line of her own
**File:** `ink/pierce_mail.ink`, knot `on_email`, `pretextRelevant` branch (line 44).

Current: `Melanie Pierce: I'm not expecting anything like this. What's it about?`
Proposed: `Melanie Pierce: I'm not expecting anything like this. Twenty years in retail, I know a dodgy delivery note when I see one.`
(Use it on the `pretext_invoice` / `pretext_password` sends. The plain line stays for anything else,
if the reply can branch on the pretext. Otherwise use it as the only line.)
**Why:** PLAN §3 says she is a career-changer and "nobody's fool", and none of the text shows it. One
line gives her a past and stops "new starter" reading as "easy mark".

---

### 38. "Prepare for Sofia": say what the call is for
**File:** `scenario.json.erb`, aim `prepare_hard` description and task `call_dev` title.

Current: description "…call the service desk for what the page can't tell you." Task "Call the
service desk and get at least one fact".
Proposed: description "Build a look-alike payroll page, and call the service desk for what your recon
couldn't find: the portal's name and when payslips go out. Either order." Task "Call the service desk
about Sofia's payslip".
**Why:** "what the page can't tell you" means nothing until you have done it. "At least one fact"
invites the student to stop after one ask, when Sofia needs both (PLAN §5 stage 5).

---

### 39. Ruth's Operations line repeats after the address is made
**File:** `ink/ruth.ink`, knot `hub`, line 164-165.

Current: "Mail's in Operations. Set up a throwaway address before you write to anyone." This shows
until Pierce lands, even after `acct_freemail`.
Proposed: split on `acct_freemail`:
```
- operations_key_given and not acct_freemail:
    Ruth Adeyemi: Mail's in Operations. Make your throwaway address before you write to anyone.
- operations_key_given and not phish_pierce_landed:
    Ruth Adeyemi: A message lands when they'd act on it. Opened, clicked, replied. Not just delivered.
```
**Why:** a stale instruction makes the student think they missed something. The second branch carries
the definition from item 22.

---

### 40. Let Tomasz be funny when you report your own email
**File:** `scenario.json.erb`, `triageSets[0].messages[own_pierce|own_lord].notes.reportReply`.

Current (both): "Thanks. Confirmed as a phish."
Proposed:
- own_pierce: "Thanks. Confirmed as a phish. Sent from a workstation in our own Operations Room, funnily enough."
- own_lord: "Thanks. Confirmed as a phish. Good page, that. Shame about the address."
**Why:** this is the moment the student catches themselves. A dry line in Tomasz's register makes it
land as a joke between colleagues, and the second one points at the tell (the domain).

---

## Cast check

Against the standing rule (AGENTS.md "Characters"; vary ethnicity, age and look; recurring characters
get their own key):

| Character | Ethnicity | Age | Gender | Speaks |
|-----------|-----------|-----|--------|--------|
| Ruth Adeyemi | Black British (Nigerian) | late 40s | F | voiced |
| Gareth Fairbairn | white Scottish | early 60s | M | voiced |
| Tomasz | Polish British | mid 30s | M | voiced |
| Dev | British Indian | early 40s | M | voiced |
| Chris Hampshire | British Chinese | mid 50s | F | email |
| Melanie Pierce | white British | early 40s | F | email |
| Sofia Lord | British Filipino | 20 | F | email |
| Jed Baker | Black Caribbean British | late 50s | M | page only |

The spread is good: six heritages across eight people, ages 20 to 60s, four women and four men.
Notes, none of which needs to be in the ranked list:

- **Dev, a British Indian man on the phone help desk**, is close to a familiar call-centre stereotype.
  The plan guards against it (he is good at his job, the policy is to blame). Item 7's lines make him
  sound competent and warm rather than pliable, and item 35 removes his stiffest line. If the user
  wants more distance from the stereotype, the cheapest change is a line saying he runs the desk
  ("I've run this desk eleven years"), which makes his helpfulness a choice rather than a script.
- **Every voiced character is 35 or over.** The only young voice (Sofia) is email-only. That's fine
  for a consultancy, but if a later cycle adds a voiced line, a younger Ledgerwell staffer is the gap.
- **Accents are carried by TTS, not spelling.** That's the right call. Fairbairn's "Aye" is the only
  dialect word, and it's enough. Nothing for Tomasz needs adding: a Polish word would be caricature.
- **Sprite keys.** All three person NPCs and Dev still use placeholders (`female_office_worker_v2`,
  `male_office_worker_v2`, `male_telecom_v2`). This is expected at this stage (PLAN §3) and is not
  dialogue.

## Checked and fine

- Target replies give sensible, non-foolish reasons in each voice (PLAN §3 guard holds), especially
  Sofia's "I'll check with the office first".
- Scope cards and the stop-rule question are clear and each "why" names the sheet's rule.
- Defender mitigations: the bad options are plausible and their reasons are short and fair.
- No voiced line prints a variable. Dev's choice labels interpolate, but labels aren't voiced. Item 7
  keeps to fixed strings.
- The end screen line ("Gareth keeps his staff, and his staff keep reporting.") is a good close.

## Also noticed, not ranked

- `intelFacts.pierce_expects_balance_sheet.text` and the board's `doneString` say "on Fridays". The
  source note is a one-off ("on Friday").
- The `typo-squat` concept card describes `ledgervvell` (a look-alike letter pair). By common usage,
  `ledgerwall` (the "wrong-letter" tier) is the typo-squat. Worth a terminology check by the builder's
  owner. The card's data was not changed here (Phase 5 belongs to the Haiku agents).
- `vendor_invoice.whyFine` says "the usual amount" but the body gives no amount.
- The 15-second reply waits (three or more per run) have nothing to fill them beyond the checklist.
  If the timed run shows students idling, a one-line Ruth phone text after the first send ("Give her a
  minute. Read your checklist while you wait.") would cover it.
