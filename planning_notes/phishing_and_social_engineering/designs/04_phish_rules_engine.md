# 04 — Phish-judging rules engine + layered feedback

Status: plan, 2026-10-20. A **system**, not a screen: the mail client (`01`) and the pretext system
(`06`) call it; the triage defender (`05`) is its inverse. This is the component that fixes the
SecGen lab's central flaw — judging and feedback that the learner can't see.
Round 1 reviewed (REVIEW_04_R1.md: 0 blockers, 6 majors, 4 minors) and reconciled against
`00_data_contract.md`, which is now the source of truth for the factor library (§2), the
`EvalResult` contract (§3) and the schema (§7). R1 items folded in below.

**Not covered here (lives in BRIEF §-N/A for a system):** this has no player goal/loop of its own
(those live in the calling minigames `01`/`06`) and **no assets of its own** — the ✓/✗ checklist
chrome is rendered by `01`/`05` (REVIEW_04 minor-10).

## Purpose & audience

Decide whether a crafted message (email or spoken pretext) **lands**, and explain the result in
terms the learner takes away as a red-flag checklist. All three audiences. Maps to book Ch. 7
(phishing) and Ch. 1/App. D (pretext).

## The SecGen flaws this must not repeat

From `README.md`: replies lost off-screen, bot reboot-fragile, rejections that don't say what
failed ("it's unrelated to me"), inverted attachment messages, loose substring matching ("cat"
matches "location"), a no-attachment message still "running the attachment", dead-end victims that
reject everything. Every one is a feedback or determinism failure. The design rules below each kill
one.

## How judging works

A target has a profile of **factors**. Each factor is checked, a result recorded, and the message
**lands only if every required factor passes**. Crucially the engine returns the **full per-factor
result**, not just the first failure — so the feedback is complete.

### Factors

The canonical **seven-factor library** and the single shared **red-flag string per factor** are
defined once in `00_data_contract.md` §2 and imported by both this engine and the defender (`05`),
so attack and defence can never disagree about a tell (fixes REVIEW_04 M2, M4). Three changes from
this doc's first draft, all in §2:

- **`senderAuth` added** (REVIEW_04 M2, book Ch. 11): models at concept level whether a spoof would
  pass SPF/DKIM/DMARC **alignment**. Advisory on the attack side (a spoof can still fool a human if
  delivered, but the player is told it would likely be quarantined — the honest bridge to `01`'s
  "delivery isn't guaranteed"); on the defence side it is the `authentication_fail` the player reads
  in the header panel. One model, both seats.
- **`attachmentPlausible` has three states** `pass`/`missing`/`wrong-type`, each with its own keyed
  reply + red-flag string (fixes REVIEW_04 M1 — the SecGen "running a non-existent attachment" flaw;
  a no-attachment send now returns `missing` with "there's nothing here", never the wrong-type line).
- **`urgencyCalibrated` downgraded to advisory/red-flag only** (fixes REVIEW_04 minor-8): overdone
  urgency does **not** fail a send (real heavy-urgency phishing still lands). Urgency is a tell the
  defender reads and an advisory note to the attacker, never a landing gate — removing the false
  "urgency sweet spot" lesson.

A scenario turns factors on/off per target via `requiredFactors` / `advisoryFactors` (§7). An easy
target needs 2–3; a hard spear-phish needs all, with tighter tests.

### Matching that doesn't cheat (kills the "cat"→"location" flaw)

- **Whole-token + synonym sets**, not raw substring, on word boundaries (kills the "cat"→"location"
  flaw). Author writes concept sets, not bare words.
- **Salience, not count** (fixes REVIEW_04 M5 — the mechanic must teach *relevance*, not keyword
  stuffing). `pretextRelevant` requires **at least one high-salience concept** distinctive to this
  target's story (e.g. `balance sheet` for Pierce), not just any *N* of a broad set. Common-English
  concepts (`role`, `position`, `account`) are marked low-salience and can't carry the factor alone;
  over-broad sets are tightened so `account` doesn't match "accounting/accountable".
- **Coherence gate that does real work.** A body that lists keywords without a coherent ask fails:
  the gate requires the **ask to reference the matched concept** ("can you check the **balance
  sheet**?"), not merely a greeting + any ask. Keyword-dumping ("Hi Melanie, please — balance sheet,
  profit, thanks") does not pass. OQ2's lenient default stays, but the gaming hole is closed.
- Reads the message as the player sees it — **plain text of what was typed**, no HTML-only blind
  spot (a SecGen bug).
- **Optional LLM advisory** (student lab only): scoped strictly to "does this body reference *this
  authored target's* `primedFor` facts" — never a general "how convincing" score and never
  improvement suggestions (that would be a phishing-quality optimiser, the brief's blocker line). See
  `00_data_contract.md` §LLM. Advice-only, default-off, cost-noted (REVIEW_04 M6).

## Layered, legible feedback (the core deliverable)

Three layers, shown together, so the learner always knows why:

1. **In-character reply** (from the target, into the inbox/conversation instantly): "Sorry, who is
   this? I wasn't expecting anything from procurement." — diegetic, sets the scene.
2. **Factor checklist** (the teaching layer): each factor ✓/✗ with a one-line reason that names the
   factor without handing over the answer:
   - ✓ Sender looked trusted
   - ✗ Didn't address me — "Dear User" reads as a mass mail; I expect my name
   - ✗ Not relevant to me — I'm not expecting an invoice this week
   - ✓ Attachment type fit the story
   Both a diegetic phrasing and a **red-flag phrasing** are stored, so the defender side (`05`)
   reuses the exact same strings as "what to look for".
3. **Escalating hints** (after repeated failures on the same target): a nudge → a stronger nudge →
   a near-explicit pointer to the OSINT fact the player is missing. Mirrors the mission hint-stage
   pattern.

No silent pass/fail anywhere. The anti-inversion guarantee comes from the **per-factor, per-state
keyed** reply/redFlag mapping (a `missing` attachment gets the `missing` string, never the
wrong-type one) — not from the empty-string lint, which only catches *blank* output (REVIEW_04
minor-9). Both run: keyed mapping stops wrong strings, the lint stops blank ones.

## Worked example

Target **Melanie Pierce**, Finance. Trusts `j.baker@` (her colleague Jed). Primed (from OSINT) for
a **balance sheet** from Jed on Fridays. Required factors: `senderTrust`, `addressedTo`,
`pretextRelevant` (needs the salient concept `balance sheet`, referenced in a coherent ask — not a
count of common finance words; see "Matching"), `attachmentPlausible` (spreadsheet).

- Player sends From `j.baker@…`, "Hi Melanie, here's the Q3 balance sheet — can you check the profit
  line before Friday?", attaches a spreadsheet. → all four ✓ → **lands**, reply "Thanks Jed, opening
  now", global `phish_pierce_landed=true`.
- Player sends From `j.baker@…`, "Dear User, please see attached", attaches a `.exe`-style item.
  → senderTrust ✓, addressedTo ✗ ("Dear User"), pretextRelevant ✗ (no finance concepts),
  attachmentPlausible ✗ (an executable from a colleague about a spreadsheet is wrong). Checklist
  shows all three ✗ with reasons; hint after 2nd try: "What does Melanie actually expect to receive,
  and from whom? Check what you found about her."

## Scenario-authored data

The **complete** schema (all seven factors authorable, pass-side strings, advisory vs required) is in
`00_data_contract.md` §7 (fixes REVIEW_04 M3, minor-7 — pass strings were previously hardcodable).
The Pierce target, reconciled:

```jsonc
"phishTargets": [
  {
    "id": "pierce",
    "address": "m.pierce@accountingnow.example",
    "displayName": "Melanie Pierce",
    "addressedAs": ["Melanie","Mel","Ms Pierce"],              // accepted forms for addressedTo
    "trusts": [ { "address": "j.baker@accountingnow.example", "name": "Jed Baker" } ],
    "senderAuth": { "domainPublishesAuth": true, "spoofAligns": false },  // §2 senderAuth outcome
    "primedFor": {
      "salientConcepts": ["balance sheet"],                   // ≥1 required (high salience)
      "supportingConcepts": ["finance","profit","loss"],      // low-salience; can't carry alone
      "expectedAttachment": "spreadsheet",
      "story": "a balance sheet from Jed, on a Friday"
    },
    "requiredFactors": ["senderTrust","addressedTo","pretextRelevant","attachmentPlausible"],
    "advisoryFactors": ["senderAuth","urgencyCalibrated"],
    "factorStrings": {                                         // per-target overrides; pass + fail + redFlag
      "senderTrust":        { "pass": "✓ From someone she trusts", "fail": "Who is this? I don't recognise the address.", "redFlag": null },
      "addressedTo":        { "pass": "✓ Addressed her by name",   "fail": "This doesn't even have my name on it.",       "redFlag": null },
      "pretextRelevant":    { "pass": "✓ Relevant to her",         "fail": "I'm not expecting anything like this.",        "redFlag": null },
      "attachmentPlausible":{ "missing": "You said you'd attach it, but there's nothing here.", "wrong-type": "Why would you send me that file type?" }
    },
    "replies": { "landed": "Thanks Jed — opening it now." },
    "hints": ["Think about who Melanie trusts.", "What does she expect to receive, and when?",
              "Re-read Jed's note on the company site about the Friday balance sheet."],
    "outcome": { "setGlobal": { "phish_pierce_landed": true }, "flag": null }
  },
  {
    "id": "lord",
    "address": "s.lord@accountingnow.example",
    "displayName": "Sofia Lord",
    "addressedAs": ["Sofia","Ms Lord"],
    "primedFor": { "salientConcepts": ["payslip","staff portal"], "story": "a payroll/portal prompt" },
    "requiredFactors": ["senderTrust","addressedTo","pretextRelevant","linkCredible"],
    "advisoryFactors": ["senderAuth","urgencyCalibrated"],
    "expectedLink": { "brand": "staff payroll portal", "domainClaims": "the real portal domain" },
    "boostIfGlobal": { "lord_payslip_date_known": "pretextRelevant" },
    "hints": ["She's a new intern — what routine admin is she doing?",
              "She mentioned the staff portal and her payslip.",
              "The service desk can tell you when payslips drop — that detail makes the lure land.",
              "Build a page that looks like that portal (see 07)."],
    "outcome": { "setGlobal": { "phish_lord_landed": true }, "flag": null }
  }
]
```

The `lord` target uses `linkCredible` (fed by the landing-page builder `07`), which is why `07`'s
worked example clones Sofia Lord's **staff payroll portal** (`lord_portal`), not Pierce.

Factors not overridden fall back to the §2 canonical red-flag library (what `05`'s chips use).
`salient`/`supporting` concept sets can be shared at scenario level so authors reuse them.

## Engine wiring

A pure module `public/break_escape/js/systems/phish-rules.js` exporting
`evaluateMessage(target, message) → EvalResult`, where `EvalResult` is defined in
`00_data_contract.md` §3: `{ landed, factors:[{id, pass, state, reply, redFlag, mode}], hintIndex,
advisory }`. `01` renders a transform of it (00 §3); it does **not** invent its own result schema
(fixes REVIEW_01 M1).
The mail client (`01`) and pretext system (`06`) call it; the triage defender (`05`) uses the same
factor definitions to generate "spot the red flag" items, so attack and defence can never disagree
about what a tell is. No new framework hooks — it's called inside the minigames that already use
`startMinigame`/`onComplete`. Outcomes bridge via `set_global` (`apply-actions.js:33`) exactly as in
`01`.

### New engine work

| # | Item |
|---|------|
| N1 | `phish-rules.js` module + the factor library |
| N2 | Concept/synonym matcher (word-boundary, concept-count, coherence heuristic) |
| N3 | Empty-string lint on all authored feedback (no blank interpolation — kills the SecGen blank-message bug) |
| N4 | Hint-stage tracking per target (reuses the mission hint pattern) |
| N5 | (optional, user Q2) advisory LLM plausibility score — advice only, gated, cost-noted |

## Reuse across audiences

Depth is pure data: number of required factors, tightness of concept sets, hint verbosity, meter
on/off. Same engine judges a student's careful spear-phish and an awareness learner's first try.

## Open questions

- OQ1 (→ Q2): the advisory LLM score — default off, flagged for cost.
- OQ2: how strict is the coherence gate before it frustrates? Default: lenient (greeting + ask +
  one relevant concept passes `pretextRelevant`); tune in playtest.
- OQ3: should `redFlagStrings` be mandatory per target so `05` always has material? Default: yes —
  validator warns if a target defines a factor fail without its red-flag string.
