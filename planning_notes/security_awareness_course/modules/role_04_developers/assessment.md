# role_04 assessment

## Assessed behaviours

Each row is recorded through BE-01 and shown in the debrief and the learner's record. Nothing is rated on reading speed; the Friday release is a story deadline that can't be failed.

| Id | Behaviour | Learning outcome | Where it is evidenced | Secure | Developing | Not yet |
|---|---|---|---|---|---|---|
| R04-B1 | Reviews Ines's logging change | LO4, LO1 (baseline) | Hook, H1 | Flags the log line and the key, and requests changes | Flags one of them; or approves with "move the key later" | Approves without comment |
| R04-B2 | Checks the package the assistant suggested | LO2, LO3 | Apply, test 1 | Checks the registry, uses the approved library and tells Kai about the invented name | Uses the approved library without telling anyone; or asks the assistant again before checking | Adds the invented name to the project |
| R04-B3 | Handles real personal data in the test database | LO6 | Apply, test 2 | Stops using it, tells Darius, reports it to Tomasz and uses the generator | Drops the database quietly | Uses it, or exports rows to a laptop |
| R04-B4 | Handles a secret that has left their machine | LO1, LO5 | Apply, test 3 | Rotates the key, replaces it with a secret reference and tells Kai | Deletes it in a new commit | Marks it as a false positive, or bypasses the block |
| R04-B5 | Reviews Ines's feature | LO4 | Apply, test 4 | Flags the missing ownership check and the query built from search text, with the right fixes, and requests changes | Catches one of the two | Approves with neither caught |
| R04-B6 | Handles the "maintainer" | LO5, LO2 | Apply, test 5 | Doesn't switch or grant access, checks the official project with Darius, reports the email | Ignores the email (safe, but nobody else is warned) | Switches to the fork, or grants any access |
| R04-B7 | Keeps branch protection on under pressure | LO5 | Apply, test 6 | Uses the emergency change route with a second approval | "It'll have to wait until tomorrow" | Switches protection off, or shares an admin token |
| R04-B8 | Handles the outside vulnerability report | LO6 | Three weeks later | Thanks the researcher, routes it to Kai through the disclosure process, keeps her updated | Fixes it quietly without telling anyone | Ignores it, or threatens the researcher |
| R04-B9 | Spots problems in short changes, and passes clean ones | LO1, LO2, LO4, LO6 | Practise | 7 or 8 of 8 | 5 or 6 | 4 or fewer |

Flagging test 4's harmless refactor as well as both real problems is still Secure; the debrief calls it out gently, because over-flagging slows teams down but doesn't ship bugs.

The **before and after** is R04-B1 against R04-B5: a teammate's change reviewed under release pressure, first twelve lines before any teaching, then forty lines in the mission.

## Critical behaviours

To complete the module the learner must show each of these, or be taken back through the practice for it:

- **R04-CB1 Rotates a leaked secret instead of only deleting it or bypassing the block** (R04-B4 at Secure).
- **R04-CB2 Doesn't add a package without checking that it exists and is the one intended** (R04-B2 not at Not yet).
- **R04-CB3 Reports real personal data found in a test system** (R04-B3 at Secure).

**The remediation loop** follows `features/assessment_and_evidence.md`, section 4. If a critical behaviour wasn't shown, the debrief says what happened without blame and Darius offers to go over it: *"That one gets most of us at least once. Let's do it again."* He replays the matching Learn card (one to two minutes), then a fresh case of the same kind arrives in a short replay (one to three minutes), drawn from the bank: a token in a build log (CB1); an assistant suggesting a lookalike of a popular package (CB2); a spreadsheet of real school contacts in a test fixture folder (CB3). Shown: recorded as "shown after practice", and the linked outcome is capped at Developing for this sitting. Not shown: a second loop with another fresh case and a more direct prompt. After two loops the learner goes on to the check; the record says "practised, not yet shown", a private follow-up drill ("Diff or Dud?") is scheduled two to four weeks later (HA-03, HA-21), and nobody else is told by name. Every attempt is kept.

## Knowledge check bank

Six items per sitting, drawn so that every learning outcome is covered. Stems are short situations from a developer's week. Every outcome has at least two items: LO1 (R04-Q1, Q2), LO2 (R04-Q3, Q4), LO3 (R04-Q5, Q6), LO4 (R04-Q7, Q8), LO5 (R04-Q2, Q9, Q10), LO6 (R04-Q11, Q12).

### R04-Q1 (LO1, single choice)

An hour ago you pushed a cloud key to a private repository by mistake. You've already removed it in the next commit. What now?

- A. Nothing: it's removed, and the repository is private. *Feedback: The old commit, every clone and any build log still hold it.*
- **B. Rotate the key straight away, then tell the security team; clean up the history if your team does that.** *Feedback: Right. Rotating makes every copy useless. Deleting doesn't.*
- C. Rewrite the history so the commit disappears. *Feedback: Copies made before the rewrite still work until the key is rotated.*

### R04-Q2 (LO1, LO5, single choice)

The secret scan blocks your push an hour before the release. The flagged line is a real storage key. What do you do?

- **A. Move it to the secrets manager, rotate the key if it has left your machine, and push again.** *Feedback: Right. The block just saved you a rotation, or told you that you need one.*
- B. Bypass the block: the repository is private and the release can't wait. *Feedback: A bypass under pressure is how keys end up in public.*
- C. Mark it as a false positive. *Feedback: It isn't one, and the next scan will trust that line.*

### R04-Q3 (LO2, LO3, single choice)

Your AI assistant suggests installing `papyrus-pdf-invoices`. The registry has no package by that name. What do you do?

- A. Publish a package with that name yourself, so nobody else can. *Feedback: Not your job, and now there's an unreviewed package with your name on it.*
- **B. Use the approved library instead, and tell the security team about the invented name so they can block it.** *Feedback: Right. Assistants invent names, and attackers register them.*
- C. Wait a few days: it'll probably appear. *Feedback: If it appears, a stranger will have written it.*
- D. Install the closest-sounding package instead. *Feedback: That's exactly what lookalike names are waiting for.*

### R04-Q4 (LO2, multiple select)

Before adding a new dependency, which checks matter? Choose all that apply.

- **A. The name exactly matches the official project's own site or repository.** *Feedback: Right. One letter can be the difference.*
- **B. It comes through the approved registry or proxy.** *Feedback: Right. That's what stops an internal name being fetched from a public registry.*
- **C. It's maintained, with a sensible release history and known maintainers.** *Feedback: Right.*
- **D. Whether it runs scripts when it's installed.** *Feedback: Right. Install scripts run with your permissions.*
- E. Its README looks professional. *Feedback: Anyone can write a good README.*

### R04-Q5 (LO3, single choice)

You want help with an error. The stack trace includes a database connection string and some customers' email addresses. What do you give the assistant?

- **A. The error with the connection string and the email addresses removed, in the approved assistant.** *Feedback: Right. No secrets or customer data in prompts.*
- B. All of it, in the approved assistant: it's approved. *Feedback: Approved tools still shouldn't hold secrets or more personal data than needed.*
- C. All of it, in a free public chatbot that's better at this language. *Feedback: Unapproved tools may keep what you paste.*

### R04-Q6 (LO3, true or false with reason)

"Code from an AI assistant is probably secure, because it learned from millions of examples."

- A. True: it has seen more code than any developer. *Feedback: It has seen plenty of insecure code too.*
- **B. False: flaws are common in assistant-written code, and assistants can invent packages. Review and test it like a stranger's code.** *Feedback: Right. That's the advice from Germany's and France's national cyber security agencies.*

### R04-Q7 (LO4, single choice)

A change adds an invoice download: once a user is logged in, it looks up the invoice by the number in the link and returns it. What's missing?

- A. Nothing: only logged-in users can reach it. *Feedback: Logged in isn't the same as allowed to see this invoice.*
- **B. A check, on the server, that the invoice belongs to the user's school.** *Feedback: Right. Check permission for the record on every request.*
- C. Hiding the invoice number from the link. *Feedback: Hiding isn't checking. Someone will guess or find the numbers.*

### R04-Q8 (LO4, single choice)

A teammate's search feature joins the text from the search box into the database query. What do you say in the review?

- A. Approve: only logged-in users can search. *Feedback: Logged-in users can still type anything.*
- **B. Request changes: use a parameterised query or the library's safe call.** *Feedback: Right. Input stays data, never part of the query.*
- C. Ask them to strip out quotation marks. *Feedback: Filtering alone is fragile. Parameterise.*

### R04-Q9 (LO5, single choice)

An email from someone who says they co-maintain a library you use asks you to switch to their fork this week and give them access to your repository "to help". What do you do?

- A. Switch: they're a maintainer. *Feedback: You can't tell that from an email. Taking over trust is how the XZ Utils backdoor began.*
- B. Give read access only. *Feedback: Access is access, and it's a foothold.*
- **C. Check the project's official repository and announcements with your lead, don't switch or grant anything, and report the email to security.** *Feedback: Right. Friendly, urgent and asking for access are the warning signs.*

### R04-Q10 (LO5, single choice)

At half past five a colleague asks you to switch off branch protection for ten minutes to push an urgent fix. What do you do?

- A. Switch it off and remember to turn it back on. *Feedback: Unreviewed changes to the main branch are what protection exists to stop.*
- **B. Use the emergency change route: review it now and get the second approval from whoever is on call.** *Feedback: Right. Fast and still reviewed.*
- C. Lend them your admin token. *Feedback: Never share credentials, and personal admin tokens don't belong in a hurry.*

### R04-Q11 (LO6, single choice)

You find real care home residents' names and dates of birth in the shared test database. A colleague copied it from production to chase a bug. What do you do?

- A. Use it this once: it's only test. *Feedback: Real people in test are still real people, in a place with weaker locks.*
- B. Delete it quietly so nobody gets into trouble. *Feedback: It might need to be handled as a breach, and other copies may exist. Report it.*
- **C. Stop using it, tell your lead and the DPO, and use synthetic data.** *Feedback: Right. Nobody is in trouble for reporting, including your colleague.*

### R04-Q12 (LO6, single choice)

A researcher emails support: they can open other schools' invoices by changing a number in a link. What do you do?

- **A. Thank them and pass the report to the security team through the disclosure route.** *Feedback: Right. A report is help, not an attack.*
- B. Fix it yourself quietly and don't reply. *Feedback: Fix it, but tell security: the researcher may not be the only one who knows.*
- C. Warn them that testing your portal is illegal. *Feedback: Threats stop people reporting, and the next person might not.*

## Reflection prompt

- "Where in our own week do we approve things because the release train is leaving, and what would make a proper review easier?"
- For facilitated sessions: "If a key leaked from our repository tonight, who would rotate it, and how would they know?"

## Completion and pass rules

- **Complete** when the learner has played all beats (or the text route), shown each critical behaviour or been taken back through the practice for it (two loops at most), passed the knowledge check, and opened the developer's card.
- **Pass mark:** 5 of 6 (the organisation can change it; 80% is the default).
- **Retakes:** a failed check draws six new items. After two fails, Darius's Learn beat replays before the third attempt.
- **Test-out** (where the organisation allows it): the Apply beat and the check without Learn and Practise. Missing a critical behaviour sends the learner through the full module, with no "failed" label.

## Evidence for auditors

The learner's record (HA-05) shows: module id and version, start and completion dates, time on task, route (game, text, test-out), each behaviour's rating, critical behaviours shown, shown after practice, or practised and not yet shown, the check score, the language of the diffs used, and whether the developer's card was opened. This supports:

- NIST AT-3 and CIS 14.9;
- ISO 27001 cl. 7.2 and ISO 27001 A.6.3;
- NCSC CAF B6.b, and DSPT 3.3.1 for NHS customers;
- PCI DSS 6.2.2, in part;
- NIS2 IR 8.2 where the Implementing Regulation applies, and DORA Art 13(6);
- UK GDPR Art 32;
- AI Act Art 4, in part and with core_15;
- CMMC AT.L2-3.2.2 and SOC 2 CC1.4 for US customers.

The record is awareness-level evidence. It does not show the language-specific secure coding training that PCI DSS 6.2.2 requires at least every 12 months; for that, add the records from Hacktivity's Web Security or Software Security courses, or the organisation's own secure coding training.

## Measuring effect

Outside the course, an organisation can watch:

- **Secret scanning:** alerts per month and, above all, push-block bypasses, which should fall; and time from a leaked secret to its rotation, which should fall.
- **Dependencies:** new dependencies added outside the approved route, and packages blocked at the proxy (rising at first is a good sign).
- **Review:** the share of merged changes with a review comment on security, and changes merged without the required approvals (aiming for none).
- **Test data:** real personal data found in non-production systems in audits, aiming for none, and reports of it, which should rise before they fall.
- **Disclosure:** time to acknowledge outside vulnerability reports.
- **Accounts:** the share of developers with phishing-resistant MFA on the code host and the package registry.

These come from the code host, the secret scanner, the package proxy and the security team's records. They are reported by team, never used to rank individual developers, and an honest report of a leaked secret is never counted against the person who made it.
