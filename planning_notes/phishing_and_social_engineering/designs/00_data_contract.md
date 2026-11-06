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

## 1. Canonical example dataset — "Ledgerwell"

One fictional company used in every worked example, so the recon→phish chain can be followed end
to end. The engagement is authorised by the fictional client and run by the fictional consultancy
**Tarnside Assurance** (as in `10_lab_social_engineering.md`). All domains end `.example`; all
people are fictional.

### Cast and directory (every entry carries a stable `id`, the join key for 03's people cards and for blank values)

| id | Name | Role | Address | Notes |
|----|------|------|---------|-------|
| `pierce` | Melanie Pierce | Finance | m.pierce@ledgerwell.example | flagship spear-phish target |
| `baker` | Jed Baker | Finance (Melanie's colleague) | j.baker@ledgerwell.example | the trusted sender to spoof |
| `hampshire` | Chris Hampshire | Careers/HR | careers@ledgerwell.example | easy target (open careers inbox) |
| `lord` | Sofia Lord | Intern | s.lord@ledgerwell.example | hard target (needs link + pretext) |
| `portal` | Ledgerwell Payroll Portal | non-cast sender | payroll-notices@ledgerwell.example | Lord's trusted sender; known only after the call |
| `leeds_baker` | J. Baker | outside the company | j.baker@leedsplumbing.example | the namesake the name search returns; a decoy |

The table is also data. `social.people` is the machine-readable directory every id above resolves
against (name forms, `primedFor.trusts`, `social.mailClient.accounts[].person`, contacts, the board's people
cards, the `<person>_address` values):

```jsonc
"people": [
  { "id": "pierce", "kind": "cast", "address": "m.pierce@ledgerwell.example",
    "forms": { "first": "Melanie", "short": "Mel", "formal": "Ms Pierce", "full": "Melanie Pierce" } },
  { "id": "baker",  "kind": "cast", "address": "j.baker@ledgerwell.example",
    "forms": { "first": "Jed", "full": "Jed Baker" } },
  { "id": "hampshire", "kind": "cast", "address": "careers@ledgerwell.example",
    "forms": { "full": "Chris Hampshire" } },
  { "id": "lord",   "kind": "cast", "address": "s.lord@ledgerwell.example",
    "forms": { "first": "Sofia", "full": "Sofia Lord" } },
  { "id": "portal", "kind": "sender", "address": "payroll-notices@ledgerwell.example",
    "forms": { "full": "Ledgerwell Payroll Portal" } },
  { "id": "leeds_baker", "kind": "outside", "address": "j.baker@leedsplumbing.example",
    "forms": { "full": "J. Baker" } }
]
```

`kind` is `cast` (staff the player can meet or read about), `sender` (a non-person sender such as the
portal) or `outside` (a decoy outside the company). `trusts` ids in `04` resolve against this list, so
`portal` is valid. The validator checks that every `<person>_<form>` value in `intelFacts` names a
person and form that exist here, and that every `<person>_address` resolves to an `address`.

An optional `avatar` on a person names the headshot the board's people card and the mail reader show
for them (the key of an `assets/characters/<avatar>.png`, aligned with the `02` N6 headshot
convention; `hampshire_headshot` for Chris). It is optional: with none, the card and reader fall back
to the default icon. A seeded message's `from` (§10a) takes the same optional `avatar` key, naming the
icon shown beside that sender in the inbox.

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
a metadata field, a mail highlight (§10a), or, for call facts, the ask id. The ids below are the lab's (`02` owns the pages).

| fact id | Source element | Fact | Backs factor (§4) |
|---------|----------------|------|-------------------|
| `email_pattern` | `r_pattern`: the Hunter lookup result (the team page also shows the addresses; seeing them grants nothing) | first-initial.surname@ledgerwell.example | senderTrust (compose any address) |
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
    "text": "Staff addresses are first-initial.surname@ledgerwell.example.",
    "subject": "company", "source": "r_pattern",
    "provides": [
      { "type": "address", "rule": "initial.surname@ledgerwell.example", "label": "an address built from the pattern" }
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
| `email_pattern` | company | `address` rule `initial.surname@ledgerwell.example` "an address built from the pattern" |
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
| `lord_trusts_portal_sender` | lord | `name`/sender `portal_full` "Ledgerwell Payroll Portal" distinctive; `address` fixed `portal_address` "payroll-notices@ledgerwell.example" distinctive |
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
| `linkCredible` | required if the target has an `expectedLink` (§7); otherwise evaluated only when a link is attached | `message.linkInfo.meetsThreshold` is true: the built page's credibility reaches the target's threshold and its gates pass (§11a; scored by 07). State `missing` when the send carries no link, or the kit item has no built page. A target with an `expectedLink` therefore cannot land without a page | "Link destination doesn't match the real site (look-alike domain)" |

**Red-flag resolution:** a factor's `redFlag` in an `EvalResult` (§3) is the per-target override
from `factorStrings` when the author set one, **otherwise the canonical string above**. In a
per-target `factorStrings` entry, `pass`, `fail` and `redFlag` are each optional, and an absent key or a
`null` means "use the canonical string", never an empty string, so `01`'s checklist and `05`'s chips
always have a label. The validator warns only when an entry supplies its own `fail` string and omits the
`redFlag` key entirely, since a new reply may name a different tell from the canonical flag;
`redFlag: null` records that the author deliberately supplies no override and raises no warning (S11, `04`
"Scenario-authored data").

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

### The open check (a gate, not a factor)

A message has to be opened before its content matters. The open check sits beside the seven factors and
is not one of them. It reads the two things a person sees in a message list, the From and the Subject.

- A target has `interests: { topics: [...] }` (§7): the subject topics it opens whatever else is true.
  Each entry of the target's `subjects[]` carries a `topic` (§7).
- The message **opens** when the sender passes `senderTrust` (the target recognises who the message
  claims to be from; an open inbox trusts every sender) **or** the chosen subject's `topic` is in
  `interests.topics`. A stranger therefore needs a subject the target cares about, and a convincing
  sender gets the message opened whatever the subject says.
- `EvalResult.open` is `{ opened, via, subjectTopic }`, with `via` one of `"sender"`, `"subject"` or
  `"none"`. `landed` needs `opened` as well as every required factor. All factors are still evaluated
  when the message is not opened, so the checklist shows the whole picture.
- The checklist's first row is "Would they open it?", with the strings `factorStrings.open`
  `{ pass, fail }` (a target may override them). Canonical `pass`: "✓ They would open it". Canonical
  `fail`: "Nothing about the sender or the subject made them open it". Any in-character explanation
  comes from the ink (§10), not from this row.
- It is neither a tell nor a defender chip: `05` teaches the seven factors and the channel tells.

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
both sides (the `fail` side is the `p=none` line) and Hampshire authors the `pass` side only ("Sent as your own
address, so there is nothing to spoof and nothing to fail."; her From is forced to the account, so the
read is always `would-pass` and a `fail` string could never show); Lord uses the derived
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
| `enable_content_prompt` | malicious document | "A document asks you to enable editing or content before it will show anything" | defend-only (E2) |

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
  "subject": "s_review",                // id of the chosen entry in the target's subjects list (§7)
  "headerFrom": { "name": "baker_full", "address": "baker_address" },   // value ids from the From blanks
  "templates": { "greeting": "greet_named", "pretext": "pretext_sheet", "ask": "ask_open_attached" },
  "slots": { "name": "pierce_short", "document": "balance_sheet", "when": "friday" },
  "attachment": "kit_balance_sheet",    // payload-kit item id (the Attach control; never a slot)
  "link": null,                         // payload-kit item id, e.g. "kit_payroll_page"
  "linkInfo": null }                    // filled by 01 from the saved page record when link is set (§11a)
```

A blank-free From (`from_own`) sends `"headerFrom": { "account": true }` instead of value ids (§10a).
`linkInfo`, when `link` is set, is `{ kitId, pageId, domainId, domain, browserDomain?, credibility,
gatesPassed, meetsThreshold }` or `{ kitId, state: "missing" }`, the same shape as §11a: `domain` as typed
and `browserDomain` (the punycode form) only for a homograph option.

```jsonc
// EvalResult
{
  "landed": true,                       // opened (§2) and all REQUIRED factors passed
  "open": { "opened": true, "via": "sender", "subjectTopic": "finance" },   // §2 "The open check"
  "factors": [                          // one entry per evaluated factor
    { "id": "senderTrust", "pass": true,  "state": "pass",
      "reply": null, "redFlag": null, "mode": "required" },
    { "id": "senderAuth", "pass": false, "state": "would-fail",
      "reply": null, "redFlag": "Fails sender authentication (SPF/DKIM/DMARC) — the domain didn't really send this",
      "mode": "advisory" }
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

The judge is deterministic and has no numeric quality score. No part of the game calls a language
model (§7).

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
  "hampshire": [
    { "label": "Where mail goes", "needsIntel": ["hampshire_careers"],
      "goalString": "You still don't know how Chris receives mail from strangers.",
      "doneString": "The careers inbox accepts CVs from anyone." },
    { "label": "What the file should be", "needsIntel": ["careers_attachment"],
      "goalString": "You still don't know what kind of file Chris will open.",
      "doneString": "Chris takes .odt and .docx files." },
    { "label": "Why she would read it", "needsIntel": ["hampshire_cv_backlog"],
      "goalString": "You still don't know what Chris is busy with.",
      "doneString": "Chris is behind on CVs before Friday." }
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
  (`ink-engine.js`) is used in `phone-chat-conversation.js` (`setupExternalFunctions`), which binds the
  six read-only context functions. The live person-chat minigame builds its own `InkEngine`
  (`person-chat-minigame.js`) and reuses `PhoneChatConversation` for its story, so both chats share
  that one binding site. (`person-chat-conversation.js` is not imported by anything; do not edit it.) "Proven" applies to the binding mechanism only;
  none of the six has a side effect. A story that declares an `EXTERNAL` that the loader running it
  has not bound throws at the first `Continue()`, for the whole story, even if the running knot never
  calls it. Stories are also run by other loaders: the phone intro preload
  (`PhoneChatConversation._preloadOpeningOnce`), the entry-knot dry runs (`resolveEntryKnot`), the bark
  path (`npc-manager.js`, a bare `InkEngine` with no bindings), and the mail runner (§10). So
  `InkEngine.loadStory` turns on `allowExternalFunctionFallbacks`, every new `EXTERNAL` carries an ink-side
  fallback function, and a lint checks it (engine item S1, §12). Turning the flag on alone is not enough:
  an unbound external with no fallback function still throws.
  The wrapper forwards only `(name, func)`, so `lookaheadSafe` cannot be passed.
  Side-effecting functions must be idempotent (§8 "Idempotency") or the wrapper extended.
- **Ink state persists across a reopen** (`saveNPCState` / `restoreNPCState`), so retryable knots (a
  re-attempted call, a second email) use sticky `+` choices, not once-only `*`. Person-chat keeps story
  position only in memory (`conversationStates`), so a page reload restarts it at the start knot;
  only scalar variables survive, via `npcInkVariables`.
- **Restore overwrites variables the engine set before it.** Anything the engine writes into a story
  at open (identity variables, `email_*`) is written **after** `restoreNPCState` and after
  `syncGlobalVariablesToStory`, in every loader.
- **Influence tags today** (detail in §8): the live engine handles no influence-value tag. Both chats
  run their tags through `processGameActionTags` in `chat-helpers.js`, which has no case for
  `#influence:N`, `#influence_gained:N`, `#influence_lost:N` or the `rapport_` / `respect_` /
  `friendship_` variants; those tags are ignored. `#influence_increased` / `#influence_decreased` show
  only the `+ Influence: <name>` / `- Influence: <name>` popup, and `#hostile` is what turns an NPC
  hostile (m01 Derek). The dispatcher for `npc-influence-change` and the `setNPCInfluence` call sit in
  `person-chat-conversation.js`, which nothing loads. The bridge method is still reachable from outside
  the engine as `window.npcSetInfluence` (`npc-game-bridge.js:824`); the social service bypasses it (§8). The legacy `-50` auto-hostile path exists in
  `npc-behavior.js` and `npc-game-bridge.js`, but nothing feeds it from ink. Phone-chat's
  `phone-chat-minigame.js` also sets `window.currentConversationNPCId`.
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
- **Readable type.** The bundled face for all social overlay text (mail, address bars, OSINT pages, the
  board, the builder, triage) is **Source Sans 3** (Regular and Bold; SIL Open Font License 1.1). It
  covers Latin and Cyrillic, so a look-alike domain can be shown as typed and not only as its punycode
  form: the font has 156 code points in U+0400 to U+04FF, including every Cyrillic letter the confusable
  map uses (а е о р с у х і ј ѕ and the capitals А В Е К М Н О Р С Т Х), checked with fontTools against
  `ofl/sourcesans3/SourceSans3[wght].ttf` from the Google Fonts repository. It has a tailed `l`, so `l`,
  `I` and `1` differ. The files are the Latin and Cyrillic subset WOFF2 files for Regular and Bold as
  published upstream, self-hosted under `public/break_escape/assets/fonts/` and used **unmodified**: the
  font's Reserved Font Name is "Source", and a build we subset or alter ourselves could not keep that
  name. The OFL text ships beside them. They are declared in `css/fonts.css` as the family
  `"Source Sans 3"` with `unicode-range`, so a page with no Cyrillic loads only the Latin files, and
  exposed as the token `--se-font-readable`. Scope: every string the player reads or compares, and any
  string that contains an authored domain, address, handle, file name or document field, **wherever it
  appears**: domain chips, the address bar, the checklist and tells-panel lines, feedback strings, mail
  bodies, board cards, briefs. The theme fonts (`GNF`, `Press Start 2P`) keep to chrome labels and
  headings that contain no such string. Authored domains render with `textContent`, never through
  `displayDashes`. Text drawn on the Phaser canvas in this face waits until the font has loaded.
  **Homograph display.** The lab shows its homograph domain as typed (the Latin letters with one
  Cyrillic letter, from the option's `domain`, `07`), in this face, and may show the punycode form
  (`xn--...`, the option's `browserDomain`) beside it as a teaching contrast: what some browsers show
  instead, and what the eye cannot tell apart. Because one face draws both scripts, the Cyrillic letter
  is not given away by a different glyph style or a missing-glyph box. The lint is unchanged: authored
  data stays ASCII, with the Cyrillic letter written as a `\u` escape (§11, `07`).
  **Render test** (a test page in the font's import commit): the Cyrillic letters above resolve in
  Source Sans 3 (`document.fonts.check` and by eye); at the chip size `rn` against `m`, `vv` against `w`,
  and `l`, `I`, `1` are each distinguishable.

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
  A **closed target** is one whose `primedFor.trusts` is not `["*"]` (it trusts named senders only).
  The template-choice rule (§10, §13) applies in full to a closed target; an open-inbox target such as
  Hampshire still offers at least two pretext templates, but need not offer a wrong-for-her one if every
  pretext suits an open inbox.
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
- `subjects: [{ id, text, topic }]` — the subject lines the composer offers; the first is the default.
  The sent record stores the chosen `text`, and a reply is `Re: <text>` unless the ink sets one. The
  judge does not read the wording; the `topic` feeds only the open check (§2). Every list holds at least
  one subject whose topic the target does not open, so the pick matters for a stranger.
- `interests: { topics: [...] }` — the subject topics the target opens (§2). Who a character is shows
  in this and in what they act on (`primedFor`, `expectedLink`), so targets in one scenario differ in
  topics, trusted senders, accepted attachment and link, and in the templates they are offered (§10).
- `character` (optional) — the id of the `social.characters` entry whose mail-channel story writes
  this target's replies (§10). Without it the target replies from `replies` / `factorStrings`.

### No generated text

No part of the game calls a language model. The judge, the replies, the feedback lines and the hints are
all authored data or ink. A free-text box, where a scenario allows one, is unscored and unread (§10), so
nothing needs to interpret it.

---

## 8. NPC influence: the per-character global, threshold behaviours and the bar

How far a character believes the player is that character's **influence** score; suspicion is
influence going down.

### What the engine already has

| Piece | Where |
|-------|-------|
| Ink stories track a `VAR influence` and adjust it (`~ influence += 2`) | m01 Maya, Sarah, Kevin; m02 ward nurse and security guard; `scenarios/ink/influence-demo.ink`. The tag after each `+=` is the authoring-guide convention |
| Ink stories track a prefixed **scenario global** instead | m02 `gary_influence`, `bernie_influence`; m03 `victoria_influence`; m04 `vance_trust_level` ("synced scenario global, also raised face to face") |
| Toast tags `#influence_increased` / `#influence_decreased` | `chat-helpers.js`: popup with the NPC's display name, no value, no reason |
| Toast tags `#influence_gained:N` / `#influence_lost:N`, `#rapport_*`, `#respect_*`, `#friendship_*` | **Not handled by the live engine.** `processGameActionTags` (`chat-helpers.js`) has no case for them, so they are ignored; the only code that dispatches `npc-influence-change` is in `person-chat-conversation.js`, which nothing imports, and nothing listens for the event. Used about 440 times in shipped ink; harmless |
| Absolute set `#influence:N` | **Not handled by the live engine** (no case in `processGameActionTags`); `npcGameBridge.setNPCInfluence` has no live caller in the engine, but it is exposed as the public entry point `window.npcSetInfluence(npcId, influence)` (`npc-game-bridge.js:824`), which writes behaviour state and runs the auto-hostile check (`:655-677`). The social influence service (S5) does not call it: it writes `<character>_influence` and leaves behaviour state alone, so a social character never turns hostile through that path, and `window.npcSetInfluence` does not touch the influence global. m01 Derek turns hostile because of the `#hostile` tag on the line above his `#influence:-100` (`m01_derek_confrontation.ink`), not because of the influence tag |
| Auto-hostile | `npc-game-bridge.js` and `npc-behavior.js` (`setInfluence`): combat-hostile when influence drops strictly **below** `behavior.config.hostile.influenceThreshold`, default `-50` (`|| -50`, so an authored `0` becomes `-50`). The path exists, but nothing feeds it from ink today: a local ink `VAR influence` is never mirrored into behaviour state, so m02 guards are not turned hostile by ink arithmetic |
| A bar above an NPC | `ui/npc-health-bars.js` (`NPCHealthBars`, created in `core/game.js` at about line 1679, updated every frame at about line 2164): a Phaser world-space graphic drawn from hostile HP only. It cannot draw in the DOM overlays and shares nothing but colour constants. (`systems/npc-health-bar.js` is not loaded) |
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
    "emailRecord": { "storyPath": "scenarios/lab_social_engineering/ink/priya_mail.json", "displayName": "Priya Nair (helpdesk mail)" },   // §9
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

Character-level influence fields (in `influence`): `global`, `min`, `max`, `start`, and the optional
integer `rearmMargin` (default 10). `rearmMargin` is one value per character: it is how far above
(below, for `"above"` thresholds) a threshold's `at` the influence must climb before that threshold
re-arms and its band flags clear, and the margin the `recoverTo` rule uses.

The optional `influence.display` object controls what the player sees (README AA). Its keys are
`bar` (the S4 bar in every mount: chat headers, the mail reading pane, the board card), `number` (the
value printed beside the bar) and `pip` (the S13 world pip). Each is a boolean and defaults to `true`.
`social.influenceDisplay`, with the same keys, sets the scenario default; a character's own keys
override it key by key. `bar: false` hides the number too. Display never changes the mechanics: the
watcher, thresholds, effects, tells and the debrief run the same with the bar hidden. Resolved once by
`resolveInfluenceDisplay(scenario, characterId)` in the influence service, which S4 and S13 both call.

Threshold fields:

- `at`: the value. A threshold with `"when": "below"` (the default for negative values) fires when the
  value is **at or below** `at`; `"when": "above"` fires at or above, for a positive threshold such as
  "trusts you". Equality counts. This is the same convention for the bar and the effects. (The
  legacy hostile check above is strict `<`; it is left alone for non-social NPCs.)
- `icon`: one of `wary`, `refuses`, `reports`, `hostile`, `trusts`. The bar
  draws the icon at that position. (Back-ported 2026-10-22: any other value, including a scenario
  asset key, draws the fallback question mark, `ui/influence-bar.js` `ICON_FOR`.)
- `effects[]`, run once per crossing, in order:

| effect | what it does |
|--------|--------------|
| `setGlobal {global, value, clearOnRearm?}` | `applyActions set_global` through the shared writer (§9). Declare the global; do not import it. Values colon-free. `clearOnRearm: true` (booleans only) makes it a **band flag**: see "Band flags" below |
| `endConversation` | closes the open conversation on any channel with the NPC's authored `outcomes.reported` line |
| `lockout {scope, until, recoverTo}` | refuses new conversations. `scope`: `"channel"` (only the channel the player was on) or `"character"` (all channels). `until`: `{ "afterMinutes": N }` (**real elapsed minutes** from `gameClock.elapsedMs()`; it is not scaled by a scenario's `gameClock.rate`, and needs no `gameClock` block), `{ "global": "name" }` (lifts when that global becomes true) or `null` (permanent; the validator rejects this on a critical-path character, below). `recoverTo`: the influence value set when the lockout lifts (default: the declared start). **Rule: `recoverTo >= A + rearmMargin` (the character's `influence.rearmMargin`, default 10), where `A` is the highest `at` among the character's `"when": "below"` thresholds that carry effects (`"above"` thresholds such as `trusts` are excluded)** (the comparison is `>=`; the validator checks it). The lift writes it **silently**: it clears the latch, clears the band flags and re-arms the thresholds without running their effects, so a character never returns already `wary` or `refusing`. Priya (`at` -40, margin 10) uses -30, which meets the rule exactly; the lab's Dev has no `recoverTo` and recovers to his start, 0 (back-ported 2026-10-22) |
| `combatHostile` | **opt-in.** Calls `setHostile`, the existing combat state (tint, chase, health bar, punch on click). Off by default |
| `toast {text}` | a fixed one-line notice |

- A crossing fires when the value moves from the other side of `at` to this side. It re-arms when the
  value returns to `at + rearmMargin` or above (the character's `influence.rearmMargin`, default 10; for a `"when": "above"` threshold,
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
  entry. The legacy tags, `#hostile` and the `-50` auto-hostile default stay exactly as they
  are (m01 Derek still turns hostile through `#hostile`; m02 guards are not turned hostile by ink
  arithmetic). The new influence-tag handling applies to social characters only (S5). The engine does
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
  A clumsy email lowers the influence a later chat sees. (Back-ported 2026-10-22: two corrections.
  A pretext call does not inherit it: each new call, but not a mid-call reload, resets the character
  to `influence.start` with the reason `new_call` (lab fix round L, M3(d); `person-chat-pretext.js`
  `attachPretext`), and that reset always emits `npc_influence_changed`, even at 0 delta, so a bar
  mounted earlier clears its "Last change" line (fix round 7 F1). And `04`'s `boostIfGlobal` /
  `strictIfGlobal` cannot read influence: `mail-bridge.js` `applyFactorBias` compares each named
  global with `=== true`, so only a boolean flag flips a factor. Influence reaches a phish through the
  target's `on_email` ink, which reads the `VAR`.)

### Characters of the student lab

Every character the student can contact has a `social.characters` entry. A failed mail send costs 10 points and a landing adds 10 (a rule stated in `04`, applied by the lab's `pierce_mail` and `lord_mail`; sketch in §10), so the two mail-only targets cannot be locked out of the only route to them.
Hampshire is a data-only target with no character entry, so she has no influence and pays nothing;
her `emailReplyDelay` is authored on her target (15, like the other two).

```jsonc
"characters": {
  "pierce": {
    "displayName": "Melanie Pierce",
    "channels": { "email": "pierce_mail" },
    "emailRecord": { "storyPath": "scenarios/lab_social_engineering/ink/pierce_mail.json", "displayName": "Melanie Pierce" },
    "emailReplyDelay": 15,
    "influence": { "global": "pierce_influence", "min": -40, "max": 100, "start": 0 },
    "syncedVars": ["pierce_influence"],
    "thresholds": [ { "id": "wary", "at": -30, "icon": "wary",
                      "effects": [ { "type": "setGlobal", "global": "pierce_wary", "value": true, "clearOnRearm": true } ] } ]
  },
  "lord": {
    "displayName": "Sofia Lord",
    "channels": { "email": "lord_mail" },
    "emailRecord": { "storyPath": "scenarios/lab_social_engineering/ink/lord_mail.json", "displayName": "Sofia Lord" },
    "emailReplyDelay": 15,
    "influence": { "global": "lord_influence", "min": -40, "max": 100, "start": 0 },
    "syncedVars": ["lord_influence"],
    "thresholds": [ { "id": "wary", "at": -30, "icon": "wary",
                      "effects": [ { "type": "setGlobal", "global": "lord_wary", "value": true, "clearOnRearm": true } ] } ]
  },
  "dev": {
    "displayName": "Dev",
    "channels": { "phone": "dev_service_desk" },
    "influence": { "global": "dev_influence", "min": -100, "max": 100, "start": 0 },
    "syncedVars": ["dev_influence"],
    "thresholds": [
      { "id": "wary",    "at": -40, "icon": "wary",    "effects": [ { "type": "setGlobal", "global": "dev_wary", "value": true, "clearOnRearm": true } ] },
      { "id": "refuses", "at": -50, "icon": "refuses", "effects": [ { "type": "setGlobal", "global": "dev_refusing", "value": true, "clearOnRearm": true } ] },
      { "id": "reports", "at": -70, "icon": "reports",
        "effects": [ { "type": "setGlobal", "global": "dev_reported", "value": true },
                     { "type": "endConversation" },
                     { "type": "lockout", "scope": "channel", "until": { "afterMinutes": 2 } } ] } ]
  }
}
```

`start` is the declared default of the influence global. Pierce and Lord have no `refuses`, `reports`
or `lockout`: a mail character cannot be burned, and the `min` of -40 stops a long run of bad sends
from sinking the bar. Dev is the only lab character with a lockout, and it sits on `reports` so that
a forced report (a refusal limit or a failed verification, at any influence) lifts after two real
minutes with Dev reset to his start, so both band flags clear on the lift (`06` §4.8). (Back-ported
2026-10-22: Dev's `start` moved from -10 to 0 so a student who has done nothing wrong sees a neutral
bar, and his `recoverTo: -30` was dropped as dead config, because every new call resets him to
`start` anyway (lab fix round R1-follow-up). The lab's `globalVariables` still declare
`dev_influence: -10`; the service starts from `influence.start`, so the two should be made equal. They were (c54ad1f3), and since 2026-10-22 the validator fails a `start` that differs from the declared global or, with no global declared, from a channel story's `VAR` default.)
Ruth, Fairbairn and Tomasz are
ordinary story NPCs with no `social.characters` entry and no bar.

### How the bar reads it

The bar is a DOM component (engine item S4) built once and used by `person-chat`, `phone-chat` and the
mail reading pane. On mount it takes the open conversation's NPC id, finds the character
(`social.characters` reverse map from channel ids), reads the value from
`gameState.globalVariables[influence.global]` and the markers from `thresholds[].at`/`icon`. It
updates on `global_variable_changed:<influence global>` and on `npc_influence_changed`, so a change
written from ink alone moves the bar. Per-change reasons show only when the event carries one. The
number is always printed beside the bar, in training and assessment alike, so the player can see how
far a line moved it and avoid pushing it too low. The bar is also shown on the character's world
sprite (S13) whenever the value differs from the start value (it hides again if the value returns to the
start), so the player sees the effect of an email or a call from across the room. Both are subject to the character's `influence.display` (above): a mount with `bar: false` renders nothing, `number: false` drops the printed value, and `pip: false` suppresses S13. There is one bar per character. A second social meter would be added only if
research supports it and the player would understand it at once. A character with no `social.characters`
entry shows no bar.

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
sticky "ring back later", runs both times. Dry runs bind nothing, so the ink fallback functions run (S1).

### Influence tags (new work in the shared tag processor)

None of these tags does anything in the live engine today (§6, the table above). For social characters
only, the shared tag processor (`chat-helpers.js` `processGameActionTags`, the processor both chats and
the mail runner use) gains cases for `#influence:N[:reason]`, `#influence_gained[:N][:reason]`,
`#influence_lost[:N][:reason]` and `#report[:reason]`, and routes them to the write path (S5). For
`_gained` and `_lost`, `N` is optional and defaults to 10 (the "Scale" step); the sign comes from the tag
name, so `#influence_lost:-5` moves by -5; a first part that parses as a number is read as `N`, so a
reason must not be a bare number (`#influence_gained:urgency` is +10 with reason `urgency`). It is one
implementation, so person-chat, phone-chat and the mail runner behave the same. For every other NPC
the existing tags keep their behaviour exactly (a popup, or nothing). Nothing is added to
`person-chat-conversation.js` or to the `npc-influence-change` event, which the live engine never
dispatches.

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
| Between stories | `broadcastGlobalVariableChange(name, value, sourceNpcId)` | Pushes to every story in `npcManager.inkEngineCache` that declares the name; the source is skipped to avoid a loop. The live chat minigames build private `InkEngine`s that are **not** in that cache (`inkEngineCache` is filled by `npc-manager.js` `getInkEngine` and the bark path only), so a broadcast never reaches the story of a conversation that is open; S3 adds an explicit write to it |
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
"emailRecord": { "storyPath": "scenarios/lab_social_engineering/ink/pierce_mail.json", "displayName": "Melanie Pierce", "avatar": "pierce", "itemsHeld": [] }
// storyPath is repo-relative and starts with scenarios/ (the validator rejects ink/...; P0-I). The record id is channels.email; an id that clashes with a room NPC is dropped (room NPC wins), and the validator warns (P1-H). The mail runner adds the id to encounteredNPCs on first delivery, so #give_item from a headless record passes the server check
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
   account to send from (§10a), the From line, the subject, the greeting, a pretext and an ask, and an
   optional attachment or link from the payload kit.
2. **Judge.** On send, `evaluateMessage(target, message)` (§3) returns an `EvalResult`, which includes
   the open check (§2). The mail client shows the factor checklist at once in training mode and with
   the reply in assessment mode ("Timing and delivery").
3. **Write into ink.** If the target has a `character`, the mail runner (below) loads that character's
   email-channel story, sets the variables in the tables below, and schedules `on_email`.
4. **Deliver after a delay.** When the delay elapses ("Timing"), the ink runs from `on_email`. Its
   output becomes the reply, rendered as an email in the mailbox of the real sending account
   (From = the NPC, subject `Re: <subject>` unless the ink sets one).
5. **React.** The ink uses the same tags phone NPCs use: `#give_item`, `#set_global`,
   `#complete_task`, unlock tags, and influence changes with a reason (§8).
6. **Follow up.** Within a thread the player either picks a short ink reply or writes a judged reply,
   never both at once ("Replies, reply choices and chasers"). A new crafted message is judged again
   from step 1.

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
  template with no blanks needs no evidence. Unless it declares `implies` it carries no value, so it
  can never satisfy `pretextRelevant`; with `implies` it counts as the values it names (Hampshire's
  applicant pretext implies `cv`, so the judge needs no fact from her: her only gate is the contact
  reveal, §11). It can also satisfy a generic pretext (an open careers inbox).

**How much choice a target offers.** A target offers two to four templates for its pretext part and for any
other part where the player has a real choice (a forced From or a single greeting may offer one), with at most two
blanks in any one template. The set is built from credible phishing, not from one right answer. Next to
the templates that fit the target sit one or two plausible ones that do not (a supplier invoice for a
finance officer who does not handle payables, a password-expiry notice for an intern waiting on a payslip), so a send is not guaranteed to land and the player
has to think about this person. Blanks offer only held facts, a stale one included (§1); the plausible
wrong choice lives in the templates, never in invented values. When a send fails the target says why in
character (the `email_*` variables below), and that reply is the player's feedback on what this person
trusts, opens and acts on.

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
  `about`. The options for a slot are the `provides` entries of held facts with the same `type`, and an
  entry offers to a slot only when its `about` equals the slot's `about`; a slot with no `about` offers
  only entries with none (§1, "Filter rule"). An untagged entry is never offered to a slot that has an
  `about`. Slot ids are unique within a target's template set.
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
  saved landing-page record (§11a). The judge compares nothing else about the link. For a target that
  has an `expectedLink` (§7) the factor is **required whether or not a link is attached**: a send with
  `message.link === null` fails it with state `missing` and the "There's no page behind that link."
  string, so no link-targeted phish can land without a built page. A target with no `expectedLink`
  evaluates the factor only when a link is attached (and lists it as advisory or not at all).
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
| `email_opened` | bool | `EvalResult.open.opened` (§2) |
| `email_open_via` | string | `"sender"`, `"subject"` or `"none"` |
| `email_subject_topic` | string | the `topic` of the chosen subject |
| `email_in_reply_to` | string | id of the message this one answers, or `""` for a new message |

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

1. Construct a separate `InkEngine` per delivery (`systems/ink/ink-engine.js`), with the story JSON taken
   from `npcManager.storyCache` or the ink endpoint (the way `getInkEngine` fetches it). Do not call
   `getInkEngine`: it returns the engine shared with barks when one is cached, and it needs
   `getNPC(npcId)` to succeed (the headless record, S8).
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
   `mailState.threads["<character>:<accountId>"]`; `recordInkVariables`; reset the `email_` set. A run
   that produces no text (a message the character never opened and chose to ignore) delivers nothing
   and just ends the job; the checklist has already said the message was not opened.

The knot the runner enters is `on_email` unless the character's `emailKnots` (§10a) names another for
the sending account.

A thread position is stored separately from the phone and person positions, so a mail run never
overwrites a conversation that is open on another channel. Choices under a reply persist only when the
position is stored. The runner saves the position with `story.state.ToJson()` into
`mailState.threads["<character>:<accountId>"]`; `recordInkVariables` and `exportNpcInkVariables` see
only the record id, never the composite key.

### Sketch

```ink
VAR pierce_influence = 0
EXTERNAL se_influence(delta, reason)
VAR email_landed = false
VAR email_opened = true
VAR email_first_fail = ""
VAR email_attachment = "none"

=== on_email ===
{ not email_opened:
    // She never opened it. Say nothing, or leave a one-line auto-reply that hints at why.
    -> DONE
}
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

### Replies, reply choices and chasers

- **One reply per send.** An `on_email` run produces one message.
- **Reply options (ink choices).** When the run ends on ink choices they appear under the reply as short
  one-sentence options ("Sorry, wrong person", "It's the Q3 sheet Jed mentioned"). They are unscored
  and the ink decides what follows, including influence changes. Picking one writes a sent record of
  `kind: "quickReply"` (the chosen text; no templates, slots or tells; `landed` null) and queues the
  continuation as an ink job with `choice` set to the index picked. It runs after the character's
  reply delay and produces the next message.
- **Write a reply (judged).** Where the character should be drawn into giving something away, the knot
  ends with the tag `#compose_reply:<targetId>`. The thread then offers a composer in place of the
  options. `<targetId>` is a `phishTargets` entry with the same `character`, so its templates, hidden
  criteria and outcome are authored like any target (§7). The message carries `email_in_reply_to`.
- **Never both.** `mailState.threads[key].expects` is `{ mode: "choices" }` or `{ mode: "compose",
  targetId }`, and the reading pane shows exactly one control, labelled by what it does: "Choose a
  reply" for the options, "Write your reply. This one is judged" for the composer. The player always
  knows whether the next step is a pick or an open task.
- **Chasers and timed mail.** A run may queue one later message with `#mail_later:<seconds>:<knot>`: an
  ink job on the same thread that enters the named knot with the same `email_*` snapshot. A thread
  holds at most one pending chaser. A scenario event can also drop mail into a mailbox: a seeded
  message with `deliverAt: { "afterSeconds": n }` or `{ "global": "<name>" }` is delivered by the
  scheduler when the countdown ends or the global becomes true (job kind `seed`).

### Timing and delivery

Replies arrive after a delay: authored per character as `social.characters.<id>.emailReplyDelay`, an
integer number of **seconds of wall-clock countdown** (default 20). The lab sets 15 for all three of its
targets, Hampshire included (a data-only target authors it on the target); an awareness episode sets
its own on its attack target (5 to 8 seconds is the recommended range there, so a short episode does
not wait on a reply).

**When the checklist shows.** `mailClient.checklistTiming` is `"onSend"` (training; the default, and the
lab's setting) or `"withReply"` (assessment). On send, `onSend` shows the checklist at once. `withReply`
shows "Sent. Waiting for a reply" and reveals the checklist when the job runs, so the player reads the
character's reaction first and then sees why. The reveal happens when the job completes, so a message
the character ignores still gets its checklist. The sent record is written in both modes, but in `withReply` mode the Sent folder hides the judged
"landed / did not land" line and the tells for a record whose job has not yet run (or whose reply has
not arrived), so opening Sent straight after sending reveals nothing early; they appear with the checklist.

Delivery does **not** reuse `timedMessages`. That machinery delivers fixed text to a phone thread: it
needs a literal `text` at send time, ignores `targetKnot` for an NPC's own messages, treats `delay` as
milliseconds from game start for NPC-level entries, and persists through a server whitelist that
drops entries with empty text. A **mail scheduler** is new work (S9): a job record
`{ jobId, kind:"ink", character, npcId, accountId, msgId, vars:{email_*}, knot:"on_email", remainingMs }`, saved
in `mailState`, delivered by the runner above. It reuses the NPC manager's tick loop
(`_checkTimedMessages`) and its "NPC not registered yet, retry next tick" behaviour, but not its
payload or its sink. The countdown uses the wall clock; the time shown on the message uses
`gameClock`, as phone messages do (`gameTime`).

A job has one of three kinds. An **ink job** is the record above (`character`, `npcId`, `knot`,
`vars`). A **text job** serves a data-only target (no `character`, such as Hampshire):
`{ jobId, kind: "text", targetId, accountId, msgId, text, outcomeGlobal, remainingMs }`, where `text`
is the target's authored `replies.landed` or the canonical fail line for the first failed factor (§2)
and `outcomeGlobal` is the target's `outcome.setGlobal` key, set to true only when the message
landed. A data-only target that does not open the message (§2) gets no reply, and its `outcomeGlobal` stays
false. In `onSend` mode it gets no job at all. In `withReply` mode it gets a **silent text job** (`text: ""`,
`outcomeGlobal: null`) with the same delay, which appends nothing and sets nothing; its only effect is to
reveal the checklist when it runs, so the checklist always arrives. Delivering a text job appends the reply to the mailbox of `accountId`, then sets the global
through the shared writer. Both kinds use `emailReplyDelay` of the target (data-only targets may
author it on the target). A **seed job** holds a seeded message waiting for its `deliverAt`:
`{ jobId, kind: "seed", messageId, mailbox, remainingMs }`, or `global` in place of `remainingMs`;
delivering it appends the message to the mailbox and raises the mail notification.

### Notification

The arrival signal is new work too: the bark and the phone badge (`updatePhoneBadge`) are phone-shaped,
and there is no workstation badge. Needed: a mail notification (HUD badge or a bark variant), a
message-list renderer, and a rule that the reply is appended without a bark when the mail client is
open (S9).

### What stays data, not ink

The **inbox-triage defender** (`05`) is content-driven: a fixed set of incoming messages with
authored truth, flags and notes. It stays data. No NPC story runs in triage.

---

## 10a. Email identity model (contract level)

The player has more than one email identity. The model separates **who really sent** from **who the
message claims to be from**.

```jsonc
"social": { "mailClient": {
  "accounts": [
    { "id": "guest",    "address": "guest@workstation.example",       "displayName": "Operator",
      "kind": "given",   "person": null,      "mailbox": "guest",    "spoofsFrom": true },
    { "id": "freemail", "kind": "created",    "person": null,         "unlockedBy": "acct_freemail",
      "mailbox": "freemail", "spoofsFrom": false,
      "createMenu": [ { "id": "tt1", "address": "tarnside.test@freemail.example", "displayName": "T. Test" },
                      { "id": "nt2", "address": "n.assurance@freemail.example",    "displayName": "N. Assurance" } ] }
  ],
  "mailboxes": [ { "id": "guest" }, { "id": "freemail" } ]
} }
```

The lab ships exactly these two accounts. Only `guest` can spoof; `freemail` sends from its own
address (its From is forced), so it teaches that a look-alike outside address fails against a
company that publishes authentication. A **found** account is modelled but not shipped in the lab;
this example is for `04`'s test case, the worked found-mailbox case below and the Eldritch Hacker build,
and adds an account and a mailbox:

```jsonc
{ "id": "jed_pc", "address": "j.baker@ledgerwell.example", "displayName": "Jed Baker",
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
  when the object names one) and shows an account switcher; unread counts are per mailbox. There is no
  single inbox per scenario: each device offers the accounts it lists (see "Mailboxes, devices and
  found mail").
- **Found credentials need no screen of their own.** The account's `unlockedBy` global says whether
  it is available. A device that should need a password carries the game's ordinary object lock
  (`locked`, `lockType`), whose key is found as intel or a note; opening the device is then the
  login.
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
  spoofed From goes to that person, so a spoof-only attacker never sees the answer. The plan
  routes to `fromAccount`, and the checklist says so once ("In real life this reply would go to Jed's
  inbox unless you set a reply-to"). There is no reply-to slot. A player who wants the answer to a
  message sent as Jed gets it by using Jed's account on a device that holds it (next section).
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

### Mailboxes, devices and found mail

A mailbox belongs to an account, and an account is reachable only from a device that lists it. That is
how one scenario holds several inboxes and how the player reads and answers another person's mail.

```jsonc
"mailboxes": [ { "id": "guest" }, { "id": "freemail" },
               { "id": "jed", "owner": "baker" } ]     // owner: a social.people id, optional
```

- **A character's mailbox with history.** `mailbox` records are seeded with `seededMessages[]` that
  carry `mailbox: "jed"` and a `folder` of `inbox` or `sent` (an authored sent message names the
  account in `fromAccount`). The loader normalises them like any authored message. This is the email
  history the player reads on a found device.
- **Devices.** A `mail_terminal` object is a fixed workstation or laptop in a room. A `mail_terminal`
  with `takeable: true` can be picked up and opened from inventory, which is how a player carries
  their own client (S14). Each device lists its `accountIds`; the switcher shows only those. A second
  inventory item can list different accounts, so a scenario can give the player a personal client and
  leave a colleague's laptop in a room.
- **Replying as the character.** On a device that lists the found account, the player picks it in "Send
  as". Its From is forced to the account's own name and address, sender authentication follows the
  account's domain, and the thread key uses that account id. The ink sees `email_account_kind:
  "found"`. A character may name a different knot for an identity with `social.characters.<id>.emailKnots`
  (`{ "<accountId>": "<knot>" }`; the default is `on_email`), so a reply to Jed's real account can read
  differently from a reply to the guest account.
- **Contacts per device.** A contact may list `accountIds`; it appears in the To list only for those
  accounts. A contact with no `accountIds` appears for all, once its `revealedBy` global is set.
- **Highlights and saved evidence.** An authored message may carry `highlights: [{ id, text, grants? }]`,
  where `text` is an exact substring of the body (the validator checks it). Highlighted words are
  marked in the reading pane. Selecting one offers "Save as evidence": with `grants` set it calls
  `grantFact(grants)` with the highlight's `id` as the fact's `source` (one award path, `02`); without
  it the sentence goes to the notepad. Any other selection can be sent to the notepad (the notes API),
  which grants nothing.

### The message record (persisted)

One record shape serves the inbox, the Sent folder, seeded mail and the triage reader. The mail
client stores it in `mailState.mailboxes[<mailboxId>].messages[]`.

```jsonc
{ "id": "msg_017", "thread": "pierce:guest",   // "<character>:<accountId>"; "<targetId>:<accountId>" for a data-only target
  "mailbox": "guest",                     // the mailbox holding this record (mailState.mailboxes[<id>])
  "folder": "sent",                       // "inbox" | "sent"
  "fromAccount": "guest",                 // the account really used (sent mail only)
  "from": { "name": "Jed Baker", "address": "j.baker@ledgerwell.example" },   // the From as displayed
  "to": "m.pierce@ledgerwell.example",
  "targetId": "pierce",                   // the phishTargets id, or null when the recipient is not a target
  "subject": "Quick one",
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
- **Quick replies.** A reply option the player picks (§10 "Replies, reply choices and chasers") is stored
  as a sent record with `kind: "quickReply"`, `body` the chosen text, `targetId` null, empty `templates`
  and `slots`, `tells: []` and `landed: null`. It is never judged and never replayed in triage.
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
  "mailboxes": { "guest": { "messages": [ /* records; seeded mail as stubs, below */ ] } },   // no unread count: it is derived
  "jobs": [ /* mail scheduler jobs, §10 */ ],
  "threads": { "pierce:guest": { "position": { /* saved ink state */ }, "choices": [ ],
                                 "expects": { "mode": "choices" } } },   // key "<character>:<accountId>"; mode "choices" | "compose" (+ targetId); a data-only target has no entry
  "drafts": { "guest": { "to": "...", "subject": "...", "templates": { }, "slots": { },
                         "attachment": null, "link": null } },   // one per account; survives a nested launch
  "metrics": { "pierce": { "sent": 3, "failed": 2, "landed": 1, "firstTryLanded": false } }
}
```

- **Metrics.** On every send to a target the client increments `metrics[targetId].sent`, and
  `failed` or `landed` by `EvalResult.landed`; `firstTryLanded` is true when the first send to that
  target landed. The engine also writes the declared integer global `phish_<targetId>_attempts`
  (the same count as `sent`) so an ink story can branch on it. There are no `metric_*` globals; the
  engagement report (`10`) reads `mailState.metrics`, the sent records and the outcome globals. The
  contract records no failed-factor ids per send and no hint counter: the record keeps `tells` and
  `landed`, the metrics keep counts. An assessment that needs failed factors or hints shown would add
  new fields (for example `failedFactors` on the sent record, `hintsShown` in `metrics`) and the hint
  ladder would have to write them; none is part of this plan.
- **Drafts live in `mailState`**, not in a global, so a nested launch (the page builder, the notes
  minigame) returns to a restored composer (§6 "Return to").
- **Caps** are the mail client's own constants, not the phone's (`MAX_PHONE_HISTORY_MESSAGES` 150 and
  `MAX_PHONE_STATE_BYTES` 512 KB in `game.rb`): 200 messages per mailbox, 4000 characters per body, 50
  jobs, one draft per account, and 1 MB for the whole `mailState`. Over a cap the sanitiser trims the
  oldest read replies first, then the oldest sent mail. It never drops a seeded stub (a dropped stub
  would bring its message back unread on reload, and a stub is about 60 bytes), unread mail or a
  pending job; if that is not enough, the section is not saved and the server reports it (below). A
  delivery commits the message and removes its job in one write.
- **Persistence** is the new `mailState` section (S9). It is a **keyed** section, keyed at the size of
  what the player touches:
  - `mailboxes.<mailboxId>.<msgId>`: one message. The server upserts it by id into
    `mailboxes[<mailboxId>].messages` (a new id is appended) and a null removes it. A read mark or a
    delivered reply therefore sends one message, about 1 KB.
  - `threads.<character>:<accountId>`: one thread's position, upserted per key as the phone does per
    contact.
  - `jobs`, `drafts` and `metrics`: one key each, replaced whole (each is small).
  A sync or a flush carries only the keys that changed (a delivered reply is one message plus `jobs`).
  The stored shape stays nested as above, so the bootstrap's `savedMailState` is unchanged. Mailbox and
  seeded message ids hold no `.` (a validator error); the server splits the key on the first dot after
  `mailboxes.`. The server accepts no whole-mailbox key and no whole `threads` key. The client
  registers the section in `state-sync.js` (`KEYED_SECTIONS` and `confirm()`); the server accepts it in
  `merge_last_write_wins_sections` (so a stale request cannot overwrite it) with the caps above.
  Seeded messages carry `mailbox`.
- **Seeded mail is saved as a stub**, `{ "id", "seeded": true, "read", "gameTime" }`, because its text is
  scenario data. On load the scheduler builds the seeded mail, the configured mailboxes and the
  `deliverAt` seed jobs from `social.mailClient` first, then applies the save: a stub becomes the
  authored message with the stub's `read` and `gameTime`; a stub whose message has gone from the
  scenario is dropped; a `deliverAt` seed with a stub is delivered, one with a saved job is pending and
  one with neither gets a fresh job. A configured mailbox with no messages is therefore present after a
  reload, and a fix to seeded text reaches a game already in progress.
- **A refused section is resent.** When a merge is refused over a cap, `sync_state` answers
  `{ success: true, notSaved: ["mailState"] }` (`phoneState` likewise). `confirm()` does not mark a
  section in `notSaved` as confirmed, so the next sync sends it again, and the page logs it once. With
  nothing refused the answer is `{ success: true }`, as before.
- **The `pagehide` flush has a size budget.** `flush()` sends a keepalive request whose body is capped
  at 60,000 bytes (`KEEPALIVE_BODY_LIMIT`); over the cap it retries with a reduced section list and then
  drops the flush. `mailState` is added to the `flush()` allow-list and sits **immediately after
  `globalVariables`** in the first reduced list (so it survives the first fallback and is dropped whole,
  never cut, in the second). With per-message keys a delivery's change is about 1–2 KB, so closing the
  tab within 30 s of a delivery keeps the reply. Only the first sync after a load sends every key; a
  page closed before that sync may drop `mailState` from its flush, which costs nothing, because the
  server already holds what was loaded. `mailState` also stays under its own 1 MB cap.

### Triage (`05`)

The defender reader (`05`) reads the **inline `messages`** of its `triageSets` entry. A set has no
`mailbox` field. A `playerSent` entry replays one **sent** record to its `targetId`, searched across the
Sent folders of every mailbox in `mailState` (landed or not). Selection: the latest sent record whose
`tells` include `senderTrust` or `senderAuth` (the spoof tells, which only a spoofing account can
raise); if no record has either, the latest record with any non-empty `tells`. A later `freemail` send
raises only the account-independent tells (`urgencyCalibrated`, and `linkCredible` when a page is
attached), so it never shadows the student's spoofed send; a record with no tells is never replayed. The
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
  "intelBoard": { "title": "...", "readyToast": "...", "people": [...], "readinessSlots": { ... } },   // 03, §4; readyToast optional (default built from the target's channels)
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
them (`02` N1, `07` N7). Card prose uses only invented brand names, so a card teaches the look-alike with the
lab's own brands. The lint reads card text for host-shaped tokens, and each must end `.example`
(`five-habits` uses `ledgerwell.example`); the denylist and fold-and-match apply to those host-shaped
tokens and to the brand words in card text, so a real brand named in a card fails. Other card prose is
reviewed by hand.
The validator checks that every card id a doc or scenario references exists.

### Lint field list

The one list. The real-brand and host lint reads exactly these fields and no
others; `02` N8 and `07` §1 and N6 refer to this list instead of restating it:

| Field | Where |
|-------|-------|
| `domain`, `browserDomain`, `realDomain`, `linkText` | landing-page domain menu and page definitions (`07`), `phishTargets[].expectedLink.realDomain` |
| `sites[].url` | OSINT sites (`02`) |
| `pages[].url` | an OSINT page's own address, when set (`02`; address-bar.js uses it ahead of the site url) |
| `pages[].path` | an OSINT page path appended to the site url (`02`) |
| `address` | `social.people[]`, the OSINT staff-block rows, a `provides` entry of type `address`, `mailClient.accounts[]` (and each `createMenu[]` entry), `landingPages[].capture.address` (`07`) |
| `addresses[]` | `mailClient.contacts[]` |
| `text` | `social.conceptCards[]`; host-shaped tokens (`.example` rule) and brand words (denylist and fold-and-match); other card prose is reviewed by hand |
| `name` on `brands[]` of a landing page | `07` §1, §5; denylist only |

Every address-like field gets the **host-only `.example` rule** (strip any scheme and everything from the
first `/`; for an address, test the part after the last `@`), the ASCII check and the fold-and-match
denylist. The ASCII check runs on the field's raw JSON source text, not on the parsed value: the homograph
option `d_homo` writes its Cyrillic letter as a `\u` escape, so its source is ASCII and passes, while its
parsed `domain` keeps the Cyrillic letter (§6, `07`); the allowlist check (on the raw labels, first) applies to the menu `domain` values only. A brand `name` gets the denylist alone. A
**host-shaped token** is a hostname in a URL or address field, or a dotted token in `conceptCards[].text`
whose last label is a known public TLD (the validator carries the list) and is not `.example`. It
excludes file names (`Q3.pdf`, `CV.docx`: a known file extension is not a TLD) and pattern phrases
(`initial.surname`, `m.pierce`), and it ignores the local part of an `@` address. The lint does not read
other prose (a post, a block, a template or a reply), so the claim is "no real brand in those fields and
in card text", not "anywhere in `social`". Real product names (`Microsoft Excel`, `Xero`, `Office 365`) may
appear in OSINT and fact prose; only a real brand in a listed field (a domain, address or brand `name` field, or concept-card text) is rejected. Landing-page
brands are invented (`07` §1), so no brand name needs an exception here.

**Pointers.** An object carries only a pointer in `minigameData`. One object type has one entry in
`minigame-data-schemas.json`, and each new type needs a sprite `assets/objects/<type>.png` and a `this.load.image` line in `core/game.js` `preload()` (the existing `phone` needs neither):

| Object type | `minigameData` | Notes |
|-------------|----------------|-------|
| `mail_terminal` | `{ accountIds: [...], defaultAccount? }` | opens `mail-client`; a phone item may also list `accountIds` (Eldritch Hacker; no flow in the lab) |
| `osint-workstation` | `{ siteIds: [...], start? }` | ids from `social.osint.sites`; the workstation opens only those (every site when `siteIds` is absent). `start` is a location (`company`, `company.team`, `social.pierce`, `~tools`); without it the browser reopens at `se_osint_state.at` (back-ported 2026-10-22) |
| `case-file` | `{ mode }` | one of `scope`, `plan`, `recon`, `defender`; one board object per mode, default `recon` |
| `triage-workstation` | `{ triageSetId, stage?, conclusionTaskId? }` | `stage` overrides the set's stage (only with a `{stage}` prefix); `conclusionTaskId` is the task the reopen re-emit checks (§11 "Reopen re-emits") (back-ported 2026-10-22) |
| `page-builder` | `{ landingPageId, targetId? }` | |
| `phone` (existing type) / NPC with call data | `{ callId }` | ids from `social.pretextNpcs`. **Engine change:** the whole phone path in `systems/interactions.js` is gated at line 1355 by `data.type === 'phone' && (data.text || data.voice || data.npcIds)`, so a phone carrying only `{ callId }` never enters it. The `callId` check goes **above that gate** (a separate `if (data.type === 'phone' && data.callId)`, or `data.callId` added to the gate condition with the `callId` branch first inside it). It checks the lockout (§8) and then opens `pretext-prep`; no new sprite, and a schema entry for the `callId` pointer. **Which record opens:** `pretextNpcs[callId].character` names the `social.characters` entry; a `phone` object opens that character's `channels.phone` record in `phone-chat`, and an NPC sprite opens `channels.person` in `person-chat` and carries `callId` as a top-level NPC field (add it to the NPC schema), which `pretext-prep` reads |
| `report-workstation` | `{ requiresGlobal?, lockedMessage? }` | reads `social.engagement`. With `requiresGlobal` set and not yet `true`, a toast shows `lockedMessage` (default "There is nothing to write up yet.") and the report does not open, so its tasks cannot complete before the stage they report on (lab R-b5; back-ported 2026-10-22) |
| `kiosk` | `{ episodeId }` | opens the episode runner (`11`; built 2026-10-22). `episodeId` must equal `social.awarenessEpisode.id`; a mismatch shows "This kiosk has no exercise to run." and opens nothing. One kiosk per shell (lint). Sprite `assets/objects/kiosk.png`. The branch in `systems/interactions.js` calls `window.startEpisodeRunner(sprite)` |

`mode` is the pointer's one name everywhere. A nested launch passes the child's parameters in the
call (`mode`, `targetId`, `landingPageId`), not through the object (§6 "Return to").

**Engagement mode blocks.** Each of `scope`, `plan`, `defender` and `report` in `social.engagement` has
`onCompleteGlobal` (set through the shared writer on the false-to-true flip, when every step is
done) and an optional `steps[]` of `{ id, onCompleteGlobal }`, each set when that step is done. A task
therefore completes on its own global. **Step binding.** Every sorting card, question card and pick
carries `step: <stepId>`, a step id in the same block. A step is done when every item carrying that
step id is answered correctly (a card placed in its right pile, a question answered with a `correct`
option, a single-select pick whose chosen option has `correct: true`); the
block global is set when all its steps are done. A step whose content is read-only (the report's `results` table) carries one `confirm` item (`{ "kind": "confirm", "step": "results", "text": "I have read the campaign results" }`, where `text` is the label beside the Confirm button), done when the student presses Confirm; every declared step has at least one item. A block with no `steps[]` is done when all its items
are correct. The lab's values:

| Block | Block global | Step globals |
|-------|--------------|--------------|
| `scope` | `roe_signed` | `roe_scope_done` (sort the scope cards), `roe_stoprule_done` (the stop-rule question) |
| `plan` | `plan_done` | `plan_objective_done` (the objective pick), `plan_measures_done` (the measure pick; each pick is single-select with exactly one correct option) |
| `defender` | `profile_done` | none |
| `report` | `report_filed` | `report_results_done`, `report_findings_done` |

Completion per mode: `scope` when every sorting card is placed correctly and every question card
(`kind: "question"`, options `{id, text, correct, why}`) is answered; `plan` when the pick of each step the block declares is correct (the lab has two single-select picks, the objective and the
success measure; the targets are the scope cards, not a pick); `defender` when each fact in `engagement.defender.factMitigations`
has a `good` option chosen. `defender` has no indicators step unless `engagement.defender.indicators`
is authored (off by default): `[ { id, tell, text, block, why, step? } ]`, each shown only when a sent record's `tells`
holds its `tell`, marked Block or Let through, gating the block only through a declared step it names
(README "The intel board"). `factMitigations` is `[ { intel, options: [ { id, text, good, why } ] } ]`
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
| `pretext_call_reported` (a lab-owned name) | Dev's `outcomes.reported.setGlobal` (`06` §4.8) | boolean, default false; set when the call ends reported; declared in `globalVariables` (`10` keys a branch on it) |
| `pretext_<callId>_outcome`, `_lowest`, `_state` | the pretext session | `06` §6 (outcome precedence: `reported`, else `got_it` if any ask granted in the call, else `walked_away`). A call can be reopened: `_outcome` holds the latest call, per-ask grants accumulate. `_lowest` is a running minimum over every call, so a clean call-back does not hide a reported first call (back-ported 2026-10-22; lab fix round 4) |
| `pretext_<callId>_reports` | the pretext session (`finalisePretext`) | integer: calls that ended without a grant (reported, refused or walked away). It advances the call's hint ladder and lets the report read "an earlier call was reported, a later one got what it asked for" (back-ported 2026-10-22) |
| `<character>_forced` | the influence service | comma list of threshold ids latched by a forced report while the value was not past their `at`, so a reload does not re-arm them (N-01). Engine-written; need not be declared (back-ported 2026-10-22) |
| `se_mail_applied`, `se_mail_last_account` | the mail runner; the mail client | engine-written, need not be declared: a per-job marker so a reload never applies a reply's influence twice (T2-1), and the account the client was last on, so a reload reopens there (lab R1 F11) (back-ported 2026-10-22) |
| `<prefix>percent`, `<prefix>reportRate`, `<prefix>done`, `<prefix>pass` | the triage starter | the set's `setGlobalPrefix` (05). `pass` is never cleared by a lower round, and `percent` and `reportRate` keep the best round (back-ported 2026-10-22, packet M7). After the confirmed save the starter emits the changed names, `done` last, then the done event `inbox_triage_completed`. These four scalars are all that persists of a finished round: a later read-only reopen shows the headline, percent and report rate from them, while per-answer data (`answers[].ms`, `perFactor`, the stage) lives only in the in-memory result until a server record exists (`05` OQ1) |
| `se_awareness_records` | the awareness measurement store (`systems/awareness-measure.js`), after each finished defend or check round | **array** of blocks, default `[]` (built 2026-10-22). Block: `{ v: 1, key, setId, form, stage, episodeId, variant, at, percent, reportRate, items[] }` with `key` = `<stage>:<setId>`, `stage` `pre` \| `post` \| `episode`, `form` the set id, `at` an ISO time, `percent` 0 to 100 (integer), `reportRate` 0 to 1 and `items[]` of `{ itemId, verdict, action, chips[], score, ms }` (`verdict` is `trust`, `report`, `delete` or `verify`; `action` is empty unless the button differs from the verdict, as a call's `escalate`). First answer wins: a key already present is never overwritten, and an aborted round or a read-only reopen writes nothing. Ids, enums, numbers and a timestamp only; no free text. Written through the shared writer without `deferEmit` (nothing listens on it). The reader (`readBlocks`) accepts `[]`, `{}` or a JSON string and treats anything but an array as empty; the lint accepts `[]` or `{}` as the declared default, and the shells declare `[]`. Not exported between missions. `toXapi(block, actor)` maps a block to xAPI statements (one per item plus one for the round; the actor is the caller's) and nothing calls it yet |
| `episode_<id>_defend_percent`, `_reportRate`, `_pass`, `_done` | the triage starter, for the episode's defend set | The set's `setGlobalPrefix` is `episode_<id>_defend_` (a defend-only id already ends `_defend`, so its prefix reads `episode_<id>_defend_defend_`). The lint requires `done` to be declared; the shells declare all four. A check mission uses `triage_{stage}_` instead |
| `se_osint_state`, `se_board_state`, `se_landing_pages`, `se_landing_drafts`, `se_report_state`, `episode_<id>_state` | their minigames; `se_landing_drafts[<pageId>]` holds the builder's draft choices before the first Score, written on every change and on close (`07` N4), and `se_landing_pages` holds only scored records (§11a); `se_report_state` is the report builder's in-progress pairings (finding id to chosen cause and control; ids only, saved and synced as the board does) | object-valued, default `{}` |

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
- **Sync, then emit.** `concludeRequires` reads the server's `player_state`, and client globals reach
  it only on the 30 s sync or `pagehide`. The shared writer emits `global_variable_changed` at the moment
  it writes, and the host NPC's mapping completes the task (an immediate POST) on that event, so the
  emission must wait for a sync the server has **confirmed**. The shared writer (S3) therefore takes a
  `deferEmit` option, and `stateSync` gains `syncConfirmed()` (S3). The triage starter (and any other
  runner that sets an episode's done global, `11` N15) writes `<prefix>percent`, `reportRate`, `pass` and
  `done` with `deferEmit`, then awaits `window.stateSync.syncConfirmed()`, which resolves `true` only when
  the server accepted the PUT and did not answer `{ stale: true }` (or there was nothing left to send).
  It retries with back-off up to a capped number of attempts; after each failure the result screen shows
  a "Saving your progress..." notice. A 403 refusal is final and is not retried (S3). Only after a
  confirmed sync does the starter emit the `global_variable_changed` events (done last) and its done
  event, so the task's POST finds the gate met and the exported values current.
- **Reopen re-emits.** The 30 s timer or the `pagehide` flush can carry `<prefix>done` to the server
  before `syncConfirmed()` resolves, and the tab can then close with nothing emitted. So when the starter
  opens and finds `<prefix>done` true (the first-attempt guard, `05` N6), it also checks the shell's
  conclusion task (named in the starter's `conclusionTaskId` param; the validator checks it is the task
  the host NPC's mapping completes) in `window.objectivesManager.taskIndex` (`objectives-manager.js:15`).
  If that task is not `completed`, the starter awaits `syncConfirmed()` and then re-emits the done
  events, as on a first run. Completion is idempotent on both sides: the client's `completeTask` returns
  early on a completed task (`objectives-manager.js:544-546`) and the server answers "Already completed"
  (`game.rb:1312-1315`). Every starter that writes with `deferEmit` follows the same pattern.
- **Limitation, stated honestly.** If the connection stays down, or the attempts run out, nothing is
  emitted: the result stays on screen with the notice, the task does not complete and `concludeRequires`
  stays unmet until the player reopens the round, the sync succeeds and the reopen re-emits. Nothing can
  guarantee delivery offline. The tests: a `concludeRequires` check made at the instant of the task POST
  sees the done global; a forced failed sync emits nothing; a reload with `<prefix>done` already on the
  server and the task incomplete completes the task once; a 403 stops the retries. `05` N6 documents the
  starter; `11` N16 refers to it.
- **Task order is not enforced by the server.** `complete_task!` (`game.rb:1306`) checks that the task
  exists, is not already completed and meets its type's precondition; it does not read the task's or
  its aim's locked status, so a task completed early is accepted and scored, and an aim whose tasks all
  complete is scored even if its unlock condition is unmet (`check_aim_completion`, `game.rb:2269`). The
  client's `completeTask` has no status gate either (`objectives-manager.js:544`). Shells and episodes
  therefore gate in their own data: the done global that the host mapping listens on, and
  `concludeRequires`. No server change is planned.
- **Names that cannot collide.** Each check mission keys its task on its own stage's done global
  (`triage_pre_done` in the pre mission, `triage_post_done` in the post mission). The pre mission declares
  `triage_pre_*` in `globalVariables`; the post mission declares `triage_post_*` and imports `triage_pre_*`
  under those names. The validator declares the prefix globals only for the stage the mission's kiosk
  launches, and skips any name the mission imports, so an import never collides with an own declaration.
- **Every episode shell scores.** An episode shell has at least one aim (`missionConclusion: true`)
  with a task that completes on the episode's defend-set done global, using the rules above, so
  Hacktivity's task and aim share (`game.rb` scores 0 when a mission has no tasks) exists for it.

**The awareness episode block and its mail option (built 2026-10-22).** `social.awarenessEpisode` is the
episode definition `11` §5.1 sketched; the schema is `socialAwarenessEpisode` in `scenario-schema.json`
and the lint is `scripts/validate_social/awareness.rb`. Author documentation: README "Awareness
episodes". Where it differs from or adds to `11` §5.1:

| Field | Contract |
|-------|----------|
| `stages[]` | Closed list: `brief`, `osint`, `build`, `write`, `mfa`, `flip`, `defend`, `debrief`, `check`. Full: `brief, osint, write, flip, defend, debrief`, with `build` straight after `osint` and `mfa` straight after `write` or `flip` as options (six lists in all). Defend-only: exactly `brief, defend, debrief`. Check mission: exactly `["check"]`. The runner drops attack stages from a defend-only episode whatever is authored |
| `variant` | `full` or `defendOnly`; optional only when `stages` is `["check"]` |
| `id` | A defend-only id is the full id plus `_defend` (lint). `episodeId` on the kiosk equals it |
| `conclusionTaskId` | Required by the lint: a task of the conclusion aim, which the host NPC's mapping on `global_variable_changed:<done global>` completes. Passed to the triage starter for the reopen re-emit |
| `brand` | `{ name, logoText, accent }`; `accent` matches `^#[0-9a-fA-F]{3,8}$`. The wordmark is drawn in CSS from `logoText` |
| `defend` | `{ setId, stage?, reportAlwaysVisible?, callsFrom?, calls? }`. `stage` is `pre` or `post` on a check mission and null otherwise. `reportAlwaysVisible` is accepted and not read |
| `defend.calls[]` | The role swap (N15). `{ id, genuine, callerId?, claims[{ fact, value, label? }], tells[], transcript[{ who, text }], notes }`. Each becomes a `call` message in the defend set, ahead of the set's own, with `truth` = `notes` plus `isPhish: !genuine` and `flags: tells`; `claims` ride on the message for the call card. A claim's shown text is `label`, else the `social.intelFacts` `provides` label for `value`, else the raw value. Lint: the set is `awareness` with `verifyVerdict: true`; at least one genuine and one impostor call; ids unique and not message ids; each `fact` is a `knows` id of `callsFrom` (else of any `pretextNpcs` entry); with no `pretextNpcs` (defend-only) each claim carries a `label` and `callsFrom` is not read. Calls count towards the 5 to 8 messages |
| `attack` | `{ target?, siteIds, accountIds, defaultAccount?, callId?, landingPageId?, layout?, showRedFlagMeter?, maxMessages, scored }`. Lint: `scored` is `false`; `maxMessages` is `1` unless `callId` is set; `siteIds` resolve to `osint.sites` and are not empty; `accountIds` resolve and are not empty unless `callId`; `emailReplyDelay` of the target 5 to 8 (warning). The runner always passes `maxSends: 1`; `maxMessages` and `showRedFlagMeter` are not read |
| `attack.callId` | A `pretextNpcs` `callId`. The `write` stage then launches that pretext call instead of the mail client (the write-as-call rule); the runner watches `pretext_<callId>_outcome` and holds `{ kind: "call", callId, outcome }` for the flip |
| `attack.landingPageId` | A `landingPages` id whose `targets` has an entry for `attack.target`; required by the `build` stage |
| `attack.layout` | `phone`, passed to the mail client |
| `mfa` | `{ pushes[{ id?, at, app, account?, location?, device? }], approvesAt, mode? }`; required when `stages` has `mfa` (warning for the reverse). `at` and `approvesAt` are `"HH:MM"` or a number, not mixed; `approvesAt` is not before the first push; `mode` is `attacker`. Launched on the `authenticator` scene; the demonstration is unscored and records nothing |
| `strings` | `brief`, `flipHeading`, `flipIntro`, `flipPageIntro`, `flipCallIntro`, `flipDefenderLine`, `flipNoSend`, `flipMissed`, `continue`, `defendIntro`, `noBlameLine`, `mondayCard`, `defendOnly`, `conceptPanel` and `voicePanel` (a string or `{ heading?, text }`), and `facilitator` (`{ <stage id>: string, pause: string }`). All plain text. Closed: any other key fails the schema. Every key but `brief` has a default in the views |
| `facilitated` | Boolean (N5). Shows `strings.facilitator[<stage>]` as a group prompt, hides the per-learner score on the shared debrief and pauses between stages |
| `role`, `company`, `durationTargetMin`, `debrief` | Accepted, not read by any code |

The runner state `episode_<id>_state` is `{ v: 1, variant, stage, done[], sent, defend }` (ids and numbers
only; `sent` is `{ recordId, targetId, templateId, blankIds[] }` or `{ kind: "call", callId, outcome }`, held
for the flip and then set to `null`; `defend` is `{ percent, reportRate, verifyCount }`).

**Mail client launch parameters for an episode.** The write stage opens `mail-client` with
`{ accountIds, defaultAccount, maxSends: 1, layout? }`. `maxSends` (number, absent means no cap): after that
many sends this session Compose is disabled and a line says the message has gone ("Your message has gone. You
cannot send another."); Close carries on. `layout: "phone"` puts the narrow layout in a phone frame on any
viewport. `sentIds` (string[]) is set by the client's `returnParams()` on a reopen and carries the sent record
ids so far. The close result carries `sentIds`, this session's sent record ids oldest first, but only in episode
mode (a cap, a phone layout or carried ids), so a plain mail terminal's result is as before. The runner picks
the newest id that is a sent record to the target.

**Object-valued state globals** hold ids only and stay small (the 60 KB `pagehide` flush shares one
budget with every global). A call's tells log keeps the last 40 entries. Mail is not stored this way;
it lives in `mailState`.

### 11a. The landing-page record and how it reaches the judge

The builder (`07`) persists one record per built page in `globalVariables.se_landing_pages[<pageId>]`
and sets `landing_<pageId>_built` and `landing_<pageId>_domain` when the page is attached. Choices made
before the first Score live in `globalVariables.se_landing_drafts[<pageId>]` (`07` N4), because a record
needs a credibility and a verdict. The lab's names are `landing_payroll_login_built` and
`landing_payroll_login_domain`; a mission listens for the literal `global_variable_changed:landing_payroll_login_built`
and completes its task through `completeTask`, since a global cannot open a lock or complete a task itself:

```jsonc
{ "pageId": "payroll_login", "targetId": "lord",
  "choices": { "brand": "ledgerwell", "purpose": "payslip", "domainId": "d_word", "logo": "crisp",
               "wording": "w_formal", "fields": ["email","password"], "padlock": true },
  "credibility": 87, "gatesPassed": true, "meetsThreshold": true,
  "tellsFound": ["domain","formOrigin","hoverMismatch"],   // any subset of the factor ids plus formOrigin and hoverMismatch
  "victim": { "visited": true, "submitted": true, "noticed": false },
  "built": true }
```

The record's keys are closed, as `07` §5 lists them. `targetId` is a key of the page's `targets` map (the lab's page has exactly one, `lord`; a page has at
least one, and the validator checks it; a page on a `page-builder` workstation has exactly one, which the starter uses). The builder can be launched only for a target in that map: it
refuses any other `targetId`, and the composer offers "build/attach page" only for such targets, so
`linkThreshold` and `minDomainTier` are always defined. `meetsThreshold` is computed by `07`'s model
as `credibility >= targets[targetId].linkThreshold && gatesPassed`. A page can be attached below the
threshold ("attach anyway"); `built` is true either way. **Attach needs a current Score.** Any change to a
choice after Score writes `meetsThreshold: false` and `built: false` into the record (the meter greys
and Attach is hidden) until the next Score, so an attached record is always the result of `scorePage`
on its own `choices`. Closing the builder without changing anything leaves the record as it was. `victim` is written on **every send that
carries the page**, landed or not: `01` calls `describeVictimOutcome(record, target, landed)` and
stores the result through `betterVictim(old, new)`, which keeps the best outcome. Outcomes rank
`submitted` > `noticed` > nothing; the first send always writes, and a later send replaces the stored
value only if its outcome ranks at least as high. A later send that does not land, or that is noticed,
therefore never overwrites an earlier success, and the report reads the same stored value. **Re-scoring never clears the victim record.** A Score in the builder updates only `choices`, `credibility`, `gatesPassed`, `meetsThreshold`, `targetId` and sets `built: false`; it preserves `victim` and `tellsFound` (the stored outcome stays the best one from earlier sends; only `betterVictim` changes it). A page that meets its threshold and whose email landed gives `visited` and
`submitted`; a page below its threshold gives `visited` and `noticed` (landed or not); a page that meets
its threshold but whose email did not land gives nothing, because the message never reached the
target. This keeps the noticed branch and the defender inspection reachable after "attach anyway". When the composer returns from the builder it re-attaches the link on the page record's `built` flag (the record is the truth; the `landing_<pageId>_built` global stays true after a first attach). The page definition carries an authored
`linkText` (the address the mail client shows for the link, for example `ledgerwell.example/payroll`)
that the hover-mismatch lesson contrasts with the real domain; the player does not write it.

**Capture note.** When a send first stores `victim.submitted: true`, the mail client's send path adds the
page's `capture.note` to the player's notes, once (`01` §3 item 2, `07` N11). The record gets no new field: the
note is authored scenario text that names the captured account and holds no password value, and a repeat or a
noticed send adds nothing.

**One link id per page.** The payload-kit item for a page is `kit_payroll_page`, with
`landingPageId: "payroll_login"`; the same id is `message.link`, the sent record's `link.kitId` and
the page-record lookup key. This is the only link id.

**How the judge receives it.** `evaluateMessage` is pure and reads no globals (§3). When `message.link`
is set, the mail client resolves the kit item to the page record and fills `message.linkInfo`
from `07`'s `linkInfoFor(record, pageDef, kitId)`:
`{ kitId, pageId, domainId, domain, browserDomain?, credibility, gatesPassed, meetsThreshold }`, or `{ kitId, state:
"missing" }` when no record exists or its `built` is false. `domain` is the chosen domain option's `domain` as typed (a homograph keeps its Cyrillic letter, drawn in the bundled face, §6), and `browserDomain` is its punycode form when it has one, offered as a teaching contrast; both are read from the page definition. `linkCredible` passes when `linkInfo.meetsThreshold` is true;
state `missing` fails with "there's no page behind that link". The `linkCredible` tell is present when
`linkInfo.domain` is set and differs from `target.expectedLink.realDomain`, whether or not the page
convinced; a `missing` link has no domain and raises no tell.

---

## 12. Engine work owned by this doc

Items other docs depend on. Each has a code location. The consolidated cross-doc list is in the README.

| # | Item | Where in code |
|---|------|---------------|
| S1 | **Ink externals degrade to ink fallbacks.** Today an unbound `EXTERNAL` throws on the first `Continue()`, for the whole story, even when the running knot never calls it, and nothing sets `allowExternalFunctionFallbacks` (`ink-engine.js:10-25` builds the `Story` and sets nothing; `continue()` rethrows). The bark loaders in `npc-manager.js` bind nothing at all, and the two chat loaders bind only the six read-only names (`phone-chat-conversation.js:128-170`). So `InkEngine.loadStory` sets `this.story.allowExternalFunctionFallbacks = true` on every story it builds, and every `EXTERNAL` a social story declares (`se_influence`, `pretext_say`, `pretext_ask` and any mail helper) must have an ink-side fallback function of the same name and arity (`=== function se_influence(delta, reason) ===` returning a neutral value, 0 for a number). A story then loads in the phone preload, the bark path and a dry run, and its fallback runs wherever the session that binds the real function is absent. The session and the mail runner bind the real functions with `bindExternalFunction` before the first `Continue()`. A lint rule (S11) checks that every `EXTERNAL` in a social story has a matching fallback; the ink tooling gets the same flag | `systems/ink/ink-engine.js` (`loadStory`, `bindExternalFunction`); loaders `phone-chat-conversation.js` (`setupExternalFunctions`, 128-170; `_preloadOpeningOnce`, `resolveEntryKnot`; used by both chats), `person-chat-minigame.js` and `phone-chat-minigame.js` (their `InkEngine`s), `npc-manager.js` bark path; stubs in `scripts/ink_runtime_check/voicelines.mjs`, `inkcheck.js`, `reopencheck.mjs` |
| S2 | Display-name resolution prefers the conversation's own NPC on a tie | `npc-manager.js` speaker/name lookup |
| S3 | A shared global writer: write `gameState.globalVariables`, `broadcastGlobalVariableChange`, emit `global_variable_changed`. The writer takes two options: `emitAlways`, and `deferEmit`, which writes and broadcasts the value but returns the pending `global_variable_changed` events to the caller instead of emitting them, so a caller can await `stateSync.syncConfirmed()` and then emit (the triage starter, §11 "Sync, then emit"). `grantFact`, the social paths (influence, pretext, threshold effects, step globals) and the triage starter's result writes emit **only on a change** (a `deferEmit` call returns only the events for names whose value changed); `applyActions` `set_global` uses the writer with `emitAlways`, so it keeps emitting on every call exactly as today (about 20 shipped scenarios use `global_variable_changed` in `eventMappings` or tasks, and some may re-set a value to re-fire a mapping). The only new behaviour for `applyActions` is the broadcast to cached stories, which writes a value only into stories that already declare that variable. For **every global it changes** the writer also writes the value into the **calling story** (its `InkEngine`, via `setDeclaredVariable` with the observer detached, as `broadcastGlobalVariableChange` does) if that story declares the variable, and writes the clamped value back to the source story when ink wrote out of range, so a later ink assignment starts from the engine's value. This covers influence globals, `grants.intel` facts, `pretext_call_done`, band flags and `dev_reported`: the live chat minigames' engines are not in `inkEngineCache`, so the broadcast alone would leave an open conversation blind to a mid-call write. The binding passes the open conversation's engine to the writer, as the mail runner passes its own. `stateSync` also gains `syncConfirmed()` (§11 "Sync, then emit"). Today `_syncOnce` (`state-sync.js:304-319`) returns `undefined` on every path (nothing to send `:306`, stale `:310-312`, error `:316-318`), so no caller can tell a confirmed save from a failed one. The change: `_syncOnce` returns a boolean, `true` after `confirm()` and when `buildChanges()` is null (nothing left to send counts as confirmed), `false` on the stale branch and in the catch. `sync()` (`:290-302`) forwards the value unchanged and existing callers ignore it. `syncConfirmed({ attempts = 6, onRetry })` calls `sync()` (so it shares the single-flight queue and never runs beside the 30 s timer's sync), returns `true` on the first confirmed run, otherwise calls `onRetry` (so the starter can show its notice), waits with back-off (250 ms doubling, capped at 4 s) and tries again, and returns `false` when the attempts run out. A 403 (the server's refusal from `merge_last_write_wins_sections`) is final: `ApiClient.put` attaches `error.status` to the error it throws (`api-client.js:70-72` throws a plain `Error` today, a one-line change), `_syncOnce` records it, and `syncConfirmed()` stops at once and returns `false`. Each retry re-issues the changes with a fresh `clientTs` (`nextClientTs()` always issues a larger one), which is how a `{ stale: true }` answer clears. A `true` from a shared queued run covers the caller's change, because `sync()` builds its changes when the run starts and a caller that arrives mid-flight waits for the next run | `systems/global-writer.js` (new; `applyActions` `set_global` in `systems/apply-actions.js` calls it); `state-sync.js` (`sync` 290-302, `_syncOnce` 304-319); `api-client.js` (`put`); `systems/npc-conversation-state.js` (`broadcastGlobalVariableChange`, observer); pattern in `objectives-manager.js`, `inventory.js` |
| S4 | The influence bar: a new DOM component for person-chat, phone-chat, the mail pane and the board's influence section, reading the global and the thresholds, and honouring `influence.display` `bar` and `number` (§8). Not an extension of the world-space health bar | new; `person-chat-ui.js`, `phone-chat-ui.js`; not `ui/npc-health-bars.js` |
| S5 | The social influence service: the watcher on the influence global, the write path behind `se_influence` and the pretext functions (S3's calling-story write included), threshold effects and the latch, the forced `report(character, reason)` path (§8), the `npc_influence_changed` event, and the `#influence:N`, `#influence_gained/lost[:N][:reason]` (N optional, default 10, §8) and `#report:<reason>` tags for social characters, handled once in the shared tag processor that both chats and the mail runner use. The idempotency ledger is scoped per run (§8) | new `systems/social-influence.js`; `chat-helpers.js` `processGameActionTags` (the live processor: `person-chat-conversation.js` is not loaded and is not edited); `phone-chat-conversation.js` (used by both chats); `person-chat-minigame.js`, `phone-chat-minigame.js` |
| S6 | The mail runner (§10), doing the loader's sync steps in order, with a fresh idempotency ledger per run | new; modelled on `phone-chat-conversation.js` `_preloadOpeningOnce` |
| S7 | Exclude the `email_` prefix from `recordInkVariables` / `exportNpcInkVariables`; set engine-written variables after restore and sync in every loader | `systems/npc-conversation-state.js`; `person-chat-minigame.js` (restore then sync), `phone-chat-minigame.js` |
| S8 | Register headless email records at game start from `social.characters.*.emailRecord` and make every lookup that today searches only `rooms.*.npcs` search them too: the client registration, the ink endpoint, `find_npc_in_scenario`, which `game.rb` defines twice (645 and 1281; Ruby keeps the later one, so keep one and make it the helper), the NPC item validation behind `#give_item`, `scenario_npc_ids` (`game.rb` 1817), and the validator's phone checks (`validate_scenario.rb` 2345-2350 for the `phoneId` check, 2353-2355 for the required phone `storyPath` and 676-680 (`ink_files_to_check`) where story files are collected for compile, which must include the headless records; the KO check at 1110 and the "phone NPCs setting global variables" check at 2583 iterate `room['npcs']`, so they need the same helper). Prefer one helper (`scenario_npc_records`) that returns room NPCs plus headless records | `systems/npc-lazy-loader.js`; `core/game.js` start-room registration; `games_controller.rb` ink lookup (1966-1984); `app/models/break_escape/game.rb`; `scripts/validate_scenario.rb` |
| S9 | Mail scheduler, `mailState` persistence (§10a), notification and the message-list renderer | `npc-manager.js` tick loop; `state-sync.js` `buildPlayerSections`, `KEYED_SECTIONS` (`mailState` is a keyed section, one key per message `mailboxes.<box>.<msgId>` and per thread `threads.<character>:<accountId>`, seeded mail as stubs, §10a), `confirm()` (skips any section the server lists in `notSaved`, for `mailState` and `phoneState` alike), `flush()` (`mailState` placed immediately after `globalVariables` in the first reduced list); job change detection compares job ids and `accountId`/`msgId` only, as `timedMessages` diffs its `pending` ids (state-sync.js:218-227), because `remainingMs` counts down every tick and would otherwise make `jobs` changed on every sync; `remainingMs` rides along with any other change; `games_controller.rb` `merge_last_write_wins_sections` (collects refused sections as `notSaved`), bootstrap; `game.rb` `merge_mail_state!` (upsert and delete by message id and thread key; trim never drops a stub), `merge_phone_state!` as the model; `core/game.js` restore (the scheduler builds from the scenario, then applies the save) |
| S10 | The lockout: stored in the declared globals `<character>_lockout_until` and `<character>_lockout_channel` (§8), so it rides `globalVariables` persistence and needs no server section. The check on person-chat, phone-chat, mail and the `callId` starter (refuse before `pretext-prep` opens, so a locked-out student never fills in a pretext card first), and the lift (which writes `recoverTo` silently, clears the latch and the band flags) | `systems/interactions.js` NPC sprite branch and the `phone` `callId` branch; `systems/social-influence.js`; `phone-chat` and mail entry points |
| S11 | Validator, schema and CI. **Lints:** the top-level `social` key; the `social.characters` lints (synced vars declared, `VAR`s match, lockout has an expiry or a route, thresholds ordered, `recoverTo >= highest effect threshold at + rearmMargin`, `clearOnRearm` only on booleans, `influence.display` and `social.influenceDisplay` hold only the keys `bar`, `number` and `pip` with boolean values (a warning when `number: true` sits beside `bar: false`), a `reports` threshold on any character with call data); **declared globals:** for every character `<character>_influence` and `<character>_latched`, the band-flag and report globals, both lockout globals for a character with a `lockout` effect, and every `setGlobal` effect target are declared in `globalVariables` and are not imported (an undeclared name is silently not synced to ink, `npc-conversation-state.js:362-372`); the `se_intel_*`, `se_report_state`, `se_landing_pages` and `se_landing_drafts` declarations; template/slot checks; `on_email` and `email_*` VAR checks; contact and readiness consistency (§11); the mail-client checks owned by `01` N18 (account, device, mailbox, highlight and `deliverAt` data); the brand/host lint over exactly the **lint field list** in §11; `minigame-data-schemas.json` entries; no `intel_*` rule applied to other missions; a **warning** (not an error) when a target's `factorStrings` entry supplies its own `fail` string and has no `redFlag` key at all (`redFlag: null` means "deliberately none" and raises no warning; `04` "Scenario-authored data"); every `EXTERNAL` declared by a social story has an ink fallback function of the same name (S1); an aim `unlockCondition` with any key other than `aimCompleted`, `aimsCompleted`, `globalVariable` and `equals` is an error, because `isUnlockConditionMet` returns `true` for anything it does not recognise (`objectives-manager.js:688-701`, the final `return true` at `:700`), so a numeric comparison on an aim would leave it always unlocked; object `id`s are unique across the scenario's rooms, and a takeable `mail_terminal` must be a room object with such an id, because the unlock endpoint finds a locked object only in `rooms[*].objects`, first hit by id or name (`game.rb` `validate_unlock`, rooms loop at 1092-1105); a missing `assets/objects/<type>.png` for one of the social object types (§11 "Pointers") counts as a social lint error, so `--strict-social` fails on it (the existing check only prints "❌ INVALID", `validate_scenario.rb:1695`); a check or episode shell's starter `conclusionTaskId` names the task its host NPC's mapping completes (§11 "Reopen re-emits"). **Exit behaviour (accurate today):** the validator exits 1 when the `json-schema` gem is missing (`validate_scenario.rb:34`), on bad arguments (`:4858`), on a directory-structure failure (`:4880`), on a structure error (`:4928`), an ink compile error (`:4964`, skipped by `--skip-ink`), a schema error (`:5081`), and on any uncaught `StandardError` (`:5131-5136`); every finding from the `check_*` functions, including the "❌ INVALID" common issues such as a missing object sprite (`:1695`), is printed and the run exits 0 (`:5130`). A **social-lint mode**, `--strict-social`, makes it exit 1 on any social lint error as well. **CI job** (one job, both runtimes): `ruby/setup-ruby` with the repo's Ruby version, `bundler-cache` and `BUNDLE_BUILD__SQLITE3: "--enable-system-libraries"` in the step env, preceded by the same `apt-get install sqlite3 libsqlite3-dev` step the existing `lint` and `test` jobs use (copy from `ci.yml`); `actions/setup-node` (Node 20, matching the `jsdom` release chosen in `07` N3); `npm ci`. **`package-lock.json`:** it is gitignored (`.gitignore:43`) and untracked, so `npm ci` has nothing to read on a fresh checkout; this item removes that `.gitignore` line, regenerates the lockfile after adding `jsdom`, and commits it (`npm install` in CI is not reproducible and is not used). Then the Node tests **under Bundler**: `bundle exec node --test test/js/validator-*.test.mjs test/js/social-*.test.mjs`. `bundle exec` puts Bundler's `RUBYOPT` in the environment of the plain `ruby` that each validator test spawns, so that child can load `json-schema`; without it every validator test would fail. The tests fail, not skip, under CI when Ruby or the gem is missing. Every test of a social module is named `test/js/social-<module>.test.mjs` so the glob runs it: the pure-module unit tests `social-phish-rules` (`04`), `social-triage-scoring` (`05` N4), `social-pretext-judge` (`06` N1) and `social-intel` (`02` N2), and the safety tests `social-landing-page-model` (scorer and `betterVictim`, `07` N2), `social-landing-page-render` (renderer DOM safety, `07` N3), `social-landing-page-guard` (runtime guard, `07` N6b) and `social-osint-address-bar` (address-bar formatter, `02` N9); `package.json` gains a `test:social` script with the same file list. **No test runs the validator CLI in a way that rewrites tracked files:** tests call the lint functions in-process through `ruby -e 'require validate_scenario.rb'` (as `test/js/validator-carry-over.test.mjs:13-23` does) or pass `--no-graph --skip-ink`, never the bare command line. Then a loop of `bundle exec` validator runs over **only the scenarios that carry a `social` key** with `--strict-social --no-graph --skip-ink`, then `git diff --exit-code` to prove no tracked file was rewritten (`--skip-ink` stops inklecate writing compiled `ink/*.json` beside the sources; because it also skips `check_ink_files`, the social ink lints parse the `.ink` text directly and do not read compiled output). The landing-page lint tests the **hostname only** for the `.example` suffix, runs the allowlist on the **raw labels first**, then folds and matches the denylist (§11); it also checks that each page has at least one `targets` key (exactly one in the lab) | `scripts/validate_scenario.rb` `known_top_level` and the `npcType` branches; `scripts/scenario-schema.json`; `scripts/minigame-data-schemas.json`; `scripts/ink_runtime_check/`; `.github/workflows/ci.yml`; `.gitignore`; `package.json` |
| S12 | **Return to.** `startMinigame(scene, container, { returnTo: { sceneType, params }, ... })`: `endMinigame` calls `returnTo` after `onComplete`, on a normal exit only. A parent that launches a child sets `suspended: true` in its params so its `onComplete` ignores the `onComplete(false, null)` that `startMinigame` fires when it ends the running minigame (the framework skips that call for a suspended parent). If the child then ends without reopening the parent (a failure close, an aborted result, a forced close, or a reopen that fails), the parent's `onComplete` runs once as `onComplete(false, { aborted: true, viaChild: true, childSuccess, childResult })`; not when the child's own `onComplete` opened another minigame. The launcher passes the child's required parameters in the call. The parent saves its draft first (mail: `mailState.drafts`; OSINT and board: their `se_*_state` globals; page builder: `se_landing_drafts[<pageId>]`) | `minigames/framework/minigame-manager.js` (`startMinigame`, `endMinigame`); `base-minigame.js` |
| S13 | **World influence pip.** A small bar above a character's sprite, drawn while the character's influence differs from its start value (it hides again if the value returns to the start) and redrawn on `npc_influence_changed`. It reads the same global and thresholds as S4 and is skipped for characters with no sprite, no `social.characters` entry, or a resolved `influence.display.pip` of `false` (§8). It is a sibling of the combat health bar and is replaced by it if `combatHostile` fires | new `ui/npc-influence-pips.js`, modelled on `ui/npc-health-bars.js` (Phaser graphics at the health bar's fixed `overlayDepth(850)`, or at sprite depth + 1 if the pip must sort with its sprite; theme colours from `ui/theme-colours.js`). The health bars follow their sprites because `core/game.js` calls `window.npcHealthBars.update()` every frame (about line 2164), so the pip needs the same: create it beside `window.npcHealthBars` (about line 1679) and call its `update()` beside line 2164 |
| S14 | **Mail devices and found mail.** `mail_terminal` joins `PICKUP_THEN_INTERACT_TYPES` so a takeable one is picked up and then opened from inventory. The `mail_terminal` branch sits **after** the generic lock check (`data.locked === true`, about line 1340, alongside the `phone` branch at about 1355), so a locked terminal asks to be unlocked first. The pickup block (about 776-784) runs `addToInventory` and re-enters `handleObjectInteraction` with no lock test, so a takeable device with `locked: true` must not be auto-picked-up and opened by it until it is unlocked. The server-side unlock endpoint accepts a takeable item, whether or not the player holds it, as long as it is declared in a room's `objects` array: `validate_unlock` looks the target up in `rooms[*].objects` by `id`, `name` or the client-generated id, first hit across rooms (`game.rb:1092-1105`), and never consults the inventory. A terminal that exists only in an NPC's `itemsHeld`, a container's `contents` or at runtime gets "Object not found". Rule: a takeable `mail_terminal` is a room object with a scenario-unique `id`, which the validator checks (S11); no server change; per-device `accountIds` and per-contact `accountIds`; mailbox history from seeded messages with `folder` `inbox` or `sent`; message `highlights` that call `grantFact` or the notes API; `emailKnots`; the open check in the mail bridge; the mail runner's handling of `#compose_reply:<targetId>` and `#mail_later:<seconds>:<knot>`; job kinds `seed` and a `choice` field on ink jobs; `deliverAt` | `systems/interactions.js` (the set at about line 776 and the `mail_terminal` branch); `minigames/mail-client/` (new); the mail runner (S6); `systems/social-intel.js` (`grantFact`); `window.addNote` in `notes-minigame.js` |
| S15 | **`grant_fact { fact }` action.** `applyActions` calls `grantFact(fact)` (`02` N2, `systems/social-intel.js`) and shows a toast ("Noted: <fact label>") beside the note it adds. `triggerOnInteract` runs `applyActions` and returns before any object text shows (`interactions.js:717-721`), so the toast is the stand-in's only feedback. Used by the Phase 1 stand-in grants, by `06` call grants and by the awareness runner | `systems/apply-actions.js` (new case beside `set_global`); `systems/social-intel.js` (`grantFact`); `systems/interactions.js` `triggerOnInteract` (`:719`) |

**Capture note owner.** The capture note has no S-item of its own. `07` N11 owns the model's `captureGranted`, and `01` N6 owns the one call on the mail client's send path (`01` §3 item 2) that stores the victim outcome and adds the note.

Back-compat checklist for any of these changes: `applyActions` `set_global` still emits `global_variable_changed` on every call, same value or not (audit the shipped scenarios that map on it); m01 Derek (`#hostile`, then `#influence:-100`) still
turns hostile through `#hostile`; m02 guards and ward nurse are not turned hostile by ink arithmetic; m04 Vance and m05
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
| Blank filtering | an entry offers to a slot only when its `about` equals the slot's `about`; a slot with no `about` offers only untagged entries | 1, 10 |
| Link id of a built page | `kit_payroll_page` (kit item) with `landingPageId: "payroll_login"` | 11a |
| Landing-page globals | `landing_payroll_login_built` (bool; the mission maps `global_variable_changed:landing_payroll_login_built` to `completeTask`), `landing_payroll_login_domain` (domain option id), `se_landing_drafts` (object keyed by `pageId`: draft choices before the first Score, written on every change and on close; `07` N4) | 11a |
| Landing-page menu | six domain ids (`d_unrelated`, `d_letter`, `d_word`, `d_sub`, `d_vv`, `d_homo`) on the lab's menu; `05` `playerSentAuth` has a row for every one and for each lab account (`guest`, `freemail`; the `freemail` row passes DMARC because it cannot spoof) | 07, 05 |
| Triage set size, by audience | awareness pre/post 10; student lab 8 (6 authored plus 2 `playerSent`); awareness-episode defend sets 5 to 8; Eldritch Hacker 3 to 5 | 05 |
| Non-email triage kinds | `voicemail`, `sms`, `qr`, `page`, `call`, `push` (all exist in `05`; `push` scores Approve as Trust, Deny as Delete, Deny and report as Report, tell `unrequested_mfa_push`) | 05 |
| Triage global prefix | `outcome.setGlobalPrefix`, with a `{stage}` token for staged sets (`triage_{stage}_`, awareness). The lab's set uses the literal prefix `triage_` (stage `mission`, `passPercent: 60`), so its globals are `triage_percent`, `triage_reportRate`, `triage_done` and `triage_pass` | 05 |
| Red-flag meter | per-target `redFlagMeter` boolean; absent takes `mailClient.showRedFlagMeter` | 04 |
| Lab accounts | `guest` (spoofs) and `freemail` (created, `spoofsFrom: false`); no `jed_pc` | 10a |
| `playerSent` | the latest **sent** record to the target, from any mailbox, whose `tells` include `senderTrust` or `senderAuth`; if none, the latest with any tells; landed or not (account from `fromAccount`, domain from `link.domainId`); a later `freemail` send does not shadow a spoofed one; `domainFrom: "landing_domain"` on a `playerSent` entry only; authored messages carry literal auth rows | 10a |
| `linkCredible` | required whenever the target has an `expectedLink`: a send with no link fails it with state `missing`; Lord cannot land without the stage 4 page | 2, 10 |
| Attach after Score | a choice change after Score writes `meetsThreshold: false`, `built: false` until re-scored; Attach needs a current Score | 11a |
| `rearmMargin` | optional character-level integer in `influence`, default 10 | 8 |
| `influence.display` | optional `{bar, number, pip}` booleans, each default `true`; scenario default `social.influenceDisplay`, overridden key by key | 8 |
| `confirm` item | `{ kind: "confirm", step, text }` | 11 |
| Report `question` item (opt-in, 2026-10-22, lab design C1 M2) | `{ kind: "question", id, step, text, options: [{ id, text, correct, blame?, why }] }` on `engagement.report.items`; exactly one `correct`; a wrong pick shows its `why` and can be changed, the right pick locks it; the answer is saved as `se_report_state.answers[id]` (ids only); the step is done when every confirm is pressed and every question answered right | 11 |
| Report builder state | object-valued global `se_report_state` (ids only) | 11 |
| Sync then emit | `deferEmit`, then `stateSync.syncConfirmed()` (back-off, capped attempts, 403 final), then emit; a reopen that finds the done global set and the conclusion task incomplete re-emits; if the connection never comes back, nothing is emitted and the task stays incomplete until a reopen | 11, S3 |
| Validator exit | exits 1 when the `json-schema` gem is missing, on bad arguments, a directory-structure failure, structure, ink compile and schema errors, and an uncaught `StandardError`; other findings print and exit 0; `--strict-social` adds social lint errors | S11 |
| Board pointer | `mode` (one board object per mode) | 11 |
| Call pointer | `callId` on the existing `phone` type; the branch goes above the `interactions.js:1355` gate (engine change, §11); no new sprite | 11 |
| Mode completion | block `onCompleteGlobal`, optional step globals (names in §11) | 11 |
| Readiness globals | `target_ready_<id>`, `osint_done`, set by `evaluateReadiness` from `grantFact` | 11, 4 |
| Reply-delay unit and value | `emailReplyDelay` in seconds of wall-clock countdown; 15 for Pierce, Lord and Hampshire | 8, 10 |
| Sender-auth policy | `senderAuth: { domainPublishesAuth, spoofAligns, dmarcPolicy: none \| quarantine \| reject }`; Pierce's `factorStrings.senderAuth` carries the `p=none` line; Hampshire authors the `pass` side only (the `fail` side is unreachable for her), Lord uses the derived sentence, and any factor a target leaves out uses the §2 canonical string | 2, 7 |
| Missing evidence | an empty blank (or a missing `requiresIntelToAttempt` fact) blocks Send; neutral line "A blank needs evidence you haven't found yet" (defined in `04`) | 10 |
| Band flags | `setGlobal` boolean with `clearOnRearm: true`, recomputed on every influence change, cleared at `at + rearmMargin` or above; ink branches on the returned band | 8 |
| `recoverTo` rule | `recoverTo >= A + rearmMargin` (character's `influence.rearmMargin`, default 10), `A` = highest `at` among `"below"` thresholds with effects (`"above"` thresholds excluded); Priya -30; the lab's Dev none (recovers to `start`, 0) | 8 |
| Lockout storage | globals `<character>_lockout_until`, `_lockout_channel`; no server section; checked before `pretext-prep` | 8, S10 |
| Step binding | each card, pick and question carries `step`; step done when all its items are correct; block global when all steps are done | 11 |
| Plan mode | two single-select picks (objective, measure), globals `plan_objective_done`, `plan_measures_done`; a read-only step (report `results`) has one `confirm` item | 11 |
| Reopened calls | a call can be reopened after any outcome while asks remain; `pretext_<callId>_outcome` holds the latest call and `_lowest` the lowest over every call; grants accumulate; each new call resets influence to `start` (reason `new_call`) | 06, 8 |
| Victim record | written on every send carrying the page, keeping the best outcome (`betterVictim`: submitted > noticed > nothing; a later send replaces it only if ranked at least as high); re-scoring a page never clears it, per 11a | 11a |
| Check missions | `missionConclusion` aim gated on the triage completion global | 11 |
| CI validator loop | one job with Ruby (bundler-cache, sqlite apt packages and `BUNDLE_BUILD__SQLITE3` as the existing jobs) and Node 20; `package-lock.json` un-ignored and committed so `npm ci` works; Node tests run as `bundle exec node --test test/js/validator-*.test.mjs test/js/social-*.test.mjs` and fail rather than skip; the social unit tests are `social-phish-rules`, `social-triage-scoring`, `social-pretext-judge`, `social-intel`, and the safety tests `social-landing-page-model`, `-render`, `-guard` and `social-osint-address-bar`; `test:social` script; no test runs the bare validator CLI; `--strict-social --no-graph --skip-ink` over scenarios with a `social` key; `git diff --exit-code` | S11 |
| Concept cards | `social.conceptCards[] { id, title, text, image? }`; card text is linted for host-shaped tokens, which end `.example`, and the denylist and fold-and-match apply to those tokens and to the brand words in card text; other card prose is reviewed by hand; card prose uses invented brands | 11 |
| Real-brand lint scope | the single field list in §11 ("Lint field list"), including the brand words in concept-card text; the ASCII check reads the raw JSON source, so a `\u` escape passes; host-shaped token = hostname in a URL/address field or a dotted token in card text ending in a known public TLD (not `.example`), excluding file names and `initial.surname` patterns; `.example` tested on the hostname only | 11 |
| Captured sign-in | a first `submitted` outcome adds the page's `capture.note` once (`window.addNote`; the note names the captured account and holds no password value; no global, fact or record field); `capture.address` is linted `.example` | 11a, 07 N11 |
| Builder brands and looks | brands are invented, each with a `look` of `generic` or `parody`; no look copies a real product; the denylist covers domain, address and brand `name` fields and concept-card text (host-shaped tokens and brand words); no profile gate | 07 §1, §7, §8 |
| Landing verdict | a page at or above threshold that fails a gate gets the second verdict row's string (`07` §4) | 07 |
| Defender facts | exactly four with a `reduceNote`: `email_pattern`, `username_convention`, `lord_portal`, `hampshire_careers` | 1 |
| Call outcome | `reported`, else `got_it` if any ask granted in the call, else `walked_away`; `pretext_call_done` set by any granting ask | 06 |
| Band numbers | by threshold id: `wary` 1, `refuses` 2, `reports` 3, `lockout` 4, else 0 | 8 |
| Builder targets | the builder launches only for a target in the page's `targets` map (one in the lab) | 11a |
| `applyActions` emit | `set_global` keeps emitting on every call; change-only emission is for `grantFact` and the social paths | S3 |
| Check and episode shells | a host NPC completes the tasks; the starter writes with `deferEmit`, awaits `stateSync.syncConfirmed()` (back-off, capped attempts, 403 final), then emits the changed events and its done event (S3, `05` N6); a reopen with the done global set and the `conclusionTaskId` task incomplete re-emits; every episode shell has an aim | 11, S3 |
| `mailState` flush | keyed section, one key per message and per thread, seeded mail as stubs; after `globalVariables` in the first `pagehide` fallback, dropped whole (never cut) in the second; a delivery's change is about 1–2 KB, so delivery-then-close within 30 s keeps the reply; a section the server refuses comes back in `notSaved` and is resent | 10a |
| Awareness reply delay | 5 to 8 seconds on an episode's attack target (lab 15) | 10 |
| Hampshire `senderAuth` pass line | account-neutral: "Sent as your own address, so there is nothing to spoof and nothing to fail." | 2 |
| Pretext call globals | `pretext_call_done` from any granting ask's `grants`; `pretext_call_reported` from Dev's `reported` outcome | 06, 11 |
| Lockout clock | real elapsed minutes from `gameClock.elapsedMs()`, stored in `<character>_lockout_until` | 8 |
| `email_pattern` source | the Hunter lookup result `r_pattern` | 1 |
| Sans-serif | Source Sans 3 (Regular and Bold; Latin and Cyrillic subset files), SIL OFL 1.1 with the licence text shipped, self-hosted and unmodified, for all social overlay text | 6 |
| Coherence gate strictness | `pretextRelevant` starts lenient (`minDistinct: 1`, any one distinctive value) and is tuned in playtest; the open check has no strictness setting and stays as specified (sender or subject topic) | `04` |
| Per-target `factorStrings` | `pass`, `fail` and `redFlag` are each optional; absent or `null` uses the §2 canonical text; the validator warns only when an entry supplies its own `fail` string and omits the `redFlag` key entirely (`redFlag: null` means "deliberately none", no warning) | `04`; §2 |
| Homograph display | shown as typed (`domain`, with its Cyrillic letter) in the bundled face; the `browserDomain` punycode form may sit beside it as a teaching contrast; authored data stays ASCII | 6, 7 |
| Thread key | `"<character>:<accountId>"`; `"<targetId>:<accountId>"` for a data-only target (no `threads` entry written) | 10a |
| Created account | `createMenu`; `acct_<id>` and `acct_<id>_choice` | 10a |
| Forced From | template `from_own`, `headerFrom: { account: true }` | 10, 10a |
| Open check | a gate beside the seven factors: opens if `senderTrust` passes or the chosen subject's `topic` is in `interests.topics`; `EvalResult.open { opened, via, subjectTopic }`; `landed` needs it; ink variables `email_opened`, `email_open_via`, `email_subject_topic`; row text from `factorStrings.open` | 2, 3, 7, 10 |
| Subject | chosen from `subjects[{ id, text, topic }]`; the wording is not judged; the topic feeds only the open check; every list has one topic the target does not open | 7 |
| Template choice | two to four templates in the pretext part and wherever the player has a real choice, at most two blanks per template, at least one credible but wrong pretext template for a closed target (`primedFor.trusts` not `["*"]`, §7); an open-inbox target still offers at least two pretext templates; blanks offer held facts only | 10 |
| Reply controls | a thread shows either "Choose a reply" (ink options, unscored) or "Write your reply. This one is judged" (`#compose_reply:<targetId>`), never both; `mailState.threads[key].expects` | 10 |
| One reply, chasers | one reply per send; at most one pending chaser per thread (`#mail_later:<seconds>:<knot>`); timed mail by `deliverAt` on a seeded message | 10 |
| Checklist timing | `mailClient.checklistTiming`: `onSend` (training, the lab) or `withReply` (assessment); revealed when the job completes | 10 |
| Mailboxes and devices | no single inbox: a device offers only its `accountIds`; a found account on a found device reads that character's seeded history and replies as them; takeable `mail_terminal` works from inventory; highlights grant a fact or go to the notepad; no reply-to slot | 10a |
| Influence number | always printed beside the bar, in both modes; the bar also shows on the world sprite once the value has changed (S13); one bar per character | 8 |
| No generated text | no language model anywhere in the game; free text is unscored and unread | 7 |
| Free text in dialogue and mail | none in this build (the first slice); a scenario that allows a free-text box treats it as unscored and unread (§7, §10). Decided here; not an open question | 6, 1 |
| Lab ink and reply features | the lab's mail stories end each reply with no choices, no `#compose_reply` and no `#mail_later`; thread `expects` is never set | 10 |

---

## 14. Contract additions made during the build (back-ported 2026-10-22)

Fields and rules added by the build packets and the lab fix rounds after this document was last
edited, collected here so `00` stays the one contract (packet M4a). Sources are `SE_BUILD_LOG.md`
entries and the code named in each row; corrections to earlier sections are made in place and
marked "back-ported 2026-10-22". The builder rows are taken from the build log and the code; `07` was
not reopened for this back-port. Author documentation: `README_scenario_design.md`, "Social-engineering:
general mechanics" and "Social-engineering: attack mechanics".

**Schema and validator**

| Addition | Contract | Source |
|---|---|---|
| Closed `social` schema | Every block in `scripts/scenario-schema.json` lists the keys the engine or a lint reads; any other key fails the schema, except keys starting with `_` (notes). Schema errors under `/social` are reported as social lint errors, so they fail the run only under `--strict-social` | M3, `316dee74`; `validate_social.rb` `split_schema_errors` |
| Late-option lints | `hintsByFactor`, `labelBy`, `checklistTiming`, `bodyMode`/`freeTextFlavour`, `mirrorToBehavior` and `lockedHint` each have a lint (`scripts/validate_social/options.rb`); `lockedHint` is linted in every scenario | M3; `bodyMode`/`freeTextFlavour` added 2026-10-22 with the free-text body mode |
| Object name collision | A warning when a locked object's lookup key (`id`, else `name`) is matched first by another object's `id` or `name`; the unlock endpoint takes the first hit | M7, `e99068bf` |
| Reserved keys | `people[].kind` is accepted but read by no code (`mailClient.bodyMode` and `mailClient.freeTextFlavour` are built, 2026-10-22, the free-text body mode; `engagement.defender.indicators` is built, 2026-10-22); pretext `tuning.feedbackMode`, `tuning.showTechniqueNames` and `tells.bands` are read by the validator only. `engagement.client` left the schema (2026-10-22; the lab keeps it as the note `_client`). The non-email triage kinds are no longer reserved: since Phase 7 each is drawn in its own style (`triage-kinds.js`) | M4a review; README "Reserved keys" |

**Doors and objects (engine-wide, opt-in)**

| Addition | Contract | Source |
|---|---|---|
| `lockedHint` | A string on a locked room (applies to every door into it), a `rooms[].doors[]` entry or a locked key-lock object. Appended to "Requires key." (no key, no lockpick) and to the two wrong-key alerts. Kept by the bootstrap room filter (`game.rb` `filtered_scenario_for_bootstrap`) and copied onto `doorProperties` by `doors.js`; read by `utils/locked-hint.js` and `unlock-system.js`. A door without it is unchanged | lab fix round 4 (F17), rounds 5–6, M7 (wrong-key path) |

**Influence (§8)**

| Addition | Contract | Source |
|---|---|---|
| New-call reset | Each new pretext call (not a mid-call reload) sets the character to `influence.start` with reason `new_call`; influence does not carry between calls | lab fix round L, M3(d) |
| Boundary event | A `new_call` write always emits `npc_influence_changed`, even at 0 delta; the bar clears its "Last change" line on it | fix round 7 F1, `social-influence.js` `_commit` |
| Turn total on the call bar | In a pretext call the bar's change line is the sum of the turn's deltas, matching the tells row | fix round 8 F1, `InfluenceBar.setChangeFromTurn` |
| `<character>_forced` | Engine-written latch list for forced reports (§11 table) | P4-D, N-01 |
| Lockout refusal text | Person and phone: "<name> flagged the last attempt and won't talk to you for now — give it a while, then try again more carefully."; mail: "<name> will not read your mail right now." A refused send is not judged and not counted | lab fix round 4; `interactions.js` `socialChannelLocked`, `mail-bridge.js` `mailChannelLocked` |
| Lazy lift | A timed lockout lifts when a channel is next checked after the deadline; a `until.global` lockout lifts on that global's change event. Nothing polls | `social-influence.js` `isLockedOut`, `checkLockout` |

**Phishing targets and hints (§7, `04`)**

| Addition | Contract | Source |
|---|---|---|
| Ladder index | `hints[priorFailures - 1]` (clamped), so the first repeated miss shows `hints[0]` | lab fix round 4 H1 |
| `hintsByFactor` | Opt-in map of factor id to a hint string or variants. `senderTrust` reads `{ spoof, ownFrom, forced }` (`forced` for an account that cannot spoof, `ownFrom` for a spoof-capable account that left From as itself, `spoof` otherwise); `linkCredible` reads `{ missing, wrong }`; any other factor reads `spoof`, else `forced`. Only the first failed required factor is keyed | rounds 4–6 H2, H3, F2, F4 |
| Keyed versus ladder | On the first repeated miss the ladder's `hints[0]` shows if the first required factor is the one that failed, else the keyed hint; from the second repeated miss the keyed hint shows; the ladder is the fallback when the failed factor has no keyed hint | rounds 5–6 F3, D6 |
| `result.link` | `'none'` when no page is attached, `'fail'` for a wrong page, so a reply can tell "no link" from "wrong link" | round 6 F7 |
| `phishTargets[].role` | Read only by the report's `labelBy: "role"` resolver, ahead of the contact's role | rounds 7–8 |
| Landed send line | On a landed send with a reply scheduled, the checklist says the step ticks off when the reply arrives | round 8 F6 |

**Pretext calls (`06`)**

| Addition | Contract | Source |
|---|---|---|
| `outcomes.reported.line` | Spoken in the chat before the debrief, and used as the goodbye by an `endConversation` effect | lab fix round 4 |
| Hint ladder advance | Any call that ends without a grant (reported, refused, walked away) counts as a failed attempt in `pretext_<callId>_reports` | Grok P4 review R-5 |
| `got_it` with a refusal | The debrief reads "You got some of what you came for." when an ask was refused in a `got_it` call; outcome and globals unchanged | round 7 F3 |
| Fresh-call transcript | A new call clears the previous call's transcript | lab fix round 4 |

**Intel board and engagement (§11 "Engagement mode blocks")**

| Addition | Contract | Source |
|---|---|---|
| Defender block | Optional `title`, `intro`; `factMitigations[].step` binds a card to a step | P3-D |
| Scope and plan | `scope.intro` (or `brief`), `title`; `plan.objectivesPrompt`, `plan.measuresPrompt`; general `picks[]` of `{ id, step, text, options[] }`; `steps[].title` | P6-C, P6-E |
| Option `text` | Required on every scored option (a blank button otherwise); every scored option carries a `why` | P6-W, P6-G (`lab.rb`) |
| Reopen repair | A board or report that opens with its answers complete and a step or block global unset sets that global | P3-D, P6-B |
| Report fields | `engagement.report` holds `title`, `intro`, `unseenNote`, `labelBy` (`"name"` default, or `"role"`), `steps[]`, `onCompleteGlobal`, `items[]` (confirm) and `findings[] { id, step, text, rootCauses[], controls[] }`; options `{ id, text, correct, blame?, why }`. The report completes only when it declares at least one step | P6-B; lab R4 A9 (`labelBy`) |
| Report call row | Reads `pretext_call_done`, `<character>_reported`, `pretext_<callId>_outcome`, `_lowest` and `_reports`; keys calls by `callId` (falls back to `id`) | P6-T0, round 5 F7 |
| Report page row | Names the domain of the page that landed, from the victim record's `domainId` | lab fix round 4, R1 F9 |
| Report row order | Mail rows follow `phishTargets` order, then any other metrics ids sorted | M7 |

**OSINT (`02`)**

| Addition | Contract | Source |
|---|---|---|
| `se_osint_state.at` | The last place open, so the browser reopens there | P2-A |
| Block `note` | An extra line shown when the block is selected, alone when it grants nothing | P2-A |
| `sites[].name` | The tab label (falls back to `title`, then the id) | P2-T |
| Ready toast | A grant that makes a target ready, from the browser or `grant_fact`, shows "You know enough to approach now — write to them from a mail terminal." | P1-T T8, P2-T F4 |

**Inbox triage (`05`)**

| Addition | Contract | Source |
|---|---|---|
| Set fields | `brief` (Brief step text), `nudges` (factor id to a line under "Weakest skill"), `title` | P3-B |
| Message fields | `forwardedBy` (string or boolean), `auth.summary` | P3-B |
| Done event | `inbox_triage_completed`, emitted after the changed result globals | P3-C |
| Best round | `percent` and `reportRate` keep the best round; `pass` is never cleared | M7 |
| Restart notice | The Brief step says closing or reloading restarts the round; a close before Result is an abort | lab fix round 4 F12 |
| No-flags result | With no flag ticked anywhere, the per-factor breakdown is hidden and one line explains why | rounds 7–8 |

**Mail (`01`, §10a)**

| Addition | Contract | Source |
|---|---|---|
| Trimmed mail | When a save trims read mail to fit the 1 MB cap, the response carries `mailTrimmed` (the dropped `mailboxes.<box>.<msgId>` keys) and the client drops them too | M6, `a04b0ee9` |
| Created accounts | A created account reaches other open mail clients | M6 |
| `pendingMessage` | Whitelisted in the server's mail merge, so a `withReply` checklist is rebuilt after a reload | P6-M |
| Engine globals | `se_mail_applied`, `se_mail_last_account` (§11 table) | P1 fix round 2, lab R1 F11 |

**Landing pages (`07`, §11a)**

| Addition | Contract | Source |
|---|---|---|
| `pretext` | `{ brandId, purposeId, facts[] }` is required on every page (a lint error without it); `facts` are intel ids the builder prefixes with `se_intel_` | lab fix round L B3 |
| Fields | `fields[]` and `extraSensitiveFields[]` are authored on the page | P5-D |
| `{firstName}` | From `social.people[].forms.first` (then `short`, then the first word of `full`) | P5-D |
| Defender strings | `strings` keys `defDomainTier<N>`, `tellFormOrigin`, `tellHoverMismatch`, `padlockDecoy` | P5-E, P5-G |
| `wordings` | Exactly one `match: true`, at least one `slips: true`, and none with both. A `match` wording scores full, a `slips` wording zero, any other half | P5-A, P5-C |
| Victim `domainId` | The victim record keeps the chosen domain option id of the page that was sent | lab fix round 4 |
