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

There is no Report button inside a web page, and the padlock in the address bar says nothing about honesty. The habits that work are simple: start from a place you trust, never let a web page make you do things to your computer, and report. All figures and sources are in `concepts.md`.

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

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | The player needs a PDF converter and searches for one. The top result is a sponsored lookalike. Whatever they do (download from the advert, use the vendor's site, upload to a free converter, find the company portal) is the baseline | Game (MG-02) | 1.5 |
| Learn | Owain: where software comes from, reading the address, and four web tricks (fake check, fake update, fake alarm, fake permission). Ama asks the check question | NPC explainer with visual aids (EX-01, BE-08) | 3 |
| Practise | "Real or Rigged?": ten browser screens, getting harder, with the domain drill inline | Minigame (MG-02 practice mode, MG-03) | 2.5 |
| Apply | Finish the supplier report by 12:00: check two suppliers' delivery charges, download a catalogue, look at a news story. A sponsored lookalike, a fake "verify you are human" box, a permission grab and a scam pop-up arrive inside the task; Leo asks what to do after pasting something | Game (MG-02, BE-18) | 5 |
| Debrief | Each trap, its giveaway, what the player did and the trusted route; Kai's board of what each report blocked | Debrief screen (BE-02) and NPCs | 1.5 |
| Check | Six scenario questions | Quiz (MG-20) | 1.5 |
| Reference | Reference card on The Lark, with the organisation's software portal and how to report a website | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_office` (the player's desk in Operations) and `room_IT` (Owain's service desk). No new rooms.
- **A first version of the fake sites:** the `lab-workstation` object type (`public/break_escape/js/utils/lab-workstation.js`) opens any HTTPS page in a near-full-screen iframe with game input paused. Simple hosted pages can stand in for the vendor, supplier and scam sites until MG-02 exists; its popup title, always "Lab Sheet" today, needs relabelling.
- **Documents:** `text-file` to show the clipboard's contents in a first version; `notes` for The Lark's bookmarks list; `examine` for the sticky note with the portal's address on Owain's monitor.
- **Conversations:** `person-chat` for Owain, Ama and Leo; `phone-chat` for Lena's task, the team chat and Kai's thanks.
- **From core_01:** the method for reading a web address and the MG-03 drill, unchanged, so the course teaches one method.
- **From core_07:** the "Larkspur Protect" security alert style for the hook's blocked download, and the isolation instruction if the player runs the fake check's command.

## New features needed

- **MG-02 Web browser** (the core of the module). Needs: an address bar showing the full address; a search results page with "Sponsored" results; simple fake sites built from templates (a software vendor, two suppliers, a news site, an extension store); a download shelf showing file names and types; a browser warning page with a "details" route; an extension permission prompt using real-style wording ("Read and change all your data on all websites"); a notification permission prompt; a full-screen scam page that resists closing and has a safe way out; a "verify you are human" overlay that writes to an in-game clipboard, on-screen keys and an in-game Run box that shows what was pasted. It must never touch the learner's real clipboard or ask them to press real system shortcuts.
- **MG-03 Link and domain drill**, inline in the Practise screens.
- **MG-20 Knowledge check.**
- **proposed:** Software portal page, a page on The Lark (BE-09 content) listing approved tools with an Install button and a "Request something else" form, showing the organisation's request turnaround (BE-05).
- **BE-01**, **BE-02**, **BE-05**, **BE-08**, **BE-09**, **BE-13**, **BE-18** and **BE-19**, as in core_01. **BE-07** for the micro-drill; **BE-16** for Kai's short "what your report did" scene.
- **EX-01** (Owain and Ama), **EX-04** (a "Paste nothing" poster by the kettle and a notice on The Lark), **EX-05** (Kai's behind-the-scenes board).
- **MG-04 Voice calls** (P2) if the player rings the scam pop-up's number; a `phone-chat` conversation works until then.

## Organisation-specific content

- The name and location of the software portal, how to request software or an extension, and how long requests take.
- The approved browser, and whether staff may add extensions at all.
- How to report a suspicious website at work.
- The approved tool for converting documents (or whichever tool fits the task).
- The bookmarks list on the intranet for key sites (suppliers, the finance system, HR).
- What to do after pasting, downloading or calling (the service desk, and core_07's isolation instruction).

## Open questions

1. **How close should the browser look to a real one?** *Recommendation: generic and brand-free but modern, with an address bar, site information icon and warning pages close enough to real browsers that the habits transfer.*
2. **How far can the player go with the fake check?** *Recommendation: all the way, inside the game: on-screen keys, an in-game Run box and an in-game clipboard. If they "run" it, Kai calls. Never ask learners to press real keys, and never write to their real clipboard.*
3. **Does the hook's fake download run?** *Recommendation: no. Larkspur Protect blocks it, so the hook is safe whatever the player does; Owain says how close it was.*
4. **Leo's slip: does the player advise him, or does he model reporting?** *Recommendation: he asks for advice (as in core_01), and the best answer has him on the phone within the minute. Poorer advice still ends with a report, later, so the debrief can show what the minutes cost.*
