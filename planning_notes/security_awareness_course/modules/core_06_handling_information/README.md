# core_06: Handling information

**Working game title:** Need to Know
**Pitch:** Help get a big tender bid out by Friday noon, where every draft, link, email, printout and bin is a choice about who gets to see the information that wins the contract.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended; core_05 recommended (what personal data is, and how to report a breach) |
| Full module | 15 minutes |
| Micro-drill | 4 minutes ("Label It") |
| Text route | 10 minutes |
| Priority | Phase 2 |
| Build size | M, driven by the classification sorter (MG-10), sharing settings (MG-11) and MG-12's inspect mode; the attacker view reuses the existing `shredded-document` minigame |

## Why this module

Information mostly leaks through everyday handling, not hacking: a link that anyone can open, a draft in the recycling, an attachment with more in it than the sender knew, a printout left in a tray. CIS Control 14.5 names the usual causes: sending data to the wrong person, losing a portable device, and publishing to unintended audiences. Not all of it is personal data: a leaked price can lose a contract, and a leaked floor plan or alarm code can help a burglar.

- **Ministry of Defence, early 2022 (made public in July 2025).** A defence official sent out a spreadsheet by mistake. The official meant to send details of about 150 people; the file held over 33,000 entries about Afghans who had applied to come to the UK. It went unnoticed until August 2023.
- **Police Service of Northern Ireland, 2023.** A spreadsheet released in answer to a freedom of information request still held a worksheet its sender didn't know was there, exposing all 9,483 officers and staff (core_05 has the detail).
- **Shredded is not destroyed.** Shredded US embassy documents seized in Tehran in 1979 were painstakingly pieced back together and published; in 2011 a team of eight won a US defence research contest by rebuilding five documents from more than 10,000 shreds.

## Target behaviours

1. **Checks** before information leaves: every recipient, every sharing setting, and what's hidden inside the file.
2. **Shares** on a need-to-know basis: named people, the lowest permission that works and an end date, and never through personal accounts.
3. **Disposes** securely: confidential paper in the locked confidential waste, old devices back to IT, printing collected at once.

## Learning outcomes

After this module, staff can:

- **C06-LO1** Label information with the organisation's classes and handle it to match when storing, sending, sharing, printing and disposing of it.
- **C06-LO2** Send information safely: check every recipient, use the right method for the label and the size of the group, send passwords another way, and keep work information out of personal accounts.
- **C06-LO3** Share files and links only with the named people who need them, with the right permission and an end date, and fix over-shared links they find.
- **C06-LO4** Check a document for hidden content (hidden worksheets, comments, tracked changes, covered-up text) and remove it properly before it leaves.
- **C06-LO5** Print and dispose of information securely, and deal properly with information found or received by mistake.

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md`):

- **CIS** 14.4 (identifying, storing, transferring, archiving and destroying sensitive data) and 14.5 (causes of unintentional data exposure).
- **ISO 27001** A.6.3.
- **NIST** AT-2.
- **NIS2** Art 21(2)(g) and IR 8.1; **DORA** Art 13(6).
- **UK GDPR** Art 5(1)(f), Art 32 and Art 32(4); **ICO training toolkit** (data sharing, information security and records management topics).
- **NCSC CAF** B6.b; **DSPT** 3.2.1.
- **FTC** 314.4(e), for US customers.

It also supports the organisation's own handling controls, which are not in the mapping yet. **Proposed additions** for `02_COMPLIANCE_MAPPING.md` (wording to verify against the standards): ISO 27001 A.5.12 (classification of information), A.5.13 (labelling of information), A.5.14 (information transfer), A.7.10 (storage media), A.7.14 (secure disposal or re-use of equipment) and A.8.10 (information deletion); PCI DSS 9.4.6 (destroying hard-copy materials that hold card data).

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | Martin asks the player to clear last year's draft pricing off their desk; which bin they use is the baseline | Game | 1 |
| Learn | That evening, the player joins Jo Fairweather's authorised bin audit and rebuilds a shredded page; next morning Ama explains the four labels, need to know and the handling grid | Attacker view (EX-06, BE-11), then NPC explainer (EX-01, BE-08) | 3 |
| Practise | "Label It": ten documents to label and route, and two over-shared links to fix | Minigames (MG-10, MG-11) | 2.5 |
| Apply | Bid week: share with a partner, a competitor's price list arrives by mistake, pricing sign-off with a tricky autocomplete, Martin's personal email, final checks for hidden content, printing, and the clear-out | Game (MG-11, MG-01, MG-12, BE-18) | 5.5 |
| Debrief | Jo's haul: what she could have collected this week, against what she actually got | Debrief screen (BE-02), Jo and Ama | 1 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | The handling card on The Lark, with the organisation's own labels and rules | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_office` (Operations), `room_meeting` (the bid room, with `whiteboard1`), `room_archive_1x2gu` (the print and archive room), `small_room_storage_1x1gu` redressed as the bin store by the loading bay, and `room_IT` for returning the old laptop.
- **Minigames:** `shredded-document` for the attacker view, configured as in `scenarios/test-shredded-document/scenario.json.erb` (`content` split by `stripCount`, `allowRotation` for upside-down strips, `stateWrites.onComplete` to set a global); `container` for the recycling sack and the drawer with the old laptop; `examine` for the locked confidential waste console and an HR cover sheet; `notes` for the bid checklist and the handling grid poster.
- **Conversations:** `person-chat` for Martin, Ama, Jo, Precious, Mei Lin and Owain; `phone-chat` for Martin's messages and the team chat.
- **Props:** `shredder1`, `photocopier1`, `bin1` to `bin11`, `filing_cabinet_locked1`, `pigeonholes1`, `laptop1` to `laptop7`, `office-misc-box1`, `restricted_sign1`.
- **Systems:** object `triggerOnInteract` with `confirm_action` and `set_global` for each bin (exists today; `README_scenario_design.md`, "Object Interaction Actions"), so the hook needs no new feature; the game clock and `timers[]` for the Friday deadline; objectives and tasks for the bid checklist; event mappings for Martin's interruptions.
- **Patterns:** sis01's credible character with a wrong idea, argued down by the player (`scenarios/sis01_healthcare/ink/npc_helen.ink:104-169`), for Martin's "open it" moment.

## New features needed

- **MG-10 Classification sorter:** "Label It", with the organisation's labels from BE-05 and a "how would you send it?" follow-up on some items.
- **MG-11 Sharing settings:** a share dialog (who, permission, end date), the access list, and a "Shared by you" view for spotting over-shared links.
- **MG-01 Inbox:** compose with recipient autocomplete, an "External recipient" chip, a prompt when a Confidential attachment goes outside, a "Send securely" option, and attachment previews.
- **MG-12 Redaction,** inspect mode: find hidden worksheets, comments, tracked changes and covered-up text, and remove them properly. It builds on the redact mode core_05 needs.
- **EX-06 Attacker-view interludes** and **BE-11 Role switch:** the bin audit with Jo.
- **BE-16 Time skips:** the evening audit and the consequence scenes.
- **BE-18 Work task and interruptions:** the bid checklist and the arrivals.
- **BE-01**, **BE-02**, **BE-03**, **BE-09** (the handling card), **BE-13** (document and slot banks), **BE-19** (Ama opening the sorter), **MG-20** (the check), **BE-07** (the "Label It" micro-drill), **EX-01** (Ama).
- **BE-05 Organisation profile:** the labels, their colours and the handling rules come from the customer's profile.
- **BE-10 Spot-the-risk mode** (optional): a print room sweep in the facilitated version.
- **proposed:** shredded-document keyboard controls, move-up, move-down and flip buttons with screen reader labels for each strip, because the minigame is drag-and-drop only today and the attacker view must meet the BE-04 baseline.

## Organisation-specific content

- The classification labels: names, colours, definitions and examples.
- The handling rules for each label (the grid on the reference card).
- The approved file-sharing service, its default link setting and the rules for external sharing.
- The secure send method and when it is required; the bulk email or mail merge tool for group mailings.
- Printing: whether secure print release is in place, and how to release a job.
- Confidential waste: where the locked consoles are and what goes in them; whether office shredders are allowed and for which labels.
- How to return old devices for wiping.
- Where the retention schedule lives.
- Who to tell about information received by mistake (the security team; the DPO if it is personal data).
- The policy on personal email and personal cloud accounts (taught in core_13).

## Open questions

1. **Office shredders.** Should the default allow strip-cut shredders for any paper? *Recommendation: make it an organisation slot. Larkspur's default: the strip-cut shredder is for Internal paper only; Confidential and Restricted go in the locked console.*
2. **The Bcc rule.** *Recommendation: follow the ICO. Bcc is "not enough on its own"; for large or sensitive mailings, use the bulk email tool or mail merge, and keep Bcc for small, routine, non-sensitive groups.*
3. **The competitor's price list.** It is the module's twist, and it teaches what to do with information you shouldn't have. *Recommendation: keep it on the critical path.*
4. **The redaction split with core_05.** *Recommendation: core_06 owns technique (covered-up text, hidden content, how to remove it); core_05 owns judgement (which personal data to remove). Both use MG-12.*
5. **Where personal data sits in the labels.** *Recommendation: Larkspur default: most personal data is Confidential; special category data and large sets of personal data are Restricted. Customers set their own.*
