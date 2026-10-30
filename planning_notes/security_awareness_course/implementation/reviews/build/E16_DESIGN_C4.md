# E16 "Insider risk": confirmation design + dialogue review C4

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. E16 is a
consequence-flip plus defend episode: five unscored sandbox beats across a leaver's last week, a montage
flip, then the scored six-item inbox set with an unscored "raise a concern" fact-chip step (ENG-12), and
the debrief. Company Quayholt Insurance; host Anjali Rao; module core_14.

This is the **C4 confirmation pass** after C3 and the batch-12 content wave. Since C3 (commit `e14b542c2`)
E16 changed a lot: `85a0b1a3e` (B4 content: concern-form wording, the Raise-a-concern debrief card, two
plausible risky everyday choices, the defend-only kiosk pointer), `37ca4432f` (C3 D3: rumour beat lists the
unsafe option first) and `f108eb149` (batch-12 content: the **required outside-offer chip**, badge "reported
or checked", per-verdict IT replies, the conclusions note). It judges the files on main (git clean when
read). Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` / `npc-dialog-review` skills adapted
to this kind, the pilot reviews and the prior E16 reviews.

Scope read this pass: both shells `scenarios/awareness_e16_insider_risk{,_defend}/{scenario.json.erb,
ink/anjali_rao.ink}`; the C3 review and the BUILD_LOG entries since; the engine the findings depend on
(`minigames/concern-form/concern-form-model.js`, `concern-form-minigame.js`,
`inbox-triage/inbox-triage-minigame.js` team tally, `episode-runner/debrief-view.js`). **One live run this
pass** on the keyless :3001 server (a fresh defend game, headless `playtest-session.js`): the concern-form
required-offer gate was driven and judged on screen, below. The rest was judged from code and authored data.

## How judged

- `validate_scenario.rb --strict-social --no-graph --skip-ink` on **both** shells: schema passes, no social
  errors or warnings (only the generic m01 lock-type/hostile-NPC suggestions, irrelevant to an awareness kiosk).
- `dialoguelint.mjs` both shells: full `lines=6 median=24 max=25`; defend `lines=3 median=26 max=28`. No rule
  hits. The defend-only welcome is 28 words (now carries a kiosk pointer, see closures), under the 30 ceiling.
- No em/en dashes in any E16 file (house style). Parity holds: the defend shell carries the same required
  chip, `feedbackRequired`, `conclusionsNote`, `reportReplyByVerdict` and badge copy as the full shell.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 2 | 0 | 0 | 2 |
| Nit | 3 | 1 | 2 | 0 |
| **Total** | **5** | **1** | **2** | **2** |

## Live check (concern-form required-offer gate, :3001, judged on screen)

Fresh defend game (new-game.rb, game 212), headless `playtest-session.js`, driven into the concern form.

- **Two facts, offer omitted → Done withheld, the gate names the offer.** Picked `fc_offer_when` and
  `fc_offer_where` only (not `fc_offer_what`) and pressed Check. Result: no `.cf-finish` button;
  `missingRequired: ["fc_offer_what"]`; the hold note reads **"The report needs the offer itself, so whoever
  reads it knows what happened. Add this before you finish: An unknown contact offered payment for remote
  access."** The report cannot be finished without naming the offer. This is the behaviour C3 D1 asked for.
- **Add the offer → Done appears.** Ticked `fc_offer_what`, pressed Check: `.cf-finish` ("Done") present,
  `missingRequired: []`, the hold note gone. The learner can now finish.

So **C3 D1 (the one headline residual) is resolved at the gate**: a report that leaves out the criminal offer
can no longer be finished or read as complete. One residual remains in the *feedback banner*, below (D1).

## Earlier findings: closure

| Finding (source) | Status | Evidence on main |
|---|---|---|
| **C3 D1** concern gate accepts and praises a report that omits the offer | **Resolved at the gate** (praise residual → D1 below) | `fc_offer_what` `required: true` (`:469`); model computes `missingRequired` (`concern-form-model.js:148`); view withholds Done and shows `feedbackRequired` while any remain (`concern-form-minigame.js:184,195`); `finish()` refuses (`:296`). Live-confirmed above. |
| **C3 D2** defend-only welcome lacks a kiosk pointer | **Closed** | defend ink `:24` now "...Start at the kiosk: raise a concern as facts, then sort the messages. Tell me what you're offered." (28 words, dialoguelint max=28). Full welcome also points to the kiosk (`:40`). |
| **C3 D3** rumour and leaver_favour both list the safe option first | **Resolved** | `rumour :388` now lists `add` (unsafe) before `route` (safe). Safe-option position across the five beats is now 2,2,2,1,2 (only `leaver_favour :421` lists safe first), the deliberate varied-position intent; see nit N3. |
| **B3** team counter counts a Verify as "reported for the team" | **Closed** | Badge relabelled "Risks reported or checked: {n}" (`:80`); the engine count has always included Verify (`inbox-triage-minigame.js:574`, `countChecked` default true), so the label now matches the number. |
| **B4 / batch-12** per-verdict report replies; conclusions-replace note | **Landed** | `reportReplyByVerdict` on all five risky items and Hana (distinct report vs verify lines, all in register, no blame); `conclusionsNote :523` "These are theories about people... Picking another replaces the one you chose." Reads as English, matches the one-pick behaviour. |

C3 D2 and D3 are genuinely closed; C3 D1's accept-and-finish defect is closed and live-verified.

## What works

- **The register still holds (spec §18).** No suspicion meter, no snooping reward. Samira is cleared
  everywhere (the `kind` beat, "Seen, said, true", the montage, `noBlameLine`); Reuben and Ross are genuine
  colleagues with an unsafe *ask* and a safe route, not culprits. The host's done lines close it: "nobody's a
  suspect for having a hard week."
- **The concern step now teaches a harder lesson than C3.** The gate forces the offer into the report
  (live-confirmed), the conclusion chips must come out, and the guidance routes each concern to the right
  person and ends "Posting it in the team chat is spreading it, not raising it." The third concept panel
  ("The report you built") pays the step off in the debrief.
- **Facts track core_14**; fair defend set with the mirror pair intact (item 5 look-alike IT → Report beside
  item 6 genuine pushy lockout → Verify-not-refuse); per-verdict replies credit a Verify as well as a Report.

## Findings

**D1. The affirming feedback banner still fires in full while the offer is missing and Done is held. Minor,
needs-user (no content-only lever). `concern-form-model.js:136-150` (tone); the E16 `feedbackFacts` string.**
Live-observed: with the two non-offer facts picked, the gate correctly holds Done and shows the "needs the
offer itself" note, but the main feedback banner above it reads, in full, **"Good. Facts, not a verdict, are
what a fair concern looks like. Anything offered to you belongs in a report like this..."** The tone is
computed purely from `facts.length >= minFacts` and the absence of a conclusion (`assessReport`); it does not
consider `missingRequired`. So a report that still omits the reportable security event is praised ("what a
fair concern looks like") at the same moment it is blocked for omitting it, which is a mixed message. This is
much smaller than C3 D1 (the report can no longer be finished), but the praise overshoots. There is no clean
content fix: `feedbackFacts` is the same line a *complete* report shows, so softening it would weaken the
correct case. A tidy fix is engine-side: while `missingRequired` is non-empty, suppress the positive banner or
show a neutral holding tone instead. Flagging for the user; nothing to change in the shell alone.

**D2. The debrief never recaps the raise-a-concern step. Minor, needs-user (debrief view).**
Carried from C3 D4. The concern form shows its feedback inline, then the episode moves to the inbox; the
debrief scores and discusses only the six messages and the five beats (`debrief-view.js` has `sandboxRecap`
and `drillRecap` sections but no concern-form hook; grep finds none). The concept panel "The report you
built" is the nearest payoff and it is good, but a one-line recap of the learner's own report would land the
episode's distinctive lesson harder. Engine/needs-user, not shell copy.

**N1 (nit, engine). The result counts read awkwardly** ("Risks handled right: 5 of 5 (4 reported, 1 checked
by another route)" beside "Checked by another route: 2"), needing a second read (B4 finding 8). Count
rendering is engine-side; the labels themselves are fine.

**N2 (nit, engine). "Signs most often missed" on a zero-tick round** still lists all six tells tied at "0 of
1 each", so it reads as a list, not a priority (B4 finding 9). The copy lever exists; the tie-ordering is
engine behaviour.

**N3 (nit, episode-local). `leaver_favour` lists the safe option first**, against the ENG-04 build-log
convention (`BUILD_LOG.md:36`), while the other four beats list the unsafe option first. The author has
settled this as deliberate varied position (2,2,2,1,2 across beats, which defeats a fixed-position tell), and
C3 flagged it only so the author would choose; the choice is made and recorded, so this is a nit, not a defect.
Either leave it, or record in the spec that varied position supersedes the ENG-04 "never list safe first" rule.

## Dialogue (voiced host lines)

Every Anjali line reads as spoken in both shells: calm colleague register, no printed variables, UK English,
no dashes, within the word limit (full max 25, defend max 28). The defend-only welcome now points to the
kiosk without breaking register or the ceiling. The per-verdict report replies (`reportReplyByVerdict`) are
written as the security team's reply and stay no-blame throughout. I would change **none** for wording.

## Examined and judged acceptable (not findings)

- **The wellbeing fact chips** (`fc_care_what`, `fc_care_who`) stay in register, are routed to manager/HR by
  the guidance, and Samira is cleared in the debrief. A learner can still finish a report built on these plus
  the required offer; that is a kind welfare concern filed alongside the reportable, not suspicion.
- **"Refusing everything" still scores full** under `scoringProfile: "awareness"`, `passPercent: 0`; met
  pedagogically by row 6's Verify. Conscious product choice.
- **Completion = pass at a low round score**: by design (training). Facilitator-record question, set-wide.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass | pass (kiosk pointer now present) |
| mistake (sandbox) | pass (N3: one beat lists safe first, deliberate) | — |
| flip (montage) | pass | — |
| defend | pass (required-offer gate live-confirmed; mirror pair; per-verdict replies) | pass (same) |
| debrief | pass (D1 praise residual; D2 no concern recap; N1/N2 nits) | pass |

**Overall: ship-worthy.** No blockers, no majors; C3 D1 (accept-and-finish), D2 (kiosk pointer) and D3
(ordering) are all closed, and the required-offer gate was verified live. The two minors both need a user
call because no authored lever exists: D1 (the positive banner still fires while the offer is missing) and D2
(the debrief does not recap the concern step), both engine. Pre-ship still owed (from BRAND_ADDITIONS.md, not
a review finding): web-search Ross Garside, Samira Nawaz, Craig Pickering.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 2 minor, 3 nit (5 total; 1 episode-local, 2 engine, 2 needs-user).
- Blockers: none.
- Majors: none (C3 D1 accept-and-finish, D2 kiosk pointer, D3 ordering all closed; required gate live-verified).
- Live check: with two facts and no offer the gate held Done and showed "The report needs the offer itself...
  Add this before you finish: An unknown contact offered payment for remote access"; adding the offer made
  Done appear. Pass.
- Verdict: ship-worthy; put D1 (the affirming banner still fires while the required offer is missing) and D2
  (debrief does not recap the concern step) to the user, as both need an engine lever.
