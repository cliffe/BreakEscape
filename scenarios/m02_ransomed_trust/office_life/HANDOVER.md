# m02 office life: stage 4 (implementation), handover 2026-11-15

Branch `build/ol-m02`, worktree `.claude/worktrees/p-ol-m02`. Every slice of PLAN.md draft 8 is in; the live checks (10.2 to 10.4) have not started. A fresh agent picks up there.

## Done

- Baselines from the base state, before any office-life field: V1 summary `v1_summary_base.txt`, V6 list `v6_office_lines_base.txt` (0 office-life clips), V9 `baseline_locks.json` written by `scripts/lock_key_diff.rb --write` (replaces the interim tool's file; `tools/office_life/lock_key_baseline.rb` is now unused and was left in place).
- Gary's observation (`scenario.json.erb:2102`) now says two dead terminals: IT holds two PCs (`infected_terminal`, `gary_workstation`) and the ink says two (`ink/m02_npc_gary_whitlock.ink:80`). Shown, not voiced.
- Slice 1, people: both NPCs in the staff room (`scenario.json.erb:3479`, `:3518`), credits (`:230` to `:232`), HaX attack and KO mappings appended (`:1380` onwards), KO and attack globals.
- Slice 2, objects and rooms: `officePresets`, `roomTone`, `roomToneTypes` (`:623`); IT kettle and Boardroom cooler `affordance: false`; `gary_mug`, `it_photocopier`, `it_copier_page` appended to IT (`:2345` to `:2357`); boiler, cooler, microwave appended to the staff room (`:3621` to `:3635`).
- Slice 3, needs and breaks: Gary's needs, `swivel: false` and the print mapping (`:2116` to `:2134`); the pair's needs, mappings 1 to 4 and the couplings.
- Slice 4, chatter and exchanges: 4-line pools each, exchanges on Hodan (`:3540`), knots in `ink/m02_npc_hodan_warsame.ink`, `heard_` globals (`:3788`).
- Slice 5, levers: none, by plan section 4.
- Slice 6, ink: both conversations (`ink/m02_npc_ernesto_bautista.ink`, `ink/m02_npc_hodan_warsame.ink`).
- `SPOKEN_LINES.md`: 55 new lines (16 pool, 11 exchange, 28 conversation), 0 changed, 0 removed.

## Static check results (after the last slice)

- Validator: 0 errors, 31 warnings (base 28). The 3 new are V4 on Gary, Ernesto and Hodan, expected until E1. The hostile leash also turns the "add a hostile NPC" suggestion into a good-practice line. Full run with the graph: puzzle graph unchanged at 105 nodes, 126 edges, aim chain 4 hops; only the room-contents diagram gained the new objects and NPCs.
- V1 diff: the three expected lines (Gary, Ernesto, Hodan). V2, V3, V5, V7: nothing. V8: heard 3/8, reveal 1/6, office-life onceOnly 2/10, items 1/4.
- V9 (`ruby scripts/lock_key_diff.rb scenarios/m02_ransomed_trust/scenario.json.erb scenarios/m02_ransomed_trust/office_life/baseline_locks.json`): empty, exit 0.
- V6: 27 office-life clips, all uncached, 914 characters. V10 not run (still on build/ol-sims).
- dialoguelint: no finding in the two new files. reopencheck: 0 problems. inkcheck and loopcheck clean for both stories over `night_staff_attacked` x `heard_night_watch_burned`. tagdiff for each ink commit: additions only.

## Open (next agent)

1. Live checks 10.2 to 10.4 on a keyless server on port 3092 only, headless, `setFPS(20)` with fixed steps on. VM flags seeded. None run yet.
2. Measure and set the cooler's `useFrom` (`:3626`): it has none, so the preset's default cell is used, which may be inside one tile of the south doorway (PLAN 3, dressing checks).
3. Check the copier page's position (`:2354`, an estimate on the copier's top, from the Tiled sprite at 6.31, 7.88, 35x46 px) and the microwave's `useFrom` (`:3634`, an estimate a tile east of the boiler's second-user cell).
4. Confirm in a live load that `world.getObject(id).offWhen` is `night_staff_attacked` for the three staff-room objects, and that Gary drifts 0 px with the mug cell (prototype values reused).
5. Record which first turn the first meeting gives (pool line or the paper exchange) and which cell each speaker takes on mapped breaks; if Ernesto takes the second-user cell, the exchanges' first lines move to him (PLAN 6).
6. V10 on m02 before stage 5. Dialogue review of the conversations (written in this stage, not yet reviewed).

## In progress

Nothing half done. Every slice is committed.

## Files

`scenarios/m02_ransomed_trust/scenario.json.erb`, `ink/m02_npc_ernesto_bautista.ink` and `.json`, `ink/m02_npc_hodan_warsame.ink` and `.json`, `dungeon_graph.md` and `.html`, and in this folder `SPOKEN_LINES.md`, `baseline_locks.json`, `v1_summary_base.txt`, `v6_office_lines_base.txt`, this file.

## Commits

`39c316202` baselines and Gary's fix; `0d2ee451d` slice 1; `7afb73626` slice 2; `1f7685627` slice 3; `d22a2b021` slice 4; `61777df8b` slice 6; `196fa4c24` graph.

## Gotchas

- `scenario.json.erb` has ERB comments containing `%>`; a Python `%` format on a block that holds one fails. Use `str.replace`.
- The NPC observations and the three new object observations are new text the plan did not draft (shown, not voiced); the dialogue review can change them.
- The validator's V6 rake task reads this worktree's scenarios; run it with `bin/rails "app:break_escape:tts:office_lines[m02_ransomed_trust]"` from the worktree root.

## Sprite stand-ins (2026-11-15)

Stage 4 builds Ernesto on `male_telecom_v2` and Hodan on `female_telecom_v2` (with the `male_telecom` and `female_telecom` talk and viseme sheets), as PLAN.md 2.2 says. When their own art lands from the art branch, `spriteSheet`, `spriteTalk` and `spriteVisemes` change to the `ernesto_bautista` and `hodan_warsame` keys, and stage 6 re-measures posts, seats and both pairings.

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
