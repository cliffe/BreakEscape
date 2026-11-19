# Handover: OPS_CORE_PLAN.md, planner (first draft, stopped at the context limit)

Written 2026-11-19. Plan: `docs/achitechture/OPS_CORE_PLAN.md`. Nothing committed.

## Done

- Sections 0 to 8 and 13 to 15 drafted: shapes, play design, code today, stages, scenario fields
  with JSON per stage, engine behaviour, routes, what reaches the browser, state, log rows,
  cross-plan requests, open questions.
- Design decisions taken (each is also an open question for the user where it is a real choice):
  discovery is opt-in per network (`networks.<id>.discovery: "scan"`) because `network_rows` lists
  everything today; hosts with no sign-in live in a top-level server-only `hosts` map; services
  stay on the sign-in object; a card is a tray item with `technique: <id>` tied to a top-level
  `techniques` registry; a credential grant uses a new keyring proof kind `technique`; a technique
  session is a normal session record with `via: "technique"`, `foothold`, `access`, `technique`.

## Open (sections still outlines)

- Section 9: validator, schema, dungeon graph. Outline only. Needs the three files read.
- Section 10: list of scenarios to rerun.
- Section 11: beat tables for `test_ops_scan`, `test_ops_findings`, `test_ops_access`.
- Section 12: build steps, streams, owners, sequence for shared files.
- The status line at the top of the plan says "first draft, incomplete"; remove it when the
  outlines are filled, since a plan must read as written once.

## Code read and verified (pointers in the plan are good)

`lib/break_escape/network_model.rb:1-135`; `app/models/break_escape/network_access.rb:1-72`,
`:286-420`, `:719-888`, `:975-1290`, `:1440-1670`; `config/routes.rb` network lines; the positions
of the `set_game` and `with_game_lock` lists (`games_controller.rb:27`, `:103`).

## Not read: check before a reviewer does

1. `game.rb:4388` `start_login_session!` body. The plan assumes extra keys (`access`, `technique`)
   can be added to the record and that `via` is free text. Also whether it writes `signedInPcs`
   for every non-relay, non-token session (open question 8 rests on this).
2. `game.rb:3021` `ACCESS_STATE_DEFAULTS` and `:3824` `session_lockable?` (the plan says a
   technique session is not lockable; today only `password` and some `credential` sessions are, so
   this should hold with no change, but confirm).
3. `reach_session_hosts` (`network_access.rb:1398`): the plan says a technique session pivots.
   Confirm it counts any non-relay session.
4. `session_identity` and `session_admits?` (`game.rb:3243-3290`): the plan assumes a desktop is
   served by the session's NPC id whatever `via` is.
5. `credential_model.rb` `PROOF_KINDS` and `credential_keyring.rb:21-36`: where the `technique`
   proof kind plugs in, and whether a `password` kind credential can take it.
6. `games_controller.rb` `network`, `container`, `login`, `login_accounts`: the exact place the
   "not swept" refusal goes for remote sign-in and remote tiles (plan 5.2).
7. `network-view-minigame.js` and `network-links.js`: row rendering, `act`, `getTestState`, and
   how the remote desktop is opened after a sign-in answer (plan 5.4 says the technique answer
   reuses that path).
8. `scripts/scenario-schema.json`: `networks`, `resources`, object and item blocks; whether a
   generic item field `storeIn` exists (tray clutter, question 3).
9. `scripts/validate_network.rb` and `scripts/generate_dungeon_graph.rb:528-760`.
10. The JS test harness copy lists (location unknown; grep `bin/test-js` and `test/js`).
11. `tools/playtest/lib/access_leak_scanner.rb` collectors, for the new strings.

## Gotchas

- `scenario_data` is jsonb: key order is lost, so everything is sorted by id (`NM:110-114`).
- Outage and `fixedIf` globals are client-synced, so both are soft gates. The plan says so; keep
  it said wherever a gate is claimed.
- `desktop_request_allowed?` (`NA:1509-1511`) refuses a foothold route when `remote` is blocked;
  the plan adds one clause for a held technique session. That is the only change to existing
  access checks and deserves a hostile test.
- Section 6 says a host scan is still needed on an open network before a check; a sweep is only
  for discovery networks.
- The brief forbids real products and procedures. All example product names are invented; keep
  `summary` and `falseBecause` to what is wrong, never how.
- D5's section on reserved fields in `validate_network.rb:15-72` is wrong (D5b says so). The
  plan's "reserved until its stage" idea in section 3 needs a real mechanism found or designed.
