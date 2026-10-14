# Minigames (MG)

New minigames for the awareness course, and how the existing Break Escape minigames are reused. The ids MG-01 to MG-25 come from `features/README.md` and are fixed: modules cite them. This document says what each one is, how it plays, how it is configured, what it records and what it builds on.

Read it with `features/README.md` (the catalogue), `01_LEARNING_DESIGN.md` (the seven beats), `modules/core_01_phishing_email/` (the model module, which uses MG-01, MG-03 and MG-20), `research/current_state_break_escape.md` and the framework in `public/break_escape/js/minigames/framework/`. Here `JS/` means `public/break_escape/js/`.

The "Used for" lists come from the model module and `docs/agents/AWARENESS_MODULE_SEEDS.md`; each module's own plan has the final word. Outcome and behaviour ids are real for core_01 (`C01-LO2`, `C01-B1`) and placeholders for other modules (`C03-Bx`) until their `assessment.md` exists.

## 1. Introduction

### Design principles

1. **Teach one idea per step.** The model is the fingerprint minigame (`JS/minigames/dusting/`), which the user liked more than the old version (`docs/IDEAS_BACKLOG.md`, Minigames). It has five named steps (find, powder, dust, lift, compare) and a one-line fact under each step (`dusting-game.js:33-54`), gives a one-sentence reason after a wrong choice (`wrongPowderReason` in `dusting-model.js`), and nothing in it can fail (`dusting-game.js:1-11`). Awareness minigames copy that shape: a visible step list where the task has stages (redaction, payment checks, the MFA set-up), one fact per step, and a reason for every wrong choice. Where the real tool has no steps (an inbox), the practice mode adds them and the mission mode takes them away.
2. **Fun, not fiddly, and not hard.** `AGENTS.md`: "Minigames should be fun and educational, not hard." The challenge is the judgement, never the controls: big targets, no pixel hunting, no precise dragging, no fail screens. Every work task can be finished whatever the player did; mistakes play out as consequences and are explained. Small pleasures matter: Kai's thanks in the team chat, a stamp on a reported email, a streak in a drill, ordinary work emails with some humour in them.
3. **Realistic enough to transfer, never a copy of a brand.** The interfaces follow the patterns of tools staff use every day (a three-pane mail client, an address bar, a share dialog with "specific people" and "anyone with the link", a push prompt with number matching) so the habit carries over to their real tools. No real logos, product names or page designs. Where it matters, names come from the organisation profile (BE-05): the Report button carries the label and position of the learner's own mail client.
4. **Accessible by default.** Every minigame is an HTML overlay that meets WCAG 2.2 AA (see `features/accessibility_and_inclusion.md`):
   - keyboard operable, with visible focus and the main actions on single keys;
   - screen reader friendly: the overlay is a dialog with a heading, focus moves in when it opens and back to the world when it closes, state changes are announced in a polite live region (the dusting minigame already does this), controls have names, and nothing depends on hover alone;
   - every drag has a single-pointer alternative (SC 2.5.7) and targets are at least 24 by 24 CSS pixels (SC 2.5.8);
   - colour is never the only signal, text resizes to 200% and contrast meets AA;
   - it works by touch and in a narrow window: hover always has a focus or press-and-hold equivalent, and layouts reflow (SC 1.4.10), because today's minigames are laid out for desktop (`research/current_state_break_escape.md`);
   - nothing moves, flashes or makes a sound without a way to stop it, and `prefers-reduced-motion` is honoured;
   - toasts never cover the minigame or the focused control (SC 2.4.11; the backlog already records toasts sitting over minigame overlays);
   - each new minigame has an **accessible mode**: plain HTML showing the same data and offering the same decisions, which the text route (BE-03) opens inline and which records exactly what the game version records (`break_escape_engine.md`, BE-03 asks every new minigame for one).
5. **No required speed unless it's optional.** Nothing is scored on reaction time. Real-time timers are off by default and appear only as an optional challenge in drills (SC 2.2.1). Story deadlines ("the schedule by 10:00") add realism and can't be failed. When a rating depends on "how soon", it's measured in story events (before the next email arrived, before Ama came over), not real minutes. Today the game clock runs on wall time with no pause (`JS/systems/game-clock.js`), which would penalise slow readers and screen reader users; BE-04 proposes a pausable clock with a time scale, and BE-03 writes timed rules as sequences, so story events keep both routes and every time scale fair.
6. **Feedback depends on the beat.** In Practise, feedback is immediate: the clue highlighted, the right route and one line of why. In Apply there is no feedback beyond what happens in the story, and the debrief (BE-02) explains. In the Check, each answer gets per-option feedback. This follows "Practise before Apply" in `01_LEARNING_DESIGN.md`.
7. **No blame, no gotchas.** Wrong choices are framed as common ("that one fools lots of people") and followed by what to do. Over-reporting is never rated Not yet. Every threat in an assessed minigame can be caught with what the module taught.
8. **Never ask for real credentials or real personal data.** Fake sign-in pages come pre-filled with the in-game account and have a Sign in button; their password fields can't be typed into. The passphrase builder uses in-game word tiles, not free typing. Learners never type an email body, a report narrative or an AI prompt that gets stored: free text, where offered, is optional, unscored and stays in the browser. Names, domains and phone numbers are fictional.
9. **Every meaningful action emits an event, and every assessed one a BE-01 record.** "Meaningful" means a decision (report, sign in, approve, share), a check (opening sender details, reading where a link goes, calling back) or progress on the work task. Pointer movement and scrolling are not recorded.
10. **Configured from scenario data, with content from banks.** Nothing course-specific is written into the code: titles, labels, items, ratings and side effects come from `minigameData` and from banks (BE-13). Several existing minigames can't be reused in a new setting because a header or a global name is fixed in code (section 4). The new ones must not repeat that.

### The common contract

What every new minigame does, so modules can be written against the minigames before they exist.

**Framework fit.** Each new minigame:

- extends `MinigameScene` (`JS/minigames/framework/base-minigame.js`), lives in `JS/minigames/<name>/` with its stylesheet in `public/break_escape/css/<name>-minigame.css`, and is registered in `JS/minigames/index.js`;
- has a starter in `JS/systems/minigame-starters.js` that reads the object's `minigameData` (like `startShreddedDocumentMinigame`, `minigame-starters.js:879-909`), and an object `type` dispatched in `JS/systems/interactions.js` (like `forensic_data_platform`, `interactions.js:1153-1163`);
- declares its keys in `scripts/minigame-data-schemas.json`, which `scripts/validate_scenario.rb` checks;
- overrides `getTestState()` (`base-minigame.js:158-229`) so the `window.__test` bridge (`JS/systems/test-bridge/minigames.js`) and the playtest skill can drive it;
- runs side effects through the shared action executor, `applyActions` in `JS/systems/apply-actions.js` (`set_global`, `emit_event`, `complete_task`, `unlock_object`, `give_item`, `hint` and others), rather than its own copy;
- sets `requiresKeyboardInput: true` when it has text fields (`minigame-manager.js:29-52`), so typing doesn't walk the player about;
- registers a launcher with BE-19's registry (`JS/systems/minigame-launchers.js`, proposed in `break_escape_engine.md`), so ink and actions can open it, and hands control back to the conversation that opened it (BE-19's "close, run, return", built on the `window.pendingConversationReturn` pattern in `JS/minigames/rfid/rfid-minigame.js:472-506`);
- ships an accessible mode for the text route (principle 4);
- keeps its rules (scoring, draws, rating) in a DOM-free module with node tests in `test/js/`, as `command-board/command-board-timeline.js` does.

**Ways in.** One configuration opens a minigame four ways: clicking an object in the world; from ink or an event (BE-19, which replaces the `#trigger_minigame` stub at `JS/minigames/helpers/chat-helpers.js:185-196`); as a stand-alone drill (BE-07); and as text, through the accessible mode (BE-03). BE-19 keeps named configurations at the scenario level (`"minigameConfigs": { "q_phish_ask": { "minigame": "knowledge_check", "data": { "item": "C01-Q1" } } }`) and opens them with `#trigger_minigame:<minigame>|<configKey>` or an `open_minigame` action. So every new minigame accepts the same keys whether they arrive as an object's `minigameData` or as a named configuration's `data`, and the examples below work in either place.

**Modes.** `practice` (immediate feedback, a hint after 15 seconds without progress as in `dusting-game.js:35`, retries), `mission` (no feedback beyond consequences), `drill` (BE-07: random content, a results screen, an optional timer) and, for MG-20 only, `check`.

**Events.** Sent through `window.eventDispatcher` (`JS/systems/npc-events.js`) in the engine's existing `noun_verb:id` form (`door_unlocked`, `item_picked_up:key`, `conversation_closed:<npcId>`), with one prefix per minigame so a listener can take them all with the existing `prefix*` wildcard (for example `email_*`). The payload is `{ sceneType, itemId, action, mode, gameTime, details }`. Events drive NPC event mappings (Kai's thank-you), timers, tasks and BE-01. The base class's `minigame_completed` and `minigame_failed` still fire; they should also carry `sceneType`, because `minigameName` is only the class name (`base-minigame.js:96-105`).

**Records.** BE-01 owns the record (`break_escape_engine.md`). Minigames report a behaviour id and an **option** (what the player did, such as `reported` or `signed_in`), never a rating: through `window.assessment.record({ behaviour, option, source })` or a declarative `assess` block in their configuration. The server rates each option from the module's own `assessment` map, so a rating can't be set in the browser. The `source` carries the minigame, the item and its bank version, and the mode; practice records are marked formative. MG-20 writes BE-01's `check_item` and `check_result` kinds. Free text and anything like a password are never recorded. Accessibility settings (captions, "more time") are never tied to a named person in a record or a report, because they can reveal a disability; they are counted only in aggregate (HA-09, HA-15).

**Options in data.** An item's `assess` block names the behaviour and maps the minigame's actions to that behaviour's options (`"onAction": { "reported": "reported", "signed_in": "signed_in" }`). Most items need only the map. A few need short sequence rules that turn a run of actions into one option, checked when the behaviour closes (BE-01's `unanswered.closeOn` event): core_01's C01-B1 has "clicks, stops, then reports" (Developing) and "signs in and doesn't report before Ama arrives" (Not yet), and C01-B7 asks whether a click was reported soon after. Windows are defined by story events such as `ama_arrives`, not minutes (principle 5). Where this document says an action is Secure or Not yet, that is what the module's map would say; the minigame only reports the option. MG-01's example in section 3 shows both forms.

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

## 2. Summary

Wave is the build wave in section 5 (0 foundations, 1 the MVP course, 2 the core library and first role paths, 3 the rest).

| Id | Minigame | Priority | Size | Main modules | Builds on | Wave |
|---|---|---|---|---|---|---|
| MG-01 | Inbox | MVP | L | core_00, core_01, core_04, core_05, core_06, core_07, core_11, core_13, core_16, core_17, role_02, sector_01 | `phone-chat` threads and timed messages, scenario timers, `notes` markdown, `container` desktop | 1 |
| MG-02 | Web browser | P2 | L | core_08; pages for core_01, core_07, core_09, core_13 | MG-01's page renderer, `forensic-data-platform` blocks, `lab-workstation` | 2 |
| MG-03 | Link and domain drill | P2 (inline part MVP) | S | core_01, core_08, core_02, drills | address reader, MG-20 hotspot, dusting step list | 1 inline, 2 drill |
| MG-04 | Voice calls | P2 | M | core_02, core_11, core_15, core_01, core_05, core_07, core_08, core_09, role_01, role_02, role_03, role_05, role_06, sector_01 | `phone-chat`, `person-chat`, TTS | 2 |
| MG-05 | Messaging apps | P2 | S | core_02, core_00, core_01, core_03, core_04, core_09, core_11, core_12, core_14, core_15, role_06 | `phone-chat` | 2 |
| MG-06 | QR code scanner | P2 | S | core_02, core_17 | `examine`, MG-05, page renderer | 2 |
| MG-07 | MFA prompts and authenticator | MVP | M | core_03, core_00, core_04, core_14, core_17 | `pin`, `phone-chat`, game clock | 1 |
| MG-08 | Password manager and passphrase builder | MVP | M | core_03, core_00, core_17 | `password`, page renderer | 1 |
| MG-09 | Incident report form | MVP | S | core_04, core_05, core_09, core_10, core_14, core_17 | `coverage-decision-form` | 1 |
| MG-10 | Classification sorter | P2 | S | core_06, core_17 | MG-20 sort item, `warranty-checklist` | 2 |
| MG-11 | Sharing settings | P2 | S | core_06, core_13 | `coverage-decision-form`, `warranty-checklist` | 2 |
| MG-12 | Redaction | MVP | M | core_05, core_06 | annotated document, `text-file`, `notes` | 1 |
| MG-13 | Social media profile and OSINT board | P3 | M | core_12; the board in core_11's alternative concept | MG-05, BE-10, BE-11 | 3 |
| MG-14 | Wi-Fi and VPN picker | P3 (P2 proposed) | S | core_09 | MG-23, page renderer | 2 |
| MG-15 | Payment verification desk | P2 | M | core_11, role_02 | MG-25, MG-04, `dual-auth`, `forensic-data-platform` | 2 |
| MG-16 | AI assistant chat | P2 | M | core_15, role_04 | `phone-chat` layout, annotated document, page renderer | 2 |
| MG-17 | Caller verification desk | P3 | M | role_03, role_06, sector_01 | MG-04, `siem`, `log-filter` | 3 |
| MG-18 | Access review | P3 | S | role_05, role_03, role_07 | `warranty-checklist` | 3 |
| MG-19 | Code review | P3 | M | role_04 | `log-filter` | 3 |
| MG-20 | Knowledge check | MVP | M | every module | `coverage-decision-form`, `flag-station` server checks, m01's ink quiz | 0 |
| MG-21 | Video player | P2 | M (first version S) | EX-02 and EX-03 videos: so far core_00, core_01, core_03, core_05, core_07, core_09, core_11, role_01 | `lab-workstation`, `person-chat` frame | 2 |
| MG-22 | Supplier assessment | P3 | S | role_07 | `warranty-checklist`, `forensic-data-platform`, MG-25 | 3 |
| MG-23 | Device settings | P2 | S | core_07, core_09, core_17 | `container` desktop, `phone-chat` phone frame | 2 |
| MG-24 | Crisis decision board | P2 | M | role_01, core_17 team mode | `command-board`, `backup-recovery` | 2 |
| MG-25 | Document inspector | P2 | M | core_10, core_11, role_02, role_05, role_06, role_07 | `forensic-data-platform`, `examine`, dusting compare step | 2 |

## 3. The new minigames

### MG-01 Inbox

**Priority and size:** MVP, L. The largest single build in the course and the most reused. Folder `JS/minigames/inbox/`, scene `inbox`, object type `mail_client` (set on the player's PC or laptop). It is built in four slices (section 5) so core_00 and core_01 can start before compose is finished.

**Used for:**

- **core_01**, the whole module: the hook phish, the "Phish or Fine?" practice, the Apply beat with scheduled threats among ordinary work, and Leo's slip. Outcomes C01-LO1 to C01-LO6; behaviours C01-B1 to C01-B9.
- **core_00:** one "welcome to Larkspur, confirm your bank details for payroll" phish to report.
- **core_04:** signs of a taken-over account: sent items the player didn't send, a new inbox rule, a password reset they didn't ask for.
- **core_05:** a subject access request arriving by email; a file sent to the wrong Sam (compose with recipient checks).
- **core_06:** autocomplete offering "Martin Fletcher (personal)"; Bcc for a group; a Confidential attachment that should go by the secure route.
- **core_07:** an invoice attachment that asks to "enable content".
- **core_11:** the bank detail change from a lookalike Northbeck address, handed on to MG-15.
- **core_13:** the temptation to forward work to a personal account.
- **core_16:** a client's meeting invitation that wants an app installed.
- **core_17, role_02, sector_01:** the capstone's phish and misdirected email; a supplier change mid-run; a phish to a ward's shared mailbox. core_15 touches AI-written phishing.

**What the player does:**

1. **Opens the inbox.** They click their PC, or the inbox opens by itself at a story moment (BE-19). It is a generic three-pane client: folders (Inbox, Sent, Drafts, Deleted), the message list and the reading pane, under a toolbar of Reply, Reply all, Forward, Delete, Move and **Report suspicious** (its label and position from BE-05).
2. **Mail arrives on schedule.** Messages land at set game times, after a story event or when a global changes, with a soft chime and an unread count. With the inbox closed, a notification appears ("New email: Northbeck Supplies") and the PC shows a badge (BE-18). Arrivals wait while the player is writing an email, so a slow reader is never buried.
3. **Reads a message.** The reading pane shows the display name, subject, time, the external sender banner (`{org.externalBanner}`) where it applies, and the body.
4. **Opens the sender details.** Clicking or focusing the sender name opens a card: the display name, the full address with its domain picked out, a reply-to address if it differs, "outside {org.name}", and, where the data says so, a first-contact note ("You don't usually get email from this address") of the kind several real mail clients show.
5. **Checks a link.** Hovering over or focusing a link shows its real destination in a status bar, with the domain emphasised. On touch, press and hold. In practice mode an address reader splits it into parts (MG-03 inline).
6. **Opens an attachment.** An attachment card shows the name, type and size. Opening it shows a preview (a document, a spreadsheet), a prompt to "Enable content" (core_07), or a plain note for unusual types (`.html`, `.zip`, `.iso`).
7. **Follows a link.** A browser panel opens inside the inbox with a fake page: a sign-in page pre-filled with the in-game account (the address shown, the password as dots that can't be edited, a Sign in button), a document portal or a survey. The panel's address bar shows the real domain, and nothing loads from the internet. Signing in is recorded, and the page then says "Document unavailable, try again later", as real kits often do.
8. **Acts.** Report (one click, then a sheet saying what happens next: "Sent to the security team. Thank you."), delete, move, reply, forward, or leave it. In practice mode a **Check another way** button opens the directory, The Lark or a colleague; in a mission, checking another way happens in the world (the phone, the intranet, walking over to someone).
9. **Replies and forwards.** Replying to a phish brings a scripted answer from the "sender" (in core_01's hijacked thread, a reassuring lie). The player never writes free text: bodies are prefilled or picked from two or three options.
10. **Composes with recipient checks.** The compose window has To, Cc and Bcc, autocomplete from the address book (with the scenario's traps: two Sams, a personal address, an outside lookalike), attachments, and a classification label where the organisation uses them. On Send, the data's send checks run. In practice mode they give feedback. In a mission they record the choice and, if the organisation's real client does the same, show its warning ("This recipient is outside {org.name}"). The player can correct and send, send anyway or cancel.
11. **Practice mode ("Phish or Fine?").** One email at a time with three big buttons: **Report**, **Deal with it normally** and **Check another way**. Feedback comes straight away: the clue highlighted in the email, the right route, one line of why, and a streak. A step list above the email (Sender, Links, Request, Decide) gives the routine a shape. No timer unless the player turns one on in a drill.

**What it teaches:** pause and notice what an email asks for and how it makes you feel; check the sender's address, not the display name; read where a link really goes; be wary of attachments that ask you to enable content; report by default, including when unsure and after a click; check another way, through a route the attacker doesn't control; look at who you are sending to. It also teaches calibration: genuine emails get opened, and reporting a genuine one is thanked (C01-B9).

**Configuration:**

- `mode` (`practice`, `mission`, `drill`); `mailbox` (in-game address, folders, signature); `labels` (the Report button, the external banner).
- `emails[]`: `id`, `from {name, address}`, `replyTo`, `to`, `cc`, `subject`, `body` (the `notes` markdown subset), `thread`, `external`, `genuine`, `firstContact`, `links[] {id, text, url, page}`, `attachments[] {id, name, type, size, opens, preview}`, `tags`, `assess`, `onAction`, `feedback` (practice: clue spans, route, why) and `replies`.
- `arrive` on each email: `{ "atStart": true }`, `{ "at": "Mon 09:24" }` (game clock), `{ "after": 90, "startOnGlobal": "schedule_task_started" }`, or `{ "on": "email_reported:hook_mailbox_full" }`.
- `pages{}` for the browser panel: `kind` (`signin`, `portal`, `form`, `download`, `notice`), `domain`, `look`, `prefill`, `afterSubmit`.
- `addressBook[]` (`name`, `address`, `group`, `personal`, `external`); `compose[]` goals (`to`, `mustAttach`, `completesTask`); `sendChecks[]` (`when`, `note`, `assess`).
- `bank` and `draw` (BE-13), using the slots in core_01's Apply table.

```json
{
  "type": "mail_client",
  "name": "Your PC",
  "minigameData": {
    "mode": "mission",
    "mailbox": { "address": "{player.email}", "folders": ["Inbox", "Sent", "Deleted"] },
    "labels": { "reportButton": "{org.reportButton}", "externalBanner": "{org.externalBanner}" },
    "bank": { "file": "content/emails.json", "draw": { "expected_sender": 1, "hijacked_thread": 1, "authority": 1, "callback": 1, "genuine": 6 } },
    "emails": [
      {
        "id": "hook_mailbox_full",
        "arrive": { "atStart": true },
        "from": { "name": "IT Service Desk", "address": "servicedesk@larkspur-support.net" },
        "subject": "Action required: your mailbox is 98% full",
        "body": "Your mailbox is almost full. Re-validate it within 24 hours or new mail will be rejected.",
        "links": [{ "id": "revalidate", "text": "Re-validate mailbox", "url": "https://larkspur.co.uk.account-verify.net/mail", "page": "fake_signin" }],
        "external": true,
        "genuine": false,
        "tags": { "slot": "hook", "levers": ["urgency", "fear"] },
        "assess": {
          "behaviour": "C01-B1",
          "rules": [
            { "if": ["signed_in", "!reported_before:ama_arrives"], "option": "signed_in_unreported" },
            { "if": ["link_clicked", "reported"], "option": "clicked_then_reported" }
          ],
          "onAction": { "reported": "reported", "deleted": "deleted" }
        },
        "onAction": { "reported": [{ "type": "set_global", "key": "hook_reported", "value": true }] }
      },
      {
        "id": "northbeck_schedule",
        "arrive": { "at": "Mon 09:24" },
        "from": { "name": "Dawn, Northbeck Supplies", "address": "dawn@northbeck.co.uk" },
        "subject": "Updated delivery schedule",
        "body": "Morning! Updated schedule attached, as promised. Dawn",
        "attachments": [{ "id": "schedule", "name": "Delivery schedule.xlsx", "opens": "preview", "preview": "content/schedule.md" }],
        "genuine": true,
        "onAction": { "attachment_opened": [{ "type": "complete_task", "taskId": "get_schedule" }] }
      }
    ],
    "pages": {
      "fake_signin": { "kind": "signin", "domain": "larkspur.co.uk.account-verify.net", "look": "larkspur_signin", "prefill": "player_account", "afterSubmit": "unavailable" }
    },
    "addressBook": [
      { "name": "Field Teams", "address": "fieldteams@larkspur.co.uk", "group": true },
      { "name": "Martin Fletcher (personal)", "address": "martin.fletcher@homemail.example", "personal": true }
    ],
    "compose": [{ "id": "send_schedule", "to": ["fieldteams@larkspur.co.uk"], "mustAttach": "schedule", "completesTask": "send_schedule" }],
    "sendChecks": [{ "id": "personal_address", "when": { "recipientTag": "personal" }, "note": "This address is outside {org.name}." }]
  }
}
```

The `assess` block reports options; core_01's `assessment` map rates them (`reported` Secure, `clicked_then_reported` and `deleted` Developing, `signed_in_unreported` Not yet), and its `unanswered.closeOn` writes `ignored` if the player does nothing.

**Events and records:**

- **Events** (prefix `email_`, plus `inbox_opened` and `inbox_closed`): `email_received:<id>`, `email_opened:<id>`, `email_sender_checked:<id>`, `email_link_checked:<id>` (once per link, however often the player hovers) and `email_link_clicked:<id>` (with the link id), `email_attachment_opened:<id>`, `email_content_enabled:<id>`, `email_signin_submitted:<id>`, `email_reported:<id>`, `email_deleted:<id>`, `email_replied:<id>`, `email_forwarded:<id>`, `email_checked_another_way:<id>` (practice), `email_send_check_shown:<checkId>`, and `email_sent:<composeId>` (recipients, attachments, checks hit, corrected or not).
- **Records:** one `decision` per assessed email when its behaviour closes: the option from `assess`, worked out from the first decisive action and everything after it (core_01's "clicks, stops, then reports"), with the source noting whether the sender details or the link were checked first and how many story events passed between arrival and report. In practice, per item: the choice, right or not, and the clue the player missed. For compose: recipients, checks hit, whether the player corrected. These cover core_01's C01-B1 to C01-B9, including the before and after (B1 against B2).

**Builds on:**

- `phone-chat` (`JS/minigames/phone-chat/`): threads, unread badges and saved history (`phone-chat-history.js`). NPC `timedMessages` and their saved delivery state (`JS/systems/npc-manager.js`) are the model for scheduled arrivals.
- Scenario timers and the game clock (`JS/ui/scenario-timer-dispatcher.js`, `JS/systems/game-clock.js`) for `at` and `startOnGlobal` arrivals; `scenarios/timed_messages_example` shows the pattern.
- `notes` markdown (`JS/utils/note-markdown.js`) for bodies; `text-file` for a printed email; the `container` desktop mode (`JS/minigames/container/container-minigame.js:17-23`) as the PC the inbox opens from.
- The shared page renderer, address reader and annotated document (section 1). The same email renderer draws BE-08's annotated hook email in Ama's explanation.
- m01's forged emails with header mismatches (`scenarios/m01_first_contact`), which today are shown as documents.

**Accessibility notes:**

- The message list is a list box: arrow keys move, Enter opens, and each row reads, for example, "Unread. From IT Service Desk. Action required: your mailbox is 98% full. 09:02. External." Unread is shown by weight, a dot and the word.
- Single-key actions with a visible key legend (R reply, F forward, Delete, and the organisation's own Report shortcut where its client has one). Report is also the first toolbar button in tab order.
- Sender details and link destinations open on focus or with a key, not only on hover; a focused link reads "Link: Re-validate mailbox. Goes to account-verify.net."
- New mail is announced politely and never interrupts reading. Arrivals wait during compose and can be spaced out further by BE-04's "more time" setting.
- The accessible mode (BE-03) is a message list: each email as text in the same order as the game shows it (display name first, the address on request), with "Show sender details" and "Check where this goes" as actions and the same choices.
- Narrow screens get a single-pane layout (list, then message), which later doubles as the phone view.

**Art:** a flat, legible mail client in the game's palette with pixel-art icons (the Report flag, a paper clip, file types). Sender avatars are initials on coloured circles, not photos. Fake pages copy Larkspur's own fictional sign-in page or a generic document portal, never a real provider's. A monitor frame around the overlay ties it to the PC sprites (`assets/objects/pc*.png`, `laptop*.png`).

**Open questions:**

1. **A phone view.** Many people read work email on a phone, where hovering doesn't exist. *Recommendation:* desktop first; add the narrow layout inside the phone (MG-05), with press-and-hold link previews, in P2.
2. **What Report does to the email.** *Recommendation:* move it to Deleted with a "Reported" tag, and have Kai thank the player once per beat rather than after every report.
3. **Typing in compose.** *Recommendation:* no free-text bodies. Typing is limited to the recipient field, where autocomplete mistakes are the point.
4. **What follows a fake sign-in.** *Recommendation:* "Document unavailable" rather than an alarming message, so the lesson lands in the story and the debrief, not as a jump scare.

### MG-02 Web browser

**Priority and size:** P2, L. Folder `JS/minigames/browser/`, object type `web_browser` (on a PC), also opened from links in MG-01, MG-05 and MG-06. Most of the page rendering comes from MG-01's panel, which lowers the risk.

**Used for:** core_08, the whole module (search adverts, lookalike download sites, a fake CAPTCHA that wants a pasted command, a tech support scam page, an extension asking for "all your data on all websites", notification spam, browser warnings, the company software portal); core_07 (a fake "browser update" page); core_13 (a free file transfer site, a free online transcription tool); core_09 (a hotel or café sign-in page, with MG-14); core_17.

**What the player does:**

1. Uses a generic browser: tabs, back, an address bar with the domain emphasised (as most browsers do), a padlock that opens a plain note on what it does and doesn't mean, and a bookmarks bar from the organisation profile (The Lark, the software portal).
2. Searches for what the work task needs ("pdf to spreadsheet converter"). Results show the title and the address, and adverts are labelled "Sponsored". The top advert is a lookalike; the real vendor sits lower down.
3. Visits sites: the lookalike, the real vendor, the company software portal. Downloads show a bar with the file name and type, and an unexpected type gets a plain warning.
4. Meets interruptions, each a small decision:
   - **"Verify you are human"** tells them to press keys and paste. The game never asks for real key presses: it shows the instructions as text and what is on the clipboard ("a hidden command that would run a program on your computer"), with Follow the instructions, Close the page and Report as buttons. The clipboard text is a harmless placeholder, never a working command.
   - **A full-screen "virus detected" page** with a phone number. Its alarm is silent by default, with a caption ("This page is trying to play a loud alarm"). The player learns the way out: close the tab, restart if it won't close, then report. Calling the number leads to a short MG-04 call with a friendly "technician" who wants remote access.
   - **An extension prompt** listing its permissions in plain words.
   - **A notification prompt**: Allow or Block.
   - **A browser warning page** ("Deceptive site ahead") with "Back to safety" and a small Details link that lets them carry on.
5. Reports a page with the toolbar's Report button or through MG-09.

**What it teaches:** sponsored results can be fakes; read the domain; get software from the company portal; never paste a command a web page gives you; full-screen virus warnings are scams, and how to leave them; extension permissions matter; heed browser warnings; a padlock only means the connection is encrypted; use bookmarks for important sites.

**Configuration:** `startPage`, `bookmarks[]`, `searches[] {query, results[] {title, displayUrl, page, sponsored}}`, `pages{} {url, kind, title, blocks, links, downloads, prompt, clipboard, next}` with kinds `vendor`, `portal`, `signin`, `download`, `captcha_instruction`, `scareware`, `warning`, `form`, `article`; `downloads{} {name, type, risky}`; `prompts{} {kind, name, permissions}`; `assess`; `onAction`.

```json
{
  "startPage": "search_home",
  "bookmarks": [{ "text": "The Lark", "page": "the_lark" }, { "text": "Software portal", "page": "portal" }],
  "searches": [{
    "query": "pdf to spreadsheet converter",
    "results": [
      { "title": "Folio Convert: free PDF to spreadsheet", "displayUrl": "folioconvert-download.example", "page": "fake_vendor", "sponsored": true },
      { "title": "Folio Convert", "displayUrl": "folioconvert.example", "page": "real_vendor" }
    ]
  }],
  "pages": {
    "fake_vendor": { "kind": "vendor", "url": "https://folioconvert-download.example/get", "downloads": ["folio_setup"], "next": "captcha" },
    "captcha": {
      "kind": "captcha_instruction",
      "url": "https://human-check.example/verify",
      "clipboard": "A hidden command that would run a program on your computer",
      "assess": { "behaviour": "C08-Bx", "onAction": { "closed": "closed_page", "reported": "reported", "followed": "followed_instructions" } }
    },
    "portal": { "kind": "portal", "url": "https://software.larkspur.co.uk/", "downloads": ["approved_converter"] }
  }
}
```

(Product names such as "Folio Convert" get the same check as domains before use.)

**Events and records:** prefix `browser_`: `browser_page_opened:<pageId>`, `browser_searched:<searchId>`, `browser_result_clicked:<pageId>` (sponsored or not), `browser_download_started:<fileId>`, `browser_download_opened:<fileId>`, `browser_instruction_followed:<pageId>`, `browser_extension_added:<extId>`, `browser_notifications_allowed:<pageId>`, `browser_warning_bypassed:<pageId>`, `browser_signin_submitted:<pageId>`, `browser_page_reported:<pageId>`, `browser_left_safely:<pageId>`. Records: where the software came from (portal, real vendor, lookalike), whether a pasted command would have run, the extension and notification choices, and warnings bypassed.

**Builds on:** MG-01's page renderer and the address reader; `forensic-data-platform`'s typed block renderer (`JS/minigames/forensic-data-platform/forensic-data-platform-minigame.js:102-116`) for page content; the `lab-workstation` iframe (`JS/utils/lab-workstation.js`) as a cheap first version for static hosted pages, once its title can be set; `esd-pushbutton`'s guarded confirm for prompts.

**Accessibility notes:** the address is real text, read domain first; prompts are modal dialogs that keep focus; no real operating system shortcuts are ever needed; the scareware page has no flashing, no sound by default and a visible close control, and Esc always works; search results are a list of links with "Sponsored" read out.

**Art:** generic browser chrome with no real browser's look or name; four fictional sites built from blocks (vendor, portal, scareware, warning) in styles distinct from Larkspur's; a download bar and file icons.

**Open questions:**

1. **Data-built pages or hosted pages?** *Recommendation:* data-built pages from blocks. Hosted pages only in a first version, because the game can't see what happens inside another site's iframe.
2. **A mobile browser.** *Recommendation:* later, inside MG-05's phone, mainly for QR codes (MG-06).

### MG-03 Link and domain drill

**Priority and size:** P2 in the catalogue, S. The inline version inside MG-01's practice mode is needed by core_01, an MVP module, so that part is built in wave 1 (sections 5 and 6). It is an MG-20 item type plus a drill wrapper rather than a separate app.

**Used for:** core_01 (three practice emails and Ama's check question: C01-LO2, C01-B8); core_08 (its practice beat); core_02 (links in texts, QR destinations); monthly drills (BE-07).

**What the player does:** one address at a time, in large text split into parts, in three steps shown as a step list:

1. **Find the end:** tap the first single "/" after "://" (or the "@" in an email address). In easy mode this step is done for them.
2. **Read from the right:** tap the real domain (`secure-login.info` in `larkspur.co.uk.secure-login.info/mail`).
3. **Decide:** Larkspur's, not Larkspur's, or can't tell (a shortened link).

Each step gets one line of feedback. Items get harder: a plain domain; a decorated one; a hyphenated lookalike; one changed letter; a different ending (`.co` for `.co.uk`); a link shortener; a real file-sharing service used by a stranger ("trust the request, not the service"). Drills add a streak and an optional timer.

**What it teaches:** how to read a web address: find the domain and read it from the right; anything in front of it is decoration; `https` doesn't make a site genuine; shortened links hide where they go.

**Configuration:** `items[] {address, kind: url|email, domain, answer: trusted|not_trusted|cant_tell, why}`, `trustedDomains` (BE-05), `steps` (which of the three to show), `generate {patterns: decorated|hyphen|swap|ending}` (per-game lookalikes of the organisation's own domain, made with the ERB helpers), `streak`, `timer {optional: true}`.

**Events and records:** prefix `domain_`: `domain_item_answered:<itemId>` (the result of each step), `domain_drill_completed` (score). Records feed C01-B8 (3 of 3 is Secure).

**Builds on:** the address reader (section 1); MG-20's hotspot item (the parts of the address are hotspots); the dusting step list.

**Accessibility notes:** each part of the address is a button; "Spell it" reads a part letter by letter; the font tells `l`, `1` and `I` apart; letter swaps are explained in words ("rn can look like m"); no timer by default.

**Art:** nothing beyond the shared UI and a magnifying glass icon.

**Open questions:** **Lookalike letters from other alphabets?** *Recommendation:* leave them out of the drill and mention them in core_08's field guide.

### MG-04 Voice calls

**Priority and size:** P2, M. Built as a call mode inside `phone-chat` rather than a separate app, so contacts, threads, voicemail and calls share one phone (the `phone` object type already opens `phone-chat`: `JS/systems/interactions.js:1328-1378`).

**Used for:** core_02 (the Apply beat: covering the Operations line); core_01 (calling Northbeck on the directory number; the callback phish's number); core_11 (calling Dawn back; "Gillian" calling); core_15 (a cloned voice asking for money); core_05 (two calls to Customer Services); core_07 and core_09 (ringing the service desk; core_09 also calls a client back); core_08 (ringing the number on a scam pop-up); role_01 (the 02:13 call, the insurer, a client); role_05 (ringing a referee on a number found independently); role_02, role_03, role_06 and sector_01 (callers at work, with MG-17). Until MG-04 exists, the module plans use `phone-chat` conversations instead.

**What the player does:**

1. **The phone rings,** on the desk or in a pocket, with a sound and a caption ("Phone ringing: 0161 496 0123, IT Service Desk"). Caller ID shows a number and, if the number is in the directory, a name. Caller ID can lie, and in core_02 it does.
2. **Answers, or lets it go to voicemail.** A missed call is never a failure; the voicemail is kept.
3. **Talks.** The call runs as ink with voiced lines (TTS) and captions; the choices are what to say: ask a question, refuse politely, offer to call back, put on hold, transfer.
4. **Puts the caller on hold** to check the directory, The Lark or a colleague. On hold, the caller may push with short barks ("Are you still there? This really can't wait."), but nothing runs out.
5. **Hangs up and calls back** from the directory. Ringing the number given in the call reaches the fraudster; ringing the directory number reaches the real person.
6. **Transfers** the call to the service desk or the security team (`{org.serviceDesk}`; extension 4444 at Larkspur).
7. **Checks the call log and voicemail** later.

**What it teaches:** caller ID can be faked; hang up and call back on a number you already have; never read out a code or install a tool because a caller asked; it's fine to say no politely; use hold to think; pass the call to the right team.

**Configuration:** `phone {kind: desk|mobile, line}`, `directory` (a bank file of names and numbers), `calls[] {id, callerId, number, npcId, knot, arrive, voicemail, assess}`, `outgoing{} {number: {npcId, knot}}`, `unknownNumber` (what an unlisted number does), `holdBarks[]`, `transferTargets[]`.

```json
{
  "phone": { "kind": "desk", "line": "Operations" },
  "directory": "content/directory.json",
  "calls": [{
    "id": "fake_it_call",
    "callerId": "IT Service Desk",
    "number": "0161 496 0123",
    "npcId": "caller_fake_it",
    "knot": "call_start",
    "arrive": { "at": "Tue 10:05" },
    "voicemail": "Hi, it's Owain from IT. Can you ring me back on this number? It's urgent.",
    "assess": { "behaviour": "C02-Bx", "onAction": { "called_back_directory": "called_back", "refused": "refused", "read_code": "shared_code" } }
  }],
  "outgoing": { "0161 496 0200": { "npcId": "owain_jenkins", "knot": "callback_check" } },
  "holdBarks": ["Are you still there? This really can't wait."]
}
```

**Events and records:** prefix `call_`: `call_incoming:<callId>`, `call_answered:<callId>`, `call_missed:<callId>`, `call_on_hold:<callId>`, `call_transferred:<callId>` (to whom), `call_ended:<callId>` (who hung up), `call_placed:<number>` (from the directory, the message or typed), `call_voicemail_played:<callId>`. Choices inside the call are tagged in ink for BE-01. Records: whether the player called back on a trusted number before acting, whether they gave a code or agreed to install something, and whether they transferred or reported.

**Builds on:** `phone-chat` (contacts, unread badges, voice messages through `JS/systems/tts-manager.js`, `timedMessages`); `person-chat` for the conversation engine and the video-call frame (`JS/minigames/person-chat/person-chat-ui.js:243-314`); NPC event mappings to start calls; `scenarios/test-phone-terminal`; sis02's call-back on the number on record (`scenarios/sis02_energy/ink/npc_tom_hadley.ink:136-171`).

**Accessibility notes:** captions on every line, always; the ring is a sound, a visual and a polite announcement; no time limit to answer; choices on number keys, as in `person-chat` (`person-chat-minigame.js:305-319`); transcripts kept in the call log; volume follows the voice setting.

**Art:** a generic desk phone screen and a mobile call screen; "Unknown caller" and directory avatars. No new characters: callers are voices, and video calls use `person-chat`.

**Open questions:**

1. **Typing numbers.** *Recommendation:* pick from the directory, the message or the call log; typing is optional.
2. **A spoofed caller ID showing a real colleague's name.** *Recommendation:* yes, once in core_02, explained in the debrief: it's the lesson.

### MG-05 Messaging apps

**Priority and size:** P2, S. Skins and a few actions added to `phone-chat`.

**Used for:** core_02 (a parcel text; "Hi, it's me, new number" from "Gillian"); core_01 and core_04 (the team chat with Lena, Leo and Kai); core_00 (a message on the player's own phone); core_03 (a chat from "IT" during the prompt storm); core_09 (engineers messaging from the road); core_11 (a gift card request); core_12 and core_14 (a "recruiter" message); core_15 (a voice note from "Leo"); role_06 (a customer web chat); sector_01.

**What the player does:**

1. Gets messages in one of three skins: text messages, the company chat tool, or a personal messaging app, all generic.
2. Sees unknown senders as numbers marked "Not in your contacts".
3. Presses and holds (or focuses) a link to see where it goes before opening it.
4. Plays voice notes, with a transcript.
5. Acts: Report (the work route; for personal texts the reference card says to forward to 7726), Block, Reply, Call (MG-04, on a number they already have), or ignore.

**What it teaches:** texts and chats can be faked; the "new number" story; never act on a request for money, codes or gift cards from a message alone; check by calling a number you already have; how to report at work and at home.

**Configuration:** `skin` (`sms`, `work_chat`, `personal_chat`) on the existing phone NPC and thread data, plus `unknown: true` on a contact, `links[] {text, url, page}` on a message, `actions[]` (which buttons show), `reportRoute` (BE-05) and `assess`.

**Events and records:** prefix `message_`: `message_received:<threadId>`, `message_link_checked:<threadId>`, `message_link_opened:<threadId>`, `message_reported:<threadId>`, `message_blocked:<threadId>`, `message_replied:<threadId>`, `message_voice_note_played:<threadId>`. Records: whether a request for money or a code was checked another way before the player acted.

**Builds on:** `phone-chat` (`JS/minigames/phone-chat/`), whose look is either the default or `terminal` (`phone-chat-ui.js:32`, chosen by the object's `theme` or the NPC's `phoneTheme`, `interactions.js:1344`), so this adds a skin registry; its contacts and unread badges (`phone-chat-ui.js:421-460`); voice messages; NPC `timedMessages`; the unknown sender in `scenarios/test-phone-terminal`.

**Accessibility notes:** as `phone-chat`, plus link destinations read as text, transcripts for voice notes, and a Report action reachable by keyboard.

**Art:** three skin palettes and headers, an unknown-number avatar and a voice note bubble.

**Open questions:** **One phone for work and personal?** *Recommendation:* one phone with a work profile and a personal profile, which also sets up core_09's questions about personal devices.

### MG-06 QR code scanner

**Priority and size:** P2, S.

**Used for:** core_02 (a sticker on the coffee machine, "scan to join the free coffee club"; a poster; a letter); core_17. It would also suit a car park payment sign in core_09.

**What the player does:**

1. Finds a QR code in the world (a sticker, a poster, a letter, an image in an email) and chooses "Scan with phone".
2. Sees the phone's camera view with the destination shown before anything opens, as phone cameras do.
3. Can look closer first (`examine`): a sticker stuck over another code.
4. Chooses Open, Don't open, or Report (a photo to facilities or the security team).
5. If they open it, a page appears (MG-02's renderer): a "free coffee club" form wanting a sign-in or card details.

**What it teaches:** a QR code is a link you can't read; check the preview; stickers can cover genuine codes; don't sign in or pay through a code you weren't expecting; report codes that look tampered with.

**Configuration:** `code {display, url, page, overSticker}`, `context` (where it is), `assess`, `onAction`.

**Events and records:** prefix `qr_`: `qr_scanned:<id>`, `qr_examined:<id>`, `qr_opened:<id>`, `qr_declined:<id>`, `qr_reported:<id>`. Records: whether the destination was read before opening, and the final choice.

**Builds on:** `examine` (`JS/minigames/examine/examine-minigame.js`) for the close-up; MG-05's phone; the page renderer; object dispatch in `interactions.js`.

**Accessibility notes:** no aiming: one Scan button; the preview is read out; the sticker is described in the examine text as well as drawn.

**Art:** a QR sticker and a poster as props, and a camera frame. The codes are stylised and don't scan with a real phone, so nobody is sent anywhere real.

**Open questions:** none beyond MG-02's.

### MG-07 MFA prompts and authenticator

**Priority and size:** MVP, M.

**Used for:** core_03 (enrolling, number matching, the 02:13 prompt storm and the "IT" chat asking the player to accept); core_00 (approving the first prompt, lightly); core_04 (a prompt the player didn't start, as a sign something is wrong); core_14 (a 02:10 prompt storm as one short decision); core_17.

**What the player does,** on a phone app and the laptop's sign-in, in stages:

1. **Set up:** add the work account to a generic authenticator app (scan a stylised code from the laptop), name it, try a test prompt, add a back-up method. The step list reads Add, Test, Back-up.
2. **A normal sign-in:** sign in on the laptop (pre-filled). The phone asks "Are you trying to sign in?", shows the app and a rough location, and asks for the number on the laptop screen (number matching). The player picks or types it.
3. **One-time codes:** a six-digit code that changes every 30 seconds. The countdown is decoration: any code from the last minute is accepted.
4. **A prompt they didn't start:** it arrives while they're doing something else. The choices are Approve, Deny, and "Deny and report: this wasn't me", as some real apps offer.
5. **The prompt storm** (a time skip to 02:13, BE-16): prompt after prompt. With number matching on, the attacker's prompts ask for a number the player can't see. A chat from "IT" (MG-05) asks them to approve "so it stops". The right moves are deny, report, don't reply, and ring the 24/7 service desk. After the third prompt a single "Deny all and report" button appears, so nobody has to tap through a long storm.
6. **Someone asks for a code** on a call or in a message (MG-04 or MG-05). The right answer is always no.
7. **Optional: a passkey** that won't work on a lookalike site, to show why passkeys resist phishing (awareness level only).

**What it teaches:** what MFA does and why it matters; approve only prompts you started; how number matching helps; never share a code; deny and report a prompt storm; passkeys resist phishing.

**Configuration:** `account`, `methods[]` (`push_number_match`, `push_simple`, `totp`, `sms`, `passkey`), `scenes[] {id, kind: enrol|signin|unexpected|storm|code_request|passkey_lookalike, at|on, prompts, everyGameSeconds, chatThread, assess}`, `reportRoute`.

```json
{
  "methods": ["push_number_match", "totp"],
  "scenes": [
    { "id": "enrol", "kind": "enrol" },
    { "id": "first_signin", "kind": "signin", "on": "global_variable_changed:laptop_ready" },
    {
      "id": "storm", "kind": "storm", "at": "Wed 02:13", "prompts": 8, "everyGameSeconds": 20,
      "chatThread": "fake_it_night",
      "assess": { "behaviour": "C03-Bx", "onAction": { "approved_any": "approved", "denied": "denied", "denied_and_reported": "denied_and_reported" } }
    }
  ]
}
```

**Events and records:** prefix `mfa_`: `mfa_enrolled`, `mfa_prompt_shown:<promptId>` (whether the player started it), `mfa_prompt_approved:<promptId>`, `mfa_prompt_denied:<promptId>`, `mfa_prompt_reported:<promptId>`, `mfa_code_shared:<sceneId>`, `mfa_storm_ended` (approved any, number denied, reported or not). Records: the storm's option (`approved`, `denied`, `denied_and_reported`), which core_03's map would rate Not yet, Developing and Secure.

**Builds on:** the `pin` keypad (`JS/minigames/pin/pin-minigame.js`) for code entry; `phone-chat`'s phone and notifications; MG-05 for the "IT" chat; the game clock and BE-16 for the night-time skip; the `password` minigame's sign-in screen (`JS/minigames/password/password-minigame.js`) for the laptop side.

**Accessibility notes:** prompts stay until answered; the number to match is read out; typing a code is optional, because retyping a code from one screen on another counts as a cognitive test under WCAG 2.2 SC 3.3.8 unless an aid such as paste is allowed, so paste and "pick the matching number from three" are offered; no shaking phone under reduced motion; the buzz is shown as well as heard.

**Art:** a phone lock screen with notification cards, a generic authenticator app, and a dark bedside view for 02:13 (a phone-only overlay, so no new room is needed).

**Open questions:**

1. **SMS codes?** *Recommendation:* show them once, as "better than nothing".
2. **Passkeys in core_03?** *Recommendation:* one short optional step; the concepts file explains.

### MG-08 Password manager and passphrase builder

**Priority and size:** MVP, M.

**Used for:** core_03 (build a passphrase, store and fill it with a manager, give email its own password, check a breach, make up answers to recovery questions, help Kev set up a manager); core_00 (setting a first passphrase in the manager, lightly); core_17.

**What the player does** (steps: Build, Store, Fill, Fix):

1. **Build.** Roll three random words with in-game word dice; there is no free typing. A meter shows roughly how long the result would take to guess, in plain bands ("seconds", "days", "centuries"), beside familiar weak patterns that fall at once (`Password1!`, a pet's name and a year, `Summer2026`). A symbol moves the meter a little; a fourth word moves it a lot. The bands are labelled as rough.
2. **Store.** Save it in a generic password manager, linked to the site's real address.
3. **Fill.** On the real site the manager fills in the sign-in. On a lookalike page (MG-01's panel) it offers nothing: "No saved sign-ins for larksper.co.uk". The player learns to treat that silence as a warning.
4. **Fix.** The vault flags a password used on three sites, and the player changes the email one first. A breach check (a fictional service) shows the player's personal address in an old breach; the action is to change that password everywhere it was used.
5. **Recovery questions.** Generate a made-up answer and keep it in the manager.

**What it teaches:** three random words (NCSC advice, quoted as core_03's concepts file verifies it); length beats complexity; a unique password for email above all; a manager remembers passwords for you and won't fill a lookalike site; what to do when a password shows up in a breach; made-up answers to recovery questions; never share a password.

**Configuration:** `wordList` (a bank of short, common, inoffensive words), `wordCount`, `meter {bands[], examples[]}`, `vault[] {site, domain, username, reusedOn}`, `breachCheck {address, breaches[] {name, year, data}}` (all fictional), `fillTests[] {page, domain, expect: fill|no_fill}`, `steps[]` (which stages run), `assess`.

**Events and records:** `passphrase_built` (word count and band only, never the words); prefix `vault_`: `vault_item_saved:<site>`, `vault_fill_offered:<pageId>`, `vault_no_fill_noticed:<pageId>`, `vault_password_changed:<site>`, `vault_breach_checked`, `vault_recovery_answer_made`. Records: whether the email password was made unique, and whether the player stopped at a lookalike when nothing filled.

**Builds on:** the `password` minigame (`JS/minigames/password/password-minigame.js`: the field, show and hide, the on-screen keyboard, and its server-side check) for sign-in moments; the page renderer and address reader for the fill test; the dusting step list.

**Accessibility notes:** word tiles are buttons; the meter is text first ("about 200 years to guess") with the bar as decoration; no typing is needed anywhere, which also keeps real passwords out of the game.

**Art:** word dice, a generic vault app, and a meter with small pixel icons (a snail for weak, a mountain for strong).

**Open questions:**

1. **Numbers on the meter?** *Recommendation:* bands in words, not exact times, to avoid false precision.
2. **The browser's own password manager.** *Recommendation:* an organisation profile setting (allowed or not), shown on the reference card.

### MG-09 Incident report form

**Priority and size:** MVP, S, with structured fields (pick lists and evidence chips). Marking free text would make it M, and it isn't needed.

**Used for:** core_04 (the main reporting action, scored for completeness and how soon); core_05 (a personal data breach to the DPO: the file sent to the wrong Sam); core_09 (a lost phone); core_10 (a lost badge, a stranger in the comms room corridor); core_14 (raising a concern, in a gentler variant); core_17; core_01 (an optional "I clicked" report).

**What the player does:**

1. Opens the form from The Lark (BE-09), from the Report button's menu, from the phone, or when a colleague hands it over (BE-19).
2. **What happened:** picks a category (suspicious message, lost or stolen device, data sent to the wrong person, an MFA prompt they didn't start, a ransom note, a stranger in a secure area, something else) and adds **evidence chips**: facts the player noticed during play ("Leo's account sent 30 emails at 14:02").
3. **When and where:** the time noticed (filled in from the game clock) and the place or system.
4. **Who and what:** the people involved, and whether personal data is involved (Yes, No, Not sure; Yes and Not sure also send it to the DPO).
5. **What you did:** ticks what they did on a list that also holds things not to do ("deleted the email", "tried to fix it myself"), so the form itself teaches.
6. **Submit:** a receipt with a reference number. In practice mode, feedback on what was missing. In a mission, Kai or Tomasz rings back with one question about anything missing.
7. Ringing the security team (MG-04) also counts as reporting: the form is for completeness, not the only route.

**What it teaches:** report quickly; what a useful report contains; don't investigate or fix it yourself; keep the evidence; personal data goes to the DPO; "not sure" is a fine answer.

**Configuration:** `categories[]`, `fields[] {id, kind: pick|chips|yesno|time|place}`, `evidenceChips[] {id, text, showIf}` (conditions as in `JS/utils/global-condition.js`), `completeness {required[]}`, `routes {personalData: "dpo"}` (BE-05), `noticedOn` (the event that marks "noticed"), `followUps{}` (the ring-back line for each missing item), `assess`.

**Events and records:** prefix `incident_report_`: `incident_report_opened`, `incident_report_submitted:<category>` (completeness, route, story events since "noticed"), `incident_report_cancelled`. Records: how soon (in story events), completeness against what, when, where, who and what you did, and the route. Free text, if an organisation turns it on, never leaves the browser.

**Builds on:** `coverage-decision-form` (`JS/minigames/coverage-decision-form/coverage-decision-form-minigame.js`: sections of options, a submit gate, completion actions), generalised (section 4); a `forensic-data-platform` callout for the receipt.

**Accessibility notes:** native form controls with labels and fieldsets; an error summary at the top; no free text required; a draft survives closing.

**Art:** the intranet form style and a receipt stamp.

**Open questions:** **One form or several?** *Recommendation:* one form whose sections follow the category; core_14's concern variant changes only the wording and the route.

### MG-10 Classification sorter

**Priority and size:** P2, S. A themed set-up of MG-20's "sort into groups" item with a reason step, so most of it comes with MG-20.

**Used for:** core_06 (sorting documents for the bid pack by class); core_17; core_05 can borrow it for "Is this personal data?".

**What the player does:**

1. Sees a tray of documents as cards (a title, a short extract, a thumbnail; open one to read it in full).
2. Picks a label for each (Public, Internal, Confidential, Restricted, or the organisation's own names from BE-05) and a reason ("contains personal data", "prices", "already published", "staff only").
3. Optionally picks the handling: secure send, secure print, the team site, confidential waste.
4. In practice, gets feedback on each card with the rule. In a mission, the label decides what can happen to the document later: a Confidential file can't go into an "anyone with the link" share.

**What it teaches:** classify by what a document contains; need to know; the label decides how it's handled.

**Configuration:** `labels` (BE-05), `documents[] {id, title, extract, image, label, acceptable[], reasons[], why}`, `handling` (on or off), `assess`.

**Events and records:** prefix `classify_`: `classify_labelled:<docId>` (label, reason, right or not), `classify_completed` (score). Records per document.

**Builds on:** MG-20's sort item; `warranty-checklist`'s row and verdict buttons (`JS/minigames/warranty-checklist/warranty-checklist-minigame.js:161-204`); `notes` to read a document in full.

**Accessibility notes:** no dragging needed: each card has a label menu, and dragging is an extra.

**Art:** document thumbnails and label stickers in the organisation's colours.

**Open questions:** none.

### MG-11 Sharing settings

**Priority and size:** P2, S.

**Used for:** core_06 (sharing the bid with an outside partner without "anyone with the link", and with an end date); core_13 (Kev's team's spreadsheet shared from someone's personal account; a leaver who can still open a share); core_17.

**What the player does:**

1. **Shares** a file in a generic share dialog: who (named people, people in the organisation, anyone with the link), what they can do (view or edit), an end date, and whether they can download.
2. **Meets the task,** which says what's needed ("Dawn at Northbeck needs to read the drawings for a week").
3. **Reviews** a folder's existing shares, listed with plain summaries; finds the over-shared ones and fixes them (remove, restrict, add an end date).
4. **Reads** a live sentence describing the current setting: "Anyone who gets this link, including people it's forwarded to, can open it."

**What it teaches:** share with named people; give the least access that does the job; set an end date; review old shares; why "anyone with the link" is risky.

**Configuration:** `file`, `task {audience, permission, maxDays}`, `existingShares[] {file, audience, permission, people, expires, issue}`, `assess`.

**Events and records:** prefix `share_`: `share_saved:<fileId>` (settings, meets the task or not), `share_removed:<shareId>`, `share_restricted:<shareId>`, `share_review_completed` (found, missed). Records: the settings chosen and the over-shares missed.

**Builds on:** `coverage-decision-form`'s option sections for the dialog; `warranty-checklist`'s rows for the review list.

**Accessibility notes:** standard controls; the live summary sentence is announced when it changes.

**Art:** a generic file-sharing dialog and file icons.

**Open questions:** none.

### MG-12 Redaction

**Priority and size:** MVP, M.

**Used for:** core_05 (redacting a complaint file before it goes out, including a "redaction" that only drew black boxes over the text, and a spreadsheet with a hidden tab); core_06 (hidden content before sharing); core_17.

**What the player does** (steps: Read, Mark, Hidden, Redact, Check):

1. **Read** the document and the task ("This goes to the care home. Remove other residents' and staff details.").
2. **Mark** what must go by selecting words or phrases: names, addresses, health details, other people's information. A hint arrives if they stall ("Look for a phone number"), and "Mark every copy of this name" saves effort.
3. **Hidden:** look for what isn't on show: a hidden spreadsheet tab, comments, tracked changes, the author in the file details.
4. **Redact:** choose "Redact and remove" (the text is deleted) or "Draw a box" (the text is only covered). Both look the same on screen.
5. **Check:** "Select all and copy" or "Search for a name" shows whether anything is still there. After a box-only redaction, the covered text comes straight back in the copy, and the debrief explains why.
6. Save and send (MG-01 compose).

**What it teaches:** what personal data looks like; send only what's needed; look for hidden tabs, comments and file details; a black box drawn over text doesn't remove it; check the result before it goes.

**Configuration:** `task {recipient, rule}`, `document {kind: letter|record|spreadsheet|email, spans[] {id, text, category, mustRedact, mayKeep}, hidden {tabs[], comments[], properties{}, boxes[]}}`, `tools[]` (`mark`, `remove`, `box`), `checks[]` (`copy_all`, `search`), `assess`.

```json
{
  "task": { "recipient": "the care home", "rule": "Remove other residents' and staff details." },
  "document": {
    "kind": "record",
    "spans": [
      { "id": "s1", "text": "Mrs D. Ashby, Room 12", "category": "other_resident", "mustRedact": true },
      { "id": "s2", "text": "the night carer, Sanjay", "category": "staff_name", "mustRedact": true },
      { "id": "s3", "text": "the complaint about the laundry service", "category": "subject", "mayKeep": true }
    ],
    "hidden": { "tabs": [{ "name": "Staff sickness", "mustRemove": true }], "boxes": [{ "spanId": "s2" }] }
  },
  "checks": ["copy_all", "search"],
  "assess": { "behaviour": "C05-Bx", "onAction": { "all_removed": "removed_all", "tab_missed": "missed_hidden_tab", "box_only": "box_only" } }
}
```

**Events and records:** prefix `redaction_`: `redaction_marked:<spanId>`, `redaction_hidden_found:<kind>`, `redaction_applied` (remove or box), `redaction_checked` (what leaked), `redaction_completed` (missed, over-redacted, hidden content missed). Records: personal data left in, box-only redaction, hidden content missed.

**Builds on:** the annotated document (section 1), shared with BE-08; `text-file` and `notes` for the reading view; `forensic-data-platform`'s tables for the spreadsheet view.

**Accessibility notes:** marking by keyboard (move by word or sentence, Space to mark); marked text is announced and shown with a pattern as well as colour; "Mark every copy" helps people who find precise selection hard; no time pressure.

**Art:** a paper document style, black bars, and a small spreadsheet grid with a tab strip.

**Open questions:**

1. **How much of a real spreadsheet?** *Recommendation:* tabs and cells only, no formulas.
2. **Subject access requests.** *Recommendation:* keep the rule simple in the task text; Tomasz explains the detail in core_05.

### MG-13 Social media profile and OSINT board

**Priority and size:** P3, M.

**Used for:** core_12, the whole module: with Jo, on an authorised test, the player builds a pretext from Leo's public posts on a corkboard, then locks down Leo's profile and their own. Light use in core_14 and role_05 (recruiter approaches, fake profiles); core_11's alternative "Follow the Money" concept reuses the corkboard to trace how a payment fraud got through.

**What the player does:**

1. **Browses** a fictional social site: Leo's profile and feed, from Jo's side of the desk (EX-06, with BE-11's role switch).
2. **Pins** posts to the corkboard: a photo with his badge on show, his manager tagged at a leaving do, a job advert naming the new finance system, his holiday dates, his dog's name.
3. **Connects** pins to the pretext slots with string: who to pretend to be, when he's away, which system to mention, the answer to a security question. Each right connection adds a line to Jo's script.
4. **Hears** Jo read the finished pretext, then say what would have stopped her.
5. **Flips sides:** opens the privacy settings for Leo's profile, then the player's own; changes who can see posts, removes location tags, hides the friends list, reviews old posts.
6. **Spots** risky posts in a feed (as in BE-10) and answers a "recruiter" message (MG-05).

**What it teaches:** small public details add up to a convincing story; how privacy settings help; think before posting about work; how to spot a fake recruiter.

**Configuration:** `profiles[]`, `posts[] {id, text, image, reveals[], risky}`, `board {slots[] {id, label, accepts[]}}`, `privacySettings[] {id, label, state, target}`, `assess`.

**Events and records:** prefix `osint_`: `osint_post_pinned:<postId>`, `osint_link_made:<slotId>`, `osint_board_completed`; prefix `privacy_`: `privacy_setting_changed:<settingId>`, `privacy_post_fixed:<postId>`. Records: the settings fixed and the risky posts found or missed.

**Builds on:** MG-05 for messages; BE-10 and BE-11; the board in the room can use the existing `notice_board1.png` sprite. The corkboard view itself is new.

**Accessibility notes:** connecting uses a "Pin to" menu on each post, and the string is decoration; the board can also be read as a list of slots and what fills them.

**Art:** corkboard, pins, string and photo cards in pixel art; a fictional social network with its own made-up name and look.

**Open questions:** **Photographs in posts?** *Recommendation:* pixel-art posts only, in the game's own style; photographs of people would look real enough to raise questions about whose they are.

### MG-14 Wi-Fi and VPN picker

**Priority and size:** P3 in the catalogue, S. core_09, a P2 module, needs it, so it should be P2, ideally as a panel of MG-23 (section 6).

**Used for:** core_09 (a café with two networks of nearly the same name, the VPN, the phone hotspot); core_17.

**What the player does:**

1. Opens the laptop's list of networks in the café: `LockKeeperCafe_Guest`, `LockKeeperCafe-Guest-FREE`, a printer, and the player's own phone hotspot.
2. Checks another way: the network name on the card by the till, or a question to the person behind the counter.
3. Chooses the phone hotspot (best), or the café's real network with the VPN on.
4. If they join the fake network, it shows a sign-in page asking for their work account (pre-filled, MG-02's renderer); signing in is recorded.
5. Turns the VPN on with one switch and sees "Connected through the {org.name} VPN".

**What it teaches:** network names can be copied; check the name with the staff or the sign; use your phone's hotspot or the VPN; never sign in with your work account on a public Wi-Fi page.

**Configuration:** `networks[] {ssid, secured, genuine, signal, page}`, `hotspot`, `vpn {required, label}`, `askNpc` (who knows the real name), `assess`.

**Events and records:** prefix `wifi_`: `wifi_joined:<ssid>` (genuine or not), `wifi_hotspot_used`, `wifi_vpn_on`, `wifi_page_signin:<pageId>`. Records: the network chosen, whether the VPN was on before work started, and any sign-in on a portal.

**Builds on:** MG-23's settings frame; the page renderer; `person-chat` for the café staff; the café scene can also use line of sight for shoulder surfing (`JS/systems/npc-los.js`).

**Accessibility notes:** the network list is a list of buttons with signal strength in words; no timing.

**Art:** a generic laptop network list; the café room is new (`03_WORLD_AND_CAST.md`, Places).

**Open questions:** **A minigame of its own or an MG-23 panel?** *Recommendation:* an MG-23 panel.

### MG-15 Payment verification desk

**Priority and size:** P2, M, once MG-25 and MG-04 exist and `dual-auth` has been reworked (section 4).

**Used for:** core_11 ("Northbeck's" new bank details on letterhead, a call back on the directory number, a Confirmation of Payee "no match", a second approver); role_02 (a month-end run of thirty payments with planted anomalies, a supplier change mid-run, pressure from "the chief executive", and the race to recover money after a mistake).

**What the player does** (steps: Request, Record, Call back, Payee check, Approve):

1. **Request:** read the change request (an MG-01 email or a letter) and note what it claims.
2. **Record:** compare it with the supplier record in Ledger, the finance system, and mark what differs (MG-25's comparison view).
3. **Call back** on the number already on record (MG-04). Dawn knows nothing about it. Ringing the number on the letter reaches the fraudster, who is very reassuring.
4. **Payee check:** run Confirmation of Payee on the new details. It answers Match, Close match or No match, with the name the bank holds (wording to check against core_11's concepts file). It helps; it isn't proof.
5. **Approve or refuse:** approve, hold and escalate, or refuse and report. Payments need a second approver: in core_11 the player gathers the evidence and watches Hassan and a colleague approve or refuse on it (core_11's plan); in role_02 the player is the second approver, challenging a colleague's evidence.
6. **The run** (role_02): a table of thirty payments; filter and flag the odd ones (a large, urgent payment to a new account; a changed remittance contact; a duplicate invoice).
7. **If money goes:** a time skip shows the chance of getting it back falling by the hour (BE-16). The right move is to ring the bank at once, then report.

**What it teaches:** never use the contact details in the request; call back on the number already on record; two people approve; urgency plus secrecy plus money means slow down; Confirmation of Payee helps but isn't foolproof; act at once if money has gone.

**Configuration:** `request` (an email id or a document), `record`, `callback {onRecord, inRequest}`, `payeeCheck {result, nameHeld}`, `approval {second, via}`, `run[]` (role_02: payments with `anomalies[]`), `recovery {byHour[]}`, `assess`.

```json
{
  "request": { "email": "northbeck_bank_change" },
  "record": { "supplier": "Northbeck Supplies", "account": "ending 4471", "phone": "0161 496 0450" },
  "callback": { "onRecord": "0161 496 0450", "inRequest": "0161 496 0991" },
  "payeeCheck": { "result": "no_match", "nameHeld": "NBK Trading" },
  "approval": { "second": "hassan_qureshi", "via": "dual_auth" },
  "assess": { "behaviour": "C11-Bx", "onAction": { "called_on_record_and_refused": "verified_and_refused", "refused_without_call": "refused_unverified", "approved": "approved" } }
}
```

**Events and records:** prefix `payment_`: `payment_request_read:<id>`, `payment_difference_marked:<id>` (field), `payment_callback:<id>` (which number), `payment_payee_checked:<id>` (result), `payment_approved:<id>`, `payment_held:<id>`, `payment_refused:<id>`, `payment_reported:<id>`, `payment_run_flagged:<paymentId>`, `payment_bank_called:<id>` (story time since the payment). Records: which number was used to check, the payee result and what the player did with it, the decision, and the anomalies found in a run.

**Builds on:** `dual-auth` (`JS/minigames/dual-auth/`) for the two-approver panel, reworked (section 4); `forensic-data-platform` for the evidence and a gated confirm; MG-25 for the comparison; MG-04 for the calls; `warranty-checklist` rows for the run; `notes` for the procedure card.

**Accessibility notes:** tables with proper headers, sortable by keyboard; differences marked with checkboxes; the approval panel works from the keyboard (today's keypads take clicks only).

**Art:** Ledger (a generic finance system), letterheads, a payee check result banner, and a generic bank screen with no real bank's look.

**Open questions:** **PINs to approve?** *Recommendation:* no. Approval is a named sign-off with the evidence attached; the lesson is the independent check, not the keypad. Keep `dual-auth`'s two-panel look.

### MG-16 AI assistant chat

**Priority and size:** P2, M. Scripted: no real language model is called, so answers are predictable, safe and free, and nothing a learner does is sent anywhere.

**Used for:** core_15 (Lark Assist: summarising a complaint after removing what shouldn't go in; a draft report with an invented statistic to catch; Martin pasting the pricing model into a free public chatbot; an email with hidden instructions that the assistant picks up); role_04 (an assistant that suggests a package that doesn't exist; secrets in pasted code); core_17.

**What the player does:**

1. **Gets a task** ("Summarise this complaint for the team meeting") and opens Lark Assist, the approved assistant.
2. **Pastes:** the clipboard shows what is about to go in. The player can remove parts first (names, health details, a client's figures) using the annotated document, or paste it all.
3. **Reads the answer:** scripted and mostly good. One answer contains a confident statistic with a source that doesn't exist; "Check this" opens the source or The Lark, and the player flags it.
4. **Chooses the tool:** a public chatbot site (an MG-02 page) sits beside Lark Assist, and the player sorts tasks between them ("rewrite our public job advert" is fine anywhere; "summarise this contract" only in the approved one).
5. **Spots a trick:** asked to summarise an email, the assistant suggests forwarding a file to an outside address, because the email hid instructions for it. The player doesn't act on it, and reports the email.
6. **Talks to Martin** about the pricing model in the public tool (spotted as in BE-10, then a `person-chat` scene).

**What it teaches:** use the approved tool; don't paste personal data, confidential or client information, passwords, or code containing secrets; check what it tells you; you're responsible for what you send; AI tools can be steered by the content they read.

**Configuration:** `assistant {name, approved, avatar}`, `tasks[] {id, input, mustRemove[], responses[] {id, text, flags}, checks[]}` (flags: `inventedFact`, `followsHiddenInstruction`), `publicTool {page}`, `sortTasks[]`, `assess`.

```json
{
  "assistant": { "name": "Lark Assist", "approved": true, "avatar": "lark_assist" },
  "tasks": [{
    "id": "summarise_complaint",
    "input": "content/complaint_record.json",
    "mustRemove": ["resident_names", "health_details"],
    "responses": [{ "id": "r1", "text": "Laundry complaints rose 40% last year (Northern Facilities Index, 2025).", "flags": ["inventedFact"] }],
    "assess": { "behaviour": "C15-Bx", "onAction": { "removed_and_checked": "removed_and_checked", "removed_only": "removed_only", "pasted_all": "pasted_all" } }
  }]
}
```

**Events and records:** prefix `ai_`: `ai_pasted:<taskId>` (what was left in, what was removed), `ai_answer_checked:<responseId>`, `ai_fact_flagged:<responseId>`, `ai_tool_chosen:<taskId>` (approved or public), `ai_hidden_instruction_noticed:<taskId>`, `ai_output_used:<taskId>` (checked or not). Records: what went into the tool, whether answers were checked, and which tool was used for what.

**Builds on:** the `phone-chat` thread layout for chat bubbles; the annotated document; the page renderer for the public tool; m08's AI receptionist (`scenarios/m08_the_mole/ink/m08_receptionist_ai.ink`) as a tone reference for a helpful machine character.

**Accessibility notes:** the chat log is a live region; paste, remove and check are buttons; prompts are chosen, not typed.

**Art:** Lark Assist as a friendly pixel robot (a bust and a small avatar), a chat window, and a public chatbot site with a fictional name.

**Open questions:** **Let players type prompts?** *Recommendation:* no. Chosen prompts only, so nothing personal is typed and nothing needs moderating.

### MG-17 Caller verification desk

**Priority and size:** P3, M. One minigame with two skins: the service desk (role_03) and the contact centre (role_06).

**Used for:** role_03 ("Gillian" locked out at the airport demanding an MFA reset now; a "new contractor" who needs admin rights today; an app asking for mailbox access); role_06 (school business managers asking for changes; a caller using details from someone else's breach; a relative who seems to be being scammed; a card payment by phone); sector_01 (a "relative" asking about a patient).

**What the player does:**

1. Works a queue of calls, chats and tickets (left), the current contact (centre) and the organisation's verification checklist (right).
2. Chooses verification steps from a list: strong ones (call back on the number on record, a code sent to the registered device, manager approval, a video check) and weak ones (date of birth, home address, anything public on a social profile).
3. Watches the caller's pressure rise (NPC influence, `docs/NPC_INFLUENCE.md`); the procedure never needs speed.
4. Decides: go ahead, call back, refuse politely, or escalate.
5. Adds ticket notes from a structured list.

**What it teaches:** verification that resists social engineering; questions with public answers verify nobody; call back on the number on record; follow the procedure under pressure; protect customers who are being scammed.

**Configuration:** `skin` (`service_desk`, `contact_centre`), `queue[] {id, channel, npcId, knot, claims, record, pressure}`, `checklist[] {id, text, strength}`, `actions[]`, `assess`.

**Events and records:** prefix `caller_`: `caller_check_used:<contactId>` (step, strength), `caller_verified:<contactId>`, `caller_refused:<contactId>`, `caller_escalated:<contactId>`, `caller_actioned:<contactId>` (reset, change, payment). Records: the strongest check used before each action, and any action taken for a caller who wasn't verified.

**Builds on:** MG-04 for calls; `person-chat` and `phone-chat` ink; `siem` and `log-filter` for role_03's alerts (after the fixes in section 4); NPC influence.

**Accessibility notes:** captions; no timers; the queue length is shown but never counts against the player.

**Art:** a headset desk view, queue cards and a generic customer record panel.

**Open questions:** none.

### MG-18 Access review

**Priority and size:** P3, S.

**Used for:** role_05 (a new starter's access request: pick the minimum; Leo moving to Finance: remove his Operations access; a leaver's checklist; a review table with stale accounts); role_03 (privileged accounts); role_07 (a supplier's accounts still live at the end of the contract); core_14 lightly.

**What the player does:**

1. Reads a table of people, systems and permissions, with role, manager, last sign-in and start or end dates.
2. Decides each row: keep, remove, reduce, or ask the manager.
3. For a joiner, picks the smallest set from the role's template.
4. For a leaver, completes the same-day checklist (account off, devices back, mailbox handed over).
5. Submits, and sees what was removed, kept and missed.

**What it teaches:** least privilege; movers lose their old access; leavers lose access the same day; review regularly.

**Configuration:** `rows[] {person, role, system, permission, lastUsed, status, expected}`, `joiner {role, template[], minimum[]}`, `leaverChecklist[]`, `assess`.

**Events and records:** prefix `access_`: `access_row_decided:<rowId>`, `access_joiner_granted` (anything beyond the minimum), `access_leaver_item:<itemId>`, `access_review_submitted` (removals missed, access removed that was still needed).

**Builds on:** `warranty-checklist`'s rows and verdict buttons, generalised (section 4).

**Accessibility notes:** a real table with row headers; the verdicts are radio groups.

**Art:** a generic admin console.

**Open questions:** none.

### MG-19 Code review

**Priority and size:** P3, M.

**Used for:** role_04 (a code review with an injection and a missing access check; a pull request that includes a cloud key; an assistant-suggested package that doesn't exist; a test database copied from production).

**What the player does:**

1. Reads a short change (10 to 40 lines) in a generic code review view.
2. Selects a line and picks the problem from a list (injection, missing access check, secret in the code, unknown package, real data in tests, sensitive data in logs).
3. Picks the fix (a parameterised query; an ownership check; move the secret to the vault and rotate the key; check the package is the real one; use made-up test data).
4. Approves the change or asks for changes.
5. For the leaked key, chooses between "delete it in a new commit" and "rotate the key, then clean the history". Rotating is the point.

**What it teaches:** common flaws, at awareness level; a leaked secret must be rotated, not just deleted; check packages before adding them; no real customer data in tests.

**Configuration:** `files[] {path, lines[] {n, text, change}}`, `issues[] {id, lines[], type, fixes[], fix, why}`, `decoys[]`, `assess`.

**Events and records:** prefix `code_review_`: `code_review_flagged:<issueId>`, `code_review_false_flag:<line>`, `code_review_fix_chosen:<issueId>`, `code_review_submitted` (verdict). Records per issue.

**Builds on:** `log-filter`'s row flagging (`JS/minigames/log-filter/log-filter-minigame.js`); `forensic-data-platform`'s tables; links out to Hacktivity's `lab_vulnerabilities` and `lab_exploitation` for depth.

**Accessibility notes:** code shown as a table with line numbers; arrow keys move line by line; each line is read with its change marker ("added", "removed"); colour is never the only marker.

**Art:** a dark code review theme with no real product's look.

**Open questions:** **Which language?** *Recommendation:* one short JavaScript or Python example per edition, plain enough that comments carry the meaning for non-specialists.

### MG-20 Knowledge check

**Priority and size:** MVP, M. Folder `JS/minigames/knowledge-check/`, scene `knowledge-check`, object type `knowledge_check` (The Lark's "spot check" page on a terminal). It also opens from ink (BE-19), as a drill (BE-07) and in the text route (BE-03). It is the first new minigame to build (section 5).

**Used for:**

- **Every module's Check beat:** five or six items drawn from the module's bank, covering every outcome (core_01 draws six from the eleven in its `assessment.md`).
- **The mentor's check question** in each Learn beat (EX-01): one item opened from the conversation ("Which part of this address is the real domain?").
- **core_00:** four questions on the motto and the reporting route.
- **core_16:** the lunchtime game show "Allowed, Not Allowed, or Ask First?", with answers taken from the organisation's policy settings (HA-11).
- **core_05:** a quick "Is this personal data?" sort.
- **core_17:** a longer check across the core outcomes.
- **Test-out, retakes and monthly drills.**

**Item types:**

1. **Single choice,** with feedback on every option.
2. **Multiple select** ("Choose all that apply"), with feedback on every option. In an assessed check an answer needs every right option and no wrong one; practice can give partial credit.
3. **Hotspot:** click the part of a picture or a piece of text that answers the question (the domain in an email header, the badge in a photo, the risky line in a post). Regions are defined in data. Every region, right or wrong, can be reached by keyboard and has a text name, so keyboard and screen reader users make the same choice as everyone else.
4. **Ordering:** put the steps in order. More than one order can be accepted where the content allows (core_01's Q4 accepts its first two steps either way round).
5. **True or false with reason:** choose true or false, then the reason. Full marks need both, and the feedback covers both.
6. **Sort into groups** (an addition to the catalogue's list): place each card in a group ("Allowed", "Not allowed", "Ask first"; "Personal data", "Not personal data"). It drives core_16's game show, core_05's drill and MG-10.

**Banks.** Items are written from each module's `assessment.md`. Every item has an id, a version, its outcomes, its type, its difficulty and any organisation slot: core_01's Q11 is dropped where the organisation runs no phishing simulations. In the MVP the items ship inside each module version (a bank file such as `content/check_bank.json` in the module's scenario folder); with HA-08 the platform holds the banks, lets organisations add their own items and retire weak ones, and answers MG-20's request for a sitting. The draw follows HA-08: six items by default, at least one per outcome, at most two organisation items, nothing from the learner's previous attempt while unseen items remain for that outcome, and options shuffled except in ordering items.

**Feedback.** Every option has its own line, written the way a colleague would say it ("Right. Check through a route the attacker doesn't control."). In core and role modules the feedback shows after each answer, because answering and then seeing why is good practice. In the capstone and a test-out it waits until the end, so the check stays an assessment.

**Pass marks and retakes.** The default pass mark is 80% (5 of 6); the organisation can change it. Not passing never ends anything: a retake draws fresh items, and after two attempts that don't pass, the mentor replays the Learn beat before the third (core_01's rule). The learner sees a result for each outcome (Secure, Developing, Not yet) as well as the score.

**Graded on the server when it counts.** For every item that counts as evidence (the Check, the mentor's question, a test-out), the answer keys stay on the server: the browser receives the drawn items without them, sends the chosen option ids, and gets back right or wrong and the feedback (BE-01). That's how `flag-station` treats flags: the answers never reach the client (`JS/minigames/flag-station/flag-station-minigame.js:17-21`). It keeps the record credible for auditors. Practice and drill items can be graded in the browser.

**Presentations.** One engine with several looks:

- **Spot check** (the default): The Lark's intranet style, one item per screen, "Question 2 of 6".
- **Mentor question:** one item opened from the conversation by BE-19 (`#trigger_minigame:knowledge_check|<configKey>`). The conversation closes, the item opens with no score shown, and the conversation reopens with the result in a global (`kc_<configKey>` set to `correct` or `incorrect`) so the mentor's next line can branch: a fixed voiced line ("That's it." or "Not quite. Look at the end of the address."), with the specific feedback as text, so no voiced line prints a variable. Showing the item over the conversation panel without closing it is a later addition to MG-20, which BE-19 puts at a few days.
- **Game show** (core_16): Ama and Owain host in the kitchen with buzzers, a scoreboard and gentle sounds; the same items, mostly sort into groups and single choice. core_16's plan sets out the details: labelled buzzers on keys 1 to 3, the other contestants' answers shown after the player locks in, rounds, and no speed scoring.
- **Drill:** a streak and an optional timer.

**What the player does:**

1. Opens the check: Kai's spot check on The Lark, or the mentor asks a question.
2. Reads the start screen: how many questions, no time limit, feedback after each one.
3. Answers each item and presses Check, sees the feedback on their choice and why the right answer is right, and presses Next.
4. Sees the result: the score, a line per outcome, and either "Passed" with a link to the reference card, or "Let's try a few more" with a fresh set.

**What it teaches:** recall of each module's key messages in workplace situations; the act of recalling is itself practice (`01_LEARNING_DESIGN.md`, "Check last"). It also produces the evidence an auditor recognises.

**Configuration.** The check and the bank are separate. The check's `minigameData`:

```json
{
  "type": "knowledge_check",
  "name": "The Lark: security spot check",
  "minigameData": {
    "checkId": "core01_spot_check",
    "presentation": "spot_check",
    "mode": "check",
    "bank": "content/check_bank.json",
    "draw": { "count": 6, "coverOutcomes": true, "excludeLastAttempt": true, "maxOrgItems": 2 },
    "passMark": { "correct": 5, "of": 6, "orgSetting": "check_pass_mark" },
    "feedback": "after_each",
    "scoring": "server",
    "retake": { "freshDraw": true, "mentorAfterAttempts": 2, "mentorEvent": "core01_relearn" },
    "onPass": [{ "type": "complete_task", "taskId": "spot_check" }],
    "onNotPassed": [{ "type": "emit_event", "event_name": "core01_check_not_passed" }]
  }
}
```

Bank items, one of each type, taken from core_01's `assessment.md`:

```json
[
  {
    "id": "C01-Q1", "version": 1, "type": "single", "outcomes": ["C01-LO2"],
    "stem": "Which website does this link really go to?",
    "code": "https://larkspur.co.uk.secure-login.info/mail",
    "options": [
      { "id": "a", "text": "larkspur.co.uk", "feedback": "\"larkspur.co.uk\" is only at the front. Read the domain from the right-hand end." },
      { "id": "b", "text": "secure-login.info", "correct": true, "feedback": "Right. The real domain is the part just before the first single slash, read from the right." },
      { "id": "c", "text": "mail", "feedback": "That is the page on the site, not the site itself." }
    ]
  },
  {
    "id": "C01-Q3", "version": 1, "type": "multiple", "outcomes": ["C01-LO1"],
    "stem": "\"From the Chief Executive. Complete the staff survey by 12:00. Most of your team already has.\" Which pressures is it using?",
    "options": [
      { "id": "a", "text": "Authority", "correct": true, "feedback": "It claims to come from the top." },
      { "id": "b", "text": "Urgency", "correct": true, "feedback": "A deadline in a couple of hours." },
      { "id": "c", "text": "Social proof", "correct": true, "feedback": "\"Most of your team already has.\"" },
      { "id": "d", "text": "Reward", "feedback": "Nothing is offered here." }
    ]
  },
  {
    "id": "C01-Q9", "version": 1, "type": "hotspot", "outcomes": ["C01-LO2"],
    "stem": "Click the part that shows this email isn't from Larkspur.",
    "target": {
      "kind": "text",
      "regions": [
        { "id": "name", "text": "Larkspur IT Service Desk", "feedback": "Anyone can set the display name." },
        { "id": "user", "text": "servicedesk@", "feedback": "The part before the @ can be anything." },
        { "id": "domain", "text": "larkspur-support.net", "correct": true, "feedback": "Right. The domain shows where it really came from." }
      ]
    }
  },
  {
    "id": "C01-Q4", "version": 1, "type": "ordering", "outcomes": ["C01-LO6"],
    "stem": "You typed your password into a page from an email link, then realised it was fake. Put these steps in order.",
    "steps": [
      { "id": "report", "text": "Report it with the Report button and call the service desk." },
      { "id": "change", "text": "Change your password by going to the real site yourself." },
      { "id": "elsewhere", "text": "Change the same password anywhere else you used it." },
      { "id": "follow", "text": "Follow the service desk's further instructions." }
    ],
    "accept": [["report", "change", "elsewhere", "follow"], ["change", "report", "elsewhere", "follow"]],
    "feedback": "Telling the service desk first matters most: they can lock the attacker out while you change the password."
  },
  {
    "id": "C01-Q6", "version": 1, "type": "true_false_reason", "outcomes": ["C01-LO3"],
    "statement": "If an email has no spelling mistakes and the logo looks right, it's probably genuine.",
    "answer": false,
    "reasons": [
      { "id": "r1", "text": "Phishing emails are usually badly written.", "feedback": "Not any more. Attackers use translation and AI tools." },
      { "id": "r2", "text": "Well-made phishing can look perfect, so judge what it asks for and check another way.", "correct": true, "feedback": "Right." }
    ]
  }
]
```

Other keys: `presentation` (`spot_check`, `mentor`, `game_show`, `drill`); `items` (inline items, for a mentor question); `timer` (drills only, off by default); `showOutcomeResults`; `reviewAtEnd`. In the text route a hotspot becomes a choice between the region names, scored the same way.

**Events and records:** prefix `check_`: `check_started:<checkId>` (attempt, seed, items drawn), `check_item_answered:<itemId>` (response, right or not, outcomes), `check_completed:<checkId>` (score, pass mark, result, attempt), `check_passed:<checkId>`, `check_not_passed:<checkId>`, `check_left:<checkId>` (closed part-way; progress is kept). Records: BE-01's `check_item` for each answer (the item id and version, the options in the order shown, the response and the attempt; the server adds right or wrong and the outcomes) and `check_result` for each sitting (the score, the pass mark, the result, the seed, the route (game, text, test-out) and the attempt count). BE-14 turns these into xAPI "answered" and "passed" statements, and HA-05 keeps the sitting.

**Builds on:**

- `coverage-decision-form` for the choice items: sections of options, a submit gate, and completion actions that write the chosen value or whether it matched (`JS/minigames/coverage-decision-form/coverage-decision-form-minigame.js:22-28`);
- `warranty-checklist`'s verdict buttons for sort into groups;
- `shredded-document`'s reordering for ordering items, with keyboard moves added;
- `flag-station`'s server-side checking (answers validated by `POST /games/:id/flags`) for assessed scoring;
- m01 Kevin's five-question "security audit" in ink (`scenarios/m01_first_contact/ink/m01_npc_kevin.ink`), the precedent for a check inside a conversation;
- the shared feedback panel, seeded draw and annotated document (section 1).

**Accessibility notes:**

- Native radio buttons and checkboxes in a fieldset whose legend is the question.
- Hotspots: every region is a focusable button with a text name, in reading order.
- Ordering: Move up and Move down buttons on every step, with the new position announced; dragging is an extra.
- Feedback goes to a polite live region and takes focus, with Next as the following tab stop.
- No time limit except an optional one in drills; leaving and coming back keeps progress.
- Right and wrong are shown with a tick, a cross and the words "Right" and "Not quite", never by colour alone.
- The text route asks the same items, with the same scoring and the same records.

**Art:** The Lark's page style and tick and cross icons. For the game show: a kitchen redress with two buzzers and a scoreboard (new props), with Ama and Owain's busts.

**Open questions:**

1. **Feedback after each item or at the end?** *Recommendation:* after each in core and role modules; at the end in the capstone and test-out.
2. **Partial credit for multiple select?** *Recommendation:* none in assessed checks; partial credit in practice.
3. **Bank size.** *Recommendation:* 8 to 12 items per module, as the brief asks, rising to about 20 for modules with monthly drills so repeats are rare.
4. **Per-outcome results for learners.** *Recommendation:* show them, in plain words ("Reading web addresses: Secure").

### MG-21 Video player

**Priority and size:** P2, M; the first version is S. Folder `JS/minigames/video-player/`, scene `video-player`, object type `video_screen` (the meeting room screen, a laptop, the kitchen television). It also opens from ink when a colleague says "Watch this" (BE-19).

**Used for:**

- **Engine-recorded explainers (EX-02):** 60 to 120 seconds on a screen in the world, as the Learn beat or beside the mentor (`01_LEARNING_DESIGN.md`). The module plans so far place videos in core_00, core_01, core_03, core_05, core_07, core_09, core_11 and role_01.
- **core_01's optional "Sixty-second phish"** on the meeting room screen, linked from the reference card.
- **Produced videos (EX-03):** the course introduction (`DECISIONS_PENDING.md`, D7) and leaders' content in role_01.
- **Facilitated sessions (BE-15),** played on the shared screen.
- **Reference cards** on The Lark (BE-09), where a short video sits beside the card.

**The first version (S): a hosted page in the lab workstation.** The `lab-workstation` object already opens any HTTPS page in a near-full-screen iframe (`JS/utils/lab-workstation.js`; the markup is at `app/views/break_escape/games/show.html.erb:107-121`). A video page hosted by Hacktivity (HA-20), or a HacktivityLabSheets page with an embedded video, gives a working video screen with no new minigame. It needs two small fixes: the popup's title always reads "Lab Sheet" (`show.html.erb:112`), and closing it tells the game nothing. Its limits: no record that the video was watched (the page belongs to another site, so it would have to message the game), captions depend on the host's player, and the "open in new tab" button takes people out of the game. Good enough for optional videos in the first pilots; not for a video that is the Learn beat.

**The full version (M): an HTML5 player in a framed screen.**

- **Captions** from WebVTT files (`<track kind="captions">`), on by default, with the choice remembered and options for caption size and background. One caption file per language (BE-06).
- **A transcript** beside the video, with speaker names, the words, and short descriptions of anything shown but not said. It's a full alternative, and the text route uses it.
- **Chapters** from a WebVTT chapters track, listed as buttons that jump to each part.
- **Description of visuals.** Videos are scripted so the narration says what's on screen ("Look at the address: it ends in account-verify.net"), which in most cases avoids the need for a separate audio description track. A video that can't do that gets a described version (SC 1.2.5).
- **Controls:** play and pause, a seek bar, back and forward 10 seconds, speed (0.75 to 1.5), volume, captions, transcript, and a larger view inside the overlay. All are labelled buttons with keyboard shortcuts (Space or K to play, arrows to seek, C for captions, T for the transcript).
- **No autoplay with sound.** The player opens paused on a poster frame with a large Play button, the length ("1 min 40") and "Captions on". An in-world screen may loop a silent, captioned preview, but sound starts only when the learner presses Play (`explainers_video_and_npc.md`, video standards). Game music fades while a video plays and returns afterwards.
- **A watched record.** The player keeps track of which parts were actually played, so it can record both that the learner played the video and the share of the running time played (for example 94%). HA-20 counts a video as watched at 90% played or when the transcript is opened, so reading counts the same as watching. Whatever the rule, it is never a gate (see open question 4).
- **Resume.** The position is saved (state-sync) and offered next time ("Carry on from 0:48").
- **Never forced.** A Skip button is always there, and the story never waits on a video: forcing anyone to sit through one would break the no-required-waits rule (BE-04) and annoy experienced staff. A skip is recorded, and a module that needs the content covered follows it with the mentor's short version or a check question.
- **Afterwards,** an optional MG-20 mentor question about the video.
- **Hosting and formats.** Files sit on Hacktivity's video hosting (HA-20: Hacktivity or a UK or EU sub-processor named under HA-15) or in the game's own assets: MP4 (H.264 and AAC) at 720p, plus 480p for slow connections, with the poster, captions, chapters and transcript beside each video. The game page already allows video from its own site and HTTPS hosts (`media_src` in `app/controllers/break_escape/games_controller.rb:15-25`). Self-hosting is preferred to public video platforms: no tracking cookies on learners (HA-15) and a dependable watched record.
- **Low bandwidth.** Nothing loads until Play; a "transcript only" mode suits thin clients.

**What the player does:**

1. Walks up to the meeting room screen, or Ama says "Here, watch this on my laptop". The video opens in a frame that matches the object.
2. Sees the poster: the title, the length, the chapters, "Captions on", Play, and "Read the transcript instead".
3. Watches, and pauses, rewinds, changes speed or opens the transcript as they like.
4. Carries on when they like: Close at the end, or Skip at any point. A skip is recorded, and the mentor can give the short version.
5. Answers the optional question.

**What it teaches:** whatever each video teaches. The player's job is to make the EX-02 and EX-03 explainers usable by everyone and to record that they were seen.

**Configuration:**

```json
{
  "type": "video_screen",
  "name": "Meeting room screen",
  "minigameData": {
    "videoId": "core01_sixty_second_phish",
    "version": 1,
    "title": "Sixty-second phish",
    "frame": "meeting_room_screen",
    "sources": [
      { "src": "https://media.example/awareness/core01/phish60-720.mp4", "type": "video/mp4", "label": "720p" },
      { "src": "https://media.example/awareness/core01/phish60-480.mp4", "type": "video/mp4", "label": "480p" }
    ],
    "poster": "https://media.example/awareness/core01/phish60-poster.png",
    "captions": [{ "src": "https://media.example/awareness/core01/phish60.en-GB.vtt", "srclang": "en-GB", "label": "English", "default": true }],
    "chapters": "https://media.example/awareness/core01/phish60.chapters.vtt",
    "transcript": "https://media.example/awareness/core01/phish60.transcript.html",
    "description": "integrated",
    "durationSec": 62,
    "autoplay": false,
    "silentPreview": true,
    "transcriptOpenCountsAsWatched": true,
    "afterwards": { "checkItem": "C01-V1" },
    "onWatched": [{ "type": "set_global", "key": "core01_video_watched", "value": true }],
    "fallback": { "kind": "hosted_page", "url": "https://media.example/awareness/core01/phish60.html", "popupTitle": "Meeting room screen" }
  }
}
```

(`media.example` stands for the HA-20 host.)

**Events and records:** prefix `video_`: `video_opened:<videoId>`, `video_played:<videoId>`, `video_paused:<videoId>`, `video_chapter_chosen:<videoId>`, `video_transcript_opened:<videoId>`, `video_watched:<videoId>` (how much was played, and whether through the video or the transcript), `video_skipped:<videoId>`, `video_closed:<videoId>` (position and how much was played). Records: a BE-01 `milestone` for watched or skipped, with the route, the share played, the time spent and the video's id and version (HA-19); BE-14 turns "watched" into an xAPI "experienced" statement. Captions use is counted only in aggregate (section 1, "Records").

**Builds on:** one player component shared with HA-20's pages in Hacktivity ("MG-21 uses the same player in the game", `hacktivity.md`); `lab-workstation` (`JS/utils/lab-workstation.js`) for the first version; `person-chat`'s video-call frame (`person-chat-ui.js:243-314`) for the look of a framed screen; the TTS voices (`JS/systems/tts-manager.js`) that EX-02 videos are recorded with; the dialogue caption styles; state-sync for resume. There is no video code in the engine today: no `<video>` element or caption track anywhere in `JS/`.

**Accessibility notes:** captions on by default (SC 1.2.2); a full transcript; integrated or separate description of visuals (SC 1.2.3, 1.2.5); every control reachable by keyboard with visible focus; no autoplay with sound (SC 1.4.2); anything moving can be paused (SC 2.2.2); videos checked for flashing before release (SC 2.3.1); speed control; video volume separate from game music; state changes ("Playing", "Captions on") announced.

**Art:** frames for the meeting room screen, a laptop and the kitchen television, matching `conference_screen1.png`, `laptop*.png` and `smartscreen.png` in `assets/objects/`; a poster frame per video. The videos themselves are EX-02's and EX-03's work.

**Open questions:**

1. **Where the first version's pages live.** *Recommendation:* Hacktivity's video hosting (HA-20), so a later version can post "watched" back to the game.
2. **Making a video required.** *Recommendation:* never. Where a video is the Learn beat, a skip leads to the mentor's short version and the check question, so the evidence still comes from the learner's answers.
3. **Public video platforms.** *Recommendation:* no, for learners' privacy (HA-15) and a dependable record.
4. **One definition of "watched".** `explainers_video_and_npc.md` says watched means opened and played; HA-20 says 90% played or the transcript opened. *Recommendation:* HA-20's rule, which an auditor can rely on, with the explainers plan's promise kept: nothing waits on it and Skip is always there. MG-21 records enough for either rule.

### MG-22 Supplier assessment

**Priority and size:** P3, S.

**Used for:** role_07 (three bidders for a rostering system with glossy answers and uneven evidence; the contract clauses; a breach notice six months later; the supplier's accounts still live at the end of the contract, with MG-18).

**What the player does:**

1. Reads a questionnaire grid: the questions (MFA on remote access? Cyber Essentials? What does the ISO 27001 certificate cover? How soon are breaches reported? Subcontractors? Data deleted at the end?) against three bidders' answers.
2. Opens the evidence (a certificate and its scope, an assurance report extract with an exception, a policy) and judges each answer: evidenced, claimed only, a gap, or a red flag.
3. Picks the contract clauses to ask for (breach notice within a set time, audit rights, MFA on supplier access, data returned and deleted, approval of subcontractors).
4. Sees a summary for each bidder and makes a recommendation: evidence beats claims, and the cheapest bid isn't always the riskiest.

**What it teaches:** proportionate due diligence; evidence over claims; check what a certificate actually covers; the contract clauses that matter.

**Configuration:** `questions[]`, `bidders[] {name, answers{} {text, evidence, verdict}}`, `documents{}`, `clauses[] {id, text, importance}`, `assess`.

**Events and records:** prefix `supplier_`: `supplier_answer_judged:<bidderId>` (question, verdict), `supplier_evidence_opened:<docId>`, `supplier_clause_chosen:<clauseId>`, `supplier_assessment_submitted` (gaps found and missed, the recommendation).

**Builds on:** `warranty-checklist` (a verdict per row behind an evidence gate); `forensic-data-platform` and `claims-management-system` for the evidence documents; MG-25 to check a certificate's scope.

**Accessibility notes:** the grid is a table with headers for questions and bidders; verdicts are radio groups.

**Art:** a questionnaire screen and generic certificate and report documents; scheme names appear as text only, with no real certification marks.

**Open questions:** **How much assurance report detail?** *Recommendation:* one short extract with one exception to notice.

### MG-23 Device settings

**Priority and size:** P2, S as one data-driven settings panel with a phone skin and a laptop skin; M if each skin gets its own full set of screens (section 6).

**Used for:** core_07 (the shared warehouse PC that has put off its update for six weeks; the player's own phone updates; its plan also proposes a "pop-up triage" mode, where prompts and alerts arrive one at a time to be answered Go, Stop and report, or Ask IT first); core_09 (screen lock, encryption, updates, approved apps, the lost phone and its remote wipe, with MG-14 as a panel); core_17.

**What the player does:**

1. Opens Settings on a phone or a laptop, with sections for screen lock, updates, encryption, backup, app permissions, find my device and, for MG-14, Wi-Fi.
2. Works through Owain's checklist ("Get your phone ready for the field"): a screen lock of six or more digits or a fingerprint; install the waiting updates and restart; check that encryption is on; take a torch app's access to contacts and location away; remove an app that isn't approved.
3. Gets one line of why for each change, and "Device ready" at the end.
4. After losing the phone (core_09), reports it (MG-09) and watches IT lock and wipe it (BE-16).

**What it teaches:** use a screen lock; update quickly and restart; encryption; app permissions; approved apps only; report a lost device at once.

**Configuration:** `device` (`phone`, `laptop`), `settings[] {id, section, label, state, target, why}`, `updates[] {id, postponedDays, restart}`, `apps[] {name, permissions[], approved}`, `checklist[]`, `assess`.

**Events and records:** prefix `device_`: `device_setting_changed:<settingId>` (from, to, meets the target), `device_update_installed:<updateId>`, `device_app_removed:<appId>`, `device_permission_removed:<appId>`, `device_ready`, `device_reported_lost`. Records: the checklist and anything left undone.

**Builds on:** the `container` desktop mode for the laptop; `phone-chat`'s phone frame for the phone; `alarm-panel`'s status lamps (`JS/minigames/alarm-panel/`) for a readiness summary.

**Accessibility notes:** toggles with labels and their state in words; a restart is a short skip, not a wait.

**Art:** a generic phone settings screen and laptop settings window; icons for fictional apps.

**Open questions:** **Two skins or one?** *Recommendation:* one panel with two skins to begin with.

### MG-24 Crisis decision board

**Priority and size:** P2, M, as an extension of `command-board`. A group vote in facilitated mode (BE-15) may push it to L (section 6).

**Used for:** role_01 (a ransomware crisis compressed from 36 hours into 30 minutes: who to call in; whether to isolate and lose deliveries to schools and hospitals; whether and when to notify the ICO; what to tell clients, staff and the press; the ransom demand and the threat to leak data; what to restore first. Faisal advises, and Anne-Marie asks the questions a regulator would ask); core_17's team mode (HA-13).

**What the player does:**

1. Reads the board: the incident timeline, status rows (services, regulator, communications) and the clock.
2. Gets an inject card ("02:00. Ransomware found on the finance servers.") with two to four decision cards.
3. Asks the advisers (Faisal, Ama, Tomasz, Hassan). Each gives a short view, and some decisions are genuinely arguable.
4. Decides. The decision is stamped on the timeline and changes the status rows; later injects depend on earlier choices.
5. Moves time on with "Go to 06:00": time moves by injects, not in real time.
6. In facilitated mode the room votes and the facilitator confirms (BE-15).
7. Finishes with a debrief against the principles of the UK Cyber Governance Code of Practice (as role_01's concepts file verifies them) and the NCSC Board Toolkit.

**What it teaches:** cyber risk is business risk; decisions prepared in advance are easier; notification duties and their timing; communications; what to weigh about a ransom; recovery priorities.

**Configuration:** extends the board's existing `commandBoard` block (title, subtitle, preseed, timeline and status rows: `command-board-timeline.js:14-25`) with `injects[] {id, at, condition, title, body, advisers[] {npcId, line}, options[] {id, label, actions[], principle}}`, `principles[]`, `facilitated` and `assess`.

```json
{
  "commandBoard": {
    "title": "Larkspur Group: incident decision board",
    "injects": [{
      "id": "isolate",
      "at": "Sat 02:00",
      "title": "Ransomware on the finance servers",
      "body": "Kai: it's spreading. Cutting the network stops it, but schools and hospitals get no deliveries tomorrow.",
      "advisers": [{ "npcId": "faisal_karim", "line": "What's our worst case if we wait an hour?" }],
      "options": [
        { "id": "isolate_now", "label": "Isolate now", "actions": [{ "type": "set_global", "key": "isolated_early", "value": true }], "principle": "prepared_response" },
        { "id": "wait", "label": "Wait for more information", "actions": [{ "type": "set_global", "key": "spread_wider", "value": true }], "principle": "risk_ownership" }
      ]
    }]
  }
}
```

**Events and records:** prefix `crisis_`: `crisis_inject_shown:<injectId>`, `crisis_adviser_asked:<injectId>` (who), `crisis_decision:<injectId>` (the option, and whether one person or the room decided), `crisis_time_moved` (to when), `crisis_completed`. Records: each decision, the principle it relates to, and the advice heard before it.

**Builds on:** `command-board` (`JS/minigames/command-board/`: a recorder that stamps entries as globals change, status rows, the game clock); `backup-recovery`'s option cards that lock in a choice; `ncsc-brief`'s sealed document for a briefing opened mid-crisis (once relabelled, section 4); sis01's decision and debrief patterns, and sis03's insurance thread (`claims-management-system`, `coverage-decision-form`).

**Accessibility notes:** no real-time deadline unless a facilitator sets one; injects and the timeline are lists; status changes are announced; decision cards are buttons.

**Art:** the board room screen (`room_zds_conference`, redressed), inject cards and status lamps.

**Open questions:** **Real-time pressure?** *Recommendation:* off; a facilitator can run a clock in a live session.

### MG-25 Document inspector

**Priority and size:** P2, M.

**Used for:** core_10 (a "fire safety inspector's" ID and work order; a visitor's booking); core_11 (Northbeck's letterhead against the supplier record); role_02 (invoices against purchase orders; duplicate invoices); role_05 (a remote candidate's documents); role_06 (an "engineer's" work order at the front desk, optional); role_07 (a certificate's scope). It is also the base of MG-15 and MG-22.

**What the player does** (steps: Compare, Mark, Decide):

1. **Compare:** two panes, the document being checked (a letter, an invoice, an ID badge, a work order) and a trusted reference the organisation already holds (the supplier record, the visitor list, the purchase order, the booking system).
2. **Mark** the fields that don't match by selecting them. A magnifier shows the detail: a different phone number, an edited account number, a domain one letter off, a date that falls on a Sunday.
3. **Explain** harmless differences by checking another source (a new logo announced on The Lark).
4. **Decide:** accept, refuse and report, or check another way (call back through MG-04; ring the visitor's host).
5. Gets feedback on what was found, what was missed, and what matters most (bank details and phone numbers far more than a logo).

**What it teaches:** compare with records you already hold; the contact details in a document can't vouch for it; small edits matter; if in doubt, check another way.

**Configuration:** `document {kind, look, fields[] {id, label, value, region}}`, `reference {source, fields[]}`, `differences[] {field, kind: edited|added|harmless, why}`, `decisions[]`, `assess`.

```json
{
  "document": { "kind": "work_order", "look": "contractor_letterhead", "fields": [
    { "id": "company", "label": "Company", "value": "Kestrel Lane Fire Safety" },
    { "id": "visit_date", "label": "Visit date", "value": "Sunday 18 October" },
    { "id": "contact", "label": "Office number", "value": "0161 496 0777" },
    { "id": "areas", "label": "Areas", "value": "All areas, including the comms room" }
  ] },
  "reference": { "source": "Visitor bookings", "fields": [
    { "id": "company", "value": "Kestrel Lane Fire Safety" },
    { "id": "visit_date", "value": "No visit booked" },
    { "id": "contact", "value": "0161 496 0300" }
  ] },
  "differences": [
    { "field": "visit_date", "kind": "edited", "why": "No visit is booked, and the date is a Sunday." },
    { "field": "contact", "kind": "edited", "why": "The number differs from the one on record, so ringing it proves nothing." }
  ],
  "decisions": ["accept", "refuse_and_report", "check_another_way"]
}
```

**Events and records:** prefix `inspect_`: `inspect_field_marked:<docId>` (the field, right or not), `inspect_reference_opened:<docId>`, `inspect_decision:<docId>`, `inspect_completed:<docId>` (found, missed, wrongly marked). Records: differences found and missed, and the decision.

**Builds on:** `forensic-data-platform` (two kinds of evidence and a gated confirm); `examine` for the close-up; the dusting minigame's compare step, which lays reference cards side by side (`JS/minigames/dusting/dusting-game.js`); MG-20's hotspot regions.

**Accessibility notes:** the comparison is also a table ("The document says" against "Our record says"), so nobody has to hunt through an image; zoom without pixel hunting; marking with buttons.

**Art:** document templates (letterhead, invoice, ID badge, work order) and a pixel-art magnifier.

**Open questions:** **Image-based or field-based documents?** *Recommendation:* field-based with an image skin, so documents are cheap to write and accessible. Forged documents stay non-instructional: the lesson is "check against what you hold", never how forgeries are made.

## 4. Existing minigames: reuse and fixes

File names without a folder are in that minigame's own folder under `JS/minigames/`; other paths start from `JS/` or the repository root. Size is the work to make each one reusable in the course, not to build it.

| Minigame | Course use | Generalisation or fix needed | Size |
|---|---|---|---|
| `person-chat`, including video-call mode | Every conversation; the mentor (EX-01); people at the door (core_02, core_10); video calls (core_09's whiteboard, core_15's deepfake call); the conversation engine for MG-04 | The call bar's "SECURE VIDEO LINK", "LIVE" and "YOU" are fixed in code (`person-chat-ui.js:251-273`): take them from scenario data ("Larkspur Meet"). Add screen sharing in a call for BE-08 | S |
| `phone-chat` | Texts, the team chat, voicemail; the base of MG-04 and MG-05 | Only two looks, the default and `terminal` (`phone-chat-ui.js:32`): add a skin registry, link destinations and a Report action per thread (MG-05) | S to M, as MG-05 |
| `notes`, `text-file` | Memos, policy extracts, sticky notes, printed emails (EX-04) | None for reuse. Pictures in notes would help EX-04's posters | none |
| `examine` | A found USB stick, a badge, a QR sticker, a poster | None | none |
| `container` | Clean desk sweeps, bins, the player's PC | Its desktop mode (`container-minigame.js:17-23`) could host the work apps (section 6) | S |
| `forensic-data-platform` | An evidence viewer with a confirm step (core_11, role_02, role_07); the base of MG-15, MG-22 and MG-25 | Its completion actions handle only `set_global` and `complete_task` (`forensic-data-platform-minigame.js:262-271`): use `applyActions`, and send a BE-01 record when the player confirms. Add block types for an image with regions and a side-by-side comparison | S |
| `claims-management-system` | Read-and-acknowledge policy tabs (core_16 with BE-09); role_01's insurance thread | The default title "Meridian Claims Management System" (`claims-management-system-minigame.js:4`), sis03's claim reference and "Coverage Analysis Workspace" as the subtitle (`:419`), the "Evidence Relevance" panel (`:369`) and the "CMS Print Queue" alert (`:281`) are fixed, and it always writes `cms_reviewed` (`:183-187`). Take all of them from data | S |
| `coverage-decision-form` | role_01's decisions; the base of MG-09 and of MG-20's choice items | "Meridian Cyber Insurance" in the header (`coverage-decision-form-minigame.js:77-81`), the submit button and the "recommendation logged" badge (`:83-85`, `:106`) are fixed, and the starter fixes the title (`JS/systems/minigame-starters.js:1037-1052`). Make them data; add per-option feedback and a BE-01 record | S |
| `warranty-checklist` | The base of MG-18, MG-22 and MG-20's sort into groups | sis03's title and claim reference are the default (`warranty-checklist-minigame.js:4`); the verdicts Compliant, Arguable and Breached are fixed (`:6-10`); it is gated on the global `warranty_evidence_reviewed` (`:114`) with a note naming sis03's evidence (`:209-211`), writes `warranty_checklist_complete`, `ins001_assessed` and `ins003_assessed`, and its alert names a sis03 character (`:132-146`). Make all of these data | S |
| `ncsc-brief` | A sealed security bulletin that opens after a step (core_04, role_01) | The envelope reads "NCSC Attribution Brief", with a TLP banner and a "sealed" badge in code (`ncsc-brief-minigame.js:76-108`), and the starter fixes the title (`JS/systems/minigame-starters.js:1004-1019`). The course must never present a document as a real agency's, so every label comes from data ("Larkspur security bulletin") | S |
| `shredded-document` | core_06's attacker view: Jo pieces together a draft from the recycling | Drag and drop only (`shredded-document-minigame.js:216-290`): add Move up and Move down buttons and announce the order (SC 2.5.7) | S |
| `password` | A weak or written-down password in use (core_03's sticky notes, Kev's shared PC); sign-in moments | None: it is entry only, and MG-08 covers making passwords | none |
| `pin` | Shoulder-surfed door codes (core_10); MG-07's code entry | The backlog's PIN fixes: lengths other than four when the server keeps the PIN (`JS/systems/minigame-starters.js:535`), the `window.startPinMinigame` clash (`JS/minigames/index.js:202`), Cancel showing "PIN Rejected" | S |
| `flag-station` | A free-text answer checked on the server, where a role module needs one; its server check is the model for MG-20's scoring | Uses the browser's own `confirm()` box (`flag-station-minigame.js:556`, `:564`), which can't be styled or relabelled: use the shared dialog | S |
| `dual-auth` | Two-person approval (core_11, role_02, MG-15) | Not registered in `minigames/index.js`, with no starter and no dispatch. It writes sis01's globals (`itsec_authorised`, `clinical_eng_authorised`, `network_isolation_authorised`, `network_isolated`, `dual_auth_failed`: `dual-auth-minigame.js:203-308`); its PINs are `itsec_pin` and `clinical_pin` (`scripts/minigame-data-schemas.json:110-113`) and sit in the page; a five-minute timer fails the approval (`:20`, `:304-318`); the keypads take clicks only; the title is fixed (`:10`); and the server has no `dual_auth` unlock method (`app/models/break_escape/game.rb:883-892`). Its text is already overridable (`dual-auth-text.js`). For the course: named approver panels with a checklist instead of PINs, globals from data, no timer by default | S to M |
| `backup-recovery` | "Choose your response" cards: core_07's restore, seen behind the scenes; role_01 | Global names are fixed (`backup_recovery_source`, `recovery_eta_hours`, `backup_restore_initiated`, `backup_reinfected`: `backup-recovery-minigame.js:336-426`) and the default sources are sis01's | S |
| `esd-pushbutton` | A guarded "stop the payment" or "isolate" button with a confirm step | Already data-driven (`esd-pushbutton-minigame.js:6-25`); add a plain office look | S |
| `command-board` | The base of MG-24 (role_01); Kai's incident timeline (core_04) | Defaults are sis01's (`command-board-timeline.js:30-39`) but overridable through `commandBoard` (`:14-25`), a different key from every other minigame's `minigameData`; it needs injects and decision cards (MG-24) | M, as MG-24 |
| `alarm-panel` | A status board (device readiness, incident status) | None | none |
| `ransomware-display` | What an infection looks like (core_07, core_04), seen, not played | The starter opens it only when the global `ransomware_deployed` is true (`JS/systems/minigame-starters.js:618-623`): make the condition a setting. Check its art suits the calm tone (no skulls) | S |
| `siem` (registered as `siem-dashboard`) | role_03's alerts | The starter passes only `timeLimitSec` (`JS/systems/minigame-starters.js:658-672`), so `alertConfig` in `minigameData` never reaches the minigame, which would look it up in its own `ALERT_SETS` (`siem-dashboard-minigame.js:245`). Support inline `alerts` (the TODO at `:240-244`); make the 180-second timer optional (`:238`); the title is fixed (`:233`) | S |
| `log-filter` | role_03's impossible-travel sign-ins; the base of MG-19's line flagging | None for reuse | none |
| `network-segmentation-map` | IT staff (role_03); a possible base for core_04's spread view (section 6) | Four fixed zone slots (external, enterprise, clinical, legacy: `network-segmentation-map-minigame.js:7-10`) and a fixed "ACTIVE INCIDENT" badge (`:57`) | M, for core_04 |
| `rfid`, `lockpicking` | core_10's attacker view with Jo (EX-06, BE-11) | None; keep the framing at awareness level | none |
| `cryptex`, `combination` | A padlock on a confidential waste bin or a key safe (core_06, core_10), if a module wants one | No server unlock method: they call `apiClient.unlock` with `'cryptex'` and `'combination'` (`cryptex-minigame.js:316`, `combination-minigame.js:259`), which the server's `UNLOCK_METHODS_BY_LOCK_TYPE` doesn't list (`app/models/break_escape/game.rb:883-892`), so it refuses them | S |
| `ehr-terminal` | sector_01 ("only open the records you need") | Check the fit when sector_01 is planned | unknown |
| `lab-workstation` (an object type, `JS/utils/lab-workstation.js`) | The Lark (BE-09); the first versions of MG-21 and MG-02 | The popup title is always "Lab Sheet" (`app/views/break_escape/games/show.html.erb:112`); closing it emits nothing; "open in new tab" leaves the game | S |
| `dusting` | No course use | The model for staged minigames (section 1) | none |

**Fixes that apply to every minigame:**

- **Fifteen minigames define their own `setGlobalAndNotify` (or `_setGlobalAndNotify`),** and the copies differ: some go through `npcManager.setGlobalVariable`, some write the scenario's copy as well (for example `shredded-document-minigame.js:18-35` against `dual-auth-minigame.js:320-331`). One shared helper should replace them.
- **No overlay is a proper dialog.** None declares `role="dialog"` or `aria-modal`, none moves focus in and back out, and the base close button is a bare "×" with no accessible name (`JS/minigames/framework/base-minigame.js:23`).
- **Completion events name the class, not the scene.** `minigame_completed` and `minigame_failed` carry `minigameName: this.constructor.name` (`base-minigame.js:101-105`); they should also carry the registered scene name, which the manager already stores (`JS/minigames/framework/minigame-manager.js:104`).
- **Old minigame numbers in the code.** Comments and saved state keys use the SIS games' own minigame numbers: `forensic-data-platform` calls itself MG-02 and `network-segmentation-map` MG-04, `JS/systems/interactions.js:989` labels the claims system "SIS03 MG-01", sis01's scenario calls `dual_auth` MG-11 (`scenarios/sis01_healthcare/scenario.json.erb:34`, which core_11's README quotes), and `siem` and the command board save under `mg01_siem_state` and `mg12_command_board_state`. They have nothing to do with this catalogue. Leave the saved keys alone (old saves use them), but mark the comments so nobody reads `MG-04` in the code as voice calls.

## 5. Build order

Four waves, following the roadmap in `00_COURSE_OVERVIEW.md`. Within a wave, items are listed in the order to start them.

### Wave 0: foundations (phase 0, with BE-01, BE-04 and BE-19)

1. **The shared building blocks** (section 1): first the record and event helpers, the feedback panel, the accessible dialog and the seeded draw, because MG-20 needs them and every later minigame reuses them.
2. **MG-20 Knowledge check.** Every module needs it. It is the smallest new minigame that runs through the whole evidence chain (a BE-01 record, server-side scoring, HA-05), and it proves BE-19 (Ama's question opens inside her conversation and hands back to it) and BE-03 (the same items as text). Build single choice and multiple select first, then ordering, true or false with reason, hotspot, and sort into groups. The game show look comes last; core_16 can use the spot check look until then.
3. **Small fixes that unblock early modules:** a title that can be set on the `lab-workstation` popup (for The Lark, BE-09), the video-call bar text, and registering `dual-auth` with its globals moved into data.

### Wave 1: the MVP course (phase 1, Induction Essentials)

4. **MG-01 Inbox,** started as soon as the shared blocks exist, in four slices that are each playable:
   1. reading, sender details, link destinations, Report and scheduled arrivals (core_00, and core_01's hook);
   2. practice mode with MG-03 inline (core_01's Practise beat);
   3. the browser panel with pre-filled fake pages, and attachments (core_01's Apply beat);
   4. reply, forward, and compose with recipient checks (core_05, then core_06).

   It starts early because it is the largest build, core_01 is the course's showcase, and four MVP modules use it.
5. **MG-09 Incident report form:** small, and the main action in core_04 and in core_05's breach report.
6. **MG-07 MFA prompts** and **MG-08 Password manager,** together: core_03 and core_00 need both, and they share the phone frame and the page renderer.
7. **MG-12 Redaction** for core_05; it reuses the annotated document built for MG-20's hotspots.
8. **core_04's spread view** (proposed in section 6), because core_04 is an MVP module whose main mechanic has no catalogue entry yet.

### Wave 2: the core library and first role paths (phase 2)

9. **MG-21 Video player:** the hosted-page version as soon as EX-02 has a first video (it is S), then the full player alongside HA-20.
10. **MG-05 Messaging apps,** then **MG-04 Voice calls,** for core_02, core_11 and core_15. MG-04 also replaces the `phone-chat` stand-in for core_01's call to Northbeck.
11. **MG-25 Document inspector,** then **MG-15 Payment verification desk** with the `dual-auth` rework, for core_10, core_11 and role_02.
12. **MG-02 Web browser,** reusing MG-01's page renderer, then **MG-06 QR code scanner,** which needs MG-05's phone and MG-02's pages: core_08 and core_02.
13. **MG-10** and **MG-11** (core_06); **MG-23** with MG-14 as one of its panels (core_07, core_09); **MG-16** (core_15); **MG-24** (role_01).

### Wave 3: the rest (phase 3)

14. **MG-13** (core_12); **MG-17,** built on MG-04 (role_03, role_06, sector_01); **MG-18** (role_05); **MG-19** (role_04); **MG-22,** built on MG-25 (role_07).

### Why this order

- **Evidence first.** Nothing in the assessment trail works without BE-01, MG-20 and HA-05 (`features/README.md`, Dependencies), and MG-20 is the cheapest way to prove that trail end to end.
- **Shared parts before the minigames that use them.** The address reader, the page renderer and the annotated document each serve four to six minigames. MG-01 builds the page renderer MG-02 needs; MG-25 builds the comparison MG-15 and MG-22 need; MG-04 builds the call engine MG-17 needs.
- **Reuse.** MG-20 and MG-01 serve the most modules; MG-19 and MG-22 serve one each.
- **Risk early.** MG-01 is the largest build and the one where transfer to real inboxes matters most, so it reaches playtests with real staff first.
- **Accessibility from the start.** The shared blocks carry the accessibility patterns, so later minigames inherit them instead of having them retrofitted.

## 6. Catalogue notes (proposals)

For the orchestrator. Nothing here changes an id.

**Not in the catalogue:**

- **proposed:** Incident spread map, a floor or network map on which an incident spreads with game time until someone reports it, and is then contained. It is core_04's main mechanic (the "blast radius") and suits core_07's ransomware spread. It could extend `network-segmentation-map` (M). It is needed for the MVP, because core_04 is. core_07's plan (a scene status panel) and core_14's (a rumour map) propose views that could share it.
- **proposed:** Work desktop, the player's PC as a generic desktop that opens the inbox, browser, chat, The Lark and settings, and shows new-mail and chat notifications. It extends the `container` desktop mode (S to M, MVP with MG-01), makes "your computer" one consistent place across modules, and gives BE-18's interruptions somewhere to appear.
- **proposed:** Tactic card, a bingo-style card of persuasion tactics (authority, urgency, fear, helpfulness, flattery, insider jargon) that the player ticks off as they hear them, scored in the debrief, for core_02 (S, P2). core_02's README proposes the same card as an overlay under an id of its own (BE-22); it needs one catalogue id, as an MG or a BE.

**Minigame proposals in the module plans so far,** and where each fits:

- core_07's "pop-up triage": a feed mode of MG-23, S on top of it.
- core_16's game show mode: MG-20's game show presentation (above).
- core_05's "Down to One" board (a grid of faces that clues rule out one by one): a variant of MG-13's board or MG-20's sort into groups, S to M.
- role_06's secure payment line (card digits reach the adviser masked while the recording pauses): a keypad overlay built on `pin`, S, also useful for role_02.
- core_06's keyboard controls for `shredded-document`, core_11's `dual-auth` rework, and core_09's and role_05's video-call bar label are the fixes in section 4.

**Priority and size:**

- **MG-03:** P2, but core_01 (MVP) uses it inline. The inline part should be MVP; it is mostly the shared address reader.
- **MG-14:** P3, but core_09 is P2. Make it P2 as a panel of MG-23; the size stays S.
- **MG-20:** M is right. core_16 (MVP) wants the game show look, so either build that look in the MVP or let core_16 start with the spot check look.
- **MG-23:** S holds only as one data-driven panel with two skins; full phone and laptop screens would make it M.
- **MG-24:** M as an extension of `command-board`; L with the facilitated group vote (BE-15).
- **MG-02:** stays L, but its risk drops if MG-01's page renderer is built as a shared part.
- **MG-09:** S holds with structured fields; marking free text would make it M and raise data protection questions.
- **MG-01:** L; plan it as four slices so core_00 and core_01 aren't held up by compose.

**Wording in the catalogue:** MG-03's "at speed" and MG-24's "timed" should read "with an optional timer" (principle 5), and MG-09's "speed" means how soon in story time, never how fast someone types.
