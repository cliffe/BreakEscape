# Features

Everything the awareness course needs that Break Escape and Hacktivity don't have yet, plus the existing features it builds on. Modules refer to features by id, so these ids are stable: add new ones at the end of a list, never renumber.

| Document | Covers |
|---|---|
| `break_escape_engine.md` | Engine and in-game UI features (BE) |
| `minigames.md` | New minigames (MG) and how existing minigames are reused |
| `explainers_video_and_npc.md` | How information is explained: NPC mentors, video, in-world documents, demonstrations, attacker views (EX) |
| `hacktivity.md` | Platform features for running mandatory training for organisations (HA) |
| `assessment_and_evidence.md` | The assessment model and the evidence trail, across engine and platform |
| `accessibility_and_inclusion.md` | The accessible route and the accessibility and inclusion rules, across engine, platform and content |

Priority: **MVP** is needed for the first sellable course (the Induction Essentials path); **P2** for the full core library and the first role modules; **P3** later. Size: **S** days, **M** a few weeks, **L** a month or more, for one developer, as a rough guide only.

## Break Escape engine (BE)

| Id | Feature | One line | Priority | Size |
|---|---|---|---|---|
| BE-01 | Assessed decisions | Tag ink choices, minigame results and events with a learning outcome and a rating; keep a per-game record and send it to the server | MVP | M |
| BE-02 | Debrief screen | An end-of-module screen built from the BE-01 record: what happened, what you did, what good looks like, per-outcome results | MVP | M |
| BE-03 | Text route player | Plays a module's ink, decisions and checks as an accessible text story, with the same records as the game | MVP | L |
| BE-04 | Accessibility baseline | Keyboard play, screen reader support for menus and dialogue, transcripts, text size, reduced motion, no flashing, timers that can be turned off | MVP | L |
| BE-05 | Organisation profile in game | Customer values (name, logo, reporting routes, contacts, labels) in on-screen text, documents and the intranet; voiced lines stay generic | MVP | M |
| BE-06 | Localisation | Translatable UI and ink, per-language voices, locale-specific reference content | P3 | L |
| BE-07 | Micro-drill launcher | Start one minigame on its own with randomised content as a 3 to 5 minute drill, with a result record | P2 | M |
| BE-08 | Visual aids in conversations | Show an image, an annotated document or a diagram inside a conversation, step through highlights, and share a screen in a video call | MVP | M |
| BE-09 | Intranet terminal | The company intranet in game (a reskinned lab workstation): reference cards, policies, contacts, and a policy acknowledgement that the platform records | MVP | M |
| BE-10 | Spot-the-risk mode | Mark objects in a room or scene as risks; the player finds and fixes them, with an optional timer and a found and missed summary | P2 | M |
| BE-11 | Role switch | Change the player's character, kit and objectives mid-module for an attacker-view interlude, then switch back | P2 | M |
| BE-12 | Short sessions and resume | Checkpoints between beats, quick resume, and a module length that fits in a 15 to 20 minute slot | MVP | M |
| BE-13 | Content banks and randomisation | Draw emails, callers, documents and questions from banks per play, and swap in annual editions | P2 | M |
| BE-14 | xAPI statements | Emit standard learning records (started, decided, completed, scored) for an LRS or an LMS | P2 | M |
| BE-15 | Facilitated group mode | Pause points with discussion prompts, a presenter view, and group decisions | P2 | M |
| BE-16 | Time skips and consequence scenes | "Three weeks later" scenes that show where a decision led, then return | P2 | S |
| BE-17 | Cross-module memory | Characters remember what the player did in earlier modules | P3 | M |
| BE-18 | Work task and interruptions | A primary work task with visible progress, plus scheduled interruptions (an email lands, the phone rings, a visitor arrives) that carry the security tests | MVP | M |
| BE-19 | Open minigames from conversations and events | An ink tag and an action that open any minigame (the inbox, a check question, a form) without the player clicking an object; today `#trigger_minigame` is a stub | MVP | S |
| BE-20 | Authorable tutorial, title screen and end screen | Scenario-defined tutorial steps, the course's own title screen (with the customer's logo) and a non-spy end screen; today these are fixed | MVP | M |
| BE-21 | Workplace music and sound | A music and ambience set for the workplace tone; today's playlists are spy-styled | P2 | S |

## Minigames (MG)

| Id | Minigame | One line | Priority | Size |
|---|---|---|---|---|
| MG-01 | Inbox | A mail client: read, hover links, inspect senders, open attachments, reply, forward, compose with recipient checks, and Report | MVP | L |
| MG-02 | Web browser | An address bar and simple fake sites: logins, downloads, search ads, warnings, extension prompts, fake CAPTCHA instructions | P2 | L |
| MG-03 | Link and domain drill | Read a web address and pick out the real domain, at speed | P2 | S |
| MG-04 | Voice calls | Incoming and outgoing calls with a ringing phone, a directory for calling back, hold and transfer | P2 | M |
| MG-05 | Messaging apps | SMS and chat-app skins on the existing phone chat, with links and unknown numbers | P2 | S |
| MG-06 | QR code scanner | Scan a code in the world, see where it really goes, choose to open it or not | P2 | S |
| MG-07 | MFA prompts and authenticator | Push approvals with number matching, one-time codes, a prompt storm at night | MVP | M |
| MG-08 | Password manager and passphrase builder | Build a passphrase, see how long it would take to guess, store and fill it with a manager | MVP | M |
| MG-09 | Incident report form | Report what, when, where and who; feedback on completeness and speed | MVP | S |
| MG-10 | Classification sorter | Label documents with the organisation's classes, with reasons | P2 | S |
| MG-11 | Sharing settings | Choose who can see a file or link, and spot over-shared ones | P2 | S |
| MG-12 | Redaction | Remove personal data before sending, including the fake redaction that only hides the text | MVP | M |
| MG-13 | Social media profile and OSINT board | Connect public posts into an attacker's picture of a person, then fix the privacy settings | P3 | M |
| MG-14 | Wi-Fi and VPN picker | Choose a network, spot the evil twin, connect the VPN | P3 | S |
| MG-15 | Payment verification desk | Compare a change request with the supplier record, call back on the known number, approve or refuse with a second approver | P2 | M |
| MG-16 | AI assistant chat | Decide what is safe to paste into an AI tool, and check its answers | P2 | M |
| MG-17 | Caller verification desk | A queue of callers and a verification checklist, for service desks and contact centres | P3 | M |
| MG-18 | Access review | A table of people and permissions; remove what is no longer needed | P3 | S |
| MG-19 | Code review | Spot the security problem in a short code change | P3 | M |
| MG-20 | Knowledge check | Scenario questions (single and multiple choice, hotspot, ordering) from a bank, with feedback and a recorded result | MVP | M |
| MG-21 | Video player | Plays a video on an in-world screen with captions, transcript, chapters and a watched record | P2 | M |
| MG-22 | Supplier assessment | Review a supplier's security answers and evidence, and spot the gaps | P3 | S |
| MG-23 | Device settings | A phone or laptop settings panel: screen lock, updates, encryption, backups, app permissions | P2 | S |
| MG-24 | Crisis decision board | Extends the existing command board for timed board-level decisions with injects | P2 | M |
| MG-25 | Document inspector | Compare a document (an invoice, a letter, an ID, a work order) with a trusted reference and mark what doesn't match | P2 | M |

## Explainers (EX)

| Id | Feature | One line | Priority | Size |
|---|---|---|---|---|
| EX-01 | Mentor explainer pattern | A recurring colleague explains in short chunks with visual aids, asks a check question, and lets experienced players skip | MVP | S |
| EX-02 | Engine-recorded video | Short explainer videos recorded from the engine with the course's own characters and voices | P2 | M |
| EX-03 | Produced video | Presenter-led or animated videos made outside the engine, for openings and leaders' content | P3 | M |
| EX-04 | In-world documents | Posters, intranet pages, security team emails and desk notices that carry the same messages | MVP | S |
| EX-05 | Demonstration scenes | A short cutscene of an attack working on a colleague, then unpicked by the mentor | P2 | S |
| EX-06 | Attacker-view interludes | The learner briefly plays an authorised tester to see how little an attacker needs | P2 | M |
| EX-07 | Shared glossary and tooltips | One definition per term across the course, shown as tooltips and on reference cards | P2 | S |
| EX-08 | Printable poster and briefing pack | Posters, desk cards and a short team briefing per module, branded with the organisation profile, for customers' own offices; helps meet PCI DSS 12.6.3's "multiple methods" | P2 | S |

## Hacktivity (HA)

| Id | Feature | One line | Priority | Size |
|---|---|---|---|---|
| HA-01 | Organisations, departments and roles | Customer organisations with departments, and org admin, manager, learner and auditor roles | MVP | L |
| HA-02 | Single sign-on and provisioning | SAML and OIDC sign-in, SCIM or scheduled CSV provisioning, leavers removed automatically | P2 | L |
| HA-03 | Learning paths and assignments | Role-based paths, due dates, automatic assignment on joining and on role change, annual recertification, exemptions | MVP | L |
| HA-04 | Reminders and escalation | Email (and later chat) reminders before and after due dates, escalation to managers | P2 | M |
| HA-05 | Completion records and audit evidence | An append-only record of who completed which version of what, when, with what result, exportable as an audit pack | MVP | M |
| HA-06 | Certificates and badges | Completion certificates with a verification link, and optional open badges | MVP | S |
| HA-07 | Policy library and acknowledgement | Upload versioned policies, require acknowledgement, re-request on change, keep the record | MVP | M |
| HA-08 | Question banks | Manage knowledge check banks, add organisation questions, retire weak items | P2 | M |
| HA-09 | Organisation dashboards | Completion, overdue and per-outcome results by department, with privacy thresholds | MVP | M |
| HA-10 | LMS interoperability | SCORM 1.2 and 2004 packages, cmi5, and LTI 1.3 so customers can assign modules from their own LMS | P2 | L |
| HA-11 | Organisation profile and branding | The values the game and reference cards use (BE-05), plus logo, colours, module selection and custom content | MVP | M |
| HA-12 | Phishing simulation and report-button data | Optional simulated phishing linked to the course, and reporting rates from the customer's mail system | P3 | L |
| HA-13 | Facilitated sessions | Run a module as a team session with a facilitator console and debrief slides | P2 | M |
| HA-14 | Evaluation and surveys | Reaction and confidence surveys, before and after measures, behaviour metrics | P3 | M |
| HA-15 | Data protection and platform trust | Processor terms, retention, deletion, data export, audit log, UK and EU hosting | MVP | M |
| HA-16 | Platform localisation | Translatable Hacktivity UI for learners and admins | P3 | M |
| HA-17 | Learner home | "My training": what is due, progress, resume, certificates, reference cards | MVP | M |
| HA-18 | Licensing and billing | Per-seat organisation licences, trials, renewals | P3 | M |
| HA-19 | Content versioning and release notes | Version every module, record which version each learner took, publish what changed | P2 | S |
| HA-20 | Video hosting, captions and transcripts | Host explainer videos with caption files, transcripts and audio description | P2 | S |
| HA-21 | Microlearning schedule | Send a short drill each month, spaced through the year | P2 | M |
| HA-22 | Learning record store | Receive and store xAPI statements from the game (BE-14) and forward them | P2 | M |
| HA-23 | Accessible platform and lab sheet theme | A WCAG 2.2 AA pass over Hacktivity's learner pages and the HacktivityLabSheets theme | MVP | M |

## Dependencies

- Nothing in the assessment trail works without **BE-01** (the record), **MG-20** (the knowledge check) and **HA-05** (the platform record). Build these first.
- **BE-19** (open minigames from conversations and events) is needed by almost every module: the mentor's check question, the inbox opening at the hook, forms opened by a colleague. Build it with BE-01.
- **BE-03** (text route) depends on BE-01 so both routes produce the same evidence.
- **BE-05** and **HA-11** are two halves of one feature: the platform stores the organisation profile, the game reads it.
- **HA-10** (LMS interoperability) and **HA-22** (LRS) depend on **BE-14** (xAPI statements) for anything richer than complete and score.
- **BE-07** (micro-drills) and **HA-21** (schedule) go together, and depend on **BE-13** (content banks) so a monthly drill isn't the same drill every month.
- **EX-02** (engine-recorded video) depends on **MG-21** (video player) or **HA-20** (hosting) to be shown anywhere.
