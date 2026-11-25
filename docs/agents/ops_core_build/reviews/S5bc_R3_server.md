# S5b/S5c stage review, round 3: server

Branch `ops-priv2`, fix commit `e36ab07fd` (R2-SERVER1) read against round 2 (`S5bc_R2_server.md`).
Reviewer changed no code.

How the evidence was made: a scratch integration test (not committed,
`<scratchpad>/s5bc-r3-server/probe_test.rb`) that includes `OpsPrivilegeBeats`, builds a game from
the real `scenarios/test_ops_privilege/scenario.json.erb` and adds `deskadmin`, `labadmin` and
`adel` to the `access.people` of every room, every room object at any depth (`objects`,
`contents`, `itemsHeld`, `tableItems`), every NPC's held items, every start item and every
resource (roles kept where present). It then calls every route that answers with scenario data and
walks each JSON answer for any hash whose `access.people` names an account-only id, and also checks
the raw body for either name. Run as
`flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <scratch>/probe_test.rb`; each
`PROBE` line below is a line that run printed.

Also run:

- `ops_privilege_r1_server_test.rb` and `ops_privilege_scenario_test.rb` under flock:
  `38 runs, 469 assertions, 0 failures, 0 errors, 0 skips` (includes the 2 new R2-SERVER1 tests).
- `bin/ops-golden-compare` (not under flock): `31 runs, 62 assertions, 0 failures, 0 errors`.

## Round 2 findings

| R2 | Severity | Verdict | Evidence |
|---|---|---|---|
| SERVER1 the bootstrap sends a room's `access.people` as authored | major | closed | `game.rb:2474` calls `strip_account_only_people!(kept_fields)` after the kept fields are copied from the deep-dup (`game.rb:2437`), before `strip_lock_answers!`. PROBE: `scenario 200 access_blocks=6 leaks=0`, `deskadmin_any: false labadmin_any: false` (4 room lists plus the 2 start items echoed in `playerInventory`); the stored copy is untouched: `stored it_room access {"people":["deskadmin","labadmin","adel"]}` after all answers, and a second bootstrap is still clean (`scenario again 200 ... leaks=0`). New test `ops_privilege_r1_server_test.rb:101` asserts the bootstrap names no `deskadmin` and keeps `people: ["adel"]` and `roles: ["it"]`. |

## Every route, every access block (PROBE, all injected)

| Route | Status | access blocks | leaks | either name in body |
|---|---|---|---|---|
| `GET scenario` | 200 | 6 | 0 | no |
| `GET scenario_map` | 200 | 0 | 0 | no |
| `GET room/lobby`, `bay`, `store`, `it_room` | 200 | 13, 11, 4, 6 | 0 | no |
| `POST login` desk_a (Adel) | 200 | 0 | 0 | no |
| `GET container/lobby_cabinet` | 200 | 3 | 0 | no |
| `GET container/desk_a` (Adel signed in) | 200 | 0 | 0 | no |
| `GET container/<other PCs>` (no session) | 403 | 0 | 0 | no |
| `GET login_accounts` for all 7 sign-in PCs | 200 | 0 | 0 | no |
| `GET network` (before and after plant), `keyring`, `objectives`, `capture_secrets` | 200 | 0 | 0 | no |
| `PUT sync_state` | 200 | 0 | 0 | no |
| `GET log_rows` (`audit_log_pc`) | 200 | 0 | 0 | no |
| `GET mfa/device` 404, `mfa/phone` 403, `POST inventory` add 422, `network/plant` 422 | - | 0 | 0 | no |

The other room-answer path (`games_controller.rb:1280`, door unlock) goes through
`filtered_room_data`, which runs the same strip (`game.rb:2795`, `7608`). Container contents
(`games_controller.rb:3626`) and the inventory echo (`3727`) filter copies through the same method.

## Docs (`docs/ACCESS_AND_NETWORKS.md`, A20)

- Line 776, remote domain: matches the server. `network_access.rb:1003-1004` puts `domain` only on
  the 200 `login_accounts` answer; no host-row builder writes it (`grep "'domain'"` over
  `network_access.rb`, `network_model.rb`, `network_ops.rb`, `games_controller.rb` finds only
  that line). The client reads it from that answer (`unlock-system.js:940-941`,
  `password-minigame.js:2210-2220`).
- Line 781, "at the keyboard, and on the remote sign-in screen from the answer's `domain`":
  matches the same code. "The only server answer that gained a field" holds for the client
  features it names (the domain line and the headshot).
- Line 778: does not match the server (R3-SERVER1).

## New findings

### R3-SERVER1 (minor): the A20 design note says an account-only name in a `people` list reaches the browser

- Where: `docs/ACCESS_AND_NETWORKS.md:778`, "never a `people` list naming an account-only id: a
  name in a list reaches the browser in the room answer." Since S5c and `e36ab07fd` no answer
  serves it: every route in the table above strips it, and line 775's list of what is dropped
  does not mention access lists at all. The validator's L9 warning
  (`scripts/validate_privilege.rb:598`, "...and the browser is served it") says the same for an
  `access.people` path, which is now false for that path (still true for labels and other text).
- Evidence: PROBE rows above, `leaks=0` and the raw body names neither id on every route, with
  both names in every access list of the scenario.
- Fix: line 778, keep the advice and replace the reason, for example "an account-only id in a
  `people` list admits no one at a door (it holds no card) and the server strips it from every
  answer"; add "access lists (`access.people`)" to line 775's dropped-from list. Optionally drop
  "and the browser is served it" from the L9 warning when the path ends in `access.people[n]`.

## Recorded limits

- Case variants of an account-only id in `access.people` are still served as authored (exact-id
  strip, carried from round 2).
- The second new test's `GET network` and `PUT sync_state` checks run with no foothold or
  session, so they pass on an empty answer; the probe covered `network` after a login (the
  plant itself answered 422 in this setup, so a foothold view with host rows was not driven).
- `GET container/<PC>` for PCs other than `desk_a` answered 403 (no session); a desktop's
  contents under another account were not driven. Ink `give_item` paths were not driven.
- I did not prove that the new bootstrap test fails without the fix; round 2's PROBE A showed the
  leak on the pre-fix code with the same setup.

## Verdict

1 minor (R3-SERVER1, a stale doc line), 0 majors, 0 blockers. Round 2: 1 of 1 finding closed.

not clean
