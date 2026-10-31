# E18 "Credential attacks at scale": design + dialogue confirmation review C3

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. E18 is the
organisation-scale twin of E9: a six-stage full episode (`brief, osint, guess, flip, defend, debrief`) with
the `guess` stage in `mode: "spray"` (campaign console) and the ENG-01 flip aftermath, plus a three-stage
defend-only shell. Company Merrin & Sallow Architects; host Ama Owusu (security lead on the practice's
provider Fenlow Managed IT); modules core_03 (passwords and MFA) + role_03. Content rule: attack content
stays at template and psychology level (opened accounts as a count, masked stuffing rows, no working
credential, tool, command or threshold); this review is kept at the same level.

Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` / `npc-dialog-review` skills adapted to the
awareness kind, and the prior E18 reviews (`E18_DESIGN_C1.md`, `E18_DESIGN_C2_DIALOG_C1.md`), both blind runs
(`E18_BLIND_B1.md`, `E18_BLIND_B2.md`) and the playtest (`E18_PLAYTEST_P1.md`) for format and the standing
findings, plus the `BUILD_LOG.md` E18 lines and the engine batch 9-11 history.

Scope read end to end: both shells `scenarios/awareness_e18_credential_attacks_at_scale{,_defend}/
{scenario.json.erb, ink/ama_owusu.ink}`; the spec `.../episodes/E18_credential_attacks_at_scale.md`; and the
engine the findings depend on (`password-guesser/password-guesser-model.js`,
`inbox-triage/inbox-triage-minigame.js`, `inbox-triage/triage-scoring.js`,
`episode-runner/episode-runner-minigame.js`).

How the screens were judged: this pass judged **from the file read and the engine code**, cross-checked
against the two blind runs' live observations (B1 and B2 both drove the full episode, the reload-resume and
the defend-only variant to completion). I did not run a fresh render; where a finding rests on a live screen
I name the blind report that witnessed it. Ran green this pass:
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: clean, only the generic
  `timedConversation` recommended-field note every awareness shell draws.
- `dialoguelint.mjs` on both: full `lines=12 median=18 p90=24 max=25`; defend `lines=3 median=28 p90=28
  max=28`. No rule hits, no printed variables, every host line under the 30-word cap.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 1 | 1 | 0 | 0 |
| Minor | 3 | 0 | 0 | 3 |
| **Total** | **4** | **1** | **0** | **3** |

## C1/C2 and blind/playtest closure

Checked each earlier finding against the live files (full erb edited 2026-10-30 00:24, defend 00:05).

| Prior finding | Ruling / claimed fix | Verified | Status |
|---|---|---|---|
| C2 MIN-2 flip lead + aftermath heading both "a few minutes later" | trim the phrase from `flipGuessIntro` | `strings.flipGuessIntro` (full erb `:474`) now ends "...your own seat, with the alerts starting to arrive."; the aftermath heading (`:444`) carries the timing. No back-to-back repeat. | **Closed** |
| C2 MIN-3 defend-only welcome "come thick" (non-idiomatic) | "come thick" -> "come fast" | Defend ink `:24` reads "After an attack the alerts come fast, some real, some fakes...". 28 words. | **Closed** |
| C2 known-and-queued: defend-only carries leftover flip strings (`flipMissedHeading`, `flipLandedNoTells`) | generator pass-2 strip | Defend erb `strings` block (`:303-327`) now holds only brief/noBlameLine/mondayCard/defendOnly/conceptPanel/defendIntro. No flip strings remain. | **Closed** |
| B2 F1 research card promises a five-fact gate that isn't enforced | reword | `strings.stages.osint.text` (`:470`) now reads "...Five useful facts are there to find, and the more you note, the more the campaign has to work with", and names that the useful lines are "the patterns and projects, not individual staff" (also answers B2's person-card trial). No false gate. | **Closed** |
| B2 F2 guesser "could not add / could not run / half missing" lines don't name the missing fact | reword the `guess.strings` | `guess.strings` (`:338-343`) now overrides `rosterMissing` ("...it needs the staff names from the People page and the email pattern from the Contact page"), `wordListMissing` ("...this word comes from a page you have not read") and `sprayMissing` ("...the address list, or the word it is built from, is still missing"). Each names its source. | **Closed** |
| B2 worst-line #3/#4 zero-research "0 of 0 accounts opened" / "half missing" double negative | engine `strings.sprayNoTargets` (batch 11) | A zero-roster run now renders the engine default `sprayNoTargets` "No staff accounts were built, so there was nothing to spray." with a neutral "not run" status, not "0 of 0 ... did not work" (`password-guesser-model.js:233-246`). E18 keeps the default, which reads as English. | **Closed (engine)** |
| B2 F4 defend-only doubled-suffix global `..._defend_defend_done` | — | Still present (`defend/scenario.json.erb:56`). Known generator convention across every defend-only shell (BUILD_LOG flags a later `_complete` rename); internal only, not player-facing. Not re-raised. | **Carried (accepted)** |

## What works (confirmed this pass)

- **Both C2 majors from C1 stay closed.** The flip reads as the learner's own seat (step "Your inbox",
  heading "Now it's your inbox.", `flipGuessIntro` names both halves of the attack in the own-seat voice,
  B1/B2 confirmed live), and the four-pass spray console reads cleanly ("tried once on every account", one
  "3 of 5 accounts opened" summary, masked stuff rows, the three-random-words passphrase never lands).
- **The batch 9-11 surfaces that touch E18 read well.** The zero-target spray line (B2's worst double
  negative) is now a plain "nothing to spray"; the Episode-finished panel uses the clear engine default
  ("Episode finished" then Close, `episode-runner-minigame.js:711`); E18 has no `mistake`/everyday-choices
  stage, so the sandbox-recap and everyday-choices-intro batch changes do not apply here.
- **The mirror pair is fair and the discriminator is right.** Lockout (rows 1/2), sign-in (3/4) and breach
  (5/6) each pair a genuine notice against a look-alike, so "an alert arrived" is never the tell; the real
  line throughout is "a genuine notice never needs you to type a password to unlock or check". The genuine
  breach notice (row 6) follows the trickiest fake (row 5 breach checker) - the brief's "similar genuine
  item after a likely miss". Three genuine items defeat "report everything" pedagogically.
- **Facts track core_03/role_03** (spraying, stuffing, the one-habit fix, the breach check that uses the
  email not the password, Have I Been Pwned, the organisation controls voiced as the provider's), and the
  **no-blame register is clean** across the brief, every `whyFine`/`falseAlarmCost`/`ifTrusted`, the
  `noBlameLine`, the Monday card and both host completion lines.
- **Host ink voices as a calm colleague** in both shells, under the word cap, UK English, no em/en dashes,
  no printed variables; "a few bad tries" / "a run of bad sign-ins" carry the lockout idea without a
  threshold number, honouring the content rule.

## Findings

### MAJOR-1 - E18 is the only awareness episode still missing the de-jargoned result-copy layer, so "phish" surfaces live where the episode otherwise never uses the word. Episode-local, content. Affects both shells.

E18's `triageSet` carries `channelTells`, `flagChips`, `skillNames`, `outcome` and `messages`, but **none of
the self-describing result copy** that every other awareness episode got in engine batch 8 and that its
sibling E19 was given in the same build wave (E19's latest edit added `bands`, `labels.phishCaughtLabel`,
`labels.scoreLine`, `resultCopy`, `genuineCopy`, `criticalWhat`). With those keys absent, the scored
surfaces fall back to engine defaults that all read "phish":

- the running inbox **header counter** shows "Phish stopped for the team: N" (`inbox-triage-minigame.js:575`,
  default; E18 sets no `labels.teamBadge`);
- the **result band headline** at 85%+ is "Sharp: you caught the phish and knew why" (`triage-scoring.js:31`,
  default) - witnessed live in **B1 worst-line #5**, which also noted the "Sharp:" prefix reads "more
  gamified than the measured, grown-up tone of the rest of the copy";
- the **count label** is "Phish caught N of N" (`inbox-triage-minigame.js:1447`, default; E18 sets no
  `labels.phishCaughtLabel`);
- the **reported line** is "N% of the phish" (`:1423`, default);
- the **critical-miss line** reads "let an attacker straight in (trusting a phish email)"
  (`:1479`/`:1491`, defaults; E18 sets no `resultCopy.criticalLead`/`criticalWhat`) - witnessed live in
  **B1 line 116**.

E18's own copy calls these "fakes", "look-alikes", "alerts", "problems" throughout and never once says
"phish"; the word appears only through these engine defaults. A learner plays the whole inbox with a "Phish
stopped for the team" counter ticking, then a "Phish caught" result, in an episode that deliberately avoids
the term. E19 (same company family, same wave) was fully de-phished; E18 is the lone holdout. B1 flagged the
headline as a worst line but it was never elevated to a tracked finding, and the subsequent fixer edit (full
erb 00:24) added the research/guesser rewording without this layer.

Severity note: the items *are* phishing-style fakes, so "phish" is not factually wrong, and an episode-18
learner has met the word across E1-E17 - a reviewer could read this as a high minor. I rate it major because
it is player-facing copy on the scored screen and the running header, it is off E18's own consistent
register, B1 already flagged it, and it is the single de-jargoning step the course applied everywhere else.

Fix (episode-local, no engine change - all keys are already honoured for an awareness email/page set, as E19
proves). Add to the `e18_atscale_inbox` triageSet in both `scenarios/awareness_e18_credential_attacks_at_scale/
scenario.json.erb` (near `:103-111`) and `..._defend/scenario.json.erb` (near `:81-89`), and the source
fragment `planning_notes/phishing_and_social_engineering/awareness/e18/defend.json`, the E19 block adapted to
E18's "fakes" register, e.g.:
- `bands`: 85 "Sharp: you caught the fakes and knew why" / 60 "Getting there: a few tells slipped past" / 0
  "Worth practising: here's where to look first".
- `labels.phishCaughtLabel`: "Fakes caught"; `labels.teamBadge`: "Fakes reported for the team: {n}";
  `labels.teamBadgeTitle`: "Fakes you reported or checked by another route this round"; `labels.scoreLine`:
  "Right call is most of the score; naming what you noticed is the rest."
- `resultCopy.reportedPct`: "Reported {pct}% of the fakes"; `resultCopy.criticalLead`: "handed a password to
  a fake".
- `criticalWhat`: "signing in, or typing a password, into a fake page".
- `genuineCopy`: the E19 `costBoth`/`costReport`/`costBin`/`whyBothHalves` shape, reworded for the
  genuine-notice case (reporting a real precautionary notice costs the service desk a moment).

(The exact strings are a content call for the opus48 author; the requirement is that no player-facing
surface says "phish" while the episode's own copy does not.)

### MIN-2 - the shared "habit to keep" line is partly off-topic for a credential episode. Minor, needs-user (product-level, shared string). Carried.

The debrief's **The habit to keep** card is the shared rule-of-thumb, held byte-identical across the course
(spec §12; the rule-of-thumb test enforces it): "When a message pressures you to move money, grant access,
sign in or read back a code, stop and check it yourself...". For E18 the "sign in" / "grant access" clauses
are exactly on point, but "move money" and "read back a code" are not this episode's lesson. Flagged already
in `E18_PLAYTEST_P1.md` F-E18-16 and mirrored in E19 B1 m-4 and E20. It cannot be fixed episode-local without
breaking the shared string; it is a product-level call for the user (whether the shared habit line should
vary by module, or carry a per-episode lead-in). No shipped E18 file is wrong. Not a ship blocker.

### MIN-3 - the debrief panel stack is dense. Minor, needs-user (product-level). Carried.

`E18_PLAYTEST_P1.md` F-E18-16 counts ~8 debrief panels (what happened, spraying, stuffing, the one habit,
what the practice does, the habit to keep, the Monday box, how to report), with "The one habit" and "The
habit to keep" sitting near each other and the Monday box ~65 words. This is the standard ENG-09b concept-card
+ Monday + habit + report-route debrief shape shared by every episode, so trimming it is a product-level
layout decision, not an E18 defect. Content and facts in the cards are correct. Recorded, not re-raised as
new.

### MIN-4 - timing not verified live. Minor, needs-user. Carried from C1/C2.

The ~15-minute full / ~8-minute defend budgets rest on the per-stage table and the scripted/estimated runs,
not a timed human run. B2 estimated the full episode at ~16-17 minutes (target ~15), the red-team half
carrying most of the reading. Worth one timed full-episode playtest before ship. No change implied if it
holds.

## Voiced host lines I would change

None. Every host line in both shells (the full welcome, the after-campaign recap, both completion lines, the
defend-only welcome and completion line, the "Thanks, Ama." / "Any time." exchange) voices as a calm
colleague, is within the word cap, carries no printed variable, and is UK English. MAJOR-1 is on-screen
result copy, not a voiced line.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass | pass |
| osint | pass (five facts; gate wording fixed, B2 F1) | - |
| guess (spray console) | pass (four passes, masked stuff, passphrase holds; zero-target line fixed) | - |
| flip | pass (own-seat `flipGuessIntro`, "a few minutes later" dedup fixed) | - |
| defend | pass on the set and scoring; **result/header copy carries "phish" (MAJOR-1)** | same as full |
| debrief | pass on facts and no-blame; shared habit line partly off-topic (MIN-2), dense stack (MIN-3) | same |

**Ship-blocking? No. Ship with one fix recommended.** No blocker; the episode completes, scores and teaches,
and every earlier design/dialogue/blind finding bar the result-copy layer is closed. The one major (MAJOR-1)
is a self-contained content addition that removes "phish" from E18's scored screens and running counter, to
match its own register and the de-jargoned sibling E19; it needs no engine work. The three minors are carried
product-level/timing items. No content-rule slip: the console shows no working credential, tool, command or
threshold, and opened accounts stay a count.

---

### Return (one line each)

- Counts: 0 blocker, 1 major (episode-local), 3 minor (all needs-user/carried).
- Prior closure: C2 MIN-2/MIN-3 closed, leftover defend flip strings stripped, B2 F1 (false research gate)
  and F2 (opaque guesser lines) closed, B2 zero-target double-negative closed by the engine `sprayNoTargets`
  default; B2 F4 doubled-suffix global carried as an accepted generator convention.
- Blocker: none.
- Major: MAJOR-1 (episode-local, content) - E18's triageSet has no `bands`/`labels.teamBadge`/
  `phishCaughtLabel`/`resultCopy`/`genuineCopy`/`criticalWhat`, so the header counter ("Phish stopped for the
  team"), result headline ("you caught the phish"), count ("Phish caught") and critical line ("trusting a
  phish email") use "phish" where E18 otherwise never does; port E19's de-jargoned block adapted to "fakes".
- Verdict: ship-worthy once MAJOR-1 is applied; the shared habit line (MIN-2), debrief density (MIN-3) and a
  timed run (MIN-4) are product-level/carried and non-blocking.
