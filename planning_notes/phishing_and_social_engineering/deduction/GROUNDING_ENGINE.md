# Grounding: engine hooks for the deduction board (2026-10-22)

Read-only survey by a Sonnet Explore agent, saved by the orchestrator as input for the plan. "JS"
means `public/break_escape/js`. Line numbers are approximate where marked "~". **Reviewers and
the planner must re-verify every claim they rely on against the code.**

## Top gaps

1. No `#grant_fact` ink tag. `grantFact` is called only by a pretext ask's `grants.intel`, an OSINT
   block, a mail highlight, and the `grant_fact` action in `applyActions`. NPC `eventMappings` have no
   hook for it either.
2. `applyActions` has no `fail_mission`, `remove_item`, `lock_door`/`lock_object`, `spawn_hostiles`,
   `set_hostile`, `lose_ally`, `ending_flag`.
3. Nothing re-locks a door or object at runtime. Nothing spawns NPCs at runtime.
4. Lockpicking, PIN, password, container, dusting, rfid, biometrics: no generic `onUnlock`/actions
   hook; they emit events only.
5. `socialIntelFact` and `social` in `scripts/scenario-schema.json` are closed
   (`additionalProperties:false`, `^_` allowed).
6. `case-file` modes in `scripts/minigame-data-schemas.json:96-100`: recon, defender, scope, plan.
   Board `SUPPORTED_MODES` is in the minigame file.
7. No per-NPC verdict notion. KO emits `npc_ko` and `npc_ko:<id>`.
8. `#report[:reason]` already exists (influence forced report, `service.report`); a deduction report
   verdict needs another name.

## 1. `JS/systems/social-intel.js` (249 lines)

- Facts in `scenario.social.intelFacts` `{ id: { text, subject, source, provides[], reduceNote, label, stale } }`;
  schema `socialIntelFact` `scripts/scenario-schema.json:653-666` (closed).
- Storage: global `se_intel_<id>` = true (`INTEL_PREFIX` :19, `intelGlobal(id)` :23). Must be declared
  in `globalVariables` to reach ink.
- `grantFact(id, {scenario, engine, npcId, source})` :181-214, flip-only: `writeGlobal`
  (`systems/global-writer.js`) → emit `intel_collected {id, fact, label, subject, source}` →
  `window.addNote("Evidence: <subject>", fact.text)` (`subjectLabel()` :155-167 names the person only
  once a name or subject fact is held, else "a colleague") → `window.stateSync.sync()` →
  `evaluateReadiness` if `social.intelBoard.readinessSlots`. Returns `{granted, id, label, subject, readiness}`.
- Readiness: `slotDone` :31, `computeReadiness` :47 (pure), `evaluateReadiness` :70 (writes
  `target_ready_<id>`, `osint_done` on flip), `watchReadinessGlobals` :116 (called from core/game.js).
- The "Noted: <label>" toast comes from the `applyActions grant_fact` case, not `grantFact`.
- Deduction must not use `intelBoard.readinessSlots` (that is phishing readiness and gates `osint_done`).

## 2. `JS/systems/apply-actions.js` (299 lines)

`applyActions(actions, {source='scenario', gameId=null})` :31, switch on `action.type`:

| type | params | notes |
|---|---|---|
| `set_global` | key, value | `writeGlobal` emitAlways; emits `global_variable_changed:<key>` |
| `grant_fact` | fact | `grantFact`; toasts "Noted", "Ready to approach" |
| `emit_event` | event_name | emits `{source}` |
| `complete_task` | taskId | `objectivesManager.completeTask` |
| `unlock_object` | objectId | emits `object_remotely_unlocked`; server persist only with `gameId` |
| `unlock_door` | room_id | pushes `gameState.unlockedRooms`; emits `door_unlocked`; opens sprites only when `source==='flag_reward'` |
| `hint` | message, title? | `gameAlert` |
| `give_item` | item | `window.addToInventory` |
| `tint_objects`, `lighting_dip` | | |
| `confirm_action` | text, onConfirm[] | recurses |
| `show_end_screen` | outcome failure/success/neutral, title, body, buttonText | `showEndScreen` :234; non-dismissible; button calls `window.close()` |

Unknown type → `console.warn`, no-op. Callers: object `triggerOnInteract[]` (`systems/interactions.js:777`),
legacy `onInteract.actions` (:1771), `timers[].actions[]` (`ui/scenario-timer-dispatcher.js:231`),
flag-station `flagRewards` (:785), esd-pushbutton `completionActions` (:213-232). **Not** called from
ink tags, NPC eventMappings, lockpicking, pin or container.

## 3. Intel board (`JS/minigames/intel-board/`)

- `intel-board-minigame.js` (834 lines, `IntelBoardMinigame extends SocialOverlayScene`),
  `board-model.js` (461 lines, pure builders). Registered `JS/minigames/index.js:178`. Base
  `JS/minigames/framework/social-overlay.js` (Close, Esc, `launchChild`, `socialOverlayParams`).
- Open path: `type:'case-file'` → `interactions.js:1067-1073` → `window.startIntelBoardMinigame(sprite)`
  (`systems/minigame-starters.js:1145-1164`) passing `mode: minigameData.mode || 'recon'`, title,
  returnTo, onComplete. `SUPPORTED_MODES` :41; `ENGAGEMENT_MODES` `board-model.js:346`. `_render()`
  branches by mode; unknown → "This board mode is not available yet." Also launched as a child from
  osint-browser (:648) and landing-page-builder (:782).
- Reads `params.social || window.gameScenario.social`, `window.gameState.globalVariables`; `rebuild()`
  :112 on every open.
- Recon: `buildBoardModel(social, globals)` `board-model.js:236`; `_personCard(t)` :615 (pushpin, name,
  status icon, `createInfluenceBar` from `ui/influence-bar.js`, facts, "???" slots, "From the call",
  readiness). `h()` helper :47, all `textContent`. Icons `/break_escape/assets/icons/` (`board-ready`,
  `mark-tick`, `mark-cross`, `mark-question`, `board-pushpin`, `board-slot-empty`).
- Persistence: one global `se_board_state` (`STATE_KEY` `board-model.js:10`), ids only:
  `{v:1, recon:{seenReady}, defender:{picks,indicators}, scope:{...}, plan:{...}}`. `readBoardState`
  :63; `_writeState` (~:754) `writeGlobal(STATE_KEY, next, {openChat:false})` then `stateSync.sync()`.
  Validator enforces declaration.
- Completion: `_applyDefenderCompletion` (~:361), `_applyEngagementCompletion` (~:593) write each
  global via `writeGlobal(name, true, {openChat:false})`, sync, rebuild; re-applied on open if the
  answers were complete but the global never landed. `closeResult()` → `{mode, completed, ready}`.
- Answer UI: `_exposureCard`, `_indicatorCard`, `_sortCard`, `_choiceCard`: option buttons with
  `aria-pressed`, feedback line, live region (`this._liveText`, `role=status`).
- `getTestState()` → `{board: {...}}`. Tests: `test/js/social-intel-board{,-defender,-engagement,-indicators}.test.mjs`;
  fixtures `test/js/fixtures/social/intel-board-*.json`.

## 4. Influence (`JS/systems/social-influence.js`, 821 lines)

- `social.characters.<id>`: `influence {global, min, max, start, rearmMargin, display}`,
  `thresholds[{id, at, when, icon, effects[]}]`, `channels`, `syncedVars`. Example
  `scenarios/lab_social_engineering/scenario.json.erb:292-326`.
- `thresholdRank()` :161 (wary 1, refuses 2, reports 3, lockout 4), `bandForLatched` :173,
  `normaliseCharacter` :190, `_runEffect` :561 with `setGlobal`, `endConversation`, `lockout`,
  `combatHostile`, `toast` (schema enum `scenario-schema.json:528`).
- No built-in "vaguer answers": wary/refuses are latched band flags + `setGlobal` flags; ink branches.
- `lockout` writes `<id>_lockout_until`/`_channel`; checked `interactions.js:622`, `mail-bridge.js:106`.
- `combatHostile` → `npcHostileSystem.setNPCHostile(...)`, emits `npc_became_hostile`.
- API `window.socialInfluence` (`installSocialInfluence` :800): `addInfluence(id, delta, reason, ctx)`,
  `setInfluence`, `report`, `getInfluence`, `getBand`, `getLatched`. Ink external `se_influence(delta, reason)`.
  Events `npc_influence_changed`, `npc_reported {character,npcId,reason,band}`.
- New effect types would need `_runEffect`, the schema enum and the validator.

## 5. Ink tags (`JS/minigames/helpers/chat-helpers.js`)

- `processGameActionTags(tags, ui, options={engine,npcId,runId})` :27; splits `action:param` on the
  first colon; returns `[{action,param,success,message}]`; needs `window.NPCGameBridge`.
- Callers: person-chat (`person-chat-minigame.js` :1126, 1396, 1412, 1418, 1560; `_tagOptions()` :898),
  phone-chat (:555, 770, 975, 1082), mail-runner (`systems/mail-runner.js:313`).
- Cases: `unlock_door`, `give_item`, `give_npc_inventory_items`, `set_objective`, `reveal_secret`,
  `add_note`, `trigger_minigame`, `influence_increased/decreased`, `remove_npc`, `hostile`,
  `transition_to_person_chat`, `clone_keycard`, `complete_task`, `skip_task`, `unlock_task`,
  `unlock_aim`, `set_global`, `portrait`, `lighting_dip`, `set_variable`, social `influence`,
  `influence_gained`, `influence_lost`, `report` (:603-690, social characters only).
- Adding a tag: a new `case` here; chat-helpers has no import of social-intel yet. Use `options.npcId`.
  Test pattern `test/js/social-tag-processor.test.mjs`.
- Ink globals reach stories only if declared or named `global_*` (`systems/npc-conversation-state.js:429`).

## 6. KO and hostiles (`JS/systems/npc-hostile.js`)

- `window.npcHostileSystem` (`initNPCHostileSystem` :81): `setNPCHostile`, `isNPCHostile`, `getState`,
  `damageNPC`, `isNPCKO`, `isNPCKOImmune`, `exportHostility`, `restoreHostility`, `resetHostilesForRespawn`.
- `damageNPC` (~:255) at HP 0: `isKO`, server sync `RoomStateSync.updateNpcState`, death anim,
  `dropNPCItems(npcId)`, emits `npc_ko {npcId}` and `npc_ko:<npcId>` (`JS/events/combat-events.js`),
  sets `globalVarOnKO` global, emits `task_completed_by_npc` for `taskOnKO`. Player punch
  `systems/player-combat.js:687`. `koImmune:true` blocks damage.
- `dropNPCItems` (~:455, private): unconditional drop of `itemsHeld`, synced as `npc_defeated`. No
  `dropOnKO`. Ink `#give_item` (`npc-game-bridge.js:209`) splices from `itemsHeld` first.
- Hostile routes: `#hostile[:npc]`, `NPCGameBridge.setNPCHostile` (:618), influence `combatHostile`,
  `behavior.hostile.startHostile` (`systems/npc-behavior.js:333, 365-375`). Event
  `npc_hostile_state_changed`. Saved over reloads.
- `"disableAttacks": true` disables player combat (`player-combat.js:15`); KO verdicts impossible then.
- No runtime spawn: `registerNPC` only from the lazy loader (`systems/npc-lazy-loader.js:95/129`).
  "Spawn hostiles" = pre-placed hidden NPCs toggled with `setVisible` + `setNPCHostile`.
- NPC `eventMappings` (`systems/npc-manager.js _buildMappingConfig` ~:656): `knot`, `bark`, `once`,
  `cooldown` (default 5000 ms), `condition`, `delayMs`, `setGlobal`, `completeTask`, `skipTask`,
  `unlockTask`, `unlockAim`, `unlockDoor`, `emitEvent`+`emitEventData`, `setVisible`, `patrolOverride`,
  `setPatrolSpeed`, `setDwellMultiplier`, `navigateToPlayer`, `changeStoryPath`, `sendTimedMessage`,
  `conversationMode`, `background`. No `hostile`, `grantFact` or `actions[]`.

## 7. Inventory, locks, endings

- `removeFromInventory(item)` `JS/systems/inventory.js:898` (DOM element; client only, no server call;
  other caller `systems/consumables.js:180`). No id-based remove; key ring in `window.inventory.keyRing`.
  Persistence across reload unresolved.
- Unlock: `unlockTarget` (`systems/unlock-system.js:667`), actions, `#unlock_door`,
  `NPCGameBridge.unlockDoor` (server validated). **No re-lock anywhere.** State lives in
  `doorSprite.doorProperties.locked`, `gameScenario.rooms[id].locked`, `window.rooms[id].locked`,
  `gameState.unlockedRooms`, plus the server.
- Player KO game over: `JS/ui/game-over-screen.js` (`CombatEvents.PLAYER_KO`), restart option.
- `show_end_screen` (failure red). No `failMission` concept and no server-side fail state.
- Mission conclusion: aim with `missionConclusion:true`, `conclusionScreen:{type}` →
  `ObjectivesManager.handleMissionConcluded(aim)` (`objectives-manager.js:1098`), emits
  `mission_concluded`; types `end_screen`, `bond_visualiser` (credits, `JS/music/bond-visualiser.js`),
  `success` (`JS/ui/success-screen.js`). Triggered when the server reports `missionConcluded` after a
  `complete_task` (:574, 675); replayed on reload (`JS/main.js:157-166`).
- Credits with per-line `condition` such as `"globalVars.hax_ko"` and a `closingCard` with `teaser`
  (`JS/music/closing-sequence.js`): the existing ending-flags mechanism.

## 8. Objectives (`JS/systems/objectives-manager.js`)

- Reconciled types `collect_items`, `unlock_object`, `unlock_room`, `enter_room` (:165-259); others manual.
- Events: `item_picked_up:*`, `door_unlocked`, `door_unlocked_by_npc`, `item_unlocked`, `room_entered`,
  `task_completed_by_npc` (~:290-310). `completeTask` via `applyActions`, `#complete_task`, NPC mapping,
  `taskOnKO`, `completesTaskOnOpen`, `task.onComplete`. `processTaskCompletion` (~:760) `onComplete:
  {unlockTask, unlockAim, setGlobal}`.
- No "task completes when global X" type. Aims `unlockCondition:{globalVariable, equals}` with
  `watchGlobalUnlocks(live)` (:727), live only when the scenario has `social`. Board task wiring uses
  an NPC eventMapping or object on the global (see lab).

## 9. Physical minigames: success hooks

| minigame | reports success by | actions? |
|---|---|---|
| lockpicking, pin, password, key | `unlockTarget` → `door_unlocked {roomId, connectedRoom, direction, lockType}` or `item_unlocked {itemId,...}` | none; listen to events |
| container | `item_picked_up:<type>`; `onRead`/`onPickup.setVariable` (~:480-515); `npc_items_changed` | setVariable only |
| text files, notes (`interactions.js` ~1590-1700) | `onRead`/`onPickup.setVariable` | setVariable only |
| dusting, biometrics | `systems/biometrics.js:95-97` `fingerprint_collected:<ownerId>`, `fingerprint_identified:<ownerId>`; `biometric_scan` | events only |
| rfid | `rfid_lock_accessed`, `card_emulated`, `card_cloned` (:90-299) | events only |
| log-filter | `completionActions[]`, `progressActions[]`; own `_executeActions` (:1348) handles only `set_global`, `complete_task` | partial |
| shredded-document | `stateWrites.onComplete` global | one global |
| backup-recovery | own `setGlobalAndNotify` | globals |
| esd-pushbutton, flag-station | full `applyActions` | yes |

Least invasive general hook: one scenario-level listener, e.g. `triggers: [{event, condition, once,
actions}]`, subscribing via `NPCEventDispatcher` (supports wildcards like `item_picked_up:*`) and calling
`applyActions`.

## 10. Timers and beats

- Scenario `timers[]` (`JS/ui/scenario-timer-dispatcher.js`): `id, label, delayMs, startOnGlobal,
  cancelOnGlobal, condition ("!globalVars.x"), setGlobal {k:v}, actions[] (applyActions),
  showCountdown, onceOnly`. Game time; resume after reload via `exportState`. Example
  `scenarios/m04_critical_failure/scenario.json.erb:2738-2830`. False condition marks fired without running.
- Also NPC eventMappings on any event, `timedMessages`, `timedConversation`, music events and credits.
- No generic scenario-level event → actions block.

## 11. Validator

- `scripts/validate_scenario.rb` (5546 lines) calls `ValidateSocial.check(...)` :5452;
  `split_schema_errors` (`validate_social.rb:90`); `--strict-social` :5227, :5528-5531 (exit 1 on social
  lint error when `social` present).
- `scripts/validate_social.rb` (598 lines): generic lints, then (only with `social`) `declared_globals`,
  `external_fallbacks`, `social_object_sprites`, `characters`, then `AREAS.each`. Registration
  :584-598 (require list `%w[mail osint board ...]` :584, `AREAS.concat` :588; Options and Awareness
  use `require_relative` + `AREAS <<` :593-598). `SOCIAL_OBJECT_TYPES` :38 includes `case-file`.
- Area pattern: `module ValidateSocial; module <Area>; def self.check(ctx)`; ctx =
  `Context(json, repo_root, valid_item_types, imports, social, raw)` with `own_globals`, `all_globals`,
  `import_names`; `Mail.err`, `Mail.warn_`, `Mail.facts(ctx)`, `Mail.declared_written(ctx, name, why)`.
  Board lints `scripts/validate_social/board.rb` (438 lines).
- Schema: `social` object from `scenario-schema.json:186` (closed); definitions `socialIntelFact` :653,
  `socialReadinessSlot` :680, `socialCharacter`.
- Evaluator for the validator: a Ruby port (tested against the JS one) or shelling out to node; to decide.

## 12. Node tests

- `bin/test-js [-j N] [-v] [files]`; `npm run test:social`; single `bundle exec node --test test/js/<f>.test.mjs`.
- Tests copy sources into `mkdtempSync` as `.mjs`, rewrite relative imports, set `globalThis.window`
  or a JSDOM window, then dynamic import. Examples `test/js/social-intel.test.mjs`,
  `test/js/social-tag-processor.test.mjs` (silences console).
- Validator tests `test/js/validator-social-*.test.mjs` spawn `ruby -e` requiring
  `scripts/validate_social.rb`, build a Context, call `<Area>.check`, regex the issues;
  "clean fixture, mutate one thing, expect one hit"; skip if ruby missing.
- Pure-module convention: `triage-scoring.js` ("Pure: no DOM, no imports, no randomness").

## 13. Reusable UI

- `JS/minigames/episode-runner/debrief-view.js` `renderDebrief(container, {result, set, strings, variant, onFinish})`:
  per-answer cards with verdict word and explanation, no-blame line. Template for the per-suspect debrief.
- `JS/minigames/inbox-triage/triage-scoring.js` `scoreTriage`, `bandFor`, `DEFAULT_BANDS`: reusable for grading.
- `JS/minigames/engagement-report/`: final-submit model; `report-workstation` object
  (`interactions.js:1119`, `minigameData: requiresGlobal, lockedMessage`); state in `se_report_state`;
  gated by `requiresGlobal`; `confirm` items.
