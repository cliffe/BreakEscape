# Ops layer S6: realism skin for the network view (feature N16)

Status: draft plan, 2026-11-19. Planning only; nothing is built until the user says so.
Base: branch `docs/ops-layer-plan`. Shared brief: `docs/agents/OPS_LAYER_BRIEF.md`. Outline:
`docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md`, stage S6.

This plan stands alone. A builder needs this file, the brief, and the core plan
(`OPS_CORE_PLAN.md`, stages S1 to S3), which owns the names used here: the routes, the row
fields, the finding ids, the refusal codes, the events and the shared pure module `ops-model.js`.
S6 is built after S1 to S3 have landed.

Words used here. A **skin** is one way of drawing the network view and taking input: `gui`
(shown to players as Panels) or `cli` (shown as Terminal). A **control** is something the view
lets the player press, named by its `data-action` value as the code names it today (`sign-in`,
`open`, `observe`, and the core's `sweep`, `scan`, `check`, `confirm`, `use`). An **offer** is
one complete request the view can make right now: a control's action plus every id the request
needs. The list of controls and offers is private to the network-view folder. It is a drawing
aid for two renderers of one screen; nothing outside that folder reads it, the server never sees
it, and no other feature registers with it.

## 1. What this adds and why

### 1.1 In play

The network view opens when the player uses a foothold (a planted drop box, a joined Wi-Fi
network, an implant). It is one screen: network blocks holding rows for hosts and shares, with
buttons on the rows. On a network whose hosts declare services, the core plan adds Sweep on a
block, Scan on a host, service tiles with Check, findings with Confirm, and a panel of technique
cards that the player uses on a finding by selecting or by dragging.

S6 gives that screen a second face, on those networks only. A view that holds at least one block
the server marks `ops: true` gains a switch in its header between:

- **Panels** (`gui`): the rows, tiles, cards and buttons as the core draws them.
- **Terminal** (`cli`): a prompt and a scrolling log. The player types `sweep`, reads a table of
  hosts, types `scan files01`, reads a table of services, types `check files01 web`, reads the
  findings, types `use <technique> on f2`, and so on. Results are laid out the way scanner and
  framework tools lay them out. Nothing real runs: each line is one of the requests the buttons
  make, sent to the same server route, and the text is a different drawing of the same answer.

The player can switch at any time, in the middle of a task, and loses nothing: the hosts found,
the findings and the sessions held all live on the server.

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
   are the same, and the server cannot tell which skin sent them. Each skin also shows every
   piece of text the other shows.
2. **A renderer cannot reach the server.** Both renderers draw from the same rows and the same
   list of offers and hand a chosen offer back to the scene. Only the scene calls anything. A
   test fails the build if a renderer file imports the API client or `network-links.js`, or
   names `fetch`.
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
| Controls | A delegated click listener finds `[data-action]` inside `[data-host-id]` or `[data-resource-id]`, looks the row up by id in the current rows and calls `act(row, action)`. The actions are `sign-in`, `open` and `observe`. Unplug is a second listener on `[data-unplug]` in the header, calling `unplugBox()` | `NV:314-333`, `:829-852`, `:870-896` |
| Which control a row gets | `hostAction(row)` answers `not_responding`, `off`, `locked`, `open` or `sign-in`; `resourceAction(row)` answers `open`, `locked` or `observe`. Only `sign-in`, `open` and `observe` are pressable; the others are shown as a status | `NV:215-232` |
| Drawing | HTML strings built in the scene through `escapeHtml` and `wordsHtml` | `NV:57`, `:71`, `:621-774` |
| Fixed text | Exported constants in the scene: `REMOTE_OFF_TEXT`, `NOT_RESPONDING_TEXT`, `NO_ROUTE_TEXT`, the down tags, `sessionKeptText`, `STALE_TEXT`, `linkOffText`, the two lock labels, `SHARE_LOCKED_TEXT`, `UNPLUG_TEXT`. A block reached through a pivot is headed "through <host>", with "(Locked)" when that session is locked | `NV:91-126`, `:626` |
| Colours and fonts | The view's stylesheet hard-codes its colours and uses no theme token; its text is the GNF pixel font at 18px. VT323 is self-hosted and is applied by the framework stylesheet to `code`, `kbd` and `samp` only, with no size | `css/network-view-minigame.css:9-10`; `css/minigames-framework.css:27`, `:290-292`; `css/fonts.css` |
| Stylesheets | Listed one by one in the game page; the network view's is one of them | `app/views/break_escape/games/show.html.erb:103` |
| Refresh | Refetch every 5 s, widening to 15 s when idle; redraw only when the answer differs | `NV:86-90`, `:509-560` |
| Events | `network_viewed` and `network_host_opened`, emitted by the scene | `NV:448-463`, `:874` |
| Test snapshot | `getTestState()` returns `rows[]` and `networks[]`, each row with `id`, `kind`, `action` and a CSS `selector` of the form `[data-host-id="…"] [data-action]` | `NV:920-954` |
| Core: controls | Sweep on a discovery block, Scan on an unscanned host row in an `ops` block, Check on a service tile, Confirm on a finding, and a Techniques panel of held cards. A use is made by selecting a finding, then a card, then Use, or by dragging a card onto a finding | core plan sections 1 and 5.5 |
| Core: shared module | `network-view/ops-model.js`, pure: row merging, the works-on line, need labels and the text for each refusal code | core plan section 5.5 |
| Core: answers | Sweep `{ network: { id, hosts } }`; host scan `{ host }`; check `{ hostId, service, findings }`; confirm `{ finding }`; a use answers a session (the desktop then opens) or `keyringChanged: true`; a repeat adds `already: true`; a refusal is `{ success: false, reason, need? }` with `reason` a code | core plan sections 5.4 and 6 |
| Core: events | `network_swept`, `network_host_scanned`, `network_service_checked`, `network_finding_confirmed`, `network_technique_used`, `network_technique_refused`, each also as `<name>:<id>` | core plan section 5.5 |
| Display settings | `ui/display-settings.js` keeps one object in `localStorage` and copies it in memory at import. Every write rewrites the whole object and dispatches `be:display-settings-changed`, which `main.js` answers by re-running the canvas scaling. The game menu draws its selects in every game | `ui/display-settings.js:13`, `:24-34`, `:78-87`; `ui/game-menu.js:167-206` |
| URL preview value | `?ui_theme=` is read from the page URL and beats the player's stored theme | `ui/display-settings.js:63-69` |
| Mission config | The page passes `uiTheme` to the browser from `mission.json` | `app/views/break_escape/games/show.html.erb:263` |
| Bootstrap | The scenario sent to the browser is a deep copy with named keys deleted, so a new top-level key that is not on the list passes | `app/models/break_escape/game.rb:2393`, `:2465-2508` |
| Keyboard | While any minigame is open the player module ignores game keys and the manager turns Phaser's keyboard off. `window.pauseKeyboardInput()` is a further single switch; a scene may call it itself when it starts, and the manager resumes input whenever a minigame ends | `core/player.js:102-123`, `:295-299`; `minigames/framework/minigame-manager.js:111-143`, `:510-512`; `minigames/pretext-prep/pretext-prep-minigame.js:89-94` |
| Tab | The manager traps Tab inside an open minigame in the capture phase and steps aside when the focused element is inside `[role="listbox"]` or `[data-own-tab-cycle]`. It checks on every Tab press | `minigames/framework/minigame-manager.js:362-367` |
| Phones | Nothing reads the visual viewport. The one precedent keeps the frame a fixed size and keeps the focused field in view with `scrollIntoView` | `utils/pc-monitor.js:220-227` |
| Test bridge | `window.__test.minigame` has `getState`, `clickControl(indexOrLabel)`, `clickText`, `type`, `pressKey`, `close`. A label is matched exactly, then by prefix, then by substring | `systems/test-bridge/minigames.js:92-118` |
| Playtest sessions | `session-start.sh` takes its session tag from the digits at the end of the `--url` value and falls back to the process id | `tools/playtest/session-start.sh:26-34` |
| Existing playtests | No `PLAYTEST.md` and no tool under `tools/playtest/` clicks a network-view control by number; they use selectors such as `[data-host-id="…"] [data-action="sign-in"]` | `scenarios/test_access_networks/PLAYTEST.md:78`, `:91` |
| Node harnesses | Each node test that runs the view copies named engine files into a temporary tree and runs them against jsdom | `test/js/network-view.test.mjs:15-40` |

What already does part of the job, and what does not:

- The scene keeps the server behind `networkLinks` and the API client, and its click handling
  already reduces a press to a row and an action name. The offers list is that same pair, written
  down as data.
- `hostAction` and `resourceAction` already decide which control a row gets. They stay as they
  are and the offers list calls them.
- The core's `ops-model.js` is the one shared pure module for this screen. S6 reads rows, labels
  and refusal texts through it and adds no second model.
- Display settings are **not** reused for the skin. A write there fires a canvas resize behind
  the open view, the whole-object rewrite would clobber a value written from elsewhere, and its
  menu page is drawn in every game, while the switch must appear only on an ops network. The
  skin keeps its pick under its own storage key (section 8).
- The `ehr-terminal` minigame's stylesheet uses a different font and its own fixed palette, so
  there is nothing in it to share beyond a flex column layout.
- There is no console font size to inherit, and no handling of on-screen keyboards. Section 5.4
  and 5.5 set both.

There is no command-line view of the network today, no skin setting, and no scenario field about
how the view is drawn.

## 3. Build stages

Four stages, built after the core's S1 to S3 are on main. Each is shippable alone and is proved
by tests and runs that exist when it lands. Total size M.

| Stage | Adds | Proved when it lands by | Size |
|---|---|---|---|
| K1 Split | The private control list and `offers()`; the Panels drawing moved out of the scene into a renderer that takes its buttons from the list; the fixed texts moved to a constants file. No visible change and no change to what a press sends | The existing network-view node tests and the core's, with no edit to an assertion; the byte comparison of old and new DOM over every fixture; the control-list tests of 11.1; a rerun of the scripted playtests of `test_access_networks` and `test_ops_access` | S |
| K2 Terminal | The skin choice and its storage; the header switch on ops views; the Terminal renderer, grammar, help and completion for every control in the list; `window.__test.network`; the `--net-skin` option of the playtest tools; the feature scenario `test_ops_skin` | All node tests of 11.1 and 11.2; the unchanged-scenarios check of section 10; the scripted beats of 11.4 run through the bridge once in each skin, with the request and server-record checks of the scenario's `PLAYTEST.md` | M |
| K3 Scenario default | The scenario field `networkView.defaultSkin`, its schema entry, the validator checks and the wording warning | The Rails and validator tests of 11.3; beat D1 of 11.4 | S |
| K4 Live proof | The live parity runner, the screenshot set, and the docs (README feature index N16, `docs/ACCESS_AND_NETWORKS.md`, `docs/test-bridge.md`) | The live parity run green on `test_ops_skin`; the leak scan clean; the screenshot review | S |

K2 is the stage that carries the risk. It includes the bridge and the feature scenario so that
its own proof does not wait for a later stage.

## 4. Scenario fields

One optional top-level block, added in K3. It is not a secret and is sent to the browser.

```json
{
  "networkView": {
    "defaultSkin": "cli"
  }
}
```

| Field | Values | Meaning |
|---|---|---|
| `networkView.defaultSkin` | `"gui"` (default) or `"cli"` | The skin an ops view opens in for a player who has not picked one |

The block is closed (`additionalProperties: false`, `_` note keys allowed). No other stage's
fields change. The field has no effect on a view with no `ops` block. Whether a scenario may also
force a skin, and whether the default belongs here or in `mission.json` beside `ui_theme`, is
open question 2; this plan is written to its recommendation.

**Which skin an ops view is drawn in**, first that applies:

1. **A press of the switch on this page.** Kept in memory until the page is reloaded.
2. **A starting value in the page URL**, `?net_skin=gui` or `?net_skin=cli`, for previews and
   test runs. It sets the skin the view starts in and nothing more: the switch still works (rule
   1 is above it). While a starting value is present, a press of the switch is not stored, so a
   preview link never changes a player's saved pick.
3. **The player's stored pick**, written by the switch when the URL has no starting value. Per
   browser.
4. **The scenario's `networkView.defaultSkin`.**
5. `"gui"`.

A view with no `ops` block skips all five and is Panels.

The player's pick beats the scenario because the skin changes nothing about the game, and a
player who needs buttons (a phone, a switch device, a screen reader set up for the list) must be
able to keep them. An event organiser has no setting in this stage; the URL value covers
previews and demos, and a per-event default would be a Hacktivity change with its own access
tests that can be added later without touching this design.

## 5. Engine behaviour

### 5.1 Server

Nothing. S6 adds no route, no model code and no state. The only server-side changes are the
schema entry for `networkView` and a test that the block reaches the bootstrap (section 7).

### 5.2 Client: the parts

All under `public/break_escape/js/minigames/network-view/`.

| File | Kind | Role |
|---|---|---|
| `ops-model.js` | pure, the core's | Unchanged in purpose: row merging, the works-on line, need labels, refusal texts. S6 reads through it and asks the core for three small additions (section 14) |
| `view-texts.js` | constants, new | The scene's fixed texts (section 2), moved here so both renderers can import them. The scene re-exports them, so existing tests are unchanged |
| `view-controls.js` | pure, new | `CONTROLS`, the private control list below, and `offers(view)`: every offer open right now, in display order |
| `skin-choice.js` | new | `chooseSkin(inputs)`, pure, implementing the order of section 4; `readPick(storage)` and `writePick(storage, name)`, which touch storage only when called |
| `network-view-minigame.js` | scene | Keeps what it has: load, refetch, the handlers (`act`, `unplugBox`, the core's calls), every event, the way back, the test snapshot. New: it mounts one of two renderers, and `perform(offer)` |
| `network-view-panels.js` | renderer, new | Today's HTML and the core's, moved. Its `data-*` hooks are unchanged |
| `network-view-terminal.js` | renderer, new | Prompt, log, quick commands |
| `terminal-grammar.js` | pure, new | `parse(line, offers, aliases)`, `complete(line, offers, aliases)`, `commandFor(offer, aliases)`, `helpFor(verb)` |
| `terminal-format.js` | pure, new | `formatListing(view)`, `formatResult(offer, answer, view)`: arrays of plain text lines |

What S6 adds to the shared model is therefore nothing: no second set of rows and no copy of a
label or a refusal text. Its own pure code is the control list, the grammar and the layouts.

**The control list** is one table in `view-controls.js`, keyed by the `data-action` name.

| `action` | Drawn on | Panels label | Terminal line | The scene's handler |
|---|---|---|---|---|
| `sweep` | a discovery block not yet swept | Sweep | `sweep [<network id>]` | the core's sweep call, `network_id` |
| `scan` | an unscanned host row in an `ops` block | Scan | `scan <host id>` | the core's scan call, `host_id` |
| `check` | a service tile | Check | `check <host id> <service name>` | the core's check call |
| `confirm` | an unconfirmed finding | Confirm | `confirm <finding>` | the core's confirm call |
| `use` | a held technique and a listed finding | Use | `use <technique id> on <finding>` | the core's technique call, `finding_id` and `item_id` |
| `sign-in` | a host row | Sign in | `signin <host id>` | `act(row, 'sign-in')` |
| `open` | a host row with a held session | Open | `open <host id>` | `act(row, 'open')` |
| `open` | a share row | Open | `open <share id>` | `act(row, 'open')` |
| `observe` | any other resource row | Look | `look <resource id>` | `act(row, 'observe')` |
| `unplug` | the header of a planted box's view | Unplug | `unplug` | `unplugBox()` |

Each entry holds the label, the Terminal verb, the kind of row it is drawn on and a one-line
description used as the button's `title` and as the `help` text. The conditions in the "Drawn
on" column are the ones the scene and the core use today (`hostAction`, `resourceAction`, the
block's `ops` and `swept`, the row's `scanned`), called from `offers()` and written nowhere
else. A verb together with the kind of its target names exactly one entry: `open` on a host and
`open` on a share are two entries, told apart by the target, and hosts, shares and resources
share one id space.

**An offer** is `{ action, target, label, command }`. `target` holds the ids of the request:
`{ networkId }`, `{ hostId }`, `{ hostId, service }`, `{ findingId }`, `{ findingId, techniqueId,
itemId }`, `{ resourceId }` or `{}`.

**Which pairs a use may target, in both skins:** every technique the player holds a card for,
against every finding the view lists, whatever the finding's status (unconfirmed, confirmed,
false or fixed). The server's refusal is the lesson, so both skins must be able to reach every
refusal code. A fit is never worked out in the browser. The `itemId` of a use is the first held
card of that technique in id order, taken from the server's `techniques` entry (section 14,
request 1), so two cards of one technique are one offer and send the same bytes from either
skin.

**How a later control is picked up.** Other plans add a control to the network view the way the
code does today: a button with a `data-action` in the Panels drawing and a handler in the scene.
Nothing asks them to register it. Three tests in this plan then fail until the control has an
entry in `CONTROLS` and the Terminal can produce it: the source check that every `data-action`
literal in `network-view-panels.js` is a key of `CONTROLS`; parity test 1, which presses the new
button on that plan's fixture and finds a call no offer explains; and the text test, which finds
the new label missing from the Terminal. The fix is one entry in the list, plus a layout in
`terminal-format.js` if the control's answer has a new shape. A control that lives on another
screen (a desktop, a device, a cracking minigame) is outside this view and has one look.

**The renderer contract.** A renderer is a class with `mount(root, ctx)`, `render(view, offers)`,
`showResult(offer, answer)`, `noteChange()`, `unmount()` and `testState()`. `ctx` holds
`perform(offer)`, `requestClose()` and `requestSkin(name)`, and nothing else. A renderer:

- imports only the pure modules of this folder and the escape helper;
- never names `fetch`, `ApiClient`, `networkLinks`, `window.open*` or `window.start*`;
- emits no game event. The scene emits all eight (the two of today and the core's six), so
  objectives and ink mappings see the same events from both skins;
- draws authored and server text with `textContent` (Terminal) or the existing escape helpers
  (Panels);
- may keep local state that is not part of any offer: the Panels' selected finding and a drag in
  progress, the Terminal's half-typed line. Local state ends in one call of `perform` with one
  complete offer, or in nothing.

**`perform(offer)`** is a private method of the scene: a lookup from `action` to the handler in
the table above, called with the offer's target. It is the same pairing the delegated click
listener makes today from a button's `data-action`. It sends to the route that action already
has; there is no shared route and the server sees no difference.

- **Panels path.** Unchanged from today: a click finds the row by id and calls the handler. The
  select-then-Use and drag gestures are the core's, and each ends by calling the technique
  handler with a finding id and the technique's `itemId`. No new check is added on this path in
  any stage, so a press sends exactly what it sends before K1.
- **Terminal path.** The grammar can only resolve a line to an offer that is in the current
  list. A line that names anything else is answered locally and sends nothing. This is what
  stops a typed line from probing for a host or a finding the view has not shown. A
  quick-command button holds an offer from the list it was drawn from, as a Panels button holds
  a row id.
- After the handler returns, the scene passes the server's answer to `showResult`, refetches as
  it does today and calls `render`.

**Switching.** `requestSkin` records the press (section 4), then the scene unmounts one renderer
and mounts the other on the same rows. No request is sent, the refetch timer keeps running and
the trip is not ended. The switch is a button in the header strip marked `data-skin-switch`,
labelled with the other skin's name ("Terminal" or "Panels"), in the same place in both skins.
The scene draws it only when some block of the view carries `ops: true`, and removes it if a
refetch leaves no such block.

**The skin is passed in.** The starter (`NV:962-976`) works out the starting skin with
`chooseSkin` and passes it to the scene as a parameter. The scene does not import
`ui/display-settings.js`, and `skin-choice.js` reads `localStorage` and the URL only inside its
functions, so a node harness needs no stub at import.

### 5.3 The Terminal skin

**Layout**, inside the shared console window (title bar, subtitle and X unchanged):

```
+--[ Drop box: Desks, Spare wall port ]------------------[Panels][X]+
| link up. Type help, or pick a command below.                      |
| > sweep                                                           |
| HOST       STATE   NAME                                           |
| fin_pc01   up      Finance desk 1                                 |
| files01    up      File server                                    |
| > _                                                               |
+-------------------------------------------------------------------+
| Commands:  [Scan  scan files01] [Sign in  signin fin_pc01] ...    |
+-------------------------------------------------------------------+
```

- **Log**: `role="log"`, `aria-live="polite"`, pixel scrollbar, capped at 300 lines (oldest
  dropped). It is kept for the length of the trip in a module variable keyed by foothold id, so
  coming back from a sign-in screen shows the same log; it is dropped when the trip ends. It is
  never saved or synced.
- **Prompt**: one real `<input type="text">` with a visible label, `autocomplete="off"`,
  `autocapitalize="off"`, `spellcheck="false"`. Enter runs the line. Up and down walk the trip's
  command history (20 entries).
- **Quick commands**: one button per offer, in the order `offers()` gives, which is the order
  Panels draws its controls in. Each button shows the Panels label and, in a `<code>` element,
  the line it stands for. It carries the hooks the Panels control carries: the same row
  attribute on its item (`data-host-id`, `data-resource-id` and the core's row attributes) and
  the same `data-action` value (`sign-in`, `open`, `observe`, and so on), and Unplug keeps
  `data-unplug`. Existing selectors of the form `[data-host-id="…"] [data-action="sign-in"]`
  therefore find one button in either skin. Pressing a button writes its line to the log and
  performs its offer.
- **Quick commands for a use**: one button per held technique. Pressing it writes `use
  <technique id> on ` into the prompt and swaps the strip for one button per listed finding;
  pressing a finding completes the line and performs the offer. An X on the strip returns to the
  full list. This is the Terminal's form of select-then-Use.
- **Folding**: the list wraps and scrolls, and the player can fold it away. Folded, the buttons
  stay in the DOM and the bridge unfolds the list before pressing one.
- **A change while the view is open** (a refetch finds a host gone, a session ended): one line,
  `-- network changed. show lists it again --`. The log is never redrawn; the quick commands
  are.
- Lines appear at once, with no typing effect, so there is nothing to seed and nothing for
  reduced motion to switch off.

**Targets.** A target is typed as the id the server sent: a network id, a host id, a service
`name`, a technique id, a share or resource id. The listing prints each id in its first column
beside the name Panels shows. A finding's full id (`<hostId>.<serviceName>.<weaknessId>`) is
accepted, and each finding also gets a short alias, `f1`, `f2` and so on, given in the order the
Terminal first lists it and kept for the trip beside the log, so an alias never moves to another
finding when a later check adds rows. The alias is the Terminal's own text; it is made from
nothing but the order of listing.

**What each layout prints.** Every field the Panels show is printed by one of these, word for
word where it is a sentence or a status. Fixed sentences come from `view-texts.js` and from the
core's `ops-model.js`; the Terminal has no wording of its own for them.

| Layout | Printed when | Fields and texts |
|---|---|---|
| Link lines | `show`, and on opening | the view's `message`; the link-off sentence; the stale sentence; for each block its heading, the "through <host>" note and its "(Locked)" mark |
| Host table `HOST STATE NAME` | `show`; a sweep's answer | host id; the shown hostname where it differs; name; the state word Panels shows (remote sign-in off, powered down, no route, the down tags, Locked); the "Session kept" line; a held session's account and, for a technique session, its access level |
| Service table `SERVICE PORT PRODUCT VERSION` | `show` for a scanned host; a host scan's answer | service `name`, `label` when it differs, port, product, version |
| Findings list | `show` for a checked service; a check's answer | alias, full id, the core's finding label (class and severity words), `summary`, status |
| Finding detail | a confirm's answer; `show` for a settled finding | status; for a confirmed finding each need with its label and "yes" or "no"; for a false one the `falseBecause` text; "Fixed" for a fixed one |
| Technique list `TECHNIQUE WORKS ON` | `show` | technique id, `name`, `summary`, the core's works-on line |
| Share and resource table | `show` | id, name, kind label, "on <host>", the lock label and the locked-share sentence |
| Look | an `observe` | the resource's `observations` and the notice, as Panels shows them |
| Use result | a use's answer | the core's result sentence for a session (then the desktop opens, as from Panels), for a credential (`keyringChanged`) and for `already`; on a refusal the core's text for the `reason` code, with the need's label for `need_unmet` |
| Refusal | any refused request, and the unplug refusal | the text for the code from the core's table; the unplug notice |

The column headers above are plain words taken from the core's field names. Whether they should
instead copy the header of a well-known scanner is part of open question 3.

**What it may print**: constants from `terminal-format.js`, `view-texts.js` and `ops-model.js`,
the ids and fields of the view answer and of a result, the aliases, and the player's own line.
Nothing else. No invented host, port, service, version or filler row, and no random text.

**Grammar.** A line is `verb [target ...]`.

- Verbs: the nine in the control list (`sweep`, `scan`, `check`, `confirm`, `use`, `signin`,
  `open`, `look`, `unplug`), plus five local ones that send nothing: `help [verb]`, `show`
  (print the current listing; alias `ls`), `clear`, `exit` (close the view, as the X does; alias
  `quit`) and `panels` (switch skin).
- `sweep` with no target is accepted when exactly one block offers a sweep.
- Forgiving: case and extra spaces are ignored. A verb or target may be shortened to any prefix
  that is unique among what is on offer (`sig fin` runs `signin fin_pc01`). The word `on` is
  allowed and ignored.
- Aliases, each to exactly one verb: `login` and `connect` to `signin`; `ls` to `show`; `run`
  to `use`; `quit` to `exit`.
- A line that does not parse sends nothing and costs nothing. An unknown verb answers with the
  nearest verb; an unknown target lists what that verb can be used on; an ambiguous prefix lists
  the matches. These answers echo the player's own text, always through `textContent`. A typo
  can never spend a sign-in attempt or trip a lockout, because only a line that resolves to a
  current offer reaches a handler.
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
| Pixel fonts only | The log and the prompt are VT323 at 16px, the font's own pixel grid. Quick-command buttons keep the `.minigame-button` look and its GNF font, as the Panels buttons have, with the command part in a `<code>` element, which the framework already sets in VT323. Press Start 2P stays on the title bar. The size is checked in the K4 screenshots at desktop and phone widths |
| 2px borders, no radius | The prompt box, the quick-command buttons and the switch use the `.minigame-button` look; the cursor is a solid block |
| Device frame | The view is already the link device's console in the shared console window. The Terminal is that console's other mode, inside the same frame |
| X closes, no Cancel | The shared X and Esc close it. `exit` is a second way in, not a Cancel button. The finding strip of a use has an X |
| One look per concept | The switch looks the same in both skins and sits in the same place. Both skins use the view's existing colours: the Terminal adds no palette and no theme tokens, because the Panels use none |
| Crisp text | No text shadow, glow or scanline overlay on the log |

The Terminal's rules go in the existing `css/network-view-minigame.css`, so the game page needs
no new stylesheet link. The UI rules audit (`tools/playtest/ui-rules-audit.mjs`) does not cover
the network view today; K2 adds the Terminal surface to it.

### 5.5 Typed input and accessibility

- Nothing in the game needs typing. Every offer has a quick-command button, so the Terminal
  works with a pointer, a switch device or a phone's touch screen alone.
- Panels is one press away, and the player's pick wins over the scenario's default.
- No time limits, and no cost for a mistyped line.
- The log is a live region, so a screen reader reads each result once. The prompt has a label.
  Focus returns to the prompt after a command and after a switch to the Terminal.
- Under 600px wide the quick commands open unfolded and the log takes the rest of the height.
- **Phones.** The frame keeps one size when the on-screen keyboard opens, and the prompt is kept
  in view with `scrollIntoView` when it takes focus and after each result, as the PC monitor
  frame does. Nothing reads the visual viewport. K4 checks this on a real phone or the Android
  emulator, with a screenshot of the prompt above the keyboard.
- **Game keys.** The Terminal renderer calls `window.pauseKeyboardInput()` in `mount`. Nothing
  resumes on a switch back to Panels: game keys are ignored while any minigame is open, and the
  manager resumes input when the view closes, as it does for every scene. The starter's
  parameters do not change.

### 5.6 Spoken lines, objectives and hints

- **Rule for authors**: text a player hears or reads about the task names the action and the
  target. "Sweep the office network." "Check the web service on the file server." It does not
  say click, press, button, type, command, prompt or terminal about a network action.
- **Why it works**: the action's name is the button's label in Panels and the verb in the
  Terminal.
- **Control help belongs to the engine, per skin**, and is not spoken: the Terminal's first line
  and `help`; the Panels buttons' labels.
- **Check**: a validator warning (section 9) on skin-specific wording in scenarios that use the
  ops fields.
- No spoken line is added or changed by this stage, so there is no voicing cost.

### 5.7 Determinism

The skin holds no state the server reads and makes no rolls. For the same view answer and the
same offer, both skins send the same request. The Terminal's output is a function of the view
answer, the result, the player's line and the alias order of the trip.

## 6. Server routes

None added, none changed. The skin uses the routes that exist when it lands:

| Request | Route | Owner |
|---|---|---|
| Load and refresh | `GET /games/:id/network?foothold=` | built (N1 to N12), fields added by the core |
| Unplug | `POST /games/:id/network/unplug` | built |
| Sign in, open, share | the existing sign-in, desktop and container screens and their routes | built |
| Sweep and host scan | `POST /network/scan` with `network_id` or `host_id` | core (S1) |
| Check | `POST /network/check` with `host_id`, `service` | core (S2) |
| Confirm | `POST /network/confirm` with `finding_id` | core (S2) |
| Use | `POST /network/technique` with `finding_id`, `item_id` | core (S3) |

The server receives no parameter that names the skin, and no route may branch on one. A
controller test in section 11.3 pins this. The `net_skin` value in a page URL is read by the
browser only.

## 7. What reaches the browser, and what never does

| Path | Sent | Withheld |
|---|---|---|
| `GET /scenario` (bootstrap) | `networkView.defaultSkin` | Nothing new to withhold |
| Every other route | Unchanged | Unchanged |

- `networkView` holds a presentation choice only. A secret does not belong in it and the closed
  schema leaves nowhere to put one.
- The bootstrap filter deletes named keys and passes the rest, so `networkView` arrives without
  a change to the filter. A model test pins that it does, and that a scenario without the block
  has no such key.
- The Terminal shows what the view answer and the results contain, which is what the Panels
  show. `terminal-format.js` receives nothing else. Test 9 of section 11.2 checks both
  directions.
- **Ids.** The Terminal prints ids that the server has already sent for listed things: host,
  network, share and technique ids, and finding ids, which contain the author's weakness ids.
  The Panels may not print all of them. Nothing new reaches the browser by this, and nothing is
  printed before the core's rules allow the row to arrive. The core's validator already warns on
  a weakness or decoy id that gives the answer away; an author should read every id as visible
  to the player.
- A refusal arrives as a `reason` code and never as prose. One client text table, the core's in
  `ops-model.js`, turns it into words, and both renderers import it.

## 8. State and saved games

| State | Where | Size | Sent |
|---|---|---|---|
| The player's pick | `localStorage`, key `be_network_skin`, value `gui` or `cli` | one short string | never |
| A switch press on this page | a module variable | one short string | never |
| Terminal log, command history and finding aliases | a module variable, per trip | 300 lines, 20 commands, one alias per listed finding | never |
| Folded or unfolded quick commands | the renderer instance | one boolean | never |

Nothing is added to `player_state`, to the sync sections or to any server answer, so the delta
rule has nothing to judge. A reload reopens an ops view in the skin section 4 gives, with an
empty log and aliases numbered afresh. A saved game from before the feature behaves the same as
a new one. A player who changes browser gets the scenario's default until they pick again. A
stored value that is neither `gui` nor `cli` is ignored, and blocked storage leaves the switch
working for the page.

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
| K1 split of the scene | None visible. Same HTML, same `data-*` hooks, same events, same `getTestState()` fields, same requests for the same presses |
| Header switch | Not drawn: no block carries `ops: true` |
| Stored pick, URL starting value, scenario default | Ignored: the view is Panels |
| Terminal renderer | Never mounted |
| Game menu | Unchanged: the skin has no entry there |
| `networkView` block | Absent |

Checks that prove it, across all eight and any scenario that later declares `networks`:

1. **Every recorded view, forced the wrong way** (`test/js/network-skin-unchanged.test.mjs`).
   The core plan records, for each scenario that declares `networks`, the `GET /network` answer
   of every foothold as golden fixtures under `test/fixtures/files/ops_unchanged/`, found by the
   key so a new scenario joins without an edit. Before K1 changes any code, a snapshot of the
   scene's DOM for each of those answers is committed. The test then renders each answer with a
   stored pick of `cli`, a `?net_skin=cli` URL and a scenario default of `cli` all set at once,
   and asserts that the DOM equals the snapshot byte for byte, that no `[data-skin-switch]`
   element exists, and that the Terminal renderer was not mounted.
2. `test/js/network-view.test.mjs` and the core's node tests pass with no edit to an assertion
   (their copy lists gain the new files).
3. The scripted `PLAYTEST.md` runs of every one of the eight that has one are rerun after K2
   with a stored pick of `cli` seeded in the browser profile, and pass unchanged.
4. The validator's output and the graph for every scenario are unchanged; the core's
   `ops-unchanged-validator.test.mjs` already compares them with a snapshot.

For the core's own ops scenarios (`test_ops_scan`, `test_ops_findings`, `test_ops_access`), which
are not "existing" in this sense, K2 adds the header switch. With no stored pick and no default
they open in Panels, so their scripted playtests run as written.

## 11. Tests

### 11.1 Node tests (`test/js/`)

Fixture view answers live as JSON files in `test/js/fixtures/network-view/`, created in K1. The
tests below read every file in that folder, so a plan that later adds a fixture for a new field
or control gets these checks on it.

| File | Stage | Proves |
|---|---|---|
| `network-view-controls.test.mjs` | K1 | `offers()` for each fixture: order, targets, one offer per pressable control, every use pair, the `itemId` rule. `CONTROLS` is well formed: each entry has one label, one verb and one description, and a verb together with a target kind names exactly one entry. Every `data-action` literal in `network-view-panels.js` is a key of `CONTROLS` |
| `network-view-panels-same.test.mjs` | K1 | Each fixture rendered by the scene as it was (output saved as a fixture string before the split) and by the Panels renderer is equal byte for byte; a press on each control records the same call before and after |
| `network-skin-imports.test.mjs` | K1 | The two renderer files and the pure modules import nothing outside the allowed list and do not contain `fetch(`, `ApiClient`, `networkLinks`, `window.open` or `window.start` |
| `network-terminal-grammar.test.mjs` | K2 | Each verb and alias; ids, prefixes, finding aliases and full finding ids; `on`; `sweep` with no target; case and spacing; unknown verb, unknown target and ambiguous prefix return a message and no offer; completion results; aliases stay with their finding when a later listing adds findings. Hostile input (markup, control characters, a 10,000 character line) returns no offer, and the "nearest verb" and "unknown target" answers that echo it are set as plain text |
| `network-terminal-format.test.mjs` | K2 | One layout per answer shape of section 2 (sweep, host scan, check, confirm, each of the three use outcomes, each refusal code, `already`); every field in the table of 5.3 is printed |
| `network-skin-parity.test.mjs`, `network-skin-text.test.mjs` | K2 | Section 11.2 |
| `network-skin-choice.test.mjs` | K2 | The order of section 4, case by case: a press beats a URL value; a URL value beats a stored pick and is not written to storage; a press with a URL value present changes the skin and writes nothing; a press with no URL value is stored; a bad stored value is ignored; blocked storage still switches; a view with no `ops` block is `gui` under every combination; the switch is drawn only with an `ops` block and removed when a refetch has none |
| `network-skin-unchanged.test.mjs` | K2 | Section 10, check 1 |

**Harness copy lists.** Each node test that copies the view into a temporary tree names its own
files. The seven new modules (`view-texts.js`, `view-controls.js`, `skin-choice.js`,
`network-view-panels.js`, `network-view-terminal.js`, `terminal-grammar.js`,
`terminal-format.js`) are static imports of the scene, so each goes on the copy list of every
test that copies `network-view-minigame.js`: today `network-view.test.mjs`,
`minigame-consoles-fit.test.mjs`, `pc-monitor-frame.test.mjs` and
`escaping-shared-helpers.test.mjs`, plus the core's
`network-view-ops.test.mjs`. The builder greps `test/js` for `network-view` again before
finishing, since other branches add tests. None of the seven touches `localStorage` or
`window.location` at import, so no harness needs a new stub.

### 11.2 The parity proof

The claim to prove: at any moment, the set of requests a player can cause from Panels equals the
set they can cause from the Terminal, each request is the same bytes from either skin, and each
skin shows every piece of text the other shows.

The unit of the proof is the **offer** of section 5.2: one complete request the view can make,
`{ action, target }`, where `target` holds every id the request needs. A press on Scan is one
offer. A use is one offer per pair of a held technique and a listed finding, `{ action: "use", target: { findingId,
techniqueId, itemId } }`, however the player put the pair together.

A **path** is a way of producing an offer with real input. These are all the paths there are; a
renderer that gains another must add it to this table and to `PATHS` in the test, or test 1
fails on the unlisted control.

| Path | Skin | Input | Offers it can produce |
|---|---|---|---|
| `button` | Panels | Press a row's `[data-action]` button, or the header's `[data-unplug]` | sweep, scan, check, confirm, sign-in, open, observe, unplug |
| `select` | Panels | Select a finding, select a card, press Use | use, for every pair in the list |
| `drag` | Panels | Drag a card and drop it on a finding | use, for every pair in the list |
| `typed` | Terminal | Type a line and press Enter | every offer |
| `quick` | Terminal | Press a quick-command button (for a use: the card's button, then the finding's) | every offer |

**Node tests** (`network-skin-parity.test.mjs`), in the DOM the existing network-view test uses,
against a fake `networkLinks`, a fake API client and fake openers that record every call. They
run over every fixture answer in the network-view fixtures folder, so a fixture another plan adds
is covered without an edit here.

1. **Every Panels path maps to an offer.** Press every `[data-action]` and `[data-unplug]`
   control. For every finding element and every card element in the DOM, do the `select` path and
   the `drag` path (real `dragstart`, `dragover` and `drop` events, and the keyboard form of the
   same gesture). Each press or gesture must record exactly the call of one offer in
   `offers(view)`. A control that records a call that no offer explains fails the test,
   and so does an element that is draggable, a drop target or selectable and is not a card or a
   finding.
2. **Every offer has every path it should.** For each offer in the list, each path that the
   table says can produce it does produce it: the recorded call is deep-equal across `button` (or
   `select` and `drag` for a use), `typed` and `quick`. Same function, same arguments, same body.
3. **Every Terminal path maps to an offer.** Every verb is tried against every target token the
   grammar accepts for the fixture (ids, unique prefixes, finding aliases), and every quick-command
   button is pressed. Each either records the call of one offer in the list or records nothing
   and prints a message. The typed line for an offer, `commandFor(offer)`, parses back to that
   offer.
4. **Use pairs.** For a fixture with two held techniques and four findings in the four states
   (unconfirmed, confirmed, false, fixed), all eight pairs are reachable by `select`, `drag`,
   `typed` and `quick`, and each sends that pair's `finding_id` and `item_id`. With two held
   cards of one technique there is one offer, and every path sends the `itemId` of the server's
   `techniques` entry.
5. **Refusals are the same.** For each refusal code the core defines, a fake answer with that
   code produces the same sentence in both skins (the text comes from the core's `ops-model.js`),
   and neither skin sends a second request.
6. **Nothing typed can reach past the list.** Typed lines that name a host, finding or card from
   another fixture, a well-formed id that is not listed, or a finding not yet checked record no
   call.
7. **Events.** For one scripted sequence run once per skin, the events the scene emits are
   deep-equal: `network_viewed`, `network_host_opened`, `network_swept`, `network_host_scanned`,
   `network_service_checked`, `network_finding_confirmed`, `network_technique_used` and
   `network_technique_refused`, with their `<name>:<id>` forms and payloads.
8. **Switching.** A switch in the middle of the sequence records no call, emits no event and
   leaves the recorded lists unchanged. A finding selected in Panels is not carried into the
   Terminal and the reverse: selection is local to a renderer and is never part of an offer.
9. **Everything shown is shown in both** (`network-skin-text.test.mjs`). Fixtures whose every
   text field is a unique marker string are rendered in both skins. The Terminal's text is the
   output of `show` plus the output after each offer's fake result. Two directions:
   - every text node in the Panels DOM, apart from the entries of `PANELS_ONLY_TEXT`, appears in
     the Terminal's text;
   - every token of the Terminal's text is a marker that also appears in the Panels DOM, a fixed
     sentence that also appears in the Panels DOM, the id of a listed row, or an entry of
     `TERMINAL_ONLY_TEXT`.

   The two exception lists live in the test file and are short and literal. `PANELS_ONLY_TEXT`
   holds section headings that the Terminal replaces with table headers. `TERMINAL_ONLY_TEXT`
   holds the table headers, the prompt, the help text, the finding aliases, the echo of the
   player's own line and the parse messages. Button labels are in neither list: a label appears in the Terminal as the
   quick command's label. An entry added to either list needs its reason stated in the commit.

**Live run** (`tools/playtest/network-skin-parity.mjs`, stage K4), on the real path. This is the
feature's live proof, not a playtest of a mission.

1. Start three fresh games of `test_ops_skin`: A stays in Panels, B stays in the Terminal, C
   switches skin with the header switch after each step.
2. Drive one sequence in each through `window.__test.network.run(offer, { path })` (section
   11.5), which uses real input. Across the three games the sequence uses every path at least
   once: A makes one use by `select` and one by `drag`; B makes one use by `typed` and one by
   `quick`.
3. Record only the requests the view's actions send: `POST` requests to `/network/*`, the
   sign-in route and the share route, as method, path and body with the game id removed, and
   their answers. The view's timed `GET /network` refetch is left out, because it interleaves
   differently in each game. The three recordings must be equal.
4. At the end read each game's server record and compare these keys only: `footholds`,
   `sessions`, `opsDiscovered`, `opsFindings`, `opsUsed`, the keyring's entries, and the log rows
   whose event is one of the network events of the core plan's section 13, with times removed.
   Globals set by office life, timers and NPC needs depend on wall-clock time and are not
   compared.
5. Any difference fails the run. The core makes no rolls, so three fresh games answer alike with
   no seed handling.

The run may also be pointed at `test_ops_scan`, `test_ops_findings` and `test_ops_access` with
`--scenario`. That is optional and is not part of finishing S6.

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

Added in K2. A small copy of the core's fixtures: one office network marked for discovery, a jack
and a drop box, two sign-in hosts (one with a held session path), a file server with one service
that has two real weaknesses and one decoy, two technique cards for different techniques, an
open share and a printer to look at. Its objectives and hints follow the wording rule of 5.6. K3
adds `networkView.defaultSkin: "cli"`.

The beats are written once in the scenario's `PLAYTEST.md` and run twice in K2, once with
`--net-skin gui` and once with `--net-skin cli`, through `window.__test.network`. After each beat
the script checks the requests sent, what the answers held, and the server's record.

| Beat | What happens | Server record afterwards |
|---|---|---|
| T1 | Plant the box; the view opens in the starting skin with the header switch | foothold held |
| T2 | Sweep the network, then scan the file server | as `test_ops_scan` records |
| T3 | Terminal run only: a mistyped verb, an unknown host id, and the id of a host on a network not yet swept | unchanged; no request sent |
| T4 | Check the service, then confirm each finding | as `test_ops_findings` records |
| T5 | Use a card on the decoy and on an unconfirmed finding | unchanged; the same refusal code and sentence in both runs |
| T6 | Switch skin; the same hosts, service, findings and cards are shown; switch back | unchanged; no request sent |
| T7 | Use the first card (Panels: select then Use; Terminal: typed). Use the second (Panels: drag; Terminal: quick commands) | a session at the stated access; a keyring entry |
| T8 | Open the share; look at the printer | unchanged apart from the share being opened |
| T9 | Unplug | foothold gone, sessions through it ended |

Switch beats, run once in K2 with no `--net-skin` value:

| Beat | What happens |
|---|---|
| W1 | Fresh profile: the view opens in Panels. Press the switch; reload; the view opens in the Terminal with an empty log and the same rows |
| W2 | Open the same game with `?net_skin=gui`: the view starts in Panels although the pick is Terminal. Press the switch: the Terminal mounts. Reload: Panels again, and the stored pick is still Terminal |
| W3 | Open `test_access_networks` with the stored pick still Terminal: Panels, and no switch |

Default beat, K3:

| Beat | What happens |
|---|---|
| D1 | Fresh profile, no URL value: the view of `test_ops_skin` opens in the Terminal; one press of the switch gives Panels and is stored |

### 11.5 Scripted playtest bridge

Added to `systems/test-bridge/` as `window.__test.network` in K2.

| Call | Returns or does |
|---|---|
| `network.state()` | `{ skin, hasSwitch, footholdId, status, offers: [{ action, target, label, command }] }`, the same in both skins apart from `skin` |
| `network.run(offer, { path })` | Performs the offer with real input by the named path of section 11.2 (`button`, `select`, `drag`, `typed`, `quick`); with no `path`, the simplest one for the active skin. Resolves with the server's answer. Rejects when the path does not belong to the active skin or the offer is not in the list |
| `network.skin()` / `network.setSkin(name)` | Reads the skin; changes it by pressing the header switch |
| `network.log()` | The Terminal log as lines (empty in Panels) |
| `network.type(line)` | Types a line into the prompt and presses Enter, for lines that are not offers (T3) |

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
  row's `id`, `kind`, `action`, `selector`, and the core's additions), plus `skin`. In the
  Terminal each selector resolves to the quick-command button, which carries the same hooks.
- Selectors must name the action. Once a host row can hold Scan as well as Sign in,
  `[data-host-id="…"] [data-action]` matches more than one element in either skin; section 14,
  request 2 asks the core to give each control's selector its `data-action` value.
- `clickControl('Sign in')` matches by exact label, then prefix, then substring. A quick command
  reads "Sign in" followed by its line, so the prefix match applies and takes the first one, the
  same host the Panels would give, because the quick commands keep the Panels' order. Test 2 of
  11.2 covers the order.
- `clickControl(n)` by number is not stable across skins. No existing playtest uses a number in
  the network view. `docs/test-bridge.md` says so and tells authors to use a selector, a label
  or `network.run`.

`docs/test-bridge.md` gains a "Network view" section with these calls in K2.

### 11.6 Live proof

K4, on a keyless server from the worktree, with fresh games made in that run: the live parity
run of 11.2; the T, W and D beats through the real client path; screenshots of both skins at
desktop and phone widths, and of the prompt above an on-screen keyboard; the UI rules audit over
the Terminal surface; and the access leak scanner over the captured responses.

## 12. Build steps and shared files

Each step is one commit on a feature branch cut from main after the core's S3 has landed,
committed before its tests are run in the shared tree.

| Step | Stage | Work | Proof before moving on |
|---|---|---|---|
| 1 | K1 | Save the scene's DOM for every fixture and for every recorded `ops_unchanged` view answer, before any change. Move the fixtures the tests build inline into `test/js/fixtures/network-view/` only for the new tests; existing tests are not edited | the snapshots exist on the branch point |
| 2 | K1 | `view-texts.js`, `view-controls.js`, `network-view-panels.js`; the scene mounts the Panels renderer and gains `perform`; copy lists | K1 rows of 11.1; existing and core node tests unedited; `bin/test-js` whole; scripted reruns of `test_access_networks` and `test_ops_access` |
| 3 | K2 | `skin-choice.js`; the starter passes the skin; the header switch on ops views | `network-skin-choice.test.mjs`, `network-skin-unchanged.test.mjs` |
| 4 | K2 | `terminal-grammar.js`, `terminal-format.js`, `network-view-terminal.js`, the rules in `network-view-minigame.css`; the Tab attribute, the pause on mount, `scrollIntoView` on the prompt | grammar, format, parity and text tests |
| 5 | K2 | `window.__test.network`; `--net-skin` in `session-start.sh`; `test_ops_skin` with its `PLAYTEST.md`, graph and leak collector entries; the audit entry; `docs/test-bridge.md` | the T beats in each skin and the W beats; the skin-blind controller test; the reruns of section 10, check 3; full suites; land K2 |
| 6 | K3 | Schema, validator checks, wording warning, bootstrap test; `defaultSkin` in `test_ops_skin` | K3 rows of 11.3; beat D1; validator output for every other scenario unchanged |
| 7 | K4 | `tools/playtest/network-skin-parity.mjs`; the live proof of 11.6; the `README_scenario_design.md` feature index (N16) and `docs/ACCESS_AND_NETWORKS.md` | all of 11.6; land |

| Shared file | Also touched by | This plan's part |
|---|---|---|
| `minigames/network-view/network-view-minigame.js` | core (S1 to S3), privilege (S5a session badges) | K1 moves the drawing out and leaves the handlers. A plan that lands after K1 adds its drawing to `network-view-panels.js` and its handler to the scene |
| `minigames/network-view/ops-model.js` | core (owner) | read only; the three additions of section 14 are the core's to make |
| `css/network-view-minigame.css` | core | the Terminal's rules, appended |
| `scripts/scenario-schema.json` | every plan | one top-level block |
| `scripts/validate_scenario.rb` dialogue lint, `scripts/validate_network_ops.rb` | core (owner of the second), every plan | two warnings |
| `systems/test-bridge/index.js` | possibly core | one new namespace |
| `tools/playtest/session-start.sh`, `tools/playtest/ui-rules-audit.mjs` | none known | one option; one surface |
| `README_scenario_design.md`, `docs/ACCESS_AND_NETWORKS.md`, `docs/test-bridge.md` | every plan | the N16 rows and one section |
| JS test harness copy lists | every plan that adds a module | the seven new modules |

Not touched: `ui/display-settings.js`, `ui/game-menu.js`, the game page's stylesheet list, any
server model or controller.

## 13. Log rows

None. A skin switch is not a game action and writes no row. The requests made from either skin
write the rows their own plans list, and those rows are identical whichever skin sent the
request, because the request is.

## 14. Cross-plan requests

1. **Core: the held card's item id on a technique entry.** Each entry of the top-level
   `techniques` map in `GET /network` carries `itemId`: the id of the first card of that
   technique the player holds, in id order. The client turns a technique id into the `item_id`
   that `POST /network/technique` takes, and the Panels' Use and drag send that same id, so two
   held cards of one technique make one request from either skin.
2. **Core: hooks on its controls.** The core's buttons carry `data-action` values `sweep`,
   `scan`, `check`, `confirm` and `use`, on elements marked `data-network-id`, `data-host-id`,
   `data-service`, `data-finding-id` and `data-technique-id`. Each control's `selector` in
   `getTestState()` names its action (`[data-host-id="…"] [data-action="scan"]`), so a selector
   matches one element once a row holds several controls.
3. **Core: three texts in `ops-model.js`,** beside the refusal text for a code, so that neither
   renderer has wording of its own: `findingLabel(finding)`, the short plain-text label of a
   finding (its class and severity in words); `needLine(need)`, a need's label with its met or
   unmet word; and `useResultText(answer)`, the sentence for a session granted, a credential
   granted and a repeat (`already`).
4. **Core: which findings a use may target.** This plan offers every held technique against
   every listed finding, whatever its status, so that both skins reach every refusal code. The
   core should confirm that its Panels allow the same, or state its rule; the rule is written
   once, in `offers()`, and both skins follow it.
5. **Log rows (S9): no skin in a row,** and no route parameter that names the skin.
6. **Every plan: wording.** Objectives, hints and spoken lines in the `test_ops_*` scenarios
   name actions and targets, never controls (5.6).

For information, and asking nothing: a plan that adds a control to the network view after S6
lands will see the three tests named in 5.2 fail until the control has an entry in `CONTROLS`.
A refusal `reason` is a code in every plan, with its words in the one client table.

## 15. Open questions for the user

1. **Is a control list private to the network view acceptable?**
   You decided against a shared registry of moves. This plan keeps one small table inside the
   network-view folder that both renderers of that one screen draw their buttons and commands
   from. No other feature registers with it, the server never sees it, it holds no needs,
   effects, time or noise, and each action keeps its own route.
   (a) Yes, keep it. (b) No: the two renderers each list their controls separately and a test
   compares the two lists.
   Recommendation: (a). The table is what makes "a skin never adds or removes a request"
   checkable by construction, and it is a drawing aid for one screen, the same pairing of button
   and handler the click listener makes today. (b) gives the same guarantee only through the
   comparison test, with two lists to keep in step.
2. **May a scenario force a skin, and where does its default live?**
   (a) No forcing: a scenario sets a default and the player's pick wins. (b) `lockSkin: true`
   removes the switch. (c) Forcing allowed, but only to force the Terminal with the quick
   commands kept.
   Recommendation: (a). Nothing in a mission can depend on the skin, a forced Terminal is harder
   on phones and for some players, and a lab that wants the prompt can default to it.
   The default is written in the scenario (`networkView.defaultSkin`) and not in `mission.json`
   beside `ui_theme`, because it concerns the scenario's network and is validated with it; say
   if you would rather keep presentation choices together in `mission.json`.
3. **How close to real tools does the Terminal get?**
   (a) Invented tool names and banners, table layouts in the general style of scanner output
   with plain column headers from the game's own field names, plain verbs (`sweep`, `scan`,
   `check`, `use`), one line per action. (b) As (a), with column headers and their order copied
   from a well-known scanner, so the table reads like the real one. (c) As (b), and the names of
   well-known real tools are accepted as aliases for the matching verb. (d) As (c), and a use
   may also be typed in a framework console's staged form (pick, set the target, run), still
   sending one request at the last step.
   Recommendation: (a). It keeps the "fictional and abstract" rule and still teaches reading a
   scan table. Each further step is a small addition to the grammar or the layouts that the
   parity tests already cover, so it can be taken later.
4. **Names of the two skins.** "Panels" and "Terminal" on the switch, Panels the default.
   Recommendation: as stated; you may prefer other names (for example "Console" for the
   second).
5. **Quick-command buttons in the Terminal.**
   (a) Visible by default. (b) Folded by default, opened by a button or by `help`.
   Recommendation: (a). They make the Terminal usable without typing, which is what lets it work
   on a phone or with a switch device, and a player who wants a bare prompt can fold them. Under
   (b) the buttons stay in the page, so test selectors keep working, but typing becomes the only
   obvious way in.

No action costs game time because of the skin, so this plan raises nothing about a clock.
