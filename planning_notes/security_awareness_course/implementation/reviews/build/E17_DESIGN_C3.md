# E17 "Acceptable use": confirmation design + dialogue review C3

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. E17 is **defend-only
by user decision**: one shell, no attack half, no `mistake` stage, no flip. The one shell carries the whole
episode: the "can I?" three-way sort (`sortDrill`, scored) plus the scored six-item inbox-triage set.
Company Tarrowby Logistics; host Nilesh Solanki; module core_16.

This is a **confirmation pass** after C1, C2 and the two blind rounds (B1, B2). It judges the files on main
at commit `e14b542c2` (git clean when read). Method and bar: `REVIEWER_BRIEF.md`, the
`scenario-design-review` / `npc-dialog-review` skills adapted to this kind, the pilot reviews, and the prior
E17 reviews and playtests in this folder.

Scope read this pass: `scenarios/awareness_e17_acceptable_use_defend/{scenario.json.erb, mission.json,
ink/nilesh_solanki.ink}`; the spec `episodes/E17_acceptable_use.md`; the prior reviews
(`E17_DESIGN_C1.md`, `E17_DESIGN_C2_DIALOG_C1.md`, `E17_BLIND_B1`, `E17_BLIND_B2`,
`E14_E17_PLAYTEST_P1.md`); the E17 lines of `BUILD_LOG.md`; and the engine the drill-recap finding depends
on (`episode-runner/debrief-view.js`). Judged **from code and authored data, not a render** this pass (no
bridge run); B1/B2 supply the recent on-screen evidence, cross-checked against the current files.

## How judged

- `validate_scenario.rb --strict-social --no-graph --skip-ink`: schema passes, no social errors or warnings
  (only the generic m01 lock-type suggestions, irrelevant to an awareness kiosk).
- `dialoguelint.mjs`: ink `lines=3 median=26 p90=28 max=28`, no rule hits; timed texts 0.
- No em/en dashes anywhere in the shell, mission.json or ink (house style).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 3 | 0 | 2 | 1 |
| Nit | 2 | 1 | 1 | 0 |
| **Total** | **5** | **1** | **3** | **1** |

## Earlier findings: closure

| Finding (source) | Status | Evidence on main |
|---|---|---|
| **C2 DLG1** host completion line says "software portal usually answers" (a portal is a form, it doesn't answer) | **Closed** | `ink/nilesh_solanki.ink:22` now "...ask first, the service desk usually answers the same day; and if you make a mistake, report it." Matches `concepts.md`. |
| **C2 D1** sort card S07 "new depot" raises an unaddressed confidentiality question | **Closed** | `scenario.json.erb:496` now "Post a photo of the team's depot on social media" (the word "new" dropped); reason unchanged. |
| **C2 D2** item 2 (`e17_data_lookup`) tagged `secrecy_or_bypass`, which doesn't describe an open favour | **Closed** | `:206-221` the item now scores the scenario-local tell `no_work_reason` (paired with `pretextRelevant` via `flagAlternatives`); `secrecy_or_bypass` survives only as a decoy chip in `channelTells :73`, scored by the genuine shared-login item. |
| **C1 MI2** monitoring limit stated only by implication | **Closed** (re-confirmed) | Second concept panel `:400` states the strongest limit plainly ("the content of your messages is looked at only in rare, serious cases, and you'd be told first. If monitoring worries you, ask the DPO."). |
| **B1 M1 / B1 B2 debrief phishing text** reused on an acceptable-use episode | **Closed** | De-phished throughout: `phishCaughtLabel` "Rule-breaking requests spotted", `resultCopy.criticalLead` "let a rule slip", `reportedPct` "Raised {pct}% of the rule-breaking requests", `verdictFeedback.report.phish` "Right call: you raised it...", `allPhishRight` "Every rule-breaking request was raised". No "phish/fake/attack" wording survives in the shell. |

All C2 design findings, the C2 dialogue finding and the blind-B1 major are genuinely closed on main.

## What works

- **The three-answer frame is clear and the sort scoring teaches the intended habit.** Allowed / Not allowed
  / Ask first, `alwaysScoresBin: "ask"` so caution is never marked wrong (shown neutrally since engine batch
  3C), the real answer rewarded most, blanket-refuse scoring worst; `drawCount: 9` with
  `oneOfEachAnswer: true` over a 22-card pool guarantees one of each answer; the seven judgement cards
  (S04, S16, S17, S18, S19, S21, S22) carry `locked: true` so a deployment override cannot soften them.
- **Facts track core_16.** Personal use in your own time is fine; work accounts/logins are work-only;
  unchecked software and USB sticks go to the service desk; never share a password or read back a code;
  look at personal data only with a work reason (s170 DPA on S19 and item 2); report a suspected mistake
  at once; the monitoring panel states what is checked, why, and the legal limit.
- **Matched inbox with the mirror pair** (item 1 normal-looking unapproved-tool install / item 4
  suspicious-looking genuine monitoring notice), and both genuine notices carry a `falseAlarmCost`.
- **The de-phished result copy and the acceptable-use `verdictFeedback`** read as plain English and in
  register; the Monday card names the right person per concern (service desk / security / DPO / manager).
- **Monday-card wiring is correct** (`strings.mondayCard` is the real card; `debrief.mondayCard:
  "slot:customer_report_route"` is the shared engine token, not a stray label).
- **Host line is in register and well-voiced** ("Nilesh, service desk. Every rule here has a 'because'...").

## Findings

**D1. The debrief does not recap the card-sort mistakes; only the inbox is carried through. Minor,
engine/needs-user. `debrief-view.js` (no `sortDrill` section).**
B1 finding 2, B2 finding 8. The drill shows a "Where the cards went" summary at the moment the sort
finishes, but once the player clicks past it the debrief scores and discusses only the six messages; a
rushed player (B2's struggling run put 5-6 cards wrong) gets no recap of the card errors. For an episode
whose *scored* half is the sort, that is the half most worth revisiting. A `grep` of `debrief-view.js` finds
no sort-drill recap hook, so this is engine/needs-user, not shell copy. This is the named C3 focus for E17
and it is still open.

**D2. The brief/report framing lets a player Report everything and lose little. Minor, needs-user
(set-wide). `scenario.json.erb:65` (inbox brief), `:118-121` (Report hint).**
B1 finding (openness), B2 finding 1. The inbox brief says "When you're not sure, checking first is fine" and
Report is defined as "This breaks a rule or needs a look", so a player can Report every message and, under
`scoringProfile: "awareness"`, the two genuine notices still score full (a deleted genuine notice costs 70,
but a *reported* one does not). The over-report cost lives only in the `genuineCopy`/`falseAlarmCost` lines,
not in the number. This is the known set-wide awareness-profile question (C2 D3; same as E8), and in E17 the
"don't refuse everything" bite genuinely does live in the **sort** (refuse-all scores worst there), so it is
met pedagogically. Re-raised only so the orchestrator settles once, set-wide, whether a false alarm should
ever cost; nothing E17-specific to change.

**D3. Contradictory Delete feedback on the genuine notices. Minor, engine.**
`scenario.json.erb:123-131` `labels.verdictFeedback.delete.real` = "That one was a genuine notice, and
deleting it left it unread. Trusting it, or checking it first, was the right call here." B2 finding 5 saw
the on-screen Delete feedback read as "reporting is safer than deleting" / "the right call was Trust or
Verify" while the debrief added "Reporting it only has someone re-confirm a genuine policy notice", which
pull against each other. The authored `.real` line is clean; the contradiction is in engine-composed
genuine-item feedback that still implies Report is safe on an item where the lesson is "this is fine, handle
it". Needs a render to pin the exact composed string, so engine/needs-user; low priority.

**N1 (nit, episode-local). The objective title reads as a typo. `scenario.json.erb:26` / the objectives
panel.** The objective title is authored "Sort the 'can I?' moments", but B2 saw it rendered "Sort the can I
moments" with the quotes stripped, which reads as a typo beside the quoted "can I?" everywhere else (B2
finding 3). If the panel sanitises apostrophes/quotes this is engine; if the display is faithful the title
is fine. Confirm on a render; if the panel strips quotes, reword to avoid them, e.g. "Sort the everyday
moments".

**N2 (nit, content). No end send-off.** After Finish the episode ends on two toasts and the kiosk "done"
narration, with no Nilesh send-off or "you can leave" signal (B1/B2). The host *has* a done line (ink `:22`,
"That's the lot, thanks..."), but it only fires on re-talk, so a player who walks away after Finish never
hears it. Minor-to-nit; the completion is clear enough from the success screen.

## Dialogue (voiced host lines)

Nilesh's two lines (welcome, done) read as a calm service-desk colleague, no printed variables, UK English,
no dashes, within the limit (max 28 words). DLG1 (portal → service desk) is fixed. I would change **none**
for wording. "Haulier" in the inbox brief is ordinary UK English and reads fine for the audience.

## Examined and judged acceptable (not findings)

- **`ruleOfThumb` is the shared phishing habit line** (money/codes), byte-identical across the set. It reads
  slightly off on acceptable use, but it is a deliberate set-wide constant; E17's own signature habit ("Not
  sure? Ask first") is carried by the scope note, Monday card, bin hint and host line. Set-wide product
  call, not an E17 fix (B1 worst-line 2; carried in BUILD_LOG as a pending user question).
- **Completion/`pass` recorded at a 0% round** (B1/B2): by design (completion = pass). Facilitator-record
  question for the user, set-wide.
- **The rules the cards are "answered from" are not shown as a list before sorting** (B2 finding 6): the
  sort intro `:442` does state them in one line each ("Personal use in your own time is fine. Work accounts,
  files and logins are for work only..."), and the reason shows after each card, so the policy is present;
  acceptable.

## Verdict per stage

- **Brief** — *Ship-worthy.* `brief`/`scopeNote`/`defendIntro` are plain and in register; host welcome in
  range and well-voiced.
- **Defend (sort + inbox)** — *Ship-worthy.* Sort scoring sound, locked cards safe, mirror pair present,
  tells aligned (C2 D1/D2 closed). D2 (over-report) is the set-wide awareness-profile question; D3 is an
  engine feedback-composition nit on the genuine notices.
- **Debrief** — *Ship-worthy with one open gap.* De-phished copy and the monitoring panel are accurate and
  plain; D1 (no card-sort recap) is the one substantive carry-over and needs the debrief view, not shell
  copy.

**Overall: ship-worthy.** No blockers, no majors; every C2 design and dialogue finding and the blind-B1
phishing-text major are closed on main. The three minors are the carried drill-recap gap (D1, engine), the
set-wide over-report question (D2), and an engine feedback-composition nit (D3); none blocks ship. Pre-ship
still owed (C2, not a review finding): web-search the invented lure domains `harlow-freight.example`,
`meetly-app.example`, `quickconvert-online.example`.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 3 minor, 2 nit (5 total; 1 episode-local, 3 engine, 1 needs-user).
- Blockers: none.
- Majors: none (C2 D1/D2/DLG1 and blind-B1 phishing-text major all verified closed on main).
- Verdict: ship-worthy; the named C3 focus, the card-sort recap (D1), is still open and is an engine item
  (the debrief carries no sort-drill section); D2 (over-report) and D3 (genuine-notice Delete feedback) are
  set-wide / engine questions for the user, not shell copy.
