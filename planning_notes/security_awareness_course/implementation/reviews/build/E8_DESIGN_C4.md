# E8 "After the click": confirmation review C4 (design + dialogue)

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Fourth design pass, first since the engine batches 9 to 11 landed. Judged the shipped files fresh: every earlier finding re-checked against the current files by line read or grep, and a new sweep for anything batches 9 to 11 changed on screen (result counts, debrief recaps, the "Episode finished" panel, critical penalties, the post-lock nudge). Kind of game: the awareness product "Incident Simulations: Critical Cases", short education-first episodes for non-technical staff on the neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model. Method and standard: the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, `REVIEWER_BRIEF.md`, and the E8 C1/C2/DIALOG_C1/CONFIRM_C3 and BLIND_B1/B2 files.

Scope read end to end: `scenarios/awareness_e8_after_the_click/{scenario.json.erb, ink/anjali_rao.ink}`; `scenarios/awareness_e8_after_the_click_defend/{scenario.json.erb, ink/anjali_rao.ink}`; the triage scoring/minigame engine (`inbox-triage/triage-scoring.js`, `inbox-triage-minigame.js`) and the debrief view, to judge the batch 9 to 11 screens from code.

Ran: `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells (both pass; the full shell shows only the one expected MI5 warning, below). `dialoguelint.mjs` on both folders (full lines=6 max=29, defend lines=3 max=29, `Totals by rule: none`). No em or en dashes in any E8 file (house style). Not run (per brief): no ink compile (`--skip-ink`), no graph, no timed browser playtest, so timing and the flip-card contrast are judged from code and the earlier evidence, not a rendered image.

## Counts (this pass)

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 1 | 1 | 0 | 0 |
| **Total (new)** | **1** | **1** | **0** | **0** |

Carried, not new: MI5 (set-but-unread `phish_takeover_victim_landed`, by design) still gives its one expected warning; the flip aftermath push-card contrast (C3 MA3) is still only "closed in code", never visually captured; no timed full-episode playtest has been run. None blocks.

## What works

- **Both C3 verdicts hold.** Spot-checked the C3 closure table against the current files: single sign-on label (full `:456`, pretexts `:502`/`:515` with no leading article), `flipIntro` grammatical (`:379`), six-item set (`e8_push_abroad, e8_sent_invoice, e8_reset_confirm, e8_colleague_slip, e8_locked_files, e8_maintenance`), host completion/greeting lines, the Monday card and both `defendIntro` lines. All as C3 recorded.
- **Every B2 finding (B2 came after C3) is fixed in the current files.** Finding 1: the missed-send and landed-no-tells flip now explain why a weak email fails and that the real one landed (`strings.flipMissed` `:452`, `flipLandedNoTells` `:454`, `flipNoSend` `:451`). Finding 3: Reuben's `whyFine` is consistent (`:306`). Finding 5: the start line reads "switch sides" (`ink:25`), not "take the other seat". Finding 6: the sender blanks now carry a real decoy once the service-desk fact is noted (the `quayholt_it_desk` fact provides `quaygen_full`/`quaygen_address` alongside the service-desk pair, `:516`-`:527`). Finding 7: end-card title "After the click: finished" (`:53`). Finding 8: the defend array now opens with the clear sign-in prompt `e8_push_abroad` (`:174`), and the engine presents in array order.
- **Critical penalty is tuned and fair.** Both shells set `scoring.criticalPenalty: 10` (full `:139`, defend `:100`), with only two items marked `critical: true` (the forged sent item `:244` and the sign-in prompt `:197`); `e8_reset_confirm` is `critical: false` (`:282`) and the ransom page is a non-critical `page` kind. Worst case is -20 off the round mean, so a rushed run lands near 13%, not 0% (BUILD_LOG 283). B2 finding 2 (0% beside non-zero item scores) is resolved by that tuning.
- **Batch 9 to 11 screens read correctly for E8.** Headline shown once, the reasons nudge only fires on phish items with scorable tells, the genuine-Delete default is consistent, and the "Episode finished" panel uses the engine default (no override needed). E8 has no consequence-sandbox stage and no `choice`-kind cards, so the everyday-choices intro and the `sandboxRecap` hook do not apply here.

## Findings

### F1 — the `sheetNudge` override still tells the learner to "Confirm again" after the verdict is locked. Minor, episode-local, content.

Batch 11 corrected the engine's default post-lock nudge: `_nudgeLine()` now returns "Next time, tick what made you decide, or choose 'Nothing looks wrong'." and the code comment (`inbox-triage-minigame.js:874`-`879`) states the nudge is shown retrospectively, when the verdict is already locked and only "Next" is offered, so it "never asks the learner to 'Confirm again', an action that is no longer possible." E8 overrides that default with its own `set.sheetNudge`, and the override text was not updated:

- full `scenario.json.erb:156`: `"sheetNudge": "Tick what made you decide, or choose Nothing looks wrong. Then press Confirm again."`
- defend `scenario.json.erb:119`: same string.

Because `_nudgeLine()` returns `set.sheetNudge` verbatim (`inbox-triage-minigame.js:880`), the learner who confirms a phish item without ticking anything sees "Then press Confirm again" on the review card at the moment the only button is "Next". This is exactly E8 BLIND_B2 finding 4; the engine half was fixed, the E8 override was left carrying the stale instruction. (E9, which sets no `sheetNudge`, uses the corrected default and is unaffected.)

Fix (both shells): drop the override so E8 uses the corrected engine default, or reword to the retrospective form.
old (`:156` / `:119`) `"Tick what made you decide, or choose Nothing looks wrong. Then press Confirm again."`
-> new `"Next time, tick what made you decide, or choose 'Nothing looks wrong'."`

## Notes (not findings)

- **Batch 11 `resultCopy.caughtBreakdown` / `handledRightLabel` not set.** These self-describing count keys were wired into E11/E12/E13/E15/E16 to clear up confusing tallies. E8's counts already read cleanly ("Signs spotted"; "Reported {pct}% of the signs of a taken-over account"; "Signs reported for the team: {n}"), and its blind runs flagged no count confusion beyond the critical penalty (now tuned). Adding the breakdown keys for cohort parity is optional, not required.
- **`set.confirmPrompt` (batch 11, opt-in) not set.** The gentle pre-lock "Confirm again to move on" prompt only fires when `confirmPrompt` is on, which E8 does not set, so it never shows the confirm-twice flow. Optional; unrelated to F1 (F1 is the post-lock review-card nudge).
- **MI5 carried by design.** `phish_takeover_victim_landed` is still set and unread (full `:78`), producing the one validator warning. Standing ruling: E1/E5 do the same and the full-episode bridge reads it as the landing signal. Not an E8 defect.
- **Timing and flip-card contrast still unverified.** No timed playtest (the budget check carried from C3), and the flip aftermath push-card contrast (C3 MA3) has never been captured in a render. Both carried, neither blocking.

## Verdict

- **Design: confirmation-clean, one minor.** All C1/C2/C3 findings and all B2 findings are closed in the current files. Critical-penalty tuning and the batch 9 to 11 screens are correct for E8. The one new item (F1) is a stale override string, minor and episode-local.
- **Dialogue: clean.** dialoguelint no rule hits on both folders, attribution resolves, the hub/`hub_quiet` structure is intact, host lines are within the word cap and voice as a calm colleague, no-blame throughout, no em or en dashes.

E8 stays ship-ready as the pilot. Recommended before final close (all non-blocking): apply F1 in both shells; run one timed full-episode playtest to confirm the 15-minute budget; and, if the engine owner wants certainty, one eyeball on the flip aftermath push-card contrast.

### Return (one line each)

- Counts: 0 blocker, 0 major, 1 minor (1 total, episode-local, content).
- Blockers: none.
- Majors: none.
- F1 (minor, episode-local): the `sheetNudge` override still says "Then press Confirm again." where the engine now shows it post-lock with only "Next" offered — full `scenario.json.erb:156`, defend `scenario.json.erb:119`.
- Verdict: confirmation-clean; apply F1, run a timed playtest, one eyeball on the flip-card contrast; no further correctness pass needed.
