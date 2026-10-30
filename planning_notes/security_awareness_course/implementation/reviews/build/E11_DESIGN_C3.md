# E11 "Misdirected data": design review C3 + dialogue review C2

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness
product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical
staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no
runtime language model. E11 is a consequence-flip episode (ENG-04): four unscored sandbox choices, a
montage flip showing where each led, then the built inbox-triage defend half and the built debrief.
Company Carrholme Services; host the DPO Tomasz Wiśniewski; modules core_05 (data protection and
privacy) and core_06 (handling information). Method and bar: `REVIEWER_BRIEF.md`, the
`scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, and the prior
E11 reviews, blind reports (B1, B2) and the E9/E11 playtest in this folder.

This is the C3 confirmation round launched with engine batch 12 (BUILD_LOG 2026-10-30). The brief asks:
confirm C2 and the blind/playtest findings are fixed, and look hard at what engine batches 9 to 11
changed on screen (result counts and their new labels, the debrief recap of earlier stages, the
"Episode finished" panel, the everyday-choices intro, the confirm prompt).

Scope read end to end: both shells `scenarios/awareness_e11_misdirected_data{,_defend}/`
(`scenario.json.erb`, `ink/tomasz_wisniewski.ink`); the fragments
`planning_notes/phishing_and_social_engineering/awareness/e11/{mistake,defend}.json`; the spec
`.../episodes/E11_misdirected_data.md`; E11's lines in `gen_e8_e17_shells.py`; the modules
`core_05/core_06 concepts.md` (spot-checked, C2 confirmed faithful); and the engine the batch 9-11
on-screen items depend on (`inbox-triage-minigame.js` result block :1426-1458 + `caughtHow`;
`consequence-sandbox.js:27` and `episode-runner-minigame.js:93` sandbox intro default;
`debrief-view.js` `sandboxRecap` :508-510; `episode-model.js` `sandboxRecap` :236).

How the screens were judged: from the authored data traced through the engine, **not from a render**
this pass. The batch 9-11 behaviours are read off the keys the shells set and the engine defaults.

Ran (all E11-only, all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, **no
  social errors or warnings** on either (only the generic lock suggestions).
- `dialoguelint.mjs` both shells: `lines=0` on both (host lines sit inside `{ }` conditional blocks, so
  no length rule fires, as C1/C2 noted); word counts below are by hand.
- `node --test social-awareness-fragment-erb-parity`: **E11 passes** (`ok 12`); the full erb carries
  `flipMontageByChoice`, the defend-only shell does not.
- `node --test social-awareness-rule-of-thumb`: pass (all 73 shells byte-identical).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 0 | 0 | 0 | 0 |
| Nit | 1 | 0 | 0 | 1 |
| **Total** | **1** | **0** | **0** | **1** |

Episode shape unchanged: full = 5 stages (`brief, mistake, flip, defend, debrief`); defend-only = 3
(`brief, defend, debrief`). Defend set `e11_carrholme_desk`, 6 items (5 scored on the data lesson via
the genuine-but-report vehicle, 1 genuine calibration item), one mirror pair (items 3/4), four sandbox
beats, montage flip.

## C2 and blind/playtest closure

| Finding | Source | Verified | Status |
|---|---|---|---|
| **C2 D1** four unsafe montage lines open "Your choice.", duplicating the engine's "Your call" tag | C2 | `mistake.json:54-67` / full erb `:469-485`: none of the four opens "Your choice."; bodies lead with the outcome. The engine tag carries the framing. | **Closed** |
| **C2 D2** brief "the ordinary calls anyone would under a busy morning" | C2 | `defend.json:235` / full erb `:456` / `mission.json`: "...the ordinary choices anyone would make on a busy morning..." | **Closed** |
| **C2 D4** defend-only host welcome 31 words | C2 | `..._defend/ink/tomasz_wisniewski.ink`: "...some belongs with the DPO..." = 30 words (at the cap). See the nit below for the residual. | **Closed (trimmed); borderline, see N1** |
| **P1 F-E11-1** the breach heads-up scored/worded as "just in case"/"fine"/"let it through" | playtest | Item 1 is now `isPhish: true` (the genuine-but-report vehicle) with `kindLine`/`missLabel`; `reportReply` (`defend.json:112`): "logged as a personal data breach and passed to the DPO...". Report is the full-marks right call, not a hedge. | **Closed** |
| **P1 F-E11-2** data items not scored on the lesson (Trust = 100 on breach/SAR/inbound) | playtest | Items 1, 4, 5 carry scenario-local tells `personal_data_breach`/`data_rights_request` as the scoring vehicle (`isPhish: true`, Report/Verify full, Trust = 0 critical miss, `_localTells` note). Feedback and score now agree. | **Closed** |
| **P1 F-E11-3** "DPO" used ~8 times, never explained | playtest | `defendIntro` (`defend.json:238`): "...the data protection officer (the DPO, who handles personal data mistakes)..."; the brief/cards use "the data protection lead". | **Closed** |
| **P1 F-E11-4** phish-worded verdict cards on data items | playtest | `labels.verdict` hints reworded for a desk ("This one is routine. I would handle it myself." / "This needs someone else to look. I would report it."); `phishCaughtLabel`/`teamBadge`/`handledRightLabel` all data-worded. | **Closed** |
| **P1 F-E11-5** "DPO" in sandbox option + montage | playtest | `mistake.json:34` "the data protection lead needs to agree"; montage `:54` "Three days the data protection lead never had". | **Closed** |
| **P1 F-E11-9** payroll header note jargon ("All three checks passed...") | playtest | `defend.json:158` reworded to plain words: "The message did pass the technical checks, but that only proves which address really sent it, not that the sender is Carrholme..." | **Closed** |
| **P1 F-E11-10 / B2 #9** "Behind every row" repeated + "Nothing to pick over here" | playtest/blind | "Behind every row" appears once (conceptPanel heading, `:466`); the separate module-line duplicate is gone; `strings.allRight` (`:462`) replaces "Nothing to pick over here". | **Closed** |
| **B2 #1** intro promises per-message feedback | blind | `feedbackMode: "immediate"`; BUILD_LOG records batch-11's inbox-brief wording fix (answers saved, not a round restart). No "feedback after each message" promise remains in the fragment copy. | **Closed (engine wording, batch 11)** |
| **B2 #3 / #5** warm-up options give the answer away; debrief doesn't refer back to the choices | blind | Labels state the action only at similar length (`mistake.json:16-43`), safe option 1st/2nd/2nd/1st; the engine `sandboxRecap` now recaps wrong sandbox choices in the debrief (below). | **Closed** |

The known shared-scorer limitation (B1/C2 MI3: "refusing everything" can still score well) is met
pedagogically by item 6 (Trust is the right call) and the immediate per-item feedback, and is the
user's open question in spec §20, unchanged.

## Batch 9-11 on-screen items (the brief's focus)

All present and correct for E11:

- **Result counts and new labels.** `resultCopy.caughtBreakdown: true` and `handledRightLabel:
  "Routine messages you handled yourself, rightly"` are set (`defend.json:40-41`, both shells
  `:82-83`), with `phishCaughtLabel: "Items you reported, checked or deleted"`. The "5 of 5 with 6 on
  screen" confusion (B2 #4) is answered: the caught line now appends the reported/checked split and the
  genuine line is separately labelled. (Note the breakdown would say "deleted" for a `delete` verdict,
  but E11 keeps the literal "Delete" verdict, so there is no relabel mismatch here — unlike E10.)
- **Debrief recap of the earlier (sandbox) stage.** E11 sets no override, so the engine default fires:
  `debrief-view.js:508-510` renders `sandboxRecap` under "Choices worth a second look" with "You chose
  '{chosen}'. The safer move was '{right}'.", built from the beats' `safe` options
  (`episode-model.js:236`). This is the one-line bridge B2 #5 asked for.
- **The everyday-choices intro.** The engine default now reads "...They are not scored, but the debrief
  comes back to any worth a second look..." (`consequence-sandbox.js:27`, batch-12 commit cbe94e8ab,
  which names E11). E11 authors no override, so it inherits the corrected line.
- **The "Episode finished" panel.** Engine default `finishedHeading`/`finished` (batch 10); B2 saw it
  render and Close correctly in all three runs.
- **The confirm prompt.** `confirmPrompt: true` is set (`defend.json:53`, both shells `:91`), so the
  no-tick Confirm (B2 #7) now prompts.

## What works

- **The consequence-flip earns its place and the facts track the modules** (C2 spot-check holds): item
  1 breach-to-DPO, item 2 police impersonation, item 4 any-form SAR, item 5 inbound breach, item 6
  front-line contact-detail update; the marketing-export and redaction sandbox beats are core_05/06's
  own examples.
- **The genuine-but-report vehicle is the right call and is documented.** Making items 1/4/5
  `isPhish: true` with `kindLine`/`missLabel` is the only way the built awareness scorer can reward
  "report/route this" and mark down Trust; the `_localTells` note explains it and it mirrors E8/E16.
- **The montage reads cleanly with the engine tag.** Safe-route lines open "The version where..." and
  pair with the engine's "Your call: the safe route"; unsafe lines lead with the outcome and pair with
  "Your call". No "Your choice." duplication (C2 D1).
- **No-blame register is clean** across cards, montage, Monday card, `noBlameLine` and the completion
  line. Both shells validate with no social warnings; parity and rule-of-thumb pass.

## Finding

### N1 — the defend-only host welcome says "the DPO" before `defendIntro` expands it, and sits at the 30-word cap. Nit, needs-user (shared generator line).

`..._defend/ink/tomasz_wisniewski.ink` (and `gen_e8_e17_shells.py` `LINES[('e11','defend')]` first
element): "You're covering the Care Laundry desk inbox. Some of it is routine, some belongs with the
DPO, some was sent to catch you out. Report anything that doesn't sit right." = 30 words, exactly at the
voicing cap, and it uses "the DPO" before the defend-intro screen expands it ("the data protection
officer (the DPO...)"). In the full episode Tomasz introduces himself as "data protection" first, so
this only bites in the defend-only variant. Harmless to read; a learner meets the expansion moments
later. Optional trim that also removes the forward reference, e.g. "...some belongs with the data
protection lead, some was sent to catch you out..." (keeps it under 30 and drops the undefined
initialism). Fix in the generator `LINES` first element, then regenerate the defend-only ink; shared
generator line, so it is the user's call whether a cheap pass is on.

## Dialogue pass (voiced host lines)

Lines reviewed: Tomasz's ink (both shells), both briefs, scope notes, the defend-set brief,
`defendIntro`, the four sandbox situations and their eight option labels, all eight montage lines, the
six defend-item bodies and their `whyFine`/`perFlagNote`/`headerNote`/`ifTrusted`/`reportReply`, the
debrief `conceptPanel`/`mondayCard`/`noBlameLine`/`allRight`/`defendOnly`, and the rule of thumb. The
register is a calm, precise colleague throughout; no printed variables; UK English; no em/en dashes.

Full-shell Tomasz lines (welcome "Tomasz Wiśniewski, data protection. I do a drop-in at this desk once
a month, so I'm at the next chair if you need me." / "Clear the queue the way you would on any morning.
If something goes wrong, the only wrong move is to keep it to yourself."; the completion pair; "Any
time.") are all ≤24 words and read well. I would change only the defend-only welcome, and only if the
voicing guide is held strictly (N1).

Two observations I looked at and did not raise:
- Item 2's call transcript scripts the learner line "Can I take your details and call you back?", then
  the caller refuses. This models the right instinct and surfaces the pressure tell rather than giving
  the verdict away (the player still chooses Verify vs Comply); it is the intended cue, not E13's
  forced-composer problem. Left.
- Two people named Sam (Whitlow, Whitaker) remain, plus the Sam persona (P1 F-E11-8). This is the
  episode's title case (the misdirected overtime sheet to the wrong Sam), the montage headline turns on
  it, and the "External recipient" chip on the first Sam disambiguates in the sandbox. A known minor
  the implementer kept deliberately; left.

## Verdict per stage

- **brief** — ship. Brief/scope/content note clean; "choices anyone would make" fixed (C2 D2).
- **mistake (sandbox)** — ship. Four beats map to core_05/06, one safe option each, labels de-telegraphed,
  the engine "not scored but the debrief comes back" intro inherited.
- **flip (montage)** — ship. "Your choice." dedup done; montage facts correct; safe/unsafe tags pair well.
- **defend** — ship. Six items; the data items now score and read on the lesson (F-E11-1/2); DPO
  explained; verdict cards data-worded; batch-11 counts and `confirmPrompt` wired; one mirror pair.
- **debrief** — ship. Concept panel, Monday card, rule of thumb (byte-identical), no-blame line, and the
  engine sandbox recap all correct.

**Overall: ship-ready. No blockers, majors or minors; one optional nit (N1, the defend-only welcome's
"DPO" and 30-word cap, a shared generator line). Every C2 finding and every blind/playtest finding is
genuinely closed, and all five batch-9-to-11 on-screen behaviours are wired or correctly inherited.**

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 0 minor, 1 nit (1 total; needs-user, shared generator line). Facts track
  core_05/06; no-blame register clean.
- C2/blind/playtest closure: C2 D1 (montage dedup), D2 (brief wording), D4 (31→30 words) closed; P1
  F-E11-1/2/3/4/5/9/10 closed (data items now score on the lesson via local tells, DPO explained,
  verdict cards data-worded, header note plain, repetition gone); B2 #1/#3/#5/#7/#9 closed.
- Batch 9-11 on screen: `caughtBreakdown`+`handledRightLabel` and `confirmPrompt` set; sandbox recap +
  corrected everyday-choices intro inherited from the engine defaults; "Episode finished" panel default.
- Blockers: none.
- Majors: none.
- Verdict: ship-ready; N1 is an optional one-line generator trim if a cheap pass is on.
