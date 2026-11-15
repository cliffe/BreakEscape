# m02 office life: stage 4 closed, handover 2026-11-15

Stage 4 is closed. Reviews: dialogue R1 0/2/11, implementation R1 0/2/8, combined R2 0/0/7 (stop rule met); all fixed (outcomes in each review file). Live checks: `STAGE4_LIVE.md`, `STAGE4_LIVE_R2a.md`, `STAGE4_LIVE_R2b.md`, `STAGE4_LIVE_R3.md` (new ink, reloads, attack probe, crossings, copier page, the printout and cover flags). No product failure found. Spoken lines: 71 in all, every change against the approved sample listed in `SPOKEN_LINES.md`; voicing waits for the user.

Decided at close:
- The untaken printout is gone after a reload (the engine stows revealed slots on load, `npc-needs.js` `stowRevealedSlots`); the page is blank flavour and PLAN 3.1 accepts this. No engine change.
- `cover_restored` and `bernie_vouched` after the burn come from Val's corridor challenge and Bernie's trust, unchanged by office life.

Carried to stage 5 (needs E6, SIMS-2, on main first; it is on `build/ol-sims`, in the integrator's train):
- Live checks not yet run: Val's catch (10.1 step 4), step 5, the 40 s mid-break variants, a break left to run with the player outside, the burned-not-cleared and not-told radio branches.
- The staff-room lighting loop and the room-tone listen; the per-cell earshot and cup-click dressing checks.
- The sprite keys change to `ernesto_bautista` and `hodan_warsame` when their art merges (`build/ol-m02-art`).
- Hodan stays busy about 100 s after a mid-exchange attack (engine-side, no wrong behaviour).

## Earlier: m02 office life: stage 4 round 1 fixes, handover 2026-11-15

Branch `build/ol-m02`, worktree `.claude/worktrees/p-ol-m02`. Stage 4 is built and live-checked in part (`STAGE4_LIVE.md`); round 1 of the dialogue and implementation reviews (`DIALOGUE_REVIEW_R1.md` 0/2/11, `IMPL_REVIEW_R1.md` 0/2/8) is fixed, with each finding's outcome in the review files. The dressing checks, the staff-room lighting loop and several live checks are still open (below), so not every part of PLAN section 3 is done.

## Round 1 fixes

- Dialogue M1, M2 and m1 to m9, m11 fixed; m10 wording fixed, its `takeable: false` deferred. Ernesto now asks "You with IT?" and the player answers it (local `VAR ernesto_told_security`, read back by his radio topic); both conversations show a small agenda (his pride at being needed, her stolen five minutes). Hodan has a topic once the cleared exchange was heard (`VAR heard_night_watch_cleared`). `#delivery:` on the six wary lines.
- Spoken lines against the 55 of the first build: 12 added, 12 changed (5 delivery-only), 0 removed; 67 in all (`SPOKEN_LINES.md`). Pool and exchange lines in `DIALOGUE_SAMPLE.md` unchanged; one other pool line changed ("cone" for "cup").
- Impl M1: cooler `useFrom { dx: 0, dy: 1 }` written explicitly, the measured default (no doorway problem was found live). M2: static dressing checks below; the rest is on the open list. m1 page x 6.45 to 6.92 (centred on the copier from the live screenshot), m3 noted below, m4 partly, m7 the cleared exchange also needs `insider_asset_arrested` and `night_security_supervisor_ko` false.
- Mapping 2 and an unloaded staff room: NPC mappings register as their room loads (`npc-lazy-loader.js` `loadNPCsForRoom`); `fireOnlyWhenLoaded` is a validator opt-out only. IT's only connection is the staff room, so in play it has always loaded; only a harness that starts in IT hits this, and mapping 1 covers it on the next entry (the burn exchange is first in the list). No data or engine change; noted in an ERB comment.

## Static check results (after round 1)

- Ink compiled with inklecate, no warnings. Validator `--no-graph`: 0 errors, 31 warnings (unchanged). `lock_key_diff.rb` against `baseline_locks.json`: empty, exit 0. dialoguelint: nothing in the two new files. inkcheck and loopcheck at `start`: clean for both stories in the default, `night_staff_attacked`, `heard_night_watch_burned`, burned plus `heard_night_watch_cleared`, and burned plus `ernesto_told_security` states. reopencheck m02: 0 problems. tagdiff against the pre-edit snapshot: the structure changes listed in `DIALOGUE_REVIEW_R1.md` Outcomes, nothing else.
- V8 note (impl m3): V8 prints `office-life onceOnly 2/10` because it counts office-life mappings only (Gary's print, Ernesto's burn break). The full new `onceOnly` cost is 7 (plus HaX's five attack and KO mappings), as planned. Later missions should not read 2/10 as the whole cost.

## Dressing checks (PLAN 3), static part

Coordinates are live world pixels (room-local y = live y + 256, from the cooler's sprite against its measured position).

- Doorway cells: boiler approach (164, -132) and second user (196, -132), cooler (276, -12) and (244, -12), microwave (228, -132). Nearest doorway first floor cell to any of them is the east (260, -172), 51 px from the microwave cell and 76 px from the boiler's second user; the cooler cells are 192 px or more from the south doorway. None within one tile. The posts (Ernesto about (223, 155) room-local, Hodan about (134, 195)) are clear of the x 52 line between the south and north doorways.
- Earshot: live, one pool line from each speaker at every doorway for both objects (8 of 8). Every floor cell not checked.
- Second user reachable: live, 13 of 13 breaks with both `using` and no `no_beside_cell`. Path search from both posts not run.
- Free cups: none of the three new staff-room objects is a cup type, so none claims `office-misc-cup`, `office-misc-cup3` or `mugs_tray1`. Clicking each with both seated, and with the porter hostile, is open.
- Clues with the pair at the counter: the handover board claims the rota board (room-local x 68 to 98, y 29 to 50) and the noticeboard notes claim `notice_board1` (214 to 256, 21 to 52); the snag list takes the first free `notes6`, at x 236 to 250, y 36 to 54, right above the microwave cell (228, 124 room-local). With a 64 px frame the microwave user's head reaches about y 60, so the sprites do not overlap on paper, but the gap is 6 px: this is the plan's named risk and the first live check to run. The laptop (93, 127 to 145) and lanyard (84, 211 to 227) are far from the counter.
- Sprites hidden by a declaration and the room snapshot: not run (`tools/playtest/room-snapshot.mjs` needs a live load).

## Round 2 fixes (2026-11-15)

`STAGE4_REVIEW_R2.md` (0/0/5 dialogue, 0/0/2 implementation) fixed, outcomes in that file: D1 to D5 in both inks (Ernesto's cleared radio topic, first-meeting guards on both greetings, Hodan's wet floor said once, the "miles" reply, her quiet-seeker read-back), I1 in the cleared exchange gate, I2 closed by the live check (snag list clear, 80 px sprite, game 5204). Spoken lines: 71 clips (4 added, 3 changed). Static checks all clean; no lock or key change.

R2b oddity, not explained by data: after a mid-exchange attack (`STAGE4_LIVE_R2b.md`, game 5211) the exchange was cut at line 2 of 5 (`pair_ended`) but the domestic stayed busy for over 90 s and sat 102 s after the hit, against about 60 s for a normal break. Nothing in her NPC record, the mappings or the exchange gates explains it; the use does not shorten when the exchange is cut, so the hold on the use is the place to read (`_finishExchange` in the needs engine). No wrong behaviour followed, and it is an engine question, so no change was made here.

## Open (next agent)

Items 1 to 4 and 6 to 8 carry over from round 1; item 5 is replaced.

1. Live: the handover board, noticeboard, laptop and lanyard each open their object with both NPCs `using` the boiler and the porter at the microwave (the snag list is proven, R2a 5204); the three cups clickable with both seated and with the porter hostile; `room-snapshot.mjs` before and after; `playerHears` from every floor cell at both objects; path search to the second-user cells from both posts.
2. The staff-room lighting loop (`mission-room-lighting`), then the room-tone listen (impl m2).
3. Live screenshot of the page at x 6.92 on the copier (R2a covered the microwave beside the snag list only).
4. Still unproven from R2a and R2b: `STAGE4_LIVE.md` 10.2 and 10.4 items not run; step 4 regression (Val's catch), steps 5 (cut-off timing above), 12 and Val; the whole-room walkthrough counts; the Kim and cooler crossings at the plan's five tries; the reload after an attack with the staff room loaded; the gap between the HaX strike text and KO text for a fast four-punch knock-out (impl m6).
5. Live proof of the round 2 ink: reload then talk to each NPC (no replayed greeting, a re-entry line plays); Ernesto's radio topic on all four branches (burned or cleared, told security or not); Hodan's cleared topic; the quiet-seeker re-entry; the cleared exchange does not play after Graham escapes or the press-terminal ambush. Playtest this on a keyless server.
6. Fault log `takeable: false` (dialogue m10): decide after a live print check.
7. For the rollout: the struck-only credits line hides a second victim (impl m5); V10 is still on `build/ol-sims` (impl m8, for the V10 owner).
8. Voicing waits for the user: 71 clips now.

## Files (round 1)

`scenario.json.erb`, `ink/m02_npc_ernesto_bautista.ink` and `.json`, `ink/m02_npc_hodan_warsame.ink` and `.json`, and in this folder `SPOKEN_LINES.md`, `DIALOGUE_REVIEW_R1.md`, `IMPL_REVIEW_R1.md`, this file.

# m02 office life: stage 4 (implementation), handover 2026-11-15 (superseded by the section above)

Branch `build/ol-m02`, worktree `.claude/worktrees/p-ol-m02`. Every slice of PLAN.md draft 8 was built; the dressing checks and the lighting loop were not (see the section above). The live checks have since run in part (`STAGE4_LIVE.md`).

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
