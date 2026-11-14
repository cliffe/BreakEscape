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
