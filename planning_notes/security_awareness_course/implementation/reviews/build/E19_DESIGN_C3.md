# E19 "Malware, ransomware and updates": design + dialogue confirmation review C3

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. E19 is a
**consequence-flip** episode (ENG-04): no attack half and no phish target - the four-beat mistake sandbox is
the one "attack artefact", and the montage flip shows where each choice led. Full = 5 stages
(`brief, mistake, flip, defend, debrief`); defend-only = 3 (`brief, defend, debrief`). Company Quayholt
Insurance; host Anjali Rao (information security analyst); module core_07 (malware, ransomware and updates).

Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` / `npc-dialog-review` skills adapted to the
awareness kind, and the prior E19 reviews (`E19_DESIGN_C1.md`, `E19_DESIGN_C2_DIALOG_C1.md`), both blind runs
(`E19_BLIND_B1.md`, `E19_BLIND_B2.md`) and the shared playtest (`E19_E20_PLAYTEST_P1.md`), plus the
`BUILD_LOG.md` E19 lines and the engine batch 9-11 history.

Scope read end to end: both shells `scenarios/awareness_e19_malware_and_updates{,_defend}/
{scenario.json.erb, ink/anjali_rao.ink}`; the spec `.../episodes/E19_malware_and_updates.md`; and the engine
the findings depend on (`inbox-triage/inbox-triage-minigame.js`, `inbox-triage/triage-scoring.js`,
`episode-runner/{episode-runner-minigame.js,episode-model.js,consequence-sandbox.js,debrief-view.js}`).

How the screens were judged: **from the file read and the engine code**, cross-checked against the two blind
runs (both drove the full episode, the montage flip, a mid-inbox reload and the defend-only variant to
completion). The two blind runs predate the latest edit (both shell erbs edited 2026-10-30 00:05; B1/B2 ran
2026-10-29 evening), so several B1/B2 result-copy findings were fixed *after* those runs; I confirmed each
against the current file. I name the engine path where a finding rests on a screen. Ran green this pass:
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: clean, only the generic
  `timedConversation` recommended-field note.
- `dialoguelint.mjs` on both: full `lines=6 median=21 p90=29 max=29`; defend `lines=3 median=28 p90=29
  max=29`. No rule hits, no printed variables, every host line under the 30-word cap.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 2 | 0 | 1 | 1 |
| **Total** | **2** | **0** | **1** | **1** |

## C1/C2 and blind/playtest closure

Checked each earlier finding against the live files (both shell erbs edited 2026-10-30 00:05).

| Prior finding | Ruling / claimed fix | Verified | Status |
|---|---|---|---|
| C2 D1 Verify feedback reads oddly on the ransom note ("Checking first is a sound habit" vs "report fast") | per-item override of the Verify preamble | Engine now honours a per-item `truth.verifyLine`/`reportLine` that wins over the set `verdictFeedback` (`inbox-triage-minigame.js:975-976`). The ransom note carries `verifyLine` "Calling it in straight away is exactly right." and `reportLine` "Right call: reported. Telling security fast is what limits the damage..." (`:228-229`). The pull between the two halves is gone. | **Closed (engine + content)** |
| C2 D2 content-note clause under-describes the flip ("a colleague's screen" vs the learner's own machine locked in the montage) | generalise the clause | Full `strings.brief` (`:453`) now reads "This episode shows a ransomware message and plays out where an afternoon's choices lead, your own machine among them; there are no alarms or flashing screens." Covers the montage. | **Closed** |
| C2 G1 defend-only completion line is three clipped imperatives | next generator run: "call me straight away, and don't pay or touch it" | Defend ink `:22` now reads "...If a screen locks, call me straight away, and don't pay or touch it." 29 words. | **Closed** |
| B1 m-1 / B2 #4 "Report" button and "Phish stopped for the team" counter treat Leo's genuine colleague as a phish | de-phish the labels | Set now carries `labels.verdict.report.hint` "This needs reporting. Send it to security." (`:92-95`), `labels.teamBadge` "Problems reported for the team: {n}" and `labels.teamBadgeTitle` (`:97-98`), overriding the "Phish stopped for the team" default (`inbox-triage-minigame.js:575`). | **Closed** |
| B1 m-2 / B2 #1,#3 result screen reads "Sharp: you caught the phish", "Phish caught N of N" | add de-phished `bands`/`phishCaughtLabel` | `bands` (`:102-115`) now "Sharp: you caught the problems and knew why" etc.; `labels.phishCaughtLabel` "Problems caught"; `resultCopy.reportedPct` "Reported {pct}% of the problems". | **Closed** |
| B2 #2 "N answers let an attacker straight in (trusting a phish email, or a colleague's locked screen...)" | de-phished critical lead + labelled ransom miss | `resultCopy.criticalLead` "let a problem through", `criticalWhat` "agreeing to something that put the device at risk", and the ransom note's `truth.missLabel` "a colleague's locked screen going unreported" feed the line (`inbox-triage-minigame.js:1490-1491`, `triage-scoring.js:348`). Now reads "let a problem through (agreeing to something that put the device at risk, or a colleague's locked screen going unreported)". | **Closed** |
| C1 ransom-item engine copy `kindLine`/`missLabel` | add so Trust/critical feedback reads the true thing | Present on `e19_ransom_note` in both shells; wired in `inbox-triage-minigame.js:977`, `debrief-view.js:121/127`, `triage-scoring.js:348`. | **Closed** |
| C1 MI1-MI4 (content note, Fernside look-alike, stale notes, "infostealer") | C2 verified all four | Re-spot-checked: `grep -c infostealer` = 0 in the shells; montage uses "a hidden program ... built to copy your saved passwords". | **Closed** |
| B2 F4 defend-only doubled-suffix global `..._defend_defend_done` | - | Still present (`defend/scenario.json.erb:56`); accepted generator convention, internal only. Not re-raised. | **Carried (accepted)** |

## What works (confirmed this pass)

- **The batch 9-11 surfaces the task flags all read well in E19.** The **sandbox recap** in the debrief
  reuses the montage "where it led" lines as the reason and the beat's own option labels as chosen/safer
  (`episode-model.js:236-253`, `debrief-view.js:508-510`), so a missed restart reads "You chose 'Remind me
  tomorrow'. The safer move was 'Save your work and restart now...'." then the montage consequence - content
  only, no new copy. The **everyday-choices intro** is the batch-updated engine default ("They are not
  scored, but the debrief comes back to any worth a second look", `consequence-sandbox.js:27`,
  `episode-runner-minigame.js:93`), which is now true because the recap exists; E19 relies on it, correctly.
  The **Episode-finished panel** uses the clear "Episode finished" default (`episode-runner-minigame.js:711`).
- **One repeatable lesson, carried everywhere:** "a program, a file or an app you didn't start runs with your
  access, so if you didn't expect it, don't open the door, report it", in the set brief, the "It runs with
  your access" card, the host ink, the montage and the defendIntro.
- **Facts match core_07 exactly** (extension 4444; unplug the cable and leave it on; don't pay/contact/fix;
  restart within a day / self-restart at 19:00; macro = the small program inside the file; backup separate
  from the computer; a web page offering an update is never genuine; Quayholt Protect / Quayholt Files).
- **The mirror pair and calibration are fair and de-jargoned.** Row 1 (unknown-app consent, phish) is
  followed by row 2 (the genuine Quayholt Files consent that looks the same), and row 6 is the genuine device
  update with a `falseAlarmCost`; the ransom note (row 3) is a genuine colleague's incident scored as a
  "problem to catch", with its own `verifyLine`/`reportLine`/`missLabel` so no surface calls Leo a phish.
- **Safe-option slot varies by beat** (restart safe@1, enable safe@0, security safe@1, save safe@0), so the
  sandbox can't be gamed by position, and the **no-blame register is clean** (the `noBlameLine` and
  `noBlameLineCritical` neutralise the firm montage framing).
- **Host ink is warm and voiceable** in both shells, under 30 words, no printed variables; the full welcome
  ("I would rather you called me about nothing than not called about something") sets the reporting culture
  in one line.

## Findings

### MIN-1 - the shared "habit to keep" line is partly off-topic for a malware episode. Minor, needs-user (product-level, shared string). Carried.

The debrief's **The habit to keep** card is the shared rule-of-thumb, held byte-identical across the course
and enforced by the rule-of-thumb test: "When a message pressures you to move money, grant access, sign in or
read back a code...". For E19 the "grant access" clause maps onto the app-consent item, but "move money",
"sign in" and "read back a code" are not this episode's lesson (files running with your access, updates,
ransomware). Flagged for E19 already in `E19_BLIND_B1.md` m-4 and mirrored in E18 and E20. It cannot be fixed
episode-local without breaking the shared string; it is a product-level call for the user (whether the shared
habit should vary by module or carry a per-episode lead-in). No shipped E19 file is wrong. Not a ship blocker.

### MIN-2 - the critical-penalty arithmetic line is hard to follow. Minor, engine (not episode-local). Carried from B2.

`E19_BLIND_B2.md` worst-line #2 found "...That costs 15 points off the round each, on top of the item itself"
hard to parse beside the item scores. This is the engine default penalty line
(`inbox-triage-minigame.js:1486-1488`), the same string everywhere a critical miss fires; E19 sets no
`scoring.criticalPenaltyCap`, so it reads the per-miss form. The lead and the "what" are now de-jargoned in
E19 (MIN-closure above), which was the larger half of B2 #2; the remaining arithmetic phrasing is a
shared-engine wording question for the ENG owner, not an E19 defect. Low impact (full no-blame feedback, the
points are explained, the round still teaches). Leave, or an engine pass could soften the "each ... on top
of the item itself" phrasing course-wide.

## Voiced host lines I would change

None. Every host line in both shells (the full welcome and goodbye, the after/completion lines, the
defend-only opener and completion line, the "Thanks, Anjali." / "Any time." exchange) is calm-colleague
register, warm, within the cap, UK English, no printed variables. The C2 G1 polish is already applied. I
would ship the host ink unchanged.

## Verdict per stage

- **Brief** - ship. Scope note correct; the content-note clause now covers the montage (C2 D2 closed).
- **Mistake (sandbox, full only)** - ship. Exactly one `safe:true` per beat, `approvedRoute` on it, safe-slot
  varies, situations plausible, no demonstrated exploit; the batch-updated "not scored, but the debrief comes
  back" intro is now accurate.
- **Flip (montage, full only)** - ship. Both options authored per beat, consistent counterfactual framing,
  "infostealer" removed, facts aligned to core_07.
- **Defend (both shells)** - ship. Fair six-item set, mirror pair + calibration + the ransom-note incident,
  immediate feedback, per-item `verifyLine`/`reportLine`/`kindLine`/`missLabel` wired and de-phished, Verify
  scores full.
- **Debrief (both shells)** - ship. Four concept cards in spec order, the de-jargoned result copy, the
  sandbox recap, the no-blame line, conclusion globals and screens all fire. Shared habit line partly
  off-topic (MIN-1).

**Overall: ship-ready, no fix required.** All C1/C2 items are closed, and the result-copy and ransom-feedback
findings from the two blind runs were fixed in the latest edit (both confirmed against the current file and
the engine). The fresh pass adds no blocker and no major - one carried product-level shared-string note
(MIN-1) and one carried engine-wording note (MIN-2), both deferrable. Both shells validate clean under
`--strict-social --no-graph --skip-ink` and pass dialoguelint. As C1/C2 said, one timed full-episode playtest
is still worth running to confirm the 15-minute budget, which no automated check measures.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 2 minor (1 engine, 1 needs-user; both carried).
- Prior closure: C2 D1 (ransom Verify feedback) and D2 (content-note clause) closed; C2 G1 host polish
  applied; all B1/B2 result-copy and "Leo-is-a-phish" findings fixed in the 00:05 edit (de-phished bands,
  labels, teamBadge, criticalLead/criticalWhat, ransom missLabel); batch 9-11 sandbox recap, everyday-choices
  intro and Episode-finished panel all read correctly.
- Blocker: none.
- Major: none.
- Verdict: ship-ready as-is; MIN-1 (shared habit line off-topic) and MIN-2 (critical-penalty arithmetic
  wording) are carried product-level/engine notes, and a timed playtest confirms the 15-minute budget.
