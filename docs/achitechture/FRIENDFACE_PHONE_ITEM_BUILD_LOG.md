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

## Handover

Not needed: the build finished in one session.
