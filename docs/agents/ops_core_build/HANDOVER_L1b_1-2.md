# Handover L1b build items 1 and 2 (badge, sign-in, session rows): DONE

Items 1 and 2 built; item 3 (`test_ops_logs` scenario, playtest, docs) is the next builder's.

## Built
- Item 1: `lib/break_escape/ops_log_events.rb` EVENTS registers `badge_swipe`, `signin_ok`, `signin_fail`,
  `signin_lockout`, `signin_refused`, `session_end`, `session_lock` as 13.8 gives them. No `net_*`, share or other
  plan's event. `signin_refused` has no `kind` detail (S5c adds it).
- Item 2: call sites, all in `app/models/break_escape/game.rb` unless stated:

| Row | Written by | Line | Save |
|---|---|---|---|
| `signin_ok` (method, route) | `start_login_session!`, only `via` password or credential; route relay, from, foothold, else keyboard | ~4582 | both callers |
| `signin_fail` `{typed}` | `record_login_failure!` | ~4503 | the method |
| `signin_lockout` `{typed}` | `add_login_lockout!` after its early return | ~4538 | `record_login_failure!` |
| `signin_refused` denied `{account}` | `attempt_login!` notPermitted, `save_limit: true` | ~3531 | `save! if r&.stored?` |
| `signin_refused` blocked `{typed}` | `attempt_login!` locked-out return, `save_limit: true` | ~3520 | `save! if r&.stored?` |
| `session_end` | `logout_session!`, only when the deleted record is a Hash and the PC resolves | ~3712 | the method |
| `session_lock` | `lock_session!`, past its refusals | ~3907 | the method |
| `badge_swipe` ok | `write_badge_swipe_ok!` (~4192), called in `GamesController#unlock` inside the transaction before `unlock_room!`/`unlock_object!` (`games_controller.rb:~1290`) | | the unlock's save |
| `badge_swipe` denied | `write_badge_swipe_denied!` (~4207), called in the `unless is_valid` branch (`games_controller.rb:~1233`), `save_limit: true` | | `@game.save! if badge&.stored?` |

- New readers in game.rb: `rfid_requires_card(lock)` (~4075, beside `rfid_lock_passes?`; `rfid_requires_held?` now
  delegates to it, same answers), `ops_rfid_lock_in_force`, `ops_rfid_in_reach?`, `ops_badge_where`, `ops_badge_as`,
  `ops_account_as(npc_id)`.
- Controller: `already_open` now computed for every `method: "rfid"` request (the `&& card_ids` is gone), and
  `rfid_in_force` is taken before `validate_unlock` (only a game with `logSources` ever sees it true).

## Tests (all run, pass)
- `test/controllers/break_escape/access_model_rfid_test.rb`: 66 runs (13 new, "badge:").
- `test/controllers/break_escape/access_model_login_test.rb`: 11 new "ops_log" tests (53 runs in the file with the old ones).
- Combined run (ops_log_test 43, verify_run, clock, all access_model_*, withholding, unlock_system, gated_*, game_test): 390 runs, 3093 assertions, 0 failures.
- `bin/ops-golden-compare`: 3 runs pass (not re-captured). Rubocop clean on app, lib, test/controllers, ops_log_test.rb.
- ops_log_test.rb: the "EVENTS is empty" test became "an event that is not registered is malformed"; its EVENTS spec,
  400-byte ceiling and secret walk now cover the real events (the overlay merges over the shipped table).

## Departures and judgement calls
- Granted swipe also requires the target in reach (`ops_rfid_in_reach?`): 13.8 says a forged swipe at an unreached door
  writes nothing, but `validate_unlock` has no reach check, so a forged post still opens such a door as before.
- `already_open` for every rfid request is a behaviour change: a card-less rfid post at an open target now answers
  `alreadyOpen: true` (it used to omit it). `bin/ops-golden-compare` still passes (no fixture covers it); section 10
  does not mention it. Orchestrator may want to note it.
- `showCardHolder` is per source in the schema, but a stored row is shared by every source. `ops_badge_as` stores the
  holder when ANY source sets it (or own keycard, or one card sent); the L2a reader should hide the name for a source
  without the flag if it needs per-source difference (not done).
- A copy sent with no `card_ids` (requires-only lock) counts as "one card" and names its holder.
- Not built: the `behind_closed_step?` condition (S8c, not landed) and the second-step gate.
- Not tested here (helper-level, L1a): `save_limit: false` neither spends nor is stopped.

## Gotchas for the `test_ops_logs` builder
- `start_login_session!` is private; call with `send` in tests. Guard is on in tests, so a call that names an unresolved id raises
  (route answers 500).
- A blocked row needs the typed name already locked out (key is per PC and username): lock out each made-up name with 5 failures first.
- Door reach needs the target room named in the connections of an unlocked room (any key of `connections`, list allowed).
- `signin_ok` `as` must be an account NPC (`creds.username`); a guest or non-account session gives `as: nil`.
- Badge rows at objects use the object's own `id`, never its name; no id means no row.
