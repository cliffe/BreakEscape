# Review log — phishing & social engineering designs

Each component runs design-review-improve cycles (fresh read-only reviewer each round, fixer folds
findings in). Up to 5 cycles; stop when a round is clean (nothing above minor). Record every round
as a severity table with finding outcomes (fixed / withdrawn+reason / deferred+reason).

Severity: **Blocker** (unbuildable / unsound / weaponised / factually wrong), **Major** (real design
flaw, hidden reasoning, dead end, wrong engine assumption), **Minor** (polish). See `BRIEF.md`.

## Summary table

| Component | Rounds run | Blockers (raised→open) | Majors (raised→open) | Minors (raised→open) | Status |
|-----------|-----------|------------------------|----------------------|----------------------|--------|
| 01 mail client | 2 | 0→0 | 1→0 | 5→0 | **CLEAN** (confirmed) |
| 02 osint browser | 2 | 0→0 | 4→0 | 5→0 | **CLEAN** (confirmed) |
| 03 intel board | 2 | 0→0 | 2→0 | 4+1→0 | **CLEAN** (confirmed) |
| 04 rules engine | 2 | 0→0 | 6→0 | 4→0 | **CLEAN** (confirmed) |
| 05 triage/defender | 2 | **1→0** | 2→0 | 4→0 | **CLEAN** (confirmed) |
| 06 pretext/vishing | 2 | 0→0 | 3→0 | 4→0 | **CLEAN** (confirmed) |
| 07 landing page | 2 | 0→0 | 3→0 | 2+2→0 | **CLEAN** (confirmed; weaponisation PASS) |
| 10 lab scenario | 2 | 0→0 | 2→0 | 5+1→0 (1 withdrawn) | **CLEAN** (confirmed) |
| 11 awareness episodes | 2 | 0→0 | 3→0 | 6+1→0 | **CLEAN** (confirmed) |
| 12 safetynet fold-in | 2 | 0→0 | 1→0 | 6→0 | **CLEAN** (confirmed) |
| 00 data contract | 2 | 0→0 | 2→0 | 5→0 | **CLEAN** (confirmed) |

**Round 2 core + Round 1 on 05–12 wave: 1 blocker, 16 majors, 33 minors.** The one blocker (05
diverged from the shared factor contract) is a reconciliation, being fixed. Weaponisation re-check on
07: **PASS** (independently confirmed — no runnable artifact, `.example`-only, concept-level only).
Fact-checks (11): Microsoft macro-block **confirmed**; Ho et al. 2025 **fair** (1.7% figure is
primary); Chothia team-discussion claim **overstated → softening**; empathy lesson supported.

**Round 1 core total: 0 blockers, 13 majors, 18 minors — all addressed**, most by creating
`designs/00_data_contract.md` (the shared contract the core docs had drifted from). No blockers at
any point. The one review flag nearest a blocker — whether `07`'s landing-page builder could be real
attack tooling — was raised by its own author and designed out (no HTML/export/capture/network;
`.example`-only domains); R1 review of 07 will confirm it independently.

## Rounds

(Each round appended below as: component, round N, reviewer model, severity counts, findings with
outcomes, verdict.)

### Core docs 01–04 — Round 1 (Opus, read-only). Full findings in REVIEW_0{1,2,3,4}_R1.md.

Fixer: orchestrator (holds the core-doc context). Resolution strategy: create
`00_data_contract.md` as the shared source of truth, then patch each doc. All engine citations in all
four docs were verified correct against code by the reviewers (registerScene, minigame_completed,
set_global, objective setGlobal, persistence via state-sync/game.js). "Model-don't-weaponise" and the
scenario-data boundary were confirmed clean in 01 and 02.

**01 mail client (1 major, 5 minors) — all fixed.**
- M: result schema disagreed with 04's `evaluateMessage` output → **fixed**: 01's result is now the
  §3 transform of `EvalResult`; `pretextScore` dropped.
- m: `minigameName` is class name not scene type → fixed. m: must set `this.gameResult` before
  `complete()` → fixed. m: flag path `/break_escape/games/:id/flags` → fixed. m: §4 wanted a rendered
  example → fixed (added checklist render). m: From-spoofing delivery-not-guaranteed nuance → fixed
  (added senderAuth/05 cross-ref).

**02 osint browser (4 majors, 5 minors) — all fixed.**
- M F1: its own judged sub-tasks lacked rules/example/feedback → **fixed** (added "Its own judged
  interactions" section with worked example). M F2: intel feed relied on a live event across modal
  overlays → **fixed** (persisted-global mechanism, 00 §5). M F3: downstream gate unnamed → **fixed**
  (named globals + explicit gate). M F4: 04's worked example referenced facts 02 didn't seed →
  **fixed** (seeded Jed Baker + Friday balance-sheet note + ids, canonical in 00 §1).
- minors: reuse overstated, "breach-ish" mislabel, deck metadata app string, no numbered loop,
  set_global mechanism → all fixed.

**03 intel board (2 majors, 4 minors) — all fixed.**
- M1: readiness not derivable from 04's craft factors → **fixed** (readiness from OSINT prerequisites,
  00 §4; explicit `readinessSlots`). M2: no deterministic rule/worked example + spoon-feed risk →
  **fixed** (rule + worked example; slots phrased as intel gaps, not factor names).
- minors: numbered walkthrough, join key (shared `id`), defender "reduce this" notes, "always a tab"
  overclaim → all fixed.

**04 rules engine (6 majors, 4 minors) — all fixed.**
- M1: no-attachment case reproduced the SecGen inverted-message flaw → **fixed** (three attachment
  states, keyed strings). M2: missing SPF/DKIM/DMARC factor, "shared factors" claim false → **fixed**
  (`senderAuth` added, 00 §2). M3: schema only covered 4/6 factors → **fixed** (00 §7: addressedAs,
  urgency, senderAuth, expectedLink, advisory flag). M4: per-target red-flag strings made 05's chips
  unstable → **fixed** (canonical factor-level library in 00 §2, per-target override optional). M5:
  pretextRelevant taught keyword-count not relevance → **fixed** (salient-concept requirement +
  coherence gate that requires the ask to reference the concept). M6: LLM advisory could be a quality
  optimiser → **fixed** (scope constrained to this-target fact-matching, 00 §LLM).
- minors: pass-side strings had no schema home (fixed via factorStrings), urgency-backfire claim
  (fixed: downgraded to advisory), lint-vs-inversion claim (fixed), missing BRIEF sections (fixed:
  N/A note).

Verdict after fixes: core majors/minors closed; Round 2 (fresh reviewers) to confirm closure and
check the new `00_data_contract.md` for internal consistency.

### Core cluster — Round 2 consistency (Opus). Full findings in REVIEW_CORE_R2.md.
Closure: 20/21 R1 findings confirmed landed. New: 0 blockers, 2 majors, 5 minors — **all fixed by
orchestrator**:
- M (04 worked example still printed the old "≥2 of {…account}" count rule M5 killed) → fixed.
- M (00 §6 said `bindExternalFunction` is unused — **factually wrong**, it's bound in person-chat &
  phone-chat) → fixed (now "proven pattern", with the 3rd-arg-dropped caveat).
- minors: senderAuth "alignment" wording conflated SPF/DKIM/DMARC → fixed (each mechanism separated,
  alignment correctly attributed to DMARC); redFlag null→canonical fallback unstated → fixed; 03
  Pierce card showed 3 slots but authored 2 → fixed (2 slots); intel-id drift (`tech_stack` missing
  from 00 §1; `lord_intern`/`lord_portal` unseeded in 02) → fixed (added). Also added a `lord` target
  to 04 and `boostIfGlobal`/`strictIfGlobal` hooks to 00 §7 (for 06), and the awareness channel tells
  to 00 §2 (for 11).

### Docs 05–12 — Round 1 (Opus, read-only). Full findings in REVIEW_0{5,6,7}_R1.md, REVIEW_1{0,1,2}_R1.md.
Fixers = the original planner agents, resumed with their review + the updated contract. Severity:
- **05: 1 blocker, 2 majors, 4 minors.** Blocker = diverged from 00's factor namespace
  (`authentication_fail`/`*_fail` vs `senderAuth`/unsuffixed), breaking the shared-tell guarantee →
  reconcile to 00 §2. Majors = divergent red-flag strings, stale "defender-only" note. SPF/DKIM/DMARC
  content confirmed accurate; scoring deterministic, example holds.
- **06: 0 blockers, 3 majors, 4 minors.** Persistence under the wrong state key; worked-example
  arithmetic; external-function wrapper drops 3rd arg. Weak-helpdesk model confirmed sound.
- **07: 0 blockers, 3 majors, 2 minors. Weaponisation VERDICT: PASS.** `.example` lint didn't block
  real brand names (needs denylist); UK domain heuristic wrong for `.co.uk`; worked example on wrong
  target (→ Sofia Lord). Padlock/cert wording confirmed accurate.
- **10: 0 blockers, 2 majors, 6 minors (1 withdrawn).** Lord role contradicted canon; urgency wrongly
  a required gate. VM-less mission confirmed supported in code; critical path solvable.
- **11: 0 blockers, 3 majors, 6 minors.** Shared-library claim too broad; scoring clash with 05;
  Chothia claim overstated. Macro-block + Ho-et-al fact-checks confirmed fair.
- **12: 0 blockers, 1 major, 6 minors.** Remote `unlock_object` won't fire on an unloaded room → gate
  on the phish global / `complete_task`. m01 fold-in otherwise sound and cached-audio-safe.

Orchestrator cross-doc decision (logged): triage scoring is parameterised by `scoringProfile` —
"analyst/lab" (precision scored) vs "awareness" (reporting genuine mail never penalised). Resolves
the 05↔11 clash; 11 uses "awareness".

### Round 3 — Confirmation / closure (Opus, read-only). REVIEW_CONFIRM_SYSTEMS.md, REVIEW_CONFIRM_SCENARIOS.md.
Two consolidated reviewers (systems 00–07, scenarios 10–12) verified every prior finding closed and
checked cross-doc consistency, engine claims, security accuracy and the fact-checks.
- **Systems: 0 blockers, 0 majors, 2 minors → CLEAN.** All ids/globals/factors/examples consistent
  end to end; SPF/DKIM/DMARC + padlock accuracy re-confirmed; 07 weaponisation PASS after its denylist
  fix. Two stale-text minors (03 "three slots"→two; 07 stale "orchestrator adds lord target" + join-key
  wording) → **fixed by orchestrator**.
- **Scenarios: 0 blockers, 0 majors, 2 minors (+1 trivial) → CLEAN.** Critical path solvable; 12's
  remote-unlock fix verified against code; fact-checks confirmed (Chothia softening correct vs the PDF,
  NCSC title "Phishing attacks: defending your organisation" accurate, Ho 1.7% provenance present).
  Minors (10 payslip-date dependency stale vs 04's `boostIfGlobal` + global name; 11 N9 stale
  parenthetical) → **fixed by orchestrator**.

## FINAL STATE: all 11 docs CLEAN (nothing above minor). 0 open blockers, 0 open majors, 0 open minors.
Totals raised across all rounds: 1 blocker, 31 majors, 56 minors — all resolved (1 withdrawn). Nothing
committed (user commits). Implementation-time spikes noted in RESUME.md (not design blockers).
