# 04 — Phish-judging rules engine + layered feedback

Status: plan. A **system**, not a screen: the mail client (`01`) calls it on every send; the triage
defender (`05`) is its inverse, sharing the same factors. Its aim is that judging and feedback are
always visible to the learner. The factor library, `EvalResult`, the template and slot schema, slot
judging and the target schema are defined in `00_data_contract.md` §2, §3, §7 and §10; this doc
applies them and does not redefine them. Engine items `S1` to `S12` are in `00` §12.

It has no player goal or loop of its own (those live in `01`) and **no assets of its own**; the
✓/✗ checklist chrome is rendered by `01` and `05`.

**Division of labour.** The engine **judges**, deterministically, and returns the full per-factor
result. Where the target is a social character (`social.characters`, `00` §8), that character's
**email-channel ink** reacts in character to the result (the reply, the influence change, any outcome
tags; `00` §10). Where the target is plain data, the engine's authored strings are the reply, and a
text job delivers them (`00` §10 "Timing and delivery").

## Purpose & audience

Decide whether a crafted email **lands**, and explain the result in terms the learner takes away as
a red-flag checklist. All three products. Maps to book Ch. 7 (phishing).

Spoken and face-to-face pretexts are judged differently: by the character's influence (`06`, `00`
§8). The two meet on the character: an email's result feeds the same influence global, and
`boostIfGlobal` / `strictIfGlobal` let a call's outcome change how an email is judged.

## Failure modes the rules close off

A phishing lab judged out of the game's sight tends to lose replies off-screen, need a reset to recover, reject
without saying what failed ("it's unrelated to me"), send inverted attachment messages, match on
loose substrings ("cat" matches "location"), "run the attachment" on a message that has none, and
have victims that reject everything. Every one is a feedback or determinism failure. The rules below
each close one off.

## How judging works

A target has a profile of **factors**. Each factor is checked, a result recorded, and the message
**lands only if every required factor passes**. The engine returns the **full per-factor result**,
not just the first failure, so the feedback is complete.

### Factors

The canonical **seven-factor library**, the single shared **red-flag string per factor** and the
canonical **pass and fail lines** are in `00` §2, imported by both this engine and the defender
(`05`). Three points that shape judging:

- **`senderAuth`** models at concept level whether a spoof would pass SPF/DKIM/DMARC alignment. It
  is derived from the **real sending account** and the claimed From (`00` §10a), not authored per
  target: the account's domain is the envelope and signing domain, the header From's domain is the
  visible one, and the claimed domain's `senderAuth` policy says whether the pair aligns. Equal
  domains are aligned, and a claimed domain with no policy (Hampshire's) publishes nothing, so its
  read is `would-pass`. The policy object carries `dmarcPolicy: "none" | "quarantine" | "reject"`
  (`00` §7) alongside `domainPublishesAuth` and `spoofAligns`. A found internal account sending as its own person passes; a freemail
  account sending as the company fails. An author may override the derived result per target.
  Advisory on the attack side: a spoof can still fool a person if delivered, but the player is told it
  would likely be quarantined or flagged. The advisory text is the target's authored
  `factorStrings.senderAuth` line when it has one. Without one it is the canonical `00` §2 line plus
  a clause chosen by `dmarcPolicy`: `none` says the message is still delivered, `quarantine` that it
  would likely be quarantined, `reject` that it would be rejected. AccountingNow publishes `p=none`,
  and Pierce's authored line says so; the verdict is never changed by it.
- **`attachmentPlausible` has three states**, `pass` / `missing` / `wrong-type`, each with its own
  keyed reply and red-flag string. A no-attachment send returns `missing` with "there's nothing
  here", never the wrong-type line.
- **`urgencyCalibrated` is advisory only.** Overdone urgency does not fail a send (real heavy-urgency
  phishing still lands). Urgency is a tell the defender reads and an advisory note to the attacker.

A scenario turns factors on/off per target via `requiredFactors` / `advisoryFactors` (`00` §7). An
easy target needs 2–3; a hard spear-phish needs all, with tighter tests.

### Matching: slots, not text

Scored text is the template blanks (`01`, `00` §10). The judge never reads wording, so no concept
matcher is needed for scored messages. The exact comparison per factor is `00` §10 "Judging by
slot"; in short:

- **Exact ids.** A blank holds a value id (`balance_sheet`, `pierce_short`). The judge compares ids
  against the target's `primedFor` and `addressedAs`. There is no substring or synonym step.
- **Distinctive, generic, stale.** Each fact's `provides` entry carries a `kind` (`00` §1).
  `pretextRelevant` needs at least `primedFor.minDistinct` entries of `primedFor.distinctiveValues`
  among the values chosen in the pretext part plus that template's `implies`. Generic and stale
  values fill a blank but do not count.
- **Sender.** The From part's name person and address person are compared with `primedFor.trusts`;
  both the same trusted person sets `claimedSender`; a name from one person with an address from
  another, or from a freemail or unrelated domain, is `mismatch` with `claimedSender = null`. An open
  inbox lists `trusts: ["*"]`: any From passes and `claimedSender` is `null`. With `from_own` the
  header From is the account itself (`headerFrom: { account: true }`), and only the account's own
  name and address are compared.
- **Link.** `linkCredible` reads `message.linkInfo`, filled by `01` from `07`'s
  `linkInfoFor(record, pageDef, kitId)` (`00` §11a): it passes when `linkInfo.meetsThreshold` is true and fails with state `missing` when the kit
  item has no built page. The judge reads nothing else about the link.
- **Free text is unscored.** The judge ignores it and the ink never reads it.

### Tells

`EvalResult.tells` (`00` §3) lists the deceptions present in the message **as sent**, independent
of whether it landed. The engine computes it after judging:

| tell | present when |
|------|--------------|
| `senderTrust` | `claimedSender` is set and the account's `person` is not that person (a deliberate spoof) |
| `linkCredible` | `linkInfo.domain` is set and is not `expectedLink.realDomain`, whether or not the page was convincing. A message with no link, or a link in state `missing` (no domain), never raises it |
| `senderAuth` | the derived advisory read is `would-fail` |
| `urgencyCalibrated` | the pretext or ask template's authored `urgency` is above the target's `urgency.advisoryMax`; a target with no `urgency` block never raises it |

The defender flip (`05` `playerSent`, `10` stage 7, `11`) reads `tells`, never `redFlags`: a landed
phish has every required factor passing, so its `redFlags` is empty, but its tells are not.

The lab's tells, as sent from the `guest` account:

| Message | `tells` |
|---------|---------|
| Pierce phish, claiming Jed | `senderTrust`, `senderAuth` |
| Lord phish, claiming the portal, with the built page | `senderTrust`, `senderAuth`, `linkCredible`, `urgencyCalibrated` (the payslip pretext and the link ask are authored `medium`, above her `advisoryMax` of `low`) |
| Hampshire application from `freemail` | none: `from_own`, equal domains, no `claimedSender` |

A `found` internal account sending as its own person would give no tells, because the account is
that person's and the domains are equal. The lab ships no such account (only `guest` and `freemail`);
it is an Eldritch Hacker case. `freemail` does not spoof, so a Pierce or Lord send from it has its
own name as the From and fails `senderTrust`.

`05` decides which of these a replay shows. For a `playerSent` entry with `domainFrom` the panel shows
the look-alike domain's passing result, so `senderAuth` is not offered as a flag there.

## Layered, legible feedback

Three layers, so the learner always knows why:

1. **In-character reply**, into the sending account's mailbox after a short delay: "Sorry, who is
   this? I wasn't expecting anything from procurement." For a character target this is written by the
   character's `on_email` knot from the variables the engine sets (`00` §10), and comes with an
   influence change and a reason. For a data-only target it is the authored `replies.landed` string,
   or the `factorStrings` `fail` line (the `00` §2 canonical `fail` line when the target authors none)
   of the first failed factor.
2. **Factor checklist** (the teaching layer), shown on send: each factor ✓/✗ with a one-line reason
   that names the factor without handing over the answer. The ✓ lines come from `factorStrings`
   `pass`, or the canonical `pass` line in `00` §2:
   - ✓ Sender looked trusted
   - ✗ Didn't address me — "Dear User" reads as a mass mail; I expect my name
   - ✗ Not relevant to me — I'm not expecting an invoice this week
   - ✓ Attachment type fit the story
   Both a diegetic phrasing and a **red-flag phrasing** are stored, so the defender side (`05`)
   reuses the exact same strings as "what to look for".
3. **Escalating hints** after repeated failures on the same target: a nudge → a stronger nudge → a
   near-explicit pointer to the OSINT fact the player is missing. Mirrors the mission hint-stage
   pattern.

No silent pass/fail anywhere. The per-factor, per-state keyed mapping stops wrong strings; the
empty-string lint (N3) stops blank ones. For character targets the validator also checks the
`on_email` knot exists and handles a failed send (it must produce a non-empty reply in every branch).

### Pre-send gate

Judging starts only on a sendable message. `01` disables Send, with one neutral line, in two cases:
a blank in the message has no held option (an empty blank cannot be sent), or a fact in the target's
`requiresIntelToAttempt` is not held. The line is a single fixed string, which a scenario does not
override:

> A blank needs evidence you haven't found yet

It never names the blank's fact, the value, the source or the person who holds it, and it is the
same whatever is missing, so it cannot be used to probe for answers. `01` marks the empty blank. A
blank that has options but none chosen gets the ordinary "Choose an option for the <slot label>
blank". Nothing is judged: no sent record, no attempt counted, no checklist. The player finds the
gap through the hint ladder, the intel board and the pretext call, not through this line. Lord's
portal and date blanks are empty until the call, so before it her composer shows this line.
`requiresIntelToAttempt` remains for facts that sit behind no blank.

A character locked out on the mail channel (`00` §8, S10) is not judged: `01` refuses the send before
`evaluateMessage` runs, so a lockout never produces a half-result.

## Worked example

Target **Melanie Pierce**, Finance (character `pierce`). Trusts `baker` (her colleague Jed). Primed
(from OSINT) for a **balance sheet** from Jed on Fridays. Required factors: `senderTrust`,
`addressedTo`, `pretextRelevant` (needs the distinctive value `balance_sheet`), `attachmentPlausible`
(spreadsheet).

- Player sends as the `guest` account. The From blanks hold `baker_full` (Jed Baker) and
  `baker_address` (`j.baker@…`), both held. The greeting template "Hi {name}," has `name` =
  `pierce_short`; the pretext template "Here is {document} you wanted {when}." has `document` =
  `balance_sheet`, `when` = `friday`; the ask is "Can you open the attached file and check it before
  Friday?". A spreadsheet is attached. All four required factors pass, so the message **lands**. The
  engine sets `email_landed = true`, `email_claimed_sender = "baker"`, `email_account = "guest"`.
  `tells` is `["senderTrust","senderAuth"]`: the sender is claimed but the account is not Jed's, and
  the spoof would fail the domain's sender authentication (advisory). Melanie's `on_email` knot
  replies "Thanks Jed, opening it now", raises her influence (+10, reason `senderTrust`) and sets
  `phish_pierce_landed`. The reply arrives in the `guest` mailbox, not Jed's.
- Player uses a fixed-wording greeting "Hello," (no name blank) and a generic pretext "Please see
  attached." and attaches the invoice PDF (`kit_invoice`). `senderTrust` passes. `addressedTo` fails, because the greeting
  has no name blank. `pretextRelevant` fails, because no blank holds a distinctive value.
  `attachmentPlausible` is `wrong-type`. The checklist shows all three failures with reasons. The
  engine sets `email_first_fail = "addressedTo"` and `email_attachment = "wrong-type"`. Her reply:
  "This doesn't even have my name on it. And why would Jed send me that?" Influence -10 (reason
  `addressedTo`). Hint after the second try: "What does Melanie actually expect to receive, and from
  whom? Check what you found about her."

## Scenario-authored data

The complete schema is `00` §7; targets live in `social.phishTargets` and templates in
`social.templates` (`00` §10, §11). The three lab targets:

```jsonc
"phishTargets": [
  {
    "id": "pierce",
    "character": "pierce",                       // social.characters entry; its email story writes replies
    "address": "m.pierce@accountingnow.example",
    "displayName": "Melanie Pierce",
    "addressedAs": ["pierce_first","pierce_short","pierce_formal"],   // name-form ids; not pierce_full
    "templateSets": {                            // which templates this target offers, per part
      "from":     ["from_named"],
      "greeting": ["greet_named","greet_generic"],
      "pretext":  ["pretext_sheet","pretext_generic"],
      "ask":      ["ask_open_attached","ask_confirm"]
    },
    "senderAuth": { "domainPublishesAuth": true, "spoofAligns": false, "dmarcPolicy": "none" },   // the claimed domain's policy
    "redFlagMeter": false,                       // per target; default is mailClient.showRedFlagMeter
    "urgency": { "advisoryMax": "medium" },
    "primedFor": {
      "distinctiveValues": ["balance_sheet"],               // >= minDistinct, exact ids, from the pretext part
      "genericValues": ["finance","friday"],                 // fill a blank; can't carry alone
      "minDistinct": 1,
      "expectedAttachment": "spreadsheet",
      "trusts": ["baker"],
      "story": "a balance sheet from Jed, on a Friday"     // authoring note; the held facts are derived
    },
    "requiredFactors": ["senderTrust","addressedTo","pretextRelevant","attachmentPlausible"],
    "advisoryFactors": ["senderAuth","urgencyCalibrated"],
    "factorStrings": {                           // optional per-target overrides; same shape for every factor
      "senderTrust":         { "pass": "✓ From someone she trusts", "fail": "Who is this? I don't recognise the address.", "redFlag": null },
      "addressedTo":         { "pass": "✓ Addressed her by name",   "fail": "This doesn't even have my name on it.",       "redFlag": null },
      "pretextRelevant":     { "pass": "✓ Relevant to her",         "fail": "I'm not expecting anything like this.",        "redFlag": null },
      "senderAuth":          { "pass": "✓ Sender authentication would pass",
                               "fail": "The spoofed j.baker@ address fails the domain's alignment check. AccountingNow publishes its DMARC policy as p=none, so a receiver would still deliver it.",
                               "redFlag": null },
      "attachmentPlausible": { "pass": "✓ The attachment fits",
                               "missing":    { "fail": "You said you'd attach it, but there's nothing here.", "redFlag": null },
                               "wrong-type": { "fail": "Why would you send me that file type?",               "redFlag": null } }
    },
    "hints": ["Think about who Melanie trusts.", "What does she expect to receive, and when?",
              "Re-read Jed's note on the company site about the Friday balance sheet."]
    // no "outcome": the pierce_mail on_email knot sets phish_pierce_landed
  },
  {
    "id": "hampshire",                            // easy: an open careers inbox, no character story
    "address": "careers@accountingnow.example",
    "displayName": "Chris Hampshire",
    "emailReplyDelay": 15,                        // seconds; a data-only target authors its own delay
    "redFlagMeter": true,
    "templateSets": { "from": ["from_own"], "greeting": ["greet_generic"],
                      "pretext": ["pretext_apply"], "ask": ["ask_review_cv"] },
    "primedFor": { "distinctiveValues": ["cv"], "minDistinct": 1, "expectedAttachment": "document",
                   "trusts": ["*"], "story": "an applicant's CV for the open role" },
    "requiredFactors": ["senderTrust","pretextRelevant","attachmentPlausible"],
    "advisoryFactors": ["senderAuth","urgencyCalibrated"],
    "factorStrings": {
      "senderTrust":         { "pass": "✓ An open inbox accepts any sender", "fail": "I don't recognise who this is from.", "redFlag": null },
      "pretextRelevant":     { "pass": "✓ Reads like an application", "fail": "This isn't about the role. I only handle applications.", "redFlag": null },
      "senderAuth":          { "pass": "Sent as your own outside address, so there is nothing to spoof and nothing to fail.",
                               "fail": "Sender authentication would not pass.", "redFlag": null },
      "attachmentPlausible": { "pass": "✓ The CV is attached",
                               "missing":    { "fail": "You mention a CV, but there's nothing attached.", "redFlag": null },
                               "wrong-type": { "fail": "That isn't a file type I can open as a CV.",      "redFlag": null } }
    },
    "replies": { "landed": "Thanks, I'll get to this CV before Friday." },   // a failed send uses the factorStrings fail line of the first failed factor
    "hints": ["An open inbox trusts anyone who looks like an applicant.", "What does the careers page ask applicants to send?"],
    "outcome": { "setGlobal": { "phish_hampshire_landed": true } }
  },
  {
    "id": "lord",
    "character": "lord",
    "address": "s.lord@accountingnow.example",
    "displayName": "Sofia Lord",
    "addressedAs": ["lord_first"],
    "templateSets": { "from": ["from_named"], "greeting": ["greet_named"],
                      "pretext": ["pretext_payslip"], "ask": ["ask_open_link"] },
    "senderAuth": { "domainPublishesAuth": true, "spoofAligns": false, "dmarcPolicy": "none" },
    "redFlagMeter": false,
    "urgency": { "advisoryMax": "low" },
    "primedFor": {
      "distinctiveValues": ["staff_portal_name","mon_6th"],  // both arrive with the pretext call (06)
      "minDistinct": 2,                                      // hard: she needs the portal and the date
      "trusts": ["portal"],                                  // the portal's own notification sender
      "story": "a payslip notice from the staff payroll portal"
    },
    "requiredFactors": ["senderTrust","addressedTo","pretextRelevant","linkCredible"],
    "advisoryFactors": ["senderAuth","urgencyCalibrated"],
    "expectedLink": { "brandId": "accountingnow", "realDomain": "accountingnow.example" },
    "requiresIntelToAttempt": ["se_intel_lord_portal_name"],
    "hints": ["She's a new intern — what routine admin is she doing?",
              "She mentioned the staff portal and her payslip.",
              "The service desk can tell you what the portal is called and when payslips drop. Ring them.",
              "Build a page that looks like that portal (see 07)."]
    // no "outcome": the lord_mail on_email knot sets phish_lord_landed
  }
]
```

Notes on the records:

- **Meter.** `redFlagMeter` is a per-target boolean; when absent it takes `mailClient.showRedFlagMeter`
  (`01`). The lab has it on for Hampshire and off for Pierce and Lord.
- **Ids.** `character` names the `social.characters` entry. Name and address values are the
  `<person>_<form>` and `<person>_address` ids of `00` §1. The `trusts` entries are `social.people`
  ids (`00` §1): `baker`, the non-cast sender `portal`, or `"*"`.
- **Lord's trusted sender is `portal`.** The fact `lord_trusts_portal_sender` provides the `name`
  value `portal_full` and the fixed `address` value `portal_address` (`00` §1), so her `senderTrust` is
  passable only after the call. `distinctiveValues` for Lord are the portal name and the payslip date
  (`lord_portal_name`, `lord_payslip_date`), so her `pretextRelevant` is satisfied by them rather than
  by a `boostIfGlobal` hook. She is addressed only by `lord_first`, provided by `lord_intern` for
  the greeting (`about: "recipient"`).
- **`primedFor.facts` is not authored.** The facts that prime a target are the ones whose `provides`
  include its `distinctiveValues` (`00` §1); the validator derives the list.
  `boostIfGlobal` / `strictIfGlobal` remain available for chains that are not facts (`00` §7).
- **Hampshire is a data-only, text-job target.** She has no `character` and no `addressedAs`; her
  greeting is `greet_generic` and `addressedTo` is not required. Her From is `from_own`, so the account
  is the From and `senderTrust` passes under `trusts: ["*"]`. Her `pretext_apply` is fixed wording
  that `implies` the document value `cv`, provided by `careers_attachment` (`00` §1). The reply is a
  text job (`00` §10): `replies.landed` when the message landed, otherwise the canonical fail line of
  the first failed factor. It is appended to the mailbox of the sending account after
  `emailReplyDelay`, and `phish_hampshire_landed` is set only if the message landed. Her
  `factorStrings` cover the factors she judges, and her `senderAuth` pass line says the message is
  sent as the student's own outside address, so nothing is spoofed; the other factors fall back to
  the `00` §2 canonical strings. The lesson is that the
  From line is only a label.
- **Template shapes** (`from_named`, `greet_named`, `pretext_sheet`, `pretext_apply` and so on) are
  the `00` §10 schema; the lab's full set is the appendix below. A template may carry an authored
  `urgency` (`low|medium|high`) that feeds `urgencyCalibrated` and `email_urgency`.
- **Factors not overridden** fall back to the `00` §2 canonical strings (what `05`'s chips use). Every
  `factorStrings` entry has the same shape: `pass`, `fail`, `redFlag`; the attachment factor replaces
  `fail` with one entry per non-pass state. The lint requires each non-empty.
- **Who sets the outcome.** A target with a `character` has no `outcome` block: its `on_email` knot
  sets `phish_<id>_landed` with `#set_global`. A data-only target has an `outcome.setGlobal`, which
  its text job applies on delivery. The validator requires exactly one owner per target.
- **What an outcome global does.** Setting `phish_pierce_landed` opens nothing by itself. `eventMappings`
  live on NPC records (`systems/npc-manager.js`), so the scenario puts an entry on
  `global_variable_changed:phish_pierce_landed` on an NPC record that is loaded when it fires (the
  lab uses Ruth), with `completeTask`, `unlockTask` or `unlockAim`; or the ink fires `#complete_task`.
  An object's `completesTask` does not do this: only the BLE scanner and flag locks read it. The
  validator warns on an outcome global that nothing reads (`01`, "Outcome and unlock mechanism").
  Every outcome global is declared in `globalVariables`.

The `lord` target uses `linkCredible` (fed by the landing-page builder `07` through `message.linkInfo`),
which is why `07`'s worked example clones Sofia Lord's **staff payroll portal** (`lord_portal`). Her
`expectedLink` is the machine-readable pair the tell compares; the judge never reads prose here.

### Appendix: the lab's template set

Every template and slot the lab uses. Wording is the player's craft; only slot values are scored.
Slot ids are unique within a target's set. `urgency` is the authored tag behind `email_urgency` and
the `urgencyCalibrated` tell.

| Template | Part | Text | Slots (`id`: type / about) | `implies` | `urgency` | Offered to |
|----------|------|------|----------------------------|-----------|-----------|------------|
| `from_named` | from | `{sender_name} <{sender_address}>` | `sender_name`: name / sender; `sender_address`: address | — | — | pierce, lord |
| `from_own` | from | `{account_name} <{account_address}>` | none (built-in account placeholders) | — | — | hampshire |
| `greet_named` | greeting | `Hi {name},` | `name`: name / recipient | — | — | pierce, lord |
| `greet_generic` | greeting | `Hello,` | none | — | — | pierce, hampshire |
| `pretext_sheet` | pretext | `Here is {document} you wanted {when}.` | `document`: document; `when`: date | — | low | pierce |
| `pretext_generic` | pretext | `Please see attached.` | none | — | low | pierce |
| `pretext_apply` | pretext | `I'm applying for the open role.` | none | document `cv` | low | hampshire |
| `pretext_payslip` | pretext | `Your {portal} payslip is ready to view (released {when}).` | `portal`: portal; `when`: date | — | medium | lord |
| `ask_open_attached` | ask | `Can you open the attached file and check it before Friday?` | none | — | low | pierce |
| `ask_confirm` | ask | `Can you confirm you have received this?` | none | — | low | pierce |
| `ask_open_link` | ask | `Please sign in at the link below to view it.` | none | — | medium | lord |
| `ask_review_cv` | ask | `Could you review my CV when you have a moment?` | none | — | low | hampshire |

What each blank offers, derived from held facts (`00` §1 "provides"):

| Target | Slot | Options (fact that provides each; kind) |
|--------|------|------------------------------------------|
| pierce | `sender_name` | `baker_full` "Jed Baker" (`pierce_trusts_jed`, `pierce_expects_balance_sheet`; distinctive); `leeds_baker_full` "J. Baker" (`baker_namesake`; stale) |
| pierce | `sender_address` | the `00` §1 rule builds one option per person the player holds any name entry for, once `email_pattern` is held: `baker_address` (right), `leeds_baker_address` (stale, if the namesake is held), and the wrong options `pierce_address` (from `pierce_role`), `lord_address` (from `lord_intern`) and `hampshire_address` (from `careers_attachment`'s name entry), each present only if that person's name is held; plus `portal_address` once `lord_trusts_portal_sender` is held (fixed entry, wrong for Pierce) |
| pierce | `name` | `pierce_first`, `pierce_formal`, `pierce_full` (`pierce_role`; generic); `pierce_short` (`pierce_expects_balance_sheet`; generic). `pierce_full` is not in her `addressedAs` |
| pierce | `document` | `balance_sheet` (`pierce_expects_balance_sheet`; distinctive) |
| pierce | `when` | `friday` (`pierce_expects_balance_sheet`; generic) |
| lord | `sender_name` | `portal_full` (`lord_trusts_portal_sender`, after the call; distinctive); wrong options `baker_full` and `leeds_baker_full` if held |
| lord | `sender_address` | `portal_address` (fixed, `lord_trusts_portal_sender`; right); wrong options from the same rule: `baker_address`, `leeds_baker_address`, `pierce_address`, `lord_address`, `hampshire_address`, each only if that person's name is held and `email_pattern` is held |
| lord | `name` | `lord_first`, `lord_full` (`lord_intern`; generic). Only `lord_first` is in her `addressedAs` |
| lord | `portal` | `staff_portal_name` (`lord_portal_name`; distinctive) |
| lord | `when` | `mon_6th` (`lord_payslip_date`; distinctive) |
| hampshire | none | no blanks; `cv` comes from `pretext_apply`'s `implies` |

The Dev call's opening line (`open_buddy`, `06` §4.8) is owned by `06` and uses two blanks of the same
schema: `intern`: name / intern (`lord_first`, `lord_full` from `lord_intern`) and `team`: team /
intern (`finance` from `lord_intern`; the stale `accounts` from `old_org_chart`).

## Engine wiring

A pure module `public/break_escape/js/systems/phish-rules.js` exporting
`evaluateMessage(target, message, ctx) → EvalResult` (`00` §3). No DOM, no ink, no globals:
unit-testable from scenario JSON alone. `ctx` is `{ accounts, people, templates }`. `message` carries
the real `fromAccount`, the `headerFrom` pair (or `{ account: true }`), the template ids and slots, the
`attachment` and `link` pick and, when a link is set, `linkInfo` (`00` §3, §10a, §11a), so
`senderAuth` is derived and the result echoes `fromAccount`.

The mail client (`01`) resolves the accounts, fills `linkInfo`, calls the module on send, renders the
checklist, and hands the result to the mail bridge (`01` N6), which writes the run-scoped `email_*`
ink variables and queues the reply on the mail scheduler (`00` §10, S6, S7, S9). Externals the
`on_email` story declares (`se_influence`) are bound inside `InkEngine` (S1), so the mail runner, the
phone preload and dry runs can all load it. The triage defender (`05`) uses the same factor
definitions, so attack and defence cannot disagree about what a tell is. No new framework hooks: it
runs inside minigames that already use `startMinigame` / `onComplete`. Data-only outcomes are applied
by the text job through the shared writer (S3).

`boostIfGlobal` / `strictIfGlobal` are applied by `01` (its send flow, step "builds the message", and
N6), which reads the named globals from
`gameState.globalVariables` and passes `evaluateMessage` a copy of the target with that factor
relaxed or tightened, so the module stays pure. A character's influence global is one of those
globals, so a clumsy earlier email or call changes how a later message is judged with no mirroring
step.

Judging is client-side and the data is readable in the page (`00` §5). That is acceptable for a
browser lab. Outcome globals are client-set, so they cannot be the sole proof of an assessment result.

### New engine work

`S1` to `S12` are in `00` §12; the rules engine uses S1, S3, S5 (the `se_influence` write path and influence service a character
target's `on_email` writes through), S6, S7, S8 (the headless email record), S9, S10 (lockout, checked
by `01` before judging) and S11. Doc items:

| # | Item |
|---|------|
| N1 | `phish-rules.js` module + the factor library |
| N2 | Slot judge per `00` §10: exact id comparison with distinctive, generic and stale kinds, `implies`, the sender mismatch rule, `from_own`, `linkInfo`, free text ignored |
| N3 | Empty-string lint on all authored feedback (no blank interpolation), with the single `factorStrings` shape above |
| N4 | Hint-stage tracking per target (reuses the mission hint pattern) |
| N5 | `boostIfGlobal` / `strictIfGlobal` handling in `01`, as a modified copy of the target |
| N6 | `EvalResult` → ink-variable mapping for the mail bridge (`00` §10 table, including the identity variables and `email_slot_*`) |
| N7 | Reply text for a data-only target: `replies.landed` or the first failed factor's fail line, handed to the text job with the target's `outcome.setGlobal` key (`00` §10 "Timing and delivery", S9) |
| N8 | `senderAuth` derivation from `fromAccount` and `headerFrom` against the claimed domain's policy, with the per-target override |
| N9 | `tells[]` computation (table above), returned on every `EvalResult` |
| N10 | Validator checks in `scripts/validate_scenario.rb` (via `00` S11): every `character` target has an email story with `on_email` that declares the `email_*` VARs it reads and `VAR <character>_influence`; each target's `templateSets` cover all four parts and slot ids are unique; every `distinctiveValues` entry is provided by some fact; every required factor is reachable from facts the scenario grants, including that each required `addressedTo` has a name option in `addressedAs` provided by a granted fact; `trusts` ids resolve against `social.people`; one outcome owner; `senderAuth.dmarcPolicy` present whenever `domainPublishesAuth` is true; `requiresIntelToAttempt` globals are declared; outcome globals are declared and read; `expectedLink.brandId` is a brand in `07`; every template named in a set exists |
| N11 | Pre-send gate: the fixed neutral line, shown by `01` for an empty blank or a missing `requiresIntelToAttempt` fact; the validator rejects any scenario string that tries to replace it |

## Reuse across products

Depth is pure data: number of required factors, tightness of distinctive value sets, hint verbosity,
meter on/off, the number of blanks a template carries. Same engine judges a student's careful spear-phish and an
awareness learner's first try.

## Open questions

- Does a target need one distinctive value per primed fact, or any one of several? Default: any one
  (`minDistinct: 1`); the hard target raises it. Tune in playtest.
- Should a `redFlag` string be mandatory per factor per target so `05` always has material? Default:
  no (the canonical library covers it); the validator warns if a target overrides `fail` without a
  matching `redFlag`.
- Is the subject line judged? Default: no; see `00` §10.
