# 01 — Mail client minigame (inbox + compose)

Status: plan. Core component; nothing in the suite plays without it. Pairs with the rules engine
(`04_phish_rules_engine.md`), which judges what the player sends, and with NPC ink stories, which
write the replies (`00_data_contract.md` §10). Shared shapes, ids and the engine items `S1` to `S11`
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
theme; every word the player reads or compares (headers, addresses, subjects, bodies, checklist
reasons) is in the bundled readable sans-serif (see "Visual style"). Two panes: a **folder/message
list** on the left, a **reading pane** on the right, and a **Compose** button that swaps the right
pane for the composer. On a narrow screen it becomes one column (see "Narrow screens").

An **account switcher** sits at the top of the list pane. It lists the accounts this terminal offers
(`00` §10a) and shows an unread count per mailbox. The client opens on the first available account.

### 1. Inbox

The list shows the messages of the selected account's mailbox: seeded internal mail, newsletters, a
delivery notice, the ordinary traffic a real inbox carries, plus replies. Each row: sender display
name, subject, time (the stored `gameTime`), unread dot. Opening one shows From (display name **and**
the real address, because the gap between them is a red flag the defender learns to read), To,
subject, body, and any attachment chip.

This is also where **replies from a target arrive**. A reply is written by the character's
email-channel ink story from its `on_email` knot and delivered after a short delay by the mail
scheduler (`00` §10, S6, S9). It lands in the mailbox of the **account the player really sent from**,
not the one the message claimed to be from. A target with no ink story replies from its authored
`04` strings. Mailboxes persist across reloads (N2).

When the reply comes from a social character, the reading pane shows that character's **influence
bar** with its threshold markers (`00` §8, S4), so the player can see the effect of what they sent.

### 2. Compose

Fields, in the order the player fills them:

- **Send as** — the real account (`00` §10a). It fixes the envelope domain and what sender
  authentication would say. Accounts that are locked (`unlockedBy` not yet set) are not listed.
  An account marked burned (`burned_<accountId>`) is greyed with "this address has been reported".
- **To** — pick from contacts the OSINT browser has revealed (a contact's `revealedBy` global).
  Where a contact has several addresses the choice is recorded as `email_to`.
- **From (claimed)** — a template with two blanks, display name and address, each filled from
  evidence the player holds. Free only when the chosen account has `spoofsFrom`. Otherwise the claimed
  From is shown fixed and equal to the account, and the blanks are replaced by that read-only line
  ("You can only send as yourself from this address").
- **Subject** — fixed, or chosen from a short authored list. The judge ignores it (open question).
- **Body** — the pretext and the ask, built from templates with blanks (`00` §10). The judge scores
  the blank values, not the wording, so a template never reveals an answer the player has not found.
  A blank with nothing held stays empty and cannot be sent. A scenario may also allow unscored
  free-text flavour; it is shown in the message but never judged and never read by the ink.
- **Attach** — pick from the payload kit, an abstract list such as "CV.docx", "Invoice.pdf",
  "spreadsheet", "link to a page you built". Never a real payload.

A live **red-flag meter** on the side is optional per scenario (on for early teaching, off for
assessment).

### 3. Send → judge → checklist → reply

If the character is locked out on the mail channel (`00` §8, S10), Send is refused with a one-line
"will not read your mail right now" and nothing is judged or consumed.

Otherwise the rules engine (`04`) evaluates the message against the target and returns an
`EvalResult` (`00` §3). Two things follow:

1. **At once, the checklist** (the teaching layer): each factor ✓/✗ with a one-line reason, plus
   advisory lines (urgency, sender authentication). The first time a message is sent with a claimed
   From that differs from the account, one line adds: "In real life this reply would go to <claimed
   person>'s inbox unless you set a reply-to; here it comes to <account>."
2. **After a delay, the reply** (the diegetic layer): the mail runner writes the result into the
   character's email-story variables, runs `on_email`, and the ink writes the reply, changes the
   character's influence with a reason, and fires any outcome tags (`#set_global`, `#give_item`,
   `#complete_task`).

- **Landed:** a success beat, the reply ("sure, opening it now"), and the outcome global (what the
  target does: opens the file, clicks the link, replies with the information).
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

A minute later in the `guest` mailbox: "Re: Q3 numbers — Sorry, who is this? I wasn't expecting
anything." with Melanie's bar a notch lower. On success: a green banner "She opened it.", the reply,
and the outcome global.

### 4. Thread follow-ups

Under a character's reply the player may get short **reply choices** from the ink (as phone-chat
offers): "Sorry, wrong person", "It's the Q3 sheet Jed mentioned". Choosing one sends it and the
mail runner continues the thread from the stored position. The position is kept per
`(character, account)` in `mailState.threads["<character>:<accountId>"]` (`00` §10), separate from
the person and phone positions, so a mail run never overwrites a conversation open on another
channel. A new crafted message is a fresh compose and is judged again.

## Scenario-authored data

The minigame holds no content. A scenario supplies it under the top-level `social` key (`00` §11):

```jsonc
"social": {
  "mailClient": {
    "accounts": [ /* shape and rules in 00 §10a: id, address, displayName, kind given|found|created,
                     unlockedBy, mailbox, spoofsFrom */ ],
    "mailboxes": [ { "id": "guest" }, { "id": "freemail" }, { "id": "jed" } ],
    "contacts": [
      { "id": "pierce", "name": "Melanie Pierce", "addresses": ["m.pierce@accountingnow.example"],
        "role": "Finance", "revealedBy": "se_intel_pierce_role",
        "character": "pierce" }      // optional: the social.characters entry whose mail story replies
    ],
    "seededMessages": [
      { "id": "welcome", "mailbox": "guest", "from": { "name": "IT", "address": "it@accountingnow.example" },
        "subject": "Your new laptop", "body": "...", "gameTime": "08:05", "unread": true }
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
  "templates": { /* the template library, 00 §10 */ },
  "phishTargets": [ /* each target's rules, templateSets and outcome live in 04 */ ]
}
```

- Payload kinds are the `00` §1 list: `spreadsheet`, `document`, `pdf`, `archive`, `image`, plus
  `link` for a landing page built in `07`. Kit ids are the `attachment` / `link` slot values.
- A mail terminal or phone object carries only pointers: `minigameData: { mailboxId, accountIds: [...] }`
  (`00` §11). The object type for a terminal is a new `mail_terminal`; the existing `workstation`
  type is already routed in `systems/interactions.js` to a different flow and is not reused. A phone
  item may also list `accountIds` so one device offers both chat and mail with the same switcher;
  `phoneId` and `npcIds` are unchanged.
- A character's reply delay is `social.characters.<id>.emailReplyDelay`, in seconds of wall-clock
  countdown, default short; the awareness episodes set it shorter (`00` §10).
- Outcome and unlock mechanism. An outcome global opens nothing by itself. The scenario bridges it:
  an `eventMappings` entry on `global_variable_changed:phish_pierce_landed` with `completeTask` /
  `unlockTask` / `unlockAim` (`npc-manager.js`, the mapping handlers), or `#complete_task` in the
  reply ink, or `completesTask` on the object. Where a scenario needs a numeric threshold, the
  minigame that produced the number also writes a boolean (see `05`), because task and aim conditions
  are truthy or `equals` only.

The verdict comes from `04`; the reply comes from the character's ink (or `04`'s strings); the mail
client renders both.

## Engine wiring

New component `public/break_escape/js/minigames/mail-client/`. The wiring checklist (the same list
every new minigame needs; it is also in the README conventions):

1. **Register.** Export, import and `registerScene('mail-client', MailClientMinigame)` in
   `minigames/index.js` (the scene calls sit in that file; `minigame-manager.js` holds the method
   definition only).
2. **Starter.** A starter in `systems/minigame-starters.js`, modelled on `startSiemMinigame`, exposed
   as a `window.` function with the others at the foot of the file. It builds `params` with
   `lockable`, `showCancel`, `onComplete(success, result)` and `requiresKeyboardInput: true`, so
   typing in a field does not move the player.
3. **Interaction.** A branch in `systems/interactions.js` for the new `mail_terminal` object type
   (SIEM and flag-station are the models), and the phone item opening path for `accountIds`.
4. **Stylesheet.** A `css/mail-client-minigame.css`, linked in
   `app/views/break_escape/games/show.html.erb`.
5. **Esc.** The framework's Esc path calls `complete(false)` with no result. The minigame sets
   `gameResult = { aborted: true }` itself, as the SIEM minigame does, and the starter records nothing
   for an aborted run.
6. **Class name.** `complete()` emits `minigame_completed { minigameName, success, result }` with
   `minigameName = this.constructor.name`, i.e. `MailClientMinigame`, not the scene type. Scenarios
   react to the outcome global (preferred). `restartCurrentMinigame` (debug only) derives the scene
   type from the class name and would look up `mailclient`; it is ignored for this component.
7. **Validator and schema** entries for the new object type (`00` S11).

On a landed phish it **sets `this.gameResult`** and then calls `complete(true)`
(`framework/base-minigame.js`). `result` is the transform of `EvalResult` in `00` §3:
`{ targetId, landed, redFlags:[…], tells:[…], outcome }`. There is no `pretextScore`. Outcome globals
come from the target's ink (`#set_global`) or, for data-only targets, from `04`'s
`outcome.setGlobal` through `applyActions` `set_global`, then the `eventMappings` bridge above. Flags,
where a scenario uses them, validate server-side (`POST /break_escape/games/:id/flags`,
`flag-station-minigame.js`); the mail client never judges a flag itself.

Replies are delivered outside the overlay. The engine does not use `timedMessages` (it delivers fixed
text to a phone thread and drops entries with empty text on the server). It uses the **mail
scheduler and mail runner** specified in `00` §10 (jobs saved in `mailState`, S6 and S9), and the
reply lands in the persisted mailbox whether or not the mail client is open. A mail notification
(HUD badge or a bark variant; the phone badge is phone-shaped and there is no workstation badge today)
tells the player something arrived; when the mail client is open the reply is appended with no bark
(S9).

### Persisted mail: the touch points

Every persisted client section has the same four touch points and an unknown section is ignored. The
open-ended `globalVariables` store is not used for mail (30 s sync, no size cap). `mailState`
(`00` §10a, S9) is a new section modelled on `phoneState`:

| Touch point | Where |
|-------------|-------|
| Client export | `js/state-sync.js` `buildPlayerSections` and `buildChanges` (a keyed section, like `phoneState`) |
| Server accept | `app/controllers/break_escape/games_controller.rb`, the explicit permitted params beside `phoneState` / `timedMessages`, each with its own sanitiser |
| Sanitiser and caps | `app/models/break_escape/game.rb`, a `merge_mail_state!` modelled on `merge_phone_state!` / `sanitize_phone_state_entry` (section cap, messages per mailbox, characters per message) |
| Bootstrap and restore | `games_controller.rb` bootstrap (`savedMailState`) and `js/core/game.js` restore, then `state-sync` acknowledges the key |

`mailState` holds the mailboxes (`messages[]` with `fromAccount`, `headerFrom`, `gameTime`, `read`,
and for sent mail the `tells` and picked link/attachment, so `05` can replay it), the pending
delivery jobs, the per-`(character, account)` thread positions and the per-mailbox unread counts. The
displayed time is the stored `gameTime` (as phone messages do); the countdown is wall clock.

### What exists, and what is reused

| Need | Existing piece | Use |
|------|----------------|-----|
| Read-only message body | `minigames/text-file/` (768 px breakpoint) | Model for the reading pane in `mail-reader` |
| Pin a fact while reading | Notes API (`startNotesMinigame`, `window.addNote`) and the password minigame's "Add to Notepad" | Same button on the reading pane. Return-to hooks (`returnToPhoneAfterNotes`, `returnToTextFileAfterNotes`) matter because `startMinigame` ends the running one |
| Thread view, bubbles, choices, avatar, influence area | `phone-chat-ui.js`, `phone-chat-conversation.js` (`collectSteps`, `saveState`) | Reply choices (N8) and the thread layout |
| Headless run | `PhoneChatConversation._preloadOpeningOnce` | The model the runner improves on (`00` §10) |
| Blank picker | none; nearest is `container-minigame` item lists | New control, shared with `06` (N10) |

### New engine work

`S1` to `S11` are in `00` §12 and are not repeated. Mail-client items:

| # | Item | Notes |
|---|------|-------|
| N1 | `mail-client` minigame component (list, reading pane, composer, account switcher) | New overlay; one component with a narrow layout, not a second one |
| N2 | `mailState` persistence: the four touch points above, with caps | Implements `00` S9's persistence half |
| N3 | `result` schema above, and the `minigame_completed` payload documented for scenario authors | — |
| N4 | Payload kit as abstract items; `link` kind refers to a landing page built in `07` | Cross-component |
| N5 | A read-only **`mail-reader`** component (message list + reading pane, link-hover status bar, header panel) shared with the triage defender (`05`) | `01` adopts it too so the two cannot drift |
| N6 | Email→ink bridge in the client: judge, write the job to the scheduler, render the reply | Uses `00` S1 (externals), S6 (runner), S7 (run-scoped `email_`), S8 (headless record), S9 (scheduler); not `timedMessages` |
| N7 | Influence bar in the reading pane for social characters | The shared DOM widget, `00` S4 |
| N8 | Thread reply choices from ink under a reply, position stored per `(character, account)` | Mirrors phone-chat choices |
| N9 | Contacts with a `character` and no sprite | Delivered by `00` S8 (headless email records); no per-contact record in `mailClient` |
| N10 | Template composer: blanks whose options come from held evidence (`se_intel_*` globals through each fact's `provides`), and a send gate that refuses an empty blank | Shares the blank picker with `06` (N6) |
| N11 | Accounts: `unlockedBy` globals, `accountIds` on objects, the switcher, `burned_<id>` greying, per-mailbox unread | `00` §10a |
| N12 | Sent-record fields: `fromAccount`, `headerFrom`, `tells`, picked link/attachment, so `05` can replay a sent message | Part of `mailState` |
| N13 | Narrow-screen layout and accessibility pass (below) | Needs the bundled sans-serif (README engine list) |
| N14 | Mail notification (HUD badge or bark variant) and the rule that an open client appends without a bark | `00` S9 |

## Narrow screens and accessibility

- One component, two layouts. Below 768 px (the breakpoint `text-file` uses) the list and the reading
  pane stack as two screens with a Back button; the composer is a third screen. This replaces any
  "phone variant built on the phone-chat shell": that shell has no responsive rules today, so the
  mail client does not depend on it.
- Composer blanks become full-width pickers (a bottom sheet listing the held options); the account
  switcher is a select at the top. Touch targets are 44 px. Nothing is hover-only: link-hover
  destinations in the reading pane also appear on tap as a pinned "This would go to: …" line.
- Keyboard: every control is reachable in order; picker options are a listbox with arrow keys; Esc
  closes a picker first, then the overlay. The send button states why it is disabled ("fill the
  Greeting blank").
- Screen readers: the checklist and the "reply arrived" notice are `aria-live="polite"`. Ticks and
  crosses are always paired with words; the unread dot has a text equivalent.
- No motion under `prefers-reduced-motion`; the success banner appears without animation.
- Free-text flavour, when enabled, needs `requiresKeyboardInput` (wiring step 2) and the validator
  rule that no ink reads it.

## Reuse across products

- **Student lab:** full composer, template body with more blanks per template, red-flag meter off
  after the first target, several targets with escalating strictness, replies that teach, and two
  accounts (the given operator account and one found or created).
- **Awareness:** fewer fields, template body with one or two blanks, one account, meter on, one or
  two targets per episode, then flip to the inbox as the defender surface for `05`.
- **Eldritch Hacker:** one target per stage; the target is usually a character the player can also
  meet or ring; the landed outcome gates the next room. Multiple phone identities are future work
  (`00` §10a); email accounts are the identity model for now. Where the setting has no corporate
  email, a DM/feed variant of the same component carries the messages.

## Assets

- Mail-client chrome (window frame, folder icons, unread dot, attachment chip, account chip) — pixel UI, PixelLab.
- Attachment-kind icons (document, pdf, spreadsheet, archive, image, link) — small pixel icons.
- No character art of its own (uses existing portraits for contacts where a scenario wants them).

## Visual style (decided 2026-10-20)

- In-world pages and messages use pixel-art imagery: NPC headshots (the existing pixel portraits) for
  senders and contacts, pixel logos, banners, product photos, and cult sigils or flyers where a
  scenario has them. The mail frame (folder pane, buttons, window chrome) is styled like the game UI.
- All text the player must read or compare stays in a normal readable sans-serif font, not a pixel
  font. That covers email headers, addresses, subjects and body text. Look-alike addresses
  (`accountingnovv` against `accountingnow`, `rn` against `m`) must read as they would in a real
  mail client. Pixel fonts blur those differences or make them obvious, and long reading in a pixel
  font is tiring. No sans-serif is bundled today; the font item is in the README engine list.
- The checklist and the tells use the house pixel style for chrome. Their reason text follows the
  readable-text rule.

## Open questions

- Subject: a template with blanks, or ignored by the judge? Default: ignored (`00` §10).
- How much unscored free-text flavour is allowed in the lab? Default: none in the first slice.
- Does the checklist appear on send, or only once the reply has arrived? Default: on send; assessment
  mode may wait.
- One persistent mailbox set per scenario, opened from any terminal or the phone according to its
  `accountIds`? Default: yes.
- A Sent folder per mailbox for the defender's role swap ("find your own phish among real mail")?
  Default: yes, cheap, and `05`'s `playerSent` messages read it.
- How are found credentials shown: a note, a password minigame, a dropped item? Per scenario; the
  account only needs its `unlockedBy` global.
- Optional controlled reply-to slot, so a spoofing attacker can receive the reply? Later slice.
