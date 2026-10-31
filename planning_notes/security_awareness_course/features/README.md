# Features

Everything the awareness course needs that Break Escape and Hacktivity don't have yet, plus the existing features it builds on. Modules refer to features by id, so these ids are stable: add new ones at the end of a list, never renumber.

**Read `../04_BUILT_SO_FAR.md` first.** Main now has a working social-engineering engine and an awareness product, "Incident Simulations: Critical Cases": seven full episodes (E1 to E7), seven defend-only variants and 24 pre and post check missions. Where this catalogue and the build disagree, the build wins. The per-id evidence is in `../research/current_state_social_engineering_build.md`.

| Document | Covers |
|---|---|
| `break_escape_engine.md` | Engine and in-game UI features (BE) |
| `minigames.md` | New minigames (MG) and how existing minigames are reused |
| `explainers_video_and_npc.md` | How information is explained: the host NPC, concept cards, in-world documents, demonstrations, the attack half; video as an optional extra (EX) |
| `hacktivity.md` | Platform features for running mandatory training for organisations (HA) |
| `assessment_and_evidence.md` | The assessment model and the evidence trail, across engine and platform |
| `accessibility_and_inclusion.md` | The accessible route and the accessibility and inclusion rules, across engine, platform and content |

**Build status** (from the research file): **Built** (exists and does what the entry asks), **Built differently** (the need is met by another design, named), **Partly built** (part exists, named; the entry now asks only for the rest), **Not built** (nothing yet; a nearby base may be named in the feature document).

**Priority** follows `04_BUILT_SO_FAR.md` §4:

- **MVP** is what the next episodes need: the engine gaps every new episode needs (04 §4.2) and what E8 to E13 need (04 §4.3: E8 after the click, E9 passwords, E10 fake downloads and "verify you are human" pages, E11 misdirected and overshared data, E12 the visitor and the tailgater, E13 the AI assistant).
- **P2** is the remaining core topics, the role extensions, sector_01 and the later check roles.
- **P3** is later, or made moot by the build.
- **Wish list** is a platform feature. No Hacktivity change happens without the user's go-ahead (R8).
- **Built** marks the new ids for systems already on main.

Size: **S** days, **M** a few weeks, **L** a month or more, for one developer, as a rough guide only. For a partly built entry the size is for what is left.

All folders below are under `public/break_escape/js/` unless they start with `scripts/`, `scenarios/` or `public/`.

## Break Escape engine (BE)

| Id | Feature | One line | Build status | Priority | Size |
|---|---|---|---|---|---|
| BE-01 | Assessed decisions | Now: add an optional outcome id to the awareness-measure records, ids only, first answer wins | Built differently, by the judges (BE-40), triage scoring and awareness-measure records (BE-36) | P2 (was MVP) | S |
| BE-02 | Debrief screen | Now: extra panels on the episode debrief (a chain view, a call replay) and a per-outcome view once BE-01 adds outcome ids | Built differently, by the episode debrief in the runner (BE-31) and the flip view (BE-32) | P2 (was MVP) | S |
| BE-03 | Text route player | Plays an episode or check shell as an accessible text route, writing the same awareness-measure records as the game | Not built (voicemail transcripts only) | MVP | L |
| BE-04 | Accessibility baseline | Extend the social overlays' conventions to the game shell and dialogue: screen reader route, captions, text size, timers that can be turned off | Partly built, by the social overlay conventions and the game menu Display page | MVP | M |
| BE-05 | Organisation profile in game | Now: the reporting route, rule of thumb slot and team size, with more keys only as episodes need them | Partly built, by `social.awareness` and the episode brand wordmark | P2 (was MVP); the platform setting waits on the user | S |
| BE-06 | Localisation | Translatable UI and ink, per-language voices, locale-specific reference content | Not built (strings already sit in data) | P3 | L |
| BE-07 | Micro-drill launcher | A drill drawn from a bank; the defend-only shell is the drill today (R12) | Partly built, by check missions and defend-only shells | P2 | M |
| BE-08 | Visual aids in conversations | An image or annotated document inside a conversation, and a shared screen in a video call | Not built (concept cards (EX-09) and debrief panels cover most uses) | P2 (was MVP) | M |
| BE-09 | Intranet terminal | The company intranet in game, with reference pages and policies | Not built; made moot by the debrief's report box and "On Monday" card | P3 (was MVP) | M |
| BE-10 | Spot-the-risk mode | Mark objects in a room or scene as risks; the player finds and fixes them | Not built (nearest: the landing-page builder's Inspect step) | P2; a candidate for E12 | M |
| BE-11 | Role switch | Now: reuse the E3 role swap for any later attack-then-defend swap | Built differently, by the E3 role swap (BE-41) | P3 (done) | S |
| BE-12 | Short sessions and resume | Now: checkpoints inside a stage, only if playtests show the need | Partly built, by per-stage episode state, persisted mail state and drafts | P2 (was MVP) | S |
| BE-13 | Content banks and randomisation | A seeded draw from a bank and annual editions, keeping mirror pairs and the balance lint | Partly built, by parallel forms A and B in AB and BA pairs | P2 | M |
| BE-14 | xAPI statements | Emit the awareness-measure records as xAPI statements | Partly built, by `toXapi` in awareness-measure (written, unused) | P2 | S |
| BE-15 | Facilitated group mode | Now: a presenter view; the defend round stays individual | Partly built, by the runner's `facilitated` flag | P2 | M |
| BE-16 | Time skips and consequence scenes | Now: the consequence flip (R3) for E11 and the no-attacker topics, as a flip view variant | Not built (nearest: the flip view (BE-32)) | MVP (for E11) | S |
| BE-17 | Cross-module memory | Characters remember the player; moot without a recurring cast (R2) | Partly built, by platform carry-over of scalar globals | P3 | M |
| BE-18 | Work task and interruptions | Timed arrivals inside a triage round, only if an episode needs them | Partly built, by the mail scheduler (BE-35) and NPC timed messages | P2 (was MVP) | M |
| BE-19 | Open minigames from conversations and events | A real `#trigger_minigame` and an `open_minigame` action, for host conversations and E12's person-chat | Partly built, by the framework's return-to-parent and the runner opening each stage | MVP | S |
| BE-20 | Authorable tutorial, title screen and end screen | Scenario-defined tutorial, title and end screen in the general skin; today they show Hacktivity and spy text | Not built | MVP | M |
| BE-21 | Workplace music and sound | A music and ambience set for the workplace tone | Not built (the lab reuses existing playlists) | P2 | S |
| BE-22 | Tactic spotter card | Name the tactics in play; done per message instead of on an overlay | Built differently, by triage red-flag chips, the pretext tells panel and the flip view's tell list | P3 (was P2) | S |
| BE-23 | Pause and time scale | Pause that also stops the clock, scenario timers, phone messages and mail jobs, plus a timers-off setting | Partly built, by the Esc menu's scene pause | MVP | M |
| BE-24 | Place-player action | A scenario action that moves the player to a room and spot | Not built; mostly moot in a one-room frame | P3 (was P2) | S |
| BE-25 | Course avatars and inclusive name entry | Now: Unicode name entry (accented letters, hyphens, apostrophes); the chosen avatar always wins (R11) | Partly built, by the player avatar rule and the look-alike guard (BE-37) | MVP | S |
| BE-26 | Accessibility checks in CI | Automated accessibility tests over the runner and the social overlays, added to the existing social CI job | Not built (CI runs the social tests and validator, BE-38) | MVP | S |
| BE-27 | Plain English lint | A prose check over ink and strings, beside `--strict-social` | Not built | P2 | S |
| BE-28 | Take an item from the player | An ink tag and action that take an item (a visitor badge, a found USB stick) | Not built (`removeFromInventory` exists internally) | P2; a candidate for E12 | S |
| BE-29 | NPC guide behaviour | An NPC walks ahead and waits for the player | Not built | P3 (was P2) | S |
| BE-30 | Video call options | Configurable call labels (today "SECURE VIDEO LINK" is hard-coded), and call effects as texture only | Not built | MVP (was P2) | S |
| BE-31 | Episode runner | The kiosk overlay that runs an episode's stages with a step strip, then the debrief | Built: `minigames/episode-runner/`, `systems/episode-starter.js` | Built | |
| BE-32 | Flip view | Shows the learner's own email, page or call as its receiver sees it, with its tells | Built: `minigames/episode-runner/flip-view.js` | Built | |
| BE-33 | Influence service | One signed influence global per character, with thresholds, reasons, a bar and a pip | Built: `systems/social-influence.js`, `ui/influence-bar.js`, `ui/npc-influence-pips.js`, `ui/pretext-chrome.js` | Built | |
| BE-34 | Channels and synced globals | One ink story per channel per character, with shared state in synced globals | Built: `systems/global-writer.js`, `systems/scenario-npc-records.js` | Built | |
| BE-35 | Mail scheduler and mail runner | Wall-clock mail jobs that survive a reload, and a headless ink run per reply | Built: `systems/mail-scheduler.js`, `systems/mail-runner.js` | Built | |
| BE-36 | Awareness-measure records | Per-round records (ids, verdicts, times), pre and post comparison, discrimination figure for organisers | Built: `systems/awareness-measure.js`, `minigames/inbox-triage/triage-comparison.js`, `scenarios/awareness_pre_*`, `scenarios/awareness_post_*` | Built | |
| BE-37 | Look-alike NPC guard and player avatar | The chosen avatar always wins; an NPC wearing the same sprite is swapped | Built: `utils/npc-lookalike.js`, `utils/player-avatar.js` | Built | |
| BE-38 | Social validator and CI | Lints for templates, slots, influence, brands, `.example` domains, episode shells and hosts; a CI job | Built: `scripts/validate_social.rb`, `scripts/validate_social/`, `--strict-social` | Built | |
| BE-39 | Intel facts and readiness | One award path for typed facts from browsing, calls or mail, with readiness globals | Built: `systems/social-intel.js` | Built | |
| BE-40 | Phish rules engine and pretext judge | Pure, deterministic judges for a sent message (seven factors) and for each call line | Built: `systems/phish-rules.js`, `systems/pretext-judge.js` | Built | |
| BE-41 | Role swap | E3's calls turned into triage call cards, so the learner checks the facts they just used | Built: `minigames/episode-runner/role-swap.js` | Built | |
| BE-42 | Readable font | Source Sans 3 for every string a player reads or compares | Built: `public/break_escape/css/fonts.css` (`--se-font-readable`) | Built | |

## Minigames (MG)

| Id | Minigame | One line | Build status | Priority | Size |
|---|---|---|---|---|---|
| MG-01 | Inbox | Now: compose with recipient checks for misdirected email (E11); defender reply and forward only if an episode needs them | Built differently, by the mail client (MG-34) and inbox triage (MG-35) over one read-only reader | MVP (the compose extension, for E11) | M |
| MG-02 | Web browser | Now: downloads, browser warnings and fake "verify you are human" pages (E10) | Partly built, by the OSINT browser (MG-31) and the triage `page` kind | MVP (for E10) | M |
| MG-03 | Link and domain drill | A stand-alone timed drill, as a defend-only shell | Partly built, by triage look-alike tells and the builder's domain menu | P2 | S |
| MG-04 | Voice calls | Ringing phone, directory, hold and transfer | Partly built, by pretext calls and the triage `call` and `voicemail` cards | P2 | M |
| MG-05 | Messaging apps | Chat-app skins on phone-chat | Partly built, by the triage `sms` kind and the phone layout | P2 | S |
| MG-06 | QR code scanner | Judge a printed QR notice; the code encodes nothing | Built differently, by the triage `qr` kind | P3 | S |
| MG-07 | MFA prompts and authenticator | Now: number matching and one-time codes on the defender side | Partly built, by the mock authenticator (MG-36) and the triage `push` kind | P2 | M |
| MG-08 | Password manager and passphrase builder | Build a passphrase, see how long it would take to guess, store and fill it with a manager | Not built | MVP (for E9) | M |
| MG-09 | Incident report form | Report what, when, where and who; feedback on completeness and speed | Not built (reporting is the one-click Report verdict) | MVP (for E8) | S |
| MG-10 | Classification sorter | Label documents with the organisation's classes, with reasons | Not built | P2 | S |
| MG-11 | Sharing settings | Choose who can see a file or link, and spot over-shared ones | Not built | MVP (for E11) | S |
| MG-12 | Redaction | Remove personal data before sending, including the fake redaction that only hides the text | Not built | MVP (for E11) | M |
| MG-13 | Social media profile and OSINT board | Connect public posts into an attacker's picture of a person, then pick mitigations | Built differently, by the OSINT browser (MG-31) and intel board (MG-32) | P3 (done) | S |
| MG-14 | Wi-Fi and VPN picker | Choose a network, spot the look-alike, connect the VPN | Not built | P2 | S |
| MG-15 | Payment verification desk | Compare with the supplier record, call back on the known number, second approver | Partly built, by E1's Verify verdict and genuine "confirmed by phone" item | P2 | M |
| MG-16 | AI assistant chat | Decide what is safe to paste into an AI tool, and check its answers; authored, no language model at runtime (R10) | Not built | MVP (for E13) | M |
| MG-17 | Caller verification desk | A queue of callers and a checklist panel | Partly built, by the E3 role swap's call cards (BE-41) | P3 | S |
| MG-18 | Access review | A table of people and permissions; remove what is no longer needed | Not built | P3 | S |
| MG-19 | Code review | Spot the security problem in a short code change | Not built | P3 | M |
| MG-20 | Knowledge check | Now: each module's question bank is a pool of candidate check and defend items (R6) | Not built; built differently as the pre and post checks (BE-36) | P3 (was MVP) | M |
| MG-21 | Video player | Plays a video on an in-world screen with captions and transcript | Not built | P3 (no video, R9) | M |
| MG-22 | Supplier assessment | Review a supplier's security answers and evidence | Not built | P3 | S |
| MG-23 | Device settings | Screen lock, updates, encryption, backups, app permissions, pop-up triage | Not built | P2 | S to M |
| MG-24 | Crisis decision board | Extends the existing command board for board-level decisions | Not built | P2 | M to L |
| MG-25 | Document inspector | Compare a document with a trusted reference and mark what doesn't match | Partly built, by the landing-page builder's Inspect step (MG-33) | P2 | M |
| MG-26 | Incident spread map | Where an incident spreads until someone reports it (core_04's "blast radius") | Not built | P2 (was MVP); a candidate for E8's flip | M |
| MG-27 | Work desktop | One launcher for the inbox, browser, chat and settings | Not built; made moot by the kiosk (BE-31) | P3 (was MVP) | S to M |
| MG-28 | Secure payment line | A keypad overlay for taking a card payment by phone | Not built | P3 | S |
| MG-29 | Patient record viewer | The existing `ehr-terminal` generalised | Not built | P3 | M |
| MG-30 | Pretext workshop (attacker view) | Delivered as the attack half of every full episode | Built differently, by pretext prep and the composer (MG-34), the judges (BE-40), influence (BE-33) and the flip view (BE-32) | P3 (delivered) | |
| MG-31 | OSINT browser | An in-world browser over authored sites; every pick grants a typed fact | Built: `minigames/osint-browser/` | Built | |
| MG-32 | Intel board | A case file with recon, scope, plan and defender modes | Built: `minigames/intel-board/` | Built | |
| MG-33 | Landing-page builder | Assemble a look-alike sign-in page from authored choices, score it, then inspect it as the victim; never a working page | Built: `minigames/landing-page-builder/` | Built | |
| MG-34 | Pretext prep and template composer | A pretext card and mail templates whose blanks take only held facts; accounts, devices, drafts and judged replies | Built: `minigames/pretext-prep/`, `minigames/mail-client/` | Built | |
| MG-35 | Inbox triage | The scored defend round: Trust, Report, Delete, Verify; email, call, voicemail, push, page, SMS and QR cards; red-flag chips; mirror pairs | Built: `minigames/inbox-triage/` | Built | |
| MG-36 | Mock authenticator | An unscored attacker-side push run in which the learner chooses how many pushes to send and when; the debrief explains why fatigue works | Built: `minigames/authenticator/` | Built | |
| MG-37 | Engagement report | The student lab's closing report: results and root causes paired with controls | Built: `minigames/engagement-report/` | Built | |

## Explainers (EX)

| Id | Feature | One line | Build status | Priority | Size |
|---|---|---|---|---|---|
| EX-01 | Host NPC and concept cards (was the mentor explainer) | A host at a brand-set company frames each episode; concept cards and the debrief explain | Partly built, by the host NPC in every shell (BE-31) and concept cards (EX-09) | MVP (authored per new episode) | S |
| EX-02 | Engine-recorded video | Short videos recorded from the engine; optional | Not built | P3, optional | M |
| EX-03 | Produced video | Presenter-led or animated videos made outside the engine; optional | Not built | P3, optional | M |
| EX-04 | In-world documents | Posters and notices in the training room that carry the same messages | Partly built, by existing notes and text-file objects and the training room's "REPORT IT" poster | P2 | S |
| EX-05 | Demonstration scenes | See an attack land, then see what would have stopped it | Partly built, by the flip view (BE-32) and the mock authenticator (MG-36) | P2 | S |
| EX-06 | Attacker-view interludes | Delivered by attack-first: the attack half of every full episode | Built differently, by the episode runner's attack stages (BE-31) | P3 (delivered) | |
| EX-07 | Shared glossary and tooltips | Now: one course-wide set of concept card texts, behind a visible button, never hover only | Partly built, by concept cards (EX-09), the triage header explainers and the canonical red-flag sentences | P2 | S |
| EX-08 | Printable poster and briefing pack | Posters, desk cards and a short team briefing per episode, with the habit to keep and the customer's reporting route | Not built | P2 | S |
| EX-09 | Concept cards | Short explainer cards behind a visible "What is this?" button, linted for real brand names | Built: `minigames/osint-browser/concept-card.js` (`social.conceptCards`) | Built | |

## Hacktivity (HA)

No HA feature is built. The awareness product runs as ordinary missions in the `training` collection, ordered by the organiser (R8). The only platform change proposed is the customer reporting-route setting, and it waits for the user's go-ahead. The rest of this list is a wish list, kept for later; "was" gives the priority the plan first gave it.

| Id | Feature | One line | Build status | Priority | Size |
|---|---|---|---|---|---|
| HA-01 | Organisations, departments and roles | Customer organisations with departments, and org admin, manager, learner and auditor roles | Not built | Wish list (was MVP) | L |
| HA-02 | Single sign-on and provisioning | SAML and OIDC sign-in, SCIM or scheduled CSV provisioning, leavers removed automatically | Not built | Wish list (was P2) | L |
| HA-03 | Learning paths and assignments | Role-based paths, due dates, automatic assignment, recertification, exemptions | Not built (organisers order the missions by hand) | Wish list (was MVP) | L |
| HA-04 | Reminders and escalation | Reminders before and after due dates, escalation to managers | Not built | Wish list (was P2, part MVP) | M |
| HA-05 | Completion records and audit evidence | An append-only record of who completed which version of what, exportable as an audit pack | Not built (records stay in game globals) | Wish list (was MVP) | L |
| HA-06 | Certificates and badges | Completion certificates with a verification link; a later organisation option, not a default (R6) | Not built | Wish list (was MVP) | S |
| HA-07 | Policy library and acknowledgement | Versioned policies, acknowledgement, re-request on change | Not built | Wish list (was MVP) | M |
| HA-08 | Question banks | Manage item banks, add organisation items, retire weak items | Not built (sets are authored per scenario) | Wish list (was P2) | M |
| HA-09 | Organisation dashboards | Completion and results by department; the discrimination figure for organisers only | Not built | Wish list (was MVP) | M |
| HA-10 | LMS interoperability | SCORM, cmi5 and LTI 1.3 | Not built | Wish list (was P2) | L |
| HA-11 | Organisation profile and branding | The customer reporting route as a platform setting; logo and the rest later | Not built (the game reads a host-page override today) | Reporting route: waits on the user; the rest wish list (was MVP) | M |
| HA-12 | Phishing simulation and report-button data | Import the customer's own simulation results, behind an ethics checklist | Not built | Wish list (was P3) | M |
| HA-13 | Facilitated sessions | A facilitator console and debrief slides | Not built (the in-game `facilitated` flag exists, BE-15) | Wish list (was P2) | M |
| HA-14 | Evaluation and surveys | Reaction and confidence surveys; no effectiveness claims | Not built (in-game pre and post checks, BE-36) | Wish list (was P3) | M |
| HA-15 | Data protection and platform trust | Processor terms, retention, deletion, export, audit log, UK and EU hosting | Not built (hosting and learner privacy are out of scope for now) | Wish list (was MVP) | L |
| HA-16 | Platform localisation | Translatable Hacktivity UI | Not built | Wish list (was P3) | M |
| HA-17 | Learner home | "My training": what is due, progress, resume | Not built | Wish list (was MVP) | M |
| HA-18 | Licensing and billing | Per-seat organisation licences, trials, renewals | Not built | Wish list (was P3) | M |
| HA-19 | Content versioning and release notes | Version every episode and record which version each learner took | Not built | Wish list (was P2, part MVP) | S |
| HA-20 | Video hosting, captions and transcripts | Host videos with captions and transcripts | Not built | Wish list (was P2); only if EX-02 or EX-03 is taken up | S |
| HA-21 | Microlearning schedule | Send a short drill each month | Not built | Wish list (was P2) | M |
| HA-22 | Learning record store | Receive xAPI statements from the game (BE-14) | Not built | Wish list (was P2) | M |
| HA-23 | Accessible platform and lab sheet theme | A WCAG 2.2 AA pass over learner pages and the lab sheet theme | Not built | Wish list (was MVP) | M |
| HA-24 | Public API and webhooks | Keyed API access and outgoing webhooks | Not built | Wish list (was P2) | M |
| HA-25 | Partner role | Resellers and managed service providers | Not built | Wish list (was P3) | M |
| HA-26 | Setup checklist | A go-live checklist for a new organisation | Not built | Wish list (was MVP) | S |

## Built systems with no plan id

The build added systems the plan had no id for. Each now has a new id at the end of its list (above), marked **Built**. The feature documents describe them as they are; the plan extends them rather than replacing them.

| New id | System | Folder | Nearest old id |
|---|---|---|---|
| BE-31 | Episode runner: kiosk overlay, step strip, `full`, `defendOnly` and `check` variants, per-stage resume, host NPC and conclusion rule, the episode debrief | `minigames/episode-runner/`, `systems/episode-starter.js` | BE-02, BE-12, EX-06 |
| BE-32 | Flip view | `minigames/episode-runner/flip-view.js` | MG-30, EX-05 |
| BE-33 | Influence service, bar and pip | `systems/social-influence.js`, `ui/influence-bar.js`, `ui/npc-influence-pips.js`, `ui/pretext-chrome.js` | BE-22 |
| BE-34 | Channels and synced globals | `systems/global-writer.js`, `systems/scenario-npc-records.js` | BE-17 |
| BE-35 | Mail scheduler and mail runner | `systems/mail-scheduler.js`, `systems/mail-runner.js` | BE-18 |
| BE-36 | Awareness-measure records and the pre and post comparison | `systems/awareness-measure.js`, `minigames/inbox-triage/triage-comparison.js` | BE-01, BE-13, HA-14 |
| BE-37 | Look-alike NPC guard and player avatar | `utils/npc-lookalike.js`, `utils/player-avatar.js` | BE-25 |
| BE-38 | Social validator and CI | `scripts/validate_social.rb`, `scripts/validate_social/` | BE-26, BE-27 |
| BE-39 | Intel facts and readiness | `systems/social-intel.js` | BE-01 |
| BE-40 | Phish rules engine and pretext judge | `systems/phish-rules.js`, `systems/pretext-judge.js` | MG-30 |
| BE-41 | Role swap | `minigames/episode-runner/role-swap.js` | BE-11, MG-17 |
| BE-42 | Readable font | `public/break_escape/css/fonts.css` | BE-04 |
| MG-31 | OSINT browser | `minigames/osint-browser/` | MG-13, MG-02 |
| MG-32 | Intel board | `minigames/intel-board/` | MG-13 |
| MG-33 | Landing-page builder | `minigames/landing-page-builder/` | MG-25, MG-30 |
| MG-34 | Pretext prep and template composer (with mail client accounts and devices) | `minigames/pretext-prep/`, `minigames/mail-client/` | MG-30, MG-01 |
| MG-35 | Inbox triage, with the report button and Verify | `minigames/inbox-triage/` | MG-01, MG-09 |
| MG-36 | Mock authenticator | `minigames/authenticator/` | MG-07, EX-05 |
| MG-37 | Engagement report (student lab only) | `minigames/engagement-report/` | MG-09, MG-20 |
| EX-09 | Concept cards | `minigames/osint-browser/concept-card.js` | EX-07 |

Not given an id: the deduction board (design 12 in `planning_notes/phishing_and_social_engineering/`) is a proposal with no code.

## Extensions proposed by the module plans

Smaller additions to existing features that module writers asked for. They are recorded here so the feature owners pick them up; none needs a new id. The status column says where each now lands.

| Feature | Extension | Asked for by | Status |
|---|---|---|---|
| BE-02 | A chain view: a timeline of linked moments showing how one decision led to the next | core_17 | New: an optional panel on the episode debrief (BE-31) |
| BE-02 | A call replay: the call's transcript with the caller's tactics labelled and the player's checks marked | role_06 | Builds on the flip view's call card (BE-32) |
| BE-04 | A `timers_off` global so scenarios can advance timed events on task steps instead of the clock | core_04 | New, with BE-23 |
| BE-09 | A software portal page: approved tools with an Install button and a "Request something else" form | core_07, core_08, core_13 | BE-09 is P3; for E10 this becomes a site in the OSINT browser (MG-31) or a triage `page` item (MG-35) |
| MG-07 | A storm chat message that gives away the next prompt's number; a plain Approve or Deny prompt for a second service; options `approved_then_reported` and `unanswered` | core_03 | Builds on the mock authenticator (MG-36) and the triage `push` kind |
| MG-09 | Match each report to an incident; evidence chips only for facts the player saw; check "what have you done" answers against globals; report speed | core_04 | New, for E8; reuses triage red-flag chips (MG-35) |
| MG-20 | A game show presentation (three answer buzzers, contestants, rounds, "Ask first" scoring) | core_16 | New. MG-20 is P3; for core_16 this could become a defend set with an "Ask first" verdict in triage (MG-35), which would be a new verdict |
| MG-26 | Device and link state driven by globals; reveal rules; a step-through replay; a list view; update-status and files layers | core_04, core_07 | P2 with MG-26 |
| `ransomware-display` | A configurable icon, title, warning text and optional countdown, so the course can drop the skull | core_07 | P2 |
| HA-03, HA-21 | A spotlight recommender for private practice suggestions | core_17 | Wish list |
| HA-07 | "I have a question first": holds the acknowledgement open and records the answer | core_16 | Wish list |
| HA-13 | An event leaderboard that ranks tables, never people | core_17 | Wish list |
| HA-17 | A private year profile: the learner's results by area across the year | core_17 | Wish list |

## Dependencies

- **Every new episode** is built on the episode runner (BE-31), the flip view (BE-32), inbox triage (MG-35), the awareness-measure records (BE-36) and the social validator (BE-38), at a brand-set company in `BRAND_SET.md`. New companies are added there as "proposed" with a `.example` domain and get a web search before release.
- **The evidence trail** is the awareness-measure record (BE-36). Any richer record (BE-01's outcome id, BE-14's statements) extends it, never a separate bookkeeping. The platform record (HA-05) is a wish list item.
- **BE-03** (text route) depends on BE-31 and BE-36, so both routes write the same records. Most of the runner is already DOM; the gap is the room, the host conversation and the kiosk walk.
- **BE-19** (open minigames from conversations and events) is needed for a host conversation to open a concept card or a triage item, and for E12's person-chat in the training room.
- **BE-23** (pause) must also hold the mail scheduler's wall-clock jobs (BE-35) and the authenticator's timeline (MG-36).
- **BE-05** and **HA-11** are two halves of one feature: the platform would store the reporting route, the game reads it. The game half exists; the platform half waits on the user.
- **BE-14**, **HA-10** and **HA-22** go together, all after the user's go-ahead on the platform.
- **BE-07** (drills) and **HA-21** (schedule) depend on **BE-13** (banks) so a monthly drill isn't the same drill every month. Until then the defend-only shell is the drill.
- **EX-01** now needs only built pieces: the host NPC (BE-31) and concept cards (EX-09). It no longer waits on BE-08 or MG-20.
- **EX-02** and **EX-03** (video) depend on MG-21 or HA-20, and all four are P3. EX-02's main risk stays: Playwright records video without sound, so a spike comes before any episode schedules one.
- **BE-16's consequence flip** (E11) builds on the flip view (BE-32).
