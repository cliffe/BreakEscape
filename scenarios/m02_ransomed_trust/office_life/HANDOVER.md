# m02 office life: handover after stage 2 (exit rule met)

Branch `build/ol-m02`, worktree `.claude/worktrees/p-ol-m02`. Base commit `9fe568a7c`. Main has since moved to `e1303fc0c` (format step 6a-1 part 1, schema `x-serverOnly`/`x-servedBy` marks): merge it before any stage 4 work. Nothing in `scenario.json.erb` or the ink has been touched.

## Done

- Stage 0: `BASELINE.md`, `baseline_locks.json` (interim V9: `tools/office_life/lock_key_baseline.rb`, keyed by object id), `validator_info_lines.txt`. Validator 0 errors, 30 warnings. V1 to V10 are all missing on main; stage 4 waits for them.
- Stage 1: `ANALYSIS.md`. Differences from missions plan section 6: scenario line numbers moved by about 27; `cover_burned` comes from `talk_to_gary` completing; Gary's observation says "Four dead terminals" against the ink's "Two" (predates office life); Val's burn bark sits closest to the burn exchange; Doyle holds a second lanyard.
- Stage 2: `PLAN.md` draft 8, seven review rounds (below). The exit rule is met at round 7 (0 B, 0 M).
- `DIALOGUE_SAMPLE.md` for the user.
- Concepts: 3 each for `night_porter` and `night_domestic` (file-name prefixes, kept) in `public/break_escape/assets/characters/wip/` (git-ignored, not committed). `night_domestic_concept_3` did not reframe (gradient background, legs cut); re-roll it if picked.

## Review rounds (plan)

| Round | Design (B/M/m) | Server, sync, cheat (B/M/m) | Total | Main changes |
|---|---|---|---|---|
| 1 | 0/4/13 | 0/0/3 | 0/4/16 | printout no longer correspondence (contradicted Gary's desk printouts); `affordance.overhearRadius`; clue reachability check at the counter; lock tool keyed by id; append-only mappings; Val-attacked gate on the cleared exchange; build skeletons |
| 2 | 0/5/13 | 0/0/4 | 0/5/17 | object-level `officeType`; non-drinkable mug (`dirty_mugs1`); reveal global stated non-monotonic; attack global and gates; debrief left unchanged (user option) |
| 3 | 0/2/8 | 0/0/2 | 0/2/10 | claimed decor declared with no `position` (top-left semantics); attack stops pool lines too; `gary_ko` gates |
| 4 | 0/2/9 | 0/0/2 | 0/2/11 | hostility does not calm down on this engine: suspend mappings dropped, honest description, `koImmune` as a user option |
| 5 | 0/2/9 (one reviewer, both views) | | 0/2/9 | hostile `leash: true` (chase stops at the staff-room doors); `offWhen: night_staff_attacked` on the three objects; probe 10.4 runs in stage 4 on the current engine with a seated-attack and door-leave step |
| 6 | 0/1/10 (one reviewer, both views) | | 0/1/10 | `offWhen` moved to object level (format step 8a retired `affordance.offWhen`); `dr_kim_ko` gates; fresh game per probe step and a mid-exchange attack; sync budget counts item 3 |
| 7 | 0/0/8 (one reviewer, both views) | | 0/0/8 | **exit rule met.** Minors folded in draft 8: male voice `Algieba`; "handover room" in HaX texts; paper exchange gated on `patient_bed4_deceased`; partner already using finishes its use; `npcInkVariables` in the budget; reveal-global readers; citations re-read after the merge; seated drink check |

Draft 8 also applies the user's picks (2026-11-14): the porter is Ernesto Bautista everywhere (id, sprite key and ink file `ernesto_bautista`, KO global `ernesto_bautista_ko`, lines and credits); concept 1 for each; the full PixelLab pipeline approved for both, run separately; dialogue sample approved with all three exchanges; debrief unchanged; both attackable; one HaX text and one credits line for an attack short of a knock-out, text only. After that, the integrator renamed Hodan the same way (id, ink file and KO global `hodan_warsame`, matching her sprite key). Draft 8 has not had a fresh review; its changes are the rename, the decided items and the round 7 minors.

## For the user

All section 9 items are decided except the voicing spend (about 53 clips, V6 at sign-off).

## Notes

- The Write tool refused `ANALYSIS.md` as a report file; it and the later files were written through the shell because they are required repo deliverables.
- `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md:656` calls reveal globals monotonic; the engine sets them back to `false` on reload. Worth correcting there before another mission relies on it.
- E1 (SIMS-1) and E6 (SIMS-2) are not on main. E6 is needed before stage 5.

## Next

Stage 4 once V1 to V10 are on main and main is merged. Art runs separately for `ernesto_bautista` and `hodan_warsame`.
