# Android app (Google Play): implementation plan

Status: plan, 2026-10-27, revised the same day after an Opus review. No code changed. Builds on
`ANDROID.md` ("Owner answers (2026-10-27)" and the points the owner added the same day),
`README.md` ("Single-game app mode", "Desktop app status"), `ACCESS_MODEL.md` and
`GAME_SHELL_FOR_APP.md`.

Superseded by the owner's 2026-10-27 decisions: `ANDROID.md` Q1's dedicated host (now one host,
client-side detection), and every "Play buyers only" or "the Play app only unlocks with a Play
entitlement" rule (G4 in `OPEN_QUESTIONS.md`, `ACCESS_MODEL.md` "Store apps", `ANDROID.md` "G4 is an
access rule"). Access is account-wide (section 1).

Standing rules for every package: ask the owner before each Hacktivity edit (Hacktivity work goes
on `main`); stage explicit paths and check `git diff --cached --stat`; a fix is proven on the real
path (dev server on :3000, emulator), not only by unit tests; no SecGen XML and no VM exploit
content anywhere in this work. Billing facts marked **verify** are from memory and must be checked
against Google's current documentation at the start of the package that uses them.

## 1. Architecture

### Access is account-wide

The player signs in to Hacktivity, and every route to the game they hold applies on every
platform: browser, Steam app, a future website desktop build, Play app. The routes are an
individual subscription, organisation access, a live entitlement of any source (`steam`,
`google_play`, `grant`, `playtest`) and the free window. A Play purchase unlocks the game on the
website and in the Steam app; a Steam purchase unlocks it in the Play app. **Only payment links
depend on the platform.** No access decision reads the platform anywhere.

Checked in the code: `EventAccess#entitlement_route?` is
`EventEntitlement.live.exists?(user_id:, event_id:)` with no source filter
(Hacktivity `app/services/event_access.rb`), and nothing under `app/policies`,
`app/services/event_access.rb` or `app/services/game_shell_operation.rb` mentions a store source or
`app_client`. `GameShellAccess` reads the desktop app's edition only to word a status line ("Demo"
instead of "Free access", `app/services/game_shell_access.rb:30-41`). The plan adds no access rule;
P6's tests assert that a `google_play` row opens the game in a plain browser and that a `steam` row
opens it with the Play marker.

### Two platform fields

One notion of "platform" would tie two separate things together: whether the page sits in a
single-window app, and which store sells the game there. A website desktop build (if the owner
ever wants one) is a single window like Steam but buys through the website like the browser. So the
client and server carry two fields:

| Field | Values | Read by |
|---|---|---|
| **app window** | `browser`, `desktop-app`, `play-app` | exits that must never `window.close()`, link routing, layout |
| **store** | `web`, `steam`, `play` | every buy prompt |

| Platform | App window | Store | Detected from |
|---|---|---|---|
| Website in any browser | browser | web | default |
| Steam desktop app | desktop-app | steam | UA token with no `store` field, or `store=steam` (all existing builds) |
| Website desktop build (not decided, no build planned) | desktop-app | web | UA token with `store=web` |
| Play app | play-app | play | start URL marker, checked as below |

The desktop UA token gains an optional field:
` HacktivityApp/<version> (game=<key>; edition=<full|demo>; store=<web|steam>)`. Absent means
`steam`, so built apps keep working. Hacktivity `AppClient::TOKEN` (`app/services/app_client.rb:12`)
accepts it and exposes `store`; `hacktivity-desktop/src/config.js` `userAgentToken` would add it
from an edition's `store` setting when the owner decides on a website build. That makes the website
build a config change plus its own `appId`; nothing for it is built now.

Play detection (client only): `?source=play` in the URL **and** either `document.referrer` starts
with `android-app://<package>/` for a package listed in
`<meta name="hacktivity-play-packages">`, or `await getDigitalGoodsService('https://play.google.com/billing')`
resolves (in try/catch; presence of the method is not enough, **verify**). On success the module
stores `{appWindow:'play-app', store:'play', package, gameKey, eventId, appPaths, at}` in
`sessionStorage['hacktivity.platform']` and strips the marker with `history.replaceState`. A marker
that fails the check is stripped and ignored, so a shared link can't switch a desktop browser into
the app layout. Any error reading storage means browser/web.

`sessionStorage` is per tab, and links the app sends outside carry `noopener` (Chrome does not copy
`sessionStorage` into a `noopener` window), so the marker never reaches the player's ordinary Chrome
tabs. Uninstall and reinstall: the TWA shares Chrome's cookie jar, so the remember-me cookie
survives while `sessionStorage` does not; the start URL marks the new tab again and `restore()` runs.

### The pieces

```
 hacktivity-android (TWA)                      hacktivity.co.uk (one Rails app)
 ┌──────────────────────────┐   launch    ┌──────────────────────────────────────────────┐
 │ launchUrl                │────────────>│ GET /app/<key>?source=play  (AppEntry keeps  │
 │ /app/<key>?source=play   │ referrer    │   the marker on its redirects)               │
 │ playBilling feature on   │ android-app │ GET /.well-known/assetlinks.json             │
 │ VIEW filter narrowed     │ ://<pkg>/   │ shell + engine pages load client-platform.js │
 └──────────────────────────┘             │                                              │
  page (Chrome, per tab)                  │ POST /play_purchases/intents (before sheet)  │
 ┌──────────────────────────┐             │ POST /play_purchases  (verify, bind, grant)  │
 │ client-platform.js       │────────────>│   GooglePlay::PurchaseClaim                  │
 │  appWindow + store       │             │     GooglePlay::Client ─> Play Developer API │
 │  html[data-app-window]   │<────────────│     EventEntitlement(source: google_play)    │
 │  html[data-store]        │             │     acknowledge (+ sweep by purchase time)   │
 │  link routing, buy route │             │ daily GooglePlayVoidedPurchasesJob → revoke! │
 │  Digital Goods + PayReq  │             │ EventAccess: unchanged, account-wide         │
 └──────────────────────────┘             └──────────────────────────────────────────────┘
```

| Piece | Where | What it does |
|---|---|---|
| Client platform module | BreakEscape `public/break_escape/js/client-platform.js` (new, classic script, in `<head>`) | Sets both fields once per tab, sets `html[data-app-window]` and `html[data-store]` before first paint, exposes `window.HacktivityPlatform` |
| Engine accessor | BreakEscape `public/break_escape/js/utils/desktop-app.js` | Keeps `isDesktopApp()`; adds `isAppWindow()` (desktop-app or play-app: never `window.close()`) and `appHomeUrl()` |
| In-app paths | Hacktivity `app/services/app_paths.rb` (new), emitted as a meta tag | The paths that stay inside the Play app, built from route helpers and tested against them |
| Buy prompts | Hacktivity helpers and views | Outside desktop app mode the server renders a `web` and a `play` form of each prompt, tagged `data-store-only`; in desktop app mode it renders the one its `AppClient#store` names |
| Purchase routing | `client-platform.js` (`buy()`) | web: plans page; steam: `events.store_url`; play: Digital Goods price, intent, Payment Request, POST the token |
| Link routing | `client-platform.js` | Play app only: navigations outside the in-app paths open in the browser by the mechanism P0 proves |
| Asset links | Hacktivity `/.well-known/assetlinks.json` | Chrome verifies the TWA |
| Billing endpoints | Hacktivity `PlayPurchasesController` | Intent, claim, restore with the player's consent |
| Google client | Hacktivity `app/services/google_play/` | Service-account token (jwt), three REST calls (httparty), a fake |
| Voided poll and acknowledge sweep | Hacktivity jobs, `config/resque-schedule.yml` | Revoke refunded purchases; acknowledge before Google's 3 days run out |
| Wrapper config | `hacktivity-android` | Marker in the start URL, Play Billing, narrowed intent filter, debug build |

Where desktop detection meets Play detection: `isDesktopApp()` (UA test) stays for code that means
"the desktop build" (title screen hold, `minigames/title-screen/title-screen-minigame.js:148`). The
exits that mean "one window, never close it" move to `isAppWindow()`:
`ui/success-screen.js:123`, `ui/game-menu.js:48`, `ui/game-over-screen.js:208`, and
`systems/apply-actions.js:295` (its own inline UA regex, kept inline because its tests load the
file alone; add a matching inline check of the stored Play marker). `DESKTOP_APP_HOME` (`/`) becomes
`appHomeUrl()`: `/` in the desktop app (the server sends it to the game), `/app/<gameKey>` in the
Play app (the server does not know it is the app, so `/` would be the website home). Hacktivity's
`app/assets/javascripts/channels/file_push.js:29` reads `HacktivityPlatform` when present and keeps
its UA regex as the fallback for pages that don't load the script.

The engine has no buy prompts of its own: no plans, store or purchase links in
`public/break_escape/js` or the engine views. Every buy prompt is in Hacktivity's shell and event
page.

### The page contract (fixed here so packages can run in parallel)

- Script: `/break_escape/js/client-platform.js?v=<BreakEscape::ASSETS_VERSION>`, classic, in
  `<head>` with the CSP nonce (CSP has `strict-dynamic`).
- `<html data-app-window="browser|desktop-app|play-app" data-store="web|steam|play">`.
- Default visibility: CSS shows the `web` form and hides the `play` form unless
  `html[data-store="play"]`, so if the script fails the website keeps every buy prompt.
- Metas on Hacktivity layouts: `hacktivity-play-packages`
  (`uk.co.hacktivity.licencetohack=licence-to-hack`, from the asset-links config),
  `hacktivity-app-event` (event id, shell pages), `hacktivity-app-paths` (JSON from `AppPaths`),
  `hacktivity-signed-in` (`1` or absent), `hacktivity-test-hooks` (development and test only).
- Markup: `data-store-only="web|steam|play"` (space-separated); `data-outside` on a link that must
  leave the app; `<button data-play-buy data-product-id="…" data-event-id="…">`;
  `<span data-play-price>`; `<a data-play-sign-in>` for guests.
- `window.HacktivityPlatform`: `appWindow`, `store`, `gameKey`, `eventId`, `isAppWindow`,
  `homeUrl()`, `openOutside(url)`, `buy(el)`, `restore()`.

## 2. Work packages

Each is sized for one Sonnet agent, about half a day. "Proof" is the real-path check the agent runs
and reports with output or screenshots; unit tests alone do not close a package. Playwright proofs
use the stored-marker path with `getDigitalGoodsService` stubbed by `addInitScript` (Chromium does
not pass an `android-app://` referrer to `document.referrer` on a scripted navigation, probably);
the referrer path is proven only on the emulator (P10).

```
Wave 1 (parallel):  P0 outbound-link spike (emulator)   P1 engine platform module
                    P2a Hacktivity platform boot        P3 asset links     P4 Google client + fake
                    P9 wrapper config (once the scaffold has its first commit)
Wave 2:             P2b buy prompts and wording   (after P2a; proof needs P1)
                    P5 Play-app navigation         (after P0, P1, P2a)
                    P6 intents, claim, restore API (after P4)
Wave 3:             P7 client purchase + restore   (after P2b, P5, P6)
                    P8 voided poll, ack sweep, support move (after P6)
Wave 4:             P10 emulator end to end        (after P1–P9)
Any wave:           P11a account deletion that anonymises (Hacktivity; must land before P11)
Owner-gated:        P11 internal track with licence testers (after P10, P11a, O1–O5)
                    P12 store listing and policy
Later:              P13 real-time developer notifications
```

### P0. Spike: how a link leaves the TWA (emulator)

- **Repo/files:** none committed; a scratch page served by the dev server (or a static page on
  localhost) and the scaffold's debug build from `hacktivity-android`.
- **Do:** on the emulator, from inside the verified (or flag-verified) TWA, try each and record
  where it lands (TWA tab, Custom Tab in the app's task, Chrome proper, chooser, nothing):
  1. `intent://hacktivity.co.uk/pricing#Intent;scheme=https;action=android.intent.action.VIEW;S.browser_fallback_url=…;end`
  2. the same with `package=com.android.chrome`
  3. `window.open(url, '_blank', 'noopener')` to a same-origin path and to an off-site URL
  4. a plain `<a target="_blank">` and a plain link to an unverified origin
  Each with the scaffold's host-wide VIEW filter and again with a filter narrowed to
  `/app/licence-to-hack` (hand-edited build).
- **Done:** a short note in `hacktivity-android/docs/OUTBOUND_LINKS.md` (or the agent's report if
  the repo is still uncommitted) naming the mechanism P5 uses, with screenshots, and whether the
  narrowed filter is needed for it. If nothing reaches Chrome proper, P5 uses a Custom Tab and the
  owner is told.

### P1. Engine: client platform module

- **Repo/files:** BreakEscape `public/break_escape/js/client-platform.js` (new);
  `public/break_escape/js/utils/desktop-app.js`; `minigames/title-screen/title-screen-minigame.js`,
  `ui/success-screen.js`, `ui/game-menu.js`, `ui/game-over-screen.js`, `systems/apply-actions.js`;
  `app/views/break_escape/games/show.html.erb` (script in `<head>`).
- **Build:** both fields as in section 1, including the UA `store` field; storage; html
  attributes; `homeUrl()`; `isAppWindow`; `openOutside()` as a stub that P5 completes. Engine pages
  normally read the stored value (the app always enters through `/app/<key>`), but run the full
  check so a direct engine URL in the app works.
- **Tests (`bin/test-js`):** new `test/js/client-platform.test.mjs` (jsdom): UA without `store`
  gives desktop-app/steam; with `store=web` gives desktop-app/web; marker plus matching referrer
  gives play-app/play, stored and stripped; marker plus a resolving Digital Goods stub gives
  play-app; marker with an `https://` referrer and a rejecting stub gives browser/web and strips;
  method present but call rejects gives browser; stored value survives a navigation; storage
  throwing gives browser/web. Update `test/js/success-screen.test.mjs` and
  `test/js/app-mode-exit.test.mjs` for `isAppWindow()` and `homeUrl()`, and the `apply-actions`
  tests for the inline Play check.
- **Proof:** dev server :3000, Playwright Chromium with an `addInitScript` stub of
  `getDigitalGoodsService`: open `/break_escape/games/<id>?source=play`, read both html attributes,
  confirm the marker is gone from the URL, open a second page in the same context (browser/web),
  and check the pause menu's leave item goes to `/app/licence-to-hack`. Also the Steam desktop app
  (`hacktivity-desktop`, `npm run start:demo` against :3000): attributes are desktop-app/steam and
  the exits are unchanged.
- Bump `BreakEscape::ASSETS_VERSION` on release so cached engine JS refreshes.

### P2a. Hacktivity: platform boot

- **Repo/files:** Hacktivity `app/views/layouts/game_shell.html.erb`,
  `app/views/layouts/application.html.erb` (script and metas); `app/controllers/app_entry_controller.rb`
  (keep `source=play`, that exact value only, on both redirects and in `store_location_for`);
  `app/services/app_client.rb` (optional `store` field); `app/services/app_paths.rb` (new);
  `app/assets/stylesheets/game_shell.css` and the site stylesheet (`[data-store-only]` rules with
  the web form visible by default); `app/assets/javascripts/channels/file_push.js`.
- **AppPaths** (one Ruby source, emitted as JSON regexes for the shell's event), checked against
  `config/routes.rb`:
  - `/app/<key>`
  - Devise, by name only: `/users/sign_in`, `/users/sign_out`, `/users/sign_up`,
    `/users/password/new`, `/users/password/edit`, `/users/password`, `/users/confirmation/new`,
    `/users/confirmation`. Not `/users/edit`, `/users/cancel` or `/users/invitation…` (account
    editing and deletion stay in the browser, as `AppMode::REGISTRATION_ACTIONS` keeps them).
  - `/hackers/setup_mfa`, `/hackers/multi_factor_authentication_setup`,
    `/hackers/multi_factor_authentication_not_setup`, `/hackers/active_vm_sets_modal`
    (`users` is routed as `hackers`, `routes.rb:124-130`).
  - `/hacktivities/<event>` exactly (events#show redirects a Game event to its shell),
    `/hacktivities/<event>/sign_up_current_user`, `/hacktivities/<event>/play` and below.
  - `/hacktivities/<event>/missions/<slot>/` with `start`, `restart`, `vm_status`, `extend_vms`,
    `shutdown_vms`, `finish`, `abandon` (`routes.rb:173-182`); not `mission_scoreboard`,
    `your_games` or the admin actions.
  - `/hacktivities/<event>/challenges/` and below (sec_gen_batches are routed as `challenges`,
    `routes.rb:189`; the VM console is
    `/hacktivities/<e>/challenges/<b>/vm_sets/<s>/vms/<v>/vnc_console`, `:233`), except
    `challenge_scoreboard`, `update_modal`, `load_admin_vm_list` and `show_admin_password`.
  - `/feedbacks`, `/feedbacks/<id>`; `/break_escape/` and below; `/.well-known/`.
  `<event>` is the shell's own event id; another event's paths are outside. The rule only affects
  top-level navigations; XHR, fetch and `/cable` are untouched.
- **AppClient:** `TOKEN` accepts an optional `; store=(web|steam)` before the closing parenthesis;
  `#store` returns it or `"steam"`.
- **Tests (Minitest):** `test/controllers/app_entry_controller_test.rb`: the marker survives the
  signed-in and signed-out redirects, other values are dropped. `test/services/app_client_test.rb`:
  old tokens parse with store `steam`, `store=web` parses, other values fail. New
  `test/services/app_paths_test.rb`: URLs built with the real route helpers (play title,
  operations, briefing, debrief, start, `vnc_console`, `setup_mfa`, sign-in, sign-up, password,
  confirmation) match; `edit_user_registration_path`, `plans_path`, `event_scoreboard_event_path`,
  `mission_scoreboard`, `challenge_scoreboard`, another event's play path and `/` do not. Layout
  test: metas present, nonce on the script, `hacktivity-test-hooks` absent in production config.
- **Proof:** dev :3000, Playwright with the stub: `/app/licence-to-hack?source=play` reaches the
  title screen with play-app/play attributes and the `hacktivity-app-paths` meta; with the script
  request blocked (`page.route` abort) the browser form of a buy prompt still shows.

### P2b. Hacktivity: buy prompts and wording per store

- **Repo/files:** Hacktivity `app/helpers/game_shell_helper.rb` (`gs_purchase_link`,
  `gs_full_game_link`, `gs_locked_note`, `gs_summary`, `gs_hacktivity_link`),
  `app/helpers/application_helper.rb` (`purchase_link`), `app/services/game_shell_access.rb`
  (wording only), views `game_shell/_title_status.html.erb`, `about.html.erb`, `briefing.html.erb`,
  `operations.html.erb`, `events/show.html.erb:264`, the matching tests.
- **Build:**
  - Outside desktop app mode: render the `web` form (today's "View plans", "Get the full game" to
    `plans_path`, "Subscribe to play", the plan note) and the `play` form. In the `play` form a
    signed-in player gets a `data-play-buy` button "Buy the full game" with a `data-play-price` slot
    and the note "Unlock the full game with a one-off purchase"; **a guest gets "Sign in to buy"**
    (`data-play-sign-in`, to the sign-in page) and never a buy button. Without
    `@event.play_product_id` the `play` form says "Full game only" with no button.
  - Wording in the `play` form: the guest status line names the free operations as the demo; a
    signed-in free player gets a variant of the free-access explanation that does not mention plans
    (`game_shell_access.rb:45-78`).
  - Desktop app mode, by `app_client.store`: `steam` sends every buy prompt to `events.store_url`
    in both editions. **This changes Steam output on purpose**: today the full edition shows "Plan
    needed" and the plan note, which breaks the owner's rule that every buy prompt goes to the
    platform's own purchase. `web` (future build) sends them to the plans page as an absolute link
    that opens the system browser (the `gs_hacktivity_link` app path, `game_shell_helper.rb:82-84`);
    the scope guard keeps refusing the plans page inside the window. No `store_url` on a Steam
    event: no link, "Full game only".
  - `gs_hacktivity_link` links get `data-outside`.
- **Tests (Minitest):** browser request renders both forms with the right `data-store-only`; the
  `play` form has no `plans_path` link; a guest's `play` form has no `data-play-buy`; no button
  without `play_product_id`; full-access players (subscriber, org member, Steam or Play
  entitlement) see no buy prompt in any form; Steam UA full and demo editions both get
  `store_url` (update the existing app-mode tests that expect "Plan needed"); `store=web` UA gets
  the absolute plans link with `target="_blank"`.
- **Proof:** dev :3000 Playwright with the stub. Free account in play-app: Operations and a locked
  briefing show the Buy area, no "View plans". Signed out in play-app: "Sign in to buy". Same free
  account without the marker: "View plans". Steam desktop app (demo and full) against :3000 on a
  locked operation: the store link, opened in the system browser. Sign-in in play-app goes through
  the MFA set-up page for a user without an authenticator (outside desktop app mode
  `after_sign_in_path_for` does that, `application_controller.rb:44-63`); expected, and it stays in
  the app.

### P3. Hacktivity: Digital Asset Links

- **Repo/files:** Hacktivity `config/routes.rb` (`get "/.well-known/assetlinks.json"`),
  `app/controllers/asset_links_controller.rb` (new), credentials `android_apps:` (list of
  `{package, app_key, sha256_cert_fingerprints}`), which also feeds the `hacktivity-play-packages`
  meta.
- **Build:** inherit `ActionController::Base` (no Devise, session, app-mode guard or CSRF);
  `application/json`, 200, no redirect, `Cache-Control: public, max-age=3600`; empty config renders
  `[]`. Development can add the dev keystore fingerprint from an env var.
- **Tests:** body shape, status, content type, no `Set-Cookie`, works with the desktop UA token,
  empty config.
- **Proof:** `curl -i http://localhost:3000/.well-known/assetlinks.json`. After deploy (O7): the
  same on `https://hacktivity.co.uk`, Google's Statement List tester
  (`https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://hacktivity.co.uk&relation=delegate_permission/common.handle_all_urls`),
  and Cloudflare neither challenges, redirects nor caches a 404 for the path (a cache-bypass rule or
  a purge after deploy).

### P4. Hacktivity: Google Play client and fake

- **Repo/files:** Hacktivity `Gemfile` (`gem "jwt", "~> 2.5"`: already locked at 2.5.0 through
  `oauth2` and the vendored Azure gem, so no install change, but billing must not depend on them),
  `app/services/google_play/client.rb`, `google_play/fake_client.rb`, `google_play.rb`,
  `config/initializers/google_play.rb`; credentials `google_play: { package_name:,
  service_account_json:, account_hmac_key: }`; `config/initializers/filter_parameter_logging.rb`
  (`purchase_token`).
- **Build:** no Google gems (Hacktivity runs Ruby 2.7.0). RS256 JWT with `jwt`, exchanged at
  Google's OAuth token endpoint for the `androidpublisher` scope, cached until expiry. Three calls
  with `httparty`: `purchases.products.get`, `purchases.products.acknowledge`,
  `purchases.voidedpurchases.list` (paged, `startTime`/`endTime`, about 30 days kept). Value objects
  carry purchase state, acknowledgement state, consumption state, order id, product id, purchase
  type (test, promo), purchase time, obfuscated account id if any. Typed errors: "not found"
  (400/404/410) and "try later" (5xx, timeouts); "already acknowledged" is success. The fake
  answers by token prefix (`fake-ok-…`, `fake-pending-…`, `fake-cancelled-…`,
  `fake-wrong-product-…`, `fake-promo-…` with no order id) and has an in-memory void list. The fake
  is chosen only in development and test; production boot raises if it is configured.
- **Verify** before relying on it: whether `purchases.products.get` still answers for one-time
  products created under the 2025 purchase-options model, or `purchases.productsv2` is needed
  (decide before O3).
- **Tests:** `test/services/google_play/client_test.rb` (webmock: URLs, auth header, parsing, error
  mapping, token caching, "already acknowledged"); `fake_client_test.rb`; production refuses the
  fake.
- **Proof:** `bin/rails runner` in development calling each fake method; the real client against
  webmock only, until O4.

### P5. Play-app navigation

- **Repo/files:** BreakEscape `public/break_escape/js/client-platform.js`. Built with the native hand-off (hacktivity-android `native/OpenOutsideActivity.java`, see its README) and
  small Hacktivity changes (AppEntry keeps `v`, `hacktivity-outside-hosts` meta, purchase links tagged
  `data-store-only="web"`). Sign-out from the shell lands on `/`, which the landing guard returns to
  `homeUrl()`, so a signed-out player in the Play app arrives at the in-app sign-in page, not the title
  screen. The owner accepted that. `after_sign_out_path_for` stays as it is.
- **Build (play-app only):** one click handler on `document` that sends a navigation to
  `openOutside()` when the link has `data-outside`, `target="_blank"`, or a same-origin path that
  doesn't match the stored `appPaths`. It skips `data-method`/`data-remote` links and forms
  (`button_to`, such as the shell's sign-out, `game_shell/title.html.erb:52`). `openOutside()` uses
  the mechanism P0 chose, always with `noopener`. Landing guard: a play-app page outside `appPaths`
  replaces itself with `homeUrl()`, at most twice a minute per tab. Sign-in form: tick remember-me
  (the server forces it only for the desktop UA). The engine walkthrough (`ui/game-menu.js:52`) and
  the VM console link (`minigames/vm-launcher/vm-launcher-minigame.js:417`) go through
  `openOutside()` only when their URL is off-site; the same-origin VM console stays in the app.
- **Tests:** node tests with the real `AppPaths` JSON captured from P2a (a fixture regenerated by a
  rake task, so it can't drift): a real `vnc_console` URL, start, briefing and sign-in stay; plans,
  `/users/edit`, scoreboards and another event leave; rails-ujs links and forms are skipped; the
  loop guard; browser and desktop-app are untouched.
- **Proof:** dev :3000 Playwright with the stub and a test hook recording `openOutside` calls:
  Agent file, event scoreboard and Terms call it instead of navigating; the briefing's Start and a
  VM console URL navigate in place; sign out from the title menu lands on the title screen; sign-in
  persists after closing and reopening the page. The real outbound behaviour is proven in P10.

### P6. Hacktivity: purchase intents, claim and restore API

- **Repo/files:** Hacktivity migration `play_purchase_intents` (`user_id`, `event_id`,
  `created_at`, `expires_at`, `fulfilled_at`, `order_id`), `app/models/play_purchase_intent.rb`,
  `config/routes.rb`, `app/controllers/play_purchases_controller.rb`,
  `app/services/google_play/purchase_claim.rb`, `app/policies/play_purchase_policy.rb` (Pundit;
  `verify_authorized` runs after every action, `application_controller.rb:17`),
  `config/initializers/rack_attack.rb`, `app/jobs/google_play_acknowledge_job.rb`.
- **Endpoints** (signed-in, JSON, `X-CSRF-Token`; 401 JSON when signed out):
  - `POST /play_purchases/intents {event_id}`: before the payment sheet opens. Creates an intent
    for the current user, valid 30 minutes; returns its id. Refused if the user already has the
    game by any route (nothing to buy).
  - `POST /play_purchases {event_id, product_id, purchase_token, intent_id?, consent?, client}`:
    1. The event's `play_product_id` equals `product_id`, else 422.
    2. `client.get`. Not found: 422 `invalid`. Pending: 202 `pending`, no row. Cancelled: 422.
    3. If Google returns an obfuscated account id, it must equal the HMAC of the user id, else 409
       (whether it can be set at all is **verify**, open question 2).
    4. Existing `google_play` row for this `source_ref` (order id, or `token:<sha256>` when Google
       gives none, as for promo codes): same user and live, 200 `owned`; same user and revoked, 403
       `revoked`; another user, 409 `claimed_elsewhere` with no detail about that account.
    5. Who may claim a token with no row yet:
       - with `intent_id`: the intent must be the current user's, unexpired, unfulfilled and for
         this event; it is marked fulfilled with the order id;
       - without one (restore): if another user holds an unfulfilled intent for this event created
         in the 30 minutes before Google's purchase time, 409 `claimed_elsewhere`; if the current
         user holds one, claim; otherwise answer 200 `unowned` and claim only when the request
         repeats with `consent: true` (the page asks first, P7).
    6. Create the row: `metadata` = `{purchase_token, token_sha256, product_id, purchase_time,
       purchase_type, client, intent_id, acknowledged_at: nil}`. Rescue `RecordNotUnique` and the
       model's uniqueness `RecordInvalid` (buy and restore can race), re-read and answer as in step 4.
    7. The user already holds a live `google_play` row for the event (a second real order, from
       another Google account): answer 200 `already_owned`, log it, don't acknowledge. Google
       refunds it after 3 days; the page says so.
    8. Acknowledge after the row is saved (skip if `acknowledgementState` is already 1); on success
       stamp `acknowledged_at`; on "try later" enqueue the job and still answer 200 `granted`.
       Whether Digital Goods v2 still acknowledges on the client is **verify**; the server path
       works either way.
- **Rate limits:** rack-attack `play_purchases/ip` (10 a minute) and per user keyed on
  `req.env['warden']&.user&.id` (20 an hour); there is no per-user throttle to copy
  (`rack_attack.rb:176-191` are commented out).
- **Tests (Minitest, fake client):** intent created and refused when already playable; granted
  with intent; intent of another user, expired or fulfilled refused; replay by the same user
  (owned); another account (409, no row); restore without intent: `unowned` then granted with
  consent; restore blocked by another user's recent intent; pending; cancelled; wrong product; no
  product id; promo token (hash `source_ref`); signed out; missing CSRF token; revoked; concurrent
  insert (stub the insert to raise `RecordNotUnique`); `already_owned` not acknowledged;
  acknowledge failure (row kept, job enqueued); rate limit; `client: "browser"` gets the same
  answers. **Account-wide access:** after a grant, `EventAccess#route` is `:entitlement`, the shell
  in a plain browser shows the full game, and with the Steam UA too; a user with a `steam` row is
  playable with the Play marker.
- **Proof:** dev :3000, signed in through the browser; `curl` with the cookie jar and the page's
  CSRF token: create an intent, post `fake-ok-1` with it (200, title says "Full game"), repeat
  (owned), a second account posts `fake-ok-1` (409); `fake-ok-2` without intent (unowned, then
  granted with consent). Show the rows in `bin/rails runner`.

### P7. Client purchase and restore

- **Repo/files:** BreakEscape `public/break_escape/js/client-platform.js` (or a sibling
  `client-purchase.js` loaded with it); Hacktivity views from P2b only if the markup needs a tweak.
- **Build:** `buy(el)` by store: `web` and `steam` follow the link the server rendered; `play`:
  refuse without `hacktivity-signed-in`; `getDetails([productId])` fills every `data-play-price`;
  on click create the intent (P6), then
  `new PaymentRequest([{supportedMethods: 'https://play.google.com/billing', data: {sku: productId}}], {total: …})`
  (`total` is still required), `show()`, `response.complete('success')`, POST
  `response.details.purchaseToken` (v2 name, **verify**) with the intent id. On `granted`/`owned`
  reload; `pending`: "Purchase pending: it unlocks when Google confirms it"; `already_owned`: "You
  already own the full game; this extra purchase will be refunded automatically";
  `claimed_elsewhere`: "This purchase is linked to a different Hacktivity account. Contact support
  to move it." Never consume. If `getDigitalGoodsService` rejects (sideloaded build, a phone whose
  browser can't run a TWA so the app fell back to a Custom Tab, desktop Chrome with a forged
  marker): "Purchases aren't available in this browser."
- **Restore**, once per launch for a signed-in play-app player: `listPurchases()`, POST each token
  this tab hasn't sent (hashes in `sessionStorage`). On `unowned`, ask "There's a Licence to Hack
  purchase on this Google account that isn't linked to a Hacktivity account. Unlock it for
  <handle>?" and repost with `consent: true` on yes. Show `claimed_elsewhere` once per launch.
- **Test hook:** with the `hacktivity-test-hooks` meta, `window.__hacktivityFakeDigitalGoods` (set
  by a test or `?fake_play_billing=1` in development) replaces both APIs: price "£14.99", tokens
  `fake-ok-<n>`, a configurable `listPurchases`. Ignored without the meta; the meta never renders in
  production.
- **Tests (`bin/test-js`):** price fills; guest refused; intent then token POST with CSRF header;
  each server answer's message; rejecting service shows the unavailable line; restore posts only
  unsent tokens, once, asks before claiming an unowned one; web and steam never touch Digital
  Goods.
- **Proof:** dev :3000 Playwright with the fake on. Free account: locked operation shows "Buy the
  full game £14.99"; buy; reload shows the full game; start the operation (engine loads); the same
  account in a plain browser context (no marker) also has the full game. `revoke!` in
  `bin/rails runner`, reload: demo again. `fake-pending-1` shows the pending line. A fresh tab with
  `listPurchases` returning `fake-ok-2` asks, then restores. Signed out: no buy button.

### P8. Voided poll, acknowledge sweep, support move

- **Repo/files:** Hacktivity `app/jobs/google_play_voided_purchases_job.rb`,
  `app/jobs/google_play_acknowledge_job.rb` (scheduled sweep), `config/resque-schedule.yml` (daily
  poll, hourly sweep), a settings key for the last poll time, and the admin user page's entitlement
  list (`admin/event_entitlements`, `routes.rb:76`) gaining "Move to user" for `google_play` rows.
- **Build:** the poll asks for voids since the last successful poll minus a day of overlap, matches
  by order id then token hash, `revoke!`s and writes `metadata.voided` (reason, source, time);
  unknown tokens are logged and skipped. The sweep acknowledges rows with `acknowledged_at` nil
  whose **Google purchase time** is under 3 days old, and logs at error any that reach 2 days.
  "Move to user" reassigns the row's `user_id` with an audit note in `metadata` (who, when, from,
  to), refusing if the target already has a live `google_play` row. Support never moves a purchase
  by revoke and `grant`: a `grant` row would survive a later refund.
- **Tests:** poll revokes the match, is idempotent, skips unknown tokens, keeps the overlap; sweep
  uses purchase time, skips old rows, logs the 2-day alert; move reassigns, audits, refuses a
  duplicate, and a later void of the moved row revokes it.
- **Proof:** dev: grant through P7's fake flow, add the token to the fake void list,
  `bin/rails runner 'GooglePlayVoidedPurchasesJob.perform_now'`, reload: demo again. Move a row in
  the admin page between two accounts and show the shell for both. `resque-scheduler` lists both
  schedules.

### P9. Wrapper config (hacktivity-android)

Start once the scaffold agent has made its first commit; read its README first.

- **Repo/files:** `hacktivity-android/games/licence-to-hack/twa-manifest.json`,
  `scripts/build.js`, `README.md`.
- **Build:** `startUrl` `/app/licence-to-hack?source=play&v=<appVersionCode>`; Bubblewrap's
  `"features": {"playBilling": {"enabled": true}}` (**verify** for 1.27.0, and whether
  `"alphaDependencies": {"enabled": true}` is still needed). Narrow the generated `autoVerify` VIEW
  filter in `app/src/main/AndroidManifest.xml` to `android:pathPrefix="/app/licence-to-hack"`
  (today it claims every `https://hacktivity.co.uk` link on the phone): apply the patch after
  `bubblewrap update`, run Gradle directly instead of `bubblewrap build` (which regenerates the
  project when `twa-manifest.json` changes), and fail the build if the built manifest still has a
  host-wide filter. Keep P0's result in mind: if the outbound mechanism doesn't need the narrowed
  filter, narrow it anyway so emailed links open in the browser. Make `--debug-host` work for
  `http://localhost:3000` with `adb reverse tcp:3000 tcp:3000` (localhost is a secure context,
  which Payment Request needs; `10.0.2.2` is not). Orientation stays `landscape` as the scaffold
  has it. README: emulator image with Google Play, `adb reverse`, Chrome's command-line file with
  `--disable-digital-asset-link-verification-for-url="http://localhost:3000"`, `chrome://inspect`.
- **Tests:** node test for the manifest patch and the host-wide-filter check.
- **Proof:** debug APK on the emulator opens fullscreen on the dev title screen;
  `adb shell pm get-app-links uk.co.hacktivity.licencetohack` shows the narrowed filter;
  `adb shell am start -a android.intent.action.VIEW -d https://hacktivity.co.uk/pricing` opens
  Chrome, not the app. `git status` in `hacktivity-android` is clean (`build/` is ignored, and holds
  signed APKs and an AAB).

### P10. Emulator end to end

- **Repo/files:** none planned; fixes go to the package that owns the code.
- **Run:** debug TWA from P9 against :3000 with P1–P9 merged and fake billing on. Report with
  screenshots: both attributes play-app/play via `chrome://inspect`, and which detection signal
  matched (referrer or Digital Goods); sign-up page (reCAPTCHA may need a test key in development);
  sign-in with emailed token and the MFA set-up page; title, operations, briefing; a browser-only
  mission started, left and debriefed; links out (Agent file, scoreboard, walkthrough) open by P0's
  mechanism and the Chrome tab is browser/web; buy, pending, restore with consent,
  claimed-elsewhere, signed-out "Sign in to buy"; the out-of-scope landing returns to the title;
  force-stop from recents and resume (does `sessionStorage` survive, and if not does the app reopen
  at the start URL? open question 5); the system Back button inside a mission (likely the first
  touch finding; fix as found, per the owner); landscape on a phone profile (about 850×390 CSS px)
  and a tablet profile. Also the Steam desktop app and a plain browser after these changes: buy
  prompts as P2b says, nothing else changed.

### P11a. Hacktivity: account deletion that anonymises and keeps every record

**Owner answers (2026-10-27), these override anything below:** the owner checks production for
existing `deleted<digits>` usernames before the reservation rule ships (give them the exact
command); a deleted account **keeps counting as an organisation seat** until an admin removes it;
`events.eligible_emails` and `contacts.email` are **not rewritten** (the "no linked row keeps the old
email" test covers rows linked by user id only).

Owner spec (2026-10-27): deleting an account removes the personal data on the user row and keeps
**every** linked record (entitlements, games, scores, results, feedback with its text, team and
organisation memberships, invitations, email logs, everything with a `user_id`). Nothing linked is
destroyed or detached. Every deletion works this way. The account can never be used again. Today a
buyer can't delete at all: `has_many :event_entitlements, dependent: :restrict_with_error`
(Hacktivity `app/models/user.rb:33`) makes `RegistrationsController#destroy`
(`app/controllers/registrations_controller.rb:66-78`) answer "could not be deleted … contact
support". Play requires deletion from the app and from the web, so this lands before P11. No
dependency on the other packages; any wave.

- **Repo/files:** Hacktivity migration adding `users.deleted_at`; `app/services/user_anonymiser.rb`
  (new); `app/models/user.rb` (`deleted?`, `active_for_authentication?`,
  `inactive_message`, `send_reset_password_instructions` and confirmation sends that do nothing for
  a deleted user, a handle validation that reserves the `deleted<digits>` pattern);
  `app/controllers/registrations_controller.rb#destroy` (calls the anonymiser instead of
  `resource.destroy`, then signs out as now); the admin user page ("Deleted" and the date);
  `test/services/user_anonymiser_test.rb`, `test/controllers/registrations_controller_test.rb`,
  `test/integration/account_deletion_test.rb` (new).
- **The user row** (columns from `db/schema.rb` `create_table "users"`):

  | Column | After deletion | Why |
  |---|---|---|
  | `email` | `deleted<id>@<original domain>` | Owner's pattern; the id keeps the unique `index_users_on_email` working when two people from one domain delete, and the domain keeps per-organisation counts. Passes `URI::MailTo::EMAIL_REGEXP` |
  | `handle` | `deleted<id>` | Owner's pattern ("deleted011"). Fits the validations (`/\A[A-Za-z][-A-Za-z0-9.&_ ]*\z/`, presence, at most 25 characters, unique ignoring case, `user.rb:94-97`). New validation: no live account may take a handle matching `/\Adeleted\d+\z/i`; the package first checks production for existing handles of that shape and reports them to the owner |
  | `name` | `Deleted agent` | Required and format-checked (`user.rb:94-95`); the old name must not stay. `to_s`-style displays (`user.rb:241`) then show nothing personal |
  | `unconfirmed_email`, `studentid`, `current_sign_in_ip`, `last_sign_in_ip` | `nil` | Identifying |
  | `steam_id`, `steam_persona_name`, `steam_linked_at` | `nil` | Unlinks Steam (the partial unique index allows nulls); the `steam` entitlement rows stay |
  | `encrypted_password` | Devise digest of a random 64-byte secret nobody keeps | Password sign-in impossible |
  | `otp_secret_key`, `otp_module` | new random secret not shown to anyone; module left as it was | Authenticator codes from the old secret fail |
  | `session_token` | rotated (`SecureRandom.hex`) | Hacktivity folds it into the authenticatable salt (`user.rb:233-237`), so every existing session and remember cookie stops working |
  | `remember_created_at`, `reset_password_token`, `reset_password_sent_at`, `confirmation_token`, `invitation_token` | `nil` | No outstanding token can be redeemed |
  | `confirmed_at` | set if blank | No confirmation mail is ever sent to the new address |
  | `deleted_at` | now | The marker every guard reads |
  | `role`, `org_id`, `avatar`, `stripe_customer_id`, `invited_by_*`, `utm_*`, counters, email-schedule fields | unchanged | Not personal on their own, or needed for records and accounting |

  Play has no account link on the user row (the Play purchase lives only in `event_entitlements`),
  and Hacktivity has no API or OAuth token columns (Azure sign-in is commented out,
  `user.rb:30`); if either appears later, the classification test below fails until it is handled.
- **Why sign-in can't come back:** the address `deleted<id>@<domain>` may be a real mailbox at a
  real domain, so a password reset sent there could revive the account. Three guards stop that:
  `active_for_authentication?` is false when `deleted_at` is set (Devise refuses every sign-in,
  including remember-me, with a "This account has been deleted" message);
  `send_reset_password_instructions` and the confirmation and unlock sends return without sending
  for a deleted user (and the passwords controller answers as it does for an unknown address, so it
  reveals nothing); and the rotated `session_token` and scrambled password and OTP secret mean that
  even a code path that skipped the guard would have nothing valid to check against.
- **Linked rows: all kept, copies of identifiers overwritten.** Every row stays with the same
  `user_id`. Where a linked row stores its own copy of the old email or name, that copy is
  overwritten with the new value instead of the row being touched otherwise:
  - `pending_invitations.email` (user's own invitations): old email → new email;
  - `subscriptions.checkout_email` (polymorphic `subscribable`): old email → new email;
  - `events.eligible_emails` (text list) on events the user is linked to: the old address replaced
    by the new one in place;
  - `event_entitlements.metadata` `persona` (Steam persona name copy): replaced with the new handle;
  - any other text or jsonb column in a linked row found by the scan test below.
  Kept unchanged: `feedbacks` including their free text (owner), `results`, Break Escape `games`
  (polymorphic `player`) and `break_escape_preference`, `vm_sets` (a held set is relinquished
  through the existing path first, so it is freed but the row stays), `streaks`, `memberships`,
  `events_users`, org membership and role, `email_opens`, `email_unsubscriptions`,
  `announcement_deliveries`, `event_entitlements`, `subscriptions`. An active Stripe subscription
  is handled as the current delete flow handles it; the package checks that path and keeps its guard
  (a deleted account must not go on being charged).
- **Hard destroy:** `User#destroy` is no longer reachable from the account page. The
  `restrict_with_error` on entitlements stays as a guard for any admin or console destroy.
- **Tests (required, Minitest):**
  1. **Every association keeps its rows.** The test builds the list from
     `User.reflect_on_all_associations` plus every table in `db/schema.rb` with a `user_id` column
     or a polymorphic pointer to `User` (`subscriptions.subscribable`, Break Escape
     `games.player`, `player_preferences.player`, `invited_by`), compares it with a classification
     constant in the test, and **fails if a new association or table is not classified**. For a
     user with at least one row in every one of them, the count per association and per table is
     equal before and after deletion, and the `user_id` (or polymorphic pointer) is unchanged.
  2. Email equals `"deleted#{user.id}@#{old_domain}"` and handle equals `"deleted#{user.id}"`,
     exactly.
  3. No personal field keeps its old value: `email`, `handle`, `name`, `unconfirmed_email`,
     `studentid`, both sign-in IPs, `steam_id`, `steam_persona_name`, `encrypted_password`,
     `otp_secret_key`, `session_token`, `reset_password_token`, `confirmation_token`,
     `invitation_token`, `remember_created_at`.
  4. Afterwards these all fail: password sign-in with the old password; password reset requested
     for the old and the new address (no mail delivered, no token stored); an OTP code from the old
     secret; a request carrying the old remember-me cookie; a request with the old session cookie.
  5. A second user from the same domain deletes too: both rows valid, distinct emails.
  6. Deleting twice changes nothing the second time; a user can't delete another user (the
     registrations route acts on `current_user` only; a crafted request for another id does
     nothing); a delete without the CSRF token is refused; signed out, the route redirects to
     sign-in.
  7. A user holding `steam`, `google_play`, `grant` and `playtest` entitlements can delete (no
     `restrict_with_error` message); the rows stay; `EventAccess` gives nobody else access from
     them, and the deleted user can't sign in to use them; P8's voided poll still revokes the kept
     `google_play` row by order id.
  8. Scoreboards and results (event scoreboard, the game shell leaderboard via `gs_player_name`,
     mission scoreboard) show `deleted<id>`, never the old handle or name.
  9. **Old email nowhere:** after deletion, a scan of every string, text and jsonb column of the
     user row and of every linked row from test 1 (and of `events.eligible_emails` for linked
     events) finds no occurrence of the old email address.
- **Proof (live, dev server :3000):** create a throwaway user for the purpose (sign up, confirm via
  letter_opener, sign in with the emailed token), give it a seeded `google_play` entitlement, a
  result and a feedback; record row counts with `bin/rails runner`; delete the account from
  `/users/edit`; show the counts unchanged, the new email and handle, the leaderboard showing
  `deleted<id>`, sign-in and password reset with the old address failing, and a fresh sign-up with
  the old address succeeding. Touch no other dev data; ask the owner before deleting anything else.

### P11. Internal track with licence testers (owner-gated)

Needs P10, P11a and O1–O5. Upload a release build signed with the upload key; add the Play App
Signing fingerprint to `android_apps` (P3); create the in-app product; set
`events.play_product_id`; add the service account credentials. On a phone installed from Play:
verified TWA (no URL bar); the real price; a purchase with the always-approves test card; the slow
test card (pending, completes later, restore picks it up); the declining card; a refund from Play
Console followed by the voided poll; acknowledgement visible in Play Console; reinstall and
restore; a second Hacktivity account on the same Google account (409 and the support line, then
P8's move); the purchase playing on the website and in the Steam desktop app; a Steam-entitled
account getting the full game in the Play app; whether Google records an obfuscated account id.

### P12. Store listing and policy (owner with an agent)

Store listing, content rating questionnaire (Cyber Security with hacking themes), Data safety form
(VM console traffic, GA4 through `Ga4Service`), target audience, the account deletion link (the app
opens the main site's account page outside), whether an offline page is still required for TWAs
(**verify**; if so, a small service worker on the start URL in Hacktivity), and the anti-steering
rules against the links the app opens outside. **Cross-platform purchases:** verify Play's rules on
apps that unlock content bought elsewhere (Play's multi-platform and "consumption-only" provisions)
and Steam's rules on a Steam game honouring purchases made outside Steam, since access is
account-wide in both directions; record what each allows and any wording the store pages need.

### P13. Real-time developer notifications (later)

Cloud Pub/Sub topic, push subscription to `POST /webhooks/google_play` on the main host, OIDC token
check, one-time product purchased/cancelled and (if sent) voids; the daily poll stays as a backstop.
Picks up pending purchases that complete while the app is closed (without it they are claimed on
the next launch, or refunded if the player doesn't return within 3 days). Needs a Google Cloud
project.

## 3. Testing billing without a Play account

| Layer | Fake | Where | What it proves |
|---|---|---|---|
| Page | `window.__hacktivityFakeDigitalGoods` (`getDetails`, Payment Request result, `listPurchases`) | P7, behind the `hacktivity-test-hooks` meta (development and test only) | Prompt states, price, intent and token POSTs, every server answer's message, restore with consent |
| Detection | `addInitScript` stub of `getDigitalGoodsService` | P1, P2a, P2b, P5 proofs | The play-app path in Chromium without a TWA |
| Server | `GooglePlay::FakeClient`, outcome by token prefix, in-memory void list | P4, refused in production | Claim and binding rules, idempotency, races, acknowledge retry, voids, support move |
| HTTP | webmock stubs of Google's token, get, acknowledge and voided endpoints | P4 tests | The real client's requests and error mapping |
| Device | Debug TWA against :3000 with the page fake | P0, P10 | Referrer detection, links out, layout and flow inside a real TWA |

Only Play's internal (or closed) track with licence testers can test: the real Digital Goods
service and its price, Play's purchase sheet, real tokens and order ids, pending and declined test
cards, acknowledgement as Google sees it (and the 3-day refund if it fails), refunds and the voided
list, the TWA verified with the Play App Signing key, `listPurchases` after reinstall, and whether
an obfuscated account id is recorded. Licence testers are added in Play Console and are not charged.

## 4. Security and abuse

- **Access can't be gained by faking the platform.** Access is account-wide and read by
  `EventAccess`, which never sees the platform. The client's platform reaches the server only as
  the `source=play` marker (passed through redirects and `store_location_for`), the logged `client`
  field, and the choice of markup. A forged marker in a desktop browser shows a Buy area that says
  purchases aren't available in this browser. The endpoint trusts only Google's answer for the
  token. P6 tests send `client: "browser"` and expect the same answers.
- **Token replay.** The unique `(source, source_ref)` index with the order id (or token hash) makes
  a second claim a no-op for the same user and a refusal for another. Never consume.
- **Binding the purchase to the buyer.** The intent record names the Hacktivity user who pressed
  Buy before the sheet opens; a claim with an intent must come from that user. Restore without an
  intent is refused when another user's intent covers the purchase time, and otherwise needs the
  player's consent. If an obfuscated account id can be set (**verify**), it is an HMAC of the user
  id with a credentials key and must match.
- **Guests can't buy.** The `play` form shows guests "Sign in to buy"; `buy()` refuses without the
  signed-in meta; the intent endpoint needs a session.
- **Bought on one account, claimed on another.** 409 `claimed_elsewhere`, with no detail about the
  other account. Support moves the `google_play` row with P8's admin action (reassign `user_id`,
  audited), never revoke and `grant`, so a later refund still revokes it.
- **Races.** Buy and restore can post the same token together: rescue both uniqueness errors and
  re-read (P6).
- **A second order by the same Hacktivity user** (another Google account) is answered
  `already_owned`, logged and left unacknowledged, so Google refunds it.
- **Refunds and chargebacks.** Daily voided poll revokes; progress and results stay, the missions
  lock again.
- **Acknowledgement.** The sweep counts from Google's purchase time, not `granted_at`, so a pending
  purchase or late restore is acknowledged in time; an alert fires at 2 days.
- **Stolen tokens.** Long secrets held by the buyer's device; rate limits cap probing; the intent
  and consent rules stop silent claims.
- **CSRF.** `protect_from_forgery with: :exception` (`application_controller.rb:10`); the page sends
  `X-CSRF-Token` from `csrf_meta_tags` (both layouts have it). The endpoints are in Hacktivity, not
  the engine (engine controllers skip the host's before_actions). Pundit `authorize` on each
  action.
- **Secrets.** Service-account JSON, package name and HMAC key in Rails credentials only;
  `purchase_token` filtered; logs show the token hash.
- **Fakes in production.** The fake client raises at production boot; the page fake needs a meta
  production never renders.
- **Asset links and intent filter.** Only our package and fingerprints, served without cookies or
  redirects; the narrowed filter stops the app catching unrelated Hacktivity links.

## 5. What blocks on the owner

| Item | Needed for | Can be done before it |
|---|---|---|
| O1. Play Console organisation account (D-U-N-S first, which can take a couple of weeks) | P11, P12, product creation | P0–P10 |
| O2. Upload key: who generates it, where the backup lives; enrol in Play App Signing | First upload (P11); its fingerprint and the signing key's go in `android_apps` | Dev keystore covers P0, P9, P10 |
| O3. Product id and price (working figure £14.99), after P4's check of the one-time product model | Play Console product, `events.play_product_id` | Fake product id in development |
| O4. Service account with Play Console access: get and acknowledge orders, and view financial data for voided purchases (permission names **verify**); JSON key into credentials | Real `GooglePlay::Client` (P11) | Fake client, webmock tests |
| O5. Licence tester accounts | P11 | — |
| O6. Go-ahead for each Hacktivity package (standing rule) | P2a, P2b, P3, P4, P6, P8, P11a | P0, P1, P5, P7 (engine side), P9 |
| O7. Deploy Hacktivity with P3; Cloudflare serves `assetlinks.json` cleanly | P11 verification | Local curl |
| O8. Account deletion: decided (every deletion anonymises, keeps all records, P11a); rename any existing `deleted<digits>` handle | P11a, therefore P11 | P0–P10 |
| O9. Google Cloud project | P13 only | Daily poll covers refunds |

Everything up to P10 can be finished, merged and deployed before O1. Deploying P1, P2a, P5 and P7
changes nothing a website or Steam player sees, since nobody outside the Play app has the marker.
P2b does change the Steam app's buy prompts on purpose (section P2b).

## 6. Open questions

1. **Existing `deleted<digits>` handles.** If a live account already has a handle of that shape,
   it would block the new reserved pattern. Recommendation: P11a checks production first and the
   owner renames any match before the package ships.
2. **Obfuscated account id through Digital Goods.** Probably not available on the Payment Request
   path (**verify** in P9). Recommendation: ship with the intent and consent binding; use the id as
   an extra check if it turns out to exist.
3. **How a link leaves the TWA.** Settled by P0 before P5. Recommendation if nothing reaches Chrome
   proper: a Custom Tab, which shows a URL bar, and tell the owner.
4. **The TWA claims every hacktivity.co.uk link.** Recommendation: narrow the filter to
   `/app/licence-to-hack` in P9 regardless of P0's result, so emailed and shared links open in the
   browser.
5. **Marker lost after process death.** Test in P10. Recommendation if it happens: on any page in a
   TWA-like display mode, retry the Digital Goods call and re-mark the tab if it resolves.
6. **MFA set-up in the Play app.** A player without an authenticator goes through the MFA set-up
   page after sign-in in the Play app (as on the website), which the desktop app does not show at
   that point. Recommendation: keep it; it stays in the app and protects a paying account.
7. **Pending purchases completing while the app is closed** are claimed on the next launch, or
   refunded after 3 days if the player doesn't return. Recommendation: accept for launch; P13
   removes it.
8. **Website desktop build.** Not decided. The plan only adds the `store` field to the UA token and
   client; the build itself is a later config change in `hacktivity-desktop` plus its own `appId`.
9. **Old app builds.** Recommendation: the start URL carries `v=<versionCode>`; refuse nothing
   until there is a reason.
10. **Play and Steam policy on purchases made elsewhere, anti-steering, the account deletion route,
    the offline page.** Recommendation: P12, before production, with the owner reading the current
    policy text.
