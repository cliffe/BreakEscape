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

- The browser's title bar still reads "Browser" (the osint block's title): the phone passes its
  name as `title`, which the osint browser does not read. Cosmetic; left.
- A post that arrives while the phone itself is open still counts as unread until the next open.
- KO: a knocked-out NPC drops its items; picking its phone up from the floor makes the phone held,
  so the NPC is phone-less while the player holds it, but there is no gift record, so a drop gives
  the server no record. A KO'd NPC does not post, so this is not reachable in practice.
- The validator error for a missing phone item only bites `test_access_social` today (the only
  scenario with social needs).

## Suite results

- Rails `bin/rails test` (under the lock): 1804 runs, 25613 assertions, 0 failures, 0 errors, 1 skip.
- JS `bin/test-js -j 3` (under the lock): 507 of 508 files. The one failure,
  `minigame-launch-routes.test.mjs`, listed the registry's types and lacked the new
  `phone_friendface` entry; added to its starter map, the file now passes alone (31 of 31). No
  other change, so the full JS suite was not rerun.

## Handover

Not needed: the build finished in one session.
