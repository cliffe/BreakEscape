# m07 office life: handover (plan phase done, five review rounds)

Branch `plan/ol-m07`, worktree `.claude/worktrees/p-ol-m07`. Nothing built. Plan review loop finished at R5 with no blocker or major open.

## Done

- Stage 0 baseline: `BASELINE.md`, `validator_info_lines.txt`, `v1_summary_base.txt`, `baseline_locks.json`, `positions_base.txt` (V6: 0 clips).
- `ANALYSIS.md`, `PLAN.md` (rewritten after R1), `QUESTIONS.md` (picks for AC0 at the top: Adaeze Okafor, Gwen Pritchard).
- R1 (planning tier): B1 M3 m7, all fixed in the rewrite (`REVIEW_R1.md`).
- R2 (planning tier): B0 M3 m5 (`REVIEW_R2.md`), applied.
- R3 (planning tier, full): B0 M3 m1 (`REVIEW_R3.md`), applied: real jitter mechanism, coupled row sets thirst 30, cooldown cut, m05 `hub_quiet` guard, ink-local keys in the sync budget.
- R4 (delta): B0 M0 m2 (`REVIEW_R4.md`), applied: coupled cooldown 10000, 50-seed order check over three paths.
- R5 (delta): B0 M0 m2 (`REVIEW_R5.md`), applied: two text corrections.

## Next

1. AC0 answers QUESTIONS.md Q1 to Q4 (and the cast clash check).
2. Then the build stage: `DIALOGUE_SAMPLE.md` for approval before slice 5, then slices per PLAN.md.

## Decisions taken (log for the user)

- Cast: AC0 excluded the Office Life Tour cast, Lerato, Tomasz, Darren, Ibrahim, Joanne; every free man's voice clashes in m07 (Iapetus, Rasalgethi, Sadaltager), Lorna is facilities (6/6 clear), so two women.
- B1: the handover sheet says the coffee machine is broken (`scenario.json.erb:1904`), so the pair use the cooler only; the coffee station stays undeclared decor.

## Gotchas

- The Write tool refuses `.md` files in a subagent; write plan files with a shell heredoc.
- Do not stage `dungeon_graph.*`. Commit with `git commit -m ... -- <paths>` after `git diff --cached --stat`.

---

# Slice 3 build handover (2026-11-17)

Branch build/ol-m07, commit c36090d54.

## Done
- scenario.json.erb: officePresets; adaeze_okafor and gwen_pritchard in operations_floor (seated, needsHome, needsRooms, thirst, group ops_floor, leash, globalVarOnKO adaeze_ko/gwen_ko, pools, talk breaks, coupled break on Gwen, three hides each); ops_cooler declared (water_cooler, offWhen ops_staff_upset, useSeconds 22, overhearRadius 360, useFrom dx 0 dy -1 PLACEHOLDER); affordance false on ops_floor_workstation; trouble rows and two hands-down rows appended on agent_0x99; two credits lines after Park; five globals.
- Static checks pass (BUILD_LOG.md).

## Not done
- Exchanges unwired: four lines over 40 chars (BUILD_LOG.md has the block and options). Needs the user's call on shortened text (ink and SPOKEN_LINES change), then re-compile ink.
- All measurements: chair body-centre cells (positions 2,5 and 4,5 are estimates), useFrom plus engine second cell and routes, needs clock ratio, first trip 45 to 120 s (tune initial), use and walk-home over five tries, 50-seed manual-clock order test, no no_beside_cell over five trips.
- Live checks L1, L2, L5, L6, L8, 10.3, 10.4 and LIVE_SLICE3.md. No server started; nothing running.

## Gotchas
- I ran `git checkout -- dungeon_graph.html` once to clear a generated file (rule slip); dungeon_graph.md is modified and unstaged: never stage it.
- Write .md with heredocs. node_modules is a symlink or dir already in the worktree (untracked, do not stage).

---

# Slice 3 continuation handover (2026-11-17, second agent stopped at context limit)

Branch build/ol-m07. Commit e1bccce0e (step 1) plus the commit that adds this note. Server on :3098 stopped (PID 1940844); nothing is running. Do not reuse any game id below.

## Step 1 done (e1bccce0e)
- Four exchange lines shortened in ink, SPOKEN_LINES.md (counts 38, 31, 39, 39) and DIALOGUE_SAMPLE.md; ink recompiled; exchanges block wired in adaeze_okafor (ERB comment removed).
- `server_hall_reached` confirmed: set by HaX's `room_entered:server_room` mapping (scenario.json.erb ~:1136), declared false at :2689, so the exchanges' `server_hall_reached: false` gate holds until the first server-room entry.
- Validator 0 errors, 31 warnings (baseline 30 plus the two V4 attack-mid-walk notes already justified). Lock/key diff empty.
- dialoguelint shows one L1 delivery-note on both operator files (control tag `#exit_conversation` inside the hub's conditional). Same finding on m05's Thandiwe file, which is the model; not a voiced-line problem.

## Step 2 partial (measured live, game 7649, a few runs; 7654 started and stopped)
- Chair body-centre cells CONFIRMED, estimates correct: Gwen body centre local (64,160) = tile (2,5); Adaeze (128,160) = tile (4,5). Both visibly seated on the chairs in a screenshot. No change to `position` or `needsHome`.
- Cooler: Tiled sprite claimed (one cooler, local top-left (60,253), 24x47). With `useFrom` dx 0, dy -1: Adaeze uses from local body-centre (82,244) (tile about 2.6, 7.6); Gwen (engine second cell, east side) at about (114,244). Both walkable. Both pairs reached `using` together; no `no_beside_cell` in the one forced trip. Screenshot (both using, bubble "Cooler's the only thing working, mind.") shows both clear of the key and the desk; Adaeze's cell lies within the grey chair (local 52..92 x 219..259) footprint rectangle, which was not visibly drawn as a chair in the shot (check this in a render with both seated: the chair near the cooler may be the empty (60,258) chair; if it shows, take PLAN section 3 fallback 1).
- One forced trip (Adaeze thirst set to 20, Gwen coupled): Adaeze left at t=42 ticks, using 12 s later, away about 36 s, Gwen followed 8 s after Adaeze started using (coupled row at 2 s delay plus walk), Adaeze before Gwen. Use 22 s each, about 37 s home to home for Adaeze.
- Initial thirst seen in 7649: Adaeze 48.68 (45 +8.2%), Gwen 64.53 (60 +7.5%). Jitter seed may be per scenario (check across 7654 and later fresh games; if identical, the first-trip time is deterministic).

## Step 2 still to do
1. Needs-clock ratio and first natural trip (45 to 120 s after room load): run `tools/playtest/m07-ol-first.mjs <gid> 3098` on three fresh games (script prints first-trip time since entering the room, initial levels and the ratio). At ratio about 1 Adaeze at 48.68 goes urgent at 1.87 min = 112 s: too close to 120. Likely retune Adaeze `initial` down (about 42) and keep Gwen's gap (about 57), then re-measure. Edit scenario.json.erb thirst initial for both, validator, commit, then re-test with fresh games.
2. Use and walk-home times, five tries (m07-ol-trip.mjs, one try per run, fresh game each); expectedAwayMs not needed (no laptop lock here).
3. 50-seed manual-clock order test over the three PLAN 2.4 paths (setSeed then setManualClock(true), step; Adaeze urgent before Gwen). Manual clock only here.
4. No `no_beside_cell` across five trips (the trip script prints the needs log).
5. Record all in BUILD_LOG.md (not yet written).

## Step 3 not started
L1, L2, L3, L4, L5, L6, L8, reload 10.3, attack probe 10.4, then LIVE_SLICE3.md. L6 needs a server-room entry: get a badge legitimately (shift handover sheet, Contractor Badge Station PIN 0616 at the checkpoint, or Hollis route); never set globals in the page.

## Probes (committed)
tools/playtest/m07-ol-{ng.sh,dump,seat,trip,first}.mjs. Run: `tools/playtest/m07-ol-ng.sh` prints GAME_ID and FLAGS_XML (PLAYTEST_PORT=3098 baked in). Probes use `m01-ol-lib.mjs` (headless Playwright, setFPS(20), fixed steps). They park the player at world (520,248) clear of the cooler lanes and enter via `__test.enterRoom('operations_floor')`.

## Slips to note
- Game 7649 was reused for four exploratory measurement runs (rule says fresh game each); later runs use fresh ids.
- My own `pgrep -f` pattern matched its own shell and killed the shell once (no other process hit). Stop servers by the PID only.
- Server start command, keyless confirmed: measurement-recipes section 1, port 3098, pid file tmp/server-3098.pid.
