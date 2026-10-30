# Mail client extensions: plain send and DMs (design, 2026-10-30; revision 2: ink-driven plain email)

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

## (a) Plain, unjudged email, driven by ink

> **Revision 2 (2026-10-30, after owner review).** The owner accepted the DM recommendations and asked for plain email to be "primarily driven via ink, similar to phone and person chat". This section replaces the first version, which used JSON `plainMessages[]` drafts with `onSend` action lists. That version is dropped. Engine batch 15 (merge `120a9e850`) is now on main and is used below: `systems/minigame-registry.js` (`mail_terminal` → `startMailClientMinigame`, `:24-34`), the ink tag `# trigger_minigame:<type> key=value` that opens a minigame and reopens the chat on close (`systems/ink-minigame-launch.js:1-30, 104-131`), and the eventMapping `openMinigame` (`systems/mapping-minigame.js:1-13`). Batch 14 (`97a44f0a9`) fixed the readOnly close.

### The model in one paragraph

Each plain correspondent is an NPC record with an ink story, and **that story is the email thread**, the way a phone contact's story is its text thread. A run of the story delivers one email: the lines are the body and tags give the subject and attachments. When a run ends on ink choices, those choices are what the player can send: "Reply" and "Compose" both list them, and picking one sends it. The continuation of that choice is the NPC's answer, delivered after a delay. Globals, objectives, items and events are ink tags the engine already processes (`#set_global`, `#complete_task`, `#give_item`, `#trigger_minigame`). Almost all of this already exists for judged character targets. The work is lifting the `social.characters` requirement, adding a way to start a thread, and a few mail tags.

### Use cases

1. **SAFETYNET.** HaX emails "Send me what you find on the jump server" when the player enters the server room. Once the player holds the log, Reply offers "Send HaX the jump-server log" with the log attached. Sending it completes `report_findings`, and HaX's answer 20 s later opens the next aim. HaX can also prompt this from the phone ("Email it to me") with `#trigger_minigame:mail_terminal composeTo=hax_mail`.
2. **Eldritch Hacker, Institute layer.** A colleague, Dr Ines Varga, emails asking the player to cover the Thursday seminar. Accepting keeps the cover (`cover_kept_thursday`). Ignoring it brings a chaser two minutes later, and ignoring that sets `varga_suspicious`.
3. **Awareness.** After the defend round, the genuine recruiter's email can be answered ("Yes, put my name forward") or forwarded to security, unscored, which sets the debrief line.

### What already exists for ink mail (file:line)

- **A run delivers an email.** `MailRunner._run` (`systems/mail-runner.js:368-497`) loads the record's story (`:383-391`), restores saved ink variables and, for a continuation, the thread position (`:396-401`). It syncs globals both ways (`:404-405`), writes the `email_*` set (`:408`), goes to the knot or picks the choice (`:422-427`), collects lines and tags (`:428-435`), and delivers the lines joined as one inbox message with a deterministic id `reply_<jobId>` (`:446-472`). Game tags then run ui-less through `processGameActionTags` (`:478`, `:505-513`), so `#set_global`, `#complete_task` and `#give_item` already work in mail. The ink variables are saved back (`:484`).
- **Mail-only tags exist.** `#subject:<text>`, `#mail_later:<seconds>:<knot>` (a chaser email from the same thread) and `#compose_reply:<targetId>` (a hand-off to the judged composer) are handled in `_splitTags` (`:337-361`, chaser `:521-536`).
- **Choices become the player's options.** At the end of a run, choices are stored as `threads[key].expects = { mode: "choices", options }` with the position (`_storeThread`, `:510-519`). The reader shows "Choose a reply" under the newest message of the thread (`mail-client-minigame.js:994-1028`). Picking one writes a `kind: "quickReply"` Sent record whose body is the choice text (`:1037-1075`, body at `:1051`) and queues the continuation through `scheduleChoiceReply` (`mail-runner.js:624-640`) after the reply delay (`mail-scheduler.js:389-396`).
- **Idempotency across reload.** The reply keys on `reply_<jobId>` in mailState and the tag/influence side on `se_mail_applied` in globals (`mail-runner.js:60-80, 372-381, 487`).
- **What ties it to the SE layer.** `scheduleInkReply` and `scheduleChoiceReply` find the NPC only through `social.characters[c].channels.email` (`:586, :635`). The thread key is `<character>:<account>` (`buildInkJob` `:159-173`, parsed back at `:628-631`). The entry knot is `on_email` or `emailKnots` (`:149-153`). The reply delay comes from the character or target (`mail-scheduler.js:389-396`). Influence is bound only when the job has a character (`mail-runner.js:412-418`), so a job without one already runs cleanly. The NPC record must be resolvable by the client (`npcManager.getNPC`, `:188`) and by the server's ink endpoint (`games_controller.rb:2085-2118`). That means a room NPC, a room object, or a headless record, and today headless records come only from `social.characters.*.emailRecord` (`game.rb:1385-1405`; client `systems/scenario-npc-records.js:20-29`, `mail-data.js:226-232`).
- **No way to start a thread without a send.** Apart from a chaser inside a run, an NPC cannot email first except through a static `seededMessages[]` entry (`mail-scheduler.js:592-615`).
- **Mail is not voiced.** Nothing in `mail-client/`, `mail-runner.js` or `mail-scheduler.js` calls TTS. The batch extractor voices only room NPCs with `voice` + `storyPath` and voiced phone calls (`app/services/break_escape/tts_line_extractor.rb:68-93`), and headless records are not in rooms. A mail persona with its own record and ink file therefore costs no audio. If an author reuses a person NPC's story for mail, the extractor would pick up its mail knots too (another reason for decision A2 below).

### Options

**I1. One ink story per correspondent, which is the thread (recommended).** *Cost M.*
The contact names its NPC (`contacts[].npc`), which can be a headless record defined on the contact. Threads are keyed `npc:<npcId>:<accountId>`. NPC-started threads come from `timedEmails`, an eventMapping `sendEmail`, or an ink tag `#send_email` in any chat. Player-started threads come from Compose, which runs an `on_compose` knot to its choices. New mail tags cover the reply split, attachments and forwarding.
- For: it is the phone and person-chat model, so the same ink skills, conditions, VARs and tags apply, and the story keeps itself in step (HaX's mail can read what the player told HaX on the phone through globals). Most of the engine exists. No new JSON for messages.
- Against: an ink file per correspondent. Compose needs a headless run before the picker can show anything.

**I2. JSON drafts for the player's side, ink for the NPC's replies.** *Cost M.*
This was revision 1's A1 with `reply.ink`.
- For: drafts can be listed and checked without running ink.
- Against: two places to author one exchange, and the conditions are duplicated between JSON and ink. Not what the owner asked for.

**I3. Make every plain correspondent a `social.characters` entry.** *Cost S, data only.*
- For: works today.
- Against: it forces an influence config, a `<character>_influence` VAR and `se_influence` on both branches (lint, `validate_social/mail.rb:963-985`), and the `on_email`/`email_*` judged vocabulary, for an email that is not social engineering. A plain reply also needs a send that only a phish target can trigger. Rejected.

**I4. A live chat inside the mail client (no delays, run in the open thread like phone-chat).** *Cost L.*
- For: instant.
- Against: it loses the feel of email and duplicates phone-chat. If instant is wanted, use a DM (section b).

### Recommendation: I1, in detail

#### 1. Who the correspondent is

```json
"contacts": [
  { "id": "hax", "name": "Agent HaX", "addresses": ["hax@safetynet.example"],
    "npc": "hax_mail",
    "emailRecord": { "displayName": "Agent HaX",
                     "storyPath": "scenarios/m09_x/ink/hax_mail.json",
                     "avatar": "assets/characters/agent_hax_headshot.png",
                     "replyDelaySeconds": 20 } }
]
```

`npc` makes the contact an **ink contact**. `emailRecord` (optional) defines a headless record with id `npc`, the same shape `social.characters.*.emailRecord` has. The server's `headless_npc_records` (`game.rb:1385`) and the client's `scenario-npc-records.js` read contacts too, so the ink endpoint, `give_item` encounter (`games_controller.rb:1849-1863`) and `npcManager` all resolve it with no `social.characters`. `npc` may instead name an existing room or phone NPC, but the lint warns about that (shared ink state, see save and reload). A contact with `npc` must not have `targetId` (error). Judged and plain recipients stay separate, as before.

#### 2. How an NPC sends the player an email

A run of a knot is one email:

```ink
=== ask_for_log ===
# subject:Jump server
Send me what you find on the jump server. Auth logs first.
-> reply_options
```

- Body: every non-player line of the run, joined with blank lines (as now, `mail-runner.js:463`).
- `# subject:<text>` sets the subject (exists). Without it, the subject is `Re: <last subject>` in the thread.
- `# attach:<kitId>` (new) puts a `payloadKit` item on the delivered message as `attachments[]` (the field seeded mail already uses, `MAIL_MESSAGE_FIELDS`, `mail-scheduler.js:43-46`). Opening the attachment can grant intel or a note through the item's existing `grants` or a `#give_item` tag on the same line.
- `# mail_later:<seconds>:<knot>` sends a follow-up from the same thread (exists).
- Delay: how long until it arrives is decided by whatever started the run (below). Replies use the contact's `replyDelaySeconds`, else the existing default of 20 s.

What starts a run:
- **NPC-initiated, timed:** `contacts[].timedEmails[]`, mirroring phone `timedMessages`: `{ "knot": "ask_for_log", "delay": 0, "waitForEvent": "room_entered:server_room" }`. This needs a small scheduler that queues the ink job when the event fires (npc-manager's timed-message scheduling at `npc-manager.js:181, 320-332` is the model).
- **NPC-initiated, on an event:** an eventMapping action `"sendEmail": { "npc": "hax_mail", "knot": "ask_for_log", "delaySeconds": 5 }` beside `sendTimedMessage` and `openMinigame` (`npc-manager.js:785-792, 1018-1025`). The mapping's `condition`, `onceOnly` and `cooldown` apply as usual.
- **From any conversation:** an ink tag `# send_email:<npc>:<knot>[:<seconds>]` in phone-chat or person-chat ink, handled in `processGameActionTags` (`chat-helpers.js`, beside `trigger_minigame` at `:190`). For example, HaX on the phone: "I've sent you the brief." `# send_email:hax_mail:brief:3`.
- **Player-initiated:** see section 4.

The account an NPC writes to is the contact's first `accountIds` entry, else the first given account, or `account=<id>` on the mapping or tag.

#### 3. How ink choices become what the player sends

A run that ends on choices leaves them pending (exists). "Reply" under the newest message and "Compose" to that contact both list them. The **choice text is the label** in the picker. The **email the player sends** is built from the continuation:

```ink
= reply_options
* {found_jump_log} [Send HaX the jump-server log]
    # speaker:player
    # subject:Re: Jump server
    # attach:kit_jump_log
    Log attached. Logins from 10.0.4.7 at 02:13, outside the change window.
    # set_global:report_sent_to_hax
    # complete_task:report_findings
    # reply_after:20
    -> hax_reads_log
* {not found_jump_log} [Tell HaX you have nothing yet]
    # speaker:player
    Nothing yet. Still looking.
    # reply_after:15
    Keep at it. Check the auth logs.
    -> DONE
* [Forward HaX the odd login alert]
    # speaker:player
    # forward:seed_soc_alert
    This came in overnight. Is it ours?
    # reply_after:20
    -> hax_on_alert
```

- Picking a choice runs the continuation **at once**. With a `# reply_after:<seconds>` tag (new), everything from the choice up to that tag is the player's email. Without one, only lines tagged `# speaker:player` are (the convention phone-chat uses, `phone-chat-speaker.js:6, 64-71`), and the rest is the reply. `# subject:`, `# attach:` and `# forward:` in the player's part fill its subject, attachment and quoted original. Game tags in that part (`#set_global`, `#complete_task`, `#give_item`) apply at send. When there are no player lines, the body is the choice text. That is today's quickReply behaviour (`mail-client-minigame.js:1051`), so the lab's existing "Choose a reply" threads read the same.
- The runner saves the position at `# reply_after` and queues the rest as a normal ink job after that many seconds (the `loadPosition` route already exists, `mail-runner.js:399`). The rest is the NPC's reply: lines, tags, maybe more choices. Without `# reply_after`, everything after the player's lines is the reply, delivered after the contact's reply delay. That matches today's split, where the whole continuation is the reply.
- **Gating by evidence** is ordinary ink: a conditional choice on a global the story reads (`{found_jump_log}`; globals are synced into the story at `mail-runner.js:404`). No `availableWhen` JSON is needed.
- **Forwarding:** `# forward:<messageId>` quotes a received message (a seeded id, or an earlier delivered id) under the player's lines and keeps its id on the record (`forwardOf`). The client refuses the choice with a one-line notice if that message is not in the account's inbox. The lint checks seeded ids.
- **Attachments on the player's mail:** `# attach:<kitId>`, where the kit item is just the label and icon. The condition on the choice decides whether the player has the evidence. This replaces revision 1's `payloadKit.unlockedBy`.
- Choice tags (`* [Send the log] #subject:Re: Jump server`) would let the picker preview a subject before sending. Ink 21 supports them and person-chat already reads them (`person-chat-minigame.js:242`, `person-chat-conversation.js:328`), but `InkEngine.currentChoices` drops them (`ink-engine.js:98-101`). It's optional for a first version.

#### 4. Starting a thread from the player's side

Compose → To: an ink contact. If the thread has pending choices, the composer shows them (the same list as Reply). If not, the client runs the contact's `on_compose` knot (or `contacts[].composeKnot`) headless to its first choices and shows those. The run must not print lines before its choices, and the lint warns if it does. With no choices, the composer says "Nothing to write to them about yet" (through the reuse review's labels map). The composer for an ink contact shows only From (the account), To and the message picker: no templates, red-flag meter or judged copy.

The new batch-15 route opens this from a conversation: `# trigger_minigame:mail_terminal accountIds=["agent"] composeTo=hax` opens the client on that contact's picker and reopens the chat on close (`ink-minigame-launch.js:104-131`). That needs `composeTo` added to the `mail_terminal` minigameData schema (`scripts/minigame-data-schemas.json:90-93`) and to the starter (`minigame-starters.js:1132-1156`).

#### 5. How the story reacts

- In the same ink: the continuation is the reaction, and later knots read VARs and globals (`syncGlobalVariablesToStory` and `observeGlobalVariableChanges`, `mail-runner.js:404-405`), the way person-chat reads what happened elsewhere.
- Globals, objectives and items: the existing game tags.
- Events: the send emits `mail_sent` `{ npcId, contactId, accountId, msgId }` and `mail_sent:<npcId>`, and delivery already emits `mail_delivered` (`mail-scheduler.js:437-444`, `mail-runner.js:470`). So a phone NPC's eventMapping can text "Got it", and a `sendEmail` mapping on another contact can chain threads.
- Opening other minigames: `# trigger_minigame:` in a mail run opens the minigame at once when no chat is open (`ink-minigame-launch.js:24-26, 108-111`). That is acceptable for a run triggered while the client is open, and the lint warns, because a delivery that lands while the player walks around would pop a minigame unannounced.
- A plain thread can hand off to a judged lure with the existing `# compose_reply:<targetId>`. In Eldritch, a colleague could ask the player to "send Pierce the forms", and that one is judged. The lint's same-character rule (`mail.rb:987-997`) relaxes to "any phish target" for an ink contact.

#### 6. Coexistence with judged lures

Nothing changes for an existing scenario. No scenario has `contacts[].npc`, `timedEmails`, `sendEmail` or the new tags (they are new names), so:
- Judged targets keep their path: composer templates, `performSend`, the factor judge, checklist, metrics, character `on_email` with `email_*` and `se_influence`, `emailKnots`, and `#compose_reply`.
- Character threads keep the key `<character>:<account>`. Ink threads use `npc:<npcId>:<account>`, so they can't collide. `scheduleChoiceReply` branches on the `npc:` prefix (`mail-runner.js:628-636`).
- A character thread may use `# speaker:player` and `# reply_after` too, opt in only. Without them its quickReply reads exactly as now.
- Plain threads need **no `social.characters` entry**: the record comes from the contact, influence is skipped when a job has no character (`mail-runner.js:412`), and the `email_*` set is defaulted (the plain run adds only `email_account`, `email_to` and `email_in_reply_to`).
- Records: plain sends are `kind: "plain"`. Awareness lookups skip them (`episode-model.js:808`, `triage-messages.js:101`). Add the skip at both places, because `findSentRecord` with a null `targetId` would otherwise pick one up.

#### 7. Save and reload

- The thread is `mailState.threads["npc:<id>:<acct>"]` `{ expects, position }`, like character threads (`_storeThread`, `mail-runner.js:510-519`; server cap 60 KB a position, `game.rb:2115`). The `# reply_after` pause stores the position with a new `expects.mode: "waiting"`. Add `waiting` to the server's accepted modes (`game.rb:2384`), and store the position for it even though there are no choices (T2-2 skips positions otherwise, `mail-runner.js:513-516`).
- Pending deliveries are `jobs` (exists). `timedEmails` that have fired are marked in globals (`mail_timed_<npc>_<i>`), so they don't re-fire after a reload, like phone `timedMessages`.
- Ink variables go through `npcConversationStateManager` `applySavedInkVariables`/`recordInkVariables` (`npc-conversation-state.js:295-317`), the store person-chat uses. Give each mail persona its own record id: phone-chat restores a contact's whole story state from `phoneState` (`game.rb:2025-2060`), so if mail and phone share an NPC id, the phone restore can roll back variables the mail run set. Shared facts go through globals.
- The player's Sent record and its at-send tags use a deterministic id (`sent_<jobId>`) and the `se_mail_applied` marker, the same two-section idempotency the reply uses (`mail-runner.js:60-80`).
- New saved fields: `forwardOf` and (already allowed) `kind` and `attachments` on messages. Add `forwardOf` to `MAIL_MESSAGE_FIELDS` (`mail-scheduler.js:43-46`) and `MAIL_MESSAGE_KEYS` (`game.rb:2121-2125`).

#### 8. TTS

Mail is not voiced (see above), and nothing here changes that. Nothing should be added to the TTS extractor. A lint warning covers `npc` naming a voiced person NPC.

#### 9. What stays JSON

- Accounts, mailboxes, contacts (with `npc`, `emailRecord`, `revealedBy`, `timedEmails`, `composeKnot`), the payload kit (labels and icons for attachments) and `sendEmail` mappings.
- `seededMessages[]` for mail that exists at the start and needs no answer: an evidence inbox, awareness inboxes, readOnly terminals, and the targets of `# forward:`. Anything the player can answer should come from ink (`timedEmails` with `delay: 0` and `waitForEvent: "game_loaded"` gives an at-start email that is a thread).
- Judged phishing, all of it, unchanged.

#### 10. Validator and tests

Schema: `contacts[].npc`, `emailRecord`, `timedEmails[]`, `composeKnot`; the eventMapping `sendEmail`; `mail_terminal` minigameData `composeTo`.

Lints (`validate_social/mail.rb`, new `ink_contacts` section, reusing `parse_email_story` `:1032-1068`):
- `npc` resolves to a contact `emailRecord`, a room NPC or a phone NPC (warn on the last two); `npc` together with `targetId` is an error; `emailRecord.storyPath` exists;
- each knot named by `timedEmails`, `sendEmail`, `# send_email`, `composeKnot`/`on_compose` and `# mail_later` exists in that story; `on_compose` prints no line before its first choice (warn);
- `# attach:` names a payload-kit id; `# forward:` names a seeded message id (or warn); `# subject:` is non-empty; `# reply_after:` is a non-negative number and appears only after a choice; `# send_email:` names an ink contact's `npc`;
- a plain story uses no `se_influence` and no `email_landed`/`email_ok_*` (warn: judged vocabulary in a plain thread);
- `# trigger_minigame:` inside a mail story: warn (it opens over the world on delivery);
- the globals the story reads and writes are declared (existing global lints).

Tests (node `.test.mjs`):
- `social-mail-ink-contact-runner`: a job with no character delivers, applies tags, stores choices, uses the `npc:` key, and continues by `scheduleChoiceReply`.
- `social-mail-ink-split`: `# speaker:player` lines become the Sent body with subject, attachment and forward; tags before `# reply_after` apply at send; the reply arrives after the delay; no split gives today's quickReply.
- `social-mail-ink-start`: `timedEmails`, the `sendEmail` mapping and the `# send_email` tag each queue one job, once.
- `social-mail-ink-compose`: Compose to an ink contact shows pending choices, else runs `on_compose`; there is no SE chrome; the `composeTo` param works through the registry.
- `social-mail-ink-reload`: the waiting position, a pending job, a fired timed email and the Sent record survive a reload, and nothing is delivered or applied twice.
- `social-mail-ink-isolation`: existing character threads and lab "Choose a reply" behave as before; awareness lookups skip `kind: "plain"`.
- Server tests: a headless record from a contact resolves for `ink` and give; `expects.mode: "waiting"` is kept; `forwardOf` is kept.
- `validator-social-mail`: the new lints, plus a SAFETYNET-shaped fixture with only `mailClient`.
- One live proof (`scenarios/test_mail_ink/`) driven through the playtest bridge: the HaX exchange end to end, plus a reload mid-wait.

### Example: the HaX jump-server log exchange

`scenarios/m09_x/ink/hax_mail.ink`:

```ink
VAR found_jump_log = false
VAR report_sent_to_hax = false
VAR contractor_laptop_found = false

=== ask_for_log ===
# subject:Jump server
You're in. Send me whatever you find on the jump server. Auth logs first.
HaX
-> reply_options

=== reply_options ===
* {found_jump_log} [Send HaX the jump-server log]
    -> send_log
+ {not found_jump_log} [Tell HaX you have nothing yet]
    # speaker:player
    Nothing yet. Still looking.
    # reply_after:15
    Keep at it. The auth log is usually under /var/log.
    -> reply_options

=== send_log ===
# speaker:player
# subject:Re: Jump server
# attach:kit_jump_log
Log attached. Logins from 10.0.4.7 at 02:13, outside the change window.
# set_global:report_sent_to_hax
# complete_task:report_findings
# reply_after:20
02:13 from 10.0.4.7. That's the contractor VPN range, and nobody signed off a change. Good work.
I've flagged it to Netherton. Check the contractor laptop in the store room next.
# set_global:contractor_lead_open
# mail_later:90:hax_chaser
-> DONE

=== hax_chaser ===
{ not contractor_laptop_found:
    # subject:Contractor laptop
    Any luck with that laptop? Store room, second shelf.
}
-> DONE

=== on_compose ===
* {found_jump_log && not report_sent_to_hax} [Send HaX the jump-server log]
    -> send_log
+ [Ask HaX where to look]
    # speaker:player
    Where should I be looking?
    # reply_after:10
    Server room first. Then tell me what you find.
    -> DONE
```

The player's side and HaX's answer are one knot (`send_log`), split by `# reply_after`, and both the Reply route and the Compose route lead to it. `+` marks a choice that stays on offer. Tags on a `# speaker:player` line, or on lines before `# reply_after`, belong to the player's email. Lines after it are HaX's.

Minimal scenario JSON:

```json
"social": {
  "mailClient": {
    "mailboxes": [ { "id": "agent_inbox" } ],
    "accounts": [ { "id": "agent", "kind": "given", "mailbox": "agent_inbox",
                    "address": "agent0x00@safetynet.example", "displayName": "Agent 0x00",
                    "person": null, "spoofsFrom": false } ],
    "payloadKit": [ { "id": "kit_jump_log", "kind": "document", "label": "jump-server auth.log" } ],
    "contacts": [
      { "id": "hax", "name": "Agent HaX", "addresses": ["hax@safetynet.example"],
        "npc": "hax_mail",
        "emailRecord": { "displayName": "Agent HaX", "storyPath": "scenarios/m09_x/ink/hax_mail.json",
                         "avatar": "assets/characters/agent_hax_headshot.png", "replyDelaySeconds": 20 },
        "timedEmails": [ { "knot": "ask_for_log", "delay": 2000,
                           "waitForEvent": "room_entered:server_room" } ] }
    ]
  }
},
"globalVariables": { "found_jump_log": false, "report_sent_to_hax": false,
                     "contractor_lead_open": false, "contractor_laptop_found": false }
```

The workstation is an ordinary `{ "type": "mail_terminal", "minigameData": { "accountIds": ["agent"] } }`. HaX's phone ink can add `# trigger_minigame:mail_terminal accountIds=["agent"] composeTo=hax` on "Email me the log."

### Example: an Eldritch colleague

`ink/varga_mail.ink`, the contact `varga` with `npc: "varga_mail"`, started by `timedEmails` `{ "knot": "seminar", "delay": 120000, "waitForEvent": "global_variable_changed:institute_badge_issued" }`:

```ink
VAR cover_kept_thursday = false
VAR varga_suspicious = false

=== seminar ===
# subject:Thursday seminar
Could you take my Thursday seminar on non-Euclidean acoustics? I'm called to the lower archive again. The slides are on the shared drive.
Ines
# mail_later:120:seminar_chaser
* [Say you'll cover it]
    # speaker:player
    Happy to. I'll pick the slides up tomorrow.
    # set_global:cover_kept_thursday
    # reply_after:30
    You're a lifesaver. Don't read the appendix aloud, whatever the Dean says.
    -> DONE
* [Say you can't this week]
    # speaker:player
    Sorry, Thursday's no good for me.
    # reply_after:30
    Oh. I'd have thought a new fellow would want the hours. Never mind.
    -> DONE

=== seminar_chaser ===
{ not cover_kept_thursday:
    # subject:Re: Thursday seminar
    Still need someone for Thursday. You did get my note?
    # set_global:varga_suspicious
}
-> DONE
```

(The chaser is queued as the first email lands and does nothing if the player has answered. The validator should warn when a `# mail_later` knot has no guard, because a chaser that always sends would nag after an answer.)

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

## Decisions for the owner (revised 2026-10-30)

Recommended option first in each. Decisions A1–A9 replace revision 1's decisions 1–6 (plain messages in JSON, now dropped). Decisions 7–18 keep their numbers; the notes say where the ink approach changed one.

**Plain email, ink-driven**

- **A1. What drives a plain email thread.** (a) One ink story per correspondent; the story is the thread (rec). (b) JSON drafts for the player's side with ink replies. (c) JSON only (revision 1).
- **A2. Who the correspondent is.** (a) A headless record on the contact (`contacts[].npc` + `emailRecord`), with no `social.characters` entry (rec). (b) Any existing room or phone NPC id, sharing its ink state. (c) Always a `social.characters` entry.
- **A3. What the player sends when picking a choice.** (a) The choice text is the label; the continuation up to `# reply_after` (or the `# speaker:player` lines) is the email, falling back to the choice text (rec). (b) The choice text is the whole email. (c) Choice tags carry subject and body.
- **A4. When the reply arrives.** (a) `# reply_after:<seconds>` in the ink, else the contact's `replyDelaySeconds`, else 20 s (rec). (b) Always the contact's fixed delay. (c) Immediately.
- **A5. How an NPC starts a thread.** (a) All three: `contacts[].timedEmails`, an eventMapping `sendEmail`, and an ink tag `# send_email:<npc>:<knot>[:<s>]` from any chat (rec). (b) Timed and mapping only. (c) Ink tag only.
- **A6. How the player starts a thread.** (a) Compose to an ink contact shows the pending choices, else runs `on_compose` (rec). (b) Reply only; no Compose to ink contacts.
- **A7. Opening the mail from a conversation.** (a) `# trigger_minigame:mail_terminal ... composeTo=<contact>`, through the batch-15 registry (rec). (b) Open the client with no contact selected.
- **A8. Forwarding.** (a) `# forward:<messageId>` quotes a received or seeded message and keeps its id (rec). (b) No forwarding; the player paraphrases.
- **A9. Seeded mail.** (a) Stays JSON for static mail that needs no answer; anything answerable comes from ink (`timedEmails` at start) (rec). (b) Seeded messages can name a reply knot.

**Kept from revision 1** (recommended option first)

- **7. Evidence attachments.** Changed by the ink approach: (a) `# attach:<kitId>`, with an ink condition on the choice deciding whether the player has it, and no `payloadKit.unlockedBy` (rec). (b) Add `unlockedBy` as well. (c) Attach from inventory items.
- **8. Mixed recipients.** Mostly unchanged: (a) A contact is either judged (`targetId`) or an ink contact (`npc`), never both; an ink thread may hand off to a judged lure with `# compose_reply` (rec). (b) Allow both on one contact.
- **9. Mail in SAFETYNET missions.** Unchanged: (a) Plain mail in m09–m10 and new missions; m01–m08 frozen (rec). (b) Anywhere, m01–m08 included. (c) Not in SAFETYNET.
- **10. What DMs are built on.** Owner accepted: phone-chat with a DM theme.
- **11. Composed, judged DMs.** Owner accepted: defer, then a mail-client `channel: "dm"` when a scenario needs it.
- **12. Where the DM look is set.** (a) On the device (`app` block), with NPC `phoneTheme` as fallback (rec). (b) NPC only.
- **13. DM theme names.** (a) One generic `social` theme, title and accent from data (rec). (b) One per brand.
- **14. Influence channel for DMs.** (a) Reuse `phone` (rec). (b) Add `dm`.
- **15. DM device in the room.** (a) Reuse `type: "phone"` with `app`, plus a texture override only if needed (rec). (b) A new `dm_terminal` type now.
- **16. Awareness DM defend items.** (a) Keep triage `sms`; add a `dm` kind with the composed DM work (rec). (b) Add `dm` now.
- **17. The feed.** Owner accepted: stays in the osint-browser social sites, and DMs link to the profile.
- **18. Build order.** Updated because batch 14 and 15 are done: (a) the ink mail engine (A1–A8), then the DM theme (rec). (b) The DM theme first (smaller, and Eldritch planning can use it). (c) Both in one pass.

---

## Owner decisions (2026-10-30, revision 2 form)

All ink-email recommendations accepted (A1 one ink story per correspondent; A2 headless `npc` + `emailRecord` on the contact; A4 `# reply_after`, else contact delay; A5 timed emails, `sendEmail` mapping and `# send_email`; A6 Compose shows pending choices or runs `on_compose`; A7 `trigger_minigame` with `composeTo`; A8 `# forward:<messageId>`; A9 seeded mail stays static; 7 `# attach` gated by ink conditions). Build order: ink mail first, then the DM theme. DM decisions 10–17 as recommended; plain mail in m09–m10 and new missions only.

Owner notes that change the design:
- **A3, what the player sends:** use Outlook's suggested replies as the UI model. The options are written as the start of the player's message to the NPC (in the player's voice, not a "[Send HaX the log]" label), shown as suggested-reply chips under the open message; picking one opens the reply with the full message filled in (choice text plus the player's continuation), then Send.
- **8, judged and plain on one contact:** allow both. A contact can be phished or an ink correspondent, as the scenario or the ink configures it (for example a contact with both `targetId` and `npc`, with ink or scenario config deciding which the player gets at a given point).

---

## Build status (2026-10-30): ink-driven email (a) built

Built as designed, with the owner notes applied. Authoring guide: `README_scenario_design.md` "Ink-driven email". Fixture: `scenarios/test_ink_email/`. Where the build departs from or adds to the design:

- **Stored position.** A plain thread keeps the story state from just before the step that made its choices (or, while waiting, just before the reply). Resuming it regenerates the choices from the current globals, so a choice gated on `{found_log}` appears when the global is set, not only when the email arrived. This is what makes the conditional chip work.
- **Preview then send.** Picking a chip runs the choice without side effects to build the filled message. Send replays it to the boundary with the global observers on, applies the player-part tags once, and queues the reply from the saved boundary.
- **Judged and plain on one contact.** Suggested replies first; "Write your own message" is the judged door, open unless `judgedWhen` names a global that is still false.
- **Finished threads** are saved as an empty record (a delete is not sent after a reload and would leave the server a stale "waiting" thread). A "waiting" thread with no queued job is ignored.
- **Server.** Contact `emailRecord` headless records, thread mode `waiting`, message key `forwardOf`, job keys `thread`/`inReplyTo`/`plain`/`afterSend`/`chaser`/`loadPosition`, and a headless email record may unlock the doors in its `unlockable` list without a prior encounter.
- **Not built:** choice tags previewing a subject in the chip (design 3, optional); the DM theme (b).
