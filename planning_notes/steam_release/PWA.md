# Installable web app (PWA) per game: feasibility and design note

Status: research note, 2026-10-27. No code changed in any repo. Read with `ANDROID.md`,
`ANDROID_PLAN.md` section 1 (the two platform fields, the page contract), `STEAM_PLAN.md` section 1,
`ACCESS_MODEL.md` and `STORE_POLICY.md`. Web facts were checked on 2026-10-27 against the pages listed
under Sources; anything marked **verify** is from a secondary source, from memory, or not testable
without a device.

## 1. Recommendation

**Do it, in a small form, after the remaining Steam launch work (S4, S14) has settled
`client-platform.js`** (the Play app's emulator end-to-end, P10, already passed on 2026-10-27). Don't do it before then. Most of the cost sits in the same
files that the Android and Steam packages are still editing (`client-platform.js`, `AppPaths`,
`ShellAuth`, the shell layout).

The form:

- **One manifest per game,** rendered from the event by one Rails route
  (`/app/<key>/manifest.webmanifest`) and linked only from that game's shell pages. No static files.
- **`id` `/app/<key>`,** fixed for good.
- **Scope per game, not `/`:** `scope` `/hacktivities/<event id>/` (trailing slash required) and
  `start_url` `/hacktivities/<event id>/play?source=pwa`. The working idea of `scope: "/"` fails
  for two reasons:
  - Since Chrome 139, desktop Chrome sends any hacktivity.co.uk link that opens in a new tab or
    window into the installed game window. That includes course links from email or Moodle, and
    the lab sheets.
  - With two games both scoped to `/`, Chrome's choice of window is arbitrary.

  Both points are shown below.
- **The mission page moves under the game's scope.** Today a mission runs at
  `/break_escape/games/<id>`, which is outside any per-game scope, so the installed app would put a
  URL bar over every mission. A host route at `/hacktivities/<event id>/play/mission/<game id>`
  renders the engine's game page. This is the one real piece of engineering.
- **Sign-in stays where it is for v1.** It shows a thin URL bar during sign-in on desktop. A sign-in
  under the scope (Devise route aliases, not a modal) is a later, optional package.
- **Android:**
  - Send installs to the Play app: `related_applications` plus `prefer_related_applications: true`
    for games that have a Play package.
  - Never offer the web install inside the Play or Steam apps.
- **No service worker in v1.** Chrome no longer needs one to install (checked headless on Chromium
  131 and 155). The owner has ruled out offline play. At most there is one optional later item: a
  plain "You're offline, reconnect to play" page, scoped to the shell (section 7).
- **The install button** goes on the shell's title screen (`beforeinstallprompt`), with short
  instructions for iOS/iPadOS and macOS Safari. It is hidden in every store app, on Android when
  the game has a Play app, and once the game is installed.

**Who gains:**

- iPhone and iPad players have no store app, and this is their only route to an app-like
  launcher.
- Desktop Chrome, Edge and macOS Safari players without Steam get their own window and icon.

**Who doesn't:**

- Android players: the Play app is better.
- Steam players.

The work is about 4 to 5 agent-days, plus the owner's device checks (section 10).

## 2. How it works per platform

| Platform | Install | Install prompt we can show | Display | Out-of-scope page (same origin, e.g. sign-in, Pricing) | Cookies and sign-in | Notes for a WebGL/Phaser game |
|---|---|---|---|---|---|---|
| Chrome / Edge desktop (Windows, macOS, Linux) | Omnibox install icon or menu, once the criteria are met (name, 192 and 512 icons, `start_url`, `display`, HTTPS, a click and 30 s on the page). No service worker needed | `beforeinstallprompt`, then `prompt()` on a click | `standalone` window. `fullscreen` isn't supported as a display mode on desktop, but the Fullscreen API works after a gesture | Stays in the app window with a title-bar strip showing the origin and a close button (**verify** the exact UI on Chrome 155). `target=_blank` to an out-of-scope page opens a browser tab | Same profile and cookies as the browser, so the player is already signed in | Since Chrome 139, links to in-scope URLs that open a new window or tab open in the app by default (user can turn this off in app settings). `launch_handler` controls which window |
| ChromeOS | As desktop Chrome | As desktop | As desktop | As desktop | Shared with the browser | Link capturing is opt-in on ChromeOS. The Play TWA can also be installed there; whether `prefer_related_applications` sends ChromeOS users to Play is **verify** |
| Android Chrome (WebAPK) | Menu "Install app" or our button; Google's server mints a WebAPK, which registers intent filters for its scope | `beforeinstallprompt`. With `prefer_related_applications: true`, Chrome's install flow goes to the Play listing instead | `fullscreen` and `orientation` honoured | WebAPK shows a minimal toolbar with the origin (**verify** on the emulator) | Shared with Chrome, and with the TWA | Not offered: Android players get the Play app (section 5) |
| Samsung Internet | Mints WebAPKs too | Its own UI | As WebAPK | As WebAPK | Own browser jar | Low priority |
| iOS / iPadOS Safari (and other iOS browsers since 16.4) | Share, then Add to Home Screen. From iOS 26 every site added opens as a web app by default ("Open as Web App" toggle) | None (no `beforeinstallprompt`): we show instructions | `standalone` only (`fullscreen` falls back to it). No status-bar hiding beyond `standalone`. Element Fullscreen API not on iPhone (**verify**), but standalone has no browser chrome anyway | Reported: an in-app browser sheet with a Done button (**verify** on a device) | **Separate cookie jar from Safari:** the player signs in again inside the app. Password manager autofill works. Emailed links (password reset, confirmation) open in Safari, so the player then signs in inside the app | Quota as a browser (WebKit storage policy; home-screen apps more likely to get `persist()`). AudioContext needs a tap to start. Heavy pages can be killed on low-memory iPhones. Phone touch readiness (ANDROID.md Q5) applies |
| macOS Safari 17+ | File, then Add to Dock (any site) | None: instructions | Own window | Out-of-scope links reported to open in the default browser (**verify**) | Cookies copied once at install, then separate | Same-path apps on one domain reported to get mixed up unless `scope` differs. Per-game scope helps |
| Firefox | Windows: "taskbar tabs" web apps since Firefox 143. Android: home-screen shortcuts, not WebAPKs | None | Simplified window (Windows) | Not checked | Browser's | Treat as unsupported for the button. Firefox users can still pin |
| Electron (Steam app) | n/a | Never shown | n/a | n/a | n/a | Detected first by UA token |
| Play TWA | n/a | Never shown | n/a | n/a | n/a | Detected by `?source=play` and referrer |

**Stripe Checkout inside an installed app:**

- **Desktop:** Checkout is on `checkout.stripe.com`, so it shows the out-of-scope strip in the app
  window. The `success_url` back on hacktivity.co.uk is in scope only if it is under the game's
  scope, which it isn't. The player lands on the website page with the strip, which is
  acceptable.
- **The alternative** is to open Pricing in a browser tab (`target=_blank` from the app window does
  that on desktop).
- **iOS:** Apple Pay inside a home-screen web app is **verify**.

The recommendation is to open Pricing in the browser from the installed app (owner question 8).

## 3. Several games on one origin: what the prototype and Chromium's code show

Prototype: `server.py`, `probe.js`, `overlap.js` and `related.js` in the scratchpad (path in the
report). It is a static server on 127.0.0.1 with two fake games ("lth" and "eh"). Each has
manifests with `scope: "/"` or `scope: "/app/<key>/"` and uses the real Licence to Hack icons. The
checks ran in headless Chromium 131 (Playwright) and 155 (snap) over CDP.

| Check | Result |
|---|---|
| `Page.getAppManifest` / `Page.getInstallabilityErrors` on each game page | Both manifests parse with no errors, and both games are installable **with no service worker** (Chromium 131 and 155) |
| Manifest linked only from a page that isn't the `start_url` (`/hacktivities/1/play` links lth, start URL `/app/lth`) | Parses and is installable. The start page needn't link the manifest. Chrome only updates the installed manifest from pages that link it, which is fine if every game page does |
| `start_url` page links no manifest at all | Still installable |
| `id` omitted | The id becomes the full start URL **including `?source=pwa`**. Always set `id` |
| Two different manifests with the **same id** (`/app/lth` wide, then `/app/lth` narrow) | The second replaced the first: after it, `PWA.launch` refused `/hacktivities/2/play` as "not in the scope of the web app /app/lth". So every page must serve exactly one manifest per game, from one route |
| Both apps installed with `scope: "/"` | Each app accepts launches at the other game's URLs and at `/pricing` and `/users/sign_in`. Nothing separates them |
| `related_applications` (play) with `prefer_related_applications: true` on desktop Chromium 155 | No installability error: desktop still installs. Android behaviour needs the emulator |
| Link capture and window chrome | **Not testable headless:** headless Chromium opens no real app windows (every page reports `display-mode: browser`), so capture and the out-of-scope strip need a visible browser or a device |

**Which app gets a navigation when scopes overlap (Chromium source,
`web_app_scope.cc` and `web_app_registrar.cc`):**

- Each app's score for a URL is the length of its scope string when the URL starts with it. So for
  nested scopes **the longest (most specific) scope wins**.
- `FindBestAppWithUrlInScope` only replaces the best app on a strictly higher score. With **equal
  scopes, the first app in the registry's iteration order wins**: in effect arbitrary from the
  player's point of view.
- Two games both scoped to `/` therefore fight over every hacktivity.co.uk URL.
- Scope matching is a plain prefix on the string (MDN). `/hacktivities/4` would also match
  `/hacktivities/41/...`, so the scope must end in `/`.

**Link capture (Chrome 139+, desktop):**

- A user-initiated navigation that opens a new top-level context goes to the installed app whose
  scope covers it. Examples: a link from email, `target=_blank` or `noopener`.
- Navigations within the same tab aren't captured.
- It is on by default for every installed PWA. Only the user can turn it off; there is no manifest
  opt-out.
- With `scope: "/"`, everything on hacktivity.co.uk the player opens that way, from any site or app,
  lands in the game window.

`scope_extensions` doesn't help:

- It adds other origins to an app, each confirmed by a
  `/.well-known/web-app-origin-association` file.
- It can't add a second path on the same origin.
- Its status in 2026 is unclear (intent to ship for desktop M138; the Chrome docs page still
  describes an origin trial).

Tabbed mode (`display_override: ["tabbed"]`) is a desktop or ChromeOS app-window feature with no
use for a game.

## 4. Narrow scope versus wide scope

### What has to stay in the app window, and where it lives today

| Page | Path today | Navigation type |
|---|---|---|
| Shell: title, operations, briefing, debrief, leaderboard, about | `/hacktivities/<id>/play/...` | Top-level |
| Start, restart, finish a mission | `POST /hacktivities/<id>/missions/<slot>/start` etc., then a 303 to the mission | Form post then redirect. Chrome judges scope on the committed URL, so the post itself doesn't matter |
| **Mission (the game)** | `/break_escape/games/<game id>` | Top-level, the main page |
| VM console, VM sets | `/hacktivities/<id>/challenges/...` (`AppPaths` lists them) | Top-level or frame |
| Engine API, assets, ink, TTS, cable | `/break_escape/...`, `/cable` | fetch or XHR: **scope doesn't apply** |
| Feedback | `/feedbacks` | fetch: n/a |
| Sign-in, token step, sign-up, password request, confirmation resend | `/users/...` | Top-level (and Devise re-renders failed posts at the post URL) |
| MFA set-up | `/hackers/setup_mfa` | Top-level |
| Sign-out | `DELETE /users/sign_out`, then a redirect to `/` | Lands on the website home |
| Pricing, Stripe Checkout, account edit and delete | `/pricing`, `checkout.stripe.com`, `/users/edit` | Should leave the app anyway |
| Lab sheets, outside links | other origins or `target=_blank` | Leave (browser tab on desktop) |
| Emailed links (password reset, confirmation) | `/users/password/edit`, `/users/confirmation` | Open in the default browser, not the app (desktop: captured only if in scope) |

### The options

| | A. `scope: "/"` (working idea) | **B. `scope: "/hacktivities/<id>/"` (recommended)** | C. `scope: "/app/<key>/"` | D. Dedicated host per game, `scope: "/"` |
|---|---|---|---|---|
| Two games | Tie: arbitrary window | Separate, no overlap | Separate | Separate origins |
| Desktop link capture of website links | **Every** hacktivity.co.uk link opened in a new window goes to the game app | Only that game's shell, mission and VM links | Only the game | Only the game host |
| Mission page | In scope | Needs an alias under `/hacktivities/<id>/play/mission/<gid>` | Needs an alias | In scope |
| Shell pages | In scope | Already in scope | All need aliases under `/app/<key>/...` (title, operations, briefing, debrief, leaderboard, about, the slot actions' redirects, `ShellAuth`'s path parser, `AppPaths`) | In scope |
| Sign-in | In scope | Out (strip shown) until aliased | Out until aliased | In scope |
| Android WebAPK | Claims the whole origin | Claims only the game | Claims only the game | Own origin |
| Cost | Smallest | Medium: one route alias with an engine URL fix, plus optional sign-in aliases | Large: the whole shell re-routed | Large: DNS, certificate, Cloudflare cache warm-up per host (about 1 GB of engine assets and audio), separate sign-in, reCAPTCHA domains, VNC relay origin, host-aware links. The owner already chose one host for Android |
| Verdict | No: wrong windows on desktop now, arbitrary with game 2 | **Yes** | No: same result as B for much more routing | Fallback if B's alias proves fragile |

`start_url` must be inside `scope`, or the browser throws the scope away and uses the start URL's
folder (MDN). Under B the start URL is the shell title, `/hacktivities/<id>/play?source=pwa`, which
works signed out. `/app/<key>` (the Play and Steam entry) stays as it is and is not part of the PWA.

### The mission page under the game's scope (B's one real job)

- Add a Hacktivity route `hacktivities/:event_id/play/mission/:id` that renders
  `BreakEscape::GamesController#show`.
- Point `GameSlotsController`'s three `redirect_to break_escape.game_path(...)` at it for Game
  events, and keep `/break_escape/games/<id>` working for old links, bookmarks and resume.
- The game page mostly writes literal `/break_escape/...` paths, which keep working.
  `vm_panel_game_path(@game)` and any other engine route helper would lose the `/break_escape`
  script name when routed from the host. Fix this with `default_url_options(script_name:
  "/break_escape")` when the request comes in through the alias, and test it.
- The engine's own controller checks run unchanged. The alias must check that the game belongs to
  that event (404 otherwise).
- The Play app's `AppPaths` already allows `/hacktivities/<id>/play(/.*)?`, so the TWA keeps the
  new URL in the app with no change. The desktop app's `AppMode` treats engine paths as pass-through
  today, but the alias is a host route, so `app_in_scope?` needs a `game_shell`-style rule for it.
- Size: one package with an Opus review. It touches every mission start.

### Sign-in: strip, aliases or modal

- **v1: accept the strip.** On desktop the out-of-scope strip shows only while the player is on the
  Devise pages, which are already drawn in the game's look (`ShellAuth`). iOS and Android show their
  own bars (**verify**). Sign-out lands on `/`; `client-platform.js` in `pwa-app` replaces `/` with
  the shell (the Play app's landing guard does the same).
- **Later: route aliases, not a modal.**
  - `devise_scope :user` routes under `/hacktivities/<id>/play/account/...` for sessions
    new/create, registrations new/create, passwords new/create, confirmations new/create, and
    `setup_mfa`. The forms' `url:` point at them.
  - `ShellAuth` already knows the event, and `after_sign_in_path_for` already returns to the shell.
  - This reuses the existing views and steps: the emailed or authenticator token step, reCAPTCHA
    and error re-renders.
- **A modal on the shell would have to rebuild that multi-step flow over JSON.** It would need
  Devise's navigational formats, the token step, reCAPTCHA in a dialog, forgotten password,
  sign-up and confirmation. That is more code and a second sign-in path to keep secure.
- **Emailed links** (password reset, confirmation) open in the browser in every option. On desktop
  that is the same cookie jar, so the player returns to the app signed in. On iOS the player signs
  in again inside the app.

## 5. Android: the Play TWA and a WebAPK side by side

- **No technical clash in verification:**
  - The TWA's Digital Asset Links tie `uk.co.hacktivity.licencetohack` to the origin; a WebAPK
    declares no asset links and can't change that.
  - The TWA's VIEW filter is `autoVerify` and narrowed to `/app/licence-to-hack`
    (`hacktivity-android/scripts/manifest-patch.js`). On Android 12+ verified links open the
    verified app directly.
  - The WebAPK registers unverified filters for its scope (`/hacktivities/<id>/` under B, so no
    overlap with `/app/licence-to-hack`).
- **Behaviour when both are installed is a verify item on the emulator.** Under B the two apps claim
  different paths. A `/hacktivities/<id>/play` link from another app would go to the WebAPK, or to
  Chrome, which may hand it to the WebAPK.
- **The real problem is the player, not the OS:** two "Licence to Hack" icons, one that sells
  through Play and one through Stripe. web.dev's own advice for a site with a native app is to give
  them different names or icons, or to steer to one.
- **Recommendation: Android players get the Play app.** For a game with a Play package, the manifest
  carries:

  ```json
  "related_applications": [{ "platform": "play", "id": "uk.co.hacktivity.licencetohack" }],
  "prefer_related_applications": true
  ```

  - Chrome on Android then sends its install flow to the Play listing (web.dev install criteria).
    Desktop is unaffected (prototype: no installability error on Chromium 155).
  - Our own button is hidden on Android for that game.
  - On the website the shell shows a "Get it on Google Play" link instead. Linking the website to
    Play is not steering inside the Play app.
  - `navigator.getInstalledRelatedApps()` (Chrome 80+ on Android) can tell the page the Play app is
    already installed, if the TWA declares the site in its asset statements. Bubblewrap does this.
- **Verify on the emulator:**
  - what Chrome's menu offers with `prefer_related_applications: true` (Play, or a plain shortcut);
  - whether Chrome Android shows its own install banner at all when the related app is installed;
  - the ChromeOS case.
- **A game with no Play app** (Eldritch Hacker at first) leaves both fields out and installs as a
  WebAPK normally.
- **The TWA itself is unaffected** by the manifest at run time. Bubblewrap read a manifest only at
  `init`, and `hacktivity-android` writes `twa-manifest.json` by hand. The shell layout would now
  link a manifest inside the TWA too. That is harmless: a TWA has no install menu, and
  `client-platform.js` hides our button in `play-app`.

## 6. Policy

- **Google Play.** The Payments policy covers "Play-distributed apps" (section 2), and a WebAPK is
  not distributed by Play.
  - Nothing found ties a developer's website PWA, or Stripe on that website, to the Play listing.
    The website already offers Stripe to Android browsers today.
  - The risks sit inside the Play app: no web install button, no Stripe and no "install the web
    app" link there. `client-platform.js` already hides web buy prompts in `play-app`, and the
    install button must use the same rule.
  - Routing Android installs to Play (section 5) keeps the two apart.
  - This is a desk reading, as in `STORE_POLICY.md`, not Google's answer.
- **Steam.** Valve's rules forbid linking a Steam build to stores without Steam Wallet
  (`STORE_POLICY.md`). An "install the web app" prompt is a route to buying on the website. So:
  - never show it in the Electron app (UA token checked first);
  - never mention the web install on the Steam store page or in the Steam build's text;
  - the website may offer the install to anyone, Steam owners included, because that is the web
    platform.
- **Apple.** A home-screen web app isn't distributed through the App Store, so App Store rules don't
  apply. Stripe on the website is unchanged.
- **Owner rule on access:** unchanged. The installed app is the website, so every route to access
  applies, and buy prompts are the web (Stripe) ones.

## 7. Service worker

**The owner has ruled out offline play:** the server checks solutions, so the game always needs a
connection. Nothing below caches pages or engine assets.

- **Installability:** none needed. Chrome's criteria list no service worker, and the prototype
  installed with none on Chromium 131 and 155.
- **v1: no service worker.** Reasons to have none at all:
  - nothing to go stale behind Cloudflare or `ASSETS_VERSION`;
  - no risk of serving a cached signed-in page after Devise sign-out, or a page with an old CSRF
    token;
  - no extra start-up cost on navigations;
  - nothing to kill-switch if it goes wrong;
  - no question of how a worker on hacktivity.co.uk affects the TWA, which shares Chrome's worker
    registrations for the origin. A worker scoped at or above `/app/` would also take the TWA's
    start URL.
- **Optional later: a plain offline page.** Without a worker, a launch with no connection shows
  Chrome's own "no internet" page inside the app window (iOS shows its own error).
  - A worker could replace that with "You're offline. Reconnect to play." and a Retry button.
  - It is worth having only if players report the bare error as confusing. It is cosmetic.
  - If done:
    - one static script served from a path with `Service-Worker-Allowed: /hacktivities/`,
      registered by the shell with scope `/hacktivities/<id>/play`, so only the game's own
      navigations pass through it;
    - a network-only `fetch` handler for navigations (with navigation preload), whose catch
      returns a single inline or cached offline page;
    - no other caching;
    - `Cache-Control: no-cache` on the script, and a Cloudflare bypass for its path;
    - a test with Playwright `context.setOffline(true)`.
  - It would not cover the TWA's `/app/<key>` start URL. The TWA's own offline question stays in
    ANDROID_PLAN P12 (Chrome's old "offline-first" TWA quality criteria; current enforcement
    **verify**).

## 8. Detection: `pwa-app` in `client-platform.js`

The two fields stay as they are. `appWindow` gains a value `pwa-app`, and `store` stays `web`.

| Order | Source | Result |
|---|---|---|
| 1 | Desktop UA token `HacktivityApp/...` | `desktop-app`, steam or web (unchanged) |
| 2 | Stored Play value in `sessionStorage` | `play-app`, `play` (unchanged) |
| 3 | `?source=play` with referrer or Digital Goods check | `play-app` (unchanged) |
| 4 | `android-app://` referrer and app display mode | `play-app` (unchanged) |
| **5 (new)** | `matchMedia('(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)')` matches, or `navigator.standalone === true` (older iOS). `?source=pwa` is stripped and stored as a hint, not a requirement, because a captured link has no marker | `pwa-app`, `web` |
| 6 | default | `browser`, `web` |

- **Electron isn't misdetected:** step 1 runs first, and Electron pages report `display-mode:
  browser`.
- **The TWA isn't misdetected:** steps 2 to 4 run first. A TWA page whose Play detection fails
  already falls to `browser`/`web` today and would show web buy prompts. `pwa-app` adds no new risk
  there, but the test suite must cover "TWA marker present, `pwa-app` never chosen".
- **On Android, require the stored `?source=pwa` marker** before choosing `pwa-app`, as an extra
  guard (Android installs are routed to Play anyway).
- `sessionStorage` is per tab, so desktop app windows each detect for themselves. The
  display-mode check makes that cheap.

What changes in `pwa-app`:

- `isAppWindow()` is true, so exits never call `window.close()` and `homeUrl()` is the shell title
  (`/hacktivities/<id>/play`). `ui/success-screen.js`, `ui/game-menu.js`,
  `ui/game-over-screen.js` and `systems/apply-actions.js` already go through `isAppWindow()`.
- Landing on `/` (after sign-out) replaces itself with `homeUrl()`. No other landing guard: Pricing
  and account pages may open.
- Pricing and buy links: the web ones (owner rule). They open in a browser tab (`target=_blank`) so
  Stripe runs in a normal browser (owner question 8).
- The install button is hidden.
- Nothing else: the shell already has no website chrome.

The server never learns it is the PWA, and needs to: no access or layout decision depends on it.
`html[data-app-window="pwa-app"]` lets CSS tweak spacing if needed.

## 9. Install UX

- **Chrome, Edge (desktop) and Android for games without a Play app:**
  - `beforeinstallprompt` is captured early (the classic script in `<head>` can do it).
    `preventDefault()` stops the mini-infobar on Android.
  - The shell title screen shows "Install the app" (`data-gs-nav`, so arrow keys reach it). A click
    calls `prompt()`.
  - On `appinstalled` the button hides, and a GA4 event goes through the existing analytics.
  - It appears only when: `appWindow` is `browser`, `store` is `web`, the event has opted in,
    the event has been captured, and (on Android) the game has no Play package.
- **iOS and iPadOS (any browser, not standalone):**
  - Show a small "Install" link that opens a dialog: tap Share, then "Add to Home Screen" (iOS 26:
    leave "Open as Web App" on).
  - Note that the player signs in again inside the app.
  - Detection: `navigator.maxTouchPoints > 1` with the Mac platform string covers iPadOS desktop
    mode; plain UA for iPhone.
- **macOS Safari 17+:** "File, then Add to Dock". Optional, same dialog.
- **Firefox:** no button.
- **Never shown in `desktop-app` or `play-app`.** It is server-rendered with
  `data-store-only="web"` and hidden by `client-platform.js`, matching the existing page contract.
  CSS default: hidden until the script shows it, so a script failure shows nothing.

## 10. Multi-game design

**Manifest route (Hacktivity).** `GET /app/:game_key/manifest.webmanifest`, which `AppManifestsController#show` handles:

- **Event lookup:** `Event.find_by(app_key:)`. Only a Game event that a signed-out visitor may see
  (`EventPolicy#show?` with a nil user) and that has opted in. Anything else returns 404.
- **No session or cookies:** browsers fetch manifests without credentials. `skip_before_action`
  for authentication and `ShellAuth` tracking, no `Set-Cookie`.
- **Headers:**
  - `Content-Type: application/manifest+json`;
  - `Cache-Control: public, max-age=3600`, so Cloudflare may cache it. It doesn't vary by user.
- **CSP:** `manifest-src` falls back to `default-src 'self' https:`, so nothing changes.
- **Body:**

```json
{
  "id": "/app/<key>",
  "name": "<event.title>",
  "short_name": "<event.app_short_name, else title without a 'SAFETYNET: ' prefix>",
  "description": "<event.description truncated>",
  "start_url": "/hacktivities/<event.id>/play?source=pwa",
  "scope": "/hacktivities/<event.id>/",
  "display": "standalone",
  "display_override": ["fullscreen", "standalone"],
  "orientation": "landscape",
  "theme_color": "<from event.game_ui_theme>",
  "background_color": "<from event.game_ui_theme>",
  "icons": [
    { "src": "<asset_path icon-192.png>", "sizes": "192x192", "type": "image/png" },
    { "src": "<asset_path icon-512.png>", "sizes": "512x512", "type": "image/png" },
    { "src": "<asset_path icon-512-maskable.png>", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "launch_handler": { "client_mode": ["focus-existing", "auto"] },
  "related_applications": [{ "platform": "play", "id": "<package, only when the game has one>" }],
  "prefer_related_applications": true
}
```

Notes on the body:

- `focus-existing` means a captured link focuses a running game window without navigating it, so
  a mission in progress is never replaced. The page may read `launchQueue` later if wanted.
- `fullscreen` in `display_override` is used on Android and ignored on desktop and iOS.
- **Icons:** `Event#game_icon_path(name)` already finds
  `app/assets/images/event_titles/<title_image>_icons/<name>`. Licence to Hack already has
  `icon-192.png`, `icon-512.png` and `icon-512-maskable.png` there (built by
  `hacktivity-desktop/docs/ICONS.md` section 4, `--web`). The controller requires all three and
  returns 404 without them.
- **Theme colours:** a small map from `game_ui_theme` to two hex colours, beside the theme list.
- **Play package:** from the existing `AndroidApps` config (`hacktivity-play-packages`).

**Link tag.** `layouts/_favicon.html.erb` (or a sibling partial in the shell layout) adds `<link
rel="manifest" href="/app/<key>/manifest.webmanifest">` when the event is opted in. That covers the
shell pages and the shell-styled sign-in pages. The mission page (engine layout) should link it too,
so Chrome refreshes the manifest from inside a mission. The engine gets the URL through the existing
Hacktivity config hook, or the alias route's controller passes it.

**Opt-in.** A boolean `events.pwa_enabled` (default false), set on the event form, beside the store
ids. It needs an `app_key` and the three icons. The form shows a warning if either is missing.
`app_short_name` is an optional string column.

**What a second game (Eldritch Hacker) needs:**

1. Set `app_key` (for example `eldritch-hacker`).
2. Build its icon set with ICONS.md into `event_titles/safetynet_eldritch_hacker_icons/`. The
   folder doesn't exist yet: the title SVG and social card do, the icons don't.
3. Tick `pwa_enabled`, and optionally set the short name.

No code, no static file. Its scope is its own event path, so it never overlaps with Licence to
Hack.

## 11. Risks

1. **The mission-page move touches every mission start.**
   - Wrong engine URL generation under the alias, or a missing ownership check, breaks or exposes
     missions for all players, not just PWA users.
   - Mitigations: keep `/break_escape/games/<id>` working; request specs for both paths; a real
     playtest through the shell on the :3000 dev server; an Opus review.
2. **Detection mistakes put the wrong buy prompts in a store app.** A `pwa-app` or `browser` result
   inside the TWA shows Stripe links, which is a Play policy problem.
   - Mitigations: keep the order in section 8; jsdom tests for every combination; the emulator
     check from ANDROID_PLAN P10 repeated with the manifest linked.
3. **Browser behaviour moves under us.** Chrome changed desktop link capturing in 139, and its
   choice between equal scopes is arbitrary. iOS changed home-screen behaviour in 26, and iOS web
   apps keep their own cookie jar.
   - Mitigations: per-game scopes avoid the ties; a device check list (section 12) at each launch.
4. **iPhone needs the phone and touch work in ANDROID.md Q5** (soft keyboard, Back, layout, memory
   with about 1 GB of assets). iPad is closer. Offering "install" on iPhone before that work is done
   promises more than the game gives.
5. **Two installs of the same game on Android** confuse players if `prefer_related_applications`
   doesn't behave as documented. Check it on the emulator before shipping.
6. **One id, one manifest:** a second route or a cached old manifest with the same id but different
   scope or name replaces the installed app's definition (prototype). One route per game, and the
   `id` never changes.
7. **Manifest updates:** changes to name and icons may ask the user to approve them in Chrome, and
   iOS never updates a home-screen icon after install (**verify**). Settle names and icons before
   enabling.

## 12. Packages

Each is about half a day for one Sonnet agent unless marked. "Proof" is the real-path check, as in
the other plans. The standing rules apply:

- ask the owner before each Hacktivity edit (Hacktivity work goes on main);
- stage explicit paths;
- no SecGen XML or VM exploit content.

```
Wave 0 (owner):     W0 decisions (section 13)
Wave 1 (parallel):  W1 manifest route + link + opt-in      W2 pwa-app detection (engine)
Wave 2:             W3 mission page under the game's scope (1 day, Opus review)
                    W4 install button and instructions (after W1, W2)
Wave 3:             W5 proofs: headless, then devices (after W1–W4)
Later, optional:    W6 sign-in under the scope     W7 offline page     W8 Eldritch Hacker opt-in
```

- **W1. Manifest route, link tag, opt-in (Hacktivity).**
  - Work: `AppManifestsController`, the route, the `pwa_enabled` and `app_short_name` migration and
    event form fields, the theme-colour map, the link partial in the shell layout.
  - Tests: request specs for fields, icons, 404 cases (not a game, hidden, not opted in, missing
    icons), no `Set-Cookie`, content type, related apps only with a package.
  - Proof: headless Chromium against :3000, where `Page.getAppManifest` shows no errors and
    `getInstallabilityErrors` is empty on the shell title (a scripted version of the scratchpad
    probe).
- **W2. `pwa-app` in `client-platform.js` (BreakEscape).**
  - Work: step 5, `?source=pwa` strip and store, `isAppWindow`, `homeUrl()` for `pwa-app`, the `/`
    landing replace, Pricing links to a new tab, `data-store-only` handling for the install button.
  - Tests: `test/js/client-platform.test.mjs` cases: desktop UA with a standalone media match stays
    `desktop-app`; Play marker with standalone stays `play-app`; standalone alone gives `pwa-app`
    (desktop) and needs the marker on Android; storage errors give `browser`.
  - Proof: Playwright with `emulateMedia` or an init script forcing the display-mode match.
- **W3. Mission page under the game's scope (Hacktivity, small engine touch). One day; Opus
  review.**
  - Work:
    - the alias route and controller wiring;
    - the event and game ownership check;
    - `script_name` for engine helpers;
    - redirects from slot start, restart and resume;
    - `AppMode#app_in_scope?` for the desktop app;
    - mission-page links back to the shell (`config/initializers/break_escape.rb`) unchanged;
    - `AppPaths` check.
  - Tests: request specs (both paths render, a wrong event gives 404, helpers produce
    `/break_escape/...`), the existing slot specs updated.
  - Proof: start, play, VM panel and finish a browser-only mission through the shell on :3000, in
    a browser and as the desktop app.
- **W4. Install button and instructions (Hacktivity view, small script).**
  - Work: the title-screen button and its states, the iOS and macOS dialog, `appinstalled` to
    GA4, hidden in store apps and on Android for Play games.
  - Tests: view spec for the markup; jsdom for the show and hide rules.
  - Proof: headless Chromium, where a synthetic `beforeinstallprompt` (dispatched by the test)
    shows the button, and it stays hidden with the desktop UA or the Play marker.
- **W5. Proofs on real platforms (agent plus owner).**
  - Desktop Chrome with a visible install: owner, or an agent on desktop 3 per the window rule.
    Check capture of a `/hacktivities/<id>/play` link, the out-of-scope strip on sign-in, and that
    Pricing opens in the browser.
  - Android emulator: `prefer_related_applications` with and without the TWA installed, and the
    TWA unaffected.
  - iPad or iPhone (owner): Add to Home Screen, sign-in inside, audio after a tap, one mission.
  - Record the results in this file.
- **W6 (optional). Sign-in under the scope.** Devise route aliases for sessions, registrations,
  passwords, confirmations and `setup_mfa`; form URLs; `ShellAuth` path parsing. Opus review,
  since it touches sign-in.
- **W7 (optional). Offline page.** As in section 7. Only if W5 or players show the bare browser
  error is a problem.
- **W8. Eldritch Hacker opt-in.** Icons (ICONS.md; image generation with the owner's go-ahead),
  `app_key`, tick the box. Needs no code.

**Total:** W1 to W5 is about 3.5 agent-days plus the owner's device time. W6 and W7 add about a day.

**Verifiable on this machine without any accounts:**

- everything in W1 to W4 against the :3000 dev server (owner permission to use it);
- manifest parsing and installability through CDP in headless Chromium 155, as the prototype did;
- the detection logic in jsdom and Playwright;
- the Android emulator checks with the debug-signed TWA from `hacktivity-android`. No Play Console
  needed, but `prefer_related_applications` sends Chrome to a Play listing that doesn't exist yet,
  so only the redirect itself can be seen.

**Needs a visible browser or a device:**

- real install and link capture (headless opens no app windows);
- iOS and macOS Safari;
- ChromeOS.

**Maintenance:**

- icons and the short name per game;
- re-check the platform table at each store launch (Chrome's capture rules, iOS releases);
- the jsdom detection tests keep the store apps safe;
- no service worker to maintain in v1.

## 13. Open questions for the owner

1. **Go-ahead and timing:** build after the remaining Steam launch work (S4, S14), as
   recommended, or sooner for iPad players?
2. **Mission URL:** accept the mission page moving to
   `/hacktivities/<id>/play/mission/<game id>`, with the old `/break_escape/games/<id>` kept
   working? It changes the address players see and share for every mission, browser included.
3. **Sign-in in v1:** accept the thin out-of-scope strip on the sign-in pages, then add route
   aliases (W6) later? The modal idea isn't recommended: it rebuilds the token step and reCAPTCHA.
4. **Android:** confirm that Android players are sent to the Play app (`prefer_related_applications`)
   and that the website shell on Android shows a Google Play link instead of "Install".
5. **Offline page:** none in v1, as recommended, or the plain "You're offline, reconnect to play"
   page (W7)?
6. **iPhone:** offer the iOS instructions on iPhone straight away, or iPad only until the phone and
   touch work from ANDROID.md Q5 is done?
7. **Button:** wording and placement on the title screen, and whether to log installs to GA4.
8. **Pricing inside the installed app:** open it (and Stripe) in a browser tab, as recommended, or
   in the app window with the out-of-scope strip?
9. **Short name:** a new `app_short_name` field, or derive it from the title ("Licence to Hack")?

### Owner answers (2026-10-27)

The owner accepted the note's recommendations ("That all sounds good. Go ahead"). Applied while
building W1 to W4:

1. **Go-ahead and timing:** build now, ahead of S4 and S14. Accepted.
2. **Mission URL:** the mission page moves to `/hacktivities/<event id>/play/mission/<game id>` for Game
   events, and `/break_escape/games/<id>` keeps working. Accepted. Start, resume and restart redirect to
   the new address.
3. **Sign-in in v1:** accept the thin out-of-scope strip, add route aliases (W6) later, no modal. Accepted;
   nothing built.
4. **Android:** Android players are sent to the Play app (`related_applications` plus
   `prefer_related_applications`, only for a game with a package in `AndroidApps`). The title screen shows
   "Get it on Google Play" on Android for such a game, never the install button. Accepted.
5. **Offline page:** none in v1, and no service worker at all. Accepted.
6. **iPhone:** agent's choice, owner may change. The instructions show on iPad (and iPadOS in desktop
   mode) only. iPhone shows nothing until the phone and touch work in ANDROID.md Q5 is done. One
   constant, `OFFER_ON_IPHONE` in `public/break_escape/js/pwa-install.js`, turns it on.
7. **Button wording, placement and GA4:** agent's choice, owner may change.
   - Wording: "Install the app" where the browser offers the install (Chromium), "How to install" where
     it only has instructions (iPad: Share, Add to Home Screen; macOS Safari 17+: File, Add to Dock),
     "Get it on Google Play" on Android for a game with a Play app.
   - Placement: in the title menu, above "Exit to Hacktivity", with `data-gs-nav` so the arrow keys reach it.
   - GA4: a `pwa_installed` event goes through `gtag` on `appinstalled` when the page has `gtag`. The game
     shell loads no analytics, so nothing is recorded from there today. Recording installs needs a decision
     (for example a server-side beacon to `Ga4Service`).
8. **Pricing inside the installed app:** payment links (pricing, plans, subscriptions, checkout) open in a
   browser tab (`window.open` with `noopener`). Accepted.
9. **Short name:** agent's choice, owner may change. A new `events.app_short_name` column (max 30
   characters, on the event form); blank derives it from the title without a "SAFETYNET: " prefix. Opt-in is
   `events.pwa_enabled` (default false).

Build notes (W1 to W4): the manifest route is sessionless (a request carrying a session cookie once got a
`Set-Cookie` back; found in the live proof, fixed). The link tag is in the shell layout only. The ownership
check for the scoped mission page is in the engine (`GamesController#require_game_in_host_event`); the
note's `script_name` fix was not needed, because engine route helpers keep `/break_escape` when the engine's
controller is routed from the host. `pwa-app` is never chosen when the URL carried `?source=play` or the
referrer is an `android-app://` address, and on Android it needs the `?source=pwa` marker.

## Sources

- web.dev, install criteria (updated 2024-09-19): https://web.dev/articles/install-criteria
- web.dev Learn PWA, installation (updated 2024-09-20): https://web.dev/learn/pwa/installation
- web.dev, WebAPKs on Android: https://web.dev/articles/webapks
- MDN, manifest `id`: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/id
- MDN, manifest `scope`: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/scope
- Chrome, navigation management into installed PWAs (Chrome 139 capture default, `launch_handler`;
  updated 2025-08-19): https://developer.chrome.com/docs/capabilities/pwa-navigation-management
- blink-dev PSA, navigations captured into installed PWAs:
  https://groups.google.com/a/chromium.org/g/blink-dev/c/xl1hGAfxlA0
- Chrome, scope extensions: https://developer.chrome.com/docs/capabilities/scope-extensions ;
  intent to ship: https://groups.google.com/a/chromium.org/g/blink-dev/c/KJ3gMgcvFgs/m/Yl1YUI9tAAAJ
- Chromium source, scope score: https://chromium.googlesource.com/chromium/src/+/lkgr/chrome/browser/web_applications/web_app_scope.cc
- Chromium source, `FindBestAppWithUrlInScope`: https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/web_applications/web_app_registrar.cc
- Chromium, Android web app architecture (WebAPK, TWA): https://chromium.googlesource.com/chromium/src/+/main/components/webapps/docs/android_architecture.md
- Chrome, `getInstalledRelatedApps` (updated 2026-04-21): https://developer.chrome.com/docs/capabilities/get-installed-related-apps
- Chrome, offline-first TWAs: https://developer.chrome.com/docs/android/trusted-web-activity/offline-first ;
  TWA quality criteria (Chrome 86 era): https://goo.gle/twa-quality-criteria-update
- WebKit, Safari 17.0 features (Add to Dock, cookies copied): https://webkit.org/blog/14445/webkit-features-in-safari-17-0/
- WebKit, storage policy: https://webkit.org/blog/14403/updates-to-storage-policy/
- heise, iOS 26 home-screen web apps: https://heise.de/-10749652
- WWDC23 "What's new in web apps" notes (separate storage, link scope): https://wwdcnotes.com/documentation/wwdc23-10120-whats-new-in-web-apps/
- Adactio, iOS web app sign-out after the in-app view (2022): https://adactio.com/journal/18897
- W3C manifest discussion, macOS Safari out-of-scope links (secondary): https://lists.w3.org/Archives/Public/public-webapps-github/2024Apr/0355.html
- Firefox 143 web apps on Windows (secondary): https://www.omgubuntu.co.uk/2025/09/firefox-143-release-key-changes
- Android 12 verified links (secondary): https://www.androidheadlines.com/2021/11/unverified-app-links-android-12-open-browser.html
- iOS game limits (secondary, rough figures): https://abratabia.com/mobile-web-games/ios-safari-gotchas.php
- Play Payments policy and Steam rules: as cited in `STORE_POLICY.md`.
- Code read: Hacktivity `app/controllers/app_entry_controller.rb`, `concerns/app_mode.rb`,
  `concerns/shell_auth.rb`, `app/services/app_paths.rb`, `app/helpers/platform_helper.rb`,
  `app/views/layouts/game_shell.html.erb`, `_favicon.html.erb`, `config/routes.rb`,
  `config/initializers/content_security_policy.rb`, `app/models/event.rb#game_icon_path`,
  `game_slots_controller.rb`; BreakEscape `public/break_escape/js/client-platform.js`,
  `config/routes.rb`, `app/views/break_escape/games/show.html.erb`; `hacktivity-android`
  `games/licence-to-hack/twa-manifest.json`, `scripts/manifest-patch.js`, `README.md`.
