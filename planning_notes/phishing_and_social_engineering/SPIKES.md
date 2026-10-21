# Engine spikes (2026-10-21)

Repo: /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape. All repo files read-only. Experiments live in
/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/spikes/
(`font/`, `ink/`, `cmap.py`, `pylib/`).

Assumption: line numbers cited are from the working tree as it stood during this run.
Note: `git status` differed before/after by one file, `planning_notes/.../m09_digital_archaeology/stages/stage_2/storytelling_elements.md`
(new modification). I did not touch it; something else was editing planning notes concurrently.

## 1. Font: Atkinson Hyperlegible Next and Cyrillic

**Answer: No.** Atkinson Hyperlegible Next has zero Cyrillic. Source Sans 3 covers all the homograph letters.

**Evidence**
- Downloaded `ofl/atkinsonhyperlegiblenext/AtkinsonHyperlegibleNext[wght].ttf` (114,552 bytes, 392 glyphs) from github.com/google/fonts.
  fontTools cmap: 0 codepoints in U+0400-04FF. All of а е о р с у х і ј ѕ and А В Е К М Н О Р С Т Х: absent.
  cmap pages present: Basic Latin, Latin-1, Latin Ext-A/B, some punctuation/symbols (U+1Exx, 20xx-22xx, 25xx-26xx).
  Google's METADATA.pb lists subsets `latin`, `latin-ext`, `menu` only, which agrees.
- `font/ss3.ttf` = `ofl/sourcesans3/SourceSans3[wght].ttf` (2,478 glyphs): 156 codepoints in U+0400-04FF, all 21 test letters present.
  METADATA subsets: cyrillic, cyrillic-ext, greek, greek-ext, latin, latin-ext, vietnamese.
- Script: `spikes/cmap.py`. Fonts and licence files: `spikes/font/`.

**Licences**
- Atkinson Hyperlegible Next: SIL OFL 1.1, "Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors". No Reserved Font Name stated in the header I read.
- Source Sans 3: SIL OFL 1.1, "Copyright 2010-2020 Adobe", Reserved Font Name 'Source'. Using the unmodified font via @font-face is fine;
  a modified/subset-and-renamed build must not use the name "Source". OFL requires shipping the licence text with the font.

**Consequence for the plan**
Any mail/URL UI that shows a Cyrillic homograph (e.g. "раураl.com") in Atkinson would fall back to whatever system font the browser picks
(or tofu in Phaser canvas text), so the fallback glyphs would look visibly different. That breaks the exercise: the player could
spot the fake by font shape, or see a box. Atkinson for body text is fine; the homograph glyphs need a Cyrillic-capable face.

**Smallest change**
Keep Atkinson for UI text. Render homograph strings in Source Sans 3 (self-hosted, Latin + Cyrillic subset, OFL text shipped), via a
font-family stack `'Atkinson Hyperlegible Next','Source Sans 3',sans-serif` on mail/URL elements. The stack gives per-glyph fallback,
so no markup changes. For Phaser canvas text the same family string works, but the font must be loaded before the text is drawn.
Alternative: use Source Sans 3 everywhere in the mail UI so Latin and Cyrillic come from one design.

## 2. stateSync / _syncOnce and confirmation

**Answer: Partly.** No caller can learn that a given save was confirmed today. `sync()` returns a promise, but it resolves
`undefined` in every case (success, stale, network failure alike), so it cannot distinguish them.

**Evidence** (`public/break_escape/js/state-sync.js`)
- `sync()` lines 290-302: single-flight. If one is running, later callers share one queued `_next` run; otherwise
  `this._running = this._syncOnce().finally(...)`. Returns the promise.
- `async _syncOnce()` lines 304-319:
  - nothing to send (`buildChanges()` null): `return` (undefined), line 306.
  - success: `ApiClient.put('/sync_state', {...body, clientTs: nextClientTs()})` then `this.confirm(changes)` (line 314), logs, returns undefined.
  - stale: `if (response?.stale)` line 310: `console.warn`, `return` (undefined). Not confirmed; `confirmed` map is untouched, so the
    next `buildChanges()` re-includes the same changes (and `nextClientTs()` always issues a larger ts, so the retry clears staleness).
  - network failure / non-2xx: `ApiClient.put` throws on `!response.ok` (`api-client.js:70-72`), caught at line 316, `console.error`, return undefined.
    Nothing marked confirmed, so the next sync resends.
  - Retry exists only as the 30 s `setInterval(() => this.sync())` (line 57). No event, callback or return value reports success.
- Server (`app/controllers/break_escape/games_controller.rb:696-723`): stale returns `{success:true, stale:true}` (200) and applies only grow-only merges;
  a `merge_last_write_wins_sections` refusal returns **403** `{success:false,message}`.
- `confirm()` (lines 257-272) is where the "server now holds this" bookkeeping happens, per section/key.

**Consequence for the plan**
`syncConfirmed()` is a genuine addition; the design's description of `_syncOnce` ("reports success") is not true today. Stale handling already
works for correctness (resend next time). What is missing is only the signal.
One trap: a 403 refusal throws like a network error, so a naive retry-until-true `syncConfirmed()` would loop forever on a permanent refusal.

**Smallest change** (about 25 lines, all in state-sync.js)
1. `_syncOnce` returns a boolean: `true` after `confirm()`, `true` when `buildChanges()` is null, `false` on the stale branch and in the catch.
   `sync()` needs no change (it just forwards the value; existing callers ignore it).
2. Add:
   ```js
   async syncConfirmed({ attempts = 6, onRetry } = {}) {
     for (let i = 0; i < attempts; i++) {
       if (await this.sync()) return true;
       onRetry?.(i);
       await new Promise(r => setTimeout(r, Math.min(250 * 2 ** i, 4000)));
     }
     return false;
   }
   ```
   `this.sync()` already routes through the single-flight queue, and a shared queued run returns the same boolean to every waiter.
3. Cap attempts (the 6 above) and treat a thrown 403 as final: have `_syncOnce` return `false` but let `syncConfirmed` stop on a flagged `lastError.status === 403`
   (needs ApiClient to attach `error.status`, one line) so a refusal does not retry forever.
Subtlety to keep: a "confirmed" `true` from a shared run means the run that started after the call, which covers the caller's change, since `sync()`
builds changes at run start and a mid-flight caller is deferred to the next run. That is the property the plan wants.

## 3. Unlock endpoint and a takeable locked object

**Answer: Partly (yes, with a condition).** The endpoint never consults the player's inventory or position; it looks the target up
in the static scenario data under `rooms[*].objects`. A takeable `mail_terminal` is accepted **if it is declared as an object in some
room's `objects` array** (whether or not the player has picked it up). It is rejected ("Object not found", 422) if it exists only as NPC `itemsHeld`,
container `contents`, or was synthesised at runtime.

**Evidence**
- Route handler `games_controller.rb:835` `unlock`: calls `@game.validate_unlock(target_type, target_id, attempt, method)`; non-door falls to
  `unlock_object!` (line 865-ish), response contents via `find_object_in_scenario` (line 1597), which also scans only `rooms[*]['objects']`.
- `app/models/break_escape/game.rb:1008` `validate_unlock`. Object branch begins at line ~1086: first `object_unlocked?(target_id)` (already in
  `player_state['unlockedObjects']`, `game.rb:119`) grants; then line 1092-1105 loops `scenario_data['rooms']` -> `room_data['objects']`, matching
  `obj['id']`, `obj['name']`, or the client-generated `"#{room_id}_#{obj['type']}_#{index}"`. Not found: line 1173 `Object not found` -> `false`.
- Same room-only lookup in `find_scenario_object` (`game.rb:1242-1250`), used by PIN-cracker feedback and case-mismatch hints.
- Contrast: `find_flag_station_by_id` (controller ~2262-2283) deliberately also searches NPC `itemsHeld` and `player_state['inventory']`
  (comment: "takeable flag-stations ... end up here"). The unlock path has no equivalent.
- Lock checks that depend on inventory (key, lockpick) use `has_key_in_inventory?` / `has_lockpick_in_inventory?`, i.e. they check the player's keys,
  not where the locked object is.
- Client side (not tested): inventory items go through `systems/unlock-system.js:37` `apiClient.unlock(type, targetId, null, method)`, so the id sent must resolve per above.
  For the pick-up case the id is the item's `scenarioData.id`/`name`.

**Consequence for the plan**
The README's "unlock endpoint for a takeable item needs confirming" can be closed: it works for a takeable laptop declared in a room's
`objects` (give it a unique `id`). Pitfall: the by-name/by-id match is first-hit across rooms, so ids must be unique across the scenario;
and a `mail_terminal` handed over by an NPC or generated at runtime would fail.

**Smallest change**
None if the terminal is a room object with a unique `id` (author rule, easy validator check). If a terminal must live only in NPC `itemsHeld`
or `contents`, add a fallback after the rooms loop in `validate_unlock` (and `find_scenario_object`): search `player_state['inventory']`
(and NPC `itemsHeld`) for `item['id'] == target_id`, mirroring `find_flag_station_by_id`. About 8 lines. Keep pin/password `requires` read from the scenario copy, never from the client-supplied inventory item.

## 4. Ink EXTERNAL functions never bound

**Answer: It throws** (an uncaught `Error`, not a warning) on the first `Continue()`, and it throws for a story that merely *declares*
an unbound EXTERNAL, even if the knot being run never calls it. Nothing in the repo sets `allowExternalFunctionFallbacks`.

**Evidence**
- Wrapper `systems/ink/ink-engine.js`: `new inkjs.Story(...)` at lines 15/18 (global `inkjs` from `public/break_escape/assets/vendor/ink.js`; the flag string
  `allowExternalFunctionFallbacks` exists in the vendored runtime). `grep -rn allowExternalFunctionFallbacks public/break_escape/js` -> no hits.
  `continue()` (lines 28-95) catches, logs `InkEngine.continue() error` and **rethrows** (line ~91-93).
  `bindExternalFunction` (138-146) try/catches only the *bind* call.
- Bindings: only `phone-chat/phone-chat-conversation.js:128-173` `setupExternalFunctions()` (called from `loadStory`, line 88, after `engine.loadStory` and before the first continue)
  and `person-chat/person-chat-conversation.js:83-131`. Both bind exactly six names: `player_name, current_mission_id, npc_location, mission_phase,
  operational_stress_level, equipment_status`.
- Phone preload path: `phone-chat-conversation.js:735-760` (`tempConversation.loadStory(...)`, then `continue()` loop at ~760) uses the same `loadStory`, so it gets those six only.
- Bark path and the shared engine cache: `systems/npc-manager.js:~1205-1210` and `~2078-2080` create `new InkEngine(...)`, `loadStory(...)` and cache it in `inkEngineCache`
  **with no bindings at all**, not even `player_name`. The bark loader wraps `continue()` in try/catch (`npc-manager.js` ~1255) so a bark from such a story fails silently (`console.error`, no bark).
- Node experiment (`spikes/ink/t.mjs`, `t2.mjs`, compiled with `inklecate`, run against the repo's vendored ink.js in a vm context):
  - no binds: `Error: Missing function binding for externals: 'player_name', 'mail_score' (ink fallbacks disabled)`.
  - one of two bound: still throws for the other.
  - all bound: works.
  - a knot that does not call any EXTERNAL, nothing bound: **still throws** (validation is story-wide at first Continue).
  - `allowExternalFunctionFallbacks = true` with no ink-side fallback: throws ("no fallback ink function found").
  - `allowExternalFunctionFallbacks = true` with an ink `=== function mail_score(x) ===` fallback: works and returns the fallback value (`Score -1.`).

**Consequence for the plan**
Any ink story that declares a new EXTERNAL (mail/triage helpers) will break phone chat, person chat and barks unless every loader binds it, including loaders that
today bind nothing. A story the mail runner loads on its own engine is fine if the runner binds first. The design must not assume "unbound = no-op".

**Smallest change**
Pick one:
(a) Preferred, about 5 lines in `ink-engine.js`: in `loadStory`, set `this.story.allowExternalFunctionFallbacks = true` and require every EXTERNAL used by a story to have an ink-side
`=== function name(...) ===` fallback (also `EXTERNAL` + fallback is the idiomatic ink pattern). Unbound externals then degrade to the fallback instead of throwing.
(b) Add the new names to both `setupExternalFunctions()` and bind the same set in the two `npc-manager.js` loaders (three places to keep in sync).
Either way, add an `inkcheck`/validator rule that every `EXTERNAL` name is in the bound list or has a fallback function.

## 5. Task completion before its aim/task is unlocked

**Answer: Yes. The server accepts it and scores it.** The client also allows it for direct completions, though not for event-driven ones.

**Evidence**
- `games_controller.rb:1028` `complete_task` -> `app/models/break_escape/game.rb:1306` `complete_task!`. The only checks are: task exists, not already completed,
  and the per-type precondition (`unlock_room` -> room unlocked; `unlock_object` -> object unlocked; `npc_conversation` -> NPC encountered;
  `collect_items`, `submit_flags`; `enter_room` and `custom` trust the client, lines ~1320-1345). **No check of the task's or aim's
  `locked`/`active` status** (status lives in `objectivesState`, lines 1295-1303; `unlock_objective!` at 1556 only ever sets `active`, never read as a precondition).
  A 'locked' (or unrecorded) task just gets `status: completed`.
- Recorded, not queued or rejected: sets `tasks[task_id]` completed (line ~1350), runs `process_task_completion`, `check_aim_completion(task['aimId'])`,
  then `tasks_completed += 1` and `score = calculate_task_score` (70% tasks + 30% aims, `game.rb:51-58`).
- `check_aim_completion` (`game.rb:2269`) has no check for a story-gated aim: if every task of a not-yet-unlocked aim ends up completed, the aim is marked completed
  and `objectives_completed` incremented (so it scores) and `check_mission_conclusion` can fire. `concludeRequires` gates only `missionConclusion` aims.
- Client `systems/objectives-manager.js`: `completeTask(taskId)` (line 544) has no status gate (only early-returns if completed/completing), so ink tag
  `#complete_task`, `eventMappings.completeTask` (`npc-manager.js:781-786`) and `apply-actions.js:50` `complete_task` can complete a locked task.
  Event-driven handlers (lines 155, 340, 448, 465, 481, 501) require `task.status === 'active'` and silently ignore a locked task, so an early
  room unlock/pickup event is dropped, then caught only by on-load reconciliation (~line 234+).
  Aim side: `revealAimForTask` (line 725) reveals a locked aim when a task in it completes early, except story-gated aims, which stay hidden and whose
  `checkAimCompletion` is deferred (line 844) until unlocked. So client and server disagree: the server completes and scores such an aim immediately.
- `skip_task!` (`game.rb:1389`) is likewise ungated.

**Consequence for the plan**
Out-of-order completion is safe against rejection (nothing is dropped server-side) and counts toward score the moment it lands.
Two behaviours the plan must not rely on: (1) "task X cannot complete until its aim is unlocked" is not enforced by the server, so a shell/episode
design that depends on gating must gate in its own `concludeRequires` global or by the starter checking state before emitting;
(2) a story-gated aim can score before its unlock on the server while the client UI still hides it, so score, UI and unlock can drift.
The existing design (tasks completed by an NPC `eventMappings` after a done global, with `concludeRequires`) is consistent with this.

**Smallest change**
None needed if the plan keeps its own gating. If server enforcement is wanted: in `complete_task!`, after the not-found check, return
`{success:false, error:'Task locked'}` when `task_status(task_id) == 'locked'`. Caveat: `task_status` defaults to `'active'` when unrecorded
(`game.rb:1986-1988`), so this only stops explicitly locked tasks, and it would need `initialize_objectives` to seed locked statuses from the scenario
(`objectives_state_for_client` computes them for the client). Not recommended for this plan; document the behaviour instead.
