# MG-05 Ransomware Impact Display — Phased Implementation Plan

This plan follows the confirmed decisions:

- Trigger path: add `lockType: "ransomware_display"` routing in unlock system.
- Completion semantics: use success/failure distinction (`REPORT TO NCSC` and `BEGIN RECOVERY PROCESS` are success; `CONTACT ATTACKERS` is failure).
- Timer source of truth: scenario-relative 72-hour countdown.
- Global variable writes: follow the design-guide contract (`window.npcManager.setGlobalVariable(...)`) with a compatibility fallback to the current runtime pattern (`window.gameState.globalVariables` write + `broadcastGlobalVariableChange` + `global_variable_changed:*` emit).
- Canonical action variables: `contact_attackers`, `ncsc_notified`, `recovery_started`.

---

## Phase 1 — Stub (confirm wiring)

Goal: deliver a working, openable MG-05 minigame with lock routing, registration, and verified global-variable writes through the project-compatible global-state pathway, without visual polish.

### A. Trigger mechanism

- Primary trigger is object interaction through lock routing, not ad hoc console-only calls.
- In scenario object data, the workstation object remains `locked: true` with `lockType: "ransomware_display"`.
- On interaction, `handleUnlock(...)` in unlock system routes `ransomware_display` to a new starter helper.
- New starter helper function name: `startRansomwareDisplayMinigame(lockable, type, options = {})`.
- Starter validates gate condition at minigame start:
  - Read `window.gameState?.globalVariables?.ransomware_deployed`.
  - If false, show normal locked/info response and do not launch MG-05.
  - If true, launch MG-05 via `window.MinigameFramework.startMinigame('ransomware-display', ...)`.
- For rapid wiring test and parity with your requirement, helper is exported to `window.startRansomwareDisplayMinigame` so console launch remains available.

### B. File structure (Phase 1)

Create/modify only what is needed for routing + stub UI + global state writes:

1. `public/break_escape/js/systems/npc-manager.js` (optional compatibility step)

- If `window.npcManager.setGlobalVariable` is not available at runtime, add it as a thin wrapper over the established write pattern:
  - Ensures `window.gameState.globalVariables` exists.
  - Captures `oldValue`.
  - Writes new value.
  - Calls `window.npcConversationStateManager.broadcastGlobalVariableChange(...)` when available.
  - Emits `global_variable_changed:${varName}` through `window.eventDispatcher`.
  - Returns `{ varName, oldValue, value }` for traceability.
- If it is already provided by runtime context, reuse it and avoid duplicating logic.

2. `public/break_escape/js/minigames/ransomware-display/ransomware-display-minigame.js` (new)

- New `RansomwareDisplayMinigame` class extending `MinigameScene`.
- Phase-1 placeholder panel plus three action buttons and minimal state reflection.

3. `public/break_escape/js/systems/minigame-starters.js`

- Add `startRansomwareDisplayMinigame(...)` helper.
- Export and attach to `window.startRansomwareDisplayMinigame`.

4. `public/break_escape/js/systems/unlock-system.js`

- Add `case 'ransomware_display':` in lockType switch.
- Delegate to starter helper.
- Maintain existing unlock system behavior for all other lock types.

5. `public/break_escape/js/minigames/index.js`

- Import and register scene key `ransomware-display`.
- Optionally expose starter import if this file remains global helper hub.

6. `scenarios/*.json` or `scenarios/*.json.erb` (scenario-specific, where workstation is defined)

- Ensure the target workstation object uses `lockType: "ransomware_display"` and locked interaction path.
- Confirm `ransomware_deployed` is true in scenario initial globals.

### C. Class skeleton (Phase 1)

`RansomwareDisplayMinigame extends MinigameScene`

- `constructor(container, params)`
  - Set defaults: title, close/cancel behavior, optional workstation metadata.
  - Initialize local fields for button state reflection and timer placeholders.

- `init()`
  - Call `super.init()`.
  - Immediately read globals:
    - `ransomware_deployed`
    - `contact_attackers`
    - `ncsc_notified`
    - `recovery_started`
  - If `ransomware_deployed !== true`, show unavailable message and keep close path active.
  - Render placeholder ransomware panel and three labeled buttons:
    - `[CONTACT ATTACKERS]`
    - `[REPORT TO NCSC]`
    - `[BEGIN RECOVERY PROCESS]`
  - Render stub state banner if one of the action flags is already true.

- `start()`
  - Call `super.start()`.
  - Wire button handlers using `this.addEventListener(...)` only.
  - Each handler writes exactly one canonical global variable via a small helper (`setGlobalAndNotify`) that:
    - Uses `window.npcManager.setGlobalVariable(...)` when available.
    - Falls back to direct write + `broadcastGlobalVariableChange` + `global_variable_changed:*` emit when unavailable.
  - Then calls `this.complete(success)` with chosen semantics.

- Button handlers
  - `handleContactAttackers()`:
    - write `contact_attackers = true`
    - call `this.complete(false)`
  - `handleReportToNCSC()`:
    - write `ncsc_notified = true`
    - call `this.complete(true)`
  - `handleBeginRecovery()`:
    - write `recovery_started = true`
    - call `this.complete(true)`

- `cleanup()`
  - Use base cleanup via `super.cleanup()`; no unmanaged listeners.

### D. Global variable behaviour (Phase 1)

All writes route through one helper path that prefers `window.npcManager.setGlobalVariable(...)` and otherwise applies the existing runtime pattern (direct write + broadcast + emit).

1. Trigger: press `[CONTACT ATTACKERS]`

- Call: `setGlobalAndNotify('contact_attackers', true)`
- Expected downstream reactions:
  - NPC `eventMappings` listening for `global_variable_changed:contact_attackers`
  - Command Board / timeline listeners consuming global-variable-change events
  - Any objective/task systems keyed off that variable

2. Trigger: press `[REPORT TO NCSC]`

- Call: `setGlobalAndNotify('ncsc_notified', true)`
- Expected downstream reactions:
  - NPC acknowledgement dialogue branches about notification status
  - Command Board timeline entry and status updates
  - Debrief logic checking whether authorities were notified

3. Trigger: press `[BEGIN RECOVERY PROCESS]`

- Call: `setGlobalAndNotify('recovery_started', true)`
- Expected downstream reactions:
  - Recovery-focused NPC branches
  - Incident board progression markers
  - Any scenario logic waiting on recovery-start gate

Note: Phase 1 should keep writes idempotent (setting true again is harmless). Re-open behavior reads globals, not local component memory.

### E. Stub acceptance criteria (Phase 1)

- `window.startRansomwareDisplayMinigame({})` opens the minigame.
- Interacting with workstation configured as `lockType: "ransomware_display"` opens the minigame through unlock routing.
- Minigame refuses to launch full path when `ransomware_deployed !== true`.
- Pressing each button writes the correct global variable and notifies dependent systems through the same compatibility helper path.
- Pressing each button closes the minigame via `this.complete(success)` with defined semantics.
- Escape and close behavior work (openable/closable repeatedly).
- Re-open reflects previously chosen state from globals (e.g., status line or selected action indicator).

---

## Phase 2 — Full implementation

Goal: keep Phase-1 wiring unchanged and layer the complete visual/behavioral spec from Section 5 of `game_design/minigame_planning.md`.

### F. Timer implementation

- Source of truth is scenario-relative and persistent across close/re-open cycles.
- Use scenario start as the baseline, not minigame-open time.
- Preferred model:
  - Read scenario start timestamp from global state (`window.gameState.startTime` if present, or a scenario-level equivalent).
  - Compute and persist `ransomware_deadline_at = scenarioStart + 72h` once via the compatibility helper path.
  - If `ransomware_deadline_at` already exists, never overwrite it on re-open.
- Minigame display loop:
  - Use `setInterval` (1s tick) scoped to scene instance.
  - Compute `remaining = max(0, deadlineAt - Date.now())`.
  - Format `HH:MM:SS` and render.
- Close/re-open behavior:
  - No reset; timer recomputes from persisted deadline global.
- On timer expiry:
  - Display changes to explicit elapsed/expired state (e.g., `TIME EXPIRED`).
  - Optional visual escalation (color/flash) only.
  - Minigame remains openable and functional; scenario does not auto-end.

### G. Visual implementation

Implement all named elements from Section 5 of `game_design/minigame_planning.md`:

1. Background

- Full black canvas with faint repeating pixel-art padlock tile pattern (~10% opacity).

2. Central panel

- Dark red (`#3d0000`) pixel-art bordered panel centered on screen.

3. Skull icon

- Pixel-art skull-over-padlock motif near top center (stub icon acceptable initially, replace with final asset later).

4. Title text

- `YOUR FILES HAVE BEEN ENCRYPTED` in large red pixel font styling.

5. Body text block

- White monospace/pixel-style ransom content including organization, encrypted asset count, demand, wallet, warning.

6. Countdown timer

- Prominent amber `TIME REMAINING: HH:MM:SS` element, ticking every second.

7. Action buttons

- Three equal-width pixel-art buttons along panel bottom:
  - CONTACT ATTACKERS with skull icon
  - REPORT TO NCSC with shield icon
  - BEGIN RECOVERY PROCESS with wrench icon

Styling approach:

- Use a dedicated stylesheet for this minigame for maintainability and to avoid leaking styles.
- Keep class names namespaced (`.ransomware-display-*`).
- Preserve project pixel-art conventions (sharp corners, 2px borders where appropriate).

### H. Re-open state reflection

On every `init()`, read globals and reflect prior action state in UI.

Globals read:

- `contact_attackers`
- `ncsc_notified`
- `recovery_started`
- `ransomware_deployed`
- timer globals (`ransomware_deadline_at` or equivalent)

Reflection behavior:

- If one action already taken:
  - Highlight corresponding button as selected/committed.
  - Show confirmation note (e.g., "Action already logged: Reported to NCSC").
  - Keep minigame closable and readable.
- If multiple action flags are true (edge case):
  - Show deterministic priority/status summary (or list all true actions) and log warning for content authors.
- Ensure re-open never depends on volatile instance state.

### I. Risks and open questions

1. API availability mismatch risk (`npcManager.setGlobalVariable`)

- Design docs require `setGlobalVariable`, but many runtime minigames currently use direct-write plus broadcast plus emit.
- Mitigation: implement one local compatibility helper in MG-05 and add `npcManager.setGlobalVariable` only if runtime does not already provide it.

2. Scenario schema alignment risk

- Requires workstation object actually routes through lockable unlock path.
- Mitigation: validate one concrete scenario object end-to-end in Phase 1 acceptance.

3. Timer persistence ambiguity across save/load boundaries

- This plan assumes globals persist through existing state sync behavior.
- If save/load truncates timestamps, Phase 2 must add migration/default logic.

4. Success/failure semantics interpretation

- `CONTACT ATTACKERS` as failure may influence generic `minigame_failed` listeners unexpectedly.
- Mitigation: document this as intentional narrative semantics in implementation notes.

5. Multi-action UX ambiguity

- Spec implies a single decision, but globals permit multiple true flags over time.
- Mitigation: lock buttons after first action unless design intentionally supports repeated decisions.

6. Asset availability risk

- Pixel icons (skull/shield/wrench/skull-padlock) may not exist yet.
- Mitigation: ship temporary placeholders in Phase 2a, then replace with final art assets.

---

## Constraint compliance summary (both phases)

- Extends `MinigameScene`.
- Registers scene in minigame index.
- Uses a single global-write abstraction that preserves both design-guide semantics and current runtime behavior (prefer `window.npcManager.setGlobalVariable()`, fallback to direct-write + broadcast + emit).
- Uses `this.addEventListener()` for minigame listener wiring.
- Uses `lockType: "ransomware_display"` only because unlock-system support is explicitly added.
- Reads `ransomware_deployed` in `init()`.
- Calls `this.complete(success)` on every action button path.
- Supports open/close/re-open with global-state-based reflection.
