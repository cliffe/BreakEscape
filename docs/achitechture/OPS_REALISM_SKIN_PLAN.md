# Ops layer S6: realism skin for the network view (feature N16)

Status: draft plan, 2026-11-19. Planning only; nothing is built until the user says so.
Base: branch `docs/ops-layer-plan`. Shared brief: `docs/agents/OPS_LAYER_BRIEF.md`. Outline:
`docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md`, stage S6.

This plan stands alone. A builder needs this file, the brief, and the core plan
(`OPS_CORE_PLAN.md`, stages S1 to S3), which owns the names used here: the routes, the row
fields, the finding ids and aliases, the noise count, the refusal codes, the events and the
shared pure module `ops-model.js`. S6 is built after S1 to S3 have landed.

Words used here. A **skin** is one way of drawing the network view and taking input: `gui`
(shown to players as Panels) or `cli` (shown as Terminal). A **control** is something the view
lets the player press. Each has a name in the list: `sign-in`, `open` and `observe` (their
`data-action` values today), `unplug` (the header button, marked `data-unplug` today), and the
core's `sweep`, `scan`, `check`, `confirm` and `use`. The core's Confirm and Probe are one
control, `confirm`, under two labels (section 5.2). An **offer** is one complete request the view
can make right now: a control's action plus every id the request needs. The list of controls and
offers is private to the network-view folder. It is a drawing aid for two renderers of one
screen; nothing outside that folder reads it, the server never sees it, and no other feature
registers with it.

## 1. What this adds and why

### 1.1 In play

The network view opens when the player uses a foothold (a planted drop box, a joined Wi-Fi
network, an implant). It is one screen: network blocks holding rows for hosts and shares, with
buttons on the rows. On a network whose hosts declare services, the core plan adds Sweep on a
block, Scan on a host, service tiles with Check, findings with Confirm or Probe, a noise count
on each block, and a panel of technique cards that the player uses on a finding by selecting or
by dragging.

S6 gives that screen a second face, on those networks only. A view that holds at least one block
the server marks `ops: true` gains a switch in its header between:

- **Panels** (`gui`): the rows, tiles, cards and buttons as the core draws them.
- **Terminal** (`cli`): a prompt and a scrolling log. The player types `sweep`, reads a table of
  hosts, types `scan files01`, reads a table of services, types `check files01 web`, reads the
  findings, types `probe f2` and sees the network's noise go up by one, types
  `use <technique> on f2`, and so on. Results are laid out in the manner of scanner and
  framework tools, with invented products and no real tool's commands or output. Nothing real
  runs: each line is one of the requests the buttons make, sent to the same server route, and
  the text is a different drawing of the same answer.

The player can switch at any time, in the middle of a task, and loses nothing: the hosts found,
the findings, the noise made and the sessions held all live on the server. A finding is `f2` in
both skins, because the server gives it that alias.

A view with no `ops` block has no switch and is always drawn as Panels, whatever the player has
picked elsewhere. Scenarios that exist today therefore look exactly as they do now.

### 1.2 What it teaches

Panels teaches the shape of the work (find hosts, find services, check them, use what you find).
The Terminal adds the reading skill: picking the two lines that matter out of a scan table, and
getting used to a prompt, a verb and a target. A learner who is put off by a prompt is never
blocked by it, and one who wants the prompt can have it on every ops network.

### 1.3 The three design rules

1. **One set of requests.** A skin never adds, removes or changes a request. Whatever one skin
   can ask the server for at a given moment, the other can ask for at that moment, the bytes sent
   are the same, and the server cannot tell which skin sent them. A request still waiting on
   its answer cannot be sent again from either skin. Each skin also shows, at every step, every
   piece of text the other shows.
2. **A renderer cannot reach the server.** Both renderers draw from the same rows and the same
   list of offers and hand a chosen offer back to the scene. Only the scene calls anything. A
   test fails the build if a renderer file names any of the ways out listed in section 5.2
   (the API client, `network-links.js`, `fetch`, `window.open*`, `window.start*`).
3. **Text about the game never names a control.** Spoken lines, objectives and hints say what to
   do ("sweep the office network"), never how one skin does it ("click Sweep", "type sweep").

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
| Core: controls | Sweep on a discovery block, Scan on an unscanned host row in an `ops` block, Check on a service tile, and on a finding either Confirm (its evidence is held) or Probe (not held, or none declared): one request, `POST /network/confirm`, under two labels. A Techniques panel lists the held cards. A use is made by selecting a finding, then a card, then Use, or by dragging a card onto a finding. Select-then-Use is the keyboard path and the drag is a pointer shortcut for it. Any finding a row lists takes a card, whatever its status; the server decides. A host row with a session draws an "admin" tag when the session's `access` says so. Every action of the screen (sweep, scan, check, confirm under either label, use and unplug) goes through the scene's one `perform` path, which holds a pending guard keyed by action and target (for a use, the card and the finding together) and hands the message an action leaves, the unplug's included, to the renderer to draw. The server counts every noisy request it validates | core plan sections 1, 5.3, 5.4 and 5.5 |
| Core: hooks | Each ops control carries `data-action`: `sweep`, `scan`, `check`, `confirm` (both labels; the control also carries `data-quiet`), `select-finding`, `select-technique`, `use`. Each ops row carries `data-network-id`, `data-host-id`, `data-service`, `data-finding` (the alias) or `data-technique`. Only ops controls and rows carry them; Open, Sign in and Unplug keep the selectors they have | core plan section 5.5, "Hooks for tests and for the skin" |
| Core: finding | `{ id, alias, hostId, service, class, severity, summary, status, evidence? }`; `status` is `unconfirmed`, `confirmed` or `false`. `alias` (`f1`, `f2`, ...) is given by the server in the order the player found them, is unique in the game and survives a reload. `evidence` is `{ kind, label, held }`. A confirmed finding carries `needs[]`, and `fixed: true` when its weakness is now fixed; the view then shows Fixed. `fixed` is worked out on each read and is never sent on an unconfirmed finding | core plan sections 0, 5.3 and 5.5 |
| Core: noise | A block of an open or swept network carries `noiseLimit` whenever the network declares an alert (so "Noise 0 of 5" shows before any noise), `noise` once above zero, and `alerted: true` once the limit is reached; an unswept block, or one with no alert and no noise, carries none and shows no line. A probe adds one; so does a card of the wrong class, product or version, or any card on a false finding. The core names no separate note that says an answer was quiet or noisy: the player reads it from the Confirm or Probe label before and the noise line after | core plan sections 5.3 ("The noise keys on a block") and 5.4 |
| Core: shared module | `network-view/ops-model.js`, pure, importing nothing: row merging, the works-on line, need and evidence labels, alias lookup (alias to finding id, technique id to the held card's item id) and `REFUSAL_TEXT`, the one table from a `reason` code to words. The core expects S6 to add its own exports to this file | core plan sections 5.5 and 12.2 |
| Core: answers | Sweep `{ network: { id, swept, hosts } }`; host scan `{ host }`; check `{ hostId, service, findings }`; confirm `{ finding, quiet }`, with `noise` when it was a probe; a use answers a session (the desktop then opens) or `keyringChanged: true`; a repeat adds `already: true`; a refusal is `{ success: false, reason, need?, noisy?, noise? }` with `reason` a code. There are thirteen codes, kept in `test/fixtures/files/ops_refusal_codes.json`: twelve from the ops routes (the quiet `no_grant` among them) and `network_only` from the desktop route, sent when a session made by a technique is opened with no network route to it. Any answer that changed the noise count carries the block's new `noise`, and `alerted` and `serverGlobals` when it reached the limit | core plan sections 5.4 and 6 ("The refusal codes, in one list") |
| Core: events | Seven, each also as `<name>:<id>`: `network_swept`, `network_host_scanned`, `network_service_checked`, `network_finding_confirmed`, `network_technique_used`, `network_technique_refused`, `network_alerted` | core plan section 5.5 |
| Core: test snapshot | `getTestState()` gains per host row `scanned`, `services`, `findings` and the session's `access`; per finding `alias`, `status`, `fixed`, `evidence`, `needs` and whether its confirm action is quiet; each with the selector of its action, built from the hooks; per block `swept`, `ops`, `noise`, `noiseLimit`, `alerted`; top-level `techniques` and `selectedFinding` | core plan section 5.5 |
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
  builds neither: it puts the Terminal renderer behind that same path (section 5.2).
- Display settings are **not** reused for the skin. A write there fires a canvas resize behind
  the open view, the whole-object rewrite would clobber a value written from elsewhere, and its
  menu page is drawn in every game, while the switch must appear only on an ops network. The
  skin keeps its pick under its own storage key (section 8).
- The `ehr-terminal` minigame's stylesheet uses a different font and its own fixed palette, so
  there is nothing in it to share. There is no console font size to inherit and no handling of
  on-screen keyboards; sections 5.4 and 5.5 set both.

## 3. Build stages

Four stages, built after the core's S1 to S3 are on main. Each is shippable alone and is proved
by tests and runs that exist when it lands. Total size M.

| Stage | Adds | Proved when it lands by | Size |
|---|---|---|---|
| K1 Split | The private control list and `offers()`; the Panels drawing moved out of the scene into a renderer that takes its buttons from the list; the fixed texts moved to a constants file; the text exports added to `ops-model.js`, so any line the Panels compose inline from answer fields has one source both renderers call; each renderer routed through the core's `perform` path and pending guard (core 5.3), which K1 neither builds nor replaces, with `offers()` marking an offer `pending` by reading the pending set and `pendingKey` that the core's scene exposes (core 5.3). No visible change, and no change to what a press sends | The existing network-view node tests and the core's, with no edit to an assertion; the byte comparison of old and new DOM over every fixture, a locked remote session and a block with noise among them; the control-list tests of 11.1; a rerun of the scripted playtests of `test_access_networks` and `test_ops_access` | S |
| K2 Terminal | The skin choice and its storage; the header switch on ops views; the Terminal renderer, grammar, help and completion for every control in the list; `window.__test.network`; the `--net-skin` option of the playtest tools; the feature scenario `test_ops_skin` | All node tests of 11.1 and 11.2; the unchanged-scenarios check of section 10; the scripted beats of 11.4 run through the bridge once in each skin, with the request and server-record checks of the scenario's `PLAYTEST.md`; the screenshot set, the UI rules audit over the Terminal and the phone keyboard check of 11.6, looked at before the stage lands | M |
| K3 Scenario default | The scenario field `networkView.defaultSkin`, its schema entry, the validator checks and the wording warning | The Rails and validator tests of 11.3; beat D1 of 11.4 | S |
| K4 Live proof | The live parity runner and the docs, which change nothing a player sees (README feature index N16, `docs/ACCESS_AND_NETWORKS.md`, `docs/test-bridge.md`) | The live parity run green on `test_ops_skin`; the leak scan clean | S |

## 4. Scenario fields

One optional top-level block, added in K3, written `{ "networkView": { "defaultSkin": "cli" } }`.
It is not a secret and is sent to the browser.

| Field | Values | Meaning |
|---|---|---|
| `networkView.defaultSkin` | `"gui"` (default) or `"cli"` | The skin an ops view opens in for a player who has not picked one |

The block is closed (`additionalProperties: false`, `_` note keys allowed). No other stage's
fields change. The field has no effect on a view with no `ops` block. Whether a scenario may also
force a skin, and whether the default belongs here or in `mission.json` beside `ui_theme`, is
open question 1; this plan is written to its recommendation.

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

## 5. Engine behaviour

### 5.1 Server

Nothing. S6 adds no route, no model code and no state. The only server-side changes are the
schema entry for `networkView` and a test that the block reaches the bootstrap (section 7).

### 5.2 Client: the parts

All under `public/break_escape/js/minigames/network-view/`.

| File | Kind | Role |
|---|---|---|
| `ops-model.js` | pure, the core's | Unchanged in purpose: row merging, the works-on line, need and evidence labels, alias lookup, `REFUSAL_TEXT`. S6 reads through it and, in K1, adds exports to it as the core plan expects: `findingLabel(finding)`, `needLine(need)`, `useResultText(answer)`, and one function for each line the Panels would otherwise compose inline from answer fields (the noise line of a block, the Fixed mark, the "admin" tag of a session). The Panels renderer is changed to call them, so each such line has one source. |
| `view-texts.js` | constants, new | The scene's fixed texts (section 2, `UNPLUGGING_TEXT` among them), moved here so both renderers can import them. The scene re-exports them, so existing tests are unchanged |
| `view-controls.js` | pure, new | `CONTROLS`, the private control list below, and `offers(view)`: every offer open right now, in display order; and `LOCAL_ACTIONS`, the `data-action` values that only select (below) |
| `skin-choice.js` | new | `chooseSkin(inputs)`, pure, implementing the order of section 4; `readPick(storage)` and `writePick(storage, name)`, which touch storage only when called |
| `network-view-minigame.js` | scene | Keeps what it has: load, refetch, the handlers (`act`, `unplugBox`, the core's calls), every event, the way back, the test snapshot, and the core's `perform(offer)` path with its pending guard and the `pending` set and `pendingKey` it exposes (core 5.3). New: it mounts one of two renderers and gives each `ctx.perform(offer)`, which leads into that path |
| `network-view-panels.js` | renderer, new | Today's HTML and the core's, moved. Its `data-*` hooks are unchanged. It exports `DRAG_EVENTS`, the event names its drag listens for, in order, for the tests and the bridge |
| `network-view-terminal.js` | renderer, new | Prompt, log, quick commands |
| `terminal-grammar.js` | pure, new | `parse(line, offers, view)`, `complete(line, offers, view)`, `commandFor(offer, view)`, `helpFor(verb)`. A finding's alias is resolved with the core's alias lookup over `view`; the grammar holds no alias table of its own |
| `terminal-format.js` | pure, new | `formatListing(view)`, `formatResult(offer, answer, view)`: arrays of plain text lines |

S6 adds no second model: no second set of rows, no alias scheme, and no copy of a label or a
refusal text. Its own pure code is the control list, the grammar and the layouts.

**The control list** is one table in `view-controls.js`, keyed by the control's name. For every
control but `unplug` the name is the button's `data-action` value; `unplug` is the list's name
for the header button the Panels mark `data-unplug`.

| `action` | Drawn on | Panels label | Terminal line | The scene's handler |
|---|---|---|---|---|
| `sweep` | a discovery block not yet swept | Sweep | `sweep [<network id>]` | the core's sweep call, `network_id` |
| `scan` | an unscanned host row in an `ops` block | Scan | `scan <host id>` | the core's scan call, `host_id` |
| `check` | a service tile | Check | `check <host id> <service name>` | the core's check call |
| `confirm` | an unconfirmed finding | Confirm when the finding's `evidence.held` is true; Probe when it is false or the finding has no evidence | `confirm <alias>` under Confirm, `probe <alias>` under Probe | the core's confirm call, `finding_id` |
| `use` | a held technique and a listed finding | Use | `use <technique id> on <alias>` | the core's technique call, `finding_id` and `item_id` |
| `sign-in` | a host row whose action is `sign-in` or `locked` | Sign in | `signin <host id>` | `act(row, 'sign-in')` |
| `open` | a host row with a held session | Open | `open <host id>` | `act(row, 'open')` |
| `open` | a share row | Open | `open <share id>` | `act(row, 'open')` |
| `observe` | any other resource row | Look | `look <resource id>` | `act(row, 'observe')` |
| `unplug` | the header of a planted box's view | Unplug | `unplug` | `unplugBox()` |

Each entry holds the label, the Terminal verb, the kind of row it is drawn on and a one-line
description used as the button's `title` and as the `help` text. The conditions in the "Drawn
on" column are the ones the scene and the core use today (`hostAction`, `resourceAction`, the
block's `ops` and `swept`, the row's `scanned`, the finding's `status` and `evidence.held`),
called from `offers()` and written nowhere else. A verb together with the kind of its target
names exactly one entry: `open` on a host and `open` on a share are two entries, told apart by
the target, and hosts, shares and resources share one id space.

**`sign-in` on a locked session.** `hostAction` answers `locked` for a remote session that has
locked, and the row then shows the lock badge and a Sign in button together (`NV:687-693`).
`offers()` therefore yields a `sign-in` offer for a host row whose action is `sign-in` or
`locked`. The lock badge stays a status; it is not a control.

**An offer** is `{ action, target, label, command, pending? }`. `target` holds the ids of the
request: `{ networkId }`, `{ hostId }`, `{ hostId, service }`, `{ findingId }`, `{ findingId,
techniqueId, itemId }`, `{ resourceId }` or `{}`. A `confirm` offer's `label` is the one the
server's finding gives it (Confirm or Probe), never worked out from the inventory in the
browser. `pending: true` marks an offer whose request is out (below).

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
skin-blind test must not require them; the Terminal's quick command carries `data-quiet` on a
confirm control, as Panels do. The fix is one entry in
the list, plus a layout in `terminal-format.js` if the answer has a new shape. A plan that adds
a refusal code adds it to `ops_refusal_codes.json` and its words to `REFUSAL_TEXT`. One that
draws something new on a row (a badge, a tag) puts its words in `ops-model.js` and in the
Terminal's table in the same change, or test 9 fails. A control on another screen (a desktop, a
device, a cracking minigame) is outside this view and has one look.

**The renderer contract.** A renderer is a class with `mount(root, ctx)`, `render(view, offers)`,
`showResult(offer, answer)`, `noteChange()`, `unmount()` and `testState()`. `ctx` holds
`perform(offer)`, `requestClose()` and `requestSkin(name)`, and nothing else. A renderer:

- imports only the pure modules of this folder and the escape helper;
- never names `fetch`, `ApiClient`, `networkLinks`, `window.open*` or `window.start*`;
- emits no game event. The scene emits all nine (the two of today and the core's seven,
  `network_alerted` among them), so objectives and ink mappings see the same events from both
  skins;
- draws authored and server text with `textContent` (Terminal) or the existing escape helpers
  (Panels);
- may keep local state that is not part of any offer: the Panels' selected finding and a drag in
  progress, the Terminal's half-typed line. Local state ends in one call of `perform` with one
  complete offer, or in nothing;
- is the only code that writes into the view's DOM. The scene draws the header switch and
  nothing else.

**`perform`** is the core's (core 5.3): the scene's one path for every action of this screen and
the one way either skin causes a request. `ctx.perform(offer)` passes the offer's action and
target into it, the same pairing the delegated click listener makes today from a button's
`data-action`. It sends to the route that action already has; the server sees no difference.

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
  `sweep`, `scan`, `check`, `confirm` under either label, `use` and `unplug`. `sign-in`, `open`
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
  whichever renderer is mounted when it arrives, through its `showResult`; the Terminal prints
  such a result with no echo line before it.

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
| > sweep                                                           |
| Office network                                                    |
| HOST       NAME              STATUS                               |
| fin_pc01   Finance desk 1                                         |
| files01    File server       Remote sign-in off                   |
| > probe f2                                                        |
| f2  confirmed                                                     |
| Noise 1 of 3                                                      |
| > _                                                               |
+-------------------------------------------------------------------+
| Commands:  [Scan  scan files01] [Sign in  signin fin_pc01] ...    |
+-------------------------------------------------------------------+
```

The sketch shows the arrangement only. The status, noise and result wording in it stands in for
the Panels' own sentences, which the Terminal prints word for word (below).

- **Log**: `role="log"`, `aria-live="polite"`, pixel scrollbar, capped at 300 lines (oldest
  dropped). It is kept for the length of the trip in a module variable keyed by foothold id, so
  coming back from a sign-in screen shows the same log; it is dropped when the trip ends. It is
  never saved or synced.
- **Prompt**: one real `<input type="text">` with a visible label, `autocomplete="off"`,
  `autocapitalize="off"`, `spellcheck="false"`. Enter runs the line. Up and down walk the trip's
  command history (20 entries).
- **Quick commands**: one button per offer for every control but `use`, in the order `offers()`
  gives, which is the order Panels draws its controls in. Each button shows the Panels label
  (Probe where the Panels button says Probe, and `Open (<who>)` with the account where the
  Panels button has it) in a `<span>` and, in a `<code>` element, the line it stands for, with
  no text outside the two. It carries the same `title` text as the Panels control (the
  description in `CONTROLS`), so a hover gives the same words in either skin. It also
  carries the hooks the Panels control carries: the same row attribute on its item
  (`data-host-id`, `data-resource-id` and the core's row attributes) and the same `data-action`
  value, and Unplug carries `data-unplug`, so `[data-host-id="…"] [data-action="sign-in"]`
  finds one button in either skin. Pressing a button writes its line to the log and performs
  its offer. A pending offer's button is disabled; a pending Unplug reads `UNPLUGGING_TEXT`.
- **Quick commands for a use**: two presses for one offer. There is one button per held
  technique, labelled with the Panels' Use label and the technique's name. Pressing it writes
  `use <technique id> on ` into the prompt and swaps the strip for one button per listed
  finding, labelled with its alias; pressing a finding completes the line and performs the
  offer. An X on the strip returns to the full list. This is the Terminal's form of
  select-then-Use.
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
core's `ops-model.js`; the Terminal has no wording of its own for them.

| Layout | Printed when | Fields and texts |
|---|---|---|
| Link lines | `show`, and on opening | the view's `message`; the link-off sentence; the stale sentence; the unplug hint of a planted box's view ("You can unplug the box at its port (...)", `NV:813`); for each block its heading, the "through <host>" note and its "(Locked)" mark |
| Noise line | `show`, under the heading of each block that carries `noiseLimit` or `noise`; after any answer that carries `noise` | the block's count (zero when only the limit is sent), the limit where one is sent, and the Alerted mark once `alerted` is true: the Panels' line, from the `ops-model.js` export. A block that carries neither key prints no line, as Panels show none. When `alerted` is true the scene applies `serverGlobals` and emits `network_alerted` on its own path, the same for both skins |
| Host table `HOST NAME STATUS` | `show`; a sweep's answer | host id; the shown hostname where it differs; name; in the status column the status text Panels shows on the row (remote sign-in off, powered down, no route, the down tags, Locked), left blank for a host Panels shows only a button on; the "Session kept" line; a held session's account (the `<who>` of the Panels' Open button) and the "admin" tag where Panels draw it, from the same `ops-model.js` export |
| Service table `SERVICE PORT PRODUCT VERSION` | `show` for a scanned host; a host scan's answer | service `name`, `label` when it differs, port, product, version |
| Findings list | `show` for a checked service; a check's answer | alias, the finding label (class and severity words), `summary`, status, and the finding's evidence line exactly as Panels shows it (what would settle it quietly, and whether it is held) |
| Finding detail | a confirm's or a probe's answer; `show` for a settled finding | alias and status; for a confirmed finding each need with its label and "yes" or "no"; for a false one the `falseBecause` text; the Fixed mark for one that carries `fixed`. An answer that carries `noise` is followed by the noise line, which is how either skin shows that a probe was noisy; a quiet confirm prints no noise line |
| Technique list `TECHNIQUE WORKS ON` | `show` | technique id, `name`, `summary`, the core's works-on line |
| Share and resource table; Look | `show`; an `observe` | id, name, kind label, "on <host>", the lock label and the locked-share sentence; for a look, the resource's `observations` and the notice, as Panels shows them |
| Use result | a use's answer | the result sentence for a session (then the desktop opens, as from Panels), for a credential (`keyringChanged`) and for `already`; on a refusal the `REFUSAL_TEXT` words for the `reason` code, with the need's label for `need_unmet`, and then the noise line when the answer carries `noise` (the four noisy codes). The quiet codes, `no_grant` among them, print their words and no noise line |
| Pending | an `unplug` while its request is out | `UNPLUGGING_TEXT`, the Panels button's label for that state, on the quick command and as one log line |
| Refusal | any other refused request | the `REFUSAL_TEXT` words for the code, for the twelve codes of the ops routes. The thirteenth, `network_only`, has no Terminal form because it never reaches a network-view renderer: it answers a desktop request made at the PC's own keyboard, never one made from this view, and the core handles it in the sign-in desktop path and shows no line (core 5.4). The unplug refusal is the one refusal on this screen that arrives as a server sentence (`out.message`, `NV:848`); it is printed as Panels shows it, through `textContent` |

**Quiet or noisy.** Neither skin has wording of its own for it: the Confirm or Probe label
before the press and the noise line after carry it, and the Terminal prints both (core 5.3).

The column headers are plain words taken from the core's field names; no layout reproduces a
real tool's output. **What it may print**: constants from `terminal-format.js`, `view-texts.js`
and `ops-model.js`, the ids, aliases and fields of the view answer and of a result, and the
player's own line. Nothing else: no invented host, port, service, version or filler row, and no
random text.

**Text only the Terminal has.** Everything the Terminal prints that Panels never shows is in one
exported list, `TERMINAL_ONLY_TEXT` in `terminal-format.js`, and none of it is about the game's
state:

| Entry | Text |
|---|---|
| Fixed lines and marks | the opening line "Type help, or pick a command below."; the prompt mark `>`, the block cursor and the prompt's visible label; the strip label "Commands:" and the label of the use strip's X; the change line "-- network changed. show lists it again --"; the pending line "Still waiting for the last answer."; the player's own echoed line |
| Table headers | `HOST`, `NAME`, `STATUS`, `SERVICE`, `PORT`, `PRODUCT`, `VERSION`, `TECHNIQUE`, `WORKS ON` and the headers of the findings, share and resource tables |
| Help | the output of `help`: verb names, their argument forms and the verb aliases (the descriptions are the Panels' `title` texts and are not on this list) |
| Command line | a verb from `CONTROLS` followed by ids or aliases the view lists: the `<code>` part of a quick command, the line a use button writes into the prompt, and the verb named by the strict `confirm` and `probe` answer |
| Parse messages | the fixed parts of the answers to a line that does not resolve (below) |

A reachable host's state word, the noise line, a finding's alias, `UNPLUGGING_TEXT` and every
result sentence are not on this list: they are Panels text and must match it.

**Grammar.** A line is `verb [target ...]`.

- Verbs: one for each control (`sweep`, `scan`, `check`, `use`, `signin`, `open`, `look`,
  `unplug`), two for `confirm` (one per label: `confirm` and `probe`), and five local ones that
  send nothing: `help [verb]`, `show` (print the current listing), `clear`, `exit` (close the
  view, as the X does) and `panels` (switch skin). Each verb alias goes to exactly one verb:
  `login` and `connect` to `signin`; `ls` to `show`; `run` to `use`; `quit` to `exit`.
- `sweep` with no target is accepted when exactly one block offers a sweep.
- Forgiving: case and extra spaces are ignored. A verb or target may be shortened to any prefix
  that is unique among what is on offer (`sig fin` runs `signin fin_pc01`). The word `on` is
  allowed and ignored.
- `confirm <alias>` resolves only to an offer labelled Confirm and `probe <alias>` only to one
  labelled Probe. Typed against a finding that carries the other label, the line sends nothing
  and prints that finding's evidence line (the Panels' text) and the verb its control has. A
  player who types `confirm` is never charged noise they were not shown, and one who types
  `probe` with the evidence in hand is told the quiet way is open.
- A line that does not resolve sends nothing and costs nothing. An unknown verb answers with the
  nearest verb. An ambiguous prefix lists the matches. A target that names something the view
  lists, but which has no offer for that verb (a host with remote sign-in off, with no route or
  powered down given to `signin`; a locked share given to `open`; a settled finding given to
  `confirm`), prints that row's status text, the same sentence Panels shows on the row, so both
  skins give one explanation of one state. Only a target the view does not list answers with
  the list of what that verb can be used on, and that answer is the same whether or not the id
  exists somewhere unseen. These answers echo the player's own text, always through
  `textContent`. A typo can never spend a sign-in attempt, add noise or trip a lockout, because
  only a line that resolves to a current offer reaches a handler.
- A line that resolves to a pending offer prints the pending line and sends nothing. Enter on
  an empty prompt does nothing, so a held Enter key cannot repeat the last line.
- Tab completes the token under the cursor to the longest common prefix and lists the matches
  in the log on a second press. The manager's Tab trap runs first and steps aside only for an
  element marked `data-own-tab-cycle`, so the prompt carries that attribute while it holds text
  and drops it when empty. With an empty prompt Tab moves focus as usual, and a keyboard user
  can reach the quick commands, the switch and the X.
- `help` prints each verb with the one-line description its Panels button has as its `title`.
  Both come from `CONTROLS`.

### 5.4 Pixel-art UI rules

| Rule | How the Terminal skin meets it |
|---|---|
| Pixel fonts only | The log and the prompt are VT323 at 16px, the font's own pixel grid. Quick-command buttons keep the `.minigame-button` look and its GNF font, as the Panels buttons have, with the command part in a `<code>` element, which the framework already sets in VT323. Press Start 2P stays on the title bar. The size is checked in the K2 screenshots at desktop and phone widths |
| 2px borders, no radius | The prompt box, the quick-command buttons and the switch use the `.minigame-button` look; the cursor is a solid block |
| Device frame | The view is already the link device's console in the shared console window. The Terminal is that console's other mode, inside the same frame |
| X closes, no Cancel | The shared X and Esc close it. `exit` is a second way in, not a Cancel button. The finding strip of a use has an X |
| One look per concept | The switch looks the same in both skins and sits in the same place. Both skins use the view's existing colours: the Terminal adds no palette and no theme tokens, because the Panels use none |
| Crisp text | No text shadow, glow or scanline overlay on the log |

The Terminal's rules go in the existing `css/network-view-minigame.css`, so the game page needs
no new stylesheet link. The UI rules audit (`tools/playtest/ui-rules-audit.mjs`) reports the
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
view answer, the result and the player's line.

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

Only `GET /scenario` (the bootstrap) changes: it sends `networkView.defaultSkin`, and there is
nothing new to withhold. Every other route is unchanged.

- `networkView` holds a presentation choice only; the closed schema leaves nowhere to put a
  secret. The bootstrap filter deletes named keys and passes the rest, so the block arrives
  without a change to the filter. A model test pins that it does, and that a scenario without
  the block has no such key.
- The Terminal shows what the view answer and the results contain, which is what the Panels
  show. `terminal-format.js` receives nothing else. Test 9 of section 11.2 checks both
  directions.
- **Ids.** The Terminal prints ids that the server has already sent for listed things: host,
  network, share, resource and technique ids, and service names. The Panels may not print all of
  them. Nothing new reaches the browser by this, and nothing is printed before the core's rules
  allow the row to arrive. A finding is printed by its alias only; its built id, which contains
  the author's weakness id, is printed by neither skin.
- **Noise, evidence and the alert.** `noise`, `noiseLimit`, `alerted` and a finding's `evidence`
  reach the browser under the core's rules (its section 7). The Terminal prints them when and
  only when the Panels show them. It never prints a limit the server did not send.
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

Nothing is added to `player_state`, to the sync sections or to any server answer, so the delta
rule has nothing to judge. Findings, their aliases and the noise count are the core's server
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

**Validator** (K3):

| Level | Check |
|---|---|
| Error | `networkView.defaultSkin` is not `gui` or `cli` (from the schema) |
| Error | An unknown key in `networkView` (closed block, with the usual "did you mean") |
| Warning | `networkView` is set in a scenario where no host declares `services`: no view will be an ops view, so it has no effect |
| Warning | Skin-specific wording: in a scenario that uses `services`, an objective, hint, mail or ink line that pairs a control word (click, press the, button, type, command line, prompt, terminal) with an action word (sweep, scan, check, confirm, sign in, technique) |

The wording check is a warning because it is a pattern match and will have false positives (an
NPC may mention a terminal in passing). It goes in the dialogue lint the validator already runs
for ink, and in the core's `scripts/validate_network_ops.rb` for objectives and other text.

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
   `ops-unchanged-validator.test.mjs` already compares them with a snapshot.

The core's own ops scenarios (`test_ops_scan`, `test_ops_findings`, `test_ops_access`) are not
"existing" in this sense: K2 adds the header switch, and with no stored pick and no default they
open in Panels, so their scripted playtests run as written.

## 11. Tests

### 11.1 Node tests (`test/js/`)

Fixture view answers live as JSON files in `test/js/fixtures/network-view/`, created in K1. The
tests below read every file in that folder, so a plan that later adds a fixture for a new field
or control gets these checks on it.

| File | Stage | Proves |
|---|---|---|
| `network-view-controls.test.mjs` | K1 | `offers()` for each fixture: order, targets, one offer per pressable control, every use pair, the `itemId` rule. A locked remote session yields a `sign-in` offer beside its lock status. A finding with `evidence.held` true yields a `confirm` offer labelled Confirm; one with it false, and one with no evidence, yields the same offer labelled Probe, with the same target. A settled finding yields no `confirm` offer. With a key in the pending set the offers under it carry `pending: true` and no other offer does; each `use` pair has its own key. `CONTROLS` is well formed: each entry has one label, one verb and one description, and a verb together with a target kind names exactly one entry. Every `data-action` literal in `network-view-panels.js` is a key of `CONTROLS` or an entry of `LOCAL_ACTIONS` (`select-finding`, `select-technique`), no value is in both, and `data-unplug` appears there once, for the `unplug` entry |
| `network-view-panels-same.test.mjs` | K1 | Each fixture rendered by the scene as it was (output saved as a fixture string before the split) and by the Panels renderer is equal byte for byte; a press on each control records the same call before and after. With the unplug's answer held, the header button is disabled and reads `UNPLUGGING_TEXT`, and a refused unplug shows the server's sentence beside the button, both as the saved output has them; the scene file contains no `querySelector('[data-unplug]')` and no `setUnplugNotice` |
| `network-skin-imports.test.mjs` | K1 | The two renderer files and the pure modules import nothing outside the allowed list and do not contain `fetch(`, `ApiClient`, `networkLinks`, `window.open` or `window.start` |
| `network-terminal-grammar.test.mjs` | K2 | Each verb and verb alias; ids, prefixes and the server's finding aliases, resolved through the core's lookup (a fixture whose findings arrive in an order different from their alias numbers still resolves `f1` to the server's `f1`); a built finding id is not accepted; `on`; `sweep` with no target; case and spacing; `confirm` on a Probe finding and `probe` on a Confirm finding return the evidence line and no offer; a line for a pending offer returns the pending line and no offer; unknown verb, unlisted target and ambiguous prefix return a message and no offer; a listed row with no offer for the verb (remote sign-in off, no route, powered down, a locked share, a settled finding) returns that row's status text from `view-texts.js` or `ops-model.js` and no offer; completion results. Hostile input (markup, control characters, a 10,000 character line) returns no offer, and the "nearest verb" and "unknown target" answers that echo it are set as plain text |
| `network-terminal-format.test.mjs` | K2 | One layout per answer shape of section 2 (sweep, host scan, check, a quiet confirm, a probe with `noise`, each of the three use outcomes, each code in the core's `ops_refusal_codes.json` but `network_only`, so twelve today (`no_grant` with no noise line), an answer with `alerted`, `already`); every field in the table of 5.3 is printed. Noise fixtures: a block with neither key prints no noise line; one with a limit and no count (zero of the limit); one with a count and no limit; one with a count and a limit; one alerted. Evidence fixtures: held, not held, none declared. The noise line and the evidence line equal the `ops-model.js` exports' output for the same input |
| `network-skin-parity.test.mjs`, `network-skin-text.test.mjs` | K2 | Section 11.2 |
| `network-skin-choice.test.mjs` | K2 | The order of section 4, case by case: a press beats a URL value; a URL value beats a stored pick and is not written to storage; a press with a URL value present changes the skin and writes nothing; a press with no URL value is stored; a bad stored value is ignored; blocked storage still switches; a view with no `ops` block is `gui` under every combination; the switch is drawn only with an `ops` block and removed when a refetch has none |
| `network-skin-unchanged.test.mjs` | K2 | Section 10, check 1 |

**Harness copy lists.** The seven new modules (`view-texts.js`, `view-controls.js`,
`skin-choice.js`, `network-view-panels.js`, `network-view-terminal.js`, `terminal-grammar.js`,
`terminal-format.js`) are static imports of the scene, so each goes on the copy list of every
test that copies `network-view-minigame.js`: `network-view.test.mjs` (its list at `:15-40` shows
the pattern), `minigame-consoles-fit.test.mjs`, `pc-monitor-frame.test.mjs`,
`escaping-shared-helpers.test.mjs` and the core's `network-view-ops.test.mjs`. The builder
greps `test/js` for `network-view` before finishing, since other branches add tests.
None of the seven touches `localStorage` or `window.location` at import, so no harness needs a
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
| `button` | Panels | Press a row's `[data-action]` button, or the header's `[data-unplug]` | sweep, scan, check, confirm (under either label, Confirm or Probe), sign-in (a locked session's included), open, observe, unplug |
| `select` | Panels | Select a finding, select a card, press Use, by pointer or by keyboard | use, for every pair in the list |
| `drag` | Panels | Drag a card and drop it on a finding | use, for every pair in the list |
| `typed` | Terminal | Type a line and press Enter | every offer |
| `quick` | Terminal | Press a quick-command button; for a use, two presses: the card's button, then the finding's | every offer |

What each skin shows beside its controls is held equal at every step by the text test (9): every
text in the layouts table of 5.3 (the noise line and Alerted mark, the evidence line, the alias,
the Fixed mark, the "admin" tag, the refusal words), the Confirm or Probe label (the button's
label in Panels, the quick command's label and the verb of its line in the Terminal), and a
request that is out (the control disabled in both, Unplug reading `UNPLUGGING_TEXT`, and a typed
line for a pending offer answered with the pending line). Quiet or noisy has no item of its own:
the label and the noise line carry it.

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
   to that offer; for a `confirm` offer the line begins `confirm` or `probe` as its label says,
   and both send the same call. A quick-command use is one path of two presses, and the first
   press alone records nothing.
4. **Use pairs.** For a fixture with two held techniques and four findings (one `unconfirmed`,
   one `confirmed`, one `false`, one `confirmed` that carries `fixed: true`), all eight pairs are
   reachable by `select`, `drag`, `typed` and `quick`, and each sends that pair's `finding_id`
   and `item_id`. With two held cards of one technique there is one offer, and every path sends
   the `itemId` of the server's `techniques` entry.
5. **Refusals are the same.** For each code in the core's `ops_refusal_codes.json` but
   `network_only`, a fake answer with that code produces the same sentence in both skins (the
   text comes from `REFUSAL_TEXT`), and neither skin sends a second request. The file is read,
   not copied, so a code a later plan adds is walked too; `network_only` is skipped by name,
   since no network-view renderer is given it (this plan's 5.3), leaving twelve today. A noisy refusal
   (`noisy: true` with `noise`) shows the same noise line in both before any refetch; a quiet
   one, `no_grant` among them, shows none in either. With `alerted` both show the Alerted mark,
   and the scene applies `serverGlobals` once in each run. The same holds for a probe's answer,
   and a quiet confirm shows no change of noise in either.
6. **Nothing typed can reach past the list.** Typed lines that name a host, finding or card from
   another fixture, a well-formed id that is not listed, or a finding not yet checked record no
   call.
7. **Events.** For one scripted sequence run once per skin, the events the scene emits are
   deep-equal, all nine: `network_viewed`, `network_host_opened`, `network_swept`,
   `network_host_scanned`, `network_service_checked`, `network_finding_confirmed` (with its
   `quiet` value), `network_technique_used`, `network_technique_refused` (with `noisy`) and
   `network_alerted`, with their `<name>:<id>` forms and payloads. The sequence includes a
   probe that reaches the fixture's noise limit.
8. **Switching.** A switch in the middle of the sequence records no call, emits no event and
   leaves the recorded lists unchanged. A finding selected in Panels is not carried into the
   Terminal and the reverse: selection is local to a renderer and is never part of an offer.
9. **Everything shown is shown in both** (`network-skin-text.test.mjs`). Fixtures whose every
   text field is a unique marker string (names, labels, summaries, evidence labels, need labels,
   `falseBecause`, the unplug refusal's message) are run in both skins through one sequence: the
   opening render, then each offer of the fixture in `offers()` order with the same fake answer
   in both, a refetch answer after each, for each ops route one refusal per code and one
   `already`, and one unplug whose answer is held and then refused. The two skins are compared
   **at every step**, never as a total over the run, so text that one skin shows at the wrong
   moment fails at that moment.

   Two comparisons per step:
   - **Result.** Straight after `showResult`, before the refetch: the Terminal's pieces are the
     log lines that step added, less the echo; the Panels' pieces are those in the view after
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
     listed row, or matches an entry of `TERMINAL_ONLY_TEXT` (section 5.3).

   `PANELS_ONLY_TEXT` lives in the test file and holds the section headings that the Terminal
   replaces with table headers. `TERMINAL_ONLY_TEXT` is the exported list of section 5.3, and
   the test also fails if the Terminal prints one of its entries that the list in the plan does
   not name. Button labels and `title` texts are in neither list: they appear in the Terminal
   as the quick commands' labels and titles. Finding aliases, noise lines, evidence lines, the
   Alerted mark, the Fixed mark, the "admin" tag and `UNPLUGGING_TEXT` are in neither list:
   they are the server's or the Panels' text and must match at every step. The fixtures
   include a block at zero noise with a limit, one below its limit, an alerted block, a
   finding with held evidence, one with evidence not held, one with none, a fixed one, a
   locked remote session, an admin session and a planted box's view with its unplug hint. An
   entry added to either list needs its reason stated in the commit.
10. **One press, one request.** With the fake answer of a guarded offer held unresolved, each
    of these records no second call: in Panels a second click on the same control, and for a
    use a second press of Use and a drag of the same card onto the same finding; in the
    Terminal a second Enter on the same line, a second press of the quick command, and the
    other path (typed then quick, quick then typed). The same holds across a switch: press in
    one skin, switch while the answer is held, press in the other; when the held answer then
    resolves, the mounted skin's `showResult` receives it once and draws it, and the
    unmounted skin's is not called. It is run for `sweep`, `scan`, `check`, `confirm` under
    each label, `use` and `unplug`. An offer under a different key (a scan of another host, a
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
   only with its reason beside it, and no ops field (`finding`, `alias`, `status`, `noise`,
   `noiseLimit`, `alerted`, `quiet`, `noisy`, `reason`, `need`, `already`) may be on it.
4. At the end read each game's server record and compare these keys only: `footholds`,
   `sessions`, `opsDiscovered`, `opsFindings` (aliases included), `opsUsed`, `opsNoise`, the
   global the alert sets, the keyring's entries, and the log rows. The rows are read with the
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
| Validator tests | K3 | The four checks of section 9; the graph is the same with and without the block |
| `tools/playtest` shell test | K2 | `session-start.sh` gives the same session tag with and without `--net-skin` |

### 11.4 Feature scenario `test_ops_skin`

Added in K2. A small copy of the core's fixtures: one office network marked for discovery with
an alert limit of three, a jack and a drop box, two sign-in hosts (one with a held session path,
one with remote sign-in off), a file server with one service that has two real weaknesses and
one decoy, two technique cards for different techniques, an open share and a printer to look
at. The first real weakness names an evidence item the player starts with; the second real
weakness and the decoy have none. The scenario declares one log source that takes the core's
network events, so the live run has rows to compare. Its objectives and hints follow the
wording rule of 5.6. K3 adds `networkView.defaultSkin: "cli"`.

The beats are written once in the scenario's `PLAYTEST.md` and run twice in K2, once with
`--net-skin gui` and once with `--net-skin cli`, through `window.__test.network`. After each beat
the script checks the requests sent, what the answers held, what the skin shows, and the
server's record.

| Beat | What happens | Server record afterwards |
|---|---|---|
| T1 | Plant the box; the view opens in the starting skin with the header switch; the block shows no host and no noise line | foothold held |
| T2 | Terminal run only, before any sweep: a mistyped verb (`scna`), which prints the nearest verb; then `scan` with an invented host id and `scan` with the real id of the file server, whose network is not yet swept. Both `scan` lines print the same message, the unlisted-target answer with an empty list of what `scan` can be used on | unchanged; no request sent |
| T3 | Sweep the network: the block now shows its noise line at zero of three. Then scan the file server. Terminal run only: `signin` on the host with remote sign-in off prints the status sentence its Panels row shows | as `test_ops_scan` records; no request for the typed line |
| T4 | Check the service: three findings, each under the alias the server gave. The first real finding's control reads Confirm; the other two read Probe. Confirm the first (quiet; noise still 0 of 3). Probe the decoy (false, with its reason; noise 1 of 3). The second real finding is left unconfirmed. Terminal run only: `confirm` typed on that finding prints its evidence line and sends nothing | as `test_ops_findings` records: two findings settled, one not; `opsNoise` 1 |
| T5 | Use a card on the decoy (refused `false_positive`, noisy; noise 2 of 3) and on the unconfirmed finding (refused `not_confirmed`, quiet; noise unchanged). Then probe that finding (confirmed; noise 3 of 3, Alerted) | the same refusal codes and sentences in both runs; `opsNoise` 3; the alert global set; the `network_alerted` event fired once |
| T6 | Switch skin; the same hosts, service, findings under the same aliases, statuses, noise count, Alerted mark and cards are shown; switch back | unchanged; no request sent |
| T7 | Use the first card on its finding (Panels: select then Use; Terminal: typed). Use the second (Panels: drag; Terminal: quick commands) | a session at the stated access; a keyring entry |
| T8 | Open the share; look at the printer | unchanged apart from the share being opened |
| T9 | Unplug | foothold gone, sessions through it ended |

The script reads aliases, noise and the Confirm or Probe label from `getTestState()` (the core's
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
| `network.state()` | `{ skin, hasSwitch, footholdId, status, offers: [{ action, target, label, command, pending? }] }`, the same in both skins apart from `skin`. A `confirm` offer's `label` is Confirm or Probe |
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
  findings with alias, status, `fixed`, evidence and the quiet mark of the confirm action,
  blocks with `noise`, `noiseLimit` and `alerted`, `techniques`). On a view with an `ops` block
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
  widths, among them a block with noise, an alerted block and a finding under each of Confirm
  and Probe; a screenshot of the prompt above an on-screen keyboard; the UI rules audit over
  the network-view surface of a live `test_ops_skin` game, in each skin (section 5.4); a
  double press of Probe and of Enter on a `probe` line, each on a throttled connection, adding
  one noise and not two; the access leak scanner over the captured responses.
- **K3**: beat D1.
- **K4**: the live parity run of 11.2, and the leak scanner over its captured responses.

## 12. Build steps and shared files

Each step is one commit on a feature branch cut from main after the core's S3 has landed,
committed before its tests are run in the shared tree.

| Step | Stage | Work | Proof before moving on |
|---|---|---|---|
| 1 | K1 | Save the scene's DOM for every fixture and for every recorded `ops_unchanged` view answer (under `test/js/fixtures/network-view/unchanged/`, beside the server fixtures in `test/fixtures/files/ops_unchanged/`), before any change. Move the fixtures the tests build inline into `test/js/fixtures/network-view/` only for the new tests; existing tests are not edited | the snapshots exist on the branch point |
| 2 | K1 | `view-texts.js`, `view-controls.js`, `network-view-panels.js`; the new exports in `ops-model.js`, with the Panels drawing changed to call them; the scene mounts the Panels renderer and routes it through the core's `perform` path, with `offers()` reading the core's pending set and `pendingKey` (core 5.3); copy lists | K1 rows of 11.1; existing and core node tests unedited; `bin/test-js` whole; scripted reruns of `test_access_networks` and `test_ops_access` |
| 3 | K2 | `skin-choice.js`; the starter passes the skin; the header switch on ops views | `network-skin-choice.test.mjs`, `network-skin-unchanged.test.mjs` |
| 4 | K2 | `terminal-grammar.js`, `terminal-format.js`, `network-view-terminal.js`, the rules in `network-view-minigame.css`; the Tab attribute, the pause on mount, `scrollIntoView` on the prompt | grammar, format, parity and text tests |
| 5 | K2 | `window.__test.network`; `--net-skin` in `session-start.sh`; `test_ops_skin` with its `PLAYTEST.md`, graph and leak collector entries; the audit entry; `docs/test-bridge.md` | the T beats in each skin and the W beats; the skin-blind controller test; the reruns of section 10, check 3; the K2 part of 11.6 (screenshots checked, audit clean, phone keyboard check); full suites; land K2 |
| 6 | K3 | Schema, validator checks, wording warning, bootstrap test; `defaultSkin` in `test_ops_skin` | K3 rows of 11.3; beat D1; validator output for every other scenario unchanged |
| 7 | K4 | `tools/playtest/network-skin-parity.mjs`; the `README_scenario_design.md` feature index (N16) and `docs/ACCESS_AND_NETWORKS.md` | the K4 part of 11.6; land |

| Shared file | Also touched by | This plan's part |
|---|---|---|
| `minigames/network-view/network-view-minigame.js` | core (S1 to S3); the privilege feature may add session badges | K1 moves the drawing out and leaves the handlers, the `perform` path, its pending guard and the `pending` set and `pendingKey` it exposes (core 5.3) as the core built them; K1 only reads the set. A plan that lands after K1 adds its drawing to `network-view-panels.js` and its handler to the scene |
| `minigames/network-view/ops-model.js` | core (owner); later plans add refusal codes to `REFUSAL_TEXT` | K1 adds exports, as the core's shared-file table expects: `findingLabel`, `needLine`, `useResultText` and the line functions of section 5.2. It changes no existing export and adds no entry to `REFUSAL_TEXT` |
| `test/fixtures/files/ops_refusal_codes.json` | core (owner) | read by parity test 5 and the format test; not edited |
| `css/network-view-minigame.css` | core | the Terminal's rules, appended |
| `scripts/scenario-schema.json`, `scripts/validate_scenario.rb` dialogue lint, `scripts/validate_network_ops.rb` | every plan; core owns the last | one top-level block; two warnings |
| `systems/test-bridge/index.js`, `tools/playtest/session-start.sh`, `tools/playtest/ui-rules-audit.mjs` | possibly core; none known for the others | one namespace; one option; one surface |
| `README_scenario_design.md`, `docs/ACCESS_AND_NETWORKS.md`, `docs/test-bridge.md` | every plan | the N16 rows and one section |
| JS test harness copy lists | every plan that adds a module | the seven new modules |

Not touched: `ui/display-settings.js`, `ui/game-menu.js`, the game page's stylesheet list, any
server model or controller. No file is added under `tools/playtest/` except the K4 runner.

## 13. Log rows

This feature writes no log row and registers no event with the log feature: it adds no move, a
switch of skin is not a game action, and the server cannot tell which skin sent a request. The
moves a player makes from either skin write the core's rows (`network_swept`, `host_scanned`,
`service_checked`, `finding_confirmed`, `network_alerted`, `technique_refused`,
`technique_used`), the same whichever skin sent the request, and the live parity run (11.2)
compares them across three games. The Terminal's scrolling log is page state, not a log row.

## 14. Cross-plan requests

**Agreed with the core.** Everything the "Core:" rows of section 2 describe is stated in the core
plan under the sections those rows cite, and its section 14, "Skin (S6)", lists what S6 relies
on: `alias` and its lookup, `itemId` on each `techniques` entry, `ops: true` on a block, a card
usable against any listed finding (5.4, "Which findings take a card"), the hooks of 5.5, `fixed`
only on a confirmed finding, the "admin" tag, select-then-Use as the keyboard path, the noise
keys on a block, the thirteen refusal codes (twelve of them on the ops routes) with `REFUSAL_TEXT` as the one table of words,
S6's own exports to `ops-model.js` (12.2), and from 5.3 the one `perform` path with its pending
guard and the set and key builder it exposes, from 5.5 the renderer-drawn action messages, and no separate quiet-or-noisy note in Panels.

**Requests:**

1. **Log rows (S9).** The live parity run compares `log_rows_for(source_id, compare: true)`
   across the three games, as the log plan asks. No row and no route parameter names the skin.
2. **Every plan: wording.** Every beat of a `test_ops_*` scenario's `PLAYTEST.md` names actions
   (sweep, scan, check, confirm, use), never controls (a button, a drag, a typed line), as
   objectives and hints do (sections 1.3 and 5.6), so one script runs in either skin.

## 15. Open questions for the user

1. **May a scenario force a skin, and where does its default live?**
   (a) No forcing: a scenario sets a default and the player's pick wins. (b) `lockSkin: true`
   removes the switch. (c) Forcing allowed, but only to force the Terminal with the quick
   commands kept.
   Recommendation: (a). Nothing in a mission can depend on the skin, a forced Terminal is harder
   on phones and for some players, and a lab that wants the prompt can default to it.
   The default is written in the scenario (`networkView.defaultSkin`) and not in `mission.json`
   beside `ui_theme`, because it concerns the scenario's network and is validated with it; say
   if you would rather keep presentation choices together in `mission.json`.

No action costs game time because of the skin, so this plan raises nothing about a clock.
