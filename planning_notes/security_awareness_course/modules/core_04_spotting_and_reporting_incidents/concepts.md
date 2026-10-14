# core_04 concepts: Spotting and reporting incidents

This file is the source of truth for the module, and for the general reporting procedure every other module points to. The game, the explainers, the knowledge check and the reference card must all match it.

## Key messages

1. **If something seems wrong, report it now.** Anything that might put information, systems, money or people at risk counts, including near misses and your own mistakes. You don't have to be sure.
2. **Minutes matter.** Most of the damage happens between someone noticing and someone reporting. A quick report lets the security team stop it spreading.
3. **Say what, when, where, who, and what you've done.** A rough report now beats a perfect one later: they'll ask for the rest.
4. **Leave it as it is.** Don't investigate, fix, delete or switch off. Follow the security team's instructions.
5. **Nobody is in trouble for reporting**, including their own mistake. If a colleague slips up, help them report it.

## Concepts

### What counts as an incident

In plain words, an incident is anything that might mean information has been **seen by people who shouldn't see it**, **changed or damaged**, or **unavailable when it's needed**, or that a system or account has been **used by someone who shouldn't use it**. Security people call these confidentiality, integrity and availability; learners don't need the words.

It includes:

- **attacks:** a taken-over account, malware, someone trying to get into systems or the building;
- **mistakes:** an email to the wrong person, a lost laptop, a document left on a train;
- **near misses:** a mistake caught before harm was done, such as an email recalled in time. These show where the gaps are, so they are worth reporting too.

The UK government's reporting guidance lists the activities commonly recognised as cyber incidents: breaches of a system's security policy that affect its integrity or availability; attempts to gain unauthorised access to a system or to data; changes to a system's firmware, software or hardware without the owner's consent; and malicious disruption or denial of service (GOV.UK, "Report a cyber incident"). Staff don't need to decide which category something falls into. ISO/IEC 27001 calls what staff notice "information security events" and expects a way for people to report them promptly; the security team then decides whether an event is an incident.

Not everything odd is a security problem (a jammed printer is not), but if you aren't sure, report it. The team would rather look at ten false alarms than miss one.

### Signs to look out for

| Area | Signs |
|---|---|
| **Accounts and messages** | Emails in your sent items that you didn't send; contacts asking about odd messages from you or a colleague; a sign-in prompt or code you didn't ask for (core_03); a password reset email you didn't request; new mail rules or forwarding that nobody set up; being locked out of your account |
| **Devices** | A laptop, phone, tablet, USB stick or badge lost or stolen; a security warning; a device that suddenly slows, shows pop-ups or restarts by itself; something plugged into a computer or network socket that shouldn't be there |
| **Files and systems** | Files renamed, unreadable or missing; a note or screen demanding payment (core_07); a system that stops working without explanation; records that have changed and nobody knows why |
| **Data and mistakes** | Information sent to the wrong person, or the wrong attachment sent; documents left on a printer, in a meeting room or in public; data shared more widely than it should be; personal information seen by someone who shouldn't see it |
| **People and places** | Someone you don't recognise in a secure area; a secure door propped open; a stranger asking unusual questions about systems or people (core_02, core_10) |

### Why minutes matter

Most incidents grow while nobody who can stop them knows about them:

- a taken-over mailbox keeps writing to every contact, and customers start clicking;
- malware that locks files works through one shared folder after another;
- a stolen laptop stays signed in to email and the customer portal until someone signs it out;
- an email sent to the wrong person gets opened, forwarded and synced to phones.

The security team can stop each of these within minutes, but only from the moment they know. In the Capita case (see Real cases), an alert was raised within 10 minutes, but the device wasn't quarantined for 58 hours, and in that window the attacker gained administrator rights and took nearly a terabyte of data. Speed of response decided how big the breach became.

Organisations also have legal and contractual clocks, which start when the organisation becomes aware:

- **Personal data breaches:** under UK GDPR Article 33, an organisation must tell the Information Commission (the ICO) about a reportable breach without undue delay and, where feasible, within 72 hours of becoming aware of it. An organisation handling data for a client (a processor, as Larkspur often is for councils, schools and care homes) must tell that client without undue delay. The 72-hour duty was unchanged when the Information Commissioner became the Information Commission on 30 September 2026.
- **Regulated sectors:** in the EU, NIS2 requires organisations in many sectors to give their national authority an early warning of a significant incident (within 24 hours of becoming aware; to verify against Article 23 of the Directive before quoting).
- **Contracts:** customers' contracts often require prompt notice of incidents affecting their data.

These are the organisation's duties, not the individual's. The individual's part is to get the report to the right people at once, so the people who decide have the time to decide well.

Reports from staff are also one of the organisation's fastest sensors. In a large, long-term study of phishing in one company, staff reports allowed fast detection of new phishing campaigns (Lain, Kostiainen and Čapkun, 2022; see core_01).

### How to report

The routes at Larkspur, replaced by the organisation's own through the organisation profile (BE-05):

- **A suspicious email or message:** the **Report suspicious** button (core_01).
- **Anything else:** the security team on **extension 4444**, or the **Report an incident** form on The Lark.
- **Out of hours, or away from the office:** the **24/7 service desk**. Lost or stolen devices, including a personal phone with work email on it, are reported straight away, even at night or on holiday, so they can be locked and wiped remotely.
- **Personal data involved:** the same route. The DPO is brought in from there; you don't need to work out whether it's a "breach" (core_05).
- **Something physical** (a stranger, a propped door, a lost badge): the same route; facilities and security are brought in from there (core_10).
- **Not sure which route?** Any of them. Whoever you reach will pass it on.

Report through the organisation's route, not by posting in a group chat, forwarding the suspicious message to colleagues, or telling a customer yourself.

### What to include

A useful report answers five questions, as far as you know:

1. **What** did you notice?
2. **When** did you notice it, and when might it have started?
3. **Where:** which place, device or system?
4. **Who** is involved or affected?
5. **What have you done so far?** Be honest: "I restarted it", "I deleted the note", "I clicked the link". The team needs to know, and nobody is marked down for saying so.

Also say whether personal information might be involved (yes, no or not sure) and how to reach you.

| Vague | Useful |
|---|---|
| "Leo's email is being weird." | "13:50: Leo Brennan's mailbox has sent invoice emails he didn't write, to customers including Brookfield Primary, who rang him. He's at his desk now. We haven't changed anything." |

Don't hold back a report to fill in every detail. Send what you know; the team will ask for the rest.

### First moves: leave it as it is

- **Don't investigate or try to fix it.** Don't open the odd file again, run a scan, reply to the attacker or restore things yourself.
- **Don't delete anything.** The email, the file, the note and the message are evidence (ISO/IEC 27001 expects organisations to keep it).
- **Don't forward suspicious messages to colleagues** to ask if they're real: that spreads them. Use the Report button.
- **Don't switch the device off unless you're told to.** The service desk may ask you to disconnect it from the network (unplug the cable or turn off Wi-Fi) and leave it on. This matches core_01 and core_07.
- **Don't contact the attacker or pay anything.**
- **Keep it confidential** until you're told otherwise: no posts, no telling customers. The organisation decides who needs to know.
- **Note down what you saw and did,** with times, while it's fresh.

### Your own mistakes

Report your own slip exactly as you would anything else, and straight away. A misdirected email reported in five minutes can often be contained (the recipient deletes it, the client is told properly); the same email discovered by a customer a week later becomes a complaint, a breach report and a loss of trust. Hiding a mistake is what turns it into a serious incident.

Organisations that want reports have to make reporting safe. The NCSC's cyber security culture principles (June 2025) ask for "quick, easy and accessible routes for people to ask questions or report security issues", and say that "incidents are investigated with a view to learn and improve, not to blame" and that "people involved in an incident are treated fairly, with no punishment for innocent mistakes". The NCSC's Cyber Assessment Framework (v4.0, B6.a) expects a culture in which people know how to raise a concern and those who report are treated positively. The game shows this every time: people who report, including their own mistakes, are thanked.

### When a colleague makes a mistake

1. **Encourage them to report it now,** and offer to do it with them: "Let's do it together. It'll take two minutes."
2. **Be kind.** They're probably embarrassed or worried. Remind them that fast reporting is what's thanked.
3. **If they won't, report it yourself,** and tell them you have. It isn't telling tales: it protects them, the customers and everyone else.

### What happens after a report

The security team (and, out of hours, its monitoring partner):

1. **Triages:** how serious is it, and what's at risk?
2. **Contains:** locks accounts, signs out sessions, pulls emails from inboxes, cuts a device off the network, locks and wipes a lost laptop remotely, asks a wrong recipient to delete an email.
3. **Investigates:** what happened, when, and how far it went.
4. **Recovers:** restores files from backup, resets passwords, checks nothing was left behind.
5. **Notifies, where needed:** the DPO decides with the organisation's leaders whether to tell the Information Commission (the ICO), the people affected and clients; the team may also report to the police (Report Fraud in England, Wales and Northern Ireland; Police Scotland on 101 in Scotland), to the NCSC, or to a sector regulator.
6. **Learns:** fixes the gap that let it happen, without hunting for someone to blame.

The person who reported is thanked, may be asked a few questions, is told what to do next, and, where possible, hears how it ended.

### Personal data breaches

A personal data breach is a security problem that leads to personal data being lost, destroyed, changed, disclosed or accessed when it shouldn't be: an email to the wrong person, a lost laptop with customer records, a spreadsheet with a hidden tab, a stranger reading a screen. Report it straight away through the same route; the DPO decides whether it must go to the Information Commission (the ICO) within the 72 hours and whether the people affected must be told. The law and the details are in core_05.

### Ransomware and malware: the signs only

Files that suddenly won't open or have strange names, a note or screen demanding payment, or a security warning are reasons to report at once and follow the instructions. Don't pay, don't reply, don't restore anything yourself. How malware gets in, and the rest of the story, is in core_07.

## What to do (the procedure)

As the reference card shows it:

1. **Notice it.** Odd accounts, devices, files, data or people? It might be an incident.
2. **Leave it.** Don't investigate, fix, delete, forward or switch off.
3. **Report it now.** Messages: the Report button. Anything else: the security team on 4444, or the form on The Lark. Out of hours: the 24/7 service desk.
4. **Say what, when, where, who, and what you've done.** Not sure? Say so.
5. **Follow instructions**, and keep it to yourself until you're told otherwise.
6. **Your mistake, or a colleague's?** Report it the same way. You'll be thanked.

## Misconceptions and outdated advice

| Belief | The current position |
|---|---|
| "I should be sure before I report." | Report suspicions. The security team decides what it is; a false alarm costs minutes, a missed incident can cost months. |
| "It's IT's job to notice." | Tools miss human signs: a misdirected email, a missing laptop, a stranger in the corridor. Staff often notice first. |
| "Reporting a colleague is telling tales." | It protects them and everyone else. Help them report it; if they won't, report it kindly yourself. |
| "I'll get in trouble for my mistake." | Good practice, and the NCSC, says innocent mistakes aren't punished. Hiding a mistake is what makes it serious. |
| "Turn it off and on again." | Switching off or restarting can destroy evidence and, sometimes, make things worse. Follow the service desk's instructions. |
| "Delete the dodgy email so nobody clicks it." | It's evidence. Use the Report button, which removes it safely. |
| "If personal data's involved, I should tell the ICO or the customer myself." | Report it internally. The DPO and the organisation decide who must be told, and do it properly. |
| "A near miss isn't worth reporting." | Near misses show where the gaps are, before something worse comes through them. |
| "It's the weekend, it can wait until Monday." | There's a 24/7 route. Lost devices, especially, should be reported straight away. |
| "The report has to be complete." | Send what you know now. The team will ask for the rest. |

## Real cases

Use these as background and inspiration only. Game content uses fictional names.

- **Capita, 2023.** A malicious file was unintentionally downloaded onto an employee device on 22 March 2023. A high-priority security alert was raised within 10 minutes, but Capita did not quarantine the device for 58 hours, during which the attacker deployed malware, gained administrator permissions and moved through the network; nearly one terabyte of data was taken on 29 and 30 March. The personal information of 6.6 million people was stolen. The ICO fined Capita £14 million on 15 October 2025. The lesson used in the module: the first sign starts the clock, and every hour of delay is an hour the attacker keeps.
- **23andMe, 2023.** Credential stuffing began in April 2023, with an intense wave in May; the company looked into isolated unauthorised activity in July; a claim in August that data on more than 10 million users had been stolen was dismissed as a hoax; a full investigation started only in October, when an employee found the stolen data advertised for sale online. The ICO found the response inadequate and fined the company £2.31 million on 17 June 2025 (core_03 uses the same case for password reuse). The lesson: early signs, taken seriously, would have shortened the incident by months.
- **Staff reports as an early warning.** In a 15-month study with more than 14,000 employees of a large company, staff reports through a button in the mail client allowed fast detection of new phishing campaigns, at a workload the organisation could manage, and employees kept reporting over long periods (Lain, Kostiainen and Čapkun, IEEE Symposium on Security and Privacy, 2022; arXiv:2112.07498). core_01 builds on the same study.
- **UK picture.** In the Cyber Security Breaches Survey 2025, 23% of UK businesses had a formal incident response plan, and 32% had guidance on when to report a breach externally (DSIT, April 2025). In most organisations, staff knowing to report at once is the plan. Check the latest edition before quoting figures.

## Organisation-specific slots

| Slot | Default (Larkspur) |
|---|---|
| Report button for messages | "Report suspicious" in the mail toolbar; in the mobile app under "..." |
| Security team route | Extension 4444, or the "Report an incident" form on The Lark |
| Out of hours | The 24/7 service desk line |
| Lost or stolen devices | The 24/7 service desk, straight away, any time, including personal phones with work email |
| Personal data involved | The same route; it reaches the DPO, Tomasz Wiśniewski |
| Physical security | The same route; facilities (Precious Adeyemi) is brought in |
| Device instruction | "Don't switch it off. If we ask, unplug the network cable or turn off Wi-Fi, leave it on, and wait for instructions." |
| What reporters hear back | "A reply within 15 minutes in working hours, and a note when it's closed" |
| Thank-you practice | "Reports and owned-up mistakes are thanked, never punished, in line with our just culture statement" |

## Glossary

- **Incident:** something that has harmed, or might harm, information, systems, money or people.
- **Event:** something odd that staff notice and report; the security team decides whether it's an incident.
- **Near miss:** a mistake or attack caught before it did harm.
- **Personal data breach:** a security problem that leads to personal data being lost, changed, disclosed or accessed when it shouldn't be (core_05).
- **Containment:** stopping an incident spreading: locking an account, cutting a device off the network.
- **Isolate:** cut a device off from the network so whatever is on it can't spread.
- **Remote wipe:** erasing a lost or stolen device's data over the internet.
- **Evidence:** the emails, files, messages and logs that show what happened; keep them as they are.
- **Triage:** the security team's first quick look to judge how serious something is.
- **DPO (Data Protection Officer):** the person who handles personal data questions and breaches.
- **The Information Commission (the ICO):** the UK's data protection regulator; the Information Commissioner until 30 September 2026.
- **Report Fraud:** the national fraud and cyber crime reporting service for England, Wales and Northern Ireland, which replaced Action Fraud in December 2025.
- **Just culture:** treating people fairly after an incident, learning rather than blaming, so they keep reporting.

## Sources

- GOV.UK, "Report a cyber incident" (published 13 May 2022): https://www.gov.uk/report-cyber
- NCSC, "Cyber security culture principles: Principle 2" (4 June 2025): https://www.ncsc.gov.uk/collection/cyber-security-culture-principles/principle-2
- NCSC Cyber Assessment Framework v4.0 (August 2025), principle B6 (staff awareness and training), indicator B6.a: https://www.ncsc.gov.uk/collection/cyber-assessment-framework
- NCSC, "Mitigating malware and ransomware attacks" (reporting to the NCSC and to Report Fraud): https://www.ncsc.gov.uk/guidance/mitigating-malware-and-ransomware-attacks
- UK GDPR, Article 33 (notification of a personal data breach), as amended to 30 September 2026: https://www.legislation.gov.uk/eur/2016/679/article/33
- ICO, "Capita fined £14m for data breach affecting over 6m people" (15 October 2025): https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2025/10/capita-fined-14m-for-data-breach-affecting-over-6m-people/
- ICO, "23andMe fined £2.31 million for failing to protect UK users' genetic data" (17 June 2025), via the ICO newsroom: https://ico-newsroom.prgloo.com/news/ico-fines-23andme-gbp-2-31-million-for-failing-to-protect-uk-users-genetic-data
- Directive (EU) 2022/2555 (NIS2), Article 23 (reporting obligations): https://eur-lex.europa.eu/eli/dir/2022/2555/oj
- ISO/IEC 27001:2022, Annex A 5.24 to 5.28 and 6.8 (incident management and event reporting).
- DSIT, Cyber Security Breaches Survey 2025: https://www.gov.uk/government/statistics/cyber-security-breaches-survey-2025
- Lain, D., Kostiainen, K. and Čapkun, S. (2022) "Phishing in organizations: findings from a large-scale and long-term study", IEEE Symposium on Security and Privacy.
