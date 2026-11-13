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

## R1 fixes

Review: `docs/achitechture/BARK_DELAY_FIX_REVIEW_R1.md` (commit `03a7984b6`; 0 blockers, 0 majors, 7 minors, 3 nits). Fix commit `164b14e02`.

### m1. A delayed bark due during a chat with its own NPC is held, not dropped (fixed)

`_delayBark` no longer drops a bark when the player is in a person-chat with the barking NPC. The bark goes to `showBark`, whose hold policy keeps it behind any open person-chat and re-checks its condition when the chat closes, which is what a `barkDelay: 0` bark already did. Helen's sis01 mapping is unchanged. The README `barkDelay` entry now says a bark that comes due while the player talks to that NPC waits for the conversation to close and is shown then if its condition still holds. Test: "due during a person-chat with that NPC: handed to showBark to hold, not dropped" (it fails on the old code, which dropped the nurse's bark).

### m2. sis01 ICO deadline barks after the debrief (fixed)

Sarah Mitchell's and Dr Hartley's `ico_deadline_missed` mappings now have `"condition": "value === true && !globalVars.debrief_complete"`. `debrief_complete` is the global that ends the mission: `concludeRequires` lists it, the victory music triggers on it, and `npc_sharma.ink` `debrief_end` sets it before `#exit_conversation`. Both barks are held behind the forced debrief; when it closes the hold's re-check finds `debrief_complete` true and drops them. If the player picks "Give me a few minutes" the debrief closes without setting it, so the lines still show then.

### m3 and m4. sis01 death reactions spaced by line length (fixed)

Each bark starts after the one before it has finished: about 350 ms a spoken word, plus a 500 ms gap, rounded up to 100 ms. The order is the authors' order (by their original delays, ties in file order). Only `barkDelay` numbers changed.

| Event | NPC (bark line) | Words | Old barkDelay | New barkDelay | Voice ends about |
|---|---|---|---|---|---|
| patient_bed2_deceased | Sarah Mitchell (scenario.json.erb:901 or 909) | 6 | 1500 | 1500 (unchanged) | 3600 |
| patient_bed2_deceased | David Osei (2231) | 12 | 1500 | 4100 | 8300 |
| patient_bed2_deceased | Helen Carver (2314) | 12 | 2500 | 8800 | 13000 |
| patient_bed2_deceased | Mrs Kowalski (1321) | 5 | 3000 | 13500 | 15250 |
| patient_bed4_deceased | Amy Clarke (1096) | 4 | 800 | 800 (unchanged) | 2200 |
| patient_bed4_deceased | Sarah Mitchell (928) | 10 | 2500 | 2500 (unchanged) | 6000 |
| patient_bed4_deceased | Helen Carver (2307) | 8 | 2500 | 6500 | 9300 |

The ERB comment by Mrs Kowalski's mapping still says "delayed 3 s"; it was left alone because the ruling allowed only `barkDelay` numbers to change.

### m5 to m7. Tests (fixed)

- m5: the onceOnly test now repeats the event at 6000 ms, after the bark has landed and the default 5000 ms cooldown has run out, and asserts no second timer and one bark. A control test with `onceOnly: false` and the same timings gets two barks (1500 and 7500), so the first test fails without onceOnly.
- m6: the cooldown test repeats at 9000 ms (blocked from either start) and again at 10200 ms, and asserts barks at 1500 and 11700. Measured from the landing at 1500 the cooldown would still be running at 10200.
- m7: a knot-bark test (`knot` plus `storyPath`, `_showBarkFromKnot` stubbed) checks it is not called at 1499 ms, is called at 1500 ms with the `stillValid` closure, and is not called if the NPC is removed during the delay.

### n1. Room-change drop kept (documented)

The README `barkDelay` entry now says the room check follows the NPC's sprite, so an NPC that walks out of its room during the delay loses the pending bark.

### n2. Not changed

Optional in the review and not in the rulings.

### n3. Test count (corrected)

`grep -rlE "npc-manager(\.m?js)?['\"]" test/js` finds 34 files that import or copy npc-manager.js by a literal path. `grep -rl npc-manager test/js` finds 41 files, 40 of them `*.test.mjs` (the other is `phone-ring-harness.mjs`, used by phone-ringer tests). The earlier "40 files" was the 40 test files that mention it, not the ones that import it.

### Tests

`npc-bark-delay.test.mjs`: 17 tests, all pass. All 40 `*.test.mjs` files that mention npc-manager (`bin/test-js -j 3`, no lock): 40 passed, 0 failed. Validator on sis01 (`--no-graph`): 0 ❌, 14 warnings, the same 14 as before the change.

### Live proof

Keyless headless server on :3092 from this worktree (no GEMINI key), `setFPS(20)` with `fixedStep` true (read back from the world), new games from `tools/playtest/swap-scenario-game.rb test_seating sis01_healthcare --unlock-all`. Script in the session scratchpad (`bark-delay/r1proof.mjs`) wraps `barkSystem.showBark` and `_renderBark` and polls the open minigame every 50 ms. Times are from the start of the step.

- Game 2566 (Helen, m1): walked ward_7 to the incident room, talked to Helen ("What do you need from me?", "Should we bring in the NCSC?", "Ask them now"), then "I'll get back to it". `ncsc_notified` was set at about 6.7 s inside her chat. Her bark reached `showBark` at 7228 ms with the person-chat open and was deferred. The chat closed at 9.1 s, "Releasing 1 held bark(s)" was logged and the line rendered at 9084 ms.
- Game 2568 (Ms Okafor's death, m3): walked through the incident room back to ward_7, so every reacting NPC was loaded, no minigame open, then set and emitted `patient_bed2_deceased`. Rendered: Sarah 1522, David 4114, Helen 8816, Mrs Kowalski 13504. Each starts after the previous line's estimated end (3600, 8300, 13000).
- Game 2611 (ICO deadline into the debrief, m2): walked through the incident room back to ward_7, then set and emitted `ico_deadline_missed`. Priya S.'s forced debrief opened at 595 ms. Sarah's bark reached `showBark` at 2006 ms and Dr Hartley's at 3006 ms, both deferred behind the debrief. The probe drove the debrief to its end, never picking "Give me a few minutes". It closed at 251.3 s with `debrief_complete` true; "Releasing 2 held bark(s)" was logged, then both were dropped as stale ("dropped held bark (stale)", sarah_mitchell and dr_hartley). Nothing rendered in the 12 s that followed.
- In game 2568 each death bark rendered within 1 ms of reaching `showBark`, since no minigame was open.

Games 2553 (started in the incident room, where the start position could not reach Helen), 2554 and 2555 (created, not used), 2565 (Helen's opening offered no NCSC route), 2569, 2576 and 2590 (the key-press choice did not take in the debrief; 2611 clicks the choice buttons) were used for setup and are not proof. The server was stopped by PID afterwards.
