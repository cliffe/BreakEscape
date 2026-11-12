# Friendface phone item: build log

Plan: `FRIENDFACE_PHONE_ITEM_PLAN.md` (user decision q35, 2026-11-12, plus the same day's added
scope: the player's own phone and the post blip). Branch `build/ff-phone`.

## What was built

- **Sprite** `public/break_escape/assets/objects/phone_friendface.png`: `phone.png` (11x22) edited
  pixel by pixel. The blue disc became the Friendface logo green (#025c00) and the Bluetooth mark
  became an off-white F (#f2fcf2) with the logo's heavy stem and two equal bars. Not resized.
- **Item** type `phone_friendface`; `phoneOf` names the owning NPC, absent for the player's own
  phone; `site` (own phone only) picks the osint site.
- **Server**
  - `SocialFeed#held_friendface_phone`, `#friendface_phone_taken?`, `#open_friendface_phone`
    (`app/models/break_escape/social_feed.rb`).
  - `POST /games/:id/friendface_phone` (`games_controller.rb`, route, policy `friendface_phone?`).
    Read only; 403 unless the server's inventory holds that phone.
  - `Game#scenario_room_npc` merges `phone: false` for an NPC whose phone is taken, so every phone
    check (`/feed_post` source, ease reports, `can_fail?`, use times) treats it as a `"phone": false`
    NPC with no other change. The room bootstrap merges the same flag.
  - `phoneOf` added to `CLIENT_ITEM_FORBIDDEN_FIELDS`.
- **Client** `public/break_escape/js/systems/friendface-phone.js`, installed in `core/game.js`
  after the social feed: open via the minigame registry (`phone_friendface` entry) and the
  pick-up-then-open list in `interactions.js`; unread counts per phone drawn with
  `registerTrayRule`; `phone_vibrate` through `soundManager`, held under the bark hold and played
  once on release (300 ms poll); `inventory_changed` sets the owner NPC's live `phone = false`.
- **Validator** (`scripts/validate_access_work.rb` `check_friendface_phones`), schema
  (`phoneOf`, `site`), known item keys.
- **Scenario** `test_access_social`: Jake, Lena, Priya, Nadia and Greg hold their phones; Jake's
  ink (`ink/jake.ink`, new) gives his on request; "Your phone" in the lobby; sign F14; task
  `f14_jake_phone`; beat F14 in `PLAYTEST.md`.

## Tests

- Rails `test/controllers/break_escape/friendface_phone_test.rb`: 8 runs, 36 assertions.
- JS `test/js/friendface-phone.test.mjs`: 10 tests. Validator tests in
  `validator-access-social.test.mjs` (3 new; fixtures given the phone; a `noPhone` helper) and the
  reactive fixture.
- Full suites: see "Suite results" below.

## Live proof (keyless server on :3032, game 1361, headless)

- Picked up "Your phone": the browser opened on the Friendface home (`view social`, no page).
- Entered Jake's room; his first phone post was revealed by `/feed_post`: one `phone_vibrate`, own
  phone badge "1".
- Asked Jake for his phone: "Received: Jake's phone"; Jake's live record `phone: false`,
  `itemsHeld` empty. Opening it: profile `friendface.jake` with blocks `jake_post_1` (revealed) and
  `jake_authored`, nothing else.
- Opened my own phone in Lena's room and waited: Lena's post arrived while the browser was open,
  no sound (pending), badge counted; on Close the sound played once (190 ms later).
- Reload: no unread, no badge, no sound; revealed posts listed; task `f14_jake_phone` completed.
- Jake afterwards: his social use at `jake_pc` failed (parked `failed`, frustration 50).
- Tampered client: `/friendface_phone` for `lena`, `priya` or an array: 403; `/feed_post` for Jake
  with `object_id` null: `refused: true`; adding a forged `phone_friendface`: 422;
  `startFriendfacePhone` with a made-up Lena phone: "You do not have that phone.", nothing opened.

Screenshots: the scratchpad `ffp/` folder of the session (not committed).

## Notes and open points

- The browser's title bar reads the osint block's title, as at any terminal (the phone passes no
  title since R1 n3).
- A post that arrives while the phone itself is open still counts as unread until the next open.
- KO: fixed in R1 (m2): a phone picked up from a KO drop is recorded in `phonesTaken`.
- The validator error for a missing phone item only bites `test_access_social` today (the only
  scenario with social needs).

## Suite results

- Build (1004655bd): Rails 1804 runs, 0 failures, 1 skip. JS 508 of 508 files, run in full under
  the lock by review R1 after the registry test fix.
- After the R1 fixes (db4be19e9), both under the lock: Rails 1808 runs, 25632 assertions,
  0 failures, 0 errors, 1 skip; JS 508 passed, 0 failed, 508 total.

## Review R1 fixes (FRIENDFACE_PHONE_ITEM_CODE_REVIEW_R1.md)

- M1: an NPC's phone is handed over only when the scenario offers that give. That means a
  `give_item:phone_friendface` tag, or a `give_npc_inventory_items` tag that does not filter the
  phone out, in the compiled story or in the NPC's JSON record (`friendface_phone_offered?`,
  checked in the `npc` branch of `validate_item_collectible`). It applies to this item only, and a
  KO drop stays allowed. Rails: Lena's phone add is 422 and she keeps her phone.
- M2: the open no longer merges the route's `feedPosts`, so a `/feed_post` in flight still fires
  `npc_posted`, the blip and its task mappings. A JS race test covers it.
- m1: `add_item_to_room!` refuses an unsourced Friendface phone, and a held phone counts only when
  its id matches one the scenario declares.
- m2: `phonesTaken` is recorded in `add_inventory_item!` the first time an NPC's phone arrives by any
  route, and `friendface_phone_taken?` reads it, so a KO pickup followed by a remove keeps the
  phone taken on the server, as on the client.
- m3, m4, n1 (validator): an NPC phone must be takeable and every phone needs an id. A phone in a
  scenario with no social site is an error, and `phoneOf` on another item type warns.
- m5: suite line above. n2: Jake's ink sets `lent_phone` after the give. n3: the open passes no
  title. n4: the plan says no phone in the test scenario is droppable.
- Not touched: the reviewer's out-of-branch `add_object` opens_lock/key_id finding (handled in
  another build).
- Live proof on :3032 (game 1402, server stopped afterwards):
  - picking up my own phone opened the feed;
  - Jake's post blipped and set the badge to 1;
  - Jake's phone opened his profile with his revealed post;
  - a forged Lena give was 422 ("NPC does not give this item"), and Lena posted from her phone later;
  - a minted phone through `update_room` was refused (422, and the inventory add 422);
  - opening Lena's phone was 403;
  - Jake's phone post was refused;
  - a post that arrived while the browser was open played its sound once, on close;
  - task `f14_jake_phone` completed.

## R2 fixes (FRIENDFACE_PHONE_ITEM_CODE_REVIEW_R2.md)

- M1: `Game#add_item_to_room!` stores an NPC-sourced add only when `npc_room_drop_allowed?`
  says so: the NPC's KO is recorded (`npc_defeated?`), or the player has met the NPC and its story
  or record offers the item's type (`npc_offers_item?`, the same patterns as a give). This holds
  for every item type, not only phones. The only client route that sends an NPC-sourced add is the
  KO drop (`npc-hostile.js` `dropNPCItems`, sent after the KO sync), and no scenario sends one any
  other way (grep of `scenarios/` for `sourceNpcId` and `npc_defeated`: only an ink event name in
  m01). `validate_item_collectible` asks the same question when a stored NPC phone is picked up,
  for a save made before the fix. Three existing model tests sent a drop from a live NPC; they now
  record the KO first, as the client does.
- m1: the room bootstrap drops a taken NPC phone (by `phoneOf`) from that NPC's `itemsHeld`, so a
  KO pickup with no gift record no longer leaves the phone listed after a reload.
- m2: `check_friendface_phones` warns when no `give_item:phone_friendface` and no
  `give_npc_inventory_items` that includes the phone appears in the owner's story or record:
  "only a KO drop hands this phone over". The patterns moved to `AccessWork.offers_item_text?`
  (with `AccessWork.offer_texts`), which the server and the validator both read. In
  `test_access_social` it warns for Lena, Priya, Nadia and Greg, which is intended: their phones
  come only from a KO.
- n1: the offer check falls back to the `.ink` source when a story has no compiled JSON (a stale
  compiled file is still read as it is; the game compiles on the first `/ink` request). A tag ends
  at a newline or the next `#`, so an `.ink` line reads as the client splits it.
- n2: written into plan section 3 (only a room NPC can offer a phone).
- n3: `friendface_phone_taken?` returns before walking the scenario when the inventory holds no
  Friendface phone.
- n4: the validator refuses two Friendface phones that share an id.
- n5: left as an accepted risk. An offered phone can be claimed without the conversation, from
  any room, because the server checks only that the NPC is met and that its story offers the
  phone. Under the cheat-resistance rule this is a best-effort ink step with an NPC sanity check.
  Plan section 3 tells authors not to gate a phone give behind a condition the server must enforce.
- Out of scope, filed: the client can claim `isKO` for any NPC in the room, and a claimed KO hands
  over every item the NPC holds. `docs/IDEAS_BACKLOG.md`, "Server-checked knock-outs".

Tests (affected files only, no full suites, per the 2026-11-12 test rule):
- Rails `friendface_phone_test.rb` and `game_test.rb`: 114 runs, 490 assertions, 0 failures. With
  the M1 check disabled, 4 of them fail (the review's Lena probe, the offered drop, and two model
  tests), so the probe test reproduces the hole.
- Rails, every file touching room adds, gifts, social feeds or `AccessWork`, plus
  `games_controller_test.rb` and `inventory_canonical_item_test.rb`: 286 + 72 runs, 0 failures.
- JS `validator-access-social`, `validator-access-reactive`: 33 passed;
  `validator-access-work`, `validator-access-model`: 65 passed.

Live proof (keyless server on :3061, headless, stopped afterwards; games 1519, 1522, 1523, 1526):
- Game 1519, in Lena's room, Lena not KO'd: `update_room add_object` sourced from Lena was 422,
  with and without `sourceType: npc_defeated`; the unsourced inventory add was 422 ("NPC does not
  give this item"); opening Lena's phone was 403.
- Same game, Lena knocked out (`debugKO`, the real KO path with the fight skipped): the drop was
  stored as `lena_phone` with `phoneOf: lena`; picking it up put it in the inventory and opened her
  profile (`lena_authored`); Lena's live record `phone: false`; the room bootstrap then sent Lena
  with `phone: false` and an empty `itemsHeld`, Jake still holding his phone; `/friendface_phone`
  for Lena 200.
- Game 1526: asked Jake for his phone in conversation: "Received", inventory holds `jake_phone`
  with `phoneOf: jake`, Jake's live record `phone: false`, his bootstrap `phone: false` and empty
  `itemsHeld`, `/friendface_phone` for Jake 200, task F14 completed.
- Games 1522 and 1523 were driver retries (the harness's `converse` did not find Jake's opening
  line in time), with no result to report.

## R3 fixes (FRIENDFACE_PHONE_ITEM_CODE_REVIEW_R3.md)

- m1: `check_friendface_phones` no longer warns for a phone that only a KO drop hands over (q35:
  a KO is a valid route). It is an info line ("a KO drop is the only way to obtain it"), and an
  error when the owner is `koImmune` and no give offers the phone, since the player can then never
  obtain it. `test_access_social` now shows four info lines (Lena, Priya, Nadia, Greg) and no
  errors.
- m2: a KO drop no longer hangs on one request.
  - Client (`npc-hostile.js`): `withSyncRetries` sends the KO sync, and each dropped item's add,
    up to four times, waiting 0.5, 1.5 and 4 s between tries. Nothing is queued past that and
    nothing is saved.
  - Server (`Game#add_item_to_room!`): an `npc_defeated` add from an NPC in the room records the
    KO itself, as `update_npc_state` would (the same client trust, so nothing new is trusted). A
    `koImmune` NPC records nothing. `npc_defeated?` also reads the KO in `npcHostility` (from
    `sync_state`), so a drop in another room lands once either KO record has arrived.
  - A repeat add of an item already dropped, picked up or held returns true and adds nothing, so
    a retry whose answer was lost makes no second copy.
  - Reload: `apply_room_state_changes!` lists, for a KO'd NPC, the held item ids that never reached
    a room or the player (`koDropPending`). `npc-sprites.js` lays the KO'd NPC down and calls
    `npcHostileSystem.redropPending`, which drops those items again through the same retried path.
    Held items with no id cannot be traced and are not re-dropped (none on an intended route).
  - Changes R2's live result: an `npc_defeated` add from a live NPC in its own room is now taken
    as a KO claim and stored, where R2 refused it. A plain NPC-sourced add from a live NPC that
    offers nothing is still refused.
- n1: `give_item_re` and the `give_npc_inventory_items` pattern allow spaces before the colon, as
  the engine does. Plan section 3 says the item type must be literal.
- n2: the validator reports a JSON `give_item` action carrying a `phone_friendface` as an error;
  plan section 3 says phones are given by ink tags only.
- n3: the held-phone fallback in `friendface_phone_taken?` walks the scenario only when the
  inventory holds a Friendface phone whose `phoneOf` is that NPC, so the player's own phone never
  brings the walk back.
- n4: the validator follows `INCLUDE` when it reads an uncompiled `.ink` story. The server's gap
  before the first compile is noted in plan section 3, not changed.
- n5: `/friendface_phone` sends `feedPosts` only with `posts: 1` (the tests ask for it); the game
  never does.
- No nit skipped.

Sync size: nothing new in `player_state`. The KO record written from a drop is the same
`npc_states` entry `update_npc_state` writes. `koDropPending` is in the GET /room answer only,
bounded by the NPC's `itemsHeld`, and empty once the drop lands. Retries are in memory, at most
four requests per KO sync and per item, never a whole-state re-send.

Tests (affected files only, no lock):
- JS `npc-ko-drop-retry` (new) 5/5. Without the fix it fails: the module has no retry or re-drop,
  so the KO sync is sent once and the drop never follows a failed one.
- JS `combat-room-rule` 17/17 (its stub now answers true, as the real sync does),
  `validator-access-social` 25/25, `friendface-phone` 11/11, `npc-hostility-persistence` 8/8,
  `npc-ko-immune-and-door-event` 7/7, `npc-respawn-reset` 4/4, `engine-fixes-round6` 9/9,
  `npc-hostile-config` 5/5, `npc-ko-restore-pose` 4/4, `npc-patrol-clock` 6/6.
- Rails `friendface_phone_test.rb` and `game_test.rb`: 119 runs, 510 assertions, 0 failures. With
  `inventory_canonical_item_test`, `game_state_locking_test`, `wearable_test`,
  `capture_proofs_test`, `reload_persistence_test`, `scenario_npc_records_test`: 270 runs, 0
  failures. Social feed and offer files (`feed_post_test`, `social_lockout_q33_test`,
  `access_model_no_password_test`, `access_leak_scanner_feed_test`,
  `access_work_feed_select_test`): 110 runs, 0 failures.
- Validator on `test_access_social`: no errors.

Live proof (keyless server on :3068, headless, stopped afterwards; games 1577, 1583, 1584, all
m01):
- Game 1577: unused (the start room stayed reception; recreated with `break_room` as start).
- Game 1583: a page fetch hook failed the first KO sync for Derek. Requests in order:
  `update_npc_state` blocked, `update_npc_state` 200 about 0.55 s later, `add_object
  entropy_launch_device` 200, pickup `/inventory add` 200, `remove_object` 200. The launch
  device ended in the inventory.
- Game 1584: every KO sync and every drop for Derek blocked. Four KO syncs and four drops were
  tried, then given up. The server then held Derek's KO only in `npcHostility`, with no drop. After
  a reload Derek lay KO'd, the room answer listed the device as owed, the client dropped it again
  (server log: "Added item launch-device (entropy_launch_device) to room break_room"), and the
  pickup put it in the inventory. Afterwards the room answer lists nothing owed.

## Handover

Not needed: the build finished in one session.
