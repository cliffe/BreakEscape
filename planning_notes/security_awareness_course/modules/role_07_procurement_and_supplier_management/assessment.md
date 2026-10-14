# role_07 assessment

## Assessed behaviours

Each row is recorded through BE-01 and shown in the debrief and the learner's record.

| Id | Behaviour | Learning outcome | Where it is evidenced | Secure | Developing | Not yet |
|---|---|---|---|---|---|---|
| R07-B1 | Responds to "sign today" | R07-LO2, R07-LO3 (baseline) | Hook | Asks what the system will hold and reach, asks for evidence, or brings in Harjit, before anything is signed | Holds off without asking any questions | Signs the order |
| R07-B2 | Judges the bids | R07-LO3 | Apply, part A | At least 15 of 18 verdicts right, including ShiftHarbour's certificate scope and Tidewell's unnamed affiliate | 11 to 14 right, or misses one of those two | 10 or fewer right, or misses both |
| R07-B3 | Recommends a bidder | R07-LO2, R07-LO3 | Apply, part B | Rotafell or Tidewell, with conditions for its gaps | Rotafell or Tidewell, without conditions | ShiftHarbour |
| R07-B4 | Holds the clauses that matter | R07-LO4 | Apply, part C | Holds at least four of the five key clauses (notice within hours, named subcontractors with approval, return and deletion with a certificate, supplier access rules, yearly independent assurance) | Holds three | Holds two or fewer |
| R07-B5 | Sets up the supplier's access | R07-LO1, R07-LO5 | Apply, part D | Named accounts, MFA, least privilege, time-limited and logged | One shared account with MFA; or named accounts with no time limits | As asked: shared, no MFA, permanent |
| R07-B6 | Responds to the breach notice | R07-LO1, R07-LO6 | Apply, part E | Forwards it to security and the DPO at once and sends the supplier the five questions | Asks the supplier first, then tells security the same day | Waits for the supplier's full report before telling anyone |
| R07-B7 | Ends the supplier's access | R07-LO5 | Apply, part F | Removes all four items, rotates the API secret, asks for the deletion certificate and updates the register | Misses one item | Misses two or more, or only closes the contract |
| R07-B8 | Sorts claims from evidence | R07-LO3 | Practise | 7 or 8 of 8 | 5 or 6 of 8 | 4 or fewer |

The **before and after** for each learner is R07-B1 against R07-B3: in both, the question is whether the learner commits to a supplier on claims or on evidence that fits the risk. The Apply version is harder, because two of the three bidders look good.

Asking for more evidence than a tier needs (for example, insisting on a SOC 2 report from fourteen-person Rotafell when its penetration test letter and Cyber Essentials Plus fit the risk) never counts as Not yet anywhere in the table: over-caution isn't a failure, and the debrief explains what proportionate looks like.

## Critical behaviours

Checked at the end of the Apply beat (BE-01). The hook is a baseline and never counts towards these.

- **R07-CB1 Don't choose a supplier on claims:** R07-B3 not at Not yet.
- **R07-CB2 Control supplier access from the first day to the last:** R07-B5 and R07-B7 both not at Not yet.
- **R07-CB3 Escalate a supplier's breach notice at once:** R07-B6 not at Not yet.

The remediation loop follows `features/assessment_and_evidence.md` section 4. If a critical behaviour wasn't shown, the debrief says what happened without blame, and Harjit offers to go over it: *"That one catches a lot of experienced buyers. Let's try it once more."* He replays the matching "Claim or Evidence?" items or explainer card, then a fresh case of the same kind arrives in a short replay (another bid pack, another supplier's access request or exit list, another breach notice), drawn from the bank. A second loop, if needed, uses a different case and a more direct prompt. After two loops the learner goes on to the check: the record says "practised, not yet shown", the linked outcome is capped at Developing for this sitting, and a private practice activity on the same behaviour is scheduled for two to four weeks later (HA-03, HA-21; the optional "Claim or Evidence?" drill where switched on, otherwise a short replay). Nobody else is told by name, and every attempt is kept in the record.

## Knowledge check bank

Six items per sitting, one per learning outcome, from a bank of twelve with two items for every outcome.

### R07-Q1 (R07-LO1, single choice)

Your payroll provider tells you that the company providing its file transfer tool was broken into, and your staff's details were taken. You never had a contract with the file transfer company. What does this show?

- A. It isn't our problem: we had no contract with them. *Feedback: It's our staff's data, and we chose the payroll provider.*
- **B. Our suppliers' suppliers are part of our risk, so we ask suppliers who they use and require notice and approval of changes.** *Feedback: Right. That's why the subcontractor clause matters.*
- C. Only use suppliers that do everything themselves. *Feedback: Almost no supplier does. Know the chain instead.*

### R07-Q2 (R07-LO1, true or false with reason)

"If nobody attacked anyone, a supplier's outage isn't a security matter."

- A. True: security is about attackers. *Feedback: A faulty update or an outage can stop our services as surely as an attack.*
- **B. False: depending on a supplier is a risk whether or not anyone attacks, so plan for their failure too.** *Feedback: Right. Ask what happens if they stop, and put continuity and exit in the contract.*

### R07-Q3 (R07-LO2, single choice)

Which of these suppliers needs the deepest security checks?

- A. The window cleaning firm (no data, no system access). *Feedback: Low risk: basic checks are enough.*
- B. A stationery supplier. *Feedback: Low risk, unless it holds our data or reaches our systems.*
- **C. A rostering system holding every field worker's home postcode, connected to the HR system every night.** *Feedback: Right. A lot of personal data, a connection in, and a service people depend on daily.*
- D. A sandwich delivery for meetings. *Feedback: Low risk.*

### R07-Q4 (R07-LO2, single choice)

A colleague wants to send the window cleaning firm the full 300-question security questionnaire "to be safe". What's the best response?

- A. Good idea: the more checks the better. *Feedback: It wastes their time and ours, and hides the suppliers that matter.*
- **B. Keep it proportionate: a short check for a firm with no data or access, and the deep checks for high-risk suppliers.** *Feedback: Right. Match the checks to the risk.*
- C. Skip checks entirely for small suppliers. *Feedback: Size isn't the test; what they hold and reach is.*

### R07-Q5 (R07-LO3, single choice)

A bidder sends an ISO 27001 certificate whose scope is "sales and customer success, London office". You're buying their cloud service. What do you do?

- A. Accept it: they're ISO 27001 certified. *Feedback: The certificate covers the sales office, not the service.*
- **B. Ask for evidence that covers the service you're buying.** *Feedback: Right. Always read the scope, the issuer and the dates.*
- C. Reject the bidder outright. *Feedback: Maybe not: ask first. They may have other evidence for the service.*

### R07-Q6 (R07-LO3, multiple select)

A supplier sends a Cyber Essentials certificate. What should you check? Choose all that apply.

- **A. That it's for the same legal entity you're contracting with.** *Feedback: Group companies often hold separate certificates.*
- **B. That it was issued within the last 12 months, on IASME's certificate search.** *Feedback: Certificates have to be renewed every year.*
- **C. Whether your tier needs Cyber Essentials Plus, which adds independent testing.** *Feedback: High-risk suppliers usually need Plus or equivalent evidence.*
- D. That it proves their hosting provider is secure too. *Feedback: It doesn't cover third parties. Ask separately.*

### R07-Q7 (R07-LO4, single choice)

A supplier offers to tell you about breaches "without undue delay". Why push for a number of hours?

- A. To catch them out later. *Feedback: The point is speed, not blame.*
- **B. Because our own clock to tell the ICO may start when we find out, so we need the facts quickly, and a number removes the argument.** *Feedback: Right. 24 hours, or 48 at most, is a common ask.*
- C. It makes no difference in practice. *Feedback: Without a number, you may read about your supplier's breach in the news before they tell you.*

### R07-Q8 (R07-LO4, single choice)

The bidder's answer about subcontractors is "our trusted partners". What do you ask for in the contract?

- A. Nothing: they're trusted. *Feedback: Trusted by whom? Their suppliers become ours.*
- **B. A named list of subcontractors, our approval before any change, and the same terms passed down.** *Feedback: Right. UK GDPR Art 28 requires our authorisation before a processor uses another processor.*
- C. A promise to choose good partners. *Feedback: A promise isn't something you can check.*

### R07-Q9 (R07-LO5, single choice)

The new supplier's engineer asks for "one permanent admin account for our support team, without MFA, because it breaks our tools". What do you do with IT?

- A. Set it up as asked: support needs to work. *Feedback: A shared, permanent account with no MFA is how supplier access gets abused.*
- **B. Named accounts for named engineers, with MFA, access only to what they support, switched on when needed and logged.** *Feedback: Right. IT will help make it work.*
- C. Refuse them any access. *Feedback: They may need some. Make it safe rather than impossible.*

### R07-Q10 (R07-LO5, single choice)

A supplier's contract ended last month. What still needs doing?

- A. Nothing: the contract has ended. *Feedback: Accounts, keys and data don't end with the paperwork.*
- **B. Remove every supplier account, key, VPN profile and delegation; rotate shared secrets; get the deletion certificate; update the register.** *Feedback: Right. Access ends when someone removes it.*
- C. Ask the supplier to delete their own accounts. *Feedback: They're our accounts on our systems. Remove them ourselves.*

### R07-Q11 (R07-LO6, single choice)

At 17:30 on a Friday, a supplier emails: some of your staff's data "may have been copied". What do you do?

- A. Leave it until Monday, when the supplier will know more. *Feedback: Our clock may already be running. Escalate now.*
- **B. Forward it now to the security team and the DPO (using the out-of-hours route), and ask the supplier the key questions.** *Feedback: Right. The same hour, every time.*
- C. Reply thanking them and wait for the full report. *Feedback: Waiting loses time we may not have.*

### R07-Q12 (R07-LO6, multiple select)

A supplier has reported a breach. Which questions do you put to them first? Choose all that apply.

- **A. What happened, and when?** *Feedback: The timeline matters for our own notifications.*
- **B. Whose data, and which of our systems, are involved?** *Feedback: That decides what we do next.*
- **C. What have you done to contain it, and what do we need to do?** *Feedback: Including whether to change keys or accounts.*
- D. Whose fault was it? *Feedback: That comes later, if ever. First get the facts.*

## Reflection prompt

- "Pick one supplier you manage. What does it hold, what can it reach, and how would you find out if it had a breach?"
- For facilitated sessions: "Which supplier would hurt us most if it stopped tomorrow, and what do our contracts say about that?"

## Completion and pass rules

- **Complete** when the learner has played through all beats (or the text route), shown each critical behaviour or been through the remediation loop for it (at most two loops), passed the knowledge check, and opened the reference card.
- **Pass mark:** 5 of 6 (the organisation can change it; 80% is the default).
- **Outcome ratings** follow the default rule in `features/assessment_and_evidence.md` section 3: Apply evidence counts double, the hook counts nothing, and an outcome whose critical behaviour was shown only after remediation is at most Developing.
- **Retakes:** a failed check draws six new items. After two fails, Harjit replays the Learn beat before the third attempt.
- **Test-out** (where the organisation allows it; recommended for annual renewals): the Apply beat and the check. It passes only if the check is passed and every critical behaviour is shown first time; otherwise the learner goes through the full module, with no "failed" label.
- **No micro-drill** by default (as in the catalogue).

## Evidence for auditors

The learner's record (HA-05) shows: module id and version, start and completion dates, time on task, route (game, text, test-out), each assessed behaviour's rating, critical behaviours shown or remediated, the check score, and whether the reference card was opened. This supports (short references from `02_COMPLIANCE_MAPPING.md`):

- ISO 27001 cl. 7.2 (documented evidence of competence for procurement and contract owners);
- NIST AT-3 (role-based training, which names acquisition and procurement officials), with individual records for NIST AT-4;
- CIS 14.9;
- NCSC CAF B6.b; DSPT 10.2.1 (supports, categories 3 and 4);
- NIS2 Art 21(2)(d) and NIS2 IR 5.1.4 where they apply; DORA Art 30(2)(i) for EU financial entities;
- UK GDPR Art 28 (context: staff know what a processor contract must contain);
- FTC 314.4(f) (supports) and CMMC AT.L2-3.2.2 for US customers.

It also shows that the people who buy and manage suppliers were trained in the organisation's supplier security process, which auditors look for under ISO 27001 A.5.19 to A.5.23 and NCSC CAF A4 (controls rather than training requirements).

## Measuring effect

Outside the course, an organisation can watch:

- **Supplier register coverage:** the share of suppliers with a tier, an owner and a review date.
- **Contracts with the key clauses:** the share of high-tier contracts with notice within hours, subcontractor approval, a deletion certificate, supplier access rules and yearly assurance.
- **Evidence kept current:** high-tier suppliers whose certificates and reports were re-checked before they expired.
- **Supplier accounts:** the share that are named, MFA-protected and time-limited, and the time from contract end to removal of every supplier account (from access reviews).
- **Supplier breach notices:** the time from arrival to the security team and the DPO.
- **Contract rights used** in supplier incidents: updates received on time, audits or reports requested.
- **The hook-to-Apply change** (R07-B1 against R07-B3) across the organisation in the course itself.

These need the supplier register, contract records, access reviews and the incident log, as well as the course record. The dashboard shows them by team, never by named individual below the privacy threshold (HA-09).
