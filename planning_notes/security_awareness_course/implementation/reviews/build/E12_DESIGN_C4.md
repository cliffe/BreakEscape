# E12 "Visitor and tailgater": design review C4 + dialogue review C3

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. E12 is played partly in the game world: on an authorised Merrin & Sallow red-team day the learner, in a hi-vis courier costume, works an in-person pretext on front-of-house (Delphine Arvanitis) to get buzzed through a badge door, then swaps to the reception seat for a seven-item triage `call` defend set. Kiosk host Lorna Easton; red-team framing Jo Fairweather (Northlight Security). Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review`/`npc-dialog-review` skills adapted to the awareness kind, the C1-C3 reviews and the B1-B3 blind reports in this folder.

Scope this pass: the full shell `scenarios/awareness_e12_visitor_tailgater/scenario.json.erb` and its ink; the defend-only shell `scenarios/awareness_e12_visitor_tailgater_defend/scenario.json.erb`; the fragments `planning_notes/phishing_and_social_engineering/awareness/e12/{attack,defend,full_only}.json`; the batch-12 engine (`public/break_escape/js/minigames/inbox-triage/inbox-triage-minigame.js`, `triage-kinds.js`, `mail-client/mail-composer.js`); the C3 review and BUILD_LOG entries since (cfbede65c, aade15788, batch-12 merge 63ead0043). The new content judged fresh: per-visitor `deleteLine`, per-verdict `reportReplyByVerdict`, the fire-inspector flag groups, and the team badge.

How screens were judged: mostly from code, data and the validator/lint runs, with **two live checks on the keyless :3001 server** (game 211 full, game 217 defend-only), driven headless through the playtest-session harness:
- the attack-stage Back-to-research fix (the item the orchestrator asked for), confirmed live;
- the per-item `deleteLine` render path, confirmed live (this is M1 below).

Ran (all green except where noted):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, **no social errors or warnings**. Only the stock m01 suggestions, the by-design `merrin_studio_badge` WARNING (full shell; the door opens on Delphine's buzz, no key), and the carried SUGGESTION that the learner and Lorna share `female_office_worker_v2`.
- `dialoguelint.mjs` on both shells: clean, no rule hits. Full: delphine `lines=16 max=16`, lorna `lines=8 max=21`; defend-only lorna `lines=3 max=28`. All host lines within the 30-word cap.
- `social-awareness-fragment-erb-parity`: 20/20.
- No em/en dashes in any shipped authored file (dashes present only in the auto-generated `dungeon_graph.*`).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 1 | 0 | 1 | 0 |
| Minor | 1 | 0 | 0 | 1 |
| **Total** | **2** | **0** | **1** | **1** |

(Carry-forward art/placeholder items — the `female_telecom_v2` costume and the Lorna/learner shared sheet — stay on the art schedule, not re-counted. The one needs-user minor is the C3 M3 item-5 scoring steer, already decided-to-keep and carried.)

## C3 closure

| Prior finding | Status | Evidence |
|---|---|---|
| **C3 M1** item 3 (fire inspector) had 4 tells and no `flagAlternatives`, so a correct Report scored below 100 beside "Right call" | **Closed** | `e12_call_fire_inspector.truth.flagAlternatives` is now `[["uniform_pretext","not_expected"],["no_escort","secrecy_or_bypass"]]` (defend.json:140; erb carries it, `flagAlternatives` ×2 = items 3 and 4). The four tells are two 2-way units, so a Report with one tick from each group credits full recall. The right-call lines also now say "The points for this visitor also depend on the tells you named" (defend.json:74,82), so a partial score reads honestly. |
| **C3 M2** `flipDefenderLine` asserted a skip-the-sign-in the learner need not have clicked | **Closed** | Now "You got Delphine to buzz you through with no badge, and a partner's name did the rest." (strings.flipDefenderLine, defend.json:238) — true for every landed path. Exactly the C3-suggested wording. |
| **C3 M3** item 5 "Let them in" full marks undercuts the verify habit | **Carried, decided-to-keep (needs-user)** | Unchanged: `e12_call_forgot_badge.truth.verdictPoints.trust:60` (defend.json:186). The P1 ruling kept full-mark Comply and added the on-card "Staff list: Back from leave today. On the staff list." line, which makes Comply defensible. See M2 below — still a steer, not a defect. |

## What works

- **The attack-stage Back-to-research gate is fixed and the pretext gating is sound (live-confirmed, game 211).** Skipping the research and opening the call card ("Prepare the call") lands on the gated `pretext-prep`: `Approach` disabled, `canCall:false`, and the requireFact line "Close this, then choose Back to research and open the browser..." shown. The **"Back to research" button is present and enabled, and clicking it opens the OSINT browser** (returning to the call card on close) — the batch-12 item-5 fix for the previously inert button. After pinning Catherine Merrin's post, the gate changes to "Choose an option for the Recipient blank"; once the blank is filled, `Approach` enables and `canCall:true`. The card is approachable only once a name is held, as designed.
- **The team badge wording matches the engine (live-confirmed).** `labels.teamBadge` "Visitors reported or checked for the team: {n}" rendered live on the defend queue. The counter defaults to counting a Verify as well as a Report (`teamBadgeCountsChecked !== false`, inbox-triage-minigame.js:569,574), so "reported **or checked**" is honest — Check first is a taught habit here, so counting it is right, and no explicit `teamBadgeCountsChecked` is needed.
- **Per-verdict Report replies land.** `truth.reportReplyByVerdict` is appended as the IT-reply line for whichever verdict was taken (inbox-triage-minigame.js:1183-1186), independent of the verdict headline. The phish visitors carry both a `report` and a `verify` reply (so a Check-first reads "Thanks for checking: ...", not a report acknowledgement); the genuine visitors carry a `report` reply only, which is right (Verify/Let-in on a genuine item have their own neutral lines). Every combination reads as English.
- **The fire-inspector grouping and the right-call honesty.** With item 3 grouped, both impostor items with many tells (3 and 4) now credit a natural tick subset, and the "points depend on the tells you named" line removes the "Right call / 73%" mismatch the courier showed in B3.
- **Register and length hold.** Every Lorna line voices as a calm colleague within the cap on both shells; Delphine's `named_recipient` branches (lines=16) stay short; no printed variables; UK English; no dashes.

## Findings

### M1 — the batch-12 per-visitor `deleteLine` never renders on E12, because the set-level `labels.verdictFeedback.delete.real` shadows it for the `call` kind. Major, engine. High confidence (live-confirmed).

The three genuine visitors carry a per-item "turned away" line: item 2 `truth.deleteLine` "That client was on the day's list to see Yasmin Chaudhry. Turning them away left a real client in the lobby..." (defend.json:125), item 5 (defend.json:186), item 7 "Nothing was wrong here. The screen was locked and the visitor was where they had been left, so there was no one to turn away." (defend.json:218). The schema says `deleteLine` "Wins over the set override and the default. Item beats set, like trustLine" (scenario-schema.json:1741).

In the engine it does not. `_verdictLine` computes the set override first (`fb = verdictFeedbackOverride(...)`, inbox-triage-minigame.js:984), and for a `call`/`push` kind returns it immediately: `const own = (fb && (kind === 'call' || kind === 'push')) ? fb : kindVerdictLine(...); if (own) return own;` (lines 997-998). E12 is a `call` set with `labels.verdictFeedback.delete.real` defined (defend.json:79), so `fb` is truthy and the function returns the set line **before** reaching the per-item `deleteLine` check at line 1020. The per-item line is dead.

Live proof (game 217, defend-only, item 2 Turn away → Confirm): the card rendered the set line
> "You chose Turn away. That one was genuine, so turning them away was not needed. Letting them through or checking first would both have been fine. The right call was Let them in or Check first."
not the item-2 `deleteLine`.

Why it matters: (a) a shipped engine feature plus authored content across three items does nothing, against the schema's documented contract, so the next author will trust a field that is silent; (b) item 7's `deleteLine` was written for B3 F5 ("a colleague who locked their screen is not a 'visitor' and nobody was 'left stuck'"), so on a Turn-away of item 7 the learner still sees the generic "Letting them **through** or checking first would both have been fine" — the exact "let them through" oddness for a locked-screen desk moment that B3 F5 flagged and this field was meant to remove. The fallback is accurate and no-blame for items 2 and 5, so no learner is misled, which is why this is Major and not a blocker.

Fix (engine, one reorder): move the item-wins checks for `trustLine` (line 1016) and `deleteLine` (line 1020) **above** the call/push `own = fb` return at 997-998, so a per-item line beats the set override as the schema promises. Safe for the other episodes: E13's genuine items carry no `deleteLine`/`trustLine` and E13 has no `delete.real` set override, so the reorder changes nothing there; E12 wants the set `delete.real` only as the fallback for items without their own line (and all three genuine items have one). This is read-only scope for me — flagged for the engine owner. Until it lands, the batch-12 "E12 per-visitor deleteLine" claim (BUILD_LOG aade15788) is not reaching the screen.

### M2 — item 5 (colleague back from leave, no badge) scores "Let them in" full, equal to "Check first", which slightly undercuts the verify habit. Minor, needs-user (scoring steer). Low confidence. Carried from C3 M3.

`e12_call_forgot_badge.truth.verdictPoints.trust:60` (defend.json:186) makes Comply full-mark on a badge-less person claiming to be staff, the one item whose own `whyFine` says "Check the staff list and issue a day pass, don't lend your own badge". The on-card "Staff list: Back from leave today. On the staff list." line makes Comply defensible (the desk can place them), which is why this was decided-to-keep under the P1 ruling and I am not re-opening it as a defect. If the verify habit should be modelled on this one item, drop item 5's `verdictPoints.trust` to the kind default (half) while keeping items 2 and 7 at full, so Check first is the only full-mark move for a visitor with no pass. A steer for the user, not a bug.

## Voiced host lines I would change

None. Every Lorna line on both shells, and every Delphine line, voices as a calm colleague within the cap, with no printed variable. M1 is an engine render-path defect, not a voiced line; the fallback prose it exposes is in register.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass | pass |
| osint | pass (`requireFact` + working Back-to-research guide a note-less learner; live-confirmed) | — |
| write (world-play pretext) | pass | — |
| flip | pass (C3 M2 closed) | — |
| defend | pass with M1 (engine `deleteLine` shadow); M2 a steer | pass with M1 |
| debrief | pass (copy stands alone) | pass |

**Ship-worthy once M1 is fixed in the engine.** The attack-stage Back-to-research button works end to end (live), the C3 M1 flag grouping and C3 M2 flip line are closed, the team badge and per-verdict replies are correct, and both shells validate clean with clean dialoguelint and green parity. The one real problem is M1: a one-line engine reorder, after which the batch-12 per-visitor `deleteLine` renders and item 7's Turn-away oddness clears. M2 is a carried scoring steer. The costume and shared sprite stay art-schedule placeholders; the `merrin_studio_badge` warning is by design. A timed full playtest is still the honest confirm owed (B3 estimated ~14 min, on target).

---

### Return (one line each)

- Counts: 0 blocker, 1 major (engine), 1 minor (needs-user, carried). Both shells validate with no social lint; dialoguelint clean; parity 20/20. Judged from code/data plus two live :3001 checks (attack-stage Back-to-research; the `deleteLine` render path).
- Closure: C3 M1 closed (fire-inspector `flagAlternatives` grouping), C3 M2 closed (flip line true for any path); C3 M3 carried as M2 (decided-to-keep); costume/shared sprite on the art schedule.
- Live check: on :3001 (game 211) skipping research and opening the call card showed the gated `pretext-prep` with `Approach` disabled and the requireFact line; the **"Back to research" button appeared, was enabled, and opened the OSINT browser**; after pinning Catherine Merrin and filling the Recipient blank, `Approach` enabled and `canCall:true` — the card is approachable only once a name is held. Batch-12 item 5 confirmed fixed.
- Blockers: none.
- Majors: M1 (engine) the per-visitor `truth.deleteLine` (items 2/5/7) never renders — `labels.verdictFeedback.delete.real` short-circuits it for the `call` kind at inbox-triage-minigame.js:997-998, before the `deleteLine` check at :1020; live-confirmed the set line shows instead of the item line. Fix: move the item-wins `trustLine`/`deleteLine` checks above that return. The dead line keeps item 7's B3 F5 "let them through" oddness on the Turn-away path.
- Minors: M2 (needs-user, carried) item 5 "Let them in" full marks undercuts the verify habit — optional drop to half.
- Verdict: ship-worthy after M1 (one engine reorder); M2 a steer; run one timed full playtest.
