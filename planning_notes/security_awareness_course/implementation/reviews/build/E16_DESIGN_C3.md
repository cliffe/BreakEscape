# E16 "Insider risk": confirmation design + dialogue review C3

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. E16 is a
consequence-flip plus defend episode: five unscored sandbox beats across a leaver's last week, a montage
flip, then the scored six-item inbox set with an unscored "raise a concern" fact-chip step (ENG-12), and
the debrief. Company Quayholt Insurance; host Anjali Rao; module core_14.

This is a **confirmation pass** after C1, C2 and the four blind rounds (B1-B4). It judges the files on main
at commit `e14b542c2` (git clean when read; the Sonnet "E16 minors retry" fixer had not committed). Method
and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` / `npc-dialog-review` skills adapted to this
kind, and the pilot reviews in this folder.

Scope read this pass: both shells `scenarios/awareness_e16_insider_risk{,_defend}/{scenario.json.erb,
ink/anjali_rao.ink}`; the spec `episodes/E16_insider_risk.md`; the prior reviews
(`E16_DESIGN_C1.md`, `E16_DESIGN_C2_DIALOG_C1.md`, `E16_BLIND_B1`..`B4`, `E15_E16_PLAYTEST_P1.md`) and the
E16 lines of `BUILD_LOG.md`; and the engine the findings depend on
(`minigames/concern-form/concern-form-model.js`, `episode-runner/flip-view.js`,
`episode-runner/debrief-view.js`). Screens were judged **from code and the authored data, not a render**
this pass (no bridge run); B3/B4 supply the recent on-screen evidence, which I cross-checked against the
current files.

## How judged

- `validate_scenario.rb --strict-social --no-graph --skip-ink` on **both** shells: schema passes, no social
  errors or warnings (only the generic m01 lock-type suggestions, irrelevant to an awareness kiosk).
- `dialoguelint.mjs` both shells: full `lines=6 median=24 max=25`; defend `lines=3 median=26 max=26`. No
  rule hits. The defend-only welcome is now **26 words** (C2 D4 trim applied; was on the 30 ceiling).
- No em/en dashes in any E16 file (house style). Parity holds (defend shell carries the de-phished copy).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 4 | 2 | 0 | 2 |
| Nit | 3 | 1 | 2 | 0 |
| **Total** | **7** | **3** | **2** | **2** |

## Earlier findings: closure

| Finding (source) | Status | Evidence on main |
|---|---|---|
| **C2 D1** unsafe montage lines open "Your choice.", doubling the engine "Your call" tag | **Closed** | `scenario.json.erb:548-569` `flipMontageByChoice`: none of the five unsafe lines carries a "Your choice." prefix (`outside_offer/engage` opens "A reply drew more pressure...", `samira/confront` "Samira, whose father..."). Matches the fixed E11. |
| **C2 D2** `feedbackThinVerdict` identical to `feedbackVerdictOnly` | **Closed** | `:513` verdictOnly = "That's a conclusion, not something you saw..."; `:514` thinVerdict now distinct = "Those facts are a good start. A conclusion about a person does not belong in the report, so take those picks out. Then add a couple more of the things you saw yourself." Credits the fact(s) picked. |
| **C2 D4** defend-only welcome on the 30-word ceiling | **Closed** | defend ink welcome 26 words (dialoguelint max=26). |
| **B3 M1** result penalises "Header checks" / SPF-DKIM jargon with nothing to tick | **Addressed** | IT look-alike item `:289-301` now scores `senderTrust` + `lookalike_domain` (paired via `flagAlternatives :296`), both of which are visible, always-offered tick chips; the authored `perFlagNote.senderTrust :298` reads "the address is on quayholt-support.example, not Quayholt's own quayholt.example" (no SPF jargon). See nit N3 for one residual I could not confirm without a render. |
| **B3 M2** every everyday choice gives its answer away ("just this once", "for safekeeping"); "unscored" then graded | **Addressed** | Beat labels rebalanced (`:363-443`): the unsafe options are now plausible actions ("Let him use your login while you sit beside him", "Export the accounts to his personal email as asked"), not self-flagged. The mistake intro `:524` now says "They aren't scored, and the debrief comes back to any worth a second look", which is true. Residual readability is inherent and accepted (B4 minor 3, D3 below). |
| **B3 M8 / B4 F5** nothing points a new player to the kiosk | **Partly** | Full welcome `ink/anjali_rao.ink:40` now "Start at the kiosk: make this week's calls first...". Defend-only welcome still has no kiosk pointer (D2 below). |
| **B1/B2 de-phished inbox labels** | **Closed** | All result/skill labels are in insider-risk language: `phishCaughtLabel` "Risks handled right", `resultCopy.handledRightLabel` "Genuine requests handled right", `criticalLead` "let a risk through", `reportedPct` "Raised {pct}% of the risks", `teamBadge` "Risks reported for the team: {n}". No phishing wording survives. One count-readability nit remains (N1). |

All C2 design findings and the two blind majors are genuinely resolved in the shipped files.

## What works

- **The register holds, which is the load-bearing thing (spec §18).** No suspicion meter, no snooping
  reward, no "investigate" ask. "You are not being asked to investigate anyone" is in the scope note, both
  briefs, the host welcome and the inbox brief. The host's done line closes it: "Nobody's in trouble for
  being approached, and nobody's a suspect for having a hard week." Samira is cleared everywhere she appears
  (the `kind` montage beat, the "Seen, said, true" card, `noBlameLine`); the two genuine colleagues whose
  *ask* is unsafe (Reuben row 2, Ross row 4) carry `kindLine`/`missLabel` and are framed as genuine with a
  safe route, not culprits.
- **One repeatable lesson:** "Your login is you. Offers get reported. Concerns go to the right person, as
  facts." The Monday card reduces it to one habit and one named person.
- **Facts track core_14** (login is you; report offers of money for access; deny unrequested prompts;
  notice/note/pass fairly; unusual isn't wrong). s170 DPA, deny-all-any-hour and "one report warns everyone"
  are faithful.
- **Fair defend set, mirror pair intact:** item 5 (look-alike IT priming MFA approval → Report) sits beside
  item 6 (genuine, pushy, locked-out caller → Verify-not-refuse). Every declared `channelTell` is used.
- **The de-phished result copy reads cleanly** and the concern-form gate does real register work (facts vs
  conclusion chips, conclusion must be removed before Finish, the guidance names a route per concern and
  ends "Posting it in the team chat is spreading it, not raising it").

## Findings

**D1. The concern-form gate accepts a "good" report that omits the offer, the one reportable security event,
and praises it. Minor, needs-user (no authored lever). `scenario.json.erb:456-516`;
`concern-form-model.js:125-134`.**
The gate (`requireNoConclusion: true`) blocks Finish only while a *conclusion* chip is selected. The grade
is otherwise purely by fact **count**: `assessReport` sets tone `facts` when `facts.length >= minFacts`
(default 2) and no conclusion is picked (`concern-form-model.js:128-131`); it never checks *which* facts.
So a learner who ticks only the two wellbeing chips (`fc_care_what` "A colleague has seemed to be having a
hard week" + `fc_care_who`) and never the outside-offer chips finishes and is told "Good. Facts, not a
verdict, are what a fair concern looks like." (B4 finding 1; nit 12.) For an insider-risk episode whose
headline reportable is the criminal offer, filing a report that leaves it out should not read as a complete
success. The form is unscored teaching, so this is minor, but the praise overshoots. There is no
`requiredFactKinds` / required-chip concept in the model, so a clean fix needs either an engine lever or a
softened `feedbackFacts` when the offer `what` chip is absent. Flagging for the user to decide; nothing to
change in the shell alone. (If a content-only mitigation is wanted now: make `feedbackFacts` acknowledge
without over-praising, e.g. old `full_only.json`/erb `feedbackFacts` "Good. Facts, not a verdict..." → "Good
— facts, not a verdict, are what a fair concern looks like. Make sure anything that needs reporting, like
that offer, is in there.")

**D2. The defend-only host welcome never points the player to the kiosk. Minor, episode-local (generator).
`ink/anjali_rao.ink` (defend shell) / `gen_e8_e17_shells.py` `LINES[('e16','defend')]`.**
The full welcome ends "Start at the kiosk: make this week's calls first..."; the defend-only welcome is
"Anjali Rao, information security. You're not here to catch anyone: keep your login yours, tell me what
you're offered, and bring me facts, not a theory." A cold defend-only player gets no object cue, and the
objective ("Handle the leaver week / Handle the messages") names none either, so they find the one kiosk by
hunting (B4 finding 5). The welcome is at 26 words, with room to add a short pointer. Fix in the generator's
`LINES[('e16','defend')]` first element, then regenerate the defend ink: old "...and bring me facts, not a
theory." → "...and bring me facts, not a theory. Start at the kiosk." (28 words). Needs-user because it
touches the shared generator and the compiled ink, outside this review's edit scope.

**D3. Two sandbox beats list the safe option first, against the ENG-04 build-log convention. Minor,
episode-local. `scenario.json.erb:378-393` (`rumour`), `:412-427` (`leaver_favour`).**
`BUILD_LOG.md:36` records the ENG-04 rule: "authors must not list the safe option first: content reviewers
check this." Of the five beats, `rumour` lists `route` (safe) before `add`, and `leaver_favour` lists
`handover` (safe) before `personal_email`; the other three list the unsafe option first. The *position* is
therefore varied across beats (2,1,2,1,2), which is good against a fixed-position tell, but it still breaks
the stated convention and means a rushed "click the first option" player gets a safe choice on those two
beats, so the flip shows them nothing to learn from there. Low priority; either reorder so the unsafe option
is first on `rumour` and `leaver_favour`, or record in the spec that varied position is the deliberate intent
and the build-log rule is superseded. (C2 read the varied position as a pass; this only surfaces the
documented rule so the author settles it, since the two cannot both be true.)

**D4. The debrief never comes back to the raise-a-concern step. Minor, needs-user (debrief view).**
B4 findings 2. The concern form shows its feedback inline, then the episode moves to the inbox and the
debrief scores and discusses only the six messages and the five beats. The form is where the episode's
distinctive lesson lives ("facts, not a verdict"), so a line of recap in the debrief would pay it off.
`debrief-view.js` has no concern-form section; this is an engine/needs-user item, not shell copy.

**N1 (nit, engine). The result counts read awkwardly.** "Risks handled right: 5 of 5 (4 reported, 1 checked
by another route)" sits next to "Checked by another route: 2" (Hana, the genuine item, is the second),
needing a second read (B4 finding 8). Count rendering is engine-side; the labels themselves are fine.

**N2 (nit, engine). "Weakest skills" lists all six tells at "caught 0 of 1 each" for a zero-tick round,**
so it reads as a list, not a coaching priority (B4 finding 9; B3 finding 4). The copy lever
(`strings.weakestTell(s)`) exists; the all-tied ordering is engine behaviour. Needs-user if it is to change.

**N3 (nit, episode-local / confirm). I could not confirm from code alone that the IT look-alike feedback no
longer surfaces the old "Fails sender authentication (SPF/DKIM/DMARC)" line** when `senderTrust` is scored.
The authored `perFlagNote.senderTrust` is plain and jargon-free, and the `auth` block (`:281-287`, all
`fail`) is data, but if the engine still appends a default senderAuth sentence for a `fail` triple the B3
jargon could persist. One eyeball of item 5's feedback on the `:3001` bridge would close this; left as a
confirm, not a change.

## Dialogue (voiced host lines)

Every Anjali line reads as spoken, in both shells: calm colleague register, no printed variables, UK
English, no dashes, within the word limit (full max 25, defend 26). I would change **none** for wording.
The done lines carry the register in a sentence each ("Nobody's in trouble for being approached, and
nobody's a suspect for having a hard week"). D1 and D4 are the only dialogue-adjacent items, and D4 is a
length/pointer trim, not a register fix.

## Examined and judged acceptable (not findings)

- **The wellbeing fact chips** (`fc_care_what`, `fc_care_who`) stay in register: framed "I'd rather not say
  more than that", routed to the manager/HR by the guidance, and Samira is cleared in the debrief. They
  model a kind welfare concern, not suspicion. (The over-praise when *only* these are picked is D1.)
- **"Refusing everything" still scores full** under `scoringProfile: "awareness"`, `passPercent: 0`. Shared
  scorer limitation met pedagogically by row 6's feedback and the modelled Verify. Conscious product choice.
- **Completion/`pass` recorded at a low round score** (B3 finding 9, B4 finding 6): by design (completion =
  pass for training). A facilitator-record question for the user, set-wide, not an E16 defect.
- **Defend-only Samira backstory lands in the debrief without the full episode's set-up** (B3, B4 finding
  11): reads fine as a short reveal; accepted.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass | pass (D2: welcome lacks a kiosk pointer) |
| mistake (sandbox) | pass (D3: two beats list safe first, against convention) | — |
| flip (montage) | pass (C2 D1 closed; prefixes gone, tags not doubled) | — |
| defend | pass (fair set, mirror pair, genuine items framed kindly; D1 concern-gate over-praise) | pass (D1) |
| debrief | pass (D4: no concern-step recap; N1/N2 count-and-list nits) | pass |

**Overall: ship-worthy.** No blockers, no majors; every C2 finding and both blind majors are closed in the
shipped files, and the register holds cleanly. The four minors are small: D1 (concern-gate over-praise) and
D4 (debrief recap) need a user call because no authored lever exists; D2 (defend-only kiosk pointer) and D3
(safe-option ordering) are quick generator/shell decisions. Pre-ship still owed (from BRAND_ADDITIONS.md,
not a review finding): web-search Ross Garside, Samira Nawaz, Craig Pickering; and spec §10 may still carry
the pre-C1 "Your choice." / "lender" wording (C2 D3, doc-only, not re-verified this pass).

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 4 minor, 3 nit (7 total; 3 episode-local, 2 engine, 2 needs-user).
- Blockers: none.
- Majors: none (C2 D1/D2/D4 and blind B3 M1/M2 all verified closed on main).
- Verdict: ship-worthy; apply D2 (defend-only kiosk pointer) and D3 (safe-option ordering) at the next
  generator pass, and put D1 (concern-gate over-praise on an offer-omitting report) and D4 (debrief does not
  recap the concern step) to the user, as both need an engine/config lever.
