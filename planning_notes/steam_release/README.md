# Steam release plan

Status: draft plan, 2026-10-22. Entitlements, keys and the subscription model are covered in `ENTITLEMENTS.md`. The open architecture questions are in `OPEN_QUESTIONS.md`.

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

Decided 2026-10-24: **option 1 (hosted VMs only)**. Options 2 and 3 are dropped with Mode B, and option 4 contradicts the positioning. How capacity, allowance and queueing work is in `OPEN_QUESTIONS.md` (area D).

VM cost guard rails: a per-SteamID allowance of VM hours, idle shutdown (the activation timers already exist), one active set at a time, and a waiting room when the cluster is full. Add a dashboard for Steam-sourced VM usage so pricing can be checked against real cost after launch.

## Store packaging

- **One app per game:** "SAFETYNET: Licence to Hack" as one Steam app containing m01–m10. Eldritch Hacker is a separate app later. A Steam franchise/developer page ("Hacktivity Games") ties them together.
- Don't split the missions into per-mission DLC: it fragments the story and makes VM allowance accounting harder. A **demo app** (m01 only, VM stage included, using a small allowance) is worth it: Steam demos have their own app ID and store page.
- Achievements: map to existing objectives and the on_game_complete / on_task_complete hooks.
- Steam Cloud: not needed; the server holds the saves.
- Steam Deck: needs controller input (the game is keyboard/mouse driven at the moment, so the minigames especially need a pass) and readable text at 1280×800. This is separate work and could follow launch, marked "Playable" rather than "Verified".
- Ratings: IARC questionnaire through Steamworks; Steamworks app fee per app (currently US$100, refunded after enough revenue; verify).

## Phases

1. **Groundwork in Hacktivity (ask before editing; changes go on main).** The entitlement table and product records (`ENTITLEMENTS.md`). Close the gap where `MissionPolicy#create_game?` (engine `mission_policy.rb:16`) lets any signed-in user start any published mission outside a game slot: that has to check entitlement before game access is sold. Add token auth for a desktop client.
2. **Client prep in BreakEscape:** vendor CDN scripts, precompile ink, make sure no code assumes a browser URL bar (back button, `window.location` redirects to Hacktivity pages).
3. **Electron shell, Mode A:** Steam sign-in, account link, entitlement check, overlay, achievements. Internal testing on Windows, Linux and Deck.
4. **Steamworks setup:** app, depots, demo app, store page, pricing, and the key and parity rules (see `ENTITLEMENTS.md`). Coming Soon page at least two weeks before launch (Steam requirement; verify).
5. **Early access / beta release** with VM allowance guard rails.
6. **Eldritch Hacker** as a second app on the same shell and back end. It needs no VMs, so its only running cost is the Hacktivity web load.
7. Optional: a Deck controller pass.
