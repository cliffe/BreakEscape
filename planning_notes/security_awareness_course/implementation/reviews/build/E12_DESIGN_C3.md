# E12 "Visitor and tailgater": design review C3 + dialogue review C2

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. E12 is the awareness episode played partly in the game world: on an authorised Merrin & Sallow red-team day the learner, in a hi-vis courier costume, works an in-person pretext on the influence bar to get front-of-house (Delphine Arvanitis) to buzz them through a badge door, then swaps to the reception seat for a seven-item triage `call` defend set. Kiosk host Lorna Easton; red-team framing Jo Fairweather (Northlight Security). Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review`/`npc-dialog-review` skills adapted to the awareness kind, the C1/C2 reviews and the B1-B3 blind reports in this folder.

Scope read end to end this pass: the full shell `scenarios/awareness_e12_visitor_tailgater/{scenario.json.erb, ink/delphine_reception.ink (+ compiled delphine_reception.json), ink/lorna_easton.ink}`; the defend-only shell `scenarios/awareness_e12_visitor_tailgater_defend/{scenario.json.erb, ink/lorna_easton.ink}`; the fragments `.../awareness/e12/{attack,defend,full_only}.json`; the spec `.../episodes/E12_visitor_and_tailgater.md`; the B3 blind report; cited scorer code (`inbox-triage/triage-scoring.js` `flagUnits`/`flagPoints`). C2 is `reviews/build/E12_DESIGN_C2_DIALOG_C1.md`.

How screens were judged: this pass is **from code, data and the validator/lint runs**, not a fresh bridge. C2 ran `e12-full` 20/20 on the keyless :3001 server; the changes since are content edits to the fragment/erb/ink (B2, B3 and batch-11 fixes), with no structural or engine change that would invalidate that flow, and I read each edited string directly. I say "confirmed from data/code" at each finding. The honest confirm still owed is a single timed full playtest (see Verdict).

Ran (all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, **no social errors or warnings**. The only non-generic lines are the by-design `merrin_studio_badge` WARNING (the door opens only on Delphine's buzz; no key exists, §9.1) and the SUGGESTION that the learner avatar and Lorna share `female_office_worker_v2` (the placeholder sprite, carried forward). The rest are the stock m01 "add VM launcher / lock variety / hostile NPC" suggestions every awareness shell draws.
- `dialoguelint.mjs` on both shells: clean. Full: delphine `lines=13`, lorna `lines=8 max=21`. **Defend-only: lorna `lines=3 max=28`** — the C2 MA1 47-word welcome is now within the cap (generator pass 2 landed).
- `social-awareness-fragment-erb-parity` subtest for E12: ok (14/14 overall).
- No em/en dashes in any shipped authored file.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 3 | 2 | 0 | 1 |
| **Total** | **3** | **2** | **0** | **1** |

(Carry-forward art/placeholder items — the costume sprite and the Lorna/learner shared sheet — are tracked in the closure table as needs-user, not re-counted, per the orchestrator's convention. The one needs-user minor counted above is the D2 flip-line accuracy tweak, held for a steer.)

## C2 + B3 closure

| Prior finding | Status | Evidence |
|---|---|---|
| **C2 D1** `hands_full` prep-card `text` still ended "buzz me through" while the ink dropped it | **Closed** | `attack.json:115` and full erb `:818` both now read "My hands are full and the badge's back in the van." — byte-identical to the ink choice (`delphine_reception.ink:56`) and the compiled `.json`. Only the ask (ink:62) says "buzz me through"; the prep card and the conversation agree. Parity subtest green. |
| **C2 MA1** defend-only Lorna welcome 47 words | **Closed** | `defend` ink `lines=3 max=28`, no dialoguelint ERROR (generator pass 2, `LINES[('e12','defend')]`). |
| **C2 MI1** dead flip strings in defend-only shell | **Closed (harmless residual)** | `flipMissedHeading`/`flipLandedNoTells` remain in `strings` but reference no template id, so strict-social is clean on both shells; the five stripped flip strings are gone from the defend-only shell. |
| **C2 D2** `flipDefenderLine` asserts a skip-the-sign-in the learner may not have clicked | **Open, carried forward as M2** (low confidence, spec wording) | Unchanged: `defend.json:236`, full erb `:450`. |
| **C2 MI2 / D3** costume placeholder; Lorna/learner share `female_office_worker_v2` | **Open, as expected (art schedule)** | Costume still `female_telecom_v2` (`full_only.json`, erb); validator still SUGGESTS the shared sheet on both shells. |
| **B3 F3** Delphine keeps asking "who is it for" after Catherine is named | **Closed** | `delphine_reception.ink` now carries `VAR named_recipient`, set in the `name_drop_partner` branch (`:90`); the band-1 and ask-pending lines branch on it (`:79-83`, `:109-113`), so after naming Catherine she switches to "I'd like to check that against today's list" rather than re-asking. Compiled `.json` matches. |
| **B3 F5 / F7** wrong-answer wording blamed the player or named a non-event | **Closed** | `labels.verdictFeedback` is now neutral per verdict (`defend.json:67-84`): trust.phish "Nothing showed this visitor was expected..."; delete.real "turning them away was not needed. Letting them through or checking first would both have been fine." No "left them stuck". |
| **B3 F10** "Right call" beside a sub-100 score on the courier (too many tells to tick) | **Closed on item 4 only** | Item 4 got `flagAlternatives` + `verdictPoints.delete:60` (`defend.json:159-160`). The same structure on **item 3 is untreated** — see M1. |
| **B3 F11** colleague-back-from-leave "Let them in" scores 100 with no check | **Partly addressed; carried as M3** | A visible "Staff list: ... On the staff list." transcript line was added (`defend.json:182`), so the on-card check now exists; but `verdictPoints.trust:60` still scores "Let them in" full — see M3. |
| **B3 P2 F1** "Prepare the call" with no notes offered only Close | **Closed** | `requireFact:true` + `requireFactLine` (`attack.json:94-95`) now tells the learner to go back to research and click a line that names someone. |
| **B3 F1/F8/F9/F4/F6/F12/F13** nits (end-card recap wording, reload position, counters) | Mix of content-closed and engine/known | End-card and defend-only recap wording reworked (`genuineCopy`, `conceptPanel`, `defendOnly`); the reload-position and counter nits are engine-level and out of episode scope. Not re-raised. |

The C2 major is genuinely closed in both files, and the B3 content minors are addressed. One residual of the B3 F10 class survives on item 3 (M1).

## What works

- **The pretext teaches and the retune holds.** `susceptibility.authority_borrowed:-5`, `asks.buzz_door.floor:-10` (`attack.json:92,122`) let a calm, fact-using run land and a pushy run refuse; `requireFact` forces the learner through OSINT so the `recipient` blank can be filled. The `named_recipient` gating removes the one B3 dialogue loop, so Delphine now reads as a person who got her answer and is still not satisfied — which is the lesson.
- **The defend set is fair, matched and no-blame.** Three adjacent mirror pairs (1↔2, 4↔5, 6↔7), `verifyVerdict:true`, a `falseAlarmCost` on every genuine item, `kindTag "At a colleague's desk"` on items 6/7 so "Let them in" stops reading oddly on the screen-lock pair, and item 4 is the exact con the learner just ran. The four desk-appropriate button labels (Let them in / Report / Turn away / Check first) with per-action hints and past tags are in `labels.callActions` and named in the set brief.
- **The in-fiction "day's list" is on the card.** Items 2, 3, 4, 5 carry a "Today's list" / "Staff list" transcript line, so every verdict rests on something visible on screen (the B2 F2 principle), not on off-card knowledge.
- **The copy stands alone in the defend-only shell.** `conceptPanel` ("What these visitors relied on"), `noBlameLine` and `defendOnly` no longer assume the learner played the courier, so the generated defend-only shell reads cleanly for a player who never saw the attack half.
- **Register and length.** Every Lorna line voices as a calm colleague and sits within the word cap on both shells; no printed variables; UK English; no dashes.

## Findings

### M1 — item 3 (fire inspector) carries four tells with no `flagAlternatives`, so a right "Report" can score below 100 beside "Right call" feedback — the exact B3 F10 class, left untreated on this item. Minor, episode-local. Moderate confidence.
`e12_call_fire_inspector` has `truth.flags: ["uniform_pretext","not_expected","no_escort","secrecy_or_bypass"]` and **no** `flagAlternatives` (`defend.json:138`). With no alternatives, `flagUnits` makes each flag its own scoring unit (`triage-scoring.js:277`), so full flag-recall needs all four ticked. A learner who Reports the inspector with the two obvious ticks (uniform-as-proof, not on the list) catches 2 of 4 units and sees a sub-100 item score next to the "Right call: the day's list or a word with their host is how you check" feedback — the same mismatch B3 F10 flagged on the courier, which was fixed there with `flagAlternatives`. Item 3 is the direct analogue and was skipped. Fix: group the four into one or two units as item 4 does, so a reasonable subset credits the unit. Suggested, mirroring item 4's shape:
`"flagAlternatives": [["secrecy_or_bypass","no_escort"],["uniform_pretext","not_expected"]]`
(secrecy/no-escort name the same "let myself in unescorted" tell; uniform/not-expected name the "no proof he's expected" tell). Then re-run the fragment/erb parity subtest. Judged from data and the scorer code; confirm on a bridge that a 2-tick Report reaches 100. Note item 4 still carries six flags against a single two-way alternative, so even there full recall needs four ticks; if the courier shows the same "Right call / 73%" gap on a timed playtest, give it the same grouping treatment.

### M2 — the single `flipDefenderLine` asserts "You asked Delphine to skip the sign-in" on landed runs that need not include that line. Minor, episode-local, dialogue. Low confidence (spec-sanctioned wording). Carried from C2 D2.
`strings.flipDefenderLine` (`defend.json:236`, full erb `:450`): "You asked Delphine to skip the sign-in and buzz you through, and a partner's name did the rest." A run lands as soon as `recipient` is proven and influence sits at or above the ask floor, so a learner can land on `open_parcel` + `name_drop_partner` + `buzz_door` alone, without clicking `no_need_to_sign`. A call attack has no `templateId`, so the flip cannot vary by choice (§9.5); the one line attributes a move the learner may not have made. Defensible (being buzzed through with no badge *is* skipping the sign-in) and it is the §10 draft wording, so this is low confidence. If you want it true for every landed path: → "You got Delphine to buzz you through with no badge, and a partner's name did the rest." Leave it if the spec phrasing is preferred.

### M3 — on item 5 (colleague back from leave, no badge) "Let them in" scores full, equal to "Check first", which slightly undercuts the verify habit the episode teaches. Minor, needs-user (scoring decision). Low confidence.
`e12_call_forgot_badge` is genuine with `truth.verdictPoints.trust:60` (`defend.json:184`), so Comply ("Let them in") earns the same full 60 as Check first. For item 2 (expected client the list already shows as "Expected") and item 7 (locked screen, nothing to act on), full-mark Comply is clearly right. Item 5 is weaker: the lesson in its own `whyFine` is "Check the staff list and issue a day pass, don't lend your own badge" — a badge-less person claiming to be staff is exactly the case for verifying, not waving through. The on-card "Staff list" line now shows the desk *can* place them, which makes Comply defensible, so this is low confidence and it is the P1 F-E12-1 decision to lift genuine-item Comply to full. But a rushed player who clicks "Let them in" on every badge-less visitor learns nothing here (B3 F11's point). If you want the verify habit modelled on this one item, drop item 5's `verdictPoints.trust` to the kind default (half) while keeping items 2 and 7 at full, so Check first is the only full-mark move for a visitor with no pass. Flagged for a steer, not a defect.

## Voiced host lines I would change

None for length or register — every Lorna line (full and defend-only) sounds like a calm colleague and sits within the word cap. The only on-screen flip-prose change on offer is M2, and only if you want it accurate for the no-skip landing path (it is not a voiced line).

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass | pass |
| osint | pass (3 shallow facts; `requireFact` guides a note-less learner) | — |
| write (world-play pretext) | pass (C2 D1 closed; the loop in B3 F3 fixed) | — |
| flip | pass; M2 optional | — |
| defend | pass; apply M1 (item-3 flag grouping), consider M3 | pass |
| debrief | pass (copy stands alone) | pass |

**Ship-worthy; apply M1, then a timed full playtest.** The C2 major and the B3 content minors have all landed in the live files, and both shells validate clean with clean dialoguelint and green parity. The one solid residual is M1 — item 3 never got the `flagAlternatives` grouping that fixed the "Right call / sub-100" mismatch on item 4, a one-line fix in the fragment and erb. M2 is an optional flip-line accuracy tweak and M3 a scoring steer on a single genuine item. The costume and the Lorna/learner shared sprite stay the art-schedule placeholders, and the `merrin_studio_badge` warning is by design. The honest confirm still owed is one timed full playtest (§6 flags the world-play `write` as the overrun risk; B3 estimated ~14 min, on target).

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 3 minor (2 episode-local, 1 needs-user). Both shells validate with no social lint; dialoguelint clean (defend-only Lorna now 28 words, C2 MA1 closed); E12 parity subtest green. Judged from code/data, not a fresh bridge (C2's `e12-full` was 20/20; only content changed since).
- Closure: C2 D1 closed (prep card now matches the ink), C2 MA1/MI1 closed (generator pass 2), B3 F3/F5/F7/F10-on-item-4/F11-partial/P2-F1 closed; C2 D2 carried as M2, costume/shared-sprite carried as art.
- Blockers: none.
- Majors: none.
- Minors: M1 (episode-local) item 3 fire inspector has 4 tells and no `flagAlternatives`, so a right Report with a natural tick subset scores below 100 beside "Right call" — add a grouping as item 4 has (`defend.json:138`). M2 (dialogue, low conf) flipDefenderLine asserts a skip-the-sign-in the learner need not have clicked. M3 (needs-user, low conf) item 5 "Let them in" full marks undercuts the verify habit.
- Verdict: ship-worthy after M1; M2/M3 optional; costume + shared sprite to the art schedule; run one timed full playtest.
