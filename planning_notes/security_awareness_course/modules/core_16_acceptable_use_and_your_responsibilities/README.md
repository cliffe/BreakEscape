# core_16: Acceptable use and your responsibilities

**Working game title:** Small Print
**Pitch:** A short run through everyday "can I?" moments, answered from your organisation's own rules, so the policy you're asked to follow finally makes sense.

| | |
|---|---|
| Audience | All staff (built role: general) |
| Prerequisites | core_00 recommended (introduces the reporting route) |
| Full episode | about 10 minutes (short consequence flip) |
| Defend-only variant | about 6 to 7 minutes (defend-only shell) |
| Pre and post check | about 9 minutes each (general role forms) |
| Priority | MVP (proposed episode E17) |
| Build size | S. Reuses inbox triage, the consequence flip and the organisation answer key; no write-a-phish beat |

## Build status

**New episode, short consequence-flip or defend-only shell.** Nothing in the built product covers acceptable use (`../../04_BUILT_SO_FAR.md` §3; `research/built_episodes_vs_plan.md` §2 marks core_16 "None"). Acceptable use has no single attacker, so it uses the **consequence flip** (R3): the learner makes an everyday choice in a safe sandbox and the flip shows where it led. It can also ship as a **defend-only shell** (brief, defend, debrief) for a lighter touch.

**Covers:** C16-LO1 to LO5, all new. The items read from the organisation's own answer key, so the same episode teaches a council's rules to the council and a retailer's to the retailer.

**Policy acknowledgement is a later platform option, not part of this episode.** The build records measurement, not policy signatures, and the only platform change proposed for the product is the customer reporting-route setting (`../../04_BUILT_SO_FAR.md` §1.7, still awaiting the user). So **C16-LO6** (acknowledging a policy after reading it) is kept as a plan item and marked **later platform option**: the episode can point to where the organisation records the acknowledgement, but the recording itself is not built here.

The episode is proposed as a short episode, a defend-only shell and new general check items. It is not yet built (the awareness product resumed on 2026-10-27).

## Why this module

Most organisations ask staff to sign an acceptable use policy on their first day, and most staff sign it without reading it. That protects nobody: the rules don't change behaviour, and a signature on an unread document is weak evidence when an auditor asks staff what the policy says. ISO 27001 cl. 7.3 expects everyone to be aware of the policy and what follows if they don't follow it, and PCI DSS 12.6.3 expects staff to acknowledge, at least every 12 months, that they have read and understood it.

Most rule-breaking is well-meaning. People reach for a convenient app, a personal account or a shortcut because the right way is unclear, slow or unknown to them. The NCSC's cyber security culture principles ask for rules that are easy to understand and developed with input from across the business; this module does the learner's half of that: what the rules are, why they exist, and who to ask.

- **NHS Lanarkshire, 2023.** The ICO reprimanded the health board after 26 staff shared patient data more than 500 times in a WhatsApp group that had not been approved for it. The ICO found the board had no policies, guidance or processes in place when WhatsApp was made available.
- **RAC, 2023.** A customer solutions specialist was fined £5,000 after pleading guilty to two offences under section 170 of the Data Protection Act 2018, for taking accident victims' details and passing them on.

Rules work both ways. The same law that stops staff misusing data limits what employers may do: in 2024 the ICO ordered Serco Leisure to stop using face and fingerprint scans to monitor staff attendance, because it wasn't necessary or proportionate. Knowing where the lines are protects everyone.

## Target behaviours

1. **Asks first** (the service desk, the security team, the DPO or their manager) when unsure whether something is allowed, rather than guessing or working round the rules.
2. **Uses work systems within the organisation's rules:** approved software, devices and storage; work accounts for work; never sharing logins, codes or badges; looking only at the data their job needs.

## Learning outcomes

After this module, staff can:

- **C16-LO1** Say what the acceptable use policy covers, and find it and the other policies they're asked to follow on the intranet.
- **C16-LO2** Decide whether everyday actions are allowed, not allowed or need asking first under the organisation's policy, and give the reason.
- **C16-LO3** Choose the right person to ask for different kinds of question.
- **C16-LO4** Describe what the organisation monitors on work systems, why, and the limits that protect staff.
- **C16-LO5** State their own security responsibilities, and the difference between an honest mistake reported quickly and deliberate misuse.
- **C16-LO6** Acknowledge the organisation's policies after reading the summary, asking about anything unclear first. (**Later platform option:** the acknowledgement recording is not built in this plan.)

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`):

- **PCI DSS 12.6.3.2** (training covers acceptable use of end-user technologies): the episode's content covers it when the organisation's answer key is set; the formal **PCI DSS 12.6.3** acknowledgement waits for the later platform option.
- **ISO 27001 A.5.1** (policies communicated to and acknowledged by relevant personnel) and **PCI DSS 12.6.1**.
- **ISO 27001 cl. 7.3** (aware of the policy, their contribution and the consequences of not following it) and **ISO 27001 A.6.3**.
- **UK GDPR Art 24** and **Art 32(4)** (people with access to personal data use it only on instructions); the **ICO training toolkit** (induction).
- **NCSC CAF B6.b**; **NIST AT-2**; **CIS 14.1**.
- **NIS2 Art 21(2)(g)** and **NIS2 IR 10.1**; **DORA RTS Art 19**, for EU customers.
- **DSPT 2.1.1** and **DSPT 3.2.1** (categories 3 and 4).
- **CMMC AT.L2-3.2.1**, **FTC 314.4(e)** and **SOC 2 CC2.2**, for US customers.
- ISO/IEC 27001:2022 Annex A 5.10 (rules for acceptable use) and NIST SP 800-53 PL-4 (rules of behaviour) also fit this module; requested for the mapping.

## Module flow

One short training-room mission, with the pre-check and post-check as the bracketing missions.

| Stage | What happens | Minutes |
|---|---|---|
| Pre-check (separate mission) | 10-item general check form, before the episodes | about 9 |
| Brief and scope note | "Authorised exercise at Marrowdale Facilities (fictional). Everyday 'can I?' moments, answered from the rules." | 1 |
| The choices (sandbox) | A handful of everyday moments: install a free app from a client's meeting link, forward a file to personal email, look up a record with no work reason. The learner makes each choice; unscored | 2 to 3 |
| Flip: the consequence | A short montage shows where each choice led (a fake meeting app, a lost file, a recorded lookup) | 1 |
| Defend | The "can I?" set: situations sorted Allowed / Not allowed / Ask first against the organisation's answer key, with the reason on screen; plus the two triage items that map onto Report (the app-install link, the data-lookup request); scored | 3 |
| Debrief | Per-item reasoning, feedback on the genuine items, the team-protected tally, the habit, the "On Monday" card, the reporting route and the no-blame line; where to read and acknowledge the policy | 1 |
| Post-check (separate mission) | The parallel general check form, after the episodes; shows the change | about 9 |

## Setting and host

- **Company: Marrowdale Facilities** (`marrowdale.example`), a facilities-management firm (cleaning, maintenance and grounds for schools, offices and care homes). **Proposed, to add to `BRAND_SET.md`**: it needs look-alike domains, a wordmark accent and a named, varied cast set, and a web search for a real business of the same name before release, like every brand-set company. An all-staff employer with a mixed, non-technical workforce suits an acceptable-use episode.
- **Host:** a proposed Marrowdale host (an office coordinator or the service-desk lead), who welcomes the learner and gives the reason behind each answer. Named when the company is added to `BRAND_SET.md`.
- Alternatively, to avoid a new company, the episode can be hosted at any existing brand-set company; Marrowdale is the recommended demonstration of the "proposed new company" path (brief, R2).

## Reuse from existing Break Escape content

- **inbox triage** for the two items that map onto a verdict (the app-install meeting link, a request to look up a record), Report always visible;
- the **consequence flip** (the montage) in place of the attack-then-flip beat;
- the **organisation answer key** (the "can I?" items read the organisation's own answer and reason);
- **awareness-measure** records.

## New features needed

A three-way "sort" surface for the Allowed / Not allowed / Ask first items (a small extension of the triage set), and the answer-key binding. Both are overlays; no new room.



## Organisation-specific content

- The acceptable use policy, versioned, and any other policies the organisation wants staff to read here.
- A five-point summary of the policy.
- The answer key: the organisation confirms or edits the default answer and reason for each "can I?" item; a small set of **locked** items it cannot change (see `game_design.md`, Pitfalls).
- Personal use rules; the monitoring statement; the route for requesting software; the rules for personal devices; social media guidance; what happens if the rules are broken.
- Who to ask about what: service desk, security team, DPO, HR, and a named owner for each policy.
- Where and how the organisation records a policy acknowledgement (the later platform option).
- The reporting route (fills `slot:customer_report_route`).

## Open questions

1. **Keep the game-show framing?** The original "lunchtime game show" is kept as a facilitated-session and team-event option; the core episode is the short consequence flip, which fits the built shape and the 10-minute target.
2. **A new company or an existing one?** Marrowdale Facilities is proposed to demonstrate the new-company path; the episode works at any brand-set company if a new one is not wanted.
3. **Locked answers.** Six: never share passwords or MFA codes; never use someone else's login; never lend a badge; never look at data you don't need; never switch off security software; always report a suspected incident. No organisation can make any of these "Allowed".
4. **Policy acknowledgement.** Kept as a later platform option; the episode points to where it is recorded but does not record it, in line with the build's platform position.
