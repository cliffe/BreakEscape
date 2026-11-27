# Player state sync audit (2026-11-12)

The rule (user, 2026-11-12): player state synced between client and server must not grow so that
data is constantly sent back and forth. Anything that has to live in player state changes as a
delta or stays bounded.

This audit checks the access-model and office-life features on `main` (at 66996634d) and four
pending branches against that rule. It changes no code.

Classes used below:

- **Fine**: bounded by the authored scenario and sent only as a delta, or only on load.
- **Risk**: bounded, but sent whole on each change or on every reload, where a delta would do.
- **Problem**: grows with play and is sent whole, again and again, on ordinary requests.

## 1. How sync works

### Client to server: `PUT /sync_state`

- `public/break_escape/js/state-sync.js` runs every 30 s (`StateSync` constructor, `start()` at
  :144) and once more on `pagehide` (`flush()`, a keepalive request capped at 60 000 bytes of body).
- Each run sends only what changed since the last answer the server accepted (`buildChanges()`,
  :265). The diff has three granularities:
  - Keyed sections, diffed per top-level key (`KEYED_SECTIONS`, :13): `globalVariables`,
    `npcVisibility`, `npcHostility`, `triggeredEvents`, `npcInkVariables`, `mailState`. A key whose
    value changed is sent with its whole value, so an object or array stored in one global key goes
    up whole whenever any part of it changes.
  - Whole sections, sent whole when their JSON differs (`WHOLE_SECTIONS`, :24):
    `commandBoardLog`, `biometricSamples`, `playerHealth`.
  - Others: `notes` by note id; `phoneState` per changed contact (each contact's thread whole);
    `currentRoom`; `scenarioBriefShown`; `scenarioClock` and `timedMessages` whole, but only when
    something else is sent or every 5 minutes for the clock alone (:336).
- `this.confirmed` starts empty on every page (:133) and nothing seeds it from the bootstrap. The
  class comment says so (:107 to :109): "The first sync after a page load has nothing confirmed,
  so it sends a full snapshot". So every client-synced section goes up whole once per page load.
- The server (`GamesController#sync_state`, games_controller.rb:776) loads one narrow row
  (`SYNC_STATE_COLUMNS`), merges each section, saves only if something changed, and answers
  `{ success: true }`, plus `notSaved` and `mailTrimmed` lists when a cap applied. It never
  returns player state. A section refused over a cap is resent on every sync until it fits
  (state-sync.js:458), which is a cap behaviour, not growth.
- No access-model or office-life record is a sync section. Every record they add is written by the
  server on its own routes. They reach `sync_state` only through `globalVariables` keys the client
  writes (feed fact flags, `<npcId>_frustration`, workaround `setGlobal`s, `se_captures`,
  `__capture_log_seen`) and through `notes` (feed evidence notes).

### Server to client

| Request | What comes back | How often |
|---|---|---|
| `GET /scenario` (bootstrap) | The filtered scenario plus every saved block: objectives, globals, notes, ink variables, triggered events, clock, phone, mail, inventory, and the access blocks `sessions`, `signedInPcs`, `footholds`, `gainedFootholds`, `npcFrustration`, `feedPosts`, `lockoutPcs`, `wornItem` (games_controller.rb:278 to :415). | Once per page load. |
| `GET /room/:id` | The room's filtered data, with `room_states` changes and per-jack `jackPlanted` flags (Game#filtered_room_data, game.rb:1112). No per-game record beyond that. | Once per room per page. |
| `POST /sync_state` answer | `{ success }`, sometimes `notSaved`, `mailTrimmed`. | Each sync. |
| `POST /npc_frustration` | One answer per report: level, previous, tell, settled, `run`, `pending` (npc_frustration.rb:777). Bounded by the NPC's authored workarounds. | Event driven: a batch of at most 20 reports, at most one batch per 2 s (npc-reports.js:33). |
| `POST /npc_workaround` | One workaround body. | Once per hand-over. |
| `POST /feed_post` | One post with its fact, or nothing (social_feed.rb:38). | One per met social media use, under the pace floor. |
| `GET /network` | The view for one foothold, derived from the scenario and `footholds`. | On demand, when a link item is opened (network-links.js:232). |
| `POST /network/*` | The foothold, and the **whole inventory** (network_access.rb:235, :263, :335, :475). | Each plant, unplug, join, implant. |
| `POST /inventory` | The **whole inventory** on add and remove (games_controller.rb:1052, :1078, :1086). | Each pickup or removal. |
| `GET /capture_secrets` | The authored secret for each earned capture, and usernames in a network scenario. | Each capture log open, after a forced sync. |

### Is player_state ever sent whole?

No route sends the stored `player_state` as one object. The client-synced part of it does travel
whole twice per page load: down in the bootstrap's `saved*` blocks, and back up in the first sync
(above). The server-only access records are never sent as records; only derived views go down, on
load.

## 2. Measurements

A throwaway integration test (not committed) built games from seven real scenarios through
`Game#generate_scenario_data`, filled each access record to its bound, and measured bytes of JSON.
"Filled" means: every feed post shown, every room NPC at level 100 with both judged needs failed and
eased and every workaround handed, spent and done, every sign-in PC locked out and failed for every
account plus the 200 non-account entries the cap allows, a guest session at every sign-in PC, a
foothold at every jack (with a device copy) and every access point, 20 plants, one capture per phish
target, and a cloner holding the 50 cards it allows.

| Scenario | NPCs | Sign-in PCs | player_state empty | player_state filled | Bootstrap empty | Bootstrap filled |
|---|---|---|---|---|---|---|
| test_access_work | 19 | 15 | 1 012 | 44 588 | 9 842 | 25 383 |
| test_access_social | 9 | 12 | 785 | 33 487 | 6 545 | 22 313 |
| lab_physical_pentest | 10 | 3 | 1 661 | 32 217 | 23 374 | 36 213 |
| test_access_sessions | 8 | 8 | 763 | 31 140 | 4 246 | 16 101 |
| test_access_networks | 3 | 5 | 721 | 27 760 | 5 612 | 17 556 |
| test_needs_sims | 6 | 0 | 2 141 | 26 278 | 12 625 | 23 690 |
| lab_social_engineering | 5 | 0 | 937 | 25 086 | 69 134 | 80 655 |

Per record at the bound (bytes, largest scenario in brackets):

| Record | Stored | Sent to the client |
|---|---|---|
| `loginFailures` | up to 15 339 (test_access_work) | never |
| `loginLockouts` | up to 8 339 (test_access_work) | `lockoutPcs`, PC ids only: up to 148 on load |
| `npcFrustration` | up to 8 371 (test_access_work) | bootstrap block up to 5 286 on load |
| `feedRevealed` | 578 (test_access_social) | `feedPosts` 3 151 on load |
| `footholds` | 993 (test_access_networks) | bootstrap 1 309 on load |
| `gainedFootholds` | 64 | 64 on load |
| `guestSessions` and `guestSessionsAt` | 253 and 343 | never (sessions block only) |
| `plantedItems` | about 800 at 20 plants | never |
| `se_captures` (a global) | 619 at 5 targets | whole, on each new capture and on load |
| cloner `saved_cards` | 9 524 at 50 cards | whole on each save, and inside every inventory echo |
| Inventory with a full cloner | about 9 600 to 11 000 | whole on every inventory and network action |
| A frustration report answer | about 45 | per report |

The filled player_state (25 to 45 KB) is what the server rewrites on every server-side save; about
half of it is the 200-entry non-account allowance in `loginFailures` and `loginLockouts`. That cost
is on the database, not the wire.

## 3. Features on main

### 3.1 Friendface feeds: `feedRevealed`, feed facts, shown ids

- **Keys.** `feedRevealed { npcId => { shown: [postId], at } }` (social_feed.rb:8), server-only.
  Each fact the player grants sets one boolean global (`intelGlobal(fact)`, social-intel.js:198)
  and adds one evidence note.
- **Bound.** `shown` holds each authored post at most once, so the record is bounded by the
  authored feeds (578 bytes for the whole of test_access_social). Fact globals and notes: one per
  authored fact.
- **Sends.** `/feed_post` answers one post (a delta). `feedPosts` in the bootstrap lists every
  revealed post with its fact entry, once per load (3 151 bytes at the bound). The fact global and
  the note go up once each through `sync_state`, by key and by id.
- **Class: fine.** The fact globals and notes are also part of the per-load first-sync snapshot
  (R1 below).

### 3.2 NPC lockouts: `loginLockouts`, `easeAt`

- **Keys.** `loginLockouts ["pcId|username"]`, `loginFailures { key => { n, seq } }` (game.rb:1255),
  `npcFrustration[npc].lockedOut [pcId]` and `.easeAt { need => t }`, all server-only.
- **Bound.** Real accounts: one entry per sign-in PC and account pair. Guessed usernames: at most
  `MAX_NON_ACCOUNT_LOGIN_ENTRIES` (200, game.rb:1275), oldest dropped first. `easeAt` holds one time
  per judged need (two). `lockedOut` holds at most the NPC's own station.
- **Sends.** The bootstrap's `lockoutPcs` (PC ids, at most the sign-in PCs) on load. A `check`
  report's answer is one boolean. Nothing in `sync_state`.
- **Class: fine.** Optional saving on the database side: a non-account cap of 50 would cut about
  10 KB from a filled player_state that every server save rewrites.

### 3.3 Guest sessions and PC sessions: `guestSessions`

- **Keys.** `sessions { pcId => session }`, `signedInPcs [pcId]`, `guestSessions { pcId => npcId }`,
  `guestSessionsAt { pcId => t }`, `sharedLogins [npcId]`, all server-only.
- **Bound.** One entry per sign-in PC (sessions, guests), one per NPC (shared logins). A reload ends
  every guest session (`end_guest_sessions!`, npc_frustration.rb:228), so guests do not even
  accumulate across loads.
- **Sends.** `sessions` and `signedInPcs` in the bootstrap; `/login` and `/logout` answer one PC.
- **Class: fine.**

### 3.4 NPC needs and frustration: needs state, reports, borrow and workaround records

- **Keys.** `npcFrustration { npcId => { level, metAt, failAt, failWhy, easeAt, hands, handed,
  lastSpent, done, turn, lockedOut } }` (npc_frustration.rb:10), server-only. The needs system's own
  state (positions, queues, timers, chatter, the needs clock) lives only in the browser and is never
  synced. It writes scalar globals: `<npcId>_frustration` (npc-needs.js:2499), `<magnet>_servings`
  (:887), `heard_<knot>` (:2706), workaround and hook `setGlobal`s.
- **Bound.** Per NPC: two needs, one `handed` and one `lastSpent` slot per authored workaround,
  `done` at most the lasting workarounds (deduplicated, :195), `hands` and `turn` are counters.
  8 371 bytes for 19 NPCs at the bound. The globals are one key each, bounded by NPCs, magnets and
  authored knots.
- **Sends.** Reports are event deltas (20 per batch at most, one batch per 2 s at most), answers are
  about 45 bytes plus the NPC's pending hand-overs. The bootstrap block (up to 5 286 bytes) once per
  load. Each changed scalar global goes up as one key.
- **Class: fine.** `<npcId>_frustration` changes on every level change, but it is one number per
  NPC and rides the next 30 s sync, so it adds a few bytes per NPC per sync at most.

### 3.5 Captures and the capture log: `se_captures`, `plantedItems`, capture proofs

- **Keys.** `globalVariables.se_captures { targetId => entry }` (captures.js:17, client-written,
  eight closed keys per entry), `globalVariables.__capture_log_seen [rowKey]`
  (capture-log-model.js:10), `plantedItems [{ item, on }]` and `droppedItems [itemId]`
  (capture_proofs.rb:10), server-only.
- **Bound.** `se_captures`: one entry per authored phish target, first capture wins (619 bytes at
  5 targets, about 120 bytes per entry). `__capture_log_seen`: one key per capture, session or
  finding row, so bounded by targets, PCs times footholds, and filed items. `plantedItems` and
  `droppedItems` are deduplicated (capture_proofs.rb:49, game.rb:482) and bounded by device and
  object pairs.
- **Sends.** `se_captures` and `__capture_log_seen` are single global keys, so each new capture or
  new row sends the **whole** map or list again, and both go up whole in each first sync after a
  load. `plantedItems` and `droppedItems` never leave the server. `GET /capture_secrets` sends every
  earned secret on each capture log open (bounded, small).
- **Class.** `plantedItems`, `droppedItems`, capture proofs, capture secrets: **fine**.
  `se_captures` and `__capture_log_seen`: **risk** (R2, R3).

### 3.6 Networks: footholds, implants, Wi-Fi joins, mapped shares, outages

- **Keys.** `footholds { footholdId => { via, network, source, device | name, seq } }` and
  `gainedFootholds [sourceId]` (network_access.rb:11), server-only. Implants and Wi-Fi joins write
  the same two keys. Mapped shares hold no state (derived from the session and the scenario,
  network_access.rb:997). Outages are scalar globals named by `downIf` (:776).
- **Bound.** One foothold per jack, per Wi-Fi network and per implantable PC; a jack foothold holds
  one device copy (about 300 bytes). `gainedFootholds` is deduplicated (:229, :329, :341, :467).
  993 bytes at the bound in test_access_networks.
- **Sends.** `footholds` and `gainedFootholds` in the bootstrap; `GET /network` on demand for one
  foothold. But every `POST /network/plant`, `unplug`, `join` and `implant` answer carries the
  **whole inventory** (:235, :263, :335, :475), which the client replaces wholesale
  (network-links.js:409, :469, :564).
- **Class.** The network records: **fine**. The inventory echo on the network routes: **problem**
  (P2, shared with `/inventory`).

### 3.7 Wearables and keycards: cloner saved cards

- **Keys.** The cloner inventory item's `saved_cards` (game.rb:3094), `serverClones { cardId =>
  { source, uidOnly } }` and `copiedItems [itemId]` (game.rb:1256), `worn` and `wearableGlobals`
  (wearables.rb:17, :29).
- **Bound.** `saved_cards`: at most 50 cards (`MAX_SAVED_CARDS`, rfid-data.js:18) and 64 KB
  (`MAX_SAVED_CARDS_BYTES`, game.rb:3087); 9 524 bytes measured at 50 realistic cards.
  `serverClones` and `copiedItems`: one per card or item. `worn`: one record.
- **Sends.** Every saved card makes the client post the **whole** card list again
  (`persistSavedCards`, rfid-data.js:367). The list also sits inside the cloner item, so it is in
  every inventory echo (P2) and in the bootstrap's `playerInventory`. `serverClones`, `copiedItems`
  and `worn` go down only as the bootstrap's `wornItem` or not at all.
- **Class.** `serverClones`, `copiedItems`, wearables: **fine**. `saved_cards`: **problem** (P1).

## 4. Pending branches

### 4.1 build/ff-phone: `phonesTaken` and the unread badge

- `phonesTaken [npcId]` is server-only, deduplicated, one per NPC with a phone
  (`add_inventory_item!` on the branch). **Fine.**
- The unread count is a client `Map` and is not saved (FRIENDFACE_PHONE_ITEM_PLAN.md, "Unread counts
  are not saved"). **Fine.**
- `POST /friendface_phone` (`open_friendface_phone` on the branch) answers the player's own phone
  with `feedPosts` for **every** NPC (all revealed posts with their fact entries, 3 151 bytes at the
  bound in test_access_social) on every open, and an NPC's phone with that NPC's slice. The client
  does not merge it: it reads only `site` and `person` to launch the view, which draws from the
  feed store it already holds. **Problem** (P3).

### 4.2 build/feed-lockout: `borrowLockoutSeen`

- A client-only `Set` of PC ids in the report queue (npc-reports.js on the branch), rebuilt from
  check answers, never sent or saved. The branch adds no player_state key; its `met_use` value is a
  per-request argument. **Fine.**

### 4.3 build/usb-habit: the USB stick item

- The stick is an ordinary inventory item; its files are served only to a holder and never ride in
  room data, the bootstrap or the inventory (branch tests). The branch adds
  `npcFrustration[npc].usbUses`, an integer clamped to the top of `USB_EVERY_RANGE`, server-only,
  and one `setGlobal` boolean. **Fine.**

### 4.4 C3 replies plan (build/9-2-c3-plan): the `to` map and reply records

- `feedRevealed[npc].seq { postId => n }` and `.to { replyId => { post, npc } }`, server-only,
  one entry per served post or reply, so bounded by authored content (plan section 5.1). The
  `/feed_post` answer stays one post (a delta), the bootstrap lists each served post once per load.
  `next_seq` is derived, not stored. **Fine.**
- The plan has the phone answer slice served replies into `feedPosts` (plan section 5, the
  `open_friendface_phone` bullet) "for the leak scanner and the tests". That carries P3 forward and
  makes it bigger with every reply. Under the rule, C3 should not add to that answer; the leak
  scanner can check `GET /scenario` and `/feed_post` instead.

### 4.5 The same plan's "Later: reactions"

Its sketch (plan section 13) already fits the rule. To stay inside it, a reactions record has to be:

- **Server-owned**, beside `feedRevealed`: `feedReactions { postId => { npcId => key } }`, never a
  `sync_state` section and never a client global.
- **Bounded by authoring**: at most one key per authored reaction (each fires once), a fixed key
  set (like, sad, angry, laugh), no free text.
- **Delta on the wire**: the one new reaction rides the answer to the request that fired it
  (`{ postId, npcId, key }`, about 60 bytes); the bootstrap lists served reactions once per load.
- **Not in a phone answer**, for the reason in 4.4.
- **A player reaction**, if it ever comes, as `POST /feed_react { postId, key }` with one stored key
  per post for the player (bounded by served posts) and an answer of that one reaction. Never a
  growing global the client syncs.

## 5. Risks and problems, with fixes

| Id | Item | Class | What travels now | Fix | Size after |
|---|---|---|---|---|---|
| P1 | Cloner `saved_cards` | Problem | The whole list (up to 64 KB, 9.5 KB at 50 cards) on every card saved; also inside every inventory echo and the bootstrap. Over 50 saves that is about 240 KB of requests. | A delta action: `update_saved_cards` replaced by `add_saved_card` and `remove_saved_card` taking one card (or card id), the server merging by card id under the same caps. Strip `saved_cards` from inventory echoes (P2); keep it in the bootstrap. | About 190 bytes per save. |
| P2 | Inventory echo on `POST /inventory` and `POST /network/*` | Problem | The whole inventory (about 10 KB with a full cloner, a few KB without) on every pickup, removal, plant, unplug, join and implant. The network routes copied the pattern from `/inventory`. | Answer `{ added: [item], removed: [itemId] }` and have `syncInventoryFromServer` apply the delta; send the whole inventory only on load. | About 200 to 500 bytes per action. |
| P3 | `/friendface_phone` answer (ff-phone; C3 would enlarge it) | Problem | Every revealed post and fact on each open of the player's own phone (3.2 KB at the bound in test_access_social, more with C3 replies), unused by the client. | Drop `feedPosts` from the answer (the view draws from the feed store); if a test needs the slice, test `feed_posts_for_client` directly. | About 80 bytes per open. |
| R1 | First sync after each page load | Risk | `this.confirmed` starts empty, so the whole client-synced state goes up once per load: every global (feed fact flags, `<npcId>_frustration`, workaround globals, `se_captures`, `__capture_log_seen`, landing pages, osint state), every note (feed evidence notes included), ink variables, triggered events, mail (capped at 1 MB) and the rest. It came down in the bootstrap moments before. | Seed `this.confirmed` from the bootstrap's `saved*` blocks after restore (globals, notes, ink variables, triggered events, visibility, hostility, mail, board log, samples, health), so the first sync sends only what changed since load. | From the whole client state per load (0.2 to 0.7 KB of globals measured, mail far more) to the changes alone. |
| R2 | `se_captures` global | Risk | The whole map (about 120 bytes per target, 619 at 5) on each new capture, plus R1. | Store one global key per target (`se_capture__<targetId>`), so the keyed diff sends only the new entry; or let the server own the record, since `capture_secrets` already gates on it. Keep the closed key set at the sync boundary. | About 130 bytes per capture. |
| R3 | `__capture_log_seen` global | Risk | The whole seen list on each new row, plus R1. Small and bounded. | One boolean global per row key, or keep the list in the browser only and rebuild "new" from the newest row time. | Tens of bytes per change. |

Not risks under the rule, but worth a tidy-up:

- `ApiClient.syncState` (api-client.js:218) is unused and would `PUT /sync_state` the full
  `globalVariables` with no `clientTs`. Deleting it removes a way to break the rule by accident.
- The 200-entry non-account allowance in `loginFailures` and `loginLockouts` is about 11 KB of a
  filled player_state that every server save rewrites (section 2). A cap of 50 keeps the guessing
  defence and cuts the write.

## 6. Method

- Code read on `main` at 66996634d: state-sync.js, api-client.js, games_controller.rb (`scenario`,
  `room`, `sync_state`, `inventory`, the access and network actions), game.rb, social_feed.rb,
  npc_frustration.rb, network_access.rb, capture_proofs.rb, wearables.rb, captures.js,
  capture-log-model.js, social-feed.js, npc-needs.js, npc-reports.js, rfid-data.js,
  network-links.js.
- Pending branches read as diffs against `main`: build/ff-phone, build/feed-lockout,
  build/usb-habit, build/9-2-c3-plan (plan sections 5, 5.1 and 13).
- Measurements from a throwaway integration test in the Rails test environment (transactional
  fixtures, nothing kept), driving `GET /scenario`, `POST /npc_frustration` and `POST /inventory`
  for real and filling records directly to their bounds. Client-side payloads (the keyed diff of a
  global) are computed from the code, not captured from a browser.
