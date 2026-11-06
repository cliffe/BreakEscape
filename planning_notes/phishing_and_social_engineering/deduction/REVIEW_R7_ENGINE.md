# Round R7 (confirmation), engine, runtime and board lens: deduction board plan

Target: `DEDUCTION_IMPLEMENTATION_PLAN.md` (4,811 lines) after the R6 and integration fold (S1 to S4,
`integration/FOLD_LEDGER.md` L-1 to L-105). Read against the working tree on 2026-10-23 (paths under
`public/break_escape/js/` unless stated). Read-only. `core/game.js` has another agent's uncommitted hunk
(git status), which P10-W must re-read before its edit.

## Part A: closure

### R6 engine findings

| R6E id (L id) | Holds | Evidence |
|---|---|---|
| R6E-1 (L-13) | **partly** | One payload object goes to every listener (`systems/npc-events.js:46-58`), so the `WeakSet` mark works for two triggers on one pickup. The list is still under-specified for id-less items, and the check has to come first in each handler: R7E-5 |
| R6E-2 (L-12) | **partly** | The gate `set_global`s now run and sync before the conclusion tasks (§5.5 l.1362-1364), and the check runs on every Finish (l.1377-1381). A re-run that passes the gate never asks the server again on a success-screen ending: R7E-1 |
| R6E-3 (L-57) | yes | `validate_npc_unlock` needs the NPC met and the room in `unlockable` (`game.rb:1289-1313`); a room load records its NPCs as met (`games_controller.rb` `track_npc_encounters`). §8, DL14, §9.2/§9.3 carry `unlockable` |
| R6E-4 (L-14) | yes, with a gap | Re-removal on the restore pickup is right (each emit follows the add POST, `inventory.js:449-485`, `:655-662`). It names "the §5.2 ignore-list hook", which lives in a module the runtime does not import: R7E-6 |
| R6E-5 (L-15) | yes | F16 is committed (`5585e191e`); `_applyLineTags` runs the fast tags synchronously, slow ones on a chain (`phone-chat-minigame.js:1100-1124`) |
| R6E-6 (L-16) | yes | `startMinigame` returns null while KO'd (`minigame-manager.js:51-55`); `window.playerIsKnockedOut` exists (`player-damage-interrupt.js:140`, `:176`) |
| R6E-7 (L-17) | yes, with a gap | The guard reads only `disableClose` (`forced-minigame-guard.js:14-18`). The new check has to sit before the `!current` early return: R7E-7 |
| R6E-8 (L-20) | yes | `syncConfirmed()` returns false after six tries or on a 403 (`state-sync.js:472-482`) |
| R6E-9 (L-21) | yes | Overlay Esc → layers, then `requestClose()` (`social-overlay.js:80-110`); its own Close calls `requestClose()` (`:51-63`); the base × is hidden because overlays set `disableClose` (`base-minigame.js:18-46`) |
| R6E-10 (L-98) | yes | §9.3 l.2983: a sticky `+` badge choice |
| R6E-11 (L-22) | yes | `door_unlocked_by_npc` (`npc-game-bridge.js:137`), listed in §5.2 and §4.6 |

### S1 fold rows (L-1 to L-56)

"Text" means the row is strings or authoring rules with no engine claim beyond the plan; checked only
for consistency with §4 to §6.

| L | Holds | Evidence |
|---|---|---|
| L-1 | yes | The enum ends `"lighting_dip", "grant_fact"` (`scripts/scenario-schema.json:3392`). `items` has no `additionalProperties: false`, so `facts`, `place`, `suspect`, `npcs`, `message` etc. need no new properties; `onConfirm` items are bare objects. `hint` was missing from the enum although `applyActions` has it (`apply-actions.js:124-129`) |
| L-2 | yes | Both `_beginSocialRun`s exist (`person-chat-minigame.js:916-922`, `phone-chat-minigame.js:1184-1192`) and run after `loadStory`, before the first Continue (`:491`, `:462`). `bindInfluenceExternals(engine, ctx)` and `resolveCharacter` exist (`social-influence.js:283-287`, `:556-560`). Each load makes a fresh `inkjs.Story` (`ink/ink-engine.js:10-22`), so a rebind never hits "already bound". Fallbacks are on (`:17`, `:21`) |
| L-3 | yes, with a gap | `conversationMode: "phone-chat"` opens the phone at `targetKnot` (`npc-manager.js:1166-1191`). Without it the validator gives ❌ (`validate_scenario.rb:2600-2603`). `barkDelay` is never copied into the config (`npc-manager.js:656-690`), so it is ignored. That branch ends any open minigame at once (`:1170-1173`): R7E-4 |
| L-4 | yes | §5.3 maps `trust` → `clear`; §5.4's `verdict` default kind; the §5.5 acceptance rule agrees with both |
| L-5 | yes | §5.1 `decidedBy` (counting off) is a subset of the §4.3 steps; exports unchanged; §6.2 `nudgeHow` |
| L-6 | yes | Text |
| L-7 | yes | `deduction-strings.js` is imported statically by the runtime and the model; §10.2 orders P10-H1 before P10-U1 |
| L-8, L-9 | yes | §13 text |
| L-10, L-11 | yes | `doFavour` does not check verdicts (l.1428); the KO rule is ink-side |
| L-12 | **partly** | R7E-1 (and R7E-10 for a gate global that is also the credits key) |
| L-13 | **partly** | R7E-5 |
| L-14 | yes, with a gap | R7E-6. `keepalive` on the remove POST is sound (`consumables.js:178`, same shape) |
| L-15 to L-17 | yes | As R6E-5 to R6E-7 above |
| L-18 | yes | `gameAlert` takes type `warning`; recovered flag from the faded list and the held set (§6.2) |
| L-19 | yes | `emptyText`, `state.saved` (§4.5, §5.4, §5.5) |
| L-20, L-21 | yes | As R6E-8, R6E-9 |
| L-22 | yes | As R6E-11 |
| L-23 | yes | Text |
| L-24 | **no, as specified** | "on the held set at the verdict" cannot be built: R7E-2 |
| L-25, L-26 | yes | `grade().counts` gives the summary fields (§5.1) |
| L-27 | **partly** | The scoping is right, but `byCount` "on the held set at the verdict" has the same gap: R7E-2 |
| L-28 | yes | `grantFact` returns `granted` (flip-only, `social-intel.js:182-197`), so "only the facts newly granted" can be counted; `readyToastText` is already imported by `apply-actions.js:3`; `grant_facts` is in the L-1 enum |
| L-29 to L-32 | yes | Board model fields (§6.2) |
| L-33 | yes, with a gap | `deduction_decidable_<s>` is written "with the nudge", and nudges are held while a chat is open: R7E-8 |
| L-34 | yes, with a gap | Announcements: held nudges are lost on a reload: R7E-8 |
| L-35 to L-37 | yes | Board rendering |
| L-38 | yes | Text (ink conventions) |
| L-39 | yes | `timedConversation` takes `delay`, `targetKnot`, `waitForEvent`, `skipIfGlobal`, `setGlobalOnStart` (`npc-manager.js:328-340`, `:1528-1570`) |
| L-40 to L-48 | yes | Text, or the §5.1 export (`profileSatisfiable`) |
| L-49 | yes | `gameConfirm(message, confirmLabel, cancelLabel)` (`notifications.js:199`); `applyActions` passes only the text today (`apply-actions.js:192-193`) |
| L-50 | yes | `hint` takes `title` (`apply-actions.js:124-129`) |
| L-51 to L-55 | yes | Text |
| L-56 | yes | `evaluateGlobalCondition` handles `globalVars.x`, `===` with a quoted string and `&&` (`utils/global-condition.js:24-68`), and is import-free, so the model can import it |

### Other checks asked for

| Claim | Holds | Evidence |
|---|---|---|
| `matchesWhere` uses strict equality, so `identified: false` matches | yes | The payload's `identified` is `stored.sample.identified`, always a boolean (`normaliseSample` `raw.identified === true`, merge ORs booleans; `biometric-samples.js:54-110`), so `false === false` holds and a missing key never matches |
| `fingerprint_collected` carries `identified` and the authored `objectId` | yes | `{ owner, ownerId, ownerName, objectId, roomId, quality, identified }`, `objectId` = `scenarioData.id` first (`biometrics.js:68`, `:91-95`); `ownerSlug("ded_a_marsh")` is unchanged |
| An unidentified excellent lift cannot be redone | yes | `collectFingerprint` returns null once the best lift is ≥ 0.85 (`biometrics.js:15`, `:26-28`). Below that the glass can be dusted again: R7E-9 |
| Q6 release and the lock | yes | `writeGlobal` emits only on a change and synchronously (`global-writer.js` step 4), so the three `once` triggers on `c_comms_locked` record the `act` verdicts before `verdict_close` in the same `onConfirm` list or tag line; a second lock write emits nothing |
| `t_a_thrown_out_end` `where: { value: true }` | yes | The payload is `{ name, value }` |
| Server accepts the gate globals | yes | `merge_global_variables!` writes any non-imported key (`game.rb:258-276`); the gate tests `== true` (`:3128-3147`) |
| Tests that copy modules | yes | No packet adds a static import to a file a test copies (`apply-actions.js`, `chat-helpers.js`, both chat minigames, `intel-board-minigame.js`, `forced-minigame-guard.js`); `core/game.js` is read as text only. The new `import()` calls run only in deduction paths |

## Part B: findings

| Id | Sev | Plan line | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| R7E-1 | major | 1377-1381, 1402-1404; §11.3 l.3891-3893 | A Finish re-run that passes the gate never concludes a **success-screen** mission. Step 3 runs the conclusion tasks even when the gate `syncConfirmed()` returned false ("the tasks still run"). The server then saves them `completed` with a `warning` and does not conclude. The check fails and the runtime toasts. On the re-run every task is already recorded (`t:`), so none is called again; step 3's first `syncConfirmed()` now delivers the globals, the check passes and step 4 runs. Nothing asks the server to conclude, though. `recheck_pending_mission_conclusions!` runs only inside a task save, and only the credits' `/conclude` calls `conclude_mission!`. The mission stays `in_progress`: no success screen, no completion. §11.3 tests exactly this re-run as a pass. Also, "`missionConcluded` has not been seen" never says how the runtime sees it | `game.rb:1390-1440`, `:1473-1497` (warning, no conclusion), `:2528-2562`; `games_controller.rb:1153-1166` (`conclude_mission`); `objectives-manager.js:574-576`, `:1098-1104` (`mission_concluded` event) | When the gate `syncConfirmed()` returns false, stop before the conclusion aim's tasks: leave them unrecorded, give movement back and show the "could not be closed yet" toast. The next Finish calls them after a good sync, and the server concludes on that call. Keep "the tasks still run" for tasks outside the conclusion aim. Name the signal: the runtime listens for `mission_concluded` and reads `breakEscapeConfig.missionConcludedAt` on load. Change the §11.3 case to "a re-run calls the conclusion task the first run held back" |
| R7E-2 | major | 407, 980-981, 1644, 1659-1660 (and L-24, L-27); §4.5 l.644-668 | The debrief needs "the held set at the verdict" for `byCount`, an early call's `settling` (L-24) and the wrong-call settling line. Nothing stores it. `deduction_state.verdicts` keeps only `decidedAtVerdict` and `atMs`; grants are flip-only booleans with no order (`se_intel_<id>`). `buildDebriefModel(social, globals)` is pure over the current globals, so it can only use the held set at debrief time. On any route where grants happen after a verdict (every `when: "anytime"` case), the lines describe the wrong moment, and a reload cannot recover it | `social-intel.js:182-197` (no timestamp or order); plan §4.5 (no held list), §6.2 signature | At `recordVerdict`, also store what the debrief needs from that moment, ids only: `verdicts.<s>.settling: [factIds]` and `verdicts.<s>.byCount: [{ clue, how }]`. Or store `heldN` and keep a `deduction_state.grantOrder` list. Have the model read them. Re-check the 2 KB estimate. Add a §11.4 case: a clue granted after a wrong call does not change that card's settling line |
| R7E-3 | major | 1311-1312 (close step 3), 1237-1243; 2830 (A's "Go in"), 3152 (C's "Get out") | Close step 3 "shows the retry panel or the debrief **at once**, through `showView` or a launch". "Runtime and board" says to launch when the current minigame is not the board. §6.1 and §5.3 say it waits until no minigame is open. Read literally, `#verdict_close` from a chat launches the board at once. `startMinigame` ends the current minigame synchronously, and the phone's cleanup nulls `currentConversationNPCId`. Fast tags run in one synchronous loop, so in HaX's `#verdict_close #unlock_door:a_sanctum` the unlock then runs with no NPC context and fails: the sanctum, A's altar and its ending are never reached. The same launch cuts any person-chat close knot whose `#exit_conversation` follows the tag | `minigame-manager.js:57-70`; `phone-chat-minigame.js:1476`; `npc-game-bridge.js:86-92`; `chat-helpers.js:66-90` (no await between fast tags) | Make step 3 call `openDebrief()` (`showView` when the board is current, else the idle wait), and delete "at once … or a launch". Put `#unlock_door:a_sanctum` before `#verdict_close` in A's "Go in". Add an authoring rule (and a DL12 ⚠️): no tag after `#verdict_close` on the same line |
| R7E-4 | minor | 2124-2131 (§7.8 handler-call rule, L-3); 2838-2840, 3148-3151 | A `phone-chat` mapping ends whatever minigame is open (`endMinigame(false)`) and opens the phone 500 ms later. A's `a_thrown_out` and C's `c_pull_out` are written at the verdict, from the accused's person chat (A) or from HaX's own lock line (C), so the call cuts that chat mid-reply. If the board is open, it closes the board. The pending-reply flush saves the state tags, but the reply lines and `#exit_conversation` are lost | `npc-manager.js:1166-1191`; `:602-629` (a `delayMs` mapping waits for the open minigame to close) | Give every handler-call mapping that a verdict, grant or global write can fire a `delayMs` (500 to 800). It then rings after the chat closes, with the condition re-checked. A pending delay is lost on a reload, and the §7.8 re-offer hub choice already covers that, so say so in §7.8 |
| R7E-5 | minor | 1066-1072 (L-13) | The ignore list needs three more rules. (1) An item with no `id`, `opens_lock` or `key_id` emits `itemId: undefined` (`lockRef` is `opens_lock ?? key_id`). As a set of ids, two such restored items collapse into one entry, and the second fires `item_picked_up:<type>` triggers on the restore. (2) For keys, "`keyId`" is derived (`lockRef(scenarioData) \|\| sprite.opens_lock`); it is not a stored field. (3) A handler that returns early (fired, `where`, `condition`) before it checks the list leaves the id on it, and a later real pickup of that id is then dropped | `utils/helpers.js:259-261`; `inventory.js:16`, `:655-662`, `:706`, `:734-740` | Keep a count map keyed by `<type>\|<emitted id>` (undefined included), built with the emit's own expression. Check it first in every handler, before `once`, `where` and `condition` |
| R7E-6 | minor | 1433-1436 (L-14) | Favour re-removal is tied to "the §5.2 ignore-list hook". That code is in `scenario-triggers.js`, which installs nothing when `triggers` is empty and which the runtime does not import (its static imports are listed at l.1203). There is no interface for it | plan l.1033-1040, l.1203 | The runtime listens to `item_picked_up:*` itself. For a suspect in `state.favours` whose `favours[s].item` id matches, it removes the item (`now: true`). Any later pickup of a favour item is removed too, which is right because the item was handed over |
| R7E-7 | minor | 1342-1346 (L-17) | `inventoryBlockedByForcedMinigame` returns false as soon as there is no current minigame. During step 3 the board is closed and nothing is open, so a check added after that line never fires | `forced-minigame-guard.js:14-18` | Say where it goes: `if (deps.deductionBlocking ?? window.deductionRuntime?.blockingInventory) return true;` first, guarded by `typeof window`. The §11.3 guard case runs with no minigame open |
| R7E-8 | minor | 1447-1449, 1454 (L-33, L-34) | (1) "Nudges are held while a chat is open" holds back `deduction_decidable_<s>` with the toast. The §7.4 pattern reads that global in the open chat (a report to Nair after a grant in the same chat), so the line is stale. (2) A nudge held when the page reloads is lost: the check runs only on `intel_collected`, and `state.nudged` was not written | plan §7.4; l.1443-1449 | Write `deduction_decidable_<s>` and `state.nudged` at once and hold only the toast (`state.pendingNudges`, shown on chat close and on `game_loaded`). Or run the nudge check on `game_loaded` and on every chat close |
| R7E-9 | minor | 2707-2717, 2788 (L-96 / S4 fallback) | `t_a_glass_smudged` fires on **any** unidentified lift: one below 85 % (which can be dusted again, "Dust again for a cleaner lift?") and a lift whose panel is closed after the peel (logged unidentified). The fallback then opens with "The print smudged" while the glass can still give the ring. That is harmless, since it adds a route, but the text says only an excellent lift does this | `biometrics.js:15`, `:26-28`; `dusting-game.js:410-412`, `:679-684` | Reword §9.2 and the hand check to "any lift logged as unidentified (an excellent one cannot be redone)", and soften the hint ("That print didn't give a name."). Or accept it in §13.6 |
| R7E-10 | minor | 1362-1364; DL22 l.2407 | Step 3 pre-runs every `onClose` `set_global` that a gate names. If that global is also the one a credits music entry keys on, the credits and `concludeMission()` start in step 3, before the conclusion aim's tasks and while movement is held. DL22 gives only a ⚠️ ("check the order by hand") | `music/scenario-music-events.js:159-218` | Pre-run gate `set_global`s only for success-screen endings (a credits ending calls `/conclude` itself), or never pre-run a global a credits entry keys on. Make DL22 ❌ when one global is both |

Checked with no finding: L-2's binding order and fresh story per load; the phone preload dry run (it binds
no `se_influence`; fallbacks are on, and it only changes ink-side values that are deferred to first open,
`phone-chat-conversation.js:850-940`); Q6's lock, release and exit-phone order (synchronous emits, `once`
triggers, no re-emit on an unchanged value); `#verdict:accuse` then `++ [Go on] -> key_after` in phone chat
(F16 applies the tag as its line is read, and the writer pushes the outcome into the open phone story,
`global-writer.js` `getOpenChat`); credits line conditions (full JS in `music/scenario-music-events.js:35-55`);
debrief notes conditions (`utils/global-condition.js`); reload after the gate `set_global` and before the
tasks (idempotent, no second emit); P10-W's `applyActions` import.

## Verdict

Not ready to build as written: three majors. R7E-1 is what is left of R6E-2: a success-screen mission can
still end unconcluded, now only after a failed sync, and §11.3 tests the bad path as a pass. R7E-2: the
debrief's "at the verdict" lines (made wider by L-24 and L-27) need state the plan never stores. R7E-3: the
close step's "at once" launch conflicts with §6.1. Taken literally, it ends HaX's phone chat before
`#unlock_door:a_sanctum` runs, so fixture A cannot reach its ending. Each fix is local (§5.5 step 3, §4.5
and §6.2, close step 3 plus one tag swap). No server change is needed.

Counts: 0 blockers, 3 majors, 7 minors. Closure: R6E-1 to R6E-11: 7 hold, 2 hold with a gap (R6E-4 →
R7E-6, R6E-7 → R7E-7), 2 hold partly (R6E-1 → R7E-5, R6E-2 → R7E-1). S1 rows L-1 to L-56: 47 hold, 5 hold
with a gap (L-3, L-14, L-17, L-33, L-34), 3 hold partly (L-12, L-13, L-27), 1 cannot be built as
specified (L-24).
