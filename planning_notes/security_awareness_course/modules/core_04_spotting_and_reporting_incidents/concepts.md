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

Reports from staff are also the organisation's fastest sensor. In a large, long-term study of phishing in one organisation, staff reports detected campaigns quickly and reliably (Lain, Kostiainen and Čapkun, 2022; see core_01).

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
