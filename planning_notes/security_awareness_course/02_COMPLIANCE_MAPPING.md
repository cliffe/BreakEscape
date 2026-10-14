# Compliance mapping

Which standards and laws require staff security awareness training, what each one actually asks for, and which modules and features of this course contribute. Researched and checked on 14 October 2026; section 3 says how each item was checked.

## 1. Purpose and how to use it

- **One source for compliance references.** Each module's "Compliance coverage" section cites requirements using the short references in section 2, written exactly as shown there.
- **Say "contributes to" by default.** Say "meets" only when a module, on its own, covers everything the requirement asks training to cover. For example, core_01 and core_02 together meet PCI DSS 12.6.3.1 (phishing and social engineering); neither meets it alone.
- **Most requirements are about the programme, not one module.** Who is trained, when, how often, through which methods and with what records: no single module meets those. Section 5 says which course feature does.
- **The course supports compliance; it doesn't certify it.** Customers stay responsible for their own programme, risk assessment and evidence, and their auditors decide. This file is a planning aid, not legal advice.
- **UK first, then the EU and the US** (as recommended in `DECISIONS_PENDING.md`). EU customers cite EU GDPR article numbers, which match UK GDPR for everything used here.
- **Keep it current.** Requirements change. Each framework section in section 3 says how it was checked. Re-check this file at least once a year and whenever a module needs a reference that isn't here, and log what changed in section 6.

Who uses it: module writers (for "Compliance coverage" and the assessment notes), whoever answers customers' "does this cover X?" questions, and later a customer-facing version for compliance teams.

## 2. Short reference names

Write the framework's short name before every number ("PCI DSS 12.6.3.1", never "12.6.3.1" on its own). Several references from one framework: "NIST AT-2, AT-2(3) and AT-2(4)". ISO clauses take "cl.", Annex A controls take "A.". "Art" has no full stop.

| Framework | Short reference (use exactly) | Refers to |
|---|---|---|
| ISO/IEC 27001:2022 | ISO 27001 cl. 7.2 | Clause 7.2 Competence |
| | ISO 27001 cl. 7.3 | Clause 7.3 Awareness |
| | ISO 27001 A.5.1 | Annex A control 5.1 Policies for information security (communicated to and acknowledged by relevant personnel) |
| | ISO 27001 A.6.3 | Annex A control 6.3 Information security awareness, education and training |
| | ISO 27001 A.6.8 | Annex A control 6.8 Information security event reporting |
| ISO/IEC 27002:2022 | ISO 27002 6.3 | Implementation guidance for control 6.3 |
| NIST SP 800-53 Rev. 5 | NIST AT-2 | AT-2 Literacy Training and Awareness |
| | NIST AT-2(1) to NIST AT-2(6) | AT-2 enhancements: (1) Practical Exercises, (2) Insider Threat, (3) Social Engineering and Mining, (4) Suspicious Communications and Anomalous System Behavior, (5) Advanced Persistent Threat, (6) Cyber Threat Environment |
| | NIST AT-3, NIST AT-3(5) | Role-based Training; AT-3(5) Processing Personally Identifiable Information |
| | NIST AT-4 | Training Records |
| NIST SP 800-50 Rev. 1 | NIST SP 800-50r1 | Building a Cybersecurity and Privacy Learning Program (guidance) |
| CIS Critical Security Controls v8.1 | CIS 14.1 to CIS 14.9 | Control 14 Security Awareness and Skills Training, safeguards 14.1 to 14.9 |
| PCI DSS v4.0.1 | PCI DSS 12.6.1, 12.6.2, 12.6.3, 12.6.3.1, 12.6.3.2 | The security awareness programme requirements |
| | PCI DSS 6.2.2, 8.3.8, 9.5.1.3, 12.10.4 | Related role training and communication requirements |
| NIS2 Directive (EU) 2022/2555 | NIS2 Art 20(2), NIS2 Art 21(2)(d), NIS2 Art 21(2)(g) | Management body training; supply chain security; cyber hygiene and training |
| | NIS2 recital 89 | Examples of cyber hygiene and training (context, not a requirement) |
| NIS2 Implementing Regulation (EU) 2024/2690 | NIS2 IR 5.1.4, IR 8.1, IR 8.2, IR 10.1, IR 10.2 | Points in the Annex (supplier contracts, awareness, security training, human resources security, background checks) |
| | NIS2 IR recital 20 | Examples of user cyber hygiene (context, not a requirement) |
| DORA Regulation (EU) 2022/2554 | DORA Art 5(2)(g), Art 5(4), Art 13(6), Art 16(1)(h), Art 30(2)(i) | Budget, management body training, awareness and resilience training, simplified regime, contracts with ICT providers |
| DORA RTS (EU) 2024/1774 | DORA RTS Art 19 | Human resources policy |
| UK GDPR | UK GDPR Art 5(1)(f), Art 5(2), Art 24, Art 28, Art 32, Art 32(4), Art 33, Art 39(1)(b), Art 47(2)(n) | Security, accountability, controller responsibility, processors, security of processing, breach notification, DPO tasks, binding corporate rules. EU customers: "EU GDPR Art ..." with the same numbers |
| ICO | ICO training toolkit | The "Training and awareness" control measures in the ICO's data protection audit framework (Accountability toolkit) |
| NCSC Cyber Assessment Framework v4.0 | NCSC CAF B6, NCSC CAF B6.a, NCSC CAF B6.b | Principle B6 Staff awareness and training; B6.a Cyber Security Culture; B6.b Cyber Security Training |
| NHS DSPT 2026-27 (v9) | DSPT 2.1.1, 3.2.1, 3.3.1, 3.4.1, 6.3.2, 10.2.1 | Evidence items for categories 3 and 4 (add the category when it matters: "DSPT 3.2.1 (categories 3 and 4)") |
| | DSPT 3.1.1 to 3.1.3 | Evidence items for category 2 (IT suppliers) |
| | DSPT B6.a, DSPT B6.b | The CAF-aligned DSPT used by large NHS organisations |
| Cyber Governance Code of Practice | Cyber Governance Code C1, C3, C4, D2 | Board actions under principles C (People) and D (Incident planning, response and recovery) |
| EU AI Act (EU) 2024/1689 | AI Act Art 4 | AI literacy, as amended from 27 July 2026 |
| HIPAA Security Rule (45 CFR) | HIPAA 164.308(a)(5), HIPAA 164.308(a)(5)(ii)(A) to (D), HIPAA 164.316(b) | Security awareness and training standard; its four implementation specifications; documentation and retention |
| NYDFS 23 NYCRR Part 500 | NYDFS 500.14(a)(3), NYDFS 500.10(a)(2), NYDFS 500.4(d)(1) | Annual awareness training including social engineering; training for cyber security staff; board understanding |
| FTC Safeguards Rule (16 CFR 314) | FTC 314.4(e), FTC 314.4(e)(3), FTC 314.4(f) | Staff awareness training; training for security staff; overseeing service providers |
| CMMC (32 CFR 170) | CMMC AT.L2-3.2.1, AT.L2-3.2.2, AT.L2-3.2.3; CMMC AT.L3-3.2.1e, AT.L3-3.2.2e | Level 2 awareness and training practices (from NIST SP 800-171 Rev. 2); Level 3 enhanced practices |
| SOC 2 (AICPA Trust Services Criteria) | SOC 2 CC1.4, SOC 2 CC2.2 | Competence; internal communication (security awareness training is a point of focus) |
| Watch only | CSR Bill; Cyber Essentials v3.3 | Not training requirements: see sections 3.10 and 3.13 |

## 3. Frameworks

One table per framework: the requirement in plain words, the topics it names, when training must happen, the roles it singles out, the evidence an auditor usually expects, and how it was checked. Sources are listed under each table and again in section 8.

**Checked** (all on 14 October 2026):

- **Primary:** checked against the official text (the standard, the legislation, or the regulator's or publisher's own pages).
- **Secondary:** the official text is paywalled or blocked automated access, so it was checked against several secondary sources that agree. Check the official text before quoting it to a customer.
- **To verify:** not checked; our best understanding. Don't rely on it until someone checks it.

A blank cell means the framework says nothing specific on that point.

### 3.1 ISO/IEC 27001:2022 and ISO/IEC 27002:2022

The international standard for an information security management system (ISMS). Organisations certify against 27001; 27002 is guidance on the Annex A controls. Both are paid documents.

| Ref | Requirement in plain words | Topics named | Frequency or trigger | Roles | Evidence | Checked |
|---|---|---|---|---|---|---|
| ISO 27001 cl. 7.2 | Decide what competence people need where their work affects information security. Make sure they have it through education, training or experience. Act on gaps and check that the action worked. | | | People whose work affects information security performance | Documented information kept as evidence of competence (a required record), such as training records and a competence matrix | Secondary |
| ISO 27001 cl. 7.3 | Everyone working under the organisation's control is aware of the information security policy, how they contribute to the ISMS (including the benefits of better security) and what happens if they don't follow its requirements. | Policy; own contribution; consequences | | Everyone under the organisation's control, including contractors | Audit interviews; communication records | Secondary |
| ISO 27001 A.5.1 | The information security policy and topic-specific policies are defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and after significant changes. | Policies | Planned intervals; on significant change | Relevant personnel and interested parties | Approved policies; acknowledgement records | Secondary |
| ISO 27001 A.6.3 | "Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization's information security policy, topic-specific policies and procedures, as relevant for their job function." | Policies and procedures | "Regular updates" | By job function; relevant interested parties | Statement of Applicability; training plan; training records | Secondary |
| ISO 27001 A.6.8 | A route for staff to report observed or suspected security events quickly. | Event reporting | | All staff | The reporting route and its records | Secondary (title); wording to verify |
| ISO 27002 6.3 | Guidance. Run the programme in line with the organisation's policies and the controls it has. Awareness covers: management's commitment to information security; the rules and obligations that apply (policies, laws, regulations, contracts); personal accountability for actions and inactions; basic procedures such as reporting security events, and baseline controls such as password security, malware controls and clear desk and clear screen; and contact points and resources for help. Delivery can include campaigns, booklets, posters, newsletters, websites, briefings, e-learning and emails. | As listed | Periodic; on joining; on moving to a role with substantially different security requirements | Internal and external personnel | | Secondary |

To verify for ISO 27002 6.3 (our recollection of the text, not yet checked): assess understanding at the end of each activity; build the programme on lessons from incidents; a separate training plan for technical teams; explain "why", not only "what" and "how".

Sources: ISO catalogue pages for [ISO/IEC 27001:2022](https://www.iso.org/standard/27001) and [ISO/IEC 27002:2022](https://www.iso.org/standard/75652.html); clause titles confirmed by the [GOV.UK mapping of the Cyber Governance Code to ISO/IEC 27001:2022](https://www.gov.uk/government/publications/cyber-governance-mapping/mapping-cyber-governance-code-to-isoiec-27001-2022); control 6.3 wording and guidance from several secondary sources, including [ISMS.online on ISO 27002 control 6.3](https://www.isms.online/iso-27002/control-6-3-information-security-awareness-education-and-training).

### 3.2 NIST SP 800-53 Rev. 5 and SP 800-50 Rev. 1

The US federal control catalogue, widely used elsewhere. Current release 5.2.0 (27 August 2025). Where the text says "organization-defined", the organisation chooses the frequency or event.

| Ref | Requirement in plain words | Topics named | Frequency or trigger | Roles | Evidence | Checked |
|---|---|---|---|---|---|---|
| NIST SP 800-50r1 | Guidance on running a "Cybersecurity and Privacy Learning Program" through its life cycle, with metrics and evaluation. Final, September 2024; replaces SP 800-50 (2003) and SP 800-16 (1998). Guidance, not a control. | | | | Suggests metrics and evaluation methods | Primary |
| NIST AT-2 | Security and privacy literacy training for all system users; awareness activities; keep the content current; build in lessons from incidents. | The discussion names: why security and privacy matter, what users do to stay secure and to respond to suspected incidents, operations security, handling personal data | On joining, then at a frequency the organisation sets; after system changes or events the organisation sets | All users, "including managers, senior executives, and contractors" | The discussion suggests testing users' knowledge | Primary |
| NIST AT-2(1) | Practical exercises that simulate events and incidents. | The discussion names no-notice social engineering, spear phishing, malicious attachments and links | | | | Primary |
| NIST AT-2(2) | Recognise and report possible signs of insider threat. | Insider threat | | | | Primary |
| NIST AT-2(3) | Recognise and report social engineering and social mining. | Phishing, pretexting, impersonation, baiting, quid pro quo, thread-jacking, social media exploitation, tailgating | | | | Primary |
| NIST AT-2(4) | Recognise suspicious communications and odd system behaviour, using indicators the organisation sets. | Suspicious email and web content; anomalous system behaviour | | | | Primary |
| NIST AT-2(5) | Training on advanced persistent threats. | Advanced persistent threats | | | | Primary |
| NIST AT-2(6) | Training on the current threat environment, and using current threat information in operations. | Current threats | | | | Primary |
| NIST AT-3 | Role-based security and privacy training. Enhancements cover environmental and physical controls, practical exercises, and processing personal data (AT-3(5)). | Role-specific | Before access is authorised or duties start, then at a frequency the organisation sets; after system changes | The discussion lists senior leaders, system owners, security and privacy officers, acquisition and procurement officials, architects, developers, administrators, auditors, incident response and contingency staff, and staff with access to personal data | | Primary |
| NIST AT-4 | Document and monitor all awareness and role-based training; keep individual training records for a period the organisation sets. | | | | Individual training records | Primary |

Baselines (SP 800-53B): Low includes AT-1, AT-2, AT-2(2), AT-3 and AT-4; Moderate and High add AT-2(3); the privacy baseline adds AT-3(5). AT-2(1), AT-2(4), AT-2(5) and AT-2(6) are in no baseline, so they are optional.

Sources: [SP 800-53 Rev. 5 (release 5.2.0)](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final); NIST's [OSCAL catalogue and baselines](https://github.com/usnistgov/oscal-content); [SP 800-50 Rev. 1](https://csrc.nist.gov/pubs/sp/800/50/r1/final).

### 3.3 CIS Critical Security Controls v8.1, Control 14

v8.1 is current (v8 is listed as the previous version). CIS doesn't prescribe evidence. Implementation Group 1 (IG1) is the basic level every organisation should meet; IG2 and IG3 add to it.

| Ref | Title | Topics and frequency named | Implementation Groups | Checked |
|---|---|---|---|---|
| CIS 14.1 | Establish and Maintain a Security Awareness Program | Train at hire and at least annually; review and update content annually or after significant changes in the organisation | IG1 to IG3 | Primary |
| CIS 14.2 | Train Workforce Members to Recognize Social Engineering Attacks | Phishing, business email compromise (added in v8.1), pretexting, tailgating | IG1 to IG3 | Primary |
| CIS 14.3 | Train Workforce Members on Authentication Best Practices | MFA, password composition, credential management | IG1 to IG3 | Primary |
| CIS 14.4 | Train Workforce on Data Handling Best Practices | Identifying, storing, transferring, archiving and destroying sensitive data; clear screen and clear desk; locking screens; wiping whiteboards | IG1 to IG3 | Primary |
| CIS 14.5 | Train Workforce Members on Causes of Unintentional Data Exposure | Sending data to the wrong person, losing a portable device, publishing to unintended audiences | IG1 to IG3 | Primary |
| CIS 14.6 | Train Workforce Members on Recognizing and Reporting Security Incidents | Recognising and reporting a potential incident | IG1 to IG3 | Primary |
| CIS 14.7 | Train Workforce on How to Identify and Report if Their Enterprise Assets are Missing Security Updates | Spotting and reporting out-of-date software and failed automated tools | IG1 to IG3 | Primary |
| CIS 14.8 | Train Workforce on the Dangers of Connecting to and Transmitting Enterprise Data Over Insecure Networks | Insecure networks; securing home networks for remote workers | IG1 to IG3 | Primary |
| CIS 14.9 | Conduct Role-Specific Security Awareness and Skills Training | Examples: secure system administration for IT staff, OWASP Top 10 for web developers, advanced social engineering awareness for high-profile roles | IG2 and IG3 only | Primary |

Sources: [CIS Controls Navigator v8.1](https://www.cisecurity.org/controls/cis-controls-navigator); [CIS Control 14](https://www.cisecurity.org/controls/security-awareness-and-skills-training).

### 3.4 PCI DSS v4.0.1

For any organisation that stores, processes or transmits payment card data. Version 4.0.1 (June 2024) is current. Requirements 12.6.2, 12.6.3.1, 12.6.3.2 and 12.10.4.1 were best practice until 31 March 2025 and are now mandatory. The evidence column follows the standard's own testing procedures.

| Ref | Requirement in plain words | Topics named | Frequency or trigger | Roles | Evidence | Checked |
|---|---|---|---|---|---|---|
| PCI DSS 12.6 | "Security awareness education is an ongoing activity." | | Ongoing | | | Primary |
| PCI DSS 12.6.1 | A formal programme makes all personnel aware of the security policy and procedures, and of their role in protecting cardholder data. | Policy; their own role | | All personnel | The programme documentation | Primary |
| PCI DSS 12.6.2 | Review the programme, and update it for new threats and vulnerabilities. | Current threats | Review at least every 12 months; update as needed | | Programme content, evidence of reviews, interviews | Primary |
| PCI DSS 12.6.3 | Train personnel on hire and at least every 12 months, using **multiple methods of communication**. Personnel **acknowledge at least every 12 months** that they have read and understood the security policy and procedures. | Policy | On hire, then every 12 months. Guidance: also when someone moves into a role that can affect card data security | All personnel; content can vary by role | Attendance records; materials showing more than one method; staff interviews; written or electronic acknowledgements | Primary |
| PCI DSS 12.6.3.1 | Training covers threats and vulnerabilities to card data, including at least phishing and related attacks, and social engineering. | Phishing; social engineering. Good practice: how to spot, react to and report them; example phishing emails; periodic tests of how often staff report | As 12.6.3 | | Training content | Primary |
| PCI DSS 12.6.3.2 | Training covers acceptable use of end-user technologies, in line with the organisation's own acceptable use policies (12.2.1). | Acceptable use | As 12.6.3 | | Training content | Primary |
| PCI DSS 6.2.2 | Developers of bespoke and custom software are trained in software security for their job and languages, secure design and coding, and any security testing tools. | Secure development | At least every 12 months | Developers | Training records; interviews | Primary |
| PCI DSS 8.3.8 | Authentication policies and procedures are documented and communicated to all users: choosing strong factors, protecting them, not reusing passwords, changing them and reporting if compromised. | Passwords and authentication | | All users | | Primary |
| PCI DSS 9.5.1.3 | Staff who work with card terminals are trained to spot tampering and substitution, check the identity of anyone claiming to be a repair engineer, and report suspicious behaviour. | Terminal tampering | | Staff in point-of-interaction environments | Training materials; interviews | Primary |
| PCI DSS 12.10.4 | Incident response staff are trained on their responsibilities (12.10.4.1: how often is set by a targeted risk analysis). | Incident response | Periodic, set by risk analysis | Incident response staff | Training documentation | Primary |

Note: the standard says 12.6.3.1 and the technical anti-phishing controls in 5.4.1 are separate requirements; meeting one doesn't meet the other.

Source: [PCI Security Standards Council document library](https://www.pcisecuritystandards.org/document_library/) (free; the download asks you to accept a licence). Checked against *Payment Card Industry Data Security Standard: Requirements and Testing Procedures, v4.0.1*, June 2024, pages 308 to 312 for 12.6.

### 3.5 NIS2 Directive and its Implementing Regulation

For essential and important entities in the EU. Member States had to apply their national laws from 18 October 2024, so the detail (who counts as management, how often, sanctions) differs by country. The Implementing Regulation (EU) 2024/2690 (in force 7 November 2024) applies **only** to DNS service providers, top-level domain registries, cloud, data centre and content delivery network providers, managed service and managed security service providers, online marketplaces, search engines, social networks and trust service providers. For other NIS2 entities, national law and guidance set the detail.

| Ref | Requirement in plain words | Topics named | Frequency or trigger | Roles | Evidence | Checked |
|---|---|---|---|---|---|---|
| NIS2 Art 20(2) | Member States must require members of management bodies to follow training, and must encourage entities to offer similar training to all staff regularly, so they can identify risks and judge risk-management practices and their effect on the entity's services. | Identifying risks; assessing risk management | Management: required, with frequency set nationally. Staff: "on a regular basis" (encouraged, not required) | Members of management bodies | Set by national law | Primary |
| NIS2 Art 21(2)(g) | Risk-management measures must include "basic cyber hygiene practices and cybersecurity training". Recital 89 gives examples, including organising staff training and raising awareness of cyber threats, phishing and social engineering. | Phishing; social engineering; updates; access management | | All in-scope entities | Supervisory review | Primary |
| NIS2 Art 21(2)(d) | Risk-management measures must include supply chain security. | Suppliers | | | | Primary |
| NIS2 IR 8.1 | Staff (including management body members) and, where appropriate, direct suppliers and service providers know the risks and apply cyber hygiene. The awareness programme is scheduled over time, repeated, covers new staff, follows the security policies, and covers relevant threats, the measures in place, contact points and resources, and cyber hygiene for users. It is tested for effectiveness where appropriate and updated at planned intervals. Recital 20 lists clear desk and screen, MFA, safe email and web browsing, phishing and social engineering, and secure remote working. | As listed | Repeated; planned intervals; new joiners | Includes management bodies, suppliers | Evidence of effectiveness testing | Primary |
| NIS2 IR 8.2 | Identify roles that need security skills and train them regularly, relevant to their job, with effectiveness assessed. Training covers secure configuration and operation (including mobile devices), known threats and how to behave when security events occur. Also applies when staff move into such roles. | As listed | Regular; on moving into a role | Security-relevant roles | Training programme; effectiveness assessment | Primary |
| NIS2 IR 10.1, IR 10.2 | Human resources security: everyone understands and follows the cyber hygiene practices from 8.1; privileged users and management bodies understand their roles; role assignments reviewed at least annually; background checks where needed. | | Annual review of role assignments | Privileged users; management bodies | | Primary |
| NIS2 IR 5.1.4 | Supplier contracts set security requirements, including the awareness, skills and training required of the supplier's staff, where appropriate. | | | Suppliers | Contract clauses | Primary |

Sources: [Directive (EU) 2022/2555](https://eur-lex.europa.eu/eli/dir/2022/2555/oj); [Implementing Regulation (EU) 2024/2690](https://eur-lex.europa.eu/eli/reg_impl/2024/2690/oj). Text taken from the Official Journal through the EU Publications Office.

### 3.6 DORA (Digital Operational Resilience Act)

For EU financial entities. Applies from 17 January 2025.

| Ref | Requirement in plain words | Topics named | Frequency or trigger | Roles | Evidence | Checked |
|---|---|---|---|---|---|---|
| DORA Art 13(6) | ICT security awareness programmes and digital operational resilience training are **compulsory modules** in staff training schemes, for all employees and senior management, at a level of complexity that fits each person's role. ICT third-party service providers are included where appropriate. | ICT security; operational resilience | | All staff; senior management; ICT providers | Training scheme and records | Primary |
| DORA Art 5(4) | Members of the management body keep their knowledge and skills up to date, including by specific training on a regular basis, in proportion to the ICT risk. | ICT risk | Regular | Management body | Board training records | Primary |
| DORA Art 5(2)(g) | The management body sets and reviews the budget, including for the awareness programmes and training. | | | Management body | Budget approval | Primary |
| DORA Art 16(1)(h) | Entities under the simplified regime still develop awareness programmes and training for staff and management, in line with their risk profile. | | | Staff; management | | Primary |
| DORA Art 30(2)(i) | Contracts for ICT services set the conditions for the provider's participation in the entity's awareness programmes and training. | | | ICT providers | Contract clauses | Primary |
| DORA RTS Art 19 | The human resources policy requires staff, and provider staff who use the entity's ICT assets, to know and follow the ICT security policies, and to know the channels for reporting anomalous behaviour (including whistleblowing channels). | Policies; reporting | | Staff; provider staff | Human resources policy | Primary |

Sources: [Regulation (EU) 2022/2554](https://eur-lex.europa.eu/eli/reg/2022/2554/oj); [Delegated Regulation (EU) 2024/1774](https://eur-lex.europa.eu/eli/reg_del/2024/1774/oj).

### 3.7 UK GDPR and EU GDPR, and the ICO's expectations

No article says "train all staff". Training is the usual evidence that an organisation has the "organisational measures" the law requires, and the ICO checks for it. The UK and EU articles cited here have the same numbers and, on these points, the same effect. The UK wording differs in places: "domestic law" for "Union or Member State law", and "the Commission" for the regulator.

| Ref | Requirement in plain words | Roles | Checked |
|---|---|---|---|
| UK GDPR Art 5(1)(f), Art 5(2) | Keep personal data secure using appropriate technical or organisational measures, and be able to show that you comply. | Controller | Primary |
| UK GDPR Art 24 | Put appropriate measures in place to comply and be able to show it, review them, and have data protection policies where proportionate. | Controller | Primary |
| UK GDPR Art 32, Art 32(4) | Security appropriate to the risk, including regularly testing how well the measures work. Take steps so that anyone working under the controller's or processor's authority who can access personal data only processes it on instructions. | Anyone with access to personal data | Primary |
| UK GDPR Art 33 | The controller notifies the regulator (in the UK text, since 30 September 2026, "the Commission") of a personal data breach without undue delay and, where feasible, within 72 hours of becoming aware of it, unless it is unlikely to result in a risk; a processor tells the controller without undue delay. This only works if staff report possible breaches internally at once. | Controller; processor | Primary |
| UK GDPR Art 39(1)(b) | The DPO monitors compliance, including "awareness-raising and training of staff involved in processing operations, and the related audits". | DPO, where one is designated | Primary |
| UK GDPR Art 47(2)(n) | Binding corporate rules must set out "the appropriate data protection training to personnel having permanent or regular access to personal data". | Groups using binding corporate rules | Primary |
| UK GDPR Art 28 | Use only processors that give sufficient guarantees of appropriate measures, under a contract with set terms (context for role_07, not a training article). | Controllers; processors | Primary |

**The ICO training toolkit.** The ICO's Accountability Framework pages have moved into its data protection audit framework, which the ICO calls "an extension of our existing Accountability Framework". It is written for large organisations; small ones are pointed to the ICO's self-assessment toolkit. A banner says the guidance is under review following the Data (Use and Access) Act. Its "Training and awareness" control measures (Checked: Primary):

| Control measure | What the ICO expects | Timing | Evidence |
|---|---|---|---|
| An all-staff training programme | Covers key areas such as handling requests, data sharing, information security, personal data breaches and records management; signed off by senior management; reviewed regularly | | The programme and its sign-off |
| Induction and refresher training | Induction for all staff, whatever their contract or grade, **before they access personal information and within one month of starting**; refresher training at appropriate intervals. Options include setting a deadline for refreshers and removing access if it is missed | Induction within one month and before access; refresher at set intervals | Completion rates; records of completed training, including for senior staff |
| Specialised training | Extra training and professional development for roles with key data protection duties, such as DPOs and subject access and records management teams, based on a training needs analysis | Before starting the role; proportionate refreshers | Copies of the training material and details of who received it |
| Evidence that staff complete and understand training | An assessment at the end of training, which could include a minimum pass mark; completion monitored at all levels; follow-up with non-completers; staff feedback | | Assessment results; completion figures; KPIs |
| Awareness raising | A variety of methods (emails, team briefings, posters, screensavers); easy access to material and to the people to ask | Ongoing | |

Sources: UK GDPR on legislation.gov.uk ([Article 5](https://www.legislation.gov.uk/eur/2016/679/article/5), [24](https://www.legislation.gov.uk/eur/2016/679/article/24), [28](https://www.legislation.gov.uk/eur/2016/679/article/28), [32](https://www.legislation.gov.uk/eur/2016/679/article/32), [33](https://www.legislation.gov.uk/eur/2016/679/article/33), [39](https://www.legislation.gov.uk/eur/2016/679/article/39), [47](https://www.legislation.gov.uk/eur/2016/679/article/47)); [EU GDPR, Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj); [ICO data protection audit framework](https://ico.org.uk/for-organisations/advice-and-services/audits/data-protection-audit-framework/) and its [Training and awareness toolkit](https://ico.org.uk/for-organisations/advice-and-services/audits/data-protection-audit-framework/toolkits/accountability/training-and-awareness/).

### 3.8 NCSC Cyber Assessment Framework (B6) and the Cyber Governance Code of Practice

The CAF is used by UK regulators of essential services and, in an adapted form, by the NHS DSPT. Version 4.0 was released on 4 August 2025. The Cyber Governance Code of Practice (DSIT with the NCSC, 8 April 2025) is voluntary and written for the boards of medium and large organisations.

| Ref | Requirement in plain words | Frequency or trigger | Roles | Evidence | Checked |
|---|---|---|---|---|---|
| NCSC CAF B6 | Staff have the awareness, knowledge and skills to carry out their roles securely where they support essential functions. The guidance favours a range of methods (briefings, online courses, blogs, simulated attacks) with ongoing reminders and top-up training. | Ongoing | All staff | | Primary |
| NCSC CAF B6.a | A positive cyber security culture. *Not achieved* if people don't know how to raise a concern, or believe that reporting may get them into trouble. *Achieved* when executives communicate priorities clearly, people who report are treated positively and recognised, and reporting is routine. | | Executive management; everyone | | Primary |
| NCSC CAF B6.b | Appropriate training. *Not achieved* if: any team has no training; training is restricted to some roles; **training records are lacking or incomplete**; training is treated as a "silver bullet"; success is measured only by the number of people reached; or materials are out of date or contradict policy. *Partially achieved*: training defined for all roles, "from executives to the most junior"; a range of teaching methods; information easy to find. *Achieved*: everyone follows a training path; **each individual's training is tracked and refreshed at suitable intervals**; activities are routinely evaluated for reach and effectiveness. | "Suitable intervals" | Executives to the most junior | Individual training records; evaluation of effectiveness | Primary |
| Cyber Governance Code C1 | Promote a cyber security culture that encourages positive behaviour and accountability at all levels. | | Board | | Primary |
| Cyber Governance Code C3 | "Undertake training to improve your own cyber literacy and take responsibility for the security of the data and digital assets that you use." | | Each director | | Primary |
| Cyber Governance Code C4 | "Gain assurance, using suitable metrics, that the organisation has an effective cyber security training, education and awareness programme." | | Board | Metrics | Primary |
| Cyber Governance Code D2 | Gain assurance that the incident plan is exercised at least annually with relevant stakeholders, and that lessons are fed back. | At least annually | Board | | Primary |

The NCSC's free Cyber Governance Training supports the Code: an introduction and five modules of about 20 minutes, one for each principle.

Sources: [CAF principle B6](https://www.ncsc.gov.uk/collection/cyber-assessment-framework/caf-objective-b/principle-b6-staff-awareness-and-training); [CAF changelog](https://www.ncsc.gov.uk/collection/cyber-assessment-framework/changelog); [Cyber Governance Code of Practice](https://www.gov.uk/government/publications/cyber-governance-code-of-practice/cyber-governance-code-of-practice); [NCSC Cyber Governance Training](https://www.ncsc.gov.uk/cyber-governance-for-boards/training).

### 3.9 NHS Data Security and Protection Toolkit (DSPT)

For organisations with access to NHS patient data and systems in England. The 2026-27 toolkit (version 9) was released on 2 October 2026; it is aligned to CAF version 4.0 and the deadline is 30 June 2027. The requirement depends on the organisation type.

| Organisation type | Requirement in plain words | Frequency or trigger | Roles | Evidence | Checked |
|---|---|---|---|---|---|
| NHS trusts, integrated care boards, commissioning support units and arm's length bodies (CAF-aligned toolkit since 2024-25); independent providers that are operators of essential services, and genomics organisations (since 2025-26) | DSPT B6.a and B6.b, adapted from the CAF ("information assurance" means cyber security, information governance and confidentiality). **No percentage target.** Each outcome must reach the level NHS England sets. A training needs analysis decides what each staff group needs. | Set in the training needs analysis (for example on joining and annually, or different intervals for different roles) | All staff; more for researchers, senior clinicians, information governance staff and DPOs | Training policy, training needs analysis, training materials, minutes of relevant meetings | Primary |
| The 2023-24 change for these organisations | The old rule, "train at least 95% of your staff using the national Data Security Awareness Level 1 e-learning or a local equivalent", was replaced by making sure all staff have "an appropriate understanding of information governance and cyber security". | | | | Primary |
| Categories 3 (dentists, local authorities, opticians, pharmacy, social care, universities and others), 3a, 3b and 4 (GP practices) | **DSPT 3.2.1 (mandatory): at least 95% of staff, directors, trustees and volunteers have completed training on data security and protection, and cyber security, in the last twelve months.** DSPT 2.1.1 (mandatory): an induction covering data security and protection, and cyber security. Also DSPT 3.3.1 (specialist roles), 3.4.1 (people responsible for data security and protection, such as a DPO), 6.3.2 (staff told that public Wi-Fi is unsafe for work) and 10.2.1 (due diligence on suppliers). | Induction; every twelve months | Staff, directors, trustees, volunteers; specialist roles such as Caldicott Guardian, IT, records, clinical coding and information governance | Completion percentage; induction process | Primary |
| Category 2 (IT suppliers) | DSPT 3.1.1: a training needs analysis endorsed by senior leadership. DSPT 3.1.2: activities delivered to all staff, with intervals and the proportion completing. DSPT 3.1.3: evaluation of the activities. | Set in the training needs analysis | All staff working on services to health and care | Training needs analysis; completion figures; evaluation | Primary |

Sources: [DSPT 2026-27 version 9](https://www.dsptoolkit.nhs.uk/News/169); [the training change](https://www.dsptoolkit.nhs.uk/News/Training); [the move to the CAF-aligned toolkit](https://www.dsptoolkit.nhs.uk/News/DSPT-Changes); NHS England's B6 guidance for the CAF-aligned toolkit (published as PDFs through the [DSPT news page](https://www.dsptoolkit.nhs.uk/News/PDFcafguides)).

### 3.10 UK Cyber Security and Resilience Bill, and the Data (Use and Access) Act 2025

| Item | Position on 14 October 2026 | Checked |
|---|---|---|
| Cyber Security and Resilience (Network and Information Systems) Bill | **Not yet law.** Introduced in the Commons on 12 November 2025, carried over into the new session, passed by the Commons on 16 June 2026; Lords second reading 14 July 2026, Grand Committee in September 2026; Lords report stage is scheduled for 26 October 2026. The current text (HL Bill 49) contains **no staff training or awareness duty**. It lets the Secretary of State issue a code of practice describing measures for meeting the security duties, so any training detail would arrive later through a code or regulations. Cite it as "CSR Bill" and only as something to watch. | Primary (status and text); what a future code will say is unknown |
| Data (Use and Access) Act 2025 | **No staff training duty.** Two changes matter for course content. Since 19 June 2026, controllers must make it easy to complain about their use of personal data, acknowledge a complaint within 30 days and respond without undue delay (section 103, inserting section 164A into the Data Protection Act 2018): core_05 should cover recognising a complaint. Since 30 September 2026, the Information Commission has replaced the Information Commissioner (sections 118 and 119); see section 6. | Primary |

Sources: [the Bill on bills.parliament.uk](https://bills.parliament.uk/bills/4035); [Data (Use and Access) Act 2025, section 103](https://www.legislation.gov.uk/ukpga/2025/18/section/103); [SI 2026/1015 (commencement of sections 117(4)(a), 118 and 119)](https://www.legislation.gov.uk/uksi/2026/1015/made).

### 3.11 EU AI Act, Article 4 (AI literacy)

For providers and deployers of AI systems in the EU. An organisation whose staff use AI tools at work is usually a deployer.

| Version | Requirement in plain words | From | Roles | Evidence | Checked |
|---|---|---|---|---|---|
| AI Act Art 4 as first adopted | Providers and deployers take measures to ensure, to their best extent, "a sufficient level of AI literacy" of their staff and others who operate or use AI systems on their behalf, taking into account their technical knowledge, experience, education and training, the context of use, and the people the systems affect. AI literacy means the skills, knowledge and understanding to use AI systems in an informed way and to be aware of their opportunities, risks and possible harm (Art 3(56)). | 2 February 2025 | Staff and others using AI systems for the organisation | Not specified | Primary |
| AI Act Art 4 as replaced by Regulation (EU) 2026/1744 (the Digital Omnibus on AI) | Providers and deployers "shall take measures to support the development of AI literacy" of the same people, taking into account the same factors. The obligation "does not require providers or deployers to guarantee any specific level of AI literacy of any individual." The Commission and Member States must support organisations, especially SMEs, and the Commission will publish practical examples. | 27 July 2026 (published 24 July 2026, in force three days later) | As above | Not specified; keep a record of the measures taken | Primary |

Sources: [Regulation (EU) 2024/1689](https://eur-lex.europa.eu/eli/reg/2024/1689/oj); [Regulation (EU) 2026/1744](https://eur-lex.europa.eu/eli/reg/2026/1744/oj).

### 3.12 United States

For US customers and US subsidiaries. Each rule has its own scope: HIPAA covers healthcare covered entities and their business associates, NYDFS covers New York-regulated financial services, the FTC Safeguards Rule covers non-bank financial institutions under FTC jurisdiction, CMMC covers US defence contractors, and SOC 2 is an audit framework that service organisations choose.

| Ref | Requirement in plain words | Topics named | Frequency or trigger | Roles | Evidence | Checked |
|---|---|---|---|---|---|---|
| HIPAA 164.308(a)(5) | A security awareness and training programme for all workforce members "(including management)". Four implementation specifications, all "addressable": (A) security reminders (periodic security updates); (B) protection from malicious software (guarding against, detecting and reporting it); (C) log-in monitoring (monitoring log-in attempts and reporting discrepancies); (D) password management (creating, changing and safeguarding passwords). | Malware; log-in monitoring; passwords; reminders | Not set | All workforce, including management | HIPAA 164.316(b): keep the required documentation for six years | Primary |
| HIPAA proposed rule (6 January 2025) | Proposed to replace this with training for all workforce members by the compliance date and at least every 12 months, within 30 days of a new person getting access, within 30 days of a material policy change, plus ongoing reminders covering malware and social engineering, all documented. **Not finalised**: no final rule had been published by 14 October 2026 and the rule text is unchanged. | Malware; social engineering; passwords | Proposed: annual; 30 days after access; 30 days after policy change | All workforce | Proposed: documentation of training and reminders | Primary |
| NYDFS 500.14(a)(3) | Each covered entity must "provide periodic, but at a minimum annual, cybersecurity awareness training that includes social engineering for all personnel", updated to reflect the risks found in its risk assessment. Required since 29 April 2024. | Social engineering | At least annually | All personnel | Training records | Primary |
| NYDFS 500.10(a)(2), 500.4(d)(1) | Cyber security staff receive updates and training for the relevant risks. The board must have enough understanding of cyber security matters to oversee them (advisers allowed). | | | Cyber security staff; board | | Primary |
| NYDFS industry letter on AI (16 October 2024) | Guidance: train all personnel, including senior executives and board members, on AI-related risks; train on deepfakes through simulated phishing and voice and video impersonation exercises; verify unusual requests such as urgent money transfers through another channel. | AI risks; deepfakes; verification | | All personnel; senior executives; board | | Primary |
| FTC 314.4(e) | Give personnel security awareness training, updated as necessary to reflect the risks found by the risk assessment. FTC 314.4(e)(3): give security staff updates and training. The small-business exemption (fewer than 5,000 consumers) does not cover this paragraph. | | As risks change | All personnel; security staff | | Primary |
| CMMC AT.L2-3.2.1 | Managers, system administrators and users are made aware of the security risks of their activities and of the policies, standards and procedures that apply. | Risks; policies | Set by the organisation | Managers, administrators, users | | Primary |
| CMMC AT.L2-3.2.2 | Personnel are trained to carry out their security duties. | Role-specific | Set by the organisation | Developers, architects, administrators, acquisition and procurement staff, assessors and others with security duties | | Primary |
| CMMC AT.L2-3.2.3 | Awareness training on recognising and reporting possible signs of insider threat. | Insider threat | | All staff | | Primary |
| CMMC AT.L3-3.2.1e, AT.L3-3.2.2e | Level 3 only: awareness training on hire, after a significant cyber event and at least annually, on social engineering, advanced persistent threats, breaches and suspicious behaviour, updated at least annually; practical exercises tailored by role, with feedback to individuals and their supervisors. | As listed | On hire; after a significant event; at least annually | General, specialised and privileged users | | Primary |
| SOC 2 CC1.4 | The organisation shows commitment to attracting, developing and keeping competent people. A point of focus is "Provides Training to Maintain Technical Competencies". | | | Staff, contractors, vendor staff | The organisation's own controls, as tested by the auditor | Primary (2017 criteria); 2022 point of focus wording to verify |
| SOC 2 CC2.2 | The organisation communicates internally what people need to know about objectives and responsibilities for internal control. Points of focus include communicating "Information to Improve Security Knowledge and Awareness" through a security awareness training programme, how to report failures, incidents and concerns, and whistle-blower channels. | Awareness; reporting | | All staff | As above | Primary (2017 criteria); 2022 point of focus wording to verify |

Notes: CMMC Level 2 requirements are "identical to the requirements in NIST SP 800-171 R2" (32 CFR 170.14); the short titles often quoted (Role-Based Risk Awareness, Role-Based Training, Insider Threat Awareness) come from the DoD's CMMC assessment guide, which we could only check through secondary sources. SOC 2 points of focus are not requirements; auditors test the controls the organisation describes.

Sources: [45 CFR 164.308](https://www.ecfr.gov/current/title-45/section-164.308) and [164.316](https://www.ecfr.gov/current/title-45/section-164.316); [HIPAA Security Rule proposed rule](https://www.federalregister.gov/d/2024-30983); [NYDFS Part 500](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500), [NYDFS implementation timeline](https://www.dfs.ny.gov/system/files/documents/2023/11/cybersecurity_implementation_timeline_covered_entities.pdf) and [NYDFS industry letter on AI](https://www.dfs.ny.gov/industry-guidance/industry-letters/il20241016-cyber-risks-ai-and-strategies-combat-related-risks); [16 CFR 314.4](https://www.ecfr.gov/current/title-16/section-314.4) and [314.6](https://www.ecfr.gov/current/title-16/section-314.6); [32 CFR 170.14](https://www.ecfr.gov/current/title-32/section-170.14); [NIST SP 800-171 Rev. 2](https://doi.org/10.6028/NIST.SP.800-171r2); [AICPA 2017 Trust Services Criteria (with revised points of focus, 2022)](https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022) (free download with an AICPA account).

### 3.13 Cyber Essentials

**No staff training requirement.** *Cyber Essentials: Requirements for IT Infrastructure* v3.3 (in force from 27 April 2026; v3.2 still applies to applications started before then) covers five technical controls only: firewalls, secure configuration, security update management, user access control and malware protection. The only people element sits under password-based authentication: organisations should "support users to choose unique passwords for their work accounts", for example by educating them about avoiding common passwords, promoting three random words and providing a password manager. core_03 helps with that, but don't cite Cyber Essentials as a training requirement. (Checked: Primary.)

Source: [NCSC Cyber Essentials resources](https://www.ncsc.gov.uk/cyberessentials/resources).

## 4. Coverage matrix

What each module contributes to, based on its scope in `00_COURSE_OVERVIEW.md` and `docs/agents/AWARENESS_MODULE_SEEDS.md`. Module plans are being written in parallel: this matrix will be reconciled with each module's "Compliance coverage" section after the plans are reviewed, and from then on the module plan is the authority for its own row.

How to read it:

- Cells give the reference part only. Add the framework's short name from section 2 when citing: the PCI DSS cell "12.6.3.1" is cited as "PCI DSS 12.6.3.1".
- Everything is "contributes to" unless the cell says "meets".
- A blank cell means no direct contribution.
- For organisations on the CAF-aligned DSPT (large NHS bodies), read the NCSC CAF column as DSPT B6.a and B6.b.
- Programme-level requirements (records, timing, acknowledgement, multiple methods, reviews, effectiveness) are in section 5, not here.

### Topics most frameworks name

1. **Phishing and social engineering**, including business email compromise and deepfakes: PCI DSS 12.6.3.1, CIS 14.2, NIST AT-2(3), NYDFS 500.14(a)(3), NIS2 recital 89 and IR recital 20, CMMC AT.L3-3.2.1e, the HIPAA proposed rule. Modules: core_01, core_02, core_11, core_15.
2. **Recognising and reporting incidents and suspicious activity:** CIS 14.6, ISO 27002 6.3, NIST AT-2(2) and AT-2(4), HIPAA 164.308(a)(5)(ii)(B) and (C), NCSC CAF B6.a, DORA RTS Art 19, SOC 2 CC2.2. Module: core_04, and the reporting moments in every module.
3. **Passwords, authentication and MFA:** CIS 14.3, HIPAA 164.308(a)(5)(ii)(D), ISO 27002 6.3, PCI DSS 8.3.8, IR recital 20. Module: core_03.
4. **Malware and updates:** HIPAA 164.308(a)(5)(ii)(B), ISO 27002 6.3, NIST AT-2(4), CIS 14.7, NIS2 recital 89. Modules: core_07, core_08.
5. **Handling data, clear desk and screen, accidental disclosure:** CIS 14.4 and 14.5, ISO 27002 6.3, IR recital 20, the ICO training toolkit. Modules: core_05, core_06, core_10.
6. **Remote working, insecure networks and devices:** CIS 14.8, IR recital 20, DSPT 6.3.2. Module: core_09.
7. **Policies, acceptable use and personal accountability:** ISO 27001 cl. 7.3 and A.6.3, PCI DSS 12.6.1, 12.6.3 and 12.6.3.2, CMMC AT.L2-3.2.1, DORA RTS Art 19. Module: core_16.
8. **Insider threat:** NIST AT-2(2), CMMC AT.L2-3.2.3. Module: core_14.
9. **The current threat landscape:** NIST AT-2(6), PCI DSS 12.6.2, NIS2 IR 8.1. Module: core_17 and its annual editions.
10. **AI:** AI Act Art 4; the NYDFS industry letter on AI. Modules: core_15, role_04.

### Part 1: standards and UK schemes

| Module | ISO 27001 | NIST AT | CIS 14 | PCI DSS | NCSC CAF | DSPT (categories 3 and 4) |
|---|---|---|---|---|---|---|
| core_00 First day | cl. 7.3, A.6.3 | AT-2 | 14.1, 14.6 | 12.6.1 | B6.a, B6.b | 2.1.1, 3.2.1 |
| core_01 Phishing emails | cl. 7.3, A.6.3 | AT-2, AT-2(3), AT-2(4) | 14.2, 14.6 | 12.6.3.1 (meets, with core_02) | B6.b | 2.1.1, 3.2.1 |
| core_02 Social engineering beyond email | cl. 7.3, A.6.3 | AT-2, AT-2(3) | 14.2, 14.6 | 12.6.3.1 (meets, with core_01) | B6.b | 3.2.1 |
| core_03 Passwords and MFA | A.6.3 | AT-2 | 14.3 | 8.3.8 | B6.b | 2.1.1, 3.2.1 |
| core_04 Spotting and reporting incidents | cl. 7.3, A.6.3, A.6.8 | AT-2, AT-2(4) | 14.6 | 12.6.1 | B6.a, B6.b | 2.1.1, 3.2.1 |
| core_05 Data protection and privacy | A.6.3 | AT-2 | 14.4, 14.5 | | B6.b (DSPT form only) | 2.1.1, 3.2.1 |
| core_06 Handling information | A.6.3 | AT-2 | 14.4, 14.5 | | B6.b | 3.2.1 |
| core_07 Malware, ransomware and updates | A.6.3 | AT-2, AT-2(4), AT-2(6) | 14.6, 14.7 | 12.6.3.1 | B6.b | 3.2.1 |
| core_08 Safe web and downloads | A.6.3 | AT-2, AT-2(4) | 14.2, 14.6 | 12.6.3.1 | B6.b | 3.2.1 |
| core_09 Remote and mobile working | A.6.3 | AT-2 | 14.5, 14.8 | | B6.b | 3.2.1, 6.3.2 |
| core_10 Physical security | A.6.3 | AT-2, AT-2(3) | 14.2, 14.4 | 12.6.3.1; 9.5.1.3 (in part) | B6.b | 3.2.1 |
| core_11 Payment fraud and BEC | A.6.3 | AT-2, AT-2(3) | 14.2 | 12.6.3.1 | B6.b | 3.2.1 |
| core_12 Social media and oversharing | A.6.3 | AT-2, AT-2(3) | 14.2, 14.5 | 12.6.3.1 | B6.b | 3.2.1 |
| core_13 Removable media, cloud and shadow IT | A.6.3 | AT-2 | 14.4, 14.5 | 12.6.3.2 | B6.b | 3.2.1 |
| core_14 Insider risk | cl. 7.3, A.6.3 | AT-2, AT-2(2) | 14.6 | | B6.a, B6.b | 3.2.1 |
| core_15 Generative AI and deepfakes | A.6.3 | AT-2, AT-2(3), AT-2(6) | 14.2, 14.5 | 12.6.3.1 | B6.b | 3.2.1 |
| core_16 Acceptable use and your responsibilities | cl. 7.3, A.6.3 | AT-2 | 14.1 | 12.6.1; 12.6.3.2 (meets, with the organisation's own policy loaded through HA-07); 12.6.3 acknowledgement (with HA-07) | B6.b | 2.1.1, 3.2.1 |
| core_17 Capstone: the annual assessment | cl. 7.2, cl. 7.3, A.6.3 | AT-2, AT-2(1) | 14.1 | 12.6.3, 12.6.3.1 | B6.b | 3.2.1 |
| role_01 Leaders and boards | cl. 7.2 | AT-3 | 14.9 | | B6.a, B6.b | 3.4.1 |
| role_02 Finance and payments | cl. 7.2, A.6.3 | AT-3, AT-2(3) | 14.9 | 12.6.1, 12.6.3.1 | B6.b | |
| role_03 IT administrators and service desk | cl. 7.2 | AT-3, AT-2(3) | 14.9 | 12.10.4 (in part) | B6.b | 3.3.1 |
| role_04 Developers | cl. 7.2 | AT-3 | 14.9 | 6.2.2 (in part) | B6.b | 3.3.1 |
| role_05 People managers and HR | cl. 7.2, A.6.3 | AT-3, AT-2(2) | 14.9 | | B6.a, B6.b | |
| role_06 Customer-facing and contact centre | cl. 7.2, A.6.3 | AT-3, AT-2(3) | 14.9 | 12.6.1, 12.6.3.1 | B6.b | |
| role_07 Procurement and supplier management | cl. 7.2 | AT-3 | 14.9 | | B6.b | 10.2.1 (supports) |
| sector_01 Healthcare | A.6.3 | AT-2 | 14.4, 14.6 | | B6.a, B6.b | 2.1.1, 3.2.1 |

### Part 2: EU law, UK data protection, board guidance and US rules

| Module | NIS2 and IR | DORA | UK GDPR and ICO | Cyber Governance Code | AI Act | US rules |
|---|---|---|---|---|---|---|
| core_00 First day | Art 21(2)(g); IR 8.1 | Art 13(6); RTS Art 19 | ICO training toolkit (induction) | | | FTC 314.4(e); SOC 2 CC2.2 |
| core_01 Phishing emails | Art 21(2)(g); IR 8.1 | Art 13(6) | Art 5(1)(f), Art 32 | | | NYDFS 500.14(a)(3); FTC 314.4(e); SOC 2 CC2.2 |
| core_02 Social engineering beyond email | Art 21(2)(g); IR 8.1 | Art 13(6) | Art 5(1)(f), Art 32 | | | NYDFS 500.14(a)(3); FTC 314.4(e) |
| core_03 Passwords and MFA | Art 21(2)(g); IR 8.1 | Art 13(6) | Art 32 | | | HIPAA 164.308(a)(5)(ii)(C) and (D); FTC 314.4(e); CMMC AT.L2-3.2.1 |
| core_04 Spotting and reporting incidents | Art 21(2)(g); IR 8.1 | Art 13(6); RTS Art 19 | Art 32, Art 33 (internal reporting); ICO training toolkit (breaches) | | | HIPAA 164.308(a)(5)(ii)(B) and (C); CMMC AT.L2-3.2.1; SOC 2 CC2.2 |
| core_05 Data protection and privacy | | | Art 5(1)(f), Art 5(2), Art 24, Art 32(4), Art 33; ICO training toolkit (all-staff programme topics) | | | |
| core_06 Handling information | Art 21(2)(g); IR 8.1 | Art 13(6) | Art 5(1)(f), Art 32, Art 32(4); ICO training toolkit (data sharing, records) | | | FTC 314.4(e) |
| core_07 Malware, ransomware and updates | Art 21(2)(g); IR 8.1 | Art 13(6) | Art 32 | | | HIPAA 164.308(a)(5)(ii)(B); FTC 314.4(e); CMMC AT.L2-3.2.1 |
| core_08 Safe web and downloads | Art 21(2)(g); IR 8.1 | Art 13(6) | Art 32 | | | HIPAA 164.308(a)(5)(ii)(B); FTC 314.4(e) |
| core_09 Remote and mobile working | Art 21(2)(g); IR 8.1 | Art 13(6) | Art 5(1)(f), Art 32 | | | FTC 314.4(e) |
| core_10 Physical security | Art 21(2)(g); IR 8.1 | Art 13(6) | Art 5(1)(f), Art 32 | | | FTC 314.4(e) |
| core_11 Payment fraud and BEC | Art 21(2)(g); IR 8.1 | Art 13(6) | | | | NYDFS 500.14(a)(3); FTC 314.4(e) |
| core_12 Social media and oversharing | Art 21(2)(g) | Art 13(6) | Art 5(1)(f) | | | NYDFS 500.14(a)(3) |
| core_13 Removable media, cloud and shadow IT | Art 21(2)(g); IR 8.1 | Art 13(6) | Art 5(1)(f), Art 32, Art 32(4) | | | HIPAA 164.308(a)(5)(ii)(B); FTC 314.4(e) |
| core_14 Insider risk | Art 21(2)(g); IR 10.1 | Art 13(6); RTS Art 19 | Art 32(4) | | | CMMC AT.L2-3.2.3 (meets the awareness content); SOC 2 CC2.2 |
| core_15 Generative AI and deepfakes | Art 21(2)(g) | Art 13(6) | Art 5(1)(f), Art 32(4) | | Art 4 | NYDFS 500.14(a)(3) and the NYDFS industry letter on AI |
| core_16 Acceptable use and your responsibilities | Art 21(2)(g); IR 10.1 | RTS Art 19 | Art 24, Art 32(4); ICO training toolkit (induction) | | | CMMC AT.L2-3.2.1; FTC 314.4(e); SOC 2 CC2.2 |
| core_17 Capstone: the annual assessment | Art 21(2)(g); IR 8.1 | Art 13(6) | ICO training toolkit (refresher) | C4 (supports, through the results) | Art 4 (when the year's edition includes AI) | NYDFS 500.14(a)(3); CMMC AT.L3-3.2.1e, AT.L3-3.2.2e |
| role_01 Leaders and boards | Art 20(2); IR 8.1, IR 10.1 | Art 5(2)(g), Art 5(4), Art 13(6) | Art 24 | C1, C3, C4; D2 (supports) | | NYDFS 500.4(d)(1); HIPAA 164.308(a)(5) (management) |
| role_02 Finance and payments | IR 8.2 | Art 13(6) | | | | NYDFS 500.14(a)(3); SOC 2 CC1.4 |
| role_03 IT administrators and service desk | IR 8.2, IR 10.1 | Art 13(6) | Art 32 | | | NYDFS 500.10(a)(2); FTC 314.4(e)(3); CMMC AT.L2-3.2.2; SOC 2 CC1.4 |
| role_04 Developers | IR 8.2 | Art 13(6) | Art 32 | | Art 4 | CMMC AT.L2-3.2.2; SOC 2 CC1.4 |
| role_05 People managers and HR | IR 10.1, IR 10.2 | RTS Art 19 | Art 5(1)(f), Art 32(4) | | | CMMC AT.L2-3.2.3; SOC 2 CC1.4 |
| role_06 Customer-facing and contact centre | IR 8.2 | Art 13(6) | Art 5(1)(f), Art 32(4) | | | NYDFS 500.14(a)(3); SOC 2 CC1.4 |
| role_07 Procurement and supplier management | Art 21(2)(d); IR 5.1.4 | Art 30(2)(i) | Art 28 (context) | | | FTC 314.4(f) (supports); CMMC AT.L2-3.2.2 |
| sector_01 Healthcare | Art 21(2)(g) | | Art 5(1)(f), Art 32, Art 32(4); ICO training toolkit | | | HIPAA 164.308(a)(5) (in a US edition) |

### Gaps the matrix shows

- **Specialist data protection roles.** No module trains DPOs, subject access teams or records managers, which the ICO training toolkit expects. Customers need specialist courses for these roles; a future role module is possible.
- **Technical depth.** role_03 and role_04 are awareness-level. They contribute to NIST AT-3, PCI DSS 6.2.2 and 12.10.4, and CMMC AT.L2-3.2.2, but don't replace language-specific secure coding training or incident response team training. Link to the Hacktivity labs for depth.
- **The board's own plan.** Cyber Governance Code D2 asks boards to exercise their own incident plan at least annually. role_01 exercises Larkspur's; a facilitated version (HA-13) built around the customer's own plan would contribute more.
- **AI beyond everyday use.** core_15 and role_04 cover staff who use AI tools. Staff who build or buy AI systems need more for AI Act Art 4.
- **NIST AT-2(5)** (advanced persistent threats) isn't covered by any module. It is in no NIST baseline.

## 5. Course-level requirements

Requirements that no module can meet on its own, and the course feature or pathway that meets them. Feature ids are from `features/README.md`; the assessment model is in `features/assessment_and_evidence.md`.

| Requirement | Where it comes from | What meets it in the course | Customer action or gap |
|---|---|---|---|
| **Training records** | ISO 27001 cl. 7.2 (documented evidence of competence); NIST AT-4; NCSC CAF B6.b (incomplete records means Not achieved; each person's training tracked); ICO training toolkit (who received training, copies of the material); PCI DSS 12.6.3 (attendance records); HIPAA 164.316(b) (six-year retention); DSPT 3.2.1 and 3.1.2 (completion figures); UK GDPR Art 39(1)(b) (the DPO monitors training) | HA-05 completion records and audit pack (who, which version, when, result, time on task); BE-01 per-outcome evidence; HA-19 module versions; HA-09 dashboards; HA-06 certificates; HA-15 retention and export | Set retention to the longest period that applies to you (six years for HIPAA documentation) |
| **Induction timing** | PCI DSS 12.6.3 (on hire); CIS 14.1 (at hire); ICO training toolkit (before access to personal information and **within one month** of starting); DSPT 2.1.1; NIST AT-2 (on joining) and AT-3 (before access or duties); NIS2 IR 8.1 (covers new staff); CMMC AT.L3-3.2.1e (on hire) | The Induction Essentials pathway (core_00, core_01, core_03, core_04, core_05, core_16; about 80 minutes), assigned automatically on joining (HA-03), with provisioning (HA-02) and reminders (HA-04) | The default window (the first two weeks) sits inside the ICO's month. "Before access to personal information" depends on the customer: set core_05 due on day one, or hold access until it is done |
| **Annual cycle** | PCI DSS 12.6.3 (every 12 months); CIS 14.1 (at least annually); NYDFS 500.14(a)(3) (at least annual); DSPT 3.2.1 (95% within the last twelve months, categories 3 and 4); CMMC AT.L3-3.2.1e. Elsewhere "regular" or set by the organisation (ISO, NIST, NIS2, DORA, NCSC CAF, ICO) | The annual refresher pathway (core_17 plus one or two spotlight modules); annual recertification (HA-03); reminders and escalation (HA-04); completion percentages by department (HA-09) | Choose the recertification date; DSPT category 3 and 4 organisations watch the 95% figure |
| **Annual policy acknowledgement** | PCI DSS 12.6.3 (acknowledge at least every 12 months that the policy and procedures have been read and understood); ISO 27001 A.5.1 (policies communicated to and acknowledged by relevant personnel); ISO 27001 cl. 7.3; DORA RTS Art 19; CMMC AT.L2-3.2.1 | Policy library and acknowledgement, re-requested when a policy changes (HA-07); the acknowledgement inside the game's intranet (BE-09); core_16; the course completion rule that a module isn't complete until any attached policy is acknowledged | Upload your own policies and set an annual re-acknowledgement |
| **Multiple methods** | PCI DSS 12.6.3 (required); ICO training toolkit (a variety of methods); NCSC CAF B6.b (a range of teaching and communication techniques); DSPT B6.b and 3.1.2; ISO 27002 6.3; NIST AT-2 (awareness techniques) | The game and its text route (BE-03); reference cards and field guides (BE-09; printable); in-world posters, intranet pages and security team emails (EX-04); monthly micro-drills (BE-07, HA-21); explainer videos (EX-02, MG-21, HA-20); facilitated team sessions (BE-15, HA-13) | One course on its own may not satisfy an assessor. Use at least the game, the drills and the reference cards; the customer's own posters and briefings add to them |
| **Measuring effectiveness** | NCSC CAF B6.b (measuring only how many people were reached is Not achieved; evaluate routinely); NIS2 IR 8.1 (tested for effectiveness) and IR 8.2 (effectiveness assessed); Cyber Governance Code C4 (suitable metrics); ICO training toolkit (an assessment, perhaps with a pass mark; feedback); DSPT 3.1.3; NIST AT-2 (testing knowledge); NIST SP 800-50r1 (metrics) | `features/assessment_and_evidence.md`: per-outcome results (Secure, Developing, Not yet); the hook compared with the Apply beat as a before and after; the knowledge check and its pass mark (MG-20, default 80%); BE-01 and BE-02; dashboards (HA-09); later surveys and behaviour measures (HA-14) and reporting rates from simulated phishing and the report button (HA-12) | Report the measures to the board (Cyber Governance Code C4) |
| **Reviewing and updating content** | PCI DSS 12.6.2 (review at least every 12 months; update for new threats); CIS 14.1 (review annually or after significant change); NIST AT-2 and AT-3 (keep content current; build in lessons from incidents); NIS2 IR 8.1 and IR 8.2 (planned intervals); NYDFS 500.14(a)(3) and FTC 314.4(e) (reflect the risk assessment) | Versioning and release notes (HA-19); content banks and annual editions (BE-13); a new edition of core_17 each year; spotlight modules | Record your own annual review of your programme; our release notes help |
| **Role-based training** | NIST AT-3; CIS 14.9; PCI DSS 6.2.2, 9.5.1.3 and 12.10.4; NIS2 IR 8.2; DORA Art 13(6) (complexity fits the role); NYDFS 500.10(a)(2); FTC 314.4(e)(3); CMMC AT.L2-3.2.2; ICO training toolkit (specialised training); DSPT 3.3.1 and 3.4.1; NCSC CAF B6.b | The role paths (role_01 to role_07) and sector_01, assigned by role on appointment and annually (HA-03) | Role modules are awareness level; see the gaps in section 4 |
| **Customisation to the organisation's own risks and policies** | NYDFS 500.14(a)(3) and FTC 314.4(e) (reflect the organisation's risk assessment); PCI DSS 12.6.3.2 (its acceptable use policies) and 8.3.8 (its authentication policies); ISO 27001 cl. 7.3 (its own policy); NIS2 IR 8.1 (in line with its policies); ICO training toolkit (national and sector requirements); DSPT (training needs analysis) | Organisation profile, module selection and custom content (HA-11); the organisation's names, reporting routes and contacts in the game (BE-05); its policies (HA-07); its own questions (HA-08); spotlight modules chosen in the annual refresher | Choose modules from your risk assessment or training needs analysis, and fill in the organisation profile |
| **Management and board training** | NIS2 Art 20(2); DORA Art 5(4) and Art 13(6); NIS2 IR 8.1 (management body members included); Cyber Governance Code C3; NYDFS 500.4(d)(1); DSPT 3.4.1; NCSC CAF B6.b (executives); HIPAA 164.308(a)(5) (including management); NIST AT-2 (managers and senior executives) | role_01 (Crisis Room), plus the core modules for directors as members of staff; facilitated board sessions (HA-13); the NCSC's free Cyber Governance Training alongside | Check your country's NIS2 rules for content and frequency; record board attendance (HA-05) |
| **Contractors, temporary staff and suppliers** | ICO training toolkit (all staff, whatever their contract); ISO 27001 A.6.3 (relevant interested parties); NIS2 IR 8.1 (direct suppliers where appropriate) and IR 5.1.4; DORA Art 13(6), Art 30(2)(i) and RTS Art 19; NIST AT-2 (contractors) | Accounts and assignments for contractors and suppliers (HA-01, HA-03); provisioning and removal (HA-02); licences (HA-18) | Put them in scope, and in contracts |
| **Reminders through the year** | HIPAA 164.308(a)(5)(ii)(A) (security reminders); NCSC CAF B6 guidance (ongoing reminders and top-up training); NIST AT-2 (awareness techniques); NIS2 IR 8.1 (activities repeated over time) | Monthly micro-drills (BE-07, HA-21); in-world and printable materials (EX-04) | Choose the drill schedule |
| **Everyone can complete it** | DSPT 3.2.1 (95% of staff, directors, trustees and volunteers); NCSC CAF B6.b ("from the most senior to the most junior"); ICO training toolkit (all staff) | Text route (BE-03); accessibility baseline (BE-04); accessible platform (HA-23); facilitated sessions for staff who rarely use a computer (HA-13) | Offer facilitated sessions where staff don't have their own device |
| **Practical exercises and simulations** (optional under most frameworks) | NIST AT-2(1); PCI DSS 12.6.3.1 good practice (periodic tests of reporting); CMMC AT.L3-3.2.2e; the NYDFS industry letter on AI (simulated phishing, voice and video impersonation) | Every module's Apply beat is a practical exercise that simulates real events (BE-18); optional phishing simulation and report-button data (HA-12) | Decide whether to run simulated phishing, and how a click is treated: never a forced "you failed" page (see core_01's open questions and the design principles in `01_LEARNING_DESIGN.md`) |

## 6. Gotchas and recent changes

### Gotchas

1. **Only some frameworks say "annual".** PCI DSS (on hire and every 12 months, plus an annual policy acknowledgement), CIS 14.1, NYDFS 500.14(a)(3), DSPT 3.2.1 (categories 3 and 4) and CMMC Level 3 do. Elsewhere the organisation sets the frequency based on risk (ISO 27001, NIST, NIS2, DORA, HIPAA today, the FTC rule, the NCSC CAF, the CAF-aligned DSPT). The ICO expects induction within one month of starting and before access to personal information.
2. **Records are where audits fail.** ISO 27001 cl. 7.2 requires documented evidence of competence, NIST AT-4 requires individual records, and NCSC CAF B6.b marks incomplete records as Not achieved. The ICO wants to know who received which material; PCI DSS assessors look at attendance and acknowledgements; HIPAA documentation is kept for six years. The record must show the person, the module version, the dates, the results and any acknowledgements (HA-05).
3. **Boards are named directly.** NIS2 Art 20(2) and DORA Art 5(4) make training for members of management bodies mandatory. NIS2 IR 8.1, NYDFS 500.4(d)(1), HIPAA 164.308(a)(5) ("including management"), NIST AT-2, DSPT 3.4.1 and NCSC CAF B6.b expect it. The Cyber Governance Code C3 asks directors to train, voluntarily.
4. **An all-staff module is not role training.** NIST AT-3, CIS 14.9 (IG2 and IG3), PCI DSS 6.2.2, 9.5.1.3 and 12.10.4, NIS2 IR 8.2, NYDFS 500.10(a)(2), FTC 314.4(e)(3), CMMC AT.L2-3.2.2, the ICO's specialised training and DSPT 3.3.1 all need training for particular roles. DORA Art 13(6) asks for complexity that fits each person's role.
5. **PCI DSS requires more than one method of communication** (12.6.3). The ICO, the NCSC CAF, the DSPT and ISO 27002 expect a range of methods too. A single e-learning course is a weak answer on its own; see section 5.
6. **Completion is not effectiveness.** NCSC CAF B6.b treats "measured only by the number of people reached" and training as a "silver bullet" as Not achieved. NIS2 IR 8.1 and 8.2 expect effectiveness to be tested, the ICO suggests an assessment with a pass mark, DSPT 3.1.3 asks for evaluation, and Cyber Governance Code C4 asks boards for metrics.
7. **Off-the-shelf content needs the customer's details.** NYDFS 500.14(a)(3) and FTC 314.4(e) tie training to the customer's own risk assessment; PCI DSS 12.6.3.2 needs its acceptable use rules; ISO 27001 cl. 7.3 needs its own policy. That is what HA-11, BE-05 and HA-07 are for.
8. **Simulated phishing is good practice, rarely required.** It appears as guidance in PCI DSS, NIST AT-2(1) (in no baseline), the NYDFS letter on AI and the NCSC CAF guidance. Only CMMC Level 3 requires practical exercises.
9. **PCI DSS 12.6.3.1 and 5.4.1 are separate.** Training doesn't satisfy the technical anti-phishing control, and the control doesn't satisfy the training.
10. **GDPR has no "train everyone" article.** Training is the usual evidence for UK GDPR Art 5(1)(f), 5(2), 24 and 32(4). Art 39(1)(b) applies only where a DPO is designated, and Art 47(2)(n) only to binding corporate rules.
11. **NIS2 is national.** Art 20(2) is addressed to Member States, so who counts as management, how often they train and the penalties differ by country. The detailed IR 8.1 and 8.2 rules apply only to the digital entity types listed in section 3.5.
12. **In HIPAA, "addressable" doesn't mean optional.** To verify: our understanding of 45 CFR 164.306(d)(3) is that the organisation implements the specification if it is reasonable and appropriate, or documents why not and uses an equivalent alternative where reasonable.
13. **SOC 2 points of focus aren't requirements.** Auditors test the controls the organisation describes, so the customer's description should name the course.
14. **Cyber Essentials is not a training scheme.** Don't list it as a requirement the course meets.
15. **The DSPT 95% target depends on the category.** It applies to categories 3 and 4 (including GP practices, pharmacies, dentists and social care providers), not to the large NHS bodies on the CAF-aligned toolkit.

### Recent changes

Newest first. Add a row whenever this file changes because a requirement changed.

| Date | Change | What it means for the course | Checked |
|---|---|---|---|
| 2 October 2026 | DSPT 2026-27 (version 9) released, aligned to CAF version 4.0; deadline 30 June 2027 | The DSPT references in this file are version 9 | Primary |
| 30 September 2026 | The Information Commission replaced the Information Commissioner (Data (Use and Access) Act 2025, sections 118 and 119, commenced by SI 2026/1015). It keeps the "ICO" name: its website now calls it the "Information Commission's Office". The UK GDPR now refers to "the Commission" (for example in Art 33) | Say "the ICO" in learner content, and "the Information Commission" where the legal body matters. Use "Information Commissioner" only when talking about the past | Primary |
| 27 July 2026 | AI Act Art 4 replaced by Regulation (EU) 2026/1744: from "ensure, to their best extent, a sufficient level of AI literacy" to "take measures to support the development of AI literacy", with no guaranteed level for any individual | core_15 uses the current wording; customers still need to show what measures they took | Primary |
| 19 June 2026 | Data (Use and Access) Act 2025, section 103: controllers must make complaints easy, acknowledge them within 30 days and respond without undue delay | core_05 covers recognising a data protection complaint | Primary |
| 27 April 2026 | Cyber Essentials Requirements for IT Infrastructure v3.3 in force | Still no training requirement | Primary |
| 20 January 2026 | The European Commission proposed targeted amendments to NIS2, still being negotiated; reports say the core risk-management duties are unchanged | Watch; re-check Art 20 and 21 when it is adopted | Secondary |
| From 12 November 2025 | The Cyber Security and Resilience (Network and Information Systems) Bill is going through Parliament; Lords report stage is scheduled for 26 October 2026. Not law; no training duty in the current text | Re-check after Royal Assent and when a code of practice is published | Primary |
| November 2025 | EU "Digital Omnibus" proposals to amend the GDPR; not adopted by October 2026 | No change yet to the articles cited here | Secondary |
| 27 August 2025 | NIST SP 800-53 release 5.2.0 | The current release; the AT controls are as listed in section 3.2 | Primary |
| 4 August 2025 | NCSC CAF version 4.0 | B6.a and B6.b as written in version 4.0 | Primary |
| 8 April 2025 | Cyber Governance Code of Practice published | role_01 debriefs against it | Primary |
| 31 March 2025 | PCI DSS 12.6.2, 12.6.3.1, 12.6.3.2 and 12.10.4.1 moved from best practice to mandatory | All four are now assessed | Primary |
| 6 January 2025 | HIPAA Security Rule proposed rule, including annual training; still not final on 14 October 2026 | Don't describe the proposed annual rule as law | Primary |
| September 2024 | The DSPT became CAF-aligned for large NHS bodies (2024-25), having dropped their 95% rule in 2023-24; independent operators of essential services and genomics organisations followed in 2025-26 | The 95% target now applies to categories 3 and 4 only | Primary |
| 2024 | CIS Controls v8.1 (current) added business email compromise to 14.2 | core_11 cites CIS 14.2 | Primary |
| Undated | The ICO's Accountability Framework pages moved into its data protection audit framework (the old links no longer work); its guidance is under review following the Data (Use and Access) Act | Link to the audit framework pages | Primary |

## 7. The NCSC's Top Tips for Staff

The NCSC offers a free e-learning package, "Top Tips for Staff". It takes under 30 minutes and covers four areas: using strong passwords, securing your devices, defending yourself against phishing, and reporting incidents. Staff can take it online with no login (it ends with a short quiz and links to further reading), or an organisation can load it into its own learning platform as a SCORM 1.2 or SCORM 2004 package in English, or as a Welsh SCORM package. The English version meets WCAG 2.1 AA. It is aimed mainly at small organisations, charities and the voluntary sector, but any organisation can use it. (Checked: Primary. Source: the [NCSC's Top Tips for Staff page](https://www.ncsc.gov.uk/information/top-tips-for-staff), published 19 May 2025.)

How this course relates to it:

- **A free baseline many organisations already use.** Our advice must agree with it (three random words, report phishing, keep devices updated), and our concepts files cite the NCSC where we cover the same ground.
- **Where it overlaps:** its four areas sit in core_03 (passwords), core_07 and core_09 (devices and updates), core_01 (phishing) and core_04 (reporting).
- **Where this course goes further:**
  - **Practice:** realistic work with the threats arriving inside it, rather than advice alone.
  - **Evidence:** per-outcome results, module versions and policy acknowledgements an auditor can sample (HA-05), mapped to the requirements in this file.
  - **Coverage:** 18 core modules, seven role paths and a healthcare pack, including topics Top Tips leaves out, such as data protection, payment fraud, physical security, insider risk and AI.
  - **The customer's own details** in the game (BE-05), and a new annual edition.
- **Don't run it down.** An organisation that already uses Top Tips can keep it as one of its "multiple methods" (section 5), with this course providing the practice and the evidence.

## 8. Sources

All checked on 14 October 2026. Paywalled: the ISO standards. Free but behind a licence or an account: the PCI DSS document and the AICPA Trust Services Criteria.

**International standards and frameworks**

- ISO: [ISO/IEC 27001:2022](https://www.iso.org/standard/27001); [ISO/IEC 27002:2022](https://www.iso.org/standard/75652.html); [ISMS.online on ISO 27002 control 6.3](https://www.isms.online/iso-27002/control-6-3-information-security-awareness-education-and-training) (secondary)
- NIST: [SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final); [SP 800-50 Rev. 1](https://csrc.nist.gov/pubs/sp/800/50/r1/final); [OSCAL catalogue and baselines](https://github.com/usnistgov/oscal-content); [SP 800-171 Rev. 2](https://doi.org/10.6028/NIST.SP.800-171r2)
- CIS: [CIS Controls Navigator v8.1](https://www.cisecurity.org/controls/cis-controls-navigator); [Control 14](https://www.cisecurity.org/controls/security-awareness-and-skills-training)
- PCI SSC: [document library (PCI DSS v4.0.1)](https://www.pcisecuritystandards.org/document_library/)
- AICPA: [2017 Trust Services Criteria (with revised points of focus, 2022)](https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022)

**EU law**

- [NIS2 Directive (EU) 2022/2555](https://eur-lex.europa.eu/eli/dir/2022/2555/oj); [Implementing Regulation (EU) 2024/2690](https://eur-lex.europa.eu/eli/reg_impl/2024/2690/oj)
- [DORA Regulation (EU) 2022/2554](https://eur-lex.europa.eu/eli/reg/2022/2554/oj); [Delegated Regulation (EU) 2024/1774](https://eur-lex.europa.eu/eli/reg_del/2024/1774/oj)
- [EU GDPR Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [AI Act Regulation (EU) 2024/1689](https://eur-lex.europa.eu/eli/reg/2024/1689/oj); [Regulation (EU) 2026/1744 (Digital Omnibus on AI)](https://eur-lex.europa.eu/eli/reg/2026/1744/oj)

**UK law, regulators and government**

- UK GDPR on legislation.gov.uk: [Art 5](https://www.legislation.gov.uk/eur/2016/679/article/5), [Art 24](https://www.legislation.gov.uk/eur/2016/679/article/24), [Art 28](https://www.legislation.gov.uk/eur/2016/679/article/28), [Art 32](https://www.legislation.gov.uk/eur/2016/679/article/32), [Art 33](https://www.legislation.gov.uk/eur/2016/679/article/33), [Art 39](https://www.legislation.gov.uk/eur/2016/679/article/39), [Art 47](https://www.legislation.gov.uk/eur/2016/679/article/47)
- [Data (Use and Access) Act 2025, section 103](https://www.legislation.gov.uk/ukpga/2025/18/section/103); [SI 2026/1015](https://www.legislation.gov.uk/uksi/2026/1015/made)
- [Cyber Security and Resilience (Network and Information Systems) Bill](https://bills.parliament.uk/bills/4035)
- ICO: [home page (the "Information Commission's Office")](https://ico.org.uk/); [data protection audit framework](https://ico.org.uk/for-organisations/advice-and-services/audits/data-protection-audit-framework/); [Training and awareness toolkit](https://ico.org.uk/for-organisations/advice-and-services/audits/data-protection-audit-framework/toolkits/accountability/training-and-awareness/)
- NCSC: [CAF principle B6](https://www.ncsc.gov.uk/collection/cyber-assessment-framework/caf-objective-b/principle-b6-staff-awareness-and-training); [CAF changelog](https://www.ncsc.gov.uk/collection/cyber-assessment-framework/changelog); [Cyber Governance Training](https://www.ncsc.gov.uk/cyber-governance-for-boards/training); [Top Tips for Staff](https://www.ncsc.gov.uk/information/top-tips-for-staff); [Cyber Essentials resources](https://www.ncsc.gov.uk/cyberessentials/resources)
- GOV.UK: [Cyber Governance Code of Practice](https://www.gov.uk/government/publications/cyber-governance-code-of-practice/cyber-governance-code-of-practice); [mapping of the Code to ISO/IEC 27001:2022](https://www.gov.uk/government/publications/cyber-governance-mapping/mapping-cyber-governance-code-to-isoiec-27001-2022)
- NHS DSPT: [2026-27 version 9](https://www.dsptoolkit.nhs.uk/News/169); [the training change](https://www.dsptoolkit.nhs.uk/News/Training); [the CAF-aligned toolkit](https://www.dsptoolkit.nhs.uk/News/DSPT-Changes); [CAF-aligned guidance PDFs](https://www.dsptoolkit.nhs.uk/News/PDFcafguides)

**US rules**

- HIPAA: [45 CFR 164.308](https://www.ecfr.gov/current/title-45/section-164.308); [45 CFR 164.316](https://www.ecfr.gov/current/title-45/section-164.316); [proposed rule of 6 January 2025](https://www.federalregister.gov/d/2024-30983)
- NYDFS: [23 NYCRR Part 500](https://www.dfs.ny.gov/cybersecurity/23-NYCRR-Part-500); [implementation timeline](https://www.dfs.ny.gov/system/files/documents/2023/11/cybersecurity_implementation_timeline_covered_entities.pdf); [industry letter on AI risks](https://www.dfs.ny.gov/industry-guidance/industry-letters/il20241016-cyber-risks-ai-and-strategies-combat-related-risks)
- FTC: [16 CFR 314.4](https://www.ecfr.gov/current/title-16/section-314.4); [16 CFR 314.6](https://www.ecfr.gov/current/title-16/section-314.6)
- CMMC: [32 CFR 170.14](https://www.ecfr.gov/current/title-32/section-170.14)
