# Minigames (MG)

New minigames for the awareness course, and how the existing Break Escape minigames are reused. The ids MG-01 to MG-25 come from `features/README.md` and are fixed: modules cite them. This document says what each one is, how it plays, how it is configured, what it records and what it builds on.

Read it with `features/README.md` (the catalogue), `01_LEARNING_DESIGN.md` (the seven beats), `modules/core_01_phishing_email/` (the model module, which uses MG-01, MG-03 and MG-20), `research/current_state_break_escape.md` and the framework in `public/break_escape/js/minigames/framework/`. Here `JS/` means `public/break_escape/js/`.

The "Used for" lists come from the model module and `docs/agents/AWARENESS_MODULE_SEEDS.md`; each module's own plan has the final word. Outcome and behaviour ids are real for core_01 (`C01-LO2`, `C01-B1`) and placeholders for other modules (`C03-Bx`) until their `assessment.md` exists.

## 1. Introduction

### Design principles

1. **Teach one idea per step.** The model is the fingerprint minigame (`JS/minigames/dusting/`), which the user liked more than the old version (`docs/IDEAS_BACKLOG.md`, Minigames). It has five named steps (find, powder, dust, lift, compare), a one-line fact under each step and a one-sentence reason after every wrong choice (`dusting-game.js:33-52`), and nothing in it can fail. Awareness minigames copy that shape: a visible step list where the task has stages (redaction, payment checks, the MFA set-up), one fact per step, and a reason for every wrong choice. Where the real tool has no steps (an inbox), the practice mode adds them and the mission mode takes them away.
2. **Fun, not fiddly, and not hard.** `AGENTS.md`: "Minigames should be fun and educational, not hard." The challenge is the judgement, never the controls: big targets, no pixel hunting, no precise dragging, no fail screens. Every work task can be finished whatever the player did; mistakes play out as consequences and are explained. Small pleasures matter: Kai's thanks in the team chat, a stamp on a reported email, a streak in a drill, ordinary work emails with some humour in them.
3. **Realistic enough to transfer, never a copy of a brand.** The interfaces follow the patterns of tools staff use every day (a three-pane mail client, an address bar, a share dialog with "specific people" and "anyone with the link", a push prompt with number matching) so the habit carries over to their real tools. No real logos, product names or page designs. Where it matters, names come from the organisation profile (BE-05): the Report button carries the label and position of the learner's own mail client.
4. **Accessible by default.** Every minigame is an HTML overlay that meets WCAG 2.2 AA (see `features/accessibility_and_inclusion.md`):
   - keyboard operable, with visible focus and the main actions on single keys;
   - screen reader friendly: the overlay is a dialog with a heading, focus moves in when it opens and back to the world when it closes, state changes are announced in a polite live region (the dusting minigame already does this), controls have names, and nothing depends on hover alone;
   - every drag has a single-pointer alternative (SC 2.5.7) and targets are at least 24 by 24 CSS pixels (SC 2.5.8);
   - colour is never the only signal, text resizes to 200% and contrast meets AA;
   - nothing moves, flashes or makes a sound without a way to stop it, and `prefers-reduced-motion` is honoured;
   - toasts never cover the minigame or the focused control (SC 2.4.11; the backlog already records toasts sitting over minigame overlays);
   - each minigame's data can be shown by the text route (BE-03) with the same decisions and the same records.
5. **No required speed unless it's optional.** Nothing is scored on reaction time. Real-time timers are off by default and appear only as an optional challenge in drills (SC 2.2.1). Story deadlines ("the schedule by 10:00") add realism and can't be failed. When a rating depends on "how soon", it's measured in story events (before the next email arrived, before Ama came over), not real minutes, because the game clock runs on wall time (`JS/systems/game-clock.js`) and would penalise slow readers and screen reader users.
6. **Feedback depends on the beat.** In Practise, feedback is immediate: the clue highlighted, the right route and one line of why. In Apply there is no feedback beyond what happens in the story, and the debrief (BE-02) explains. In the Check, each answer gets per-option feedback. This follows "Practise before Apply" in `01_LEARNING_DESIGN.md`.
7. **No blame, no gotchas.** Wrong choices are framed as common ("that one fools lots of people") and followed by what to do. Over-reporting is never rated Not yet. Every threat in an assessed minigame can be caught with what the module taught.
8. **Never ask for real credentials or real personal data.** Fake sign-in pages come pre-filled with the in-game account and have a Sign in button; their password fields can't be typed into. The passphrase builder uses in-game word tiles, not free typing. Learners never type an email body, a report narrative or an AI prompt that gets stored: free text, where offered, is optional, unscored and stays in the browser. Names, domains and phone numbers are fictional.
9. **Every meaningful action emits an event, and every assessed one a BE-01 record.** "Meaningful" means a decision (report, sign in, approve, share), a check (opening sender details, reading where a link goes, calling back) or progress on the work task. Pointer movement and scrolling are not recorded.
10. **Configured from scenario data, with content from banks.** Nothing course-specific is written into the code: titles, labels, items, ratings and side effects come from `minigameData` and from banks (BE-13). Several existing minigames can't be reused in a new setting because a header or a global name is fixed in code (section 4). The new ones must not repeat that.

### The common contract

What every new minigame does, so modules can be written against the minigames before they exist.

**Framework fit.** Each new minigame:

- extends `MinigameScene` (`JS/minigames/framework/base-minigame.js`), lives in `JS/minigames/<name>/` with its stylesheet in `public/break_escape/css/<name>-minigame.css`, and is registered in `JS/minigames/index.js`;
- has a starter in `JS/systems/minigame-starters.js` that reads the object's `minigameData` (like `startShreddedDocumentMinigame`, `minigame-starters.js:879-909`), and an object `type` dispatched in `JS/systems/interactions.js` (like `forensic_data_platform`, `interactions.js:1153-1164`);
- declares its keys in `scripts/minigame-data-schemas.json`, which `scripts/validate_scenario.rb` checks;
- overrides `getTestState()` (`base-minigame.js:158-229`) so the `window.__test` bridge (`JS/systems/test-bridge/minigames.js`) and the playtest skill can drive it;
- runs side effects through the shared action executor, `applyActions` in `JS/systems/apply-actions.js` (`set_global`, `emit_event`, `complete_task`, `unlock_object`, `give_item`, `hint` and others), rather than its own copy;
- sets `requiresKeyboardInput: true` when it has text fields (`minigame-manager.js:29-52`), so typing doesn't walk the player about;
- can hand control back to the conversation that opened it, using the `window.pendingConversationReturn` pattern in `JS/minigames/rfid/rfid-minigame.js:472-506`, which BE-19 needs;
- keeps its rules (scoring, draws, rating) in a DOM-free module with node tests in `test/js/`, as `command-board/command-board-timeline.js` does.

**Ways in.** One configuration opens a minigame four ways: clicking an object in the world; from ink or an event (BE-19, which replaces the `#trigger_minigame` stub at `JS/minigames/helpers/chat-helpers.js:185-196`); as a stand-alone drill (BE-07); and as text (BE-03). An ink tag can't carry a whole configuration, so we propose named configurations at the scenario level, `"minigameConfigs": { "inbox_main": { "type": "mail_client", "minigameData": { } } }`, which objects and tags both refer to by id. That is a decision for BE-19.

**Modes.** `practice` (immediate feedback, a hint after 15 seconds without progress as in `dusting-game.js:35`, retries), `mission` (no feedback beyond consequences), `drill` (BE-07: random content, a results screen, an optional timer) and, for MG-20 only, `check`.

**Events.** Sent through `window.eventDispatcher` (`JS/systems/npc-events.js`) in the engine's existing `noun_verb:id` form (`door_unlocked`, `item_picked_up:key`, `conversation_closed:<npcId>`), with one prefix per minigame so a listener can take them all with the existing `prefix*` wildcard (for example `email_*`). The payload is `{ sceneType, itemId, action, mode, gameTime, details }`. Events drive NPC event mappings (Kai's thank-you), timers, tasks and BE-01. The base class's `minigame_completed` and `minigame_failed` still fire; they should also carry `sceneType`, because `minigameName` is only the class name (`base-minigame.js:96-105`).

**Records.** For each assessed item the minigame hands BE-01 a decision record: the minigame and the item (with the bank item's version), the actions that matter in order, the rating from the item's `assess` block, the outcome and behaviour ids, the mode, the attempt number and the story events it fell between. BE-01 owns the record format and sends it to the server; HA-05 keeps it. Practice records are marked formative. Never recorded: free text, anything like a password, and accessibility settings against a named person (captions or a "more time" setting can reveal a disability, so they are reported only in aggregate: HA-09, HA-15).

**Ratings in data.** Each assessed item carries an `assess` block: the behaviour id, the outcome ids and a map from actions to Secure, Developing or Not yet. Most items need only the map. A few need short sequence rules, evaluated when the beat ends: core_01's C01-B1 rates "clicks, stops, then reports" as Developing, and C01-B7 asks whether a click was reported soon after. Windows are defined by story events (principle 5).

**Banks and safe content.** Content lives in bank files per module (BE-13). Each item has a stable id, a version and tags (outcome, slot, lever, difficulty, edition, locale, organisation slot). Draws are seeded and the seed goes into the record, so an auditor can see exactly what a learner was shown (HA-19). Scenarios are ERB templates, so per-game draws already work today (`rand`, `.sample`, the helpers in `app/models/break_escape/mission.rb`). Bank text follows the course writing rules and avoids " -- ", which `JS/utils/display-dashes.js` turns into a dash on screen. Every domain must be on the module's checked list of fictional or reserved names; phone numbers come from Ofcom's ranges reserved for drama (for example 07700 900xxx and 0161 496 0xxx: check the current list before use).

**Organisation profile.** On-screen text can hold placeholders (`{org.name}`, `{org.reportButton}`, `{org.serviceDesk}`, `{org.labels.confidential}`) filled from BE-05. Voiced lines never contain them.

**Saving.** Each minigame saves its progress as a per-player section in `JS/state-sync.js`, holding ids and flags only, never message bodies (a keepalive sync is capped at about 60 KB, `state-sync.js:4-5`). A reload then restores the inbox, a half-finished check or a video's position.

**Validation.** `minigame-data-schemas.json` checks only top-level key names. The awareness minigames hold nested data (emails, items, pages), so they need nested schemas, plus content checks in the validator: unique item ids, outcome ids that exist in the module, links to pages that exist, domains on the checked list, and no "--" in bank text.

**Shared building blocks.** Several minigames need the same parts, so they are built once (in a folder such as `JS/minigames/shared/`), starting with MG-20 and MG-01:

- **record and event helpers**: the BE-01 hand-over and the standard payload;
- **one `setGlobalAndNotify`**, replacing the fifteen slightly different copies in existing minigames (section 4);
- **a step list and fact line**, lifted from `dusting-game.js`;
- **a feedback panel**: the verdict, the reason and what to do next, announced to screen readers;
- **an accessible dialog**, replacing browser `confirm()` calls;
- **an address reader** that splits a web or email address and finds the real domain, with a small public suffix list for `.co.uk` and the like (MG-01, MG-02, MG-03, MG-05, MG-06, MG-08);
- **a fake page renderer** for sign-in pages, portals, forms and warnings, built from typed blocks like those in `forensic-data-platform` (MG-01, MG-02, MG-06, MG-14, MG-16);
- **an annotated document**: text spans and image regions that can be highlighted, marked or clicked, shared with BE-08's visual aids (MG-12, MG-16, MG-20 hotspots, MG-25);
- **a seeded bank draw** with coverage rules (MG-01 practice, MG-03, MG-20, MG-25).

<!-- append -->
