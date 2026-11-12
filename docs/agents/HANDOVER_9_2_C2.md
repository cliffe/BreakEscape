# Handover: slice 9.2 C2 reactive feed posts (2026-11-12)

Worktree `.claude/worktrees/p-9-2-c2`, branch `build/9-2-c2`. Plan
`docs/achitechture/ACCESS_MODEL_SLICE_9_2_C2_PLAN.md`. Build log section at the end of
`ACCESS_MODEL_SLICE_9_2_BUILD_LOG.md` (sub-slice C2). Common rules: scratchpad
`COMMON_BRIEF.md`; `export RBENV_VERSION=2.7.8`; validator with `/usr/bin/ruby3.2`; full suites
under `flock .../tests.lock`; no merge/rebase except the one `main` merge noted below; UK English,
cyber security two words, no em or en dashes, no model names in repo files.

## Done (committed, all tests green)

Engine, validator and leak scanner are built and unit-tested. See the build-log C2 section for the
helper list and the four commits (`9db901aaf`, `d46e9140c`, `2710c25fc`, `5617fc7c2`), plus the
build-log/handover doc commit.

- `AccessWork` has the full condition/selection/reachability surface; the one copy of the rule lives
  there and `NpcFrustration` wrappers call it.
- `feedRevealed` is now `{ shown:[ids], at }`; `AccessWork.feed_shown_ids` migrates a legacy
  `{ n, at }` save (first n ordered ids).
- Route, `feed_posts_for_client`, `feed_answer`, leak scanner, validator all updated.
- `test/unit/access_work_feed_select_test.rb` (15 cases) is the core proof of the selection logic.
- Baseline validator on `scenarios/test_access_social/scenario.json.erb` is 0 ❌.

## Open work, in order

1. **Re-merge `main`** (coordinator note: `main` moved to `f9a661a14`, 9.3b I/K, network code +
   validator + `games_controller.rb` route lists). Keep both sides on any conflict. Do this before
   the final suites.
2. **Helper-equality unit test** (plan 9): a test that `AccessWork.cause_holds?` and
   `AccessWork.globals_hold?` give the same answer as the `NpcFrustration` instance wrappers over
   the same `player_state`/scenario, **including** the `locked_out` pre-gating case (a
   `loginLockouts` key but no `check` record: both false; both true once the record exists). The
   wrappers are private Game methods, so build a Game (see `npc_frustration_test.rb` /
   `create_access_game`) and call via `.send`.
3. **Route + tampered-client tests** (extend `test/controllers/break_escape/feed_post_test.rb` and
   the tampered test): a reactive post served only when its condition holds; the pace floor still
   bites; a null-serve writes no `feedRevealed`; `done`/`tooSoon` bodies; a feed with an
   un-triggered reachable reactive post keeps `done:false`; the C-shape `{ n, at }` migration
   through `reveal_feed_post!` and `feed_posts_for_client` with no nil error; `feed_posts_for_client`
   lists an out-of-order reactive post in reveal order. Tampered: a client posting `npc_id` whose
   reactive condition does not hold gets `{ post: null }` and no text; extra request fields cannot
   force a post; the reactive text/fact are absent from every response until served.
4. **Leak-scanner no-exposure fixture** (plan 9): add a reactive post with a feed fact to the
   no-exposure fixture and assert nothing leaks before the condition holds, everything is present
   only in the `/feed_post` answer and osint reveal after. The validator too-short/embedded warnings
   for a reactive post/fact.
5. **Scenario beats F9 to F12** in `scenarios/test_access_social/scenario.json.erb` (plan 10): each
   its own room, sign, task, `npcNeedsSeed`, `npcWindupMs:0`, `needsDebugOverlay:true`, one task per
   beat by its own event, no password in a sign. F9 reactive_first `cause:down`; F10 mixed
   `workaround:borrow_session`; F11 facts_first `cause:[down,off]`; F12 `cause:social_blocked` then
   stops on `needMet` after a `borrow_session`. Reactive post text authored in the scenario only
   (plain, voiceable, >=12 chars, not a substring of another shipped string). Update
   `scenarios/test_access_social/PLAYTEST.md` with the reactive beats and the per-beat request
   budget. Keep F1 to F8 undisturbed. Validator must stay 0 ❌ (restore any
   `dungeon_graph.*` rewrites the validator makes).
6. **Live proof** on the keyless server, port 3030 (never :3000), headless,
   `--capture-responses`: cause an outage and read the vent on the osint terminal; clear it and
   cause another cause; perform a workaround and read its post; one reload proving `feedPosts`
   restores reactive posts in reveal order; a tampered client; run `access-leak-check.rb` over the
   captured responses; `verify-run.rb --access`; the per-beat `/feed_post` request budget. See
   `COMMON_BRIEF.md` for the keyless-server and Playwright env (start the 3030 server by hand the
   way `tools/playtest/start-keyless-server.sh` starts 3001; stop it afterwards; kill only your own
   PIDs).
7. **Full suites under the lock**: `bin/rails test` and `bin/test-js -j 3`. Then a final build-log
   update with the suite counts and the live-proof result.

## Gotchas

- `select_feed_post`'s `lockout_keys` defaults to `[]` for test convenience; the route always
  passes the pre-gated set.
- `done` must reflect the state after the serve: `select_feed_post` computes `feed_done?` over
  `shown + [chosen]`.
- The route must read `player_state['npcFrustration']&.dig(id)` read-only; never call the instance
  `frustration_entry(id)` (it writes a defaulted record under the game lock).
- The leak scanner trusts the `/feed_post` answer body for the served id (a C-era "out of order is a
  leak" test was inverted; an out-of-order serve is the server's own decision, not a leak).
