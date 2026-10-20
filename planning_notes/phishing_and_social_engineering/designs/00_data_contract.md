# 00 — Shared data contract & canonical example

Status: plan, 2026-10-20. Written after Round 1 review of 01–04, which found the core docs had
drifted on their shared data shapes and example facts (REVIEW_01..04_R1.md). This doc is the single
source of truth the others reference, so they can't disagree again. If a detail here conflicts with
01–04, this doc wins and the other is corrected.

It defines: (1) the canonical worked-example dataset, (2) the factor library and the shared red-flag
library, (3) the `evaluateMessage` I/O contract and how `01` transforms it, (4) the intel→factor
prerequisite map and readiness rule, (5) the intel persistence & gating contract, (6) the ink/engine
constraints every ink-driven component must respect, (7) schema-completeness requirements.

---

## 1. Canonical example dataset — "AccountingNow"

One fictional company used in every worked example across 01–10, so the recon→phish chain is
discoverable end to end (fixes REVIEW_02 F4, REVIEW_03 minor-4). Authorised engagement by the
fictional firm **Northgate Assurance** (matches `10_lab_social_engineering.md`). All domains end
`.example`; all people fictional.

### Cast (every staff entry carries a stable `id` — the join key for 03's people cards)

| id | Name | Role | Address | Notes |
|----|------|------|---------|-------|
| `pierce` | Melanie Pierce | Finance | m.pierce@accountingnow.example | flagship spear-phish target |
| `baker` | Jed Baker | Finance (Melanie's colleague) | j.baker@accountingnow.example | the trusted sender to spoof |
| `hampshire` | Chris Hampshire | Careers/HR | careers@accountingnow.example | easy target (open careers inbox) |
| `lord` | Sofia Lord | Intern | s.lord@accountingnow.example | hard target (needs link + pretext) |

### Discoverable intel (each has a stable `intel` id; collecting it persists a global — §5)

| intel id | Where found (02 layer) | Fact | Backs factor (§4) |
|----------|------------------------|------|-------------------|
| `email_pattern` | company team page / deck metadata | first-initial.surname@accountingnow.example | senderTrust (compose any address) |
| `username_convention` | deck document metadata (author `mpierce`, app "Microsoft Excel") | AD username = firstinitial+surname | (lab teaching; distinct from email alias) |
| `pierce_role` | company team page | Melanie Pierce works in Finance | addressing/targeting |
| `pierce_trusts_jed` | social post ("Jed's showing me the ropes") | Melanie trusts Jed Baker | senderTrust (who to spoof) |
| `pierce_expects_balance_sheet` | **company-site note** (Jed: "I'll send Mel the Q3 balance sheet Friday") | she expects a balance sheet from Jed, Fridays | pretextRelevant + attachmentPlausible |
| `hampshire_careers` | company careers page | careers@ inbox accepts CVs from anyone | senderTrust (open inbox) |
| `careers_attachment` | careers "how to apply" page | ".odt/.docx only" | attachmentPlausible |
| `tech_stack` | company careers/vacancies page | uses Xero + Office 365 | pretext flavour / lab teaching |
| `lord_intern` | social + team page | Sofia is a new intern | pretext framing |
| `lord_portal` | social post ("sorting my payslip on the staff portal") | she uses a staff payroll portal | linkCredible (what to clone, 07) |

Note the deliberate teaching split the reviewers endorsed: the **email alias** `m.pierce` (how mail
is addressed) is distinct from the **AD username** `mpierce` (from document metadata). Both are
intel; they are not the same fact.

---

## 2. Factor library (canonical) + shared red-flag library

Seven factors. Attack (`04`) and defence (`05`) both import these exact definitions and the one
canonical red-flag string per factor, so "attack and defence can never disagree about a tell" is
true by construction (fixes REVIEW_04 M2, M4; satisfies 05's `redFlagLibrary`/`authentication_fail`
asks; gives 01 its `redFlags`).

| factor id | Required/advisory default | Passes when | Canonical red-flag string (shared) |
|-----------|---------------------------|-------------|-------------------------------------|
| `senderTrust` | required | From matches/plausibly spoofs someone the target expects | "Sender address doesn't match the display name or a known contact" |
| `senderAuth` | advisory (attack) / scored (defence) | The spoof would pass the claimed domain's sender authentication (see note) | "Fails sender authentication (SPF/DKIM/DMARC) — the domain didn't really send this" |
| `addressedTo` | required | Body addresses the target by an accepted name/role | "Generic greeting, not addressed to the recipient" |
| `pretextRelevant` | required | Body coherently references the target's **specific** primed story (not just keywords — see §gate) | "No plausible reason for this message to this person" |
| `attachmentPlausible` | required if attachment | Attachment present **and** type fits the pretext | see three states below |
| `urgencyCalibrated` | **advisory / red-flag only** | — (never fails a send; see note) | "Unexpected urgency or pressure to act fast" |
| `linkCredible` | required if link | Link text/domain credibly matches what it claims (scored by 07) | "Link destination doesn't match the real site (look-alike domain)" |

**Red-flag resolution (explicit):** a factor's `redFlag` in an `EvalResult` (§3) is the per-target
override from `factorStrings` when the author set one, **otherwise the canonical string above**. A
`null` in a per-target `factorStrings` entry means "use the canonical string", never an empty flag —
so `01`'s transform and `05`'s chips always have a non-null label.

### `attachmentPlausible` has three result states (fixes REVIEW_04 M1 — the SecGen no-attachment flaw)

| state | when | reply string (diegetic) | red-flag string |
|-------|------|-------------------------|-----------------|
| `pass` | present, type fits | — | — |
| `missing` | target expects one, none attached | "You said you'd attach it, but there's nothing here." | "Claims an attachment that isn't present" |
| `wrong-type` | present, type wrong | "Why would you send me that file type?" | "Attachment type doesn't fit the stated purpose" |

The empty-string lint (N3) only catches blank output; the anti-inversion guarantee comes from this
per-state keyed mapping, not the lint (fixes REVIEW_04 minor-9).

### `senderAuth` (NEW — fixes REVIEW_04 M2, mirrors 05's seventh factor, book Ch. 11)

Models, at concept level, whether a spoof would survive the claimed domain's sender authentication.
Keep the three mechanisms distinct (they are not interchangeable, and 05 must teach them correctly):
**SPF** checks the sending server is authorised to send for the envelope (return-path) domain;
**DKIM** checks a cryptographic signature added by the signing domain; **DMARC** ties a passing SPF
or DKIM result to the visible `From:` domain (**alignment** is this DMARC step) and tells receivers
what to do on failure. Authored per target/domain as a simple outcome the engine reads (no real
header forging): a scenario states whether the claimed domain publishes these and whether the chosen
From would align under DMARC. On the
attack side this is **advisory** (a spoof can still "land" with a human if delivered, but the player
is told it would likely be quarantined/flagged — the honest bridge to `01`'s "delivery isn't
guaranteed" note). On the defence side (`05`) the same outcome is the `authentication_fail` the
player reads in the header panel. One model, both seats.

### Channel tells for the awareness episodes (extends the library; fixes REVIEW_11 M1)

The seven factors above cover email craft. The awareness episodes (`11`) teach other channels, whose
tells join the **same shared library** (one id, one canonical string, imported by both the attack beat
and the defend scoring) so `11` and `05` never diverge. Some are **defend-side only** (no attacker
mirror in these episodes) — marked so, and the "attack and defence share every tell" claim is narrowed
to "share every tell that has both seats; defend-only tells are flagged".

| id | channel | canonical tell string | seats |
|----|---------|------------------------|-------|
| `lookalike_domain` | link/web | "Link or sender domain is a look-alike of the real one" | both (attack via `linkCredible`) |
| `changed_bank_details` | BEC/invoice | "Payment or bank details changed at the last minute" | both (attack via `pretextRelevant`) |
| `unexpected_qr` | quishing | "A QR code where you'd expect a normal link" | defend-only |
| `unrequested_mfa_push` | MFA fatigue | "An MFA prompt you didn't trigger" | defend-only |
| `smish_shortlink_urgency` | smishing | "Unsolicited SMS with a shortened link and pressure" | defend-only |
| `vish_callback_pressure` | vishing | "Caller discourages you from calling back the official number" | both (attack via `06`) |

An episode author may add further scenario-local tells, but a reusable one belongs here.

### `urgencyCalibrated` downgraded to advisory/red-flag (fixes REVIEW_04 minor-8)

Overdone urgency does **not** fail a send (real phishing with heavy urgency still lands). Urgency is
taught as a **tell the defender reads**, and as advisory feedback to the attacker ("this reads as
high-pressure — a defender would clock it"), never as a pass/fail landing gate. Removes the false
"find the urgency sweet spot" lesson.

---

## 3. `evaluateMessage` I/O contract, and 01's `result` transform

`evaluateMessage(target, message) → EvalResult` (the pure module `systems/phish-rules.js`).

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
  "hintIndex": 1,                       // which hint to surface next (per-target progression)
  "advisory": { "urgency": "high", "senderAuth": "would-fail" }  // non-gating notes
}
```

`01` does **not** invent its own schema. Its `minigame_completed` `result` is a transform of
`EvalResult` (fixes REVIEW_01 M1):

```jsonc
// 01 gameResult (set before complete(true))
{
  "targetId": "pierce",                           // the chosen target
  "landed": true,
  "redFlags": [ /* factors.filter(f=>!f.pass).map(f=>f.redFlag) */ ],
  "outcome": "opened"   // from the target's authored landed outcome (04 outcome.setGlobal), NOT a score
}
```

There is **no aggregate `pretextScore`** in the deterministic engine (the only numeric idea is the
optional, advisory LLM score in §LLM, which is never pass/fail and never an aggregate quality
number). `01` drops `pretextScore`.

---

## 4. Intel → factor prerequisite map, and the readiness rule (fixes REVIEW_03 M1, M2)

Readiness is **not** derived from craft factors (several have no recon counterpart). It is derived
from the OSINT **prerequisites** — the intel ids that must be collected before a target's
recon-fed factors are *achievable*. Only three factors are recon-gated:

| recon-fed factor | satisfied in principle once the player has collected… |
|------------------|--------------------------------------------------------|
| `senderTrust` | the target's trusted-sender intel (`pierce_trusts_jed`) **and** `email_pattern` |
| `pretextRelevant` | the target's primed-topic intel (`pierce_expects_balance_sheet`) |
| `attachmentPlausible` | the expected-attachment intel (part of `pierce_expects_balance_sheet` / `careers_attachment`) |
| `linkCredible` (link targets only) | the portal/brand intel (`lord_portal`) + a built page (07) |

`addressedTo`, `urgencyCalibrated` and `senderAuth` are satisfied by what the player *writes/chooses*
at compose time, so they never appear on the recon-readiness tracker.

**Readiness rule (deterministic, with the exact phrasing):** a target card shows one slot per
recon prerequisite, phrased as an **intel gap, not a factor name**, so it nudges without handing over
the pretext recipe (REVIEW_03 M2):

- not yet collected: "You still don't know **what Melanie expects to receive**."
- collected: "✓ You know she expects a balance sheet from Jed on Fridays."

A card flips to **"Ready to approach"** when all its recon prerequisites are collected. The string is
literally "Ready to approach — you have enough to craft something she'll believe." It never lists the
factors or spells out the message.

Authoring: a scenario may use an explicit map rather than deriving it:
```jsonc
"readinessSlots": [
  { "label": "Who she trusts", "needsIntel": ["pierce_trusts_jed","email_pattern"],
    "goalString": "You still don't know who Melanie would open an email from.",
    "doneString": "✓ She trusts Jed Baker; you know the email pattern." }
]
```

---

## 5. Intel persistence & gating contract (fixes REVIEW_02 F2, F3, minor-9)

Minigame overlays are modal (the manager holds a single `currentMinigame`), so the intel board is
**not** instantiated while the OSINT browser is open. A live cross-overlay event cannot be the feed.

- **Source of truth:** when the player collects intel in `02`, the browser calls
  `applyActions([{ type:'set_global', key:'intel_<id>', value:true }])`
  (`apply-actions.js:33-43`) — which patches `gameState.globalVariables` and emits
  `global_variable_changed:intel_<id>`. `gameState.globalVariables` persists server-side and restores
  on load (`state-sync.js`; `core/game.js:1385`), confirmed robust in REVIEW_03.
- **03 reads persisted globals on open** to rebuild the board (plus the SIEM `globalVariables[STATE_KEY]`
  pattern for any richer per-fact payload). The `intel_collected` event is a live-UI flourish only,
  useful if 03 is ever an always-open panel.
- **Gating is explicit.** Collected intel sets named globals (`intel_email_pattern`, etc.).
  Downstream components gate on them:
  - `01` composer **reveals a target** only once its minimum intel is set (e.g. `pierce` appears once
    `intel_pierce_role`), or marks it "approach from recon first".
  - `04` judging stays independent of collection **by default** (you can send a bad email anytime),
    but a target may set `requiresIntelToAttempt: ["intel_email_pattern"]` if an author wants a hard
    gate. State per scenario whether intel is advisory or gating — never leave it implied.

---

## 6. Ink / engine constraints every ink-driven component must respect (from 06's code reading)

These are real, verified in code; any ink-driven design (06 pretext, mission dialogue hooks) must
honour them:

- **`#set_global` is refused for globals imported from an earlier mission** (`npc-conversation-state.js:329`;
  `chat-helpers.js:466,561`) — nothing to do with conversation type. Declare pretext/phish output
  globals in the scenario's own `globalVariables`, don't import them.
- **`#set_global` splits on `:`** — values containing a colon break. Keep global values colon-free.
- **Ink choice tags are dropped** (`ink-engine.js:69,98` rebuild choices as `{text,index}`), and line
  tags arrive too late to branch on. A suspicion meter can't be tag-driven; hold it in an ink `VAR`
  or via an external function.
- **External functions are a proven pattern.** `bindExternalFunction` (`ink-engine.js:138`) is used
  in shipped code — `person-chat-conversation.js:98-131` and `phone-chat-conversation.js:135-169`
  each bind six. So 06's `pretext_say`/`pretext_ask` are fine (not a spike). **Caveat:** the wrapper
  drops the third argument (`ink-engine.js:142`), so a flag like `lookaheadSafe` can't be passed that
  way — a side-effecting function must either take ≤2 args or the wrapper must be extended, or it
  double-fires on ink look-ahead.
- **Ink state persists across a reopen**, so retryable knots (a re-attempted call) must use sticky
  `+` choices, not once-only `*`.

---

## 7. Schema completeness (fixes REVIEW_04 M3, minor-7)

Every factor must be authorable. The target schema includes, beyond §04's original four:

- `addressedAs: ["Melanie","Mel","Ms Pierce"]` — accepted forms for `addressedTo`.
- `urgency: { advisoryMax: "medium" }` — for the advisory urgency read (never a gate).
- `senderAuth: { domainPublishesAuth: true, spoofAligns: false }` — the §2 senderAuth outcome.
- `expectedLink: { brand, domainClaims }` — for `linkCredible` (feeds/▸ 07).
- Per-factor mode: `requiredFactors: [...]` and `advisoryFactors: [...]` (or `factors:[{id,mode}]`).
- `boostIfGlobal` / `strictIfGlobal` — optional per-target hooks so an earlier pretext call (`06`)
  changes how a later phish lands: `boostIfGlobal: {"reset_granted_pierce": "pretextRelevant"}`
  relaxes a factor when a global is set; `strictIfGlobal: {"helpdesk_alerted": "senderTrust"}` tightens
  one when the mark has been spooked. Lets `06`→`04` chain without hard-wiring. (Requested by 06.)
- `factorStrings: { <factor>: { pass, fail, redFlag } }` — **pass-side** strings too, so the ✓ lines
  aren't hardcoded in the minigame (REVIEW_04 minor-7). Per-target strings override the §2 canonical
  red-flag library for diegetic flavour; the canonical set is the default and what `05`'s chips use.

### LLM advisory scope (fixes REVIEW_04 M6)

If the optional advisory is built, it is constrained to **"does this body reference *this authored
target's* `primedFor` facts"** — never a general "how convincing is this phish" score, never
improvement suggestions that would transfer to a real target. Advice-only, default-off, cost-noted.
Outside that scope it becomes a quality optimiser and crosses the brief's blocker line.

---

## What each core doc must change to match this contract

- **01:** result = the §3 transform (drop `pretextScore`); add the "delivery isn't guaranteed /
  see 05 + senderAuth" clause; correct flag path `POST /break_escape/games/:id/flags`; note
  `minigameName` is the class name; set `this.gameResult` before `complete(true)`; add one rendered
  checklist example; factor out a read-only `mail-reader` shared with 05.
- **02:** add §4-style rules + worked example + feedback for its own judged sub-tasks (derive-pattern,
  search); use the §5 persistence/gating (not a live event); seed Jed Baker + the Friday balance-sheet
  note + `id`s per §1; add a numbered loop; relabel "breach-ish"; fix deck metadata app string.
- **03:** readiness from §4 (prerequisites, intel-gap phrasing, worked example), not craft factors;
  join on §1 `id`; defender mode pairs each fact with a "reduce this" line; drop "always a tab".
- **04:** adopt §2 factor library (add senderAuth, split attachment, downgrade urgency), §2 shared
  red-flag library + per-target overrides, §3 EvalResult, §7 schema + pass strings, §LLM scope;
  tighten `pretextRelevant` (salient-concept requirement + a coherence gate that requires the ask to
  reference the matched concept); add the missing BRIEF sections (goal/loop N/A note, assets none).
