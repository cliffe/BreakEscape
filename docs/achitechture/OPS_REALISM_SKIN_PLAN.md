# Ops layer S6: realism skin for the network view (feature N16)

Status: draft plan, 2026-11-19. Planning only; nothing is built until the user says so.
Base: branch `docs/ops-layer-plan`. Shared brief: `docs/agents/OPS_LAYER_BRIEF.md`. Outline:
`docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md`, stage S6.

This plan stands alone. A builder needs this file, the brief, and the core plan
(`OPS_CORE_PLAN.md`, stages S1 to S3), which owns the names used here: the routes, the row
fields, the finding ids and aliases, the refusal codes, the events and the
shared pure module `ops-model.js`. S6 is built after S1 to S3 have landed.

Words used here. A **skin** is one way of drawing the network view and taking input: `gui`
(shown to players as Panels) or `cli` (shown as Terminal). A **control** is something the view
lets the player press. Each has a name in the list: `sign-in`, `open` and `observe` (their
`data-action` values today), `unplug` (the header button, marked `data-unplug` today), and the
core's `sweep`, `scan`, `check`, `confirm` and `use`. `confirm` has one label, Confirm
(section 5.2). An **offer** is one complete request the view
can make right now: a control's action plus every id the request needs. The list of controls and
offers is private to the network-view folder. It is a drawing aid for two renderers of one
screen; nothing outside that folder reads it, the server never sees it, and no other feature
registers with it. A **generator** is a pure function, one per simulated tool and each in its own
file, that turns an answer the server already sent into the lines that tool's console would print.
Generators only format output: they choose no control, make no request and hold no state.

## 1. What this adds and why

### 1.1 In play

The network view opens when the player uses a foothold (a planted drop box, a joined Wi-Fi
network, an implant). It is one screen: network blocks holding rows for hosts and shares, with
buttons on the rows. On a network whose hosts declare services, the core plan adds Sweep on a
block, Scan on a host, service tiles with Check, findings with Confirm, and a panel of technique cards that the player uses on a finding by selecting or
by dragging.

S6 gives that screen a second face, on those networks only. A view that holds at least one block
the server marks `ops: true` gains a switch in its header between:

- **Panels** (`gui`): the rows, tiles, cards and buttons as the core draws them.
- **Terminal** (`cli`): a prompt and a scrolling log that simulate two real consoles. The
  player types `nmap -sn office_lan` and reads host lines in the form a network scanner prints
  them, types `nmap -sV files01` and reads a `PORT STATE SERVICE VERSION` table, types
  `nmap --script vuln -p 445 files01` and reads the script report of what the check found. Then
  `msfconsole` opens an exploit-framework prompt, modelled on Metasploit: `search`, `use` a
  module, `info`, `show options`, `set TECHNIQUE <card>`, `check` (which confirms the finding)
  and `run`, which ends in "session opened" when the technique works. The game's own short verbs
  (`sweep`, `scan`, `check`, `confirm`, `use <card> on f2`) are accepted as well. Nothing real
  runs: each typed command is parsed into one of the requests the buttons make, sent to the same
  server route, and the console text is a different drawing of the same answer.

A sweep and a service scan are the same single request and answer in both skins. In Panels, a
progress bar labelled "Scanning" shows while the request is out. The Terminal prints the
simulated scanner's start line as soon as the request is sent, then, when the answer lands, the
full report built from it: host lines, the port table with service names and versions, and the
script output for a check. Every name in that output is one of three things: network layout the
scenario's author writes (a host address, a range, a service word such as `microsoft-ds`, a
banner); vulnerability detail (a script title, a module path, advisory ids, script output lines)
taken from an entry of the realism catalog, a file kept apart from every scenario, which a
weakness or decoy links to by a plain id (section 4.3); or a generic default built from the
fields the core already sends, so a scenario written before this feature still prints complete
output. The output is drawn, not a second request.

The player can switch at any time, in the middle of a task, and loses nothing: the hosts found,
the findings and the sessions held all live on the server. A finding is `f2` in
both skins, because the server gives it that alias.

Discovery is display only: it decides which rows the view lists and gates no sign-in, desktop
or share, so neither skin treats an unlisted row as a refusal. Actions are free; the only costs
are the refusals the server sends.

A view with no `ops` block has no switch and is always drawn as Panels, whatever the player has
picked elsewhere. Scenarios that exist today therefore look exactly as they do now.

### 1.2 What it teaches

Panels teaches the shape of the work (find hosts, find services, check them, use what you find).
The Terminal adds the reading skill and the tools' vocabulary: a learner types the command shapes
they will meet on a real lab machine (a ping sweep, a version scan, a script scan, the
framework's `use`, `set` and `run`), reads output laid out as those tools lay it out, and picks
the two lines that matter out of a port table. That makes the step to a VM lab shorter, while
everything stays inside the game. A learner who is put off by a prompt is never blocked by it,
and one who wants the prompt can have it on every ops network.

### 1.3 The four design rules

1. **One set of requests.** A skin never adds, removes or changes a request. Whatever one skin
   can ask the server for at a given moment, the other can ask for at that moment, the bytes sent
   are the same, and the server cannot tell which skin sent them. A request still waiting on
   its answer cannot be sent again from either skin. Each skin also shows, at every step, every
   piece of game information the other shows: the alias, status, needs, refusal words and every
   field the Panels print. The Terminal adds console dress (prompts, column headers, the tools'
   framing lines and the author's display names), and nothing the player needs to win is only
   in that dress.
2. **A renderer cannot reach the server.** Both renderers draw from the same rows and the same
   list of offers and hand a chosen offer back to the scene. Only the scene calls anything. A
   test fails the build if a renderer file names any of the ways out listed in section 5.2
   (the API client, `network-links.js`, `fetch`, `window.open*`, `window.start*`).
3. **Text about the game never names a control.** Spoken lines, objectives and hints say what to
   do ("sweep the office network"), never how one skin does it ("click Sweep", "type sweep").
4. **It stays a simulation.** Nothing runs against a real host and nothing leaves the game's own
   routes. The output holds no working payload, no shellcode, no real credential and no option
   that would configure one; the framework's options are `RHOSTS`, `RPORT` and `TECHNIQUE` and
   nothing else, and every address is in a private range. Banners and addresses are labels the
   scenario's author writes; module paths, advisory ids and script output are labels held in the
   realism catalog (section 4.3). All of them are validated as plain text (section 9). Every
   line is printed bare, in the tools' own layout, with no mark added. Generators format the
   answer and these labels;
   they never invent exploit content, and no console text teaches an attack step. The
   validators enforce the text rules of section 9 and cannot see a procedure written in plain
   words, so each side has a human check. A scenario's own `cli` strings are checked by the
   scenario design review and the lab-sheet step of every scenario that authors them. Catalog
   text is checked by the catalog task that adds or changes it, never by a scenario review,
   which does not open the catalog: the task ends with the catalog validator and a review of
   each changed entry against this rule (section 4.3, "Who opens it").

Rule 1 is what lets the feature ship without mission playtests of its own: a mission that is
solvable in one skin is solvable in the other because the requests, the server and the text shown
are the same. Section 11.2 has the tests that prove it on every build.

## 2. What the code does today

Read in the worktree on 2026-11-19; line numbers will drift. `NV` is
`public/break_escape/js/minigames/network-view/network-view-minigame.js`; other paths are under
`public/break_escape/js/` unless they start with `app/`, `test/` or `tools/`. Rows marked "core"
describe what the core plan adds before S6 is built.

| Area | Today | Where |
|---|---|---|
| The view | One scene, `NetworkViewMinigame`, registered as `network-view`, drawn in the shared console window, which supplies the title bar and the X | `NV:249-253` |
| Starter | One function starts the scene, with `title`, `footholdId`, `message` and `unplugJack` and no keyboard parameter. The view comes back from the sign-in screen and the share container through the same starter | `NV:962-976` |
| Data | The scene never reads scenario data. Its only source is `window.networkLinks.view(footholdId)`, which wraps `GET /network` | `NV:287`, `:403-405` |
| Controls | A delegated click listener finds `[data-action]` inside `[data-host-id]` or `[data-resource-id]`, looks the row up by id in the current rows and calls `act(row, action)`. The actions are `sign-in`, `open` and `observe`. Unplug is a second listener on `[data-unplug]` in the header, calling `unplugBox()`, which guards itself with `_unplugging`, finds the button with `querySelector`, disables it, writes `UNPLUGGING_TEXT` into it and puts a refusal beside it through `setUnplugNotice` | `NV:314-333`, `:829-852`, `:870-896` |
| Which control a row gets | `hostAction(row)` answers `not_responding`, `off`, `locked`, `open` or `sign-in`; `resourceAction(row)` answers `open`, `locked` or `observe`. `sign-in`, `open` and `observe` are pressable. A host row whose action is `locked` (a remote session that has locked) shows the lock badge and a Sign in button as well, so a locked session is never stranded. `not_responding`, `off` and a locked share are a status only | `NV:215-232`, `:687-698` |
| Drawing | HTML strings built in the scene through `escapeHtml` and `wordsHtml` | `NV:57`, `:71`, `:621-774` |
| Fixed text | Exported constants in the scene: `REMOTE_OFF_TEXT`, `NOT_RESPONDING_TEXT`, `NO_ROUTE_TEXT`, the down tags, `sessionKeptText`, `STALE_TEXT`, `linkOffText`, the two lock labels, `SHARE_LOCKED_TEXT`, `UNPLUG_TEXT`, `UNPLUGGING_TEXT` ("Unplugging...", the button's label while the request is out). A block reached through a pivot is headed "through <host>", with "(Locked)" when that session is locked | `NV:91-126`, `:626` |
| Colours, fonts and stylesheets | The view's stylesheet hard-codes its colours and uses no theme token; its text is the GNF pixel font at 18px. VT323 is self-hosted and is applied by the framework stylesheet to `code`, `kbd` and `samp` only, with no size. Listed one by one in the game page; the network view's is one of them | `css/network-view-minigame.css:9-10`; `css/minigames-framework.css:27`, `:290-292`; `css/fonts.css`; `app/views/break_escape/games/show.html.erb:103` |
| Refresh | Refetch every 5 s, widening to 15 s when idle; redraw only when the answer differs | `NV:86-90`, `:509-560` |
| Events | `network_viewed` and `network_host_opened`, emitted by the scene | `NV:448-463`, `:874` |
| Test snapshot | `getTestState()` returns `rows[]` and `networks[]`, each row with `id`, `kind`, `action` and a CSS `selector` of the form `[data-host-id="…"] [data-action]` | `NV:920-954` |
| Core: controls | Sweep on a discovery block, Scan on an unscanned host row in an `ops` block, Check on a service tile, and on a finding Confirm (one request, `POST /network/confirm`, one label). A Techniques panel lists the held cards. A use is made by selecting a finding, then a card, then Use, or by dragging a card onto a finding. Select-then-Use is the keyboard path and the drag is a pointer shortcut for it. Any finding a row lists takes a card, whatever its status; the server decides. A host row with a session draws an "admin" tag when the session's `access` says so. Every action of the screen (sweep, scan, check, confirm, use and unplug) goes through the scene's one `perform` path, which holds a pending guard keyed by action and target (for a use, the card and the finding together) and hands the message an action leaves, the unplug's included, to the renderer to draw. A desktop opened by clicking a PC held through a technique session is a remote view (a red frame, a line and a wipe), which belongs to the world side and which neither skin draws or changes | core plan sections 1, 5.3, 5.4 and 5.5 |
| Core: hooks | Each ops control carries `data-action`: `sweep`, `scan`, `check`, `confirm`, `select-finding`, `select-technique`, `use`. Each ops row carries `data-network-id`, `data-host-id`, `data-service`, `data-finding` (the alias) or `data-technique`. Only ops controls and rows carry them; Open, Sign in and Unplug keep the selectors they have | core plan section 5.5, "Hooks for tests and for the skin" |
| Core: finding | `{ id, alias, hostId, service, class, severity, summary, status }`; `status` is `unconfirmed`, `confirmed` or `false`. `alias` (`f1`, `f2`, ...) is given by the server in the order the player found them, is unique in the game and survives a reload. A confirmed finding carries `needs[]`, and `fixed: true` when its weakness is now fixed; the view then shows Fixed. `fixed` is worked out on each read and is never sent on an unconfirmed finding | core plan sections 0, 5.3 and 5.5 |
| Core: world-side marks | The compromised mark on a host row, a PC sprite or a planted jack (`systems/compromise-marks.js`), and the remote-view frame and line on a desktop opened through a foothold (`desktop-frame--remote-view`), belong to the world side. A skin only leaves them showing. `window.__test.access.compromiseMarks()` lists the applied marks | core plan sections 5.4 and 14 |
| Core: shared module | `network-view/ops-model.js`, pure, importing nothing: row merging, the works-on line, need labels, alias lookup (alias to finding id, technique id to the held card's item id) and `REFUSAL_TEXT`, the one table from a `reason` code to words. The core expects S6 to add its own exports to this file | core plan sections 5.5 and 12.2 |
| Core: answers | Sweep `{ network: { id, swept, hosts } }`; host scan `{ host }`; check `{ hostId, service, findings }`; confirm `{ finding }`; a use answers a session (the desktop then opens) or `keyringChanged: true`; a repeat adds `already: true`; a refusal is `{ success: false, reason, need? }` with `reason` a code. The codes are twelve from these routes, kept with the codes later plans add in `test/fixtures/files/ops_refusal_codes.json`; the desktop route adds none, and a technique session at a PC's own keyboard is served its desktop as a remote view | core plan sections 5.4 and 6 ("The refusal codes, in one list") |
| Core: events | Six, each also as `<name>:<id>`: `network_swept`, `network_host_scanned`, `network_service_checked`, `network_finding_confirmed`, `network_technique_used`, `network_technique_refused` | core plan section 5.5 |
| Core: test snapshot | `getTestState()` gains per host row `scanned`, `services`, `findings` and the session's `access`; per finding `alias`, `status`, `fixed` and `needs`; each with the selector of its action, built from the hooks; per block `swept` and `ops`; top-level `techniques` and `selectedFinding` | core plan section 5.5 |
| Display settings, URL preview value, mission config | `ui/display-settings.js` keeps one object in `localStorage` and copies it in memory at import. Every write rewrites the whole object and dispatches `be:display-settings-changed`, which `main.js` answers by re-running the canvas scaling. The game menu draws its selects in every game. `?ui_theme=` is read from the page URL and beats the player's stored theme. The page passes `uiTheme` to the browser from `mission.json` | `ui/display-settings.js:13`, `:24-34`, `:78-87`; `ui/game-menu.js:167-206`; `ui/display-settings.js:63-69`; `app/views/break_escape/games/show.html.erb:263` |
| Bootstrap | The scenario sent to the browser is a deep copy with named keys deleted, so a new top-level key that is not on the list passes | `app/models/break_escape/game.rb:2393`, `:2465-2508` |
| Keyboard | While any minigame is open the player module ignores game keys and the manager turns Phaser's keyboard off. `window.pauseKeyboardInput()` is a further single switch: the manager calls it only for a scene started with `requiresKeyboardInput`, a scene may call it itself when it starts, and the manager resumes input on every minigame end, whoever paused it | `core/player.js:102-123`, `:295-299`; `minigames/framework/minigame-manager.js:111-143`, `:510-512`; `minigames/pretext-prep/pretext-prep-minigame.js:89-94` |
| Tab | The manager traps Tab inside an open minigame in the capture phase and steps aside when the focused element is inside `[role="listbox"]` or `[data-own-tab-cycle]`. It checks on every Tab press | `minigames/framework/minigame-manager.js:362-367` |
| Phones | Nothing reads the visual viewport. The one precedent keeps the frame a fixed size and keeps the focused field in view with `scrollIntoView` | `utils/pc-monitor.js:220-227` |
| Test bridge | `window.__test.minigame` has `getState`, `clickControl(indexOrLabel)`, `clickText`, `type`, `pressKey`, `close`. A label is matched exactly, then by prefix, then by substring | `systems/test-bridge/minigames.js:92-118` |
| Playtest tools | `session-start.sh` takes its session tag from the digits at the end of the `--url` value and falls back to the process id. No `PLAYTEST.md` and no tool under `tools/playtest/` clicks a network-view control by number; they use selectors such as `[data-host-id="…"] [data-action="sign-in"]` | `tools/playtest/session-start.sh:26-34`; `scenarios/test_access_networks/PLAYTEST.md:78`, `:91` |

What already does part of the job, and what does not:

- The scene keeps the server behind `networkLinks` and the API client, and its click handling
  already reduces a press to a row and an action name. The offers list is that same pair, written
  down as data.
- `hostAction` and `resourceAction` already decide which control a row gets. They stay as they
  are and the offers list calls them. The one rule they do not carry, Sign in beside the lock
  badge on a locked session, is written into the control list (section 5.2).
- The core's `ops-model.js` is the one shared pure module for this screen. S6 reads rows,
  labels, aliases and refusal texts through it, adds its text exports to it (section 5.2) and
  adds no second model.
- The core's `perform` path and its pending guard (core 5.3) already stop a second press while
  the first is out, for every action of the screen, and leave the drawing to the renderer. S6
  builds neither. It needs three small additions to `perform`, which the core makes (section 14,
  item 4): an `echo` option, a hook after the guard accepts a press and before the request
  goes out, and a hook on every ending, run before the pending key is cleared. The Terminal
  renderer then sits behind that same path (section 5.2).
- Display settings are **not** reused for the skin. A write there fires a canvas resize behind
  the open view, the whole-object rewrite would clobber a value written from elsewhere, and its
  menu page is drawn in every game, while the switch must appear only on an ops network. The
  skin keeps its pick under its own storage key (section 8).
- The `ehr-terminal` minigame's stylesheet uses a different font and its own fixed palette, so
  there is nothing in it to share. There is no console font size to inherit and no handling of
  on-screen keyboards; sections 5.4 and 5.5 set both.
- The core already sends, for a scanned service, `name`, `label`, `port`, `product` and
  `version`, and for a checked finding `class`, `severity` and `summary`. Those are enough for
  every generator's default output. The core's validator already keeps `product` invented
  (`scripts/real_product_names.txt`) and warns on a `summary` that reads as a procedure. For the
  skin's `cli` strings and catalog entries, section 9's command-form error takes the place of the
  procedure warning, and the real-product list applies in the forms section 9 gives.
- Networks today carry `name`, `offWhen` and `wifi` and nothing address-like
  (`scripts/scenario-schema.json`, `properties.networks`, server-only). No host, network or
  service has an address, a protocol or a banner, so those are new optional fields (section 4).

## 3. Build stages

Four stages, built after the core's S1 to S3 are on main. Each is shippable alone and is proved
by tests and runs that exist when it lands. Total size M.

| Stage | Adds | Proved when it lands by | Size |
|---|---|---|---|
| K1 Split | The private control list and `offers()`; the Panels drawing moved out of the scene into a renderer that takes its buttons from the list; the fixed texts moved to a constants file; the text exports added to `ops-model.js`, so any line the Panels compose inline from answer fields has one source both renderers call; each renderer routed through the core's `perform` path and pending guard (core 5.3), which K1 neither builds nor replaces, with `offers()` marking an offer `pending` by reading the pending set and `pendingKey` that the core's scene exposes (core 5.3). K1 uses `perform` as the core built it; the echo and the two hooks of section 14, item 4 are first used in K2. No visible change, and no change to what a press sends | The existing network-view node tests and the core's, with no edit to an assertion; the byte comparison of old and new DOM over every fixture, a locked remote session and a block with a held technique session among them; the control-list tests of 11.1; a rerun of the scripted playtests of `test_access_networks` and `test_ops_access` | S |
| K2 Terminal | The skin choice and its storage; the header switch on ops views; the Panels "Scanning" bar for a pending sweep or scan (and its pixel-art rules, 5.4, with its rules in `network-view-minigame.css`), `SCANNING_TEXT` and `REQUEST_FAILED_TEXT` in `view-texts.js`, and the scene's `recordSent` and `recordResult` calls, made from the core's `onSent` and `onEnded` hooks (section 14, item 4); the Terminal renderer, grammar (the game verbs, the scanner command shape and the framework prompt), help and completion for every control in the list; the generator registry and the two generators, printing their defaults only; `window.__test.network`; the `--net-skin` option of the playtest tools; the feature scenario `test_ops_skin` | All node tests of 11.1 and 11.2, the generators' golden files for the defaults among them; the unchanged-scenarios check of section 10; the scripted beats of 11.4 run through the bridge once in each skin, with the request and server-record checks of the scenario's `PLAYTEST.md`; the screenshot set, the UI rules audit over the Terminal and the phone keyboard check of 11.6, looked at before the stage lands | M |
| K3 Scenario fields and catalog | The scenario field `networkView.defaultSkin`; the optional `cli` display fields on networks, hosts and services and the optional `realism` link on weaknesses and decoys, served by the core's answers (section 14, item 3) and declared in the schema here, with the validator (until K3 the core's closed blocks refuse `cli` and `realism`); the realism catalog's JSON schema, its validator `scripts/validate_realism_catalog.rb`, the generated index it writes, and `training_fixtures.json`, the only catalog file K3 adds, of invented entries for `test_ops_skin` (section 4.3); real entries come later, each in its own catalog task; `scripts/validate_realism_skin.rb` with every scenario check of section 9, the wording warning among them; `test_ops_skin` gains display fields on some of its objects and catalog links on its findings | The Rails and validator tests of 11.3; the golden files with authored fields and catalog entries; the no-exposure tests for the new fields; beat D1 of 11.4 | S to M |
| K4 Live proof | The live parity runner and the docs, which change nothing a player sees (README feature index N16, `docs/ACCESS_AND_NETWORKS.md`, `docs/test-bridge.md`) | The live parity run green on `test_ops_skin`; the leak scan clean | S |

## 4. Scenario fields

All added in K3, all optional. A scenario with none of them behaves as it did, and an ops
scenario with none of them prints the default console output described at the end of this
section.

### 4.1 The scenario's default skin

One top-level block, written `{ "networkView": { "defaultSkin": "cli" } }`. It is not a secret
and is sent to the browser.

| Field | Values | Meaning |
|---|---|---|
| `networkView.defaultSkin` | `"gui"` (default) or `"cli"` | The skin an ops view opens in for a player who has not picked one |

The block is closed (`additionalProperties: false`, `_` note keys allowed). It has no effect on a
view with no `ops` block. A scenario cannot force a skin: it sets a default and the player's pick
wins. The default lives in the scenario rather than in `mission.json` beside `ui_theme`, because
it concerns the scenario's network and is validated with it.

### 4.2 Console display fields (`cli`) and the catalog link (`realism`)

The scenario holds the network layout and nothing that names a real vulnerability. One optional
closed object named `cli` sits on three things the core already declares (networks, their hosts
and services), and one optional field, `realism`, sits on each weakness and decoy, linking it
to an entry of the realism catalog (section 4.3). Every field and every catalog entry is display
text for the Terminal only: no server check reads it, Panels never show it, and it changes no
answer the game gives. Each is served with the thing it belongs to, at the moment the core
already serves that thing (section 7), never earlier.

| Where | Field | Shape | Printed as | Default when absent |
|---|---|---|---|---|
| `networks.<id>.cli` | `range` | IPv4 CIDR inside 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16, prefix /16 to /30, overlapping no other network's range in the scenario | the sweep target and the "addresses scanned" count of the sweep summary | the network id; the summary counts hosts up only |
| `networks.<id>.cli.hosts.<hostId>` | `address` | dotted IPv4 inside `range` (so `range` is required with it), unique in the scenario | `(<address>)` after the host id in a scan report, and an accepted typed target | no address: the host id alone |
| a service's `cli` | `protocol` | `"tcp"` or `"udp"`; the service's `port` is unique on its host whatever the protocol (section 9) | the `<port>/<protocol>` cell, and `-sU` in the service's check line | `tcp` |
| a service's `cli` | `service` | a lower-case word, `^[a-z][a-z0-9-]{0,23}$`, such as `microsoft-ds` or `http` | the `SERVICE` cell | the service's `name` |
| a service's `cli` | `banner` | plain text, 1 to 80 characters | a `\|_banner: <text>` line under the port row | no banner line |
| a weakness or a decoy | `realism` | a catalog id, `^[a-z][a-z0-9_]{2,47}$`, naming an entry of the realism catalog; linked at most once in the scenario | nothing itself: the entry's `title`, `module`, `script`, `advisories` and `output` are served as the finding's `cli` object (section 4.3) | the generic defaults below |

Host addresses sit under the network rather than on the host, because a sign-in host is a room
object and room objects ride in the bootstrap, while `networks` is already server-only and the
address belongs to the network's range. The service fields are network layout: a protocol, the
tool's service word and a banner naming the (invented) product. None of them names a real
advisory or module; section 9 refuses advisory patterns, framework-path forms and named
vulnerabilities in every scenario `cli` string and in every `realism` id.

**Generic defaults, when a finding has no `realism` link.** The browser builds them from fields
the core already sends, the same way for a weakness and a decoy:

| Catalog field | Default |
|---|---|
| `title` | the finding label words of `ops-model.js` (class and severity) and the service's label or name |
| `module` | `auxiliary/scanner/<service word, - as _>/<class>_<alias>`, for example `auxiliary/scanner/microsoft_ds/default_creds_f2` |
| `script` | `<service word>-<class with _ as ->`, for example `microsoft-ds-default-creds` |
| `advisories` | none: no `IDs:` line and no references in `info` |
| `output` | none: no extra lines in the script report |

**A decoy's console text must be indistinguishable in form from a weakness's**: before a
confirm, the console may tell them apart by nothing the Panels do not also show. A catalog entry
has no kind: whether it is a real weakness or a decoy is the scenario's choice, made by which
object links it, so a decoy links an entry of exactly the same form as a weakness's (a real
scanner's false positive is a real advisory that does not apply). The validators enforce the
parts of this they can see (section 9), across the whole scenario rather than per service,
because the core allows a service with decoys and no weakness, and such a service has nothing
beside it to be compared with:

- links all or none: either every weakness and every decoy in the scenario has a `realism` link
  or none has (a linked module beside a default one gives the decoy away); among the linked
  entries, each optional catalog field (`advisories`, `output`) is held by all of them or by
  none, and a decoy's entry holds as many advisories and as many output lines as some weakness's
  entry in the scenario does; `banner` is on the service, so the same all-or-none rule runs over
  the services that hold at least one finding (a decoy-only service with no banner beside
  weakness services that all have one is the same tell);
- one module form: on a service, every linked `module` has the same first segment (such as
  `auxiliary` or `exploit`) and the same number of segments; across the scenario, every (first
  segment, number of segments) pair a decoy's `module` uses is also used by some weakness's
  `module`;
- no telltale word in any catalog string (checked over the whole catalog, since any entry may be
  linked from a decoy) or any service `cli` string;
- and a warning when a decoy's linked entry shares a content word with the decoy's own
  `falseBecause`.

The author is left with the choice of entries, as with the wording of a summary in Panels.

Every authored string, in the scenario or the catalog, is a label. It carries no command, flag,
path to a real file, payload, shellcode, escaped byte, encoded blob, credential, public address,
URL or markup, and the validators refuse each of those (section 9). It is plain text that the
Terminal sets with `textContent`. The generators print whatever label is served and have no rule
of their own about where it came from.

A minimal example, one network and one service with a weakness and a decoy:

```json
{
  "networks": {
    "office_lan": { "name": "Office network", "cli": {
      "range": "10.20.0.0/24", "hosts": { "files01": { "address": "10.20.0.15" } } } }
  },
  "hosts": { "files01": { "name": "File server", "network": "office_lan", "services": [
    { "name": "files", "port": 445, "product": "Brackley ShareServe", "version": "3.1",
      "cli": { "service": "microsoft-ds", "banner": "Brackley ShareServe ready" },
      "weaknesses": [ { "id": "guest_share", "class": "default_creds", "severity": "high",
        "realism": "share_guest_login" } ],
      "decoys": [ { "id": "old_banner", "class": "unpatched", "severity": "medium",
        "falseBecause": "The version string is stale; the vendor fix is installed.",
        "realism": "share_old_build" } ] } ] } }
}
```

The two linked entries live in the catalog (section 4.3), not in the scenario.

**What a scenario with none of these fields prints.** The same commands work and the output has
every section, filled from the core's fields: a sweep of `office_lan` prints `Nmap scan report
for files01` and `Host is up.` per host, ending `Nmap done: 1 host up`; a version scan prints
`445/tcp  open  files  Brackley ShareServe 3.1`; a script scan prints a `files-default-creds`
script heading over the finding's alias, status, label and summary; the framework lists the
finding as `auxiliary/scanner/files/default_creds_f2` with the label words as its title. No
address, no banner line, no `IDs:` line and no extra script output appear.

**Which skin an ops view is drawn in**, first that applies:

1. **A press of the switch on this page.** Kept in memory until the page is reloaded.
2. **A starting value in the page URL**, `?net_skin=gui` or `?net_skin=cli`, for previews and
   test runs. It sets the skin the view starts in and nothing more: the switch still works (item 1
   beats it). While a starting value is present, a press of the switch is not stored, so a
   preview link never changes a player's saved pick.
3. **The player's stored pick**, written by the switch when the URL has no starting value. Per
   browser.
4. **The scenario's `networkView.defaultSkin`.**
5. `"gui"`.

A view with no `ops` block skips all five and is Panels.

The player's pick beats the scenario because the skin changes nothing about the game, and a
player who needs buttons (a phone, a switch device, a screen reader set up for the list) must be
able to keep them. An event organiser has no setting in this stage; the URL value covers
previews and demos.

### 4.3 The realism catalog

The Terminal may print real advisory ids (CVE-style) and real framework module paths, as the
real tools do. Those strings are kept out of scenario files altogether, in one catalog of
vulnerability details that scenarios link to by a plain id. The catalog is the only place in
the ops layer where real advisory ids and real module paths live. An ops scenario's file, ink,
objectives, hints, mails and `PLAYTEST.md` hold none, nor do the examples in this plan, and the
validator refuses them there (section 9). Older scenarios that teach with real advisories (the
VM missions and labs) declare no `services` and are not read by that rule. This scope is
intended: when a VM mission later gains an ops network (declares `services`), its real ids move
to the catalog as part of that work and its other text names them no more.

**No banner in the catalog.** A banner stays a scenario service field and names no real
identifier and no real product. It is served with the host scan, before any check, so a banner
naming an advisory would give the finding away before the player has checked the service; and
it sits under the `VERSION` row, which prints the scenario's invented product. Only a checked
finding carries catalog text.

**Where it lives.** `config/break_escape/realism_catalog/`, one or more JSON files grouped by
topic (for example `file_sharing.json`, `web.json`), all loaded together. It sits outside
`scenarios/`, outside `public/` and outside the asset pipeline, so no static path serves it and
no route lists it. The engine gem ships it with the rest of `config/`. It is read on the server
only, by one loader, `lib/break_escape/realism_catalog.rb` (section 14, item 3), which reads
every file once on first use into a frozen map from id to entry and takes another folder in
tests. The loader never raises into a route: when a file does not parse or an id or a `module`
appears twice, it logs a server warning and loads an empty map, so every finding of every game
prints the defaults evenly and the check and confirm routes keep working. The catalog validator
is the hard gate for those faults, and it parses each file with a duplicate-key check, since a
plain JSON parse keeps the last of two equal keys in one file without a word. A duplicate id
inside one file is therefore the validator's alone to catch: the loader cannot see it and the
core's loader test does not list it. The browser never
receives the catalog, a file of it, or a link id: it receives, per finding, only the fields of
the one entry that finding links, at the stage section 7 gives.

**File form.** Each file is one closed object: `entries`, a map from catalog id to entry, and
`_` note keys for authors. Each entry is a closed object:

| Field | Required | Shape | Printed as |
|---|---|---|---|
| `title` | yes | plain text, 1 to 80 characters | the finding's title in the script report and in the framework's `search`, `info` and `use` lines |
| `module` | yes | a path label, `^[a-z][a-z0-9_]*(/[a-z0-9_]+){1,5}$`, at most 80 characters, unique in the whole catalog; its first segment is one of `auxiliary`, `exploit`, `post` (the framework's own list; the catalog validator refuses any other word) | the framework's module path in `search`, `use`, `info` and the prompt |
| `script` | yes | `^[a-z][a-z0-9-]{0,39}$` | the script name heading the finding in the script report |
| `advisories` | no | 1 to 4 strings, each in one of the forms `CVE-\d{4}-\d{4,7}`, `MS\d\d-\d{3}`, `GHSA-[2-9cfghjmpqrvwx]{4}(-[2-9cfghjmpqrvwx]{4}){2}` or `ZDI-\d\d-\d{3,5}` | one `IDs:` line in the script report (`\|     IDs: CVE:CVE-...`, each id after its scheme name) and a `References:` list in `info` |
| `output` | no | 1 to 6 lines, each plain text of 1 to 80 characters, saying only what a scanner reports: the state, a one-line description of what is wrong, and the disclosure date; never a step, a request form or a trigger | lines under the title in the script report, before the game's own `Finding`, `State`, `Risk` and summary lines |
| `_` keys | no | author notes | never served |

A catalog id is `^[a-z][a-z0-9_]{2,47}$` and describes the weakness in plain words
(`share_guest_login`, never an advisory number or a vulnerability's nickname), so the link a
scenario holds names no real identifier; the catalog validator refuses an id that matches an
advisory pattern or a nickname (section 9). An entry has no kind and no reference to any scenario:
whether it shows a real weakness or a decoy is decided by the object that links it, and one
entry may be linked from several scenarios, at most once in each.

A sketch of one file, with made-up ids (this plan holds no real ones):

```json
{
  "_about": "File-sharing services. Display text for the Terminal only.",
  "entries": {
    "share_guest_login": {
      "title": "ShareServe guest account left enabled",
      "module": "auxiliary/scanner/brackley/shareserve_guest_login",
      "script": "shareserve-guest",
      "advisories": ["CVE-2031-24117"],
      "output": ["Guest sessions are accepted on the file service."] },
    "share_old_build": {
      "title": "ShareServe 3.1 out-of-date build",
      "module": "auxiliary/scanner/brackley/shareserve_old_build",
      "script": "shareserve-build",
      "advisories": ["CVE-2031-24502"],
      "output": ["The reported build predates the vendor's update."] }
  }
}
```

**What an entry may hold.** Real advisory ids, in `advisories` and in the text of `title`,
`module`, `script` and `output`; real framework module paths in `module`; and real product names
only where the tools spell them inside a `module`, `script` or advisory id. Everything else
follows the brief's limits, and the catalog validator enforces the parts a pattern can see:

- no payload, shellcode, encoded blob, escaped byte or working exploit content, and no command,
  flag, URL, file path or credential (the text rules of section 9, run over every catalog
  string);
- no address of any kind: a dotted quad in a catalog string is an error, since every address the
  Terminal prints comes from the scenario's private range;
- no options: the entry has no field for one, so `RHOSTS`, `RPORT` and `TECHNIQUE` stay the only
  options `show options` prints, filled from the scenario and the player's held cards, and no
  payload or listener option can be written anywhere;
- `title` and `output` name no entry of the core's `scripts/real_product_names.txt`: products
  stay invented, and the `VERSION` column prints the scenario's invented `product`, so a real
  product name in the lines under it would contradict its own row.

**Agreement with the `VERSION` column.** The core's `product` and `version` are invented and are
printed in the version table. Two rules keep every line under that row in agreement with it, both
run by the scenario validator because they need the service: a service's `banner` names no
entry of the real-product list, and a version number directly after the service's own `product`
in the banner equals the service's `version`; and for each link, the linked entry's `title` and
`output` lines hold no version number directly after the linking service's `product` other than
its `version`. An entry that names a product and version therefore fits only services that match
it, and the validator says so at the link.

**The index.** The catalog validator also writes a generated index,
`docs/REALISM_CATALOG_INDEX.md`, outside the catalog folder. It is rewritten every time the
validator runs from the command line, provided the append-only comparison below passes (it
never rewrites the index otherwise), and is committed with the catalog. It holds no catalog
text, only, per id: the file it is in; its form, that is its key set (whether it has
`advisories` and `output`), its number of advisories, its number of output lines, and its
`module`'s first segment and number of segments (for example `share_guest_login:
file_sharing.json, advisories 1, output 1, auxiliary/4`); and the scenarios that link it. Ids
are plain words checked by the catalog validator, the first segment is one of the three
framework words the validator enforces, and the rest are numbers and scenario paths, so the
index leaks nothing the catalog holds. The separation test of 11.3 scans it too, treating it as a
scenario file and expecting zero hits (its `docs/...` scenario paths must also pass the `public/`
check). The catalog validator test fails when the committed index differs from what the
validator would write, with the message "rerun scripts/validate_realism_catalog.rb". The "linked
by" column changes whenever a `realism` link is added or removed, so the task that adds or
changes a link runs that command and commits the index (see "Who opens it"). Its output holds no
catalog text, so a link author may run it without opening the catalog.

**Edits after games exist.** A game row keeps the scenario copy from when the game was made,
but reads the catalog live, so a catalog edit reaches games made before it. The rule that keeps
that safe: the catalog is append-only. An id in the committed index is never removed or renamed
and its form never changes; new ids are only added. An entry no longer wanted is simply left
unlinked. Text inside an entry may be corrected when its form stays the same, and the task that
does so reruns the scenario validator over every scenario the index lists as linking it. The
catalog validator compares the catalog with the committed index before it rewrites anything: an
added id passes, a removed or renamed id or a changed form is an error, and then the index is
not rewritten, so rerunning the command cannot erase the baseline. Only additions and link
changes update the index. The catalog validator test makes the same comparison. A game made earlier therefore always finds each link it holds,
of the form its scenario was validated against.

**Who opens it.** Scenario review and fix agents (design reviews, dialogue reviews, puzzle and
room passes, playtests, validator runs) never open the catalog, and neither does an author or
fixer of `realism` links: they read the index, which gives each entry's form and where it is
linked, enough to meet the all-or-none, count-pair and module-form rules of section 9. The one
thing a link author or fixer runs is `scripts/validate_realism_catalog.rb`, after adding or
changing a `realism` link, to refresh the index's "linked by" column; they commit the index with
the scenario. A
finding is understood from its scenario fields (class, severity, summary, `falseBecause`,
needs); the catalog's text is console dress that is never needed to win (section 1.3, rule 1);
the scripted playtest beats name actions, not console text; and both validators report a
catalog problem by catalog id, rule and form, never by quoting the catalog's text. A link that
fails the `VERSION` agreement of this section is fixed by linking another entry of the same form
or by handing the entry to a catalog task, never by reading the entry.

Adding or changing catalog entries is its own task, briefed on its own. It ends with the
catalog validator (which also rewrites the index) and a review step: each added or changed entry
is read against section 1.3, rule 4, and the `output` scope in the table above (what a scanner
reports about the flaw, never how to use it). That review, not a scenario review, is the human
check on catalog text.

## 5. Engine behaviour

### 5.1 Server

S6 adds no route, no check and no state. The server-side changes are:

- the schema entry for `networkView`, the schema rows for the `cli` objects and the `realism`
  link (section 9), and the checks in `scripts/validate_realism_skin.rb`, all at K3. Until K3
  the core's closed blocks refuse `cli` and `realism`; the core copies the fields and resolves
  the link in its row builders from S1 and S2 (section 14, item 3) and tests that on
  test-only fixtures;
- the realism catalog's files, their JSON schema
  (`config/break_escape/realism_catalog.schema.json`) and its validator
  (`scripts/validate_realism_catalog.rb`), at K3 (section 4.3). The loader that reads the
  catalog is the core's (section 14, item 3);
- a test that `networkView` reaches the bootstrap (section 7);
- the `cli` fields, and a linked entry's fields as the finding's `cli`, riding in the core's
  existing answers beside the fields they belong to. The core's row builders copy them
  (section 14, item 3); S6 relies on that and writes no serialiser of its own. No answer
  gains a field for a scenario that declares none: an absent `cli` object, or a finding with no
  link, is left out of the answer, not sent as `{}` or `null`.

### 5.2 Client: the parts

All under `public/break_escape/js/minigames/network-view/`.

| File | Kind | Role |
|---|---|---|
| `ops-model.js` | pure, the core's | Unchanged in purpose: row merging, the works-on line, need labels, alias lookup, `REFUSAL_TEXT`. S6 reads through it and, in K1, adds exports to it as the core plan expects: `findingLabel(finding)`, `needLine(need)`, `useResultText(answer)`, and one function for each line the Panels would otherwise compose inline from answer fields (the Fixed mark, the "admin" tag of a session). The Panels renderer is changed to call them, so each such line has one source. |
| `view-texts.js` | constants, new | The scene's fixed texts (section 2, `UNPLUGGING_TEXT` among them), moved here so both renderers can import them. The scene re-exports them, so existing tests are unchanged |
| `view-controls.js` | pure, new | `CONTROLS`, the private control list below, and `offers(view)`: every offer open right now, in display order; and `LOCAL_ACTIONS`, the `data-action` values that only select (below) |
| `skin-choice.js` | new | `chooseSkin(inputs)`, pure, implementing the order of section 4; `readPick(storage)` and `writePick(storage, name)`, which touch storage only when called |
| `network-view-minigame.js` | scene | Keeps what it has: load, refetch, the handlers (`act`, `unplugBox`, the core's calls), every event, the way back, the test snapshot, and the core's `perform` path with its pending guard and the `pending` set and `pendingKey` it exposes (core 5.3), with the `echo` option and the `onSent` and `onEnded` hooks of section 14, item 4. New: it mounts one of two renderers, gives each `ctx.perform(offer, echo)`, which leads into that path, and sets the two hooks to call `recordSent` and `recordResult` |
| `network-view-panels.js` | renderer, new | Today's HTML and the core's, moved. Its `data-*` hooks are unchanged. It exports `DRAG_EVENTS`, the event names its drag listens for, in order, for the tests and the bridge |
| `network-view-terminal.js` | renderer, new | Prompt, log, quick commands |
| `terminal-grammar.js` | pure, new | `parse(line, offers, view, mode)`, `complete(line, offers, view, mode)`, `commandFor(offer, view)`, `helpFor(verb, mode)`. It reads the game verbs, the scanner command shape and the framework commands (section 5.3, "Grammar"); `mode` is the renderer's prompt mode and the framework's selected module and `TECHNIQUE`. A finding's alias is resolved with the core's alias lookup over `view`; the grammar holds no alias table of its own |
| `terminal-format.js` | pure, new | `recordSent`, `recordResult`, the log helper, and `formatListing(view)` for `show`. It asks the registry which generator formats an offer and adds no tool wording of its own |
| `cli-gen/registry.js` | pure, new | `GENERATORS`, a frozen map from a control's action to one generator module (`sweep`, `scan` and `check` to the scanner, `confirm` and `use` to the framework), and `generatorFor(action)`. Actions with no entry (`sign-in`, `open`, `observe`, `unplug`) are printed by `terminal-format.js` in the plain layouts of section 5.3 |
| `cli-gen/scanner-output.js` | pure, new | The simulated network scanner, modelled on nmap: `started(offer, view)` and `result(offer, answer, view)` for a sweep, a version scan and a script scan |
| `cli-gen/framework-console.js` | pure, new | The simulated exploit framework, modelled on Metasploit: `started` and `result` for `check` (a confirm) and `run` (a use), and the local listings `search`, `info`, `showOptions` and `sessions`, each a function of the view alone |

Each generator file exports the same shape: `id`, `started(offer, view)`, `result(offer, answer,
view)` and `TEMPLATES`, the frozen list of every fixed string it can print. Each returns an array
of lines; a line is an array of `{ text, cls? }` spans, where `cls` is one of a closed set of
CSS classes (`prompt`, `head`, `ok`, `bad`, `note`). A generator imports only `ops-model.js`,
`view-texts.js` and its own defaults; it never reads the DOM, storage, the clock or a random
source. A later tool (a password cracker's console, for instance) is one new file and one
registry entry; nothing else changes.

S6 adds no second model: no second set of rows, no alias scheme, and no copy of a label or a
refusal text. Its own pure code is the control list, the grammar, the plain layouts and the
generators.

**The control list** is one table in `view-controls.js`, keyed by the control's name. For every
control but `unplug` the name is the button's `data-action` value; `unplug` is the list's name
for the header button the Panels mark `data-unplug`.

| `action` | Drawn on | Panels label | Terminal line (`commandFor`) | The scene's handler |
|---|---|---|---|---|
| `sweep` | a discovery block not yet swept | Sweep | `nmap -sn <range or network id>` | the core's sweep call, `network_id` |
| `scan` | an unscanned host row in an `ops` block | Scan | `nmap -sV <host id>` | the core's scan call, `host_id` |
| `check` | a service tile | Check | `nmap -sV --script vuln -p <port> <host id>` | the core's check call |
| `confirm` | an unconfirmed finding | Confirm | `msf > use <module>; check` | the core's confirm call, `finding_id` |
| `use` | a held technique and a listed finding | Use | `msf > use <module>; set TECHNIQUE <technique id>; run` | the core's technique call, `finding_id` and `item_id` |
| `sign-in` | a host row whose action is `sign-in` or `locked` | Sign in | `signin <host id>` | `act(row, 'sign-in')` |
| `open` | a host row with a held session | Open | `open <host id>` | `act(row, 'open')` |
| `open` | a share row | Open | `open <share id>` | `act(row, 'open')` |
| `observe` | any other resource row | Look | `look <resource id>` | `act(row, 'observe')` |
| `unplug` | the header of a planted box's view | Unplug | `unplug` | `unplugBox()` |

Each entry holds the label, the game verb (`sweep`, `scan`, `check`, `confirm`, `use`,
`signin`, `open`, `look`, `unplug`), the tool line `commandFor` writes, the kind of row it is
drawn on and a one-line description used as the button's `title` and as the `help` text. The
generators are not in the list and do not decide which controls exist: the list draws the
buttons and accepts the commands, and the generators only format what comes back. The conditions in the "Drawn
on" column are the ones the scene and the core use today (`hostAction`, `resourceAction`, the
block's `ops` and `swept`, the row's `scanned`, the finding's `status`),
called from `offers()` and written nowhere else. A verb together with the kind of its target
names exactly one entry: `open` on a host and `open` on a share are two entries, told apart by
the target, and hosts, shares and resources share one id space.

**`sign-in` on a locked session.** `hostAction` answers `locked` for a remote session that has
locked, and the row then shows the lock badge and a Sign in button together (`NV:687-693`).
`offers()` therefore yields a `sign-in` offer for a host row whose action is `sign-in` or
`locked`. The lock badge stays a status; it is not a control.

**An offer** is `{ action, target, label, command, pending? }`. `target` holds the ids of the
request: `{ networkId }`, `{ hostId }`, `{ hostId, service }`, `{ findingId }`, `{ findingId,
techniqueId, itemId }`, `{ resourceId }` or `{}`. A `confirm` offer's `label` is always Confirm. `pending: true` marks an offer whose request is out (below).

**Which pairs a use may target, in both skins:** every technique the player holds a card for,
against every finding the view lists, whatever the finding's status (`unconfirmed`, `confirmed`
or `false`) and whether or not it shows Fixed. This is the core's rule (its section 5.4):
neither renderer filters by status, the request is sent, and the server answers. The server's
refusal is the lesson, so both skins must be able to reach every refusal code. A fit is never
worked out in the browser. The `itemId` of a use is the one the server's `techniques` entry
carries (the first held card of that technique in id order), so two cards of one technique are
one offer and send the same bytes from either skin.

**How a later control is picked up.** Other plans add a control the way the code does today: a
button with a `data-action` in the Panels drawing and a handler in the scene. Nothing asks them
to register it. Three tests fail until it has an entry in `CONTROLS`: the source check on every
`data-action` literal in `network-view-panels.js` (one that sends a request is a key of
`CONTROLS`; one that only selects and sends nothing is in `LOCAL_ACTIONS`, today the core's
`select-finding` and `select-technique`); parity test 1, which finds a call no offer explains;
and the text test, which finds the new label missing from the Terminal. In the Terminal the test
snapshot's selectors for those two (and for `use`, which is two presses) are null, and the
skin-blind test must not require them. The fix is one entry in
the list, plus a plain layout in `terminal-format.js` or a registry entry and generator file in
`cli-gen/` if the answer has a new shape. A plan that adds
a refusal code adds it to `ops_refusal_codes.json` and its words to `REFUSAL_TEXT`. One that
draws something new on a row (a badge, a tag) puts its words in `ops-model.js` and in the
Terminal's table in the same change, or test 9 fails. A control on another screen (a desktop, a
device, a cracking minigame) is outside this view and has one look.

**The renderer contract.** A renderer is a class with `mount(root, ctx)`, `render(view, offers)`,
`showResult(offer, answer)`, `noteChange()`, `unmount()` and `testState()`. `ctx` holds
`perform(offer, echo)`, `requestClose()` and `requestSkin(name)`, and nothing else. `echo` is
the command line the log shows for the press (below). A renderer that does not type passes no
echo: Panels call `perform(offer)` and never import the grammar, which K2 builds after the
Panels renderer. The scene's `onSent` hook, set at K2, records `echo ?? commandFor(offer, view)`,
so a Panels press still logs the offer's tool line. A renderer:

- imports only the pure modules of this folder and the escape helper;
- never names `fetch`, `ApiClient`, `networkLinks`, `window.open*` or `window.start*`;
- emits no game event. The scene emits all eight (the two of today and the core's six), so objectives and ink mappings see the same events from both
  skins;
- draws authored and server text with `textContent` (Terminal) or the existing escape helpers
  (Panels). The Terminal renderer, the grammar, the format module and the `cli-gen/` files
  never name `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`,
  `new Function`, or a string as the first argument of `setTimeout` or `setInterval`; they
  build elements with `createElement` and set text with `textContent`. The Terminal's log helper
  replaces each control character (U+0000 to U+001F, U+007F to U+009F), U+2028 and U+2029,
  and the bidirectional controls (U+202A to U+202E, U+2066 to U+2069) with U+FFFD before it sets
  a span's text, so a carriage return, an escape character or a right-to-left override in
  authored or server text (names and summaries are not limited to ASCII) cannot fake or reorder
  a log line or a prompt. Section 11.1 tests both;
- may keep local state that is not part of any offer: the Panels' selected finding and a drag in
  progress, the Terminal's half-typed line. Local state ends in one call of `perform` with one
  complete offer, or in nothing;
- is the only code that writes into the view's DOM once mounted. The scene draws the header
  switch and two states before any renderer is mounted, which stay as they are in both skins:
  the "Connecting..." line while the first load is out (`NV:302`) and the load-error line "The
  link did not answer. Close this and try again." (`NV:417`). Neither is a renderer's state;
  test 9 starts after the mount, and a failed first load shows the same scene-drawn line
  whichever skin was chosen.

**`perform`** is the core's (core 5.3): the scene's one path for every action of this screen and
the one way either skin causes a request. `ctx.perform(offer, echo)` passes the offer's action
and target into it, the same pairing the delegated click listener makes today from a button's
`data-action`, with the echo as the option of section 14, item 4. It sends to the route that
action already has; the server sees no difference, because the echo and the hooks never reach a
request.

S6 asks the core for three additions to `perform` and uses them as follows (the exact hook
points are in section 14, item 4):

- `perform(offer, { echo })`: the echo travels with the press and is used only by the hooks.
- `onSent(offer, echo)`, called once after the guard has accepted the press and added the key,
  before the request goes out. The scene sets it to `recordSent(log, offer, echo)`.
- `onEnded(offer, answer)`, called once on every ending (answer, refusal, failure with
  `answer = null`), before the pending key is cleared. The scene sets it to
  `recordResult(log, offer, answer)`. The core then clears the key and hands the answer to the
  mounted renderer's `showResult`, in that order.

Both hooks default to doing nothing, so `perform` without S6 behaves as the core built it, and
the core's guard tests run unedited.

- **Panels path.** A click finds the row by id, builds the offer and calls `perform`. The
  select-then-Use and drag gestures are the core's, and each ends in `perform` with a `use`
  offer holding a finding id and the technique's `itemId`. Select-then-Use is also the keyboard
  path; the drag is a pointer shortcut with no keyboard form of its own.
- **Terminal path.** The grammar resolves a line only to an offer in the current list. A line
  that names anything else is answered locally and sends nothing, which stops a typed line from
  probing for a host or a finding the view has not shown. A quick-command button holds an offer
  from the list it was drawn from, as a Panels button holds a row id.
- After the handler returns, the scene passes the server's answer to `showResult`, refetches as
  it does today and calls `render`.

**One press, one request: the pending guard.** The guard is the core's, built with `perform` in
the core's own stages (core 5.3), and this plan adds no second one. It sits in the shared path,
so it holds for both skins, every path and a switch between them; parity test 10 proves that.

- It is keyed by action and target, for a `use` the card and the finding together, and covers
  `sweep`, `scan`, `check`, `confirm`, `use` and `unplug`. `sign-in`, `open`
  and `observe` hand over to another screen or draw locally, as today, and are not guarded.
- A key is in the scene's pending set (the set and the key builder `pendingKey` are exposed by
  the core, 5.3; this plan reads them and never writes either) from the press until the answer
  or an error arrives.
  Called with a key that is in the set, `perform` calls no handler and sends nothing.
- While a key is in the set, `offers()` returns the offer under it with `pending: true` (the key
  comes from the core's `pendingKey`, so `offers()` and the guard always agree), and the scene
  redraws the mounted renderer when the set changes, as the core's scene does (core 5.3). Panels draw a pending control disabled. The Terminal
  draws its quick command disabled and answers a typed line for a pending offer with the fixed
  line "Still waiting for the last answer." (section 5.3), sending nothing.
- The set lives in the scene, so a switch of skin while a request is out carries the guard
  across: the other skin mounts with the control already pending. The answer is drawn by
  whichever renderer is mounted when it arrives, through its `showResult`. For the Terminal that
  is a redraw and scroll with no log write: the log already holds the echo (written when the
  press was sent) and the result lines (written by `recordResult`). A guarded request's log
  lines are written by the scene, not by the renderer, so the log stays complete whichever skin
  is showing (the scan output rule of section 5.3 sets how).

**Unplug's messages** are drawn by the renderer, as the core has them (core 5.5); `unplugBox`
touches no DOM. A `pending` `unplug` offer is drawn as a disabled control reading
`UNPLUGGING_TEXT`, the header button in Panels and the quick command in the Terminal. A refused
unplug reaches the renderer through `showResult(offer, answer)` like any other result: Panels
put the server's sentence beside the button, where it shows today, and the Terminal prints it.
Each skin has exactly one `[data-unplug]` element: the header button in Panels, the quick
command in the Terminal, whose header holds only the switch and the X.

**Switching.** `requestSkin` records the press (section 4), then the scene unmounts one renderer
and mounts the other on the same rows. No request is sent, the refetch timer keeps running and
the trip is not ended. The switch is a button in the header strip marked `data-skin-switch`,
labelled with the other skin's name ("Terminal" or "Panels"), in the same place in both skins.
The scene draws it only when some block of the view carries `ops: true`, and removes it if a
refetch leaves no such block.

**Names and starting skin.** "Terminal" is the word a learner meets for a prompt everywhere
else; "Console" is already this window's name. Panels is the default because every existing ops
scenario and playtest is written against it and it works on every device with no typing. Both
names are constants in `view-texts.js`, so a rename touches no test selector. The starter
(`NV:962-976`) works out the starting skin with `chooseSkin` and passes it to the scene as a
parameter; `skin-choice.js` reads `localStorage` and the URL only inside its functions, so a
node harness needs no stub at import.

### 5.3 The Terminal skin

**Layout**, inside the shared console window (title bar, subtitle and X unchanged):

```
+--[ Drop box: Desks, Spare wall port ]------------------[Panels][X]+
| Type help, or pick a command below.                               |
| $ nmap -sV files01                                                |
| Starting Nmap against files01                                     |
| Nmap scan report for files01 (10.20.0.15)                         |
| PORT     STATE  SERVICE       VERSION                             |
| 445/tcp  open   microsoft-ds  Brackley ShareServe 3.1             |
| |_banner: Brackley ShareServe ready                               |
| Service detection performed.                                      |
| $ msfconsole                                                      |
| msf > use auxiliary/scanner/brackley/shareserve_guest_login       |
| msf (auxiliary/scanner/brackley/shareserve_guest_login) > check   |
| [+] 10.20.0.15:445 - The target appears to be vulnerable.         |
| msf (auxiliary/scanner/brackley/shareserve_guest_login) > _       |
+-------------------------------------------------------------------+
| Commands:  [Check  nmap -sV --script vuln -p 445 files01] ...     |
+-------------------------------------------------------------------+
```

The sketch shows the arrangement only, with the authored `cli` fields of the example in section
4.2 and the linked catalog entry of section 4.3. Lines after a result stand in for the Panels' own sentences, which the Terminal prints word
for word (below).

- **Log**: `role="log"`, `aria-live="polite"`, pixel scrollbar, capped at 300 lines (oldest
  dropped). It is kept for the length of the trip in a module variable keyed by foothold id, so
  coming back from a sign-in screen shows the same log; it is dropped when the trip ends. It is
  never saved or synced. The first `recordSent` of the trip creates the log (a scene that has
  never mounted the Terminal creates it too), and from creation it holds the opening line and
  the 300-line cap, so a first Terminal mount after Panels-only play shows "Type help, or pick a
  command below." followed by the earlier echoes and results in order.
- **Prompt**: one real `<input type="text">` with a visible label, `autocomplete="off"`,
  `autocapitalize="off"`, `spellcheck="false"`. Enter runs the line: a line that resolves to an
  offer is handed to `perform` as the echo, and a local line is handled as the log rule of
  section 5.3 says. Up and down walk the trip's
  command history (20 entries).
- **Quick commands**: one button per offer for every control but `use`, in the order `offers()`
  gives, which is the order Panels draws its controls in. Each button shows the Panels label
  (`Open (<who>)` with the account where the Panels button has it) in a `<span>` and, in a `<code>` element, the line it stands for, with
  no text outside the two. It carries the same `title` text as the Panels control (the
  description in `CONTROLS`), so a hover gives the same words in either skin. It also
  carries the hooks the Panels control carries: the same row attribute on its item
  (`data-host-id`, `data-resource-id` and the core's row attributes) and the same `data-action`
  value, and Unplug carries `data-unplug`, so `[data-host-id="…"] [data-action="sign-in"]`
  finds one button in either skin. Pressing a button hands its line to `perform` as the echo,
  and `perform` performs its offer. A pending offer's button is disabled; a pending Unplug reads `UNPLUGGING_TEXT`.
- **Quick commands for a use**: two presses for one offer. There is one button per held
  technique, labelled with the Panels' Use label and the technique's name. Pressing it writes
  `use <technique id> on ` into the prompt and swaps the strip for one button per listed
  finding, labelled with its alias; pressing a finding completes the line and performs the
  offer, and the echo is the offer's tool line from `commandFor`, as for every other press. An X
  on the strip returns to the full list. This is the Terminal's form of select-then-Use.
- **Folding**: the list wraps and scrolls. It starts open, because nothing may need typing
  (section 5.5), and the player can fold it with one press. Folded, the strip carries the
  `hidden` attribute, the buttons stay in the DOM, and the bridge unfolds it before pressing
  one. `hidden` is the only way either renderer hides an element.
- **A change while the view is open** (a refetch finds a host gone, a session ended): one line,
  `-- network changed. show lists it again --`. The log is never redrawn; the quick commands
  are.
- Lines appear at once, with no typing effect, so there is nothing to seed and nothing for
  reduced motion to switch off. A table line holds one `<span>` per cell, padded with CSS and
  not with spaces, so a cell's text is exactly the field it prints.

**Targets.** A target is typed as the id the server sent: a network id, a host id, a service
`name`, a technique id, a share or resource id. The listing prints each id in its first column
beside the name Panels shows. A finding is typed and printed as the `alias` the server gave it
(`f1`, `f2`, ...), the same one the Panels show on the finding. The grammar turns an alias into
the finding id with the core's lookup in `ops-model.js`. The built id
(`<hostId>.<serviceName>.<weaknessId>`) is never typed and never printed, as in Panels. The
Terminal keeps no alias state: after a reload, in another foothold's view or after a switch of
skin, `f2` is the finding the server says it is.

**What each layout prints.** Every field the Panels show is printed by one of these, word for
word where it is a sentence or a status. Fixed sentences come from `view-texts.js` and from the
core's `ops-model.js`; the Terminal has no wording of its own for them. The answers to `sweep`,
`scan` and `check` are drawn by the scanner generator, the answers to `confirm` and `use` by the
framework generator, and `show` and the other actions by the plain layouts of
`terminal-format.js`. Each Panels sentence (a status text, an alias, a status word, a need's
"yes" or "no", the `falseBecause` text, the Fixed mark, the "admin" tag, the refusal words) is
its own span in whichever layout prints it, never merged into a generator's framing line, so
the piece comparison of section 11.2 still finds it.

| Layout | Printed when | Fields and texts |
|---|---|---|
| Link lines | `show`, and on opening | the view's `message`; the link-off sentence; the stale sentence; the unplug hint of a planted box's view ("You can unplug the box at its port (...)", `NV:813`); for each block its heading, the "through <host>" note and its "(Locked)" mark |
| Host table `HOST NAME STATUS` | `show` (plain layout); a sweep's answer (scanner generator, one report block per host) | host id; the shown hostname where it differs; name; in the status column the status text Panels shows on the row (remote sign-in off, powered down, no route, the down tags, Locked), left blank for a host Panels shows only a button on; the "Session kept" line; a held session's account (the `<who>` of the Panels' Open button) and the "admin" tag where Panels draw it, from the same `ops-model.js` export |
| Service table | `show` for a scanned host (plain layout, `SERVICE PORT PRODUCT VERSION`); a host scan's answer (scanner generator, `PORT STATE SERVICE VERSION`) | service `name`, `label` when it differs, port, product, version; in the generator's table also the `cli` protocol, service word and banner, or their defaults |
| Findings list | `show` for a checked service (plain layout); a check's answer (scanner generator, script report) | alias, the finding label (class and severity words), `summary` and status; in the generator's report also the `cli` script name and title, or their defaults, and the `advisories` and `output` lines when the finding's `cli` holds them |
| Finding detail | a confirm's answer (framework generator, after `check`); `show` for a settled finding (plain layout) | alias and status; for a confirmed finding each need with its label and "yes" or "no"; for a false one the `falseBecause` text; the Fixed mark for one that carries `fixed` |
| Technique list `TECHNIQUE WORKS ON` | `show` | technique id, `name`, `summary`, the core's works-on line |
| Share and resource table; Look | `show`; an `observe` | id, name, kind label, "on <host>", the lock label and the locked-share sentence; for a look, the resource's `observations` and the notice, as Panels shows them |
| Use result | a use's answer (framework generator, after `run`) | the result sentence for a session (then the desktop opens, as from Panels), for a credential (`keyringChanged`) and for `already`; on a refusal the `REFUSAL_TEXT` words for the `reason` code, with the need's label for `need_unmet`. A use that opens a desktop opens it as the core draws it, with the remote-view frame and line, which the Terminal leaves as they are |
| Pending | an `unplug` while its request is out | `UNPLUGGING_TEXT`, the Panels button's label for that state, on the quick command (the log holds only the echo, written by `recordSent`) |
| Refusal | any other refused request | the `REFUSAL_TEXT` words for the code, for each code in `ops_refusal_codes.json`. The unplug refusal is the one refusal on this screen that arrives as a server sentence (`out.message`, `NV:850`); it is printed as Panels shows it, through `textContent` |

**Scan output.** A sweep and a service scan are one request and one answer in both skins. While
the request is out (`pending: true` on the sweep or scan offer), Panels show a progress bar
labelled "Scanning" on the block or host row, and remove it when the request ends, whether by an
answer, a refusal or a failure. A pending `check`, `confirm` or `use` gets no bar, on purpose:
its control is drawn disabled, as the core has it, and a builder adds no bar for it. The
Terminal prints the generator's `started` lines when the
request is sent, as ordinary scrollback that stays in the log like the output of any typed
command; the generator's `result` lines print after the answer arrives.

*What the log is written by.* Printing is driven by two events, never by drawing. The scene
calls `recordSent(log, offer, echo)` once, from the `onSent` hook of `perform`, after the
pending guard has accepted the press and before the request goes out, and
`recordResult(log, offer, answer)` once, from the `onEnded` hook, when the request ends
(section 14, item 4). Both are pure functions in `terminal-format.js` that append lines to the
foothold's log (the module variable of section 5.3, keyed by foothold id). The scene calls them
for every guarded request, from either skin and whether or not the Terminal is mounted, so the
log is complete in every order of switches; Panels draw their own result from the same
`recordResult` call, through `showResult`. A press the guard rejects reaches neither function.
For a guarded request the echo is written only by `recordSent` and the result only by
`recordResult`; the Terminal renderer writes neither, and its `showResult` is a redraw and
scroll with no log write. The renderer writes only the echo and reply of a local line (`help`,
`show`, `clear`, a typo, an unknown or ambiguous word, a rejected press, the "Still waiting"
reply, and any other line that sends nothing), through the same log helper. A mount, a redraw or
a refetch while a key is pending prints nothing. `echo` is the player's typed line, or for a
quick command the command line the offer stands for (`commandFor`). A Panels press passes no
echo, and the `onSent` hook fills in `commandFor(offer, view)`, so the log reads the same from
every input:
`$ nmap -sn lan_a` comes first, then the `started` lines. `recordSent` writes the echo and then,
for an action with a registry entry, that generator's `started(offer, view)` lines, which use
only ids and labels the view already shows; an action with no entry writes just the echo.
`recordResult` writes the generator's `result(offer, answer, view)` lines, or for an action with
no entry the plain layout of the table above.

*How a request ends.* A refusal is an answer: `recordResult` prints the Refusal row's words (and
Panels show the same words), and no failure line. A network failure, meaning the request threw
or the client gave no reply, reaches `showResult` as `answer = null`. The core has no generic
failure sentence (the only one in the scene is the unplug-specific one at `NV:850`, "The port
did not respond. Try again."), so `REQUEST_FAILED_TEXT` is added to `view-texts.js`, the single
line `No reply came back. Nothing finished.`. Every failed request shows it in both looks,
Panels as the notice on the control's row and the Terminal as one log line, in place of a table.
The one exception is a failed unplug (`answer = null`): both looks show the existing unplug
sentence, which `unplugBox` keeps, the header notice in Panels and one log line in the Terminal,
and not `REQUEST_FAILED_TEXT`. A request that throws sets the same notice and line as one that
gives no reply.

*Where a request ends.* `perform` ends in one place, a single `finally`-shaped path, in this
order, on the answer, refusal and failure paths alike (the order section 14, item 4 asks the
core for): `onEnded`, which calls `recordResult`, then the clear of the
pending key (which removes the bar and re-enables the control, and in the Terminal makes the key
no longer pending for the next typed line), then `showResult`. Because the log is written
first, a redraw the clear triggers already sees the new lines. The unplug that ends the trip runs the same
path before `complete(false)`. Both functions do nothing when the foothold's log is gone (the
trip ended and the log was dropped), so a late `recordResult` writes nothing and creates no
entry.

*Skin switches.* The `started` lines were printed once, when the request was sent, and a switch
never prints them again. A skin mounted while a key is pending shows its waiting state without
new log lines: the bar in Panels; in the Terminal the `started` lines already in the log, with
the quick command disabled. A request sent from Panels and then viewed in the Terminal has its
echo and `started` lines in the log from the moment of sending. When the answer lands in Panels and the
player returns to the Terminal, the log already holds the table, or the refusal words or the
failure line, because `recordResult` ran when it landed. The answer is drawn once: the log gets
its table or line once, and Panels draw their result once.

The `started` lines are drawn, never requested: they add no request, wait for no second answer,
use no field of the answer and run no timer past the request's own wait. Their only variables
are ids and labels of the offer's own target as the view lists it (never the text the player
typed), set as plain text. Both skins end on the same answer, and the player who skips the
output loses nothing.

**Scanner output** (`cli-gen/scanner-output.js`, modelled on nmap). In the forms below `<host>`
is the host id, `(<address>)` is printed only when the host has an `address` (section 4.2), and
every other value is a field of the view or the answer or a default of section 4.2.

- `started`, for all three actions: `Starting Nmap against <target>`, where the
  target is the range (or the network id) for a sweep and the host for a scan or a check. A
  check adds `Running vuln scripts on <port>/<protocol> (<service word>)`.
- **Sweep result.** For each host row of the answer, in the answer's order: `Nmap scan report
  for <host> (<address>)`, then `Host is up.`, then one line per Panels field of the row (name,
  the shown hostname where it differs, the status text, the "Session kept" line, the account and
  "admin" tag), each its own span. A host whose Panels status is a down state (powered down, no
  route, a down tag) prints `Host seems down.` in place of `Host is up.` and is not counted as up.
  The run ends `Nmap done: <N> IP addresses (<n> hosts up) scanned`, where `<N>` is the size of
  the range worked out from its prefix and `<n>` the count of hosts up; with no range it ends
  `Nmap done: <n> hosts up`. "1 host" and "1 IP address" take the singular.
- **Version scan result** (a host scan). `Nmap scan report for <host> (<address>)`, `Host is
  up.`, the header `PORT STATE SERVICE VERSION`, then one row per service in the answer's order:
  `<port>/<protocol>`, `open`, the service word, and `<product> <version>`. Under each row an
  `| id: <name>` line holds the service `name` the player types as a target (with `(<label>)`
  where the label differs), and a `|_banner: <banner>` line follows when a banner is authored; the
  last of these lines under a row starts `|_`, as the tool marks the end of a script block. The
  run ends `Service detection performed.` and `Nmap done: 1 IP address (1 host up) scanned`. A
  `-p` on a version scan is noted (Grammar, below) and does not narrow the table, so Panels and
  Terminal list the same services.
- **Script scan result** (a check). The report line, `Host is up.`, the header `PORT STATE
  SERVICE` and the checked service's row, then for each finding of the answer: `| <script>:`,
  `|   <title>`, the `|     IDs: <scheme>:<id> ...` line when the finding's `cli` holds
  `advisories`, one `|     <line>` per entry of its `output`, then `|     Finding: <alias>`,
  `|     State: <status>`, `|     Risk: <finding label>` and `|_    <summary>`, the prefixes and
  each Panels piece in separate spans. A check
  that found nothing prints the Panels' words for an empty check as a note line. The run ends
  `Nmap done: 1 IP address (1 host up) scanned`.
- No timestamps, latencies, MAC addresses, OS guesses, closed-port counts or traceroutes: the
  answer holds none of them, and nothing is invented to fill the space.

**Framework console** (`cli-gen/framework-console.js`, modelled on Metasploit). The Terminal has
two prompt modes. The shell mode is where it starts, with the prompt `$`. `msfconsole` (local,
sends nothing) enters framework mode: it prints `Metasploit Framework console` and
`Type help for the console's commands.`, and the prompt becomes `msf >`, or `msf (<module>) >`
while a module is selected. `back` clears the module; `exit` or `quit` leave framework mode.
Each finding the view lists is one module, named by its `cli.module` (from its linked catalog
entry) or the default of section 4.2; weaknesses and decoys are listed alike.

| Command | Sends | Prints |
|---|---|---|
| `search [word]` | nothing | a numbered table `#  Name  Alias  Description` of the modules whose path, title, alias, host or service contains the word (all of them with no word), in the view's finding order |
| `use <module, alias or search number>` | nothing | selects the module; a target the view does not list answers with the list of modules, the same answer whether or not the id exists elsewhere |
| `info` | nothing | the selected module's path and title, its target (`<host> (<address>)`, port, service word), a `References:` list of the `cli.advisories` ids when there are any (ids only, no links), and the finding's alias, status, label and summary as the Panels show them |
| `show options` | nothing | a table `Name  Current Setting  Required  Description` with exactly three rows: `RHOSTS` (the address, or the host id, of the module's host), `RPORT` (its port) and `TECHNIQUE` (the set card's technique id, or blank), then the held techniques by id and name |
| `set TECHNIQUE <id>`, `unset TECHNIQUE` | nothing | `TECHNIQUE => <id>` for a technique the player holds (a unique prefix is accepted); any other id answers with the held list. `set` of any other name answers `RHOSTS and RPORT come from the module in this simulation.` for those two and `No such option in this simulation.` for the rest, including any payload option |
| `check` | the selected finding's `confirm` offer | `started`: `[*] Checking <host>:<port>`; `result`: below |
| `run` or `exploit` | the `use` offer for the selected finding and the set technique | `started`: `[*] Trying <technique id> against <host>:<port>`; with `TECHNIQUE` unset, the local line `Set TECHNIQUE first. Held: <ids>` and nothing is sent |
| `sessions` | nothing | one row per held session in the view's rows: host, account and the "admin" tag, from the same `ops-model.js` exports the Panels' Open button uses |

With no module selected, `check`, `run`, `exploit`, `info` and `show options` send nothing and
answer `Select a module first: use <module>`. In framework mode `help`, `show` with no
argument (the game listing, as in the shell mode), `clear` and the `Tab` completion work as in
the shell mode; `show options` is the table above, and `show` followed by anything else
(`show payloads`, `show targets`, `show advanced`) answers `Not part of this simulation.` and
sends nothing. The game verbs and the nmap form are shell-mode lines. `;`, more than one
request on a line, more than one target, pipes and redirects follow the line rules of the
Grammar below, in both modes.

Framework results, with `<host>` replaced by the address where the host has one:

- **confirm, confirmed**: `[+] <host>:<port> - The target appears to be vulnerable.`, then the
  finding detail of the layouts table (alias, status, each need's label with "yes" or "no", the
  Fixed mark), one span per piece.
- **confirm, false**: `[-] <host>:<port> - The target is not vulnerable.`, then alias, status and
  the `falseBecause` text.
- **use, session**: `[*] Session opened on <host> as <account>` with the "admin" tag where the
  Panels draw it, then the Panels' result sentence (`useResultText`) as its own span; the desktop
  opens as from Panels.
- **use, credential** and **use, already**: `[+]` followed by the Panels' result sentence.
- **refusal**, for either: `[-]` followed by the `REFUSAL_TEXT` words for the code (with the
  need's label for `need_unmet`). **Failure**: `REQUEST_FAILED_TEXT`, as for every request.

**The echo of a framework request.** A `check` or `run` typed at the `msf` prompt echoes as
typed. A press of a quick command or a Panels control for `confirm` or `use` echoes the
one-line form from `commandFor`, `msf > use <module>; check` or `msf > use <module>; set
TECHNIQUE <id>; run`, and changes neither the prompt mode nor the selected module.

**Mode state.** The prompt mode, the selected module and `TECHNIQUE` are the Terminal
renderer's local state, which the renderer contract allows: they are never stored, never sent
and dropped on unmount. A typed `check` or `run` still ends in one call of `perform` with one
offer from the current list; a module or technique the list no longer offers (the finding
settled, the card spent) answers locally and sends nothing.

**What it may print**: constants from `terminal-format.js`, `view-texts.js` and `ops-model.js`;
each generator's `TEMPLATES`; the ids, aliases and fields of the view answer and of a result;
the `cli` fields served with them (a linked catalog entry's fields among them) and the defaults
of section 4.2; counts computed from the
answer and the range (hosts up, addresses in the range, search numbers); `REQUEST_FAILED_TEXT`;
and the player's own line. Nothing else: no invented host, port, service, version or filler
row, and no random text.

**Text only the Terminal has.** Everything the Terminal prints that Panels never shows is in one
exported list, `TERMINAL_ONLY_TEXT` in `terminal-format.js`, and none of it is about the game's
state:

| Entry | Text |
|---|---|
| Fixed lines and marks | the opening line "Type help, or pick a command below."; the prompt marks `$`, `msf >` and `msf (<module>) >`, the block cursor and the prompt's visible label; the strip label "Commands:" and the label of the use strip's X; the change line "-- network changed. show lists it again --"; the pending line "Still waiting for the last answer."; the line-rule answers "One action at a time.", "One target at a time in this simulation." and "Pipes and redirects are not part of this simulation."; the player's own echoed line |
| Generator text | each generator's `TEMPLATES` (framing lines, `[*]`, `[+]`, `[-]` and `\|` prefixes, table headers, the `IDs:` and `References:` labels, the framework's local answers); the served `cli` strings (a linked catalog entry's among them) and the defaults of section 4.2 built from the core's fields. No template carries a mark such as "(simulated)": every framing line is printed bare, as the tool prints it |
| Table headers | `HOST`, `NAME`, `STATUS`, `SERVICE`, `PORT`, `PRODUCT`, `VERSION`, `TECHNIQUE`, `WORKS ON` and the headers of the findings, share and resource tables of the plain layouts |
| Help | the output of `help`: verb names, their argument forms and the verb aliases (the descriptions are the Panels' `title` texts and are not on this list) |
| Command line | a verb from `CONTROLS` followed by ids or aliases the view lists: the `<code>` part of a quick command, and the line a use button writes into the prompt |
| Grammar answers and notes | the fixed parts of every answer and note the grammar prints (below): the answers to a line that does not resolve, and the notes on lines that do (`Ignored in this simulation:`, the `-p` and `-sV` notes, the protocol note of `-sU`, `-sn only finds hosts...`, `Name a port with -p:`, `Every host here is already listed.`, the `-iL` answer) |

`REQUEST_FAILED_TEXT` is shared with Panels and is not on this list. A reachable host's state
word, a finding's alias, `UNPLUGGING_TEXT` and every
result sentence are not on this list: they are Panels text and must match it.

**Grammar.** A line is `verb [target ...]`.

- **Line rules, in both modes.** `;` splits a line into commands, run in order: at the
  framework prompt, `msf > use f2; set TECHNIQUE phish; run`. A line whose commands would send
  more than one request answers `One action at a time.` and runs none of it. A local command that
  fails stops the rest of the line. A command that names more than one target (`nmap -sV files01
  web01`, which the real tool accepts) answers `One target at a time in this simulation.` and
  sends nothing. A token `|`, `>`, `>>` or `<` anywhere on the line answers `Pipes and redirects
  are not part of this simulation.` and sends nothing.
- **What a target is.** A target is one operand set, whose shape each verb fixes:

  | Verb | Operand set |
  |---|---|
  | `sweep` | one network id or range, or none (above) |
  | `scan`, `signin`, `open`, `look` | one host, share or resource id (a host may be named by its address) |
  | `check` | one host and one of its services, `check <host> <service name or port>`; the nmap form names the host and gives the service with `-p` |
  | `confirm` | one finding alias |
  | `use` (shell mode) | one technique id and one finding alias, `use <technique> on <finding>` |
  | `unplug` | none |

  A command with more operands than its verb's set answers `One target at a time in this
  simulation.` So `use phish on f2` and `check files01 445` are one target each, and
  `scan files01 web01` is two.
- **One line, one request.** Every target the grammar accepts names exactly one thing: ids share
  one space (section 9 refuses a network id equal to a host, object or resource id), a host's
  `port` is unique on it, and addresses and ranges are unique in the scenario (section 9). So
  every command line `commandFor` writes, and every line the log echoes for a press, parses back
  to exactly one offer. If two offers still match a line (a fixture the validator would refuse),
  the grammar lists both and sends nothing; it never picks one.

- Verbs: one for each control (`sweep`, `scan`, `check`, `use`, `signin`, `open`, `look`,
  `unplug`, and `confirm`), and five local ones that
  send nothing: `help [verb]`, `show` (print the current listing), `clear`, `exit` (close the
  view, as the X does) and `panels` (switch skin). Each verb alias goes to exactly one verb:
  `login` and `connect` to `signin`; `ls` to `show`; `run` to `use`; `quit` to `exit`.
- `sweep` with no target is accepted when exactly one block offers a sweep.
- **Blocks with no sweep on offer.** A block of an open network (the core's default, every row
  listed from the start), a discovery block already swept, and a block that is not `ops` all
  offer no sweep, as Panels draw no Sweep there. `sweep` or `nmap -sn` naming such a block sends
  nothing and answers locally with the block's host lines in the sweep report's form, built from
  the rows already listed: each host prints `Host is up.` or `Host seems down.` by the sweep
  result's down-state rule (scanner generator, below), and the run closes with the same `Nmap
  done:` line a sweep prints, counted the same way. Then comes the note `Every host here is
  already listed.`, which is printed whatever the hosts' states.
- **The nmap form**, in the shell mode: `nmap [flags] <target>`. A target that is a network id or
  its `range` resolves to that block's `sweep`. A host id or its `address` resolves to the host's
  `scan` when the line has no `--script`, and to a `check` when it has `--script <anything>`; the
  check's service is the one whose port `-p` names (ports are unique on a host, so `-sU` never
  changes which service is meant; `commandFor` writes it before `-p` for a service whose
  `protocol` is `udp`). When the protocol the line implies disagrees with the service's (`-sU`
  naming a tcp port, or no `-sU` naming a udp port), the check still goes to that service and one
  note line gives its real protocol: `<port> is a <protocol> port here.` With no `-p` and one
  service that offers a check, that service is taken; with more than one, the local answer `Name
  a port with -p:` lists the ports on offer.
- **Flags that change the meaning.** `-sn` on a host target sends nothing and answers `-sn
  only finds hosts. Use nmap -sV <host> to list its services.` A network target or range with
  `-sV`, `-sS`, `-sT` or `-A` prints one note line, `Versions are listed per host: nmap -sV
  <host>.`, the way an ignored flag's note is printed, and sends the sweep, because the sweep's
  answer holds no services. Flags that take a value are `-p`, `--script`, `-oN`, `-oX`, `-oG`,
  `-oA`, `--top-ports`, `--min-rate`, `--max-retries` and `-e`, so their value is never read as
  the target. The known flags (`-sS`, `-sT`, `-sU`, `-sV`, `-sC`, `-A`, `-O`, `-Pn`, `-n`, `-v`,
  `-vv`, `-T0` to `-T5`, `-sn` and the value flags) are accepted with no comment beyond the
  protocol note above; any other flag prints
  one note line, `Ignored in this simulation: <flag>`, through `textContent`, and the line still
  runs. `-iL` answers `Reading targets from a file is not part of this simulation.` and sends
  nothing. A `-p` on a version scan prints the note `The version scan lists every service here;
  -p is ignored.` The flags change nothing that is sent: a sweep, a scan and a check carry the
  same ids from the nmap form, the game verbs, a quick command and Panels.
- **The framework form**, in framework mode: the commands of the framework table above. `check`
  resolves only to the `confirm` offer of the selected module's finding and `run` only to the
  `use` offer for that finding and the set technique; a finding with no such offer prints its
  row's status text, as below.
- **Mode words.** `exit` and `quit` close the view in the shell mode and leave framework mode in
  framework mode; `run` is the alias of `use` in the shell mode and the framework's `run` in
  framework mode. A line that begins with a prompt mark is read in that mark's mode: a leading
  `$` is dropped, and a leading `msf >` makes the rest a framework line run against a module
  selection local to that line, leaving the renderer's mode and selection as they were. That is
  how a quick command's `<code>` line, or one pasted from the log, parses back to its offer.
- Forgiving: case and extra spaces are ignored. A verb, an id, an alias or a technique id may be
  shortened to any prefix that is unique among what is on offer (`sig fin` runs `signin
  fin_pc01`). An exact match always beats a prefix: with hosts `web` and `web01`, `web` is the
  host `web`; with findings `f1` and `f10`, `f1` is `f1`; with techniques `phish` and
  `phish_sms`, `phish` is `phish`. Addresses and ranges are matched exactly only, never by
  prefix, as a real scanner reads them: `nmap -sV 10.20.0.1` names no host when the hosts are
  `10.20.0.15` and `10.20.0.16`, and answers as for an unlisted target. The word `on` is
  allowed and ignored.
- A line that does not resolve sends nothing and costs nothing. An unknown verb answers with the
  nearest verb. An ambiguous prefix lists the matches. A target that names something the view
  lists, but which has no offer for that verb (a host with remote sign-in off, with no route or
  powered down given to `signin`; a locked share given to `open`; a settled finding given to
  `confirm`), prints that row's status text, the same sentence Panels shows on the row, so both
  skins give one explanation of one state. Only a target the view does not list answers with
  the list of what that verb can be used on, and that answer is the same whether or not the id
  exists somewhere unseen. These answers echo the player's own text, always through
  `textContent`. A typo can never spend a sign-in attempt or trip a lockout, because
  only a line that resolves to a current offer reaches a handler.
- A line that resolves to a pending offer prints the pending line and sends nothing. Enter on
  an empty prompt does nothing, so a held Enter key cannot repeat the last line.
- Tab completes the token under the cursor to the longest common prefix and lists the matches
  in the log on a second press. The manager's Tab trap runs first and steps aside only for an
  element marked `data-own-tab-cycle`, so the prompt carries that attribute while it holds text
  and drops it when empty. With an empty prompt Tab moves focus as usual, and a keyboard user
  can reach the quick commands, the switch and the X.
- `help` prints each verb with the one-line description its Panels button has as its `title`.
  Both come from `CONTROLS`. In framework mode it lists the framework's commands, and `help nmap`
  lists the accepted flags and target forms. `check` means two things, and `help` in each mode
  says which: in the shell mode "check a service for weaknesses (nmap --script vuln)", in
  framework mode "confirm the selected module's finding".

### 5.4 Pixel-art UI rules

| Rule | How the Terminal skin meets it |
|---|---|
| Pixel fonts only | The log and the prompt are VT323 at 16px, the font's own pixel grid. Quick-command buttons keep the `.minigame-button` look and its GNF font, as the Panels buttons have, with the command part in a `<code>` element, which the framework already sets in VT323. Press Start 2P stays on the title bar. The size is checked in the K2 screenshots at desktop and phone widths |
| 2px borders, no radius | The prompt box, the quick-command buttons and the switch use the `.minigame-button` look; the cursor is a solid block |
| Device frame | The view is already the link device's console in the shared console window. The Terminal is that console's other mode, inside the same frame |
| X closes, no Cancel | The shared X and Esc close it. `exit` is a second way in, not a Cancel button. The finding strip of a use has an X |
| One look per concept | The switch looks the same in both skins and sits in the same place. Both skins use the view's existing colours: the Terminal adds no palette and no theme tokens, because the Panels use none. The generators' span classes (`prompt`, `head`, `ok`, `bad`, `note`) map onto colours the view already uses, and the table cells stay VT323 16px like the rest of the log |
| Crisp text | No text shadow, glow or scanline overlay on the log |
| Panels "Scanning" bar | A 2px border with square ends (the same border and square ends as `.minigame-button`, which it is not; no radius), the label "Scanning" in the GNF pixel font, and an indeterminate fill, because no progress is known: a block of stepped segments that jumps from cell to cell (`steps()` timing, no smooth easing, no tween), running only while the request is out. Under `prefers-reduced-motion: reduce` the bar is static (a fixed striped fill, no movement). The row carries `aria-busy="true"` and the bar has `role="progressbar"` with no value, so it reads as indeterminate. The bar adds no palette: it uses the view's existing colours |

The Terminal's rules and the bar's rules (including its `@media (prefers-reduced-motion:
reduce)` block) go in the existing `css/network-view-minigame.css`, so the game page needs no
new stylesheet link. The "Scanning" label is the constant `SCANNING_TEXT` in `view-texts.js`. The UI rules audit (`tools/playtest/ui-rules-audit.mjs`) reports the
network view as not audited, because the surface needs a game that has a network. K2 adds a
network-view surface that the audit opens in a live `test_ops_skin` game after the box is
planted, once in each skin.

### 5.5 Typed input and accessibility

- Nothing in the game needs typing. Every offer has a quick-command button, so the Terminal
  works with a pointer, a switch device or a phone's touch screen alone. Panels is one press
  away, the player's pick wins over the scenario's default, there are no time limits and a
  mistyped line costs nothing.
- The log is a live region, so a screen reader reads each result once. The prompt has a label.
  Focus returns to the prompt after a command and after a switch to the Terminal.
- Under 600px wide the quick commands sit below the log, which takes the rest of the height.
- **Phones.** The frame keeps one size when the on-screen keyboard opens, and the prompt is kept
  in view with `scrollIntoView` when it takes focus and after each result, as the PC monitor
  frame does. Nothing reads the visual viewport. K2 checks this on a real phone or the Android
  emulator, with a screenshot of the prompt above the keyboard.
- **Game keys.** The Terminal renderer calls `window.pauseKeyboardInput()` in `mount`, because
  the manager's own pause runs only for a scene started with `requiresKeyboardInput`, which the
  network view is not. Coming back from the sign-in screen mounts the renderer again and pauses
  again. Nothing resumes on a switch back to Panels: game keys are ignored while any minigame is
  open, and the manager resumes input when the view closes.
### 5.6 Spoken lines, objectives and hints

Rule 3 of section 1.3 binds authors: text a player hears or reads about the task names the
action and the target ("Sweep the office network." "Check the web service on the file server.")
and never says click, press, button, type, command, prompt or terminal about a network action.
Control help belongs to the engine, per skin, and is not spoken: the Terminal's first line and
`help`, and the Panels buttons' labels. A validator warning (section 9) catches skin-specific
wording in scenarios that use the ops fields. No spoken line is added or changed by this stage,
so there is no voicing cost.

### 5.7 Determinism

The skin holds no state the server reads and makes no rolls: for the same view answer and the
same offer, both skins send the same request, and the Terminal's output is a function of the
view answer, the offer, the result and the player's line. The generators are pure: they read no
clock and no random source, so the same answer always prints the same lines, which is what lets
section 11.1 compare them with golden files.

## 6. Server routes

None added, none changed. The scene's handlers use the routes that exist when S6 lands:
`GET /games/:id/network?foothold=` (load and refresh), `POST /network/unplug`, the existing
sign-in, desktop and container routes, and the core's `POST /network/scan` (sweep and host scan),
`POST /network/check`, `POST /network/confirm` (one route and one body for both labels) and
`POST /network/technique`. Every core route also takes `foothold`. The scene's handler adds it
from the view it has open; an offer does not carry it, so no renderer can name another foothold.

The server receives no parameter that names the skin, and no route may branch on one. A
controller test in section 11.3 pins this. The `net_skin` value in a page URL is read by the
browser only.

## 7. What reaches the browser, and what never does

Two things change. `GET /scenario` (the bootstrap) sends `networkView.defaultSkin`, which holds
nothing to withhold. The core's network answers carry the authored `cli` fields, and for each
linked finding its catalog entry's fields, beside the objects they belong to, each only once the
player has earned that object (section 14, item 3):

| `cli` field | Served in | From when |
|---|---|---|
| `networks.<id>.cli.range` | the view's block for that network (`GET /network`) | whenever the block is listed |
| `networks.<id>.cli.hosts.<hostId>.address` | `address` on the host row, in `GET /network` and, on a discovery network, in the sweep answer | with the host row, whenever the core lists that row as discovered: on an open network from the first answer; on a discovery network from the sweep. A held-session row the core lists on an unswept discovery network carries no `address` until the sweep |
| a service's `cli` (`protocol`, `service`, `banner`) | the service, in the host scan answer and in `GET /network` | once the host is scanned |
| a weakness's or a decoy's linked catalog entry (`title`, `module`, `script`, and `advisories` and `output` where the entry has them), resolved on the server | `cli` on the finding, in the check answer, in the confirm answer's finding and in `GET /network` | once the service is checked; the same keys for a weakness and a decoy |

- The `realism` link id and the catalog itself never reach the browser. The server looks the
  link up when it builds a checked finding and copies the entry's fields by name; no route
  lists, searches or serves the catalog, and an entry no scenario finding has reached in this
  game is never sent.
- None of the `cli` fields is in the bootstrap or in any room answer: the core removes
  `networks` and `hosts` from the bootstrap by name (`WITHHELD_SCENARIO_KEYS`) and `services`
  from room objects (`WITHHELD_OBJECT_FIELDS`), and its no-exposure tests already check that the
  bootstrap and every room answer hold none of their strings. An absent `cli`
  object is left out of the answer, never sent as `{}` or `null`, and the browser builds the
  defaults of section 4.2 from fields it already has. A finding's `cli` is served on the finding
  whatever its status, so a decoy and a weakness arrive with the same keys.
- The core's leak collector, which lists the strings each stage may show, gains the `cli`
  strings at the stage their object is served (for a linked finding, the strings of its catalog
  entry, read from the catalog by the collector), so a string seen before its stage fails the
  core's leak test, and so does a link id, or the `module` of an entry the scenario does not
  link, at any stage. An address on an open network is staged with the view's first answer, under
  the collector tag `listed` (the tag the core uses for `range`); one on
  a discovery network with its sweep, including the address of a PC the player held a session on
  before the sweep.
- With no address, the Terminal prints the host id wherever an address would go (the scan
  report, `RHOSTS`, the framework's `<host>:<port>` lines). Because the address arrives with the
  row's discovery, the same host prints its id before the sweep and its address after it; the
  echo of a press is the `commandFor` line of the moment, which names the host id in both cases,
  so no line changes meaning.
- `networkView` holds a presentation choice only; the closed schema leaves nowhere to put a
  secret. The bootstrap filter deletes named keys and passes the rest, so the block arrives
  without a change to the filter. A model test pins that it does, and that a scenario without
  the block has no such key.
- The Terminal shows what the view answer and the results contain. That is what the Panels show,
  plus the `cli` fields, which are console dress and are never needed to win. The generators and
  `terminal-format.js` receive nothing else. Test 9 of section 11.2 checks both directions.
- **Ids.** The Terminal prints ids that the server has already sent for listed things: host,
  network, share, resource and technique ids, and service names. The Panels may not print all of
  them. Nothing new reaches the browser by this, and nothing is printed before the core's rules
  allow the row to arrive. A finding is printed by its alias only; its built id, which contains
  the author's weakness id, is printed by neither skin.
- **World-side marks.** The compromised mark and the remote-view frame belong to the world
  side (core section 14, item 6). Neither skin draws, hides or restyles them; the Terminal's host
  table shows the same marks the Panels' rows show, through the same `ops-model.js` export.
- A refusal from an ops route arrives as a `reason` code and never as prose. Both renderers turn
  it into words with the core's `REFUSAL_TEXT` in `ops-model.js`. The one server sentence on this
  screen is the unplug refusal's `message`, built before this plan; both skins show it as
  received, as plain text.

## 8. State and saved games

| State | Where | Size | Sent |
|---|---|---|---|
| The player's pick | `localStorage`, key `be_network_skin`, value `gui` or `cli` | one short string | never |
| A switch press on this page | a module variable | one short string | never |
| Terminal log and command history | a module variable, per trip | 300 lines, 20 commands | never |
| Folded or unfolded quick commands | the renderer instance | one boolean | never |
| Prompt mode, selected module and `TECHNIQUE` | the Terminal renderer instance, dropped on unmount | three short strings | never |

Nothing is added to `player_state`, to the sync sections or to any other stored or synced
state, so the delta rule has nothing to judge (the `cli` fields of section 7 ride on network
answers and are not stored). Findings and their aliases are the core's server
state and the skin keeps no copy. The pending set is in memory for as long as a request is out.
A reload reopens an ops view in the skin section 4 gives, with an empty log. A saved game from
before the feature behaves the same as a new one. A player who changes browser gets the
scenario's default until they pick again. A stored value that is neither `gui` nor `cli` is
ignored, and blocked storage leaves the switch working for the page.

## 9. Validator, schema and dungeon graph

**Schema** (`scripts/scenario-schema.json`, K3): a top-level `networkView` object,
`additionalProperties: false`, note pattern `^_`, one property `defaultSkin` with
`enum: ["gui", "cli"]` and a description naming its reader (`skin-choice.js`). It is structure,
not an id map and not free data. It is not marked `x-serverOnly`.

The `cli` objects and the `realism` link are declared here, at K3, as rows in the same shared
file, on the core's `networks.<id>`, `definitions.service`, `definitions.weakness` and
`definitions.decoy`. Until K3 those blocks are closed and refuse `cli` and `realism`; the core's
row builders copy the fields and resolve the link from S1 and S2 (section 14, item 3) and
test that on test-only fixtures that do not load the schema. The `cli` rows are closed
(`additionalProperties: false`, note pattern `^_`), have no required key, and carry a
description naming their reader (`cli-gen/`). A `_` note is for authors only: the core copies
each `cli` object and each catalog entry by its named keys, so a note never reaches the browser
and nothing in this plan reads one there:

| On | Properties |
|---|---|
| `networks.<id>` | `cli`: `range` (string, IPv4 CIDR pattern, max 18); `hosts`, an id map (`x-id-map: true`, keys plain strings of 1 to 64 characters, so a room-object id such as `kit_deviceA` or `P1` fits) of closed objects with one property `address` (string, dotted IPv4 pattern) |
| `definitions.service` | `cli`: `protocol` (`enum: ["tcp", "udp"]`), `service` (`^[a-z][a-z0-9-]{0,23}$`), `banner` (1 to 80 characters) |
| `definitions.weakness` and `definitions.decoy` | `realism`: string, `^[a-z][a-z0-9_]{2,47}$`, with a description naming its reader (the core's finding builder, through the catalog loader). Neither object has a `cli` property |

They inherit the server-only marks of the objects they sit in (`networks`, `hosts` and
`services` are already `x-serverOnly`), and the `x-servedBy` lists of those objects already name
the routes that serve them.

**Catalog schema** (`config/break_escape/realism_catalog.schema.json`, K3): the file form and
entry form of section 4.3, every object closed with note pattern `^_`, `title`, `module` and
`script` required, `advisories` an array of 1 to 4 strings each matching one of the four
advisory forms, `output` an array of 1 to 6 strings of 1 to 80 characters. It is not part of
`scenario-schema.json` and no scenario refers to it.

**Validators** (K3). Two new files:

- `scripts/validate_realism_catalog.rb`, with `check_realism_catalog(dir)`, checks the catalog
  on its own: the catalog schema, each file parsed with a duplicate-key check, ids and `module`
  values unique across all files, every rule of the table below marked **Catalog**, and the
  append-only comparison with the committed index (section 4.3). It reads each scenario's
  `realism` links, loading scenarios as `scripts/validate_scenario.rb` does, to fill the index's
  "linked by" column, and from the command line it rewrites `docs/REALISM_CATALOG_INDEX.md`. It
  runs from the command line, from a Rails test on every build (section 11.3), and at the end of
  every task that edits the catalog.
- `scripts/validate_realism_skin.rb`, with `check_realism_skin(json_data)`, required and run
  from `scripts/validate_scenario.rb` by one line beside the core's `check_network_ops`. It reads
  hosts, services and findings through the core's `NetworkModel` helpers and runs the rules
  marked **Scenario**. Only when the scenario has at least one `realism` link does it read the
  catalog, by calling `check_realism_catalog` on the catalog folder and then the core's loader;
  a scenario with no link never reads the catalog and never sees a catalog error. When that call
  finds a catalog rule error, the scenario gets one error naming the catalog file, "the realism
  catalog does not validate (file: <name>); catalog task: fix the catalog", and no link is
  checked against it. That error is not the scenario fixer's to clear: scenario fixers are told
  to leave it, not to open the catalog or edit scenarios for it, and to hand it to a catalog
  task. An index mismatch or an append-only fault is a catalog test failure only and is not
  treated as blocking here.

Neither validator's message quotes a catalog string. A catalog problem is named by file,
catalog id, field and rule. A link problem is named by the scenario path of the weakness or
decoy, its link id, the rule and the forms involved, in the index's terms, for example "decoy
`old_banner` links a (advisories 1, output 2, auxiliary/5) entry; weakness entries here are
(advisories 1, output 1, auxiliary/5)". Forms are numbers and one framework word, so the fixer
can pick a fitting entry from the index without opening the catalog. The ink half of the wording check runs in the dialogue lint the validator
already has.

In the table, a **text string** is a scenario `cli` string (`range`, an `address`, `protocol`,
`service`, `banner`) or a catalog string (`title`, `module`, `script`, each advisory, each
`output` line). A **prose string** is a `banner`, a `title` or an `output` line.

| Level | Runs in | Check |
|---|---|---|
| Error | Scenario | `networkView.defaultSkin` is not `gui` or `cli` (from the schema) |
| Error | Both | An unknown key in `networkView`, in any `cli` object, on a catalog file or on a catalog entry (closed blocks, with the usual "did you mean") |
| Error | Scenario | `range` is not inside 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16, or its prefix is outside /16 to /30, or it has host bits set, or it overlaps another network's `range` in the scenario |
| Error | Scenario | An `address` on a network with no `range`, outside the range, equal to its network or broadcast address, or used twice anywhere in the scenario |
| Error | Scenario | Two services of one host with the same `port`, whatever their `protocol`, so `-p` names one service |
| Error | Scenario | A key of `cli.hosts` that is not a host (a `hosts` entry or a sign-in object) on that network |
| Error | Scenario | A network id equal to a host, room object or resource id. The core's one id space covers hosts, objects and resources but not networks, and `nmap -sn <id>` must name one thing. It reads every scenario that declares `networks`, not only ops scenarios, so an id clash is caught before a scenario gains `services` and has to rename ids its ink and objectives already use; no shipped scenario has such a clash today, so section 10's unchanged output holds |
| Error | Scenario | Range all or none: on a scenario's discovery networks, one has a `range` and another has none. Either every discovery network has a range or none does; otherwise a range's presence would mark which networks hold content |
| Error | Catalog | An id or a `module` used twice across the catalog's files, or an id twice inside one file (a duplicate inside one file is the validator's alone, read by its duplicate-key parse; across files the loader also logs and loads an empty map) |
| Error | Catalog | The first segment of a `module` is not one of `auxiliary`, `exploit`, `post` |
| Error | Catalog | A catalog id that matches an advisory pattern or a nickname of the real-identifier row below (`ms31_017_share`, `tidepool_check`) |
| Error | Catalog | An id in the committed index that is missing from the catalog, or whose form differs from the index's (append-only, section 4.3) |
| Error | Catalog | A `module` of the default form of section 4.2: four segments, `auxiliary/scanner/<word>/<class>_f<n>`, where `<class>` is any value of the core's `class` enum, read from `scripts/scenario-schema.json` so a class added later is covered, and `<n>` a number. A linked module therefore never equals a default one, and since the catalog is the only place real module paths are kept, no default can stand for a real path the project holds |
| Error | Scenario | A `realism` link that names no catalog entry. The message gives the scenario path of the weakness or decoy and the link id |
| Error | Scenario | One catalog id linked from two weaknesses or decoys of the scenario |
| Error | Scenario | Links all or none. (1) Some of the scenario's weaknesses and decoys have a `realism` link and others have none; (2) among the linked entries, `advisories` is held by some and not by the others, or `output` is; (3) in a scenario with at least one weakness, a decoy's linked entry has a (number of advisories, number of output lines) pair that no weakness's linked entry in the scenario has; (4) `banner` is set on some of the services that hold at least one finding and not on the others, a decoy-only service included. So a default never prints beside a linked entry, an `IDs:` line or extra output never marks one kind, and a banner's presence says nothing about what the service holds, before a confirm |
| Error | Scenario | A decoy's module form differs from a weakness's, read over the linked entries' `module` values: on one service, the `module` paths of its findings do not all share the same first segment (`auxiliary` against `exploit`) and the same number of segments; or, in a scenario with at least one weakness, a decoy's `module` has a (first segment, number of segments) pair that no weakness's `module` in the scenario has. Defaults need no check: every default is `auxiliary/scanner/<word>/<class>_<alias>`, four segments under `auxiliary` for a weakness and a decoy alike, because neither the service word nor the core's `name` id pattern can hold `/` |
| Error | Both | A telltale word, as a whole word, case-insensitive: `decoy`, `fake`, `false`, `bait`, `patched` and `not vulnerable`, and the same words joined by `_` or `-` inside a `module` or `script`. Catalog: in every catalog string of every entry, ids included, linked or not, since any entry may be linked from a decoy and ids reach the index and link messages. Scenario: in every service `cli` string |
| Warning | Both | A weaker telltale word, as a whole word, case-insensitive: `real`, `true`, `fixed`, `safe`, over the same strings as the row above. These are also ordinary security and product words (a fixed session id, safe mode, Real-time, a product named True...), so the author decides; the message asks whether the word would tell a decoy from a weakness |
| Error | Scenario | A service `cli` string, or a string of a catalog entry the scenario links, that contains a password of the scenario (the core's rule at `scripts/validate_network.rb:519`, applied to these strings). The message names the field and the catalog id, never the string |
| Error | Both | A text string that holds a payload or command form: a shell metacharacter (`;`, `\|`, `&`, backtick, `$(`), a flag beginning with `-`, or, in a prose string, a path (defined below) |
| Error | Both | A path in a prose string. A token is a run of characters with no space. A token is a path when it starts with `/`, `~/`, `./` or `../` (`/etc/shadow`, `../../x`); when it holds a drive letter followed by `:` and `/` (`C:/Windows`); or when it holds `/` and splits on `/` into three or more parts (`etc/init.d/x`, `12/05/2019`), unless every part is letters only and the first part is not a system directory name (`etc`, `usr`, `var`, `bin`, `sbin`, `home`, `tmp`, `opt`, `root`, `proc`, `dev`, `boot`, `srv`, `mnt`, `lib`, `windows`, `winnt`, `users`), so `Read/Write/Execute` and `SSH/Telnet/FTP` pass and `usr/local/bin` fails. A token with exactly one `/` between two non-empty parts is a pair, not a path (`SMB/CIFS`, `TCP/IP`, `ShareServe/3.1`, `HTTP/1.1`, `Guest/anonymous`); a token with one `/` and an empty side (`SMB/`, `/24`) is a path; the credential rule below reads pairs. The rule is per field: `module` is a path label by design and is checked by its own pattern, its uniqueness, the module-form rules and the equal-segments check of the credential rule, and by no other path or pair rule; `service`, `script`, `range`, `address` and each advisory cannot hold `/` beyond the CIDR's one, by their patterns |
| Error | Both | A text string with a character outside printable ASCII (0x20 to 0x7E), a backslash (so no `\x31` or `A` escape), a `%` followed by two hex digits, `0x` followed by four or more hex digits, or `<` or `>` (markup) |
| Error | Both | An encoded blob in a text string: a run of 16 or more hex digits, or in a prose string a run of 24 or more base64 characters (`A-Z`, `a-z`, `0-9`, `+`, `/`, `=`) with no space that holds a digit, `+` or `=` |
| Error | Both | A credential-like string. In a prose string: every token is first stripped of leading and trailing `( ) [ ] { } " ' , ; .`, and the rules below read the stripped token, so `(admin/admin)`, `"root/toor"` and `admin/admin.` are read as `admin/admin` and `root/toor`; (1) two non-space runs joined by `:` with no space (`admin:admin`), except a private IPv4 address followed by `:` and a port of 1 to 65535 (`10.20.0.15:445`, the form the framework lines print); (2) a pair, that is a `/` pair (as defined above) or two non-empty runs joined by `=` with no space (`admin=admin`, `root=toor`), whose two sides are equal, case-insensitive (`admin/admin`), or whose right side is a common default password (`pass`, `password`, `passw0rd`, `toor`, `admin`, `root`, `changeme`, `default`, `letmein`, `secret`, `qwerty`, `123456`, `12345678`; `root/toor`, `user/letmein`), or whose left side is an account word (`admin`, `administrator`, `root`, `user`, `guest`, `sa`, `test`, `operator`, `service`) and whose right side is six or more characters and holds both a letter and a digit (`admin/Passw0rd1`, `admin/admin123`); so `Guest/anonymous`, `Service/1.0`, `Service/HTTP2`, `Guest/SMB1` and `Test/IPv6` pass; (3) `passwd`, `password`, `pwd` or `secret` followed by `=` or `:` and a token, with or without a space (`password=letmein`, `Password: letmein`; `Password: not required` also stops, and the message offers "no password needed"), and `user`, `username`, `login` or `pass` followed by `=` or `:` and a non-space token directly after it (`user=pass`, `login:root`), so `Anonymous login: allowed` and `Guest login: enabled` pass; (4) `key` or `token` followed by `=` or `:` with a non-space token directly after it (`key=abc123`, `token:abc`), so `SSH host key: RSA` and `API key: required` pass. In a `module`: two neighbouring segments that are equal (`x/admin/admin`); a `module` is never read for pairs, so `auxiliary/admin/smb/x` passes |
| Error | Both | A real host in a text string: a dotted IPv4 literal outside 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16 (in any field, not only `range` and `address`); `://` or `www.`; or a dotted name whose last part is letters only (`[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}`, case-insensitive) unless that last part is a reserved one (`local`, `internal`, `lan`, `test`, `example`, `invalid`). `module` cannot hold a dot, so the rule never reads it |
| Error | Catalog | Any dotted quad (`\d+\.\d+\.\d+\.\d+`) in a catalog string, private or not: every address the Terminal prints comes from the scenario's range |
| Error | Catalog | A catalog id, `title` or `output` line holding an entry of the core's `scripts/real_product_names.txt`, as a whole word (an id's `_` counting as a word break), case-insensitive. Products stay invented; a real product name may appear only where the tools spell it inside a `module`, `script` or advisory id |
| Error | Scenario | A real identifier in an ops scenario (one that declares `services`): a match of an advisory pattern, case-insensitive (`cve[-_]\d{4}[-_]\d+`, `can[-_]\d{4}[-_]\d+`, `ms\d\d[-_]\d{3}`, `kb\d{6,7}`, or `rhsa`, `dsa`, `usn`, `ghsa` or `zdi` followed by `-` or `_`; each pattern matches only where it is not preceded by a letter or digit, so `x_ms17_010` still matches and `forms31_017` does not; so the made-up `cve_2031_24117`, `ms31_017`, an article number and `RHSA-2031:1234` are caught); a framework-path form, a lower-case token that splits on `/` into three or more parts whose first part is `exploit`, `auxiliary`, `post`, `payload`, `payloads`, `encoder`, `nop`, `evasion` or `scanner` (the path rule above lets such a letters-only token pass, so this row catches it); or a named vulnerability from `scripts/real_vuln_nicknames.txt` (a short list beside the core's product list, added by this plan: a listed nickname and the like) as a whole word or as a part joined by `_` or `-`. It runs over every scenario `cli` string, every `realism` id and the scenario's other text (names, labels, products, versions, summaries, `falseBecause`, objectives, hints and mails; the ink half in the dialogue lint), and over each finding's default `module` and `script` as section 4.2 builds them when the scenario has no links, with the advisory and nickname patterns only (the framework-path form would match every default `auxiliary/scanner/...`). That last part catches a service word that is harmless alone and makes a match once joined, such as `usn` giving the default script `usn-default-creds`. Scenarios with no `services` are not read by this row, so the missions and labs that teach with real advisories keep their validator output. That scope is intended: a VM mission that later gains an ops network moves its real ids to the catalog as part of that work |
| Error | Scenario | The `VERSION` column and the lines under it disagree. A service's `banner` names an entry of the real-product list, or holds a version number (`\d+(\.\d+)+`) directly after the service's own `product` (one space or `/` between) that differs from the service's `version`; or, for each link, the linked entry's `title` or an `output` line holds a version number directly after the linking service's `product` that differs from its `version`. A version is read only in that position, and a dotted quad inside one of the scenario's ranges is never read as a version, so `10.20.0.15`, `TLS 1.0`, `HTTP/1.1` and `SSH-2.0` pass. The message names the service and the catalog id, never the entry's text |
| Warning | Scenario | A decoy's linked entry has a content word (four or more letters, not on a short stop list) in its `title` or an `output` line that is also in the decoy's own `falseBecause`, which would read as a hint before the confirm. The message names the decoy, the link id and the field, and quotes the shared word, which is also in the scenario's own `falseBecause` (already cleared by the real-identifier row), so the fixer knows what to reword; it quotes no other catalog text |
| Warning | Scenario | `networkView` or a `cli` object is set in a scenario where no host declares `services`: no view will be an ops view, so it has no effect |
| Warning | Scenario | Skin-specific wording: in a scenario that uses `services`, an objective, hint, mail or ink line that pairs a control word (click, press the, button, type, command line, prompt, terminal) with an action word (sweep, scan, check, confirm, sign in, technique) |

The wording check is a warning because it is a pattern match and will have false positives (an
NPC may mention a terminal in passing), and so is the weaker telltale-word check. The other
text rules are errors although some have false positives (`TCP:IP` written with a colon, where
`TCP/IP` passes; a four-part version that reads as an address). An error on a scenario string
names the matched fragment and the plain form that passes; an error on a catalog string names
the file, catalog id, field and rule, and quotes nothing.

**Dungeon graph**: no change. The skin adds no lock, key, node or edge, and the graph generator
does not read `networkView`. A test asserts that the generated graph for `test_ops_skin` is the
same with and without the block.

## 10. Effect on existing scenarios

Eight scenarios declare `networks` today: `test_access_networks`, `test_access_devices`,
`test_access_keyring`, `test_author_notes`, `demo_access_tour`, `lab_physical_pentest`,
`ca20_remote_and_mobile_working` and `ca20_remote_and_mobile_working_defend`. None declares
`services`, so the server marks none of their blocks `ops`, and for each of them:

| Change | Effect on a scenario with no ops network |
|---|---|
| K1 split of the scene | None visible. Same HTML, same `data-*` hooks, same events, same `getTestState()` fields and selector values, same request for a press. A second press of Unplug while the first is out is stopped by the core's guard, as before K1. The `skin` field of 11.5 is added on ops views only |
| Header switch, stored pick, URL starting value, scenario default, `networkView` block | Not drawn, ignored or absent: the view is Panels and the Terminal renderer is never mounted. The game menu is unchanged: the skin has no entry there |

Checks that prove it, across all eight and any scenario that later declares `networks`:

1. **Every recorded view, forced the wrong way** (`test/js/network-skin-unchanged.test.mjs`).
   The core plan records the `GET /network` answer of every foothold of each scenario that
   declares `networks` as golden fixtures under `test/fixtures/files/ops_unchanged/`, found by
   the key so a new scenario joins without an edit. Before K1 changes any code, a snapshot of
   the scene's DOM for each answer is committed under `test/js/fixtures/network-view/unchanged/`
   (a JS-side snapshot, not a second server golden mechanism). The test renders each answer with a stored pick
   of `cli`, a `?net_skin=cli` URL and a scenario default of `cli` all set at once, and asserts
   that the DOM equals the snapshot byte for byte, that no `[data-skin-switch]` element exists
   and that the Terminal renderer was not mounted.
2. `test/js/network-view.test.mjs` and the core's node tests pass with no edit to an assertion
   (their copy lists gain the new files).
3. The scripted `PLAYTEST.md` runs of every one of the eight that has one are rerun after K2
   with a stored pick of `cli` already in the browser, and pass unchanged. Once the game has
   loaded, the run calls `window.__test.network.storePick('cli')` (section 11.5), which writes
   the key with the same `writePick` the switch uses, and reloads before the first beat. No file
   is committed and the run works on whichever origin the test server has.
4. The validator's output and the graph for every scenario are unchanged; the core's
   `ops-unchanged-validator.test.mjs` already compares them with a snapshot. The scenarios that
   already hold real advisory ids (VM missions and labs) declare no `services`, so the
   real-identifier rule of section 9 does not read them.

The core's own ops scenarios (`test_ops_scan`, `test_ops_findings`, `test_ops_access`) are not
"existing" in this sense: K2 adds the header switch, and with no stored pick and no default they
open in Panels, so their scripted playtests run as written. They declare no `cli` fields and no
`realism` links, so in the Terminal they print the default output of section 4.2, built from
the fields the core already sends, and their answers carry no `cli` key.

## 11. Tests

### 11.1 Node tests (`test/js/`)

Fixture view answers live as JSON files in `test/js/fixtures/network-view/`, created in K1. The
tests below read every file in that folder, so a plan that later adds a fixture for a new field
or control gets these checks on it.

| File | Stage | Proves |
|---|---|---|
| `network-view-controls.test.mjs` | K1 | `offers()` for each fixture: order, targets, one offer per pressable control, every use pair, the `itemId` rule. A locked remote session yields a `sign-in` offer beside its lock status. An unconfirmed finding yields a `confirm` offer labelled Confirm. A settled finding yields no `confirm` offer. With a key in the pending set the offers under it carry `pending: true` and no other offer does; each `use` pair has its own key. `CONTROLS` is well formed: each entry has one label, one verb and one description, and a verb together with a target kind names exactly one entry. Every `data-action` literal in `network-view-panels.js` is a key of `CONTROLS` or an entry of `LOCAL_ACTIONS` (`select-finding`, `select-technique`), no value is in both, and `data-unplug` appears there once, for the `unplug` entry |
| `network-view-panels-same.test.mjs` | K1 | Each fixture rendered by the scene as it was (output saved as a fixture string before the split) and by the Panels renderer is equal byte for byte; a press on each control records the same call before and after. With the unplug's answer held, the header button is disabled and reads `UNPLUGGING_TEXT`, and a refused unplug shows the server's sentence beside the button, both as the saved output has them; the scene file contains no `querySelector('[data-unplug]')` and no `setUnplugNotice` |
| `network-skin-imports.test.mjs` | K1, K2 | The two renderer files and the pure modules import nothing outside the allowed list and do not contain `fetch(`, `ApiClient`, `networkLinks`, `window.open` or `window.start`. From K2 the `cli-gen/` files are checked too: each imports only `ops-model.js`, `view-texts.js` and its own defaults, and none names `Date`, `performance.now`, `Math.random`, `crypto`, `localStorage`, `document` or `window`. From K2 a source check over `network-view-terminal.js`, `terminal-grammar.js`, `terminal-format.js` and every `cli-gen/` file fails on `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function` and a string literal or template as the first argument of `setTimeout` or `setInterval` |
| `network-terminal-hostile.test.mjs` | K2, K3 | A hostile fixture whose every text field (host and network names, service `name`, `label`, `product` and `version`, `summary`, `falseBecause`, need labels, technique names, the view's `message`, the unplug refusal's `message`) and every served `cli` field (a finding's `title`, `module`, `script`, each advisory and each `output` line among them) is `<img src=x onerror=alert(1)>` followed by a carriage return, an escape character (U+001B), U+2028 and a right-to-left override (U+202E), fed straight to the generators and the plain layouts (bypassing the validator, which would refuse it) and rendered in both skins through test 9's sequence. After each step the Terminal's mount root holds only the elements the plan draws (`span`, `code`, `button`, `input`, `label` and the log's line containers), no attribute whose name starts `on`, and no `img`; each hostile string appears as literal text with its control characters shown as U+FFFD and no extra log line; the Panels output holds the same strings escaped, with no new element |
| `network-view-bridge.test.mjs` | K2 | `window.__test.network`: `state()` is equal in both skins apart from `skin`; `run` rejects a path of the other skin, an offer not in the list and a pending offer, and records no call; `storePick` calls `writePick` and presses nothing |
| `network-view-panels.test.mjs` | K2 | The "Scanning" bar: it shows on the block row for a pending `sweep` offer and on the host row for a pending `scan` offer, on no other offer (check, confirm, use, unplug), and is removed when the answer lands, when the request is refused and when it fails (`answer = null`), each its own case, and the pending key is cleared in all three; the bar has `role="progressbar"` with no value and the row `aria-busy`; its label is `SCANNING_TEXT` ("Scanning"); a failure draws `REQUEST_FAILED_TEXT` on the row (a failed unplug draws the unplug sentence as the header notice, and `unplugBox` sets it on a thrown request too). A node DOM test cannot evaluate a media query, so the reduced-motion rule is a CSS-text assertion: the `@media (prefers-reduced-motion: reduce)` block of `network-view-minigame.css` sets `animation: none` for the bar; the bar's CSS has no radius and a 2px border |
| `network-terminal-grammar.test.mjs` | K2 | Each verb and verb alias; ids, prefixes and the server's finding aliases, resolved through the core's lookup (a fixture whose findings arrive in an order different from their alias numbers still resolves `f1` to the server's `f1`); a built finding id is not accepted; `on`; `sweep` with no target; case and spacing; a verb that is not in `CONTROLS` returns the nearest-verb message and no offer; a line for a pending offer returns the pending line and no offer; unknown verb, unlisted target and ambiguous prefix return a message and no offer; a listed row with no offer for the verb (remote sign-in off, no route, powered down, a locked share, a settled finding) returns that row's status text from `view-texts.js` or `ops-model.js` and no offer; completion results. The nmap form: a network id and a range give the sweep; a host id and an address give the scan; `--script` with `-p` gives the check on that port, without `-p` the one checkable service, and with two checkable services the `Name a port with -p:` answer and no offer; value flags never become the target; each known flag gives no note; an unknown flag gives one `Ignored in this simulation:` note and the offer; `-iL` gives its answer and no offer; `-p` on a version scan gives the note and the full scan; every nmap line gives the same offer as the game verb for that target. The framework form: `msfconsole`, `back`, `exit` and `quit` change only the mode; `use` by module, alias and search number; `set TECHNIQUE` with a held id and a prefix, with an unheld id; `check` and `run` resolve to the same offers as `confirm f2` and `use <card> on f2`; `run` with `TECHNIQUE` unset returns its message and no offer; `;` with one request command returns that offer after the local commands, with two returns `One action at a time.` and no offer, in both modes. Line rules: two targets (`nmap -sV files01 web01`, `scan files01 web01`) return `One target at a time in this simulation.`; `|`, `>`, `>>` and `<` return the pipes answer; each sends nothing. Flag meanings: `nmap -sn <host>` returns its `-sV` pointer and no offer; a range with `-sV`, `-sS`, `-sT` or `-A` returns the sweep and the per-host note. Framework with no module: `check`, `run`, `info` and `show options` return `Select a module first: use <module>`; `show payloads`, `show targets` and `show advanced` return `Not part of this simulation.`; `help` in each mode gives that mode's meaning of `check`. A block with no sweep on offer (an open network's, a swept discovery block, a non-ops block): `sweep` and `nmap -sn` return the local host lines, a down host as `Host seems down.`, the `Nmap done:` line and the `Every host here is already listed.` note, and no offer. A udp service: `-sU -p <port>` gives its check with no note; `-sU` is a known flag; `-sU -p` on a tcp port and a plain `-p` on a udp port each give the check and one protocol note. Operand sets: `use phish on f2`, `use phish f2` and `check files01 445` are one target each and give their offer; `check files01 445 web01` and `confirm f1 f2` return `One target at a time in this simulation.`. Exact match over prefix: with hosts `web` and `web01`, `nmap -sV web` gives the scan of `web`; with findings `f1` and `f10`, `confirm f1` gives `f1`; with techniques `phish` and `phish_sms`, `set TECHNIQUE phish` sets `phish`; `web0` still resolves to `web01` as the unique prefix. A near-miss address (`10.20.0.1` beside `10.20.0.15`) and a near-miss range return the unlisted-target answer and no offer. **Round trip**: for every offer of every fixture, `parse(commandFor(offer))` returns exactly that offer and no other, in both modes and with the leading prompt mark, and every echo `recordSent` writes for a press parses back the same way; the round-trip fixtures include hosts `web` and `web01`, findings `f1` and `f10` and techniques `phish` and `phish_sms`; a fixture with two services on one port, one address on two hosts or a network id equal to a host id (built by hand, since the validator refuses it) returns the both-matches answer and no offer. Hostile input (markup, control characters, a 10,000 character line) returns no offer, and the "nearest verb" and "unknown target" answers that echo it are set as plain text |
| `network-terminal-format.test.mjs` | K2 | One layout per answer shape of section 2 (sweep, host scan, check, a confirm, each of the three use outcomes, each code in the core's `ops_refusal_codes.json`, `already`); every field in the table of 5.3 is printed. Log writing, by calling `recordSent` and `recordResult` on a log: each action with a registry entry writes its echo line and the generator's `started` lines at `recordSent`, before any answer, and the lines stay; an action with none writes the echo only; the `result` lines are written at `recordResult`, directly after those lines, once; a refusal writes the Refusal row's words and no failure line and no table; a failure (`answer = null`) writes `REQUEST_FAILED_TEXT` and no table; the same lines on every run; a quick-command press, a Panels press and a typed game-verb line each write the offer's `commandFor` echo (`$ nmap -sn <id>`, `msf > use <module>; check`) before the lines, and a typed nmap or msf line writes itself; the `started` lines name the resolved target from the view, set as plain text; a typed line with markup, or a 10,000 character target, that resolves to nothing writes no `started` lines and calls neither function; a press the guard rejects calls neither function; and the one request and one answer are unchanged by them. A failed request (`answer = null`) of each of `sweep`, `scan`, `check`, `confirm` and `use` writes `REQUEST_FAILED_TEXT` and no table, and a failed `unplug` writes the unplug sentence of `NV:850` and not `REQUEST_FAILED_TEXT`. A late `recordResult` or `recordSent` after the trip ends (the log dropped) writes nothing and leaves no log entry. The log is created by the first `recordSent`, holds the opening line and the 300-line cap from creation, and lists earlier echoes and results in order after the opening line. The switch-order cases (which need the scene, both renderers and a held fake answer) are in `network-skin-parity.test.mjs`, not here |
| `cli-gen-scanner.test.mjs` | K2 (defaults), K3 (authored fields and linked catalog entries) | Golden output. Each fixture is run through `started` and `result` for a sweep, a version scan and a script scan, and the lines (spans joined, with each span's `cls` in brackets) must equal a committed file `test/js/fixtures/network-view/cli-golden/scanner/<fixture>.<step>.txt`. Every fixture runs with no `cli` fields, which pins the defaults of section 4.2 (a scenario with no `cli` data prints a complete report built from the core's fields), and with every field authored and every finding's `cli` filled as a linked entry is served, in two cases: entries with `advisories` and `output` (the `IDs:` line and the extra lines under the title) and entries with neither. Cases: a range of /24 and of /30 for the address count; no range (`Nmap done: <n> hosts up`); singulars; a down host (`Host seems down.`, not counted); a service with and without a banner (where the `\|_` falls); an empty check; a fixture whose findings arrive out of alias order. Called twice on one answer, a generator returns equal lines |
| `cli-gen-framework.test.mjs` | K2 (defaults), K3 (authored fields and linked catalog entries) | Golden output under `cli-golden/framework/`, each fixture with no `cli` fields and with all of them, the findings' `cli` with and without `advisories` (the `References:` list in `info`) and `output`: `search` with and without a word, `info`, `show options`, `sessions`, and the `started` and `result` lines of a confirmed, a false and a refused `check` and of each use outcome (session, credential, `already`, each refusal code). `show options` names exactly `RHOSTS`, `RPORT` and `TECHNIQUE`, and `set` of any other name (`PAYLOAD`, `LHOST`, `CMD`) changes nothing and sends nothing. A decoy and a weakness linked to entries of equal form (the same optional fields, counts and module form), or both on defaults, print the same lines, other than their own entry's text, in `search`, `info` and `use` before a confirm; with the authored text of each replaced by the same placeholder of the same form, they print the same lines exactly |
| `cli-gen-provenance.test.mjs` | K2 | Over every fixture and every generator call: each span is one of the generator's `TEMPLATES` entries (with its slots filled), a field of the answer, the view or a served `cli` object, or a count computed from them. The player's line is never a source for a generator span (generators never receive it); it is allowed only in the renderer's echo lines, which this test does not read. Marker fixtures hold a unique string in each field and check that it appears only where that field is printed. The registry maps exactly `sweep`, `scan`, `check`, `confirm` and `use`; each generator exports `id`, `started`, `result` and a frozen `TEMPLATES`; each `cls` is one of `prompt`, `head`, `ok`, `bad`, `note`. Each Panels piece of 11.2 test 9 is a whole span in the generator's output. No `TEMPLATES` entry and no line any generator returns for any fixture holds `(simulated)` or the word `simulated`, case-insensitive; the one exception is the framework's and the grammar's local answers that say "in this simulation", listed by name in the test |
| `network-skin-parity.test.mjs`, `network-skin-text.test.mjs` | K2 | Section 11.2 |
| `network-skin-choice.test.mjs` | K2 | The order of section 4, case by case: a press beats a URL value; a URL value beats a stored pick and is not written to storage; a press with a URL value present changes the skin and writes nothing; a press with no URL value is stored; a bad stored value is ignored; blocked storage still switches; a view with no `ops` block is `gui` under every combination; the switch is drawn only with an `ops` block and removed when a refetch has none |
| `network-skin-unchanged.test.mjs` | K2 | Section 10, check 1 |

**Harness copy lists.** The ten new modules (`view-texts.js`, `view-controls.js`,
`skin-choice.js`, `network-view-panels.js`, `network-view-terminal.js`, `terminal-grammar.js`,
`terminal-format.js`, `cli-gen/registry.js`, `cli-gen/scanner-output.js`,
`cli-gen/framework-console.js`) are static imports of the scene, so each goes on the copy list of every
test that copies `network-view-minigame.js`: `network-view.test.mjs` (its list at `:15-40` shows
the pattern), `minigame-consoles-fit.test.mjs`, `pc-monitor-frame.test.mjs`,
`escaping-shared-helpers.test.mjs` and the core's `network-view-ops.test.mjs`. The builder
greps `test/js` for `network-view` before finishing, since other branches add tests.
The three `cli-gen/` files keep their subfolder in each copy, since `terminal-format.js` imports
them by relative path. None of the ten touches `localStorage` or `window.location` at import, so no harness needs a
new stub.

### 11.2 The parity proof

The claim to prove: at any moment, the set of requests a player can cause from Panels equals the
set they can cause from the Terminal, each request is the same bytes from either skin, and each
skin shows every piece of text the other shows.

The unit of the proof is the **offer** of section 5.2. A press on Scan is one offer. A use is one
offer per pair of a held technique and a listed finding, `{ action: "use", target: { findingId,
techniqueId, itemId } }`, however the player put the pair together.

A **path** is a way of producing an offer with real input. These are all the paths there are; a
renderer that gains another must add it to this table and to `PATHS` in the test, or test 1
fails on the unlisted control.

| Path | Skin | Input | Offers it can produce |
|---|---|---|---|
| `button` | Panels | Press a row's `[data-action]` button, or the header's `[data-unplug]` | sweep, scan, check, confirm, sign-in (a locked session's included), open, observe, unplug |
| `select` | Panels | Select a finding, select a card, press Use, by pointer or by keyboard | use, for every pair in the list |
| `drag` | Panels | Drag a card and drop it on a finding | use, for every pair in the list |
| `typed` | Terminal | Type a line and press Enter | every offer |
| `quick` | Terminal | Press a quick-command button; for a use, two presses: the card's button, then the finding's | every offer |

What each skin shows beside its controls is held equal at every step by the text test (9): every
text in the layouts table of 5.3 (the alias, the Fixed mark, the "admin" tag, the refusal
words), the Confirm label (the button's label in Panels, the quick command's label and the verb
of its line in the Terminal), and a request that is out (the control disabled in both, Unplug
reading `UNPLUGGING_TEXT`, and a typed line for a pending offer answered with the pending line).
The generators' `started` lines are the one text the Terminal alone prints while a request is
out: Panels show the "Scanning" progress bar exactly while a sweep or scan is out, and the
Terminal's log gets the `started` lines once, when the request is sent (`recordSent`), and keeps
them. The test checks the bar is present only while the offer is pending and gone after an
answer, a refusal or a failure; the lines appear once and stay; the `result` lines follow them
after an answer; a refusal writes its words and a failure writes
`REQUEST_FAILED_TEXT`, each instead of the table; and a skin switch mid-request shows the other
skin's waiting state without new log lines, the answer rendered once. This is proved in the
parity harness, in three switch orders, each with the `started` lines counted once and a table,
refusal words or failure line at the end: (1) press in Terminal, switch to Panels, back while
pending; (2) press in Terminal, switch to Panels, answer lands in Panels, back to Terminal; (3)
press in Panels, switch to Terminal while pending, answer lands. The same file checks that a
mount, redraw or refetch while pending adds no line, and that a press the guard rejects calls
neither `recordSent` nor `recordResult`.

**Node tests** (`network-skin-parity.test.mjs`), in the DOM the existing network-view test uses,
against a fake `networkLinks`, a fake API client and fake openers that record every call. They
run over every fixture answer in the network-view fixtures folder, so a fixture another plan adds
is covered without an edit here.

1. **Every Panels path maps to an offer.** Press every `[data-unplug]` and `[data-action]`
   control whose action is not in `LOCAL_ACTIONS`. For every finding element and every card
   element, do the `select` path (once with pointer events, once with focus and key presses;
   its `LOCAL_ACTIONS` presses record no call) and the `drag` path, driven by dispatching
   the events named in the Panels renderer's `DRAG_EVENTS`, in order, so the test follows
   whichever mechanism the core built (HTML drag and drop, or pointer events) and fails if the
   list is empty. Each press or gesture must record exactly one call, the call of one offer in
   `offers(view)`. A control that records a call no offer explains fails the test, and so does
   an element that is draggable, a drop target or selectable and is not a card or a finding.
2. **Every offer has every path it should.** For each offer that is not pending, each path the
   table says can produce it does produce it, and the recorded call is deep-equal across
   `button` (or `select` and `drag` for a use), `typed` and `quick`: same function, same
   arguments, same body. A pending offer has no path (test 10).
3. **Every Terminal path maps to an offer.** Every verb is tried against every target token the
   grammar accepts for the fixture (ids, unique prefixes, the server's finding aliases), and
   every quick-command button is pressed. Each either records exactly one call, the call of one
   offer in the list, or records nothing and prints a message. `commandFor(offer)` parses back
   to that offer; for a `confirm` offer the line begins `msf > use`. The nmap form and the
   framework form of every offer (section 5.3, Grammar) record the same call as its game verb.
   A quick-command use is one path of two presses, and the first press alone records nothing.
4. **Use pairs.** For a fixture with two held techniques and four findings (one `unconfirmed`,
   one `confirmed`, one `false`, one `confirmed` that carries `fixed: true`), all eight pairs are
   reachable by `select`, `drag`, `typed` and `quick`, and each sends that pair's `finding_id`
   and `item_id`. With two held cards of one technique there is one offer, and every path sends
   the `itemId` of the server's `techniques` entry.
5. **Refusals are the same.** For each code in the core's `ops_refusal_codes.json`, a fake
   answer with that code produces the same sentence in both skins (the text comes from
   `REFUSAL_TEXT`), and neither skin sends a second request. The file is read, not copied, so a
   code a later plan adds is walked too.
6. **Nothing typed can reach past the list.** Typed lines that name a host, finding or card from
   another fixture, a well-formed id that is not listed, or a finding not yet checked record no
   call.
7. **Events.** For one scripted sequence run once per skin, the events the scene emits are
   deep-equal, all eight: `network_viewed`, `network_host_opened`, `network_swept`,
   `network_host_scanned`, `network_service_checked`, `network_finding_confirmed`,
   `network_technique_used` and `network_technique_refused`, with their `<name>:<id>` forms and
   payloads.
8. **Switching.** A switch in the middle of the sequence records no call, emits no event and
   leaves the recorded lists unchanged. A finding selected in Panels is not carried into the
   Terminal and the reverse: selection is local to a renderer and is never part of an offer.
9. **Everything shown is shown in both** (`network-skin-text.test.mjs`). Fixtures whose every
   text field is a unique marker string (names, labels, summaries, need labels,
   `falseBecause`, the unplug refusal's message) are run in both skins through one sequence: the
   opening render, then each offer of the fixture in `offers()` order with the same fake answer
   in both, a refetch answer after each, for each ops route one refusal per code and one
   `already`, one unplug whose answer is held and then refused, and a null-answer step
(`answer = null`) for each of `sweep`, `scan`, `check`, `confirm`, `use` and `unplug`: the first five
show `REQUEST_FAILED_TEXT` in both skins and the unplug shows the `NV:850` sentence in both. The two skins are compared
   **at every step**, never as a total over the run, so text that one skin shows at the wrong
   moment fails at that moment.

   Two comparisons per step:
   - **Result.** Straight after `showResult`, before the refetch: the Terminal's pieces are the
     log lines that step added, less the echo and the generator's `started` lines (`recordSent` adds both at send time, before `showResult`); the Panels' pieces are those in the view after
     `showResult` that were not there before it, plus any toast or notice the scene raised,
     read from the test's toast capture.
   - **State.** After the refetch and its `render`: the test runs `show` in the Terminal (a
     local verb, so no request) and takes that output and the unfolded quick commands; the
     Panels' pieces are the whole view. While the held unplug is out, this comparison is also
     run once, and both must show `UNPLUGGING_TEXT` on a disabled control.

   One extraction rule, written once in the test file and used for both skins. It runs on the
   renderer's mount root, so the scene's frame, title bar, header switch and X are excluded.
   - A **piece** is the text of an element that has at least one direct text node that is not
     blank: its whole `textContent`, so a phrase with an inline child is one piece and the
     child is not counted again. A Terminal table cell is one `<span>` and so one piece; any
     other log line is one piece. A quick command's button has no direct text node, so it
     gives its children's two pieces: the label `<span>` and the `<code>` line.
   - The `title` of a control is a piece. So is an `aria-label` on an element with no text. No
     other attribute counts.
   - An element that is `hidden`, or inside one, gives no pieces. The quick commands are
     unfolded for the comparison; a separate assertion checks that a folded strip is `hidden`.
   - Case is kept. Runs of white space become one space and the ends are trimmed. Nothing else
     is normalised.

   Each comparison runs in two directions:
   - every Panels piece, apart from the entries of `PANELS_ONLY_TEXT`, equals a Terminal piece
     of that step;
   - every Terminal piece of that step equals a Panels piece of that step, or is the id of a
     listed row, or matches an entry of `TERMINAL_ONLY_TEXT` (section 5.3), which includes each
     generator's `TEMPLATES` spans and the value of a served `cli` field or its default. That
     console dress is the only text the Terminal adds, and the first direction still requires
     every Panels piece, so nothing the player needs is printed only as dress.

   `PANELS_ONLY_TEXT` lives in the test file and holds the section headings that the Terminal
   replaces with table headers, and the "Scanning" label of the progress bar, which the list
   imports as `SCANNING_TEXT` from `view-texts.js`. `TERMINAL_ONLY_TEXT` is the exported list of section 5.3, and
   the test fails on any Terminal piece that equals no Panels piece, is no listed id and matches
   no entry of that export. Button labels and `title` texts are in neither list: they appear in the Terminal
   as the quick commands' labels and titles. Finding aliases, the
   Fixed mark, the "admin" tag and `UNPLUGGING_TEXT` are in neither list:
   they are the server's or the Panels' text and must match at every step. The fixtures
   include an unconfirmed finding, a confirmed one, a false one, a fixed one, a host row held
   through a technique session, a locked remote session, an admin session and a planted box's view with its unplug hint. An
   entry added to either list needs its reason stated in the commit.
10. **One press, one request.** With the fake answer of a guarded offer held unresolved, each
    of these records no second call: in Panels a second click on the same control, and for a
    use a second press of Use and a drag of the same card onto the same finding; in the
    Terminal a second Enter on the same line, a second press of the quick command, and the
    other path (typed then quick, quick then typed). The same holds across a switch: press in
    one skin, switch while the answer is held, press in the other; when the held answer then
    resolves, the mounted skin's `showResult` receives it once and draws it, and the
    unmounted skin's is not called. It is run for `sweep`, `scan`, `check`, `confirm`,
    `use` and `unplug`. An offer under a different key (a scan of another host, a
    use of another pair) still sends while the first is held. Once the answer resolves, or the
    request fails, the key is cleared and an offer still in the list sends again.

**Live run** (`tools/playtest/network-skin-parity.mjs`, stage K4), on the real path. This is the
feature's live proof, not a playtest of a mission.

1. Start three fresh games of `test_ops_skin`: A stays in Panels, B stays in the Terminal, C
   switches skin with the header switch after each step.
2. Drive one sequence in each through `window.__test.network.run(offer, { path })` (section
   11.5), which uses real input. Across the three games the sequence uses every path at least
   once: A makes one use by `select` and one by `drag`; B makes one use by `typed` and one by
   `quick`; C calls `network.run` with no `path`, which takes the simplest path of whichever
   skin it is in at that step.
3. Record only the requests the view's actions send: `POST` requests to `/network/*`, the
   sign-in route and the share route. The view's timed `GET /network` refetch is left out,
   because it interleaves differently in each game. The requests (method, path and body, with
   the game id removed from the path) must be equal across the three games exactly. The
   answers are compared after one normaliser, `normaliseAnswer` in the runner, has removed the
   keys that differ between fresh games for reasons that have nothing to do with the skin
   (record ids, times, sign-in tokens). The keys it removes are one list at the top of the
   runner, filled in from a first recording when the runner is written; a key is added to it
   only with its reason beside it, and no ops field (`finding`, `alias`, `status`, `reason`, `need`, `already`) may be on it.
4. At the end read each game's server record and compare these keys only: `footholds`,
   `sessions`, `opsDiscovered`, `opsFindings` (aliases included), `opsUsed`, the keyring's entries, and the log rows. The rows are read with the
   log feature's comparison form, `log_rows_for(source_id, compare: true)`, for each log source
   `test_ops_skin` declares; it returns each row without its times, in order, and the three
   arrays per source must be equal. Globals set by office life, timers and NPC needs depend on
   wall-clock time and are not compared.
5. Any difference fails the run. The core makes no rolls, so three fresh games answer alike with
   no seed handling.

Missions are playtested once, in whichever skin the run uses. The node tests above are what
show the other skin gives the same game, on every build.

### 11.3 Rails tests

| File | Stage | Proves |
|---|---|---|
| `test/models/break_escape/network_view_bootstrap_test.rb` | K3 | `networkView` reaches the bootstrap unchanged; a scenario without it has no such key |
| `test/controllers/break_escape/network_skin_blind_test.rb` | K2 | Each network and ops route gives the same answer and writes the same state with and without a `skin` or `net_skin` parameter, so no route reads one |
| Validator tests (`test/unit/validate_realism_skin_test.rb`, beside `validate_plant_hiding_test.rb`) | K3 | Each **Scenario** and **Both** check of section 9, with one passing and one failing scenario fragment per error and per warning, run against the core's test-only catalog folder `test/fixtures/realism_catalog/` (invented entries; entries this test needs are added there, and folders of broken files sit in subfolders of it, which the loader does not read). Among the failing fragments: a scenario with a link while the catalog does not validate (one error, no link checked), beside a scenario with no link against the same broken catalog (no catalog error); a link that names no entry; one entry linked from two findings; a decoy with no `realism` link beside a linked weakness; a decoy-only service on another host left unlinked while every weakness in the scenario is linked; linked entries where the weaknesses' hold `advisories` and the decoy's holds none; a decoy's entry with two `output` lines where every weakness's entry has one; a decoy-only service whose decoy's linked module is under `auxiliary/scanner/` while every weakness's is under `exploit/`; a decoy's linked module under `exploit/` beside a weakness's under `auxiliary/scanner/` on one service; a service `banner` holding `patched`; a decoy whose `falseBecause` shares a word with its entry's `title` (the warning, whose message is checked to hold the shared word and no other catalog text); two services on port 53 (`tcp` and `udp`) on one host; one address on two networks; two overlapping ranges; one discovery network with a `range` beside one with none; a `cli.hosts` key of 65 characters; a network id equal to a host id; a banner with a tab and one with `é`; `\x31\xc0`; `%41%42`; `0xdeadbeef`; `<b>x</b>`; a 16-digit hex run; `QWxhZGRpbjpvcGVuIHNlc2FtZQ==`; the paths `/etc/shadow`, `../../x`, `C:/Windows` and `etc/init.d/x`; one failing fragment for each credential form: `admin:admin` (the `:` pair), `admin/admin` (equal sides), `root/toor` (default password on the right), `admin/Passw0rd1` (account word and a letter-digit right side), `Default login (admin/admin)` (brackets stripped), `admin=admin` (equal sides with `=`), `root=toor`, `usr/local/bin` (system directory path), `password=letmein` and `Password: letmein` (key word, with and without a space), `user=pass`, `token:abc` (the short key word); `203.0.113.9` in a banner; `http://intranet`; `www.brackley.com`; `shareserve.com`; a banner whose version after the service's `product` differs from the service's `version`, and a linked entry whose `title` does the same against the linking service; and, for the real-identifier rule (all made up), `cve_2031_24117` as a `realism` id, `CVE-2031-24117` in a banner, `ms31_017` in a host label, an article number in a summary, `RHSA-2031:1234` in a hint, `exploit/windows/smb/x` in a `falseBecause`, `tidepool` in a service label, and a service word `usn` whose default script `usn-default-creds` matches while the word alone does not. Passing fragments include a banner naming `files.local`; one with `10.20.0.15`; `10.20.0.15:445`; `SMB/CIFS`, `TCP/IP`, `ShareServe/3.1`, `HTTP/1.1` and `Service/1.0` in a banner; `Guest/anonymous access enabled`, `Anonymous login: allowed`, `Read/Write/Execute` and `Service/HTTP2` in a banner; `timeout=30`; `SSH host key: RSA` and `API key: required`; `Weak TLS 1.0 enabled` and `SSH-2.0`; the same made-up advisory ids and module paths in the linked entries of the test catalog (the rule reads the scenario, never the catalog); a service label `forms31_017` (no match: the pattern is preceded by a letter); and a scenario with no `services` whose ink holds `CVE-2031-24117` (not read). The warning fragments `Real-time`, `fixed session id` and `safe mode` give the weaker-word warning and no error. Every message is checked to hold no string of the test catalog (the falseBecause warning's shared word apart), and each link-rule message to name the forms involved. The example of section 4.2 passes with no error and no warning against a test catalog holding the two entries of section 4.3. The graph is the same with and without the block, the `cli` objects and the links |
| Catalog validator test (`test/unit/validate_realism_catalog_test.rb`) | K3 | Every file of `config/break_escape/realism_catalog/` passes `check_realism_catalog`, on every build, so a catalog edit that breaks a rule fails the suite; the committed `docs/REALISM_CATALOG_INDEX.md` equals what the validator would write (else "rerun scripts/validate_realism_catalog.rb"), and the index holds no catalog string; only `test_*` scenarios link entries of `training_fixtures.json`, read from the index. On subfolders of the core's `test/fixtures/realism_catalog/`, one failing fragment per **Catalog** and **Both** row of section 9: an id used in two files; an id twice inside one file (the duplicate-key parse); a catalog id `ms31_017_share` and one `tidepool_check`; an index naming an id the catalog no longer has, and one whose form changed (an added id passes), each through the command line as well as the comparison function, asserting the index file is left unchanged; a `module` whose first segment is `shareserve`; one `module` on two entries; a `module` of the default form (`auxiliary/scanner/files/default_creds_f2`); a `module` with two equal neighbouring segments (`auxiliary/admin/admin/x`); a dotted quad in an `output` line (`10.20.0.15`, private, still an error) and in a `title`; a real product from `scripts/real_product_names.txt` in a `title`; a `title` holding `patched` and a `script` `smb-bait-check`; `http://` and a public domain in an `output` line; the payload and blob forms of the scenario test (`\x31\xc0`, `%41%42`, a 16-digit hex run, a base64 run) and `admin/admin` in a `title`; an advisory not in one of the four forms; five advisories; seven `output` lines; an unknown key on an entry and on a file. Passing: the two entries of section 4.3; `auxiliary/scanner/brackley/shareserve_guest_login` and `auxiliary/admin/brackley/x` as modules; `Guest/anonymous access enabled` as a title. Every message names file, catalog id, field and rule and holds no catalog string |
| Real-identifier separation (`test/unit/realism_separation_test.rb`) | K3 | Every file in the folder of each scenario that declares `services` (its JSON or ERB, ink, `PLAYTEST.md` and notes) matches no advisory pattern, framework-path form or nickname of section 9, with the validator's exemption for the default `auxiliary/scanner/<word>/<class>_f<n>` form, so a note quoting a default module passes; `docs/REALISM_CATALOG_INDEX.md` is scanned the same way, as a scenario file expecting zero hits (its `auxiliary/4` forms are not path forms, and its `docs/...` scenario paths pass the `public/` check); the folders are found by the `services` key, so a new ops scenario joins without an edit. Scenarios without `services` are out of scope, since the VM missions and labs teach with real advisories. The test also checks that no file under `public/` or `app/assets/` holds a catalog entry's `module`, so catalog text has not been copied where a static path would serve it |
| `cli` serving (core's leak collector) | K3 | `test_ops_skin`'s collector stages the `cli` strings: the range on the view block from the first answer and an address on its open network from the first answer (both tagged `listed`, as the core's collector tags them), an address on the discovery network only after the sweep (including the held-session PC's), a service's `cli` only after the host scan, a finding's `cli` (its linked entry's strings, read from the catalog by the collector) only after the check, with the same keys on the decoy as on the weakness; none in the bootstrap or a room answer; a scenario with no `cli` data and no links gives answers with no `cli` key. Never at any stage: a `realism` link id, the `module` of a catalog entry the scenario does not link, or any `_` key of an entry |
| Catalog link serving (`test/controllers/break_escape/network_realism_link_test.rb`) | K3 | On `test_ops_skin` with its training catalog: the check answer, the confirm answer's finding and `GET /network` carry, for each linked finding, `cli` with exactly the keys its entry holds out of `title`, `module`, `script`, `advisories` and `output`, and the same key set on the decoy as on the weaknesses; no answer holds the key `realism` or any link id, the bootstrap and the room answer for the held-session PC (a sign-in object whose service has a linked finding) named among them; a catalog folder with a duplicate id loads as an empty map with one server warning, and the check and confirm routes then answer normally with no `cli` on any finding; the whole catalog is never served (no answer holds the `module` of an unlinked entry, and a request to `/config/break_escape/realism_catalog/training_fixtures.json` or any path under it, and to the engine's static paths, answers 404); a link removed from the loaded test catalog leaves that finding without `cli`, logs one server warning naming the link id, and changes no status, alias or log row |
| `tools/playtest` shell test | K2 | `session-start.sh` gives the same session tag with and without `--net-skin` |

### 11.4 Feature scenario `test_ops_skin`

Added in K2. A small copy of the core's fixtures: one office network marked for discovery, a jack and a drop box, two sign-in hosts (one with a held session path,
one with remote sign-in off), a file server with one service that has two real weaknesses and
one decoy, two technique cards for different techniques, an open share and a printer to look
at. The first real weakness grants a session and the second a credential. The scenario declares one log source that takes the core's
network events, so the live run has rows to compare. Its objectives and hints follow the
wording rule of 5.6. K3 adds `networkView.defaultSkin: "cli"` and a second, open network
(the core's default discovery) reached through the same box, holding one host with an
authored `range` and `address`, so the address is served from the first answer and has its own
golden file and leak-collector stage. K3 also adds authored `cli` fields for the office
network's range, the file server's address, the held-session PC's address and its service, and
links its three findings to three entries of
`config/break_escape/realism_catalog/training_fixtures.json`, a catalog file of invented text
and made-up advisory ids added with it, each with the year `0000` (`CVE-0000-24117`), which is
never assigned, and linked only from `test_*` scenarios (11.3) (the decoy's entry of the same form as the weaknesses',
each with `advisories` and `output`). The printer and the sign-in hosts keep the default service and address output and hold no
findings, so one run shows both kinds of output; every finding in the scenario is linked, as the all-or-none
rule requires.

The beats are written once in the scenario's `PLAYTEST.md` and run twice in K2, once with
`--net-skin gui` and once with `--net-skin cli`, through `window.__test.network`. After each beat
the script checks the requests sent, what the answers held, what the skin shows, and the
server's record.

| Beat | What happens | Server record afterwards |
|---|---|---|
| T1 | Plant the box; the view opens in the starting skin with the header switch; the block shows no host | foothold held |
| T2 | Terminal run only, before any sweep: a mistyped verb (`scna`), which prints the nearest verb; then `scan` with an invented host id and `scan` with the real id of the file server, whose network is not yet swept. Both `scan` lines print the same message, the unlisted-target answer with an empty list of what `scan` can be used on. Then `nmap -iL hosts.txt`, which prints its answer | unchanged; no request sent |
| T3 | Sweep the network (Terminal run: `nmap -sn --bogus <network>`, which prints one `Ignored in this simulation: --bogus` note and sweeps): Panels show the "Scanning" bar while the request is out, the Terminal prints the scanner's `started` and `result` lines over the same single request, and the block then lists its hosts. Then scan the file server, the same in both. Terminal run only: `signin` on the host with remote sign-in off prints the status sentence its Panels row shows | as `test_ops_scan` records; no request for the typed line |
| T4 | Check the service (Terminal run: `nmap --script vuln -p <port> <host>`): three findings, each under the alias the server gave. Every finding's control reads Confirm. Confirm the first real finding and the decoy (false, with its reason). The second real finding is left unconfirmed. Terminal run only: a mistyped `confrim f2` prints the nearest verb and sends nothing | as `test_ops_findings` records: two findings settled, one not |
| T5 | Use a card on the decoy (refused `false_positive`) and on the unconfirmed finding (refused `not_confirmed`). Then confirm that finding | the same refusal codes and sentences in both runs |
| T6 | Switch skin; the same hosts, service, findings under the same aliases, statuses and cards are shown; switch back | unchanged; no request sent |
| T7 | Use the first card on its finding (Panels: select then Use; Terminal: typed, as `msfconsole`, `use <module>`, `set TECHNIQUE <id>`, `run`, which prints the session line). Use the second (Panels: drag; Terminal: quick commands) | a session at the stated access, drawn with the compromised mark (read from `compromiseMarks()`, the same in both runs); a keyring entry |
| T8 | Open the share; look at the printer | unchanged apart from the share being opened |
| T9 | Unplug | foothold gone, sessions through it ended |

The script reads aliases and statuses from `getTestState()` (the core's
fields) and from `network.state()`, and asserts they are equal in the two runs beat for beat.

Switch and default beats. W1 to W3 run once in K2 with no `--net-skin` value; D1 runs in K3. After K3 gives `test_ops_skin` a default, W1 and W2 run on a copy of the scenario with no default (or W1 reads "opens in the scenario's default skin"), since they assume Panels for a fresh profile.

| Beat | What happens |
|---|---|
| W1 | Fresh profile: the view opens in Panels. Press the switch; reload; the view opens in the Terminal with an empty log and the same rows |
| W2 | Open the same game with `?net_skin=gui`: the view starts in Panels although the pick is Terminal. Press the switch: the Terminal mounts. Reload: Panels again, and the stored pick is still Terminal |
| W3 | Open `test_access_networks` with the stored pick still Terminal: Panels, and no switch |
| D1 | Fresh profile, no URL value: the view of `test_ops_skin` opens in the Terminal; one press of the switch gives Panels and is stored |

### 11.5 Scripted playtest bridge

Added to `systems/test-bridge/` as `window.__test.network` in K2.

| Call | Returns or does |
|---|---|
| `network.state()` | `{ skin, hasSwitch, footholdId, status, offers: [{ action, target, label, command, pending? }] }`, the same in both skins apart from `skin`. A `confirm` offer's `label` is Confirm |
| `network.run(offer, { path })` | Performs the offer with real input by the named path of section 11.2 (`button`, `select`, `drag`, `typed`, `quick`); with no `path`, the simplest one for the active skin (`button` or `select` in Panels, `typed` in the Terminal). The `drag` path dispatches the Panels renderer's `DRAG_EVENTS`. Resolves with the server's answer. Rejects when the path does not belong to the active skin, the offer is not in the list, or the offer is pending |
| `network.skin()` / `network.setSkin(name)` | Reads the skin; changes it by pressing the header switch |
| `network.storePick(name)` | Writes the player's stored pick with `writePick`, the function the switch calls, and presses nothing. It works on any view and with no view open, so a run can set a pick before opening a scenario that has no switch (section 10, check 3) |
| `network.log()` | The Terminal log as lines (empty in Panels) |
| `network.type(line)` | Types a line into the prompt and presses Enter, for lines that are not offers (the Terminal-only parts of T2 to T4) |

`tools/playtest/session-start.sh` gains `--net-skin gui|cli`. The script takes its session tag
from the `--url` value exactly as it does now, then removes the option from the arguments and
appends `net_skin=<value>` to the URL it hands to the harness (with `?`, or `&` when the URL
already has a query). The tag is therefore the game id whether or not the option is given. The
builder also greps the harness for any other place that reads the game id from the end of the
URL and makes it ignore a query string.

What keeps existing playtests working:

- A view with no `ops` block is always Panels (section 10), and a fresh headless profile has no
  stored pick, so existing runs are untouched in both ways.
- `__test.minigame.getState()` returns the same fields in both skins (`rows`, `networks`, each
  row's `id`, `kind`, `action`, `selector`, and the core's additions: a session's `access`,
  findings with alias, status, `fixed` and `needs`, blocks with `swept` and `ops`, `techniques`). On a view with an `ops` block
  it also has `skin`, the one field S6 adds; a view with no `ops` block returns exactly today's
  fields. The core's `selectedFinding` is always `null` in the Terminal, which has no selection,
  and each selector resolves to the quick-command button, which carries the same hooks.
- Selectors name the action where a row can hold more than one control: in a block marked `ops`
  a host row can hold Scan as well as Sign in. The core builds each ops control's selector from
  its row hook and its `data-action` value (`[data-host-id="…"] [data-action="scan"]`), so it
  matches one element in either skin. Rows in a block with no `ops` mark keep today's selector
  value, so the snapshot of an existing scenario is the same.
- `clickControl('Sign in')` matches by exact label, then prefix, then substring. A quick command
  reads "Sign in" followed by its line, so the prefix match applies and takes the first one, the
  same host the Panels would give, because both skins draw their controls in `offers()` order.
- `clickControl(n)` by number is not stable across skins. No existing playtest uses a number in
  the network view; `docs/test-bridge.md` tells authors to use a selector, a label or
  `network.run`.

### 11.6 Live proof

All on a keyless server from the worktree, with fresh games made in that run.

- **K2**, before the stage lands, because it is the stage that shows players the Terminal: the
  T and W beats through the real client path; screenshots of both skins at desktop and phone
  widths, among them a sweep in progress (the "Scanning" bar in Panels, the `started` lines in
  the Terminal), a version-scan table, an msf `run` that ends with a session opened, the bar under `prefers-reduced-motion: reduce` (static fill), a finding with Confirm and a host row with the compromised mark; a screenshot of
  the prompt above an on-screen keyboard; the UI rules audit over the network-view surface of a
  live `test_ops_skin` game, in each skin (section 5.4); a double press of Confirm and of Enter
  on a `confirm` line, each on a throttled connection, sending one request and not two; the
  access leak scanner over the captured responses.
- **K3**: beat D1; screenshots of the same version scan, a script scan with the `IDs:` line and
  `run` with the authored `cli` fields and linked catalog entries of `test_ops_skin`; the leak
  scanner over the captured responses, finding no link id and no unlinked entry's string.
- **K4**: the live parity run of 11.2, and the leak scanner over its captured responses.

## 12. Build steps and shared files

Each step is one commit on a feature branch cut from main after the core's S3 has landed,
committed before its tests are run in the shared tree.

| Step | Stage | Work | Proof before moving on |
|---|---|---|---|
| 1 | K1 | Save the scene's DOM for every fixture and for every recorded `ops_unchanged` view answer (under `test/js/fixtures/network-view/unchanged/`, beside the server fixtures in `test/fixtures/files/ops_unchanged/`), before any change. Move the fixtures the tests build inline into `test/js/fixtures/network-view/` only for the new tests; existing tests are not edited | the snapshots exist on the branch point |
| 2 | K1 | `view-texts.js`, `view-controls.js`, `network-view-panels.js`; the new exports in `ops-model.js`, with the Panels drawing changed to call them; the scene mounts the Panels renderer and routes it through the core's `perform` path, with `offers()` reading the core's pending set and `pendingKey` (core 5.3); copy lists | K1 rows of 11.1; existing and core node tests unedited; `bin/test-js` whole; scripted reruns of `test_access_networks` and `test_ops_access` |
| 3 | K2 | `skin-choice.js`; the starter passes the skin; the header switch on ops views | `network-skin-choice.test.mjs`, `network-skin-unchanged.test.mjs` |
| 4 | K2 | `terminal-grammar.js`, `terminal-format.js`, `network-view-terminal.js` (with `recordSent` and `recordResult`, called by the scene through the `onSent` and `onEnded` hooks of `perform` that the core adds in its S1, core 5.3; section 14, item 4), `cli-gen/registry.js`, `cli-gen/scanner-output.js` and `cli-gen/framework-console.js` with the defaults of section 4.2 and their golden files, the rules for the Terminal and for the Panels "Scanning" bar (reduced-motion block included) in `network-view-minigame.css`, `SCANNING_TEXT` and `REQUEST_FAILED_TEXT` in `view-texts.js`; the Tab attribute, the pause on mount, `scrollIntoView` on the prompt | grammar, format, `cli-gen` golden and provenance, parity and text tests |
| 5 | K2 | `window.__test.network`; `--net-skin` in `session-start.sh`; `test_ops_skin` with its `PLAYTEST.md`, graph and leak collector entries; the audit entry; `docs/test-bridge.md` | the T beats in each skin and the W beats; the skin-blind controller test; the reruns of section 10, check 3; the K2 part of 11.6 (screenshots checked, audit clean, phone keyboard check); full suites; land K2 |
| 6 | K3 | Schema for `networkView`, the `cli` objects and the `realism` link; `config/break_escape/realism_catalog.schema.json`, the catalog folder with `training_fixtures.json` (its only file at K3), `scripts/validate_realism_catalog.rb` and the index it writes, `docs/REALISM_CATALOG_INDEX.md`; `scripts/validate_realism_skin.rb` and its hook, the wording warning, `scripts/real_vuln_nicknames.txt`; bootstrap test; `defaultSkin`, the authored `cli` fields and the links in `test_ops_skin`, its leak collector stages and the golden files with authored fields and linked entries. The catalog loader `lib/break_escape/realism_catalog.rb` and the link resolution in the finding builder are the core's, built at its S2 (section 14, item 3) | K3 rows of 11.1 and 11.3 (the catalog validator test, the separation test and the link serving test among them); beat D1; validator output for every other scenario unchanged |
| 7 | K4 | `tools/playtest/network-skin-parity.mjs`; the `README_scenario_design.md` feature index (N16) and `docs/ACCESS_AND_NETWORKS.md` | the K4 part of 11.6; land |

| Shared file | Also touched by | This plan's part |
|---|---|---|
| `minigames/network-view/network-view-minigame.js` | core (S1 to S3) | K1 moves the drawing out and leaves the handlers, the `perform` path, its pending guard and the `pending` set and `pendingKey` it exposes (core 5.3) as the core built them; K1 only reads the set. `perform`'s `echo` option and its `onSent` and `onEnded` hooks are the core's change (section 14, item 4); K2 only sets the hooks. A plan that lands after K1 adds its drawing to `network-view-panels.js` and its handler to the scene |
| `minigames/network-view/ops-model.js` | core (owner); later plans add refusal codes to `REFUSAL_TEXT` | K1 adds exports, as the core's shared-file table expects: `findingLabel`, `needLine`, `useResultText` and the line functions of section 5.2. It changes no existing export and adds no entry to `REFUSAL_TEXT` |
| `test/fixtures/files/ops_refusal_codes.json` | core (owner) | read by parity test 5 and the format test; not edited |
| `css/network-view-minigame.css` | core | the Terminal's rules, appended |
| `scripts/scenario-schema.json` | every plan; core owns `definitions.service`, `definitions.weakness`, `definitions.decoy` and `networks.<id>` | one top-level block, `networkView`, and at K3 the `cli` rows on networks and services and the `realism` row on `definitions.weakness` and `definitions.decoy` (section 9); until then the core's closed blocks refuse `cli` and `realism` |
| `scripts/validate_scenario.rb` | every plan | one require and one call of `check_realism_skin`; the ink half of the wording warning in the dialogue lint |
| the core's network row builders (`network_rows`, the block and `host_row` in `app/models/break_escape/network_access.rb`; the finding builder of the check and confirm answers in `network_ops.rb`) and leak collector | core (owner) | none in the builders, which copy each `cli` object by its named keys only and resolve the `realism` link through the core's catalog loader, copying the entry's named keys, as section 14, item 3 asks, so a `_` note key and a link id are never served; `test_ops_skin`'s collector entries for the `cli` strings and its linked entries' strings |
| `lib/break_escape/realism_catalog.rb` | core (owner, built at its S2) | none; the skin's validator calls it to read the catalog |
| `config/break_escape/realism_catalog/`, `config/break_escape/realism_catalog.schema.json`, `scripts/validate_realism_catalog.rb` and its test, `docs/REALISM_CATALOG_INDEX.md` (generated) | none (this plan's) | created at K3; later catalog tasks add entries (append-only, section 4.3), run the catalog validator, which rewrites the index, and commit the index with the catalog |
| `scripts/real_vuln_nicknames.txt` | none (this plan's) | created at K3, read by the real-identifier rule of section 9; beside the core's `scripts/real_product_names.txt`, which this plan reads and does not edit |
| `systems/test-bridge/index.js`, `tools/playtest/session-start.sh`, `tools/playtest/ui-rules-audit.mjs` | possibly core; none known for the others | one namespace; one option; one surface |
| `README_scenario_design.md`, `docs/ACCESS_AND_NETWORKS.md`, `docs/test-bridge.md` | every plan | the N16 rows and one section |
| JS test harness copy lists | every plan that adds a module | the ten new modules, `cli-gen/` kept as a subfolder |

Not touched: `ui/display-settings.js`, `ui/game-menu.js`, the game page's stylesheet list, any
server model or controller. No file is added under `tools/playtest/` except the K4 runner.

## 13. Log rows

This feature writes no log row and registers no event with the log feature: it adds no move, a
switch of skin is not a game action, and the server cannot tell which skin sent a request. The
moves a player makes from either skin write the core's rows (`network_swept`, `host_scanned`,
`service_checked`, `finding_confirmed`, `technique_refused`,
`technique_used`), the same whichever skin sent the request, and the live parity run (11.2)
compares them across three games. The Terminal's scrolling log is page state, not a log row.

## 14. What this plan relies on from other plans

Each entry names what this plan needs from another plan and the section of that plan that
provides it.

**From the core plan (`OPS_CORE_PLAN.md`), section 14, item 6 "Skin (S6)".** Everything the
"Core:" rows of section 2 describe is stated in the core plan under the sections those rows cite.
The skin relies on: `alias` and its lookup, `itemId` on each `techniques` entry, `ops: true` on a
block, a card usable against any listed finding (core 5.4, "Which findings take a card"), the
`echo` option and the `onSent` and `onEnded` hooks of core 5.3 (item 4 below), the summary of the
validator rules in core 9.1 (item 5 below), `fixed` only on a confirmed finding, the "admin" tag,
select-then-Use as the keyboard path, each refusal code in the file with `REFUSAL_TEXT` as the
one table of words, this plan's own exports to `ops-model.js` (12.2), and from core 5.3 the one
`perform` path with its pending guard and the set and key builder it exposes, from core 5.5 the
renderer-drawn action messages, and the world-side marks (the compromised mark and the
remote-view frame), which a skin leaves showing and reads through `compromiseMarks()`.

**Items:**

1. **Log rows (`OPS_LOG_ROWS_PLAN.md`, section 5.1, "Reading").** The live parity run compares
   `log_rows_for(source_id, compare: true)` across the three games. No row and no route
   parameter names the skin.
2. **Every plan: wording (`OPS_CORE_PLAN.md`, section 11.4).** Every beat of a `test_ops_*`
   scenario's `PLAYTEST.md` names actions (sweep, scan, check, confirm, use), never controls (a
   button, a drag, a typed line), as objectives and hints do (sections 1.3 and 5.6), so one
   script runs in either skin.
3. **Core: serve the `cli` display fields and resolve the `realism` link, with the answers the
   player has earned (`OPS_CORE_PLAN.md`, sections 5.2, 5.3 and 7).** The skin declares the schema rows for the `cli` objects and for
   `realism` at K3 (section 9); until K3 the core's closed blocks (`networks.<id>`,
   `definitions.service`, `definitions.weakness`, `definitions.decoy`) refuse both, and the
   core's list of early-write fields names both. At S2, with the check route, the core adds the
   catalog loader `lib/break_escape/realism_catalog.rb`: it reads
   `config/break_escape/realism_catalog/*.json` once, on first use, into a frozen map from id to
   entry, and takes another folder in tests; no route serves it. The loader never raises into a route. When a file does not
   parse, or an id or a `module` appears twice across the files, it logs one server warning
   naming the file and the fault (never catalog text) and loads an empty map, so every linked
   finding is built without `cli` and prints the defaults evenly, and the check and confirm
   routes answer as normal. The skin's catalog validator, run on every build, stays the hard
   gate for those faults, reading the faults the loader keeps; the core's loader test has three
   faulty folders (a cross-file id, a shared `module`, an unparseable file) and asserts the
   empty map and the warning for each. The row builders in `network_access.rb` (`network_rows`, the
   block, `host_row` and the device-row builder) and the one finding builder in
   `network_ops.rb` copy, unchanged and by named keys only (so a `_` note key is never served),
   beside the fields they belong to:
   - `networks.<id>.cli.range`, as `cli.range` on the view's block for that network;
   - `networks.<id>.cli.hosts.<hostId>.address`, as `address` on the host's row, with the row,
     whenever the core lists that row as discovered: on an open network (`discovery: "open"` or
     absent, never swept) from the first `GET /network` answer that lists the row; on a
     discovery network in the sweep answer and in `GET /network` from the sweep on. A held-session
     PC row that the core lists on an unswept discovery network carries no `address` until the
     sweep, so the address arrives with the sweep like the other rows;
   - a service's `cli` (`protocol`, `service`, `banner`), with the service in the host scan
     answer and in `GET /network`, only once the host has been scanned;
   - for a weakness or a decoy with `realism`, the linked entry's `title`, `module`, `script`,
     `advisories` and `output` (those the entry has), as `cli` on the finding in the check
     answer, in the confirm answer's finding and in `GET /network`, only once the service has
     been checked, by the same builder and the same keys for both kinds, so a decoy cannot be
     told from a weakness by what is sent. The link id is never copied. A link that does not
     resolve leaves the finding without `cli` and logs a server warning naming the link id; it
     changes no status, alias or log row. A weakness or decoy has no `cli` object of its own.

   None of it is sent in the bootstrap or in any room answer. An object the author did not write,
   and a finding with no link, is left out of the answer, never sent as `{}` or `null`, and the
   browser builds the defaults of section 4.2 from fields it already has, so the server sends
   authored and linked data only. The core tests the copying at S1 and S2 on test-only fixtures,
   S2's with the test-only catalog folder `test/fixtures/realism_catalog/`, which the skin's
   validator tests also use. The leak collector of each `test_ops_*` scenario lists
   the `cli` strings at the stage they are served (an open network's addresses at the first
   answer, a linked entry's strings, read from the catalog, at the check), and fails at any
   stage on a link id or the `module` of an entry the scenario does not link. No route, check or
   refusal reads a `cli` field or a link.
4. **Core: an echo and two hooks in `perform` (`OPS_CORE_PLAN.md`, section 5.3, built in its S1;
   the contract K2 depends on).** The scene's `perform` (core 5.3) becomes
   `perform(offer, { echo } = {})`, and the scene gains two hook properties, `onSent(offer,
   echo)` and `onEnded(offer, answer)`, each a no-op by default. The hook points:
   - `onSent` is called once per accepted press, synchronously, after the guard has found the
     key free and added it to `pending`, and before the first `await`, so before the request
     goes out. A press the guard rejects calls neither hook.
   - Every ending (an answer, a refusal answer, a request that throws, and no reply, the last
     two with `answer = null`) runs one `finally`-shaped tail, in this order: `onEnded(offer,
     answer)`, then the removal of the key from `pending` (with the redraw that follows), then
     the mounted renderer's `showResult(offer, answer)`. For the unplug that ends the trip, the
     same tail runs before `complete(false)`.
   - `echo` and the hooks never change the request, its body or the route; `perform` without
     them behaves as the core built it. A hook that throws is caught and logged, and the tail
     still clears the key and calls `showResult`.
   The core's guard tests run unedited; one more case shows the hook order on an answer, a
   refusal, a throw and a null answer, and that a rejected press calls neither hook.
5. **Core: the summary of the skin's validator rules (`OPS_CORE_PLAN.md`, section 9.1).** The
   core's 9.1 summary states that `realism` links are all or none (every weakness and decoy has
   one or none has, each link resolves and is used once, linked entries are of one form), names
   `scripts/validate_realism_catalog.rb` for the catalog's own checks, and says there is no
   shared finding `cli` definition. This is the contract K3 depends on. No core check changes.

## 15. Open questions for the user

None open.

No action costs game time because of the skin, so this plan raises nothing about a clock.
