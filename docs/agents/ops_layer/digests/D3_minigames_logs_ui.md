# D3 digest: minigame framework, UI rules, and reusable minigames

Scope: the minigame framework, the UI rules, and the existing minigames that new features may reuse or sit beside (password cracking, a command-line skin, log rows, a code-generator device). All paths are relative to the worktree root, `public/break_escape/...` unless stated.

Coverage note (read this first): the framework files, `index.js`, `docs/achitechture/minigame-design.md`, `password-guesser` (scene and model), `social-overlay.js` and `social-intel.js` were read in full. The large minigames (`password`, `log-filter`, `siem`, `notes`, `text-file`, `intel-board`, `capture-log`, `authenticator`, `command-board`, `assistant-chat`) were read by structure (grep and targeted reads), not in full. Their purpose lines below are unconfirmed unless a pointer is given. The CSS 9-slice and pixel-font rules were only partly read. Items marked **unconfirmed** need a full read before a planner relies on them.

Line numbers are from the files as they stood at the worktree HEAD (67e2f5873).

---

## 1. Minigame lifecycle and the contract

### 1.1 Base class: `MinigameScene`
File: `public/break_escape/js/minigames/framework/base-minigame.js` (570 lines).

- Imports `displayDashes` (`../../utils/display-dashes.js`) and `escapeHtml` (`../../utils/escape-html.js`), lines 1-2.
- Static opt-in flags, each a class property a subclass sets:
  - `controlsOverlay` (line 22): full-window console that overlays Cancel on its bottom bar.
  - `framed` (line 27): game area takes the shared SE 9-slice window frame, sized `min(720px, 96vw)`.
  - `keepsCancelButton` (line 35): default false. The X and Esc close a scene; no Cancel is drawn unless opted in.
  - `closeInsideFrame` (line 41): places the X inside the frame's top right.
  - `consoleWindow` (line 49): draws in the shared console window (max 1280x880, title bar with Press Start 2P 16px title, optional GNF subtitle, X). Scene draws no title bar or outer frame of its own.
  - `consoleWindowFill` (line 52): console takes its full size (for scrolling data panes).
  - `consoleSubtitleEssential` (line 56): keeps the subtitle on phones under 600px.
- Constructor `constructor(container, params)` (line 58): sets `this.container`, `this.params`, `this.gameState = { isActive, mouseDown, currentTool }`, `this.gameResult = null`, `this._eventListeners = []`.
- `init()` (line 70): builds the markup into `this.container`. Derived flags: `disableClose` (from `params.disableClose === true`) hides the X and blocks Esc. Title is escaped (line 102). Sets `this.gameContainer` (`.minigame-game-container`), `this.messageContainer`, `this.headerElement`, `this.controlsElement`. Adds the `pixel-scroll` class to the shell and game area (line 122-123).
- `ensureControlsRow()` (line 162): creates the controls row on first use (for a footer button). `controlsHost()` (line 178) returns null by default.
- Titles: `consoleTitle()` (line 189) reads `params.title`. `consoleSubtitle()` (line 193) reads `params.consoleSubtitle`. `setConsoleTitle(title, subtitle)` (line 197).
- `start()` (line 310): sets `gameState.isActive = true`, installs the shell scrollbar watcher, and (unless `disableClose`) a document `keydown` Esc handler (lines 320-330) that calls `handleEscapeKey(e)` if the subclass defines it, else `closeByPlayer()`.
- `closeByPlayer()` (line 338): sets `closedByPlayer = true` and calls `complete(false)`.
- Success hold helpers: `markSuccessPending()` (line 349), `resolveEarlyClose(success)` (line 354), `holdSuccess(ms, afterComplete)` (line 359). A close during a held success still commits the success.
- `complete(success)` (line 367): the single exit. Ignores a superseded instance (lines 373-376: `window.MinigameFramework.currentMinigame !== this`). Emits `minigame_completed` or `minigame_failed` on `window.eventDispatcher` with `{ minigameName, success, result: this.gameResult }` (lines 383-389). Then calls `window.MinigameFramework.endMinigame(success, this.gameResult)` (line 395).
- `addEventListener(element, eventType, handler, options)` (line 401): tracked listener, removed in `cleanup()`. Use this for every DOM and eventDispatcher listener.
- Feedback helpers:
  - `showSuccess(message, autoClose = true, duration = 2000)` (line 406): `innerHTML` (not escaped). Holds the success if `autoClose`.
  - `showFailure(message, autoClose = true, duration = 2000, { plainText = false })` (line 420): `innerHTML` unless `plainText`. Calls `complete(false)` after duration.
  - `updateProgress(current, total)` (line 435).
- Test bridge hooks: `isTestVisible(el)` (line 450), `getTestControlElements()` (line 467, cap 60), `getTestFieldElements()` (line 480, cap 30), `getTestState()` (line 510). Overrides must spread `super.getTestState()` and return plain JSON. See section 7.
- `cleanup()` (line 554): removes tracked listeners, disconnects observers, removes the Esc handler.

Helpers exposed for subclasses: `displayDashes`, `escapeHtml` (imports, lines 1-2). Shared frame and X styles are in CSS (section 2).

### 1.2 Framework manager: `MinigameFramework`
File: `public/break_escape/js/minigames/framework/minigame-manager.js` (727 lines).

- Object literal export `MinigameFramework` (line 4). Fields: `mainGameScene`, `currentMinigame`, `registeredScenes = {}`, `MinigameScene` (line 8).
- `registerScene(sceneType, SceneClass)` (line 664): stores the class in `registeredScenes`.
- `startMinigame(sceneType, container, params)` (line 42). Order of work:
  1. Unknown scene: `console.error`, returns null (line 43-47).
  2. Refuses while the player is knocked out: `window.playerIsKnockedOut?.()` (line 51).
  3. Closes any interaction menu (`window.closeInteractionMenu?.()`, line 58).
  4. Notes the focus opener for the first minigame of a chain (lines 63-64).
  5. Displaces a running minigame: a running parent with `params.suspended === true` is ended without `onComplete` (lines 70-100). Stray minigames opened during teardown are ended too (lines 90-96).
  6. Keyboard: if `params.requiresKeyboardInput` is set, calls `window.pauseKeyboardInput()` (lines 111-135).
  7. Main-world input: disabled unless `params.disableGameInput === false` (lines 139-164).
  8. Calls `window.cancelClickToMove()` (line 167).
  9. Container: uses the given one or creates `div.minigame-container` on `document.body` (lines 172-175). Sets `container.dataset.minigame = sceneType` (line 178). This attribute is what the UI theme CSS keys on.
  10. `new MinigameClass(container, params)` (line 183). Sets `_sceneType` (line 193). Calls `init()` then `start()` (lines 206-207).
- `endMinigame(success, result)` (line 476). Re-entrancy guard on `_ending` (line 478). Converts a failed close into success if `_successPending` (lines 486-489). Runs `cleanup()`, removes the auto-created container, restores keyboard and main-world input, calls `params.onComplete(success, result)` (line 546), then `returnTo` if present (lines 555-560). Emits `minigame_ended` (line 598).
- `isOpen(sceneType)` (line 231): true while that scene type is open and not ending. Use this to avoid re-opening.
- `holdsBarks()` (line 221): barks wait while a non-phone-chat minigame is open.
- Focus trap (lines 236-416): Tab cycles inside the open minigame. Steps aside for `params.focusTrap === false`, `data-external`, a higher modal, or a `data-own-tab-cycle` element. Limit noted at lines 245-247: Tab inside the VM console iframe is not seen.
- `forceCloseMinigame()` (line 720) and `restartCurrentMinigame()` (line 670).
- Returns and chains: `params.returnTo = { sceneType, params }` reopens a parent after a normal exit (`isNormalExit`, line 612: `success === true` and not `result.aborted`). Parent is suspended with `params.suspended = true` (see `launchChild`, section 1.3).

Params the framework reads (from `startMinigame` and the base class):
`requiresKeyboardInput`, `disableGameInput`, `suspended`, `returnTo`, `onComplete`, `focusTrap`, `disableClose`, `showCancel`, `cancelText`, `title`, `headerElement`, `consoleSubtitle`, `ringerCall`.

### 1.3 Social overlay base: `SocialOverlayScene`
File: `public/break_escape/js/minigames/framework/social-overlay.js` (197 lines).

- `socialOverlayParams(params)` (line 27): returns `{ requiresKeyboardInput: true, disableClose: true, ...params }`. Starters should build params with this.
- `SocialOverlayScene extends MinigameScene` (line 33). Its own Esc handler is capture-phase (line 42-43), closes the top layer first, then blurs a text field, then calls `requestClose()` (lines 106-122).
- `buildCloseControl(label)` (line 52): the shared `button.se-overlay-close` with `&times;`. `mountCloseControl(parent, label)` (line 72).
- `mountThemedCloseControl(parent, label, extraClass)` (line 85): builds a `.minigame-close-button` styled by the theme skin. Used by diegetic devices (kiosk, monitor).
- `pushLayer(close, name)` (line 97): register a sub-layer for Esc.
- `closeMode` getter (line 128): `'close'` (default) or `'abort'`.
- `closeResult()` (line 131): override to report a result.
- `requestClose()` (line 133): `abort()` if `closeMode === 'abort'`, else `close()`.
- `close()` (line 139): `gameResult = closeResult()`, then `complete(true)`.
- `abort()` (line 146): `gameResult = { aborted: true }`, then `complete(false)`.
- `saveDraft()` (line 153) and `returnParams()` (line 156): override for drafts and returns.
- `launchChild(sceneType, childParams)` (line 163): calls `saveDraft()`, sets `params.suspended = true`, starts the child with `returnTo: { sceneType: this._sceneType, params: this.returnParams() }`. Returns null if the child did not start.
- `getTestState()` (line 176) adds an `overlay` block: `sceneType`, `layers`, `closeMode`, `suspended`, `returnsTo`.

### 1.4 Registration and opening
File: `public/break_escape/js/minigames/index.js` (268 lines).

- Re-exports (lines 2-59) and side-effect imports for the two device modules: `import './capture-log/capture-log-minigame.js';` (line 120) and `import './rogue-ap/rogue-ap-minigame.js';` (line 122). Both register their own scenes.
- `window.MinigameFramework = MinigameFramework` (line 66). `window.closeMinigame` and `window.restartMinigame` (lines 69-83).
- Scene registrations are one line each, lines 188-246, of the form `MinigameFramework.registerScene('<type>', <Class>);`. Relevant ones:
  - `password-guesser` (line 210), `password` (line 215), `password-minigame` is not a separate name; the sign-in and lock screens use `password` (line 215).
  - `log-filter` (line 236), `siem-dashboard` (line 222), `intel-board` (line 200), `text-file` (line 216), `notes` (line 191), `authenticator` (line 213), `command-board` (line 226), `assistant-chat` (line 211), `network-view` (line 245), `patch-panel` (line 246), `capture-log` is not in this block (registered from its own module, line 120).
  - `pin` (line 214), `rfid` (line 218), `container` (line 196), `person-chat` (line 198), `phone-chat` (line 197).
  - `episode-runner` (line 203) and `consequence-sandbox` (line 204) are registered here too.
- Window-level starters: lines 249-268 (for example `window.startNetworkViewMinigame`, line 267; `window.startPatchPanelMinigame`, line 268).
- Note: `network-view` is an opened-by-code scene ("opened only by systems/network-links.js", comment at line 180), so it is registered for the framework but has no starter in the scenario schema.

### 1.5 How a scenario object opens a minigame
- Lock types route through the starters in `public/break_escape/js/systems/minigame-starters.js` (named in `docs/achitechture/minigame-design.md:34`). This file was not read in this pass (**unconfirmed** in detail).
- `docs/achitechture/minigame-design.md:40` lists lock types `pin`, `key`, `password`, `biometric`. Custom minigames are called from ink via `window.*MinigameFunction()` (line 42).
- Interaction branches: `public/break_escape/js/systems/interactions.js:658` reads `se_intel_<id>` directly for an intel gate (`intel.every(...)`). Patch panel is opened by the interactions branch for `panelPorts` (comment at `index.js:184`).

### 1.6 The new-minigame checklist (as written)
From `docs/achitechture/minigame-design.md:103-111`:
1. Extend `MinigameScene`, implement `init()` and `start()`, call `this.complete(success)`.
2. Register in `minigames/index.js`.
3. Add a starter helper in `systems/minigame-starters.js` if an object triggers it.
4. Use `window.npcManager.setGlobalVariable()` for state other systems should see.
5. Use `this.addEventListener(window.eventDispatcher, ...)` in `start()`.

Design doc key events (lines 72-87): `minigame_completed`, `minigame_failed`, `global_variable_changed:<name>`, `room_entered:<id>`, `item_picked_up:<type>`, and others.

The design doc example class is `biometrics/biometrics-minigame.js` (line 176). That file was not read here.

---

## 2. UI rules and shared styling

### 2.1 Rules written down
- Pixel-art UI: 2px borders or the `ui-themes.css` 9-slice skin, pixel fonts only (GNF, Press Start 2P, VT323), no radius and no smooth fonts. This rule is in the operator's private memory (`pixelart-ui-rule.md`, referenced from the user memory index). **Unconfirmed** as a repo doc: no in-repo file with that exact wording was found in this pass.
- The "X closes" rule is in `base-minigame.js:29-35`: the X and Esc close a minigame, so no Cancel is drawn unless a scene sets `keepsCancelButton`. `base-minigame.js:21-35` and `:37-41` document the close-inside-frame and console rules.
- `minigame-design.md` has no UI rules section. It covers registration, events, globals only (lines 1-176).
- `docs/achitechture/UI_CONSOLES_REVIEW_R2.md` exists and mentions the console design (found by grep, not read; **unconfirmed** content).
- `docs/video/GUIDELINES.md` and `docs/IDEAS_BACKLOG.md` mention UI rules in passing (grep only).

### 2.2 Theme skins: `public/break_escape/css/ui-themes.css`
- Header comment (line 3): the game page sets `<html data-ui-theme="...">` from the mission's `mission.json`.
- Lines 22-24: the theme frames are 9-slice `border-image` sources; the comment says unitless slice values are used.
- Theme blocks keyed by `[data-ui-theme="<name>"]`: `general` (line 30), `spy` (76), `cyberpunk` (122), `crt` (168), `eldritch` (216), `circuit` (263), `secops` (312).
- Line 362 onwards: `[data-ui-theme] .inventory-slot`, `#music-widget-btn`, and other shared elements.
- Minigame containers carry `container.dataset.minigame = sceneType` (`minigame-manager.js:178`), which lets the theme CSS frame generic tool windows (comment at `minigame-manager.js:177`).
- Other minigame-related CSS in `public/break_escape/css/`: `minigames-framework.css` (console window, close button, phone breakpoints per `base-minigame.js:5-6`, `:56`), `device-frame.css`, `pc-monitor.css`, `utilities.css` (pixel scrollbar, per `base-minigame.js:121`), `fonts.css`, `modals.css`, `notepad-window.css`, `awareness-skin.css`. Only the class names and comments were checked. **Unconfirmed**: the full contents of the 9-slice frame rules and the exact font stacks.

### 2.3 Device frames
- `device-frame.css` and `pc-monitor.css` exist. The `mountThemedCloseControl` path (`social-overlay.js:85-90`) says a diegetic device uses the themed steel X from the PC monitor.
- `password/password-minigame.js` uses `mountMonitor()` for PC screens and `wrapInFrame()` otherwise (lines ~143-146 of the init at 135-146). Helpers `isPcScreen`, `mountMonitor`, `wrapInFrame` are not read (**unconfirmed**).

### 2.4 Escaping and text rules
- Titles: `params.title` is plain text and escaped (`base-minigame.js:14-18`). No HTML title option.
- `showSuccess` and `showFailure` take HTML unless `plainText` (`base-minigame.js:406-433`). Use `plainText` for any authored or server text.
- `password-guesser` sets every string with `textContent` (`password-guesser-minigame.js:23-24`, `el()` at lines 35-40).
- Org input: validate server-side, plain text only, escape in views, `textContent` in the engine (from the operator's memory note `org-input-sanitisation.md`; not checked in repo).

### 2.5 Shared helpers
- `utils/escape-html.js`, `utils/display-dashes.js` (imported by the base class).
- `utils/npc-headshot.js` (portrait helpers, re-exported by `password-minigame.js:27`).
- `utils/lock-scope-refusal.js`: `unlockWithRouteRoomRetry` (used by `password-minigame.js` and `pin-minigame.js`) and `lockScopeRefusal`, `lockScopeRefusalLine`.
- `ui/modal-stack.js` (`openModalCount`) used by `social-overlay.js:2`.

---

## 3. The minigames listed

Each entry: purpose (two lines), params, scenario fields, server check, users. Where a field was not read in full it is marked.

### 3.1 `password-guesser` (awareness product, ENG-02)
Files: `minigames/password-guesser/password-guesser-minigame.js` (258 lines, read in full), `password-guesser-model.js` (339 lines, read in full).

Purpose: the `guess` stage of an awareness episode. The learner steps through an authored guess list in the order an attacker tries it. Nothing is typed and nothing is scored. It is not a password cracker: each row already carries its outcome.

Registration: `index.js:210`. Launched by `episode-runner` through `episode-model.js:562`, which returns `{ kind: 'guess', sceneType: 'password-guesser', params }`. Also listed in `systems/exercise-station-starter.js:35` as an exercise scene. Line 74 of that file: `result?.finished === true` counts as done.

Params (`password-guesser-minigame.js:11-15`):
- `config`: the `awarenessEpisode.guess` block. `mode` picks the builder (default `'target'`).
- `note?`: `strings.guessNote`, the "nothing real is typed" line.
- `globals?`: globals the facts are read from (default `window.gameState.globalVariables`, line 50-51).
- `write?`: `(name, value) => void`. Default writer is `writeGlobal` (imported at line 29, used at line 232).

Result (`:16-21`, `closeResult()` at line 239): `{ finished: boolean, landed: boolean }`. `finished` is `switchedOff`. `landed` is `run.landed`.

Config fields read by the model (`password-guesser-model.js`):
- `commonList` (string array). `buildTarget`, line 108. Each row is `struck`.
- `patternSlots` (array of `{ id, template, word, factId, label }`). Lines 115-129. A slot's guess is `slotGuess(slot)` (line 101-104): the template's `{<slot.id>}` token is replaced by `slot.word`. A row is `missing` unless `intelCollected(globals, slot.factId)` (line 123).
- `reuseStep` (`{ factId, site, note }`). Lines 130-141. Row is `opens` only when its fact is held.
- `passphraseDemo` (`{ words }`). Lines 142-144 and `passphrasePanel` (151-157). Always outcome `holds`, never lands.
- `note`, `strings` (line 84-87 `textFor`), `roster`, `wordList`, `spray`, `stuff`: used by modes `spray` and `stuff` (lines 165-275).
- `landedGlobal` (string): name written `true` on a normal close if the run landed (`_writeLanded`, `password-guesser-minigame.js:227-237`).

Modes (`MODE_BUILDERS`, `password-guesser-model.js:278`): `target` (default), `spray`, `stuff`. `modeOf` (line 282) returns null for an unknown mode, and the scene then shows the `unsupported` string.

Outcome vocabulary (`password-guesser-model.js:300`): `struck` -> state `struck`; `missing` -> `notfound`; `opens` -> `opened`; `holds` -> `trying`; `found`; `sprayed`; `blocked`.

Run stepping (`GuesserRun`, lines 312-339): `advance()` reveals one row in order. `runAll()` reveals all. `switchOffReady` is true once every row is reached. `landed` is true if a revealed row has outcome `opens`.

Close behaviour: `requestClose()` (`password-guesser-minigame.js:215-218`) marks `switchedOff` when the run is complete, so a finished run is kept. `close()` writes the landed global once (`:221-225`).

Server check: none found in these files. The landed global is written client-side with `writeGlobal` and then `window.stateSync?.sync?.()` (`:233`). **Unconfirmed** whether any server endpoint re-checks the landed global.

Test state: `getTestState()` (lines 243-255) adds a `guesser` block: `mode`, `total`, `revealed`, `landed`, `switchedOff`, `rows` (id, text, state).

Scenario users: `awarenessEpisode.guess` in the `ca*` scenarios is the expected home. Not grepped in this pass (**unconfirmed** which scenarios use it). `scripts/validate_social/awareness.rb:1298` requires `awarenessEpisode.guess` to be `{ commonList, patternSlots, reuseStep, passphraseDemo, landedGlobal }`, and `:1353` checks `patternSlots` is an array.

### 3.2 `password` (lock and sign-in password screen)
File: `minigames/password/password-minigame.js` (2539 lines, read by structure only).

Purpose: the password entry for locks and PC sign-in screens. It covers a plain password, Wi-Fi join key, a PC sign-in with a user picker, and remote sign-in via captured credentials. It is the closest existing thing to "password cracking" in the game: a player may use captured or guessed credentials. **Unconfirmed**: the exact capture-credential flows.

Registration: `index.js:215` (`password` scene).

Params read in the constructor (`password-minigame.js:515-550`):
- `password`, `passwordHint`, `showHint`, `showKeyboard`, `maxAttempts` (default 3), `postitNote`, `showPostit`.
- `lockoutSeconds` (opt-in lockout that survives reopening, line 534). Lock key `"<type>:<id>"` (line 538).
- `lockable` (or `sprite`), `type` (`'object'` or `'door'`), `join` (`{ apId, apName }`), `signIn` (`{ pcId, pcName, picker, tiles, current, remote, preselect, captured, keyring }`), `onRefused`, `title`, `deviceName`, `deviceImage`, `observations`, `disableClose`.

Server check (the main point for planners):
- `validatePasswordWithServer(enteredPassword)` (defined around line 1365-1420 in the file; exact line not pinned, **approximate**). Resolves a `targetId` from `doorProperties.connectedRoom` or `doorProperties.roomId` for a door, else `scenarioData.id`, `scenarioData.name` or `objectId` (lines 1369-1378 approximately). Calls `unlockWithRouteRoomRetry(targetType, targetId, enteredPassword, 'password')`.
- A success sets `serverResponse` and calls `passwordCorrect()`. A failure calls `passwordIncorrect({ caseMismatch })`. A 422 counts as a real wrong attempt. A 403 with a scope reason (`lockScopeRefusal`) is not an attempt and closes as cancelled.
- The server endpoint is `POST /unlock` (`config/routes.rb:34`), handled by `GamesController#unlock` (`app/controllers/break_escape/games_controller.rb:1211`). It calls `@game.validate_unlock(target_type, target_id, attempt, method, card_ids:)` (`app/models/break_escape/game.rb:4597`). On a wrong attempt it returns 422 with `caseMismatch` when `password_case_mismatch?` (`game.rb:4808`).
- The client sends no answer. It never holds the correct password on success paths (it does hold `params.password` for hints, `password-minigame.js:520`). **Unconfirmed**: whether the bootstrap ships `params.password` to the browser for locks. This matters for planners and was not checked.
- `api-client.js:108` is the client wrapper `ApiClient.unlock(targetType, targetId, attempt, method, extra)`.
- Events: `password_failed` and `password_failed:<targetId>` (`emitPasswordFailed`, around line 1500-1530 approximately).

Test state: `getTestState()` at line 587 (join, signIn and default branches). Hints for the test bridge are in the returned object: `entryHint: 'type(0, "<password>", { submit: true })'`.

Scenario users: `lockType: "password"` objects (`docs/achitechture/minigame-design.md:40`). Not grepped for exact scenario list (**unconfirmed**).

### 3.3 `log-filter` (access log analyser)
Files: `minigames/log-filter/log-filter-minigame.js` (1441 lines, read in lines 1-240 and by grep for the rest).

Purpose: a console for reading an access log, filtering rows, and flagging the one anomalous session. Used for the VPN log (MG-06) and the jump-server RDP log (VM-02). It is the main existing "log row" UI.

Registration: `index.js:236` (`log-filter`). Also imported at `index.js:51` (re-export) and `index.js:162` (import).

Params (`log-filter-minigame.js:1-31`, constructor at 176-206):
- Reads `params.sprite?.scenarioData`, and inside it `minigameData` if present (line 177).
- Fields: `logType` (default `'vpn'`), `title` (or `consoleTitle`; default `'ACCESS LOG ANALYSER'`), `logEntries[]`, `anomaly`, `threatIntel`, `accountHistory`, `flagActionLabel`, `flagConfirmTitle`, `flagConfirmBody`, `flagRejectedBody`, `additionalTabs[]`, `requireAllTabs`, `completionActions[]`, `flagActions[]`, `progressActions[]`, `stateOverrides[]`, `completeBanner`, `nextTabPrompt`, `nextTabButton`, `completedGlobal`.
- `completedGlobal` defaults to the first `set_global` with value `true` in `completionActions` (line 206-207).
- Actions use `window.npcManager.setGlobalVariable(name, value)` (lines 1372-1394).
- Completion closes on a timer `this.complete(true)` after 1400 ms (line 1364).

Column schemas: `LOG_FIELDS` (lines 45-63):
- `vpn`: `timestamp`, `user`, `ip`, `country`, `mfa`, `result`.
- `ics_rdp`: `timestamp`, `sessionId`, `account`, `sourceIp`, `duration`, `status`, `accessLevel`.

Filter categories: `FILTER_CATEGORIES` (lines 65-82). `vpn`: country (UK, RO, US, DE, FR), mfa (YES/NO), result (ACCEPT/REJECT), user (text), time (four bands). `ics_rdp`: status, accessLevel, account (text), sourceIp (text), time.

Lookups: `threatIntel` and `accountHistory` each match on `ip` or `account` for the selected row (comment lines 22-24). `_isAnomalyEntry` at line 885.

Server check: none. The file has no `fetch`, `ApiClient` or server call (grep). Completion goes through scenario actions and `window.npcManager` only. The flag and completion decisions are client-side, so anything a server must trust needs its own path. **Unconfirmed**: whether the scenario's `set_global` results are later validated by the server.

Scenario users: `scenarios/sis01_healthcare/scenario.json.erb` and `scenarios/sis02_energy/scenario.json.erb` (grep: `logType`).

### 3.4 `siem-dashboard` (SIEM triage)
File: `minigames/siem/siem-dashboard-minigame.js` (976 lines; structure only).

Purpose: a SIEM alert triage console with a time limit. The player sorts alerts by severity and picks which to escalate (**unconfirmed** in detail).

Registration: `index.js:222`. Imported at `index.js:151`.
Params (lines 246-253): `timeLimitSec` (default 180), `alerts` (inline array), `alertConfig` (a key in the `ALERT_SETS` registry, line 51), otherwise `createSeededAlerts()` (line 80). `ALERT_SETS` and seeding are both in-file.
Persistence: `STATE_KEY = 'mg01_siem_state'` (line 5). Stored in browser storage. **Unconfirmed** which storage (likely `localStorage`).
Result: `this.gameResult` set (line 874), event `siem_triage_completed` emitted on `window.eventDispatcher` (line 882). `complete(success)` override at line 301, `super.complete` at 313 and 889.
Server check: none in this file (no `fetch`).
Scenario users: not grepped (**unconfirmed**).

### 3.5 `capture-log` (capture device log)
Files: `minigames/capture-log/capture-log-minigame.js` (505 lines, structure only), `capture-log-model.js` (176), `capture-rows.js` (110, read by structure), `signin-rows.js` (294, structure only).

Purpose: a device that lists captured sign-ins and secrets from the social engineering or physical pentest path. The rows are built at runtime from the social block and capture secrets.

Registration: side-effect import `index.js:120` (the file registers its own scene and starter). The design comment at `index.js:119` says "the capture log device (engine plan section 6)".
Row building: `buildCaptureRow(entry, social, secretsById)` (`capture-rows.js:33`). `applyCaptureSecrets` (57). `failCaptureSecrets` (66). `watchCaptureSecrets(secretRows, { attempts = 4, retryMs = 1500, ... })` (80). `loadCaptureSecrets(deps)` (97). These fetch secrets from the server (**unconfirmed** endpoint; `systems/capture-client.js` in the imports list is the likely client).
Test state: `getTestState()` at `capture-log-minigame.js:468`.

### 3.6 `intel-board` (case file)
Files: `minigames/intel-board/intel-board-minigame.js` (835 lines), `board-model.js` (503). Structure only.

Purpose: a board where the learner links collected intel facts to targets. It reads the persisted `se_intel_*`, `target_ready_*` globals (header comment, `intel-board-minigame.js:5`). It is a view on globals, not a separate store.
Registration: `index.js:200`. Import `index.js:112`.
`INTEL_PREFIX = 'se_intel_'` (`board-model.js:9`).
Test state: `intel-board-minigame.js:771`.
Server check: none found by grep in this file.

### 3.7 `text-file` (text file reader)
File: `minigames/text-file/text-file-minigame.js` (696 lines, structure only).
Registration: `index.js:216`. Re-export `returnToTextFileAfterNotes` (`index.js:31`, `:259`). Used with the notes return path.
**Unconfirmed**: the params shape (not read).

### 3.8 `notes` (player notebook)
File: `minigames/notes/notes-minigame.js` (1051 lines, structure only).
Registration: `index.js:191`. Exports `startNotesMinigame` and `showMissionBrief` (`index.js:8`, `:249-250`).
Test state: `notes-minigame.js:83`. Notes are the evidence notebook: `grantFact` writes an evidence note through `window.addNote` (`social-intel.js:69-71`). **Unconfirmed** note storage shape.

### 3.9 `authenticator` (MFA prompt)
Files: `minigames/authenticator/authenticator-minigame.js` (474), `authenticator-model.js` (85). Structure only.
Registration: `index.js:213`. Test state at `authenticator-minigame.js:453-470`. **Unconfirmed** purpose detail and params.

### 3.10 `command-board` (timeline board)
Files: `minigames/command-board/command-board-minigame.js` (471), `command-board-timeline.js` (486). Structure only.
Registration: `index.js:226`. Import `index.js:153`. **Unconfirmed** purpose and params. The name suggests a board with a timeline, but this was not read.

### 3.11 `assistant-chat` (AI assistant chat, awareness)
File: `minigames/assistant-chat/assistant-chat-minigame.js` (422 lines, structure only).
Registration: `index.js:211`. Import `index.js:127`. Listed in `exercise-station-starter.js:35` as an exercise scene. Test state at `:413`.
**Unconfirmed**: whether any text is generated at runtime. The project rule is "no runtime LLMs" (user memory note `labsheets-last-no-llm.md`), so treat any chat as scripted.

### 3.12 Other minigames in the same area (not in the brief, listed for planners)
- `network-view` (`minigames/network-view/network-view-minigame.js`, 977 lines). Opened by `systems/network-links.js` (comment `index.js:180`). The topic brief asks for "a command-line skin for the network view". No CLI skin was found in this pass (**unconfirmed**).
- `ehr-terminal` (`minigames/ehr-terminal/`, registered `index.js:224`). Its name suggests a terminal-style UI. **Unconfirmed**; not read.
- `patch-panel` (`index.js:185`, `:246`).
- `rogue-ap` (side-effect import `index.js:122`).
- `episode-runner` (`index.js:115`, `:203`). It launches `password-guesser` through `episode-model.js:520` and `:562`.

---

## 4. Intel facts

### 4.1 Data shape
- `social.intelFacts` is a map: fact id -> fact object. The validator says so at `README_scenario_design.md:3235`: "`social.intelFacts` is a map of fact id to fact. Holding fact `<id>` is the boolean global `se_intel_<id>`, which must be declared with default `false`."
- Fact fields seen in code: `text` (required for the evidence note, `social-intel.js:69`), `noteText` (escaped text for the notebook, for feed facts, `social-intel.js:71`), `source` (the OSINT block or feed post that grants it, `README_scenario_design.md:4296`), `provides` (label, `README_scenario_design.md:4441`), `reduceNote` (privacy panel, `README_scenario_design.md:3638`), `subject` (`social-intel.js:66`, read via `subjectLabel`).
- Example at `README_scenario_design.md:4266`: `"intelFacts": { "supplier_contact": { "text": "...", "subject": "supplier_contact", ...` and the global `"se_intel_supplier_contact": false` at line 4118.
- Schema reference: `lib/break_escape/scenario_schema.rb:47` points at `#/properties/social/properties/intelFacts`.

### 4.2 Where granted
- Client-side single award path: `grantFact(id, { scenario, engine, npcId, source })` in `public/break_escape/js/systems/social-intel.js:46-80`.
  - Accepts a bare id or the prefixed `se_intel_` name (line 48).
  - Refuses an id that `social.intelFacts` lacks, when the block exists (lines 52-58, "Unknown fact ... not granted").
  - Flip-only: a second grant does nothing (line 61).
  - Steps: `writeGlobal(name, true)` (line 63); emit `intel_collected` (line 67); add an evidence note via `window.addNote` (lines 69-72); `window.stateSync?.sync?.()` (line 73); `evaluateReadiness` for `social.intelBoard.readinessSlots` (lines 75-78).
  - Header comment lists the five steps (lines 4-12).
- Callers: OSINT browser `osint-browser-minigame.js:891` (`source: 'osint'`), person-chat pretext grants `person-chat/person-chat-pretext.js:212` (via `applyGrants`), mail highlight `mail-client-minigame.js:1233`, and the `grant_fact` action at `systems/apply-actions.js:164`.
- `INTEL_PREFIX` and `intelGlobal(id)` at `social-intel.js:19-23`.

### 4.3 How `password-guesser` uses facts
- Reads `se_intel_<factId>` only: `intelCollected(globals, factId)` (`password-guesser-model.js:90-92`), where `globals[`se_intel_${id}`] === true`.
- Uses `factId` from `patternSlots[].factId` (line 123), `reuseStep.factId` (line 132), and `roster.namesFactId` and `roster.patternFactId` (lines 168-169).
- It does not call `grantFact`. It reads only. The guesser never grants facts.
- Its default `globals` is `window.gameState.globalVariables` (`password-guesser-minigame.js:50-51`), or `params.globals` if passed.

### 4.4 Server check
- `social.intelFacts` is shipped in the bootstrap as authored, except feed facts. `docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md:87` says the whole `social` block ships with only capture secrets stripped, so every fact text is in the browser from the first request.
- Feed facts are withheld: `app/models/break_escape/social_feed.rb:306-318` (`withhold_feed_facts!`) deletes each feed fact's entry from `social.intelFacts` in the bootstrap, and keeps the block as an object. `AccessWork.feed_facts(scenario_data)` supplies the ids (line 308).
- The feed fact is then served with its post. `README_scenario_design.md:1444` gives the rule: a feed fact can be granted only by its post. `README_scenario_design.md:1451` lists the validator errors.
- `grantFact` itself is client-side. The server does not check `se_intel_*` writes for ordinary facts. **Unconfirmed** whether the server re-validates `se_intel_*` for any path (a grep found the feed-withhold and the bootstrap, not a grant check).
- Validator: `scripts/validate_social/osint.rb:53-58` requires each `intelFacts` id to have `se_intel_<id>` declared in `globalVariables`, default false, not imported. `scripts/validate_social/board.rb:154-163` checks that a contact revealed by `se_intel_<fact>` names a real fact.
- Npc habits: `lib/break_escape/npc_habits/clues.rb:204-212` reads `social.intelFacts` texts as clue text for the validator and the graph (authoring-time only).

### 4.5 Grants that the server must agree with
- None found for the password-guesser landed global. The guesser writes `landedGlobal` with `writeGlobal` and `stateSync.sync()` (`password-guesser-minigame.js:227-237`).
- `systems/interactions.js:658` reads `se_intel_<id>` to gate an interaction (client-side check).

---

## 5. Log rows

### 5.1 Shape (`log-filter`)
- A row is an object keyed by the `LOG_FIELDS` columns for the log type (`log-filter-minigame.js:45-63`).
- `vpn` row: `{ timestamp, user, ip, country, mfa, result }`. `ics_rdp` row: `{ timestamp, sessionId, account, sourceIp, duration, status, accessLevel }`.
- Anomaly: `anomaly` object. For `vpn`, `anomaly.user` is normalised to `anomaly.account` (line 212-215). Its `position` picks the row index (`_buildSyntheticVpnLog`, line 93-100 area).
- Prior-travel row: `impossibleTravel.priorEntry` (lines ~120-130 of `_buildSyntheticVpnLog`).

### 5.2 Authoring
- Scenario field `logEntries[]` on `scenarioData` or `scenarioData.minigameData` (`log-filter-minigame.js:177-190`).
- `logType` names the schema and filter set. Two shipped examples: `scenarios/sis01_healthcare/scenario.json.erb` (VPN, MG-06) and `scenarios/sis02_energy/scenario.json.erb` (`ics_rdp`, VM-02). The header at `log-filter-minigame.js:7-8` says so.
- Authored rows are used when `logEntries` is non-empty. For `vpn` with empty `logEntries`, rows are generated (see 5.3).

### 5.3 Runtime generation
- Yes, for `vpn` only. `LogFilterMinigame._buildSyntheticVpnLog(data)` (`log-filter-minigame.js:93`) builds 50 rows by default (minimum 10; `entryCount`, line 94) at a fixed cadence from 07:04 (`7*60 + 4` minutes, line 103-107). The users and IPs are fixed arrays (lines 98-104 region). Injected: the prior entry, the anomaly row, and noise rows or a fixed noise row at index 16 (lines 136-156).
- Triggered at constructor when `logType === 'vpn'` and `logEntries` is empty (`:209-215`).
- Date is fixed to `2025-11-03` (`_formatVpnTimestamp`, line 86-90). Note that the project's current date is 2026-11-19, so this is a hard-coded date (**observed**, not a bug claim).
- `ics_rdp` has no generator (grep: no `_build...` for `ics_rdp`).

### 5.4 Where a server-written row could be served from
- Client-side only today. `log-filter` makes no server call (grep for `fetch`, `ApiClient` found none). A server-written row would need a new read path. Candidates in the codebase: the bootstrap (`GET /scenario`, `app/models/break_escape/game.rb:827-906`, per `ACCESS_MODEL_SLICE_9_2_PLAN.md:87`), or a dedicated endpoint like the capture secrets loader (`systems/capture-client.js` and `capture-rows.js:80-110`).
- Capture rows already come from a server-backed loader: `loadCaptureSecrets`, `watchCaptureSecrets` (`capture-rows.js:80-110`). That is the nearest existing pattern. **Unconfirmed** exact endpoint.
- Access rows: `lib/break_escape/access_work.rb` is the server access-model module (named in `README` search, not read in this pass).

---

## 6. Settings and per-player options

### 6.1 What exists
- Display settings: `public/break_escape/js/ui/display-settings.js`.
  - `STORAGE_KEY = 'be_display_settings'` (line 13). Kept in `localStorage` (header line 5).
  - `DEFAULTS = { theme: null, hudStep: 0, zoomStep: 0, healthStyle: 'hearts' }` (line 38).
  - `read()` (lines 42-45) wraps `JSON.parse` in try/catch and falls back to defaults.
  - `getDisplaySettings()` (line 51). `missionTheme()` (line 55). `effectiveTheme()` (line 63). `applyTheme()` (line 71), which sets `<html data-*>`, for example `root.dataset.healthStyle` (line 74-75).
  - `updateDisplaySettings(changes)` (line 78): merges, writes `localStorage` (line 81), dispatches `be:display-settings-changed` on `window` (line 86).
  - Listeners: `ui/npc-influence-pips.js:68`, `ui/npc-health-bars.js:20`, `main.js` (per header line 9).
  - The `theme` key is a UI theme override. A "skin" setting already exists in principle as `theme` (values not read in full; `ui-themes.css` lists `general`, `spy`, `cyberpunk`, `crt`, `eldritch`, `circuit`, `secops`).
- Player preferences modal: `#player-preferences-modal`, opened by `ui/hud.js:134-161` and closed at `hud.js:166-173`. The HUD click handler is at `hud.js:94`. The game menu (`ui/game-menu.js:4`) has a Character page that opens the same modal (`game-menu.js:362`). The game menu has an Audio page (header line 4). Display settings import at `game-menu.js:20`.
- Other `localStorage` uses in `public/break_escape/js/core` and `ui` were not enumerated (**unconfirmed** full list). `grep` showed only `display-settings.js` in `ui/`.
- Server-side per-player settings: not checked (**unconfirmed**).

### 6.2 Where a "skin" toggle could live (facts only)
- Option A, existing pattern: a new key in `display-settings.js` `DEFAULTS` plus `updateDisplaySettings`, applied through `applyTheme()` (`display-settings.js:71`). Stored per browser (header line 5).
- Option B: a server-stored player field. No existing server-side per-player settings endpoint was found in this pass (**unconfirmed**).
- The header comment says these settings "belong to this browser rather than the player" (`display-settings.js:4-5`).

---

## 7. Test tooling

### 7.1 JS test harness copy lists
- The harnesses are `test/js/*.test.mjs` files. Many import `base-minigame.js` or `minigame-manager.js` (for example `test/js/minigame-se-close.test.mjs`, `test/js/social-triage-ui.test.mjs`, `test/js/vm-set-released.test.mjs`, `test/js/social-gap-osint-browser.test.mjs`).
- `bin/test-js` (runs plain `node`): the comment at line 17 says a harness copies a slice of `public/break_escape/js` into a temporary directory and imports from there.
- The copy list itself was not read in this pass. **Unconfirmed**: the exact array name and file. Repo memory note: a new static import in an engine JS module must be added to each harness copy list, or node tests fail with `ERR_MODULE_NOT_FOUND` (user memory `js-test-harness-copy-list.md`). Planners should grep `bin/test-js` and `test/js` for the list before adding a module.

### 7.2 `window.__test` bridge
File: `docs/test-bridge.md` (outline below; line numbers from the headings).
- Two rules (line 28): actions simulate real input. Exceptions: `moveTo()` (line 61), `minigame.completeLockpick()` (line 115), `debugKO(npcId)` (line 115-ish, see heading list).
- Waits are deterministic (line 156).
- `getState(opts?)` (line 168): overworld and minigame state.
- Sections: `activeMinigame` (line 240), `blockingUi` (252), `missionEnd` (281), `interactionMenu` (324), main-world actions (366), waits (388), diagnostics (403), access model (430), minigames (464).
- Minigames section (line 464): "The contract" (470). Containers nest (489). Lockpicking (502). Actions (544). Fingerprint dusting (573). Dialogue choices by pattern (593). Driving the social overlays (643). VM flags (668).
- Interaction range section at line 1278.
- Most-used calls in scripted playtests (from the playtest skill, not read in this pass): `clickText`, `type(index, value, { submit })`, `clickControl`, `close`, `getState()`, `__test.minigame.getState()`. The base class mentions `clickText("<name>")` and `type(0, "<password>", { submit: true })` in its own `entryHint` strings (`password-minigame.js:121`, `:130`). **Unconfirmed**: the full call list.
- Base-class hook: `getTestState()` (`base-minigame.js:510`) is the read-only snapshot. `getTestControlElements` and `getTestFieldElements` (lines 467, 480) index the controls and fields so `clickControl(i)` and `type(i, ...)` match `getState()`.

### 7.3 Minigame unit tests
- `test/js/*.test.mjs` (Node). Examples named above.
- Model tests (pure modules) are the pattern: `password-guesser-model.js` says "The scene and the Node tests build on it" (`password-guesser-model.js:2`).
- Test for the social overlay: `test/js/minigame-se-close.test.mjs` (name only, not read).
- Ruby tests for scenario validation: `scripts/validate_social/*.rb` (used by the validator; see 4.4), `test/unit/*.rb`.

---

## 8. Extension points and constraints

### 8.1 A new minigame
- Extend `MinigameScene` (or `SocialOverlayScene` for a social overlay). Set the static flags you need (section 1.1).
- Register with `MinigameFramework.registerScene` in `index.js` (section 1.4). For a self-registering module, follow the pattern at `index.js:120` and `:122`.
- Add it to the JS test harness copy list if it adds a static import (section 7.1).
- Use `this.addEventListener` for every listener. Use `textContent` for authored or server text, or `plainText` for `showFailure`/`showSuccess`.
- Call `complete(success)` once. Use `closeResult()` in a social overlay. A `returnTo` needs `params.returnTo` set by the parent, not by the child.
- Write state with `window.npcManager.setGlobalVariable` (design doc step 4). The password-guesser uses `writeGlobal` from `systems/global-writer.js` instead (`password-guesser-minigame.js:29`).
- Constraint: no runtime LLMs (user memory). Keep text authored.
- Constraint (framework): a minigame cannot open while the player is knocked out (`minigame-manager.js:51`).
- Constraint (framework): only one minigame at a time. A new one displaces the running one unless the running one is `suspended` (`minigame-manager.js:70-100`).

### 8.2 A second renderer for an existing view
- The base class `getTestState()` reflects the DOM generically (`base-minigame.js:510-552`), so a second renderer gets a usable test snapshot for free, if it keeps `container` as its root.
- A separate renderer on the same scene: the `consoleWindow` flags and the 9-slice theme are keyed on the scene's CSS class (`base-minigame.js:81`, `ui-themes.css` keyed on `data-ui-theme`). A second skin needs its own `[data-ui-theme]` rules or a class on the container.
- Display setting: a skin toggle has a home in `display-settings.js` (section 6.2). It dispatches `be:display-settings-changed` (`display-settings.js:86`), which listeners can react to (`npc-health-bars.js:20`).
- `container.dataset.minigame` (`minigame-manager.js:178`) is the hook the theme CSS uses for tool windows.
- The network view is opened only from `systems/network-links.js` (`index.js:180`). A second view for it would need the same starter path.

### 8.3 A server-backed minigame result
- The pattern in the codebase: the minigame calls an `ApiClient` method, and the server decides. Examples: `password` calls `POST /unlock` (section 3.2). Capture rows call a loader (section 5.4).
- Server validation is in `GamesController#unlock` (`games_controller.rb:1211`) through `Game#validate_unlock` (`game.rb:4597`).
- The client must not hold the answer. Feed facts are withheld until their post is out (`social_feed.rb:306-318`). The same care applies to any new server-held result.
- Client-written results that the server does not check (password-guesser landed global, log-filter completion, siem `siem_triage_completed`) are not server-validated (section 3 entries, **unconfirmed** for the siem path).
- Results travel to the server through `window.stateSync.sync()` (`password-guesser-minigame.js:233`, `social-intel.js:73`). The state sync runs every 30 s (`docs/achitechture/minigame-design.md:54`).
- For a server result, the existing endpoint shape is `ApiClient.post(endpoint, data)` (`api-client.js:34`) with `ApiClient.unlock` as the model (`api-client.js:108-123`). It also applies `serverGlobals` and `serverCompletedTasks` from the answer (`api-client.js:116-121`).

### 8.4 Known constraints from the code
- Esc and the X close a minigame by default (`base-minigame.js:318-330`). A scene that needs Esc for its own use must set `disableClose` or implement `handleEscapeKey`.
- Text fields in a minigame need `requiresKeyboardInput: true` so game keys are paused (`minigame-manager.js:111-135`).
- Touch pointers can be left held after a minigame closes (`minigame-manager.js:531-534`), and `releaseHeldTouchPointers()` clears them (`:696-717`).
- Focus is trapped inside a modal minigame. A VM console iframe is outside the trap (`minigame-manager.js:245-247`).

---

## 9. Unconfirmed list (for the planner to check)

1. Purpose and params for `text-file`, `notes`, `authenticator`, `command-board`, `assistant-chat`, `intel-board`, `capture-log`, `siem-dashboard` (section 3). Structure only.
2. Whether any server path re-checks `se_intel_*` or `landedGlobal` (section 4.4).
3. Whether `params.password` for a lock is sent to the browser (section 3.2).
4. The exact copy-list array in `bin/test-js` and `test/js` (section 7.1).
5. The full `window.__test` call list used in playtests (section 7.2).
6. The CSS 9-slice frame contents and font stacks in `ui-themes.css` and `minigames-framework.css` (section 2.2).
7. Whether `ehr-terminal`, `network-view` or any other existing minigame has a terminal or command-line look (section 3.12). The grep for `terminal`, `console`, `cli`, `prompt` under `public/break_escape/js` returned many hits, mostly `console.log` and the `consoleWindow` flag. None was a command-line skin.
8. Scenario lists for `password-guesser`, `password`, `siem-dashboard`, `intel-board` (not grepped).
9. Per-player server settings (section 6.1).
10. The line of `password-minigame.js` for `validatePasswordWithServer` and `emitPasswordFailed` (approximate, section 3.2).
11. Whether `docs/achitechture/UI_CONSOLES_REVIEW_R2.md` holds the console UI rules (section 2.1).
