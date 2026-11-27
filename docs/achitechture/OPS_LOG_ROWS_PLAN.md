# Ops layer S9: log rows (A24)

Status: draft, 2026-11-19. Branch `docs/ops-layer-plan`. Stage S9 of
`docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md`. Feature id on landing: A24.

## 1. What this adds and why, in play

Things the player does leave a trace. When the player swipes a card at a door, signs in at a PC
(or fails to), locks a screen, plugs a device into a wall jack or joins a Wi-Fi network, the server
writes a log row. Later in the same mission the player can sit at the security office PC, open the
door controller log or the sign-in log, and read what the organisation recorded: the time, the
event, the identity the system believed it saw, the place and the result.

What it teaches:

- **Logs record identities, not people.** A cloned card or a borrowed password logs under the
  victim's name. The player sees their own break-in recorded as someone else.
- **Failed attempts are visible.** Three wrong passwords and a lockout leave three rows and a
  lockout row, which a defender would see.
- **Some actions leave no row.** Copying a card, or using a screen someone left unlocked, writes
  nothing, which is why those attacks are hard to spot.

Rows exist only where the scenario declares a log source. A scenario without one writes nothing
and plays exactly as before.

The parked defence debrief (`ACTORS_AND_DEFENCE_PLAN_OUTLINE.md`, S12d) and investigator missions
(`docs/IDEAS_BACKLOG.md:198`) will read the same rows; 13.6 says how "who really acted" is added
later. The other ops features write through the same helper (section 13), so one log mixes them.

## 2. What the code does today (verified)

**No server-side event log exists.** Grep for `accessLog`, `auditLog`, `eventLog`, `logRows` and
`badgeLog` across `app`, `lib`, `config`, the engine JS and `scripts/scenario-schema.json` finds
only log-filter's authored `audit_log` tab.

**log-filter** (`public/break_escape/js/minigames/log-filter/log-filter-minigame.js`, opened by
`log_filter_terminal`, `interactions.js:1585-1597`; used by `sis01_healthcare` and `sis02_energy`)
is wholly client-side and authored: rows from `minigameData.logEntries` (`:181`), columns fixed per
`logType` (`LOG_FIELDS` `:45-63`), filters fixed enums (`:65-80`), its filter matcher, TIME
filter, tint and selection written for those types (`:650-850`), one authored `anomaly` that is
tinted on screen (`:182`, css `:336-342`), cells by `textContent`, completion actions through
globals with no server check (`:1369`). No server call.

**siem** (`minigames/siem/siem-dashboard-minigame.js`) is a timed alert-triage game with hard-coded
alert sets and `localStorage` state, not a log of play.

**The server's places to write a row** (all verified in code):

| Event | Where in code | Branch |
|---|---|---|
| Sign-in success, password | `game.rb:3488-3499` in `attempt_login!` (`:3444`) | calls `start_login_session!` (`game.rb:4388`) then `save!` (`:3497`) |
| Sign-in success, credential | `credential_login.rb:76-80` in `attempt_credential_login!` (`:22`) | calls `start_login_session!` then `save!` |
| Sign-in by taking over an open screen | `claim_login_session!` (`game.rb:3527`) | calls `start_login_session!(..., 'claim')` |
| Sign-in failure, counted | `record_login_failure!` (`game.rb:4333`), reached from `game.rb:3502` | counts the failure |
| Lockout | `add_login_lockout!` (`game.rb:4366`), from `game.rb:4347` | adds the lockout key |
| Sign-out | `logout_session!` (`game.rb:3660`) | |
| Screen lock | `lock_session!` (`game.rb:3836`) | |
| Card at an rfid door or object | `GamesController#unlock` (`games_controller.rb:1211`), `validate_unlock` (`game.rb:4597`) | success after `:1255`; refusal at `:1228-1252` |
| Which card passed | `rfid_unlock_card_answer` (`game.rb:4070-4081`) | names only the player's own keycard; a copy answers `viaCopy` |
| Device into a jack | `plant_device!` (`network_access.rb:233`) | |
| Device out of a jack | `unplug_device!` (`network_access.rb:290`) | |
| Join a Wi-Fi network | `join_network!` (`network_access.rb:355`) | |
| Implant foothold | `implant_foothold!` (`network_access.rb:468`) | |
| Card copy | `GamesController#clone_card` (`games_controller.rb:1655`) | |

Every successful sign-in passes through `start_login_session!` with its `via` (`'password'`,
`'credential'`, `'claim'`), so the sign-in row goes there, once. `rfid_unlock_card_answer` never
names a copied card (`game.rb:4064-4069`); section 7 keeps that.

**Game time.** The client runs the game clock (`game-clock.js`, `GameClock` `:70`) and sends it in
`PUT /sync_state`; `merge_scenario_clock!` (`game.rb:5846-5899`) keeps `elapsedMs`, which only
grows and is clamped: a client-reported estimate. The server has no game clock; it already uses
wall time for its own records (`credentialClock`, `game.rb:3049-3051`).

**Server-only state.** The bootstrap copies named `player_state` keys only
(`games_controller.rb:400-401`), and withholds scenario blocks listed in
`NetworkAccess::WITHHELD_SCENARIO_KEYS` (`network_access.rb:18`). `ACCESS_STATE_DEFAULTS`
(`game.rb:3021-3059`) fills every game (`:7576`), so new keys stay out of it.

**Read-on-request with a change marker.** `GET /keyring` (`games_controller.rb:1862-1889`) answers
`{ rev, unchanged: true }` on a matching six-character MD5 rev, with `Cache-Control: no-store`.

**Schema.** `scripts/scenario-schema.json` has an open root; object `minigameData` is checked
against `scripts/minigame-data-schemas.json` by object type (`validate_scenario.rb:902-950`).

## 3. Build stages in order

Each stage ships alone, with its tests.

| Stage | What | Size |
|---|---|---|
| L1a | The helper, the event list and the caps, with no call sites; the `logSources` schema and validator; the clock stamp; the secret registry with the sources that exist today (passwords, credential values, PINs and lock codes, key material) and the guard. Unit tests over a fixture scenario and a `PUT /sync_state` controller test. The shared unchanged-scenario (golden) mechanism, its helper spec and its first captures, built first, from main before any engine edit (build step 1). Nothing is written in play yet | L |
| L1b | This plan's own badge, sign-in and session rows at their call sites (13.8). Creates `test_ops_logs` (a door, a sign-in PC, a `gameClock`, `logSources`, no reader). Controller tests on a re-read game and a scripted playtest checked with `verify-run.rb --ops-log` | M |
| L2a | `GET /log_rows`, the `ops-log` viewer and `ops_log_terminal` type (read only), its schema, sprite and lighting entries; the reader added to `test_ops_logs`; scripted playtest and live proof | M |
| L2b | Seed rows, `anomaly.rowId`, the flag flow and its actions; validator checks on seed rows; the dungeon graph note node. | S |
| L3 | Network rows and the share folder row (`share_folder_opened`); needs shares (slice 9.3a, built), not S1 | S |

L1a lands before every other ops stage, so siblings write and test rows from their first commit.
L1b lands with L1a, before S1, so it is in place before the stages that edit the sign-in methods
(S3, S5a, S5c, S8) and before L2a. The rest of the log stages (L2a, L2b, L3) land after S5c. Where a
sibling stage and L1b ever touch the same method in the same week, whichever lands second merges
into the other's edit. `signin_ok` sits after the second-step check of the mfa plan and after the
`via: 'technique'` skip of the core plan, so L1b is correct whichever order they land in.

## 4. Scenario fields

### 4.1 L1a: `logSources` (top level, server only)

A map of source id to a source. A source says which events it records and, optionally, where.

```json
"logSources": {
  "door_controller": {
    "title": "Door controller",
    "events": ["badge_swipe"],
    "where": { "rooms": ["lobby", "server_room"] }
  },
  "domain_signins": {
    "title": "Sign-in audit",
    "events": ["signin_*", "session_*"]
  }
}
```

| Field | Type | Rule |
|---|---|---|
| `title` | string, 1 to 40 chars, plain text | shown as the log's caption |
| `events` | array of event names, or a prefix with `_*` | each must be a registered event or match one (13.5) |
| `where.rooms` | array of room ids | optional; the row's place must be in one of these rooms |
| `where.objects` | array of object ids | optional; the row's place must be one of these |
| `where.places` | array of `"kind:id"` | optional; for places with no room (a host, network or share) |
| `showCardHolder` | boolean, default `false` | section 7: whether a badge row opened by a copied card names the card's holder |
| `maxRows` | integer 10 to 150, default 50 | this source's cap on stored play rows; the sum over all sources is at most 300. A stored snapshot is not re-validated when a game starts, so the helper also clamps, once, when it reads the block: each source to 10..150, then in declaration order each to at most 300 less the caps before it and 10 for each source after it. The validator refuses more than 30 sources |
| `seedRows` | array, at most 100 | L2b, section 4.2 |

With no `where`, the source takes its events anywhere (the validator warns when it also uses a
prefix wildcard). A row two sources take is stored in each, under each source's own cap.
`logSources` joins the withheld scenario keys, so the bootstrap never ships it.

### 4.2 L2a and L2b: the reader and seed rows

Seed rows are authored history, shown before the rows play writes. They let a mission plant an
earlier trail (the investigator idea) or give the log a lived-in look.

```json
"seedRows": [
  { "id": "s1", "at": "Mon 23:58", "event": "badge_swipe", "as": "maya_okafor",
    "where": { "kind": "door", "id": "lobby" }, "result": "ok" },
  { "id": "s2", "at": "07:12", "event": "signin_fail", "as": "j.price",
    "where": { "kind": "pc", "id": "reception_pc" }, "result": "fail" }
]
```

`as` is an NPC id or, for a `signin_*` row, a username of at most 32 plain characters. `at` is
`HH:MM` game time with an optional day (`Mon 23:58`), in the form `formatStamp` prints
(`game-clock.js:173-177`); seed rows must ascend and end at or before the mission's start time.
`id` is unique in the source and matches `^s[0-9]{1,3}$`. A seed row may carry `detail` under the
event's rules. A scenario with `logSources` must have a `gameClock`: without one, play times are
formatted from the browser's wall clock and change after a reload (`game-clock.js:79-80`,
`:157-160`), and seed times would be unrelated to them.

A reader is an object of the new type `ops_log_terminal`, placed in a room or inside a container
or PC desktop like other minigame objects:

```json
{ "id": "security_log_pc", "type": "ops_log_terminal", "name": "Security office PC",
  "minigameData": { "logSource": "door_controller", "anomaly": { "rowId": "s1" },
                    "flagActions": [{ "type": "set_global", "key": "found_night_swipe", "value": true }] } }
```

Its `minigameData` gets its own entry in `scripts/minigame-data-schemas.json` (required
`logSource`; optional `anomaly`, `flagActionLabel`, `flagActions`, `completionActions`),
loaded by the validator's minigame check (`scripts/validate_scenario.rb:902-950`); the
`log_filter_terminal` entry (`:63-87`) is unchanged, and the example above validates clean.
`anomaly.rowId` is optional and names a seed row, never a play row (whose id is not stable across
games). Without `anomaly`, the terminal is a plain log browser with no flag button.

### 4.3 L3

No new fields. Network events (`net_*`) and `share_folder_opened` (section 13.8) become valid in
`events`. A share is a place with no room, so a source takes its rows by `where.places`
(`"share:finance_share"`) or with no `where`.

## 5. Engine behaviour

### 5.1 Server

A new concern, `app/models/break_escape/ops_log.rb` (`BreakEscape::OpsLog`), included in `Game`.

**Writing.** `write_log_row!` works as section 13.2 sets out. It never saves; each call site
either already saves after the call or adds one save gated on `r&.stored?` (13.7, 13.8).

**The clock stamp** (13.4) is written in three places, none reading unloaded `scenario_data`:
`initialize_player_state` (`game.rb:7517`) seeds `opsLogClockAt` when the scenario has
`logSources`, and the key is the opt-in marker from then on; `merge_scenario_clock!`
(`game.rb:5846-5899`, sync only) refreshes it, gated on `player_state.key?('opsLogClockAt')`;
`prepare_bootstrap_state!` (`games_controller.rb:309`) resets a key ten seconds old or more and
answers true from `bootstrap_state_needs_write?`. A game started before L1a has no key; the first
helper write seeds it.

**L1b call sites** (rows and save rules in 13.8):

- `start_login_session!` (`game.rb:4388`): `signin_ok` when `via` is `password` or `credential`.
  Every other `via` writes nothing and does not raise: `claim` (using a screen someone left signed
  in is invisible to the log, which is the lesson) and S3's `technique`, whose `technique_used`
  row S3 writes. Both callers save (`game.rb:3497`, `credential_login.rb:76-80`).
- `record_login_failure!` (`game.rb:4333`): `signin_fail`, `as: { typed: }` from the key's
  username part (`key = "pcId|normalised"`, `game.rb:3481-3483`). The method saves.
- `add_login_lockout!` (`game.rb:4366`), after the early return at `:4368`: `signin_lockout`;
  `where` is the PC parsed from the key. Its caller saves.
- `attempt_login!` (`game.rb:3444`), two refusals that save nothing today:
  - `notPermitted` (`:3489-3492`, a right password at a PC that does not admit the account):
    `signin_refused` `denied`, with `save_limit: true`. The branch gains a `save!` when
    `r&.stored?`.
  - the locked-out return (`:3484`, before any account lookup): `signin_refused` `blocked`,
    `as: { typed: }`, with `save_limit: true`, saving when `r&.stored?`. Both results register a
    limit of 10 and keep separate counts (13.2 step 4), so each branch costs at most ten saves per
    PC in a window.
- `logout_session!` (`game.rb:3660`): `session_end`, only when the deleted record is a Hash, so a
  forged `/logout` writes nothing. `lock_session!` (`game.rb:3836`): `session_lock`, past its
  refusals. Both methods save.
- `GamesController#unlock` (`games_controller.rb:1211`), under the game lock, keyed on what the
  server resolved: the lock in force, the target, and the request's `method` only as
  `validate_unlock` accepted it against the lock type. Both rows below need `method: "rfid"`, a
  card presented. The other methods that reach an rfid lock write no badge row: `npc` (a door
  through `unlockDoor`, an object through `unlockable`) and `flag_reward` (an object). An open
  target (`:1223-1224`) or a lock not in force (`game.rb:4754-4755`) writes nothing.
  - Granted (rfid lock in force, not open, `validate_unlock` passed with `method: "rfid"`):
    `badge_swipe` `ok` inside the
    transaction (`:1280`), after the route-room refusal (`:1273-1276`), before `unlock_room!` or
    `unlock_object!` (and after the lock plan's second-step gate, once S8c lands), whose save persists it. `as` from server state: `rfid_unlock_card_answer`
    (`game.rb:4070-4081`) at an access-list lock, or a new `rfid_requires_card(lock)` from the loop
    of `rfid_lock_passes?` (`:3997-4004`) at a requires-only lock; a copy follows section 7.
  - Refused (`:1252`): only for a request with `method: "rfid"`, at an rfid lock in force, in
    reach (a door into a room connected to an unlocked room, or an object in an unlocked room
    outside an unpromoted route room), with an rfid card or clone held in server state (`held_rfid_cards`, `game.rb:3951`; `:4054-4061`).
    `badge_swipe` `denied`, no identity, `save_limit: true` (10 registered), saving when
    `r&.stored?`, and only when not `behind_closed_step?(path)`: once S8c lands, the lock plan (G1)
    edits this branch so the closed-step refusal returns before the row, and an object below a
    closed second step answers as an invented id with no row.

**L3 call sites:** `plant_device!` (`net_link_up`), `unplug_device!` (`net_link_down`),
`join_network!` on success (`net_wifi_join`); each saves after the call (`network_access.rb:282`,
`:316`, `:392`). `implant_foothold!` and `clone_card` write nothing.
`GamesController#container` (`games_controller.rb:626`), the admitted share branch (`:639-653`),
writes `share_folder_opened` after `session_admits?`, the sign-in-object refusal and
`path_unlocked?` pass: `as` from `session_admitting(scope)` (13.8), `where` from
`located[:scope][:id]`, `folder` the served folder's id. `once: true`; the route holds the game
lock (`:103`), reloads (`:630`) and gains one `save!`, only when `r&.stored?`.

**Reading.** `log_rows_for_client(source_id)` returns the source's seed rows then its play rows,
each built from the allow-list in section 7, plus a `rev`. `log_rows_for(source_id)` returns the
stored rows for server-side readers (the parked defence debrief, an investigator check). Its stable
comparison form, `log_rows_for(source_id, compare: true)`, gives each row as `[event, as, where,
result, detail, n]` in `seq` order with every time removed; S6's parity run across skins compares
that. Neither writes.

### 5.2 Client

**Which viewer.** A small separate viewer, `ops-log`, opened by a new object type
`ops_log_terminal`. It reuses log-filter's look (its CSS classes `lf-log-table`, `lf-log-row`,
`lf-session-detail`, the shared console window frame, `displayDashes`) and leaves
`log-filter-minigame.js` untouched: its filters, tint, detail panel and selection are fixed to
two authored types (section 2), and guarding each by type would touch most of a 1441-line file
two missions use. siem does not fit either.

The viewer, `public/break_escape/js/minigames/ops-log/ops-log-minigame.js` (about 350 lines):

- `static consoleWindow = true`, so the shared console frame draws the title bar and the X. The
  opener passes no `showCancel`; there is no Cancel button. The frame title is the object's `name`;
  the source `title` from the answer is the table's caption once rows arrive.
- Opens with one `LOADING` row, calls `ApiClient.logRows(objectId, { rev, signal })` (new, in
  `api-client.js` next to `keyring`, `:256-263`), then renders. Any refusal shows `NO ACCESS` and
  nothing else. Reopening sends the last `rev`; an unchanged answer keeps the rows. A `REFRESH`
  button fetches again.
- Columns: TIME, EVENT, IDENTITY, LOCATION, RESULT, DETAIL. A merged row shows its count after the
  result (`FAIL x3`), and a `+` when later calls were dropped (`DENIED x10+`). Play rows' TIME is
  `window.gameClock.formatStamp(elapsedMs)` (`game-clock.js:173-177`, "Tue 07:42"); seed rows show
  their `at`.
- Filters built from the rows on load: EVENT, RESULT and LOCATION as the values present, IDENTITY as
  text, and TIME as four six-hour ranges read from the row's hour, never from string positions.
- Selection keys on the row's `id`, so a refresh keeps it.
- Detail panel: the row's fields, by `textContent` only (no `displayDashes` on player text, so the
  table and panel read the same). The flag button appears only when the source has an `anomaly`.
  Flagging the anomaly row opens a confirm and then runs `flagActions` and `completionActions`
  through the same global-setting path log-filter uses (`_executeActions`, `:1369`); any other row
  gets "not this one" feedback. No row is ever tinted.
- Registered in `public/break_escape/js/minigames/index.js` as `ops-log`, with an
  `ops_log_terminal` branch in `interactions.js` next to the log-filter one (`:1585-1597`), copied
  without its `showCancel` lines.
- **Art and light.** The type maps to the existing `log_filter_terminal` texture
  (`public/break_escape/js/core/game.js:905`) and joins the screen-glow type list
  (`public/break_escape/js/systems/lighting.js:434`). No new art.

**Opening a reader from a container or desktop.** The container list marks the type as interactive
(`container-minigame.js:2326-2331`). A click goes through `handleInteractiveItem`, which arms the
return to the screen (`:2456-2468`) and hands `window.handleObjectInteraction` a stand-in sprite
whose `objectId` is a throwaway `temp_<time>` (`:2471-2477`). So the `ops_log_terminal` branch
takes the reader's id from `sprite.scenarioData.id`, never `sprite.objectId`. `sourceExtras()`
also carries the `foothold`, `from` or `relay` the container passed to `ApiClient.container`
(`api-client.js:240-250`) as `sourceRoute`, and the branch passes it to `ApiClient.logRows`, since
`GET /log_rows` judges the route as `/container` does (section 6). A JS test covers this path.

## 6. Server routes

One new route. The helper adds no route of its own; every write rides on an existing route.

**`GET /games/:id/log_rows?object_id=<id>&rev=<rev>[&foothold=<id>, &from=<id> or &relay=1]`** (L2a)

- On `set_game` (`games_controller.rb:27`) and authorised like `keyring`. Not under
  `with_game_lock`: it reads only.
- Checks, in order:
  1. `object_id` is present and at most 64 characters, else 400 `{ success: false, reason: 'invalid_object' }`.
  2. The object exists, is an `ops_log_terminal` with an `id` and a `logSource` that is declared,
     else 404 `{ success: false, reason: 'not_found' }` (the route's closed list is `invalid_object` and `not_found`). The same answer for every one of these, so the route does
     not map the scenario.
  3. The player has reached it. `located = @game.login_scope_of(object_id)`
     (`game.rb:3176-3204`) gives the object, its room, its scope (nil, a sign-in PC, a profile or
     a resource) and the chain of containers above it.
     - **Scoped readers, shared with `/container`.** The three scoped branches of
       `GamesController#container` (`games_controller.rb:638-669`) move into one private method,
       `container_reach_refusal(located)`, which returns nil or a symbol (`:not_found`,
       `:unreachable`, `:locked`), writes no rows (a pure check, so `/log_rows` never writes `admin_profile_read`; rows stay in `#container`) and lets each route render; `/container` renders exactly the
       404, 403 and 403-with-`reason` it renders today (section 10, check 6). A resource scope (a
       share): `session_admits?(scope)` (`game.rb:3260-3277`), then the sign-in-object refusal,
       then `path_unlocked?(path + [object])` (`game.rb:3310-3313`). A sign-in PC or profile
       scope: `session_admits?(scope)` and `path_unlocked?(path + [object])`, and under a sign-in
       PC also `folder_route_allowed?(scope id)`, which judges the route the request names.
     - **Readers with no scope: `/log_rows`'s own rule.** `/container` judges an unscoped object
       by `check_container_unlocked` (`games_controller.rb:671-679`), which asks whether that
       container is itself unlocked; a reader is not a container, so `/log_rows` uses
       `room_unlocked?(room_id)`, not `object_in_unpromoted_route_room?(object_id)`
       (`game.rb:323`), and `path_unlocked?(path + [object])`.
     The request carries the screen's route as `foothold` or `from`, as `/container` and
     `/keyring` do. Any refusal gives the same 404 as step 2, so the route does not tell a locked
     reader from an invented one.
- Answer: `{ rev, title, rows: [...] }`, or `{ rev, unchanged: true }` when `rev` matches. The rev
  is a six-character MD5 of the client rows, as `keyring_rev` digests its entries
  (`credential_keyring.rb:238-240`), so a change to a seed row or a title on a live game also
  changes it. `Cache-Control: no-store`.

There is no presence check beyond what `/container` makes. A reader gated by rooms and unlocked
objects stays readable from anywhere once reached (both sets only grow, and a row holds nothing
unearned, 13.3). A reader under a sign-in PC, in a profile or on a share is readable only while a
session admits it, over that session's route, foothold and `from` included.

## 7. What reaches the browser, and what never does

**Never:** the `logSources` block (withheld from the bootstrap), `player_state['opsLog']`,
`opsLogSeq`, `opsLogClockAt`, `opsLogOnce` and `opsLogSaves` (not on the bootstrap's named-key
list, never read from a sync body), a row's `seq`, `serverMs`, the server time in `last`, `p`
(shown only as the `+`), raw ids, any detail key registered
`show: false`, and any stored key added later (such as `by`, 13.6). No row carries a secret (13.3).

**Only through `GET /log_rows`, for a reached reader**, each row built from an allow-list of
exactly these keys:

| Field | Value |
|---|---|
| `id` | seed rows: their authored id (`s1`); play rows: the first ten hex characters of an HMAC of `[game id, source id, seq]` keyed with a purpose key, `Rails.application.key_generator.generate_key('ops_log_row_id')`, so the browser cannot recover `seq` or count rows in other sources, and ids within a reader do not collide in practice |
| `elapsedMs` or `at` | play rows: the game time estimate (13.4); seed rows: the authored `at` |
| `event` | the event's `label` (`BADGE`, `SIGN_IN`, `LOCKOUT`, ...) |
| `as` | an account's username or the typed username, both in the `normalise_username` form, a cut typed one with a trailing `~`; an NPC's or card's display name; or `-` |
| `where` | the display name of the place (room, object, PC, host, desk ...), or `-` |
| `result` | the result word, upper-cased, with `xN` when `n` is above 1 (`FAIL x3`), and a trailing `+` when the stored row has `p` (`BLOCKED+`, `DENIED x10+`: later calls were dropped, 13.2 step 6) |
| `detail` | the shown detail keys, each as value or display name, joined as `key: value` |

A test asserts the answer's row keys are exactly these seven, so a stored field added by another
plan is withheld unless this list is changed on purpose.

Rules that keep a row from telling the player something new:

- **A copied card** is named by its holder only when the request carried one card (or the source
  sets `showCardHolder`), the guarantee of `rfid_unlock_card_answer` (`game.rb:4064-4069`);
  question 1 in section 15.
- **A typed username** (a failed or blocked sign-in, a helpdesk request) never says whether it is
  an account. An account's username (`{ account: }`) and a typed one (`{ typed: }`) render in the
  same form, the output of `normalise_username` (`game.rb:2721-2723`, lower case), so `J.Price` as
  an account and `j.price` as typed text look identical.
- **A place** appears only because the server validated an action there (13.3), or because an
  author wrote a seed row. A forged swipe at an unreached door writes nothing (13.8). A place id
  whose kind has no display name, or that no longer resolves, shows as `-` (`OpsLog::KINDS`, 13.5),
  never as the raw id.
- **Player text.** The typed username is the only player text in a row: stored in its
  `normalise_username` form, cut and marked by the helper (13.1), and the viewer renders every cell by
  `textContent`.

**The reader's own fields reach the browser with its room or container**, as log-filter's do:
`minigameData.logSource` (a raw source id), `anomaly.rowId`, `flagActionLabel`,
`flagActions` and `completionActions`. The flag is checked on the client, best effort, the same
standing as log-filter's anomaly today; a server check belongs to the investigator work (4.2).

## 8. State and saved games

| Key | Shape | Size | Written by | Sent |
|---|---|---|---|---|
| `opsLog` | map of source id to an array of rows (13.1) | each row at most 400 bytes (`to_json.bytesize`); each source at most its `maxRows` (default 50, at most 150); all sources together at most 300 rows; the whole value at most 128 KB (`MAX_OPS_LOG_BYTES`). Typical: 10 to 15 KB for one full default source; the 300-row ceiling is at most 120 KB | `write_log_row!` only | never |
| `opsLogSeq` | integer | one number | `write_log_row!` only | never |
| `opsLogOnce` | array of 12-hex-character digests (13.2 step 4) | at most 256 entries, about 4 KB, oldest dropped past that | `write_log_row!`, when a `once: true` call stored | never |
| `opsLogSaves` | map of a 12-hex-character digest of event, `where` and `result` to `[count, windowStartMs]`, spent at the registered limit (13.2 steps 4 and 6) | at most 256 entries of 34 bytes, about 9 KB; an entry resets when its five-minute window has passed, and a new key on a full map reclaims passed entries | `write_log_row!`, when a `save_limit: true` call stored | never |
| `opsLogClockAt` | integer, server epoch ms | one number | `initialize_player_state` (seed), `merge_scenario_clock!` and `prepare_bootstrap_state!` (refresh, only while the key exists), or the first helper write in a game started before L1a | never |

- `opsLogClockAt` is created at game start for a scenario with `logSources`; `opsLog` and
  `opsLogSeq` on the first write, `opsLogOnce` and `opsLogSaves` on the first write that needs
  them. None is in `ACCESS_STATE_DEFAULTS` (`game.rb:3021`), so a game whose scenario has no `logSources` never gains any of them.
- None is on `reset_player_state!`'s preserved keys (`game.rb:120-122`, and `new_session` slices
  the same way, `games_controller.rb:269`), so a reset drops the log and re-runs
  `initialize_player_state`, which seeds the clock key again. `opsLogSeq` restarts at 1 and play
  row ids repeat across a reset; `rev` is a digest of the rows, so a stale rev cannot match.
- **Sizes and storage.** Byte caps are in 13.1 and 13.2 step 6. Rows live in `player_state`, at
  most 120 KB beside keys it already holds at 128 KB and 512 KB (`game.rb:6142`, `:6209`); every
  read goes through `log_rows_for`, so a later move to a table touches one file.
- **Nothing may gate on a play row**: `anomaly.rowId` names seed rows only (4.2), and a play row
  can be dropped by its own source's cap.
- Reload: nothing to restore on the client; the terminal fetches when it opens. A game started
  before L1a has no keys and starts logging at the first write, which also seeds the clock key.

## 9. Validator, schema and dungeon graph

**Schema** (`scripts/scenario-schema.json`): a closed `logSources` block (`additionalProperties:
false` on a source, on `where` and on a seed row), next to `credentials` and `networks`. `events`
items carry a name pattern only (`^[a-z][a-z0-9_]{1,39}(_\*)?$`), never an enum, so the plans that
add events do not all edit one shared list in a static file. The real check is the validator's:
it reads the event list from `lib/break_escape/ops_log_events.rb`, a plain Ruby file with no Rails
dependency that the concern also requires. `ops_log_terminal` joins the
object type enum. `scripts/minigame-data-schemas.json` gains the `ops_log_terminal` entry
(section 4.2); the `log_filter_terminal` entry is unchanged.

**Validator** (its checks live in their own file `scripts/validate_log_rows.rb`, hooked into
`scripts/validate_scenario.rb` by one line), errors:

- `logSources` in a scenario with no `gameClock` (section 4.2).
- A source id not matching `^[a-z][a-z0-9_]{0,39}$`; an empty `events`; an unknown event or
  prefix; a `where` room, object or place that does not exist; `maxRows` out of range, or the sum
  of all sources' `maxRows` above 300; `title` too long or holding control characters.
- In a scenario with `logSources` only: an id a row can store (a room, object, NPC, item, host,
  network, share, desk, foothold or access point id) longer than 40 characters or outside
  `[A-Za-z0-9_.:-]`, or an account username longer than 32 (13.1).
- A seed row with an unknown event, a result or detail the event does not allow, an `as` that is
  neither a known NPC id nor (for `signin_*` only) a username of at most 32 plain characters, a
  `where` that does not exist, a bad `at`, rows that do not ascend or end after the start time, a
  repeated `id`, or more than 100 rows.
- A seed row whose text equals any declared password or credential value (a secret written into a
  log by mistake).
- In a scenario with `logSources`: more than 30 sources.
- An `ops_log_terminal` with no `id`, no `logSource` or one naming an undeclared source; an
  `anomaly.rowId` that is not one of that source's seed rows. The minigame schema check reports
  missing and undeclared fields.
- `logType: "ops"` on a `log_filter_terminal` (the ops viewer is its own type), and
  `logSource` on an event-mapping minigame (`scenario-schema.json:5039-5047`), which has no object
  for the route to check.

Warnings: a source no reader names (rows written, never shown; fine for a defence-only source); a
source with a prefix wildcard and no `where`; a reader whose source records no event the scenario
can produce (for example `badge_swipe` with no rfid lock in its `where`). In a scenario with
`logSources` also: a declared secret equal to a username, an id or a code in `EVENTS` (a row naming that
thing shows text equal to the secret; the guard leaves that secret out of its comparison, 13.2
step 2); a source whose `maxRows` is below the
number of events it takes plus its limited places (protected rows may be evicted, 13.2 step 6);
more possible save-counter keys than 256, counted from `EVENTS`: for each event and each result
in its `save_limit` map, the places of its kinds that some source admits.

**Dungeon graph** (`scripts/generate_dungeon_graph.rb`): a log source is neither a lock nor a key,
so it adds no gating edge of its own. Each source becomes one note node (`add_node`, `:77`)
labelled with its title and events, with a dashed, undirected edge (`add_edge`, `:82`) to each
reader. A reader whose seed-row `anomaly` drives `flagActions` that set a global or complete a task
gets the same edges any other object with those actions gets, from the reader to what they unlock.

## 10. Effect on existing scenarios

No scenario in the repo has `logSources`, so:

- `write_log_row!` returns at its first line; no row, no `opsLog`, no `opsLogSeq`.
- No answer from an existing route gains a field, except that a card-less rfid request at an
  already open door or object now answers `alreadyOpen: true` (section 12, L1b item 2).
- sis01's and sis02's log-filter terminals (`vpn` and `ics_rdp`) run code this plan does not edit:
  `log-filter-minigame.js`, its CSS and its schema entry are untouched.
- Every save this plan adds (the `/unlock` refusal path, the two `attempt_login!` refusals, the
  share branch of `/container`, the bootstrap clock refresh) runs only when the helper stored a row
  or the clock key exists, and neither happens without `logSources`. A sync never gains a write:
  the clock line is gated on a key such a game never has.

**The check:**

1. A unit test calls `write_log_row!` once for every registered event on a game whose scenario has
   no `logSources` and asserts nil and a `player_state` identical before and after.
2. A test asserts that no scenario under `scenarios/` outside `test_ops_*` declares `logSources`.
3. The existing access model suites (`test/controllers/break_escape/access_model_*`) pass
   unchanged.
4. `git diff --stat main -- public/break_escape/js/minigames/log-filter/
   public/break_escape/css/log-filter-minigame.css public/break_escape/js/minigames/siem/` is
   empty at each stage, and the two log-filter JS tests
   (`test/js/log-filter-selected-row.test.mjs`, `test/js/log-filter-wording.test.mjs`) pass
   unchanged.
5. L2a edits files log-filter is opened through (`interactions.js:1585-1597`,
   `container-minigame.js:2326-2331` and `sourceExtras()`, `minigames/index.js`,
   `lighting.js:434`, `game.js:905`), so a JS test asserts that a `log_filter_terminal` in a room
   and in a container still opens `log-filter` with the same arguments, and that `sourceExtras()`
   adds `sourceRoute` only when a route was passed.
6. `/container` answers byte-identical bodies and statuses before and after the extraction of
   `container_reach_refusal` (section 6), over the access model suite's container cases.
7. The validator run over all scenarios reports no new errors or warnings (diff of its output
   before and after).
8. Fixtures: this plan adds `log_unlock_refusals.json` and `log_container_cases.json` to
   `test/fixtures/files/ops_unchanged/` (built in L1a, build step 1, before the engine edits), captured from main: the answers
   of `/unlock` and `/container` over the access model suite's cases. `bin/ops-golden-compare`,
   the one shared helper, compares them for checks 3 and 6.

## 11. Tests

**Golden helper, L1a** (`test/lib/ops_golden_compare_test.rb`, written with build step 1): an
identical run matches; a changed body, status or state value fails; an empty `ACCESS_STATE_DEFAULTS`
key absent from the fixture is stripped, a non-empty one fails; runs at different wall times match.

**Server unit, L1a** (`test/models/break_escape/ops_log_test.rb`):

- No `logSources`: nil, state untouched. `scenario_data` not loaded (a game fetched with
  `SYNC_STATE_COLUMNS` only): nil, no error.
- Source matching by exact name, by prefix, by `where.rooms`, `where.objects`, `where.places`; a
  placeless row lands only in a source naming it exactly; two sources, a row in each.
- Merging: an identical repeat raises `n` and the last times, and appends nothing; a repeat that
  differs in any of event, `as`, `where`, `result`, `detail` appends. A, B, A, B twenty times
  leaves two rows with `n: 10` each.
- **Save counter**, every case under `OpsLog.with_clock(t)` with `t` set by the test, on a
  test-only event registering `save_limit: { 'denied' => 10 }`. With `save_limit: true`: eleven
  distinct rows at one place sent in rotation for five rounds within one window answer `stored?`
  ten times in all, then nil with state untouched (`opsLogSaves`, `opsLog` and `updated_at`
  unchanged on a re-read). At `t + 300_000` the same call stores again and starts a new window;
  at `t + 299_999` it does not. The tenth call sets `p` on the rows it stored or merged into, in
  each of two sources; the reader shows `+` on them, and still does after the window resets and a
  later row is marked. An entry whose `windowStartMs` lies after the clock is treated as passed.
  Two results of one event at one place (`signin_refused` denied and blocked) keep separate
  counts. A second place keeps its own count. With `opsLogSaves` full and one entry past its
  window, a new key reclaims it and stores; with every entry inside its window, a new key answers
  nil and no entry is dropped. `save_limit: true` for a result with no registered limit, and with
  `once: true`, is malformed; the `EVENTS` spec fails a registered limit of 0 or 100.
- `once: true` writes nothing and answers nil when its digest is in `opsLogOnce`, even after the
  row has been evicted; the digest is added only when a source stored; the 257th distinct
  once-row drops the oldest digest; `once: true` with `as: { typed: }` is malformed. With no
  `logSources`, every call answers nil and the caller adds no save.
- Eviction and caps: a source past its `maxRows` evicts by the order in 13.2 step 6 and never
  touches another source. A first refusal that has merged to `n: 3`, then fifty distinct forged
  refusals and fifty `ok` rows, leaves that first refusal and the first `ok` row in place. A
  source holding a row with `p` whose latest time is inside the window keeps that row through a
  flood of fifty distinct refusals and fifty `ok` rows; once that time is five minutes old,
  classes 1 to 3 can take it. A source whose `maxRows` is below the
  number of its events never exceeds `maxRows`. The clamp holds for a snapshot with
  `maxRows: 500`, gives three sources of 150 the caps 150, 140 and 10, and ignores a thirty-first
  source. The largest legal row is at most 400 bytes; a 64-character typed username of four-byte
  characters and one of control characters are cut to fit 96 bytes and carry `cut: true`.
  `opsLogSeq` keeps counting.
- Malformed calls (unknown event, place kind, result, detail key, a detail value of the wrong
  type, a negative or non-integer count, an id over 40 characters, an account over 32, an `as` or
  `{ id: }` value that does not resolve) raise in test; with the production setting they return
  nil, store nothing and log one warning. A `count` of 1234 is stored as 9, in production too.
- **Secret registry and guard.** The fixture holds only the secrets L1a registers: an account
  password, an NPC password, a PIN, a code-lock `requires`, a credential value and a wifi key.
  `OpsLog.secret_values` on it holds each of them, nothing from a display-name, id or username
  field, and no `requires` of a key, biometric, bluetooth or rfid lock. A secret source
  registered in the test adds its values; a value passed to `OpsLog.note_issued_secret` is in the
  list for that request and gone in the next (model tests run outside the Rails executor, so the
  test calls `OpsLog::Current.reset` between the two). A second fixture, where one account's
  password equals its username, another's is `password` (a `method` code) and a PIN lock's answer
  equals a room id, writes `signin_ok` rows and a door row with no raise. The walk: for every registered event,
  siblings' included, a call is built with each detail key and each `as` form other than `typed`
  set to each secret, to the number form of the PIN, and to secret-shaped strings such as
  `Hunter2!` and `5f4dcc3b5aa765d6`. Run 1 with the guard switched off: every call is refused by
  the type rules or stores a row in which the matcher finds no secret; this run fails on a weak
  type rule alone, such as a bare integer or a `count` maximum of 99. Run 2 with the guard on:
  the same, and `assert_ops_log_holds_no_secret` (the matcher of 13.2 step 2 over every stored
  row) passes. The guard itself is proved by a test-only event with a `detail` kind
  `{ id: 'test_any' }` (its lookup resolves any string, so the type rule admits the value): a call
  that puts an issued value, then a registered hash, in that field raises `ArgumentError` whose
  message starts with `secret in`; the same call with a value equal to an authored username
  raises nothing. Only that test proves the guard fires, since a type refusal has a different
  message. A raised guard error's message contains the event and key path and none of the
  fixture's secrets, and so does the production warning line. A clean row whose `seq`, `n` or
  `serverMs` equals a numeric secret does not raise, and a harvest row with `count: 4` does not
  raise beside a one-digit secret. `typed` is exercised on its own: a typed username equal to the
  account password, and one equal to the PIN, is stored (normalised) and the row is written, in test
  and in production, with no raise; the response and the stored row differ from those for a
  non-secret candidate only in the text. The walk reads `EVENTS` at run time, so each sibling
  event is covered the moment it lands.
- `EVENTS` and `KINDS` spec: every entry well formed (13.5), with no numeric rule other than
  `{ count: max }` and `max` at most 9; every place kind used by an event has a `KINDS` entry; an
  `object` place resolves for a container and for a file inside one; an id that does not resolve
  shows as `-`.
- Time: `elapsedMs` is the saved value plus the server time since `opsLogClockAt`, capped at five
  minutes; 0 when there is no clock.
- `log_rows_for_client` rows have exactly the seven keys of section 7; `show: false` detail keys
  are absent; ids are ten-character keyed digests, not `seq`; an account and a typed username render the same.
  `log_rows_for(..., compare: true)` has no times.

**Clock, L1a** (controller, through the real routes): a game with `logSources` has
`opsLogClockAt` from game start; after `PUT /sync_state` with a new `elapsedMs`, a re-read game
(`Game.find(id).player_state`) has the key moved to the sync's time; a row written 30 seconds later
is stamped within two seconds of `elapsedMs + 30000`. On a scenario without `logSources` the same
sync leaves no key and makes no extra query for `scenario_data`. This test fails on a design that
decides on the scenario inside `merge_scenario_clock!`, because the sync loads no `scenario_data`.
A `GET /scenario` refreshes the key in a game that has it, writes nothing when the key is under ten
seconds old, and writes nothing in a game that does not have it.

**Server, per call site, L1b and L3** (extend `test/controllers/break_escape/access_model_login_test.rb`,
`access_model_rfid_test.rb`, the session tests and the shares tests). Every assertion reads a
re-read game (`Game.find(id).player_state`), never the in-memory object, so a missing save fails:

- Each event writes exactly one row on its validated branch, and none on each other refusal.
- A call made with `save_limit: false` (a noisy refusal on a route that saves anyway) neither spends
  a limited count nor is stopped by it: with the count spent for that event, place and result, it
  still stores, and the entry is unchanged.
- `start_login_session!` with `via` `claim` or `technique` writes no `signin_ok` and does not raise.
- A failed sign-in for a real account and for a made-up username write rows that differ only in
  the username.
- `signin_refused`: a right password at a PC that does not admit the account stores a `denied` row,
  and twelve such attempts in one window cause ten saves; attempts after a lockout with twelve
  distinct made-up usernames store at most ten `blocked` rows, each `{ typed: }`, and the rest
  cause no save (asserted by `updated_at` on a re-read); the denied count does not spend the
  blocked one.
- Badge rows: a forged `rfid` unlock at an already-open door, at a lock not in force, at a door
  with another lock type, at an unreached door, by a player holding no card, or naming a missing id
  writes nothing; a requires-only lock logs `ok` with the matched card's holder and logs a
  refusal; a granted swipe refused by the route-room check leaves no row; twenty refused swipes at
  one door in one window cause ten saves and leave one row shown `DENIED x10+`. A copy sent alone
  shows its holder; several cards sent at once show `-`; `showCardHolder` always shows the holder.
- `logout_session!` at a PC with no session writes nothing; a claimed session's sign-out writes
  `session_end`.
- `share_folder_opened`: opening a share folder writes one row for the folder, naming no file, and
  saves; opening it again as the same account writes nothing and does not save; another account
  opening it writes its own row; a refused open writes nothing. With two sessions that both admit
  the share, the row names the account of the one signed in first, on every open.
- `session_admits?(scope)` and `!session_admitting(scope).nil?` answer alike for every scope, held
  session and lock state the access model suite builds (run over that suite's cases), including
  the admin branch once the privilege plan has added it.
- A card copy and an implanted foothold write nothing.
- `usb_install_overridden` (lands with the privilege plan's S5a): an ordinary plant the PC's USB
  policy refuses writes one row under a keyboard admin session and one under a remote admin
  session; a session-shaped implant writes one row under a keyboard admin session at the grant's
  PC, and with only a remote or technique admin session it answers `needs_console` and writes no
  row; a plant refused with `usb_refused` writes no row. Each case reads a re-read game.
- In development, a call site forced to make a malformed call (a test-only stub of its detail)
  makes the route fail and leaves the game row unchanged on a re-read: no grant without its row.

**Controller** (`test/controllers/break_escape/log_rows_test.rb`, L2a): each refusal in section 6
with its status; the same 404 for missing, wrong type, undeclared source, unreached room, a reader
in a locked cabinet, a reader with its own lock not yet unlocked (no scope), a reader on a
desktop without a session, and a reader on a share without one; a reader under a sign-in PC
answers while its session is held and 404 after the session is locked or ended; a reader through
a foothold route answers with the route, and without one answers as `/container` does for a
folder (`folder_route_allowed?`, section 6); a room-gated reader answers from any
position, including rows written later; `rev` unchanged; `no-store`;
`assert_ops_log_holds_no_secret` over every response body. A reader inside a profile opened by an
admin account: `GET /log_rows` answers and the log has no `admin_profile_read` row, while
`GET /container` on the same profile writes one.

**Validator and schema:** one fixture per error and warning in section 9; every event in
`ops_log_events.rb` passes the schema's name pattern; the reader example in 4.2 validates clean.

**JS** (`test/js/ops-log-viewer.test.mjs`, with its own harness copy list): columns; filters from
the rows present, including TIME on `HH:MM` and `Tue 07:42` stamps; selection kept across a
refresh; flag button only with an anomaly; no row tinted; `LOADING`, `NO ACCESS`, `unchanged`;
`textContent` with a hostile typed username; merged rows show their count, and a `+` exactly as
the answer's `result` text carries it; a reader opened from a
desktop through `handleInteractiveItem` requests its own `scenarioData.id` with the screen's route.

**Feature scenario** `scenarios/test_ops_logs/` (with a `gameClock`), created in L1b with a lobby,
an rfid door with an access list into an office, a sign-in PC in the office, a card to copy from an
NPC, and a `logSources` block (door controller, sign-in audit); L2a adds a security room with a log
terminal over both sources, L2b seed rows and an anomaly, L3 a jack and a share with two files.

**Scripted playtests** (`scenarios/test_ops_logs/PLAYTEST.md`, through `window.__test`):

- L1b: wait for one real sync, then copy the NPC's card, swipe into the office, fail the sign-in
  twice, sign in, lock the screen. After the run, `bin/rails runner tools/playtest/verify-run.rb
  <game_id> --ops-log` (the server script the `test_access_*` playtests use,
  `scenarios/test_access_signin/PLAYTEST.md:30`; a size S section built in L1a, not a browser
  route) prints each source's rows and exits 1 if any stored row holds a registered secret by the
  matcher of 13.2 step 2. The playtest checks the events, the merged failure count, and that the
  sign-in row's time is within a few seconds of the on-screen clock.
- L2a onward adds: walk to the security room and open each log. Checks: the rows and their order;
  the copy row's identity per the default; the `/log_rows` answers carry exactly the seven row
  keys; `tools/playtest/access-leak-check.rb`, extended to cover `/log_rows` responses and
  skipping the IDENTITY cell of a typed row, reports no secret; a second open answers `unchanged`.
  The check also allows a share's name in the LOCATION cell of a `SHARE_OPEN` row, only for a share with an earlier successful `GET /container/<that share or an item in it>` in the same run, and drops only that owner (a `/network` listing does not earn it).

**Live proof:** the same run on the keyless dev server (port 3001), real path, screenshots of both
logs.

## 12. Build steps and shared files

**L1a: the helper, no call sites**

1. The shared unchanged-scenario mechanism, first: later steps edit `game.rb`, which changes what
   main answers. New files: `bin/ops-golden-compare`, the folder `test/fixtures/files/ops_unchanged/`
   and the rake task `ops:unchanged:capture` (`lib/tasks/ops_unchanged.rake`), run on main before the
   `game.rb` edits of steps 3 to 5; the same run captures this plan's fixtures (section 10, check 8).
   A fixture is JSON: a fixed script played through the real routes (bootstrap, room answers, the
   route answers a plan names, server state); test setup may seed the inventory directly, identically
   on main and branch. The helper compares answer bodies and statuses for equality and server state
   with two normalisations: it strips every `ACCESS_STATE_DEFAULTS` key that is empty in the live
   state and absent from the fixture (so new empty keys need no registration), and it freezes the
   clock (server times, token clocks). Other ops plans add fixtures beside these, no second mechanism.
2. `lib/break_escape/ops_log_events.rb`: `EVENTS` (empty; L1b, L3 and each
   sibling add their own), `KINDS` with this plan's kinds, the four detail rule types (13.5).
3. `app/models/break_escape/ops_log.rb`: `write_log_row!`, `OpsLog::Result`, the checks, the
   once-set and save counter, merging, eviction by class, the caps and the `maxRows` clamp
   (13.2); `log_rows_for` and its compare form. `game.rb`: include the concern.
4. The secret registry (`register_secret_source`, `note_issued_secret`, `OpsLog::Current`) with
   L1a's own sources, the one matcher, the guard and its switch, `OpsLog.with_clock`, and
   `assert_ops_log_holds_no_secret` (13.2 step 2).
5. The clock stamp in `game.rb`: the seed in `initialize_player_state` (`:7517`), the gated line
   in `merge_scenario_clock!` (`:5846-5899`), the writer in `prepare_bootstrap_state!` and
   `bootstrap_state_needs_write?`.
6. `network_access.rb:18`: add `logSources` to `WITHHELD_SCENARIO_KEYS`.
7. `scripts/scenario-schema.json` (`logSources`), `scripts/validate_log_rows.rb` (the checks of
   section 9, reading `ops_log_events.rb`) and the one hook line in `scripts/validate_scenario.rb`, `tools/playtest/verify-run.rb --ops-log`.
8. Tests (section 11): helper unit tests, the `EVENTS`/`KINDS` spec with the 400-byte ceiling
   check, the secret-guard walk, the clock controller test through `PUT /sync_state`.
**L1b: this plan's rows**

1. `ops_log_events.rb`: register the `badge_*`, `signin_*` and `session_*` events.
2. `game.rb`: the calls of 5.1 (each refusal with its `r&.stored?` save); the new reader
   `rfid_requires_card(lock)` beside `rfid_lock_passes?`. `games_controller.rb#unlock`:
   `already_open` for every rfid request, then the granted and refused badge rows. Test: an NPC
   `unlockDoor` (`method: "npc"`) on an rfid door opens it and writes no `badge_swipe`; the same
   door opened with a card writes one; a `flag_reward` open of an rfid object writes none. With a
   card held: a refused `npc` post and a `lockpick` post at an rfid door (refused by the
   lock-type check) write no `denied` row, and a refused `rfid` post writes one.
3. `scenarios/test_ops_logs/`: a door, a sign-in PC, a `gameClock`, a `logSources` block. Controller
   tests on a re-read game; the scripted playtest; `README_scenario_design.md` feature index and
   `docs/ACCESS_AND_NETWORKS.md` (A24, write side).

**L2a: the reader**

1. `ops_log.rb`: `log_rows_for_client`, the `rev` digest. `api-client.js`: `logRows`.
2. `games_controller.rb`: extract `container_reach_refusal(located)` from `#container` and call it
   from both routes; the `log_rows` action and its `set_game` entry; `config/routes.rb` next to
   `get 'keyring'` (`:60`).
3. New `public/break_escape/js/minigames/ops-log/ops-log-minigame.js`; register it in
   `minigames/index.js`; the `ops_log_terminal` branch in `interactions.js`; `sourceRoute` in
   `sourceExtras()` and the type in `container-minigame.js`; the texture at `game.js:905`; the
   lighting entry at `lighting.js:434`. Add the new module to the copy lists of
   `test/js/patch-panel.test.mjs` and `test/js/social-authenticator-wiring.test.mjs`, which copy
   `minigames/index.js`.
4. `scripts/minigame-data-schemas.json`: the `ops_log_terminal` entry.
5. The reader in `test_ops_logs`; JS tests, playtest, live proof; docs (A24, read side).

**L2b: seed rows and anomalies**

Seed rows and their validator checks; `anomaly.rowId` and the flag flow in the viewer; the graph
note node in `generate_dungeon_graph.rb`; a seeded anomaly in `test_ops_logs` and its playtest.

**L3: network and share rows**

1. `ops_log_events.rb`: `net_*` and `share_folder_opened`; `KINDS` entries for `jack`, `ap`, `share`.
2. `network_access.rb` calls (5.1); `games_controller.rb#container`: the `share_folder_opened`
   call, `once: true`, with its `r&.stored?` save; `Game#session_admitting(scope)`, with `session_admits?(scope)` rewritten as
   `!session_admitting(scope).nil?`.
3. `test_ops_logs`: a jack, an access point and a share with a folder; tests; docs.

**Files other plans also touch:**

| File | Also touched by | Where they meet |
|---|---|---|
| `lib/break_escape/ops_log_events.rb` | every plan that writes rows | each adds its own lines to `EVENTS` and `KINDS` in its own stage, one line per event |
| `game.rb` | S3, S5a, S5c, S8 | `attempt_login!` and `start_login_session!`; L1b lands with L1a, before S1 (section 3) |
| `games_controller.rb` | every plan's routes | the `set_game` and `with_game_lock` lists (`:27`, `:103`) conflict on every merge; `#container` (`:626`) is edited by the privilege plan (S5a), L3 and the lock plan; the refused-row branch of `#unlock` (`:1236-1252`) by L1b and G1 |
| `network_access.rb` | S1 to S3, S5a | `WITHHELD_SCENARIO_KEYS` (`:18`), the implant path (`:535`) |
| secret sources | S7, S8 | each registers its own secret fields beside its `EVENTS` lines |
| `config/routes.rb`, schemas, `validate_scenario.rb`, `generate_dungeon_graph.rb`, `minigames/index.js`, `interactions.js`, the two docs | most plans | append-only edits in each plan's own stage |

## 13. Log rows this feature writes

This plan owns the one helper every ops plan writes rows through, and the storage and reading of
those rows. Sections 13.1 to 13.6 are the shared contract; 13.7 maps every row the other plans
list onto it, with each row's save rule; 13.8 is this plan's own rows.

Every plan lists its rows in the brief's four columns, **Event, Who, Where, When**, and may add
**Result**, **Detail**, **Bound** and **Saved by** columns. "Who" is the identity the system
recorded (`as` below), and "When" names the method and branch that writes the row.

### 13.1 The helper

```ruby
# BreakEscape::OpsLog, included in Game (app/models/break_escape/ops_log.rb)
#
# Records one event in every declared log source that takes it. Never saves. Call it in the
# request that holds the game lock, on a branch the server has validated, before that request's
# own save!. A branch that would not otherwise save calls save! only when r&.stored?.
# Never raises in production.
def write_log_row!(event, as:, where:, result: 'ok', detail: nil, once: false, save_limit: false)
# => OpsLog::Result, or nil
```

| Argument | Type | Meaning |
|---|---|---|
| `event` | String | a `snake_case` name registered in `OpsLog::EVENTS` (13.5): `signin_ok`, `network_swept`, `mfa_prompt_sent` |
| `as` | Hash or nil | the identity the system recorded, in one of four forms (below), or nil. Required keyword, so a caller states nil on purpose |
| `where` | `{ kind:, id: }` or nil | the place, of a kind in 13.5. nil for an event with no place. Required keyword |
| `result` | String | one word from the event's registered list (13.5) |
| `detail` | Hash or nil | at most 4 keys, each registered on the event with a typed rule (13.5) |
| `once` | Boolean | write only the first time this game sees the same event, `as`, `where`, `result` and `detail`. Checked against a set of once-keys (13.2 step 4), never by scanning rows, so an evicted row is not written again. Malformed with `as: { typed: }`, so player text never feeds the set |
| `save_limit` | Boolean | for a branch with no save of its own: true applies the limit registered for this event and result in `EVENTS` (13.5), the most calls for this event, place and result (whatever `as` holds) that may store in one fixed five-minute window of server time (13.2 step 4). Past it, until the window ends, the call changes nothing and answers nil, so nothing is saved. Counted in a stored map, not by looking at rows, so neither merging nor eviction can reopen a spent limit. The number lives only in `EVENTS`, so two callers cannot use different limits for one key. Malformed when the result has no registered limit, or with `once: true`. false: the call neither spends nor is stopped by any count |

The four forms of `as`, each checked against the scenario (a value that does not resolve makes
the call malformed, 13.2 step 2):

| Form | Value | Rule |
|---|---|---|
| `{ account: }` | a username | must be an account the scenario declares; at most 32 characters |
| `{ npc: }` | an NPC id | must be an NPC in the scenario; a card or record tied to one person |
| `{ card: }` | an item id | must be an rfid card or clone item in the scenario; a card with no single holder |
| `{ typed: }` | text as the player entered it | the only free text a row may hold: put in the `normalise_username` form (`strip.downcase[0, 64]`, `game.rb:2721-2723`, the form the sign-in route keys on), stripped of control characters, cut to 32 characters, then by whole characters until its JSON form is at most 96 bytes, a cut value marked `cut: true` and shown with a trailing `~`. Stored for the player's own username input only, never for text the server holds. Stored in that normalised form whatever it equals, a registered secret included: the matcher never reads it (13.2 step 2) |

`OpsLog::Result` answers three questions about one call:

| Method | True when |
|---|---|
| `appended?` | at least one source gained a new row |
| `merged?` | at least one source raised an existing row's `n` |
| `stored?` | `appended? \|\| merged?`: the stored log changed, so a branch with no save of its own must save |

The helper returns nil when nothing could change: the scenario has no `logSources`,
`scenario_data` is not loaded, no source takes the event, the call is malformed, or `once: true`
found the row's key already in the once-key set, or the save limit is spent for the event, place
and result in the current window (or a new key finds `opsLogSaves` full of open windows). In a scenario with no `logSources` every call answers nil, so
a branch that saves only on `r&.stored?` adds no save there.

Stored row, in `player_state['opsLog'][source_id]`:

```json
{ "seq": 17, "event": "signin_ok", "as": { "account": "j_price" },
  "where": { "kind": "pc", "id": "reception_pc" }, "result": "ok",
  "detail": { "method": "password", "route": "keyboard" },
  "elapsedMs": 734000, "serverMs": 1763550000000 }
```

A row that absorbed repeats (13.2 step 5) also carries `"n": 4` and `"last": [elapsedMs,
serverMs]`, the times of the latest repeat, and a row that a call spending its save limit stored
or merged into carries `"p": 1` (13.2 step 6). Measured with `to_json.bytesize`, the row above is
207 bytes.

**The 400-byte cap, by calculation.** Each value has a fixed ceiling, and a value past it makes
the call malformed (13.2 step 2): an id 40 characters from `[A-Za-z0-9_.:-]`, an account 32, a
typed username 96 bytes plus `"cut":true`, an alias 4, a count 1 digit, `seq` 6 digits,
`elapsedMs` 9, `serverMs` 13, a code the longest in its list, and `"p":1` on an event with a
registered save limit. With `n` at 99999 and compact JSON, the largest rows are `technique_used`
at a host (388 bytes), blocked `helpdesk_request` (382 with `p`) and blocked `signin_refused`
(349 with `p`, 343 without). A spec builds the
ceiling-filled row for every registered event, siblings' included, and fails any registration
over 400 bytes, so the run-time check never fires.

### 13.2 What the helper does, in order

1. **Opt-in.** Returns nil when the scenario has no `logSources`. That is the whole cost for every
   existing scenario. Returns nil when `scenario_data` is not loaded
   (`has_attribute?(:scenario_data)`): `sync_state` loads only `SYNC_STATE_COLUMNS`
   (`games_controller.rb:2436-2442`), so a call from a sync merge writes nothing instead of
   raising `ActiveModel::MissingAttributeError`.
2. **Checks.** The call is checked against `OpsLog::EVENTS` and `OpsLog::KINDS` (13.5): the event
   is registered; `where.kind` is one the event allows (or nil where it allows none) and
   `where.id` resolves to a thing of that kind; `as` is one of the four forms of 13.1 and resolves;
   the result is in the event's list; each detail key is registered and each value fits its typed
   rule. A `count` above its maximum is clamped to the maximum; a negative or non-integer count
   is malformed (checked in production too). `save_limit: true` needs a limit registered for the
   result, and is malformed with `once: true`.

   **The secret registry.** `OpsLog.secret_values(game)` is the union of the registered secret
   sources. A feature registers its own with `OpsLog.register_secret_source(:name) { |game| [...] }`
   beside its `EVENTS` entries (13.5), a block that returns the secret values its scenario fields
   and stored state hold. L1a registers only the secrets the engine has today: account and NPC
   passwords (`creds.password`, an account's `password`) and credential values; lock answers,
   which are the `requires` of a `pin` or `password` lock, a `combination` lock's `combination`
   and a cryptex's `cryptexConfig.answer` (the fields `filter_requires_recursive` and
   `strip_lock_answers!` strip, `games_controller.rb:2902-2918`, `game.rb:4532-4537`); a wifi
   network's `psk`; and the capture `secret` fields (`CAPTURE_SECRET_KEYS`). The `requires` of a
   key lock names an item, and of a `biometric`, `bluetooth` or `rfid` lock a person, a device or
   cards (`CARD_REFERENCE_LOCK_TYPES`, `game.rb:7304`); none is registered. Each sibling registers
   its own fields in the stage that adds them (reset passwords in S8b; S5b registers nothing for hashes, since L1a's credential source already covers every keyring entry, `hash` entries included). S8 authors
   no seed, and recovery answers are not registered, since no row has a field for one. A derived value that is never stored,
   such as a second-step code or a matching number, is registered by the function that issues it
   with `OpsLog.note_issued_secret(value)`, held in `OpsLog::Current` (an
   `ActiveSupport::CurrentAttributes`, cleared at the end of the request). Across requests nothing
   remembers it, and the typed-detail rule (13.3, "No secret, by type") is the defence. The
   registry holds no display names, ids or usernames: whether a row may show a network's, share's
   or file's name is the "nothing unearned" rule (13.3).

   **The matcher**, one function used by the guard, the helper, `assert_ops_log_holds_no_secret`
   and `verify-run.rb --ops-log`: each value under `as`, `where` and `detail` that its type rule
   did not resolve is compared exactly with each secret, and each count with each numeric secret of
   10 or more (a one-digit secret is not compared, since every count is one digit). The secrets
   compared are `secret_values` minus the authored collisions, computed once at load: registered
   authored values that equal a declared username, a scenario id or a code in `EVENTS`. An
   author's password equal to a username or a code (a classic weak password) therefore never
   makes a validated scenario raise, while an issued code, a reset password or a hash a builder
   routes into any field is still caught: values passed to `OpsLog.note_issued_secret` are always
   compared, against every non-typed field, resolved or not. Counters and times (`seq`, `n`,
   `elapsedMs`, `serverMs`) are not compared. `as.typed` is never compared, by any of the four
   users of the matcher: it is the player's own text, echoed to the same player, so any branch on
   its value would tell them whether what they typed is a secret.

   **The guard** runs the matcher in test and development. A hit, or any failed check above,
   raises `ArgumentError` whose message names the event and the key path (`detail.route`) and
   never the value. The guard's message starts with a fixed prefix, `secret in`, which no type
   check uses, so a test can tell the two apart. The raise must reach `with_game_lock`, so the transaction rolls back the
   grant with the row; a call site inside a broad `rescue` re-raises `ArgumentError` first. In
   production the checks other than the guard still run: a mismatch writes
   nothing and logs one `Rails.logger.warn` line naming the event and key path, so a typo can
   never turn a game route into a 500. `tools/playtest/lib/access_leak_scanner.rb` keeps its own
   redaction list and reads `OpsLog.secret_values` only to scan `/log_rows` bodies, with its
   whole-token rule for short values.
3. **Sources.** Finds the sources that take the event. A source's `events` entry is an exact name
   or a prefix wildcard (`signin_*`, `mfa_*`). A row with no place lands only in a source that
   names the event exactly. A source's `where` filter admits the place by room or by id: a door's
   room is its id; a PC, object, desk, jack or access point's room is the one that holds it
   (`login_scope_of(id)[:room_id]`, `game.rb:3182`); `where.objects` admits a place whose id is
   listed; a host, network or share matches only `where.places` (4.1). None: nil.
4. **Once and the save counter.** With `once: true`, the helper takes a 12-hex-character digest
   of the event, `as`, `where`, `result` and `detail`; if `player_state['opsLogOnce']` holds it,
   the call answers nil. With `save_limit: true`, `k` is the limit `EVENTS` registers for the
   event and result; the helper takes a 12-hex-character digest of the event, `where` and
   `result` (never `as`), and looks it up in `player_state['opsLogSaves']`, whose entries are
   `[count, windowStartMs]`. An entry whose window has passed (`now - windowStartMs` of
   `SAVE_WINDOW_MS` or more) or whose start lies in the future (a server clock that stepped back)
   is reset to a count of 0. An entry with `count` at `k` or more is spent and answers nil. Both
   checks run before anything is built, and both maps are written only in step 6, once the call
   has stored.

   **The save window** is `OpsLog::SAVE_WINDOW_MS`, 300,000 ms of `serverMs`, fixed from the first
   store in it (not sliding), so a burst across a window's edge may store `2k` times in a few
   seconds. A place under a stream of refusals costs at most `k` extra saves per fixed window, and
   goes quiet only for minutes, so a later attempt is still recorded. Real time only bounds saves: no row, count or window gates a
   door, an objective, a reader or a score. The helper reads time through `OpsLog.clock` (also the
   source of `serverMs`); tests set it with `OpsLog.with_clock(ms) { ... }`.
5. **Merge.** Builds the row: the next `opsLogSeq` (assigned under the game lock, so order is
   exact), the game time estimate (13.4) and `serverMs`. For each source: if one of that
   source's 10 newest rows has the same event, `as`, `where`, `result` and `detail`, it adds 1 to
   that row's `n` (absent means 1, stops at 99999) and sets `last`, instead of appending, so
   refusals sent in turn (A, B, A, B) merge into their own rows. Merging bounds rows, not saves:
   eleven distinct rows sent in rotation never find their own row in the window and append each
   time, which is why a branch with no save of its own is bounded by `save_limit`, never by this
   step. An event registered `merge: false` skips the search and always appends.
6. **Append, evict, record.** Otherwise it appends the row. While that source holds more than its
   `maxRows`, it evicts one row from that source, taking the first class that has one. A
   **protected** row is the first row of its event in that source (per event, not per event and
   result), or a row with `p` whose latest server time (`last`, else `serverMs`) is from 0 to
   under `SAVE_WINDOW_MS` before now (the row that records "limit reached" in the open window;
   only a `save_limit: true` merge refreshes `last` for this purpose, so a noisy refusal merging
   into such a row does not extend it).
   Classes 1 to 3 never take a protected row:
   1. the oldest refusal row (result other than `ok` or `granted`) with `n` above 1;
   2. the oldest other refusal row;
   3. the oldest `ok` or `granted` row (a `signin_lockout`, result `ok`, sits here);
   4. the oldest first row;
   5. the oldest row of all.
   Each call appends at most one row per source and evicts one per excess row, so a source holds
   at most `maxRows` after it. Protected rows survive a flood whenever `maxRows` is at least the
   number of events the source takes plus its limited places (the validator warns otherwise). The
   sources' caps sum to at most 300 (4.1; the helper clamps once when it reads the block and
   ignores sources past the thirtieth), so the store never passes 300 rows or 120 KB; a
   whole-`opsLog` check at 128 KB stays as a guard that evicts from the source being appended to.
   Other sources are never touched. Seed rows (4.2) live in the scenario, so nothing evicts them.
   A row two sources take is stored in each, with one `seq`.

   When any source stored: with `once: true` the digest is added to `opsLogOnce` (at most 256,
   oldest dropped; a dropped digest lets that one row be written once more). With
   `save_limit: true`, the entry's count goes up by 1 and its window starts now if the count was
   0. When the count reaches `k`, the helper sets `"p": 1` on each row that call stored or merged
   into, in every source. The mark lives on the row, so it outlasts the entry's reset and needs
   no lookup: the reader shows `+` after the result or count of any row with `p` (`BLOCKED+`,
   `DENIED x10+`), meaning later calls of that event and result at that place were not recorded,
   whoever they named. It does not claim the dropped calls were that row's identity. A later
   merge into a marked row keeps the mark.

   **The `opsLogSaves` map** holds at most 256 entries. One entry,
   `"0123456789ab":[10,1763550000000],`, is 34 bytes, so the map is at most about 9 KB.
   A new key when the map is full first reclaims every entry whose window has passed; if none has,
   the call is dropped like a spent one. Keys come from validated places and registered results
   only, never from `as`, so a player cannot invent one. The validator warns when a scenario could
   make more than 256 keys (section 9), so a full map should never happen.
7. **Size.** A built row over 400 bytes is not written (the malformed-call rule of step 2); by the
   calculation in 13.1 no registered event can build one.
8. **No save.** Returns the Result (13.1). The caller's own `save!` persists the row in the same
   request and game lock as the action it records; a branch with no save of its own calls
   `save!` only when `r&.stored?`.

### 13.3 Rules for every plan that writes rows

- **Validated events only.** Call the helper only on a branch where the server has resolved the
  target from its own data and checked the action. A row never keys on a request parameter alone.
  A request that changes nothing (a door already open, a session already ended, a replay) writes
  nothing, or merges into an earlier row by step 5.
- **Bounded.** Each per-attempt event states its bound in its plan's table: once (`once: true`, or
  the caller's own state check), the registered save limit per window, merged repeats (step 5), or a cap the
  feature already enforces (a lockout's `maxAttempts`, an MFA request cap). Merging and eviction
  bound rows; `maxRows` is the last line of defence, not the bound.
- **Saves.** Each row in a table says what saves it. A route that already saves after the call
  needs nothing more. A branch that saves nothing today saves only when `r&.stored?`, and is
  bounded by `once:` (a key with no player text) or by `save_limit: true`, never by merging,
  which a rotation of distinct rows defeats (step 5). Only calls made with `save_limit: true`
  spend the registered count: a noisy refusal on a route that saves anyway passes false, so it
  neither spends the count nor is stopped by it.
- **Typed identities.** `as: { typed: }` is never written with `once:`. On a branch whose only
  save is the row's, it is written with `save_limit: true`, so made-up usernames cost at most that
  many saves per place and window and cannot churn the once-set. A result whose username the
  player typed records it as `typed` whether or not it is an account (every `helpdesk_request`
  result; `signin_refused` blocked); a result that follows a correct password records
  `{ account: }`.
- **Locks name no account.** A row for a step at a door or object (a second step on a lock, a
  badge swipe) never takes `as: { account: }`, since the player presented a PIN or card there.
  It takes `{ npc: }` only for a person the player has already been shown at that step (a
  keycard's holder, a second step's owner named on its screen), `{ card: }` for a card with no
  single holder, or nil.
- **No secret, by type.** A detail value is a registered code, an id that resolves to a known
  thing, a server-made alias, or, as the one numeric exception, a `count` clamped to its
  registered maximum (at most 9, in production too), too small to carry a PIN, a code or a
  two-digit matching number (13.5). No rule admits free text, so a password, hash, PIN, code,
  key, MFA number, security answer or file content has no field to land in. The only free text
  in a row is `as.typed`, and it is the one place a row may hold a secret: only one the player
  typed there, stored in its normalised form (real logs catch passwords typed into the username box). The guard of step 2 is a second, separate check in tests (section 11
  runs the walk with it off to prove the type rules alone).
- **Nothing unearned.** Ids and display names of findings, techniques, networks, shares, folders,
  services, hosts and accounts may be stored and shown, because the player reaches the row only by
  acting on that thing; they are not secrets for the guard. Each detail key says how it is shown
  (13.5): as its value, as the display name the player already sees for that id, or not at all
  (`show: false`, kept for server-side readers).
- **Not from a sync merge** (step 1).
- **Who acted is not a field.** Everything a row records today is done by the player, and the brief
  rules out an actor concept. `as` is what the system recorded, which may be someone else's
  identity (a copied card, a borrowed password): that difference is the lesson.

### 13.4 Time on a row

A row carries three times, each with one job:

| Field | Source | Used for |
|---|---|---|
| `seq` | server counter, under the game lock | **all ordering**, within and across sources |
| `serverMs` | server wall clock | any server-side interval (a lockout window, a run of MFA prompts "in a short time", a later detection rule). Never sent to the browser |
| `elapsedMs` | game time, estimated (below) | display only. No server check reads it |

The client owns the game clock and sends it in `PUT /sync_state`; on its own the clock syncs only
every five minutes (`CLOCK_ONLY_INTERVAL_MS`, `public/break_escape/js/state-sync.js:12`). The
server therefore keeps a server-only key, `opsLogClockAt`: the server time at which the saved
`elapsedMs` was last true. It is seeded at game start for a scenario with `logSources`, refreshed by
`merge_scenario_clock!` when it stores a new `elapsedMs` (only while the key exists, because that
method runs on a sync with no `scenario_data`), and refreshed when a page loads (5.1) unless set
less than ten seconds ago, so a reload loop is not a save loop. The helper stamps
`saved elapsedMs + (now - opsLogClockAt)`, capped at five minutes past the saved value. The client
clock runs on wall time (`game-clock.js:79-80`), so this matches the screen while the page is
open. A client can push `elapsedMs` forward (it only grows, clamped to seven days by
`MAX_SCENARIO_CLOCK_ELAPSED_MS`, `game.rb:5835`, applied at `:5853`) or reload before every action
to hold the stamp; time is display only, so nothing depends on it.

Plans whose features have no game clock (S1 to S3, S5) pass no time: the helper stamps every
row. S8's code and prompt expiry run on server wall time and stay its own; no expiry reads a row.
Seed rows (4.2) have no `seq`; they are always listed before play rows.

### 13.5 Registering an event

The event list lives in `lib/break_escape/ops_log_events.rb`, a plain Ruby file with no Rails
dependency, so the validator reads the same list the helper checks against. Each plan adds its
events there, one line per event, in the build stage that adds the action:

```ruby
EVENTS = {
  'signin_ok'       => { label: 'SIGN_IN',   places: %w[pc],      results: %w[ok], detail: { 'method' => %w[password credential], 'route' => %w[keyboard foothold from relay] } },
  'network_swept'   => { label: 'NET_SWEEP', places: %w[network], results: %w[ok], detail: { 'from' => { id: 'foothold' } }, save_limit: { 'ok' => 10 } },
  'credentials_harvested' => { label: 'HARVEST', places: %w[pc], results: %w[ok], detail: { 'count' => { count: 9 } } },
  'signin_refused'  => { label: 'SIGN_IN',   places: %w[pc],      results: %w[denied blocked], save_limit: { 'denied' => 10, 'blocked' => 10 } },
  'badge_swipe'     => { label: 'BADGE',     places: %w[door object], results: %w[ok denied], save_limit: { 'denied' => 10 } },
  # ...
}.freeze
```

- `places`: the `where.kind` values allowed; `[]` or absent means the event has no place.
- `results`: the closed list for this event, lowercase words of 2 to 16 letters. Shared words:
  `ok`, `fail`, `denied`, `granted`, `refused`, `blocked`, `expired`.
- `save_limit`: optional, a map of result to its limit, an Integer from 1 to 99 (the
  `signin_refused` line above). A call passing `save_limit: true` uses it; the validator counts
  possible keys from it (section 9).
- `detail` rules, four types and no other:

  | Rule | Admits | Shown as |
  |---|---|---|
  | Array of codes | one of the listed lowercase codes, at most 16 characters | the code |
  | `{ count: max }` | an Integer from 0 to `max`; `max` at most 9, and the `EVENTS` spec fails a larger one or any bare integer type. A value above `max` is clamped to `max`; a negative or non-integer value is a malformed call, in production as well | the number |
  | `{ id: kind }` | an id of at most 40 characters from `[A-Za-z0-9_.:-]` that resolves to a thing of that kind through `KINDS` | that thing's display name |
  | `{ alias: 'finding' }` | a server-made alias matching `^[a-z][0-9]{1,3}$` (`f3`) | the alias |

  Add `show: false` to keep a key for server-side readers only, for example
  `{ id: 'technique', show: false }`.
- `label`: the upper-case word shown in the EVENT column.

`OpsLog::KINDS` maps each kind of thing to two lookups, a display name and a room, each a lambda
over the game and an id:

| Kind | Used in | Filled by |
|---|---|---|
| `door` (id is the room), `object`, `pc`, `jack`, `ap` | `where`, detail | this plan, L1a and L3 |
| `account`, `npc`, `card` | `as`, detail | this plan, L1a |
| `share` | `where` | this plan, L3 |
| `network`, `host`, `service`, `technique` | `where`, detail | the core plan, in the stage that adds each |
| `foothold` | detail (`from`) | this plan, L1a: an id of at most 40 characters that resolves against the scenario's footholds (a network jack, an access point or an implanted PC); shown by that thing's display name |
| `profile` | detail | the privilege plan |
| `desk` | `where` | the MFA and helpdesk plan |

`door` and `object` take any lockable thing: `object` resolves every object id the scenario
declares, in a room or in a container at any depth (a file in a folder included), through
`login_scope_of`, and its room is the room that holds it. A later event for a step on any lock
registers `places: %w[door object]` with no change here. A `host` or `network` row matches a
source only through `where.places`; a `pc` is the sign-in PC object, so it has a room, and a host
the core plan also treats as a sign-in PC is logged as `pc`. A kind with no display-name lookup
yet, or an id that no longer resolves when the row is read, is shown as `-`.

A spec test walks `EVENTS` and `KINDS` and fails on a malformed entry, a place kind or `{ id: }`
kind with no `KINDS` entry, a numeric rule other than `{ count: max }` with `max` at most 9, a
`save_limit` naming a result the event lacks or a limit outside 1 to 99, or an event whose ceiling-filled row (13.1) passes 400 bytes, so a sibling plan's registration is
checked by this suite as soon as it lands.

### 13.6 Who really acted, later

The parked defence work (`ACTORS_AND_DEFENCE_PLAN_OUTLINE.md`, S12d) adds an optional stored key,
`by` (an NPC id), written only when someone other than the player acts. A row without `by` means
the player did it, so no migration is needed, and the browser row's allow-list (section 7)
withholds `by` from play.

### 13.7 Every row the other plans write, in this shape

Taken from each plan's own section 13. Detail values follow the typed rules of 13.5.

| Plan | Event | `as` | `where` | `result` | `detail` | Bound | Saved by |
|---|---|---|---|---|---|---|---|
| S1 | `network_swept` | nil | `network` | ok | `from` (`{ id: 'foothold' }`) | every sweep writes, a repeat included; merged repeats; a repeat is written with `save_limit: true`, 10 per network (registered for `ok`) | the first sweep: the route's own save. A repeat changes nothing else: `save!` only when `r&.stored?` |
| S1 | `host_scanned` | nil | `host`, `pc` | ok | `from` (`{ id: 'foothold' }`) | once per host (caller) | `POST /network/scan` |
| S2 | `service_checked` | nil | `host`, `pc` | ok | `service` (`{ id: 'service' }`, shown by name) | once per service (caller: written when the service is first added to `opsDiscovered.services`, whatever the check found) | `POST /network/check` |
| S2 | `finding_confirmed` | nil | `host`, `pc` | ok | `finding` (`{ alias: 'finding' }`), `status` (`confirmed`, `false`) | once per finding (caller) | `POST /network/confirm` |
| S3 | `technique_refused` | nil | `host`, `pc` | refused | `finding` (alias), `technique` (`{ id: 'technique' }`), `reason` (the closed list: `not_responding` and the eight 422 codes) | every refusal past the two 404s writes; merged repeats; every one written with `save_limit: true`, 10 per host (registered for `refused`) | a refusal changes nothing else: `save!` only when `r&.stored?` |
| S3 | `technique_used` | `{ account: }` for a session grant, nil for a credential grant | `host`, `pc` | ok | `finding`, `technique`, `grant` (`session`, `credential`), `access` (`user`, `admin`; session grants only) | every use writes: a grant, and each repeat (`already: true`) with `save_limit: true`, 10 per host (registered for `ok`); merged repeats | a new grant: the route's own save. A repeat changes nothing else: `save!` only when `r&.stored?` |
| S5a | `admin_profile_read` | `{ account: }` (the session's) | `pc` | ok | `profile` (`{ id: 'profile' }`) | `once: true`: one per PC, profile and account | `GET /container`, which saves nothing of its own: `save!` only when `r&.stored?` |
| S5a | `usb_install_overridden` | `{ account: }` (any admin session on the PC, at its keyboard or remote, except for a session-shaped implant, which only a keyboard admin session at the grant's PC overrides) | `pc` | ok | `device` (the closed list of `usbClass` values the schema allows) | merged repeats | the implant action and plant proof, which already save (`network_access.rb:535`) |
| S5b | `credentials_harvested` | `{ account: }` | `pc` | ok | `count` (`{ count: 9 }`: hashes added; a collect always yields hashes) | one per collect that adds a pair; a repeat adds none and writes nothing | the collect route, which saves when a pair is added |
| S8a | `mfa_challenge` | `{ account: }` | `pc` | ok | `route` (the shared route codes, below) | merged repeats | the save that stores the pending record |
| S8a | `mfa_code_ok` | `{ account: }` | `pc` | ok | none | one per sign-in | the save that writes the session |
| S8a | `mfa_code_wrong` | `{ account: }` | `pc` | fail | none | merged repeats; S8's three code caps | the save that stores the counts |
| S8a | `mfa_code_locked` | `{ account: }` | `pc` | locked | none | merged repeats; at most one per thirty wrong codes and five minutes | the save that stores `closedAt` |
| S8a | `mfa_prompt_sent` | `{ account: }` | `pc` | ok | none | merged repeats: a run of prompts is one row with a count; 20 per attempt | the save that stores the request count |
| S8a | `mfa_prompt_approved` | `{ account: }` | `pc` | ok | `approver` (`owner`, `held_phone`, `own_phone`) | one per sign-in | the save that writes the session |
| S8a | `mfa_prompt_denied` | `{ account: }` | `pc` | denied | none | one per attempt | the save that drops the record |
| S8a | `mfa_expired` | `{ account: }` | `pc` | expired | none | one per attempt | the save that drops the record |
| S8b | `helpdesk_request` | `{ typed: }`, the username as asked (normalised), for every result and whether or not it is an account | `desk` | granted, refused, blocked | `what` (`password`, `mfa`) | granted, refused: merged repeats and the desk's `maxTries`. Blocked: `save_limit: true`, 10 per desk (registered for `blocked`), whatever username is typed | granted, refused: the save that stores the grant or the tries. Blocked changes nothing else: `save!` only when `r&.stored?` |
| S8b | `account_password_reset`, `account_mfa_reenrolled` | `{ account: }` | `desk` | ok | `agent` | once per account (caller: first grant) | the save that stores the grant |

- **S8c, a second step on any lock**, adds no events: the eight `mfa_*` events also register
  `places: %w[pc door object]`, and `mfa_challenge` gains a `method` detail from a closed code
  list. A row at a door or object follows "Locks name no account" (13.3): `as: { npc: ownerId }`
  (the id must resolve to a scenario NPC), shown by the NPC's display name, only when the lock's
  second-step screen names its owner to the player; otherwise nil. Never `{ account: }`, even
  when the owner has credentials. The largest such row is below the `technique_used` ceiling of
  13.1, and it reaches sources by the rule of 13.2 step 3.
- **A refused plant writes no row.** `usb_install_overridden` is written only when an admin
  session's override lets a plant through. A plant the server refuses (`usb_refused` from the
  inventory action, `needs_console` from the implant path) writes no row, so a remote or technique
  admin session that plugs a session-shaped implant into a PC leaves nothing in its log.
- A step up to admin is S3's `technique_used` with `access: admin`; no other row records it.
- A refused sign-in caused by an account's kind is this plan's `signin_refused` (13.8); the
  privilege plan registers its optional `kind` detail (`local`, `domain`) in S5c.
- **A sweep records `from`; a sign-in does not.** A network sensor sees where traffic came from,
  so a sweep or scan row names its foothold. A sign-in row reduces the route to one code shared
  with `mfa_challenge` (`keyboard`, `foothold`, `from`, `relay`) and never names the machine.
- **S6 (the command-line skin) and S7 (offline cracking) write no rows.** A skin adds no moves;
  cracking happens on the attacker's own machine. Obtaining a hash is logged where it happens:
  `credentials_harvested` or `share_folder_opened` (13.8).

### 13.8 This plan's rows

Sources match these by prefix: `badge_*`, `signin_*`, `session_*`, `net_*`, `share_*`.

| Event | Who (`as`) | Where | When | Result | Detail | Bound | Saved by |
|---|---|---|---|---|---|---|---|
| `badge_swipe` | holder's own keycard: `{ npc: holder }`; a copy: the holder when the request carried one card, none when several, always the holder with `showCardHolder` (question 1); a card with no single holder: `{ card: id }` | `door`, `object` | `#unlock`, rfid lock in force, target not open, `validate_unlock` passed with `method: "rfid"` (5.1; an `npc` or `flag_reward` open of an rfid lock writes none), and the lock's second step, if any, has passed (at a gated lock the row is written after the second-step gate, by the final post only; the first right card writes `mfa_challenge`, not this row) | ok | none | one per unlock | the unlock's save |
| `badge_swipe` | none | `door`, `object` | `#unlock` refusal of a `method: "rfid"` request: rfid lock in force, target in reach, an rfid card held (5.1); a refused `npc` post or a lockpick at an rfid door writes none | denied | none | merged repeats; `save_limit: true`, 10 per door | `save!` only when `r&.stored?` |
| `signin_ok` | `{ account: }` | `pc` | `start_login_session!`, `via` `password` or `credential` | ok | `method` (`password`, `credential`), `route` (shared codes, 13.7) | one per sign-in | both callers |
| `signin_fail` | `{ typed: }` | `pc` | `record_login_failure!` | fail | none | merged repeats; `maxAttempts` | the method's save |
| `signin_lockout` | `{ typed: }` | `pc` | `add_login_lockout!` | ok | none | one per lockout | `record_login_failure!` |
| `signin_refused` | `{ account: }` | `pc` | `attempt_login!` `notPermitted` | denied | `kind` (`local`, `domain`; S5c) | merged repeats; `save_limit: true`, 10 per PC (result `denied`) | `save!` only when `r&.stored?` |
| `signin_refused` | `{ typed: }` | `pc` | `attempt_login!` locked-out return | blocked | none | `save_limit: true`, 10 per PC (result `blocked`), whatever username is typed | `save!` only when `r&.stored?` |
| `session_end` | `{ account: }` | `pc` | `logout_session!`, explicit sign-out only | ok | none | one per session | the method's save |
| `session_lock` | `{ account: }` | `pc` | `lock_session!`, past its refusals | ok | none | merged repeats | the method's save |
| `net_link_up`, `net_link_down` | none | `jack` | `plant_device!`, `unplug_device!` (L3) | ok | none; registered `merge: false`, never merged, so a plant after an unplug is its own row | one per plant or unplug (link rows are not merged, so a long plant and unplug loop can evict older rows of the source, a once-only folder row among them) | the methods' saves |
| `net_wifi_join` | none (an access point logs a device) | `ap` | `join_network!` (L3) | ok | none | one per join | the method's save |
| `share_folder_opened` | `{ account: }` of the first admitting session in sign-in-list order; nil when only a foothold admits it | `share` | `#container`, admitted share branch (L3) | ok | `folder` (`{ id: 'object' }`; absent when the share itself is opened) | `once: true`: one per folder and account | `save!` only when `r&.stored?` |

Code lines and branch detail for each row are in 5.1.

**`share_folder_opened` records opening a folder, never a file** (question 3). A request for a
file, or for a folder with no id, writes no row. When several sessions admit a share, the row names
the account of the first admitting session in `signedInPcs` order (token sessions, which are not in
that list, last), through `session_admitting(scope)`, which returns the admitting PC id (`:foothold`
when only a foothold admits, `:unscoped` for no scope). It is always an account the player holds a
live admitting session as; it may not be the oldest by time (sign in at A, at B, sign out at A, sign
in at A again: A ranks first). A `seq` on the session record would fix that and is deferred. The
once-set keeps the last 256 keys, so a scenario with over 200 shares plus share folders could pass
the once-only limit; the validator warns. `session_admits?(scope)` is
`!session_admitting(scope).nil?`, so the admin branch the privilege plan adds and the line the core
plan adds apply to both from one rule in one place.

Claimed sessions (`via: 'claim'`) write no sign-in row but do write `session_end` and
`session_lock`: an account signing out with no sign-in before it is the trace a careful defender
would notice.

Never in these rows: the password; which account a typed username belongs to (section 7); which
of several held copies passed, unless the source opts in; the foothold, relay or source PC id; a
network key; a device id; a file name or content.

No row for `claim_login_session!`, `clone_card` or `implant_foothold!` (section 2). A real system
records nothing for these, and the gap is the lesson.

## 14. What this plan relies on from other plans

Each entry names what this plan needs from another plan and the section of that plan that provides it.

1. **Every plan that writes rows** (each plan's section 13): list rows in the shape of 13.7, with
   Bound and Saved by columns, and register events and kinds in the stage that adds the action
   (13.5). A branch with no save of its own saves only when `r&.stored?` and is bounded by
   `once:` or `save_limit: true`, never by merging; the limit's number goes in that event's
   `EVENTS` entry, never at the call. Each plan that adds a secret field registers it with
   `OpsLog.register_secret_source` in that stage, and each function that issues a derived secret
   calls `OpsLog.note_issued_secret` (13.2 step 2). Each `test_ops_*` scenario that asserts rows
   declares `logSources` and a `gameClock` and calls `assert_ops_log_holds_no_secret`.
2. **Build order** (`OPS_CORE_PLAN.md` section 12, build steps): L1a and L1b land before every
   other ops stage, before S1; the rest of the log stages (L2a, L2b, L3) land after S5c. L1b is
   the stage that edits `attempt_login!`, `start_login_session!` and `#unlock`, so S3, S5a, S5c
   and S8a meet it already in place.
3. **`OPS_CORE_PLAN.md` section 13 (S1 to S3):** `technique_refused` registers
   `save_limit: { 'refused' => 10 }`, and `network_swept` and `technique_used` each register
   `save_limit: { 'ok' => 10 }`. Every refusal is written with `save_limit: true` (not `10`) and
   saves only on `r&.stored?`, with no quiet or noisy split; a repeat sweep and a repeat
   technique use are written the same way, while the first sweep and a new grant pass none and
   keep the route's save; a repeat of one of a source's 10 newest rows merges.
4. **`OPS_PRIVILEGE_ACCOUNTS_PLAN.md` section 13 (S5):** `admin_profile_read` is one per PC,
   profile and account; the harvest detail is `count` (`{ count: 9 }`, hashes added), a collect
   adding at most 8 pairs; S5b registers no secret source for hash values, because L1a's
   credential source covers every keyring entry, `hash` entries included.
5. **`OPS_MFA_HELPDESK_PLAN.md` section 13 (S8):** the rows, the `approver` key, the route codes,
   the secret sources (`creds.resetPassword` registered, no seed, recovery answers not
   registered) and the 10 to 99 matching number are as that plan writes them. Two details:
   - The helper's last argument is the switch `save_limit: false`. `helpdesk_request` registers
     `save_limit: { 'blocked' => 10 }`, and the blocked call is exactly
     `write_log_row!('helpdesk_request', as: { typed: username }, where: { kind: 'desk', id: desk_id }, result: 'blocked', detail: { 'what' => what }, save_limit: true)`,
     saving only when `r&.stored?`.
   - Its guard tests for a second-step code, a matching number and a reset password force a
     `detail` value to the issued value in a test-only event whose kind is `{ id: 'test_any' }`
     (its lookup resolves any string, so the value passes its type rule and reaches the matcher),
     and assert the error message starts with `secret in`, not a `typed` value: typed text is
     stored normalised and never reaches the matcher. The blocked and other `helpdesk_request`
     calls pass the `normalise_username` form (the route's own key).
6. **`OPS_LOCK_SECOND_STEP_PLAN.md` sections 5.1 and 13 (G1, G2):** at a gated rfid lock the
   `badge_swipe` ok row is written after the second-step gate (13.8). Its rows use `approver`
   (not `by`) and `as: { npc: }` only when the second-step screen shows the owner, nil
   otherwise, never `{ account: }`; the `method` detail on `mfa_challenge` is a closed list of
   codes, each at most 16 lowercase characters, listed in that plan. Its rows use the `door` and
   `object` place kinds (13.5) and follow 13.7; the `mfa_*` events it extends number eight.
7. **`OPS_CRACKING_PLAN.md` section 13 (S7):** writes no rows. L1a's credential source already
   covers every keyring entry, `hash` entries included, so S7 registers only a cracked value it
   stores outside the keyring, as a secret source.
8. **`OPS_REALISM_SKIN_PLAN.md` section 11 (S6):** its parity run compares
   `log_rows_for(source_id, compare: true)` across skins. `log_rows_for` and the key `by` (13.6)
   are otherwise reserved for the parked defence debrief and the investigator idea.
9. **`OPS_CORE_PLAN.md`, `OPS_PRIVILEGE_ACCOUNTS_PLAN.md`, `OPS_MFA_HELPDESK_PLAN.md` and
   `OPS_LOCK_SECOND_STEP_PLAN.md` (each plan's section 10):** record unchanged-scenario fixtures
   with L1a's mechanism (build step 1) from main before the stage's first engine edit.

## 15. Open questions for the user

1. **A copied card in the door log.** The server hides which held copy opened a door
   (`game.rb:4064-4069`).
   - (a) A copy shows no identity unless a source opts in with `showCardHolder: true`. The log
     then tells a copy from the real card, which no real door controller can do, and the lesson
     "a cloned card logs under the victim's name" appears only where an author opts in.
   - (b) Always show the card holder. Realistic, but when the player holds several copies the row
     tells them which one the access list admitted.
   - (c) Never show an identity on a badge row. Safe, and loses the lesson.
   - (d) Show the holder when the request carried one card only, `-` when it carried several. The
     row tells nothing the player did not choose to test.
   **Recommend (d):** it keeps the existing guarantee where it matters (several copies at once) and
   teaches the lesson by default; `showCardHolder` stays for a mission that wants (b). This plan
   is written to (d).
2. **Rows from NPCs and office life.** Staff badge swipes, sign-ins and workarounds happen in the
   browser's office-life systems, so the server cannot vouch for them.
   - (a) Leave them out until the defence work, which needs a server-side NPC model anyway.
   - (b) Add a client-reported NPC row route now, best effort, for atmosphere.
   **Recommend (a):** seed rows give a lived-in log for now, and investigator missions can author
   their insider's trail as seed rows. This plan is written to (a).
3. **What a share row records.** The reader opens a folder's files in the browser with no request
   of their own, so the server sees only the folder open.
   - (a) Record the folder open, as `share_folder_opened`, once per folder and account.
   - (b) Add a small per-file read request, so each opened file is logged by name: a change to
     the built share reader and one request per file, and the row then names a file.
   **Recommend (a):** it needs no change to the share reader, keeps file names out of rows, and
   a hash file on a share still leaves a trace (the folder that holds it). This plan is written
   to (a).
4. **Typed text before another player.** A typed username is stored in its normalised form, so a password
   typed into the username box sits in the row; the parked defence game would show it to another
   player. **Recommend accepting it:** passwords typed into a username box are a real thing a
   defender sees. This plan is written to accepting it.
