# E18 "Credential attacks at scale": design + dialogue confirmation review C4

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. E18 is the
organisation-scale twin of E9: a six-stage full episode (`brief, osint, guess, flip, defend, debrief`) with
the `guess` stage in `mode: "spray"` and the ENG-01 flip aftermath, plus a three-stage defend-only shell.
Company Merrin & Sallow Architects; host Ama Owusu (security lead on the practice's provider Fenlow Managed
IT); modules core_03 + role_03. Content rule: attack content stays at template and psychology level (opened
accounts as a count, masked stuffing rows, no working credential, tool, command or threshold); this review is
kept at the same level.

Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` / `npc-dialog-review` skills adapted to the
awareness kind, and `E18_DESIGN_C3.md` plus the `BUILD_LOG.md` lines since (the C3 de-phish fix 418cef44e, the
cross-episode critical-penalty pass 8939d2bba, and batch 12, which did not touch E18).

How the screens were judged: **from the file read and the engine code**, cross-checked against the C3 review
and the two E18 blind runs' live observations. No fresh render this pass; where a finding rests on a live
screen I name it. Ran green:
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: clean, only the generic
  `timedConversation` recommended-field note.
- `dialoguelint.mjs` on both: full `lines=12 median=18 p90=24 max=25`; defend `lines=3 median=28 p90=28
  max=28`. No rule hits, no printed variables, every host line under the 30-word cap.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 1 | 1 | 0 | 0 |
| Minor | 4 | 0 | 0 | 4 |
| **Total** | **5** | **1** | **0** | **4** |

## C3 closure

Checked against the current shells (both erbs edited 2026-10-30 04:18, commit 418cef44e).

| C3 finding | Claimed fix | Verified | Status |
|---|---|---|---|
| MAJOR-1: scored screens say "phish" (header counter, result band, count label, reported line, critical line) while E18 says "fakes" | port E19's de-jargoned block | `labels.teamBadge` "Fakes stopped for the team: {n}", `labels.teamBadgeTitle`, `labels.phishCaughtLabel` "Fakes caught", `bands` top "Well done: you caught the fakes and knew why", `resultCopy.reportedPct` "Reported {pct}% of the fakes", `resultCopy.criticalLead`, `genuineCopy` and `criticalWhat` "trusting a look-alike message" are all present in both shells (full `:103-128`, defend `:81-106`). The running header counter, the result band headline, the count label, the reported-percentage line and the critical-miss line are all de-phished. | **Mostly closed; three surfaces remain (MAJOR-1 below)** |
| MIN-2 shared habit line partly off-topic | product-level, cannot fix episode-local | Unchanged; still the shared byte-identical string | Carried (MIN-3 below) |
| MIN-3 dense debrief stack | product-level layout | Unchanged | Carried (MIN-4 below) |
| MIN-4 timing not verified live | timed run | No timed human run on record | Carried (MIN-5 below) |

## What works (confirmed this pass)

- **The C3 de-phish landed on the surfaces it touched.** The inbox header counter, the result band, the
  "Fakes caught" count label, the reported-percentage line, the genuine-item cost copy and the critical-miss
  line all now read in E18's "fakes"/"look-alike" register. The three fakes each carry a de-jargoned
  `reportReply` (`:202/:268/:296`), so a reported fake never draws the engine's "Confirmed as a phish"
  fallback (`inbox-triage-minigame.js:1193`); `missedPhishLine` is not set, so that surface never renders.
- **The mirror pair, calibration and no-blame register still hold** (lockout 1/2, sign-in 3/4, breach 5/6;
  three genuine items so "report everything" doesn't win; the genuine breach notice after the trickiest fake;
  clean `whyFine`/`falseAlarmCost`/`ifTrusted`/`noBlameLine`).
- **Facts track core_03/role_03** (spraying, stuffing, the one-habit fix, the breach check that uses the email
  not the password, Have I Been Pwned, the practice controls voiced as the provider's), and the host ink is
  calm-colleague, UK English, under the word cap, no printed variables.

## Findings

### MAJOR-1 (reopened, partial) - "phish" still surfaces on three E18 player-facing screens the C3 de-phish missed. Episode-local, content. Both shells.

The C3 fix de-jargoned the triageSet `labels`/`bands`/`resultCopy`/`genuineCopy`/`criticalWhat`, but **three
scored surfaces that E19 and E20 both cover were not touched**, so they fall back to engine defaults that say
"phish" in an episode whose own copy says "fakes":

1. **Per-item review card, Trust (and Verify) on a fake.** E18 sets no `labels.verdictFeedback` and no
   per-item `kindLine`/`verifyLine` on the three fakes. For an email kind `kindVerdictLine` returns null
   (`triage-kinds.js:186-213`), so `_verdictLine` falls to the generic phish block
   (`inbox-triage-minigame.js:999-1011`): Trust renders **"Not this time. This one was a phish."** and Verify
   **"Checking first is a sound habit. This one was a phish."** Trusting a fake is the exact miss the episode
   teaches against, so the learner who most needs the lesson reads "phish". E19 avoids this with a set
   `labels.verdictFeedback` (`:85-93`, "That one put the device at risk."); E20 with a per-item `kindLine` on
   all three fakes (`:206/:244/:348`). E18 has neither.
2. **Debrief team line.** E18's debrief `strings` block (full `:492-526`, defend equivalent) sets no
   `teamLine`, so it defaults to **"...kept one phish away from the rest of your team."** / "N phish"
   (`debrief-view.js:288`). This renders whenever the learner reported or checked at least one item - the
   common path for almost every playthrough. E19 (`:459`) and E20 (`:500`) both set a "fakes"/"problems"/
   "traps" `teamLine`; E18 does not.
3. **Debrief all-correct line.** E18 sets no `strings.allPhishRight`, so a clean round in which a genuine
   alert was reported renders **"Every phish was caught, with every tell named."** (`debrief-view.js:46`,
   selected at `:438` when `genuine.flagged`). E19 (`:456`) and E20 (`:498`) both set it; E18 does not.

So the answer to "is every scored screen string in E18 free of 'phish'?" is **no**: the header counter, result
band, count label, reported line and critical line are clean, but the per-item Trust/Verify feedback and both
debrief lines above still say "phish". E18 is now the lone holdout on exactly the three surfaces the C3 fix
left behind, and E19/E20 show the finished pattern.

Fix (episode-local, no engine change; port E19/E20's keys adapted to E18's "fakes" register, to both
`scenarios/awareness_e18_credential_attacks_at_scale/scenario.json.erb` and `..._defend/scenario.json.erb`,
and the source fragment under `planning_notes/phishing_and_social_engineering/awareness/e18/`):
- add `labels.verdictFeedback` with `phish`/`real` sub-maps in E18's words, or a per-item `kindLine` on each
  of the three fakes (e.g. "This one was a fake, after your password; a real notice never asks for it.") so
  the Trust/Verify line reads "...This one was a fake." not "...a phish.";
- add `strings.teamLine`, e.g. "By reporting or checking {n} of these rather than acting on them, you kept a
  fake away from the rest of your team." (the E19/E20 shape);
- add `strings.allPhishRight`, e.g. "Every fake was caught, with every sign named."

(Exact strings are a content call for the opus48 author; the requirement is that no E18 player-facing surface
says "phish" while the episode's own copy does not.)

### MIN-2 - the top result band says "Well done:" while every other episode (and the engine default) says "Sharp:". Minor, needs-user (product, course-wide). New.

E18's top band is "Well done: you caught the fakes and knew why" (full `:110`, defend `:88`), set by the C3
fixer. Every other built episode and the engine default use "Sharp:" (E19 `:106` "Sharp: you caught the
problems and knew why"; E20 `:102` "Sharp: you spotted the traps and knew why"; `triage-scoring.js:31`). So
E18 is the only "Well done:" in the course.

Which reads better: **"Well done:"**, for this audience and register. The E18 B1 run flagged "Sharp:" as
reading "more gamified than the measured, grown-up tone of the rest of the copy"; "Well done:" is plain
British praise that fits the calm, no-blame, non-technical register the brief asks for. **Should they match:
yes** - a course should not switch its congratulation word between episodes. The clean resolution is to
standardise the course on "Well done:" (move the other episodes' top band to it), rather than reverting E18 to
"Sharp:". This is a product-wide wording call for the user; no shipped E18 file is wrong, and it is not a ship
blocker. (The BUILD_LOG already records this as an open C4 question.)

### MIN-3 - the shared "habit to keep" line is partly off-topic for a credential episode. Minor, needs-user (product, shared string). Carried.

The debrief's shared rule-of-thumb ("...move money, grant access, sign in or read back a code...") is on point
for "sign in"/"grant access" but not for "move money"/"read back a code". Held byte-identical course-wide and
enforced by the rule-of-thumb test; cannot be fixed episode-local. Product-level call (vary by module, or a
per-episode lead-in). No shipped E18 file is wrong. Unchanged from C3 MIN-2.

### MIN-4 - the debrief panel stack is dense. Minor, needs-user (product). Carried.

~8 debrief panels, the standard ENG-09b shape, with "The one habit" and "The habit to keep" near each other.
A product-level layout decision, not an E18 defect; content and facts are correct. Unchanged from C3 MIN-3.

### MIN-5 - timing not verified live. Minor, needs-user. Carried.

The ~15-minute full / ~8-minute defend budgets rest on scripted/estimated runs; B2 estimated ~16-17 minutes
full. Worth one timed human run before ship. Unchanged from C3 MIN-4.

## Voiced host lines I would change

None. Every host line in both shells voices as a calm colleague, within the cap, UK English, no printed
variable. MAJOR-1 and MIN-2 are on-screen result/debrief copy, not voiced lines.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass | pass |
| osint | pass | - |
| guess (spray console) | pass | - |
| flip | pass | - |
| defend | pass on set/scoring; **per-item Trust/Verify feedback still says "phish" (MAJOR-1)** | same |
| debrief | pass on facts and no-blame; **team line and all-correct line still say "phish" (MAJOR-1)**; "Well done:" vs "Sharp:" (MIN-2); shared habit line (MIN-3), dense stack (MIN-4) | same |

**Ship-blocking? No. Ship with one fix recommended.** No blocker. The C3 de-phish closed most of MAJOR-1, but
three surfaces (per-item Trust/Verify feedback, debrief team line, debrief all-correct line) still carry
"phish"; the team line is on the common path. The fix is a self-contained content addition that ports E19/
E20's `verdictFeedback`/`kindLine`, `teamLine` and `allPhishRight` to E18's "fakes" register, no engine work.
The four minors are a new course-wide band-wording call (MIN-2) and three carried product-level/timing items.
No content-rule slip.

---

### Return (one line each)

- Counts: 0 blocker, 1 major (episode-local), 4 minor (all needs-user).
- Prior closure: C3 MAJOR-1 mostly closed (header counter, result band, count label, reported line, critical
  line all de-phished), but three surfaces left behind; C3 MIN-2/3/4 carried unchanged.
- Blocker: none.
- Major: MAJOR-1 (episode-local, content, both shells) - "phish" still shows on the per-item Trust/Verify card
  ("This one was a phish.", `inbox-triage-minigame.js:1002`; no `verdictFeedback`/`kindLine`), the debrief team
  line ("N phish", `debrief-view.js:288`; no `strings.teamLine`) and the debrief all-correct line ("Every
  phish was caught", `:46`; no `strings.allPhishRight`); port E19/E20's keys adapted to "fakes".
- Verdict: ship-worthy once MAJOR-1 is applied; MIN-2 (standardise the top band on "Well done:" course-wide,
  which reads better here), MIN-3 (habit line), MIN-4 (debrief density) and MIN-5 (timed run) are
  needs-user/carried and non-blocking.
