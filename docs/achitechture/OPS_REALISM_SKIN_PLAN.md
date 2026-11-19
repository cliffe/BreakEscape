# Ops layer S6: realism skin for the network view (feature N16)

Status: draft plan, 2026-11-19. Planning only; nothing is built until the user says so.
Base: branch `docs/ops-layer-plan`. Shared brief: `docs/agents/OPS_LAYER_BRIEF.md`. Outline:
`docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md`, stage S6.

This plan stands alone. A builder needs this file, the brief, and the core plan
(`OPS_CORE_PLAN.md`, stages S1 to S3) for the moves that the skin draws. The core plan did not
exist when this was written, so everything this plan needs from it is listed in section 14.

Words used here. A **move** is one thing the player can do in the network view that reaches the
server or opens another screen (scan, check, confirm, use a technique, sign in, open, look,
unplug). A **skin** is one way of drawing the view and taking input: `gui` (panels and buttons)
or `cli` (a command-line simulation). An **intent** is the data form of a move:
`{ move, target }`. Code, schema and tests use these words.

## 1. What this adds and why

### 1.1 In play

The network view opens when the player uses a foothold (a planted drop box, a joined Wi-Fi
network, an implant). Today it is one screen: a list of hosts and shares with one button per row.
The core plan adds services, findings and technique cards to that screen.

S6 gives the same screen a second face. A switch in the view's header, and the same option in the
game menu's display settings, changes between:

- **Panels** (`gui`): the list and buttons, in the 90s film-hacker look of the mission's UI theme.
- **Terminal** (`cli`): a prompt and a scrolling log. The player types `scan`, reads a table of
  hosts in the layout a scanner prints, types `check files01 web`, reads findings, types
  `use <technique> <finding>`, and so on. Results are laid out the way scanner and framework tools
  lay them out. Nothing real runs: each command is one of the same moves the buttons make, sent to
  the same server route, and the text is a different drawing of the same answer.

The player can switch at any time, in the middle of a task, and loses nothing: the hosts found,
the findings and the sessions held all live on the server.

### 1.2 What it teaches

The Panels skin teaches the shape of the work (find hosts, find services, check them, use what you
find). The Terminal skin adds the reading skill: picking the two lines that matter out of a
scanner table, and getting used to a prompt, a verb and a target. A learner who is put off by a
prompt is never blocked by it, and one who wants the prompt can have it for every mission.

### 1.3 The three design rules

1. **One set of moves.** A skin never adds, removes, renames or reorders the server's part of a
   move. Whatever one skin can do at a given moment, the other can do at that moment, and the
   server cannot tell which skin sent a request.
2. **A renderer cannot reach the server.** Both renderers draw one view-model and hand back
   intents. Only the scene's dispatcher turns an intent into a call. A test fails the build if a
   renderer file imports the API client or `network-links.js`, or names `fetch`.
3. **Text about the game never names a control.** Spoken lines, objectives and hints say what to do
   ("scan the office network"), never how one skin does it ("click Scan", "type scan").

Rule 1 is what lets the feature ship without playtests of its own: a mission that is solvable in
one skin is solvable in the other because the moves and the server are the same. Section 11 has
the test that proves it for each build.

## 2. What the code does today

Verified in the worktree on 2026-11-19 unless marked "digest" (taken from
`docs/agents/ops_layer/digests/D3_minigames_logs_ui.md` and not re-read).

| Area | Today | Where |
|---|---|---|
| The view | One scene, `NetworkViewMinigame`, registered as `network-view`. It draws in the shared console window (`consoleWindow`), which supplies the title bar and the X | `public/break_escape/js/minigames/network-view/network-view-minigame.js:249-253`; registration `minigames/index.js:245` (digest) |
| Data | The scene never reads scenario data. Its only source is `window.networkLinks.view(footholdId)`, which wraps `GET /network` | `network-view-minigame.js:287`, `:403-405`; `systems/network-links.js:259` |
| Moves | One method, `act(row, action)`, handles `sign-in`, `open` and `observe`. Sign in and open hand over to the existing remote sign-in screen, desktop or share container; look shows text in the view. Unplug is a second path, `unplugBox()` | `network-view-minigame.js:870-896`, `:829-852` |
| Input | Delegated click listeners find `[data-action]` inside `[data-host-id]` or `[data-resource-id]`, and `[data-unplug]` | `network-view-minigame.js:314-333` |
| Drawing | HTML strings built in the scene (`rowHtml`, `blockSectionHtml`, `render`). Pure helpers are exported for tests (`hostAction`, `resourceAction`, `downState`, `displayOrder`, `viewSubtitle`) | `network-view-minigame.js:144-232`, `:621-774` |
| Refresh | Refetch every 5 s, widening to 15 s when idle; redraw only when the answer differs | `network-view-minigame.js:86-90`, `:509-560` |
| Events | `network_viewed` and `network_host_opened`, emitted by the scene | `network-view-minigame.js:448-463`, `:874` |
| Way back | The scene reports why it closed through `networkLinks.landed('view', reason)` | `network-view-minigame.js:912-918` |
| Test snapshot | `getTestState()` returns `rows[]` and `networks[]`, each row with `id`, `kind`, `action` and a CSS `selector` | `network-view-minigame.js:920-954` |
| Display settings | `ui/display-settings.js` keeps `{ theme, hudStep, zoomStep, healthStyle }` in `localStorage` under `be_display_settings`, per browser, and dispatches `be:display-settings-changed`. A `?ui_theme=` URL value beats the player's pick, which beats the mission's theme | `ui/display-settings.js:13`, `:38`, `:63-69`, `:78-87` |
| Settings UI | The game menu draws one `<select data-setting="...">` per display setting and calls `updateDisplaySettings` | `ui/game-menu.js:19`, `:181`, `:198-204` |
| Mission config | The page passes `uiTheme` to the browser in `breakEscapeConfig` | `app/views/break_escape/games/show.html.erb:263` |
| Test bridge | `window.__test.minigame` has `getState`, `clickControl(indexOrLabel)`, `clickText`, `type(index, text, { submit })`, `pressKey`, `close` | `systems/test-bridge/minigames.js:92`, `:104`, `:195`, `:233`, `:371`, `:563` |
| Fonts | VT323 is self-hosted for console text; Press Start 2P for titles | `public/break_escape/css/fonts.css:2`, `:22-31` |
| Keyboard | A scene with a text field must be started with `requiresKeyboardInput: true` so game keys are paused. `network-links.js` already does this for one of its screens | `network-links.js:674`; `minigame-manager.js:111-135` (digest) |
| Focus | The framework traps Tab inside an open minigame and steps aside for an element marked `data-own-tab-cycle` | `minigame-manager.js:236-416` (digest; to verify at build) |
| Node test harness | `test/js/network-view.test.mjs` copies named engine files into a temporary tree before importing | `test/js/network-view.test.mjs:25-33` |

What already does part of the job:

- The scene already keeps the server behind one object (`networkLinks`), so a dispatcher is a small
  step.
- `hostAction` and `resourceAction` already reduce a row to the single action it offers. They become
  the start of the intents table.
- Display settings already exist with the right scope (a presentation choice, per browser) and a
  change event.
- An `ehr-terminal` minigame exists (`minigames/index.js:224`). It was not read for this plan; the
  builder checks it for terminal CSS worth sharing before writing new rules (step 3 in section 12).

There is no command-line view of the network today, no `networkSkin` setting, and no scenario
field about how the view is drawn.

## 3. Build stages

Four stages, each shippable alone. Total size M.

| Stage | Adds | Ends playable when | Size |
|---|---|---|---|
| K1 Split | The scene is split into a view-model with an intents table, a dispatcher, and a `gui` renderer that draws exactly what the scene draws today. No visible change | Every existing network-view test passes unchanged and a DOM comparison of the old and new output on the fixture answers is identical | S |
| K2 Terminal | The `networkSkin` setting, the header switch, the `cli` renderer, the grammar, help and completion, for the moves that exist when it lands | A player can do everything in `test_access_networks` from the prompt, and switch back and forth mid-task | M |
| K3 Core moves | Terminal layouts for scan, check, confirm and use; the scenario field `networkView.defaultSkin`; the feature scenario `test_ops_skin` | The `test_ops_skin` beats pass in both skins | S |
| K4 Proof | `window.__test.network`, the live parity runner, docs (README feature index N16, `docs/ACCESS_AND_NETWORKS.md`) | The parity run is green on `test_ops_skin`, `test_ops_scan`, `test_ops_findings` and `test_ops_access` | S |

Order against the core plan: K1 is best built **before** S1, so that S1 to S3 add their moves to
the intents table instead of to hand-wired buttons that K1 would then have to move. K2 does not
depend on S1 to S3. K3 needs them. If the user keeps the outline's order (core first), K1 also
moves the core's buttons into the table; the size of K1 becomes M. See section 14, request 1.

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
| `networkView.defaultSkin` | `"gui"` (default) or `"cli"` | The skin the view opens in for a player who has not picked one |

The block is closed (`additionalProperties: false`, `_` note keys allowed). No other stage's
fields change. Whether a scenario may also force a skin is open question 1; this plan is written
to the recommendation, which is that it may not.

**Who sets the skin, in order of precedence** (first that applies):

1. A `?net_skin=gui|cli` value in the page URL, for previews and test runs. Same pattern as
   `?ui_theme=` (`ui/display-settings.js:63-69`). Not stored.
2. The player's pick, `networkSkin` in display settings: `"gui"`, `"cli"` or `null` (no pick).
   Set from the game menu or the switch in the view's header. Stored per browser, like the other
   display settings.
3. The scenario's `networkView.defaultSkin`.
4. `"gui"`.

The organiser of an event has no setting in this stage (open question 2). The player's pick beats
the scenario because the skin changes nothing about the game, and a player who needs buttons
(a phone, a switch device, a screen reader set up for the list) must be able to keep them.

## 5. Engine behaviour

### 5.1 Server

Nothing. S6 adds no route, no model code and no state. The only server-side change is the schema
entry for `networkView` and one check that the block reaches the bootstrap (section 7).

### 5.2 Client: the parts

All under `public/break_escape/js/minigames/network-view/`.

| File | Kind | Role |
|---|---|---|
| `network-view-model.js` | pure | `buildViewModel(view)`: the server's answer turned into ordered entries (link, network blocks, hosts, services, findings, techniques, resources) with display fields and down states. `availableIntents(vm)`: every intent open to the player right now, in display order. `MOVES`: the table below |
| `network-view-minigame.js` | scene | Keeps what it has today: load, refetch, events, the trip's way back, the test snapshot. New: `dispatch(intent)`, renderer choice, live switch |
| `network-view-gui.js` | renderer | Today's HTML, moved. Each control carries `data-intent` as well as today's `data-action` |
| `network-view-cli.js` | renderer | Prompt, log, quick-command list |
| `cli-grammar.js` | pure | `parse(line, vm)`, `complete(line, vm)`, `helpFor(verb)` |
| `cli-format.js` | pure | `formatListing(vm)`, `formatResult(result, vm)`: arrays of plain text lines |

**The moves table** is the single source for both skins. One row per move:

| `move` | Panels label | Terminal verb | Target | Dispatches to | From |
|---|---|---|---|---|---|
| `scan_network` | Scan | `scan` | none (the link's networks) | core route (S1) | core |
| `scan_host` | Scan | `scan <host>` | host | core route (S1) | core |
| `check` | Check | `check <host> <service>` | service | core route (S2) | core |
| `confirm` | Confirm | `confirm <finding>` | finding | core route (S2) | core |
| `use` | Use | `use <technique> <finding>` | technique and finding | core route (S3) | core |
| `signin` | Sign in | `signin <host>` | host | `window.openRemoteSignIn` | today |
| `open_session` | Open | `open <host>` | host with a held session | `window.openRemoteDesktop` or `openFromDesktop` | today |
| `open_share` | Open | `open <share>` | share | `window.startContainerMinigame` | today |
| `look` | Look | `look <thing>` | resource | none; shows `observations` | today |
| `unplug` | Unplug | `unplug` | none | `networkLinks.unplugFromView` | today |

The verb is the label in lower case, so a hint that says "scan the network, then check the file
server" reads correctly in both skins. Later stages (S5 escalate, S7 dump) add a row here and get
both skins from it; a move that is not in the table cannot be drawn by either renderer.

**The renderer contract.** A renderer is a class with `mount(root, ctx)`, `render(vm, intents)`,
`showResult(result)`, `noteChange(summary)`, `unmount()` and `testState()`. `ctx` holds
`dispatch(intent)`, `requestClose()` and `requestSkin(name)`, and nothing else. A renderer:

- imports only the pure modules, the escape helper and constants;
- never names `fetch`, `ApiClient`, `networkLinks`, `window.open*` or `window.start*`;
- emits no game event (the scene emits `network_viewed` and `network_host_opened`, so objectives
  and ink mappings see the same events from both skins);
- draws authored and server text with `textContent` (cli) or the existing escape helper (gui).

**The dispatcher.** `scene.dispatch(intent)`:

1. Refuses an intent that is not in `availableIntents(vm)` at that moment (deep-equal on
   `{ move, target }`). The refusal is local: nothing is sent. This is what stops a typed command
   from probing for a host or finding the view has not shown.
2. Runs the move's one handler (today's `act` and `unplugBox`, plus the core's calls).
3. Returns one `result`: `{ intent, ok, outcome, reason?, data? }`, where `data` is the server's
   answer for that move (or nothing for a hand-over). The scene passes it to
   `renderer.showResult`, then refreshes the view-model and calls `render`.

Both skins therefore send the same requests with the same parameters in the same order for the
same sequence of intents.

**Switching.** `requestSkin` writes the display setting, then the scene unmounts one renderer and
mounts the other on the same view-model. No request is sent, the refetch timer keeps running and
the trip is not ended. The switch is a 2px-bordered button in the header strip, labelled with the
other skin's name ("Terminal" or "Panels").

### 5.3 The Terminal skin

**Layout**, inside the shared console window (title bar, subtitle and X unchanged):

```
+--[ Drop box: Desks, Spare wall port ]------------------[Panels][X]+
| link up. 3 hosts, 1 share. Type help, or pick a command below.    |
| > scan                                                            |
| HOST       STATE  NAME                                            |
| fin-pc01   up     Finance desk 1                                  |
| files01    up     File server                                     |
| > _                                                               |
+-------------------------------------------------------------------+
| Commands:  [Scan  scan files01] [Sign in  signin fin-pc01] ...    |
+-------------------------------------------------------------------+
```

- **Log**: `role="log"`, `aria-live="polite"`, pixel scrollbar, capped at 300 lines (oldest
  dropped). It is kept for the length of the trip in a module variable keyed by foothold id, so
  coming back from a sign-in screen shows the same log; it is dropped when the trip ends. It is
  never saved or synced.
- **Prompt**: one real `<input type="text">` with a visible label, `autocomplete="off"`,
  `autocapitalize="off"`, `spellcheck="false"`. Enter runs. Up and down walk the trip's command
  history (20 entries).
- **Quick commands**: one button per available intent, in view-model order. Each button shows the
  Panels label and the command it stands for, and carries the same hooks as the Panels row
  (`data-host-id` or `data-resource-id` on its item, `data-action` and `data-intent` on the
  button). Pressing one writes the command into the log and runs it through `parse`, so the
  button and the keyboard share one path. The list wraps and scrolls; the player can fold it away.
- **What a result looks like**: tables with a header row and fixed columns for scan answers
  (`HOST STATE NAME`, then `PORT STATE SERVICE VERSION`), one line per finding with its severity
  for a check, a short block for a technique that worked or the server's reason when it did not.
  Layouts are in the style of scanner and framework tools; tool names and banners are invented
  (open question 3).
- **What it may print**: constants from `cli-format.js` and fields of the view-model or of the
  result. Nothing else. No invented host, port, service, version or filler row, and no random
  text. Lines appear at once (no typing effect), so there is nothing to seed and nothing for
  reduced-motion to switch off.
- **A change while the view is open** (the 5 s refetch finds a host gone, a session ended): one
  line, `-- network changed. show lists it again --`. The log is never redrawn; the quick
  commands are.

**Grammar.** A line is `verb [target ...]`.

- Verbs: the ten in the table, plus four local ones that send nothing: `help [verb]`,
  `show` (print the current listing; alias `ls`), `clear`, `exit` (close the view, as the X does;
  alias `quit`), and `panels` (switch skin).
- Forgiving: case and extra spaces are ignored. A verb or target may be shortened to any prefix
  that is unique among what is on offer (`sig fin` runs `signin fin-pc01`). A target is a host
  label, a share or finding name, or the row number the last listing printed. The word `on` is
  allowed and ignored (`use <technique> on <finding>`).
- Aliases, each to exactly one move: `login` and `connect` to `signin`; `ls` to `show`; `run`
  to `use`.
- A line that does not parse sends nothing and costs nothing. An unknown verb answers with the
  nearest verb ("did you mean"); an unknown target lists what that verb can be used on; an
  ambiguous prefix lists the matches. A typo can never spend a sign-in attempt or trip a
  lockout, because only a parsed intent that the dispatcher accepts reaches the server.
- Tab completes the token under the cursor to the longest common prefix and lists the matches in
  the log on a second press. Tab completes only when the prompt holds text; with an empty prompt
  it moves focus as usual, so a keyboard user can reach the quick commands, the switch and the X.
  The input is marked for its own Tab handling only while it holds text (the framework's
  `data-own-tab-cycle` hook; to verify at build).
- `help` prints the verbs with the same one-line descriptions the Panels buttons use as their
  `title`. Both come from `MOVES`.

### 5.4 Pixel-art UI rules

| Rule | How the Terminal skin meets it |
|---|---|
| Pixel fonts only | VT323 for the log, prompt and quick commands, at the size the shared console already uses for VT323 text (the builder reads it from `minigames-framework.css`; no new size); Press Start 2P stays on the title bar |
| 2px borders, no radius | Prompt box, quick-command buttons and the switch use the existing `.minigame-button` look; the cursor is a solid block |
| Device frame | The view is already the link device's console in the shared console window. The Terminal skin is that console's other mode, inside the same frame |
| X closes, no Cancel | The shared X and Esc close it. `exit` is a second way, not a Cancel button |
| One look per concept | The switch looks the same in both skins and sits in the same place |
| Theme | Colours come from the `ui-themes.css` tokens of the current theme; no new palette |
| Crisp text | No text shadow, glow or scanline overlay on the log |

### 5.5 Typed input and accessibility

- Nothing in the game needs typing. Every available move is a quick-command button, so the
  Terminal skin works with a pointer, a switch device or a phone's touch screen alone.
- The Panels skin is one press away, and the player's pick wins over the scenario's default.
- No time limits, and no cost for a mistyped line.
- The log is a live region, so a screen reader reads each result once. The prompt has a label.
  Focus returns to the prompt after a command and after a switch to Terminal.
- Under 600px wide the quick commands open unfolded and the log takes the rest of the height.
  The prompt stays on screen above an on-screen keyboard (to verify on a phone at build).
- Game keys are paused while the Terminal skin is mounted. The scene is started with
  `requiresKeyboardInput: true` when it opens in `cli`, and on a live switch it calls the same
  pause and restore the framework uses (`minigame-manager.js:111-135`, digest; the restore call is
  to verify at build). In `gui` the start parameters stay as they are today.

### 5.6 Spoken lines, objectives and hints

- **Rule for authors**: text a player hears or reads about the task names the move and the
  target. "Scan the office network." "Check the web service on the file server." It does not say
  click, press, button, type, command, prompt or terminal about a network move.
- **Why it works**: the move's name is the button's label in Panels and the verb in Terminal.
- **Control help belongs to the engine, per skin**, and is not spoken: the Terminal's first line
  ("Type help, or pick a command below.") and `help`; the Panels buttons' labels.
- **Check**: a validator warning (section 9) on skin-specific wording in scenarios that use the
  ops fields.
- No spoken line is added or changed by this stage, so there is no voicing cost.

### 5.7 Determinism

The skin holds no state the server reads and makes no rolls. For the same view answer and the same
intent, both skins send the same request. The Terminal's output is a pure function of the
view-model, the result and the command line.

## 6. Server routes

None added, none changed. The skin uses the routes that exist when it lands:

| Move | Route | Owner |
|---|---|---|
| Load and refresh | `GET /games/:id/network?foothold=` | built (N1 to N12) |
| Unplug | `POST /games/:id/network/unplug` | built |
| Sign in, open, share | the existing sign-in, desktop and container screens and their routes | built |
| Scan, check, confirm, use | the core plan's routes | core (S1 to S3) |

The server receives no parameter that names the skin, and no route may branch on one. A
controller test in section 11 pins this.

## 7. What reaches the browser, and what never does

| Path | Sent | Withheld |
|---|---|---|
| `GET /scenario` (bootstrap) | `networkView.defaultSkin` | Nothing new to withhold |
| Every other route | Unchanged | Unchanged |

- `networkView` holds a presentation choice only. A secret does not belong in it and the closed
  schema leaves nowhere to put one.
- The bootstrap filter removes named top-level keys and passes the rest
  (`app/models/break_escape/game.rb:2390-2508`, from digest D5b; the builder confirms that an
  unlisted top-level key passes, and adds a model test that it does).
- The Terminal skin shows only what the view answer and the move results contain, which is what
  the Panels skin shows. It cannot show more, because `cli-format.js` receives nothing else. The
  test for this is the sentinel test in section 11.
- A refusal's text is the server's `reason`, printed as plain text in both skins.

## 8. State and saved games

| State | Where | Size | Sent |
|---|---|---|---|
| The player's pick (`networkSkin`) | `localStorage`, key `be_display_settings` | one short string | never |
| Terminal log and command history | a module variable, per trip | 300 lines and 20 commands at most | never |
| Folded or unfolded quick commands | the renderer instance | one boolean | never |

Nothing is added to `player_state`, to the sync sections or to any server answer, so the delta
rule has nothing to judge. A reload reopens the view in the stored skin with an empty log. A
saved game from before the feature behaves the same as a new one. A player who changes browser
gets the scenario's default until they pick again; this is how the other display settings behave.

## 9. Validator, schema and dungeon graph

**Schema** (`scripts/scenario-schema.json`, K3): a top-level `networkView` object,
`additionalProperties: false`, note pattern `^_`, one property `defaultSkin` with
`enum: ["gui", "cli"]` and a description naming its reader
(`network-view-minigame.js`). It is structure, not an id map and not free data. It is not marked
`x-serverOnly`.

**Validator**:

| Level | Check | Stage |
|---|---|---|
| Error | `networkView.defaultSkin` is not `gui` or `cli` (from the schema) | K3 |
| Error | An unknown key in `networkView` (closed block, with the usual "did you mean") | K3 |
| Warning | `networkView` is set in a scenario with no `networks`: it has no effect | K3 |
| Warning | Skin-specific wording: in a scenario that uses `services`, an objective, hint, mail or ink line that pairs a control word (click, press the, button, type, command line, prompt, terminal) with a move word (scan, check, confirm, sign in, technique) | K3 |

The wording check is a warning because it is a pattern match and will have false positives (an
NPC may mention a terminal in passing). It goes in the dialogue lint that the validator already
runs (`scripts/validate_scenario.rb:8878`, digest D5b) for ink, and in the ops check file the
core plan adds for objectives and other text.

**Dungeon graph**: no change. The skin adds no lock, key, node or edge, and the graph generator
does not read `networkView`. A test asserts that the generated graph for `test_ops_skin` is the
same with and without the block.

## 10. Effect on existing scenarios

| Change | Effect on a scenario that does not use it |
|---|---|
| K1 split of the scene | None visible. Same HTML, same `data-*` hooks, same events, same `getTestState()` fields |
| `data-intent` on Panels controls | An extra attribute; nothing reads it but the new code and tests |
| `networkSkin` setting, default `null` | The view opens in `gui` as today |
| Header switch | One new button in the network view's header strip, in every scenario that has a network. This is the only visible change to an existing scenario |
| `networkView` block | Absent, so the default is `gui` |

Checks that prove it:

1. `test/js/network-view.test.mjs` passes without edits to its assertions (its copy list gains
   the new files).
2. A K1 test renders each fixture answer with the old `render()` output saved as a fixture
   string and with the new `gui` renderer, and compares them byte for byte.
3. The scripted run of `scenarios/test_access_networks/PLAYTEST.md` passes unchanged with no
   stored setting.
4. The validator's output for every scenario is unchanged (the train check runs it over all of
   them).

## 11. Tests

### 11.1 Node tests (`test/js/`)

| File | Proves |
|---|---|
| `network-view-model.test.mjs` | `buildViewModel` and `availableIntents` for each fixture answer: order, down states, one intent per offered control |
| `network-cli-grammar.test.mjs` | Each verb and alias parses to its one move; prefixes; row numbers; `on`; case and spacing; unknown verb, unknown target and ambiguous prefix return a message and no intent; completion results; hostile input (markup, control characters, a 10,000 character line) returns no intent and is printed as plain text |
| `network-cli-format.test.mjs` | Table layouts; the **sentinel test**: fixtures whose every field is a unique marker string, and every token in the output that is not one of the format constants must be one of those markers |
| `network-skin-moves.test.mjs` | `MOVES` is one to one: every move has exactly one label and one verb, no verb or alias maps to two moves, and the only verbs without a move are `help`, `show`, `clear`, `exit`, `panels` |
| `network-skin-imports.test.mjs` | The two renderer files and the three pure modules import nothing outside the allowed list and do not contain `fetch(`, `ApiClient`, `networkLinks`, `window.open` or `window.start` |
| `network-skin-parity.test.mjs` | See 11.2 |
| `display-settings-skin.test.mjs` | Precedence of URL value, pick, scenario default and fallback; a bad stored value falls back; blocked storage still works for the session |

Every new module is added to the copy list of each harness that imports the scene
(`test/js/network-view.test.mjs:25-33` and any other that copies it; the builder greps `test/js`
for `network-view-minigame.js`).

### 11.2 The parity test

One scripted sequence of intents, for example: scan the network, scan a host, check a service,
confirm a finding, use a technique, sign in, open a share, look at a printer, unplug. It is
written once as data and driven through both renderers.

**In node** (`network-skin-parity.test.mjs`), against a fake `networkLinks` and fake openers
that record every call:

1. For each fixture answer: the set of `data-intent` values on the Panels controls, the set on
   the Terminal quick commands, the set of intents reachable by typed commands (every verb
   against every target) and `availableIntents(vm)` are equal.
2. Run the sequence through Panels by clicking the control for each intent, and through Terminal
   twice (once typing the command, once pressing the quick command). The three recorded call
   lists are deep-equal: same calls, same arguments, same order.
3. The events emitted (`network_viewed`, `network_host_opened`) are deep-equal.
4. Typed lines that are not available intents (a host id that exists in another fixture, a
   finding not yet shown) record no call.
5. A switch in the middle of the sequence records no call and changes nothing in the lists.

**Live** (`tools/playtest/`, K4), on the real path:

1. Start three fresh games of the same scenario: A in `gui`, B in `cli`, C switching skin after
   each step.
2. Drive the same sequence in each through `window.__test.network.do(intent)`, which uses real
   input for the active skin (a click, or typing and Enter).
3. After each step compare, across the three games: the request the browser sent (method, path,
   body with the game id removed) and the response body.
4. At the end compare the server's record for each game: footholds, sessions, findings, keyring
   entries, the globals the moves set, and the S9 log rows with their times removed.
5. Any difference fails the run. It runs on `test_ops_skin`, and on `test_ops_scan`,
   `test_ops_findings` and `test_ops_access` once those exist. It needs the three games to roll
   the same (section 14, request 3).

This run replaces skin playtests: missions are playtested once, in whichever skin the run uses,
and the parity run is what shows the other skin gives the same game.

### 11.3 Rails tests

| File | Proves |
|---|---|
| `test/models/break_escape/network_view_bootstrap_test.rb` | `networkView` reaches the bootstrap unchanged; a scenario without it has no such key |
| `test/controllers/break_escape/network_skin_blind_test.rb` | Each network and ops route gives the same answer and writes the same state with and without a `skin` or `net_skin` parameter, so no route reads one |
| Validator tests | The four checks in section 9; the graph is the same with and without the block |

### 11.4 Feature scenario `test_ops_skin`

A small copy of the core's fixtures: one office network, a jack and a drop box, two sign-in hosts
(one with a held session path), a file server with one service that has one true and one decoy
finding, one technique card, an open share, a printer to look at. `networkView.defaultSkin` is
`cli`.

| Beat | What happens | Server record afterwards |
|---|---|---|
| T1 | Plant the box; the view opens in Terminal with the first line and the quick commands | foothold held |
| T2 | `scan`, then `scan files01` | as `test_ops_scan` records |
| T3 | A mistyped verb and an unknown host | unchanged; no request sent |
| T4 | `check files01 web`, then `confirm` on each finding | as `test_ops_findings` records |
| T5 | Switch to Panels; the same hosts, service and findings are shown | unchanged; no request sent |
| T6 | Use the technique from Panels | session at the stated access |
| T7 | Switch back; `open` the share from a quick command; `look` at the printer | unchanged apart from the share being opened |
| T8 | Reload; the view opens in the stored skin with an empty log and the same rows | unchanged |
| T9 | `unplug` | foothold gone, sessions through it ended |

### 11.5 Scripted playtest bridge

Added to `systems/test-bridge/` as `window.__test.network` (K4):

| Call | Returns or does |
|---|---|
| `network.state()` | `{ skin, footholdId, status, intents: [{ move, target, label, command }], entries }`: the view-model, the same in both skins |
| `network.do(intent)` | Performs the intent with real input in the active skin and resolves with the `result` |
| `network.skin()` / `network.setSkin(name)` | Reads the skin; switches it through the header switch |
| `network.log()` | The Terminal log as lines (empty in Panels) |

What keeps existing playtests working:

- With no stored setting and no scenario default, the view opens in `gui`, and a fresh headless
  profile has no stored setting. Existing runs are therefore untouched.
- `__test.minigame.getState()` returns the same fields in both skins (`rows`, `networks`, each
  row's `id`, `kind`, `action`, `selector`), plus `skin`. In Terminal each `selector` resolves to
  the quick-command button, which carries the same hooks, so a step that clicks a row's selector
  works in either skin.
- `clickText("Sign in")` finds a quick command in Terminal, since each shows the Panels label.
- The one thing that differs is a control's index, so `clickControl(n)` by number is not stable
  across skins. The builder greps the `PLAYTEST.md` files for numeric `clickControl` steps inside
  the network view and reports them; new ops playtests use `network.do`.
- `tools/playtest` gains a `--net-skin cli` option that adds `?net_skin=cli` to the game URL, so
  any existing run can be repeated in the other skin without editing it.

`docs/test-bridge.md` gains a "Network view" section with these calls.

### 11.6 Live proof

On a keyless server from the worktree, with fresh games made in that run: the T1 to T9 beats
through the real client path with screenshots of both skins at desktop and phone widths, the live
parity run of 11.2, and the access leak scanner over the captured responses.

## 12. Build steps and shared files

1. **K1**: add `network-view-model.js`; move drawing into `network-view-gui.js`; add `dispatch`
   to the scene; save the old output as fixtures first, then compare. Tests 11.1 (model, imports)
   and the byte comparison.
2. **K2**: `networkSkin` in `ui/display-settings.js` (default `null`, a `NETWORK_SKINS` list,
   `effectiveNetworkSkin()`), one `<select>` in `ui/game-menu.js`, and the reset in that file's
   defaults line. Header switch in the scene.
3. **K2**: `cli-grammar.js`, `cli-format.js`, `network-view-cli.js`, and
   `public/break_escape/css/network-view-cli.css`. Read `minigames/ehr-terminal/` first and share
   its rules if they fit. Verify the Tab hook, the keyboard pause and restore, and the phone
   keyboard behaviour named in 5.3 and 5.5.
4. **K3**: Terminal layouts for the core's moves; schema and validator; `test_ops_skin`.
5. **K4**: bridge calls, the live parity runner, the `--net-skin` option, and docs: the
   `README_scenario_design.md` feature index (N16), `docs/ACCESS_AND_NETWORKS.md`,
   `docs/test-bridge.md`.

| Shared file | Also touched by | This plan's part |
|---|---|---|
| `minigames/network-view/network-view-minigame.js` | core (S1 to S3), privilege (S5) | K1 splits it. Later plans add rows to `MOVES` and entries to the view-model |
| `ui/display-settings.js`, `ui/game-menu.js` | none known | one setting, one select |
| `scripts/scenario-schema.json` | every plan | one top-level block |
| `scripts/validate_scenario.rb` hook list, the ops check file | every plan | two warnings, one hook |
| `systems/test-bridge/index.js` | possibly core | one new namespace |
| `README_scenario_design.md`, `docs/ACCESS_AND_NETWORKS.md` | every plan | the N16 rows |
| JS test harness copy lists | every plan that adds a module | the six new modules |

## 13. Log rows

None. A skin switch is not a move and writes no row. The moves made from either skin write the
rows their own plans list, and those rows must be identical whichever skin sent the request
(section 14, request 4).

## 14. Cross-plan requests

1. **Core (S1 to S3): add moves through the table.** Each new player move in the network view is
   a row in `MOVES` (move name, label, verb, target kind, handler) and its data is an entry in the
   view-model, with no button wired by hand in the scene. If the core is built before K1, K1 does
   this conversion. Preferred order: K1, then S1.
2. **Core: names this plan assumed.** Moves `scan_network`, `scan_host`, `check`, `confirm`,
   `use`; a host has a short label, a service has a short name unique on its host, a finding and
   a technique each have a short display name unique within the view. The Terminal uses these as
   targets. If the core's names differ, the table follows the core.
3. **Core and every plan with a roll: seeds must not depend on the game id**, or the playtest
   tooling must be able to start games with a stated seed. The live parity run compares three
   fresh games and needs them to roll the same.
4. **Log rows (S9): no skin in a row**, and no route parameter that names the skin.
5. **Every plan: one result shape per move.** A move's route answers with a body that a
   formatter can print without extra requests: an outcome, a plain-text `reason` on refusal, and
   the changed items. Both renderers print from that one body.
6. **Every plan: wording.** Objectives, hints and spoken lines in the `test_ops_*` scenarios name
   moves and targets, never controls (5.6).
7. **Privilege, cracking, MFA plans**: a move that lives in the network view goes in `MOVES`. A
   move that lives on another screen (a desktop, a device, the cracking minigame) is outside this
   stage and has one skin.

## 15. Open questions for the user

1. **May a scenario force a skin?**
   (a) No: a scenario sets a default and the player's pick wins. (b) Yes, `lockSkin: true`
   removes the switch. (c) Yes, but only to force Terminal with the quick commands kept.
   Recommendation: (a). Nothing in a mission can depend on the skin, a forced Terminal is harder
   on phones and for some players, and a lab that wants the prompt can default to it.
2. **Should an event organiser be able to set the skin for an event?**
   (a) Not now; the `?net_skin=` URL value covers previews and demos. (b) A per-event default in
   Hacktivity. Recommendation: (a). (b) needs a Hacktivity change with its own access tests and
   can be added later without touching this design.
3. **How close to real tools does the Terminal get?**
   (a) Invented tool names and banners, real-looking table layouts, plain verbs
   (`scan`, `check`, `use`). (b) As (a), and the names of well-known real tools are accepted as
   aliases for the matching verb. (c) Output that copies a real tool's exact format.
   Recommendation: (a). It keeps the "fictional and abstract" rule, teaches reading a scan table,
   and avoids implying the game is the real tool. (b) is a small later addition if wanted.
4. **One line per move, or a staged framework console?**
   (a) One line: `use <technique> <finding>`. (b) Also accept the staged form (`use`, `set
   target`, `run`), which still sends one request, at `run`. Recommendation: (a) first; (b) is a
   pure parser addition that parity already covers, worth adding if the staged feel matters.
5. **Names and default.** The menu option "Network tools: Panels / Terminal", default Panels.
   Recommendation: as stated; the user may prefer other names.
6. **Quick commands in the Terminal skin.** Visible by default (recommended: they make the skin
   usable without typing, and keep test hooks the same), or hidden until the player asks, which
   looks more like a real terminal but makes typing the only obvious way in.
7. **Scope.** This stage skins the network view only. Remote sign-in, desktops, the patch panel
   and the rogue access point console keep their one look in both skins. Recommendation: keep
   that scope; a Terminal sign-in would be a separate feature with its own parity proof.
8. **Build order.** K1 before the core's S1 (recommended, see section 3), or after S5 as the
   outline lists it.

No move costs game time because of the skin, so this plan raises nothing about a clock.
