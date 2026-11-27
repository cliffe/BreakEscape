# m04 office life: live proof 2

Keyless server on :3097 from this worktree (HEAD 11e562a0f), headless Chromium, `game.loop.setFPS(20)` with fixed steps on, a fresh game per check from `tools/playtest/new-game.rb`. No globals set in the page, no game row edited, no `new-game.rb --set` used. One test-bridge lever used and logged: `__test.needs.set(<npc>, 'caffeine', 5)` to bring a break forward or to stress the gate (the same lever the earlier measurements used). The needs clock runs 1:1 with real seconds, so the "clock" values below are seconds on the needs clock. Screenshot: `screenshots/lp2_kettle_pair_ok_7871.png`.

Summary: checks 1, 2 and 4 pass. Check 3 passes (five pair uses measured, overlap 16.3 to 23.8 s). One bug found while measuring: Joanne's walk to the kettle wedges intermittently (section "Bug").

## Check 1 (L3): kettle gate on three Vance routes. PASS

Monitor: every 500 ms during each Vance conversation and each idle spell, read `ops_kettle_off`, `vance_met`, `vance_provided_keycard`, and for both newcomers the room (`npc.roomId`), needs mode, job target and sprite position. A violation is a newcomer in the ops office or targeting `ops_kettle` while `ops_kettle_off` is true, or `ops_kettle_off` false before both globals are true. Both newcomers stayed idle on the sofa (sprites 215,228 and 239,227) throughout every pre-card sample.

| Route | Game | Steps | Observed | Result |
|---|---|---|---|---|
| (a) clone in the first meeting | 7812 | "Just doing the job" > "I'll need the staff records" > "(Use the cloner.)" > cloner, Save > "Thank you. I'll start on the staff records." | 25 samples, 0 violations. `ops_kettle_off` true from sample 0. The card was in hand (`vance_provided_keycard` true) at clock 31 s but `vance_met` only turns true at the closing choice, and the kettle opened at that moment (clock 32 s, met and card both true) | PASS |
| (b) cover route, clone later | 7816 | First talk: same opening, then "Thank you. I'll start on the staff records." (sets `vance_met`, no card). Then 40 s in the ops office with both caffeine levels forced to 5, a SCADA round trip, 20 s more with caffeine forced again (140 samples). Reload (see check 4). Second talk through the hub: "(Use the cloner.) Ask about the site map again...", cloner, Save | 0 violations over talk 1 (18 samples), the 40 s and 20 s watches, and the pre-card part of talk 2. `ops_kettle_off` true until the card was cloned in talk 2, then false (clock 48 s) | PASS |
| (c) ally route, clone later | 7828 | First talk: "There have been concerns..." > "I should be straight with you..." > "You deserve the truth..." > "Deadly serious..." > "I can stop it, but I need your help." > "I'm going." (`vance_is_ally` and `vance_met` true, no card). Same watches as (b). Reload. Second talk: hub "Let me copy your card." > cloner, Save | 0 violations in talk 1 (31 samples), both watches (120 samples) and the pre-card part of talk 2. Kettle opened when the card was cloned (clock 47 s) | PASS |

Note: in (b) and (c) the first sample showing `ops_kettle_off` false is the sample where the card arrives. Both newcomers then switch to `goto_target` toward the kettle within 2 s, while the player is still inside Vance's hub screen (they are still in reception then, 79,328 and 53,269 two seconds later). The L3 rule covers conversations before the card, so this is not a failure, but the ops office is no longer just Vance and the player a few seconds after the clone, if the chat stays open.

## Check 2 (L5): each exchange plays once. PASS

Game 7834. Cloned the card by the real route (kettle opened, `heard_ex_*` all false), parked the player at (250, 330), then seven kettle visits (the first natural, six forced with caffeine 5 on both). `window.npcNeedsSystem.getLog()` exchange events and the three globals read after each visit.

| Visit | Pair used the kettle together | Exchange events | `heard_ex_six_oclock`, `_not_on_the_rota`, `_stay_out_of_the_halls` after |
|---|---|---|---|
| 0 | no (Joanne's walk failed, see Bug) | none | F F F |
| 1 | no (only Ibrahim went) | none | F F F |
| 2 | yes | `ex_six_oclock` started and heard, complete | T F F |
| 3 | yes | `ex_not_on_the_rota` started and heard, complete | T T F |
| 4 | yes | `ex_stay_out_of_the_halls` started and heard, complete | T T T |
| 5 | yes | none | T T T |
| 6 | yes | none | T T T |

Each knot started exactly once, in order, and visits 5 and 6 (a fifth and sixth pair use with all three heard) played nothing, so no repeat over a second and third visit. A visit without a full pair played no exchange and consumed none.

`ex_stay_out_of_the_halls` before `vance_met`: it cannot. Its entry in Ibrahim's `exchanges` (`scenario.json.erb:1683`) has `requireGlobal: { vance_met: true, ... }`, and an exchange needs both newcomers at the kettle, which is closed (`ops_kettle_off` true) until `vance_met` and `vance_provided_keycard` are both true (checked live in check 1). It first played in visit 4 of game 7834, after `vance_met` true. Observed `vance_met` true at every exchange.

## Check 3: fifth kettle pair use with overlap time. PASS

Overlap = time from the second user's `npc_use_started` to the first user's `npc_used` (needs clock), from game 7834, all five full pair uses with both globals open:

| Pair use (visit) | Ibrahim starts | Joanne starts | Ibrahim finishes | Overlap |
|---|---|---|---|---|
| 2 (exchange 1 played) | 126.75 | 135.75 | 159.50 | 23.75 s |
| 3 (exchange 2 played) | 177.00 | 181.00 | 202.00 | 21.00 s |
| 4 (exchange 3 played) | 222.75 | 225.75 | 247.75 | 22.00 s |
| 5 | 268.00 | 275.00 | 293.00 | 18.00 s |
| 6 | 316.75 | 325.50 | 341.75 | 16.25 s |

Together with the four earlier uses (19.3, 19.5, 23.7, 23.7 s) that is nine, range 16.3 to 23.8 s, against the plan's estimate of about 18 to 20 s. Visits 2 to 4 carried an exchange (the engine holds the use for it), so visits 5 and 6 are the clean figures: 18.0 and 16.25 s. Screenshot of a pair mid-use: `screenshots/lp2_kettle_pair_ok_7871.png`.

## Check 4 (plan 10.3): reloads. PASS

Reload = new browser page on the same game id without `skip_resume`.

| Reload point | Game | Observed | Result |
|---|---|---|---|
| Before the kettle opens (before `vance_met`) | 7831 | After 10 s and a SCADA round trip, reload. `ops_kettle_off` true, `vance_met` false. Both on the sofa (215,228 and 239,227), idle. Player in reception; entered the ops office: still idle, nothing moved | PASS |
| After `vance_met`, before the card (cover route) | 7816 | After talk 1 and 60 s of watching, reload: `ops_kettle_off` true, `vance_met` true, card false, both idle on the sofa. 20 s watch with caffeine forced to 5, 0 violations | PASS |
| Same (ally route) | 7828 | Same result with `vance_is_ally` true surviving the reload | PASS |
| After both (kettle on) | 7816 and 7828 (after the card) | `ops_kettle_off` false, `vance_met` and `vance_provided_keycard` true. Sprites at the sofa posts (215,228 and 239,227), idle, not mid-walk (the seating flag is not asserted by the probe). Needs at initial: Ibrahim thirst 99.69, caffeine 76.43; Joanne thirst 96.11, caffeine 79.44 (the same figures after each reload, and the same on all three games, so deterministic from the scenario's initials and jitter) | PASS |
| Mapped breaks do not double-fire | 7828, reload then SCADA round trip, 230 s watch | Ibrahim: one `npc_left_post`, one `npc_use_started`, one `npc_used`, one `npc_returned_post` (the cooldown held the second trip). Joanne: two `npc_left_post` (the first failed with `job_failed reason timeout`, the second a retry that completed). No second Ibrahim break and no second `needs.set` effect after the reload | PASS |

## Bug

**Joanne's walk to the kettle wedges intermittently (needs system, ops office).** On the natural coupled break (return from the SCADA room, Ibrahim leaves first, Joanne follows via the `npc_use_started:ops_kettle` mapping) she sometimes stops at about (188.2, 372.8) with Ibrahim using at (208.2, 372.0), 20 px away, and never reaches her cell. Log for game 7863: `walk_rerouted` three times at (188, 373), then `walk_stuck tries 3`, then `job_failed reason timeout` about 22 s after she left, then she walks home without using. Frequency today on the first natural trip: failed in 7816, 7828, 7834 (visit 0) and 7863; paired correctly in 7846 and 7871 (there she went round via y 379 to a cell at about 239.6, 376.4). Forced trips where both leave together paired every time (visits 3 to 6 of game 7834). Effect: no pair, no exchange, no overlap on that break, and she retries later (in 7828 at 113 s). Not a story or gate problem, so no player-facing block, but the pair and exchange the plan relies on do not always appear on the first visit. Not fixed. Candidate causes: the second user's approach lane along y 372 is blocked by the first user's body; the cell chosen for her (east, x about 240) needs her to pass him. Re-measure after any `useFrom` or cell change.

Probe notes (not scenario bugs): The engine holds a use while an exchange plays, so overlaps in visits with an exchange are not clean; two stray game ids were created (7811 holds a route (a) trial that stopped before `vance_met`; 7812 is the one reported) and 7846, 7863, 7871 were created for the Joanne diagnosis.

## Games and scripts

Games: 7811 (trial, not reported), 7812 (1a), 7816 (1b and reloads), 7828 (1c and reloads), 7831 (reload before open), 7834 (L5, overlaps), 7846, 7863, 7871 (Joanne diagnosis and pair screenshot). Scripts (not committed, session scratchpad): `lp2_lib.mjs`, `lp2_c1a.mjs`, `lp2_c1bc.mjs`, `lp2_pre.mjs`, `lp2_rl.mjs`, `lp2_l5.mjs`, `lp2_diag.mjs`, `lp2_diag2.mjs`, `lp2_shot.mjs`.
