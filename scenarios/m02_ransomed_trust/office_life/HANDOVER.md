# m02 office life: handover after stages 0 to 2

Branch `build/ol-m02`, worktree `.claude/worktrees/p-ol-m02`. Base commit `9fe568a7c`. Main has since moved to `d99ca4946` (phish chunk C, no m02 or needs files): merge it before any stage 4 work. Nothing in `scenario.json.erb` or the ink has been touched.

## Done

- Stage 0: `BASELINE.md`, `baseline_locks.json` (interim V9: `tools/office_life/lock_key_baseline.rb`, keyed by object id), `validator_info_lines.txt`. Validator 0 errors, 30 warnings. V1 to V10 are all missing on main; stage 4 waits for them.
- Stage 1: `ANALYSIS.md`. Differences from missions plan section 6: scenario line numbers moved by about 27; `cover_burned` comes from `talk_to_gary` completing; Gary's observation says "Four dead terminals" against the ink's "Two" (predates office life); Val's burn bark sits closest to the burn exchange; Doyle holds a second lanyard.
- Stage 2: `PLAN.md` draft 6, five review rounds (below).
- `DIALOGUE_SAMPLE.md` for the user.
- Concepts: 3 each for `night_porter` and `night_domestic` in `public/break_escape/assets/characters/wip/` (git-ignored, not committed). `night_domestic_concept_3` did not reframe (gradient background, legs cut); re-roll it if picked.

## Review rounds (plan)

| Round | Design (B/M/m) | Server, sync, cheat (B/M/m) | Total | Main changes |
|---|---|---|---|---|
| 1 | 0/4/13 | 0/0/3 | 0/4/16 | printout no longer correspondence (contradicted Gary's desk printouts); `affordance.overhearRadius`; clue reachability check at the counter; lock tool keyed by id; append-only mappings; Val-attacked gate on the cleared exchange; build skeletons |
| 2 | 0/5/13 | 0/0/4 | 0/5/17 | object-level `officeType`; non-drinkable mug (`dirty_mugs1`); reveal global stated non-monotonic; attack global and gates; debrief left unchanged (user option) |
| 3 | 0/2/8 | 0/0/2 | 0/2/10 | claimed decor declared with no `position` (top-left semantics); attack stops pool lines too; `gary_ko` gates |
| 4 | 0/2/9 | 0/0/2 | 0/2/11 | hostility does not calm down on this engine: suspend mappings dropped, honest description, `koImmune` as a user option |
| 5 | 0/2/9 (one reviewer, both views) | | 0/2/9 | hostile `leash: true` (chase stops at the staff-room doors); `offWhen: night_staff_attacked` on the three objects; probe 10.4 runs in stage 4 on the current engine with a seated-attack and door-leave step |

Round 5 was the cap. Its 2 majors and most minors were fixed by the orchestrator in draft 6 but have **not been confirmed by a fresh reviewer**. Open from round 5: none unaddressed except as user items. The exit rule (a round with 0 B and 0 M) was not met; a confirmation read of draft 6 is the next step if the orchestrator wants one.

## For the user (stage 3 review page)

From `PLAN.md` section 9: the PixelLab spend for both characters (then their talk-init picks); the voicing spend (about 53 clips, V6 at sign-off); the dialogue sample; the debrief and an assault on the pair (recommended: leave unchanged); attackable or `koImmune` (recommended: attackable); a reaction to an attack short of a knock-out (recommended: one HaX text and one credits line, text only); "Ernie" near "Bernie" (recommended: keep).

## Notes

- The Write tool refused `ANALYSIS.md` as a report file; it and the later files were written through the shell because they are required repo deliverables.
- `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md:656` calls reveal globals monotonic; the engine sets them back to `false` on reload. Worth correcting there before another mission relies on it.
- E1 (SIMS-1) and E6 (SIMS-2) are not on main. E6 is needed before stage 5.

## Next

Stage 3 (approvals page), then stage 4 once V1 to V10 are on main and main is merged.
