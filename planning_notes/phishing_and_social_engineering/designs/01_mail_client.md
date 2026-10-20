# 01 — Mail client minigame (inbox + compose)

Status: plan, 2026-10-20. Core component; nothing in the suite plays without it. Pairs with the
rules engine (`04_phish_rules_engine.md`), which judges what the player sends.
Round 1 reviewed (REVIEW_01_R1.md: 0 blockers, 1 major, 5 minors) and reconciled against
`00_data_contract.md` (the shared schemas/dataset); R1 items folded in below.

## Purpose & audience

The screen the player uses to **read mail and send a crafted email** at a target. Serves all three
audiences (book Ch. 7 Phishing). It is deliberately the *attacker's* mail client first — with a
From field the player can type anything into — because learning that the sender is trivially
spoofable is half the lesson. (Spoofing the From header is easy; **delivery isn't guaranteed** —
modern sender authentication, SPF/DKIM/DMARC, often quarantines or flags it. That's the
`senderAuth` factor and the defender's header lesson in `05`; see `00_data_contract.md` §2.) The same component in read-only mode is the **defender's inbox** that
the triage minigame (`05`) sits on top of.

## Player goal in their own words

"Read what I've got, then write an email this person will believe and act on."

## The loop

A single overlay, house style (dark panel, `Press Start 2P` headings, `VT323` body, `#00ff41`
accent). Two panes: a **folder/message list** on the left, a **reading pane** on the right, and a
**Compose** button that swaps the right pane for the composer. A phone variant (narrow, single
pane, built on the `phone-chat` shell) is the same data in one column for the awareness product and
for mobile missions.

### 1. Inbox
The list shows messages the scenario seeds: internal mail, newsletters, a delivery notice — the
ordinary traffic a real inbox carries. Each row: sender display-name, subject, time, unread dot.
Opening one shows From (display name **and** the real address, because the gap between them is a
red flag the defender learns to read), To, subject, body, and any attachment chip. This is also
where **replies from a target arrive** after the player sends — the in-character "I don't know you"
or "sure, opening it now" that the rules engine (`04`) generates, shown instantly, not polled.

### 2. Compose
Fields: **From** (free text — display name + address, spoofable), **To** (pick from known
contacts the OSINT browser has revealed, or type one), **Subject**, **Body** (guided free-text;
see `04` for scoring), and **Attach** (pick from the payload kit — an abstract list like "CV.docx",
"Invoice.pdf", "macro-enabled spreadsheet", "link to a page you built"; never a real payload). A
live **red-flag meter** on the side is optional per scenario (on for early teaching, off for
assessment).

### 3. Send → judge → feedback
On send, the rules engine (`04`) evaluates the message against the target's rules and returns a
verdict plus a per-factor checklist (sender trust, addressed correctly, pretext relevant,
attachment plausible, urgency not overdone). The composer shows the checklist, and:
- **Landed:** a success beat, a reply from the target, and the outcome bridges to a global/flag
  (the "flag" is what the target does — opens the file, clicks the link, replies with the info).
- **Didn't land:** the checklist shows which factor(s) failed, in-character and as a red-flag
  lesson, and the player edits and resends. No dead ends, no silent failures (the SecGen flaw).

The judging rules and the full worked example live in `04` / `00_data_contract.md` §3 (01 is not the
judge). What 01 *renders* from an `EvalResult`, concretely:

```
Sent to Melanie Pierce — she didn't act on it.
  ✓ Sender looked trusted
  ✓ Addressed her by name
  ✗ Not relevant to her — "I'm not expecting anything like this"
  ✗ Attachment missing — "You said you'd attach it, but there's nothing here"
  Reply: "Sorry, who is this? I wasn't expecting anything."   [Edit & resend]
```
and on success: a green banner "She opened it.", the target's `landed` reply in the inbox, and the
bridged global fires.

## Scenario-authored data

The minigame holds no content. A scenario supplies:

```jsonc
"mailClient": {
  "account": { "name": "You (operator)", "address": "guest@workstation" },
  "contacts": [ { "name": "Melanie Pierce", "address": "m.pierce@accountingnow.example", "role": "Finance" } ],
  "seededMessages": [
    { "id": "welcome", "from": { "name": "IT", "address": "it@accountingnow.example" },
      "subject": "Your new laptop", "body": "...", "unread": true }
  ],
  "payloadKit": [
    { "id": "cv_doc", "label": "CV.docx", "kind": "office-doc" },
    { "id": "invoice_pdf", "label": "Invoice.pdf", "kind": "pdf" },
    { "id": "link", "label": "Link to your landing page", "kind": "link", "landingPageId": "payroll_login" }
  ],
  "targets": [ /* each target's rules live in 04's schema, referenced by address */ ],
  "showRedFlagMeter": true
}
```

Replies and verdicts come from `04`; the mail client only renders them.

## Engine wiring

New component `public/break_escape/js/minigames/mail-client/`, registered with
`window.MinigameFramework.registerScene('mail-client', MailClientMinigame)` (pattern:
`minigame-manager.js:229`). Started from an object interaction via a starter in
`systems/minigame-starters.js` (pattern: the `startMinigame('siem-dashboard', …)` block,
`minigame-starters.js:660-679`), with `params.onComplete(success, result)` and `params.lockable`.

On a landed phish it **sets `this.gameResult`** (the payload is `this.gameResult`,
`base-minigame.js:104,111`) and then calls `complete(true)`; `base-minigame.js:84-108` emits
`minigame_completed { minigameName, success, result }` via `window.eventDispatcher`. Note
`minigameName` is the **class name** `MailClientMinigame` (`this.constructor.name`,
`base-minigame.js:103`), not the scene type `'mail-client'` — scenarios react to the bridged global
(preferred) or match the class name.

`result` is **not** a schema of 01's own: it is the transform of the rules engine's `EvalResult`
defined in `00_data_contract.md` §3 — `{ targetId, landed, redFlags:[…], outcome }`, where
`outcome` comes from the target's authored landed outcome and there is **no `pretextScore`** (the
engine has no aggregate score). The scenario bridges that to a global with `set_global`
(`apply-actions.js:33-40`) or an objective `onComplete.setGlobal` (`objectives-manager.js:754-756`)
— e.g. `phish_pierce_landed = true` opens the next lock. Flags, where a scenario uses them, validate
server-side (`POST /break_escape/games/:id/flags`, `flag-station-minigame.js:642`) — the mail client
never judges a flag itself.

### New engine work

| # | Item | Notes |
|---|------|-------|
| N1 | `mail-client` minigame component (list + reading + composer, phone variant) | New overlay |
| N2 | Reply injection: the rules engine's reply appears in the inbox without reopening the minigame | Persist seeded + received messages in game state so a reload keeps them (learn from the fingerprint W1 reload bug) |
| N3 | `result` schema above, and the `minigame_completed` payload documented for scenario authors | — |
| N4 | Payload-kit as abstract items; `link` kind refers to a landing page built in `07` | Cross-component |
| N5 | A read-only **`mail-reader`** component (message list + reading pane) factored out and shared with the triage defender (`05`), which renders the same inbox read-only | Shared with 05 |

## Reuse across audiences

- **Student lab:** full composer, red-flag meter off after the first target, multiple targets with
  escalating rule strictness, replies that teach.
- **Awareness:** fewer fields, meter on, one or two targets per episode, then flip to the inbox as
  the defender surface for `05`.
- **Mission:** one target, framed in dialogue; the landed-phish global gates the next room.

## Assets

- Mail-client chrome (window frame, folder icons, unread dot, attachment chip) — pixel UI, PixelLab.
- Attachment-kind icons (doc, pdf, spreadsheet, link) — small pixel icons.
- No character art of its own (uses existing portraits for contacts where a scenario wants them).

## Open questions

- OQ1 (→ user Q2): free-text vs structured body — defaulting to guided free-text. See
  `QUESTIONS_FOR_USER.md`.
- OQ2: should the inbox persist across the whole scenario (one inbox the player returns to) or be
  per-object? Default: one persistent inbox per scenario, opened from any "workstation" object.
- OQ3: do we need a Sent folder for the defender's role-swap ("find your own phish among real
  mail")? Default: yes, cheap, and it sets up `05`.
