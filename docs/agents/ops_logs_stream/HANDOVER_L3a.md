# Handover L3 part A (network and share rows): DONE

Part B (scenario `test_ops_logs` additions, playtest, docs) is another builder's.

## Rows and where each is written
| Row | Written by | Save |
|---|---|---|
| `net_link_up` (`where` jack, `as` nil) | `network_access.rb:283`, `plant_device!`, after the plant, before its `save!`; the already-planted, no-device, unreachable, port-security and unknown-jack returns write nothing | the method's save |
| `net_link_down` | `network_access.rb:319`, `unplug_device!`, before its `save!`; not planted, unreachable, unknown write nothing | the method's save |
| `net_wifi_join` (`where` ap) | `network_access.rb:397`, `join_network!` success only; wrong key, already held (second access point too), unknown ap write nothing | the method's save |
| `share_folder_opened` | `games_controller.rb:3204` `log_share_folder_opened`, called from `#container` (`:644`) in the admitted resource branch after `container_reach_refusal` passes; `once: true`; `as` from `Game#ops_share_as` (`game.rb:3349`); `folder` detail = the served object's id, absent when the share record itself is opened | `@game.save! if row&.stored?` |
`implant_foothold!` and `clone_card` write nothing (tests assert it).

Events: `ops_log_events.rb` `net_link_up`, `net_link_down`, `net_wifi_join`, `share_folder_opened` (labels NET_LINK_UP, NET_LINK_DOWN, NET_WIFI_JOIN, SHARE_OPEN) and the `share` kind (`share_named`; any `resources` entry). `jack` and `ap` kinds already existed.

## session_admitting
`game.rb:3314` `session_admitting(scope)`: nil when nothing admits; else the PC id String of the admitting session (login_pc: that PC; profile and resource: the oldest admitting one), `:foothold` (a share only a foothold admits) or `:unscoped` (nil scope). `session_admits?` is `!session_admitting(scope).nil?`. The resource rule moved into `network_access.rb:1619` `resource_admitting` (`resource_admits_player?` is `!resource_admitting(r).nil?`); it scans sessions first, then the foothold branch (same truth value).
Departure: the plan says nil when only a foothold admits, which would break `!nil?`; `:foothold` is the answer, and `ops_share_as` turns it into `as` nil.
"Oldest" = `Game#sessions_oldest_first` (`game.rb:3342`): order of `signedInPcs` (first sign-in at each PC), else key order. The stored state (jsonb) keeps no hash key order, and adding a `seq` to session records or a new state key broke `network_technique_test` and `network_ops_state_delta_test` (exact record and write set), so neither was done. Edge: sign out and in again at an earlier-listed PC keeps its old rank.

## Tests (all run under the lock, pass)
- `test/controllers/break_escape/network_log_rows_test.rb` (NEW, not an extension of the shares/wifi files, to keep them unmodified): 19 runs, 187 assertions. Plant, unplug, join, refusals, repeat no-save (via `updated_at`), implant none, no-logSources answers byte for byte equal and stores nothing, share row (foothold only, another account, folder, refused opens, two sessions both orders), no secret/foothold/PC id in share rows, the reader's shown form, `session_admits?`/`session_admitting` agreement over resource, profile, login_pc, locked-session scopes.
- `access_model_rfid_test.rb`: +1 test (card copy writes no row), 67 runs.
- `ops_log_test.rb`: 64 runs, 720 assertions; the walk lists `net_*` in `OPS_AS_NIL_EVENTS` and `share_folder_opened` in `OPS_AS_ACCOUNT_EVENTS` (its real `as` is an account); ceiling not loosened.
- Groups: `network_*` 506 runs; keyring_*, npc_container_unlock, log_rows, ops_logs_scenario, ops_log 138 runs; access_model_* 160 runs; a 15-file group of container/session/credential/ops_access users 434 runs; all 0 failures. `bin/ops-golden-compare` 12 runs pass. Rubocop clean.

## For the scenario builder
- Plant, unplug, join: net rows with `where` = the jack or access point (shown by its `name`, else "jack"/"ap"), `as` shown `-`. A source takes them with `events: ["net_*"]`, no `where`.
- Opening a share (any admitted `GET /container/<share or folder id>`): `SHARE_OPEN`, `where` the share name, `as` the oldest admitting session's account or `-` for a foothold only; `detail: folder: <name>` for a folder. Source `events: ["share_*"]`; filter by `where.places: ["share:<id>"]`, or no `where`.
- A repeat open as the same account is silent. Files are never named.
- A game's rows need a clock-free read: nothing here depends on the clock.

## Deferred (R1 F3)
A `seq` on the session record (as footholds have) would make "oldest admitting session" true by time. Not built: it changes the exact session record and write set that `network_technique_test` and `network_ops_state_delta_test` pin. Whoever next edits `start_login_session!` can do it. Until then the share row names the first admitting session in `signedInPcs` order (token sessions last); a test pins the sign-out-and-in edge.
