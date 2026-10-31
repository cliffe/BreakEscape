# E8 "After the click": confirmation review C5 (design + dialogue)

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Fifth design pass, first since engine batch 12 landed and the batch-12 content pass ran. Judged the shipped files fresh: the one C4 finding re-checked against the current files, and a new sweep for what batch 12 changed on screen (the hidden "Verdict locked" banner in immediate mode, the post-lock nudge, the weakest-skill line after "nothing to grade", the team badge, the critical penalty). Kind of game: the awareness product "Incident Simulations: Critical Cases", short education-first episodes for non-technical staff on the neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. Method and standard: `scenario-design-review` and `npc-dialog-review` adapted to the awareness kind, `REVIEWER_BRIEF.md`, and the E8 C1/C2/C3/C4 and BLIND_B1/B2 files.

Scope read end to end: `scenarios/awareness_e8_after_the_click/{scenario.json.erb, ink/anjali_rao.ink}`; `scenarios/awareness_e8_after_the_click_defend/{scenario.json.erb, ink/anjali_rao.ink}`; the triage minigame and scoring engine (`inbox-triage/inbox-triage-minigame.js`, `triage-scoring.js`) for the batch-12 behaviour, to judge the screens from code.

Ran: `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells (both pass; the full shell shows only the one expected MI5 warning, below). `dialoguelint.mjs` on both folders (full lines=6 max=29, defend lines=3 max=29, `Totals by rule: none`). No em or en dashes in any E8 scenario or ink file (house style; the only hits are in the auto-generated `dungeon_graph.*`). Not run (per brief): no ink compile (`--skip-ink`), no graph, no timed browser playtest, so timing and the flip-card contrast are judged from code and the earlier evidence, not a rendered image.

## Counts (this pass)

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 1 | 1 | 0 | 0 |
| **Total (new)** | **1** | **1** | **0** | **0** |

Carried, not new: MI5 (set-but-unread `phish_takeover_victim_landed`, by design) still gives its one expected warning; the flip aftermath push-card contrast (C3 MA3) is still only "closed in code", never visually captured; no timed full-episode playtest has been run. None blocks.

## What works

- **C4 F1 is fixed.** The `sheetNudge` override now reads the retrospective "Next time, tick what made you decide, or choose Nothing looks wrong." in both shells (full `scenario.json.erb:156`, defend `:119`), so a learner who confirms a phish item without ticking no longer sees "Then press Confirm again" at the moment the only button is "Next" (commit d2981b9f2). The engine returns `set.sheetNudge` verbatim (`inbox-triage-minigame.js:891`-`892`) and shows it only on the immediate review card when nothing scorable was ticked (`:1205`), so the wording now matches the screen.
- **Batch 12's hidden "Verdict locked" banner helps E8 for free.** E8 is `feedbackMode: "immediate"` (full `:141`, defend `:104`). Batch 12 item 1 moves the accent "Verdict locked: …" notice to screen-reader-only in immediate mode (`inbox-triage-minigame.js:210`-`215`: `this.liveEl.classList.add('tri-live-sr')`), because the review card is already the visible confirmation. This is the fix for the three testers who missed the card; E8 sets nothing and inherits it.
- **Weakest-skill line is suppressed after "nothing to grade".** When the learner names no flags, the engine prints only `noFlagsLead` + `noFlags` and skips the per-factor breakdown and the "Weakest skill" pointer (`inbox-triage-minigame.js:1598`-`1600`), so E8's "You didn't tick anything you noticed, so there's nothing to grade skill by skill." (`:120`) is no longer followed by a skills list. Batch 12 item 3, inherited.
- **Critical penalty stays tuned and fair.** Both shells keep `scoring.criticalPenalty: 10` (full `:139`, defend `:101`) with only two `critical: true` items (the forged Sent item `:244`, the sign-in prompt `:197`); `e8_reset_confirm` is `critical: false` (`:282`) and the ransom page carries no critical flag. Worst case is -20 off the round mean, so a rushed run lands low but not 0% (C4 F-class resolved, carried clean).
- **Dialogue holds.** `start -> hub` with the `hub_quiet` resting point (ink `:19`-`:44`); the three hub states (both-sides-done, email-sent, cold welcome) all voice as a calm colleague, under the 30-word cap, no-blame ("Nobody's ever in trouble for reporting."); attribution is explicit on every line. dialoguelint finds nothing.

## Findings

### F1 — the team-badge visible text still says "reported" where the count includes Verify; the sibling episodes were moved to "reported or checked" in the batch-12 content pass and E8 was skipped. Minor, episode-local, content.

E8 offers Verify as a verdict (`verifyVerdict: true`, full `:140`, defend `:103`; the brief tells the learner to "ring the service desk or Anjali on a number you already hold", `:137`). The team tally counts a Verify on a phish item toward `{n}` unless the set opts out with `labels.teamBadgeCountsChecked: false` (`inbox-triage-minigame.js:569`, `:574`), and E8 does not set that key, so Verify is counted. But the visible badge text reads:

- full `scenario.json.erb:164`: `"teamBadge": "Signs reported for the team: {n}"`
- defend `scenario.json.erb:127`: same string.

So a learner who rings to verify the push or the reset-confirm sees the number rise under the word "reported". The badge's own hover title already says the accurate thing — "Signs of a taken-over account you reported **or checked** this round rather than carrying on" (`:163` / `:126`) — so the short text contradicts its own tooltip as well as the count. This is the batch-12 item 2 case (E16 B3: "team counter counts a Verify as reported for the team"); the content pass reworded E9's and E12's badges to "reported or checked" (commit aade15788) and left E8 on the old wording. Low impact (a count badge, not a scored screen), but it is a visible number-versus-word mismatch and the one E8 line the new convention missed.

Fix (both shells): match the count and the title.
old (`:164` / `:127`) `"Signs reported for the team: {n}"`
-> new `"Signs reported or checked for the team: {n}"`

## Notes (not findings)

- **`confirmPrompt` (batch 12 item 17) not set.** The gentle pre-lock "Confirm again to move on" prompt only fires when `set.confirmPrompt` is on, which E8 does not set, so the confirm-twice flow never shows and the batch-12 reword of its default copy does not reach E8. Optional, unrelated to the old C4 F1 (that was the post-lock review-card nudge, now fixed).
- **`resultCopy.caughtBreakdown` / `handledRightLabel` not set.** E8's counts already read cleanly ("Signs spotted"; "Reported {pct}% of the signs of a taken-over account"; and, once F1 is applied, "Signs reported or checked for the team: {n}"). Adding the self-describing count keys for cohort parity is optional, not required.
- **MI5 carried by design.** `phish_takeover_victim_landed` is still set and unread (full `:78`), producing the one validator warning. Standing ruling: E1/E5 do the same and the full-episode bridge reads it as the landing signal. Not an E8 defect.
- **Timing and flip-card contrast still unverified.** No timed playtest (carried), and the flip aftermath push-card contrast (C3 MA3) has never been captured in a render. Both carried, neither blocking.

## Verdict

- **Design: confirmation-clean, one minor.** C4 F1 (the stale nudge) is genuinely fixed in both shells. The batch-12 engine changes (hidden verdict-lock banner, suppressed weakest line) land correctly for E8 with no authored keys, and the critical penalty is still tuned. The one new item (F1) is the team-badge wording the batch-12 content pass applied to the cohort and skipped on E8.
- **Dialogue: clean.** dialoguelint no rule hits on both folders, attribution resolves, the hub/`hub_quiet` structure is intact, host lines are within the word cap and voice as a calm colleague, no-blame throughout, no em or en dashes.

E8 stays ship-ready as the pilot. Recommended before final close (all non-blocking): apply F1 in both shells for cohort parity; run one timed full-episode playtest to confirm the 15-minute budget; and, if the engine owner wants certainty, one eyeball on the flip aftermath push-card contrast.

### Return (one line each)

- Counts: 0 blocker, 0 major, 1 minor (1 total, episode-local, content).
- Blockers: none.
- Majors: none.
- F1 (minor, episode-local): team badge visible text says "Signs reported for the team: {n}" while the count includes Verify and its own tooltip says "reported or checked" — the batch-12 "reported or checked" convention reached E9/E12 and skipped E8; full `scenario.json.erb:164`, defend `:127`.
- Verdict: confirmation-clean, ship-ready as the pilot; apply F1 for cohort parity, run a timed playtest, one eyeball on the flip-card contrast; no further correctness pass needed.
