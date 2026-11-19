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
and workarounds to find an insider). Each row stores the identity the system recorded (`as`), and
authored seed rows let a mission plant an insider's earlier trail. Today every row is the player's
own doing, so there is no field for who really acted; section 13.6 says how the defence work adds
one later without migrating stored rows.

The other ops features (scanning, techniques, privilege, MFA and the help desk) write their rows
through the same helper (section 13), so one log can show a sweep, a sign-in and a help desk reset
side by side.

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
blocks such as `credentials` (`:281`) and `networks` (`:317`). Object `minigameData` is checked
against `scripts/minigame-data-schemas.json`, keyed by object type (`validate_scenario.rb:902-950`:
a missing required field or an undeclared field is an error, a type with no entry a warning).
`log_filter_terminal` has an entry there (`:63-87`) that requires `logEntries`.

**log-filter's fixed paths.** Beyond columns, its filter matcher (`log-filter-minigame.js:729-746`),
TIME filter (`:749-757`), row tint (`:650-656`), detail panel buttons (`:812-850`) and row
selection by index (`:764-768`) are all written for its two authored types. Section 5.2 weighs this.

**Two JS harnesses copy `minigames/index.js`:** `test/js/patch-panel.test.mjs` and
`test/js/social-authenticator-wiring.test.mjs`, so a new minigame import there must be added to
their copy lists.

## 3. Build stages in order

Each stage ships alone, with its tests.

| Stage | What | Size |
|---|---|---|
| L1a | The helper, the event list and the caps, with no call sites; the `logSources` schema and validator; the clock stamp; the module's own secret list and guard. Unit tests over a fixture scenario and a `PUT /sync_state` controller test. Nothing is written in play yet. The secret list is written new (PINs, lock codes, hashes, MFA values and helpdesk answers are in no existing list), so this stage is M | M |
| L1b | This plan's own badge, sign-in and session rows at their call sites (13.8). Creates `test_ops_logs` (a door, a sign-in PC, a `gameClock`, `logSources`, no reader). Controller tests on a re-read game and a scripted playtest checked with `verify-run.rb --ops-log` | M |
| L2a | `GET /log_rows`, the `ops-log` viewer and `ops_log_terminal` type (read only), its schema, sprite and lighting entries; the reader added to `test_ops_logs`; scripted playtest and live proof | M |
| L2b | Seed rows, `anomaly.rowId`, the flag flow and its actions; validator checks on seed rows; the dungeon graph note node. | S |
| L3 | Network rows and the share folder row (`share_folder_opened`); needs shares (slice 9.3a, built), not S1 | S |

L1a lands before the first stage of every other ops plan. It has no call sites, so it touches no
method a sibling edits, and each sibling then writes and tests its own rows from its first commit
with no stub. L1b lands after L1a and before any sibling stage that edits the same sign-in methods
(S3, S5a, S5c, S8), so those edits merge onto code that already writes rows (section 14, request
2). L1b before L2a so the write side and its secrecy rules are tested before anything is shown.

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
| `seedRows` | array, at most 100 | L2, section 4.2 |

With no `where`, the source takes its events anywhere; the validator warns when such a source uses
a prefix wildcard, because it then records every matching event in the mission. A row two sources
take is stored in each, and each source's cap applies to its own list only.

`logSources` joins the withheld scenario keys, so the bootstrap never ships it.

### 4.2 L2: seed rows and the reader

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
`logSource`; optional `title`, `anomaly`, `flagActionLabel`, `flagActions`, `completionActions`),
loaded by the validator's minigame check (`scripts/validate_scenario.rb:902-950`). The
`log_filter_terminal` entry (`:63-87`, which requires `logEntries`) is unchanged. With the new
entry in place the example above validates with no error or warning.

`anomaly.rowId` is optional and names a seed row, never a play row. A play row does not exist
when the scenario is authored, its id is not stable across games, and the player's own trail is
not a puzzle answer. The validator rejects any other value. An investigator mission that wants a
play row (for example "find the swipe that let you in") is a later feature with a server check of
its own. Without `anomaly`, the terminal is a plain log browser with no flag button.

### 4.3 L3

No new fields. Network events (`net_*`) and `share_folder_opened` (section 13.8) become valid in
`events`. A share is a place with no room, so a source takes its rows by `where.places`
(`"share:finance_share"`) or with no `where`.

## 5. Engine behaviour

### 5.1 Server

A new concern, `app/models/break_escape/ops_log.rb` (`BreakEscape::OpsLog`), included in `Game`.

**Writing.** `write_log_row!` works as section 13.2 sets out. It never saves; each call site
either already saves after the call or adds one save gated on `r&.stored?` (13.7, 13.8).

**The clock stamp** (13.4) is written in three places, none of which reads `scenario_data` where
it is not loaded:

- `initialize_player_state` (`game.rb:7517`) seeds `opsLogClockAt` when the scenario has
  `logSources`; the key existing is the opt-in marker from then on.
- `merge_scenario_clock!` (`game.rb:5846-5899`), called only from `sync_state`, which loads no
  `scenario_data` (`games_controller.rb:2436-2442`): its new line is gated on
  `player_state.key?('opsLogClockAt')` and refreshes the key when it stores a new `elapsedMs`.
- `prepare_bootstrap_state!` (called from `GamesController#scenario`, `games_controller.rb:309`):
  when the key exists and is ten seconds old or more, it is reset to now and
  `bootstrap_state_needs_write?` answers true, because a loading page restarts its clock from the
  saved `elapsedMs` (`game-clock.js:79-80`). One save per page load, only with `logSources`.

A game started before L1a has no key; the first helper write seeds it.

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
    `signin_refused` `denied`. The branch gains a `save!` when `r&.stored?`; reaching it needs the
    real password, and a wrong one already costs a save per attempt.
  - the locked-out return (`:3484`, before any account lookup): `signin_refused` `blocked`,
    `as: { typed: }`, with `save_limit: 10`. The branch saves when `r&.stored?`, so a locked-out PC
    costs at most ten saves whatever usernames are typed; after that the call is dropped and the
    branch is free, as it is today.
- `logout_session!` (`game.rb:3660`): `session_end`, only when the deleted record is a Hash, so a
  forged `/logout` writes nothing. `lock_session!` (`game.rb:3836`): `session_lock`, past its
  refusals. Both methods save.
- `GamesController#unlock` (`games_controller.rb:1211`), under the game lock. The row keys on what
  the server resolved, never on the request's `method`:
  - `already_open` is computed for every rfid request (`:1223-1224`). An open target, or one whose
    lock is not in force (`game.rb:4754-4755`), writes nothing.
  - Granted: the target resolves, its lock is in force with `lockType` `rfid`, it was not open, and
    `validate_unlock` passed. `badge_swipe` `ok` is written inside the transaction (`:1280`), after
    the route-room refusal (`:1273-1276`), before `unlock_room!` (`game.rb:135`) or
    `unlock_object!` (`game.rb:691`), whose save persists it.
  - `as` on a granted swipe, from server state only: at an access-list lock,
    `rfid_unlock_card_answer` (`game.rb:4070-4081`) gives a card's single holder as `{ npc: }`, or
    `{ card: id }` for a card with no or several holders (`game.rb:3981-3989`); a copy follows
    section 7. At a lock with no access list, a new reader `rfid_requires_card(lock)`, built from
    the loop of `rfid_lock_passes?` (`game.rb:3997-4004`, `:4015`), returns the matched item, named
    by the same rule.
  - Refused (`:1252`): only when the target is an rfid lock in force, in reach (a door into a room
    connected to an unlocked room, or an object in an unlocked room and not in an unpromoted route
    room), and the player holds an rfid card or clone in server state (`held_rfid_cards`,
    `game.rb:3951`; at an access-list lock one sent id must be one of them, `:4054-4061`).
    `badge_swipe` `denied`, no identity, `save_limit: 10`: the path saves when `r&.stored?`, so one
    door costs at most ten saves, then the call is dropped and the path is free again.

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
`log-filter-minigame.js` untouched.

Log-filter's code is fixed to its two authored types: its filters match fixed category ids
(`log-filter-minigame.js:729-746`) and read the hour from fixed string positions (`:749-757`), its
row tint matches on `account` (`:650-656`), its detail panel always shows its own buttons and the
flag (`:812-850`), and selection is by index (`:764-768`). Guarding each by type would touch most
of a 1441-line file used by `sis01_healthcare` and `sis02_energy`, so a separate viewer keeps them
safe by construction. siem is a timed triage game with random alerts, browser storage and its own
Cancel button (section 2), so it does not fit either.

The viewer, `public/break_escape/js/minigames/ops-log/ops-log-minigame.js` (about 350 lines):

- `static consoleWindow = true`, so the shared console frame draws the title bar and the X. The
  opener passes no `showCancel`; there is no Cancel button. The frame title is the object's `name`;
  the source `title` from the answer is shown as the table's caption once rows arrive.
- Opens with one `LOADING` row, calls `ApiClient.logRows(objectId, { rev, signal })` (new, in
  `api-client.js` next to `keyring`, `:256-263`), then renders. Any refusal shows `NO ACCESS` and
  nothing else. Reopening sends the last `rev`; an unchanged answer keeps the rows. A `REFRESH`
  button fetches again.
- Columns: TIME, EVENT, IDENTITY, LOCATION, RESULT, DETAIL. A merged row shows its count after the
  result (`FAIL x3`). Play rows' TIME is `window.gameClock.formatStamp(elapsedMs)`
  (`game-clock.js:173-177`, "Tue 07:42"); seed rows show their `at`.
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
(`container-minigame.js:2326-2331`, where `log_filter_terminal` already is). A click then goes
through `handleInteractiveItem`, which closes the container, arms the return to the screen it came
from (`:2456-2468`) and hands `window.handleObjectInteraction` a stand-in sprite (`:2471-2477`):
`scenarioData` is the item, `objectId` is a throwaway `temp_<time>`, and `sourceExtras()` adds
`sourcePcId` or `sourceResourceId`. So the `ops_log_terminal` branch takes the reader's id from
`sprite.scenarioData.id`, never from `sprite.objectId`, which would answer 404 every time. A reader
on a desktop or share also needs the route the screen was reached by, because `GET /log_rows`
judges it as `/container` does (section 6). `sourceExtras()` therefore also carries the
`foothold` or `from` the container minigame passed to `ApiClient.container`
(`api-client.js:240-250`) as `sourceRoute`, and the branch passes it to `ApiClient.logRows`. A JS
test opens a reader from a desktop through this path and asserts the request's `object_id` and
route.

Investigator missions may want log-filter's extra tabs and threat-intel overlays over these rows;
they can add an ops `logType` to log-filter then, with the list above as its work list.

## 6. Server routes

One new route. The helper adds no route of its own; every write rides on an existing route.

**`GET /games/:id/log_rows?object_id=<id>&rev=<rev>[&foothold=<id> or &from=<id>]`** (L2a)

- On `set_game` (`games_controller.rb:27`) and authorised like `keyring`. Not under
  `with_game_lock`: it reads only.
- Checks, in order:
  1. `object_id` is present and at most 64 characters, else 400 `{ error: 'Invalid object' }`.
  2. The object exists, is an `ops_log_terminal` with an `id` and a `logSource` that is declared,
     else 404 `{ error: 'Not found' }`. The same answer for every one of these, so the route does
     not map the scenario.
  3. The player has reached it. `located = @game.login_scope_of(object_id)`
     (`game.rb:3176-3204`) gives the object, its room, its scope (nil, a sign-in PC, a profile or
     a resource) and the chain of containers above it.
     - **Scoped readers, shared with `/container`.** The three scoped branches of
       `GamesController#container` (`games_controller.rb:638-669`) move into one private method,
       `container_reach_refusal(located)`, which returns nil or a symbol (`:not_found`,
       `:unreachable`, `:locked`) and lets each route render; `/container` renders exactly the
       404, 403 and 403-with-`reason` it renders today (section 10, check 6). A resource scope (a
       share): `session_admits?(scope)` (`game.rb:3260-3277`), then the sign-in-object refusal,
       then `path_unlocked?(path + [object])` (`game.rb:3310-3313`). A sign-in PC or profile
       scope: `session_admits?(scope)` and `path_unlocked?(path + [object])`, and under a sign-in
       PC also `folder_route_allowed?(scope id)`, which judges the route the request names. For
       these readers the two routes cannot drift.
     - **Readers with no scope: `/log_rows`'s own rule.** `/container` judges an unscoped object
       by `check_container_unlocked` (`games_controller.rb:671-679`), which asks whether that
       container is itself unlocked; a reader is not a container, so `/log_rows` uses a rule of
       its own: `room_unlocked?(room_id)`, not `object_in_unpromoted_route_room?(object_id)`
       (`game.rb:323`), and `path_unlocked?(path)` over the containers above it.
     The request carries the screen's route as `foothold` or `from`, as `/container` and
     `/keyring` requests do. Any refusal: the same 404 as step 2, so the route does not tell a
     locked reader from an invented one.
- Answer: `{ rev, title, rows: [...] }`, or `{ rev, unchanged: true }` when `rev` matches. The rev
  is a six-character MD5 of the client rows, as `keyring_rev` digests its entries
  (`credential_keyring.rb:238-240`), so a change to a seed row or a title on a live game also
  changes it. `Cache-Control: no-store`.

There is no presence check beyond what `/container` makes. A reader gated only by rooms and
unlocked objects stays readable from anywhere once reached, because `unlockedRooms` and
`unlockedObjects` only grow; under the rules in 13.3 a row holds nothing the player has not earned,
so reading it from afar gives nothing away. A reader under a sign-in PC, in a profile or on a share
is readable only while a session admits it: a session that ends, locks or loses its route makes
the next read refused. A reader on a PC reached through a foothold or `from` session is therefore
readable remotely today, over that route, which is what reading a log through a session means.
Controller tests cover both cases, and a reader read through a session that is then locked.

## 7. What reaches the browser, and what never does

**Never:** the `logSources` block (withheld from the bootstrap), `player_state['opsLog']`,
`opsLogSeq` and `opsLogClockAt` (not on the bootstrap's named-key list, never read from a sync
body), a row's `seq`, `serverMs`, the server time in `last`, raw ids, any detail key registered
`show: false`, and any stored key added later (such as `by`, 13.6). No row carries a secret (13.3).

**Only through `GET /log_rows`, for a reached reader**, each row built from an allow-list of
exactly these keys:

| Field | Value |
|---|---|
| `id` | seed rows: their authored id (`s1`); play rows: the first ten hex characters of an HMAC of `[game id, source id, seq]` keyed from `secret_key_base`, so the browser cannot recover `seq` or count rows in other sources, and ids within a reader do not collide in practice |
| `elapsedMs` or `at` | play rows: the game time estimate (13.4); seed rows: the authored `at` |
| `event` | the event's `label` (`BADGE`, `SIGN_IN`, `LOCKOUT`, ...) |
| `as` | an account's username, an NPC's or card's display name, the normalised typed username, or `-` |
| `where` | the display name of the place (room, object, PC, host, desk ...), or `-` |
| `result` | the result word, upper-cased, with `xN` when `n` is above 1 (`FAIL x3`) |
| `detail` | the shown detail keys, each as value or display name, joined as `key: value` |

A test asserts the answer's row keys are exactly these seven, so a stored field added by another
plan is withheld unless this list is changed on purpose.

Rules that keep a row from telling the player something new:

- **A copied card** is named by its holder only when the request carried one card (or the source
  sets `showCardHolder`), the guarantee of `rfid_unlock_card_answer` (`game.rb:4064-4069`);
  question 1 in section 15.
- **A typed username** (a failed or blocked sign-in, a helpdesk request) never says whether it is
  an account. An
  account's username (`{ account: }`) and a typed one (`{ typed: }`) render in the same form, the
  output of `normalise_username` (`game.rb:2721-2723`, lower case), so `J.Price` as an account and
  `j.price` as typed text look identical and the shape does not tell an account from a
  non-account.
- **A place** appears only because the server validated an action there (13.3), or because an
  author wrote a seed row. A forged swipe at an unreached door writes nothing (13.8). A place id
  whose kind has no display name, or that no longer resolves, shows as `-` (`OpsLog::KINDS`, 13.5),
  never as the raw id.
- **Player text.** The typed username is the only player text in a row: normalised, cut to 32
  characters and marked typed by the helper (13.1), and the viewer renders every cell by
  `textContent`.

**The reader's own fields reach the browser with its room or container**, as log-filter's do:
`minigameData.logSource` (a raw source id), `title`, `anomaly.rowId`, `flagActionLabel`,
`flagActions` and `completionActions`. The seed row to flag is therefore known to the browser from
room load, and the flag is checked on the client. That is best effort, the same standing as
log-filter's anomaly today; a source id names a log, not anything the player has to find. A server
check of the flag belongs to the investigator work (4.2).

## 8. State and saved games

| Key | Shape | Size | Written by | Sent |
|---|---|---|---|---|
| `opsLog` | map of source id to an array of rows (13.1) | each row at most 400 bytes (`to_json.bytesize`); each source at most its `maxRows` (default 50, at most 150); all sources together at most 300 rows; the whole value at most 128 KB (`MAX_OPS_LOG_BYTES`). Typical: 10 to 15 KB for one full default source; the 300-row ceiling is at most 120 KB | `write_log_row!` only | never |
| `opsLogSeq` | integer | one number | `write_log_row!` only | never |
| `opsLogOnce` | array of 12-hex-character digests (13.2 step 4) | at most 256 entries, about 4 KB, oldest dropped past that | `write_log_row!`, when a `once: true` call stored | never |
| `opsLogSaves` | map of a 12-hex-character digest of event and `where` to a count (13.2 step 4) | at most 256 entries, each count at most its `save_limit` (under 100), about 5 KB; never evicted, a new key past 256 is dropped | `write_log_row!`, when a `save_limit:` call stored | never |
| `opsLogClockAt` | integer, server epoch ms | one number | `initialize_player_state` (seed), `merge_scenario_clock!` and `prepare_bootstrap_state!` (refresh, only while the key exists), or the first helper write in a game started before L1a | never |

- `opsLogClockAt` is created at game start for a scenario with `logSources`; `opsLog` and
  `opsLogSeq` on the first write, `opsLogOnce` and `opsLogSaves` on the first write that needs
  them. None is in `ACCESS_STATE_DEFAULTS` (`game.rb:3021`), so a game whose scenario has no `logSources` never gains any of them.
- None is on `reset_player_state!`'s preserved keys (`game.rb:120-122`, and `new_session` slices
  the same way, `games_controller.rb:269`), so a reset drops the log. A reset re-runs
  `initialize_player_state`, which seeds the clock key again. `opsLogSeq` restarts at 1, and play
  row ids repeat across a reset; the viewer's `rev` is a digest of the rows, so a stale rev cannot
  match the new log by accident.
- **Byte caps.** The field caps, the 400-byte row cap and its calculation are in 13.1; the 300-row
  sum and the 128 KB guard in 13.2 step 6. The validator refuses an over-long id in a scenario
  with `logSources` (section 9), so an author learns before play.
- **Where rows live.** In `player_state`, one jsonb column every `save!` rewrites whole; a full log
  adds at most 120 KB, the class of keys it already holds at 128 KB and 512 KB (`game.rb:6142`,
  `:6209`). A table would need migrations in the engine and Hacktivity and nothing needs SQL over
  rows; every read goes through `log_rows_for` and `log_rows_for_client`, so a later move touches
  one file. Rows are never synced and are sent only on request with `rev`.
- **Nothing may gate on a play row** while storage is a capped list: `anomaly.rowId` names seed rows
  only (4.2), and play rows can be dropped by their own source's cap.
- Reload: nothing to restore on the client. The terminal fetches when it opens.
- Old saves: a game started before L1a has no keys and starts logging at the first write, which
  also seeds the clock key.

## 9. Validator, schema and dungeon graph

**Schema** (`scripts/scenario-schema.json`): a closed `logSources` block (`additionalProperties:
false` on a source, on `where` and on a seed row), next to `credentials` and `networks`. `events`
items carry a name pattern only (`^[a-z][a-z0-9_]{1,39}(_\*)?$`), never an enum, so the plans that
add events do not all edit one shared list in a static file. The real check is the validator's:
it reads the event list from `lib/break_escape/ops_log_events.rb`, a plain Ruby file with no Rails
dependency that the concern also requires. `ops_log_terminal` joins the
object type enum. `scripts/minigame-data-schemas.json` gains the `ops_log_terminal` entry
(section 4.2); the `log_filter_terminal` entry is unchanged.

**Validator** (`scripts/validate_scenario.rb`), errors:

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
- In a scenario with `logSources`: more than 30 sources; a declared secret equal to a username or
  an id (warning: a row naming that thing would trip the guard); a source whose `maxRows` is below
  the number of events it takes (warning: first rows may be evicted, 13.2 step 6).
- An `ops_log_terminal` with no `id`, no `logSource` or one naming an undeclared source; an
  `anomaly.rowId` that is not one of that source's seed rows. The minigame schema check reports missing and undeclared fields.
- `logType: "ops"` on a `log_filter_terminal` (the ops viewer is its own type), and
  `logSource` on an event-mapping minigame (`scenario-schema.json:5039-5047`), which has no object
  for the route to check.

Warnings: a source no reader names (rows written, never shown; fine for a defence-only source); a
source with a prefix wildcard and no `where`; a reader whose source records no event the scenario
can produce (for example `badge_swipe` with no rfid lock in its `where`).

**Dungeon graph** (`scripts/generate_dungeon_graph.rb`): a log source is neither a lock nor a key,
so it adds no gating edge of its own. Each source becomes one note node (`add_node`, `:77`)
labelled with its title and events, with a dashed, undirected edge (`add_edge`, `:82`) to each
reader. A reader whose seed-row `anomaly` drives `flagActions` that set a global or complete a task
gets the same edges any other object with those actions gets, from the reader to what they unlock.

## 10. Effect on existing scenarios

No scenario in the repo has `logSources`, so:

- `write_log_row!` returns at its first line; no row, no `opsLog`, no `opsLogSeq`.
- No answer from an existing route gains a field.
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
   public/break_escape/css/log-filter-minigame.css` is empty at each stage, and the two log-filter
   JS tests (`test/js/log-filter-selected-row.test.mjs`, `test/js/log-filter-wording.test.mjs`)
   pass unchanged. The same diff covers `public/break_escape/js/minigames/siem/`.
5. L2a edits files log-filter is opened through (`interactions.js:1585-1597`,
   `container-minigame.js:2326-2331` and `sourceExtras()`, `minigames/index.js`,
   `lighting.js:434`, `game.js:905`), so a JS test asserts that a `log_filter_terminal` in a room
   and in a container still opens `log-filter` with the same arguments, and that `sourceExtras()`
   adds `sourceRoute` only when a route was passed.
6. `/container` answers byte-identical bodies and statuses before and after the extraction of
   `container_reach_refusal` (section 6), over the access model suite's container cases.
7. The validator run over all scenarios reports no new errors or warnings (diff of its output
   before and after).

## 11. Tests

**Server unit, L1a** (`test/models/break_escape/ops_log_test.rb`):

- No `logSources`: nil, state untouched. `scenario_data` not loaded (a game fetched with
  `SYNC_STATE_COLUMNS` only): nil, no error.
- Source matching by exact name, by prefix, by `where.rooms`, `where.objects`, `where.places`; a
  placeless row lands only in a source naming it exactly; two sources, a row in each.
- Merging: an identical repeat raises `n` and the last times, and appends nothing; a repeat that
  differs in any of event, `as`, `where`, `result`, `detail` appends. A, B, A, B twenty times
  leaves two rows with `n: 10` each.
- **Save counter.** With `save_limit: 10`: eleven distinct rows at one place sent in rotation for
  five rounds answer `stored?` ten times in all, then nil with state untouched (`opsLogSaves`,
  `opsLog` and `updated_at` unchanged on a re-read). A limit-reached row that is then evicted by a
  flood in its source, and repeated, still answers nil. A second place keeps its own count. With
  `opsLogSaves` full, a new key answers nil and no existing entry is dropped.
- `once: true` writes nothing and answers nil when its digest is in `opsLogOnce`, even after the
  row has been evicted; the digest is added only when a row was appended; the 257th distinct
  once-row drops the oldest digest; `once: true` with `as: { typed: }` is malformed. With no
  `logSources`, every call answers nil and the caller adds no save.
- Eviction and caps: a source past its `maxRows` evicts by the order in 13.2 step 6 and never
  touches another source. A first refusal that has merged to `n: 3`, then fifty distinct forged
  refusals and fifty `ok` rows, leaves that first refusal and the first `ok` row in place. A
  source whose `maxRows` is below the number of its events never exceeds `maxRows`. The clamp
  holds for a snapshot with `maxRows: 500` and gives three sources of 150 the caps 150, 140 and 10.
  The largest legal row
  is at most 400 bytes; a 64-character typed username of four-byte characters and one of control
  characters are cut to fit 96 bytes and carry `cut: true`. `opsLogSeq` keeps counting.
- Malformed calls (unknown event, place kind, result, detail key, a detail value of the wrong
  type, a `count` above its maximum, an id over 40 characters, an account over 32, an `as` or
  `{ id: }` value that does not resolve) raise in test; with the production setting they return
  nil, store nothing and log one warning. A `count` of 1234 is refused in production.
- **Secret guard, two runs.** The list: `OpsLog.secret_values` on the fixture holds each seeded
  secret (a password, a PIN, a lock code, a credential value, a hash, an MFA seed, an issued code
  and matching number, a helpdesk answer) and no display name, id or username. The walk: for every
  registered event, siblings' included, a call is built with each detail key and `as` set to each
  of those values, to the number forms of the PIN and the matching number, and to secret-shaped
  strings such as `Hunter2!` and `5f4dcc3b5aa765d6`. Run 1 with the guard switched off: every call
  is refused by the type rules or stores a row in which no secret appears; this run fails on a
  weak type rule alone, such as a bare integer or a `count` maximum of 99. Run 2 with the guard
  on: the same, and `assert_ops_log_holds_no_secret` passes over `opsLog.to_json`. A clean row
  whose `seq` or `n` equals a numeric secret does not raise. The walk reads `EVENTS` at run time,
  so each sibling event is covered the moment it lands.
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
- `start_login_session!` with `via` `claim` or `technique` writes no `signin_ok` and does not raise.
- A failed sign-in for a real account and for a made-up username write rows that differ only in
  the username.
- `signin_refused`: a right password at a PC that does not admit the account stores a `denied` row;
  attempts after a lockout with twelve distinct made-up usernames store at most ten `blocked`
  rows, each `{ typed: }`, and the rest cause no save (asserted by `updated_at` on a re-read).
- Badge rows: a forged `rfid` unlock at an already-open door, at a lock not in force, at a door
  with another lock type, at an unreached door, by a player holding no card, or naming a missing id
  writes nothing; a requires-only lock logs granted with the matched card's holder and logs a
  refusal; a granted swipe refused by the route-room check leaves no row; twenty refused swipes at
  one door cause ten saves and leave one row with `n: 10`, and the next ten are free. A copy sent alone shows its holder; several cards sent at
  once show `-`; `showCardHolder` always shows the holder.
- `logout_session!` at a PC with no session writes nothing; a claimed session's sign-out writes
  `session_end`.
- `share_folder_opened`: opening a share folder writes one row for the folder, naming no file, and
  saves; opening it again as the same account writes nothing and does not save; another account
  opening it writes its own row; a refused open writes nothing. With two sessions that both admit
  the share, the row names the account of the one signed in first, on every open.
- A card copy and an implanted foothold write nothing.

**Controller** (`test/controllers/break_escape/log_rows_test.rb`, L2a): each refusal in section 6
with its status; the same 404 for missing, wrong type, undeclared source, unreached room, a reader
in a locked cabinet, a reader on a desktop without a session, and a reader on a share without one;
a reader under a sign-in PC answers while its session is held and 404 after the session is locked
or ended; a reader through a foothold route answers with the route and 404 without it; a
room-gated reader answers from any position, including rows written later; `rev` unchanged;
`no-store`; `assert_ops_log_holds_no_secret` over every response body.

**Validator and schema:** one fixture per error and warning in section 9; every event in
`ops_log_events.rb` passes the schema's name pattern; the reader example in 4.2 validates clean.

**JS** (`test/js/ops-log-viewer.test.mjs`, with its own harness copy list): columns; filters from
the rows present, including TIME on `HH:MM` and `Tue 07:42` stamps; selection kept across a
refresh; flag button only with an anomaly; no row tinted; `LOADING`, `NO ACCESS`, `unchanged`;
`textContent` with a hostile typed username; merged rows show their count; a reader opened from a
desktop through `handleInteractiveItem` requests its own `scenarioData.id` with the screen's route.

**Feature scenario** `scenarios/test_ops_logs/` (with a `gameClock`), created in L1b with a lobby,
an rfid door with an access list into an office, a sign-in PC in the office, a card to copy from an
NPC, and a `logSources` block (door controller, sign-in audit); L2a adds a security room with a log
terminal over both sources, L2b seed rows and an anomaly, L3 a jack and a share with two files.

**Scripted playtests** (`scenarios/test_ops_logs/PLAYTEST.md`, through `window.__test`):

- L1b: wait for one real sync, then copy the NPC's card, swipe into the office, fail the sign-in
  twice, sign in, lock the screen. After the run, `bin/rails runner tools/playtest/verify-run.rb
  <game_id> --ops-log` (the server script the `test_access_*` playtests use,
  `scenarios/test_access_signin/PLAYTEST.md:30`) prints each source's rows and exits 1 if any
  stored row holds a declared secret; the playtest checks the events, the merged failure count,
  and that the sign-in row's time is within a few seconds of the on-screen clock at the moment of
  sign-in.
- L2a onward adds: walk to the security room and open each log. Checks: the rows and their order;
  the copy row's identity per the default; the `/log_rows` answers carry exactly the seven row
  keys; `tools/playtest/access-leak-check.rb`, extended to cover `/log_rows` responses, reports no
  secret; a second open answers `unchanged`.

`verify-run.rb --ops-log` is one more `ARGV.delete` flag (`tools/playtest/verify-run.rb:56-58`)
and a section of about 30 lines beside `access_section(ps)` (`:73-144`): size S, built in L1a. It
is a command-line script, not a route a browser can call.

**Live proof:** the same run on the keyless dev server (port 3001), real path, screenshots of both
logs.

## 12. Build steps and shared files

**L1a: the helper, no call sites**

1. `lib/break_escape/ops_log_events.rb`: `EVENTS` (empty; L1b, L3 and each
   sibling add their own), `KINDS` with this plan's kinds, the four detail rule types (13.5).
2. `app/models/break_escape/ops_log.rb`: `write_log_row!`, `OpsLog::Result`, the checks, the
   once-set and save counter, merging, eviction by class, the caps and the `maxRows` clamp
   (13.2); `log_rows_for` and its compare form. `game.rb`: include the concern.
3. The secret guard: `OpsLog.secret_values(game)`, written new over the scenario's secret fields
   and the game's issued values (13.2 step 2), with a switch tests use to turn the guard off; the
   test helper `assert_ops_log_holds_no_secret`. `access_leak_scanner.rb` keeps its own list and
   reads this one only for `/log_rows` bodies. The validator warns when a secret equals a
   username or id in a scenario with `logSources`.
4. The clock stamp in `game.rb`: the seed in `initialize_player_state` (`:7517`), the gated line
   in `merge_scenario_clock!` (`:5846-5899`), the writer in `prepare_bootstrap_state!` and
   `bootstrap_state_needs_write?`.
5. `network_access.rb:18`: add `logSources` to `WITHHELD_SCENARIO_KEYS`.
6. `scripts/scenario-schema.json` (`logSources`), `scripts/validate_scenario.rb` (reads
   `ops_log_events.rb`), `tools/playtest/verify-run.rb --ops-log`.
7. Tests (section 11): helper unit tests, the `EVENTS`/`KINDS` spec with the 400-byte ceiling
   check, the secret-guard walk, the clock controller test through `PUT /sync_state`.

**L1b: this plan's rows**

1. `ops_log_events.rb`: register the `badge_*`, `signin_*` and `session_*` events.
2. `game.rb`: calls in `start_login_session!`, `record_login_failure!`, `add_login_lockout!`,
   `attempt_login!` (both refusals, each with its `r&.stored?` save), `logout_session!`,
   `lock_session!`; the new reader `rfid_requires_card(lock)` beside `rfid_lock_passes?`.
3. `games_controller.rb#unlock`: `already_open` for every rfid request; the granted and refused
   badge rows, the refused one with its `r&.stored?` save.
4. `scenarios/test_ops_logs/`: a door, a sign-in PC, a `gameClock`, a `logSources` block. Controller
   tests on a re-read game; the scripted playtest; `README_scenario_design.md` feature index and
   `docs/ACCESS_AND_NETWORKS.md` (A24, write side).

**L2a: the reader**

1. `ops_log.rb`: `log_rows_for_client`, the `rev` digest.
2. `games_controller.rb`: extract `container_reach_refusal(located)` from `#container` and call it
   from both routes; the `log_rows` action and its `set_game` entry; `config/routes.rb` next to
   `get 'keyring'` (`:60`).
3. `api-client.js`: `logRows`.
4. New `public/break_escape/js/minigames/ops-log/ops-log-minigame.js`; register it in
   `minigames/index.js`; the `ops_log_terminal` branch in `interactions.js`; `sourceRoute` in
   `sourceExtras()` and the type in `container-minigame.js`; the texture at `game.js:905`; the
   lighting entry at `lighting.js:434`. Add the new module to the copy lists of
   `test/js/patch-panel.test.mjs` and `test/js/social-authenticator-wiring.test.mjs`, which copy
   `minigames/index.js`.
5. `scripts/minigame-data-schemas.json`: the `ops_log_terminal` entry.
6. The reader in `test_ops_logs`; JS tests, playtest, live proof; docs (A24, read side).

**L2b: seed rows and anomalies**

Seed rows and their validator checks; `anomaly.rowId` and the flag flow in the viewer; the graph
note node in `generate_dungeon_graph.rb`; a seeded anomaly in `test_ops_logs` and its playtest.

**L3: network and share rows**

1. `ops_log_events.rb`: `net_*` and `share_folder_opened`; `KINDS` entries for `jack`, `ap`, `share`.
2. `network_access.rb`: calls in `plant_device!`, `unplug_device!`, `join_network!`.
3. `games_controller.rb#container`: the `share_folder_opened` call on the admitted share branch
   (`:639-653`), `once: true`, with its `r&.stored?` save; `Game#session_admitting(scope)`.
4. `test_ops_logs`: a jack, an access point and a share with a folder; tests; docs.

**Files other plans also touch:**

| File | Also touched by | Where they meet |
|---|---|---|
| `lib/break_escape/ops_log_events.rb` | every plan that writes rows | each adds its own lines to `EVENTS` and its kinds to `KINDS` in its own stage; one line per event keeps merges to adjacent-line conflicts |
| `game.rb` | S3, S5a, S5c, S8 (sign-in order) | `attempt_login!` and `start_login_session!`; L1b lands first (section 3) |
| `games_controller.rb` | every plan's routes | the `set_game` and `with_game_lock` lists (`:27`, `:103`) conflict on every merge; `#container` is also edited by S5a (`admin_profile_read`) after `container_reach_refusal` is extracted in L2a |
| `network_access.rb` | S1 to S3, S5a | `WITHHELD_SCENARIO_KEYS` (`:18`), the implant path (`:535`) |
| `app/models/break_escape/ops_log.rb` (`secret_values`) | S5b, S7, S8 (new secrets) | each plan that adds a secret field adds it to `OpsLog.secret_values` in its own stage |
| `config/routes.rb`, `scenario-schema.json`, `minigame-data-schemas.json`, `validate_scenario.rb`, `generate_dungeon_graph.rb`, `minigames/index.js`, `interactions.js`, `README_scenario_design.md`, `docs/ACCESS_AND_NETWORKS.md` | most plans | append-only edits in each plan's own stage |

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
def write_log_row!(event, as:, where:, result: 'ok', detail: nil, once: false, save_limit: nil)
# => OpsLog::Result, or nil
```

| Argument | Type | Meaning |
|---|---|---|
| `event` | String | a `snake_case` name registered in `OpsLog::EVENTS` (13.5): `signin_ok`, `network_swept`, `mfa_prompt_sent` |
| `as` | Hash or nil | the identity the system recorded, in one of four forms (below), or nil. Required keyword, so a caller states nil on purpose |
| `where` | `{ kind:, id: }` or nil | the place, of a kind in 13.5. nil for an event with no place. Required keyword |
| `result` | String | one word from the event's registered list (13.5) |
| `detail` | Hash or nil | at most 4 keys, each registered on the event with a typed rule (13.5) |
| `once` | Boolean | write only the first time this game sees the same event, `as`, `where`, `result` and `detail`. Checked against a small set of once-keys (13.2 step 4), never by scanning rows, so an evicted row is not written again. Refused (a malformed call) with `as: { typed: }`, so player text never feeds the set |
| `save_limit` | Integer or nil | for a branch with no save of its own: the most calls for this event at this place (`event` and `where`, whatever `as` holds) that may store. Past it the call is dropped: nothing changes and it answers nil, so nothing is saved. Counted in a stored map (13.2 step 4), not by looking at rows, so neither the merge window nor eviction can reopen a spent limit. nil: no limit |

The four forms of `as`, each checked against the scenario (a value that does not resolve makes
the call malformed, 13.2 step 2):

| Form | Value | Rule |
|---|---|---|
| `{ account: }` | a username | must be an account the scenario declares; at most 32 characters |
| `{ npc: }` | an NPC id | must be an NPC in the scenario; a card or record tied to one person |
| `{ card: }` | an item id | must be an rfid card or clone item in the scenario; a card with no single holder |
| `{ typed: }` | text as the player entered it | the only free text a row may hold: stripped of control characters, cut to 32 characters, then by whole characters until its JSON form is at most 96 bytes, a cut value marked `cut: true` and shown with a trailing `~`. Stored for the player's own username input only, never for text the server holds |

`OpsLog::Result` answers three questions about one call:

| Method | True when |
|---|---|
| `appended?` | at least one source gained a new row |
| `merged?` | at least one source raised an existing row's `n` |
| `stored?` | `appended? \|\| merged?`: the stored log changed, so a branch with no save of its own must save |

The helper returns nil when nothing could change: the scenario has no `logSources`,
`scenario_data` is not loaded, no source takes the event, the call is malformed, or `once: true`
found the row's key already in the once-key set, or `save_limit` is spent for the event and
place. In a scenario with no `logSources` every call answers nil, so a branch that saves only on
`r&.stored?` adds no save there.

Stored row, in `player_state['opsLog'][source_id]`:

```json
{ "seq": 17, "event": "signin_ok", "as": { "account": "j_price" },
  "where": { "kind": "pc", "id": "reception_pc" }, "result": "ok",
  "detail": { "method": "password", "route": "local" },
  "elapsedMs": 734000, "serverMs": 1763550000000 }
```

A row that absorbed repeats (13.2 step 5) also carries `"n": 4` and `"last": [elapsedMs,
serverMs]`, the times of the latest repeat. Measured with `to_json.bytesize`, the row above is
204 bytes.

**The 400-byte cap, by calculation.** Every value in a row has a fixed ceiling, and a
value past it makes the call malformed (13.2 step 2): an id 40 characters from
`[A-Za-z0-9_.:-]`, an account 32, a typed username 96 bytes plus `"cut":true`, an alias 4,
a count 1 digit, `seq` 6 digits, `elapsedMs` 9 (seven days), `serverMs` 13, a code the
longest in its list. Filled to every ceiling with `n` at 99999, the largest rows the registered
events can build are:

| Event | Ceiling-filled content | Bytes |
|---|---|---|
| `technique_used` | 32-character account, 40-character host, 40-character technique, alias, `grant`, `access` | 386 |
| `signin_refused` (blocked) | 96-byte typed username with `cut`, 40-character PC, `kind` | 391 |
| `helpdesk_request` (blocked) | 96-byte typed username with `cut`, 40-character desk, `what` | 385 |
| `share_folder_opened` | account, 40-character share, 40-character folder | 366 |
| `network_swept` | 40-character network, 40-character `from` | 300 |
| `host_scanned` | 40-character host, 40-character `from` | 296 |

So `from`, the foothold a sweep or scan ran from, fits with about 100 bytes to spare. A spec
test builds this ceiling-filled row for every registered event, siblings' included, and fails
any registration whose largest row passes 400 bytes; the helper's run-time 400-byte check is
then a guard that should never fire.

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
   rule, a `count` included (it is checked against its maximum in production too). Then the
   **secret guard**, in test and development only. `OpsLog.secret_values(game)` is this module's
   own list, built from the scenario's real secret fields and the game's issued values: account
   and NPC passwords, credential values, PINs and the `requires` of every pin, password or other
   code lock (a key or rfid lock's `requires` names an item, which a row may name), wifi keys and
   other key material, hashes, MFA seeds, issued second-step codes and matching numbers, and
   helpdesk verification answers. It holds no display names, ids or usernames: whether a row may
   show a network's, share's or file's name is the "nothing unearned" rule (13.3), tested on its
   own. The match is exact: each string value under `as` (other than `typed`), `where` and
   `detail` is compared with each secret, and each count with each numeric secret; counters and
   times (`seq`, `n`, `elapsedMs`, `serverMs`) are not scanned. A mismatch or a hit raises
   `ArgumentError` in test and development, so a typo or a leak fails that plan's own tests. In
   production the checks other than the guard still run: a mismatch writes nothing and logs one
   `Rails.logger.warn` line naming the event, so a typo can never turn a game route into a 500.
   `tools/playtest/lib/access_leak_scanner.rb` keeps its own redaction list unchanged and reads
   `OpsLog.secret_values` only to scan `/log_rows` bodies, with its whole-token rule for short
   values.
3. **Sources.** Finds the sources that take the event. A source's `events` entry is an exact name
   or a prefix wildcard (`signin_*`, `mfa_*`). A row with no place lands only in a source that
   names the event exactly. A source's `where` filter admits the place by room or by id: a door's
   room is its id; a PC, object, desk, jack or access point's room is the one that holds it
   (`login_scope_of(id)[:room_id]`, `game.rb:3182`); `where.objects` admits a place whose id is
   listed; a host, network or share matches only `where.places` (4.1). None: nil.
4. **Once and the save counter.** With `once: true`, the helper takes a 12-hex-character digest
   of the event, `as`, `where`, `result` and `detail`; if `player_state['opsLogOnce']` holds it,
   the call answers nil. With `save_limit: k`, it takes a 12-hex-character digest of the event and
   `where` only; if `player_state['opsLogSaves']` maps it to `k` or more, the call answers nil.
   Both are checked before anything is built, and both are written only in step 6, once the call
   has stored.
5. **Merge.** Builds the row: the next `opsLogSeq` (assigned under the game lock, so order is
   exact), the game time estimate (13.4) and `serverMs`. For each source: if one of that
   source's 10 newest rows has the same event, `as`, `where`, `result` and `detail`, it adds 1 to
   that row's `n` (absent means 1, stops at 99999) and sets `last`, instead of appending. Looking
   back 10 rows means refusals sent in turn (A, B, A, B) merge into their own rows. Merging
   bounds rows, not saves: eleven distinct rows sent in rotation never find their own row in the
   window and append each time, which is why a branch with no save of its own is bounded by
   `save_limit`, never by this step.
6. **Append, evict, record.** Otherwise it appends the row. While that source holds more than its
   `maxRows`, it evicts one row from that source, taking the first class that has one, and in
   classes 1 to 3 never the first row of its event in that source:
   1. the oldest refusal row (result other than `ok` or `granted`) with `n` above 1;
   2. the oldest other refusal row;
   3. the oldest `ok` or `granted` row (a `signin_lockout`, result `ok`, sits here);
   4. the oldest row of all, firsts included.
   Each eviction removes one row and each call appends at most one per source, so after the call
   the source holds at most `maxRows`; class 4 always has a row whenever the source is over its
   cap, so first rows are evicted last, not never. They survive a flood whenever `maxRows` is at
   least the number of events the source takes, which the validator warns about otherwise. The
   sources' caps sum to at most 300 (4.1, clamped once when the helper reads the block), and rows
   are at most 400 bytes, so the store never passes 300 rows or 120 KB; a whole-`opsLog` check at
   128 KB stays as a guard that evicts from the source being appended to. Rows in other sources
   are never touched. Seed rows (4.2) live in the scenario, so nothing evicts them. A row two
   sources take is stored in each.
   When any source stored: with `once: true` the digest is added to `opsLogOnce` (at most 256,
   oldest dropped; a dropped digest lets that one row be written and saved once more, and since
   once-keys never hold typed text, only a mission with over 256 distinct once-rows could reach
   it); with `save_limit` the digest's count in `opsLogSaves` goes up by 1. `opsLogSaves` holds at
   most 256 entries of a 12-character key and a count under 100, about 5 KB. It is never evicted:
   when full, a call with a new key is dropped like a spent one. Its keys come from validated
   places only, never from `as`, so typed text cannot fill it, and a spent count stays spent
   whatever happens to the rows.
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
  the caller's own state check), merged repeats (step 5), or a cap the feature already enforces
  (a lockout's `maxAttempts`, an MFA request cap). Merging and eviction bound rows; `maxRows` is
  the last line of defence, not the bound.
- **Saves.** Each row in a table says what saves it. A route that already saves after the call
  needs nothing more. A branch that saves nothing today saves only when `r&.stored?`, and is
  bounded by `once:` (a key with no player text) or by `save_limit:` per event and place, never
  by merging, which a rotation of distinct rows defeats (step 5).
- **Typed identities.** `as: { typed: }` is never written with `once:`. On a branch whose only
  save is the row's, it is written with `save_limit:`, so made-up usernames cost at most that
  many saves per place and cannot churn the once-set. Every result of one event records a typed
  username the same way, whether or not it is an account.
- **No secret, by type.** A detail value is a registered code, an id that resolves to a known
  thing, a server-made alias, or, as the one numeric exception, a `count` no larger than its
  registered maximum (at most 9, checked in production), too small to carry a PIN, a code or a
  two-digit matching number (13.5). No rule admits free text, so a password, hash, PIN, code,
  key, MFA number, security answer or file content has no field to land in. The only free text
  in a row is `as.typed`, the player's own username input. The guard of step 2 is a second,
  separate check in tests (section 11 runs the walk with it off to prove the type rules alone).
- **Nothing unearned.** A row the player can read never tells them something they have not earned.
  Ids and display names of findings, techniques, networks, shares, folders, services, hosts and
  accounts may be stored and shown, because the player reaches the row only by acting on that
  thing; they are not secrets for the guard. Each detail key says how it is shown (13.5): as its
  value, as the display name the player already sees for that id, or not at all (`show: false`,
  kept for server-side readers).
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
method runs on a sync with no `scenario_data`), and refreshed again when a page loads (5.1)
unless it was set less than ten seconds ago, so a reload loop is not a save loop. The
helper stamps `saved elapsedMs + (now - opsLogClockAt)`, capped at five minutes past the saved
value. The client clock runs on wall time (`game-clock.js:79-80`: `startTime = now - savedElapsed`),
so this matches the screen while the page is open. A client that reloads before every action
can hold the stamp at the saved value; time is display only, so nothing depends on it. A client can push `elapsedMs` forward (it only grows, clamped to seven days by
`MAX_SCENARIO_CLOCK_ELAPSED_MS`, `game.rb:5835`, applied at `:5853`); that changes the shown time
and nothing else.

Plans whose features have no game clock (S1 to S3, S5, S7) pass no time: the helper stamps every
row. S8's code and prompt expiry run on server wall time and stay its own; no expiry reads a row.
Seed rows (4.2) have no `seq`; they are always listed before play rows.

### 13.5 Registering an event

The event list lives in `lib/break_escape/ops_log_events.rb`, a plain Ruby file with no Rails
dependency, so the validator reads the same list the helper checks against. Each plan adds its
events there, one line per event, in the build stage that adds the action:

```ruby
EVENTS = {
  'signin_ok'       => { label: 'SIGN_IN',   places: %w[pc],      results: %w[ok], detail: { 'method' => %w[password credential], 'route' => %w[local remote] } },
  'mfa_prompt_sent' => { label: 'MFA_PUSH',  places: %w[pc],      results: %w[ok] },
  'network_swept'   => { label: 'NET_SWEEP', places: %w[network], results: %w[ok], detail: { 'from' => { id: 'foothold' } } },
  'share_folder_opened' => { label: 'SHARE_OPEN', places: %w[share], results: %w[ok], detail: { 'folder' => { id: 'object' } } },
  'credentials_harvested' => { label: 'HARVEST', places: %w[pc], results: %w[ok], detail: { 'count' => { count: 9 }, 'hashes' => { count: 9 } } },
  # ...
}.freeze
```

- `places`: the `where.kind` values allowed; `[]` or absent means the event has no place.
- `results`: the closed list for this event, lowercase words of 2 to 16 letters. Shared words:
  `ok`, `fail`, `denied`, `granted`, `refused`, `blocked`, `expired`.
- `detail` rules, four types and no other:

  | Rule | Admits | Shown as |
  |---|---|---|
  | Array of codes | one of the listed lowercase codes, at most 16 characters | the code |
  | `{ count: max }` | an Integer from 0 to `max`; `max` at most 9, and the `EVENTS` spec fails a larger one or any bare integer type. A value above `max` is a malformed call in production as well | the number |
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
`login_scope_of`, and its room is the room that holds it. So a later event for a step that sits
on any lock (a door, a container, a file) registers `places: %w[door object]` with no change
here. A `host` or `network` row matches a source only through `where.places`; a `pc` is the sign-in PC
object, so it has a room. A host the core plan also treats as a sign-in PC is logged as `pc`. A
kind with no display-name lookup yet, or an id that no longer resolves when the row is read, is
shown as `-`.

A spec test walks `EVENTS` and `KINDS` and fails on a malformed entry, a place kind or `{ id: }`
kind with no `KINDS` entry, a numeric rule other than `{ count: max }` with `max` at most 9, or an event whose ceiling-filled row (13.1) passes 400 bytes, so a
sibling plan's registration is checked by this plan's suite as soon as it lands.

### 13.6 Who really acted, later

The parked defence work (`ACTORS_AND_DEFENCE_PLAN_OUTLINE.md`, S12d) will need to tell the player
from an NPC who used the same identity. It adds an optional stored key, `by` (an NPC id), written
only when someone other than the player acts. A row without `by` means the player did it, so every
row stored before then already reads correctly and no data migration is needed. The browser row is
built from an allow-list of fields (section 7), so `by` is withheld from play without any change to
the reader.

### 13.7 Every row the other plans write, in this shape

Taken from each plan's own section 13. Detail values follow the typed rules of 13.5.

| Plan | Event | `as` | `where` | `result` | `detail` | Bound | Saved by |
|---|---|---|---|---|---|---|---|
| S1 | `network_swept` | nil | `network` | ok | `from` (`{ id: 'foothold' }`) | once (caller: first sweep only) | `POST /network/scan` |
| S1 | `host_scanned` | nil | `host`, `pc` | ok | `from` (`{ id: 'foothold' }`) | once per host (caller) | `POST /network/scan` |
| S2 | `service_checked` | nil | `host`, `pc` | ok | `service` (`{ id: 'service' }`, shown by name) | one per check that adds a finding; findings per service are capped by the scenario | `POST /network/check` |
| S2 | `finding_confirmed` | nil | `host`, `pc` | ok | `finding` (`{ alias: 'finding' }`), `status` (`confirmed`, `false`), `how` (`quiet`, `probe`) | once per finding (caller) | `POST /network/confirm` |
| S2 | `network_alerted` | nil | `network` | ok | none | once per network (caller: the request that sets the alert global) | the confirm or technique route that raised the noise |
| S3 | `technique_refused` | nil | `host`, `pc` | refused | `finding` (alias), `technique` (`{ id: 'technique' }`), `reason` (the closed list of 422 codes) | merged repeats; a quiet refusal also `save_limit: 10` per host | a noisy refusal: the route's own save. A quiet refusal saves nothing today: `save!` only when `r&.stored?`, written with `save_limit: 10` (the core plan matches) |
| S3 | `technique_used` | `{ account: }` for a session grant, nil for a credential grant | `host`, `pc` | ok | `finding`, `technique`, `grant` (`session`, `credential`), `access` (`user`, `admin`; session grants only) | one per grant (caller: a repeat with `already: true` writes nothing) | `POST /network/technique` |
| S5a | `admin_profile_read` | `{ account: }` (the session's) | `pc` | ok | `profile` (`{ id: 'profile' }`) | `once: true`: one per PC, profile and account | `GET /container`, which saves nothing of its own: `save!` only when `r&.stored?` |
| S5a | `usb_install_overridden` | `{ account: }` | `pc` | ok | `device` (the closed list of `usbClass` values the schema allows) | merged repeats | the implant action and plant proof, which already save (`network_access.rb:535`) |
| S5b | `credentials_harvested` | `{ account: }` | `pc` | ok | `count`, `hashes` (`{ count: 9 }`: pairs added, and how many of them are hashes) | one per collect that adds a pair; a repeat adds none and writes nothing | the collect route, which saves when a pair is added |
| S8a | `mfa_challenge` | `{ account: }` | `pc` | ok | `route` (the shared route codes, below) | merged repeats | the save that stores the pending record |
| S8a | `mfa_code_ok` | `{ account: }` | `pc` | ok | none | one per sign-in | the save that writes the session |
| S8a | `mfa_code_wrong` | `{ account: }` | `pc` | fail | none | merged repeats; S8's three code caps | the save that stores the counts |
| S8a | `mfa_code_locked` | `{ account: }` | `pc` | locked | none | merged repeats; at most one per thirty wrong codes and five minutes | the save that stores `closedAt` |
| S8a | `mfa_prompt_sent` | `{ account: }` | `pc` | ok | none | merged repeats: a run of prompts is one row with a count; 20 per attempt | the save that stores the request count |
| S8a | `mfa_prompt_approved` | `{ account: }` | `pc` | ok | `approver` (`owner`, `held_phone`, `own_phone`) | one per sign-in | the save that writes the session |
| S8a | `mfa_prompt_denied` | `{ account: }` | `pc` | denied | none | one per attempt | the save that drops the record |
| S8a | `mfa_expired` | `{ account: }` | `pc` | expired | none | one per attempt | the save that drops the record |
| S8b | `helpdesk_request` | `{ typed: }`, the username as asked, for every result and whether or not it is an account | `desk` | granted, refused, blocked | `what` (`password`, `mfa`) | granted, refused: merged repeats and the desk's `maxTries`. Blocked: `save_limit: 10` per desk, whatever username is typed | granted, refused: the save that stores the grant or the tries. Blocked changes nothing else: `save!` only when `r&.stored?` |
| S8b | `account_password_reset`, `account_mfa_reenrolled` | `{ account: }` | `desk` | ok | `agent` | once per account (caller: first grant) | the save that stores the grant |

- **S8c, a second step on any lock**, adds no events: the seven `mfa_*` events also register
  `places: %w[pc door object]`, take `as: { npc: id }` (the existing form; the id must resolve to
  a scenario NPC) for an owner with no account, and `mfa_challenge` gains a `method` detail from a
  fixed code list. All three pass the typed rules; the largest such row (40-character NPC, 40-character
  object, a 16-character code) is below the `technique_used` ceiling of 13.1. Such a row lands by
  the ordinary source rule of 13.2 step 3: a door's room is the door's id and a loose or nested
  object's room is the room that holds it, so it goes to every source that takes the event and
  whose `where` admits that room or object (or has no `where`); with no such source the helper
  answers nil and no row is written.
- A step up to admin is S3's `technique_used` with `access: admin`; no other row records it.
- A refused sign-in caused by an account's kind (a local account at a domain-only PC, and the
  reverse) is this plan's `signin_refused` (13.8). The privilege plan registers its optional
  `kind` detail (`local`, `domain`) in S5c and writes no row of its own for it.
- **Why a sweep records `from` and a sign-in does not.** A network sensor sees traffic arriving
  from a machine, so a sweep or scan row naming the foothold it came from is what that log would
  hold. A sign-in row records the account and the PC signed in to; the route the request took is
  reduced to one `route` code from a list shared by `signin_ok` and `mfa_challenge` (`keyboard`,
  `foothold`, `from`, `relay`), so the row never names the source machine.
- `helpdesk_request` names no agent: one NPC serves one desk, so the desk names the agent.
  `account_password_reset` and `account_mfa_reenrolled` keep `agent` (`{ id: 'npc' }`).
- `start_login_session!` called with `via: 'technique'` (S3) writes `technique_used` from S3's
  method and no `signin_ok`.
- **S6, the command-line skin, writes no rows**: a skin adds no moves, and each move writes the
  same row whichever skin sent it.
- **S7, hashes and offline cracking, writes no rows.** Recovering a password from a hash is
  offline work on the attacker's own machine and leaves nothing in the organisation's logs, which
  is part of why stolen hashes are so dangerous. Obtaining a hash is logged where it happens: a
  harvest by `credentials_harvested` (its `hashes` count), a hash file on a share by opening the
  folder that holds it (`share_folder_opened`, 13.8), which reads exactly as any other folder.

### 13.8 This plan's rows

Sources match these by prefix: `badge_*`, `signin_*`, `session_*`, `net_*`, `share_*`.

| Event | Who (`as`) | Where | When | Result | Detail | Bound | Saved by |
|---|---|---|---|---|---|---|---|
| `badge_swipe` | holder's own keycard: `{ npc: holder }`; a copy: the holder when the request carried one card, none when several, always the holder with `showCardHolder` (question 1); a card with no single holder: `{ card: id }` | `door`, `object` | `#unlock`, rfid lock in force, target not open, `validate_unlock` passed (5.1) | ok | none | one per unlock | the unlock's save |
| `badge_swipe` | none | `door`, `object` | `#unlock` refusal: rfid lock in force, target in reach, an rfid card held (5.1) | denied | none | merged repeats; `save_limit: 10` per door | `save!` only when `r&.stored?` |
| `signin_ok` | `{ account: }` | `pc` | `start_login_session!`, `via` `password` or `credential` | ok | `method` (`password`, `credential`), `route` (shared codes, 13.7) | one per sign-in | both callers |
| `signin_fail` | `{ typed: }` | `pc` | `record_login_failure!` | fail | none | merged repeats; `maxAttempts` | the method's save |
| `signin_lockout` | `{ typed: }` | `pc` | `add_login_lockout!` | ok | none | one per lockout | `record_login_failure!` |
| `signin_refused` | `{ account: }` | `pc` | `attempt_login!` `notPermitted` | denied | `kind` (`local`, `domain`; S5c) | merged repeats; needs the right password, which costs a save per wrong try | `save!` only when `r&.stored?` |
| `signin_refused` | `{ typed: }` | `pc` | `attempt_login!` locked-out return | blocked | none | `save_limit: 10` per PC, whatever username is typed | `save!` only when `r&.stored?` |
| `session_end` | `{ account: }` | `pc` | `logout_session!`, explicit sign-out only | ok | none | one per session | the method's save |
| `session_lock` | `{ account: }` | `pc` | `lock_session!`, past its refusals | ok | none | merged repeats | the method's save |
| `net_link_up`, `net_link_down` | none | `jack` | `plant_device!`, `unplug_device!` (L3) | ok | none | one per plant or unplug | the methods' saves |
| `net_wifi_join` | none (an access point logs a device) | `ap` | `join_network!` (L3) | ok | none | one per join | the method's save |
| `share_folder_opened` | `{ account: }` of the oldest session that admits the share; nil when only a foothold admits it | `share` | `#container`, admitted share branch (L3) | ok | `folder` (`{ id: 'object' }`; absent when the share itself is opened) | `once: true`: one per folder and account | `save!` only when `r&.stored?` |

Code lines and branch detail for each row are in 5.1.

**`share_folder_opened` records opening a folder, not reading a file.** A folder's contents, file
text included, leave the server in the `/container` response, and the reader opens each file in
the browser with no further request, so the server knows only that this account opened this
folder. The row never names a file. Question 3 (section 15) asks whether to add a per-file
read request instead; this plan is written to its recommendation, the folder row. When several
sessions admit a share, the row names the account of the session signed in first (its stored
start time), the same answer on every open, through `session_admitting(scope)`, a new sibling of `session_admits?`
that returns the admitting PC id.

Claimed sessions (`via: 'claim'`) write no sign-in row but do write `session_end` and
`session_lock`: an account signing out with no sign-in before it is the trace a careful defender
would notice.

Never in these rows: the password; which account a typed username belongs to (section 7); which
of several held copies passed, unless the source opts in; the foothold, relay or source PC id; a
network key; a device id; a file name or content.

No row: `claim_login_session!` (`game.rb:3527`, using an open screen), `clone_card`
(`games_controller.rb:1655`), `implant_foothold!` (`network_access.rb:468`). A real system records
nothing for these, and the gap is the lesson.

## 14. Cross-plan requests

1. **All plans that write rows:** list rows in the shape of 13.7, with Bound and Saved by columns;
   register events in `lib/break_escape/ops_log_events.rb`, one line each, in the stage that adds
   the action, and any new kind in `OpsLog::KINDS`; call `write_log_row!` in the request that
   holds the game lock, on the validated branch, before its `save!`, never from a sync merge; on a
   branch with no save of its own, save only when `r&.stored?`. Each `test_ops_*` scenario that
   asserts rows declares a `logSources` block and a `gameClock`, and its tests call
   `assert_ops_log_holds_no_secret`. Each plan that adds a secret field adds it to
   `OpsLog.secret_values` (12). A branch with no save of its own is bounded by `save_limit:` per event
   and place (13.1), never by merging; a number in a detail is `{ count: max }`, `max` at most 9.
2. **Orchestrator, ordering:** L1a lands before the first stage of every other ops plan; L1b lands
   before the S3, S5a, S5c and S8 stages that edit `attempt_login!` and `start_login_session!`.
3. **OPS_CORE (S1 to S3):** the four core points are taken as the core plan writes them: place kind
   `pc` as well as `host`, `network_alerted`, detail `finding` as the alias, `how` and `grant` as
   closed lists, and `from` (it fits the 400-byte cap by 13.1). Still open: ids the core plan
   stores in rows (host, network, service, technique, foothold) are at most 40 characters, which
   its section 0 already sets for services and techniques; the core plan states the same for host
   and network ids, or its validator refuses a longer one in a scenario with `logSources`. The core
   plan fills the `network`, `host`, `service` and `technique` entries of `KINDS`. `from` on the scan rows
   is `{ id: 'foothold' }` (this plan's kind), not `host`. A quiet `technique_refused` is written
   with `save_limit: 10` and saves only on `r&.stored?`; a noisy one keeps the route's save. The
   core plan confirms a service id holds no space, or `service_checked` rows are malformed.
4. **OPS_PRIVILEGE_ACCOUNTS (S5):** rename `usb_override` to `usb_install_overridden` and
   `credentials_collected` to `credentials_harvested`; the refused sign-in is this plan's
   `signin_refused`, for which S5c registers the optional `kind` detail. `admin_profile_read` uses
   `once: true` and saves only on `r&.stored?`; its bound is one per PC, profile and account. Over-long
   ids make the call malformed, the helper does not cut them. The harvest
   detail is `count` and `hashes`, each `{ count: 9 }` (the plan confirms a collect adds at most
   nine pairs, else splits the row): a per-account list of NPC ids and kinds has no
   typed rule and would break the four-key cap. The `device` detail is the closed list of
   `usbClass` values the schema allows. The section 13 table header is printed twice.
5. **OPS_MFA_HELPDESK (S8):** the rows are taken as that plan writes them (`mfa_code_locked`,
   `own_phone`, no `request` or `credential` detail, `helpdesk_request` with `as: { typed: }` and
   no `agent`), with three changes for that plan: the blocked `helpdesk_request` branch uses
   `save_limit: 10` per desk, not `once: true` (`once:` is refused with a typed identity); the
   `by` detail on `mfa_prompt_approved` is renamed `approver`, since `by` is reserved (13.6); and
   `route` uses the shared list `keyboard`, `foothold`, `from`, `relay` (13.7). A later stage that
   puts a second step on any lock uses the `door` and `object` place kinds (13.5). The `desk`
   entry of `KINDS` is that plan's.
6. **OPS_CRACKING (S7):** writes no rows (13.7). Any row list left in that plan's section 13 is to
   be removed, and its section says so in one line.
7. **OPS_REALISM_SKIN (S6):** writes no rows. The parity run compares
   `log_rows_for(source_id, compare: true)` (5.1) across skins.
8. **Orchestrator:** `log_rows_for` and the stored key name `by` (13.6) are reserved for the
   parked defence debrief and the investigator idea; no plan should repurpose them.

## 15. Open questions for the user

1. **A copied card in the door log.** The server hides which held copy opened a door
   (`game.rb:4064-4069`).
   - (a) A badge row from a copy shows no identity unless a source opts in with
     `showCardHolder: true`. By default the log then tells a copy from the real card (the real
     card shows its holder, a copy shows `-`), which no real door controller can do, and the
     lesson "a cloned card logs under the victim's name" appears only where an author opts in.
   - (b) Always show the card holder. Realistic, and teaches the lesson everywhere, but when the
     player holds several copies the row tells them which one the access list admitted.
   - (c) Never show an identity on a badge row. Safe, and loses the lesson.
   - (d) Show the holder when the request carried one card only, `-` when it carried several. The
     row then tells nothing the player did not choose to test, and a player who swipes with one
     copy sees it log as its owner.
   **Recommend (d):** it keeps the existing guarantee where it matters (several copies at once) and
   teaches the lesson by default; `showCardHolder` stays for a mission that wants (b).
2. **Rows from NPCs and office life.** Staff badge swipes, sign-ins and workarounds happen in the
   browser's office-life systems, so the server cannot vouch for them.
   - (a) Leave them out until the defence work, which needs a server-side NPC model anyway.
   - (b) Add a client-reported NPC row route now, best effort, for atmosphere.
   **Recommend (a):** seed rows give a lived-in log for now, and investigator missions can author
   their insider's trail as seed rows.
3. **What a share row records.** The reader opens a folder's files in the browser with no request
   of their own, so the server sees only the folder open.
   - (a) Record the folder open, as `share_folder_opened`, once per folder and account.
   - (b) Add a small per-file read request, so each opened file is logged by name: a change to
     the built share reader and one request per file, and the row then names a file.
   **Recommend (a):** it needs no change to the share reader, keeps file names out of rows, and
   a hash file on a share still leaves a trace (the folder that holds it). This plan is written
   to (a).
