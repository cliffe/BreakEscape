# core_03 assessment

## Assessed behaviours

Each row is recorded through BE-01 and shown in the debrief and the learner's record.

| Id | Behaviour | Learning outcome | Where it is evidenced | Secure | Developing | Not yet |
|---|---|---|---|---|---|---|
| C03-B1 | Responds to the night prompts | LO5 (baseline) | Hook | Denies and reports (in the app, or by calling the 24/7 desk) | Denies or ignores without reporting; or types the number, then reports it before Jas rings | Types the "IT" number and says nothing until Jas rings |
| C03-B2 | Builds the manager's passphrase | LO2 | Practise (MG-08) | Three or more random words, no personal details | Adds a swap or a "!", but no personal details | Adds a birth year or a pet's name and keeps it after seeing the meter |
| C03-B3 | Fixes reused passwords, email first | LO1, LO3 | Practise (MG-08) | Every flagged account fixed, starting with email | Every flagged account fixed, not starting with email | Leaves a flagged account unfixed |
| C03-B4 | Answers security questions | LO3 | Practise and Apply (MG-08) | Made-up answers, stored in the manager, both times | One made-up, one true | True answers both times |
| C03-B5 | Chooses sign-in protection | LO4 | Practise (MG-07 enrolment) and Apply (the portal) | A passkey where offered (the app with number matching where the organisation offers no passkeys), and a passkey at the portal | The app where a passkey was offered, or no passkey at the portal | Text messages where something stronger was offered |
| C03-B6 | Reads prompts in context | LO5 | Practise ("Approve or Deny?") | 5 or 6 of 6 | 3 or 4 of 6 | 0 to 2 of 6 |
| C03-B7 | Handles the shared PC | LO6 | Apply | Asks Kev to sign in himself, or rings the service desk | Asks Kev, then types the note with his blessing | Types the note without asking |
| C03-B8 | Handles the Ledger prompt | LO5 | Apply | Denies and reports | Denies or ignores without reporting; or approves, then reports it before Owain rings | Approves and says nothing until Owain rings |
| C03-B9 | Advises Kev on his password | LO1, LO2, LO3 | Apply | *"Three random words, and the vault remembers the rest"* | *"Write it on a new note, somewhere safer"* | *"Your dog's name and the year"* or *"Keep the birthday, add a !"* |

The **before and after** for each learner is C03-B1 against C03-B8: a sign-in prompt they didn't start, first at night under a flood and a fake "IT" message, then in daylight, arriving just when they expect a prompt of their own.

Telling Jas or Owain the truth when they ring is never marked down: the debrief credits it as a late report, and the "Not yet" in B1 and B8 is about approving, not about what happened next.

## Critical behaviours

To complete the module the learner must show:

- **C03-CB1** Doesn't approve a prompt they didn't start: C03-B8 not at Not yet.
- **C03-CB2** Gives every account its own password: C03-B3 not at Not yet (every flagged account fixed in the vault).
- **C03-CB3** Doesn't use someone else's written-down password without asking: C03-B7 not at Not yet.

A learner who misses one goes through the course's remediation loop (`features/assessment_and_evidence.md`, section 4): Owain replays the matching Practise step, then a fresh situation of the same kind arrives in a short replay, drawn from the bank (BE-13): a prompt for a different service during their own sign-in (CB1), a vault with new reuse flags (CB2), or a different shared login, such as the reception PC with a note on its screen (CB3). Shown after practice, the outcome is capped at Developing. After two loops without it, the learner goes on to the check; the record says "practised, not yet shown", and a private "Approve or Deny?" drill (or the matching one) is scheduled two to four weeks later (HA-03, HA-21). Nobody else is told by name.

Every attempt stays in the record. The passphrase (C03-B2) and sign-in method (C03-B5) are assessed but not critical: a learner who keeps a pet's name in the passphrase sees why on the meter, and sign-in methods are usually set by the organisation, not chosen by staff.

## Knowledge check bank

Six items per sitting, drawn so that every learning outcome is covered. Stems are short workplace situations. Example passwords in the bank are game examples only; the feedback reminds learners never to use an example they have seen.

### C03-Q1 (LO1, single choice)

A small hobby website you used years ago has been breached. You used the same password for your work account. What is the main risk?

- A. None: the hobby site has nothing to do with work. *Feedback: Attackers try leaked email and password pairs on lots of other sites, automatically.*
- **B. Attackers will try that email and password on your work account and others.** *Feedback: Right. That's credential stuffing. Change the password everywhere you used it.*
- C. The hobby site will tell your employer. *Feedback: It won't, and that isn't the risk.*
- D. Only the hobby account is at risk. *Feedback: Reuse spreads the risk to every account with the same password.*

### C03-Q2 (LO2, single choice)

Which of these is the strongest password to remember for your password manager?

- A. `Larkspur2026!` *Feedback: The company name plus a year and a symbol is one of the first patterns attackers try.*
- B. `P@55w0rd!` *Feedback: Swapping letters for numbers and symbols doesn't fool guessing tools.*
- C. `Biscuit2019` (your dog's name and the year he was born). *Feedback: Personal details can often be found online.*
- **D. `kettle orbit marigold`** *Feedback: Right. Three random words: long, unusual and easy to remember. Never use an example you've seen, including this one.*

### C03-Q3 (LO2, true or false with reason)

"Changing your password every 90 days keeps your account safe."

- A. True: regular changes stop attackers using old passwords. *Feedback: Forced changes push people into patterns (`Spring2026!`, `Summer2026!`) that are easy to guess.*
- **B. False: change it when you know or suspect it has been seen, and keep it strong and unique.** *Feedback: Right. That's the NCSC's advice too.*

### C03-Q4 (LO3, single choice)

You're signing up to a new supplier portal for work. What do you do about the password?

- A. Use your usual work password so you remember it. *Feedback: If the portal is ever breached, your work account goes with it.*
- **B. Let the password manager generate a new one and save it.** *Feedback: Right. Unique, strong, and you don't have to remember it.*
- C. Use your usual password with the supplier's name on the end. *Feedback: Predictable variations are tried too.*
- D. Make a new one and write it on a note by your screen. *Feedback: Anyone passing can read it. The manager is safer and easier.*

### C03-Q5 (LO3, single choice)

A website asks: "What was the name of your first pet?" What's the safest answer?

- A. The true answer, so you remember it. *Feedback: True answers can often be found online or guessed by people who know you.*
- **B. A made-up answer, saved in your password manager with the login.** *Feedback: Right. Nobody can look it up, and you won't forget it.*
- C. The same word on every site. *Feedback: Easy to remember, and easy to reuse against you.*
- D. Skip it if the site lets you; if not, use the true answer. *Feedback: Skipping is fine. If it insists, make one up and save it.*

### C03-Q6 (LO4, ordering)

Put these ways of signing in in order, strongest first.

1. **A passkey or a security key**
2. **An authenticator app with number matching**
3. **A code sent by text message**
4. **A password on its own**

*Feedback: A passkey only works on the real site. An app prompt can be approved by mistake or under pressure. A text code can be intercepted or passed on. A password alone can be stolen and reused. Any of the first three is far better than the last.*

### C03-Q7 (LO5, single choice)

At 23:40 your phone shows a third sign-in prompt in a minute. You're watching TV. What do you do?

- A. Approve it so they stop. *Feedback: That lets the attacker in. The flood is designed to make you do exactly that.*
- B. Turn the phone off until the morning. *Feedback: It stops the noise, but the attacker still has your password and nobody knows.*
- **C. Deny it, report it, and let the service desk help you change your password.** *Feedback: Right. A prompt you didn't start means someone has your password.*
- D. Deny it. Nothing else is needed. *Feedback: Denying is right. Report it too, so the password can be changed.*

### C03-Q8 (LO5, single choice)

During a run of prompts, a message from "IT Support" says: "We're fixing a fault. Enter 47 in the app to stop the prompts." What do you do?

- A. Enter 47: it's from IT. *Feedback: No genuine IT team will give you a number to type. That number came from the attacker's sign-in screen.*
- B. Reply and ask whether it's really IT. *Feedback: The attacker will say yes.*
- **C. Don't enter it. Deny the prompts and report the prompts and the message.** *Feedback: Right.*
- D. Ring the number the message came from to check. *Feedback: That's the attacker's number. Use the service desk number you already have.*

### C03-Q9 (LO5, single choice)

You're signing in to a supplier portal and expecting a prompt. Two arrive at once: one for the portal, and one for the finance system, from another country. What do you do?

- A. Approve both: you're signing in anyway. *Feedback: The second isn't yours. Approving it lets an attacker in.*
- **B. Approve the portal's, deny the other and report it.** *Feedback: Right. Read every prompt: which service, and where from.*
- C. Deny both and try again later. *Feedback: Safe, but report the one you didn't start: someone has that password.*

### C03-Q10 (LO6, single choice)

You need a file from a shared PC. Its password is on a sticky note on the monitor, and the person who uses it is busy. What do you do?

- A. Use the note: that's what it's there for. *Feedback: It's there for anyone, including visitors, and anything you do is recorded in someone else's name.*
- **B. Ask them to sign in for you, or ask the service desk for access.** *Feedback: Right. Ask first: the service desk would rather help than clean up.*
- C. Take a photo of the note for next time. *Feedback: Now it's on your phone too.*
- D. Use it, then hide the note under the keyboard. *Feedback: Under the keyboard is the first place anyone looks.*

### C03-Q11 (LO6, hotspot)

Shown: a warehouse office desk with a monitor, a keyboard, a kettle, a wall planner and a hi-vis jacket. Click the risk.

- **Correct hotspot:** the sticky note on the monitor reading `WAREHOUSE / Stock2024!`. *Feedback: A password where others can see it is a password for everyone. Ask for your own account, or a shared vault.*
- **Text route and keyboard or screen reader:** the same item is offered as a labelled list of what is on the desk (monitor and sticky note, keyboard, kettle, wall planner, hi-vis jacket), each selectable without a pointer, so the choice is identical to the hotspot (MG-20 accessible equivalent; `features/accessibility_and_inclusion.md`).

### C03-Q12 (LO1, LO3, multiple select)

The service desk tells you your work email address was in a breach of a booking site you once used. Which of these should you do? Choose all that apply.

- **A. Change the password on every account where you used the same one.** *Feedback: Yes. Reuse is how one breach becomes many.*
- **B. Let your password manager make each of them unique.** *Feedback: Yes.*
- **C. Turn on MFA, or a passkey, wherever it's offered.** *Feedback: Yes. A stolen password alone then isn't enough.*
- D. Close your email account. *Feedback: There's no need. Secure it instead.*
- **E. Watch for emails that mention the booking: attackers use breach details in phishing.** *Feedback: Yes. They can arrive months later.*

## Reflection prompt

- "Which of your accounts would you least like to lose? Does it have its own password, and MFA?"
- For facilitated sessions: "Where do we still have shared logins or passwords on notes, and what would it take to get rid of them?"

## Completion and pass rules

- **Complete** when the learner has played through all beats (or the text route), shown each critical behaviour or been taken through the remediation loop for it (at most two loops), passed the knowledge check, and opened the reference card.
- **Pass mark:** 5 of 6 (the organisation can change it; 80% is the default).
- **Retakes:** a failed check draws six new items. After two fails, Owain replays the Learn beat before the third attempt.
- **Test-out** (where the organisation allows it): the Apply beat and the check, without Learn and Practise. Passing records the module as complete; missing a critical behaviour sends the learner through the full module.
- **Accessibility:** no behaviour depends on speed. The prompts wait for an answer, and the text route records the same rows.

## Evidence for auditors

The learner's record (HA-05) shows: module id and version, start and completion dates, time on task, route (game, text, test-out), each assessed behaviour's rating, critical behaviours (shown, shown after practice, or practised and not yet shown), the check score, and whether the reference card was opened. **It never holds a password or a passphrase:** MG-08 records only the strength band and the choices made, and every word on the tiles is a game word. This supports:

- ISO 27001 A.6.3 and ISO 27002 6.3 (password security as a baseline control);
- NIST AT-2;
- CIS 14.3;
- PCI DSS 8.3.8 (authentication policies and procedures communicated to all users);
- NCSC CAF B6.b (each individual's training tracked);
- NIS2 Art 21(2)(g) and NIS2 IR 8.1;
- UK GDPR Art 32;
- DSPT 2.1.1 and 3.2.1 (categories 3 and 4), for NHS customers;
- HIPAA 164.308(a)(5)(ii)(C) and (D), FTC 314.4(e) and CMMC AT.L2-3.2.1, for US customers.

It also helps an organisation show it supports users to choose unique passwords, as Cyber Essentials v3.3 asks, without being a Cyber Essentials requirement in itself.

See `02_COMPLIANCE_MAPPING.md` for the full references.

## Measuring effect

Outside the course, an organisation can watch:

- **MFA coverage and method mix:** the share of staff enrolled, with passkeys and security keys rising and text codes falling.
- **Reports of unexpected prompts,** and the ratio of reported prompts to denied prompts in the sign-in logs: a rising ratio means people are telling, not just pressing Deny.
- **Suspicious prompts approved by users** (approvals from unusual places or at unusual times), which should fall.
- **Password manager adoption** (installs and active use) and the manager's aggregated health score (reused and weak passwords).
- **Staff accounts found in breach monitoring** with passwords reused at work.
- **Service desk password reset volume,** which usually falls as managers spread.
- **Shared logins remaining,** from the identity team's own register.
- **The hook-to-Apply change** across the organisation in the course itself.

These need sign-in logs from the organisation's identity provider, the password manager's admin reports and service desk data, all aggregated. The dashboard shows them by department, never by named individual below the privacy threshold (HA-09).
