# Player state deltas: plan

Status: **Final** (2026-11-12). Nothing here is built yet. Code checked on
`main` (6a834437c, which holds the Friendface phone work) as merged into `build/sync-audit` at
907ee1d31; every file and line named below was checked on that commit. The capture sizes in 6.4
and section 8, the authored capture string lengths in 6.3 and the writer paths in 6.7 were measured
on that commit by rendering every scenario and walking its capture writers.

Line numbers drift whenever main is merged. Each reference names the function or key as well as
the line, so a builder who finds a line moved searches for the name; the name is authoritative.

## 0. The rule and the scope

The rule (user, 2026-11-12): player state synced between client and server must not grow so that
data is constantly sent back and forth. Anything that lives in player state changes as a delta or
stays bounded. Every change below says how big its state can grow and what each request sends;
section 8 collects the numbers.

This plan fixes five problems the player state audit found against that rule:

| Id | What travels today | Fix in this plan |
|---|---|---|
| P1 | The RFID cloner's whole `saved_cards` list (up to 64 KB, 9.5 KB at 50 cards) on every card saved, and inside every inventory echo | One card per request, stored only for a copy the server recorded; never in an echo |
| P2 | The whole inventory in the answer to `POST /inventory` and every `POST /network/*` route | `/inventory` answers `{ success }`; the network routes answer the touched items added and the touched ids removed |
| R1 | The first `PUT /sync_state` after each page load sends every client-synced section whole (globals, notes, ink variables, triggered events, mail), and every phone thread with history | `confirmed` is seeded from the bootstrap's saved blocks, with an order-independent compare on both the sync and the phone side, so the first sync sends only what changed since load |
| R2 | The `se_captures` global goes up whole on each new capture, and any sync can write it | A server-owned capture record, written one entry per sync from the scenario's own capture writers, with a reveal check before any secret is served |
| R3 | The `__capture_log_seen` list goes up whole on each new row | One boolean global per row |

Out of scope: the `POST /friendface_phone` answer, which is read-only and on a game open carries
only the site and the profile (`open_friendface_phone`, social_feed.rb:208; the revealed posts ride
it only when a test asks with `posts: 1`), and the database-side size of `loginFailures`.

Cheat policy (user), as it applies here: the server hard-enforces secrets, keys and forged items.
Steps whose verdict is computed in the browser (a phish landing, an NPC using a planted device) stay
best effort, with a real server sanity check, and the check must never block the intended route.

Each section gives the files and functions, the wire format before and after, compatibility with
old saves, old tabs and games resumed mid-way, the cheat policy, and the tests. Section 9 is the
build order, section 10 the shared tests and the live proof, section 11 a short guide for future
features.

## 1. Summary

| Id | Change | Bytes per action after | Effort | Risk |
|---|---|---|---|---|
| R1 | Seed `confirmed` and the phone seed from the bootstrap; order-independent compare; the client exports what the server stores | First sync after load: nothing, or `currentRoom` with the clock, timed texts and mail jobs (a few hundred bytes) when the saved room differs | About 300 lines JS, 40 lines Ruby (named constants, one fixture test), 2 call sites | Medium: a wrong seed would skip a write; guarded by the two rules in 3.3 |
| P2 | `{ success }` on `/inventory`; `added` / `removed` on `/network/*` | About 300 to 500 per network action (from 3 to 11 KB); about 20 per `/inventory` action | About 120 lines Ruby and JS | Medium: old tabs need the one-release opt-in in 4.4 |
| P1 | One card per save, inside `POST /clone_card`; one clone source rule for every clone path | About 300 to 1 100 up, 50 down per save (from up to 64 KB up) | About 220 lines Ruby and JS | Medium: the save now depends on the server recording the copy |
| R3 | One seen key per capture log row | About 45 per new row | About 30 lines JS | Low |
| R2 | Server-owned `seCaptures`, written from the sync body; reveal check; authored writer secrets served by the server | About 120 up, up to about 900 down per capture, once | About 420 lines Ruby and JS | Medium: a data move in the bootstrap step (no schema change) and a new sync part |

## 2. Shared groundwork

Five small pieces are used by more than one change. They are built first (section 9, step 1).

### 2.1 Order-independent comparison

`player_state` is a `jsonb` column on Postgres (test/dummy/db/schema.rb:43). `jsonb` does not keep
object key order: it stores keys sorted by length and then bytes. A value that went up as
`{"read":true,"id":"m1"}` comes back in the bootstrap as `{"id":"m1","read":true}`, and objects
nested inside arrays (a phone thread's `history` messages) are reordered the same way.

- Add `export function stableJson(value)` to `public/break_escape/js/state-sync.js`:
  `JSON.stringify` with object keys sorted at every depth, arrays kept in order, `undefined` dropped
  as `JSON.stringify` drops it. Expose it as `StateSync.stableJson` too, so a caller holding
  `window.stateSync` needs no import.
- Use it in place of `json` for every comparison string in `buildChanges()` (keyed sections, notes,
  whole sections, `timedKey`, `clockKey`) and in `mailJobsChangeKey`. The request body is unchanged:
  only the strings kept in `confirmed` change.
- Phone threads: `NPCManager` compares with `JSON.stringify` today in three places
  (`exportPhoneState`, npc-manager.js:2241; `markPhoneStateSynced`, :2255; `restorePhoneState`,
  :2320). The saved thread comes back reordered, so the seed never matches and every thread with
  history is resent on the first sync after each load, in every mission with phone contacts. Each of
  the three methods gains an option `keyOf` (default `JSON.stringify`), used for every string it
  stores or compares in `_phoneStateSent`. `StateSync.buildPayload` passes `keyOf: stableJson` to
  `exportPhoneState`, `StateSync.confirm` passes it to `markPhoneStateSynced`, and `core/game.js`
  passes `keyOf: window.stateSync?.constructor?.stableJson` to `restorePhoneState`. The function is
  passed in, not imported, because about thirty node harnesses copy `npc-manager.js` with a fixed
  import list, and a new static import there would break each of them. If any caller passes nothing,
  both sides fall back to `JSON.stringify` and the worst case is today's one resend.
- The seed is the server's sanitised copy, and the client's export is its own value. Where a server
  sanitiser changes a value, the two differ on every load, and that key would go up on the first
  sync of every load. The rule: **the client exports what the server stores**, for every keyed
  section the server rewrites. It is applied to every section below rather than recorded as a
  known resend, because each clip is a small pure function, it changes nothing the server keeps
  (the server would make the same cut), and it lets 3.7 assert that an unchanged load sends
  nothing at all. A rule left out would cost one key per load for as long as the player keeps
  that value, which the size rule does not allow.
- **Characters are code points.** Ruby's `String#length` and `[0, n]` count code points, and
  JavaScript's `length` and `slice` count UTF-16 units, so a string holding an emoji or another
  astral character is cut at a different place on each side. Every clip below counts and cuts by
  code points, through two helpers with these signatures:
  - `cpWithin(s, n)`: true when `s` has at most `n` code points. It answers true straight away
    when `s.length <= n` (a UTF-16 count never undercounts code points, so that fast path is
    exact), and otherwise compares `Array.from(s).length` with `n`. Code-point counts are only
    ever compared with a limit, so no helper returns a bare count.
  - `cpSlice(s, n)`: the first `n` code points of `s`. It returns `s` untouched when
    `s.length <= n`, and otherwise `Array.from(s).slice(0, n).join('')`.
  Byte limits (`bytesize` in Ruby) are measured as UTF-8 bytes with
  `new TextEncoder().encode(s).length`. The helpers are written as small private functions in
  mail-scheduler.js and npc-conversation-state.js and as static methods on `NPCManager`, not as a
  shared module, so no harness copy list changes (the reason `keyOf` is passed in, above); one node
  test runs every copy over the same astral strings.
- **Blank, in the Rails sense.** Ruby's `present?` on a string is false for an empty string and
  for one holding only whitespace. The client tests `typeof s === 'string' && /\S/u.test(s)`. The
  shared fixture (3.7) holds an empty id, a whitespace-only id and a whitespace-only thread key.
- Ink variables: `exportNpcInkVariables` (npc-conversation-state.js:221 to :236) already keeps
  only scalar values (:229), the same value test as `merge_npc_ink_variables!` (game.rb:3693 to
  :3703), so an ink LIST value is never sent and cannot differ. The server also drops an NPC id or
  a variable name over 100 code points (:3698, :3701). The export gains the same two tests, with the
  limit named `MAX_NPC_INK_NAME_CHARS` on both sides. No scenario has such a name, but the mirror
  costs two comparisons and lets 3.7 assert that an unchanged load sends nothing.
- Phone threads, `_phoneStateEntry` (npc-manager.js:2259) against `sanitize_phone_state_entry`
  (game.rb:3781 to :3825). It already picks `PHONE_MESSAGE_FIELDS` (npc-manager.js:145), which
  equals `PHONE_MESSAGE_KEYS` (game.rb:3754), drops empty texts and keeps the last 150 messages.
  The export gains the server's other tests:
  - a message that is not an object, or has no string `type` or no string `text`, is dropped whole
    (game.rb:3783); a `type` over 20 code points drops only the `type` key, as the server's
    `select` does;
  - `text` cut to 4 000 code points;
  - `timestamp` and `gameTime` kept only when numbers;
  - `isBark`, `timed` and `preloaded` kept only when boolean (the server's `else` branch,
    game.rb:3792; the client keeps any non-null value today, npc-manager.js:2266). `read` is
    already forced to a boolean;
  - `storyState` kept only when a string whose UTF-8 size is at most 61 440 bytes
    (`60.kilobytes`, game.rb:3753, :3799), in place of today's 60 000 characters
    (npc-manager.js:142, :2274), and `storyPath` only with it, only when a string, and at most 300
    code points;
  - `currentKnot`, `lastEnteredKnot` and `preloadedKnot` each kept only when a string of at most
    200 code points (game.rb:3803 to :3805); a number or an object there drops the key;
  - `deferredTags`: the elements that are strings of at most 300 code points, in order, then the
    first 100, sent only when one remains;
  - `deferredGlobals` and `deferredGlobalsBase` keep only keys of at most 100 code points
    (game.rb:3807 to :3822; the client already keeps only scalar values);
  - the entry is not exported when no message and no stored story position remain, as the server
    returns nil for it (game.rb:3825).
  A multi-byte ink position between 60 000 characters and 61 440 bytes is lost on reload today
  because the server drops it. After the change it is still not stored (the server's cap is
  unchanged), but it is no longer resent on every load.
- Mail messages: new pure `clipMailMessage(key, msg)` in
  `public/break_escape/js/systems/mail-scheduler.js`, an exact mirror of the `mailboxes.` branch of
  `mail_state_updates` (game.rb:3943 to :3956) followed by `sanitize_mail_message` and
  `sanitize_mail_json` (game.rb:4053 to :4077, :4162 to :4179). `exportMailState()` builds each key
  as today (`mailboxes.<box>.<id>`, mail-scheduler.js:165) and passes the key and the message
  (seeded stubs included) through it. The rules, in the server's order:
  - **The ids come from the key.** The key after `mailboxes.` is split at its first dot into the
    box id and the message id, as Ruby's `split('.', 2)` does. The client finds the first dot with
    `indexOf`, because JavaScript's `split('.', 2)` drops everything after the second piece. The
    key is not exported unless the box id passes `mail_box_id?` (a string, not blank, at most
    `MAX_MAIL_BOX_ID_CHARS`, 100, code points; game.rb:4156) and the message id passes `mail_id?`
    (a string, not blank, at most `MAX_MAIL_ID_LENGTH`, 300, code points; game.rb:4152). A value
    that is not an object is not exported (the server's `sanitize_mail_message` returns nil for
    it). Otherwise the message is clipped with its `id` set to the message id from the key, as the
    merge does with `value.merge('id' => msg_id)`. So a message whose own `id` is a number, or
    differs from its key, exports with the string id the server stores.
  - only keys in `MAIL_MESSAGE_KEYS` are kept, and only when present (a key present with `null`
    stays present where the rule for that key keeps `null`);
  - `body`, `hiddenText` and `hiddenTextLabel`: kept only when a string, cut to 4 000 code points;
    any other value, `null` included, drops the key;
  - `folder`: kept only when `"inbox"` or `"sent"`;
  - `gameTime`: kept only when a number;
  - `read` and `seeded`: kept only when boolean; `landed`: kept only when boolean or `null`;
  - `tells`: kept only when an array; its elements that are strings of at most 100 code points,
    in order, then the first 50. A longer tell is dropped, never cut;
  - every other key goes through `clipMailJson(value, 0)`:
    - a string is cut to 1 000 code points; a number, a boolean and `null` are kept;
    - an object at depth 6 or more becomes `{}` and an array at depth 6 or more becomes `[]`
      (kept, empty). The value passed in is depth 0, so for a message field an object nested six
      levels below the field is the first to be emptied;
    - otherwise an object keeps its first 200 entries in insertion order, then drops each of
      those whose key is over 100 code points (the server takes the 200 before it drops long
      keys, so a dropped key is not replaced by the 201st); an array keeps its first 200
      elements; each kept value is clipped at depth plus one;
    - `NaN` and `Infinity` need no rule: `JSON.stringify` writes them as `null`, so the server
      never receives a non-finite float.
  A 5 000-character sent body therefore goes up cut to 4 000, and the seed matches it.
- Mail threads: new pure `clipMailThread(key, thread)` mirrors the `threads.` branch of
  `mail_state_updates` (game.rb:3957 to :3966) and `sanitize_mail_threads` (game.rb:4099 to
  :4125) for one `threads.<key>` value. A thread whose key is blank or over 200 code points, or
  whose value is not an object, is not exported. It keeps `position` only when it is a string
  whose UTF-8 size is at most 61 440 bytes, or a plain object (not an array, not `null`) whose
  `JSON.stringify` UTF-8 size is at most that; an array `position` is dropped, as the server keeps
  only a String or a Hash. `choices` (when an array) is kept as
  `clipMailJson(choices.slice(0, 20), 0)`: the server runs
  `sanitize_mail_json(thread['choices'].first(20))` (game.rb:4111), so the array itself is depth 0
  and each choice is depth 1. `expects` is kept only when its `mode` is `choices`, `compose` or
  `waiting`, with `targetId` only when a string of at most 100 code points and `options` as the
  string elements, first 10, each cut to 1 000 code points, sent only when one remains. Every other
  key is dropped, and a thread with none of these exports as `{}`, as the server stores it.
- Mail drafts: new pure `clipMailDrafts(drafts)` mirrors `sanitize_mail_drafts` (game.rb:4127 to
  :4135): account ids of at most 100 code points whose draft is an object, each draft picked to
  `MAIL_DRAFT_KEYS` with each value through `clipMailJson(..., 0)`. A long unsent `freeText` goes
  up cut to 1 000 code points, as the server stores it.
- Mail metrics already match: the server keeps `sent`, `failed` and `landed` as clamped integers
  and `firstTryLanded` as a boolean (`sanitize_mail_metrics`, game.rb:4137 to :4150), and the
  client writes exactly those (mail-bridge.js:274). The export is left alone, and a node case pins
  it.
- Mail jobs go through `mailJobsChangeKey` (state-sync.js:19), which compares only ids and kinds,
  and they ride every request with the clock in any case (3.4), so the job sanitiser needs no
  mirror.
- **The limits are named constants on both sides.** The literals inside the Ruby methods move into
  named constants in game.rb, with no change of value or behaviour: `MAIL_BODY_KEYS`
  (`%w[body hiddenText hiddenTextLabel]`), `MAIL_FOLDERS` (`%w[inbox sent]`),
  `MAX_MAIL_TELL_CHARS` (100), `MAX_MAIL_TELLS` (50), `MAX_MAIL_JSON_KEY_CHARS` (100),
  `MAX_MAIL_BOX_ID_CHARS` (100), `MAX_MAIL_THREAD_KEY_CHARS` (200), `MAX_MAIL_THREAD_CHOICES` (20),
  `MAIL_EXPECT_MODES` (`%w[choices compose waiting]`), `MAX_MAIL_EXPECT_TARGET_CHARS` (100),
  `MAX_MAIL_EXPECT_OPTIONS` (10), `MAX_MAIL_DRAFT_ACCOUNT_CHARS` (100), `MAX_PHONE_TYPE_CHARS`
  (20), `MAX_PHONE_STORY_PATH_CHARS` (300), `MAX_PHONE_KNOT_CHARS` (200),
  `MAX_PHONE_DEFERRED_TAG_CHARS` (300), `MAX_PHONE_DEFERRED_TAGS` (100),
  `MAX_PHONE_SCALAR_KEY_CHARS` (100) and `MAX_NPC_INK_NAME_CHARS` (100). Where a limit is written
  in two methods, both use the constant: `MAX_MAIL_THREAD_KEY_CHARS` in `mail_state_updates` and
  in `sanitize_mail_threads`, and `MAX_MAIL_BOX_ID_CHARS` in `mail_box_id?`. The client gives each
  new constant the server's name. Five client constants already exist under other names and keep
  them, because callers and harnesses use them: `MAIL_MESSAGE_FIELDS` (mail-scheduler.js:43,
  mirrors `MAIL_MESSAGE_KEYS`), `NPCManager.PHONE_MESSAGE_FIELDS` (npc-manager.js:145, mirrors
  `PHONE_MESSAGE_KEYS`), `PHONE_HISTORY_MAX_MESSAGES` (:133, mirrors
  `MAX_PHONE_HISTORY_MESSAGES`), `PHONE_MESSAGE_MAX_CHARS` (:141, mirrors `MAX_PHONE_MESSAGE_TEXT`)
  and `PHONE_STORY_STATE_MAX_CHARS` (:142), which is renamed `PHONE_STORY_STATE_MAX_BYTES` with the
  value 61 440, since it becomes a byte limit (its only reader is npc-manager.js:2274). Two tests
  keep the sides in step (3.7): a constants test that reads every one of these names from game.rb's
  source, with an explicit map for the five existing client names, and a behaviour test on a
  shared fixture that trips every rule.
- Number forms can differ (Ruby writes a float `1.0` as `1.0`, the browser as `1`). Two residuals
  are known and accepted: that one, and a mail thread `position` object within a few bytes of the
  61 440-byte cap, which Rails measures with `to_json` (it escapes `<`, `>` and `&` as six-byte
  `\u` sequences) while the client measures `JSON.stringify`. The client keeps the position in
  that band, so nothing is lost that the server would keep, and the cost is that one key on the
  first sync of each load while the position sits in the band. Either residual resends one key,
  never the section, and loses nothing. The node cases in 3.7 pin the known cases so a new
  difference shows up as a failing test.
- Cost: sorting keys of the whole client state each 30 s run. Mail is the largest section (capped at
  1 MB on the server, game.rb:3832); the sort is linear in its size and runs only when a sync runs.

### 2.2 Sync parts and tracked requests

Two kinds of write now leave the keyed globals: a capture (R2), which travels inside the sync body,
and a card (P1), which travels in its own request. Callers that need "the server holds everything"
call `stateSync.syncConfirmed()` first: capture-rows.js:70 (`loadCaptureSecrets`),
unlock-system.js:279 (`remoteCapturedSignIns`), triage-starter.js:227 and the quit path in
game-menu.js:296. They must wait for both kinds.

`public/break_escape/js/state-sync.js`:

- `registerPart(name, { build, onAnswer, pendingCount, flushKeep })`: a named extra part of the sync
  body. `build()` returns the value to send or `undefined`. A part with a value counts as a change,
  so `buildChanges()` does not return null while it has one. `onAnswer(response)` is called after
  every 2xx answer, stale or not, before the stale check returns. It is never called for a refused
  sync: when `merge_last_write_wins_sections` refuses (a refused `currentRoom`), `sync_state` raises
  `ActiveRecord::Rollback` and answers 403 (games_controller.rb:787 to :788, :803) before the
  capture step runs, so nothing the part sent was recorded. The part's entries stay pending, go
  with the next run, and `syncConfirmed()` stays false until a 2xx answers them; the same holds
  for any other non-2xx answer or a network failure. `pendingCount()` says how many
  entries the server has not yet acknowledged. `flushKeep(changes)` returns extra keyed changes the
  pagehide flush must keep in its fallback lists (6.3, 6.5).
- `_syncOnce()` resolves `{ ok: false }` while any part's `pendingCount()` is above zero after the
  run, so `syncConfirmed()` never resolves true while the server lacks a capture.
- `flush()` puts every part's value into each of its three body lists, after `clientTs`.
- `track(promise)`: keeps a request in a set until it settles. `syncConfirmed()` awaits every tracked
  promise (`Promise.allSettled`) before its first run. `rfid-minigame.js` `recordCloneOnServer`
  calls it, and keeps publishing `window.pendingCardCloneRecord` for unlock-system.js.

### 2.3 Items in answers

- `Game#item_for_answer(item)`: a deep copy of a stored inventory item without `saved_cards`. Every
  item an answer carries goes through it, so the cloner's list can never ride an echo, even when the
  cloner is itself a touched item.

### 2.4 One locked bootstrap step

`GET /scenario` is not in the `with_game_lock` list (games_controller.rb:93 to :95), nor is
`GET /capture_secrets`. Both read a full `@game` loaded before any lock, and `save!` writes the
whole `player_state` column, so a write from that copy would overwrite a `PUT /sync_state` that
committed after the load (for example the old page's pagehide flush landing during the new page's
bootstrap). `end_claimed_sessions!` (game.rb:2023) shows the safe pattern: `with_lock`,
which reloads the row, then decide again, then save.

- New `Game#prepare_bootstrap_state!`: decides from the loaded copy whether anything needs a write
  (5.2 `cards_need_repair?`; 6.3 `legacy_captures?`, `unrecorded_shared_logins?` and
  `stampable_captures?`). Each check reads only the loaded copy and writes nothing. When none holds,
  it returns without a lock. Otherwise it runs `with_lock`, repeats each check on the reloaded row,
  runs `repair_saved_cards!`, `migrate_legacy_captures!`, `record_shared_logins!` and
  `stamp_proven_captures!` (none of which saves), and saves once if anything changed. A game whose
  only open item is a capture that can never be proven (a forged one) takes no lock, because
  `stampable_captures?` is true only when a stamp would change something.
- `GamesController#scenario` calls it straight after `authorize` (games_controller.rb:279), before
  `filtered_scenario_for_bootstrap` and before any `saved*` block or `playerInventory` is read into
  `filtered`, so the client sees the repaired inventory and the migrated record.
- Every reader stays read-only. `se_captures_record` (6.3) never writes, and `GET /capture_secrets`
  writes nothing. The only writers are `PUT /sync_state` (already under `Game.lock`,
  games_controller.rb:783), the locked bootstrap step, and the locked routes in `with_game_lock`.

### 2.5 Pre-parse body caps

The only cap read before the body is parsed is `refuse_oversized_npc_frustration`
(games_controller.rb:35, :1737), which reads `Content-Length` alone. It becomes
`refuse_oversized_body`, with a per-action limit table: `npc_frustration` keeps its limit, and
`clone_card` gets 8 KB (a card is at most 4 KB, 5.2). `prepend_before_action` lists both actions.
`PUT /sync_state` keeps its existing caps; its new `captures` part is capped after parsing (6.3), as
its other sections are.

## 3. R1: seed `confirmed` from the bootstrap

### 3.1 Today

`StateSync` is built in `public/break_escape/js/main.js:145` with `this.confirmed = {}`
(state-sync.js:133). The bootstrap (`GamesController#scenario`, games_controller.rb:278) sends every
saved block as `saved*`, and `core/game.js` restores them (the globals at game.js:1707 and :1708,
then the other blocks). The first `buildChanges()` then finds nothing confirmed and sends every key
of every section, mail included, although the server sent the same values moments before. Phone
threads have a seed of their own (npc-manager.js:2314, called from game.js:1800), but it never
matches (2.1).

### 3.2 Change

`public/break_escape/js/state-sync.js`:

- New exported pure function `seedFromSaved(saved)`, returning a `confirmed` object built from the
  bootstrap blocks, every value turned into its `stableJson` string:

  | `confirmed` entry | Source in the bootstrap | Notes |
  |---|---|---|
  | `globalVariables[key]` | `savedGlobalVariables` | Keys in `SERVER_OWNED_GLOBALS` skipped (below) |
  | `npcVisibility[key]` | `savedNpcVisibility` | |
  | `npcHostility[key]` | `savedNpcHostility` | |
  | `triggeredEvents[key]` | `savedTriggeredEvents` | |
  | `npcInkVariables[npcId]` | `savedNpcInkVariables` | |
  | `mailState[key]` | `savedMailState`, flattened (below) | `jobs` through `mailJobsChangeKey` |
  | `notes[id]` | `savedNotes` | Each note picked to the synced fields first |
  | `commandBoardLog` | `savedCommandBoardLog` | |
  | `biometricSamples` | `savedBiometricSamples` | Each sample picked to the synced fields first |
  | `playerHealth` | `savedPlayerHealth` | Absent at 0 HP, so not seeded then |
  | `scenarioBriefShown` | `scenarioBriefShown` | |
  | `currentRoom` | `savedCurrentRoom` (new, below) | |
  | `timedMessagesKey` | `savedTimedMessages` | Pending ids and delivered list, as `buildChanges` builds it |
  | `clockKey`, `clockElapsedMs` | `savedScenarioClock` | And `clockConfirmedAt = now` |

- New exported constant `SERVER_OWNED_GLOBALS`, empty in this step: the globals the server owns,
  which the client never sends and never seeds. Step 6a (6.3) adds `se_captures` to it.
- The note and sample field picks move out of `buildPlayerSections()` into two helpers
  (`pickNote`, `pickSample`) so the seed and the export use the same fields.
- New method `seedFromBootstrap(scenario, { mailKeys } = {})`: runs once per page (`this._seeded`).
  For each entry of `seedFromSaved`, it sets the value only where `confirmed` has none yet, so a sync
  that ran before the seed keeps its acknowledgements.
- New per-section sets `this._held = { [section]: Set }`. `buildChanges()` adds every key it sees in
  the current state. The loop that sends `null` for a confirmed key missing from the current state
  (state-sync.js:279 to :281) sends it only for keys in `_held[section]`.
- The seed also puts every key of `savedGlobalVariables` (less the server-owned ones) into
  `_held.globalVariables`. game.js:1705 applies all of them with `Object.assign`, so the page holds
  them from the start, and a global deleted before the first sync (the SIEM minigame deletes its
  state key) is then sent as `null` and deleted on the server, where today it comes back on reload.

`app/controllers/break_escape/games_controller.rb` `scenario`: adds
`filtered['savedCurrentRoom'] = @game.player_state['currentRoom']` when it is a string (one short
string). With it seeded, the first sync after a load sends `currentRoom` only when the page starts
the player somewhere else than the saved room.

`public/break_escape/js/systems/mail-scheduler.js`:

- New exported pure function `flattenSavedMailState(saved)`: the keys `exportMailState()` emits
  (`mailboxes.<box>.<msgId>`, `threads.<key>`, `jobs`, `drafts`, `metrics`) built from the nested
  saved shape. Seeded messages are stored on the server as the stub the client sent, so the saved
  stub flattens to the same value.

`public/break_escape/js/core/game.js`:

- At the top of the restore block, before `Object.assign(window.gameState.globalVariables, ...)`
  at :1708, call
  `window.stateSync?.seedFromBootstrap?.(gameScenario, { mailKeys: flattenSavedMailState(gameScenario.savedMailState) })`.
  Seeding first matters: some restores keep references to the saved objects, so a later in-place
  change would alter the bootstrap copy. The seed reads the values before anything touches them.
  Passing the flattened mail in keeps `state-sync.js` free of a new static import.
- The `restorePhoneState(saved)` call (:1800) gains
  `{ keyOf: window.stateSync?.constructor?.stableJson }` (2.1).

### 3.3 When the bootstrap and the client disagree

Two rules keep the seed from losing anything:

1. A key is only ever **not sent** when its current value equals what the server sent. The seed is
   the server's own copy, so this never skips a value the server lacks.
2. A key is only ever **deleted** (sent as `null`) when this page held it and then lost it. A key the
   server holds that the client never shows is left alone, as the first sync leaves it today.

| Case | What happens |
|---|---|
| The restore changes a value (an imported global wins over a save, the command board stamps a missed entry, the mail scheduler seeds a new message) | The value differs from the seed and is sent |
| The client holds a key the server lacks | Sent |
| The server holds a key the client never holds this page (an NPC's ink variables before it registers, a global the scenario dropped) | Not sent, not deleted; sent later if the client starts holding a different value |
| The client held a key and removed it (a saved global included) | `null` is sent |
| The old page's `pagehide` flush lands after the new page's `GET /scenario` | The client's unchanged keys are not resent, so the flushed value stands. Today the first sync overwrites it with the older bootstrap copy |
| The server refused a section over a cap, or trimmed mail | The seed is what the server holds after the refusal or trim, so the client resends what it still holds that differs |
| Key order differs | `stableJson` handles it |
| A server sanitiser changed the stored value (a long mail body, a long draft, a thread's extra keys, an ink LIST value, a phone message field or story position) | The client exports the server's form (2.1), so the seed matches. The two accepted residuals in 2.1 (a number form, a thread position at the byte cap) resend that one key on the first sync of each load; a new sanitiser rule added without its mirror fails the tests in 3.7 |
| A sync answers `stale` | Unchanged: nothing is confirmed, the changes go with the next run |

### 3.4 Wire format

Before, first `PUT /sync_state` after a load (lab_social_engineering, mid-game):
`{ globalVariables: {every key}, npcInkVariables: {every NPC}, triggeredEvents: {every key},
mailState: {every message, thread, jobs, drafts, metrics}, notes: [every note], phoneState: {every
thread with history}, ..., scenarioClock, timedMessages, clientTs }`, from about 1 KB to several
hundred KB with mail.

After: no request until something changes or the clock-only interval (5 minutes) passes. When the
page starts the player in a different room from the saved one, the first request is
`{ currentRoom, scenarioClock, timedMessages, mailState: { jobs }, clientTs }`, because the clock,
the timed texts and the mail jobs ride along with any change (state-sync.js:340 to :355): a few
hundred bytes. After that, only the changed keys, with the clock and timed texts as today.

### 3.5 Compatibility

- Old saves: nothing to migrate. A save whose blocks are empty seeds nothing. A save with no
  `currentRoom` seeds none, so the first sync sends it once.
- Old tabs: unaffected; the server change is one extra bootstrap field the old client ignores.
- A game resumed mid-way: the case the change is for.

### 3.6 Cheat policy

None changes. The seed decides only what the browser sends; the server's merges and caps are the
same.

### 3.7 Tests

- `test/js/state-sync.test.mjs` (new cases): after `seedFromBootstrap` with saved blocks equal to the
  current state and the same room, `buildChanges()` returns null; with a different room, the body is
  exactly `currentRoom`, `scenarioClock`, `timedMessages`, `mailState.jobs` and `clientTs`; a saved
  object with reordered keys counts as equal; one changed global is sent alone; a saved key the
  client never holds is not sent as `null`; a saved global deleted by the client is sent as `null`;
  a seed after a confirmed sync keeps the sync's acknowledgement; a second seed call does nothing;
  clock: no clock-only send until the interval passes.
- Seeds taken from a server-sanitised copy (the sanitised values written into the test by hand from
  the Ruby rules, with the game.rb line in a comment): an NPC whose ink state holds a LIST value next
  to scalars, seeded with the scalars only, sends nothing; a sent message with a 5 000-character
  body, seeded with the body cut to 4 000, sends nothing; the same with a body whose cut point falls
  after an emoji, seeded with the code-point cut; a sent message carrying a key outside
  `MAIL_MESSAGE_KEYS`, a nested string over 1 000 characters, a long tell and an object nested seven
  deep, seeded with the clean form, sends nothing; a draft with a 1 500-character `freeText`, seeded
  with it cut to 1 000, sends nothing; a thread carrying an extra key and 25 choices, seeded with the
  clean form, sends nothing; a phone message with an extra key, a `type` over 20 characters and
  `isBark: 1`, a message with no `type`, and a story position of 59 000 characters that is over
  61 440 bytes in UTF-8, each seeded with the clean form, are not in
  `exportPhoneState({ onlyChanged: true, keyOf: stableJson })`. Metrics written by the client are
  exported unchanged and match a seed of the server's clamped form. A float written by Ruby as
  `1.0` in a global resends that one global and nothing else.
- Exactness of the mail, phone and ink clips, two tests:
  - Constants: `test/js/social-mail-state-export.test.mjs` reads from game.rb's source every
    constant named in 2.1 (`MAIL_MESSAGE_KEYS`, `MAIL_DRAFT_KEYS`, `MAIL_BODY_KEYS`,
    `MAIL_FOLDERS`, `MAX_MAIL_BODY_CHARS`, `MAX_MAIL_STRING`, `MAX_MAIL_JSON_DEPTH`,
    `MAX_MAIL_JSON_ENTRIES`, `MAX_MAIL_JSON_KEY_CHARS`, `MAX_MAIL_TELL_CHARS`, `MAX_MAIL_TELLS`,
    `MAX_MAIL_ID_LENGTH`, `MAX_MAIL_BOX_ID_CHARS`, `MAX_MAIL_THREAD_POSITION_BYTES`, the thread and
    draft limits, `PHONE_MESSAGE_KEYS`, the phone limits and `MAX_NPC_INK_NAME_CHARS`) and fails if
    a client constant differs. It compares each by the server's name, except the five existing
    client names listed in 2.1, which it reads through an explicit map in the test
    (`MAIL_MESSAGE_KEYS` to `MAIL_MESSAGE_FIELDS`, `PHONE_MESSAGE_KEYS` to
    `NPCManager.PHONE_MESSAGE_FIELDS`, `MAX_PHONE_HISTORY_MESSAGES` to
    `PHONE_HISTORY_MAX_MESSAGES`, `MAX_PHONE_MESSAGE_TEXT` to `PHONE_MESSAGE_MAX_CHARS`,
    `MAX_PHONE_STORY_STATE_BYTES` to `PHONE_STORY_STATE_MAX_BYTES`). Its parser handles a `%w[ ]`
    list that spans several lines (`MAIL_MESSAGE_KEYS` spans five, game.rb:3846 to :3850) by
    reading to the closing bracket, and the `N.kilobytes` form by multiplying by 1 024.
  - The literal scan, in the same test: it fails if any of these methods still holds a bare number
    literal other than 0 and 1, so a limit written inline again is caught: `sanitize_mail_message`,
    `sanitize_mail_json`, `sanitize_mail_threads`, `sanitize_mail_drafts`,
    `sanitize_phone_state_entry`, `mail_state_updates`, `mail_id?`, `mail_box_id?` and
    `merge_npc_ink_variables!`. The one literal it allows by name is the split limit in
    `split('.', 2)` in `mail_state_updates`, which is a count of pieces, not a limit the client
    mirrors as a number (2.1 mirrors it as "split at the first dot"). Outside the scan: the metrics
    clamp, `100_000`, in `sanitize_mail_metrics`, and `sanitize_mail_jobs`, neither of which has a
    client mirror (2.1).
  - Behaviour: a committed fixture pair, `test/fixtures/files/sync_bodies/sanitiser_cases.json`,
    holds inputs that trip every rule in 2.1 and the output the server stores for each. Mail cases
    are keyed as the client sends them (`mailboxes.<box>.<id>` and `threads.<key>`). Among them:
    each mail message rule; a message whose own `id` is a number and one whose `id` differs from
    its key; a message key with an empty and one with a whitespace-only message id; a box id over
    100 code points; a thread with an extra key, 25 choices and a choice nested six levels deep; a
    blank thread key and a whitespace-only one; a thread `position` that is an array; a draft; each
    phone rule, including a `currentKnot` that is a number and a `storyPath` that is an object; an
    NPC id and an ink variable name over 100 code points; and the astral cut cases. A Rails unit
    test runs `mail_state_updates`, `sanitize_mail_drafts`, `sanitize_phone_state_entry` and
    `merge_npc_ink_variables!` over the inputs and asserts the stored outputs; a node test runs
    `clipMailMessage`, `clipMailThread`, `clipMailDrafts`, the phone export and
    `exportNpcInkVariables` over the same inputs and asserts the same outputs by `stableJson`.
    Neither test writes the file; changing a rule means changing the fixture, and both sides then
    have to agree with it.
- Code points: one node case runs every copy of `cpWithin` and `cpSlice` (mail-scheduler.js,
  npc-conversation-state.js and `NPCManager`) over the same strings (ASCII, an emoji at the cut, a
  string of emoji only) and expects the same results.
- Phone, in `test/js/phone-reopen-and-persistence.test.mjs`: a thread restored from a saved entry
  whose keys (and whose `history` messages' keys) are in jsonb order is not in
  `exportPhoneState({ onlyChanged: true, keyOf: stableJson })`; a changed thread is.
- `test/js/social-mail-state-export.test.mjs`: `flattenSavedMailState(saved)` equals
  `exportMailState()` of a scheduler initialised from `saved`, by `stableJson`, for seeded,
  delivered and drafted mail and pending jobs.
- `test/js/social-state-sync-confirmed.test.mjs`: `syncConfirmed()` waits for tracked promises, and
  resolves false while a registered part has pending entries (2.2).
- Live proof: section 10.3, case A.

## 4. P2: inventory answers carry deltas

### 4.1 Today

| Route | Answer today | Code |
|---|---|---|
| `POST /inventory` add | `{ success, inventory: [whole] }`, also when already held | games_controller.rb:1052, :1078 |
| `POST /inventory` remove | `{ success, inventory: [whole] }` | games_controller.rb:1086 |
| `POST /network/plant` | `{ success, foothold, first, inventory }`; already: `{ success, already, first, foothold, inventory }` | network_access.rb:209, :235 |
| `POST /network/unplug` | `{ success, inventory, endedPcIds }` | network_access.rb:263 |
| `POST /network/join` | `{ success, foothold, first, inventory }`; already likewise | network_access.rb:311, :335 |
| `POST /network/implant` | `{ success, consumedId, foothold, first, inventory }`; already likewise | network_access.rb:423, :475 |

With a full cloner each answer is about 10 KB. The unrouted
`Api::GamesController#inventory` (app/controllers/break_escape/api/games_controller.rb:31) also
echoes the whole inventory; its header says it must stay unrouted, so it is left alone.

### 4.2 Every client caller

| Caller | Reads from the answer | Change |
|---|---|---|
| `systems/inventory.js` `addToInventory` (fetch at :709) | `success`, `message` | None |
| `systems/consumables.js` `removeInventoryConsumable` | Nothing | None |
| `systems/apply-actions.js` `sendInventoryRemove` | HTTP status only | None |
| `systems/item-drop.js` (:155) | `success` | None |
| `minigames/rfid/rfid-data.js` `persistSavedCards` (:366) | Nothing | Removed by P1 |
| `systems/network-links.js` plant (request :412, tray :437) | `inventory`, with ids `[link, deviceId]` | `applyInventoryDelta(body)` |
| `systems/network-links.js` implant (request :467, tray :508) | `inventory`, with ids `[link, consumedId]` | `applyInventoryDelta(body)` |
| `systems/network-links.js` unplug (request :542, scan :558 to :561) | `inventory`, scanned for every `rogueDevice` item | `applyInventoryDelta(body)`; the scan goes |
| `systems/network-links.js` join (request :605, tray :616) | `inventory`, with ids `[link]` | `applyInventoryDelta(body)` |
| `api-client.js` `updateInventory` (:212) | Unused | Deleted |

No playtest tool reads these answers (tools/playtest reads `player_state` directly), and Hacktivity
reads none of them. Rails tests that read the answer's `inventory`: network_footholds_test.rb,
network_implants_test.rb and games_controller_test.rb (the builder greps `['inventory']` in them).
They move to the new keys.

### 4.3 Change

Server, `app/controllers/break_escape/games_controller.rb` `inventory`:

- add: `{ success: true }`; already held: `{ success: true, already: true }`. No caller reads an
  item from this answer, so none is sent. `add_inventory_item!` (game.rb:170) is unchanged.
- remove: `{ success: true }`.

Server, `app/models/break_escape/network_access.rb`: each route lists the ids it touched (plant: the
link item and the device; unplug: the link item and the device; join: the link item; implant: the
link item and `consumedId`). After the action, and in every `already` answer:

- `added`: each touched item present in the server's inventory, through `item_for_answer`;
- `removed`: each touched id absent from the server's inventory.

The rule is the same for every route and every retry, so a retry after a lost answer reconciles the
tray exactly, and an id the player still holds a copy of is never named as removed. `consumedId`
stays in the implant answer (unchanged meaning).

Client, `public/break_escape/js/systems/inventory.js`:

- New export `applyInventoryDelta({ added = [], removed = [] })`, also on `window`: inside one
  `deferTray` batch (:1262), each added item the tray lacks (by id) goes through `addServerItem`
  (:1275), each removed id the tray holds through `removeFromInventory`. It is never given an item
  without an id to remove, because `removed` holds ids only. An added item with no id is added only
  when no tray item matches it by `createItemIdentifier`. Applying the same delta twice changes
  nothing. Returns `{ added: [ids], removed: [ids] }`.
- `syncInventoryFromServer` (:1306) stays for the old answers in 4.4 and is deleted with them.

Client, `systems/network-links.js` and `api-client.js`: the four network calls send `delta: true`
and apply the answer with `applyInventoryDelta`.

### 4.4 Wire format and compatibility

Before: answers as in 4.1, 3 to 11 KB each.

After, for example a plant:
`{ "success": true, "first": true, "foothold": {...}, "added": [{ "id": "netlink_jack_a", "type": "network_link", ... }], "removed": ["kit_rogue_pi"] }`,
about 300 to 500 bytes. An `/inventory` answer: `{ "success": true }`, about 20 bytes.

- `/inventory`: no client reads its echo, so the new answer ships at once, for every client.
- `/network/*`: an old open tab would read a missing `inventory` as empty and drop link items from its
  tray until a reload. For one release the routes answer the delta only to a request with
  `delta: true`, and the old shape otherwise. The following release removes the old shape, the flag
  and `syncInventoryFromServer`. Old tabs keep their own module set because the import map pins each
  module to `?v=ASSETS_VERSION` (application_helper.rb:83 to :92); this transition assumes the
  version is bumped with the release, as `bump-version` does.
- Old saves: nothing stored changes.
- A game resumed mid-way: the bootstrap's `playerInventory` is unchanged.

### 4.5 Cheat policy

Unchanged and slightly tighter: answers carry only the server's own copies, and never `saved_cards`.
The client still cannot add an item by any answer; it only shows what the server says it holds.

### 4.6 Tests

- Rails: the existing answer tests move to `added` / `removed` or `{ success }`; new cases: each
  `already` answer carries the same delta as the first success; an unplug answer names the returned
  device; a plant of a device the player holds two copies of does not name its id in `removed`; a
  request without `delta` still gets `inventory` (until the following release); no answer item has
  `saved_cards`.
- `test/js/inventory-tray.test.mjs`: `applyInventoryDelta` adds, removes, ignores a repeat, adds an
  id-less item only once, and runs one tray refresh.
- `test/js/network-links.test.mjs`: plant, implant, join and unplug apply the delta; unplug no longer
  reads the whole inventory; the request carries `delta: true`.
- Answer sizes: section 10.2. Live proof: section 10.3, case B.

## 5. P1: cloner saved cards as one-card deltas

### 5.1 Today

- `RFIDMinigame#handleSaveCard` (rfid-minigame.js:315) calls `RFIDDataManager#saveCardToCloner`
  (rfid-data.js:286), which updates the cloner's `scenarioData.saved_cards` and calls
  `persistSavedCards` (:366): `POST /inventory { action_type: 'update_saved_cards', saved_cards: [all] }`.
  Then `recordCloneOnServer` (rfid-minigame.js:370) sends `POST /clone_card`.
- `Game#update_cloner_saved_cards!` (game.rb:3416) replaces the list whole (50 cards and 64 KB caps,
  :3408, :3409). The cards are the client's own objects, including the scenario keycard's other
  fields (observations, position).
- The list sits on the cloner's inventory entry, so it rides every inventory echo (fixed by P2) and the
  bootstrap's `playerInventory`.
- Identity at access-list locks never reads the list: it reads `serverClones`, written by
  `record_card_clone!` (game.rb:2215), and `held_rfid_cards` (:2141). The test
  "a copy only in the copier saved_cards list is refused" (access_model_rfid_test.rb:145) shows it.
  The client does read the list to choose which card ids to offer (unlock-system.js
  `heldRfidCardIds`, :125), so a card missing from it after a reload cannot be offered.
- Three paths start a clone, and one of them sends no source:
  - chat clones (chat-helpers.js:437) send `{ npc_id }`, or nothing when there is no NPC id;
  - a keycard clicked with `takeable: false` (interactions.js:1075 to :1083) sends `{ object_id }`,
    or `{ held_card: true }` when the card has no id. A card with no id is always a held one:
    `stamp_scenario_object_ids!` (game.rb:4781, run at game creation from `prepare_scenario_data!`, :1072) gives every room object
    and every container item an id, so a card lying in the world always sends `{ object_id }`. Only
    held cards (`itemsHeld`, the start inventory) can lack an id, and `held_card` is the right source
    for them. The stamping has run at game creation since 2026-03-06;
  - the action menu's "Clone it with the flipper" on a world keycard (action-menu.js:63 to :69) sends
    no source at all, so `/clone_card` is never called. lab_physical_pentest's intended route
    ("clone it in place, don't take it") uses exactly this path on Melanie's comms card
    (`pierce_comms_card`, card_id `lw_comms_card`, scenario.json.erb:1712). Today that copy is never
    recorded and survives a reload only through `update_saved_cards`.

### 5.2 Change

Server, `app/models/break_escape/game.rb`:

- `SAVED_CARD_KEYS = %w[card_id name rfid_protocol rfid_hex rfid_facility rfid_card_number rfid_data timestamp]`
  and `SAVED_CARD_DATA_KEYS` (the `rfid_data` fields the RFID minigame reads: `cardId`, `hex`,
  `facility`, `cardNumber`, `uid`, `sectors`, `masterKeyKnown`). The builder confirms both lists from
  the readers (rfid-data.js, rfid-protocols.js `detectProtocol`, rfid-attacks.js, rfid-ui.js,
  unlock-system.js) before writing them down, and adds a test that fails if a reader uses another key.
- `MAX_SAVED_CARD_BYTES = 4.kilobytes` per card; `MAX_SAVED_CARDS` (50) and `MAX_SAVED_CARDS_BYTES`
  (64 KB) stay.
- New `add_saved_card!(definition, client_card)` (no save; its caller saves): the stored card takes
  `card_id`, `name` and `rfid_protocol` (and the authored `rfid_hex`, `rfid_facility`,
  `rfid_card_number` when present) from the server's `definition`, `rfid_data` from the client picked
  to `SAVED_CARD_DATA_KEYS`, and `timestamp` from the server's clock. It replaces a stored card with
  the same `card_id` in place, refuses a new card when 50 are held or a cap would be passed, and
  writes to the real cloner (never a `client_forged?` one). Returns `:saved`, `:full`, `:too_big` or
  `:no_cloner`.
- `record_card_clone!` gains `card: nil`. Its sources are unchanged (`npc_id`, `object_id` checked
  by `clone_source_keycard`, game.rb:2272, and `held_card`); no new source is needed, because a
  world keycard always has an id (5.1). After it records a copy (`recorded: true`), and only then,
  it calls `add_saved_card!(card_definition, card)` when `card` is a Hash, and clears any
  `listed: false` mark on that `serverClones` record. It saves once. The answer gains
  `saved: true | false` and, when false, `reason`.
- New `remove_saved_card!(card_id)`: removes the card from the cloner's list and sets
  `serverClones[card_id]['listed'] = false`, so the bootstrap repair does not put it back. The copy
  itself stands (removing a display copy does not unmake a copy). A later copy of the same card
  clears the mark.
- New `repair_saved_cards!` (no save), run inside the locked bootstrap step (2.4): for each
  `serverClones` card id with no saved card and no `listed: false` mark, while a real cloner is held,
  add a card built from the scenario definition alone (no sectors). It covers a save whose card request
  was lost, and old tabs (5.4). `cards_need_repair?` is the same test without the write, for the
  unlocked check.
- `update_cloner_saved_cards!` (kept for one release, 5.4) changes from replace to a filtered merge:
  stored cards stay; an incoming card is added or replaced only when its `card_id` is a `serverClones`
  key, through `add_saved_card!`; nothing is ever removed by it.

Server, `app/controllers/break_escape/games_controller.rb`:

- `clone_card` passes `card: params[:card]` (as an unsafe hash, when present). It is capped at
  8 KB before parsing (2.5).
- `inventory` gains `when 'remove_saved_card'`: `{ success: true }`.
- `scenario` runs `prepare_bootstrap_state!` (2.4), which includes the repair.

Client, one unit (built and committed together, section 9 step 4):

- `minigames/rfid/rfid-data.js`: `saveCardToCloner` keeps its local update and no longer calls the
  server; `persistSavedCards` is deleted. New `savedCardForServer(card)` picks the card to
  `SAVED_CARD_KEYS` and `rfid_data` to its keys (a mirror of the server lists, with a test that the two
  stay in step). New `removeSavedCard(cardId)`: removes locally and sends
  `POST /inventory { action_type: 'remove_saved_card', card_id }`. No screen calls it yet; it exists so
  the list has a way to shrink, and the cloner-full message can offer it later.
- `minigames/rfid/rfid-minigame.js`: the clone source is decided in one place.
  `startRFIDMinigame` callers pass `cloneFrom: 'world' | 'inventory'` instead of a hand-built source,
  except chat clones, which keep `cloneSource: { npc_id }`. `recordCloneOnServer` builds the body:
  an NPC source as today; otherwise `{ object_id }` when the card has an id; otherwise
  `{ held_card: true }` for `'inventory'`. A `'world'` card with no id cannot occur in a game
  created since the id stamping (5.1); if one does, no request is sent, a warning is logged and the
  copy lasts for the session. It sends the saved card, `apiClient.cloneCard(body, cardId, savedCardForServer(saved))`, and calls
  `stateSync.track()` on the request (2.2). A `saved: false` answer is logged; the card stays usable
  for the session.
- `systems/interactions.js:1083`: passes `cloneFrom: isInventoryItem(sprite) ? 'inventory' : 'world'`.
- `systems/action-menu.js:69`: passes `cloneFrom: 'world'`, so the comms card copied in place
  (stamped id `pierce_comms_card`) is sent as `{ object_id }`, recorded and saved.
- `api-client.js` `cloneCard(source, cardId, card = null)` (:119) adds `card` to the body when given.

### 5.3 Wire format and size

Before: every save sends `POST /inventory { action_type: "update_saved_cards", saved_cards: [every card, whole] }`
(up to 64 KB; about 240 KB of requests over 50 saves), answer `{ success }`, and the list rides
every inventory and network answer.

After:

- Save: `POST /clone_card { npc_id | object_id | held_card, card_id, card: { card_id, name, rfid_protocol, rfid_data } }`.
  An EM4100 or HID card is about 300 bytes. A fully cracked MIFARE Classic card carries 16 sectors
  of `{ keyA, keyB }` (rfid-attacks.js:45, :117), about 750 bytes of `rfid_data` alone, so its request
  is about 1 000 to 1 100 bytes. Answer `{ success, recorded, saved }`, about 50 bytes. One request
  per save, as today's `/clone_card`; the `/inventory` request is gone.
- Remove: `POST /inventory { action_type: "remove_saved_card", card_id }`, about 70 bytes; answer about
  20 bytes.
- Load: the cloner's list in `playerInventory`, once, as today.
- Bound: a card is stored only for a `serverClones` key, so the list holds at most one card per
  cloneable card the scenario defines (keycard definitions and NPC cards with a `card_id`), and never
  more than 50 cards or 64 KB. The builder counts them for test-rfid and each mission with a cloner and records the counts in the build log.

### 5.4 Compatibility

- Old saves: stored cards stay as they are and are not checked again. They decide nothing at the server
  (5.1), so leaving them is safe. A recorded copy missing from the list is put back by the bootstrap
  repair.
- Old tabs (open across the deploy): they still send `update_saved_cards` before `/clone_card`, and
  the action menu still sends no source. The filtered merge drops a card the server has not yet
  recorded; for a card with a source, the following `/clone_card` records it and the next load's repair
  lists it. A copy made from an old tab's action menu stays as it is today: listed only if the merge
  accepts it, which it does not, so it lasts for that tab's session. A reload on the new client and a
  fresh copy record it. The old route goes in the following release.
- A game resumed mid-way: the cloner and its cards come back in `playerInventory` as today.
- Behaviour change: a card with no `card_id` (a hand-typed hex card in test-rfid), or a copy with no
  server source (a chat clone with no NPC id), is no longer kept across a reload. A walk of m01 to
  m10 and every lab found keycards with no `card_id` only in m01, m02, m04 (4), m05 (4), m07 (2) and
  m08 (2), each in an NPC's `itemsHeld` or a container's `contents`, so they are taken and held, not
  copied in place. lab_physical_pentest's one keycard has a `card_id` and an id. test-rfid's world
  keycard (`ceo_keycard`) is authored with no id and gets `test_secure_keycard_1` from the stamping,
  so it is sent as `{ object_id }`. The `#clone_keycard` ink
  tags sit in m03 to m10 and lab_physical_pentest; before building, the builder checks that each names
  its own NPC's `rfidCard.card_id`, reruns the keycard walk, and records both in the build log.

### 5.5 Cheat policy

- A card is stored only for a copy the server recorded: its `card_id` is a `serverClones` key that
  `record_card_clone!` wrote after checking the source (an encountered NPC's own card, a keycard
  within reach, a held keycard). A card naming a copy the player never made is refused.
- The name and protocol come from the server's definition; the client supplies only attack progress
  (`rfid_data`), to a closed key set and 4 KB per card.
- Access-list locks still decide from `serverClones` and `held_rfid_cards`, never from the list.
  Locks without an access list keep today's client-trusted rule; that is outside this plan.

### 5.6 Tests

- Rails, `test/controllers/break_escape/access_model_rfid_test.rb` and `reload_persistence_test.rb`:
  a recorded copy with `card` saves one card and the bootstrap returns it; a `card` for a copy the
  server refused or did not record is not saved (`saved: false`); a second copy of the same card
  replaces it in place; the 51st card and an oversized card are refused; `name` and `rfid_protocol`
  come from the definition even when the client sends others; unknown keys are dropped;
  `remove_saved_card` removes one and a reload does not bring it back; a fresh copy after a remove
  lists it again; the repair restores a recorded copy missing from the list and adds nothing without a
  cloner; test-rfid's world `ceo_keycard`, authored with no id, is recorded by its stamped
  `object_id` with a card and listed after a reload; `held_card` still records an id-less held card; `update_saved_cards` keeps stored cards, adds a
  recorded one and drops an unrecorded one. The four existing `update_saved_cards` tests
  (reload_persistence_test.rb:348 to :387) are rewritten to the merge rules. A `clone_card` body over
  8 KB is refused with 413 before parsing.
- Concurrency: a bootstrap whose repair runs while a `PUT /sync_state` commits keeps the sync's
  globals. The integration test is single-threaded, so the interleaving is made with a stub: it
  stubs `Game#cards_need_repair?` (the unlocked check in `prepare_bootstrap_state!`) so that on its
  first call only it writes a new global into the same game's row with `Game.where(id:).update_all(player_state: ...)`, which
  bypasses the controller's loaded copy exactly as a committed sync would, and then returns true;
  later calls run the real check.
  `with_lock` reloads the row on the same connection, so it sees that write whether or not the
  test runs inside a transaction. The test then reads the row and expects both the new global and
  the repaired card.
- `test/js/rfid-clone-card.test.mjs`: the `/clone_card` body carries the picked card; no
  `update_saved_cards` request is sent; `track()` is called; the body for `cloneFrom: 'world'` with an
  id is `{ object_id }`, and with no id no request is sent and a warning is logged; for
  `'inventory'` with no id `{ held_card: true }`. `test/js/rfid-clone-entry.test.mjs`: the action-menu path passes
  `cloneFrom: 'world'`. `test/js/test-bridge-access.test.mjs`: `savedCards()` still lists the ids.
- Request size, node: `savedCardForServer` of an EM4100 card and of a fully cracked MIFARE Classic
  card from rfid-attacks.js; the request body built from each is under 600 and 1 500 bytes; the
  measured sizes are printed. The key-set test: `savedCardForServer`'s keys equal the server's lists.
- Live proof: section 10.3, cases C, E and F.

## 6. R2: a server-owned capture record

### 6.1 Today

- `se_captures` is a client global: `{ targetId => entry }`, eight closed keys per entry
  (`systems/captures.js` `CAPTURE_ENTRY_KEYS`), one entry per target, first capture wins. Writers in
  the browser:
  - `apply-actions.js` `recordSECapture` (:24), used by `add_capture` actions and by NPC
    `addCapture` mappings (npc-manager.js:1212 to :1216, which overlays the NPC's `usePayload` when
    the event carries it, as an `npc_used` event does). It loads captures.js with a dynamic import
    (:20);
  - `public/break_escape/js/minigames/mail-client/mail-bridge.js` `recordCapture` (:82), from
    `performSend`: a credential when a sent link kit's built page turns the victim to "submitted"
    (:409 to :443), a foothold when an attachment send lands on a target with a `foothold` block
    (:449 to :457). It imports captures.js statically and writes the global in the same tick as the
    sent record (:403) and the page record (:423);
  - `npc-workarounds.js` (:373), for the login an NPC says out loud, which the server composed in its
    answer (npc_frustration.rb `shared_login_body`, :453 to :466).
- Each new capture rewrites the global, so the keyed diff sends the whole map.
- The server treats this global as its record of what was earned: `capture_secrets_for_client`
  (game.rb:1202) and `account_capture_usernames` (network_access.rb:1232) serve the authored secrets
  and the usernames for its entries. Any `PUT /sync_state` can write it
  (games_controller.rb:1819 to game.rb:293), so a client can claim a capture for any declared target
  and then fetch `GET /capture_secrets`.
- A writer can author a `secret` in its `capture` hash. `makeCaptureEntry` keeps it on the entry
  (captures.js:55), and `displaySecret` shows the `/capture_secrets` answer first and falls back to
  the entry's own `secret` (captures.js:93 to :99). For a writer whose owner has no account the
  secret also ships in the bootstrap, so the fallback is what shows it (Len's PIN, 6.7).
- The secret is chosen by the entry's client-written `address`: `by_address[address]` (game.rb:1244,
  landing page capture addresses only) and `by_username[normalise_username(address)]` (:1245,
  account holders); network_access.rb:1247 to :1250 reads the same way. So one capture for target A
  can name another page's capture address or another account's username and be served that secret.
- For account holders the secrets route already applies a proof check of its own, the account pass
  (`account_capture_served?`, capture_proofs.rb:101 to :114, called at game.rb:1272): in a scenario
  that declares proofs, an account whose password opens something is served only once one of its
  NPC's `captureProof` entries holds.
- Readers in the browser: capture-log (capture-rows.js, capture-log-model.js), the engagement report
  (report-model.js:181), the landing-page builder's captures view, the password minigame and the remote
  sign-in screen (unlock-system.js:272). All read it through `readCaptures(globals)` or
  `captureList(globals)`.
- lab_physical_pentest and lab_social_engineering declare it in `globalVariables` with `{}`.

### 6.2 The choice

A server-owned record, written one entry per request, with the server filling every field from the
scenario. One global key per target would stop the whole-map send but leave captures writable by
any sync, with the client still choosing the address that picks the secret.

The verdict itself (a phish landed, an NPC used a planted device) stays a client-flow step: the mail
scheduler and the landing-page score run in the browser, and no server route sees a delivery or a
victim's click. Moving them to the server is outside this plan, and a partial move would block the
intended route. The server's sanity check is real all the same, in four parts. Parts 2 and 3 are
keyed on the target and on the secret being served, never on which candidate the client's fields
picked, so no choice the client makes can switch them off.

1. **Fields from the scenario.** The server takes `address`, `kind`, `host`, `roleLabel` and `note`
   from the scenario's own capture writer for that target, never from the client. The client names
   the target and the kind, and may choose between the values the writers for that target allow
   (a page's capture address or the target's own address; a mapping's value or its NPC's
   `usePayload` value), nothing else. `by_address` and `by_username` can then answer only for that
   target's own secret.
2. **Phish evidence.** A secret that comes from a landing page (the entry's address is that page's
   capture address, or the single-secret fallback answers for it) is served only when the server
   holds that page's evidence for that target, the same evidence the honest flow needs before it
   grants the capture (`captureGranted`, mail-bridge.js:417 to :425): a `se_landing_pages[pageId]`
   record with `built` and `meetsThreshold` true and `victim.submitted` true
   (`describeVictimOutcome`, landing-page-model.js:701, sets it only for a landed send to a page
   that meets the threshold), and a sent message to the target that landed (`landed: true`, set by
   `buildRecord`, mail-bridge.js:680) and carries one of the link kits that name the page. The sent
   message may be in the stored `mailState` or in the same request's own mail updates, sanitised
   by `mail_state_updates` as the merge sanitises them (the same box id, message id from the key,
   and `id` rules), so a mail section the server refuses over a cap does not withhold the secret.
3. **Proofs, by target.** `target_capture_proofs(data, target_id)` collects, for each credential
   candidate for that target, the proofs of the account it captures: `CaptureModel.proofs_for` on the
   account holder whose normalised username equals the candidate's `address` (capture_model.rb:131 to
   :136, the same resolution `shorthand_proofs` uses at :107 to :125), or, when no account holder has
   that username, the `captureProof` of the candidate's `owner` or `payload_owner` NPC and the
   candidate's own `proof`. When the list is not empty, a credential for that target is served only
   when one of them holds (`capture_proof_holds?`, capture_proofs.rb:55), whichever candidate was
   stored. Keying on the captured account, not the mapping's owner, keeps part 3 equal to the
   account pass (which keys proofs the same way) in a scenario where one NPC's mapping captures
   another NPC's account. For every target in 6.7 the owner and the account are the same NPC, so
   nothing changes there, and part 3 also covers a target with no account.
4. **Server-only targets.** A client write for a heard-share target (an NPC whose only route is a
   `share_login` workaround) is not taken from the client. The server records that capture itself,
   from its own `sharedLogins` record.

Parts 1 and 4 decide what is recorded. Parts 2 and 3 decide what is revealed: the capture is
recorded either way, and its secret and username are served once the evidence holds. A capture is
never taken back once its secret has been served, and an honest capture is never lost:

- **Evidence that arrives later.** A capture whose evidence reaches the server a moment after it (a
  sign-in answer still in flight, a page record in the same request) counts as soon as the evidence
  is there, because the check runs when the secret is read.
- **Evidence that goes away later.** Once the evidence holds, the entry is stamped `proven: true`
  and stays revealable even if the player later re-scores the page (`applyScore` sets
  `built: false`, landing-page-model.js:614 to :630), the mail trim (`trim_mail_messages!`,
  game.rb:4020) drops the old sent message, or the player deletes it.
- **Entries recorded before parts 2 and 3 ship.** Step 6a (section 9) stores `proven: true` on every
  entry it records, because under 6a every entry is revealable. Step 6b computes `proven` only for
  entries recorded after it ships, so a secret a player already had is never withdrawn by 6b.
- **A stale request.** The capture step runs on a stale request, but the mail and globals merges do
  not (games_controller.rb:787), so a stale request can record a capture without its evidence. A
  stale answer confirms nothing, so the client resends the mail and the page record on its next run,
  and the secret is served after that sync. If the stale request was a pagehide flush and its mail
  never reached the server, the mail is lost as it is today; sending the kit to that target again
  writes a new sent record and page record, and the secret is then served. The stale answer carries
  `captures` and `capturesRefused` like any other (6.3), so the client's pending entry is answered.
- **The capture write itself.** The client module that records captures is loaded at startup and
  queues the capture in the same tick as the sent record and the page record (6.3), so all three
  ride the same sync body or the same pagehide flush.
- **A mail section refused over a cap.** `merge_mail_state!` refuses the whole merged mail when a
  cap would be passed after trimming (`mail_state_refusal`, game.rb:3983: over 200 unread
  or seeded messages in a mailbox, 50 jobs, 20 drafts, or 1 MB), and reports it as `notSaved`; the
  rest of the request, the capture and the page record included, still saves. Honest play in the
  labs does not reach those caps, but nothing prevents it (a long session that never reads its
  mail), so part 2 does not depend on the merge: on a request that is not stale, the sync step
  hands the capture step the request's own sent messages, sanitised by `mail_state_updates`, and
  part 2 accepts one of them as the sent record. The stamp runs in the same request, so the entry
  is stamped `proven: true` while the message is in hand, and the secret is served even though the mail was not stored. The client
  resends the refused mail as it does today.
- **A displayed secret that came from the scenario.** A writer whose `capture` hash carries a
  `secret` (Len's records door PIN in lab_physical_pentest) is shown today through the client entry
  alone. The record never holds a secret, so the server serves that authored secret through
  `GET /capture_secrets` instead (the writer pass, 6.3), for a new game, an old save and a reloaded
  old tab alike.

Part 1 is separable and ships first (section 9).

### 6.3 Change

Server, `lib/break_escape/capture_model.rb` (plain Ruby, shared with the validator):

- `client_target_ids(data)`: `declared_target_ids(data)`, the authored writers, `usePayload` targets
  and phish targets (capture_model.rb:68). Heard-share ids are not in it.
- `capture_candidates(data, target_id, kind)`: every entry the scenario could write for that target
  and kind, each `{ fields:, source: }`. A writer's kind is read with the client's default: a missing
  or unknown `kind` counts as `credential`, as `makeCaptureEntry` does (captures.js:51), so the two
  sides never disagree about an authored writer.
  - an `add_capture` action or `addCapture` mapping with that `targetId` (`each_capture_writer`,
    :38): `fields` from its `capture` hash; `source: { writer: path, proof: capture['proof'], owner: npcId }`.
    For a mapping whose owner NPC has a `usePayload` Hash, a second candidate with the payload
    overlaid, as npc-manager.js:1214 overlays it, and `source` also naming `payload_owner`;
  - a mapping on an NPC whose `usePayload.targetId` is the target, overlaid the same way;
  - a phish target (`phish_target_ids`, :83), credential: one candidate per landing page that a link
    kit in `social.mailClient.payloadKit` names (`kind: "link"`, `landingPageId`), with `address` the
    page's `capture.address` or else the target's own `address`, `note` the page's `capture.note`,
    `roleLabel` the target's `role`; `source: { page: pageId, kits: [kitIds] }`;
  - a phish target with a `foothold` block, foothold: `host` and `note` from it, `roleLabel` the
    target's `role`; `source: { phish_foothold: true }`.
  `fields` never holds a secret: the stored entry has no `secret` key. Each candidate also has a
  `writer` string naming exactly where it came from: the writer's path from `each_capture_writer`
  (with `+payload:<npcId>` appended for an overlaid candidate), `page:<pageId>` for a landing page,
  `phish_foothold` for a phish foothold, and `share:<npcId>` for a heard share. A writer's authored
  `secret` stays in the scenario and is read at serve time through `writer`.
- `candidate_secret(data, writer)`: the authored secret a writer carries, for the writer pass of
  `capture_secrets_for_client`. `data` is always the game's own stored `scenario_data`, the copy
  the entry's `writer` path was taken from (below). It answers in this order:
  1. nil for a page, a foothold or a heard share (their secrets are served by the page and account
     passes), and nil when the path does not resolve to a capture writer in `data`;
  2. **the account-holder guard:** nil when the writer's owner NPC is an account holder
     (the test `Game.account_holder?` applies, game.rb:1077 to :1082: `creds.username` a non-blank
     string; `CaptureModel` holds its own copy of that test, since it is plain Ruby shared with the
     validator), and, for an overlaid candidate, nil when the payload
     owner NPC is an account holder. Both checks are required, and the payload-owner check matters
     most. The authored scenario files carry no `secret` on any `usePayload`, but the stored
     scenario does: at game creation `normalise_npc_access!` (game.rb:4759 to :4780, run from
     `prepare_scenario_data!`) sets `usePayload.secret` to the account's password for every account
     holder with an authored `usePayload`. In lab_physical_pentest that is `hampshire`, `lord` and
     `pierce`; in test_capture_log `sofia` (account `s.lord`) and `ned`. So `lord`'s overlaid
     candidate (the `dev_qr` mapping) resolves to a payload that holds `lord`'s password, and the
     guard is the only thing between a capture of it and that password: under step 6a every entry
     is revealable, so the account pass's proof filter (`account_capture_passwords`) is the only
     other gate, and the writer pass runs after it. An account holder's password is served by the
     account pass alone, under its proof filter;
  3. otherwise, for a capture writer, its `capture` hash's `secret`, or for an overlaid candidate
     the overlaid `usePayload`'s `secret` where it has one, as npc-manager.js:1214 overlays it.
  An account holder's writer and payload secrets are withheld from the bootstrap today
  (`withhold_npc_secrets!`, game.rb:4695 to :4714), and the guard keeps the writer pass to secrets
  that still ship in it, so the writer pass never reveals a value the student does not see today.
- **`writer` is a position in the game's stored scenario.** The path (for example
  `/rooms/briefing_room/npcs[1]/eventMappings[27]/addCapture`) counts array positions, so it means
  something only against the copy it was taken from: the game's own `scenario_data`, which is fixed
  at creation. Nothing rewrites that copy in a way that moves array positions (the key-id rake task,
  lib/tasks/break_escape_migrate_key_id.rake, renames a hash key in place and never adds or removes
  an array element). `candidate_secret` must never resolve a stored `writer` against a
  fresh render of the scenario file, where an edit since the game was created can move every index
  (Len's mapping moved from index 25 to 27 when two `len_keying` mappings were added before it).
  Tests and fixtures find a writer's path by walking `each_capture_writer` for its `targetId`,
  never by hard-coding the index.
- `target_capture_proofs(data, target_id)`: part 3's list (6.2), from the credential candidates'
  `proof` and the `captureProof` of each candidate's `owner` or `payload_owner` NPC.
- `page_evidence_kits(data)`: `{ pageId => { address:, kits: [kitIds] } }` for part 2.
- `share_only_target?(data, target_id)`: an NPC with a `share_login` workaround and no authored writer
  for that id.
- `shared_login_capture(data, npc_id, workaround: nil)`: the capture hash that npc_frustration.rb
  `shared_login_body` (:453 to :466) composes today, as a pure function of the scenario: the NPC's
  username, the colleague of the given `share_login` workaround (`w['with']`) for the note, and the
  password in the note only where `social.captures.revealSecret` is on. `shared_login_body` passes
  the workaround that was heard (it already holds it as `w`), so the heard answer is unchanged for an
  NPC with two `share_login` workarounds naming different colleagues. Where no workaround is known
  (the bootstrap backfill and the migration, which read only the NPC ids in `sharedLogins`), it uses
  the NPC's first `share_login` workaround. The heard route records the entry itself at the moment
  it is heard, so the backfill's choice matters only for an old save or a heard share whose record
  was never written.

Server, `app/models/break_escape/capture_proofs.rb`:

- `CAPTURE_KINDS = %w[credential foothold]` and `MAX_CAPTURES_PER_SYNC = 64`.
- Two string limits, defined in `CaptureModel` (lib/break_escape/capture_model.rb) so the validator
  reads the same values: `MAX_CAPTURE_NOTE_CHARS = 2000` for a `note`, and
  `MAX_CAPTURE_FIELD_CHARS = 200` for `roleLabel`, `address` and `host`. They apply in two places
  and are never used to cut text:
  - **Client strings** are capped at the record: a `targetId` over 100 code points, or an
    `address`, `host` or `roleLabel` the client sent over `MAX_CAPTURE_FIELD_CHARS`, is refused
    `invalid`. These are the only strings the client sends (6.4); they are compared with the
    candidates and never stored.
  - **Authored strings** are bounded by authoring. The validator reports an error for any capture
    string over its limit: a capture writer's `capture` hash, an `addCapture` mapping, an owner
    NPC's `usePayload` fields that overlay it, a landing page's `capture.address` and
    `capture.note`, a phish target's `role` and `address`, and a `foothold` block's `host` and
    `note` (`scripts/validate_capture_log.rb` `check_capture_log`, beside its other capture checks,
    with a case in `test/js/validator-capture-log.test.mjs`). Measured on the checked commit, the
    longest authored note is 693 characters (lab_physical_pentest's `store_controller` mapping,
    scenario.json.erb:790), the next 451, 445 and 419; the longest `roleLabel`, `address` and
    `host` are 44, 37 and 43. So the limits leave room and no scenario fails them today.
- `se_captures_record(scenario: scenario_data)`: read-only. `player_state['seCaptures']` when it is a
  Hash; otherwise the legacy `globalVariables.se_captures` resolved in memory as the migration would
  (below), with every kept entry taken as proven and `legacySecret` set as the migration sets it.
  It never writes.
- `captures_for_client(scenario: scenario_data)`: the record for the browser, every entry with its
  `targetId`, `roleLabel`, `address`, `kind`, `host`, `note` and `at`, unproven entries included (the
  capture log shows them with the masked secret). It never carries the server-only keys
  (`proven`, `writer`, `legacySecret`) and never a secret. Sync answers use the same shape for each
  entry.
- `record_capture!(input, scenario:, by: :client)`: no save; its caller saves once.
  - Refuses a non-Hash, a `targetId` that is not a string of at most 100 code points, a kind
    outside the two, or a client `address`, `host` or `roleLabel` that is not a string of at most
    `MAX_CAPTURE_FIELD_CHARS` code points where it is given (`invalid`).
  - For `by: :client`: a target outside `client_target_ids` is either a heard share or undeclared.
    For a heard share (`share_only_target?`) whose id is in `player_state['sharedLogins']`, the
    entry is recorded by `record_shared_login!` instead, from the server's own composition, and the
    client's fields are ignored; the result is `recorded` or `already` as usual. A heard share not
    in `sharedLogins` is refused `server_only`. Anything else is refused `undeclared`.
  - An existing entry for the target is returned unchanged (`already`): first capture wins.
  - Otherwise it picks the candidate for (target, kind) whose `address`, `host` and `roleLabel`
    equal the client's where the client gave them, preferring a plain candidate to an overlaid one,
    else the first candidate. None for that kind: refused `invalid`.
  - It stores `{ targetId, roleLabel, address, kind, host, note, at, proven }` from the candidate,
    every string whole, as authored: nothing taken from the scenario is cut, so the student reads
    the same note in the capture log and the report as today (a cut would end lab_physical_pentest's
    `store_controller` finding mid-sentence and lose its recommended control). `at` is the
    server's time in milliseconds. `proven` is `true` under step 6a; from step 6b it is
    `capture_evidence_holds?` (below). It also stores the candidate's `writer` (server-only, a path
    built from the scenario, so bounded by it). Returns
    `{ result: :recorded | :already | :refused, entry:, reason: }`.
- `record_shared_login!(npc_id, scenario:, workaround: nil)`: stores the entry from
  `CaptureModel.shared_login_capture` (passing the workaround on) with the server's `at`,
  `writer: "share:<npcId>"` and `proven: true`, unless an entry for that target exists. The heard answer in npc_frustration.rb calls it, as do the sync step and the
  bootstrap step below.
- `unrecorded_shared_logins?` (cheap, `player_state` and the scenario's NPC list) and
  `record_shared_logins!(scenario:)`: each id in `sharedLogins` whose NPC still has a `share_login`
  workaround and has no record entry is recorded through `record_shared_login!`.
- `capture_evidence_holds?(entry, scenario:, extra_sent: [])` (step 6b): true for a foothold (nothing is revealed for
  one). For a credential:
  - part 2: when the entry's address is a page's capture address (that page), or the target is a
    phish target and the scenario has exactly one page secret (the single-secret fallback; the page
    holding that secret), it needs `globalVariables.se_landing_pages[page]` with `built == true`,
    `meetsThreshold == true` and `victim.submitted == true`, and a message with
    `folder == 'sent'`, `landed == true`, `targetId` the target and `link.kitId` one of the page's
    kits, either in any stored `mailState.mailboxes.*.messages` or in `extra_sent` (the request's
    own sent messages, sanitised by `mail_state_updates`, 6.2);
  - part 3: when `target_capture_proofs` is not empty, one of them must hold.
  Every other credential holds.
- `capture_revealable?(entry, scenario:)`: `entry['proven'] == true || capture_evidence_holds?(...)`.
- `stamp_proven_captures!(scenario:, extra_sent: [])` (no save): sets `proven: true` on each stored
  entry whose evidence now holds, counting `extra_sent`. `stampable_captures?(scenario:)` is the same test without the write: true only
  when some unproven entry's evidence holds now. The proof records (`plantedItems`, `droppedItems`,
  `signedInPcs`) only grow, so a proof that held keeps holding; the stamp matters for the page
  evidence, which the client can change.
- `legacy_captures?`: a cheap check on `player_state` alone.
- `migrate_legacy_captures!(scenario:)` (no save, a data move inside `player_state` with no schema
  change): moves each entry of a `globalVariables.se_captures` Hash into `seCaptures`. A declared
  target goes through part 1, keeps its stored `at` and is marked `proven: true`. A heard-share target
  whose id is in `sharedLogins` is recorded through `record_shared_login!`, keeping its stored `at`,
  so an old save keeps its capture-log row and the login the server once composed. Any other target
  is dropped. The global is then deleted. Since the server never stores that global after the
  deploy (below), any copy of it predates the deploy and was earned under the old rules, so nothing
  visible changes for an old save. If a record already exists, entries merge first-wins. A value
  that is not a Hash is deleted with nothing moved.
  - **A secret the old save already displays.** An old entry can carry a `secret` the client showed
    through `displaySecret`'s fallback (captures.js:93 to :99): Len's PIN in any old save, and, in a
    save from before 2026-11-09 (when account holders' mapping secrets began to be withheld from the
    bootstrap), an account holder's password whose proof the server may not hold. When the old
    entry's `secret` is a non-empty string equal to the authored secret the server holds for that
    target and stored candidate (its page's secret, the password of the account its address names,
    or `candidate_secret` of its writer), the migrated entry gains `legacySecret: true`
    (server-only). The client-written string itself is never stored. The flag is only set from a
    pre-deploy copy, and it can only match a value the save already held, so it reveals nothing the
    student could not already read.
- `declared_capture_target_ids` (:117) is unchanged: the readers still accept the heard-share ids.

Server, readers:

- `Game#capture_secrets_for_client` (game.rb:1202) and `NetworkAccess#account_capture_usernames`
  (network_access.rb:1232) read `se_captures_record`, skip any entry that is not
  `capture_revealable?`, and otherwise work as today. The address they look up is now the server's
  own. `capture_secrets_for_client` keeps its `revealSecret` gate (game.rb:1203) and answers each
  revealable credential entry from the first of four passes that has a secret:
  1. the page pass, `by_address[address]` (game.rb:1244), as today;
  2. the account pass, `by_username[...]` (game.rb:1245), as today, with its proof filter
     (`account_capture_passwords`). For an entry with `legacySecret: true` it reads the account's
     password without the filter, because that save already shows it;
  3. **the writer pass (new):** `CaptureModel.candidate_secret(scenario_data, entry['writer'])`.
     It is reached only for a revealable entry, so from step 6b part 3 applies to it through
     `capture_revealable?`, and under step 6a every entry is revealable, as today. For Len in
     lab_physical_pentest the mapping carries no `proof` and Ruth has no `captureProof`, so the PIN
     is served as soon as the capture is recorded, which is when the client shows it today;
  4. the single-secret fallback (game.rb:1247), for phish targets only, under part 2, as today.
  The writer pass runs before the fallback, so an authored writer secret is never shadowed by a
  landing page's secret. The same string already ships in the bootstrap for a writer whose owner
  has no account, so this pass exposes nothing new.
- `GET /capture_secrets` stays a read-only, unlocked action.

Server, writers:

- `app/models/break_escape/npc_frustration.rb`: where a heard `share_login` done marks the login shared
  (:202 to :209, before its `save!` at :211), it also calls `record_shared_login!` with the heard
  workaround. The answer is unchanged.
- Carry-over imports: `resolve_imported_globals` (carry_over.rb:102 to :139) and
  `apply_imported_globals_to_state` (:217 to :224) skip an import whose name is in
  `Game::SERVER_OWNED_GLOBAL_NAMES` (`%w[se_captures]`, the server's copy of the client's
  `SERVER_OWNED_GLOBALS`), with a logged warning, so no route writes that global into a game after
  the deploy and the migration can never mistake an import for an old save. The validator reports
  such an import as an error (`scripts/validate_scenario.rb`, beside its other `importGlobals`
  checks). No scenario has one today.
- `app/controllers/break_escape/games_controller.rb` `sync_state`, a new step after
  `merge_grow_only_sections` (:790) and before the save at :799, run on a stale request too (a
  capture is grow-only and safe to repeat):
  - `incoming` is `params[:captures]` (an Array, at most 64 entries) plus the values of
    `params[:globalVariables]['se_captures']` when an old tab sends that key. The key is removed from
    the globals before `merge_global_variables!` runs (games_controller.rb:1819), and
    `merge_global_variables!` also drops it whenever it appears, so the global is never stored again.
  - On a request that is not stale, the step also takes the request's own sent messages: each
    `mailboxes.<box>.<msgId>` update that `mail_state_updates` keeps (so the box id, the message id
    taken from the key and the `id` follow the merge's rules) with `folder == 'sent'`,
    `landed == true`, a `targetId` and a `link.kitId`. They are passed to the stamp as extra part 2 evidence (6.2), so a
    mail section refused over a cap, or a new sent message the trim dropped, does not withhold the
    secret. They are read from the parsed body and never stored by this step.
  - The step needs the scenario only when `incoming` is not empty, `legacy_captures?` holds, or an
    unproven entry exists and the request carries `globalVariables` or `mailState` (the only
    sections that can complete part 2's evidence in a sync). Only then it fetches it, as
    `biometricSamples` does at :1903: `scenario = Game.where(id: @game.id).pick(:scenario_data)`. It
    passes `scenario:` to every call and never reads the `scenario_data` attribute, which the narrow
    load (`SYNC_STATE_COLUMNS`, :1777) does not hold. An unproven entry that can never be proven (a
    forged one) therefore costs a scenario fetch only on syncs that carry globals or mail, and never
    a lock outside the one `sync_state` already takes.
  - It runs `migrate_legacy_captures!`, `record_capture!` for each incoming entry, then (from step
    6b) `stamp_proven_captures!(scenario:, extra_sent:)` with the request's sent messages. The evidence a phish needs (the sent mail, the page record) is
    merged earlier in the same request by the mail and globals merges when the request is not stale,
    so a capture and its evidence sent together count at once.
  - The answer gains `captures: { targetId => entry }` for each incoming target recorded or already
    held, and `capturesRefused: { targetId => reason }`, both only when `incoming` was not empty.
    The stale branch (:804 to :805) answers `{ success, stale, captures, capturesRefused }` on the
    same rule, so the client's `onAnswer` on a stale answer (2.2) has the captures to read.
    Entries in answers come from `captures_for_client` and never carry `proven`.
- `scenario`: the locked bootstrap step (2.4) runs the migration, `record_shared_logins!` and the
  stamp; then `filtered['captures'] = @game.captures_for_client` when the record is not empty.

No new route and no policy change: the captures ride `PUT /sync_state`, which is already authorised
per game.

Client:

- New `public/break_escape/js/systems/capture-client.js`, imported statically by
  `public/break_escape/js/main.js` and installed at startup. Its only static imports are captures.js
  and global-writer.js. It exports `installCaptureClient(stateSync)`, which main.js calls straight
  after it creates `window.stateSync` (main.js:145), before any game code runs:
  - it registers the sync part `captures` (2.2) and sets `window.submitSECapture` and
    `window.mirrorSECapture`;
  - `submitCapture(input)` is synchronous: it builds the entry with `makeCaptureEntry`; if the
    mirror already holds the target, it does nothing (first wins). Otherwise, in the same call, it
    writes the mirror (`writeGlobal('se_captures', next, { openChat: false })`, so listeners and
    readers see it at once), adds `{ targetId, kind, address, host, roleLabel }` to its pending map,
    and calls `stateSync.sync()`;
  - the part's `build()` returns the pending entries; `onAnswer(response)` replaces each answered
    mirror entry with the server's and drops it from pending; a refused one is dropped from pending
    and from the mirror, and logged; `pendingCount()` is the pending map's size; `flushKeep(changes)`
    returns the `mailState` changes that are sent records to a pending target, so the pagehide flush
    keeps a phish's evidence with its capture even when it drops the rest of the mail;
  - `mirrorCapture(entry)`: writes the mirror only, for the heard login the server recorded itself.
  - Displayed secrets: the mirror entry `submitCapture` writes first is what `makeCaptureEntry`
    builds, so a writer secret shipped in the bootstrap (Len's PIN) is on it until the answer; the
    server's entry that replaces it has none. Every screen that shows a secret already asks the
    server: the capture log tablet calls `loadCaptureSecrets` when it opens
    (capture-log-minigame.js:197 to :200), as does the landing-page builder's captures view, and
    `applyCaptureSecrets` fills the masked rows from the `/capture_secrets` answer, which the writer
    pass (above) now fills for Len. `displaySecret`'s `entry.secret` fallback (captures.js:93 to :99)
    stays, for an old tab's own entries.
- `mail-bridge.js` `recordCapture` (:82) calls `window.submitSECapture(input)` in the same tick as
  today's write, so the capture is pending before `performSend` returns, alongside the sent record
  (:403) and the page record (:423). It adds no import, so none of the node harnesses that copy
  mail-bridge.js changes its copy list; the harnesses that assert captures stub
  `window.submitSECapture`. If the function is missing (a harness without the stub), the writer logs
  an error and returns false; it never writes the mirror alone.
- `apply-actions.js` `recordSECapture` calls `window.submitSECapture` the same way; its lazy
  captures.js import (:20) goes. It keeps `window.recordSECapture` (:42) and its export, now
  returning the boolean straight away (callers that await it still work).
- `npc-workarounds.js` calls `window.mirrorSECapture`.
- `core/game.js`: after the saved globals are merged (:1705), set
  `window.gameState.globalVariables.se_captures` to `gameScenario.captures` (or `{}`), only when the
  bootstrap carries `captures` or the scenario declares `se_captures` in its `globalVariables`, so a
  mission without captures gets no mirror.
- `state-sync.js`: step 6a adds `'se_captures'` to `SERVER_OWNED_GLOBALS` (added empty in step 2,
  3.2). `buildSharedSections()` leaves those keys out of the outgoing globals, and `seedFromSaved`
  skips them. The capture branch of `guardLandingState` and `CAPTURE_ENTRY_KEYS` there (:46, :47,
  :102) are removed, since the key is never sent.
- `captures.js` stays pure, keeps the entry rules and keeps every export it has today. A tab open
  across the deploy loads it by a dynamic import the first time it captures, and is served the new
  file, so its old callers must still find the names they import. Its comment changes to name the
  server record.

### 6.4 Wire format and size

Before: each new capture sends `PUT /sync_state { globalVariables: { se_captures: { every entry } } }`
(about 120 bytes per target, 619 at five), and the map goes down in `savedGlobalVariables` on load.

After:

Measured on the checked commit by rendering every scenario and building each writer's entry as
`captures_for_client` would send it (every field the writer authors, `secret` and `proof` left out,
a 13-digit `at` added). The stored record adds the server-only `proven` and `writer` keys, about 80
bytes more per entry. The authored notes are whole sentences, so they dominate the size. Every
entry is stored and sent whole (6.3), the 693-character `store_controller` note included; the
figures below are of whole entries.

| Scenario | Writers | Client entries, total | Largest client entry | Stored record, total |
|---|---|---|---|---|
| lab_physical_pentest | 19 | about 8.4 KB (8 443 bytes) | 894 bytes | about 10 KB |
| test_capture_log | 4 | about 0.8 KB | about 230 bytes | about 1.1 KB |
| test_clone_left_card, test_interaction_warning | 1 each | under 200 bytes | under 200 bytes | under 250 bytes |
| lab_social_engineering | No authored writers; 3 phish targets, each one entry (a page credential or a foothold) | under 0.8 KB | about 250 bytes (a credential for `lord`) | under 1 KB |

- Capture: `PUT /sync_state { ..., captures: [{ targetId, kind, address, host, roleLabel }] }`, about
  120 bytes for the capture part (no note travels up; at most about 750 bytes, since the client's
  three strings are capped at `MAX_CAPTURE_FIELD_CHARS`), sent until the server answers it (normally
  once); answer part `captures: { <targetId>: {...} }`, the server's entry, up to about 900 bytes in
  lab_physical_pentest and about 250 in lab_social_engineering.
- Load: `captures` in the bootstrap, once, up to about 8.4 KB in lab_physical_pentest. Today the same
  entries go down in `savedGlobalVariables.se_captures`, so the bootstrap does not grow.
- `GET /capture_secrets`: one short secret per revealable credential, as today, plus Len's PIN.
- `se_captures` never appears in a sync body from the new client.
- Bound: one entry per declared target or heard share, fixed by authoring. Each authored string is
  held to its limit by the validator (a note at most 2 000 code points, `roleLabel`, `address` and
  `host` at most 200 each, the target id at most 100), so a client entry is at most about 2.9 KB of
  ASCII text (about 3 KB stored), and at most four times that in the worst case where every
  character takes four bytes in UTF-8. At the measured sizes lab_physical_pentest's record is about
  8.4 KB sent and 10 KB stored, unchanged by storing the notes whole, since none was cut before
  the record existed.
- The size rule holds: the record grows by one bounded entry per new target, each sync sends one
  pending entry up and its one entry down, nothing is resent while unchanged, and the whole record
  goes down once per load, as the rule allows.
- An old tab sends its whole map on each new capture, as today; the map is bounded by the same
  targets.

### 6.5 Compatibility

- Old saves: the first bootstrap of a game with a `globalVariables.se_captures` Hash moves it into
  the record in the locked step (a data move inside `player_state`; no schema change, so two servers
  can run against one database, as live case E does), before `savedGlobalVariables` is read into the
  answer, so the client never sees the old global and its capture log, report and secrets look the
  same. Secrets an old save showed through the entry's own `secret` stay shown: Len's PIN through
  the writer pass, and an account holder's password in a save from before 2026-11-09 through the
  `legacySecret` flag (6.3).
- Heard shares in an old save: kept. The migration records each one whose id is in `sharedLogins`
  from the server's own composition, and `record_shared_logins!` in the same step records any
  `sharedLogins` id with no entry, so an old save whose global never reached the server still gets
  its row.
- An entry in an old save whose target is neither declared nor a recorded heard share is dropped by
  the migration. The secrets route already skips such entries (game.rb:1241), so nothing visible
  changes.
- Old tabs: an open tab keeps writing the global through `PUT /sync_state`. The sync step takes the
  key out of the globals and records each entry through the same gate, and the tab's own mail and
  page records travel in the same body, so its captures are kept and counted. A heard-share entry
  from an old tab is recorded by the server's route when its id is in `sharedLogins`, which the
  heard answer wrote before the tab could send it. The old tab ignores the new answer fields. The
  interception stays permanently, since it is the gate for that path. An old tab keeps showing the
  secrets on its own entries (Len's PIN) from its own copy of the global until it reloads; after the
  reload the new client asks `/capture_secrets`, and the writer pass serves the PIN. The
  interception never sets `legacySecret`: a post-deploy write cannot be told apart from a forged one,
  and an old tab would have to stay open from before 2026-11-09 across the deploy to hold an account
  holder's secret.
- Old tabs load the new captures.js when they first capture (6.3), so its exports stay.
- The scenario declarations `"se_captures": {}` stay; the client sets the mirror from the bootstrap
  after they are applied.
- The pagehide flush carries the pending captures in every fallback list, with the sent mail that
  evidences a pending phish (`flushKeep`).

### 6.6 Cheat policy

- One gate for every write path (the sync part, the old tab's global, the server's own heard login):
  a declared target, fields from the scenario, closed keys, caps on the strings the client sends
  (authored strings are held to their limits by the validator and stored whole), first wins, heard
  shares composed by the server.
- The secrets and usernames are served only from the server's record, only for that target's own
  authored secret, and only once the phish evidence or the proof holds. The writer pass serves only
  a secret authored on the writer the stored entry came from, never one on an account holder's
  mapping or in an account holder's `usePayload` (where the loader puts the password), and only a
  value the bootstrap already ships today. `legacySecret` is set only from a
  pre-deploy copy and only when the saved string already equals the authored secret. Both checks are keyed on the
  target and the secret, so the client's choice of candidate cannot skip them.
- What stays best effort: the browser decides when a phish lands, and the evidence it relies on (the
  page record and the sent mail) is client-synced. A forger must now write a consistent built page
  whose victim submitted and a landed sent mail to that target carrying that page's kit, the same
  evidence the honest send produces, not one target id. For a proof-gated
  target the proof is the server's own record (`plantedItems`, `droppedItems`, `signedInPcs`,
  `gainedFootholds`), so a forged capture there reveals nothing.

### 6.7 Every capture's honest route produces what the gate needs

Every scenario with a capture writer, a `usePayload`, a phish target or a `share_login` workaround
was walked (26 scenarios; no m01 to m10 mission has any). "Part 1" names where the server takes
the fields from. "Reveal needs" is parts 2 and 3, keyed on the target as 6.2 says; "none" means the
entry is revealable when recorded.

| Scenario | Target, kind | Writer and event | Part 1 fields | Reveal needs | Honest route produces it |
|---|---|---|---|---|---|
| lab_social_engineering | lord, credential | Phish send with `kit_payroll_page`, page `payroll_login` (secret, revealSecret on) | Page capture address, note; target role | Built page meeting the threshold; sent mail to lord carrying the kit | Yes. `captureGranted` needs `rec.built === true` (mail-bridge.js:417) and a submitted victim, which needs `meetsThreshold` (landing-page-model.js:701). `performSend` commits the sent record with `targetId` and `link.kitId` (mail-bridge.js:403; `linkRecordOf` and `buildRecord`, :643 to :679) and writes the page record (:423) before the capture (:435), so all three go in the same sync body, and the server merges the mail and globals before the capture step. `MAIL_MESSAGE_KEYS` keeps `folder`, `targetId` and `link` (game.rb:3846). The page record is keyed by page and `captureGranted` fires once (mail-bridge.js:417 to :443), so only the first target whose send turns the page's victim to submitted gets a credential capture |
| lab_social_engineering | hampshire or pierce, credential | The same page sent to them (any target can be sent the kit) | Page capture address; target role | As above, for that target | Yes, the same way, but only when that target's send is the first to turn `payroll_login`'s victim to submitted; a later target gets no credential capture, as today. The secret found is the page's |
| lab_social_engineering | hampshire, pierce, lord, foothold | Attachment send that lands; each target has a `foothold` block | The target's `foothold` host and note | None (footholds reveal nothing) | Not gated |
| lab_physical_pentest | 13 foothold targets (store_controller to hot_desk) | Ruth's `addCapture` mappings on globals, plants, sign-ins, room entry and `card_cloned` | Each mapping's fields; Ruth has no `usePayload` | None | Not gated |
| lab_physical_pentest | comms_card_taken, foothold | `add_capture` in `onOwnerNoticesMissing` | The action's fields | None | Not gated |
| lab_physical_pentest | usb_lure, foothold | The `lord` NPC's mapping on `npc_used:usb_target_pc`, tag `dev_usb` | Mapping overlaid with that NPC's `usePayload` | None | Not gated |
| lab_physical_pentest | len, credential | Ruth's mapping on `player_watched_reader` (scenario.json.erb:906), which carries `"secret": "4471"`, the records door PIN | The mapping's address and host | None (no `proof`, and Ruth has no `captureProof`) | Yes, through the writer pass. Today the PIN reaches the student only through the client entry: Ruth has no `creds`, so `withhold_npc_secrets!` leaves it in the bootstrap (game.rb:4702), `makeCaptureEntry` keeps it (captures.js:55) and `displaySecret` falls back to it (captures.js:93 to :99), while `/capture_secrets` serves nothing for it (no page carries `l.okafor`, Len has no `creds`; pinned by the case at lab_physical_pentest_secrets_test.rb:117 to :131, Len's entry at :128). After the change the record holds no secret and the writer pass serves `{ "len" => "4471" }` once the capture is recorded, so the Harvested Credentials tablet the ledger shelves' hint names (:1865, :1874) shows it on a new game, after a reload, for an old save and for a reloaded old tab. That test changes to expect the PIN |
| lab_physical_pentest | hampshire, credential | The `hampshire` NPC's mapping on `workstation_owner_returned:staff_pc` (not an `npc_used` event, so no overlay) | The plain mapping (:1315; its address and host equal the overlay's, :1283, so the plain candidate is stored) | Part 3: that NPC's `captureProof` (:1276), `kit_deviceA` planted on `staff_pc` | Yes. The mapping's condition needs `kp_deviceA_set` (:1312), set when the player plants the device, and the plant is recorded by the server when `POST /inventory` removes the item with `usedOn`. The account pass needs the same proof today |
| lab_physical_pentest | lord, credential | The `lord` NPC's mapping on `npc_used:usb_target_pc`, tag `dev_qr` (:1429) | Mapping overlaid with that NPC's `usePayload` host; a tampered client that sends no host gets the plain candidate (`address: "s.lord"`, no host) | Part 3: that NPC's `captureProof` (:1356), `kit_qr` dropped, whichever candidate was stored | Yes. `kit_qr` carries `needsTag: "dev_qr"` (scenario.json.erb:971), so the NPC can only use it after the player drops it, and the drop is recorded in `droppedItems` when the room add with `sourceType: 'player_drop'` is accepted (item-drop.js:142 to :155, game.rb:492 to :515). The account pass already needs the same proof today |
| lab_physical_pentest | pierce, credential | The `pierce` NPC's mapping on `workstation_accessed:staff_pc_2` (:1594; the event carries no payload, workstation-state.js:588, :603) | The plain mapping (its address and host equal the overlay's, :1581) | Part 3: that NPC's `captureProof` (:1564), session `staff_pc_2` | Yes. The capture fires on the click, before any sign-in; the claim's `POST /login` then adds `staff_pc_2` to `signedInPcs`, and the secret is served from then on. The account pass needs the same proof today |
| test_capture_log | hampshire, credential | The `chris` NPC's mapping on `global_variable_changed:logger_planted` | The plain mapping | Part 3: `chris`'s `captureProof` (scenario.json.erb:161), `kit_logger` planted on `chris_desk` or `kit_box` on `wall_port` | Yes. The global is set by the plant, which the server records through `POST /inventory` with `usedOn`; the check runs at read time, so the order of the two requests does not matter. The account pass needs the same proof today |
| test_capture_log | lord, credential | The `sofia` NPC's mapping on `npc_used:sofia_desk`, tag `dev_qr` | Mapping overlaid with that NPC's `usePayload` | Part 3: that NPC's `captureProof`: `kit_qr` dropped | Yes, as in lab_physical_pentest: the drop comes first and is recorded by the server |
| test_capture_log | pierce, credential | The `mel` NPC's mapping on `pc_signed_in:mel_pc`, with the shorthand proof `session: mel_pc` | The mapping | Part 3: the mapping's proof, `mel_pc` in `signedInPcs` | Yes. `pc_signed_in` is emitted by `_replace` (pc-sessions.js:400, emit at :409) only after the `POST /login` answer (:272, :314), and the server adds the PC to `signedInPcs` inside that login (`start_login_session!`, game.rb:2467 to :2477) |
| test_capture_log | ned, credential | `add_capture` action on an object | The action's fields | None | Not gated |
| test_clone_left_card | clerk_card, foothold | `add_capture` in `onOwnerNoticesMissing` | The action's fields | None | Not gated |
| test_interaction_warning | evidence_box, foothold | `add_capture` in `interactionWarning.onProceed` | The action's fields | None | Not gated |
| test_access_work | sam, credential | Heard `share_login` workaround | Composed by the server (`shared_login_capture`) | Server-written, `proven: true` | Recorded by npc_frustration.rb itself; the client only mirrors it. An old save or an old tab is covered by `sharedLogins` (6.5) |
| ca05_signin_pages | sso_staff, credential | Phish send with `kit_sso_page`, page `sso_login` (no capture block, no secret, revealSecret off) | The target's own address | Part 2 applies but nothing is revealed | Produced the same way as lab_social_engineering |
| test_social_slice | lord, hampshire, teague, credential | Phish send with `kit_payroll_page` (no secret, revealSecret off) | Page capture address | Part 2 applies but nothing is revealed | Produced the same way |
| ca01, ca02, ca04, ca06 to ca08, ca10, ca13, ca14, test_ink_email, test_social_board_indicators, test_social_docs_proof, test_social_episode, test_social_freetext, test_social_m5_channels, test_social_p9 | Their phish targets | No link kit reaching a page, and no target with a `foothold` block | (no capture is ever written) | n/a | No capture writer fires in these, today or after |
| test_needs_sims, test_npc_needs | (none) | A `usePayload` with no `targetId` and no `addCapture` mapping | n/a | n/a | No capture |

Two timing cases were checked by hand. The `pierce` NPC's `workstation_accessed` capture fires on the
click, before any sign-in, and its proof comes from the claim's `POST /login` afterwards: that is why
part 3 gates the reveal and not the record. The capture is kept and shown masked, and its secret is
served once the claim lands, as the account pass serves it today. A phish whose flush drops the mail
for size keeps the evidencing sent record through `flushKeep`.

**Every capture secret in the stored scenario.** The walk built each scenario's stored form as
game creation does (render, then `prepare_scenario_data!`, which runs `normalise_access_model!`),
and listed each capture writer whose `capture` hash, or whose overlaid `usePayload`, carries a
`secret`, with its owner and what reaches the student today:

| Scenario | Writer | Secret from | Owner or payload owner | Shipped in the bootstrap today | Served by `/capture_secrets` today | After |
|---|---|---|---|---|---|---|
| lab_physical_pentest | `/rooms/briefing_room/npcs[1]/eventMappings[27]/addCapture` (target `len`) | Authored on the mapping | Ruth, no account | Yes | No | Writer pass |
| lab_physical_pentest | `/rooms/open_plan/npcs[1]/eventMappings[0]/addCapture+payload:hampshire` (target `hampshire`) | Injected into the `usePayload` by the loader | `hampshire`, account holder | No (withheld) | Account pass, once its proof holds | Account pass only; the guard stops the writer pass |
| lab_physical_pentest | `/rooms/open_plan/npcs[2]/eventMappings[4]/addCapture+payload:lord` (target `lord`, tag `dev_qr`) | Injected | `lord`, account holder | No (withheld) | Account pass, once `kit_qr` is dropped | Account pass only; the guard stops the writer pass |
| lab_physical_pentest | `/rooms/open_plan/npcs[2]/eventMappings[3]/addCapture+payload:lord` (target `usb_lure`, a foothold) | Injected | `lord`, account holder | No (withheld) | Nothing (a foothold) | Nothing; the guard stops the writer pass |
| lab_physical_pentest | `/rooms/open_plan/npcs[4]/eventMappings[0]/addCapture+payload:pierce` (target `pierce`) | Injected | `pierce`, account holder | No (withheld) | Account pass, once `staff_pc_2` is signed in | Account pass only; the guard stops the writer pass |
| test_capture_log | `/rooms/office/npcs[1]/eventMappings[0]/addCapture+payload:sofia` (target `lord`) | Injected | `sofia`, account holder (`s.lord`, scenario.json.erb:181) | No (withheld) | Account pass, once `kit_qr` is dropped | Account pass only; the guard stops the writer pass |

Len's is the only writer secret that reaches the student through the client entry alone. The
authored scenario files carry no `secret` on any `usePayload`; the rows marked "Injected" exist
only in the stored scenario, because `normalise_npc_access!` (game.rb:4759 to :4780) copies the
account's password into the `usePayload` of every account holder that has one. test_capture_log's
`ned` (scenario.json.erb:224 to :225) gets a password the same way, but no capture writer overlays
his payload, so no candidate reads it. These injected secrets are why `candidate_secret` checks the
payload owner as well as the owner (6.3). Every other secret a student is shown comes from a route
the server already serves and keeps serving: a landing page's `capture.secret`
(lab_social_engineering's `payroll_login`, the page pass), an account holder's password (the
account pass, whose mapping and payload secrets the bootstrap already withholds), and a heard
share's password, which lives in the note the server composes and stores in the record. The other
`"secret"` keys in the scenario tree are not capture secrets (a quiz item's flag in
ca13_ai_assistant, an ink file in m10). Old saves are covered by the writer pass for Len and by
`legacySecret` for an account holder's password saved before 2026-11-09 (6.3); old tabs by their
own copy until they reload.

The builder reruns this walk before building and records both tables in the build log, so a
scenario added since is not missed. The walk is a `bin/rails runner` script that saves nothing: for
every scenario it builds the stored form with `Game.new(scenario_data: rendered)` and
`prepare_scenario_data!`, never the raw render, so the injected payload secrets are listed. Over
`CaptureModel.each_capture_writer`, the `usePayload` NPCs and the phish targets it prints:

- every writer whose `capture` hash or overlaid `usePayload` carries a `secret`, with its owner,
  its payload owner, whether either holds an account (the writer pass skips those) and whether the
  secret was authored or injected;
- every authored capture string over its limit (`MAX_CAPTURE_NOTE_CHARS` for a note,
  `MAX_CAPTURE_FIELD_CHARS` for `roleLabel`, `address` and `host`), which the validator also
  reports as an error; none on the checked commit;
- each scenario's capture entry sizes, the total and the largest, so 6.4 and section 8 can be
  restated from a measurement.

### 6.8 Tests

- Rails, new `test/controllers/break_escape/captures_sync_test.rb`, every case through
  `PUT /sync_state` with a body taken from the real client's builder (10.2), never a model call:
  - a declared target is recorded with the scenario's fields, whatever address, host, role or note
    the client sent, and the bootstrap returns it; an undeclared target is refused `undeclared`; a
    heard-share-only target not in `sharedLogins` is refused `server_only`, and one in
    `sharedLogins` is recorded with the server's composed fields, whatever the client sent; a bad
    kind is refused `invalid`; a writer with no `kind` counts as `credential`; a second capture keeps
    the first; a client `address`, `host` or `roleLabel` over `MAX_CAPTURE_FIELD_CHARS` and a
    `targetId` over 100 code points are refused `invalid`; more than 64 entries are refused;
  - authored text is stored whole: in lab_physical_pentest, record `store_controller` through
    `PUT /sync_state` (the client part `{ targetId, kind: "foothold", host }` as the real builder
    sends it); the sync answer's `captures.store_controller.note` and the bootstrap's
    `captures.store_controller.note` both equal the mapping's 693-character note
    (scenario.json.erb:790), compared in full with the note read from the game's stored scenario;
  - a capture for target A naming target B's page address or B's username is stored with A's own
    address, and `GET /capture_secrets` serves A's secret only;
  - a phish credential with no built page, or with a page below the threshold, or with a page
    record whose `victim.submitted` is not true, or with no sent mail to that target carrying the
    kit, or whose only such sent mail has `landed` other than `true`, is recorded and its secret is
    not served; adding the evidence in a
    later sync serves it, and stamps `proven`; un-building the page afterwards still serves it;
  - a proof-gated credential is not served until the proof holds, then is; in lab_physical_pentest a
    `lord` capture sent with no host (so the plain candidate is stored) is still not served until
    `kit_qr` is dropped, and `hampshire` and `pierce`, whose plain candidate always wins, are not
    served until their NPC's proof holds;
  - entries recorded under step 6a keep their secret when 6b ships: record a phish credential with
    the 6a rules (`proven: true` stored), un-build the page, run the 6b stamp and bootstrap; the
    secret is still served. The same with the old sent message removed from `mailState`;
  - an old tab's sync carrying `globalVariables.se_captures` records each entry through the gate,
    stores no global, answers 200, and its pagehide-style stale request still records it; the stale
    answer carries `captures` and `capturesRefused`; a stale request carrying a capture and its
    evidence records the capture, does not serve it, and the next non-stale sync carrying the same
    mail and page record serves it;
  - a sync with no captures and no unproven entry does not fetch the scenario, and a sync with only
    a forged, never-provable entry fetches it only when the request carries `globalVariables` or
    `mailState`. The count is of the `pick(:scenario_data)` query alone: the test subscribes to
    `sql.active_record` and counts statements that select the whole `scenario_data` column, because
    a `currentRoom` change makes a separate `pick` of `scenario_data->>'startRoom'`
    (games_controller.rb:1811) that must not be counted. A bootstrap with only such an entry takes
    no row lock (asserted by counting `FOR UPDATE` statements the same way);
  - an old save's global migrates on the bootstrap, is deleted, and its secrets are served as before;
    an old save's heard-share entry for `sam` in test_access_work is kept, with its stored `at` and
    the server's note; a save with `sam` in `sharedLogins` and no entry gains one on the bootstrap;
    a bootstrap racing a sync keeps the sync's writes, with the hook described in 5.6 placed in
    `legacy_captures?`;
  - a heard login done records the capture with `proven: true`, and its note equals the heard
    answer's capture note; for a fixture NPC with two `share_login` workarounds naming different
    colleagues, hearing the second records the second colleague in the note, as the heard answer
    does today;
  - Len's PIN, the writer pass: in lab_physical_pentest, record the `len` capture through
    `PUT /sync_state` and `GET /capture_secrets` returns `{ "len" => "4471" }` (the existing
    case at lab_physical_pentest_secrets_test.rb:117 to :131 is changed to expect this); the same for an
    old save whose legacy `se_captures` holds a `len` entry with `secret`, after the migration on the
    bootstrap; the same with `revealSecret` turned off returns nothing; a fixture writer with a
    `secret` on an account holder's mapping is not served by the writer pass; the test finds Len's
    writer path by walking `each_capture_writer` for target `len`, never by a hard-coded index;
  - the payload-owner guard, on the real scenarios under step 6a rules (every entry stored
    `proven: true`): in lab_physical_pentest, record `lord` through `PUT /sync_state` with the
    overlaid candidate's host (the `lord` NPC's `usePayload.host`, so the overlaid candidate and its
    `+payload:lord` writer are stored), with no `kit_qr` drop recorded. The test first asserts that
    the game's stored `usePayload` for `lord` holds a `secret` (the loader's injection), so the case
    cannot pass by accident. `GET /capture_secrets` has no `lord` key. Then record the drop and the
    password is served, by the account pass. The same in test_capture_log for `sofia`'s `lord`
    capture (`sofia` holds the account `s.lord`). A unit case calls
    `CaptureModel.candidate_secret` directly on each `+payload:` writer in the 6.7 table and expects
    nil;
  - `legacySecret`: an old save from before the withholding, holding a `hampshire` entry with the
    account's password as `secret` and no proof recorded, still gets the password after the
    migration; the same save with a `secret` that does not equal the password gets nothing until the
    proof holds; an old tab's `se_captures` carrying the password never sets the flag;
  - a refused mail section: a phish credential whose request also carries the sent record, sent
    while the stored mailbox is at its unread cap so `mailState` is answered as `notSaved`, is stamped
    `proven` from the request's own sent message, and `GET /capture_secrets` serves the secret; the
    same body sent as a stale request does not stamp it;
  - part 3 keyed on the captured account: a fixture where NPC A's mapping captures NPC B's account
    applies B's proofs, not A's;
  - carry-over: a scenario importing a global named `se_captures` creates a game whose
    `player_state` and `scenario_data` hold no such global, and the bootstrap migrates nothing (the
    validator case is in the validator's own test).
- Existing tests that seed the global move to the record or are kept as migration cases:
  capture_proofs_test.rb, network_no_exposure_test.rb, npc_workaround_h_test.rb,
  lab_physical_pentest_secrets_test.rb (test/models), capture_secret_test.rb (test/models),
  capture_secret_endpoint_test.rb, access_model_no_password_test.rb, network_shares_test.rb and
  access_model_withholding_test.rb (test/models).
- `tools/playtest/lib/access_leak_scanner.rb:677` exempts a password only under a `.se_captures` path.
  The heard login's note (with the password, under `revealSecret`) now sits under the bootstrap's
  `captures` and the sync answer's `captures`, so the exemption moves to those paths, with
  `test/unit/access_leak_scanner_test.rb` updated in the same step.
- JS: new `test/js/capture-client.test.mjs` (mirror written once, one pending entry per target, first
  wins, the answer replaces the mirror, a refusal removes it, a lost answer resends it with the next
  sync, `syncConfirmed` is false while one is pending, the flush keeps the pending capture and its
  sent mail; after `onAnswer` replaces Len's entry with the server's, which has no `secret`, a row
  built by `buildCaptureRow` and filled by `applyCaptureSecrets` from a stubbed `/capture_secrets`
  answer `{ len: "4471" }` shows `4471`, and with the stub answering `{}` shows the mask); `state-sync.test.mjs` (no `se_captures` in a body, none seeded, a registered part makes
  `buildChanges` non-null); `add-capture-action.test.mjs`, `social-mail-bridge.test.mjs`,
  `social-captures.test.mjs` and `capture-log.test.mjs` updated to the new writer.
  `access-remote-signin.test.mjs`, `social-captures-view.test.mjs` and
  `social-report-footholds.test.mjs` seed `se_captures` and read the mirror; the builder checks each
  still passes with the mirror set as the bootstrap sets it.
- JS, the capture write in the same tick: in `social-mail-bridge.test.mjs`, with capture-client
  installed on a stub `stateSync`, a `performSend` that lands the payroll phish leaves the capture
  pending before it returns, and a `buildChanges()` called straight after carries the sent record,
  the page record and the capture together. `main.js` is checked to import capture-client.js
  statically and call `installCaptureClient` after `new StateSync`.
- Live proof: section 10.3, cases D, E and F.

## 7. R3: capture log seen rows, one key each

### 7.1 Today

`minigames/capture-log/capture-log-model.js` keeps `__capture_log_seen` (`SEEN_GLOBAL`, :10) as a
list of row keys (`capture:<targetId>`, `item:<itemId>`, `session:<pcId>:<footholdId>`). The minigame
appends the new keys and writes the whole list (capture-log-minigame.js:247 to :250), so the keyed
diff sends the whole list for each new row. It is display state only.

### 7.2 Change

- `capture-log-model.js`: `SEEN_PREFIX = '__capture_log_seen:'`. `readSeen(globals)` (:120) returns
  the union of the legacy list (read only) and every global named with the prefix whose value is
  `true`.
- `capture-log-minigame.js`: for each newly seen key,
  `writeGlobal(SEEN_PREFIX + key, true, { openChat: false })`. The legacy list is never written again.

### 7.3 Wire format and size

Before: the whole list (about 30 bytes per row) on each new row. After: one key of about 45 bytes per
new row, sent once. Bound: one key per row, so the declared capture targets, the PCs times the
footholds, and the filed items.

### 7.4 Compatibility and cheat policy

An old save keeps its list, which `readSeen` still reads, and R1's seed keeps it from being resent.
An old tab writes the list as before and both are read. Nothing here decides access.

### 7.5 Tests

`test/js/capture-log.test.mjs`: `readSeen` merges the list and the keys; opening the log writes one
key per new row and leaves the list untouched; an old save with only the list shows no new badge for
its rows.

## 8. How big the state grows and what each sync sends

| State | Where it lives | Bound | Sent up | Sent down |
|---|---|---|---|---|
| Keyed client sections (globals, ink variables, triggered events, visibility, hostility, mail) | `player_state`, client-synced | Unchanged caps (mail 1 MB, game.rb:3832) | Changed keys only, including the first sync after a load (a key the server stores differently from the client's export goes up once per load, 2.1) | Once per load, in the bootstrap |
| Phone threads | `player_state.phoneState` | Unchanged (512 KB) | Changed threads only, including the first sync after a load | Once per load |
| Saved cards | The cloner's inventory entry | One per cloneable card in the scenario, at most 50 and 64 KB, 4 KB each | One card per save, about 300 to 1 100 bytes | Once per load, in `playerInventory`; never in an answer |
| Inventory | `player_state.inventory` | Unchanged | Unchanged | Network answers carry touched items only (300 to 500 bytes); `/inventory` answers about 20 bytes |
| Capture record | `player_state.seCaptures`, server-owned | One entry per declared target or heard share, fixed by authoring; measured at about 8.4 KB sent (10 KB stored) for lab_physical_pentest's 19 writers, largest entry 894 bytes, every note whole; at most about 2.9 KB of ASCII per entry under the validator's authored string limits (6.4) | One pending entry per new capture, about 120 bytes (at most about 750), until answered (normally once) | That one entry in the sync's answer, up to about 900 bytes; the record once per load, in place of today's `se_captures` global |
| Seen rows | One global per row | One per capture log row | About 45 bytes per new row, once | Once per load |
| Capture secrets | Not stored; read from the scenario | One short secret per revealable credential | Nothing | `GET /capture_secrets` when a screen that shows secrets opens, as today; Len's PIN is one more entry of 4 characters |
| Saved room | `player_state.currentRoom` | One string | When it changes | Once per load (`savedCurrentRoom`) |

Nothing in this plan adds state that is resent while unchanged. The bootstrap still carries every
block once per load, which the rule allows.

## 9. Build order

Each step is committed on its own, with its tests run as the shared brief says (every changed test
file and every file importing a changed module; the orchestrator runs the full suites).

1. Groundwork (section 2): `stableJson` and the phone `keyOf`; the export clips (`cpWithin` and
   `cpSlice`, `clipMailMessage`, `clipMailThread`, `clipMailDrafts`, the phone export tests in
   `_phoneStateEntry`, the ink name tests in `exportNpcInkVariables`), the named constants in
   game.rb, the sanitiser fixture with its Rails and node tests and the constants test with its
   literal scan (2.1, 3.7); `registerPart` and `track()`, `item_for_answer`,
   `prepare_bootstrap_state!` (empty at first), `refuse_oversized_body`; and the two live-proof
   tools (10.3): `tools/playtest/sync-delta-proof.mjs`, which drives only the page and records
   requests, so it runs against any server, and the `--seed-full-cloner` head-start option of
   `tools/playtest/new-game.rb`, which case B and its baseline need.
   **Baseline**, straight after step 1 is committed: a second worktree checked out at the base
   commit runs its server on the builder's port. The games are created with the branch checkout's
   `new-game.rb` (step 1 changes nothing about how a game is created, and both servers use the
   shared development database, so the base server serves them), and the step 1 script, run from
   the branch checkout, records the base commit's requests and answers (10.3) and its bootstrap
   size (10.2). Nothing else in step 1 changes what the server sends, so the baseline is the base
   commit's.
2. R1 seeding, `savedCurrentRoom`, the held globals, with their node tests.
3. P2: the `/inventory` answers, then the network answers with the `delta` opt-in, then the client.
4. P1 as one unit: server card rules, `remove_saved_card!`, the repair in the bootstrap step, then
   in the same commit the client's card body, the single clone-source rule (`cloneFrom` in
   interactions.js and action-menu.js) and the removal of `persistSavedCards`. Removing `persistSavedCards` before the action menu records its
   copies would drop lab_physical_pentest's comms card on reload, so the two never land apart.
5. R3.
6. R2, in two parts that can ship apart:
   - **6a (ships first):** `capture_candidates`, `record_capture!` with part 1 (fields from the
     scenario) and part 4 (heard shares composed by the server: `shared_login_capture`,
     `record_shared_login!`, `record_shared_logins!`), the sync step with its scenario load on demand
     and the stale answer's capture fields, the old-tab interception, the migration in the bootstrap
     step, `captures_for_client` and the readers on the record, the heard login written by the
     server, `se_captures` added to `SERVER_OWNED_GLOBALS`, capture-client.js installed from main.js
     with its writers, the leak scanner. Under 6a every entry is revealable as soon as it is recorded
     (as today), so `record_capture!` stores `proven: true` on every entry it records, but the
     cross-target lookup is closed and no sync can write a field. 6a also has the writer pass in
     `capture_secrets_for_client` with `candidate_secret`, its account-holder guard on the owner
     and the payload owner, and the stored `writer`, the authored capture string limits in
     `CaptureModel` with their validator error, the
     `legacySecret` flag in the migration, the carry-over guard and its validator check, and the
     two-workaround note fix in `shared_login_capture`, because the record drops `secret` in 6a and
     Len's PIN must be served from the same step.
     The gap between 6a and 6b should be short: every entry recorded while 6a alone is live is
     stored `proven: true` for good, forged ones included. That is the right trade for honest
     players, and 6a reveals only what honest play reaches today, but it is the window in which a
     forged phish capture is grandfathered.
   - **6b:** parts 2 and 3 (`target_capture_proofs` keyed on the captured account,
     `page_evidence_kits`, `capture_evidence_holds?` with the request's own sent messages as
     `extra_sent`, `capture_revealable?`, `stampable_captures?` and the `proven` stamp in the sync
     and bootstrap steps, `flushKeep`), with the route walk of 6.7 rerun and recorded first.
     From 6b, `record_capture!` computes `proven` instead of storing `true`. Entries stored under 6a
     keep their `proven: true`, so no secret already served is withdrawn. If 6b slips, 6a stands on
     its own.
7. The node request-size cases (10.1) and the Rails answer-size test (10.2), then the live proof
   (10.3) after step 6, compared with the baseline taken after step 1.
8. One release later: remove the network routes' old answer, the `delta` flag,
   `syncInventoryFromServer` and `update_saved_cards`. This assumes `ASSETS_VERSION` was bumped with
   the release, so no tab still runs the old modules (4.4).

Tidy-ups in step 1: delete the unused `ApiClient.syncState` (api-client.js:220), which would send all
globals with no `clientTs`, and the unused `ApiClient.updateInventory` (:212).

## 10. Shared tests

### 10.1 Request sizes, in node

Request bodies are measured where the real client builds them, in the node tests of the body
builders, never in a Rails test that builds its own body:

| Builder | Case | Assertion |
|---|---|---|
| `StateSync#buildChanges` after `seedFromBootstrap` | Saved state equal to the page's, same room | `null` |
| `StateSync#buildChanges` after `seedFromBootstrap` | Different room | Under 1 000 bytes, the keys listed in 3.4 only |
| `NPCManager#exportPhoneState` after a jsonb-ordered restore | No thread changed | Empty |
| `savedCardForServer` and the `/clone_card` body | EM4100 card; fully cracked MIFARE Classic | Under 600 and under 1 500 bytes |
| capture-client's `captures` part | One credential capture | Under 300 bytes |
| capture-log seen writes | Three new rows | Three keys, under 60 bytes each |

Each assertion message prints the measured size. The same tests write the bodies they built to
`test/fixtures/files/sync_bodies/*.json` through an explicit `--write-fixtures` switch, and fail
when the committed fixture differs from what the builder now produces, so the Rails tests below post
exactly what the real client sends and cannot drift from it.

### 10.2 Answer sizes, in Rails

New `test/integration/sync_payload_size_test.rb`. It builds games from test_access_networks,
test-rfid, lab_social_engineering and lab_physical_pentest through `Game#generate_scenario_data`, posts the fixture bodies
from 10.1 through the real routes and asserts on `response.body.bytesize` only:

| Request | Assertion |
|---|---|
| `POST /inventory` add and remove, cloner with an old save's 50-card list held | Answer under 100 bytes; no `saved_cards` in it |
| `POST /network/plant`, `unplug`, `join`, `implant` with `delta`, the same cloner held | Each answer under 1 500 bytes; no `saved_cards` |
| `POST /clone_card` with the MIFARE fixture | Answer under 200 bytes |
| `PUT /sync_state` with the capture fixture, lab_social_engineering (the `lord` page credential) | Answer under 600 bytes |
| `PUT /sync_state` with a second capture fixture, lab_physical_pentest, for the writer with the longest note (`store_controller`, 693 characters) | The answer's entry carries the note whole; the answer is no larger than that entry's `captures_for_client` size, computed in the test from the scenario, plus 300 bytes, and under 1 200 bytes |
| `GET /scenario` with every record full | No larger than the base commit's measure plus 1 KB |

The 50-card list is the legacy case (an old save written by `update_saved_cards`): no real route can
fill a list past the scenario's cloneable cards. test_access_networks has no card copier at all, so
the test writes an `rfid_cloner` item holding 50 cards into the game's `player_state` inventory by
hand before the requests, as an old save would hold it. The base commit's bootstrap size is
measured once by the builder in the baseline run (section 9, after step 1) and written into the
test as a constant, with the commit it came from in a comment.

### 10.3 Live browser proof

New `tools/playtest/sync-delta-proof.mjs` (Playwright, headless, on the builder's own keyless server
port, `setFPS(20)` with fixed steps on). It records every request to `/break_escape/games/:id/*`:
method, path, request body bytes from `request.postDataBuffer()`, and response body bytes where the
page can still read them. The pagehide flush is a keepalive request sent while the page unloads, so
its answer is usually unreadable after the navigation: its result is read from `player_state`
afterwards (`tools/playtest/verify-run.rb`) and from the server log. The script writes a JSON file and
a Markdown table into the build log.

- **A. First sync after load** (lab_social_engineering, then m01_first_contact): play until mail,
  notes, phone threads and globals exist, reload twice, and list every `PUT /sync_state` in the 40 s
  after each load. Expected: none, or only `currentRoom` with its riders when the saved room differs,
  or keys the player changed after the load; never `phoneState` for an unchanged thread.
- **B. Network answers** (test_access_networks): test_access_networks has no card copier, and no
  route can fill a copier's list past the scenario's own cards (5.3), so the full cloner is put in
  the game when it is created, by a new head-start option of `tools/playtest/new-game.rb`:
  `--seed-full-cloner`. It adds an `rfid_cloner` item holding 50 made-up EM4100 cards (about 9.5 KB,
  under the 64 KB cap) to the new game's `player_state` inventory, the shape an old save written by
  `update_saved_cards` has. Its guards:
  - it acts only on the game the same run of the script has just created (the `g` it built and
    saved); it takes no game id, so it cannot be pointed at another game, and it aborts unless that
    game was created by this run (`g.id` is the id the script's own `save!` returned, and the row's
    `created_at` is from this run);
  - it aborts unless the scenario is test_access_networks, `Rails.env` is development or test,
    and the inventory holds no `rfid_cloner` yet;
  - the write runs inside `g.with_lock`, which takes the game's row lock and reloads the row, then
    rechecks the inventory, appends the item and saves once. The page is not open yet, but the lock
    makes that safe even if something else touched the row;
  - it prints the game id and the scenario it changed.
  It edits one row through the model, like the script's other head-start options; it never runs a
  `db:` task and never touches the schema. Then load the page, and plant, unplug, join and implant
  through the `window.__test` bridge; record each answer's size, check that none carries
  `saved_cards`, and check that the tray matches the server's inventory after each step. The
  baseline run creates its game with the same option, so the before figures show the whole list in
  every answer.
- **C. Cloner** (test-rfid, then lab_physical_pentest): in test-rfid, copy both cloneable cards
  (the guard's `master_keycard` through the chat clone and the world `ceo_keycard` from the action
  menu), then copy `master_keycard` again; three `POST /clone_card` requests with their sizes, no
  `update_saved_cards`, and two cards listed, because a repeat copy replaces in place (5.2). In
  lab_physical_pentest, copy the comms card in place from the action menu. Reload; the cards are
  listed; in test-rfid `master_keycard` opens `test_secure`, the one RFID-locked door
  (scenarios/test-rfid/scenario.json.erb:69 to :71), and `ceo_keycard` is listed (it opens nothing
  there); in lab_physical_pentest the copied comms card opens `store_room`, its RFID door
  (scenario.json.erb:2409), as long as its owner has not cancelled the card (`revoke_card`, :1728,
  which cancels every copy too).
- **Len's PIN window, for cases D, E and F.** The PIN is recorded only when the player clicks the
  ledger shelves while Len is keying it: the `player_watched_reader` mapping
  (lab_physical_pentest scenario.json.erb:906) needs `len_at_door` and `len_keying` true, and
  `kp_pin_surfed` and `courier_ready` not set. `len_keying` is true only between
  `npc_used_object:badge_reader` and `npc_used_object_done:badge_reader` for Len (:890, :891), a
  window of 2.5 seconds (`useMs: 2500`, :1467). The script stands the player at the shelves first,
  then polls `window.gameState.globalVariables` every 100 ms and clicks the shelves only once
  `len_at_door` and `len_keying` are both true, logging the time from `len_keying` turning true to
  the click. If the window closes before the click lands (`len_keyed` true and no `kp_pin_surfed`),
  it waits for Len's next round and tries again, up to three rounds, and logs each miss as a timing
  retry. A missing PIN counts as a failure only when the click landed inside the window and
  `kp_pin_surfed` is set, or after three missed rounds, which the build log reports separately
  from a capture bug.
- **D. Captures** (lab_social_engineering, then lab_physical_pentest): land the phish on the payroll
  page; the capture rides one sync with its sent mail and page record, the answer carries it, the
  capture log shows the secret; reload and it is the same. In lab_physical_pentest, take the QR route:
  the secret appears once the drop is recorded. Then watch Len at the records door keypad from the
  ledger shelves, timed as above: the Harvested Credentials tablet shows the PIN `4471` (served by
  `/capture_secrets`, which the request log shows), and shows it again after a reload. No
  `se_captures` in any sync body.
- **E. An old save.** On the base commit's server (a second worktree checked out at the base commit,
  on the builder's port), play lab_social_engineering to a capture, watch Len at the keypad in
  lab_physical_pentest (timed as above) so the tablet shows the PIN, copy a card in test-rfid from the
  action menu (unrecorded on the base commit), and open the capture log so a row is seen. Stop that
  server and start the branch's on the same port, against the same database (the shared development
  database; no `db:` task is ever run). Reload. Check: the capture log, the report and the secret look
  the same, and the tablet still shows Len's PIN; the cards are listed and open the doors they opened
  before; no badge comes back;
  `player_state` has `seCaptures` and no `globalVariables.se_captures`.
- **F. An old tab** (lab_physical_pentest). Open a tab on the base commit's server, then restart the
  server on the branch without reloading the tab (its import map keeps the old `?v=` modules). In
  that tab: land a capture (the QR route on `lord`), watch Len at the keypad, timed as above (the
  old tab's tablet shows the PIN from its own entry), copy Len's records badge through the chat clone
  (`#clone_keycard:cm_records_badge`, sent by the old tab's `/clone_card` as `{ npc_id }`), copy
  Melanie's comms card from the action menu, and plant a device on the comms cupboard port. Check:
  every `PUT /sync_state`, `POST /clone_card`, `POST /inventory` and `POST /network/plant` answers
  200; the tray matches the server's inventory; after a reload on the new client the capture is in
  the record, the tablet shows Len's PIN from `/capture_secrets`, and Len's badge is listed (put back
  by the bootstrap repair). The comms card is the
  expected exception: the old tab's action menu sends no source, so the copy is not recorded and is
  not listed after the reload (5.4). The check records that it is absent, and that copying it again
  on the new client lists it.

The same script runs against the base commit's server first, straight after step 1 (section 9), to
record the baseline, so the build log shows before and after for each request. The proof counts
only if the requests were captured from the real page; a helper test passing is not proof.

## 11. How to keep state deltas

For any new feature that keeps state for a player (Friendface reactions are next):

1. **Decide who owns it.** If the server uses it to reveal, admit or score anything, the server owns it:
   a record in `player_state` written only through its own gate, never a client global. Client globals
   are for state that decides nothing at the server.
2. **One key per thing.** Never keep a growing map or list in one global or one record field that is
   sent whole. Use one global per entity (`prefix:<id>`), or a server record written one entry per
   request.
3. **Bound it by authoring.** Say what caps the size (authored posts, declared targets, NPCs, a hard
   count) and what happens at the cap.
4. **Answers carry what changed.** A route answers with the entries it added, changed or removed, never
   a whole collection. Whole collections go down once, in the bootstrap.
5. **Make every delta safe to repeat.** Upsert by id or first wins; an `already` answer carries the same
   delta as the first success, so a retry after a lost answer ends in the same state.
6. **Take fields from the scenario.** The server rebuilds what it knows (names, addresses, owners,
   authored text) from its own scenario data, and takes from the client only what the client alone
   knows, picking among authored values where there is a choice.
7. **Write under the lock, read without writing.** Every new write runs under `with_game_lock` or
   `with_lock` and repeats its check after the reload; readers never save.
8. **Measure where the client builds it.** Request sizes are asserted in the node test of the body
   builder and in the live proof; Rails tests assert answers. Every plan and review states how big the
   state can grow and what each request sends.
9. **Check what the student sees, not only the route.** When a field leaves a client record, list
   every screen that shows it and every fallback it reads (a `displaySecret`-style "server answer,
   else the stored value"), and make the server serve what the fallback used to show.

Friendface reactions, under these rules: a server-owned `feedReactions { postId => { npcId => key } }`
beside `feedRevealed`; one key per authored reaction from a fixed set; the new reaction rides the answer
to the request that fired it (`{ postId, npcId, key }`, about 60 bytes); the bootstrap lists served
reactions once per load; nothing in a phone answer. A player reaction, if added, is
`POST /feed_react { postId, key }`, one stored key per served post, answered with that one reaction.

## 12. Open points

Defaults are chosen; the user can overrule any of them.

- **Transition length.** The network routes' old answer and `update_saved_cards` stay for one
  release, then go (section 9, step 8).
- **Cards that stop persisting.** A card with no `card_id`, or a copy with no server source, is kept
  for the session only (5.4). The builder lists any in the missions before building.
- **Cards copied from an old tab's action menu.** A card copied in place from a tab open across the
  deploy stays session-only for that tab (5.4); a reload and a fresh copy fix it.
- **The phish verdict on the server.** Moving the mail runner and the landing-page score to the server
  would turn part 2 from a sanity check into a hard rule. Not in this plan.
- **Writer secrets in the bootstrap.** Len's PIN still ships in the bootstrap inside Ruth's mapping,
  as it does today, because `withhold_npc_secrets!` strips mapping secrets only for an account
  holder. With the writer pass serving it, the bootstrap no longer needs it, and stripping every
  writer `secret` would close that early read. Default: not in this plan, because it changes what an
  old tab's next bootstrap holds and needs its own walk of the client readers; it is a small
  follow-up once 6a has shipped.
- **Phish footholds.** A foothold reveals nothing today, so a phish foothold needs no evidence. If a
  later feature makes a foothold reveal or admit something, it gets a part 2 check of its own (a sent
  mail to that target carrying an attachment kit).
