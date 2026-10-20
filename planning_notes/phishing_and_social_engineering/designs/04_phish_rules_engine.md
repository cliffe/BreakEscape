# 04 — Phish-judging rules engine + layered feedback

Status: plan. A **system**, not a screen: the mail client (`01`) calls it on every send; the triage
defender (`05`) is its inverse, sharing the same factors. Its aim is that judging and feedback are
always visible to the learner. The factor library, `EvalResult`, the template and slot schema, slot
judging and the target schema are defined in `00_data_contract.md` §2, §3, §7 and §10; this doc
applies them and does not redefine them. Engine items `S1` to `S11` are in `00` §12.

It has no player goal or loop of its own (those live in `01`) and **no assets of its own**; the
✓/✗ checklist chrome is rendered by `01` and `05`.

**Division of labour.** The engine **judges**, deterministically, and returns the full per-factor
result. Where the target is a social character (`social.characters`, `00` §8), that character's
**email-channel ink** reacts in character to the result (the reply, the influence change, any outcome
tags; `00` §10). Where the target is plain data, the engine's authored strings are the reply.

## Purpose & audience

Decide whether a crafted email **lands**, and explain the result in terms the learner takes away as
a red-flag checklist. All three products. Maps to book Ch. 7 (phishing).

Spoken and face-to-face pretexts are judged differently: by the character's influence (`06`, `00`
§8). The two meet on the character: an email's result feeds the same influence global, and
`boostIfGlobal` / `strictIfGlobal` let a call's outcome change how an email is judged.

## The flaws this must not repeat

A phishing lab judged out of the game's sight tends to lose replies off-screen, need a reset to recover, reject
without saying what failed ("it's unrelated to me"), send inverted attachment messages, match on
loose substrings ("cat" matches "location"), "run the attachment" on a message that has none, and
have victims that reject everything. Every one is a feedback or determinism failure. The rules below
each kill one.

## How judging works

A target has a profile of **factors**. Each factor is checked, a result recorded, and the message
**lands only if every required factor passes**. The engine returns the **full per-factor result**,
not just the first failure, so the feedback is complete.

### Factors

The canonical **seven-factor library** and the single shared **red-flag string per factor** are in
`00` §2, imported by both this engine and the defender (`05`). Three points that shape judging:

- **`senderAuth`** models at concept level whether a spoof would pass SPF/DKIM/DMARC alignment. It
  is derived from the **real sending account** and the claimed From (`00` §10a), not authored per
  target: the account's domain is the envelope and signing domain, the header From's domain is the
  visible one, and the claimed domain's `senderAuth` policy says whether the pair aligns. A found
  internal account sending as its own person passes; a freemail account sending as the company fails.
  An author may override the derived result per target. Advisory on the attack side (a spoof can still
  fool a person if delivered, but the player is told it would likely be quarantined).
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
  inbox lists `trusts: ["*"]`. When the account cannot spoof, the claimed From is forced to the
  account and only the account's own name can pass.
- **Free text is unscored.** The judge ignores it and the ink never reads it.
- **Optional LLM advisory** (student lab only, default off). It would read free text, which is
  unscored, so under this design it has nothing to score. Kept as an open question below.

### Tells

`EvalResult.tells` (`00` §3) lists the deceptions present in the message **as sent**, independent
of whether it landed. The engine computes it after judging:

| tell | present when |
|------|--------------|
| `senderTrust` | `claimedSender` is set and `fromAccount` is not that person's own account (a deliberate spoof, or a look-alike address) |
| `linkCredible` | the picked link's domain is not the real one (`expectedLink`), whether or not the page was convincing |
| `senderAuth` | the derived advisory read is `would-fail` |
| `urgencyCalibrated` | the pretext or ask template's authored `urgency` is above the target's `urgency.advisoryMax` |

The defender flip (`05` `playerSent`, `10` stage 7, `11`) reads `tells`, never `redFlags`: a landed
phish has every required factor passing, so its `redFlags` is empty, but its tells are not.

## Layered, legible feedback

Three layers, so the learner always knows why:

1. **In-character reply**, into the sending account's mailbox after a short delay: "Sorry, who is
   this? I wasn't expecting anything from procurement." For a character target this is written by the
   character's `on_email` knot from the variables the engine sets (`00` §10), and comes with an
   influence change and a reason. For a data-only target it is the authored `factorStrings` `fail` /
   `replies` string.
2. **Factor checklist** (the teaching layer), shown on send: each factor ✓/✗ with a one-line reason
   that names the factor without handing over the answer:
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
  `balance_sheet`, `when` = `friday`; the ask is "Can you check it before Friday?". A spreadsheet is
  attached. All four required factors pass, so the message **lands**. The engine sets
  `email_landed = true`, `email_claimed_sender = "baker"`, `email_account = "guest"`. `tells` is
  `["senderTrust","senderAuth"]`: the sender is claimed but the account is not Jed's, and the spoof
  would fail the domain's sender authentication (advisory). Melanie's `on_email` knot replies "Thanks
  Jed, opening it now", raises her influence (+10, reason `senderTrust`) and sets
  `phish_pierce_landed`. The reply arrives in the `guest` mailbox, not Jed's.
- The same message sent from the found account `jed_pc` (`00` §10a) lands too, with `tells` empty
  of `senderTrust` and `senderAuth`: the account really is Jed's. The ink may trust it more.
- Player uses a fixed-wording greeting "Hello," (no name blank) and a generic pretext "Please see
  attached." and attaches an archive. `senderTrust` passes. `addressedTo` fails, because the greeting
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
    "senderAuth": { "domainPublishesAuth": true, "spoofAligns": false },   // the claimed domain's policy
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
    "factorStrings": {                           // fallback replies + checklist lines; same shape for every factor
      "senderTrust":         { "pass": "✓ From someone she trusts", "fail": "Who is this? I don't recognise the address.", "redFlag": null },
      "addressedTo":         { "pass": "✓ Addressed her by name",   "fail": "This doesn't even have my name on it.",       "redFlag": null },
      "pretextRelevant":     { "pass": "✓ Relevant to her",         "fail": "I'm not expecting anything like this.",        "redFlag": null },
      "attachmentPlausible": { "pass": "✓ The attachment fits",
                               "missing":    { "fail": "You said you'd attach it, but there's nothing here.", "redFlag": null },
                               "wrong-type": { "fail": "Why would you send me that file type?",               "redFlag": null } }
    },
    "replies": { "landed": "Thanks Jed — opening it now." },    // used only if the character has no on_email knot
    "hints": ["Think about who Melanie trusts.", "What does she expect to receive, and when?",
              "Re-read Jed's note on the company site about the Friday balance sheet."],
    "outcome": { "setGlobal": { "phish_pierce_landed": true } }  // ignored when the ink sets it (see below)
  },
  {
    "id": "hampshire",                            // easy: an open careers inbox, no character story
    "address": "careers@accountingnow.example",
    "displayName": "Chris Hampshire",
    "templateSets": { "from": ["from_applicant"], "greeting": ["greet_generic"],
                      "pretext": ["pretext_apply"], "ask": ["ask_review_cv"] },
    "primedFor": { "distinctiveValues": ["cv"], "minDistinct": 1, "expectedAttachment": "document",
                   "trusts": ["*"], "story": "an applicant's CV for the open role" },
    "requiredFactors": ["senderTrust","pretextRelevant","attachmentPlausible"],
    "advisoryFactors": ["senderAuth","urgencyCalibrated"],
    "replies": { "landed": "Thanks, I'll get to this CV before Friday." },
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
    "senderAuth": { "domainPublishesAuth": true, "spoofAligns": false },
    "urgency": { "advisoryMax": "low" },
    "primedFor": {
      "distinctiveValues": ["staff_portal_name","mon_6th"],  // both arrive with the pretext call (06)
      "minDistinct": 2,                                      // hard: she needs the portal and the date
      "trusts": ["portal"],                                  // the portal's own notification sender
      "story": "a payslip notice from the staff payroll portal"
    },
    "requiredFactors": ["senderTrust","addressedTo","pretextRelevant","linkCredible"],
    "advisoryFactors": ["senderAuth","urgencyCalibrated"],
    "expectedLink": { "brand": "staff payroll portal", "domainClaims": "the real portal domain" },
    "requiresIntelToAttempt": ["se_intel_lord_portal_name"],
    "hints": ["She's a new intern — what routine admin is she doing?",
              "She mentioned the staff portal and her payslip.",
              "The service desk can tell you what the portal is called and when payslips drop. Ring them.",
              "Build a page that looks like that portal (see 07)."],
    "outcome": { "setGlobal": { "phish_lord_landed": true } }
  }
]
```

Notes on the records:

- **Ids.** `character` (not `npcId`) names the `social.characters` entry. Name and address values are
  the `<person>_<form>` and `<person>_address` ids of `00` §1. The cast ids (`baker`) are the
  `trusts` entries. `portal` is a non-cast sender: the fact `lord_trusts_portal_sender` provides the
  `name` value `portal_full` (the portal's notification name) and the `address` value `portal_address`
  (its real notification address), so Lord's `senderTrust` is passable only after the call.
- **`primedFor.facts` is not authored.** The facts that prime a target are the ones whose `provides`
  include its `distinctiveValues` (`00` §1); the validator derives the list. `distinctiveValues` for
  Lord are the portal name and payslip date values granted by the call (`lord_portal_name`,
  `lord_payslip_date`), so her `pretextRelevant` is satisfied by them rather than by a
  `boostIfGlobal` hook. `boostIfGlobal` / `strictIfGlobal` remain available for chains that are not
  facts (`00` §7).
- **Hampshire.** No `character`, so the authored `replies` / `factorStrings` are the reply. Her
  `pretext_apply` template is fixed wording that `implies` the document value `cv` (`00` §10), and
  `from_applicant` is a blank-free From template, so no evidence is needed to be a plausible
  applicant. The easy target's lesson is that the From line is only a label.
- **Template shapes** (`from_named`, `greet_named`, `pretext_sheet`, `pretext_apply` and so on) are
  the `00` §10 schema. A template may carry an authored `urgency` (`low|medium|high`) that feeds
  `urgencyCalibrated` and `email_urgency`.
- **Factors not overridden** fall back to the `00` §2 canonical red-flag library (what `05`'s chips
  use). Every `factorStrings` entry has the same shape: `pass`, `fail`, `redFlag`; the attachment
  factor replaces `fail` with one entry per non-pass state. The lint requires each non-empty.
- **Who sets the outcome.** When a target has a `character` whose story has an `on_email` knot, the
  ink owns the reply and the outcome tags, and `replies`, `factorStrings.fail` and `outcome` are the
  fallback if the story has no `on_email`. The outcome global must be set by one or the other, never
  both (validator check).
- **What an outcome global does.** Setting `phish_pierce_landed` opens nothing by itself. The
  scenario's `eventMappings` bridge it (an entry on `global_variable_changed:phish_pierce_landed`
  with `completeTask`, `unlockTask` or `unlockAim`), or the ink fires `#complete_task`. The validator
  warns on an outcome global that nothing reads (`01`, "Outcome and unlock mechanism"). Every outcome
  global is declared in `globalVariables`.

The `lord` target uses `linkCredible` (fed by the landing-page builder `07`), which is why `07`'s
worked example clones Sofia Lord's **staff payroll portal** (`lord_portal`).

## Engine wiring

A pure module `public/break_escape/js/systems/phish-rules.js` exporting
`evaluateMessage(target, message) → EvalResult` (`00` §3). No DOM, no ink, no globals: unit-testable
from scenario JSON alone. `message` carries the real `fromAccount` and the `headerFrom` pair (`00`
§3, §10a), so `senderAuth` is derived and the result echoes `fromAccount`. The module reads the
account list and the claimed domain's policy through arguments, not the global state.

The mail client (`01`) calls it on send, renders the checklist, and hands the result to the mail
bridge (`01` N6), which writes the run-scoped `email_*` ink variables and queues the reply on the mail
scheduler (`00` §10, S6, S7, S9). Externals the `on_email` story declares (`se_influence`) are bound
inside `InkEngine` (S1), so the mail runner, the phone preload and dry runs can all load it. The
triage defender (`05`) uses the same factor definitions, so attack and defence cannot disagree about
what a tell is. No new framework hooks: it runs inside minigames that already use `startMinigame` /
`onComplete`. Data-only outcomes bridge via `applyActions` `set_global` (`systems/apply-actions.js`),
which broadcasts to running stories once `00` S3 lands; until then the runner syncs before it runs.

`boostIfGlobal` / `strictIfGlobal` are read at judge time from `gameState.globalVariables`. A
character's influence global is one of those globals, so a clumsy earlier email or call changes how a
later message is judged with no mirroring step.

Judging is client-side and the data is readable in the page (`00` §5). That is acceptable for a
browser lab. Outcome globals are client-set, so they cannot be the sole proof of an assessment result.

### New engine work

`S1` to `S11` are in `00` §12; the rules engine uses S1, S3, S6, S7, S9 and S11. Doc items:

| # | Item |
|---|------|
| N1 | `phish-rules.js` module + the factor library |
| N2 | Slot judge per `00` §10: exact id comparison with distinctive, generic and stale kinds, `implies`, the sender mismatch rule, free text ignored. Replaces the concept matcher |
| N3 | Empty-string lint on all authored feedback (no blank interpolation), with the single `factorStrings` shape above |
| N4 | Hint-stage tracking per target (reuses the mission hint pattern) |
| N5 | `boostIfGlobal` / `strictIfGlobal` handling |
| N6 | `EvalResult` → ink-variable mapping for the mail bridge (`00` §10 table, including the identity variables and `email_slot_*`) |
| N7 | (optional) advisory LLM note, scoped as in `00` §7, gated and cost-noted |
| N8 | `senderAuth` derivation from `fromAccount` and `headerFrom` against the claimed domain's policy, with the per-target override |
| N9 | `tells[]` computation (table above), returned on every `EvalResult` |
| N10 | Validator checks in `scripts/validate_scenario.rb` (via `00` S11): every `character` target has an email story with `on_email` that declares the `email_*` VARs it reads and `VAR <character>_influence`; each target's `templateSets` cover all four parts and slot ids are unique; every `distinctiveValues` entry is provided by some fact, and every required factor is reachable from facts the scenario grants; `trusts` ids exist; one outcome owner; `requiresIntelToAttempt` globals are declared; outcome globals are declared and read |

## Reuse across products

Depth is pure data: number of required factors, tightness of distinctive value sets, hint verbosity,
meter on/off, the number of blanks a template carries. Same engine judges a student's careful spear-phish and an
awareness learner's first try.

## Open questions

- The advisory LLM note: build it at all? It would read free text, which is unscored, so the default is
  off, and the note may be dropped. Flagged for cost.
- Does a target need one distinctive value per primed fact, or any one of several? Default: any one
  (`minDistinct: 1`); the hard target raises it. Tune in playtest.
- Should a `redFlag` string be mandatory per factor per target so `05` always has material? Default:
  no (the canonical library covers it); the validator warns if a target overrides `fail` without a
  matching `redFlag`.
- Is the subject line judged? Default: no; see `00` §10.
