# Launch to-do: Steam and Google Play

One list of what is left before Licence to Hack ships on Steam and Google Play: what waits on the
owner, what waits on the store accounts, and what happens at release. Started 2026-10-27. Plans:
`ANDROID_PLAN.md` (packages P0–P13), `STEAM_PLAN.md` (being written). Tick items off here as they
land; keep each line short and say where the detail lives.

## Owner: Google Play account (blocks P11 internal track and P12)

- [ ] Open the organisation Play Console account (needs a D-U-N-S number); payments profile.
- [ ] Create the app with package `uk.co.hacktivity.licencetohack` (confirmed; permanent).
- [ ] Upload key: generate and keep it (backup location); enrol in Play App Signing. Then add the
      Play signing key's and upload key's SHA-256 to Hacktivity credentials `android_apps:`.
- [ ] One-time product for the full game, price set; its first buy option marked
      "legacy compatible" (keeps `purchases.products.get` working). Put the product id in
      `events.play_product_id` for the Licence to Hack event.
- [ ] Google Cloud service account with Play Developer API access; its JSON key in Hacktivity
      credentials `google_play:` (plus the account-id HMAC key).
- [ ] Licence testers for the internal track.

## Owner: Steam (blocks Steam sign-in, ownership and upload)

- [ ] Steamworks app ids for the full game and the demo; set `steamAppId` in
      `hacktivity-desktop/src/config.js` and `events.steam_app_id` / `steam_demo_app_id`.
- [ ] Publisher Web API key in Hacktivity credentials.
- [ ] Store page, then `events.store_url`; store and library art is ready in
      `hacktivity-desktop/steam/licence-to-hack/` (screenshots and the page background still to make).
- [ ] Further Steamworks settings and steps: see `STEAM_PLAN.md` once written.

## Owner: production and operations

- [ ] Run the read-only `deleted<digits>` username check on production before account deletion
      ships (command in `ANDROID_PLAN.md` P11a / the P11a report); rename any match.
- [ ] Restart the dev server and the Resque scheduler (mail guard, rate-limit keys, new schedules).
- [ ] Production: the new scheduled jobs run on the `default` queue (resque-pool already serves it).
- [ ] Earlier tasks still open: feedback move (dry run, then `APPLY=1`), `results:recalculate_event`,
      mission score weights, check the production `store_url`.
- [ ] Optional: a support email address for purchase-conflict messages (today: "the Contact page").

## Engineering that can't finish until the accounts exist

- [ ] P11: internal testing track with licence testers; verify every "verify in P11" note
      (Digital Goods v2.0 shapes, `purchaseToken`, client acknowledge, `listPurchases` and pending,
      voidedReason 8, paging parameter names, `products.get` for the 2025 product model).
- [ ] P12: store listing, Data safety, content rating, account deletion URL, and the policy checks:
      anti-steering (pages opened in Chrome still show the website's Pricing menu), honouring
      purchases made on other platforms (Play and Steam), the account deletion route.
- [ ] Play Billing Library 8+ requirement (from 31 Aug 2026, extension to 1 Nov 2026): check the
      version androidbrowserhelper's billing module bundles before the first upload.
- [ ] Post-deploy checks for asset links: `curl https://hacktivity.co.uk/.well-known/assetlinks.json`,
      Google's Statement List tester, and Cloudflare not challenging or caching a 404 there.
- [ ] Repeat P0/P5's headline link cases on the real host with verified asset links, and the Custom
      Tab fallback with the host unverified (P10 notes).
- [ ] Stripe deletion path against real Stripe (cancel and retrieve were only stubbed).
- [ ] Steam: sign-in, ownership and upload items from `STEAM_PLAN.md`.

## Engineering in progress or next (no account needed)

- [x] P7 (client purchase and restore) and P10 (Play app end to end on the emulator, fake
      billing: passed 2026-10-27; hacktivity-android 64b6d34).
- [ ] Play the game canvas on a real Android phone or tablet: the emulators here show WebGL black
      (Chrome 113) or freeze the compositor (Chrome 124), so P10 checked missions by game state only.
- [ ] Phone landscape layout pass (shell pages 2-2.3 screens tall at 915x412; Mission Brief Continue
      overlaps text; pause menu scrolls): in progress.
- [ ] Hyphenated handles break the in-game name save on the character page: in progress.
- [ ] Steam packages (STEAM_PLAN.md): S1–S10, S2p, S14, S15 done and reviewed (S4 with
      a fresh Steam check before Link); left: S0 (app 480 with the owner's Steam client), S12, S13; S11 run: 12 scenarios
      plus S4's 6 passed on the fakes (S11 scenario 4, a copied cookie, proven by tests only).
- [ ] S15 live admin check (suspend and lift from the admin page): needs the owner's OK for a
      throwaway dev admin, or a dev admin login.
- [ ] Owner questions from S15: should suspension pause billing or free the org seat; should it
      power off the user's VMs (the VNC console and VMs keep running today).
- [ ] Restart the :3000 dev server: S14 throttles (rack_attack) and the web app's engine hook
      (config/initializers/break_escape.rb). Re-auth lockout counts need `bin/rails dev:cache` in dev.
- [x] Bugs found on the way, fixed: `scenario_map` policy and signed-out `/break_escape/configuration`
      (engine bf0af2854); engine loaded twice, fixed with a gemspec glob (Hacktivity 5f655cce, eb7ee578,
      1b385989; works whether `../BreakEscape` is the engine or its parent folder).
- [ ] Windows installer of the desktop app: owner installs wine (`sudo apt install wine wine64`,
      `wineboot --init`), then `npm run build:full:win`. Linux AppImage rebuilt 2026-10-27.
- [ ] Backlog from reviews: in-page consent dialog instead of `window.confirm`; remember a declined
      restore per account; show "already owned" during restore; fix the pre-existing
      `subscription_flow_test.rb:143` and Stripe webhook test failures. (The older throttles' `req.ip`
      keys behind Cloudflare: owner says Rack::Attack is already set up correctly; dropped.)
- [ ] Installable web app per game (`PWA.md`): W1–W4 building; W5 visible-window and iPad/iPhone
      checks need the owner's device time.

## At release

- [ ] Bump `BreakEscape::ASSETS_VERSION` (Hacktivity pages now load the engine's
      `client-platform.js` and `client-purchase.js`); deploy engine and Hacktivity together.
- [ ] Push all four repos (Hacktivity, BreakEscape, hacktivity-desktop, hacktivity-android; the
      Android repo has no remote yet).
- [ ] Run migrations (`deleted_at`, `play_purchase_intents`, `app_settings`, `desktop_min_version`,
      `users_steam_not_staff` check, `steam_sign_in_attempts` and its persona column).
- [ ] Restart `hacktivity_resque_pool` and `hacktivity_resque_scheduler` (`restart_services.sh`): new
      `steam_recheck_queue` worker and the new scheduled jobs (Play voided poll and sweep, intent and
      sign-in-attempt prune, Steam ownership recheck).
- [ ] After the first Steam recheck has run, point an uptime monitor at `https://hacktivity.co.uk/job_status`
      and keyword-check `"status":"ok"` (catches a dead scheduler).
- [ ] Code signing for Windows; desktop app version bumps.

## Dev data to clean up (ask before deleting)

Event 6 and slots 82–86, mission 197, games 26–35, shell_tags on events 1 and 6, users 2–4, the e2e
users, and the throwaway `wave1-…` users and records from the Android packages (users 5–19, their
`google_play` entitlements and purchase intents, the `app_settings` poll row).
