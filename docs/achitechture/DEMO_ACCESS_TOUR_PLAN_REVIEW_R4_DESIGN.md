# demo_access_tour plan: review R4 (design and tour, delta)

Plan: docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md at 4e8a25cde (v4). Scope: the diff from 0aab435ed (P0's `sendTimedMessage` with `skipIfGlobal`, `julian_lost_with_desk` and `julian_back`, D5c, `ama_phone` as holder, P1, W15, the short route ending and the D2 split, P6, the declined W11b), checked against unchanged sections and the engine. Server enforcement and sync belong to the other reviewer.

Counts: B 0, M 0, m 1, n 1

## R3 findings: resolution

| R3 | Status | Where in v4 | Note |
|---|---|---|---|
| m1 P0 `skipIfGlobal` on the mapping | RESOLVED | 403, 407, 416, 611 | The P0 row now gives the whole `sendTimedMessage` object with `skipIfGlobal` inside. 403 states the shape and why (npc-manager.js:1712-1722 copies it into the scheduled text, 2540-2546 checks it at delivery; mapping-level is video-call only). 611 says P0 never reaches the phone thread. |
| m2 `julian_lost_with_desk` inferred | RESOLVED | 392-393, 435, 611 | Keyed on `pc_signed_out:julian_pc` with reason `link_dropped` and `fromPcId === 'reception_pc'`. Confirmed below. A second loss resets `julian_back`. `julian_via_desk` is gone from the plan (no hit on grep). The "sign out of julian_pc first" variant is in the walk. |
| m3 holder of global and task mappings | RESOLVED | 401 | `ama_phone` holds them, listed by name; the rota board and stop 15 nudge sit on thandiwe and yasmin and fire after the open plan has loaded. 183 already puts `ama_phone` in reception's `npcs`. |
| m4 stop 12 lever on the short route | RESOLVED | 404-415 (P1 at 408), 665 | P1 names the coffee rota. The declined W11b is a fair call: the hub is first-unmet-wins, so a non-F W11b ahead of W17 does hold a required step behind an optional one until the player opens the session, which the "board always works" note did not remove. |
| m5 W15 holds the hub | RESOLVED | 375 | The text now gives the way on (pull the box when ready). The hold itself remains, but the player is told how to leave it. |
| m6 look-round leads nowhere | RESOLVED | 435-436, 459 | 2.12 item 5 says the short route ends at the debrief. D2 reply splits on `tour_full`. 430's last sentence now reads as R3 asked. |
| n1 grep kept | RESOLVED | 544 | States the validator's limit and keeps the grep and the by-eye check. |
| n2 stop 10 wording | RESOLVED | 285 | "full route, stop 18". |
| n3 P6 vs spec | RESOLVED | 205, 414, 517-519, 529 | Departure stated; cooldown, no onceOnly; V8 count 2, onceOnly keys 9. |

## Delta checks that pass

- The `julian_lost_with_desk` mapping reads true only for the case it names. `signOut` emits `pc_signed_out` for the desk with reason `sign_out` (pc-sessions.js:795), then passes the server's ended list to `linkDropped(..., 'route_ended')` (pc-sessions.js:798-800), which emits `pc_signed_out` for each dropped PC with reason `link_dropped` and `..._remoteOf(previous)` (pc-sessions.js:883-887, 958-964). A desk-route session carries `fromPcId` (game.rb:4344-4367; the server ends sessions whose `from` is the signed-out PC, game.rb:4335). An unplug emits the same `link_dropped`, but the dropped box-route session has no `fromPcId`, so `data.fromPcId === 'reception_pc'` is false. Signing out of julian_pc itself has reason `sign_out`. Both stated in the plan and both hold.
- Condition forms the evaluator reads: `data.reason === 'link_dropped' && data.fromPcId === 'reception_pc'` is two `&&` terms, each a comparison with a quoted literal (npc-manager.js:98-112, 121-135). `globalVars.julian_lost_with_desk === true`, `globalVars.tour_full !== true` and `=== true`, and `data.roomId !== 'open_plan'` are all supported. No `||` or parentheses. The `cooldown: 30000` field is a plain mapping field (npc-manager.js:1214, 1281).
- `setGlobal: { julian_lost_with_desk: true, julian_back: false }` writes both keys, broadcasts each and emits `global_variable_changed` for each (npc-manager.js:1500-1512). A `false` value is written like any other. Both are declared booleans, false at start. Global count: 17 `done_` plus ten others (tour_full, seen_julian_rdp, has_julian_rdp, front_desk_signed_out, julian_lost_with_desk, julian_back, saw_in_use, staff_twin_up, julian_ended_by_unplug, tour_debriefed) is 27, matching 514.
- Reset logic: loss sets lost true and back false; a later `pc_signed_in:julian_pc` (condition lost true) sets back true; a second loss resets back. D5a (`julian_ended_by_unplug`) is tested first, so a lost-then-reconnected-by-box player gets D5a, a lost-and-not-reconnected player gets D5c, and a reconnect through the desk that survives gets D5b. W6b and D5c use the same `lost and not back` pair, so they agree.
- P0: the desktop Connect completes the unlock task and writes `done_t_julian_pc` in the same call (objectives-manager.js:1138-1144), long before the 4 s text is due, and `_deliverTimedMessage` returns early on the skip (npc-manager.js:2540-2546). The text is not queued for later. The `onceOnly` key is spent either way, stated at 416.
- P6: `lastTime` is set only when a handler fires (npc-manager.js:1449, 1471), and a failed condition returns before that (1284-1300), so a drop in the open plan does not start the 30 s window. A wrong drop then a second wrong drop 30 s later texts twice, as 205 says.
- The D2 split: wrap_open needs `done_t_unplug`, so a short-route "another look round" always comes after the box is out and the "network stops are done" reply is true. On the full route the reply is "Go on. I'll be here." and the tour continues to stop 18.
- Renumbering in 2.12: items 5 and 6 are distinct; 436 and 437 do not collide. No other text refers to the old item numbers.
- No remaining mention of `julian_via_desk` in the plan, the 4.x tests or the walks.

## Minors

### m1. W6b holds the hub ahead of every later line, including lines that do not need Julian's session
Evidence: W6b sits above W7 in a first-unmet-wins hub (364), shown while `julian_lost_with_desk and not julian_back`. Nothing in the short route needs Julian's session after stop 5: stops 9, 10, 11, 12 and 17 do not read it. On the short route a player who signs out of the front desk after a desktop Connect (the case v4 now models carefully) gets "Connect again from your keyring" in place of W9 (Lorna), W10, W11 and W17 until they reconnect. Reconnecting is only wanted for the unplug payoff (D5a), and D5c already covers its absence. The full route has the same hold at a second loss: after a reconnect through the desk, the stop 14 sign-out at the front desk drops Julian again (the reset at 392 re-arms W6b), and W6b then sits ahead of W14 to W17 although the implant and rogue AP steps do not need Julian. This is the R3 m5 pattern (a hub line held by an event the player may choose to skip), here on W6b.
Fix: show W6b only while it is the next real need. Either make it `F` and place it with W7 (the door controller is the first stop that needs the session), so the short route never meets it, or keep it for both routes but only until `done_t_copy_badge`, and add "or carry on to Lorna" to the text. The first is the smaller change and D5c still explains the missing payoff.

## Nits

n1. 4.6's desktop Connect walk (611) covers the first loss and the box reconnect. It does not cover the second loss path that the reset at 392 exists for: Connect from the desk, sign out (loss, W6b), Connect again from the desk (back), then the stop 14 sign-out (loss again, W6b and D5c return unless reconnected). Add one line, since that is the only case where `julian_back: false` in the setGlobal matters.

## Not checked

- Whether a mapping with `cooldown` and no onceOnly (P6) leaves any `triggeredEvents` key in the synced state; the plan says it adds none (517), which is the other reviewer's ground.
- The spec's own guard cooldown value (CAKE_ITEM.md at d7bc4cf95 is not in this worktree), so the 30000 in P6 is taken as stated.
- Server behaviour behind the changed section 1 and 2.3 text about the door controller session surviving only while another office_lan session is held (network_access.rb:1255-1281 and neighbours).
