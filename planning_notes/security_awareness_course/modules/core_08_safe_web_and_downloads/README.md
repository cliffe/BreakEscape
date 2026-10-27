# core_08: Safe web browsing and downloads

**Working game title:** The Download
**Pitch:** Get a supplier's PDF price list into a spreadsheet and finish the monthly report by 12:00, on a web where the top search result, the "verify you are human" box and the handy free tool are not what they seem.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended. core_01's way of reading a web address is reused and briefly retaught |
| Full module | 15 minutes |
| Micro-drill | 4 minutes ("Real or Rigged?") |
| Text route | 11 minutes |
| Priority | Phase 2 |
| Build size | L, driven by the web browser minigame (MG-02), which core_07, core_13 and core_15 can reuse |

## Why this module

The web is now one of the main ways malware and fraud reach people at work, with no email involved, and the tricks change every year:

- **Fake downloads from search adverts.** Criminals buy search adverts that impersonate real brands. The adverts sit at the top of the results and lead to copies of official sites, where the "software" is malware (FBI, December 2022).
- **Fake "verify you are human" pages**, known in the industry as ClickFix. The page copies a command to the visitor's clipboard and tells them to press a few keys and paste it, which installs malware, most often a password-stealing infostealer. Microsoft saw these campaigns targeting thousands of devices every day (August 2025); ESET found they rose more than fivefold in the first half of 2025, to become the second most common attack it blocked after phishing. 2026 variants ask people to paste into a terminal, including on Macs.
- **Scam pop-ups** take over the screen, say the computer is infected and give a number to call.

Unlike an email, a web page has no sender to check, and the padlock in the address bar says nothing about honesty. The habits that work are simple: start from a place you trust, never let a web page make you do things to your computer, and report. All figures and sources are in `concepts.md`.

## Target behaviours

1. **Starts from a trusted place:** gets software, extensions and online tools from the company portal or the service desk, and reaches work sites through bookmarks or typed addresses, not search adverts.
2. **Never lets a web page drive their computer:** doesn't paste or run commands, install "updates", call numbers from pop-ups, or allow notifications or extensions because a page asked.
3. **Reports suspicious sites, and their own slips, straight away**: a pasted command, a download, a call to a pop-up's number.

## Learning outcomes

After this module, staff can:

- **C08-LO1** Get software, extensions and online tools only from the organisation's approved source, and say why search results and adverts are not safe sources.
- **C08-LO2** Read a web address to check a site is the one they meant, spot sponsored results and lookalike domains, and say what the padlock does and doesn't mean.
- **C08-LO3** Recognise web pages that try to make them act on their own computer (paste or run a command, install an update, call a number, allow notifications) and close them.
- **C08-LO4** Respond to a browser warning by going back, not clicking through, and asking IT when a site they need for work is flagged.
- **C08-LO5** Judge extension and site permission requests, and ask IT before adding an extension.
- **C08-LO6** Report a suspicious website, or their own slip, straight away through the organisation's route.

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md`):

- **ISO 27001 A.6.3.**
- **NIST AT-2** and **AT-2(4)** (suspicious web content and anomalous system behaviour).
- **CIS 14.2** (recognising social engineering: the fake check and the scam pop-up) and **CIS 14.6**.
- **PCI DSS 12.6.3.1** (phishing and related attacks, and social engineering), with core_01 and core_02. Where the organisation's acceptable use policy covers installing software and extensions, also **PCI DSS 12.6.3.2**, with core_16.
- **NCSC CAF B6.b**; **DSPT 3.2.1** (categories 3 and 4).
- **NIS2 Art 21(2)(g)** and **NIS2 IR 8.1**; **DORA Art 13(6)**.
- **UK GDPR Art 32.**
- **HIPAA 164.308(a)(5)(ii)(B)** and **FTC 314.4(e)**, for US customers.

## Build status

**Company and host:** Quayholt Insurance (`BRAND_SET.md`), the company of the built E5. Host Niamh Doherty, the E5 host, with a Quayholt IT staff member for the software and web strand. There is no recurring course mentor.

**Part built** (`research/built_episodes_vs_plan.md` §2). Reading a web address, look-alike domains and the padlock myth (C08-LO2) are covered by the built E5; the rest is delivered by the new E10, which extends E5.

- **Built:** **E5** `awareness_e5_signin_pages` (Quayholt, general): the mock browser, the address bar, look-alike domains and the "a padlock does not mean it is safe" point, plus the general check forms. This is the module's C08-LO2 core.
- **New (extends E5):** **E10** fake downloads and "verify you are human" pages (with core_07): the software portal habit, pasting-is-the-attack, browser warnings and extensions (C08-LO1, LO3, LO4, LO5, LO6), as a full episode with a defend-only variant and new check items.
- **Builds on built systems:** the E5 landing-page and page-triage model, the inbox-triage defender, the awareness-measure records, the concept cards and the debrief view.
- **Checks:** the **general** role, with mirror pairs (`assessment.md`).

## Module flow

Recast in the built episode shape. Pre and post checks bracket the episode; only the defend half and the checks are scored. The clipboard / "verify you are human" reveal is the signature of the attack half.

| Stage | What happens | Format | Scored |
|---|---|---|---|
| Pre-check | The general role check: one 10-item spot-the-item form, no pass mark | Check mission (built) | Measured, not scored |
| Brief and scope | "Authorised exercise at Quayholt Insurance (fictional)." Host Niamh Doherty welcomes the learner | Episode runner | No |
| Attack half | See how little a convincing copy takes: a sponsored look-alike, a fake check that copies a hidden command, extending the E5 page-build; the reveal shows what the page would have done | OSINT and page-build systems (MG-02 / E5 builder) | No |
| Flip | The fake page is shown as it lands on a colleague; the clipboard reveal shows the hidden command described, never a working one | Flip / clipboard view | No |
| Defend half | Triage browser screens (Carry on / Close and report / Go the trusted way), including the fake check on a trusted site | Page and inbox triage (awareness profile) | Scored |
| Debrief | Per-item reasoning cards, Kai's "what each report blocked" board, the shared habit to keep, the "On Monday" card, how to report a website, the no-blame line | Debrief view | Debrief |
| Post-check | The other general form; shows the change from the pre-check | Check mission | Measured |

## Reuse from existing Break Escape content

- **Rooms:** `room_office` (the player's desk in Operations) and `room_IT` (Owain's service desk). No new rooms.
- **A first version of the fake sites:** the `lab-workstation` object type (`public/break_escape/js/utils/lab-workstation.js`) opens any HTTPS page in a near-full-screen iframe with game input paused. Simple hosted pages can stand in for the vendor, supplier and scam sites until MG-02 exists; its popup title, always "Lab Sheet" today, needs relabelling.
- **Documents:** `text-file` to show the clipboard's contents in a first version; `notes` for the staff intranet's bookmarks list; `examine` for the sticky note with the portal's address on Owain's monitor.
- **Conversations:** `person-chat` for Owain, Ama and Leo; `phone-chat` for Lena's task, the team chat and Kai's thanks.
- **From core_01:** the method for reading a web address and the MG-03 drill, unchanged, so the course teaches one method.
- **From core_07:** the "Quayholt Protect" security alert style for the hook's blocked download, and the device instruction (shared with core_04) if the player runs the fake check's command.

## New features needed

- **MG-02 Web browser** (the core of the module), as specified in `features/minigames.md`: an address bar with the domain emphasised; a search results page with "Sponsored" results; data-built fake sites (a software vendor, two suppliers, a news site, an extension store, the portal); a download bar showing file names and types; a browser warning page with a "details" route; an extension permission prompt using real-style wording ("Read and change all your data on all websites"); a notification permission prompt; a full-screen scam page whose alarm is silent by default (captioned), with a safe way out; the "verify you are human" page with its instructions shown as text, a view of what it put on the clipboard, and Follow the instructions, Close the page and Report buttons; a toolbar Report button that uses the organisation's route. It never needs real key presses and never touches the learner's real clipboard.
- **MG-27 Work desktop:** the player's laptop, from which the browser, chat and the staff intranet open, and where Lena's and Owain's messages arrive as notifications.
- **MG-03 Link and domain drill**, inline in the Practise screens.
- **MG-20 Knowledge check.**
- **proposed:** Software portal page, a page on the staff intranet (BE-09 content) listing approved tools with an Install button and a "Request something else" form, showing the organisation's request turnaround (BE-05).
- **BE-01**, **BE-02**, **BE-05**, **BE-08**, **BE-09**, **BE-13**, **BE-18** and **BE-19**, as in core_01. **BE-07** for the micro-drill; **BE-16** for Kai's short "what your report did" scene.
- **EX-01** (Owain and Ama), **EX-04** (a "Paste nothing" poster by the kettle and a notice on the staff intranet), **EX-05** (Kai's behind-the-scenes board).
- **MG-04 Voice calls** (P2) if the player rings the scam pop-up's number; a `phone-chat` conversation works until then.

## Organisation-specific content

- The name and location of the software portal, how to request software or an extension, and how long requests take.
- The approved browser, and whether staff may add extensions at all.
- How to report a suspicious website at work.
- The approved tool for converting documents (or whichever tool fits the task).
- The bookmarks list on the intranet for key sites (suppliers, the finance system, HR).
- What to do after pasting, downloading or calling (the security team, out of hours the service desk, and core_04's device instruction).

## Open questions

1. **How close should the browser look to a real one?** *Recommendation: generic and brand-free but modern, with an address bar, site information icon and warning pages close enough to real browsers that the habits transfer.*
2. **How far can the player go with the fake check?** *Recommendation: all the way, inside the game, through MG-02's Follow the instructions button, which shows in words what would have happened; then Kai calls. Never ask learners to press real keys, and never write to their real clipboard.*
3. **Does the hook's fake download run?** *Recommendation: no. Quayholt Protect blocks it, so the hook is safe whatever the player does; Owain says how close it was.*
4. **Leo's slip: does the player advise him, or does he model reporting?** *Recommendation: he asks for advice (as in core_01), and the best answer has him on the phone within the minute. Poorer advice still ends with a report, later, so the debrief can show what the minutes cost.*
5. **What does the player do if the scam page won't close?** *Recommendation: call the service desk on the number they already have, as `concepts.md` says. MG-02's draft says "restart if it won't close"; the module recommends the call instead, to stay consistent with core_07's "don't try to fix it yourself". The orchestrator should settle one wording for both.*
