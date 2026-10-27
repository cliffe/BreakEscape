# core_00 concepts: First day

This file is the source of truth for the module. The first-play brief, the host's welcome, the concept cards and the checks must all match it. Most topics here are previews: the module that teaches each one in depth is named, and its `concepts.md` wins if the two ever differ.

## Key messages

1. **Everyone has access to something worth stealing.** Your email, your logins, the customer and staff data you can see, the payments you can approve, the trust of everyone you work with. Most attackers are criminals after money, and they don't need you to be important.
2. **Most attacks start with a message, a call or a stolen password,** and they turn up in the middle of normal work.
3. **The habit to keep.** When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do. Report anything odd.
4. **Reporting is never wrong.** Report when you're not sure, and especially after your own mistake. You'll be thanked, not blamed. Speed matters more than the slip.
5. **Know your route.** Emails: the report button. Anything else: the security team or the service desk. The customer's own reporting route is shown in every debrief (the `customer_report_route` slot).

## Concepts

### Why anyone would target you

- **Most attackers are criminals after money.** Ransomware (locking an organisation's systems and threatening to publish its data unless it pays) was present in 44% of the breaches Verizon analysed for its 2025 Data Breach Investigations Report, with a median ransom paid of US$115,000. The NCSC's Annual Review 2025 recorded 204 nationally significant incidents in the year to August 2025, up from 89 the year before.
- **Most of it isn't personal.** Bulk attacks go to thousands of people at once, and whoever responds becomes the way in. Being junior, new or "not in IT" doesn't make anyone safe.
- **What your access is worth:**
  - your **email account** can send convincing messages to everyone you know, inside and outside the organisation (core_01, core_11);
  - your **logins** open shared drives, the customer portal and the HR system (core_03);
  - the **personal data** you can see is worth money to fraudsters, and losing it hurts the people it's about (core_05);
  - your **approval or say-so** can move money or change bank details (core_11);
  - your **badge** opens doors (core_10).
- The short version: they don't want *you*, they want what you can open.

### How attacks usually start

- **A message.** Phishing is by far the most common kind of attack UK organisations identify: 38% of businesses and 25% of charities had one in the year covered by the Cyber Security Breaches Survey 2025/2026 (core_01).
- **A call or a text.** People on the phone pretending to be IT, a supplier or a manager, and texts pretending to be someone you know (core_02). In 2025, attackers reportedly got into Marks and Spencer by impersonating staff in calls to IT support (see Real cases).
- **A stolen or guessed password,** often reused from another site, especially where there is no multi-factor authentication. Credential abuse was the leading way in (22%) in Verizon's 2025 analysis, just ahead of exploiting software vulnerabilities (20%), which is why updates matter too (core_03, core_07).
- **Someone at the door** with a good story (core_10).
- The common thread: a person is asked to do something (click, sign in, pay, share, open the door) while they're busy doing something else. That's why the defence is a habit, not a list of things to spot.

### Why new starters get extra attention

- New starters don't yet know who people are, how things are normally done, or what's unusual. Everything is new, so nothing looks odd.
- People announce new jobs online. Criminals are reported to use those posts to send "welcome" messages that pretend to come from the new starter's manager ("send me your personal mobile so I can add you to the team group"), from a senior leader ("quick favour, keep it between us", ending in a request for gift cards: core_02) or from HR ("confirm your bank details so your first salary isn't delayed"). A new starter can't yet tell a real colleague from a fake one, which is exactly why these work. The US Federal Trade Commission's consumer alert "New job? How to spot boss imposter scams" (July 2025) describes exactly this pattern: scammers posing as a new boss who asks for personal details or money soon after someone starts a job. This pattern is widely reported by employers' own security teams; we found no UK government figures for it, so don't quote numbers.
- The UK government's Stop! Think Fraud campaign warns businesses about salary diversion, where fraudsters pose as employees to get payroll to change bank details, and advises always confirming bank detail changes using a known phone number. The module's fake payroll email is the same fraud aimed at the employee instead (core_11 covers payment fraud in depth).
- The answer for a new starter is the same as for anyone, and easier than it sounds: **you're allowed to ask.** Nobody expects a new starter to know whether a request is normal, so checking with a colleague is the obvious move.

### The habit to keep (the shared rule of thumb)

The built episodes end every debrief on one rule of thumb, identical in all shells and enforced by a test. It replaces any motto; "Pause. Check. Report." is not used. Quote it word for word:

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

In plain parts, which the previews below expand on:

- **Pause** when something is:
  - **unexpected** (you weren't waiting for it, or it doesn't fit how this person normally gets in touch);
  - **urgent** ("today", "before 5pm", "or your account closes");
  - **secret** ("keep this between us", "don't tell IT");
  - **asking for money, data, codes or access** (a payment, gift cards, bank details, a password, an MFA code, a file, remote access, a door held open).
  One of these is enough to pause. Two or more together is a strong sign.
- **Check** through a channel you already trust: a number from the staff directory or the supplier record, a colleague in person, a bookmark, the intranet. **Never** use the phone number, link or reply address in the message, because the attacker controls those.
- **Report** anything suspicious, straight away, through the organisation's route. Including when you're not sure. Including when you've already clicked, replied or typed something.

Pausing costs a minute. Not pausing can cost the organisation weeks.

### Channels you already trust

The point of "check" is to use a route the attacker doesn't control (core_01 explains why this beats spotting clues):

| Trusted | Not trusted |
|---|---|
| The staff directory on the intranet | A number in the email, text or caller's voicemail |
| Walking over to the person, or calling the number you already have | Replying to the message, or the "new number" it came from |
| Your bookmark, or the company app | A link in the message |
| The supplier record in the finance system (core_11) | Contact details on the letter or invoice that asks for the change |
| A colleague or your manager | The person who's asking, vouching for themselves |

### How to report here

- **Emails:** the **Report suspicious** button in the mail client (organisation slot). It sends the email to the security team with its hidden details intact and takes it out of your inbox. Don't forward suspicious emails to colleagues to ask "is this real?": that spreads them.
- **Anything else** (a text, a call, a visitor, a lost badge, a strange pop-up, a mistake you've made): the organisation's security team, or the 24/7 service desk (organisation slots). If in doubt which, the service desk will pass it on.
- **Personal data involved** (sent to the wrong person, lost, seen by someone who shouldn't): report it the same way; the DPO is brought in through the same route (core_05).
- **What to say:** what happened, when, and what you've done so far. A rough report now beats a perfect one later (core_04 covers what to include).
- **On your own phone, for scams that aren't about work:** forward scam texts to 7726, free, and suspicious emails to the NCSC's Suspicious Email Reporting Service at `report@phishing.gov.uk` (core_01, core_02). If you've lost money, call your bank, then Report Fraud (which replaced Action Fraud on 4 December 2025: reportfraud.police.uk or 0300 123 2040) in England, Wales and Northern Ireland; in Scotland, Police Scotland on 101.

### What happens after a report

The security team's version, for the learner:

1. The security team (or the 24/7 monitoring partner, out of hours) looks at it, usually within minutes.
2. If it's harmless, you get a thank-you and, sometimes, a tip on how you could have checked.
3. If it's an attack, they pull the same email out of every inbox, block the sender and any fake website, warn people, and if anyone has clicked or typed a password, lock the account and help them reset it.
4. If personal data is involved, the DPO assesses whether it's a breach the organisation must report to the Information Commission (the ICO) within 72 hours (UK GDPR Art 33; core_04 and core_05).
5. Reports also tell the team what's getting past the filters, so the next one is caught earlier.

The first report protects everyone else who got the same message. In a large long-term study of phishing in one organisation, staff reports detected campaigns quickly and reliably (Lain, Kostiainen and Čapkun, 2022; see core_01).

### No blame

- **Reporting a mistake is the right thing, and it's what the course rewards most.** Most damage comes from the delay, not the click.
- The NCSC's Cyber Assessment Framework (v4.0) says an organisation with a positive cyber security culture is one where "people in your organisation raising potential cyber security incidents and issues are treated positively", and that it is failing if "people believe that reporting issues may get them into trouble" (NCSC CAF B6.a).
- The NCSC's cyber security culture principles make the same point: build safety and trust so people feel able to report problems, and have leaders model it.
- **Honest mistakes are not misconduct.** Deliberately breaking the rules is different, and the organisation's policies say how that's handled (core_16). The course never blurs the two: a slip reported quickly is a good outcome.
- Security people say the same from experience: someone who typed a password into a fake page, told their manager straight away and was thanked, not blamed.

### What the security team does, and doesn't do

| Does | Doesn't |
|---|---|
| Looks at every report, and thanks the person who sent it | Keep score of who reported a false alarm |
| Pulls bad emails, blocks sites, locks and resets compromised accounts | Try to catch people out (simulated phishing, if used, is for practice: core_01) |
| Runs the security tools and works with the 24/7 monitoring partner | Read people's email for the sake of it (monitoring has rules: core_16) |
| Helps people put mistakes right | Fix things by blaming someone |
| Answers questions: "is this OK?" is always welcome | Expect anyone to know everything on day one |

In the built product the security team is the host and the analysts of the client company (for example Anjali Rao, the information security analyst at Quayholt Insurance, who receives reports), with an outsourced monitoring partner out of hours and the company's DPO for personal data. All are fictional, from `BRAND_SET.md`.

**Authorised tests.** Many organisations hire testers to check their defences: test phishing emails, test calls, someone trying the doors. The whole awareness product is itself an openly authorised exercise, stated in every scope note. Treat anything suspicious the same way, test or not: report it. If a test catches you out, that's the organisation learning where to improve, not you failing (whether and how the organisation tests is an organisation slot; see core_01 for simulated phishing).

### Three previews (taught properly elsewhere)

One line each in this module, no more. Match these words exactly so the later modules don't contradict them.

- **Your badge** (core_10): wear it inside, put it away when you leave the building, never lend it, and report a lost one straight away.
- **Your passwords** (core_03): the NCSC's advice is three random words, a strong and separate password for your email, and a password manager to remember the rest. The game shows how; it never asks for a real password.
- **Your MFA prompts** (core_03): turn on 2-step verification (the NCSC's name for multi-factor authentication) wherever you can. Approve a prompt only when you've just signed in yourself. If one turns up out of the blue, deny it and report it. Never read out or share a code.

### How the course works

What a learner needs to know about the course itself, said once here:

- **Short episodes**, each about 15 minutes: a brief, an attack half where you build one message from a company's public details, a flip into the inbox it lands in, a scored defend half where you sort the post, and a debrief. A defend-only variant drops the attack half. Pre and post checks bracket the episodes.
- **Two ways to play.** The game, or a text version with the same choices and the same record (BE-03). Settings for text size, captions, motion and timers are available from the start (BE-04). Nobody needs fast reactions.
- **Nothing real is ever asked for.** The game never asks for your real password, bank details or personal information. Sign-in pages and forms in the game come pre-filled with made-up details.
- **What's recorded, and who sees it** (the notice every learner sees before they start, from `features/assessment_and_evidence.md`, section 11): whether you finish each module and when, your check score, and how you handled each situation, as "Secure", "Developing" or "Not yet". Your manager sees whether your training is done and when it's due, not your choices or scores. The training team sees results for groups of ten or more, never yours by name unless you ask them for help. Your choices in the game are practice and are never used for discipline or performance reviews. You can see everything held about you on the "My data" page (HA-17). Being open about this matters: people trust, and play honestly in, a course that tells them what it records.
- **No trick questions.** Every situation in a module can be handled with what that module teaches. Getting something wrong leads to practice, not a fail.
- **Short drills through the year,** because a once-a-year course on its own doesn't change much. People's ability to spot phishing after training held at four months but had faded by six in one field study (Reinheimer and others, 2020), and a large randomised study found no significant link between how recently staff had done annual awareness training and whether they fell for a simulated phish (Ho and others, 2025). Habits and easy reporting are what last.

### How this relates to the NCSC's Top Tips for Staff

Many organisations already use the NCSC's free "Top Tips for Staff" e-learning (under 30 minutes: passwords, devices, phishing and reporting). Our advice must agree with it. This course goes further with practice inside realistic work, the organisation's own reporting routes and policies, more topics, and records an auditor can sample (`02_COMPLIANCE_MAPPING.md`, section 7). An organisation can keep Top Tips as one of its methods.

## What to do (the procedure)

As the debrief card shows it, under the heading **The habit to keep**:

1. **Notice the pressure.** Is it unexpected, urgent or secret? Does it push you to move money, grant access, sign in or read back a code?
2. **Check it yourself** through a route you already trust: the directory, a colleague, a bookmark, the intranet. Never the number, link or page the message gives you.
3. **Report it.** Emails: the **Report** button. Anything else: the organisation's security team or service desk. Not sure? Report it anyway.
4. **Made a mistake?** Clicked, replied, typed a password, let someone in? Report it now. A fast report turns a big problem into a small one, and you'll be thanked.

(Bold values are organisation slots; generic defaults shown, resolved through the `customer_report_route` slot.)

## Misconceptions and outdated advice

| Belief | The current position |
|---|---|
| "Security is IT's job." | Most attacks start with a person being asked to do something. IT can't see what you see; your report is often the first sign. |
| "I'm not important enough to be targeted." | Bulk attacks go to everyone, and your access is the prize, not your job title (key message 1). |
| "If I report something harmless, I'll look silly." | Reporting is never wrong. A false alarm costs the team a minute; a missed attack can cost weeks. |
| "If I made a mistake, keeping quiet is safer." | The opposite. Delay does the damage. An organisation where people fear reporting is failing NCSC CAF B6.a. |
| "Attackers are hooded hackers in dark rooms." | Most are organised criminals running a business. They look and sound ordinary: a polite caller, a plausible email, a friendly visitor. |
| "The security team is there to catch people out." | They're there to help, and they thank reporters. Monitoring of work systems has rules (core_16). |
| "Spot the spelling mistakes and you'll be fine." | Unreliable. Well-made scams have none (core_01). Pause, check another way and report instead. |
| "A strong password means symbols and changing it every month." | The NCSC recommends three random words, a separate password for email and a password manager, not forced regular changes (core_03). |
| "Doing the training once a year keeps us safe." | Skills fade within months, and annual training alone shows little effect on behaviour (Reinheimer 2020; Ho 2025). Short drills and easy reporting matter more. |

## Real cases

Use these as background only. The game uses fictional names and organisations.

- **Marks and Spencer, 2025.** The chairman told a parliamentary committee that the attackers first got in on 17 April 2025 through "sophisticated impersonation" involving a third party; reports say they posed as staff in calls to IT support to get passwords reset. The company expected disruption to last until July, and estimated about £300m of lost operating profit before insurance and other mitigation. (Reported widely, for example by Business Insurance and Databarracks; check the company's own statements before quoting figures.)
- **British Library, 2023.** A ransomware attack in October 2023 took down the Library's systems. Its own review (March 2024) found the most likely entry was a compromised account belonging to a third party, on a remote access server that had no multi-factor authentication, and that the attackers had been inside for at least three days before it became apparent. (British Library, "Learning lessons from the cyber-attack", 8 March 2024, reported by Infosecurity Magazine.)
- **The NCSC's Suspicious Email Reporting Service.** Since its launch in April 2020 the public have reported more than 41 million suspicious emails, leading to hundreds of thousands of scam pages being taken down (figures to April 2025; see core_01). Reports work at national scale too.

## Organisation-specific slots

Defaults are generic; the customer fills them from the organisation profile, and the reporting route comes from the `customer_report_route` slot.

| Slot | Default |
|---|---|
| Organisation name and logo | The customer's own (shown on the title and in the room) |
| Report button name and location | "Report suspicious" in the mail toolbar; in the mobile mail app under "..." |
| Customer reporting route | "Report it the way your organisation asks you to" until the customer's own route is set |
| Security team contact | The organisation's security team |
| Service desk contact | The 24/7 service desk line |
| How to report a suspicious text or call about work | The organisation's security team, or the service desk |
| DPO contact | The organisation's DPO, through the same route |
| How payroll and bank details are changed | "Only in the HR system; HR never asks for bank details by email or text" |
| What the organisation sees in training records | The product default: results go to the learner and an organiser-only aggregate figure; no free text and no identity are held; choices are never used for discipline. The organisation can only make this stricter |
| Honest-mistakes statement | The organisation's own, shown on the no-blame card if it will give one |

## Glossary

- **Cyber security:** protecting the organisation's information, systems and devices, and the people they're about, from harm.
- **Attacker:** anyone trying to get money, data or access they shouldn't have. Usually a criminal, sometimes an insider.
- **Phishing:** a message pretending to come from someone you trust, to get you to click, sign in, pay or share (core_01).
- **Smishing and vishing:** the same trick by text message and by phone call (core_02).
- **Ransomware:** malicious software that locks an organisation's files and systems, often with a threat to publish stolen data, to demand payment (core_07).
- **MFA, 2-step verification (2SV):** a second check after your password, such as a prompt or code on your phone (core_03).
- **Passphrase:** a password made of several random words, long and easy to remember.
- **Password manager:** an app that creates, stores and fills in strong passwords for you.
- **Report suspicious button:** the button in the mail client that sends a suspicious email to the security team.
- **Incident:** anything that might harm the organisation's information or systems, including near misses and mistakes (core_04).
- **DPO (Data Protection Officer):** the person who looks after how the organisation uses personal data.
- **Debrief card:** a card in the episode debrief, including the habit to keep, the "On Monday" card and the customer's reporting route.
- **Concept card:** a short authored card that teaches one point, used in the brief and the debrief.
- **No blame (just culture):** honest mistakes reported quickly are thanked and fixed, not punished; deliberate misuse is handled differently.

## Sources

- DSIT, Cyber Security Breaches Survey 2025/2026 (30 April 2026): https://www.gov.uk/government/statistics/cyber-security-breaches-survey-20252026/cyber-security-breaches-survey-20252026
- Verizon, 2025 Data Breach Investigations Report, news release (23 April 2025): https://www.verizon.com/about/news/2025-data-breach-investigations-report
- NCSC Annual Review 2025, incident management: https://www.ncsc.gov.uk/collection/ncsc-annual-review-2025/chapter-01-cyber-threat-to-the-uk/incident-management
- NCSC Cyber Assessment Framework v4.0, principle B6: https://www.ncsc.gov.uk/collection/cyber-assessment-framework/caf-objective-b/principle-b6-staff-awareness-and-training
- NCSC, Cyber security culture principles: https://www.ncsc.gov.uk/collection/cyber-security-culture-principles
- NCSC, Top Tips for Staff: https://www.ncsc.gov.uk/information/top-tips-for-staff
- NCSC, Cyber Aware (three random words, 2SV, password managers): https://www.ncsc.gov.uk/cyberaware/home
- ICO, data protection audit framework, Training and awareness toolkit (induction within one month and before access to personal information): https://ico.org.uk/for-organisations/advice-and-services/audits/data-protection-audit-framework/toolkits/accountability/training-and-awareness/
- GOV.UK, "Report Fraud: new service from City of London Police": https://www.gov.uk/government/news/report-fraud-new-service-from-city-of-london-police
- Stop! Think Fraud, protecting your business (salary diversion): https://stopthinkfraud.campaign.gov.uk/protecting-your-business
- US Federal Trade Commission, consumer alert "New job? How to spot boss imposter scams" (July 2025): https://consumer.ftc.gov/consumer-alerts/2025/07/new-job-how-spot-boss-imposter-scams
- British Library review, as reported by Infosecurity Magazine: https://www.infosecurity-magazine.com/news/third-party-mfa-british-library
- Marks and Spencer, as reported by Business Insurance: https://www.businessinsurance.com/marks-spencer-cyberattack-upheaval-seen-lasting-until-july/
- Lain, D., Kostiainen, K. and Čapkun, S. (2022) "Phishing in organizations: findings from a large-scale and long-term study", IEEE Symposium on Security and Privacy.
- Reinheimer, B. and others (2020) "An investigation of phishing awareness and education over time: when and how to best remind users", SOUPS 2020: https://www.usenix.org/conference/soups2020/presentation/reinheimer
- Ho, G. and others (2025) "Understanding the efficacy of phishing training in practice", IEEE Symposium on Security and Privacy: https://sysnet.ucsd.edu/~voelker/pubs/phishtrain-oakland25.pdf
