# Handover L2a server (ops log reader, server half): DONE

## The route
`GET /break_escape/games/:id/log_rows?object_id=<id>[&rev=<rev>][&foothold=<id> | &from=<id> | &relay=1]`
(`config/routes.rb`, beside `get 'keyring'`; `before_action :set_game` entry on its own continuation line;
`GamePolicy#log_rows?` = `show?`). Not under `with_game_lock`; reads only, no save, no row. Always `Cache-Control: no-store`.

Checks in order (`GamesController#log_rows`):
1. `object_id` not a String, empty, or over 64 chars: 400 `{ success: false, reason: 'invalid_object' }`.
2. Any of: object not found by `login_scope_of`, its `id` is not exactly `object_id` (a display-name match is refused),
   type not `ops_log_terminal`, `minigameData.logSource` missing or not declared, or not reached:
   404 `{ success: false, reason: 'not_found' }` (one body for all).
3. Reach, `log_reader_reached?`: scoped reader (sign-in PC, profile, resource): `container_reach_refusal(located).nil?`
   (so session, path locks, and for a sign-in PC the route in `foothold`/`from`/`relay`). Unscoped reader:
   `room_unlocked?(room_id)` and `path_unlocked?(path + [object])`.
Answer: `{ rev, title, rows }` or `{ rev, unchanged: true }` when `rev` equals the current one.

Row (symbol keys in Ruby, exactly seven): `id` (10 hex, HMAC of `[game id, source id, seq]`, key
`generate_key('ops_log_row_id')`), `elapsedMs` (Integer; seed rows will carry `at` instead, L2b), `event` (label),
`as`, `where` (`-` when none or unresolved), `result` (`FAIL x3`, trailing `+` when stored `p`), `detail`
(`key: value, key: value`; `show: false` keys dropped; id-rule values by display name; `""` when none, a departure-free
simplest reading, the client should treat `""` as empty). Rows are in `seq` order. `title` is the source's `title`, else `Log`.
`rev` = first 6 hex of MD5 of `JSON.generate([title, rows])`.

## Code
- `ops_log.rb`: `log_rows_for_client(source_id)` (nil for an undeclared source), private `ops_log_client_*` builders,
  `OpsLog.row_id`, `OpsLog.rows_rev`.
- `games_controller.rb`: `container_reach_refusal(located)` (nil, `:not_found`, `:unreachable`, `:locked`; pure; a
  non-resource sign-in PC object answers nil because its desktop is `render_login_desktop`), `render_container_refusal`
  (the exact old 404/403/403-with-reason bodies), `log_reader_reached?`, `log_rows`. `#container` now calls the first two;
  `bin/ops-golden-compare` passes (12 runs), and the access_model_* suites pass unmodified.

## showCardHolder (changed by R1 M1)
`badge_swipe` carries a hidden detail `flagged` (`{ count: 1, show: false }`, `ops_log_events.rb`). `write_badge_swipe_ok!`
sets `{ 'flagged' => 1 }` only when the identity is kept by a source's `showCardHolder` alone (not the holder's own keycard,
not one card sent; `ops_badge_flag_only?` in `game.rb`). The reader (`ops_log_client_as`) shows `-` for a flagged row, npc or
card form, in a source without the flag; every other row shows. The marker is never sent (`show: false`). The old "another
source sets it" heuristic is gone. Rows stored before the marker have none, so they show everywhere. L2b: render seed rows
through a path that does not read `flagged` (seed rows are authored, never flagged).

## Other R1 contract changes
- A thing with no authored name shows its kind word (`door`, `object`, `pc`, `npc`, `card`...), never its raw id (m5):
  `ops_log_client_thing` in `ops_log.rb`. `-` stays for an unresolved id or unknown kind.
- `log_rows` sets `no-store` before the id check (400 too), checks the declaration, then reach, then builds rows (m1, m2).
- A reader that is itself a sign-in object is refused (`log_reader_reached?`, m4).
- No-route read under a foothold session answers (m3, ruled accepted). `admin_profile_read` test still owed to the stage that
  adds the event (T7).

## Tests (all run under the lock, pass)
- `test/controllers/break_escape/log_rows_test.rb`: 16 runs, 101 assertions (refusals, same 404, reach by room/cabinet/own lock/
  desktop session lock and sign-out/profile, foothold route, read writes nothing, seven keys, account vs typed form, rev,
  no-store, title change, no logSources, holder hiding).
- `ops_log_test.rb`: 61 runs, 695 assertions (5 new reader tests).
- Policy test: `log_rows?` added to DEVICE_ACTIONS (policy_test 382-run combined run passes).
- Combined run: access_model_* , keyring_folder_route, network_remote_signin, network_footholds, games_controller, credential_from_route,
  policy, log_rows: 382 runs, 2999 assertions, 0 failures. `ops_logs_scenario_test` + `network_ops_unchanged`: 25 runs pass.
- rubocop clean on all my Ruby files.

## Gotchas / not done
- Seed rows are not listed (L2b); no `seedRows` in the schema yet. Add them at the top of `rows` in `log_rows_for_client`
  before the `rev` digest.
- `admin_profile_read` does not exist in the code yet, so the plan's "no admin_profile_read row" test is not written.
- A no-route read under a foothold session answers, as `/container` does for a folder.
- The stored-row `elapsedMs` is sent as an Integer; the client formats it with the game clock.
- A wildcard source (`signin_*`) takes only events that have a place.
