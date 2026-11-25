# S6 build brief: command-line realism skin for the network view (feature N16, steps K1 to K4)

Written 2026-11-24 by the S6 designer. Read `docs/agents/OPS_CORE_BUILD_BRIEF.md` first; its rules
bind every builder here, with one change: **the worktree for this stage is `/data/be-ops-skin`,
branch `ops-skin`** (it already holds S1 to S5a). Wherever the shared brief says
`/data/be-ops-build`, read `/data/be-ops-skin`. Use absolute paths under it.

The design is `docs/achitechture/OPS_REALISM_SKIN_PLAN.md` (cited as `plan:<line>`). This brief is
written so a builder does not need to open the plan: each unit states what to build. The plan
lines are given only so a reviewer can check a unit against its source. Where this brief and the
plan disagree on a name, a line number or a shape, THIS BRIEF is right: it was checked against the
code on `ops-skin` (section 2). Where they would disagree on what a player can do, stop and report.

Short names: `NV` = `public/break_escape/js/minigames/network-view/network-view-minigame.js`,
`NVDIR` = `public/break_escape/js/minigames/network-view/`, `OM` = `NVDIR/ops-model.js`,
`CSS` = `public/break_escape/css/network-view-minigame.css`. Line numbers are those on `ops-skin`
when this was written; re-find every anchor by name before editing.

Kind of work: a display layer in the browser, a validator, a small catalog of invented display
text, one test scenario. No server route, check or stored state is added.


## 1. What S6 adds, in play

- The network view gains a second way of drawing itself on networks whose hosts declare
  services (a view with at least one block the server marks `ops: true`). A switch in the header
  moves between **Panels** (`gui`, the rows and buttons of today) and **Terminal** (`cli`, a
  prompt and a scrolling log).
- The Terminal imitates two consoles: a network scanner (modelled on nmap) and a framework
  console (modelled on Metasploit). A typed line is parsed into one of the requests a Panels
  button already makes, sent to the same route, and the answer is printed in the tool's layout.
  The game's own short verbs (`sweep`, `scan`, `check`, `confirm`, `use <card> on f2`) work too,
  and every action also has a quick-command button, so nothing needs typing.
- Both skins send the same requests and show the same game information. The server cannot tell
  which skin sent a request. Switching skin mid-task loses nothing.
- A view with no `ops` block has no switch and is always Panels, so every scenario that exists
  today looks and behaves exactly as now.
- Scenario authors may add display-only fields (`networkView.defaultSkin`; `cli` on networks,
  hosts and services; a `realism` link on a weakness or decoy that names an entry of a separate
  catalog). None changes any answer of the game.

### The four design rules (every unit obeys them; reviewers check them)

1. **One set of requests.** A skin never adds, removes or changes a request. A request still
   waiting on its answer cannot be sent again from either skin. Each skin shows every piece of
   game information the other shows.
2. **A renderer cannot reach the server.** Renderers draw from rows and offers and hand a chosen
   offer back to the scene. Only the scene calls anything.
3. **Text about the game never names a control.** Objectives, hints and spoken lines say what to
   do ("sweep the office network"), never "click Sweep" or "type sweep".
4. **It stays a simulation.** Nothing runs against a real host. No output holds a working
   payload, shellcode, a real credential or an option that would configure one. The framework
   console's options are `RHOSTS`, `RPORT` and `TECHNIQUE` and nothing else. Every address is in
   a private range. Generators only format labels; they never invent content.


## 2. Plan drift: checked against the code on `ops-skin`

Every file and line the plan cites was looked up. Rows marked "holds" need nothing.

| # | Plan says | Code on `ops-skin` | Ruling |
|---|---|---|---|
| D1 | Built on a branch cut from main after core S3 (plan:1753); outline puts S6 after S5a | `ops-skin` holds S1 to S5a | Build here. S5a changes nothing S6 reads except that a session's `access` now comes from the server's computed level; S6 only prints it. |
| D2 | `NV` anchors: scene `NV:249`, starter `:962-976`, "Connecting..." `:302`, load error `:417`, unplug sentence `:850`, `hostAction` `:215-232`, test snapshot `:920-954` | scene class `NV:301`, starter `startNetworkViewMinigame` `:1688`, "Connecting..." `:371`, load error `:542`, unplug sentence `:1290` (in `showResult`), `hostAction` `:265`, `resourceAction` `:281`, `getTestState` `:1653`, `perform` `:1163`, hooks `onSent`/`onEnded` `:321-322`, `_runHook` `:1202`, pending set `:320` | Line drift only. Find by name. |
| D3 | An offer's `target` is an object of named ids (`{ networkId }`, `{ hostId, service }`, ...) (plan:576-578) | The core's `perform(offer, { echo })` and `pendingKey(action, target)` take `target` as the core built it: a network id (sweep), a host id (scan), `checkTarget(hostId, service)` (check), a finding id (confirm), `useTarget(techniqueId, findingId)` (use), the jack id (unplug) | **Code stands.** An offer keeps `target` exactly in the core's form and gains a second field, `ids`, holding the plan's named ids. See the offer contract in section 3. `perform` and `pendingKey` are not edited. |
| D4 | K2 adds `SCANNING_TEXT` = "Scanning", the progress bar's label (plan:1121) | `SCANNING_TEXT = 'Scanning...'` already exists (`NV:156`), the Scan button's label while pending, pinned by `test/js/network-view-ops.test.mjs`. So do `SWEEPING_TEXT`, `CHECKING_TEXT`, `CONFIRMING_TEXT`, `USING_TEXT` | **Code stands.** The bar's label is a NEW constant, `SCAN_BAR_TEXT = 'Scanning'`. The existing pending labels stay as they are. |
| D5 | Panels draw a pending control "disabled" (plan:682) | The core draws it disabled AND relabelled (`Sweeping...`, `Scanning...`, `Checking...`, `Confirming...`, `Using...`, `Unplugging...`) | Code stands. The Terminal's quick command shows the same pending label on its disabled button, so the text test still finds every Panels piece in the Terminal. |
| D6 | K1 adds `findingLabel`, `needLine`, `useResultText` and line functions to `ops-model.js` (plan:518) | `needLine` (`OM:241`), `FIXED_TEXT` (`:187`), `accessTag` (`:338`), `refusalLine` (`:408`), `findingSummary`, `falseReason`, `statusWord`, `classWord`, `severityWord` already exist. `findingLabel` and `useResultText` do not | Add only what is missing (unit 02). Do not re-add or rename an existing export. |
| D7 | The core's `unplugBox` "touches no DOM"; K1's test asserts the scene has no `querySelector('[data-unplug]')` and no `setUnplugNotice` (plan:693, 1419) | Both are still in the scene (`NV:1281`, `:1492`, called at `:1262`, `:1290`) | Plan stands as the target: unit 04 moves both into the Panels renderer. |
| D8 | Five tests copy the scene: `network-view`, `minigame-consoles-fit`, `pc-monitor-frame`, `escaping-shared-helpers`, `network-view-ops` (plan:1437-1439) | Three tests COPY the scene into a temp folder and import it: `test/js/network-view.test.mjs` (list at `:21-38`), `network-view-ops.test.mjs` (`:24-27`), `network-view-techniques.test.mjs` (`:24-27`, not in the plan). `escaping-shared-helpers.test.mjs` (`:69-72`) reads a list of source files that must use the shared escape helper. `minigame-consoles-fit.test.mjs` (`:91`) reads the scene's source by a map. `pc-monitor-frame.test.mjs` names only the stylesheet | See "Harness copy lists" in section 4 for the exact lists. |
| D9 | Eight existing scenarios declare `networks`; the core's ops scenarios are `test_ops_scan`, `test_ops_findings`, `test_ops_access` (plan:1369, 1402) | Also `test_ops_logs` and `test_ops_privilege` (S5a). Four declare `services`: `test_ops_scan`, `test_ops_findings`, `test_ops_access`, `test_ops_privilege` | The new real-identifier rule and the separation test read all four. They must gain NO validator line; if one does, report it, do not edit the scenario or re-record a snapshot. |
| D10 | "The builder also greps the harness for any other place that reads the game id from the end of the URL and makes it ignore a query string" (plan:1709) | The harness is `.claude/skills/playtest-scenario/scripts/playtest-session.js` | **Standing rule wins:** builders never edit `.claude/skills/*`. Unit 07 greps it and REPORTS any such place; the orchestrator decides. |
| D11 | Schema has no `networkView`, no `cli` rows, no `realism` row until K3 | Holds (`scripts/scenario-schema.json` has none) | holds |
| D12 | The core copies `cli` fields and resolves the `realism` link | Holds: `app/models/break_escape/network_ops.rb:27-38` (key lists), `:299-336`, `:708-726`; loader `lib/break_escape/realism_catalog.rb` (163 lines); tests `test/controllers/break_escape/network_cli_fields_test.rb`, `test/lib/realism_catalog_test.rb` | holds; not edited by S6 |
| D13 | `scripts/validate_scenario.rb`: one require and one call beside `check_network_ops` | requires at `:29-30`, calls at `:9123-9124` (`check_privilege` now follows `check_network_ops`) | Add the new require after `:30` and the new call after `:9124`. |
| D14 | `log_rows_for(source_id, compare: true)` | Holds: `app/models/break_escape/ops_log.rb:371` | holds |
| D15 | The UI rules audit reports the network view as not audited | Holds: `tools/playtest/ui-rules-audit.mjs:213-214` | holds |
| D16 | Validator tests go in `test/unit/`, beside `validate_plant_hiding_test.rb` | Holds (the file is there) | holds |
| D17 | The Panels drag mechanism is "whichever the core built" | HTML drag and drop (`dragstart` listener at `NV:434`) | `DRAG_EVENTS` lists the HTML drag events the scene listens for, in order. |
| D18 | The leak collector "gains the `cli` strings" | The scanner's `collect_ops_secrets` (`tools/playtest/lib/access_leak_scanner.rb:2061`) already stages `cli` strings by tag (`listed`, `sweep`, `scan`, `check`) and reads the catalog | No scanner edit is planned. Units 08 and 23 add real-run tests over `test_ops_skin`; if the scanner misses a stage, report it. |
| D19 | The digest lists `/data/be-ops-build` paths | Same files at the same relative paths under `/data/be-ops-skin` | Path change only. |

Not found in the code: the "core's list of early-write fields" that the plan says names `cli` and
`realism` (plan:1823). `scripts/validate_network_ops.rb` has no such refusal; the closed schema is
what refuses both today. Unit 21 opens the schema and that is all.


## 3. Contracts shared by the units

Builders of different units work side by side from these. Do not change one without reporting.

**Folder.** All new browser modules sit in `NVDIR`. Generators sit in `NVDIR/cli-gen/`.

**Skin names.** `gui` (shown as "Panels") and `cli` (shown as "Terminal").

**An offer** is one complete request the view can make now:

```
{ action, target, ids, label, title, command, pending? }
```

- `action`: a key of `CONTROLS`: `sweep`, `scan`, `check`, `confirm`, `use`, `sign-in`, `open`,
  `observe`, `unplug`.
- `target`: exactly what the core's `perform` and `pendingKey` take (D3). For `sign-in`, `open`
  and `observe` it is the row id.
- `ids`: the named ids: `{ networkId }`, `{ hostId }`, `{ hostId, service }`, `{ findingId }`,
  `{ findingId, techniqueId, itemId }`, `{ resourceId }` or `{}`. `itemId` is the one the
  server's `techniques` entry carries (`techniqueItemId` in `OM`), so two cards of one technique
  are one offer.
- `label`: the Panels label (Sweep, Scan, Check, Confirm, Use, Sign in, Open, Look, Unplug). A
  `confirm` offer's label is always Confirm.
- `title`: the control's one-line description from `CONTROLS` (the button's `title`, and the
  `help` text).
- `command`: the Terminal line for it. Unit 03 leaves it `null`; from unit 09 on the scene fills
  it with `commandFor(offer, view)`.
- `pending: true` only while `pendingKey(action, target)` is in the scene's pending set.

**`offers(view, { pending, unplugJack })`** (unit 03) returns every offer open right now, in the
order Panels draws its controls. Pure. A use offer exists for every pair of a held technique and a
listed finding, whatever the finding's status and whether or not it is fixed: neither skin filters,
the server decides.

**The control list** (`CONTROLS` in `view-controls.js`):

| `action` | Drawn on | Label | Verb | Terminal line (`commandFor`) |
|---|---|---|---|---|
| `sweep` | a discovery block not yet swept | Sweep | `sweep` | `nmap -sn <range or network id>` |
| `scan` | an unscanned host row in an `ops` block | Scan | `scan` | `nmap -sV <host id>` |
| `check` | a service tile | Check | `check` | `nmap -sV --script vuln -p <port> <host id>` (with `-sU` before `-p` for a udp service) |
| `confirm` | an unconfirmed finding | Confirm | `confirm` | `msf > use <module>; check` |
| `use` | a held technique and a listed finding | Use | `use` | `msf > use <module>; set TECHNIQUE <technique id>; run` |
| `sign-in` | a host row whose `hostAction` is `sign-in` or `locked` | Sign in | `signin` | `signin <host id>` |
| `open` | a host row with a held session; a share row | Open | `open` | `open <id>` |
| `observe` | any other resource row | Look | `look` | `look <resource id>` |
| `unplug` | the header of a planted box's view | Unplug | `unplug` | `unplug` |

A verb with the kind of its target names exactly one entry (`open` on a host and `open` on a share
are two entries). `LOCAL_ACTIONS` is the list of `data-action` values that only select and send
nothing: `select-finding`, `select-technique`.

**The renderer contract.** A renderer is a class with `mount(root, ctx)`, `render(view, offers)`,
`showResult(offer, answer)`, `noteChange()`, `unmount()` and `testState()`. `ctx` holds
`perform(offer, echo)`, `requestClose()` and `requestSkin(name)`, and nothing else. A renderer:

- imports only the pure modules of `NVDIR`, the escape helper and (Panels only) the helpers the
  scene's drawing already imports;
- never names `fetch`, `ApiClient`, `networkLinks`, `window.open*` or `window.start*`;
- emits no game event (the scene emits all eight);
- is the only code that writes into the view's DOM once mounted. The scene still draws the
  header switch, the "Connecting..." line and the load-error line, which are the same in both skins;
- may keep local state that is part of no offer (a selected finding, a half-typed line). Local
  state ends in one call of `ctx.perform` with one complete offer, or in nothing.

**The scene's dispatcher.** `ctx.perform(offer, echo)` leads to: the core's guarded `perform` for
`sweep`, `scan`, `check`, `confirm`, `use`; `unplugBox()` for `unplug` (which calls the guarded
`perform`, passing the echo through); `act(row, action)` for `sign-in`, `open` and `observe`,
which are not guarded. The core's `perform`, its guard and `pendingKey` are used as built.

**Generator shape** (each file in `cli-gen/`): exports `id`, `started(offer, view)`,
`result(offer, answer, view)` and `TEMPLATES` (a frozen list of every fixed string it can print).
Each returns an array of lines; a line is an array of spans `{ text, cls? }`; `cls` is one of
`prompt`, `head`, `ok`, `bad`, `note`. Pure: no DOM, storage, clock or random source. A generator
imports only `ops-model.js`, `view-texts.js` and `cli-gen/defaults.js`.

**Grammar result** (`parse(line, offers, view, mode)` in `terminal-grammar.js`) is one of:

- `{ kind: 'offer', offer, notes }`: one offer from the current list; `notes` are note lines to
  print before it is sent;
- `{ kind: 'local', name, args, mode? }`: a command that sends nothing and whose output another
  module draws (`help`, `show`, `clear`, `exit`, `panels`, `msfconsole`, `back`, `msf.search`,
  `msf.use`, `msf.info`, `msf.options`, `msf.set`, `msf.unset`, `msf.sessions`, `sweep.listed`);
  `mode` is the new mode when the command changes it;
- `{ kind: 'message', lines }`: an answer that sends nothing (unknown verb, unlisted target,
  ambiguous prefix, a row's status text, the pending line, a line-rule answer).

`mode` is `{ prompt: 'shell' | 'msf', module: <finding id or null>, technique: <id or null> }`.
The grammar imports no generator.


## 4. Constraints, in plain words

- **No exploit content.** Everything here is display text for a simulation. No payload,
  shellcode, working command, real credential, real host or public address anywhere: not in code,
  tests, fixtures, the scenario or the catalog. Products are invented. Do not open any SecGen XML
  or any exploit-detail field guide.
- **Real identifiers live in one place.** Real advisory ids and real framework module paths may
  exist ONLY in `config/break_escape/realism_catalog/*.json`. This stage adds none: the one
  catalog file it creates, `training_fixtures.json`, holds invented text and made-up advisory ids
  with the year `0000`. Scenario files, ink, `PLAYTEST.md`, test fixtures under `test/js/`, docs
  and this brief hold no real advisory id, module path or vulnerability nickname.
- **Catalog ids are append-only.** Once an id is in the committed index
  (`docs/REALISM_CATALOG_INDEX.md`) it is never removed or renamed and its form (which optional
  fields it has, how many advisories and output lines, its module's first segment and number of
  segments) never changes. New ids are only added.
- **Who opens the catalog.** Only unit 20 (the catalog task) reads or writes the catalog file.
  Every other unit, reviewer and playtester reads the index instead. A scenario fixer who meets
  the error "the realism catalog does not validate" leaves it and reports it.
- **No runtime LLMs.** Nothing in the engine, the tools or the tests calls a model. Terminal
  output is produced by pure functions from the server's answer and is pinned by golden files.
- **Event mappings.** A new `eventMappings` entry goes LAST in its list (the server keys them by
  index). Run `ruby tools/check_mapping_index_drift.rb` before reporting any unit that touches a
  scenario.
- **Harness copy lists.** A new static import in an engine JS module goes on every JS test
  harness copy list that copies the importing module. For the scene these are:
  - `test/js/network-view.test.mjs` (its `copy(...)` calls at `:21-38`),
  - `test/js/network-view-ops.test.mjs` (`:24-27`),
  - `test/js/network-view-techniques.test.mjs` (`:24-27`),
  - `test/js/escaping-shared-helpers.test.mjs` (`:69-72`): not a copy list, a list of files that
    must use the shared escape helper; add `network-view-panels.js` to it, since the HTML drawing
    moves there,
  - `test/js/minigame-consoles-fit.test.mjs` (`:91`) and `test/js/pc-monitor-frame.test.mjs`:
    check whether they import the scene after your change; add the modules only if they do.
  Before finishing, grep `test/js` for `network-view-minigame` and for any module you made the
  scene or the test bridge import. The three `cli-gen/` files keep their subfolder in each copy.
  No new module may touch `localStorage` or `window.location` at import.
- **Existing scenarios unchanged.** After any edit to an engine Ruby file or a validator, run
  `bin/ops-golden-compare` with NO outer `flock` (it takes the lock itself; wrapping it deadlocks
  every session). It must pass with no capture and no re-record. `node
  test/js/ops-unchanged-validator.test.mjs` must show no new error, warning or info line for any
  shipped scenario. A diff is a bug to report, never a reason to record again.
- **Existing tests are not edited.** "Must pass unmodified" means the file is not touched at all,
  except to add a module to a copy list.
- **Campaign missions are not edited** (m01 to m10, sis*), nor `.claude/skills/*`, nor any
  scenario other than `test_ops_skin`.
- **Not touched by this stage:** `ui/display-settings.js`, `ui/game-menu.js`, the game page's
  stylesheet list, `config/routes.rb`, any server model or controller, `lib/break_escape/realism_catalog.rb`,
  `test/fixtures/files/ops_refusal_codes.json`, the core's `perform` and `pendingKey`.
- **No skin on the server.** No route reads a `skin` or `net_skin` parameter. `?net_skin=` is
  read by the browser only. Nothing is added to `player_state` or to any sync section.
- **Safe drawing.** The Terminal renderer, the grammar, the format module and every `cli-gen/`
  file never name `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`,
  `new Function`, or a string as the first argument of `setTimeout` or `setInterval`. They build
  elements with `createElement` and set text with `textContent`.
- **Pixel-art UI rules.** 2px borders, no radius, pixel fonts only, no glow, shadow or scanline
  overlay. The Terminal adds no palette and no theme token.
- **UK English**, plain writing, in code comments, messages, docs and commit messages. Commit
  only your own files by explicit path, with no attribution lines. Do not push.
- **Tests.** Rails: `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test <files>` from
  the worktree root. Node: `node test/js/<file>` for your own files, then `bin/test-js` for the
  files named in your unit's proof. Never `ruby -Itest`. Never a database task.


## 5. The build: units, waves and files

One builder and one commit per unit. A builder edits only the files in its list; a needed change
elsewhere is reported. No two units in one wave share a file.

| Wave | Step | Units (side by side) | Waits for |
|---|---|---|---|
| 0 | K1 | 01 fixtures and snapshots | nothing; must be first and alone, before any engine edit |
| 1 | K1 | 02 texts and model exports; 03 control list | 01 |
| 2 | K1 | 04 Panels split | 02, 03 |
| - | K1 | tester: K1 reruns (section 7) | 04 |
| 3 | K2 | 05 skin choice; 06 defaults and shared texts; 07 skin-blind test and `--net-skin`; 08 scenario `test_ops_skin` | 04 |
| 4 | K2 | 09 grammar; 10 scanner generator; 11 framework generator; 12 Scanning bar | 06 (09 to 11), 04 and 06 (12) |
| 5 | K2 | 13 format, log and registry | 09, 10, 11 |
| 6 | K2 | 14 Terminal renderer | 13 |
| 7 | K2 | 15 scene: two skins | 05, 12, 14 |
| 8 | K2 | 16 parity tests; 17 text and hostile tests; 18 test bridge; 19 audit surface | 15 (19 also 08) |
| - | K2 | fix pass on what 16 and 17 find; tester: K2 live proof | 8 |
| 9 | K3 | 20 catalog; 21 schema and bootstrap; 24 authored golden files | K2 landed (20 and 21 touch no K2 file and may start after wave 3 if the orchestrator wants) |
| 10 | K3 | 22 skin validator | 20, 21 |
| 11 | K3 | 23 scenario links and serving tests | 20, 21, 22 |
| - | K3 | tester: beat D1 and the K3 proof | 23, 24 |
| 12 | K4 | 25 live parity runner; 26 docs | 23 |
| - | K4 | tester: the live parity run | 25 |

Files with more than one owner, never in the same wave: `NV` (04, then 15);
`network-view-panels.js` (04, then 12); `view-texts.js` (02, then 06); `CSS` (12, then 14, then
15); `test/js/network-skin-imports.test.mjs` (04, then 15); the scene's copy lists (04, then 15);
`scenarios/test_ops_skin/*` and its two Rails tests (08, then 23); `cli-gen` test files and golden
folders (10 and 11, then 24); `test/js/network-terminal-hostile.test.mjs` (17, then 24);
`docs/test-bridge.md` (18, then 26); `docs/REALISM_CATALOG_INDEX.md` (20, then 23).
`scripts/scenario-schema.json` is edited by unit 21 only and `scripts/validate_scenario.rb` by
unit 22 only. `OM` is edited by unit 02 only.

### K1: the split (no visible change)

#### Unit 01: fixtures and snapshots (first, alone)

- **Files (all new):** `test/js/fixtures/network-view/*.json` (fixture view answers);
  `test/js/fixtures/network-view/panels-before/` (saved DOM and recorded calls per fixture);
  `test/js/fixtures/network-view/unchanged/` (saved DOM per recorded view of the existing
  scenarios); `test/js/support/network-view-harness.mjs` (a shared harness: copy list, jsdom,
  fake `networkLinks`, fake API client and fake openers that record every call, a toast capture);
  `test/js/network-view-panels-same.test.mjs`.
- **Build:**
  - Fixture view answers, each a `GET /network` body as the server sends it. Take the shapes from
    the fixtures the existing tests build inline (`network-view.test.mjs`,
    `network-view-ops.test.mjs`, `network-view-techniques.test.mjs`); copy, do not move: those
    tests are not edited. The set must include: a plain non-ops view; a planted box's view with
    its unplug hint; a discovery block not yet swept; a swept block with scanned and unscanned
    hosts; a service with an unconfirmed, a confirmed, a false and a confirmed-and-`fixed`
    finding; two held techniques, and two cards of one technique; a host held through a technique
    session; an admin session; a locked remote session; a host with remote sign-in off, one with
    no route and one powered down; a locked share, an open share and a resource to look at; a
    block reached through a pivot, and one whose pivot session is locked; findings that arrive
    out of alias order; hosts `web` and `web01`, findings `f1` and `f10`, techniques `phish` and
    `phish_sms` (for the grammar's exact-match cases). Text is invented; ids are plain words.
  - The harness mounts the real scene on a fixture and returns the DOM string and the calls a
    press records.
  - `panels-before/`: for each fixture, the scene's DOM as it is today, and for each pressable
    control the call a press records. Also: the header button while an unplug's answer is held
    (disabled, reading `UNPLUGGING_TEXT`) and after a refused unplug (the server's sentence
    beside the button).
  - `unchanged/`: for every `GET /network` answer in `test/fixtures/files/ops_unchanged/core_*.json`
    (find the network steps in each file's `steps` and their answers in `expected`; find the
    files by listing the folder, so a new one joins without an edit), the scene's DOM.
  - `network-view-panels-same.test.mjs`: renders each fixture through the scene and asserts the
    DOM equals the saved string byte for byte and each press records the saved call. Today it
    passes against itself; after unit 04 it is the proof of the split and must pass UNEDITED.
- **Do NOT:** edit any engine file or any existing test; put a real identifier in a fixture.
- **Done when:** the new test passes; `git status` shows only your files; the snapshots are
  committed on a tree with no engine change.
- **Hand on:** the fixture names with one line each on what they hold, and the harness's exports.

#### Unit 02: texts and model exports

- **Files:** `NVDIR/view-texts.js` (new), `OM`; `test/js/view-texts.test.mjs`,
  `test/js/ops-model-skin-exports.test.mjs` (new).
- **Build:**
  - `view-texts.js`: every fixed text the scene exports today (`NV:118-176`: the status texts,
    the down tags, `sessionKeptText`, `OWN_HEADING`, `STALE_TEXT`, `linkOffText`, the lock
    labels, `lockBadgeLabel`, `UNPLUG_TEXT`, `UNPLUGGING_TEXT`, the ops labels and their pending
    forms, `NO_FINDINGS_TEXT`, `TECHNIQUES_HEADING`, `PICK_HINT_TEXT`, the two grant texts,
    `pickedText`, `NEEDS_HEADING`, `SWEEP_HINT_TEXT`, `SHARE_LOCKED_TEXT`, and any other exported
    text constant there), with identical names and values. The module imports nothing. The scene
    is not edited here: unit 04 makes it import and re-export these.
  - `OM`: add `findingLabel(finding)` (the class and severity words as Panels show them on a
    finding), `useResultText(answer, view)` (the result sentence of a use: a session, a
    credential, `already`), and one function for each line the scene still composes inline from
    answer fields (read `NV:860-1040` and list what you find; the Fixed mark and the admin tag
    already have `FIXED_TEXT` and `accessTag`). Change no existing export and add no entry to
    `REFUSAL_TEXT`.
- **Tests:** every export of `view-texts.js` equals the scene's export of the same name (import
  both); each new `OM` function returns, for every fixture of unit 01, the same text the scene
  draws today (compare with the saved DOM of `panels-before/`); `OM` still imports nothing.
- **Done when:** your tests pass; unmodified `node test/js/ops-model.test.mjs` passes.
- **Hand on:** the names and signatures of the new `OM` exports, and the list of inline lines
  you found, for unit 04.

#### Unit 03: the control list

- **Files:** `NVDIR/view-controls.js` (new); `test/js/network-view-controls.test.mjs` (new).
- **Build:** `CONTROLS`, `LOCAL_ACTIONS` and `offers(view, { pending, unplugJack })` as section 3
  gives them. The conditions for "Drawn on" are the ones the scene and the core use today. The
  pure row helpers the scene exports (`hostAction`, `resourceAction`, `downState`,
  `shareLockable`, `displayOrder`) are needed here and a pure module cannot import the scene, so
  define them in this file with the same names and bodies; unit 04 then removes the scene's
  copies and re-exports these. Use `OM`'s `offersSweep`, `offersScan`, `offersCheck`,
  `offersConfirm`, `rowServices`, `rowFindings`, `techniqueList`, `techniqueItemId`,
  `checkTarget`, `useTarget` and `pendingKey`; do not rewrite them. A host row whose action is
  `locked` yields a `sign-in` offer (the lock badge is a status, not a control). `command` is
  `null` here.
- **Tests:** for each fixture: the order (equal to the order of the controls in the saved DOM),
  targets and `ids`; one offer per pressable control; every use pair; one offer for two cards of
  one technique, with the server's `itemId`; a locked remote session yields `sign-in`; an
  unconfirmed finding yields a `confirm` offer labelled Confirm and a settled one yields none;
  with a key in the pending set only the offer under it carries `pending: true`, and each use
  pair has its own key; `CONTROLS` is well formed (one label, one verb, one description each; a
  verb with a target kind names exactly one entry); the helpers defined here answer the same as
  the scene's exports for every fixture row.
- **Done when:** your test passes; the module imports only `ops-model.js` and `view-texts.js`
  (if unit 02 is not in yet, say so; do not copy texts).
- **Hand on:** the exact export list.

#### Unit 04: the Panels split

- **Files:** `NVDIR/network-view-panels.js` (new), `NV`; the copy lists of section 4;
  `test/js/network-skin-imports.test.mjs` (new).
- **Build:**
  - Move the HTML drawing out of the scene into a `PanelsRenderer` class with the renderer
    contract of section 3. Its `data-*` hooks, class names and markup are unchanged, byte for
    byte. It takes each button from the offers list (label, pending state) and calls the unit 02
    exports for every composed line. It exports `DRAG_EVENTS`, the names of the drag events it
    listens for, in order.
  - The unplug button's DOM work (`setUnplugNotice`, the `querySelector('[data-unplug]')`
    refocus) moves into the renderer; `unplugBox` then touches no DOM and a refused or failed
    unplug reaches the renderer through `showResult`.
  - The scene keeps: load, refetch, the handlers (`act`, `unplugBox`, the core's calls), every
    event, the way back, the test snapshot, `perform` with its guard, and the two pre-mount lines.
    It mounts the Panels renderer, hands it `ctx`, and calls `render(view, offers(...))` wherever
    it redraws today. It imports the texts from `view-texts.js` and the row helpers from
    `view-controls.js` and re-exports every name it exported before, so existing tests see no
    change.
  - `getTestState()` returns exactly today's fields and selector values.
- **Do NOT:** change what a press sends; change `perform`, the guard or `pendingKey`; add the
  switch, the bar or any Terminal code; edit an existing assertion.
- **Tests (`network-skin-imports.test.mjs`):** the renderer and the pure modules import nothing
  outside the allowed list and do not contain `fetch(`, `ApiClient`, `networkLinks`,
  `window.open` or `window.start`; every `data-action` literal in `network-view-panels.js` is a
  key of `CONTROLS` or an entry of `LOCAL_ACTIONS`, none is in both, and `data-unplug` appears
  once; the scene's source holds no `querySelector('[data-unplug]')` and no `setUnplugNotice`.
- **Done when:** unit 01's `network-view-panels-same.test.mjs` passes UNEDITED; `bin/test-js`
  passes whole with no assertion edited (only copy lists gained files); state the count.
- **Hand on:** the renderer's class name and constructor, what `ctx` the scene passes, and the
  copy lists you touched.

### K2: the Terminal

#### Unit 05: skin choice

- **Files:** `NVDIR/skin-choice.js`, `test/js/network-skin-choice.test.mjs` (new).
- **Build:** `chooseSkin({ hasOps, pressed, urlValue, stored, scenarioDefault })`, pure. A view
  with no ops block is `gui`, whatever else is set. Otherwise the first that applies: a press of
  the switch on this page; `?net_skin=gui|cli` in the page URL; the player's stored pick; the
  scenario's `networkView.defaultSkin`; `gui`. `readPick(storage)` and `writePick(storage, name)`
  use the key `be_network_skin` with value `gui` or `cli`; any other stored value is ignored;
  blocked storage (an accessor that throws) is caught. `readUrlValue(search)` parses the query.
  `rememberPress(name, { urlValue, storage })` records the press in a module variable and writes
  the pick only when no URL value is present, so a preview link never changes a saved pick.
  Storage and the URL are read only inside these functions, never at import.
- **Tests:** the order, case by case: a press beats a URL value; a URL value beats a stored pick
  and is not written; a press with a URL value present changes the skin and writes nothing; a
  press with no URL value is stored; a bad stored value is ignored; storage that throws still
  switches; no ops block gives `gui` under every combination; importing the module touches no
  global.
- **Done when:** your test passes.

#### Unit 06: defaults and shared texts

- **Files:** `NVDIR/cli-gen/defaults.js` (new), `NVDIR/view-texts.js`;
  `test/js/cli-gen-defaults.test.mjs` (new).
- **Build:**
  - `view-texts.js` gains `SCAN_BAR_TEXT = 'Scanning'` (D4), `REQUEST_FAILED_TEXT = 'No reply came
    back. Nothing finished.'`, and `SKIN_LABELS = { gui: 'Panels', cli: 'Terminal' }`. Nothing
    existing changes.
  - `defaults.js`, pure, importing only `ops-model.js`: `serviceCli(service)` returns
    `{ protocol, service, banner? }` from the service's `cli` or the defaults (`tcp`; the
    service's `name`; no banner); `findingCli(finding, service)` returns
    `{ title, module, script, advisories?, output? }` from the finding's `cli` or the defaults:
    title = the finding label words and the service's label or name; module =
    `auxiliary/scanner/<service word with - as _>/<class>_<alias>`; script =
    `<service word>-<class with _ as ->`; no advisories and no output. `hostTarget(row)` returns
    the row's `address` or its id. `rangeSize(cidr)` returns the number of addresses from the
    prefix. A served field is used as it is; a default is built only for a missing field.
- **Tests:** each default for a finding and a service with no `cli`; a served field wins field by
  field; a decoy and a weakness with no `cli` get defaults of the same form; `rangeSize` for /24
  and /30; the functions are pure (equal output on a second call) and read no global.
- **Done when:** your test passes; unmodified `node test/js/view-texts.test.mjs` passes.

#### Unit 07: the skin-blind test and `--net-skin`

- **Files:** `test/controllers/break_escape/network_skin_blind_test.rb` (new),
  `tools/playtest/session-start.sh`, `tools/playtest/lib/session-args.sh` (new),
  `test/js/session-start-net-skin.test.mjs` (new).
- **Build:**
  - The Rails test: each network and ops route (`GET /network`, `POST /network/scan` for a sweep
    and for a host scan, `/network/check`, `/network/confirm`, `/network/technique`,
    `/network/unplug`) gives the same answer and writes the same state with and without a `skin`
    and a `net_skin` parameter, on an existing ops scenario (`test_ops_access` has every route).
  - `session-start.sh` gains `--net-skin gui|cli`. The session tag is taken from the `--url`
    value exactly as now; then the option is removed from the arguments and `net_skin=<value>` is
    appended to the URL handed to the harness (`?`, or `&` when the URL already has a query). Put
    the tag and URL logic in `session-args.sh`, sourced by the script, so it can be tested without
    starting a browser. Any other value of the option is an error.
  - Grep the harness `.claude/skills/playtest-scenario/scripts/playtest-session.js` for a place
    that reads the game id from the end of the URL. Do NOT edit it (D10): report file and line.
- **Tests:** the node test runs `bash` on `session-args.sh`: the tag is the same with and without
  the option, with and without a query string; the URL gains the value with the right separator;
  a bad value fails.
- **Done when:** both tests pass; `bin/ops-golden-compare` passes.

#### Unit 08: the feature scenario `test_ops_skin`

- **Files (new):** `scenarios/test_ops_skin/` (`scenario.json.erb`, `mission.json`,
  `PLAYTEST.md`, any `ink/`, the generated `dungeon_graph.*`);
  `test/controllers/break_escape/ops_skin_scenario_test.rb`;
  `test/controllers/break_escape/access_leak_scanner_ops_skin_real_test.rb`.
- **Read:** `scenarios/test_ops_access/` (scenario and `PLAYTEST.md`) and
  `scenarios/test_ops_findings/` as models; the shared brief's rules on games and
  `swap-scenario-game.rb`.
- **Build:** a small scenario: one office network marked for discovery; a jack and a drop box;
  two sign-in hosts, one with a path to a held session and one with remote sign-in off; a file
  server with one service that has two real weaknesses and one decoy; two technique cards for
  different techniques; an open share and a printer to look at. The first weakness grants a
  session and the second a credential. One log source takes the core's network events. NO
  `networkView`, `cli` or `realism` field yet (the schema refuses them until unit 21). Products
  invented; no real tool, advisory or product name anywhere in the folder. Objectives and hints
  follow rule 3 (name the action and the target, never a control). Validator clean (state every
  warning), graph generated.
- **`PLAYTEST.md`:** the beats of section 7, each naming actions, with what the player sees in
  each skin and what `verify-run.rb` should print. No hand-built or forged request.
- **Tests:** `ops_skin_scenario_test.rb` plays T1 to T9 through the real routes on the real file
  and asserts the answers and the server record (footholds, sessions, `opsDiscovered`,
  `opsFindings`, `opsUsed`, keyring, log rows). The scanner test runs the leak scanner over that
  real run and expects nothing reported.
- **Do NOT:** edit any other scenario; seed a Mission row.
- **Done when:** both tests pass; `ruby scripts/validate_scenario.rb
  scenarios/test_ops_skin/scenario.json.erb` is clean; `ruby tools/check_mapping_index_drift.rb`
  passes; `bin/ops-golden-compare` passes; `node test/js/ops-unchanged-validator.test.mjs` shows
  no change for any other scenario (if the snapshot must gain the new scenario's own entry,
  report the exact diff and stop).
- **Hand on:** the game-making command, the ids of the network, hosts, service, findings' aliases
  and cards, for the tester and for units 19, 23 and 25.

#### Unit 09: the grammar

- **Files:** `NVDIR/terminal-grammar.js`, `test/js/network-terminal-grammar.test.mjs` (new).
- **Build:** pure; imports `ops-model.js`, `view-texts.js`, `view-controls.js`,
  `cli-gen/defaults.js`. Exports `parse(line, offers, view, mode)` (section 3),
  `complete(line, offers, view, mode)`, `commandFor(offer, view)`, `helpFor(verb, mode)`, and
  `GRAMMAR_TEXT`, a frozen list of every fixed answer and note it can return.
  - **Resolves only to the current list.** A line that names anything not in `offers` sends
    nothing. A finding is typed by the alias the server gave (`f1`, `f2`), resolved with `OM`'s
    `findFinding`; the built finding id is never accepted and never printed.
  - **Verbs:** one per control (`sweep`, `scan`, `check`, `confirm`, `use`, `signin`, `open`,
    `look`, `unplug`) and five local ones (`help [verb]`, `show`, `clear`, `exit`, `panels`).
    Aliases, each to one verb: `login` and `connect` to `signin`; `ls` to `show`; `run` to `use`
    (shell mode); `quit` to `exit`.
  - **Operand sets:** `sweep`: one network id or range, or none when exactly one block offers a
    sweep; `scan`, `signin`, `open`, `look`: one host, share or resource id (a host may be named
    by its address); `check <host> <service name or port>`; `confirm <alias>`;
    `use <technique> on <alias>` (`on` optional); `unplug`: none. More operands than the set
    answers `One target at a time in this simulation.`
  - **Line rules, both modes:** `;` splits a line into commands run in order; a line whose
    commands would send more than one request answers `One action at a time.` and runs none; a
    local command that fails stops the rest; a token `|`, `>`, `>>` or `<` answers `Pipes and
    redirects are not part of this simulation.`; an empty line does nothing.
  - **Forgiving:** case and extra spaces are ignored; a verb, id, alias or technique id may be
    shortened to a prefix unique among what is on offer; an exact match always beats a prefix
    (`web` beside `web01`, `f1` beside `f10`); addresses and ranges match exactly only.
  - **Answers that send nothing:** unknown verb: the nearest verb; ambiguous prefix: the matches;
    a target the view lists but with no offer for that verb (remote sign-in off, no route,
    powered down, a locked share, a settled finding): that row's status text, the same sentence
    Panels shows; a target the view does not list: the list of what that verb can be used on,
    the same answer whether or not the id exists elsewhere; a pending offer: `Still waiting for
    the last answer.`; two offers matching one line (only in a hand-built fixture): both listed.
  - **A block with no sweep on offer** (an open network, a swept block, a non-ops block):
    `sweep` or the scanner's sweep form naming it returns `{ kind: 'local', name: 'sweep.listed' }`
    with the block; unit 13 prints its host lines and the note `Every host here is already listed.`
  - **The scanner form (shell mode):** `nmap [flags] <target>`. A network id or its range gives
    the sweep. A host id or its address gives the scan with no `--script` and the check with
    `--script <anything>`; the check's service is the one whose port `-p` names; with no `-p` and
    one checkable service, that one; with more, the answer `Name a port with -p:` and the ports.
    Value flags (their value is never the target): `-p`, `--script`, `-oN`, `-oX`, `-oG`, `-oA`,
    `--top-ports`, `--min-rate`, `--max-retries`, `-e`. Known flags, accepted silently: `-sS`,
    `-sT`, `-sU`, `-sV`, `-sC`, `-A`, `-O`, `-Pn`, `-n`, `-v`, `-vv`, `-T0` to `-T5`, `-sn`. Any
    other flag gives one note, `Ignored in this simulation: <flag>`, and the line still runs.
    `-iL` answers `Reading targets from a file is not part of this simulation.` `-sn` on a host
    answers `-sn only finds hosts. Use nmap -sV <host> to list its services.` A network target
    with `-sV`, `-sS`, `-sT` or `-A` gives the note `Versions are listed per host: nmap -sV
    <host>.` and the sweep. `-p` on a version scan gives the note `The version scan lists every
    service here; -p is ignored.` and the full scan. When `-sU` and the service's protocol
    disagree, the check still goes to that service with the note `<port> is a <protocol> port
    here.` Flags change nothing that is sent.
  - **The framework form (framework mode):** `msfconsole` enters it; `back` clears the module;
    `exit` and `quit` leave it. `search [word]`, `use <module, alias or search number>`, `info`,
    `show options`, `set TECHNIQUE <id>` (a held id or a unique prefix), `unset TECHNIQUE`,
    `sessions` are local. `check` resolves only to the `confirm` offer of the selected module's
    finding; `run` or `exploit` only to the `use` offer for that finding and the set technique.
    With `TECHNIQUE` unset, `run` answers `Set TECHNIQUE first. Held: <ids>`. With no module,
    `check`, `run`, `exploit`, `info` and `show options` answer `Select a module first: use
    <module>`. `set` of `RHOSTS` or `RPORT` answers `RHOSTS and RPORT come from the module in this
    simulation.`; `set` of any other name answers `No such option in this simulation.` `show`
    followed by anything but `options` answers `Not part of this simulation.` A module is a
    finding, named by `findingCli(...).module`.
  - **Mode words:** a line beginning `$` is read in shell mode with the mark dropped; one
    beginning `msf >` or `msf (<module>) >` is read as a framework line against a module
    selection local to that line. That is how a `commandFor` line parses back.
  - **`help`:** each verb with the description from `CONTROLS`; in framework mode the framework's
    commands; `help nmap` lists the accepted flags and target forms. `check` has two meanings and
    `help` in each mode says which.
  - **`complete`:** the token under the cursor to the longest common prefix, and the matches.
- **Tests:** one case for each rule and each quoted answer above, in both modes where the rule
  applies; a fixture whose findings arrive out of alias order still resolves `f1` to the
  server's `f1`; every scanner-form line gives the same offer as the game verb for that target;
  `check` and `run` give the same offers as `confirm f2` and `use <card> on f2`; **round trip**:
  for every offer of every fixture, `parse(commandFor(offer))` returns exactly that offer, in
  both modes and with the leading prompt mark; a hand-built fixture with two services on one
  port, one address on two hosts, or a network id equal to a host id returns the both-matches
  answer and no offer; hostile input (markup, control characters, a 10,000 character line)
  returns no offer and never throws; a typed line never yields an offer that is not in the list.
- **Done when:** your test passes.
- **Hand on:** the exact `local` names and their `args`, for units 13 and 14.

#### Unit 10: the scanner generator

- **Files:** `NVDIR/cli-gen/scanner-output.js`, `test/js/cli-gen-scanner.test.mjs`,
  `test/js/fixtures/network-view/cli-golden/scanner/` (new).
- **Build:** the generator shape of section 3, for `sweep`, `scan` and `check`. `<host>` is the
  host id; `(<address>)` is printed only when the row has an address.
  - `started`: `Starting Nmap against <target>` (the range or network id for a sweep, the host
    for a scan or check); a check adds `Running vuln scripts on <port>/<protocol> (<service
    word>)`. Uses only ids and labels of the offer's own target as the view lists it.
  - Sweep result: for each host row of the answer, in order: `Nmap scan report for <host>
    (<address>)`, `Host is up.` (or `Host seems down.` for a row whose Panels status is a down
    state, not counted as up), then one line per Panels field of the row (name, shown hostname
    where it differs, status text, the "Session kept" line, the account and admin tag), each its
    own span. Ends `Nmap done: <N> IP addresses (<n> hosts up) scanned` with a range, or `Nmap
    done: <n> hosts up` without one; singulars for 1.
  - Version scan result: the report line, `Host is up.`, the header `PORT STATE SERVICE
    VERSION`, one row per service (`<port>/<protocol>`, `open`, the service word, `<product>
    <version>`), under each row `| id: <name>` (with `(<label>)` where it differs) and
    `|_banner: <banner>` when there is one; the last line under a row starts `|_`. Ends `Service
    detection performed.` and `Nmap done: 1 IP address (1 host up) scanned`.
  - Script scan result (a check): the report line, `Host is up.`, the header `PORT STATE
    SERVICE` and the service's row, then per finding: `| <script>:`, `|   <title>`, the `|
    IDs: <scheme>:<id> ...` line when the finding has advisories, one `|     <line>` per output
    line, then `|     Finding: <alias>`, `|     State: <status word>`, `|     Risk: <finding
    label>`, `|_    <summary>`. Prefixes and each Panels piece are separate spans. An empty check
    prints `NO_FINDINGS_TEXT` as a note. Ends with the `Nmap done:` line.
  - A refusal prints the `REFUSAL_TEXT` words; `answer === null` prints `REQUEST_FAILED_TEXT`;
    neither prints a table.
  - Nothing else: no timestamps, latencies, MAC addresses, OS guesses, closed-port counts or
    filler rows. No template holds "(simulated)".
- **Tests:** golden files, one per fixture and step, named `<fixture>.<step>.txt` (spans joined,
  each `cls` in brackets), with no `cli` fields (the defaults). Cases: a range of /24 and /30; no
  range; singulars; a down host; a service with and without a banner; an empty check; findings
  out of alias order; a refusal; a null answer; called twice, equal lines.
- **Done when:** your test passes and the golden files are committed.

#### Unit 11: the framework generator

- **Files:** `NVDIR/cli-gen/framework-console.js`, `test/js/cli-gen-framework.test.mjs`,
  `test/js/fixtures/network-view/cli-golden/framework/` (new).
- **Build:** the generator shape, for `confirm` and `use`, plus local listings, each a pure
  function of the view (and the mode where noted): `banner()` (`Metasploit Framework console`,
  `Type help for the console's commands.`), `search(view, word)`, `info(view, mode)`,
  `showOptions(view, mode)`, `sessions(view)`, `promptMark(mode, view)`.
  - `search`: a numbered table `#  Name  Alias  Description` of the modules whose path, title,
    alias, host or service holds the word (all with no word), in the view's finding order.
    Weaknesses and decoys are listed alike.
  - `info`: the module's path and title, its target (`<host> (<address>)`, port, service word), a
    `References:` list of advisory ids when there are any (ids only, no links), and the
    finding's alias, status, label and summary as Panels show them.
  - `showOptions`: a table `Name  Current Setting  Required  Description` with EXACTLY three
    rows, `RHOSTS`, `RPORT`, `TECHNIQUE`, then the held techniques by id and name.
  - `sessions`: one row per held session: host, account and the admin tag, from the same `OM`
    exports Panels use.
  - `started`: `[*] Checking <host>:<port>` (confirm); `[*] Trying <technique id> against
    <host>:<port>` (use). `<host>` is the address where the row has one.
  - Results: confirmed: `[+] <host>:<port> - The target appears to be vulnerable.` then alias,
    status, each need's label with "yes" or "no", and the Fixed mark, one span per piece. False:
    `[-] <host>:<port> - The target is not vulnerable.` then alias, status and the `falseBecause`
    text. Use, session: `[*] Session opened on <host> as <account>` with the admin tag where
    Panels draw it, then `useResultText` as its own span. Use, credential and `already`: `[+]`
    then the result sentence. Refusal: `[-]` then the `REFUSAL_TEXT` words (with the need's label
    for `need_unmet`). Null answer: `REQUEST_FAILED_TEXT`.
- **Tests:** golden files for `search` with and without a word, `info`, `show options`,
  `sessions`, and the `started` and `result` lines of a confirmed, a false and a refused confirm
  and of each use outcome (session, credential, `already`, each code in
  `test/fixtures/files/ops_refusal_codes.json`, read not copied), all on defaults. `show options`
  names exactly the three options. A decoy and a weakness on defaults print the same lines in
  `search`, `info` and `use` before a confirm, other than their own fields.
- **Done when:** your test passes and the golden files are committed.

#### Unit 12: the Scanning bar

- **Files:** `NVDIR/network-view-panels.js`, `CSS`; `test/js/network-view-panels.test.mjs` (new).
- **Build:** while a `sweep` offer is pending the block row, and while a `scan` offer is pending
  the host row, shows a progress bar labelled `SCAN_BAR_TEXT`, removed when the request ends by
  an answer, a refusal or a failure. No bar for a pending check, confirm, use or unplug. The bar
  has `role="progressbar"` with no value; the row carries `aria-busy="true"`. CSS: a 2px border,
  square ends, no radius, the GNF pixel font, an indeterminate fill of stepped segments
  (`steps()` timing, no easing), no new colour; under `@media (prefers-reduced-motion: reduce)`
  the bar is static (`animation: none`, a fixed striped fill). In `showResult`, a null answer
  draws `REQUEST_FAILED_TEXT` as the notice on the control's row; a failed unplug keeps the
  existing unplug sentence as the header notice.
- **Tests:** the bar on the right row for each of the two offers and on no other; removed on an
  answer, a refusal and a null answer, each its own case; role and `aria-busy`; the label; the
  failure notice; CSS-text assertions for the reduced-motion block, the 2px border and no radius.
- **Done when:** your test passes; `network-view-panels-same.test.mjs` passes UNEDITED (its
  fixtures have nothing pending, so the saved DOM must not move); unmodified
  `network-view-ops.test.mjs` passes.

#### Unit 13: format, log and registry

- **Files:** `NVDIR/terminal-format.js`, `NVDIR/cli-gen/registry.js`;
  `test/js/network-terminal-format.test.mjs`, `test/js/cli-gen-provenance.test.mjs` (new).
- **Build:**
  - `registry.js`: `GENERATORS`, a frozen map: `sweep`, `scan`, `check` to the scanner;
    `confirm`, `use` to the framework. `generatorFor(action)`.
  - `terminal-format.js`, pure: the trip's logs in a module map keyed by foothold id;
    `logFor(footholdId, { create })`, `dropLog(footholdId)`; the log helper `appendLine(log,
    spans)`, which caps the log at 300 lines (oldest dropped) and replaces each control character
    (U+0000 to U+001F, U+007F to U+009F), U+2028, U+2029 and the bidirectional controls (U+202A
    to U+202E, U+2066 to U+2069) with U+FFFD in every span's text.
  - `recordSent(log, offer, echo, view)`: writes the echo line (`echo ?? commandFor(offer,
    view)`), then, for an action with a registry entry, the generator's `started` lines. The
    first `recordSent` of a trip creates the log, which from creation holds the opening line
    `Type help, or pick a command below.`
  - `recordResult(log, offer, answer, view)`: writes the generator's `result` lines, or for an
    action with no entry the plain layout. A refusal writes its words; a null answer writes
    `REQUEST_FAILED_TEXT`, except a failed unplug, which writes the unplug sentence. Both
    functions do nothing when the foothold's log is gone.
  - Plain layouts: `formatListing(view)` for `show` (link lines: the view's message, the link-off
    and stale sentences, the unplug hint, each block's heading with its "through <host>" note and
    "(Locked)" mark; the host table `HOST NAME STATUS`; the service table `SERVICE PORT PRODUCT
    VERSION` for a scanned host; the findings list for a checked service; the finding detail for
    a settled finding; the technique table `TECHNIQUE WORKS ON`; the share and resource table);
    the Look layout (observations and notice); `localLines(result, view, mode)` for each grammar
    `local` name, calling the framework generator's listings; `sweepListed(block, view)`.
    Every Panels sentence (a status text, an alias, a status word, a need's "yes" or "no", the
    `falseBecause` text, the Fixed mark, the admin tag, refusal words) is its own span.
  - `TERMINAL_ONLY_TEXT`, exported: everything the Terminal prints that Panels never shows: the
    opening line, the prompt marks and cursor and the prompt's label, the strip label
    `Commands:`, the change line `-- network changed. show lists it again --`, the pending line,
    the line-rule answers, each generator's `TEMPLATES`, the table headers, the `help` output,
    and `GRAMMAR_TEXT`. `REQUEST_FAILED_TEXT`, aliases, state words and result sentences are NOT
    on it: they are shared with Panels.
- **Tests:** *format:* one layout per answer shape (sweep, scan, check, confirm, the three use
  outcomes, `already`, each refusal code); `recordSent` writes the echo then `started`, before
  any answer; `recordResult` writes the result once, directly after; a refusal and a null answer
  write their line and no table; a failed unplug writes the unplug sentence; an action with no
  registry entry writes the echo only; a late call after `dropLog` writes nothing and creates no
  log; the cap and the opening line; control characters become U+FFFD and add no line.
  *provenance:* over every fixture and every generator call, each span is a `TEMPLATES` entry
  with its slots filled, a field of the answer, the view or a served `cli` object, a default of
  unit 06, or a count computed from them; marker fixtures (a unique string in each field) show
  each only where that field is printed; the registry maps exactly the five actions; each `cls`
  is one of the five; no template or line holds the word `simulated` except the listed "in this
  simulation" answers.
- **Done when:** both tests pass.
- **Hand on:** the exports, for units 14 and 15.

#### Unit 14: the Terminal renderer

- **Files:** `NVDIR/network-view-terminal.js`, `CSS` (Terminal rules, appended);
  `test/js/network-terminal-renderer.test.mjs` (new).
- **Build:** a `TerminalRenderer` with the renderer contract.
  - **Log:** `role="log"`, `aria-live="polite"`, drawn from the foothold's log. A table line
    holds one `<span>` per cell, padded with CSS, never with spaces. Lines appear at once (no
    typing effect).
  - **Prompt:** one `<input type="text">` with a visible label, `autocomplete="off"`,
    `autocapitalize="off"`, `spellcheck="false"`. Enter parses the line: an offer goes to
    `ctx.perform(offer, <the typed line>)` after its notes are logged; a local or message result
    is logged by the renderer (echo then reply) through the log helper. Up and down walk a
    20-entry history. Enter on an empty prompt does nothing. Tab completes while the prompt holds
    text: the input carries `data-own-tab-cycle` only while it is not empty.
  - **Quick commands:** one button per offer for every control but `use`, in `offers()` order.
    Each holds the Panels label in a `<span>` (`Open (<who>)` where Panels has it) and its
    `command` in a `<code>`, the same `title`, the same row attribute and `data-action` value as
    the Panels control (Unplug carries `data-unplug`), so one selector finds one button in either
    skin. A press calls `ctx.perform(offer, offer.command)`. A pending offer's button is disabled
    and shows the Panels pending label (D5).
  - **Quick commands for a use:** one button per held technique (the Use label and the
    technique's name); pressing it writes `use <technique id> on ` into the prompt and swaps the
    strip for one button per listed finding, labelled with its alias; pressing a finding performs
    the offer with its `command` as the echo. An X on that strip returns to the full list.
  - **Folding:** the strip starts open and folds with one press, by the `hidden` attribute only.
  - **Mode:** the prompt mode, the selected module and `TECHNIQUE` are local state, dropped on
    unmount. `exit` calls `ctx.requestClose()`; `panels` calls `ctx.requestSkin('gui')`.
  - **`showResult`:** a redraw and scroll; it writes NO log line (the scene's hooks did).
  - **`noteChange()`:** appends the change line; the log is never redrawn from scratch.
  - **Input and phones:** `mount` calls `window.pauseKeyboardInput?.()`; focus goes to the prompt
    after a command and after mounting; the prompt is kept in view with `scrollIntoView` on focus
    and after each result; nothing reads the visual viewport. Under 600px the strip sits below
    the log.
  - **CSS:** the log and prompt in VT323 at 16px; quick commands keep the `.minigame-button`
    look; a solid block cursor; span classes `prompt`, `head`, `ok`, `bad`, `note` mapped to
    colours the view already uses; no shadow, glow or overlay; a pixel scrollbar.
  - **`testState()`:** `{ skin: 'cli', log: <lines>, folded, mode }`.
- **Tests:** a typed line that resolves calls `perform` once with the offer and the typed echo;
  a local line, a typo and a pending line call nothing and log echo and reply; each quick command
  calls `perform` with its offer and `command`; the two-press use; the first press alone calls
  nothing; hooks and `title` equal the Panels control's for every fixture offer; a pending button
  is disabled with the pending label; folding uses `hidden`; history; the Tab attribute comes and
  goes with the text; `showResult` adds no log line; mount pauses game keys; unmount drops the mode.
- **Done when:** your test passes; `node test/js/network-skin-imports.test.mjs` still passes.

#### Unit 15: the scene with two skins

- **Files:** `NV`, `CSS` (the switch's rule, only if one is needed); the copy lists of section 4;
  `test/js/network-skin-imports.test.mjs` (extend); `test/js/network-skin-switch.test.mjs`,
  `test/js/network-skin-unchanged.test.mjs` (new).
- **Build:**
  - The starter (`startNetworkViewMinigame`) works out the starting skin with `chooseSkin` (the
    scenario default read from `window.gameScenario?.networkView?.defaultSkin`) and passes it to
    the scene. The scene mounts the renderer for that skin; a view with no ops block always
    mounts Panels and never constructs the Terminal renderer.
  - The header switch: a button marked `data-skin-switch`, labelled with the OTHER skin's name
    from `SKIN_LABELS`, in the same place in both skins, drawn only while some block of the view
    carries `ops: true` and removed when a refetch leaves none (the view then falls back to
    Panels). `ctx.requestSkin(name)` calls `rememberPress`, unmounts one renderer and mounts the
    other on the same rows. No request is sent, the refetch timer keeps running, the trip is not
    ended, and the pending set carries across.
  - Hooks: `this.onSent = (offer, echo) => recordSent(log, offer, echo, view)` and `this.onEnded
    = (offer, answer) => recordResult(log, offer, answer, view)`, set for every ops view whether
    or not the Terminal is mounted, so the log is complete in every order of switches. For the
    unguarded actions the dispatcher calls `recordSent` itself, and `recordResult` for `observe`.
    The log is dropped when the trip ends.
  - Offers now carry `command` (`commandFor`). A refetch that changes the rows calls the mounted
    renderer's `noteChange()`.
  - `getTestState()` gains `skin` on a view with an ops block ONLY; a view with none returns
    exactly today's fields. In the Terminal, `selectedFinding` is null and each selector resolves
    to the quick-command button.
- **Do NOT:** change `perform`, the guard, any request, any event or the pre-mount lines.
- **Tests:** *switch:* the switch is drawn only with an ops block and removed when a refetch has
  none; a press records no call and emits no event; the log survives a switch and a return from
  the sign-in screen and is gone after the trip ends; a Panels press writes the offer's
  `commandFor` echo into the log. *unchanged:* every DOM saved in `unchanged/` by unit 01,
  rendered with a stored pick of `cli`, a `?net_skin=cli` value and a scenario default of `cli`
  all set at once, equals the snapshot byte for byte, has no `[data-skin-switch]`, and the
  Terminal renderer was never constructed. *imports:* extend the K1 file to the `cli-gen/` files
  (each imports only `ops-model.js`, `view-texts.js` and `defaults.js`, and none names `Date`,
  `performance.now`, `Math.random`, `crypto`, `localStorage`, `document` or `window`) and to the
  forbidden names of "Safe drawing" in section 4 over the Terminal renderer, grammar, format and
  `cli-gen/` files.
- **Done when:** your tests pass; `network-view-panels-same.test.mjs` passes UNEDITED;
  `bin/test-js` passes whole with no existing assertion edited; state the count.
- **Hand on:** how a test sets the skin, and the copy lists touched.

#### Unit 16: parity tests

- **Files:** `test/js/network-skin-parity.test.mjs` (new). Test-only: a failure caused by an
  engine file is REPORTED with file and line, not fixed here.
- **Build:** over every fixture in the fixtures folder, with the unit 01 harness. The paths:
  `button` (Panels: a `[data-action]` button or `[data-unplug]`), `select` (Panels: select a
  finding, select a card, press Use, once by pointer and once by keyboard), `drag` (Panels:
  dispatch `DRAG_EVENTS` in order), `typed` (Terminal: a line and Enter), `quick` (Terminal: a
  quick command; two presses for a use). `PATHS` in the test lists them.
  1. Every Panels press or gesture records exactly one call, the call of one offer in the list;
     a control that records a call no offer explains fails.
  2. For each offer not pending, every path that can produce it does, and the recorded call is
     deep-equal across paths: same function, arguments and body.
  3. Every verb against every accepted token, and every quick command, records exactly one call
     of a listed offer or records nothing and prints a message; the scanner form and the
     framework form record the same call as the game verb.
  4. Use pairs: two techniques and four findings (unconfirmed, confirmed, false, fixed): all
     eight pairs by all four use paths, each sending that pair's `finding_id` and `item_id`; two
     cards of one technique are one offer.
  5. For each code in `ops_refusal_codes.json` (read, not copied), both skins show the same
     sentence and neither sends a second request.
  6. A typed line naming a host, finding or card from another fixture, an unlisted id, or a
     finding not yet checked records no call.
  7. One scripted sequence run once per skin emits deep-equal events, all eight, with their
     `<name>:<id>` forms and payloads.
  8. A switch mid-sequence records no call and emits no event; a selection is not carried across.
  10. One press, one request: with the answer held, a second click, a second Use, a repeat drag,
     a second Enter, a second quick press and the other path each record no second call; the same
     across a switch; when the answer resolves the mounted skin's `showResult` receives it once;
     an offer under a different key still sends; run for sweep, scan, check, confirm, use, unplug.
  11. Switch orders, each with the `started` lines counted once and a table, refusal words or
     failure line at the end: press in Terminal, switch to Panels, back while pending; press in
     Terminal, switch, answer lands in Panels, back; press in Panels, switch to Terminal while
     pending, answer lands. A mount, redraw or refetch while pending adds no line; a rejected
     press writes nothing.
- **Done when:** the file passes, or every failure is reported with its cause.

#### Unit 17: text and hostile tests

- **Files:** `test/js/network-skin-text.test.mjs`, `test/js/network-terminal-hostile.test.mjs`
  (new). Test-only, as unit 16.
- **Build:**
  - *Text (test 9):* fixtures whose every text field is a unique marker are run in both skins
    through one sequence: the opening render; each offer in `offers()` order with the same fake
    answer; a refetch after each; one refusal per code and one `already` per ops route; an unplug
    held and then refused; a null answer for each of sweep, scan, check, confirm, use, unplug.
    Compared AT EVERY STEP, twice: *result* (straight after `showResult`: the Terminal's new log
    lines less the echo and `started` lines, against what Panels newly show plus any toast or
    notice) and *state* (after the refetch: the Terminal's `show` output and unfolded quick
    commands, against the whole Panels view). A piece is the whole `textContent` of an element
    with a non-blank direct text node; a control's `title` and an `aria-label` on a textless
    element are pieces; `hidden` elements give none; white space is collapsed, case kept. Both
    directions: every Panels piece except `PANELS_ONLY_TEXT` (section headings the Terminal
    replaces with table headers, and `SCAN_BAR_TEXT`; kept in the test file) equals a Terminal
    piece of that step; every Terminal piece equals a Panels piece, is the id of a listed row, or
    matches `TERMINAL_ONLY_TEXT`.
  - *Hostile:* a fixture whose every text field (names, labels, product, version, summary,
    `falseBecause`, need labels, technique names, the view's message, the unplug refusal's
    message) is `<img src=x onerror=alert(1)>` followed by a carriage return, U+001B, U+2028 and
    U+202E, run through the same sequence in both skins. The Terminal's root holds only `span`,
    `code`, `button`, `input`, `label` and the log's line containers, no attribute starting `on`
    and no `img`; each hostile string shows as literal text with its control characters as
    U+FFFD and adds no extra line; Panels hold the same strings escaped, with no new element.
- **Done when:** both files pass, or every failure is reported with its cause.

#### Unit 18: the test bridge

- **Files:** `public/break_escape/js/systems/test-bridge/network.js` (new),
  `public/break_escape/js/systems/test-bridge/index.js` (one import and one namespace line),
  `docs/test-bridge.md` (one section); `test/js/network-view-bridge.test.mjs` (new); the copy
  lists of any test that copies `test-bridge/index.js` (grep `test/js` for `test-bridge`).
- **Build:** `window.__test.network`: `state()` returns `{ skin, hasSwitch, footholdId, status,
  offers }`, equal in both skins apart from `skin`; `run(offer, { path })` performs the offer
  with real input by the named path (with none: `button` or `select` in Panels, `typed` in the
  Terminal), unfolding the strip first, and resolves with the server's answer; it rejects when
  the path does not belong to the active skin, the offer is not in the list, or the offer is
  pending; `skin()`; `setSkin(name)` presses the header switch; `storePick(name)` calls
  `writePick` and presses nothing, with or without a view open; `log()` returns the Terminal log
  as lines (empty in Panels); `type(line)` types a line and presses Enter. The docs section says
  to address network-view controls by selector, label or `network.run`, never by number.
- **Tests:** `state()` equal across skins apart from `skin`; `run` rejects each of the three
  cases and records no call; `storePick` writes the key and presses nothing.
- **Done when:** your test passes; unmodified `node test/js/test-bridge-parses.test.mjs` and
  `test-bridge-access.test.mjs` pass.

#### Unit 19: the audit surface

- **Files:** `tools/playtest/ui-rules-audit.mjs`.
- **Build:** a network-view surface the audit opens in a live `test_ops_skin` game after the box
  is planted, once in each skin (through `window.__test.network.setSkin`). Without such a game
  the audit reports the surface as not audited, as today (`:213-214`).
- **Done when:** the audit still runs as before with no game given (state the command and its
  output); the live run is the tester's.

### K3: scenario fields and catalog

#### Unit 20: the catalog (the one catalog task of this stage)

- **Files (new):** `config/break_escape/realism_catalog.schema.json`,
  `config/break_escape/realism_catalog/training_fixtures.json`,
  `scripts/validate_realism_catalog.rb`, `scripts/realism_text_rules.rb` (the text rules both
  validators run), `scripts/real_vuln_nicknames.txt`, `docs/REALISM_CATALOG_INDEX.md`
  (generated), `test/unit/validate_realism_catalog_test.rb`,
  `test/fixtures/realism_catalog/catalog_faults/` (one subfolder per fault).
- **Build:**
  - **File form:** one closed object: `entries` (a map from catalog id to entry) and `_` note
    keys. **Entry:** closed, `_` notes allowed: `title` (required, 1 to 80 characters); `module`
    (required, `^[a-z][a-z0-9_]*(/[a-z0-9_]+){1,5}$`, at most 80, unique in the whole catalog,
    first segment one of `auxiliary`, `exploit`, `post`); `script` (required,
    `^[a-z][a-z0-9-]{0,39}$`); `advisories` (optional, 1 to 4 strings, each in one of the forms
    `CVE-\d{4}-\d{4,7}`, `MS\d\d-\d{3}`, `GHSA-...` (three groups of four from
    `2-9cfghjmpqrvwx`), `ZDI-\d\d-\d{3,5}`); `output` (optional, 1 to 6 lines of 1 to 80
    characters, saying only what a scanner reports: the state, a one-line description and a
    disclosure date; never a step, a request form or a trigger). Catalog id:
    `^[a-z][a-z0-9_]{2,47}$`, plain words describing the weakness. An entry has no kind (weakness
    or decoy is the linking scenario's choice) and no address, option or banner field.
  - **`training_fixtures.json`:** three invented entries for `test_ops_skin`, of ONE form (each
    with `advisories` and `output`, the same counts, the same module first segment and number of
    segments). Advisory ids are made up with the year `0000` (`CVE-0000-24117` style), which is
    never assigned. Titles and output name only invented products. No real identifier.
  - **`realism_text_rules.rb`** (pure, no Rails), the rules run over every text string by both
    validators. A *text string* is a scenario `cli` string or a catalog string; a *prose string*
    is a `banner`, a `title` or an `output` line. Errors: a character outside printable ASCII, a
    backslash, `%` followed by two hex digits, `0x` followed by four or more hex digits, `<` or
    `>`; a shell metacharacter (`;`, `|`, `&`, backtick, `$(`) or a flag beginning with `-`; an
    encoded blob (16 or more hex digits; in prose, 24 or more base64 characters with no space
    that hold a digit, `+` or `=`); a path in a prose string (a token starting `/`, `~/`, `./`,
    `../`; a drive letter with `:/`; a token that splits on `/` into three or more parts unless
    every part is letters only and the first is not a system directory name; one `/` with an
    empty side; a pair such as `SMB/CIFS` or `HTTP/1.1` is not a path); a credential-like string
    (tokens first stripped of surrounding brackets, quotes and punctuation: two runs joined by
    `:` except a private address and port; a `/` or `=` pair whose sides are equal, or whose
    right side is a common default password, or whose left side is an account word and whose
    right side is six or more characters with a letter and a digit; `passwd`, `password`, `pwd`
    or `secret` followed by `=` or `:` and a token; `user`, `username`, `login`, `pass`, `key` or
    `token` followed by `=` or `:` with a token directly after; in a `module`, two equal
    neighbouring segments); a real host (a dotted IPv4 outside the three private ranges, `://`,
    `www.`, a dotted name whose last part is letters only unless it is `local`, `internal`,
    `lan`, `test`, `example` or `invalid`); a telltale word as a whole word, case-insensitive
    (`decoy`, `fake`, `false`, `bait`, `patched`, `not vulnerable`, also joined by `_` or `-` in a
    `module` or `script`). Warning: a weaker telltale word (`real`, `true`, `fixed`, `safe`).
    Each rule returns a rule name and, for a scenario string only, the matched fragment.
  - **`validate_realism_catalog.rb`:** `check_realism_catalog(dir)`: the schema; each file parsed
    with a duplicate-key check; ids and `module` values unique across files; the text rules over
    every catalog string, ids included; and the catalog-only errors: a first module segment
    outside the three words; a catalog id matching an advisory pattern or a nickname of
    `real_vuln_nicknames.txt`; ANY dotted quad in a catalog string, private or not; a catalog id,
    `title` or `output` line holding an entry of `scripts/real_product_names.txt` as a whole
    word; a `module` of the default form (`auxiliary/scanner/<word>/<class>_f<n>`, `<class>` read
    from the schema's class enum); the append-only comparison with the committed index. **No
    message quotes a catalog string:** a problem is named by file, catalog id, field and rule.
  - **The index:** from the command line, when the append-only comparison passes, the validator
    rewrites `docs/REALISM_CATALOG_INDEX.md`; when it fails it rewrites nothing. Per id: its
    file; its form (whether it has `advisories` and `output`, their counts, the module's first
    segment and number of segments, for example `auxiliary/4`); and the scenarios that link it
    (read from every scenario's `realism` links, loading scenarios as `validate_scenario.rb`
    does). The index holds no catalog text.
  - **`real_vuln_nicknames.txt`:** a short list of well-known vulnerability nicknames, one per
    line, lower case, for the validators to refuse. This is a deny list of names only.
  - **Review step, in your report:** read each of the three entries against rule 4 and the
    `output` scope, and say so entry by entry (by id, not by quoting).
- **Tests:** every file of the catalog folder passes; the committed index equals what the
  validator would write (else the message "rerun scripts/validate_realism_catalog.rb") and holds
  no catalog string; only `test_*` scenarios link entries of `training_fixtures.json`; one
  failing fixture per catalog rule above (an id in two files; an id twice in one file; an id in
  an advisory form and one holding a nickname; an index naming a missing id, and one whose form
  changed, each through the command line too, asserting the index file is left unchanged; an
  added id passes; a bad first segment; one module on two entries; a default-form module; two
  equal neighbouring segments; a dotted quad in an `output` line and in a `title`; a real product
  name in a `title`; a telltale word in a `title` and in a `script`; a URL and a public domain;
  the escape, percent, hex-run and base64 forms; an equal-sides pair in a `title`; a bad advisory
  form; five advisories; seven output lines; an unknown key on an entry and on a file); passing
  fixtures for ordinary invented entries; every message names file, id, field and rule and holds
  no fixture string.
- **Do NOT:** add a real identifier; edit `lib/break_escape/realism_catalog.rb` or the core's
  fixture folders `ok/`, `fault_*`.
- **Done when:** your test passes; `ruby scripts/validate_realism_catalog.rb` is clean and the
  index is committed; unmodified `test/lib/realism_catalog_test.rb` passes.
- **Hand on:** the three ids and their one form (from the index), and the `realism_text_rules.rb`
  API, for units 22 and 23.

#### Unit 21: schema and bootstrap

- **Files:** `scripts/scenario-schema.json` (your blocks only; the file has very long lines);
  `test/models/break_escape/network_view_bootstrap_test.rb`,
  `test/js/validator-realism-schema.test.mjs` (new).
- **Build:** a top-level `networkView` object: closed, note pattern `^_`, one property
  `defaultSkin` with `enum: ["gui", "cli"]`, a description naming its reader (`skin-choice.js`),
  not `x-serverOnly`. On `networks.<id>`: `cli`, closed, `^_` notes: `range` (string, IPv4 CIDR
  pattern, max 18) and `hosts`, an id map (`x-id-map: true`, keys of 1 to 64 characters) of
  closed objects with one property `address` (dotted IPv4 pattern). On `definitions.service`:
  `cli`, closed: `protocol` (`enum: ["tcp", "udp"]`), `service` (`^[a-z][a-z0-9-]{0,23}$`),
  `banner` (1 to 80 characters). On `definitions.weakness` and `definitions.decoy`: `realism`,
  string, `^[a-z][a-z0-9_]{2,47}$`. Neither finding object gets a `cli` property. Descriptions
  name the readers (`cli-gen/`; the core's finding builder).
- **Tests:** Rails: `networkView` reaches the bootstrap unchanged, and a scenario without it has
  no such key. Node: a scenario fragment with each new field validates; an unknown key in each
  closed block, a bad `defaultSkin`, a bad `protocol` and a bad `realism` pattern each fail.
- **Done when:** your tests pass; `node test/js/ops-unchanged-validator.test.mjs` shows no change;
  `bin/ops-golden-compare` passes. If `scripts/validate_network_ops.rb` refuses `cli` or
  `realism` by a rule of its own, report the line; do not edit it.

#### Unit 22: the skin validator

- **Files:** `scripts/validate_realism_skin.rb` (new), `scripts/validate_scenario.rb` (one
  `require_relative` after `:30`, one `run.call('check_realism_skin') { check_realism_skin(json_data) }`
  after `:9124`, and the ink half of the wording warning inside the existing dialogue lint,
  smallest edit); `test/unit/validate_realism_skin_test.rb` (new);
  `test/fixtures/realism_catalog/skin/` (new, invented entries this test links).
- **Build:** `check_realism_skin(json_data)`, reading hosts, services and findings through the
  core's `NetworkModel` helpers. It reads the catalog ONLY when the scenario has at least one
  `realism` link, by calling `check_realism_catalog` and then the core's loader; when the catalog
  does not validate the scenario gets ONE error, "the realism catalog does not validate (file:
  <name>); catalog task: fix the catalog", and no link is checked. Errors:
  - `range` outside the three private ranges, prefix outside /16 to /30, host bits set, or
    overlapping another network's range; an `address` with no `range`, outside it, equal to its
    network or broadcast address, or used twice in the scenario; a `cli.hosts` key that is not a
    host on that network;
  - two services of one host with the same `port`, whatever their protocol;
  - a network id equal to a host, room object or resource id (read in every scenario that
    declares `networks`; no shipped scenario has such a clash, and the snapshot must not move);
  - range all or none across the scenario's discovery networks;
  - a `realism` link that names no entry; one id linked twice in the scenario;
  - links all or none: (1) some findings linked and others not; (2) among linked entries,
    `advisories` or `output` held by some and not others; (3) a decoy's entry with an (advisories
    count, output count) pair no weakness's entry in the scenario has; (4) `banner` set on some
    services that hold a finding and not on others;
  - module form: on one service the linked modules differ in first segment or number of segments;
    or a decoy's (first segment, number of segments) pair is used by no weakness;
  - the text rules of `realism_text_rules.rb` over every scenario `cli` string;
  - a service `cli` string, or a string of a linked entry, that holds a password of the scenario
    (the core's rule at `scripts/validate_network.rb:521-534`, applied to these strings);
  - a real identifier in an ops scenario (one that declares `services`): an advisory pattern,
    case-insensitive and not preceded by a letter or digit (`cve[-_]\d{4}[-_]\d+`,
    `can[-_]\d{4}[-_]\d+`, `ms\d\d[-_]\d{3}`, `kb\d{6,7}`, or `rhsa`, `dsa`, `usn`, `ghsa`, `zdi`
    followed by `-` or `_`); a framework-path form (a lower-case token of three or more `/`
    parts whose first is `exploit`, `auxiliary`, `post`, `payload`, `payloads`, `encoder`,
    `nop`, `evasion` or `scanner`); or a nickname from `real_vuln_nicknames.txt`. It runs over
    every `cli` string, every `realism` id, the scenario's other text (names, labels, products,
    versions, summaries, `falseBecause`, objectives, hints, mails) and, when the scenario has no
    links, each finding's default `module` and `script` (advisory and nickname patterns only).
    Scenarios with no `services` are NOT read by this rule;
  - `VERSION` agreement: a `banner` naming a real product, or holding a version number directly
    after the service's own `product` that differs from its `version`; the same for a linked
    entry's `title` or `output` line against the linking service.
  Warnings: a decoy's linked entry sharing a content word (four or more letters, not a stop
  word) with the decoy's own `falseBecause` (the message quotes only that word); `networkView`
  or a `cli` object in a scenario where no host declares `services`; skin-specific wording: in a
  scenario that uses `services`, an objective, hint, mail or ink line that pairs a control word
  (click, press the, button, type, command line, prompt, terminal) with an action word (sweep,
  scan, check, confirm, sign in, technique); the weaker telltale words.
  **Messages:** an error on a scenario string names the matched fragment and the plain form that
  passes; a link problem names the scenario path, the link id, the rule and the forms involved
  in the index's terms (for example "(advisories 1, output 2, auxiliary/5)"); nothing quotes
  catalog text.
- **Tests:** one passing and one failing scenario fragment per error and per warning, against
  `test/fixtures/realism_catalog/skin/`. Among them: a link with a broken catalog (one error, no
  link checked) beside a scenario with no link against the same catalog (no error); the tcp and
  udp pair on one port; one address on two networks; overlapping ranges; a 65-character
  `cli.hosts` key; a banner with a tab and one with a non-ASCII letter; the path, pair and
  credential forms, with the passing look-alikes (`SMB/CIFS`, `TCP/IP`, `HTTP/1.1`,
  `Guest/anonymous access enabled`, `Anonymous login: allowed`, `Read/Write/Execute`,
  `timeout=30`, `SSH host key: RSA`, `Weak TLS 1.0 enabled`, a private address with a port, a
  `.local` name); the real-identifier forms, ALL MADE UP (a year far in the future, never an
  assigned id), including a service word that only matches once joined into its default script;
  a label where the pattern is preceded by a letter (no match); a scenario with no `services`
  whose ink holds a made-up advisory id (not read); the weaker-word warnings. Every message is
  checked to hold no string of the test catalog (the shared word apart). The dungeon graph is the
  same with and without the block, the `cli` objects and the links.
- **Done when:** your test passes; `node test/js/ops-unchanged-validator.test.mjs` shows NO new
  line for any shipped scenario (D9: the four ops scenarios included); `bin/ops-golden-compare`
  passes; unmodified `test/unit/validate_plant_hiding_test.rb` passes.
- **Hand on:** the error and warning texts, for unit 26.

#### Unit 23: scenario links and serving tests

- **Files:** `scenarios/test_ops_skin/` (scenario, `PLAYTEST.md`, graph), the two Rails tests of
  unit 08 (extend), `docs/REALISM_CATALOG_INDEX.md` (regenerated);
  `test/controllers/break_escape/network_realism_link_test.rb`,
  `test/unit/realism_separation_test.rb` (new).
- **Read:** the index, NOT the catalog file. Unit 20's hand-on gives the three ids.
- **Build:** `test_ops_skin` gains `networkView.defaultSkin: "cli"`; a second, OPEN network
  reached through the same box, holding one host with an authored `range` and `address`; `cli`
  fields for the office network's range, the file server's address, the held-session PC's
  address and its service (protocol, service word, banner naming the invented product); and a
  `realism` link on each of its three findings to the three training entries. The printer and
  the sign-in hosts keep default output and hold no findings. Any new `eventMappings` entry goes
  last. Rerun `ruby scripts/validate_realism_catalog.rb` and commit the refreshed index.
  `PLAYTEST.md` gains beat D1 and the K3 checks.
- **Tests:**
  - *link serving:* the check answer, the confirm answer's finding and `GET /network` carry, for
    each linked finding, `cli` with exactly the keys its entry has, the same key set on the decoy
    as on the weaknesses; no answer (the bootstrap and the held-session PC's room answer
    included) holds the key `realism` or a link id; a test catalog folder with a duplicate id
    loads as an empty map with one server warning, and check and confirm then answer normally
    with no `cli`; no answer holds the `module` of an unlinked entry; a request for any path
    under `/config/break_escape/realism_catalog/` answers 404; a link removed from the loaded
    test catalog leaves that finding without `cli`, logs one warning naming the link id, and
    changes no status, alias or log row.
  - *separation:* every file in the folder of each scenario that declares `services` (found by
    the key) matches no advisory pattern, framework-path form or nickname, with the exemption for
    the default `auxiliary/scanner/<word>/<class>_f<n>` form; the index is scanned the same way;
    no file under `public/` or `app/assets/` holds a catalog entry's `module`.
  - *scanner real test:* over the real run, the range and the open network's address are staged
    from the first answer, the discovery network's addresses only after the sweep (the
    held-session PC's included), a service's `cli` only after the host scan, a finding's `cli`
    only after the check; never a link id, an unlinked module or a `_` key.
  - *scenario test:* the T beats still pass with the authored fields.
- **Done when:** all four pass; the scenario validates clean; `ruby
  tools/check_mapping_index_drift.rb` passes; `bin/ops-golden-compare` passes; the catalog
  validator test (unit 20's) passes with the refreshed index.

#### Unit 24: authored golden files

- **Files:** `test/js/cli-gen-scanner.test.mjs`, `test/js/cli-gen-framework.test.mjs`, the two
  `cli-golden/` folders (new files only), `test/js/network-terminal-hostile.test.mjs` (extend),
  new fixtures in `test/js/fixtures/network-view/`.
- **Build:** fixture view answers with every `cli` field authored and every finding's `cli`
  filled as a linked entry is served, in two cases: entries with `advisories` and `output`, and
  entries with neither. Text invented; advisory ids made up with the year `0000`. Golden files
  for both generators over them (the `IDs:` line and extra lines under the title; the
  `References:` list in `info`; the address in report lines, `RHOSTS` and `<host>:<port>` lines;
  `-sU` in a udp service's check line; a banner line). A decoy and a weakness with entries of
  equal form print the same lines in `search`, `info` and `use` before a confirm, and with each
  entry's text replaced by one placeholder they print exactly the same lines. The hostile test
  gains every served `cli` field (title, module, script, each advisory, each output line).
- **Do NOT:** change an existing golden file or an existing assertion.
- **Done when:** the three test files pass; unmodified `network-skin-text.test.mjs` and
  `network-skin-parity.test.mjs` pass over the new fixtures (they read the whole folder); if one
  fails, report the cause.

### K4: live proof and docs

#### Unit 25: the live parity runner

- **Files:** `tools/playtest/network-skin-parity.mjs`, `test/js/network-skin-parity-runner.test.mjs` (new).
- **Build:** a runner that, against a keyless server it is pointed at, drives three fresh games
  of `test_ops_skin` through one sequence with `window.__test.network.run`: A stays in Panels
  (one use by `select`, one by `drag`); B stays in the Terminal (one use by `typed`, one by
  `quick`); C presses the header switch after each step and calls `run` with no `path`. It
  records only `POST` requests to `/network/*`, the sign-in route and the share route (not the
  timed `GET /network`). Requests (method, path with the game id removed, body) must be equal
  across the three games exactly. Answers are compared after `normaliseAnswer`, whose removed
  keys are one list at the top of the runner, each with its reason beside it; no ops field
  (`finding`, `alias`, `status`, `reason`, `need`, `already`) may be on it. At the end it reads
  each game's server record and compares `footholds`, `sessions`, `opsDiscovered`, `opsFindings`
  (aliases included), `opsUsed`, the keyring's entries and, per log source, `log_rows_for(source_id,
  compare: true)`. Any difference fails the run. It makes its games as the shared brief says and
  touches no existing game row.
- **Tests:** `normaliseAnswer` removes only the listed keys and refuses a list that names an ops
  field; the request comparison fails on a one-byte difference.
- **Done when:** the node test passes. The live run is the tester's.

#### Unit 26: docs

- **Files:** `README_scenario_design.md` (one N16 row in the feature index, after N15),
  `docs/ACCESS_AND_NETWORKS.md` (one N16 section), `docs/test-bridge.md` (the `--net-skin` option
  and the parity runner).
- **Build:** what the skin is and when the switch appears; the skin order; the author's fields
  (`networkView.defaultSkin`, the three `cli` objects, `realism`) with their limits; the wording
  rule (rule 3) with two example lines; the catalog rules for authors (read the index, never the
  catalog; append-only; rerun the catalog validator after changing a link; hand a catalog error
  to a catalog task); the validator's errors and warnings from unit 22's hand-on; that a mission
  is playtested once, in whichever skin the run uses. No real identifier in any example.
- **Do NOT:** edit either plan.


## 6. Open questions, with the default this brief builds to

**Q1. How close should the Terminal be to the real tools?**
- *Default (built):* the plan's level. Two consoles modelled on nmap and Metasploit: the tools'
  command shapes are accepted, output follows their layout (report lines, the port table, the
  script block, `[*]`/`[+]`/`[-]` lines), and every line is printed bare. Limits: three framework
  options only; no timestamps, latencies or invented rows; flags are accepted but change nothing
  sent; the game's short verbs always work.
- *If the owner wants it looser* (generic "scanner" wording, no tool names): only unit 09's
  command words, units 10 and 11's `TEMPLATES` and the golden files change; no other unit moves.
- *If closer* (more flags with effect, more framework commands): it stays inside units 09 to 11
  as long as no new request is added. Anything that would need a new request or a new option
  breaks rules 1 and 4 and is a new plan, not a change to this one.

**Q2. Does a scan, check or technique use cost game time?**
- *Default (built):* no. No action costs game time; the only costs are the server's refusals.
  The skin adds no timer and the `started` lines wait for nothing but the request itself.
- *If the owner wants a cost:* it is a core change (the server would own the clock and both
  skins would show the same wait through the pending state), built in its own stage. Nothing in
  S6 would be rebuilt: the bar and the `started` lines already cover a longer wait.

**Q3. Where does the wording rule (rule 3) live?**
- *Default (built):* in three places a scenario author already reads or runs: the validator
  warning of unit 22, the N16 row of `README_scenario_design.md` and the N16 section of
  `docs/ACCESS_AND_NETWORKS.md` (unit 26). It is a warning, not an error, because it is a pattern
  match. No skill file is edited.
- *If the owner wants it in a skill or an agent brief as well:* that is a text edit the
  orchestrator makes (builders may not edit `.claude/skills/*`); no code changes. If the owner
  wants it as an error, it is one level word in unit 22 and its test, and every shipped ops
  scenario must first be shown to pass it.

**Q4. After K3 gives `test_ops_skin` a default of Terminal, where do beats W1 and W2 run?**
- *Default (built):* W1, W2 and W3's first half are written from the start against
  `test_ops_scan`, an existing ops scenario with no default, so the script never changes at K3
  and no copy of the scenario is kept. D1 runs on `test_ops_skin`.
- *If the owner prefers the plan's options:* either unit 23 adds a copy of the scenario with no
  default (one more folder to keep in step), or W1's first line is reworded to "opens in the
  scenario's default skin" (one line of `PLAYTEST.md`). Neither touches engine code.


## 7. Playtest outline

A scripted browser player (Haiku, through `window.__test`) runs these on a keyless server
started from `/data/be-ops-skin`, with fresh games made in that run. Beats name actions, never
controls, so one script runs in either skin. No beat sends a hand-built or forged request; those
checks are the Rails tests named in the scenario's `PLAYTEST.md`. After each beat the script
checks the requests sent, what the answers held, what the skin shows (`network.state()`,
`network.log()`, `getTestState()`), and the server's record (`verify-run.rb`).

**After K1 (no visible change):** rerun the existing scripted playtests of `test_access_networks`
and `test_ops_access`, unchanged. Both must pass as before.

**After K2: the T beats on `test_ops_skin`, run twice, once with `--net-skin gui` and once with
`--net-skin cli`.** Aliases and statuses must be equal in the two runs, beat for beat.

| Beat | What happens | Server record afterwards |
|---|---|---|
| T1 | Plant the box; the view opens in the starting skin with the header switch; the block lists no host | foothold held |
| T2 | Terminal run only, before any sweep: a mistyped verb gets the nearest verb; a scan of an invented host id and a scan of the file server's real id (its network not yet swept) print the SAME unlisted-target answer; the read-targets-from-a-file form prints its answer | unchanged; no request sent |
| T3 | Sweep the network (Terminal run: the sweep form with one unknown flag, which prints one "Ignored" note and sweeps). Panels show the Scanning bar while the request is out; the Terminal prints the start lines, then the report. Scan the file server. Terminal run only: a sign-in on the host with remote sign-in off prints the status sentence its Panels row shows | hosts discovered, one host scanned; no request for the typed sign-in |
| T4 | Check the service: three findings, each under the alias the server gave, each offering Confirm. Confirm the first real finding and the decoy (false, with its reason). Leave the second real finding unconfirmed. Terminal run only: a mistyped confirm sends nothing | two findings settled, one not |
| T5 | Use a card on the decoy (refused as a false positive) and on the unconfirmed finding (refused as not confirmed). Then confirm that finding | the same refusal codes and sentences in both runs |
| T6 | Switch skin: the same hosts, service, findings under the same aliases, statuses and cards are shown. Switch back | unchanged; no request sent |
| T7 | Use the first card on its finding (Panels: select then Use; Terminal: typed at the framework prompt, ending in the session line). Use the second (Panels: drag; Terminal: quick commands) | a session at the stated access, with the compromised mark (`compromiseMarks()`), the same in both runs; a keyring entry |
| T8 | Open the share; look at the printer | unchanged apart from the share being opened |
| T9 | Unplug | foothold gone; sessions through it ended |

**Switch beats, once, with no `--net-skin` value (on `test_ops_scan`, see Q4):**

| Beat | What happens |
|---|---|
| W1 | Fresh profile: the view opens in Panels. Press the switch; reload; the view opens in the Terminal with an empty log and the same rows |
| W2 | Open the same game with `?net_skin=gui`: Panels, although the pick is Terminal. Press the switch: the Terminal mounts. Reload: Panels again, and the stored pick is still Terminal |
| W3 | Open `test_access_networks` with the stored pick still Terminal: Panels, and no switch |

**Unchanged-scenario reruns (after K2):** for each of the existing scenarios with `networks` that
has a `PLAYTEST.md`, call `window.__test.network.storePick('cli')` once the game has loaded,
reload, and run its script unchanged. Each must pass as before.

**K2 look checks, before the stage lands:** screenshots of both skins at desktop and phone widths:
a sweep in progress (the bar; the start lines), a version-scan table, a framework run that ends
with a session opened, the bar under reduced motion (static), a finding offering Confirm, a host
row with the compromised mark; the prompt above an on-screen keyboard (a real phone or the Android
emulator); the UI rules audit over the network-view surface in each skin (unit 19); a double press
of Confirm, and of Enter on a confirm line, on a throttled connection, each sending one request;
the access leak scanner over the captured responses.

**After K3:** beat D1 (fresh profile, no URL value: the view of `test_ops_skin` opens in the
Terminal; one press of the switch gives Panels and is stored); the T beats once more in the
Terminal, with screenshots of the version scan, a script scan with its ids line and a run, now
showing the authored fields; the leak scanner over the captured responses, finding no link id and
no unlinked entry's text.

**After K4:** the live parity run (unit 25): three fresh games, A in Panels, B in the Terminal, C
switching after every step; requests, normalised answers and server records equal across the
three; the leak scanner over its captured responses.

Missions are playtested once, in whichever skin the run uses. The node parity tests are what show
the other skin gives the same game.


## 8. Review points

A reviewer of S6 attacks these, each with a test or a file:line.

1. **Same bytes.** No path in either skin sends a request the other cannot, and the server sees
   no skin parameter (units 07, 16, 25).
2. **Nothing typed reaches past the list.** A typed id the view has not listed gets the same
   answer as an invented one and sends nothing (units 09, 16; beat T2).
3. **No way out of a renderer.** The import and source checks (units 04, 15) cover every new file.
4. **Text safety.** The hostile fixture in both skins; control characters and bidi controls in
   the log (units 13, 17, 24).
5. **Decoys.** Before a confirm, a decoy's console text has the form of a weakness's: the same
   keys served, the same module form, no telltale word (units 11, 22, 23, 24).
6. **The catalog stays put.** Never served whole, never under a static path, no link id in any
   answer, no real identifier outside it, append-only against the index (units 20, 23).
7. **Simulation limits.** Three framework options and no other; private addresses only; no
   command, payload, credential or real host in any authored or generated string (units 11, 20, 22).
8. **Existing scenarios.** The byte-equal DOM under a forced Terminal pick, the validator
   snapshot and the golden compare, all with no re-record (units 01, 15, 21, 22).
9. **Delta sync.** S6 adds no state key and no sync section; confirm no answer grew.


## 9. Open items

1. **The offer's `target`** keeps the core's form and the plan's named ids move to `ids` (D3).
   This is the designer's reading; it changes nothing a player sees. If a reviewer wants the
   plan's shape exactly, it is a rename inside `view-controls.js` and the bridge.
2. **Unguarded actions in the log.** The plan says the scene records every guarded request and is
   silent on `sign-in`, `open` and `observe`. This brief has the dispatcher write their echo too
   (and the Look layout for `observe`), so the Terminal log reads the same from every input.
3. **The harness's URL parsing (D10)** may need a change in `.claude/skills/`; unit 07 reports,
   the orchestrator decides.
4. **The scanner's stages for `cli` strings (D18)** are assumed built by the core; units 08 and
   23 prove it on a real run and report a gap rather than edit the scanner.
5. **`validator_and_graph.json`** may need `test_ops_skin`'s own entry recorded when the scenario
   is added (unit 08) and again when it gains fields (unit 23). That is the only legitimate
   snapshot change of the stage: the unit reports the exact diff and stops, and the orchestrator
   allows a record limited to that scenario.
6. **Not verified by running anything.** This brief is from reading the plan and the code. No
   test was run. The claims "no shipped scenario has a network id equal to a host id" and "the
   four ops scenarios gain no real-identifier line" are the plan's; unit 22 proves them.
