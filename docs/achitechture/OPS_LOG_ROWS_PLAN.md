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
| L3 | Network rows (device in, device out, Wi-Fi join) and the share folder row (`share_file_read`, one per folder and account opened). The share row needs shares (slice 9.3a, built); it does not wait for S1. | S |

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
  `technique`, whose own `technique_used` row S3 writes from its method. Both callers save
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
    account): `signin_refused`, result `denied`, `as: { account: }`. The branch gains a `save!`
    whenever the helper stored something. Reaching it needs the account's real password, and a
    wrong password already costs a save per attempt (`record_login_failure!`), so this adds no new
    kind of cost.
  - the locked-out return (`:3484`, before any account lookup): `signin_refused`, result `blocked`,
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
have passed, one row for the folder the response serves, with `as: { account: }` from the session
that admits the share, `where: { kind: 'share', id: }` from `located[:scope][:id]`, and the
folder's id in detail (`folder`, `{ id: 'object' }`, shown by its name; absent when the request
opened the share itself). The row records opening the folder, not reading a file: every file's
text leaves the server in that response and the reader opens each one in the browser with no
further request, so the server cannot know which file was read. It is written with `once: true`,
so it is one row per folder and account, and a re-opened folder writes nothing. The route is on
the game-lock list (`:103`) and reloads the game (`:630`); it gains one `save!`, only when
`r&.stored?`. The row never names a file or says what one holds, so a folder that holds a hash
reads exactly as any other folder.

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
body), a row's `seq`, `serverMs`, the server time in `last`, raw ids, any detail key registered
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
| `opsLogOnce` | array of 12-hex-character digests (13.2 step 4) | at most 256 entries, about 4 KB, oldest dropped past that | `write_log_row!`, on a `once: true` call that stores | never |
| `opsLogClockAt` | integer, server epoch ms | one number | `initialize_player_state` (seed), `merge_scenario_clock!` and `prepare_bootstrap_state!` (refresh, only while the key exists), or the first helper write in a game started before L1a | never |

- `opsLogClockAt` is created at game start for a scenario with `logSources`; `opsLog` and
  `opsLogSeq` on the first write, `opsLogOnce` on the first `once: true` write. None is in `ACCESS_STATE_DEFAULTS` (`game.rb:3021`), so a game
  whose scenario has no `logSources` never gains any of them.
- None is on `reset_player_state!`'s preserved keys (`game.rb:120-122`, and `new_session` slices
  the same way, `games_controller.rb:269`), so a reset drops the log. A reset re-runs
  `initialize_player_state`, which seeds the clock key again. `opsLogSeq` restarts at 1, and play
  row ids repeat across a reset; the viewer's `rev` is a digest of the rows, so a stale rev cannot
  match the new log by accident.
- **Byte caps.** The row caps alone do not bound the size, because a row's biggest field is text
  the player types. So the helper bounds each field and each row:
  - a typed username is stripped of control characters, cut to 32 characters, and then cut by
    whole characters until its JSON form is at most 96 bytes (32 plain characters take 34 bytes,
    so the second cut bites only on multi-byte or escaped text). It is stored as typed, and a cut
    value carries `"cut": true` in `as`, shown with a trailing `~`;
  - an id in `as`, `where` or detail longer than 40 characters, or outside `[A-Za-z0-9_.:-]`, or
    an account username longer than 32, makes the call malformed (13.2 step 2): no row, a raise in
    test and development. The validator refuses such an id in a scenario with `logSources`
    (section 9), so an author learns before play;
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
- In a scenario with `logSources` only: an id a row can store (a room, object, NPC, item, host,
  network, share, desk or access point id) longer than 40 characters or outside
  `[A-Za-z0-9_.:-]`, or an account username longer than 32 (section 8).
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
  leave all three in place; only the later refusal rows are evicted.
- `merge_limit`: with `merge_limit: 10`, the eleventh repeat answers `stored? == false` and leaves
  `n` at 10. `once: true` writes nothing and answers nil when its digest is in `opsLogOnce`, even
  after the first row has been evicted; the 257th distinct once-row drops the oldest digest.
  With no `logSources`, a `once: true` call answers nil and the caller adds no save.
- Caps: a source past its `maxRows` evicts by the order in 13.2 step 6 and never touches another
  source; the run-time clamp holds for a snapshot with `maxRows: 500`; the largest legal row is at
  most 400 bytes; a 64-character typed username of four-byte characters and one of control
  characters are cut to fit 96 bytes and carry `cut: true`; an `opsLog` value forced past 128 KB is
  evicted back under it. `opsLogSeq` keeps counting.
- Malformed calls (unknown event, place kind, result, detail key, a detail value of the wrong type,
  an id over 40 characters, an account over 32, an `as` or `{ id: }` value that does not
  resolve) raise in test; with the production setting they return nil and log
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
- `signin_refused`: a right password at a PC that does not admit the account stores a `denied` row;
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
- `share_file_read`: opening a share folder writes one row for the folder, naming no file, and
  saves; opening it again as the same account writes nothing and does not save; another account
  opening it writes its own row; a refused open writes nothing.
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
2. `app/models/break_escape/ops_log.rb`: `write_log_row!`, `OpsLog::Result`, the checks, once-key
   set, merging, eviction by class, the row, source and byte caps (13.2); `log_rows_for` and its
   compare form. `game.rb`: include the concern.
3. The secret guard: move `AccessLeakScanner#secret_values`
   (`tools/playtest/lib/access_leak_scanner.rb:387`) into a module the scanner and `OpsLog` both
   load; `OpsLog.secret_values(game)`; the test helper `assert_ops_log_holds_no_secret`.
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

1. `ops_log_events.rb`: `net_*` and `share_file_read`; `KINDS` entries for `jack`, `ap`, `share`.
2. `network_access.rb`: calls in `plant_device!`, `unplug_device!`, `join_network!`.
3. `games_controller.rb#container`: the `share_file_read` call on the admitted share branch
   (`:639-653`), `once: true`, with its `r&.stored?` save.
4. `test_ops_logs`: a jack, an access point and a share with a folder; tests; docs.

**Files other plans also touch:**

| File | Also touched by | Where they meet |
|---|---|---|
| `lib/break_escape/ops_log_events.rb` | every plan that writes rows | each adds its own lines to `EVENTS` and its kinds to `KINDS` in its own stage; one line per event keeps merges to adjacent-line conflicts |
| `game.rb` | S3, S5a, S5c, S8 (sign-in order) | `attempt_login!` and `start_login_session!`; L1b lands first (section 3) |
| `games_controller.rb` | every plan's routes | the `set_game` and `with_game_lock` lists (`:27`, `:103`) conflict on every merge; `#container` is also edited by S5a (`admin_profile_read`) after `container_reach_refusal` is extracted in L2a |
| `network_access.rb` | S1 to S3, S5a | `WITHHELD_SCENARIO_KEYS` (`:18`), the implant path (`:535`) |
| `tools/playtest/lib/access_leak_scanner.rb` | S5b, S7, S8 (new secrets) | each plan that adds a secret adds it to the shared list, which both the guard and the leak check read |
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
def write_log_row!(event, as:, where:, result: 'ok', detail: nil, once: false, merge_limit: nil)
# => OpsLog::Result, or nil
```

| Argument | Type | Meaning |
|---|---|---|
| `event` | String | a `snake_case` name registered in `OpsLog::EVENTS` (13.5): `signin_ok`, `network_swept`, `mfa_prompt_sent` |
| `as` | Hash or nil | the identity the system recorded, in one of four forms (below), or nil. Required keyword, so a caller states nil on purpose |
| `where` | `{ kind:, id: }` or nil | the place, of a kind in 13.5. nil for an event with no place. Required keyword |
| `result` | String | one word from the event's registered list (13.5) |
| `detail` | Hash or nil | at most 4 keys, each registered on the event with a typed rule (13.5) |
| `once` | Boolean | write only the first time this game sees the same event, `as`, `where`, `result` and `detail`. Checked against a small set of once-keys (13.2 step 4), never by scanning rows, so an evicted row is not written again |
| `merge_limit` | Integer or nil | the most a merged row's count `n` may reach; nil means the default ceiling of 99999 |

The four forms of `as`, each checked against the scenario (a value that does not resolve makes
the call malformed, 13.2 step 2):

| Form | Value | Rule |
|---|---|---|
| `{ account: }` | a username | must be an account the scenario declares; at most 32 characters |
| `{ npc: }` | an NPC id | must be an NPC in the scenario; a card or record tied to one person |
| `{ card: }` | an item id | must be an rfid card or clone item in the scenario; a card with no single holder |
| `{ typed: }` | text as the player entered it | the only free text a row may hold: stripped of control characters, cut to 32 characters and to 96 bytes of JSON, a cut value marked `cut: true` (section 8). Stored for the player's own username input only, never for text the server holds |

`OpsLog::Result` answers three questions about one call:

| Method | True when |
|---|---|
| `appended?` | at least one source gained a new row |
| `merged?` | at least one source raised an existing row's `n` |
| `stored?` | `appended? \|\| merged?`: the stored log changed, so a branch with no save of its own must save |

The helper returns nil when nothing could change: the scenario has no `logSources`,
`scenario_data` is not loaded, no source takes the event, the call is malformed, or `once: true`
found the row's key already in the once-key set. In a scenario with no `logSources` every call
answers nil, so a branch that saves only on `r&.stored?` adds no save there. It returns a Result whose
`stored?` is false when every matching row has reached its `merge_limit`.

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

**The 400-byte cap, by calculation.** Every value in a row has a fixed ceiling: an id 40
characters (section 8), an account 32, a typed username 96 bytes plus `"cut":true`, an alias 4,
an integer 5 digits, `seq` 6 digits, `elapsedMs` 9 (seven days), `serverMs` 13, a code the
longest in its list. Filled to every ceiling with `n` at 99999, the largest rows the registered
events can build are:

| Event | Ceiling-filled content | Bytes |
|---|---|---|
| `technique_used` | 32-character account, 40-character host, 40-character technique, alias, `grant`, `access` | 386 |
| `signin_refused` (blocked) | 96-byte typed username with `cut`, 40-character PC, `kind` | 391 |
| `helpdesk_request` | account, 40-character desk, 40-character agent, `what` | 384 |
| `share_file_read` | account, 40-character share, 40-character folder | 362 |
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
   rule. Then the **secret guard**, in test and development only: `OpsLog.secret_values(game)`
   lists every secret the scenario holds (account and NPC passwords, PINs, credential values,
   hashes, MFA codes and answers, wifi keys, and the `requires` of every pin, password or other
   code lock; a key or rfid lock's `requires` names an item, which a row may name). It reuses
   `AccessLeakScanner#secret_values` (`tools/playtest/lib/access_leak_scanner.rb:387`), moved
   into a module both the scanner and the helper load. The built row's JSON, less `as.typed`
   (the player's own username input), is scanned for each value. A mismatch or a hit raises
   `ArgumentError` in test and development, so a typo or a leak fails that plan's own tests. In
   production the checks other than the guard still run: a mismatch writes nothing and logs one
   `Rails.logger.warn` line naming the event, so a typo can never turn a game route into a 500.
3. **Sources.** Finds the sources that take the event. A source's `events` entry is an exact name
   or a prefix wildcard (`signin_*`, `mfa_*`). A row with no place lands only in a source that
   names the event exactly. A source's `where` filter admits the place by room: a door's room is
   its id; a PC, object, desk, jack or access point's room is the one that holds it
   (`login_scope_of(id)[:room_id]`, `game.rb:3182`); a host, network or share matches only
   `where.places` (4.1). None: nil.
4. **Once.** With `once: true`, the helper takes a 12-hex-character digest of the event, `as`,
   `where`, `result` and `detail`. If `player_state['opsLogOnce']` holds it, the call answers nil.
   Otherwise the digest is added. The set keeps at most 256 digests (about 4 KB), dropping its
   oldest past that; only after 256 distinct once-rows could a dropped one be written again, which
   no planned mission comes near. The set is independent of the rows, so evicting a row never
   lets it be written twice.
5. **Merge.** Builds the row: the next `opsLogSeq` (assigned under the game lock, so order is
   exact), the game time estimate (13.4) and `serverMs`. For each source: if one of that
   source's 10 newest rows has the same event, `as`, `where`, `result` and `detail`, it adds 1 to
   that row's `n` (absent means 1) and sets `last`, instead of appending. `n` stops at
   `merge_limit` (default 99999); a repeat that finds its row at the limit changes nothing in
   that source. Looking back 10 rows, not 1, means two or three refusals sent in turn (A, B, A, B)
   merge into their own rows instead of appending one row per request. A replayed or forged repeat
   therefore costs a few bytes, never a row.
6. **Append and evict.** Otherwise it appends the row. While that source holds more than its
   `maxRows`, or all sources together more than 300 rows, or the whole `opsLog` more than 128 KB,
   it evicts one row from that source, taking the first class that has one:
   1. the oldest refusal row (result other than `ok` or `granted`) with `n` above 1;
   2. the oldest other refusal row, unless it is the first row of its event in that source;
   3. the oldest `ok` or `granted` row, unless it is the first row of its event in that source;
   4. the oldest row (only when every row left is the first of its event, which needs `maxRows`
      below the number of events the source takes).
   Seed rows (4.2) live in the scenario, not in `opsLog`, so nothing evicts them. The first row of
   each event survives a flood of later rows, so a run of forged refusals cannot push out the
   first sign-in, the first swipe or the first lockout a puzzle or a player looks for. Rows in
   other sources are never touched, so a noisy source cannot push another source's rows out. A
   row two sources take is stored in each.
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
  the caller's own state check), merged repeats (step 5, with `merge_limit` where each merge
  would cost a save), or a cap the feature already enforces (a lockout's `maxAttempts`, an MFA
  request cap). Merging bounds what repeats cost; eviction (step 6) bounds what distinct rows
  cost, and protects the first row of each event. `maxRows` is the last line of defence, not
  the bound.
- **Saves.** Each row in a table says what saves it. A route that already saves after the call
  needs nothing more. A route that saves nothing of its own saves only when `r&.stored?`, and
  states what bounds those saves (`once:` or `merge_limit`).
- **No secret, by type.** A detail value is a registered code, a small integer, an id that
  resolves to a known thing or a server-made alias (13.5). No rule admits free text, so a
  password, hash, PIN, code, key, MFA number, security answer or file content has no field to
  land in. The only free text in a row is `as.typed`, the player's own username input. The guard
  of step 2 checks this mechanically in every plan's tests.
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

The event list lives in `lib/break_escape/ops_log_events.rb`, a plain Ruby file with no Rails
dependency, so the validator reads the same list the helper checks against. Each plan adds its
events there, one line per event, in the build stage that adds the action:

```ruby
EVENTS = {
  'signin_ok'       => { label: 'SIGN_IN',   places: %w[pc],      results: %w[ok], detail: { 'method' => %w[password credential], 'route' => %w[local remote] } },
  'mfa_prompt_sent' => { label: 'MFA_PUSH',  places: %w[pc],      results: %w[ok] },
  'network_swept'   => { label: 'NET_SWEEP', places: %w[network], results: %w[ok], detail: { 'from' => { id: 'host' } } },
  'share_file_read' => { label: 'SHARE_OPEN', places: %w[share],  results: %w[ok], detail: { 'folder' => { id: 'object' } } },
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
  | `:integer` | an Integer from 0 to 99999; registered only for counts | the number |
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
| `profile` | detail | the privilege plan |
| `desk` | `where` | the MFA and helpdesk plan |

A `host` or `network` row matches a source only through `where.places`; a `pc` is the sign-in PC
object, so it has a room. A host the core plan also treats as a sign-in PC is logged as `pc`. A
kind with no display-name lookup yet, or an id that no longer resolves when the row is read, is
shown as `-`.

A spec test walks `EVENTS` and `KINDS` and fails on a malformed entry, a place kind or `{ id: }`
kind with no `KINDS` entry, or an event whose ceiling-filled row (13.1) passes 400 bytes, so a
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
| S1 | `network_swept` | nil | `network` | ok | `from` (`{ id: 'host' }`, the foothold) | once (caller: first sweep only) | `POST /network/scan` |
| S1 | `host_scanned` | nil | `host`, `pc` | ok | `from` | once per host (caller) | `POST /network/scan` |
| S2 | `service_checked` | nil | `host`, `pc` | ok | `service` (`{ id: 'service' }`, shown by name) | once per service in practice; a check that adds a newly unfixed weakness writes one more | `POST /network/check` |
| S2 | `finding_confirmed` | nil | `host`, `pc` | ok | `finding` (`{ alias: 'finding' }`), `status` (`confirmed`, `false`), `how` (`quiet`, `probe`) | once per finding (caller) | `POST /network/confirm` |
| S2 | `network_alerted` | nil | `network` | ok | none | once per network (caller: the request that sets the alert global) | the confirm or technique route that raised the noise |
| S3 | `technique_refused` | nil | `host`, `pc` | refused | `finding` (alias), `technique` (`{ id: 'technique' }`), `reason` (the closed list of 422 codes) | merged repeats | `POST /network/technique`, which saves on every 422 |
| S3 | `technique_used` | `{ account: }` for a session grant, nil for a credential grant | `host`, `pc` | ok | `finding`, `technique`, `grant` (`session`, `credential`), `access` (`user`, `admin`; session grants only) | one per grant (caller: a repeat with `already: true` writes nothing) | `POST /network/technique` |
| S5a | `admin_profile_read` | `{ account: }` (the session's) | `pc` | ok | `profile` (`{ id: 'profile' }`) | `once: true`: one per PC and profile | `GET /container`, which saves nothing of its own: `save!` only when `r&.stored?` |
| S5a | `usb_install_overridden` | `{ account: }` | `pc` | ok | `device` (the closed list of `usbClass` values the schema allows) | merged repeats | the implant action and plant proof, which already save (`network_access.rb:535`) |
| S5b | `credentials_harvested` | `{ account: }` | `pc` | ok | `count`, `hashes` (`:integer`: pairs added, and how many of them are hashes) | one per collect that adds a pair; a repeat adds none and writes nothing | the collect route, which saves when a pair is added |
| S8a | `mfa_challenge` | `{ account: }` | `pc` | ok | `route` (`keyboard`, `foothold`, `from`: a route code, never an id) | merged repeats | the save that stores the pending record |
| S8a | `mfa_code_ok` | `{ account: }` | `pc` | ok | none | one per sign-in | the save that writes the session |
| S8a | `mfa_code_wrong` | `{ account: }` | `pc` | fail | none | merged repeats; S8's three code caps | the save that stores the counts |
| S8a | `mfa_prompt_sent` | `{ account: }` | `pc` | ok | none | merged repeats: a run of prompts is one row with a count; 20 per attempt | the save that stores the request count |
| S8a | `mfa_prompt_approved` | `{ account: }` | `pc` | ok | `by` (`owner`, `held_phone`, `own_phone`) | one per sign-in | the save that writes the session |
| S8a | `mfa_prompt_denied` | `{ account: }` | `pc` | denied | none | one per attempt | the save that drops the record |
| S8a | `mfa_expired` | `{ account: }` | `pc` | expired | none | one per attempt | the save that drops the record |
| S8b | `helpdesk_request` | `{ account: }` for the account asked about; nil for a username that is no account | `desk` | granted, refused, blocked | `what` (`password`, `mfa`), `agent` (`{ id: 'npc' }`, the desk NPC) | merged repeats; the desk's `maxTries` | granted, refused: the save that stores the grant or the tries. Blocked changes nothing else: `save!` only when `r&.stored?`, written with `merge_limit: 10` |
| S8b | `account_password_reset`, `account_mfa_reenrolled` | `{ account: }` | `desk` | ok | `agent` | once per account (caller: first grant) | the save that stores the grant |

- A step up to admin is S3's `technique_used` with `access: admin`; no other row records it.
- A refused sign-in caused by an account's kind (a local account at a domain-only PC, and the
  reverse) is this plan's `signin_refused` (13.8). The privilege plan registers its optional
  `kind` detail (`local`, `domain`) in S5c and writes no row of its own for it.
- **Why a sweep records `from` and a sign-in does not.** A network sensor sees traffic arriving
  from a machine, so a sweep or scan row naming the foothold it came from is what that log would
  hold. A sign-in row records the account and the PC signed in to; the route the request took
  (keyboard, foothold, relay) is reduced to the `route` code, so the row never names the source
  machine.
- `start_login_session!` called with `via: 'technique'` (S3) writes `technique_used` from S3's
  method and no `signin_ok`.
- **S6, the command-line skin, writes no rows**: a skin adds no moves, and each move writes the
  same row whichever skin sent it.
- **S7, hashes and offline cracking, writes no rows.** Recovering a password from a hash is
  offline work on the attacker's own machine and leaves nothing in the organisation's logs, which
  is part of why stolen hashes are so dangerous. Obtaining a hash is logged where it happens: a
  harvest by `credentials_harvested` (its `hashes` count), a hash file on a share by opening the
  folder that holds it (`share_file_read`, 13.8), which reads exactly as any other folder.

### 13.8 This plan's rows

Sources match these by prefix: `badge_*`, `signin_*`, `session_*`, `net_*`, `share_*`.

| Event | Who (`as`) | Where | When | Result | Detail | Bound | Saved by |
|---|---|---|---|---|---|---|---|
| `badge_swipe` | the player's own keycard: `{ npc: holder }`; a copy: the holder when the request carried one card, none when several, always the holder with `showCardHolder` (question 1, section 15); a card with no single holder: `{ card: id }` | `door`, `object` | `GamesController#unlock` (`games_controller.rb:1211`): the target resolves, its lock is in force with `lockType` `rfid`, it was not open, `validate_unlock` passed; written before `unlock_room!`/`unlock_object!` (`game.rb:135`, `:691`) | ok | none | one per unlock: an open target writes nothing | the unlock's own save |
| `badge_swipe` | none | `door`, `object` | same route, refusal at `:1252`: an rfid lock in force, the target in reach, the player holding at least one rfid card or clone in server state (5.1) | denied | none | merged repeats, `merge_limit: 10` | `save!` only when `r&.stored?`: at most ten saves per door, then free |
| `signin_ok` | `{ account: }` | `pc` | `start_login_session!` (`game.rb:4388`) with `via` `password` or `credential`. Any other `via` writes nothing and never raises | ok | `method` (`password`, `credential`), `route` (`local`, `remote` when a foothold, `from` or relay is given) | one per sign-in | both callers (`game.rb:3497`, `credential_login.rb:76-80`) |
| `signin_fail` | `{ typed: }`, the normalised username from the failure key (`game.rb:3481-3482`) | `pc` | `record_login_failure!` (`game.rb:4333`) | fail | none | merged repeats, shown as "x3"; the lockout's `maxAttempts` | the method's own save |
| `signin_lockout` | `{ typed: }` | `pc`, parsed from the key's PC part | `add_login_lockout!` (`game.rb:4366`), after the early return at `:4368` | ok | none | one per lockout | its caller, `record_login_failure!` |
| `signin_refused` | `{ account: }` | `pc` | `attempt_login!` `notPermitted` branch (`game.rb:3489-3492`) | denied | `kind` (`local`, `domain`; S5c) | merged repeats | `save!` only when `r&.stored?`; reaching it needs the right password, which already costs a save per wrong try |
| `signin_refused` | `{ typed: }` | `pc` | `attempt_login!`, the locked-out return (`:3484`) | blocked | none | `merge_limit: 1`: one row per PC and username, shown with no count | `save!` only when `r&.stored?`: one save per locked-out PC and username |
| `session_end` | `{ account: }` (the session's) | `pc` | `logout_session!` (`game.rb:3660`), only when the deleted record is a Hash. Explicit sign-out only: replacement, Switch user, pruning, token expiry and unplugging write nothing | ok | none | one per session | the method's own save |
| `session_lock` | `{ account: }` | `pc` | `lock_session!` (`game.rb:3836`), past its "no session" and expiry refusals | ok | none | merged repeats | the method's own save |
| `net_link_up`, `net_link_down` | none | `jack` | `plant_device!` (`network_access.rb:233`), `unplug_device!` (`:290`), success (L3) | ok | none | one per plant or unplug | the methods' own saves (`:282`, `:316`) |
| `net_wifi_join` | none (an access point logs a device, not a person) | `ap` | `join_network!` (`network_access.rb:355`), success (L3) | ok | none | one per join | the method's own save (`:392`) |
| `share_file_read` | `{ account: }`, the session that admits the share | `share` | `GamesController#container` (`games_controller.rb:626`), the admitted share branch (`:639-653`), after `session_admits?`, the sign-in-object refusal and `path_unlocked?` pass (L3) | ok | `folder` (`{ id: 'object' }`, the opened folder; absent when the share itself is opened) | `once: true`: one per folder and account | `save!` only when `r&.stored?` |

**`share_file_read` records opening a folder, not reading a file.** A folder's contents, file text
included, leave the server in the `/container` response, and the reader then opens each file in
the browser with no further request. The server cannot tell which file the player read, so the row
records the one thing it knows: this account opened this folder. It is written once per folder
and account through `once:`, so re-opening the folder writes nothing and saves nothing. The row
never names a file or says what one holds.

Claimed sessions (`via: 'claim'`) write no sign-in row but do write `session_end` and
`session_lock`: an account signing out with no sign-in before it is the trace a careful defender
would notice.

Never in these rows: the password; which account a typed username belongs to (`signin_fail` and
`signin_lockout` read the same for an account and a non-account username, matching the generic
`LOGIN_INCORRECT` reply, `game.rb:3079`); which of several held copies passed, unless the source
opts in; the foothold, relay or source PC id; a network key; a device id; a file name or content.

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
   `assert_ops_log_holds_no_secret`. Each plan that adds a secret adds it to the shared secret list
   (12, `access_leak_scanner.rb`).
2. **Orchestrator, ordering:** L1a lands before the first stage of every other ops plan; L1b lands
   before the S3, S5a, S5c and S8 stages that edit `attempt_login!` and `start_login_session!`.
3. **OPS_CORE (S1 to S3):** the four core points are taken as the core plan writes them: place kind
   `pc` as well as `host`, `network_alerted`, detail `finding` as the alias, `how` and `grant` as
   closed lists, and `from` (it fits the 400-byte cap by 13.1). Still open: ids the core plan
   stores in rows (host, network, service, technique, foothold) are at most 40 characters, which
   its section 0 already sets for services and techniques; the core plan states the same for host
   and network ids, or its validator refuses a longer one in a scenario with `logSources`. The core
   plan fills the `network`, `host`, `service` and `technique` entries of `KINDS`.
4. **OPS_PRIVILEGE_ACCOUNTS (S5):** rename `usb_override` to `usb_install_overridden` and
   `credentials_collected` to `credentials_harvested`; the refused sign-in is this plan's
   `signin_refused`, for which S5c registers the optional `kind` detail. `admin_profile_read` uses
   `once: true` and saves only on `r&.stored?` (no separate lookup in the log). The harvest
   detail is `count` and `hashes`, two integers: a per-account list of NPC ids and kinds has no
   typed rule and would break the four-key cap. The `device` detail is the closed list of
   `usbClass` values the schema allows. The section 13 table header is printed twice.
5. **OPS_MFA_HELPDESK (S8):** the rows are taken as that plan writes them. The blocked
   `helpdesk_request` branch saves only on `r&.stored?` and is written with `merge_limit: 10`, so
   hammering a closed desk costs at most ten saves. The `desk` entry of `KINDS` is that plan's.
6. **OPS_CRACKING (S7):** writes no rows (13.7). Any row list left in that plan's section 13 is to
   be removed, and its section says so in one line.
7. **OPS_REALISM_SKIN (S6):** writes no rows. The parity run compares
   `log_rows_for(source_id, compare: true)` (5.1) across skins.
8. **Orchestrator:** `log_rows_for` and the stored key name `by` (13.6) are reserved for the
   parked defence debrief and the investigator idea; no plan should repurpose them.

## 15. Open questions for the user

Settled in this plan: refused badge swipes are logged with no identity, bounded by merging (13.8);
a row's time is the server-side estimate of game time, with `seq` for order (13.4); rows live in
`player_state` with caps (section 8); refused and locked-out sign-ins are logged (5.1); a puzzle's
anomaly is always a seed row (4.2); a log is read only at a reached reader object, and reading
through a session on a host follows once S1 hosts exist (section 6).

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
