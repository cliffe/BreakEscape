# 04 — Phish-judging rules engine + layered feedback

Status: plan. A **system**, not a screen: the mail client (`01`) calls it on every send; the triage
defender (`05`) is its inverse, sharing the same factors. Its aim is that judging and feedback are
always visible to the learner. The factor library, `EvalResult`, the template and slot schema, slot
judging and the target schema are defined in `00_data_contract.md` §2, §3, §7 and §10; this doc
applies them and does not redefine them. Engine items `S1` to `S14` are in `00` §12.

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

### The open check comes first

Before the factors, the engine asks whether the target opens the message at all (`00` §2, "The open
check"). It reads the From and the Subject: the message opens when the sender passes `senderTrust`, or
when the chosen subject's `topic` is in the target's `interests.topics`. `landed` needs both the open
check and every required factor, and the checklist shows the open row first. Every factor is still
judged when the message is not opened, so the learner sees the whole picture. Targets differ: Pierce
opens finance subjects, Lord opens payroll, Hampshire opens anything from an applicant because her
inbox trusts every sender.

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

**Strictness of the coherence gate.** The only strictness setting is `pretextRelevant`'s `minDistinct`, and it
starts lenient: `minDistinct: 1`, any one distinctive value counts, and a target's hard settings are raised only
by authored values. The open check has no setting of its own and stays as specified (sender or subject topic). The settings
are tuned in playtest, loosening first where players stall. The lab ships with the lenient starting values
that are authored in this document (Lord's `minDistinct: 2` is the one deliberate exception, as the
hard target).

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
  item has no built page. When a target lists `linkCredible` in `requiredFactors` and has an
  `expectedLink`, the link is required, not "required if present": a send with `message.link === null`
  fails `linkCredible` with state `missing` and the same "There's no page behind that link" string. Lord
  therefore cannot land without the stage 4 page. Where a target lists `linkCredible` as advisory, a
  send with no link simply does not raise it. The judge reads nothing else about the link.
- **Free text is unscored.** The judge ignores it and the ink never reads it.

### Tells

`EvalResult.tells` (`00` §3) lists the deceptions present in the message **as sent**, independent
of whether it landed. The engine computes it after judging:

| tell | present when |
|------|--------------|
| `senderTrust` | `claimedSender` is set and the account's `person` is not that person (a deliberate spoof) |
| `linkCredible` | `linkInfo.domain` is set and is not `expectedLink.realDomain`, whether or not the page was convincing. A message with no link, or a link in state `missing` (no domain), never raises the tell (it fails the factor instead where the factor is required) |
| `senderAuth` | the derived advisory read is `would-fail` |
| `urgencyCalibrated` | the pretext or ask template's authored `urgency` is above the target's `urgency.advisoryMax`; a target with no `urgency` block never raises it |

The defender flip (`05` `playerSent`, `10` stage 7, `11`) reads `tells`, never `redFlags`: a landed
phish has every required factor passing, so its `redFlags` is empty, but its tells are not.

The lab's tells, as sent from the `guest` account:

| Message | `tells` |
|---------|---------|
| Pierce phish, claiming Jed | `senderTrust`, `senderAuth` |
| Lord phish, claiming the portal, with the built page | `senderTrust`, `senderAuth`, `linkCredible`, `urgencyCalibrated` (the payslip pretext and the link ask are authored `medium`, above her `advisoryMax` of `low`) |
| Lord phish from `freemail`, with the built page | `urgencyCalibrated`, `linkCredible` (no spoof tell, so it is not replayed over a `guest` send) |
| Hampshire application from `freemail` | none: `from_own`, equal domains, no `claimedSender` |

A `found` internal account sending as its own person would give no tells, because the account is
that person's and the domains are equal. The lab ships no such account (only `guest` and `freemail`);
it is an Eldritch Hacker case. `freemail` does not spoof, so a Pierce or Lord send from it has its
own name as the From and fails `senderTrust`.

Two tells are account-independent: `urgencyCalibrated` (a property of the authored templates) and `linkCredible` (a property of the attached page). A `freemail` send to Lord therefore still carries `urgencyCalibrated`, and with a page attached `linkCredible`. Only `senderTrust` and `senderAuth` are spoof tells, which a spoofing account alone can raise. `05` selects the record a `playerSent` entry replays by those spoof tells: the latest sent record to the target whose `tells` include `senderTrust` or `senderAuth`, and if none has either, the latest with any tell. A `freemail` retry carries no spoof tell, so it never shadows the student's `guest` phish. For a `playerSent` entry with `domainFrom` the panel shows
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
`on_email` knot exists and handles a failed send (it must produce a non-empty reply in every branch
where `email_opened` is true; a branch for a message the character never opened may be silent).

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
`requiresIntelToAttempt` is for a hard gate on a fact that feeds no blank; no lab target uses it. Every fact a lab target needs apart from Hampshire's sits behind a blank, and the empty-blank gate covers it; Hampshire's applicant pretext `implies` the document value `cv`, so her only gate is the careers contact reveal.

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
  Friday?". A spreadsheet is attached. The sender is trusted, so she opens it (`via: "sender"`), and all
  four required factors pass, so the message **lands**. The
  engine sets `email_landed = true`, `email_claimed_sender = "baker"`, `email_account = "guest"`.
  `tells` is `["senderTrust","senderAuth"]`: the sender is claimed but the account is not Jed's, and
  the spoof would fail the domain's sender authentication (advisory). Melanie's `on_email` knot
  replies "Thanks Jed, opening it now", raises her influence (+10, reason `senderTrust`) and sets
  `phish_pierce_landed`. The reply arrives in the `guest` mailbox, not Jed's.
- Player retries from `freemail`, where the From is forced to the account's own name, with the subject
  "Quick one". Pierce does not know the sender and the subject's topic (`general`) is not one she opens,
  so `email_opened` is false and `email_open_via` is `"none"`. Her `on_email` knot sends nothing. The
  checklist's first row reads "Nothing about the sender or the subject made her open it", and the
  other rows still show what else was wrong. With the subject "For your review" (topic `finance`) she
  opens it, finds the sender unfamiliar, and the reply says so. Same message, different subject, a
  different reason in her own words.
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
    "subjects": [ { "id": "s_quick", "text": "Quick one", "topic": "general" },
                  { "id": "s_review", "text": "For your review", "topic": "finance" } ],   // the wording is not judged; the topic feeds the open check; neutral so it never hints at a blank value
    "interests": { "topics": ["finance"] },       // subject topics she opens from a sender she does not know
    "addressedAs": ["pierce_first","pierce_short","pierce_formal"],   // name-form ids; not pierce_full
    "templateSets": {                            // which templates this target offers, per part
      "from":     ["from_named"],
      "greeting": ["greet_named","greet_generic"],
      "pretext":  ["pretext_sheet","pretext_generic","pretext_invoice"],   // the last is plausible but not hers
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
      "open":                { "pass": "✓ She would open it", "fail": "Nothing about the sender or the subject made her open it." },
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
              "Re-read Jed's note on the company site about the Friday balance sheet.",
              "This account can only send as itself. The Operator account lets you choose the sender."]
    // no "outcome": the pierce_mail on_email knot sets phish_pierce_landed
  },
  {
    "id": "hampshire",                            // easy: an open careers inbox, no character story
    "address": "careers@accountingnow.example",
    "displayName": "Chris Hampshire",
    "subjects": [ { "id": "s_application", "text": "Application", "topic": "recruitment" },
                  { "id": "s_hello", "text": "Hello", "topic": "general" } ],
    "interests": { "topics": ["recruitment"] },   // moot while her inbox trusts every sender; kept so the schema is uniform
    "emailReplyDelay": 15,                        // seconds; a data-only target authors its own delay
    "redFlagMeter": true,
    "templateSets": { "from": ["from_own"], "greeting": ["greet_generic"],
                      "pretext": ["pretext_apply","pretext_enquiry"], "ask": ["ask_review_cv"] },   // the enquiry is plausible but wrong for an applications desk
    "primedFor": { "distinctiveValues": ["cv"], "minDistinct": 1, "expectedAttachment": "document",
                   "trusts": ["*"], "story": "an applicant's CV for the open role" },
    "requiredFactors": ["senderTrust","pretextRelevant","attachmentPlausible"],
    "advisoryFactors": ["senderAuth","urgencyCalibrated"],
    "factorStrings": {
      "senderTrust":         { "pass": "✓ An open inbox accepts any sender", "fail": "I don't recognise who this is from.", "redFlag": null },
      "pretextRelevant":     { "pass": "✓ Reads like an application", "fail": "This isn't about the role. I only handle applications.", "redFlag": null },
      "senderAuth":          { "pass": "✓ Sent as your own address, so there is nothing to spoof and nothing to fail.", "redFlag": null },   // her From is always the account's own, so the read is always would-pass and a fail line could never show
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
    "subjects": [ { "id": "s_notice", "text": "Your notice", "topic": "payroll" },
                  { "id": "s_account", "text": "Account notice", "topic": "it" } ],
    "interests": { "topics": ["payroll"] },
    "addressedAs": ["lord_first"],
    "templateSets": { "from": ["from_named"], "greeting": ["greet_named"],
                      "pretext": ["pretext_payslip","pretext_password"], "ask": ["ask_open_link"] },   // the password notice is plausible but not what she is waiting for
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
    "hints": ["She's a new intern — what routine admin is she doing?",
              "She mentioned the staff portal and her payslip.",
              "The service desk can tell you what the portal is called and when payslips drop. Ring them.",
              "Build a page that looks like that portal (see 07).",
              "This account can only send as itself. The Operator account lets you choose the sender."]
    // no "outcome": the lord_mail on_email knot sets phish_lord_landed
  }
]
```

Notes on the records:

- **Subject and interests.** `subjects[]` (`{ id, text, topic }`, first is the default; `00` §7) is the list the composer's Subject pick reads (`01`). The wording is not judged; the `topic` feeds the open check against the target's `interests.topics`. The reply subject is `Re: <chosen text>` unless the ink sets one. The lab's texts are neutral so a subject never hints at a blank value, and each list holds a subject whose topic the target does not open. Pierce opens `finance`, Lord `payroll`, Hampshire `recruitment`; the sender's trust opens the message regardless (`00` §2).
- **Plausible but wrong templates.** Each closed target's pretext part holds one decoy that fits a real phishing story but not this person: Pierce's `pretext_invoice` (supplier invoices are accounts payable's job, not hers) and Lord's `pretext_password` (she has no password expiry to worry about). A decoy fails `pretextRelevant`, and the character's reply says why in character. Targets differ in what they open, whom they trust and what they act on, so a template that lands on one fails on another.
- **Advisory `senderAuth` text.** An authored `factorStrings.senderAuth` is read per state: `fail` when the derived read is `would-fail`, `pass` when it is `would-pass`. Pierce authors both (her `fail` carries the `p=none` line); Hampshire authors only a `pass` line, because her From is forced to the sending account and the read can never be `would-fail`; Lord authors none and uses the `00` §2 canonical string plus a clause from her claimed domain's `dmarcPolicy`. Advisory pass lines carry the same leading tick as the other pass lines.
- **Closed and open targets.** A target is **closed** when `primedFor.trusts` is not `["*"]`: it
  trusts named senders only, so the template choice has to carry the lesson. A closed target's pretext
  part holds two to four templates, including one credible-but-wrong decoy. An **open** target
  (`trusts: ["*"]`, Hampshire) is exempt from the decoy rule in general, but the lab still gives her
  two pretext templates so the pretext part is a real choice in round 1.
- **Influence per send.** The lab's `pierce_mail` and `lord_mail` stories apply
  `se_influence(-10, <first failed factor>)` on every opened send that does not land and
  `se_influence(10, <reason>)` on a landing (`00` §8, §10). The validator's N10 checks that each
  `character` target's `on_email` knot calls `se_influence` on both branches. Hampshire has no
  character, so a failed send costs her nothing.
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
  is the From and `senderTrust` passes under `trusts: ["*"]`. Her pretext part offers two templates, as every target's does in the lab:
  `pretext_apply` is fixed wording that `implies` the document value `cv`, and `pretext_enquiry` is a
  general services enquiry that implies nothing, so it fails `pretextRelevant` ("This isn't about the
  role"). Her open inbox excuses her from needing a trusted sender, not from the template choice. `careers_attachment` (`00` §1) teaches the value, but the judge needs no fact for it; her only gate is the careers contact reveal. The reply is a
  text job (`00` §10): `replies.landed` when the message landed, otherwise the canonical fail line of
  the first failed factor. It is appended to the mailbox of the sending account after
  `emailReplyDelay`, and `phish_hampshire_landed` is set only if the message landed. Her
  `factorStrings` cover the factors she judges, and her `senderAuth` pass line says the message is
  sent as the student's own address, whichever account they choose, so nothing is spoofed; the other factors fall back to
  the `00` §2 canonical strings. The lesson is that the
  From line is only a label.
- **Template shapes** (`from_named`, `greet_named`, `pretext_sheet`, `pretext_apply` and so on) are
  the `00` §10 schema; the lab's full set is the appendix below. A template may carry an authored
  `urgency` (`low|medium|high`) that feeds `urgencyCalibrated` and `email_urgency`.
- **Factors not overridden** fall back to the `00` §2 canonical strings (what `05`'s chips use). Every
  `factorStrings` entry has the same keys, `pass`, `fail` and `redFlag`, and each is optional: an absent
  key or a `null` takes the canonical string. The attachment factor replaces `fail` with one entry per
  non-pass state. An entry may leave out `fail` when that state cannot occur: Hampshire's `senderAuth`
  carries only `pass`, because her From is always the account's own and the read is always would-pass.
  The lint requires a string to be non-empty only where its key is present and not `null`. It **warns**
  (not an error) only when an entry supplies its own `fail` string and omits the `redFlag` key entirely;
  `redFlag: null` records that the author deliberately supplies no override (the canonical flag applies)
  and raises no warning, which is how every lab target is written.
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
| `pretext_invoice` | pretext | `Your supplier invoice is overdue.` | none | — | high | pierce |
| `pretext_apply` | pretext | `I'm applying for the open role.` | none | document `cv` | low | hampshire |
| `pretext_enquiry` | pretext | `I'd like to ask about your accounting services.` | none | — | low | hampshire |
| `pretext_payslip` | pretext | `Your {portal} payslip is ready to view (released {when}).` | `portal`: portal; `when`: date / release | — | medium | lord |
| `pretext_password` | pretext | `Your password expires {expiry}.` | `expiry`: date | — | high | lord |
| `ask_open_attached` | ask | `Can you open the attached file and check it before Friday?` | none | — | low | pierce |
| `ask_confirm` | ask | `Can you confirm you have received this?` | none | — | low | pierce |
| `ask_open_link` | ask | `Please sign in at the link below to view it.` | none | — | medium | lord |
| `ask_review_cv` | ask | `Could you review my CV when you have a moment?` | none | — | low | hampshire |

What each blank offers, derived from held facts (`00` §1 "provides"). The composer offers every held
`provides` entry of the slot's type whose `about` equals the slot's `about`; a slot with no `about`
offers only entries with none. The entries are not filtered by person, so a name held for someone else
is a wrong option. Address options follow `00` §1 exactly: the `address` rule builds one option per
person the player holds a `name` entry with `about: "sender"` for, once `email_pattern` is held, and
the one fixed entry is `portal_address`.

| Target | Slot | Options (fact that provides each; kind) |
|--------|------|------------------------------------------|
| pierce | `sender_name` | `baker_full` "Jed Baker" (`pierce_trusts_jed`, `pierce_expects_balance_sheet`; distinctive); wrong options if held: `leeds_baker_full` "J. Baker" (`baker_namesake`; stale), `portal_full` (`lord_trusts_portal_sender`) |
| pierce | `sender_address` | `baker_address` (right, built from the pattern); wrong options if held: `leeds_baker_address` (stale, from the namesake result), `portal_address` (fixed entry of `lord_trusts_portal_sender`) |
| pierce | `name` | `pierce_first`, `pierce_formal`, `pierce_full` (`pierce_role`; generic); `pierce_short` (`pierce_expects_balance_sheet`; generic). `pierce_full` is not in her `addressedAs`. Held Lord forms (`lord_first`, `lord_full`; recipient) are wrong options |
| pierce | `document` | `balance_sheet` (`pierce_expects_balance_sheet`; distinctive); wrong option if held: `cv` (`careers_attachment`; untagged, so a no-`about` slot offers it; distinctive for Hampshire, not in Pierce's `distinctiveValues`) |
| pierce | `when` | `friday` (`pierce_expects_balance_sheet`, `hampshire_cv_backlog`; generic) |
| lord | `sender_name` | `portal_full` (`lord_trusts_portal_sender`, after the call; distinctive); wrong options if held: `baker_full`, `leeds_baker_full` |
| lord | `sender_address` | `portal_address` (fixed, `lord_trusts_portal_sender`; right); wrong options if held: `baker_address`, `leeds_baker_address` |
| lord | `name` | `lord_first`, `lord_full` (`lord_intern`; generic). Only `lord_first` is in her `addressedAs`. Held Pierce forms are wrong options |
| lord | `portal` | `staff_portal_name` (`lord_portal_name`; distinctive) |
| lord | `expiry` | `friday` (`pierce_expects_balance_sheet`, `hampshire_cv_backlog`; generic, offered only if held; a wrong option, since the decoy carries no distinctive value) |
| lord | `when` (`about: "release"`) | `mon_6th` (`lord_payslip_date`, which provides it with `about: "release"`; distinctive). `friday` is untagged, so it is never offered here: until the call grants the date this blank is empty and Send is blocked |
| hampshire | none | no blanks; `cv` comes from `pretext_apply`'s `implies`; `pretext_enquiry` implies nothing |

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
`on_email` story declares (`se_influence`) carry an ink-side fallback function, and `InkEngine` turns on
external fallbacks (S1), so the phone preload and dry runs can load the story; the mail runner binds the
real function first. The triage defender (`05`) uses the same factor
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

`S1` to `S14` are in `00` §12; the rules engine uses S1, S3, S5 (the `se_influence` write path and influence service a character
target's `on_email` writes through), S6, S7, S8 (the headless email record), S9, S10 (lockout, checked
by `01` before judging) and S11. Doc items:

| # | Item |
|---|------|
| N1 | `phish-rules.js` module + the factor library, with unit tests in `test/js/social-phish-rules.test.mjs` (named so the CI glob in `00` S11 runs them) |
| N2 | Slot judge per `00` §10: exact id comparison with distinctive, generic and stale kinds, `implies`, the sender mismatch rule, `from_own`, `linkInfo`, free text ignored |
| N3 | Empty-string lint on all authored feedback (no blank interpolation), with the single `factorStrings` shape above |
| N4 | Hint-stage tracking per target (reuses the mission hint pattern) |
| N5 | `boostIfGlobal` / `strictIfGlobal` handling in `01`, as a modified copy of the target |
| N6 | `EvalResult` → ink-variable mapping for the mail bridge (`00` §10 table, including the identity variables and `email_slot_*`) |
| N7 | Reply text for a data-only target: `replies.landed` or the first failed factor's fail line, handed to the text job with the target's `outcome.setGlobal` key (`00` §10 "Timing and delivery", S9) |
| N8 | `senderAuth` derivation from `fromAccount` and `headerFrom` against the claimed domain's policy, with the per-target override |
| N9 | `tells[]` computation (table above), returned on every `EvalResult` |
| N10 | Validator checks in `scripts/validate_scenario.rb` (via `00` S11): every `character` target has an email story with `on_email` that declares the `email_*` VARs it reads and `VAR <character>_influence`; each target's `templateSets` cover all four parts and slot ids are unique; every `distinctiveValues` entry is provided by some fact; every required factor is reachable from facts the scenario grants, including that each required `addressedTo` has a name option in `addressedAs` provided by a granted fact; `trusts` ids resolve against `social.people`; one outcome owner; `senderAuth.dmarcPolicy` present whenever `domainPublishesAuth` is true; `requiresIntelToAttempt` globals are declared; outcome globals are declared and read; `expectedLink.brandId` is a brand in `07`; every template named in a set exists; every `phishTargets` entry has at least one `subjects` item, with ids unique within the target, non-empty `text` and a `topic` (the first is the composer's default and the sent record, draft and reply subject read it); every target has `interests.topics` and at least one subject whose topic is not among them unless it trusts `"*"`; every closed target (`primedFor.trusts` is not `["*"]`) has a pretext part of two to four templates, at most two blanks each, including one that cannot satisfy `pretextRelevant`, and every lab target offers at least two pretext templates; every `character` target's `on_email` knot calls `se_influence` on both its landing and failing branches; a reply to `#compose_reply:<targetId>` names an existing target of the same character |
| N11 | Pre-send gate: the fixed neutral line, shown by `01` for an empty blank or a missing `requiresIntelToAttempt` fact; the validator rejects any scenario string that tries to replace it |
| N12 | Open check in `phish-rules.js`: `interests.topics` against the subject's `topic`, `senderTrust` as the other route, `EvalResult.open`, `landed` needing it, the `email_opened`, `email_open_via` and `email_subject_topic` variables; unit tests in `social-phish-rules` for sender-opens, subject-opens and neither (contract in `00` §2, §3, §10) |

## Reuse across products

Depth is pure data: number of required factors, tightness of distinctive value sets, hint verbosity,
meter on/off, the number of blanks a template carries. Same engine judges a student's careful spear-phish and an
awareness learner's first try.

## Open questions

None open. Decided 2026-10-21:

- Strictness: `pretextRelevant` starts lenient (`minDistinct: 1`, any one distinctive value) and is tuned
  in playtest; the hard target raises it by authored values. The open check stays as specified.
- `pass`, `fail` and `redFlag` in a per-target `factorStrings` entry are each optional; absent or `null`
  takes the canonical `00` §2 text, which covers every factor, so `05` always has material. The validator
  warns only when an entry supplies its own `fail` and omits the `redFlag` key entirely; `redFlag: null`
  raises no warning ("Scenario-authored data" above).
