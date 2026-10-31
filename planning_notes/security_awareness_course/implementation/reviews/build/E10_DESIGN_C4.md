# E10 "Downloads and fake checks": design review C4 + dialogue review C3

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness
product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical
staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no
runtime language model. E10 is a build-and-defend episode: the learner builds one fake "verify you are
human" check on a supplier's own (compromised) site and sends a lure email (attack half, unscored),
meets it in a flip, then triages a morning of browser screens (defend half, scored). Company Quayholt
Insurance; host Niamh Doherty (E5's host). Modules core_08 (safe web and downloads, source of truth)
and core_07 ("report and leave it" crossover).

This is the C4 confirmation round after the cross-episode critical-penalty pass and engine batch 12
(BUILD_LOG 2026-10-30). The brief asks: confirm every open C3 finding is fixed, and judge the batch-12
screen changes fresh — the hidden "Verdict locked" banner in immediate mode, the confirm-prompt copy,
E10's result breakdown now able to say "went the trusted way", the weakest-skill line after "nothing to
grade", and the critical penalties.

Content rule applied (unchanged from C3): the fake check's steps and the clipboard reveal are
plain-English descriptions only; anything pasteable or runnable would be a blocker. **The rule holds:
no blocker.** Row 1's body ("1. Press Windows + R. 2. Press Ctrl + V. 3. Press Enter.") is a key-press
description, the `clipboardReveal` is the one line "A hidden command that would run a program on your
computer", no working command is shown or stored anywhere, and the `payloadKit` is empty (no link in
the lure).

Scope read end to end: both shells (`scenarios/awareness_e10_downloads_and_fake_checks{,_defend}/`
`scenario.json.erb`, `ink/niamh_doherty.ink`); the fragment
`planning_notes/phishing_and_social_engineering/awareness/e10/defend.json`; and the batch-12 engine the
on-screen behaviours depend on (`inbox-triage-minigame.js` result block :1472-1491, the immediate-mode
banner hide :210-215, the confirm-prompt copy :903-909, the weakest-skill guard :1550-1597;
`triage-scoring.js` `caughtHow` :707-746; `triage-kinds.js` `verdictVerbOverride` :164-173).

How the screens were judged: from the authored data traced through the engine, **not from a render**
this pass (the C2 pass ran the full-episode bridge 16/16 on :3001; BUILD_LOG records batch-12 live
proof on :3002 with the sibling sets).

Ran (all E10-only, all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, **no
  social errors or warnings** on either (only the generic m01-style lock suggestions).
- `dialoguelint.mjs` both shells: full `lines=9 median=14 p90=21 max=21`; defend-only `lines=3
  median=23 p90=29 max=29`. No rule hits; every host line under 30 words.
- `node --test social-awareness-fragment-erb-parity`: **E10 passes** (`ok 11`).
- `node --test social-awareness-rule-of-thumb`: pass (all awareness shells byte-identical).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 1 | 1 | 0 | 0 |
| Nit | 0 | 0 | 0 | 0 |
| **Total** | **1** | **1** | **0** | **0** |

Episode shape unchanged: full = 7 stages (`brief, osint, build, write, flip, defend, debrief`);
defend-only = 3 (`brief, defend, debrief`). Defend set `e10_browser_morning`, 7 items (5 phish, 2
genuine), two mirror pairs (rows 1/2, rows 3/4), three critical items (rows 1/5/7).

## C3 and batch-12 closure

| C3 item | Verified | Status |
|---|---|---|
| **C3 D1 (half 1)** add `handledRightLabel` | `defend.json:110` and both shells (`full :111`, `_defend :82`): "Genuine pages you carried on with, rightly". | **Closed** |
| **C3 D1 (parity)** add `confirmPrompt` | `defend.json`, both shells (`full :120`, `_defend :94`): `confirmPrompt: true`. | **Closed** |
| **C3 D1 (half 2)** `caughtBreakdown` behind a `caughtHow` relabel | Engine half landed (batch-12 item 16: `caughtHow` takes `verbOf`, `verdictVerbOverride` reads `labels.verdict.delete.past` → "went the trusted way"; `triage-scoring.js:702-705` names "E10 C3 D1"). **But E10 still does not set `caughtBreakdown: true`** — it was left out of the batch-12 content pass (BUILD_LOG covered E9/E12/E13/E16). See M1. | **Open (one key)** |
| **C3 D2** success-screen trailing "The debrief goes through each one" (nit, engine) | Deferred by design: batch-12 note (12) keeps the post-"Episode finished" success screen as the required mission conclusion, de-duplicated by wording. Not E10-specific; not re-raised. | **Resolved (ruling)** |

Batch-12 on-screen behaviours, judged for E10:

- **Hidden "Verdict locked" banner in immediate mode.** E10 is `feedbackMode: "immediate"`, so
  `inbox-triage-minigame.js:215` adds `tri-live-sr` and the accent banner is hidden from sight (kept
  for screen readers). The review card is the visible confirmation. Correct for E10.
- **Confirm-prompt copy.** `confirmPrompt: true`; the no-tick line reads "Nothing ticked. Tick what you
  noticed, or press Confirm again to lock your answer as it is." (`:909`) — states plainly that ticking
  is optional and that a second Confirm locks, so it no longer reads as a required second step. The P1
  persona's "Confirm with nothing ticked, no prompt" gap (C3's third parity note) is now closed.
- **Weakest-skill line after "nothing to grade".** The per-factor breakdown and the "Weakest skill"
  pointer sit inside the `namedAnyFlags` guard (`:1566-1597`); a learner who ticked nothing sees only
  E10's `noFlagsLead` ("You didn't tick anything you noticed, so there's nothing to grade skill by
  skill.") with no weakest line after it. Correct (batch-12 item 3).
- **Critical penalties.** `scoring: { criticalPenalty: 5, criticalPenaltyCap: 10 }` is set in both
  shells. E10 has three critical items (rows 1/5/7), so a rushed run that trusts all three loses 10, not
  15 — the cap stops critical penalties zeroing the round (the E8/E15/E16 blind symptom). Fair.

## What works

- **Everything C2/C3 and the playtest/blind flagged is genuinely closed in the files**, and the batch-12
  additions (hidden banner, confirm copy, critical cap) land correctly for E10 by inheritance.
- **The no-link twist is still consistent end to end** (brief, success screen, kiosk states, row 1
  `reportReply`), and the content rule holds: no pasteable or runnable command anywhere, empty
  `payloadKit`.
- **The scenario-local tells remain wired the careful way**: five web tells in `channelTells` with a
  `flagChips` label, a set-level `skillNames` name and a `factorStrings.<id>.redFlag` sentence, none
  appended to the shared library; `lookalike_domain`/`padlock_myth` reused from E5.
- **Mirror pairs hold and the register is no-blame throughout** (rows 1/2 paste-vs-tick, 3/4
  page-vs-browser-chrome; `kindLine`, `ifTrusted`, `perFlagNote`, `noBlameLine`, Monday card).
- **Both shells validate with no social warnings; dialoguelint is green; parity and rule of thumb pass.**

## Finding

### M1 — E10 is the one defend set with a relabelled half-credit verdict yet still does not opt in to `caughtBreakdown`, so the result grid never names the "went the trusted way" catches that batch-12 built the relabel for. Minor; episode-local (one key).

C3 D1 recommended shipping `handledRightLabel`/`confirmPrompt` at once (done) and queuing
`caughtBreakdown` behind a `caughtHow` relabel so the breakdown would not print "deleted" against a
button that never said "Delete". That engine touch is **batch-12 item 16**: `caughtHow` now takes a
`verbOf(verdict, kind)` relabel and the result grid calls it with `verdictVerbOverride(this.labels)`
(`inbox-triage-minigame.js:1474-1478`); `verdictVerbOverride` returns `labels.verdict.delete.past`
lower-cased when it differs from the default, i.e. "went the trusted way" for E10
(`triage-kinds.js:164-173`; the engine comment at `triage-scoring.js:702-705` names "E10 C3 D1" and the
expected "2 went the trusted way"). E10 sets `labels.verdict.delete.past: "Went the trusted way"`, so
the relabel is ready.

**But the content pass that turned the key on for the other sets did not turn it on for E10.** E10's
`resultCopy` (`defend.json:38-41`, mirrored in both shells) carries `handledRightLabel` and `noFlags`
but no `caughtBreakdown`. Every sibling set (E11, E12, E13, E15, E16) sets `caughtBreakdown: true`. E10
is the single set with both a renamed `delete` button ("Go the trusted way") and a half-credit
`delete` catch, so it is exactly the set the relabel was written for, and the one still not using it.

On screen the gap is small, not a comprehension blocker: the grid already shows a separate reported
line ("{reportCount} of {phishTotal}", `:1484`), so a learner who sent one page the trusted way sees
"Fake pages caught: 5 of 5" against a reported count of 4 of 5, and the one-page difference is visible
if not named. `caughtBreakdown` would name it inline: "Fake pages caught: 5 of 5 (4 reported, 1 went
the trusted way)". This is the self-describing-count parity C3 D1 asked to close this cycle, with
purpose-built engine support that shipped and then went unused for E10.

Fix, episode-local, one key, in the `e10_browser_morning` set's `resultCopy` in the fragment and both
shells (to match the other sets and keep the shells in step):
- add `"caughtBreakdown": true`.

No engine change is needed — the relabel verified above produces the correct wording. Does not block
ship.

## Dialogue pass (voiced host lines)

Every Niamh line read as spoken, both shells, unchanged since C3 and still right: the full-shell
welcome and hand-off, the completion triple naming the three habits (Quayholt Apps, read the address,
never let a page drive your computer), "Any time.", and the defend-only welcome. All calm,
colleague-voiced, under 30 words, no printed variables, UK English, no em/en dashes. The defend-only
welcome sits at 29 words (dialoguelint p90/max 29), under the cap. I would change none of them.

## Observations (not findings)

- **"Go the trusted way" (`delete`) is still never the full-mark answer anywhere in the deck** — every
  fake page's best answer is "Close and report", every genuine page's is "Carry on", so the middle
  verdict is a half-credit consolation by design (spec §11). The button hint says concretely what it
  means. The design choice (keep a third verdict that is never the best call) is the user's to confirm;
  it reads fine for a set where reporting is the lesson. Unchanged from C3.

## Verdict per stage

- **brief / osint / build / write / flip** — ship. No change since C2; the no-link design is consistent
  and the content rule holds.
- **defend** — ship. The teaching lands; batch-12's hidden banner, confirm copy and critical cap are
  correct by inheritance. M1 is the one remaining polish key (`caughtBreakdown`), low-impact and
  non-blocking.
- **debrief** — ship. Five concept cards, module line, Monday card, byte-identical rule of thumb,
  no-blame line, weakest-skill line correctly suppressed after "nothing to grade".

**Overall: ship-ready. No blockers, majors or nits; one minor (M1): E10 alone never turned on
`caughtBreakdown`, the self-describing count that batch-12 item 16 built for its relabelled "went the
trusted way" verdict — a one-key episode-local add, with the engine verified ready. Every other C3
finding and all five batch-12 on-screen behaviours are closed or correctly inherited.**

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 1 minor, 0 nit (1 total; 1 episode-local, 0 engine, 0 needs-user). Content
  rule met: no pasteable/runnable command anywhere; empty `payloadKit`, no link.
- C3/batch-12 closure: C3 D1 `handledRightLabel`+`confirmPrompt` closed; C3 D2 resolved by ruling;
  hidden "Verdict locked" banner, confirm-prompt copy, weakest-skill suppression and critical-penalty
  cap all correct for E10.
- Blockers: none.
- Majors: none.
- Minor M1 (episode-local): add `"caughtBreakdown": true` to the `e10_browser_morning` `resultCopy`
  (fragment + both shells); the batch-12 item-16 relabel is verified ready, E10 was simply missed in the
  content pass, and it is the only set with a renamed half-credit verdict still not naming its split.
- Verdict: ship-ready; apply M1's one key to finish the C3 D1 thread.
