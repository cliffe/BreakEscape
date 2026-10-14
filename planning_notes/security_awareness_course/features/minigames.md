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

## 2. Summary

Wave is the build wave in section 5 (0 foundations, 1 the MVP course, 2 the core library and first role paths, 3 the rest).

| Id | Minigame | Priority | Size | Main modules | Builds on | Wave |
|---|---|---|---|---|---|---|
| MG-01 | Inbox | MVP | L | core_00, core_01, core_04, core_05, core_06, core_07, core_11, core_13, core_17, role_02, sector_01 | `phone-chat` threads and timed messages, scenario timers, `notes` markdown, `container` desktop | 1 |
| MG-02 | Web browser | P2 | L | core_08; pages for core_01, core_07, core_09, core_13 | MG-01's page renderer, `forensic-data-platform` blocks, `lab-workstation` | 2 |
| MG-03 | Link and domain drill | P2 (inline part MVP) | S | core_01, core_08, core_02, drills | address reader, MG-20 hotspot, dusting step list | 1 inline, 2 drill |
| MG-04 | Voice calls | P2 | M | core_02, core_11, core_15, core_01, role_02, role_03, role_06, sector_01 | `phone-chat`, `person-chat`, TTS | 2 |
| MG-05 | Messaging apps | P2 | S | core_02, core_01, core_03, core_04, core_11, core_14, core_15 | `phone-chat` | 2 |
| MG-06 | QR code scanner | P2 | S | core_02, core_17 | `examine`, MG-05, page renderer | 2 |
| MG-07 | MFA prompts and authenticator | MVP | M | core_03, core_00, core_04, core_17 | `pin`, `phone-chat`, game clock | 1 |
| MG-08 | Password manager and passphrase builder | MVP | M | core_03, core_00, core_17 | `password`, page renderer | 1 |
| MG-09 | Incident report form | MVP | S | core_04, core_05, core_09, core_10, core_14, core_17 | `coverage-decision-form` | 1 |
| MG-10 | Classification sorter | P2 | S | core_06, core_17 | MG-20 sort item, `warranty-checklist` | 2 |
| MG-11 | Sharing settings | P2 | S | core_06, core_13 | `coverage-decision-form`, `warranty-checklist` | 2 |
| MG-12 | Redaction | MVP | M | core_05, core_06 | annotated document, `text-file`, `notes` | 1 |
| MG-13 | Social media profile and OSINT board | P3 | M | core_12 | MG-05, BE-10, BE-11 | 3 |
| MG-14 | Wi-Fi and VPN picker | P3 (P2 proposed) | S | core_09 | MG-23, page renderer | 2 |
| MG-15 | Payment verification desk | P2 | M | core_11, role_02 | MG-25, MG-04, `dual-auth`, `forensic-data-platform` | 2 |
| MG-16 | AI assistant chat | P2 | M | core_15, role_04 | `phone-chat` layout, annotated document, page renderer | 2 |
| MG-17 | Caller verification desk | P3 | M | role_03, role_06, sector_01 | MG-04, `siem`, `log-filter` | 3 |
| MG-18 | Access review | P3 | S | role_05, role_03, role_07 | `warranty-checklist` | 3 |
| MG-19 | Code review | P3 | M | role_04 | `log-filter` | 3 |
| MG-20 | Knowledge check | MVP | M | every module | `coverage-decision-form`, `flag-station` server checks, m01's ink quiz | 0 |
| MG-21 | Video player | P2 | M (first version S) | EX-02 and EX-03 videos in any module, core_01, role_01 | `lab-workstation`, `person-chat` frame | 2 |
| MG-22 | Supplier assessment | P3 | S | role_07 | `warranty-checklist`, `forensic-data-platform`, MG-25 | 3 |
| MG-23 | Device settings | P2 | S | core_07, core_09, core_17 | `container` desktop, `phone-chat` phone frame | 2 |
| MG-24 | Crisis decision board | P2 | M | role_01, core_17 team mode | `command-board`, `backup-recovery` | 2 |
| MG-25 | Document inspector | P2 | M | core_10, core_11, role_02, role_05, role_07 | `forensic-data-platform`, `examine`, dusting compare step | 2 |

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
          "outcomes": ["C01-LO5"],
          "rate": { "reported": "secure", "deleted": "developing", "ignored": "developing", "signed_in": "not_yet" },
          "rules": [{ "if": ["link_clicked", "reported", "!signed_in"], "rating": "developing" }]
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

**Events and records:**

- **Events** (prefix `email_`, plus `inbox_opened` and `inbox_closed`): `email_received:<id>`, `email_opened:<id>`, `email_sender_checked:<id>`, `email_link_checked:<id>` and `email_link_clicked:<id>` (with the link id), `email_attachment_opened:<id>`, `email_content_enabled:<id>`, `email_signin_submitted:<id>`, `email_reported:<id>`, `email_deleted:<id>`, `email_replied:<id>`, `email_forwarded:<id>`, `email_checked_another_way:<id>` (practice), `email_send_check_shown:<checkId>`, and `email_sent:<composeId>` (recipients, attachments, checks hit, corrected or not).
- **Records:** one per assessed email when its beat ends: the first decisive action and everything after it (core_01's "clicks, stops, then reports"), whether the sender details or the link were checked first, how many story events passed between arrival and report, and the rating from `assess`. In practice, per item: the choice, right or not, and the clue the player missed. For compose: recipients, checks hit, whether the player corrected. These cover core_01's C01-B1 to C01-B9, including the before and after (B1 against B2).

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
- The text route shows each email as text, with "Show sender details" and "Check where this goes" as actions and the same choices.
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
      "assess": { "behaviour": "C08-Bx", "rate": { "closed": "secure", "reported": "secure", "followed": "not_yet" } }
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

**Priority and size:** P2 in the catalogue, S. The inline version inside MG-01's practice mode is needed by core_01, an MVP module, so that part is built in wave 1 (section 6). It is an MG-20 item type plus a drill wrapper rather than a separate app.

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

**Used for:** core_02 (the Apply beat: covering the Operations line); core_01 (calling Northbeck on the directory number; the callback phish's number); core_11 (calling Dawn back; "Gillian" calling); core_15 (a cloned voice asking for money); role_02, role_03, role_06 and sector_01 (callers at work, with MG-17).

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
    "assess": { "behaviour": "C02-Bx", "rate": { "called_back_directory": "secure", "refused": "developing", "read_code": "not_yet" } }
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

**Used for:** core_02 (a parcel text; "Hi, it's me, new number" from "Gillian"); core_01 and core_04 (the team chat with Lena, Leo and Kai); core_03 (a chat from "IT" during the prompt storm); core_11 (a gift card request); core_14 (a "recruiter" message); core_15 (a voice note from "Leo"); sector_01.

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

1. Uses a QR code in the world (a sticker, a poster, a letter, an image in an email) and chooses "Scan with phone".
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

**Used for:** core_03 (enrolling, number matching, the 02:13 prompt storm and the "IT" chat asking the player to accept); core_00 (approving the first prompt, lightly); core_04 (a prompt the player didn't start, as a sign something is wrong); core_17.

**What the player does,** on a phone app and the laptop's sign-in, in stages:

1. **Set up:** add the work account to a generic authenticator app (scan a stylised code from the laptop), name it, try a test prompt, add a back-up method. The step list reads Add, Test, Back-up.
2. **A normal sign-in:** sign in on the laptop (pre-filled). The phone asks "Are you trying to sign in?", shows the app and a rough location, and asks for the number on the laptop screen (number matching). The player picks or types it.
3. **One-time codes:** a six-digit code that changes every 30 seconds. The countdown is decoration: any code from the last minute is accepted.
4. **A prompt they didn't start:** it arrives while they're doing something else. The choices are Approve, Deny, and "Deny and report: this wasn't me", as real apps offer.
5. **The prompt storm** (a time skip to 02:13, BE-16): prompt after prompt. With number matching on, the attacker's prompts ask for a number the player can't see. A chat from "IT" (MG-05) asks them to approve "so it stops". The right moves are deny, report, don't reply, and ring the 24/7 service desk. After the third prompt a single "Deny all and report" button appears, so nobody has to tap through a long storm.
6. **Someone asks for a code** on a call or in a message (MG-04 or MG-05). The code is never shared.
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
      "assess": { "behaviour": "C03-Bx", "rate": { "approved_any": "not_yet", "denied": "developing", "denied_and_reported": "secure" } }
    }
  ]
}
```

**Events and records:** prefix `mfa_`: `mfa_enrolled`, `mfa_prompt_shown:<promptId>` (whether the player started it), `mfa_prompt_approved:<promptId>`, `mfa_prompt_denied:<promptId>`, `mfa_prompt_reported:<promptId>`, `mfa_code_shared:<sceneId>`, `mfa_storm_ended` (approved any, number denied, reported or not). Records: approving a prompt the player didn't start is Not yet; denying without reporting is Developing; denying and reporting is Secure.

**Builds on:** the `pin` keypad (`JS/minigames/pin/pin-minigame.js`) for code entry; `phone-chat`'s phone and notifications; MG-05 for the "IT" chat; the game clock and BE-16 for the night-time skip; the `password` minigame's sign-in screen (`JS/minigames/password/password-minigame.js`) for the laptop side.

**Accessibility notes:** prompts stay until answered; the number to match is read out; typing a code is optional, because copying a code from one screen to another is the kind of memory task WCAG 2.2 SC 3.3.8 asks interfaces to avoid, so paste and "pick the matching number from three" are offered too; no shaking phone under reduced motion; the buzz is shown as well as heard.

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
5. **What you did:** ticks from a list that includes things not to do ("deleted the email", "tried to fix it myself"), so the form itself teaches.
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

**Builds on:** MG-20's sort item; `warranty-checklist`'s row and verdict buttons (`JS/minigames/warranty-checklist/warranty-checklist-minigame.js:158-200`); `notes` to read a document in full.

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
5. **Check:** "Select all and copy" or "Search for a name" shows whether anything is still there. A box-only redaction fails this check in plain view, and the debrief explains why.
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
  "assess": { "behaviour": "C05-Bx", "rate": { "all_removed": "secure", "tab_missed": "developing", "box_only": "not_yet" } }
}
```

**Events and records:** prefix `redaction_`: `redaction_marked:<spanId>`, `redaction_hidden_found:<kind>`, `redaction_applied` (remove or box), `redaction_checked` (what leaked), `redaction_completed` (missed, over-redacted, hidden content missed). Records: personal data left in, box-only redaction, hidden content missed.

**Builds on:** the annotated document (section 1), shared with BE-08; `text-file` and `notes` for the reading view; `forensic-data-platform`'s tables for the spreadsheet view.

**Accessibility notes:** marking by keyboard (move by word or sentence, Space to mark); marked text is announced and shown with a pattern as well as colour; "Mark every copy" helps people who find precise selection hard; no time pressure.

**Art:** a paper document style, black bars, and a small spreadsheet grid with a tab strip.

**Open questions:**

1. **How much of a real spreadsheet?** *Recommendation:* tabs and cells only, no formulas.
2. **Subject access requests.** *Recommendation:* keep the rule simple in the task text; Tomasz explains the detail in core_05.

<!-- append -->
