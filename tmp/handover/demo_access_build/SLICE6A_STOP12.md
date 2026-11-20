# Slice 6A stop 12: "open session" on Thandiwe's laptop

## Cause

Not an engine fault. The rota works; the walker looked too late.

- Reading the rota sets Thandiwe's and Yasmin's caffeine to 10 (scenario.json.erb eventMappings on `Coffee rota`). Both get a coffee job to `coffee_station_open_plan` (7.0, 1.4), which registers because it sits in the loaded open plan room. Needs state at runtime: `job.targetId = coffee_station_open_plan`, phase goto_target, using, then `returned_post`. No `parked`, no `no_source`.
- The away window was about 36 s of game time (walk 6 s, brew `useSeconds` 30, walk back). In the walker's runs (s6q_7558.jsonl seq 282 to 308, s6b_7537.jsonl seq 83 to 89) 20 or more brief/room calls sat between the rota and the first laptop interact, so she was back at her post. The s6b log shows it: `arrival` / `returned_post` at t=518/519 and caffeine 79 (a fresh coffee) when the walker first read her state at clock 185 s. The "stood still at (122,-150)" is her post (home 124,-148); "is using this PC" is correct once she is back (`pcUserAt`, unlock-system.js:544, ownerPresent in workstation-state.js:676 needs atPost and available).
- The `owner_away` globals (workstation-state.js:292, 534) were set when she left, as designed, and cleared on return.
- `npc_left_post` firing at the cake drop in 7537 was Yasmin's and Thandiwe's earlier coffee trips, not a stuck NPC.

## Fix (scenarios/demo_access_tour/scenario.json.erb, commit 6fd6b14f6)

Open-plan coffee station: `useSeconds` 30 to 60, queue `maxWaitSeconds` 90 to 150 (Yasmin queues behind Thandiwe). The window is now about a minute. No engine change, so no unit test or bin/test-js run was needed. The laptop-as-desk-tableItem idea (SLICE6A_ISSUES.md issue 2) was not needed for this and is untouched.

## Live proof (own keyless server :3097, headless, setFPS(20), fixed steps on; games 7568 old scenario, 7573 fixed scenario)

- 7568 (after kit, Lorna's cloner read and comms cupboard, then rota): Thandiwe left, laptop interact right after the rota opened her signed-in session ("You're on Thandiwe Moyo's open screen"), `done_t_open_session` and `thandiwe_laptop_accessed` set. She came back later (`returned_post`, caffeine 79). Yasmin's PC then opened to a locked sign-in with her post-it (as designed for stop 13), no "is using this PC".
- 7573 (fresh, fixed scenario, rota then laptop at once): session opened, t_open_session done. Away from job_start t=109 to returned_post t=376 (267 ticks, 67 s). Log: s6stop12_7573.jsonl. Her return logged `caught_at_post`.
- Cake: dropped in open plan in 7573 with Thandiwe's hunger set to 50 (test step, as the probe does): she walked to the cake, ate it, servings 2 to 1; Yasmin then went to it.
- Screenshots: tmp/handover/demo_access_build/screens6/stop12/ (01_session_open, 02_yasmin_pc, 03_fixed_session_open).

## Cake probe

The scratch probe's case 2 dropped the cake in reception (the player starts there), so open-plan staff never knew of it: `walked:false`. Hunger 60 is also exactly the top of the tempt band (urgentAt 30 + tempt 30), so they must know of it. Added an enterRoom(open_plan) before the drop in a local copy; that run then stalled at "wait 22s (before reload)" like the earlier one (reload hang, not diagnosed, AC4's area), so the cake was checked directly instead (above).

## Tests

demo_access_tour_{devices,tasks,}_test.rb: 77 runs, 0 failures (under flock). Validator --no-graph: 0 errors, 10 warnings.

## Advice for walkers

After the rota, `moveToNear thandiwe_laptop` and `interact` at once; skip brief/room polling. Optionally Ama's timed hint (scenario line ~591) could add "then go straight to her laptop"; left alone because the ink fixer owns that thread.
