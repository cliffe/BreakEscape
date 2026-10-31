# E17 "Acceptable use": design review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language
model. Method and standard: `REVIEWER_BRIEF.md`, the `scenario-design-review` skill adapted to the
awareness kind, and the E8 pilot reviews in `reviews/build/` for format and bar. E17 is **defend-only by
user decision**: one shell, no attack half, no `mistake` stage, no flip; the one shell carries the whole
episode (the "can I?" sort drill plus the scored six-item triage set).

Scope read end to end: the one shell `scenarios/awareness_e17_acceptable_use_defend/{scenario.json.erb,
mission.json, ink/nilesh_solanki.ink}`; the fragments `planning_notes/phishing_and_social_engineering/
awareness/e17/{defend.json, full_only.json}`; the spec `.../episodes/E17_acceptable_use.md`; the module
`modules/core_16_acceptable_use_and_your_responsibilities/concepts.md`; and the ENG-11 sort-drill engine
it leans on (`public/break_escape/js/minigames/sort-drill/sort-drill-model.js`, the runner's
`episode-model.js` drill wiring, `debrief-view.js` concept panels).

Ran: `validate_scenario.rb --strict-social --no-graph --skip-ink` on the shell (schema passes; **no social
errors or warnings**; the 22 "suggestions" are the generic m01 mission template, all irrelevant to an
awareness episode); `dialoguelint.mjs` on the shell (ink lines=3, max=27 words, no rule hits);
`social-awareness-fragment-erb-parity.test.mjs` (see MI3 note); and a deterministic run of the sort-drill
model to confirm the scoring numbers below. **No bridge/screen run:** the two engine judgements (concept
panels render, drill runs first in the defend stage) are read from the engine source and the model, not
from a rendered screen.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 3 | 1 | 0 | 2 |
| **Total** | **3** | **1** | **0** | **2** |

Shape: defend-only, `stages: ["brief","defend","debrief"]`, `variant: "defendOnly"`, set prefix
`episode_e17_acceptable_use_defend_defend_`. Two activities in the defend stage: the "can I?" sort (ENG-11
`sortDrill`, 9 drawn from 22, scored against the organisation answer key) then the six-item triage set
`e17_acceptable_use_inbox` (scored `awareness`). Fragment, `full_only.json` sort and shipped shell are
byte-consistent (checked field by field). Rule of thumb byte-identical to all 30 awareness shells.

## What works

- **The sort scoring teaches the intended habit, and the engine does exactly what the task describes.**
  `sort-drill-model.js:26` `POINTS = { correct: 2, caution: 1, wrong: 0 }`; `scoreCard` (`:193`) gives
  the right bin 2, the `alwaysScoresBin` ("ask") 1 **only when it is not that card's answer**
  (`caution = !correct && binId === config.alwaysScoresBin`), everything else 0. Simulated on the shipped
  bank (deterministic draw S01,S03,S08,S10,S13,S15,S16,S17,S20): a perfect sort scores 18/18 (100%),
  **"Ask first" on everything scores 11/18 (61%)**, "Not allowed" on everything scores 6/18 (33%). So
  caution is never punished to zero (the module's "Ask first is never the wrong answer" holds as "never
  marked wrong"), blanket-refusing scores worst, and knowing the actual answer scores most. This is the
  right lesson: when genuinely unsure, Ask first is always safe to pick, but the episode still rewards
  learning the real answer. The caution feedback line reinforces it: "Playing safe is never wrong. This
  one goes in {bin}." (`sort-drill-model.js:44`).
- **Locked cards cannot be softened.** All seven (S04, S16, S17, S18, S19, S21, S22) carry `locked: true`;
  `applyOverrides` (`sort-drill-model.js:133`) ignores every per-card change on a locked card. Simulated
  an override setting S19/S17 to "allowed": both stay "not_allowed". No deployment can make lending a
  badge, sharing a login, reading back a code, disabling antivirus, snooping a record, sitting on a
  suspected mistake or sharing a password "Allowed", nor make reporting optional. Matches spec §11a/§18.
- **The monitoring card's limits are stated fairly and accurately.** Both the debrief concept panel
  ("What's monitored, and the limits", shell `:304`) and the genuine triage item `e17_monitoring_notice`
  (`:182`) cover the checks (email/web filtering, sign-in records, data leaving) **and** the limits (told
  what/why/how; the law sets limits that protect you; "not to watch individuals" / "not someone reading
  your messages for fun"; ask the DPO if worried). This matches `concepts.md` "Monitoring and your
  privacy" (lines 68-80) without making monitoring sound sinister or harmless, meeting the §18 "Do not"
  rule. "Messages are records, write as if the person could read it" is carried too. See MI2 for the one
  soft spot.
- **Draw guarantees one of each answer.** `drawCount: 9`, `drawRules.oneOfEachAnswer: true`, pool of 22
  (6 allowed, 4 ask, 12 not_allowed, all `confirmed: true`). `drawCards` picks one per bin first, then
  fills to nine. The learner always sees at least one Allowed, one Ask first and one Not allowed.
- **Triage set is matched and has the required awkward pair.** Six items, `scoringProfile: "awareness"`,
  `verifyVerdict: true`, `feedbackMode: "immediate"`. Mirror pair aw5: item 1 (normal-looking
  unapproved-install lure, Verify/Report) and item 4 (suspicious-looking genuine monitoring notice,
  Trust). Items 2 and 3 model the case where the colleague is genuine but the **ask** is unsafe
  (`isPhish: true`), with the human nuance in the per-item feedback. The scenario-local `unapproved_tool`
  tell is declared cleanly (set `flagChips` + `skillNames`, message-level `factorStrings` as a sibling of
  `truth`), so it survives `--strict-social`; `lookalike_domain` is correctly not declared.
- **No-blame register is clean and consistent.** The `noBlameLine`, the host completion line ("an honest
  mistake reported quickly is fixed, not punished"), S21 (sit-on-a-mistake → Not allowed, locked) and the
  Monday card all pull one way. Host ink is in range (3 lines, 27 words max, no printed variables).
- **Facts match `concepts.md`.** The three answers, the five responsibilities, the DPA 2018 s.170 framing
  ("looking can be obtaining"), the shared-login/CMA point, approved-tools reasoning and the acknowledge
  footer all track the module. `.example` domains throughout; authored content has no em/en dashes (the
  only ones are in the auto-generated `dungeon_graph.html`).

## Findings

**MI1 — the task's "about 8 minutes" target conflicts with E17's designed 12-minute budget.**
Minor, needs-user.
The reviewer brief sets "about 8 [minutes] defend-only" as the generic bar, and this review was asked to
apply it. E17 deliberately overrides that: it is the one defend-only shell that carries the **whole**
episode (the 9-card sort with a reason shown after each drop, the 6-item immediate-feedback triage, two
debrief concept panels, the Monday card and the no-blame tally), so spec §6/§8b set 12 minutes, and the
shell is self-consistent at that figure: `durationTargetMin: 12` (`scenario.json.erb:283`),
`estimated_duration_minutes: 12` and "about 12 minutes" in the description (`mission.json:3,9`). Judged
against a strict 8-minute bar the content is too much; judged against E17's own design, 12 is right and
every file agrees. Nothing to change in the files, but the orchestrator should confirm which target
governs before measuring E17 against the 8-minute bar. Not verified by a timed run (no bridge executed;
the suite does not time a play), so 12 itself is still a design estimate, not a measured figure.

**MI2 — the monitoring panel states the strongest limit only by implication.**
Minor, episode-local. `scenario.json.erb:306` (= `e17/defend.json:126`).
The panel is accurate and fair, but `concepts.md:75` carries a more concrete, more reassuring limit than
the panel spells out: employers "look at the content of emails and messages only in exceptional
circumstances, telling workers in advance." The panel gestures at this with "it isn't someone reading your
messages for fun", which is true but softer than the actual rule. Optional tightening, keeping the plain
register and the panel short:
old: "... the law sets limits that protect you, so it isn't someone reading your messages for fun. If
monitoring worries you, ask the DPO."
new: "... the law sets limits that protect you: the content of your messages is looked at only in rare,
serious cases, and you'd be told first. If monitoring worries you, ask the DPO."
Accurate as it stands; this only makes the limit explicit. Low priority.

**MI3 — spec §11a card-bank reasons are now stale against the shipped (improved) reasons.**
Minor, needs-user (doc hygiene). Spec `episodes/E17_acceptable_use.md:234-255`.
The shipped sort reasons (in `full_only.json` and the shell, which match each other exactly) were lightly
expanded over the spec's §11a table to name the route, which reinforces the "ask first" lesson: S03/S14/
S18/S20 add "ask the service desk", S11 adds "first", S12 adds "ask your manager, then the service desk",
S16 adds "proper". These are improvements, not errors, and all seven locked answers and every bin
assignment are unchanged. Only the spec table is out of step; update it so a later reviewer does not read
the shipped wording as drift. No shipped file affected.

## Notes (not findings)

- **Awareness-profile scoring of the triage set.** As in the rest of the built set (see E8 C2), under
  `scoringProfile: "awareness"` a genuine item scores full whether trusted or reported, so at the number
  level reporting the two genuine items (monitoring notice, personal-use reminder) still scores 100. The
  "awkward genuine so refusing everything doesn't win" criterion is met pedagogically, through the mirror
  pair and the `falseAlarmCost` lines ("Reporting it only has someone re-confirm a genuine policy
  notice"), not through the mark. Shared property, not an E17 defect. The "doesn't win by refusing
  everything" bite that the number does carry lives in the **sort** (refuse-all 33%, ask-all 61%,
  verified above).
- **"Never the wrong answer" vs 1-of-2 points.** The sort gives Ask first 1 point (not 2) on a card whose
  real answer is Allowed or Not allowed. This is intentional (spec §11a, `full_only.json` notes:
  "punishing caution stops people asking") and consistent with the module's wording read as "never marked
  wrong / never zero". The caution feedback keeps the message straight. Flagging only so it is a conscious
  choice, not an oversight.
- **`answerKeyProfile: "organisation"` is a recorded label, not an engine lookup.** Each card carries its
  own Tarrowby default answer and reason inline; the profile string is stored in the result for
  measurement (`full_only.json` `_notes`). Correct and matches the engine.
- **Parity test.** `social-awareness-fragment-erb-parity.test.mjs` fails one subtest, but on
  `awareness_e14_social_media` (a different, in-flight episode not registered), not E17. E17 has no full
  erb, so it is correctly outside the full-episode parity set; I diffed its fragment/`full_only` against
  the shell by hand instead and they match field for field.
- **Pre-ship web search still owed** (spec §20): the invented lure sender domains
  (`harlow-freight.example`, `roomcall-app.example`, `formatmoor-online.example`) should be checked
  against real businesses before ship (BRAND_SET rule). Not done here; needs-user.
- **Not judged from a screen.** Concept panels, the drill launch panel and the address-font treatment are
  read from the engine (`debrief-view.js:373-378`, `episode-model.js:144-154`) and the shared inbox-triage
  renderer, not from a render. An ENG owner may want one eyeball of the drill + debrief if certainty on
  layout/contrast is wanted.

## Verdict

**Ship-worthy.** No blockers, no majors. The one shell validates clean under `--strict-social` with no
warnings, the dialogue lints in range, and fragment/`full_only`/shell are byte-consistent. The sort
scoring does precisely what the task describes and teaches the right habit (caution never zero, the real
answer rewarded most, blanket-refuse scores worst), the seven locked cards cannot be softened by any
deployment, and the monitoring limits are stated fairly and accurately. The three minors are an 8-vs-12
minute target question the orchestrator should settle (MI1), an optional tightening of the monitoring
limit wording (MI2), and a stale spec table (MI3) — none block ship. Recommend confirming the duration
target and, if the budget allows, one timed run to replace the 12-minute estimate with a measured figure.

## C1 outcomes (2026-10-29, content fixer)

Rulings applied (BUILD_LOG 2026-10-29):

- **MI1 (duration).** No change: the 12-minute target governs, and the shell/mission/description already agree. Nothing to fix.
- **MI2 (monitoring panel).** Fixed. The "What's monitored, and the limits" concept panel now states the strongest limit explicitly: ".. the law sets limits that protect you: the content of your messages is looked at only in rare, serious cases, and you'd be told first. If monitoring worries you, ask the DPO." Changed in `e17/defend.json` (the panel) and regenerated into the one shell `awareness_e17_acceptable_use_defend/scenario.json.erb`. The genuine triage item `e17_monitoring_notice` was left as it was (the finding was panel-only).
- **MI3 (stale spec table).** Fixed. The §11a card bank in `episodes/E17_acceptable_use.md` was synced to the shipped reasons: S03/S14/S20 name "ask the service desk", S11 adds "first", S12 names "ask your manager, then the service desk", S16 says "proper access". Bin assignments and the seven locked answers are unchanged, and a dated note records the sync below the table. No shipped file changed for MI3.

Checks after the fix: `validate_scenario.rb --strict-social --no-graph --skip-ink` on the shell passes, exit 0, no social errors/warnings (only the 22 generic m01 suggestions). `dialoguelint.mjs` clean (person lines=3, max=27, no rule hits; no ink was touched). Rule-of-thumb guard passes for this shell. Parity: E17 is defend-only, correctly outside the parity set. Bridge `e17-defend` on the keyless :3001 server (Node 24): **14/14 PASS** (game 4799). Changed spoken/learner-facing line: the monitoring concept panel text only.
