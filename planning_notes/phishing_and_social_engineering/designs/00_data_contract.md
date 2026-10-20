# 00 — Shared data contract and canonical example

Status: plan. This is the single source of truth for the shapes and ids the other docs share. If a
detail here conflicts with 01–11, this doc wins and the other is corrected.

It defines:

1. the canonical worked-example dataset, and the typed intel fact schema
2. the factor library and the shared red-flag library
3. the `evaluateMessage` I/O contract and how `01` transforms it
4. the intel→factor prerequisite map and readiness rule
5. intel persistence and gating, and how intel reaches ink
6. the ink/engine constraints every ink-driven component must respect, and the overlay rules every
   new minigame follows (keyboard, close, return-to, the bundled font)
7. phish-target schema completeness
8. NPC influence: the per-character global, threshold behaviours and the bar
9. channels: separate stories per channel, state shared through synced globals
10. the email→ink contract, template and slot schema, and the email identity model (§10a)
11. where scenario data lives (`social`), and the landing-page record (§11a)
12. engine work owned by this doc
13. settled values, in one place

Code locations are given as file plus function name where a line number would drift. Paths are under
`public/break_escape/js/` unless stated.

---

## 1. Canonical example dataset — "AccountingNow"

One fictional company used in every worked example, so the recon→phish chain can be followed end
to end. The engagement is authorised by the fictional client and run by the fictional consultancy
**Northgate Assurance** (as in `10_lab_social_engineering.md`). All domains end `.example`; all
people are fictional.

### Cast and directory (every entry carries a stable `id`, the join key for 03's people cards and for blank values)

| id | Name | Role | Address | Notes |
|----|------|------|---------|-------|
| `pierce` | Melanie Pierce | Finance | m.pierce@accountingnow.example | flagship spear-phish target |
| `baker` | Jed Baker | Finance (Melanie's colleague) | j.baker@accountingnow.example | the trusted sender to spoof |
| `hampshire` | Chris Hampshire | Careers/HR | careers@accountingnow.example | easy target (open careers inbox) |
| `lord` | Sofia Lord | Intern | s.lord@accountingnow.example | hard target (needs link + pretext) |
| `portal` | AccountingNow Payroll Portal | non-cast sender | payroll-notices@accountingnow.example | Lord's trusted sender; known only after the call |
| `leeds_baker` | J. Baker | outside the company | j.baker@leedsplumbing.example | the namesake the name search returns; a decoy |

The table is also data. `social.people` is the machine-readable directory every id above resolves
against (name forms, `primedFor.trusts`, `social.mailClient.accounts[].person`, contacts, the board's people
cards, the `<person>_address` values):

```jsonc
"people": [
  { "id": "pierce", "kind": "cast", "address": "m.pierce@accountingnow.example",
    "forms": { "first": "Melanie", "short": "Mel", "formal": "Ms Pierce", "full": "Melanie Pierce" } },
  { "id": "baker",  "kind": "cast", "address": "j.baker@accountingnow.example",
    "forms": { "first": "Jed", "full": "Jed Baker" } },
  { "id": "hampshire", "kind": "cast", "address": "careers@accountingnow.example",
    "forms": { "full": "Chris Hampshire" } },
  { "id": "lord",   "kind": "cast", "address": "s.lord@accountingnow.example",
    "forms": { "first": "Sofia", "full": "Sofia Lord" } },
  { "id": "portal", "kind": "sender", "address": "payroll-notices@accountingnow.example",
    "forms": { "full": "AccountingNow Payroll Portal" } },
  { "id": "leeds_baker", "kind": "outside", "address": "j.baker@leedsplumbing.example",
    "forms": { "full": "J. Baker" } }
]
```

`kind` is `cast` (staff the player can meet or read about), `sender` (a non-person sender such as the
portal) or `outside` (a decoy outside the company). `trusts` ids in `04` resolve against this list, so
`portal` is valid. The validator checks that every `<person>_<form>` value in `intelFacts` names a
person and form that exist here, and that every `<person>_address` resolves to an `address`.

**Name-form ids.** A name blank holds one form of a person's name. Forms are ids of the shape
`<person>_<form>`, with forms `first`, `short`, `formal` and `full`: `pierce_first` (Melanie),
`pierce_short` (Mel), `pierce_formal` (Ms Pierce), `pierce_full` (Melanie Pierce). The same shape
serves every person (`baker_full`, `lord_first`, `portal_full`, `leeds_baker_full`). The display
string is the option's `label`. Everywhere a doc needs "her name" it uses one of these ids, never a
bare `melanie`.

### Discoverable intel

Each fact has a stable bare `id` (below). Collecting it sets the global `se_intel_<id>` (§5). The
`se_` prefix keeps the family clear of the `intel_*` globals that m03, m04 and the SIS missions
already use.

A fact's `source` is the id of **the one element that grants it**: a block, a search or lookup result,
a metadata field, or, for call facts, the ask id. The ids below are the lab's (`02` owns the pages).

| fact id | Source element | Fact | Backs factor (§4) |
|---------|----------------|------|-------------------|
| `email_pattern` | `r_pattern`: the Hunter lookup result (the team page also shows the addresses; seeing them grants nothing) | first-initial.surname@accountingnow.example | senderTrust (compose any address) |
| `username_convention` | `f_author`: deck document metadata (author `mpierce`, app "Microsoft Excel") | AD username = firstinitial+surname | (lab teaching; distinct from email alias) |
| `pierce_role` | `row_pierce`: the team page row | Melanie Pierce works in Finance | addressing; supplies her name forms |
| `pierce_trusts_jed` | `post_pierce_jed`: social post ("Jed's showing me the ropes!") | Melanie trusts Jed Baker | senderTrust (who to spoof) |
| `pierce_expects_balance_sheet` | `note_q3`: company-site note ("Jed: I'll send Mel the Q3 balance sheet on Friday") | she expects a balance sheet from Jed, Fridays | pretextRelevant + attachmentPlausible |
| `hampshire_careers` | `careers_inbox`: careers page | careers@ inbox accepts CVs from anyone | senderTrust (open inbox) |
| `hampshire_cv_backlog` | `post_hampshire_cvs`: social post from Chris | Chris is behind on CVs | pretextRelevant (Hampshire) |
| `careers_attachment` | `apply_format`: "how to apply" page | ".odt/.docx only" | attachmentPlausible |
| `tech_stack` | `careers_stack`: careers page | uses Xero + Office 365 | pretext flavour / lab teaching |
| `lord_intern` | `row_lord`: the team page row. **One award path**: the social profile shows the same words as unmarked text | Sofia is a new intern in Finance | addressing; pretext framing |
| `lord_portal` | `post_lord_payslip`: social post ("sorting my payslip on the staff portal") | she uses a staff payroll portal (name not given) | readiness for Lord; what to clone (07) |
| `lord_portal_name` | `portal_name`: Dev call ask (06) | the portal's name and how its notices read | linkCredible, pretextRelevant (Lord) |
| `lord_payslip_date` | `payslip_date`: Dev call ask (06) | this month's payslip release date | pretextRelevant (Lord) |
| `lord_trusts_portal_sender` | `portal_name`: Dev call ask (06), granted with `lord_portal_name` | Sofia expects notices from the portal's own notification address | senderTrust (Lord) |
| `baker_namesake` (stale) | `r_namesake`: the "J. Baker" name search, the namesake result | a J. Baker in Leeds | none; a wrong option |
| `old_org_chart` (stale) | `org_old_chart`: the archived org chart block on the company site | an out-of-date structure | none; a wrong option |

That is 14 contract facts (11 found by browsing, 3 granted by the call) plus 2 stale.

The **email alias** `m.pierce` (how mail is addressed) is deliberately distinct from the **AD
username** `mpierce` (from document metadata). Both are intel; they are not the same fact.

### Typed intel fact schema

A fact is an object, not a bare boolean. It records which board card it belongs to and which blank
values it makes available. A blank option exists if and only if some collected fact provides it.

```jsonc
"intelFacts": {
  "pierce_expects_balance_sheet": {
    "text": "Melanie expects a Q3 balance sheet from Jed on Fridays.",
    "subject": "pierce",                    // board card it lives on: a cast id, or "company"
    "source": "note_q3",                    // the element in 02 (or the call ask in 06) that grants it
    "provides": [                           // blank values this fact unlocks
      { "type": "document", "value": "balance_sheet", "label": "the Q3 balance sheet",
        "kind": "distinctive", "attachmentKind": "spreadsheet" },
      { "type": "name", "about": "sender", "value": "baker_full", "label": "Jed Baker", "kind": "distinctive" },
      { "type": "name", "about": "recipient", "value": "pierce_short", "label": "Mel", "kind": "generic" },
      { "type": "date", "value": "friday", "label": "Friday", "kind": "generic" }
    ]
  },
  "email_pattern": {
    "text": "Staff addresses are first-initial.surname@accountingnow.example.",
    "subject": "company", "source": "r_pattern",
    "provides": [
      { "type": "address", "rule": "initial.surname@accountingnow.example", "label": "an address built from the pattern" }
    ],
    "reduceNote": "Do not publish staff addresses in a pattern a lookup tool can learn; use role inboxes on public pages."   // 03 defender mode: what to take down
  }
}
```

Fields:

- `text`: the sentence shown on the board. `subject`: the card. `source`: the grant element (above).
  `reduceNote`: the one-line "reduce this" prompt in the board's defender mode (`03`); it is required only on a fact that `engagement.defender.factMitigations` names.
- `provides[]`: one entry per blank value. `type` is the **slot type** (below). `about` optionally
  narrows a name, date or team to a role in the message (`recipient`, `sender`, `manager`, `intern`,
  `start`, `release`). **Filter rule:** a slot offers the entries whose `about` matches the slot's `about`;
  a slot with no `about` offers only untagged entries. So the payslip template's date slot (`about:
  "release"`) offers `mon_6th` and not `friday`, and an unknown release date leaves that blank empty
  (Send is blocked). `value` is the id the judge compares. `label` is the string the option shows. `kind` is
  `distinctive` (specific to this target's story; counts toward `pretextRelevant`), `generic` (true
  but not distinguishing) or `stale` (held but wrong for this target, which the player can still
  pick). `attachmentKind` ties a `document` value to the payload-kit kind (below).
- An `address` entry carries either a `rule` or a fixed `value`. A **rule** entry has the composer
  build one address option per person the player holds a **sender** name entry for (a `name` entry with
  `about: "sender"`), with value id `<person>_address` and the address taken from `social.people`.
  Recipient and intern names do not build address options. In the lab that yields `baker_address`
  (from `pierce_trusts_jed` or the Q3 note) and the stale `leeds_baker_address` (from the namesake
  result). No other person's address is ever offered: recipient names (`pierce_role`), intern names
  (`lord_intern`) and `careers_attachment` (which provides a document only) build none, so `pierce_address`,
  `lord_address` and `hampshire_address` do not exist as options. The composer's wrong address options are
  `leeds_baker_address`, `baker_address` for a target that does not trust Jed, and `portal_address` for one
  that does not trust the portal. A rule is not a value, so a player who has `email_pattern` but no sender name for someone
  cannot build that person's address. A
  **fixed** entry (`{ "type": "address", "value": "portal_address", "label": "...", "kind":
  "distinctive" }`) offers that one address with no pattern needed.
- Because a blank offers only held facts, a player holding only right facts sees only right options.
  A wrong choice needs a `stale` entry or a generic value. The lab authors two (an archived org chart
  and the namesake result) so the judgement is real.
- The ids in `04` `primedFor.facts` are derived: the facts whose `provides` include the target's
  `distinctiveValues`. They are not a second list to keep in step.

### The complete `provides` table (the lab)

Every entry is `type`, `about` (if any), `value` "label", `kind`. `subject` is the board card.

| fact | subject | provides |
|------|---------|----------|
| `email_pattern` | company | `address` rule `initial.surname@accountingnow.example` "an address built from the pattern" |
| `username_convention` | company | none |
| `pierce_role` | pierce | `name`/recipient `pierce_first` "Melanie" generic; `pierce_formal` "Ms Pierce" generic; `pierce_full` "Melanie Pierce" generic; `team` `finance` "Finance" generic |
| `pierce_trusts_jed` | pierce | `name`/sender `baker_full` "Jed Baker" distinctive |
| `pierce_expects_balance_sheet` | pierce | `document` `balance_sheet` "the Q3 balance sheet" distinctive (`attachmentKind: spreadsheet`); `name`/sender `baker_full` "Jed Baker" distinctive; `name`/recipient `pierce_short` "Mel" generic; `date` `friday` "Friday" generic |
| `hampshire_careers` | hampshire | none (open inbox: `trusts: ["*"]`) |
| `hampshire_cv_backlog` | hampshire | `date` `friday` "Friday" generic |
| `careers_attachment` | hampshire | `document` `cv` "my CV" distinctive (`attachmentKind: document`) |
| `tech_stack` | company | none |
| `lord_intern` | lord | `name`/recipient `lord_first` "Sofia" generic; `lord_full` "Sofia Lord" generic; `name`/intern `lord_first`, `lord_full` (same labels, generic); `team`/intern `finance` "Finance" generic |
| `lord_portal` | lord | none (readiness; what to clone) |
| `lord_portal_name` | lord | `portal` `staff_portal_name` "the staff portal" distinctive |
| `lord_payslip_date` | lord | `date`/release `mon_6th` "Monday the 6th" distinctive |
| `lord_trusts_portal_sender` | lord | `name`/sender `portal_full` "AccountingNow Payroll Portal" distinctive; `address` fixed `portal_address` "payroll-notices@accountingnow.example" distinctive |
| `baker_namesake` | company | `name`/sender `leeds_baker_full` "J. Baker" stale |
| `old_org_chart` | company | `name`/manager `baker_full` "Jed Baker" stale; `team`/intern `accounts` "Accounts" stale |

**`reduceNote`s for the defender facts.** The lab's defender mode (`03`, `10` stage 7) offers exactly
four facts for mitigation, so each carries a note (the validator rejects a `factMitigations` fact with
none). The four are the email pattern, the document metadata (`username_convention`), Lord's post
(`lord_portal`) and the careers inbox (`hampshire_careers`). No other lab fact has a `reduceNote`:

| fact | `reduceNote` |
|------|--------------|
| `email_pattern` | "Do not publish staff addresses in a pattern a lookup tool can learn; use role inboxes on public pages." |
| `username_convention` | "Strip author and application metadata from documents before publishing them." |
| `lord_portal` | "Staff should not post about internal systems or their release dates." |
| `hampshire_careers` | "Route open inboxes through a filtered gateway and scan attachments." |

Rules this table settles:

- **Lord can be greeted.** `lord_intern` provides her name forms twice, once with `about:
  "recipient"` (the greeting) and once with `about: "intern"` (the call's blank). Her `addressedAs`
  is `["lord_first"]`. The validator checks that every `addressedAs` value is provided by a fact in
  that target's readiness slots, and that the target's required factors are reachable from granted
  facts.
- **Pierce can be greeted by every form in her `addressedAs`.** `pierce_first` and `pierce_formal`
  come from `pierce_role`, `pierce_short` from the Q3 note.
- **Lord's trusted sender is the `portal` person.** `lord_trusts_portal_sender` provides the portal's
  name and its fixed address, both belonging to `portal`, so a From of `portal_full` plus
  `portal_address` passes `senderTrust` for Lord (`trusts: ["portal"]`), and only after the call.
- **A people card needs no name-form fact.** A card's header resolves to the person's name from
  `social.people` once any held fact has that person as its `subject`, so Hampshire's card (no fact
  provides a `hampshire_*` name form) still leaves "Not yet identified" when `hampshire_careers` is held.
- **Wrong options exist.** `baker_namesake` gives a sender name that is not trusted;
  `old_org_chart` gives a wrong manager and a wrong team for the pretext call (06).
- **Values with colons are not allowed** (§6); a `value` is a short id.

**Slot types** (the vocabulary a template slot or a pretext blank names):

| type | value id shape | example |
|------|----------------|---------|
| `name` | `<person>_<form>` | `pierce_first`, `baker_full` |
| `address` | `<person>_address`, built from a rule or fixed | `baker_address`, `portal_address` |
| `document` | a short id | `balance_sheet`, `cv` |
| `date` | a short id | `friday`, `mon_6th` |
| `team`, `role`, `floor`, `achievement` | a short id | `finance`, `2`, `helpdesk_award` |
| `portal` | a short id | `staff_portal_name` |

There are exactly these types. An attachment or a link is never a blank: it is chosen with the Attach
control and carried as `message.attachment` / `message.link` (payload-kit item ids, §3). A new type is
a validator change.

**Payload-kit attachment kinds** are one list across `01` and `04`: `spreadsheet`, `document`,
`pdf`, `archive`, `image`, plus `link` for a built landing page. A kit item is `{ id, label, kind }`,
and a `link` item adds `landingPageId` (`kit_payroll_page`, §11a). `primedFor.expectedAttachment` and
the document value's `attachmentKind` use the attachment kinds; a `link` is never an attachment.

---

## 2. Factor library (canonical) and shared red-flag library

Seven factors. Attack (`04`) and defence (`05`) both import these exact definitions and the one
canonical red-flag string per factor, so attack and defence cannot disagree about a tell.

| factor id | Required/advisory default | Passes when | Canonical red-flag string (shared) |
|-----------|---------------------------|-------------|-------------------------------------|
| `senderTrust` | required | The From blanks name someone the target expects and the address belongs to that same person (see §10 "Judging by slot") | "Sender address doesn't match the display name or a known contact" |
| `senderAuth` | advisory (attack) / scored (defence) | The spoof would pass the claimed domain's sender authentication (see below) | "Fails sender authentication (SPF/DKIM/DMARC) — the domain didn't really send this" |
| `addressedTo` | required | The greeting's name value is in the target's `addressedAs` list | "Generic greeting, not addressed to the recipient" |
| `pretextRelevant` | required | The pretext template's slot values include at least `minDistinct` of the target's distinctive values (not just generic ones) | "No plausible reason for this message to this person" |
| `attachmentPlausible` | required if attachment | Attachment present **and** its kind matches the pretext's expected kind | see three states below |
| `urgencyCalibrated` | **advisory / red-flag only** | never fails a send (see below) | "Unexpected urgency or pressure to act fast" |
| `linkCredible` | required if link | `message.linkInfo.meetsThreshold` is true: the built page's credibility reaches the target's threshold and its gates pass (§11a; scored by 07). State `missing` when the kit item has no built page | "Link destination doesn't match the real site (look-alike domain)" |

**Red-flag resolution:** a factor's `redFlag` in an `EvalResult` (§3) is the per-target override
from `factorStrings` when the author set one, **otherwise the canonical string above**. A `null` in
a per-target `factorStrings` entry means "use the canonical string", never an empty flag, so `01`'s
checklist and `05`'s chips always have a label.

**Canonical pass and fail lines.** A target with no ink story (or a factor its `factorStrings` leave
out) uses these. The `pass` line is the checklist's ✓ line; the `fail` line is the diegetic reply for
the first failed factor. A target may override either in `factorStrings`.

| factor | `pass` (checklist) | `fail` (diegetic reply) |
|--------|--------------------|-------------------------|
| `senderTrust` | "✓ Sender looked trusted" | "Sorry, who is this? I don't recognise the sender." |
| `senderAuth` | "✓ Sender authentication would pass" | "This didn't pass the usual sender checks." |
| `addressedTo` | "✓ Addressed by name" | "This doesn't have my name on it." |
| `pretextRelevant` | "✓ Relevant to the recipient" | "I'm not expecting anything like this." |
| `attachmentPlausible` | "✓ The attachment fits the story" | the per-state strings below |
| `urgencyCalibrated` | "✓ The pressure was believable" | "That feels rushed." (advisory; never a reply) |
| `linkCredible` | "✓ The link looked right" | "That link doesn't look right to me." State `missing`: "There's no page behind that link." |

### `attachmentPlausible` has three result states

| state | when | reply string (diegetic) | red-flag string |
|-------|------|-------------------------|-----------------|
| `pass` | present, kind fits | — | — |
| `missing` | target expects one, none attached | "You said you'd attach it, but there's nothing here." | "Claims an attachment that isn't present" |
| `wrong-type` | present, kind wrong | "Why would you send me that file type?" | "Attachment type doesn't fit the stated purpose" |

Every per-factor entry in `factorStrings` has the same shape (`pass`, `fail` and `redFlag`, with the
attachment factor adding one string per state). The anti-inversion guarantee comes from the
per-state keyed mapping: a no-attachment send gets the `missing` string, never the wrong-type one.
The empty-string lint (04 N3) separately catches blank output.

### `senderAuth`

Models, at concept level, whether a spoof would survive the claimed domain's sender authentication.
The three mechanisms are distinct and 05 must teach them correctly: **SPF** checks the sending
server is authorised to send for the envelope (return-path) domain; **DKIM** checks a cryptographic
signature added by the signing domain; **DMARC** ties a passing SPF or DKIM result to the visible
`From:` domain (**alignment** is this DMARC step) and tells receivers what to do on failure.

The engine derives the outcome from the real sending account (§10a): the account's domain is the
envelope and signing domain, the header From is the visible domain, and the claimed domain's authored
policy (`senderAuth: { domainPublishesAuth, spoofAligns, dmarcPolicy }`, §7) says whether the pair
would align and what the domain asks receivers to do about a failure. `dmarcPolicy` is `none`,
`quarantine` or `reject`. At `none` the check fails alignment but the message is still delivered, and
the advisory says exactly that; at `quarantine` or `reject` it says the message would be junked or
refused. The advisory sentence is built from `dmarcPolicy`, so no policy is implied by prose alone. A
target's `factorStrings.senderAuth` may replace the sentence. The mail client's header read shows
`factorStrings.senderAuth.fail` when the read is `would-fail` and `.pass` when it is `would-pass`, and
falls back to the derived sentence for a side the target does not author. In the lab Pierce authors
both sides (the `fail` side is the `p=none` line) and Hampshire authors the `pass` side ("Sent as your own outside
address, so there is nothing to spoof and nothing to fail."; `04` holds both); Lord uses the derived
sentence with the `dmarcPolicy` clause. A scenario may override the derived result per target. No real header forging happens. On the attack
side this is **advisory**: a spoof can still fool a person if it is delivered, but the player is told
it would likely be quarantined or flagged (the honest link to `01`'s "delivery isn't guaranteed"
note). On the defence side (`05`) the same outcome is what the player reads in the header panel. One
model, both seats.

### Channel tells (for the awareness episodes and other non-email channels)

The seven factors cover email craft. The awareness episodes (`11`) teach other channels, whose tells
join the **same shared library** (one id, one canonical string, imported by both the attack beat
and the defend scoring). Some are **defend-side only** (no attacker mirror in these episodes) and
are marked so.

| id | channel | canonical tell string | seats |
|----|---------|------------------------|-------|
| `lookalike_domain` | link/web | "Link or sender domain is a look-alike of the real one" | both (attack via `linkCredible`) |
| `changed_bank_details` | BEC/invoice | "Payment or bank details changed at the last minute" | both (attack via `pretextRelevant`) |
| `unexpected_qr` | quishing | "A QR code where you'd expect a normal link" | defend-only |
| `unrequested_mfa_push` | MFA fatigue | "An MFA prompt you didn't trigger" | defend-only |
| `smish_shortlink_urgency` | smishing | "Unsolicited SMS with a shortened link and pressure" | defend-only |
| `vish_callback_pressure` | vishing | "Caller discourages you from calling back the official number" | both (attack via `06`) |
| `secrecy_or_bypass` | all | "Asked to keep it secret or to skip the normal process" | both (attack via `pretextRelevant`) |
| `borrowed_authority` | vishing, BEC | "Someone senior is invoked to skip a check" | both (attack via `06`) |
| `reply_to_differs` | email | "The reply-to address differs from the From address" | defend-only |
| `reply_stop_trick` | smishing | "'Reply STOP' to opt out, which confirms your number is live" | defend-only |
| `padlock_myth` | link/web | "A padlock shows the connection is private to the address owner, not that the site is safe" | defend-only |

An author may add scenario-local tells; a reusable one belongs here.

### `urgencyCalibrated` is advisory

Overdone urgency does **not** fail a send (real phishing with heavy urgency still lands). Urgency is
taught as a **tell the defender reads**, and as advisory feedback to the attacker ("this reads as
high-pressure — a defender would clock it"), never as a landing gate.

---

## 3. `evaluateMessage` I/O contract, and 01's `result` transform

`evaluateMessage(target, message, ctx) → EvalResult`, in the pure module `systems/phish-rules.js`.
`ctx` is `{ accounts, people, templates }` (the scenario's `social.mailClient.accounts`,
`social.people` and `social.templates`), passed in so the module reads no globals and no DOM.

`message` is the composed message: the chosen template id per part with its slot values (§10), the
real sending account, the header From (§10a), and the attachment or link pick:

```jsonc
// message
{ "fromAccount": "guest",
  "headerFrom": { "name": "baker_full", "address": "baker_address" },   // value ids from the From blanks
  "templates": { "greeting": "greet_named", "pretext": "pretext_sheet", "ask": "ask_open_attached" },
  "slots": { "name": "pierce_short", "document": "balance_sheet", "when": "friday" },
  "attachment": "kit_balance_sheet",    // payload-kit item id (the Attach control; never a slot)
  "link": null,                         // payload-kit item id, e.g. "kit_payroll_page"
  "linkInfo": null }                    // filled by 01 from the saved page record when link is set (§11a)
```

A blank-free From (`from_own`) sends `"headerFrom": { "account": true }` instead of value ids (§10a).
`linkInfo`, when `link` is set, is `{ kitId, pageId, domainId, domain, credibility, gatesPassed,
meetsThreshold }` or `{ kitId, state: "missing" }`.

```jsonc
// EvalResult
{
  "landed": true,                       // all REQUIRED factors passed
  "factors": [                          // one entry per evaluated factor
    { "id": "senderTrust", "pass": true,  "state": "pass",
      "reply": null, "redFlag": null, "mode": "required" },
    { "id": "attachmentPlausible", "pass": false, "state": "missing",
      "reply": "You said you'd attach it...", "redFlag": "Claims an attachment that isn't present",
      "mode": "required" }
  ],
  "claimedSender": "baker",             // person id the From blanks matched, or null
  "fromAccount": "guest",               // the account really used (§10a)
  "hintIndex": 1,                       // which hint to surface next (per-target progression)
  "advisory": { "urgency": "high", "senderAuth": "would-fail" },   // non-gating notes
  "tells": [ "senderTrust", "senderAuth" ]   // see below
}
```

`tells` lists the deceptions present in the message **as sent**, whether or not the target fell for
it: `senderTrust` when `claimedSender` is set but the real account is not that person's, `linkCredible`
when the link domain is not the real one, plus the advisory `urgencyCalibrated` and `senderAuth`
reads. It is independent of `pass`. A message that landed has every required factor passing, so its
`redFlags` is empty, but its `tells` are not. The defender flip (`05`, `10` stage 7, `11`) reads
`tells`, never `redFlags`.

The same `EvalResult` has two consumers:

- **The mail client's checklist** (the teaching layer, `01`), rendered at once on send.
- **The recipient NPC's ink story**, when the target has one (§10). The engine writes the result
  into ink variables and the ink writes the in-character reply. A target with no ink story falls
  back to the authored `replies` / `factorStrings` in its `04` record.

`01`'s `minigame_completed` `result` is a transform of `EvalResult`, not a schema of its own:

```jsonc
// 01 gameResult (of the last send; set when the player closes the client)
{
  "targetId": "pierce",
  "landed": true,
  "redFlags": [ /* factors.filter(f=>!f.pass).map(f=>f.redFlag) */ ],
  "tells": [ /* EvalResult.tells, as redFlag strings */ ],
  "outcome": "landed"   // "landed" | "failed": EvalResult.landed at send time; never a score
}
```

The mail client does **not** complete on a send. The overlay stays open so the player reads the
checklist and the banner and can edit and resend, and the in-character reply arrives later into the
mailbox. `complete(true)` fires when the player closes the client, with the `gameResult` of the last
send. A scenario never keys a task on `minigame_completed` for mail: it keys on the target's
`phish_<id>_landed` global, which the reply's ink (or the text job for a data-only target) sets when
the reply is delivered (§10).

There is **no aggregate `pretextScore`** in the deterministic engine. The only numeric idea is the
optional advisory LLM note (§7), which is never pass/fail and never an aggregate quality number.

---

## 4. Intel → factor prerequisite map, and the readiness rule

Readiness is derived from the OSINT **prerequisites**: the facts that must be collected before a
target's recon-fed factors are achievable. It is not derived from craft factors, several of which
have no recon counterpart.

| recon-fed factor | satisfied in principle once the player has collected… |
|------------------|--------------------------------------------------------|
| `senderTrust` | the target's trusted-sender fact (`pierce_trusts_jed`; `lord_trusts_portal_sender` for Lord, from the call) **and** `email_pattern` where an address is built |
| `pretextRelevant` | the target's primed-topic fact (`pierce_expects_balance_sheet`; `lord_payslip_date` for Lord) |
| `attachmentPlausible` | the expected-attachment fact (part of `pierce_expects_balance_sheet` / `careers_attachment`) |
| `linkCredible` (link targets only) | `lord_portal_name` (a fact) plus a built page (07) |

`addressedTo`, `urgencyCalibrated` and `senderAuth` are satisfied by what the player fills in or
chooses at compose time, so they never appear on the readiness tracker.

**Readiness rule:** a target card shows one slot per recon prerequisite that is a **fact**, phrased
as an intel gap, not a factor name, so it nudges without handing over the pretext recipe:

- not yet collected: "You still don't know **what Melanie expects to receive**."
- collected: "You know she expects a balance sheet from Jed on Fridays." (the board adds the tick and the word "Done"; a `doneString` carries no mark of its own)

A target also needs its **addressing** facts: a target's `addressedAs` forms must be provided by facts
inside its readiness slots (the validator checks it), so a card never reads "Ready to approach"
while the composer has no name to greet her with. Pierce's first slot is therefore "Who she is"
(`pierce_role`).

A card flips to **"Ready to approach"** when all its fact slots are collected. The string is
literally "Ready to approach — you have enough to craft something she'll believe." It never lists
the factors or spells out the message.

**Readiness never depends on something built after the recon room.** A built landing page is checked
by `linkCredible` at send time, not by a board slot, and a fact granted by a call (06) is not a board
prerequisite for opening the room that holds the phone. So Lord's board slots need only the facts
found by browsing (`lord_portal`, `lord_intern`). The portal name, payslip date and portal sender
arrive later, from the call, and are the send-time prerequisites for her phish.

A scenario authors the map explicitly rather than deriving it. `readinessSlots` is an object keyed by
target id, one array of slots per target:

```jsonc
"readinessSlots": {
  "pierce": [
    { "label": "Who she is", "needsIntel": ["pierce_role"],
      "goalString": "You still don't know what Melanie does here.",
      "doneString": "She works in Finance." },
    { "label": "Who she trusts", "needsIntel": ["pierce_trusts_jed","email_pattern"],
      "goalString": "You still don't know who Melanie would open an email from.",
      "doneString": "She trusts Jed Baker; you know the email pattern." },
    { "label": "What she expects", "needsIntel": ["pierce_expects_balance_sheet"],
      "goalString": "You still don't know what Melanie expects to receive.",
      "doneString": "She expects a Q3 balance sheet from Jed on Fridays." }
  ],
  "lord": [
    { "label": "Her payroll system", "needsIntel": ["lord_portal","lord_intern"],
      "goalString": "You still don't know which staff system Sofia uses.",
      "doneString": "She is a new intern and uses a staff payroll portal." }
  ]
}
```

**Where readiness is computed and set.** A pure function `evaluateReadiness(readinessSlots, globals)`
in `systems/social-intel.js` runs after **every** fact grant: `grantFact` (`02` N2) calls it, and so
do the call grants of `06`. It sets `target_ready_<id>` (once, on the false-to-true flip, through the
shared writer) for each target whose slots are all done, and `osint_done` when every id in
`intelBoard.people` is ready. The board only displays the result, so a player who never opens the
case file still advances. A slot may add `"needsGlobal": ["landing_payroll_login_built"]` (booleans only) for a non-fact
prerequisite, with a `goalString` that does not name the builder. Use it sparingly, and never for a
prerequisite that sits behind the room the board gates.

---

## 5. Intel persistence and gating, and how intel reaches ink

Minigame overlays are modal (the manager holds a single `currentMinigame`), so the intel board is
not running while the OSINT browser is open. A live cross-overlay event cannot be the feed.

- **Source of truth:** when the player collects a fact in `02`, or a call grants one (`06`), the
  caller uses `grantFact(id)` (`02` N2, `systems/social-intel.js`). It writes `se_intel_<id>` through
  the shared writer (S3), which patches `gameState.globalVariables` and emits
  `global_variable_changed:se_intel_<id>`; `grantFact` itself emits `intel_collected`, adds the note
  and runs `evaluateReadiness` (§4) **only on the false→true flip**. (Today `applyActions`
  `set_global`, `systems/apply-actions.js:33-43`, emits on every call and has no flourish; the flip
  check is `grantFact`'s.) `gameState.globalVariables` persists server-side and restores on load
  (`state-sync.js`; `core/game.js`, saved-globals restore). Sync runs every 30 s and on `pagehide`, so a collect is safe
  across a reload; a call to `window.stateSync?.sync()` after a collect closes the window entirely.
- **Declare every fact.** Each `se_intel_<id>` is declared in the scenario's `globalVariables` with
  default `false`. The ink sync tests declared names (`NpcConversationState.isGlobalVariable`), so a
  fact that is set only at runtime and never declared never reaches ink. (The server's
  `merge_global_variables!`, `game.rb:242-262`, saves every key the client sends, so persistence does
  not depend on the declaration; `apply_task_set_globals!` does test declared names.) The validator
  derives the list from `social.intelFacts` and checks it. Docs write bare ids (`pierce_role`); the engine and the
  ink use the prefixed name.
- **`applyActions` does not tell a running ink story.** It writes `gameState.globalVariables` and
  emits an event, but it does not call `broadcastGlobalVariableChange` (as `objectives-manager.js`
  does). A story already cached in `npcManager.inkEngineCache` keeps the old value until its next
  `syncGlobalVariablesToStory`. Engine item S3 (§12) makes `set_global` broadcast; until then every
  runner here syncs before it runs.
- **03 reads persisted globals on open** to display the board (readiness itself is set at grant time,
  §4), plus the `globalVariables[STATE_KEY]` pattern used by the SIEM minigame for any richer
  per-fact payload. The `intel_collected` event is a
  live-UI flourish only. Each collected fact is also added as a note (`window.addNote`) so the player
  has a searchable evidence log outside the board.
- **Gating is explicit.** Downstream components gate on named globals:
  - `01` reveals a target in the composer only once its minimum facts are set (e.g. `pierce`
    appears once `se_intel_pierce_role` is set), or marks it "approach from recon first".
  - `04` judging is independent of collection **by default** (you can send a bad email at any
    time), but a target may set `requiresIntelToAttempt: ["se_intel_lord_portal"]` for a hard gate on a fact that
    sits behind no blank (a readiness-only fact such as that one provides nothing; a fact behind a
    blank already gates Send through the empty-blank rule). No lab target uses it.
    A gated send is blocked with the same neutral pre-send line as an empty blank ("A blank needs
    evidence you haven't found yet", defined in `04`), which never names or hints the missing fact.
    Each scenario states whether intel is advisory or gating.
- **Intel reaches ink as globals.** A name declared in the scenario's `globalVariables` (or
  prefixed `global_`) is a global that ink stories can read. Declare a matching ink `VAR` in each
  channel story that uses it. Ink then unlocks credible claims with a plain gate:
  `+ {se_intel_pierce_manager} [Say Melanie Pierce asked you to ring]`. This is how OSINT done in the
  browser makes a line available in a call, a face-to-face chat or an email reply (§9).
- **Judging is client-side and the data is not secret.** The whole scenario reaches the browser, so
  `primedFor`, thresholds and `truth` fields are readable in dev tools. That is acceptable for a
  browser lab. Outcome globals are client-set, so they cannot be the sole proof of an assessment
  result (README, open questions).

---

## 6. Ink / engine constraints every ink-driven component must respect

Verified in code:

- **`#set_global` is refused for globals imported from an earlier mission**
  (`NpcConversationState.setReadOnlyGlobals` / `isReadOnlyGlobal`; `chat-helpers.js`
  `processGameActionTags`, the `set_global` and `set_variable` cases). Declare SE output globals in
  the scenario's own `globalVariables`; don't import them. The authored key is `importGlobals`; the
  server resolves it to `importedGlobals` (`app/models/break_escape/carry_over.rb`), so a global must
  not appear under `importGlobals` either.
- **Tag parameters split on `:`.** `#set_global:name:value` and the person-chat tag parser both split
  on colons, so values containing a colon break. Keep tag values colon-free.
- **Ink choice tags are dropped** (`systems/ink/ink-engine.js` rebuilds choices as `{text,index}`),
  and line tags are processed after a text batch (`person-chat-minigame.js`), too late for ink to
  branch on in the same step. Anything ink must branch on lives in an ink `VAR` (influence does, §8) or
  comes back from an external function.
- **External functions are bound per loader, and only six exist.** `bindExternalFunction`
  (`ink-engine.js`) is used in `person-chat-conversation.js` and `phone-chat-conversation.js`, which
  each bind the same six read-only context functions. "Proven" applies to the binding mechanism only;
  none of the six has a side effect. A story that declares an `EXTERNAL` that the loader running it
  has not bound throws at the first `Continue()`. Stories are also run by other loaders: the phone
  intro preload (`PhoneChatConversation._preloadOpeningOnce`), the entry-knot dry runs
  (`resolveEntryKnot`), the bark path (`npc-manager.js`, a bare `InkEngine`), and the mail runner (§10).
  New externals therefore bind inside `InkEngine` (engine item S1, §12), with no-op defaults.
  The wrapper forwards only `(name, func)`, so `lookaheadSafe` cannot be passed.
  Side-effecting functions must be idempotent (§8 "Idempotency") or the wrapper extended.
- **Ink state persists across a reopen** (`saveNPCState` / `restoreNPCState`), so retryable knots (a
  re-attempted call, a second email) use sticky `+` choices, not once-only `*`. Person-chat keeps story
  position only in memory (`conversationStates`), so a page reload restarts it at the start knot;
  only scalar variables survive, via `npcInkVariables`.
- **Restore overwrites variables the engine set before it.** Anything the engine writes into a story
  at open (identity variables, `email_*`) is written **after** `restoreNPCState` and after
  `syncGlobalVariablesToStory`, in every loader.
- **Influence tags today** (detail in §8): `#influence:N` sets the stored behaviour score absolutely
  and is handled in person-chat only (`person-chat-conversation.js` `processTags`, calling
  `npcGameBridge.setNPCInfluence`); `#influence_gained:N` / `#influence_lost:N` and the `rapport_` /
  `respect_` / `friendship_` variants dispatch an `npc-influence-change` event that nothing listens
  for; `#influence_increased` / `#influence_decreased` (`chat-helpers.js`) show only the
  `+ Influence: <name>` / `- Influence: <name>` popup. None of the toast tags changes a stored score.
  Phone-chat runs the shared processor (`phone-chat-minigame.js`, which also sets
  `window.currentConversationNPCId`), so it shows the two popup tags; it does not handle
  `#influence:N`, `_gained` or `_lost`.
- **Ink `DONE` ends a story run.** A mail-channel story is headless and only ever runs from
  `on_email`, so ending there with `-> DONE` is fine. A person or phone story still ends in its hub
  (the authoring guide's rule against ending in `DONE`).
- **Temps do not cross a divert.** A `~ temp x = ...` is scoped to its knot. A value that the next
  knot needs travels as a parameter (`-> manager_reaction(band)` with `=== manager_reaction(band) ===`)
  or as a declared `VAR`.

### Overlay rules every new minigame follows

- **Keyboard.** An overlay with keyboard-operable controls (Tab, Enter, Space, arrow keys) starts with
  `requiresKeyboardInput: true`. That is the flag that pauses the player controller's document-level
  `keydown` handler (`minigames/framework/minigame-manager.js:37-45`; `core/player.js:279-330`,
  `keyboardPaused`). Without it, Space jumps, `E` interacts with the nearest object (which can open
  another minigame) and arrow keys move the player and are swallowed. Every overlay in this plan
  sets it; each gets a bridge test that Space and `E` do nothing while it is open.
- **Close.** `disableClose: true` hides the framework's close button and the base class's Esc
  handler (`base-minigame.js:18-23, 70-80`), so an overlay that sets it draws its own visible Close
  control and binds its own Esc (capture phase, so an open picker or text field closes first). Closing
  a viewer overlay is a normal exit (`complete(true)` with a result).
- **Return to.** A minigame that launches another uses S12 (§12): it saves its draft, passes
  `returnTo`, and the child's close reopens it.
- **Readable type.** The bundled face for everything the player reads or compares is **Atkinson
  Hyperlegible** (Regular and Bold; SIL Open Font License 1.1). The files are
  `public/break_escape/assets/fonts/AtkinsonHyperlegible-Regular.woff2` and `-Bold.woff2` (Latin
  subsets, about 40 KB each) with its OFL text beside them, declared in `css/fonts.css` as the family
  `"Atkinson Hyperlegible"` and exposed as the token `--se-font-readable`. Scope: every string the
  player reads or compares, and any string that contains an authored domain, address, handle, file
  name or document field, **wherever it appears**: domain chips, the address bar, the checklist and
  tells-panel lines, feedback strings, mail bodies, board cards, briefs. The theme fonts (`GNF`,
  `Press Start 2P`) keep to chrome labels and headings that contain no such string. Authored domains
  render with `textContent`, never through `displayDashes`. The lab draws the punycode form of its
  homograph (`xn--...`), so a Latin subset is enough. Acceptance check at import: render `rn`/`m`,
  `vv`/`w` and `l`/`I`/`1` at the chip size; if any pair is ambiguous, swap the face (Lexend is the
  fallback candidate, also OFL) and check the licence's reserved-name terms before subsetting.

---

## 7. Phish-target schema completeness

Every factor must be authorable. The target schema includes, beyond 04's core fields:

- `addressedAs: ["pierce_first","pierce_short","pierce_formal"]` — accepted name-form ids for
  `addressedTo` (§1). Display strings come from the facts that provide them.
- `urgency: { advisoryMax: "medium" }` — for the advisory urgency read (never a gate).
- `senderAuth: { domainPublishesAuth: true, spoofAligns: false, dmarcPolicy: "none" }` — the §2
  senderAuth policy for the claimed domain; `dmarcPolicy` is `none`, `quarantine` or `reject`. The
  result is derived from the sending account (§10a); an author may override it.
- `expectedLink: { brandId, realDomain }` — machine-readable, for `linkCredible` and its tell: the
  brand the link claims (an id in `07`'s `brands`) and the real domain the tell compares against
  (§11a). The judge never reads prose here.
- Per-factor mode: `requiredFactors: [...]` and `advisoryFactors: [...]` (or `factors:[{id,mode}]`).
- `primedFor`: `{ distinctiveValues: [...], genericValues: [...], minDistinct: 1,
  expectedAttachment: "spreadsheet", trusts: ["baker"] }` — the values the judge compares (§10
  "Judging by slot"). `trusts` ids are `social.people` ids (cast, `portal` and other senders), or `"*"`.
  Lord's is `minDistinct: 2` (the portal name and the payslip date) with `trusts: ["portal"]`.
- `boostIfGlobal` / `strictIfGlobal` — optional hooks so an earlier call (`06`) changes how a later
  phish lands: `boostIfGlobal: {"reset_granted_pierce": "pretextRelevant"}` relaxes a factor when a
  global is set; `strictIfGlobal: {"helpdesk_alerted": "senderTrust"}` tightens one when the mark
  has been spooked. Lets `06`→`04` chain without hard-wiring. The mail client reads these globals when
  it builds the message and passes `evaluateMessage` an adjusted copy of the target, so the judge
  stays pure (§3). Where the target is a social character,
  its influence global (§8) is the other route by which an earlier channel affects a later one: the
  rules read it as a global with no mirroring step.
- `factorStrings: { <factor>: { pass, fail, redFlag } }` — pass-side strings too, so the ✓ lines
  aren't hard-coded. Per-target strings override the §2 canonical red-flag library for diegetic
  flavour; the canonical set is the default and what `05`'s chips use. A factor left out of
  `factorStrings` uses the §2 canonical strings. Hampshire (a data-only target) authors some strings
  (`senderTrust`, `pretextRelevant`, `attachmentPlausible` and the `pass` side of `senderAuth`, in `04`);
  any factor she leaves out uses the canonical string. The lab's Pierce authors `senderAuth.fail` (the
  `p=none` line) and `.pass`; Lord authors none for it.
- `subjects: [{ id, text }]` — the subject lines the composer offers; the first is the default.
  The sent record stores the chosen `text`, and a reply is `Re: <text>` unless the ink sets one.
- `character` (optional) — the id of the `social.characters` entry whose mail-channel story writes
  this target's replies (§10). Without it the target replies from `replies` / `factorStrings`.

### LLM advisory scope

If the optional advisory is built, it is constrained to **"does this body reference this authored
target's `primedFor` facts"**, never a general "how convincing is this phish" score, and never
improvement suggestions that would transfer to a real target. Advice-only, default-off, cost-noted.
Outside that scope it becomes a phishing-quality optimiser and breaks the "model, don't weaponise"
rule.

---

## 8. NPC influence: the per-character global, threshold behaviours and the bar

There is **no separate suspicion meter**. How far a character believes the player is that
character's **influence** score. Suspicion is influence going down.

### What the engine already has

| Piece | Where |
|-------|-------|
| Ink stories track a `VAR influence` and adjust it (`~ influence += 2`) | m01 Maya, Sarah, Kevin; m02 ward nurse and security guard; `scenarios/ink/influence-demo.ink`. The tag after each `+=` is the authoring-guide convention |
| Ink stories track a prefixed **scenario global** instead | m02 `gary_influence`, `bernie_influence`; m03 `victoria_influence`; m04 `vance_trust_level` ("synced scenario global, also raised face to face") |
| Toast tags `#influence_increased` / `#influence_decreased` | `chat-helpers.js`: popup with the NPC's display name, no value, no reason |
| Toast tags `#influence_gained:N` / `#influence_lost:N`, `#rapport_*`, `#respect_*`, `#friendship_*` | `person-chat-conversation.js`: dispatch `npc-influence-change`. **Nothing listens for it**, so no toast shows today. Used about 440 times in shipped ink; harmless |
| Absolute set `#influence:N` | person-chat only → `npcGameBridge.setNPCInfluence`, which works only for sprite NPCs (behaviours exist only for sprites: `core/game.js`, `core/rooms.js`). m01 Derek (`#hostile` plus `#influence:-100`) depends on it flipping the NPC to combat |
| Auto-hostile | `npc-game-bridge.js` and `npc-behavior.js` (`setInfluence`): combat-hostile when influence drops strictly **below** `behavior.config.hostile.influenceThreshold`, default `-50` (`|| -50`, so an authored `0` becomes `-50`). m02 guards can pass -50 through ink arithmetic alone |
| A bar above an NPC | `systems/npc-health-bar.js`: a Phaser world-space graphic drawn from hostile HP only. It cannot draw in the DOM overlays and shares nothing but colour constants |
| Global↔ink sync | `NpcConversationStateManager` (see §9): declared globals sync both ways, name-keyed |

### The design

- **One global per character.** A social character's influence is a scenario global named
  `<character>_influence`, declared in `globalVariables` (default = the start value) and as
  `VAR <character>_influence` in every channel story of that character. It is a signed integer,
  default scale `-100` to `+100`, start near zero. `<character>` is the id of the entry in
  `social.characters` (§11). An existing mission's own name (`gary_influence`) can be named
  explicitly in `influence.global`. Existing stories that keep a local `VAR influence` are untouched.
- **Ink gating needs nothing else.** Ink reads and writes the global like any synced variable
  (`{priya_influence <= -40: ...}`, `~ priya_influence -= 10`). Many characters need no engine call at
  all; the engine only watches the value.
- **The engine watches the global.** A watcher listens for `global_variable_changed:<influence global>`
  (which the existing observer emits for ink writes, and the shared writer for engine writes), clamps
  to `min`/`max`, works out the delta, evaluates thresholds and emits `npc_influence_changed`.
- **Thresholds are configured per character, with behaviours.** Authored in `social.characters`:

```jsonc
"social": { "characters": {
  "priya": {
    "displayName": "Priya Nair",
    "channels": { "person": "priya_helpdesk", "phone": "priya_helpdesk_phone", "email": "priya_helpdesk_mail" },
    "emailRecord": { "storyPath": "ink/priya_mail.json", "displayName": "Priya Nair (helpdesk mail)" },   // §9
    "emailReplyDelay": 20,                                  // seconds of wall-clock countdown (§10)
    "influence": { "global": "priya_influence", "min": -100, "max": 100, "start": -20 },
    "syncedVars": ["priya_influence", "priya_knows_sam_okafor"],
    "thresholds": [
      { "id": "wary",    "at": -40, "icon": "wary",
        "effects": [ { "type": "setGlobal", "global": "priya_wary", "value": true, "clearOnRearm": true } ] },
      { "id": "refuses", "at": -50, "icon": "refuses",
        "effects": [ { "type": "setGlobal", "global": "priya_refusing", "value": true, "clearOnRearm": true } ] },
      { "id": "reports", "at": -70, "icon": "reports",
        "effects": [ { "type": "setGlobal", "global": "helpdesk_alerted", "value": true },
                     { "type": "endConversation" } ] },
      { "id": "lockout", "at": -90, "icon": "hostile",
        "effects": [ { "type": "lockout", "scope": "channel", "until": { "afterMinutes": 10 },
                       "recoverTo": -30 } ] }
    ]
  }
} }
```

Threshold fields:

- `at`: the value. A threshold with `"when": "below"` (the default for negative values) fires when the
  value is **at or below** `at`; `"when": "above"` fires at or above, for a positive threshold such as
  "trusts you". Equality counts. This is the same convention for the bar and the effects. (The
  legacy hostile check above is strict `<`; it is left alone for non-social NPCs.)
- `icon`: one of `wary`, `refuses`, `reports`, `hostile`, `trusts`, or a scenario asset key. The bar
  draws the icon at that position.
- `effects[]`, run once per crossing, in order:

| effect | what it does |
|--------|--------------|
| `setGlobal {global, value, clearOnRearm?}` | `applyActions set_global` through the shared writer (§9). Declare the global; do not import it. Values colon-free. `clearOnRearm: true` (booleans only) makes it a **band flag**: see "Band flags" below |
| `endConversation` | closes the open conversation on any channel with the NPC's authored `outcomes.reported` line |
| `lockout {scope, until, recoverTo}` | refuses new conversations. `scope`: `"channel"` (only the channel the player was on) or `"character"` (all channels). `until`: `{ "afterMinutes": N }` (**real elapsed minutes** from `gameClock.elapsedMs()`; it is not scaled by a scenario's `gameClock.rate`, and needs no `gameClock` block), `{ "global": "name" }` (lifts when that global becomes true) or `null` (permanent; the validator rejects this on a critical-path character, below). `recoverTo`: the influence value set when the lockout lifts (default: the declared start). **Rule: `recoverTo >= A + rearmMargin`, where `A` is the highest `at` among the character's thresholds that carry effects** (the comparison is `>=`; the validator checks it). The lift writes it **silently**: it clears the latch, clears the band flags and re-arms the thresholds without running their effects, so a character never returns already `wary` or `refusing`. Dev and Priya (`at` -40, margin 10) use -30, which meets the rule exactly |
| `combatHostile` | **opt-in.** Calls `setHostile`, the existing combat state (tint, chase, health bar, punch on click). Off by default |
| `toast {text}` | a fixed one-line notice |

- A crossing fires when the value moves from the other side of `at` to this side. It re-arms when the
  value returns to `at + rearmMargin` or above (default margin 10; for a `"when": "above"` threshold,
  to `at - rearmMargin` or below). The latch is stored in the global `<character>_latched` (a
  colon-free comma list of fired ids), so a reload does not re-fire.
- **Band flags.** A `setGlobal` effect with a boolean value and `clearOnRearm: true` is a band flag
  (the lab's `*_wary` and `*_refusing`). The influence service recomputes every band flag after each
  change to the influence global, by any writer, including a lockout lift: it sets the flag when the
  value is at or past `at`, and clears it (to its declared default, silently, through the shared
  writer) once the value is back at `at + rearmMargin` or above. Between the two it leaves the flag
  alone. Report and alarm globals (`dev_reported`, `helpdesk_alerted`) are events, not bands, so they
  do not set `clearOnRearm` and stay set. Ink that wants a band should branch on the band number the
  pretext functions return (`06` §5), or compare the influence number, rather than read a flag
  that a recovery would clear.
- **Band numbers.** Ink branches on a small integer, the band a pretext function returns (`06` §5), and the
  thresholds produce it by id. The band is the highest crossed threshold, ranked by id: `wary` gives 1,
  `refuses` gives 2, `reports` gives 3 (also returned when the call is force-reported), and `lockout`, or
  any threshold carrying a `lockout` effect that is not `reports`, gives 4. With none crossed the band is 0
  (calm). Other ids (`trusts`, scenario-specific ids) never change the band. A character without a
  threshold of a given id never returns that band (Pierce and Lord return only 0 or 1). Band 4 reaches a
  conversation only if it is still open when the lockout starts; when the lockout is an effect of
  `reports` (Dev), the call has already ended, so 4 is not returned in a call. Authors who want finer
  branching compare the influence number.
- **A forced report.** A conversation can end in a report without the value reaching the `reports`
  threshold: the refusal limit (`maxRefusals`), a failed verification, or a scripted beat. The write
  path exposes `report(character, reason)` (S5). It runs the effects of the threshold whose **id is
  `reports`**, in order, latches that id and records the reason (the debrief shows it). The pretext
  judge returns `reported: true` with a reason (`"maxRefusals"`, `"verificationFailed"`,
  `"threshold"`) and the binding calls `report`; an ink story may call it with the tag
  `#report:<reason>`. Influence is **not** changed by a forced report. The validator requires every
  character that has call data in `social.pretextNpcs` to have a threshold with id `reports`.
- **Existing missions are unchanged.** None of this applies to an NPC that has no `social.characters`
  entry. The legacy `#influence:N`, `#hostile` and the `-50` auto-hostile default stay exactly as they
  are (m01 Derek still fights; m02 guards are not turned hostile by ink arithmetic). The engine does
  not mirror any ink `influence` into the behaviour state, and a character that wants a sprite NPC's
  behaviour state kept equal sets `"mirrorToBehavior": true`.
- **Lockout is not combat, and it persists in globals.** A `lockout` effect writes two declared
  globals, `<character>_lockout_until` (an integer: the absolute `gameClock.elapsedMs()` at which it
  lifts; `0` none; `-1` until the effect's `until.global` is true) and `<character>_lockout_channel`
  (`person`, `phone`, `email`, `all` or `""`). They ride `globalVariables` persistence, so no server
  section is needed and a reload keeps the deadline (the clock resumes from its saved elapsed time).
  The validator derives both names for any character with a `lockout` effect and checks they are
  declared. It adds no tint, no chase and no health bar. `systems/interactions.js` (the NPC sprite
  branch that today punches a hostile NPC) shows a "will not talk to you" toast instead; phone-chat
  and the mail client refuse the same way, and `01` refuses the send before `evaluateMessage` runs. The
  engine lifts it when the deadline passes or the global turns true: it writes `recoverTo`
  silently, clears the latch and zeroes both globals.
- **A failed attempt must never permanently block a critical path.** The validator enforces this for
  any character that grants a fact or global a required task depends on: every `lockout` has an
  `until` (not `null`), or the grant has an authored alternative route (`alternativeRoute` on the ask:
  another channel or a global that a different beat sets). A scenario may also add its own beat, such
  as an `eventMappings` entry on `global_variable_changed:helpdesk_alerted` that sets the character's
  influence back to its start after a debrief line. `lockout.scope: "channel"` is the default
  recommendation, so a burned phone call leaves the email route open. A character reachable only by
  mail, and needed on the critical path, has no `reports` threshold and no lockout (the lab's Pierce
  and Lord below), so failed sends only move the bar; `min` just stops it sinking further.
- **Every change carries a reason.** Each influence change is tagged with a reason id (a fact id such
  as `manager`, a technique such as `urgency`, or a factor such as `senderTrust`). Writes made by the
  engine path carry `{delta, reason, line}`; an ink write that did not pass through the path is
  recorded with the reason `ink`. The toast, the tells panel and the debrief (06 §4) are drawn from
  that stream.
- **The write path updates the running story.** An engine-side write (`se_influence`,
  `pretext_say`, a threshold effect, a lockout lift) goes through the shared writer (S3). Besides
  `gameState` and the other cached stories, the writer sets the **calling story's own VAR** (the
  binding knows its `InkEngine`) with the observer detached, using the clamped value. An ink
  assignment out of range (`~ priya_influence -= 120`) is clamped by the watcher and the clamped
  value is written back into the story that wrote it. So `~ se_influence(-10, "x")` followed by
  `~ priya_influence += 2` in one knot yields the sum, not the stale value plus two. The mail
  runner's engine is not in `inkEngineCache`, so the runner passes it to the writer explicitly.
- **It carries across channels without a single record.** Every channel story of a character declares
  `VAR <character>_influence`, so the value is the same in the person, phone and email stories (§9).
  A clumsy email lowers the influence the next call starts with. `04` can read it through
  `boostIfGlobal` / `strictIfGlobal` directly, because it is already a global.

### Characters of the student lab

Every character the student can contact has a `social.characters` entry. Failed mail sends cost 10
points each (04), so the two mail-only targets cannot be locked out of the only route to them.
Hampshire is a data-only target with no character entry, so she has no influence and pays nothing;
her `emailReplyDelay` is authored on her target (15, like the other two).

```jsonc
"characters": {
  "pierce": {
    "displayName": "Melanie Pierce",
    "channels": { "email": "pierce_mail" },
    "emailRecord": { "storyPath": "ink/pierce_mail.json", "displayName": "Melanie Pierce" },
    "emailReplyDelay": 15,
    "influence": { "global": "pierce_influence", "min": -40, "max": 100, "start": 0 },
    "syncedVars": ["pierce_influence"],
    "thresholds": [ { "id": "wary", "at": -30, "icon": "wary",
                      "effects": [ { "type": "setGlobal", "global": "pierce_wary", "value": true, "clearOnRearm": true } ] } ]
  },
  "lord": {
    "displayName": "Sofia Lord",
    "channels": { "email": "lord_mail" },
    "emailRecord": { "storyPath": "ink/lord_mail.json", "displayName": "Sofia Lord" },
    "emailReplyDelay": 15,
    "influence": { "global": "lord_influence", "min": -40, "max": 100, "start": 0 },
    "syncedVars": ["lord_influence"],
    "thresholds": [ { "id": "wary", "at": -30, "icon": "wary",
                      "effects": [ { "type": "setGlobal", "global": "lord_wary", "value": true, "clearOnRearm": true } ] } ]
  },
  "dev": {
    "displayName": "Dev",
    "channels": { "phone": "dev_service_desk" },
    "influence": { "global": "dev_influence", "min": -100, "max": 100, "start": -10 },
    "syncedVars": ["dev_influence"],
    "thresholds": [
      { "id": "wary",    "at": -40, "icon": "wary",    "effects": [ { "type": "setGlobal", "global": "dev_wary", "value": true, "clearOnRearm": true } ] },
      { "id": "refuses", "at": -50, "icon": "refuses", "effects": [ { "type": "setGlobal", "global": "dev_refusing", "value": true, "clearOnRearm": true } ] },
      { "id": "reports", "at": -70, "icon": "reports",
        "effects": [ { "type": "setGlobal", "global": "dev_reported", "value": true },
                     { "type": "endConversation" },
                     { "type": "lockout", "scope": "channel", "until": { "afterMinutes": 2 }, "recoverTo": -30 } ] } ]
  }
}
```

`start` is the declared default of the influence global. Pierce and Lord have no `refuses`, `reports`
or `lockout`: a mail character cannot be burned, and the `min` of -40 stops a long run of bad sends
from sinking the bar. Dev is the only lab character with a lockout, and it sits on `reports` so that
a forced report (a refusal limit or a failed verification, at any influence) lifts after two real
minutes with Dev reset to -30, his `wary` line plus the re-arm margin, so both band flags clear on the lift (`06` §4.8). Ruth, Whitlock and Tomasz are
ordinary story NPCs with no `social.characters` entry and no bar.

### How the bar reads it

The bar is a DOM component (engine item S4) built once and used by `person-chat`, `phone-chat` and the
mail reading pane. On mount it takes the open conversation's NPC id, finds the character
(`social.characters` reverse map from channel ids), reads the value from
`gameState.globalVariables[influence.global]` and the markers from `thresholds[].at`/`icon`. It
updates on `global_variable_changed:<influence global>` and on `npc_influence_changed`, so a change
written from ink alone moves the bar. Per-change reasons show only when the event carries one. Whether
the number is printed is a scenario setting (`tuning.influenceNumberVisible`, 06). A character with no
`social.characters` entry shows no bar.

### Scale

The engine's hostile default (`-50`) and the shipped stories' steps imply no fixed scale: m01 and the
m02 receptionist use +1 and +2, the m02 guard uses tens and gates on `>= 15`/`>= 20`. For social
characters the default is `-100` to `+100` with per-line changes in tens (a checked, wrong claim about
`-30`; a confirmed detail `+10`). 06's worked examples use this scale. Social characters are exempt
from the "tag after every `+=`" lint (the shared path owns the toast); the dialogue linter needs the
same exemption.

### Idempotency

The influence functions (`se_influence`, `pretext_say`, `pretext_ask`) can be re-evaluated: ink may
re-run a line after a restore, and the dry runs in `resolveEntryKnot` execute them. The engine keeps a
**ledger per run** and a **turn counter** inside it. A run is one open conversation (person-chat or
phone-chat) or one mail delivery; a mail run's `runId` is its `msgId`. The turn counter increments
on each `ChooseChoiceIndex`, so an `on_email` run (which makes no choice) is always turn 0, and a
second email is a different run with a fresh ledger. A call's key is `(runId, turn, function,
id-or-ordinal)`: `pretext_say` and `pretext_ask` key on their id, and `se_influence(delta, reason)`,
which has no id, keys on its ordinal among the `se_influence` calls of that turn. The same key
returns the stored result without writing again. The same id used on two different turns, such as a
sticky "ring back later", runs both times. Dry runs bind the no-op versions (S1).

### Influence tags outside person-chat

For social characters only, the shared tag processor (`chat-helpers.js` `processGameActionTags`) also
handles `#influence_gained:N[:reason]` and `#influence_lost:N[:reason]` and routes them to the write
path (S5), so the tags work in phone-chat and the mail runner as well as person-chat. For every other
NPC the existing tags keep their behaviour exactly (a popup, or nothing). The `npc-influence-change`
event gets a listener that does the same routing for social characters.

---

## 9. Channels: separate stories per channel, state shared through synced globals

Pretexting is channel-agnostic. The same character can be approached in **person** (`person-chat`),
by **phone** (`phone-chat`) and by **email** (`01` + §10).

- **One ink story per channel.** The dialogue differs naturally by channel (in person they can see
  your badge; on the phone they cannot; by email they check the sender address), so each channel has
  its own file and its own NPC record, as the shipped missions already do: m04's `robert_vance`
  (person) and `robert_vance_phone`, m05's `patricia_morgan` and `patricia_phone`. There is no
  `VAR channel`, no shared story and no channels list on one record. A story opens at its own entry
  point; the mail story's is `on_email`.
- **A character is a thin link.** `social.characters.<id>.channels` maps channel names to NPC record
  ids (§11). It owns three things: the influence global and thresholds (§8), the list of synced
  variables, and the identity of the character for the validator and the bar. The records themselves
  stay ordinary NPC records with their own `storyPath`, `npcType` and `phoneId`.
- **Shared state is synced globals.** Anything that must hold across channels is a scenario global
  declared in `globalVariables` and listed in the character's `syncedVars`, and each story that
  uses it declares `VAR <same name>`. The names are `<character>_<name>`:
  `priya_influence`, `priya_knows_sam_okafor`, `priya_burned`. Local VARs (a greeting counter, a
  once-only flag for one channel) stay local and per record.
- **Facts gathered elsewhere arrive as globals** (§5): OSINT and the intel board set
  `se_intel_<id>`; an earlier call sets its grant globals. Ink reads them to unlock credible claims.

### How the sync works today, and what it still needs

The mechanism exists and is name-keyed (`systems/npc-conversation-state.js`):

| Step | Code | Behaviour |
|------|------|-----------|
| Declare | `setDeclaredGlobals(Object.keys(gameScenario.globalVariables))`, called in `core/game.js` at load | A name is a synced global if it is declared there, or prefixed `global_` (`isGlobalVariable`) |
| Into a story | `syncGlobalVariablesToStory(story)` | Copies every declared global that the story also declares as a `VAR`. A story that does not declare it is skipped. Runs on every open, after `restoreNPCState` |
| Out of a story | `observeGlobalVariableChanges` and `syncGlobalVariablesFromStory` | On an ink assignment: writes `gameState.globalVariables`, calls `broadcastGlobalVariableChange` to every other cached story, emits `global_variable_changed:<name>`. Read-only (imported) globals are reverted |
| Between stories | `broadcastGlobalVariableChange(name, value, sourceNpcId)` | Pushes to every story in `npcManager.inkEngineCache` that declares the name; the source is skipped to avoid a loop |
| Persist | `game.rb` `merge_global_variables!` | Saves every key the client sends (minus imported ones) on the 30 s sync and on `pagehide`; restored by `core/game.js` |

So two stories that both declare `VAR priya_influence`, with the global declared, already stay equal
when open and re-sync on open. Nothing needs a per-record link. What the plan adds:

- **Which variables sync.** The engine needs no change here: it already syncs **any** declared
  global that a story also declares as a `VAR` (`syncGlobalVariablesToStory`), whatever
  `syncedVars` says. `social.characters.<id>.syncedVars` is documentation and validator input: every
  name in it must be declared in `globalVariables`, and every channel story that names one must
  declare the `VAR` with the same type and default (the validator checks both). A story that
  declares a character's global but leaves it out of `syncedVars` still syncs, and the validator warns.
  `<character>_influence` is always implied.
- **How they are declared per NPC.** Per character, once (`syncedVars`), not per record. A record
  needs no field. An author lists the variable in `globalVariables`, in `syncedVars`, and in each
  story's `VAR` block.
- **When sync happens.** On open of any channel (existing `syncGlobalVariablesToStory`, after
  restore, before any engine-set variable); on every ink write (existing observer and broadcast); on
  every engine write (the shared writer, S3); and, for the mail runner, before and after each run (S6).
  A story not loaded when the value changes picks it up on its next open.
- **Save and restore.** The values live in `globalVariables`, which saves and restores. Each channel
  story's own position and local VARs save per record: person-chat in memory (reload restarts at the
  start knot), phone-chat in the record's `storyState` via `phoneState`, mail in `mailState` (§10).
  `restoreNPCState` skips global names when it restores a variables-only state and the sync fixes the
  rest after a `LoadJson`, so a reload cannot roll a global back.
- **Gaps closed by engine work** (§12): a shared writer so engine-side writes also broadcast (S3); the
  mail runner doing the same sync steps as the chat loaders (S6); exclusion of run-scoped variables
  (`email_` prefix) from `recordInkVariables` / `exportNpcInkVariables` (S7).

### Display names

Several records of one character should show one name. The m04 comment records a known bug: when two
records share a display name, the first registered wins the speaker prefix. S2 makes the name
resolution prefer the conversation's own NPC. Until then channel records of a social character set
distinct display names ("Priya Nair (helpdesk line)") as m04 does.

### NPC records without a loaded room

An NPC registers only when its room loads (`systems/npc-lazy-loader.js`), and the ink endpoint finds
a story only by looking in a room's `npcs` or `objects` (`games_controller.rb` ink lookup). An
email-only character, or a world character whose room has not been entered, therefore cannot receive
mail. Engine item S8: the record is authored on the character, in
`social.characters.<id>.emailRecord`:

```jsonc
"emailRecord": { "storyPath": "ink/pierce_mail.json", "displayName": "Melanie Pierce", "avatar": "pierce", "itemsHeld": [] }
```

`channels.email` is the record's id. At game start the engine registers `{ id, displayName,
npcType: "phone", phoneId: "mail_only", storyPath, avatar, itemsHeld }` with no sprite (a `phoneId`
no phone lists, so it never shows as a phone contact). Every consumer that today searches only
`rooms.*.npcs` also searches these: the client registration, the ink endpoint, the model lookups
behind `#give_item` and NPC item validation, `scenario_npc_ids`, and the validator (S8 lists the
code). A world character's email story is the same kind of headless record, with its own story file;
its person and phone records stay ordinary NPC records in their rooms. The scenario schema's
`npcType` list (`["person","phone"]`) is unchanged.

### Worked example: `scenarios/ink/neye-eve.ink`

The shipped Neye Eve story (a phone NPC in `ceo_exfil` and two sprite-test scenarios) is a small
pretext against an IT team member. What it actually does:

- `trust_level` moves with the player's choices: -3 for asking about the manager, -5 for a wrong
  name, -2 for a vague title, +2 for small talk. Only the apology knot reads it (`>= -2`); success
  depends on picking the right name.
- `knows_manager_name` is set to true inside `ask_manager`, which ends the call. It gates only the
  "Ask who their manager is" option. The claim choices (`Yes, I'm Alex Chen`, `Sarah Johnson`,
  `Michael Torres`, the IT director) are **always shown**. In `correct_manager` the
  `{knows_manager_name: ... - else: ...}` has two identical branches, so the variable gates nothing,
  and asking never reveals the name.
- Wrong names drop trust sharply and end in "I need to report this to security"; the vague title
  drops it a little and the player carries on.

Its lesson: the story ships the answer in the choice list, so the pretext is a multiple-choice quiz.
In an SE scenario the name must come from **OSINT** (a team page, a post), arrive as a `se_intel_*`
global, and be the thing that makes the correct claim available; a wrong claim is only offered when
the player holds a stale or wrong name. Asking the target directly stays as a choice, because it is
the classic tell, and costs influence with the reason `asked_what_insider_knows`.

`neye-eve.ink` ships in `ceo_exfil`, `npc-sprite-test2` and `npc-sprite-test3`, so it is not edited.
The worked example in `06` is a **new copy** (`se_neye_eve.ink`) in which `trust_level` becomes
`neye_eve_influence`, a rename that breaks nothing only because it is done in the copy.

---

## 10. The email→ink contract

Email is asynchronous phone-chat. The engine judges; the ink reacts in character. The recipient's
mail story is a separate file (§9) with its own `on_email` entry knot.

1. **Compose.** The player builds a message in `01` from templates with blanks (below): which
   account to send from (§10a), the From line, the greeting, a pretext and an ask, and an optional
   attachment or link from the payload kit.
2. **Judge.** On send, `evaluateMessage(target, message)` (§3) returns an `EvalResult`. The mail
   client shows the factor checklist at once.
3. **Write into ink.** If the target has a `character`, the mail runner (below) loads that character's
   email-channel story, sets the variables in the tables below, and schedules `on_email`.
4. **Deliver after a delay.** When the delay elapses ("Timing"), the ink runs from `on_email`. Its
   output becomes the reply, rendered as an email in the mailbox of the real sending account
   (From = the NPC, subject `Re: <subject>` unless the ink sets one).
5. **React.** The ink uses the same tags phone NPCs use: `#give_item`, `#set_global`,
   `#complete_task`, unlock tags, and influence changes with a reason (§8).
6. **Follow up.** Within a thread, short follow-up replies are ink choices offered under the reply
   (as in phone-chat). A new crafted message is judged again from step 1.

### Composing: templates with blanks

The player composes from templates. A template is fixed wording with blanks, such as "I'm your new
manager, [name]". The rules:

- Each blank is filled from evidence the player holds: facts on the intel board and OSINT finds,
  read from the `se_intel_*` globals (§5) through each fact's `provides` (§1). A blank offers only
  what the player has found.
- A template never pre-fills or hints an answer the player has not found yet. A blank with nothing
  held stays empty, and the message cannot be sent until the blank is filled. An empty blank disables
  Send, and the composer shows one neutral line beside it, "A blank needs evidence you haven't found
  yet" (defined in `04`, used by `01`). The line never names the blank or hints its value, and it is
  not part of the judged checklist, which only ever describes a message that was sent.
- The judge scores the slot values: which blank values were chosen, and whether they match the
  target's facts, by id. There is no text matching, so the player never has to guess how the scorer
  wants a message formatted.
- Free text, if the product allows it at all, is unscored flavour. Neither the judge nor the target's
  ink reads it.
- Fixed wording is allowed in a template, since it is the player's craft rather than a fact. A
  template with no blanks needs no evidence, and carries no distinctive value, so on its own it can
  never satisfy `pretextRelevant`. It can satisfy a generic pretext (an open careers inbox).

### Template and slot schema

```jsonc
"templates": {
  "greet_named": { "part": "greeting", "text": "Hi {name},",
    "slots": [ { "id": "name", "type": "name", "about": "recipient" } ] },
  "greet_generic": { "part": "greeting", "text": "Hello,", "slots": [] },
  "pretext_sheet": { "part": "pretext", "text": "Here is {document} you wanted {when}.",
    "slots": [ { "id": "document", "type": "document" }, { "id": "when", "type": "date" } ] },
  "pretext_apply": { "part": "pretext", "text": "I'm applying for the open role.", "slots": [],
    "implies": [ { "type": "document", "value": "cv" } ] },
  "from_named": { "part": "from", "text": "{sender_name} <{sender_address}>",
    "slots": [ { "id": "sender_name", "type": "name", "about": "sender" },
               { "id": "sender_address", "type": "address" } ] },
  "from_own": { "part": "from", "text": "{account_name} <{account_address}>", "slots": [] }
}
```

`from_own` is the blank-free From template: `{account_name}` and `{account_address}` are built-in
placeholders filled from the sending account (§10a), not slots. A message that uses it carries
`headerFrom: { "account": true }`. The attachment and the link are never slots: they are chosen only
with the Attach control and travel as `message.attachment` and `message.link` (§3).

- A template has an `id`, a `part` (`from`, `greeting`, `pretext`, `ask`), `text` with `{slot}`
  placeholders, `slots[]` and optional `implies[]`. A slot has an `id`, a `type` (§1) and optionally
  `about`. The options for a slot are the `provides` entries of held facts with the same `type` and
  `about` (an entry with no `about` matches any). Slot ids are unique within a target's template set.
- `implies[]` lists values a fixed-wording template carries, so a template with no blanks can still
  count. A fixed-wording template declares `implies` or it contributes nothing to `pretextRelevant`.
- Each target offers a template set: `templateSets: { from: [...], greeting: [...], pretext: [...],
  ask: [...] }` in its `04` record. Which templates exist for a target is authored; which options each
  blank shows is derived from held facts.
- The composed `message.slots` is a map of slot id to value id (§3).

### Judging by slot

- `addressedTo`: the `greeting` slot value is in the target's `addressedAs`.
- `pretextRelevant`: the values chosen in the `pretext` part (plus its `implies`) include at least
  `primedFor.minDistinct` entries of `primedFor.distinctiveValues`. Generic values and a `stale`
  value do not count.
- `attachmentPlausible`: the attachment pick's `kind` equals `primedFor.expectedAttachment`.
  `missing` when the target expects one and none is attached.
- `senderTrust`: from the `from` part. The name value's person and the address value's person (the
  `<person>` of `<person>_address`) are compared with `primedFor.trusts`. Both the same trusted person
  sets `claimedSender` and passes. A name that matches a trusted person while the address belongs to
  someone else, or to a freemail or unrelated domain, fails with state `mismatch` and
  `claimedSender = null`; the strings say which half was wrong. `trusts` ids resolve against
  `social.people` (cast, senders such as `portal`, and outside people). An open inbox (`hampshire`)
  lists `trusts: ["*"]`: any From passes `senderTrust` and `claimedSender` is `null`, including the
  forced `headerFrom: { account: true }` of `from_own`. With an account that cannot spoof (§10a), the
  header From is forced equal to the account, so only the account's own name can pass.
- `senderAuth` (advisory): derived from the real account and the header From (§2).
- `linkCredible`: passes when `message.linkInfo.meetsThreshold` is true; `linkInfo` is built from the
  saved landing-page record (§11a). The judge compares nothing else about the link.
- `urgencyCalibrated` (advisory): from the pretext template's authored `urgency` tag.

### Variables the engine writes before `on_email`

| ink VAR | type | value |
|---------|------|-------|
| `email_msg_id` | string | id of the sent message (for threading) |
| `email_landed` | bool | `EvalResult.landed` |
| `email_fail_count` | int | number of failed required factors |
| `email_first_fail` | string | id of the first failed required factor in library order, or `""` |
| `email_ok_senderTrust`, `email_ok_addressedTo`, `email_ok_pretextRelevant` | bool | per-factor pass |
| `email_attachment` | string | `"none"`, `"pass"`, `"missing"`, `"wrong-type"` |
| `email_link` | string | `"none"`, `"pass"`, `"fail"` |
| `email_claimed_sender` | string | `EvalResult.claimedSender` (e.g. `"baker"`) or `""` |
| `email_urgency` | string | advisory urgency read (`"low"`, `"medium"`, `"high"`) |
| `email_auth` | string | advisory senderAuth read (`"would-pass"`, `"would-fail"`) |
| `email_slot_<slotId>` | string | the value id chosen for each slot id in the target's templates (an undeclared VAR is skipped) |
| `email_slots` | string | all chosen slots as comma-separated `slotId=valueId` pairs (colon-free) |
| `email_template_<part>` | string | the template id chosen for each part |
| `email_account` | string | id of the real sending account (§10a) |
| `email_account_kind` | string | `"given"`, `"found"` or `"created"` |
| `email_account_domain` | string | domain of the sending account |
| `email_to` | string | which of the character's addresses the message used |

Each mail story declares the VARs it reads. Values are colon-free (§6). The validator checks that every
target with a `character` has an email-channel story with an `on_email` knot, and that it declares
the `VAR`s it uses and `VAR <character>_influence`. So the reply can say "the Q3 sheet" or react to a
stale fact by gating on `email_slot_document`.

**Run-scoped variables.** The `email_` set describes one send. The engine resets it to defaults after
each run and excludes the `email_` prefix from `recordInkVariables` / `exportNpcInkVariables`, so it
is never saved into a later run or sent to the server (S7).

### The mail runner

There is no engine-level headless runner today. The one precedent,
`PhoneChatConversation._preloadOpeningOnce`, runs only on an empty thread, observes no globals and
defers tags and globals to first open. The mail runner needs the opposite, and is specified here:

1. A fresh `InkEngine` per delivery (`systems/ink/ink-engine.js`), story loaded via
   `npcManager.storyCache` / `getInkEngine`.
2. Restore the record's saved scalar variables (`applySavedInkVariables`, keyed by the record id), then,
   if `mailState.threads["<key>"]` holds a position, load it with `story.state.LoadJson(position)`.
   `restoreNPCState` is not used: it reads the in-memory `conversationStates` map keyed by NPC id.
3. `syncGlobalVariablesToStory`, then attach `observeGlobalVariableChanges`.
4. Set the `email_*` variables with `setVariable` (after steps 2 and 3, §6).
5. `goToKnot('on_email')`, `continue()` until choices or the end, collecting text lines and tags.
6. Apply the tags at once through a **ui-less** mode of `processGameActionTags`: toasts are queued
   for the mail client (or shown as mailbox notifications) rather than popped over whatever overlay is
   open; `give_item` reads the record's `itemsHeld`, so the record must be loaded (S8).
7. Write the lines to the mailbox as one message; store the story position and any choices in
   `mailState.threads["<character>:<accountId>"]`; `recordInkVariables`; reset the `email_` set.

A thread position is stored separately from the phone and person positions, so a mail run never
overwrites a conversation that is open on another channel. Choices under a reply persist only when the
position is stored. The runner saves the position with `story.state.ToJson()` into
`mailState.threads["<character>:<accountId>"]`; `recordInkVariables` and `exportNpcInkVariables` see
only the record id, never the composite key.

### Sketch

```ink
VAR priya_influence = -20
EXTERNAL se_influence(delta, reason)
VAR email_landed = false
VAR email_first_fail = ""
VAR email_attachment = "none"

=== on_email ===
{ email_landed:
    Thanks Jed, opening it now.
    ~ se_influence(10, "senderTrust")
    #set_global:phish_pierce_landed:true
    -> DONE
}
{ email_first_fail:
- "senderTrust": Sorry, who is this? I don't recognise the address.
- "pretextRelevant": I'm not expecting anything like this.
- else: I'm not sure what this is.
}
{ email_attachment == "missing": You said you'd attach it, but there's nothing here. }
~ se_influence(-10, email_first_fail)
-> DONE
```

### Timing and delivery

Replies arrive after a delay: authored per character as `social.characters.<id>.emailReplyDelay`, an
integer number of **seconds of wall-clock countdown** (default 20). The lab sets 15 for all three of its
targets, Hampshire included (a data-only target authors it on the target); an awareness episode sets
its own on its attack target (5 to 8 seconds is the recommended range there, so a short episode does
not wait on a reply). The checklist does not wait; only the in-character reply does.

Delivery does **not** reuse `timedMessages`. That machinery delivers fixed text to a phone thread: it
needs a literal `text` at send time, ignores `targetKnot` for an NPC's own messages, treats `delay` as
milliseconds from game start for NPC-level entries, and persists through a server whitelist that
drops entries with empty text. A **mail scheduler** is new work (S9): a job record
`{ jobId, kind:"ink", character, npcId, accountId, msgId, vars:{email_*}, knot:"on_email", remainingMs }`, saved
in `mailState`, delivered by the runner above. It reuses the NPC manager's tick loop
(`_checkTimedMessages`) and its "NPC not registered yet, retry next tick" behaviour, but not its
payload or its sink. The countdown uses the wall clock; the time shown on the message uses
`gameClock`, as phone messages do (`gameTime`).

A job has one of two kinds. An **ink job** is the record above (`character`, `npcId`, `knot`,
`vars`). A **text job** serves a data-only target (no `character`, such as Hampshire):
`{ jobId, kind: "text", targetId, accountId, msgId, text, outcomeGlobal, remainingMs }`, where `text`
is the target's authored `replies.landed` or the canonical fail line for the first failed factor (§2)
and `outcomeGlobal` is the target's `outcome.setGlobal` key, set to true only when the message
landed. Delivering a text job appends the reply to the mailbox of `accountId`, then sets the global
through the shared writer. Both kinds use `emailReplyDelay` of the target (data-only targets may
author it on the target).

### Notification

The arrival signal is new work too: the bark and the phone badge (`updatePhoneBadge`) are phone-shaped,
and there is no workstation badge. Needed: a mail notification (HUD badge or a bark variant), a
message-list renderer, and a rule that the reply is appended without a bark when the mail client is
open (S9).

### What stays data, not ink

The **inbox-triage defender** (`05`) is content-driven: a fixed set of incoming messages with
authored truth, flags and notes. It stays data. No NPC story runs in triage.

### Open questions for the email→ink design

- Subject line: a template with blanks too, or ignored by the judge? Default: ignored by the judge,
  as today (`04` judges the body only).
- How many templates does a target offer, and how many blanks may one template carry?
- Are wrong but plausible blank values offered beyond the authored `stale` entries? Default: only held
  facts, a stale one included.
- Should the checklist wait for the reply in assessment mode, so the player reads the reaction first?
- One reply per send, or can the ink send a second, later message (a "chaser")?

---

## 10a. Email identity model (contract level)

The player has more than one email identity. The model separates **who really sent** from **who the
message claims to be from**.

```jsonc
"social": { "mailClient": {
  "accounts": [
    { "id": "guest",    "address": "guest@workstation",               "displayName": "Operator",
      "kind": "given",   "person": null,      "mailbox": "guest",    "spoofsFrom": true },
    { "id": "freemail", "kind": "created",    "person": null,         "unlockedBy": "acct_freemail",
      "mailbox": "freemail", "spoofsFrom": false,
      "createMenu": [ { "id": "nt1", "address": "northgate.test@freemail.example", "displayName": "N. Test" },
                      { "id": "nt2", "address": "n.assurance@freemail.example",    "displayName": "N. Assurance" } ] }
  ],
  "mailboxes": [ { "id": "guest" }, { "id": "freemail" } ]
} }
```

The lab ships exactly these two accounts. Only `guest` can spoof; `freemail` sends from its own
address (its From is forced), so it teaches that a look-alike outside address fails against a
company that publishes authentication. A **found** account is modelled but not shipped in the lab;
this example is for `04`'s test case and the Eldritch Hacker build, and adds an account and a mailbox:

```jsonc
{ "id": "jed_pc", "address": "j.baker@accountingnow.example", "displayName": "Jed Baker",
  "kind": "found", "person": "baker", "unlockedBy": "acct_jed_pc", "mailbox": "jed", "spoofsFrom": false }
```

- **Accounts.** `kind` is `given` (available from the start), `found` (credentials obtained by OSINT,
  a note, a password minigame or a dropped item) or `created` (the player picks an address from an
  authored menu). `unlockedBy` is the global `acct_<id>`, set by `applyActions` or a `#set_global`
  tag, so it saves with `globalVariables`. A `given` account has no `unlockedBy`.
- **`person` and domain.** `person` is the id of the `social.people` entry (§1) the account really
  belongs to, or `null` for the player's own accounts. The account's **domain** is the part of its
  address after `@`; it is derived, never authored. The example `jed_pc` is Jed's, so a message sent from it as
  `baker` is no deception; the `senderTrust` tell (04) compares `claimedSender` with `person`.
- **Creating an account.** A `created` account has no fixed address. Its `createMenu` lists the
  addresses the player may pick (a menu, never typed, in the style of `07`'s domain menu). The mail
  client shows a "Create account" entry in the switcher until `acct_<id>` is true. Picking a menu
  entry sets two declared globals through the shared writer: `acct_<id>_choice` (the menu entry id, a
  string) and `acct_<id>` (true). From then on the account's `address` and `displayName` are the
  chosen entry's. The lab's globals are `acct_freemail` and `acct_freemail_choice`.
- **Access.** A mail terminal carries `minigameData.accountIds: [...]`, the way a phone object
  carries `npcIds` (§11). The mail client opens on the first available account (or `defaultAccount`
  when the object names one) and shows an account switcher; unread counts are per mailbox.
- **A sent message separates two things.** `fromAccount` is the account really used; it fixes the
  envelope domain and `senderAuth`. `headerFrom` `{name, address}` is the claimed From, built from
  the From blanks (§10), and is free only when the account has `spoofsFrom`; otherwise it is forced
  equal to the account's own name and address. A From template with no blanks (`from_own`, §10) is
  the forced case: the message carries `headerFrom: { "account": true }` and the judge reads the
  account's own name and address.
- **Sender authentication follows the real account.** The domain of `fromAccount` is the envelope and
  signing domain; the domain of `headerFrom` is the visible one; the claimed domain's policy (§7)
  decides alignment. **Default:** when the two domains are equal the pair is aligned. A claimed domain
  with no `senderAuth` policy publishes nothing, so its read is `would-pass`. A found internal account
  can send as that person with authentication that passes; a freemail account spoofing the company
  would not.
- **Replies return to the real account's mailbox**, not to the spoofed party. In real life a reply to a
  spoofed From goes to that person, so a spoof-only attacker never sees the answer. The first slice
  routes to `fromAccount`, and the checklist says so once ("In real life this reply would go to Jed's
  inbox unless you set a reply-to"). An optional controlled reply-to slot is a later slice.
- **The ink is told.** `email_account`, `email_account_kind`, `email_account_domain`, `email_to` and
  `email_claimed_sender` (§10) let the reply branch on identity: a found internal account is trusted
  more than a freemail one, a spoof the NPC can check is caught.
- **Burned accounts.** The ink may set a global `burned_<accountId>` (via `#set_global`) when a
  character reports an address. The composer reads it and greys the account ("this address has been
  reported"). Influence stays per character, shared across identities.
- **Phones: later.** Multiple phones and a `caller_id` identity for calls (with per-identity claims
  the character accepts or catches) are future work for the Eldritch Hacker strand. In this plan
  there is one player voice on every phone, and the character's beliefs about who is speaking are not
  tracked per identity.

### The message record (persisted)

One record shape serves the inbox, the Sent folder, seeded mail and the triage reader. The mail
client stores it in `mailState.mailboxes[<mailboxId>].messages[]`.

```jsonc
{ "id": "msg_017", "thread": "pierce:guest",   // "<character>:<accountId>"; "<targetId>:<accountId>" for a data-only target
  "mailbox": "guest",                     // the mailbox holding this record (mailState.mailboxes[<id>])
  "folder": "sent",                       // "inbox" | "sent"
  "fromAccount": "guest",                 // the account really used (sent mail only)
  "from": { "name": "Jed Baker", "address": "j.baker@accountingnow.example" },   // the From as displayed
  "to": "m.pierce@accountingnow.example",
  "targetId": "pierce",                   // the phishTargets id, or null when the recipient is not a target
  "subject": "Q3 numbers",
  "templates": { "from": "from_named", "greeting": "greet_named", "pretext": "pretext_sheet", "ask": "ask_open_attached" },
  "slots": { "sender_name": "baker_full", "sender_address": "baker_address",
             "name": "pierce_short", "document": "balance_sheet", "when": "friday" },
  "body": "Hi Mel,\nHere is the Q3 balance sheet you wanted Friday. ...",   // rendered at send time and stored
  "attachment": { "kitId": "kit_balance_sheet", "kind": "spreadsheet" },     // or null
  "link": { "kitId": "kit_payroll_page", "pageId": "payroll_login", "domainId": "d_word" },   // or null
  "landed": true,                         // EvalResult.landed; null on inbox mail
  "tells": [ "senderTrust", "senderAuth" ],   // EvalResult.tells as ids, as sent; [] on inbox mail
  "time": "09:12", "gameTime": 543000,    // display clock string; numeric elapsed ms (phone convention)
  "read": true }
```

- **`body` is stored rendered.** The Sent view and the triage `playerSent` replay read `body`, so a
  later template edit cannot change what the player sent. `templates` and `slots` are stored for the
  judge, the report and the debrief. `link.domainId` is the 07 domain menu id the player picked,
  copied from the landing-page record at send time (§11a), so the triage reader can look it up.
- **Inbox mail** (a reply, seeded mail) has `folder: "inbox"`, `from` set to the sender, no
  `fromAccount`, `templates`, `slots` or `targetId`, `tells: []` and `landed: null`.
- **Authored messages** (seeded mail in `mailClient.seededMessages` and the messages inside a triage
  set) use the same field names, with the clock written as `time: "08:05"` and `unread: true`
  instead of `gameTime` and `read`; the loader normalises (`read = !unread`, `gameTime` from the
  game clock at load). They may add `links[]`, `attachments[]` and, for triage, `auth` and `truth`
  (05). Body text may hold `{{link:<id>}}` tokens that point into `links[]`.
- **The Sent folder is a decided feature.** Every send writes a record to the sending account's
  mailbox with `folder: "sent"`.

### `mailState`

```jsonc
"mailState": {
  "mailboxes": { "guest": { "messages": [ /* records */ ], "unread": 1 } },
  "jobs": [ /* mail scheduler jobs, §10 */ ],
  "threads": { "pierce:guest": { "position": { /* saved ink state */ }, "choices": [ ] } },   // key "<character>:<accountId>"; a data-only target has no entry
  "drafts": { "guest": { "to": "...", "subject": "...", "templates": { }, "slots": { },
                         "attachment": null, "link": null } },   // one per account; survives a nested launch
  "metrics": { "pierce": { "sent": 3, "failed": 2, "landed": 1, "firstTryLanded": false } }
}
```

- **Metrics.** On every send to a target the client increments `metrics[targetId].sent`, and
  `failed` or `landed` by `EvalResult.landed`; `firstTryLanded` is true when the first send to that
  target landed. The engine also writes the declared integer global `phish_<targetId>_attempts`
  (the same count as `sent`) so an ink story can branch on it. There are no `metric_*` globals; the
  engagement report (`10`) reads `mailState.metrics`, the sent records and the outcome globals.
- **Drafts live in `mailState`**, not in a global, so a nested launch (the page builder, the notes
  minigame) returns to a restored composer (§6 "Return to").
- **Caps** are the mail client's own constants, not the phone's (`MAX_PHONE_HISTORY_MESSAGES` 150 and
  `MAX_PHONE_STATE_BYTES` 512 KB in `game.rb`): 200 messages per mailbox, 4000 characters per body, 50
  jobs, one draft per account, and 1 MB for the whole `mailState`. Over a cap the sanitiser trims the
  oldest read inbox mail first, then the oldest sent mail. It never drops unread mail or a pending
  job; if that is not enough, the section is not saved. A delivery commits the message and removes its
  job in one write.
- **Persistence** is the new `mailState` section (S9). The client registers it in `state-sync.js`
  (`KEYED_SECTIONS` / `WHOLE_SECTIONS` and `confirm()`) and in the `flush()` allow-list so a
  `pagehide` inside the 30 s window keeps a delivered reply; the server accepts it in
  `merge_last_write_wins_sections` (so a stale request cannot overwrite it) with the caps above.
  Seeded messages carry `mailbox`.

### Triage (`05`)

The defender reader (`05`) reads the **inline `messages`** of its `triageSets` entry. A set has no
`mailbox` field. A `playerSent` entry uses the latest **sent** record to its `targetId` from any mailbox
**that has a non-empty `tells`** (landed or not). A later send with no tells, such as a retry from
`freemail`, does not shadow an earlier spoofed one, and a record with no tells is never replayed. The
entry reads the account from the record's `fromAccount`, the picked, rendered link and attachment from
the record's `link` and `attachment`, the `body` and the `tells` as sent, and the domain from
`link.domainId`. It is skipped only when no sent record to that target has tells. An optional
`fromMailbox` restricts the search to one mailbox; the lab omits it.

---

## 11. Where scenario data lives

All social-engineering data lives under **one top-level key, `social`**, so the validator learns one
name and the browser reads one object:

```jsonc
"social": {
  "intelFacts": { ... },      // §1
  "people": [ ... ],          // §1: the staff and sender directory
  "templates": { ... },       // §10
  "characters": { ... },      // §8, §9
  "mailClient": { "accounts": [...], "mailboxes": [...], "contacts": [...],
                  "seededMessages": [...], "payloadKit": [...] },   // §10a, 01
  "conceptCards": [ ... ],    // 02, 07: { id, title, text, image? }, plain-text teaching cards
  "osint": { ... },           // 02; a lookup's `unlockedBy` is { "visited": "<siteId>" | "<siteId.pageId>" } or { "fact": "<factId>" }
  "intelBoard": { "title": "...", "people": [...], "readinessSlots": { ... } },   // 03, §4
  "phishTargets": [ ... ],    // 04, §7
  "triageSets": [ ... ],      // 05; each set holds its own flagChips
  "landingPages": [ ... ],    // 07
  "pretextNpcs": [ ... ],     // 06
  "engagement": { ... },      // 10: scopeNote, scope, plan, defender, report
  "awarenessEpisode": { ... } // 11: present only in an awareness episode's scenario
}
```

**Contacts.** `mailClient.contacts[]` entries are `{ id, person, name, addresses[], role,
revealedBy, character?, targetId? }`. `person` is a `social.people` id. `revealedBy` is the
`se_intel_<id>` global that makes the contact appear in the To list. `character` names the
`social.characters` entry whose mail story replies. `targetId` joins the contact to a
`phishTargets` entry; the target's `address` must be one of the contact's `addresses`, and `email_to`
(§10) records which one the message used. Sending to a contact with no `targetId` is allowed: the
message is stored in Sent, is not judged and delivers nothing. The validator checks that every
`revealedBy` and every target's `addressedAs` source fact lies inside that target's readiness slots
(§4), so a card cannot read "Ready to approach" while the contact cannot be reached or addressed.

**Concept cards.** `social.conceptCards[]` entries are `{ id, title, text, image? }`: plain-text teaching
cards (`tool_hunter`, `tool_harvester`, `tool_recon`, `tool_exiftool` in `02`; `typo-squat`, `homograph`,
`padlock`, `hover-link`, `right-to-left` and `five-habits` in `07`). One shared card renderer shows
them (`02` N1, `07` N7). The landing-page brand lint (`07` §1) exempts the brand check on exactly the `text` field of these
entries, so a card may name a real service in prose to teach the classic look-alike. It never exempts a
domain: a host-shaped token in card text must still end `.example`, and no authored datum anywhere,
cards included, holds a real-brand domain (`five-habits` uses `accountingnow.example`).
The validator checks that every card id a doc or scenario references exists.

**Pointers.** An object carries only a pointer in `minigameData`. One object type has one entry in
`minigame-data-schemas.json`, and each new type needs a sprite `assets/objects/<type>.png` (the existing `phone` needs none):

| Object type | `minigameData` | Notes |
|-------------|----------------|-------|
| `mail_terminal` | `{ accountIds: [...], defaultAccount? }` | opens `mail-client`; a phone item may also list `accountIds` (Eldritch Hacker; no flow in the lab) |
| `osint-workstation` | `{ siteIds: [...] }` | ids from `social.osint.sites`; the workstation opens only those |
| `case-file` | `{ mode }` | one of `scope`, `plan`, `recon`, `defender`; one board object per mode, default `recon` |
| `triage-workstation` | `{ triageSetId }` | |
| `page-builder` | `{ landingPageId }` | |
| `phone` (existing type) / NPC with call data | `{ callId }` | ids from `social.pretextNpcs`. The `callId` branch in `systems/interactions.js` runs before the `npcIds` branch, checks the lockout (§8) and then opens `pretext-prep`; no new sprite, and a schema entry for the `callId` pointer. **Which record opens:** `pretextNpcs[callId].character` names the `social.characters` entry; a `phone` object opens that character's `channels.phone` record in `phone-chat`, and an NPC sprite opens `channels.person` in `person-chat` and carries `callId` as a top-level NPC field (add it to the NPC schema), which `pretext-prep` reads |
| `report-workstation` | none | reads `social.engagement` |
| `kiosk` | `{ episodeId }` | opens the episode runner (11) |

`mode` is the pointer's one name everywhere. A nested launch passes the child's parameters in the
call (`mode`, `targetId`, `landingPageId`), not through the object (§6 "Return to").

**Engagement mode blocks.** Each of `scope`, `plan`, `defender` and `report` in `social.engagement` has
`onCompleteGlobal` (set through the shared writer on the false-to-true flip, when every step is
done) and an optional `steps[]` of `{ id, onCompleteGlobal }`, each set when that step is done. A task
therefore completes on its own global. **Step binding.** Every sorting card, question card and pick
carries `step: <stepId>`, a step id in the same block. A step is done when every item carrying that
step id is answered correctly (a card placed in its right pile, a question answered with a `correct`
option, a multi-select pick with every `correct: true` item chosen and no `correct: false` one); the
block global is set when all its steps are done. A block with no `steps[]` is done when all its items
are correct. The lab's values:

| Block | Block global | Step globals |
|-------|--------------|--------------|
| `scope` | `roe_signed` | `roe_scope_done` (sort the scope cards), `roe_stoprule_done` (the stop-rule question) |
| `plan` | `plan_done` | `plan_objective_done` (the objectives pick), `plan_measures_done` (the success-measures pick) |
| `defender` | `profile_done` | none |
| `report` | `report_filed` | `report_results_done`, `report_findings_done` |

Completion per mode: `scope` when every sorting card is placed correctly and every question card
(`kind: "question"`, options `{id, text, correct, why}`) is answered; `plan` when the picks of each step the block declares are correct (the lab has two, objectives and
measures; the targets are the scope cards, not a pick); `defender` when each fact in `engagement.defender.factMitigations`
has a `good` option chosen. `defender` has no indicators step unless `engagement.defender.indicators`
is authored (off by default). `factMitigations` is `[ { intel, options: [ { id, text, good, why } ] } ]`
and lives only in `engagement`; `intelBoard` holds the title, `people` (ids) and `readinessSlots`.
`scopeNote` lives in `engagement`.

**Globals the scenario owns.** All are declared in `globalVariables`.

| Global | Set by, and where | Notes |
|--------|-------------------|-------|
| `se_intel_<id>` | `grantFact` (OSINT or a call grant) | boolean, default false (§5) |
| `target_ready_<id>` (one per `phishTargets` id) | `evaluateReadiness`, run from `grantFact` after every grant | boolean; set where the facts are granted, so the board need not be opened (§4) |
| `osint_done` | `evaluateReadiness`, when every id in `intelBoard.people` is ready | boolean |
| `phish_<id>_landed` | the target's `on_email` ink, or the text job for a data-only target, at reply delivery | boolean; one owner per target (04) |
| `phish_<id>_attempts` | the mail client, on each send | integer |
| `acct_<id>`, `acct_<id>_choice`, `burned_<id>` | account unlock, creation, ink | §10a |
| `landing_<pageId>_built`, `landing_<pageId>_domain` | the page builder, on attach | boolean; domain option id (§11a) |
| engagement block and step globals | the board modes, the report builder | table above |
| `<character>_influence`, `_latched`, `_lockout_until`, `_lockout_channel` | the influence service, ink | §8 |
| `pretext_call_done` (a lab-owned name) | the `grants.setGlobal` of any Dev ask | boolean; set by the first ask that grants, whatever the call's ending (`06` §4.8) |
| `pretext_<callId>_outcome`, `_lowest`, `_state` | the pretext session | `06` §6 (outcome precedence: `reported`, else `got_it` if any ask granted in the call, else `walked_away`). A call can be reopened: `_outcome` and `_lowest` hold the latest call, per-ask grants accumulate |
| `<prefix>percent`, `<prefix>reportRate`, `<prefix>done`, `<prefix>pass` | the triage starter | the set's `setGlobalPrefix` (05) |
| `se_osint_state`, `se_board_state`, `se_landing_pages`, `episode_<id>_state` | their minigames | object-valued, default `{}` |

**Missions that carry a score (check missions, `11`).** A mission whose result another mission reads
through `exportGlobals` must conclude, because the carry-over reads only concluded games. Each such
mission has one aim with `missionConclusion: true` whose task completes on the triage completion
global (`triage_pre_done`, `triage_post_done`), with `concludeRequires: { "globals": [...] }` naming
the same global, so a game that ends without a finished round exports nothing. The exporting scenario
declares the `<setGlobalPrefix>` names; the validator accepts them as written by the triage starter.
Shell rules for these missions and for the awareness episode shells:

- **A host NPC completes the tasks.** `eventMappings` live on NPC records and a global cannot complete
  a task by itself, so every check or episode shell includes a host NPC (for example a receptionist at
  the kiosk) whose `eventMappings` entry on `global_variable_changed:<done global>` runs `completeTask`.
- **Flush before the done event.** `concludeRequires` reads the server's `player_state`, and client
  globals reach it only on the 30 s sync or `pagehide`. The triage starter therefore writes its globals
  and `await`s `window.stateSync.sync()` before it emits the done event, so the task's POST finds the
  gate met and the exported values current. The unflushed case must not be possible.
- **Names that cannot collide.** Each check mission keys its task on its own stage's done global
  (`triage_pre_done` in the pre mission, `triage_post_done` in the post mission). The pre mission declares
  `triage_pre_*` in `globalVariables`; the post mission declares `triage_post_*` and imports `triage_pre_*`
  under those names. The validator declares the prefix globals only for the stage the mission's kiosk
  launches, and skips any name the mission imports, so an import never collides with an own declaration.
- **Every episode shell scores.** An episode shell has at least one aim (`missionConclusion: true`)
  with a task that completes on the episode's defend-set done global, using the rules above, so
  Hacktivity's task and aim share (`game.rb` scores 0 when a mission has no tasks) exists for it.

**Object-valued state globals** hold ids only and stay small (the 60 KB `pagehide` flush shares one
budget with every global). A call's tells log keeps the last 40 entries. Mail is not stored this way;
it lives in `mailState`.

### 11a. The landing-page record and how it reaches the judge

The builder (`07`) persists one record per built page in `globalVariables.se_landing_pages[<pageId>]`
and sets `landing_<pageId>_built` and `landing_<pageId>_domain` when the page is attached:

```jsonc
{ "pageId": "payroll_login", "targetId": "lord",
  "choices": { "brand": "accountingnow", "purpose": "payslip", "domainId": "d_word", "logo": "crisp",
               "wording": "w_formal", "fields": ["email","password"], "padlock": true },
  "credibility": 87, "gatesPassed": true, "meetsThreshold": true,
  "tellsFound": ["formOrigin","hoverMismatch"],
  "victim": { "visited": true, "submitted": true, "noticed": false },
  "built": true }
```

`targetId` is a key of the page's `targets` map (the lab's page has exactly one, `lord`; a page has at
least one, and the validator checks it). The builder can be launched only for a target in that map: it
refuses any other `targetId`, and the composer offers "build/attach page" only for such targets, so
`linkThreshold` and `minDomainTier` are always defined. `meetsThreshold` is computed by `07`'s model
as `credibility >= targets[targetId].linkThreshold && gatesPassed`. A page can be attached below the
threshold ("attach anyway"); `built` is true either way. `victim` is written on **every send that
carries the page**, landed or not: `01` calls `describeVictimOutcome(record, target, landed)` and
stores the result through `betterVictim(old, new)`, which keeps the best outcome. Outcomes rank
`submitted` > `noticed` > nothing; the first send always writes, and a later send replaces the stored
value only if its outcome ranks at least as high. A later send that does not land, or that is noticed,
therefore never overwrites an earlier success, and the report reads the same stored value. A page that meets its threshold and whose email landed gives `visited` and
`submitted`; a page below its threshold gives `visited` and `noticed` (landed or not); a page that meets
its threshold but whose email did not land gives nothing, because the message never reached the
target. This keeps the noticed branch and the defender inspection reachable after "attach anyway". When the composer returns from the builder it re-attaches the link on the page record's `built` flag (the record is the truth; the `landing_<pageId>_built` global stays true after a first attach). The page definition carries an authored
`linkText` (the address the mail client shows for the link, for example `accountingnow.example/payroll`)
that the hover-mismatch lesson contrasts with the real domain; the player does not write it.

**One link id per page.** The payload-kit item for a page is `kit_payroll_page`, with
`landingPageId: "payroll_login"`; the same id is `message.link`, the sent record's `link.kitId` and
the page-record lookup key. This is the only link id.

**How the judge receives it.** `evaluateMessage` is pure and reads no globals (§3). When `message.link`
is set, the mail client resolves the kit item to the page record and fills `message.linkInfo`
from `07`'s `linkInfoFor(record, pageDef, kitId)`:
`{ kitId, pageId, domainId, domain, credibility, gatesPassed, meetsThreshold }`, or `{ kitId, state:
"missing" }` when no record exists or its `built` is false. `domain` is the chosen domain option's
`browserDomain` when it has one, otherwise its `domain`, read from the page definition. `linkCredible` passes when `linkInfo.meetsThreshold` is true;
state `missing` fails with "there's no page behind that link". The `linkCredible` tell is present when
`linkInfo.domain` is set and differs from `target.expectedLink.realDomain`, whether or not the page
convinced; a `missing` link has no domain and raises no tell.

---

## 12. Engine work owned by this doc

Items other docs depend on. Each has a code location. The consolidated cross-doc list is in the README.

| # | Item | Where in code |
|---|------|---------------|
| S1 | Bind the social externals (`se_influence`, `pretext_say`, `pretext_ask`) once inside `InkEngine`, with no-op defaults (return 0) when no session is active. Every loader gets them, including the phone preload, the bark path and dry runs. Add stubs to the ink tooling | `systems/ink/ink-engine.js` (`bindExternalFunction`); loaders `person-chat-conversation.js`, `phone-chat-conversation.js` (`_preloadOpeningOnce`, `resolveEntryKnot`), `npc-manager.js` bark path; stubs in `scripts/ink_runtime_check/voicelines.mjs`, `inkcheck.js`, `reopencheck.mjs` |
| S2 | Display-name resolution prefers the conversation's own NPC on a tie | `npc-manager.js` speaker/name lookup |
| S3 | A shared global writer: write `gameState.globalVariables`, `broadcastGlobalVariableChange`, emit `global_variable_changed`. The writer takes an `emitAlways` option. `grantFact` and the social paths (influence, pretext, threshold effects, step globals) emit **only on a change**; `applyActions` `set_global` uses the writer with `emitAlways`, so it keeps emitting on every call exactly as today (about 20 shipped scenarios use `global_variable_changed` in `eventMappings` or tasks, and some may re-set a value to re-fire a mapping). The only new behaviour for `applyActions` is the broadcast to cached stories, which writes a value only into stories that already declare that variable. For a **social influence global** it also writes the value into the **calling story** (its `InkEngine`, via `setDeclaredVariable` with the observer detached, as `broadcastGlobalVariableChange` does) and writes the clamped value back to the source story when ink wrote out of range, so a later ink assignment starts from the engine's value | `systems/apply-actions.js` `set_global`; `systems/npc-conversation-state.js` (`broadcastGlobalVariableChange`, observer); pattern in `objectives-manager.js`, `inventory.js` |
| S4 | The influence bar: a new DOM component for person-chat, phone-chat, the mail pane and the board's influence section, reading the global and the thresholds. Not an extension of the world-space health bar | new; `person-chat-ui.js`, `phone-chat-ui.js`; not `npc-health-bar.js` |
| S5 | The social influence service: the watcher on the influence global, the write path behind `se_influence` and the pretext functions (S3's calling-story write included), threshold effects and the latch, the forced `report(character, reason)` path (§8), the `npc_influence_changed` event, the listener for `npc-influence-change`, and the `#influence_gained/lost[:reason]` and `#report:<reason>` tags for social characters in the shared tag processor and in phone-chat. The idempotency ledger is scoped per run (§8) | new `systems/social-influence.js`; `chat-helpers.js` `processGameActionTags`; `phone-chat-conversation.js` `processTags`; `person-chat-conversation.js` |
| S6 | The mail runner (§10), doing the loader's sync steps in order, with a fresh idempotency ledger per run | new; modelled on `phone-chat-conversation.js` `_preloadOpeningOnce` |
| S7 | Exclude the `email_` prefix from `recordInkVariables` / `exportNpcInkVariables`; set engine-written variables after restore and sync in every loader | `systems/npc-conversation-state.js`; `person-chat-minigame.js` (restore then sync), `phone-chat-minigame.js` |
| S8 | Register headless email records at game start from `social.characters.*.emailRecord` and make every lookup that today searches only `rooms.*.npcs` search them too: the client registration, the ink endpoint, `find_npc_in_scenario`, which `game.rb` defines twice (645 and 1281; Ruby keeps the later one, so keep one and make it the helper), the NPC item validation behind `#give_item`, `scenario_npc_ids` (`game.rb` 1817), and the validator's phone checks (`validate_scenario.rb` 2345-2350 for `phoneId`, 1110 and 2583 for the phone `storyPath` compile). Prefer one helper (`scenario_npc_records`) that returns room NPCs plus headless records | `systems/npc-lazy-loader.js`; `core/game.js` start-room registration; `games_controller.rb` ink lookup (1966-1984); `app/models/break_escape/game.rb`; `scripts/validate_scenario.rb` |
| S9 | Mail scheduler, `mailState` persistence (§10a), notification and the message-list renderer | `npc-manager.js` tick loop; `state-sync.js` `buildPlayerSections`, `KEYED_SECTIONS`/`WHOLE_SECTIONS`, `confirm()`, `flush()`; `games_controller.rb` `merge_last_write_wins_sections`, bootstrap; `game.rb` `merge_phone_state!` as the model; `core/game.js` restore |
| S10 | The lockout: stored in the declared globals `<character>_lockout_until` and `<character>_lockout_channel` (§8), so it rides `globalVariables` persistence and needs no server section. The check on person-chat, phone-chat, mail and the `callId` starter (refuse before `pretext-prep` opens, so a locked-out student never fills in a pretext card first), and the lift (which writes `recoverTo` silently, clears the latch and the band flags) | `systems/interactions.js` NPC sprite branch and the `phone` `callId` branch; `systems/social-influence.js`; `phone-chat` and mail entry points |
| S11 | Validator and schema: the top-level `social` key; the `social.characters` lints (synced vars declared, `VAR`s match, lockout has an expiry or a route, thresholds ordered, `recoverTo >= highest effect threshold at + rearmMargin`, `clearOnRearm` only on booleans, a `reports` threshold on any character with call data, lockout globals declared); the `se_intel_*` declaration; template/slot checks; `on_email` and `email_*` VAR checks; contact and readiness consistency (§11); `minigame-data-schemas.json` entries; no `intel_*` rule applied to other missions. A **social-lint mode**: `--strict-social` makes the validator exit 1 on any social lint error (today only schema errors and ink compile errors exit non-zero; findings from the `check_*` functions are printed and the run exits 0). The landing-page lint and the JS unit tests run in CI as one job with both runtimes: `ruby/setup-ruby` (the repo's Ruby version, `bundler-cache`), `actions/setup-node`, `npm ci`, `node --test test/js/validator-*.test.mjs` (the tests fail, not skip, under CI when Ruby or the gem is missing), then a loop of `bundle exec` validator runs over **only the scenarios that carry a `social` key** with `--strict-social --no-graph`, then `git diff --exit-code` to prove no tracked file was rewritten (ink output and graphs go outside the tree or are skipped). The landing-page lint tests the **hostname only** for the `.example` suffix (strip any scheme and everything from the first `/`; paths are allowed), runs the allowlist on the **raw labels first**, then folds and matches the denylist; it also checks that each page has at least one `targets` key (exactly one in the lab) | `scripts/validate_scenario.rb` `known_top_level` and the `npcType` branches; `scripts/scenario-schema.json`; `scripts/minigame-data-schemas.json`; `scripts/ink_runtime_check/`; `.github/workflows/ci.yml` |
| S12 | **Return to.** `startMinigame(scene, container, { returnTo: { sceneType, params }, ... })`: `endMinigame` calls `returnTo` after `onComplete`, on a normal exit only. A parent that launches a child sets `suspended: true` in its params so its `onComplete` ignores the `onComplete(false, null)` that `startMinigame` fires when it ends the running minigame. The launcher passes the child's required parameters in the call. The parent saves its draft first (mail: `mailState.drafts`; OSINT and board: their `se_*_state` globals) | `minigames/framework/minigame-manager.js` (`startMinigame`, `endMinigame`); `base-minigame.js` |

Back-compat checklist for any of these changes: `applyActions` `set_global` still emits `global_variable_changed` on every call, same value or not (audit the shipped scenarios that map on it); m01 Derek (`#hostile` plus `#influence:-100`) still
fights; m02 guards and ward nurse are not turned hostile by ink arithmetic; m04 Vance and m05
Patricia pairs need no change; `neye-eve.json` is untouched; a story with none of the new externals
or variables loads with no warning; a story that declares the new externals loads from the phone
preload, the bark path and a dry run.

---

## 13. Settled values, in one place

Values several docs must match. The section column names the 00 section that defines the value, or
the owning doc where 00 only lists it (marked by its number); this table is the one place in 00 that
lists the triage sizes and the domain ids.

| Value | Settled as | Section |
|-------|-----------|---------|
| Link id of a built page | `kit_payroll_page` (kit item) with `landingPageId: "payroll_login"` | 11a |
| Landing-page globals | `landing_payroll_login_built` (bool), `landing_payroll_login_domain` (domain option id) | 11a |
| Landing-page menu | six domain ids (`d_unrelated`, `d_letter`, `d_word`, `d_sub`, `d_vv`, `d_homo`) in the student profile; `05` `playerSentAuth` has a row for every one and for each lab account (`guest`, `freemail`; the `freemail` row passes DMARC because it cannot spoof) | 07, 05 |
| Triage set size, by audience | awareness pre/post 10; student lab 8 (6 authored plus 2 `playerSent`); awareness-episode defend sets 5 to 8; Eldritch Hacker 3 to 5 | 05 |
| Non-email triage kinds | `voicemail`, `sms`, `qr`, `page`, `call`, `push` (all exist in `05`; `push` scores Approve as Trust, Deny as Delete, Deny and report as Report, tell `unrequested_mfa_push`) | 05 |
| Triage global prefix | `outcome.setGlobalPrefix`, with a `{stage}` token for staged sets (`triage_{stage}_`, awareness). The lab's set uses the literal prefix `triage_` (stage `mission`, `passPercent: 60`), so its globals are `triage_percent`, `triage_reportRate`, `triage_done` and `triage_pass` | 05 |
| Red-flag meter | per-target `redFlagMeter` boolean; absent takes `mailClient.showRedFlagMeter` | 04 |
| Lab accounts | `guest` (spoofs) and `freemail` (created, `spoofsFrom: false`); no `jed_pc` | 10a |
| `playerSent` | latest **sent** record to the target from any mailbox **that has tells** (account from `fromAccount`, domain from `link.domainId`), landed or not; a tell-less later send does not shadow it; `domainFrom: "landing_domain"` on a `playerSent` entry only; authored messages carry literal auth rows | 10a |
| Board pointer | `mode` (one board object per mode) | 11 |
| Call pointer | `callId` on the existing `phone` type (branch before `npcIds`); no new sprite | 11 |
| Mode completion | block `onCompleteGlobal`, optional step globals (names in §11) | 11 |
| Readiness globals | `target_ready_<id>`, `osint_done`, set by `evaluateReadiness` from `grantFact` | 11, 4 |
| Reply-delay unit and value | `emailReplyDelay` in seconds of wall-clock countdown; 15 for Pierce, Lord and Hampshire | 8, 10 |
| Sender-auth policy | `senderAuth: { domainPublishesAuth, spoofAligns, dmarcPolicy: none \| quarantine \| reject }`; Pierce's `factorStrings.senderAuth` carries the `p=none` line; Hampshire authors the `pass` side, Lord uses the derived sentence, and any factor a target leaves out uses the §2 canonical string | 2, 7 |
| Missing evidence | an empty blank (or a missing `requiresIntelToAttempt` fact) blocks Send; neutral line "A blank needs evidence you haven't found yet" (defined in `04`) | 10 |
| Band flags | `setGlobal` boolean with `clearOnRearm: true`, recomputed on every influence change, cleared at `at + rearmMargin` or above; ink branches on the returned band | 8 |
| `recoverTo` rule | `recoverTo >= highest effect-threshold at + rearmMargin`; Dev and Priya -30 | 8 |
| Lockout storage | globals `<character>_lockout_until`, `_lockout_channel`; no server section; checked before `pretext-prep` | 8, S10 |
| Step binding | each card, pick and question carries `step`; step done when all its items are correct; block global when all steps are done | 11 |
| Plan mode | two picks (objectives, measures), globals `plan_objective_done`, `plan_measures_done` | 11 |
| Reopened calls | a call can be reopened after any outcome while asks remain; `pretext_<callId>_outcome` and `_lowest` hold the latest call; grants accumulate | 06 |
| Victim record | written on every send carrying the page, keeping the best outcome (`betterVictim`: submitted > noticed > nothing; a later send replaces it only if ranked at least as high), per 11a | 11a |
| Check missions | `missionConclusion` aim gated on the triage completion global | 11 |
| CI validator loop | one job with Ruby (bundler-cache) and Node; `--strict-social --no-graph` over scenarios with a `social` key; Node tests fail rather than skip; `git diff --exit-code` | S11 |
| Concept cards | `social.conceptCards[] { id, title, text, image? }`; brand exemption on `text` only, host-shaped tokens still end `.example`; no real-brand domains in authored data | 11 |
| Defender facts | exactly four with a `reduceNote`: `email_pattern`, `username_convention`, `lord_portal`, `hampshire_careers` | 1 |
| Call outcome | `reported`, else `got_it` if any ask granted in the call, else `walked_away`; `pretext_call_done` set by any granting ask | 06 |
| Band numbers | by threshold id: `wary` 1, `refuses` 2, `reports` 3, `lockout` 4, else 0 | 8 |
| Builder targets | the builder launches only for a target in the page's `targets` map (one in the lab) | 11a |
| `applyActions` emit | `set_global` keeps emitting on every call; change-only emission is for `grantFact` and the social paths | S3 |
| Check and episode shells | a host NPC completes the tasks; the starter awaits `stateSync.sync()` before the done event; every episode shell has an aim | 11 |
| Lockout clock | real elapsed minutes from `gameClock.elapsedMs()`, stored in `<character>_lockout_until` | 8 |
| `email_pattern` source | the Hunter lookup result `r_pattern` | 1 |
| Sans-serif | Atkinson Hyperlegible (Regular and Bold), SIL OFL 1.1, bundled | 6 |
| Thread key | `"<character>:<accountId>"`; `"<targetId>:<accountId>"` for a data-only target (no `threads` entry written) | 10a |
| Created account | `createMenu`; `acct_<id>` and `acct_<id>_choice` | 10a |
| Forced From | template `from_own`, `headerFrom: { account: true }` | 10, 10a |
