# role_05 concepts: People managers and HR

This file is the source of truth for the module. The game, the explainers, the knowledge check and the reference card must all match it. Data protection law is taught in core_05 and insider risk in core_14; this module covers what managers and HR staff do with them.

## Key messages

1. **Access follows the job, not the person.** Give a new starter what their role needs, not a copy of someone else's access. Temporary access gets an end date.
2. **Movers lose their old access the day they move. Leavers lose everything by the end of their last day:** accounts, devices, badge, keys, the codes they know, and accounts on other organisations' systems. Work data stays with us.
3. **Review your team's access when asked, and mean it.** Remove what isn't needed. If you don't know what something is, ask its owner rather than guess.
4. **Check every new hire the same way.** A video call isn't an identity check. Original documents, the right to work check, and history verified through contact details you find yourself. Doubts go to HR and security.
5. **When someone tells you they've made a mistake, say "thank you", get it reported straight away and support them.** How you react decides whether anyone tells you next time.

## Concepts

### Why managers matter

- **Managers start and stop access.** IT and HR act on what managers tell them. If nobody says a contractor's project has ended, the contractor's account carries on.
- **Managers set the culture.** The NCSC's cyber security culture principles (June 2025) include "Build the safety, trust and processes to encourage openness around security" and "Leaders take responsibility for the impact they have on security culture". The NCSC describes psychological safety as the "belief that one will not be punished or humiliated for speaking up with ideas, questions, concerns or mistakes", and says "People need to feel safe from negative repercussions before they will speak up."
- **Regulators look for it.** Under the NCSC Cyber Assessment Framework, a culture where people believe reporting may get them into trouble is "Not achieved" (CAF B6.a).

### Joiners: the least access from day one

- **Least privilege** means the minimum access needed to do the job. More can be added later, quickly, when there's a reason.
- **Copying someone else's access** ("same as Des") is the commonest way access piles up. The person being copied has years of extras: old projects, cover for colleagues, admin rights given once and never removed.
- **Role templates** (a standard set of access for each job) make the right choice the quick one.
- **Temporary staff, agency workers and contractors** get named accounts (never a shared login) and an end date set when the access is requested.
- **Training before access.** The UK regulator, the Information Commission (the ICO), expects induction training before new staff access personal information and within one month of starting. Book the time in the new starter's first week.
- **New starters are targets.** Fake "welcome, confirm your payroll details" emails arrive in the first week (core_00 and core_01). Tell new starters that HR will never ask for bank details by email.

### Movers

- **Access creep.** People who change jobs keep their old access unless someone removes it. After a few moves, they can do far more than any one job needs.
- **Toxic combinations.** Some pairs of access should never sit with one person. Someone who can raise orders in one team and approve payments in another can commit fraud without anyone else seeing it. Separating these duties is a basic control (core_11 and role_02).
- **On move day:** the old manager asks for the old access to be removed, sets up an automatic reply or forwarding for the old role's mail (rather than letting the person keep the mailbox), and makes sure the handover happens.

### Leavers

- **Same-day removal.** Accounts are disabled at the end of the last working day, or at once if someone leaves suddenly or on bad terms.
- **The checklist is wider than IT:**
  - accounts, including cloud services and accounts on customers' and suppliers' systems in the person's name;
  - laptop, phone, security keys and tokens, badge;
  - physical keys, and **the codes they know** (key safes, alarm codes, door codes, shared passwords), which must be changed;
  - their name and mobile number on other people's lists (key holder lists, supplier contacts, alarm call lists);
  - their mailbox: an automatic reply, a colleague's delegated access for a set time under the organisation's policy, then closure;
  - work email or apps on a personal phone, removed;
  - the handover: who to call for what.
- **Data stays.** Work data, including contact lists of customers and colleagues, belongs to the organisation. Most leavers who take data mean no harm (a goodbye list, a useful template), but it is still personal data leaving the organisation's control. Some take it on purpose: it is an offence under section 170 of the Data Protection Act 2018 to obtain, disclose or retain personal data without the controller's consent, knowingly or recklessly, and to sell it. Insider risk in depth is core_14.
- **Keep it kind.** Most leavers go on good terms. The checklist protects them too: nobody can misuse an account that no longer exists.

### Access reviews

- **What it is:** a regular check, by the people who know the work, that everyone still needs the access they have. Also called recertification.
- **What to look for:** leavers, temps and contractors whose accounts remain; movers with old access; shared or generic accounts (nobody can tell who did what); admin rights nobody uses; senior people's access, which is often never reviewed; accounts you don't recognise.
- **Ask before removing what you don't understand.** Some accounts run systems (service accounts). Removing one can stop a backup or a nightly job. Ask the owner or the service desk.
- **Don't rubber-stamp.** The NCSC's guidance is to "Review user accounts and systems for unnecessary privileges on a regular basis", and says temporary accounts "should also be removed or suspended when no longer required".

### Recruitment fraud and borrowed identities

- **What it is:** people applying under false or borrowed identities. Variations include a proxy who attends the interview for someone else, video altered with face-swap or voice tools, references from friends posing as former employers, and company laptops sent to a "laptop farm" so the worker can log in from somewhere else.
- **The official warnings:**
  - **OFSI (HM Treasury), September 2024:** it is "almost certain" that UK firms are being targeted by North Korean IT workers posing as freelancers from other countries. Red flags it lists include inconsistent or changing name spelling, nationality, location, contact details, work history and online presence; refusal to appear on camera or join video interviews or meetings; asking for equipment to be sent to an address that isn't on their identity documents; asking to be paid into an account in someone else's name; and logins to one account from many IP addresses in a short time. Its mitigations include video interviews, checking identity documents for forgery, verifying contact details, employment and education history, flagging workers who can't receive equipment at the address on their ID, and limiting access on a need-to-know basis. Employing or paying such workers can breach UK financial sanctions, which can be a criminal offence with up to seven years' imprisonment.
  - **FBI, June 2022:** applicants for remote IT jobs used deepfakes and stolen personal information; in interviews, "the actions and lip movement" of the person on camera did not match the audio, and background checks found the personal details belonged to someone else.
  - **FBI, January 2025:** North Korean IT workers had moved into stealing data and extorting employers. It recommends identity verification "during interviewing, onboarding" and throughout employment, cross-checking applicants for shared CV content or contact details, and completing "as much of the hiring and onboarding process as possible in person". It lists changes of address or payment platform during onboarding, and face-swapping in video interviews, as warning signs.
- **The UK right to work check** (Home Office employer's guide, 1 October 2026): the employer must be satisfied that the person checked is the person who will do the work. Documents are checked in the holder's presence, in person or by live video link, with the employer holding the original document; a scan or screenshot isn't enough except for official digital evidence. Doubts are raised with the person "in a sensitive and proportionate manner". The rules changed on 1 October 2026 to cover more kinds of worker, so HR decides which check applies.
- **Fairness.** Apply the same checks to every candidate. It is unlawful to discriminate on protected characteristics, including race, when doing right to work checks. The clues are inconsistencies and refusals, never someone's nationality, accent or appearance. A patchy video call from a rural broadband connection is not a red flag; refusing to show an original document is.
- **What a manager does:** make sure the standard checks are done before an offer or a start date, whatever the agency says; check employment history through contact details you find yourself; send equipment only to the verified address; pay only into an account in the worker's own name; tell HR and the security team about doubts. Don't confront or accuse.

### HR and health information

- **HR records hold some of the most sensitive data an organisation keeps.** Health, ethnicity, religion, sexual orientation and trade union membership are special category data, and criminal records are criminal offence data. Both need extra protection under UK GDPR (core_05).
- **Need to know.** A manager needs what lets them manage: absence dates, agreed adjustments, return-to-work plans. Diagnoses and medical details stay with HR and occupational health. A new manager asking "anything I should know about their health?" is pointed to HR or to the person themselves.
- **Keep it in the HR system.** Not in a private spreadsheet, a notebook in an unlocked drawer, or an email to a group of managers.
- **Monitoring staff** has to be lawful, necessary and proportionate, and is normally done openly. Whether to monitor anyone is a decision for HR and the DPO, never a manager acting alone (ICO, "Monitoring workers").
- **Requests for records.** A member of staff asking for a copy of their HR file is making a subject access request: pass it to the DPO straight away (core_05).

### Raising a concern about a colleague

- **Most insider incidents are mistakes or well-meant shortcuts.** A few are deliberate (core_14). A manager can't tell which from the outside, and doesn't have to.
- **Do:** write down what you saw (facts, dates, what was said), tell HR and the security team or use the whistleblowing route, keep it confidential, and carry on treating the person normally.
- **Don't:** investigate yourself, search their mailbox or files, ask IT to "keep an eye on them", confront or accuse them, or tell anyone else.
- **Think about the person.** People under pressure (money worries, illness, a grievance) are more likely to cut corners and more likely to be targeted. Support is part of the response.
- **Fix the system, not only the person.** NHS England's "Being fair" tool (2025) starts with a substitution test: would others in the same role, with the same training and in the same circumstances, have acted the same way? If so, the cause is the system, and blaming one person changes nothing.

### When someone tells you about a mistake (just culture)

- **A just culture** is fair, open and focused on learning. NHS England's information governance guide defines it as "one that supports fairness, openness and learning", so staff "feel confident to speak up rather than fearing blame", while still holding people to account for gross negligence or deliberate acts.
- **The NCSC's version:** "Incidents are investigated with a view to learn and improve, not to blame", and "People involved in an incident are treated fairly, with no punishment for innocent mistakes." It also says: "Follow up with reporters to thank them and provide feedback on any action taken."
- **The manager's four steps:**
  1. **Thank them.** "Thanks for telling me" comes first, before any question.
  2. **Act now.** Report it together, straight away, through the normal route. Minutes matter more than the mistake (core_04).
  3. **Support them.** Stay with them while it's sorted. No "how could you", no sighing, no "I'll have to tell HR".
  4. **Learn.** Ask what made the slip easy (end of a long day, two people's work, a convincing email) and fix that. Share the lesson with the team only with their agreement, or without their name.
- **What not to do:** name people who clicked in team emails or league tables, treat a reported click as a disciplinary matter, or use training as a punishment. Each of these teaches people to stay quiet, and silence is what turns a small incident into a large one.

### Making time for training

- **Protect the time.** Book it in the diary and cover the phones. "Just click through it" tells the team that security doesn't matter here.
- **Training records matter.** The NCSC framework expects each person's training to be tracked and refreshed, and treats success measured only by how many people completed it as "Not achieved" (CAF B6.b). Managers make sure their people do the training properly.
- **Talk about it.** A two-minute "near miss of the week" in a team meeting normalises reporting.

## What to do (the procedure)

As the reference card shows it:

**Joiners**
1. Request access from the role template, not a copy of someone else's. Add an end date for temporary staff and contractors.
2. Book time for induction training in week one, before access to personal data.

**Movers**
3. On move day, remove the old access, set up forwarding for the old role's mail, and agree the handover.

**Leavers**
4. Tell HR and the service desk as soon as you know the date.
5. On the last day: accounts off; devices, badge and keys back; shared codes changed; names taken off other people's lists; work data stays.

**Access reviews**
6. Remove what isn't needed. Ask the owner about anything you don't recognise. Never rubber-stamp.

**Hiring**
7. Same checks for every candidate: original ID seen, right to work checked, history verified independently, equipment only to the verified address, pay only into the worker's own account.
8. Doubts go to HR and the security team, not into a quiet rejection.

**When someone tells you about a mistake**
9. "Thanks for telling me." Report it together now. Support them. Learn from it without blame.

**Concerns about a colleague**
10. Note the facts and tell HR and the security team. Don't investigate it yourself.

**HR information**
11. Share only what someone needs to know, through HR.

## Misconceptions and outdated advice

| Belief | The current position |
|---|---|
| "Give them the same access as the person they're replacing." | That copies years of extras. Use the role template and add what's missing when there's a reason. |
| "IT deals with leavers." | IT acts on what HR and managers tell it, and can't see keys, codes, other organisations' portals or names on call lists. The manager owns the checklist. |
| "Leave a leaver's email on for a few weeks so they can say goodbye." | Send the goodbye before they go, and set an automatic reply. Access after leaving is a risk to the organisation and to them. |
| "Movers might need their old access for a while." | Forward the mail and hand over the work. Keeping both old and new access can break separation of duties. |
| "Access reviews are box-ticking." | They're how stale accounts are found. Most reviews find something. |
| "A video interview proves who someone is." | Interviews can be attended by a proxy or altered with face-swap tools (FBI, 2022 and 2025). Identity is checked with original documents and the right to work check. |
| "A clear background check means they are who they say." | A stolen identity has a clean history. KnowBe4's fake hire passed its background check in 2024. |
| "If a candidate won't turn their camera on, reject them." | Refusal is a red flag to pass to HR, not a verdict. Run the standard checks; a quiet rejection can't be reported and may be unfair. |
| "Someone who clicked a phish should be disciplined so they learn." | Innocent mistakes aren't punished (NCSC). Punishment teaches hiding, and delay causes the damage. |
| "As their manager, I should look into a concern myself first." | Investigating, searching mailboxes or monitoring is for HR, security and the DPO, under the organisation's policy. |
| "Managers need to know the details of a team member's health." | Managers need dates and adjustments. Health details stay with HR and occupational health. |

## Real cases

Use these as background and inspiration only. Game content uses fictional names.

- **KnowBe4, 2024.** A remote software engineer hired after four video interviews and a background check used a stolen US identity and an AI-altered stock photo. Malware began loading on the company laptop on arrival; monitoring caught it and the laptop was contained the same evening. (KnowBe4 blog, 23 July 2024, updated October 2024.)
- **OFSI advisory on North Korean IT workers, 2024.** HM Treasury's Office of Financial Sanctions Implementation warned UK firms, with red flags and mitigations for employers, freelance platforms and payment firms. (GOV.UK, first published 12 September 2024.)
- **FBI public service announcements, 2022 and 2025.** Deepfakes and stolen personal information used to apply for remote IT jobs (I-062822-PSA, 28 June 2022); North Korean IT workers stealing data and extorting employers (I-012325-PSA, 23 January 2025).
- **Leaseline Vehicle Management, 2024.** A sales consultant took more than 3,600 pieces of customer information shortly before resigning and offered them to competitors, claiming the data was his. He pleaded guilty under section 170 of the Data Protection Act 2018 at St Albans Crown Court and was fined £1,200 with £300 costs. (ICO news, 17 September 2024.)

## Organisation-specific slots

| Slot | Default (Larkspur) |
|---|---|
| Leaver deadline | Accounts disabled at the end of the last working day; at once for sudden departures |
| Who raises joiner, mover and leaver requests | The line manager, through the service desk portal, with HR copied |
| Role templates | One per job title, owned by the department head and the service desk |
| Access review | Every quarter for each team, signed off by the manager and the system owners |
| Screening policy | Identity and right to work seen with original documents, in person or by live video; two references checked through contact details HR finds independently; criminal record checks only where the role needs them |
| Contractors and agency workers | Named accounts, end dates, the same identity checks, equipment only to the verified address |
| Statement on mistakes | "Nobody at Larkspur is disciplined for reporting a security mistake. Hiding one is different." |
| HR information | Absence reasons and health information in the HR system, seen by HR and occupational health; managers see dates and agreed adjustments |
| Routes | The security team on extension 4444; the HR business partner; the DPO; the whistleblowing line |

## Glossary

- **Least privilege:** giving someone only the access their job needs.
- **Role template:** the standard set of access for a job.
- **Access creep:** access building up as people change jobs and nobody removes the old.
- **Joiner, mover, leaver:** someone starting, changing role, or leaving; the three moments access must change.
- **Access review (recertification):** a regular check that everyone still needs the access they have.
- **Shared account:** one login used by several people, so nobody can tell who did what.
- **Service account:** an account a system uses to run itself, such as a nightly backup.
- **Separation of duties:** splitting tasks such as raising and approving a payment between different people.
- **Right to work check:** the UK check that someone may legally work here, done with original documents or the Home Office online service.
- **Proxy (in hiring):** someone who attends an interview or a check in place of the real applicant.
- **Laptop farm:** a place where company laptops are kept switched on so workers elsewhere can log in through them.
- **Deepfake:** video or audio altered to make someone look or sound like someone else (core_15).
- **Just culture:** a culture that is fair, open and focused on learning, which holds people to account for deliberate or reckless acts, not honest mistakes.
- **Psychological safety:** feeling able to speak up about mistakes and concerns without being punished or humiliated.
- **Special category data:** personal data needing extra protection, such as health, ethnicity, religion or trade union membership (core_05).

## Sources

- NCSC, "10 Steps to Cyber Security: Identity and access management" (May 2021): https://www.ncsc.gov.uk/collection/10-steps/identity-and-access-management
- NCSC, "Cyber security culture principles" (June 2025): https://www.ncsc.gov.uk/collection/cyber-security-culture-principles, and principle 2: https://www.ncsc.gov.uk/collection/cyber-security-culture-principles/principle-2
- NCSC Cyber Assessment Framework v4.0, principle B6: https://www.ncsc.gov.uk/collection/cyber-assessment-framework/caf-objective-b/principle-b6-staff-awareness-and-training (see `02_COMPLIANCE_MAPPING.md`)
- OFSI, "North Korean IT workers advisory: signs to watch for" (first published 12 September 2024): https://www.gov.uk/government/publications/north-korean-it-workers-advisory-signs-to-watch-for
- FBI, "North Korean IT Workers Conducting Data Extortion", I-012325-PSA (23 January 2025): https://www.ic3.gov/PSA/2025/PSA250123
- FBI, "Deepfakes and Stolen PII Utilized to Apply for Remote Work Positions", I-062822-PSA (28 June 2022): https://www.ic3.gov/PSA/2022/PSA220628
- US Department of State, Treasury and FBI, "Guidance on the Democratic People's Republic of Korea Information Technology Workers" (16 May 2022): https://ofac.treasury.gov/recent-actions/20220516
- KnowBe4, "How a North Korean Fake IT Worker Tried to Infiltrate Us" (23 July 2024): https://blog.knowbe4.com/how-a-north-korean-fake-it-worker-tried-to-infiltrate-us
- Home Office, "Employer's guide to right to work checks" (1 October 2026): https://www.gov.uk/government/publications/right-to-work-checks-employers-guide
- ICO, employment guidance (including "Monitoring workers", "Information about workers' health" and "Keeping employment records"): https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/
- ICO, "Guilty car salesman fined for retaining and selling data to competitors" (17 September 2024): https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2024/09/guilty-car-salesman-fined-for-retaining-and-selling-data-to-competitors/
- Data Protection Act 2018, section 170: https://www.legislation.gov.uk/ukpga/2018/12/section/170
- NHS England, "A just culture guide for information governance and cyber security": https://digital.nhs.uk/data-and-information/information-governance/guidance/a-just-culture-guide-for-information-governance-and-cyber-security
- NHS England, "Being fair tool: supporting staff following a patient safety incident" (2025): https://www.england.nhs.uk/long-read/being-fair-tool/

On 30 September 2026 the Information Commission replaced the Information Commissioner; it keeps the ICO name, and its guidance and powers carry on (`02_COMPLIANCE_MAPPING.md`, section 3.10).
