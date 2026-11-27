# m04 office life: live proof 1

Keyless server on :3097 from this worktree, headless Chromium, `game.loop.setFPS(20)` with fixed steps on, a fresh game per check from `tools/playtest/new-game.rb`. No globals set in the page and no game row edited. Strikes use the real punch path (`window.playerCombat.attack`). Screenshots are in `screenshots/`.

Summary: checks 1, 2 and 3 pass; check 4 passes with two caveats (below); check 5 not run.

## Check 1 (L8): chat background is the room the newcomer stands in. PASS

| Case | Game | Steps | Observed | Screenshot |
|---|---|---|---|---|
| Ibrahim at the kettle | 7743 | clone Vance's card by the real route, SCADA room and back, wait for Ibrahim `using` at `ops_kettle` (body 210.2, 372), `moveToNear`, `interact` | person-chat opens with player room `operations_office`; background shows the ops office kitchenette (kettle, sink, microwave, filing cabinets, coat stand) | `screenshots/l8_ibrahim_kettle_chat.png` |
| Joanne seated in reception | 7746 | fresh game, `moveToNear` and `interact` on `joanne_pell` (seated, body 239, 250) | person-chat in `main_entrance`; background is the Albion reception wall (logo, notice board, defibrillator, cooler) | `screenshots/l8_joanne_pell_seated_reception_chat.png` |

Not run in this pass: a newcomer walking to the cooler, and the "trip resumes after the chat closes" half of L8.

## Check 2 (Q7): strike Ibrahim at the kettle, no KO. PASS, with one probe note

Game 7752 (a first run, 7747, stood too far away to test the follow; its numbers agree).

- Ibrahim `using` at body (207, 372). One punch: `ibrahim_diallo` hostile, not KO. At once `aes_staff_off` true and `ops_kettle_off` true. His needs mode goes to `idle`.
- Joanne: her body stayed at the sofa post (239, 250) before and after the strike (her needs state was `goto_target` at the strike and `idle` afterwards, so the sofa-ward return was not observable; she had not left). Probe note, not a bug.
- Player stayed in the ops office for 9 s at 44 to 66 px from him (inside his 160 px aggro): he stayed at his kettle cell (196.9, 372.7) and player HP stayed 100. He does not hit back. Screenshot `screenshots/q7_ibrahim_hostile_kettle.png`.
- Step into reception at the doorway (47.7, 211.4), 220 px from him: no movement (`screenshots/q7_reception_after_step.png`, game 7747 and 7752 alike).
- Then moved to (108, 243), about 137 px from his kettle cell: he followed into reception within 2.5 s, to (83.3, 286.1) and on to (101.1, 277), kept about 50 px from the player and hit for 4 damage per hit (HP 100 to 56 in about 25 s). So he does follow into reception once the player is within about 160 px. Screenshot `screenshots/q7_reception_near_kettle.png`.
- Reload (game 7752): at the first frames Ibrahim stands at his sofa cell (215, 250), hostile, not seated. Because the player spawns in reception 120 px away he then chases and settles at (169, 204) within about 5 s. `aes_staff_off` and `ops_kettle_off` still true, `ibrahim_ko` false. Screenshot `screenshots/q7_after_reload.png` (taken after the chase started).

## Check 3: KO Joanne at the kettle, reload. PASS

Game 7757. Joanne `using` at (239.8, 376.2). Punches until `isNPCKO`: `joanne_ko` true, `aes_staff_off` true, `ops_kettle_off` true. KO sprite (death frame `falling-back-death_north-east_frame_006`) at (207, 379), next to the ops office desk. Before-reload screenshot `screenshots/ko3_joanne_before_reload.png`.

Reload: `joanne_ko` true, still KO. Her sprite does not exist until the ops office loads (the player respawns in reception); after entering the ops office her sprite is at (207, 379) in the same death frame, the same place she fell. Screenshot `screenshots/ko3_joanne_after_reload.png`.

Probe artefact: the punches also turned Ibrahim hostile (not KO), because he stood within the punch arc beside her. After reload he is hostile in reception. Not a scenario finding.

## Check 4 (L6): evacuation by Vance in person. PASS with two caveats

Game 7801, created with `new-game.rb --set vance_is_ally=true --set anomaly_detected=true`. The seed is a creation-time head start (the ally and anomaly routes are long and not under test here); Vance's card was still cloned in play and the evacuation was chosen in his chat ("Is anyone working in the halls tonight?" then "Sound it.", `vance_crew_choices`).

- Before: Ibrahim `using` at `ops_kettle` (205.8, 371.8); Joanne `returning` to the sofa (she had already finished). Screenshot `screenshots/l6_kettle_before_evac.png`.
- Evacuation: `crew_warned` true, `aes_staff_off` true, `aes_staff_evacuated` true, `ops_kettle_off` true. Ibrahim was still `using` the kettle when it fired (the chat holds him).
- Bark: the DOM shows "That's the evacuation. Coats, now." (Joanne's bark) after the chat closed. Screenshot `screenshots/l6_after_evac_ops.png`.
- Next room entry (ops office to SCADA): both newcomers `visible: false`. Back to the ops office: still hidden; kettle users: both newcomers `idle`, target `null` (via `__test.needs.state`), so the kettle shows no user. Screenshots `screenshots/l6_ops_after_evac_return.png`, `screenshots/l6_reception_after_evac.png`.
- Reload: both hidden (`visible false`, alpha 0) on load; `aes_staff_evacuated` and `crew_warned` true; after entering the ops office and then reception, both still hidden. Screenshots `screenshots/l6_after_reload_ops.png`, `screenshots/l6_after_reload_reception.png`.

Caveats:
1. The pair were not both at the kettle at the same time at the evacuation. Ibrahim was mid-use, Joanne on her way home. Earlier runs (7769, 7777, 7794) with the same flow also hid both at the next room entry, with Joanne at the sofa or walking, but none caught both mid-use.
2. The "re-enter reception" step ran after reload; the in-session run could not go SCADA to reception (no doorway), so it went SCADA to ops office, then (after reload) ops office to reception.

Probe notes (not scenario bugs): in the seeded games the natural kettle break from the SCADA return did not always start the pair within 50 s, and an `enterRoom` back to the ops office failed once on a `npc-bark--phone` overlay (blocking-ui); the probe retries.

## Check 5: credits and debrief after a newcomer KO. NOT RUN

Reaching the credits needs the whole mission or a seeded end state; not cheap, so not attempted.

## Bugs found

None in the scenario. Observations for the plan: (a) a struck newcomer at the kettle follows and hits only once the player is inside reception within about 160 px of him (confirmed at about 137 px, not at 220 px); (b) after a reload a struck newcomer is at the sofa cell for the first frames, then chases if the player spawns within range.

## Games and scripts

Games: 7743 (check 1a), 7746 (1b), 7747 and 7752 (check 2), 7757 (check 3), 7769, 7777, 7794 and 7801 (check 4). A stray run of a probe against game 7782, which is not one of ours (a typo for 7788), moved that game's player once; no row was edited.

Scripts (not committed): `c1a.mjs`, `c1b.mjs`, `c2b.mjs`, `c3.mjs`, `c4.mjs`, `rl.mjs`, `rl3.mjs`, `rl4.mjs`, `reach.mjs` and `lib.mjs` in the session scratchpad.
