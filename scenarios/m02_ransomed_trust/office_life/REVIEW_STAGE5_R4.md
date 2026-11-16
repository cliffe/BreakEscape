# m02 office life: stage 5 review, round 4 (delta)

R4: 0/1/6 (B/M/m). The Major is older than this branch: an engine change on main (1dd843566, 2026-11-07) stopped Ghost's console offer from cutting in, and the P9 drop now turns that into a silent loss of the Ghost's Keys source for most players. It needs an owner call. The minors are schema, docs, a missing event-time check, a truthiness mismatch, test gaps and one stale comment.

Subject: changes since R3 on `build/ol-m02`, tip c02276892: 721f0616b (`skipIfGlobal` for video-call mappings, two Ghost mappings), a46b60940 (exchange line length back to ERROR), 154f07e4a (tests), doc updates. Main merges d4b4d1b82, 4b72d6bd9 and c02276892 checked for cleanliness only. No server was started and no game record touched.

## Verdict

The engine change does what P9 needs: a Ghost video call that waited behind the console is dropped when it finally opens if `ransom_decision_made` is set, the queue moves on and nothing is left behind. Other callers are untouched: the option is read only in the `video-call` branch, and person-chat, phone-chat, ringer calls and timed conversations ignore it. The validator change is correct and gives 0 errors on every scenario with exchanges.

The real P9 cause sits deeper. The offer was designed to cut in before the console choice and no longer can (M1).

## Checks

| Check | Result |
|---|---|
| Stale state after a drop | None. `_openScriptedConversation` (npc-manager.js:1051-1054) clears `_scriptedCall` and pumps the queue. No minigame is started, so `activeMinigame`, `conversationActive` and music are never touched. Held toasts release on their own poll (notifications.js:154). The phone-lead pose is time-limited (player-poses.js:180). |
| Side effects | The mapping's `setGlobal`, `completeTask` and `unlockTask` run at the event (npc-manager.js:1449-1470), before any drop. The two Ghost mappings have none. `ghost_offer_made` is set by the knot, so a dropped call leaves it false, which is right. |
| Reload | `onStart` never runs for a dropped call, so `persistOnClose` never registers and the onceOnly trigger is not saved. The in-session count is still spent. After a reload the mapping can fire again, and both m02 conditions now carry `!globalVars.ransom_decision_made`, so it does not. See m3 for a caller without that guard. |
| Ringer and scripted phone calls | Not affected: the ring path returns at npc-manager.js:1914, and `_queueScriptedPhoneCall` gets no `beforeOpen`. |
| Reuse of an existing mechanism | Same name and idea as `timedConversation.skipIfGlobal` (npc-manager.js:2524, :2567) and timed messages (:2472). The check is re-implemented inline rather than shared, and the semantics differ (m4). |
| `ghost_offer_made` later | Not needed after the decision. Every reader is pre-decision: the scenario mapping at scenario.json.erb:1474-1479, `m02_phone_ghost.ink:259` (also guards `not ransom_decision_made`), and `m02_phone_agent0x99.ink:769` (inside `hint_ransom_decision_choices`, which exits to the hub once `ransom_decision_made` is set). |
| Recovery sources | Ransom, offline keys only and combined recovery: no task or beat depends on the Ghost call. `make_ransom_decision` and the ward globals come from the `backup_recovery_source` mappings (scenario.json.erb:1262-1296). Ghost's Keys: see M1. |
| Validator | `validate_scenario.rb` on lab_physical_pentest, m02_ransomed_trust, test_needs_sims, test_exercise_station: 0 errors each, no bubble-length issue. m02 warnings 35 (was 33): the two new ones are false (m1). |
| Main merges | Clean. `git show --remerge-diff` is empty for all three, and each merge differs from its main parent only in files the branch changed. |
| `bin/test-js` | 690 files passed, 0 failed (tip c02276892). |

## Findings

### M1. Ghost's offer can no longer come before the console choice; with the P9 drop, Ghost's Keys is silently lost

- **Where:** scenario.json.erb:1458-1462 (design comment: "The video call closes the console; the player reopens it with Ghost's answer known"), public/break_escape/js/systems/npc-manager.js:983-998 (start-delay busy-guard, added in 1dd843566 on 2026-11-07, after the Pass 4 design of 2026-10-02), interactions.js:850 (`object_interacted` is emitted before the console opens at :1545).
- **Failure scenario:** the player picks up the manifest and opens the recovery console. `object_interacted` fires, and the call queues with nothing open. 500 ms later the console is open, so the busy-guard defers the call instead of opening over it. The player picks Ransom, Offline keys or Combined in that same visit and closes the console. The call is now dropped (this branch). Ghost never makes the offer. `ghost_deal_accepted` can never be set, so the Ghost's Keys source (scenario.json.erb:2635, `requiresGlobal: ghost_deal_accepted`) never appears, and the Act 3 offer, HaX's "third option" reply and the debrief's deal branches are lost. Only a player who closes the console without deciding hears the offer. Before this branch the same player got the offer after the decision (P9), so the drop is no worse than before. It does hide the fault.
- **Fix (owner call):** either (a) an engine opt-in on the mapping, for example `interrupt: true`, that lets the start-delay busy-guard close the minigame opened during the delay and open the call (the pre-11-07 behaviour), set on these two mappings, with a test; or (b) fire the offer from an earlier event, such as `room_entered:server_room` or `global_variable_changed:restore_manifest_obtained` with a short `delayMs`, so it lands before the console opens. Keep `skipIfGlobal` as the backstop either way, and correct the comment at :1458-1462 to match. m10 has five `object_interacted` phone-chat mappings (scenario.json.erb:1822, :1841, :2415, :2457, :2478) that may meet the same deferral; worth a check by AC0, outside this branch.

### m1. Schema lacks `skipIfGlobal` on event mappings, so the validator calls it ignored

- **Where:** scripts/scenario-schema.json:4967 (`eventMapping`), validator output for m02: `eventMappings[5]` and `[6]` "has unknown field 'skipIfGlobal'", "this field will be ignored by the game engine".
- **Failure scenario:** an author reads the warning and removes the field, and P9 comes back. The warning baseline in HANDOVER.md (33) is now 35.
- **Fix:** add `skipIfGlobal` (string, "video-call only: drop the call if this global is set when it opens") to `eventMapping` in the schema. Update the baseline note.

### m2. The mapping field is not documented where mapping fields are

- **Where:** README_scenario_design.md:1797-1823 (event mapping actions table). The field appears only in the code comment at npc-manager.js:1186 and in HANDOVER.md.
- **Failure scenario:** a mission author needs the same guard on a person-chat or phone-chat mapping, sets it, and it does nothing. Or they expect it to undo the mapping's `setGlobal` and `completeTask`, which have already run at the event.
- **Fix:** add a row: "`skipIfGlobal: \"name\"` | `video-call` only: if the global is set when the call is about to open (it may have waited behind a minigame or another call), the call is dropped. The mapping's other effects (`setGlobal`, `completeTask` and the rest) have already run at the event. Repeat the guard in `condition` so the event does not fire at all once the global is set."

### m3. `skipIfGlobal` is checked only at open, not at the event

- **Where:** npc-manager.js:1855-1868 (video-call branch) and :968-972 (`_queueScriptedConversation` closes the open minigame before the start delay).
- **Failure scenario:** a mapping uses `skipIfGlobal` without repeating the guard in its `condition`. Or a dropped onceOnly call (never persisted, see Checks) fires again after a reload. The global is already true when the event fires. Nothing is busy, so `endMinigame` closes whatever the player has open and the phone-lead pose plays. 500 ms later `beforeOpen` drops the call. The player loses their open minigame for nothing. m02 is safe only because both conditions repeat the guard.
- **Fix:** in the video-call branch, return before `_queueScriptedConversation` when the global is already set (with the same log line), as `scheduleTimedConversation` does at :2524 before its `beforeOpen` re-check.

### m4. Different truth test from the timed forms of the same field

- **Where:** npc-manager.js:1864 (`=== true`) against :2473-2474, :2505-2506, :2525 and :2569 (truthy).
- **Failure scenario:** an author points `skipIfGlobal` at a non-boolean global (`backup_recovery_source`, a count, a string state), as the timed forms allow. The video call opens anyway.
- **Fix:** use one helper, for example `_skipGlobalSet(name)` returning `!!window.gameState?.globalVariables?.[name]`, in all four places.

### m5. Tests miss the real P9 route and the m3 case

- **Where:** test/js/minigame-launch-routes.test.mjs:390-409.
- **Failure scenario:** the "queued-then-flipped" test makes the call wait by faking another open conversation (`_scriptedCall` set, so the queue path at npc-manager.js:1014). P9's route is the start-delay busy-guard (:992-997), where the console opens during the 500 ms. A change to that branch, for example one that drops instead of defers, or the M1 `interrupt` fix, would not be caught. No test covers m3 (an open minigame closed when the global is already true at the event) or confirms that a dropped onceOnly call is left unpersisted (`triggeredEvents.get(key).persist` stays unset).
- **Fix:** add (1) a test that fires with nothing open, sets `fw.currentMinigame` inside the start delay, sets the global, clears the minigame and runs the timers, so the call is dropped; (2) a test that an open minigame is not ended when the global is already true at the event (fails today, passes with m3's fix); (3) an assertion that the dropped mapping's trigger has no `persist`.

### m6. Stale comment after the severity change

- **Where:** test/js/npc-exchange-heard.test.mjs:492 ("the fixture long lines also raise the 40-character bubble warning").
- **Failure scenario:** a reader takes the bubble check for a warning, as it was in R3, and expects 0 errors from a scenario with long exchange lines.
- **Fix:** "bubble error".
