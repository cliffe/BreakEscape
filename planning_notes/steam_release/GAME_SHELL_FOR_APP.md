# Game shell: handoff for the Electron app

Written 2026-10-26 for the agent building the Electron (Steam) wrapper. It describes the
full-screen game shell that Hacktivity now serves for Game events, what the app has to do to
wrap it, and what is not built yet. Read it with `README.md` ("Single-game app mode") and
`IMPLEMENTATION_PLAN.md` in this folder.

## Where the code is

| Repo | Branch | PR | Commits |
|---|---|---|---|
| cliffe/BreakEscape | `claude/sharp-gates-vvkgpf` | cliffe/BreakEscape#97 | `8807ec34` engine hook (plus this note) |
| cliffe/Hacktivity | `claude/sharp-gates-vvkgpf` | cliffe/Hacktivity#76 | `483de5d` shell, `246bf9d` staff "Manage event" |

**Merge order: BreakEscape#97 first.** Hacktivity's `config/initializers/break_escape.rb` sets
`config.shell_links`, which raises at boot on an engine without the hook. Hacktivity also needs
its migration (`20261026120000_add_ui_theme_to_events`) run on deploy. To build the app on top
before the PRs merge, branch from (or merge) `claude/sharp-gates-vvkgpf` in both repos.

## What the shell is

A Game event (`events.type_of_hacktivity = "Game"`) now opens in a full-screen shell with no
Hacktivity site chrome. This is the UI the app should load: it is the "single-game layout" the
Steam plan asks for.

| Screen | Path | Notes |
|---|---|---|
| Title and main menu | `/hacktivities/:event_id/play` | Event title art; Continue, Operations, Leaderboard, Agent file, sign in or enlist, exit |
| Operations | `/hacktivities/:event_id/play/operations` | `?selected=:slot_id` picks the detail panel |
| Briefing | `/hacktivities/:event_id/play/operations/:slot_id` | Start / Resume / Start again / Replay, Walkthrough |
| Debrief | `/hacktivities/:event_id/play/operations/:slot_id/debrief` | Needs a signed-in user |

- `/hacktivities/:event_id` (the event page) redirects everyone, staff included, to the title
  screen. `?details=1` shows the classic page; for staff it is remembered for that event for the
  session ("Manage event"), and opening the shell clears it.
- Code: Hacktivity `app/controllers/game_shell_controller.rb`, `app/views/game_shell/`,
  `app/views/layouts/game_shell.html.erb`, `app/helpers/game_shell_helper.rb`,
  `app/services/game_shell_operation.rb`, `app/assets/stylesheets/game_shell.css`.
- Look: the engine's own UI skin (`/break_escape/css/ui-themes.css` and fonts), chosen by
  `events.ui_theme` or the first mission's `ui_theme`; `?ui_theme=` previews another. Pixel art
  is drawn at exactly 2x. Fluid layout; below 720 px it stacks to one column with
  `env(safe-area-inset-*)` padding (the viewport meta has `viewport-fit=cover`).
- Keyboard: Up and Down move focus between menu items (`[data-gs-nav]`), Enter activates.
  There is no gamepad support and Esc does nothing in the shell.

## App mode: how the server knows it is in the app

`GameShellController#shell_app?` is true when either:

- the user agent contains **`HacktivityApp`** (proposed token; set it with
  `app.userAgentFallback` or `session.defaultSession.setUserAgent`, e.g. append
  ` HacktivityApp/<version>`), or
- the shell was opened once with **`?app=1`** (remembered in the Rails session; `?app=0` clears it).

Prefer the user-agent token: it holds for every request, including after sign-in. If you choose a
different token, change `shell_app?` in the controller and its test
(`test/controllers/game_shell_controller_test.rb`, "app mode").

What changes in app mode:

- Links into the rest of Hacktivity (Leaderboard, Agent file, Event details, View plans, mission
  scoreboard) become absolute URLs with `target="_blank" rel="noopener"` and an outbound icon.
- "Exit to Hacktivity" is replaced by "Hacktivity website" (`/`, `target="_blank"`).
- Everything else stays in the window: the shell's own pages, sign in (`/users/sign_in`),
  create account (`/users/sign_up`), enlist (POST), and starting a mission.

Not done server side yet (from the plan): refusing Stripe checkout and billing pages for app
requests. Today only the links change; the guard below is the only barrier.

## What the Electron shell needs to do

1. **Load** `https://<host>/hacktivities/<event_id>/play` in a full-screen window, with the
   user-agent token set. The Licence to Hack event id differs per environment, so make it config.
2. **Open `_blank` links outside the app:** `webContents.setWindowOpenHandler` returning
   `{ action: 'deny' }` after `shell.openExternal(url)`. All the shell's outbound links, the
   Walkthrough (lab sheet, an external site) and the in-game Walkthrough (`window.open(url,
   '_blank', 'noopener')`) arrive here.
3. **Guard in-window navigation** (`will-navigate` / `will-redirect`): allow
   - `/hacktivities/<event_id>/play` and below;
   - `/hacktivities/<event_id>/missions/:slot_id/start` (POST from the briefing) and the redirect
     it returns;
   - `/break_escape/...` (the game, its API, its assets, and `/break_escape/configuration?game_id=`,
     the character picker the game may show before the first play);
   - `/users/...` (Devise sign in, sign up, password, MFA set-up);
   - the VM console pages the game opens, if any (check during the VM playtest).
   Anything else: `shell.openExternal` and keep the window where it was.
4. **Bring the player back after sign-in.** Hacktivity's `after_sign_in_path_for` sends users to
   `/` (or `setup_mfa_users_path` if they have no MFA, or pending invitations), not back to the
   shell. Either catch that landing in the app and load the play URL again, or add a server-side
   change: honour a stored location for app requests. Sign-in uses an emailed or app token
   (OTP), so the sign-in page needs to stay in the window.
5. **Missions run in the same window.** Briefing → POST `.../missions/:slot_id/start` → 303 to
   `/break_escape/games/:id`. The game page sets `window.name = 'be_game_<id>'` and a
   localStorage heartbeat; both are harmless in Electron. Inside the mission:
   - pause menu **Save and quit to menu** → the operations page (`shellMenuUrl`);
   - pause menu **Walkthrough** → the lab sheet in a new window (`walkthroughUrl`), so it reaches
     your window-open handler;
   - success screen **Debrief** → the debrief page (`shellReturnUrl`, `shellReturnLabel`).
   These come from `BreakEscape.configuration.shell_links` (engine `lib/break_escape.rb`,
   documented in `HACKTIVITY_INTEGRATION.md`; Hacktivity sets it for Game-event listings only).
6. **Steam work** (sign-in, entitlements, overlay, achievements) is unchanged by this and still
   follows `IMPLEMENTATION_PLAN.md`; the shell only provides the screens.

## Known gaps and decisions to check

- The token `HacktivityApp` is a proposal; confirm or change it (see above).
- Ranks on the debrief come from the best score: A from 90%, B from 75%, C from 50%, else D.
- The debrief has no "your choices" panel and the briefing no objectives list (neither can be
  read without generating the scenario); the field-server panel is a note, not live VM status.
- Not browser-tested: the two new pause-menu items inside a running mission.
- Nothing tested inside Electron yet: the shell was checked in Chromium (Playwright) at
  1280×800 and 390×844.

## Running it locally (what worked in a cloud container)

- Hacktivity tests need Postgres, Redis, `yarn install`, an (empty) `../SecGen/scenarios`
  folder, and credentials. Without the master key, point `config.credentials.content_path` and
  `key_path` at throwaway files in an uncommitted edit to `config/environments/test.rb`.
- On Ruby 3.3, `BUNDLE_FORCE_RUBY_PLATFORM=1 bundle install` builds the sqlite3 and nokogiri
  versions the lockfiles pin.
- Sign-in on a dev server needs the OTP: request "Email me a token" and read the code from the
  `SendTokenEmailJob` line in the server log.

## Merged with the desktop app work (2026-10-26)

Both PRs are merged into local `main`: BreakEscape `b51293fda`, Hacktivity `1a28b466` (merge) and
`c46d9f5f` (wiring). Where this note's plan and the existing desktop app differed:

- **Start URL:** the app keeps `/app/<game key>`. Hacktivity maps the key to the event
  (`events.app_key`) and sends a Game event to `/hacktivities/<id>/play`, before and after sign-in,
  so the app needs no per-environment event id.
- **Token:** `shell_app?` now uses the full token parser (`AppClient`): `HacktivityApp/<version>
  (game=…; edition=…)`. A bare `HacktivityApp` no longer counts. `?app=1` still previews the
  app's link style in a browser.
- **Stripe and billing:** the server-side scope guard (`AppMode`) refuses them in the app and shows
  "Open in your browser"; it now lets the app's own shell pages through and refuses other events'.
  Locked missions in the app show the edition's purchase link (demo: the event's store page),
  never "View plans".
- **Sign-in landing:** already handled: app sign-in, sign-up, confirmation and sign-out return to
  `/app/<key>`, which now reaches the title screen (MFA set-up first when required).
- **Navigation filtering** stays on the server; the Electron app keeps Hacktivity's own pages in the
  window and opens `_blank` links and other sites in the system browser. No app change was needed.
- **Sign out:** signed-in app players get "Sign out" on the title menu.
- **Engine exits:** the pause menu has one leave item ("Save and quit to menu" with a shell, "Back to
  missions" in the app without one), both after a confirmed save. Game over and the end-screen button
  also use the shell's pages.
- `GameShellOperation` used Ruby 3 endless methods; Hacktivity runs Ruby 2.7, so they were rewritten.

## Possible future improvements

- **Lapsed organisations on members-only Game events** (left as is, owner's decision 2026-10-27).
  On an organisation's own Game event that is not an open subscription, a member of an organisation
  whose deal has lapsed still gets Start: `GameSlotPolicy#start?` checks only the member's role and
  organisation id. The deal date is checked by `EventAccess`, which only open-subscription events
  use, so there a lapsed organisation's members are already blocked ("ask your account manager").
  If lapsed organisations should lose access everywhere, `start?` would need the same deal check.
  The skipped test "org Game event — a member of a lapsed organisation" in Hacktivity's
  `test/controllers/game_shell_coverage_test.rb` marks the spot.
- **Walkthroughs:** the briefing hides an operation's walkthrough link while the operation is
  locked for the viewer (plan needed, not released, event ended) and shows it once it unlocks.
