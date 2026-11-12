# Friendface phone item: plan

User decision q35 (2026-11-12, `docs/handover/2026-11-11_USER_DECISIONS.md`): an NPC that carries
a phone holds it in `itemsHeld` as a Friendface phone; if the player gets it and opens it, it opens
Friendface on that NPC's profile. Added scope the same day: the player can have a Friendface phone
of their own, which opens the feed, and a phone the player holds blips when a post is revealed.

Builds on slice 9.2 C and C2 (`app/models/break_escape/social_feed.rb`,
`public/break_escape/js/systems/social-feed.js`) and q33 (`object_id` null on `/feed_post` is the
NPC's personal phone; a `"phone": false` NPC has none).

## 1. The item

One item type, `phone_friendface`, sprite `assets/objects/phone_friendface.png` (the 11x22 phone
with its Bluetooth mark replaced by the Friendface F, edited by hand, never resized).

| Field | Meaning |
|---|---|
| `type` | `"phone_friendface"` |
| `name` | shown in the tray, for example "Jake's phone" |
| `takeable` | `true` (the inventory route checks it for NPC items too) |
| `phoneOf` | the id of the NPC whose phone this is. Absent: the player's own phone |
| `site` | optional, the player's own phone only: the osint site it opens. Default: the first `social` site |

An NPC's phone sits in that NPC's `itemsHeld`; the player's own phone is a start item, a room
object or an NPC gift. It fits the inventory model as it is: no new personal-phone system. The
existing `phone` type (phone-chat) is untouched.

`phoneOf` joins the controller's `CLIENT_ITEM_FORBIDDEN_FIELDS`, so a client-built item can never
carry it. Every `phone_friendface` in the server's inventory is therefore the scenario's own copy.

## 2. What opening shows

- An NPC's phone: the osint browser limited to the NPC's feed site, open at `<site>.<person>` (the
  NPC's profile page; the site's list of profiles when there is none). The profile shows what it
  shows anywhere: the authored profile and the feed posts already revealed to this player.
- The player's own phone: the same browser limited to the site, at the site's home, where every
  profile lists its revealed posts.
- Posts stay server-gated. The open route's answer carries the server's own `feedPosts` for that
  phone (one NPC's, or all), for tests and the bridge; the client does not merge them, since it
  already holds every revealed post and a merge racing a live `/feed_post` would swallow that
  post's `npc_posted` (review R1 M2). Opening a phone never reveals a post and never moves the feed
  on. No post text is in the bootstrap or scenario block that ships.

## 3. The `phone` flag

A phone is the NPC's while it has it. Once the phone has left the NPC (the player holds it, or the
server has a gift record from that NPC for it: given, taken from its items, or dropped by the
player after that), the NPC is treated as `"phone": false` for the rest of the run: its social time
goes to a PC or kiosk, `/feed_post` with `object_id` null is refused, the frustration rules apply
to it as to any `"phone": false` NPC. It does not get the phone back. (A phone is droppable only
when its author sets `droppable: true`; none in `test_access_social` is, so there the player
cannot drop one.)

Review R1 changes: the server records `phonesTaken` the first time an NPC's phone reaches the
inventory by any route, and reads that, so a KO pickup followed by a remove keeps the NPC
phone-less on both sides. An NPC hands its phone over only when the scenario offers that give (a
`give_item:phone_friendface` or an unfiltered `give_npc_inventory_items` tag in its story or JSON);
a KO drop picked up from the floor stays allowed. A held phone counts only when its id matches a
phone the scenario declares, and `update_room add_object` refuses an unsourced Friendface phone.

Server: `Game#scenario_room_npc` returns the NPC with `phone: false` merged in when its phone is
taken. Every phone check (`feed_source_ok?`, `ease_report!`, `AccessWork.can_fail?`,
`shortest_use_seconds`) already reads that record, so nothing else changes. The room bootstrap
merges the same flag into the NPC it sends, so a reload starts the client right.
Client: when the player gains a `phone_friendface` with `phoneOf`, the NPC's live record gets
`phone = false` (one listener on the inventory add). npc-needs.js reads `phone` live already.

Validator (error): a `phone_friendface` with `phoneOf` must sit in the `itemsHeld` of that NPC;
that NPC must not be `"phone": false`; an NPC holds at most one. Validator (error): an NPC with a
`social_media` need and a `feed` whose phone is not false must hold its Friendface phone (q35: an
NPC that carries a phone holds it). Only `test_access_social` has social needs today.

## 4. The open route

`POST /games/:id/friendface_phone` with `{ npc_id }` (a string for an NPC's phone, null for the
player's own). The server looks in `player_state.inventory` for a `phone_friendface` whose
`phoneOf` equals `npc_id` (or is absent, for null). None: 403 `{ error: 'no such phone' }`, nothing
written. Found: `{ npcId, site, person, feedPosts }`, read only. Pundit `friendface_phone?` is
`show?`; no game lock needed (no write).

## 5. The notification blip

`systems/friendface-phone.js` listens to `npc_posted:*`, which social-feed.js emits only for a post
the server's `/feed_post` answer revealed (never on restore, so never on reload). When the player
holds a Friendface phone:

- the phone's unread count goes up: the player's own phone counts every post, an NPC's phone only
  that NPC's posts. A tray rule (`registerTrayRule`) draws the count as the slot badge;
- `phone_vibrate` plays once. While a person-chat or a full-screen minigame is open (the bark hold:
  `currentConversationMinigameType === 'person-chat'` or `MinigameFramework.holdsBarks()`), the
  sound waits and plays once when the hold ends, however many posts came in;
- the existing "posted on" toast is unchanged and keeps its own hold (notifications.js).

Opening a phone clears its count. Counts live in memory only: a reload starts at zero, which is
what "no blip on reload" needs.

## 6. Tests

- Rails: the route (own phone, NPC's phone, refused without the item, refused for a forged client
  item, refused for another NPC's id, no write); `phoneOf` stripped from a client-built item;
  phone taken makes `/feed_post` with `object_id` null refused and a PC use allowed; the room
  bootstrap carries `phone: false`.
- Validator: each rule above, both ways.
- JS: friendface-phone.js unit tests (badge counts per phone, sound once, held sound plays on
  release, restore never blips, open clears the count, live record set to `phone: false`).
- Scenario `test_access_social`: every social NPC with a phone holds one; Jake gives his when asked
  (an ink choice, `#give_item`); a spare phone for the player in the lobby. Live proof on :3032.

## Questions for the user

1. The phone does not go back to the NPC once taken, even if the player drops it or hands it
   back. Keeping it simple; returning it would need a give-to-NPC path.
2. The F sits on the Friendface green, not the original blue, so it reads as Friendface. Easy to
   keep blue if preferred.
3. An NPC's phone shows only what the player could already see on that profile. It could instead
   show the NPC's whole feed (its own phone, signed in), which would hand over every fact at once.
4. Unread counts are not saved: a reload clears them.
5. The validator makes the phone item required for social NPCs with a feed and a phone, as an
   error. A warning would leave older drafts valid.
