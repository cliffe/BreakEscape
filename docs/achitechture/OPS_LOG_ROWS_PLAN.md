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

Two parked pieces of work will read the same rows and must not be blocked: the defence game's
debrief (`ACTORS_AND_DEFENCE_PLAN_OUTLINE.md`, S12d: "show ... the log rows") and the backlog's
investigator missions (`docs/IDEAS_BACKLOG.md:198`: audit badge swipes, logins, unlocked sessions
and workarounds to find an insider). For them, each row stores who really acted (`actor`) as well
as the identity the system recorded (`as`); only `as` is ever shown in play, and authored seed rows
let a mission plant an insider's earlier trail.

## 2. What the code does today (verified)

**No server-side event log exists.** Grep for `accessLog`, `auditLog`, `eventLog`, `logRows` and
`badgeLog` across `app`, `lib`, `config`, the engine JS and `scripts/scenario-schema.json` finds
only log-filter's authored `audit_log` tab.

**log-filter** (`public/break_escape/js/minigames/log-filter/log-filter-minigame.js`) is wholly
client-side and authored:

- Opened by an object of type `log_filter_terminal` (`public/break_escape/js/systems/interactions.js:1585-1597`),
  reading `scenarioData.minigameData` (`log-filter-minigame.js:176-177`). Used today by
  `scenarios/sis01_healthcare` and `scenarios/sis02_energy`.
- Columns are fixed per `logType` in `LOG_FIELDS` (`:45-63`, only `vpn` and `ics_rdp`). Filters are
  fixed enums in `FILTER_CATEGORIES` (`:65-80`, for example country UK/RO/US/DE/FR).
- Rows come from `minigameData.logEntries` (`:181`) or a synthetic VPN builder (`:209-216`) with a
  fixed date (`:86-91`). It makes no server call.
- It is built round one authored `anomaly` to flag (`:182`, `_isAnomalyEntry` `:885-891`, matching
  account and IP). The anomaly row is tinted (`public/break_escape/css/log-filter-minigame.css:336-342`),
  which gives the answer away by sight.
- `stateOverrides` (`:194`, applied in `_resumeStateFromGlobals` `:245`) change rows from globals:
  the nearest existing hook for rows that change with play.
- Extra tabs (`additionalTabs`, `:189`) include an `audit_log` type (`:359`, `_renderAuditLogTab`
  `:1227-1304`) with fixed columns TIMESTAMP, OPERATOR, COMMAND, PARAMETER, RESULT
  (`:1247-1253`) over authored `auditEntries` (`:1264`). Cells use `textContent` throughout
  (`:1256`, `:1280`, `:1287`).
- The command preview (`_buildCommandPreview` `:539`) prints fake shell lines per `logType`.
- Completion fires scenario actions through globals (`_executeActions` `:1369`), with no server
  check.

**siem** (`public/break_escape/js/minigames/siem/siem-dashboard-minigame.js`) is a timed alert
triage game: a 180-second countdown (`:246`), alert sets hard-coded in the file (`ALERT_SETS` `:51`,
chosen by `params.alertConfig` `:253`), passive alerts injected by `Math.random()` (`:347`), state
in `localStorage` under `mg01_siem_state` (`:5`, `persistState` `:930`), and a Cancel button
(`showCancel`, `cancelText: 'Close Console'`, `:242-243`).

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

`start_login_session!` is the one writer every successful sign-in passes through, with its `via`
argument (`'password'`, `'credential'`, `'claim'`), so the sign-in row goes there, once.

`rfid_unlock_card_answer` deliberately never names a copied card, because the client sends every
held card at once and naming the one that passed would tell the player whose identity the access
list admits (`game.rb:4064-4069`). A badge row must keep that guarantee by default (section 7).

**Game time.** The client runs the game clock (`public/break_escape/js/systems/game-clock.js`,
`GameClock` `:70`, `formatClock(atElapsedMs)` `:180`) and sends it in `PUT /sync_state` as
`scenarioClock`. The server keeps it in `player_state['scenarioClock']` through
`merge_scenario_clock!` (`game.rb:5846-5899`): `elapsedMs` only ever grows and is clamped, so it is
a client-reported, monotone estimate. The server has no game clock of its own. Server wall time is
already used for its own records (`credentialClock`, `game.rb:3049-3051`).

**Server-only state.** The bootstrap copies named `player_state` keys only (for example
`games_controller.rb:400-401` for the clock), so a new key never reaches the browser unless it is
added there. Scenario blocks the bootstrap withholds are listed in
`NetworkAccess::WITHHELD_SCENARIO_KEYS` (`network_access.rb:18`). `ACCESS_STATE_DEFAULTS`
(`game.rb:3021-3059`) is filled on every game (`game.rb:7576`), so a key added there would appear
in every existing game's state. `MAX_NON_ACCOUNT_LOGIN_ENTRIES = 200` (`game.rb:3077`) is the
existing size cap pattern.

**Read-on-request with a change marker.** `GET /keyring` (`games_controller.rb:1862-1889`) answers
`{ rev, unchanged: true }` when the client's `rev` matches (`:1880-1885`), with
`Cache-Control: no-store` (`:1879`). The rev is a six-character MD5 digest
(`credential_keyring.rb:238-240`). The client call is `ApiClient.keyring(..., { rev })`
(`public/break_escape/js/api-client.js:256-263`).

**Schema.** The root of `scripts/scenario-schema.json` is open (no `additionalProperties`), with
blocks such as `credentials` (`:281`) and `networks` (`:317`). `log_filter_terminal` and its
`minigameData` have no schema entry and no validator checks today.

## 3. Build stages in order

Each stage ships alone, with its tests.

| Stage | What | Size |
|---|---|---|
| L1 | `logSources` block, schema and validator; the `OpsLog` concern with `write_log_row!`; rows for sign-in, failed sign-in, lockout, sign-out, screen lock and badge swipes. Rows are stored but nothing reads them yet. | S |
| L2 | `GET /log_rows`; log-filter `logType: "ops"` with columns and filters taken from the rows; authored seed rows; `anomaly.rowId`; `test_ops_logs`, scripted playtest and live proof. | M |
| L3 | Network rows (device in, device out, Wi-Fi join). Every other ops feature adds its own events in its own build stage, through the same helper, using the table in section 13. | S |

L1 before L2 so the write side and its secrecy rules are tested before anything is shown.

## 4. Scenario fields

### 4.1 L1: `logSources` (top level, server only)

A map of source id to a source. A source says which events it records and, optionally, where.

```json
"logSources": {
  "door_controller": {
    "title": "Door controller",
    "events": ["badge.swipe"],
    "where": { "rooms": ["lobby", "server_room"] }
  },
  "domain_signins": {
    "title": "Sign-in audit",
    "events": ["signin.*", "account.lockout", "session.*"]
  }
}
```

| Field | Type | Rule |
|---|---|---|
| `title` | string, 1 to 40 chars, plain text | shown as the log's title |
| `events` | array of event names, or a family with `.*` | each must be a known event (section 13.2) |
| `where.rooms` | array of room ids | optional; the row's place must be in one of these rooms |
| `where.objects` | array of object ids | optional; the row's place must be one of these |
| `showCardHolder` | boolean, default `false` | section 7: whether a badge row opened by a copied card names the card's holder |
| `maxRows` | integer 10 to 300, default 300 | cap on play rows served from this source |
| `seedRows` | array, at most 100 | L2, section 4.2 |

With no `where`, the source takes the event anywhere. A row is stored once even if several sources
take it.

`logSources` joins the withheld scenario keys, so the bootstrap never ships it.

### 4.2 L2: seed rows and the reader

Seed rows are authored history, shown before the rows play writes. They let a mission plant an
earlier trail (the investigator idea) or give the log a lived-in look.

```json
"seedRows": [
  { "id": "s1", "at": "07:58", "event": "badge.swipe", "as": "maya_okafor",
    "where": { "kind": "door", "id": "lobby" }, "result": "ok" },
  { "id": "s2", "at": "08:41", "event": "signin.fail", "as": "j.price",
    "where": { "kind": "pc", "id": "reception_pc" }, "result": "fail" }
]
```

`as` is an NPC id or, for a failed sign-in, a typed username. `at` is `HH:MM` game time. `id` is
unique in the source and matches `^s[0-9]{1,3}$`.

A reader is an existing `log_filter_terminal` object with the new `logType: "ops"` and a
`logSource`:

```json
{ "id": "security_log_pc", "type": "log_filter_terminal", "name": "Security office PC",
  "minigameData": { "logType": "ops", "logSource": "door_controller",
                    "anomaly": { "rowId": "s1" } } }
```

`anomaly.rowId` is optional and may name a seed row only (play rows have no fixed id at authoring
time). Without `anomaly`, the terminal is a plain log browser and the flag button is hidden. The
existing `flagActions`, `completionActions` and `additionalTabs` fields work as today.

### 4.3 L3

No new fields. Network events (`net.*`, section 14) become valid in `events`.

## 5. Engine behaviour

### 5.1 Server

A new concern, `app/models/break_escape/ops_log.rb` (`BreakEscape::OpsLog`), included in `Game`.

**Writing.** `write_log_row!` (signature in section 13.1):

1. Returns `nil` at once when the scenario has no `logSources`. This is the whole of the cost for
   existing scenarios.
2. Looks up the event in `OpsLog::EVENTS`. An unknown event, result or detail raises
   `ArgumentError`: these come from code, never from the player.
3. Finds the sources that take the event (exact name or family) and whose `where` admits the place.
   The place's room is the room id for a door, otherwise the room that holds the object (the same
   walk `find_scenario_object` makes). None: returns `nil`.
4. Builds the row (fields in section 13.1), cleans a typed username (strip control characters,
   collapse spaces, cut to 32 characters), takes `elapsedMs` from
   `player_state['scenarioClock']['elapsedMs']` (0 if absent) and the next `opsLogSeq`.
5. Appends it to `player_state['opsLog']`, dropping the oldest row while there are more than
   `MAX_OPS_LOG_ROWS = 300`.
6. Does not save. The caller's existing `save!` persists the row inside the same request and game
   lock as the action it records.

Each call goes in the model method, on the success branch or the counted-failure branch only.
Refusals that count nothing (unreachable PC, PC off, not permitted, wrong PC) write no row: a row
there would answer questions the refusal deliberately leaves open.

**L1 call sites:**

- `start_login_session!` (`game.rb:4388`): `signin.ok`, detail from `via` (`password`,
  `credential`) and route (`local`, `remote` when a foothold, `from` or relay is given). The
  `'claim'` via writes no row: using a screen someone left signed in is invisible to the log, which
  is the lesson.
- `record_login_failure!` (`game.rb:4333`): `signin.fail` with the typed username. The same row for
  an account and a non-account username, so the log never says whether a username exists (the
  sign-in reply is the generic `LOGIN_INCORRECT`, `game.rb:3079`).
- `add_login_lockout!` (`game.rb:4366`), after the early return at `:4368`: `account.lockout`.
- `logout_session!` (`game.rb:3660`): `session.end`. `lock_session!` (`game.rb:3836`):
  `session.lock`. Each as the session's account.
- `GamesController#unlock` for `method == 'rfid'`: on success, `badge.swipe` result `ok` after the
  unlock is applied and before the response is rendered, using `rfid_unlock_card_answer` to tell
  the player's own card from a copy; on the counted refusal at `:1252`, `badge.swipe` result
  `denied` with no identity. The controller calls the helper and then `@game.save!` only when a row
  was returned, so the unlock path's own saves are unchanged. An rfid lock with no access list logs
  the card's holder when it is the player's own keycard and treats anything else as a copy.

**L3 call sites:** `plant_device!` (`net.link_up`), `unplug_device!` (`net.link_down`),
`join_network!` on success (`net.wifi_join`, `as` none: an access point logs a device, not a
person). `implant_foothold!` and `clone_card` write nothing.

**Reading.** `log_rows_for_client(source_id)` returns the source's seed rows then its play rows
(newest `maxRows`), each mapped to the client shape (section 7), plus a `rev`.
`log_rows_for(source_id)` returns the full stored rows including `actor`, for server-side readers
only (the parked defence debrief and investigator check). Neither writes.

### 5.2 Client

**Which viewer.** The rows go into log-filter, as a new `logType`, for three reasons. Its job is
already "browse a log, filter it, perhaps flag one row", which is what reading these rows is. Its
audit tab (`:1247-1253`) already has nearly the generic row shape (time, who, what, where,
result). And its terminals, flag flow and completion actions are what investigator missions will
want. What has to change is that columns and filters are fixed per type and rows are authored, so
the ops type derives its filters from the rows and loads them from the server. siem does not fit:
it is a timed triage game with random alert injection, browser storage and a Cancel button
(section 2), and turning it into a log browser would rewrite it. A new viewer would duplicate
log-filter's table, filters and flag flow. The parked defence console may later raise siem alerts
from the same rows; nothing here prevents that.

- `ApiClient.logRows(objectId, { rev, signal })` in `public/break_escape/js/api-client.js`, next
  to `keyring` (`:256`).
- log-filter, `logType: "ops"`:
  - `LOG_FIELDS.ops`: TIMESTAMP, EVENT, IDENTITY, LOCATION, RESULT, DETAIL.
  - Filters built from the rows on load: EVENT, RESULT and LOCATION as enums of the values present,
    IDENTITY as text, and the existing TIME ranges. `FILTER_CATEGORIES` stays as is for `vpn` and
    `ics_rdp`.
  - In `start()`, when `logSource` is set, the table shows one `LOADING` row, fetches, then
    renders. A refusal shows `NO ACCESS` and nothing else. Reopening fetches with the last `rev`;
    an unchanged answer keeps the rows it has. A small `REFRESH` button in the header fetches again.
  - Play rows' TIMESTAMP is `window.gameClock.formatClock(elapsedMs)` (`game-clock.js:180`); seed
    rows show their `at`.
  - `_isAnomalyEntry` matches `anomaly.rowId` against the row's `id` when `rowId` is given;
    otherwise as today. Ops rows never get the anomaly tint, so the answer is not visible by sight.
  - The command preview is hidden for `ops` (the S6 skin may add one later).
  - All cells by `textContent`, as the table already does.
- No new JS module, so the test harness copy lists are unchanged.

## 6. Server routes

One new route. The helper adds no route of its own; every write rides on an existing route.

**`GET /games/:id/log_rows?object_id=<id>&rev=<rev>`** (L2)

- On `set_game` (`games_controller.rb:27`) and authorised like `keyring`. Not under
  `with_game_lock`: it reads only.
- Checks, in order:
  1. `object_id` is present and at most 64 characters, else 400 `{ error: 'Invalid object' }`.
  2. The object exists, is a `log_filter_terminal` with `minigameData.logType == "ops"` and a
     `logSource` that is declared, else 404 `{ error: 'Not found' }`. The same answer for every
     one of these, so the route does not map the scenario.
  3. The player has reached it: its room is unlocked (`room_unlocked?`, as at
     `games_controller.rb:1224`) or is the start room, and, when the object itself is locked,
     `object_unlocked?`. Otherwise the same 404 as step 2.
- Answer: `{ rev, title, rows: [...] }`, or `{ rev, unchanged: true }` when `rev` matches. The rev
  is a six-character MD5 of `[sourceId, last seq, row count]`, as `keyring_rev` does
  (`credential_keyring.rb:238-240`). `Cache-Control: no-store`.

Reading a log over a network session on a host (S1) is left to section 16.

## 7. What reaches the browser, and what never does

**Never:** the `logSources` block (withheld from the bootstrap), `player_state['opsLog']` and
`opsLogSeq` (not on the bootstrap's named-key list, never read from a sync body), a row's `actor`,
`seq`, server time, or `sources`. No row ever carries a password, a hash, a credential value, a
network id or name, a weakness or a finding.

**Only through `GET /log_rows`, for a reached reader object**, each row as:

| Field | Value |
|---|---|
| `id` | `s<n>` for a seed row, `r<seq>` for a play row (opaque, only for `anomaly.rowId` and the client's row identity) |
| `elapsedMs` or `at` | play rows: game time estimate; seed rows: authored `HH:MM` |
| `event` | display word from `OpsLog::EVENTS` (`BADGE`, `SIGN_IN`, `LOCKOUT`, ...) |
| `as` | the NPC's display name, the cleaned typed username, or `-` |
| `where` | the room's or object's display name |
| `result` | `OK`, `FAIL`, `DENIED` |
| `detail` | display word from the event's closed list, or `-` |

Rules that keep a row from telling the player something new:

- **A copied card.** By default a badge row opened by a copy shows `as: "-"` and no detail, the
  same guarantee as `rfid_unlock_card_answer` (`game.rb:4064-4069`). A source with
  `showCardHolder: true` names the holder: an author's choice for a mission where reading the door
  log is how the player learns whose card got in. Section 16 asks the user which default to use.
- **A failed sign-in** shows only the typed username, never whether it is an account.
- **A place** appears only because the player acted there, or because an author wrote a seed row.
- **Typed text** is the only player text in a row: cleaned on the server (section 5.1), rendered by
  `textContent`.

## 8. State and saved games

| Key | Shape | Size | Written by | Sent |
|---|---|---|---|---|
| `opsLog` | array of rows (section 13.1) | at most 300 rows, about 120 bytes each, so about 36 KB | `write_log_row!` only | never |
| `opsLogSeq` | integer | one number | `write_log_row!` only | never |

- Both keys are created on the first write, not in `ACCESS_STATE_DEFAULTS` (`game.rb:3021`), so a
  game whose scenario has no `logSources` never gains them.
- Neither is on `reset_player_state!`'s preserved keys, so a reset drops the log with the rest of
  the access state.
- The state does not grow without bound and is not re-sent: it is capped, never synced, and read
  only on request with `rev`, so an unchanged log costs one short answer.
- Reload: nothing to restore on the client. The terminal fetches when it opens.
- Old saves: a game started before L1 has no keys and starts logging at the first write.

## 9. Validator, schema and dungeon graph

**Schema** (`scripts/scenario-schema.json`): a closed `logSources` block (`additionalProperties:
false` on a source, on `where` and on a seed row), next to `credentials` and `networks`. `events`
items are an enum of the known event names and families, generated from `OpsLog::EVENTS` so the
two cannot drift (a test compares them). `log_filter_terminal`'s `minigameData` stays unschema'd
for the old types; the validator checks the ops fields.

**Validator** (`scripts/validate_scenario.rb`), errors:

- A source id not matching `^[a-z][a-z0-9_]{0,39}$`; an empty `events`; an unknown event or
  family; a `where` room or object that does not exist; `maxRows` out of range; `title` too long
  or holding control characters.
- A seed row with an unknown event, a result the event does not allow, an `as` that is neither a
  known NPC id nor (for `signin.fail` only) a username of at most 32 plain characters, a `where`
  that does not exist, a bad `at`, a repeated `id`, or more than 100 rows.
- A seed row whose text equals any declared password or credential value (a secret written into a
  log by mistake).
- A `log_filter_terminal` with `logType: "ops"` and no `logSource`, or one naming an undeclared
  source; an `anomaly.rowId` that is not one of that source's seed rows.

Warnings: a source no reader object names (rows written, never shown; fine for a defence-only
source, so a warning); a reader whose source records no event the scenario can produce (for
example `badge.swipe` with no rfid lock in its `where`).

**Dungeon graph** (`scripts/generate_dungeon_graph.rb`): a log source is neither a lock nor a key,
so it adds no gating edge. Each source becomes one note node (`add_node`, `:77`) labelled with its
title and events, with a dashed, undirected edge (`add_edge`, `:82`) to each reader object. A
reader whose `anomaly` drives `flagActions` keeps its existing edges.

## 10. Effect on existing scenarios

No scenario in the repo has `logSources`, so:

- `write_log_row!` returns at its first line; no row, no `opsLog`, no `opsLogSeq`.
- No answer from an existing route gains a field.
- sis01's and sis02's log-filter terminals use `vpn` and `ics_rdp`, whose columns, filters,
  synthetic log and anomaly tint are unchanged.

**The check:** a model test that, for every scenario under `scenarios/` without `logSources`,
creates a game, runs a successful and a failed password sign-in, a lockout, a sign-out, a screen
lock and an rfid unlock where the scenario has them, and asserts that `player_state` has neither
key and equals the state the same steps produce with the `OpsLog` include stubbed out. A JS test
renders a `vpn` and an `ics_rdp` terminal from the sis fixtures and compares the table and filter
DOM to a snapshot taken before L2. The validator run over all scenarios reports no new errors or
warnings.

## 11. Tests

**Server unit** (`test/models/break_escape/ops_log_test.rb`):

- No `logSources`: nil, state untouched.
- Source matching by event, by family, by `where.rooms`, by `where.objects`; two sources, one row.
- Cap: the 301st row drops the oldest; `opsLogSeq` keeps counting.
- Typed username cleaning (control characters, length, spaces).
- Unknown event, result or detail raises.
- `actor` stored; `log_rows_for_client` never includes `actor`, `seq`, `sources` or server time.
- `elapsedMs` taken from the saved clock; 0 when there is none.

**Server, per call site** (extend the existing access model tests, for example
`test/controllers/break_escape/access_model_login_test.rb`, `access_model_rfid_test.rb`):

- Each L1 and L3 event writes exactly one row on its success or counted branch, and none on each
  uncounted refusal.
- A failed sign-in for a real account and for a made-up username write rows that differ only in
  the typed text.
- A claim writes no row. A card copy writes no row.
- A badge swipe with a copy: `as` is `-` by default, the holder's name with `showCardHolder`.

**Controller** (`test/controllers/break_escape/log_rows_test.rb`): each refusal in section 6 with
its status, the same 404 for missing, wrong type, undeclared source and unreached; `rev` unchanged;
`no-store`; no response body contains a password, credential value or network id from the
fixture.

**Validator and schema:** one fixture per error and warning in section 9; the schema enum matches
`OpsLog::EVENTS`.

**JS** (log-filter tests): ops columns; filters built from the rows present; `rowId` anomaly; no
tint on ops rows; `LOADING`, `NO ACCESS`, `unchanged` handling; `textContent` with a hostile typed
username; command preview hidden.

**Feature scenario** `scenarios/test_ops_logs/`: a lobby with an rfid door into an office, a PC in
the office with a password, a security room with a log terminal over two sources (door
controller with seed rows, sign-in audit), a card to copy from an NPC, and, from L3, a jack.

**Scripted playtest** (`scenarios/test_ops_logs/PLAYTEST.md`, through `window.__test`): copy the
NPC's card, swipe into the office, fail the sign-in twice, sign in, lock the screen, walk to the
security room, open each log. Checks: the rows and their order; the copy row's identity per the
default; the `/log_rows` answers carry no `actor` field and no secret (checked on the network
responses the page received); a second open answers `unchanged`; and the server's
`player_state['opsLog']` holds the expected events with `actor: "player"` (read through the same
server-state check the `test_access_*` playtests use).

**Live proof:** the same run on the keyless dev server (port 3001), real path, screenshots of both
logs.

## 12. Build steps and shared files

**L1**

1. `app/models/break_escape/ops_log.rb`: `EVENTS`, `MAX_OPS_LOG_ROWS`, `write_log_row!`.
2. `game.rb`: include the concern; calls in `start_login_session!`, `record_login_failure!`,
   `add_login_lockout!`, `logout_session!`, `lock_session!`.
3. `games_controller.rb#unlock`: the badge rows.
4. `network_access.rb:18`: add `logSources` to `WITHHELD_SCENARIO_KEYS`.
5. Schema, validator, graph; tests; `README_scenario_design.md` feature index and
   `docs/ACCESS_AND_NETWORKS.md` (A24, write side).

**L2**

1. `ops_log.rb`: `log_rows_for_client`, `log_rows_for`, rev.
2. `config/routes.rb` (next to `get 'keyring'`, `:60`), `games_controller.rb`: the route and its
   `set_game` entry.
3. `api-client.js`: `logRows`.
4. `log-filter-minigame.js` and `log-filter-minigame.css`: the ops type.
5. `test_ops_logs`, playtest, live proof; docs (A24, read side).

**L3:** `network_access.rb` calls; extend `test_ops_logs` with a jack; docs.

**Files other plans also touch:** `game.rb` (S5a, S5c, S8 change sign-in), `games_controller.rb`
(every plan's routes; the `set_game` and `with_game_lock` lists at `:27` and `:103` conflict on
every merge), `config/routes.rb`, `network_access.rb` (S1 to S3), `scenario-schema.json`,
`validate_scenario.rb`, `generate_dungeon_graph.rb`, `README_scenario_design.md`,
`docs/ACCESS_AND_NETWORKS.md`. `ops_log.rb` itself is touched by every plan that adds events: each
adds its rows to `EVENTS` in its own stage, so L1 should land early and the constant is the one
place merges meet.

## 13. The shared contract: helper signature and the row table format

Every ops plan writes its rows through this helper and lists them in the table format in 13.3.
Storage and reading belong to this plan.

### 13.1 The helper

```ruby
# BreakEscape::OpsLog, included in Game (app/models/break_escape/ops_log.rb)
#
# Writes one log row when a declared log source takes the event; otherwise does nothing.
# Never saves: call it before the caller's own save!, on the success or counted-failure
# branch only. Returns the stored row (a Hash) or nil.
def write_log_row!(event, where:, as: nil, result: 'ok', detail: nil, actor: 'player')
```

| Argument | Type | Meaning |
|---|---|---|
| `event` | String | a name in `OpsLog::EVENTS`, `family.name` (for example `signin.fail`) |
| `where` | `{ kind:, id: }` | `kind` is `door` (id is the room), `object`, `pc`, `jack`, `ap` or `host` (`host` reserved for S1) |
| `as` | `{ npc: id }`, `{ typed: text }`, or `nil` | the identity the system recorded, which is what play shows |
| `result` | `'ok'`, `'fail'` or `'denied'` | must be one the event allows |
| `detail` | String or nil | one of the event's closed list of detail codes |
| `actor` | `'player'` or an NPC id | who really acted; stored, never sent to the browser. NPC ids are for the parked defence work |

Stored row:

```json
{ "seq": 17, "event": "signin.ok", "actor": "player", "as": { "npc": "j_price" },
  "where": { "kind": "pc", "id": "reception_pc" }, "result": "ok", "detail": "password",
  "elapsedMs": 734000, "serverMs": 1763550000000, "sources": ["domain_signins"] }
```

`serverMs` is server epoch time, for server-side readers only.

### 13.2 Registering an event

Each plan adds its events to `OpsLog::EVENTS` in its own build stage:

```ruby
EVENTS = {
  'signin.ok' => { label: 'SIGN_IN', results: %w[ok], details: %w[password credential local remote] },
  # ...
}.freeze
```

The family is the part before the dot. Families in use: `badge`, `signin`, `account`, `session`,
`net` (this plan); other plans pick their own family name and say it under their cross-plan
requests.

### 13.3 The table each plan publishes

Each feature plan's "Log rows this feature writes" section is a table with exactly these columns:

| Event | Written when (method `file:line`, branch) | `as` | `where.kind` | Results | Detail codes | Never in the row |
|---|---|---|---|---|---|---|

- **Written when** names the model method and branch, not the route.
- **`as`** says whose identity, and how a borrowed or forged identity shows.
- **Never in the row** lists the secrets near this action that must stay out (a hash, a weakness
  not found yet, which account a username belongs to).
- A plan whose feature writes no rows says so in one line and why (for example offline cracking).

## 14. Log rows this feature writes

| Event | Written when (method `file:line`, branch) | `as` | `where.kind` | Results | Detail codes | Never in the row |
|---|---|---|---|---|---|---|
| `badge.swipe` | `GamesController#unlock` (`games_controller.rb:1211`), rfid, success after `:1255` | own keycard: its holder; a copy: `-` unless `showCardHolder` | `door`, `object` | `ok` | `-` | which of several held copies passed (default) |
| `badge.swipe` | same, rfid refusal at `:1252` | `-` | `door`, `object` | `denied` | `-` | any card id or holder |
| `signin.ok` | `start_login_session!` (`game.rb:4388`), via `password` or `credential` | the account signed in | `pc` | `ok` | `password`, `credential`; `local`, `remote` | the password; the foothold, relay or source PC id |
| `signin.fail` | `record_login_failure!` (`game.rb:4333`) | typed username | `pc` | `fail` | `-` | whether the username is an account |
| `account.lockout` | `add_login_lockout!` (`game.rb:4366`), after `:4368` | typed username | `pc` | `ok` | `-` | whether the username is an account |
| `session.end` | `logout_session!` (`game.rb:3660`) | the session's account | `pc` | `ok` | `-` | |
| `session.lock` | `lock_session!` (`game.rb:3836`) | the session's account | `pc` | `ok` | `-` | |
| `net.link_up` | `plant_device!` (`network_access.rb:233`), success (L3) | `-` | `jack` | `ok` | `-` | the network id or name, the device id |
| `net.link_down` | `unplug_device!` (`network_access.rb:290`), success (L3) | `-` | `jack` | `ok` | `-` | as above |
| `net.wifi_join` | `join_network!` (`network_access.rb:355`), success (L3) | `-` | `ap` | `ok` | `-` | the key, the network id |

No row: `claim_login_session!` (`game.rb:3527`, using an open screen), `clone_card`
(`games_controller.rb:1655`), `implant_foothold!` (`network_access.rb:468`). Each is a case where a
real system records nothing, and the gap is the lesson.

## 15. Cross-plan requests

1. **All plans:** fill "Log rows this feature writes" with the table in 13.3, add the events to
   `OpsLog::EVENTS` in the build stage that adds the action, call `write_log_row!` in the model
   method before its `save!`, and add a row assertion to that plan's `test_ops_*` scenario. Each
   plan's `test_ops_*` scenario declares a `logSources` block so the assertion has somewhere to land.
2. **OPS_CORE (S1 to S3):** owns `where.kind: "host"` and whether a scan writes rows (a noisy scan
   being seen is a good lesson); a technique use row should log as the session's account once S3
   grants one. Also: reading a log through a session on a host (section 16, question 5) needs S1's
   host shape.
3. **OPS_PRIVILEGE_ACCOUNTS (S5):** a domain sign-in passes through `start_login_session!`, so it
   gets `signin.ok` for free; S5c says what `where` a domain sign-in records. S5a lists a privilege
   raise row if it writes one.
4. **OPS_CRACKING (S7):** offline cracking writes nothing; the hash dump, if it is an action on a
   host, may.
5. **OPS_MFA_HELPDESK (S8):** an MFA prompt (`ok`, `denied`) and a helpdesk reset are natural rows;
   the reset row logs as the account reset, with the caller's claimed identity in neither `as` nor
   detail.
6. **OPS_REALISM_SKIN (S6):** writes no rows (a skin adds no moves). It may later give the ops log
   a command-line view over the same `GET /log_rows`.
7. **Orchestrator:** `actor` and `log_rows_for` are reserved for the parked defence debrief and the
   investigator idea; no plan should repurpose them.

## 16. Open questions for the user

1. **A copied card in the door log.** The server hides which held copy opened a door
   (`game.rb:4064-4069`). (a) Badge rows from a copy show no identity unless a source opts in with
   `showCardHolder: true`; (b) always show the card holder, which is realistic and teaches that a
   clone logs as its owner, but tells the player whose identity the list admits; (c) never show
   it. **Recommend (a):** the old guarantee holds by default, and a mission built round reading the
   door log can opt in.
2. **Where rows are kept.** (a) A capped list in `player_state` (300 rows, about 36 KB, never
   synced); (b) a new table, which needs a migration on the shared dev database. **Recommend (a):**
   no migration, and the cap keeps the save small; move to a table only if a mission needs more.
3. **Refused badge swipes.** (a) Log them with no identity; (b) do not log them. **Recommend (a):**
   failed attempts being visible is one of the lessons, and the row says nothing the reader did not
   already show.
4. **Time on a row.** (a) The last game time the client reported in its sync (can lag a few
   seconds; order is always right because rows also carry a sequence); (b) every write route also
   sends the client's current game time. **Recommend (a):** the time is shown only, never checked,
   and (b) adds a parameter to many routes.
5. **Reading a log remotely.** (a) Only at a reader object in a room the player has reached (this
   plan); (b) also through a session on a host once S1 hosts exist. **Recommend (a) now**, (b) as a
   follow-on once S1 lands.
6. **Rows from NPCs and office life.** Staff badge swipes, sign-ins and workarounds happen in the
   browser's office-life systems, so the server cannot vouch for them. (a) Leave them out until the
   defence work, which needs a server-side NPC model anyway; (b) add a client-reported NPC row
   route now, best effort, for atmosphere. **Recommend (a):** seed rows cover a lived-in log for
   now, and investigator missions can author their insider's trail as seed rows.
7. **Checking an investigator's answer.** log-filter checks the flagged row in the browser, and the
   anomaly is in the scenario data sent to it. That fits today's cheat policy for dialogue-level
   steps. Should a later investigator mission check the flagged row on the server? **Recommend:**
   not in A24; decide when the first investigator mission is planned.
