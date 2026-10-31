# E10 "Downloads and fake checks": design review C2 + dialogue review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. E10 is a build-and-defend episode: the learner builds one fake "verify you are human" check on a supplier's own (compromised) site and sends a lure email (attack half, unscored), meets it in a flip, then triages a morning of browser screens (defend half, scored). Company Quayholt Insurance; host Niamh Doherty (E5's host); the IT habits are carried by Leila Nassar through the concept panel, not a second room NPC. Modules core_08 (safe web and downloads, source of truth) and core_07 ("report and leave it" crossover). Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, and the E8/E9/E11 build reviews in this folder.

Content rule applied: the fake check's steps and the clipboard reveal must be plain-English descriptions only; anything pasteable or runnable is a blocker. **The rule holds: no blocker.** Row 1's body ("1. Press Windows + R. 2. Press Ctrl + V. 3. Press Enter.") is a plain-English key-press description, not a command; the builder's `clipboardReveal` and the defend-row-1 reveal are the one line "A hidden command that would run a program on your computer"; no working command is shown, stored or written in any fragment, shell or spec.

Scope read end to end: both shells (`scenarios/awareness_e10_downloads_and_fake_checks{,_defend}/{scenario.json.erb, mission.json, ink/niamh_doherty.ink}`); the fragment `planning_notes/phishing_and_social_engineering/awareness/e10/defend.json`; the spec `.../episodes/E10_downloads_and_fake_checks.md`; and the engine the C1 fixes depend on (`inbox-triage/triage-kinds.js` `relabel`/`verdictAction`, `inbox-triage-minigame.js` `labels` getter + `kindLine` feedback, `triage-scoring.js` `isCriticalMiss`/`criticalWhat`, `episode-runner/debrief-view.js`, `flip-view.js`). Source of truth for facts: `modules/core_08_safe_web_and_downloads/concepts.md` (not re-read line-by-line this pass; C1 confirmed faithful and the C1 fixes touched no fact).

How the screens were judged: this pass **ran the full-episode bridge** on the keyless `:3001` server (`ONLY="e10-full"`, game 4860, **16/16 PASS**), which confirms the critical path runs end to end in a real browser (build the fake check, send the lure, flip, triage five phish + two genuine screens, conclude). That suite dumps a result row, **not** rendered DOM, so the verdict-button sub-text (MA1), the `kindLine` feedback (MA2) and the critical-miss result line (MI3) are judged from the authored data traced through the engine, not from a pixel render. The two queued engine screens (the flip heading "The page it links to", the CAPTCHA text field) were not re-examined per the brief.

Ran (all E10-only, all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, **no social errors or warnings** on either (only the generic m01-style lock/VM suggestions). The C1 MI1 warning (`phish_order_colleague_landed` set but never read) is **gone**, confirming the global is now read.
- `dialoguelint.mjs` both shells: full `lines=9 median=14 p90=21 max=21`; defend `lines=3 median=23 p90=29 max=29`. No rule hits; every host line under 30 words.
- `node --test social-awareness-fragment-erb-parity`: **E10 passes** (`ok 11 - E10: fragment and full erb share the same learner-facing copy`). C1 could not run this (E14 tree contamination); it is clean now, so fragment and full shell carry identical learner-facing copy.
- `node --test social-awareness-rule-of-thumb`: pass (all 73 awareness shells carry the byte-identical `ruleOfThumb`).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 2 | 1 | 0 | 1 |
| **Total** | **2** | **1** | **0** | **1** |

Episode shape unchanged: full = 7 stages (`brief, osint, build, write, flip, defend, debrief`); defend-only = 3 (`brief, defend, debrief`). Defend set `e10_browser_morning`, 7 items (5 phish, 2 genuine), two mirror pairs (rows 1/2, rows 3/4).

## C1 closure

Every C1 finding checked against the live files (fixer commit `ccc0fe627`) and, where it depends on engine behaviour, traced through the code.

| C1 finding | Claimed fix | Verified | Status |
|---|---|---|---|
| **MA1** verdict buttons keep email-world sub-text ("Go the trusted way" reads "This is junk. Bin it.") | author `labels.verdict.<v>.{hint,past}` | `defend.json:32-39` authors hint/past for trust/report/delete; the engine `labels` getter folds `verdictLabels` into `labels.verdict.<v>.label` (`inbox-triage-minigame.js:152-158`) and `relabel` applies label+past+hint (`triage-kinds.js:62-67`), so each button now shows its own label, its own sub-hint ("Don't use this page; reach what I need the trusted way.") and its own list tag ("Went the trusted way"). Present and regenerated in the defend-only shell (`:92/:96`). | **Closed; wired through the engine** |
| **MA2** `truth.kindLine` unused, so a carried-on page is told "This one was a phish." | add `kindLine` to the five phish rows | `kindLine` on all five phish rows (`defend.json:74/121/170/194/220`), read for a `trust` miss in both surfaces (`inbox-triage-minigame.js:789`, `debrief-view.js:118`). Each says what the page really was ("That 'update' came from a web page, not your browser."), not "phish". | **Closed** |
| **MA3** success screen + kiosk observation say "sent its link"/"look-alike page", contradicting the no-link design | rewrite both (and spec §8b) | Success screen (`scenario.json.erb:54`): "You built one page on a supplier's own site and sent the email that brings a colleague to it...". Kiosk observation (`:986`): "...first build one fake 'verify you are human' check on a supplier's own site and send the email...". No "sent its link"/"look-alike page" left in learner copy. Spec §8b updated to match. | **Closed** |
| **MA4** flip heading "The page it links to" (engine) + `flipIntro` describes the page above the email | episode-local `flipIntro` rewrite; engine heading flagged ENG-03b | `flipIntro` (`:412`) now introduces the **email** ("This is the email you sent Leo..."), leaving `flipPageIntro` (`:444`) to introduce the page; the duplication is gone. The engine heading override is the queued item the brief says not to re-raise. | **Episode-local closed; engine heading queued** |
| **MI1** `phish_order_colleague_landed` set but nothing reads it | kiosk observation variant reads it (completion stays on `_attempts`) | `scenario.json.erb:989` adds an `observationVariants` entry gated on `globalVars.phish_order_colleague_landed && !..._defend_done`. Validator no longer warns. **Reads naturally** — see below. | **Closed** |
| **MI2** genuine CAPTCHA renders as a text field, not a tick box | engine limitation, noted | Unchanged; the queued ENG-03a `tick` field. Not re-raised per the brief. | **Engine, queued** |
| **MI3** code-running/scammer pages not scored as critical misses; `truth.missLabel` inert | `truth.critical: true` + `missLabel` on fake check, fake alarm, disguised download | `critical`+`missLabel` on rows 1/5/7 (`defend.json:72-73/168-169/218-219`). `isCriticalMiss` honours `critical===true` regardless of kind (`triage-scoring.js:112`), so these three now count as critical misses and `criticalWhat` reads each row's `missLabel` into the result line (`:121-123`, `:294`). The dangerous misses now carry the critical weight. | **Closed; honoured by the engine** |

The MI1 kiosk variant reads naturally. Three states now progress cleanly: the default observation describes the task to do ("first build one fake check... then a morning of browser screens to sort"); once the email is away the `_landed` variant reads "Your fake check is live on the supplier's own site and the email is away to your colleague; next, sort the morning's browser screens."; once the defend half is done the `_done` variant reads "The page is sent and the morning's screens are all sorted." The variant is a plain colleague's progress note, no printed variable, and the global it reads is the one the send outcome sets.

All seven C1 items are accounted for: five genuinely closed in data (MA1 also confirmed wired through the `labels` getter, MI3 confirmed honoured by `isCriticalMiss`), MA4's episode-local half closed, and the two engine items (MA4 flip heading, MI2 CAPTCHA control) left as the queued overrides the brief named.

## What works

- **The C1 fixes land where it matters and are wired, not just authored.** MA1 is the one most worth confirming: `verdictLabels` only ever set the button *label*, so the fix had to add `labels.verdict.<v>.{hint,past}` and rely on the engine folding the two together. It does: the `labels` getter merges `verdictLabels[v]` as `.label` over the authored `{hint,past}` (`inbox-triage-minigame.js:152-158`), and `relabel` applies all three, so "Go the trusted way" now carries "Don't use this page; reach what I need the trusted way." and the summary tag "Went the trusted way". MI3 is the same kind of confirm: `truth.critical: true` is only useful if the engine lets a non-critical kind opt in, and `isCriticalMiss` does exactly that before falling back to `CRITICAL_KINDS`.
- **The no-link twist is now consistent across every learner-facing string.** The seeded brief ("There is no link to send: they open it from their own bookmark"), the success screen, the kiosk observation and all three kiosk states now agree: the page sits on Fernside's own address and the lure carries no link. The `payloadKit` is empty and the target is judged on `senderTrust`/`pretextRelevant` only, matching the design.
- **The attack half earns the defence and reads cleanly.** The builder scores persuasion, not a look-alike domain: borrowed trust 35 is the strongest lever (`landingPages[].check.points`), and the one tell it cannot remove (`defFakeCheckPaste`) is exactly row 1's `fake_check_paste`. The OSINT facts, the two concept cards ("Borrowed trust", "The one thing it can't hide") and the lure templates all read as English, and every template × fact combination assembles correctly (greeting "Hi Leo," + an order pretext + the bookmarked-portal ask).
- **The mirror pairs hold and the register is no-blame throughout.** Rows 1/2 (paste-step vs tick) and 3/4 (web page vs browser chrome) are intact, so "anything unusual is a trap" cannot win, and the genuine item lands right after the likely miss. The `kindLine`, `ifTrusted`, `perFlagNote`, `noBlameLine` and Monday card all stay in a calm colleague's voice.
- **Both shells validate with no social warnings, dialoguelint is green, and parity passes** (C1 could not run parity; it is clean now). The full-episode bridge passes 16/16 on the keyless server.

## Findings

### D1 — row 1's `reportReply` says Fernside's site "was hacked" and then "is fine" in the same breath. Minor, episode-local, dialogue.

`defend.json:78` / `scenario.json.erb:145`: "Thanks. We've blocked that page, warned Fernside their site was hacked, and reported it. **Fernside's own site is fine; it was broken into.**" The intent is the row-1 lesson — a familiar, trustworthy supplier can still be compromised — but "is fine" landing one clause after "was hacked" reads as a contradiction for a non-technical clerk. The `perFlagNote` already carries the nuance better ("The site is Fernside's own, but a familiar site is not a reason to do what it suddenly tells you; it has been broken into"). Fix, old → new:
- old: "Thanks. We've blocked that page, warned Fernside their site was hacked, and reported it. Fernside's own site is fine; it was broken into."
- new: "Thanks. We've blocked that page, warned Fernside their site had been broken into, and reported it. Fernside is a genuine supplier; attackers got into their site, it is not a fake."

(Wording to taste; the point is to stop "hacked"/"fine" colliding while keeping the "genuine site, still compromised" teaching.)

### D2 — the spec's §11 final-JSON blocks and two prose examples drifted from the shipped C1 fixes; only §8b was corrected. Minor, needs-user (doc). No shipped file is wrong.

The C1 fixer corrected §8b (MA3) but left the §11 JSON and surrounding prose carrying the pre-C1 content, so a later edition that rebuilt E10 from the spec would lose the MA2/MI3 fixes:
- §11 JSON rows 1/5/7 (`E10_...md:261-267/365-373/417-424`) have no `critical`/`missLabel` and no `kindLine`; rows 3/6 have no `kindLine`. The shipped fragment carries `kindLine` on all five phish rows and `critical`+`missLabel` on rows 1/5/7 (MA2, MI3).
- Row 1's `perFlagNote` in the spec (`:264`) stops at "...for you to run."; the shipped note adds "The site is Fernside's own, but a familiar site is not a reason to do what it suddenly tells you; it has been broken into."
- §11 prose (`:240`) gives an example `reportReply` ending "reported it to the NCSC"; the shipped row says "reported it." (no NCSC claim).
- §10 (`:206`) gives `flipPageIntro` as "...as your colleague sees it when they open the Fernside portal."; the shipped string names Leo and his bookmark ("...as Leo Brennan meets it when he opens the Fernside portal from his own bookmark. Anything that would give it away is picked out below.").

Correct the §11 JSON blocks and the §10 example to the shipped wording (and note the `reportReply` example at §240) so the spec no longer trails the files. This is the companion to the §8b doc fix the fixer already made, and the same class as E11's D3.

## Dialogue pass (voiced host lines)

Every host line read as spoken, in both shells. Niamh's full-shell lines ("Good, the page is built and the email's away to Leo." / "Now take the other seat: here's a morning of the web the way it really turns up, and you sort it." / the completion triple and "Any time.") and the defend-only welcome ("The kiosk has a morning of web pages, the kind that turn up while you work. For each, decide: carry on, close and report, or go the trusted way.") are all calm, colleague-voiced, under 30 words, no printed variables, UK English, no em/en dashes. I would change none of them. The only line I would touch is on-screen defend copy, not a voiced host line: row 1's `reportReply` (D1).

Two observations I looked at and chose not to raise as findings:
- On the flip, the page's `fake_check_paste` red-flag chip ("A page telling you to paste or run something...") and `flipDefenderLine` ("...the page still had to tell him to paste and run something on his computer, and no real check ever does.") both name the paste-and-run tell. This is the standard E5-flip shape (a categorised tell chip plus the closing narrative line), the chip is a one-line label rather than a restated sentence, and I could not confirm on a render that both show together (the bridge dumped no DOM). Low confidence, left unraised; if a future render shows them stacked and reading as padding, it is the same minor polish as E9's D1.
- The "four tricks" concept card lists fake check, fake update, fake alarm and extension, omitting the disguised download (row 7). This is deliberate per spec §12 (the download sits under "Where software comes from" and the `.pdf.exe` tell), not an omission. Left as is.

## Verdict per stage

- **brief** — ship. Scope note, host welcome and set brief are clean and consistent with the no-link design.
- **osint** — ship. Two Fernside facts, reduce notes stay on borrowed trust, no intrusion technique.
- **build (fake-check builder)** — ship. Persuasion-scored, borrowed-trust lever strongest, the paste step the one tell that cannot be removed; concept cards read well.
- **write (lure email)** — ship. Empty `payloadKit`, no link, target judged on sender/pretext; every template × fact combination reads as English.
- **flip** — ship. `flipIntro` now introduces the email and `flipPageIntro` the page (MA4 episode-local closed). The engine heading "The page it links to" is the queued override, not re-raised.
- **defend** — ship after D1 (one-line `reportReply` reword). Seven items, two mirror pairs, MA1 buttons/sub-text/tags now correct, MA2 `kindLine` and MI3 critical misses working.
- **debrief** — ship. Reasoning cards, the module line, the Monday card, the shared rule of thumb (byte-identical) and the no-blame line all correct and in register.

**Overall: ship-ready once the two queued engine overrides land (MA4 flip heading, MI2 CAPTCHA control) and one timed full playtest confirms the ~15 min / ~8 min budgets.** All four C1 majors and all three minors are genuinely resolved in the files — MA1 and MI3 confirmed wired through the engine, MA3/MA2/MI1 confirmed in the shipped copy and the validator — with only the two engine items the brief named left open. The two fresh findings are a one-line dialogue reword (D1) and a spec tidy that touches no shipped learner copy (D2).

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 2 minor (2 total; 1 episode-local, 1 needs-user/doc, 0 new engine). Content rule met: no pasteable/runnable command anywhere.
- C1 closure: all 7 accounted for — MA1 closed and confirmed wired (labels getter folds `verdictLabels` over authored hint/past), MA2 closed (`kindLine` on all 5 phish rows), MA3 closed (success + kiosk strings de-linked), MA4 episode-local closed (`flipIntro` now intros the email; engine heading queued), MI1 closed (kiosk variant reads `phish_order_colleague_landed` and reads naturally), MI2 engine-queued, MI3 closed and honoured by `isCriticalMiss`.
- Blockers: none.
- Majors: none.
- D1 (minor, episode-local, dialogue): row 1 `reportReply` says Fernside's site "was hacked" then "is fine" in the same breath — reword (`defend.json:78`, `scenario.json.erb:145`).
- D2 (minor, needs-user, doc): spec §11 JSON blocks + §10/§240 examples trail the shipped C1 fixes (no `kindLine`/`critical`/`missLabel`, thinner perFlagNote, "NCSC" example) — align the spec; no shipped file is wrong.
- Verdict: ship-ready pending the two queued engine overrides and one timed playtest; apply D1's one-line reword and the D2 doc tidy if a cheap pass is on.
