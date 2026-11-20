# Lab UX, NPC half (q53 e, f, g): code review R2

Branch `build/lab-ux-npc` against `main` (merge base 93a58745b), 2026-11-12. This round checks the R1 fixes (commits 8782fe028 and ab621b761) and then reviews the whole branch diff again, with five questions to answer: the furniture change, the PIN window global, Len's 130 s without keying, the voiced "fifteen" line and the validator's `noticeRadius` warning.

Counts: 0 blocker, 1 major, 4 minor, 5 nit.

## How this was checked

- Read the build log, R1, and the whole diff (engine, lab and test scenarios, schema, both validators, the JS tests and the Rails test).
- Tests, run without the lock: the five changed JS files (npc-needs 63, npc-player-push 8, npc-route-multiroom 25, validator-npc-leash 12, validator-patrol-catch-locks 13) and the eight other JS files that import `npc-sprites.js` (combat-room-rule, engine-fixes-round6, npc-hostile-config, npc-ko-immune-and-door-event, npc-ko-restore-pose, npc-hostility-persistence, npc-respawn-reset, npc-patrol-clock). All pass. `lab_physical_pentest_secrets_test.rb`: 36 runs, 0 failures.
- Validator on all 176 scenarios with `--no-graph` (see the validator section). No repository file changed.
- Live: my own keyless server on :3052, headless Chromium, `setFPS(20)` with fixed steps on (`[20, true]` in every run). For a like-for-like comparison with main, some runs served the merge base's `npc-sprites.js`, `npc-behavior.js` and `npc-needs.js` through Playwright request interception, so nothing in the tree changed. Games: 1544, 1550, 1555, 1556, 1559 to 1564, 1566 to 1571, 1578, 1579, 1585. Probe scripts are in the session scratchpad, `uxnpc_r2/`.

## R1 findings: are they fixed?

| R1 | Status | Evidence |
|---|---|---|
| E1 (window re-armed by the exit opening) | Fixed | `len_keying` is set on `npc_used_object:badge_reader` only. Game 1585: gate forced shut and reopened after the keying, real `E` at the shelves gave no credit and the "not keying" toast; next round, `E` 0.87 s into the keying was credited and `opt_pin` ticked. |
| E2 (texts say 15 s) | Fixed | Task text and `hint_tailgate_now` say 17. The voiced line is discussed below. |
| E3 (validator and engine disagree on a route) | Fixed | Warning now tests `multiRoom` true and a non-empty route; test added. |
| F1 (large rooms cut down silently) | Fixed | New warning; it fires only where intended (below). |
| F2, F3 | Fixed | Comment back on `AVOID_RADIUS_TILES`; schema notes on string and 0. The `TILE_SIZE` part was skipped with a reason; fine. |
| G1 (doorway text, README) | Fixed | Task text and README updated. See minor m1 for the furniture gap in the README sentence. |
| G2 (only wall boxes count) | Fixed, and widened | Static bodies within 12 px count as a wall. Assessed below. |
| G3 (test-npc-patrol upper bound) | Not done | Not mentioned in the fix log. Nit n5. |
| G4 (still player holds Len up) | Answered here | Not new; see "Len's 130 s". |
| G5 (pin lasts the step) | Fixed | Comment corrected. |
| R1 (text guard weaker) | Fixed | Refutes on "before it shuts", "while it/the door is open", "until it shuts". |

## The furniture change

**What it touches.** Only the process callback of the player and NPC collider in `createNPCCollision`, the one caller of `staticRectsNear`. NPC bodies against walls, desks and chairs are separate colliders and are unchanged, so no NPC loses its way to a seat or desk because of it. The change picks between two outcomes for a routed NPC: "pin" (the player stops against him) in open floor, or "slide" (no separation, the player passes) within 12 px of any static body. Compared with main, where the player shoved the NPC everywhere, the furniture part only turns some pins into slides.

**How much floor it covers.** Measured in every m01 to m10 room that starts with a patrolling NPC (games 1559 to 1570). For each standable 8 px point, would a player body there be within 12 px of a wall box, or of any static body?

| Mission, room | Patroller | Wall only | Any static |
|---|---|---|---|
| m02 office_corridor | security_guard_patrol | 16% | 16% |
| m02 hospital_ward | roaming_ward_nurse | 7% | 24% |
| m03 executive_wing_hallway | terry_mott | 16% | 16% |
| m04 battery_hall_1 | operative_cipher | 8% | 37% |
| m06 security_checkpoint | checkpoint_guard | 13% | 21% |
| m06 executive_wing | satoshi_minder | 12% | 33% |
| m07 security_checkpoint | ray_hollis | 11% | 31% |
| m09 open_stacks | old_coyote | 6% | 39% |
| m10 server_hall | hall_guard_a, hall_guard_b | 7% | 22% |
| m10 workshop_floor | workshop_guard | 11% | 38% |
| m10 security_office | duty_guard | 10% | 19% |
| lab open_plan | len (and needs walkers, see M1) | 7% | 19% |

So in furnished rooms the player passes through a patroller on a fifth to two fifths of the floor, against a tenth with walls alone. Several of these guards are hostile-capable; once hostile they go back to the old push (`keepsRouteAgainstPlayer`), so fights are unaffected.

**Side effects looked for.** No mission beat relies on a guard's body: a grep of m01 to m10 for "get past", "in the way", "blocks", "squeeze past" finds only story lines and lock-gated beats (m02 Val, m06 minder with the key, m09 director, m10 Netherton), none of which depends on collision. No new stuck spot is possible from the slide: it removes a separation, it never adds one. The pin in open floor is unchanged by the furniture part. The one behaviour lost is the collide callback (`handleNPCPlayerCollision`, which makes the NPC settle and re-route) on slide frames, but avoidance is ray-based (`_handleBlockerAhead`) and still sees the player.

**Verdict: keep it engine-wide.** Without it a pinned NPC can press the player into a desk, and desks are what fill office floors, so the pin is safer with it than without it. Limiting it to the lab would leave every mission guard with the unsafe case. Two things need doing: the README sentence (m1) and the scope of "routed" (M1).

### Major M1. The pin and slide reach every NPC walking a goToAndStay, not only patrol guards

`keepsRouteAgainstPlayer` tests `behavior.config.patrol.enabled`. The engine sets that flag at runtime for any `goToAndStay` (`npc-behavior.js` around line 2945), which is how needs errands move (`npc-needs.js` line 4852, `owner: 'needs'`), and for the push-recovery walk home (around line 2863). Live in the lab (game 1571): hampshire, lord and pierce had `patrol.enabled` true with `_moveOwner` "needs" while walking, and false once arrived. So while an office-life NPC walks an errand, the player cannot push it in open floor and passes through it near any desk.

That may well be the behaviour you want, but it is not what was built or reviewed. The build log says "Other NPCs (stationary, needs walkers, hostile) are pushed as before" and lists "A needs NPC walking an errand can still be shoved" as open. The README says the rule is for an NPC with `patrol.enabled`, which a designer reads as a configured patrol. R1 and the furniture decision were judged on guards. Office life is heading into m01 to m10, where needs walkers will be far more common than guards.

Fix, one of:
- keep the rule to configured patrols: exclude a behaviour with `_stopOnArrival` (or `_moveOwner === 'needs'`) in `keepsRouteAgainstPlayer`, with a test; or
- accept it, say so in the README and the build log, add a collider test for a needs walker, and check test_needs_sims once in the browser for queues and doorways, where several walkers meet the player.

Either is a one-line engine change; it needs the user's call because it sets how every office NPC feels to walk into.

### Minor m1. The README sentence leaves out furniture

`README_scenario_design.md` says the two pass through each other "within 12 px of a wall, doorway or narrow corridor". Since G2 it is any static body: desks, tables and Tiled collision objects. A designer placing a guard among desks would expect the body block to hold. Add "desk, table or other fixed furniture".

### Nit n1. The furniture slide has unit tests only

The two new tests are good (one fails with the change removed, per the fix log), but no browser run put a player against a desk with a patroller walking into him, which R1 G2 asked for. The room measurements above show the query finds the desks; a short probe in m04 battery_hall_1 or m09 open_stacks would close it. A test comment also calls a disabled body "an open gate": gate doors are dynamic bodies (`doors.js` line 577) and never appear in the static query, so the comment should say something else.

## The PIN window (`len_keying`)

- **Set and cleared.** True on `npc_used_object:badge_reader` (Len only); false on the done event, `door_gate_closed` and `game_loaded`. The credit needs `len_at_door && len_keying`. The gate opens on his approach, before the keying (measured 0.5 to 0.8 s before in games 1544, 1550 and 1585), so the two overlap for the whole 2.5 s.
- **Save and resume.** `len_keying` and `len_keyed` are declared, and `game_loaded` clears both alongside `len_at_door`, the same pattern live-proven for `len_at_door` in an earlier round. The Rails test pins the mapping. I did not force a mid-keying save and reload in the browser.
- **Can it be left impossible?** No case found. From the shelves (outside the 72 px gate radius) the gate opened on every round in games 1544 and 1550 (nine and ten rounds), each with a keying inside it. A turn-back cannot strand `len_keying` true, because `wantsToCrossGate` is false while he keys in his open_plan segment, so the turn-back never interrupts a keying. A keying cut short with no done event (none found) would only make the next window longer, never shut it. With the hi-vis on there is no look, by design, and the toast says why.

### Nit n2. A gate flicker mid-keying loses that round

In game 1585 the player walked in past the door during a keying: `use` 24152, `door_gate_closed` 25291, `door_gate_opened` 27249, done 26668. The close cleared `len_keying` and nothing re-armed it, so that round had no window. Only a player standing within the gate radius causes it (that player is barred, so not at the shelves), and the next round is normal. Not worth a change; noted so nobody reads it as a bug later.

## Len's 130 s without keying (game 1513)

Not reproduced, and not new. Four 140 to 150 s runs, branch and merge-base engine side by side:

| Spot | Barred | Branch | Merge base |
|---|---|---|---|
| (1043, 80), 59 px from the gate (games 1555, 1556) | no | 10 keyings, one every 13 to 14 s; gate open almost throughout | Len cycles; no keying events exist on main |
| (1030, 55), 32 px from the gate (games 1578, 1579) | yes, every sample | 7 keyings, one every 18 to 19 s, each followed by a turn-back 5 s later; he walks back to (4, 4) each lap | 10 turn-backs; from 59 s to the end Len stands at the door (993, 50) with avoidance active and never walks his loop |

So with the player holding the gate shut, the branch keeps Len cycling and keying every lap, and main lets him stand at the door for at least 80 s. The branch is better here, not worse. What the fixer saw is very likely the held-up behaviour recorded in `scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md` (2026-11-06, "Noted, not changed": an undisguised player near the door holds Len up for as long as he stands there), possibly counted by gate openings rather than keying events. That note is not in `docs/IDEAS_BACKLOG.md`, which the brief suggested.

### Minor m2. The held-up gate stall is not in the backlog

Add it under "Lab follow-up: screens, gates and hints", with the base-engine measurement above (Len parked at the door from 59 s in game 1579). It is harmless for the lab's intended spots, but a student who waits beside the door with no hi-vis sees Len freeze.

## The voiced "fifteen"

`ruth_phone.ink` line 120: "Len badges in every fifteen seconds or so." Measured door to door with the player out of the way: 16.4 s (game 1544, nine rounds) and 16.7 to 17.6 s (R1). With the player near the door, 13 to 19 s. "Fifteen or so" is within the spread, it is spoken advice rather than a figure to time against, and the texts that say 17 do not contradict it. **Acceptable as it stands**; no new audio needed.

### Nit n3. Leave a note for the next voicing pass

If `ruth_phone.ink` is re-voiced for another reason, change it to "every quarter of a minute or so" or "about every seventeen seconds" at the same time.

## The validator's `noticeRadius` warning

All 176 scenarios validated. Only `test_npc_needs` gets the room-size warning (the finder's deliberate radius of 4 in a 10 x 10 room); no other scenario does, so there are no false warnings today. `lab_physical_pentest` and `test_npc_needs` have no ❌ lines. No new "multi-room route" or `useMs` warning appears in any scenario. 22 scenarios have ❌ lines; none mentions `noticeRadius`, `useMs` or a route action, so none comes from this branch.

### Nit n4. The warning uses the whole map, walls included

`room_tiles` gives the tilemap size, so a 20 x 12 room is judged by its 23.3-tile diagonal although the floor is smaller. That errs towards warning, which is the safe side. The suggested value (`diag.ceil`) could also exceed the 100-tile cap on a very large map. Neither matters today.

## Whole-branch notes

### Minor m3. The build log's description of (g) is now wrong in two places

"Other NPCs (stationary, needs walkers, hostile) are pushed as before" (see M1) and "With the player within 12 px of a wall" (now any static body). Update the log with the M1 decision.

### Minor m4. The barred-spot turn-back runs Len's keying with the door shut

At the barred spot Len keys his PIN for 2.5 s with the gate held shut, then turns back 5 s later (games 1578: seven times). That is consistent (no window, because `len_at_door` is false), but a student standing near the door sees him key and the door stay shut, and at the shelves the toast says "Nobody is at the keypad". It does not block the solve, since the shelves are outside the radius. It would read better if a held-shut gate made him turn back before keying, or if he stood at the reader without the keying animation. A design call; leave it unless playtests trip on it.

### Nit n5. R1 G3 is still open

The test-npc-patrol "largest move" figure is still an upper bound. Low value now that Len's frames were sampled in R1; close it with a frozen-patroller probe or drop it.

## Housekeeping

- Server on :3052 stopped by its own PID. Games created: 1544, 1550, 1555, 1556, 1559, 1560, 1561, 1562, 1563, 1564, 1566, 1567, 1568, 1569, 1570, 1571, 1578, 1579, 1585.
- No repository files changed apart from this review.
