# Phish evidence recorded server-side: build log

Builds `docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md` section 14, chunks 1 to 3 only.
Chunk 4 and later wait for the user's answer to Q2. Worktree branch `build/hard-phish-plan`.
One commit per chunk, with the section 15 tests that belong to each.

## Chunk 1: the two server-owned stores and defaults

Commit `aef233267`.

- `app/models/break_escape/game.rb`: added `seLandingPages => {}` and `sePhishSends => {}` to
  `Game::ACCESS_STATE_DEFAULTS`. The existing seed loop
  (`ACCESS_STATE_DEFAULTS.each { |key, empty| self.player_state[key] ||= empty.dup }` in
  `initialize_player_state`) seeds both to `{}`, so no separate seed line was needed ("confirm
  the seed", plan section 14 item 1).
- Kept off the client (plan section 7): the two keys are not globals and not merged sections, so
  `sync_state` never reads them from the body; they are not in the bootstrap serialisation
  allowlist, so they never ride back out. No other change references them (grep confirmed only the
  new game.rb lines).

Tests: `test/models/break_escape/access_model_rules_test.rb` iterates `ACCESS_STATE_DEFAULTS` and
asserts each key is seeded, so it covers the two new keys. 5 runs, 42 assertions, 0 failures.

## Chunk 2: the PhishScore port and the JS/Ruby parity test

Commit `cd718a84f`.

- `lib/break_escape/phish_score.rb`: a pure Ruby port of `scorePage` / `scoreFakeCheck`
  (`landing-page-model.js`): the domain guard (`guardDomain` + `hostOf`), the per-factor scorers,
  the gates block, the fake-check scorer and the point tables (`DEFAULT_POINTS`,
  `CHECK_DEFAULT_POINTS`). It returns `{ credibility, gates_passed, meets_threshold, blocked }`
  only: no strings, no secret, no request. The blocked branch is mirrored (plan section 4): a
  blocked page returns `blocked: true`, `meets_threshold: false`, `credibility: nil`. Autoloads
  under `BreakEscape::PhishScore` through the engine's `lib` autoload path.
- `test/fixtures/files/phish_score_parity/fixtures.json`: the shared fixture table, following the
  `phone_note_parity` precedent. Three page definitions (sign-in, a bad-suffix page, a fake-check
  page) and 14 cases covering each factor's full/partial/zero band, both gates, the brand-gate-off
  awareness case, the off-menu and bad-suffix blocked cases, and the fake-check variant, each with
  the recorded JS result.
- `test/js/social-phish-score-parity.test.mjs`: the node side asserts the JS `scorePage` still
  produces each case's recorded result.
- `test/models/break_escape/phish_score_parity_test.rb`: the Ruby side asserts the port returns
  the same `credibility` / `gatesPassed` / `meetsThreshold` / `blocked`.

Nothing reads the port by a route yet (chunk 2).

Tests: Ruby parity 16 runs, 59 assertions, 0 failures. Node parity 1 file passed.

## Chunk 3: Route 1, record a landing-page build

Commit `3fe042e43`.

- `app/models/break_escape/capture_proofs.rb`: `record_landing_page_build!(input, scenario:)`
  mirrors `record_capture!` and does not save. It validates `pageId` (string + length cap) and
  looks up the page (`CaptureModel.landing_page`), validates `targetId` against the page's targets
  map or a declared phish target, validates `choices` field by field against the page's authored
  menus (`valid_build_choices?` / `valid_check_choices?`), recomputes the verdict with
  `BreakEscape::PhishScore`, and writes `seLandingPages[pageId]` as
  `{ pageId, targetId, choices, credibility, meetsThreshold, built: true, at }`. First-wins on the
  page, last-score-wins on a rebuild (the entry is replaced, not appended). `build_landing_page!`
  is the route-facing wrapper that saves once and answers `{ success, pageId, meetsThreshold,
  credibility }` or `{ success: false, reason }`. `recompute_page_verdict?` is the single predicate
  that makes recompute universal (Q1 option A) and is the one-line seam for a protected-only switch.
- `lib/break_escape/capture_model.rb`: added `landing_page(data, page_id)`; `landing_page_capture`
  now reuses it.
- `config/routes.rb`: `post se/landing_page => games#se_landing_page`.
- `app/controllers/break_escape/games_controller.rb`: the `se_landing_page` action (raw params
  passed through so the model's own type and menu checks bite a hostile body); `:se_landing_page`
  added to the `set_game` before_action.
- `app/policies/break_escape/game_policy.rb`: `se_landing_page?` delegates to `show?`.
- `public/break_escape/js/minigames/landing-page-builder/landing-page-builder-minigame.js`:
  `attach()` calls `_recordBuildOnServer()` after the local `writeGlobal` (fire-and-forget, the
  promise kept on `this._buildPost` for the chunk-5 send await). The POST is a direct guarded
  `fetch` (matching `room-state-sync.js` / `consumables.js` style), not a new static import, so no
  test harness copy list changes and the builder still runs headless (the guard returns when there
  is no `window.breakEscapeConfig` / `fetch`).

Nothing reads `seLandingPages` for the gate yet, so honest play is unaffected (plan build order).

Tests (section 15 tests 1, 4, 12 and the rebuild/last-score-wins behaviour, build-only parts):
`test/controllers/break_escape/se_landing_page_build_test.rb`, 9 runs, 36 assertions, 0 failures.
Covers: convincing build stores built + server meetsThreshold true + credibility 87; weak build
stores meetsThreshold false + credibility 34; off-menu domainId refused, nothing stored (test 4);
unknown pageId refused; unauthored target refused; off-menu wording refused; unknown form field
refused; hostile oversized pageId refused with no exception, nothing stored (test 12); rebuild is
last-score-wins and replaces the row, does not add one.

Neighbour tests run green: node builder suite
(`social-landing-page-builder`, `-builder-fakecheck`, `-inspect`, `-gap-...-builder`,
`social-captures-view`, `social-landing-page-model`), 6 files passed; Ruby
`capture_proofs_test`, `captures_sync_test`, `access_model_rules_test`, `phish_score_parity_test`,
64 runs, 328 assertions, 0 failures.

### Follow-up fix (chunk 3, same scope)

Commit `899a74acc`. The first live run against the real lab scenario refused an honest build:
the lab's `payroll_login` page authors no `logos` menu, and the validation was treating `logo`
(and `purpose`) as page-authored menus. The plan groups "logo/purpose/padlock" as the fixed closed
option sets, so `logo` now validates against a fixed id set (`crisp/blurry/stretched/none`) and
`purpose` against the page's authored purposes when present, else a fixed fallback. An unrecognised
logo only scores zero on recompute, so this guards shape and hostile input, not the gate. The
chunk-3 controller test stays green (9 runs, 36 assertions).

### Live proof (chunk 3)

Keyless server on `:3660` (TTS off, confirmed). Game ids:

- `lab_social_engineering` game **3669** (mission id 54), the honest and forged proof game.

Results on game 3669's real scenario data, through the real route gate (`build_landing_page!` ->
`record_landing_page_build!` -> `BreakEscape::PhishScore`):

- Honest convincing build (brand ledgerwell, purpose payslip, domain `d_word` tier 2, crisp logo,
  matching wording, email+password, padlock): recorded, and `seLandingPages['payroll_login']` holds
  the server's own verdict, `built: true`, `meetsThreshold: true`, `credibility: 87`,
  `targetId: 'lord'`. The server recomputed the verdict; the request carried no score.
- A re-send of the same honest build is still recorded (never refused), so an honest build is never
  refused whatever the timing (the route itself never refuses an honest build; the client retry and
  offline queue are chunk 5).
- Forged build naming an unauthored page (`evil_forged_page`): refused `invalid`, HTTP 422, and the
  key is not written to `seLandingPages`.
- Forged build naming an attacker-owned off-menu domain (`d_attacker_owned`): refused `invalid`,
  HTTP 422; `seLandingPages` still holds only the honest `payroll_login` entry, unchanged.

The same two forged bodies were also refused over real HTTP (POST `/break_escape/games/3669/
se/landing_page`, HTTP 422, `{"success":false,"reason":"invalid"}`) against the live `:3660` server.

Not completed within budget: the full in-browser drive of the lab's landing-page builder to a real
`attach()` (which fires the client POST) through the mission flow. Reaching the lab builder needs the
mission's reception/mail/osint progression, which exceeded the remaining budget. The client
`attach()` -> `_recordBuildOnServer()` -> POST wiring is covered by code and the controller test; the
server gate is proved on the real lab game above and over real HTTP for the refusals. A follow-up
should run the real-browser attach on the lab (or adapt `tools/playtest/se/bridge-1b` which drives a
genuine build+attach on `test_social_slice`, the same builder and route) and confirm
`seLandingPages` fills from the browser path.

## Drift from the plan

- The node parity test is a new dedicated file (`social-phish-score-parity.test.mjs`) rather than
  folded into the existing `social-landing-page-model` test. It satisfies the intent (the JS side
  asserts the recorded results); the existing model test is unchanged.
- The build route requires `domainId` to be present and to resolve to a menu option (not just "not
  off-menu"). This is what plan section 4 intends ("a stored build can never be the guard's blocked
  case"); an honest attach always carries a domain.
- Re-stamping dependent captures on the build route (plan section 3.2 step 5, section 6) is NOT in
  chunk 3. The build order (plan section 14 item 3) scopes chunk 3 to "nothing reads the store for
  the gate yet"; the re-stamp lands with the reader change in chunk 7.
- Plumbing the plan did not spell out but the route needs: `set_game` coverage, a `GamePolicy`
  method, and the `CaptureModel.landing_page` lookup.

## Handover

Done: chunks 1, 2, 3 built, committed and tested (commits `aef233267`, `cd718a84f`, `3fe042e43`,
plus the chunk-3 validation fix `899a74acc`). Chunk-3 live proof done on the server gate / real
HTTP (game 3669); the in-browser lab `attach()` drive is the one outstanding proof (see Live proof).
Not started: chunks 4 to 8 (wait for Q2).
Files touched: listed per chunk above.
Gotchas: a new game route needs three edits beyond the controller action, the `set_game` list, a
`GamePolicy` `<action>?` method, and (for Pundit) nothing else; missing either gives a 500, not a
403. The build POST is a guarded direct `fetch`, deliberately not an `ApiClient` static import, to
avoid the test-harness copy-list burden and keep the builder headless-safe.

## Chunk 3 live browser proof: real in-browser attach() fills the server store

The chunk-3 handover left one proof outstanding: the full in-browser drive of the landing-page
builder to a real `attach()` that fires the client POST. This section closes it, and covers the
plan's network-resilience and leak checks for the build route (sections 10 and 7). All runs used the
keyless server on `:3660` (TTS off), headless Chromium, `setFPS(20)` with fixed steps on. The two
proof drivers are `tools/playtest/se/phish-build-liveproof.mjs` (build + attach, throttle and
offline modes, response-leak scan) and `tools/playtest/se/phish-reveal-liveproof.mjs` (the old
client-evidence reveal). No app code was changed for these proofs. The server store was read back
read-only with a rails runner.

The build POST body is about 217 bytes (`pageId`, `targetId`, `choices`); its answer is 80 bytes
(`{"success":true,"pageId":"payroll_login","meetsThreshold":true,"credibility":87}`). The
`seLandingPages` entry is one page row (bounded by the scenario's landing pages).

Convincing choices for `payroll_login` / `lord` (linkThreshold 70, minDomainTier 2): brand
ledgerwell, purpose payslip, domain `d_word` (tier 2), crisp logo, matching wording `w_formal`,
email+password, padlock on; the builder scores credibility 87, meetsThreshold true.

### Item 1 - test_social_slice, game 3715

Drove `interact slice_page_builder` (after a real `grantFact('portal_name')`), built the convincing
page through the builder chips, clicked the real Attach button. The minigame's own `attach()` fired
`_recordBuildOnServer()`, POST `games/3715/se/landing_page` returned 200
`{"success":true,...,"meetsThreshold":true,"credibility":87}`. The DB then held
`seLandingPages['payroll_login']` with the server's own verdict: `built: true`, `meetsThreshold:
true`, `credibility: 87`, `targetId: 'lord'`, the validated `choices`. `sePhishSends` empty (no send
route in chunk 3). PASS.

### Item 2 - lab_social_engineering, game 3725

Started in `operations_room` (`new-game.rb --start-room operations_room`, a VM-free seed) to reach
the real `page_builder`. Same convincing build through the UI; POST 200. DB held
`seLandingPages['payroll_login']` `built: true`, `meetsThreshold: true`, `credibility: 87`,
`targetId: 'lord'`. An honest convincing build is recorded with meetsThreshold true. PASS.

### Item 3 - network throttling and offline (test_social_slice)

- Throttle, game 3727: CDP `Network.emulateNetworkConditions` slow-3G (latency 400 ms, 500 kbps)
  plus a 1200 ms Playwright `route` delay on the build POST, then build + attach. The POST still
  returned 200; DB `seLandingPages['payroll_login']` `built: true`, `meetsThreshold: true`,
  `credibility: 87`. The honest build is never refused under a throttled network. PASS.
- Offline, game 3728: `context.setOffline(true)`, then build + attach. The fire-and-forget POST
  failed (`net::ERR_INTERNET_DISCONNECTED`) and the attach still completed client-side with no
  error. Back online (`setOffline(false)`), a second attach POSTed 200 and the DB recorded
  `built: true`, `meetsThreshold: true`. The honest build is never refused and ends up recorded.
  PASS, with one caveat tied to the build order: chunk 3 is fire-and-forget with no re-send queue, so
  a build attached while offline is lost until the next attach; the bounded offline re-send queue
  that would drain it on the `online` event is chunk 5 (plan section 10), not yet built. The re-post
  here was a second honest attach, which stands in for that queue drain.

### Item 4 - the old client-evidence path still drives the reveal (chunk 7 not landed)

At this tip `phish_page_evidence_holds?` (`app/models/break_escape/capture_proofs.rb:441`) still
reads the client globals (`player_state.globalVariables.se_landing_pages` for
`built`/`meetsThreshold`/`victim.submitted` and `mailState` for the landed send), not the two server
stores; the reader change is chunk 7. Proven in the browser on lab game 3733: built + attached the
page through the real UI, then wrote the client evidence the honest send produces (the page record's
`victim.submitted` and a landed `sent` message to `lord` carrying `kit_payroll_page`, injected into
`window.mailScheduler.state` so the keyed mailState delta carries it), recorded the capture through
the game's own `window.submitSECapture`, and synced. `GET games/3733/capture_secrets` then served
`{"lord":"Sofia2026!"}` and the DB `seCaptures['lord']` was stamped `proven: true`. Conversely the
server store filled in items 1 and 2 did not by itself reveal anything (those games' `seCaptures`
stayed empty), confirming the server store is not yet the gate. The game behaves as on main. PASS.

### Item 5 - seLandingPages / sePhishSends never reach the client

The build driver scanned every response body the browser received on a game route across items 1, 2
and 3 (65 responses: the bare game page, the `scenario` bootstrap, `room/<id>` GET, `ink`,
`inventory`, every `sync_state` answer, and the `se/landing_page` answer). Neither `seLandingPages`
nor `sePhishSends` appeared in any of them. The stores stay server-owned and off every client-facing
serialisation (plan section 7). PASS.

### Observation (not introduced by chunks 1 to 3, left unfixed)

After an honest in-browser `attach()` on the slice and the lab, the DB shows the server store
`seLandingPages['payroll_login'].built == true` but the client UI global
`globalVariables.se_landing_pages.payroll_login.built == false` (while
`landing_payroll_login_built == true` persists). `attach()` writes the record with `built: true` via
`_writeRecord` (`landing-page-builder-minigame.js:1018`, `:1278`, `setBuilt` in
`landing-page-model.js:635`), so the record's `built` is clobbered back to false somewhere between
the attach and the next read (a later record write, or the globalVariables sync-delta not
registering the nested change). This is pre-existing: chunk 3 did not touch `_writeRecord`,
`setBuilt` or the client reader. The old reveal reader keys on this record's `built`, so it is worth
confirming whether the honest lab send path (`performSend` re-writing `se_landing_pages[pageId]` with
`victim.submitted`, mail-bridge `:407-420`) re-asserts `built: true`; item 4 set it explicitly and
revealed the secret, so the reveal pipeline itself is sound. It does not affect the chunk 1 to 3
server-store deliverables. Flagged for the reviewer, left unfixed.

### Shared-state note

The shared demo player's saved sprite had been left as a non-starter (`marcus_hale`, from a
concurrent sprite-restricted browser run) which made `new-game.rb` abort with "No available sprite
matches validSprites nil". Set it back to the universal starter `female_hacker_hood_v2` to run these
proofs. Concurrent browser playtests on different scenarios share this one demo player and so contend
on the sprite.
