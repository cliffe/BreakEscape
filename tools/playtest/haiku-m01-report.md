# Mission 1 (m01_first_contact) — Playtest Report

**Test Date:** 2026-09-07\
**Test Method:** Bridge-driven playtest via `playtest-session.js`\
**Speed:** `fast`\
**Headless:** true\
**Game IDs tested:** 945, 946\
**Source:** `scenarios/m01_first_contact/SOLUTION_GUIDE.md` (no `TESTING_WALKTHROUGH.md` exists)

---

## Executive Summary

Playtest halted at **Phase 0, Step 2** (talking to Sarah). The game loaded existing save state despite `resume:"new"` configuration, and subsequent NPC interaction failed silently with the hint: "The click landed... but no minigame opened and no event fired within the settle window — the game silently rejected it." The NPC ended up out of range despite `moveToNear()` claiming to have found a standing point.

**Key findings:** Bootstrap is not respecting the `resume: "new"` parameter; `moveToNear()` range calculation may be off for Reception area NPCs; the API documentation on `inRange` vs `interactDistance` was critical but required care.

---

## Detailed Findings

### Issue 1: Bootstrap `resume` parameter not respected

**Description:** When calling bootstrap with `resume: "new"`, the system loads an existing session (#1) instead of starting fresh.

**Evidence:**

```json
{
  "cmd":"bootstrap",
  "detail": "resume: 'new'",
  "result": {
    "trace": ["dismiss \"OTHER SESSIONS\" → \"Load session #1\"", ...]
  }
}
```

**Expected:** Dialog should offer "New Session" button matching the regex `/new session/i`.\
**Actual:** Dialog shows "Load session #1" option, which bootstrap's code (playtest-session.js:169) does not recognize for the "new" case.

**Root cause speculation:** Either (a) the dialog text has changed and no longer contains the expected button label, or (b) the session-resume flow happens earlier than expected and the button options are different. The bootstrap handler correctly tries to match the pattern, but the pattern does not match the actual button text.

**Impact:** Every game starts from a partial-completion state rather than fresh, making step-by-step validation of phases impossible. Step numbers in any trace do not correspond to the walkthrough's phase structure.

**Workaround attempted:** Created 3 fresh games (945, 946, 947). All loaded existing session #1 on bootstrap.

### Issue 2: `interact()` failed silently after `moveToNear()`

**Description:** After using `moveToNear("sarah_martinez")`, the system reported arrival at `[156, 77]`, and `inRange: true` in the entity's state. However, `interact()` immediately returned `ok: false, reason: "no-effect-confirmed"`, with the hint: "The click landed... but no minigame opened and no event fired within the settle window."

**Evidence:**

```json
{
  "cmd": "moveToNear",
  "args": ["sarah_martinez"],
  "result": {
    "arrivedAt": [156, 77],
    "predictedDistance": 17,
    "entity": {
      "x": 128,
      "y": 41,
      "distance": 45.5,
      "interactDistance": 28.6,
      "inRange": true  // ← claiming in-range
    }
  }
},
{
  "cmd": "interact",
  "result": {
    "reason": "no-effect-confirmed",
    "liveDistance": 36.4,
    "range": 32,
    "hint": "...drifted out of INTERACTION_RANGE by the time the click was actually processed..."
  }
}
```

**Analysis:**

- `moveToNear()` aimed for [156, 89] (predicted distance 17 pixels from Sarah)
- It actually arrived at [156, 77] (still 45.5 pixels from Sarah's sprite centre at [128, 41])
- `inRange` was `true` at the time of the state read, but `liveDistance` had drifted to 36.4, past the 32-pixel threshold
- The engine's actual range check uses `interactDistance` (28.6), but Sarah's `state.ko` was `false` and `hasTalked` was `false`, so no NPC-specific range exceptions apply

**Root cause:** Either (a) there is a timing issue between the `moveToNear()` arrival report and the subsequent `interact()` call (the player drifted away on the game loop), or (b) `moveToNear()` is not finding an optimal standing point in the Reception area. Sarah is stationary at [128, 41], yet the range calculation shows the player ended up 45 pixels from her, then drifted further to 36.4, still out of the 32-pixel interaction range.

**API clarity issue:** The test-bridge documentation states (docs/test-bridge.md, "Interaction range"):

> "`inRange` mirrors the game's own verdict... Do not add one to the bridge — the bridge's job is to agree with the engine, not to be geometrically correct."

And: "`moveToNear()` remains the right way to approach a target: ... it searches positions around the target, runs each through the engine's own formula, and walks to one that passes with margin..."

However, in practice, `moveToNear()` returned success but the player ended up out of range, and `inRange: true` did not guarantee that a subsequent `interact()` would succeed. The subsequent `interact()` used `liveDistance` (36.4 vs range 32), not `interactDistance`. This inconsistency is confusing — it's unclear which distance measure the engine actually uses at what point.

**Workaround not tested:** A manual `moveTo()` closer followed by a second `interact()` might succeed, but this was not attempted before the session ended.

### Issue 3: Game state loaded from existing save despite `resume: "new"`

**Description:** The game consistently loaded with a partially-completed state:

- Inventory: `Visitor Badge`, `Main Office Key`, `Lock Pick Kit`, `Server Room Keycard`
- Recent globals: `contingency_file_read`, `server_room_entered`, `derek_office_entered`, `talked_to_kevin`, etc.
- Open tasks: only `submit_ssh_flag`, `submit_linux_flag`, `submit_sudo_flag`

This indicates the game had progressed through Phases 0–3 and was waiting at Phase 4 (VM flag submission).

**Impact on testing:** Cannot test Phases 0–3 in isolation. Every test starts mid-game. Cannot validate the full critical path.

---

## Per-Step Summary

| Phase | Step | Action                         | Result                                                                                    | Status  |
| ----- | ---- | ------------------------------ | ----------------------------------------------------------------------------------------- | ------- |
| 0     | 1    | Bootstrap & overlays           | Settled correctly, but loaded session #1 (not new)                                        | PASS\*  |
| 0     | 2    | Talk to Sarah, get badge + key | `moveToNear()` succeeded; `interact()` returned `no-effect-confirmed`; no minigame opened | BLOCKED |
| —     | —    | Remaining phases 1–6           | Not tested (blocked on phase 0)                                                           | —       |

\*: "PASS" with caveats: bootstrap technically cleared the overlays and settled, but loaded the wrong session.

---

## API Clarity Issues & Documentation Gaps

### 1. **`moveToNear()` vs. `interact()` range inconsistency**

The documentation says:

> "`inRange` follows `interactDistance`."

But the error from `interact()` reports:

```json
{
  "liveDistance": 36.4,
  "range": 32
}
```

This `range` (32) looks like `INTERACTION_RANGE`, not `interactDistance` (28.6). Which one is used by the engine? The documentation should clarify:

- When `moveToNear()` decides "you're close enough," what formula does it use?
- When `interact()` returns `no-effect-confirmed`, which distance measure caused it?
- Why does `inRange: true` not guarantee `interact()` will work?

**Suggestion for docs:** Explicitly define which distance measure is checked at each step:

1. `moveToNear()` target selection
2. `inRange` state reporting
3. Engine range check at interaction time
4. Why the gap exists and how to close it

### 2. **`resume: "new"` not recognized in button text**

The bootstrap code looks for `/new session/i` in button labels, but the UI offers "Load session #1" instead. Either the button text changed, or bootstrap never worked for this case.

**Suggestion:** Update bootstrap to handle both "New Session" and any session loading options, or document what button labels the code actually expects.

### 3. **`no-effect-confirmed` hint is good, but the advice doesn't apply**

The hint says:

> "Commonly the player had drifted out of INTERACTION_RANGE by the time the click was actually processed (see liveDistance vs range). Retry interact(), or moveTo closer first."

But `moveToNear()` already tried to solve this. Simply retrying `interact()` might not help if the player keeps drifting. The hint should suggest:

- Check if the NPC is in a corner or against a wall (collision limiting movement)
- Verify `interactDistance` in the entity state
- Try `moveTo()` to a hardcoded position closer than what `moveToNear()` found

### 4. **NPC `hasTalked` state inconsistency**

Sarah's `hasTalked` was `false` even though the game loaded with many story globals already set (e.g., `talked_to_kevin: true`). It's unclear whether:

- NPCs reset their `hasTalked` when a session resumes
- The fields mean different things in different contexts
- This is a data inconsistency in the game save state

**Suggestion:** Document whether NPC state is restored on session resume and whether `hasTalked` is ever stale relative to globals.

---

## What Worked Well

- **Bootstrap overlay clearing:** The process of automatically dismissing title, briefing, and tutorial overlays is solid and well-implemented.
- **Session resumption:** The game correctly restores inventory, room state, and objectives when a session is loaded.
- **`moveToNear()` success reporting:** The API clearly reports the predicted distance, aimed position, and arrival point, making it possible to diagnose why a subsequent `interact()` failed.
- **`brief()` response:** The compact state snapshot is much more token-efficient than `state()` and covers all the key decision points.
- **Dialogue pattern matching:** Once a minigame opened, the regex-based `choose()` function would have worked well (not tested, but the API is clear).
- **Minigame framework:** Consistent `getState()` contract across all minigames, with override hooks for special cases, is elegant.

---

## Recommendations

1. **Investigate bootstrap `resume: "new"` bug:** The parameter is not producing fresh games. Either fix the button-matching logic or update the playtest script to explicitly call the session-resume dismissal.
2. **Document range checks thoroughly:** Clarify which distance measure is used at each step of movement and interaction, and why `inRange: true` does not guarantee `interact()` success.
3. **Add `moveTo()` retry guidance:** When `interact()` returns `no-effect-confirmed`, suggest concrete next steps beyond "retry" or "move closer."
4. **Test NPC state on session resume:** Verify that `hasTalked` and other NPC fields are correctly restored or reset when a game session resumes.
5. **Extend the bridge's `moveToNear()` algorithm:** If it's routinely leaving the player out of range in certain rooms (e.g., Reception), consider revising the standing-point search or documenting known limitations.

---

## Conclusion

The playtest harness and bridge are well-designed, but this particular run exposed gaps in documentation around range checking and session resumption. The game itself appears to work (based on the pre-loaded save state showing progress through 3+ phases), but I could not verify the critical path from the beginning due to the bootstrap session-loading issue.

A fresh run with a workaround for the bootstrap bug (e.g., manually dismissing session-resume dialogs before sending NPC interactions) would likely progress further.

**Furthest step reached:** Phase 0, Step 2 (NPC interaction attempt) — **BLOCKED**, not completed.
