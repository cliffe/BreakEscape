# m02 office life: stage 5 review, round 5 (delta)

R5: 0/0/0 (B/M/m). No findings.

Subject: `git diff a877afa94..c4872955f` on `build/ol-m02` (the R4 fix round), checked against REVIEW_STAGE5_R4.md and its R4 Outcomes. Main had moved (five commits, d0cd67b2e); it was merged cleanly (`git merge --no-edit main`, no conflicts), giving tip 5654f504d before this note. No server was started and no code edited.

## Checks

| Check | Result |
|---|---|
| Stale state when `interrupt` closes a minigame | None. `_interruptAndOpen` (npc-manager.js:1090-1103) runs `beforeOpen` first, so a dropped call leaves the minigame alone and clears `_scriptedCall` and pumps the queue. Otherwise it sets `_scriptedCall = {npcId, minigame: null}` before `endMinigame`, then `_openScriptedConversation` records the started minigame or clears it on failure. The queued path shifts the head before calling it, so it cannot open twice. |
| Never closes a scripted conversation | Holds on all three paths. Start-delay: `_scriptedCall` is the call's own record, and any other scripted or ringer call opened in that window is blocked or queued by `_scriptedCallBusy` / `ringBlocked`, so the only minigame that can be open is the player's own. Queue tick (npc-manager.js:1118-1124): requires `!_scriptedCallBusy()` before it interrupts. delayMs (npc-manager.js:927-930): skips the wait, then `_queueScriptedConversation` queues behind a busy conversation. Covered by the "never cuts into another scripted conversation" test. |
| Default mappings | Unchanged. `interrupt` is `=== true` and video-call only, `dropIfBusy` calls never interrupt, and `cutsIn` needs `conversationMode === 'video-call'`. `_skipGlobalSet` is truthy as the timed forms were; the only `skipIfGlobal` on an event mapping in any scenario is the two m02 Ghost ones (booleans). |
| Docs against code | README_scenario_design.md:1755-1756 (`skipIfGlobal`, `interrupt`) and the schema `eventMapping` entries match: event-time skip leaves the open minigame alone, drop at open, delayMs and queued paths, never over a scripted conversation, `skipIfGlobal` checked first, effects already run. |
| Ghost mappings | scenario.json.erb:1470-1488: both carry `skipIfGlobal` and `interrupt`; the second is `onceOnly` and pinned by a test. Comment matches the behaviour. |
| Tests | minigame-launch-routes.test.mjs covers start-delay, queued, delayMs, drop-inside-delay, event-time skip, non-boolean global, scripted-conversation wait, with and without `interrupt`. All pass. |

## Results (tip 5654f504d, after the main merge)

- `bin/test-js`: Files: 691 passed, 0 failed, 691 total.
- Rails suite: 2940 runs, 48173 assertions, 0 failures, 0 errors, 3 skips.
- Validator: m02 0 errors, 33 warnings; lab_physical_pentest 0 errors, 10; test_needs_sims 0 errors, 36; test_exercise_station 0 errors, 0; m10_full_disclosure 0 errors, 64.
- m02 `lock_key_diff` against `office_life/baseline_locks.json`: empty.
- rubocop on the one Ruby file in `main...HEAD` (scripts/validate_npc_needs.rb): no offences.
