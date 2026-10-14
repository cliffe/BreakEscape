# core_01 assessment

## Assessed behaviours

Each row is recorded through BE-01 and shown in the debrief and the learner's record.

| Id | Behaviour | Learning outcome | Where it is evidenced | Secure | Developing | Not yet |
|---|---|---|---|---|---|---|
| C01-B1 | Responds to the hook phish | LO5 (baseline) | Hook | Reports it | Deletes or ignores it; or clicks, stops, then reports | Signs in and doesn't report before Ama arrives |
| C01-B2 | Responds to the expected-sender phish | LO2, LO3, LO5 | Apply | Reports it without signing in | Ignores or deletes it | Signs in |
| C01-B3 | Handles the hijacked thread | LO3, LO4 | Apply | Checks by phone using the directory number, then reports | Reports it without checking; or replies to the thread to ask | Signs in |
| C01-B4 | Handles the authority survey | LO1, LO3, LO5 | Apply | Reports it, with or without checking The Lark | Ignores it | Fills it in and signs in |
| C01-B5 | Handles the callback phish | LO3, LO4 | Apply | Reports it without calling | Ignores it | Calls the number (Developing if they hang up and report during the call) |
| C01-B6 | Advises Leo after his slip | LO5, LO6 | Apply | "Report it now and ring the service desk" | "Change your password and keep an eye on it" | "Delete it. Least said." |
| C01-B7 | Reports their own click | LO6 | Any beat | Reports within two game-minutes of signing in or clicking | Reports later in the module | Never reports it |
| C01-B8 | Reads web addresses | LO2 | Practise (MG-03 items), Learn check question | 3 of 3 correct | 2 of 3 | 0 or 1 of 3 |
| C01-B9 | Calibrates on genuine emails | LO3 | Practise and Apply | Opens the expected genuine emails; checks rather than reports where a quick check is available | Reports a genuine email | (not used: over-reporting is never "Not yet") |

C01-B7 applies only to players who clicked or signed in. Players who never did are recorded as "not applicable", not as a pass or a fail.

The **before and after** for each learner is C01-B1 against C01-B2: the same kind of threat (a credential phish from a lookalike sender) in the hook and in the mission.

## Critical behaviours

To complete the module the learner must, at least once:

1. **Report a phishing email** using the Report button (C01-B1, B2, B4 or B5 at Secure).
2. **Not sign in through the hijacked thread without checking** (C01-B3 not at Not yet).
3. **Report any click or sign-in of their own** before the module ends (C01-B7 not at Not yet), where it applies.

A learner who misses a critical behaviour is taken back to it: Ama replays the relevant Practise items with the explanation, then a fresh threat of the same kind arrives in a short replay of the Apply beat. They complete the module when they show the behaviour; the record keeps both attempts.

## Knowledge check bank

Six items per sitting, drawn so that every learning outcome is covered. Stems are short workplace situations.

### Q1 (LO2, single choice)

Which website does this link really go to?
`https://larkspur.co.uk.secure-login.info/mail`

- A. `larkspur.co.uk`. *Feedback: "larkspur.co.uk" is only at the front. Read the domain from the right-hand end.*
- **B. `secure-login.info`.** *Feedback: Right. The real domain is the part just before the first single slash, read from the right.*
- C. `mail`. *Feedback: That is the page on the site, not the site itself.*
- D. It's safe because it starts with `https`. *Feedback: https means the connection is encrypted, not that the site is genuine.*

### Q2 (LO3, LO4, single choice)

You're expecting a delivery note from a supplier. An email arrives from their usual contact's real address, in your existing conversation, asking you to sign in to "our new portal" to see it. What do you do?

- A. Sign in: it's from the real address in a real conversation. *Feedback: Accounts get taken over, and attackers reply inside real threads. The request is what to judge.*
- B. Reply to the email and ask if it's genuine. *Feedback: If the mailbox has been taken over, the attacker will answer "yes".*
- **C. Call the supplier on the number in the supplier directory, then report it if they didn't send it.** *Feedback: Right. Check through a route the attacker doesn't control.*
- D. Forward it to colleagues to see if they got it too. *Feedback: Forwarding spreads it. Use the Report button.*

### Q3 (LO1, multiple select)

An email says: "From the Chief Executive. Complete the staff survey by 12:00. Most of your team already has." Which pressures is it using? Choose all that apply.

- **A. Authority.** *Feedback: It claims to come from the top.*
- **B. Urgency.** *Feedback: A deadline in a couple of hours.*
- **C. Social proof.** *Feedback: "Most of your team already has."*
- D. Reward. *Feedback: Nothing is offered here.*

### Q4 (LO6, ordering)

You typed your password into a page from an email link, then realised it was fake. Put these steps in order.

1. **Report it with the Report button and call the service desk.**
2. **Change your password by going to the real site yourself.**
3. **Change the same password anywhere else you used it.**
4. **Follow the service desk's further instructions.**

*Feedback: Telling the service desk first matters most: they can lock the attacker out while you change the password. (Accept 1 and 2 in either order.)*

### Q5 (LO5, single choice)

You're not sure whether an email is phishing. It might be genuine. What should you do?

- A. Ignore it and hope it goes away. *Feedback: If it's phishing, others may fall for it; nobody will know it got through.*
- **B. Report it. If it's genuine, the security team will say so.** *Feedback: Right. Reporting is never wrong.*
- C. Delete it so nobody clicks it by accident. *Feedback: Deleting protects you but nobody else.*
- D. Click the link carefully to find out. *Feedback: Don't test a suspicious link. Check another way or report it.*

### Q6 (LO3, true or false with reason)

"If an email has no spelling mistakes and the logo looks right, it's probably genuine."

- A. True: phishing emails are usually badly written. *Feedback: Not any more. Attackers use translation and AI tools.*
- **B. False: well-made phishing can look perfect, so judge what it asks for and check another way.** *Feedback: Right.*

### Q7 (LO6, single choice)

A colleague tells you they clicked a link in a suspicious email and typed their password, but they don't want to make a fuss. What do you say?

- **A. "Report it now and call the service desk. You won't be in trouble, and the sooner they know the better."** *Feedback: Right. Speed matters more than the click.*
- B. "Just change your password and forget about it." *Feedback: Changing the password helps, but the attacker may already be signed in. The service desk needs to know.*
- C. "Delete the email. No harm done." *Feedback: The harm may already be happening. Report it.*

### Q8 (LO3, LO4, single choice)

An email says your software subscription has renewed for £399 and gives a number to call to cancel. You don't remember the subscription. What's the safest move?

- A. Call the number to cancel before the payment goes through. *Feedback: This is callback phishing: the scammer is waiting at that number.*
- **B. Report it, and if you're worried, check your real subscriptions through the service desk or the supplier's website, typed in yourself.** *Feedback: Right.*
- C. Reply asking for more details. *Feedback: Replying tells them your address is live.*

### Q9 (LO2, hotspot)

Shown: an email header with a display name "Larkspur IT Service Desk" and the address `servicedesk@larkspur-support.net`. Click the part that shows it isn't from Larkspur.

- **Correct hotspot:** the domain `larkspur-support.net`. *Feedback: Anyone can set the display name. The address shows where it really came from.*

### Q10 (LO1, single choice)

What is a phishing email usually trying to get you to do?

- A. Read it. *Feedback: Reading an email is almost always harmless.*
- **B. Click, open, sign in, pay or reply, so the attacker gets access, money or information.** *Feedback: Right.*
- C. Forward it. *Feedback: Sometimes, but that isn't usually the goal.*
- D. Unsubscribe. *Feedback: Not the usual aim.*

### Q11 (LO5, single choice)

Your organisation sends you a test phishing email and you report it. What happens?

- **A. You've done exactly the right thing, and it's recorded as a report.** *Feedback: Right. Reporting tests is the habit we want.*
- B. You get in trouble for wasting the security team's time. *Feedback: No. Reports are always welcome.*
- C. Nothing: tests should be ignored. *Feedback: Treat every suspicious email the same way: report it.*

(Q11 uses the organisation's simulated phishing slot; drop it from the bank where the organisation doesn't run simulations.)

## Reflection prompt

- "Think of the last email that made you hurry. What would checking another way have looked like?"
- For facilitated sessions: "What makes people at our organisation hesitate to report a mistake, and what would change that?"

## Completion and pass rules

- **Complete** when the learner has played through all beats (or the text route), shown each critical behaviour (with remediation if needed), passed the knowledge check, and opened the reference card.
- **Pass mark:** 5 of 6 (the organisation can change it; 80% is the default).
- **Retakes:** a failed check draws six new items. After two fails, Ama replays the Learn beat before the third attempt.
- **Test-out** (where the organisation allows it): the Apply beat and the check without Learn and Practise. Passing records the module as complete; missing a critical behaviour sends the learner through the full module.

## Evidence for auditors

The learner's record (HA-05) shows: module id and version, start and completion dates, time on task, route (game, text, test-out), each assessed behaviour's rating, critical behaviours shown or remediated, the check score, and whether the reference card was opened. This supports:

- PCI DSS 12.6.3.1 (awareness training covering phishing and related attacks);
- ISO/IEC 27001 Annex A 6.3 and clause 7.3;
- NIST SP 800-53 AT-2 and AT-2(3) (social engineering) where used;
- CIS Control 14.2 (recognise social engineering attacks) and 14.6 (recognise and report security incidents);
- NCSC CAF B6.

See `02_COMPLIANCE_MAPPING.md` for the full references.

## Measuring effect

Outside the course, an organisation can watch:

- **Report rate** for real suspicious emails and for simulated phishing (the share of recipients who report), which should rise.
- **Time to first report** for a campaign, which should fall.
- **Reports compared with clicks** in simulations: a healthy ratio has more reports than clicks.
- **Repeat clickers** in simulations (supportively followed up, never named and shamed).
- **The hook-to-Apply change** across the organisation in the course itself.

These need report-button data from the organisation's mail system and, if used, simulation results (HA-12). The dashboard shows them by department, never by named individual below the privacy threshold (HA-09).
