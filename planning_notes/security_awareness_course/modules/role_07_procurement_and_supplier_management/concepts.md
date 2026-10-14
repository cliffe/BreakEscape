# role_07 concepts: Procurement and supplier management

This file is the source of truth for the module. Personal data law is core_05's (this module touches processor contracts only); supplier bank detail changes are core_11 and role_02; remote management tools and privileged access are role_03; the board's oversight of supply chain risk is role_01.

## Key messages

1. **Your suppliers' security is part of yours.** If they hold your data, connect to your systems or run a service you can't do without, their weak spot is yours, and so are their suppliers'.
2. **Match the checks to the risk.** Ask what the supplier will hold, reach and run, then check more where it matters more.
3. **Evidence, not claims.** Ask to see it, and check what it covers, who issued it and when it runs out.
4. **Put it in the contract, and use the contract.** A breach notice within hours, named subcontractors, data back and deleted at the end, rules for supplier access, and the right to check.
5. **Open supplier access carefully and close it completely.** Named accounts, MFA, least privilege, time limits; and everything removed when the work or the contract ends.

## Concepts

### How suppliers create risk

| Route | What goes wrong | Real example |
|---|---|---|
| **They hold your data** | A breach of their systems is a breach of your data, and your organisation still answers for it | MOVEit and Zellis, 2023: staff data of a payroll provider's clients was taken through a flaw in a file transfer product the provider used |
| **They connect to you** | Their accounts and tools are a way into your systems | Kaseya, 2021: ransomware pushed through remote management software to managed service providers and on to their customers |
| **You depend on them** | Their outage stops your service, attacker or not | Synnovis, 2024: pathology services for London hospitals interrupted for months. CrowdStrike, 2024: a faulty update crashed millions of computers in a morning |
| **Their suppliers** | Risk you never contracted for reaches you through the chain | Zellis's own supplier's product was the way in |
| **They can be impersonated** | Fraudsters pose as a supplier to redirect payments | core_11 and role_02 |

The NCSC's supply chain guidance starts in the same place: understand what needs protecting and why, know who your suppliers are and what their security looks like, and understand the risk the supply chain poses (principles 1 to 3 of its 12).

### Matching the checks to the risk

Ask four questions about any supplier:

1. **What data will they hold?** None, some, a lot; personal data; special category data such as health information.
2. **What will they reach?** Nothing, a portal, an integration with our systems, administrator access.
3. **What happens if they stop?** An inconvenience, a bad week, or services to schools, care homes and hospitals failing.
4. **Who else do they use?** Hosting, support, software, subcontractors.

Then tier them. **Low** (no data, no access, easy to replace): basic checks. **Medium** (some personal data, or limited access): Cyber Essentials, a short questionnaire with evidence for the answers that matter, and UK GDPR Article 28 terms. **High** (a lot of personal data, access into systems, or a service you can't do without): Cyber Essentials Plus or an ISO 27001 certificate that covers the service, an independent assurance report or a recent penetration test summary, a security schedule in the contract, an exit plan, and a yearly review. Cabinet Office guidance for public buyers makes the same point: controls must be proportionate, and buyers "must not take a blanket approach" (PPN 014, para 20). A 300-question questionnaire for the window cleaner wastes everyone's time; a two-line email for the system holding every employee's home postcode is not enough.

### Evidence, not claims

**Cyber Essentials** is the UK government-backed baseline: five technical controls (firewalls, secure configuration, security update management, user access control, malware protection). Basic Cyber Essentials is a self-assessment verified by a certification body; **Cyber Essentials Plus** adds independent technical testing (NCSC). Check the certificate on IASME's certificate search: the right legal entity, issued within the last 12 months (suppliers recertify every 12 months, PPN 014 Annex C), and covering the part of the business you're buying from. It covers the supplier, not its hosting provider or other third parties: "Cyber Essentials does not ensure that the security of the third party is in scope of certification" (PPN 014, Annex C). The current requirements are version 3.3, in force since 27 April 2026.

**ISO/IEC 27001 certificates** show an information security management system has been audited. Check three things: the **scope statement** (does it cover the service and sites you're buying, or only "sales and customer success, London office"?), the **issuer** (a certification body accredited by a national accreditation body, UKAS in the UK), and the **dates**.

**SOC 2 reports** are independent auditors' reports on a service organisation's controls, against the AICPA's criteria for security, availability, processing integrity, confidentiality and privacy. A Type 2 report tests whether controls worked over a period, usually six to twelve months; a Type 1 report describes them at a point in time (standard AICPA terms; to verify the wording before quoting). Read the period it covers, which services are in scope, and the exceptions section: exceptions are normal, but you want to know what they were and what was fixed. "SOC 2 compliant" with no report is a claim. Reports are usually shared under a non-disclosure agreement before signing, not after.

**Penetration test summaries** show someone tested the service: check the date, what was in scope, and whether serious findings were fixed.

**Questionnaires** give structure, but every answer is a claim. Ask for evidence behind the answers that matter for the tier.

**Phrases that need a follow-up question:** "military-grade encryption" or "bank-level security" (what encryption, where, and who holds the keys?); "100% secure" (nobody is); "GDPR certified" or "GDPR compliant" on its own (which certification scheme, if any, and what does it cover?); "we use a major cloud provider, so we're secure" (the cloud provider secures its platform; the supplier secures what it builds and runs on it).

**Software suppliers** can be asked whether they follow the Software Security Code of Practice, a voluntary code of 14 principles for software vendors published by the Department for Science, Innovation and Technology with the NCSC in May 2025.

### The clauses that matter

The NCSC's principles ask buyers to set and communicate minimum security requirements and to build security into contracts, requiring suppliers to do the same with theirs (principles 5 and 6). Where the supplier processes personal data for us, UK GDPR Article 28 sets a legal minimum for the contract: process only on our documented instructions, confidentiality, security measures, no other processor without our written authorisation, help with people's rights and with breaches, deletion or return of the data at the end, and the information and audits needed to show compliance.

| Clause | Why it matters | What good looks like | Typical pushback |
|---|---|---|---|
| **Security requirements** | Sets the baseline they must keep | Keep Cyber Essentials Plus (or the agreed certificate) for the service; patch, use MFA, encrypt; tell us if any of this lapses | "Our standard terms cover security" |
| **Breach notification** | A processor must tell the controller "without undue delay" (UK GDPR Art 33), and the controller then has 72 hours from becoming aware, where feasible, to notify the Information Commission (the ICO), unless the breach is unlikely to result in a risk to people. A number of hours removes the argument | Tell us within 24 hours of becoming aware (48 at most), with what you know, then regular updates | "Without undue delay" or "72 hours" |
| **Subcontractors** | Their suppliers become ours | A named list; our prior written approval of changes (UK GDPR Art 28(2)); the same terms passed down | "We'll notify you of changes" |
| **Data location and access** | Where data sits and who can reach it from where | Stored and supported from named locations; remote access only with our approval | "Our affiliates may provide support" |
| **Assurance and audit** | Lets us check, not just trust | An independent report (SOC 2, ISO surveillance audit or penetration test summary) every year; answers to our security questions; an audit right after a serious incident | "Our SOC 2 report only" |
| **Return and deletion at exit** | Data outlives contracts | Our choice of return or deletion within a set time (30 days), a deletion certificate, and backups deleted on their normal cycle | "Backups kept for seven years" |
| **Supplier access** | Their accounts are a way in | Named accounts, MFA, least privilege, our approval, logging, time limits | "One shared support login" |
| **Their staff's training** | People are part of their controls | Supplier staff with access are trained in security awareness. Required in contracts for some EU organisations: NIS2 IR 5.1.4 (for the digital entity types the Implementing Regulation covers) and DORA Art 30(2)(i) (EU financial entities) | Rarely resisted |
| **Exit and continuity** | If they fail or we leave | An exit plan, help moving the data, and notice of major changes (a takeover, a new hosting provider) | "We'll discuss it at the time" |

A contract doesn't prevent a breach. It gives you the facts sooner, rights to act, and a clean exit.

### Supplier access

- **Named accounts** for named people. No shared "support" login: when something goes wrong, you need to know who did what, and a shared password survives the people who leave.
- **MFA** on every supplier account.
- **Least privilege:** access to the integration they support, not the whole system.
- **Time-limited:** switched on when needed, for a set time, with our approval; off otherwise.
- **Logged and reviewed:** someone looks at what supplier accounts do.
- Remote management tools come only through IT's approved route (role_03 covers the IT side).

### Through the contract's life

- **Keep a supplier register:** what each supplier holds and reaches, its tier, the contract owner and the next review date.
- **Review at least yearly:** certificates expire, scopes change, new subcontractors appear. Re-check the evidence for the tier.
- **Watch for changes:** a takeover, a new hosting provider, new features that use our data. Ask before they happen if the contract allows it.
- **Watch the news about your suppliers,** and act on their security notices.
- **When a supplier reports a breach, tell the security team and the DPO the same hour.** Our clock may already be running: the controller's 72 hours to the ICO start when we become aware, and the supplier's notice may be how we become aware. Don't wait for "the full picture". Ask: what happened and when; whose data and which of our systems; what they've done to contain it; what we need to do; when the next update comes. Keep a record of every message.

### Ending the contract

Contracts end on paper; access ends when someone removes it.

- Remove every supplier account, API key, VPN profile and shared mailbox delegation, and rotate any shared secrets.
- Ask for the data back or deleted, and for the deletion certificate.
- Update the supplier register.
- Check for access nobody recorded: accounts the supplier created itself, or a leaver at the supplier whose account is still live.

### Public sector buyers and new law

- **PPN 014** (Cabinet Office, February 2025; for procurements started on or after 24 February 2025 under the Procurement Act 2023; PPN 09/23 covers earlier ones) applies to central government departments, their executive agencies, non-departmental public bodies and NHS bodies, and others may adopt it. For higher-risk contracts (handling citizens' personal data, or ICT systems holding official data) they require Cyber Essentials, Cyber Essentials Plus or equivalent controls, before data passes to the supplier and renewed every 12 months for the life of the contract. Larkspur, as a supplier to NHS sites and councils, meets these requests itself.
- **The Cyber Security and Resilience Bill** (introduced 12 November 2025) would regulate medium and large managed service providers for the first time and let regulators designate critical suppliers to essential services, such as diagnostics suppliers to the NHS. It is **not yet law**: on 14 October 2026 its Lords report stage was due on 26 October 2026 (`02_COMPLIANCE_MAPPING.md`, section 3.10). Cite it only as something to watch.
- **NHS care customers** in DSPT categories 3 and 4 are asked for due diligence on their suppliers (DSPT 10.2.1).

## What to do (the procedure)

As the reference card shows it, headed **Evidence, not claims.**

**Before you buy**
1. Ask what they will hold, reach and run, and who else they use. Set the tier.
2. Ask for evidence that fits the tier. Check each certificate's scope, issuer and dates.
3. Bring in the security team and the DPO early for medium and high tiers.

**In the contract:** security requirements; breach notice within hours; named subcontractors and approval of changes; where data is held and supported from; assurance and audit; return and deletion at the end; supplier access rules; an exit plan.

**On day one:** named supplier accounts with MFA, least privilege, time limits and logging. Add the supplier to the register.

**During the contract:** review at least yearly. A supplier's breach notice goes to security and the DPO the same hour.

**At the end:** remove every account, key and delegation; get the data back or deleted, with a certificate; update the register.

## Misconceptions and outdated advice

| Belief | The current position |
|---|---|
| "They're a big name, so they must be secure." | Size isn't evidence. Check what they show you, and what the contract says. |
| "They're ISO 27001 certified." | Read the scope: a certificate for the sales office says nothing about the service you're buying. |
| "They've got Cyber Essentials, so they're secure." | It's a valuable baseline of five technical controls for the certified organisation, renewed every 12 months. It doesn't cover their suppliers, or everything a high-risk service needs. |
| "The questionnaire says yes to everything." | Answers are claims. Ask for evidence for the ones that matter. |
| "Security is IT's job, not procurement's." | Procurement decides who gets our data and access, and what the contract lets us demand. That is security work. |
| "The contract makes them liable, so we're covered." | Liability doesn't undo a breach, and our own duties to the people whose data it is remain. Contracts give speed, facts and rights. |
| "We'll sort out their access after go-live." | Access set up in a hurry stays that way. Agree the rules before go-live. |
| "When the contract ends, it ends." | Accounts, keys and data outlive contracts until someone removes them. |
| "A breach notice can wait for the weekly supplier meeting." | Our own 72-hour clock may already be running. Same hour, to security and the DPO. |
| "Due diligence means the full questionnaire for everyone." | Proportionate: deep checks where the risk is, light ones where it isn't (PPN 014: no blanket approach). |
| "Nobody attacked, so it isn't a security problem." | A faulty update or an outage at a supplier can stop services as surely as an attack (CrowdStrike, 2024). Plan for both. |

## Real cases

Background only. The game uses fictional equivalents: a file-transfer tool breach at the chosen supplier's own supplier, a remote management tool used to reach customers, a lab whose outage stops hospital tests, a faulty update.

- **MOVEit and Zellis, 2023.** The CL0P ransomware gang exploited a previously unknown flaw (CVE-2023-34362) in MOVEit Transfer, a managed file transfer product, from 27 May 2023 (CISA advisory AA23-158A, 7 June 2023). Zellis, a UK payroll provider, was among the victims, and staff data from several of its clients, including the BBC, British Airways and Boots, was taken (BBC News, Joe Tidy, 5 June 2023; check the article before quoting what data was involved).
- **Kaseya VSA, 2021.** Ransomware delivered through a vulnerability in Kaseya's on-premises VSA remote management product to managed service providers and their downstream customers, from 2 July 2021 (CISA guidance, 12 July 2021). Kaseya's estimate was between 800 and 1,500 businesses (Reuters, 5 July 2021; Washington Post, 6 July 2021), and a Swedish supermarket chain closed most of its stores for days (BBC News, 3 July 2021). The press figures were checked through their citations, not the articles themselves: recheck before quoting.
- **Synnovis, 2024.** A ransomware attack on 3 June 2024 affected almost all of Synnovis's IT systems and interrupted many of its pathology services; Synnovis is a partnership between SYNLAB and two London NHS trusts. The criminals published stolen data on 20 June 2024, services were restored by late autumn 2024, and notifications to affected organisations were completed by the end of November 2025 (Synnovis cyber update pages).
- **CrowdStrike, 2024.** A defective content update for the Falcon sensor on Windows, released at 04:09 UTC on 19 July 2024 and reverted 78 minutes later, crashed systems worldwide; CrowdStrike: "This was not a cyberattack." Microsoft estimated 8.5 million Windows devices were affected, less than one per cent of all Windows machines (CrowdStrike remediation hub; Microsoft, 20 July 2024).

## Organisation-specific slots

| Slot | Default (Larkspur) |
|---|---|
| Supplier tiers | Low, medium, high, by data, access and dependency (the four questions above) |
| Evidence required per tier | Medium: Cyber Essentials plus questionnaire evidence. High: Cyber Essentials Plus or an in-scope ISO 27001 certificate, plus an independent report or a penetration test summary from the last 12 months |
| Standard security clauses | Larkspur's security schedule: the clauses above, with breach notice within 24 hours |
| Who signs off a high-tier supplier | The Procurement Lead, the Information Security Manager and the DPO |
| Countersignature threshold | Orders over £10,000, or any supplier holding personal data, need the Procurement Lead's countersignature |
| Supplier access process | Requested through the IT service desk; named accounts, MFA, time-limited; reviewed quarterly |
| Supplier register | On The Lark, owned by procurement, reviewed yearly per supplier |
| Exit checklist | IT removes all access within one working day of the contract end; the DPO receives the deletion certificate |

## Glossary

- **Supplier (third party):** an organisation we buy goods or services from.
- **Fourth party:** our supplier's supplier.
- **Processor:** a supplier that handles personal data on our instructions (UK GDPR).
- **Due diligence:** checking a supplier before and during the contract.
- **Tiering:** sorting suppliers by risk so the checks match.
- **Scope (of a certificate):** the parts of an organisation the certificate covers.
- **Cyber Essentials and Cyber Essentials Plus:** the UK government-backed baseline certification of five technical controls; Plus adds independent testing.
- **ISO/IEC 27001:** the international standard for an information security management system.
- **SOC 2 report:** an independent auditor's report on a service organisation's controls.
- **Penetration test:** an authorised test of a system's security.
- **Subprocessor:** a processor's own supplier that handles our personal data.
- **Supplier register:** the list of suppliers with what each holds and reaches, its tier and its owner.
- **Least privilege:** access to only what the job needs.
- **Offboarding:** removing a supplier's access and data at the end of the work.

## Sources

- NCSC, Supply chain security guidance (12 principles; published 28 January 2018, reviewed 22 October 2025): https://www.ncsc.gov.uk/collection/supply-chain-security
- NCSC, the principles by stage: https://www.ncsc.gov.uk/collection/supply-chain-security/principles-supply-chain-security
- NCSC, "How to assess and gain confidence in your supply chain cyber security" (12 October 2022): https://www.ncsc.gov.uk/collection/assess-supply-chain-cyber-security
- NCSC, Cyber Essentials overview: https://www.ncsc.gov.uk/cyberessentials/overview
- Cabinet Office, PPN 014: Cyber Essentials scheme (17 February 2025): https://www.gov.uk/government/publications/ppn-014-cyber-essentials-scheme/ppn-014-cyber-essentials-scheme-html
- Cabinet Office, procurement policy notes (PPN 09/23 for earlier procurements): https://www.gov.uk/government/collections/procurement-policy-notes
- UK GDPR Article 28: https://www.legislation.gov.uk/eur/2016/679/article/28
- UK GDPR Article 33: https://www.legislation.gov.uk/eur/2016/679/article/33
- NCSC CAF, principle A4 Supply chain: https://www.ncsc.gov.uk/collection/cyber-assessment-framework/caf-objective-a-managing-security-risk/principle-a4-supply-chain
- DSIT, Software Security Code of Practice (7 May 2025, updated 15 January 2026): https://www.gov.uk/government/publications/software-security-code-of-practice
- GOV.UK, Cyber Security and Resilience Bill (press notice, 12 November 2025): https://www.gov.uk/government/news/tough-new-laws-to-strengthen-the-uks-defences-against-cyber-attacks-on-nhs-transport-and-energy
- NIS2 Directive Article 21: https://eur-lex.europa.eu/eli/dir/2022/2555/oj
- CISA, AA23-158A, CL0P exploits MOVEit: https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-158a
- BBC News, "MOVEit hack: BBC, BA and Boots among cyber attack victims", 5 June 2023: https://www.bbc.co.uk/news/technology-65814104
- CISA, Kaseya ransomware attack guidance, 12 July 2021: https://www.cisa.gov/news-events/news/kaseya-ransomware-attack-guidance-affected-msps-and-their-customers
- Reuters, "Up to 1,500 businesses affected by ransomware attack, U.S. firm's CEO says", 5 July 2021: https://www.reuters.com/technology/hackers-demand-70-million-liberate-data-held-by-companies-hit-mass-cyberattack-2021-07-05/
- BBC News, Swedish Coop supermarkets shut, 3 July 2021: https://www.bbc.co.uk/news/technology-57707530
- Synnovis cyber update: https://www.synnoviscyberupdate.co.uk/
- CrowdStrike, Falcon content update remediation and guidance hub: https://www.crowdstrike.com/falcon-content-update-remediation-and-guidance-hub/
- Microsoft, "Helping our customers through the CrowdStrike outage", 20 July 2024: https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/
- AICPA, SOC suite of services: https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2
