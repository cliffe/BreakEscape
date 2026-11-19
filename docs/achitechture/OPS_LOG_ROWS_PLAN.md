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
| L1a | The helper and the event list, with no call sites: `lib/break_escape/ops_log_events.rb` (`EVENTS`, `KINDS`, the detail rule types), the `OpsLog` concern with `write_log_row!`, its checks, merging, eviction and caps (row, source and byte); the `logSources` block in the schema and validator; the clock stamp (seed, sync line, bootstrap refresh); the shared secret guard (`OpsLog.secret_values`, `assert_ops_log_holds_no_secret`) and `verify-run.rb --ops-log`. Proof: unit tests over a fixture scenario and a `PUT /sync_state` controller test. Nothing is written in play yet. | S |
| L1b | This plan's own rows: badge swipes (granted and refused), sign-in, failed sign-in, refused sign-in, lockout, sign-out, screen lock, each at its call site with its save rule (13.8). Creates `test_ops_logs` with a door, a sign-in PC, a `gameClock` and a `logSources` block, and no reader. Proof: controller tests on a re-read game, a scripted playtest that syncs once before a logged action, then checks with `verify-run.rb --ops-log` that the rows are there, hold no secret and carry a time within a few seconds of the on-screen clock. | M |
| L2a | `GET /log_rows` with the reach check `/container` uses; the `ops-log` viewer and `ops_log_terminal` type, read only (table, filters, detail, refresh); its schema entry, sprite mapping and lighting entry; the reader added to `test_ops_logs`; scripted playtest and live proof. | M |
| L2b | Seed rows, `anomaly.rowId`, the flag flow and its actions; validator checks on seed rows; the dungeon graph note node. | S |
| L3 | Network rows (device in, device out, Wi-Fi join) and the share file read row. The share row needs shares (slice 9.3a, built); it does not wait for S1. | S |

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
| `where.places` | array of `"kind:id"` | optional; for places with no room (a host, network, share, domain) |
| `showCardHolder` | boolean, default `false` | section 7: whether a badge row opened by a copied card names the card's holder |
| `maxRows` | integer 10 to 150, default 50 | this source's cap on stored play rows; the sum over all sources is at most 300. The helper clamps both at run time too, because a stored scenario snapshot is not re-validated when a game starts |
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

No new fields. Network events (`net_*`) and `share_file_read` (section 13.8) become valid in
`events`. A share is a place with no room, so a source takes its rows by `where.places`
(`"share:finance_share"`) or with no `where`.

## 5. Engine behaviour

### 5.1 Server

A new concern, `app/models/break_escape/ops_log.rb` (`BreakEscape::OpsLog`), included in `Game`.

**Writing.** `write_log_row!` works as section 13.2 sets out: no-op without `logSources` or when
`scenario_data` is not loaded; checked against `OpsLog::EVENTS` and the secret guard (raise in test
and development, warn and skip in production); per-source matching, merging, eviction by class and
the row, source and byte caps. It never saves. Every call site is in a request that holds the game
lock, and each one either already saves after the call or adds one save, gated on the helper's
answer (13.2 step 8). Sections 13.7 and 13.8 say which, row by row.

**The clock stamp** (13.4) is written in three places, none of which needs to read
`scenario_data` where it is not loaded:

- `initialize_player_state` (`game.rb:7517`) seeds `player_state['opsLogClockAt']` with the server
  time when the scenario has `logSources`. The key existing is the opt-in marker from then on.
- `merge_scenario_clock!` (`game.rb:5846-5899`) has one caller, `sync_state`, which loads the game
  with `SYNC_STATE_COLUMNS` only, without `scenario_data` (`games_controller.rb:2442`, comment at
  `:2436-2441`). Its new line is gated on `player_state.key?('opsLogClockAt')`, never on the
  scenario: when it stores a new `elapsedMs` and the key exists, it sets the key to the server time.
  A scenario without logs never has the key, so the line is a no-op for it.
- `prepare_bootstrap_state!` (`game.rb`, called from `GamesController#scenario` at
  `games_controller.rb:309`) gains one writer, and `bootstrap_state_needs_write?` answers true for
  it: when the key exists, it is set to the server time. A loading page restarts its clock from the saved `elapsedMs`
  (`game-clock.js:79-80`), so the server's estimate must restart there too, or rows written after
  a long break and before the first sync are stamped up to five minutes ahead of the screen. The
  cost is one save per page load, only in a scenario with `logSources`; others take the existing
  no-write path.

A game started before L1a has no key. The first helper write (which has `scenario_data`) seeds it,
and the clock line runs from then on.

**L1b call sites** (rows and save rules in 13.8):

- `start_login_session!` (`game.rb:4388`): `signin_ok` when `via` is `password` or `credential`,
  with `method` and `route` detail. Every other `via` writes nothing and does not raise: `claim`
  (using a screen someone left signed in is invisible to the log, which is the lesson) and S3's
  `technique`, whose own `technique_use` row S3 writes from its method. Both callers save
  (`game.rb:3497`, `credential_login.rb:76-80`).
- `record_login_failure!` (`game.rb:4333`): `signin_fail`, `as: { typed: }` from the key's username
  part. The method receives `key = "pcId|normalised"` (`game.rb:3481-3483`), so the row holds the
  normalised username, cut to 32 characters by the helper (13.1). The same row for an account and a
  non-account username, so the log never says whether a username exists. The method saves.
- `add_login_lockout!` (`game.rb:4366`), after the early return at `:4368`: `signin_lockout`. The
  method takes no PC argument; `where` is the PC id parsed from the key. Its caller,
  `record_login_failure!`, saves.
- `attempt_login!` (`game.rb:3444`), two refusals that save nothing today:
  - the `notPermitted` branch (`:3489-3492`, a right password at a PC that does not admit the
    account): `signin_denied`, result `denied`, `as: { account: }`. The branch gains a `save!`
    whenever the helper stored something. Reaching it needs the account's real password, and a
    wrong password already costs a save per attempt (`record_login_failure!`), so this adds no new
    kind of cost.
  - the locked-out return (`:3484`, before any account lookup): `signin_denied`, result `blocked`,
    `as: { typed: }`, written with `merge_limit: 1`. The branch saves only when a row was appended,
    so it costs one save per locked-out PC and username, and every later hammered attempt merges in
    memory, is not saved and stays free, as it is today. The row is shown once, with no count.
- `logout_session!` (`game.rb:3660`): `session_end`, only when the deleted record is a Hash, so a
  forged `/logout` at a PC with no session writes nothing. Only an explicit sign-out writes it. The
  method saves.
- `lock_session!` (`game.rb:3836`): `session_lock`, past its "no session" and expiry refusals.
  Claimed sessions write both rows (13.8). The method saves.
- `GamesController#unlock` (`games_controller.rb:1211`), in the request that holds the game lock.
  The row keys on what the server resolved, never on the request's `method`:
  - `already_open` is computed for every rfid request, not only one that sent card ids
    (`:1223-1224`). An already-open target writes nothing. A target whose lock is not in force
    (`game.rb:4754-4755` passes it with no check) writes nothing either, so a swipe that needed no
    card never logs as one.
  - Granted: the target resolves (`room_data` or `find_scenario_object`), its lock is in force with
    `lockType` `rfid`, it was not open, and `validate_unlock` passed. `badge_swipe` result `ok` is
    written inside the transaction (`:1280`), after the route-room refusal at `:1273-1276`, and
    before `unlock_room!` (`game.rb:135`) or `unlock_object!` (`game.rb:691`), whose own save
    persists it. A refused request therefore leaves no row behind, and the path gains no save.
  - `as` on a granted swipe, from server state only. At an access-list lock,
    `rfid_unlock_card_answer` (`game.rb:4070-4081`): a `cardId` gives the card's single holder as
    `{ npc: }`, or `{ card: id }` when the card names no holder or several (a shared card carries
    every holder, `game.rb:3981-3989`); `viaCopy` gives the holder when the request carried one
    card id and `-` when it carried several, unless the source sets `showCardHolder` (always the
    holder); this default is question 1 in section 15. At a lock with no access list,
    `rfid_lock_passes?` requires a held card or recorded clone named in `requires`
    (`game.rb:3997-4004`, `rfid_requires_held?` at `:4015`). A new reader,
    `rfid_requires_card(lock)`, returns the item that check matched, built from the same loop, and
    the row names it under the same rule: an own keycard by its holder, a clone as a copy.
  - Refused (`:1252`): only when the target resolves to an rfid lock in force (with or without an
    access list: both are server-checked), the target is in reach (a door into a room connected to
    an unlocked room, or an object in an unlocked room and not in an unpromoted route room), and
    the player holds at least one rfid card or clone in server state (`held_rfid_cards`,
    `game.rb:3951`; at an access-list lock at least one sent id must be one of them, as
    `rfid_passing_card_id` requires at `:4054-4061`). A player with no card cannot log a refusal.
    `badge_swipe` result `denied`, no identity, merged with `merge_limit: 10`. The path gains a
    `save!` only when the helper stored something, so hammering one door costs at most ten saves,
    after which the count shows as "x10+" and further requests are free again.

**L3 call sites:** `plant_device!` (`net_link_up`), `unplug_device!` (`net_link_down`),
`join_network!` on success (`net_wifi_join`); each saves after the call (`network_access.rb:282`,
`:316`, `:392`). `implant_foothold!` and `clone_card` write nothing.

`GamesController#container` (`games_controller.rb:626`), the admitted share branch (`:639-653`),
writes `share_file_read`: after `session_admits?`, the sign-in-object refusal and `path_unlocked?`
have passed, once for each file item in the contents the response serves, with
`as: { account: }` from the session that admits the share, `where: { kind: 'share', id: }` from
`located[:scope][:id]`, and the file's id in detail (`{ id: 'file' }`, shown by the file's name). A
file's text leaves the share in that response (the reader opens it in the browser with no further
request), so the serving of the folder that holds it is the server-side moment of the read. Each
row is written with `once: true`, so a re-opened folder writes nothing. The route is on the
game-lock list (`:103`) and reloads the game (`:630`); it gains one `save!`, only when the helper
appended at least one row. The row never says what the file holds, and a file that holds a hash
reads exactly as any other file.

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

Extending log-filter was the first choice, because its job is already "browse a log, filter it,
perhaps flag one row". Its code is fixed to its two authored types in more places than columns:

- `_applyFilters` matches a fixed list of category ids and passes every row for any other id
  (`log-filter-minigame.js:729-746`), so EVENT, IDENTITY and LOCATION filters would do nothing.
- The TIME filter reads the hour from characters 11 to 13 of a dated stamp (`:749-757`); an
  `HH:MM` or `Tue 07:42` stamp gives NaN and matches every row.
- The row tint has its own inline matcher (`:650-656`) that compares `entry.account` with
  `anomaly.account`; with an anomaly that names only a row id both are undefined, so every row is
  tinted.
- The detail panel always shows LOOK UP IP and INVESTIGATE ACCOUNT and always shows the flag button
  (`:812-850`).
- Selection is tracked by index into `_logEntries` (`:764-768`), which a refetch replaces;
  `stateOverrides` are applied before any fetch could happen (`:245-264`); flag state is one boolean.

Guarding each of these by type would touch most of a 1441-line file used by `sis01_healthcare` and
`sis02_energy`. A separate viewer keeps those two missions safe by construction, and its own code is
small. siem does not fit either: it is a timed triage game with random alerts, browser storage and
its own Cancel button (section 2). The parked defence console may later raise siem alerts from the
same rows; nothing here prevents that.

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
  3. The player has reached it, judged exactly as `GET /container` judges a container. The
     branch logic at `games_controller.rb:638-669` moves into one private method,
     `container_reach_refusal(located)`, which both routes call, so the two cannot drift:
     - `located = @game.login_scope_of(object_id)` (`game.rb:3176-3204`) gives the object, its
       room, its scope (nil, a sign-in PC, a profile or a resource) and the chain of containers
       above it;
     - a resource scope (a share): `session_admits?(scope)` (`game.rb:3260-3277`), then
       `path_unlocked?(path + [object])` (`game.rb:3310-3313`);
     - a sign-in PC or profile scope: `session_admits?(scope)` and `path_unlocked?(path + [object])`,
       and under a sign-in PC also `folder_route_allowed?(scope id)` (`games_controller.rb:3185`),
       which judges the route the request names;
     - no scope (a reader in a room or a cabinet): `room_unlocked?(room_id)`, not
       `object_in_unpromoted_route_room?(object_id)` (`game.rb:323`), and
       `path_unlocked?(path + [object])`.
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
body), a row's `seq`, `serverMs`, `lastServerMs`, raw ids, any detail key registered
`show: false`, and any stored key added later (such as `by`, 13.6). No row carries a secret (13.3).

**Only through `GET /log_rows`, for a reached reader**, each row built from an allow-list of
exactly these keys:

| Field | Value |
|---|---|
| `id` | seed rows: their authored id (`s1`); play rows: a six-character digest of `[source id, seq]`, opaque, so gaps between ids say nothing about rows in other sources |
| `elapsedMs` or `at` | play rows: the game time estimate (13.4); seed rows: the authored `at` |
| `event` | the event's `label` (`BADGE`, `SIGN_IN`, `LOCKOUT`, ...) |
| `as` | an account's username, an NPC's or card's display name, the normalised typed username, or `-` |
| `where` | the display name of the place (room, object, PC, host, desk ...), or `-` |
| `result` | the result word, upper-cased, with `n` when above 1 |
| `detail` | the shown detail keys, each as value or display name, joined as `key: value` |

A test asserts the answer's row keys are exactly these seven, so a stored field added by another
plan is withheld unless this list is changed on purpose.

Rules that keep a row from telling the player something new:

- **A copied card.** A badge row opened by a copy names the holder only when the request carried
  one card; with several held cards sent at once it shows `-`, the same guarantee as
  `rfid_unlock_card_answer` (`game.rb:4064-4069`). A source with `showCardHolder: true` always
  names the holder: an author's choice for a mission where reading the door log is how the player
  learns whose card got in. Question 1 in section 15 asks the user to confirm this default.
- **A failed sign-in** shows only the normalised username, never whether it is an account. An
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
| `opsLogClockAt` | integer, server epoch ms | one number | `initialize_player_state` (seed), `merge_scenario_clock!` and `prepare_bootstrap_state!` (refresh, only while the key exists), or the first helper write in a game started before L1a | never |

- `opsLogClockAt` is created at game start for a scenario with `logSources`; `opsLog` and
  `opsLogSeq` on the first write. None is in `ACCESS_STATE_DEFAULTS` (`game.rb:3021`), so a game
  whose scenario has no `logSources` never gains any of them.
- None is on `reset_player_state!`'s preserved keys (`game.rb:120-122`, and `new_session` slices
  the same way, `games_controller.rb:269`), so a reset drops the log. A reset re-runs
  `initialize_player_state`, which seeds the clock key again. `opsLogSeq` restarts at 1, and play
  row ids repeat across a reset; the viewer's `rev` is a digest of the rows, so a stale rev cannot
  match the new log by accident.
- **Byte caps.** The row caps alone do not bound the size, because a row's biggest field is text
  the player types. So the helper bounds each field and each row:
  - a typed username is stripped of control characters, cut to 32 characters, and then cut by
    whole characters until its JSON form is at most 96 bytes (32 four-byte characters fit, so the
    second cut bites only on escaped text). It is stored as typed, and a cut value carries
    `"cut": true` in `as`, shown with a trailing `~`;
  - an id in `as`, `where` or detail longer than 64 characters, or outside `[A-Za-z0-9_.:-]`,
    makes the call malformed (13.2 step 2): no row, a raise in test and development;
  - a built row over 400 bytes is not written (the same malformed-call rule). With the field caps
    above and four registered detail keys a row cannot reach it, so this is a guard against a
    registration mistake, and a unit test builds the largest possible row and asserts it fits;
  - past 128 KB for the whole `opsLog` value (the pattern of `MAX_NPC_INK_VARIABLES_BYTES`,
    `game.rb:6142`), the helper evicts from the largest source by the eviction order in 13.2
    step 6 until the value fits. With rows at most 400 bytes and 300 rows in all this cannot
    happen either; it keeps the size claim independent of row arithmetic.
- **Where rows live, and why.** Rows stay in `player_state`. It is one jsonb column
  (`test/dummy/db/schema.rb:43`), and every `save!` rewrites it whole: on every locked action that
  changes something (`games_controller.rb:103-105`) and on any sync that changes something, which
  the clock alone forces at least every five minutes (`state-sync.js:12`); the narrow sync load
  still reads the whole column (`games_controller.rb:2442`). A full log adds at most 120 KB to
  those reads and writes, a typical one about 25 KB. Each locked action already loads the whole
  row twice with 60 to 150 KB of `scenario_data` (`games_controller.rb:855-858`), and
  `player_state` already holds keys capped at 128 KB and 512 KB (`game.rb:6142`, `:6209`), so this
  is the same class. Rows are never synced and are sent only on request with `rev`, so the delta
  rule holds. A table would cost a migration in the engine and in Hacktivity (and the shared dev
  database makes worktree migrations a hazard), and nothing in A24 needs SQL over rows. Every read
  goes through `log_rows_for` and `log_rows_for_client`, so a later move to a table, if the defence
  debrief or an investigator mission needs more than 300 rows, touches one file.
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
- A seed row with an unknown event, a result or detail the event does not allow, an `as` that is
  neither a known NPC id nor (for `signin_*` only) a username of at most 32 plain characters, a
  `where` that does not exist, a bad `at`, rows that do not ascend or end after the start time, a
  repeated `id`, or more than 100 rows.
- A seed row whose text equals any declared password or credential value (a secret written into a
  log by mistake).
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
   pass unchanged. This is the stated check that `vpn` and `ics_rdp` are unchanged.
5. The validator run over all scenarios reports no new errors or warnings (diff of its output
   before and after).

## 11. Tests

**Server unit, L1a** (`test/models/break_escape/ops_log_test.rb`):

- No `logSources`: nil, state untouched. `scenario_data` not loaded (a game fetched with
  `SYNC_STATE_COLUMNS` only): nil, no error.
- Source matching by exact name, by prefix, by `where.rooms`, `where.objects`, `where.places`; a
  placeless row lands only in a source naming it exactly; two sources, a row in each.
- Merging: an identical repeat raises `n` and the last times, and appends nothing; a repeat that
  differs in any of event, `as`, `where`, `result`, `detail` appends. **Alternation:** A, B, A, B
  twenty times leaves two rows with `n: 10` each. Fifty distinct forged failures (fifty made-up
  usernames) in a source of 50 that already holds two `ok` rows and one first-of-kind refusal row
  leave all three in place; only refusal repeats are evicted.
- `merge_limit`: with `merge_limit: 10`, the eleventh repeat answers `stored? == false` and leaves
  `n` at 10. `once: true` writes nothing and answers nil when a matching row exists anywhere in
  the source.
- Caps: a source past its `maxRows` evicts by the order in 13.2 step 6 and never touches another
  source; the run-time clamp holds for a snapshot with `maxRows: 500`; the largest legal row is at
  most 400 bytes; a 64-character typed username of four-byte characters and one of control
  characters are cut to fit 96 bytes and carry `cut: true`; an `opsLog` value forced past 128 KB is
  evicted back under it. `opsLogSeq` keeps counting.
- Malformed calls (unknown event, place kind, result, detail key, a detail value of the wrong type,
  an id over 64 characters) raise in test; with the production setting they return nil and log
  one warning.
- **Secret guard.** For every registered event, siblings' included, a call is built with each
  detail key and `as` set to each of the fixture's secret values (a password, a PIN, a credential
  value, an MFA code and number, a hash, a lock's `requires`) and to a secret-shaped string such
  as `Hunter2!` or `5f4dcc3b5aa765d6`. Every call either raises (a code or id rule rejects the
  value) or stores a row in which no secret appears; `assert_ops_log_holds_no_secret` then passes
  over `opsLog.to_json`. The test reads `EVENTS` at run time, so each event a sibling registers is
  covered the moment it lands.
- `EVENTS` and `KINDS` spec: every entry well formed (13.5); every place kind used by an event has
  a `KINDS` entry; an id that does not resolve shows as `-`.
- Time: `elapsedMs` is the saved value plus the server time since `opsLogClockAt`, capped at five
  minutes; 0 when there is no clock.
- `log_rows_for_client` rows have exactly the seven keys of section 7; `show: false` detail keys
  are absent; ids are digests, not `seq`; an account and a typed username render the same.
  `log_rows_for(..., compare: true)` has no times.

**Clock, L1a** (controller, through the real routes): a game with `logSources` has
`opsLogClockAt` from game start; after `PUT /sync_state` with a new `elapsedMs`, a re-read game
(`Game.find(id).player_state`) has the key moved to the sync's time; a row written 30 seconds later
is stamped within two seconds of `elapsedMs + 30000`. On a scenario without `logSources` the same
sync leaves no key and makes no extra query for `scenario_data`. This test fails on a design that
decides on the scenario inside `merge_scenario_clock!`, because the sync loads no `scenario_data`.
A `GET /scenario` refreshes the key in a game that has it and writes nothing in one that does not.

**Server, per call site, L1b and L3** (extend `test/controllers/break_escape/access_model_login_test.rb`,
`access_model_rfid_test.rb`, the session tests and the shares tests). Every assertion reads a
re-read game (`Game.find(id).player_state`), never the in-memory object, so a missing save fails:

- Each event writes exactly one row on its validated branch, and none on each other refusal.
- `start_login_session!` with `via` `claim` or `technique` writes no `signin_ok` and does not raise.
- A failed sign-in for a real account and for a made-up username write rows that differ only in
  the username.
- `signin_denied`: a right password at a PC that does not admit the account stores a `denied` row;
  an attempt after a lockout stores one `blocked` row with a typed identity, and ten more attempts
  cause no further save (asserted by `updated_at` and the row's `n`).
- Badge rows: a forged `rfid` unlock at an already-open door, at a lock not in force, at a door
  with another lock type, at an unreached door, by a player holding no card, or naming a missing id
  writes nothing; a requires-only lock logs granted with the matched card's holder and logs a
  refusal; a granted swipe refused by the route-room check leaves no row; twenty refused swipes at
  one door leave one row with `n: 10`. A copy sent alone shows its holder; several cards sent at
  once show `-`; `showCardHolder` always shows the holder.
- `logout_session!` at a PC with no session writes nothing; a claimed session's sign-out writes
  `session_end`.
- `share_file_read`: opening a share folder writes one row per file it serves and saves; opening
  it again writes nothing and does not save; a refused open writes nothing.
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

**L1**

1. `app/models/break_escape/ops_log.rb`: `EVENTS`, `write_log_row!` with merging and per-source
   caps.
2. `game.rb`: include the concern; calls in `start_login_session!`, `record_login_failure!`,
   `add_login_lockout!`, `attempt_login!`, `logout_session!`, `lock_session!`; the
   `opsLogClockAt` line in `merge_scenario_clock!`.
3. `games_controller.rb#unlock`: `already_open` for every rfid request; the badge rows.
4. `network_access.rb:18`: add `logSources` to `WITHHELD_SCENARIO_KEYS`.
5. Schema and validator; tests; `tools/playtest/verify-run.rb --ops-log`;
   `README_scenario_design.md` feature index and `docs/ACCESS_AND_NETWORKS.md` (A24, write side).

**L2a**

1. `ops_log.rb`: `log_rows_for_client`, `log_rows_for`, rev, the reach walk.
2. `config/routes.rb` (next to `get 'keyring'`, `:60`), `games_controller.rb`: the route and its
   `set_game` entry.
3. `api-client.js`: `logRows`.
4. New `public/break_escape/js/minigames/ops-log/ops-log-minigame.js`; register it in
   `minigames/index.js`; the `ops_log_terminal` branch in `interactions.js`; the type in
   `container-minigame.js:2326-2331`. Add the new module to the copy lists of
   `test/js/patch-panel.test.mjs` and `test/js/social-authenticator-wiring.test.mjs`, which copy
   `minigames/index.js`.
5. `scripts/minigame-data-schemas.json`: the `ops_log_terminal` entry.
6. `test_ops_logs`, playtest, live proof; docs (A24, read side).

**L2b:** seed rows and their validator checks; `anomaly.rowId` and the flag flow in the viewer; the
graph note node; extend `test_ops_logs` and its playtest with a seeded anomaly.

**L3:** `network_access.rb` calls; extend `test_ops_logs` with a jack; docs.

**Files other plans also touch:** `game.rb` (S3, S5a, S5c, S8 change sign-in), `games_controller.rb`
(every plan's routes; the `set_game` and `with_game_lock` lists at `:27` and `:103` conflict on
every merge), `config/routes.rb`, `network_access.rb` (S1 to S3), `scenario-schema.json`,
`minigame-data-schemas.json`, `validate_scenario.rb`, `generate_dungeon_graph.rb`,
`minigames/index.js`, `interactions.js`, `README_scenario_design.md`,
`docs/ACCESS_AND_NETWORKS.md`. `ops_log.rb` is touched by every plan that adds events: each adds
its rows to `EVENTS` in its own stage, and that constant is where their merges meet.

## 13. Log rows this feature writes

This plan owns the one helper every ops plan writes rows through, and the storage and reading of
those rows. Sections 13.1 to 13.6 are the shared contract; 13.7 shows that every row the other
plans list can be written with it; 13.8 is this plan's own rows.

Every plan lists its rows in the brief's four columns, **Event, Who, Where, When**, and may add
**Result** and **Detail** columns. "Who" is the identity the system recorded (`as` below), and
"When" names the model method and branch that writes the row.

### 13.1 The helper

```ruby
# BreakEscape::OpsLog, included in Game (app/models/break_escape/ops_log.rb)
#
# Records one event in every declared log source that takes it. Never saves: call it in the
# model method, on a branch the server has validated, before that method's own save!.
# Never raises in production. Returns the stored row (a Hash), or nil when no source takes
# the event, the call is malformed, or the row merged into the previous one.
def write_log_row!(event, as: nil, where: nil, result: 'ok', detail: nil)
```

| Argument | Type | Meaning |
|---|---|---|
| `event` | String | a `snake_case` name registered in `OpsLog::EVENTS` (13.5), as the owning plan's table writes it: `signin_ok`, `network_swept`, `mfa_prompt_sent` |
| `as` | Hash or nil | the identity the system recorded: `{ account: username }` (an account signed in or acted under), `{ npc: id }` (a card or record tied to one person), `{ card: id }` (a card with no single holder), `{ typed: text }` (a username as entered, which may be no account), or nil |
| `where` | `{ kind:, id: }` or nil | the place. `kind` is one of `door` (id is the room), `object`, `pc`, `host`, `network`, `share`, `desk`, `jack`, `ap`, `domain`. nil for an event with no place |
| `result` | String | one word from the event's registered list. Shared words: `ok`, `fail`, `denied`, `granted`, `refused`, `blocked`, `expired`; an event may register another lowercase word of 2 to 16 letters |
| `detail` | Hash or nil | at most 4 keys, each registered on the event. A value is a String of at most 40 characters from `[A-Za-z0-9_.:@-]`, or an Integer from 0 to 99999. The serialised map is at most 160 bytes |

Stored row, in `player_state['opsLog'][source_id]`:

```json
{ "seq": 17, "event": "signin_ok", "as": { "account": "j_price" },
  "where": { "kind": "pc", "id": "reception_pc" }, "result": "ok",
  "detail": { "method": "password", "route": "local" },
  "elapsedMs": 734000, "serverMs": 1763550000000 }
```

A row that absorbed repeats (13.2 step 5) also carries `"n": 4, "lastElapsedMs": ...,
"lastServerMs": ...`. Measured with `to_json.bytesize`, the row above is 204 bytes; a row with a
32-character typed username, three detail keys and a repeat count is 297 bytes. Budgets in this
plan use 300 bytes a row.

### 13.2 What the helper does, in order

1. Returns nil when the scenario has no `logSources`. That is the whole cost for every existing
   scenario. Returns nil when `scenario_data` is not loaded (`has_attribute?(:scenario_data)`):
   `sync_state` loads only `SYNC_STATE_COLUMNS` (`games_controller.rb:2436-2442`), so a call from a
   sync merge writes nothing instead of raising `ActiveModel::MissingAttributeError`.
2. Checks the call against `OpsLog::EVENTS`: the event is registered, `where.kind` is one the event
   allows (or nil where the event allows none), the result is in its list, each detail key is
   registered and each value fits its rule. A mismatch raises `ArgumentError` in test and
   development, so a typo fails that plan's own tests. In production it writes nothing and logs one
   `Rails.logger.warn` line naming the event, so a typo can never turn a game route into a 500.
3. Finds the sources that take the event. A source's `events` entry is an exact name or a prefix
   wildcard (`signin_*`, `mfa_*`). A row with no place lands only in a source that names the event
   exactly. A source's `where` filter admits the place by room: a door's room is its id; a PC,
   object, desk, jack or access point's room is the one that holds it (`login_scope_of(id)[:room_id]`,
   `game.rb:324`); a host, network, share or domain matches only `where.places` (4.1). None: nil.
4. Builds the row: the next `opsLogSeq` (assigned under the game lock, so order is exact), the game
   time estimate (13.4) and `serverMs`.
5. For each source: if that source's newest row has the same event, `as`, `where`, `result` and
   `detail`, it adds 1 to that row's `n` (absent means 1) and sets `lastElapsedMs` and
   `lastServerMs`, instead of appending. A replayed or forged repeat therefore costs a few bytes,
   never a row.
6. Otherwise appends the row and, while that source holds more than its `maxRows`, drops that
   source's oldest play row. Rows in other sources are never touched, so a noisy source cannot push
   another source's rows out. A row two sources take is stored in each.
7. Does not save. The caller's own `save!` persists the row in the same request and game lock as
   the action it records.

### 13.3 Rules for every plan that writes rows

- **Validated events only.** Call the helper only on a branch where the server has resolved the
  target from its own data and checked the action. A row never keys on a request parameter alone.
  A request that changes nothing (a door already open, a session already ended, a replay) writes
  nothing, or merges into the previous row by step 5.
- **Bounded.** Every per-attempt event states its bound in its plan's table: once only (the caller
  checks its own state before writing, as "first time only" rows do), merged repeats (step 5), or a
  cap the feature already enforces (a lockout's `maxAttempts`, an MFA request cap). The per-source
  `maxRows` is the last line of defence, not the bound.
- **No secret.** A row never carries a password, hash, PIN, code, key, MFA number, security answer
  or the content of a file.
- **Nothing unearned.** A row the player can read never tells them something they have not earned.
  Ids of findings, techniques, networks, services, hosts and accounts may be stored, because the
  player reaches the row only by acting on that thing. Each detail key says how it is shown (13.5):
  as its value, as the display name the player already sees for that id, or not at all
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
method runs on a sync with no `scenario_data`), and refreshed again when a page loads (5.1). The
helper stamps `saved elapsedMs + (now - opsLogClockAt)`, capped at five minutes past the saved
value. The client clock runs on wall time (`game-clock.js:79-80`: `startTime = now - savedElapsed`),
so this matches the screen while the page is open, and a client cannot hold the time back by not
syncing. A client can push `elapsedMs` forward (it only grows, clamped to seven days by
`MAX_SCENARIO_CLOCK_ELAPSED_MS`, `game.rb:5835`, applied at `:5853`); that changes the shown time
and nothing else.

Plans whose features have no game clock (S1 to S3, S5, S7) pass no time: the helper stamps every
row. S8's code and prompt expiry run on server wall time and stay its own; no expiry reads a row.
Seed rows (4.2) have no `seq`; they are always listed before play rows.

### 13.5 Registering an event

Each plan adds its events to `OpsLog::EVENTS` in the build stage that adds the action:

```ruby
EVENTS = {
  'signin_ok' => { label: 'SIGN_IN', places: %w[pc], results: %w[ok],
                   detail: { 'method' => %w[password credential], 'route' => %w[local remote] } },
  'mfa_prompt_sent' => { label: 'MFA_PUSH', places: %w[pc], results: %w[ok],
                         detail: { 'request' => :integer } },
  'network_swept' => { label: 'NET_SWEEP', places: %w[network], results: %w[ok],
                       detail: { 'from' => { id: 'host' } } },
  # ...
}.freeze
```

- `places`: the `where.kind` values allowed; `[]` means the event has no place.
- `results`: the closed list for this event.
- `detail` rules: an Array (closed list of codes), `:integer`, `:text` (the String rule in 13.1),
  or `{ id: kind }` (an id shown by the display name of that kind of thing). Add `show: false` to
  keep a key for server-side readers only, for example `{ id: 'finding', show: false }`.
- `label`: the upper-case word shown in the EVENT column.

A spec test walks `EVENTS` and fails on a malformed entry, so a sibling plan's registration is
checked by this plan's suite as soon as it lands.

### 13.6 Who really acted, later

The parked defence work (`ACTORS_AND_DEFENCE_PLAN_OUTLINE.md`, S12d) will need to tell the player
from an NPC who used the same identity. It adds an optional stored key, `by` (an NPC id), written
only when someone other than the player acts. A row without `by` means the player did it, so every
row stored before then already reads correctly and no data migration is needed. The browser row is
built from an allow-list of fields (section 7), so `by` is withheld from play without any change to
the reader.

### 13.7 Every row the other plans list, in this shape

| Plan | Event | `as` | `where` | `result` | `detail` | Bound |
|---|---|---|---|---|---|---|
| S1 | `network_swept` | nil | `network` | ok | `from` (foothold host id, by name) | once (caller) |
| S1 | `host_scanned` | nil | `host` | ok | `from` | once (caller) |
| S2 | `service_checked` | nil | `host` | ok | `service` (text) | once (caller) |
| S2 | `finding_confirmed` | nil | `host` | ok | `finding` (id, by name), `status` (code) | once per status (caller) |
| S3 | `technique_refused` | nil | `host` | refused | `finding`, `technique` (ids), `reason` (closed list, never free text) | merged repeats |
| S3 | `technique_used` | `{ account: }` when a session is granted, else nil | `host` | ok | `finding`, `technique`, `access` (`user`, `admin`) | once per technique and host (caller) |
| S5 | `admin_profile_read` | `{ account: }` (session's) | `pc` | ok | `profile` (account username) | once (caller) |
| S5 | `usb_install_overridden` | `{ account: }` | `pc` | ok | none | merged repeats |
| S5 | `credentials_harvested` | `{ account: }` | `pc` | ok | `count` (integer) | merged repeats |
| S5 | `hash_obtained` | `{ account: }` | `pc`, `host` or `share` | ok | `of` (account username) | once per hash (caller) |
| S5 | `domain_account_locked_out` | `{ typed: }` (normalised username) | `domain` | ok | none | once per lockout |
| S8 | `mfa_challenge` | `{ account: }` | `pc` | ok | `route` (`keyboard`, `foothold`, `from`), `credential` (kind code) | merged repeats |
| S8 | `mfa_code_ok`, `mfa_code_wrong` | `{ account: }` | `pc` | ok, fail | none | merged repeats; S8's attempt cap |
| S8 | `mfa_prompt_sent` | `{ account: }` | `pc` | ok | `request` (integer) | S8's request cap |
| S8 | `mfa_prompt_approved` | `{ account: }` | `pc` | ok | `by` (`owner`, `held_phone`) | one per request |
| S8 | `mfa_prompt_denied`, `mfa_expired` | `{ account: }` | `pc` | denied, expired | none | one per request |
| S8 | `helpdesk_request` | `{ account: }` (the account asked about) | `desk` | granted, refused, blocked | `what` (closed list), `agent` (desk NPC id, by name) | merged repeats |
| S8 | `account_password_reset`, `account_mfa_reenrolled` | `{ account: }` | `desk` | ok | `agent` | one per grant |

- A step up to admin is S3's `technique_used` with `access: admin`; there is no separate
  escalation row.
- `hash_obtained` belongs to the action that obtains the hash: S5's collect action, or reading a
  hash file on a share (`where.kind: share`). Cracking itself (S7) writes no rows: recovering a
  password from a hash is offline work on the attacker's own machine and leaves nothing in the
  organisation's logs, which is part of why stolen hashes are so dangerous.
- S6 (the command-line skin) writes no rows: a skin adds no moves, and each move writes the same row
  whichever skin sent it.
- `start_login_session!` called with `via: 'technique'` (S3) writes `technique_used` from S3's
  method and no `signin_ok` (13.8).

### 13.8 This plan's rows

Sources match these by prefix: `badge_*`, `signin_*`, `session_*`, `net_*`.

| Event | Who (`as`) | Where | When | Result | Detail |
|---|---|---|---|---|---|
| `badge_swipe` | the player's own keycard: `{ npc: holder }`; a copy: the holder when the request carried one card, none when several, always the holder with `showCardHolder` (question 1, section 15); a card with no single holder: `{ card: id }` | `door`, `object` | `GamesController#unlock` (`games_controller.rb:1211`): the server resolves the target, its `lockType` is `rfid`, it was not open before the request, `validate_unlock` passes; written before `unlock_room!`/`unlock_object!` (`game.rb:135`, `:691`), whose save persists it | ok | none |
| `badge_swipe` | none | `door`, `object` | same route, refusal at `:1252`, only when the target resolves to an rfid lock with an access list, card ids were sent, and the target is in reach (a door into a room connected to an unlocked room; an object in an unlocked room). This path gains one `save!` | denied | none (merged repeats) |
| `signin_ok` | `{ account: username }` | `pc` | `start_login_session!` (`game.rb:4388`) with `via` `password` or `credential`. Any other `via` (`claim`, `technique`, a later one) writes nothing and never raises | ok | `method` (`password`, `credential`), `route` (`local`, `remote` when a foothold, `from` or relay is given) |
| `signin_fail` | `{ typed: }` the normalised username from the failure key (`game.rb:3481-3482`) | `pc` | `record_login_failure!` (`game.rb:4333`), before its `save!` | fail | none (merged repeats; shown as "x3") |
| `signin_lockout` | `{ typed: }` | `pc` (parsed from the key's PC part; no signature change) | `add_login_lockout!` (`game.rb:4366`), after the early return at `:4368` | ok | none |
| `signin_denied` | `{ account: }` | `pc` | `attempt_login!` `notPermitted` branch (`game.rb:3490-3493`), and an attempt on a locked-out username (`:3484`, result `blocked`); see question 3 in section 15 | denied, blocked | none (merged repeats) |
| `session_end` | `{ account: }` (the session's) | `pc` | `logout_session!` (`game.rb:3660`), only when the deleted record is a Hash. Explicit sign-out only: replacement, Switch user, pruning, token expiry and unplugging write nothing | ok | none |
| `session_lock` | `{ account: }` | `pc` | `lock_session!` (`game.rb:3836`), past its "no session" and expiry refusals | ok | none |
| `net_link_up`, `net_link_down` | none | `jack` | `plant_device!` (`network_access.rb:233`), `unplug_device!` (`:290`), success (L3) | ok | none |
| `net_wifi_join` | none (an access point logs a device, not a person) | `ap` | `join_network!` (`network_access.rb:355`), success (L3) | ok | none |

Claimed sessions (`via: 'claim'`) write no sign-in row but do write `session_end` and
`session_lock`: an account signing out with no sign-in before it is the trace a careful defender
would notice.

Never in these rows: the password; which account a typed username belongs to (`signin_fail` and
`signin_lockout` read the same for an account and a non-account username, matching the generic
`LOGIN_INCORRECT` reply, `game.rb:3079`); which of several held copies passed, unless the source
opts in; the foothold, relay or source PC id; a network key; a device id.

No row: `claim_login_session!` (`game.rb:3527`, using an open screen), `clone_card`
(`games_controller.rb:1655`), `implant_foothold!` (`network_access.rb:468`). A real system records
nothing for these, and the gap is the lesson.

## 14. Cross-plan requests

1. **All plans:** keep the brief's four columns (Event, Who, Where, When) and add Result and
   Detail where a row has them, in the shape of 13.7; state each per-attempt row's bound (13.3);
   register events in `OpsLog::EVENTS` in the stage that adds the action; call `write_log_row!` in
   the model method, on the validated branch, before its `save!`, never from a sync merge; add a
   row assertion and a `logSources` block to that plan's `test_ops_*` scenario. 13.7 is this plan's
   reading of each sibling's rows: each sibling confirms or corrects its line.
2. **Orchestrator, ordering:** L1 lands before S1's first row, S3, S5a and S8, which edit the same
   sign-in methods; until then siblings call a no-op stub with the 13.1 signature.
3. **OPS_CORE (S1 to S3):** `start_login_session!` with `via: 'technique'` writes no sign-in row;
   S3's method writes `technique_used`, which also stands for a step up to admin (`access: admin`).
   `technique_refused` takes `reason` from a closed list, not free text. Reading a log through a
   session on a host is a follow-on of this plan once S1 hosts land.
4. **OPS_PRIVILEGE_ACCOUNTS (S5):** drop `privilege_escalated` (covered by S3's row). Own
   `hash_obtained` for the collect action. A domain sign-in passes through `start_login_session!`,
   so it gets `signin_ok` with `where.kind: pc`; `domain_account_locked_out` uses
   `where.kind: domain` and `as: { typed: }`, so it reads the same for any username. S5's table
   says "actor": rename that column Who, as the brief has it.
5. **OPS_CRACKING (S7):** writes no rows: cracking is offline and leaves nothing in the
   organisation's logs. Its `hash_obtained` row moves to the action that obtained the hash (S5's
   collect action; a hash file read on a share, `where.kind: share`, by whichever plan owns share
   reads, which the orchestrator assigns).
6. **OPS_MFA_HELPDESK (S8):** `by` on an approval is a detail code (`owner`, `held_phone`); the
   desk NPC is the `agent` detail key; the caller's claimed identity appears in neither `as` nor
   detail. Prompt and code rows are bounded by S8's own caps; S8's expiry stays on server wall
   time and never reads a row.
7. **OPS_REALISM_SKIN (S6):** the parity run compares `log_rows_for(source_id, compare: true)`
   (section 5.1) across skins.
8. **Orchestrator:** `log_rows_for` and the stored key name `by` (13.6) are reserved for the
   parked defence debrief and the investigator idea; no plan should repurpose them.

## 15. Open questions for the user

Settled in this plan, with these defaults: refused badge swipes are logged with no identity,
bounded by merging (13.8); a row's time is the server-side estimate of game time, with `seq` for
order (13.4); a log is read only at a reached reader object, and reading through a session on a
host follows once S1 hosts exist (section 6). Checking an investigator's flagged row on the server
is left to the parked investigator work.

1. **A copied card in the door log.** The server hides which held copy opened a door
   (`game.rb:4064-4069`).
   - (a) A badge row from a copy shows no identity unless a source opts in with
     `showCardHolder: true`. Cost: by default the log tells a copy from the real card (the real
     card shows its holder, a copy shows `-`), which no real door controller can do, and the
     headline lesson "a cloned card logs under the victim's name" appears only where an author
     opts in.
   - (b) Always show the card holder. Realistic, and teaches the lesson everywhere, but when the
     player holds several copies the row tells them which one the access list admitted.
   - (c) Never show an identity on a badge row. Safe, and loses the lesson entirely.
   - (d) Show the holder when the request carried one card only, `-` when it carried several. The
     row then tells nothing the player did not choose to test, and a player who swipes with one
     copy sees it log as its owner.
   **Recommend (d):** it keeps the existing guarantee where it matters (several copies at once) and
   teaches the lesson by default; `showCardHolder` stays for a mission that wants (b).
2. **Where rows are kept.** At 200 to 300 bytes a row (measured), the 300-row ceiling is 60 to
   90 KB.

   | | (a) map of capped lists in `player_state` | (b) new `break_escape_ops_log_rows` table |
   |---|---|---|
   | write cost | the whole jsonb column rewritten on every save, about every locked action and at least every five minutes, plus up to 90 KB read on each narrow sync load | one small insert per row |
   | atomic with the action | yes, same save | yes, same transaction under the game lock |
   | cap | needed: per source, 300 in all | none needed; a per-game limit for safety |
   | reset, new session | dropped with the state for free | needs a delete in `reset_player_state!` and `new_session` |
   | defence debrief, investigator queries | Ruby scan of one game | SQL, across games if wanted |
   | cost to land | none | a migration in the engine and in Hacktivity; it must be run on the shared dev database by its owner, never from a worktree (a past `db:migrate` from a worktree wiped every game) |

   **Recommend (a) for A24:** no migration, per-source caps keep one noisy source from erasing
   another, and a typical mission stays near 25 KB. Move to (b) when the defence debrief or an
   investigator mission needs more rows or cross-game queries; the helper's signature does not
   change, so only `ops_log.rb` moves.
3. **Attempts that are not permitted, or come after a lockout.** A correct password at a PC that
   does not admit the account is refused with `notPermitted` (`game.rb:3490-3493`); an attempt on a
   locked-out username returns before anything is written (`:3484`).
   - (a) Write `signin_denied` (result `denied`, and `blocked` after a lockout), repeats merged.
     The reply has already told the client, so the row adds nothing the player did not learn; a
     defender would see the hammering after a lockout.
   - (b) Write nothing for either, as today's refusal counts nothing.
   **Recommend (a)**, which is what L1 builds unless the user says otherwise: these are the classic
   audit events and the merge keeps them bounded.
4. **Rows from NPCs and office life.** Staff badge swipes, sign-ins and workarounds happen in the
   browser's office-life systems, so the server cannot vouch for them.
   - (a) Leave them out until the defence work, which needs a server-side NPC model anyway.
   - (b) Add a client-reported NPC row route now, best effort, for atmosphere.
   **Recommend (a):** seed rows give a lived-in log for now, and investigator missions can author
   their insider's trail as seed rows.
5. **May a row the player caused be the anomaly a puzzle asks for?** For example "find your own
   swipe at 07:42 and flag it", or "spot the lockout you triggered".
   - (a) No: `anomaly.rowId` names seed rows only. Play rows can be dropped by their source's cap,
     and a puzzle must never depend on them.
   - (b) Yes, by an authored match (`anomaly: { event, where }`) against play rows, with the source
     sized so the row cannot be dropped and the flag checked on the server. More teaching value
     ("see yourself in the log"), and more work: a server flag check and a guaranteed row.
   **Recommend (a) for A24**, with (b) planned alongside the first investigator mission.
