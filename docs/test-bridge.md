# The Test Bridge (`window.__test`)

A development-only surface that lets an automated client (Playwright, an AI agent)
play Break Escape end to end — walking to things, opening doors, picking up items,
talking to NPCs, driving minigames — without reading screenshots or guessing pixel
coordinates.

**Source:** `public/break_escape/js/systems/test-bridge/`
**Loaded from:** `public/break_escape/js/main.js`, gated on `breakEscapeConfig.testBridge`

```erb
<%# app/views/break_escape/games/show.html.erb %>
testBridge: <%= Rails.env.production? ? 'false' : 'true' %>
```

```js
// main.js — dynamic import, so production never fetches or parses the bridge
if (window.breakEscapeConfig?.testBridge) {
    import('./systems/test-bridge/index.js').then(({ installTestBridge }) => installTestBridge());
}
```

Everything crossing the boundary is plain JSON. No Phaser object, DOM node or
function is ever returned, so results survive Playwright's structured clone.

---

## The two rules

### 1. Actions simulate real input

Every action ends in a synthetic DOM event dispatched at the exact place a human's
event lands. The bridge never calls game logic directly — no `handleObjectInteraction(obj)`,
no `player.setPosition()`, no `dialogueManager.open(npc)`, no `objectivesManager.completeTask()`.

Shortcutting the input path would mean the range checks, collision, interaction-mode
switching and state transitions under test never run, and a passing test would prove
nothing about the game.

| Input | Where the game listens | What the bridge dispatches |
|---|---|---|
| Movement / interaction clicks | `scene.input.on('pointerdown')` in `core/game.js` | `mousedown`/`mouseup` (+ pointer events) on the game canvas |
| Interact key, WASD, arrows, shift, space | `document.addEventListener('keydown')` in `core/player.js` | `KeyboardEvent` on `document` |
| Dialogue continue / choose | `window` keydown in `person-chat-minigame.js` (space, `1`–`9`) | `KeyboardEvent` on `document` (bubbles to `window`) |
| Minigame overlays (DOM) | element listeners in each minigame | full `pointerdown`/`mousedown`/`mouseup`/`click` sequence on the real element |

Two engine details the bridge has to respect, both of which silently swallow input
if you get them wrong:

- **Phaser 3.60 binds `mousedown`, not `pointerdown`.** Dispatching only
  `PointerEvent`s fires the DOM event and is then ignored by the engine — the
  scene handler never runs and the player just doesn't move.
- **Phaser 3.60's `Pointer` reads `pageX`/`pageY`**, not `clientX`/`clientY`.
  Omit them and the click resolves to the wrong world position.

> A previous `walkthrough-automation.js` did the opposite of all this — it set globals
> and called `completeTask()` directly, bypassing the systems under test. It has been
> removed in favour of this bridge. If you find yourself adding a "just set the flag"
> helper here, that is the thing that was deleted.

### 2. `moveTo()` is the one documented exception

Pathfinding is a feature under test, not a shortcut around one, so `moveTo` is
allowed to reach past raw input. In practice it usually doesn't need to:

- **On-screen destination** — issues a real canvas click. The game's own
  `pointerdown` handler runs EasyStar, smooths the path and drives the player,
  including the on-screen click indicator. Click-to-move is this game's primary
  movement method, so this is both the realistic path and what makes an automated
  run watchable.
- **Off-screen destination** — a pointer event cannot express a point that isn't on
  screen, so the bridge calls `movePlayerToPoint(x, y)`: the exact function the
  `pointerdown` handler itself calls, one layer in.

**In both cases the player is moved by the normal per-tick physics/movement step in
`updatePlayerMovement()`. It is never a teleport.** Do not "simplify" this into
`player.setPosition(x, y)` or `player.body.reset(x, y)` — that removes the only thing
the function proves.

### 3. `minigame.completeLockpick()` is the second exception

Picking a lock is a pure dexterity mechanic: whether a pin has set is conveyed by
pixels and feel, so an agent cannot perceive it, never mind perform it. It is the one
place where "can a machine do this" and "does the game work" come apart completely —
the manual skill *is* the content, and it is not what a scenario playtest tests.

So, in pick mode only, the bridge may complete the lock without performing the pick.
It skips the input that cannot be expressed and keeps every consequence — the same
shape of exception as `moveTo`.

What it does **not** skip:

| Guard | Why |
|---|---|
| The lockpicking minigame must already be open in pick mode | The game itself has already decided this lock is pickable, here, now |
| The player must be carrying a lockpick kit | Checked against inventory with the same test as `unlock-system.js` — not assumed from the overlay being open |
| `keyMode` is refused outright | A key lock is one `clickCanvas(keyTarget)`; it must be driven properly |
| Completion runs the minigame's own `complete(true)` | Exactly what a successful pick calls, so the unlock, server notification, rewards, objectives and any watching NPC all run identically |

It returns `assisted: true`. **Report such a step as PASS (assisted), never a plain
PASS** — it verifies the unlock's consequences and nothing about the pick.

Do not widen this into a generic `forceComplete()` for other minigames. Every other
minigame here is drivable through real input, and a general escape hatch would quietly
stop testing them.

### 4. `debugKO(npcId)` is the third exception

Beating a hostile NPC is a dexterity mechanic for the same reason picking a lock is:
landing hits depends on timing and positioning that synthetic input cannot reliably
perform. The practical effect is worse than a failed step — the NPC wins, the player
is knocked out, and everything gated behind that NPC becomes untestable. In m01 the
ENTROPY Launch Device sits in Derek Lawson's `itemsHeld` and is released only by
beating him, so the launch-code path could not be reached by any automated run.

`{"cmd":"debugKO","id":"derek_lawson"}` KOs an NPC without fighting it.

**A peaceful NPC is a valid target.** The player can attack anyone: when a punch
lands on a non-hostile NPC, `player-combat.js` converts it to hostile and then
damages it, so a KO needs no `#hostile:` ink tag and no `behavior.hostile` config.
`debugKO` does the same conversion rather than refusing, and marks the result
`convertedFromPeaceful: true` with a `via` string saying so — report those as PASS
(assisted) like any other, and never as an NPC that was already hostile.

This used to refuse with `not-hostile`, and that refusal was misread as proof that
the `taskOnKO` fallbacks on m02's receptionist and ward nurses were dead code. They
are not: KO'ing the receptionist sets `receptionist_ko` and completes
`sign_in_at_reception`, both persisted. If a KO declaration looks unreachable, check
the engine before concluding it is dead.

What it does **not** skip:

| Guard | Why |
|---|---|
| The NPC must exist in the scene | Returns `unknown-npc` — it will not register combat state for a typo |
| An already-downed NPC is refused | Returns `already-ko` rather than re-running the consequences |
| Damage goes through the real `damageNPC` | So `globalVarOnKO`, `taskOnKO`, item drops, the death animation and the `NPC_KO` events all fire exactly as a fought KO does |

It returns `via: "debug-shortcut (combat not played)"` and logs as `debugKO`, distinct
from any combat action. **Report such a step as PASS (assisted), never a plain PASS.**
It verifies everything downstream of a KO and nothing about the fight. If a report
claims a hostile NPC was defeated, the log must show which way.

Note this only removes combat as a *barrier*. It does not make combat itself testable,
and a scenario whose only route past an NPC is a fight is still untested on that route
by an automated run.

### Waits are deterministic

Every wait resolves off `requestAnimationFrame` (in lockstep with Phaser's update
loop) or off an event the game emits on `window.eventDispatcher`. Timeouts exist only
as failure bounds, never as the mechanism. Waits resolve to a JSON verdict
(`{ ok: false, reason: 'timeout' }`) rather than throwing, so a client always gets an
answer across the boundary.

---

## State

### `getState(opts?) → object`

The one call an agent needs before deciding its next move.
`opts`: `{ radius, limit }` for the nearby scan (defaults: 6 tiles, 25 entries).

```
{
  ready              boolean   scene, player and rooms all loaded
  scenario           number    mission id
  activeMinigame     object|null   BRANCH ON THIS FIRST — see below
  blockingUi         object|null   DOM modal covering the canvas — see below
  missionEnd         object|null   end-of-mission credits are up — see below
  interactionMenu    object|null   tap-disambiguation menu — see below
  player             object    x, y, room, direction, isMoving, velocity,
                               hp, maxHp, isKO, interactionMode
  room               string    current room id
  nearby             array     interactables, nearest first ([] while a minigame is open)
  dialogue           object|null   lifted from the person-chat minigame
  inventory          array     { id, name, type }
  objectives         object    { aims[], activeTasks[], completedTasks[] }
  globals            object    story variables (what TESTING_WALKTHROUGH.md asserts on)
}
```

**`nearby` entries** share one shape across all three interactable kinds:

```
{ kind: 'npc'|'object'|'door', id, name, type, room, x, y,
  distance, inRange, onScreen, state: { …kind-specific } }
```

- `inRange` mirrors the game's own verdict. `INTERACTION_RANGE`,
  `DOOR_INTERACTION_RANGE` and `TILE_SIZE` are **imported from
  `utils/constants.js`, never copied** — an `inRange` that disagrees with the
  game's threshold makes the bridge claim an interaction will work when the
  click will actually just walk the player closer. Doors use the more generous
  click-path range and E/W doors measure from a half-tile-lower anchor; a KO'd
  NPC is never in range.
- `state` carries `locked`/`lockType`/`requires`/`collected` for objects,
  `locked`/`open`/`direction`/`connectedRoom` for doors, and
  `hostile`/`ko`/`hasTalked`/`influence`/`currentKnot` for NPCs.

There is no shared interactable base class in this codebase. The scan deliberately
mirrors the enumeration the game itself uses in `systems/interactions.js`
`tryInteractWithNearest()` — `room.objects`, `room.doorSprites`, `room.npcSprites`,
with the same `active`/`visible`/`interactable` filters. **If a new interactable
family is added to the game, add it in both places.**

### Other readers

| Method | Returns |
|---|---|
| `scan(radius?, limit?)` | just the nearby array |
| `isReady()` | boolean |
| `waitUntilReady(opts?)` | resolves when the scene, player and rooms exist |

---

## Two things that block the main world

Main-world actions refuse to run — returning `{ ok: false, reason }` rather than
silently doing nothing — in two situations.

### `activeMinigame`

```json
{ "id": "notes", "type": "NotesMinigame", "title": "Hospital Founding Plaque", "isActive": true }
```

`MinigameFramework.startMinigame()` sets `scene.input.keyboard.enabled = false` and
`scene.input.mouse.enabled = false`, so the engine itself has disabled main-world
input. While this is non-null, `moveTo` / `interact` / `pressKey` return
`reason: 'minigame-active'` and `nearby` is `[]` — the agent should drive
`__test.minigame` instead.

### `blockingUi`

DOM modals are *not* minigames but block pointer input just as effectively, and far
less obviously. The tutorial prompt and the session-resume prompt both sit on top of
the canvas at startup. Rather than hard-coding known modal classes, the bridge
hit-tests the centre of the canvas and reports whatever is actually on top:

```json
{
  "blocking": true, "tag": "DIV", "id": null, "classes": "tutorial-prompt-modal",
  "text": "Welcome to Hacktivity Games!\n\nWould you like to go through a quick tutorial…",
  "buttons": [ { "index": 0, "id": "tutorial-yes",  "label": "YES, SHOW ME" },
               { "index": 1, "id": "tutorial-no",   "label": "NO, I'LL FIGURE IT OUT" } ],
  "hint": "Main-world clicks land on this element, not the canvas. …"
}
```

`dismissBlockingUi(labelMatch?)` clicks one of its **real buttons**. It refuses to
guess when there is more than one button and no `labelMatch` is given, returning
`reason: 'ambiguous-blocking-ui'` with the choices — because some of these are
destructive (the session-resume overlay offers Resume / Restart / **New Session**,
and picking wrong discards a save or reloads the page mid-run).

### `missionEnd`

Non-null once the end-of-mission credits overlay is showing (a scenario whose
`conclusionScreen` is `bond_visualiser`). **This means stop playing.** It is a
terminal state, not an obstacle:

```json
{
  "creditsShowing": true,
  "closable": false,
  "creditsText": "MISSION COMPLETE\nRANSOMED TRUST\n…",
  "note": "End-of-mission credits, and the scenario disabled closing. Nothing will dismiss this and no event is coming. The run is over.",
  "hint": "Client-side end of the mission. Whether it CONCLUDED is a server fact: …"
}
```

Scenarios open it with `autoStop` (music stops, overlay stays up) and usually
`disableClose` (no × button, Esc ignored). When `closable` is false, nothing
dismisses it and no further event is coming — waiting cannot terminate. Two
playtests were lost waiting for it to clear, one of them concluding the game had
hung on blocked audio.

It also appears in `blockingUi`, whose `hint` changes to say so rather than
telling you to dismiss it.

**It does not mean the mission concluded.** That is a server fact, decided by
`check_mission_conclusion` from persisted `concludeRequires` tasks. The two can
disagree — a game can reach the credits with a task whose write was lost, and
then never conclude. When they disagree the server is right, so always confirm:

```bash
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id>
```

### `interactionMenu`

When a tap lands near several in-reach things (a memo lying next to an NPC), the game
shows a disambiguation menu and **consumes the next click** to dismiss it. An agent
that ignores this appears to lose an action for no reason.

```json
{ "open": true,
  "items": [ { "index": 0, "label": "Bernie Nwosu", "detail": "…" },
             { "index": 1, "label": "Reception Desk Visitor Log", "detail": "…" } ],
  "hint": "Choose with __test.chooseInteractionMenu(index|label)." }
```

`interact(id)` handles this for you — it detects the menu and picks the entry matching
the entity you asked for, reporting `mode: 'via-interaction-menu'`. Use
`chooseInteractionMenu(indexOrLabel)` directly only when driving raw `clickAt`.

---

## Main-world actions

| Method | Notes |
|---|---|
| `moveTo(x, y, { timeoutMs?, wait? })` | Walk to a world point. See the exception above. Returns `{ ok, via, target, arrivedAt, distanceToTarget, reachedTarget, elapsedMs }`. `ok` means the move completed; `reachedTarget` says whether it actually got there (pathfinding legitimately stops short when the exact point is unwalkable). |
| `interact(id, { approach?, timeoutMs? })` | Real click at the entity's world position, landing in the game's own pointerdown router. If out of range the game walks the player over (stopping ¾ tile short) and the bridge then clicks again. `mode` is `direct` or `approached-then-interacted`. |
| `interactNearest()` | Presses **E**; the game picks the target itself, weighted by facing direction. |
| `walk(direction, ms?, { run? })` | Raw arrow-key movement. Secondary to click-to-move — use only when a scenario needs directional input (nudging out of a corner, testing collision). |
| `pressKey(key, { holdMs? })` | Any key, held for at least one frame so `update()` observes it. |
| `clickAt(x, y)` | Raw world-coordinate click. Escape hatch. |
| `dismissBlockingUi(labelMatch?)` | See above. |
| `chooseInteractionMenu(indexOrLabel)` | Pick from the tap-disambiguation menu. |

---

## Waits

| Method | Resolves when |
|---|---|
| `waitUntil(predicate, { timeoutMs?, label? })` | predicate returns truthy, re-checked once per frame. Accepts a function or, for Playwright, a **source string** (functions can't cross the boundary). |
| `waitForGlobal(name, expected?, opts?)` | a story variable is set (or equals `expected`) |
| `waitForTask(taskId, opts?)` | an objectives task reaches `completed` |
| `waitForEvent(name, opts?)` | the game emits that event on its dispatcher |
| `waitForMovementEnd(opts?)` | the player's body is still for several consecutive frames |
| `waitForMinigame(id?, opts?)` / `waitForMinigameClosed(opts?)` | an overlay opens / closes |
| `waitForDialogue(opts?)` | the dialogue is actionable again — awaiting a choice, continuable, or closed. **Use this between dialogue advances**: person-chat types text out a character at a time, and during that gap the dialogue is neither awaiting a choice nor continuable, which a naive loop misreads as "conversation over" and stops halfway through. |
| `waitFrames(n)` | n rendered frames have passed (for settling animation) |

---

## Diagnostics

`drainLog()` returns the buffered entries **and clears them**; `peekLog(n)` reads
without clearing; `clearLog()` empties it; `note(msg, detail)` adds a marker.

The log interleaves two sources into one ordered ring buffer (500 entries):
`kind: 'action'` for what the bridge attempted and what came back, and
`kind: 'event'` for state-transition events emitted by the game. Events are captured
by wrapping `eventDispatcher.emit` transparently — it calls through to the original
and never alters arguments or return value, so instrumenting cannot change behaviour
under test. High-frequency chatter is filtered out; objectives, tasks, aims,
minigames, conversations, NPCs, items, doors, rooms, `global_variable_changed:*`,
player, game and mission events are kept.

Drain this after a failure — it usually explains it where a state snapshot alone
won't.

---

## Minigames

All 43 minigames subclass `MinigameScene` (`minigames/framework/base-minigame.js`)
and are **DOM overlays**, not Phaser scenes. So "real input" for a minigame means
dispatching real clicks and keys at the actual elements.

### The contract

Every minigame inherits `getTestState()` from the base class, which reflects the
overlay's DOM: its visible text, its clickable controls and its text fields. That
means a newly added minigame works with the bridge with no extra effort, and the
shared minimum is always available:

```
{ available, isActive, isComplete, result, title, text, controls[], fields[] }
```

Minigames whose meaningful state isn't expressible as raw DOM override it and spread
the base result. Currently overridden: **person-chat** (dialogue), **phone-chat**
(dialogue), **pin** (entered digits, attempts, lockout), **password**, **container**
(contents), **notes** (note text, pagination), **flag-station** (submitted flags,
`requiresExternalVm: true`), **lockpicking** (see below).

### Containers nest

Clicking an item in a container either pockets it (`kind: "take"`) or pockets it **and**
opens a viewer on top (`kind: "view"` — notes, text files). Closing that viewer re-opens
the container rather than returning to the overworld, via `window.pendingContainerReturn`.

Every minigame's state therefore carries `returnsToContainer`, and `close()` reports
`returnedToContainer`. Without those, a client reads the reappearing container as a
stray minigame and can loop closing the same pair forever.

`minigame.take(nameOrIndex)` handles the markup difference (`.container-content-item`
for bins and safes, `.desktop-icon` for PCs) and reports which case occurred.

### Lockpicking, and key-type locks generally

Lockpicking renders into its **own nested Phaser canvas**, so it has no DOM controls.
It is still drivable, and its `getTestState()` says how.

A key-type lock routes through this same minigame *even when the player is carrying
the correct key* (`unlock-system.js` → `startKeySelectionMinigame` → the lockpicking
scene with `keyMode: true`). So "the player has the key" is not a way to avoid it —
it is a `clickCanvas` step, not a skip.

- **Key route** (`keyMode: true`): a **single** click on the reported `keyTarget`
  runs the insertion animation, checks the key cuts, and completes the minigame by
  itself. No dragging, no precision.
  ```js
  const st = __test.minigame.getState();      // { keyMode: true, keyTarget: {x, y}, … }
  await __test.minigame.clickCanvas(st.keyTarget.x, st.keyTarget.y);
  await __test.waitForMinigameClosed();
  ```
- **Pick route** (no key): `pin-management.js` binds digits `1`-`8` to select a pin
  and space to toggle tension, so `minigame.pressKey` works — but whether a pin has
  *set* is conveyed visually only, so picking blind is impractical. Prefer a key or
  code route where the scenario offers one. Where it does not, use
  `minigame.completeLockpick()` (see "the second exception" above) and report the
  step as **PASS (assisted)**. `BLOCKED` is now only correct when the player has no
  lockpick kit, i.e. when a real player could not pick it either.

A locked door approached with **neither key nor lockpick** opens no minigame at all —
`waitForMinigame` will simply time out. That is the game refusing the interaction, not
a bridge failure; check `inventory` before concluding the lock is broken.

To add state for a new minigame, override in the subclass — this is the discoverable
hook, so future minigames follow it rather than needing a change to the bridge:

```js
getTestState() {
    return { ...super.getTestState(), attemptsLeft: this.attempts };
}
```

Rules for overrides: return plain JSON only, and never mutate game state — it is
read-only.

### Actions

`window.__test.minigame.*` acts on whichever overlay is open;
`window.__test.minigames['<id>'].*` is the same set but asserts *which* minigame it
is first, returning `{ ok: false, reason: 'not-active', expected, active }` if not.
Ids are the `MinigameFramework.registeredScenes` keys (`person-chat`, `notes`, `pin`,
`container`, `flag-station`, `lockpicking`, `title-screen`, …).

| Method | Notes |
|---|---|
| `getState()` | one call, shape above |
| `isActive()` / `which()` | |
| `clickControl(index)` | by index into `controls` |
| `clickText(text, { exact? })` | first visible control whose label contains `text` |
| `clickSelector(sel)` | scoped to the overlay |
| `type(index, text, { submit?, clear? })` | per-character keydown/input/keyup, optional Enter |
| `pressKey(key, { holdMs? })` | |
| `continue()` | dialogue: spacebar |
| `choose(n \| pattern, opts?)` | dialogue: by number, or by regex — see below |
| `chooseIndex(n)` | explicitly by 1-based on-screen number |
| `chooseMatching(pattern, { flags?, allowMultiple? })` | explicitly by regex |
| `matchDialogue(pattern, { flags? })` | assert the current speaker line, without acting |
| `completeLockpick({ reason? })` | **Documented exception** — completes a pick-mode lock without picking it. See above. |
| `take(nameOrIndex)` | Take an item from a container by name or index; clicks the real element whichever markup the container uses. Reports `openedViewer` and `returnsToContainer`. |
| `close()` | clicks the real × or presses Escape — deliberately *not* `complete()`, so a `disableClose` cutscene correctly stays open |

### Selecting dialogue choices by pattern

`choose(2)` picks the second option on screen. That is fine interactively and wrong in
a recorded trace: Ink options are conditional, so an index quietly selects a *different*
line as soon as a gated option appears above it or the writing is reordered — and the
run carries on down the wrong branch, usually still passing.

Pass a regular expression instead and the same edit becomes a loud, specific failure:

```js
__test.minigame.choose("^I'm the security consultant")
// → { ok: true, matchedPattern: "/^I'm the security consultant/i",
//     chose: "I'm the security consultant Dr. Kim called in…", number: 1 }
```

Matching is **strict in both directions**, and the failure carries the diagnosis:

```json
{ "ok": false, "reason": "choice-no-match",
  "pattern": "/^Nobody says this any more/i",
  "choices": [ "1. I'm the security consultant Dr. Kim called in. I'm here for the ransomware.",
               "2. I need Dr. Kim. Where is she?",
               "3. You've been on this desk since it started, haven't you." ],
  "hint": "The dialogue may have been rewritten. Update the pattern, or fix the Ink if the option should still exist." }
```

```json
{ "ok": false, "reason": "choice-ambiguous",
  "pattern": "/Kim/i",
  "matched": [ "1. I'm the security consultant Dr. Kim called in…", "2. I need Dr. Kim. Where is she?" ],
  "hint": "Tighten the pattern (anchor it with ^), or pass { allowMultiple: true } if taking the first is intended." }
```

Ambiguity is rejected for the same reason a miss is: after a rewrite, a pattern that
starts matching two options would otherwise pick one silently, which is precisely the
wrong-path bug the pattern form exists to prevent.

Choice text is normalised before matching — the leading `1.` label stripped, whitespace
collapsed, and curly quotes, en/em dashes and ellipses folded to ASCII. That absorbs
cosmetic churn from editors without hiding a real rewrite, which still fails.

`matchDialogue(pattern)` asserts on the NPC's line without acting, catching a rewrite
that changes what a character says while leaving the choice list intact.

**Choice tags.** `dialogue.choices[].tags` carries the Ink tags on each option. Where an
author has tagged a choice, that is the one handle that survives any rewording — but
tags are currently rare (1 of 167 choices in m02), so patterns are the practical default.

---

## VM-backed flags in testing

Flag values are answers, so the client never receives them: the server strips each
flag-station's `flags` array from room payloads and sends `flagCount` instead
(`Game#filter_requires_and_contents_recursive`). Submission is validated server-side
at `POST /games/:id/flags`. A regression test in
`test/models/break_escape/filtered_scenario_test.rb` fails if any client-facing
payload carries a `flag{...}` value again.

That leaves automated playtests unable to clear VM-backed steps. **Outside production**
the flag station also accepts positional stand-ins:

| Submitted | Meaning |
|---|---|
| `test:flag:1` | this station's **first** expected flag |
| `test:flag:2`, `test:flag:3`, … | its second, third, … |
| any real flag value | works normally, in every environment |

```json
{"cmd":"mg","action":"type","args":[0,"test:flag:1",{"submit":true}]}
```

The token is deliberately **not** `flag{1}`. SecGen flag-hint XML routinely uses
`flag{1}`, `flag{2}`, … as the *actual* flag values, so reading that form positionally
would hijack real flags — and, because a station usually owns only a subset, would
resolve `flag{1}` to a *different* real flag and submit it successfully. A passing
test, silently checking the wrong thing. `test:flag:N` cannot collide with anything.

### One trace, two environments

This is the point of the positional form. The same trace runs unchanged in both places
the game is developed:

| Environment | Where flags come from | What `test:flag:1` resolves to |
|---|---|---|
| Standalone dev, no VMs | Flag-hint XML supplied at game creation | the XML value for that station's first flag |
| Hacktivity dev, real VMs | The VM build, via `vm_context` | the real per-build flag |

Numbering follows the station's own ordered flag list — `stationId` is already sent by
the client, so `test:flag:1` means "the first flag *for the station in front of you*",
not a global index. A trace that hardcoded `flag{1}` would break the moment it ran
against a build with real opaque flags; this one does not.

**It is an alias, not a bypass.** `test:flag:N` resolves to the real flag value and then
every downstream check runs untouched — station ownership, already-submitted, scenario
validation, Hacktivity scoring, rewards, task completion. What it saves is the tester
holding the answers, not the game verifying them.

Guardrails:

- Gated solely on `!Rails.env.production?`, with no config override to get wrong.
- An out-of-range index (`test:flag:99`) is passed through unchanged and rejected as
  invalid — it never falls back to "some other flag".
- Anything not matching exactly `test:flag:<digits>` is untouched.
- Every alias use logs a warning, and the response carries `testFlagAlias: true` so a
  playtest report cannot silently claim a VM step passed on a real flag.

### Pre-flight: does this game have flags at all?

A VM-backed mission with no flags configured returns `422 Invalid flag` for *everything*,
real or aliased, and every downstream step is unreachable. Check before playing — the
same command works in both environments:

```ruby
g.send(:extract_valid_flags_from_scenario)   # must be non-empty
```

---

## Real captured output

All of the following is genuine output from a live run against
`m02_ransomed_trust`, captured with `tools/playtest/capture.js`.

### `getState()` — overworld, reception lobby

```json
{
  "ready": true,
  "scenario": 46,
  "activeMinigame": null,
  "blockingUi": null,
  "interactionMenu": null,
  "player": {
    "x": 160,
    "y": 144,
    "room": "reception_lobby",
    "direction": "down",
    "isMoving": false,
    "velocity": {
      "x": 0,
      "y": 0
    },
    "hp": 100,
    "maxHp": 100,
    "isKO": false,
    "interactionMode": "interact"
  },
  "room": "reception_lobby",
  "nearby": [
    {
      "kind": "npc",
      "id": "receptionist",
      "name": "Bernie Nwosu",
      "type": "npc",
      "room": "reception_lobby",
      "x": 192,
      "y": 129,
      "distance": 35.3,
      "inRange": false,
      "onScreen": true,
      "state": {
        "hostile": false,
        "ko": false,
        "hasTalked": false,
        "influence": null,
        "currentKnot": "start"
      }
    },
    {
      "kind": "object",
      "id": "reception_lobby_notes_1",
      "name": "Hospital Founding Plaque",
      "type": "notes",
      "room": "reception_lobby",
      "x": 169,
      "y": 74,
      "distance": 70.6,
      "inRange": false,
      "onScreen": true,
      "state": {
        "locked": null,
        "lockType": null,
        "requires": null,
        "minigame": null,
        "collected": false,
        "interactable": true
      }
    },
    {
      "kind": "object",
      "id": "reception_visitor_log",
      "name": "Reception Desk Visitor Log",
      "type": "notes",
      "room": "reception_lobby",
      "x": 136,
      "y": 73,
      "distance": 74.9,
      "inRange": false,
      "onScreen": true,
      "state": {
        "locked": null,
        "lockType": null,
        "requires": null,
        "minigame": null,
        "collected": false,
        "interactable": true
      }
    }
  ],
  "dialogue": null,
  "inventory": [
    {
      "id": "inventory_inventory_phone_1788737291447",
      "name": "Your Phone",
      "type": "phone"
    },
    {
      "id": "inventory_notepad_inventory",
      "name": "Notepad",
      "type": "notepad"
    },
    {
      "id": "inventory_inventory_lockpick_1788737291448",
      "name": "Lock Pick Kit",
      "type": "lockpick"
    }
  ],
  "objectives": {
    "aims": [
      {
        "id": "infiltrate_hospital",
        "title": "Talk Your Way In",
        "status": "active",
        "tasks": [
          {
            "id": "arrive_at_hospital",
            "title": "Arrive at St. Catherine's reception",
            "status": "completed",
            "type": "enter_room",
            "optional": false
          },
          {
            "id": "sign_in_at_reception",
            "title": "Get yourself signed in by Bernie on the night desk",
            "status": "active",
            "type": "npc_conversation",
            "optional": false
          },
          {
            "id": "meet_dr_kim",
            "title": "Find Dr. Sarah Kim, the CTO who called you in",
            "status": "active",
            "type": "npc_conversation",
            "optional": false
          },
          {
            "\u2026": "(truncated)"
          }
        ]
      },
      {
        "\u2026": "(6 more aims)"
      }
    ],
    "activeTasks": [
      "sign_in_at_reception",
      "meet_dr_kim",
      "assess_the_ward",
      "talk_to_ward_nurse",
      "open_it_department",
      "\u2026"
    ],
    "completedTasks": [
      "arrive_at_hospital"
    ]
  },
  "globals": {
    "player_name": "Agent 0x00",
    "briefing_played": true,
    "mission_started": false,
    "ransomware_deployed": true,
    "agent_0x99_contacted": false,
    "dr_kim_met": false,
    "paid_ransom": false,
    "exposed_hospital": false,
    "\u2026": "(truncated for the doc)"
  }
}
```

### `getState()` — while a minigame is active

Note `activeMinigame` is populated, `nearby` is `[]`, and the player block still
reports the last overworld position (the player is standing still behind the overlay).

```json
{
  "ready": true,
  "scenario": 46,
  "activeMinigame": {
    "id": "notes",
    "type": "NotesMinigame",
    "title": "Hospital Founding Plaque",
    "isActive": true
  },
  "blockingUi": null,
  "interactionMenu": null,
  "player": {
    "x": 179.2,
    "y": 46.2,
    "room": "reception_lobby",
    "direction": "down",
    "isMoving": false,
    "velocity": {
      "x": 0,
      "y": 0
    },
    "hp": 100,
    "maxHp": 100,
    "isKO": false,
    "interactionMode": "interact"
  },
  "room": "reception_lobby",
  "nearby": [],
  "dialogue": null,
  "inventory": [
    {
      "id": "inventory_inventory_phone_1788737291447",
      "name": "Your Phone",
      "type": "phone"
    },
    {
      "id": "inventory_notepad_inventory",
      "name": "Notepad",
      "type": "notepad"
    },
    {
      "id": "inventory_inventory_lockpick_1788737291448",
      "name": "Lock Pick Kit",
      "type": "lockpick"
    }
  ],
  "objectives": "\u2026(same shape as above)",
  "globals": "\u2026(same shape as above)"
}
```

### `__test.minigame.getState()` for that same overlay

The `controls` and `fields` arrays come from the base class; `noteName`,
`noteContent`, `observationText`, `noteIndex` and `noteCount` come from the
`NotesMinigame` override.

```json
{
  "id": "notes",
  "type": "NotesMinigame",
  "title": "Hospital Founding Plaque",
  "isActive": true,
  "available": true,
  "isComplete": false,
  "result": null,
  "text": "\u00d7\nHospital Founding Plaque\nST. CATHERINE'S REGIONAL MEDICAL CENTRE\n\nFounded 1987\n\nServing this community for over thirty-five years\nBronze plaque by the doors. Founded 1987.\nContinue\n< Previous\nNext >\n2 / 2",
  "controls": [
    {
      "index": 0,
      "label": "\u00d7",
      "id": "minigame-close",
      "classes": "minigame-close-button",
      "disabled": false
    },
    {
      "index": 1,
      "label": "",
      "id": null,
      "classes": "notes-minigame-edit-btn",
      "disabled": false
    },
    {
      "index": 2,
      "label": "Continue",
      "id": "minigame-cancel",
      "classes": "minigame-button",
      "disabled": false
    },
    {
      "index": 3,
      "label": "< Previous",
      "id": null,
      "classes": "minigame-button notes-minigame-nav-button",
      "disabled": false
    },
    {
      "index": 4,
      "label": "Next >",
      "id": null,
      "classes": "minigame-button notes-minigame-nav-button",
      "disabled": false
    }
  ],
  "fields": [
    {
      "index": 0,
      "id": null,
      "name": null,
      "type": "text",
      "placeholder": "Search notes...",
      "value": ""
    }
  ],
  "noteName": "Hospital Founding Plaque",
  "noteContent": "ST. CATHERINE'S REGIONAL MEDICAL CENTRE\n\nFounded 1987\n\nServing this community for over thirty-five years",
  "observationText": "Bronze plaque by the doors. Founded 1987.",
  "noteIndex": 1,
  "noteCount": 2
}
```

### `getState()` — mid-dialogue with an NPC

```json
{
  "activeMinigame": {
    "id": "person-chat",
    "type": "PersonChatMinigame",
    "title": "Bernie Nwosu",
    "isActive": true
  },
  "dialogue": {
    "npcId": "receptionist",
    "speaker": "Bernie Nwosu",
    "text": "And if you're press, there's a car park you can stand in.",
    "choices": [
      {
        "number": 1,
        "index": 0,
        "text": "I'm the security consultant Dr. Kim called in. I'm here for the ransomware."
      },
      {
        "number": 2,
        "index": 1,
        "text": "I need Dr. Kim. Where is she?"
      },
      {
        "number": 3,
        "index": 2,
        "text": "You've been on this desk since it started, haven't you."
      }
    ],
    "canContinue": false,
    "awaitingChoice": true,
    "ended": false
  },
  "nearby": []
}
```

### `drainLog()` — the opening of a run

```json
[
  {
    "seq": 79,
    "t": 41717,
    "kind": "event",
    "event": "item_removed_from_scene",
    "data": {
      "sprite": {
        "_gameObject": "initialize",
        "objectId": "reception_lobby_notes_1",
        "npcId": null,
        "name": "Hospital Founding Plaque"
      }
    }
  },
  {
    "seq": 80,
    "t": 41877,
    "kind": "action",
    "action": "interact",
    "detail": {
      "id": "reception_lobby_notes_1"
    },
    "result": {
      "ok": true,
      "id": "reception_lobby_notes_1",
      "mode": "approached-then-interacted",
      "entity": {
        "kind": "object",
        "id": "reception_lobby_notes_1",
        "name": "Hospital Founding Plaque",
        "type": "notes",
        "room": "reception_lobby",
        "x": 169,
        "y": 74,
        "distance": 29.6,
        "inRange": true,
        "onScreen": true,
        "state": {
          "locked": null,
          "lockType": null,
          "requires": null,
          "minigame": null,
          "collected": false,
          "interactable": true
        }
      }
    }
  },
  {
    "seq": 81,
    "t": 41950,
    "kind": "event",
    "event": "minigame_failed",
    "data": {
      "minigameName": "NotesMinigame",
      "success": false,
      "result": null
    }
  },
  {
    "seq": 82,
    "t": 41986,
    "kind": "action",
    "action": "minigame.close",
    "detail": {},
    "result": {
      "ok": true,
      "stillOpen": false
    }
  },
  {
    "seq": 83,
    "t": 43198,
    "kind": "event",
    "event": "global_variable_changed:bernie_influence",
    "data": {
      "name": "bernie_influence",
      "value": 0
    }
  },
  {
    "seq": 84,
    "t": 43199,
    "kind": "event",
    "event": "global_variable_changed:bernie_trusts_player",
    "data": {
      "name": "bernie_trusts_player",
      "value": false
    }
  },
  {
    "seq": 85,
    "t": 43199,
    "kind": "event",
    "event": "global_variable_changed:seen_picking_by_bernie",
    "data": {
      "name": "seen_picking_by_bernie",
      "value": false
    }
  },
  {
    "seq": 86,
    "t": 43199,
    "kind": "event",
    "event": "global_variable_changed:noticed_struck_booking",
    "data": {
      "name": "noticed_struck_booking",
      "value": false
    }
  },
  {
    "seq": 87,
    "t": 43200,
    "kind": "event",
    "event": "global_variable_changed:cover_burned",
    "data": {
      "name": "cover_burned",
      "value": false
    }
  },
  {
    "seq": 88,
    "t": 43201,
    "kind": "event",
    "event": "global_variable_changed:cover_restored",
    "data": {
      "name": "cover_restored",
      "value": false
    }
  },
  {
    "seq": 89,
    "t": 43202,
    "kind": "event",
    "event": "global_variable_changed:insider_identified",
    "data": {
      "name": "insider_identified",
      "value": false
    }
  },
  {
    "seq": 90,
    "t": 43202,
    "kind": "event",
    "event": "global_variable_changed:bernie_influence",
    "data": {
      "name": "bernie_influence",
      "value": 0
    }
  },
  {
    "seq": 91,
    "t": 43202,
    "kind": "event",
    "event": "global_variable_changed:bernie_trusts_player",
    "data": {
      "name": "bernie_trusts_player",
      "value": false
    }
  },
  {
    "seq": 92,
    "t": 43202,
    "kind": "event",
    "event": "global_variable_changed:seen_picking_by_bernie",
    "data": {
      "name": "seen_picking_by_bernie",
      "value": false
    }
  }
]
```

---

## Interaction range: how the engine really measures it

This section exists because getting it wrong produced two false bug reports
against a mission that works. If you change range handling in the bridge,
read this first.

### What the engine does

`getInteractionDistance()` ([interactions.js:61]) does **not** measure player
centre to object centre. It measures from a point offset in the direction the
player is **facing**:

| Facing | Offset | Magnitude |
|---|---|---|
| `up` | `(0, -32)` | 32 |
| `down` | `(0, +16)` | 16 |
| `left` / `right` | `(∓16, 0)` | 16 |
| `up-left` / `up-right` | `(∓32, -32)` | **45.3** |
| `down-left` / `down-right` | `(∓16, +16)` | 22.6 |

Both endpoints are quirky, and both are deliberate:

- The **player** sprite has the default centre origin (`add.sprite`, no
  `setOrigin` — [player.js:237]), so `player.x/y` is its centre, not its feet.
- **Object** sprites are created with `setOrigin(0, 0)` ([rooms.js:327]), so
  `sprite.x/y` is the sprite's **top-left corner**, not its centre or its base.

There is **no ground/feet offset and no elevation term in the range check at
all**. `elevation` exists ([rooms.js:415]) but feeds `updateSpriteDepth()` for
render sort order only; it never reaches `getInteractionDistance()`. Do not add
one to the bridge — the bridge's job is to agree with the engine, not to be
geometrically correct.

### The two-stage gate

Interaction is checked **twice**, by two different measures:

1. **Selection** — `tryInteractWithNearest()` ([interactions.js:1560]) and
   `gatherInteractablesNearClick()` score candidates on **plain** distance from
   player centre.
2. **Execution** — the chosen handler (`handleObjectInteraction()`, or
   `tryInteractWithNPC()` at [interactions.js:1670]) re-checks with the
   **facing-offset** distance and silently returns if it fails.

NPCs go through this same two-stage gate — an earlier version of this file
claimed they did not, and that was wrong.

So an entity can be selected as nearest and then refused. That gap is why
`getState()` reports **both** `distance` (plain) and `interactDistance`
(offset). `inRange` follows `interactDistance`, because that is the one that
decides.

### The overshoot (fixed in the engine, 2026-09-07)

For a target only a few pixels away the offset sails **past** it, so the
measured distance *grows* as the player approaches. Verified numerically:

```
standing  8px away -> refused: up-left(38.0px), up-right(38.0px), ...
standing 16px away -> refused: none
standing 24px away -> refused: none
```

Only the up-diagonals (45.3px offset) at very close range. A human rarely hits
it — they stop further out, and if refused they take a step and it works. An
automated player that walks as close as pathfinding allows hits it constantly,
from below, and it looks exactly like "the object is broken".

`getInteractionDistance()` now returns the **smaller** of the offset and plain
centre distances. The offset still extends reach in the facing direction; it can
no longer reduce it. Verified over 207,368 position/facing combinations:
**0 previously-accepted interactions now refused**, and **0 newly accepted
beyond what candidate selection already offers** — every gain is inside the
existing 32px plain radius, so nothing became reachable that wasn't already a
candidate. On the keyboard `i` path, the 150 positions that were selected and
then silently refused are now 0.

`moveToNear()` remains the right way to approach a target: the offset still
governs the extended-reach case, and pathfinding can still leave the player
short or behind a collider.

**Use `moveToNear(id)`, not `moveTo(entity.x, entity.y)`.** It searches
positions around the target, runs each through the engine's own formula, and
walks to one that passes with margin (`solveStandingPoint()` in `state.js`,
verified against 144 approach positions). `interact()` now uses it internally
instead of the old "walk 60% of the remaining gap" nudge, which made the
overshoot worse.

### Why the fix is safe

Every entry point gates candidates on the **plain** centre distance before the
offset check ever runs — `tryInteractWithNearest()` scores on plain distance,
and the click paths call `isObjectInInteractionRange()`
([interactions.js:1696]), which is plain distance too. Taking the minimum makes
the second check a superset of the first, so the two can no longer contradict
each other. Same candidate set, minus the silent refusals.

---

## Three things that read as bridge bugs and are not

**An unlocked door's object can vanish from `scanNearby()` entirely.** It does
not merely flip to `locked: false` — once a door is unlocked there may be
nothing left to interact with, so it stops being reported at any radius. If a
door you just unlocked has disappeared, that is success. Walk through where it
was.

**The flag station needs a real click on `SUBMIT`.** `type()` populates the
field but does not submit, even with `{submit: true}` — `submittedFlags` stays
empty until `clickControl` fires on the button:

```json
{"cmd":"mg","action":"type","args":["test:flag:1"]}
{"cmd":"mg","action":"clickControl","args":["SUBMIT"]}
```

**A key-type lock reports `keySelection: null` for a beat.** The minigame opens
with `keyMode: true` before the key-selection screen has rendered. Wait for it
rather than reading it immediately, and never reach into the Phaser scene tree
to work around it:

```json
{"cmd":"waitFor","for":"condition","fn":"() => window.__test.minigame.getState()?.keySelection != null"}
```
