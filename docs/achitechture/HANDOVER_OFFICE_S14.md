# Handover: office life slice 14, avoidance at a distance, balking and parked needs (2026-11-06)

**Status: DONE (2026-11-06). Engine, bubbles, validator, schema, tests, showcase, live proof (games 689 to 691),
leash (game 692, pass), lab (game 693, score 100) and docs are all finished. The sections below are the
record; "Left" is no longer open.** Full test suite: 395 files pass. Plan: `OFFICE_LIFE_PLAN.md` section 10.

## Done (commits on main, in order)

- b7606efd0 engine (`systems/npc-needs.js`) and tests: `_avoidedAt` (an avoided NPC, either way, that
  is using the object, is queued for it, or stands in the same room within `avoidRadius` tiles of
  its approach cell; any NPC counts, needs or not; the NPC's own `needsHome` object is exempt),
  `_balks` (`maxQueue`), `_giveUpReason`, `_park` / `_unpark` / `_wakeParked`, `_recheck`
  (in `_advanceJob` for `goto_target` and `queued`), `_turnBack` (fallback through `_select` with
  the abandoned target excluded), `_grumble`, `onDoorOpened` (hooked to `door_opened` in
  `installNpcNeeds`), `getState().parked` and `.avoiding`; `_talking` returns a grumble.
  Constants `AVOID_RADIUS_TILES` 2, `NEEDS_DEFER_MIN` 4, `AVOID_BUBBLE_MS` 4000, `WAKE_BASE_MS`
  1000, `WAKE_STEP_MS` 500, `ENVIRONMENTAL_NEEDS`. `DEFAULT_CHATTER.grumble` is the one pool for
  grumble text. Log entries `turned_back`, `parked`, `unparked` (`timer`, `woken`, `set`); events
  `npc_turned_back:<id>`, `npc_need_parked:<id>`.
- efe347968 bubbles (`systems/npc-action-icons.js`): `thoughtBubble` (avoid, then pressing, then
  parked), `headCrop`, `FACE_FRAME`, `PARKED_BADGE`, `_renderAvoid` (face crop by `setCrop` on the
  avoided NPC's own atlas frame, scale 1, plus `icon:npc-avoid`), `_renderParked` (alpha 0.5, tint
  0x9a9a9a, badge lower right, red cross drawn over `npc-queue`). `NPC_ICON_NAMES` gains `avoid`,
  `closed` (16).
- e4408c2f9 validator and schema (shared files: `scripts/validate_npc_needs.rb`,
  `scripts/validate_scenario.rb`, `scripts/scenario-schema.json`): `deferrable` (warning for
  caffeine, thirst, hunger, rest), `maxQueue`, `needsDeferMin`, `needsCompany.avoidRadius`,
  `grumble` as a built-in pool.
- 5e7dec2c7 showcase (`scenarios/test_needs_sims`): Coffee Notice (`coffee_notice`, auto-placed),
  Marek's mapping on reading it, Sanjay gains a slow caffeine need, `needsCompany.avoids
  ["marek"]`, `needsDeferMin` 2, `maxQueue` 1, a mapping on `npc_left_post:marek` to
  `office_coffee`, objective task `see_turned_back` on `npc_turned_back:sanjay`; Marek
  `avoidRadius: 0` (keeps the slice 10 queue beat); scenario `chatter.grumble`; `see_outcast` title
  updated (Sanjay now parks with the storm cloud badge rather than waiting).
- b546cb3c8 the face bubble starts after the grumble (the speech bubble hides the thought bubble).
- a6f5fbc1f a `needs: {set}` mapping on a parked need unparks it first (found live).
- 3f5350d40 `_plain` uses optional calls (the slice 8 test rig has no `setAlpha`).
- Tests: `test/js/npc-avoidance.test.mjs` (21), additions to `npc-pressing-needs.test.mjs`
  (3 new); `avoidRadius: 0` added to the slice 8/10 avoidance cases in `npc-social-pairing` and
  `npc-queues` (those cases now say what they test: the slice 8/10 rules); the tick-cost
  "unreachable" test now expects parking. `bin/test-js` 395 files: all pass after 3f5350d40.
- Golden logs: **none changed.** The sims day (`GOLDEN_SIMS_DAY` 6a5f41a6...) is byte-identical;
  nothing parks in it because the kitchen and lounge load at 1:30, before any need with a source
  only there falls urgent, and nobody declares `needsCompany`. Every `npc-needs.test.mjs` fixture
  passed unchanged.

## Live proof so far (game 689, screenshots in the session scratchpad `s14/`)

- Coffee Notice read for real (`moveToNear`, `interact`): Marek left at clock 9250, Sanjay queued
  behind his claim, left at 10000, turned back at 10750 (`reason avoid`, `avoidedId marek`),
  grumble "Maybe the kitchen's quieter." overheard (`npc_overheard`, topic grumble, 58 px),
  `npc_need_parked` `no_source` with the kitchen shut.
- `b2-parked-closed-689-crop.png`: Sanjay's greyed coffee with the closed-door badge.
- `c1-parked-badges-689-crop.png`: Sanjay greyed coffee with the storm cloud (`avoid`: Marek in
  the queue again), Grace greyed rest and Tom greyed hunger with the closed door (`no_source`).
- Door release (`enter kitchen`, door at clock 180750): Grace woken at 181750, Sanjay at 182250,
  Tom at 182750 (1 s, then 0.5 s apart), each on its own tick. `d1-released-689.png`.
- Not yet captured: the face bubble (the first try was too slow and was deleted; freeze the
  needs clock with `npcNeedsSystem.manualClock = true` while the bubble kind is `avoid`, shoot,
  then set it back), the fallback to the kitchen, the queue badge, `deferrable: false`.
- Session log `s14/sess689.jsonl`: no page errors.

## Choices made without asking (list them in the plan's Built line)

1. After a turn-back the abandoned source is left out of that one fallback; the parked reason
   comes from the remaining sources (so the showcase parks `no_source` with the closed door).
2. Busy sources (claimed, cooling down) still mean wait, as before; only avoid, queue and nothing
   reachable park. A leash that leaves nothing permitted keeps the slice 2a/3b `blocked` behaviour
   (no parking).
3. Radius is the checking NPC's own: default 2 only when it declares `avoids`; an explicit
   `avoidRadius` opts in without avoids. The relation is both ways.
4. Hysteresis is per need episode (from the first turn-back until the need is met), so the
   fallback or a retry never turns back twice. The re-check runs each needs tick while committed
   and acts only on a change of who is there (no per-frame work).
5. A story need (`deferrable: false`) ignores the avoid and queue checks (takes the nearest as
   before) and shows the face bubble while someone avoided is there. `deferrable` is read from the
   NPC record each time, so a live check can flip it.
6. Parked level is `urgentAt + 1`; on release it is set to `urgentAt` (just urgent) and selected at
   once; the unmet clock is shifted by the time parked. No "existing per-NPC select offset"
   existed, so the wake is staggered by rank (id order): 1 s, then 0.5 s per parked NPC.
7. A grumble emits `npc_overheard` only (no `npc_chatted`, which would complete chat tasks such as
   `see_queue_chat`); no chattiness roll. The built-in pool is neutral ("I'll come back later.",
   "Not now.", "Later, maybe."); the kitchen line lives in the showcase pool.
8. Own post object exempt from the social check.
9. Showcase: Marek `avoidRadius: 0`; Sanjay `needsDeferMin` 2 and `maxQueue` 1 (for the queue-badge
   proof); the notice is a new `notes1` object, auto-placed.

## Left (exact next steps)

1. Live proof on :3001 headless, new game (`PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails
   runner tools/playtest/new-game.rb test_needs_sims`, then `session-start.sh --headless`, then
   `bootstrap {"tutorial":"decline","resume":"new"}`). Driver: `s14/drive.py <game> <mode>` (modes
   `probe`, `st`, `events`, `shot <name> [npc]`, `log <ids>`, `beat <tag>`, `cmd`, `ev`).
   - Face bubble: `probe`, then read the notice (`moveToNear`/`interact` `coffee_notice`; close the
     notes minigame with `MinigameFramework.endMinigame(false)`), wait for bubble kind `avoid`,
     freeze the needs clock, shoot, unfreeze.
   - Fallback: `enter kitchen` and back to the office first, then read the notice: Sanjay should
     turn back and go to `kitchen_coffee`.
   - Queue badge: Deadline Memo (Tom and Amara want coffee; kitchen shut, one queues), then
     `__test.needs.set('sanjay','caffeine',5)` with Marek at his desk: `maxQueue` 1 balks, badge
     `queue` with the red cross.
   - `deferrable: false`: `npcManager.getNPC('sanjay').needs.caffeine.deferrable = false`, Marek at
     the coffee (notice), then set Sanjay's caffeine: he queues anyway with the face bubble.
   - Contact sheet of nearest-neighbour crops (viewing only) in `s14/`; check every caption.
2. Regressions: `test_needs_leash` (`scratchpad/leash.py`), then one lab run per the session
   handover section 4 (Haiku, `scratchpad/lab.py`), score 100. Compare Chris's and Melanie's coffee
   timing and the keylogger and USB beat timing with game 685 (`scratchpad/s11/lab-685.jsonl`).
   Look for `parked` in the lab log: `no_source` parking reaches every needs NPC.
3. Docs: plan section 10 Built line (commits, games, the choices above); slice 14 row in
   `OFFICE_LIFE_HANDOVER_SESSION.md`; `NPC_NEEDS_SYSTEM.md` (selector 5.2: unacceptable targets,
   give-up reasons; parking; events `npc_turned_back`, `npc_need_parked`; log entries; fields
   `avoidRadius`, `maxQueue`, `needsDeferMin`, `deferrable`); sims README annotated example and
   live-proof rows; one line in the lab's `IMPROVEMENT_LOOP_LOG.md` "Office-life slices" note.

## Gotchas

- The turn-back in the showcase comes about 0.75 s after Sanjay leaves (Marek's claim becomes
  "in radius" quickly); the grumble shows for about 4 s, then the face for 4 s.
- Slice 10's Tom-queue mapping can send Marek to the coffee again, and Sanjay's mapping follows;
  while Marek queues, Sanjay parks with `avoid`. That is how `c1` got its storm cloud badge.
- `enter kitchen` moves the player through the door; the NPCs then queue behind the player in the
  doorway in screenshots.
- Lab idea for the other session: staff that declare `needsCompany.avoids` (for example a guard
  such as Len, by id) would turn back from a coffee he stands near; `_avoidedAt` counts any NPC
  with a position, needs or not. Not done: no lab edits.
