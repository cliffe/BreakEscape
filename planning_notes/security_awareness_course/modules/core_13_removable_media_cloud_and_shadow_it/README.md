# core_13: Removable media, cloud storage and shadow IT

**Working game title:** Workaround
**Pitch:** Get a pack to a client by Monday when the file share has crawled to a halt and the depot has a shortcut for everything, then see where each shortcut would have led six months on.

| | |
|---|---|
| Audience | All staff (built role: general) |
| Prerequisites | core_00 recommended. core_06 covers sharing settings in depth; core_05 covers the law on personal data |
| Full episode | about 15 minutes |
| Defend-only variant | about 8 minutes |
| Pre and post check | about 9 minutes each (general role forms) |
| Priority | Phase 3 (proposed episode E15) |
| Build size | M. Reuses the mail client, inbox triage and the "six months later" consequence flip; new work is the sharing-settings surface and the swap drill |

## Build status

**New episode, consequence-flip shape.** Nothing in the built product covers removable media, cloud storage or shadow IT (`../../04_BUILT_SO_FAR.md` §3; `research/built_episodes_vs_plan.md` §2 marks core_13 "None"). So every learning outcome here is new.

It is designed in the built shape, using the **consequence flip** (R3): the topic has no single attacker, so instead of a write-a-phish beat the learner makes the everyday shortcut in a safe sandbox, and the flip shows where it led. The episode then reuses built systems: the mail client with a recipient check, the inbox-triage defender (for the posted-USB and giveaway-stick cards), and the debrief view. The one built attacker element it leans on is the posted USB stick, the removable-media version of E6's "scan this code" lure (E6 already uses the `qr` and `sms` card kinds).

**Covers:** C13-LO1 to LO5, all new.

The episode is proposed as a full episode, a defend-only variant and new general check items. It is not yet built (the awareness product resumed on 2026-10-27).

## Why this module

Most shadow IT (apps, accounts and devices used for work without the organisation knowing) comes from people trying to get their job done. The NCSC describes it as rarely malicious: staff adopt unofficial tools when the approved ones fall short, for example not enough storage, no way to share with outsiders, or a slow request process. But work kept where the organisation doesn't know about it has no contract, no backup, no security the organisation can insist on, and no way to take access back when someone leaves.

- **NHS Lanarkshire, 2020 to 2022.** A team replaced office conversations with a group on a consumer messaging app during the pandemic. At least 533 messages included patients' names, and someone outside the team was added by mistake. Staff had assumed that "encrypted" meant approved, and found it hard to get clear advice on which apps were allowed. The Information Commissioner's Office reprimanded the health board in July 2023.
- **Found USB sticks.** When researchers dropped 297 USB sticks around a university campus, files were opened on at least 45% of them, the first within six minutes, mostly by people trying to return them (Tischer and others, 2016). Malware still travels this way: in 2022 Microsoft found one USB-spread worm on nearly 3,000 devices in almost 1,000 organisations in a single month.

The fix is not more rules but a quicker yes: ask IT, who usually have an approved way ready, and tell them when the official way is too slow. All sources are in `concepts.md`.

## Target behaviours

1. **Hands in found or unexpected media without plugging it in**, and uses only approved storage.
2. **Keeps work in work places:** never sends work files to personal email, personal cloud storage, personal messaging groups or free online services.
3. **Asks IT when the official way doesn't work**, tells them about the friction, and owns up to workarounds already in use, including their own.

## Learning outcomes

After this module, staff can:

- **C13-LO1** Hand found, posted or giveaway USB sticks and other media to IT without plugging them in anywhere, and use only approved removable media, if any.
- **C13-LO2** Keep work information in approved places, and say why personal email, personal cloud storage and personal messaging accounts are not approved places.
- **C13-LO3** Explain in plain words what goes wrong with unapproved apps, free online tools and file transfer sites: no contract, no control, no backup, no way to take access back.
- **C13-LO4** Use the approved route when the official tools don't seem to meet a need: ask IT or request a tool, and report the friction.
- **C13-LO5** Report a workaround already in use, including their own, and help move the data somewhere safe.

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md`):

- **ISO 27001 A.6.3.**
- **NIST AT-2.**
- **CIS 14.4** (storing and transferring data) and **CIS 14.5** (causes of unintentional data exposure, including lost portable devices and publishing to unintended audiences).
- **PCI DSS 12.6.3.2** (acceptable use of end-user technologies), with core_16.
- **NCSC CAF B6.b**; **DSPT 3.2.1** (categories 3 and 4).
- **NIS2 Art 21(2)(g)** and **NIS2 IR 8.1**; **DORA Art 13(6)**.
- **UK GDPR Art 5(1)(f)**, **Art 32** and **Art 32(4)**; **UK GDPR Art 28** as context (a free service holding personal data for the organisation has no processor contract).
- **HIPAA 164.308(a)(5)(ii)(B)** (the removable media part) and **FTC 314.4(e)**, for US customers.

## Module flow

One training-room mission, with the pre-check and post-check as the bracketing missions.

| Stage | What happens | Minutes |
|---|---|---|
| Pre-check (separate mission) | 10-item general check form, before the episodes | about 9 |
| Brief and scope note | "Authorised exercise at Tarrowby Logistics (fictional). A pack is due at a client by Monday, and the share has slowed to a crawl." | 1 |
| The shortcuts (sandbox) | Four interruptions arrive while the learner works: personal email, a free transfer site, a posted USB stick, and a rota in a free app on a former temp's account. The learner can take each shortcut or the approved route; unscored | 4 to 5 |
| Flip: "Where are they now?" | A "six months later" montage shows where each shortcut led, with the learner's own choices marked | 1 to 2 |
| Defend | "Swap Shop": match each shortcut to its approved swap; plus found-media cards (a posted stick, a giveaway stick) triaged with Report or Verify; scored under the `awareness` profile | 3 to 4 |
| Debrief | Per-item reasoning, feedback on the genuine items, the team-protected tally, the habit, the "On Monday" card, the reporting route and the no-blame line; the USB-drop test revealed | 1 to 2 |
| Post-check (separate mission) | The parallel general check form, after the episodes; shows the change | about 9 |

## Setting and host

- **Company:** Tarrowby Logistics (`tarrowby.example`, brand set), a haulier and warehousing firm; it already hosts E2 and E6, so its depot cast and "ask facilities / ask IT" culture are set.
- **Host:** Nilesh Solanki, Tarrowby IT service desk analyst, who welcomes the learner, supplies the quick yes, and reveals the authorised USB-drop test in the debrief.
- **Cast:** Colin Mather (warehouse manager, from E2) offers the shortcuts, likeable and in a hurry; Shauna Lofthouse (depot, from E6) rings about the rota. The client contact and the departed agency temp are phone-only or off-screen (proposed, consistent with `BRAND_SET.md`).

## Reuse from existing Break Escape content

- the **mail client** with a recipient check (the "Me (personal)" trap in autocomplete);
- a **share** from the approved file-sharing service (named recipient, an end date, a notice when opened), as in core_06, and a free app's sharing panel ("anyone with the link can edit"; an owner who has left);
- **inbox triage** for the posted-stick and giveaway-stick cards, with Report always visible and the Verify verdict;
- the **consequence flip** ("six months later" montage) in place of the attack-then-flip beat;
- **awareness-measure** records.

## New features needed

A sharing-settings surface and the swap drill (match a shortcut to its approved swap). Both are overlays; the episode needs no new room.



## Organisation-specific content

- The approved storage and sharing tools: team drives, the file-sharing service (shared with core_06), remote access, the company chat tool and its phone app.
- The removable media policy (none at all, or encrypted company sticks issued by IT).
- Where to hand in found media.
- How to request a new tool, and how long it takes.
- The reporting route for personal data that went to a personal account (fills `slot:customer_report_route`; brings in the DPO).
- The personal device (BYOD) policy and the approved apps for personal phones.

## Open questions

1. **Should the car-park stick be part of an authorised test, revealed at the end?** Yes. The stick holds only a harmless file that records it was opened, and the reveal (by Nilesh, IT's own test) shows the result without naming anyone. Customers who run their own USB tests can switch the reveal off.
2. **If the learner takes no shortcuts, what does the montage show?** The version where the shortcuts were taken instead, so every learner sees every consequence, with their own choices marked.
3. **AI tools.** A free transcription or note-taking tool belongs to core_15, not here; the posted USB stick is this episode's removable-media counterpart.
4. **Is sending work to personal email a critical behaviour?** Yes, and it is a paired check item (see `assessment.md`).
