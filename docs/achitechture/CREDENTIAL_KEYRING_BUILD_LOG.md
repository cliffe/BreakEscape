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
