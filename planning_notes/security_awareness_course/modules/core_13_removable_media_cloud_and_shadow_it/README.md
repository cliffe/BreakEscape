# core_13: Removable media, cloud storage and shadow IT

**Working game title:** Workaround
**Pitch:** Get a client pack to the council by Monday when the file share has slowed to a crawl and the Sales Director has a shortcut for everything, then see where each shortcut would have led six months on.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended. core_06 covers sharing settings in depth; core_05 covers the law on personal data |
| Full module | 12 minutes |
| Micro-drill | 3 minutes ("Swap Shop") |
| Text route | 9 minutes |
| Priority | Phase 3 |
| Build size | M, driven by the car park (new, shared with core_10) and the "Where are they now?" time-skip montage; the rest is conversations, MG-01 and MG-11 |

## Why this module

Most shadow IT (apps, accounts and devices used for work without the organisation knowing) comes from people trying to get their job done. The NCSC describes it as rarely malicious: staff adopt unofficial tools when the approved ones fall short, for example not enough storage, no way to share with outsiders, or a slow request process. But work kept where the organisation doesn't know about it has no contract, no backup, no security the organisation can insist on, and no way to take access back when someone leaves.

- **NHS Lanarkshire, 2020 to 2022.** A team replaced office conversations with a group on a consumer messaging app during the pandemic. At least 533 messages included patients' names, and someone outside the team was added by mistake. Staff had assumed that "encrypted" meant approved, and found it hard to get clear advice on which apps were allowed. The ICO reprimanded the health board in July 2023.
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
- **CIS 14.4** (data handling: storing and transferring data) and **CIS 14.5** (causes of unintentional data exposure, including lost portable devices and publishing to unintended audiences).
- **PCI DSS 12.6.3.2** (acceptable use of end-user technologies), with core_16, where the organisation's acceptable use policy covers storage, removable media and tools.
- **NCSC CAF B6.b**; **DSPT 3.2.1** (categories 3 and 4).
- **NIS2 Art 21(2)(g)** and **NIS2 IR 8.1**; **DORA Art 13(6)**.
- **UK GDPR Art 5(1)(f)**, **Art 32** and **Art 32(4)**; **UK GDPR Art 28** as context (a free service holding personal data for the organisation has no processor contract).
- **HIPAA 164.308(a)(5)(ii)(B)** (the removable media part) and **FTC 314.4(e)**, for US customers.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | Back from lunch through the car park: a USB stick labelled "SALARY REVIEW 2026: CONFIDENTIAL" by the smoking shelter. Plug it in, take it home, hand it in, leave it: the baseline | Game | 1 |
| Learn | Owain at the service desk: why workarounds happen, the four "no"s of unapproved tools and personal accounts, found media, and the quick route to a yes | NPC explainer with visual aids (EX-01, BE-08) | 2 |
| Practise | "Swap Shop": eight shortcuts, each swapped for its approved version at Owain's counter | Drill (MG-20 items) | 1.5 |
| Apply | Friday 15:30. The client pack is due at the council by Monday 09:00 and the file share says "about 2 hours remaining". Martin offers personal email and a free transfer site; a USB stick arrives in the post "from the council"; Kev's rota lives in a free app on a former temp's personal account | Game (BE-18, MG-01, MG-11) | 4.5 |
| Debrief | "Where are they now?": six months on, where each shortcut led; Jo reveals the car park stick; per-outcome results | BE-16, debrief screen (BE-02), NPCs | 1.5 |
| Check | Five scenario questions | Quiz (MG-20) | 1 |
| Reference | Reference card on The Lark: the approved swaps and how to ask for something new | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_IT` (Owain's counter, with the "Swap Shop" board), `room_office` (the player's desk and Martin's corner), `room_reception` (Maureen, if the player hands the stick in there). The car park and smoking shelter are new (`03_WORLD_AND_CAST.md`), shared with core_10.
- **Props:** `usb_bowl1` as Owain's lost-and-found bowl of handed-in USB sticks; `notice_board1` for the Swap Shop board; laptop, phone and bin sprites.
- **The USB stick as an item:** m03's "Hidden USB Drive" pattern, a takeable `text_file` item (`scenarios/m03_ghost_in_the_machine/scenario.json.erb:1725`), with `examine` for its label.
- **A story already in the repo:** sis02's printers were compromised through firmware on a USB stick sent by a fake vendor (`scenarios/sis02_energy/scenario.json.erb:1544`). The posted stick in Apply is the same idea at awareness level.
- **Conversations:** `person-chat` for Owain, Martin, Jo and Maureen; `phone-chat` for Kev, Martin's messages and the council contact.
- **From core_07:** if the warehouse floor is built, Kev's rota scene can move there. `research/existing_content_reuse.md` found no cloud or shadow IT content anywhere in the repo, so the rest is new.

## New features needed

- **MG-01 Inbox:** composing with a recipient check, where "Me (personal)" appears in autocomplete.
- **MG-11 Sharing settings:** the approved secure transfer (named recipient, expiry, download notice), and the free app's sharing panel ("Anyone with the link can edit"; an owner who has left).
- **MG-20 Knowledge check:** the Swap Shop items and the final check.
- **MG-27 Work desktop:** the player's laptop, where the pack folder and its sync bar live and Martin's and Kev's messages arrive as notifications.
- **MG-02 Web browser:** BoxBounce's upload page, if the player goes there (a single data-built page).
- **BE-16 Time skips:** the "Where are they now?" montage.
- **BE-18 Work task and interruptions:** the Monday pack and its scheduled arrivals.
- **proposed:** Hand an item to an NPC, an ink tag that takes an item from the player's inventory (synced to the server) and records who received it, for handing the USB stick to Owain or Maureen. Ink can give items today (`#give_item`) but not take them back. core_10 needs the same thing for a found badge.
- **BE-01**, **BE-02**, **BE-05**, **BE-08**, **BE-09** and **BE-13**, as in core_01. **BE-19** opens Owain's check question and the Swap Shop from his conversation, and the 15:35 compose window from Martin's message (`#trigger_minigame:<minigame>|<configKey>`). **BE-07** for the micro-drill.
- **EX-01** (Owain), **EX-04** (the Swap Shop board and a notice on The Lark), **EX-05** (the montage).
- **MG-04 Voice calls** (P2) for calling the council on the directory number; a `phone-chat` conversation works until then.

## Organisation-specific content

- The approved storage and sharing tools: team drives, the document library, the secure file transfer tool, remote access, the company chat tool and its phone app.
- The removable media policy (none at all, or encrypted company sticks issued by IT).
- Where to hand in found media.
- How to request a new tool, and how long it takes.
- The DPO's contact, for personal data that went to a personal account.
- The personal device (BYOD) policy and the approved apps for personal phones.

## Open questions

1. **Should the car park stick be part of an authorised test by Jo's firm, revealed at the end?** *Recommendation: yes. The stick holds only a harmless file that records it was opened, and the reveal shows the test's results without naming anyone. Customers who run their own USB tests may want the reveal switched off (an organisation setting).*
2. **If the player takes no shortcuts, what does "Where are they now?" show?** *Recommendation: the Larkspur where Martin took them instead, so every player sees every consequence, with their own choices marked.*
3. **Keep the seed's free transcription tool?** *Recommendation: no. It is an AI tool and belongs to core_15. The posted USB stick replaces it, which also gives the module its before and after on removable media.*
4. **Is sending work to personal email a critical behaviour?** *Recommendation: yes. It is the most common workaround, and with personal data in it, it can be a personal data breach.*
