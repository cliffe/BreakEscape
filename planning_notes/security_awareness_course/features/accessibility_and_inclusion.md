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
| "Provide separate volume controls or mutes for effects, speech and background / music" | Exists (Music, SFX, Voice, Master); labels to fix (4.2) |
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
- **It counts the same.** Completion, the knowledge check, certificates and dashboards treat the text route exactly as the game. The record shows the route only so the organisation can see how the course is taken.
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

<!-- next-section -->
