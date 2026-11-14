# Office life sims showcase: handover

## Lead's state, 2026-11-14, third lead (read this first)

Branch `build/ol-sims`, worktree `p-ol-sims`, tip after 78b0b8fc5. Main merged up to 896ec3cd8
(E7 to E9 chatter, phish A to C, ScenarioBinding); **main e1303fc0c (format step 6a-1 part 1, schema
marks in `scripts/scenario-schema.json` plus tests) is not yet merged**; expect at most a schema
conflict. No sub-agent is running. No server is listening on 3093 to 3095. Worktrees: `p-ol-sims`
(the branch); `p-ol-sims5` (detached at ed0a5cd1f, a clean copy used only for SIMS-5 live runs so they
did not see another agent's uncommitted edits; move it to the tip or remove it); `p-ol-sims2` (fully
contained, no further work).

Integrator decision applied (3f4068967): the three dead `cooler` pools on test_needs_sims became
Amara's and Tom's own `coffee` pools; Marek's was dropped; Amara's "Lovely and cold, this." became
"Lovely and hot, this." to fit coffee. The V10 test pins `[]` for test_needs_sims.

Slice status (B/M/m per round, all fixed unless said):
- SIMS-1, SIMS-2: done, 0/0/0.
- SIMS-3: R4 (light, design and server) 0/1/1 (`asked_now` reset in `hub`; the bare-setGlobal sync
  wording); R5 (inside the SIMS-4 R3 design review) 0/0/0. **Closed.**
- SIMS-4: R2 design 0/2/4 (crossing counts measured the first-visit exchange; the job-cleared beat
  contradicted what is seen; m3, the faint flicker, withdrawn as an owner call), server 0/0/1. M2 fix:
  Jodie gains an `upkeep` need met only by new staff lockers; once `exchange_job_called` is heard she
  walks there after her break, and finishing sets `job_cleared`, ticks `see_light_fixed` and steadies
  the light. R3 design 0/0/5, server 0/0/1, fixed in 248293e6e. **Closed.** Proof-tool fixes: the 4570
  miss was a probe race (`talkNeil` fell back to a clock when no `conversation_closed:neil` arrived);
  it now needs the real event, retries once, else exits 3 as a setup failure.
  Counts with E7 to E9 in (games in the build log): job beat 5/5; boiler crossing 5/5, 3 staff lines
  heard each; cooler crossing 5/5, 2 heard each; none spent unheard. The speech-lock beat is
  re-scoped (E7 removed what it measured): game 4932, 66 office turns, 0 blocked, 0 staff lines
  spent. The original 16-minute rerun (4604, 4644) only reached 2 office turns, hence the re-scope.
- SIMS-5 (V10): R1 code review 1/3/5 (grumble rule did not mirror the engine; office topics with no
  object or magnet passed; colleague-phone rules; announce rule), all fixed in 248293e6e, **not yet
  re-reviewed**. V10 then flagged five dead own `grumble` pools (amara, tom, grace, rosa, marek);
  all five removed. Corpus run, 180 files: no error, no V10 warning. Node set 658/658.
  **Live proof, partial:** office beats in games 4646, 4687, 4702, 4705, 4935: spoken and heard were
  scenario coffee and cooler, grumble, news_cake, cake, Tom's phone pool, `grumble_off` (4935),
  exchanges tom_parcel and rosa_rota, calls supplier and take_message. Fixtures (scratch folders, now
  in tmp/delete/) 4668 to 4674: all seven warned pools stayed silent for 10 minutes while each control
  pool spoke. Still open: `grumble_gone`, `grumble_printer_off`, `phone_message`, Amara's own coffee
  line seen as hers, the 20-minute staff-room count in earshot and 10 minutes out of earshot. The
  fixtures predate the 248293e6e rule changes; rerun any whose warning changed.
  Gotcha: the coffee and copier sockets open a confirm dialog; click "Switch off". Escape cancels it,
  and the global does not change (the first SIMS-5 runs fell into this). Scripts and notes:
  scratchpad `officelife-sims/s5-full/` and `s5-full2/` (HANDOVER.md in each, lib.mjs has the toggle
  helper).

Owner items (build log tables): E-carry-422 (game 4558, `remove_object office_mugs` 422 in the
kitchen); Neil's page click hitting the copier (SIMS-3 pick overlap); E-reload-ko-pos (a KO saves only
`isKO`/`currentHP`, not position); the faint staff-room flicker (a 90 ms dip on one panel, hard to see
at game zoom). Art: a stepladder or tube-swap pose for Jodie; a tube or toolbox icon for `upkeep`
(stand-in `icon:npc-work`); the earlier list below stands.

Spoken lines this session (no audio exists for the showcase yet): Amara 1 changed; Marek 1 cooler line
removed; five own grumble lines removed (one each: Amara, Tom, Grace, Rosa, Marek); Jodie 3 new then
2 reworded at R3; Keith 2 changed. The build log sections "SIMS-4 R2 and SIMS-3 R4 review fixes" and
"SIMS-5 R1 and SIMS-4 R3 review fixes" list the text.

Next, in order:
1. Merge main e1303fc0c; rerun `bin/test-js` and the validator on test_needs_sims.
2. Finish the SIMS-5 live proof above (port 3095, keyless), from a worktree at the tip.
3. SIMS-5 R2: a code reviewer and a design reviewer with live proof; fix; a third round only if R2
   has a blocker or major (stop rule: at least two rounds, stop once one is clean of both).
4. README SIMS-5 rows, build log and this handover.

## Second lead's state, 2026-11-14 (superseded above)

Branch `build/ol-sims` (worktree `p-ol-sims`, tip after 1d7025a5d): SIMS-1 to SIMS-5, with
build/ol-sims-2 (SIMS-4) merged in at 5118f584d and main 768f8d09c merged at bf6d89338.
build/ol-sims-2 is now fully contained; no further work goes there. `proto/ol-e7-e9` untouched.
No server left running on 3093-3095.

Slice status (B/M/m per round):
- SIMS-1, SIMS-2: done, 0/0/0.
- SIMS-3: R1 and R2 as before; R3 design 0/1/6, server 0/0/3; all fixed (8e1df6c3f, eecf7e424:
  reload story rewritten across docs, four-branch ready line, re-entry line and
  `reopenRefreshesHub`, light choice gated on `staff_room_seen`); copier/page pick overlap is an
  owner item. Not re-reviewed after the R3 fixes (they changed neil.ink and Neil's data, so one more
  round is advisable).
- SIMS-4: merged; Jodie's thirst 85 to 90 (plan step-1 rule); schedule rerun 4434 PASS within 3 s.
  R1 design 1/3/5, server 0/0/2; all fixed (65b7cc43d, 933661ca5, 1665f412a: ink exits, staff-room
  flicker via lighting variants, node tests, proof-tool rewrite). Reruns: job beat 6/6, boiler 9/10
  from the close (4570 unexplained miss, possibly the R3 neil.ink edits landing mid-run), cooler
  10/10. **Open:** the doors-open speech-lock rerun (game 4546 hit the driver's 600 s timeout; raise
  `timeout` in scratchpad `s4_driver.sh` above 16 min and rerun), a look at 4570, then **SIMS-4
  review round 2** (opus55 design with live proof, opus48 server).
- SIMS-5 (V10): built (d2f14c431, 0604c49d7): `scripts/validate_office_life.rb`, one line in
  validate_scenario.rb, `test/js/validator-office-life-v10.test.mjs` (12 cases). V10 warns 3 on
  test_needs_sims (amara/tom/marek own `cooler` pools nothing can trigger; likely a content slip,
  pinned not edited), 0 elsewhere. Focused live proof game 4524. **Open:** the full 5.5 live proof
  (README office beats with levers, the 20-minute staff-room `_pickBark` count, 10-minute scratch
  fixture runs), the content-slip decision, then **two review rounds**.
- Owner items added: E-carry-422 (game 4558, `remove_object office_mugs` 422 in the kitchen),
  SIMS-3 copier/page pick overlap; earlier ones stand.

Next, in order: speech-lock rerun and 4570; SIMS-4 R2; SIMS-3 R4 (light, on the R3 fixes);
SIMS-5 full proof, fix the pinned cooler pools if the owner agrees, two review rounds.

## First lead's state, 2026-11-14 (superseded above)

Branches and worktrees:
- `build/ol-sims` (worktree `p-ol-sims`, tip 98ddacd14 or later): SIMS-1 to SIMS-3 with both review
  rounds and fixes; main d69c29089 merged.
- `build/ol-sims-2` (worktree `p-ol-sims2`): SIMS-4 (5c1447beb, 033d90227 and proof-tool commits up to
  174b094e0). Not yet merged into build/ol-sims; expect a `neil.ink` conflict around the hub (SIMS-3's
  ask/ready/exit rework against SIMS-4's flickering-light choice) and README/build-log conflicts.
- `proto/ol-e7-e9` (worktree `p-ol-e7e9`): E7, E8, E9 prototypes (09f3fe0b8, 512d51caf, 7850759d1) and
  the approval note as build plan section 10 (3a32d7708). Never merge without the owner's decision.

Slice status (B/M/m open after the last round):
- SIMS-1: 2 design + 2 server rounds; all findings fixed; 0/0/0 open. Owner items in the build log.
- SIMS-2: 2 + 2 rounds; R2 design minors fixed (docs); 0/0/0 open. Includes the offWhen copy fix.
- SIMS-3: 2 + 2 rounds; R2 findings fixed in 98ddacd14's batch, not re-reviewed (a third round is
  optional).
- SIMS-4: built, first_visit/job_beat/cooler_cross proved; the full counts, the 20-minute schedule
  run (game 4360) and the speech-lock count (game 4369) ran detached from a stopped agent. Collect them
  with `python3 <scratchpad>/officelife-sims/s4/finish/aggregate.py` and the two report-sr-*.json files
  (see `OFFICE_LIFE_SIMS_HANDOVER_SIMS4.md` on build/ol-sims-2), update README and build log, then
  two review rounds (design with live proof; server/sync).
  Collected by the lead after the runs finished: step 1 first visit 5/5; step 2 job beat 5/5
  (games 4376-4383); step 3 boiler crossings pair 10/10, line heard 10/10, overlap 27.5 s (games
  4384-4401); step 4 cooler crossings pair 10/10, line heard 10/10, overlap 21.2 s (games 4402-4428);
  both returned and sat after every break; 0 setup failures. Speech lock (game 4369, 15 min): 0 of 6
  office chat turns blocked by an unheard staff-room line (small sample), 13 of 13 staff pool lines
  spent unheard (E7). Schedule run (game 4360): use starts recorded, not yet compared with the README's
  computed times. Still to do: that comparison, the README and build-log rows, then the reviews.
- SIMS-5 (validator V10): not started.

Next, in order: collect SIMS-4's results and fix anything they show; merge build/ol-sims-2 into
build/ol-sims (resolve neil.ink by hand, recompile, rerun the Neil and staff-room proofs once);
SIMS-4 reviews and fixes; SIMS-5 build, proof and two review rounds. Ports 3093-3095.

Branch `build/ol-sims`, worktree `.claude/worktrees/p-ol-sims`, merged with main 5edb17541 (format 3).
Ports for this work: 3093-3095 only. No server is left running.

## Where things stand

- **Plan:** `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md`, five review rounds folded in. It
  opens with the audit ("What exists"), then the showcase (seven rooms, 13 NPCs), the slices in
  build order, the README tour, open questions, and "Notes for the missions plan" (three changes the
  m02 pilot plan should take; not applied to that branch).
- **Reviews:** `OFFICE_LIFE_SIMS_BUILD_PLAN_REVIEW_R<n>_DESIGN.md` and `_SERVER.md` in the same folder.

| Round | Design | Server, sync, cheat | Total |
|---|---|---|---|
| 1 | B3 / M11 / m11 | B0 / M1 / m4 | B3 / M12 / m15 |
| 2 | B1 / M8 / m10 | B0 / M1 / m2 | B1 / M9 / m12 |
| 3 | B1 / M11 / m10 | B0 / M1 / m1 | B1 / M12 / m11 |
| 4 | B0 / M2 / m18 | B0 / M0 / m2 | B0 / M2 / m20 |
| 5 | B0 / M5 / m12 (slices 1-5: B0 / M4 / m10) | not run (R4 had no majors) | B0 / M5 / m12 |

Round 5's findings are folded in (6df5b29bb) and have not yet been reviewed. Round 3 grew the
scope, so its counts rose; rounds 4 and 5 found only faults that would break a proof, none that
would break the build.

## Slice SIMS-1 (test_needs_attack, attack and knockout probe): live proof complete

No engine change. Validator clean (0 errors, 4 intended structural warnings);
`test/js/npc-needs-attack-scenario.test.mjs` and `test/js/npc-needs.test.mjs` pass. Games are made
with `swap-scenario-game.rb test_needs_sims test_needs_attack --unlock-all` (no Mission row for the
folder; db seeding is not allowed), a fresh game per KO/reload beat, on a worktree keyless server on
:3093.

**All ten beats proved live** (see `scenarios/test_needs_attack/README.md` live-proof table):
a 4145, b 4144, c 4120, d 4131, e 4126, f 4121, g 4122, h 4123, i 4128, i2 4124. KO drops checked
against the server's `room_states.<room>.objects_added` (b: `ava_folder@kitchen`; c:
`ben_notebook@kitchen`). Tasks ticked by real interactions (real Meeting Note read, Eli's chat opened
and closed in its UI). Screenshots and `report-<beat>-<game>.json` in scratchpad `officelife-sims/s1/`.

- **Scenario fix:** `ava_pc` had `affordance.accepts: ["dirty_mugs"]`, so (being Ava's home object)
  the carry preferred her own desk and she never left the office. Set to `affordance: {}` so the
  kitchen tray is the only accept target, per plan intent.
- **Engine fault (E-carry):** cross-room carry is intermittent — on some seeds Ava's carry fails in
  `goto_item`/`_failJob` (npc-needs.js:3490; `_moveForPhase` 3076-3112, own-post short-circuit 3110)
  and she never leaves her post; on others it runs cleanly (4144, 4145). Behaviours still provable
  with retries. Raise as its own engine slice (the OLMP in-room fallback until fixed).
- **completeTask settled (not an engine fault):** a real interaction ticks it (check_called_home
  4131; check_eli_page 4128). The game-4014 miss was a probe artifact — the synthetic emits ran the
  mapping's synchronous side effects but the probe sampled before the fire-and-forget async
  `completeTask` (npc-manager.js:1462-1472 → objectives-manager.js:655 → server complete_task!
  game.rb:3757; `custom` tasks need no server validation) had resolved.

**Next:** two review rounds on the slice with live proof.

## Slice SIMS-2 (an arrival counts only where the NPC is, OLMP E6): engine fix + live proof

Branch `build/ol-sims-2` (from `build/ol-sims` a734d5f57), worktree `.claude/worktrees/p-ol-sims2`,
port 3094, scratch `officelife-sims/s2/`. Commit 11b563d51 (engine + node tests). Engine: every
needs move carries a `moveId`; `onArrived` checks distance (48 px) and the echoed id, re-issues a
far arrival once and fails the job on a second (returning re-issues once, never fails); own-post and
at-home synthetic arrivals bypass the checks, so `GOLDEN_SIMS_DAY` and the sims-day digest are
unchanged. Files: npc-needs.js, npc-behavior.js (NPCBehavior exported for the test), the stub world.
Node tests: SIMS-2 cases in `npc-needs.test.mjs`, new `npc-behavior-arrival.test.mjs`; full standard
node set green. Live proof tool `tools/playtest/needs-arrival-proof.mjs`. Reproduced via the stubbed
short path (30 natural runs did not repeat 3537 by chance, so the stub is the reproduction, as the
plan allows): legacy build uses `lounge_sofa` 164 px away in the office; fixed build logs
`arrival_far` and walks on (game 4178, `stub-legacy-4178.png`, `stub-fixed-4178.png`).
E-carry is a different cause (a never-firing arrival on a failed cross-room path), left for its own
slice. **Open:** the broad standard live set (test_needs_leash, lab_physical_pentest, test_access_work,
the README office beats, the kitchen cooler pair) per plan 5 still to run.

## Next slices (plan order)

SIMS-2 arrival check (the Grace "using lounge_sofa from the office" fault in baseline game 3537;
reproduce it before fixing), SIMS-3 Neil (fixed NPC with a declared mug, auto-print 6 s after a
conversation), SIMS-4 the staff-room pair with coupled breaks, SIMS-5 validator check V10. All
four prove m02 patterns. Then SIMS-6 to SIMS-9 (Leila and Nisha, the pizza, reception and vending,
private office). Schedules, traits, summon, refills and a visitor are in the backlog.

## For the user

- Art and sound requests (from the plan; no images generated): a vending coin sound; visemes for
  Jodie's and Siân's sprites; an optional manager character (a person of colour); a smoking-shelter
  map and props; backlog sprites (street door, desk bell, restock icon). Each has a stand-in.
- Open questions, with defaults, are in the plan's open-questions section (traits and schedules
  kept in the backlog, following the 2026-11-06 picks).
- Engine and server changes (SIMS-2, SIMS-5 and the vending preset data) are AGENTS.md approval
  items.

## Baseline

Game 3537 (before the merge), about 23 fps headless, six needs NPCs active, three tasks ticked in
two minutes. Screenshots `officelife-sims/base-*-3537.png` in the session scratchpad.
