# CA pilot mechanics plan: design review, round 1

Reviewed: `CA_PILOT_MECHANICS_PLAN.md` (25 Nov 2026) and its digest, with targeted reads of the engine. Paths are relative to the worktree root. Engine paths are under `public/break_escape/js/`.

Counts: 1 BLOCKER, 6 MAJOR, 11 MINOR.

Verdict: the two beats are the right shape. The attacker framing is good (Jo's red-team toast, Nilesh's kit, "Nobody bit. Corners don't get found."), and E1, E2 and E3 are each needed in some form. Four things break in the engine as the plan describes it: the E3 reuse, the world-play hand-back, the E2 timeout and Joanne's notice rule. The ca12 challenge design also ends the hero tailgate before it can happen.

---

## BLOCKER

### B1. E3 built on `_lookUpButton` / `_lookUp` leaves Look up disabled and cancels the later step-away

Evidence:
- `_lookUpButton` enables Look up only while `_stepAwayReady()` is true (`minigames/episode-runner/episode-runner-minigame.js:529-541`), and `_stepAwayReady()` reads `STEP_AWAY_READY_GLOBAL` (`:523-526`), which is `'kit_defend_done'` (`minigames/episode-runner/episode-model.js:64`). In the attack half after `mistake`, `kit_defend_done` is false, so Look up stays disabled and only Carry on works. The drop never runs.
- `_lookUp` also returns early unless ready (`:565`), and it calls `_markStepAwayPicked()` (`:567`, `:609-615`), which writes `stepAwayPicked: true`. ca15 already uses the step-away after `defend` for Fatima's found-stick set piece. Once the world beat has written `stepAwayPicked`, the post-defend panel is skipped (`:416-418`), and P1 (the defender's practice) is lost.
- `_steppedAway` (`:565-566`) is one flag per runner instance, shared by both beats.

Plan text at fault: section 2.5, "Build it on the step-away code (`stepAwayOn`, `_lookUpButton`, `STEP_AWAY_EVENT`), not beside it."

Fix (also the smaller design asked about under Reuse): generalise the step-away into a list of beats rather than adding a parallel `worldBeat` path. For example, `awarenessEpisode.stepAways: [{ after, event, readyGlobal|null, doneGlobal|null, pickedKey }]`, with today's `stepAway: true` normalised to `[{ after: "defend", event: "episode_step_away", readyGlobal: "kit_defend_done", pickedKey: "stepAwayPicked" }]`. Then:
- `_stepAwayReady(beat)` returns true when `readyGlobal` is null;
- `_lookUp(beat)` and `_markPicked(beat)` write that beat's own key (`worldBeatPicked` for ca15's first beat), and `_steppedAway` becomes per-beat;
- the waiting panel is shown only when `doneGlobal` is set and still false.

Add unit tests: (a) Look up is enabled after `mistake` with `kit_defend_done` false; (b) picking the first beat leaves `stepAwayPicked` unset and the post-defend panel still shows; (c) the legacy `stepAway: true` shells behave exactly as today (run the existing step-away suite unchanged). Add live-proof step ca15 (f) as a hard pass condition: Look up appears after defend *in the same run that used the world beat*.

---

## MAJOR

### M1. World-play's hand-back strips the hi-vis while the wearable stays worn

Evidence: `utils/world-play.js:91-95`. `leaveWorld` calls `removeCostume` unconditionally, "even if the placement cannot be made", whether or not `world.costume` was applied (`:67`). Wearables put their look on through the same module: `systems/wearables.js:124` loads `costume-actions.js`, which imports `utils/player-costume.js` (`costume-actions.js:29`), and that module holds one shared `worn` record (`player-costume.js:26`, `:77-99`). With `world.costume` deleted (plan 1.7), the hand-back still finds `worn` set by the hi-vis and restores the chosen avatar. The learner arrives back at the kiosk in their own clothes while `gameState.wornItem` and `ca12_wearing_hivis` still say worn. The inventory then offers Take off for a vest they are not shown wearing, and the flip's "as a courier" framing no longer matches what is on screen.

Fix: E2 also changes `world-play.js`. `enterWorld` records whether it applied a costume (`origin.costumed = true` only when `world.costume` was applied and `applyCostume` returned true), and `leaveWorld` calls `removeCostume` only when `origin.costumed` is true. Unit test: with a wearable costume on and `world.costume` null, `leaveWorld` leaves the costume on. Keep the current test that a world costume does come off.

### M2. Yusuf's challenge ends the beat before the tailgate can happen

Evidence:
- Plan 1.7: Yusuf's `player_in_view_near` mapping fires whenever world is on and not done; `conversation_closed:ca12_yusuf_demir` sets `ca12_world_done`; and E2 hands back on that global. In the `walked_away` path the natural first move is to walk up to the reader. Yusuf challenges, the chat closes, the beat ends and the learner is put back at the kiosk, all before Jun's first pass. The hero tailgate shot needs the learner to hold back on their first try, and nothing tells them to.
- Talking to Yusuf through `start` while the world is on also sets `ca12_world_done` (same mapping), which ends the beat early.
- The plan's open check on Len is answered by the lab. Len's sight challenge has `skipIfGlobal: ["courier_ready", ...]` (`scenarios/lab_physical_pentest/scenario.json.erb:2107-2113`), so the disguised player is never challenged. His challenge mapping is conditioned on `len_at_door === true`, i.e. only while the gate is open for him (`:2124-2140`), and it uses `closeDoor`.

Fix:
- Split the challenge by wear. With the hi-vis on, Yusuf's challenge is a bark only ("Sorry, can I help you there? Deliveries go via the desk.") with a 20 s cooldown, no conversation and no `ca12_world_done`, so the learner can step back and wait for Jun. Only the no-vest and alerted challenges open person-chat. Only `conversation_closed` after `challenge` (gate the mapping on a `ca12_challenged` global set by the challenge mapping) sets `ca12_world_done`.
- Use the lab's form: `challengeOnSight.near` anchored to `ca12_badge_reader` with a measured radius (Len's comment at `:2095-2105` explains why the reader's top-left origin matters), `cooldown` short on the sight event, 20 s on the mapping.
- Add a `ca12_gate_open` scalar (set true on `door_gate_opened`, false on `door_gate_closed`, both with `data.connectedRoom === "training_room"`, on Lorna). Put it in the hi-vis bark's condition (`!globalVars.ca12_gate_open`), so a courier who follows Jun inside the hold is never challenged. The toggling scalar is a delta write each time, not growth.
- Add ca12 routes and a live proof: (c2) wear, `walked_away`, walk up alone, get the bark, step back, follow Jun, get credited.

### M3. The E2 timeout and the reload never set `ca12_world_done`, so the beat's mappings stay armed for the rest of the episode

Evidence: plan 1.5 E2 runs `handBack` and `finish` once `holdMaxMs` passes, but nothing writes `holdUntil`. The reload case relies on `_settleWorld` (`episode-runner-minigame.js:1246`), which does not write it either. After either one, `ca12_world_on && !ca12_world_done` stays true. Consequences:
- Yusuf's sight challenge stays live in the lobby through the flip, the defend half and the step-away.
- Lorna's mapping 4 credits `slip_past_guard` the next time a hi-vis learner walks from the lobby into the studio, which can be during the defend step-away.
- Jun's door cue (mapping 6) can fire late.

Fix: E2 writes `holdUntil` true whenever the hold ends for a reason other than the global (timeout, reload settle, a watcher giving up). Alternatively, the shell adds a scenario timer `ca12_t_world` (`startOnGlobal: ca12_world_on`, 120000 ms, sets `ca12_world_done`) and E2's `holdMaxMs` becomes a backstop a few seconds longer. The engine write is the better fix, because the validator rule ("holdUntil without holdMaxMs is an error") then guarantees the global always ends true. Unit test: after a timeout, the global is true and hand-back ran exactly once.

### M4. Joanne notices the stick only from where she stands when she next chooses an activity, not as she walks past it

Evidence: interests are scored inside activity selection (`systems/npc-needs.js:1780-1787`), and `_carryCandidate` measures reach from `pos`, "seen from where the NPC stands" (`:3186-3189`). A stick in the middle of the room, 2 tiles off her path, is found only if it lies within `noticeRadius` of a point where she stops and chooses: her desk, the kettle or the printer. It is not found as she walks past it. Plan 2.1 step 3 ("A stick on the walk line is found"), the risk note on the notice radius (section 5) and the hero footage in section 7 ("from the printer, the stop, the pickup") all assume mid-walk noticing.

Fix:
- Rewrite the rule the learner is meant to work out as "near where people stop: desks, the kettle, the printer". That is also the truer baiting lesson.
- Lay out `open_plan` so the kettle, the printer and Joanne's desk are 4 to 6 tiles apart, with the 3-tile notice circles covering most of the floor between them. A corner outside every circle stays the "nobody bit" case.
- Retitle the hero shot: Joanne finishes at the printer, turns and walks to the stick.
- Add a unit test (or extend the needs suite) that pins the rule: an item within radius of the choice point is picked; one only near the mid-path is not.
- If the owner wants mid-walk noticing, that is a new engine change (E4) and needs its own review. Do not slip it into E3.

### M5. The `reported` and no-vest paths leave the learner with nothing to do for up to 120 s

Evidence: plan 1.1 step 4 and 1.7. In `reported` nobody opens the gate and Jun never runs. In no-vest `walked_away`, the gate stays shut while the barred player is near: door-gates will not open it for Jun at all (`systems/door-gates.js:94-100`, the anti-tailgate rule), so he turns back after `GUARD_TURN_BACK_MS` (`:101`). If the learner does not walk up to Yusuf, the beat waits for `holdMaxMs` 120000. That fails rubric F2 ("no stall over 90 seconds"). The lab's rule also means the plan's no-vest `got_it` line, "Delphine holding it", is not what happens: the gate never opens for her while the learner stands close.

Fix:
- In `reported`, Yusuf walks over (`patrolOverride` to a tile beside the desk) on `ca12_guard_alerted` and starts the alerted challenge himself within about 10 s.
- In no-vest paths, Jo's hint toast fires 30 s after the outcome: "No uniform, no badge. Try the desk again, or talk to the guard."
- Lower `holdMaxMs` to 75000.
- Correct 1.1: with no vest, Delphine reaches the door, the gate stays shut, and she turns back; the no-vest challenge follows.

### M6. The ca15 timeout fires while Joanne is holding the stick

Evidence: plan 2.6 timer `ca15_drop_t_found`, condition `!globalVars.ca15_drop_used`, 90 s after the drop. Pickup comes first (`npc_picked_up`, `npc-needs.js:3600`), then the walk to her desk, then `useSeconds: 6` before `npc_used` (`:3768`). A pickup at 80 s fires "Nobody bit. Corners don't get found." while she is carrying it, and `ca15_drop_done` resumes the kiosk before the payoff.

Fix: condition the timer on `!globalVars.ca15_drop_found`. Add a second backstop timer, `startOnGlobal: ca15_drop_found`, 30000 ms, condition `!ca15_drop_used`, which sets `ca15_drop_done` with no bark (for a use that never lands). Add a ca15 route for "found at 85 s".

---

## MINOR

### m1. Delphine's override tile is in the doorway's walk line

`approachPoint` sends an opener to "the tile in front of the doorway" (`door-gates.js:105-107`, `APPROACH_PX 48`). Delphine standing there for 8 s physically blocks a one-tile side doorway. Fix: send her to a tile beside the approach tile (diagonal), still inside `openRadius` 64, and prove it in `test_side_door_gate`.

### m2. The side branch of `walkThroughTarget` double-offsets if `g.y` becomes the doorway centre

The side branch returns `y: g.y + TILE / 2` (`door-gates.js:610-613`). It assumes `g.y` is the sprite's top, as in the north-south branch. Plan 1.5 sets `g.x`/`g.y` to the doorway centre. Fix: write E1 so one of the two holds (drop the `+ TILE / 2`, or keep `g.y` as the top and store a separate centre), and unit-test the walk target from both sides.

### m3. E1 scope leaves out the `doors.js` touch points

`walkThroughTarget` looks up `props.gateKey` (`door-gates.js:597`), and click routing, the bump and side-door creation live in `doors.js`. The plan lists `doors.js` lines only as evidence, not as files to edit. Fix: list the `doors.js` changes (setting `gateKey` on both side sprites, gate click routing on both sprites, the bump) in E1. Re-estimate the size, and include a click test on each sprite.

### m4. Jun's loop never stops

`ca12_runner_go` is monotonic and nothing ends his patrol, so he walks in and out through the flip, the defend half and Camila's step-away. That opens the gate under Lorna's walk with Camila. Fix: on `ca12_world_done`, `patrolOverride` him back to his desk and stop the route. Check `behavior.patrol` for a stop action when the start-global check is done.

### m5. An unfound red-team stick can be found during the post-defend step-away

A stick left in `open_plan` after the timeout stays `pickable`. Joanne can collect and use it during Fatima's set piece, and her lines overlap. Fix: on `ca15_drop_timeout`, remove or hide the dropped object (**check** whether a mapping can remove a `player_drop` object). Failing that, give Joanne's interest a `noticeRooms` that a mapping can empty, or put a `skipIfGlobal`-style gate on the interest if the schema has one.

### m6. The hand-back cuts the pass moment

On `room_entered:training_room`, mapping 4 sets `ca12_world_done` at once. The hand-back then teleports the learner to the kiosk and opens the flip over Yusuf's pass bark, and the trailer loses the beat. Fix: set `ca12_world_done` from a 2500 ms timer started on `ca12_tailgated`, or give E2 an optional `holdGraceMs`.

### m7. Check that the barred rule sees the learner in the lobby after the teleport

`_playerBarred` tests the player's room first (`door-gates.js:40-44`), and world-play moves the learner with `setPosition` (`utils/world-play.js:33-37`). If `currentPlayerRoom()` still says `training_room` (the secured room), the learner counts as inside and is never barred. Fix: add a unit or live assertion straight after `enterWorld`: no-vest player, gate open for Jun, player stopped at the strip.

### m8. Resolve the session note's give path now

Plan 2.6 leaves open whether a mapping-level `give_item` needs the item in Joanne's `itemsHeld`. Since the server enforces gives, settle it before writing her record, and put `ca15_session_note` in her `itemsHeld` either way (harmless if not needed).

### m9. The ca12 defend twin never mentions a uniform

The attack half now teaches that the hi-vis got the learner past the guard, but the twin's call text (`e12_call_tailgater`) mentions only a missing badge. Rubric O3 is weighted more in the twin. Fix: add one clause to the defend twin's call ("in a courier's hi-vis, no badge"). It agrees with the attack shell and costs one line of shown text.

### m10. Tests and proofs missing from section 3

Add:
- the `leaveWorld` costume test (M1);
- the per-beat step-away tests (B1);
- the notice-point test (M4);
- a live re-run of the lab's records-door tailgate after E1 (north-south gates share `groupAtPosition`, which `doors.js:668` calls; unit tests alone do not cover the live path);
- `break-escape-dungeon-graph` regen for ca12, ca15 and both test scenarios, since `generate_dungeon_graph.rb` changes;
- a ca12 route for the hi-vis bark-then-follow path (M2) and a ca15 route for "found late" (M6);
- the test-harness copy list for any new import in `world-play.js`.

### m11. Print errand needs its config

Plan 2.3 gives Joanne "a print errand", but print errands are scored from `habits.print` and need print jobs (`npc-needs.js:1788-1792`). Fix: specify the habit and the printer's job source in her record, or drop the errand and rely on caffeine.

---

## Checked and fine

- **Synced state.** All new globals are bounded scalars. `worldBeatPicked` (or the per-beat key from B1) is one boolean written once. `ca12_gate_open` (M2) toggles a scalar.
- **Server enforcement.** `ca12_hivis` comes from a server-known hook, its global is server-owned, and `ca15_red_stick` is a `give_item` from Nilesh's `itemsHeld`. Nothing secret sits behind either beat. Tailgate credit is client-written and optional, in line with the cheat-resistance rule.
- **Mapping order.** All new mappings go last. Camila's mapping 2 changes in place (`delayMs`), which does not shift any index.
- **Suspension and trailer movement.** The kit suspends needs per NPC by mapping (`tarrowby_logistics.json:843` and others), so Joanne, Niamh, Yusuf and Jun are never suspended at `kit_caXX_out`. Both new beats run before the flip, well before any `out`. Yusuf's patrol, Jun's loop, Nilesh's walk and the kettle trips are all filmable.
- **`npcThoughts: false`.** It does not affect carry and use (digest 3c, consistent with `_carryCandidate` above).
- **The call watcher's give-up limit.** It is four hours (`episode-runner-minigame.js:143`), so a 120 s hold cannot trip it.
- **The ca15 defend twin.** It is consistent with the drop.
- **Attacker framing (O1, O2).** It is good in both beats.
