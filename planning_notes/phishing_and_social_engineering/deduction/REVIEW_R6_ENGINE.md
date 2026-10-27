# Round R6, engine and runtime lens: deduction board plan

Target: `DEDUCTION_IMPLEMENTATION_PLAN.md` after R5 (82 changes, `REVIEW_R5_CONSOLIDATED.md`, §14 "Round R5
(workflow)"). Every engine claim in §1, §4, §5 and §6 that R5 touched, and the rest of §4–§6, was read
against the working tree on 2026-10-22 (paths under `public/break_escape/js/` unless stated). Read-only;
other agents' uncommitted edits were read, not changed.

## Part A: R5 fix checks

"Text" means the change is fixture wording, lint scope or process with no engine claim beyond the plan
itself; it was checked for consistency with §4–§6 only.

| R5 id | Holds | Evidence |
|---|---|---|
| R5-1 | **partly** | Restore is unawaited and each emit follows the add POST (`core/game.js:2218`, `systems/inventory.js:449-485`, `:655-662`, keys `:734-740`); on a first load the server has already copied start items into `playerInventory` and deleted `startItemsInInventory` (`games_controller.rb:365-372`, `game.rb:2912-2918`), so the list is always `playerInventory`. But the list is consumed per handler, and keyed on `id` while the emit carries `id \|\| lockRef(...)`: R6E-1 |
| R5-2 | **partly** | The error half is right (`skip_task!` never satisfies `tasksCompleted`, `game.rb:1464-1471`, `:3128-3145`). The ⚠️ half ("a global `onClose` sets: allowed") is wrong for a success-screen ending: R6E-2 |
| R5-3 | **partly** | Confirmed: an unmet gate saves the task completed and returns `success: true` + `warning` (`game.rb:1431-1463`); the client keeps it completed (`objectives-manager.js:574-583`). The runtime's own gate check is too narrow and excludes `onClose` globals unsafely: R6E-2 |
| R5-4 | yes | `writeGlobal` emits on write (`systems/global-writer.js` step 4); holding the globals is the only safe option |
| R5-5 | yes | `MinigameFramework.currentMinigame` is the board instance (`minigame-manager.js:174`) with `.mode` (`intel-board-minigame.js:88`). Sync result on decline unspecified: R6E-8 |
| R5-6 | yes, with a gap | Overlay Esc → `requestClose()` → `close()` (`framework/social-overlay.js:80-115`), so the panel closes unless the board overrides it: R6E-10 |
| R5-7 | yes | Evaluator text only; consistent with §4.3 |
| R5-8 | yes | Exports listed in §5.1 and used by §6.2 |
| R5-9 | yes | `{ clue, how }` and the held-set rule are consistent with §4.3 |
| R5-10 | yes | `decidedAtVerdict` stored in §4.5; §6.2/§6.3 lines present |
| R5-11 | yes | Bootstrap strips every room's contents and `npcs` (`game.rb:764-821`); authored `place` is the only client source |
| R5-12 | yes | Text |
| R5-13 | yes | Text |
| R5-14 | yes | `giveItem` matches the first held item by type/selector (`npc-game-bridge.js:209-317`) |
| R5-15 | yes | Text |
| R5-16 | yes | `syncedVars` lints exist (`scripts/validate_social.rb:417-449`) |
| R5-17 | yes | `isGlobalVariable` (`npc-conversation-state.js:429-440`) |
| R5-18 | yes | Text (ink pattern) |
| R5-19 | yes, stale rationale | HEAD batches tags; the working tree (another agent, uncommitted, "F16") now applies each line's tags during `continue()`: R6E-5. The choice beat stays safe |
| R5-20 | yes | Text |
| R5-21 | yes | Text |
| R5-23 | yes | `removeNpcFromScene` leaves `itemsHeld` alone (`npc-game-bridge.js:748-782`); `#give_item` then `#remove_npc` are both SLOW tags and run in ink order (`person-chat-pending-reply.js:34-44`) |
| R5-24 | yes, with a gap | `#clone_keycard` reads `rfidCard` and needs an `rfid_cloner` (`chat-helpers.js:318-386`); C's start inventory has one. The tag is not flushed on close: R6E-11 |
| R5-25 | yes | `koImmune` skipped in the punch (`player-combat.js:428-433`) and in `damageNPC` (`npc-hostile.js:268-276`) |
| R5-26 | yes | Process |
| R5-27 | yes | `debugKO` emits no `npc_attacked` (`test-bridge/index.js:946-1022`); the real punch emits it only for a non-hostile NPC (`player-combat.js:440-449`) |
| R5-28 | yes | `check_scenario_directory_structure` (`validate_scenario.rb:215-221`) |
| R5-29 | yes | Same function takes the `.erb` path |
| R5-30 | yes | Text |
| R5-31 | yes | Text |
| R5-32 | yes | Ownership |
| R5-33 | yes | Text |
| R5-34 | yes, with a gap | No `disableMovement` anywhere in `music/`; success-screen save/restore pattern at `ui/success-screen.js:94`, `:192-195`. HUD clicks are not blocked: R6E-7 |
| R5-35 | yes | Success screen waits 1 s idle and only opens from `handleMissionConcluded` (`success-screen.js:57-81`); conclusion can only come on step 3's last call |
| R5-36 | yes | `restoreHostility` runs in `create()` (`core/game.js:1872`) and sets `isKO` for every saved KO (`npc-hostile.js:149-172`) |
| R5-37 | **no** | Re-removal "on install" runs before the inventory restore lands: R6E-4 |
| R5-38 | yes | Keys live on `inventory.keyRing` (`inventory.js:699-740`) |
| R5-39 | yes | Notes-family items return before any slot (`inventory.js:558-563`) |
| R5-40 | yes | `applyActions` is synchronous (`apply-actions.js:31`, no awaits); `apply-actions.js` is already in the module graph via `systems/interactions.js` |
| R5-41 | yes | Text |
| R5-42 | yes | Text |
| R5-43 | yes | Text |
| R5-44 | yes | Text |
| R5-45 | yes | Text |
| R5-46 | yes | Text |
| R5-47 | yes | Text |
| R5-48 | yes | Runtime and model rules agree (§5.5 "The nudge", §6.2) |
| R5-49 | yes | Text |
| R5-50 | yes | Text |
| R5-52 | yes | Text |
| R5-53 | yes | Text |
| R5-54 | yes | Text |
| R5-55 | yes | Text |
| R5-56 | yes | Text |
| R5-57 | yes | Text |
| R5-58 | yes | Text |
| R5-59 | yes | Text |
| R5-60 | yes | Text |
| R5-61 | yes | Text |
| R5-62 | yes | `cancelOnGlobal` in `ui/scenario-timer-dispatcher.js:39`, `:67-68` |
| R5-63 | yes | Text |
| R5-64 | yes | Text |
| R5-65 | yes | `core/game.js` imports no `applyActions` (`:1-46`); `systems/interactions.js` does, so no new module enters the graph and no import cycle (`social-intel.js` imports only `global-writer.js`) |
| R5-66 | yes | Text |
| R5-67 | yes | The tests listed read `core/game.js` as text (`fight-styles`, `player-health-persistence`, `social-game-gating`, `npc-hostility-persistence`, `engine-fixes-engine-a`, `character-textures`, `player-regen`, `global-sync-declared`); none copies it |
| R5-68 | yes | Text |
| R5-69 | yes | Text |
| R5-70 | yes | Process |
| R5-71 | yes | `calculate_task_score` (`game.rb:54`) |
| R5-72 | yes | Text |
| R5-74 | yes | Text |
| R5-75 | yes | Text |
| R5-76 | yes | Process |
| R5-77 | yes | Process |
| R5-78 | yes | Process |
| R5-79 | yes | `hasEnding` needs `credits` or `closingCard` (`music/scenario-music-events.js:110`) |
| R5-80 | yes | `npc_mapping_unlocks_door?` (`game.rb:1279-1286`) |
| R5-81 | yes | Text |
| R5-83 | yes | Flush and its fast/slow split in `person-chat-minigame.js:1161-1210` |
| R5-84 | yes | Text |
| R5-87 | yes | Ownership |
| R5-88 | yes | Process |

## Part B: findings

| Id | Sev | Plan line | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| R6E-1 | major | 976-986 (§5.2 arming) | The one-shot ignore list is consumed **per handler**, not per emission. The dispatcher passes the same payload to every listener in turn (exact matches, then each `*` prefix). With two triggers whose `on` matches the restore pickup (`item_picked_up:key` and `item_picked_up:*`, or two `where`-less triggers on one type), the first handler drops the event and takes the id off; the second sees no id on the list and **fires on the restore**: the bug R5-1 set out to fix. Second, the list holds `id`s but the emit's `itemId` is `id \|\| lockRef(scenarioData)` (keys: `id \|\| keyId`), so an id-less restored item (common for start items) is never matched. Third (narrow): an NPC `#give_item` flushed at unload whose add POST lands but whose emit never ran comes back in `playerInventory` and is dropped as a restore, so a trigger on that gift never fires | `systems/npc-events.js:46-58`; `systems/inventory.js:655-662`, `:734-740`; `person-chat-minigame.js:1121-1137` (beforeunload flush) | Mark the **payload object**: when any handler sees an `itemId` on the list, add the payload to a module-level `WeakSet` and take the id off; every handler drops a payload in that set. Build the list with the emit's own key (`id \|\| lockRef(item)`, keys `id \|\| keyId`). Add a §11.3 case with two triggers on one restored item. Accept the flushed-gift case in §12 (or record `scenario_triggers_fired` keys for gift routes from ink instead) |
| R6E-2 | major | 1253-1258 (§5.5 step 3 gate check), 2068 (DL22 ⚠️) | Excluding "globals that `onClose`'s non-task actions set" from the gate check is only valid when something asks the server to conclude **after** step 4. A credits entry does (`concludeMission()` syncs twice, then `/conclude`). A **success-screen** ending has no such call: the success screen opens only from `handleMissionConcluded`, which only a `complete_task!`/`skip_task!` response triggers, and `recheck_pending_mission_conclusions!` runs only on a later task save. So a gate global set in step 4 leaves the mission unconcluded for good, no success screen, while the runtime calls the case settled and DL22 only warns. Also: the check runs only "when step 3 completed a task of the conclusion aim", but a skip returns the same `warning` (`game.rb:1496`, ignored by the client `skipTask`), and a re-run Finish (after the toast) completes nothing new, so the check is skipped and step 4 goes ahead with the gate still unmet | `objectives-manager.js:574-583`, `:654-679`, `:1098-1133`; `game.rb:1431-1463`, `:1473-1497`, `:2529-2562` (`check_mission_conclusion`, `recheck_pending_mission_conclusions!`), `:3084-3145`; `ui/success-screen.js:12-13`; `music/scenario-music-events.js:159-218` | DL22: **error** for a gate global set by `onClose` when the conclusion screen is `success` (or any ending with no credits entry on the ending global); keep the ⚠️ only for credits endings. Step 3: run the gate check on **every** Finish run in which every conclusion-aim task is settled (completed or skipped) and `missionConcluded` has not been seen, not only when this run completed one. Or simpler for both: run `onClose`'s `set_global`s that a gate names before the conclusion-aim tasks, then `syncConfirmed()`, so the server sees them at the conclusion call |
| R6E-3 | major | 2364, 2493 (fixtures A and C); §8 opening-room rule | Ink `#unlock_door` is refused by the server unless the NPC's record lists the room in `unlockable` (or has an `eventMappings` `unlockDoor`) and the NPC is encountered. The plan never mentions `unlockable`: HaX's "Go in" (`#verdict_close #unlock_door:a_sanctum`) and C's contacts opening `c_bedroom` both fail, and the §8 opening-room rule counts doors the server will not open. Already drafted as an integration item, not yet in the plan | `game.rb:1047-1051`, `:1289-1313`; `npc-game-bridge.js:77-110`; `integration/items_GAPSAB.json` (unlockable item) | Fold that integration item in: `unlockable` on HaX (A) and Ahmed/Baptiste (C); DL14 checks every `#unlock_door:<r>` against the speaker's `unlockable`; §8 counts such a door only when listed |
| R6E-4 | minor | 1302-1304 (§5.5 Favours, R5-37) | "On install … whose `favours[s].item` is still held, the runtime removes it" never finds the item: the runtime installs beside `watchReadinessGlobals` (`core/game.js:1663`), before `processInitialInventoryItems()` (`:2218`), and restored slots appear only after each add POST resolves. The remove POST also has no `keepalive`, so a favour flushed at `beforeunload` loses its removal more often than §5.5 assumes | `core/game.js:1663`, `:2218`; `systems/inventory.js:449-485`, `:645`; `systems/consumables.js:178-195` | Re-remove when the restore's `item_picked_up` for that id arrives (the R6E-1 hook), or check `gameScenario.playerInventory` at install, POST the remove at once and drop the slot when it lands. Send `remove_item`'s POST with `keepalive: true` (body is tiny) |
| R6E-5 | minor | 1018-1021 (§5.3), 1805 (§7.5) | The working tree's `phone-chat-minigame.js` (uncommitted, another agent, "F16") no longer batches: `_applyLineTags` runs each line's fast tags as `continue()` reaches it, slow tags chained per line. The "behind a player choice" rule is still safe, but the stated reason will be false once that lands, and slow tags (`give_item`, `remove_npc`) now run on a chain after the fast ones | working tree `phone-chat-minigame.js:676-684`, `:929-952`, `:1088-1124` (vs `git show HEAD:`) | Reword §5.3 to "phone chat applies tags as each line is read (F16) or, before F16, per batch: in both, a choice is the safe beat"; have F2 or F3 re-read this file at build time |
| R6E-6 | minor | 1286-1291 (§5.5 "The debrief, once") | `startMinigame` refuses while the player is knocked out and returns null. If `openDebrief()` launches then, its flag is set and "clears when the board closes", which never happens, so no debrief opens until a reload | `minigames/framework/minigame-manager.js:48-55` | Clear the flag when the launch does not leave a deduction board as `currentMinigame`; add `!window.playerIsKnockedOut?.()` to the idle wait |
| R6E-7 | minor | 1222-1226 (§5.5 Endings, movement) | `disableMovement` stops walking only. Inventory clicks (the phone, a case-file item) still open minigames during step 3's awaits, and the visualiser or credits can then open over a chat | `systems/inventory.js` item click handler (only `inventoryBlockedByForcedMinigame()`), `core/player.js:1008` | State it as accepted, or have Finish set the same guard `inventoryBlockedByForcedMinigame` reads until step 4 |
| R6E-8 | minor | 1206-1211 (§5.5 Retry) | `declineRetry()` "awaits the sync" but does not say which or what happens on failure: `stateSync.sync()` resolves false on an error and the debrief would show anyway; a reload before the next good sync re-offers the retry after the truth was shown (what R4E-2 forbade). The pagehide flush usually covers it | `state-sync.js:397-405`, `:472-484`, `:134` | Use `syncConfirmed()`; on false, show the debrief anyway and log, as Finish does |
| R6E-9 | minor | 1443-1444 (§6.1), 1212-1214 | "Close and Escape act as See the debrief" does not say the overlay stays open: the overlay's Esc ends it through `requestClose()` → `close()`, after which the runtime relaunches through the idle wait (a visible close and reopen, and `onComplete` runs) | `framework/social-overlay.js:80-115` | The board overrides `requestClose()` (and its Close button) on the retry and debrief views to call the runtime instead of `close()`; Finish then calls `close()` itself |
| R6E-10 | minor | 2485-2486 (fixture C) | `clone_keycard` is a presentation tag and is not flushed when the chat closes before the reply shows, so a `*` choice would be used up with no clone | `person-chat-pending-reply.js:10-18` | Say the badge choice is a sticky `+` choice (it already reads "offered while she is in the scene") |
| R6E-11 | minor | 933-940 (§5.2 event list), §4.6 | An NPC's ink unlock emits `door_unlocked_by_npc`, not `door_unlocked`; a trigger keyed on `door_unlocked` misses doors opened by `#unlock_door` (the route R6E-3 adds) | `npc-game-bridge.js:137`; `objectives-manager.js:288-292` listens to both | List `door_unlocked_by_npc` in §5.2 and the §4.6 notes; DL16 ⚠️ for a `door_unlocked` trigger on a room some NPC's ink unlocks |

Checked with no finding: event order (`restoreHostility` and saved globals before `game_loaded`; `main.js`
`once('game_loaded')` replay registered before the runtime's listener, so the visualiser is open before
`openDebrief` waits on it); `npc_ko` after `dropNPCItems` (`npc-hostile.js:338-347`); `intel_collected`
payload `{ id }` after the global write (`social-intel.js:197-202`); `room_entered:<room>` fires for the
start room on the first frame (`core/rooms.js:94`, `:2990-3016`), so a re-armed pending foe in the room the
player reloads in resolves; the credits header and ticker claims (`credits-theme.js:133-166`,
`bond-visualiser.js:244`); `#verdict_close` flushed on `beforeunload` ahead of state-sync's pagehide
(`person-chat-minigame.js:1129-1137`); the bootstrap filter keeps top-level `triggers` and `social`; server
`remove` accepts any item id (`game.rb:182-185`); `startIntelBoardMinigame(null, …)` tolerates a null
sprite (`minigame-starters.js:1145-1164`).

## Verdict

Not ready to build as written: three majors. R6E-1 reopens R5-1's own target whenever two triggers share a
pickup event; R6E-2 can leave a success-screen mission unconcluded while the runtime reports success; R6E-3
blocks fixture A's ending and C's bedroom route (already drafted as an integration item). Each fix is
local to §5.2, §5.5 step 3/DL22, and the fixtures plus DL14. No server change needed.

Counts: 0 blockers, 3 majors, 8 minors. R5 checks: 77 hold, 4 hold partly or with a gap noted
(R5-1, R5-2, R5-3, R5-19 stale reason), 1 does not hold (R5-37); gaps on R5-5, R5-6, R5-24, R5-34 are
minor findings above.
