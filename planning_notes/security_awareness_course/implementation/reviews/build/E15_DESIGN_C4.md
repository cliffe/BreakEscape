# E15 "Shadow IT": design review C4 (+ dialogue)

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no runtime language model. E15 is a
consequence-flip episode (ENG-04): four unscored sandbox choices, a montage flip, then the built
inbox-triage defend half, the unscored Swap Shop sort drill (ENG-11) inside the defend stage, and the
built debrief. Company Tarrowby Logistics; host Nilesh Solanki (IT service desk); module core_13. Method
and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review`/`npc-dialog-review` skills adapted to this kind,
and the C1/C2/C3 reviews plus the P1 persona and B1/B2 blind reports in this folder.

Confirmation round. I judged the files fresh and paid particular attention to what changed since C3: the
defend-only brief wording fix (06bebd257) and the engine batch-12 changes that reach E15 (the reworded
confirm-prompt default, the hidden "Verdict locked" banner, the weakest-skill suppression). I did **not**
run a new bridge this pass; I judged the screens from the authored data, the erbs and the engine code, and
leaned on the C2 render (game 4858, 27/27) and the B2 blind runs for the montage and defend flow. Where a
finding turns on on-screen behaviour I say so.

Ran (all E15-only, all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema and strict-social
  pass; only the generic m01-shaped SUGGESTION noise and the one "no timedConversation" recommended-field
  note every one-room awareness kiosk draws. Nothing social.
- `dialoguelint.mjs` both shells: full `lines=6 median=15 p90=17 max=17`; defend `lines=3 median=25 p90=28
  max=28`. No rule hits; every host line under the 30-word guide.
- `social-awareness-fragment-erb-parity.test.mjs` + `social-awareness-rule-of-thumb.test.mjs`: **22/22
  pass** (E15 fragment↔full-erb parity, including the erb-only `flipMontageByChoice`, among them).
- No em or en dashes in any learner-facing E15 copy, both shells. No raw printed variables.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 0 | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** | **0** |

One nit is carried from C3 (the four-into-four Swap Shop) and marked as a nit below.

## C3 closure

| Item | What was wrong | Verified now | Status |
|---|---|---|---|
| **C3 D1** (minor, needs-user/episode-local) | defend-only Mission Brief popup (`scenario_brief`) said "never marked down" while the kiosk brief said "a real message does take a colleague's time to check" | 06bebd257 updated the generator string and regenerated. The defend-only shell's top-level `scenario_brief` (erb `:4`) now reads "...Reporting or checking when you're unsure is always fine, though a real message does take a colleague's time to check." — matching the kiosk brief (`:409`) and the set brief (`:65`). `grep "never marked down"` across both shells and the fragments returns nothing. Popup and kiosk now say the same thing. | **Closed** |
| **C3 D2** (minor, engine) | `confirmPrompt: true` took the engine default "Confirm again to move on", read as a required second step | batch-12 item 17 reworded the default (`inbox-triage-minigame.js:903-909`) to "Nothing ticked. Tick what you noticed, or press Confirm again to lock your answer as it is." The prompt shows in the open flag sheet before the verdict locks (Next not yet offered), so "Confirm again" is literally the next press and the clause "to lock your answer as it is" makes ticking optional. E15 keeps `confirmPrompt: true` and now reads correctly. | **Closed** |
| **C3 D3** (minor, episode-local, nit) | Swap Shop is four cards into four bins used once each, so the last card is deduced by elimination | unchanged; unscored teaching drill, each drop surfaces its reason, teaching lands either way. Carried as a nit. | **Carried (nit)** |

Both actionable C3 opens are closed. C2's montage "Your choice." prefix fix and the dead `handoff` knot
removal stayed closed; the batch/blind rework (new Choices beats, new Swap Shop cards, critical penalty,
caughtBreakdown, de-phish) stayed sound.

## Batch-12 engine changes, judged for E15

- **Reworded confirm-prompt default.** Covered above (C3 D2). E15 relies on the default, which now reads
  clearly. If the product owner later wants wording that never uses "Confirm again" at all, `confirmPrompt`
  still accepts a string; not needed.
- **Hidden "Verdict locked" banner.** E15 is `feedbackMode: "immediate"`, so the banner is hidden
  visually and kept for screen readers (`:215`); the review card is the visible confirmation. Correct.
- **Weakest-skill suppression after "nothing to grade".** E15 supplies `resultCopy.noFlagsLead`/`noFlags`
  (`:119-120`); a no-tick round shows only those and no per-skill breakdown or weakest-skill pointer
  (`:1550-1601`). Correct.
- **Result-count keys.** E15 carries `resultCopy.caughtBreakdown: true` (`:116`), de-phished
  `teamBadge`/`teamBadgeTitle`/`phishCaughtLabel` ("Caught in time"), `scoreLine`, `criticalLead`,
  `reportedPct`, and `scoring.criticalPenalty: 10`. The grid and bands read for sticks and shortcuts, not
  phish. (Unlike E14, E15 opts into these; both are correct for their respective verdict models.)

## What works

- **The lesson is one a clerk can repeat on Monday, and it tracks core_13.** Found or posted stick to IT
  unplugged; work stays in work places; free is not free; if the official way is slow, ask IT; already
  using a workaround, tell IT, no blame. The Monday card and Nilesh's close carry the shadow-IT habit.
- **The montage pays off the sandbox.** The four `flipMontageByChoice` beats (`:491-508`) have the C2
  "Your choice." prefix gone; each safe line opens on the learner's own road, then the counterfactual
  ("Through remote access the pack never left the firm... The version where it went to a personal inbox
  instead..."). Consequence-first, plain, UK English, no dashes.
- **Sandbox, montage, defend set and Swap Shop are three distinct sets** that each land a core_13 message,
  so the middle no longer runs the same four scenarios three times (B2 D-set complaint answered).
- **The critical penalty is well judged.** One critical item (the posted stick), a 10-point penalty, the
  other risky items non-critical: a careless run reads low but not zero (B2's 23%), and the no-blame-
  critical line lands.
- **The mirror pair is clean and the set does not reward refusing everything in teaching terms.** Row 4
  (free-PDF "everyone uses it" lure) is followed by row 5 (a genuine share-link from
  `fileshare.tarrowby.example` with an end date, Trust), ending on the quick-yes IT reply; the two genuine
  items carry `whyFine` and `falseAlarmCost`, so over-reporting's cost is taught in words. Both shells'
  briefs now carry the honest colleague's-time line.
- **No-blame register throughout**; both shells validate with no social warnings; parity and rule-of-thumb
  suites green; fictional-world hygiene clean (`.example`, drama numbers, `BRAND_ADDITIONS.md`).

## Dialogue pass (voiced host lines)

Both shells read as spoken, unchanged since C3 and not touched by this wave. Nilesh's full-shell lines are
calm-colleague register, carry no printed variable, and sit under the guide (dialoguelint max 17 full, 28
defend). The three defend-only lines run to 28 words, the same ceiling the other defend-only hosts hug; I
would leave them. No spoken line needs a change; the C3 fix was on-screen brief copy, not a host line.

## Notes (not findings)

- **The rule of thumb is phishing-flavoured**, a loose fit for a shadow-IT episode and the blind testers'
  recurring "worst line" comment. Byte-identical across all 20 episodes by design (§17); the shadow-IT
  habit is carried by the Monday card and the host close. Conscious product decision; worth the owner
  knowing it keeps drawing the same comment.
- **"Refuse everything" still scores well** under the no-blame `awareness` profile with `passPercent: 0`,
  met pedagogically by the two genuine items' `falseAlarmCost` and the brief's colleague's-time line.
  Product-wide property; real measurement runs through the `general_v2` check pair.
- **Timing over target.** P1 ~16-17 min and B2 ~17-19 min against a 15-minute full budget; both
  defend-only runs ~9-11 against 8. Product-level pacing note across the wave; no fresh timed run this pass.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass | pass (popup now matches the kiosk brief) |
| mistake (sandbox) | pass (four beats map to core_13; one safe option each; order varied; distinct from the defend set) | — |
| flip (montage) | pass (no "Your choice." prefix; safe lines lead with the taken road) | — |
| defend | pass (six items fair and matched; mirror pair; critical penalty proportionate; de-phished result; confirm-prompt copy now clear) | pass |
| debrief | pass (cards, concept-panel USB reveal, Monday card, no-blame line, accurate team line, rule of thumb) | pass |

**Ship-ready.** Both C3 opens are closed: the defend-only popup now matches the kiosk brief (06bebd257),
and the confirm-prompt default is reworded so it no longer reads as a required second step (batch-12 item
17). The montage, defend set, Swap Shop and result copy all behave as reviewed. What remains is the one
accepted nit (the four-into-four Swap Shop). None blocks ship; a timed playtest is still owed for the
budget check.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 0 minor (1 carried nit).
- Closure: C3 D1 (defend-only popup "never marked down") closed via 06bebd257 — popup now carries the
  colleague's-time line, matching the kiosk brief, no "never marked down" anywhere; C3 D2 (confirm-prompt
  default) closed via batch-12 item 17 — default now "...or press Confirm again to lock your answer as it
  is.", clear at the pre-lock sheet; C3 D3 (four-into-four Swap Shop) carried as a nit.
- Batch-12: hidden "Verdict locked" banner correct (immediate-mode); weakest-skill suppressed after
  "nothing to grade"; `caughtBreakdown`/de-phish/critical-penalty keys all present and consistent.
- Blockers: none.
- Majors: none.
- Verdict: ship-ready. Validators/parity/dialoguelint green; montage + defend flow judged from code and
  the C2 render (4858, 27/27) and B2 blind runs, not a fresh bridge; a timed playtest still owed.
