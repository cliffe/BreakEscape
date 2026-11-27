# m03 office life: stage 1 checks

Branch build/ol-m03, main merged (df8772d17 and after). Keyless server on :3091, headless Chromium, `setFPS(20)` with fixed steps on; game time matched wall time to within 3 ms over each trip. Measured in a scratch copy of m03 (`scenarios/zz_m03_stage1_scratch`, uncommitted, never in the m03 scenario) with stand-in objects and the two NPCs as the plan describes them (real Zainab and Yusuf atlases). Games 6454 to 6458 (a), 6460 to 6465 (coffee), 6466 to 6480 (cooler), made with `swap-scenario-game.rb` on host mission test_needs_sims.

## Dependencies

build/ol-chatter and build/ol-hidden-hostiles are both on main (Train 117, main df8772d17, checked with `git merge-base --is-ancestor`). build/ol-pose-art is on main too. Trips below were measured before the chatter merge; chatter muting does not touch walks.

## (a) First-frame room_entered

Yes. A mapping on an NPC in the start room (`room_entered:reception_lobby`) fired on the first-frame event (`previousRoom: null`, `firstVisit: true`) in 5 of 5 fresh games, at needs clock 0 to 250 ms, before any input. Both NPCs were registered by then. Gotcha: the condition `data.previousRoom == null` did NOT fire; `data.previousRoom === null` did. Write the plan's hide mapping 4 with `===`. Not tested: an NPC in a room that has not loaded (m02 found those are not registered).

## (b) Trips, five tries each

Away = `npc_left_post` to `npc_returned_post`, game seconds. Triggers as in plan section 3 (Ffion conversation closed; player out to the hallway and back; player parked at Ffion's approach cell). `expectedAwayMs` is the engine estimate in the `npc_left_post` payload.

| Trip | expectedAwayMs | real away, 5 tries | mean |
|---|---|---|---|
| Zainab coffee (reception) | 14.6 s | 17.5, 17.25, 17.25, 17.5, 18.5 | 17.6 s |
| Yusuf coffee | 15.7 s | 16.0, 16.0, 16.0, 19.75, 16.0 | 16.8 s |
| Zainab cooler (hallway) | 23.1 s | 54.0, 28.75, 54.0, 28.75, 28.5 | 38.8 s (two clusters) |
| Yusuf cooler | 24.1 s | 36.5, 37.0, 36.5, 37.5, 36.75 | 36.9 s |

Other figures: Zainab leaves her post 14.0 to 15.5 s after load / trigger; the coffee pair start using 1.25 to 2.75 s after leaving; Yusuf leaves 2 to 3 s after the Ffion close. At the cooler Zainab starts using 5 s after leaving and Yusuf 17.3 to 17.8 s after leaving (he waits behind her, not a failure). No `npc_job_failed` in 10 of 10 trips, and both staff returned to posts each time. Both were seated on the sofa and club chair at load (sit frames from ol-pose-art are in), so the "stands at post" caveat in the plan no longer applies.

Not done: a doorway-clearance analysis of the lanes. Position samples (every 400 ms) are saved in the scratch output only; the first look shows no job failures, but cell-by-cell clearance of the reception to hallway doorway is still open for slice 3. Zainab's 54 s cooler return (2 of 5) against 28.5 s (3 of 5) was not investigated; she came back after Yusuf in the long runs.

## Plan assumptions broken

1. Section 4 sets `lockIfAwayOverSeconds: 45`. The engine compares `expectedAwayMs`, not real time (`decideLocked`, `workstation-state.js:157`), and the estimate is 14.6 s (coffee) and 23.1 s (cooler). With 45 the cooler trip leaves the laptop open. The threshold must sit between them, about 20 s, and real cooler absence is 28 to 54 s so it is safe.
2. Section 4 wants the open window at least 20 s from the coffee chat. Zainab's coffee trip lasts 17.25 to 18.5 s, so it falls short; raise that station's use time for her object, or relax the target.
3. Section 3 says natural coffee is 6 to 9 minutes in and mapped breaks start after the briefing; measured, the mapped trips begin 11 to 15 s after the trigger, so they land inside Ffion's conversation aftermath and the player-at-Ffion lane held.
4. Section 2 (hide mapping 4 condition style) needs `=== null` style, see (a). Plan section 11 and 12 dependency note is now satisfied.
