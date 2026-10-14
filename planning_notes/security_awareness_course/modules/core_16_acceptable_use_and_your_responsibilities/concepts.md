# core_16 concepts: Acceptable use and your responsibilities

This file is the source of truth for the module. The game show, the explainers, the knowledge check and the reference card must all match it. Where an answer depends on the organisation's own policy, this file gives Larkspur's default and the game uses the organisation's answer key (HA-11). Each topic's detail stays in its own module; this one is about responsibilities, reasons and acknowledgement.

## Key messages

1. **The small print has good reasons.** It protects the people whose data you hold, your colleagues and you. Every rule has a "because".
2. **Three answers: Allowed. Not allowed. Ask first.** No policy can list everything. When you're not sure, ask first: it's never the wrong answer.
3. **Five things are yours to do:** protect your access (never share passwords, codes, logins or badges); use approved tools, devices and storage; look at and share only the data your job needs; report anything suspicious, including your own mistakes; ask first when you're unsure.
4. **Work systems are monitored to keep them safe, within rules.** You must be told what, why and how. And write every work message as if the person it's about could read it, because one day they might.
5. **Read before you sign.** The summary, then the policy; ask about anything unclear; then acknowledge. If a rule gets in the way of your work, say so rather than working round it.

## Concepts

### What an acceptable use policy is

- **The organisation's rules for using its information, systems, devices and accounts,** and your own devices when you use them for work. It's usually one of a set: an overall information security policy, then topic policies (data protection, social media, personal devices, remote working), plus the disciplinary policy. Names differ by organisation (organisation slot).
- **Why standards ask for one, and for staff to know it:**
  - ISO 27001 has a control (A.5.10) requiring rules for the acceptable use of information and other assets to be identified, documented and implemented, and cl. 7.3 requires everyone to be aware of the policy (secondary sources; the standard is paywalled).
  - PCI DSS 12.2.1 asks for acceptable use policies for end-user technologies that cover explicit approval by authorised people, the acceptable uses, and a list of approved hardware and software (secondary sources); PCI DSS 12.6.3.2 asks for training on them, and 12.6.3 for an acknowledgement at least every 12 months (`02_COMPLIANCE_MAPPING.md`).
  - NIST PL-4 (rules of behaviour) asks for a documented acknowledgement before someone is given access, and again when the rules change (secondary sources; FedRAMP sets "at least annually").
- **It applies to everyone** who uses the organisation's systems: staff at every level, temporary staff, contractors and volunteers.

### What it usually covers

The ten headings on Owain's card (BE-08), each with the module that teaches the detail:

| Heading | In plain words | Detail in |
|---|---|---|
| 1. Using our systems, and personal use | What work kit and accounts are for, and how much personal use is fine | this module |
| 2. Monitoring and your privacy | What's checked, why, and the limits | this module |
| 3. Software, apps and AI tools | Only approved ones, or ask | core_08, core_13, core_15 |
| 4. Your own devices | When and how a personal phone or laptop can be used for work | core_09 |
| 5. Email, chat and calls | Professional, respectful, and remember they're records | core_06 |
| 6. Social media | Don't speak for the organisation, don't share what's confidential | core_12 |
| 7. Handling information | By its label, and only what your job needs | core_05, core_06 |
| 8. Accounts, passwords and badges | Yours alone, never shared | core_03, core_10 |
| 9. Reporting | Suspicious things, lost kit and mistakes, straight away | core_04 |
| 10. If the rules are broken | Mistakes are fixed; deliberate misuse is handled differently | this module |

Footer of the card: **Not sure? Ask first.** and the contacts (organisation slots).

### The three answers

- **Allowed:** you can, within the stated conditions ("at break times", "nothing confidential in shot", "through the company app").
- **Not allowed:** there's a good reason, and the show always gives it.
- **Ask first:** the answer depends on something the learner can't judge alone (the tool, the data, the client, the country), so someone who knows decides. It includes "allowed once approved", such as a software request.

"Ask first" matters most. New tools, apps and AI services appear every month, and no policy can name them all. An organisation where people ask is safer than one with a longer rulebook.

### Your five responsibilities

| Responsibility | Why | Detail in |
|---|---|---|
| **Protect your access:** never share passwords, MFA codes, logins or badges; lock your screen when you step away | Everything done with your account looks like you did it; a shared login is a door anyone can walk through | core_03, core_10 |
| **Use approved tools, devices and storage** | Unapproved apps and personal accounts put data where the organisation can't protect, back up or remove it | core_08, core_13, core_15 |
| **Look at and share only the data your job needs** | It's the law as well as the rule (see below) | core_05, core_06 |
| **Report anything suspicious, including your own mistakes** | Speed limits harm; no blame for honest slips | core_04 |
| **Ask first when unsure** | Guessing and workarounds cause most well-meant breaches | this module |

### Personal use

- Policies differ: many allow reasonable personal use of work devices and the internet; some don't. **This is an organisation slot**, and the game uses the organisation's own answer.
- **Larkspur default:** reasonable personal use is allowed in your own time (breaks, before and after work), as long as it doesn't affect your work or anyone else's, costs the organisation nothing, isn't illegal or offensive, and doesn't put systems at risk (no unapproved software, no personal files on shared drives).
- **The reasons behind the limits:** risky sites bring malware; heavy streaming slows shared connections (at Larkspur, the warehouse scanners share the Wi-Fi); the organisation's name is on everything that leaves its network; and personal browsing on a work device shows up in security logs (see monitoring).

### Monitoring and your privacy

- **What organisations commonly check, for security:** email and web filtering (scanning for malware and phishing), sign-in records, the health of devices, attempts to send certain data outside, access to sensitive systems, CCTV and door logs. What a particular organisation does is an organisation slot: its monitoring statement.
- **The law protects workers too.** Monitoring workers involves their personal data, so UK data protection law applies. The ICO's guidance on monitoring workers (October 2023; under review after the Data (Use and Access) Act 2025) expects employers to:
  - tell workers the nature, extent and reasons for any monitoring;
  - be clear about the purpose and collect no more than they need;
  - check that the monitoring is necessary and that no less intrusive way would do;
  - consider a data protection impact assessment, and complete one where the risk is high;
  - look at the content of emails and messages only in exceptional circumstances, telling workers in advance.
  Commentary on the guidance reads covert monitoring as justified only in exceptional cases, such as suspected crime (secondary sources; to verify against the guidance text before quoting).
- **Intercepting communications** on an organisation's own systems is governed by the Investigatory Powers Act 2016 and the business monitoring regulations made under it (SI 2018/356), which allow monitoring or recording of business-relevant communications on the business's own system, under conditions. Keep this to one line in the game; it's background for writers.
- **The limits are real.** In February 2024 the ICO ordered Serco Leisure and related trusts to stop using face and fingerprint scans to check staff attendance at 38 leisure centres: the employers hadn't shown it was necessary or proportionate, and staff weren't offered an alternative.
- **What this means for staff:** expect work systems to be monitored for security, and expect to be told how (The Lark's monitoring page). It isn't someone reading messages for fun. If something about monitoring worries you, ask the DPO.
- **Messages are records.** Anything written at work about a person can be part of what they receive if they make a subject access request (core_05), and messages can be disclosed in legal proceedings. Public bodies can be asked for information they hold under freedom of information law, which can include what suppliers like Larkspur send them. Tomasz's rule: *write every message as if the person it's about could read it.*
