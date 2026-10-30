# E17 "Acceptable use": confirmation design + dialogue review C4

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. E17 is **defend-only by
user decision**: one shell, no attack half, no `mistake` stage, no flip. It carries the "can I?" three-way
sort (`sortDrill`, scored) plus the scored six-item inbox-triage set. Company Tarrowby Logistics; host Nilesh
Solanki; module core_16.

This is the **C4 confirmation pass** after C3. Since C3 (commit `e14b542c2`) E17 changed in two commits:
`37ca4432f` (C3 N1: objective title without quotes) and `8939d2bba` (authored the critical-miss penalty so a
rushed round reads low but not zero). It judges the files on main (git clean when read). Method and bar:
`REVIEWER_BRIEF.md`, the `scenario-design-review` / `npc-dialog-review` skills adapted to this kind, the pilot
reviews, and the prior E17 reviews. Note from the BUILD_LOG: **C3 D1 ("no sort-drill recap in the debrief")
was a false finding** — batch 10's `drillRecap` renders in `debrief-view.js` and E17's drill is scored. I
re-confirmed this (below). Judged from code and authored data; no bridge run needed this pass (no new
authored lever to see on screen, and the named live focus this round was E16's concern gate).

## How judged

- `validate_scenario.rb --strict-social --no-graph --skip-ink`: schema passes, no social errors or warnings
  (only the generic m01 suggestions, irrelevant to an awareness kiosk).
- `dialoguelint.mjs`: ink `lines=3 median=26 max=28`, no rule hits; timed texts 0.
- No em/en dashes anywhere in the shell, mission.json or ink (house style).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 2 | 0 | 1 | 1 |
| Nit | 1 | 0 | 1 | 0 |
| **Total** | **3** | **0** | **2** | **1** |

## Earlier findings: closure

| Finding (source) | Status | Evidence on main |
|---|---|---|
| **C3 D1** no sort-drill recap in the debrief | **Confirmed false, closed** | `sortDrill.scored: true` (`:420`); `debrief-view.js:442-450` renders the "cards to look at again" recap for a scored drill with misses. The recap exists; the C3 finding was wrong. |
| **C3 N1** objective title renders as a typo when quotes are stripped | **Closed** | Objective `title` (`:26`, `:44`) and `endGoal` reworded: title is "Sort the everyday moments"; the quoted "can I?" survives only in the brief/sort copy where it reads correctly. |
| **C2 DLG1 / D1 / D2, C1 MI2, B1 M1** (per C3) | **Closed** (re-confirmed) | Host completion line, S07 card, item 2 tell, the monitoring panel and the de-phished copy are all as C3 recorded; none regressed. |
| **New: critical-miss penalty** (`8939d2bba`) | **Landed, coherent** | `scoring: { criticalPenalty: 5, criticalPenaltyCap: 10 }` (`:68-70`), matching the set-wide "rushed round reads low, not zero" change; `passPercent: 0` keeps completion = pass. No finding. |

All C3-era design and dialogue findings are closed or shown false on main.

## What works

- **The three-answer frame is clear and the sort scoring teaches the intended habit.** Allowed / Not allowed
  / Ask first, `alwaysScoresBin: "ask"` so caution is never marked wrong, the real answer rewarded most,
  blanket-refuse scoring worst; `drawCount: 9` with `oneOfEachAnswer: true`; the seven judgement cards carry
  `locked: true` so a deployment override cannot soften them.
- **Facts track core_16** (personal use in your own time fine; work logins work-only; unchecked software and
  USB to the service desk; never share a password or read back a code; look at personal data only with a work
  reason, s170 DPA; report a mistake at once; the monitoring panel states what is checked and the legal limit).
- **Matched inbox with the mirror pair** (item 1 normal-looking unapproved install / item 4 suspicious-looking
  genuine monitoring notice), both genuine notices carrying a `falseAlarmCost`.
- **The de-phished result copy and `verdictFeedback`** read as plain English and in register; the Monday card
  names the right person per concern; the host line is well-voiced ("Nilesh, service desk. Every rule here has
  a 'because'...").

## Findings

**D1. The brief/report framing lets a player Report everything and lose little. Minor, needs-user (set-wide).
`scenario.json.erb:65` (inbox brief), Report hint.** Carried from C3 D2. The brief says checking first is
fine and Report is "This breaks a rule or needs a look", so under `scoringProfile: "awareness"` the two
genuine notices still score full when reported (only a *deleted* genuine notice costs). The over-report cost
lives in the `genuineCopy`/`falseAlarmCost` lines, not in the number. This is the known set-wide
awareness-profile question (same as E8/E16); in E17 the "don't refuse everything" bite genuinely lives in the
**sort** (refuse-all scores worst there), so it is met pedagogically. Re-raised only so the orchestrator
settles once, set-wide, whether a false alarm should ever cost; nothing E17-specific to change.

**D2. Possible contradictory Delete feedback on the genuine notices. Minor, engine.**
Carried from C3 D3. The authored `labels.verdictFeedback.delete.real` (`:133`) is clean ("That one was a
genuine notice, and deleting it left it unread. Trusting it, or checking it first, was the right call here").
B2 saw the *composed* on-screen genuine-item feedback still imply Report is safe on an item whose lesson is
"this is fine, handle it". The authored string is not the problem; the engine-composed genuine-item feedback
is. Pinning the exact composed string needs a render; low priority, engine/needs-user.

**N1 (nit, engine). No end send-off after Finish.** The episode ends on toasts and the kiosk "done"
narration; Nilesh's done line (ink `:22`) only fires on re-talk, so a player who walks away never hears it.
The success screen makes completion clear, so this is a nit, not a defect.

## Dialogue (voiced host lines)

Nilesh's two lines (welcome, done) read as a calm service-desk colleague, no printed variables, UK English,
no dashes, within the limit (max 28 words). The welcome carries the kiosk pointer and the "can I?" frame in
one breath. "Haulier" in the inbox brief is ordinary UK English and reads fine. I would change **none** for
wording.

## Examined and judged acceptable (not findings)

- **`ruleOfThumb` is the shared phishing habit line** (money/codes), byte-identical across the set. It reads
  slightly off on acceptable use, but it is a deliberate set-wide constant; E17's own signature habit ("Not
  sure? Ask first") is carried by the scope note, Monday card, bin hint and host line. Set-wide product call.
- **Completion/`pass` recorded at a 0% round**: by design. Facilitator-record question, set-wide.
- **The firm's few rules are stated in the sort intro** (`:442`) and the reason shows after each card, so the
  policy is present before and during the sort; acceptable.

## Verdict per stage

- **Brief** — *Ship-worthy.* `brief`/`scopeNote`/`defendIntro` are plain and in register; host welcome in
  range and well-voiced; objective title no longer reads as a typo.
- **Defend (sort + inbox)** — *Ship-worthy.* Sort scoring sound, locked cards safe, mirror pair present,
  tells aligned; the critical-miss penalty lands a rushed round low but not zero. D1 (over-report) is the
  set-wide awareness-profile question; D2 is an engine feedback-composition item on the genuine notices.
- **Debrief** — *Ship-worthy.* De-phished copy and the monitoring panel accurate and plain; the scored
  sort-drill recap renders (C3 D1 was false). No open debrief gap.

**Overall: ship-worthy.** No blockers, no majors; every C3-era design and dialogue finding is closed or shown
false on main, and the C3 N1 objective-title nit is fixed. The two minors are the set-wide over-report
question (D1) and an engine feedback-composition item (D2); the one nit is the missing end send-off. None
blocks ship. Pre-ship still owed (C2, not a review finding): web-search the invented lure domains
`harlow-freight.example`, `meetly-app.example`, `quickconvert-online.example`.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 2 minor, 1 nit (3 total; 2 engine, 1 needs-user).
- Blockers: none.
- Majors: none (C3 D1 confirmed a false finding; C3 N1 objective title fixed; the critical-miss penalty is coherent).
- Verdict: ship-worthy; D1 (set-wide over-report) and D2 (engine-composed genuine-notice Delete feedback) are
  the carried minors for the user, not shell copy; N1 (no end send-off) is a nit.
