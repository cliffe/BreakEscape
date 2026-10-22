# Lab: Phishing and Social Engineering — Dialogue fix log

Fixer for the dialogue stage, resumable across cycles 2–5. Each cycle is a severity
table with an outcome for every finding, plus the list of every spoken line changed
(old → new) for TTS later. Do not commit (per brief).

Caps this pass (brief): in-person lines 30 words, phone lines 25. The brief governs
over the C1 reviewer's "confirm which cap" note. M4/M5 are optional tightens — done
only if the line reads better shorter.

Snapshot of the lab ink taken before any edit (for `tagdiff --old` structure proof):
`<session scratchpad>/ink_snapshot/*.ink`.

---

## Cycle 1 (fixing DIALOG_REVIEW_C1.md) — 2026-10-22

### Severity table

| ID | Sev | File:line (pre-edit) | Type | Outcome |
|----|-----|----------------------|------|---------|
| M1 | minor | fairbairn.ink:68 | spoken (Ruth) | Fixed — dropped the preachy "Most countries have one like it." tack-on; 28→22 words |
| M2 | minor | tomasz.ink:117 | spoken (Tomasz) | Fixed — 31→24 words, over either cap |
| M3 | minor | ruth.ink:198 | spoken (Ruth) | Fixed — tightened, 29→22 words |
| M4 | minor (optional) | tomasz.ink:119 | spoken (Tomasz) | Fixed — reads better shorter; split "Credit for that." as its own beat, cut filler "a thing"; 27→23 words |
| M5 | minor (optional) | tomasz.ink:123 | spoken (Tomasz) | Kept as-is — already 28w (within the 30 person cap); the tighten ("stops all of it") loses the more specific, teaching-friendlier "to a number on file … stops every line of that". Different debrief branch from M2/M4, so no shared-phrasing inconsistency |
| M6 | minor | tomasz.ink:131 | player choice label (not spoken) | Fixed — "[DMARC off p=none…]" → "[Move DMARC off p=none, plus an external-sender banner.]" to avoid momentarily reading as "turn DMARC off" |
| M7 | minor (trivial) | fairbairn.ink:77 | spoken (Gareth) | Fixed — "fake supplier" → "spoofed supplier" to match the briefing noun (ruth.ink:63) so the callback echo lands |
| W1 | worth-considering | ruth.ink:66–72 / fairbairn.ink payoff | stance var + spoken callback | Done — cheap and clean (see below) |
| W2 | worth-considering | tomasz.ink:128–136 | — | Skipped (per brief; last line before credits, nothing to pay back) |

### W1 — anonymity stance callback (done)

- New global `overpromised_anonymity` added to `scenario.json.erb` `globalVariables`
  (after `fairbairn_payoff_heard`).
- `ruth.ink` briefing: the second opening choice ("nobody will ever know it was them")
  now sets `#set_global:overpromised_anonymity:true` (placed after the spoken lines,
  before `-> brief_close`, matching the sign-knot tag convention). The setter file does
  not read it, so no `VAR` added there (same pattern as `sends_done`).
- `fairbairn.ink`: `VAR overpromised_anonymity = false` declared; Gareth's `payoff` knot
  gains a conditional callback line gated on `{ overpromised_anonymity: … }`. Fixed
  string, no printed variables (he is voiced). It rewards the over-promise moment without
  blocking the player who picked the straight answer.

### Spoken-line changes (old → new) — for TTS

1. **fairbairn.ink — Ruth Adeyemi (M1)**
   - OLD: `That signature is the difference between a test and a crime. Without it, this is an offence under the Computer Misuse Act. Most countries have one like it.`
   - NEW: `That signature is the difference between a test and a crime. Without it, you're committing an offence under the Computer Misuse Act.`
2. **fairbairn.ink — Gareth Fairbairn (M7)**
   - OLD: `She'll read it too, the one who nearly wired that invoice to a fake supplier last quarter. Nothing in it points at her. Thank you.`
   - NEW: `She'll read it too, the one who nearly wired that invoice to a spoofed supplier last quarter. Nothing in it points at her. Thank you.`
3. **fairbairn.ink — Gareth Fairbairn (W1, NEW conditional line)**
   - NEW: `You nearly promised nobody'd ever know, that first morning. I asked for the promise we could keep. You kept it.`
4. **ruth.ink — Ruth Adeyemi (M3)**
   - OLD: `Dev's manager rang Gareth about a dodgy call. Gareth promised to look into it, with a straight face. Give the desk a couple of minutes, then ring back softer.`
   - NEW: `Dev's manager rang Gareth about a dodgy call. Gareth kept a straight face. Give the desk a minute, then ring back softer.`
5. **tomasz.ink — Tomasz (M2)**
   - OLD: `Dev reported one of your calls — credit to him — but you rang back and still got what you needed. A call-back rule to a number on file stops both.`
   - NEW: `Dev reported one of your calls, credit to him. But you rang back and still got it. A call-back rule on file stops both.`
6. **tomasz.ink — Tomasz (M4)**
   - OLD: `Dev gave you what Sofia's email needed, and he reported a call too. Credit for that, but a call-back rule stops it without him noticing a thing.`
   - NEW: `Dev gave you what Sofia's email needed, and reported a call too. Credit for that. A call-back rule stops it without him noticing.`

(M6 is a player-choice label, not a voiced line — not in the TTS list.)

### Checks run

- **compile-ink.sh lab_social_engineering:** 7/7 compiled, 0 failed. The two `-> END`
  warnings (dev_service_desk hang-up, tomasz debrief→credits) are the expected legitimate
  endpoints.
- **tagdiff --old (vs pre-edit snapshot):**
  - `ruth.ink`: 1 structural diff — the intended W1 `#set_global:overpromised_anonymity:true`
    tag. Prose: 1 line changed (M3). Explained.
  - `fairbairn.ink`: 2 structural diffs — the intended W1 `VAR overpromised_anonymity` and
    the `{ overpromised_anonymity }` condition in `payoff`. Prose: M1, M7, new W1 line. Explained.
  - `tomasz.ink`: STRUCTURE UNCHANGED. Prose: 3 lines (M2, M4, and the M6 label reword, which
    tagdiff counts as prose). Explained.
  - No unintended structural changes.
- **dialoguelint:** only finding is `phone-self-prefix` on fairbairn.ink (the Ruth two-hander
  line) — the known false positive (Fairbairn is a person NPC the lint misclassifies as phone);
  NOT actioned, per brief. No line-length errors; all lines within caps (ruth max 25, tomasz
  max 28, phone files ≤ 23).
- **validate_scenario.rb --strict-social:** no errors. Only pre-existing warnings: the three
  `mutuallyExclusiveGlobals` on Ruth's eventMappings (left alone, per brief) and the
  `#speaker:narrator` / no top-level narrator voice-block warning (pre-existing; audio/voice
  layer, not a dialogue finding). The new `overpromised_anonymity` global triggers nothing.
  (The validator regenerated `dungeon_graph.*` as a side effect.)
- **Lab Node tests (test/js/social-lab-*):** 23 pass, 2 fail — both in
  `social-lab-ruth-keys.test.mjs` ("Recon key given on the hub reopen"; "withheld until Gareth
  signed"). **Pre-existing, not caused by this pass.** Verified: HEAD's committed `ruth.json`
  returns the same empty give-item list as the edited one. The test's `reopen` helper replays
  the briefing from the choices' source knot without choosing, so `greeted` never gets set
  (it is set in `brief_close`) and the flow never reaches the `hub`→`keys` tunnel. The
  briefing choice at HEAD is byte-identical to the snapshot, so this is a stale test vs the
  briefing-choice structure, not a dialogue regression. Flagged for the orchestrator.
  `social-lab-ruth-payoff-lines` (3/3), `social-lab-fairbairn-scenes` (1/1),
  `social-lab-ruth-phone-keys` (7/7) all pass.
- **bridge-6 (headless, Node 24 ~/.cache/ms-playwright-go/1.57.0/node, keyless :3001):** FAIL
  58/36, and bridge-r4-door FAIL 1/3. **Pre-existing/environmental, not caused by this pass.**
  All 14 bridge-6 failures are in the report-workstation minigame (`getTestState` null,
  `container` null, `s.confirmed is not iterable`, `spoofed_colleague` undefined) — report
  UI/app-code paths that none of my dialogue edits touch. r4-door fails on `recon_room.lockedHint`
  and the engagement-office door sprites, which I never touched. The working tree has an
  uncommitted change to `public/break_escape/js/core/game.js` (another agent's in-flight work)
  that the running :3001 server reflects. Flagged for the orchestrator; out of the dialogue
  fixer's scope.

### Files changed this cycle

- `scenarios/lab_social_engineering/scenario.json.erb` (globalVariables: + `overpromised_anonymity`)
- `scenarios/lab_social_engineering/ink/ruth.ink` (M3 + W1 set_global) and recompiled `ruth.json`
- `scenarios/lab_social_engineering/ink/fairbairn.ink` (M1, M7, W1) and recompiled `fairbairn.json`
- `scenarios/lab_social_engineering/ink/tomasz.ink` (M2, M4, M6) and recompiled `tomasz.json`
- The other lab ink `.json` files were re-emitted by `compile-ink.sh` but are byte-identical
  to their sources (no `.ink` change).
- `scenarios/lab_social_engineering/dungeon_graph.*` regenerated by the validator (side effect).
