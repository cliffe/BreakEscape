# 05 — Inbox triage (the defender mirror and the awareness assessment)

Status: plan. Built on the mail client (`01`) and the rules engine's factor library (`04`). This is
the defender's seat, and the pre/post measurement the awareness product depends on. Factor ids,
canonical red-flag strings and the `senderAuth` model come from the shared contract,
`00_data_contract.md` §2; this doc defines none of its own. Engine items `S1` to `S14` are in `00`
§12 and are referenced, not repeated.

**Triage is data, not ink.** Unlike the attacker-side email loop, where a target NPC's ink story
writes the reply (`00` §10), triage is content-driven: a fixed set of incoming messages with authored
truth, flags and notes, scored by a pure function. No NPC story runs here. The only in-world voice
is the short authored "IT Security" reply to a report. One message kind is built from the player's own
sent mail (`playerSent`, below), but it is still scored as data: its truth comes from the stored
`EvalResult.tells`, not from ink.

## Purpose & audience

The player is handed an inbox of mixed real and phishing mail and has to decide, for each message,
**trust, report or delete**, then say *why* by naming the red flags they saw. Every verdict gets
feedback that names the flags they caught and the ones they missed.

It uses the mail client (`01`) as its surface and the **same factors and the same red-flag strings**
as the rules engine (`04`), so the thing a student learns to build in the attacker's seat is exactly
the thing they are asked to spot here. Attack and defence cannot disagree about what a tell is.

Audiences, and what each gets:

- **Awareness learners** (primary): a 10-message round used as a **pre-test and post-test**. It
  produces a score and a per-skill breakdown, which is the evidence-of-effect measurement hook. Plain-language flag names, header view
  collapsed behind a "Show details" button, no jargon unless the learner opens it. The episodes' own
  defend sets (`11`) hold 5 to 8 messages.
- **Cyber Security students:** the lab's round is **8 messages**: 6 authored plus 2 `playerSent`
  (the student's own phishes, replayed). The header view is on by default, the SPF / DKIM / DMARC
  panel is in full, and look-alike domains **pass** authentication (the lesson that a pass is not a
  trust verdict).
- **Eldritch Hacker:** a short 3–5 message round framed in dialogue ("sort the director's inbox
  before the real phish gets opened"), the result gating a door or an objective. Where the setting
  uses DMs or a feed rather than email, the same round runs on that variant of the reader.

Maps to the book (Joe Gray, *Practical Social Engineering*): Ch. 9 (detection, measurement,
reporting: the **report** button and the report-rate metric), Ch. 10 (proactive defence: the habits
the round drills) and Ch. 11 (technical email controls: SPF, DKIM, DMARC, and reading the result).

## Player goal in their own words

"Sort this inbox without getting caught out: open the real mail, flag the fakes, and know why."

## The loop / steps

One overlay. The frame, buttons and step strip use the game's pixel UI theme; every word the player
reads or compares (headers, addresses, subjects, bodies, chip labels, review text) is in the bundled
readable sans-serif (`01` "Visual style"). A step strip across the top:
`1 Brief · 2 Sort · 3 Review · 4 Result`. It reuses
the two-pane layout of `01`: message list on the left, reading pane on the right, in a **read-only
mode** (no Compose, no Send).

### Step 1. Brief

A short card: what this round is ("Pre-assessment: 10 messages"), what the three buttons mean, and
how it is scored in one line ("Right call is most of the score; naming the flags is the rest").
For a mission round the brief is in-character. For a **pre-test** it adds: "This one is just to see
where you are. You'll see what you got right and wrong at the end." For a training round it says
feedback comes after each message. One **Start** button. The mode is set by the scenario
(`feedbackMode`, below).

### Step 2. Sort

The list shows the round's messages in the author's fixed order (display name, subject, time, as
in `01`). The player opens one and sees the **From line with the display name and the real address
both shown**, To, subject, body, and any attachment chip, as `01` already specifies. Three
inspection aids, none of which cost anything:

- **Hover a link.** Hovering a link in the body shows its real destination in a status bar at the
  foot of the pane, exactly as a browser does. The link text and the destination can differ; that
  gap is the flag. The link cannot be clicked (nothing opens), and a click or tap, or keyboard focus,
  shows a pinned "This would have gone to: …" line so touch and keyboard users get the same
  information. Nothing in the round is hover-only.
- **Show details.** A button opens the simplified header panel (see "Header panel", below).
- **What's this?** A small glossary tooltip on the words SPF, DKIM and DMARC, three lines each
  (what it checks, what pass / fail / none mean, what it does not tell you). Student rounds show it
  open by default; awareness rounds leave it closed.

To give a verdict the player presses one of three buttons under the message:

| Button | Meaning in the round |
|--------|----------------------|
| **Trust** | "This is real. I'd open it / act on it." |
| **Report** | "This is a phish. Send it to security." (The Ch. 9 habit.) |
| **Delete** | "This is junk. Bin it." (Safe for you, but nobody else is warned.) |

Pressing a button opens a **"What made you say that?"** chip list. The chips are the round's
factor names in plain language, plus **Nothing looks wrong**. The player ticks any number, then
confirms. The verdict is locked on confirm (no undo within the round; keeps scoring simple and the
measurement clean).

- Chips shown per message: for an email, the seven factors (see "Rules" for the list) plus any
  channel tells the set enables, always in the same order. For a non-email kind (`sms`, `call`,
  `push` and the rest) the chips are only the set's enabled channel tells, again in a fixed order,
  because the email factors do not apply to it. **Nothing looks wrong** is always offered. The
  player is never shown only the right ones, so the list is not a giveaway.
- A message with a **Trust** verdict and **Nothing looks wrong** ticked skips straight on.
- On a narrow screen (`01` "Narrow screens") the chip list is a full-width checklist in a bottom
  sheet with 44 px rows; the three verdict buttons stack under the message; the header panel opens
  as its own screen. Chips are real checkboxes with labels; verdicts and chip results are announced
  with `aria-live="polite"`; ticks and crosses are always paired with words.
- Each message shows a small tick in the list once it has a verdict. The round ends when every message has a
  verdict. There is no timer: this is a judgement test, not a speed test, and a timer would
  measure reading speed for the wrong reasons.

### Step 3. Review

Shown **after each message** when `feedbackMode` is `"immediate"` (training and missions), or **all
together after the last message** when it is `"end"` (the pre/post test, so the first answers
cannot help the later ones). Either way every message gets the same card:

- The verdict the player gave, and whether it was the right call, in one line.
- A list of the message's **real red flags**, each marked `Caught` or `Missed`, using the red-flag
  strings resolved as in `00` §2.
- Any **false flags** the player ticked, each with a one-line reason it was actually fine.
- For a phish the player trusted or deleted: what would have happened ("Clicking would have sent
  your payroll login to a page the sender controls").
- For a message that was **reported**: a short in-world reply from "IT Security" ("Thanks. Confirmed
  as a phish, we've pulled it from the other inboxes."), or for a real one, a gentle "That one was
  real, but reporting is never wrong when you're unsure: here's what to check next time."

In `"end"` mode, the Review step is a scrolling list of those cards, worst-first, with a **Jump to
a message** control.

### Step 4. Result

The score (see "Rules"), three headline numbers (**Phish caught**, **Reported rather than just
deleted**, **Real mail trusted**), a **skill breakdown** by factor ("Sender address: caught 3 of 4;
Links: caught 1 of 3; Header checks: caught 0 of 2"), and one pointer to the weakest skill with a
nudge toward the relevant attacker-seat minigame or lab-sheet section. Buttons: **Finish**; in
training only, **Try the other set**; and, for a training or mission set below its `passPercent`,
**Try again** (N6; the lab depends on it). In a pre-test the result screen also says "Come back for
the follow-up after your training". The stage travels with the result globals (`triage_pre_*`), which
is what lets the post-test show the change.

## The rules / scoring

Everything below is deterministic: the same answers always give the same score, and the scoring is
a pure function (`scoreTriage`) with no randomness and no model call.

### The factors (imported from `00` §2)

The flag chips are the factor ids and canonical red-flag strings of `00_data_contract.md` §2, used
as they are: `senderTrust`, `senderAuth`, `addressedTo`, `pretextRelevant`, `attachmentPlausible`,
`urgencyCalibrated`, `linkCredible`. A message's `truth.flags` lists these ids, so a flag can be
compared directly with what `04` produces for the same tell. The only text this doc owns is the
plain-language **chip label** (below) and the per-message notes.

| Chip label (plain wording, 05's own) | Factor id (00 §2) | What it catches |
|--------------------------------------|-------------------|-----------------|
| The sender's address doesn't match who it says it is | `senderTrust` | display name vs real address |
| The header checks failed or don't line up | `senderAuth` | SPF / DKIM / DMARC result, read correctly (see below) |
| It doesn't use my name | `addressedTo` | generic greeting |
| There's no good reason I'd get this | `pretextRelevant` | unexpected topic for this person |
| The attachment doesn't fit | `attachmentPlausible` | wrong type, or one that is claimed but missing (00 §2 states) |
| It's pushing me to hurry | `urgencyCalibrated` | pressure, deadlines (a tell the defender reads; never a pass/fail gate on the attack side) |
| The link goes somewhere else | `linkCredible` | link text vs real destination |
| Nothing looks wrong | (no flag) | the "this is fine" claim |

**Channel tells.** A set may also enable any of 00 §2's channel tells as extra chips, with 00's
canonical strings: `lookalike_domain`, `changed_bank_details`, `unexpected_qr`,
`unrequested_mfa_push`, `smish_shortlink_urgency`, `vish_callback_pressure`, `secrecy_or_bypass`,
`borrowed_authority`, `reply_to_differs`, `reply_stop_trick` and `padlock_myth` (the defend-only ones
are marked in `00` §2). Email-only rounds leave them off; the awareness episodes (`11`) turn on the
ones their channel needs. They score exactly like the seven factors.

`senderAuth` is the shared both-seats factor in 00 §2: advisory on the attack side, scored here. 05
reads its defence-side outcome, the header panel. A per-target `factorStrings` override (00 §2
"Red-flag resolution") may change the *flavour* of a string for one message, never the id.

### Scoring profiles

Triage is scored under a `scoringProfile` named in the set. 05 owns two. They share the 60/40 split
and the phish table; they differ only in how they treat **genuine mail the player distrusts**.

| | `analyst` (lab / SOC seat) | `awareness` (staff training) |
|---|---|---|
| Real mail, Trust | 60 | 60 |
| Real mail, Report | 20 | **60** (a safe action; never penalised) |
| Real mail, Delete | 0 | 30 (cautious, but nobody learns from it; feedback nudges towards Report) |
| Reasons on real mail | 40 / 20 / 0 by false flags | **40 always** (no precision penalty) |
| Reasons on a phish | `40 × clamp((caught − falseClaims) / F, 0, 1)` | `40 × clamp(caught / F, 0, 1)` |
| `falseAlarms` shown on result | yes, as a cost | not shown (still recorded) |

The analyst profile teaches precision: a SOC that reports everything drowns. The awareness profile
exists because staff who are punished for reporting stop reporting (book Ch. 9, no-blame culture);
reporting genuine mail is simply a safe action there. The numbers below are the analyst profile;
the worked example gives both. **`11` selects `awareness`.** The lab (`10`) selects `analyst`.
A mission picks either; default `awareness`. A set may enable a fourth verdict, **Verify** (see
"Extensions for the awareness episodes"); it scores like Report in the `awareness` profile and is
unavailable in `analyst` sets.

### Per-message score (0–100), analyst profile

Each message is worth 100: **60 for the verdict, 40 for the reasons.**

Verdict points:

| Message is | Report | Delete | Trust |
|------------|-------:|-------:|------:|
| A phish | 60 | 30 | 0 |
| Real mail | 20 | 0 | 60 |

Reasons points (`flagPoints`, out of 40):

- For a **phish** with *F* authored real flags: `40 × clamp((caught − falseClaims) / F, 0, 1)`.
  A phish with *F* = 0 is not valid for scoring: authored phish must list at least one flag
  (validator), and a `playerSent` message with no tells is left out of the set (below), so the
  division never meets zero.
- For **real mail**: 40 if no flag ticked (or "Nothing looks wrong"), 20 if one false flag, 0 if two
  or more.

Why these numbers: reporting a phish is the full-marks action because a report warns everyone else
(Ch. 9); deleting protects only you, so it earns half. Reporting a real message costs 40 points of
the verdict but is not zero, because over-reporting is the right failure mode for an unsure
learner. Deleting real work earns nothing. Naming flags counts for less than the verdict, but
`caught − falseClaims` means ticking every chip does not pay.

### Round score and bands

`percent = round(mean of message scores)`, halves rounded up. Authored bands set the headline word,
chosen to be kind to a pre-test:

| Percent | Headline |
|---------|----------|
| 85–100 | Sharp: you caught the phish and knew why |
| 60–84 | Getting there: a few tells slipped past |
| 0–59 | Worth practising: here's where to look first |

The **headline numbers** are computed alongside: `phishCaught` (phish with verdict Report,
Delete or Verify), `reportRate` (phish with verdict Report ÷ phish), `falseAlarms` (real mail reported or
deleted), `flagRecall` (caught ÷ authored flags across phish), and `perFactor` (caught and missed
per factor). `reportRate` is deliberately separate from `phishCaught`: the book's Ch. 9 point is
that reporting, not merely not-clicking, is what a defender programme measures.

### The header panel (concept level)

"Show details" opens a simplified, **fictional** header block. It is a teaching rendering, not a raw
`.eml` dump, and it contains nothing an attacker could lift into a real message.

```
Display name:   Ledgerwell Payroll
From address:   payroll@ledgerwell-hr.example
Sent by (envelope): bounce.ledgerwell-hr.example
Reply goes to:  payroll@ledgerwell-hr.example

Authentication-Results
  SPF    pass   "The server that sent this is on the list its domain publishes."
  DKIM   pass   "The message carries a signature its domain vouches for, and it wasn't changed."
  DMARC  pass   "SPF or DKIM passed AND matched the From domain, so the domain's policy is met."
```

Each result is clickable for a three-line explainer. The concept-level facts the game teaches, and
the ways it must not mislead:

- **SPF** checks that the *sending server* is on the list of servers the *envelope* sender's domain
  publishes. It does not look at the visible From address. **Pass / fail / none:** pass = listed;
  fail = not listed; none = the domain publishes no list (no verdict either way).
- **DKIM** checks a cryptographic signature added by the sending domain over parts of the message.
  Pass = signature valid and the signed parts unchanged; fail = signature doesn't verify (changed in
  transit, or not the key it claims); none = not signed.
- **DMARC** ties the two to the **visible From domain**. It passes when SPF *or* DKIM passes **and**
  the passing domain matches ("aligns with") the From domain. The domain owner's DMARC policy
  (`none`, `quarantine`, `reject`) says what receivers should do on failure. None = no policy
  published.
- **A pass is not a trust verdict.** Authentication proves *which domain* sent the mail, not that the
  domain is honest. An attacker who owns `ledgerwell-hr.example` can pass all three for that
  domain. So the header panel is read **alongside** the address, never instead of it.
- **A fail is a clue, not proof.** Forwarding often breaks SPF and mailing lists (which rewrite the
  message) often break DKIM, so one failure with a DMARC pass is usually legitimate.
- **None is not safe.** "None" means no one is vouching, which is a reason for more care, not less.
- **The forwarded case stays in the lab and is made easy to read.** A genuine message that reached the
  recipient through a colleague's forward carries a "Forwarded by a colleague" banner above the header
  panel. Each result is a word as well as a colour (pass, fail, none). Below the three results the panel
  adds one authored plain-English line saying what they add up to ("SPF failed, but DKIM and DMARC passed.
  A plain forward often does this, and it is usually fine."). The message comes late in the set (sixth of the lab's eight),
  after the look-alike-domain item that teaches "a pass is not a trust verdict", so the student meets
  the simple reading first. A facilitator who wants it out for a first-year cohort removes the message
  from the set (data only).

The game never explains how to forge any of these results, how to set up a sending domain, or how to
get a message past a receiver. That is deliberate ("model, don't weaponise"). The attacker
seat in `01`/`04` teaches that *the visible From is spoofable*; this doc teaches how a defender
detects that.

### Worked example (4 messages, `feedbackMode: "immediate"`)

Fictional company Ledgerwell (`ledgerwell.example`, as in `01`/`04`). Four messages:

| # | Message | Truth | Real flags |
|---|---------|-------|------------|
| 1 | IT: "Your new laptop", from `it@ledgerwell.example`, auth all pass | Real | none |
| 2 | "Ledgerwell Payroll": "Verify your bank details today", from `payroll@ledgerwell-hr.example`, link text `ledgerwell.example/payroll` but destination `ledgerwell-hr.example/login`, auth all pass | Phish | `senderTrust`, `linkCredible`, `urgencyCalibrated` |
| 3 | "Parcel Desk": "Delivery failed", from `delivery.notice4421@mailbox.example`, "Dear customer", `.zip` attached | Phish | `senderTrust`, `addressedTo`, `attachmentPlausible` |
| 4 | Jed Baker: "Friday balance sheet", from `j.baker@ledgerwell.example`, forwarded on by a colleague: SPF fail, DKIM pass, DMARC pass | Real | none |

The player's answers and the feedback shown after each:

1. **Trust**, nothing ticked. Verdict 60 + reasons 40 = **100**.
   *"Right call. Address matches IT's real domain, SPF, DKIM and DMARC all pass, and you were
   expecting a laptop. Nothing to flag."*
2. **Report**, ticked sender, link, attachment. Verdict 60. Reasons: caught 2 (sender, link), missed
   1 (urgency), false claim 1 (attachment): `40 × (2−1)/3` = 13. Score **73**.
   *"Right call: reported. Caught: sender address doesn't match who it says it is (ledgerwell-hr
   is not ledgerwell); the link goes somewhere else (text says ledgerwell.example, destination
   is ledgerwell-hr.example). Missed: it's pushing me to hurry ('today'). Not a flag here: there
   was no attachment. Header note: SPF, DKIM and DMARC all passed, because the sender controls that
   look-alike domain. A pass tells you which domain sent it, not that you should trust it."*
3. **Delete**, ticked sender and greeting. Verdict 30. Reasons: caught 2 of 3, no false claims:
   `40 × 2/3` = 27. Score **57**.
   *"Safe, but not reported. Deleting protects you; reporting warns everyone else. Caught: sender
   address, generic greeting ('Dear customer'). Missed: the attachment doesn't fit (a zip for a
   delivery notice you didn't ask for)."*
4. **Report**, ticked "header checks failed". Verdict 20 (real, reported). Reasons: one false flag
   = 20. Score **40**.
   *"That one was real. Reporting an unsure message is never wrong, so keep doing it, but here is
   why this one was fine: SPF failed, yet DKIM passed and DMARC passed, which is what DMARC needs.
   A plain forward often fails SPF, because the forwarding server isn't in the original domain's list, while the untouched body keeps DKIM valid. The sender matches Jed, the topic matches
   the Friday balance sheet you expect, no odd link."*

Round, analyst profile: (100 + 73 + 57 + 40) / 4 = 67.5, which rounds to **68%**, "Getting there". `phishCaught` 2 of
2, `reportRate` 1 of 2, `falseAlarms` 1, `flagRecall` 4 of 6. The result screen's skill line:
"Sender address: 2 of 2. Links: 1 of 1. Greeting: 1 of 1. Pressure: 0 of 1. Attachments: 0 of 1."

Same answers, **awareness profile**: message 1 = 100; message 2 = 60 + `40 × 2/3` = 87 (the false
attachment claim no longer subtracts); message 3 = 57; message 4 = 60 (reporting real mail is safe)
+ 40 = 100. Round (100 + 87 + 57 + 100) / 4 = **86%**, "Sharp". The message 4 card changes tone:
*"Reported, and that's never wrong. For next time, here's why this one was fine: SPF failed, yet
DKIM and DMARC passed…"*. No false-alarm count appears on the result screen.

### Why every verdict explains itself

A judgement the learner cannot see is a judgement they cannot learn from. Here every verdict shows its
reasoning, nothing is matched by substring (flags are exact factor ids on authored data), no
response is silent or blank (authored strings are linted, `04` N3), and no message is a dead end:
a wrong call tells the player what they would have seen, and they can always continue.

## Scenario-authored data

The minigame holds no content. A scenario supplies `social.triageSets` next to `social.mailClient`
(`01`) and `social.phishTargets` (`04`) (`00` §11). The object that starts a round is a
`triage-workstation` carrying only `minigameData: { triageSetId }`. **A set holds its messages
inline.** It has no `mailbox` field, and the reader shows the set's own `messages`.

A message uses the authored-message shape of `00` §10a: `id`, `from { name, address }`, `to`, `subject`,
`time` (a display clock string such as `"09:12"`), `body` (which may hold `{{link:<id>}}` tokens that
point into `links[]`), `links[]`, `attachments[]`, and, for triage, `auth` and `truth`. The loader
normalises it as it does seeded mail (`read = !unread`, `gameTime` from the game clock at load).
`truth.flags` is safe from the server's `flags` stripping because it sits inside `social.triageSets`;
do not move it onto an object or NPC. **Red-flag text is not defined here.** It is resolved exactly as
`00` §2 specifies: a per-target/per-message `factorStrings` override if the author set one, otherwise
00 §2's canonical string. 05 adds only the chip labels, per-message notes and `playerSentAuth`.

```jsonc
"triageSets": [
  {
    "id": "pre_a",
    "chipStyle": "plain",           // "plain" | "technical" | "character": picks a built-in label table
    "flagChips": {                  // optional per-set overrides; keys are 00 §2 factor / channel-tell ids
      "senderTrust": "The sender's address doesn't match who it says it is",
      "senderAuth":  "The header checks failed or don't line up",
      "addressedTo": "It doesn't use my name"
      // ... one per factor in use (and any enabled channel tell), plus "none": "Nothing looks wrong"
    },
    "stage": "pre",                 // "pre" | "post" | "training" | "mission"
    "scoringProfile": "awareness",  // "awareness" | "analyst" (see Scoring profiles)
    "channelTells": [],             // optional 00 §2 channel-tell ids to enable as chips
    "pairedWith": "post_b",         // the parallel form for the other stage
    "title": "Inbox check: where are you now?",
    "feedbackMode": "end",          // "end" | "immediate"
    "headerPanel": "collapsed",     // "collapsed" | "open" | "off"
    "glossary": "closed",           // "closed" | "open" | "off"
    "bands": [
      { "min": 85, "headline": "Sharp: you caught the phish and knew why" },
      { "min": 60, "headline": "Getting there: a few tells slipped past" },
      { "min": 0,  "headline": "Worth practising: here's where to look first" }
    ],
    "outcome": { "setGlobalPrefix": "triage_{stage}_", "passPercent": 0 },
        // {stage} is the effective stage (pre, post, training or mission), so this set writes
        // triage_pre_percent, _reportRate, _done and the boolean _pass when run as pre. The validator
        // declares the four globals for the stage the mission's kiosk launches, and skips any name the
        // mission imports (00 section 11). passPercent is 0 because this is a check set: its task keys
        // on _done and there is no pass mark. Lab and mission sets use 60.
    "messages": [
      {
        "id": "m2_payroll",
        "from": { "name": "Ledgerwell Payroll", "address": "payroll@ledgerwell-hr.example" },
        "to": "you@ledgerwell.example",
        "subject": "Verify your bank details today",
        "time": "09:12",
        "body": "Hi,\nWe are updating payroll records. Confirm your bank details today to avoid a delay to your pay.\n{{link:verify}}",
        "links": [ { "id": "verify", "text": "ledgerwell.example/payroll",
                     "destination": "https://ledgerwell-hr.example/login" } ],
        "attachments": [],
        "auth": { "spf": "pass", "dkim": "pass", "dmarc": "pass",
                  "envelopeFrom": "bounce.ledgerwell-hr.example",
                  "replyTo": "payroll@ledgerwell-hr.example" },
        "truth": {
          "isPhish": true,
          "flags": ["senderTrust", "linkCredible", "urgencyCalibrated"],
          "perFlagNote": {   // diegetic explanation per flag; the red-flag label itself comes from 00 §2
            "senderTrust": "ledgerwell-hr is not ledgerwell: a look-alike domain",
            "linkCredible": "The text says ledgerwell.example; the destination is ledgerwell-hr.example",
            "urgencyCalibrated": "'Today' and 'delay to your pay' is the pressure"
          },
          "headerNote": "All three passed because the sender owns the look-alike domain. A pass names the domain that sent it; it doesn't make it yours.",
          "ifTrusted": "Clicking would send your payroll login to a page the sender controls.",
          "reportReply": "Thanks. Confirmed as a phish: we've pulled it from the other inboxes."
        }
      },
      {
        "id": "m4_jed",
        "from": { "name": "Jed Baker", "address": "j.baker@ledgerwell.example" },
        "to": "you@ledgerwell.example",
        "subject": "Friday balance sheet", "time": "08:40",
        "body": "Hi, Q3 balance sheet attached, can you check the profit line before Friday?",
        "attachments": [ { "label": "Q3_balance_sheet.xlsx", "kind": "spreadsheet" } ],
        "auth": { "spf": "fail", "dkim": "pass", "dmarc": "pass" },
        "truth": {
          "isPhish": false,
          "flags": [],
          "whyFine": {
            "senderAuth": "SPF failed, but DKIM passed and DMARC passed. A plain forward often breaks SPF alone.",
            "default": "Sender matches Jed, the topic matches the Friday balance sheet you expect, nothing odd in the link."
          }
        }
      }
    ]
  }
]
```

### `playerSent` messages: the defender flip

A set may include messages built from the player's own sent mail, so the student reads their phish as
the recipient saw it (`10` stage 7, `11`). A `playerSent` entry names where to draw from:

```jsonc
{ "kind": "playerSent", "id": "own_lord",
  "targetId": "lord",                  // the phishTarget whose message to replay (the latest sent one whose tells include senderTrust or senderAuth, else the latest with any tell, from whichever account sent it)
  "domainFrom": "landing_domain",      // optional, on a playerSent entry only: show the look-alike domain the player picked in 07, as typed (a homograph pick draws with its Cyrillic letter in the bundled face, `00` §6, and the tells line may add its punycode form as a contrast)
  "notes": { "perFlagNote": { "senderTrust": "...", "linkCredible": "...", "urgencyCalibrated": "..." },
             "headerNote": "...", "ifTrusted": "...", "reportReply": "..." } }   // authored once per target
```

The set carries one `playerSentAuth` table, next to `messages`:

```jsonc
"playerSentAuth": {
  "accounts": {                         // a row for every id in social.mailClient.accounts: guest and freemail in the lab
    "guest":    { "spf": "fail", "dkim": "none", "dmarc": "fail", "envelopeFrom": "workstation.example", "replyTo": "guest@workstation.example" },
    "freemail": { "spf": "pass", "dkim": "pass", "dmarc": "pass", "envelopeFrom": "freemail.example", "replyTo": "{account_address}" }
  },
  "domains": {                          // a row for every id in the landing-page domain menu (07): six in the lab
    "d_unrelated": { "spf": "pass", "dkim": "pass", "dmarc": "pass", "envelopeFrom": "bounce.{domain}", "replyTo": "payroll-notices@{domain}" },
    "d_letter":    { "...": "same shape" },
    "d_word":      { "...": "same shape" },
    "d_sub":       { "...": "same shape" },
    "d_vv":        { "...": "same shape" },
    "d_homo":      { "...": "same shape" }
  }
}
```

- **Source.** Across the Sent folders of every mailbox in `mailState` (the triage workstation
  carries no account list of its own), whether or not the send landed, the loader picks the latest
  persisted **sent** record (`00` §10a) whose `targetId` matches and whose `tells` include `senderTrust`
  or `senderAuth`, the two spoof tells that only a spoofing account can raise. If no record has either,
  it takes the latest matching record with any tell. A later send with only account-independent tells
  (a retry from `freemail`, which cannot spoof but still carries `urgencyCalibrated`, and
  `linkCredible` when a page is attached) never shadows an earlier spoofed send, and a record with no
  tells is never replayed. The account that sent it is read from the record's `fromAccount`. An
  optional `fromMailbox` restricts the search to one mailbox; the lab omits it. If no sent record to
  that target has any tell, the entry is skipped.
- **Shape.** The loader builds an authored message from the record: `from` and `to` as stored, the
  stored rendered `body`, `links[]` from the record's `link` (the link text is the page's authored
  `linkText`, the destination is the picked domain from `07`'s menu, looked up by `link.domainId`),
  `attachments[]` from the record's `attachment`, `time` from the record, and `auth` from
  `playerSentAuth`. `truth` is `{ isPhish: true, flags, ...notes }`.
- **Truth.** `truth.flags` is the stored `tells`, independent of whether the phish landed (`00` §3).
  A landed phish has an empty `redFlags` but non-empty `tells`, which is exactly what the defender is
  asked to find. A message with no tells is left out of the round, so *F* is never 0. `perFlagNote`
  strings come from `notes`, one per tell id.
- **Auth results.** Authored literals, never computed from anything the player typed.
  - *The record has no `link.domainId`* (the chosen record carried no page, or its link was
    `missing`): the auth is the row for the record's real `fromAccount` in `accounts`, and
    `linkCredible` is dropped from `truth.flags` (`04` raises that tell only when a link domain is
    set). If no tells remain, the entry is skipped.
  - *The record has a link*: `linkCredible` stays in `truth.flags` whatever `domainFrom` says, and the
    link destination is shown from `link.domainId` as in Shape. Without `domainFrom`, the auth is the
    row for the real `fromAccount` in `accounts`: a message sent from `guest` while claiming another
    person shows the fail result that row gives. With `domainFrom: "landing_domain"`, the From
    address's domain, the envelope and the reply-to take the domain picked in `07`, read only from the
    sent record's `link.domainId` (copied from the page record when the message was sent, so a later
    rebuild of the page does not change the replay), and the auth is that id's row in `domains`. The
    attacker owns that domain, so the lab's rows pass all three. The panel then shows a pass for a
    phish, so `senderAuth` is removed from `truth.flags` for that entry; the flags that remain are the
    ones a reader can find (`senderTrust`, `linkCredible`, `urgencyCalibrated` for the lab's Lord
    phish). `domainFrom` changes only the From domain, envelope, reply-to and auth row.
  - A missing account or domain id fails validation. The lab ships `guest` and `freemail` only.
- **Reply-to local part.** A domain row's `replyTo` uses the same local part as the replayed From
  (the page's `portal_address`, `payroll-notices`), so the panel never shows a Reply-to that differs
  from the From and `reply_to_differs` is not implied by the replay.
- **Placeholders in `playerSentAuth`.** The loader substitutes exactly two tokens: `{account_address}`
  (the address of the resolved account, which for `freemail` depends on the `createMenu` choice) and
  `{domain}` (the `domain` of the picked menu option, as typed; its `browserDomain`, when it has one, is available as a contrast line). No other placeholder is
  allowed and the validator refuses an unresolved brace; the pass, fail and none values stay literal.
- **`domainFrom` belongs to `playerSent` only.** Authored messages carry literal `auth` rows. The lab's
  authored look-alike payroll notice names its own look-alike domain; it does not substitute the
  student's pick.
- **Set size.** The lab's set is 8 messages: 6 authored plus 2 `playerSent` (the Pierce and Lord
  phishes). If a `playerSent` entry is skipped the round is shorter and `percent` is the mean over the
  messages present. The other audiences' sizes are in "Reuse across audiences".
- **Balance.** Parallel-form checks (N5) skip `playerSent` entries, and a set that contains them is
  not one half of a `pairedWith` pre/post pair.
- **Replay only.** The reader shows the stored message; it never lets the player edit or resend from
  triage.

Notes for authors:

- **Parallel forms.** `pre_a` and `post_b` must match on size, on the number of phish, on how many
  of each factor appears, and on at least one "pass-but-bad" and one "fail-but-fine" message, with
  *different* messages and companies' people. Same content in both would measure recall, not skill.
  The validator checks the factor counts (N5).
- **Fixed order.** Messages show in authored order. No shuffle, so two learners' scores are
  comparable. (A seeded shuffle per `gameId` is an option; see OQ4.)
- **Every phish has a non-empty `perFlagNote` per flag; every real message has a `whyFine`.** The
  lint refuses empty strings.
- Facts for a message (names, roles, the Friday sheet) can be drawn from the OSINT/intel data (`02`,
  `03`) so the same fictional world appears in attack and defence.
- Authentication results are **authored literals**. The game never computes them from anything a
  player typed, so there is no pathway from this data to a working spoof.

### Extensions for the awareness episodes

The awareness episodes (`11` §6.4) use four additions, all data on the same component.

- **Verify verdict.** A set with `verifyVerdict: true` shows a fourth button, **Verify** ("I would check
  this by ringing a number I already hold"), for the episodes that teach it. In the `awareness`
  profile it scores like Report (60 on a phish, 60 on real mail, reasons unchanged). A phish
  answered Verify counts as caught (`phishCaught`). `reportRate` still counts Report only; the
  result adds `verifyCount`. Sets that do not enable it behave as
  described above, and `analyst` sets never enable it.
- **Non-email kinds.** A message has a `kind`, default `email`. The others are `sms`, `voicemail`,
  `qr`, `page`, `call` and `push`. Each renders through a small per-kind surface in the reading pane (a text bubble,
  a transcript card, a pixel QR on a notice, a page card) with the same `truth`, notes and scoring.
  Its `truth.flags` ids come from the set's enabled channel tells, and it has no `auth`, so the
  header panel is hidden for it.
- **`push` kind.** A `push` message is one MFA prompt card in the reading pane (app name, time,
  location line, with **Approve**, **Deny** and **Deny and report** buttons in place of the three
  verdicts). The actions score through existing verdict rows: Approve as Trust, Deny as Delete, Deny
  and report as Report (counts towards `reportRate`). Its tell is `unrequested_mfa_push` (`00` §2,
  defend-only), it has no `auth`, and like `call` it belongs to an `awareness` set. `11` E3 uses it
  for its one MFA item; the continuous push stream overlay (`11` N11) is separate from the set.
- **`call` kind.** A `call` message is a transcript card of the caller's lines (a `transcript[]` of
  `{ who, text }`, plus `callerId`) and replaces the three verdict buttons with four actions. Each
  action scores through an existing verdict row, so there is no new table: **comply** scores as
  Trust, **escalate** (pass it to security) as Report and counts towards `reportRate`, **refuse**
  (hang up) as Delete, and **verify_callback** (ring back on a number already held) as Verify. A set
  that holds `call` messages is an `awareness` set with `verifyVerdict: true`, because `analyst` sets
  never enable Verify (the validator refuses `call` in an `analyst` set). Reasons chips are the set's
  enabled channel tells (`vish_callback_pressure`, `secrecy_or_bypass`, `borrowed_authority`), and
  the review card shows the same Caught / Missed lists. `11` E3 (N15) uses it for the role-swap episode.
  An episode's defend set (five to eight messages) may mix kinds, for example three voicemails plus
  two emails reused from other episodes (`11` E7), which totals five.
- **Stage at launch.** `startInboxTriageMinigame` accepts a `stage` parameter (`pre` or `post`) that
  overrides the set's authored `stage`, so a cohort can be counterbalanced between `pre_a` and
  `post_b`. The effective stage fills the `{stage}` token in `outcome.setGlobalPrefix`, so a form run
  as `post` writes `triage_post_*` and the first-attempt guard reads `triage_post_done`. The validator
  refuses the `stage` launch parameter for any set whose prefix lacks `{stage}`. The effective stage
  is carried by the global names the result is written to.
- **Milliseconds per answer.** `answers[].ms` records the time from opening a message to confirming
  its verdict. It lives in the in-memory `gameResult` only (nothing persists it until OQ1 adds a server
record), and is never shown or scored.

A larger message bank with a seeded draw is not in this plan; forms are fixed.

## Engine wiring

New component `public/break_escape/js/minigames/inbox-triage/` containing:

- `inbox-triage-minigame.js`: `export class InboxTriageMinigame extends MinigameScene`
  (the pattern `notes-minigame.js` follows). The class name matters: `complete()` emits
  `minigameName: this.constructor.name` (`framework/base-minigame.js`), so a listener keys on
  `"InboxTriageMinigame"`. A scenario normally reacts to the outcome globals instead.
- `triage-scoring.js`: the pure `scoreTriage(set, answers) → result` described above. No DOM, no
  globals, so it can be unit-tested with the worked example.
- It renders messages with a **read-only reading pane** factored out of the mail client
  (`minigames/mail-client/mail-reader.js`, `01` N5 and N2 below), so a fix to how `01` shows a From line fixes `05`.

Wiring checklist (the same list every new minigame needs; the README conventions carry it, and `01`
shows it worked through):

1. Export, import and `registerScene('inbox-triage', InboxTriageMinigame)` in `minigames/index.js`.
2. A starter `startInboxTriageMinigame` in `systems/minigame-starters.js`, modelled on
   `startSiemMinigame`, exposed on `window`. It checks `window.MinigameFramework` exists, calls `.init`
   if `mainGameScene` is missing, builds `params` with `lockable`, `showCancel` and an `onComplete`,
   and calls `window.MinigameFramework.startMinigame('inbox-triage', null, params)`. The set comes from
   `lockable.scenarioData.minigameData.triageSetId`. It sets `disableClose: true` and
   `requiresKeyboardInput: true`, and accepts an optional `stage` parameter (see "Extensions for the
   awareness episodes").
3. A branch in `systems/interactions.js` for the `triage-workstation` object type that starts a
   round.
4. A `css/inbox-triage-minigame.css`, linked in `app/views/break_escape/games/show.html.erb`.
5. `requiresKeyboardInput: true`. The chips, verdict buttons and list are keyboard-operable (Tab, Enter,
   Space), and without the flag Space and `E` would act on the world behind the overlay. Each gets a
   bridge test that they do nothing while the round is open.
6. An own **Close** control and Esc binding, because `disableClose` hides the framework's. Closing early
   is not a normal exit here: the minigame sets `gameResult = { aborted: true }` itself and calls
   `complete(false)` (as SIEM and command board do), so a half-finished pre-test is never scored. Esc
   closes an open chip sheet or header panel first.
7. Validator and schema entries for the object's `minigameData` (`00` S11), the sprite
   `assets/objects/triage-workstation.png`, and a `this.load.image('triage-workstation',
   'objects/triage-workstation.png')` line in `core/game.js` `preload()` (object sprites are created
   from a base key that only a preload line guarantees; without it the object renders as Phaser's
   missing-texture box, and the validator's PNG-exists check does not catch that).

**Completion.** The minigame sets `this.gameResult = result` then `this.complete(true)`
(`framework/base-minigame.js`). `complete(true)` fires only when every message has a verdict; closing
early sets `gameResult = { aborted: true }` and calls `complete(false)`, and the starter treats
`result.aborted` as the SIEM starter does, recording nothing. The sample below is the worked example's
analyst round. `result`:

```jsonc
{ "setId": "demo_4", "stage": "mission", "scoringProfile": "analyst", "percent": 68, "headline": "Getting there: …",
  "phishCaught": 2, "phishTotal": 2, "reportRate": 0.5, "falseAlarms": 1,
  "flagRecall": 0.67, "perFactor": { "senderTrust": {"caught":2,"missed":0}, … },
  "answers": [ { "id":"m2_payroll", "verdict":"report", "flags":["senderTrust","linkCredible","attachmentPlausible"], "score":73, "ms":14200 } ] }
```

**Bridging to globals and objectives.** The starter's `onComplete` writes `<prefix>percent`,
`<prefix>reportRate`, `<prefix>done` and `<prefix>pass` through the shared writer (`00` S3, which
`applyActions` `set_global` uses; the prefix is the set's `outcome.setGlobalPrefix` with `{stage}`
replaced by the effective stage). Five rules:

- **Sync, then emit.** The starter calls the writer with `deferEmit` (the S3 option that updates
  `gameState.globalVariables` without emitting `global_variable_changed`), awaits
  `window.stateSync.syncConfirmed()`, and only then emits the `global_variable_changed` events for the four
  names (only those whose value changed, as `deferEmit` returns pending events for changed values only; `00` S3) and its done event, last (`00` §11). The server copy of `globalVariables` is therefore current
  before any `eventMappings` entry fires a task POST, so a `concludeRequires` keyed on
  `<prefix>done` or `<prefix>pass` finds it met. The await applies to every set, not only check sets.
  `sync()` resolves the same way whether the PUT succeeded, failed or was answered `{ stale: true }`, so
  the starter does not use it. `syncConfirmed()` (`00` S3) goes through the same single-flight queue as
  `sync()` and re-issues the PUT with a fresh `clientTs`, with back-off and a capped number of attempts;
  it resolves `true` at once when there is nothing left to send, and a 403 refusal ends it at once. While
  it is retrying, the result screen shows a "Saving your result..." notice and the done event is held;
  nothing is emitted until a sync is confirmed. If the connection never comes back, or the attempts run
  out, nothing is emitted and the task stays incomplete until the player reopens the round (`00` §11).
- **Reopen re-emits.** The 30 s timer or the `pagehide` flush may already have carried `<prefix>done` to
  the server when the tab closed. So when the first-attempt guard finds `<prefix>done` true (N6), the
  starter also checks the conclusion task named in its `conclusionTaskId` param; if that task is not
  `completed`, it awaits `syncConfirmed()` and re-emits the done events. Completion is idempotent on the
  client and the server (`00` §11 "Reopen re-emits").

- **`<prefix>done` means the round was completed, at any score**, and is what the pre/post
  first-attempt guard reads (N6). **`<prefix>pass` means `percent >= outcome.passPercent`.** A task or
  aim that should only complete on a good result keys on `<prefix>pass`, never on `<prefix>done`;
  the validator warns on a mission task keyed on `<prefix>done` when the set has a non-zero
  `passPercent`. Check sets (the pre and post checks of `11`) author `passPercent: 0`, so their
  task keys on `<prefix>done` without the warning. The lab's `triage_done` task therefore completes on `triage_pass`. The lab set
  uses the literal prefix `setGlobalPrefix: "triage_"` (no `{stage}` token), stage `mission` and
  `passPercent: 60`, so its globals are `triage_percent`, `triage_reportRate`, `triage_done` and
  `triage_pass`.
- **Training and mission sets may be re-run.** A result below `passPercent` offers "Try again", which
  starts a fresh round; each completion rewrites `percent`, `reportRate` and `done` with the latest
  round. The starter's writes emit only on a change (`00` S3), so writing `true` again does not refire an `eventMappings` entry,
  while a changed `percent` emits an event that nothing maps.
- **`<prefix>pass` is never cleared.** The starter sets it true when a round reaches `passPercent` and
  does not reset it to false after a later lower round, so a door or task a pass opened stays open.
  `percent` and `reportRate` keep the best round (a lower later round does not overwrite them; M7 change, earlier text said latest round).

A global cannot complete a task or open a lock by itself. An aim's `unlockCondition` is truthy or
`equals` only, but an `eventMappings` `condition` on `global_variable_changed:<name>` accepts numeric
comparisons such as `value >= 60` (`systems/npc-manager.js`, header comment and compare regex). A
boolean is still the simpler contract, so a mission reacts to the boolean
`<prefix>pass` through an `eventMappings` entry on `global_variable_changed:<name>` on an NPC record
(`systems/npc-manager.js`; the lab uses Ruth, a start-room NPC that is always registered) with `completeTask` / `unlockTask`, or through an aim
`unlockCondition.globalVariable`. The awareness product reads `triage_pre_percent` and
`triage_post_percent` to compute the change. The minigame never decides a flag; where a scenario
awards a lab flag for finishing, it goes through `POST /games/:id/flags`
(`flag-station-minigame.js`) as in `01`.

### New engine work

| # | Item | Notes |
|---|------|-------|
| N1 | `inbox-triage` minigame component (sort, chip list, review cards, result screen, narrow layout; the optional Verify verdict and the non-email message kinds) | New overlay |
| N2 | The read-only `mail-reader` shared with the mail client (`01` N5): link-hover status bar with tap/focus pin, header panel | `01` adopts it too so its reading pane and this one never drift |
| N3 | Import 00 §2's factor library and canonical red-flag strings (including `senderAuth` and the channel tells) through the same resolution rule `04`/`01` use (per-target `factorStrings` override, else canonical, never null). 05 adds only the chip label tables | No `04` schema change needed: `senderAuth` is already the shared factor in 00 §2 |
| N4 | `triage-scoring.js` pure scorer and its unit tests in `test/js/social-triage-scoring.test.mjs` (named so the CI glob in `00` S11 runs them; the worked example is test case one) | No framework deps |
| N5 | Scenario validator checks: the `stage` launch parameter only with a `{stage}` prefix, `call` messages only in `awareness` sets with `verifyVerdict` and `push` messages only in `awareness` sets, `playerSentAuth` placeholders limited to `{account_address}` and `{domain}`, `<setGlobalPrefix>` names treated as written (so an `exportGlobals` entry for them raises no "never written" warning), the four `<prefix>` globals declared only for the stage the mission's kiosk launches and any name the mission imports (`importGlobals`) skipped, so an import never collides with an own declaration, `passPercent: 0` accepted on a check set (and the non-zero-`passPercent` warning on a `<prefix>done` task applying to the other sets), parallel-form balance (counts per factor and per truth, skipping `playerSent`), non-empty authored strings, every phish message has `perFlagNote` per flag and at least one flag, `truth.flags` ids exist in 00 §2's factor library or enabled channel tells, `playerSentAuth` has a row for every account id and for every id in `07`'s domain menu, `domainFrom` appears only on `playerSent` entries, a set has no `mailbox` field | Extends the validator (`00` S11); lint like `04` N3 |
| N6 | Result persistence and the **first-attempt guard**: on completion the starter writes `<prefix>percent`, `<prefix>reportRate`, `<prefix>done`, `<prefix>pass` as globals through the shared writer (S3). Globals persist across reload (the writer patches `gameState.globalVariables`; serialised by `state-sync.js` and restored in `core/game.js`'s saved-globals restore, with saved values taking precedence; `00` §5). The writes use `deferEmit`, then the starter awaits `window.stateSync.syncConfirmed()`, which retries with back-off up to a capped number of attempts (a 403 is final) (S3 changes `_syncOnce`, which returns `undefined` on every path today, to return `true` or `false`), before emitting the changed `global_variable_changed` events and its done event (see "Bridging"). Before starting a `pre` or `post` set the starter checks `<prefix>done`: if true, it opens a read-only result screen built from the stored globals (the headline band from `percent`, and the report rate); no replay, nothing overwritten. On that reopen, if the shell's conclusion task (`conclusionTaskId`) is not `completed`, the starter awaits `syncConfirmed()` and re-emits the done events, so a round whose done global reached the server through the timer or `pagehide` flush before the tab closed still completes its task (`00` §11 "Reopen re-emits"); a test reloads with `done` on the server and the task incomplete and checks the task completes once. Per-message answers, `perFactor`, `answers[].ms` and the review cards are not stored and are not shown on the reopen; training and mission sets skip the check | Needs the S3 `deferEmit` option and the boolean `_syncOnce` result behind `syncConfirmed()` (`00` S3). The awareness product still needs a server-side record for anything richer (OQ1) |
| N7 | Starter `startInboxTriageMinigame` in `systems/minigame-starters.js` (with the `stage` parameter and `answers[].ms`), plus the rest of the wiring checklist above | Modelled on `startSiemMinigame` |
| N8 | `scoringProfile` support in `triage-scoring.js`: the two profiles in "Scoring profiles", with a test for each using the worked example (68% analyst, 86% awareness) | Pure function |
| N9 | `playerSent` message kind: reads the latest persisted sent record to the target whose `tells` include `senderTrust` or `senderAuth` (else the latest with any tell), from any mailbox (`01` N12, `00` §10a: `fromAccount`, `tells`, `link`, `attachment`, rendered `body`), takes `truth.flags` from stored `EvalResult.tells`, the `playerSentAuth` literal table and `domainFrom` substitution, with the page-less case above | — |
| N10 | `call` and `push` message kinds: transcript card with the four actions mapped to Trust / Report / Delete / Verify; MFA prompt card with three actions mapped to Trust / Delete / Report; channel-tell chips | `11` N15, E3 |
| N11 | Comparison screen: after a post round, a panel reading `triage_pre_percent`, `triage_post_percent` and the two report rates, and showing the change (`11` §5.2); small, one panel on the result step. **No-baseline gate:** the panel shows the comparison only when the imported `triage_pre_done` is true (and the mission's `pre_check_completed` flag is true); otherwise it shows "no baseline" and the post round's own result only | Reads globals imported from the pre mission under those names. Per-factor counts are not carried between the two missions, so the first slice compares `percent` and `reportRate` only; each round's own result screen still shows its per-factor lists |

## Reuse across audiences

Depth is data, as in `01` and `04`. Same component, different `triageSets` entry:

| Setting | Awareness pre/post | Awareness episode defend set | Student lab | Eldritch Hacker |
|---------|--------------------|------------------------------|-------------|---------|
| Messages | 10 | 5–8 | 8 (6 authored + 2 `playerSent`) | 3–5 |
| `feedbackMode` | `end` | `immediate` | `immediate` | `immediate` |
| `headerPanel` | `collapsed` | `collapsed` or `off` | `open` | `collapsed` or `off` |
| `glossary` | `closed` | `closed` | `open` | `off` |
| Look-alike that passes auth | 1 | 0–1 | 1 authored, plus the student's own | 0–1 |
| Real mail with a failed check | 0–1 | 0 | 1 (the forwarded mail) | 0 |
| Scoring profile | `awareness` | `awareness` | `analyst` | `awareness` (default) or `analyst` |
| Chip wording | Plain | Plain | Technical (factor names, SPF/DKIM/DMARC terms) | In-character |
| After the round | Result, stage stored, pre→post comparison | Result, back to the episode | Result, then the next task | Sets a global that gates progress |
| Retry | Pre/post: first attempt only, enforced by the `<prefix>done` guard (N6) | Free | Free; the task keys on `<prefix>pass` | Free, latest round shown; `pass` stays set once reached |

The awareness product's measurement is: run `pre_a` before the training episodes, `post_b` after,
and compare `percent` and `reportRate` (the per-factor lists stay on each round's result screen). The attacker-first episodes (`11`) sit between
them. The comparison screen shows the learner their own change ("Score 52% to 81%; report rate
40% to 90%") and gives an admin the same data once a server record exists (OQ1).

Two things deliberately **not** in the data model: no scoring weights per scenario (the 60/40 split
and the verdict table are fixed so scores are comparable across scenarios and cohorts), and no free
text from the learner stored anywhere (the chip list is closed, so there is no personal data in a
result).

## Assets

All PixelLab-first; none generated now.

- Reuse the mail-client chrome from `01` (window frame, unread dot, attachment chip, attachment-kind
  icons). No extra art for the list and reading pane.
- The `triage-workstation` object sprite, `assets/objects/triage-workstation.png`.
- Three verdict button icons at 16x16: tick (Trust), flag (Report), bin (Delete).
- Chip-state icons at 12x12: caught tick, missed cross, false-flag dash.
- Header-panel frame and three small status lamps for SPF / DKIM / DMARC (pass green, fail red, none
  grey), 16x16, with a non-colour mark inside each (tick, cross, dash) for colour-blind players.
- Result screen: a 64x64 "inbox" badge in three states for the bands (sharp, getting there,
  practising), reusing the house palette.
- An "IT Security" portrait for the report replies: reuse an existing character where the scenario
  has one; otherwise a 128x128 bust (memory rule: regenerate at target size, never downscale).
- No audio needed. Optional: a short UI confirm blip on a locked verdict, from the existing UI sound
  set.

## Decisions

Not in this plan: page-inspection items. `07` proposes that the triage round also offer "inspect this
page" items built from its `buildSuspectPage` record and step-6 tells (`07` N5). `00` defines no shared suspect-page record, so this doc has no such message kind. If
`00` gains one, the item is a new `kind` beside `playerSent`, with page tells drawn from `00` §2's
`lookalike_domain` and `linkCredible` strings.

Decisions taken (the OQ numbers are kept because other docs cite them):

- OQ1: The pre/post score lives in `gameState.globalVariables` for the lab and Eldritch Hacker. A
  small server-side record per `gameId` is built only when the awareness product is productised
  (`11` §6.3).
- OQ3: The pre-test shows feedback at the end of the round (every message gets its named flags), before
  the post-test. Scores-only until the post-test would measure more cleanly but breaks the "every
  verdict explains itself" rule.

- OQ4: Fixed message order, no shuffle. Easier to compare scores; a seeded shuffle per `gameId` is a
  cheap later change if learners in one room start sharing answers.
- OQ5: No timer. A judgement test, not a reading-speed test.
- OQ6: Verdicts lock on confirm. Keeps the measurement clean; training mode could allow an undo
  later if playtest says it is harsh.
- OQ7: An email's chip list is always the seven factors plus the set's enabled channel tells and
  "Nothing looks wrong"; a non-email kind shows its enabled channel tells plus "Nothing looks wrong".
  Showing only relevant chips would give the answers away.
- Verify on a phish (Phase 7 follow-up, 2026-10-22): it counts towards `phishCaught`, since it
  scores like Report and its card calls it sound; before this the result said "not caught" for
  a full-marks answer. It does **not** count towards `reportRate` ("Reported rather than just
  deleted"). Ringing the sender back on a number you hold stops the fraud against you, but it
  tells nobody else: the security team can't pull the message from other inboxes or warn the
  next person, which is the Ch. 9 point `reportRate` exists to measure. Counting it would also
  let a cohort that learnt to verify, and not to report, show a rise in the pre/post report rate
  it hasn't earned. The result screen shows verifies on their own line ("Checked by another
  route").
- OQ8: The header panel teaches SPF / DKIM / DMARC at concept level only and is authored literals.
  A reviewer should check the three definitions above against a reputable concept source (RFC 7208,
  6376, 7489 overviews) before build; the "pass is not a trust verdict" and "fail is a clue" lines
  are the ones a student would carry away wrong if misstated.
