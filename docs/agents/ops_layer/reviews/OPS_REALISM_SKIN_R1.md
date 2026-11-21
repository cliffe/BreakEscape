# OPS_REALISM_SKIN_PLAN review, round 1

Reviewer: Opus 5.5, adversarial, 2026-11-19. Plan: `docs/achitechture/OPS_REALISM_SKIN_PLAN.md`
(621 lines). Standard: `docs/agents/OPS_LAYER_BRIEF.md` sections 2, 3, 5, 7, 8; outline S6.

Grades: blocker, major, minor, nit. "Plan" line numbers refer to the plan file; code pointers are
in the worktree.

(Findings appended below as each check completes.)

## Check 1: binding decisions (1, 4, 5)

### B1 (blocker). The parity proof assumes one control per intent; the core's Use interaction breaks it

Plan 11.2 step 1 (lines 444-446) requires the set of `data-intent` values on Panels controls to
equal `availableIntents(vm)`, and `network.do(intent)` (line 506) to perform each intent with
"real input". The core plan's Panels interaction for S3 is not one control per intent: "The
player drags a card to a confirmed finding, or selects the finding and presses Use on a card"
(`OPS_CORE_PLAN.md:77-79`, `:318-322` "Select a finding, then a card, then Use"). A drag and a
selection state carry no `data-intent`; the Use button's meaning depends on what was selected. So
either test 1 fails, or the core must render one Use control per (card, finding) pair, which it
does not plan. A Panels-only path that is not an intent is exactly the "skin adds or removes a
move" hole decision 5 forbids, and the parity test would not see it.

There is a second gap of the same kind: what `availableIntents` contains for `use`. The core's
server refuses with `not_confirmed` and `false_positive` (`OPS_CORE_PLAN.md:280-281`), which
implies Panels can send Use on an unconfirmed or false finding. If `availableIntents` offers only
confirmed pairs (plan 5.2 dispatcher step 1, line 200), the Terminal can never reach those
refusals, and the `technique_refused` log rows (core 13) differ between skins.

Fix: define `availableIntents` as the one source the Panels renderer is built from (Panels draws
nothing that is not an intent), and state for `use` exactly which (item, finding) pairs are
offered (recommend: every held card against every finding row the player can see, whatever its
status, so both skins reach every refusal). Model Panels' selection and drag as local UI state
that ends in dispatching one complete intent, and make the parity test drive the Panels path
through that real UI (select, then Use; and drag) rather than a per-intent button. Raise this
with the core plan as a cross-plan request.

### M1 (major). `MOVES` stays a renderer detail only if it stops being a cross-plan registry

The parked idea is "a shared model of moves as data" with needs, effects, time and noise, and a
plan to "bring both the ops layer features and the older built moves under it"
(`ACTORS_AND_DEFENCE_PLAN_OUTLINE.md:16-19`, `:24-33`). The plan's `MOVES` table holds labels,
verbs, target kinds and a handler (plan 169-186) and no needs or effects, and the server never
sees it (plan 337-338). That part is presentation and is fine. Three things push it toward the
set-aside idea:

- Cross-plan requests 1 and 7 (plan 568-571, 585-587) tell the core, privilege, cracking and MFA
  plans to add their moves as rows in `MOVES`, and section 3 (110-113) asks for build order to
  change so that S1 to S3 are written into it. That is a shared move registry other features
  must register with, which is decision 1's "no shared registry of moves".
- The plan makes "move" and "intent" code, schema and test vocabulary (plan 11-15), the same
  words the parked outline uses, and line 186 makes the table the gate ("a move that is not in
  the table cannot be drawn").
- `dispatch(intent)` is one client-side act function for every move (plan 198-206). It sends to
  separate routes, so the server rule holds, but it reads as the "single act" shape.

Smallest design that still guarantees parity: one pure function in the network-view folder,
`offers(vm)` (or keep `availableIntents`), that turns the server's rows into a list of
`{ action, rowId, args, label }` using today's `data-action` names (`sign-in`, `open`,
`observe`; `network-view-minigame.js:215-232`). Both renderers draw that list and nothing else.
The scene maps `action` to today's methods (`act`, `unplugBox`) and the core's calls. The table
is private to `minigames/network-view/`; other plans add a row type and an action to the scene as
they would anyway, and the skin plan's own tests catch anything they forget. Call it "command" or
"offer" in code, not "move", and keep it out of the schema. Drop requests 1 and 7 as written and
replace them with "a new network-view action is offered through `offers(vm)`; there is no other
way to draw a button". The parity guarantee then comes from both renderers consuming one list,
which is what the plan's tests actually check.

### M2 (major). Parity covers moves but not information; the sentinel test is one way

The sentinel test (plan 425) proves the Terminal prints nothing that is not in the view-model.
Nothing proves it prints everything Panels shows. A mission solvable in Panels can depend on
text the Terminal omits: the locked-share note (`network-view-minigame.js:126`, `:727`), the
"Session kept" line and down tags (`:94-96`, `:676`), the "through X (Locked)" route note
(`:626`), the link-off and stale texts (`:102-104`), `message` and the observe `notice`
(`:751`, `:876`), the unplug refusal notice (`:850`), and the core's needs ticks, `falseBecause`
and the works-on line (`OPS_CORE_PLAN.md:70-73`, `:319-321`). If any of these is dropped, the
claim "no playtests needed" (plan 56-58) fails silently.

Fix: add the reverse test. For each fixture, collect every marker string the Panels renderer
puts in the DOM (by `textContent`) and assert each appears in the Terminal's output after `show`
and after each result. List in section 5.3 which view-model fields each Terminal layout prints.

### m1 (minor). The `MOVES` one-to-one test contradicts the plan's own table

Plan 426: "no verb or alias maps to two moves". The table (173-182) maps `scan` to both
`scan_network` and `scan_host`, and `open` to both `open_session` and `open_share`. Either the
test fails as specified or the rule is "verb plus target kind maps to one move". Fix: state the
rule as (verb, target kind) and test that.

### m2 (minor). Decision 4: the table headers copy a real scanner's columns

Plan 246 fixes `HOST STATE NAME` and `PORT STATE SERVICE VERSION`. The second is a well-known
real scanner's header word for word, which is option (c) of the plan's own question 3 (603),
while the recommendation is (a). This may be what the user wants (it teaches reading the real
table), but it should be an explicit sub-choice in question 3, not settled in 5.3. Likewise
question 4's staged form (`use`, `set target`, `run`) is a real framework's grammar; fine as an
open question.

### m3 (minor). Decision 5 and the live parity run

Decision 5 says the skin "needs no playtests of its own". Plan 11.2 (455-470) and K4 (108) run
three live games each on four scenarios, which is a playtest in all but name and makes S6's
finish depend on three scenarios owned by another plan. The node parity test is the real
guarantee. Fix: keep the live parity run on `test_ops_skin` only, as S6's live proof under the
brief's section 3 rule; make the other three optional and say so. Also see m10 on fragility.

## Check 2: fit with the code (the plan's unverified items, and its claims)

### Verified items, what is true

| Plan's unverified item | What the code says |
|---|---|
| Tab-cycle hook (plan 82, 276-277) | Exists. The trap is one capture-phase listener in `minigames/framework/minigame-manager.js` (not `minigames/minigame-manager.js` as the plan and D3 say), comment `:236-247`, check `:367`: it steps aside when `document.activeElement.closest('[role="listbox"], [data-own-tab-cycle]')`. It is re-tested on every Tab, so toggling the attribute on the input as its text changes works. Because the trap runs in the capture phase and returns early only on that attribute, the input's own Tab handler cannot pre-empt it by `preventDefault`; the attribute is the only way. One existing user: `person-chat/person-chat-pretext.js:567`. |
| Keyboard pause and restore on a live switch (plan 303-306) | `window.pauseKeyboardInput` / `resumeKeyboardInput` are a single boolean (`core/player.js:102-123`, exported on window `:1545-1546`). The manager pauses at start when `requiresKeyboardInput` (`minigame-manager.js:111-131`) and **resumes unconditionally** in `endMinigame` (`:510-512`). A scene may pause itself on mount: `pretext-prep-minigame.js:90-94` does exactly that. Also: while any minigame is open, `player.js` already ignores game keys (`keysBelongToUi`, `core/player.js:295-299`, `:318-322`), and the manager disables Phaser's keyboard (`minigame-manager.js:139-143`). So typing in the prompt is already safe without the pause; the pause adds belt and braces. See m4. |
| Bootstrap passes an unlisted top-level key (plan 349-351) | True. `filtered_scenario_for_bootstrap` deep-dups the scenario and deletes named keys only (`app/models/break_escape/game.rb:2393`, `:2465-2508`); the controller then strips `requires` and `_` notes and adds `formatVersion` (`games_controller.rb:313-335`). A new top-level `networkView` passes. |
| Console font size (plan 285) | There is no VT323 size in the shared console. `minigames-framework.css:290-292` sets VT323 only on `code, kbd, samp` with no size; the body font is GNF (`:27` 18px, `:286`). The network view inherits 18px from `.network-view` (`network-view-minigame.css:10`) in GNF. See m5. |
| A CSS source to share (plan 93-94, 542-543) | `ehr-terminal-minigame.css` (302 lines) uses GNF and Press Start 2P, not VT323, and a hard-coded palette (`#071430`, `#0c1f43`; zero `var(--` uses). Little to share beyond the panel flex layout. See m6. |
| On-screen keyboard on phones (plan 302) | No `visualViewport` handling exists anywhere in `public/break_escape/js`. The one precedent is `utils/pc-monitor.js:218-226`: the frame keeps one size, the keyboard pans the visual viewport, and the field is kept in view with `scrollIntoView`. The plan should adopt that precedent rather than promise "the prompt stays on screen above the keyboard". Still needs a device check at build. |

Claims about `network-view` and `display-settings.js`: the line pointers in plan section 2 hold
(scene `:249-253`, `links()` `:287`, `load` `:403-405`, delegates `:314-333`, `unplugBox`
`:829-852`, `act` `:870-896`, `getTestState` `:920-954`; `display-settings.js:13, 38, 63-69,
78-87`; `game-menu.js:19, 181, 198-204`). Exceptions follow.

### M3 (major). `?net_skin=` precedence makes the header switch do nothing, and breaks the session tag

Plan 137-138 puts the URL value above the player's pick, copying `effectiveTheme()`
(`display-settings.js:63-69`). For the theme that is harmless, because the theme picker is in the
menu. For the skin, the switch in the header writes the pick (plan 211-212), and the URL still
wins, so in any `?net_skin=` session (every `--net-skin cli` run, plan 522-523, and every
preview) the switch silently does nothing. The parity run C ("switching skin after each step",
459) cannot run under a URL value either.

Also `tools/playtest/session-start.sh:26-31` takes the session tag from a `--url` that ends in
digits (`grep -oE '[0-9]+/?$'`); appending `?net_skin=cli` makes it fall back to the PID, so the
named pipes no longer match the run.

Fix: the URL value sets the starting skin for the page; a press of the switch overrides it for the
rest of the page (an in-memory override above both), and writes nothing while a URL value is
present. Add `--net-skin` to the tool by appending the query after the tag is taken, or pass it
as a separate value the browser launcher adds.

### m4 (minor). Keyboard: drop the start-parameter split, pause on mount

Plan 303-306 starts the scene with `requiresKeyboardInput: true` only when it opens in `cli`, and
calls pause and restore on a live switch. Two problems in the code: (a) the scene is started from
one place with no keyboard parameter (`network-view-minigame.js:969-974`), and it comes back from
the sign-in screen and share container through the same starter, so a view opened in Panels and
switched to Terminal comes back unpaused; (b) calling `resumeKeyboardInput` on a switch to Panels
while the view is still open is pointless (game keys are already ignored, see table) and races
with the manager's own resume. Fix: the Terminal renderer calls `window.pauseKeyboardInput()` in
`mount` (the `pretext-prep` precedent); nothing resumes on a switch; `endMinigame` resumes on
close as it does for every scene. No change to the start parameters.

### m5 (minor). Font size is a decision the plan has not made

There is no "size the shared console already uses for VT323" (table above). Pick one in the plan
(VT323 at a size that is crisp at the game's pixel scales; the network view's body is 18px today)
and check it in the K2 screenshots at desktop and phone widths. The quick-command buttons use
`.minigame-button`, whose font is GNF; say whether the Terminal changes that to VT323 (the plan's
5.4 says VT323 for quick commands, which conflicts with "use the existing `.minigame-button`
look").

### m6 (minor). The Panels skin is not themed today; "colours from ui-themes tokens" makes the skins differ

Plan 28 says Panels is drawn "in the look of the mission's UI theme", and 5.4 (290) says the
Terminal takes colours from `ui-themes.css` tokens. `network-view-minigame.css` uses no
`var(--` at all (colour `#e8eef2` hard-coded, `:9-10`); the tokens exist (`--ui-text`,
`--ui-surface`, `--ui-accent`, `--ui-line` in `ui-themes.css`). A themed Terminal beside an
unthemed Panels breaks "one look per concept" (plan 289). Fix: either both use the view's
existing hard-coded palette, or K2 themes both (and Panels' screenshots change, which is a
visible change to existing scenarios: say so in section 10). Correct the claim on line 28.

### m7 (minor). `game-menu.js` needs more than "one select"

The change handler parses every key that is not `theme` or `healthStyle` with `parseInt`
(`game-menu.js:197-201`), so `networkSkin` would be stored as `NaN`. The reset writes an explicit
object (`:203-205`). Fix: name both changes in step 2, and add a "Mission default" option for
`null` as the theme select has (`:170-171`).

### m8 (minor). Every switch fires a canvas resize

`updateDisplaySettings` dispatches `be:display-settings-changed` (`display-settings.js:86`) and
`main.js:354` answers it with `handleResize`; `npc-health-bars.js:20` and
`npc-influence-pips.js:68` also listen. A skin switch therefore re-runs pixel scaling behind the
open view. Probably harmless, but the plan should either accept it (and say so) or give the skin
its own setter that writes storage without the event.

### m9 (minor). A new CSS file needs a link tag

Plan 542 adds `public/break_escape/css/network-view-cli.css`. Stylesheets are listed one by one in
`app/views/break_escape/games/show.html.erb` (network view at `:103`). Add the link (or put the
rules in `network-view-minigame.css`, which avoids the extra file). The UI audit tool
`tools/playtest/ui-rules-audit.mjs:213-214` does not audit the network view today; say whether
the Terminal surface is added to it.

### m10 (minor). The live parity comparison is fragile as specified

Plan 461-466 compares, across three live games, every request and response and then globals and
log rows. The view refetches every 5 to 15 s (`network-view-minigame.js:86-90`), so the request
streams interleave differently; office life, timers and NPC needs (`systems/npc-needs.js:18`) set
globals on wall-clock time, so "the globals the moves set" are not separable from the rest
without a list. Fix: compare only the POSTs the dispatcher sends (method, path, body) and their
answers, and at the end only the access and ops keys (`footholds`, `sessions`, `opsDiscovered`,
`opsFindings`, `opsUsed`, keyring entries) plus log rows filtered to the network events.

### m11 (minor). The dispatcher's local refusal changes Panels behaviour in K1

Today a click looks up the row by id and calls `act(row, btn.dataset.action)` with no check
beyond `status === 'ready'` (`network-view-minigame.js:317-325`, `:870-872`). K1 adds "refuse an
intent that is not in `availableIntents(vm)`" (plan 200-202) to the Panels path. A click on a row
whose action changed in a refetch between draw and click was sent before and is now dropped. That
contradicts K1's "no visible change" (plan 105). Fix: say K1 adds the check only on the Terminal
path, or accept and test the change explicitly.

### n1 (nit). Path of the minigame manager

Plan 81-82 and 305 cite `minigame-manager.js` as if under `minigames/`; it is
`minigames/framework/minigame-manager.js`. The pointers are otherwise right.

## Check 3: project rules

### m12 (minor). Test harness copy lists: name them now, and the scene's new import

Five node harnesses copy `network-view-minigame.js` today: `test/js/network-view.test.mjs:25-35`,
`pc-monitor-frame.test.mjs`, `escaping-shared-helpers.test.mjs`, `minigame-consoles-fit.test.mjs`,
`app-mode-exit.test.mjs`. Each needs the five new modules (the plan says "six new modules",
plan 558, but lists five JS files and one CSS file). If the scene imports `ui/display-settings.js`
to read the skin, that module goes on all five lists too; it reads `localStorage` at import
(`display-settings.js:40-49`) and `window.location` in its getters, so each harness must stub
both. Fix: list the five harnesses in section 12, and prefer passing the effective skin into the
scene from the starter so the scene does not import `display-settings.js` at all.

### m13 (minor). Existing scenarios: seven get a visible button, and only one is rechecked

Seven scenarios declare `networks`: `ca20_remote_and_mobile_working`,
`ca20_remote_and_mobile_working_defend`, `demo_access_tour`, `test_access_keyring`,
`lab_physical_pentest`, `test_access_networks`, `test_access_devices`. K2 puts a new header
button in all of them (plan 403). The brief says existing scenarios "behave exactly as before"
(brief 61-62). The plan admits the change but decides it silently, and its proof (plan 412-413)
reruns only `test_access_networks`. Fix: add an open question (switch in the header for every
network, or only in the game menu unless the scenario sets `networkView`), and rerun the
`PLAYTEST.md` network steps of all seven with no stored setting.

### m14 (minor). Playtests by number: no current step breaks; the real risk is selectors

A grep of every `scenarios/*/PLAYTEST.md` and `tools/playtest/*.mjs` finds no numeric
`clickControl(n)`; existing network steps use `clickSelector` on
`[data-host-id="…"] [data-action="sign-in"]` (`scenarios/test_access_networks/PLAYTEST.md:78`,
`:91`). So the admitted break (plan 519-521) is acceptable: report it as checked in the plan, not
left to the builder, and add one bridge rule: `clickControl(n)` in the network view is not stable
and the bridge doc says to use labels or `network.do`. Two real risks remain:

- Quick commands must carry today's `data-action` values (`sign-in`, `open`, `observe`), not move
  names (`signin`, `look`), or these selectors fail under `--net-skin cli`. Say so in 5.3.
- `clickControl` by label tries exact, then prefix, then substring
  (`systems/test-bridge/minigames.js:111-118`). A quick command reads "Sign in  signin fin-pc01",
  so `clickControl('Sign in')` falls to the prefix match and takes the first host. Same as
  Panels only if the orders match; state that quick commands keep view-model order (plan 240
  does) and test it.
- Once the core adds Scan, Check and Confirm, a host holds several controls, and
  `selector: [data-host-id] [data-action]` in `getTestState()` (`network-view-minigame.js:935`,
  `:946`) matches more than one in either skin. That is the core's problem too; raise it.

### Text and escaping: no finding

Plan 196 and 250-252 meet the rule: authored and server text via `textContent` in the Terminal,
`escapeHtml` in Panels (as today, `network-view-minigame.js:57`). The hostile-input grammar test
(plan 424) is good. One addition: "did you mean" and the unknown-target answer echo the player's
own line; name them in the hostile-input test.

## Check 4: mismatches with `OPS_CORE_PLAN.md` (sections 0, 5.5, 6, 13, 14)

### M4 (major). Move names, targets and route parameters do not match the core

| Skin plan assumes | Core plan says | Effect |
|---|---|---|
| `scan_network`, label "Scan", verb `scan`, target "none (the link's networks)" (plan 173) | The move is **Sweep**, on a **network block**, `POST /network/scan` with `network_id` (`OPS_CORE_PLAN.md:61-62`, `:345`); a sweep of an open network is refused 422 `not_needed` (`:345`) | Label and verb become `sweep` under the plan's own "verb is the label" rule (184); a target is needed when several discovery blocks are in reach; open networks must not offer it. T2 (plan 490) works only on a discovery network |
| `scan_host`: `scan <host>` | Same route, `host_id`; host's network swept or open, host responding (`:345`) | Fits |
| `check <host> <service>` | `host_id`, `service` (the service `name`, unique on its host; a `label` may differ, `:23`) | Fits if the target is `name`; say which of `name`/`label` the Terminal shows and accepts |
| `confirm <finding>`, finding has "a short display name unique within the view" (plan 573-574) | A finding has no display name: id `<hostId>.<serviceName>.<weaknessId>`, plus `class`, `severity`, `summary` (`:24-26`) | Typing the full id is unworkable, and printing raw ids shows author-chosen weakness ids Panels may not show (the core warns about telltale ids, `:376`). Use row numbers and `<host> <service> <n>` |
| `use <technique> <finding>` | `POST /network/technique` takes `finding_id` and **`item_id`** (the held card), not a technique id (`:348`, `:277`) | The target must resolve to a held item; two cards with one technique, and technique names with spaces, need rules. The card list comes from the inventory plus the `techniques` map (`:318-320`), so `buildViewModel(view)` needs the held items as a second input |
| Scene emits `network_viewed` and `network_host_opened` only (plan 194-195, parity check 3 at 450) | Core adds six events: `network_swept`, `network_host_scanned`, `network_service_checked`, `network_finding_confirmed`, `network_technique_used`, `network_technique_refused`, each also as `<name>:<id>` (`:325-329`) | Add them to the scene-emits list and to parity check 3 |
| A refusal's text is the server's `reason`, plain text (plan 355); request 5 asks every route for "a plain-text `reason`" (580-582) | `reason` values are fixed codes (`unreachable`, `not_needed`, `not_responding`, `not_confirmed`, `false_positive`, `fixed`, `wrong_class`, `wrong_product`, `wrong_version`, `need_unmet` + `need`), and the texts live in the client module `ops-model.js` (`:280-282`, `:323-324`, `:487-488`) | Both renderers must map codes through the core's one text table; drop request 5's "plain-text" wording |
| A new pure `network-view-model.js` holds the view-model (plan 162) | Core adds its own pure `network-view/ops-model.js` for row merging, need labels and refusal texts (`:323-324`), and wires its buttons directly in the scene (`:316-322`) | Two view-model modules for one view. Agree one: the skin's model consumes `ops-model.js`, or the core writes into the skin's model. This is the real content of request 1 and needs the orchestrator |
| Seeds must not depend on game id (request 3, 576-578) | "No rolls anywhere" (`:333-336`) | Request 3 is moot for the core; restate it for plans that roll, or drop it |
| S5 escalate and S7 dump add rows (plan 185) | Escalation is an ordinary `use` with `needs.session` (`:482-484`); the privilege plan names no network-view move | Remove the guess |
| Result shape: one body per move (request 5) | Sweep answers `{ network: { id, hosts } }`, scan `{ host }`, check `{ hostId, service, findings }`, confirm `{ finding }`, technique a session answer or `keyringChanged: true`, repeats `already: true` (`:345-348`, `:298-301`) | The formatter needs one layout per shape, and the session grant is a hand-over (the desktop opens), which `result.data` must model |

### m15 (minor). Build order is a cross-plan conflict, not only an open question

The skin asks for K1 before S1 (plan 110-113, question 8). The core's 5.5 already designs its
client inside today's scene and its own module. If the user keeps the outline order, K1 grows to
M (plan 113) and has to move the core's selection-and-drag Use UI (B1). Put the conflict in the
orchestrator's cross-plan list now, with the user's choice in question 8.

## Check 5: template, stage testability, silent decisions

All 15 template sections are present. Findings:

### M5 (major). K3 cannot be proved without K4's bridge

K3 "ends playable when the `test_ops_skin` beats pass in both skins" (plan 107), but the bridge
that drives the Terminal (`window.__test.network`, `network.do`) lands in K4 (plan 108, 501). K2's
"a player can do everything in `test_access_networks` from the prompt" (plan 106) has no stated
proof at all: no scenario of its own and no bridge. Fix: move `__test.network` (at least `state`,
`do`, `setSkin`, `log`) and `--net-skin` into K2, and give K2 its own beat list run on
`test_access_networks` under `--net-skin cli`.

### m16 (minor). Decisions taken silently

- The header switch in every existing network scenario (m13).
- The default skin lives in scenario JSON, while the per-mission presentation choice that already
  exists, `ui_theme`, lives in `mission.json` (`show.html.erb:3`, `display-settings.js:6-7`). Either
  fits; it is a choice for question 1 or 5.
- Real-tool table headers (m2).

### n2 (nit). Question 5's default and question 6 overlap

Question 6 (quick commands visible) is also what makes the parity selectors work (plan 241-243,
515-517). If the user picks "hidden", the test hooks change. Say so in question 6.

## Counts

Blocker 1 (B1). Major 5 (M1 to M5). Minor 16 (m1 to m16). Nit 2 (n1, n2).
