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
- **Training before access.** The ICO expects induction training before new staff access personal information and within one month of starting. Book the time in the new starter's first week.
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
