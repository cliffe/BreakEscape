# Android app (Google Play): design note

Status: design note, 2026-10-27. No code changed. Read with `README.md` ("Google Play (Android)",
"Single-game app mode"), `OPEN_QUESTIONS.md` (G1–G4), `ACCESS_MODEL.md` ("Store apps") and
`GAME_SHELL_FOR_APP.md`. The Bubblewrap scaffold is being built in a separate repo,
`hacktivity-android`.

Settled already: a Trusted Web Activity built with Bubblewrap (G1); Licence to Hack first, on phones
and tablets (G2); a one-off Play Billing purchase per game, verified into a `google_play`
entitlement (G3); no Stripe purchase can be made from it (G4). G4's "only Play buyers" was replaced
on 2026-10-27 by account-wide access (owner answer 6 below); the "G4" sections further down predate
that and are kept for the record. The implementation plan is `ANDROID_PLAN.md`.

## Decisions for the owner

1. **How the server recognises the app.** Recommended: a dedicated host per Play game (for example
   `licencetohack.hacktivity.co.uk`), so the app has its own cookie jar and app mode never leaks
   into the player's normal Chrome tabs. Confirm the approach and pick the host name (Q1).
2. **Play Console account type.** Organisation (needs a D-U-N-S number) or personal. A personal
   account opened after late 2023 must run a closed test with at least 12 testers for 14 days
   before production (verify the current rule). Who holds the account and its payments profile?
3. **Package id.** Confirm `uk.co.hacktivity.licencetohack` (the desktop app's `appId` in
   `hacktivity-desktop/src/config.js`). It can never change after the first upload.
4. **Upload key.** Who generates and keeps the upload keystore, and where the backup lives. Enrol
   in Play App Signing (Google holds the app signing key; we keep the upload key).
5. **Business model on Play.** Recommended: one free app, the free operations playable as the demo,
   one in-app purchase unlocking the full game. The alternative is a paid app, which avoids billing
   code but leaves the server no clean way to confirm ownership from a TWA. Set the price.
6. **Who else may play in the Play app.** G4 says Play buyers only. Should staff `grant` and
   `playtest` entitlements also count there, so testers and support can use the app? Recommended:
   yes.
7. **Links out of the Play app.** Recommended: in the Play app, hide every link that leads to a page
   where something can be bought (the website home, plans, the Steam store link), and keep only
   terms, privacy and account pages. The alternative is to keep them and open them outside the app.
   This also depends on the Play anti-steering rules (Q4).
8. **Google sign-in.** Recommended: launch with email, password and the emailed or authenticator
   token, which works today, and add Google sign-in later if the sign-in drop-off is high.
9. **Phones at launch.** G2 says phones and tablets. If the phone playtest of a VM stage fails,
   would you launch on tablets only, or wait?

### Owner answers (2026-10-27)

1. Host: open, for discussion. The owner asked whether JavaScript can tell it is the app. It can, per
   tab, though not from the User-Agent (a TWA's is plain Chrome): a `start_url` marker
   (`?source=play`) kept in `sessionStorage`, which is per tab and so never leaks into the player's
   normal Chrome tabs; `document.referrer` of `android-app://<package>/` on the launch page; the
   `display-mode: standalone` media query; `getDigitalGoodsService` for billing. The server only
   learns it from the client (a header or link parameter), which is fine for layout and not for access.
   With answer 6, no access decision depends on it, so one host plus client-side detection may be
   enough. Owner to confirm.
2. Play Console: organisation account (D-U-N-S needed).
3. Package id: `uk.co.hacktivity.licencetohack`, confirmed.
4. Upload key: decide later (before the first Play upload).
5. Business model: free app, one in-app purchase unlocks the full game.
6. Access: **G4 is replaced, for every platform.** Access is account-wide: the player signs in to
   Hacktivity, and everything the account holds (subscription, organisation, Steam purchase, Play
   purchase, staff grants) applies in the browser, the Steam app, the Play app and any other build.
   Only the payment links depend on the platform (answer 7). No platform-specific access rule.
   Verify Play's and Steam's rules on honouring purchases made elsewhere before submission.
7. Links out: keep them and open them outside the app. In a TWA, same-site links stay in the app, so
   the client marks them to open in the browser. **Every nudge to buy in the game goes to that
   platform's own purchase** (owner, 2026-10-27): Play Billing in the Play app, the Steam store page
   in the Steam app, the website's plans in the browser. That also keeps the Play app inside the
   anti-steering rules.
8. Google sign-in: launch without it.
9. Phones: wait for phones; one launch on phones and tablets after the phone VM playtest. **Touch is
   not a blocker** (owner, 2026-10-27): the game already works with touch, so Q5 below shrinks to a
   check on a phone and an emulator, fixing what shows up, not a planned 9–12 passes.

## Q1. How Hacktivity knows a request comes from the Android app

Today app mode is decided only by the desktop app's User-Agent token, parsed by `AppClient`
(Hacktivity `app/services/app_client.rb`) and read by `AppMode#app_mode?`
(`app/controllers/concerns/app_mode.rb`). The desktop shell sets that token on every request
(`hacktivity-desktop/README.md`, "user-agent token"). The game shell's `?app=1` preview is
remembered in the Rails session (`app/helpers/game_shell_helper.rb:15`) and changes link style only.

A TWA is Chrome. It cannot add to the User-Agent, and it uses Chrome's cookie jar for the origin, so
anything stored in a cookie on `hacktivity.co.uk` while in the app is also there in the player's
normal Chrome tabs.

| Option | How | For | Against | G4 (no Stripe, server side) |
|---|---|---|---|---|
| A. Start URL marker + session cookie | `start_url` is `/app/<key>?source=play`; the server stores "Play app" in the session | No new infrastructure | The session is Chrome's: after one app launch, the player's ordinary Chrome tabs on hacktivity.co.uk are in app mode too, with Stripe and billing refused, until the session ends. Unfixable on one host | Holds inside the app, and wrongly blocks Stripe in the player's browser |
| B. `android-app://` referrer | Chrome sends `Referer: android-app://<package>/` on the launch navigation | Hard to fake by accident | Only the first request carries it; every later request needs a cookie, so it collapses into A | As A |
| C. Digital Goods API presence | `window.getDigitalGoodsService` exists only inside a Play-installed TWA | Good for showing the Buy button | Client side only; the server can't see it | None: a client-side check can't enforce G4 |
| D. Path prefix (`/android/...`) | All app pages under a prefix, session cookie scoped to it | One host | The engine is mounted at `/break_escape` and its API, assets and game pages would all need the prefix; Devise and the shell generate unprefixed paths. A large routing change for a weak result | Holds only where every path is prefixed |
| **E. Dedicated host (recommended)** | The Play app opens `https://<app host>/app/<key>`. A request on that host is the Play app | Separate cookie jar, so nothing leaks into normal Chrome. Server-side and per request, like the UA token. Own `assetlinks.json` and manifest. Main-site links leave the verified origin, so the TWA shows them in a Custom Tab with a URL bar, which marks them as outside the game | Infrastructure and URL work (below). The player signs in again in the app (they need to anyway) | Holds on every request: `AppMode` refuses Stripe and billing pages on that host as it does for the desktop token |
| F. Capacitor instead | Native shell with the Android System WebView and a custom UA | `AppClient` works unchanged; WebView has its own cookie store | Google blocks Google sign-in inside WebViews (needs a native plugin); billing through a native plugin; a native project to maintain; reverses G1 | Holds, as on desktop |

**Recommendation: E, one host per Play game.** A single shared host (`play.hacktivity.co.uk`) for
all future Play games would put every Play game in one Chrome cookie jar, so the game key couldn't
live in the session; one host per game avoids that.

What E costs:

- **DNS and certificate.** One proxied DNS record per game. Cloudflare's Universal SSL covers one
  level (`*.hacktivity.co.uk`); a two-level name such as `lth.play.hacktivity.co.uk` needs an
  Advanced Certificate (paid). Hence a one-level name. Verify which Cloudflare plan the zone is on.
- **Origin server.** The host name added to the web server and any host allowlist. Rails has no
  `config.hosts` set in `config/environments/production.rb` today.
- **Server code.** `AppClient` gains a second constructor from the host (host → `events.app_key`
  from a config or credentials map), with a store attribute (`google_play`) beside the edition.
  `AppMode#app_client` asks it when the UA has no token. The existing scope guard, sign-in landing
  (`app_home_path`) and forced remember-me (`Users::SessionsController#remember_in_app`) then apply
  unchanged.
- **Absolute links to the main site.** `Rails.application.routes.default_url_options[:host]` is the
  main domain (`config/environments/production.rb:151`), but controller-generated `*_url` helpers use
  the request host. The shell's outbound links and the "Open in your browser" page
  (`AppMode#render_open_in_browser` uses `request.original_url` and `root_url`) must name the main
  host explicitly, or they would point back at the app host and hit the scope guard.
- **Sign-in session.** Host-only cookies (Hacktivity sets no cookie domain for the session), so the
  app host has its own session. Emails (OTP tokens, confirmation) keep linking to the main host,
  which is fine: confirmation completes in the browser and the player returns to the app.
- **CSP.** `config/initializers/content_security_policy.rb` uses `:self` and `:https`, so the app
  host's own pages and engine assets need no change.
- **Engine assets.** Same Rails app, so they are served on the app host as they are. Cloudflare
  caches per host name, so the first players on the app host warm a second cache (about 1 GB of
  engine assets and voice audio). Check cache rules match on host.
- **VM console relay.** `config.vnc_relay_url` is `wss://hacktivity.co.uk/vnc_relay_ws` and the
  console passes a session token in the URL (`app/views/vms/vnc_console.html.erb:89`), so a
  cross-host page can use it; check the relay doesn't reject the app host's `Origin`.
- **reCAPTCHA.** The site key's domain list must accept the app host (reCAPTCHA normally accepts
  subdomains of a listed domain; verify in the admin console).
- **Webhooks and admin** stay on the main host.

The desktop app keeps its UA token; the two detections sit side by side in `AppClient`.

### G4 is an access rule as well as a scope rule (superseded 2026-10-27: access is account-wide)

`AppMode`'s header comment says app mode "changes layout and scope only, never access". G4 needs more
than that: in the Play app a subscriber or Steam owner must not get the full game. Today
`EventAccess#entitlement_route?` (`app/services/event_access.rb:59`) counts any live
`EventEntitlement`, and the subscription and org routes come first. The Play app needs its own
access check: on the Play host, a player has the full game only with a live `google_play`
entitlement (plus `grant`/`playtest` if the owner agrees, decision 6), and everyone else gets the
free operations as the demo. `GameShellAccess` already lets the client decide the demo wording; the
gating itself belongs in `GameSlotPolicy`/`EventAccess`, behind tests. The same question applies to
the desktop app for Steam (E4); check how it is meant to work there before writing the Play version,
so both stores use one rule.

## Q2. Web app manifest and Digital Asset Links

**Digital Asset Links.** Hacktivity serves `https://<app host>/.well-known/assetlinks.json`
(nothing under `public/.well-known` today):

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "uk.co.hacktivity.licencetohack",
    "sha256_cert_fingerprints": ["<Play App Signing key>", "<upload key>"]
  }
}]
```

- Fingerprints: the Play App Signing key (Play Console, App integrity) is the one that matters for
  installs from Play; the upload key covers locally built and sideloaded test builds. Internal app
  sharing re-signs with its own certificate, so add that fingerprint too if it is used.
- Serve it from a Rails route reading a credentials map of host → package and fingerprints, so a new
  game is a credentials edit. Requirements: `Content-Type: application/json`, status 200, no
  redirect, reachable without cookies. Make sure Cloudflare doesn't challenge or redirect it.
- Only app hosts serve it. Without it on the main host, a main-site link in the app opens as a
  Custom Tab with a URL bar, which is what we want.

**Web app manifest.** Bubblewrap reads it once at `bubblewrap init`; the installed TWA doesn't need it
at run time, but Chrome uses it if someone installs the site as a web app. Serve one per app host,
for example `/manifest.webmanifest`, linked from the game shell layout
(`app/views/layouts/game_shell.html.erb`) and the engine game page on that host only:

- `name`/`short_name` from the event; `start_url` `/app/<key>`; `scope` `/`; `display` `fullscreen`;
  `orientation` `landscape` (the VM panel wants landscape anyway, README); `theme_color` and
  `background_color` from the event's `ui_theme`.
- Icons: 192, 512 and the maskable icon from `hacktivity-desktop/docs/ICONS.md`, section 3.

## Q3. Sign-in on Android

What works now, from the code:

- Email and password, then a token: emailed (`SendTokenEmailJob`) or from an authenticator app
  (`Users::SessionsController#create`, `active_model_otp`). In a TWA the player can switch to their
  mail app and back without losing the page.
- MFA set-up (`users#setup_mfa`) and sign-up are already in scope in app mode
  (`AppMode#app_in_scope?`), and sign-in, sign-up, confirmation and sign-out already return to
  `/app/<key>` (`app_home_path`). On the app host all of that carries over unchanged.
- Remember-me is forced in app mode, so the player stays signed in between launches.
- reCAPTCHA on sign-up and password reset (`app/views/devise/registrations/new.html.erb:70`,
  `passwords/new.html.erb:10`) runs as in Chrome; only the domain list needs the app host. The
  desktop app had to allow the reCAPTCHA frames explicitly (`frameOnly` in
  `hacktivity-desktop/src/config.js`); a TWA has no such guard to configure.
- Chrome's password manager works in a TWA. Passwords saved for hacktivity.co.uk may only be offered
  as a cross-subdomain suggestion on the app host (verify), so first sign-in may mean typing them.

Not there today: Google sign-in. The Gemfile has `omniauth` with only an Azure provider, and
`devise :omniauthable` is commented out (`app/models/user.rb:30`). In a TWA Google sign-in would
work (it is Chrome, so Google doesn't block it as it does WebViews), but it is new work: OmniAuth
Google provider, account linking by email, MFA policy for Google sign-ins, and the redirect URI
registered for each app host. Hence decision 8: later.

Also check (Play policy, verify): apps that let users create an account must offer account deletion
from inside the app and through a web link. Account editing and deletion are kept out of app mode
today (`AppMode::REGISTRATION_ACTIONS`); a link to the main site's deletion page may satisfy the
in-app path.

## Q4. Play Billing

The flow, client side, inside the TWA (Bubblewrap's Play Billing option must be enabled):

1. `getDigitalGoodsService('https://play.google.com/billing')`; `getDetails([events.play_product_id])`
   for the localised price shown on the Buy button. `events.play_product_id` already exists (unique,
   `db/schema.rb`).
2. `new PaymentRequest([{ supportedMethods: 'https://play.google.com/billing', data: { sku } }], …)`;
   `show()` returns a purchase token.
3. POST the token to Hacktivity while signed in.

Server side:

4. Verify with the Google Play Developer API: `purchases.products.get(package, productId, token)`
   using a service account given access in Play Console (credentials in Rails credentials). Check
   the purchase state is purchased (not pending), the product id matches the event and the package
   matches the app host's package.
5. Create `EventEntitlement(source: google_play)` (Hacktivity `app/models/event_entitlement.rb`; the
   enum already has `google_play`). `source_ref`: the order id (stable, readable in support);
   put the purchase token in `metadata`. The unique index on `(source, source_ref)` stops one
   purchase unlocking two Hacktivity accounts.
6. Acknowledge with `purchases.products.acknowledge`; Play refunds unacknowledged purchases after
   three days. Acknowledge only after the entitlement row is saved.
7. Restore: on each app launch the shell calls `listPurchases()` and posts any token the server
   hasn't seen, which also picks up pending purchases that completed later and purchases made just
   before a crash.

Refunds and voids:

- Real-time developer notifications: a Cloud Pub/Sub topic with a push subscription to a new
  `/webhooks/google_play` endpoint on the main host, authenticated by the push subscription's OIDC
  token. One-time product notifications cover purchased and cancelled.
- Refunds and chargebacks: the Voided Purchases API (`purchases.voidedpurchases.list`), polled by a
  daily job, revoking the matching row with `EventEntitlement#revoke!`. Whether RTDN now carries
  voided-purchase notifications for one-time products too is to verify; if it does, the poll becomes
  a backstop.

G4: the entitlement is per event, so a Play buyer can also play in the browser once signed in
(as E5 allows Steam buyers). The reverse is what G4 forbids, handled by the access check in Q1.

Play policy questions to verify (not facts):

- Play Billing is required for digital goods sold in the app; since 2024–25 some regions allow
  alternative billing or external offers. We only need Play Billing, so this matters only for the
  links in decision 7.
- Anti-steering: whether a link from the app to a site that sells the same game (Hacktivity plans,
  the Steam page) breaks policy in our markets.
- Whether a Play app may unlock content bought elsewhere (subscriptions, Steam). G4 avoids the
  question by not doing it.
- Google's newer one-time product model (purchase options, 2025) and whether the Digital Goods API
  and `purchases.products` calls above still apply unchanged.
- Whether the Payment Request flow can pass an obfuscated account id to tie the purchase to the
  Hacktivity account at Google's end.
- Content rating questionnaire and target audience for Cyber Security content with hacking themes,
  and the Data safety form (VM console traffic, analytics through `Ga4Service`).

## Q5. Phone and touch readiness (scope only)

Already done, from the code:

- Tap to move and tap to interact, with a menu when several things are in reach
  (`public/break_escape/js/core/game.js`, around line 1997). Punch and block HUD buttons with touch
  handlers (`ui/hud.js:229–243`). A second pointer for walking while pressing a HUD button.
- Display scaling from the window size and device pixel ratio, with HUD zoom
  (`main.js:238–268`), and an `orientationchange` handler (`main.js:293`).
- Minigames have a close button as well as Esc (`minigames/framework/base-minigame.js:23`).
- The game shell is fluid, stacks to one column below 720 px, pads for `env(safe-area-inset-*)`,
  and was checked at 390×844 (`GAME_SHELL_FOR_APP.md`).
- The VM console already has an on-screen keyboard (`simple-keyboard`) with Ctrl, Tab, Esc and the
  rest, and a paste box that types into the VM (`Hacktivity app/views/vms/vnc_console.html.erb`).

What still assumes keyboard and mouse, grouped:

| Group | What | Where | Passes |
|---|---|---|---|
| 1. Keyboard-only actions | Shift run, Space jump, E interact, arrows; F and Q have HUD buttons. Check whether any mission needs run or jump; if so, add HUD buttons | `core/player.js:276–390` | 1 (with group 3) |
| 2. Typing | Minigames with text fields or that read typed keys: password, PIN (also has on-screen keys), notes, flag station, mail composer, OSINT browser, log filter, command board, landing-page builder, BLE/Bluetooth scanners, biometrics, coverage form, inbox triage, text file, phone chat. Two problems: the soft keyboard covers about half a landscape screen, so fields must stay visible (`visualViewport`); and Android keyboards often send `keydown` with `key` "Unidentified" (keyCode 229), so handlers that read characters from `keydown` (PIN at `pin-minigame.js:265`, password at `password-minigame.js:264`) must also listen for `input` | 34 files with `keydown` handlers across `minigames/`, `ui/`, `core/` | 2 |
| 3. Esc and the Back button | Esc closes minigames, modals and the game menu (`ui/modals.js`, `ui/modal-stack.js`, `ui/game-menu.js`, `ui/interaction-menu.js`). On Android the system Back button goes back in history, which leaves the game page. Map Back to "close the top layer, else open the pause menu" (history entry per open layer) | as listed | 1 |
| 4. Drag and hover | Shredded document uses HTML5 drag and drop (`draggable`, `dragstart`), which needs testing on Chrome for Android and may need a pointer-event version. Decor hover text (`core/rooms.js:83`) and `:hover` styles have no touch equivalent; decide whether anything a player needs is hover-only | `minigames/shredded-document/`, `core/rooms.js` | 1 |
| 5. Layout and text size | A typical phone in landscape is about 850×390 CSS px. Minigame panels, dialogue (person chat with its 400 px backgrounds and portraits), the objectives panel, phone chat and the HUD were designed at desktop sizes; there are about 80 `@media` rules across the engine CSS but no phone pass. The game page allows pinch zoom (`app/views/break_escape/games/show.html.erb:11`), which can fight Phaser's touch input; decide per page | `public/break_escape/css/` | 2–3 (the largest job; about 45 minigame folders to check) |
| 6. Performance and data | Engine assets are about 845 MB plus about 197 MB of voice audio, loaded from the network. Measure first-mission download size, memory and frame rate on a mid-range phone; Phaser and easystar come from jsDelivr | whole engine | 1 (measure, then fix what shows up) |
| 7. VM panel | Remote desktop on a phone needs the remote screen scaled to fit with pinch zoom and pan, the modifier-key row, an easy way to paste a flag from the VM into the game, landscape kept during VM stages, and a check that typing through the console works with Android keyboards. The parts exist in the console page; they need a phone layout and a full VM-stage playtest (README) | `vnc_console.html.erb`, `minigames/vm-launcher/` | 1–2, plus the playtest |

About 9–12 passes in all, most of which also help tablets, the browser on phones and the Steam Deck.
Groups 2, 3 and 5 should be done before any wider test track.

## Q6. Phasing

**Phase 0, owner (blocks everything):** the decisions above, Play Console account and payments
profile, package id, upload key and Play App Signing, app host name and DNS record.

**Phase 1, wrapper on the internal testing track (no billing).**
- Hacktivity: host detection in `AppClient`/`AppMode` with tests; main-host absolute links;
  `assetlinks.json` and manifest routes from credentials; the Play-app access rule (free operations
  only until billing lands); hide purchase links in the Play app.
- `hacktivity-android`: Bubblewrap project pointed at the app host, landscape, icons, signed with the
  upload key, uploaded to internal testing.
- Check: verified TWA (no URL bar), sign-up with reCAPTCHA, sign-in with emailed token, MFA set-up,
  sign-out, a browser-only free operation, out-of-scope pages, main-site links opening in a Custom
  Tab, and that the player's normal Chrome on hacktivity.co.uk is unaffected.

**Phase 2, billing (closed testing, licence testers).**
- In-app product in Play Console; the Buy button, purchase and restore in the shell; the verify and
  acknowledge endpoint; RTDN webhook and the voided-purchases job; tests with Play's licence-tester
  test cards, including a pending purchase, a refund and a second Hacktivity account using the same
  Google account.

**Phase 3, touch and phone (can run alongside phase 2).** Groups 1–6 from Q5, then a phone playtest
of the browser-only operations.

**Phase 4, VM stage on a phone, then production.** Group 7, a full VM-stage playtest on a phone and
a tablet, store listing, content rating, Data safety, account deletion path, then production (after
the 12-tester, 14-day closed test if the account is personal).

Blocked on the owner: phase 0 for all of it; the Play product and price for phase 2; decision 9 for
the launch date.
