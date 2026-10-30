# E11 "Misdirected data": design review C4 + dialogue review C3

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness
product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical
staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no
runtime language model. E11 is a consequence-flip episode (ENG-04): four unscored sandbox choices, a
montage flip showing where each led, then the built inbox-triage defend half and the built debrief.
Company Carrholme Services; host the DPO Tomasz Wiśniewski; modules core_05 (data protection and
privacy) and core_06 (handling information).

This is the C4 confirmation round after the cross-episode critical-penalty pass and engine batch 12
(BUILD_LOG 2026-10-30). The brief asks: confirm every open C3 finding is fixed, and judge the batch-12
screen changes fresh — the hidden "Verdict locked" banner in immediate mode, the confirm-prompt copy,
the result breakdown, the weakest-skill line after "nothing to grade", and the critical penalties.

Scope read end to end: both shells `scenarios/awareness_e11_misdirected_data{,_defend}/`
(`scenario.json.erb`, `ink/tomasz_wisniewski.ink`); the fragments
`planning_notes/phishing_and_social_engineering/awareness/e11/{mistake,defend}.json`; and the batch-12
engine the on-screen items depend on (`inbox-triage-minigame.js` result block :1472-1491, the
immediate-mode banner hide :210-215, the confirm-prompt copy :903-909, the weakest-skill guard
:1550-1597; `triage-scoring.js` `caughtHow`; the engine sandbox recap / everyday-choices intro
defaults E11 inherits, unchanged since C3).

How the screens were judged: from the authored data traced through the engine, **not from a render**
this pass. The batch-12 behaviours are read off the keys the shells set and the engine defaults
(BUILD_LOG records batch-12 live proof on :3002 with e11 among the sets).

Ran (all E11-only, all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, **no
  social errors or warnings** on either (only the generic lock suggestions).
- `dialoguelint.mjs` both shells: `lines=0` on both (host lines sit inside `{ }` conditional blocks, so
  no length rule fires, as C1/C2/C3 noted); word counts below are by hand.
- `node --test social-awareness-fragment-erb-parity`: **E11 passes** (`ok 12`).
- `node --test social-awareness-rule-of-thumb`: pass (all awareness shells byte-identical).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 0 | 0 | 0 | 0 |
| Nit | 0 | 0 | 0 | 0 |
| **Total** | **0** | **0** | **0** | **0** |

Episode shape unchanged: full = 5 stages (`brief, mistake, flip, defend, debrief`); defend-only = 3
(`brief, defend, debrief`). Defend set `e11_carrholme_desk`, 6 items (5 scored on the data lesson via
the genuine-but-report vehicle, 1 genuine calibration item), one mirror pair (items 3/4), four sandbox
beats, montage flip.

## C3 and batch-12 closure

| C3 item | Verified | Status |
|---|---|---|
| **C3 N1** defend-only welcome says "the DPO" before `defendIntro` expands it, at the 30-word cap | `..._defend/ink/tomasz_wisniewski.ink`: "You're covering the Care Laundry desk inbox. Some is routine, some needs the data protection lead, and some was sent to catch you out. Report anything that looks wrong." = 28 words; the undefined "DPO" is gone (the "DPO" that remains is on the post-completion line, after `defendIntro` has expanded it). BUILD_LOG 10bd9c03c. | **Closed** |

Batch-12 on-screen behaviours, judged for E11:

- **Hidden "Verdict locked" banner in immediate mode.** E11 is `feedbackMode: "immediate"`, so
  `inbox-triage-minigame.js:215` hides the accent banner from sight (kept for screen readers); the
  review card is the visible confirmation. This is the fix for the three B2 testers (E11 among them)
  who read "Verdict locked" as the whole response. Correct for E11.
- **Confirm-prompt copy.** `confirmPrompt: true`; the no-tick line now reads "Nothing ticked. Tick what
  you noticed, or press Confirm again to lock your answer as it is." (`:909`), which no longer reads as
  a required second step (B2 #7). Correct.
- **Result breakdown.** `caughtBreakdown: true` and `handledRightLabel: "Routine messages you handled
  yourself, rightly"` are set (`defend.json:40-41`, both shells `:82-83`), with `phishCaughtLabel:
  "Items you reported, checked or deleted"`. E11 keeps the literal "Delete" verdict, so the breakdown's
  "deleted" word is right and there is no relabel mismatch (the E10 case). The "5 of 5 with 6 on screen"
  confusion (B2 #4) stays answered.
- **Weakest-skill line after "nothing to grade".** The per-factor breakdown and weakest pointer sit
  inside the `namedAnyFlags` guard (`:1566-1597`), so a learner who ticked nothing sees only the
  "nothing to grade" line with no weakest line after it. Correct (batch-12 item 3).
- **Critical penalties.** `scoring: { criticalPenalty: 5, criticalPenaltyCap: 10 }` in both shells, so
  the data items' critical misses cost at most 10 and a rushed round is no longer zeroed.
- **Sandbox recap and everyday-choices intro.** Unchanged from C3: E11 authors no override, so it
  inherits the engine's "...not scored, but the debrief comes back to any worth a second look..." intro
  and the `sandboxRecap` under "Choices worth a second look". Both still correct.

## What works

- **Every C2/C3 finding and every prior blind/playtest finding stays closed in the files**, and all five
  batch-12 on-screen behaviours land correctly for E11 (set or inherited).
- **The consequence-flip earns its place and the facts track the modules**: item 1 breach-to-DPO, item
  2 police impersonation, item 4 any-form SAR, item 5 inbound breach, item 6 front-line contact-detail
  update; the marketing-export and redaction sandbox beats are core_05/06's own examples.
- **The genuine-but-report vehicle is the right call and is documented** (`isPhish: true` with
  `kindLine`/`missLabel` on items 1/4/5, the `_localTells` note), the only way the built awareness
  scorer rewards "report/route this" and marks down Trust.
- **The montage reads cleanly with the engine tag** (safe lines "The version where...", unsafe lines
  lead with the outcome; no "Your choice." duplication), and the no-blame register is clean across
  cards, montage, Monday card, `noBlameLine` and the completion line.
- **Both shells validate with no social warnings; dialoguelint green; parity and rule of thumb pass.**

## Dialogue pass (voiced host lines)

Lines reviewed: Tomasz's ink (both shells), both briefs, scope notes, the defend-set brief,
`defendIntro`, the four sandbox situations and eight option labels, all eight montage lines, the six
defend-item bodies and their supporting copy, the debrief panel/Monday card/no-blame line/allRight, and
the rule of thumb. The register is a calm, precise colleague throughout; no printed variables; UK
English; no em/en dashes. The defend-only welcome now reads at 28 words and drops the forward "DPO"
reference (C3 N1). Every full-shell Tomasz line is ≤24 words. I would change none of them.

Two observations I looked at and did not raise (both carried from C3, unchanged):
- Item 2's call transcript scripts "Can I take your details and call you back?" before the caller
  refuses, which surfaces the pressure tell without giving the verdict away (the player still chooses
  Verify vs Comply). The intended cue, not E13's forced-composer problem.
- Two people named Sam (Whitlow, Whitaker) remain, plus the Sam persona. This is the episode's title
  case (the misdirected overtime sheet to the wrong Sam), disambiguated by the "External recipient"
  chip. A known minor the implementer kept deliberately.

## Verdict per stage

- **brief** — ship. Brief/scope/content note clean.
- **mistake (sandbox)** — ship. Four beats map to core_05/06, one safe option each, labels
  de-telegraphed, the engine "not scored but the debrief comes back" intro inherited.
- **flip (montage)** — ship. Montage facts correct; safe/unsafe tags pair well.
- **defend** — ship. Six items scoring and reading on the data lesson; batch-12 hidden banner, confirm
  copy, breakdown, weakest-skill suppression and critical cap all correct.
- **debrief** — ship. Concept panel, Monday card, byte-identical rule of thumb, no-blame line, and the
  inherited sandbox recap all correct.

**Overall: ship-ready. No blockers, majors, minors or nits. C3 N1 (the defend-only welcome) is closed,
and all five batch-12 on-screen behaviours are set or correctly inherited. E11 is clean.**

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 0 minor, 0 nit (0 total). Facts track core_05/06; no-blame register clean.
- C3/batch-12 closure: C3 N1 closed (defend-only welcome 28 words, "DPO" forward reference dropped);
  hidden "Verdict locked" banner, confirm-prompt copy, `caughtBreakdown`+`handledRightLabel`,
  weakest-skill suppression and critical-penalty cap all correct; sandbox recap + everyday-choices intro
  inherited.
- Blockers: none.
- Majors: none.
- Verdict: ship-ready; nothing open.
