# E10 "Downloads and fake checks": design review C3 + dialogue review C2

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness
product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical
staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no
runtime language model. E10 is a build-and-defend episode: the learner builds one fake "verify you are
human" check on a supplier's own (compromised) site and sends a lure email (attack half, unscored),
meets it in a flip, then triages a morning of browser screens (defend half, scored). Company Quayholt
Insurance; host Niamh Doherty (E5's host); the three web habits are now carried by Niamh and the
concept panel (Leila Nassar was dropped from the host lines, P1 F-E10-11). Modules core_08 (safe web
and downloads, source of truth) and core_07 ("report and leave it" crossover). Method and bar:
`REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review` skills adapted to the
awareness kind, and the prior E10 reviews and blind/playtest reports in this folder.

This is the C3 confirmation round launched with engine batch 12 (BUILD_LOG 2026-10-30). The brief asks:
confirm C2 and the blind/playtest findings are fixed, and look hard at what engine batches 9 to 11
changed on screen (result counts and their new labels, the debrief recap of earlier stages, the
"Episode finished" panel, the everyday-choices intro, the confirm prompt).

Content rule applied: the fake check's steps and the clipboard reveal must be plain-English
descriptions only; anything pasteable or runnable is a blocker. **The rule holds: no blocker.** Row 1's
body ("1. Press Windows + R. 2. Press Ctrl + V. 3. Press Enter.") is a key-press description, not a
command; the builder `clipboardReveal` and the defend row-1 reveal are the one line "A hidden command
that would run a program on your computer"; no working command is shown, stored or written in any
fragment, shell or spec; the `payloadKit` is empty (no link in the lure).

Scope read end to end: both shells (`scenarios/awareness_e10_downloads_and_fake_checks{,_defend}/`
`scenario.json.erb`, `mission.json`, `ink/niamh_doherty.ink`); the fragments
`planning_notes/phishing_and_social_engineering/awareness/e10/{attack,defend}.json`; the spec
`.../episodes/E10_downloads_and_fake_checks.md`; and the result-grid engine the batch-11 count keys
depend on (`inbox-triage-minigame.js` `_queueInfo`/result-number block :1426-1458, `triage-scoring.js`
`caughtHow` :702). Source of truth for facts: `modules/core_08_.../concepts.md` (C1/C2 confirmed
faithful; the C2/C3 fixes touched no fact).

How the screens were judged: from the authored data traced through the engine, **not from a render**
this pass (no fresh bridge run; the C2 pass ran the full-episode bridge 16/16 on :3001). The one new
finding below (D1, the result grid) is read off `inbox-triage-minigame.js` and `caughtHow`, not a
pixel render.

Ran (all E10-only, all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, **no
  social errors or warnings** on either (only the generic m01-style lock suggestions).
- `dialoguelint.mjs` both shells: full `lines=9 median=14 p90=21 max=21`; defend `lines=3 median=23
  p90=29 max=29`. No rule hits; every host line under 30 words.
- `node --test social-awareness-fragment-erb-parity`: **E10 passes** (`ok 11`). Fragment and full shell
  carry identical learner-facing copy.
- `node --test social-awareness-rule-of-thumb`: pass (all 73 awareness shells byte-identical).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 1 | 1 | 1 | 0 |
| Nit | 1 | 0 | 1 | 0 |
| **Total** | **2** | **1** | **2** | **0** |

(D1 is tagged both episode-local and engine: the episode-local half is a two-key authoring add; the
clean version needs one small engine touch, below.)

Episode shape unchanged: full = 7 stages (`brief, osint, build, write, flip, defend, debrief`);
defend-only = 3 (`brief, defend, debrief`). Defend set `e10_browser_morning`, 7 items (5 phish, 2
genuine), two mirror pairs (rows 1/2, rows 3/4).

## C2 and blind/playtest closure

| Finding | Source | Verified | Status |
|---|---|---|---|
| **C2 D1** row 1 `reportReply` says the site "was hacked" then "is fine" in the same breath | C2 | `defend.json:119` now: "...warned Fernside their site had been broken into, and reported it. Fernside is a genuine supplier; attackers got into their site, it is not a fake." No "is fine" collision. | **Closed** |
| **C2 D2** spec §11 JSON + §10/§240 examples trail the shipped C1 fixes | C2 | Spec `E10_...md:261-273/365-377/417-433` now carries `critical`/`missLabel`/`kindLine` on rows 1/5/7, `kindLine` on row 3, the fuller perFlagNote and the new reportReply. Spec no longer trails the files. | **Closed** |
| **P1 F-E10-11** Niamh promises "Leila from the service desk" and "three habits"; neither appears | playtest | `ink/niamh_doherty.ink`: Leila gone; welcome ends "...sends you out with three habits to keep"; completion names the three (Quayholt Apps, read the address, never let a page drive your computer). Internally consistent now. | **Closed** |
| **P1 F-E10-10** "the tricks" card lists four, deck has five tell types (download missing) | playtest | Concept card "The tricks a page tries" (`defend.json:307`) now names all five, download included. | **Closed** |
| **P1 F-E10-8 / B1 E10-2** email vocabulary + duplicate headline on web pages | playtest/blind | `labels.itemNoun: "page"`, `next: "Next page"`, `phishCaughtLabel: "Fake pages caught"`, `teamBadge: "Fake pages stopped for the team"`; batch-9 shows the headline once. Web-worded now. | **Closed** |
| **P1 F-E10-2 (half)** "Go the trusted way" card text circular | playtest | `labels.verdict.delete.hint` (`:69`) now concrete: "Skip this page and reach what I came for the trusted way: Quayholt Apps, a bookmark, or an address I typed myself." | **Closed (wording); see Observations for the "never full marks" half** |

The two queued engine items C2 named (the flip heading override, the CAPTCHA tick control) are not
re-raised per the brief; the CAPTCHA tick field is now authored as `{"label":"I am not a robot","type":
"tick"}` (`defend.json:134`), which is the shape the queued ENG item would render.

## What works

- **The no-link twist is consistent end to end, and C2's one dialogue fix landed.** The seeded brief
  ("There is no link to send: they open it from their own bookmark", erb `:672`), the success screen
  (`:54`), the kiosk observation and all three kiosk states (`:1049-1053`) agree; row 1's `reportReply`
  no longer collides "hacked" with "fine".
- **The scenario-local tells are wired the careful way.** All five web tells sit in `channelTells` with
  a `flagChips` label, a set-level `skillNames` name and a `factorStrings.<id>.redFlag` sentence, and
  none is appended to the shared library; the validator accepts them and the result breakdown can name
  them. `lookalike_domain`/`padlock_myth` are reused from E5 for the download and alarm rows so the
  learner can still reach for them.
- **The mirror pairs hold and the register is no-blame throughout.** Rows 1/2 (paste-step vs tick) and
  3/4 (web page vs browser chrome) are intact; `kindLine`, `ifTrusted`, `perFlagNote`, `noBlameLine`
  and the Monday card stay in a calm colleague's voice.
- **Both shells validate with no social warnings, dialoguelint is green, and parity passes.**

## Findings

### D1 — the defend set was not given the batch-11 self-describing result counts the other sets got. Minor; episode-local (two authored keys) plus one small engine touch.

Engine batches 10/11 added `resultCopy.caughtBreakdown` and `resultCopy.handledRightLabel` so the
result grid "says what it counts", and they were wired into E11, E12, E13, E15 and E16 (BUILD_LOG
2026-10-29/30). **E10 was not in that wiring list and still carries neither key** (`defend.json:34-39`;
full erb `:132-137`; defend-only `:108`). E10's deck is the same 5-phish / 2-genuine shape with a
third verdict ("Go the trusted way" = `delete`, a half-credit catch), so it shows the identical grid
the playtest and the sibling blind flagged:

> Fake pages caught: 5 of 5
> Reported rather than just deleted: 4 of 5
> Real pages handled right: 2 of 2   *(the `page` default real noun, `inbox-triage-minigame.js:453`)*

The gap between line 1 and line 2 (a page sent the trusted way is caught but not reported) is
unexplained, and "Real pages handled right: 2 of 2" reads against "Fake pages caught: 5 of 5" with
seven pages on screen. This is exactly P1 **F-E10-8** (E10's own playtest: "Phish caught: 4 of 5" /
"Reported rather than just deleted: 3 of 5") and the same class as **E11 B2 #4** and **E16 B1**, which
is why `caughtBreakdown`/`handledRightLabel` were written (see the code comment at
`inbox-triage-minigame.js:1433-1440`, which cites "E11 F6, E16 B1" and "E16 F-E16-12, E11 B2 #4").

Fix, episode-local, in `resultCopy` of the set in both shells (mirror E11):
- add `"handledRightLabel": "Genuine pages you carried on with, rightly"` — uncontroversial, closes the
  "handled right vs caught" read.
- add `"caughtBreakdown": true` — but note the engine half below.

**Engine half (minor, engine).** `caughtHow` (`triage-scoring.js:702-726`) labels a `delete`-verdict
catch on a `page` as `"{n} deleted"`; E10 relabels `delete` to "Go the trusted way"
(`verdictLabels`), so turning `caughtBreakdown` on as-is would print "(4 reported, 1 deleted)" against a
button that never said "delete". Either the breakdown verb should honour `verdictLabels.delete` (make
`caughtHow` take the set's relabelled past-tense, e.g. `labels.verdict.delete.past` = "Went the trusted
way"), or E10 holds `caughtBreakdown` off and ships only `handledRightLabel`. This engine mismatch is
the likely reason E10 was left out of the batch-11 wiring; it is a candidate for the batch-12 queue.
Recommendation: ship `handledRightLabel` now (episode-local, clean), and queue `caughtBreakdown` behind
the `caughtHow`-respects-relabel engine touch.

A third parity item: E10 does not set `set.confirmPrompt` (`defend.json` has none; E11/E12/E13/E15/E16
do). On E10 a learner can Confirm a page with nothing ticked and no "are you sure you noticed nothing?"
prompt (P1 persona did exactly this). This is opt-in and a product choice, but if the five other sets
carry it, E10 reads inconsistent; adding `"confirmPrompt": true` to the set would match them.

### D2 — the success screen ends "The debrief goes through each one", which renders before the debrief. Nit, engine, cross-episode.

Full erb `:54`: "...worked through a morning of web pages. That's this episode finished. The debrief
goes through each one." The same trailing sentence was flagged on E11 (B2 nit #11) as reading slightly
out of order relative to the batch-10 "Episode finished" panel / Finish sequence. It is a shared engine
sequencing nit, not E10-specific; noted here only so the C3 set is complete. No E10 file change.

## Dialogue pass (voiced host lines)

Every host line read as spoken, both shells. Niamh's full-shell lines (welcome "...the kiosk takes you
through a morning of them, and sends you out with three habits to keep."; the attack-to-defend hand-off
"Good, the page is built and the email's away to Leo." / "Now take the other seat..."; the completion
triple naming the three habits; "Any time.") and the defend-only welcome ("The kiosk has a morning of
web pages, the kind that turn up while you work. For each, decide: carry on, close and report, or go the
trusted way.") are calm, colleague-voiced, under 30 words, no printed variables, UK English, no em/en
dashes. I would change none of them.

Two observations I looked at and did not raise:
- Niamh names "three habits" while the debrief concept panel carries five cards (the three habits, plus
  "If you slipped" and "The one rule"). The completion line names exactly the three, and the two extra
  cards are support, so it is not the F-E10-11 mismatch again; the "three" is accurate. Left.
- The flip's `fake_check_paste` chip and the `flipDefenderLine` both name the paste-and-run tell. This
  is the standard E5-flip shape (a one-line tell chip plus the closing narrative line); I could not
  confirm on a render that both read as padding when stacked. Low confidence, left unraised (as C2).

## Observations (not findings)

- **"Go the trusted way" (`delete`) is never the full-mark answer anywhere in the deck.** Every fake
  page's top answer is "Close and report" and every genuine page's is "Carry on", so the middle verdict
  is structurally a half-credit consolation (30). This is deliberate per spec §11 (row 6 names it
  "safe-but-partial"), and the button hint now says concretely what it means, so P1 F-E10-2's
  circular-text half is closed. The design decision (keep a third verdict that is never the best call)
  is the user's to confirm; it reads fine for an awareness set where reporting is the lesson.
- **Attack-half "What Leo is expecting" card (P1 F-E10-1).** The fakeCheck builder scores persuasion
  factors (`attack.json` `check.points`), not an E5-style `pretext.facts` card, so the empty-card
  symptom F-E10-1 reported may not arise in fakeCheck mode. I could not confirm either way from code
  without a render; the attack half is unscored. Flagged for the next persona playtest, not as a design
  finding.

## Verdict per stage

- **brief / osint / build / write / flip** — ship. No change since C2; the no-link design is consistent
  and the content rule holds.
- **defend** — ship after D1's episode-local half (`handledRightLabel`, and `confirmPrompt` for
  parity). The teaching lands; the gap is result-grid clarity the other five sets already closed.
- **debrief** — ship. Five concept cards, the module line, the Monday card, the byte-identical rule of
  thumb and the no-blame line all correct and in register.

**Overall: ship-ready. One minor (D1): wire E10's result grid up to the batch-11 self-describing
counts like its siblings — `handledRightLabel` (and `confirmPrompt`) now, `caughtBreakdown` once
`caughtHow` honours the `delete` relabel (batch-12 queue). Everything C2 and the playtest/blind flagged
is genuinely closed in the files.**

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 1 minor, 1 nit (2 total; 1 episode-local, 2 engine, 0 needs-user). Content
  rule met: no pasteable/runnable command anywhere; empty `payloadKit`, no link.
- C2/blind/playtest closure: C2 D1 closed (reportReply reworded), C2 D2 closed (spec synced), F-E10-11
  closed (Leila dropped, "three habits" consistent), F-E10-10 closed (five tricks listed), F-E10-8
  closed (page vocabulary + single headline), F-E10-2 wording closed (delete hint concrete).
- Blockers: none.
- Majors: none.
- Minor D1 (episode-local + engine): E10 alone lacks the batch-11 `caughtBreakdown`/`handledRightLabel`
  (and `confirmPrompt`), so the "Fake pages caught N of 5" vs "Reported M of 5" vs "Real pages handled
  right 2 of 2" split still reads as an unexplained puzzle (P1 F-E10-8 / E11 B2 #4 class); add
  `handledRightLabel`+`confirmPrompt` now, queue `caughtBreakdown` behind a `caughtHow` relabel fix.
- Verdict: ship-ready; apply D1's episode-local half (two keys) and queue the small `caughtHow` engine
  touch for batch 12.
