# D4 digest: NPC items, phones, helpdesk and PC use

Scope: what NPCs carry and do, for planners of four needs:
(a) a code-generator device an NPC carries that the player can borrow or take and use,
(b) a sign-in approval prompt sent to an NPC's phone that the NPC accepts or refuses by awareness,
(c) a helpdesk NPC who resets a password after checking who is asking,
(d) the server knowing when an NPC signed in at a PC.

Pointers are `file:line` in the worktree `.claude/worktrees/ops-plan`. Line numbers come from reads or greps made for this digest. Anything not read or not found is marked **unconfirmed**. No design recommendations are made.

Coverage note: `npc-needs.js` (6256 lines), `phone-chat` and `mail-client` (roughly 9000 lines together), `access_work.rb` (1408 lines) and `OFFICE_LIFE_PLAN.md` (4818 lines) were located and sampled by grep and targeted reads, not read in full. `OFFICE_LIFE_PLAN.md` was not read; the NPC event list comes from `NPC_NEEDS_SYSTEM.md` section 7 instead.

---

## 0. Status at a glance

- Carried items (server-tracked `npcCarry`): built on `build/ol-carry` (slices A, B), with slice C (reload put-back, KO drop) built per the plan docs. The live proofs in the docs report PASS on several beats. Checked against code: the server actions exist (section 1). The slice C plan says the reload live beats were blocked by a port conflict (`NPC_CARRIED_ITEMS_SLICE_C_PLAN.md:18-26`). The "not built" KO hook list in `NPC_CARRIED_ITEMS_PLAN.md:89-96` is stale, because the R1 fixes built KO drop (`NPC_CARRIED_ITEMS_PLAN.md:24-27`, `:453-467`). Treat the plan's "Slice C hooks (not built)" heading as out of date.
- Friendface phone item (`phone_friendface`): built per `FRIENDFACE_PHONE_ITEM_PLAN.md` (the plan includes R1 to R3 review changes, `:55-75`). Build log exists at `docs/achitechture/FRIENDFACE_PHONE_ITEM_BUILD_LOG.md`, not read.
- Awareness habits: `locksScreen`, `holdsDoors` (presets), `writesDown`, `password` (keys only, no preset), plus folded `screen`, `print`, `usb` (section 4).
- Pretext calls and landing-page or phish sends: built as client judge plus server-recorded phish evidence. There is no server pretext verdict (section 5).
- Server knowledge of NPC PC use: partly. Client emits sit-down and use events. The server receives frustration and borrow reports through `POST /npc_frustration` (section 6). Whether the server records a plain met PC sign-in is **unconfirmed**.
- Not built (grep, zero hits in `lib`, `app`, `public`, `scripts`, `tools`): `phishable`, `pretextable`, `challengesStrangers`.
- Not found in this pass: a code-generator or one-time-code item type. A lead is the keyring `token` kind (section 7). **Unconfirmed.**

---

## 1. Items on NPCs

### 1.1 Fields and data shapes

- NPC records start with `itemsHeld: []` at `public/break_escape/js/systems/npc-manager.js:343`. Scenario records normalise `itemsHeld` to an array at `public/break_escape/js/systems/scenario-npc-records.js:40` and `:70`.
- Carried-item sprites are tracked client side as `rec._needsCarried[itemId] = { sprite, roomId, key }`, set by `pickUp` (`NPC_CARRIED_ITEMS_PLAN.md:138-141`, cited by plan line numbers for `npc-needs.js:5580`). Live code shows `_needsCarried` writes at `npc-needs.js:5870`, `:6025`, with filters at `:5891`, `:5928`, `:5969`, `:6003`, `:6053`. Those helpers (`pickUp`, `consumeHeld`, `dropHeld`, `placeHeld`) were not re-read at their line numbers.
- Server carry state: `player_state['npcCarry'][npc_id] = { itemId, fromRoom }`, plus optional `fromPos` (`{x, y}` from the server's own stored copy, sanitised) (`NPC_CARRIED_ITEMS_SLICE_C_PLAN.md:151-161`). Keyed per NPC, at most one carried item per NPC (`NPC_CARRIED_ITEMS_PLAN.md:192-204`).
- Sync rule: `sync_state` drops any incoming `npcCarry`. Carries are written only by the four carry actions (`NPC_CARRIED_ITEMS_PLAN.md:49-52`, `:174-175` of the slice C plan).
- Friendface phone item fields: `type: "phone_friendface"`, `name`, `takeable: true`, `phoneOf` (NPC id, absent for the player's own phone), `site` (player's phone only) (`FRIENDFACE_PHONE_ITEM_PLAN.md:17-22`). `phoneOf` is forbidden on client-built items through `CLIENT_ITEM_FORBIDDEN_FIELDS` (`:29-30`).
- Droppable items: `droppable: true` makes a click in the inventory drop the item at the player's feet, persisted as `update_room` `add_object` with `sourceType: 'player_drop'` (`NPC_NEEDS_SYSTEM.md:981-998`).
- `needsTag` on an item (one tag string) draws NPCs with a matching interest (`NPC_NEEDS_SYSTEM.md:193`).

### 1.2 How the player gets an NPC's item

Routes found:

1. **Given (give).** `record_npc_gift!` (`app/models/break_escape/game.rb:817`) records a validated NPC give. The client give path is `public/break_escape/js/systems/npc-game-bridge.js:225-310`: it finds the item in `npc.itemsHeld`, sends a give request with `sourceNpcId` (`:275`), and on success splices the item out (`:310`). A refused give_item destroys the item, per a comment at `:286`, which is **not** what a reader would expect; treat it as a client-side note. **Unconfirmed** beyond the comment.
2. **Offered by story (phones).** An NPC hands over a Friendface phone only when the scenario offers it: a `give_item:phone_friendface` ink tag written literally, or an unfiltered `give_npc_inventory_items` tag (`FRIENDFACE_PHONE_ITEM_PLAN.md:57-60`, `:86-88`). The server checks that the NPC is met and its story offers the item (`:78-81`). The offer patterns live in `AccessWork.offers_item_text?`, read by the server and the validator (`:66-67`).
3. **Knock-out drop.** When an NPC is knocked out, `dropNPCItems` drops its `itemsHeld` to the room floor (`public/break_escape/js/systems/npc-hostile.js:777-833`, `:982`). A KO drop of a phone is always allowed (`FRIENDFACE_PHONE_ITEM_PLAN.md:57-60`, `:69-71`). The KO record itself is client-trusted (`:84-85`).
4. **Carried needs items (office life).** An NPC carries an object it chose. Pick-up is `carry_object!` (`game.rb:1395`). The player takes it from the NPC's served `itemsHeld` through the normal inventory flow. `apply_npc_carry!` serves it in the hand (`game.rb:1618`).
5. **Dropped by the NPC.** Put-down is `put_down_carried!` (`game.rb:1469`). A consume is `consume_carried!` (`game.rb:1501`). KO is `ko_drop_carried!` (`game.rb:1521`).
6. **Pickpocket or container NPC mode.** `game.rb:4930` and `:4985` comments say an NPC give or a pickpocket calls `record_npc_gift!`. `public/break_escape/js/minigames/container/container-minigame.js:2633-2639` removes an item from `npc.itemsHeld` when the container is in NPC mode. The pickpocket UI was not read. **Unconfirmed** beyond these pointers.

### 1.3 What the server checks

Carried items (`NPC_CARRIED_ITEMS_PLAN.md:302-344`, the plan's security section, which matches the built actions as far as checked):
- A carriable allowlist: scenario objects with a `needsTag`, excluding locked content, `requires`, `opens_lock`, `keyPins`, non-empty `contents`, and key or credential types. The plan states this as the rule.
- `carry_object` requires `item_in_room?(fromRoom, itemId)` and `room_unlocked?(fromRoom)` (`:317-319`).
- The NPC must be a scenario NPC that is a needs NPC (`:320-323`).
- `put_down_object` requires `room_unlocked?(toRoom)` and reachability from the NPC's room (`:324-328`). Reachability is the pick-up room's adjacency via `rooms_connected?` (`:38-41`).
- Put-down, consume and KO drop act only when `npcCarry[npc_id].itemId == itemId` (`:333-335`).
- The object is rebuilt from the server's scenario definition. The client supplies only `position` (`:329-332`).
- The live proof shows the unlocked-room gate returns 403, not 422, for a put-down into a locked kitchen (`NPC_CARRIED_ITEMS_PLAN.md:77`).

Friendface phone (`FRIENDFACE_PHONE_ITEM_PLAN.md`):
- The open route `POST /games/:id/friendface_phone` with `{ npc_id }` looks up a `phone_friendface` in `player_state.inventory` with matching `phoneOf` (or absent for null). None gives 403 `{error: 'no such phone'}` with no write (`:109-114`). Route at `config/routes.rb` (inferred from the controller `before_action` list at `games_controller.rb:29`). Pundit `friendface_phone?` is `show?` (`:114`).
- `add_object` refuses an unsourced Friendface phone (`:59-60`). An NPC-sourced add is stored only when the NPC's KO is recorded, or when its story offers the item and the player has met it (`:62-65`).
- Phone taken: the server records `phonesTaken` on first arrival in inventory by any route (`:55-57`). `Game#scenario_room_npc` merges `phone: false` (`:95-98`).
- A held phone counts only when its id matches a phone the scenario declares (`:59-60`).

### 1.4 Can an item show live changing content (like a code)?

- Items are plain scenario objects. The NPC's `usePayload` is opaque and NPC-owned, never on the object, and a clone rides on each `npc_used` (`NPC_NEEDS_SYSTEM.md:40-41`, `:116`, `:1039-1040`).
- Object fields for live content: none found. `NPC_NEEDS_SYSTEM.md:1002-1004` says what a dropped item is belongs to the scenario, not the engine.
- Client-side: the Friendface phone blip is an in-memory unread count that resets on reload (`FRIENDFACE_PHONE_ITEM_PLAN.md:116-130`).
- Phone-chat minigame: the phone-chat code is about 9000 lines under `public/break_escape/js/minigames/phone-chat/`. Not read. **Unconfirmed** whether it shows a live code.
- **Unconfirmed:** whether any item currently shows a time-varying value on the server. None found by grep in this pass.

---

## 2. NPC phones

What exists:

- **Friendface phone** item and opening route (section 1, and `FRIENDFACE_PHONE_ITEM_PLAN.md:45-53`, `:109-114`).
  - An NPC's phone opens the osint browser at the NPC's profile, limited to its feed site (`:32-35`).
  - The player's own phone opens at the site home (`:36-38`).
  - Opening never reveals a post and never moves the feed (`:39-43`).
- **Blip**: `public/break_escape/js/systems/friendface-phone.js` (203 lines, read in part by its plan `:116-130`). It listens to `npc_posted:*`, which `social-feed.js` emits only for a post the server revealed. A blip is held while a person-chat or full-screen minigame is open (`:121-124`).
- **Phone-chat minigame**: `public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js` (2253 lines), `phone-chat-conversation.js` (1580), `phone-ringer.js` (1333), and related. `phone-chat-conversation.js:337-351` sets `has_<type>` from `itemsHeld`. Not read further. **Unconfirmed** data shape.
- **NPC phone as a need**: `social_media` need, with `"phone": false` to opt out. The phone never parks the need (`NPC_NEEDS_SYSTEM.md:946-956`). A use is the `self` job, which is distracted and does not leave the post, and emits `npc_used_phone:<npcId>` (`:960-966`).
- **NPC phone is a guard**: while on the phone, an NPC is skipped by sight challenge (`:967-969`).
- **Desk phone**: an owner on its own phone does not answer its desk phone (`:971-973`).
- **Mail client**: `public/break_escape/js/minigames/mail-client/` (about 6000 lines, not read). Phish targets come from `social.phishTargets` (`mail-scheduler.js:603`, `:700`; `mail-bridge.js:66-69`).

Player actions on a phone (confirmed by the open route and blip): open it, read the feed and profiles, see a blip. Calling or messaging an NPC through the phone-chat minigame goes through the pretext or phone-chat path in section 5 (**unconfirmed** which path a given NPC phone uses).

---

## 3. Time

### 3.1 Client game clock

- `public/break_escape/js/systems/game-clock.js`: class `GameClock` (`:70`), `exportState` (`:186`), `currentClockText` (`:197`), `parseGameClockStart` (`:32`), `parseGameClockRate` (`:54`), `parseGameClockAnchors` (`:60`). The clock state is sent in `sync_state` as `scenarioClock` (`:7`).
- `gameClock.elapsedMs()` is wall time since start minus closed time. It survives reload, never pauses, and `rate` and anchors change only time of day (`NPC_NEEDS_SYSTEM.md:60`).

### 3.2 Needs clock

- The needs system does not use the game clock for decay. It uses a frame-step accumulator (`NPC_NEEDS_SYSTEM.md:405-411`). Each frame adds `min(Δ, 1000)`, skipped while `isVmContextActive()` (`:405-407`). One tick per 250 ms (`:412`).
- Decay per tick: `decayPerMin × 250 / 60000` (`:413`). "Per minute" means needs-clock minutes at real speed. The story rate and clock anchors are ignored on purpose (`:416-418`).
- Decay continues in conversations and minigames (`:416`).
- Dwell times are measured on `this.clockMs` (`npc-needs.js:3633-3646`, `job.useUntil = this.clockMs + secs * 1000`).

### 3.3 Server clock

- No server notion of needs or game minutes was found. Grep for `gameMinutes`, `needsClock` and `gameClock` in `app` and `lib` returned nothing. **Inferred**: the server does not run the needs clock.
- The server does timestamp some records. Example: `capture_now_ms` is used for `sePhishSends` `at` (`app/models/break_escape/capture_proofs.rb:446`). The frustration workaround logic uses durations and `retryAfter` (`NPC_NEEDS_SYSTEM.md:922-923`).
- Frustration dwell floors use server-side timing (`app/models/break_escape/npc_frustration.rb:366-378`, `borrow_dwell`). Read only in part.

### 3.4 Seeded rolls and determinism

- Per-NPC RNG: `mulberry32(fnv1a32(seed + ':' + npcId))`, used only for `jitterPct` (`NPC_NEEDS_SYSTEM.md:1128`). Every other choice is an ordering, not a random draw. No `Math.random()` in the module (`:1129`).
- Scenario seed: `npcNeedsSeed`, default the scenario name (`:275-276`).
- Leftover item roll: `roll(npcId, "left:<leaveCount>:<itemId>")` (`:253`). Left-behind items roll only with `leftBehindItems` (`:265-266`).
- Decision log: ring buffer of 2000 (`:1131-1134`), read by `npcNeedsSystem.getLog()`.
- Manual clock: `new NPCNeedsSystem(world, {manualClock:true})` or the test bridge moves the clock only via `step(ms)` (`:1135-1137`).
- Test bridge: `window.__test.needs` with `setSeed`, `setManualClock`, `step`, `state`, `log`, `set`, `overlay` (`:1141-1144`). It controls the clock only and never triggers a use directly.
- Reload: needs levels reset to `initial`, no state sync, reveal slots filed on sight (`:1148-1153`).

---

## 4. Awareness and habits

### 4.1 Where expansion happens

- Module: `lib/break_escape/npc_habits.rb`, `module NpcHabits` (`:15`). Plain Ruby, no Rails (`:8`). Used by the server (`Game#prepare_scenario_data!`), the validator and the dungeon graph (`:10`).
- `expand!(scenario)` (`:127-176`) runs the whole expansion on the scenario hash in place and returns a report. It is idempotent (`:126`). It works out all plans first, so one NPC's fill cannot change another's (`:131-133`). It rescues `StandardError` and returns the report so far (`:171-175`).
- `expanded_copy(scenario)` (`:315-319`) is the non-mutating variant for scripts.
- Stamping: `stamp_room_object_ids!` (`:321-335`) gives room objects an id when missing: `"#{room_id}_#{type}_#{i}"`.

### 4.2 Habits and values

Source: `lib/break_escape/npc_habits.rb`.

| Habit | Allowed values | Source |
|---|---|---|
| `locksScreen` | `never`, `sometimes`, `always` | `:22` |
| `writesDown` | `true`, `false` | `:23` |
| `password` | `strong`, `guessable`, `reused` | `:24` |
| `holdsDoors` | `true`, `false` | `:25` |
| `passwordPattern` (parameter, not a habit) | non-empty string | `:29`, `:55-57` |

Presets (`:32-36`):
- `low`: `locksScreen` never, `holdsDoors` true.
- `medium`: `locksScreen` sometimes, `holdsDoors` true.
- `high`: `locksScreen` always, `holdsDoors` false.
- `writesDown` and `password` are in no preset (`:31`).

Lock chances (`:38`): never 0, sometimes 0.5, always 1. Lock fields the habit can set (`:40`): `lockChance`, `locksScreenOnLeave`.

Folded office-life sub-blocks, not awareness habits (`:42-45`): `screen`, `print`, `usb`.

### 4.3 Effects, as read by the code

- **Awareness level**: `low`, `medium`, `high` (`:18`). Its own `awareness` field, else the first matching role in `identity_roles` (`:60-72`). Source is `:own` or `role:<name>` (`:59`).
- **Expansion rule**: an authored field is never changed by a habit (`:12`). The expanded `habits` is the preset merged with authored values (`:96-104`). A `habits` block with a non-folded key is an awareness block, even if invalid (`:93-95`, `:100-103`).
- **`locksScreen`**: `fill_screen_habit!` (`:195-218`). It writes `habits.screen.lockChance` on the NPC unless the author wrote `screen`, the NPC owns no workstation, or every owned PC sets its own `lockField`. Owned workstations are read from `owner_id` (`:180-190`).
- **`holdsDoors`**: gate doors. A gate's `noHold` list is written for each gate that opens for an NPC with `holdsDoors: false` (`:147-149`, `:277-283`). `doorway_problem` (`:254-271`) says when a gate is dead (`:no_direction`, `:no_connection`, `:shadowed`). The client reads `noHold` in `door-gates.js` (header at `public/break_escape/js/systems/door-gates.js:13`).
- **`writesDown`**: `game.rb:3405-3411` `written_down?(npc)` is true when the habit is `true` or the NPC has a done `writes_down` workaround. Read by the server. The client shows a sticky note through `postit-marks.js` (`:7`, `:32` reads `hasPostit`). The server sets `hasPostit` at `game.rb:4475` for a login PC. The validator checks `writesDown` needs an account, an owned sign-in PC, and a room for the note (`scripts/validate_npc_habits.rb:233-244`). Dungeon graph: `scripts/generate_dungeon_graph.rb:398-400`.
- **`password`**: in `HABITS` (`:24`), read by no code found beyond the header. **Unconfirmed** whether any reader uses it.
- **`passwordPattern`**: the password's clue text. `clues.rb:407` `find_object` names the object a pattern points at. Authoring time only (`clues.rb:1-12`).
- **`usb`**: `access_work.rb:1165-1170` builds `work.usb`. `access_work.rb:1213` reads `npc['habits']['usb']`. `game.rb:7344`-ish: stripped from the shipped `habits` (`SHIPPED_HABIT_KEYS`, comment block `game.rb:7335-7345`).
- **`screen`** and **`print`** ship to the client (`game.rb:7335-7345`). `owner_claim.rb:157`, `:235`, `:260` read them.
- **Sanitised for the client**: `habits` other than `screen` and `print` are deleted before ship (`game.rb:7335-7345`). A new key is hidden by default (allow list, not deny list).
- **Workaround to habit mapping**: `writes_down` workaround sets `hasPostit` (`app/models/break_escape/npc_frustration.rb:475`).

### 4.4 Not built

- `phishable`, `pretextable`, `challengesStrangers`: grep found no hits in `lib`, `app`, `public/break_escape/js`, `scripts` or `tools`. These are not built.

---

## 5. Pretext and phishing, in outline

### 5.1 Pretext calls (client judge)

- Data: `social.pretextNpcs` (array of calls). Each has `callId`, `character`, `knows`, `susceptibility`, `unverifiableCost`, `lines`, `asks`, `outcomes`, `tells`, `tuning`. The judge's header describes the shape (`public/break_escape/js/systems/pretext-judge.js:24-28`). Example files: `scenarios/test_dm_social/scenario.json.erb`, `scenarios/test_social_m5_channels/scenario.json.erb`, `scenarios/lab_social_engineering/scenario.json.erb`, `scenarios/ca03_helpdesk_reset/scenario.json.erb`, `scenarios/ca12_visitor_tailgater/scenario.json.erb`. Shapes were not read in full. **Unconfirmed** beyond these pointers.
- Character config: `social.characters` with `thresholds[]` and `influence` `{min, max, start, rearmMargin}` (`pretext-judge.js:24-28`).
- `judgeUtterance` and `judgeAsk` are pure functions (`pretext-judge.js:1-8`, `:344-423`). They never write globals.
- **Verification**: an ask lists `verification` facts. It returns `pending` (inkResult 2) until each fact is in `session.provenFacts` or `session.verified[askId]` is true (`pretext-judge.js:366-374`). The judge reads facts, not wording (`:1-8`, "Nothing is scored on wording").
- **An ask succeeds** when `influenceAfter >= floor` and verification is met (`pretext-judge.js:382-405`). The floor is `ask.floor`, else the `refuses` threshold, else no floor (`:369`, `:378-379`). A refusal counts toward `maxRefusals` (default 2, `:52`), after which the call is reported (`:401-405`).
- Results: `granted` (1), `refused` (0), `pending` (2) (`ASK_RESULT`, near `pretext-judge.js:66`).
- Influence threshold ids: `wary` (band 1), `refuses` (2), `reports` (3), `lockout` (4) (`pretext-judge.js:93-95`, `bandForInfluence`).
- Binding: `public/break_escape/js/systems/social-influence.js:607-610` finds the call by `character` and reads `outcomes.reported.line`. `_endConversation` and `_startLockout` are at `:614-640` (from read). Lockout writes `lockoutUntilGlobal` and `lockoutChannelGlobal` (`:637-640`).
- Entry point: `public/break_escape/js/systems/interactions.js:651-700`. A desk phone or an NPC with a `callId` opens pretext-prep, not plain dialogue (`:651-654`). A lockout is checked first (`:678`). If every ask's grants are held, the call is refused with a notice (`:681-690`). `everyAskHeld` and `grantsHeld` (`:652-668`) read `se_intel_<id>` and setGlobal grants.
- Minigame: `public/break_escape/js/minigames/pretext-prep/pretext-prep-minigame.js` (392 lines) reads `social.pretextNpcs` at `:67`. `pretext-card.js:99` reads `spec.knows`.

### 5.2 Server checks on pretext

- No pretext verdict on the server. `grep -n pretext app/models/break_escape/game.rb` found no hits. `app/models/break_escape/capture_proofs.rb:912` and `:962` only check a landing-page `check.pretextId` against authored menu ids (not the call outcome).
- The server does not verify `pretext_ask` results. The judge's verdict is client only.
- Pretext state is saved as `pretext_<callId>_state` in globals (`interactions.js:697`, read from `globals[...]`).
- **Inferred**: the pretext outcome reaches the server only as scenario globals through the normal sync. Not checked.

### 5.3 Phishing (server-recorded evidence)

- Landing page build: `POST /games/:id/se/landing_page` (`games_controller.rb:1892-1908`, route at `config/routes.rb:61`). The body carries `{pageId, targetId, choices}`, and the server recomputes the verdict with `BreakEscape::PhishScore` (`lib/break_escape/phish_score.rb:1-30`). The body carries no score. Recorded by `record_landing_page_build!` (`capture_proofs.rb:336`).
- Phish send: `POST /games/:id/se/phish_send` (`games_controller.rb:1911-1928`, route `config/routes.rb:62`). Recorded by `send_phish!` (`capture_proofs.rb:456-487`) and `record_phish_send!` (around `capture_proofs.rb:430-449`). Stores `sePhishSends[<targetId>/<kitId>]` with `landed` computed from the server's own `seLandingPages` store (`:437-446`). The client's `landed` is ignored (`games_controller.rb:1915-1917`).
- Results: a send that lands before its build returns `page_not_built_yet` with `retryable` (`capture_proofs.rb:478-482`). A page below threshold returns `page_below_threshold` (`:483-484`).
- Captures: a proven phish credential triggers `stamp_proven_captures!` and returns `captures` in the body (`:474-486`).

### 5.4 Shape of an "ask" (for planners)

- Ask fields: `pressure` (influence delta), `floor`, `verification` (fact ids), `grants` (`intel` ids, `setGlobal`). Source: `pretext-judge.js:348-369` and `interactions.js:652-668`.
- Judgement uses value ids, not wording (`pretext-judge.js:1-8`).

---

## 6. NPC PC use: events and the server

### 6.1 Events the client fires

From `public/break_escape/js/systems/npc-needs.js` (read by grep and targeted reads):
- `npc_used:<objectId>` on a completed use: `{npcId, objectId, need, itemId, tag, payload, playerNearby, playerDistance, met?}` (`npc-needs.js:3757-3764`; event table `NPC_NEEDS_SYSTEM.md:1017`, `:1036-1046`).
- `met: true` only for a judged need (`npc-needs.js:3764`, `NPC_NEEDS_SYSTEM.md:863`).
- `npc_use_failed:<npcId>` for a failed judged use (`NPC_NEEDS_SYSTEM.md:866-869`, `:1024`).
- `npc_sat_at:<objectId>` when a borrower sits down at a hot desk (`npc-needs.js:3641`, `:3655`), only for `job.borrowed` (`:3645-3646`).
- `npc_borrowed_session:<pcId>` when a borrow leaves a session open, and `npc_borrow_done:<npcId>` always (`npc-needs.js:3881-3896`). Fields: `met`, `lapsed` (when skipped unjudged), `cut` (abort name). Read the header comment at `:3881-3887`.
- `npc_used_phone:<npcId>` for a `self` job on the phone (`npc-needs.js:3307`, `NPC_NEEDS_SYSTEM.md:966`).
- `npc_workaround_due`, `npc_workaround`, `npc_mutter`, `door_propped` (`NPC_NEEDS_SYSTEM.md:1031-1034`).

### 6.2 What the client syncs to the server, and by which route

- Frustration and borrow reports: `POST /npc_frustration` (`games_controller.rb:29`, `:105`; route at `config/routes.rb:40-41` by comment "Slice 9.2"). Response carries `{npcId, level, tell, settled, ...}` (`NPC_NEEDS_SYSTEM.md:931`). Reports are built in `public/break_escape/js/systems/npc-reports.js` (354 lines; listens `npc_sat_at:*` at `:346`; borrow sit-down check at `:108`).
- Borrow done: `app/models/break_escape/npc_frustration.rb:206-207` calls `record_borrow_done!` (`:391`). A guest record `player_state.guestSessions` maps `{ pcId => npcId }` (`npc_frustration.rb:243`).
- Borrow token: `tokenExpiredPcIds` and `endedPcIds` are returned in the answer (`npc_frustration.rb:222-230`). Keyring sessions are pruned at borrow end (`:226-229`).
- Workarounds: `POST /npc_workaround` (`NPC_NEEDS_SYSTEM.md:920`, route `config/routes.rb:40-41`).
- Feed posts: `POST /feed_post` from `public/break_escape/js/systems/social-feed.js` on each met `social_media` use (`npc_used` with `met: true`) and on `npc_used_phone` (`social-feed.js:5`, `:414`; `NPC_NEEDS_SYSTEM.md:977-979`).
- Client PC sessions: `public/break_escape/js/systems/pc-sessions.js` (about 1036 lines). It listens to `npc_sat_at:*` (`pc-sessions.js:307`), and `npcId` appears in session records (`:556`, `:375`). Header at `:83`: the session records `npc_sat_at` and a borrowed-session leave. Whether these reach the server as a PC session record is **unconfirmed** (no grep hit on `pcSessions` in `app` or `lib`).
- Sync: `sync_state` carries the player state (`games_controller.rb:97-107` route list; `npcCarry` dropped at sync per section 1).

### 6.3 Does the server know an NPC signed in at a PC? (for need d)

- Confirmed in code: the server records a borrow's "done" and the borrowed PC id, and records guest sessions `{ pcId => npcId }` (`npc_frustration.rb:243`, `:391`). The server treats a borrower as having left a session open or done.
- Confirmed in code: the client emits `npc_sat_at:<pcId>` on sit-down for a borrow only (`npc-needs.js:3641-3646`).
- Not confirmed: a server-side record that an NPC's own sign-in at its own PC happened. The own-PC use emits `npc_used` (with `met`) and the frustration report (`npc-needs.js:3757`, `NPC_NEEDS_SYSTEM.md:931`). The server does not necessarily record "signed in", only use.
- Not confirmed: whether `pc-sessions.js` writes an NPC-held session to `player_state`. The grep for `pcSessions` in `app` and `lib` returned nothing. **Inferred**: NPC sessions are client only, except for the guest record and borrow-done report.

---

## 7. Tests, feature scenarios and scripted playtests

Feature scenarios (directories under `scenarios/`):
- `test_needs_sims`: the needs showcase. Files: `scenario.json.erb`, `README.md`, `PROOF_HISTORY.md`, `LIVE_EXCHANGE_HEARD_RELOAD.md`, `ink/`. The README and proof history were not read in full. Grace's dirty-mugs carry is named in the carry docs (`NPC_CARRIED_ITEMS_PLAN.md:381-385`). Live game ids are in the docs (5512, 5515-5554). `README.md` is cited by the slice C plan (`:198`).
- `test_needs_leash`, `test_npc_needs`, `test_needs_attack`: other needs tests (`NPC_NEEDS_SYSTEM.md:140-143`).
- `test_access_social`: friendface and social. `PLAYTEST.md` sections: setup `:23`, expected validator output `:64`, beats `:100`, reactive beats `:117`, borrowed hot desk lockouts `:139` (q36, L1 and L2), USB habit beat `:146` (U1), Friendface phones `:172` (F14), NPC replies `:184`, earned secrets `:243`, tampered-client checks `:251`. Live proof on port 3032 (`FRIENDFACE_PHONE_ITEM_PLAN.md:141-142`).
- `test_access_work`, `test_access_signin`, `test_access_keyring`, `test_access_habits`, `test_access_doors`, `test_access_devices`, `test_access_networks`, `test_access_sessions`: each has a `PLAYTEST.md` (found for `test_access_social`, `_keyring`, `_habits`, `_signin`, `_work`). Only `test_access_social/PLAYTEST.md` was read in part. The others are **unconfirmed**.
- `test_dm_social`, `test_social_m5_channels`: pretext call examples (section 5).
- Live carry proof driver: `tools/playtest/npc-carry-live-proof.mjs` (`NPC_CARRIED_ITEMS_PLAN.md:432-433`, beats consume, drop, ko). Reload proof: `tools/playtest/npc-carry-reload-proof.mjs` (`NPC_CARRIED_ITEMS_SLICE_C_PLAN.md:278`). Tour: `tools/playtest/needs-tour-regression.mjs` (`NPC_CARRIED_ITEMS_PLAN.md:448`, `:458`).

Test files (names only, from grep in this pass):
- Rails: `test/controllers/break_escape/npc_carried_items_test.rb` (planned in the slice C plan `:245-268`; 42 runs reported in its handover `:15`), `test/controllers/break_escape/forged_ko_drop_test`, `reload_persistence_test`, `game_test`.
- Rails: `test/models/break_escape/hide_device_test.rb`, `filtered_scenario_test.rb`, `scenario_npc_records_test.rb`, `capture_payload_secret_test.rb`, `payload_scan_opened_state_test.rb`; `test/unit/owner_claim_test.rb`, `test/unit/access_leak_scanner_test.rb`, `test/unit/credential_model_test.rb` (names from grep; contents not read).
- JS: `test/js/npc-carry-wiring.test.mjs` (`NPC_CARRIED_ITEMS_SLICE_C_PLAN.md:270-272`), `test/js/room-state-sync-refusal` (`NPC_CARRIED_ITEMS_PLAN.md:16`).
- Harness: `bin/test-js` runs plain node (`CLAUDE.md` memory note). New static import in an engine JS module means adding it to each harness copy list (memory note, not read in repo).

Pass counts recorded in the plans (not re-run): Rails npc_carried_items 42/0 (`NPC_CARRIED_ITEMS_SLICE_C_PLAN.md:15`), bin/test-js 681/0 (`:15`), full `rails test` 2861 runs (`:16`).

Open live-proof gaps:
- Slice C reload beats T1, T2, L1 to L5 not run (port 3091 held by another session). Resume steps in `NPC_CARRIED_ITEMS_SLICE_C_LIVE.md` (not read).
- Copier output carry 422s in the earlier run: fixed by the R1 m5 change (`NPC_CARRIED_ITEMS_PLAN.md:461-472`).

---

## 8. Extension points and constraints for needs (a) to (d)

These describe what the code and docs already do. They are not recommendations.

### (a) A code-generator device an NPC carries, that the player can borrow, take or use

- Existing lever: a `needsTag` item in the carry allowlist (section 1.3). Constraint: allowlist excludes key and credential types and objects with `opens_lock`, `keyPins`, `requires`, non-empty `contents` (`NPC_CARRIED_ITEMS_PLAN.md:308-316`). A code generator that is a credential or a key is excluded by the rule as written.
- Existing lever: take by give (ink tag `#give_item:<type>`, literal type), offered by story only (`FRIENDFACE_PHONE_ITEM_PLAN.md:86-90`). Constraint: a give is not server-enforced beyond "met and offered" (`:78-81`).
- Existing lever: KO drop of carried items (section 1.2 route 3).
- Live content: no item-level live content found (section 1.4). Constraint: `usePayload` is NPC-owned, and object content is scenario-owned (`NPC_NEEDS_SYSTEM.md:40-41`).
- Time-varying content would need either a clock on the server (none found, section 3.3) or a client clock (`game-clock.js`, section 3.1). **Unconfirmed**: which clock is authoritative for a code.

### (b) A sign-in approval prompt on an NPC's phone, accepted or refused by awareness

- Existing: `social_media` need, `"phone"` flag, `npc_used_phone` (section 6.1). The phone never parks the need (`NPC_NEEDS_SYSTEM.md:946-956`).
- Existing: awareness habits `locksScreen`, `password`, `writesDown` (section 4.2). `password` has no reader found (section 4.3).
- Existing: judged uses (`met`, `npc_use_failed`, `NPC_NEEDS_SYSTEM.md:861-869`).
- Constraint: awareness presets are `low`, `medium`, `high` and set `locksScreen` and `holdsDoors` only (`npc_habits.rb:32-36`). A new habit needs an entry in `HABITS` (`:21-26`), a validator rule, and a reader. Habits must go through `expand!` to be saved (`:127-176`).
- Constraint: `phishable`, `pretextable`, `challengesStrangers` are not built (section 4.4).
- Constraint: a judged-use verdict is client-side; the server gets reports (`NPC_NEEDS_SYSTEM.md:931`).

### (c) A helpdesk NPC who resets a password after checking who is asking

- Existing: pretext-call judge with `verification` facts and `grants` (section 5.1). Verification is by fact ids, not wording (`pretext-judge.js:1-8`, `:366-374`).
- Existing: a helpdesk example scenario `scenarios/ca03_helpdesk_reset/scenario.json.erb` (has `pretextNpcs`, section 5.1) and `scenarios/ca03_helpdesk_reset/ink/leila_servicedesk.ink` (not read). **Unconfirmed** whether it resets a password on the server.
- Existing: password lock and reset paths in `public/break_escape/js/systems/unlock-system.js` (`:781`, `:842`, `:1006`, `:1027`) and `public/break_escape/js/minigames/password/password-minigame.js` (`:1395`, server verification). **Unconfirmed** whether a reset path exists.
- Constraint: the pretext verdict is client-only (section 5.2). A reset that must be checked on the server would need a server rule; none exists for pretext.
- Constraint: `ask` success is a floor on influence plus verification (`pretext-judge.js:382-405`).
- Credential keyring kinds include `password`, `token`, `assist_invite` (`public/break_escape/js/systems/keyring.js:774`). **Unconfirmed** relevance to a reset.

### (d) The server knowing when an NPC signed in at a PC

- Existing: client emits `npc_sat_at:<pcId>` for borrowed desks only (`npc-needs.js:3641-3646`).
- Existing: server records borrow done and guest sessions (`npc_frustration.rb:206-207`, `:243`, `:391`).
- Existing: `npc_used` with `met` for a judged own-PC use, and `POST /npc_frustration` reports (section 6.2).
- Constraint: no server record of an NPC's own-PC sign-in was found (section 6.3). **Unconfirmed**.
- Constraint: needs state is client-side, and reload resets it (`NPC_NEEDS_SYSTEM.md:1148-1153`). Server knows only what it was sent.
- Constraint: `sync_state` ignores some keys (for example `npcCarry`, section 1). Per-NPC state is accepted only through its own actions. A new server-known fact would need its own route or a whitelisted delta section, per the `npcCarry` pattern (`NPC_CARRIED_ITEMS_PLAN.md:192-208`).

---

## 9. Unconfirmed list

- Whether any item shows live content on the server.
- The code-generator or one-time-code item type (not found; keyring `token` kind is a lead only).
- `password` habit readers.
- Pickpocket UI details (`game.rb:4930`, `:4985`).
- Phone-chat and mail-client data shapes (about 9000 lines not read).
- Pretext scenario data shape beyond the judge header.
- `ca03_helpdesk_reset` content and whether any password reset is server-checked.
- Whether `pc-sessions.js` NPC sign-ins reach `player_state`.
- Full `OFFICE_LIFE_PLAN.md` event list (section 7 of `NPC_NEEDS_SYSTEM.md` used instead).
- Line numbers for `npc-needs.js` `pickUp` (`:5580`), `consumeHeld` (`:5601`), `dropHeld` (`:5610`), `placeHeld` (`:5632`) are from the plan doc and were not re-checked against the file.
- Exact `game.rb` line for `SHIPPED_HABIT_KEYS` (cited as a block `:7335-7345`).
