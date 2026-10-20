# 01 — Mail client minigame (inbox + compose)

Status: plan. Core component; nothing in the suite plays without it. Pairs with the rules engine
(`04_phish_rules_engine.md`), which judges what the player sends, and with NPC ink stories, which
write the replies (`00_data_contract.md` §10). Shared shapes, ids and the engine items `S1` to `S12`
live in `00`; this doc references them and adds only the mail-client items `N1` to `N14`.

## Purpose & audience

The screen the player uses to **read mail and send a crafted email** at a target. Serves all three
products (book Ch. 7 Phishing). It is deliberately the *attacker's* mail client first. The player
chooses which of their accounts to send from, then composes from templates with blanks, and the
claimed From line is one of them: a display name and an address, each filled from evidence the
player holds. Learning that the visible sender is trivially spoofable is half the lesson, so the From
blanks can pair a real name with an address that does not belong to that person. The checklist shows
the gap. Spoofing the From header is easy; **delivery isn't guaranteed**: modern sender authentication
(SPF/DKIM/DMARC) often quarantines or flags it. That is the `senderAuth` factor and the defender's
header lesson in `05` (`00` §2). The same component in read-only mode is the **defender's inbox**
that the triage minigame (`05`) sits on top of.

Email is one of three channels for approaching a character (`00` §9). The same character may also be
met in person or rung on the phone, each with its own ink story, and its influence (`00` §8) is one
global that carries across all three.

## Player goal in their own words

"Read what I've got, then write an email this person will believe and act on."

## The loop

A single overlay. The frame (window chrome, buttons, folder icons) is pixel-art and in the game's UI
theme. Every string the player reads or compares is in the bundled Atkinson Hyperlegible (`00` §6):
headers, addresses, subjects, bodies, contact names, file names, checklist lines, banners and
advisory lines. Only chrome labels that contain none of those (a button reading "Compose") use the
theme fonts. Authored addresses render with `textContent`, never through `displayDashes`. Two panes: a
**folder/message list** on the left, a **reading pane** on the right, and a **Compose** button that
swaps the right pane for the composer. On a narrow screen it becomes one column (see "Narrow
screens").

An **account switcher** sits at the top of the list pane. It lists the accounts this terminal offers
(`00` §10a) and shows an unread count per mailbox. The client opens on the first available account,
or on the object's `defaultAccount`. Each account has two folders, **Inbox** and **Sent**. A `created`
account whose `acct_<id>` global is not yet true appears as a "Create account" entry (see "Creating
an account").

### 1. Inbox and Sent

The Inbox lists the messages of the selected account's mailbox: seeded internal mail, newsletters, a
delivery notice, the ordinary traffic a real inbox carries, plus replies. Each row: sender display
name, subject, time (the record's `time` string), unread dot. Opening one shows From (display name
**and** the real address, because the gap between them is a red flag the defender learns to read),
To, subject, body, and any attachment chip. A link in a body (`{{link:<id>}}`) renders as a chip
showing its authored `linkText`; hovering or tapping it shows the real destination.

The Sent folder lists the account's sent records (`00` §10a): the rendered `body` as sent, the From
as displayed, the attachment or link chosen, and a small "judged: landed / did not land" line from the
stored `landed`. Every send writes one record there, and `05`'s `playerSent` messages read it.

This is also where **replies from a target arrive**. A reply is written by the character's
email-channel ink story from its `on_email` knot, or by the target's authored text for a data-only
target, and delivered after a delay by the mail scheduler (`00` §10, S6, S9). It lands in the mailbox
of the **account the player really sent from**, not the one the message claimed to be from. Mailboxes
persist across reloads (N2).

When the reply comes from a social character, the reading pane shows that character's **influence
bar** with its threshold markers (`00` §8, S4), so the player can see the effect of what they sent.

### 2. Compose

Fields, in the order the player fills them:

- **Send as** — the real account (`00` §10a). It fixes the envelope domain and what sender
  authentication would say. Accounts that are locked (`unlockedBy` not yet set) are not listed.
  An account marked burned (`burned_<accountId>`) is greyed with "this address has been reported".
- **To** — pick from the contacts whose `revealedBy` global is set. A contact with several addresses
  records the choice as `email_to`. A contact with a `targetId` is judged on send. A contact with no
  `targetId` can still be written to: the message is stored in Sent, is not judged and delivers
  nothing, and the compose view says so in one line.
- **From (claimed)** — one of the target's `templateSets.from` templates. `from_named` has two
  blanks, display name and address, each filled from evidence the player holds, and is free only
  when the chosen account has `spoofsFrom`. `from_own` has no blanks: the From is the sending
  account's own name and address, shown as a read-only line ("You can only send as yourself from
  this address"). The From is also forced to the account when the account lacks `spoofsFrom`, and
  when the target offers only `from_own` (Hampshire).
- **Subject** — fixed, or chosen from a short authored list. The judge ignores it (open question).
- **Body** — the greeting, pretext and ask, built from templates with blanks (`00` §10). The judge
  scores the blank values, not the wording, so a template never reveals an answer the player has not
  found. A blank with nothing held stays empty and cannot be sent. A scenario may also allow
  unscored free-text flavour; it is shown in the message but never judged and never read by the ink.
- **Attach** — a menu of the payload kit, abstract items such as "CV.docx", "Q3_balance_sheet.xlsx",
  "Link to your landing page". Never a real payload. An attachment or a link is chosen only here; it
  is never a blank (`00` §1). Choosing the link item when its page is not built opens the builder
  (see "Nested launch and drafts"). Once a page record exists the item attaches at once, whether or
  not the page met the target's threshold: a below-threshold page can be sent, and `linkCredible`
  then fails with the reasons `07` gives.

A live **red-flag meter** on the side is optional per scenario (on for early teaching, off for
assessment).

#### Own-account resolution

Before the composer or the judge reads an account, the client resolves it:

- A `given` or `found` account uses its authored `address` and `displayName`.
- A `created` account uses the `createMenu` entry named by the string global `acct_<id>_choice`. It
  is not listed in "Send as" until `acct_<id>` is true.
- The account's **domain** is the part of the address after `@` and is derived, never authored.
- The resolved list (`id`, `address`, `displayName`, `domain`, `kind`, `person`, `spoofsFrom`) is the
  `ctx.accounts` passed to `evaluateMessage` (`04`), and the values behind `email_account`,
  `email_account_kind` and `email_account_domain` (`00` §10).
- `from_own` fills `{account_name}` and `{account_address}` from the resolved account and sends
  `headerFrom: { account: true }` (`00` §3). The judge reads the resolved account's own name and
  address.

#### Creating an account

A `created` account (the lab's `freemail`) has no fixed address. The "Create account" entry opens a
panel inside the overlay listing the account's `createMenu` (`00` §10a): each entry shows its address
and display name, chosen from the authored menu and never typed. Picking one and pressing Confirm
sets two declared globals through the shared writer (S3): `acct_<id>_choice` (the entry id) and
`acct_<id>` (true). The account then appears in "Send as", with its address and display name taken
from the entry. The choice is final for the session. Esc or Back leaves the panel without creating.

### 3. Send → judge → checklist → reply

If the character is locked out on the mail channel (`00` §8, S10), Send is refused with a one-line
"will not read your mail right now" and nothing is judged or consumed. If the target sets
`requiresIntelToAttempt` and a listed fact is missing, Send is refused with the intel-gap line from
`04`.

Otherwise the client builds the `message` (`00` §3). When `message.link` is set it resolves the kit
item's `landingPageId` to the saved page record (`se_landing_pages`, `00` §11a) and fills
`message.linkInfo` from `07`'s `linkInfoFor(record, targetId)`, or `{ kitId, state: "missing" }` when
no record exists. It then calls `evaluateMessage(target, message, ctx)` (`04`) and gets an
`EvalResult`. Four things follow:

1. **At once, the checklist** (the teaching layer): each factor ✓/✗ with a one-line reason, plus
   advisory lines (urgency, sender authentication). The first time a message is sent with a claimed
   From that differs from the account, one line adds: "In real life this reply would go to <claimed
   person>'s inbox unless you set a reply-to; here it comes to <account>."
2. **The record.** The client writes the sent record (`00` §10a) to the sending account's mailbox with
   `folder: "sent"`, the rendered `body`, `landed`, `tells` (ids), the chosen templates, slots,
   attachment and link. It updates `mailState.metrics[targetId]` and the declared integer global
   `phish_<targetId>_attempts`. It clears that account's draft.
3. **A delivery job**, saved in `mailState.jobs` (`00` §10). A target with a `character` gets an ink
   job: the mail runner writes the result into the character's email-story variables, runs
   `on_email`, and the ink writes the reply, changes the character's influence with a reason and fires
   outcome tags (`#set_global`, `#give_item`, `#complete_task`). A data-only target (Hampshire, no
   `character`) gets a text job: its `replies.landed` string when the message landed, otherwise the
   canonical fail line of the first failed factor (`00` §2) unless the target's `factorStrings`
   override it. Delivering a text job appends the reply to the mailbox of the real sending account and
   then sets the target's `outcome.setGlobal` global, only when the message landed. The delay is the
   character's `emailReplyDelay`, or the target's own.
4. **The overlay stays open.** A send never completes the minigame. The player reads the checklist
   and the banner, can edit and resend, and sees the reply arrive in the open client.

- **Landed:** a success beat, then the reply ("sure, opening it now") and the outcome global (what
  the target does: opens the file, clicks the link, replies with the information) when the delay
  elapses. For a message with a link the banner adds one line from `07`'s
  `describeVictimOutcome(record, target, landed)`; `07` stores its result in the page record.
- **Didn't land:** the checklist shows which factor(s) failed; the reply says it in character; the
  player edits and resends. No dead ends, no silent failures.

What 01 renders from an `EvalResult`, concretely:

```
Sent to Melanie Pierce, as guest@workstation (claimed: Jed Baker).
  ✓ Sender looked trusted
  ✓ Addressed her by name
  ✗ Not relevant to her — "I'm not expecting anything like this"
  ✗ Attachment missing — "You said you'd attach it, but there's nothing here"
  Advisory: the spoofed j.baker@ address would fail the domain's sender
  authentication and may be quarantined.                   [Edit & resend]
```

Some seconds later in the `guest` mailbox: "Re: Q3 numbers — Sorry, who is this? I wasn't expecting
anything." with Melanie's bar a notch lower. On success: a green banner "She opened it.", the reply,
and the outcome global.

#### Closing the client

The overlay is closed with its own **Close** control (or Esc, below). Closing after at least one send
is a normal exit: the client sets `gameResult` to the transform of the **last send's** `EvalResult`
and calls `complete(true)`:

```jsonc
{ "targetId": "pierce", "landed": true,
  "redFlags": [ /* failed factors' red-flag strings */ ],
  "tells": [ /* EvalResult.tells, as red-flag strings */ ],
  "outcome": "landed" }          // "landed" | "failed": EvalResult.landed at send time; never a score
```

`outcome` records what the judge decided at send time, not what the reply did. Closing with nothing
sent sets `gameResult = { aborted: true }` and calls `complete(false)`. A scenario never keys a task
on this event for mail. It keys on the target's `phish_<id>_landed` global, which the reply sets when
it is delivered, so a reply that arrives after the player has left still counts.

### 4. Thread follow-ups

Under a character's reply the player may get short **reply choices** from the ink (as phone-chat
offers): "Sorry, wrong person", "It's the Q3 sheet Jed mentioned". Choosing one sends it and the
mail runner continues the thread from the stored position. The position is kept per
`(character, account)` in `mailState.threads["<character>:<accountId>"]` (`00` §10a), separate from
the person and phone positions, so a mail run never overwrites a conversation open on another
channel. A new crafted message is a fresh compose and is judged again.

### Nested launch and drafts

Only one minigame is open at a time and `startMinigame` ends the running one, so any launch from the
client uses the return-to helper (`00` §6, S12).

- **Drafts.** The composer writes its state to `mailState.drafts[accountId]` (`to`, `subject`,
  `templates`, `slots`, `attachment`, `link`) on every change and before any launch. One draft per
  account. A send clears it. The client restores the draft for the selected account when it opens.
  Drafts live in `mailState`, not in a global.
- **Attach a link that has no page.** The client saves the draft, sets `suspended: true` in its own
  params (so its `onComplete` ignores the `onComplete(false, null)` that `startMinigame` fires when it
  ends the running minigame), and starts the builder with `{ landingPageId, targetId, returnTo:
  { sceneType: 'mail-client', params: { accountId } } }`. The builder's Close is a normal exit. Its
  `returnTo` reopens the client, which restores the draft and attaches the link if
  `landing_<pageId>_built` is now true.
- **Add to Notepad.** The same pattern with the notes minigame: save the draft, launch with
  `returnTo` for the mail client, restore on return.
- **Esc and Close.** The client sets `disableClose: true`, which hides the framework's close button
  and the base-class Esc handler, so it draws its own **Close** control and binds Esc itself in the
  capture phase. Esc closes the topmost layer first: an open picker, then the Create-account panel,
  then the overlay.
- **Keyboard.** The starter sets `requiresKeyboardInput: true`, which suspends the world's movement
  and interaction keys. Without it Space and `E` would act on the world behind the overlay. The bridge
  test checks that Space and `E` do nothing while the client is open.

## Scenario-authored data

The minigame holds no content. A scenario supplies it under the top-level `social` key (`00` §11):

```jsonc
"social": {
  "mailClient": {
    "accounts": [ /* shape and rules in 00 §10a: id, address, displayName, kind given|found|created,
                     person, unlockedBy, mailbox, spoofsFrom, createMenu (created only) */ ],
    "mailboxes": [ { "id": "guest" }, { "id": "freemail" }, { "id": "jed" } ],
    "contacts": [
      { "id": "pierce", "person": "pierce", "name": "Melanie Pierce",
        "addresses": ["m.pierce@accountingnow.example"], "role": "Finance",
        "revealedBy": "se_intel_pierce_role",
        "character": "pierce",         // optional: the social.characters entry whose mail story replies
        "targetId": "pierce" },        // optional: the phishTargets entry that judges mail to this contact
      { "id": "hampshire", "person": "hampshire", "name": "Chris Hampshire",
        "addresses": ["careers@accountingnow.example"], "role": "Careers",
        "revealedBy": "se_intel_hampshire_careers", "targetId": "hampshire" },
      { "id": "lord", "person": "lord", "name": "Sofia Lord",
        "addresses": ["s.lord@accountingnow.example"], "role": "Intern",
        "revealedBy": "se_intel_lord_intern", "character": "lord", "targetId": "lord" }
    ],
    "seededMessages": [
      { "id": "welcome", "mailbox": "guest", "from": { "name": "IT", "address": "it@accountingnow.example" },
        "to": "guest@workstation", "subject": "Your new laptop", "body": "...",
        "time": "08:05", "unread": true }
    ],
    "payloadKit": [
      { "id": "kit_cv",            "label": "CV.docx",      "kind": "document" },
      { "id": "kit_balance_sheet", "label": "Q3_balance_sheet.xlsx", "kind": "spreadsheet" },
      { "id": "kit_invoice",       "label": "Invoice.pdf",  "kind": "pdf" },
      { "id": "kit_payroll_page",  "label": "Link to your landing page", "kind": "link",
        "landingPageId": "payroll_login" }
    ],
    "bodyMode": "templates",         // templates are the scored mode (00 §10)
    "freeTextFlavour": false,        // unscored; off in the first slice
    "showRedFlagMeter": true
  },
  "templates": { /* the template library, 00 §10; the lab's set is listed in 04 */ },
  "phishTargets": [ /* each target's rules, templateSets and outcome live in 04 */ ]
}
```

- **Messages** use the record shape of `00` §10a. Seeded and triage messages are authored with
  `time: "08:05"` and `unread: true`; the loader normalises them (`read = !unread`, `gameTime` from the
  game clock at load) and may take `links[]` and `attachments[]`.
- **Contacts.** `person` is a `social.people` id. `revealedBy` is the `se_intel_<id>` global that makes
  the contact appear in the To list. `character` names the entry whose mail story replies. `targetId`
  joins the contact to a `phishTargets` entry, whose `address` must be one of the contact's
  `addresses`. The validator checks that every `revealedBy` and every target's `addressedAs` source
  fact lies inside that target's readiness slots (`00` §4), so a card cannot read "Ready to approach"
  while the contact cannot be reached or addressed.
- **Payload kinds** are the `00` §1 list: `spreadsheet`, `document`, `pdf`, `archive`, `image`, plus
  `link` for a landing page built in `07`. A kit item id is what `message.attachment` or
  `message.link` carries. The link item for a built page is `kit_payroll_page`, the only link id.
- **The terminal.** A mail terminal is the new object type `mail_terminal` with
  `minigameData: { accountIds: [...], defaultAccount? }` (`00` §11). The existing `workstation` type
  is routed in `systems/interactions.js` to a different flow and is not reused. The type needs a
  sprite, `assets/objects/mail_terminal.png`, and one entry in `minigame-data-schemas.json`. A phone
  item may also list `accountIds` (`00` §11); no phone-to-mail flow is designed here, because
  `systems/interactions.js` opens `phone-chat` only for a phone with `text`, `voice` or `npcIds`.
  That hand-off belongs to the Eldritch Hacker build.
- **Reply delay.** A character's delay is `social.characters.<id>.emailReplyDelay`, in seconds of
  wall-clock countdown (`00` §10). A data-only target authors `emailReplyDelay` on the target.
- **Outcome and unlock mechanism.** An outcome global opens nothing by itself. `eventMappings` live on
  NPC records (`npc-manager.js`, where the mapping handlers register), not at scenario level, so the
  scenario puts an entry on `global_variable_changed:phish_pierce_landed` on an NPC record that is
  loaded when the event fires (the lab uses Ruth), with `completeTask`, `unlockTask` or `unlockAim`.
  A headless mail record registers its own mappings the same way. The other route is
  `#complete_task` in the reply ink. A `mail_terminal` object has no `completesTask`: only the BLE
  scanner and flag locks read it. Where a scenario needs a numeric threshold, the minigame that
  produced the number also writes a boolean (see `05`), because task and aim conditions are truthy or
  `equals` only.

The verdict comes from `04`; the reply comes from the character's ink or from the target's authored
text; the mail client renders both.

## Engine wiring

New component `public/break_escape/js/minigames/mail-client/`. The wiring checklist (the same list
every new minigame needs; it is also in the README conventions):

1. **Register.** Export, import and `registerScene('mail-client', MailClientMinigame)` in
   `minigames/index.js` (the scene calls sit in that file; `minigame-manager.js` holds the method
   definition only).
2. **Starter.** A starter in `systems/minigame-starters.js`, modelled on `startSiemMinigame`, exposed
   as a `window.` function with the others at the foot of the file. It builds `params` with
   `lockable`, `showCancel: false`, `disableClose: true`, `onComplete(success, result)` and
   `requiresKeyboardInput: true`.
3. **Interaction.** A branch in `systems/interactions.js` for the new `mail_terminal` object type
   (SIEM and flag-station are the models).
4. **Stylesheet.** A `css/mail-client-minigame.css`, linked in
   `app/views/break_escape/games/show.html.erb`.
5. **Close and Esc.** Because `disableClose` hides the framework's close button and Esc handler, the
   client draws its own Close control and binds Esc in the capture phase. It sets `gameResult` itself
   (the last send's transform, or `{ aborted: true }` with `complete(false)` when nothing was sent),
   and the starter records nothing for an aborted run.
6. **Class name.** `complete()` emits `minigame_completed { minigameName, success, result }` with
   `minigameName = this.constructor.name`, i.e. `MailClientMinigame`, not the scene type. Scenarios
   react to the outcome global. `restartCurrentMinigame` (debug only) derives the scene type from the
   class name and would look up `mailclient`; it is ignored for this component.
7. **Validator and schema** entries for the new object type (`00` S11).
8. **Return-to.** The nested launches above use S12 (`00` §12).

Flags, where a scenario uses them, validate server-side (`POST /break_escape/games/:id/flags`,
`flag-station-minigame.js`); the mail client never judges a flag itself.

Replies are delivered outside the overlay. Delivery uses the **mail scheduler and mail runner**
specified in `00` §10 (jobs saved in `mailState`, S6 and S9), because `timedMessages` delivers fixed
text to a phone thread and drops entries with empty text on the server. The reply lands in the
persisted mailbox whether or not the mail client is open. A mail notification (HUD badge or a bark
variant; the phone badge is phone-shaped and there is no workstation badge) tells the player something
arrived; when the mail client is open the reply is appended with no bark (S9).

### Persisted mail: the touch points

`mailState` (`00` §10a, S9) is a new section modelled on `phoneState`. It needs these touch points:

| Touch point | Where |
|-------------|-------|
| Client registration | `js/state-sync.js`: add the section to `KEYED_SECTIONS` / `WHOLE_SECTIONS` and to `confirm()`, and build it in `buildPlayerSections` / `buildChanges` |
| `pagehide` flush | `state-sync.js` `flush()`: add `mailState` to the hard-coded allow-list. The keepalive body is capped at `KEEPALIVE_BODY_LIMIT` (60 000 bytes), so a large mailbox falls back to the next 30 s sync; messages and the job that produced them are committed in one write, so a flush never keeps one without the other |
| Server accept | `app/controllers/break_escape/games_controller.rb` `merge_last_write_wins_sections`, so a stale request cannot overwrite it; the section's sanitiser and caps live in `app/models/break_escape/game.rb`, a `merge_mail_state!` modelled on `merge_phone_state!` and its cap constants |
| Bootstrap and restore | `games_controller.rb` bootstrap (`savedMailState`) and `js/core/game.js` restore, then `state-sync` acknowledges the key |

Caps follow the phone caps: 200 messages per mailbox, 4000 characters per body, 50 jobs, one draft
per account (`00` §10a).

`mailState` holds the mailboxes (`messages[]` as the `00` §10a record: `folder`, `fromAccount`,
`from`, `targetId`, `templates`, `slots`, `body`, `attachment`, `link`, `landed`, `tells`, `time`,
`gameTime`, `read`), the pending delivery jobs (ink and text), the per-`(character, account)` thread
positions, the drafts and `metrics[targetId]` (`sent`, `failed`, `landed`, `firstTryLanded`). The
displayed time is the record's `time`; the countdown is wall clock. The engagement report (`10`)
reads `metrics`, the sent records and the outcome globals.

### What exists, and what is reused

| Need | Existing piece | Use |
|------|----------------|-----|
| Read-only message body | `minigames/text-file/` (768 px breakpoint) | Model for the reading pane in `mail-reader` |
| Pin a fact while reading | Notes API (`startNotesMinigame`, `window.addNote`) and the password minigame's "Add to Notepad" | Same button on the reading pane, launched with S12 `returnTo` and the draft saved first |
| Thread view, bubbles, choices, avatar | `phone-chat-ui.js`, `phone-chat-conversation.js` (`collectSteps`, `saveState`) | Reply choices (N8) and the thread layout. The influence bar is not in the phone UI: the bar is new (S4) |
| Headless run | `PhoneChatConversation._preloadOpeningOnce` | The model the runner extends (`00` §10) |
| Blank picker | none; nearest is `container-minigame` item lists | New control, shared with `06` (N10) |

### New engine work

`S1` to `S12` are in `00` §12 and are not repeated. Mail-client items:

| # | Item | Notes |
|---|------|-------|
| N1 | `mail-client` minigame component (list, reading pane, Sent folder, composer, account switcher, Create-account panel) | New overlay; one component with a narrow layout, not a second one |
| N2 | `mailState` persistence: the touch points above, with caps; drafts (`mailState.drafts`) written on change and before a launch; `metrics` and `phish_<id>_attempts` written on each send | Implements `00` S9's persistence half |
| N3 | Close behaviour and the `gameResult` transform above (completion on Close, never on send), documented for scenario authors; own Close control, capture-phase Esc, `requiresKeyboardInput` and its bridge test | — |
| N4 | Payload kit as abstract items; Attach menu; the `link` kind refers to a landing page built in `07`; nested launch of the builder and Notes through S12; `linkInfo` filled from `linkInfoFor` | Cross-component |
| N5 | A read-only **`mail-reader`** component (message list + reading pane, link-hover status bar, header panel) shared with the triage defender (`05`) | `01` adopts it too so the two cannot drift |
| N6 | Email→ink bridge in the client: judge, write the sent record and the job (ink or text) to the scheduler, render the reply | Uses `00` S1 (externals), S6 (runner), S7 (run-scoped `email_`), S8 (headless record), S9 (scheduler); not `timedMessages` |
| N7 | Influence bar in the reading pane for social characters | The shared DOM widget, `00` S4 |
| N8 | Thread reply choices from ink under a reply, position stored per `(character, account)` | Mirrors phone-chat choices |
| N9 | Contacts with a `character` and no sprite; contacts joined to targets by `targetId` | Delivered by `00` S8 (headless email records) |
| N10 | Template composer: blanks whose options come from held evidence (`se_intel_*` globals through each fact's `provides`), and a send gate that refuses an empty blank | Shares the blank picker with `06` (N6) |
| N11 | Accounts: own-account resolution, `unlockedBy` globals, `createMenu` and the Create-account panel, `accountIds` on objects, the switcher, `burned_<id>` greying, per-mailbox unread | `00` §10a |
| N12 | Sent record per `00` §10a: `folder`, `fromAccount`, `targetId`, `templates`, `slots`, `body`, `attachment`, `link`, `landed`, `tells`; the Sent folder view | Part of `mailState`; `05` replays it |
| N13 | Narrow-screen layout and accessibility pass (below) | Needs the bundled Atkinson Hyperlegible (`00` §6) |
| N14 | Mail notification (HUD badge or bark variant) and the rule that an open client appends without a bark | `00` S9 |

## Narrow screens and accessibility

- One component, two layouts. Below 768 px (the breakpoint `text-file` uses) the list and the reading
  pane stack as two screens with a Back button; the composer is a third screen. The phone-chat shell
  has no responsive rules, so the mail client does not depend on it.
- Composer blanks become full-width pickers (a bottom sheet listing the held options); the account
  switcher is a select at the top. Touch targets are 44 px. Nothing is hover-only: link-hover
  destinations in the reading pane also appear on tap as a pinned "This would go to: …" line.
- Keyboard: every control is reachable in order; picker options are a listbox with arrow keys. The
  overlay sets `requiresKeyboardInput`, so these keys never reach the world. Esc closes a picker
  first, then the Create-account panel, then the overlay. The send button states why it is disabled
  ("fill the Greeting blank").
- Screen readers: the checklist and the "reply arrived" notice are `aria-live="polite"`. Ticks and
  crosses are always paired with words; the unread dot has a text equivalent.
- No motion under `prefers-reduced-motion`; the success banner appears without animation.
- Free-text flavour, when enabled, needs the validator rule that no ink reads it.

## Reuse across products

- **Student lab:** full composer, template body with more blanks per template, red-flag meter off
  after the first target, several targets with escalating strictness, replies that teach, and two
  accounts (the given operator account and a created one). The found account `jed_pc` is part of the
  model and unused in the lab.
- **Awareness:** fewer fields, template body with one or two blanks, one account, meter on, one or
  two targets per episode, then flip to the inbox as the defender surface for `05`. A narrow-layout
  variant of this one component serves the mobile episode; there is no second mail client.
- **Eldritch Hacker:** one target per stage; the target is usually a character the player can also
  meet or ring; the landed outcome gates the next room. Multiple phone identities are future work
  (`00` §10a); email accounts are the identity model for now. Where the setting has no corporate
  email, a DM/feed variant of the same component carries the messages.

## Assets

- Mail-client chrome (window frame, folder icons, unread dot, attachment chip, account chip) — pixel UI, PixelLab.
- Attachment-kind icons (document, pdf, spreadsheet, archive, image, link) — small pixel icons.
- The `mail_terminal` object sprite, `assets/objects/mail_terminal.png`.
- No character art of its own (uses existing portraits for contacts where a scenario wants them).

## Visual style

- In-world pages and messages use pixel-art imagery: NPC headshots (the existing pixel portraits) for
  senders and contacts, pixel logos, banners, product photos, and cult sigils or flyers where a
  scenario has them. The mail frame (folder pane, buttons, window chrome) is styled like the game UI.
- All text the player must read or compare uses the bundled Atkinson Hyperlegible (`00` §6), not a
  pixel font. That covers email headers, addresses, subjects, body text, contact and file names, and
  the checklist, banner and tells lines. Look-alike addresses (`accountingnovv` against
  `accountingnow`, `rn` against `m`) must read as they would in a real mail client. Pixel fonts blur
  those differences or make them obvious, and long reading in a pixel font is tiring.
- The checklist and the tells use the house pixel style for chrome (icons, frames, headings that hold
  no authored string). Their reason text is Atkinson Hyperlegible.

## Open questions

- Subject: a template with blanks, or ignored by the judge? Default: ignored (`00` §10).
- How much unscored free-text flavour is allowed in the lab? Default: none in the first slice.
- Does the checklist appear on send, or only once the reply has arrived? Default: on send; assessment
  mode may wait.
- One persistent mailbox set per scenario, opened from any terminal or the phone according to its
  `accountIds`? Default: yes.
- How are found credentials shown: a note, a password minigame, a dropped item? Per scenario; the
  account only needs its `unlockedBy` global.
- Optional controlled reply-to slot, so a spoofing attacker can receive the reply? Later slice.
