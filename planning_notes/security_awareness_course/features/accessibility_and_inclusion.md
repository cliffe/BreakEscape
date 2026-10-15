# Accessibility and inclusion

How the awareness course makes sure every member of staff can complete every module, in a way that works for them, with the same evidence at the end. It covers the law and standards, the guidelines we follow, the text route, the engine baseline (BE-04) in detail, the rules for inclusive content, testing, the accessibility statement and the platform fixes (HA-23). It is the detail behind design principle 10 in `01_LEARNING_DESIGN.md`.

Paths: `JS/` is `public/break_escape/js/`. Engine features are in `features/break_escape_engine.md`. Sources checked in October 2026 are listed at the end. This is a plan, not legal advice.

## Who this is for

Mandatory training reaches everyone, so the course meets most kinds of need in any organisation of a few hundred people:

- **Disability is common.** The UK government's Family Resources Survey estimates that 16.7 million people (25%) in the UK were disabled in 2024 to 2025, including 23% of working-age adults.
- **Reading is hard for many adults.** GOV.UK's content guidance says 1 in 6 adults in England have very poor literacy skills (1 in 4 in Scotland face challenges with literacy, 1 in 8 in Wales lack basic skills, 1 in 5 in Northern Ireland have very poor skills).
- **Colour vision varies.** Colour Blind Awareness puts colour blindness at about 1 in 12 men and 1 in 200 women.
- **Situations disable people too:** no sound in an open-plan office, a phone screen in a van, a locked-down thin client, a second language, a migraine.

## What we commit to

| Commitment | Where it is designed |
|---|---|
| WCAG 2.2 AA for every interface the learner uses: the game's HTML interface, the text route, Hacktivity's learner pages and the lab sheet pages | Sections 4 and 8; BE-04, HA-23 |
| An equivalent text route for every module, with the same decisions and the same record | Section 3; BE-03 |
| Settings before anything plays: captions, text size, readable font, contrast, motion, timers, voice | Section 4.1; BE-04, BE-20 |
| Captions and a transcript for every spoken line, captions for sounds that carry information, and captions, transcripts and audio description for video | Section 4.4 |
| Nothing that flashes, and a reduced-motion setting that covers everything | Section 4.7 |
| No required fast reactions; every timer can be slowed or turned off | Sections 4.8 and 4.9 |
| Plain English at a reading age of about 11 to 12 | Sections 4.10 and 5.5 |
| A diverse cast without stereotypes, no victim blaming, no fear appeals, no hooded hackers | Section 5 |
| Testing with assistive technology and with disabled people, not only automated checks | Section 6 |
| A published accessibility statement and an accessibility conformance report | Section 7 |

## 1. The law and the standards

### Equality Act 2010 (England, Scotland and Wales)

- **The duty.** Section 20 sets the duty to make reasonable adjustments. It has three requirements: change a provision, criterion or practice that puts a disabled person at a substantial disadvantage; deal with physical features; provide auxiliary aids. Where the disadvantage concerns information, reasonable steps include providing it in an accessible format (section 20(6)). The disabled person cannot be charged for the adjustment (section 20(7)).
- **Employers.** Section 39 covers how an employer treats employees, including access to "opportunities for promotion, transfer or training" (section 39(2)(b)), and section 39(5) applies the duty to make reasonable adjustments to employers. In the employment schedule the duty is owed to the "interested disabled person" and covers practices applied "by or on behalf of" the employer (Schedule 8, paragraph 2). Where two people owe the same duty, each must comply as far as it is reasonable for them to do so (paragraph 2(5)).
- **Service providers.** Section 29 covers services, and for services the duty is owed to disabled people generally (Schedule 2, paragraph 2(2)): it is anticipatory, so the adjustments must be ready before anyone asks.

What it means for the course:

- Our customers are employers. Mandatory training they assign through Hacktivity is a practice applied on their behalf, so a course that a disabled employee cannot complete leaves the customer exposed, and they will ask us for evidence.
- Where we offer the course to the public (individual sign-ups on Hacktivity), we are the service provider and the anticipatory duty is ours.
- The answer in both cases is the same: build it accessible (sections 3 and 4), and support individual adjustments on request. The organisation can grant extra time or an exemption from a timed element (HA-03), and we provide content in accessible formats.

**Northern Ireland:** disability discrimination is covered by the Disability Discrimination Act 1995 rather than the Equality Act; the public sector regulations below refer to both (regulation 12(3)). Modules sold to Northern Ireland organisations should be checked against it (to verify per customer).

### Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018

SI 2018/952, in force from 23 September 2018. Larkspur's own customers (councils, NHS sites, schools, care homes) are the kind of body these regulations cover, and so are many organisations that will buy the course.

- **The duty.** Public sector bodies "must comply with the accessibility requirement" (regulation 6), which is to make a website or app accessible "by making it perceivable, operable, understandable and robust" (regulation 3). A body may claim disproportionate burden only after an assessment (regulation 7), and must publish an accessibility statement (regulation 8).
- **The standard.** A site is presumed to conform if it meets the Level A and AA success criteria of WCAG "as amended from time to time" (regulation 9). No version is fixed, so the current version applies.
- **Enforcement.** A failure to meet the accessibility requirement "is to be treated as a failure to make a reasonable adjustment" under sections 20, 21 and 29 of the Equality Act 2010 (regulation 12).
- **Exemptions.** Regulation 4 exempts:
  - third-party content "that is neither funded nor developed by, nor under the control of, the public sector body";
  - intranets and extranets published before 23 September 2019 until they are substantially revised;
  - pre-recorded audio and video published before 23 September 2020.
- **GOV.UK guidance** (last updated 30 September 2024) says:
  - a site meets the requirements if it meets WCAG 2.2 AA;
  - intranets and extranets are covered, while mobile apps for specific groups such as employees are not;
  - outsourcing does not move legal responsibility, and accessibility belongs in the request for quotation, the evaluation and regular contract reviews;
  - the Government Digital Service monitors compliance, and the Equality and Human Rights Commission (England, Scotland and Wales) and the Equality Commission for Northern Ireland enforce it.

What it means for the course: a public sector customer pays for the course, so it is not exempt as third-party content, and the customer stays responsible for it. Expect accessibility questions in tenders and contract clauses that require WCAG 2.2 AA, a statement and regular audits. We supply the evidence (section 7) and the wording for the customer's own statement.

### WCAG 2.2

The Web Content Accessibility Guidelines 2.2 are a W3C Recommendation; the current version is dated 12 December 2024 (https://www.w3.org/TR/WCAG22/). Content that conforms to 2.2 also conforms to 2.0 and 2.1. One criterion was removed, 4.1.1 Parsing; authors who must report against 2.0 or 2.1 may still need to test and report it.

Points that shape this course:

- **New criteria at A and AA:**

  | Criterion | Level |
  |---|---|
  | 2.4.11 Focus Not Obscured (Minimum) | AA |
  | 2.5.7 Dragging Movements | AA |
  | 2.5.8 Target Size (Minimum): at least 24 by 24 CSS pixels, with exceptions | AA |
  | 3.2.6 Consistent Help | A |
  | 3.3.7 Redundant Entry | A |
  | 3.3.8 Accessible Authentication (Minimum) | AA |

  3.3.8 names password manager support and copy and paste as acceptable ways to help with a cognitive test; it applies to Hacktivity's sign-in (section 8), not to the game's fictional sign-in pages.
- **A conforming alternate version** lets a page conform when another version does. The alternate must conform at the level claimed, provide "all the same information and functionality in the same human language", be as up to date, and be reachable from the non-conforming version through an accessibility-supported mechanism. This is the role of the text route (section 3).
- **Non-interference.** Four criteria apply to all content on a page, even content that has an alternate version: 1.4.2 Audio Control, 2.1.2 No Keyboard Trap, 2.2.2 Pause, Stop, Hide, and 2.3.1 Three Flashes or Below Threshold. The game must meet these whatever the text route does.
- **Timing.** 2.2.1 Timing Adjustable requires, for every time limit, that the user can turn it off, adjust it to at least ten times the default, or be warned and given at least 20 seconds to extend it with a simple action, at least ten times. The exceptions are real-time events, limits that are essential, and limits over 20 hours. A workplace deadline in a training game is none of these.
- **Reflow.** 1.4.10 Reflow (content usable at 320 CSS pixels wide without scrolling in two directions) exempts "parts of the content which require two-dimensional layout for usage or meaning", and the W3C's Understanding document lists games among them. The game map is exempt; the dialogue panel, documents, menus and minigames are not.
- **Reading level.** 3.1.5 Reading Level is AAA: text that needs more than lower secondary education reading ability (7 to 9 years of school) should have a simpler version or supplement. We aim for it anyway (section 5.5).

### EN 301 549

The European standard for accessible ICT, published jointly by CEN, CENELEC and ETSI.

- **The current version** is V4.1.1 (2026-09), a Harmonised European Standard adopted on 24 August 2026. National standards are to adopt it by 31 May 2027, and conflicting national standards are to be withdrawn by 31 May 2028.
- **It aligns with WCAG 2.2:** the web (clause 9), non-web document (clause 10) and software (clause 11) requirements were updated to match.
- **It serves two laws:** the Web Accessibility Directive (EU) 2016/2102 for the public sector (Annex ZA) and the European Accessibility Act, Directive (EU) 2019/882, for products and services (Annex ZB). It confers a presumption of conformity under the Act once it is cited in the Official Journal (whether that has happened yet: to verify).
- **It replaces V3.2.1 (2021),** which public buyers in the EU have used in procurement.

What it means for the course: EU public sector buyers will ask for EN 301 549. Meeting WCAG 2.2 AA covers its web clause; the conformance report (section 7) uses the EU edition of the template.

### Section 508 (United States)

- **The law.** Section 508 of the Rehabilitation Act of 1973 (29 U.S.C. 794d) applies to US federal agencies. Compliance with the standards is mandatory for them.
- **The standards.** The Revised 508 Standards were issued in a final rule on 18 January 2017. They incorporate WCAG 2.0 Level A and AA by reference (provisions E205.4 and 702.10.1).
- **Buyers' evidence.** Federal buyers usually ask suppliers for an Accessibility Conformance Report, written with the Information Technology Industry Council's Voluntary Product Accessibility Template. The current template is VPAT 2.5Rev (April 2025), in 508, EU, WCAG and INT (all three) editions; the WCAG and INT editions include WCAG 2.2.

What it means for the course: meeting WCAG 2.2 AA covers the 508 web criteria, provided we also test and report 4.1.1 for the 508 report.

### Elsewhere

Other countries have their own laws (for example the Americans with Disabilities Act in the US, and national laws implementing the European Accessibility Act). Their scope for staff training bought by employers varies and is not settled here: check each with the customer's legal team (to verify per market). The design target, WCAG 2.2 AA with an equivalent text route, is the same everywhere.

## 2. Game accessibility guidelines we follow

WCAG was written for web content, not for a game world. Two sets of game guidelines fill the gap, and we use both as design checklists alongside WCAG.

### Game Accessibility Guidelines

https://gameaccessibilityguidelines.com/ is "a collaborative effort between a group of studios, specialists and academics", maintained since 2012, in three tiers: basic (easy, wide-reaching, apply to almost all games), intermediate and advanced. We meet every basic guideline that applies to a 2D browser game:

| Basic guideline (quoted) | How the course meets it |
|---|---|
| "Allow controls to be remapped / reconfigured" | Key remapping in settings (4.2) |
| "Ensure that all areas of the user interface can be accessed using the same input method as the gameplay" | Every HUD control, the inventory and every minigame by keyboard (4.2) |
| "Include an option to adjust the game speed" | The time scale (4.9) |
| "Ensure interactive elements / virtual controls are large and well spaced, particularly on small or touch screens" | Targets at least 24 by 24 CSS pixels, and larger on touch (4.2) |
| "Avoid flickering images and repetitive patterns" | No flicker in course rooms, a flicker-off setting, no striped art (4.7) |
| "Allow players to progress through text prompts at their own pace" | Dialogue advances when the learner chooses, by default (4.9) |
| "Include interactive tutorials" | BE-20 tutorial in core_00 |
| "Use simple clear language" and "Use simple clear text formatting" | Plain English rules (4.10, 5.5) |
| "Use an easily readable default font size" | Readable defaults and a 200% setting (4.5) |
| "Provide high contrast between text/UI and background" | Contrast tokens and a high-contrast setting (4.6) |
| "Ensure no essential information is conveyed by a fixed colour alone" | Words and icons with every colour (4.6) |
| "Provide subtitles for all important speech" and "If any subtitles / captions are used, present them in a clear, easy to read way" | Captions and transcript (4.4) |
| "Ensure no essential information is conveyed by sounds alone" | Sound captions with visual cues (4.4, BE-21) |
| "Provide separate volume controls or mutes for effects, speech and background / music" | Exists (Music, SFX, Voice, Master); the sliders' labels need fixing (section 4, "What the engine lacks today") |
| "Ensure that all settings are saved/remembered" | Settings stored per player on the server (4.1) |
| "Provide details of accessibility features in-game" and "on packaging and/or website" | Settings help and the accessibility statement (section 7) |
| "Solicit accessibility feedback" | Feedback link in settings and the statement (section 7) |
| "Offer a wide choice of difficulty levels" | Assists for the few dexterity tasks; assessment never depends on skill or speed (4.8) |

### Xbox Accessibility Guidelines

Microsoft's Xbox Accessibility Guidelines (XAGs), version 3.2 (published 8 June 2023), https://learn.microsoft.com/en-us/gaming/accessibility/guidelines, were developed with industry experts and members of the gaming and disability community. Microsoft says they are not a compliance checklist but a guide to a playable experience. The ones that apply here:

| XAG | Title | Use in the course |
|---|---|---|
| 101 | Text display | Text size and readable fonts (4.5) |
| 102 | Contrast | 4.6 |
| 103 | Additional channels for visual and audio cues | Every sound cue has a visual cue, and the reverse (4.4) |
| 104 | Subtitles and captions | The caption standard below (4.4) |
| 106 | Screen narration | Screen reader layer and text route (4.3, section 3) |
| 107 | Input | Remapping, keyboard, touch (4.2) |
| 108 | Game difficulty options | Assists; nothing assessed depends on skill (4.8) |
| 109 | Objective clarity | Current task always visible and repeatable (4.10) |
| 112, 113, 114 | UI navigation, focus handling, context | Focus order, focus moved into and out of dialogs, labels (4.2, 4.3) |
| 115 | Error messages and destructive actions | Confirm before leaving a module or resetting settings (4.10) |
| 116 | Time limits | 4.9 |
| 117 | Visual distractions and motion settings | 4.7 |
| 118 | Photosensitivity | 4.7 |
| 121, 122 | Accessible feature documentation; accessible customer support | Section 7 |

XAG 104 gives the caption standard we adopt:

- speaker names, and subtitles on (or settable) before anything plays;
- captions for important non-speech sounds;
- a background behind caption text with adjustable opacity, and text scalable to at least 200%;
- lines of about 40 characters at most and no more than two lines on screen;
- mixed case, and at least one sans-serif font option;
- full transcripts of video.

XAG 118 defines flash failures as more than about three flashes a second covering about 20% or more of the screen, with a lower threshold for saturated red. It also counts high-contrast striped patterns over a large area as a failure. It names the Harding FPA test as a tool, and says that removing triggers is preferred over warnings.

## 3. The text route as the equivalent alternative

The text route (BE-03) is how every module conforms to WCAG 2.2 AA, as a conforming alternate version (section 1), and how anyone who cannot or would rather not play a real-time 2D game completes the course. It is designed in `break_escape_engine.md`, BE-03; the points that matter for accessibility are:

- **It is the same module, not a summary.** It runs the same ink files and the same minigames in their accessible modes, offers the same decisions, and writes the same BE-01 records with `route: "text"`. A parity check in CI proves every assessed behaviour and every option is reachable in it (`routeparity.mjs`, BE-03).
- **It is as up to date as the game** because it is built from the same content. A module cannot ship unless its text route passes the parity check.
- **It is easy to find.** The title screen (BE-20), the settings, the pause menu and Hacktivity's launch page (HA-17) all offer it, with equal weight. Nobody has to explain why they chose it.
- **It counts the same.** Completion, the knowledge check, certificates and dashboards treat the text route exactly as the game. The route is in the record for the learner, organisation admins and auditors, but managers never see it, because choosing the text route can hint at a disability (`assessment_and_evidence.md`, section 11).
- **Time is counted fairly.** Time on task is counted while the module is in focus, with a long idle limit, so a screen reader user listening without pressing keys is not counted as idle, and time is never a pass condition (`assessment_and_evidence.md`, open question 6).
- **It meets WCAG 2.2 AA on its own:**
  - semantic headings and landmarks, choices as buttons, focus moved to new content;
  - no time limits, no auto-advance and nothing that moves;
  - status messages in a polite live region, visual aids with text alternatives;
  - text that reflows at 320 CSS pixels and works in forced colours mode.
- **Who it serves:** screen reader users; switch and voice control users; people with vestibular conditions, migraine or photosensitive epilepsy; people who find real-time movement tiring; people on locked-down or low-spec machines or poor connections; people reading in a second language; and anyone who prefers reading.
- **What it doesn't do:** it doesn't excuse the game. The game still meets the non-interference criteria (1.4.2, 2.1.2, 2.2.2, 2.3.1) and the BE-04 baseline below, because many people with access needs will still choose the game and should be able to play it.

## 4. The BE-04 baseline in detail

What the game must do, what it does today (with paths), what changes and how each part is tested. The engine work list and acceptance criteria are in `break_escape_engine.md`, BE-04. Every new minigame meets the same baseline (`features/minigames.md`).

### What the engine lacks today

| Area | Gap | Where |
|---|---|---|
| Page language | No `lang` on any engine page (WCAG 3.1.1, Level A) | `app/views/break_escape/games/show.html.erb`, line 2; `missions/index.html.erb`, `player_preferences/show.html.erb` and `layouts/break_escape/application.html.erb`, line 2 of each |
| Keyboard | Inventory items are `<img>` elements with click handlers only | `JS/systems/inventory.js`, line 607 |
| Keyboard | HUD buttons (avatar, mode toggle, music) are `<div>`s, with labels shown only on mouse hover | `JS/ui/hud.js`, lines 63 to 85; `JS/music/music-widget.js`, line 117 |
| Keyboard | In conversations, Space is captured at window level, so Space on a focused choice triggers Continue instead of the choice (Enter works) | `JS/minigames/person-chat/person-chat-minigame.js`, lines 298 to 303 |
| Keyboard | Single-letter shortcuts (W, A, S, D, E, Q) can't be remapped or turned off (WCAG 2.1.4) | `JS/core/player.js`, line 278; `JS/ui/hud.js`, line 367 |
| Keyboard | The tutorial's "Alternative Movement" and "Hold to Walk" steps need a mouse | `JS/systems/tutorial-manager.js`, lines 205 and 211 |
| Focus | Minigame overlays have no dialog role, label or focus handling; the close button is an unlabelled "×" | `JS/minigames/framework/base-minigame.js`, lines 22 to 30 |
| Focus | Overlays close with Esc but focus is neither moved in nor returned | `JS/ui/modal-stack.js` |
| Screen readers | The canvas exposes nothing; dialogue is a plain paragraph with no live region | `JS/minigames/person-chat/person-chat-ui.js`, line 144 |
| Screen readers | Notifications have no live region and close with an unlabelled `<div>` | `JS/systems/notifications.js`, lines 13 to 64 |
| Screen readers | Volume sliders have no associated labels | `JS/music/music-widget.js`, lines 183 to 206 |
| Screen readers | The lab sheet iframe has no `title` | `show.html.erb`, line 117 |
| Captions | No captions for sounds, no conversation history, no transcript | (none exists) |
| Time | Dialogue auto-advances after 5 seconds (or the audio's length), and the click-through toggle exists but is never offered | `person-chat-minigame.js`, lines 27, 87 and 370 |
| Time | Notifications vanish after 5 seconds; barks after 5 to 20 seconds, paused only by mouse hover | `notifications.js`, line 13; `JS/systems/bark-lifetime.js` |
| Time | The game clock is wall time with no pause, so timers run during conversations | `JS/systems/game-clock.js`, lines 52 to 66 |
| Text | Sizes in pixels in pixel fonts (Press Start 2P, VT323), no size setting | `public/break_escape/css/person-chat-minigame.css`, lines 137 to 141 and 384 |
| Motion | Only three stylesheets guard animations with reduced motion; the scenario timer's urgent state pulses twice a second | `css/dusting.css`, `css/tutorial.css`, `css/biometrics-minigame.css`; `css/hud.css`, lines 393 to 411 |
| Colour | States shown by colour: the timer turns amber then red; the end screen title is red or green | `css/hud.css`, lines 382 to 403; `JS/systems/apply-actions.js`, line 221 |

The engine does have good foundations to copy: an accessible interaction menu (`JS/ui/interaction-menu.js`, line 147), the lighting system's flash limits and reduced-motion handling (`JS/systems/lighting.js`), separate volume controls, and one fully accessible minigame, the fingerprint dusting minigame (`scenarios/FINGERPRINT_MINIGAME_PLAN.md`, section 5): real buttons in tab order, keyboard control of the canvas, pointer events, a high-contrast toggle, a steady-hand assist, live status text, reduced motion and a 360 pixel layout.

### 4.1 Settings

**Requirement:** learners set their needs once, before anything plays, and the course remembers (Game Accessibility Guidelines, "Ensure that all settings are saved/remembered"; XAG 104, settings available before the first cinematic).

**Today:** the avatar and display name are stored per player (`break_escape_player_preferences`); lighting can be turned off only by URL or a `localStorage` flag (`lighting.js`, header comment, line 44); nothing else is a setting.

**Change:**

- A settings panel, reachable from the title screen (BE-20), a HUD button, a key, and the pause menu, offers:
  - text size (100%, 125%, 150%, 200%) and a readable font;
  - high contrast;
  - reduce motion and flicker off;
  - caption background opacity and size;
  - dialogue pace ("when I press Continue", the default, or "automatic, slow" or "automatic, normal");
  - time scale (normal, half speed, a fifth, a tenth, timers off) and pause while reading;
  - key remapping;
  - voice, music and ambience volumes.
- Settings are stored per player on the server (new columns beside the avatar choice), so they follow the learner across modules and devices. The browser's `prefers-reduced-motion` and `prefers-contrast` set the starting values.
- Each setting has a one-line explanation of what it does (XAG 104's note on describing options plainly).

**Test:** change every setting on the title screen, then check it applies in the first conversation, after a reload, and in the next module.

### 4.2 Keyboard, pointer and focus

**Requirement:** WCAG 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.1.4 Character Key Shortcuts, 2.4.3 Focus Order, 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (Minimum), 2.5.1 Pointer Gestures, 2.5.7 Dragging Movements and 2.5.8 Target Size (Minimum); the Game Accessibility Guidelines on remapping and on one input method for everything.

**Today:** movement, interaction and conversation choices work from the keyboard, but the inventory, the HUD and several minigames need a mouse, and focus is unmanaged (see the table above).

**Change:**

- **Real controls.** Every control becomes a `<button>` (or a proper form control) with an accessible name. The HUD becomes a toolbar after the game in the tab order. Inventory items become buttons in a list, opened with a key (I) as well as by click.
- **Dialogs.** Every overlay (minigames, documents, settings, the intranet) is a dialog with `role="dialog"`, `aria-modal`, a label from its title, focus moved to its heading on open, focus kept inside while open, and focus returned to where it came from on close. Esc keeps working through `modal-stack.js`.
- **Shortcuts.** Single-letter shortcuts can be remapped or turned off in settings. Space and Enter always activate the focused control; the conversation's own Space handler only applies when focus is not on a button.
- **Focus you can see.** A visible focus outline at least 2 CSS pixels thick with 3:1 contrast, never hidden under the HUD or a toast.
- **The places and people list** (BE-04 in the engine plan): one key opens a list of everything interactive in the room, people first, then objects, in a fixed spatial order. Each entry has Go to (the player walks there by the existing pathfinding, `movePlayerToPoint` in `JS/core/player.js`, line 717) and Use. It is the keyboard, switch and screen reader way through the world, and it never reveals which objects matter: it lists them all.
- **Pointer.** Hold-to-walk and drag-to-steer already have alternatives (click to move, keys). Minigames that use dragging get single-pointer alternatives, for example "move up" and "move down" buttons for the shredded document's strips. Targets are at least 24 by 24 CSS pixels, and 44 by 44 on touch layouts.

**Test:** complete each module with keyboard only; complete it with a switch or voice control through keyboard emulation; tab through every screen and check the order and that focus is always visible; check every dialog takes and returns focus.

### 4.3 Screen readers

**Requirement:** WCAG 1.1.1 Non-text Content, 1.3.1 Info and Relationships, 3.1.1 Language of Page, 4.1.2 Name, Role, Value and 4.1.3 Status Messages; XAG 106 Screen narration.

**Today:** the Phaser canvas is invisible to assistive technology; dialogue, notifications and barks are not announced; there is no `lang`. The interaction menu (`interaction-menu.js`) and the dusting minigame show the right patterns.

**Change:**

- `lang="en-GB"` on every page (and per locale later, BE-06).
- The canvas is hidden from assistive technology and replaced, for screen reader purposes, by:
  - a **location region** ("Operations office. Leo is at the next desk. Your desk, a printer, a notice board."), from a short description authored per room plus the places list, announced politely on entering a room;
  - the **places and people list** (4.2).
- **Conversations** become a log (`role="log"`) where each line is announced with the speaker's name; choices are a numbered list of buttons, and when they appear their count is announced ("Three choices").
- **Minigames** are labelled dialogs whose state changes are announced through a polite status region, as the dusting minigame does.
- **Notifications and barks** go through one polite live region, and stay in a message log (4.4).

**The honest limit:** a real-time 2D world will not be fully comfortable with a screen reader alone, even with all of this. The text route is the recommended route for screen reader users, offered at the start (section 3).

**Test:** the screen reader matrix in section 6, in both routes.

### 4.4 Captions and transcripts

**Requirement:** WCAG 1.2.1 to 1.2.5 for audio and video; the caption standard from XAG 104 (section 2); the Game Accessibility Guidelines on speech and sounds.

**Today:** every voiced line is shown as text, as is every bark. There are no captions for sounds, no history of what was said, and no transcript.

**Change:**

- **Speaker names** on every line, in the conversation panel, on barks and in the log.
- **Caption style** to the XAG 104 standard: a solid background with adjustable opacity, text up to 200%, mixed case, a sans-serif option, at most two lines on screen at a time. Spoken lines stay under 30 words (the dialogue lint's limit), which keeps captions short.
- **Sound captions:** every sound that carries information shows a caption and an icon, for example "[Phone ringing: Lena]" or "[New email]", placed near the source where possible. This includes the email chime, chat ping, door buzzer and printer (BE-21).
- **History and transcript:**
  - a conversation history panel shows everything said in the session, with speaker and in-game time, and barks and notifications stay in a message log, so nothing important is lost when a toast closes;
  - at the end, the learner can download the module's transcript as plain text or HTML.
- **Video** (MG-21, EX-02, EX-03):
  - captions, a full transcript, and audio description where the picture carries information the soundtrack doesn't (WCAG 1.2.5 at AA);
  - scripts for engine-recorded videos should say aloud everything the picture shows, so that no separate description track is needed, and the transcript includes the visual details.
- **Voice is optional:** a learner can turn the voices off and read, or keep them on with captions.

**Test:** play each module with sound off and check nothing is missed; check every information-carrying sound has a caption; check the transcript against the script.

### 4.5 Text size, fonts and reading

**Requirement:** WCAG 1.4.4 Resize Text, 1.4.10 Reflow (for everything except the game map), 1.4.12 Text Spacing; XAG 101 Text display; the Game Accessibility Guidelines on readable fonts and sizes.

**Today:** text is set in pixels, mostly in the pixel fonts Press Start 2P and VT323, with no size setting (`css/person-chat-minigame.css`, lines 137 to 141 and 384). The page does allow browser zoom up to five times (`show.html.erb`, line 9).

**Change:**

- All HTML interface text in `rem`, scaled by the text size setting from 100% to 200% without loss of content or function.
- A readable sans-serif font for anything longer than a short label (dialogue, documents, emails, questions), with the pixel fonts kept for headings and short labels. "Readable font" in settings switches every text to the sans-serif.
- Line height of about 1.5 for paragraphs, left-aligned text, no justified text, no long passages in capitals or italics.
- The dialogue panel, documents, menus and minigames reflow at 320 CSS pixels wide and tolerate the WCAG text spacing overrides.
- Reading support for dyslexia following the British Dyslexia Association's advice for training materials: plain language without acronyms or metaphors, one point at a time, materials available in advance (the reference card), and time to respond.

**Test:** 200% text size and 400% zoom on every screen; the text spacing overrides; a 320 pixel wide viewport for every HTML screen.

### 4.6 Contrast and colour

**Requirement:** WCAG 1.4.1 Use of Color, 1.4.3 Contrast (Minimum) at 4.5:1 for text, 1.4.11 Non-text Contrast at 3:1 for controls, focus and meaningful graphics; XAG 102 Contrast; the Game Accessibility Guidelines on colour.

**Today:** several states are shown by colour alone or mainly by colour:

- the scenario timer turns amber, then red and pulsing (`css/hud.css`, lines 382 to 411);
- the end screen's title is red for failure and green for success (`apply-actions.js`, line 221);
- the influence popups are green or red, though they also carry a plus or minus sign (`JS/minigames/helpers/chat-helpers.js`, line 654).

The dusting minigame has a high-contrast toggle, the model for the rest.

**Change:**

- Colour tokens with checked contrast for both the dark and light themes.
- A high-contrast setting that raises every UI colour pair to at least 7:1, thickens outlines and removes background images behind text.
- Support for Windows forced colours (`forced-colors` media query), so system colours replace ours.
- Every state carries a word or a shape as well as a colour: ratings in the debrief ("Secure", with a tick), the soft deadline ("about 5 minutes left"), highlights in visual aids (numbered outlines, BE-08).
- Course art is checked under colour vision simulations: clues never depend on telling red from green.

**Test:** automated contrast checks on tokens and screens; manual checks in forced colours mode and with Chrome DevTools' vision deficiency emulation.

### 4.7 Motion, flashing and photosensitivity

**Requirement:**

- WCAG 2.3.1 Three Flashes or Below Threshold (Level A, applies to all content even where an alternative exists) and 2.2.2 Pause, Stop, Hide;
- XAG 117 Visual distractions and motion settings, and XAG 118 Photosensitivity;
- the Game Accessibility Guidelines: "Avoid flickering images and repetitive patterns".

XAG 118 notes that about 1 in 4,000 people can have a seizure triggered by flashing images or patterns, that many don't know until it happens, and that flashing also affects people with migraine, autism or sensory processing differences.

**Today, the lighting system** (`JS/systems/lighting.js`) was built with flashing in mind:

- **Tube strikes:** each ceiling tube flashes twice as it strikes (lines 119 to 126), each panel starting after a random delay of 120 to 500 ms (line 615).
- **The faulty panel** dips once or twice for 90 ms every 2.5 to 8.5 seconds (lines 704 to 714).
- **Small LEDs** on racks blink with periods from 150 ms to about 2 seconds (line 576), and indicator lights blink about once a second (lines 937 to 944).
- **Under `prefers-reduced-motion`:** tubes fade up over 400 ms instead, the faulty panel holds steady and LEDs stay still (lines 699 to 716 and 891). The `lighting_dip` brownout is skipped (`apply-actions.js`, line 141).
- **But** reduced motion is read once from the browser setting (line 245), with no in-game switch.
- **Not yet measured:** with several tubes striking in one room within half a second of each other, the combined effect has not been measured against the flash thresholds. It may be fine (each pool of light is small), but it needs testing, not assuming.

**Today, elsewhere:**

- Most CSS animations have no reduced-motion guard (only `css/dusting.css`, `css/tutorial.css` and `css/biometrics-minigame.css` have one).
- The scenario timer's urgent state pulses twice a second (`css/hud.css`, lines 405 to 411), and the dual-auth panel, which finance modules may reuse for two-person approval, blinks twice a second (`css/dual-auth-minigame.css`, lines 72 and 113).
- The title screen types the title with a blinking cursor (`title-screen-minigame.js`).
- The credits visualiser draws falling "matrix" characters (`JS/music/bond-visualiser.js`, line 133).
- Combat screen flashes and shakes (`JS/systems/screen-effects.js`) are off in this course because attacks are disabled.

**Change:**

- **No flicker in course rooms.** Course scenarios don't set `flicker: true`; mood comes from steady light levels.
- **A flicker-off setting,** separate from reduced motion (some people who need it don't set reduced motion), which runs the lighting in its still mode: no strikes, no faulty panel, steady LEDs and screens.
- **A reduced-motion setting** that adds a class the CSS respects as well as the media query, and covers:
  - every CSS animation and transition (replaced by instant changes or short fades);
  - the title typing effect;
  - slide-ins of toasts and barks;
  - the credits visualiser (not used in the course; BE-02);
  - camera moves.
- **Nothing blinks** more than once a second in course UI; urgent states use words, not pulsing.
- **No high-contrast stripes or busy patterns** across large areas of course art (XAG 118's spatial pattern failure), for example blinds, carpets and screens of scrolling code.
- **Testing:**
  - every animated or flashing effect in a course module is recorded and analysed with the Harding FPA test, which XAG 118 names;
  - the free PEAT tool cannot be used, because its terms prohibit use for assessing material made for gaming (Trace Center, https://trace.umd.edu/peat/).
- **No warnings instead of fixes.** Warnings are not a substitute for removing flashing (XAG 118). The course has nothing to warn about.

### 4.8 No required fast reactions

**Requirement:** design principle 10; the Game Accessibility Guidelines on adjustable game speed and a choice of difficulty; XAG 108.

**Rules for every module:**

- **Speed is never assessed.** No assessed outcome depends on reading speed, reaction time or dexterity. Where an assessment mentions time ("reported within two game-minutes" in core_01's C01-B7), it is measured in game time, which the time scale stretches. Where timers are off, it is judged by sequence instead ("reported before the next email arrived").
- **No quick-time events,** no chases, and no failing a module by running out of time.
- **Line-of-sight challenges** (`JS/systems/npc-sight-challenge.js`), useful for tailgating and shoulder-surfing scenes, are used only as story beats with generous windows, never as a stealth test.
- **Dexterity minigames** (lockpicking, dusting, RFID) appear only in optional attacker-view interludes, with an assist or a skip, as the dusting minigame's steady-hand assist already shows. They are never assessed.
- **Walking is never a test.** The places list (4.2) can walk the player anywhere.

### 4.9 Timers that can be extended or turned off

**Requirement:** WCAG 2.2.1 Timing Adjustable and 2.2.2 Pause, Stop, Hide; XAG 116 Time limits. A training deadline is not "essential" in WCAG's sense, so every time limit can be turned off, slowed by at least ten times, or extended.

**Today:**

- **Game clock and timers:** the clock is wall time and never pauses (`JS/systems/game-clock.js`, lines 52 to 66), so scenario timers and timed messages keep running while the learner reads a conversation. The countdown widget can show "Next Event" in amber and red.
- **Dialogue** advances by itself after 5 seconds, or the length of the voice clip plus half a second (`person-chat-minigame.js`, line 27 and around line 1373). The click-through mode exists but nothing lets the learner choose it.
- **Toasts:** notifications close after 5 seconds (`notifications.js`, line 13), and barks after 5 to 20 seconds, paused only by hovering a mouse over them (`JS/systems/bark-lifetime.js`).
- **The title screen** closes itself after two minutes if nobody presses anything (`title-screen-minigame.js`, line 112).

**Change:**

- **Pause and time scale** (a proposed engine feature, listed in `break_escape_engine.md`): game time, timers, timed messages, interruptions and NPC patrols all follow one clock that can be paused or slowed by 2, 5 or 10 times, or stopped for timers altogether. Anything else that moves with game time follows the same clock, such as an incident spreading on core_04's incident spread map (MG-26). An option pauses game time whenever a conversation, document or minigame is open. Deadlines in course modules are soft (BE-18) and shown as words, never as a red countdown.
- **Dialogue** advances when the learner presses Continue, by default. Automatic pacing is an opt-in setting.
- **Toasts that carry information** stay until dismissed (or for at least 20 seconds) and are kept in the message log (4.4). Any toast can be paused with the keyboard as well as by hovering.
- **The title screen** never closes itself.
- **Hacktivity sessions** warn before they time out and let the learner extend them (HA-23). Autosave (BE-12) means a timed-out session loses nothing.

**Test:** with timers off, play each module start to finish without any time pressure and check the records match a normal-speed run with the same decisions.

### 4.10 Cognitive load and plain English

**Requirement:**

- WCAG 2.4.6 Headings and Labels, 3.2.6 Consistent Help (A), 3.3.2 Labels or Instructions and 3.3.7 Redundant Entry (A);
- XAG 109 Objective clarity and XAG 115 Error messages and destructive actions;
- the Game Accessibility Guidelines on simple language and interactive tutorials;
- GOV.UK's content guidance: plain English, sentences under 25 words, paragraphs of no more than 5 sentences.

**Rules for every module:**

- **One thing at a time.** The work task (BE-18) shows the current step; interruptions never overlap (BE-18's busy gate and minimum gap). Nothing asks the learner to listen, read and act at once: core_02's tactic spotter card (BE-22) can be filled in after each contact instead of live, with the same score.
- **Always know what to do next.**
  - The current task is always visible and can be read aloud by a screen reader.
  - A "What should I do now?" control is always in the same place on every screen, and gives the current task plus the mentor's sticky answer (EX-01). Because it never moves, it meets 3.2.6.
- **The same frame everywhere.** Every minigame and document opens in the same frame, with Close, Help and the settings button in the same places.
- **Confirm before anything the learner might regret,** such as leaving a module or resetting settings (XAG 115). Decisions inside the scenario (clicking a link, signing in on a fake page) are not confirmed, because they are the test. They are always recoverable, because reporting afterwards is the behaviour the course rewards.
- **Never ask twice.** Information the learner has already given is not asked for again in the same module (3.3.7), for example the name typed into the incident form (MG-09).
- **Memory aids** are always one step away: the notepad, the conversation history (4.4) and the reference card on the intranet (BE-09).
- **Plain English** to the rules in section 5.5.

**Test:** reading level checks (section 6) and playtests with people with learning disabilities and neurodivergent people (section 6).

## 5. Inclusive content rules

These apply to every module's writing, art, voice and examples. Reviewers check them alongside the design principles.

### 5.1 A diverse cast without stereotypes

The recurring cast in `03_WORLD_AND_CAST.md` is deliberately varied in age, ethnicity, gender, faith and disability, and `AGENTS.md` makes cast diversity a standing rule. Variety on paper isn't enough; how characters are written matters more.

1. **Spread competence and mistakes.** Every kind of person in the cast both catches things and slips up. Nobody's group is always the victim, the one who errs, or the expert. The cast already does this: Leo, young and online all the time, is the role model for reporting fast; Hassan, the finance manager, nearly got caught out and tells the story; Gillian, the chief executive, is impatient with process.
2. **Attackers are ordinary and varied,** and never coded by ethnicity, accent, nationality, religion, disability or class. A scam caller is not given a foreign accent as the clue; the clue is always the request. Attacker voices come from as wide a range of accents as staff voices, including local ones.
3. **Voices describe people, not stereotypes.** Voice styles in the voice bible describe personality and role (warm, brisk, precise), never an accent played for laughs.
4. **Disability is ordinary.** Precious, a wheelchair user, runs facilities; Kev wears hearing aids. Neither is a plot point, an inspiration story or an object of pity, and both can be right or wrong like anyone else. Some characters can have invisible conditions shown matter-of-factly (someone who uses captions on calls, someone who takes notes because it helps them remember).
5. **Names are spelled properly,** with their accents (Tomasz Wiśniewski), and players can do the same with their own names (5.6).
6. **Pronouns:**
   - Kai uses they/them, consistently, in every line and document;
   - the player is never gendered: characters say "you" and use the player's job, never "he" or "she" about the player;
   - groups are addressed as "everyone" or "all", not "guys".
7. **Culture and faith:** examples don't assume one religion's calendar (not only Christmas parties); social events include non-drinkers; dress, fasting or prayer appear matter-of-factly when they appear at all.
8. **All kinds of work:** warehouse staff, cleaners and field engineers have their own security moments and are shown as capable, not only office staff.
9. **Art:** concept prompts for new characters state age, ethnicity and look, as the character pipeline requires (`AGENTS.md`).

### 5.2 No victim blaming

People are the organisation's best detection system, not its weakest link (design principle 3; Adams and Sasse, 1999). The campaign's universe bible takes the opposite stance ("Humans are weakest link", `story_design/universe_bible/05_world_building/society.md`, quoted in `research/existing_content_reuse.md`); nothing from it is ported.

| Don't write | Write |
|---|---|
| "You fell for it." / "You failed." | "That one fooled lots of people. Here's how to spot the next one." |
| "Human error was to blame." / "People are the weakest link." | "It was built to look normal. Reporting it fast is what made the difference." |
| "Careless", "should have known" | Describe the situation: "busy, and expecting that email" |
| Any hint of discipline for reporting | "Thanks for telling me." (Ama's first words, `03_WORLD_AND_CAST.md`) |

In the story, the person who reports their own mistake is thanked. Outcomes turn on how fast something was reported, not on the click. Over-reporting is never marked down (core_01's C01-B9 has no "Not yet").

### 5.3 No fear appeals

Every threat is paired with a doable action, because fear without a clear response makes people avoid the topic (design principle 2; Witte and Allen, 2000).

- **No sirens, skulls or jump scares.** No countdown sirens, skulls or "you've been hacked" moments (`03_WORLD_AND_CAST.md`, "Tone").
- **Consequence scenes end on the action,** not the damage (BE-16).
- **The ransom screen,** if a module reuses it (`ransomware-display`, with its countdown, in core_07), is shown briefly, without flashing, and is followed at once by what to do.
- **Figures inform, they don't frighten:** one sourced figure where it helps, never a stack of them.
- **Content notes.** Some learners have lost money to scams or had their data exposed. A module that deals with money lost or personal data exposed opens with a one-line note of what it covers. The reference card gives the organisation's own support route, such as an employee assistance service, as a BE-05 value; the course never names a support service it hasn't checked.

### 5.4 Avoiding the "hooded hacker" image

The OpenIDEO Cybersecurity Visuals Challenge, run with the William and Flora Hewlett Foundation in 2019, set out to replace the stock imagery of cyber security (padlocks, white men in hoodies, and green ones and zeros), which its brief said reflects a surface-level picture of the field shaped by sensationalist media. Its shortlisted images were to be released under Creative Commons CC BY 4.0 (check the licence of each image before any reuse).

For this course:

- **Ordinary attackers.** Attackers are shown as ordinary and businesslike, mostly as voices, messages and websites (`03_WORLD_AND_CAST.md`, "Attackers"). Jo Fairweather, the ethical tester, is a funny, candid professional.
- **No villain imagery:** no hoodies, balaclavas, skulls, green code, falling "matrix" characters or glowing padlocks anywhere in a module, its posters (EX-04, EX-08) or its videos. The visual language is people, offices, phones and emails.
- **Engine defaults to change:**
  - the avatar menu previews `female_hacker_hood_v2` before a player has chosen (`app/models/break_escape/player_preference.rb`, line 44);
  - retired avatars fall back to `male_hacker_hood_v2` (line 40), and so does the game page's default sprite (`show.html.erb`, line 188);
  - the avatar list includes hooded hackers, a spy and a "nerd" (lines 10 to 25).

  Course scenarios limit avatars with `validSprites` to office avatars, and a course avatar set is proposed in `break_escape_engine.md`.
- **The credits visualiser's matrix mode** and the `cyber` theme's padlock logo (`README_scenario_design.md`, line 206) are replaced by the workplace style (BE-02, BE-20).
- **Generic sprites:** the "hooded hacker" and "spy" character sprites are not used for anyone in the course (`research/current_state_break_escape.md`, "Art").

### 5.5 Reading age and plain English

- **Target:** a reading age of about 11 to 12 in core modules (design principle 9). WCAG's AAA criterion 3.1.5 (lower secondary education, 7 to 9 years of school) is the outer limit for any text.
- **GOV.UK's content rules,** which the course follows:
  - "Plain English is mandatory for all of GOV.UK";
  - split sentences over 25 words;
  - no more than 5 sentences a paragraph.
- **Negative contractions.** GOV.UK also notes that many users misread negative contractions ("shouldn't", "can't"), so instructions and reference cards say "do not" and "cannot"; natural contractions are fine in speech.
- **Spoken lines stay under 30 words.** The dialogue lint flags longer ones.
- **Explain or avoid jargon.** Explain a technical term the first time, or avoid it; one definition per term across the course (EX-07, with tooltips that work by keyboard and touch, WCAG 1.4.13).
- **Instructions are literal:** no idioms, metaphors or sarcasm. Characters can joke; the instruction is always plain (British Dyslexia Association, advice on dyslexia-friendly training).
- **Inclusive terms:**
  - "allow list" and "deny list", as the NCSC adopted in 2020 ("Terminology: it's not black and white");
  - no ableist idioms ("blind spot", "falling on deaf ears", "crazy").
- **How it is checked:** the proposed plain English lint flags long sentences and hard words for a human to judge, and playtests include people with low literacy (section 6).

### 5.6 Player identity: avatars and names

- **Avatars:** a course set of 8 to 12 office avatars:
  - ages from 20s to 60s, a range of skin tones;
  - head coverings (hijab, turban), a wheelchair user, hearing aids, glasses;
  - described by appearance, not labelled "male" or "female";
  - no default that is a hooded hacker.
- **Names:**
  - The name field accepts only `[a-zA-Z0-9_ ]`, 1 to 20 characters (`player_preference.rb`, lines 61 to 62), so Siobhán, O'Neill, Anne-Marie and Wiśniewski can't be typed.
  - Allow letters from any script, apostrophes, hyphens and spaces, and a longer limit.
  - The name never appears in a voiced line (`AGENTS.md`).
- **Gender:** the course never asks for it, and has no need to, because nobody refers to the player in the third person (5.1).

### 5.7 Neurodivergent learners

- **Literal and predictable:** literal instructions, a predictable structure (the seven beats are always in the same order), and a clear end to each beat.
- **No trick questions** ("no gotchas" is already a design rule).
- **Sensory controls:** music, ambience, voice and motion, with no sudden loud sounds (BE-21).
- **The text route** for anyone who finds a busy 2D world tiring.

### 5.8 Reviews

Every module's game design, ink and art brief is reviewed against this section. Recommendation: add a short inclusion check to `docs/agents/AWARENESS_REVIEW_BRIEF.md` (a course-level change for the orchestrator).

## 6. Testing

Three layers: automated checks on every change, manual checks on every module, and testing with disabled people at set points. GOV.UK's Service Manual is blunt about the first: "you'll miss some issues if you only do automated testing" ("Testing for accessibility", updated 29 October 2024).

### 6.1 Automated checks, on every change

- **axe-core with Playwright** on every HTML surface: the game shell, every course minigame (opened through the test bridge, `window.__test`, which is available outside production), the text route, the debrief, the intranet, settings, the title and end screens, and Hacktivity's learner pages. Run the WCAG 2.0, 2.1 and 2.2 A and AA rules, and fail the build on any violation. This is the proposed "Accessibility checks in CI" item in `break_escape_engine.md`.
- **Contrast** of every colour token in the dark, light and high-contrast themes, as a node test.
- **CSS lint:** no `outline: none` without a replacement focus style, and every animation or transition under a reduced-motion guard.
- **Content checks:**
  - the dialogue lint (voiced variables, spoken line length);
  - the proposed plain English lint;
  - the BE-03 route parity check;
  - validator checks that every visual aid has alt text and step descriptions, every information-carrying sound has caption text, and every page sets `lang`.
- **Flash analysis:** a screen recording of each animated or flashing effect used in a course module (tube strikes in the room with the most panels, rack LEDs, title and screen transitions), analysed with the Harding FPA test, re-run when lighting or effects change.

### 6.2 Manual checks, on every module

- **Keyboard:** a full run with the keyboard only, in both routes.
- **Screen readers:** the GOV.UK Service Manual's minimum combinations ("Testing with assistive technologies", reviewed 24 May 2022):

  | Assistive technology | Browser |
  |---|---|
  | JAWS | Chrome or Edge |
  | NVDA | Chrome, Firefox or Edge |
  | VoiceOver on iOS | Safari |
  | TalkBack | Chrome |
  | Windows Magnifier or Apple Zoom | Any |
  | Dragon | Chrome |

  Plus the Manual's further suggestions: VoiceOver on macOS with Safari, ZoomText, and Windows High Contrast mode. The text route gets the full matrix; the game gets the shell, conversations, minigames and places list.
- **Zoom and spacing:** 200% text size, 400% browser zoom, a 320 CSS pixel viewport, and the WCAG text spacing overrides.
- **Motion and colour:** reduced motion and flicker off; forced colours mode; colour vision deficiency emulation.
- **Sound:** sound off (captions only) and voices off.
- **Time:** timers off, and the slowest time scale.
- **Touch:** touch only, on a phone, with large text.
- **Plain English:** a read-through of every instruction against section 5.5 by someone who did not write it.

### 6.3 Testing with disabled people

The same Service Manual page says to "test the service with disabled users and with older users". Automated and expert checks find barriers; only users find out whether the course works for them.

- **Who:**
  - screen reader users; people with low vision who use magnification;
  - Deaf and hard of hearing people, including British Sign Language users;
  - people with motor impairments who use switches, voice control or one hand;
  - people with dyslexia and with learning disabilities;
  - autistic people and people with ADHD; people with anxiety, since mandatory training can be stressful;
  - older staff; people with low literacy; people reading English as an additional language.

  Photosensitive epilepsy is never tested on people; it is covered by analysis (6.1), as XAG 118 recommends.
- **When:**
  1. the text route prototype and the BE-04 shell, with core_00 and core_01, before the MVP is built out;
  2. the MVP modules before the first pilot;
  3. each new kind of minigame (MG-01, MG-20 and the rest);
  4. every year with the annual edition.
- **How:**
  - small rounds, about five to eight people per round across different needs, repeated rather than one large study;
  - recruitment through disability organisations or a specialist recruiter, and participants paid for their time;
  - informed consent and data protection, and materials in accessible formats;
  - participants use their own devices and settings;
  - sessions of an hour at most, with breaks;
  - observe rather than help, record each finding against the WCAG criterion or guideline it breaks and its severity, fix it, and retest.
- **Afterwards:** an accessibility feedback link in settings and in the statement keeps the conversation going (Game Accessibility Guidelines: "Solicit accessibility feedback").

### 6.4 Independent audit

Before the MVP is sold, an independent WCAG 2.2 AA audit of the platform's learner pages, the text route and the game shell for the MVP modules. It feeds the conformance report and the statement (section 7). Repeat it every year and after any major change to the interface.

### 6.5 In the existing review loops

Add the automated checks to the verification steps in `AGENTS.md` for course modules, add a keyboard-only persona and a text-route persona to the playtest skill's runs, and log accessibility findings in the pass log like any other finding. Browser agents can check structure, names and focus through the test bridge; they cannot replace people using real assistive technology (6.3).

## 7. Accessibility statement

A public accessibility statement, written in plain English, kept current, and easy to find. Public sector customers must publish their own statements (regulation 8); ours gives them what they need for theirs.

**Where it appears:**

- the footer of every Hacktivity page;
- the game's settings panel and title screen;
- the text route page;
- the footer of the HacktivityLabSheets site;
- the course's public pages.

**What it says,** following GOV.UK's sample statement (updated 30 September 2024) and the W3C's guidance on statements:

1. **What it covers** (Hacktivity's learner pages, the course modules and their text routes, the lab sheet pages) and a commitment to accessibility.
2. **The standard:** WCAG 2.2 AA, with EN 301 549 and Section 508 for EU and US buyers.
3. **The compliance status,** in the wording the GOV.UK sample sets out (fully, partially or not compliant), so public sector customers can reuse it.
4. **What learners can do,** in plain words: change text size, fonts, contrast, motion, captions and timers; use the text route; play without sound; take as long as they need. This answers the Game Accessibility Guidelines' "Provide details of accessibility features ... on packaging and/or website" and XAG 121.
5. **Known limitations,** each named by WCAG criterion with a date for the fix. For example: "The 2D game world is only partly usable with a screen reader; every module has a text version with the same content and the same record."
6. **Disproportionate burden:** none claimed. The plan is to fix, not to claim.
7. **Getting content in another format, and reporting a problem:** a contact address, what to include, and a stated response time.
8. **The enforcement procedure,** for customers' UK public sector statements, worded as in the GOV.UK sample.
9. **How it was tested:** the browsers and assistive technology covered, the methods (automated, manual, user testing, independent audit), when, and by whom.
10. **The date** it was prepared and last reviewed. Review at least once a year and with every release that changes the interface.

**Alongside the statement:**

- **An Accessibility Conformance Report** on the INT edition of VPAT 2.5Rev, which covers Section 508, EN 301 549 and WCAG 2.2 in one document, updated with each major release.
- **A one-page accessibility features guide** for learners and administrators.
- **A customer pack:** suggested wording for the customer's own statement, and how to grant individual adjustments such as extra time, an exemption from a timed element, or a facilitated session (HA-03, HA-13).

## 8. Platform and lab sheet fixes (HA-23)

HA-23 is the WCAG 2.2 AA pass over Hacktivity's learner pages and the HacktivityLabSheets theme. The lab sheet pages matter to this course because the reference cards' longer field guides and the facilitator notes live there, and The Lark can open them inside the game (BE-09).

### 8.1 HacktivityLabSheets theme

The issues listed in `research/current_state_lab_sheets.md`, confirmed in the HacktivityLabSheets theme in October 2026 (described here at the level of the defect, not the internal source location):

| Problem | Where | Fix | WCAG |
|---|---|---|---|
| Focus outlines removed from links and buttons | The lab theme stylesheet (an `outline: none` reset on focused links and buttons) | Remove the rule; add a `:focus-visible` outline at least 2 CSS pixels thick with 3:1 contrast in both themes | 2.4.7 |
| The theme toggle has no accessible name (an icon only) | The lab page header's theme toggle | A label that says what it does ("Switch to light theme"), updated when the theme changes; the icon hidden from assistive technology. The contents toggle beside it already does this right | 4.1.2 |
| YouTube iframes have no title | The lab page's embedded video iframes | Set the iframe's `title` from the link text, and keep a plain link to the video below it | 4.1.2 |
| Callout labels removed on render, leaving only an emoji or a colour | The lab layout's callout rendering: inline callouts (`==tip: ...==` and the others) become an emoji and the text, and blockquote callouts lose "Tip:", "Action:", "Warning:" and "Note:" | Keep the word as visible text ("Tip:"), and hide the emoji from assistive technology; the icon and colour stay as extras | 1.1.1, 1.3.1, 1.4.1 |
| No skip link | The default page layout | A "Skip to content" link as the first focusable element | 2.4.1 |
| No reduced-motion handling | Transitions and a hover zoom on embedded videos in the lab layout | A `prefers-reduced-motion: reduce` block that removes transitions and transforms | Course commitment (4.7) |
| Most images have no alt text (most lab images use an empty `![]`, a minority have alt text) | The lab content pages | Alt text for every informative image (step screenshots, diagrams); decorative images stay empty on purpose; a check that fails new awareness pages with an unexplained `![]` | 1.1.1 |
| Collapsible sections are unstyled | `<details>` in lab pages | A styled summary with a visible focus and an open or closed marker that is not colour alone | 2.4.7, 1.4.1 |
| Print styles are minimal | Theme stylesheet | Print styles so a reference card or field guide prints cleanly | Course need (BE-09) |

Two smaller points: the site sets `lang="en"` (`_layouts/default.html`, line 2), which meets WCAG; `en-GB` is better for UK English pages. When the game opens a lab sheet it should add `?embedded`, so the sheet's own header doesn't appear inside the game's popup (BE-09).

### 8.2 Hacktivity's learner pages

A feature-level summary of what HA-23 covers on the platform, as found in October 2026 (details are for `features/hacktivity.md`):

- **Page basics:** set the page language, and add a skip link to the main layout.
- **Sign-in:**
  - give the one-time token field a visible label, not only placeholder text;
  - mark the token field and the password field so browsers and password managers can fill them;
  - allow pasting;
  - WCAG 3.3.8 names password manager support and copy and paste as ways to make a sign-in test accessible, and single sign-on (HA-02) removes the test for most staff.
- **Session timeouts:** warn before a session times out and offer to extend it (WCAG 2.2.1).
- **Learner home and course pages** (HA-17): the same keyboard, focus, contrast and reduced-motion standard as the per-event progress page, which `research/current_state_hacktivity.md` notes is already well built (screen reader labels, focus handling, AA contrast and reduced motion). That page is the model for the rest.
- **The accessibility statement** linked from every page (section 7).

## Sources

All checked in October 2026.

**Law and regulation**

- Equality Act 2010, sections 20, 29 and 39, Schedule 2 paragraph 2 and Schedule 8 paragraph 2: https://www.legislation.gov.uk/ukpga/2010/15/contents
- The Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018 (SI 2018/952), regulations 1, 3, 4, 6, 9 and 12: https://www.legislation.gov.uk/uksi/2018/952/contents
- GOV.UK, "Understanding accessibility requirements for public sector bodies" (updated 30 September 2024): https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps
- GOV.UK, "Sample accessibility statement" (updated 30 September 2024): https://www.gov.uk/government/publications/sample-accessibility-statement
- US Access Board, ICT accessibility standards (Section 508): https://www.access-board.gov/ict/
- Information Technology Industry Council, VPAT (version 2.5Rev, April 2025): https://www.itic.org/policy/accessibility/vpat

**Standards and guidelines**

- W3C, Web Content Accessibility Guidelines (WCAG) 2.2, W3C Recommendation, 12 December 2024: https://www.w3.org/TR/WCAG22/
- W3C, Understanding 1.4.10 Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- W3C, Understanding 3.1.5 Reading Level: https://www.w3.org/WAI/WCAG22/Understanding/reading-level.html
- W3C WAI, "Developing an Accessibility Statement": https://www.w3.org/WAI/planning/statements/
- CEN, CENELEC and ETSI, EN 301 549 V4.1.1 (2026-09), "Accessibility requirements for ICT products and services": https://www.etsi.org/deliver/etsi_en/301500_301599/301549/04.01.01_60/en_301549v040101p.pdf
- Game Accessibility Guidelines (basic guidelines): https://gameaccessibilityguidelines.com/basic/
- Microsoft, Xbox Accessibility Guidelines, version 3.2 (8 June 2023): https://learn.microsoft.com/en-us/gaming/accessibility/guidelines; XAG 104, subtitles and captions: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/104; XAG 118, photosensitivity: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/118
- Trace Center, Photosensitive Epilepsy Analysis Tool (PEAT), including its terms of use: https://trace.umd.edu/peat/

**Testing and writing**

- GOV.UK Service Manual, "Testing for accessibility" (updated 29 October 2024): https://www.gov.uk/service-manual/helping-people-to-use-your-service/testing-for-accessibility
- GOV.UK Service Manual, "Testing with assistive technologies" (reviewed 24 May 2022): https://www.gov.uk/service-manual/technology/testing-with-assistive-technologies
- GOV.UK content guidance, "Use clear language": https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/
- British Dyslexia Association, "Dyslexia friendly training": https://www.bdadyslexia.org.uk/advice/employers/creating-a-dyslexia-friendly-workplace/dyslexia-friendly-training

**Who the course serves, and inclusive content**

- Department for Work and Pensions, Family Resources Survey 2024 to 2025 (published 26 March 2026): https://www.gov.uk/government/statistics/family-resources-survey-financial-year-2024-to-2025/family-resources-survey-financial-year-2024-to-2025
- Colour Blind Awareness, "Colour blindness": https://www.colourblindawareness.org/colour-blindness/
- OpenIDEO with the William and Flora Hewlett Foundation, Cybersecurity Visuals Challenge (2019): https://www.openideo.com/challenge-briefs/cybersecurity-visuals
- NCSC, "Terminology: it's not black and white" (30 April 2020): https://www.ncsc.gov.uk/blog-post/terminology-its-not-black-and-white
