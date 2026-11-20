# Friendface phone item: code review, round 1

Branch `build/ff-phone` against `main` (commits 1f8b11be7 to 1004655bd). Plan
`FRIENDFACE_PHONE_ITEM_PLAN.md`, build log `FRIENDFACE_PHONE_ITEM_BUILD_LOG.md`.

Counts: 0 blocker, 2 major, 5 minor, 4 nit. One pre-existing problem outside this branch is
listed at the end; it is serious and needs its own fix.

## What was checked

- Read the full diff of the route, model, bootstrap merge, client module, registry, validator and
  scenario.
- Probed the server with a throwaway integration test (removed, not committed): taking Lena's
  phone with no authored give, minting a player phone through `update_room`, and a KO pickup
  followed by an inventory remove. Results are quoted under each finding.
- Validator over all 176 `scenarios/*/scenario.json.erb`: no phone rule fires anywhere and nothing
  crashes; `test_access_social` has 0 lines with ❌. Only `test_access_social` has feeds, so the
  "must hold its phone" rule bites nowhere else today.
- JS suite, full, under the shared lock: `bin/test-js -j 3` gave 508 passed, 0 failed, 508 total.
  The registry fix in `minigame-launch-routes.test.mjs` holds in the full run.
- `validator-access-social.test.mjs` alone: 20 of 20 pass, none skipped (ruby is found).

What holds up: the route is read only and answers 403 for every shape that is not a held phone;
`phoneOf` cannot come from a client-built item; the bootstrap merge works on a `deep_dup` of the
room; every server phone check reads `scenario_room_npc`, so the merge reaches `feed_source_ok?`,
`ease_report!`, `can_fail?` and the plan compile; the post blip fires only from a live
`/feed_post` answer, and `_add` dedupes, so it fires once per post and never on reload; all
engine text goes through `textContent`; the route's `feedPosts` comes from the same
`feed_posts_for_client` as the bootstrap, so the C and C2 order modes and the q33 lockout apply
unchanged.

## Major

### M1. Any met NPC's phone can be taken without an authored give

`app/controllers/break_escape/games_controller.rb:2325` (the `npc` location branch of
`validate_item_collectible`) only checks that the NPC is in `encounteredNPCs`.
`app/models/break_escape/social_feed.rb:120` then treats the NPC as phone-less as soon as the
phone is held.

In `test_access_social` only Jake's ink gives his phone, yet Lena, Priya, Nadia and Greg also hold
takeable phones. Probe: `POST /inventory` add `{type: phone_friendface, id: lena_phone}` with
`source_npc_id: lena`, after entering her room: 200; `friendface_phone_taken?('lena')` true;
`/feed_post` for Lena with `object_id` null: `refused: true`.

The give trust model is old (every `itemsHeld` item works this way), but before this branch a
forged give only moved an item. Now it changes what the server decides for that NPC: its phone
posts are refused, `can_fail?` for social media turns on, and its social time moves to a PC where
the player may be able to shoulder-surf or lock it out. A tampered client can steer an NPC the
scenario never offered to change.

Fix: for a `phone_friendface` with `phoneOf`, accept an add from the NPC source only when the
scenario offers that give. Either scan the NPC's compiled story on the server for a
`give_item:phone_friendface` tag (the story JSON is on the server), or add an authored
`giveable: true` on the item and have the validator require it when the ink gives the phone. A
KO drop (`objects_added` from `npc_defeated`) stays allowed. Add a Rails test: Lena's phone add is
422 and Lena keeps her phone.

### M2. Opening a phone can swallow a live post, its task and its blip

`public/break_escape/js/systems/friendface-phone.js:139` restores the route's `feedPosts` into the
social feed. The route reads without the game lock. If the player opens a phone while a
`/feed_post` request is in flight and the open's answer arrives first, `restore` lists the new post
with `live: false`. When the `/feed_post` answer lands, `SocialFeed._add` finds the post already
listed and returns before it emits (`social-feed.js`, the `list.some(...)` check). So
`npc_posted:<id>` never fires: no blip, no "posted on" toast, and the NPC event mappings on
`npc_posted` never run. In `test_access_social` those mappings complete tasks
(`scenario.json.erb:554`, `:560`, `:995`). A reload does not recover them, because restore never
emits. The window is narrow (one round trip), but nothing recovers what it loses.

Fix: drop the restore from `openFriendfacePhone`. The client already holds every revealed post
(bootstrap plus each live answer), so the route's `feedPosts` adds nothing on the client. Keep it
in the answer for tests and the bridge if wanted. Or have `SocialFeed` note npc ids with a
request in flight and skip them in `restore`. Add a JS test: restore from an open, then the live
answer for the same post, expects one `npc_posted`.

## Minor

### m1. A player phone can be minted in any scenario

`app/controllers/break_escape/games_controller.rb:848` stores an `add_object` with no source as
the client's own fields (`item_add_params`, `:2716`), and the inventory add finds it at
"Priority 0" (`:2469`). Probe: `update_room add_object {type: phone_friendface, id: minted,
takeable: true}` 200, `inventory add` 200, `/friendface_phone` with null 200. The phone shows
only posts already in the bootstrap, so nothing leaks, but it breaks plan section 1 ("every
`phone_friendface` in the server's inventory is the scenario's own copy") and gives a blip and
feed button in a scenario that never offered one.

Fix: the general fix under "Pre-existing" covers it. Until then, `held_friendface_phone`
(`social_feed.rb:108`) can also require the held item's id to match a `phone_friendface` the
scenario declares (room objects, `itemsHeld`, start items).

### m2. Server and client disagree on "taken" after a KO pickup

`app/models/break_escape/social_feed.rb:120` decides "taken" from the gift record or the
inventory. A phone picked up from a KO drop has no gift record (its location is a room). Probe:
held, taken true; after `POST /inventory remove jake_phone`, taken false. The client never sets
`phone` back (`friendface-phone.js:166`), so it keeps Jake phone-less until a reload, which then
brings his phone back. The build log calls this unreachable because a KO'd NPC does not post; the
NPC can still be judged on the server (`/npc_frustration` reads the same record), and a later
scenario may revive NPCs.

Fix: write a server record the first time a `phoneOf` phone enters the inventory by any route
(for example `player_state['phonesTaken'] << owner` in the inventory add), and have
`friendface_phone_taken?` read only that. It also covers the drop case the plan describes.

### m3. Validator: an NPC phone that is not takeable is accepted

`scripts/validate_access_work.rb:66` to `:75` check the owner and `site` but not `takeable`. A
phone without `takeable: true` can never be given or picked up (`games_controller.rb:2303`
refuses it), so the item is dead. Fix: error when a `phoneOf` phone lacks `takeable: true`, with a
fixture each way.

### m4. Validator: a phone with nowhere to open passes

The route falls back to `default_friendface_site` (`social_feed.rb`, private section), which is
nil when the scenario has no `social` osint site; the client then shows "The phone will not
open." No rule catches this. Fix in `check_friendface_phones`
(`scripts/validate_access_work.rb:49`): error when any `phone_friendface` exists and there is no
social site, and when an NPC phone's owner has no `feed` and no social site to fall back to.

### m5. Build log suite claim

`FRIENDFACE_PHONE_ITEM_BUILD_LOG.md`, "Suite results", says the full JS suite was not rerun after
the registry fix. It now has been (508 of 508, above). Update the line so the log is not the only
record of a partial run.

## Nit

- n1. `scripts/validate_access_work.rb:57`: `phoneOf` on any type other than `phone_friendface`
  is ignored without a word. Warn on it (a typo such as `"type": "phone"` with `phoneOf` silently
  makes a phone-chat item).
- n2. `scenarios/test_access_social/ink/jake.ink:21`: `lent_phone = true` is set before the give.
  If the server refuses the add, the choice is gone for the rest of the conversation. Harmless in
  a test scenario; set it after the tag or accept it.
- n3. `friendface-phone.js:141` passes `title`, which the osint browser ignores (known, in the
  build log). Either drop it or have the browser read it, so the code does not suggest a feature
  that is not there.
- n4. Plan section 3 and the build log talk about the player dropping a phone, but no phone in the
  scenario is `droppable`, so `player_drop` refuses it. Say so in the plan, or the reader expects a
  drop path that does not exist.

## Pre-existing, outside this branch (flag to the user)

`update_room` with `actionType: add_object` and no `sourceNpcId`/`sourceType` stores the client's
fields as a room object (`games_controller.rb:848`, `item_add_params` at `:2716` permits
`scenarioData.opens_lock` and `scenarioData.key_id`; `game.rb:478` to `:482` stores it). The
inventory add then accepts it from "Priority 0" (`games_controller.rb:2469`) and stores it as is.
Probe: a minted `{type: key, scenarioData: {opens_lock: "anything", key_id: "anything"}}` was
stored in the inventory with both fields. `has_key_in_inventory?` reads `scenarioData` first
(`game.rb:224`). I did not drive a door unlock end to end, but this looks like a way to mint a key
for any key lock. Fix: refuse `add_object` unless the source is a validated `npc_defeated` drop or
a `player_drop`, or at least strip `CLIENT_ITEM_FORBIDDEN_FIELDS` and the whole `scenarioData`
from an unsourced add, with a hostile-input test.
