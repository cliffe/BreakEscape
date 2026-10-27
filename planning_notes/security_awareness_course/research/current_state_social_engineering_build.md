# Built inventory: awareness course catalogue against main

> **Snapshot (first merge, 2026-10-27).** Later the same day main resumed the product and closed most stages; timings changed to about 15 minutes per episode and about 9 per check. See `../04_BUILT_SO_FAR.md` §1 for the current status.

Read-only check, 2026-10-27. Plan: `planning_notes/security_awareness_course/features/` (README ids BE, MG, EX, HA). Evidence: code under `public/break_escape/js/`, `scripts/scenario-schema.json`, `scripts/validate_social/`, `test/js/social-*.test.mjs`, the scenarios under `scenarios/awareness_*` and `scenarios/lab_social_engineering`, and the SE docs in `planning_notes/phishing_and_social_engineering/` (README key decisions A to AA, designs 00 to 12, `MECHANICS_AUDIT.md`, `FUN_DECISIONS.md`, design 11 section 10 "Built note"). Code was trusted over docs. The `SE_BUILD_LOG.md` Resume section is stale (dated 2026-10-21); `MECHANICS_AUDIT.md` "Status at end of 2026-10-22" and design 11 section 10 are the later status.

Paths below are relative to `public/break_escape/js/` unless they start with `scripts/`, `scenarios/`, `app/` or `planning_notes/`.

What is on main, in one paragraph: a social-engineering strand built attacker-first. Seven new overlays (`mail-client`, `osint-browser`, `intel-board`, `inbox-triage`, `pretext-prep`, `landing-page-builder`, `engagement-report`), two awareness-only overlays (`episode-runner`, `authenticator`), pure judges (`systems/phish-rules.js`, `systems/pretext-judge.js`), the influence service and bar, a mail scheduler and ink mail runner, a measurement store, and 47 social scenarios: the student lab, eight test fixtures, E1 to E7 full and defend-only shells, and pre and post check pairs (AB and BA) for six roles. Almost none of the general engine work in the BE list was done; nothing in the HA list was built on the platform.

## 1. Catalogue status

Status words: **Built** (does what the plan entry asks), **Partly built**, **Built differently** (the need is met by a different design), **Not built** (a pre-existing base may exist, named in the note).

### Break Escape engine (BE)

| Id | Feature | Status | What implements it | How it differs from the plan |
|---|---|---|---|---|
| BE-01 | Assessed decisions | Built differently | Per-mechanic deterministic scoring: `systems/phish-rules.js` (seven factors per send), `systems/pretext-judge.js` (`{delta, reason, line}` entries per line and ask), `minigames/inbox-triage/triage-scoring.js` (per-item score); per-round records in `systems/awareness-measure.js`, global `se_awareness_records` | No ink tag that tags a choice with a learning outcome; records are per triage round (item id, verdict, chips, score, ms, stage, variant, discrimination), ids only, first answer wins, kept in globals and not sent to any server beyond the normal sync |
| BE-02 | Debrief screen | Built differently | `minigames/episode-runner/debrief-view.js` (per-answer cards, "Monday" card, no-blame line, rule of thumb, report route box, team tally, genuine-item feedback); triage Review and Result steps; pretext debrief in the chat overlay (`test/js/social-pretext-debrief.test.mjs`); landing-page Inspect step; lab `engagement-report` | Built from the triage result, not from a BE-01 record; no per-outcome view, no chain view; the flip view's call card is the nearest thing to the "call replay" extension |
| BE-03 | Text route player | Not built | None | Voicemail items are shown as transcripts (audio held, design 11 section 10), which is the only text-alternative content |
| BE-04 | Accessibility baseline | Partly built | Social overlay conventions (SE README "Conventions"): keyboard reachable, own Close, Esc, `aria-live="polite"`, reduced motion, words beside every mark, 44 px targets, single column under about 700 px, Source Sans 3; game menu Display page (`ui/game-menu.js`: theme, HUD size, zoom) | Only the social overlays follow it; no captions, text size, timers-off or voice settings; no screen reader route for dialogue |
| BE-05 | Organisation profile in game | Partly built | `social.awareness` `{reportRoute, ruleOfThumb, teamSize}`, overridden key by key by the host page's `breakEscapeConfig.awareness` (`episode-model.js` `awarenessSettings`); `awarenessEpisode.brand` `{name, logoText, accent}` as a CSS wordmark (`step-strip.js`); mission `ui_theme` | Only three debrief slots and an accent colour; no organisation values in ink, documents or an intranet; no logo image. Making the reporting route a platform setting is decided but waits on the user (`FUN_DECISIONS.md` route_config) |
| BE-06 | Localisation | Not built | None | Strings are in data, not code, which design 11 keeps open for later |
| BE-07 | Micro-drill launcher | Partly built (differently) | Check missions: `awarenessEpisode.stages: ["check"]`, one kiosk, one triage set (`scenarios/awareness_pre_*`, `awareness_post_*`) | Fixed content, no randomisation, no stand-alone launcher; a check is a whole mission per role and form |
| BE-08 | Visual aids in conversations | Not built | None | Nearest: `social.conceptCards` (`osint-browser/concept-card.js`) and the debrief's `conceptPanel` and `voicePanel`; person-chat's existing `videoCall` mode has no shared screen |
| BE-09 | Intranet terminal | Not built | None | The existing `utils/lab-workstation.js` was not reused for this |
| BE-10 | Spot-the-risk mode | Not built | None | Nearest: the landing-page builder's Inspect step (find each giveaway on a page), which is an overlay, not a room |
| BE-11 | Role switch | Built differently | E3 role swap (`minigames/episode-runner/role-swap.js`): `awarenessEpisode.defend.calls[]` become `call` cards in the episode's triage set; attacker then defender is a stage change inside one runner | No change of character, kit or objectives; the "defender" is a triage round, not play as another character. Defend-only variants are separate shell missions (`*_defend`) |
| BE-12 | Short sessions and resume | Partly built | `episode_<id>_state` (resume at the stage left, on kiosk reopen); `mailState` persisted with drafts (`systems/mail-scheduler.js`); `se_landing_drafts`; triage first-attempt guard and re-emit on reopen (`systems/triage-starter.js`) | No checkpoints between beats inside a stage; target episode length is about 13 minutes (E3 accepted at about 17) |
| BE-13 | Content banks and randomisation | Partly built | Parallel forms A and B per role, counterbalanced by mission pair (AB, BA) | Fixed forms, no random draw; a seeded draw from a bank is a later request (design 11 section 5.2, R4) |
| BE-14 | xAPI statements | Partly built | `toXapi` in `systems/awareness-measure.js` (actor passed in, verbs answered and completed) | Written but unused; nothing is emitted to an LRS (design 11 section 10) |
| BE-15 | Facilitated group mode | Partly built | `awarenessEpisode.facilitated: true` in `episode-runner-minigame.js`: a prompt per stage (`strings.facilitator`), per-learner score hidden on the shared debrief, a pause panel between stages | No presenter view and no group decisions; the defend round stays individual by design |
| BE-16 | Time skips and consequence scenes | Not built | None | `gameClock.anchors` (`systems/game-clock.js`, m05 work) jump the time of day forward on a condition; no "three weeks later" scene and return |
| BE-17 | Cross-module memory | Partly built (existing) | Platform carry-over (`exportGlobals` and `importGlobals`, `app/models/break_escape/carry_over.rb`), used to carry `triage_pre_*` into the post-check mission | Only scalar globals cross; no character remembers the player across awareness episodes |
| BE-18 | Work task and interruptions | Partly built | `systems/mail-scheduler.js` jobs (`text`, `seed` with `deliverAt`, `ink`) on wall-clock deadlines; `#mail_later` chasers; `mail-client/mail-notification.js`; existing NPC timed messages | No primary work task with progress, no busy gate; timed mail is used for NPC replies in the attack, not as the defender's tests |
| BE-19 | Open minigames from conversations and events | Partly built (differently) | Framework `returnTo` and suspended parent (`minigames/framework/minigame-manager.js`, contract 00 S12); the episode runner opens each stage's child; pretext-prep's Begin hands over to person-chat or phone-chat; `#compose_reply:<targetId>` in `systems/mail-runner.js` | `#trigger_minigame` is still a notification-only stub (`minigames/helpers/chat-helpers.js`; `person-chat-pending-reply.js` lists it as "a notification only"); no launcher registry or `minigameConfigs`; no `open_minigame` action in `applyActions` |
| BE-20 | Authorable tutorial, title screen and end screen | Not built | None | Title screen still shows the Hacktivity logo (`title-screen-minigame.js`), tutorial still says "Welcome to Hacktivity Games!" (`tutorial-manager.js`); `show_end_screen` predates the plan. Episodes draw their own brief panel and step strip inside the runner |
| BE-21 | Workplace music and sound | Not built | None | The lab reuses existing playlists (SE decision Z); the report "sting" is the generic confirm sound (`FUN_DECISIONS.md` sting_sound) |
| BE-22 | Tactic spotter card | Built differently | Triage red-flag chips (name the tells on each item, scored; `inbox-triage/triage-flags.js`); pretext tells panel in the chat (`ui/pretext-chrome.js`, technique entries such as urgency); flip view lists each tell with its canonical sentence | Tells are named per message after reading, not ticked on an overlay while listening; on calls the tells are shown to the attacker as feedback |
| BE-23 | Pause and time scale | Partly built | Esc game menu pauses the Phaser scene and keys (`ui/game-menu.js`); `systems/vm-context-pause.js` stills NPCs; `utils/session-overlay-pause.js` holds timed dialogue under the resume overlay; `gameClock.rate` | The clock, scenario timers, phone messages and mail jobs keep running; `rate` scales only the shown time of day; no time scale or timers-off setting |
| BE-24 | Place-player action | Not built | None | No `place_player` action or tag in `systems/apply-actions.js` or `chat-helpers.js` |
| BE-25 | Course avatars and inclusive name entry | Partly built | `utils/player-avatar.js` (the chosen avatar always wins and the portrait follows, aw9; `games#show` requires a choice); office sprites in `AVAILABLE_SPRITES` (`app/models/break_escape/player_preference.rb`); `utils/npc-lookalike.js` | The no-avatar fallback is still the hooded hacker (`FUN_DECISIONS.md` hood: "Leave it"); the name field still allows only ASCII letters, digits, spaces and underscores, 1 to 20 characters |
| BE-26 | Accessibility checks in CI | Not built | None | CI (`.github/workflows/ci.yml`) runs the social Node tests and the validator over social scenarios, no accessibility checks |
| BE-27 | Plain English lint | Not built | None | The social lints (`scripts/validate_social/*.rb`, `--strict-social`) check data and brands, not prose |
| BE-28 | Take an item from the player | Not built | None | `removeFromInventory` exists inside `systems/inventory.js`, but no ink tag or action uses it |
| BE-29 | NPC guide behaviour | Not built | None | None |
| BE-30 | Video call options | Not built | None | "SECURE VIDEO LINK" is still hard-coded (`minigames/person-chat/person-chat-ui.js` line 264); no call effects |

### Minigames (MG)

| Id | Minigame | Status | What implements it | How it differs from the plan |
|---|---|---|---|---|
| MG-01 | Inbox | Built differently | Split in two over one read-only `mail-client/mail-reader.js`: `mail-client` (attacker composer: accounts that can or cannot spoof, templates with blanks, Attach, Sent, drafts, judged replies; `social.mailClient`, `social.phishTargets`, `social.templates`) and `inbox-triage` (defender: Brief, Sort, Review, Result; Trust, Report, Delete, Verify; red-flag chips; SPF, DKIM and DMARC header panel; `social.triageSets`) | No defender toolbar with reply, forward, move; no compose with recipient checks (misdirected email); no in-world mission inbox where tests arrive among work; no sender card or link hover as specified; practice is a scored round, not "Phish or Fine?" one at a time |
| MG-02 | Web browser | Partly built (differently) | `osint-browser` (address bar `address-bar.js`, company, social and document sites, picked lookups, no typing, nothing from the internet; `social.osint`); triage `page` kind (address bar, padlock, certificate, autofill; `triage-kinds.js`); landing-page victim view | Research and inspection only; no logins to follow, downloads, search ads, extension prompts or fake CAPTCHA |
| MG-03 | Link and domain drill | Partly built | Lookalike domain tells in triage; the builder's six-domain menu with an auth row each; homographs shown as typed in Source Sans 3 (decision X) | No stand-alone or timed drill |
| MG-04 | Voice calls | Partly built (differently) | Pretext calls on the existing phone-chat and person-chat (`social.pretextNpcs`, `pretext-prep`, influence); triage `call` card with comply, verify_callback, escalate, refuse; `voicemail` kind | No ringing phone, directory, hold or transfer; the learner is the caller in the attack and reads a transcript card in defence |
| MG-05 | Messaging apps | Partly built | Triage `sms` kind (phone-shaped thread, E6); mail client `layout: "phone"` | No chat-app skins on phone-chat |
| MG-06 | QR code scanner | Built differently | Triage `qr` kind: a printed notice with a decorative QR drawn from the message id | It encodes nothing and cannot be scanned; the learner judges the notice |
| MG-07 | MFA prompts and authenticator | Partly built (differently) | `minigames/authenticator` (attacker view: a scripted push stream on a timeline, the target taps Approve at a set time, the learner can send more; unscored; `awarenessEpisode.mfa`); triage `push` kind (approve, deny, deny_report) | No number matching, no one-time codes; the storm is watched from the attacker's side |
| MG-08 | Password manager and passphrase builder | Not built | None | Only a `page` item can carry "password manager not auto-filling" as a tell |
| MG-09 | Incident report form | Not built | None | Reporting is the one-click triage Report verdict; `engagement-report` is the attacker's findings report |
| MG-10 | Classification sorter | Not built | None | None |
| MG-11 | Sharing settings | Not built | None | None |
| MG-12 | Redaction | Not built | None | None |
| MG-13 | Social media profile and OSINT board | Built differently | `osint-browser` plus `intel-board` with four modes (recon, scope, plan, defender; `social.intelBoard`, `social.intelFacts`, `social.engagement.defender.factMitigations`); typed facts and readiness in `systems/social-intel.js` | Built as the core of an attacker-first loop (not P3 depth); the defender mode picks mitigations per exposed fact rather than toggling privacy settings |
| MG-14 | Wi-Fi and VPN picker | Not built | None | None |
| MG-15 | Payment verification desk | Partly built | E1 invoice fraud defend set with the Verify verdict and a genuine change-of-bank item "confirmed by phone" | No supplier record to compare, no call back, no second approver |
| MG-16 | AI assistant chat | Not built | None | None |
| MG-17 | Caller verification desk | Partly built | E3 role swap `call` cards (`role-swap.js`, `triage-kinds.js`) | A fixed set of three calls and a push, scored per action; no queue or checklist panel |
| MG-18 | Access review | Not built | None | None |
| MG-19 | Code review | Not built | None | None |
| MG-20 | Knowledge check | Not built | None | Nearest: `engagement.report` `question` items and the board's plan picks (one correct option, wrong pick shows its `why`) |
| MG-21 | Video player | Not built | None | None |
| MG-22 | Supplier assessment | Not built | None | None |
| MG-23 | Device settings | Not built | None | None |
| MG-24 | Crisis decision board | Not built | None | The existing `command-board` was not extended |
| MG-25 | Document inspector | Partly built (differently) | Landing-page Inspect step (`landing-page-inspect.js`: hot-spots, padlock decoy, "Show the link target", five-habits card) | Inspects a page the learner built, not a document against a trusted reference |
| MG-26 | Incident spread map | Not built | None | The existing `network-segmentation-map` was not extended |
| MG-27 | Work desktop | Not built | None | Devices are separate objects (`mail_terminal`, workstations, the episode kiosk) |
| MG-28 | Secure payment line | Not built | None | None |
| MG-29 | Patient record viewer | Not built | None | The existing `ehr-terminal` was not generalised |
| MG-30 | Pretext workshop (attacker view) | Built differently | `pretext-prep` (pretext card, blanks from held facts), the mail composer's templates and blanks, `phish-rules.js` (per-factor checklist, layered hints), `pretext-judge.js` and the influence bar for calls, the flip view (`flip-view.js`) and the `playerSent` triage kind | The core of every full episode and of the lab, not an optional P3 extra; messages are sent to fictional characters who reply through ink after a delay; abstract attachments and a built landing page link exist; no fragment reordering and no single plausibility meter |

### Explainers (EX)

| Id | Feature | Status | What implements it | How it differs from the plan |
|---|---|---|---|---|
| EX-01 | Mentor explainer pattern | Partly built (differently) | Lab: Ruth, the engagement lead, runs a progress-gated support hub and gives hints by phone (`scenarios/lab_social_engineering`, design 10) | No short-chunk explainer with a check question; episodes have only a host NPC that concludes the mission |
| EX-02 | Engine-recorded video | Not built | None | None |
| EX-03 | Produced video | Not built | None | None |
| EX-04 | In-world documents | Partly built (existing) | Existing notes and text-file objects; the lab's signs ("PIL signs", `SE_BUILD_LOG.md`) | No course poster or intranet set |
| EX-05 | Demonstration scenes | Partly built (differently) | The authenticator beat (watch MFA fatigue land on the target); the flip view (the learner's own attack seen from the receiving side) | No cutscene of an attack on a colleague, no mentor unpicking it |
| EX-06 | Attacker-view interludes | Built differently | The whole episode shape: brief, osint, build (E5), write, mfa (E3), flip, defend, debrief (`episode-model.js` `STAGE_IDS`); the lab | Attacker-first is the main stance, not a brief interlude; a defend-only variant of each episode exists for customers who do not want it |
| EX-07 | Shared glossary and tooltips | Partly built (differently) | `social.conceptCards` behind a visible "What is this?" button (`concept-card.js`, reused by the builder); triage header panel's SPF, DKIM, DMARC explainers; canonical red-flag sentences (contract 00 section 2) | Per scenario, not one course-wide glossary; no hover tooltips (hover-only is ruled out) |
| EX-08 | Printable poster and briefing pack | Not built | None | None |

### Hacktivity (HA)

No platform feature in the HA list has been built for this work. The local Hacktivity checkout shows no awareness changes, and the SE build required asking the user before any Hacktivity change (`SE_BUILD_LOG.md`, user instructions). The game-side hooks that touch an HA entry are listed in the note column.

| Id | Feature | Status | Game-side hook, if any |
|---|---|---|---|
| HA-01 | Organisations, departments and roles | Not built | None |
| HA-02 | Single sign-on and provisioning | Not built | SSO staged "later" (design 11 section 6.3) |
| HA-03 | Learning paths and assignments | Not built | Episode and check missions are plain missions in the `training` collection; the organiser orders pre and post checks by hand (decision V, A8) |
| HA-04 | Reminders and escalation | Not built | None |
| HA-05 | Completion records and audit evidence | Not built | `se_awareness_records` lives in game globals only; a server-side record only if productised (decision R) |
| HA-06 | Certificates and badges | Not built | None |
| HA-07 | Policy library and acknowledgement | Not built | None |
| HA-08 | Question banks | Not built | Triage sets are authored per scenario |
| HA-09 | Organisation dashboards | Not built | The discrimination figure is stored for organisers and never shown as blame (aw3, disc_visible); admin dashboard staged later (design 11 section 6.3) |
| HA-10 | LMS interoperability | Not built | `toXapi` shape only (BE-14) |
| HA-11 | Organisation profile and branding | Not built | Host-page `breakEscapeConfig.awareness` (report route, rule of thumb, team size); the platform setting is decided, not made (route_config) |
| HA-12 | Phishing simulation and report-button data | Not built | None; in-game Report verdict only |
| HA-13 | Facilitated sessions | Not built | In-game `facilitated` flag (BE-15) |
| HA-14 | Evaluation and surveys | Not built | In-game pre and post checks with a comparison panel (`triage-comparison.js`); no surveys; no effectiveness claims (A3) |
| HA-15 | Data protection and platform trust | Not built | Hosting and learner privacy out of scope for now (A7); no free text stored |
| HA-16 | Platform localisation | Not built | None |
| HA-17 | Learner home | Not built | None |
| HA-18 | Licensing and billing | Not built | None |
| HA-19 | Content versioning and release notes | Not built | None |
| HA-20 | Video hosting, captions and transcripts | Not built | None |
| HA-21 | Microlearning schedule | Not built | None |
| HA-22 | Learning record store | Not built | `toXapi` unused |
| HA-23 | Accessible platform and lab sheet theme | Not built | None |
| HA-24 | Public API and webhooks | Not built | None |
| HA-25 | Partner role | Not built | None |
| HA-26 | Setup checklist | Not built | None |

Totals: BE 0 built, 4 built differently, 12 partly, 14 not built. MG 0 built, 4 built differently, 8 partly, 18 not built. EX 0 built, 1 built differently, 4 partly, 3 not built. HA 26 not built.

## 2. Built things with no catalogue id

**Episode runner** (`minigames/episode-runner/`, `systems/episode-starter.js`; `social.awarenessEpisode`). A kiosk object opens one overlay that runs an episode's stages in order with a step strip, carries what the learner made into the flip, and saves progress in `episode_<id>_state` so a reopen resumes at the stage left. Variants `full` and `defendOnly`; check missions use `stages: ["check"]`. Closest: BE-12, BE-18 (as the module shell), EX-06.

**Flip view** (`episode-runner/flip-view.js`). Redraws the learner's own sent email, built page (E5) or call (E3) as its receiver sees it, lists its tells with canonical red-flag sentences, and quotes back the learner's chosen template (aw2). Falls back to "nothing to replay" when the attempt did not land. Closest: MG-30 step 5, EX-05.

**OSINT browser** (`minigames/osint-browser/`; `social.osint`). An in-world browser over authored company, social and document sites. Everything is a button: following a link, noting a block, opening a document's properties, or picking a lookup from a short list. Each pick grants a typed fact once through `grantFact`. Closest: MG-13, MG-02.

**Intel board** (`minigames/intel-board/`; `social.intelBoard`, `social.engagement`). A case-file overlay rebuilt from the `se_intel_*` and `target_ready_*` globals, with scope, plan, recon and defender modes; the defender mode turns the same facts into exposures with mitigation picks. Closest: MG-13.

**Intel facts and readiness** (`systems/social-intel.js`; `social.intelFacts`, `intelBoard.readinessSlots`; action `grant_fact`). One award path for facts from browsing, calls or mail; sets `target_ready_<id>` and `osint_done` at grant time and adds a note. Closest: none (BE-01 is nearest as a record).

**Phish rules engine** (`systems/phish-rules.js`; `social.phishTargets`, `social.templates`). A pure judge over slot value ids with seven factors (sender trust, sender authentication, addressed to, pretext relevance, attachment, urgency, link credibility), an open check on sender or subject topic, a pre-send gate that never names missing evidence, and an escalating hint ladder. Closest: MG-30.

**Pretext prep and pretext judge** (`minigames/pretext-prep/`, `systems/pretext-judge.js`; `social.pretextNpcs`). A brief and a pretext card whose blanks are filled only from held facts, handed to a phone or in-person call; the judge returns influence entries per line and ask, catches mismatched claims, and handles repairs and verification. Closest: MG-30, MG-04.

**Influence service, bar and pip** (`systems/social-influence.js`, `ui/influence-bar.js`, `ui/npc-influence-pips.js`, `ui/pretext-chrome.js`; `social.characters`, `social.influenceDisplay`; ink tags `#influence:N`, `#influence_gained`, `#influence_lost`, `#report`). One signed global per character with thresholds (wary, refuses, reports, lockout with expiry, opt-in hostile), a reason on every change, a DOM bar with threshold marks, a world pip, a tells panel and a portrait tint. Visibility per character. Closest: BE-22 (tells), none for the meter.

**Channels and synced globals** (contract 00 section 9; `systems/global-writer.js`, `systems/scenario-npc-records.js`). A character reached by phone, in person and by email has a separate ink story per channel; shared state is scenario globals kept in step with each story's `VAR`s by one writer; email-only characters get headless records. The writer also gives sync-then-emit (`deferEmit`, `stateSync.syncConfirmed()`). Closest: BE-17.

**Mail scheduler and mail runner** (`systems/mail-scheduler.js`, `systems/mail-runner.js`; `social.mailClient.seededMessages`, `deliverAt`). Wall-clock jobs (text, seed, ink) that survive a reload, and a headless ink run per reply (`on_email` knot) that writes the character's answer, moves influence and fires tags; `#mail_later` and `#compose_reply` are mail-only tags. `mailState` is a persisted keyed section. Closest: BE-18.

**Mail client accounts and devices** (`minigames/mail-client/`; `social.mailClient.accounts`, `mail_terminal` objects). Player accounts that can or cannot spoof, a real account recorded apart from the display name, account creation, per-device account lists, contacts revealed by globals, optional unscored free-text flavour (`freeTextFlavour`). Closest: MG-01.

**Landing-page builder** (`minigames/landing-page-builder/`; `social.landingPages`). Assemble a look-alike sign-in page from authored choices (brand, domain, padlock, fields), score it against a target, attach it to a mail, then inspect it as the victim. The preview holds no form control or link, nothing typed is read, and any host not ending `.example` is blocked by a runtime guard and a lint. Closest: MG-25 (inspect), MG-30.

**Engagement report** (`minigames/engagement-report/`; `social.engagement.report`). The lab's closing overlay: a results table read from the campaign records and a findings step pairing each root cause with a control. Closest: MG-09 (as a report), MG-20.

**Inbox triage extras** (`minigames/inbox-triage/`). Beyond the MG-01 mapping: the SPF, DKIM and DMARC header panel with concept explainers, `playerSent` replay of the learner's own phish, non-email kinds (`sms`, `voicemail`, `qr`, `page`, `call`, `push`), the Verify verdict, mirror pairs in each defend set (aw5), genuine-item feedback, "weakest skill" line, and a read-only reopen. Closest: MG-01.

**Report button** (triage Report verdict and its thanks lines in `inbox-triage-minigame.js`; the debrief's "How to report here" box; `#report` on the target side, where a character reports the attacker and ends the conversation). Report is one click with a neutral thanks for a genuine item. Closest: MG-01 step 8, MG-09.

**Awareness measurement pre and post** (`systems/awareness-measure.js`, `inbox-triage/triage-comparison.js`; `scenarios/awareness_pre_<role>_<ab|ba>`, `awareness_post_*`). Six roles, two parallel forms each, AB and BA mission pairs; the post mission imports `triage_pre_*` through carry-over and shows a comparison only when a baseline exists; a discrimination figure (hits against false alarms) is stored for organisers. Closest: HA-14, BE-13.

**Concept cards** (`osint-browser/concept-card.js`; `social.conceptCards`). Short explainer cards behind a visible "What is this?" button, with optional pixel-art image, linted for real brand names. Closest: EX-07.

**Role swap** (`episode-runner/role-swap.js`; `awarenessEpisode.defend.calls[]`). E3's calls converted into triage `call` messages scored by the existing scorer, with the claimed facts shown by label so the facts the learner used are the ones they now check. Closest: BE-11, MG-17.

**Mock authenticator** (`minigames/authenticator/`; `awarenessEpisode.mfa`). A phone-shaped push stream on a scripted timeline that ends with the target approving. Unscored demonstration. Closest: MG-07, EX-05.

**Look-alike NPC guard and player avatar** (`utils/npc-lookalike.js`, `utils/player-avatar.js`). When an NPC wears the player's chosen sprite, the NPC is swapped to another unused office sprite of the same set and its stock portrait follows; the player's choice is never changed. Closest: BE-25.

**Social validator and CI** (`scripts/validate_social.rb`, `scripts/validate_social/*.rb` for awareness, board, lab, landing, mail, options, osint, pretext, triage; `--strict-social`; `scripts/scenario-schema.json` `social` keys). Lints templates, slots, influence globals, lockouts, ink fallbacks, brand and `.example` domains, episode shells and host NPCs; CI runs the social tests and the validator loop. Closest: BE-26 and BE-27 (as CI lints, not accessibility or prose).

**Readable font** (Source Sans 3, `--se-font-readable` in `css/fonts.css`). Bundled for every string a player reads or compares, chosen because it covers the Cyrillic used in homographs. Closest: BE-04.

**Deduction board** (design 12). A proposal only, not built (no code found). Closest: MG-13.

## 3. Settled design rules that contradict or change the plan

| Rule settled by the build | Plan position it changes | Source |
|---|---|---|
| No language model in the game: judge, replies, feedback and hints are authored data or ink | The plan (core_15, MG-16) assumes AI content in places; nothing generative may be added | SE README decision P; contract 00 section 7 |
| Messages and call lines are composed from templates with blanks filled only from evidence the player holds; the scorer reads slot value ids, never text; free text, if on, is unscored flavour | MG-30 plans a reorderable fragment bank (greeting, hook, ask, sign-off) and a plausibility meter | SE README decisions D and M; contract 00 sections 10 and 13; `test/js/social-mail-freetext.test.mjs` |
| Attacker first, defender second, as the main stance; every episode is attack then defend, with a defend-only variant | MG-30 and EX-06 make the attacker view optional, P3 depth, "never shown before the learner has done the detect and behave beats" | SE README "What this is" and decision V; design 11 sections 3.1 and 5.1 |
| Attacks are sent, in the fiction: a send reaches a fictional character, is judged, and gets a reply from ink after a delay; abstract attachments and a built landing-page link are allowed | MG-30: "nothing can be sent", "no links, no attachments" | SE README decisions C, N, T; designs 01, 04, 07 |
| Influence is one signed global per character (`<character>_influence`) with configurable thresholds and a reason on every change; no separate suspicion meter or aggregate pretext score; the bar and number are shown by default, configurable per character | The plan has no influence model; BE-22 imagines a tactic checklist, MG-30 a plausibility meter | SE README decisions A, Q, AA; contract 00 section 8 |
| One ink story per channel per character, shared state in synced globals | Not in the plan, which assumes one conversation per NPC | SE README decision B; contract 00 section 9 |
| Builder brands, domains and accounts are invented and end `.example`; looks are `generic` or `parody`; no real product's look or logo; captures are simulated and the player's input is never read | MG-01 step 7 and MG-02 describe sign-in pages "pre-filled with the in-game account" without this rule | SE README decisions S, T, Y, Z; design 07 |
| Defender inbox and attacker mail client are separate overlays over one read-only reader; triage is a scored round of a fixed set (Brief, Sort, Review, Result) | MG-01 plans one three-pane client with mission-mode arrivals among work | Designs 01 and 05; SE README "Engine work, consolidated" |
| The role swap runs inside the triage scene as `call` cards; there is no character switch and no second writer of the result | BE-11 switches the player's character, kit and objectives mid-module | SE README decision H; design 11 N15 |
| Pre and post are separate shell missions per role, with fixed parallel forms counterbalanced by AB and BA pairs, carried by platform carry-over; organisers order them by hand | BE-13 randomises from banks; HA-03 assigns paths by rule | Design 11 section 5.2; SE README decision V |
| No pilot and no effectiveness claims; the discrimination figure is organiser-only, but learners get detailed feedback on genuine items | HA-14 plans before and after measures and behaviour metrics as evidence | SE README decision R; design 11 section 5.4; `FUN_DECISIONS.md` aw3, disc_visible |
| No free text is retained; records hold ids, enums, numbers, booleans and a timestamp; the first answer wins | BE-01 and HA-05 imagine richer per-decision records with outcomes sent to the server | `systems/awareness-measure.js`; design 11 sections 5.2 and 6.2 |
| Scored data reaches the browser unfiltered, which is accepted for the lab; awareness scoring reported to anyone else must be computed on a server path | The plan assumes the game's record is evidence for audit (HA-05) | SE README "Conventions" |
| Hosting, learner privacy and group-size thresholds are out of scope for now; pseudonymous ids and "no league table" are goals, not claims | HA-09 and HA-15 treat privacy thresholds and processor terms as MVP | SE README decision R (A4, A7); design 11 section 6.2 |
| The player's chosen avatar always wins and the portrait follows; a clashing NPC changes instead; the hooded fallback is left as is | BE-25 wants a workplace avatar set with no hooded hackers | `FUN_DECISIONS.md` aw9 and hood; `utils/player-avatar.js`, `utils/npc-lookalike.js` |
| Real-staff OSINT is out of scope; every target is fictional | Consistent with MG-13, but rules out any customer "real staff" variant | Design 11 section 6.2 |
| A QR item is a decorative pattern that encodes nothing | MG-06 plans a scanner that shows where the code really goes | `minigames/inbox-triage/triage-kinds.js` header |
| Hover is never the only way to see information; teaching notes sit behind a visible button | EX-07 plans tooltips | SE README "Conventions"; `concept-card.js` |
| The readable face is Source Sans 3, and look-alike domains are drawn as typed, not only as punycode | The plan names no face; `accessibility_and_inclusion.md` was written before decision X dropped Atkinson Hyperlegible | SE README decision X |
| The student lab fits one 60 to 90 minute session; awareness episodes target about 13 minutes (E3 accepted at about 17) | BE-12 targets 15 to 20 minute modules | SE README decision G; `FUN_DECISIONS.md` e3_length |
| Lab sheets and walkthroughs are written last, after everything else | Not in the plan | SE README decision R |
| Hacktivity changes need the user's go-ahead first; the deployment-wide reporting route is to be a Hacktivity setting | HA-11 assumes the platform stores the organisation profile | `SE_BUILD_LOG.md` user instructions; `FUN_DECISIONS.md` route_config |

## Gaps worth noting for the plan

- MVP engine items with no build at all: BE-03 (text route), BE-20 (title, tutorial, end screen), BE-26 (accessibility CI), and the real BE-19 opener (`#trigger_minigame` is still a stub). BE-23 is only a scene pause.
- MVP minigames still missing: MG-08, MG-09, MG-12, MG-20, MG-26, MG-27. MG-01 and MG-07 exist in a different shape and would need the defender-side pieces the plan lists (recipient checks, mission-mode arrivals, number matching, one-time codes).
- The build's records stay in game globals, and `toXapi` is unused, so every HA evidence feature (HA-05, HA-09, HA-10, HA-22) starts from nothing on the platform.
