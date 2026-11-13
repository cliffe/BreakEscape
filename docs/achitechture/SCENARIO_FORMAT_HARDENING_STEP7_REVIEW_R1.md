# Step 7 review (R1): formatVersion and the load-time upgrader

Range reviewed: `git diff c9a4f7a84...2c08984fc` on branch build/harden-7 (worktree p-harden-7).
Reviewer stance: security and reliability of the game load/save path.

## Verdict on the core safety goal
No existing deployed game can stop loading or saving because of step 7. In step 7 `current = 0`.
Every game created before step 7 has no `formatVersion` (read as 0) and every new game is stamped 0,
so `ensure_current_format!` short-circuits on `stored == cur` BEFORE taking any lock, writes nothing,
and the bootstrap/header/client all agree on 0 (no mismatch, no reload, saving unchanged). A game is
only ever refused when `stored > 0` (impossible for real games; only the dev switch or
`swap --format-version` make those) or when `formatVersion` is a non-integer (no real game has the key
at all). Confirmed by `reload_persistence_test.rb` (69 runs) and `format_version_test.rb`.

## Tests run (test-lock rule: touched files only, no full suite)
- node: `format-guard.test.mjs` (19), `format-guard-sites.test.mjs`, `validator-retired-keys.test.mjs` - all pass.
- rails unit: `test/unit/format_upgrade_test.rb` - 12 runs, 43 assertions, 0F.
- rails controller: `format_version_test.rb` (17), `format_deployed_scenarios_test.rb`, `upgrade_games_tool_test.rb` - 26 runs, 116 assertions, 0F.
- rails: `reload_persistence_test.rb` - 69 runs, 254 assertions, 0F.
(All run with `RBENV_VERSION=2.7.8` and `BREAK_ESCAPE_FORMAT_TEST_STEP=1`; the switch is inert in env=test.)

## Test-quality reverts (in an isolated scratch copy via `git archive`, NOT the shared worktree)
1. Neutralised `sync_format_refusal` in `sync_state` (`format_refusal = nil`): the too-new sync-refusal
   test then returns 200 instead of 409 -> test fails as designed.
2. Changed `prepend_before_action :set_format_header` to `after_action`: 5 header-on-early-exit tests
   fail (header nil on the Pundit refusal, the too-new 409, etc.) -> tests fail as designed.
Both confirm the tests exercise the real change.

## Focus-area findings

### Blockers
None.

### Majors
None.

### Minors
None.

### Nits
- n1. `public/break_escape/js/format-guard.js:21,177` - `bannerShown` is assigned but never read. Dead state; drop it.
- n2. `app/controllers/break_escape/games_controller.rb:2021-2043` (`sync_format_refusal`) - the
  `raw.is_a?(String) -> JSON.parse` step is correct ONLY because the pg adapter returns a bare
  `jsonb -> key` expression as raw JSON text here (verified empirically: integer `5` -> `"5"`,
  string `"1"` -> `"\"1\""`, `null` -> `"null"`, missing -> nil; each then flows to `version_of` and
  matches the `set_game` path exactly, including `Unreadable` for a stored JSON string/float/negative
  and `0` for JSON null/missing). If a future adapter config decoded jsonb to native Ruby, a stored
  JSON *string* scalar `"1"` would decode to Ruby String `"1"`, and `JSON.parse("1") -> 1` would make
  sync treat it as a valid version 1 while `set_game` still refuses it as `Unreadable` - a latent
  divergence from the plan's claim that both paths agree. Not reachable in this deployment. A note in
  the method (or deriving the value without JSON.parse when `raw` is already non-String) would remove
  the coupling. Flagging, not blocking.
- n3. `tools/playtest/swap-scenario-game.rb:56-57` - the comment "the swap path updates an existing
  row, so before_create does not run" is inaccurate: the first `g.save!` IS a create and runs
  `before_create :stamp_format_version`, which stamps `current`; the override survives only because
  the second `g.save!` overwrites `scenario_data` (with `sd` carrying the override). Behaviour is
  correct; the comment misdescribes why. Doc-only.
- n4. `test/js/format-guard-sites.test.mjs` - the static scan is a useful lint but not the soundness
  proof the plan language ("the static scan's soundness") implies. The capture regex matches only
  `const/let/var X = [window.]fetch` and `this.X = fetch`; it misses bracket access
  (`window['fetch']`), destructuring (`const { fetch: f } = window`), and passing `fetch` as a call
  argument, and the transport bans cover only XHR/sendBeacon/`load.json` (not EventSource, WebSocket,
  `img.src` beacons). None of those forms exist in the engine today and the non-fetch transports do
  not load `scenario_data`, so the guard holds now; treat the scan as a backstop, not a guarantee.

## Area-by-area confirmations (no finding)
- Missing/nil/odd stored values: `version_of` (format_upgrade.rb:62) handles non-Hash and nil as 0,
  rejects String/Float/negative/true/false as `Unreadable`; `stamp_format_version` and `upgrade!` are
  all guarded by `is_a?(Hash)`. nil `scenario_data` is safe at cur=0 (never enters upgrade!). (Note for
  step 8 authors: once cur>0, a game with nil `scenario_data` would hit step transforms on nil - out
  of scope here.)
- Concurrent loads / row lock / deadlock: `ensure_current_format!` (game.rb) takes a single row lock
  via `with_lock`, reloads inside it, re-checks, upgrades, re-prepares only when
  `scenario_changed`, saves, commits - before the action body runs its own `with_game_lock`
  (sequential, not nested). `sync_state` takes the same single row lock and never upgrades. Only one
  row's lock is ever involved, so there is no lock-ordering inversion and no deadlock with sync; a
  second loader waits then finds the work done. At cur=0 no game takes the lock at all.
- Long upgrade under the lock: none in step 7; serialises only concurrent loads of the same game and
  happens once per game. Acceptable; noted for step 8.
- Reload loops (tabs, stale cache, session key): the `be-format-reload:<gameId>:<held>:<n>` session
  key caps reloads at one per (held,n) pair, so a stale-cached page that reloads back to the same held
  version shows the banner instead of looping; a held===null response (bootstrap not yet read, or
  bootstrap refused) is never compared; after a successful upgrade the reloaded bootstrap carries the
  new version so held==header and nothing fires. Rolling multi-server deploys can refuse a game an
  older server sees as too-new - by design, irrelevant to single-server Hacktivity.
- Every request behind the fetch guard: `window.fetch` is globally replaced; `format-guard.js` is
  main.js's first import (enforced); api-client and bare-fetch sites call the global and keep no
  reference (scan n4). Bootstrap uses XHR and is handled by `showBootstrapRefusal` on `loaderror`.
- Header / 409 leak: body is `{error, message, current}`; message only names format integers; header
  is one integer. No sensitive data.
- CSRF rescue JSON-only: `rescue_from InvalidAuthenticityToken` renders JSON 422 only when
  `content_mime_type&.json? || format.json?`, else re-raises so Hacktivity's `exceptions_app` 422 page
  is unchanged. `set_format_header` is prepended ahead of `verify_authenticity_token`, so the 422
  keeps the header. StaticFilesController skips both the header and CSRF.
- Refusal page pixel-art rule: `format_refusal.html.erb` uses GNF/Press Start 2P pixel fonts, a 2px
  solid square border, no radius/gradient/soft shadow. The client banner likewise (2px border,
  Press Start 2P, textContent). Compliant.
- Sweep tool dry-run safety: `tools/format/upgrade_games.rb` refuses a real run when
  `Rails.env.development?` (the shared dev DB), and `--dry-run` writes nothing (deep-copy replay).
- Validator rules: `check_retired_keys` errors on a template `formatVersion`, errors per retired key,
  warns for an aliased key, skips notes/free data; empty STEPS -> no corpus lines. Tests confirm.
- Sync size rule: `formatVersion` lives in `scenario_data` (written once at create/upgrade), never in
  player_state; the bootstrap gains one integer and each response one ~constant header; a refused sync
  writes nothing. Bounded. Compliant.

## Counts: 0 blockers, 0 majors, 0 minors, 4 nits.
