# E19 "Malware, ransomware and updates": design + dialogue confirmation review C4

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. E19 is a
**consequence-flip** episode (ENG-04): no attack half and no phish target, the four-beat mistake sandbox is
the one "attack artefact" and the montage flip shows where each choice led. Full = 5 stages
(`brief, mistake, flip, defend, debrief`); defend-only = 3 (`brief, defend, debrief`). Company Quayholt
Insurance; host Anjali Rao; module core_07.

Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` / `npc-dialog-review` skills adapted to the
awareness kind, and `E19_DESIGN_C3.md` plus the `BUILD_LOG.md` lines since. Since C3 the only E19 edit was the
cross-episode critical-penalty pass (8939d2bba, 2026-10-30 04:13): `criticalPenalty` 5 / cap 10 on the defend
set. Batch 12's content pass did not touch E19.

How the screens were judged: **from the file read and the engine code**, cross-checked against the C3 review
and the two E19 blind runs. No fresh render. Ran green:
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: clean, only the generic
  `timedConversation` note.
- `dialoguelint.mjs` on both: full `lines=6 median=21 p90=29 max=29`; defend `lines=3 median=28 p90=29
  max=29`. No rule hits, no printed variables, every host line under the cap.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 2 | 0 | 1 | 1 |
| **Total** | **2** | **0** | **1** | **1** |

## C3 closure and the penalty pass

| Item | Verified this pass | Status |
|---|---|---|
| C3 said ship-ready, all C1/C2/blind result-copy and "Leo-is-a-phish" findings closed | Re-confirmed on the current files: `bands` de-phished, `labels.phishCaughtLabel` "Problems caught", `teamBadge` "Problems reported for the team: {n}", `resultCopy.criticalLead`/`criticalWhat`, ransom-note `verifyLine`/`reportLine`/`kindLine`/`missLabel`, `strings.teamLine` (`:459`) and `strings.allPhishRight` (`:456`) all present and in "problems" words | **Closed** |
| New: critical-penalty pass (8939d2bba) | `scoring.criticalPenalty` 5 / cap 10 now authored on the defend set; a rushed round now floors low-but-not-zero rather than at 0%; bridge e19 16/16 per the log. No copy changed, no new "phish" surface introduced | **Verified, no regression** |
| De-phish completeness (the E18 gap, checked against E19) | E19 sets `labels.verdictFeedback` (`:85-93`, "That one put the device at risk."), a per-item `kindLine`/`verifyLine`/`reportLine` on the ransom note, a set + per-item `reportReply`, `strings.teamLine` and `strings.allPhishRight`. None of the engine "phish" defaults (`inbox-triage-minigame.js:1002/1193`, `debrief-view.js:46/288`) is reachable. The `verdictFeedback.phish` / `isPhish` / `allPhishRight` tokens that remain are schema key names, not player text | **Clean** |

## What works (confirmed this pass)

- **No "phish" reaches any E19 player-facing surface.** Every engine default that would say it is overridden;
  Leo's genuine ransom incident reads as "a problem to catch" with its own feedback lines, not as a phish.
- **One repeatable lesson, carried everywhere** ("a program, a file or an app you didn't start runs with your
  access... don't open the door, report it"), in the set brief, the concept card, the host ink, the montage
  and the defendIntro.
- **Facts match core_07 exactly** (extension 4444; unplug the cable and leave it on; don't pay/contact/fix;
  restart within a day / self-restart at 19:00; macro as the small program inside the file; backup separate
  from the computer; a web page offering an update is never genuine; Quayholt Protect / Quayholt Files).
- **Mirror pair, calibration and no-blame register are fair** (unknown-app consent vs the genuine Quayholt
  Files consent; the genuine device update with a `falseAlarmCost`; the ransom note scored as a problem; the
  `noBlameLine`/`noBlameLineCritical`), and the sandbox safe-slot varies by beat so it can't be gamed by
  position.
- **Host ink is warm and voiceable** in both shells, under the cap, UK English, no printed variables.

## Findings

### MIN-1 - the shared "habit to keep" line is partly off-topic for a malware episode. Minor, needs-user (product, shared string). Carried.

"...move money, grant access, sign in or read back a code..." maps onto the app-consent item via "grant
access", but the rest is not this episode's lesson (files running with your access, updates, ransomware).
Held byte-identical course-wide; cannot be fixed episode-local. Product-level call. No shipped E19 file is
wrong. Unchanged from C3 MIN-1. (Mirrors the shared-string note in E18 and E20.)

### MIN-2 - the critical-penalty arithmetic line is hard to follow. Minor, engine (not episode-local). Carried.

The engine default "...That costs 15 points off the round each, on top of the item itself"
(`inbox-triage-minigame.js:1486-1488`) is shared wherever a critical miss fires. Note: the penalty pass set
`criticalPenalty` 5 with cap 10 on E19, so the per-miss figure the learner now sees is 5 (and capped), not 15
- the specific "15" in the C3 note no longer applies, but the "each ... on top of the item itself" phrasing is
unchanged and is the remaining readability question. Shared-engine wording for the ENG owner, low impact (the
round still teaches, feedback stays no-blame). Leave, or soften course-wide in an engine pass.

## Voiced host lines I would change

None. Both shells read as spoken, warm, within the cap, UK English, no printed variables. I would ship the
host ink unchanged.

## Verdict per stage

- **Brief** - ship. Scope/content note covers the montage.
- **Mistake (sandbox, full only)** - ship. One `safe:true` per beat, `approvedRoute` on it, safe-slot varies,
  no demonstrated exploit; the "not scored, but the debrief comes back" intro is accurate (the recap exists).
- **Flip (montage, full only)** - ship. Both options authored per beat, consistent counterfactual framing,
  facts aligned to core_07.
- **Defend (both shells)** - ship. Fair six-item set, mirror pair + calibration + ransom incident, immediate
  feedback, per-item lines wired and de-phished, the new critical penalty reads low-but-not-zero on a rushed
  round.
- **Debrief (both shells)** - ship. Four concept cards in spec order, de-jargoned result copy, sandbox recap,
  no-blame line, conclusion globals all fire. Shared habit line partly off-topic (MIN-1).

**Overall: ship-ready, no fix required.** The fresh pass confirms C3 and finds no new blocker or major. The
critical-penalty pass is a clean scoring-only change with no copy or "phish" regression. The two carried items
are a product-level shared-string note (MIN-1) and an engine-wording note (MIN-2). One timed full-episode run
is still worth doing to confirm the 15-minute budget, which no automated check measures. On the course-wide
top-band wording question raised in E18 C4 (MIN-2 there): E19's top band is "Sharp:" (`:106`); if the course
standardises on "Well done:" it should change here too.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 2 minor (1 engine, 1 needs-user; both carried).
- Prior closure: all C3 items re-confirmed on the current files; the post-C3 critical-penalty pass
  (criticalPenalty 5 / cap 10) verified with no copy or "phish" regression; E19's de-phish is complete
  (verdictFeedback, kindLine, teamLine, allPhishRight all set, unlike E18).
- Blocker: none.
- Major: none.
- Verdict: ship-ready as-is; MIN-1 (shared habit line) and MIN-2 (critical-penalty arithmetic wording) are
  carried product-level/engine notes, a timed run confirms the budget, and the top band ("Sharp:") follows
  whatever the course decides on the E18 C4 band question.
