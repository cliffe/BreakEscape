# E10 "Downloads and fake checks": design review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. Method and standard: `planning_notes/security_awareness_course/implementation/REVIEWER_BRIEF.md`, the `scenario-design-review` skill adapted to the awareness kind, and the E8/E9 build reviews in this folder for format and bar. Source of truth for facts: `modules/core_08_safe_web_and_downloads/concepts.md` (and `core_07` for the "report and leave it" crossover); topic boundaries: `00_COURSE_OVERVIEW.md`. Content rule applied: the fake check's steps and the clipboard reveal must be plain-English descriptions only, with anything pasteable or runnable a blocker.

Scope read end to end: the full shell `scenarios/awareness_e10_downloads_and_fake_checks/{scenario.json.erb, mission.json, ink/niamh_doherty.ink}`; the defend-only shell `scenarios/awareness_e10_downloads_and_fake_checks_defend/{scenario.json.erb, mission.json, ink/niamh_doherty.ink}`; the fragments `planning_notes/phishing_and_social_engineering/awareness/e10/{attack.json, defend.json, BRAND_ADDITIONS.md, full_only.json}`; the spec `.../episodes/E10_downloads_and_fake_checks.md`; the module `modules/core_08_safe_web_and_downloads/concepts.md`; and the engine the findings depend on (`inbox-triage/triage-kinds.js`, `triage-scoring.js`, `inbox-triage-minigame.js`, `episode-runner/flip-view.js`, `debrief-view.js`).

How the screens were judged: from the twelve renders supplied (`.../wire-e10/shots/01_builder.png`..`09_row7_download_exe.png`) **and** the engine code and authored data. The builder, flip and all seven defend screens were read from the renders; the scoring and feedback-line findings are traced through the code.

Ran:
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes. The full shell carries **one SOCIAL warning** (`phish_order_colleague_landed` set but never read — MI1); the defend-only shell has no social errors or warnings. Everything else is the generic m01-style "consider adding a VM launcher / locks / music" suggestions, which do not apply to an awareness episode.
- `node scripts/ink_runtime_check/dialoguelint.mjs` on both shells: full `lines=9 median=14 p90=21 max=21`; defend `lines=3 median=23 p90=29 max=29`. No rule hits; all host lines under 30 words.
- The content rule holds: **no blocker.** Row 1's body ("1. Press Windows + R. 2. Press Ctrl + V. 3. Press Enter.") and the builder's steps are plain-English key-press descriptions, not a command; the `clipboardReveal` on both the attack page and defend row 1 is the one-line description "A hidden command that would run a program on your computer"; no working command is shown, stored or written anywhere in the fragment or shells.
- Did not run the ERB parity or rule-of-thumb JS suites (the E9 review recorded them contaminated by concurrent E14 registry work in the tree); flagged, not an E10 issue.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 4 | 3 | 1 (+1 shared with episode) | 0 |
| Minor | 3 | 1 | 2 | 0 |
| **Total** | **7** | **4** | **3** | **0** |

Episode shape: full = 7 stages (`brief, osint, build, write, flip, defend, debrief`); defend-only = 3 (`brief, defend, debrief`). Defend set `e10_browser_morning`, **7 items**: 5 phish pages (fake check, fake update, fake alarm, extension grab, disguised download) and 2 genuine (CAPTCHA, browser relaunch), in two mirror pairs (rows 1/2, rows 3/4). Both shells carry the byte-identical rule of thumb, the five-card concept panel (ENG-09b array), the Monday card and the no-blame line.

## What works

- **One clear, repeatable lesson.** "No honest web page ever needs you to paste, run, install or call; start from a place you trust, and if in doubt close it and report it" lands in the brief, Niamh's ink, the five concept cards, the per-item feedback and the Monday card. A clerk can repeat it on Monday, and the Monday card gives concrete actions (software from Quayholt Apps, read the address, close-and-report, don't restart or clear).
- **Facts are faithful to core_08/core_07.** ClickFix (Windows+R, Ctrl+V, Enter), "browsers update themselves and finish when you close and reopen them", "genuine error messages never include a phone number", the Chrome permission string "Read and change all your data on all websites", and the `pdf.exe` disguised-program tell all match `concepts.md`. The clipboard reveal and the "report it and leave it; don't restart, don't clear anything" line carry the core_07 crossover without straying into malware mechanics.
- **The two mirror pairs are clean and well placed.** The genuine CAPTCHA (row 2) follows the fake check (row 1), and the genuine relaunch bar (row 4) follows the fake update (row 3), so "anything unusual is a trap" cannot win, and the similar genuine item lands right after the likely miss — the pattern the brief asks for. The renders show the tell is the right one each time: paste-vs-tick (rows 1/2), and web-page-vs-browser-chrome (rows 3/4, the relaunch bar correctly drops the address bar and shows a "YOUR BROWSER" frame).
- **The attack half earns the defence.** The builder scores persuasion, not a look-alike domain: the strongest page sits on Fernside's own address (borrowed trust 35), and the one tell it cannot remove is the paste-and-run step (`defFakeCheckPaste`), which is exactly `fake_check_paste`, the row-1 tell. The inversion of E5's domain lesson is coherent and the builder render reads cleanly.
- **The wiring agent's content changes read naturally.** The operations sender folded into the `quayholt_fernside_portal` OSINT fact ("their order reminders to staff come from operations@quayholt.example") is a plausible line on a procurement page and gives the lure a trusted From address to forge; the `implies: [{ value: "fernside_portal_name" }]` on the two order pretexts reads as the pretext naming the Fernside order; and Leo Brennan's "Operations colleague" role label is consistent across the OSINT, contacts and target. None of it reads as bolted on.
- **No-blame register throughout**, and validators and dialoguelint are clean for E10.

## Findings

### MA1 — the three verdict buttons keep their generic email-world sub-text, so "Go the trusted way" reads "This is junk. Bin it." Major, episode-local.
`verdictLabels` only relabels each button's **heading** (`inbox-triage-minigame.js:149–158` folds it into `labels.verdict.<v>.label`). The sub-hint and the summary-list past-tense tag come from the frozen `VERDICT_ACTIONS` (`triage-kinds.js:75–79`) and are unchanged. On every one of the seven defend screens the cards therefore read (renders 03–09):
- Carry on — "This is real. I'd open it or act on it."
- Close and report — "This is a phish. Send it to security."
- **Go the trusted way — "This is junk. Bin it."**

"Go the trusted way" paired with "This is junk. Bin it." is a plain contradiction: the trusted route (use Pagewrangle from Quayholt Apps, reach the portal from a bookmark) is not binning junk, and on the extension row it is the safe-but-partial move, not a bin. "This is a phish" is also an odd label for a download bar or a full-screen alarm. The same gap shows in the message list, where a "Carry on" verdict is tagged "✓ Trusted" and a "Close and report" is tagged "✓ Reported" (renders 04, 06, 08 — `inbox-triage-minigame.js:251` reads `actionById(...).past`).

This is fixable **episode-locally with no engine work**, because `relabel()` applies `label`, `past` **and** `hint` from `labels.verdict.<v>` (`triage-kinds.js:62–67`); the `verdictLabels` shorthand just happens to only set `label`. Author a full `labels.verdict` block on the set (in `e10/defend.json`, then re-wire the full erb and regenerate the defend-only shell) alongside `verdictLabels`, e.g.:
```jsonc
"labels": { "verdict": {
  "trust":  { "hint": "This page is genuine. Carry on with what I came to do." , "past": "Carried on" },
  "report": { "hint": "This is a trap. Close it and tell security.",            "past": "Reported" },
  "delete": { "hint": "Don't use this page; reach what I need the trusted way.", "past": "Went the trusted way" }
} }
```
(Exact wording to taste; `delete`'s hint and past are the ones that matter.) Cite: `e10/defend.json:31`, `awareness_e10_downloads_and_fake_checks/scenario.json.erb:108`, `..._defend/scenario.json.erb:79`.

### MA2 — the new `truth.kindLine` key is not used, so a carried-on web page is told "This one was a phish." Major, episode-local.
This is the wording the engine fix on main was meant to let an episode avoid, and E10 uses neither new key. When a learner picks "Carry on" (the `trust` miss) on a phish page, the per-item feedback builds `Not this time. ${what}` with `what = truth.kindLine || 'This one was a phish.'` (`inbox-triage-minigame.js:781–788`), and the debrief review card does the same (`debrief-view.js:117–120`). With no `kindLine` on any row, every missed web page reads "Not this time. This one was a phish." — the very "phish" word the three-way browser verdict was built to avoid, and wrong for a download, an alarm or an extension.

Fix (episode-local, in `e10/defend.json` `truth` on each of the five phish rows, then re-wire/regenerate): add a `kindLine` that says what the page really was, e.g.
- `e10_fake_check`: "That was a fake check that had already copied a command for you to run."
- `e10_fake_update`: "That 'update' came from a web page, not your browser."
- `e10_fake_alarm`: "Your computer was never locked; that was a page pretending."
- `e10_extension_permission`: "That extension was asking to read and change everything you do."
- `e10_download_exe`: "That was a program dressed up as a document."

Cite: `e10/defend.json:62/108/154/177/200` (the `truth` blocks); erb equivalents at `scenario.json.erb:145/199/253/286/318`.

### MA3 — the no-link, fake-check design is contradicted by two learner-facing strings that still say "look-alike page" and "sent its link." Major, episode-local.
The episode's twist is that there is **no link** (the colleague opens the genuine portal from a bookmark) and **no look-alike** (borrowed trust on Fernside's own address) — the seeded brief email states it plainly ("There is no link to send: they open it from their own bookmark", `scenario.json.erb:598`). But two E5-shaped strings leaked through:
- the end-of-episode success screen, `scenario.json.erb:54`: "You built one page and **sent its link**, then worked through a morning of web pages..."
- the kiosk observation, `scenario.json.erb:968`: "first build one **look-alike page and send its link**, then a morning of browser screens to sort."

Both are shown to the learner and both say the opposite of the lesson. Fix (episode-local, full erb only; the defend-only shell's own conclusion "Web pages sorted" is fine):
- `:54` old "You built one page and sent its link, then worked through a morning of web pages, closing and reporting the ones that tried to drive your computer, so this episode is finished." -> new "You built one page on a supplier's own site and sent the email that brings a colleague to it, then worked through a morning of web pages, closing and reporting the ones that tried to drive your computer, so this episode is finished."
- `:968` old "...first build one look-alike page and send its link, then a morning of browser screens to sort." -> new "...first build one fake 'verify you are human' check on a supplier's own site and send the email that brings a colleague to it, then a morning of browser screens to sort."
(The spec §8b carries the same E5 wording, so note the correction there too.)

### MA4 — the flip's section heading says "The page it links to" and `flipIntro` describes the page above the email, duplicating `flipPageIntro`. Major, engine + episode-local.
On the flip (render 02), because the stage shows both the sent email and the built page, the engine renders the frozen section headings `SECTION.message = "The message"` and `SECTION.page = "The page it links to"` (`flip-view.js:66, 214, 231`). "The page it links to" is wrong for E10 — the email carries no link — and quietly undercuts the borrowed-trust lesson the whole half is built on. Separately, the authored `flipIntro` shown under "The message" (`flip-view.js:215`) reads "This is the page you built, as Leo Brennan... meets it when he opens the portal from his own bookmark. The parts picked out below are what make it believable." — it describes **the page**, but it sits above the **email** and its red-flag bullets, and it is a near-duplicate of `flipPageIntro` ("This is the page you built, as Leo Brennan meets it when he opens the Fernside portal...") shown one section below.

Fixes:
- Episode-local: rewrite `flipIntro` to introduce the **email** it actually sits above, e.g. `e10/defend.json:223` / `scenario.json.erb:394` old "This is the page you built, as Leo Brennan, the colleague you nudged to the Fernside portal, meets it when he opens the portal from his own bookmark. The parts picked out below are what make it believable." -> new "This is the email you sent Leo, the operations colleague who places the weekly Fernside order. The parts picked out below are what would give it away." This leaves `flipPageIntro` (erb `:426`) to introduce the page, and removes the duplication.
- Engine (ENG-03b): the `SECTION.page` heading is a frozen constant and cannot be fixed in data. For a `pageType: "fakeCheck"` flip (no link), the packet should let the heading be overridden or default to "The page it sits on" / "The page you built". Cheap: a `strings.flipPageHeading` fallback the flip prefers when present. Until then the heading reads wrongly whenever the fake-check flip shows both a message and a page.

### MI1 — `phish_order_colleague_landed` is set but nothing reads it. Minor, episode-local.
The full shell declares (`scenario.json.erb:79`) and sets (`:877`, `phishTargets[0].outcome.setGlobal`) `phish_order_colleague_landed`, but the attack task completes on `phish_order_colleague_attempts > 0` (NPC `eventMappings`, `:945`) and the ink reads only `..._attempts`, so `..._landed` is dead. The validator flags it ("global set but never read"). Fix: either drop the setter (and the declaration) so it does not look load-bearing, or gate Niamh's "the page is built and the email's away" hub line on it instead of on `attempts`. Dropping it is the cleaner choice given the task already keys off `attempts`.

### MI2 — the genuine CAPTCHA renders "I am not a robot" as a free-text input, not a tick box. Minor, engine.
Row 2's whyFine and the mirror both teach "a genuine check only asks you to tick a box or pick pictures," but the built `page()` has no checkbox control, so `fields: ["I am not a robot"]` draws as a labelled **text input** with a Continue button (render 04). It reads acceptably as "a check that stays on the page," and the learner's Carry-on decision does not hinge on the control type, so this is low-impact — but a text field under "I am not a robot" is a slightly odd CAPTCHA and could read as "type this." The spec already noted the engine limitation; worth a one-line note so it is not re-raised, and a candidate for an ENG-03a `tick`/checkbox field if the browser states are extended.

### MI3 — carrying on a page that runs code or calls a scammer is not scored as a critical miss, and `truth.missLabel` is inert until it is. Minor, episode-local (design judgement).
`page` is not in `CRITICAL_KINDS` (`push, call, email`, `triage-scoring.js:53`), so under `awareness` a "Carry on" on any E10 phish is a plain zero, not a critical miss: no critical penalty and no naming in the result's critical line (`isCriticalMiss`, `:110–112`). `truth.missLabel` is only read for a critical miss (`:294`, `criticalWhat`), so it does nothing on these pages as they stand. For E10 the most dangerous misses (row 1 runs a command, row 5 puts the learner on the phone to a scammer, row 7 opens a disguised program) are the ones that most deserve the critical weight. Recommend opting those rows in with `truth.critical: true` and giving each a `truth.missLabel` for the result line, e.g. `e10_fake_check` -> "running a command a page told you to paste", `e10_fake_alarm` -> "calling the number on a pop-up", `e10_download_exe` -> "opening a program dressed up as a document". The no-blame copy in `ifTrusted`/`noBlameLine` keeps the register kind; `passPercent` is 0, so pass/fail is unaffected and only the band and the result line change. If the rows are **not** made critical, leave `missLabel` out rather than author a key that never fires. This is a judgement call for the owner, not a defect.

## Notes (not findings)

- **Over-reporting is not numerically punished.** Under `awareness`, a genuine page scores full on `report` as well as `trust` (`VERDICT_POINTS.awareness.real`: report 60, trust 60, delete 30; `triage-scoring.js`). So "Close and report everything" scores full across all seven items, and the two genuine mirrors stop over-reporting only through the immediate feedback copy and the debrief review, not the score. This is the same by-design limitation E8/E9 recorded; the measurement that matters runs through the `general_v2` check pair (spec §14), not this set. Flagged so it is a conscious choice, not a surprise. ("Go the trusted way" on a genuine page does drop to 30, so the cautious-but-wrong route is penalised; only `report` is not.)
- **Topic boundaries are respected.** E5 (sign-in pages) is reused only as the `lookalike_domain`/`padlock_myth` chips and the address-reading concept card, not re-taught; E19 (malware mechanics) is kept out — E10 covers fake updates and dangerous downloads as "pages that drive your computer" (core_08 LO3) with only the core_07 "report and leave it / device instruction" crossover in the concept panel. Clean.
- **Fonts and address font read correctly** in the renders: URLs and `*.example` hosts are in the address/mono font, body copy in the pixel font, nothing visibly below 13px. The address bar draws the padlock as a chip reading the literal word "Padlock" (renders 03, 04, 09) — a shared E5 page-card rendering, not E10-specific, but clumsy; worth raising with the engine owner at some point.
- **Host ink is in good shape.** The hub pattern gives a line that fits each moment (welcome, after the email is away, after both halves), stays in a colleague's voice, and sits under the word limit. The wiring agent's swap of the spec's "the link's away" to "the email's away to Leo" is correct for the no-link design.
- **Timing unverified.** No run was timed; seven stages with a seven-item defend half is plausible for ~15 min full / ~8 min defend, but a timed playtest is the honest confirmation.

## Verdict

**Not yet ship-ready; close MA1–MA4 first, then one timed playtest.** The episode teaches a single, repeatable lesson, the facts are faithful to core_08/core_07, the mirror pairs and the attack-earns-defence structure are sound, the register is no-blame, and both shells validate clean with dialoguelint green. All four majors are concrete and cheap, and three are pure episode-local wording/data: the verdict buttons keep their email-world sub-text so "Go the trusted way" reads "This is junk. Bin it." (MA1, fixable in `labels.verdict`); missed web pages are still called "This one was a phish" because `truth.kindLine` is unused (MA2); and two success/kiosk strings still say "look-alike page" and "sent its link", contradicting the whole no-link twist (MA3). The fourth is the flip's "The page it links to" heading (engine, ENG-03b) plus a mis-placed, duplicated `flipIntro` (episode-local) (MA4). The three minors are an unused global (MI1), the CAPTCHA control-type render (MI2, engine), and the recommendation to make the code-running pages critical misses so `truth.missLabel` earns its place (MI3, judgement). Recommend fixing MA1–MA4 and MI1 in the episode files, raising the ENG-03b flip heading and the ENG-03a CAPTCHA control with the engine owner, deciding MI3, then a timed full playtest and a C2 confirm.

---

### Return (one line each)

- Counts: 0 blocker, 4 major, 3 minor (7 total; 4 episode-local, 3 engine, 0 needs-user). Content rule met: no pasteable/runnable command anywhere.
- MA1 (episode-local): the three verdict buttons keep generic sub-text, so "Go the trusted way" reads "This is junk. Bin it." and the list tags read "Trusted"/"Reported" — fix by authoring `labels.verdict.<v>.{hint,past}` (`e10/defend.json:31`).
- MA2 (episode-local): `truth.kindLine` is unused, so a carried-on web page is told "This one was a phish." — add a `kindLine` to all five phish rows (`e10/defend.json` truth blocks).
- MA3 (episode-local): the success screen (`scenario.json.erb:54`) and kiosk observation (`:968`) say "sent its link"/"look-alike page", contradicting the no-link fake-check design.
- MA4 (engine + episode-local): the flip heading "The page it links to" is wrong (no link, `flip-view.js:66`, ENG-03b) and `flipIntro` describes the page above the email, duplicating `flipPageIntro` (`scenario.json.erb:394/426`).
- Verdict: not yet ship-ready; fix MA1–MA4 and MI1 in the episode files, raise the two engine items, decide MI3, then a timed playtest and a C2 confirm.
