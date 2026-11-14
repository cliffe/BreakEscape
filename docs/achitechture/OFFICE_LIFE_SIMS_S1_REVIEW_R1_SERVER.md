# SIMS-1 review, round 1: server, sync and cheat resistance

Scope: the server's KO drop gate, `npcHostility` / KO record replay, `triggeredEvents` for the
once-only and delayed-print mappings, client forging against the cheat policy, and delta-only sync.
Branch `build/ol-sims` at `a734d5f57`. Read-only; verified against the saved state of the proof
games with `rails runner` (no writes). Plan sections 5.1 and 6.2 / 6.5.

Counts: **0 blocker, 1 major, 3 minor.**

## What is correct (verified against saved game state)

- **KO drop gate, held item vs carried world object.** Game 4144 (beat b, Ava KO mid-carry in the
  kitchen): `room_states.kitchen.objects_added = ["ava_folder"]` only. The carried `office_mugs`
  (a world object, not in `ava.itemsHeld`) is refused by `find_npc_held_item`
  (game.rb:1151) → `add_item_to_room!` rejects it (game.rb:489). The folder is present once (dedup
  by id via `npc_held_item_delivered?`, game.rb:510). Game 4120 (beat c, Ben KO at the kitchen
  cooler): `room_states.kitchen.objects_added = ["ben_notebook"]` only. Both are the NPC's post
  room's *neighbour*, so the drop is accepted only because the KO was recorded first
  (`npc_defeated?`, game.rb:479-480): 4144/4120 carry both the home-room `npc_states.<npc>.isKO`
  and `npcHostility.<npc>.ko`. The self-recording path (game.rb:499) needs
  `npc_in_room?(npc, room)` and so does not fire outside the post room, matching the plan's
  "accepted outside the NPC's room only after the defeat is recorded."
- **No double drop on reload.** `npc_ko_drop_pending_ids` (game.rb:1033) excludes delivered ids, so
  with the folder/notebook already in `objects_added` no `koDropPending` is re-issued; 4144/4120
  each hold the item once. `still_ko_after_reload` true in every KO report.
- **KO record claim-gated.** `npc_ko_claimable?` (game.rb:961) requires the NPC to be an
  encountered, non-immune, non-phone room NPC; `update_npc_state!` and `merge_npc_hostility!` both
  drop a KO claim that fails it. No secret, key, password or forged item is involved anywhere in
  this probe, so this sits inside the cheat policy (6.2).
- **Delayed-print key NOT saved when it does not fire.** Game 4124 (beat i2, reload inside the 6 s
  delay): `eli_asked` synced true, `eli_page_shown` false, `triggeredEvents` empty. Confirms the
  pending `setTimeout` (npc-manager.js:915-935) marks nothing: the `onceOnly` key is written only in
  `_handleEventMapping` (npc-manager.js:1431-1432), which runs after the delay. Plan claim confirmed
  for the negative case.
- **Once-only key saved when a non-conversation mapping fires.** Game 4122 (beat g):
  `triggeredEvents = ["gil:npc_left_post:gil:2"]`, saved once via the same persist path.
- **Eli KO cancels the print.** Game 4123 (beat h): `eli_ko` true, `eli_page_shown` false,
  `triggeredEvents` empty — the re-check of `globalVars.eli_ko !== true` at fire time holds.
- **Delta-only, bounded sync.** Every writer caps (`MAX_TRIGGERED_EVENTS` 2000, `MAX_NPC_VISIBILITY`
  500) and `objects_added` dedups by id. Observed per-game state is tiny (1 hostility entry, 1
  added object, 0-1 trigger keys). Nothing grows with play time.

## Findings

### Major

**M1 — Beat (i) positive persistence of the Eli-print key is unproven; no proof game ever saved it.**
`tools/playtest/needs-attack-probe.mjs:194-204` (`i_eli_print`) never reloads, so the browser closes
without a sync flush. Saved state of *every* i-print game is empty: 4128, 4127, 4057, 4070 all have
`triggeredEvents = []`, no `eli_page_shown`, no `npcHostility`. The plan 5.1 and the scenario README
(lines 70-72, live-proof row 130) assert the print's mapping is "`onceOnly` and saved" and that a
post-print reload "leaves the tray empty afterwards and nothing prints again" — the headline sync
guarantee for this slice — but no run demonstrates the key being written or the no-reprint-on-reload
behaviour. The code path looks correct (npc-manager.js:1431-1432 is the same persist that saved
`gil:npc_left_post:gil:2` in 4122), so this is a proof-coverage gap, not a confirmed defect.
Suggested fix: extend beat (i) to reload after the page lands, assert
`triggeredEvents` contains `eli:conversation_closed:eli:0`, that `eli_page_shown` is persisted, and
that no second page is revealed/printed; re-run into a fresh game and record it in the README table.

### Minor

**m1 — Sync budget overcounts `triggeredEvents` keys.** Plan 5.1 ("7 `triggeredEvents` keys") and
6.5 ("7") assume 6 once-only mappings plus the print, but `scenario.json.erb` has only 4 `onceOnly`
mappings total: dee's catch (line 243), eli's print (264), `object_revealed:eli_page` (265) and
gil's solo break (347). Actual ≤ planned, so the bounded-sync guarantee still holds, but the plan /
README count is stale. Suggested fix: correct the count to 4 in the plan's 5.1 and 6.5 sync lines.

**m2 — Beat (f) dee-catch once-only persistence unproven server-side.** Game 4121 saved state is
empty (the `f_dee_catch` beat does not reload/flush). The catch opens a `person-chat`, so its key
persists only on conversation close (`_persistTriggerOnClose`, npc-manager.js:1433-1435). Low risk
(best-effort, dialogue-gated per 6.2), but it is untested that a reload after the catch will not
reopen the catch conversation. Suggested fix: add a post-catch reload assertion, or note the gap in
the README as accepted best-effort.

**m3 — `object_revealed` pattern differs from the plan.** Plan 5.1 specifies `object_revealed:*`
with condition `data.objectId === 'eli_page'`; `scenario.json.erb:265` uses the scoped
`object_revealed:eli_page` with no condition. Functionally equivalent and proven ticking
`check_eli_page` (4128, client), but it diverges from the plan text. Suggested fix: align the plan
text to the scoped form, or note the equivalence.

## Note on the cheat policy (expected, not a finding)

A client that has met Ben can forge a KO drop of `ben_notebook` in Ben's own post room: the
home-room self-record (game.rb:499) trusts the browser's `isKO` the same way `update_npc_state!`
does, and `check_held_drop` / the `*_ko` globals are optional-task-only. This is the documented
policy (6.2: KO is a client claim gated only by `npc_ko_claimable?`; globals complete optional tasks;
no secret/key/forged item is exposed). Recorded as consistent with policy.
