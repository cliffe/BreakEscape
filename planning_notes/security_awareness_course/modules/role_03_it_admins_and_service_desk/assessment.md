# role_03 assessment

## Assessed behaviours

Each row is recorded through BE-01 and shown in the debrief and the learner's record. "How soon" is always measured in story events (before the next ticket, before Kai's alert), never in real minutes.

| Id | Behaviour | Learning outcome | Where it is evidenced | Secure | Developing | Not yet |
|---|---|---|---|---|---|---|
| R03-B1 | Handles the airport call | LO1, LO2 (baseline) | Hook, H1 | Doesn't move the authenticator; offers the in-person or video ID check with a second check, or a call back on the directory number | Asks the lead before deciding; or asks the security questions first, then refuses | Moves the authenticator after the questions |
| R03-B2 | Reports their own slip | LO6 | Hook, H2 (only if H1 was a reset) | Tells Owain before taking the next ticket | Tells someone when Kai's alert arrives | Says nothing when the alert arrives |
| R03-B3 | Picks the check that fits the risk | LO2, LO3 | Practise | 6 of 6 | 4 or 5 | 3 or fewer |
| R03-B4 | Handles the contractor's admin request | LO3 | Apply, test 1 | A separate admin account with the minimum rights, approval, an end date and a security key | A separate account, but with domain admin and no end date | Domain admin on his normal account, or the shared admin login |
| R03-B5 | Handles the app consent request | LO4 | Apply, test 2 | Refuses, offers the approved tool, sends it for security review | Approves it for Martin's team only | Approves it for the organisation |
| R03-B6 | Acts on the sign-in alert | LO5 | Apply, test 4 | Flags the 09:41 row and escalates to Kai before anything else | Rings Jamie on the directory number first, then escalates | Closes the alert |
| R03-B7 | Supports a colleague's report | LO6 | Apply, test 4 | "We'll tell Kai together" | Tells Rosa she should report it, but leaves her to it | "Fix it quietly", or "not my ticket" |
| R03-B8 | Handles the supplier's remote tool | LO4 | Apply, test 5 | Refuses to whitelist, books the approved route, has the tool removed and reported | Refuses, but leaves the tool in place and unreported | Whitelists it, or asks for the PC to be left unlocked |
| R03-B9 | Handles the request to switch protection off | LO4 | Apply, test 6 | Raises a change to tune it and offers a fix | "Nothing we can do" (safe, unhelpful) | Turns it off |
| R03-B10 | Handles the real chief executive's request | LO2, LO6 | Apply, test 7 | In person with ID, a second analyst, notification afterwards | Video call with ID as the only check | Trusts the office line, or asks security questions |

R03-B2 applies only to players who moved the authenticator in the hook. Players who didn't are recorded as "not applicable", not as a pass or a fail.

The **before and after** is R03-B1 against R03-B10: the same request (move an executive's authenticator to a new phone) from the "same" person, first under airport pressure, then from a real, impatient chief executive on her office line.

## Critical behaviours

To complete the module the learner must show each of these, or be taken back through the practice for it:

- **R03-CB1 Never changes an executive's or administrator's MFA on knowledge questions or caller ID alone** (R03-B10 not at Not yet; the hook is a baseline and never counts against it).
- **R03-CB2 Escalates a suspicious sign-in after a reset** (R03-B6 not at Not yet).
- **R03-CB3 Doesn't approve an app with organisation-wide mail and file access** (R03-B5 not at Not yet).

**The remediation loop** follows `features/assessment_and_evidence.md`, section 4. If a critical behaviour wasn't shown, the debrief says what happened without blame and Owain offers to go over it: *"That one catches good analysts. Let's try it once more."* He replays the matching part of the ladder (one to two minutes), then a fresh case of the same kind arrives in a short replay of the queue (one to three minutes), drawn from the bank: a "finance director" in a hotel who needs MFA moved before a payment run (CB1); a new-device sign-in on another account after a self-service reset (CB2); a "calendar assistant" app asking for every mailbox (CB3). Shown: recorded as "shown after practice", and the linked outcome is capped at Developing for this sitting. Not shown: a second loop with another fresh case and a more direct prompt. After two loops the learner goes on to the check; the record says "practised, not yet shown", a private follow-up drill ("Prove It") is scheduled two to four weeks later (HA-03, HA-21), and nobody else is told by name. Every attempt is kept.

## Knowledge check bank

Six items per sitting, drawn so that every learning outcome is covered. Stems are short service desk situations. Every outcome has at least two items: LO1 (R03-Q1, Q4), LO2 (R03-Q2, Q3, Q12), LO3 (R03-Q5, Q6), LO4 (R03-Q7, Q8), LO5 (R03-Q9, Q10), LO6 (R03-Q4, Q11, Q12).

### R03-Q1 (LO1, single choice)

A caller gives the right employee number, date of birth and manager's name. What does that prove?

- A. That it's them: three facts is plenty. *Feedback: All three can be found on social media, company websites or old breaches.*
- **B. Nothing on its own. Those facts can be found or bought, so verify through a route they don't control.** *Feedback: Right. Knowing isn't proving.*
- C. That it's them, if they answered quickly. *Feedback: A prepared caller answers fastest of all.*
- D. That it's someone inside the organisation. *Feedback: Outsiders can find all of it.*

### R03-Q2 (LO2, single choice)

The caller says their phone was stolen and gives you a new number to call back on. What do you do?

- A. Call the new number: it's the only way to reach them. *Feedback: Whoever answers that number is whoever gave it to you.*
- **B. Don't use it. Use the number in the directory, or another route they don't control: their manager on a known channel, or ID in person or on video.** *Feedback: Right. The route has to be one the caller can't set up.*
- C. Ask more security questions instead. *Feedback: More questions are more things that can be looked up.*

### R03-Q3 (LO2, ordering)

The chief executive needs her authenticator moved to a new phone. Put the steps in order.

1. **Check her ID in person (or on video) against her HR photo.**
2. **Make a second check: her assistant or the duty director on a known number.**
3. **A second analyst approves.**
4. **Move the authenticator and sign the account out everywhere else.**
5. **Notify her on her contact details of record, and note on the ticket what you checked.**

*Feedback: Identity first, then the second route, then the second person, and only then the change. Accept steps 1 and 2 in either order.*

### R03-Q4 (LO1, LO6, multiple select)

Which of these are pressure tactics? Choose all that apply.

- **A. "I'm boarding in ten minutes."** *Feedback: Urgency, often with travel to explain why the usual route won't work.*
- **B. "Do you know who I am?"** *Feedback: Seniority. The more senior the account, the more it's worth checking.*
- **C. "Your colleague did it last time without all this."** *Feedback: Social proof, and a nudge to skip the procedure.*
- D. "Can you give me the ticket number?" *Feedback: An ordinary question.*

### R03-Q5 (LO3, single choice)

A project manager asks you to give a new contractor domain admin on his normal account "so he isn't blocked". What do you set up?

- A. Domain admin on his normal account, removed when the project ends. *Feedback: His everyday account would read email and browse with full rights, and "when the project ends" tends not to happen.*
- **B. A separate admin account with only the rights the migration needs, approved by the system owner, ending with his contract, with phishing-resistant MFA.** *Feedback: Right. Least privilege, for a set time, on an account used for nothing else.*
- C. The team's shared admin login for today. *Feedback: Shared logins can't be traced or removed from one person.*

### R03-Q6 (LO3, true or false with reason)

"It's fine to read email with my admin account, as long as I'm careful."

- A. True: being careful is what matters. *Feedback: One bad attachment would run with your admin rights.*
- **B. False: admin accounts are for admin work only, with no email or web browsing, because anything you open runs with admin rights.** *Feedback: Right. Cyber Essentials requires exactly this.*

### R03-Q7 (LO4, single choice)

A director asks you to approve an app that wants to "read and write all mailboxes" and "send mail as any user". What do you do?

- A. Approve it: a director asked. *Feedback: Seniority doesn't change what the app can do.*
- B. Approve it and reset the director's password afterwards to be safe. *Feedback: The app keeps its access after a password reset.*
- **C. Don't approve it. Check what's needed and why, offer an approved tool, and send it for security review.** *Feedback: Right. Treat app consent like an access request.*

### R03-Q8 (LO4, single choice)

A supplier rings: "We've put our remote support tool on one of your PCs. Your antivirus keeps closing it. Can you whitelist it?" What do you do?

- A. Whitelist it for the day. *Feedback: Criminals use the same tools with the same story.*
- **B. No. Book the work through the approved supplier route, have the tool removed, and tell the security team.** *Feedback: Right. Approved tools, approved routes, whoever is asking.*
- C. Leave the PC logged in so they can finish quickly. *Feedback: That hands an unknown connection an open session.*

### R03-Q9 (LO5, single choice)

You reset an account at 09:40. At 09:41 the account signs in from another country on a new device. What now?

- **A. Escalate to the security team straight away, then contact the user on the directory number.** *Feedback: Right. Every minute counts while someone else may hold the account.*
- B. Ring the user first to ask if they're abroad. *Feedback: Check with them too, but escalate first so the security team can act.*
- C. Close it: people use VPNs. *Feedback: Straight after a reset, this is the pattern of a takeover.*

### R03-Q10 (LO5, multiple select)

Which of these should go to the security team? Choose all that apply.

- **A. A new MFA device registered on an administrator's account that nobody asked for.** *Feedback: Right.*
- **B. A mailbox rule forwarding everything to an outside address.** *Feedback: Right. A common step after a takeover.*
- **C. A remote support tool nobody approved, found on a warehouse PC.** *Feedback: Right.*
- D. A printer that's run out of toner. *Feedback: An ordinary ticket.*

### R03-Q11 (LO6, single choice)

A colleague realises the person she reset an hour ago probably wasn't who they said. She's worried. What do you say?

- **A. "Let's tell the security team together, now. Finding it this fast is the best outcome there is."** *Feedback: Right. Speed limits the damage, and nobody is blamed for reporting.*
- B. "Reset it again quietly and nobody needs to know." *Feedback: The attacker may already have set up other ways back in.*
- C. "That's on your ticket, not mine." *Feedback: Helping a colleague report is part of the job.*

### R03-Q12 (LO6, LO2, single choice)

The real chief executive rings from her office line, annoyed: "Just move my authenticator. You know it's me." What do you do?

- A. Move it: the office line proves it's her. *Feedback: Caller ID can be faked.*
- **B. Politely go to her office with a colleague, check her ID and set it up with her.** *Feedback: Right. It takes minutes, and it's what protects her account.*
- C. Ask her the security questions. *Feedback: Anyone who prepared could answer them.*

## Reflection prompt

- "Which part of our own reset procedure would be hardest to follow with a senior person shouting on the line, and what would make it easier?"
- For facilitated sessions: "What makes people on our desk skip checks: targets, queues, fear of senior callers? What one change would help?"

## Completion and pass rules

- **Complete** when the learner has played all beats (or the text route), shown each critical behaviour or been taken back through the practice for it (two loops at most), passed the knowledge check, and opened the reset card.
- **Pass mark:** 5 of 6 (the organisation can change it; 80% is the default).
- **Retakes:** a failed check draws six new items. After two fails, Owain's Learn beat replays before the third attempt.
- **Test-out** (where the organisation allows it): the Apply beat and the check without Learn and Practise. Missing a critical behaviour sends the learner through the full module, with no "failed" label.

## Evidence for auditors

The learner's record (HA-05) shows: module id and version, start and completion dates, time on task, route (game, text, test-out), each behaviour's rating, critical behaviours shown, shown after practice, or practised and not yet shown, the check score, and whether the reset card was opened. This supports:

- NIST AT-3 and NIST AT-2(3);
- CIS 14.9;
- ISO 27001 cl. 7.2 and ISO 27001 A.6.3;
- NCSC CAF B6.b, and DSPT 3.3.1 for NHS customers;
- PCI DSS 12.6.3.1, and PCI DSS 12.10.4 in part;
- NIS2 IR 8.2 and IR 10.1 where the Implementing Regulation applies; DORA Art 13(6);
- UK GDPR Art 32;
- NYDFS 500.10(a)(2), FTC 314.4(e)(3), CMMC AT.L2-3.2.2 and SOC 2 CC1.4 for US customers.

The record is awareness-level evidence for IT and service desk roles. It is not evidence of technical competence or of incident response team training (PCI DSS 12.10.4 in full); pair it with Hacktivity's technical labs for those staff (`README.md`, Compliance coverage).

## Measuring effect

Outside the course, an organisation can watch:

- **Resets with a recorded strong check**: the share of password and MFA resets where the ticket shows a call back, a registered-device prompt, a manager confirmation or an ID check, rising towards all of them.
- **Privileged and executive resets with a second analyst**, aiming for all of them.
- **Time from a suspicious sign-in after a reset to escalation**, falling.
- **Self-reported slips**: analysts reporting their own doubtful resets, which should rise at first (a sign of trust, not of worse work).
- **App consents and remote tools**: unapproved remote tools found in audits, and consent requests sent for review rather than approved at the desk.
- **Admin hygiene**: the share of administrators with separate admin accounts and phishing-resistant MFA, and standing admin rights replaced by time-limited ones.
- **Authorised test calls**: if the organisation commissions social engineering tests of its desk (with Jo Fairweather's kind of firm), the share of test calls refused or verified.

These come from the service desk tool, the identity platform and the security team's records. They are reported by team, never used to rank individual analysts, and a refusal that turns out to be a genuine caller is never counted against anyone.
