# Mail client extensions: plain send and DMs (design, 2026-10-30)

This is a design only. Nothing in the repo has changed. Paths are relative to the Break Escape repo root, and `mail-client/` means `public/break_escape/js/minigames/mail-client/`.

Inputs read: `docs/agents/MINIGAME_REUSE_REVIEW.md` (owner decision "Plain email and DMs in the mail client: design now"), `docs/agents/minigame_reuse/group_b.md` (mail-client findings 1–8), `README_scenario_design.md` (mail client, phone NPCs, actions), `scripts/scenario-schema.json`, `scripts/validate_social/mail.rb`, the lab and awareness scenarios (e6, e14), `planning_notes/eldritch_hacker/DIRECTION.md`, and the phone-chat minigame.

## What already exists (short version)

Some of this is half-built, which changes the cost estimates.

- **A send to a non-target is already unjudged.** In `mail-bridge.js:340-346` `performSend` stores a send to a contact with no `targetId` in Sent and judges nothing. The composer gates it on recipient only (`mail-composer.js:724-731`) and shows "This recipient is not a phishing target: the message is kept in Sent but is not judged and delivers nothing" (`mail-composer.js:858-861`). The catch is that it renders no subject or body at all: `_renderFrom/_renderSubject/_renderBody` only run `if (this.target)` (`mail-composer.js:862-870`). The send therefore has no content, no reply and no story effect.
- **An unjudged ink reply already exists.** The "Choose a reply" control writes a `kind: "quickReply"` Sent record and queues an ink continuation (`mail-client-minigame.js:994-1075`, README 2729). It only works on a thread a character target's `on_email` ink started, though.
- **The mail runner tolerates a job with no character.** Influence is bound only `if (influence && isStr(job.character))` (`systems/mail-runner.js:485`). `scheduleInkReply` and `scheduleChoiceReply` are the parts that insist on `social.characters[c].channels.email` (`mail-runner.js:582-590, 624-636`).
- **A shared action executor exists.** `systems/apply-actions.js:31` `applyActions` runs `set_global`, `emit_event`, `complete_task`, `give_item`, `grant_fact`, `hint` and others. It is used by `flagRewards` and `triggerOnInteract`.
- **Phone-chat already does most of what a DM thread needs.** Contacts are listed per `phoneId` (`phone-chat-ui.js:392-399`, `npc-manager.js:539`). Ink threads, `timedMessages` and `eventMappings` are in README 1275-1345. Threads persist in `phoneState` (`app/models/break_escape/game.rb:2025-2060`). There is a per-NPC visual theme (`phoneTheme`, schema enum `["terminal"]` at `scenario-schema.json:4096-4100`, applied at `phone-chat-ui.js:38,123-126`, passed in from `interactions.js:1569,1590`). Judged SE conversations with the influence meter also run there: a phone NPC's pretext call opens phone-chat (`pretext-prep/pretext-card.js:275`, `phone-chat-minigame.js:465-467`).
- **Awareness episodes read mail records, not chats.** The write stage's flip and the triage replay find the player's send in `mailState` (`episode-runner/episode-model.js:640, 804-822`; `inbox-triage/triage-messages.js:91-101`). DM-shaped *defend* items already exist as triage `kind: "sms"` (e14's "Messages and requests" set; `triage-kinds.js:23`). Even e6 ("texts and QR") writes its attack as an email in the phone frame (`attack.layout: "phone"`).

---

## (a) Plain, unjudged send

### Use cases

1. **SAFETYNET (m09/m10-style or a new mission).** Agent HaX emails: "Send me what you found on the jump server." Once the player has the log, they open the workstation mail, pick "Send HaX the jump-server log" with the log attached, and send. That sets `report_sent_to_hax`, completes the task `report_findings` and, after 20 s, brings HaX's reply (ink) that unlocks the next aim. A second case: forwarding a suspicious email the player found to the SOC, which sets a global used by a later NPC.
2. **Eldritch Hacker, Institute layer.** The player has a staff account at the Tesseract Research Institute. Replying to a colleague's routine "can you cover the Thursday seminar?" keeps the cover intact (`cover_kept_thursday`), and ignoring it raises suspicion later. This is ordinary correspondence beside the judged lures.
3. **Awareness.** In the defend debrief or an `_defend` episode, the learner replies to the genuine message ("yes, I'll put my name forward") or forwards the fake to the security mailbox, with no score. This is the "answer the real ones" half that e14's `genuineCopy` talks about. The send drives the debrief line and a global, and is not graded.

### Current architecture (file:line)

- Launch: `type: "mail_terminal"` → `interactions.js:1517` → `minigame-starters.js:1132-1156` passes `accountIds, defaultAccount, maxSends, layout, readOnly` (listed in `scripts/minigame-data-schemas.json:90-93`).
- Shell: `mail-client-minigame.js`. Send handler `_handleComposeSend` at `:817-850`. Close semantics at `:1128-1145` (`closeMode` aborts when nothing was sent, which is finding 1). Follow-ups at `:994-1075`.
- Composer: `mail-composer.js`. The target getter is at `:322-329`, message build at `:690-716`, gate at `:719-731`, render at `:851-875`. Every part (from/greeting/pretext/ask) is a phishing template.
- Bridge: `mail-bridge.js:328-470` `performSend`. The non-target branch is at `:340-346`, `gameResultOf` at `:289-300`, and the record is built at `:616-647`.
- Delivery: `systems/mail-scheduler.js`. Job kinds are `text`, `seed` and `ink` (`:12-20`, `_deliverText` `:546-570`), and it emits `mail_delivered` through `eventDispatcher` (`:437-444`).
- Ink replies: `systems/mail-runner.js` (`_splitTags` `:337-361` handles `#mail_later`, `#compose_reply`, `#subject`; delivery `:440-485`).
- Persistence: client whitelist `MAIL_MESSAGE_FIELDS` (`mail-scheduler.js:43-46`), server `MAIL_MESSAGE_KEYS`, `MAIL_JOB_KINDS` and `MAIL_JOB_STRING_KEYS` (`game.rb:2121-2127`).
- Schema: `scenario-schema.json:404+` (closed, `additionalProperties: false`). Lints: `validate_social/mail.rb` (`contact_checks` `:846-875`, `mail_terminals` `:897-927`).

### Options

**A1. Authored plain messages ("drafts"), picked not typed.** *Cost M.*
A new named list `social.mailClient.plainMessages[]`. Each entry is one message the player can send to one contact. It has a label, subject, body, optional attachment, an availability condition, `onSend` actions and an optional reply (canned text or ink). The composer gains a plain view for a contact that has no `targetId`: a "Message" picker that lists the available drafts and previews subject, body and attachment. The bridge gains a plain branch that writes a `kind: "plain"` Sent record, runs `applyActions(onSend)`, emits `mail_sent:<id>` and schedules the reply.
- For: every outcome is discrete, so story, ink, globals and objectives can all key on it. It fits the no-runtime-LLM rule. It reuses the existing non-target branch, `applyActions`, the text job and the mail runner. No SE vocabulary shows.
- Against: the player chooses rather than writes. For SAFETYNET that is the point (a report is evidence, not prose). Some new UI is needed, plus schema, lint and README work.

**A2. Free-text plain body only.** *Cost S.*
Turn on the existing `freeText` box for non-target contacts and add a subject field.
- For: cheap, and it feels like real email.
- Against: no game logic can read the text (no LLMs at runtime), so it cannot drive story beyond "something was sent to X". That fails the brief. It is worth keeping only as optional flavour on top of A1.

**A3. Permissive phish target ("trusts *", no required factors) with the checklist hidden.** *Cost S, data only plus one flag.*
- For: almost no code.
- Against: it still writes `phish_<id>_attempts` and metrics, shows "It landed. They acted on it." unless overridden, needs `factorStrings` to pass the lint, and the body is built from greeting/pretext/ask templates. It teaches the wrong model and leaks into the awareness report and board. Rejected.

**A4. Ink-authored compose (`#compose_plain` from any ink; the body options are ink choices run headless).** *Cost L.*
- For: the conversation decides what the player may write, which is very flexible.
- Against: it needs a headless ink run at compose time, a new composer mode fed by ink, and save handling for a half-built compose. Most of the benefit comes more cheaply from A1 plus an ink reply plus an `availableWhen` condition. Revisit only if A1's conditions prove too blunt.

### Recommendation

Build **A1**, with A2 as an opt-in flavour line on a draft (`ownWords: true`, never read by logic, as the existing `freeText` already works). Open the composer from ink through the owner's already-approved starter registry (`#trigger_minigame` keyed by object type, from the reuse review), with a `draft` param so HaX's "send it over" can open the right message pre-selected.

Two prerequisites from the "Now" bug batch: finding 1 (a read-only or plain-only mailbox should not close as a failure) and finding 3 (a `social.mailClient.labels` map). The plain view must not show "Write your reply. This one is judged", "Red flags" or the phishing-target note.

### Proposed scenario JSON

```json
"social": {
  "mailClient": {
    "mailboxes": [ { "id": "agent_inbox" } ],
    "accounts": [
      { "id": "agent", "kind": "given", "mailbox": "agent_inbox",
        "address": "agent0x00@safetynet.example", "displayName": "Agent 0x00",
        "person": null, "spoofsFrom": false }
    ],
    "contacts": [
      { "id": "hax", "name": "Agent HaX", "addresses": ["hax@safetynet.example"],
        "role": "Handler" }
    ],
    "payloadKit": [
      { "id": "kit_jump_log", "kind": "document", "label": "jump-server auth.log",
        "unlockedBy": "found_jump_log" }
    ],
    "seededMessages": [
      { "id": "hax_ask_report", "mailbox": "agent_inbox", "folder": "inbox",
        "from": { "name": "Agent HaX", "address": "hax@safetynet.example" },
        "subject": "Jump server", "body": "Send me what you find on the jump server.",
        "deliverAt": { "global": "entered_server_room" },
        "replyWith": ["send_hax_log", "tell_hax_nothing_yet"] }
    ],
    "plainMessages": [
      {
        "id": "send_hax_log",
        "to": "hax",
        "label": "Send HaX the jump-server log",
        "subject": "Re: Jump server",
        "body": "Log attached. Logins from 10.0.4.7 at 02:13, outside the change window.",
        "attachment": "kit_jump_log",
        "availableWhen": "found_jump_log === true",
        "once": true,
        "onSend": [
          { "type": "set_global", "key": "report_sent_to_hax", "value": true },
          { "type": "complete_task", "taskId": "report_findings" }
        ],
        "reply": { "ink": { "npc": "hax_mail", "knot": "on_log_report" }, "delaySeconds": 20 }
      },
      {
        "id": "tell_hax_nothing_yet",
        "to": "hax",
        "label": "Tell HaX you have nothing yet",
        "subject": "Re: Jump server",
        "body": "Nothing yet. Still looking.",
        "availableWhen": "found_jump_log !== true",
        "reply": { "text": "Keep at it. Check the auth logs.", "delaySeconds": 15,
                   "onDelivered": [ { "type": "hint", "message": "HaX suggests the auth logs." } ] }
      }
    ]
  }
}
```

Field notes:
- `to` is a `contacts[]` id. A contact must not have both a `targetId` and plain messages (lint error), so one recipient is never sometimes judged and sometimes not. A contact with neither keeps today's behaviour.
- `availableWhen` uses the eventMappings condition grammar (`npc-manager.js:16 safeEvaluateCondition`) against globals. A draft whose condition is false is not listed. When no draft is available, the To list shows the contact greyed out with "Nothing to send yet" (wording through `labels`).
- `once: true` hides the draft after one send (checked against the Sent records' `draftId`, so it holds across reloads).
- `attachment` names a `payloadKit` id. `payloadKit[].unlockedBy` is new and gates a kit item on a global (both judged and plain composers honour it). Forwarding a received message is `"forwards": "<seeded id>"`: it shows as a quoted original under the body, and the record keeps the id.
- `replyWith` on a seeded message adds a "Reply" button in the reader that opens the composer on that contact, limited to those drafts. Without it, drafts are reached through Compose.
- `reply` takes exactly one of `text` (canned, a text job) or `ink` (`npc` is an NPC record id with a `storyPath`; `knot` is the entry). `delaySeconds` is optional (default `DEFAULT_REPLY_DELAY_SECONDS` 20, `mail-scheduler.js:50`). `onDelivered` actions run when the reply lands.
- `ownWords: true` (optional) shows the existing free-text box under the draft as flavour only.

### Replies and NPC responses

- **Canned:** `scheduleTextJob` with a new `actions` payload. The job stores `draftId`, and `_deliverText` looks the actions up from the scenario at delivery time, so the scenario data is never copied into the save. The reply threads under `plain:<contact>:<account>`.
- **Ink:** a new `scheduleInkPlainReply(scheduler, { npcId, knot, message, account })` in `mail-runner.js` builds the same `ink` job with no `character`. The runner already skips influence for that case (`:485`). The run gets a small variable set: `email_plain_id` (the draft id), `email_to`, `email_account`, `email_in_reply_to`. The `email_*` fixed set stays defaulted. Ink tags behave as for character mail: `#subject`, `#mail_later` for chasers, game tags through `processGameActionTags` (so `#set_global`, `#complete_task` and `#give_item` work), and ending on choices gives "Choose a reply". `scheduleChoiceReply` needs the same no-character route, so the thread key becomes `plain:<npcId>:<accountId>`. `#compose_reply` is ignored on a plain thread. A new `#compose_plain:<draftId>` could later open a pre-selected plain draft.
- **Which NPC record:** recommend a dedicated record per mail persona (for example `hax_mail`, `npcType: "phone"` with no `phoneId`, or a headless record like `emailRecord`) with its own ink file. Sharing the phone NPC's id means the mail run's `recordInkVariables` and the phone thread's saved story both write that NPC's saved state, which risks one clobbering the other. Shared facts go through globals.
- **Events:** the send emits `mail_sent` `{ draftId, contactId, accountId }` and `mail_sent:<draftId>` through `eventDispatcher`, so phone NPCs' `eventMappings` can react (HaX texts "Got it" on the phone). Delivery already emits `mail_delivered`. Add `mail_reply_delivered:<draftId>`.

### Save and reload

- The Sent record is `kind: "plain"` with a new `draftId` field. Add `draftId` to `MAIL_MESSAGE_FIELDS` (`mail-scheduler.js:43-46`) and `MAIL_MESSAGE_KEYS` (`game.rb:2121-2125`). `kind` is already kept.
- `onSend` actions write globals through `writeGlobal`/`applyActions`, which persist with `globalVariables`. Order: commit the record, then run the actions. On reload, `once` and `availableWhen` read the record and globals, so a draft cannot be sent twice. A crash between the two leaves a record without its globals. That is the same window the judged path has today, so I'd accept it rather than add a ledger.
- The reply job persists as today (`jobs`). Text jobs need `draftId` added to `MAIL_JOB_STRING_KEYS` (`game.rb:2127`). Ink jobs reuse the runner's reload idempotency (`reply_<jobId>`, `se_mail_applied`).
- Drafts (the half-built compose) persist through the existing `drafts` section. Add `plainId` to `MAIL_DRAFT_KEYS` (`game.rb:2128`).

### Validator and tests

Schema (`scenario-schema.json`): add `plainMessages` under `mailClient`, `unlockedBy` on `payloadKit` items, and `replyWith` on seeded messages. The validator should also accept a `social` block holding only `mailClient` with no `phishTargets`/`templates`. I haven't run this: confirm it with a fixture first.

Lints (new `validate_social/mail.rb` section `plain_messages`):
- unique ids; `to` is a contact id; that contact has no `targetId` (error);
- `attachment`/`forwards` name a kit id / a seeded id; `replyWith` ids are plain messages to the seeded sender's contact;
- `reply` has exactly one of `text`/`ink`; `ink.npc` names an NPC record with a `storyPath` and the knot exists in the compiled ink (reuse the knot check the email-stories lint uses, `mail.rb:953+`);
- `onSend`/`onDelivered` action types are known (`apply-actions.js` list); `complete_task` ids exist; `set_global` keys and `availableWhen` globals are declared (`declared_written`/`declared_read`, `mail.rb:97-113`);
- warn when a draft can never become available (its `availableWhen` global is never written), and when a contact has neither drafts nor a target but is revealed (today's dead-end send).

Tests (node `.test.mjs`, beside the `social-mail-*` set):
- `social-mail-plain-composer`: the plain view lists only available drafts, hides the SE controls and copy, and gates Send on a draft being chosen.
- `social-mail-plain-bridge`: `performSend` for a plain draft writes `kind: "plain"`, `draftId`, no metrics, no `phish_*_attempts`, runs the actions once, emits `mail_sent:<id>`, and schedules a text or ink job.
- `social-mail-plain-runner`: an ink job with no character runs, delivers, applies tags, stores choices, and continues by `scheduleChoiceReply`.
- `social-mail-plain-reload`: `once` survives a reload, and the reply job survives and delivers once.
- `social-mail-plain-isolation`: `findSentRecord` (episode-model) and the triage `classifySent` ignore `kind: "plain"`. Add the skip at `episode-model.js:808`, because `findSentRecord` with a null `targetId` would otherwise pick a plain record up.
- `validator-social-mail`: the new lints, plus a SAFETYNET-shaped fixture with only `mailClient`.
- One live proof with the playtest bridge on a small test scenario (`test_mail_plain/`). Helper tests alone have missed live breakage before.

### What must not change

- Every judged path: `phishTargets`, the factor judge, checklist, metrics, `phish_<id>_attempts`, `outcome.setGlobal`, `withReply`, the link and landing-page paths, and the `#compose_reply` follow-up.
- A contact with no `targetId` and no plain messages behaves exactly as now (stored, unjudged, no reply, today's note).
- Awareness: `maxSends`, `sentIds`, `layout: "phone"`, `closeMode` for episode children, and the flip and triage replay picking the judged send.
- The close result shape for an existing terminal. Plain sends get `outcome: "sent"`, `plain: true` only when one was made.
- Server caps and the mailState section layout. The new keys are additive.

---

## (b) DMs and the social-feed variant

### Use cases

1. **SAFETYNET.** A contact the player reaches over an encrypted messenger rather than the handler phone, such as an informant on a "Signal-like" app in m09, or ENTROPY chatter on a seized phone the player reads and answers. Conversational, ink-driven, unjudged.
2. **Eldritch Hacker, cult layer.** The player DMs a cult member met on the forum, builds rapport, then talks the membership gatekeeper into an invitation. The gatekeeper chat is judged (suspicion meter), while ordinary members' DMs are plain story. DIRECTION.md:39-42 and :87-92 put DMs, the forum and the gatekeeper on the cult side and `senderAuth` on the email side only.
3. **Awareness.** A Friendface DM thread in an episode, either as a defend item ("a stranger asks how your IT is run") or as a short genuine exchange with a colleague. The defend side already exists as triage `kind: "sms"` (e14). A composed *attack* DM (writing the lure as a DM rather than an email) does not exist anywhere yet.

### Current architecture (file:line)

- Phone-chat: `phone-chat-minigame.js` (controller; requires `npcId` or `phoneId`, `:43-47`), `phone-chat-ui.js` (markup with a hard-coded "Messages" header, signal bars and battery `:78-95`; `theme` at `:38`; contact list per phone `:392-399`), `phone-chat-conversation.js` (ink), `phone-chat-history.js` (history through `npcManager`), and voice, speaker and choice helpers.
- Launch: an inventory `type: "phone"` item or object with `phoneId`/`npcIds` (`interactions.js:1557-1592`). The theme comes from the first NPC's `phoneTheme` (`:1569`) or the object's `theme` (`:1590`). Conversation mappings `conversationMode: "phone-chat"` and `timedConversation` are covered in README 1221-1345.
- Judged conversation: `person-chat/person-chat-pretext.js` (`attachPretext`, `opts.chat: 'phone'` `:559`). The debrief copy is call-specific ("Call debrief", "The call was reported", `:450-466`). Influence channels are `person|phone|email` (`social-influence.js:41,58,202,241`).
- Persistence: `phoneState` per NPC (history and story state; `game.rb:2025-2060`), plus `pretext_<callId>_state` in globals.
- Mail-client side, for comparison: the composer is email-shaped (From, Subject, Send as, sender auth, attachments, link), the reader is folder and list based (`mail-reader.js`), and the episode runner's flip and the triage replay read mail records (`episode-model.js:640,804`; `triage-messages.js:91-101`).

### The key question: mail-client layout or phone-chat?

The evidence favours **phone-chat for DMs**, with one exception kept for later.

- A DM is a running conversation with a person, and phone-chat already is one: bubbles, typing indicator, ink choices as the player's lines, timed messages, event mappings, voiced or silent, saved per thread, and reopenable mid-choice (README 1323-1340). The mail client's model is the opposite: an asynchronous single send, a reply delay, and then at most one "Choose a reply" step per delivery.
- The judged DM Eldritch needs most (the gatekeeper) is a social conversation with a suspicion meter. That is the pretext-call mechanic, and it already runs inside phone-chat for phone NPCs (`pretext-card.js:275`). The phish judge's factors are email-shaped. `senderAuth` cannot apply, and DIRECTION.md:88 says so.
- Phone-chat already has a skin hook (`phoneTheme`, used by m02 and m07 for the terminal look) and per-device contact lists (`phoneId`). A "Friendface" app is a second `phoneId` with its own contacts and theme, with no new state section.
- The exception is a *composed, judged lure sent as a DM* (an awareness attack stage on social media, or an Eldritch forged-invitation DM built from templates and intel). That needs the composer, the phish judge minus `senderAuth`, and the mail records the flip and triage replay read. Only the mail client has those. DIRECTION.md:87 expected the mail client to get the DM variant, and this is the part of that expectation that holds.

### Options

**B1. Mail-client `layout: "dm"` for every DM.** *Cost L.*
Re-render the reader as bubble threads and strip the composer of subject, Send as and auth. Conversations come from ink replies and "Choose a reply" chains.
- For: one engine for all messaging, and judged DMs come for free.
- Against: it rebuilds what phone-chat already has (threads, typing, live ink, choices, voice, mappings). Multi-turn chat through reply jobs with delays is clumsy. The ink rules differ from every other NPC (an `on_email` entry and the `email_*` VARs). It is the most code and the most risk to awareness.

**B2. Phone-chat with a DM theme (`social`) and app chrome.** *Cost S–M.*
Add a theme value and an app block on the device: title ("Friendface"), accent, handle line under the name (`@dani.builds`), hidden signal and battery for a desktop app, and an optional "View profile" link that opens the osint-browser profile through the starter registry. Add a labels map to the pretext debrief ("Chat debrief", "They reported the chat") selected by theme or channel.
- For: almost everything already exists, including the judged gatekeeper chat. No new save section. m01–m08's phones are untouched (the theme is opt-in).
- Against: no composed lure DM, and DMs don't feed the awareness flip.

**B3. A new standalone DM minigame.** *Cost L.*
- For: a clean slate.
- Against: it duplicates phone-chat and mail, and gives one more thing to keep in step. Rejected.

**B4. B2 now, plus a small mail-client `channel: "dm"` presentation later for composed judged DMs only.** *Cost S–M now, M later.*
The later part covers: composer without Subject, Send as and auth (phish judge called with a `channel: "dm"` that skips `senderAuth`), Sent and reply records shown as bubbles in the phone frame (reusing `layout: "phone"`), a `kind: "dm"` triage item for the replay, and `channel` on the phish target. Build it when a mission or episode actually needs a lure written as a DM.

### Recommendation

**B4.** Conversational DMs (Eldritch members, the gatekeeper via the pretext mechanic, informants, Friendface chats) go on phone-chat with a `social` theme and app chrome. The feed itself stays where it already lives: the osint-browser's social sites (Friendface profiles and posts; `lab_social_engineering` and e14 `osint.sites`). The DM app links to a profile and does not grow its own feed. A composed judged DM waits, as a scoped mail-client `channel: "dm"`, until a scenario asks for it.

### Proposed scenario JSON (B2)

```json
"startItemsInInventory": [
  { "type": "phone", "name": "Friendface", "phoneId": "friendface_dm",
    "npcIds": ["mara_dm", "gatekeeper_dm"], "takeable": true,
    "app": { "title": "Friendface", "theme": "social", "accent": "#3b5bdb",
             "chrome": "app" },
    "observations": "Your Friendface account, set up under the cover name." }
],
"npcs": [
  { "id": "mara_dm", "displayName": "Mara Quell", "npcType": "phone",
    "phoneId": "friendface_dm", "handle": "@mara.of.the.deep",
    "profile": { "siteId": "friendface", "person": "mara" },
    "avatar": "assets/characters/mara_headshot.png",
    "storyPath": "scenarios/eh01/ink/mara_dm.json", "currentKnot": "start",
    "timedMessages": [ { "delay": 4000, "message": "Saw your comment on the Dagon thread. You've read the old texts?",
                         "waitForEvent": "global_variable_changed:posted_on_forum" } ] },
  { "id": "gatekeeper_dm", "displayName": "The Usher", "npcType": "phone",
    "phoneId": "friendface_dm", "handle": "@usher", "callId": "usher_invite",
    "storyPath": "scenarios/eh01/ink/usher_dm.json", "currentKnot": "start" }
]
```

Field notes:
- `app` on the device is new. `theme: "social"` joins `"terminal"`. `chrome: "app"` hides the signal bars and battery, and `title` replaces "Messages". The NPC `phoneTheme` stays as the fallback, so m02 and m07 are unchanged. Put the theme on the device rather than the NPC because the contact list belongs to the device (today the first NPC's theme wins, `interactions.js:1569`).
- `handle` and `profile` on a phone NPC are new and optional. `profile` opens `osint-browser` at that person's profile on that site (through the starter registry), so a DM and the feed stay one click apart.
- A judged DM is an existing pretext call (`callId` / `social.pretextNpcs`). The influence channel stays `phone` (see decisions). The debrief and refusal copy come from a labels block keyed by theme.
- In the world, a laptop or terminal showing the app is a `type: "phone"` object with `phoneId`/`npcIds` and `app`. If the phone sprite looks wrong on a desk, that needs a texture override or a small new object type. I have not checked whether an override exists.

The later `channel: "dm"` for composed judged DMs would look like this: a phish target carries `"channel": "dm"` (lint: no `senderAuth`, `requiredFactors` must not include it), the contact carries a `handle` instead of an email address, and the terminal is `layout: "phone"` with `channel: "dm"`.

### Replies and NPC responses

- Ink, as for every phone NPC: the player's lines are ink choices, the NPC's lines are ink output, and `#set_global`, `#complete_task` and `#give_item` work as now. `timedMessages`/`eventMappings` start or nudge threads. `resume: true` reopens at the saved choice.
- The judged gatekeeper uses the pretext judge (`pretext_say`/`pretext_ask` externals, live influence bar, debrief), unchanged apart from the copy.
- Canned one-liners need no new mechanism: `timedMessages` and `sendTimedMessage` already deliver them.

### Save and reload

There is nothing new. Threads, read state and story position are in `phoneState` (`game.rb:2025-2060`). The pretext session is `pretext_<callId>_state`, and globals are as usual. `app`, `handle` and `profile` are scenario data, not state. One thing to check in a test: two `phoneId`s on one save keep separate contact lists after a reload. Threads are keyed by NPC id, so they should.

### Validator and tests

- Schema: add `"social"` to the `phoneTheme` enum (`scenario-schema.json:4096-4100`), `app` on phone items and objects, and `handle` and `profile` on NPCs.
- Lints: `app.theme` in the enum; `profile.siteId` is a `social.osint.sites` id and `profile.person` a `social.people` id; every NPC listed in a device's `npcIds` shares its `phoneId` (the existing rule, README 1310); a `callId` on a DM NPC names a `pretextNpcs` entry (reuse `validate_social/pretext.rb`).
- Tests: `phone-chat-social-theme` (the theme class applied, title and chrome from `app`, NPC `phoneTheme` fallback, terminal unchanged), `phone-chat-handle-profile` (the handle renders; profile click calls the starter with the site and person), `phone-reopen-and-persistence` extended to two `phoneId`s, `pretext-debrief-labels` (call versus chat copy). Plus one live proof on a `test_dm_social/` scenario with a plain DM and a pretext DM.

### What must not change

- m01–m10's handler phones, voiced and forced calls, the `terminal` theme in m02/m07/lab_tesseract_trials, `timedMessages`, and mapping semantics.
- Pretext calls in person-chat and phone-chat keep their judge, influence, globals and default "call" copy.
- The awareness write stage stays email unless an episode opts into `channel: "dm"`. Triage `sms` items render as now.

---

## Decisions for the owner

Each has options, with the recommended one marked (rec).

1. **How the player writes a plain email.** (a) Picks one of the authored messages for that contact (rec). (b) Picks an authored message, plus an optional "your own words" flavour box. (c) Free text only, which story cannot read.
2. **Where plain messages are authored.** (a) A named list `mailClient.plainMessages[]`, each naming its contact, matching the `social.exercises[]` decision (rec). (b) Inside each contact.
3. **Reply to a plain email.** (a) Canned text by default, ink when named (rec). (b) Ink only. (c) Canned only.
4. **Ink record for mail replies.** (a) A separate mail record per persona (for example `hax_mail`) with its own ink, sharing facts through globals (rec). (b) Reuse the phone NPC's id and story.
5. **Story hooks on a plain send.** (a) `onSend` and `onDelivered` action lists (shared `applyActions`) plus `mail_sent:<id>` and `mail_reply_delivered:<id>` events (rec). (b) Globals only.
6. **Reply and forward from the reader.** (a) A "Reply" button on seeded mail that lists `replyWith` drafts, with forward done as a draft with `forwards` (rec). (b) Compose only.
7. **Evidence attachments.** (a) `payloadKit[].unlockedBy` global (rec). (b) Attach from inventory items.
8. **Mixed recipients.** (a) A contact is either judged (`targetId`) or plain, never both; lint error (rec). (b) Allow both, with a mode switch in the composer.
9. **Mail in SAFETYNET missions.** (a) Plain mail allowed in m09–m10 and new missions, m01–m08 stay frozen (rec). (b) Allowed anywhere, m01–m08 included. (c) Not in SAFETYNET.
10. **What DMs are built on.** (a) Phone-chat with a DM theme (rec). (b) A mail-client DM layout for all DMs. (c) A new DM minigame.
11. **Composed, judged DMs (a lure written as a DM).** (a) Defer, then add a mail-client `channel: "dm"` when a scenario needs it (rec). (b) Build now with the DM theme. (c) Never; use pretext chats only.
12. **Where the DM look is set.** (a) On the device (`app` block), with the NPC `phoneTheme` as fallback (rec). (b) On the NPC only, as today.
13. **DM theme names.** (a) One generic `social` theme, with title and accent from data (rec). (b) One theme per brand (Friendface, the cult forum).
14. **Influence channel for DMs.** (a) Reuse `phone`, so a lockout covers calls and DMs of that character (rec). (b) Add a `dm` channel.
15. **DM device in the room.** (a) Reuse `type: "phone"` with `app`; add a texture override only if a desk version looks wrong (rec). (b) A new `dm_terminal` object type now.
16. **Awareness DM defend items.** (a) Keep triage `sms` for now; add a `dm` kind (skin only) with the composed DM work (rec). (b) Add a `dm` triage kind now.
17. **The feed.** (a) Stays in the osint-browser social sites, and the DM header links to the profile (rec). (b) Build a feed into the DM app.
18. **Build order.** (a) Bug batch (findings 1 and 3 first), then plain send, then the DM theme (rec). (b) DM theme first (smaller, and Eldritch planning can use it). (c) Both in one pass.
