# Steam release plan

Status: draft plan, 2026-10-22; updated 2026-10-24 with the pick-form answers (recorded in `OPEN_QUESTIONS.md`). Entitlements, keys and the subscription model are covered in `ENTITLEMENTS.md`. The open architecture questions are in `OPEN_QUESTIONS.md`.

**Decided 2026-10-24: the Steam games are online only, with Hacktivity as the back end.** Every game, Eldritch Hacker included, runs as Mode A below. The local engine (Mode B), the hybrid VM option and the offline VM pack are dropped. The sections on them are kept, struck through in the headings, as a record of what was considered.

Scope: SAFETYNET: Licence to Hack (m01–m10) first. Eldritch Hacker and later games reuse the same desktop shell and entitlement model, and are easier because they need no VMs (see `planning_notes/eldritch_hacker/DIRECTION.md`).

## Where we are starting from

Facts from the code (surveyed 2026-10-22), which shape every option below:

- **The server holds the game logic.** `app/controllers/break_escape/games_controller.rb` (about 2,600 lines) serves scenario slices, lazy room loads, container contents, unlock validation (`Game#validate_unlock`, game.rb:1022), flag checks, objectives and `conclude`. The client never holds the real PIN or password. Ink is compiled on request by shelling out to `bin/inklecate`. `scenario.json.erb` is rendered once, when the game is created, into `games.scenario_data`.
- **Standalone mode still needs Rails and PostgreSQL** (`BREAK_ESCAPE_STANDALONE`, `DemoUser`, test/dummy). There is no working static mode.
- **No build step on the client.** Native ES modules, with Phaser 3.60 and easystar loaded from the jsdelivr CDN. They have to be vendored for a desktop build.
- **Size:** public/break_escape is about 845 MB (characters 372 MB, backgrounds 243 MB, music 138 MB), plus tts_cache at about 197 MB. Fine for Steam.
- **Every m01–m10 mission needs a SecGen VM set.** All of them have a `secgen_scenario`. Flags are per-build values from Hacktivity (`vm_flags_json`). With no VM there is no way to finish a mission: the `flag{N}` alias works only outside production.
- **Hacktivity VMs are self-hosted** (Proxmox/oVirt), pre-built by SecGen batches and claimed per user, with quotas but no per-use billing. Every Steam player who plays the VM missions takes capacity from that pool.
- **Saves live in the server DB** (`break_escape_games.player_state`). localStorage only holds preferences.
- **Auth is a Devise cookie session.** There is no API token, OAuth or Steam login.

The VM requirement is the deciding problem. The game client is easy to package. The VMs decide the architecture, the running cost and how much a Steam copy can cost.

## Shell: Electron (recommended)

| Option       | For                                                                                                                                                                                                                                                                          | Against                                                                                                                                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Electron** | Ships its own Chromium, so it renders exactly like the browser game we already test with Playwright. Mature Steam bindings (`steamworks.js`: overlay, achievements, auth tickets, cloud saves). Windows, macOS and Linux builds; the Linux build runs natively on Steam Deck | About 150 MB of runtime per install; memory use                                                                                                                                                                 |
| Tauri        | Small binaries                                                                                                                                                                                                                                                               | Uses the system webview, which is WebKitGTK on Linux/Deck and WebKit on macOS. WebGL, audio and ES module behaviour differ from Chromium, so we would need a second test matrix. Steam bindings are less mature |
| NW\.js       | Similar to Electron                                                                                                                                                                                                                                                          | Smaller community, weaker Steam tooling                                                                                                                                                                         |

Recommendation: **Electron + `steamworks.js`**, packaged with electron-builder, shipped as one Steam depot per OS. `greenworks` is unmaintained, so don't use it.

Shared work for any shell:

- Vendor Phaser, easystar and ink.js into `public/break_escape/js/vendor/`, so the browser build needs no CDN either.
- Precompile ink to JSON at build time rather than shelling out to inklecate at runtime.
- Ship tts_cache as static files. There is no runtime TTS on desktop, which also matches the "no runtime LLMs" rule.
- Steam overlay: Electron needs the `--in-process-gpu` / overlay workarounds that `steamworks.js` documents. Test this on Windows and on Deck early.

## How the desktop app gets its game logic

There are two ways to do this, and they can share one client.

### Mode A: online thin client (chosen)

The Electron window loads the game from Hacktivity, the same as the browser. The desktop app adds:

1. Steam sign-in: the app gets a Steam Web API auth ticket (`GetAuthTicketForWebApi`) and posts it to a new Hacktivity endpoint, which checks it with `ISteamUserAuth/AuthenticateUserTicket` and reads the SteamID.
2. Account link: the SteamID is matched to a Hacktivity user, or a new user is created (see `ENTITLEMENTS.md`).
3. Hacktivity issues a session (or short-lived token) for the webview. The game runs unchanged, server-authoritative, with real per-player VMs and per-build flags.

For: almost no engine changes, and VMs and flags work as they do now. Against: online-only (needs a "requires internet" note on the store page), every Steam player costs us VM capacity, and an outage on Hacktivity breaks the Steam product.

### ~~Mode B: local engine~~ (dropped 2026-10-24: online only)

Move the server-side game logic into a JavaScript module that runs in Electron's main process and answers the same API the client already calls (`apiBasePath`). The client sees no difference.

- Port in this order: scenario rendering (the `ScenarioBinding` helpers: random PINs, `vm_object`, `vm_flags_json`), then room/container slicing, `validate_unlock`, objectives/tasks, `conclude`, and carry-over and avatar unlocks.
- Render `scenario.json.erb` at build time into a template, with placeholders for the values that are randomised per game. Do not ship Ruby.
- Saves: a JSON file per game in the user data folder, synced with Steam Cloud.
- Keep one implementation of the rules. Once the JS port exists, Rails should call the same JS (or share a test-fixture suite with it), so the two can't drift. Decide this before the port starts. A shared conformance suite is the cheaper choice: replay recorded API sessions from the playtest bridge against both.
- Anti-cheat matters less for a single-player Steam game than for a scored Hacktivity event. Local mode doesn't feed Hacktivity scores or leaderboards.

This is the larger piece of work (an estimated several weeks for the port plus conformance tests), but it removes per-player server cost and works offline.

## The VM problem for Licence to Hack on Steam

The options, from least to most work:

1. **Hosted VMs only (with Mode A).** Steam purchase includes a VM-hours allowance on Hacktivity's cluster (for example, enough to finish m01–m10 with slack). Simple, but the cost is open-ended and capacity is shared with paying organisations. Needs a cap and a queue, and the store page must say the VM part needs an online service.
2. **Hybrid (Mode B for the game, hosted VMs for the hacking).** The story, rooms and physical puzzles run locally. When a mission reaches its VM stage, the app opens a hosted VM set and fetches that set's flags. Offline play gets as far as the first VM gate. Same cost issue as option 1, but outages only block the VM stages.
3. **Local VM pack.** Ship pre-built VM images (one SecGen build per mission, plus a Kali-style attacker image) as an optional free DLC/depot for VirtualBox or QEMU. Flags are fixed per release and checked locally against hashes. No server cost. Against: several GB per mission, players have to install and network a hypervisor (a big support load for a general Steam audience), and fixed flags will end up in online walkthroughs. That matters little for a single-player game but breaks the "every player gets their own build" idea.
4. **Browser-only "Steam edition" of Licence to Hack.** Replace each VM step with an in-game simulated terminal. This contradicts the decided positioning ("real hacking on real VMs"), so it is listed only for completeness, and needs the user's call.

Decided 2026-10-24: **option 1 (hosted VMs only)**. Options 2 and 3 are dropped with Mode B, and option 4 contradicts the positioning.

Picks (2026-10-24): fair use with one active set, idle shutdown and a generous hidden cap (D2); VMs reached through the in-game VM panel in the same window (D4); UK hosting only at launch, without making a point of it on the store page (D5); a reserved pre-built SecGen batch pool for Steam, topped up automatically (D6). What happens when that pool is full (D3) is out of scope until it becomes a problem.

### VM capacity for Steam players (D1: needs further discussion)

Today's quota (`config/initializers/quota_config.rb` in Hacktivity) has two levels, guest and premium. Guests get 1 active set, 1 owned set, a 1-hour activation timer (extended by 2 hours) and a **1-day wait between VM set claims** in the same event (`xp_claim_wait_time_guest`). Premium gets 5 sets, 5/25-hour timers and no wait. User roles are `user, pro, lbu_student, vip, admin, account_manager`, and `plans.user_role` sets the role a plan gives.

Options:

1. **A new `steam` (or `game_owner`) role** with its own quota: 1 active set, the D2 hidden cap, no claim wait, guest-length timers. Clean to report on, and the Steam pool (D6) can key off the role. Against: a user can hold one role, so a Steam buyer who later subscribes needs a rule for which wins.
2. **Free (guest) quota, with the claim wait lifted.** Either for all free users, which is a change to the free tier as a whole, or only for game slots in a library event of a product the user owns. The second is narrower and needs no new role.
3. **Quota from the product, not the role:** an owned product carries its own limits, applied only inside its library event. The most flexible, and the most code.

Decided 2026-10-24 (D1): **option 2, narrow form**: guest quota, with the claim wait lifted inside the library events of products the player owns. Steam-sourced usage is tagged for the dashboard. A Steam buyer who also subscribes gets whichever quota is more generous in each event (D7).

VM cost guard rails: a per-SteamID allowance of VM hours, idle shutdown (the activation timers already exist), one active set at a time, and a waiting room when the cluster is full. Add a dashboard for Steam-sourced VM usage so pricing can be checked against real cost after launch.

## Store packaging

- **One app per game:** "SAFETYNET: Licence to Hack" as one Steam app containing m01–m10. Eldritch Hacker is a separate app later. A Steam franchise/developer page ("Hacktivity Games") ties them together.
- Don't split the missions into per-mission DLC: it fragments the story and makes VM allowance accounting harder. A **demo app** (m01 only, VM stage included, using a small allowance) is worth it: Steam demos have their own app ID and store page.
- Achievements: map to existing objectives and the on_game_complete / on_task_complete hooks.
- Steam Cloud: not needed; the server holds the saves.
- Steam Deck at launch as "Playable", with trackpad and on-screen keyboard (A5). A full controller pass (the minigames especially) and text readable at 1280×800 can follow; "Verified" needs that pass.
- Platforms at launch: Windows and Linux/Deck (A4). Builds that don't match the server are refused with "Update through Steam" (A3).
- Demo: m01 including its VM stage, on a small allowance (E2).
- Ratings: IARC questionnaire through Steamworks; Steamworks app fee per app (currently US$100, refunded after enough revenue; verify).

## Phases

1. **Groundwork in Hacktivity (ask before editing; changes go on main).** The entitlement table and product records (`ENTITLEMENTS.md`). Close the gap where `MissionPolicy#create_game?` (engine `mission_policy.rb:16`) lets any signed-in user start any published mission outside a game slot: that has to check entitlement before game access is sold. Add token auth for a desktop client.
2. **Client prep in BreakEscape:** vendor CDN scripts, precompile ink, make sure no code assumes a browser URL bar (back button, `window.location` redirects to Hacktivity pages).
3. **Electron shell, Mode A:** Steam sign-in, account link, entitlement check, overlay, achievements. Internal testing on Windows, Linux and Deck.
4. **Steamworks setup:** app, depots, demo app, store page, pricing, and the key and parity rules (see `ENTITLEMENTS.md`). Coming Soon page at least two weeks before launch (Steam requirement; verify).
5. **Release** with VM allowance guard rails. Picked: full release once m01–m10 are finished (E6); Early Access is still under discussion, see "Release type".
6. **Eldritch Hacker** as a second app on the same shell and back end. It needs no VMs, so its only running cost is the Hacktivity web load.
7. Optional: a Deck controller pass.

## Release type (E6)

Decided 2026-10-24: **a Steam Playtest while m09–m10 are written, then full release of m01–m10.** The Playtest tests VM load and the sign-in flow with real Steam players without spending the launch visibility. The considerations behind the choice:

- **Early Access, for:** sells and gathers reviews while m09–m10 are written; Steam players test the VM capacity at a smaller scale before full launch; the store page can say what's coming.
- **Early Access, against:** Steam players judge the story on an unfinished ending; the launch visibility (front page, wishlist emails) is spent on Early Access, and the full release later gets less; Valve expects regular updates.
- **Full release, for:** the Season 1 story lands whole, and the launch push goes to the finished game.
- **Middle route:** a free demo (E2) or a Steam Playtest during development to test VM load, then full release.

## Google Play (Android)

Wanted alongside Steam (A4 note, 2026-10-24). Since the games are online only, the Android app can be a thin wrapper round the same Hacktivity pages.

| Option | How | For | Against |
|---|---|---|---|
| **Trusted Web Activity (TWA)** (Bubblewrap) | The app opens Hacktivity in Chrome full-screen, with no browser bar | Same Chromium engine as Electron and our Playwright tests; tiny app; updates without a Play release; Play Billing works through the Digital Goods API | Needs Chrome (or another TWA browser) on the device; little native access |
| **Capacitor** | Our pages in Android System WebView, plus native plugins | Native plugins (Play Billing, Play Games achievements, push); WebView is Chromium too | A native project to maintain; WebView differs slightly from Chrome |
| React Native / native rewrite | | | Not worth it: the game is a Phaser web client |

Decided 2026-10-24 (G1): **TWA (Bubblewrap)**, moving to Capacitor only if we need Play Games achievements or other native features. Licence to Hack goes to Play first, on phones and tablets (G2). Each game is a one-off Play Billing purchase, verified server-side into `Entitlement(source: google_play)` (G3). Only Play buyers can play in the Play app (G4).

What carries over and what doesn't:

- **Sign-in:** no Steam ticket on Android. The app signs in to Hacktivity directly (email and password, or Google sign-in). Only Play purchases unlock the game in the Play app (G4), even for Steam owners and subscribers.
- **Purchases:** Google requires Play Billing for digital goods bought inside a Play app (verify the current rules: external purchase links and alternative billing are allowed in some regions since 2024–25). A Play purchase verified server-side through the Google Play Developer API becomes `Entitlement(source: google_play)`. Hacktivity subscribers signing in on Android: the "reader app" exemption doesn't cover games, so check whether a Play app may unlock content bought elsewhere without offering it through Play Billing too.
- **Input:** the game is keyboard and mouse. Phones need touch controls for movement and every minigame, an on-screen keyboard for terminals, and readable text on a small screen. This is a bigger pass than the Deck one.
- **VMs on a phone:** Licence to Hack goes first, on phones as well (G2), so the VM panel needs a phone layout: touch-friendly remote desktop controls, an on-screen keyboard with the keys a terminal needs (Ctrl, Tab, arrows, Esc), and a landscape lock during VM stages. Plan a phone playtest of a full VM stage before committing to a Play launch date.

## Single-game app mode (G4 note, applies to Steam and Play)

Each store app is a wrapper round one game, not a window onto Hacktivity:

- The app opens the game's library event directly. Hacktivity's navigation bar, footer and menus are hidden, as are links to other events, courses, hackboxes, pricing and account billing.
- Any link to the rest of Hacktivity (a "more on Hacktivity" nudge, the terms, account settings) opens in the system browser, outside the app. Electron: `shell.openExternal` from a `setWindowOpenHandler`/`will-navigate` guard that allows only the game's own paths. TWA: links outside the game's scope open in a Custom Tab or the browser.
- Server side, the app identifies itself (a header or user-agent token set by the shell), and Hacktivity renders the single-game layout and refuses Stripe checkout and billing pages for those requests. The rule then holds even if the client guard misses a link.

This keeps the store apps separate from Hacktivity and makes sure no Stripe purchase can be made from the Steam or Play apps.

The single-game layout now exists as Hacktivity's game shell for Game events (2026-10-26); what the app has to do to wrap it is in `GAME_SHELL_FOR_APP.md`.
