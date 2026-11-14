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
server-store deliverables. Diagnosed and fixed below.

### Bug diagnosis and fix: the build POST reverted the client built flag (branch only)

Cause: a lost update between two concurrent writers of the same game row. On `attach()` the client
writes `se_landing_pages[pageId].built = true` and syncs it (`landing-page-builder-minigame.js`
`_writeRecord` / `state-sync.js`), then immediately fires the fire-and-forget build POST
(`_recordBuildOnServer`, `landing-page-builder-minigame.js:1035`). The POST route `se_landing_page`
(`games_controller.rb:1604`) was not in the `around_action :with_game_lock` list
(`games_controller.rb:103`), so it ran unlocked: `build_landing_page!`
(`capture_proofs.rb` Route 1) `save!`s the whole `player_state`. Its `@game` was loaded by
`set_game` before the attach sync committed, so its in-memory `globalVariables.se_landing_pages`
still held `built: false` (the pre-attach Score write). When the POST's `save!` committed after the
sync's, it wrote that stale copy back, reverting the synced `built` to false while correctly adding
its own `seLandingPages` store. `sync_state` takes a row lock (`Game.lock.select(...)` in a
transaction); the POST did not, so nothing serialised the two. This is the exact class of race the
`with_game_lock` comment documents (game 1022).

Repro (keyless servers, headless, honest build+attach through the real `page_builder` UI, then
`syncConfirmed`):
- Main 372600713 (`.claude/worktrees/p-hard-phish-base`, served on 3661, no POST route): the client
  global `se_landing_pages.payroll_login.built` persists `true`. Games 3783, 3797. Main is NOT
  affected: it has no concurrent full-row writer for this key.
- Branch before the fix (served on 3660): the client global persists `built: false` while the
  server store `seLandingPages` holds `built: true`, reproducing the observation above even after
  `syncConfirmed` reports the server acknowledged `built: true`. Games 3788, 3798.
- Branch after the fix: `built` persists `true` on both. Games 3801, 3804. An honest build+attach
  that relies on the persisted flag (no client injection of `built`) then drives the old
  client-evidence reveal to `GET capture_secrets` -> `{"lord":"Sofia2026!"}`, with
  `seCaptures.lord.proven == true`. Game 3806.

So the honest lab reveal was at risk on this branch only (the old reader keys on the client record's
`built`, `capture_proofs.rb:619` `phish_page_evidence_holds?`), not on main. Build-log item 4 passed
earlier only because it injected `built: true` after the attach, masking the revert.

Fix (this branch): add `:se_landing_page` to `around_action :with_game_lock`
(`games_controller.rb:103`), so the route reloads `player_state` under the row lock before its write
and serialises with `sync_state`. The locking guard test
(`test/controllers/break_escape/game_state_locking_test.rb`) gained `build_landing_page!` as a
recognised state writer and a specific `se_landing_page is locked` case; both fail with the lock
removed and pass with it.

### Shared-state note

The shared demo player's saved sprite had been left as a non-starter (`marcus_hale`, from a
concurrent sprite-restricted browser run) which made `new-game.rb` abort with "No available sprite
matches validSprites nil". Set it back to the universal starter `female_hacker_hood_v2` to run these
proofs. Concurrent browser playtests on different scenarios share this one demo player and so contend
on the sprite.

## Chunk 8: validator rule and schema confirmation

Plan section 13. Built on its own branch (`build/hard-phish-c8`, from the reviewed tip of chunks 1
to 3); touches only the validator, a node test and this log, so it merges without the app/engine
chunks 4 to 7.

### The rule

A landing page whose `capture.secret` is a hard-access value must be reachable only through a link
kit, so the server can gate the reveal on a recorded build and a landed send. Without a link kit the
server has nothing to gate on, so a tampered client could forge the build and send state and be
served the secret. The rule lives in `check_access_model` (`scripts/validate_scenario.rb`), right
after the existing NPC-capture lock-code block, because section 13 places it in the "access-model
pass" and that pass already builds the hard-access set and is the method the node tests drive. For
every `social.landingPages` entry whose `capture.secret` is in
`CaptureModel.hard_access_values(data)` (a password or PIN lock code, an RFID or biometric
`requires`, a Wi-Fi PSK, or a flag), it errors unless a `social.mailClient.payloadKit` link kit
names the page (the page appears in `CaptureModel.page_evidence_kits(data)` with a non-empty kit
list). A landing secret that opens nothing (every awareness page) is never flagged. The rule emits
only errors, never warnings.

`hard_access_values` was chosen over the narrower `lock_codes` to match the plan's own definition of
a protected secret throughout (a lock code, a PSK or a flag): it is a strict superset, so it still
covers the lock-code case section 13's parenthetical names.

### Review R1 follow-ups (this pass)

The round-1 review (`PHISH_EVIDENCE_C8_REVIEW_R1.md`) shipped the forge-closing rule but flagged a
section 13 deliverable left out and two edges. All four are now folded in; the rule now checks three
facts for every protected landing page, erroring on any one missing.

1. **Kit wiring** (the original rule): a `social.mailClient.payloadKit` link kit must name the page.

2. **Buildability** (Major 1, section 13 bullet 3): some closed-menu choice set must reach the aimed
   target's `linkThreshold`, so an honest player can produce a convincing page and the server can
   record a built page. Checked with the shared `BreakEscape::PhishScore` port
   (`lib/break_escape/phish_score.rb`), the same scorer the build route recomputes with, so the
   validator and the runtime cannot disagree on what is buildable. Without this an author could wire a
   protected secret to a page whose threshold no choice set can reach: the server's
   `phish_page_evidence_holds?` needs `meetsThreshold == true`, which the build route would never
   record, so the secret is withheld from honest play forever while the validator passed.

   `landing_page_buildable?` is a **bounded exhaustive search**, not a blind best-choice-per-part
   pick, because one choice is coupled: the brand choice feeds the brand points, the brand gate and
   the domain menu, and a domain option lives under its own brand. The search enumerates every
   `(brand, domain)` pair and, within it, every authored purpose and wording option. The three
   remaining factors are fixed to their own factor maximum, which is independent of every other
   choice, so fixing them loses no reachable credibility: logo `crisp` is the only full-points logo,
   `padlock` true the only full-points padlock, and choosing exactly a brand's `realFields` is always
   full form points (score_form rule 4). Each menu is a handful of options, so the product is tiny and
   the search is exact: no meeting choice set found means none exists. The fake-check variant
   (`fake_check_buildable?`) enumerates the full product of its four independent `check` menus.

3. **Kit reachability** (Major 1, second part): some authored `social.phishTargets` entry must be one
   the page aims at (a key of the page's own `targets` map), so the link kit has a real target that
   can be sent it and the server can record a landed send to it. This is a **structural check only**:
   it proves an aimed phish target exists and carries the per-target threshold. The full "a message
   can actually land" check (does a composed message pass the target's required factors) needs the
   send judge `BreakEscape::PhishJudge`, which arrives in **chunk 4**; it should be added here then,
   so an aimed target that no message could ever satisfy is caught at authoring time too. This is
   written in the validator comment on the rule and here.

**Minor 1 (Array-form only).** The rule now iterates only the Array form of `social.landingPages`
(replacing `CaptureModel.landing_pages`, which also accepts a Hash), matching exactly what the server
serves a phish secret from (`Game#capture_secrets_for_client`, `game.rb:1428`,
`pages.is_a?(Array) ? pages : []`). A Hash-form `landingPages` is never read by that serve path, so a
hard-access secret authored under a Hash form can never be served through the forge and needs no gate
here; erroring on it would be a false positive the server cannot reach. The Array-only reading was
chosen over erroring on a Hash form because mirroring the serve path is exact and raises nothing the
server would not itself serve.

**Minor 2 (NPC-capture warning widened).** The pre-existing NPC-capture block
(`validate_scenario.rb`, just above this rule) warned when a non-account NPC's `usePayload`/`addCapture`
secret equalled a *lock code* with no proof. It now warns on the full hard-access set (lock code, RFID
or biometric `requires`, Wi-Fi PSK, flag), because the server withholds a PSK or flag secret with no
proof the same way it withholds a lock code (`authored_capture_served?`). It stays a **warning**, not
an error: the server never over-serves such a capture, it only withholds it, so this is a dead-capture
author hint, not a forge. No shipped scenario trips the widened case.

### Schema

No schema change. `scripts/scenario-schema.json` already defines `landingPages`, `phishTargets` and
`payloadKit` (with `landingPageId`); the routes record derived facts and add no authored field, so
the authored shapes are unchanged (plan section 13). Confirmed untouched.

### Tests

- Node cases `test/js/validator-phish-evidence-secret.test.mjs` (driving `check_access_model`
  in-process over the Ruby validator). The factory now builds a page that is wired, aimed and
  buildable by default, with one toggle per failure mode. Cases: a wired, aimed, buildable secret
  raises nothing; no link kit, a kit naming a different page, or a non-`link` kit each error (kit
  wiring); an awareness secret that opens nothing is never flagged (kit or no kit); a Wi-Fi PSK
  behind an unwired phish errors and clears once wired (hard-access set is wider than lock codes); a
  wired page no phish target aims at errors (kit reachability); a wired, aimed page no choice set can
  make convincing errors, and a buildable one at the same threshold clears (buildability); a Wi-Fi
  PSK on a non-account NPC capture with no proof warns (Minor 2 widening). **10 subtests, all pass.**
- No new static import was added to any engine JS module, so no test-harness copy list changed. The
  validator requires `lib/break_escape/phish_score.rb`, which already existed from chunk 2.

### Validator counts (every scenario authoring a landing page or phish target)

Run `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <file> --no-graph`. Re-run after the
review R1 follow-ups: errors and warnings are still identical before and after for all 19 scenarios
(the "before" validator is the branch tip `2eccc2878`, run from a committed copy of its
`validate_scenario.rb`). No new error or warning fired on any shipped scenario: the lab's page is
wired through `kit_payroll_page`, aims at the authored `lord` target and is buildable (a best choice
set scores 100 against `linkThreshold` 70); every other page carries no hard-access secret; and no
scenario has a non-account NPC capture of a PSK or flag, so the widened Minor 2 warning fires on none.
The lab stays **0 errors**. No `dungeon_graph.*` rewrites (run with `--no-graph`; `git status` clean
bar `node_modules`).

| Scenario | errors (before=after) | warnings (before=after) | rule hits |
|---|---|---|---|
| lab_social_engineering | 0 | 8 | 0 |
| test_social_slice | 0 | 6 | 0 |
| ca01_invoice_fraud | 0 | 3 | 0 |
| ca02_cv_lures | 0 | 3 | 0 |
| ca04_exec_whaling | 0 | 3 | 0 |
| ca05_signin_pages | 0 | 3 | 0 |
| ca06_texts_and_qr | 0 | 3 | 0 |
| ca07_voice_ceo | 0 | 3 | 0 |
| ca08_after_the_click | 0 | 3 | 0 |
| ca10_downloads_and_fake_checks | 0 | 2 | 0 |
| ca13_ai_assistant | 0 | 2 | 0 |
| ca14_social_media | 0 | 2 | 0 |
| test_ink_email | 0 | 2 | 0 |
| test_social_board_indicators | 0 | 3 | 0 |
| test_social_docs_proof | 0 | 2 | 0 |
| test_social_episode | 0 | 6 | 0 |
| test_social_freetext | 0 | 3 | 0 |
| test_social_m5_channels | 0 | 7 | 0 |
| test_social_p9 | 0 | 3 | 0 |

(`ca*` scenarios that author no landing page or phish target cannot reach the rule's page loop, so
they gain no new error by construction.)

## Chunk 3 live browser re-proof after the build POST move (branch tip 0cfffe0bb)

Re-run of the chunk 3 live browser proof after commit ae3d74b8b moved the build POST out of the
landing-page builder overlay into `public/break_escape/js/systems/se-landing-page-client.js`
(`recordLandingPageBuild`), which the builder now holds as `this._buildPost`. Main 5edb17541 and
chunk 8 have been merged in since the earlier proof. No app code was changed for this re-proof.

All runs used the keyless server on `:3660` (TTS off), headless Chromium, `setFPS(20)` with fixed
steps on. Driver: `tools/playtest/se/phish-build-liveproof.mjs`, driving the REAL landing-page
builder through `window.__test` and clicking the real Attach button, so the minigame's own
`attach()` fires the POST through the moved client module. Server store read back read-only with a
rails runner. The shared demo player's saved sprite was already valid for both scenarios, so
new-game.rb did no sprite switch and none was needed.

Convincing choices for `payroll_login` / `lord` (linkThreshold 70, minDomainTier 2): brand
ledgerwell, purpose payslip, domain `d_word` (tier 2), crisp logo, matching wording `w_formal`,
email+password, padlock on. The builder scores credibility 87, meetsThreshold true.

### Item 1 - test_social_slice, game 4005 (normal)

Built the convincing page through the real builder chips and clicked Attach. POST
`games/4005/se/landing_page` returned 200
`{"success":true,"pageId":"payroll_login","meetsThreshold":true,"credibility":87}`. The DB then held
`seLandingPages['payroll_login']` with the server's own verdict: `built: true`, `meetsThreshold:
true`, `credibility: 87`, `targetId: 'lord'`, the validated `choices`. `sePhishSends` empty. The real
in-browser attach fills the store with the server verdict through the moved POST path. PASS.

### Item 2 - lab_social_engineering, game 4006 (lost-update check)

Started in `operations_room` (`new-game.rb --start-room operations_room`) to reach the real
`page_builder`. Same convincing build through the UI; POST 200. The DB held
`seLandingPages['payroll_login']` `built: true`, `meetsThreshold: true`, `credibility: 87`,
`targetId: 'lord'`. After the client sync the client record `globalVariables.se_landing_pages.
payroll_login.built` stayed `true` (and `landing_payroll_login_built` true). The lost-update that the
locking fix 6ea22ce9d closed does not recur: the honest build is recorded and the client built flag
is not reverted. PASS.

### Item 3 - throttled network, game 4007 (test_social_slice)

CDP `Network.emulateNetworkConditions` slow-3G (latency 400 ms, 500 kbps) plus a 1200 ms Playwright
`route` delay on the build POST, then build + attach. The POST still returned 200; the DB held
`seLandingPages['payroll_login']` `built: true`, `meetsThreshold: true`, `credibility: 87`. The
honest build is never refused under a throttled network. PASS.

### Item 4 - seLandingPages / sePhishSends never reach the client

The build driver scanned every response body the browser received on a game route across items 1, 2
and 3 (55 responses in all: the bare game page, `scenario` bootstrap, `room/<id>` GET, `ink`,
`inventory`, `objectives/tasks/...`, every `sync_state` answer, and the `se/landing_page` answer).
Neither `seLandingPages` nor `sePhishSends` appeared in any of them. The stores stay server-owned and
off every client-facing serialisation. PASS.

Game ids: 4005 (slice, item 1), 4006 (lab, item 2), 4007 (slice throttle, item 3). Server stopped by
PID afterwards. This section not committed: the full suites were running under the shared lock and
their finish could not be confirmed, so per the brief the re-proof write was kept out of the tracked
build log.

## Chunk A: Route 2 (phish send) and its store write

Built on branch `build/hard-phish-b` (worktree `p-hard-phish-b`). Route 2 records each phish
send server-side under the settled lighter gate (plan sections 3.3, 5, 7, 13): `landed` is true
exactly when the kit's landing page is server-recorded built by Route 1 with the server's own
`meetsThreshold` holding. The route resolves no account and judges no message; the composed
message is validated against the authored accounts and payload kits as hostile-input hygiene only
and never feeds `landed`. The body's `landed` is ignored.

Server:
- `CaptureModel.payload_kits` / `link_payload_kit` / `payload_kit_id?` / `mail_account_ids`
  (`lib/break_escape/capture_model.rb`): authored-set lookups for the kit and account validation.
- `CaptureProofs#record_phish_send!` and the route wrapper `send_phish!`
  (`app/models/break_escape/capture_proofs.rb`): validate target/kit/message, compute `landed`
  from `seLandingPages`, store `sePhishSends["targetId/kitId"]` (first-wins on landed, last-wins
  while a miss), re-stamp captures (the existing client-evidence reader, unchanged this chunk) and
  answer with the send verdict plus any freshly revealable capture in the sync's captures shape.
  `retryable` is set only when no built page is recorded yet (`page_not_built_yet`); a built-weak
  page answers `page_below_threshold` (permanent).
- `POST se/phish_send` (`config/routes.rb`, `games_controller#se_phish_send`), under
  `around_action :with_game_lock` and `before_action :set_game`, with `GamePolicy#se_phish_send?`.
- `game_state_locking_test.rb`: `send_phish!` added to the state-writer list, plus a focused
  `se_phish_send is locked` test.

Tests (Ruby): `test/controllers/break_escape/se_phish_send_test.rb` drives real POSTs: landed from
the built page, weak page -> landed false (not retryable), send before build -> retryable then
lands on re-post, unauthored target/kit refused, unauthored fromAccount/attachment refused,
oversized target/slot refused, body-asserted landed ignored, resend first-wins idempotent, the
superset property (a convincing build plus any authored send lands) and the guard property (a
weak/mis-addressed message over a convincing page still lands).

### Chunk A client wiring

- `systems/se-landing-page-client.js` registers each in-flight build POST per page id
  (`pendingBuildPost`), so the send client can await the build being recorded first.
- `systems/se-phish-send-client.js` (new): `phishSendBody` (bounds the body to the mail client's
  PENDING_MESSAGE_KEYS plus targetId/kitId), `recordPhishSend` (awaits the build POST, retries once
  on `page_not_built_yet`, queues on offline/still-not-built), `drainPhishSendQueue` (bounded queue
  keyed by targetId/kitId, drained on `online` and callable after a sync).
- `mail-client-minigame.js` `_handleComposeSend` posts a judged link send via a dynamic import of
  the send client. Dynamic, not static, so no mail-client test harness copy list changes and the
  builder folder stays network-free (social-landing-page-render still passes). The client reveal is
  unchanged (plan section 7); this POST is the server's own record.

Tests (node): `test/js/social-phish-send-client.test.mjs` (6 cases) asserts the body key bounding,
the build-await ordering, the one retry then land, the queue-then-drain, the bounded offline queue
(one entry per target/kit), and that a permanent below-threshold miss leaves the queue. Neighbours
re-run green: social-landing-page-render (15), social-landing-page-builder (19), social-mail-bridge
(23), minigame-se-close (13), social-mail-composer (29), social-captures-view (7).

### Still to do (handover)

- Live browser proof (plan section 15, Chunk A): keyless server on port 3664/3665, headless,
  setFPS(20) + fixed steps, drive lab_social_engineering build then send to lord with
  kit_payroll_page, assert sePhishSends landed via a fresh bootstrap/rails runner; include a
  delayed/aborted build+send POST and an offline build-then-send; record game ids. Not yet run.
## Chunk B: legacy migration and its gate

Plan sections 9, 9.1 and the chunk B parts of sections 14, 15. Built on branch
`build/hard-phish-mig` off `d0764d4b8`. Chunk A (Route 2, the send route) is built in parallel on a
separate branch and is not part of this chunk.

An old save holds its phish build and send facts in the client global
`globalVariables.se_landing_pages`, not in the two server stores. On the first bootstrap that holds
`scenario_data`, migrate it once: re-derive the build verdict with `PhishScore` from the stored
`choices` (never the old `meetsThreshold`), and import a landed send off the save's own durable
`victim.submitted` marker, gated on that re-derived build. The reader is still the old
client-evidence path, so this is behaviour-neutral for live play; it only readies the stores before
the reader flips in chunk C.

### What was built

- `legacy_phish_evidence?` (`app/models/break_escape/capture_proofs.rb`): a cheap, scenario-free
  predicate, true when `globalVariables.se_landing_pages` is a non-empty Hash and
  `phishEvidenceMigrated` is not set. Added to the OR in `bootstrap_state_needs_write?`
  (`game.rb`), so the lock is taken for exactly the save that needs the migration (a legacy global
  with already-migrated captures and empty new stores trips none of the other predicates).
- `migrate_legacy_phish_evidence!(scenario:)` (`capture_proofs.rb`): added to
  `run_bootstrap_writers!` (`game.rb`) ordered **before** `stamp_proven_captures!`, so a returning
  legacy save is migrated and stamped in one locked pass.
  - First line is the entry guard: `return false if player_state['phishEvidenceMigrated'] == true`.
    The lock predicate alone is not enough: `run_bootstrap_writers!` calls every writer whenever the
    lock is taken for any reason, and this migration leaves `se_landing_pages` in place (unlike
    `migrate_legacy_captures!`, which deletes its own trigger), so without the guard it would re-read
    the client-writable global on every later locked bootstrap.
  - Re-scores each legacy page from its stored `choices` through `PhishScore` (validated field by
    field against the page menus with the existing `valid_build_choices?` / `valid_landing_target?`
    helpers), writing the server's own `meetsThreshold`/`credibility` into `seLandingPages`,
    first-wins per page. Off-menu or absent choices migrate as not built (no entry; the player
    rebuilds).
  - Imports the landed send off `se_landing_pages[pageId].victim.submitted == true`, for a page
    wired to an authored phish target and an authored `kind: 'link'` payload kit, writing
    `sePhishSends["#{targetId}/#{kitId}"]` with `landed` taken from the re-derived build. No stored
    sent mail is consulted (the mailbox cap can trim it). First-wins on `landed: true`.
  - Sets `phishEvidenceMigrated = true` whatever the save held, so it runs a single time.
- `phishEvidenceMigrated` is a top-level, server-owned `player_state` key: not a global, never read
  from the `sync_state` body, never in the bootstrap serialisation allowlist (the `scenario` action
  attaches a named set of keys; it is not among them). It needs no `ACCESS_STATE_DEFAULTS` default
  (absent reads as not-migrated).

### Shared helper for chunk A to reconcile

`phish_page_build_landed?(page_entry)` (`capture_proofs.rb`, private) is the server's "landed" rule:
a send lands exactly when its kit's `seLandingPages` entry has `built == true` and the server's own
`meetsThreshold == true`. Route 2 in chunk A computes `landed` the same way off the same store, so
the two paths must share this one method. Chunk A defines its send route separately; at merge, the
orchestrator should point Route 2's `landed` computation at this helper (or reconcile a duplicate).
`migrated_build_entry` and `migrated_at` are chunk-B-only helpers.

### Tests (chunk B)

- `test/models/break_escape/phish_legacy_migration_test.rb`: 9 runs, 48 assertions. Covers
  `legacy_phish_evidence?`, an honest old save with no surviving sent mail (server verdict +
  imported landed send), a forged junk-choice save (meetsThreshold false, landed false), off-menu
  choices migrating as not built, a built-but-unsent page, an already-proven capture left untouched
  while the stores populate, runs-once (second call a no-op after `se_landing_pages` is edited),
  first-wins on `landed: true`, and the empty-global flag set.
- `test/controllers/break_escape/phish_legacy_migration_controller_test.rb`: 4 runs, 19 assertions.
  The `scenario` bootstrap on a legacy save takes the lock, migrates the two stores and stamps the
  capture in one pass; the two stores and the flag never ride the bootstrap back to the client
  (`savedGlobalVariables.se_landing_pages` still ships); `sync_state` does not run the migration;
  `phishEvidenceMigrated` is never accepted from a `sync_state` body.
- Touched-file neighbours (no lock, chunk B tip): `capture_record_test`, `captures_sync_test`,
  `reload_persistence_test`, `format_version_test`, `se_landing_page_build_test`,
  `capture_payload_secret_test`, `capture_proofs_test`, `capture_secret_endpoint_test`,
  `capture_secret_test`, `phish_score_parity_test` all green (201 + 62 runs, 0 failures). No JS was
  touched, so no node run.

### Live browser proof (chunk B)

Keyless server on port 3665 (`env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true RBENV_VERSION=2.7.8
bundle exec rails server -b 127.0.0.1 -p 3665`), started by hand, GEMINI warning confirmed in the
boot log. Three `lab_social_engineering` games created through `tools/playtest/new-game.rb`, each
seeded as a legacy save by rewriting its `player_state` JSON through `rails runner` (no migrations or
schema commands): `globalVariables.se_landing_pages.payroll_login` with a `victim.submitted` marker,
an unproven `seCaptures.lord`, and the two server stores and the flag cleared. Each game was loaded
headless in Chromium (Playwright, `setFPS(20)`, fixed stepping on), which fires the real GET
`/scenario` bootstrap. Server state read back read-only through `rails runner`. Server then killed by
PID; port 3665 confirmed down.

- **Game 4467: honest, no surviving sent mail.** After the bootstrap: `phishEvidenceMigrated =
  true`, `seLandingPages.payroll_login.meetsThreshold = true` (re-derived, credibility 87, not the
  seeded forged 99), `sePhishSends["lord/kit_payroll_page"].landed = true` (imported off the
  `victim.submitted` marker with no sent mail in `mailState`). The legacy `se_landing_pages` global
  is left in place. Under chunk B's old client-evidence reader with no sent mail the capture stays
  unproven; a direct simulation of chunk C's store-based reader against the migrated stores lands,
  so the secret is servable the moment the reader flips. The store import is mail-independent, as
  designed.
- **Game 4468: honest, full client evidence (stamp path).** Same legacy save plus a landed `sent`
  mail record. After the bootstrap the migration ran before the stamp in one locked pass and
  `seCaptures.lord.proven = true`, with both stores populated and the flag set. This is the literal
  "takes the lock, migrates and stamps" case.
- **Game 4469: forged, weak choices under a submitted marker.** After the bootstrap
  `seLandingPages.payroll_login.meetsThreshold = false` (re-derived from the weak choices, credibility
  34, not the seeded forged `meetsThreshold: true`), `sePhishSends["lord/kit_payroll_page"].landed =
  false`, the capture is not proven and chunk C's reader does not land, so the secret is withheld. A
  forged old marker is not laundered into a server fact.

Game ids: 4467, 4468, 4469. Server stopped by PID; port 3665 down.
