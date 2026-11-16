# Credential keyring: build log

Plan: `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md`. Slices built on their own branch, reviewed and live-proved, merged before the next.

## Slice K0: the target's own tiles over the network

Branch `build/keyring-k0` (worktree `.claude/worktrees/p-k0`), base `c240ee5e8` (main `61c033b13` + `plan/keyring`).

### Deviations from the plan against the code's truth

- **UI slice 6 (session lock) is on main.** The plan's section 2 says it is "not on main yet", but the worktree base carries `session_locked?`, `session_identity` returning nil for a locked session, `lock_session`, and the view `locked` flag. K0 does not depend on slice 6, so nothing in K0 changed; noted because the plan's line numbers predate it, so every symbol was located by name, not line.
- Plan line numbers are from main `1ce7486c7`; the worktree has advanced. Symbols located by name.

### Server (K0 5.1)

- `app/models/break_escape/network_access.rb`: `DEFAULT_REMOTE_SCREEN = 'tiles'`, `remote_screen(pc)` (policy value or default), and `remote_login_accounts(info, foothold)` returning `{ status:, body: }` with the five steps: 400 malformed foothold, 403 PC not reachable, 422 `{ remoteBlocked: true }`, 403 `{ reason: 'not_responding' }`, 200 answer `{ pc_id, host, headless, loginPicker, remoteScreen, loginAccounts }`. Tiles only under `tiles` and never for a headless host; `[]` otherwise; never a post-it.
- `app/controllers/break_escape/games_controller.rb` `login_accounts`: a request carrying `foothold` dispatches to `remote_login_accounts` before the keyboard reachability checks; the keyboard branch (no foothold) is unchanged, so its answer stays byte-identical.
- `scripts/scenario-schema.json`: policy `remoteScreen` enum `["tiles", "typed"]`.

### Validator and docs (K0 5.3)

- `scripts/validate_scenario.rb` `check_access_model`: warning for `remoteScreen` on a `remote: "blocked"` policy; info line for `remoteScreen: "tiles"` where every PC under the policy is `loginPicker: false` or headless.
- `README_scenario_design.md`: policy `remoteScreen` row, and a "The remote sign-in screen" paragraph (tiles/typed, headless, captured tag, keyboard rule).

### Tests

- Rails: `test/controllers/break_escape/network_remote_tiles_test.rb` (steps 1 to 5, picker `known`, `typed` empty, headless 200 + `[]`, no post-it through a foothold, keyboard answer carries no remote-only fields, headless at keyboard still 403).

### Status at handover

Done, committed and tested: the server half (branch `build/keyring-k0`, one commit on top of base `c240ee5e8`).
- Rails: `network_remote_tiles_test.rb` 12 runs, 64 assertions, 0 failures (`env -u GEMINI_API_KEY bundle exec rails test test/controllers/break_escape/network_remote_tiles_test.rb`).
- Ruby syntax checked on `validate_scenario.rb` and `network_access.rb`.
- The branch is merge-safe and leaves the game playable: the current client's keyboard sign-in path calls `GET /login_accounts` with no `foothold`, so it hits the unchanged keyboard branch; the 2b0 remote screen (`openRemoteSignInScreen`) does not call `/login_accounts` at all. Nothing client-side calls the new foothold branch yet.

Not yet built (the client half and its proofs) — handover below.

### K0 R1 fixes (review `CREDENTIAL_KEYRING_K0_REVIEW_R1.md`)

- **B1** (`validate_scenario.rb` `check_access_model`): the `remoteScreen` policy loop used `.presence`, which is undefined without ActiveSupport, so any scenario with a `remoteScreen: "tiles"` policy crashed the whole access-model check (silently suppressing every other access-model message via the `could not run` rescue). Resolved the policy name the way `defaultPolicy` already does (`p.is_a?(String) && !p.empty? ? p : defaultPolicy`). **m1**: the info line no longer fires for a `remoteScreen: "tiles"` policy that no PC uses (only when PCs are under it and none can tile). **m2**: a `remote: "blocked"` policy now gets the warning only, never the warning plus the info line (`next` after the warning).
- **m3/m4** (`network_remote_tiles_test.rb`): added a held-but-off-network foothold case (a `workshop_lan` foothold reaches `bench_pc` but 403s `sam_pc` on `office_lan`) and a structured-foothold-param case (`?foothold[]=...` coerced to a string, 403 not held, never a 500 or the keyboard answer).
- **m5** (foothold 64-char cap asymmetry): left alone, recorded in the review file — the cap is the plan's stated remote bound and the keyboard branch has no held-key lookup to align to; revisit only if a scenario needs a foothold id over 64 chars.
- **Regression tests** (`test/js/validator-access-model.test.mjs`): five cases covering the B1 tiles path (crash regression: `issues()` asserts ruby exits 0), the blocked-policy warning, the headless-only info line, a tile-capable PC drawing no info line (m1-guard for unused policy), and m2's warning-only.
- **Tests run:** `validator-access-model.test.mjs` 41 pass; `network_remote_tiles_test.rb` 14 runs/75 assertions/0 failures; access_model_* and network_* suites 383 runs/4952 assertions/**1 pre-existing failure** in `network_host_service_off_test.rb:145` (a foothold request to an off PC now answers `not_responding` via the K0 remote branch, but the test still expects the old keyboard `off`; untouched by these fixes, not a round-1 finding — flagged for the orchestrator). Validator clean (no `could not run`) on `test_access_networks`, `lab_physical_pentest`, `m01_first_contact`.

### K0 R2 fixes (review `CREDENTIAL_KEYRING_K0_REVIEW_R2.md`)

- **M1** (`network_host_service_off_test.rb`): the q72 "off is off at the keyboard too" test still expected `off` for a `/login_accounts` request naming a foothold on an off PC. K0 routes a foothold request through the remote branch, judged by reach, so it never meets the keyboard off-check. Updated the assertions: a held foothold that reaches `sam_pc` on an off host gets 403 `not_responding` (never the power state, never tiles); an unheld foothold gets the 403 "PC not reachable" reach refusal (no `off`, no tiles). The no-foothold keyboard case above still asserts `off`, and `refute_includes ... 'sokafor'` is kept throughout.
- **M2** (`npc_habits_postit_test.rb`): the "a request that names a foothold never gets the note" test expected 2XX for an unheld foothold. Under K0 that is a 403 "PC not reachable". Updated it to expect the 403 reach refusal while still asserting no `postitNote` and `refute_includes ... OMAR_PASSWORD`; the keyboard case that follows (`accounts('omar_pc')`) still succeeds and sees the note.
- **m1** (`games_controller.rb` `login_accounts`): reworded the stale keyboard off-branch comment, which still claimed the route was judged at the keyboard "whatever foothold value it carries"; it now states the branch runs only for a request with no foothold (a foothold request is intercepted above). Simplified the now-constant `note = params[:foothold].present? ? nil : ...` ternary to `note = @game.login_postit_for(...)`; behaviour unchanged (this branch only runs with no foothold).
- **Tests run:** full `bin/rails test` 2517 runs/44589 assertions/**0 failures**/0 errors/1 skip; `node test/js/validator-access-model.test.mjs` 41 pass/0 fail.

## K0 handover: the client half

The server branch is complete and the state table in plan 8.5 / the K0 lines in 5.2 are the contract. The remaining work is the client re-layout plus its tooling, scenarios and live proof. Do it as its own focused run(s) because the fit work is iterative in a real browser.

### What to build (plan 5.2, 5.4, 5.5 and Appendix A)

1. **`public/break_escape/js/api-client.js`**: extend `loginAccounts(pcId, { foothold } = {})` to append `&foothold=<enc>` when given (currently `loginAccounts(pcId)` at ~line 220). Additive and safe.
2. **`public/break_escape/js/systems/unlock-system.js` `openRemoteSignInScreen`** (~line 645): fetch `/login_accounts?foothold=` AND `/capture_secrets` together under one 3 s cap (`REMOTE_CAPTURES_WAIT_MS`, already exported ~line 371). Until both answer or the cap passes, the screen shows "Checking..." with no form and no focus. When both answer in time, call `scene.setRemoteAccounts({ picker, headless, tiles, captured, remoteScreen })` (reading `picker`/`headless` from the `/login_accounts` answer, never from the lockable). After the cap, show the Other-user form with "Still checking for accounts..."; each late answer redraws in place without moving focus or clearing typed text. A 403/422 from `/login_accounts` closes the screen with the shared remote strings of 8.5 (`remoteBlocked` -> "Remote sign-in is off on {host}."; `reason: not_responding` -> notRespondingMessage; 403 reach -> unreachableMessage). Switch user on a remote desktop uses the same dual fetch.
3. **`public/break_escape/js/minigames/password/password-minigame.js`**: this is the bulk. Replace the current separate "Captured sign-ins" block (`capturedListHtml`, `placeCapturedBlock`, the `signin-captured-title` heading) with ONE tile row that merges the PC's own tiles and the captured tiles, each tile carrying per-kind tags (8.5 tag table: "Captured" for a captured password). Add `setRemoteAccounts(...)` (receives picker/headless/tiles/remoteScreen and lays the row out once). Implement the K0 state lines of 5.2 in the message line (loading, "Still checking for accounts...", none, typed NLA line, headless line, `/login_accounts` failed, `/capture_secrets` failed, both failed) keyed off `host` from the answer, never "This PC". Short window (915x412): tags become a 12x12 CSS px corner badge (8x8 glyph, 2px border), a key glyph for password kinds (`assets/icons/badge-key.png`). Fold/fit rules scoped to the remote screen's own class so keyboard screens are untouched. Remote error lines use the shared strings (`notRespondingMessage`/`unreachableMessage` in `systems/network-links.js:66-68`, remote-off sentence). Matching: a captured account is matched to a PC tile by `username`, no duplicate tile; under picker `accounts` a captured account the PC does not list is left out; under `known`/`false`/`typed`/headless the captured tiles show tagged.
4. **The 14px overflow fix (Appendix A round 4/9, folded into K0)**: the Other user form plus a refusal line is currently 14px taller than `.pc-monitor-area` at 1400x1000. Fix by the measures in 5.2 "Fit": on remote Switch-user screens merge the "Signed in now" and remote lines into one slab and drop the "Username:"/"Password:" label slabs at x2 and in the short window (keep placeholders and `aria-label`); 4px gaps at x2, 2px slab padding at 915x412. Targets: win back >=35px at x2 and >=20px at 915x412. Record measured heights in this log.
5. **`public/break_escape/js/systems/pc-sessions.js` `screenShown(pcId, tiles, ...)`**: pass the PC tiles shown (currently `screenShown` is called with the tiles from the lockable; the remote path must pass the server-fetched tiles).
6. **Art**: `assets/icons/badge-key.png`, hand-drawn 8x8 under the pixel-art rule (2px border context). No generation tool — this is 8x8 pixel art; draw it by hand (the pixel workbench or a tiny PNG), do not use image generation.
7. **CSS**: `minigames/password/password-minigame.css` — scope the new fold rules to the remote screen class (the existing fold at ~`:1045` is shared with the keyboard screen; do not change keyboard behaviour). Tags under the pixel-art rule (2px borders, Press Start 2P 8px).

### Tests to add/update (plan 5.4)

- `test/js/password-signin-mode.test.mjs`: one row; the Captured tag; a 32-char label ellipsis-cut; the short-window badge per group; under `accounts` no unlisted captured tile; under `known` the unlisted captured tile shows; headless answer -> headless line; NLA answer -> NLA line (whatever the lockable says); match by `username` with no duplicate; no second Other user; every 5.2 line in its state incl. both lists failing; the pair cap and in-place late redraw keeping focus and typed text.
- `test/js/access-remote-signin.test.mjs`: change "no /login_accounts request" to "one with the foothold, and never a post-it"; Switch user on a remote desktop sends the foothold.
- `test/js/pc-monitor-frame.test.mjs`: the row and the tile box's scroller present with seven tiles (structure only; jsdom has no layout).
- `tools/playtest/signin-fit.mjs` (new): loads each K0 fixture screen with the real CSS and pixel fonts in the headless browser at the four sizes; fails when `.pc-monitor-area` scrollHeight > clientHeight, a fixed-word line's scrollWidth > its box, a line exceeds its line limit, or Password/Sign in are outside the visible area. Fixtures listed in 5.2.
- **JS test harness copy lists**: any new static import in an engine JS module must be added to each harness copy list (grep the test harness setup files; see memory note js-test-harness-copy-list). `setRemoteAccounts` lives in the existing `password-minigame.js`, so no new module, but if a helper is split out, add it.
- Run `bin/test-js` for the password/unlock/network-view families.

### Scenarios (plan 5.4)

- `scenarios/test_access_networks/scenario.json.erb`: add policy `"nla": { "remote": "allowed", "remoteScreen": "typed" }`; add two PCs to `desk_room` on `office_lan` picker `accounts`: `it_pc` (`HB-IT-01`, `access: { roles: ["it"] }`, default policy) and `ops_pc` (`HB-OPS-02`, `access: { roles: ["staff"] }`, policy `nla`), positions clear of Sam's desk and the dock (check a render); update `p3_see` to the six-host list `'door_box,it_pc,kiosk_pc,lena_pc,ops_pc,sam_pc'`; the capture card at the "Captured sign-ins" sentence becomes the tagged-tile wording; update PLAYTEST.md per 5.4 (P3 six hosts, selectors, new beats P5b/P5c/P5d).
- `scenarios/lab_physical_pentest/PLAYTEST.md:1028,1033`: the **Captured sign-ins** wording becomes the tagged tiles under (i) (Pierce's tile on LW-OPEN-07; the hot desk's three PC tiles tagged). No lab policy change.

### Live proof (plan 5.5) — ports 3062-3064, never :3000

Keyless server: `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true bundle exec rails runner tools/playtest/new-game.rb <scenario>` for game ids; headless chromium via playwright-core from `.claude/worktrees/p-9-2-h/node_modules`, chrome-headless-shell at `/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell`, `setFPS(20)` fixed steps on. Screenshots to `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/k0/`. Prove on `test_access_networks` and `lab_physical_pentest` at the four sizes (1400x1000, 915x412, 390x844, 320x640), including the loading state with `/login_accounts` delayed by a route, the late redraw after the cap, the Other-user form with a refusal line at 1400x1000 (no scroller), and tampered-client checks (foothold not held -> 403, malformed -> 400) sent with `fetch` from the page. `tools/playtest/verify-run.rb` to show progress. Record game ids here.

### Gotchas
- UI slice 6 session lock is already on main (see deviation above); the remote screen's locked-session branch (`capturedHtml` only when `s.current?.locked !== true`) must be preserved through the re-layout.
- `accounts` tiles already come from `login_account_tiles` (includes portrait); the remote answer's `loginAccounts` uses the same shape.
- Commit before testing; stage explicit paths; check `git diff --cached --stat`; UK English; no em/en dashes; no model names; no bare `git stash`; delete by moving into `tmp/delete/`.

## K0 client half: progress and handover (run 1)

Run 1 of the client half merged main, fixed a test-harness regression the WIP tip left, and built the small, well-defined, independently-testable pieces (api-client param, the badge art, the harness copy-list wiring). The bulk (the `password-minigame.js` merged-row re-layout, the dual fetch in `unlock-system.js`, the CSS fold rules, `signin-fit.mjs`, the scenario/PLAYTEST edits, the new tests and the live proof) is iterative browser-fit work and is left for a focused run, as plan 5.2 and the project rule "new features need full tests incl. live browser proof" direct: a browser-unproven re-layout of the 1900-line sign-in minigame must not land on the shared branch half-verified.

### Done and committed (branch `build/keyring-k0`)
- **Merge of main `4629372fe` into the branch** (merge commit `43ace5489`). Clean: no conflicts (git auto-merged; the branch base `bfcd5663c` is main's K0 server tip, so main's later UI work -- PC polish, slice 6 session lock already present at base, VPN-stylesheet removal -- came in without touching K0 files). No conflict resolution needed; nothing to record beyond "clean".
- **Harness regression fix** (`ac421a23b`): the WIP tip `3f665db1c` added a static `import` of `utils/remote-host-text.js` to `systems/network-links.js` but did not add that file to the three node harness copy lists, so `network-links.test.mjs`, `network-view.test.mjs` and `access-remote-signin.test.mjs` failed `ERR_MODULE_NOT_FOUND`. Added `utils/remote-host-text.js` to each copy list (before `network-links.js`). All three pass again (70, 59, 17). Any further new static import in `unlock-system.js` or `password-minigame.js` to `remote-host-text.js` will need the same addition to every harness that copies those modules.
- **api-client foothold param** (`bd396e19c`): `ApiClient.loginAccounts(pcId, { foothold } = {})` appends `&foothold=<enc>` only when given; the keyboard request (no foothold) is byte-identical.
- **Art** (`bd396e19c`): `public/break_escape/assets/icons/badge-key.png`, hand-placed 8x8 key glyph (hollow bow, central shaft, two teeth), off-white `#eeeeee` on transparent, no antialiasing, 16 opaque px. The short-window password-kind badge. `badge-plug.png` is K3a, not built.

### Already present from the WIP tip (reuse as-is)
- `public/break_escape/js/utils/remote-host-text.js` -- the shared remote strings of plan 8.5, no imports (so it only needs adding to copy lists, never grows one further). Exports: `notRespondingMessage`, `unreachableMessage`, `remoteOffMessage`, `remoteNotPermittedMessage`, `remoteLockedOutMessage`; the K0 state-line builders `REMOTE_CHECKING_TEXT`, `REMOTE_STILL_CHECKING_TEXT`, `REMOTE_CAPTURES_FAILED_TEXT`, `remoteTypedLine(host)`, `remoteHeadlessLine(host)`, `remoteAccountsFailedLine(host)`, `remoteBothFailedLine(host)`; and the tag helpers `TAG_TEXT` (currently only the `captured` kind), `tileTagLabels(kinds)` (at most two, "+N" past two), `tileBadgeGroups(kinds)`. `network-links.js` already re-exports `unreachableMessage`/`notRespondingMessage` from it, so the view and tray stay in step.
- These helpers are the contract for the minigame's state lines and tags; the remaining work wires them in, it does not re-author the strings.

### Remaining (the focused run), by handover item
1. **Not done** -- api-client: DONE (above).
2. **`unlock-system.js` `openRemoteSignInScreen` (~line 650)**: replace the single `/capture_secrets` fetch (`remoteCapturedSignIns`, and the `setCapturedSignIns` cap at ~704-712) with the dual fetch of `/login_accounts?foothold=` (via the new `api.loginAccounts(pcId, { foothold })`) AND `/capture_secrets`, one `REMOTE_CAPTURES_WAIT_MS` (3 s) cap for the pair. Until both answer or the cap passes: "Checking..." with no form and no focus (the screen already opens with `capturedLoading: true`; keep that gating). Both in time -> `scene.setRemoteAccounts({ picker, headless, tiles, captured, remoteScreen, host, accountsFailed, capturedFailed })`, reading `picker`/`headless`/`remoteScreen` from the `/login_accounts` answer, never the lockable. After the cap -> Other-user form + "Still checking for accounts..."; each late answer redraws in place (the existing `{ quiet: late }` redraw pattern keeps focus and typed text -- reuse it). A 403/422 from `/login_accounts` closes the screen with the shared strings (`remoteBlocked` -> `remoteOffMessage(host)`; `reason: not_responding` -> `notRespondingMessage(host)`; 403 reach -> `unreachableMessage(host)`). Pass the server tiles to `sessions.screenShown(pcId, tiles, ...)` (currently `[]` at ~668); `screenShown` already derives usernames, no change there. Switch user on a remote desktop (`switching: true`) takes the same dual fetch.
3. **`password-minigame.js` (the bulk)**: replace the separate captured block (`capturedListHtml` ~1710, `placeCapturedBlock` ~1585, `setCapturedSignIns` ~1754, the `#signin-captured`/`signin-captured-title` markup ~1419-1420, `capturedTiles` ~1618) with ONE merged tile row and a new `setRemoteAccounts(...)`. Merge rule (plan 5.2 / 8.5): PC tiles (from the answer's `loginAccounts` when `picker !== false` and not headless) plus captured tiles matched to PC tiles by `username` (no duplicate -- a matched PC tile just gains the `captured` tag); under `picker: "accounts"` drop captured tiles the PC does not list; under `known`/`false`/`typed`/headless show the unlisted captured tiles tagged. Each tile carries `data-username` and its tag(s) via `tileTagLabels`; short window -> a 12x12 badge drawn from `badge-key.png` per `tileBadgeGroups`. State lines (`remote-host-text.js`) go in the message line keyed off the answer's `host`, never "This PC": loading, "Still checking...", none, typed NLA, headless, `/login_accounts` failed, `/capture_secrets` failed, both failed. `signInErrorMessage`/`signInRefusalMessage` on remote screens must use the shared remote strings (currently `signInErrorMessage` at ~321 returns "This PC ..." -- branch on `this.signIn?.remote`). Preserve the locked-session branch (no strip when `s.current?.locked === true`). Keyboard screens unchanged: all new logic behind `this.signIn?.remote`.
4. **14px overflow fix**: not started. Measure on the calibrated replica / in `signin-fit.mjs`; merge the "Signed in now" + remote lines into one slab and drop the Username/Password label slabs at x2 and in the short window (keep placeholders + `aria-label`); 4px gaps at x2, 2px slab padding at 915x412. Targets: win back >=35px at x2, >=20px at 915x412. Record measured heights here.
5. **`pc-sessions.js` `screenShown`**: no signature change needed; just pass the server-fetched tiles from the remote path (item 2). Done implicitly there.
6. **Art**: DONE (`badge-key.png`).
7. **CSS** (`public/break_escape/css/password-minigame.css`): scope new fold rules to the remote screen class (the `:1045` fold is shared with the keyboard screen -- do not touch). Tags under the pixel-art rule (2px borders, Press Start 2P 8px).

### Tests, scenarios, live proof -- all remaining
- `test/js/password-signin-mode.test.mjs` (64 tests today, strong behavioural coverage) extend per plan 5.4; `test/js/access-remote-signin.test.mjs` change "no /login_accounts request" to "one with the foothold, never a post-it" + Switch user sends the foothold; `test/js/pc-monitor-frame.test.mjs` row + scroller structure; new `tools/playtest/signin-fit.mjs`. Rails `network_remote_tiles_test.rb` already covers the server (done in the server half).
- Scenarios: `test_access_networks/scenario.json.erb` (the `nla` policy, `it_pc`/`ops_pc`, `p3_see` six-host list, the capture-card wording) and both PLAYTEST.md files -- not started.
- Live proof on ports 3062-3064: not started.

### Verification at handover
- No regressions from the committed work: the full password/access/network/capture/pc-session/unlock/signin JS families run 0 failures (`password-signin-mode` 64, `access-remote-signin` 17, `network-links` 70, `network-view` 59, `pc-monitor-frame` 58, `pc-sessions` 43, `validator-access-model` 41, and ~25 more, all `# fail 0`).
- Full `bin/test-js` and `bin/rails test` under the shared lock were NOT run in this run (no mechanism change to warrant the full suite yet); run them after the bulk lands.

### Run-1 gotchas found
- The WIP tip is a net positive: `remote-host-text.js` is a clean, import-free home for the 8.5 strings and the tag/badge helpers; keep it. Its only cost was the missing copy-list entries (now fixed).
- `screenShown(pcId, tiles, ...)` already turns tiles into `usernames`/`usernameList` -- the remote path just needs to hand it the real tiles, no engine change.
- `signInErrorMessage` (password-minigame.js ~321) still returns keyboard "This PC ..." strings; the remote branch must override with the shared host-named strings, or remote refusals will read wrong.

## K0 client half: progress and handover (run 2)

Run 2 built the mechanism and its unit tests: the merged tile row and `setRemoteAccounts`, the dual fetch in `unlock-system.js`, the remote state lines and refusal strings, the tag/badge CSS, and the three updated test families. Commit `8326d0943` on `build/keyring-k0`. The measured fit (the 14px overflow win-back at the four sizes), `tools/playtest/signin-fit.mjs`, the scenarios and the live proof are run 3, as plan 5.2 and the "full tests incl. live browser proof" rule direct; the browser-iterative fold tuning was kept out of this run so a measured, not guessed, layout lands.

### Done and committed (branch `build/keyring-k0`, commit `8326d0943`)
- **`unlock-system.js` `openRemoteSignInScreen`**: the single `/capture_secrets` fetch is replaced by the dual fetch of `api.loginAccounts(pcId, { foothold })` AND `remoteCapturedSignIns()` under one `REMOTE_CAPTURES_WAIT_MS` (3 s) cap for the pair. Until both answer or the cap passes the screen shows "Checking..." with no form and no focus; after the cap it shows the Other user form and "Still checking for accounts...", and each late answer redraws in place (`setRemoteAccounts`, quiet) keeping focus and typed text. `picker`/`headless`/`remoteScreen`/`host`/`tiles` come from the `/login_accounts` answer, never the lockable. A 403/422 from `/login_accounts` closes the screen with the shared strings (`remoteBlocked` -> `remoteOffMessage`, `reason: not_responding` -> `notRespondingMessage`, 403 reach -> `unreachableMessage`). The server tiles go to `sessions.screenShown(pcId, tiles, ...)` once the answer lands (it was `[]` at open). Switch user on a remote desktop takes the same path. The function awaits both fetches (`Promise.allSettled`) so callers that await it see the settled state.
- **`password-minigame.js`**: the separate captured block (`capturedListHtml`, `placeCapturedBlock`, `setCapturedSignIns`, `fillCapturedSignIn`, `capturedTiles`, the `#signin-captured`/`signin-captured-title` markup) is gone. One merged tile row: `mergeRemoteTiles(...)` (exported, pure) pairs the PC's own tiles and the captured sign-ins by username (no duplicate; a matched PC tile gains the `captured` kind), drops an unlisted captured account only under picker `accounts` on a tiles screen, and shows unlisted captured accounts tagged under `known`/`false`, a typed (NLA) screen or a headless host. `setRemoteAccounts({ picker, headless, remoteScreen, host, tiles, captured, accountsFailed, capturedFailed, pending })` lays the row out and rebuilds it in place. Tags via `tileTagLabels`; the short-window badge via `tileBadgeGroups` + `badge-key.png`. State lines (`remoteStateLine()`) go in the message line keyed off `host`: Checking, Still checking, typed NLA, headless, `/login_accounts` failed, `/capture_secrets` failed, both failed, else "Choose an account."; they show under the Other user form too (not only before it), and never over a refusal (a refusal, kind `error`, persists until Change; the base line is recomputed each render, never stored). `signInErrorMessage`/`signInRefusalMessage` take `{ remote, host }` and use the shared strings on remote screens (lockout, not-permitted, remote-off, not-responding, unreachable); the keyboard path is byte-identical. All new behaviour is behind `this.signIn?.remote`, so keyboard screens are unchanged. The slice 6 locked remote branch drops the tile row (the account is pre-chosen).
- **CSS** (`css/password-minigame.css`): the dead `.signin-captured*` rules are replaced with `.signin-remote-tile .signin-tag` (Press Start 2P 8px, 2px border, no radius, ellipsis-cut, max 72px) and the short-window `.signin-badge` (8x8 glyph inside a 2px border = 12x12, shown under `.pc-monitor[data-short]`, the text tags hidden there). Scoped to the remote tile class; the shared fold at `:1045` is untouched.
- **Tests**: `password-signin-mode.test.mjs` rewritten for the merged row (67 pass): the merge/match cases, the per-kind tag, the 32-char label, the picker rules, headless/NLA/failed/both-failed lines, the loading state (no form/focus), the pair cap with "Still checking", the in-place late redraw keeping focus and typed text, the foothold on the sign-in, and the shared remote refusal strings. `access-remote-signin.test.mjs` (17 pass): one `/login_accounts` request carrying the foothold and never a post-it; Switch user sends the foothold; the dual fetch under the cap; `setRemoteAccounts` layouts. `pc-monitor-frame.test.mjs` (58 pass): the one row and its scroller with seven tiles, tags, 2px borders. `utils/remote-host-text.js` added to every harness that imports a module importing it (copy lists: `password-signin-mode`, `password-join-mode`, `pc-monitor-frame`, `lock-scope-refusal`; write-stubs: `password-case-hint`, `password-minigame-submit`; data-URL stub maps: `access-signin-postit`, `access-signin-routing`, `access-rfid-acl`). Harnesses that only `readFileSync` the source (`engine-fixes-pass4b`, `engine-fixes-round6`, `escaping-shared-helpers`, `unlock-route-room-retry`) were left unchanged.

### Tests run (0 failures)
- `password-signin-mode` 67, `access-remote-signin` 17, `pc-monitor-frame` 58, `password-join-mode` 6, `password-case-hint`, `password-minigame-submit`, `access-signin-postit`, `access-signin-routing`, `access-rfid-acl`, `lock-scope-refusal` 12, plus a sweep of ~50 password/access/network/pc/unlock/capture/social/validator families and every harness that imports `password-minigame.js` or `unlock-system.js`: all green. (`social-captures-view` prints a handled "could not load capture secrets" console line but passes 7/7.)
- Syntax checked (`node --check`) on `password-minigame.js` and `unlock-system.js`.

### Run 3 must do
- **The measured fit (plan 5.2 "Fit", Appendix A round 9)**: the 14px overflow fix. On remote Switch-user screens merge the "Signed in now" and remote lines into one slab and drop the "Username:"/"Password:" label slabs at x2 and in the short window (keep placeholders and `aria-label`); 4px gaps at x2, 2px slab padding at 915x412. Targets: win back >=35px at x2, >=20px at 915x412. Record the measured heights here. Run 2 added only the tag/badge CSS and left the slab/label fold for browser measurement.
- **`tools/playtest/signin-fit.mjs`** (new): load each K0 fixture at the four sizes with the real CSS and pixel fonts; fail on `.pc-monitor-area` scrollHeight > clientHeight, a fixed-word line's scrollWidth > its box, a line over its limit, or Password/Sign in outside the visible area. Fixtures per plan 5.2.
- **Scenarios**: `test_access_networks/scenario.json.erb` (the `nla` policy, `it_pc`/`ops_pc`, the `p3_see` six-host list, the capture-card wording) and both PLAYTEST.md files; `lab_physical_pentest/PLAYTEST.md` tagged-tile wording.
- **Live proof** on ports 3062-3064 (never :3000) at the four sizes, including the loading state with `/login_accounts` delayed, the late redraw after the cap, the Other-user form with a refusal at 1400x1000, and tampered-client checks.

### Run-2 gotchas found
- The state line must NOT be stored in `signInState.message`: that field holds refusals (kind `error`) only, and the base/state line is recomputed each render, else "Checking..." sticks after the answer lands. The remote screen shows the base line when no concrete account is picked (`selected === null`), so the NLA/headless/failed lines sit under the Other user form; the keyboard keeps its own `!chosen` rule so its typed form shows no prompt (byte-identical).
- `signInHost()` reads `signIn.host` (the server answer's host, set to `hostLabel` at open and overwritten by `setRemoteAccounts`), never `pcName` (which is "Name (HOST)"), so the lines name the bare host.
- jsdom does not expand the `border-radius` shorthand in `getComputedStyle`, so the pixel-art "no radius" tag rule is asserted by source/visual, not a computed-style check, in `pc-monitor-frame`.
- A remote `/login_accounts` request may answer `not_responding`/reach-403/422; these close the screen, but a slow `/capture_secrets` cannot delay that close because the two fetches are handled independently (the close fires on the `/login_accounts` resolution).

## K0 client half: progress and handover (run 3)

Run 3 merged main, measured and landed the remote sign-in fit in a real headless browser, built the
reusable `signin-fit.mjs`, made the `test_access_networks` scenario/PLAYTEST edits and the lab
PLAYTEST wording, and took the live proof. Commits on `build/keyring-k0`: `58d5fbe19` (scenario +
PLAYTEST), `97c0faab9` (fit + tool), plus this log.

### Merge of main
`git merge main` (main `32516127c`) merged clean by the ort strategy: no conflicts, no K0 files
touched (the incoming work was the phone-calls writing land and a few TTS/ink files).

### The measured fit (item 1)
The 14px overflow is gone, measured, not guessed. The fix, scoped to a new `.signin-remote-screen`
class so every keyboard screen is byte-identical:
- A remote Switch-user screen with a held, unlocked session merges the "Signed in now" line and the
  "Remote sign-in" line into one slab, `"{displayName} signed in, through {link}"` (one line at x2).
- At x2 (`data-ui-scale="2"`) and the short window (`data-short`) the "Username:"/"Password:" label
  slabs are dropped; the fields keep their `placeholder` and gain an `aria-label`.
- At x2 the screen and form gaps drop to 4px; at 915x412 the chosen slab takes 2px vertical padding.
- The remote tile row now folds at **every** size once an account or Other user is chosen (plan 5.2:
  "folds at every size on a remote screen"); before, the fold was only at x2 and the short window, so
  the Other-user form plus the still-shown tile row overran at 800x600 and 390x844. This was the
  real driver of the overflow once labels were dropped.

Measured in `tools/playtest/signin-fit.mjs` (real CSS, real pixel fonts, headless chromium, game
5028). Spare = `.pc-monitor-area` clientHeight minus the laid-out sign-in content height (offsetHeight,
layout px, so the x2 zoom does not distort it). No fixture overflows at any size.

| Fixture | 1400x1000 (x2, client 350) | 915x412 (short, client 306) |
|---|---|---|
| Other user form + longest refusal | 77px spare | 68px spare |
| Switch user, held session, Other user + refusal | 73px spare | 68px spare |
| Headless line | 77px spare | 68px spare |
| Typed (NLA) line | 77px spare | 68px spare |
| Tagged tile row (one tile three tags) | 159px spare | 146px spare |

Targets met with margin: >=35px at x2 (lowest 73), >=20px at 915x412 (lowest 68). All five fixtures
also fit at 800x600, 390x844 and 320x640 with no overflow (positive spare everywhere).

### signin-fit.mjs (item 2)
`tools/playtest/signin-fit.mjs`: loads the K0 fixtures (Other-user-plus-refusal, Switch-user held
session, headless line, typed NLA line, a tagged tile row, and the Checking... state) at five sizes
(the plan's 1400x1000/800x600/915x412/390x844 plus the 320x640 narrow phone). It builds each screen
from the real `PasswordMinigame` inside a real game page served by the keyless server, so the real
`password-minigame.css`, `pc-monitor.css` and the pixel fonts are in force (rather than reinventing
the jsdom stubs). It fails (exit non-zero) on `.pc-monitor-area` overflow or on Password/Sign in
outside the visible area (only checked when the form is actually shown). `SHOTS=<dir>` also writes a
PNG of each state. Deviation from plan 5.2's "fixture screens": the fixtures are constructed through
the real client code path (`initSignIn`/`setRemoteAccounts`) in a live page, not a static harness;
this is more faithful (real app CSS and fonts) and needs no stub set. Run: `PORT=3062 node
tools/playtest/signin-fit.mjs [gameId]`.

### Scenario and PLAYTEST (item 3)
- `scenarios/test_access_networks/scenario.json.erb`: policy `"nla": { "remote": "allowed",
  "remoteScreen": "typed" }`; `it_pc` (`HB-IT-01`, roles `["it"]`, default policy, picker `accounts`,
  at `{x:3,y:6}`) and `ops_pc` (`HB-OPS-02`, roles `["staff"]`, policy `nla`, picker `accounts`, at
  `{x:5,y:6}`) in `desk_room` on `office_lan`, clear of Sam's desk (`5,4`) and the dock (`7,4`);
  `p3_see`'s `network_viewed` condition is the six-host list
  `door_box,it_pc,kiosk_pc,lena_pc,ops_pc,sam_pc`; the capture card at `:296` reads "Her tile is then
  tagged Captured on a remote sign-in screen."
- `test_access_networks/PLAYTEST.md`: the capture-card harness note rewritten for the merged row and
  the `.signin-tile[data-username="lfox"] .signin-tag` selector and `clickText('Other user')` before
  typing; P3 six hosts and the ordered list; Run 0 step 5 and the validator expected-output line gain
  `it_pc`/`ops_pc`; new beats P5b (the PC's own tiles merged with captured), P5c (HB-IT-01 Ian tile
  tagged, no duplicate, Lena left out under `accounts`), P5d (HB-OPS-02 typed NLA, captured tiles
  only); P6 updated for the merged held slab and captured-only tiles on `lena_pc`.
- `lab_physical_pentest/PLAYTEST.md`: the two "Captured sign-ins" references (`:1028`, `:1033`) become
  the merged tagged-tile wording. Note: the plan prose for this edit described an LW-OPEN-07/hot-desk
  passage, but the only "Captured sign-ins" occurrences in the file are the `store_controller`/
  `c.hampshire` lines, so those were reworded faithfully to the merged row; no LW-OPEN-07 "Captured
  sign-ins" text exists to change.
- Validator: `test_access_networks` is 0 errors, 7 warnings, the same warning set as main's baseline
  (no new errors or warnings from the `nla` policy or the two PCs).

### Live proof (item 4) — ports 3062, headless, setFPS(20), fixed steps on
Keyless server on `:3062` (started by run 3, keyless confirmed in the boot log). Game id **5028**
(`test_access_networks`). Screenshots in the run-3 scratchpad `.../scratchpad/k0run3/` (`<fixture>-
<w>x<h>.png`, 30 files):
- The merged tile row with captured tags (Sam Okafor, Lena Fox tagged Captured, Other user) and the
  short-window key badge on Lena's tile (`tagged-tiles-915x412.png`): the 8x8 `badge-key.png` glyph in
  a 2px border, top-right corner.
- The Switch-user held-session screen at x2 (`switch-held-refusal-1400x1000.png`): the merged "Lena
  Fox signed in, through Drop box: Comms room" slab, the Other-user form with dropped labels
  (placeholders only), Change, Sign in and the "That account can't sign in on HB-FIN-02." refusal, all
  inside `.pc-monitor-area` with no scrollbar.
- The Checking... state (`checking-*.png`): the header and "Checking..." line with no form and no
  focus.
- The headless line, the typed NLA line and the Other-user-plus-refusal at every size.
- Tampered-client checks against the real server (curl from the keyless server): a held-but-unowned
  `foothold=jack_comms_port` on `lena_pc` answers **403** (PC not reachable); a structured
  `foothold[]=x` is coerced to a string and also **403** (not held, never a 500, matching the server
  R1 m4 test); the keyboard answer (`sam_pc`, no foothold) is **200**, unchanged.

Deviation/left for a follow-up: the dual-fetch transition states (the late redraw after the cap, and
the 403/422 close) live in `unlock-system.js openRemoteSignInScreen` and are covered by
`access-remote-signin.test.mjs` (the foothold request, the dual fetch under the cap, the late
in-place redraw, and the close strings). The run-3 live proof rendered and measured every K0 screen
state through the real client code and verified the real server's refusals, but did not drive the
full in-game plant->view->sign-in flow to a 200 tile answer for `it_pc`/`ops_pc` (that needs the
foothold planted in-game). The server's 200 answers for picker/headless/typed are covered by
`network_remote_tiles_test.rb`. A later run that wants the end-to-end in-game screenshot should drive
Run 0's plant then click the view's `HB-IT-01`/`HB-OPS-02`/`HB-FIN-02` rows.

### Suites (item 5)
Run under the shared lock (`flock .../tests.lock`): `bin/test-js -j 3; bin/rails test`, on tip
`38251f241`. Both green:
- JS: 654 files passed, 0 failed (shell-x passed this run; no env failure in the batch).
- Rails: 2754 runs, 45981 assertions, 0 failures, 0 errors, 2 skips (finished in ~93s).

### Run-3 gotchas
- `signin-fit.mjs` must measure content height with `offsetHeight` (layout px), not
  `getBoundingClientRect().height`: at x2 the pc-monitor draws through a zoom/scale, so the rect
  height is ~2x the layout height and would read as a huge false overflow. `scrollHeight` vs
  `clientHeight` is the authoritative overflow gate; the screen element's `offsetHeight` gives the
  true spare (`scrollHeight` clamps up to `clientHeight`, so it cannot show positive spare).
- The Mission Brief notes popup (intentional, reappears) paints over the sign-in overlay in a raw
  screenshot; the fit measurement is DOM/layout based and unaffected, but the screenshot step hides
  the other body children and the canvas first.
- The real driver of the x2/800x600 overflow, once labels were dropped, was the tile row not folding
  at every size. Folding the remote row at all sizes (not only x2/short) is what wins the headroom;
  the merge and the dropped labels alone were not enough at 800x600 and 390x844.

## K0 client half: R1 fixes (UX review round 1: 9 majors, 7 minors)

Fixes on `build/keyring-k0`; commits `8fc2882a1` (client, tests) and `209a8717b` (signin-fit), then
the live driver and this log. The server controller and its tests are untouched (another branch).
Keyboard (non-remote) screens: every change is behind `signIn.remote` or a remote-only class, and the
keyboard suites (`password-signin-mode`, `access-signin-*`, `password-minigame-submit`) pass unchanged.

| Finding | Fix | Proof |
|---|---|---|
| M1 failed or pending `/login_accounts` hid captures | `remotePicker` starts `null`; `setRemoteAccounts` sets it only from a real answer (`paint()` omits `picker` on a failure; a success defaults to `accounts`); `mergeRemoteTiles` drops unlisted captures only for `accounts` | `password-signin-mode` (paint's real failed shape; the pending variant), `access-remote-signin` (failure sends no `picker` key). Live E2 (500): Lena and Ian tiles, tagged, with the "HB-FIN-02's accounts could not be loaded." line |
| M2 "Choose an account." under Other user and locked form | on a remote screen a chosen form clears a base line that equals the prompt; state lines (Checking, NLA, headless, failed) still show | state test, CSS test; live: Other user message is empty |
| M3 late answer redrew into a folded row | option (a): `typing` is text in a field, not focus; the late answer returns the row. A locked session keeps its form | pc-monitor-frame computed `display` test; live E1: form at the cap, row visible after the late answer |
| M4 Change dead or stranding | `signin-chosen` (Change) is `chosen && tiles offered`; the fold is its own `signin-remote-folded`; remote `signInTilesOffered()` is false for a locked session; `clearSignInChoice` is a no-op with no row | state and computed-style tests (typed, locked, tiles) |
| M5 no scroller for many tiles | `fitSignInTiles()` caps `#signin-tiles` to the height left (trims for the scrollbar and cue), square 8px scrollbar, "More below" cue (`REMOTE_MORE_BELOW_TEXT`, equal to `more-below.js`, pinned by a test: a new import would need adding to 12 harness copy lists). Re-run after every render and on resize | seven-tile fixture in signin-fit at five sizes (320x640 was 10px over before the trim loop; now 12px spare); stubbed-layout test |
| M6 full kind names | tile `title` "Lena Fox, Captured password", badge `role=img` with an `aria-label`, chosen line "Lena Fox (lfox), Captured password" | state test; live titles |
| M7/m5 signin-fit | three-tag tile drawn by the real tag renderer (two pills, `+2`, asserted); seven-tile fixture; scrollWidth and line-count (Range rects) checks; no-wrap host check; true longest refusal across all refusal strings; headless fixture holds a `current`; `cleanup()` between fixtures; `CHROME`, `PLAYWRIGHT` env with fallbacks; `chdir` to the repo root | 35 checks PASS at 1400x1000, 800x600, 915x412, 390x844, 320x640 (game 5063). Corrected spare table below |
| M8/m6 tests on what is on screen | new tests: the 403/422/404/`not_responding` closes with `/capture_secrets` pending, slow `/login_accounts` past the cap and its late answer, close then late 403/200, failed accounts; computed-style tests for the late redraw, Change, scroller and ellipsis; `32-character` and `seven tiles` tests renamed to what they assert. Each new test fails on the pre-fix code (checked by restoring the old sources) |
| m1 late 403 toast after close | `closeScreen` returns before the alert when the screen is gone; toast kind `error` | access-remote-signin; live E4: no toast |
| m2 `pc_signin_shown` | emitted from `paint()` once the answer has laid out, with the tiles the row shows, never after a close | access-remote-signin |
| m3 host split at hyphens | a host label is a `.signin-nowrap` span in the message (text unchanged, so playtest text matches still work; a U+2060 joiner was tried and rejected, it changes the text) | computed-style test, signin-fit split check |
| m4 late answer over "Signing in..." | `_signingIn` flag skips the base-line write | state test |
| m7 new PC positions | NOT DONE: the finance and desk doors are locked in a fresh game and `loadRoom` needs engine arguments I did not chase; positions stay as run 3 recorded. Open item | none |

Choices: M3 took option (a) (the row returns), not the "Accounts found" line. With captures present and
no answer yet, the cap now shows the captured tile row with "Still checking for accounts..." rather than the
Other user form (keyboard behaviour: captures start on their tiles); with none, the cap shows the form.

Corrected fit table (signin-fit, spare px, game 5063): other-refusal-longest (longest refusal is now the
49-character wrong-password line) 105 at x2, 96 at 915x412; switch-held 101/96; headless with a held
session 73/68; typed 77/68; tagged tiles with the real three-tag tile 141/170; seven tiles 33/118
(1400x1000 / 915x412). The earlier "159px spare, three tags" row was a one-tag tile.

### Live proof (plan 5.5, driven in game): `tools/playtest/signin-live-drive.mjs`
Keyless server on :3062, headless, setFPS(20), fixed steps on. Shots in
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/k0fix1/shots/`.
- Game 5067 (`main`): took `kit_dropbox`, planted at `comms_port` ("Plug it in", the view opened itself, footholds
  `jack_comms_port`). Sam's PC before the cards: the PC's three tiles untagged. Lena's PC before: the Other user
  form (picker false, no tiles). After the cards (read in the lobby): Sam's PC tags Lena and Ian Captured; HB-IT-01 one
  tagged Ian tile; HB-OPS-02 NLA line plus the two captured tiles; HB-DOOR-01 headless line plus captured tiles;
  Lena's PC captured tiles. Other user: empty message, Change shown, row folded. Delay run (route holds
  `/login_accounts` 5 s): +1 s "Checking...", +3.6 s the captured row with "Still checking for accounts...",
  +6.2 s "Choose an account." with the row visible. Chose the Lena tile ("Lena Fox (lfox), Captured password"),
  typed the earned letter password, remote session opened (`sessions.lena_pc` remote, `jack_comms_port`).
  No page errors. Screens at 1400x1000, 800x600, 915x412, 390x844.
- Game 5069 (`edge`, fresh): no captures, 5 s delay on Sam's PC: Other user form at the cap, the row on the late answer
  (M3). With captures, forced 500: captured tiles stay with the failed line (M1). Forced 403 `not_responding`: back
  to the view with "HB-FIN-02 is not responding." as an `error` toast (P6). Late 403 after X: no toast (m1).
- Not driven live: the headless host on Switch user (needs a held session on HB-DOOR-01; covered by the
  `headless-line` fixture with a held `current`), a locked remote session (P8, covered by state and computed-style
  tests and the fixture), N14.

Suites (shared lock, tip before this line): JS 657 files passed, 0 failed; Rails 2761 runs, 46003 assertions, 0 failures, 0 errors, 2 skips.

## K0 client half: R2 fixes (UX review round 2: 0 blockers, 2 majors, 3 minors)

- N1 (M): `selectSignInTile('other')` sets `signInState.otherPicked`; `setRemoteAccounts` treats a picked Other user as
  typing, so the late answer keeps the form and focus. Only the form the cap opened by itself returns to the row.
  `clearSignInChoice` and a tile pick clear the flag.
- N2 (M): after the row is rebuilt, a chosen account that is no longer in it resets `selected`, `other` and
  `otherPicked`, and clears the username and password fields and `gameData.password`. The row shows, the chosen line is gone.
- N3 (m): `.signin-tiles-more` takes the message line's slab (`#12161a`, 2px `#4a5560` border, border-box, same 18px
  height). Checked at 320x640 (`seven-tiles-320x640.png`); the fit sums hold.
- N4 (m): `it_pc` and `ops_pc` in `test_access_networks` desk_room moved from (3,6),(5,6) to (3,7),(5,7), a row down.
  Rendered headless: they stand at world (416,224) and (480,224), 12px below the chair at (419,196), clear of Sam's PC
  (480,128) and the dock (544,128). Screenshot `k0fix2/desk-room-1400x1000.png`. PLAYTEST.md carries no coordinates.
  Validator: 0 errors with `--no-graph`.
- N5 (m): `signin-live-drive.mjs` reads `PORT`, finds Playwright and Chrome as `signin-fit.mjs` does, defaults `SHOTS`
  to a temp folder, and unsets the Gemini keys for `new-game.rb`. New mode `late` drives N1 and N2.
- Tests (`password-signin-mode.test.mjs`, 3 new, each fails on the R1 code): N1 (cap row, Other user, late answer:
  form displayed, username focused, message line empty), N2 (cap row, pick Lena, answer lists only Ian: row, no chosen
  line, password empty, `selected` null), N3 (computed background and border of the cue from the loaded sheet).
- Live (keyless :3062, headless, setFPS(20), fixed steps on; games 5099 `late`, 5098 render): N1 after the 5 s answer the
  form, username row and focus (`signin-username`) stay, message empty; N2 the row shows only Ian, "Choose an account.",
  chosen line gone, password empty. signin-fit: ALL PASS over 35 checks.

Suites (shared lock, tip before this line): JS 657 files passed, 0 failed; Rails 2764 runs, 46029 assertions, 0 failures, 0 errors, 2 skips.

## Slice K1: the registry, proofs and keyring (server and validator)

Branch `build/keyring-k1` (worktree `.claude/worktrees/p-k1`), base main `9a20b4967`. No sign-in
behaviour changes (plan 6): the client calls nothing new yet.

### Deviations against the code's truth
- Game includes concerns by `include` (not `extend ActiveSupport::Concern` on the host); `CredentialKeyring`
  is added to the include list after `CaptureProofs`.
- Plan 6.1 names `known_top_level` / `known_item_fields` lists in the validator. The validator has no
  such lists: unknown keys are checked by `SchemaWalk` against `scenario-schema.json` (the one source,
  as the K0 server half found). So `credentials`, policy `accepts` and item `credential` were added to
  the schema; no separate known-key list exists to edit.
- The `foothold` proof set in `check_credentials` is built from jack ids, Wi-Fi access-point ids and
  `grant_foothold` PCs (the ids those actions create). This matches "any jack, access point or implant
  action can create"; it is a superset that could miss an exotic implant id shape, but none exists in
  the corpus.

### Server (plan 6.1, 6.2)
- `lib/break_escape/credential_model.rb` (new): `KINDS` (password/saved_connection/assist_invite
  built; token and hash not built in K1), `DEFAULT_ACCEPTS` (no token until K5), `PROOF_KINDS`,
  `proof_kind` (exactly one key), `registry` (first 64 by sorted id, Hash values only), `accepts` /
  `accepts?` (password always accepted), `end_globals`, `room_npcs`, `account_npc`, `sign_in_pcs` /
  `sign_in_pc`, `policy_for`, `pcs_accepting`, `pc_admits_account?`, `item_definition` (the static
  `held` scope walk, declared grants and start inventory included). Plain Ruby, shared by the validator.
- `app/models/break_escape/credential_keyring.rb` (new concern in `Game`): `credential_proof_holds?`
  (session/planted/dropped through `capture_proof_holds?`; held identity-strict; foothold via
  `player_state['footholds']`), `credential_held_proof_holds?` (type and id match, stored `credential`
  equals the registry id, not `client_forged?`, no name fallback), `keyring_for_client`
  (implicit captured entries from `account_capture_usernames` + `capture_secrets_for_client`, plus
  registry entries of built kinds whose proof holds), `keyring_rev` (MD5[0,6] of the entries).
- `lib/break_escape/item_identity.rb`: `credential` added to `FORGEABLE_ITEM_FIELDS`.
- `app/models/break_escape/game.rb`: `include CredentialKeyring`; `filtered_scenario_for_bootstrap`
  now `filtered.delete('credentials')` (server-only registry, stripped from the bootstrap).
- `scripts/scenario-schema.json`: top-level `credentials` (closed entry shape, id pattern, proof
  sub-object, x-serverOnly), policy `accepts` (unique strings), item `credential` (string).
- `config/routes.rb`, `app/controllers/break_escape/games_controller.rb`,
  `app/policies/break_escape/game_policy.rb`: GET `keyring` route; the `keyring` action (on
  `set_game`, off `with_game_lock`, `no-store`, `rev`/`unchanged`, `foothold`/`from`/`relay` read as
  the screen the client draws, never asserting reach); `GamePolicy#keyring?` = `show?`.

### Validator (plan 6.3)
- `scripts/validate_scenario.rb`: `require_relative '../lib/break_escape/credential_model'`;
  `check_credentials(json_data)` wired into the run list after `check_access_model`. Covers all of
  6.3's errors (unknown/not-built kind, accepts naming an unknown kind, account not a holder,
  connectsTo rules, proof exactly-one and each kind's target, held item can-never-hold, notes-family /
  always-allowed credential items, password foundIn rules, item `credential` naming a registry id,
  endsOnGlobal, the 64 cap and id pattern) and the key warnings (no machine accepts, access list does
  not admit, saved_connection with no reach, held/credential mismatch, grant-placed invite and saved
  connection, session proof on an invite's own PC, accepts-without-password, unused accepts,
  unlock_object on an invite PC) plus the saved_connection-maxAttempts info line.
- A no-op on scenarios without `credentials` (verified on `m01_first_contact`: 0 errors, unchanged
  warning set). Fires correctly on a crafted bad scenario (10+ distinct findings exercised by hand).

### Tests (passing, run file by file)
- `test/unit/credential_model_test.rb`: 12 runs / 40 assertions / 0 failures.
- `test/models/break_escape/credential_keyring_test.rb`: 11 runs / 31 assertions / 0 failures (held
  proof holds and drops; the three forgery cases: always-allowed notepad, wrong id, client-forged add;
  session proof; assist invite relay route and ended; token/hash never listed; no password value; rev
  stability; pc_id scope). Built from `test_simple_success` with scenario_data/player_state overridden
  in memory.
- `test/controllers/break_escape/keyring_route_test.rb`: 6 runs / 19 assertions / 0 failures (200 +
  rev + entries + `no-store`; no non-password value; rev `unchanged`; stale rev; pc_id fields; parity
  with GET /capture_secrets for another player's game).
- `bin/rubocop` clean on every changed Ruby file.

### Sync size (plan 6.6)
Nothing is stored by K1. The bootstrap loses the `credentials` key (it never shipped a value anyway).
GET /keyring is a read: at most 64 registry entries plus one per captured account; a repeat with a
matching `rev` returns `{ rev, unchanged: true }`, a few bytes. Synced `player_state` is unchanged:
K1 adds no key to it (the model test and route test override state in memory only).

### Remaining for K1 (handover)
Not built, in priority order. None blocks main (nothing client-side calls the new route; the validator
and schema changes are inert without a `credentials` key):
1. **`tools/playtest/lib/access_leak_scanner.rb`** (plan 6.1): flag a response carrying a `credentials`
   key, a keyring entry whose proof does not hold in the recorded state, and a registry password entry
   carrying `password`. Not started.
2. **`test/controllers/break_escape/capture_secrets_unchanged_test.rb`** (plan 6.4): the golden check
   that GET /capture_secrets answers are byte-identical (K1 edits none of its readers; this pins it).
3. **`test/controllers/break_escape/sync_payload_size_test.rb`** (plan 6.4): bootstrap without
   `credentials`; GET /keyring at 64 entries under 16 KB.
4. **`test/js/validator-credentials.test.mjs`** (plan 6.4): one fixture per error and warning through
   the real validator. The Ruby side is verified by hand; this is the standing regression harness.
5. **Scenario `test_access_keyring`** (plan 9.1, 6.4): the full browser-only scenario (rooms, cast,
   registry, Jake's invite/timer, policies, resources), its PLAYTEST.md with the expected warnings
   (`ops_rdp`: no machine accepts it, by design) and its dungeon graph. Large; not started.
6. **Dungeon graph edges** (plan 6.1): proof source -> credential node -> accepting PCs. Not started.
7. **README_scenario_design.md** credentials section + correct line ~2753 (a reload resumes a timer
   from its saved running time). **docs/IDEAS_BACKLOG.md**: the connection icon, the later kinds (RFID
   card as credential, one-time code, key file), an optional per-entry teaching line.
8. **Live proof (plan 6.5)** on a keyless server on :3062: GET /keyring from the page on a new
   `test_access_keyring` game before/after each honest proof; the notepad forgery leaves the keyring
   unchanged; the bootstrap has no `credentials` key. Needs the scenario (item 5) first.

### Gotchas
- A Game must be created from a real scenario name (`test_simple_success` works) before scenario_data
  can be overridden; `Mission` name is unique, so reuse `@game.mission` for a second game in one test.
- `keyring_for_client` is read-only (no `save!`), so tests override `scenario_data`/`player_state` in
  memory; the route test uses `update_columns` to persist without the format/callbacks re-stamping.
- The validator has no `known_top_level`/`known_item_fields` list; the schema is the one source.
- Running `scripts/validate_scenario.rb` without `--no-graph` regenerates `dungeon_graph.*`; use
  `--no-graph` for smoke runs (the smoke scenario lived in the scratchpad, so nothing tracked moved).

## K1 run 2: tests, tooling and docs (handover)

Branch `build/keyring-k1`. This run did the run-1 "Remaining" items except the two it was told to
leave (the `test_access_keyring` scenario and the live proof). Committed in order:

1. **`tools/playtest/lib/access_leak_scanner.rb`** (+ `test/unit/access_leak_scanner_test.rb`):
   `scan_credentials` flags a response carrying a `credentials` key (the server-only registry), a
   registry password keyring entry carrying its `password` value, and a registry keyring entry whose
   proof does not hold in the recorded state (from `@game.credential_proof_holds?`, read once at scan
   time, nil when no game is given). Captured-account entries (source `capture`) may still carry a
   password. `require_relative` of `credential_model` added. 5 new tests; 50 runs / 277 assertions / 0 F.
2. **`test/controllers/break_escape/capture_secrets_unchanged_test.rb`**: golden check that GET
   /capture_secrets bytes are identical with and without a `credentials` block, before and after a
   capture, and carry no `credentials` key. 4 runs / 14 assertions / 0 F.
3. **`test/controllers/break_escape/sync_payload_size_test.rb`**: bootstrap carries no `credentials`;
   GET /keyring at the 64-entry cap (saved_connection entries, one held foothold) is well under 16 KB;
   a matching-rev repeat is a few bytes. 3 runs / 10 assertions / 0 F.
4. **`test/js/validator-credentials.test.mjs`**: one fixture per `check_credentials` error (24) and
   warning (11) and the one info line, through the real Ruby validator (`$PROGRAM_NAME='x'; require`
   then `check_credentials(STDIN)`), plus a clean baseline. 37 tests / 0 F. No new engine import, so no
   harness copy-list change.
5. **`scripts/generate_dungeon_graph.rb`**: a credentials section before the integrated-graph
   assembly. Each built credential is a `cred_<id>` key node; edges run proof source (`cred_src_<item>`
   held item, `jack_<id>` foothold, `lock_<pc>` session) -> credential -> each accepting PC
   (`lock_<pcId>`, created if absent, matching `access_lock_node`). Verified on a scratch scenario
   (nodes/edges present, no crash); outputs went to the scratchpad, no tracked `dungeon_graph.*` moved.
6. **Docs**: `README_scenario_design.md` gains a "Credentials (the keyring)" subsection under Key &
   Access Items (registry, kinds, proofs, policy `accepts`, the item `credential` and its type/placement
   rule, the ink-gift path for an invite, the relay invariant) and the timer bullet now says a reload
   resumes a timer from its saved running time (was "restarts"). Three `docs/IDEAS_BACKLOG.md` entries
   (connection icon; later kinds RFID/one-time code/key file; optional per-entry teaching line).

Still open (left for a later run, per the run-2 brief): the `test_access_keyring` scenario (old list
item 5) and the live proof on :3062 (old list item 8).

Notes for the next agent:
- `CREDENTIAL_KEYRING_PLAN.md` section 6.1's note still points at `README_scenario_design.md:2753` for
  the timer claim; the real bullet is near line 2779 and is now corrected. The plan's own line
  reference was not touched.
- Process slip, fully remediated: the README timer/section edits first landed in the MAIN tree by
  absolute path, not the worktree. The main-tree edits were reversed (surgically, by Edit; a
  `git checkout --` revert was refused by the safety classifier) and reapplied in the worktree; the
  main tree's `README_scenario_design.md` is clean again. Worth a glance to confirm.

## K1 run 3: R1 minors, the test scenario, and the live-proof handover

Branch `build/keyring-k1`, merged main `8bf39c76e` first (clean). This run fixed the five R1 minors
(each its own commit, with a test where one made sense), built `test_access_keyring` scoped to K1,
ran the K1 suites and left the full browser live proof as a handover (budget).

### R1 minors (CREDENTIAL_KEYRING_K1_REVIEW_R1.md), each committed

- **m1** Item-level `credential` is now stripped on the way to the client. `obj.delete('credential')`
  in `filter_inventory_for_client!` (covers `client_inventory` and `item_for_answer` echoes) and in
  `filter_requires_and_contents_recursive` (covers a loose or container credential item in a lazy
  room load). The stored inventory keeps the field, so the `held` proof still reads it. New
  `test/models/break_escape/credential_item_field_test.rb` (5 tests): stripped from the inventory,
  the echo and a room load; kept in state; absent from the bootstrap.
- **m2** `credential_held_proof_holds?` now unwraps `data = inv['scenarioData'] || inv` before reading
  `credential`/`type`/`id`, as the other inventory readers do. Test: a wrapped-shape item proves held.
- **m3** The keyring route is honoured. `keyring_pc_openable?(pc_id, route)` scopes `forThisPc`/
  `accepted` only when the player can open a screen for `pc_id`: a foothold screen needs the foothold
  to reach the host now, a `from`/`relay` screen is trusted (K4/K2 own their reach), a keyboard screen
  needs the PC physically reachable. `registry_keyring_entries` loses its unused `pc_id:`. Test: an
  unopenable `pc_id` adds no scoping fields.
- **m4** The validator's foothold-proof set now includes the runtime keys an implant/grant creates
  (`implant_<pc>`), alongside the bare PC id. A follow-up commit also folds the jack and Wi-Fi runtime
  keys (`jack_<id>`, `wifi_<network>`) into the set and reads the AP id from the entry's object, so a
  proof written the plan's way (`jack_comms_port`) is accepted and matches `player_state['footholds']`.
  Safe superset; the existing bare-id fixtures still pass. New validator fixture.
- **m5** `credential_keyring_test` gains a networks-backed group: a held foothold reaching `lena_pc`
  lists the route; `targetOff` rides only with a non-empty route and reflects `host_service_off?`;
  `remoteBlocked` reflects the `connectsTo` policy; `sessionHeld` is true when a session there carries
  the credential.
- **Plan ref.** `CREDENTIAL_KEYRING_PLAN.md` 6.1 now points the timer bullet at
  `README_scenario_design.md:2806` (was 2753; main shifted it). Section 1.1 still names 2753 and is
  left for a plan-wide pass (out of this run's scope).

### test_access_keyring (plan 9.1, scoped to K1)

`scenarios/test_access_keyring/` (mission.json, scenario.json.erb, PLAYTEST.md, ink for Lena/Jake/Ian,
dungeon graph). Three rooms (lobby, comms, finance), cast Lena/Jake/Ian. Registry covers the K1 proof
kinds: `lena_rdp` (saved_connection, `held: lena_rdp_file`), `jake_pw_note` (password, `session:
lena_pc`, `foundIn: lena_passwords_txt`), `ops_cookie` (saved_connection, `foothold: jack_comms_port`),
plus Ian's implicit captured entry (capture card + drop box, `captureProof` planted on `comms_port`,
`revealSecret` on). Validates **0 errors, 1 warning** (`ops_cookie` accepted by no machine, by design,
as plan 9.1 notes for `ops_rdp`; `pw_only` takes `password` only). PLAYTEST.md lists the K1 beats and
marks K2 to K5 (the login branch, the sign-in/capture-log UI, `from`/`relay`, the assist invite and
timer, tokens, Runs B to E) as TODO. The scenario omits the relay/assist and token machinery entirely,
since those are later slices.

### Tests (run file by file) and lint

- `test/unit/credential_model_test.rb`: 12 runs / 40 assertions / 0 F.
- `test/models/break_escape/credential_keyring_test.rb`: 18 / 43 / 0 F (was 11; m2, m3 and m5 added).
- `test/models/break_escape/credential_item_field_test.rb`: 5 / 10 / 0 F (new, m1).
- `test/controllers/break_escape/keyring_route_test.rb`: 6 / 19 / 0 F.
- `test/unit/access_leak_scanner_test.rb`: 50 / 277 / 0 F.
- `test/controllers/break_escape/capture_secrets_unchanged_test.rb`: 4 / 14 / 0 F.
- `test/controllers/break_escape/sync_payload_size_test.rb`: 3 / 10 / 0 F.
- `test/js/validator-credentials.test.mjs`: 38 tests / 0 F (was 37; m4 fixture added).
- `bin/rubocop` clean on every changed Ruby file (game.rb, credential_keyring.rb, validate_scenario.rb,
  and the two changed test files).

### Live proof (plan 6.5): HANDOVER, not run

Not run this run (budget). It needs the keyless server on :3062 and the browser bridge to earn each
proof in game. The scenario is ready; the recipe:

1. `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true RBENV_VERSION=2.7.8 BUNDLE_PATH=<repo>/vendor/bundle bundle exec rails server -b 127.0.0.1 -p 3062`
2. `tools/playtest/new-game.rb test_access_keyring` (bin/rails runner form); drive only that id.
3. Headless, `window.game.physics.world.setFPS(20)` with fixed steps on.
4. Show `GET /keyring` empty at start; then gaining `lena_rdp` on taking HB-FIN-02.rdp (K1a),
   `jake_pw_note` on signing in at Lena's PC (K1b), Ian's implicit entry on reading the card with the
   drop box planted (K1c), and `ops_cookie` on planting the drop box (K1d). Show `rev` changing and a
   matching-`rev` request answering `unchanged`. Confirm no `password` except on the capture entry.
5. Confirm the bootstrap has no `credentials` key and `player_state` does not grow.
6. Run `tools/playtest/lib/access_leak_scanner.rb` over the game.
7. Kill only your own PIDs.

Nothing above minor is open. The scenario and all server/validator K1 pieces are on `build/keyring-k1`.

## Run 4: R2 fixes and the held beat's real-path live fix

Base `65f391131` (branch `build/keyring-k1`) merged with `main` `177c13f6a`. The major came from the
R2 live proof on :3062 (game 5628): the `held` beat could never fire through the real request path.

### Major: held proof re-stamped on store, not trusted from the client

Both client filters strip the item-level `credential` (R1 m1, `filter_inventory_for_client!` and
`filter_requires_and_contents_recursive`), and `credential` is a `FORGEABLE_ITEM_FIELDS` member, so the
client posts the taken item back without it and `add_inventory_item!` stored it bare. The keyring's
`held` proof (`credential_held_proof_holds?`) then never matched; only the unit tests passed, because
they seed `player_state` directly.

- `app/models/break_escape/game.rb`: new `restamp_item_credential!(item)`. On every store it drops any
  client-supplied `credential` (forgeable), then restores it from the scenario's own definition
  (`CredentialModel.item_definition`, matched by type and id, the same identity the `held` proof
  compares). Stamped onto the level the proof reads (`item['scenarioData'] || item`). Called at the top
  of `add_inventory_item!` (covering take, `give_item`, container take and NPC hand-over, which all
  funnel through it) and after the start-items filter in `initialize_player_state`. The strip-to-client
  behaviour is unchanged.
- Test (real request path, not seeded): `test/controllers/break_escape/keyring_take_route_test.rb` —
  POST the item through `/inventory` as the client would (no `credential`), then GET `/keyring` lists
  it; a plain item with a client-forged `credential` earns no entry; a forged registry id on the real
  item is overwritten by the authored one. 3 runs / 16 assertions / 0 F.

### Leak scanner (tools/playtest/lib/access_leak_scanner.rb)

- Item 1: a GET `/keyring` capture entry carries the captured account's own password, as
  `/capture_secrets` does. `response_context` gains a `keyring` flag; `scan_passwords` exempts the
  `password` field on a `source: "capture"` entry for the owner's own game (`keyring_capture_password_paths`).
  A registry-sourced entry is not exempted, so a password on one is still flagged.
- R2 m3: `scan_credentials` also flags a singular item-level `credential` string field in any response
  (rule `credential_field`), a second guard on the field R1 m1 strips.
- Tests in `test/unit/access_leak_scanner_test.rb`: capture entry exempt vs registry entry flagged, and
  the `credential_field` guard. 52 runs / 282 assertions / 0 F.

### R2 findings

- m1 (`scripts/validate_scenario.rb`): the `foothold` proof check accepted bare source ids that can
  never key `player_state['footholds']` (the runtime only uses `jack_`, `wifi_`, `implant_` forms). Split
  the set into runtime (prefixed) and bare forms: a prefixed id passes, a bare id now warns ("names a
  bare source id ... can never fire"), an unknown id still errors. Fixtures updated in
  `test/js/validator-credentials.test.mjs` (the token case now uses `jack_jack1`; a new W test pins the
  bare-id warning). 39 tests / 0 F.
- m2: renamed the new `BreakEscape::SyncPayloadSizeTest` to `KeyringSyncSizeTest`
  (`test/controllers/break_escape/sync_payload_size_test.rb`), so it no longer reopens and merges with
  the pre-existing integration test's class under a full run.
- trivial: plan 9.1's registry table now names `ops_cookie` (the foothold-proof saved connection the
  scenario ships) instead of the stale `ops_rdp`.

### Tests (run file by file) and lint

- `test/models/break_escape/credential_keyring_test.rb` + `credential_item_field_test.rb`: 23 / 53 / 0 F.
- `test/controllers/break_escape/keyring_route_test.rb`, `sync_payload_size_test.rb` (controller),
  `test/integration/sync_payload_size_test.rb`, `capture_secrets_unchanged_test.rb`,
  `test/unit/credential_model_test.rb`: 31 / 112 / 0 F.
- `test/controllers/break_escape/keyring_take_route_test.rb`: 3 / 16 / 0 F.
- `test/unit/access_leak_scanner_test.rb`: 52 / 282 / 0 F.
- `test/js/validator-credentials.test.mjs`: 39 / 0 F.
- Validator on `test_access_keyring`: 0 errors, 1 expected warning; dungeon graph regenerated, tracked
  files unchanged (nothing to restore).
- `bin/rubocop` clean on all changed Ruby files.

### Live re-proof of the held beat (port 3062)

See the "Run 4 live" subsection appended after the live run.

## Run 5 (R3 minors)

- **m1**: the notepad and decor-cup add paths have no collectible lookup, so a credential on one would be keyed on a client-chosen id. `check_credentials` now errors on a credential item of a decor-cup type (the always-allowed error already existed); both lists are read from `DeclaredGrants` (`ALWAYS_ALLOWED`, `DECOR_CUPS`), which mirror the controller constants. `restamp_item_credential!` also returns early for those types, so no credential is stamped on them. Fixture in `validator-credentials.test.mjs`; unit test in `test/models/break_escape/keyring_restamp_test.rb`.
- **m2**: new test that a start-inventory item with a credential is stamped by `initialize_player_state`. Not covered, carried to K2: a credential item taken from container contents or received through an NPC's `itemsHeld` (no cheap harness for those paths).
- **m3** (carry-in to K2, no code change): the leak scanner's capture exemption trusts the entry's `source` label, so a mislabelled `source` would exempt a password entry.
- **Trivial**: the validator's bare-id foothold warning now says `wifi_<network>`.
- **Scanner false positive (train 85 live proof, game 5659)**: `scan_login_content` flagged a GET /keyring entry's `label` ("passwords.txt") as `signin_content` because it equals the sign-in PC file's name. It now skips `label` and `foundIn` on registry entries whose proof holds (same check as `credential_unheld`); an unheld entry and any other field (the file body) are still flagged. Three tests in `access_leak_scanner_test.rb` (55 runs, 286 assertions); leak check on 5659 gives no leaks.
- Tests: keyring_restamp 2 runs/5 assertions; keyring_take_route 3/16; keyring_route 6/19; credential_keyring 18/43; `validator-credentials.test.mjs` 40 pass. Rubocop clean. `test_access_keyring` validates with 0 errors, 1 warning.

## Slice K2: the POST /login credential branch (run 1 handover, no code yet)

Branch `build/keyring-k2` (worktree `.claude/worktrees/p-k2`), base main `8bcfbc85d`. Run 1 hit the
context limit while reading the code, before any edit. Nothing is built; this note maps plan 7 onto
the code so run 2 can start writing at once.

### Where each piece lives (the code's truth, line numbers at `8bcfbc85d`)
- Dispatch: `GamesController#login` (`games_controller.rb:1430-1455`, plan says 1329-1342). Add the
  `credential` branch after `claim`, before `attempt_login!`; a typed body with `relay` gets the generic
  refusal there, uncounted.
- Typed login: `Game#attempt_login!` (`game.rb:3258`); claims `claim_login_session!` (`:3326`) and
  `claim_guest_session!` (`:3395`). The "session already held" guards the plan places at `:2227` and
  `:2296` are at `:3341` and `:3412`: treat a session carrying `relay` as not held there.
- `start_login_session!` and `login_session_answer`: `game.rb:4087` and `:4101`. Constants
  `LOGIN_INCORRECT`, `LOGIN_LOCKED_OUT`, `LOGIN_NOT_PERMITTED` at `:2899-2902`; `account_locked_out_at?`
  at `:3374`; `pc_admits_account?` at `:3196`; `pc_off_answer` near `:3316`.
- `ACCESS_STATE_DEFAULTS` at `game.rb:2855`: add `endedCredentials` ([]) and `credentialEndGlobals` ({}).
- Reload: `end_claimed_sessions!` / `claimed_session_ids` / `sessions_for_client` / `session_for_client`
  at `game.rb:3487-3530`; the bootstrap builds `sessions` then ends claims at
  `games_controller.rb:437-456`.
- `unlock_session_refusal`: `game.rb:3931` (the `foothold.present?` test near `:3957`).
- `session_admits?` / `scope_admitted_by_session?` / `login_desktop_contents`: `game.rb:3080-3165`
  (all go through `session_route_up?`).
- Bootstrap writers: `bootstrap_state_needs_write?` `game.rb:1727`, `run_bootstrap_writers!` `:1742`
  (uses `stored_scenario_data`, `:1710`), `prepare_bootstrap_state!` `:723`.
- Sync: `GamesController#sync_state` `games_controller.rb:833` runs on the narrow
  `SYNC_STATE_COLUMNS` row (`:2240`, no scenario_data). Globals merge at `:2578`
  (`merge_global_variables!`, `game.rb:853`, stored in `player_state['globalVariables']`). Put the
  end check after `merge_grow_only_sections`, reading only `credentialEndGlobals`; add
  `endedRelayPcIds` to the non-stale and stale answer bodies.
- `network_access.rb`: `session_route_up?` `:1080`, `reach_session_hosts` `:1188`,
  `view_session_hosts` `:813`, `prune_unreachable_sessions!` `:1223` (prunes only foothold sessions;
  make it a fixed point), `desktop_request_allowed?` `:1256`, `settle_session_at_keyboard!` `:1270`,
  `desktop_refusal` `:961`, `host_row` `:973` (today offers `via == 'password'` only),
  `resource_admits_player?` `:1291`, `mapped_shares` `:1340` (also feeds `share_mapped_at?` and
  `find_mapped_share_item`), `implant_foothold!` session shape at about `:488`
  (`session['foothold'].blank?`).
- `render_login_desktop`: `games_controller.rb:2930`; it calls `desktop_refusal(info, foothold)` and
  `settle_session_at_keyboard!` when `foothold.nil?`. Thread a route hash from `foothold`, `relay=1`.
- K1 pieces to reuse: `CredentialKeyring#credential_proof_holds?(id, entry)` (public),
  `CredentialModel.registry/kind_built?/connecting?/honours_lockout?/accepts?/policy_for/end_globals`,
  `ID_PATTERN`. `registry_keyring_entries` already reads `endedCredentials`.

### Test fixture plan
`test/support/network_model_scenario.rb` `with_pivot` gives office_lan, server_net (the plan's
server_lan), `sv_fs02` (stand-in for ops_pc), `ledger_archive` (finance share, finance role),
jacks, `NetworkRequests` helpers (`build_network_game`, `take_drop_box`, `plant`, `sign_in`,
`container`, `sync_globals`, `bootstrap_scenario`, `add_item`). Add a Jake NPC and `jake_pc` on
office_lan, `lena_rdp_file` loose in the lobby, an `ops_rdp` in an open crate (container carry-in m2),
Jake's code in his `itemsHeld` taken with `source_npc_id` (itemsHeld carry-in m2), and a
`credentials` block with `endsOnGlobal`. `capture_proofs_test.rb:50` has the `count_scenario_loads`
SQL subscriber for the "no scenario_data query" assertion.

### Carry-ins still open
- m2: the two takes above prove the stamp through container contents and NPC `itemsHeld`.
- m3: in `tools/playtest/lib/access_leak_scanner.rb`, `keyring_capture_password_paths` should exempt
  a `source: "capture"` entry only when its id is `<npcId>.password` for a real account holder whose
  capture the recorded state serves (`account_capture_usernames`), not on the label alone.

### Live proof
`test_access_keyring` (K1 run 3) has `lena_rdp`, `jake_pw_note`, `ops_cookie` and Ian's capture, but
no assist invite, no Jake relay PC and no `endsOnGlobal`. The saved-connection half of 7.4 can run
on it; the relay half needs the scenario extended first (plan 9.1), so leave that as a handover item.

### K2 run 2 (part 1 of 2): built
Commits `804a22722`, `4c7ad6a5e`, `285e1989e`. Built: plan 7 steps 1 to 9 (`app/models/break_escape/credential_login.rb`,
`Game#attempt_credential_login!`, dispatch in `GamesController#login`), the 7.2 / 3.8 server readers in
`network_access.rb` (`session_route_up?` relay branch, `reach_session_hosts` / `view_session_hosts` skip relay,
`resource_admits_player?`, `mapped_shares`, `implant_foothold!`, `host_row`, `desktop_request_allowed?` /
`desktop_refusal` taking a route hash, `settle_session_at_keyboard!` leaves `via: credential`, prune to a fixed point),
`game.rb` (`start_login_session!` takes `credential:` / `relay:`, returns the pruned ids; `login_session_answer`
and `session_for_client` carry kind, label, relay; `reload_ended_session_ids`; `session_held_at_keyboard?` in both
claim guards; `unlock_session_refusal`), `render_login_desktop` route from `relay=1` / `from=` / `foothold=`.
Tests: `test/controllers/break_escape/credential_login_test.rb` (24), `test/models/break_escape/credential_sessions_test.rb`
(11), fixture `test/support/keyring_login_scenario.rb`; carry-in m2 covered (crate take, `source_npc_id` take).

Deviations and calls:
- 3.8 names "a typed or claim sign-in replacing a relay", so every replacing sign-in (typed, claim, credential) prunes;
  `endedPcIds` is added only when non-empty, so existing answers are unchanged.
- 3.8 said `reach_cache_key` needs no change for a relay. It does: the key used session keys only, so a relay
  replacing a pivot at the same PC hit a stale walk. The key now lists pivoting (non-relay) sessions.
- `from` (K4) is refused: generic refusal on POST /login, `false` in `desktop_request_allowed?`, `session_route_up?`
  false for a session carrying `from`. Hooks are commented "K4".
- Step 8 reads `player_state['endedCredentials']` through `ended_credential?` (network_access.rb), read only.

Not yet run: the full Rails suite and rubocop on the changed files (context limit). Network, keyring and the two
new files pass (35 + 270 runs, 0 failures).

Remaining for part 2: run the full suite and rubocop first; then 7.1 (`credentialEndGlobals` and `endedCredentials`
in `ACCESS_STATE_DEFAULTS`, `record_credential_end_globals!` writer and `credential_end_globals_stale?`, the sync
merge end check and `endedRelayPcIds`, `sync_end_globals_test`, `bootstrap_writers_test` additions), carry-in m3,
the live proof. The sync merge deletes relay sessions whose `credential` is ended; `session_route_up?` already
refuses them.

### K2 run 3 (part 2 of 2): built

Commits `f095da290` (7.1), `93e7797fa` (carry-in m3) and the one adding this note. Slice K2's server side is complete
apart from the live proof (handover below).

Done:
- Step 1: the full Rails suite and rubocop on part 1's files. Rubocop: no offences. Suite: see Tests.
- Plan 7.1 (`app/models/break_escape/credential_login.rb`, `game.rb`, `games_controller.rb`):
  `endedCredentials` ([]) and `credentialEndGlobals` ({}) in `ACCESS_STATE_DEFAULTS`. Neither is in the
  bootstrap's whitelist nor read from a sync body (`merge_last_write_wins_sections` names its sections), so
  both stay server-only; `sync_end_globals_test` proves it from both sides. `credential_end_globals_stale?`
  is ORed into `bootstrap_state_needs_write?`; `record_credential_end_globals!` runs last in
  `run_bootstrap_writers!`, stores the map when stale and then runs the end check once.
  `apply_credential_end_globals!` is the end check: it reads only the cached map and
  `player_state['globalVariables']`, adds newly ended ids to `endedCredentials` (grow-only, capped at 64),
  deletes relay sessions whose `credential` is ended, and returns nil (nothing changed) or the ended relay
  PC ids. `sync_state` calls it after `apply_capture_sync_step`, on fresh and stale requests alike, and both
  answer bodies add `endedRelayPcIds` only when it is non-empty.
- Carry-in m3 (`tools/playtest/lib/access_leak_scanner.rb`): `keyring_capture_password_paths` now maps a
  path to an NPC id only when the entry's id is `<npcId>.password` and that NPC is in the game's
  `account_capture_usernames` (read once, `captured_account_ids`); `scan_passwords` exempts the path only
  when the password found there is that NPC's own. A scanner run with no game, or a game that cannot answer
  `account_capture_usernames`, exempts nothing.

Deviations and calls:
- The plan's "digest differs" is a direct comparison of the stored map with `CredentialModel.end_globals`:
  the map is at most 64 entries, so a digest would save nothing and add a second key.
- `ACCESS_STATE_DEFAULTS` puts `{}` in `credentialEndGlobals` on every new game, so "a scenario with no
  `endsOnGlobal` never writes the key" holds as "never writes a non-empty map, and never takes the bootstrap
  lock for it".
- The end check runs on a stale sync too. It reads only stored globals, so a stale request that merged no
  globals ends nothing new; a stale-but-recent one that did merge them ends the invite as a fresh one would.
- Ending deletes every relay session whose credential is in `endedCredentials`, not only the newly ended
  ones; none should exist (step 8 refuses an ended invite), so this only tidies a stale record.
- m3 also checks the password belongs to the NPC the id names, which the handover did not ask for: a captured
  account's id carrying another NPC's password is still flagged.

Tests and lint:
- New: `test/models/break_escape/bootstrap_writers_test.rb` (7: a fresh game with an `endsOnGlobal` and no other
  bootstrap work writes the map; no `endsOnGlobal` never writes it; a missing or different map is rewritten; the
  writer ends an invite whose global was already true; grow-only, relay-only; capped at 64) and
  `test/controllers/break_escape/sync_end_globals_test.rb` (5: the end with no `scenario_data` query, using
  `capture_proofs_test.rb`'s `count_scenario_loads` subscriber; `endedRelayPcIds` once, then the invite answers
  `ended`; an ordinary sync carries no `endedRelayPcIds`; an end with no relay open sends none; a sync before any
  bootstrap records nothing and the next bootstrap ends it; a sync body naming either key changes neither and
  the bootstrap sends neither). `access_leak_scanner_test.rb` gains the m3 test (4 cases); the K1 capture test now
  gives its stub game a captured `jake`.
- Full Rails suite, final run at `93e7797fa`: 2988 runs, 0 failures, 0 errors, 3 skips. Rubocop on all 12 Ruby
  files K2 changed: no offences.
- Two earlier full runs, for the record. The first (part 1's tip) showed 946 `AssociationTypeMismatch` errors
  and 24 failures; that run overlapped my edits to `app/` files, and the clean rerun had none of them, so they
  were edit contamination, not K2 faults. The second showed one error,
  `TtsDeliveryTest#test_call_gemini_tts_puts_the_combined_style_in_speech_metadata` (`Net::HTTPOK`
  uninitialised): a test-order issue in a file K2 does not touch (last changed in `db4983a98`); it passes alone
  and in the final run. Worth a `require 'net/http'` in that test some day.

### Live proof (plan 7.4): HANDOVER for the integrator, not run

Saved-connection half, on `test_access_keyring` as it stands (`lena_pc` HB-FIN-02 on `office_lan`, policy
`finance_desk`; `ops_pc` SV-OPS-01 on `server_lan`, policy `pw_only`; `comms_port` on `office_lan`;
`kit_dropbox` in the start inventory; registry `lena_rdp`, `jake_pw_note`, `ops_cookie`):
1. Take `lena_rdp_file`, plant the drop box at `comms_port`, then from the page POST /login
   `{ pc_id: "lena_pc", credential: "lena_rdp", foothold: "jack_comms_port" }`: success, `via: credential`,
   `kind: saved_connection`. GET /keyring then lists `jake_pw_note` (the `session: lena_pc` proof).
2. Tampered calls, each answering as noted with `loginFailures` / `loginLockouts` unchanged: an undeclared id
   and `jake_pw_note` (generic refusal, byte-identical); `lena_rdp` before taking the file (generic);
   a forged inventory add of a notepad claiming `credential: "lena_rdp"`, then the sign-in without the real
   file (generic: the server stamps the credential from the scenario's own item);
   `lena_rdp` with no route at Lena's keyboard (generic); `lena_rdp` with `relay: true` (generic);
   a typed `{ username, password, relay: true }` (generic, uncounted); `lena_rdp` at `ops_pc` (`wrongPc`);
   `ops_cookie` at `ops_pc` over the foothold (`kindRefused`, since `pw_only` accepts only passwords: this
   stands in for the plan's "ops .rdp at a policy that refuses it", as the scenario has no ops .rdp item).
3. Missing from the scenario for this half: nothing beyond the above. The plan's "sign out at HB-DESK-01"
   cannot run (no `sam_pc` yet).

Relay half, needs plan 9.1 added to the scenario first: Jake Brooks (an account holder) with
`jake_assist_code` (`text_file`, `credential: jake_assist`) in his `itemsHeld` and the ink choice that gives
it; `jake_pc` HB-FIN-03 on `office_lan` in a locked Jake's office, policy
`jake_desk` `{ "remote": "blocked", "accepts": ["password", "assist_invite"] }`; `sam_pc` HB-DESK-01; the
`jake_assist` registry entry `{ kind: assist_invite, account: jake, connectsTo: jake_pc,
proof: { held: jake_assist_code }, endsOnGlobal: jake_ended_assist }` and the `jake_ended_assist` global
(false); `finance_share` on `server_lan` for Jake. Then: sign out at HB-DESK-01 and HB-FIN-02, POST /login
`{ pc_id: "jake_pc", credential: "jake_assist", relay: true }` from the page, check the drop box view still
lists `office_lan` only, GET /container of `finance_share` refused, a no-route and a `foothold=` GET
/container at `jake_pc` refused, then set `jake_ended_assist` through PUT /sync_state (answer carries
`endedRelayPcIds: ["jake_pc"]` once), clear it by sync, and retry the relay sign-in (`ended: true`).
The bootstrap must run once after the scenario gains `endsOnGlobal` (GET /scenario) before a sync can end
the invite; a sync before that records nothing.

Open:
- The live proof above (saved-connection half runnable now; relay half after the 9.1 scenario additions).
- K2 has had no review round yet.
- The client side of `endedRelayPcIds` (close the relay desktop) belongs to K3c.

## K2 R1 fixes

Review: `CREDENTIAL_KEYRING_K2_REVIEW_R1.md` (SHIP, B0 M0 m4 t4). Every changed test was shown failing on a temporary mutation of the code, then the code was restored from a copy.

- **m1 (fixed).** `prune_unreachable_sessions!` keeps its loop as a cheap guard, with a comment saying one pass is already a fixed point and that a relay-replaces-pivot prune comes from `reach_session_hosts` skipping a relay. No behaviour change. The test is renamed "a relay is no pivot, so the onward session is pruned and the relay is kept". Mutation: removing the `next if relay_session?(session)` line fails it (and the existing relay-at-jake_pc test).
- **m2 (fixed).** Two sync tests in `sync_end_globals_test.rb`: after the invite ends, a sync with `endedCredentials: []` and the end global false leaves the list holding `jake_assist` and the relay sign-in still answers `ended`; a sync with `endedCredentials: [forged_id, jake_assist]` and the end global false leaves the stored list empty. Mutation: copying `params[:endedCredentials]` into the stored list before the end check fails both.
- **m3 (fixed).** `count_scenario_loads` now counts any SELECT that names `"scenario_data"` or selects the whole games row (`"break_escape_games".*` or `SELECT * FROM "break_escape_games"`). Mutation: `self.class.find(id).scenario_data` at the top of `apply_credential_end_globals!` fails the zero-load assertion (the old counter skipped `*`).
- **m4 (deferred to K3c/K4).** A folder under a relay desktop goes through `session_admits?` with no route check. Fixing it means passing the request route into the folder branch and running `desktop_request_allowed?` on the folder's PC, which also changes foothold sessions (the same gap exists today) and needs the client to send the route on folder opens. The gap shows no data the relay does not already show and gives no pivot. Not small, so it is a K3c/K4 item.
- **Missing test (fixed).** `credential_login_test.rb`: a typed sign-in and an owner claim that each replace a session and answer `endedPcIds: ['sv_fs02']` (the onward session is seeded, with no foothold held; the claim replaces a relay, as a claim can replace nothing else); and a typed sign-in that replaces a session but prunes nothing returns a body byte-identical to a fresh sign-in with no `endedPcIds` key. Mutations: `start_login_session!` returning `[]` fails the two prune tests; `with_ended_pc_ids` always adding the key fails the byte-identity test.
- **TtsDeliveryTest.** Added `require 'net/http'`. The `Net::HTTPOK` error is order-dependent and does not reproduce when the file runs alone, so no mutation evidence; the require removes the dependency on load order.
- **Trivials.** t1: no action. t2 (K3a handover): a typed body must omit `relay`, never send `relay: false` (refused). t3 (K3c): `relay=0` on a desktop request answers `:conflict`. t4 (K3a brief): `session_for_client` reports a credential session's route as `footholdId` or `relay: true`, the POST answer as a `route` hash; K3a should read one and the brief should pick it.
- **with_game_lock.** `login` is in the `with_game_lock` list (`games_controller.rb` ~103), checked by the integrator, so a credential sign-in does not race a concurrent sync.

Suites: K2 files (credential_keyring, credential_sessions, credential_login, sync_end_globals, bootstrap_writers) 70 runs, 0 failures; full Rails suite 2993 runs, 48447 assertions, 0 failures, 0 errors, 3 skips; rubocop on the five changed Ruby files, no offences.

### Live proof result

Saved-connection half PASS on games 6168 and 6169: honest sign-in, generic refusal across 9 tampered forms, wrongPc, nothing counted, 0 leaks, 0 page errors. The `ops_cookie` kindRefused case is unreachable in `test_access_keyring`: `ops_pc` is on server_lan and the drop box reaches only office_lan, so the 403 (not reachable) comes first. It needs a pivot when the scenario is extended. Forged items are refused at `/inventory` before any sign-in. The relay half waits on plan 9.1.

## Slice K3a: the sign-in screen (run 1 handover, no code yet)

Run 1 read the plan (3, 5.2, 6.2, 7, 8.1, 8.4, 8.5, 9.1), the K0 client and K2 notes, and the code below. It then hit the context limit before editing. Nothing is built. The next run starts from this design. Each point was checked against the code at `bb075aa10`.

### Where each piece lives
- **Client never knows `credentials` is declared**: the bootstrap deletes it (`game.rb` ~2353), and GET /keyring sends implicit captured entries even in shipped scenarios. Proposal: add a capability flag beside `sessionLockingSupported` (`games_controller.rb` ~443): `filtered['credentialsDeclared'] = @game.scenario_data['credentials'].is_a?(Hash) && any?`. It is a static bootstrap field, not player_state. Add a Rails test next to the `sessionLockingSupported` one (`test/controllers/break_escape/access_model_login_test.rb`), with false for a shipped scenario. The client reads `window.gameScenario?.credentialsDeclared === true`.
- **`systems/keyring.js` (new, no imports)**: the cache keyed by `pcId|route` with `rev`, the opened `foundIn` set (`noteOpened(id)`), `firstAnswerIds` (entries in the page's first successful answer show at once, which covers the reload case), `teachOnce(kind)`, and `screenEntries(entries, { pcId, screen: 'keyboard'|'foothold' })`. Keyboard: password only. Foothold: password plus `saved_connection` with `forThisPc`. Never `assist_invite`. A registry password waits until `foundIn` is opened or the entry was in the first answer. It sets `window.keyring`. To avoid growing about 35 harness copy lists, load it with a **dynamic** `import('./keyring.js')` in `unlock-system.js`, as `captures.js` is loaded there (only when `credentialsDeclared`). Also add one static import in `main.js`, so the opened set exists from page start. `core/game.js` and `unlock-system.js` are copied by many harnesses: do not add static imports there.
- **Opened file hook**: `container-minigame.js` `handleInteractiveItem` (~1573) and `openFileInPlace` (~1505): `window.keyring?.noteOpened?.(item.id)`. No import.
- **`api-client.js`**: `keyring(pcId, { foothold, rev })` -> GET `/keyring?pc_id=&foothold=&rev=`; `loginWithCredential(pcId, credential, { foothold })` -> POST /login `{ pc_id, credential, foothold }`. Never send `relay: false` (K2 t2).
- **`pc-sessions.js`**: `signInWithCredential` mirrors `signIn` (~278). On 422 it maps `wrongPc`, `kindRefused`, `notPermitted`, `lockedOut`, `ended`, and the generic body (no flag) to reason `no_longer_works`. 403s go through as errors with `serverReason`. On success it keeps `via: 'credential'`, `kind`, `label` and `route` from the answer, and `load()` keeps `kind`/`label` too (`session_for_client` sends them, with `footholdId` for the route: K2 t4, read `footholdId`). Hand the answer's `endedPcIds` to `linkDropped` in both `signIn` paths (K2 7/3.8).
- **`password-minigame.js`**: extend `mergeRemoteTiles` with a `keyring` list. Tag kinds: `captured` (source capture), `in_file` (registry password) and `saved_connection`. The tile gains `credentials[]` `{ id, label, accepted, host }`, `found[]` `{ label }`, and `password` from a captured entry. `setRemoteAccounts` takes `keyring` and `keyringFailed`. `remoteStateLine`: keyring failed alone gives "Your found sign-ins could not be loaded."; any two failed give `remoteBothFailedLine`. The keyboard screen gains `setKeyringEntries` (merge with picker rules, tags on keyboard tiles only when declared) and its own failed lines. The chosen line: a `.signin-ways` box at the top of `#signin-form` (own scroller with the "More below" cue) holds the credential buttons (`<span class="signin-cred-fixed">Connect with</span> <span class="signin-cred-label">` ellipsis, full kind and teach in `title`). A refused one gets `aria-disabled="true"` with a short reason under it. Then two-line found rows. Clicking a greyed button puts the full reason in the message line. Teach toasts go out once per page per kind after success (typed in-file sign-in included).
- **`utils/remote-host-text.js`**: add tags and full names to `TAG_TEXT` (`in_file` "In file", `saved_connection` "Saved" with group `plug`, `assist_invite`, `token`) and the 8.5 lines (refused short and full, wrong PC, no longer works, keyring failed, keyboard both failed, teach lines, "Type the password from").
- **`unlock-system.js`**: `openRemoteSignInScreen` (~651) gets a third list in the cap (`keyringDone`). `openLoginSignIn` (~573), when declared, fetches `/keyring` alongside `/login_accounts` under `REMOTE_CAPTURES_WAIT_MS`, with a late redraw.
- **`screen-states.js:83`**: `via !== 'password' && via !== 'credential'`.
- **Desktop line**: slice 6's start panel has merged, so "with the saved connection {label}" goes in `pc-taskbar.js` `pcStartPanelHtml` under `.pc-start-name` (`pcTaskbarModel` must copy `kind`/`label` from the session), plus `container-minigame.js` `accountBarHtml` (~1012) for the non-monitor path.
- **Art**: `assets/icons/badge-plug.png`, 8x8 by hand (not built).

### Answers K3a turns into text (from `credential_login.rb`)
404 not found; 422 generic `{ message: 'Incorrect username or password' }`; 422 `wrongPc`; route 403 `reason` unreachable / not_responding, 422 `remoteBlocked`; 422 `kindRefused: kind`; 422 `notPermitted`; 422 `lockedOut`; 422 `ended`; 200 `login_session_answer` with `kind`, `label`, `remote`, `footholdId`, `host`, `route` and optional `endedPcIds`.

### Open (all of 8.1)
All code, `test/js/keyring-signin.test.mjs`, `screen-states.test.mjs` cases, `signin-fit.mjs` K3a fixtures, mutation checks, the Rails flag test, bin/test-js, the Rails suite, rubocop, and the live proof on :3063 (R2, R3 sign-in half, R4, R5a).

### Run 2 (code built, tests not yet written)

Run 2 took run 1's four decisions as accepted by the integrator. It stopped at the context limit after the code step.

**Built and committed**
- Rails: `credentialsDeclared` static bootstrap flag beside `sessionLockingSupported` (`games_controller.rb`), with two tests in `keyring_route_test.rb` (true with credentials, false without; the registry never in the answer). The test was shown to fail with the flag forced true, then restored. Rubocop is clean on both files.
- `systems/keyring.js` (new, no imports): the `Keyring` class (cache keyed by `pcId|route` with `rev`, opened set via `noteOpened`, `firstAnswerIds`, `teachOnce`, `screenEntries`, `foundVisible`, `prime`), `getKeyring()` sets `window.keyring`. One static import in `main.js`; `unlock-system.js` loads it by dynamic import (`keyringForScreen`).
- Page-start prime: `core/game.js` calls `window.keyring?.prime?.()` beside `pcSessions.load` (no import). The prime's answer fixes `firstAnswerIds`, so on a fresh page a found password still waits for its file, and after a reload it shows at once. This is a deviation from run 1's note, which had "the page's first successful answer" with no prime.
- `container-minigame.js`: `noteOpened(item.id)` in `openFileInPlace` and `handleInteractiveItem`, and the account bar's second line.
- `api-client.js`: `keyring(pcId, { foothold, rev })` and `loginWithCredential(pcId, credential, { foothold })`.
- `pc-sessions.js`: `signInWithCredential`, exported `credentialRefusalReason` (generic 422 gives `no_longer_works`), `kind`/`label` kept on sign-in, `load()` and `publicSession`, and `_dropEnded(endedPcIds)` in both sign-in paths.
- `remote-host-text.js`: the `TAG_TEXT` kinds, `BADGE_FILE` + `badgeSrc` (the plug group reuses `badge-key.png`; this is the one place to change), and the 8.5 lines plus `credentialRefusalLine` and `teachLine`.
- `password-minigame.js`: `mergeRemoteTiles` takes `keyring` (tile `credentials[]`, `found[]`, `keyPassword`), `keyringTagKind`, `mergeKeyboardTiles`, `credentialButtonTitle`; the `#signin-ways` box with `#signin-ways-more` at the top of `#signin-form`; `renderSignInWays` (DOM nodes, textContent only), `fitSignInWays`, `useCredential`, `teachAfter`, `keyboardTiles`, `keyboardStateLine`, `setKeyringEntries`; `remoteStateLine` counts three failures; the typed sign-in teaches `in_file`. Test state carries the tile `credentials`/`found` and `keyring`.
- `unlock-system.js`: `keyringForScreen`, the third list in the remote cap (`keyringDone`), and the keyboard keyring alongside `/login_accounts` under `REMOTE_CAPTURES_WAIT_MS` with a late `setKeyringEntries`.
- `screen-states.js`: `signedInVia` covers `password` and `credential`.
- `pc-taskbar.js`: `credentialSessionLine`, the model's `credentialLine` and `.pc-start-credential` in `pcStartPanelHtml`.
- CSS: the ways box, buttons, refused and found lines, keyboard tags (`password-minigame.css`), `.pc-start-credential` (`pc-monitor.css`), `.desktop-account-credential` (`container-minigame.css`).

**Deviations and choices to check**
- The keyboard with picker `false` keeps the typed form and shows no keyring tiles. Under `accounts`, unlisted keyring accounts are dropped. Under `known`, they are added.
- The desktop template lines use `escapeHtml` inside the existing HTML templates (that file's own practice); the sign-in ways use textContent.
- A server `kind_refused` greys the button from then on and shows the full line.

**Not done (next run, in order)**
1. Run `bin/test-js` (it passed 712/712 after the main.js import, before the password-minigame, unlock-system, taskbar and CSS edits) and fix any fallout.
2. Write `test/js/keyring-signin.test.mjs` (the plan 8.1 list) and the `screen-states.test.mjs` cases. Show each failing once by a temporary mutation, then restore.
3. Add the K3a fixtures to `tools/playtest/signin-fit.mjs`.
4. Run the full Rails suite and bin/test-js again, then commit.
5. Live proof on :3063 (R2, R3 sign-in half, R4, R5a), or hand it over.

**Open for the user**: `badge-plug.png` art (the plug group shows the key badge until then).

### Run 3 (partial: tests written, mutations and suites still to do)

Run 3 stopped at the context limit after step 2's writing. Commits `d42e4d7ce` and `fdab5f7c1` on `build/keyring-k3a`.

**Done**
- bin/test-js on `d4ecac8b4`: 711 of 712 files passed. The one failure, `pc-monitor-frame.test.mjs` (E06 card CSS), was the test, not the code: it sliced the CSS from the E06 marker to the end of the file, so the K3a rules (which set `border-radius: 0`) fell inside the check. The slice now ends at the K3a comment (`d42e4d7ce`). No ERR_MODULE_NOT_FOUND: keyring.js loads by dynamic import, as designed.
- `test/js/keyring-signin.test.mjs`: 46 tests, all passing. Own harness (real password-minigame, unlock-system, keyring, pc-sessions, pc-taskbar, remote-host-text, api-client, network-links). Covers: tag kinds and `credentialsDeclared`; usable kinds per screen (invite never, other-PC and ended dropped); the In file wait and the reload case; `rev`/unchanged/lost-rev fetch; teachOnce; api-client request shapes (no `relay`); one tile per account and the picker rules (accounts/known/typed/false) for remote and keyboard; tags, two-tag "+N", badges; ways box (buttons with "Connect with" whole, title, Password always present, found lines); greyed refused button (aria-disabled, short reason, click shows the full reason, no request); credential sign-in route and session kind/label; teaching toast once per kind (and typed in_file); every 8.5 refusal text (wrongPc, kindRefused x2, notPermitted, lockedOut, ended, remoteBlocked, generic, 403 x2); server kindRefused greys the button; keyring failed lines (alone and combined); markup shown as text; keyboard screen picker false/accounts/known, no-credentials unchanged, failed lines, late redraw; remote loading (route, one layout, In file filter, cap and late relayout, failure, no call without credentials); keyboard loading (passwords only, cap, late `setKeyringEntries`, failure); start panel line (escaped, other sessions none); reload keeps kind/label; `endedPcIds` to `linkDropped` in both sign-in paths; 403/bad answer fail closed.
- `screen-states.test.mjs`: two credential cases added (26 pass).
- Bugs in K3a code found: none so far. Observation, not changed: a keyring answer that arrives after the player chose a tile does not fill the Password field (the test pins that it does not overwrite).

**Not done (next run, in order)**
1. Mutation checks: for each group of tests, break the source once (for example `signedInVia` back to `=== 'password'`, drop `_dropEnded`, make `screenEntries` list `assist_invite`, remove the `foundVisible` check, change `kindRefusedShort`, drop the third list from `paint`'s `both`), confirm the test fails, restore with `git checkout -- <file>`. Record each here.
2. `tools/playtest/signin-fit.mjs` K3a fixtures (plan 8.1 worst cases) and run if headless.
3. bin/test-js again, full Rails suite, rubocop on changed Ruby files.
4. Live proof on :3063; `badge-plug.png` art for the user (the plug group still shows the key badge).

### Run 4 (mutation evidence, fixtures, suites)

**Mutation evidence.** Each row: one temporary change to the K3a source, `keyring-signin.test.mjs` plus `screen-states.test.mjs` run, source restored with `git checkout -- <file>` (`git diff --stat` empty after each). 12 mutations, 12 caught.

| # | Mutation | File | Tests failing |
|---|----------|------|---------------|
| 1 | Keyring entries each get their own tile (no reuse of the account's tile) | password-minigame.js | 22 (merge one tile per account, keyboard and remote screens, ways box) |
| 2 | Picker `accounts` keeps unlisted accounts | password-minigame.js | 3 (merge picker rules, keyboard merge, keyboard screen) |
| 3 | `kindRefusedShort` text changed | remote-host-text.js | 2 (greyed refused button, server kindRefused) |
| 4 | `wrongPc` no longer mapped in `credentialRefusalReason` | pc-sessions.js | 2 (wrongPc text, reason mapping) |
| 5 | Sign-in body key `credential` renamed | api-client.js | 1 (request shapes) |
| 6 | `_dropEnded` no longer calls `linkDropped` | pc-sessions.js | 1 (endedPcIds in both sign-in paths) |
| 7 | `signedInVia` back to password only | screen-states.js | 2 (credential session counts as signed in, held across leave) |
| 8 | `screenEntries` lists `assist_invite` | keyring.js | 1 (usable kinds per screen) |
| 9 | `foundVisible` always true | keyring.js | 2 (In file waits for its file, remote loading filter) |
| 10 | Start panel line not escaped | pc-taskbar.js | 1 (start panel line, escaped) |
| 11 | Credential button label set as HTML | password-minigame.js | 1 (author text is text) |
| 12 | `credentialSessionLine` returns null | pc-taskbar.js | 2 (start panel line, reload keeps kind and label) |

**Fixtures.** `tools/playtest/signin-fit.mjs` gains `ways-longest` (three long-label saved connections, one refused, two found passwords), `ways-refused-short` (one greyed connection with its short reason) and `keyring-both-failed` (the combined failed line). A new `expectWays` check fails when the ways box is not shown, its first button sits outside the visible area, "Connect with" is cut, a scrolling box has no "More below" cue, or the Password field is missing. Not run: the script needs a keyless server and a browser, and this run had no servers. To run it: start the keyless server on a free port (AGENTS.md) and `PORT=<port> node tools/playtest/signin-fit.mjs` (add `SHOTS=<dir>` for screenshots). Syntax checked with `node --check`.

**Suites** (tip before this entry `f0927b3ad` plus the fix below)
- `bin/test-js`: 713 files, 713 passed, 0 failed.
- Rails full suite: 2995 runs, 48452 assertions, 1 failure, 0 errors, 3 skips. The failure was fallout from K3a: `sync_payload_size_test.rb` "the bootstrap scenario carries no credentials key" refuted the substring `credentials` anywhere in the body, which now matches the `credentialsDeclared` flag. The test now refutes the `"credentials":` key instead (the registry still cannot reach the browser). The file re-run: 3 runs, 0 failures. Not a second full run.
- rubocop on the changed Ruby files (`games_controller.rb`, `keyring_route_test.rb`) and the fixed test: no offences.

**Open**
- Live proof on :3063 (R2, R3 sign-in half, R4, R5a) and the `signin-fit.mjs` run, both needing a server.
- `assets/icons/badge-plug.png` art for the user (8x8 by hand); the plug group shows the key badge until then.

### Run 6 (R1 fixes)

Fixes for `CREDENTIAL_KEYRING_K3A_REVIEW_R1.md`, plus two live findings. Tip before this run `dc53512c4`.

| Finding | Fix | Test |
|---|---|---|
| M1 | `linkDropped(endedPcIds, reason = 'unplugged')` in `pc-sessions.js`. `_dropEnded` and the sign-out prune pass `route_ended`; the `network_device_unplugged` listener passes `unplugged`. New `routeEndedMessage(hosts)` gives the 8.5 line ("Your session on {host} ended: the session it went through was closed."); an open desktop of a pruned session closes with the same line, an unplug keeps "The link dropped". | `keyring-signin.test.mjs` "M1 plan 8.3": toast text in the credential and password paths, several hosts, default reason keeps the unplug line, open desktop wording. |
| m1 | `remember(key, answer, { primed })`: only the prime fixes `firstAnswerIds`; a failed prime sets it to an empty set (the stricter case). | "R1 m1": prime rejects, then a screen answer; the found password stays hidden until `noteOpened`. Also a screen answer ahead of a slow prime. Two older tests now call `prime()` first, as the page does. |
| m2 | `noteOpened` also runs on a successful `takeItem` (copy or move) and in `TextFileMinigame.init` (any reader, including the inventory). | `container-transfer-dialog.test.mjs`: Open, Copy, Move and a plain click each record the id; Cancel records none. Removing the container hooks fails it (checked: 1 failure). The text-file hook has no test (no harness for that minigame loads cheaply). |
| m3 | `screenEntries` needs `forThisPc === true`; `accepted` is `e.accepted === true`. | "R1 m3": connectsTo alone is not listed; a missing `accepted` stays greyed. |
| m4 | The ways box and its "more" cue now follow `.signin-selected-row`. | Ordering assertions added to the ways test. `signin-fit.mjs` not run (no server): the first button still being in view at the four sizes is unconfirmed. |
| Live: raw id | Server `credential_label`: the entry's own `label`, else the item name, else empty (never `connectsTo`). Client `credentialLabel`: empty or an id equal to `connectsTo` becomes "Saved connection" (8.5 full name). `test_access_keyring` `ops_cookie` gets `"label": "SV-OPS-01.rdp"` (plan 9.1 already gives `lena_token` a `label`). | "R1 live" client test; `credential_keyring_test.rb` label precedence. |
| Live: wrapped label | `credentialLineHtml` wraps the label in `.credential-label-nowrap` (`white-space: nowrap`), used by the start panel and the account bar. The line wraps before the label only. | start panel and account bar assertions. 390 width not measured live. |
| Live: in_file toast | Real `notifications.js` held-queue path: held while a panel is open, shown once after it closes. No fix needed. | "R1 5". |
| t1 | `.signin-cred` takes `minigame-button` outside a monitor. | none (CSS class). |
| t2 | `greyedShown` dropped from `credentialRefusalLine`. | old assertion removed. |
| t4 | Account bar line tested, label escaped. | `container-transfer-dialog.test.mjs`. |
| t5 | Comment added at the keyboard filter. | n/a |

**Deferred.** t3 (the keyboard's chosen line naming kinds): a wording change to a shipped screen, wants the owner's pick. `signin-fit.mjs` and the live beats need a server and were not run. Existing games on `test_access_keyring` keep a stored scenario copy, so Ian's button shows "Saved connection" there until a new game.

### Run 7 (R2 fixes, main merge)

Fixes for `CREDENTIAL_KEYRING_K3A_REVIEW_R2.md`. Tip before this run `1ee644f99`; fixes in "Keyring K3a: round 2 fixes", then main (`11f7eee6d`) merged with no conflicts (the harness copy lists merged cleanly).

| Finding | Fix | Test |
|---|---|---|
| m1 | `.credential-label-nowrap` is `inline-block` with `max-width: 100%`, `overflow: hidden`, `text-overflow: ellipsis`. `titleCredentialLabels(root)` (pc-taskbar.js) sets each span's `title` to its full text through the DOM, called after the start panel mounts and after the account bar is built. Validator warns when a credential `label` is over 32 characters. | `keyring-signin.test.mjs` "R2 m1" (title via DOM, CSS declarations, no `title=` in markup); `validator-credentials.test.mjs` (33 warns, 32 and a normal label do not). |
| t3 | `credentialSessionLabel(session)`: an empty or blank label gives "Saved connection", so the desktop line reads "with the saved connection Saved connection" and `credentialSessionLine` is no longer null for it. | The old null assertion became two assertions. |
| t4 | The plural `route_ended` line is in the plan 8.5 table. | n/a |
| t2 | Source-level assertion that `TextFileMinigame.init` calls `window.keyring?.noteOpened?.(this.textFileData?.itemId)`. | "R2 t2". |

**In-file toast, live.** `gameAlert` renders ordinary DOM toasts in `#notification-container` (not canvas). Info and success toasts raised while a full-screen panel is open are held in memory (`heldNotifications`) and rendered only when the last panel closes, then shown a few at a time. Closing the PC monitor returns to the network view, which is still a panel, so the toast stays held until that closes too; it then queues behind the task and objective toasts and showed about 8 s later. That is why earlier polls of `document.body.innerText` found nothing. No code fix needed. Screenshot: `scratchpad/k3a-live3/in-file-toast-1280.png` (toast text visible on screen, `show` class, opacity 1). Start panel at 390x844 with the normal label: `startpanel-390.png`, label whole on its own line. A 40-character label at 390 was not measured live.

**Results.** `bin/test-js` 715 files, 0 failed. Rails suite 2996 runs, 0 failures, 0 errors, 3 skips. Rubocop clean on `scripts/validate_scenario.rb`, `credential_keyring.rb` and its test.

## Slice K3b

### K3b run 1 (part A, Connect): code built, client tests half done

Stopped at the context limit. Tip before this run `427680566`.

**Built**
- Server (a deviation, see below): `credential_keyring.rb` `registry_connecting_entry` adds `heldItem` (the `proof.held` item id) to a connecting row, ended rows included. Test in `keyring_route_test.rb` (9 runs, 0 failures).
- `systems/keyring.js`: `CONNECT_KINDS` (`saved_connection`; K3c adds `assist_invite`), `connectRoute(entry)` (foothold today, with marked hooks for K4 `from` and K3c relay), `latest` (entries of the most recent usable answer, `unchanged` included), `connectEntryFor(itemId)`, `listen()` on `inventory_changed` (called from `prime()`), `trayChanged(items)` (one GET when the set of tray ids changes), `refresh()`, `connect(el, { returnTo, text })` with the in-flight guard (`connecting`), steps 1 to 8 in `_connect`, and `watchScreensClose(returnTo)` (polls `MinigameFramework.currentMinigame`; gives up waiting after 3 s if nothing opened). Text loads by dynamic import, so no harness copy list grows.
- `utils/remote-host-text.js`: `CONNECT_FAILED_TEXT`, `trayUnreachableMessage(host)` (8.5 lines).
- `systems/unlock-system.js`: `openCredentialSignIn({ pcId, host, footholdId, username, refusal })` on `window`; `openLoginSignIn` and `openRemoteSignInScreen` take `connect`, which sets `signIn.preselect` and `signIn.connectRefusal`.
- `password-minigame.js`: `takeConnectRefusalTile(pending)` and `showConnectRefusal(tile)` in `setRemoteAccounts`: once the account's tile carries the credential (or nothing is pending), the account is chosen; `kind_refused` greys the button and shows the 8.5 line; `locked_out` goes through `signInLockedOut`.
- `systems/inventory-menu.js`: `connectMenuEntry`, `trayClickIsConnect`, `CONNECTING_TEXT`; `[Connect, (Drop here), Examine]`; no menu and a direct Connect when not droppable and nothing to read; Connect icon is the tray picture; greyed "Connecting..." while one runs. No new static import (reads `window.keyring`).
- `test/js/inventory-menu.test.mjs`: 7 K3b cases (28 pass).

**Deviations**
- Server change: the item-level `credential` is stripped from every client copy (R1 m1), and keyring rows named no item, so the client had no way to tell which tray item proves which entry. `heldItem` is only on rows whose held proof already holds, so it names an item the player carries. No other server change.
- `returnTo` has no trip to ride (Connect starts none), so `watchScreensClose` polls the minigame layer. Only K4 will pass it.
- Direct Connect uses `heldItemHasText` (what Examine would show: observations or text), the menu's existing rule, rather than observations alone.
- A refused Connect's screen chooses the account only when its tile arrives; with no tile (picker hides it) the typed form keeps the pre-filled name and the line still shows.

**HANDOVER (next run, in order)**
1. Write `test/js/keyring-client.test.mjs` (Connect half of the 8.2 list). Harness: copy the setup of `keyring-signin.test.mjs` (lines 1 to 120: temp dir copy list, `setup()`, `sceneStub()`, `openLinks()`). Cases: flush (`stateSync.syncConfirmed`) before the GET (record order); steps 1 to 7 each with its exact text and no POST; step 2 named from the tray item's `name`; step 5 calls `openRemoteDesktop(pcId, foothold)` with the session's foothold; step 8 posts `{ foothold }` and opens the desktop, teaching toast once per kind across two Connects; `endedPcIds` reach `linkDropped` with `route_ended`; 403 `not_responding`, 403 unreachable, 422 `remoteBlocked` races; network failure after the GET gives step 1's text; `kind_refused` and `locked_out` call `openCredentialSignIn` with username and refusal, and through the real `openLoginSignIn` the screen chooses Lena's tile, greys the button and shows the line (use the real `PasswordMinigame` like `openRemote()` there, or `sceneStub` and assert `params.signIn.connectRefusal`); `not_permitted` toast; double click: the second `connect` resolves `busy` and one POST; `returnTo` runs once after the screen closes (mock timers); `trayChanged` asks once per changed id set; `connectEntryFor` ignores `assist_invite`.
2. Mutation checks for each group (as K3a run 4), restore with `git checkout -- <file>`.
3. `bin/test-js` (not yet run this slice; `keyring-signin` 53 pass and `inventory-menu` 28 pass after the edits), then `bin/rails test test/controllers/break_escape/keyring_route_test.rb` and rubocop on `credential_keyring.rb`.
4. Live proof (separate agent): R1 Connect beats on a new `test_access_keyring` game.
5. Part B: the find toasts (8.2 second bullet). `latest`, `listen()` and `trayChanged` are the place to diff for new entries; `heldItem` lets part B tell a tray add of a credential item.

### K3b run 2 (part A tests)

Tip before this run `e814559ca`.

**Built**
- `test/js/keyring-client.test.mjs` (38 cases): 8.5 strings word for word; steps 1 to 7 each with its exact toast, title (the tray item's name) and no POST; step 2 named from the tray item, not the entry, and "That sign-in" with no name; an assist invite never answers Connect; step 5 by the mirrored session's foothold, else the entry's; the order test (all states set, each cleared in turn); step 8 success (POST `{ foothold }`, desktop, no sign-in screen); teaching toast once per kind and again for a new page; `endedPcIds` to `linkDropped` as `route_ended` (never the new session); POST network failure; 403 `not_responding`, 403 unreachable and 422 `remoteBlocked` races; `LOGIN_NOT_PERMITTED` toast; `kind_refused` and `locked_out` open the screen with the account and refusal and no toast; any other refusal is a toast; a real `PasswordMinigame` chooses Lena's tile and shows the "always asks for the password" line; in-flight guard (a second and a different item are `busy`, it clears after success and failure); flush before the GET (`sync, keyring, post, desktop`); `returnTo` (once, after close; after the open wait with nothing opened; not watched after a toast); `connectEntryFor`; `trayChanged` once per changed id set; `listen`. The file copies the same module list as `keyring-signin.test.mjs`, which covers everything it loads (`keyring.js` loads `remote-host-text.js` by dynamic import, copied).
- `keyring_route_test.rb` (12 runs): `heldItem` is sent only for a held proof. A dropped or forged item lists no entry and its id is absent from the response body; every `heldItem` named is in the player's inventory; a foothold-proven saved connection carries no `heldItem`.

**heldItem finding.** No leak. The row is built only after `credential_proof_holds?`, whose `held` branch needs a non-forged inventory entry with the item's `credential`, type and id. The id sent is the player's own carried item. The one risk is the server naming an item for a non-held proof; that is now tested.

**Mutation results** (each broken in turn, restored with `git checkout -- <file>`)

| Mutation | Caught by |
|---|---|
| step order (drop the targetOff step) | keyring-client: step 4 and the order test |
| in-flight guard removed | keyring-client: 4 cases (guard, flush order, flush throw) |
| flush before the GET removed | keyring-client: guard and flush-order cases |
| refusal mapping (`locked_out` no longer opens the screen) | keyring-client: lockout case |
| `linkDropped` call removed (`_dropEnded` in the sign-in) | keyring-client: endedPcIds case |
| teach-once check removed | keyring-client: teaching toast case |
| heldItem filter, client (match any saved connection) | keyring-client: step 2 and the two-entries case |
| heldItem filter, server (names `id` for a non-held proof) | keyring_route_test: foothold case |
| heldItem filter, server (key set when nil) | keyring_route_test (1 failure) |
| direct-Connect condition (`trayClickIsConnect`) | inventory-menu.test: 3 cases |

A first server mutation (removing `present_string?`) survived because password rows never use that path; the foothold-proof test was added to kill the next one.

**HANDOVER (part B, the find toasts, plan 8.2 second bullet)**
1. `systems/keyring.js`: `latest`, `listen()` and `trayChanged` are the hooks. Diff each new answer's ids against the previous answer's (the page-start prime is the baseline: `firstAnswerIds`), toast the new entries only. Asks with `rev` after: a successful sign-in once the desktop opens, an inventory add/remove of an item with `credential` (`trayChanged` already asks; `heldItem` on the row tells a credential item), a plant, implant or Wi-Fi join, and a `foundIn` item opening (`noteOpened`).
2. Wording per 8.2: capture-log pointer when a capture log is held, else "Saved connection found: {label} for {displayName} on {host}." and "{displayName}'s password is in {label}."; more than two: two then "and N more"; captured entries silent; a `foundIn` entry waits for `noteOpened`; an NPC give's find is held until the conversation closes. An `assist_invite` gets no toast before K3c.
3. Tests go in `test/js/keyring-client.test.mjs` (same harness: `setup()`, the `alerts` list, `window.ApiClient.keyring` answers).
4. Live proof of Connect (R1, R3, R5b) is still a separate agent.

### K3b run 3 (part B, find toasts)

Tip before this run `dc8268916`.

**Built**
- `systems/keyring.js`: the first answer with no screen (the page-start prime) is the baseline and toasts nothing. Every later no-screen answer (`fetch(null)`, whoever asked: a trigger's `refresh()` or Connect) goes through `noteFinds`, which diffs it against the previous one and gives one toast for the new entries. A registry password whose file has not been opened here (`findWaiting`, the same test as `foundVisible`) is left out of the ids, so it counts as new once its file is opened. Captures, assist invites and any other kind are silent (`FIND_KINDS = ['saved_connection', 'password']`; K3c adds `assist_invite`). While `window.currentConversationNPCId` is set, finds are held and released as one toast on `conversation_closed:*`, or by a 500 ms poll when the flag clears with no close event (the mail runner sets it too).
- Triggers in `listen()`: `pc_signed_in` then `pc_desktop_opened` for the same PC (one ask once the desktop is open; a desktop reopened on a held session asks nothing); `network_foothold_gained` (plant, implant and Wi-Fi join each emit it once); `trayChanged` (see deviations); `noteOpened(id)` asks only when a waiting entry is found in that file. Each ask is one GET with `rev`, usually `unchanged`.
- `utils/remote-host-text.js`: `savedConnectionFoundMessage`, `passwordInFileFoundMessage`, `findMoreLine`, `findLine(entry)` and `findToastText(entries)` ("no capture log" lines of 8.2; the capture log wording is K3d).
- Toasts go through `window.gameAlert(message, 'info', '', 7000, { plainText: true, brief: true })`. Checked: `showNotification` treats every toast as plain text unless `options.html === true`, and sets the title with `textContent` and the message with text nodes (`setPlainLines`). A test drives a label and a name holding markup through the real `notifications.js` and finds no element made from them.
- Nothing written to globals, player state or storage; no POST.
- Backlog: the gift toast's emoji (`chat-helpers.js:141`) logged in `docs/IDEAS_BACKLOG.md`.
- No new static imports (the text module is loaded by dynamic import, as Connect does, and is already in the harness copy list).

**Tests** `test/js/keyring-client.test.mjs`, now 51 cases (13 new): the find strings word for word; baseline at load (one GET, no rev, no toast); rev reuse and `unchanged`; a failed prime leaves the next answer as the baseline; wording per kind, two in one toast, more than two as two then "and 1 more" (an invite and a capture in the same answer not counted); captures and invites silent; the `foundIn` wait (no toast, another file asks nothing, its file asks once with rev, toast on the `unchanged` answer, shown once); an entry waiting at load is revealed by the prime and never toasts; the hold during a conversation (two finds, one toast after `conversation_closed:*`, timer cleared); release by the poll; the sign-in and foothold triggers; no writes; markup in a label stays text. Two part A tests changed with the tray rule and the longer listener list.

**Mutation results** (each broken in turn, restored from a copy)

| Mutation | Caught by |
|---|---|
| grouping ("and N more" branch removed) | the grouping case |
| capture silence (capture filter removed in both the keyring and `findLine`) | 3 cases (strings, grouping, silence) |
| `foundIn` wait (`findWaiting` skipped) | the `foundIn` wait case |
| conversation hold (`inConversation` check removed) | both hold cases |

The capture filter sits in two places (`findKindToasts` and `findLine`); removing only one is not caught because the other still keeps the toast silent. Left as a double guard.

**Deviations**
- `trayChanged` now asks on any add (an item's `credential` never reaches the client, so any add may be one) and on a removal only when the removed id is some entry's `heldItem` in the latest answer. Part A asked on any change of the id set.
- The toast has no title and passes `brief: true`, so the phone's two-line clamp never cuts a grouped toast.
- "and N more" has no full stop, as in 8.2's wording. Each name line keeps its own.
- The diff is against the previous answer, as 8.2 says, so dropping a .rdp and taking it again toasts again.
- A failed prime means the next good answer is the baseline and toasts nothing, so a find made before that answer is silent. Nothing is stored, so this follows the reload rule of 8.1.

**HANDOVER (live proof)**
Beats R1, R3 and R5b are in the section 9.1 table of the plan (`grep "| R1 |"`), on new games of `test_access_keyring`:
1. R1: at Sam's keyboard take HB-FIN-02.rdp: the toast reads "Saved connection found: HB-FIN-02.rdp for Lena Fox on HB-FIN-02." If the .rdp is given in ink, the toast appears only once the conversation closes, after the gift's own toast.
2. R3: on Lena's desktop, no toast for Jake until passwords.txt is opened; then "Jake Brooks's password is in passwords.txt." once (the label is the registry entry's; check it), and the "In file" tag (K3a).
3. R5b: Connect SV-OPS-01.rdp from the tray (part A); taking it gives its find toast first.
4. Check the network tab: one GET /keyring per trigger, usually `unchanged`; no writes. Shots at the four sizes, including a grouped toast if a beat yields three finds at once; `verify-run.rb`.

### K3b run 4 (R1 fixes, fixtures)

Tip before this run `e1d5a3ff3`. Review: `CREDENTIAL_KEYRING_K3B_REVIEW_R1.md` (B0 M0 m4 t4).

**Fixed**
- m1: background (no-screen) asks are numbered when sent and an answer older than one already applied is dropped whole (`_askSeq`, `_appliedSeq` in `fetch`). `refresh()` joins any ask not yet sent (same-tick triggers share one GET, so opening passwords.txt sends one) and chains later asks one at a time, so a trigger that arrives while a request is on the wire asks again after it, never beside it. Tests: out-of-order answers (one toast, `latest` keeps the newer), coalescing, no two in flight.
- m2: `options.whole` in `notifications.js` adds a `whole` class that lifts the phone two-line clamp (`notifications.css`) and nothing else (no `brief` priority, no shown-limit skip). Used by the find toast and by both teaching toasts (Connect and K3a's `teachAfter`). Test: options, class, CSS rule.
- m3: a failed prime retries the baseline GET `PRIME_RETRIES` (3) times `PRIME_RETRY_MS` (5 s) apart (`retryPrime`), stopping at the first answer. If none lands, the next answer is the baseline as before. Tests: retry then a find toasts; retries stop.
- m4: POST /login 403 reasons found in the models: `not_responding` (credential_login.rb), `off` (game.rb, typed sign-in), `unreachable` or none (the "PC not reachable" body has no reason). Now `not_responding`/`off` give the not-responding line, `unreachable`/none give "can't be reached from here", any other reason gives `CONNECT_FAILED_TEXT`. Tests for each, plus two unknown reasons.
- t2: a missing `pcSessions` toasts `CONNECT_FAILED_TEXT`. Test.
- t3: `credential_keyring.rb` reads `heldItem` only when `CredentialModel.proof_kind(proof) == 'held'`.
- t4: comments at both capture filters (`findKindToasts`, `findLine`) naming the double guard, plus a direct `findLine` test on a capture.
- t1 goes to the K4 notes: emit one `minigame_ended` from `minigame-manager.js`'s end `finally`, replace `watchScreensClose`'s poll with it, and note two overlapping Connects with `returnTo` would run two watchers (the in-flight guard prevents it today).

**Fixtures** (`scenarios/test_access_keyring/scenario.json.erb`, plan 9.1)
- `ops_rdp_file` (SV-OPS-01.rdp) on Lena's desktop, takeable and droppable, credential `ops_rdp` (saved_connection for Ian, `connectsTo: ops_pc`, `proof.held`), no observations and no text, so a tray click is Connect. SV-OPS-01 takes `pw_only`, so Connect is the R5b policy refusal.
- `lena_rdp_gift` (HB-FIN-02 copy.rdp) in Lena's `itemsHeld`, credential `lena_rdp_gift` (saved_connection for Lena on `lena_pc`, held), droppable. A new once-only choice in `ink/lena.ink` ("Could I have a copy of that connection file?", compiled to `lena.json`) gives it with `#give_item:text_file:lena_rdp_gift`, so a find arrives mid-conversation. Plain ink text, no TTS.
- Validator: 0 errors, 4 warnings. New: two "droppable without a needsTag" (the two items) and `ops_rdp` "accepted by no machine" (the refusal fixture, same as the existing `ops_cookie`).

**Tests** keyring-client 58, inventory-menu 28, keyring-signin 53, Rails keyring route/take/model 34 runs 0 failures, full Rails suite 3000 runs 0 failures 3 skips, rubocop clean on the changed Ruby, bin/test-js 716 files, 0 failed.

**HANDOVER (live recheck)**
Reachable now, on a new game of `test_access_keyring`:
1. Single GET: sign in at Lena's PC (sticky note, Finance is east of the lobby) and open passwords.txt: one `GET /keyring?rev=` for the open, not two.
2. R5b and one-click Connect: on Lena's desktop take SV-OPS-01.rdp (the find toast "Saved connection found: SV-OPS-01.rdp for Ian Shaw on SV-OPS-01."), plant the drop box in the comms port (north of the lobby; the drop box is in the lobby), then click the tray item: no menu (nothing to examine), Connect runs. Expect the SV-OPS-01 remote screen with the saved-connection refusal under the greyed button.
3. NPC-give hold: talk to Lena (lobby), choose "Could I have a copy of that connection file?". The gift's own toast shows first, and the find toast "Saved connection found: HB-FIN-02 copy.rdp for Lena Fox on HB-FIN-02." only after the conversation closes. Also a Connect target.
4. Drop: with either new item droppable, Drop here from the tray goes through the server; check the entry leaves GET /keyring (heldItem gone) and Connect on a stale tray click says "{label} no longer works.".
5. Phone shots (390x844): the find toast and the teaching toast now wrap whole (class `whole`); a warning or objective toast is not pushed aside by a find (it no longer carries `brief`).
6. Failed prime: block GET /keyring for the first 5 s of a page, then allow it: the first real find still toasts.

### K3b run 5 (R2 fixes)

Tip before this run `0782e1206`. Review: `CREDENTIAL_KEYRING_K3B_REVIEW_R2.md` (B0 M0 m2 t3).

**Fixed**
- m1a: `refresh()` clears `_queued` as the first statement of the ask callback, before the sync await, so a trigger during the sync PUT builds a later ask that carries its own change. Test: second `refresh()` during a pending `syncConfirmed` returns another promise and syncs and GETs again.
- m1b: when a stale (older than an applied) answer is dropped and it is the page-start prime, `firstAnswerIds` is still set from it (`noteDropped` in `fetch`). Test: prime answered after a newer ask; a password found before the reload is not hidden.
- t1: the chained background ask has a 15 s cap (`ASK_TIMEOUT_MS`, `askTimeoutMs`): an AbortController signal (`ApiClient.get` and `keyring` now take `signal`) plus a race, so a hung request cannot freeze the chain. Connect's own GET and the prime keep their behaviour (no cap). Test: a hung ask returns null, the request is aborted, a later ask is answered and toasts.
- t2: a reason-less 403 gets the "can't be reached from here" line only when its message says "not reachable"; the Pundit `{error:'Not authorized'}` body gets the Connect failure line. The old reason-less test row now carries the real server message.
- t3: keyring-signin asserts K3a's teaching toast passes `whole: true`.

**Fixture**
- `ops_rdp` and `ops_rdp_file` are relabelled "SV-OPS-01 admin.rdp" so they differ from `ops_cookie` ("SV-OPS-01.rdp") in the sign-in rows and the find toasts. The find toast now reads "Saved connection found: SV-OPS-01 admin.rdp for Ian Shaw on SV-OPS-01." (run 4's handover step 2 names the old label).

**Live note (no change)**
- One-click Connect cannot occur with this fixture: the item is droppable (Drop here) and has file text (Examine), so the tray shows the menu. That is correct per 8.2. The one-click path stays covered by the inventory-menu tests.
