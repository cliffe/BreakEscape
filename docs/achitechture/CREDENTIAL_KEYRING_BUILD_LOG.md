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
