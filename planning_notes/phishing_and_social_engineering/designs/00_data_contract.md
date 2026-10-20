# 00 — Shared data contract and canonical example

Status: plan. This is the single source of truth for the shapes and ids the other docs share. If a
detail here conflicts with 01–11, this doc wins and the other is corrected.

It defines:

1. the canonical worked-example dataset, and the typed intel fact schema
2. the factor library and the shared red-flag library
3. the `evaluateMessage` I/O contract and how `01` transforms it
4. the intel→factor prerequisite map and readiness rule
5. intel persistence and gating, and how intel reaches ink
6. the ink/engine constraints every ink-driven component must respect
7. phish-target schema completeness
8. NPC influence: the per-character global, threshold behaviours and the bar
9. channels: separate stories per channel, state shared through synced globals
10. the email→ink contract, template and slot schema, and the email identity model (§10a)
11. where scenario data lives (`social`)
12. engine work owned by this doc

Code locations are given as file plus function name where a line number would drift. Paths are under
`public/break_escape/js/` unless stated.

---

## 1. Canonical example dataset — "AccountingNow"

One fictional company used in every worked example, so the recon→phish chain can be followed end
to end. The engagement is authorised by the fictional client and run by the fictional consultancy
**Northgate Assurance** (as in `10_lab_social_engineering.md`). All domains end `.example`; all
people are fictional.

### Cast (every staff entry carries a stable `id`, the join key for 03's people cards and for blank values)

| id | Name | Role | Address | Notes |
|----|------|------|---------|-------|
| `pierce` | Melanie Pierce | Finance | m.pierce@accountingnow.example | flagship spear-phish target |
| `baker` | Jed Baker | Finance (Melanie's colleague) | j.baker@accountingnow.example | the trusted sender to spoof |
| `hampshire` | Chris Hampshire | Careers/HR | careers@accountingnow.example | easy target (open careers inbox) |
| `lord` | Sofia Lord | Intern | s.lord@accountingnow.example | hard target (needs link + pretext) |

**Name-form ids.** A name blank holds one form of a person's name. Forms are ids of the shape
`<person>_<form>`, with forms `first`, `short`, `formal` and `full`: `pierce_first` (Melanie),
`pierce_short` (Mel), `pierce_formal` (Ms Pierce), `pierce_full` (Melanie Pierce). The same shape
serves every person (`baker_full`, `lord_first`). The display string is the option's `label`.
Everywhere a doc needs "her name" it uses one of these ids, never a bare `melanie`.

### Discoverable intel

Each fact has a stable bare `id` (below). Collecting it sets the global `se_intel_<id>` (§5). The
`se_` prefix keeps the family clear of the `intel_*` globals that m03, m04 and the SIS missions
already use.

| fact id | Where found (02 layer) | Fact | Backs factor (§4) |
|---------|------------------------|------|-------------------|
| `email_pattern` | derive step in the OSINT browser, from the addresses on the team page | first-initial.surname@accountingnow.example | senderTrust (compose any address) |
| `username_convention` | deck document metadata (author `mpierce`, app "Microsoft Excel") | AD username = firstinitial+surname | (lab teaching; distinct from email alias) |
| `pierce_role` | company team page | Melanie Pierce works in Finance | addressing; supplies her name forms |
| `pierce_trusts_jed` | social post ("Jed's showing Mel the ropes") | Melanie trusts Jed Baker | senderTrust (who to spoof) |
| `pierce_expects_balance_sheet` | company-site note (Jed: "I'll send Mel the Q3 balance sheet Friday") | she expects a balance sheet from Jed, Fridays | pretextRelevant + attachmentPlausible |
| `hampshire_careers` | company careers page | careers@ inbox accepts CVs from anyone | senderTrust (open inbox) |
| `hampshire_cv_backlog` | social post from Chris ("so many CVs to get through before Friday") | Chris is behind on CVs | pretextRelevant (Hampshire) |
| `careers_attachment` | careers "how to apply" page | ".odt/.docx only" | attachmentPlausible |
| `tech_stack` | company careers/vacancies page | uses Xero + Office 365 | pretext flavour / lab teaching |
| `lord_intern` | social + team page | Sofia is a new intern | pretext framing |
| `lord_portal` | social post ("sorting my payslip on the staff portal") | she uses a staff payroll portal (name not given) | readiness for Lord; what to clone (07) |
| `lord_portal_name` | granted by the pretext call (06) | the portal's name and how its notices read | linkCredible, senderTrust (Lord) |
| `lord_payslip_date` | granted by the pretext call (06) | this month's payslip release date | pretextRelevant (Lord) |
| `lord_trusts_portal_sender` | derived from `lord_portal_name` (granted with it) | Sofia expects notices from the portal's own notification address | senderTrust (Lord) |

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
    "source": "company_note",               // the 02 page or search result that grants it
    "provides": [                           // blank values this fact unlocks
      { "type": "document", "value": "balance_sheet", "label": "the Q3 balance sheet",
        "kind": "distinctive", "attachmentKind": "spreadsheet" },
      { "type": "name", "about": "sender", "value": "baker_full", "label": "Jed Baker", "kind": "distinctive" },
      { "type": "date", "value": "friday", "label": "Friday", "kind": "generic" }
    ],
    "reduceNote": "Keep internal routines off the public site."   // 03 defender mode: what to take down
  },
  "pierce_role": {
    "text": "Melanie Pierce works in Finance.", "subject": "pierce", "source": "team_page",
    "provides": [
      { "type": "name", "about": "recipient", "value": "pierce_full",   "label": "Melanie Pierce", "kind": "generic" },
      { "type": "name", "about": "recipient", "value": "pierce_formal", "label": "Ms Pierce",      "kind": "generic" },
      { "type": "name", "about": "recipient", "value": "pierce_first",  "label": "Melanie",        "kind": "generic" }
    ]
  },
  "email_pattern": {
    "text": "Staff addresses are first-initial.surname@accountingnow.example.",
    "subject": "company", "source": "derive_step",
    "provides": [
      { "type": "address", "rule": "initial.surname@accountingnow.example", "label": "an address built from the pattern" }
    ]
  }
}
```

Fields:

- `text`: the sentence shown on the board. `subject`: the card. `source`: the grant point in `02`.
  `reduceNote`: the one-line "reduce this" prompt in the board's defender mode (`03`).
- `provides[]`: one entry per blank value. `type` is the **slot type** (below). `about` optionally
  narrows a name or date to a role in the message (`recipient`, `sender`, `manager`, `start`). `value`
  is the id the judge compares. `label` is the string the option shows. `kind` is `distinctive`
  (specific to this target's story; counts toward `pretextRelevant`), `generic` (true but not
  distinguishing) or `stale` (held but wrong for this target, which the player can still pick).
  `attachmentKind` ties a `document` value to the payload-kit kind (below).
- An `address` entry carries a `rule` rather than a value. The composer builds one address option per
  person the player knows a name for (from any held name entry), with value id `<person>_address`. A
  rule is not a value, so a player who has `email_pattern` but no name for someone cannot build that
  person's address.
- Because a blank offers only held facts, a player holding only right facts sees only right options.
  A wrong choice needs a `stale` entry or a generic value. The lab authors a few (a stale org chart, a
  second "J. Baker" result) so the judgement is real.
- Other facts follow the same shape. `lord_intern` provides `lord_full` and `lord_first` (a `name`
  entry, `about: "intern"`), and `pierce_role` also provides `finance` (a `team` entry). The call in
  `06` uses both.
- The ids in `04` `primedFor.facts` are derived: the facts whose `provides` include the target's
  `distinctiveValues`. They are not a second list to keep in step.

**Slot types** (the vocabulary a template slot or a pretext blank names):

| type | value id shape | example |
|------|----------------|---------|
| `name` | `<person>_<form>` | `pierce_first`, `baker_full` |
| `address` | `<person>_address`, built from a rule | `baker_address` |
| `document` | a short id | `balance_sheet`, `cv` |
| `date` | a short id | `friday`, `mon_6th` |
| `team`, `role`, `floor`, `achievement` | a short id | `finance`, `2`, `helpdesk_award` |
| `portal` | a short id | `staff_portal_name` |
| `attachment`, `link` | a payload-kit item id | `kit_balance_sheet`, `page_payroll` |

A new type is a validator change. Values with colons are not allowed (§6).

**Payload-kit attachment kinds** are one list across `01` and `04`: `spreadsheet`, `document`,
`pdf`, `archive`, `image`. A kit item is `{ id, label, kind }`. `primedFor.expectedAttachment` and the
document value's `attachmentKind` use the same list.

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
| `linkCredible` | required if link | Link text/domain credibly matches what it claims (scored by 07) | "Link destination doesn't match the real site (look-alike domain)" |

**Red-flag resolution:** a factor's `redFlag` in an `EvalResult` (§3) is the per-target override
from `factorStrings` when the author set one, **otherwise the canonical string above**. A `null` in
a per-target `factorStrings` entry means "use the canonical string", never an empty flag, so `01`'s
checklist and `05`'s chips always have a label.

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
policy (`senderAuth: { domainPublishesAuth, spoofAligns }`, §7) says whether the pair would align.
A scenario may override the derived result per target. No real header forging happens. On the attack
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

An author may add scenario-local tells; a reusable one belongs here.

### `urgencyCalibrated` is advisory

Overdone urgency does **not** fail a send (real phishing with heavy urgency still lands). Urgency is
taught as a **tell the defender reads**, and as advisory feedback to the attacker ("this reads as
high-pressure — a defender would clock it"), never as a landing gate.

---

## 3. `evaluateMessage` I/O contract, and 01's `result` transform

`evaluateMessage(target, message) → EvalResult`, in the pure module `systems/phish-rules.js`.

`message` is the composed message: the chosen template id per part with its slot values (§10), the
real sending account, the header From (§10a), and the attachment or link pick:

```jsonc
// message
{ "fromAccount": "guest",
  "headerFrom": { "name": "baker_full", "address": "baker_address" },   // value ids from the From blanks
  "templates": { "greeting": "greet_named", "pretext": "pretext_sheet", "ask": "ask_open_attached" },
  "slots": { "name": "pierce_short", "document": "balance_sheet", "when": "friday" },
  "attachment": "kit_balance_sheet", "link": null }
```

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
// 01 gameResult (set before complete(true))
{
  "targetId": "pierce",
  "landed": true,
  "redFlags": [ /* factors.filter(f=>!f.pass).map(f=>f.redFlag) */ ],
  "tells": [ /* EvalResult.tells, as redFlag strings */ ],
  "outcome": "opened"   // from the target's authored landed outcome (04 outcome.setGlobal), not a score
}
```

There is **no aggregate `pretextScore`** in the deterministic engine. The only numeric idea is the
optional advisory LLM note (§7), which is never pass/fail and never an aggregate quality number.

---

## 4. Intel → factor prerequisite map, and the readiness rule

Readiness is derived from the OSINT **prerequisites**: the facts that must be collected before a
target's recon-fed factors are achievable. It is not derived from craft factors, several of which
have no recon counterpart.

| recon-fed factor | satisfied in principle once the player has collected… |
|------------------|--------------------------------------------------------|
| `senderTrust` | the target's trusted-sender fact (`pierce_trusts_jed`; `lord_trusts_portal_sender` for Lord) **and** `email_pattern` where an address is built |
| `pretextRelevant` | the target's primed-topic fact (`pierce_expects_balance_sheet`; `lord_payslip_date` for Lord) |
| `attachmentPlausible` | the expected-attachment fact (part of `pierce_expects_balance_sheet` / `careers_attachment`) |
| `linkCredible` (link targets only) | `lord_portal_name` (a fact) plus a built page (07) |

`addressedTo`, `urgencyCalibrated` and `senderAuth` are satisfied by what the player fills in or
chooses at compose time, so they never appear on the readiness tracker.

**Readiness rule:** a target card shows one slot per recon prerequisite that is a **fact**, phrased
as an intel gap, not a factor name, so it nudges without handing over the pretext recipe:

- not yet collected: "You still don't know **what Melanie expects to receive**."
- collected: "✓ You know she expects a balance sheet from Jed on Fridays."

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
    { "label": "Who she trusts", "needsIntel": ["pierce_trusts_jed","email_pattern"],
      "goalString": "You still don't know who Melanie would open an email from.",
      "doneString": "✓ She trusts Jed Baker; you know the email pattern." }
  ],
  "lord": [
    { "label": "Her payroll system", "needsIntel": ["lord_portal","lord_intern"],
      "goalString": "You still don't know which staff system Sofia uses.",
      "doneString": "✓ She is a new intern and uses a staff payroll portal." }
  ]
}
```

A slot may add `"needsGlobal": ["landing_payroll_login_built"]` (booleans only) for a non-fact
prerequisite, with a `goalString` that does not name the builder. Use it sparingly, and never for a
prerequisite that sits behind the room the board gates.

---

## 5. Intel persistence and gating, and how intel reaches ink

Minigame overlays are modal (the manager holds a single `currentMinigame`), so the intel board is
not running while the OSINT browser is open. A live cross-overlay event cannot be the feed.

- **Source of truth:** when the player collects a fact in `02`, the browser calls
  `applyActions([{ type:'set_global', key:'se_intel_<id>', value:true }])` (`systems/apply-actions.js`,
  the `set_global` case), which patches `gameState.globalVariables` and emits
  `global_variable_changed:se_intel_<id>`. It emits and flourishes only on the false→true flip.
  `gameState.globalVariables` persists server-side and restores on load (`state-sync.js`;
  `core/game.js`, saved-globals restore). Sync runs every 30 s and on `pagehide`, so a collect is safe
  across a reload; a call to `window.stateSync?.sync()` after a collect closes the window entirely.
- **Declare every fact.** Each `se_intel_<id>` is declared in the scenario's `globalVariables` with
  default `false`. The server persists and the ink sync both test declared names
  (`game.rb` `merge_global_variables!`; `NpcConversationState.isGlobalVariable`). A fact set only at
  runtime and never declared persists nowhere useful and never reaches ink. The validator derives the
  list from `social.intelFacts` and checks it. Docs write bare ids (`pierce_role`); the engine and the
  ink use the prefixed name.
- **`applyActions` does not tell a running ink story.** It writes `gameState.globalVariables` and
  emits an event, but it does not call `broadcastGlobalVariableChange` (as `objectives-manager.js`
  does). A story already cached in `npcManager.inkEngineCache` keeps the old value until its next
  `syncGlobalVariablesToStory`. Engine item S3 (§12) makes `set_global` broadcast; until then every
  runner here syncs before it runs.
- **03 reads persisted globals on open** to rebuild the board (plus the `globalVariables[STATE_KEY]`
  pattern used by the SIEM minigame for any richer per-fact payload). The `intel_collected` event is a
  live-UI flourish only. Each collected fact is also added as a note (`window.addNote`) so the player
  has a searchable evidence log outside the board.
- **Gating is explicit.** Downstream components gate on named globals:
  - `01` reveals a target in the composer only once its minimum facts are set (e.g. `pierce`
    appears once `se_intel_pierce_role` is set), or marks it "approach from recon first".
  - `04` judging is independent of collection **by default** (you can send a bad email at any
    time), but a target may set `requiresIntelToAttempt: ["se_intel_email_pattern"]` for a hard gate.
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
  the scenario's own `globalVariables`; don't import them.
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
  Phone-chat handles none of the `influence*` tags.
- **Ink `DONE` ends a story run.** A mail-channel story is headless and only ever runs from
  `on_email`, so ending there with `-> DONE` is fine. A person or phone story still ends in its hub
  (the authoring guide's rule against ending in `DONE`).

---

## 7. Phish-target schema completeness

Every factor must be authorable. The target schema includes, beyond 04's core fields:

- `addressedAs: ["pierce_first","pierce_short","pierce_formal"]` — accepted name-form ids for
  `addressedTo` (§1). Display strings come from the facts that provide them.
- `urgency: { advisoryMax: "medium" }` — for the advisory urgency read (never a gate).
- `senderAuth: { domainPublishesAuth: true, spoofAligns: false }` — the §2 senderAuth policy for the
  claimed domain. The result is derived from the sending account (§10a); an author may override it.
- `expectedLink: { brand, domainClaims }` — for `linkCredible` (fed by 07).
- Per-factor mode: `requiredFactors: [...]` and `advisoryFactors: [...]` (or `factors:[{id,mode}]`).
- `primedFor`: `{ distinctiveValues: [...], genericValues: [...], minDistinct: 1,
  expectedAttachment: "spreadsheet", trusts: ["baker"] }` — the values the judge compares (§10
  "Judging by slot").
- `boostIfGlobal` / `strictIfGlobal` — optional hooks so an earlier call (`06`) changes how a later
  phish lands: `boostIfGlobal: {"reset_granted_pierce": "pretextRelevant"}` relaxes a factor when a
  global is set; `strictIfGlobal: {"helpdesk_alerted": "senderTrust"}` tightens one when the mark
  has been spooked. Lets `06`→`04` chain without hard-wiring. Where the target is a social character,
  its influence global (§8) is the other route by which an earlier channel affects a later one: the
  rules read it as a global with no mirroring step.
- `factorStrings: { <factor>: { pass, fail, redFlag } }` — pass-side strings too, so the ✓ lines
  aren't hard-coded. Per-target strings override the §2 canonical red-flag library for diegetic
  flavour; the canonical set is the default and what `05`'s chips use.
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
    "influence": { "global": "priya_influence", "min": -100, "max": 100 },
    "syncedVars": ["priya_influence", "priya_knows_sam_okafor"],
    "thresholds": [
      { "id": "wary",    "at": -40, "icon": "wary",
        "effects": [ { "type": "setGlobal", "global": "priya_wary", "value": true } ] },
      { "id": "refuses", "at": -50, "icon": "refuses",
        "effects": [ { "type": "setGlobal", "global": "priya_refusing", "value": true } ] },
      { "id": "reports", "at": -70, "icon": "reports",
        "effects": [ { "type": "setGlobal", "global": "helpdesk_alerted", "value": true },
                     { "type": "endConversation" } ] },
      { "id": "lockout", "at": -90, "icon": "hostile",
        "effects": [ { "type": "lockout", "scope": "channel", "until": { "afterMinutes": 10 },
                       "recoverTo": -50 } ] }
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
| `setGlobal {global, value}` | `applyActions set_global` through the shared writer (§9). Declare the global; do not import it. Values colon-free |
| `endConversation` | closes the open conversation on any channel with the NPC's authored `outcomes.reported` line |
| `lockout {scope, until, recoverTo}` | refuses new conversations. `scope`: `"channel"` (only the channel the player was on) or `"character"` (all channels). `until`: `{ "afterMinutes": N }` (game clock), `{ "global": "name" }` (lifts when that global becomes true) or `null` (permanent; the validator rejects this on a critical-path character, below). `recoverTo`: the influence value set when the lockout lifts (default: the declared start) |
| `combatHostile` | **opt-in.** Calls `setHostile`, the existing combat state (tint, chase, health bar, punch on click). Off by default |
| `toast {text}` | a fixed one-line notice |

- A crossing fires when the value moves from the other side of `at` to this side. It re-arms when the
  value returns above `at` by more than `rearmMargin` (default 10). The latch is stored in the global
  `<character>_latched` (a colon-free comma list of fired ids), so a reload does not re-fire.
- **Existing missions are unchanged.** None of this applies to an NPC that has no `social.characters`
  entry. The legacy `#influence:N`, `#hostile` and the `-50` auto-hostile default stay exactly as they
  are (m01 Derek still fights; m02 guards are not turned hostile by ink arithmetic). The engine does
  not mirror any ink `influence` into the behaviour state, and a character that wants a sprite NPC's
  behaviour state kept equal sets `"mirrorToBehavior": true`.
- **Lockout is not combat.** A `lockout` effect writes a `lockedOut` record (the model is the hostile
  system's `recordHostility`) with channel and expiry. It adds no tint, no chase and no health bar.
  `systems/interactions.js` (the NPC sprite branch that today punches a hostile NPC) shows a "will not
  talk to you" toast instead; phone-chat and the mail client refuse the same way. A lockout lifts by
  the engine, which sets influence to `recoverTo`, clears the latch and the record.
- **A failed attempt must never permanently block a critical path.** The validator enforces this for
  any character that grants a fact or global a required task depends on: every `lockout` has an
  `until` (not `null`), or the grant has an authored alternative route (`alternativeRoute` on the ask:
  another channel or a global that a different beat sets). A scenario may also add its own beat, such
  as an `eventMappings` entry on `global_variable_changed:helpdesk_alerted` that sets the character's
  influence back to its start after a debrief line. `lockout.scope: "channel"` is the default
  recommendation, so a burned phone call leaves the email route open.
- **Every change carries a reason.** Each influence change is tagged with a reason id (a fact id such
  as `manager`, a technique such as `urgency`, or a factor such as `senderTrust`). Writes made by the
  engine path carry `{delta, reason, line}`; an ink write that did not pass through the path is
  recorded with the reason `ink`. The toast, the tells panel and the debrief (06 §4) are drawn from
  that stream.
- **It carries across channels without a single record.** Every channel story of a character declares
  `VAR <character>_influence`, so the value is the same in the person, phone and email stories (§9).
  A clumsy email lowers the influence the next call starts with. `04` can read it through
  `boostIfGlobal` / `strictIfGlobal` directly, because it is already a global.

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
re-run a line after a restore, and the dry runs in `resolveEntryKnot` execute them. The engine keeps
a **turn counter** per session, incremented on each `ChooseChoiceIndex` (the engine has no step index
today). A call's key is `(turn, function, id, ordinal within the turn)`. The same key returns the
stored result without writing again. The same id used on two different turns, such as a sticky
"ring back later", runs both times. Dry runs bind the no-op versions (S1).

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
| Persist | `game.rb` `merge_global_variables!` (declared names only) | Saved on the 30 s sync and on `pagehide`; restored by `core/game.js` |

So two stories that both declare `VAR priya_influence`, with the global declared, already stay equal
when open and re-sync on open. Nothing needs a per-record link. What the plan adds:

- **Which variables sync.** Exactly the names in `social.characters.<id>.syncedVars`, which must all
  be declared in `globalVariables` (the validator checks both lists agree and that each channel story
  that names one declares the `VAR` with the same type and default). `<character>_influence` is always
  implied.
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
mail. Engine item S8: at game start, register a **headless record** (no sprite, `npcType: "phone"`,
a `phoneId` no phone lists, for example `"mail_only"`, so it never shows as a phone contact) for every
`social.characters.*.channels.email` id, and extend the ink lookup to search those entries. The
channel record for a world character's email story is the same kind of headless record, with its own
story file. The scenario schema's `npcType` list (`["person","phone"]`) is unchanged.

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
  held stays empty, and the template cannot be sent until the blank is filled.
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
               { "id": "sender_address", "type": "address" } ] }
}
```

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
  `claimedSender = null`; the strings say which half was wrong. An open inbox (`hampshire`) lists
  `trusts: ["*"]`. With one account that cannot spoof (§10a), the header From is forced equal to the
  account, so only the account's own name can pass.
- `senderAuth` (advisory): derived from the real account and the header From (§2).
- `linkCredible`: scored by `07` from the picked page.
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
2. Restore the record's saved scalar variables (`applySavedInkVariables`), then `restoreNPCState` if a
   thread position is stored for `(npcId, accountId)`.
3. `syncGlobalVariablesToStory`, then attach `observeGlobalVariableChanges`.
4. Set the `email_*` variables with `setVariable` (after steps 2 and 3, §6).
5. `goToKnot('on_email')`, `continue()` until choices or the end, collecting text lines and tags.
6. Apply the tags at once through a **ui-less** mode of `processGameActionTags`: toasts are queued
   for the mail client (or shown as mailbox notifications) rather than popped over whatever overlay is
   open; `give_item` reads the record's `itemsHeld`, so the record must be loaded (S8).
7. Write the lines to the mailbox as one message; store the story position and any choices in
   `mailState.threads[npcId:accountId]`; `recordInkVariables`; reset the `email_` set.

A thread position is stored separately from the phone and person positions, so a mail run never
overwrites a conversation that is open on another channel. Choices under a reply persist only when the
position is stored.

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

Replies arrive after a delay: authored per character (`emailReplyDelay`, default a short in-game
wait), shorter in awareness episodes. The checklist does not wait; only the in-character reply does.

Delivery does **not** reuse `timedMessages`. That machinery delivers fixed text to a phone thread: it
needs a literal `text` at send time, ignores `targetKnot` for an NPC's own messages, treats `delay` as
milliseconds from game start for NPC-level entries, and persists through a server whitelist that
drops entries with empty text. A **mail scheduler** is new work (S9): a job record
`{ jobId, character, npcId, accountId, msgId, vars:{email_*}, knot:"on_email", remainingMs }`, saved
in `mailState`, delivered by the runner above. It reuses the NPC manager's tick loop
(`_checkTimedMessages`) and its "NPC not registered yet, retry next tick" behaviour, but not its
payload or its sink. The countdown uses the wall clock; the time shown on the message uses
`gameClock`, as phone messages do (`gameTime`).

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
      "kind": "given",   "mailbox": "guest",    "spoofsFrom": true },
    { "id": "freemail", "address": "northgate.test@freemail.example", "displayName": "N. Test",
      "kind": "created", "unlockedBy": "acct_freemail",               "mailbox": "freemail" },
    { "id": "jed_pc",   "address": "j.baker@accountingnow.example",   "displayName": "Jed Baker",
      "kind": "found",   "unlockedBy": "acct_jed_creds",              "mailbox": "jed" }
  ],
  "mailboxes": [ { "id": "guest" }, { "id": "freemail" }, { "id": "jed" } ]
} }
```

- **Accounts.** `kind` is `given` (available from the start), `found` (credentials obtained by OSINT,
  a note, a password minigame or a dropped item) or `created` (the player picks an address from an
  authored menu, in the style of `07`'s domain menu). `unlockedBy` is a global (`acct_<id>`), set by
  `applyActions` or a `#set_global` tag, so it saves with `globalVariables`. A `given` account has no
  `unlockedBy`.
- **Access.** A terminal or phone object carries `minigameData.accountIds: [...]`, the way a phone
  object carries `npcIds`. The mail client opens on the first available account and shows an account
  switcher; unread counts are per mailbox.
- **A sent message separates two things.** `fromAccount` is the account really used; it fixes the
  envelope domain and `senderAuth`. `headerFrom` `{name, address}` is the claimed From, built from the
  From blanks (§10), and is free only when the account has `spoofsFrom`; otherwise it is forced equal
  to the account's own name and address.
- **Sender authentication follows the real account.** The domain of `fromAccount` is the envelope and
  signing domain; the domain of `headerFrom` is the visible one; the claimed domain's policy (§7)
  decides alignment. A found internal account can send as that person with authentication that
  passes; a freemail account spoofing the company would not.
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
- **Persistence.** `mailState.mailboxes[id].messages[]` with
  `{ id, thread, from, to, subject, body, fromAccount, headerFrom, time, gameTime, read }`, stored by
  the new `mailState` server section (S9). Seeded messages carry `mailbox`.
- **Triage (`05`).** The defender's inbox is one of these mailboxes; `triageSets[].mailbox` names it.
- **Phones: later.** Multiple phones and a `caller_id` identity for calls (with per-identity claims
  the character accepts or catches) are future work for the Eldritch Hacker strand. In this plan
  there is one player voice on every phone, and the character's beliefs about who is speaking are not
  tracked per identity.

---

## 11. Where scenario data lives

All social-engineering data lives under **one top-level key, `social`**, so the validator learns one
name and the browser reads one object:

```jsonc
"social": {
  "intelFacts": { ... },      // §1
  "templates": { ... },       // §10
  "characters": { ... },      // §8, §9
  "mailClient": { "accounts": [...], "mailboxes": [...], "contacts": [...] },   // §10a, 01
  "osint": { ... },           // 02
  "intelBoard": { "readinessSlots": { ... } },   // 03, §4
  "phishTargets": [ ... ],    // 04, §7
  "triageSets": [ ... ],      // 05
  "landingPages": [ ... ],    // 07
  "pretextNpcs": [ ... ],     // 06
  "engagement": { ... }       // 10
}
```

Objects carry only a pointer in `minigameData` (`mailboxId`, `accountIds`, `triageSetId`, `landingPageId`,
`callId`), so one object type needs one `minigameData` schema entry. Because the top-level scenario
reaches the client unfiltered (`game.rb` bootstrap filtering strips only room contents, `flags` and
`targetFlags`), judged data is readable in the page (§5). Do not use a key named `flags` anywhere
under `social` that sits directly on an object or NPC; the server deletes `flags` arrays there. The
`truth.flags` field in `05` is safe only because it sits inside `social.triageSets`.

---

## 12. Engine work owned by this doc

Items other docs depend on. Each has a code location. The consolidated cross-doc list is in the README.

| # | Item | Where in code |
|---|------|---------------|
| S1 | Bind the social externals (`se_influence`, `pretext_say`, `pretext_ask`) once inside `InkEngine`, with no-op defaults (return 0) when no session is active. Every loader gets them, including the phone preload, the bark path and dry runs. Add stubs to the ink tooling | `systems/ink/ink-engine.js` (`bindExternalFunction`); loaders `person-chat-conversation.js`, `phone-chat-conversation.js` (`_preloadOpeningOnce`, `resolveEntryKnot`), `npc-manager.js` bark path; stubs in `scripts/ink_runtime_check/voicelines.mjs`, `inkcheck.js`, `reopencheck.mjs` |
| S2 | Display-name resolution prefers the conversation's own NPC on a tie | `npc-manager.js` speaker/name lookup |
| S3 | A shared global writer: write `gameState.globalVariables`, `broadcastGlobalVariableChange`, emit `global_variable_changed`. Make `applyActions` `set_global` use it | `systems/apply-actions.js` `set_global`; pattern in `objectives-manager.js`, `inventory.js` |
| S4 | The influence bar: a new DOM component for person-chat, phone-chat and the mail pane, reading the global and the thresholds. Not an extension of the world-space health bar | new; `person-chat-ui.js`, `phone-chat-ui.js`; not `npc-health-bar.js` |
| S5 | The social influence service: the watcher on the influence global, the write path behind `se_influence` and the pretext functions, threshold effects and the latch, the `npc_influence_changed` event, the listener for `npc-influence-change`, and the `#influence_gained/lost[:reason]` tags for social characters in the shared tag processor and in phone-chat | new `systems/social-influence.js`; `chat-helpers.js` `processGameActionTags`; `phone-chat-conversation.js` `processTags`; `person-chat-conversation.js` |
| S6 | The mail runner (§10), doing the loader's sync steps in order | new; modelled on `phone-chat-conversation.js` `_preloadOpeningOnce` |
| S7 | Exclude the `email_` prefix from `recordInkVariables` / `exportNpcInkVariables`; set engine-written variables after restore and sync in every loader | `systems/npc-conversation-state.js`; `person-chat-minigame.js` (restore then sync), `phone-chat-minigame.js` |
| S8 | Register headless email records at game start and extend the ink lookup; load stories independent of room load | `systems/npc-lazy-loader.js`; `core/game.js` start-room registration; `games_controller.rb` ink lookup (the room `npcs`/`objects` search) |
| S9 | Mail scheduler, `mailState` persistence, notification and the message-list renderer | `npc-manager.js` tick loop; `state-sync.js` `buildPlayerSections`; `games_controller.rb` permitted params and bootstrap; `game.rb` `merge_phone_state!` as the model; `core/game.js` restore |
| S10 | The lockout record and its checks on person-chat, phone-chat and mail | `systems/interactions.js` NPC sprite branch; model `npc-hostile.js` `recordHostility`; `state-sync.js` |
| S11 | Validator and schema: the top-level `social` key; the `social.characters` lints (synced vars declared, `VAR`s match, lockout has an expiry or a route, thresholds ordered); the `se_intel_*` declaration; template/slot checks; `on_email` and `email_*` VAR checks; `minigame-data-schemas.json` entries; no `intel_*` rule applied to other missions | `scripts/validate_scenario.rb` `known_top_level` and the `npcType` branches; `scripts/scenario-schema.json`; `scripts/minigame-data-schemas.json`; `scripts/ink_runtime_check/` |

Back-compat checklist for any of these changes: m01 Derek (`#hostile` plus `#influence:-100`) still
fights; m02 guards and ward nurse are not turned hostile by ink arithmetic; m04 Vance and m05
Patricia pairs need no change; `neye-eve.json` is untouched; a story with none of the new externals
or variables loads with no warning; a story that declares the new externals loads from the phone
preload, the bark path and a dry run.
