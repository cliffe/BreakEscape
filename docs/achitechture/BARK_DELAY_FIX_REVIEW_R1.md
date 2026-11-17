Counts: blockers 0, majors 0, minors 7, nits 3

# barkDelay fix, review round 1

Branch `build/bark-delay` at `fb919aa88` (fix `94ccf7184`), reviewed against main on 2026-11-13. Line numbers are at `fb919aa88`. The orchestrator's ruling stands: a delayed bark is held behind an open minigame like any other bark and is dropped only for a person-chat with that NPC.

## Verdict

The engine change is correct and small. `barkDelay` is copied into the config, `_delayBark` keeps its timers in `_delayedMappings`, and `_cancelDelayedMappings` (re-registration, removal) and `destroy()` clear them. onceOnly, maxTriggers, cooldown and the other actions all run at the event, and after the delay a bark goes through `showBark`, so the hold, the FIFO release, the re-check and the cap apply as before. There are no blockers or majors. The minors are two test gaps, one asymmetry in the drop rule that loses a sis01 line, and timings in sis01 that the fix has now made real: one stale line and some stacked voices. sis02 and lab_social_engineering read well.

## What was checked

- `_delayBark` (npc-manager.js:1216-1240). The timer key is `bark:<n>` in the NPC's existing map, deleted when it fires; `_cancelDelayedMappings` (1022) clears every value whatever the key, and `destroy()` (3225) walks every NPC. The drop checks run in this order: condition (the same `_barkStillValid` closure the hold uses), KO, room, hidden, person-chat with this NPC. The person-chat test uses `currentConversationMinigameType`/`currentConversationNPCId`, which person-chat sets at 458 and clears at 2007, and which phone-chat sets to `'phone-chat'`, so a phone thread never drops a bark.
- onceOnly and cooldown: `_handleEventMapping` records the trigger (1295/1335) before it reaches the bark branch, so both apply at the event. The bark landing never touches `triggeredEvents`.
- Knot barks (1866-1871): the same `stillValid` closure is used for the drop check and for `_showBarkFromKnot`, so the hold re-check sees it too.
- Bark queue: a delayed bark that lands during a release joins the end of the queue (`isDrainingDeferred || deferredBarkQueue.length`, npc-barks.js:161), so it cannot jump ahead of held barks.
- Phone calls (on main): `_shouldDefer` holds every bark while `phoneRinger.callActive()`, and a delayed bark reaches that check like any other. A ringer call is a phone-chat, so the caller's own delayed bark is held, not dropped; that matches a non-delayed bark from the caller.
- delayMs: a mapping with both waits `delayMs`, runs, and then its bark waits `barkDelay` more. The README says so ("To delay the whole mapping, use `delayMs`").
- Sync size: pending bark timers live only in memory and are never saved. The history line is written when the bark shows, not at the event, so nothing synced grows. A phone NPC's thread gains the same one line as before, only later.

## Findings

### Minor

**m1. Self-triggered delayed barks are now dropped where an undelayed one is held and shown.** npc-manager.js:1235-1236. When the event is set inside the player's own person-chat with the barking NPC, a `barkDelay: 0` bark is held and shown after the chat, but any `barkDelay > 0` bark is dropped. In sis01, Helen's `ncsc_notified` mapping (scenario.json.erb:2273, `barkDelay: 500`) only fires from inside Helen's conversation (npc_helen.ink:189-190 and 348-349). Before the fix the line showed when the chat closed; now it is dropped every time, and with it the only early mention that Priya is coming ("Priya's picking it up, and she'll join us"). The mapping is onceOnly and already spent, so the line never comes back. Fix (scenario, for the mission owner): set `barkDelay: 0` on that mapping, or move the Priya clause into the ink reply at npc_helen.ink:188. Fix (docs): add a sentence to the README `barkDelay` entry saying that a delayed bark whose event is set inside a conversation with the same NPC is always lost, so such mappings should use 0.

**m2. sis01 ICO deadline: two barks land after the forced debrief they announce.** scenario.json.erb:917 (Sarah, `barkDelay: 2000`) and 2357 (Dr Hartley, `barkDelay: 3000`), both `condition: "value === true"`. If the incident room is loaded, Priya S.'s `ico_deadline_missed` mapping (2432) opens the forced debrief (person-chat, disableClose) 500 ms after the event. Both barks then land behind it and are held, and when it closes they are shown, because their condition can never lapse. "They want you in the incident room, now" and "We need to talk" then play after the debrief, which ends the mission (`debrief_complete` drives the credits, 541). Before the fix they played at 0 ms, before the debrief opened. Fix (scenario): add `&& !globalVars.debrief_complete` to both conditions. The hold's re-check then drops them after a full debrief and keeps them if the player picks "Give me a few minutes" (npc_sharma.ink:68-71), where they still read well.

**m3. sis01 Ms Okafor's death: two voices start together, four overlap.** `patient_bed2_deceased` comes from a timer (scenario.json.erb:703-711), so usually no minigame is open and nothing serialises the barks. Sarah (901 or 909, 1500 ms, 6 words) and David (2231, 1500 ms, 12 words) start in the same tick. Helen (2314, 2500 ms, 12 words) and Mrs Kowalski (1321, 3000 ms, 5 words) start while both are still speaking: at about 3 s four voices are speaking at once. Fix (scenario): space each bark by roughly the length of the one before (about 350 ms a word). For example Sarah 1500, Mrs Kowalski 4000, David 6500, Helen 11500.

**m4. sis01 Mr Ahmed's death: Sarah and Helen start together.** `patient_bed4_deceased` is also from a timer (650-652). The nurse (1096, 800 ms, 4 words) is clear of the rest, but Sarah (928, 2500 ms, 10 words) and Helen (2307, 2500 ms, 8 words) start in the same tick. Fix (scenario): move Helen to about 6500.

**m5. The onceOnly test passes without onceOnly.** test/js/npc-bark-delay.test.mjs:103-112. The second emit comes at the same fake time as the first, so the default 5000 ms cooldown (npc-manager.js:1163-1166) rejects it even if `once` were ignored. Fix: `advance(6000)` between the emits (after the first bark lands) and assert that no second timer or bark appears.

**m6. The cooldown test cannot tell "at the event" from "when the bark lands".** test/js/npc-bark-delay.test.mjs:114-123. The repeat at 2000 ms falls inside a 10 s cooldown measured from either 0 or 1500. Fix: repeat at 10200 ms. Measured from the event (0) the cooldown has run out, so a second bark should land at 11700. Measured from the landing (1500) it would still be running. Assert two barks.

**m7. No test covers a delayed knot bark.** npc-manager.js:1866-1871 is new code (the knot path now goes through `_delayBark`), but every test uses `bark:`. Fix: add one test with `knot` and a `storyPath`, stubbing `_showBarkFromKnot`, and assert it is not called at 1499 ms, is called at 1500 ms with the `stillValid` closure, and is not called if the NPC is removed first.

### Nits

**n1. The room-change drop fires for NPCs that simply walk between rooms.** npc-manager.js:1218-1221, 1233. `behavior.roomId` follows the sprite across room bounds (npc-behavior.js:845-847). An NPC on a multi-room patrol, or an office-life NPC walking to the coffee machine, loses a delayed bark if it crosses a doorway during the delay, though the line is not stale. No `barkDelay` NPC in sis01, sis02 or the lab leaves its room. Fix: none needed now; add "an NPC on a route through several rooms can lose a delayed bark" to the README entry, or compare only `npc.roomId` (set by relocation, not by walking).

**n2. sis01 isolation and drug-library reactions stack when the minigame closes quickly.** `network_isolated`: Helen 2300 (500 ms), Ravi 1801 (1500), Sarah 873 (2000), David 2208/2215 (2500), four lines of 8 to 12 words inside 2 s. `drug_library_compromised`: David 2200 (1000), Hamza 1380 (1200, revealed by Helen's setGlobal at the event), Sarah 3000 and Helen 2281 (4000). Both events are set inside a minigame (network segmentation map or dual-auth; drug library integrity). While it stays open the barks are held and released one at a time, so the stack only appears when the player closes it within a second or two. Before the fix they all spoke at 0 ms, so this is better than it was. Fix (scenario, optional): widen the gaps as in m3.

**n3. The fix log's test count.** BARK_DELAY_FIX_LOG.md "Tests" says 40 files import npc-manager.js. A grep for an import or a harness copy of the file finds 37; 41 files mention it. All 41 pass (below). Fix: give the grep used, or the count.

## Deployed games: mapping by mapping

sis01 (all 28 non-zero mappings read): apart from m1 to m4 and n2, the delays read well. Hamza's 1200 ms after he appears (1380) works because `setVisible` runs before the bark and the hidden check is taken after it. Mrs Kowalski's "not waking up" at 4000 ms (1304) cannot overtake "Somebody help her!", because the critical state comes 90 s later (695). The Sarah, Ravi, Helen and Priya S. barks on minigame-set globals (`bed4_monitor_viewed`, `drug_library_override`, `backup_restore_initiated`, `debrief_started`, `ico_notified`) are each the only delayed bark on their event.

sis02 (1 mapping, scenario.json.erb:1031): correct. Priya's bark is held behind Helen's evacuation scene and shown when it closes (live, below). On the safe-state path it is the only bark on its event.

lab_social_engineering (7 mappings, 1647-1660): all from `ruth_phone`, one bark per event, and each event is set inside a minigame (intel board, report) or another contact's thread, so each is held or shown alone. No overlap. The 1.5 s and 2.5 s delays read well.

## Tests run

Without the lock, per the test lock rule: every file under test/js that imports or copies npc-manager.js (37 files), plus the 4 that only mention it (npc-ink-variables, phone-callback-restore-when, phone-ringer, social-intel-needs-global). 41 passed, 0 failed. The new file has 15 tests, all passing.

## Live proof

Keyless headless server on :3091 from this worktree (no GEMINI key), `setFPS(20)` with `fixedStep` on, new games from `tools/playtest/swap-scenario-game.rb test_seating <scenario>`. A probe script wrapped `barkSystem.showBark` and `_renderBark` and polled the open minigame every 50 ms.

- Game 2529 (sis02): opening cleared, then `facility_evacuated` set and emitted. Helen's evacuation scene opened at 578 ms (`person-chat:helen_marsh`). Priya's bark reached `showBark` at 1529 ms and was deferred ("deferring bark", queue `[priya_s]` at 3.5 s). The probe then drove the scene to its end. It closed at about 5.35 s, "Releasing 1 held bark(s)" was logged, and Priya's line rendered at 5348 ms. Priya was visible. This is the ruled behaviour.
- Game 2530 (lab_social_engineering): opening cleared, no minigame open, then `report_filed` set and emitted. The first and only `showBark` call was Ruth's at 1520 ms, not held, and it rendered at 1522 ms ("Report's filed..."). Nothing reached `showBark` before that.

The server was stopped by PID afterwards.
