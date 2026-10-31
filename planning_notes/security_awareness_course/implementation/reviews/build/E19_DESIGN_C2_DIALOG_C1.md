# E19 "Malware, ransomware and updates": design review C2 + dialogue review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language
model. Method and standard: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review`
skills adapted to the awareness kind, and the E8 pilot reviews for format and bar. E19 is a
**consequence-flip** episode (ENG-04): no attack half, no phish target; the mistake sandbox is the one
"attack artefact", and the montage flip shows where each choice led.

This is a combined pass: design **cycle 2** (fresh eyes over `E19_DESIGN_C1.md`, confirming each C1 finding
is really closed, then a new look) and dialogue **cycle 1** (every learner-facing string).

Scope read end to end: the full shell `scenarios/awareness_e19_malware_and_updates/{scenario.json.erb,
ink/anjali_rao.ink}`; the defend-only shell `scenarios/awareness_e19_malware_and_updates_defend/` (same
files); the fragments `planning_notes/phishing_and_social_engineering/awareness/e19/{defend.json,
full_only.json,BRAND_ADDITIONS.md}`; E19's lines in `gen_e8_e17_shells.py` (host pair `:265-268`, defend
block `:402-423`); the module `core_07_malware_ransomware_and_updates/concepts.md` (source of truth);
`BRAND_SET.md:280-287`; and the scoring engine (`inbox-triage/triage-scoring.js`,
`inbox-triage-minigame.js`, `episode-runner/debrief-view.js`) to trace how `kindLine`/`missLabel` and the
Verify verdict actually resolve. The expected playtest file `reviews/build/E19_E20_PLAYTEST_P1.md` **does
not exist**, so no playtest findings are folded in.

Ran: `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells (both **exit 0**, no
social errors or warnings; only the generic m01 spy-mission suggestions every awareness shell draws, plus
the one "no `timedConversation`" recommended-field note, also generic). `dialoguelint.mjs` on both
(full `lines=6 median=21 p90=29 max=29`; defend `lines=3 median=27 p90=28 max=28`; **no rule hits**, no
printed variables). E19's `social-awareness-fragment-erb-parity` subtest (`ok 18 ... fragment and full erb
share the same learner-facing copy`) and `social-awareness-rule-of-thumb` both pass in the canonical tree
(20/20 and 2/2). I did **not** rerun the bridge: C1 already drove it 15/15 (game 4800) after its fixes,
and nothing structural changed since; the C1 edits were copy-only and are byte-confirmed present below. I
therefore judged **every screen from the file read and the engine code**, not from a fresh render. (The
stale parity/rule-of-thumb failures that appear under `.claude/worktrees/*` are old snapshots and are not
E19 or the live tree.)

## C1 closure table

| C1 finding | Ruling | Verified closed? | Evidence |
|---|---|---|---|
| **MI1** content-warning note dropped | Fold one calm clause into full `strings.brief` (no new engine slot) | **Closed** | Full shell `scenario.json.erb:394` and fragment `defend.json:174` both end "...Only the inbox is scored. This one shows a ransomware message on a colleague's screen; there are no alarms or flashing screens." Defend-only brief (`:315`) left as-is, already names "a colleague whose screen has just locked" + "No real malware runs here", as ruled. |
| **MI2** second Fernside look-alike + stale "align with E10" note | Accept `fernside-invoices.example` as a deliberate, distinct invoice-email look-alike; record as intended | **Closed (all three files)** | `e19/defend.json:100` `_note` now records it as "a deliberate, distinct invoice-email look-alike ... accepted as intended rather than re-pointed (design review C1 MI2)"; `e19/BRAND_ADDITIONS.md:37-45` same; and `BRAND_SET.md:284` (which C1 could only flag for the orchestrator) is now itself updated — "sibling look-alikes of the same genuine `fernside.example`; both are kept". No learner-facing clash (E19 never reuses genuine `fernside.example` as a phish; the scored tells on that card are the enable-content ask + bypass, not the domain). |
| **MI3** stale `_moduleLine`/`_orgSlotLine` notes | Shorten to "folded into the Monday card" | **Closed** | `e19/defend.json:185-186` now read "FOLDED into the Monday card (BUILD_LOG 2026-10-29)" with the exact carrying clauses named. `_`-prefixed, stripped from the shipped erb. |
| **MI4** unglossed "infostealer" in the montage | Soften to "a hidden program ... built to copy your saved passwords" | **Closed** | `grep -c infostealer` = 0 in both `full_only.json` and the full shell. Montage lines now read "a hidden program run, quietly, one built to copy your saved passwords" (`:427`) and "a hidden program would have run unseen and copied your saved passwords" (`:428`). "infostealer" survives only in `concepts.md`, where it belongs. |
| (C1 extra) ransom-item engine-copy: `truth.kindLine`/`truth.missLabel` | Add so Trust/Verify feedback and the critical-miss tally read the true thing, not "This one was a phish" / "let an attacker straight in" | **Closed, and traced in code** | Present on `e19_ransom_note` in both shells and the fragment. In `inbox-triage-minigame.js:783-788` the Trust and Verify lines substitute `kindLine` for "This one was a phish."; in `debrief-view.js:118` the debrief substitutes it on Trust; in `triage-scoring.js:121-125` `criticalWhat` uses `missLabel` in the tally. Wired correctly. |

All five C1 items are genuinely closed. Nothing was papered over.

## Counts (this pass)

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 2 | 0 | 1 | 1 |
| **Total** | **2** | **0** | **1** | **1** |

Episode shape unchanged: full = 5 stages (`brief, mistake, flip, defend, debrief`); defend-only = 3
(`brief, defend, debrief`). Defend set `e19_lock_the_doors`, 6 items (4 report, 2 genuine), one mirror pair
(rows 1/2), row 6 the genuine calibration. Confirmed in code: under `scoringProfile: "awareness"`, phish
scores `report 60 / verify 60 / delete 30 / trust 0`, genuine scores full on every verdict, and a critical
miss fires **only** on Trust-of-a-phish (`triage-scoring.js:76,110-112`).

## What works (confirmed this pass)

- **One repeatable lesson, carried everywhere.** "A program, file or app you didn't start runs with your
  access, so if you didn't expect it, don't open the door, report it" is in the set brief (`:64`), the "It
  runs with your access" card (`:400`), the host ink, the montage and the defendIntro. core_07 is the
  broadest module in the course and the spine holds it together.
- **Facts match `concepts.md` exactly.** Extension 4444; "unplug the network cable and leave it switched
  on"; "don't pay, don't contact, don't try to fix it"; restart within a day / self-restart at 19:00 after
  three days; macro = "the small program (a macro) inside the file"; backup "somewhere separate from the
  computer"; "a web page offering you an update ... never genuine (E10)"; Quayholt Protect / Quayholt Files.
  Every claim traces to a key message, concept or org slot. No effectiveness figures or case studies in
  learner copy.
- **The mirror pair and calibration are fair and in code.** Row 1 (unknown-app consent phish) is followed
  immediately by row 2 (the genuine Quayholt Files consent that looks the same, `feedbackMode: "immediate"`),
  and row 6 is the genuine device update with a `falseAlarmCost`. Because genuine items score full on any
  verdict, "refuse everything" still numbers 100% — but it is defeated pedagogically by the row 1/2 mirror,
  the row 6 calibration and the two `falseAlarmCost` lines, which is the course-wide position (E8_DESIGN_C2).
- **Safe-option slot varies by beat** (`restart_prompt` safe@1, `enable_content` safe@0, `security_alert`
  safe@1, `save_location` safe@0), so the sandbox can't be gamed by always picking the same position.
- **No-blame register is clean** and neutralises the firm "Your choice." montage framing: the `noBlameLine`
  ("this is how most incidents start, not a sign anyone was careless ... Nobody at Quayholt is in trouble
  for reporting, including their own slip").
- **Host ink is warm and voiceable.** Anjali is under 30 words throughout (lint max 29/28), no printed
  variables, no raw addresses forced into the pixel font. The full-episode welcome ("I would rather you
  called me about nothing than not called about something") sets the reporting culture in one line.

## Design findings (cycle 2)

**D1. The Verify feedback line reads oddly on the ransom note, where speed is the lesson.** Minor, engine
(not episode-local). For a phish item with a `kindLine`, `inbox-triage-minigame.js:788` renders Verify as
`"Checking first is a sound habit. " + kindLine`. On `e19_ransom_note` that becomes "Checking first is a
sound habit. This was a real ransom message on a colleague's screen, and it needed reporting fast." The two
halves pull slightly against each other: for a locked screen the teaching is *report now*, and the brief
defines Verify as "check it yourself through a route you already trust, like ringing the service desk or
Anjali" — which for a ransom heads-up **is** the fast report, so it correctly scores full 60 and is not a
miss. The line is a shared engine string, not E19 copy, so it is the same everywhere a `kindLine` item
accepts Verify, and E19 is the first episode to pair the two. Impact is low (full marks, no blame, Verify
is genuinely the right move here). Fix (user choice, engine-owned): leave it — it is survivable and honest;
**or**, if the ENG owner touches `_verdictLine`, let a `kindLine` item override the Verify preamble too
(e.g. "Calling it in straight away is exactly right.") so the praise matches the "report fast" lesson for a
compromise sign. Not a ship blocker.

**D2. The full-episode content-note clause under-describes the flip, though its safety promise holds.**
Minor, needs-user. The clause folded into the full `strings.brief` (`:394`) says "This one shows a
ransomware message on a colleague's screen". In the full episode the montage flip also narrates the
learner's *own* machine being locked ("ransomware swept the floor, and the machines that had never
restarted were the ones it locked", `:419`) — so "a colleague's screen" is narrower than what the episode
actually shows. The important half of the promise, "there are no alarms or flashing screens", is true
episode-wide (the montage is calm text; the bridge confirmed no alarm/countdown DOM in C1). The clause was
lifted verbatim from the spec, which wrote it for the defend ransom-note item. Impact is low. Fix (user
choice): accept it (the colleague's screen is the only *rendered* ransom artefact; the montage is
narration); **or**, if touched, generalise to "This episode shows a ransomware message and plays out where
an afternoon's choices lead; there are no alarms or flashing screens." Non-shipping either way.

## Dialogue findings (cycle 1)

No blocker or major dialogue defects. Every learner-facing string reads on first pass for a non-technical
clerk, stays in register, and (for voiced host lines) is under 30 words with no printed variables. The two
items below are small polish, offered old -> new; neither is required.

**G1 (optional polish). Defend-only host completion line is three clipped imperatives.** Minor,
episode-local (mirrors `gen_e8_e17_shells.py:267`). Current: "That's the inbox sorted, thanks. If you
didn't start it, deny it and report it. If a screen locks, call it in, don't pay and don't touch it." It
is accurate, under 30 words and punchy, but "call it in, don't pay and don't touch it" is a rapid triple
that is slightly harder to voice warmly. It is fine as-is. If the generator is ever regenerated: old "If a
screen locks, call it in, don't pay and don't touch it." -> new "If a screen locks, call me straight away,
and don't pay or touch it." (closer to the full shell's "if a screen locks, call me straight away", and one
fewer clause to land). Low priority; leave until the next generator run — editing the ink directly would
break fragment/generator parity.

**G2 (not a defect; recorded). Montage "Your choice." / "The version where you ..." framing is consistent
and clear across all four beats.** Each unsafe branch opens "Your choice." and each safe branch opens "The
version where you [did the unsafe thing]:" then resolves with the good outcome ("The ones that had
restarted held", "restored by Monday"). This matches the engine's safe/unsafe "Your call" tag styling the
task describes, and it reads as consequence teaching, not blame. No change.

## Voiced host lines I'd change

Only one, and it is optional (G1 above): the defend-only completion line's closing triple. Everything else
Anjali says in both shells is good to voice as written — the full-episode welcome and goodbye, the
defend-only opener, and the "Thanks, Anjali." / "Any time." exchange are all calm-colleague register, warm,
and within the cap. I would ship the host ink unchanged.

## Verdict per stage

- **Brief** — ship. Scope note correct, content-note clause present (full) / covered (defend-only). One
  low-impact wording nuance (D2) the user may leave.
- **Mistake (sandbox, full only)** — ship. Exactly one `safe:true` per beat, `approvedRoute` on the safe
  one, safe-slot varies, situations plausible, no demonstrated exploit.
- **Flip (montage, full only)** — ship. Both options authored for every beat, consistent "Your choice." /
  counterfactual framing, "infostealer" removed (MI4), facts aligned to `concepts.md`.
- **Defend (both shells)** — ship. Fair six-item set, mirror pair + calibration, immediate feedback,
  `kindLine`/`missLabel` wired correctly in code, Verify scores full. D1 is an engine-string nuance, not a
  defect in the set.
- **Debrief (both shells)** — ship. Four concept cards in spec order, dense but legible Monday card
  (`_module`/`_orgSlot` lines folded in and the stale notes corrected), no-blame line, conclusion globals
  and screens fire.

**Overall: ship-worthy.** All five C1 items are genuinely closed (MI2 now resolved across all three brand
files, not just flagged). The fresh pass adds no blockers or majors — two low minors (an engine-owned
Verify feedback nuance on the ransom item, and a slightly narrow content-note clause) and one optional host
polish, all deferrable. The lesson has a clear spine, facts match core_07, the E8/E10 boundaries hold, and
both shells validate clean under `--strict-social --no-graph --skip-ink`, pass dialoguelint, and pass
E19's parity and rule-of-thumb subtests. Recommend the user decide D2, treat D1 as an engine backlog note,
fold G1 into the next generator run, and (as C1 said) run one timed full-episode playtest to confirm the
15-minute budget, which no automated check measures.
