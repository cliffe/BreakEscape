# barkDelay fix log

Branch `build/bark-delay`, from main `8b6cf6a0d`, 2026-11-13.

## The bug

An eventMappings entry can carry `barkDelay` (milliseconds) to stagger reactions from several NPCs to one event. The engine ignored it: `_buildMappingConfig` in `public/break_escape/js/systems/npc-manager.js` never copied `barkDelay` into the handler config, so the bark branch of `_handleEventMapping` read `config.barkDelay || 0`, always 0, and every bark showed at once. Staggered reactions spoke on top of each other.

Scenarios with a non-zero `barkDelay`: sis01_healthcare (28 mappings), m02_ransomed_trust (10), lab_social_engineering (7), sis02_energy (1), m03_ghost_in_the_machine (1) and test_event_cascade (4). sis01, sis02 and the lab are deployed; their barks now land at the times the authors set.

## When it started

`git log -S barkDelay -- public/break_escape/js/systems/npc-manager.js` gives one commit, `2fa2015fa` (9 April 2026, "Enhance NPC interaction and behavior: add bark icon tracking..."). It added the read of `config.barkDelay` and the `setTimeout`, but the config builder of that day (the inline object in `_setupEventMappings`, later moved to `_buildMappingConfig`) never had a `barkDelay` line. It never worked; no later commit broke it. Two reviews found it before this fix (m10 WALKTHROUGH_R1 R1b-m2, deduction REVIEW_R7_ENGINE L-3); m10 worked round it with `delayMs`.

## The fix (commit `94ccf7184`)

- `_buildMappingConfig` copies `barkDelay` (a positive number, else 0).
- A new `_delayBark(npcId, delayMs, show, stillValid)` replaces the bare `setTimeout`, for both the text bark and the knot bark. Only the bark waits: onceOnly, maxTriggers, cooldown and the mapping's other actions (setGlobal, setVisible, tasks) still run at the event, as before.
- When the delay is up the bark is dropped, with a console line saying why, if:
  - its `condition` no longer holds (the same `stillValid` the hold queue uses);
  - the NPC is knocked out (`npcHostileSystem.isNPCKO`);
  - the NPC has changed room (behaviour `roomId`, else `npc.roomId`) or been hidden since the event;
  - the player is in a person-chat with that NPC.
  Otherwise it goes to `showBark`, so the bark queue, the hold behind an open minigame or conversation, the hold's `stillValid` re-check and the cap all apply as for any bark. The conversation history line is written only when the bark shows.
- The timers sit in the NPC's existing `_delayedMappings` map under `bark:<n>` keys, so `_cancelDelayedMappings` (NPC re-registered or removed) and `destroy()` clear them with the `delayMs` timers, with no other change.

### Decision: hold, not cancel, when a minigame opens

The brief asked for a delayed bark to be cancelled when a conversation or minigame opens, matching other delayed barks. The code does something else for those: a `delayMs` mapping waits for an open minigame to close, and a bark that arrives while one is open is held and released afterwards with its condition re-checked (`bark-release-policy.js`, README "Bark Notifications"). sis02 relies on this: Priya's arrival bark (`barkDelay: 1500`) is meant to be held behind the cutscene that opens at +500 ms and shown when it closes (sis02 REVIEW_R2). Cancelling would lose that line. So a delayed bark is held like any other bark, and dropped only when the conversation is with the barking NPC, where the line would be stale. If the orchestrator wants a hard cancel on any minigame, it is one more `else if` in `_delayBark`.

## Docs, schema, validator

- README_scenario_design.md: both `barkDelay` entries (Bark Notifications and the actions table) state milliseconds, that only the bark waits, the drop rules and that a pending bark is not saved.
- scripts/scenario-schema.json: `barkDelay` is a number, minimum 0, described in milliseconds; description updated with the same points.
- scripts/validate_scenario.rb already accepts `barkDelay` (non-negative number, else an error) and lists it among the presentation-only fields. No change.

## Tests

- New `test/js/npc-bark-delay.test.mjs`, 15 tests, all pass: config carries barkDelay; bark not shown at 1499 ms and shown at 1500 ms; two NPCs land in delay order; onceOnly and cooldown apply at the event; a cancelled delay never fires (NPC removed or re-registered, manager destroyed, NPC knocked out, moved room, hidden, condition gone, player in person-chat with that NPC); `stillValid` reaches the bark; barkDelay 0 barks at once; setGlobal runs at the event.
- Every test file that imports npc-manager.js (40 files, `bin/test-js -j 3`): 40 passed, 0 failed.

## Live proof

Keyless headless server on :3090 from this worktree, setFPS(20) with fixed steps on, new games from `tools/playtest/swap-scenario-game.rb`. Proof script in the session scratchpad (`bark-delay/proof.mjs`): it wraps `barkSystem.showBark` to time each bark, sets `network_isolated` and emits `global_variable_changed:network_isolated`, which fires Sarah Mitchell's sis01 mapping with `barkDelay: 2000`.

- Game 2518 (sis01): the opening briefing with Sarah was still open. Her bark was dropped at 2000 ms with "player is talking to the NPC", the person-chat rule working live.
- Game 2520 (sis01, briefing driven to its end, no minigame open): no bark at 499, 1003 or 1911 ms; the bark reached `showBark` at 2030 ms and its toast was in the DOM.
- Game 2519 (m02) was created but not used.

The server was stopped by PID afterwards.

## Not done

- No staggered multi-NPC run in the browser (the unit test covers ordering).
- A pending delayed bark is not saved; a reload inside the delay loses it, as with `delayMs`.

## Handover

Done in full; nothing in progress. Files: npc-manager.js, README_scenario_design.md, scripts/scenario-schema.json, test/js/npc-bark-delay.test.mjs, this log. Merge note: the change in npc-manager.js is one config line, one constructor line, the `_delayBark` method above `_handleEventMapping`, and the two bark call sites; build/ux-barks edits nearby for answeredInView.
